<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IntegrationController extends Controller
{
    private const ALLOWED_TYPES = [
        'google_analytics',
        'facebook_pixel',
        'whatsapp_business',
        'google_tag_manager',
        'hotjar',
        'crisp_chat',
        'mailchimp',
        'razorpay',
        'shiprocket',
    ];

    public function index(Request $request)
    {
        $query = DB::table('integrations');

        if ($request->has('store_id')) {
            $query->where('store_id', $request->input('store_id'));
        }

        $integrations = $query->orderBy('type', 'asc')->get();

        return response()->json($integrations->map(function ($i) {
            $i->config = json_decode($i->config ?? '{}', true);
            return $i;
        }));
    }

    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required',
            'type'     => 'required|in:' . implode(',', self::ALLOWED_TYPES),
        ]);

        $storeId = $request->input('store_id');
        $type    = $request->input('type');
        $config  = $request->input('config', []);

        DB::table('integrations')->updateOrInsert(
            ['store_id' => $storeId, 'type' => $type],
            [
                'config'     => json_encode($config),
                'is_active'  => (bool) $request->input('is_active', true),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        $integration = DB::table('integrations')->where('store_id', $storeId)->where('type', $type)->first();
        $integration->config = json_decode($integration->config ?? '{}', true);

        return response()->json($integration, 201);
    }

    public function update(Request $request, $id)
    {
        $integration = DB::table('integrations')->where('id', $id)->first();
        if (!$integration) {
            return response()->json(['error' => 'Integration not found'], 404);
        }

        $data = [];
        if ($request->has('config')) {
            $data['config'] = json_encode($request->input('config'));
        }
        if ($request->has('is_active')) {
            $data['is_active'] = (bool) $request->input('is_active');
        }
        $data['updated_at'] = now();

        DB::table('integrations')->where('id', $id)->update($data);

        $updated = DB::table('integrations')->where('id', $id)->first();
        $updated->config = json_decode($updated->config ?? '{}', true);

        return response()->json($updated);
    }

    public function destroy($id)
    {
        $integration = DB::table('integrations')->where('id', $id)->first();
        if (!$integration) {
            return response()->json(['error' => 'Integration not found'], 404);
        }

        DB::table('integrations')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}
