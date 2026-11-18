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
        Schema::create('tbl_shift_kasir', function (Blueprint $table) {
            $table->id('id_shift');
            $table->integer('id_user');
            $table->string('nama_shift', 50)->default('Shift Pagi');
            $table->date('tanggal');
            $table->time('jam_mulai');
            $table->time('jam_selesai');
            $table->decimal('saldo_awal', 12, 2)->default(500000.00);
            $table->decimal('saldo_akhir', 12, 2)->nullable();
            $table->enum('status', ['terjadwal', 'aktif', 'selesai'])->default('terjadwal');
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->foreign('id_user')->references('id_user')->on('tbl_users')->cascadeOnDelete();
        });

        // Seed initial sample shift for existing kasir user if available
        $kasirUser = DB::table('tbl_users')->where('role', 'kasir')->first();
        if ($kasirUser) {
            DB::table('tbl_shift_kasir')->insert([
                [
                    'id_user' => $kasirUser->id_user,
                    'nama_shift' => 'Shift Pagi (Kasir 1)',
                    'tanggal' => now()->toDateString(),
                    'jam_mulai' => '08:00:00',
                    'jam_selesai' => '16:00:00',
                    'saldo_awal' => 500000.00,
                    'saldo_akhir' => null,
                    'status' => 'aktif',
                    'catatan' => 'Uang modal laci kasir Rp 500.000',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'id_user' => $kasirUser->id_user,
                    'nama_shift' => 'Shift Malam (Kasir 2)',
                    'tanggal' => now()->toDateString(),
                    'jam_mulai' => '16:00:00',
                    'jam_selesai' => '23:00:00',
                    'saldo_awal' => 500000.00,
                    'saldo_akhir' => null,
                    'status' => 'terjadwal',
                    'catatan' => 'Jadwal shift pergantian sore',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_shift_kasir');
    }
};
