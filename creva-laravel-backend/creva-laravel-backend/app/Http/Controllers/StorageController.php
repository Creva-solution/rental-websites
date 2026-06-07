<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StorageController extends Controller
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    private const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    public function upload(Request $request)
    {
        $publicDir = public_path('uploads');
        if (!file_exists($publicDir)) {
            mkdir($publicDir, 0755, true);
        }

        // ── Base64 image upload (product/logo cropper) ──────────────────────
        if ($request->has('base64')) {
            $base64Data = $request->input('base64');

            if (!preg_match('/^data:image\/(\w+);base64,/', $base64Data, $match)) {
                return response()->json(['error' => 'Invalid base64 image format.'], 400);
            }

            $ext = strtolower($match[1]);
            if (!in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
                return response()->json(['error' => 'Unsupported image type. Allowed: jpg, png, webp, gif.'], 400);
            }

            $raw = base64_decode(substr($base64Data, strpos($base64Data, ',') + 1));
            if ($raw === false) {
                return response()->json(['error' => 'Base64 decode failed.'], 400);
            }

            if (strlen($raw) > self::MAX_FILE_SIZE_BYTES) {
                return response()->json(['error' => 'Image exceeds maximum size of 5 MB.'], 400);
            }

            // Verify it's actually an image by checking magic bytes
            if (!$this->isValidImageBytes($raw)) {
                return response()->json(['error' => 'File content does not match a valid image.'], 400);
            }

            $fileName = Str::random(16) . '_' . time() . '.' . $ext;
            file_put_contents($publicDir . '/' . $fileName, $raw);

            $url = asset('uploads/' . $fileName);
            return response()->json(['url' => $url, 'publicUrl' => $url, 'filePath' => 'uploads/' . $fileName]);
        }

        // ── Multipart file upload ────────────────────────────────────────────
        if ($request->hasFile('file')) {
            $file = $request->file('file');

            if (!$file->isValid()) {
                return response()->json(['error' => 'File upload failed or was corrupted.'], 400);
            }

            if ($file->getSize() > self::MAX_FILE_SIZE_BYTES) {
                return response()->json(['error' => 'File exceeds maximum size of 5 MB.'], 400);
            }

            $mimeType = $file->getMimeType();
            if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
                return response()->json(['error' => 'Unsupported file type. Only images (JPG, PNG, WebP, GIF) are allowed.'], 400);
            }

            $ext = strtolower($file->getClientOriginalExtension());
            if (!in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
                // Derive extension from mime type as fallback
                $ext = explode('/', $mimeType)[1] ?? 'jpg';
                $ext = $ext === 'jpeg' ? 'jpg' : $ext;
            }

            $fileName = Str::random(16) . '_' . time() . '.' . $ext;
            $file->move($publicDir, $fileName);

            $url = asset('uploads/' . $fileName);
            return response()->json(['url' => $url, 'publicUrl' => $url, 'filePath' => 'uploads/' . $fileName]);
        }

        return response()->json(['error' => 'No file provided.'], 400);
    }

    public function delete(Request $request)
    {
        $filePath = $request->input('filePath');
        if (!$filePath) {
            return response()->json(['error' => 'No file path provided.'], 400);
        }

        // Prevent directory traversal attacks
        $fileName = basename($filePath);
        if ($fileName !== $filePath && !str_starts_with($filePath, 'uploads/')) {
            return response()->json(['error' => 'Invalid file path.'], 400);
        }

        $fullPath = public_path('uploads/' . $fileName);

        // Ensure path is inside uploads directory
        $uploadsDir = realpath(public_path('uploads'));
        $resolvedPath = realpath($fullPath);

        if ($resolvedPath && $uploadsDir && !str_starts_with($resolvedPath, $uploadsDir)) {
            return response()->json(['error' => 'Access denied.'], 403);
        }

        if ($resolvedPath && file_exists($resolvedPath)) {
            unlink($resolvedPath);
            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'File not found.'], 404);
    }

    private function isValidImageBytes(string $data): bool
    {
        // Check magic bytes for common image formats
        if (strlen($data) < 4) return false;

        $bytes = substr($data, 0, 4);

        // JPEG: FF D8 FF
        if (substr($bytes, 0, 3) === "\xFF\xD8\xFF") return true;
        // PNG: 89 50 4E 47
        if ($bytes === "\x89PNG") return true;
        // GIF: 47 49 46 38
        if (substr($bytes, 0, 3) === 'GIF') return true;
        // WebP: check RIFF....WEBP
        if (substr($bytes, 0, 4) === 'RIFF' && substr($data, 8, 4) === 'WEBP') return true;

        return false;
    }
}
