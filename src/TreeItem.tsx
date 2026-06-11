import type React from "react";
import type { FlattenedTaskItem } from "./lib/taskItem";
import { useSortable } from "@dnd-kit/react/sortable";
import { forwardRef, useRef } from "react";

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

export interface Props {
    item: FlattenedTaskItem
    index: number
    onChecked: (item: FlattenedTaskItem, value: boolean) => void
    onEditStart: (item: FlattenedTaskItem) => void
    onEditCancel: (iten: FlattenedTaskItem) => void
    onEditFinish: (item: FlattenedTaskItem, value: string) => void
}
export function TreeItem({ item, index, onChecked, onEditStart, onEditCancel, onEditFinish }: Props): React.JSX.Element {
    const { id, depth, parentId, name } = item
    const { ref, handleRef, isDragSource } = useSortable({
        ...config,
        id,
        index,
        data: {
            name,
            depth,
            parentId,
        },
    })

    const editRef = useRef<HTMLInputElement>(null)

    return (
        <li
            ref={ref}
            className={[
                'relative flex items-center gap-2.5 px-2.5 py-2.5',
                'bg-white border border-[#dedede] -mb-px text-[#222]',
                'rounded-md',
                'aria-hidden:opacity-40'
            ].join(' ')}
            style={{ marginLeft: depth * INDENTATION }}
            aria-hidden={isDragSource}
        >
            <span className="group-aria-hidden/row:invisible">
                <Handle ref={handleRef} />
            </span>
            <input type="checkbox" checked={item.checked} onChange={e => onChecked(item, e.target.checked)} />
            {
                item.editing ?
                    <input type="text" id={`task-id-${item.id}`} className="grow" defaultValue={item.name} ref={editRef}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                onEditFinish(item, editRef.current!.value)
                            } else if (e.key === "Escape") {
                                onEditCancel(item)
                            }
                        }}
                        onBlur={() => {
                            onEditCancel(item)
                        }}
                    /> :
                    <div className="grow hover:bg-[#dedede]" onClick={() => onEditStart(item)}>{name}</div>
            }
        </li>
    )
}

interface HandleProps extends React.HTMLAttributes<HTMLButtonElement> { }

const Handle = forwardRef<HTMLButtonElement, HandleProps>(
    ({ className, ...props }, ref) => {
        return (
            <button
                ref={ref}
                aria-label="Drag Handle"
                className={[
                    className,
                    'flex w-3, p-3.75 items-center justify-center flex-none',
                    'touch-none cursor-grab rounded-[5px] border-none outline-none',
                    'appearance-none bg-transparent select-none',
                    '[-webkit-tap-highlight-color:transparent]',
                    'hover:bg-black/5 active:bg-black/5 active:cursor-grabbing',
                    'focus-visible:shadow-[inset_0_0_0_2.5px_#4c9ffe]',
                    'text-[#919eab] hover:text-[#6f7b88]',
                    'group-hover:text-[#6f7b88]',
                    'group-data-[dragging=true]:cursor-grabbing',
                    'group-data-[dragging=true]:test-[#4c9ffe]',
                ].join(' ')}
                {...props}
            >
                <DragDotsIcon />
            </button>
        )
    }
)

function DragDotsIcon() {
    return <svg viewBox="0 0 20 20" className="block w-3 h-3 shrink-0 fill-current">
        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
}
