"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Settings, Download, Upload, AlertCircle, Plug } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { WebDavConfig } from "@/lib/types";

interface UserInfo {
    userId: string;
    isGuest: boolean;
    displayName: string;
}

export default function SettingsPage() {
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [profileMessage, setProfileMessage] = useState<string | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [backupMessage, setBackupMessage] = useState<string | null>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [webdavConfig, setWebdavConfig] = useState<WebDavConfig>({
        enabled: false,
        url: "",
        username: "",
        password: "",
        basePath: "/",
        preferPdf: false,
    });
    const [webdavLoading, setWebdavLoading] = useState(true);
    const [webdavSaving, setWebdavSaving] = useState(false);
    const [webdavTesting, setWebdavTesting] = useState(false);
    const [webdavMessage, setWebdavMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        
        // Check if user is logged in and if guest
        fetch("/api/auth/me")
            .then(res => {
                if (!res.ok) return null;
                return res.json();
            })
            .then(info => {
                if (active) setUserInfo(info);
            });

        // Load profile
        api.getProfile()
            .then((profile) => {
                if (!active) return;
                setDisplayName(profile.displayName || "");
                setUsername(profile.username || "");
            })
            .catch(() => {
                if (!active) return;
                setProfileMessage("Failed to load profile.");
            })
            .finally(() => {
                if (!active) return;
                setLoadingProfile(false);
            });

        api.getWebdavConfig()
            .then((config) => {
                if (!active) return;
                setWebdavConfig({
                    enabled: !!config.enabled,
                    url: config.url || "",
                    username: config.username || "",
                    password: config.password || "",
                    basePath: config.basePath || "/",
                    preferPdf: !!config.preferPdf,
                });
            })
            .catch(() => {
                if (!active) return;
                setWebdavMessage("Failed to load WebDAV settings.");
            })
            .finally(() => {
                if (!active) return;
                setWebdavLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const handleProfileSave = async () => {
        setSavingProfile(true);
        setProfileMessage(null);
        try {
            const result = await api.updateProfile(displayName);
            setDisplayName(result.displayName || "");
            setProfileMessage("Profile updated.");
        } catch {
            setProfileMessage("Failed to update profile.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSave = async () => {
        setSavingPassword(true);
        setPasswordMessage(null);
        try {
            await api.changePassword(currentPassword, newPassword);
            setCurrentPassword("");
            setNewPassword("");
            setPasswordMessage("Password updated.");
        } catch {
            setPasswordMessage("Failed to update password.");
        } finally {
            setSavingPassword(false);
        }
    };

    const handleExport = async () => {
        setBackupMessage(null);
        try {
            const response = await fetch("/api/backup");
            if (!response.ok) throw new Error("Export failed");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "notedown-backup.json";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setBackupMessage("Failed to export data.");
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            setBackupMessage("Select a backup file first.");
            return;
        }
        setImporting(true);
        setBackupMessage(null);
        try {
            const text = await importFile.text();
            const data = JSON.parse(text);
            const response = await fetch("/api/backup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Import failed");
            setBackupMessage("Import completed. Reload to see updates.");
        } catch {
            setBackupMessage("Failed to import backup file.");
        } finally {
            setImporting(false);
        }
    };

    const handleWebdavSave = async () => {
        setWebdavSaving(true);
        setWebdavMessage(null);
        try {
            const saved = await api.saveWebdavConfig(webdavConfig);
            setWebdavConfig({
                enabled: !!saved.enabled,
                url: saved.url || "",
                username: saved.username || "",
                password: saved.password || "",
                basePath: saved.basePath || "/",
                preferPdf: !!saved.preferPdf,
            });
            setWebdavMessage("WebDAV settings saved.");
        } catch {
            setWebdavMessage("Failed to save WebDAV settings.");
        } finally {
            setWebdavSaving(false);
        }
    };

    const handleWebdavTest = async () => {
        setWebdavTesting(true);
        setWebdavMessage(null);
        try {
            const result = await api.testWebdavConfig(webdavConfig);
            if (result.ok) {
                setWebdavMessage("WebDAV connection OK.");
            } else {
                setWebdavMessage(result.error || "WebDAV test failed.");
            }
        } catch {
            setWebdavMessage("WebDAV test failed.");
        } finally {
            setWebdavTesting(false);
        }
    };

    const isGuest = userInfo?.isGuest ?? false;

    return (
        <div className="flex-1 w-full h-full overflow-y-auto bg-background">
            <div className="max-w-4xl mx-auto px-6 py-10 sm:py-14">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Settings</h1>
                        <p className="text-sm text-muted-foreground">
                            {isGuest ? "You're editing as a guest. Your changes will be lost when you close this session." : "Manage your profile, password, and backups."}
                        </p>
                    </div>
                </div>

                {isGuest && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Guest Mode:</strong> You're in temporary guest mode. Limited settings are available. Sign up for an account to access full features like password management and data backups.
                        </div>
                    </div>
                )}

                <div className="space-y-10">
                    <section className="bg-card border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Profile</h2>
                        {loadingProfile ? (
                            <div className="flex items-center text-muted-foreground text-sm">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading profile...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {!isGuest && (
                                    <div className="space-y-2">
                                        <Label>Username</Label>
                                        <Input value={username} disabled />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input 
                                        value={displayName} 
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        disabled={isGuest}
                                    />
                                </div>
                                {profileMessage && (
                                    <div className="text-sm text-muted-foreground">{profileMessage}</div>
                                )}
                                {!isGuest && (
                                    <Button onClick={handleProfileSave} disabled={savingProfile}>
                                        {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Save Profile
                                    </Button>
                                )}
                            </div>
                        )}
                    </section>

                    {!isGuest && (
                        <>
                            <section className="bg-card border rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Password</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Current Password</Label>
                                        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>New Password</Label>
                                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                    </div>
                                    {passwordMessage && (
                                        <div className="text-sm text-muted-foreground">{passwordMessage}</div>
                                    )}
                                    <Button onClick={handlePasswordSave} disabled={savingPassword}>
                                        {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Update Password
                                    </Button>
                                </div>
                            </section>

                            <section className="bg-card border rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Backup & Import</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Export a JSON backup of all your workspaces, spaces, folders, documents, tags, and PDF presets.
                                    Importing a backup replaces your current data.
                                </p>
                                <div className="flex flex-col gap-4">
                                    <Button variant="outline" className="justify-start" onClick={handleExport}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Export Backup
                                    </Button>

                                    <Separator />

                                    <div className="space-y-3">
                                        <Input
                                            type="file"
                                            accept="application/json"
                                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                        />
                                        <Button onClick={handleImport} disabled={importing}>
                                            {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            <Upload className="w-4 h-4 mr-2" />
                                            Import Backup
                                        </Button>
                                    </div>

                                    {backupMessage && (
                                        <div className="text-sm text-muted-foreground">{backupMessage}</div>
                                    )}
                                </div>
                            </section>

                            <section className="bg-card border rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Plug className="w-4 h-4 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold">WebDAV</h2>
                                </div>
                                {webdavLoading ? (
                                    <div className="flex items-center text-muted-foreground text-sm">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Loading WebDAV settings...
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={webdavConfig.enabled}
                                                onCheckedChange={(val) => setWebdavConfig((prev) => ({ ...prev, enabled: !!val }))}
                                            />
                                            <Label>Enable WebDAV integration</Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Server URL</Label>
                                            <Input
                                                value={webdavConfig.url}
                                                onChange={(e) => setWebdavConfig((prev) => ({ ...prev, url: e.target.value }))}
                                                placeholder="https://webdav.example.com/remote.php/dav/files/user"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Base Path</Label>
                                            <Input
                                                value={webdavConfig.basePath || "/"}
                                                onChange={(e) => setWebdavConfig((prev) => ({ ...prev, basePath: e.target.value }))}
                                                placeholder="/Notedown"
                                            />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Username</Label>
                                                <Input
                                                    value={webdavConfig.username}
                                                    onChange={(e) => setWebdavConfig((prev) => ({ ...prev, username: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Password</Label>
                                                <Input
                                                    type="password"
                                                    value={webdavConfig.password}
                                                    onChange={(e) => setWebdavConfig((prev) => ({ ...prev, password: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={webdavConfig.preferPdf}
                                                onCheckedChange={(val) => setWebdavConfig((prev) => ({ ...prev, preferPdf: !!val }))}
                                            />
                                            <Label>Store PDFs in WebDAV</Label>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="outline" onClick={handleWebdavTest} disabled={webdavTesting}>
                                                {webdavTesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                Test Connection
                                            </Button>
                                            <Button onClick={handleWebdavSave} disabled={webdavSaving}>
                                                {webdavSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                Save WebDAV
                                            </Button>
                                        </div>
                                        {webdavMessage && (
                                            <div className="text-sm text-muted-foreground">{webdavMessage}</div>
                                        )}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
