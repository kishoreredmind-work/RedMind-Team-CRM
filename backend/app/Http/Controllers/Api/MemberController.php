<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Notification;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class MemberController extends ApiController
{
    public function index()
    {
        $users = User::orderBy('name', 'ASC')->get();
        
        $mapped = $users->map(function($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'status' => $u->status
            ];
        });

        return $this->respond(true, $mapped);
    }

    public function show($id)
    {
        $user = User::find($id);
        if (!$user) {
            return $this->respond(false, null, 'Member not found');
        }

        return $this->respond(true, [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status
        ]);
    }

    public function store(Request $request)
    {
        $name = $request->input('name');
        $email = $request->input('email');
        $password = $request->input('password');
        $role = $request->input('role', 'MEMBER');
        $status = $request->input('status', 'APPROVED'); // Default active when created by admin

        if (!$name || !$email || !$password) {
            return $this->respond(false, null, 'Name, email and password are required');
        }

        if (User::where('email', $email)->exists()) {
            return $this->respond(false, null, 'A member with this email already exists');
        }

        $memberId = (string) Str::uuid();
        $user = User::create([
            'id' => $memberId,
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => $role,
            'status' => $status
        ]);

        $body = MailService::renderTemplate('welcome_member', [
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'loginUrl' => env('VITE_API_URL') ?: 'http://localhost:3000'
        ]);
        MailService::sendHtmlMail($email, "Welcome to Redmin Team CRM", $body);

        return $this->respond(true, [
            'id' => $memberId,
            'name' => $name,
            'email' => $email
        ], null, 'Member created successfully');
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return $this->respond(false, null, 'Member not found');
        }

        $existingStatus = $user->status;
        
        $user->name = $request->input('name') ?: $user->name;
        $user->role = $request->input('role') ?: $user->role;
        $user->status = $request->input('status') ?: $user->status;

        if ($user->save()) {
            $shouldNotify = ($user->status === 'APPROVED' && $existingStatus !== 'APPROVED');
            if ($shouldNotify) {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $id,
                    'message' => "Your account has been approved by the Lead.",
                    'link' => '/'
                ]);

                $body = MailService::renderTemplate('account_approved', [
                    'name' => $user->name,
                    'loginUrl' => env('VITE_API_URL') ?: 'http://localhost:3000'
                ]);
                MailService::sendHtmlMail($user->email, "Your RedMind CRM Account is Approved", $body);
            }
            return $this->respond(true, null, null, 'Member updated successfully');
        }

        return $this->respond(false, null, 'Failed to update member');
    }

    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return $this->respond(false, null, 'Member not found');
        }

        $user->delete();
        return $this->respond(true, null, null, 'Member deleted successfully');
    }
}
