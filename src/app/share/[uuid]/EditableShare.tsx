"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface EditableShareProps {
    uuid: string;
}

export default function EditableShare({ uuid }: EditableShareProps) {
    return (
        <Button asChild variant="outline" size="sm">
            <Link href={`/share/${uuid}/edit`}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Live
            </Link>
        </Button>
    );
}
