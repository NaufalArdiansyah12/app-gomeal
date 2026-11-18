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
        // 1. Expand status_pesanan enum to include 'menunggu_kasir'
        DB::statement("ALTER TABLE tbl_transaksi MODIFY COLUMN status_pesanan ENUM('menunggu_kasir', 'menunggu_chef', 'dimasak', 'siap_kasir', 'selesai') NOT NULL DEFAULT 'selesai'");

        // 2. Add helper columns for order metadata if not present
        Schema::table('tbl_transaksi', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_transaksi', 'tipe_pesanan')) {
                $table->enum('tipe_pesanan', ['delivery', 'dine_in'])->default('delivery')->after('status_pesanan');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'metode_pembayaran')) {
                $table->string('metode_pembayaran', 50)->default('tunai')->after('tipe_pesanan');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'catatan')) {
                $table->string('catatan', 255)->nullable()->after('metode_pembayaran');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_transaksi', function (Blueprint $table) {
            if (Schema::hasColumn('tbl_transaksi', 'catatan')) {
                $table->dropColumn('catatan');
            }
            if (Schema::hasColumn('tbl_transaksi', 'metode_pembayaran')) {
                $table->dropColumn('metode_pembayaran');
            }
            if (Schema::hasColumn('tbl_transaksi', 'tipe_pesanan')) {
                $table->dropColumn('tipe_pesanan');
            }
        });

        DB::statement("ALTER TABLE tbl_transaksi MODIFY COLUMN status_pesanan ENUM('menunggu_chef', 'dimasak', 'siap_kasir', 'selesai') NOT NULL DEFAULT 'selesai'");
    }
};
