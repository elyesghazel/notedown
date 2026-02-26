import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const cookieHeader = req.headers.get("cookie");
    
    console.log("[SIMPLE DEBUG] Cookie header:", cookieHeader);
    
    return NextResponse.json({
        cookies: cookieHeader,
        message: "Check server console for details"
    });
}
