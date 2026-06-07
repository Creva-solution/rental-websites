<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // ─── JWT Helpers ──────────────────────────────────────────────────────────

    private function getJwtSecret(): string
    {
        $key = env('JWT_SECRET', config('app.key', 'creva-default-secret-change-in-production'));
        if (str_starts_with($key, 'base64:')) {
            $key = base64_decode(substr($key, 7));
        }
        return $key;
    }

    private function generateJWT(array $payload): string
    {
        $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'])), '+/', '-_'), '=');

        $payload['iat'] = time();
        $payload['exp'] = time() + (60 * 60 * 24 * 7); // 7 days
        $payload['jti'] = Str::uuid()->toString();

        $encodedPayload = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');

        $signature = hash_hmac('sha256', "$header.$encodedPayload", $this->getJwtSecret(), true);
        $encodedSig = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        return "$header.$encodedPayload.$encodedSig";
    }

    public function verifyJWT(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $payload, $signature] = $parts;

        $expectedSig = hash_hmac('sha256', "$header.$payload", $this->getJwtSecret(), true);
        $expectedSig = rtrim(strtr(base64_encode($expectedSig), '+/', '-_'), '=');

        if (!hash_equals($expectedSig, $signature)) return null;

        $decoded = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
        if (!$decoded || ($decoded['exp'] ?? 0) < time()) return null;

        return $decoded;
    }

    private function extractTokenFromRequest(Request $request): ?string
    {
        // 1. Check httpOnly cookie first
        $cookie = $request->cookie('creva_auth');
        if ($cookie) return $cookie;

        // 2. Fall back to Authorization header
        $auth = $request->header('Authorization', '');
        if (str_starts_with($auth, 'Bearer ')) {
            return substr($auth, 7);
        }

        return null;
    }

    // ─── Rate Limiting ────────────────────────────────────────────────────────

    private function checkRateLimit(string $key, int $maxAttempts = 5, int $decayMinutes = 1): bool
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS rate_limits (
                key_hash VARCHAR(64) PRIMARY KEY,
                attempts INTEGER DEFAULT 0,
                window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $keyHash = hash('sha256', $key);
        $windowStart = now()->subMinutes($decayMinutes);

        $record = DB::table('rate_limits')->where('key_hash', $keyHash)->first();

        if (!$record || $record->window_start < $windowStart) {
            DB::table('rate_limits')->updateOrInsert(
                ['key_hash' => $keyHash],
                ['attempts' => 1, 'window_start' => now()]
            );
            return true;
        }

        if ($record->attempts >= $maxAttempts) {
            return false;
        }

        DB::table('rate_limits')->where('key_hash', $keyHash)->increment('attempts');
        return true;
    }

    private function clearRateLimit(string $key): void
    {
        $keyHash = hash('sha256', $key);
        DB::table('rate_limits')->where('key_hash', $keyHash)->delete();
    }

    // ─── Cookie Helper ────────────────────────────────────────────────────────

    private function buildCookieHeader(string $token): string
    {
        $isSecure = env('APP_ENV', 'production') !== 'local';
        $secure = $isSecure ? '; Secure' : '';
        $sameSite = $isSecure ? '; SameSite=None' : '; SameSite=Lax';
        return "creva_auth={$token}; HttpOnly{$secure}{$sameSite}; Path=/; Max-Age=604800";
    }

    // ─── Controllers ──────────────────────────────────────────────────────────

    public function register(Request $request)
    {
        $ip = $request->ip();
        if (!$this->checkRateLimit("register:{$ip}", 10, 15)) {
            return response()->json(['error' => 'Too many registration attempts. Please try again later.'], 429);
        }

        $request->validate([
            'email'    => 'required|email|max:255',
            'password' => 'required|min:8|max:128',
            'name'     => 'nullable|max:255',
        ]);

        $email    = strtolower(trim($request->input('email')));
        $password = $request->input('password');
        $name     = $request->input('name', explode('@', $email)[0]);

        $existing = DB::table('users')->where('email', $email)->first();
        if ($existing) {
            return response()->json(['error' => 'An account with this email already exists.'], 400);
        }

        $userId = 'usr_' . Str::uuid()->toString();
        DB::table('users')->insert([
            'id'         => $userId,
            'name'       => $name,
            'email'      => $email,
            'password'   => Hash::make($password),
            'role'       => 'merchant',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = DB::table('users')->where('id', $userId)->first();
        $token = $this->generateJWT([
            'sub'  => $user->id,
            'role' => $user->role,
        ]);

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'email' => $user->email,
                'name'  => $user->name,
                'role'  => $user->role,
            ],
            'session' => [
                'access_token' => $token,
                'token_type'   => 'bearer',
            ],
        ])->header('Set-Cookie', $this->buildCookieHeader($token));
    }

    public function login(Request $request)
    {
        $ip = $request->ip();
        $email = strtolower(trim($request->input('email', '')));

        if (!$this->checkRateLimit("login:{$ip}:{$email}", 5, 1)) {
            return response()->json(['error' => 'Too many login attempts. Please wait 1 minute before trying again.'], 429);
        }

        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = DB::table('users')->where('email', $email)->first();
        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            return response()->json(['error' => 'Invalid email or password.'], 401);
        }

        // Clear rate limit on successful login
        $this->clearRateLimit("login:{$ip}:{$email}");

        $token = $this->generateJWT([
            'sub'  => $user->id,
            'role' => $user->role,
        ]);

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'email' => $user->email,
                'name'  => $user->name,
                'role'  => $user->role,
            ],
            'session' => [
                'access_token' => $token,
                'token_type'   => 'bearer',
            ],
        ])->header('Set-Cookie', $this->buildCookieHeader($token));
    }

    public function logout(Request $request)
    {
        $clearCookie = "creva_auth=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
        return response()->json(['success' => true])->header('Set-Cookie', $clearCookie);
    }

    public function getUser(Request $request)
    {
        $token = $this->extractTokenFromRequest($request);
        if (!$token) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $payload = $this->verifyJWT($token);
        if (!$payload) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        $user = DB::table('users')->where('id', $payload['sub'])->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'email' => $user->email,
                'name'  => $user->name,
                'role'  => $user->role,
            ],
        ]);
    }

    public function verifyToken(Request $request)
    {
        $token = $request->input('token') ?? $this->extractTokenFromRequest($request);
        if (!$token) {
            return response()->json(['error' => 'No token provided'], 400);
        }

        $payload = $this->verifyJWT($token);
        if (!$payload) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        $user = DB::table('users')->where('id', $payload['sub'])->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'email' => $user->email,
                'name'  => $user->name,
                'role'  => $user->role,
            ],
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $ip = $request->ip();
        if (!$this->checkRateLimit("forgot:{$ip}", 3, 60)) {
            return response()->json(['error' => 'Too many password reset requests. Please wait before trying again.'], 429);
        }

        $request->validate(['email' => 'required|email']);
        $email = strtolower(trim($request->input('email')));

        $user = DB::table('users')->where('email', $email)->first();
        // Always return success to prevent user enumeration
        if (!$user) {
            return response()->json(['message' => 'If an account with this email exists, a reset link has been sent.']);
        }

        DB::statement("
            CREATE TABLE IF NOT EXISTS password_resets (
                email VARCHAR(255) PRIMARY KEY,
                token VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");

        $token = Str::random(64);
        DB::table('password_resets')->updateOrInsert(
            ['email' => $email],
            ['token' => $token, 'created_at' => now()]
        );

        $redirectTo = $request->input('redirectTo', env('APP_URL', 'http://localhost:3000') . '/reset-password');
        $resetLink  = $redirectTo . '#access_token=' . $token . '&type=recovery';

        try {
            Mail::send([], [], function ($message) use ($email, $resetLink) {
                $message->to($email)
                    ->subject('Reset Your Password — Creva Webzz')
                    ->html('
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;background:#fff;">
                            <h2 style="color:#3C77C3;margin:0 0 8px;">Creva Webzz</h2>
                            <p style="color:#777;margin:0 0 24px;font-size:14px;">Store Management Portal</p>
                            <p style="font-size:16px;color:#333;line-height:1.5;">You requested a password reset for your store account.</p>
                            <div style="text-align:center;margin:30px 0;">
                                <a href="' . htmlspecialchars($resetLink) . '" style="background:#3C77C3;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;">Reset Password</a>
                            </div>
                            <p style="font-size:13px;color:#555;">This link expires in 60 minutes. If you did not request this, ignore this email.</p>
                        </div>
                    ');
            });
        } catch (\Exception $e) {
            Log::error("Password reset email failed for {$email}: " . $e->getMessage());
        }

        return response()->json(['message' => 'If an account with this email exists, a reset link has been sent.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required',
            'password' => 'required|min:8|max:128',
        ]);

        $token = $request->input('token');
        $resetRecord = DB::table('password_resets')->where('token', $token)->first();

        if (!$resetRecord) {
            return response()->json(['error' => 'Invalid or expired reset token.'], 400);
        }

        // Token expires after 60 minutes
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            DB::table('password_resets')->where('token', $token)->delete();
            return response()->json(['error' => 'This password reset link has expired. Please request a new one.'], 400);
        }

        DB::table('users')
            ->where('email', $resetRecord->email)
            ->update([
                'password'   => Hash::make($request->input('password')),
                'updated_at' => now(),
            ]);

        // Delete token after use (one-time use)
        DB::table('password_resets')->where('token', $token)->delete();

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function changePassword(Request $request)
    {
        $token = $this->extractTokenFromRequest($request);
        if (!$token) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $payload = $this->verifyJWT($token);
        if (!$payload) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        $request->validate([
            'currentPassword' => 'required',
            'newPassword'     => 'required|min:8|max:128',
        ]);

        $user = DB::table('users')->where('id', $payload['sub'])->first();
        if (!$user || !Hash::check($request->input('currentPassword'), $user->password)) {
            return response()->json(['error' => 'Current password is incorrect.'], 400);
        }

        DB::table('users')->where('id', $payload['sub'])->update([
            'password'   => Hash::make($request->input('newPassword')),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
