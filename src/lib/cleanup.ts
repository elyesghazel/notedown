import fs from "fs";
import path from "path";
import { getDocuments, getUploads, saveUploads } from "./db";
import { getUsers } from "./db";

/**
 * Find all upload URLs referenced in a user's documents
 */
function findReferencedUploads(userId: string): Set<string> {
    const documents = getDocuments(userId);
    const referenced = new Set<string>();
    
    for (const doc of documents) {
        // Match markdown images: ![alt](url)
        const imageMatches = doc.content.match(/!\[.*?\]\((.*?)\)/g) || [];
        for (const match of imageMatches) {
            const urlMatch = match.match(/!\[.*?\]\((.*?)\)/);
            if (urlMatch && urlMatch[1]) {
                referenced.add(urlMatch[1]);
            }
        }
        
        // Match PDF embeds: [PDF: name](url)
        const pdfMatches = doc.content.match(/\[PDF:.*?\]\((.*?)\)/g) || [];
        for (const match of pdfMatches) {
            const urlMatch = match.match(/\[PDF:.*?\]\((.*?)\)/);
            if (urlMatch && urlMatch[1]) {
                referenced.add(urlMatch[1]);
            }
        }
    }
    
    return referenced;
}

/**
 * Clean up unused uploads for a specific user
 * Returns count of deleted files
 */
export function cleanupUserUploads(userId: string): { deleted: number; freedMB: number } {
    const uploads = getUploads(userId);
    const referenced = findReferencedUploads(userId);
    
    let deleted = 0;
    let freedBytes = 0;
    const remaining = [];
    
    for (const upload of uploads) {
        if (!referenced.has(upload.url)) {
            // This upload is not referenced in any document
            if (upload.source === "local") {
                // Delete the physical file
                const filepath = path.join(process.cwd(), "public", upload.url);
                try {
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                        freedBytes += upload.size || 0;
                        deleted++;
                    }
                } catch (err) {
                    console.error(`Failed to delete ${filepath}:`, err);
                }
            } else {
                // WebDAV files - just remove from DB (don't delete from remote)
                deleted++;
                freedBytes += upload.size || 0;
            }
        } else {
            remaining.push(upload);
        }
    }
    
    // Save updated upload list
    if (deleted > 0) {
        saveUploads(userId, remaining);
    }
    
    return {
        deleted,
        freedMB: freedBytes / (1024 * 1024)
    };
}

/**
 * Clean up unused uploads for all users
 * Returns total stats
 */
export function cleanupAllUploads(): { 
    totalDeleted: number; 
    totalFreedMB: number; 
    userStats: Array<{ userId: string; deleted: number; freedMB: number }> 
} {
    const users = getUsers();
    const userStats = [];
    let totalDeleted = 0;
    let totalFreedMB = 0;
    
    for (const user of users) {
        const result = cleanupUserUploads(user.id);
        if (result.deleted > 0) {
            userStats.push({
                userId: user.id,
                deleted: result.deleted,
                freedMB: result.freedMB
            });
            totalDeleted += result.deleted;
            totalFreedMB += result.freedMB;
        }
    }
    
    return {
        totalDeleted,
        totalFreedMB,
        userStats
    };
}
