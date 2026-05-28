import type React from "react";
import type { FlattenedTaskItem } from "./lib/taskItem";
import { useSortable } from "@dnd-kit/react/sortable";

const INDENTATION = 50;

const config = {
    alignment: {
        x: 'start',
        y: 'center',
    },
    transition: {
        idle: true,
    },
} as const;

export function TreeItem({item, index}: {item: FlattenedTaskItem, index: number}): React.JSX.Element {
    const {id, depth, parentId, name} = item
    const {ref, isDragSource} = useSortable({
        ...config,
        id,
        index,
        data: {
            name,
            depth,
            parentId,
        },
    })

    return (
        <li
            ref={ref}
            className="px-2 py-1 flex bg-amber-100"
            style={{marginLeft: depth * INDENTATION}}
            aria-hidden={isDragSource}
        >
            {name}
        </li>
    )
}
