<?php

namespace Tests\Feature;

use App\Models\Pelanggan;
use App\Models\Produk;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class KasirRoleTest extends TestCase
{
    protected function getKasirUser(): User
    {
        return User::firstOrCreate(
            ['username' => 'kasir_test'],
            ['password' => bcrypt('password'), 'role' => 'kasir']
        );
    }

    public function test_kasir_can_login_and_redirects_to_transaksi(): void
    {
        $kasir = $this->getKasirUser();

        $response = $this->post('/login', [
            'username' => $kasir->username,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('admin.transaksi'));
        $this->assertEquals('kasir', session('user_role'));
    }

    public function test_kasir_can_access_pos_page(): void
    {
        $kasir = $this->getKasirUser();

        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->get('/admin/transaksi');

        $response->assertStatus(200);
    }

    public function test_kasir_can_access_riwayat_page_and_it_filters_to_kasir_only(): void
    {
        $kasir = $this->getKasirUser();

        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->get('/admin/riwayat');

        $response->assertStatus(200);
    }

    public function test_kasir_can_access_pelanggan_page_view_only(): void
    {
        $kasir = $this->getKasirUser();

        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->get('/admin/pelanggan');

        $response->assertStatus(200);
    }

    public function test_kasir_can_access_order_makanan_page(): void
    {
        $kasir = $this->getKasirUser();

        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->get('/admin/order-makanan');

        $response->assertStatus(200);
    }

    public function test_kasir_cannot_create_pelanggan(): void
    {
        $kasir = $this->getKasirUser();

        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->post('/admin/pelanggan', [
            'nama_pelanggan' => 'Pelanggan Ilegal',
            'kota' => 'Surabaya',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('tbl_pelanggan', ['nama_pelanggan' => 'Pelanggan Ilegal']);
    }

    public function test_kasir_cannot_access_admin_only_menus(): void
    {
        $kasir = $this->getKasirUser();
        $session = [
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ];

        // Dashboard
        $this->withSession($session)->get('/admin/dashboard')
            ->assertRedirect(route('admin.transaksi'));

        // Produk
        $this->withSession($session)->get('/admin/produk')
            ->assertRedirect(route('admin.transaksi'));

        // Stok
        $this->withSession($session)->get('/admin/stok')
            ->assertRedirect(route('admin.transaksi'));

        // Laporan
        $this->withSession($session)->get('/admin/laporan')
            ->assertRedirect(route('admin.transaksi'));

        // Meja
        $this->withSession($session)->get('/admin/meja')
            ->assertRedirect(route('admin.transaksi'));
    }

    public function test_kasir_processes_transaction_attaching_their_user_id(): void
    {
        $kasir = $this->getKasirUser();
        $pelanggan = Pelanggan::first();
        $prod = Produk::where('stok', '>=', 5)->first();

        $response = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->post('/admin/transaksi', [
            'id_pelanggan' => $pelanggan->id_pelanggan,
            'items' => [
                ['nama_produk' => $prod->nama_produk, 'qty' => 1],
            ],
            'diskon_persen' => 0,
            'metode_pembayaran' => 'Tunai',
            'nominal_bayar' => $prod->harga,
        ]);

        $response->assertSessionHas('receipt');

        $transaksi = DB::table('tbl_transaksi')
            ->where('id_user', $kasir->id_user)
            ->latest('id_transaksi')
            ->first();

        $this->assertNotNull($transaksi);
        $this->assertEquals($kasir->id_user, $transaksi->id_user);

        // Kasir voids their own transaction
        $voidResponse = $this->withSession([
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ])->post("/admin/riwayat/{$transaksi->id_transaksi}/void");

        $voidResponse->assertSessionHas('success');
        $this->assertDatabaseMissing('tbl_transaksi', ['id_transaksi' => $transaksi->id_transaksi]);
    }
}
