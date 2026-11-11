// Animated Checkbox component with animated SVG checkmark, property controls for label font, color, border, and more
import {
    useState,
    startTransition,
    useMemo,
    useId,
    useEffect,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface CheckboxProps {
    label: string
    checked: boolean
    onChange?: (checked: boolean) => void
    labelFont: any
    labelColor: string
    boxColor: string
    checkedBoxColor: string
    iconColor: string
    borderColor: string
    focusBorderColor: string
    borderRadius: number
    borderWidth: number
    gap: number
    required: boolean
    errorColor: string
    name?: string
    value?: string
    style?: CSSProperties
}

/**
 * Animated Checkbox
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function AnimatedCheckbox(props: CheckboxProps) {
    const {
        label,
        checked: checkedProp,
        onChange,
        labelFont,
        labelColor,
        boxColor,
        checkedBoxColor,
        iconColor,
        borderColor,
        focusBorderColor,
        borderRadius,
        borderWidth,
        gap,
        required,
        errorColor,
        name,
        value,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const [checked, setChecked] = useState(checkedProp)
    const [validationError, setValidationError] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const id = useId()

    // SVG checkmark path
    const checkPath = "M 0 2.75 L 2.75 5.5 L 8.25 0"
    const pathLength = 11.667261123657227

    // Sync with prop changes
    useEffect(() => {
        startTransition(() => setChecked(checkedProp))
    }, [checkedProp])

    function handleToggle() {
        const newChecked = !checked
        startTransition(() => setChecked(newChecked))
        if (onChange) onChange(newChecked)
        // Clear validation error when checked
        if (newChecked && validationError) {
            startTransition(() => setValidationError(false))
        }
    }

    function handleInvalid(e: React.FormEvent<HTMLInputElement>) {
        e.preventDefault()
        startTransition(() => setValidationError(true))
    }

    function handleFocus() {
        startTransition(() => setIsFocused(true))
    }

    function handleBlur() {
        startTransition(() => setIsFocused(false))
    }

    // Determine border color based on required state
    const activeBorderColor = useMemo(() => {
        if (isFocused) return focusBorderColor
        if (validationError) return errorColor
        return borderColor
    }, [isFocused, focusBorderColor, validationError, errorColor, borderColor])

    const boxHeight = useMemo(() => {
        const fontSize = parseFloat(labelFont.fontSize)
        const lineHeight = parseFloat(labelFont.lineHeight)
        return fontSize * lineHeight
    }, [labelFont.fontSize, labelFont.lineHeight])

    const boxStyles: CSSProperties = {
        height: boxHeight,
        aspectRatio: "1 / 1",
        border: `${borderWidth}px solid ${activeBorderColor}`,
        borderRadius,
        background: checked ? checkedBoxColor : boxColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 0.15s, background 0.15s",
        boxSizing: "border-box",
        flexShrink: 0,
        cursor: "pointer",
        position: "relative",
    }

    const labelStyles: CSSProperties = {
        color: labelColor,
        ...labelFont,
        userSelect: "none",
        minWidth: 0,
        width: "max-content",
        whiteSpace: "pre-line",
        overflow: "hidden",
        textOverflow: "ellipsis",
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                ...style,
            }}
        >
            <label
                htmlFor={id}
                style={{
                    display: "flex",
                    gap,
                    width: "100%",
                    position: "relative",
                    cursor: "pointer",
                }}
            >
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle()}
                    onInvalid={handleInvalid}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required={required}
                    name={name}
                    value={value}
                    style={{
                        position: "absolute",
                        opacity: 0,
                    }}
                />
                <span style={boxStyles} aria-hidden="true">
                    {(!isStatic || checked) && (
                        <motion.svg
                            width="50%"
                            height="100%"
                            viewBox="0 0 8.25 5.5"
                            fill="none"
                            stroke={iconColor}
                            strokeLinecap="square"
                            strokeLinejoin="square"
                            strokeWidth={1}
                            style={{ display: "block", overflow: "visible" }}
                        >
                            <motion.path
                                d={checkPath}
                                strokeDasharray={pathLength}
                                animate={{
                                    strokeDashoffset: checked ? 0 : pathLength,
                                    opacity: checked ? 1 : 0,
                                }}
                                transition={{
                                    duration: 0.3,
                                    delay: 0.1,
                                    ease: [0.12, 0.23, 0.5, 1],
                                    opacity: {
                                        duration: checked ? 0.15 : 0,
                                        delay: 0.1,
                                    },
                                }}
                            />
                        </motion.svg>
                    )}
                </span>
                {label && <span style={labelStyles}>{label}</span>}
            </label>
        </div>
    )
}

addPropertyControls(AnimatedCheckbox, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Checkbox label",
    },
    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "",
        placeholder: "checkbox-name",
    },
    value: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "",
        placeholder: "checkbox-value",
    },
    checked: {
        type: ControlType.Boolean,
        title: "Checked",
        defaultValue: false,
    },
    required: {
        type: ControlType.Boolean,
        title: "Required",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#fff",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 4,
        min: 0,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 4,
    },
    boxColor: {
        type: ControlType.Color,
        title: "Box Color",
        defaultValue: "rgba(187, 187, 187, 0.15)",
    },
    checkedBoxColor: {
        type: ControlType.Color,
        title: "Checked Box Color",
        defaultValue: "#fff",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#000",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(204, 204, 204, 0)",
    },
    focusBorderColor: {
        type: ControlType.Color,
        title: "Focus Border Color",
        defaultValue: "#fff",
    },
    errorColor: {
        type: ControlType.Color,
        title: "Error Border Color",
        defaultValue: "#FF5588",
    },
})

AnimatedCheckbox.displayName = "013 Checkbox"
