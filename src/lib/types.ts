export interface User {
    id: string;
    username: string;
    passwordHash: string;
    displayName?: string;
    createdAt: string;
}

export type PDFContentPosition = "left" | "center" | "right";
export type PDFContentType = "text" | "page_number" | "date" | "logo";

export interface PDFHeaderFooterItem {
    position: PDFContentPosition;
    type: PDFContentType;
    value: string;
    size?: number;
}

export interface PDFPreset {
    id: string;
    name: string;
    header: PDFHeaderFooterItem[];
    footer: PDFHeaderFooterItem[];
    createdAt: string;
    updatedAt: string;
}

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
}

export interface Space {
    id: string;
    workspaceId: string;
    name: string;
    slug: string;
    createdAt: string;
}

export interface Folder {
    id: string;
    spaceId: string;
    parentFolderId: string | null;
    name: string;
    slug: string;
    createdAt: string;
}

export interface Document {
    id: string;
    spaceId: string;
    folderId: string | null;
    name: string;
    slug: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface PublishedDoc {
    uuid: string;
    docId: string;
    ownerId?: string;
    editable?: boolean;
    editPassword?: string;
    title?: string;
    content: string;
    publishedAt: string;
}

export interface UploadedImage {
    filename: string;
    url: string;
}
