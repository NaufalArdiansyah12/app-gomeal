<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'kasir_pos' so in-store POS transactions are distinct from customer online orders
        DB::statement("ALTER TABLE tbl_transaksi MODIFY COLUMN tipe_pesanan ENUM('delivery', 'dine_in', 'kasir_pos') NOT NULL DEFAULT 'kasir_pos'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE tbl_transaksi MODIFY COLUMN tipe_pesanan ENUM('delivery', 'dine_in') NOT NULL DEFAULT 'delivery'");
    }
};
