export interface TaskItemInput {
    name: string;
    children?: TaskItemInput[]
}


const getId: () => number = (() => {
    let count = 0
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
        if (parent !== undefined) {
            t.parent = parent
        }
        t.children = i.children?.map(c => TaskItem.fromInput(c)) ?? []
        return t
    }

    clone(): TaskItem {
        const c = new TaskItem()
        c.checked = this.checked
        c.name = this.name
        c.id = this.id
        c.parent = this.parent
        c.children = this.children.map(n => n.clone())
        return c
    }

    allChildren(callback: (t: TaskItem) => boolean, includeSelf: boolean = false): boolean {
        if (includeSelf) {
            if (!callback(this)) {
                return false
            }
        }
        this.children.forEach(c => {
            if (!c.allChildren(callback, true)) {
                return false
            }
        })
        return true
    }

    updateAncestors(): void {
        if (this.parent === undefined) {
            return
        }
        const c = this.parent
        if (!c.allChildren(n => n.checked)) {
            return
        }
        c.checked = true
        c.updateAncestors()
    }

    updateDescendants(value: boolean, includeSelf: boolean = false): void {
        if (includeSelf) {
            this.checked = value
        }
        this.children.forEach(c => c.updateDescendants(value, true))
    }
}
