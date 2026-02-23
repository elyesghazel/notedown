import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    const cookieStore = await cookies();
    
    // Delete auth token
    cookieStore.delete("auth-token");
    
    // Explicitly expire guest cookies by setting maxAge to 0
    cookieStore.set({
        name: "guest-id",
        value: "",
        path: "/",
        maxAge: 0,
    });
    cookieStore.set({
        name: "guest-name",
        value: "",
        path: "/",
        maxAge: 0,
    });
    
    return NextResponse.json({ success: true });
}

