import fs from "fs";
import path from "path";
import { Workspace, Space, Folder, Document, PublishedDoc, User } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function read<T>(file: string, subDir?: string): T[] {
    const p = subDir ? path.join(DATA_DIR, subDir, file) : path.join(DATA_DIR, file);
    if (!fs.existsSync(p)) return [];
    try {
        return JSON.parse(fs.readFileSync(p, "utf-8"));
    } catch {
        return [];
    }
}

function write<T>(file: string, data: T[], subDir?: string): void {
    const d = subDir ? path.join(DATA_DIR, subDir) : DATA_DIR;
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, file), JSON.stringify(data, null, 2));
}

// Global (Users & Published)
export const getUsers = () => read<User>("users.json");
export const saveUsers = (u: User[]) => write("users.json", u);

export const getPublished = () => read<PublishedDoc>("published.json");
export const savePublished = (p: PublishedDoc[]) => write("published.json", p);

// Partitioned by User ID
export const getWorkspaces = (userId: string) => read<Workspace>("workspaces.json", userId);
export const saveWorkspaces = (userId: string, w: Workspace[]) => write("workspaces.json", w, userId);

export const getSpaces = (userId: string) => read<Space>("spaces.json", userId);
export const saveSpaces = (userId: string, s: Space[]) => write("spaces.json", s, userId);

export const getFolders = (userId: string) => read<Folder>("folders.json", userId);
export const saveFolders = (userId: string, f: Folder[]) => write("folders.json", f, userId);

export const getDocuments = (userId: string) => read<Document>("documents.json", userId);
export const saveDocuments = (userId: string, d: Document[]) => write("documents.json", d, userId);
