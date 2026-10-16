<?php

namespace App\Services;

class JwtService
{
    /**
     * Get JWT Secret Key.
     */
    private static function getSecret()
    {
        return env('JWT_SECRET') ?: 'default_redmin_crm_secret_key_12345';
    }

    /**
     * Generate JWT Token.
     */
    public static function generateToken($userId, $role)
    {
        $secret = self::getSecret();
        $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $payload = json_encode([
            'user_id' => $userId,
            'role' => $role,
            'exp' => time() + (86400 * 30) // 30 days
        ]);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Verify JWT Token and return payload if valid.
     */
    public static function verifyToken($token)
    {
        if (!$token) return null;
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        
        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
        $secret = self::getSecret();
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if (!hash_equals($expectedSignature, $base64UrlSignature)) return null;
        
        $payload = json_decode(base64_decode(str_replace(['-','_'], ['+','/'], $base64UrlPayload)), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }
        
        return $payload;
    }
}
