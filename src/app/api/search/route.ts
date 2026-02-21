import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSpaces, getDocuments, getFolders } from "@/lib/db";

export async function GET() {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const spaces = getSpaces(userId);
    const documents = getDocuments(userId);
    const folders = getFolders(userId);

    return NextResponse.json({ spaces, documents, folders });
}
