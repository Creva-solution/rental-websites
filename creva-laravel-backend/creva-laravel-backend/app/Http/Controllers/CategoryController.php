<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('categories');

        if ($request->has('store_id')) {
            $query->where('store_id', $request->input('store_id'));
        }

        $categories = $query->orderBy('sort_order', 'asc')->orderBy('name', 'asc')->get();
        return response()->json($categories);
    }

    public function show($id)
    {
        $category = DB::table('categories')->where('id', $id)->first();
        if (!$category) {
            return response()->json(['error' => 'Category not found'], 404);
        }
        return response()->json($category);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required',
            'name'     => 'required|max:255',
        ]);

        $name    = $request->input('name');
        $slug    = $request->input('slug') ?: Str::slug($name);
        $storeId = $request->input('store_id');

        // Ensure slug uniqueness within store
        $base = $slug;
        $i = 1;
        while (DB::table('categories')->where('store_id', $storeId)->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        $id = 'cat_' . Str::uuid()->toString();

        DB::table('categories')->insert([
            'id'          => $id,
            'store_id'    => $storeId,
            'name'        => $name,
            'slug'        => $slug,
            'image_url'   => $request->input('image_url'),
            'sort_order'  => (int) $request->input('sort_order', 0),
            'is_active'   => (bool) $request->input('is_active', true),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json(DB::table('categories')->where('id', $id)->first(), 201);
    }

    public function update(Request $request, $id)
    {
        $category = DB::table('categories')->where('id', $id)->first();
        if (!$category) {
            return response()->json(['error' => 'Category not found'], 404);
        }

        $data = $request->only(['name', 'slug', 'image_url', 'sort_order', 'is_active']);
        if (isset($data['name']) && !isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $data['updated_at'] = now();

        DB::table('categories')->where('id', $id)->update($data);
        return response()->json(DB::table('categories')->where('id', $id)->first());
    }

    public function destroy($id)
    {
        $category = DB::table('categories')->where('id', $id)->first();
        if (!$category) {
            return response()->json(['error' => 'Category not found'], 404);
        }

        // Nullify category_id on products in this category
        DB::table('products')->where('category_id', $id)->update(['category_id' => null]);
        DB::table('categories')->where('id', $id)->delete();

        return response()->json(['success' => true]);
    }
}
