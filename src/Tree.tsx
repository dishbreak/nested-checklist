import React, { useRef, useState } from "react";
import { checkAncestors, flatten, getDescendants, getDragDepth, getDragProjection, TaskItem, update, type FlattenedTaskItem } from "./lib/taskItem";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { TreeItem } from "./TreeItem";
import { TreeItemOverlay } from "./TreeItemOverlay";
import { move } from "@dnd-kit/helpers";
import { isKeyboardEvent } from "@dnd-kit/utilities";
import { useHotkeys } from "react-hotkeys-hook";

export interface Props {
    items: TaskItem[]
    indentation?: number
    onChange: (t: TaskItem[]) => void
}

export function Tree({ items, indentation = 50, onChange }: Props): React.JSX.Element {
    const [flattenedItems, setFlattenedItems] = useState<FlattenedTaskItem[]>(() => flatten(items))
    const initialDepth = useRef<number>(0)
    const sourceChildren = useRef<FlattenedTaskItem[]>([])
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

    const updateFocusedIndex = (newVal: number): ((existing: number | null) => number) => {
        return (existing: number | null) => {
            console.log(existing, newVal)
            setFlattenedItems((flattenedItems) => {
                if (existing !== null) {
                    flattenedItems[existing].focused = false
                }
                flattenedItems[newVal].focused = true
                return flattenedItems.map(n => structuredClone(n))
            })
            return newVal
        }
    }

    useHotkeys('k', () => {
        if (focusedIndex === null) {
            setFocusedIndex(updateFocusedIndex(0))
            return
        }

        setFocusedIndex((focusedIndex + 1) % flattenedItems.length)
    })

    useHotkeys('j', () => {
        if (focusedIndex === null || focusedIndex === 0) {
            setFocusedIndex(updateFocusedIndex(flattenedItems.length - 1))
            return
        }
        setFocusedIndex(updateFocusedIndex(focusedIndex - 1))
    })

    useHotkeys('e', () => {
        if (focusedIndex === null) {
            return
        }
        setFlattenedItems((flattenedItems) => {
            return flattenedItems.map((i) => {
                const j = structuredClone(i)
                j.editing = j.focused
                return j
            })
        })
    }, { keydown: false, keyup: true })

    const onChecked = (item: FlattenedTaskItem, value: boolean): void => {
        setFlattenedItems((flattenedItems) => {
            const results = flattenedItems.map(i => structuredClone(i))
            update(results, item.id, value)
            checkAncestors(results, item.id)
            onChange(TaskItem.fromFlattenedItem(results))
            return results
        })
    }

    const onEditCancel = (item: FlattenedTaskItem) => {
        setFlattenedItems((flattenedItems) => {
            return flattenedItems.map(i => {
                const j = structuredClone(i)
                if (j.id === item.id) {
                    j.editing = false
                }
                return j
            })
        })
    }

    const onEditStart = (item: FlattenedTaskItem) => {
        setFlattenedItems(flattenedItems => {
            return flattenedItems.map(i => {
                const j = structuredClone(i)
                if (j.id === item.id) {
                    j.editing = true
                }
                return j
            })
        })
    }

    const onEditFinish = (item: FlattenedTaskItem, value: string) => {
        setFlattenedItems(flattenedItems => {
            const results = flattenedItems.map(i => {
                const j = structuredClone(i)
                if (j.id === item.id) {
                    j.name = value
                    j.editing = false
                }
                return j
            })
            // propagate the changed value back to the parent via the onChange() callback.
            onChange(TaskItem.fromFlattenedItem(results))
            return results
        })
    }

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
                setFlattenedItems((flattenedItems) => {
                    // if we're moving the item, uncheck it.
                    const result = flattenedItems.map(it => it.id === source.id ? { ...it, depth, parentId, checked: false } : it)
                    checkAncestors(result, source.id as number)
                    return result
                })
            }
        }}
    >
        <ul>
            {flattenedItems.map((item, index) => {
                return <TreeItem
                    key={item.id} item={item} index={index}
                    onChecked={onChecked}
                    onEditStart={onEditStart} onEditFinish={onEditFinish} onEditCancel={onEditCancel}
                    onAddChild={() => { }} onAddSibling={() => { }}
                    focused={index === focusedIndex} />
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
