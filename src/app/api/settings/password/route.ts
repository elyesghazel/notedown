import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUsers, saveUsers } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
        return new NextResponse("Missing password fields", { status: 400 });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
        return new NextResponse("New password must be at least 6 characters", { status: 400 });
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    const valid = await bcrypt.compare(currentPassword, users[idx].passwordHash);
    if (!valid) return new NextResponse("Invalid current password", { status: 401 });

    users[idx].passwordHash = await bcrypt.hash(newPassword, 10);
    saveUsers(users);

    return NextResponse.json({ success: true });
}
