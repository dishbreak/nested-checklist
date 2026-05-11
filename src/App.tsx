import React, { useState } from "react";
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

interface NestedCheckListHelperProps {
  items: TaskItem[]
  handleChecked: (e: React.ChangeEvent<HTMLInputElement>, i: TaskItem) => void
}


function NestedCheckListHelper({ items, handleChecked }: NestedCheckListHelperProps): React.JSX.Element {

  return <>
    <ul>
      {
        items.map(i => <li key={`task-${i.id}`}>
          <input id={`checkbox=${i.id}`} type="checkbox" checked={i.checked} onChange={e => handleChecked(e, i)} />
          <label htmlFor={`checkbox=${i.id}`}>{i.name}</label>
          {i.children && <NestedCheckListHelper items={i.children} handleChecked={handleChecked} />}
        </li>)
      }
    </ul>
  </>
}

interface NestedCheckListProps {
  items: TaskItem[]
  setItems: (i: TaskItem[]) => void
}

function NestedCheckList({ items, setItems }: NestedCheckListProps): React.JSX.Element {
  const handleChecked = (evt: React.ChangeEvent<HTMLInputElement>, i: TaskItem) => {
    const value = evt.target.checked
    i.checked = value
    i.updateDescendants(value)
    i.updateAncestors()
    setItems(items.map(n => n.clone()))
  }
  return <NestedCheckListHelper items={items} handleChecked={handleChecked} />
}

export default function App(): React.JSX.Element {

  const [items, setItems] = useState(input.map(i => TaskItem.fromInput(i)))

  return <>
    <NestedCheckList items={items} setItems={setItems} />
  </>
}
