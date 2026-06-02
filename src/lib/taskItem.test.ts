import { expect, test as baseTest } from 'vitest'
import { flatten, TaskItem, type TaskItemInput } from './taskItem'

const test = baseTest.extend('input', (): TaskItemInput[] => [
    {
        id: 0,
        name: "foo"
    },
    {
        id: 1,
        name: "bar",
        children: [
            {
                id: 2,
                name: "bang"
            },
            {
                id: 3,
                name: "bim"
            }
        ]
    },
    {
        id: 4,
        name: "baz",
        children: [
            {
                id: 5,
                name: "boom",
                children: [
                    {
                        id: 6,
                        name: "bah"
                    }
                ]
            }
        ]
    }
])

test('converts an input', ({ input }) => {

    const items = input.map(i => TaskItem.fromInput(i))

    expect(items[0].id).toBe(0)
    expect(items[1].children[1].id).toBe(3)
    expect(items[2].name).toBe("baz")
})

test('flatten will correctly represent the input', ({ input }) => {
    const items = input.map(i => TaskItem.fromInput(i))

    const result = flatten(items)
    expect(result).toStrictEqual([
        { id: 0, name: "foo", depth: 0, checked: false, index: 0, parentId: undefined },
        { id: 1, name: "bar", depth: 0, checked: false, index: 1, parentId: undefined },
        { id: 2, name: "bang", depth: 1, checked: false, index: 0, parentId: 1 },
        { id: 3, parentId: 1, name: "bim", checked: false, depth: 1, index: 1 },
        { id: 4, name: "baz", checked: false, index: 2, depth: 0, parentId: undefined },
        { id: 5, name: "boom", checked: false, index: 0, depth: 1, parentId: 4 },
        { id: 6, name: "bah", checked: false, index: 0, depth: 2, parentId: 5 }
    ])
})
