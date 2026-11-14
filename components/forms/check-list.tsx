import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerIntrinsicWidth 290
 * @framerIntrinsicHeight 300
 */
export default function AnimatedChecklistList(props) {
    const [checkedItems, setCheckedItems] = React.useState(
        new Array(props.items.length).fill(false)
    )

    const uniqueId = React.useId()

    const handleToggle = (index) => {
        const newCheckedItems = [...checkedItems]
        newCheckedItems[index] = !newCheckedItems[index]
        setCheckedItems(newCheckedItems)
    }

    React.useEffect(() => {
        setCheckedItems(new Array(props.items.length).fill(false))
    }, [props.items])

    return (
        <div
            style={{
                ...containerStyle,
                "--background": props.bgColor,
                "--text": props.textColor,
                "--check": props.checkColor,
                "--disabled": props.disabledColor,
                boxShadow: "0px 10px 30px rgba(0,0,0, 0.05)",
            }}
            className="checklist-container"
        >
            <style>{cssStyles}</style>

            {props.items.map((itemText, index) => {
                const inputId = `checkbox-${uniqueId}-${index}`
                return (
                    <div key={index} className="checklist-item">
                        <input
                            id={inputId}
                            type="checkbox"
                            checked={checkedItems[index]}
                            onChange={() => handleToggle(index)}
                        />
                        <label htmlFor={inputId}>{itemText}</label>
                    </div>
                )
            })}
        </div>
    )
}

const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    height: "100%",
    background: "var(--background)",
    borderRadius: "20px",
    padding: "30px",
    overflow: "hidden",
}

const cssStyles = `
.checklist-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 0;
  width: 100%;
}

.checklist-item:last-child {
  margin-bottom: 0;
}

.checklist-item label {
  color: var(--text);
  position: relative;
  cursor: pointer;
  display: grid;
  align-items: center;
  width: fit-content;
  transition: color 0.3s ease;
  font-family: sans-serif;
  font-weight: 500;
  font-size: 18px;
  user-select: none;
}

.checklist-item label::before {
  content: "";
  position: absolute;
}

/* The purple line that transforms into the strikethrough */
.checklist-item label::before {
  height: 2px;
  width: 10px;
  left: -30px;
  background: var(--check);
  border-radius: 2px;
  transition: background 0.3s ease;
}

/* REMOVED: .checklist-item label::after (The dot/firework origin) */

/* Invisible checkbox */
.checklist-item input[type="checkbox"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  position: relative;
  height: 20px;
  width: 20px;
  outline: none;
  border: 0;
  margin: 0 15px 0 0;
  cursor: pointer;
  background: transparent;
  display: grid;
  align-items: center;
}

.checklist-item input[type="checkbox"]::before, .checklist-item input[type="checkbox"]::after {
  content: "";
  position: absolute;
  height: 2px;
  top: auto;
  background: var(--check);
  border-radius: 2px;
}

.checklist-item input[type="checkbox"]::before {
  width: 0px;
  right: 60%;
  transform-origin: right bottom;
}

.checklist-item input[type="checkbox"]::after {
  width: 0px;
  left: 40%;
  transform-origin: left bottom;
}

.checklist-item input[type="checkbox"]:checked::before {
  animation: check-01 0.4s ease forwards;
}

.checklist-item input[type="checkbox"]:checked::after {
  animation: check-02 0.4s ease forwards;
}

.checklist-item input[type="checkbox"]:checked + label {
  color: var(--disabled);
  animation: move 0.3s ease 0.1s forwards;
}

.checklist-item input[type="checkbox"]:checked + label::before {
  background: var(--disabled);
  animation: slice 0.4s ease forwards;
}

/* REMOVED: Animation trigger for firework */

@keyframes move {
  50% { padding-left: 8px; padding-right: 0px; }
  100% { padding-right: 4px; }
}

@keyframes slice {
  60% { width: 100%; left: 4px; }
  100% { width: 100%; left: -2px; padding-left: 0; }
}

@keyframes check-01 {
  0% { width: 4px; top: auto; transform: rotate(0); }
  50% { width: 0px; top: auto; transform: rotate(0); }
  51% { width: 0px; top: 8px; transform: rotate(45deg); }
  100% { width: 5px; top: 8px; transform: rotate(45deg); }
}

@keyframes check-02 {
  0% { width: 4px; top: auto; transform: rotate(0); }
  50% { width: 0px; top: auto; transform: rotate(0); }
  51% { width: 0px; top: 8px; transform: rotate(-45deg); }
  100% { width: 10px; top: 8px; transform: rotate(-45deg); }
}

/* REMOVED: @keyframes firework */
`

addPropertyControls(AnimatedChecklistList, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.String,
            defaultValue: "New Item",
        },
        defaultValue: ["Bread", "Cheese", "Coffee"],
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#414856",
    },
    checkColor: {
        type: ControlType.Color,
        title: "Check Color",
        defaultValue: "#4f29f0",
    },
    disabledColor: {
        type: ControlType.Color,
        title: "Done Color",
        defaultValue: "#c3c8de",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Bg Color",
        defaultValue: "#ffffff",
    },
})
