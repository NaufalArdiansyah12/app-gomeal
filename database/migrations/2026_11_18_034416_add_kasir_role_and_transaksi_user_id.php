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
        // 1. Expand role enum in tbl_users to include 'kasir'
        DB::statement("ALTER TABLE tbl_users MODIFY COLUMN role ENUM('admin', 'kasir', 'pelanggan') NOT NULL DEFAULT 'pelanggan'");

        // 2. Add id_user to tbl_transaksi to track which staff/cashier processed the order
        if (! Schema::hasColumn('tbl_transaksi', 'id_user')) {
            Schema::table('tbl_transaksi', function (Blueprint $table) {
                $table->integer('id_user')->nullable()->after('id_pelanggan');
                $table->foreign('id_user')->references('id_user')->on('tbl_users')->nullOnDelete();
            });
        }

        // 3. Create default demo kasir user if not already present
        if (! DB::table('tbl_users')->where('username', 'kasir')->exists()) {
            DB::table('tbl_users')->insert([
                'username' => 'kasir',
                'password' => Hash::make('kasir123'),
                'role' => 'kasir',
                'id_pelanggan' => null,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('tbl_transaksi', 'id_user')) {
            Schema::table('tbl_transaksi', function (Blueprint $table) {
                $table->dropForeign(['id_user']);
                $table->dropColumn('id_user');
            });
        }

        DB::table('tbl_users')->where('username', 'kasir')->delete();
        DB::statement("ALTER TABLE tbl_users MODIFY COLUMN role ENUM('admin', 'pelanggan') NOT NULL DEFAULT 'pelanggan'");
    }
};
