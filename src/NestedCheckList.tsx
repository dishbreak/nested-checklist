import { createContext, useContext } from "react";
import type { TaskItem } from "./lib/taskItem";

type CheckHandlerDelegate = (e: React.ChangeEvent<HTMLInputElement>, item: TaskItem) => void

const CheckHandlerContext = createContext<CheckHandlerDelegate>(() => { })

function NestedCheckListItem({ item }: { item: TaskItem }): React.JSX.Element {
    const handleChecked = useContext(CheckHandlerContext)

    return <div className="ml-4 px-4 py-1.5 border-indigo-300 border rounded-sm bg-white">
        <input
            id={`checkbox-${item.id}`}
            type="checkbox"
            checked={item.checked}
            className="mr-1.5"
            onChange={(e => { handleChecked(e, item) })} />
        <label htmlFor={`checkbox-${item.id}`}>{item.name}</label>
    </div>
}

function NestedCheckListHelper({ items }: { items: TaskItem[] }): React.JSX.Element {
    return <ul>
        {items.map(i => <li key={`task-${i.id}`} className="ml-4">
            <NestedCheckListItem item={i} />
            <div>
                {i.children && <NestedCheckListHelper items={i.children} />}
            </div>
        </li>)}
    </ul>
}

interface NestedCheckListProps {
    items: TaskItem[]
    setItems: (i: TaskItem[]) => void
}

export function NestedCheckList({ items, setItems }: NestedCheckListProps): React.JSX.Element {
    const handleChecked: CheckHandlerDelegate = (e, i) => {
        i.update(e.target.checked)
        setItems(items.map(n => n.clone()))
    }

    return <CheckHandlerContext value={handleChecked}>
        <NestedCheckListHelper items={items} />
    </CheckHandlerContext>
}
