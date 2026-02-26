import { NextResponse } from "next/server";
import { getUsers, saveUsers } from "@/lib/db";
import { User } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { validateInviteCode } from "@/lib/invite";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
    // Rate limit: 3 attempts per 15 minutes per IP
    const clientIp = getClientIp(req);
    const rateLimitResponse = checkRateLimit(clientIp, {
        windowMs: 15 * 60 * 1000,
        maxRequests: 3,
        keyPrefix: "register"
    });
    
    if (rateLimitResponse) {
        return rateLimitResponse;
    }

    try {
        const { username, password, inviteCode } = await req.json();

        if (!username || !password || username.length < 3 || password.length < 6) {
            return new NextResponse("Invalid username or password length", { status: 400 });
        }

        // Check invite code
        if (!inviteCode || !validateInviteCode(inviteCode)) {
            return new NextResponse("Invalid or expired invite code", { status: 403 });
        }

        const users = getUsers();
        if (users.find(u => u.username === username)) {
            return new NextResponse("User already exists", { status: 400 });
        }

        // Prevent privilege escalation - only first ever user becomes admin
        const hasExistingAdmin = users.some(u => u.isAdmin);
        const isFirstUser = users.length === 0;

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser: User = {
            id: uuidv4(),
            username,
            passwordHash,
            displayName: username,
            createdAt: new Date().toISOString(),
            isAdmin: isFirstUser && !hasExistingAdmin,
            storageCapMB: 150 // Default cap
        };

        saveUsers([...users, newUser]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Registration error:", error);
        return new NextResponse("Failed to register", { status: 500 });
    }
}
