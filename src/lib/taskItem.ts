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
