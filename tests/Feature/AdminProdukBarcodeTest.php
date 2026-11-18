<?php

namespace Tests\Feature;

use App\Models\Produk;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminProdukBarcodeTest extends TestCase
{
    public function test_can_create_product_with_barcode_and_image(): void
    {
        Storage::fake('public');
        $kategori = DB::table('tbl_kategori')->first();
        $testCode = 'BRC-TEST-'.rand(1000, 9999);
        $file = UploadedFile::fake()->create('burger.jpg', 100, 'image/jpeg');

        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->post('/admin/produk', [
                'id_kategori' => $kategori->id_kategori,
                'nama_produk' => 'Produk Test '.$testCode,
                'barcode' => $testCode,
                'image_file' => $file,
                'harga' => 35000,
                'stok' => 20,
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('tbl_produk', [
            'barcode' => $testCode,
            'harga' => 35000.00,
        ]);

        $created = DB::table('tbl_produk')->where('barcode', $testCode)->first();
        $this->assertNotNull($created->image);
        $this->assertStringStartsWith('/storage/products/', $created->image);

        // Cleanup
        DB::table('tbl_produk')->where('barcode', $testCode)->delete();
    }

    public function test_can_update_product_barcode_and_image_url(): void
    {
        $prod = Produk::first();
        $newCode = 'PRD-UPDATED-'.rand(1000, 9999);
        $testImageUrl = 'https://images.unsplash.com/test-photo.jpg';

        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->put("/admin/produk/{$prod->id_produk}", [
                'id_kategori' => $prod->id_kategori,
                'nama_produk' => $prod->nama_produk,
                'barcode' => $newCode,
                'image' => $testImageUrl,
                'harga' => 45000,
                'stok' => $prod->stok,
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('tbl_produk', [
            'id_produk' => $prod->id_produk,
            'barcode' => $newCode,
            'image' => $testImageUrl,
            'harga' => 45000.00,
        ]);
    }

    public function test_can_manage_kategori(): void
    {
        $katName = 'Snack Test '.rand(1000, 9999);

        // 1. Create
        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->post('/admin/kategori', [
                'nama_kategori' => $katName,
            ]);
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('tbl_kategori', ['nama_kategori' => $katName]);

        $created = DB::table('tbl_kategori')->where('nama_kategori', $katName)->first();

        // 2. Update
        $updatedName = $katName.' Updated';
        $responseUpdate = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->put("/admin/kategori/{$created->id_kategori}", [
                'nama_kategori' => $updatedName,
            ]);
        $responseUpdate->assertSessionHasNoErrors();
        $this->assertDatabaseHas('tbl_kategori', ['id_kategori' => $created->id_kategori, 'nama_kategori' => $updatedName]);

        // 3. Delete
        $responseDelete = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->delete("/admin/kategori/{$created->id_kategori}");
        $responseDelete->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('tbl_kategori', ['id_kategori' => $created->id_kategori]);
    }

    public function test_pos_page_includes_product_barcode_for_scanner(): void
    {
        $prod = Produk::whereNotNull('barcode')->first();
        $this->assertNotNull($prod);

        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->get('/admin/transaksi');

        $response->assertStatus(200);
        $response->assertSee($prod->barcode);
    }

    public function test_can_delete_product(): void
    {
        $kategori = DB::table('tbl_kategori')->first();
        $prod = Produk::create([
            'id_kategori' => $kategori->id_kategori,
            'nama_produk' => 'Produk Hapus Test '.rand(1000, 9999),
            'barcode' => 'DEL-'.rand(1000, 9999),
            'harga' => 15000,
            'stok' => 5,
        ]);

        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->delete("/admin/produk/{$prod->id_produk}");

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('tbl_produk', ['id_produk' => $prod->id_produk]);
    }
}
