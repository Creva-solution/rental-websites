<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DiscountController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('discounts');

        if ($request->has('store_id')) {
            $query->where('store_id', $request->input('store_id'));
        }

        $discounts = $query->orderBy('created_at', 'desc')->get();
        return response()->json($discounts);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required',
            'code'     => 'required|max:100',
            'type'     => 'required|in:percentage,fixed',
            'value'    => 'required|numeric|min:0',
        ]);

        $storeId = $request->input('store_id');
        $code    = strtoupper(trim($request->input('code')));

        if (DB::table('discounts')->where('store_id', $storeId)->where('code', $code)->exists()) {
            return response()->json(['error' => 'A coupon with this code already exists in your store.'], 400);
        }

        $id = 'disc_' . Str::uuid()->toString();

        DB::table('discounts')->insert([
            'id'            => $id,
            'store_id'      => $storeId,
            'code'          => $code,
            'type'          => $request->input('type'),
            'value'         => (float) $request->input('value'),
            'minimum_order' => (float) $request->input('minimum_order', 0),
            'max_uses'      => $request->input('max_uses') ? (int) $request->input('max_uses') : null,
            'uses_count'    => 0,
            'is_active'     => (bool) $request->input('is_active', true),
            'expires_at'    => $request->input('expires_at'),
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        return response()->json(DB::table('discounts')->where('id', $id)->first(), 201);
    }

    public function update(Request $request, $id)
    {
        $discount = DB::table('discounts')->where('id', $id)->first();
        if (!$discount) {
            return response()->json(['error' => 'Discount not found'], 404);
        }

        $data = $request->only(['code', 'type', 'value', 'minimum_order', 'max_uses', 'is_active', 'expires_at']);
        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }
        $data['updated_at'] = now();

        DB::table('discounts')->where('id', $id)->update($data);
        return response()->json(DB::table('discounts')->where('id', $id)->first());
    }

    public function destroy($id)
    {
        $discount = DB::table('discounts')->where('id', $id)->first();
        if (!$discount) {
            return response()->json(['error' => 'Discount not found'], 404);
        }

        DB::table('discounts')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    // Customer-facing: validate a coupon code at checkout
    public function validate(Request $request)
    {
        $request->validate([
            'store_id'    => 'required',
            'code'        => 'required',
            'order_total' => 'required|numeric|min:0',
        ]);

        $storeId    = $request->input('store_id');
        $code       = strtoupper(trim($request->input('code')));
        $orderTotal = (float) $request->input('order_total');

        $discount = DB::table('discounts')
            ->where('store_id', $storeId)
            ->where('code', $code)
            ->where('is_active', true)
            ->first();

        if (!$discount) {
            return response()->json(['valid' => false, 'error' => 'Invalid or inactive coupon code.'], 400);
        }

        if ($discount->expires_at && $discount->expires_at < now()) {
            return response()->json(['valid' => false, 'error' => 'This coupon has expired.'], 400);
        }

        if ($discount->max_uses && $discount->uses_count >= $discount->max_uses) {
            return response()->json(['valid' => false, 'error' => 'This coupon has reached its maximum usage limit.'], 400);
        }

        if ($orderTotal < $discount->minimum_order) {
            return response()->json([
                'valid' => false,
                'error' => "Minimum order of ₹{$discount->minimum_order} required for this coupon.",
            ], 400);
        }

        $discountAmount = $discount->type === 'percentage'
            ? round($orderTotal * ($discount->value / 100), 2)
            : min((float) $discount->value, $orderTotal);

        return response()->json([
            'valid'           => true,
            'discount'        => $discount,
            'discount_amount' => $discountAmount,
            'final_total'     => round($orderTotal - $discountAmount, 2),
        ]);
    }
}
