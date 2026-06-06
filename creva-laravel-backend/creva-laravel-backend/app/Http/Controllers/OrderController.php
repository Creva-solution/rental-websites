<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('orders');

        if ($request->has('store_id')) {
            $query->where('store_id', $request->input('store_id'));
        }

        if ($request->has('customer_phone')) {
            $query->where('customer_phone', $request->input('customer_phone'));
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        // Attach order items if requested (to match Supabase inner join/select structure)
        foreach ($orders as $order) {
            $items = DB::table('order_items')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('order_items.order_id', $order->id)
                ->select('order_items.*', 'products.name as product_name')
                ->get();

            // Transform into format client-side expects
            $order->order_items = $items->map(function($item) {
                return [
                    'quantity' => $item->quantity,
                    'price_at_purchase' => $item->price_at_purchase,
                    'products' => [
                        'name' => $item->product_name
                    ]
                ];
            });
        }

        return response()->json($orders);
    }

    public function show($id)
    {
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $items = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('order_items.order_id', $order->id)
            ->select('order_items.*', 'products.name as product_name')
            ->get();

        $order->order_items = $items->map(function($item) {
            return [
                'quantity' => $item->quantity,
                'price_at_purchase' => $item->price_at_purchase,
                'products' => [
                    'name' => $item->product_name
                ]
            ];
        });

        return response()->json($order);
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required',
            'customer_name' => 'required',
            'customer_phone' => 'required',
            'shipping_address' => 'required',
            'total_amount' => 'required'
        ]);

        $id = 'order_' . Str::uuid()->toString();

        $insertData = [
            'id' => $id,
            'store_id' => $request->input('store_id'),
            'customer_name' => $request->input('customer_name'),
            'customer_email' => $request->input('customer_email'),
            'customer_phone' => $request->input('customer_phone'),
            'shipping_address' => $request->input('shipping_address'),
            'total_amount' => $request->input('total_amount'),
            'status' => $request->input('status', 'pending'),
            'created_at' => now(),
            'updated_at' => now()
        ];

        if ($request->has('payment_method')) {
            $insertData['payment_method'] = $request->input('payment_method');
        }
        if ($request->has('payment_status')) {
            $insertData['payment_status'] = $request->input('payment_status');
        }
        if ($request->has('tracking_number')) {
            $insertData['tracking_number'] = $request->input('tracking_number');
        }
        if ($request->has('delivery_date')) {
            $insertData['delivery_date'] = $request->input('delivery_date');
        }
        if ($request->has('payment_screenshot_url')) {
            $insertData['payment_screenshot_url'] = $request->input('payment_screenshot_url');
        }

        DB::table('orders')->insert($insertData);

        // Insert order items if present
        if ($request->has('items') && is_array($request->input('items'))) {
            foreach ($request->input('items') as $item) {
                DB::table('order_items')->insert([
                    'order_id' => $id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price_at_purchase' => $item['price_at_purchase'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        $order = DB::table('orders')->where('id', $id)->first();
        return response()->json($order);
    }

    public function update(Request $request, $id)
    {
        $order = DB::table('orders')->where('id', $id)->first();
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $data = $request->except(['id', 'store_id', 'created_at', 'updated_at', 'order_items', 'items']);
        $data['updated_at'] = now();

        DB::table('orders')->where('id', $id)->update($data);

        // Update items if present
        if ($request->has('items') && is_array($request->input('items'))) {
            DB::table('order_items')->where('order_id', $id)->delete();
            foreach ($request->input('items') as $item) {
                DB::table('order_items')->insert([
                    'order_id' => $id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price_at_purchase' => $item['price_at_purchase'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        $updated = DB::table('orders')->where('id', $id)->first();
        return response()->json($updated);
    }

    public function destroy(Request $request, $id = null)
    {
        if ($id) {
            $deleted = DB::table('orders')->where('id', $id)->delete();
        } else {
            $query = DB::table('orders');
            if ($request->has('store_id')) {
                $query->where('store_id', $request->input('store_id'));
            }
            $deleted = $query->delete();
        }
        return response()->json(['success' => true]);
    }

    public function destroyOrderItems(Request $request)
    {
        $query = DB::table('order_items');

        if ($request->has('order_id')) {
            $orderIdsStr = $request->input('order_id');
            $orderIds = explode(',', $orderIdsStr);
            $query->whereIn('order_id', $orderIds);
        }

        $query->delete();
        return response()->json(['success' => true]);
    }

    public function storeOrderItems(Request $request)
    {
        $data = $request->all();
        
        // Handle both single object or array of objects
        if (is_array($data) && isset($data[0]) && is_array($data[0])) {
            foreach ($data as $item) {
                DB::table('order_items')->insert([
                    'order_id' => $item['order_id'],
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price_at_purchase' => $item['price_at_purchase'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        } else {
            DB::table('order_items')->insert([
                'order_id' => $request->input('order_id'),
                'product_id' => $request->input('product_id'),
                'quantity' => $request->input('quantity'),
                'price_at_purchase' => $request->input('price_at_purchase'),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        return response()->json(['success' => true]);
    }
}
