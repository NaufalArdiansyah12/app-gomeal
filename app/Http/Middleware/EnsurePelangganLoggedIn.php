<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePelangganLoggedIn
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('user_id')) {
            return redirect()->route('login');
        }

        if ($request->session()->get('user_role') !== 'pelanggan') {
            return redirect()->route('admin.dashboard');
        }

        return $next($request);
    }
}
