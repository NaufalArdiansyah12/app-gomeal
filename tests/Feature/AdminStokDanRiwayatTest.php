<?php

namespace Tests\Feature;

use App\Models\Produk;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminStokDanRiwayatTest extends TestCase
{
    public function test_admin_can_access_stok_page(): void
    {
        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->get('/admin/stok');

        $response->assertStatus(200);
    }

    public function test_admin_can_access_riwayat_page(): void
    {
        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->get('/admin/riwayat');

        $response->assertStatus(200);
    }

    public function test_admin_can_adjust_stock(): void
    {
        $prod = Produk::first();
        $initialStock = (int) $prod->stok;

        // Test Restock (masuk)
        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->post('/admin/stok/adjust', [
                'id_produk' => $prod->id_produk,
                'tipe' => 'masuk',
                'jumlah' => 10,
                'catatan' => 'Uji coba restock',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals($initialStock + 10, (int) $prod->fresh()->stok);

        // Revert back
        $prod->update(['stok' => $initialStock]);
    }

    public function test_admin_can_void_transaction_and_restore_stock(): void
    {
        $prod = Produk::first();
        $stokAwal = (int) $prod->stok;
        $pelanggan = DB::table('tbl_pelanggan')->first();

        // Buat transaksi uji coba
        $txId = DB::table('tbl_transaksi')->insertGetId([
            'tanggal' => now()->toDateString(),
            'id_pelanggan' => $pelanggan->id_pelanggan,
            'total_belanja' => $prod->harga * 2,
        ]);

        DB::table('tbl_detail_transaksi')->insert([
            'id_transaksi' => $txId,
            'nama_produk' => $prod->nama_produk,
            'jumlah' => 2,
            'harga' => $prod->harga,
        ]);

        // Stok produk berkurang 2 karena trigger DB after_insert_detail
        $this->assertEquals($stokAwal - 2, (int) $prod->fresh()->stok);

        // Eksekusi Void
        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->post("/admin/riwayat/{$txId}/void");

        $response->assertSessionHasNoErrors();

        // Cek stok kembali normal
        $this->assertEquals($stokAwal, (int) $prod->fresh()->stok);

        // Pastikan transaksi dan detail sudah terhapus
        $this->assertDatabaseMissing('tbl_transaksi', ['id_transaksi' => $txId]);
        $this->assertDatabaseMissing('tbl_detail_transaksi', ['id_transaksi' => $txId]);
    }
}
