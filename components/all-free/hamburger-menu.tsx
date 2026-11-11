import { useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface HamburgerMenuProps {
    strokeColor: string
    strokeWidth: number
    size: number
    defaultChecked: boolean
    onToggle: (checked: boolean) => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function HamburgerMenu(props: HamburgerMenuProps) {
    const {
        strokeColor = "#FFFFFF",
        strokeWidth = 3,
        size = 48,
        defaultChecked = false,
        onToggle,
    } = props

    const [isChecked, setIsChecked] = useState(defaultChecked)

    const handleChange = () => {
        const newChecked = !isChecked
        startTransition(() => {
            setIsChecked(newChecked)
        })
        if (onToggle) {
            onToggle(newChecked)
        }
    }

    return (
        <label
            style={{
                cursor: "pointer",
                display: "inline-block",
                width: size,
                height: size,
            }}
        >
            <input
                type="checkbox"
                checked={isChecked}
                onChange={handleChange}
                style={{ display: "none" }}
                aria-label="Toggle menu"
            />
            <svg
                viewBox="0 0 32 32"
                style={{
                    width: "100%",
                    height: "100%",
                    transform: isChecked ? "rotate(-45deg)" : "rotate(0deg)",
                    transition: "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                <path
                    className="line line-top-bottom"
                    d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
                    fill="none"
                    stroke={strokeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={strokeWidth}
                    strokeDasharray={isChecked ? "20 300" : "12 63"}
                    strokeDashoffset={isChecked ? -32.42 : 0}
                    style={{
                        transition:
                            "stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
                <path
                    className="line"
                    d="M7 16 27 16"
                    fill="none"
                    stroke={strokeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={strokeWidth}
                    style={{
                        transition:
                            "stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            </svg>
        </label>
    )
}

addPropertyControls(HamburgerMenu, {
    strokeColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 0.5,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 48,
        min: 24,
        max: 500,
        step: 4,
        unit: "px",
    },
    defaultChecked: {
        type: ControlType.Boolean,
        title: "Default State",
        defaultValue: false,
        enabledTitle: "Open",
        disabledTitle: "Closed",
        description: "Made with ❤️ by [Pixelcot](https://www.pixelcot.com)",
    },
    onToggle: {
        type: ControlType.EventHandler,
    },
})
