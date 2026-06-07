<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('blog_posts');

        if ($request->has('store_id')) {
            $query->where('store_id', $request->input('store_id'));
        }

        // Public storefront only sees published posts
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $posts = $query->orderBy('created_at', 'desc')->get();
        return response()->json($posts);
    }

    public function show($id)
    {
        $post = DB::table('blog_posts')->where('id', $id)->first();
        if (!$post) {
            // Try by slug
            $post = DB::table('blog_posts')->where('slug', $id)->first();
        }
        if (!$post) {
            return response()->json(['error' => 'Post not found'], 404);
        }
        return response()->json($post);
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

        // Ensure unique slug within store
        $base = $slug;
        $i = 1;
        while (DB::table('blog_posts')->where('store_id', $storeId)->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        $status      = $request->input('status', 'draft');
        $publishedAt = ($status === 'published') ? now() : $request->input('published_at');

        $id = 'blog_' . Str::uuid()->toString();

        DB::table('blog_posts')->insert([
            'id'           => $id,
            'store_id'     => $storeId,
            'title'        => $title,
            'slug'         => $slug,
            'content'      => $request->input('content'),
            'excerpt'      => $request->input('excerpt'),
            'cover_image'  => $request->input('cover_image'),
            'status'       => $status,
            'published_at' => $publishedAt,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(DB::table('blog_posts')->where('id', $id)->first(), 201);
    }

    public function update(Request $request, $id)
    {
        $post = DB::table('blog_posts')->where('id', $id)->first();
        if (!$post) {
            return response()->json(['error' => 'Post not found'], 404);
        }

        $data = $request->only(['title', 'slug', 'content', 'excerpt', 'cover_image', 'status']);

        // Auto-set published_at when publishing for the first time
        if (isset($data['status']) && $data['status'] === 'published' && !$post->published_at) {
            $data['published_at'] = now();
        }

        $data['updated_at'] = now();
        DB::table('blog_posts')->where('id', $id)->update($data);

        return response()->json(DB::table('blog_posts')->where('id', $id)->first());
    }

    public function destroy($id)
    {
        $post = DB::table('blog_posts')->where('id', $id)->first();
        if (!$post) {
            return response()->json(['error' => 'Post not found'], 404);
        }

        DB::table('blog_posts')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
}
