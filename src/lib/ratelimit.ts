import { NextResponse } from "next/server";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries at configurable interval (default: 10 minutes)
const cleanupIntervalMs = parseInt(process.env.RATELIMIT_CLEANUP_INTERVAL_MS || "600000", 10);
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}, cleanupIntervalMs);

export interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
    keyPrefix?: string;  // Optional prefix for the key
}

/**
 * Simple in-memory rate limiter
 * Returns null if allowed, NextResponse with 429 if rate limited
 */
export function checkRateLimit(
    identifier: string, 
    config: RateLimitConfig
): NextResponse | null {
    const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetAt < now) {
        // Create new entry
        entry = {
            count: 1,
            resetAt: now + config.windowMs
        };
        rateLimitStore.set(key, entry);
        return null; // Allowed
    }
    
    if (entry.count >= config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return new NextResponse("Too many requests", {
            status: 429,
            headers: {
                "Retry-After": retryAfter.toString(),
                "X-RateLimit-Limit": config.maxRequests.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": entry.resetAt.toString(),
            }
        });
    }
    
    // Increment counter
    entry.count++;
    return null; // Allowed
}

/**
 * Get client IP from request
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    
    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }
    
    // Fallback to connection IP (may not be available in all environments)
    return "unknown";
}
