<?php

namespace Tests\Feature;

use App\Models\Pelanggan;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DeliveryOrderFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Ensure at least one product with enough stock
        Produk::firstOrCreate(
            ['nama_produk' => 'Nasi Goreng Test'],
            ['harga' => 20000, 'stok' => 50, 'id_kategori' => 1]
        );
    }

    public function test_complete_delivery_order_lifecycle(): void
    {
        // 1. Pelanggan Setup & Checkout (Delivery)
        $pelanggan = Pelanggan::firstOrCreate(
            ['nama_pelanggan' => 'Pelanggan Delivery Test'],
            ['kota' => 'Jakarta']
        );

        $pelangganUser = User::firstOrCreate(
            ['username' => 'pelanggan_delivery_test'],
            ['password' => bcrypt('password'), 'role' => 'pelanggan', 'id_pelanggan' => $pelanggan->id_pelanggan]
        );

        $checkoutResponse = $this->withSession([
            'user_id' => $pelangganUser->id_user,
            'user_role' => 'pelanggan',
            'user_username' => $pelangganUser->username,
            'pelanggan_id' => $pelanggan->id_pelanggan,
            'pelanggan_name' => $pelanggan->nama_pelanggan,
            'gomeal_balance' => 100000,
        ])->post('/checkout', [
            'order_type' => 'delivery',
            'payment_method' => 'gomeal_pay',
            'notes' => 'Tolong pedas sedang',
            'items' => [
                ['nama_produk' => 'Nasi Goreng Test', 'qty' => 1],
            ],
        ]);

        $checkoutResponse->assertSessionHasNoErrors();
        $checkoutResponse->assertRedirect();

        $tx = DB::table('tbl_transaksi')
            ->where('id_pelanggan', $pelanggan->id_pelanggan)
            ->orderByDesc('id_transaksi')
            ->first();

        $this->assertNotNull($tx);
        $this->assertEquals('menunggu_kasir', $tx->status_pesanan, 'Initial status must be menunggu_kasir');
        $this->assertEquals('delivery', $tx->tipe_pesanan);

        $orderId = $tx->id_transaksi;

        // 2. Kasir receives & verifies payment -> forwards to chef
        $kasir = User::firstOrCreate(
            ['username' => 'kasir_delivery_test'],
            ['password' => bcrypt('password'), 'role' => 'kasir']
        );

        $kasirAdvanceResponse = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->post("/admin/order-makanan/{$orderId}/status", [
            'status_pesanan' => 'menunggu_chef',
        ]);

        $kasirAdvanceResponse->assertRedirect();
        $this->assertEquals(
            'menunggu_chef',
            DB::table('tbl_transaksi')->where('id_transaksi', $orderId)->value('status_pesanan')
        );

        // 3. Chef starts cooking
        $chef = User::firstOrCreate(
            ['username' => 'chef_delivery_test'],
            ['password' => bcrypt('password'), 'role' => 'chef']
        );

        $chefCookingResponse = $this->withSession([
            'user_id' => $chef->id_user,
            'user_role' => 'chef',
            'user_username' => $chef->username,
        ])->post("/chef/orders/{$orderId}/status", [
            'status_pesanan' => 'dimasak',
        ]);

        $chefCookingResponse->assertRedirect();
        $this->assertEquals(
            'dimasak',
            DB::table('tbl_transaksi')->where('id_transaksi', $orderId)->value('status_pesanan')
        );

        // 4. Chef finishes cooking -> returns to Kasir
        $chefFinishResponse = $this->withSession([
            'user_id' => $chef->id_user,
            'user_role' => 'chef',
            'user_username' => $chef->username,
        ])->post("/chef/orders/{$orderId}/status", [
            'status_pesanan' => 'siap_kasir',
        ]);

        $chefFinishResponse->assertRedirect();
        $this->assertEquals(
            'siap_kasir',
            DB::table('tbl_transaksi')->where('id_transaksi', $orderId)->value('status_pesanan')
        );

        // 5. Kasir hands over order to customer / courier -> Selesai
        $kasirCompleteResponse = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->post("/admin/order-makanan/{$orderId}/status", [
            'status_pesanan' => 'selesai',
        ]);

        $kasirCompleteResponse->assertRedirect();
        $this->assertEquals(
            'selesai',
            DB::table('tbl_transaksi')->where('id_transaksi', $orderId)->value('status_pesanan')
        );

        // Cleanup test data
        DB::table('tbl_detail_transaksi')->where('id_transaksi', $orderId)->delete();
        DB::table('tbl_transaksi')->where('id_transaksi', $orderId)->delete();
    }

    public function test_kasir_pos_transaction_does_not_appear_in_order_makanan(): void
    {
        Config::set('duitku.merchant_code', 'TEST_MERCHANT');
        Config::set('duitku.api_key', 'TEST_SECRET_KEY');

        $kasir = User::firstOrCreate(
            ['username' => 'kasir_pos_filter_test'],
            ['password' => bcrypt('password'), 'role' => 'kasir']
        );

        $pelanggan = Pelanggan::firstOrCreate(
            ['nama_pelanggan' => 'Pelanggan POS Kasir Langsung'],
            ['kota' => 'Bandung']
        );

        // Store direct POS transaction from Kasir
        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->post('/admin/transaksi', [
            'id_pelanggan' => $pelanggan->id_pelanggan,
            'items' => [
                ['nama_produk' => 'Nasi Goreng Test', 'qty' => 1],
            ],
            'metode_pembayaran' => 'Tunai',
            'nominal_bayar' => 20000,
        ]);

        $response->assertSessionHasNoErrors();

        $posTx = DB::table('tbl_transaksi')
            ->where('id_pelanggan', $pelanggan->id_pelanggan)
            ->orderByDesc('id_transaksi')
            ->first();

        $this->assertNotNull($posTx);
        $this->assertEquals('kasir_pos', $posTx->tipe_pesanan);

        // Check /admin/order-makanan does NOT include this POS order
        $orderMakananPage = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->get('/admin/order-makanan');

        $orderMakananPage->assertStatus(200);
        $ordersProp = $orderMakananPage->viewData('page')['props']['orders'] ?? [];
        $orderIds = array_column($ordersProp, 'id_transaksi');
        $this->assertNotContains($posTx->id_transaksi, $orderIds);

        // Successful POS Duitku callbacks must not send POS orders into the kitchen order list.
        $posDuitkuId = DB::table('tbl_transaksi')->insertGetId([
            'tanggal' => now()->toDateString(),
            'id_pelanggan' => $pelanggan->id_pelanggan,
            'id_user' => $kasir->id_user,
            'total_belanja' => 20000,
            'status_pesanan' => 'selesai',
            'tipe_pesanan' => 'kasir_pos',
            'metode_pembayaran' => 'duitku',
            'payment_status' => 'pending',
        ]);

        $orderId = "GM-{$posDuitkuId}-".time();
        $amount = '20000';
        $signature = hash_hmac('sha256', 'TEST_MERCHANT'.$amount.$orderId, 'TEST_SECRET_KEY');

        $this->postJson('/api/duitku/callback', [
            'merchantCode' => 'TEST_MERCHANT',
            'amount' => $amount,
            'merchantOrderId' => $orderId,
            'signature' => $signature,
            'resultCode' => '00',
            'reference' => 'POS-FLOW-REF',
        ])->assertOk();

        $orderMakananPage = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->get('/admin/order-makanan');

        $ordersProp = $orderMakananPage->viewData('page')['props']['orders'] ?? [];
        $orderIds = array_column($ordersProp, 'id_transaksi');
        $this->assertNotContains($posDuitkuId, $orderIds);

        // Cleanup
        DB::table('tbl_transaksi')->where('id_transaksi', $posDuitkuId)->delete();
        DB::table('tbl_detail_transaksi')->where('id_transaksi', $posTx->id_transaksi)->delete();
        DB::table('tbl_transaksi')->where('id_transaksi', $posTx->id_transaksi)->delete();
    }
}
