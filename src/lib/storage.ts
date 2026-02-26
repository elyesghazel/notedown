import fs from "fs";
import path from "path";
import { getUploads } from "./db";

const DEFAULT_CAP_MB = 150;

/**
 * Calculate total storage used by a user (uploads folder only).
 * Returns size in MB.
 */
export function calculateUserStorage(userId: string): number {
    const uploads = getUploads(userId);
    
    // Sum up file sizes from upload records
    const totalBytes = uploads.reduce((sum, file) => {
        // For local files, use the size from the record
        if (file.source === "local") {
            return sum + (file.size || 0);
        }
        return sum;
    }, 0);
    
    return totalBytes / (1024 * 1024); // Convert to MB
}

/**
 * Check if user has exceeded their storage cap.
 * Returns { allowed: boolean, used: number, cap: number, message?: string }
 */
export function checkStorageLimit(userId: string, userStorageCapMB: number | undefined, additionalSizeMB: number = 0): {
    allowed: boolean;
    used: number;
    cap: number;
    message?: string;
} {
    const cap = userStorageCapMB || DEFAULT_CAP_MB;
    const used = calculateUserStorage(userId);
    const newTotal = used + additionalSizeMB;
    
    if (newTotal > cap) {
        return {
            allowed: false,
            used,
            cap,
            message: `Storage limit exceeded. Used: ${used.toFixed(2)}MB, Cap: ${cap}MB. Consider using WebDAV for additional storage.`
        };
    }
    
    return {
        allowed: true,
        used,
        cap
    };
}
