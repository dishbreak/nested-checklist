import React, { useState } from 'react'

function Checkbox({ description }) {
    const [checked, setChecked] = useState(false)
    return <>
        <input type="checkbox" checked={checked} id="foo" onChange={(e) => setChecked(e.target.checked)} />
        <label htmlFor="foo">{description}</label>
    </>
}

export default App() {
    return <>
        <Checkbox description="your text goes here" />
    </>
}
