<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('pages');

        if ($request->has('store_id')) {
            $query->where('store_id', $request->input('store_id'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $pages = $query->orderBy('sort_order', 'asc')->orderBy('title', 'asc')->get();
        return response()->json($pages);
    }

    public function show($id)
    {
        $page = DB::table('pages')->where('id', $id)->first();
        if (!$page) {
            $page = DB::table('pages')->where('slug', $id)->first();
        }
        if (!$page) {
            return response()->json(['error' => 'Page not found'], 404);
        }
        return response()->json($page);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required',
            'title'    => 'required|max:500',
        ]);

        $storeId = $request->input('store_id');
        $title   = $request->input('title');
        $slug    = $request->input('slug') ?: Str::slug($title);

        $base = $slug;
        $i = 1;
        while (DB::table('pages')->where('store_id', $storeId)->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        $id = 'page_' . Str::uuid()->toString();

        DB::table('pages')->insert([
            'id'         => $id,
            'store_id'   => $storeId,
            'title'      => $title,
            'slug'       => $slug,
            'content'    => $request->input('content'),
            'is_active'  => (bool) $request->input('is_active', true),
            'sort_order' => (int) $request->input('sort_order', 0),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(DB::table('pages')->where('id', $id)->first(), 201);
    }

    public function update(Request $request, $id)
    {
        $page = DB::table('pages')->where('id', $id)->first();
        if (!$page) {
            return response()->json(['error' => 'Page not found'], 404);
        }

        $data = $request->only(['title', 'slug', 'content', 'is_active', 'sort_order']);
        $data['updated_at'] = now();

        DB::table('pages')->where('id', $id)->update($data);
        return response()->json(DB::table('pages')->where('id', $id)->first());
    }

    public function destroy($id)
    {
        $page = DB::table('pages')->where('id', $id)->first();
        if (!$page) {
            return response()->json(['error' => 'Page not found'], 404);
        }

        DB::table('pages')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}
