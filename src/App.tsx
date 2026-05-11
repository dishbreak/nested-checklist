import React from "react";
import { TaskItem, type TaskItemInput } from "./lib/taskItem";

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

interface NestedCheckListProps {
  items: TaskItem[]
}

function NestedCheckList({ items }: NestedCheckListProps): React.JSX.Element {
  return <>
    <ul>
      {
        items.map(i => <li>
          {i.name}
          {i.children && <NestedCheckList items={i.children} />}
        </li>)
      }
    </ul>
  </>
}

export default function App(): React.JSX.Element {

  const items = input.map(i => TaskItem.fromInput(i))

  return <>
    <NestedCheckList items={items} />
  </>
}
