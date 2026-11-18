<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tbl_produk', function (Blueprint $table) {
            $table->string('barcode', 50)->nullable()->unique()->after('nama_produk');
        });

        // Update view_katalog_produk to include barcode
        DB::statement('DROP VIEW IF EXISTS view_katalog_produk');
        DB::statement('
            CREATE VIEW view_katalog_produk AS
            SELECT 
                p.id_produk,
                p.id_kategori,
                k.nama_kategori,
                p.nama_produk,
                p.barcode,
                p.harga,
                p.stok
            FROM tbl_produk p
            JOIN tbl_kategori k ON p.id_kategori = k.id_kategori
        ');

        // Populate existing products with default barcodes if empty
        $existing = DB::table('tbl_produk')->whereNull('barcode')->get();
        foreach ($existing as $prod) {
            $code = sprintf('PRD-%04d', $prod->id_produk);
            DB::table('tbl_produk')->where('id_produk', $prod->id_produk)->update(['barcode' => $code]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_produk', function (Blueprint $table) {
            $table->dropColumn('barcode');
        });

        DB::statement('DROP VIEW IF EXISTS view_katalog_produk');
        DB::statement('
            CREATE VIEW view_katalog_produk AS
            SELECT 
                p.id_produk,
                p.id_kategori,
                k.nama_kategori,
                p.nama_produk,
                p.harga,
                p.stok
            FROM tbl_produk p
            JOIN tbl_kategori k ON p.id_kategori = k.id_kategori
        ');
    }
};
