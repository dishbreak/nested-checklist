import type { Meta } from '@storybook/react'

import { NestedCheckList } from './NestedCheckList'
import { TaskItem } from './lib/taskItem';
import type { TaskItemInput } from './lib/taskItem';
import { useState } from 'react';

const meta = {
    component: NestedCheckList
} satisfies Meta<typeof NestedCheckList>

export default meta;

const input: TaskItemInput[] = [
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
]

export const Basic = () => {
    const [items, setItems] = useState(input.map(i => TaskItem.fromInput(i)))
    return <NestedCheckList items={items} setItems={setItems} />
}
