import { NextResponse } from "next/server";
import { getUsers } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
    // Rate limit: 5 attempts per 15 minutes per IP
    const clientIp = getClientIp(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
        windowMs: parseInt(process.env.RATELIMIT_LOGIN_WINDOW_MS || "900000", 10),
        maxRequests: parseInt(process.env.RATELIMIT_LOGIN_MAX_REQUESTS || "5", 10),
        keyPrefix: "login"
    });
    
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    try {
        const { username, password } = await req.json();

        const users = getUsers();
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return new NextResponse("Invalid credentials", { status: 401 });
        }

        const token = await createToken(user.id);
        const res = NextResponse.json({
            success: true,
            user: { id: user.id, username: user.username, displayName: user.displayName || user.username }
        });

        const sameSite = (process.env.COOKIE_SAME_SITE as "strict" | "lax" | "none") || "lax";
        const secure = process.env.NODE_ENV === "production" || process.env.FORCE_SECURE_COOKIE === "true";
        
        // On localhost, don't set domain. On production, only set domain if it's explicitly configured
        const cookieDomain = process.env.COOKIE_DOMAIN && !process.env.COOKIE_DOMAIN.includes("localhost") 
            ? process.env.COOKIE_DOMAIN 
            : undefined;

        res.cookies.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            path: "/",
            secure,
            sameSite,
            maxAge: 30 * 24 * 60 * 60,
            ...(cookieDomain && { domain: cookieDomain }), // Only set domain if it has a value
        });

        return res;
    } catch {
        return new NextResponse("Failed to login", { status: 500 });
    }
}
