import { NextResponse } from "next/server";
import { getUsers, saveUsers } from "@/lib/db";
import { User } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password || username.length < 3 || password.length < 6) {
            return new NextResponse("Invalid username or password length", { status: 400 });
        }

        const users = getUsers();
        if (users.find(u => u.username === username)) {
            return new NextResponse("User already exists", { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser: User = {
            id: uuidv4(),
            username,
            passwordHash,
            createdAt: new Date().toISOString()
        };

        saveUsers([...users, newUser]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Registration error:", error);
        return new NextResponse("Failed to register", { status: 500 });
    }
}
