<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StorageController extends Controller
{
    public function upload(Request $request)
    {
        $publicDir = public_path('uploads');
        if (!file_exists($publicDir)) {
            mkdir($publicDir, 0755, true);
        }

        // Support base64 image uploads (commonly used in product cropper)
        if ($request->has('base64')) {
            $base64Data = $request->input('base64');
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
                $type = strtolower($type[1]); // png, jpg, jpeg
                if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
                    return response()->json(['error' => 'Invalid image type'], 400);
                }
                $data = base64_decode($base64Data);
                if ($data === false) {
                    return response()->json(['error' => 'Base64 decode failed'], 400);
                }
            } else {
                return response()->json(['error' => 'Invalid base64 structure'], 400);
            }

            $fileName = Str::random(10) . '_' . time() . '.' . $type;
            file_put_contents($publicDir . '/' . $fileName, $data);

            $publicUrl = asset('uploads/' . $fileName);
            return response()->json([
                'publicUrl' => $publicUrl,
                'filePath' => 'uploads/' . $fileName
            ]);
        }

        // Support standard multipart form file uploads
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = Str::random(10) . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move($publicDir, $fileName);

            $publicUrl = asset('uploads/' . $fileName);
            return response()->json([
                'publicUrl' => $publicUrl,
                'filePath' => 'uploads/' . $fileName
            ]);
        }

        return response()->json(['error' => 'No file provided'], 400);
    }
}
