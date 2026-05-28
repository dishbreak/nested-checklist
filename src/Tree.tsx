import React, { useRef, useState } from "react";
import { flatten, getDescendants, getDragDepth, getDragProjection, TaskItem, type FlattenedTaskItem } from "./lib/taskItem";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { TreeItem } from "./TreeItem";
import { TreeItemOverlay } from "./TreeItemOverlay";
import { move } from "@dnd-kit/helpers";
import { isKeyboardEvent } from "@dnd-kit/utilities";

export interface Props {
    items: TaskItem[]
    indentation?: number
    onChange: (t: TaskItem[]) => void
}

export function Tree({ items, indentation = 50, onChange }: Props): React.JSX.Element {
    const [flattenedItems, setFlattenedItems] = useState<FlattenedTaskItem[]>(() => flatten(items))
    const initialDepth = useRef<number>(0)
    const sourceChildren = useRef<FlattenedTaskItem[]>([])

    return <DragDropProvider
        onDragStart={(event) => {
            const { source } = event.operation
            if (!source) return

            // take a snapshot of the depth
            const { depth, id } = flattenedItems.find(({ id }) => id === source.id)!
            initialDepth.current = depth

            setFlattenedItems((flattenedItems) => {
                // we don't want to drop a parent into its children
                // so we remove the children from the tree when its parent gets removed
                const descendants = getDescendants(flattenedItems, id)
                sourceChildren.current = [...descendants]
                return flattenedItems.filter((it) => !descendants.has(it))
            })
        }}
        onDragEnd={(event) => {
            if (event.canceled) {
                return setFlattenedItems(flatten(items))
            }

            const updatedTree = TaskItem.fromFlattenedItem([
                ...flattenedItems,
                ...sourceChildren.current,
            ])

            setFlattenedItems(flatten(updatedTree))
            onChange(updatedTree)
        }}

        onDragOver={(event, manager) => {
            const { source, target } = event.operation
            event.preventDefault();

            if (source && target && source.id !== target.id) {
                setFlattenedItems((flattenedItems) => {
                    const offsetLeft = manager.dragOperation.transform.x
                    const dragDepth = getDragDepth(offsetLeft, indentation)
                    const projectedDepth = initialDepth.current + dragDepth

                    const { depth, parentId } = getDragProjection(flattenedItems, projectedDepth, source.id as number)

                    const sortedItems = move(flattenedItems, event)
                    return sortedItems.map(item => item.id === source.id ? { ...item, depth, parentId } : item)
                })
            }
        }}
        onDragMove={(event, manager) => {
            if (event.defaultPrevented) return;

            const { source, target } = event.operation
            if (!source || !target) return;

            const keyboard = isKeyboardEvent(event.operation.activatorEvent)
            const currentDepth = source.data!.depth ?? 0
            let keyboardDepth: number | undefined

            if (keyboard) {
                if (event.by?.x !== 0 && event.by?.y === 0) {
                    event.preventDefault();
                    keyboardDepth = currentDepth + Math.sign(event.by!.x)
                }
            }

            const offsetLeft = manager.dragOperation.transform.x
            const dragDepth = getDragDepth(offsetLeft, indentation)
            const projectedDepth = keyboardDepth ?? initialDepth.current + dragDepth

            const { depth, parentId } = getDragProjection(flattenedItems, projectedDepth, source.id as number)

            if (keyboard && currentDepth != depth) {
                manager.actions.move({
                    by: { x: indentation * (depth - currentDepth), y: 0 },
                    propagate: false,
                })
            }

            if (source.data!.depth !== depth || source.data!.parentId !== parentId) {
                setFlattenedItems((flattenedItems) =>
                    flattenedItems.map(it => it.id === source.id ? { ...it, depth, parentId } : it))
            }
        }}
    >
        <ul>
            {flattenedItems.map((item, index) => {
                return <TreeItem key={item.id} item={item} index={index} />
            })}
        </ul>
        <DragOverlay>
            {
                (source) => (
                    <TreeItemOverlay name={source.data.name} count={sourceChildren.current.length} />
                )
            }
        </DragOverlay>
    </DragDropProvider>
}
