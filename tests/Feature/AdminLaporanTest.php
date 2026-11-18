<?php

namespace Tests\Feature;

use Tests\TestCase;

class AdminLaporanTest extends TestCase
{
    public function test_admin_can_access_laporan_page(): void
    {
        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->get('/admin/laporan');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan', false)
            ->has('summary')
            ->has('dailyTrend')
            ->has('topProducts')
            ->has('transactions')
        );
    }

    public function test_admin_can_filter_laporan_by_date(): void
    {
        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->get('/admin/laporan?start_date=2026-10-01&end_date=2026-10-31');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Laporan', false)
            ->where('filters.start_date', '2026-10-01')
            ->where('filters.end_date', '2026-10-31')
        );
    }

    public function test_admin_can_export_laporan_excel(): void
    {
        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->get('/admin/laporan/export-excel');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
        $this->assertStringContainsString('attachment', $response->headers->get('content-disposition'));
    }

    public function test_admin_can_export_laporan_pdf_download(): void
    {
        $response = $this->withSession(['user_id' => 1, 'user_role' => 'admin', 'user_username' => 'Admin'])
            ->get('/admin/laporan/export-pdf');

        $response->assertStatus(200);
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString('attachment', $response->headers->get('content-disposition'));
        $this->assertStringContainsString('.pdf', $response->headers->get('content-disposition'));
    }
}
