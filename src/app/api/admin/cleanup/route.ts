import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { cleanupAllUploads } from "@/lib/cleanup";

export async function POST() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    
    if (!user?.isAdmin) {
        return new NextResponse("Forbidden: Admin only", { status: 403 });
    }

    try {
        const result = cleanupAllUploads();
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Cleanup failed" },
            { status: 500 }
        );
    }
}
