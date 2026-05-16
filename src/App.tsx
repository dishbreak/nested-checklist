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
        items.map(i => <li key={`task-${i.id}`} className="ml-4">
          <div className="ml-4 px-4 py-1.5 border-indigo-300 border rounded-sm">
            <input id={`checkbox=${i.id}`} type="checkbox" checked={i.checked} onChange={e => handleChecked(e, i)} className="mr-1.5" />
            <label htmlFor={`checkbox=${i.id}`}>{i.name}</label>
          </div>
          <div>
            {i.children && <NestedCheckListHelper items={i.children} handleChecked={handleChecked} />}
          </div>
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
    i.update(evt.target.checked)
    setItems(items.map(n => n.clone()))
  }
  return <NestedCheckListHelper items={items} handleChecked={handleChecked} />
}

export default function App(): React.JSX.Element {

  const [items, setItems] = useState(input.map(i => TaskItem.fromInput(i)))

  return <div className="flex *:w-full lg:mx-10 md:mx-5 sm:mx-1 my-3">
    <NestedCheckList items={items} setItems={setItems} />
  </div>
}
