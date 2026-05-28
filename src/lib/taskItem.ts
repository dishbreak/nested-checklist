export interface TaskItemInput {
    name: string;
    children?: TaskItemInput[]
}


const getId: () => number = (() => {
    let count = -1 // ensures first ID is 0
    return (): number => {
        count++
        return count
    }
})()


export class TaskItem {
    id: number = 0
    name: string = ""
    children: TaskItem[] = []
    checked: boolean = false
    parent?: TaskItem

    static fromInput(i: TaskItemInput, parent?: TaskItem): TaskItem {
        const t = new TaskItem()
        t.id = getId()
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
}

// an alternative representation of a TaskItem that models the tree as a flat list
export interface FlattenedTaskItem {
    depth: number
    index: number
    parentId?: number
    name: string
    id: number
    checked:boolean
}

export function flatten(taskItems: TaskItem[], depth: number = 0, parentId?:number): FlattenedTaskItem[] {
    return taskItems.reduce<FlattenedTaskItem[]>((acc, item, index) => {
        return [
            ...acc,
            {...item, parentId, depth, index},
            ...flatten(item.children, depth=depth+1, parentId=item.id)
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
    const previousItemDepth = items[targetItemIdx-1]?.depth ?? 0
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
                return items[targetItemIdx-1]?.id
            }

            return items
                .slice(0, targetItemIdx)
                .reverse()
                .find((i) => i.depth === depth)?.parentId
        })()
    }

}

export function getDescendants(items: FlattenedTaskItem[], id: number): Set<FlattenedTaskItem> {
    return items.filter(({parentId}) => parentId === id)
        .reduce((acc, child) => {
            return new Set([
                ...acc,
                child,
                ...getDescendants(items, child.id)
            ])
        }, new Set<FlattenedTaskItem>())
}
