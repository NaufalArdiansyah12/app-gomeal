<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureChef
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('user_id')) {
            return redirect()->route('login');
        }

        $role = $request->session()->get('user_role');

        if ($role === 'admin') {
            return redirect()->route('admin.dashboard')->with('error', 'Akses ditolak: Halaman ini khusus untuk role Chef.');
        }

        if ($role === 'kasir') {
            return redirect()->route('admin.transaksi')->with('error', 'Akses ditolak: Halaman ini khusus untuk role Chef.');
        }

        if ($role !== 'chef') {
            return redirect()->route('login')->with('error', 'Akses ditolak: Akun Anda ('.session('user_username').') bukan Chef. Silakan login menggunakan akun Chef.');
        }

        return $next($request);
    }
}
