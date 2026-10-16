<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\JwtService;
use Symfony\Component\HttpFoundation\Response;

class JwtAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization') ?? '';
        
        // Fallback for Apache/PHP CGI/FastCGI environments
        if (empty($authHeader)) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        }
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            $payload = JwtService::verifyToken($token);
            if ($payload) {
                // Attach user metadata to request
                $request->merge(['authenticated_user' => $payload]);
                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'error' => 'Unauthorized: Invalid or missing token'
        ], 401);
    }
}
