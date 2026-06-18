export interface TaskItemInput {
    name: string;
    id?: number
    children?: TaskItemInput[]
}


export const { getId, __reset } = (() => {
    let count = -1 // ensures first ID is 0
    return {
        getId: (): number => {
            count++
            return count
        },
        __reset: () => {
            count = -1
        }
    }
})()

export class TaskItem {
    id: number = 0
    name: string = ""
    children: TaskItem[] = []
    checked: boolean = false
    parent?: TaskItem
    editing: boolean = false
    focused: boolean = false

    static fromInput(i: TaskItemInput, parent?: TaskItem): TaskItem {
        const t = new TaskItem()
        t.id = i.id ?? getId()
        t.name = i.name
        t.parent = parent ?? t.parent
        t.children = i.children?.map(c => TaskItem.fromInput(c, t)) ?? []
        return t
    }

    static fromFlattenedItem(f: FlattenedTaskItem[]): TaskItem[] {
        const nodeMap = new Map<number, TaskItem>()
        const t = f.map(n => {
            const i = new TaskItem()
            i.id = n.id
            i.checked = n.checked
            i.name = n.name
            i.editing = n.editing
            i.focused = n.focused
            nodeMap.set(i.id, i)
            return i
        })

        f.forEach(n => {
            const i = nodeMap.get(n.id)!
            if (n.parentId !== undefined) {
                i.parent = nodeMap.get(n.parentId)
                i.parent?.children.push(i)
            }
        })

        // return only the items with no parent.
        return t.filter(n => n.parent === undefined)
    }

    clone(parent?: TaskItem): TaskItem {
        const c = new TaskItem()
        c.checked = this.checked
        c.name = this.name
        c.id = this.id
        c.parent = parent
        c.children = this.children.map(n => n.clone(c))
        return c
    }

    allChildren(callback: (t: TaskItem) => boolean, includeSelf: boolean = false): boolean {
        if (includeSelf && !callback(this)) {
            return false
        }
        return this.children.every(c => c.allChildren(callback, true))
    }

    update(value: boolean): void {
        this.checked = value
        this.updateDescendants(value)
        this.updateAncestors()
    }

    updateAncestors(): void {
        if (this.parent === undefined) {
            return
        }
        const c = this.parent
        c.checked = c.allChildren(n => n.checked)
        c.updateAncestors()
    }

    updateDescendants(value: boolean): void {
        this.checked = value
        this.children.forEach(c => c.updateDescendants(value))
    }

    find(callback: (t: TaskItem) => boolean): TaskItem | undefined {
        if (callback(this)) {
            return this
        }

        for (const c of this.children) {
            const result = c.find(callback)
            if (result !== undefined) {
                return result
            }
        }
        return undefined
    }

    delete(): void {
        if (this.parent === undefined) {
            return
        }

        const idx = this.parent.children.findIndex(c => c.id === this.id)
        if (idx === -1) {
            throw new Error("inconsistent tree -- could not find child in parent's children")
        }

        this.parent.children = this.parent.children.splice(idx, 1)
    }
}

// an alternative representation of a TaskItem that models the tree as a flat list
export interface FlattenedTaskItemProps {
    parentId?: number
    name: string
    checked: boolean
    editing: boolean
    focused: boolean
}

export interface FlattenedTaskItem extends FlattenedTaskItemProps {
    id: number
    depth: number
    index: number
}

export function flatten(taskItems: TaskItem[], depth: number = 0, parentId?: number): FlattenedTaskItem[] {
    return taskItems.reduce<FlattenedTaskItem[]>((acc, item, index) => {
        const { id, checked, name, editing, focused } = item
        return [
            ...acc,
            { id, checked, name, parentId, depth, index, editing, focused },
            ...flatten(item.children, depth + 1, item.id)
        ]
    }, [])
}

export function getDragDepth(offset: number, indentationWidth: number): number {
    return Math.round(offset / indentationWidth)
}

export interface DragProjection {
    depth: number,
    minDepth: number,
    maxDepth: number,
    parentId?: number,
}

export function getDragProjection(items: FlattenedTaskItem[], projectedDepth: number, targetItemId: number): DragProjection {
    const targetItemIdx = items.findIndex(n => n.id === targetItemId)
    if (targetItemIdx === -1) {
        throw new Error(`unable to find item with id ${targetItemId}`)
    }

    const targetItem = items[targetItemIdx]
    const previousItemDepth = items[targetItemIdx - 1]?.depth ?? 0
    const maxDepth = Math.min(previousItemDepth, targetItem.depth) + 1
    const minDepth = items[targetItemIdx + 1]?.depth ?? 0

    let depth = projectedDepth
    if (depth >= maxDepth) {
        depth = maxDepth
    } else if (depth < minDepth) {
        depth = minDepth
    }

    return {
        depth, minDepth, maxDepth,
        parentId: (() => {
            if (depth === 0) {
                return undefined;
            }

            if (depth >= previousItemDepth) {
                return items[targetItemIdx - 1]?.id
            }

            return items
                .slice(0, targetItemIdx)
                .reverse()
                .find((i) => i.depth === depth)?.parentId
        })()
    }

}

export function getDescendants(items: FlattenedTaskItem[], id: number): Set<FlattenedTaskItem> {
    return items.filter(({ parentId }) => parentId === id)
        .reduce((acc, child) => {
            return new Set([
                ...acc,
                child,
                ...getDescendants(items, child.id)
            ])
        }, new Set<FlattenedTaskItem>())
}

export function update(items: FlattenedTaskItem[], id: number, value: boolean): void {
    const item = items.find(i => i.id === id)
    if (!item) {
        return;
    }
    item.checked = value
    items.filter(i => i.parentId === id).forEach(
        i => update(items, i.id, value)
    )
}

export function checkAncestors(items: FlattenedTaskItem[], id: number): void {
    const item = items.find(i => i.id === id)
    if (!item) return;
    const parentId = item.parentId
    if (parentId === undefined) return;
    const parent = items.find(i => i.id === parentId)!
    parent.checked = items.filter(i => i.parentId === parentId).every(i => i.checked)
    checkAncestors(items, parentId)
}

export type InsertOperation = (items: FlattenedTaskItem[], anchor: FlattenedTaskItem, payload: FlattenedTaskItemProps) => void

export function insertChild(items: FlattenedTaskItem[], parent: FlattenedTaskItem, payload: FlattenedTaskItemProps): void {
    const children = items.filter(i => i.parentId === parent.id)
    if (children.length === 0) {
        // we'll reconstitute 
        items.push({
            ...payload,
            id: getId(),
            depth: parent.depth + 1,
            index: 0,
            parentId: parent.id,
        })
        return
    }

    // sort the children by index
    children.sort((a, b) => a.index - b.index)

    const highIndex = children[children.length - 1].index
    items.push(
        {
            ...payload,
            id: getId(),
            depth: parent.depth + 1,
            index: highIndex + 1,
            parentId: parent.id,
        }
    )
}

export function insertSibling(items: FlattenedTaskItem[], sibling: FlattenedTaskItem, payload: FlattenedTaskItemProps): void {
    const siblings = items.filter(i => i.parentId === sibling.parentId)
    siblings.sort((a, b) => a.index - b.index)
    const index = siblings[siblings.length - 1].index + 1
    const { depth, parentId } = sibling
    items.push({
        ...payload,
        id: getId(),
        depth,
        parentId,
        index,
    })
}
