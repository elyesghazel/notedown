import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getProfile } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
    const userId = await getUserId();

    if (!userId) {
        return new NextResponse(null, { status: 401 });
    }

    // Check if guest user
    if (userId.startsWith("guest_")) {
        const cookieStore = await cookies();
        const guestName = cookieStore.get("guest-name")?.value || "Guest";
        return NextResponse.json({ userId, isGuest: true, displayName: guestName });
    }

    // Regular user - get profile
    try {
        const profile = getProfile(userId);
        return NextResponse.json({ userId, isGuest: false, displayName: profile?.displayName || profile?.username });
    } catch {
        return new NextResponse(null, { status: 401 });
    }
}

