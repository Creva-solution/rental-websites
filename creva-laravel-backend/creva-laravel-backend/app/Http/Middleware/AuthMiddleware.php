<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $this->extractToken($request);

        if (!$token) {
            return response()->json(['error' => 'Unauthenticated. Please log in.'], 401);
        }

        $payload = $this->verifyJWT($token);
        if (!$payload) {
            return response()->json(['error' => 'Invalid or expired session. Please log in again.'], 401);
        }

        // Attach auth info to request for downstream use
        $request->attributes->set('auth_user_id', $payload['sub']);
        $request->attributes->set('auth_user_role', $payload['role'] ?? 'merchant');
        $request->attributes->set('auth_payload', $payload);

        return $next($request);
    }

    private function extractToken(Request $request): ?string
    {
        $cookie = $request->cookie('creva_auth');
        if ($cookie) return $cookie;

        $auth = $request->header('Authorization', '');
        if (str_starts_with($auth, 'Bearer ')) {
            return substr($auth, 7);
        }

        return null;
    }

    private function verifyJWT(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $payload, $signature] = $parts;

        $secret = env('JWT_SECRET', config('app.key', ''));
        if (str_starts_with($secret, 'base64:')) {
            $secret = base64_decode(substr($secret, 7));
        }

        $expectedSig = hash_hmac('sha256', "$header.$payload", $secret, true);
        $expectedSig = rtrim(strtr(base64_encode($expectedSig), '+/', '-_'), '=');

        if (!hash_equals($expectedSig, $signature)) return null;

        $decoded = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
        if (!$decoded || ($decoded['exp'] ?? 0) < time()) return null;

        return $decoded;
    }
}
