<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('stores');

        if ($request->has('owner_id')) {
            $query->where('owner_id', $request->input('owner_id'));
        }

        if ($request->has('subdomain')) {
            $query->where('subdomain', $request->input('subdomain'));
        }

        if ($request->has('custom_domain')) {
            $query->where('custom_domain', $request->input('custom_domain'));
        }

        $stores = $query->get();
        return response()->json($stores);
    }

    public function show($id)
    {
        $store = DB::table('stores')->where('id', $id)->first();
        if (!$store) {
            return response()->json(['error' => 'Store not found'], 404);
        }
        return response()->json($store);
    }

    public function store(Request $request)
    {
        $request->validate([
            'owner_id' => 'required',
            'store_name' => 'required',
            'subdomain' => 'required'
        ]);

        $id = 'store_' . Str::uuid()->toString();

        // Check subdomain uniqueness
        $exists = DB::table('stores')->where('subdomain', $request->input('subdomain'))->first();
        if ($exists) {
            return response()->json(['error' => 'Subdomain is already taken'], 400);
        }

        DB::table('stores')->insert([
            'id' => $id,
            'owner_id' => $request->input('owner_id'),
            'store_name' => $request->input('store_name'),
            'subdomain' => $request->input('subdomain'),
            'custom_domain' => $request->input('custom_domain'),
            'logo_url' => $request->input('logo_url'),
            'primary_color' => $request->input('primary_color', '#3C77C3'),
            'currency' => $request->input('currency', 'INR'),
            'contact_phone' => $request->input('contact_phone'),
            'contact_email' => $request->input('contact_email'),
            'description' => $request->input('description'),
            'billing_plan' => $request->input('billing_plan'),
            'billing_price' => $request->input('billing_price'),
            'plan_starts_at' => $request->input('plan_starts_at'),
            'plan_ends_at' => $request->input('plan_ends_at'),
            'status' => $request->input('status', 'active'),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $store = DB::table('stores')->where('id', $id)->first();
        return response()->json($store);
    }

    public function update(Request $request, $id)
    {
        $store = DB::table('stores')->where('id', $id)->first();
        if (!$store) {
            return response()->json(['error' => 'Store not found'], 404);
        }

        $data = $request->except(['id', 'owner_id', 'created_at', 'updated_at']);
        $data['updated_at'] = now();

        DB::table('stores')->where('id', $id)->update($data);

        $updatedStore = DB::table('stores')->where('id', $id)->first();
        return response()->json($updatedStore);
    }

    public function destroy(Request $request, $id = null)
    {
        if ($id) {
            $deleted = DB::table('stores')->where('id', $id)->delete();
        } else {
            $query = DB::table('stores');
            if ($request->has('owner_id')) {
                $query->where('owner_id', $request->input('owner_id'));
            }
            $deleted = $query->delete();
        }
        return response()->json(['success' => true]);
    }
}
