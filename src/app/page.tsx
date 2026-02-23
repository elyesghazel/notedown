"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getSpaces().then(async (spaces) => {
            if (spaces.length > 0) {
                // Redirect to first space's readme.md
                router.replace(`/${spaces[0].slug}/readme.md`);
            } else {
                setLoading(false);
            }
        }).catch(() => {
            // If spaces can't be loaded, show onboarding
            setLoading(false);
        });
    }, [router]);

    const handleCreateOnboardingSpace = async () => {
        setLoading(true);
        const workspaces = await api.getWorkspaces();
        let wsId = workspaces[0]?.id;
        if (!wsId) {
            const newWs = await api.createWorkspace("Personal");
            wsId = newWs.id;
        }
        const space = await api.createSpace(wsId, "Personal");
        router.replace(`/${space.slug}/readme.md`);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-background">
            <div className="max-w-md text-center space-y-6 p-8 border rounded-xl shadow-lg bg-card">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to Notes</h1>
                <p className="text-muted-foreground text-lg">
                    A lightweight, file-system backed markdown note-taking workspace.
                </p>
                <Button onClick={handleCreateOnboardingSpace} size="lg" className="w-full text-base">
                    Create First Space
                </Button>
            </div>
        </div>
    );
}
