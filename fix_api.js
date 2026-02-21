const fs = require('fs');
const path = require('path');

const API_DIR = path.join(process.cwd(), 'src/app/api');
const filesToEdit = [
    'documents/[id]/route.ts', 'documents/route.ts',
    'folders/[id]/route.ts', 'folders/route.ts',
    'search/route.ts',
    'spaces/[id]/route.ts', 'spaces/route.ts',
    'workspaces/[id]/route.ts', 'workspaces/route.ts'
];

filesToEdit.forEach(file => {
    const fullPath = path.join(API_DIR, file);
    if (!fs.existsSync(fullPath)) return;
    let code = fs.readFileSync(fullPath, 'utf-8');

    // add import
    if (!code.includes('@/lib/auth')) {
        code = `import { getUserId } from "@/lib/auth";\n` + code;
    }

    // Replace export async function
    code = code.replace(/export async function (GET|POST|PATCH|DELETE)\((.*?)\) \{/g, `export async function $1($2) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });`);

    // We might have `return NextResponse.json` but no `NextResponse` imported.
    if (!code.includes('import { NextResponse }')) {
        code = `import { NextResponse } from "next/server";\n` + code;
    }

    // replace DB calls
    code = code.replace(/getWorkspaces\(\)/g, 'getWorkspaces(userId)');
    code = code.replace(/getSpaces\(\)/g, 'getSpaces(userId)');
    code = code.replace(/getFolders\(\)/g, 'getFolders(userId)');
    code = code.replace(/getDocuments\(\)/g, 'getDocuments(userId)');

    code = code.replace(/saveWorkspaces\(([^)]+)\)/g, 'saveWorkspaces(userId, $1)');
    code = code.replace(/saveSpaces\(([^)]+)\)/g, 'saveSpaces(userId, $1)');
    code = code.replace(/saveFolders\(([^)]+)\)/g, 'saveFolders(userId, $1)');
    code = code.replace(/saveDocuments\(([^)]+)\)/g, 'saveDocuments(userId, $1)');

    fs.writeFileSync(fullPath, code);
});

// Also fix publish/[uuid]/route.ts and publish/route.ts
// Published routes might need userId ONLY for POST (creating publish), but GET is public.
// Wait, for publish, the POST needs to know `userId` to find the document!
const publishPostPath = path.join(API_DIR, 'publish/route.ts');
if (fs.existsSync(publishPostPath)) {
    let code = fs.readFileSync(publishPostPath, 'utf-8');
    if (!code.includes('@/lib/auth')) {
        code = `import { getUserId } from "@/lib/auth";\n` + code;
    }
    code = code.replace(/export async function POST\((.*?)\) \{/, `export async function POST($1) {
    const userId = await getUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });`);
    code = code.replace(/getDocuments\(\)/g, 'getDocuments(userId)');
    fs.writeFileSync(publishPostPath, code);
}
console.log('Done');
