"use client";

import { TreeNode as TreeNodeType } from "@/lib/tree";
import { Space, Folder } from "@/lib/types";
import { FolderItem } from "./FolderItem";
import { DocItem } from "./DocItem";

interface TreeNodeItemProps {
    node: TreeNodeType;
    space: Space;
    folders: Folder[];
    depth: number;
}

export function TreeNodeItem({ node, space, folders, depth }: TreeNodeItemProps) {
    if (node.type === "document") {
        return <DocItem node={node} space={space} folders={folders} depth={depth} />;
    }

    return (
        <FolderItem node={node} space={space} folders={folders} depth={depth}>
            {node.children?.map((child) => (
                <TreeNodeItem key={child.id} node={child} space={space} folders={folders} depth={depth + 1} />
            ))}
        </FolderItem>
    );
}
