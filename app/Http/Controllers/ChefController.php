<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ChefController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $stats = [
            'menunggu' => DB::table('tbl_transaksi')->where('tipe_pesanan', '!=', 'kasir_pos')->where('status_pesanan', 'menunggu_chef')->count(),
            'dimasak' => DB::table('tbl_transaksi')->where('tipe_pesanan', '!=', 'kasir_pos')->where('status_pesanan', 'dimasak')->count(),
            'siap_kasir' => DB::table('tbl_transaksi')->where('tipe_pesanan', '!=', 'kasir_pos')->where('status_pesanan', 'siap_kasir')->count(),
            'selesai_hari_ini' => DB::table('tbl_transaksi')
                ->where('tipe_pesanan', '!=', 'kasir_pos')
                ->whereDate('tanggal', now()->toDateString())
                ->where('status_pesanan', 'selesai')
                ->count(),
        ];

        $rawOrders = DB::table('tbl_transaksi as t')
            ->join('tbl_pelanggan as p', 't.id_pelanggan', '=', 'p.id_pelanggan')
            ->where('t.tipe_pesanan', '!=', 'kasir_pos')
            ->whereIn('t.status_pesanan', ['menunggu_chef', 'dimasak', 'siap_kasir', 'selesai'])
            ->select([
                't.id_transaksi',
                't.tanggal',
                't.total_belanja',
                't.status_pesanan',
                't.tipe_pesanan',
                't.catatan',
                'p.nama_pelanggan',
                'p.kota',
            ])
            ->orderByRaw("FIELD(t.status_pesanan, 'menunggu_chef', 'dimasak', 'siap_kasir', 'selesai')")
            ->orderByDesc('t.tanggal')
            ->orderByDesc('t.id_transaksi')
            ->limit(30)
            ->get();

        $txIds = $rawOrders->pluck('id_transaksi')->toArray();
        $details = [];

        if (! empty($txIds)) {
            $rawDetails = DB::table('tbl_detail_transaksi')
                ->whereIn('id_transaksi', $txIds)
                ->get();

            foreach ($rawDetails as $d) {
                $details[$d->id_transaksi][] = [
                    'nama_produk' => $d->nama_produk,
                    'jumlah' => (int) $d->jumlah,
                    'harga' => (float) $d->harga,
                ];
            }
        }

        $orders = $rawOrders->map(function ($order) use ($details) {
            $items = $details[$order->id_transaksi] ?? [];

            return [
                'id_transaksi' => (int) $order->id_transaksi,
                'tanggal' => $order->tanggal,
                'nama_pelanggan' => $order->nama_pelanggan,
                'kota' => $order->kota,
                'status_pesanan' => $order->status_pesanan,
                'tipe_pesanan' => $order->tipe_pesanan ?? 'delivery',
                'catatan' => $order->catatan,
                'total_belanja' => (float) $order->total_belanja,
                'items' => $items,
                'total_items' => array_sum(array_column($items, 'jumlah')),
            ];
        })->all();

        return Inertia::render('Chef/Dashboard', [
            'username' => $request->session()->get('user_username', 'Chef'),
            'activePage' => 'chef-dashboard',
            'stats' => $stats,
            'orders' => $orders,
        ]);
    }

    /**
     * Update order status by Chef (menunggu_chef -> dimasak -> siap_kasir)
     */
    public function updateOrderStatus(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'status_pesanan' => 'required|in:dimasak,siap_kasir',
        ]);

        $order = DB::table('tbl_transaksi')->where('id_transaksi', $id)->first();
        if (! $order) {
            return redirect()->back()->with('error', "Pesanan #{$id} tidak ditemukan.");
        }

        $nextStatus = $validated['status_pesanan'];
        $allowed = [
            'menunggu_chef' => 'dimasak',
            'dimasak' => 'siap_kasir',
        ];

        if (($allowed[$order->status_pesanan] ?? null) !== $nextStatus) {
            return redirect()->back()->with('error', "Transisi status pesanan #{$id} tidak valid.");
        }

        $chefName = $request->session()->get('user_username', 'Chef');

        DB::table('tbl_transaksi')
            ->where('id_transaksi', $id)
            ->update([
                'status_pesanan' => $nextStatus,
            ]);

        $logText = $nextStatus === 'dimasak'
            ? "Chef ({$chefName}) mulai memasak Pesanan #{$id}"
            : "Chef ({$chefName}) menyelesaikan masakan Pesanan #{$id} & mengembalikan ke Kasir";

        DB::table('tbl_log')->insert([
            'aktivitas' => $logText,
            'waktu' => now(),
        ]);

        $msg = $nextStatus === 'dimasak'
            ? "Pesanan #{$id} sedang dimasak!"
            : "Pesanan #{$id} selesai dimasak dan dikembalikan ke Kasir!";

        return redirect()->back()->with('success', $msg);
    }
}
