<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class MailService
{
    public static function sendHtmlMail($to, $subject, $htmlBody)
    {
        try {
            Mail::html($htmlBody, function ($message) use ($to, $subject) {
                $message->to($to)
                        ->subject($subject);
            });
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send mail: " . $e->getMessage());
            
            // Fallback to PHP's built-in mail() function
            $fromEmail = env('SMTP_FROM') ?: 'no-reply@mydomain.com';
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: Redmin CRM <" . $fromEmail . ">\r\n";
            return @mail($to, $subject, $htmlBody, $headers);
        }
    }

    public static function renderTemplate($templateName, $data)
    {
        // Simple HTML templates matching custom PHP templates
        if ($templateName === 'project_assignment') {
            return "
                <h2>Project Assignment Notification</h2>
                <p>Hi " . htmlspecialchars($data['name']) . ",</p>
                <p>You have been assigned to the project: <strong>" . htmlspecialchars($data['projectName']) . "</strong>.</p>
                <p>Please log in to your dashboard to view the project scope: <a href='" . htmlspecialchars($data['loginUrl']) . "'>" . htmlspecialchars($data['loginUrl']) . "</a></p>
            ";
        }
        if ($templateName === 'task_assignment') {
            return "
                <h2>Task Assignment Notification</h2>
                <p>Hi " . htmlspecialchars($data['name']) . ",</p>
                <p>You have been assigned to a new task: <strong>" . htmlspecialchars($data['taskTitle']) . "</strong>.</p>
                <p>Please check your task queue: <a href='" . htmlspecialchars($data['loginUrl']) . "'>" . htmlspecialchars($data['loginUrl']) . "</a></p>
            ";
        }
        if ($templateName === 'task_status_update') {
            return "
                <h2>Task Status Update</h2>
                <p>Hi " . htmlspecialchars($data['leadName']) . ",</p>
                <p><strong>" . htmlspecialchars($data['memberName']) . "</strong> has updated the status of task <strong>\"" . htmlspecialchars($data['taskTitle']) . "\"</strong> to <strong>\"" . htmlspecialchars($data['status']) . "\"</strong>.</p>
                <p>View workload synchronizer: <a href='" . htmlspecialchars($data['loginUrl']) . "'>" . htmlspecialchars($data['loginUrl']) . "</a></p>
            ";
        }
        if ($templateName === 'welcome_member') {
            return "
                <h2>Welcome to Redmin Team CRM</h2>
                <p>Hi " . htmlspecialchars($data['name']) . ",</p>
                <p>An account has been created for you on Redmin Team CRM.</p>
                <p><strong>Login Credentials:</strong></p>
                <ul>
                    <li>Email: " . htmlspecialchars($data['email']) . "</li>
                    <li>Password: " . htmlspecialchars($data['password']) . "</li>
                </ul>
                <p>Please log in here: <a href='" . htmlspecialchars($data['loginUrl']) . "'>" . htmlspecialchars($data['loginUrl']) . "</a></p>
            ";
        }
        if ($templateName === 'account_approved') {
            return "
                <h2>Your Account has been Approved</h2>
                <p>Hi " . htmlspecialchars($data['name']) . ",</p>
                <p>Your account on Redmin Team CRM has been approved by the Lead. You can now log in to the dashboard.</p>
                <p>Access dashboard: <a href='" . htmlspecialchars($data['loginUrl']) . "'>" . htmlspecialchars($data['loginUrl']) . "</a></p>
            ";
        }
        return "";
    }
}
