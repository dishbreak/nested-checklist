import { expect, test as baseTest, beforeEach, describe } from 'vitest'
import { flatten, TaskItem, type TaskItemInput, type FlattenedTaskItem, __reset, insertChild, insertSibling } from './taskItem'

const test = baseTest.extend('input', (): TaskItemInput[] => [
    {
        name: "foo"
    },
    {
        name: "bar",
        children: [
            {
                name: "bang"
            },
            {
                name: "bim"
            }
        ]
    },
    {
        name: "baz",
        children: [
            {
                name: "boom",
                children: [
                    {
                        name: "bah"
                    }
                ]
            }
        ]
    }
]).extend('exampleTree', ({ input }) => input.map(i => TaskItem.fromInput(i)))
    .extend('flattenedItems', ({ exampleTree }) => flatten(exampleTree))


beforeEach(() => __reset())

test('converts an input', ({ input }) => {

    const items = input.map(i => TaskItem.fromInput(i))

    expect(items[0].id).toBe(0)
    expect(items[1].children[1].id).toBe(3)
    expect(items[2].name).toBe("baz")
})

test('will use new ids on reset', () => {
    const inputs: TaskItemInput[] = ["foo", "bar", "baz"].map(name => { return { name } })
    const items = inputs.map(i => TaskItem.fromInput(i))

    expect(items[0].id).toBe(0)

    const itemsPriorToReset = inputs.map(i => TaskItem.fromInput(i))
    expect(itemsPriorToReset[0].id).toBe(3)

    __reset()

    const itemsAfterReset = inputs.map(i => TaskItem.fromInput(i))
    expect(itemsAfterReset[0].id).toBe(0)
})

test('flatten will correctly represent the input', ({ input }) => {
    const items = input.map(i => TaskItem.fromInput(i))

    const result = flatten(items)
    expect(result).toStrictEqual([
        { editing: false, focused: false, id: 0, name: "foo", depth: 0, checked: false, index: 0, parentId: undefined },
        { editing: false, focused: false, id: 1, name: "bar", depth: 0, checked: false, index: 1, parentId: undefined },
        { editing: false, focused: false, id: 2, name: "bang", depth: 1, checked: false, index: 0, parentId: 1 },
        { editing: false, focused: false, id: 3, parentId: 1, name: "bim", checked: false, depth: 1, index: 1 },
        { editing: false, focused: false, id: 4, name: "baz", checked: false, index: 2, depth: 0, parentId: undefined },
        { editing: false, focused: false, id: 5, name: "boom", checked: false, index: 0, depth: 1, parentId: 4 },
        { editing: false, focused: false, id: 6, name: "bah", checked: false, index: 0, depth: 2, parentId: 5 },
    ])
})

describe('the addChild function', () => {
    test('will insert a new child', ({ flattenedItems }) => {
        const anchor = flattenedItems[2]

        insertChild(flattenedItems, anchor, { name: "bop", checked: false, editing: true, focused: true })

        expect(flattenedItems).toStrictEqual([
            { editing: false, focused: false, id: 0, name: "foo", depth: 0, checked: false, index: 0, parentId: undefined },
            { editing: false, focused: false, id: 1, name: "bar", depth: 0, checked: false, index: 1, parentId: undefined },
            { editing: false, focused: false, id: 2, name: "bang", depth: 1, checked: false, index: 0, parentId: 1 },
            { editing: false, focused: false, id: 3, parentId: 1, name: "bim", checked: false, depth: 1, index: 1 },
            { editing: false, focused: false, id: 4, name: "baz", checked: false, index: 2, depth: 0, parentId: undefined },
            { editing: false, focused: false, id: 5, name: "boom", checked: false, index: 0, depth: 1, parentId: 4 },
            { editing: false, focused: false, id: 6, name: "bah", checked: false, index: 0, depth: 2, parentId: 5 },
            { editing: true, focused: true, id: 7, name: "bop", checked: false, index: 0, depth: 2, parentId: 2 },
        ])
    })

    test('will use the next index for children of the parent', ({ flattenedItems }) => {
        const anchor = flattenedItems[2]

        const names = ["boink", "bong", "pop"]
        names.forEach(n => insertChild(flattenedItems, anchor, { name: n, checked: false, editing: false, focused: false }))

        expect(flattenedItems).toStrictEqual([
            { editing: false, focused: false, id: 0, name: "foo", depth: 0, checked: false, index: 0, parentId: undefined },
            { editing: false, focused: false, id: 1, name: "bar", depth: 0, checked: false, index: 1, parentId: undefined },
            { editing: false, focused: false, id: 2, name: "bang", depth: 1, checked: false, index: 0, parentId: 1 },
            { editing: false, focused: false, id: 3, parentId: 1, name: "bim", checked: false, depth: 1, index: 1 },
            { editing: false, focused: false, id: 4, name: "baz", checked: false, index: 2, depth: 0, parentId: undefined },
            { editing: false, focused: false, id: 5, name: "boom", checked: false, index: 0, depth: 1, parentId: 4 },
            { editing: false, focused: false, id: 6, name: "bah", checked: false, index: 0, depth: 2, parentId: 5 },
            { editing: false, focused: false, id: 7, name: "boink", checked: false, index: 0, depth: 2, parentId: 2 },
            { editing: false, focused: false, id: 8, name: "bong", checked: false, index: 1, depth: 2, parentId: 2 },
            { editing: false, focused: false, id: 9, name: "pop", checked: false, index: 2, depth: 2, parentId: 2 },
        ])
    })
})

describe('the insertSibling function', () => {
    test('will add a top-level sibling', ({flattenedItems}) => {
        const anchor = flattenedItems[1]
        insertSibling(flattenedItems, anchor, {name: "plonk", editing: false, focused: false, checked: false})
        expect(flattenedItems).toStrictEqual([
            { editing: false, focused: false, id: 0, name: "foo", depth: 0, checked: false, index: 0, parentId: undefined },
            { editing: false, focused: false, id: 1, name: "bar", depth: 0, checked: false, index: 1, parentId: undefined },
            { editing: false, focused: false, id: 2, name: "bang", depth: 1, checked: false, index: 0, parentId: 1 },
            { editing: false, focused: false, id: 3, parentId: 1, name: "bim", checked: false, depth: 1, index: 1 },
            { editing: false, focused: false, id: 4, name: "baz", checked: false, index: 2, depth: 0, parentId: undefined },
            { editing: false, focused: false, id: 5, name: "boom", checked: false, index: 0, depth: 1, parentId: 4 },
            { editing: false, focused: false, id: 6, name: "bah", checked: false, index: 0, depth: 2, parentId: 5 },
            { editing: false, focused: false, id: 7, name: "plonk", checked: false, index: 3, depth: 0, parentId: undefined },
        ])
    })
})
