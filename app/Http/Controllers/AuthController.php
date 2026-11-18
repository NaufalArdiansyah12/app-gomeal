<?php

namespace App\Http\Controllers;

use App\Models\Pelanggan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(Request $request): Response|RedirectResponse
    {
        return Inertia::render('Auth/Login', [
            'currentSession' => [
                'id' => session('user_id'),
                'username' => session('user_username'),
                'role' => session('user_role'),
                'nama' => session('pelanggan_nama'),
            ],
        ]);
    }

    public function login(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $validated['username'])->first();

        $passwordValid = false;
        if ($user) {
            $passwordValid = Hash::check($validated['password'], $user->password);

            // Flexible login for demo admin, kasir, & chef user
            if (! $passwordValid && ($user->isAdmin() || $user->isKasir() || $user->isChef())) {
                $allowedPasswords = match ($user->role) {
                    'admin' => ['admin', 'admin123', 'password'],
                    'kasir' => ['kasir', 'kasir123', 'password'],
                    'chef' => ['chef', 'chef123', 'password'],
                    default => ['password'],
                };

                if (in_array(strtolower($validated['password']), $allowedPasswords, true)) {
                    $passwordValid = true;
                    $user->password = Hash::make($validated['password']);
                    $user->save();
                }
            }
        }

        if (! $user || ! $passwordValid) {
            return redirect()->back()->with('error', 'Username atau password salah.');
        }

        // Invalidate old session to avoid stale role/customer data
        $request->session()->invalidate();
        $request->session()->regenerate();
        $request->session()->put('user_id', $user->id_user);
        $request->session()->put('user_role', $user->role);
        $request->session()->put('user_username', $user->username);

        if ($user->isPelanggan() && $user->id_pelanggan) {
            $request->session()->put('pelanggan_id', $user->id_pelanggan);
            $pelanggan = $user->pelanggan;
            $request->session()->put('pelanggan_nama', $pelanggan?->nama_pelanggan);
        }

        DB::table('tbl_log')->insert([
            'aktivitas' => "Login user: {$user->username} (role: {$user->role})",
            'waktu' => now(),
        ]);

        $redirect = match ($user->role) {
            'admin' => 'admin.dashboard',
            'kasir' => 'admin.transaksi',
            'chef' => 'chef.dashboard',
            default => 'home',
        };

        return redirect()->route($redirect)->with('success', "Selamat datang, {$user->username}!");
    }

    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:tbl_users,username',
            'password' => 'required|string|min:4',
            'nama_pelanggan' => 'required|string|max:100',
            'kota' => 'required|string|max:50',
        ]);

        DB::beginTransaction();

        try {
            // Create pelanggan via Stored Procedure
            DB::statement('CALL TambahPelanggan(?, ?)', [
                $validated['nama_pelanggan'],
                $validated['kota'],
            ]);

            $pelanggan = Pelanggan::where('nama_pelanggan', $validated['nama_pelanggan'])
                ->latest('id_pelanggan')
                ->firstOrFail();

            // Create user account
            $user = User::create([
                'username' => $validated['username'],
                'password' => Hash::make($validated['password']),
                'role' => 'pelanggan',
                'id_pelanggan' => $pelanggan->id_pelanggan,
            ]);

            DB::commit();

            $request->session()->regenerate();
            $request->session()->put('user_id', $user->id_user);
            $request->session()->put('user_role', 'pelanggan');
            $request->session()->put('user_username', $user->username);
            $request->session()->put('pelanggan_id', $pelanggan->id_pelanggan);
            $request->session()->put('pelanggan_nama', $pelanggan->nama_pelanggan);

            return redirect()->route('home')->with('success', "Akun berhasil dibuat! Selamat datang, {$user->username}!");
        } catch (\Throwable $e) {
            DB::rollBack();

            return redirect()->back()->with('error', 'Gagal membuat akun: '.$e->getMessage());
        }
    }

    public function logout(Request $request): RedirectResponse
    {
        $username = $request->session()->get('user_username', 'Guest');

        DB::table('tbl_log')->insert([
            'aktivitas' => "Logout user: {$username}",
            'waktu' => now(),
        ]);

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
