import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUsers, saveUsers } from "@/lib/db";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return new NextResponse("Not found", { status: 404 });

    return NextResponse.json({
        username: user.username,
        displayName: user.displayName || user.username,
        createdAt: user.createdAt,
    });
}

export async function PATCH(req: Request) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { displayName } = await req.json();
    if (!displayName || typeof displayName !== "string") {
        return new NextResponse("Display name is required", { status: 400 });
    }

    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 64) {
        return new NextResponse("Display name must be 2-64 characters", { status: 400 });
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return new NextResponse("Not found", { status: 404 });

    users[idx].displayName = trimmed;
    saveUsers(users);

    return NextResponse.json({
        username: users[idx].username,
        displayName: users[idx].displayName || users[idx].username,
        createdAt: users[idx].createdAt,
    });
}
