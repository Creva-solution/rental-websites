<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StorageController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\VideoCommerceController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\PlatformSettingsController;
use App\Http\Middleware\AuthMiddleware;
use App\Http\Middleware\SuperAdminMiddleware;

// ─── CORS Preflight ────────────────────────────────────────────────────────────

Route::options('{any}', function () {
    return response()->json(['status' => 'OK'], 200)
        ->header('Access-Control-Allow-Origin', corsOrigin())
        ->header('Access-Control-Allow-Credentials', 'true')
        ->header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, X-Requested-With')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
})->where('any', '.*');

if (!function_exists('corsOrigin')) {
    function corsOrigin(): string {
        $origin = request()->header('Origin', '*');
        $allowed = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://crevasolution.in',
            'https://www.crevasolution.in',
        ];
        if (in_array($origin, $allowed, true)) return $origin;
        // Wildcard subdomains of crevasolution.in
        if (preg_match('#^https://[a-z0-9-]+\.crevasolution\.in$#', $origin)) return $origin;
        return 'https://crevasolution.in';
    }
}

// ─── Public Auth Routes ────────────────────────────────────────────────────────

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/user', [AuthController::class, 'getUser']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/verify-token', [AuthController::class, 'verifyToken']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

// ─── Public Storefront Routes (no auth required for customers) ─────────────────

// Stores — read by subdomain/custom_domain for storefront rendering
Route::get('/stores', [StoreController::class, 'index']);
Route::get('/stores/{id}', [StoreController::class, 'show']);

// Products — read for storefront catalog
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Categories — read for storefront
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

// Pages — read for storefront footer/nav
Route::get('/pages', [PageController::class, 'index']);
Route::get('/pages/{id}', [PageController::class, 'show']);

// Blog — read for storefront
Route::get('/blog_posts', [BlogController::class, 'index']);
Route::get('/blog_posts/{id}', [BlogController::class, 'show']);

// Discounts — validate coupon code (customer-facing)
Route::post('/discounts/validate', [DiscountController::class, 'validate']);

// Orders — customers can create orders without account
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/order_items', [OrderController::class, 'storeOrderItems']);

// Storage — uploads used during checkout (payment screenshots)
Route::post('/storage/upload', [StorageController::class, 'upload']);

// Platform Settings — read-only for public
Route::get('/platform-settings', [PlatformSettingsController::class, 'index']);
Route::get('/platform-settings/{key}', [PlatformSettingsController::class, 'show']);

// Video Commerce — public read (storefront needs no auth)
Route::get('/video_sessions', [VideoCommerceController::class, 'index']);

// ─── Authenticated Merchant Routes ─────────────────────────────────────────────

Route::middleware([AuthMiddleware::class])->group(function () {

    // Stores
    Route::post('/stores', [StoreController::class, 'store']);
    Route::put('/stores/{id}', [StoreController::class, 'update']);
    Route::delete('/stores/{id?}', [StoreController::class, 'destroy']);

    // Products
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id?}', [ProductController::class, 'destroy']);

    // Orders (merchant management)
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::delete('/orders/{id?}', [OrderController::class, 'destroy']);
    Route::delete('/order_items/{id?}', [OrderController::class, 'destroyOrderItems']);

    // Categories
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Discounts
    Route::get('/discounts', [DiscountController::class, 'index']);
    Route::post('/discounts', [DiscountController::class, 'store']);
    Route::put('/discounts/{id}', [DiscountController::class, 'update']);
    Route::delete('/discounts/{id}', [DiscountController::class, 'destroy']);

    // Blog Posts
    Route::post('/blog_posts', [BlogController::class, 'store']);
    Route::put('/blog_posts/{id}', [BlogController::class, 'update']);
    Route::delete('/blog_posts/{id}', [BlogController::class, 'destroy']);

    // Pages
    Route::post('/pages', [PageController::class, 'store']);
    Route::put('/pages/{id}', [PageController::class, 'update']);
    Route::delete('/pages/{id}', [PageController::class, 'destroy']);

    // Video Commerce (write — auth required)
    Route::post('/video_sessions', [VideoCommerceController::class, 'store']);
    Route::put('/video_sessions/{id}', [VideoCommerceController::class, 'update']);
    Route::delete('/video_sessions/{id}', [VideoCommerceController::class, 'destroy']);

    // Integrations
    Route::get('/integrations', [IntegrationController::class, 'index']);
    Route::post('/integrations', [IntegrationController::class, 'store']);
    Route::put('/integrations/{id}', [IntegrationController::class, 'update']);
    Route::delete('/integrations/{id}', [IntegrationController::class, 'destroy']);

    // Storage (authenticated uploads)
    Route::post('/storage/delete', [StorageController::class, 'delete']);
    Route::delete('/storage/delete', [StorageController::class, 'delete']);
});

// ─── Super Admin Only Routes ───────────────────────────────────────────────────

Route::middleware([AuthMiddleware::class, SuperAdminMiddleware::class])->group(function () {

    // Platform Settings (write)
    Route::post('/platform-settings', [PlatformSettingsController::class, 'store']);
    Route::put('/platform-settings/{key}', [PlatformSettingsController::class, 'update']);
    Route::delete('/platform-settings/{key}', [PlatformSettingsController::class, 'destroy']);

    // Super Admin: manage all stores
    Route::get('/admin/stores', [StoreController::class, 'adminIndex']);
    Route::put('/admin/stores/{id}/status', [StoreController::class, 'updateStatus']);
});
