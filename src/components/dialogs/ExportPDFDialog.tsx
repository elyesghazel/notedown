"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Loader2, Copy, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { PDFHeaderFooterItem, PDFPreset } from "@/lib/types";

type HeaderFooterContent = PDFHeaderFooterItem;
type PreparedItem = HeaderFooterContent & { _imageHeightMm?: number };

interface ExportPDFDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentName?: string;
}

const POSITION_OPTIONS = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
] as const;

const CONTENT_TYPES = [
    { value: "text", label: "Custom Text" },
    { value: "page_number", label: "Page Number" },
    { value: "date", label: "Date" },
    { value: "logo", label: "Logo" },
] as const;

export function ExportPDFDialog({ open, onOpenChange, documentName = "document" }: ExportPDFDialogProps) {
    const [loading, setLoading] = useState(false);
    const [headerItems, setHeaderItems] = useState<HeaderFooterContent[]>([
        { position: "center", type: "text", value: documentName },
    ]);
    const [footerItems, setFooterItems] = useState<HeaderFooterContent[]>([
        { position: "center", type: "page_number", value: "" },
    ]);
    const [presets, setPresets] = useState<PDFPreset[]>([]);
    const [presetName, setPresetName] = useState("");
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const [savingPreset, setSavingPreset] = useState(false);
    const [uploadingLogoKey, setUploadingLogoKey] = useState<string | null>(null);
    const [logoMeta, setLogoMeta] = useState<Record<string, { width: number; height: number }>>({});

    useEffect(() => {
        let active = true;
        api.getPdfPresets()
            .then((data) => {
                if (!active) return;
                setPresets(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!active) return;
                setPresets([]);
            });
        return () => {
            active = false;
        };
    }, []);

    const loadImageData = (url: string) =>
        new Promise<{ dataUrl: string; width: number; height: number }>((resolve, reject) => {
            const img = new Image();
            if (!url.startsWith("data:")) {
                img.crossOrigin = "anonymous";
            }
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Canvas not available"));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                resolve({ dataUrl: canvas.toDataURL("image/png"), width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => reject(new Error("Failed to load logo image"));
            img.src = url;
        });

    const getLogoSize = (url: string) => logoMeta[url];

    const updateLogoMeta = (url: string, width: number, height: number) => {
        setLogoMeta((prev) => {
            const current = prev[url];
            if (current && current.width === width && current.height === height) return prev;
            return { ...prev, [url]: { width, height } };
        });
    };



    const addHeaderItem = () => {
        setHeaderItems([...headerItems, { position: "left", type: "text", value: "" }]);
    };

    const removeHeaderItem = (index: number) => {
        setHeaderItems(headerItems.filter((_, i) => i !== index));
    };

    const updateHeaderItem = (index: number, updates: Partial<HeaderFooterContent>) => {
        setHeaderItems(headerItems.map((item, i) => (i === index ? { ...item, ...updates } : item)));
    };

    const addFooterItem = () => {
        setFooterItems([...footerItems, { position: "left", type: "text", value: "" }]);
    };

    const removeFooterItem = (index: number) => {
        setFooterItems(footerItems.filter((_, i) => i !== index));
    };

    const updateFooterItem = (index: number, updates: Partial<HeaderFooterContent>) => {
        setFooterItems(footerItems.map((item, i) => (i === index ? { ...item, ...updates } : item)));
    };

    const applyPreset = (preset: PDFPreset) => {
        setHeaderItems(Array.isArray(preset.header) ? preset.header : []);
        setFooterItems(Array.isArray(preset.footer) ? preset.footer : []);
        setPresetName(preset.name);
        setSelectedPresetId(preset.id);
    };

    const handleSavePreset = async (mode: "new" | "update") => {
        if (!presetName.trim()) {
            alert("Preset name is required");
            return;
        }

        setSavingPreset(true);
        try {
            if (mode === "new") {
                const created = await api.createPdfPreset(presetName.trim(), headerItems, footerItems);
                setPresets((prev) => [...prev, created]);
                setSelectedPresetId(created.id);
            } else if (selectedPresetId) {
                const updated = await api.updatePdfPreset(selectedPresetId, {
                    name: presetName.trim(),
                    header: headerItems,
                    footer: footerItems,
                });
                setPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            }
        } catch {
            alert("Failed to save preset");
        } finally {
            setSavingPreset(false);
        }
    };

    const handleDeletePreset = async () => {
        if (!selectedPresetId) return;
        const target = presets.find((p) => p.id === selectedPresetId);
        if (!target || !confirm(`Delete preset "${target.name}"?`)) return;

        try {
            await api.deletePdfPreset(selectedPresetId);
            setPresets((prev) => prev.filter((p) => p.id !== selectedPresetId));
            setSelectedPresetId(null);
            setPresetName("");
        } catch {
            alert("Failed to delete preset");
        }
    };

    const handleLogoUpload = async (section: "header" | "footer", index: number, file: File) => {
        const key = `${section}-${index}`;
        setUploadingLogoKey(key);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();
            const url = data?.url as string | undefined;
            if (!url) throw new Error("Upload failed");
            // Convert /uploads/filename to /api/uploads/filename for API route serving
            const filename = url.split('/').pop();
            const apiUrl = `/api/uploads/${filename}`;
            if (section === "header") {
                updateHeaderItem(index, { value: apiUrl });
            } else {
                updateFooterItem(index, { value: apiUrl });
            }
        } catch {
            alert("Failed to upload logo");
        } finally {
            setUploadingLogoKey(null);
        }
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const element = document.querySelector(".prose") as HTMLElement;
            if (!element) throw new Error("Preview not found — switch to Split or Preview mode first");

            const prepareItems = async (items: HeaderFooterContent[]) => {
                const prepared = await Promise.all(items.map(async (item) => {
                    if (item.type !== "logo" || !item.value) return item;
                    try {
                        const { dataUrl, width, height } = await loadImageData(item.value);
                        updateLogoMeta(item.value, width, height);
                        return { ...item, value: dataUrl };
                    } catch {
                        return item;
                    }
                }));
                return prepared;
            };

            const preparedHeader = await prepareItems(headerItems);
            const preparedFooter = await prepareItems(footerItems);

            const response = await fetch("/api/export/pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    html: element.innerHTML,
                    header: preparedHeader,
                    footer: preparedFooter,
                }),
            });

            if (!response.ok) {
                let errorMsg = "Failed to export PDF";
                try {
                    const errorData = await response.json();
                    if (errorData.error) errorMsg = errorData.error;
                } catch {
                    // Ignore
                }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${documentName}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            onOpenChange(false);
        } catch (err) {
            console.error(err);
            alert("Failed to export PDF: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Export to PDF</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                        Save and reuse PDF layouts with presets.
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs">Preset</Label>
                            <Select
                                value={selectedPresetId || "custom"}
                                onValueChange={(val) => {
                                    if (val === "custom") {
                                        setSelectedPresetId(null);
                                        return;
                                    }
                                    const preset = presets.find((p) => p.id === val);
                                    if (preset) applyPreset(preset);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose preset" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="custom">Custom</SelectItem>
                                    {presets.map((preset) => (
                                        <SelectItem key={preset.id} value={preset.id}>
                                            {preset.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Preset Name</Label>
                            <Input
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                placeholder="e.g. School Header"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleSavePreset("new")} disabled={savingPreset}>
                            {savingPreset && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save New Preset
                        </Button>
                        <Button onClick={() => handleSavePreset("update")} disabled={savingPreset || !selectedPresetId}>
                            {savingPreset && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Preset
                        </Button>
                        <Button variant="ghost" onClick={handleDeletePreset} disabled={!selectedPresetId}>
                            Delete Preset
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="header" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="header">Header</TabsTrigger>
                        <TabsTrigger value="footer">Footer</TabsTrigger>
                    </TabsList>

                    <TabsContent value="header" className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Configure header content for your PDF. Choose position and type for each element.
                        </div>

                        <div className="space-y-3">
                            {headerItems.map((item, index) => (
                                <div key={index} className="border rounded-lg p-3 space-y-3">
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <Label className="text-xs mb-1 block">Position</Label>
                                            <Select
                                                value={item.position}
                                                onValueChange={(val) => updateHeaderItem(index, { position: val as any })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {POSITION_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex-1">
                                            <Label className="text-xs mb-1 block">Type</Label>
                                            <Select
                                                value={item.type}
                                                onValueChange={(val) => {
                                                    const nextType = val as HeaderFooterContent["type"];
                                                    updateHeaderItem(index, {
                                                        type: nextType,
                                                        value: "",
                                                        size: nextType === "logo" ? 18 : undefined,
                                                    });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CONTENT_TYPES.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                            onClick={() => removeHeaderItem(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {item.type === "text" && (
                                        <div>
                                            <Label className="text-xs mb-1 block">Text</Label>
                                            <Input
                                                value={item.value}
                                                onChange={(e) => updateHeaderItem(index, { value: e.target.value })}
                                                placeholder="Enter text..."
                                            />
                                        </div>
                                    )}

                                    {item.type === "logo" && (
                                        <div className="space-y-2">
                                            <div>
                                                <Label className="text-xs mb-1 block">Logo URL</Label>
                                                <Input
                                                    value={item.value}
                                                    onChange={(e) => updateHeaderItem(index, { value: e.target.value })}
                                                    placeholder="/uploads/logo.png or https://..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs mb-1 block">Width (mm)</Label>
                                                    <Input
                                                        type="number"
                                                        min={8}
                                                        max={80}
                                                        value={item.size || 18}
                                                        onChange={(e) => updateHeaderItem(index, { size: Number(e.target.value) || 18 })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs mb-1 block">Upload</Label>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={uploadingLogoKey === `header-${index}`}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleLogoUpload("header", index, file);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            {uploadingLogoKey === `header-${index}` && (
                                                <div className="text-xs text-muted-foreground flex items-center">
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                    Uploading logo...
                                                </div>
                                            )}
                                            {item.value && (
                                                <div className="border rounded-lg p-2 bg-muted/30">
                                                    {(() => {
                                                        const meta = getLogoSize(item.value);
                                                        const widthMm = item.size || 18;
                                                        const heightMm = meta ? (meta.height * widthMm) / meta.width : null;
                                                        const pxPerMm = 3.78;
                                                        const maxWidthPx = 300;
                                                        let widthPx = widthMm * pxPerMm;
                                                        let heightPx = heightMm ? heightMm * pxPerMm : widthPx;
                                                        if (widthPx > maxWidthPx) {
                                                            const scale = maxWidthPx / widthPx;
                                                            widthPx *= scale;
                                                            heightPx *= scale;
                                                        }
                                                        return (
                                                            <div className="space-y-2">
                                                                <div className="text-xs text-muted-foreground">
                                                                    {heightMm
                                                                        ? `Preview size: ${widthMm.toFixed(1)}mm x ${heightMm.toFixed(1)}mm`
                                                                        : `Preview size: ${widthMm.toFixed(1)}mm (loading...)`}
                                                                </div>
                                                                <div className="max-h-40 overflow-auto">
                                                                    <img
                                                                        src={item.value}
                                                                        alt="Logo preview"
                                                                        onLoad={(e) => {
                                                                            const target = e.currentTarget;
                                                                            if (target.naturalWidth && target.naturalHeight) {
                                                                                updateLogoMeta(item.value, target.naturalWidth, target.naturalHeight);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            width: `${widthPx}px`,
                                                                            height: heightMm ? `${heightPx}px` : "auto",
                                                                            objectFit: "contain",
                                                                            display: "block",
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {item.type === "date" && (
                                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                            Will display current date in PDF
                                        </div>
                                    )}

                                    {item.type === "page_number" && (
                                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                            Will display page number in PDF
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" onClick={addHeaderItem} className="w-full">
                            <Copy className="w-4 h-4 mr-2" />
                            Add Header Element
                        </Button>
                    </TabsContent>

                    <TabsContent value="footer" className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Configure footer content for your PDF. Choose position and type for each element.
                        </div>

                        <div className="space-y-3">
                            {footerItems.map((item, index) => (
                                <div key={index} className="border rounded-lg p-3 space-y-3">
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <Label className="text-xs mb-1 block">Position</Label>
                                            <Select
                                                value={item.position}
                                                onValueChange={(val) => updateFooterItem(index, { position: val as any })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {POSITION_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex-1">
                                            <Label className="text-xs mb-1 block">Type</Label>
                                            <Select
                                                value={item.type}
                                                onValueChange={(val) => {
                                                    const nextType = val as HeaderFooterContent["type"];
                                                    updateFooterItem(index, {
                                                        type: nextType,
                                                        value: "",
                                                        size: nextType === "logo" ? 18 : undefined,
                                                    });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CONTENT_TYPES.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                            onClick={() => removeFooterItem(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {item.type === "text" && (
                                        <div>
                                            <Label className="text-xs mb-1 block">Text</Label>
                                            <Input
                                                value={item.value}
                                                onChange={(e) => updateFooterItem(index, { value: e.target.value })}
                                                placeholder="Enter text..."
                                            />
                                        </div>
                                    )}

                                    {item.type === "logo" && (
                                        <div className="space-y-2">
                                            <div>
                                                <Label className="text-xs mb-1 block">Logo URL</Label>
                                                <Input
                                                    value={item.value}
                                                    onChange={(e) => updateFooterItem(index, { value: e.target.value })}
                                                    placeholder="/uploads/logo.png or https://..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs mb-1 block">Width (mm)</Label>
                                                    <Input
                                                        type="number"
                                                        min={8}
                                                        max={80}
                                                        value={item.size || 18}
                                                        onChange={(e) => updateFooterItem(index, { size: Number(e.target.value) || 18 })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs mb-1 block">Upload</Label>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={uploadingLogoKey === `footer-${index}`}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleLogoUpload("footer", index, file);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            {uploadingLogoKey === `footer-${index}` && (
                                                <div className="text-xs text-muted-foreground flex items-center">
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                    Uploading logo...
                                                </div>
                                            )}
                                            {item.value && (
                                                <div className="border rounded-lg p-2 bg-muted/30">
                                                    {(() => {
                                                        const meta = getLogoSize(item.value);
                                                        const widthMm = item.size || 18;
                                                        const heightMm = meta ? (meta.height * widthMm) / meta.width : null;
                                                        const pxPerMm = 3.78;
                                                        const maxWidthPx = 300;
                                                        let widthPx = widthMm * pxPerMm;
                                                        let heightPx = heightMm ? heightMm * pxPerMm : widthPx;
                                                        if (widthPx > maxWidthPx) {
                                                            const scale = maxWidthPx / widthPx;
                                                            widthPx *= scale;
                                                            heightPx *= scale;
                                                        }
                                                        return (
                                                            <div className="space-y-2">
                                                                <div className="text-xs text-muted-foreground">
                                                                    {heightMm
                                                                        ? `Preview size: ${widthMm.toFixed(1)}mm x ${heightMm.toFixed(1)}mm`
                                                                        : `Preview size: ${widthMm.toFixed(1)}mm (loading...)`}
                                                                </div>
                                                                <div className="max-h-40 overflow-auto">
                                                                    <img
                                                                        src={item.value}
                                                                        alt="Logo preview"
                                                                        onLoad={(e) => {
                                                                            const target = e.currentTarget;
                                                                            if (target.naturalWidth && target.naturalHeight) {
                                                                                updateLogoMeta(item.value, target.naturalWidth, target.naturalHeight);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            width: `${widthPx}px`,
                                                                            height: heightMm ? `${heightPx}px` : "auto",
                                                                            objectFit: "contain",
                                                                            display: "block",
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {item.type === "date" && (
                                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                            Will display current date in PDF
                                        </div>
                                    )}

                                    {item.type === "page_number" && (
                                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                            Will display page number in PDF
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" onClick={addFooterItem} className="w-full">
                            <Copy className="w-4 h-4 mr-2" />
                            Add Footer Element
                        </Button>
                    </TabsContent>
                </Tabs>

                <Separator />

                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
