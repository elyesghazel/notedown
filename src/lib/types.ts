export interface User {
    id: string;
    username: string;
    passwordHash: string;
    createdAt: string;
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
    title?: string;
    content: string;
    publishedAt: string;
}

export interface UploadedImage {
    filename: string;
    url: string;
}
