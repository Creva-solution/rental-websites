<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlatformSettingsController extends Controller
{
    public function index()
    {
        $settings = DB::table('platform_settings')->get();
        return response()->json($settings);
    }

    public function show($key)
    {
        $setting = DB::table('platform_settings')->where('key', $key)->first();
        if (!$setting) {
            return response()->json(['error' => 'Setting not found'], 404);
        }
        return response()->json($setting);
    }

    public function store(Request $request)
    {
        $request->validate([
            'key'   => 'required|max:255',
            'value' => 'required',
        ]);

        $key   = $request->input('key');
        $value = is_array($request->input('value'))
            ? json_encode($request->input('value'))
            : $request->input('value');

        DB::table('platform_settings')->updateOrInsert(
            ['key' => $key],
            ['value' => $value, 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(DB::table('platform_settings')->where('key', $key)->first(), 201);
    }

    public function update(Request $request, $key)
    {
        $value = $request->input('value');
        if (is_array($value)) $value = json_encode($value);

        DB::table('platform_settings')->updateOrInsert(
            ['key' => $key],
            ['value' => $value, 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json(DB::table('platform_settings')->where('key', $key)->first());
    }

    public function destroy($key)
    {
        DB::table('platform_settings')->where('key', $key)->delete();
        return response()->json(['success' => true]);
    }
}
