<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VideoCommerceController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('video_sessions');

        if ($request->has('store_id')) {
            $query->where('store_id', $request->input('store_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $sessions = $query->orderBy('created_at', 'desc')->get();

        // Decode product_ids JSON for each session
        return response()->json($sessions->map(function ($s) {
            $s->product_ids = json_decode($s->product_ids ?? '[]', true);
            return $s;
        }));
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required',
            'title'    => 'required|max:500',
        ]);

        $id = 'vsn_' . Str::uuid()->toString();

        DB::table('video_sessions')->insert([
            'id'           => $id,
            'store_id'     => $request->input('store_id'),
            'title'        => $request->input('title'),
            'youtube_url'  => $request->input('youtube_url'),
            'product_ids'  => json_encode($request->input('product_ids', [])),
            'status'       => $request->input('status', 'scheduled'),
            'scheduled_at' => $request->input('scheduled_at'),
            'description'  => $request->input('description'),
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $session = DB::table('video_sessions')->where('id', $id)->first();
        $session->product_ids = json_decode($session->product_ids ?? '[]', true);

        return response()->json($session, 201);
    }

    public function update(Request $request, $id)
    {
        $session = DB::table('video_sessions')->where('id', $id)->first();
        if (!$session) {
            return response()->json(['error' => 'Video session not found'], 404);
        }

        $data = $request->only(['title', 'youtube_url', 'status', 'scheduled_at', 'description']);
        if ($request->has('product_ids')) {
            $data['product_ids'] = json_encode($request->input('product_ids'));
        }
        $data['updated_at'] = now();

        DB::table('video_sessions')->where('id', $id)->update($data);

        $updated = DB::table('video_sessions')->where('id', $id)->first();
        $updated->product_ids = json_decode($updated->product_ids ?? '[]', true);

        return response()->json($updated);
    }

    public function destroy($id)
    {
        $session = DB::table('video_sessions')->where('id', $id)->first();
        if (!$session) {
            return response()->json(['error' => 'Video session not found'], 404);
        }

        DB::table('video_sessions')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}
