import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUsers, saveUsers } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const users = getUsers();
    const adminUser = users.find((u) => u.id === userId);
    
    if (!adminUser?.isAdmin) {
        return new NextResponse("Forbidden: Admin only", { status: 403 });
    }

    const targetId = params.id;
    const targetIdx = users.findIndex((u) => u.id === targetId);
    
    if (targetIdx === -1) {
        return new NextResponse("User not found", { status: 404 });
    }

    const { storageCapMB } = await req.json();

    if (typeof storageCapMB !== "number" || storageCapMB < 0) {
        return new NextResponse("Invalid storage cap", { status: 400 });
    }

    users[targetIdx].storageCapMB = storageCapMB;
    saveUsers(users);

    return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const users = getUsers();
    const adminUser = users.find((u) => u.id === userId);
    
    if (!adminUser?.isAdmin) {
        return new NextResponse("Forbidden: Admin only", { status: 403 });
    }

    const targetId = params.id;
    
    // Cannot delete yourself
    if (targetId === userId) {
        return new NextResponse("Cannot delete your own account", { status: 400 });
    }

    const filteredUsers = users.filter((u) => u.id !== targetId);
    
    if (filteredUsers.length === users.length) {
        return new NextResponse("User not found", { status: 404 });
    }

    saveUsers(filteredUsers);

    return NextResponse.json({ success: true });
}
