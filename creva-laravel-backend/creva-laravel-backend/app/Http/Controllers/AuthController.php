<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'name' => 'nullable'
        ]);

        $email = $request->input('email');
        $password = $request->input('password');
        $name = $request->input('name', explode('@', $email)[0]);

        $existing = DB::table('users')->where('email', $email)->first();
        if ($existing) {
            return response()->json([
                'error' => 'User already exists'
            ], 400);
        }

        $userId = 'usr_' . Str::uuid()->toString();
        DB::table('users')->insert([
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'merchant',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $user = DB::table('users')->where('id', $userId)->first();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role
            ],
            'session' => [
                'access_token' => 'jwt_demo_token_' . $user->id,
                'token_type' => 'bearer',
                'user' => $user
            ]
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $email = $request->input('email');
        $password = $request->input('password');

        $user = DB::table('users')->where('email', $email)->first();
        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'error' => 'Invalid email or password'
            ], 400);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role
            ],
            'session' => [
                'access_token' => 'jwt_demo_token_' . $user->id,
                'token_type' => 'bearer',
                'user' => $user
            ]
        ]);
    }

    public function logout()
    {
        return response()->json(['success' => true]);
    }

    public function getUser(Request $request)
    {
        $authHeader = $request->header('Authorization', '');
        if (strpos($authHeader, 'jwt_demo_token_') !== false) {
            $userId = str_replace('Bearer jwt_demo_token_', '', $authHeader);
            $user = DB::table('users')->where('id', $userId)->first();
            if ($user) {
                return response()->json([
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->name,
                        'role' => $user->role
                    ]
                ]);
            }
        }

        return response()->json(['error' => 'Unauthorized'], 401);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $email = $request->input('email');

        // Check if user exists
        $user = DB::table('users')->where('email', $email)->first();
        if (!$user) {
            return response()->json([
                'error' => 'We can\'t find a user with that email address.'
            ], 400);
        }

        // Ensure table exists
        DB::statement('CREATE TABLE IF NOT EXISTS password_resets (email VARCHAR(255) PRIMARY KEY, token VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');

        // Generate token
        $token = Str::random(64);

        // Save token
        DB::table('password_resets')->where('email', $email)->delete();
        DB::table('password_resets')->insert([
            'email' => $email,
            'token' => $token,
            'created_at' => now()
        ]);

        // Generate link
        $redirectTo = $request->input('redirectTo', 'http://localhost:3000/reset-password');
        $resetLink = $redirectTo . '#access_token=' . $token . '&type=recovery';

        // Send email
        try {
            \Illuminate\Support\Facades\Mail::send([], [], function ($message) use ($email, $resetLink) {
                $message->to($email)
                    ->subject('Reset Password - Creva Webzz')
                    ->html('
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                                <h2 style="color: #3C77C3; margin: 0; font-size: 24px;">Creva Webzz</h2>
                                <p style="color: #777; margin: 5px 0 0 0; font-size: 14px;">Store Management Portal</p>
                            </div>
                            <p style="font-size: 16px; color: #333; line-height: 1.5;">Hello,</p>
                            <p style="font-size: 16px; color: #333; line-height: 1.5;">You are receiving this email because we received a password reset request for your store account.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="' . $resetLink . '" style="background-color: #3C77C3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(60,119,195,0.2);">Reset Password</a>
                            </div>
                            <p style="font-size: 14px; color: #555; line-height: 1.5;">This password reset link is valid for 60 minutes.</p>
                            <p style="font-size: 14px; color: #777; line-height: 1.5;">If you did not request a password reset, no further action is required.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
                            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">This is an automated email. Please do not reply to this email.</p>
                        </div>
                    ');
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send password reset email to {$email}: " . $e->getMessage());
            if (config('app.env') !== 'local') {
                return response()->json(['error' => 'Failed to send reset email. Please try again later.'], 500);
            }
        }

        $res = ['message' => 'Reset link has been sent to your email!'];
        if (config('app.env') === 'local') {
            $res['debug_link'] = $resetLink;
        }

        return response()->json($res);
    }

    public function verifyToken(Request $request)
    {
        $token = $request->input('token');
        if (!$token) {
            $authHeader = $request->header('Authorization', '');
            if (strpos($authHeader, 'Bearer ') !== false) {
                $token = str_replace('Bearer ', '', $authHeader);
            }
        }

        if (!$token) {
            return response()->json(['error' => 'Reset token is required'], 400);
        }

        // Ensure table exists
        DB::statement('CREATE TABLE IF NOT EXISTS password_resets (email VARCHAR(255) PRIMARY KEY, token VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');

        $reset = DB::table('password_resets')->where('token', $token)->first();
        if (!$reset) {
            return response()->json(['error' => 'Invalid or expired reset token'], 400);
        }

        $createdAt = new \DateTime($reset->created_at);
        $now = new \DateTime();
        $diff = $now->getTimestamp() - $createdAt->getTimestamp();
        if ($diff > 3600) {
            DB::table('password_resets')->where('token', $token)->delete();
            return response()->json(['error' => 'Reset token has expired'], 400);
        }

        $user = DB::table('users')->where('email', $reset->email)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role
            ]
        ]);
    }

    public function resetPassword(Request $request)
    {
        $token = $request->input('token');
        if (!$token) {
            $authHeader = $request->header('Authorization', '');
            if (strpos($authHeader, 'Bearer ') !== false) {
                $token = str_replace('Bearer ', '', $authHeader);
            }
        }

        if (!$token) {
            return response()->json(['error' => 'Reset token is required'], 400);
        }

        $password = $request->input('password');
        if (!$password || strlen($password) < 6) {
            return response()->json(['error' => 'Password must be at least 6 characters long'], 400);
        }

        // Ensure table exists
        DB::statement('CREATE TABLE IF NOT EXISTS password_resets (email VARCHAR(255) PRIMARY KEY, token VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');

        $reset = DB::table('password_resets')->where('token', $token)->first();
        if (!$reset) {
            return response()->json(['error' => 'Invalid or expired reset token'], 400);
        }

        $createdAt = new \DateTime($reset->created_at);
        $now = new \DateTime();
        $diff = $now->getTimestamp() - $createdAt->getTimestamp();
        if ($diff > 3600) {
            DB::table('password_resets')->where('token', $token)->delete();
            return response()->json(['error' => 'Reset token has expired'], 400);
        }

        DB::table('users')->where('email', $reset->email)->update([
            'password' => Hash::make($password),
            'updated_at' => now()
        ]);

        DB::table('password_resets')->where('email', $reset->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully'
        ]);
    }
}
