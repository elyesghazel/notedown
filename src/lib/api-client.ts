import { Workspace, Space, Folder, Document, PublishedDoc } from "./types";

export const api = {
    // Workspaces
    getWorkspaces: (): Promise<Workspace[]> => fetch("/api/workspaces").then((r) => r.json()),
    createWorkspace: (name: string): Promise<Workspace> =>
        fetch("/api/workspaces", {
            method: "POST",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    deleteWorkspace: (id: string) => fetch(`/api/workspaces/${id}`, { method: "DELETE" }),
    renameWorkspace: (id: string, name: string) =>
        fetch(`/api/workspaces/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }),

    // Spaces
    getSpaces: (workspaceId?: string): Promise<Space[]> => {
        const url = workspaceId ? `/api/spaces?workspaceId=${workspaceId}` : "/api/spaces";
        return fetch(url).then((r) => r.json());
    },
    createSpace: (workspaceId: string, name: string): Promise<Space> =>
        fetch("/api/spaces", {
            method: "POST",
            body: JSON.stringify({ workspaceId, name }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    deleteSpace: (id: string) => fetch(`/api/spaces/${id}`, { method: "DELETE" }),
    renameSpace: (id: string, name: string) =>
        fetch(`/api/spaces/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }),

    // Folders
    getFolders: (spaceId: string): Promise<Folder[]> =>
        fetch(`/api/folders?spaceId=${spaceId}`).then((r) => r.json()),
    createFolder: (spaceId: string, parentFolderId: string | null, name: string): Promise<Folder> =>
        fetch("/api/folders", {
            method: "POST",
            body: JSON.stringify({ spaceId, parentFolderId, name }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    renameFolder: (id: string, name: string) =>
        fetch(`/api/folders/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }),
    moveFolder: (id: string, spaceId: string, parentFolderId: string | null) =>
        fetch(`/api/folders/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ spaceId, parentFolderId }),
            headers: { "Content-Type": "application/json" },
        }),
    deleteFolder: (id: string) => fetch(`/api/folders/${id}`, { method: "DELETE" }),

    // Documents
    getDocuments: (spaceId: string): Promise<Document[]> =>
        fetch(`/api/documents?spaceId=${spaceId}`).then((r) => r.json()),
    getDocument: (id: string): Promise<Document> =>
        fetch(`/api/documents/${id}`).then((r) => r.json()),
    createDocument: (spaceId: string, name: string, folderId?: string | null): Promise<Document> =>
        fetch("/api/documents", {
            method: "POST",
            body: JSON.stringify({ spaceId, name, folderId: folderId ?? null }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    saveDocument: (id: string, content: string) =>
        fetch(`/api/documents/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ content }),
            headers: { "Content-Type": "application/json" },
        }),
    renameDocument: (id: string, name: string) =>
        fetch(`/api/documents/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }),
    moveDocument: (id: string, spaceId: string, folderId: string | null) =>
        fetch(`/api/documents/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ spaceId, folderId }),
            headers: { "Content-Type": "application/json" },
        }),
    deleteDocument: (id: string) => fetch(`/api/documents/${id}`, { method: "DELETE" }),

    // Images
    uploadImage: (file: File): Promise<{ url: string }> => {
        const form = new FormData();
        form.append("file", file);
        return fetch("/api/upload", { method: "POST", body: form }).then((r) => r.json());
    },

    // Publish
    publishDoc: (docId: string): Promise<{ uuid: string }> =>
        fetch("/api/publish", {
            method: "POST",
            body: JSON.stringify({ docId }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    unpublishDoc: (uuid: string) => fetch(`/api/publish/${uuid}`, { method: "DELETE" }),
    getPublished: (uuid: string): Promise<PublishedDoc> =>
        fetch(`/api/publish/${uuid}`).then((r) => r.json()),
};
