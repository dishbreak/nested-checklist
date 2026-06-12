import React from "react";
import { Handle } from "./TreeItem";


export function TreeItemOverlay({ name, count }: { name: string, count: number }): React.JSX.Element {
    return <div data-overlay
        className={[
            "relative flex items-center gap-2.5 px-2.5 py-2.5",
            "bg-white border border-[#dedede] text-[#222]",
            "data-overlay:w-max data-overlay:pr-6",
            "data-overlay:rounded-md",
            "data-overlay:shadow-[0px_15px_15px_0_rgba(34,33,81,0.1)]"
        ].join(" ")}>
        <Handle />
        {name}
        {count > 0 && <span
            className={[
                "absolute -top-2.5 -right-2.5",
                "flex items-center justify-center",
                "w-6 h-6 rounded-full",
                "bg-[#2389ff] text-white text-xs font-medium",
            ].join(" ")}
        >{count}</span>}
    </div>
}
