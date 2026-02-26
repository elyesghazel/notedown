import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserId } from "@/lib/auth";

export async function GET() {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");
    
    console.log("[DEBUG] All cookies:", cookieStore.getAll());
    console.log("[DEBUG] Auth token:", authToken);
    
    const userId = await getUserId();
    console.log("[DEBUG] getUserId result:", userId);
    
    return NextResponse.json({
        authTokenExists: !!authToken,
        authTokenValue: authToken?.value?.substring(0, 20) + "..." || null,
        userIdFromAuth: userId,
        allCookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) }))
    });
}
