import React, { useState } from "react";
import { TaskItem, type TaskItemInput } from "./lib/taskItem";
import { NestedCheckList } from "./NestedCheckList";

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

export default function App(): React.JSX.Element {

  const [items, setItems] = useState(input.map(i => TaskItem.fromInput(i)))

  return <div className="flex *:w-full lg:mx-10 md:mx-5 sm:mx-1 my-3">
    <NestedCheckList items={items} setItems={setItems} />
  </div>
}
