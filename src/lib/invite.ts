import crypto from "crypto";

const INVITE_SECRET = process.env.INVITE_SECRET || "notedown-default-secret-change-me";
const WINDOW_MINUTES = 30;

/**
 * Generates a time-based invite code that rotates every 30 minutes.
 * Code is derived from: HMAC(secret, timestamp_window)
 */
export function generateInviteCode(): string {
    const now = Date.now();
    const window = Math.floor(now / (WINDOW_MINUTES * 60 * 1000));
    
    const hmac = crypto.createHmac("sha256", INVITE_SECRET);
    hmac.update(window.toString());
    const hash = hmac.digest("hex");
    
    // Use 12 characters for better entropy (16^12 vs 16^8)
    return hash.substring(0, 12).toUpperCase();
}

/**
 * Validates if the provided code matches the current time window.
 */
export function validateInviteCode(code: string): boolean {
    const currentCode = generateInviteCode();
    return code.toUpperCase() === currentCode;
}

/**
 * Returns the remaining seconds until the current code expires.
 */
export function getInviteCodeExpiresIn(): number {
    const now = Date.now();
    const window = Math.floor(now / (WINDOW_MINUTES * 60 * 1000));
    const nextWindow = (window + 1) * WINDOW_MINUTES * 60 * 1000;
    return Math.floor((nextWindow - now) / 1000);
}
