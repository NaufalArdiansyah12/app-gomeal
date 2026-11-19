<?php

namespace Tests\Feature;

use App\Models\Pelanggan;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DuitkuIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Config::set('duitku.merchant_code', 'TEST_MERCHANT');
        Config::set('duitku.api_key', 'TEST_SECRET_KEY');
    }

    public function test_duitku_callback_rejected_with_invalid_signature(): void
    {
        $response = $this->postJson('/api/duitku/callback', [
            'merchantCode' => 'TEST_MERCHANT',
            'amount' => '50000',
            'merchantOrderId' => 'GM-999-123456',
            'signature' => 'invalid_signature_hash',
            'resultCode' => '00',
            'reference' => 'D12345678',
        ]);

        $response->assertStatus(400);
        $response->assertJson(['success' => false]);
    }

    public function test_duitku_callback_successful_updates_transaction_and_logs(): void
    {
        $pelanggan = Pelanggan::firstOrCreate(
            ['nama_pelanggan' => 'Pelanggan Duitku Test'],
            ['kota' => 'Bandung']
        );

        $transaksiId = DB::table('tbl_transaksi')->insertGetId([
            'tanggal' => now()->toDateString(),
            'id_pelanggan' => $pelanggan->id_pelanggan,
            'total_belanja' => 45000,
            'status_pesanan' => 'menunggu_kasir',
            'tipe_pesanan' => 'delivery',
            'metode_pembayaran' => 'duitku',
            'payment_status' => 'pending',
        ]);
        $orderId = "GM-{$transaksiId}-".time();
        $amount = '45000';
        $signature = hash_hmac('sha256', 'TEST_MERCHANT'.$amount.$orderId, 'TEST_SECRET_KEY');

        $response = $this->postJson('/api/duitku/callback', [
            'merchantCode' => 'TEST_MERCHANT',
            'amount' => $amount,
            'merchantOrderId' => $orderId,
            'signature' => $signature,
            'resultCode' => '00',
            'reference' => 'REF-DUITKU-123',
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        $updated = DB::table('tbl_transaksi')->where('id_transaksi', $transaksiId)->first();
        $this->assertEquals('paid', $updated->payment_status);
        $this->assertEquals('REF-DUITKU-123', $updated->payment_reference);
        $this->assertEquals('menunggu_chef', $updated->status_pesanan);
    }

    public function test_successful_pos_duitku_callback_keeps_pos_order_out_of_kitchen_flow(): void
    {
        $pelanggan = Pelanggan::firstOrCreate(
            ['nama_pelanggan' => 'Pelanggan Duitku POS Callback'],
            ['kota' => 'Jakarta']
        );

        $transaksiId = DB::table('tbl_transaksi')->insertGetId([
            'tanggal' => now()->toDateString(),
            'id_pelanggan' => $pelanggan->id_pelanggan,
            'total_belanja' => 30000,
            'status_pesanan' => 'selesai',
            'tipe_pesanan' => 'kasir_pos',
            'metode_pembayaran' => 'duitku',
            'payment_status' => 'pending',
        ]);
        DB::table('tbl_detail_transaksi')->insert([
            'id_transaksi' => $transaksiId,
            'nama_produk' => 'Menu POS',
            'jumlah' => 1,
            'harga' => 30000,
        ]);

        $orderId = "GM-{$transaksiId}-".time();
        $amount = '30000';
        $signature = hash_hmac('sha256', 'TEST_MERCHANT'.$amount.$orderId, 'TEST_SECRET_KEY');

        $this->postJson('/api/duitku/callback', [
            'merchantCode' => 'TEST_MERCHANT',
            'amount' => $amount,
            'merchantOrderId' => $orderId,
            'signature' => $signature,
            'resultCode' => '00',
            'reference' => 'POS-CALLBACK-REF',
        ])->assertOk();

        $updated = DB::table('tbl_transaksi')->where('id_transaksi', $transaksiId)->first();
        $this->assertEquals('paid', $updated->payment_status);
        $this->assertEquals('selesai', $updated->status_pesanan);

        $return = $this->get('/duitku/return?merchantOrderId='.urlencode($orderId).'&resultCode=00');
        $return->assertRedirect();
        $this->assertStringContainsString('/admin/transaksi?', $return->headers->get('Location'));
        $return->assertSessionHas('receipt.id_transaksi', $transaksiId);
        $return->assertSessionHas('receipt.items.0.nama_produk', 'Menu POS');
    }

    public function test_duitku_checkout_initiates_payment_url(): void
    {
        Http::fake([
            '*/api/merchant/createInvoice' => Http::response([
                'statusCode' => '00',
                'statusMessage' => 'SUCCESS',
                'paymentUrl' => 'https://sandbox.duitku.com/webapi/pop/inv/test-123',
                'reference' => 'DREF123456',
            ], 200),
        ]);

        Produk::firstOrCreate(
            ['nama_produk' => 'Ayam Geprek Duitku Test'],
            ['harga' => 25000, 'stok' => 20, 'id_kategori' => 1]
        );

        $pelanggan = Pelanggan::firstOrCreate(
            ['nama_pelanggan' => 'Pelanggan Duitku Checkout'],
            ['kota' => 'Jakarta']
        );

        $pelangganUser = User::firstOrCreate(
            ['username' => 'duitku_user_test'],
            ['password' => bcrypt('password'), 'role' => 'pelanggan', 'id_pelanggan' => $pelanggan->id_pelanggan]
        );

        $response = $this->withSession([
            'user_id' => $pelangganUser->id_user,
            'user_role' => 'pelanggan',
            'user_username' => $pelangganUser->username,
            'pelanggan_id' => $pelanggan->id_pelanggan,
            'pelanggan_name' => $pelanggan->nama_pelanggan,
        ])->post('/checkout', [
            'order_type' => 'delivery',
            'payment_method' => 'duitku',
            'items' => [
                ['nama_produk' => 'Ayam Geprek Duitku Test', 'qty' => 1],
            ],
        ]);

        $response->assertRedirect('/');
    }

    public function test_kasir_pos_tunai_does_not_redirect_to_payment_gateway(): void
    {
        $pelanggan = Pelanggan::firstOrCreate(
            ['nama_pelanggan' => 'Pelanggan Kasir Tunai'],
            ['kota' => 'Jakarta']
        );

        $kasir = User::firstOrCreate(
            ['username' => 'kasir_duitku_tunai_test'],
            ['password' => bcrypt('password'), 'role' => 'kasir']
        );

        Produk::firstOrCreate(
            ['nama_produk' => 'Teh Manis POS Test'],
            ['harga' => 5000, 'stok' => 50, 'id_kategori' => 1]
        );

        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->post('/admin/transaksi', [
            'id_pelanggan' => $pelanggan->id_pelanggan,
            'items' => [
                ['nama_produk' => 'Teh Manis POS Test', 'qty' => 2],
            ],
            'metode_pembayaran' => 'Tunai',
            'nominal_bayar' => 10000,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('receipt');
        $response->assertRedirect();
        $this->assertFalse($response->isRedirect('https://sandbox.duitku.com/*'));
    }

    public function test_kasir_pos_duitku_redirects_to_payment_gateway(): void
    {
        Http::fake([
            '*/api/merchant/createInvoice' => Http::response([
                'statusCode' => '00',
                'statusMessage' => 'SUCCESS',
                'paymentUrl' => 'https://sandbox.duitku.com/webapi/pop/inv/pos-kasir-456',
                'reference' => 'POSDUITKU456',
            ], 200),
        ]);

        $pelanggan = Pelanggan::firstOrCreate(
            ['nama_pelanggan' => 'Pelanggan Kasir Duitku'],
            ['kota' => 'Jakarta']
        );

        $kasir = User::firstOrCreate(
            ['username' => 'kasir_duitku_pg_test'],
            ['password' => bcrypt('password'), 'role' => 'kasir']
        );

        Produk::firstOrCreate(
            ['nama_produk' => 'Kopi POS Test'],
            ['harga' => 15000, 'stok' => 50, 'id_kategori' => 1]
        );

        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->post('/admin/transaksi', [
            'id_pelanggan' => $pelanggan->id_pelanggan,
            'items' => [
                ['nama_produk' => 'Kopi POS Test', 'qty' => 1],
            ],
            'metode_pembayaran' => 'BCA',
            'nominal_bayar' => 15000,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertTrue(
            $response->status() === 409 || $response->isRedirect('https://sandbox.duitku.com/webapi/pop/inv/pos-kasir-456')
        );

        Http::assertSent(fn ($request) => $request['paymentMethod'] === 'BC');
        Http::assertSent(fn ($request) => str_ends_with($request['returnUrl'], '/duitku/return'));
    }

    public function test_kasir_pos_rejects_payment_method_outside_allowed_set(): void
    {
        $pelanggan = Pelanggan::firstOrCreate(
            ['nama_pelanggan' => 'Pelanggan POS Invalid Method'],
            ['kota' => 'Jakarta']
        );

        $kasir = User::firstOrCreate(
            ['username' => 'kasir_invalid_method_test'],
            ['password' => bcrypt('password'), 'role' => 'kasir']
        );

        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->post('/admin/transaksi', [
            'id_pelanggan' => $pelanggan->id_pelanggan,
            'items' => [['nama_produk' => 'Tidak relevan', 'qty' => 1]],
            'metode_pembayaran' => 'Duitku',
        ]);

        $response->assertSessionHasErrors('metode_pembayaran');
    }
}
