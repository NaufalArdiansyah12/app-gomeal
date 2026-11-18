<?php

namespace Tests\Feature;

use App\Models\ShiftKasir;
use App\Models\User;
use Tests\TestCase;

class AdminShiftDanKategoriTest extends TestCase
{
    private function adminSession(): array
    {
        return [
            'user_id' => 1,
            'user_role' => 'admin',
            'user_username' => 'Admin',
        ];
    }

    private function kasirSession(): array
    {
        $kasir = User::where('role', 'kasir')->first();

        return [
            'user_id' => $kasir->id_user,
            'user_role' => 'kasir',
            'user_username' => $kasir->username,
        ];
    }

    public function test_admin_can_access_dedicated_kategori_page(): void
    {
        $response = $this->withSession($this->adminSession())
            ->get('/admin/kategori');

        $response->assertStatus(200);
    }

    public function test_kasir_cannot_access_kategori_page(): void
    {
        $response = $this->withSession($this->kasirSession())
            ->get('/admin/kategori');

        $response->assertRedirect('/admin/transaksi');
    }

    public function test_admin_can_access_shift_kasir_page(): void
    {
        $response = $this->withSession($this->adminSession())
            ->get('/admin/shift');

        $response->assertStatus(200);
    }

    public function test_kasir_cannot_access_shift_page(): void
    {
        $response = $this->withSession($this->kasirSession())
            ->get('/admin/shift');

        $response->assertRedirect('/admin/transaksi');
    }

    public function test_admin_can_create_update_close_and_delete_shift(): void
    {
        $kasir = User::where('role', 'kasir')->first();

        // 1. Create shift
        $responseCreate = $this->withSession($this->adminSession())
            ->post('/admin/shift', [
                'id_user' => $kasir->id_user,
                'nama_shift' => 'Shift Sore Test',
                'tanggal' => now()->toDateString(),
                'jam_mulai' => '14:00',
                'jam_selesai' => '22:00',
                'saldo_awal' => 350000,
                'status' => 'terjadwal',
                'catatan' => 'Uang modal awal kasir',
            ]);

        $responseCreate->assertSessionHasNoErrors();
        $responseCreate->assertRedirect();

        $shift = ShiftKasir::where('nama_shift', 'Shift Sore Test')->first();
        $this->assertNotNull($shift);
        $this->assertEquals(350000, (float) $shift->saldo_awal);

        // 2. Update shift
        $responseUpdate = $this->withSession($this->adminSession())
            ->put("/admin/shift/{$shift->id_shift}", [
                'id_user' => $kasir->id_user,
                'nama_shift' => 'Shift Sore Test (Updated)',
                'tanggal' => now()->toDateString(),
                'jam_mulai' => '15:00',
                'jam_selesai' => '23:00',
                'saldo_awal' => 400000,
                'status' => 'aktif',
                'catatan' => 'Shift diaktifkan',
            ]);

        $responseUpdate->assertSessionHasNoErrors();
        $shift->refresh();
        $this->assertEquals('aktif', $shift->status);
        $this->assertEquals('Shift Sore Test (Updated)', $shift->nama_shift);

        // 3. Close shift
        $responseClose = $this->withSession($this->adminSession())
            ->post("/admin/shift/{$shift->id_shift}/close", [
                'saldo_akhir' => 1250000,
                'catatan' => 'Setoran laci cocok',
            ]);

        $responseClose->assertSessionHasNoErrors();
        $shift->refresh();
        $this->assertEquals('selesai', $shift->status);
        $this->assertEquals(1250000, (float) $shift->saldo_akhir);

        // 4. Delete shift
        $responseDelete = $this->withSession($this->adminSession())
            ->delete("/admin/shift/{$shift->id_shift}");

        $responseDelete->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('tbl_shift_kasir', ['id_shift' => $shift->id_shift]);
    }

    public function test_admin_can_create_kasir_account(): void
    {
        $uniqueUsername = 'kasir_baru_'.uniqid();

        $response = $this->withSession($this->adminSession())
            ->post('/admin/shift/kasir-user', [
                'username' => $uniqueUsername,
                'password' => 'secret123',
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('tbl_users', [
            'username' => $uniqueUsername,
            'role' => 'kasir',
        ]);

        User::where('username', $uniqueUsername)->delete();
    }
}
