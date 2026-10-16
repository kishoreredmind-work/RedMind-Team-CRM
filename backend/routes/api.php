<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\WorkLogController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ActivityLogController;

// 1. Public Auth routes
Route::post('/auth/signup', [AuthController::class, 'signup']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// 2. Protected routes under Custom JWT Middleware
Route::middleware(['jwt.auth'])->group(function () {
    
    // Auth Profile
    Route::get('/auth/profile/{id}', [AuthController::class, 'getProfile']);
    Route::put('/auth/profile/{id}', [AuthController::class, 'updateProfile']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Clients
    Route::get('/clients', [ClientController::class, 'index']);
    Route::get('/clients/{id}', [ClientController::class, 'show']);
    Route::post('/clients', [ClientController::class, 'store'])->middleware('require.lead');
    Route::put('/clients/{id}', [ClientController::class, 'update'])->middleware('require.lead');
    Route::delete('/clients/{id}', [ClientController::class, 'destroy'])->middleware('require.lead');

    // Projects
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::post('/projects', [ProjectController::class, 'store'])->middleware('require.lead');
    Route::put('/projects/{id}', [ProjectController::class, 'update'])->middleware('require.lead');
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy'])->middleware('require.lead');

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/project/{projectId}', [TaskController::class, 'getByProject']);
    Route::get('/tasks/{id}', [TaskController::class, 'show']);
    Route::post('/tasks', [TaskController::class, 'store'])->middleware('require.lead');
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy'])->middleware('require.lead');

    // Work Logs
    Route::get('/work-logs', [WorkLogController::class, 'index']);
    Route::get('/work-logs/user/{userId}', [WorkLogController::class, 'getByUser']);
    Route::get('/work-logs/{id}', [WorkLogController::class, 'show']);
    Route::post('/work-logs', [WorkLogController::class, 'store']);
    Route::put('/work-logs/{id}', [WorkLogController::class, 'update']);
    Route::delete('/work-logs/{id}', [WorkLogController::class, 'destroy']);

    // Comments
    Route::get('/comments/task/{taskId}', [CommentController::class, 'getByTask']);
    Route::post('/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);

    // Members
    Route::get('/members', [MemberController::class, 'index']);
    Route::get('/members/{id}', [MemberController::class, 'show']);
    Route::post('/members', [MemberController::class, 'store'])->middleware('require.lead');
    Route::put('/members/{id}', [MemberController::class, 'update'])->middleware('require.lead');
    Route::delete('/members/{id}', [MemberController::class, 'destroy'])->middleware('require.lead');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::put('/notifications/{id}', [NotificationController::class, 'update']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Activity Logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->middleware('require.lead');
});
