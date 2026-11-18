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
        if (! Schema::hasColumn('tbl_produk', 'image')) {
            Schema::table('tbl_produk', function (Blueprint $table) {
                $table->string('image', 500)->nullable()->after('barcode');
            });
        }

        // Update view_katalog_produk to include barcode and image
        DB::statement('DROP VIEW IF EXISTS view_katalog_produk');
        DB::statement('
            CREATE VIEW view_katalog_produk AS
            SELECT 
                p.id_produk,
                p.id_kategori,
                k.nama_kategori,
                p.nama_produk,
                p.barcode,
                p.image,
                p.harga,
                p.stok
            FROM tbl_produk p
            JOIN tbl_kategori k ON p.id_kategori = k.id_kategori
        ');

        // Product default prices in Rupiah and initial images
        $productsData = [
            'Fish Burger' => [
                'harga' => 35000,
                'image' => 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
            ],
            'Beef Burger' => [
                'harga' => 45000,
                'image' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
            ],
            'Cheese Burger' => [
                'harga' => 40000,
                'image' => 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=400&q=80',
            ],
            'Margherita Pizza' => [
                'harga' => 65000,
                'image' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
            ],
            'Spicy Ramen' => [
                'harga' => 42000,
                'image' => 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
            ],
            'Garden Bowl' => [
                'harga' => 32000,
                'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
            ],
            'Pepperoni Pizza' => [
                'harga' => 75000,
                'image' => 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
            ],
            'Crispy Chicken' => [
                'harga' => 38000,
                'image' => 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80',
            ],
            'Croissant Butter' => [
                'harga' => 22000,
                'image' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
            ],
            'Iced Lemon Tea' => [
                'harga' => 15000,
                'image' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
            ],
            'Grilled Salmon' => [
                'harga' => 85000,
                'image' => 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
            ],
            'Shrimp Basket' => [
                'harga' => 55000,
                'image' => 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&q=80',
            ],
        ];

        foreach ($productsData as $nama => $data) {
            DB::table('tbl_produk')->where('nama_produk', $nama)->update([
                'harga' => $data['harga'],
                'image' => $data['image'],
            ]);
        }

        // Update past transaction details with dollar prices to IDR
        DB::table('tbl_detail_transaksi')->where('id_detail', 101)->update(['harga' => 65000]);
        DB::table('tbl_detail_transaksi')->where('id_detail', 102)->update(['harga' => 65000]);
        DB::table('tbl_detail_transaksi')->where('id_detail', 103)->update(['harga' => 42000]);
        DB::table('tbl_detail_transaksi')->where('id_detail', 104)->update(['harga' => 32000]);
        DB::table('tbl_detail_transaksi')->where('id_detail', 105)->update(['harga' => 32000]);
        DB::table('tbl_detail_transaksi')->where('id_detail', 106)->update(['harga' => 45000]);

        // Update past transactions total_belanja to match new details
        DB::table('tbl_transaksi')->where('id_transaksi', 101)->update(['total_belanja' => 130000]);
        DB::table('tbl_transaksi')->where('id_transaksi', 102)->update(['total_belanja' => 42000]);
        DB::table('tbl_transaksi')->where('id_transaksi', 103)->update(['total_belanja' => 128000]);
        DB::table('tbl_transaksi')->where('id_transaksi', 104)->update(['total_belanja' => 180000]);

        // Update Functions KategoriBelanja and HitungProgresTier to Rupiah thresholds
        DB::unprepared('DROP FUNCTION IF EXISTS KategoriBelanja');
        DB::unprepared("
            CREATE FUNCTION KategoriBelanja(total DECIMAL(12,2))
            RETURNS VARCHAR(50)
            DETERMINISTIC
            BEGIN
                IF total >= 500000.00 THEN
                    RETURN 'Gold member';
                ELSEIF total >= 200000.00 THEN
                    RETURN 'Pelanggan Silver';
                ELSE
                    RETURN 'Pelanggan Reguler';
                END IF;
            END
        ");

        DB::unprepared('DROP FUNCTION IF EXISTS HitungProgresTier');
        DB::unprepared('
            CREATE FUNCTION HitungProgresTier(total DECIMAL(12,2))
            RETURNS INT
            DETERMINISTIC
            BEGIN
                IF total >= 500000.00 THEN
                    RETURN 100;
                ELSEIF total >= 300000.00 THEN
                    RETURN 60;
                ELSEIF total >= 100000.00 THEN
                    RETURN 40;
                ELSE
                    RETURN 20;
                END IF;
            END
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('tbl_produk', 'image')) {
            Schema::table('tbl_produk', function (Blueprint $table) {
                $table->dropColumn('image');
            });
        }
    }
};
