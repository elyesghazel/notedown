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

        res.cookies.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict", // CSRF protection
            maxAge: 30 * 24 * 60 * 60,
        });

        return res;
    } catch {
        return new NextResponse("Failed to login", { status: 500 });
    }
}
