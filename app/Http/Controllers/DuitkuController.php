<?php

namespace App\Http\Controllers;

use App\Services\DuitkuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class DuitkuController extends Controller
{
    public function __construct(
        protected DuitkuService $duitkuService
    ) {}

    /**
     * Handle webhook callback from Duitku.
     */
    public function callback(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('Duitku callback received', $payload);

        $result = $this->duitkuService->validateCallback($payload);

        if (! $result['valid']) {
            Log::warning('Duitku callback invalid', ['error' => $result['message'], 'payload' => $payload]);

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Invalid callback signature',
            ], 400);
        }

        $orderId = $result['order_id'] ?? '';
        $reference = $result['reference'] ?? '';
        $isSuccess = $result['is_success'];

        // Determine if it is a food order transaction
        if (str_starts_with($orderId, 'GM-')) {
            $parts = explode('-', $orderId);
            $transaksiId = isset($parts[1]) ? (int) $parts[1] : 0;

            if ($transaksiId > 0) {
                $transaksi = DB::table('tbl_transaksi')->where('id_transaksi', $transaksiId)->first();

                if ($transaksi) {
                    $newStatus = $isSuccess ? 'paid' : 'failed';
                    $orderStatus = $isSuccess && $transaksi->tipe_pesanan !== 'kasir_pos'
                        ? 'menunggu_chef'
                        : $transaksi->status_pesanan;

                    DB::table('tbl_transaksi')
                        ->where('id_transaksi', $transaksiId)
                        ->update([
                            'payment_status' => $newStatus,
                            'payment_reference' => $reference,
                            'status_pesanan' => $orderStatus,
                        ]);

                    $statusLabel = $isSuccess ? 'BERHASIL' : 'GAGAL/DIBATALKAN';
                    DB::table('tbl_log')->insert([
                        'aktivitas' => "Callback Duitku: Pembayaran Pesanan #{$transaksiId} {$statusLabel} (Ref: {$reference})",
                        'waktu' => now(),
                    ]);
                }
            }
        } elseif (str_starts_with($orderId, 'TOPUP-')) {
            $parts = explode('-', $orderId);
            $pelangganId = isset($parts[1]) ? (int) $parts[1] : 0;
            $amount = $result['amount'] ?? 0;

            $statusLabel = $isSuccess ? 'BERHASIL' : 'GAGAL';
            DB::table('tbl_log')->insert([
                'aktivitas' => "Callback Duitku: Top Up Saldo Pelanggan #{$pelangganId} Rp ".number_format($amount, 0, ',', '.')." {$statusLabel} (Ref: {$reference})",
                'waktu' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Callback processed successfully',
        ]);
    }

    /**
     * User return redirect from Duitku payment page.
     */
    public function returnPage(Request $request): RedirectResponse
    {
        $orderId = (string) $request->query('merchantOrderId');
        $resultCode = (string) $request->query('resultCode');

        if (str_starts_with($orderId, 'GM-')) {
            $parts = explode('-', $orderId);
            $transaksiId = isset($parts[1]) ? (int) $parts[1] : 0;

            if ($transaksiId > 0) {
                $tx = DB::table('tbl_transaksi')->where('id_transaksi', $transaksiId)->first();
                if ($tx && $tx->tipe_pesanan === 'kasir_pos') {
                    if ($resultCode === '00' && $tx->payment_status === 'paid') {
                        return redirect(URL::temporarySignedRoute('admin.transaksi', now()->addMinutes(10)))
                            ->with('success', "Pembayaran Duitku untuk transaksi #{$transaksiId} berhasil!")
                            ->with('receipt', $this->buildPosReceipt($transaksiId));
                    }

                    return redirect(URL::temporarySignedRoute('admin.transaksi', now()->addMinutes(10)))
                        ->with('error', "Pembayaran Duitku untuk transaksi #{$transaksiId} belum selesai atau dibatalkan.");
                }
            }
        }

        if ($resultCode === '00') {
            return redirect()->route('pelanggan.history')->with('success', 'Pembayaran via Duitku berhasil! Pesanan Anda sedang diproses.');
        }

        return redirect()->route('pelanggan.history')->with('error', 'Pembayaran via Duitku belum selesai atau dibatalkan.');
    }

    /**
     * Build POS receipt using same payload shape as cash checkout.
     *
     * @return array<string, mixed>
     */
    private function buildPosReceipt(int $transaksiId): array
    {
        $transaction = DB::table('tbl_transaksi as t')
            ->join('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->leftJoin('tbl_users as u', 't.id_user', '=', 'u.id_user')
            ->where('t.id_transaksi', $transaksiId)
            ->select('t.*', 'p.nama_pelanggan', 'p.kota', 'u.username as kasir')
            ->first();

        abort_if(! $transaction || $transaction->payment_status !== 'paid', 409, 'Pembayaran belum dikonfirmasi Duitku.');

        $items = DB::table('tbl_detail_transaksi')
            ->where('id_transaksi', $transaksiId)
            ->get();

        return [
            'id_transaksi' => $transaksiId,
            'tanggal' => now()->format('d/m/Y H:i'),
            'kasir' => $transaction->kasir ?? 'Kasir',
            'pelanggan' => [
                'id_pelanggan' => $transaction->id_pelanggan,
                'nama_pelanggan' => $transaction->nama_pelanggan,
                'kota' => $transaction->kota ?? '-',
            ],
            'items' => $items->map(fn ($item) => [
                'nama_produk' => $item->nama_produk,
                'jumlah' => $item->jumlah,
                'harga' => (float) $item->harga,
                'subtotal' => round((float) $item->harga * $item->jumlah, 2),
            ])->all(),
            'subtotal' => (float) $transaction->total_belanja,
            'diskon_persen' => 0,
            'potongan' => 0,
            'total' => (float) $transaction->total_belanja,
            'metode_pembayaran' => $transaction->metode_pembayaran,
            'nominal_bayar' => (float) $transaction->total_belanja,
            'kembalian' => 0,
        ];
    }
}
