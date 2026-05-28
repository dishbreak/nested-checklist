import React from "react";


export function TreeItemOverlay({name, count}: {name: string, count: number}): React.JSX.Element {
    return <div data-overlay>
        <span />
        {name}
        {count > 0 ? <span>{count}</span> : null}
    </div>
}
