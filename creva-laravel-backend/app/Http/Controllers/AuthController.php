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
}
