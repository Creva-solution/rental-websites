<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $role = $request->attributes->get('auth_user_role');

        if ($role !== 'superadmin' && $role !== 'staff') {
            return response()->json([
                'error' => 'Forbidden. Super Admin or Staff access required.',
            ], 403);
        }

        // Safeguard: Staff users cannot modify global settings
        if ($role === 'staff') {
            $path = $request->path();
            if (str_contains($path, 'platform-settings')) {
                if ($request->isMethod('post') || $request->isMethod('put') || $request->isMethod('patch') || $request->isMethod('delete')) {
                    return response()->json([
                        'error' => 'Forbidden. Staff users cannot modify platform settings.',
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
