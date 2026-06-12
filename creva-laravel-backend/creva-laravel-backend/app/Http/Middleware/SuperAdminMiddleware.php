<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $role = $request->attributes->get('auth_user_role');

        if ($role !== 'superadmin') {
            return response()->json([
                'error' => 'Forbidden. Super Admin access required.',
            ], 403);
        }

        return $next($request);
    }
}
