import { type Meta } from "@storybook/react";

import { Tree } from "./Tree";
import { TaskItem, type TaskItemInput } from "./lib/taskItem";
import { useState} from "react";

const meta = {
    component: Tree
} satisfies Meta<typeof Tree>

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
    return <Tree items={items} onChange={setItems} />
}
