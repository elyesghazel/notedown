import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Zap, Command, MonitorPlay, PencilRuler, MousePointer2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Help & Guides - Markdown Notes',
};

export default function HelpPage() {
    return (
        <div className="flex-1 w-full h-full bg-background overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <div className="mb-10">
                    <Link href="/">
                        <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to App
                        </Button>
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Help & Documentation</h1>
                    <p className="text-xl text-muted-foreground">Everything you need to master your markdown notes.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Section 1: Keyboard Shortcuts */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                            <Command className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
                        <ul className="space-y-4">
                            <li className="flex justify-between items-center text-sm border-b pb-2 border-border/50">
                                <span className="text-muted-foreground">Global Search</span>
                                <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">Cmd/Ctrl + K</kbd>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b pb-2 border-border/50">
                                <span className="text-muted-foreground">Power Commands</span>
                                <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">Cmd/Ctrl + Shift + P</kbd>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b pb-2 border-border/50">
                                <span className="text-muted-foreground">Find in File</span>
                                <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">Cmd/Ctrl + F</kbd>
                            </li>
                            <li className="flex justify-between items-center text-sm border-b pb-2 border-border/50">
                                <span className="text-muted-foreground">Toggle Preview (Mobile)</span>
                                <kbd className="px-2 py-1 bg-muted rounded font-mono text-xs">Bottom Toolbar</kbd>
                            </li>
                        </ul>
                    </div>

                    {/* Section 2: Image Resizing */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                            <PencilRuler className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-4">Resizing Images</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            You don't need to write raw HTML to resize images! You can either:
                        </p>
                        <div className="space-y-4">
                            <div className="text-sm border-l-2 border-primary/30 pl-3">
                                <p className="font-semibold text-foreground mb-1">1. Interactive Resizing</p>
                                <p className="text-muted-foreground">In the Preview pane, hover over any image and <strong>drag the blue handle</strong> in the bottom-right corner. The markdown code will update automatically!</p>
                            </div>
                            <div className="text-sm border-l-2 border-primary/30 pl-3">
                                <p className="font-semibold text-foreground mb-1">2. Manual Markdown</p>
                                <p className="text-muted-foreground">Add the size inside the brackets using a <code>|</code> pipe or <code>=</code> sign.</p>
                            </div>
                        </div>
                        <div className="bg-background border rounded-lg p-4 font-mono text-xs space-y-3 opacity-90 overflow-x-auto mt-4">
                            <div>
                                <span className="text-muted-foreground block mb-1">Lock width to 300px:</span>
                                <code>![My Image | 300](/example.png)</code>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">Lock width and height:</span>
                                <code>![My Image =300x400](/example.png)</code>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">With no alt text:</span>
                                <code>![](https://example.com/img.jpg | 500)</code>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Context Menus */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                            <MousePointer2 className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-4">Context Menus</h2>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            Organizing your workspace is meant to be as fluid as modern default file explorers. You can <strong>Right-Click</strong> anywhere in the left sidebar to pop open actions!
                        </p>
                        <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
                            <li><strong>Right-Click a Folder:</strong> Create subfolders, new notes inside it, rename, or delete.</li>
                            <li><strong>Right-Click a Note:</strong> Quickly rename or delete without opening it.</li>
                            <li><strong>Right-Click a Space:</strong> Rename your space or wipe its contents.</li>
                        </ul>
                    </div>

                    {/* Section 4: Quick Capture & Search */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-4">Search & Quick Capture</h2>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            Need to jot something down instantly? Use the <strong>Quick Capture</strong> button to create an auto-timestamped note in your private Inbox.
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Later, use the global search bar (<kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">Cmd+K</kbd>) to search for strings <strong>inside</strong> any file across all your spaces!
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
