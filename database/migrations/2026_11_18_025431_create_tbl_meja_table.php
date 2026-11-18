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
        Schema::create('tbl_meja', function (Blueprint $table) {
            $table->id('id_meja');
            $table->string('nomor_meja', 50)->unique();
            $table->string('kode_qr', 64)->unique();
            $table->unsignedSmallInteger('kapasitas')->default(4);
            $table->enum('status', ['tersedia', 'terisi', 'nonaktif'])->default('tersedia');
            $table->string('catatan', 120)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_meja');
    }
};
