import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

function getSecret() {
    const jwtSecret = process.env.JWT_SECRET || "super-secret-key-change-in-prod";
    if (process.env.NODE_ENV === "production" && jwtSecret === "super-secret-key-change-in-prod") {
        throw new Error("JWT_SECRET must be set in production environment");
    }
    return new TextEncoder().encode(jwtSecret);
}

export async function getUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        
        // Check for regular auth token first
        const token = cookieStore.get("auth-token")?.value;
        if (token) {
            const { payload } = await jwtVerify(token, getSecret());
            return payload.sub as string;
        }

        // Check for guest session
        const guestId = cookieStore.get("guest-id")?.value;
        if (guestId) return guestId;

        return null;
    } catch {
        // If JWT verification fails, check for guest session
        try {
            const cookieStore = await cookies();
            const guestId = cookieStore.get("guest-id")?.value;
            if (guestId) return guestId;
        } catch {}
        return null;
    }
}

export async function createToken(userId: string): Promise<string> {
    return new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(getSecret());
}
