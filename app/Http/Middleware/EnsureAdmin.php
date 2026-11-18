<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('user_id')) {
            return redirect()->route('login');
        }

        $role = $request->session()->get('user_role');

        if ($role === 'kasir') {
            return redirect()->route('admin.transaksi')->with('error', 'Akses ditolak: Role Kasir tidak memiliki izin ke halaman ini.');
        }

        if ($role === 'chef') {
            return redirect()->route('chef.dashboard')->with('error', 'Akses ditolak: Role Chef tidak memiliki izin ke halaman ini.');
        }

        if ($role !== 'admin') {
            return redirect()->route('login')->with('error', 'Akses ditolak: Akun Anda ('.session('user_username').') bukan Admin. Silakan login menggunakan akun Admin.');
        }

        return $next($request);
    }
}
