<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Services\JwtService;
use Illuminate\Support\Str;

class AuthController extends ApiController
{
    public function changePassword(Request $request)
    {
        $auth = $this->authenticatedUser($request);
        $currentPassword = $request->input('currentPassword');
        $newPassword = $request->input('newPassword');

        if (!$currentPassword || !$newPassword || strlen($newPassword) < 12) {
            return $this->respond(false, null, 'Current password and a new password of at least 12 characters are required');
        }

        $user = User::find($auth['user_id']);
        if (!$user || !Hash::check($currentPassword, $user->password)) {
            return $this->respond(false, null, 'Current password is incorrect');
        }

        $user->password = Hash::make($newPassword);
        $user->save();
        return $this->respond(true, null, null, 'Password changed successfully');
    }

    public function forgotPassword(Request $request)
    {
        $email = strtolower(trim((string) $request->input('email')));
        $user = User::where('email', $email)->first();

        if ($user) {
            $token = Str::random(64);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                ['token' => hash('sha256', $token), 'created_at' => now()]
            );

            $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
            $resetUrl = $frontendUrl . '/?token=' . urlencode($token) . '&email=' . urlencode($email);
            $body = '<h2>Reset your RedMind CRM password</h2><p>Use this link within 60 minutes:</p><p><a href="' . e($resetUrl) . '">' . e($resetUrl) . '</a></p><p>If you did not request this, you can ignore this email.</p>';
            \App\Services\MailService::sendHtmlMail($user->email, 'RedMind CRM password reset', $body);
        }

        return $this->respond(true, null, null, 'If that email belongs to an account, a password reset link has been sent.');
    }

    public function resetPassword(Request $request)
    {
        $email = strtolower(trim((string) $request->input('email')));
        $token = (string) $request->input('token');
        $password = (string) $request->input('password');

        if (!$email || !$token || strlen($password) < 12) {
            return $this->respond(false, null, 'Email, reset token, and a password of at least 12 characters are required');
        }

        $reset = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('created_at', '>', now()->subHour())
            ->first();

        if (!$reset || !hash_equals($reset->token, hash('sha256', $token))) {
            return $this->respond(false, null, 'This reset link is invalid or expired');
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return $this->respond(false, null, 'This reset link is invalid or expired');
        }

        $user->password = Hash::make($password);
        $user->save();
        DB::table('password_reset_tokens')->where('email', $email)->delete();
        return $this->respond(true, null, null, 'Password reset successfully');
    }

    /**
     * Handle user login.
     */
    public function login(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');
        $ip = $request->ip();

        if (!$email || !$password) {
            return $this->respond(false, null, 'Email and password are required');
        }

        // Rate Limit check (5 attempts in 15 mins)
        $failedCount = DB::table('login_attempts')
            ->where(function($query) use ($ip, $email) {
                $query->where('ip', $ip)->orWhere('email', $email);
            })
            ->where('attempted_at', '>', now()->subMinutes(15))
            ->count();

        if ($failedCount >= 5) {
            return $this->respond(false, null, 'Too many login attempts. Please try again after 15 minutes.');
        }

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            // Log failed attempt
            DB::table('login_attempts')->insert([
                'ip' => $ip,
                'email' => $email,
                'attempted_at' => now()
            ]);
            return $this->respond(false, null, 'Invalid credentials');
        }

        if ($user->status !== 'APPROVED') {
            return $this->respond(false, null, 'Forbidden: Your account status is ' . $user->status . '. Please contact your Lead for activation.');
        }

        // Generate token
        $token = JwtService::generateToken($user->id, $user->role);

        return $this->respond(true, [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'status' => $user->status,
            'token' => $token
        ], null, 'Login successful');
    }

    /**
     * Handle user registration.
     */
    public function signup(Request $request)
    {
        $name = $request->input('name');
        $email = $request->input('email');
        $password = $request->input('password');

        if (!$name || !$email || !$password) {
            return $this->respond(false, null, 'Name, email and password are required');
        }

        if (User::where('email', $email)->exists()) {
            return $this->respond(false, null, 'A member with this email already exists');
        }

        $userId = (string) Str::uuid();
        $user = User::create([
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'MEMBER',
            'status' => 'PENDING'
        ]);

        return $this->respond(true, [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email
        ], null, 'Account created successfully! Please wait for admin approval.');
    }

    /**
     * Get profile.
     */
    public function getProfile(Request $request, $id)
    {
        $auth = $this->authenticatedUser($request);
        if ($auth['user_id'] !== $id && $auth['role'] !== 'LEAD') {
            return $this->respond(false, null, 'Forbidden: Access denied to this profile', null, 403);
        }

        $user = User::find($id);
        if (!$user) {
            return $this->respond(false, null, 'User not found');
        }

        return $this->respond(true, [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status
        ]);
    }

    /**
     * Update profile.
     */
    public function updateProfile(Request $request, $id)
    {
        $auth = $this->authenticatedUser($request);
        if ($auth['user_id'] !== $id && $auth['role'] !== 'LEAD') {
            return $this->respond(false, null, 'Forbidden: Access denied to this profile', null, 403);
        }

        $user = User::find($id);
        if (!$user) {
            return $this->respond(false, null, 'User not found');
        }

        $user->name = $request->input('name') ?: $user->name;
        $user->email = $request->input('email') ?: $user->email;

        if ($request->input('password')) {
            $user->password = Hash::make($request->input('password'));
        }

        if ($user->save()) {
            return $this->respond(true, null, null, 'Profile updated successfully');
        }

        return $this->respond(false, null, 'Failed to update profile');
    }

    /**
     * Handle user logout.
     */
    public function logout()
    {
        return $this->respond(true, null, null, 'Logged out successfully');
    }
}
