import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

function getSecret() {
    const jwtSecret = process.env.JWT_SECRET || "super-secret-key-change-in-prod";
    return new TextEncoder().encode(jwtSecret);
}

export async function GET() {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");
    
    console.log("[DEBUG COOKIES] All cookies:", cookieStore.getAll());
    console.log("[DEBUG COOKIES] Auth token:", authToken?.value?.substring(0, 50));
    
    let jwtStatus = "no token";
    let jwtPayload = null;
    
    if (authToken?.value) {
        try {
            const { payload } = await jwtVerify(authToken.value, getSecret());
            jwtStatus = "valid";
            jwtPayload = payload;
        } catch (err: any) {
            jwtStatus = `invalid: ${err.message}`;
        }
    }
    
    return NextResponse.json({
        authTokenExists: !!authToken,
        authTokenValue: authToken?.value?.substring(0, 50) + "..." || null,
        jwtStatus,
        jwtPayload,
        secretLength: getSecret().byteLength,
        environment: process.env.NODE_ENV,
        allCookies: cookieStore.getAll().map(c => ({ name: c.name, length: c.value.length }))
    });
}

