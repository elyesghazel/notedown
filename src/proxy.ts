import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode("super-secret-key-change-in-prod");

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public routes
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/share") ||
        pathname.startsWith("/api/publish") || // Viewing published pages needs API access
        pathname.startsWith("/uploads") || // Allow image downloads directly
        pathname === "/favicon.ico"
    ) {
        return NextResponse.next();
    }

    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
        await jwtVerify(token, SECRET);
        return NextResponse.next();
    } catch (err) {
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

export const config = {
    matcher: ["/((?!api/upload|_next/static|_next/image|favicon.ico).*)"],
};
