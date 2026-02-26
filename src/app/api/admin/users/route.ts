import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { calculateUserStorage } from "@/lib/storage";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    
    if (!user?.isAdmin) {
        return new NextResponse("Forbidden: Admin only", { status: 403 });
    }

    // Return user list with storage info (exclude sensitive data)
    const userList = users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        createdAt: u.createdAt,
        isAdmin: u.isAdmin || false,
        storageCapMB: u.storageCapMB || parseInt(process.env.DEFAULT_STORAGE_CAP_MB || "150", 10),
        storageUsedMB: calculateUserStorage(u.id)
    }));

    return NextResponse.json(userList);
}
