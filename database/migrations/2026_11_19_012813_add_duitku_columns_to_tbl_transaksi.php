<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tbl_transaksi', function (Blueprint $table) {
            if (! Schema::hasColumn('tbl_transaksi', 'payment_status')) {
                $table->string('payment_status', 20)->default('paid')->after('metode_pembayaran');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'payment_reference')) {
                $table->string('payment_reference', 100)->nullable()->after('payment_status');
            }
            if (! Schema::hasColumn('tbl_transaksi', 'payment_url')) {
                $table->text('payment_url')->nullable()->after('payment_reference');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbl_transaksi', function (Blueprint $table) {
            if (Schema::hasColumn('tbl_transaksi', 'payment_url')) {
                $table->dropColumn('payment_url');
            }
            if (Schema::hasColumn('tbl_transaksi', 'payment_reference')) {
                $table->dropColumn('payment_reference');
            }
            if (Schema::hasColumn('tbl_transaksi', 'payment_status')) {
                $table->dropColumn('payment_status');
            }
        });
    }
};
