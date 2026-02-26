import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function getSecret() {
    const jwtSecret = process.env.JWT_SECRET || "super-secret-key-change-in-prod";
    return new TextEncoder().encode(jwtSecret);
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public routes
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/debug") || // Debug endpoints
        pathname.startsWith("/api/simple-debug") || // Simple debug
        pathname.startsWith("/share") ||
        pathname.startsWith("/api/publish") || // Viewing published pages needs API access
        pathname.startsWith("/api/socket") || // WebSocket handshake
        pathname.startsWith("/uploads") || // Allow image downloads directly
        pathname === "/favicon.ico"
    ) {
        return NextResponse.next();
    }

    const token = req.cookies.get("auth-token")?.value;
    const guestId = req.cookies.get("guest-id")?.value;
    if (!token) {
        if (guestId) return NextResponse.next();
        return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
        await jwtVerify(token, getSecret());
        return NextResponse.next();
    } catch (err) {
        console.error("[PROXY] JWT verification failed:", err);
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

export const config = {
    matcher: ["/((?!api/upload|_next/static|_next/image|favicon.ico).*)"],
};
