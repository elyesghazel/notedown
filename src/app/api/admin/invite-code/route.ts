import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { generateInviteCode, getInviteCodeExpiresIn } from "@/lib/invite";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    
    if (!user?.isAdmin) {
        return new NextResponse("Forbidden: Admin only", { status: 403 });
    }

    const code = generateInviteCode();
    const expiresIn = getInviteCodeExpiresIn();

    return NextResponse.json({ 
        code,
        expiresIn,
        expiresInMinutes: Math.floor(expiresIn / 60)
    });
}
