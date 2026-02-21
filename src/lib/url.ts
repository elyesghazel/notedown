import { Folder } from "./types";

export function buildDocUrl(
    spaceSlug: string,
    folderSlugs: string[],
    docSlug: string
): string {
    return ["", spaceSlug, ...folderSlugs, docSlug].join("/");
}

export function getFolderPath(folderId: string, allFolders: Folder[]): string[] {
    const path: string[] = [];
    let current = allFolders.find((f) => f.id === folderId);
    while (current) {
        path.unshift(current.slug);
        current = current.parentFolderId
            ? allFolders.find((f) => f.id === current!.parentFolderId)
            : undefined;
    }
    return path;
}
