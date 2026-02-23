import { Workspace, Space, Folder, Document, PublishedDoc, PDFPreset } from "./types";

export interface PublishedSummary {
    docId: string;
    uuid: string;
    editable: boolean;
}

export const api = {
    // Workspaces
    getWorkspaces: (): Promise<Workspace[]> => fetch("/api/workspaces", { credentials: "include" }).then((r) => r.json()),
    createWorkspace: (name: string): Promise<Workspace> =>
        fetch("/api/workspaces", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    deleteWorkspace: (id: string) => fetch(`/api/workspaces/${id}`, { method: "DELETE", credentials: "include" }),
    renameWorkspace: (id: string, name: string) =>
        fetch(`/api/workspaces/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }),

    // Spaces
    getSpaces: (workspaceId?: string): Promise<Space[]> => {
        const url = workspaceId ? `/api/spaces?workspaceId=${workspaceId}` : "/api/spaces";
        return fetch(url, { credentials: "include" }).then((r) => r.json());
    },
    createSpace: (workspaceId: string, name: string): Promise<Space> =>
        fetch("/api/spaces", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ workspaceId, name }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    deleteSpace: (id: string) => fetch(`/api/spaces/${id}`, { method: "DELETE", credentials: "include" }),
    renameSpace: (id: string, name: string) =>
        fetch(`/api/spaces/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }),

    // Folders
    getFolders: (spaceId: string): Promise<Folder[]> =>
        fetch(`/api/folders?spaceId=${spaceId}`, { credentials: "include" }).then((r) => r.json()),
    createFolder: (spaceId: string, parentFolderId: string | null, name: string): Promise<Folder> =>
        fetch("/api/folders", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ spaceId, parentFolderId, name }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    renameFolder: (id: string, name: string) =>
        fetch(`/api/folders/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }),
    moveFolder: (id: string, spaceId: string, parentFolderId: string | null) =>
        fetch(`/api/folders/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ spaceId, parentFolderId }),
            headers: { "Content-Type": "application/json" },
        }),
    deleteFolder: (id: string) => fetch(`/api/folders/${id}`, { method: "DELETE", credentials: "include" }),

    // Documents
    getDocuments: (spaceId: string): Promise<Document[]> =>
        fetch(`/api/documents?spaceId=${spaceId}`, { credentials: "include" }).then((r) => r.json()),
    getDocument: (id: string): Promise<Document> =>
        fetch(`/api/documents/${id}`, { credentials: "include" }).then((r) => r.json()),
    createDocument: (spaceId: string, name: string, folderId?: string | null): Promise<Document> =>
        fetch("/api/documents", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ spaceId, name, folderId: folderId ?? null }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    saveDocument: (id: string, content: string) =>
        fetch(`/api/documents/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ content }),
            headers: { "Content-Type": "application/json" },
        }),
    renameDocument: (id: string, name: string) =>
        fetch(`/api/documents/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ name }),
            headers: { "Content-Type": "application/json" },
        }),
    moveDocument: (id: string, spaceId: string, folderId: string | null) =>
        fetch(`/api/documents/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ spaceId, folderId }),
            headers: { "Content-Type": "application/json" },
        }),
    deleteDocument: (id: string) => fetch(`/api/documents/${id}`, { method: "DELETE", credentials: "include" }),

    // Images
    uploadImage: (file: File): Promise<{ url: string }> => {
        const form = new FormData();
        form.append("file", file);
        return fetch("/api/upload", { method: "POST", credentials: "include", body: form })
            .then((r) => {
                if (!r.ok) {
                    return r.json().then((data) => {
                        throw new Error(data.error || `Upload failed with status ${r.status}`);
                    });
                }
                return r.json();
            });
    },

    // Publish
    publishDoc: (docId: string, editable?: boolean, editPassword?: string): Promise<{ uuid: string }> =>
        fetch("/api/publish", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ docId, editable, editPassword }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    unpublishDoc: (uuid: string) => fetch(`/api/publish/${uuid}`, { method: "DELETE", credentials: "include" }),
    getPublishedList: (): Promise<PublishedSummary[]> =>
        fetch("/api/publish", { credentials: "include" }).then((r) => r.json()),
    getPublished: (uuid: string): Promise<PublishedDoc> =>
        fetch(`/api/publish/${uuid}`).then((r) => r.json()),

    // Settings
    getProfile: (): Promise<{ username: string; displayName: string; createdAt: string }> =>
        fetch("/api/settings/profile", { credentials: "include" }).then((r) => r.json()),
    updateProfile: (displayName: string) =>
        fetch("/api/settings/profile", {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify({ displayName }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    changePassword: (currentPassword: string, newPassword: string) =>
        fetch("/api/settings/password", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ currentPassword, newPassword }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),

    // PDF presets
    getPdfPresets: (): Promise<PDFPreset[]> => fetch("/api/pdf-presets", { credentials: "include" }).then((r) => r.json()),
    createPdfPreset: (name: string, header: PDFPreset["header"], footer: PDFPreset["footer"]): Promise<PDFPreset> =>
        fetch("/api/pdf-presets", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ name, header, footer }),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    updatePdfPreset: (id: string, data: Partial<Pick<PDFPreset, "name" | "header" | "footer">>): Promise<PDFPreset> =>
        fetch(`/api/pdf-presets/${id}`, {
            method: "PATCH",
            credentials: "include",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        }).then((r) => r.json()),
    deletePdfPreset: (id: string) => fetch(`/api/pdf-presets/${id}`, { method: "DELETE", credentials: "include" }),
};
