<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('products');

        if ($request->has('store_id')) {
            $query->where('store_id', $request->input('store_id'));
        }

        $products = $query->orderBy('created_at', 'desc')->get();
        return response()->json($products);
    }

    public function show($id)
    {
        $product = DB::table('products')->where('id', $id)->first();
        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }
        return response()->json($product);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required',
            'name' => 'required',
            'price' => 'required'
        ]);

        $id = 'prod_' . Str::uuid()->toString();

        DB::table('products')->insert([
            'id' => $id,
            'store_id' => $request->input('store_id'),
            'name' => $request->input('name'),
            'price' => $request->input('price'),
            'sku' => $request->input('sku'),
            'description' => $request->input('description'),
            'is_active' => $request->input('is_active', 1),
            'inventory_quantity' => $request->input('inventory_quantity', 10),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $product = DB::table('products')->where('id', $id)->first();
        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $product = DB::table('products')->where('id', $id)->first();
        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $data = $request->except(['id', 'store_id', 'created_at', 'updated_at']);
        $data['updated_at'] = now();

        DB::table('products')->where('id', $id)->update($data);

        $updated = DB::table('products')->where('id', $id)->first();
        return response()->json($updated);
    }

    public function destroy(Request $request, $id = null)
    {
        if ($id) {
            $deleted = DB::table('products')->where('id', $id)->delete();
        } else {
            $query = DB::table('products');
            if ($request->has('store_id')) {
                $query->where('store_id', $request->input('store_id'));
            }
            $deleted = $query->delete();
        }
        return response()->json(['success' => true]);
    }
}
