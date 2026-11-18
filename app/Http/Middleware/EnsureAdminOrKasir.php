<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminOrKasir
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('user_id')) {
            return redirect()->route('login');
        }

        $role = $request->session()->get('user_role');

        if ($role === 'chef') {
            return redirect()->route('chef.dashboard')->with('error', 'Akses ditolak: Role Chef tidak memiliki akses ke halaman ini.');
        }

        if (! in_array($role, ['admin', 'kasir'], true)) {
            return redirect()->route('login')->with('error', 'Akses ditolak: Akun Anda ('.session('user_username').') tidak memiliki akses ke halaman ini.');
        }

        return $next($request);
    }
}
