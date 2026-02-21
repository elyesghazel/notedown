import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const SECRET = new TextEncoder().encode("super-secret-key-change-in-prod");

export async function getUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("auth-token")?.value;
        if (!token) return null;

        const { payload } = await jwtVerify(token, SECRET);
        return payload.sub as string;
    } catch {
        return null;
    }
}

export async function createToken(userId: string): Promise<string> {
    return new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(SECRET);
}
