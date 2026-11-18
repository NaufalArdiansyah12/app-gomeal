<?php

namespace Tests\Feature;

use App\Models\Meja;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminMejaTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_view_meja_page(): void
    {
        $response = $this->withSession([
            'user_id' => 1,
            'user_role' => 'admin',
            'user_username' => 'admin',
        ])->get('/admin/meja');

        $response->assertOk();
    }

    public function test_admin_can_create_meja_with_unique_qr(): void
    {
        $response = $this->withSession([
            'user_id' => 1,
            'user_role' => 'admin',
        ])->post('/admin/meja', [
            'nomor_meja' => 'Meja Test 99',
            'kapasitas' => 4,
            'catatan' => 'Testing suite',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tbl_meja', [
            'nomor_meja' => 'Meja Test 99',
            'status' => 'tersedia',
        ]);

        $created = Meja::where('nomor_meja', 'Meja Test 99')->first();
        $this->assertNotNull($created);
        $this->assertStringStartsWith('TBL-', $created->kode_qr);
    }

    public function test_admin_can_regenerate_qr_code(): void
    {
        $meja = Meja::create([
            'nomor_meja' => 'Meja Regen Test',
            'kode_qr' => 'TBL-OLDCODE12345',
            'kapasitas' => 2,
            'status' => 'tersedia',
        ]);

        $response = $this->withSession([
            'user_id' => 1,
            'user_role' => 'admin',
        ])->post("/admin/meja/{$meja->id_meja}/regenerate-qr");

        $response->assertRedirect();
        $meja->refresh();
        $this->assertNotEquals('TBL-OLDCODE12345', $meja->kode_qr);
        $this->assertStringStartsWith('TBL-', $meja->kode_qr);
    }
}
