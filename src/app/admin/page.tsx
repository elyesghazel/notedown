"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Copy, RefreshCw } from "lucide-react";

interface AdminUser {
    id: string;
    username: string;
    displayName?: string;
    createdAt: string;
    isAdmin: boolean;
    storageCapMB: number;
    storageUsedMB: number;
}

interface InviteCodeData {
    code: string;
    expiresIn: number;
    expiresInMinutes: number;
}

export default function AdminPage() {
    const router = useRouter();
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [newCap, setNewCap] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<{ totalDeleted: number; totalFreedMB: number } | null>(null);

    const { data: profile, error: profileError } = useSWR("/api/auth/me", api.getMe);
    const { data: users, mutate: mutateUsers } = useSWR<AdminUser[]>("/api/admin/users", api.get);
    const { data: inviteCodeData, mutate: mutateInviteCode } = useSWR<InviteCodeData>(
        "/api/admin/invite-code",
        api.get,
        { refreshInterval: 5000 } // Auto-refresh every 5 seconds
    );

    useEffect(() => {
        if (profileError || (profile && !profile.isAdmin)) {
            router.push("/");
        }
    }, [profile, profileError, router]);

    if (!profile || !profile.isAdmin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const handleUpdateCap = async (userId: string) => {
        const capMB = parseInt(newCap, 10);
        if (isNaN(capMB) || capMB < 0) {
            alert("Invalid storage cap");
            return;
        }

        try {
            await api.patch(`/api/admin/users/${userId}`, { storageCapMB: capMB });
            mutateUsers();
            setEditingUserId(null);
            setNewCap("");
        } catch (err: any) {
            alert(err.message || "Failed to update storage cap");
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;

        try {
            await api.del(`/api/admin/users/${userId}`);
            mutateUsers();
        } catch (err: any) {
            alert(err.message || "Failed to delete user");
        }
    };

    const handleCopyInviteCode = () => {
        if (inviteCodeData?.code) {
            navigator.clipboard.writeText(inviteCodeData.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCleanupUploads = async () => {
        if (!confirm("Clean up unused uploads for all users? This will delete files that are not referenced in any document.")) {
            return;
        }

        setCleaning(true);
        setCleanupResult(null);

        try {
            const res = await fetch("/api/admin/cleanup", {
                method: "POST",
                credentials: "include"
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Cleanup failed");
            }

            const result = await res.json();
            setCleanupResult(result);
            mutateUsers(); // Refresh user storage stats
        } catch (err: any) {
            alert(err.message || "Failed to cleanup uploads");
        } finally {
            setCleaning(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-background">
            <div className="max-w-6xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
                <p className="text-muted-foreground mb-8">Manage users and invite codes</p>

                {/* Invite Code Section */}
                <div className="bg-card rounded-lg shadow-sm border p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Current Invite Code</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <code className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded">
                                    {inviteCodeData?.code || "Loading..."}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyInviteCode}
                                    disabled={!inviteCodeData?.code}
                                >
                                    <Copy className="w-4 h-4 mr-1" />
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => mutateInviteCode()}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Expires in: {inviteCodeData?.expiresInMinutes || 0} minutes{" "}
                                ({inviteCodeData?.expiresIn || 0}s)
                            </p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                Rotates every 30 minutes automatically
                            </p>
                        </div>
                    </div>
                </div>

                {/* Storage Cleanup Section */}
                <div className="bg-card rounded-lg shadow-sm border p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-2">Storage Cleanup</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Remove uploaded files that are no longer referenced in any document
                    </p>
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleCleanupUploads}
                            disabled={cleaning}
                            variant="outline"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {cleaning ? "Cleaning..." : "Clean Unused Uploads"}
                        </Button>
                        {cleanupResult && (
                            <div className="text-sm text-muted-foreground">
                                ✓ Deleted {cleanupResult.totalDeleted} files, freed {cleanupResult.totalFreedMB.toFixed(2)} MB
                            </div>
                        )}
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold">Users</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Storage Used
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Storage Cap
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users?.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-foreground">
                                                {user.username}
                                            </div>
                                            {user.displayName && user.displayName !== user.username && (
                                                <div className="text-sm text-muted-foreground">{user.displayName}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">
                                                {user.storageUsedMB.toFixed(2)} MB
                                            </div>
                                            <div className="w-32 bg-muted rounded-full h-2 mt-1">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        user.storageUsedMB / user.storageCapMB > 0.9
                                                            ? "bg-red-500"
                                                            : user.storageUsedMB / user.storageCapMB > 0.7
                                                            ? "bg-yellow-500"
                                                            : "bg-green-500"
                                                    }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            (user.storageUsedMB / user.storageCapMB) * 100,
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingUserId === user.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={newCap}
                                                        onChange={(e) => setNewCap(e.target.value)}
                                                        placeholder="MB"
                                                        className="w-24"
                                                        autoFocus
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleUpdateCap(user.id)}
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingUserId(null);
                                                            setNewCap("");
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditingUserId(user.id);
                                                        setNewCap(user.storageCapMB.toString());
                                                    }}
                                                    className="text-sm text-primary hover:text-primary/80 hover:underline"
                                                >
                                                    {user.storageCapMB} MB
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.isAdmin ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
                                                    User
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {user.id !== profile.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
