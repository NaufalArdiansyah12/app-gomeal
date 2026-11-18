<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class ChefRoleTest extends TestCase
{
    protected function getChefUser(): User
    {
        return User::firstOrCreate(
            ['username' => 'chef_test'],
            ['password' => bcrypt('password'), 'role' => 'chef']
        );
    }

    public function test_chef_can_login_and_redirects_to_chef_dashboard(): void
    {
        $chef = $this->getChefUser();

        $response = $this->post('/login', [
            'username' => $chef->username,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('chef.dashboard'));
        $this->assertEquals('chef', session('user_role'));
    }

    public function test_chef_can_access_chef_dashboard(): void
    {
        $chef = $this->getChefUser();

        $response = $this->withSession([
            'user_id' => $chef->id_user,
            'user_role' => 'chef',
            'user_username' => $chef->username,
        ])->get('/chef/dashboard');

        $response->assertStatus(200);
    }

    public function test_chef_cannot_access_admin_or_kasir_pages(): void
    {
        $chef = $this->getChefUser();
        $session = [
            'user_id' => $chef->id_user,
            'user_role' => 'chef',
            'user_username' => $chef->username,
        ];

        // Should redirect away from admin pages to chef dashboard
        $this->withSession($session)->get('/admin/dashboard')
            ->assertRedirect(route('chef.dashboard'));

        $this->withSession($session)->get('/admin/transaksi')
            ->assertRedirect(route('chef.dashboard'));

        $this->withSession($session)->get('/admin/stok')
            ->assertRedirect(route('chef.dashboard'));
    }

    public function test_non_chef_cannot_access_chef_dashboard(): void
    {
        // Unauthenticated
        $this->get('/chef/dashboard')->assertRedirect(route('login'));

        // Admin redirect
        $this->withSession([
            'user_id' => 1,
            'user_role' => 'admin',
            'user_username' => 'Admin',
        ])->get('/chef/dashboard')->assertRedirect(route('admin.dashboard'));

        // Kasir redirect
        $this->withSession([
            'user_id' => 14,
            'user_role' => 'kasir',
            'user_username' => 'kasir',
        ])->get('/chef/dashboard')->assertRedirect(route('admin.transaksi'));
    }
}
