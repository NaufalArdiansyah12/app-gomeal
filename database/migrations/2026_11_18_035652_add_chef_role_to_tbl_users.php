<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Expand role enum in tbl_users to include 'chef'
        DB::statement("ALTER TABLE tbl_users MODIFY COLUMN role ENUM('admin', 'kasir', 'chef', 'pelanggan') NOT NULL DEFAULT 'pelanggan'");

        // 2. Add status_pesanan to tbl_transaksi for order flow: pelanggan -> chef -> kasir -> selesai
        if (! Schema::hasColumn('tbl_transaksi', 'status_pesanan')) {
            Schema::table('tbl_transaksi', function (Blueprint $table) {
                $table->enum('status_pesanan', ['menunggu_chef', 'dimasak', 'siap_kasir', 'selesai'])
                    ->default('selesai')
                    ->after('total_belanja');
            });
        }

        // 3. Create default demo chef user
        if (! DB::table('tbl_users')->where('username', 'chef')->exists()) {
            DB::table('tbl_users')->insert([
                'username' => 'chef',
                'password' => Hash::make('chef123'),
                'role' => 'chef',
                'id_pelanggan' => null,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('tbl_transaksi', 'status_pesanan')) {
            Schema::table('tbl_transaksi', function (Blueprint $table) {
                $table->dropColumn('status_pesanan');
            });
        }

        DB::table('tbl_users')->where('username', 'chef')->delete();
        DB::statement("ALTER TABLE tbl_users MODIFY COLUMN role ENUM('admin', 'kasir', 'pelanggan') NOT NULL DEFAULT 'pelanggan'");
    }
};
