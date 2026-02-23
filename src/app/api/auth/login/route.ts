import { NextResponse } from "next/server";
import { getUsers } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        const users = getUsers();
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return new NextResponse("Invalid credentials", { status: 401 });
        }

        const token = await createToken(user.id);
        const cookieStore = await cookies();

        cookieStore.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            path: "/",
            secure: false, // Allow http for local development and docker-compose without SSL
            maxAge: 30 * 24 * 60 * 60
        });

        return NextResponse.json({
            success: true,
            user: { id: user.id, username: user.username, displayName: user.displayName || user.username }
        });
    } catch {
        return new NextResponse("Failed to login", { status: 500 });
    }
}
