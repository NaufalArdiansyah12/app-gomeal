<?php

namespace Tests\Feature;

use App\Models\Pelanggan;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PelangganPanelTest extends TestCase
{
    private User $pelangganUser;

    private Pelanggan $pelanggan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pelanggan = Pelanggan::firstOrCreate(
            ['nama_pelanggan' => 'Test Pelanggan Panel'],
            ['kota' => 'Surabaya']
        );

        $this->pelangganUser = User::firstOrCreate(
            ['username' => 'test_pelanggan_panel'],
            [
                'password' => Hash::make('password'),
                'role' => 'pelanggan',
                'id_pelanggan' => $this->pelanggan->id_pelanggan,
            ]
        );
    }

    private function actingAsPelanggan()
    {
        return $this->withSession([
            'user_id' => $this->pelangganUser->id_user,
            'user_role' => 'pelanggan',
            'user_username' => $this->pelangganUser->username,
            'pelanggan_id' => $this->pelanggan->id_pelanggan,
            'pelanggan_nama' => $this->pelanggan->nama_pelanggan,
            'gomeal_balance' => 500000.0,
        ]);
    }

    public function test_pelanggan_can_access_dashboard(): void
    {
        $response = $this->actingAsPelanggan()->get('/pelanggan/dashboard');
        $response->assertStatus(200);
    }

    public function test_pelanggan_can_access_delivery_page(): void
    {
        $response = $this->actingAsPelanggan()->get('/pelanggan/delivery');
        $response->assertStatus(200);
    }

    public function test_pelanggan_can_access_dine_in_page(): void
    {
        $response = $this->actingAsPelanggan()->get('/pelanggan/dine-in');
        $response->assertStatus(200);
    }

    public function test_pelanggan_can_access_order_history_page(): void
    {
        $response = $this->actingAsPelanggan()->get('/pelanggan/history');
        $response->assertStatus(200);
    }

    public function test_pelanggan_can_access_order_detail_page(): void
    {
        $product = Produk::where('stok', '>=', 2)->firstOrFail();
        $this->actingAsPelanggan()->post('/checkout', [
            'order_type' => 'delivery',
            'payment_method' => 'gomeal_pay',
            'items' => [
                ['nama_produk' => $product->nama_produk, 'qty' => 1],
            ],
        ]);

        $tx = DB::table('tbl_transaksi')
            ->where('id_pelanggan', $this->pelanggan->id_pelanggan)
            ->latest('id_transaksi')
            ->first();

        $response = $this->actingAsPelanggan()->get("/pelanggan/history/{$tx->id_transaksi}");
        $response->assertStatus(200);

        // Cleanup test transaction
        DB::table('tbl_detail_transaksi')->where('id_transaksi', $tx->id_transaksi)->delete();
        DB::table('tbl_transaksi')->where('id_transaksi', $tx->id_transaksi)->delete();
    }

    public function test_pelanggan_history_excludes_kasir_pos_orders(): void
    {
        $kasirPosId = DB::table('tbl_transaksi')->insertGetId([
            'tanggal' => now()->toDateString(),
            'id_pelanggan' => $this->pelanggan->id_pelanggan,
            'total_belanja' => 50000,
            'status_pesanan' => 'selesai',
            'tipe_pesanan' => 'kasir_pos',
            'metode_pembayaran' => 'tunai',
        ]);

        $this->actingAsPelanggan()->get("/pelanggan/history/{$kasirPosId}")->assertStatus(404);

        DB::table('tbl_transaksi')->where('id_transaksi', $kasirPosId)->delete();
    }

    public function test_pelanggan_can_access_pembayaran_page(): void
    {
        $response = $this->actingAsPelanggan()->get('/pelanggan/pembayaran');
        $response->assertStatus(200);
    }

    public function test_pelanggan_can_checkout_delivery(): void
    {
        $product = Produk::where('stok', '>=', 2)->firstOrFail();

        $response = $this->actingAsPelanggan()->post('/checkout', [
            'order_type' => 'delivery',
            'payment_method' => 'gomeal_pay',
            'items' => [
                ['nama_produk' => $product->nama_produk, 'qty' => 1],
            ],
        ]);

        $response->assertSessionHas('success');

        // Cleanup test transaction so dummy records don't pollute live kasir board
        $txId = DB::table('tbl_transaksi')
            ->where('id_pelanggan', $this->pelanggan->id_pelanggan)
            ->orderByDesc('id_transaksi')
            ->value('id_transaksi');

        if ($txId) {
            DB::table('tbl_detail_transaksi')->where('id_transaksi', $txId)->delete();
            DB::table('tbl_transaksi')->where('id_transaksi', $txId)->delete();
        }
    }

    public function test_pelanggan_can_top_up_wallet(): void
    {
        $response = $this->actingAsPelanggan()->post('/top-up', [
            'amount' => 50000,
            'method' => 'QRIS Instant',
        ]);

        $response->assertSessionHas('success');
    }
}
