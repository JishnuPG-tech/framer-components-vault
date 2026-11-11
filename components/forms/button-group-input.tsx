import { useState, useEffect, useCallback, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ButtonOption {
    label: string
    value: string
}

interface ButtonInputGroupProps {
    options: ButtonOption[]
    multiSelect: boolean
    required: boolean
    layout: {
        columns: number
        height: "fit" | "fill"
        horizontalAlign: "start" | "center" | "end"
        verticalAlign: "top" | "center" | "bottom"
        gapH: number
        gapV: number
    }
    buttonFont: any
    buttonRadius: number
    buttonPadding: number
    buttonBorderColor: string
    buttonBackground: string
    selectedBackground: string
    selectedTextColor: string
    selectedBorderColor: string
    name: string
    label: string
    style?: React.CSSProperties
    onValueChange?: (value: string | string[]) => void
}

/**
 * Button Group
 * 
 * A form field component that displays a group of selectable buttons.
 * 
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ButtonGroup(props: ButtonInputGroupProps) {
    const {
        options,
        multiSelect,
        required,
        layout,
        buttonFont,
        buttonRadius,
        buttonPadding,
        buttonBorderColor,
        buttonBackground,
        selectedBackground,
        selectedTextColor,
        selectedBorderColor,
        name,
        label,
        style,
        onValueChange,
    } = props

    const [selectedValues, setSelectedValues] = useState<string[]>([])

    const handleButtonClick = useCallback((value: string) => {
        startTransition(() => {
            if (multiSelect) {
                setSelectedValues(prev => 
                    prev.includes(value) 
                        ? prev.filter(v => v !== value) 
                        : [...prev, value]
                )
            } else {
                setSelectedValues(prev => 
                    prev.includes(value) && prev.length === 1
                        ? []
                        : [value]
                )
            }
        })
    }, [multiSelect])

    useEffect(() => {
        if (onValueChange) {
            onValueChange(multiSelect ? selectedValues : selectedValues[0] || "")
        }
    }, [selectedValues, multiSelect, onValueChange])

    const containerStyle = useMemo(() => {
        const { columns, horizontalAlign, verticalAlign, gapH, gapV, height } = layout
        
        return {
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gapV}px ${gapH}px`,
            width: "100%",
            justifyItems: horizontalAlign,
            alignItems: verticalAlign,
            ...style
        }
    }, [layout, style])

    const formValue = multiSelect ? selectedValues.join(",") : selectedValues[0] || ""

    return (
        <div style={{ width: "100%" }}>
            {label && (
                <label 
                    style={{ 
                        display: "block", 
                        marginBottom: "8px",
                        color: "#8A8A8A",
                        fontSize: "13px",
                        fontWeight: 500,
                    }}
                >
                    {label}
                    {required && <span style={{ color: "#FF4A4A" }}> *</span>}
                </label>
            )}
            <div style={containerStyle}>
                {options.map((option, index) => {
                    const isSelected = selectedValues.includes(option.value)
                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleButtonClick(option.value)}
                            style={{
                                padding: `${buttonPadding}px`,
                                borderRadius: `${buttonRadius}px`,
                                border: `1px solid ${isSelected ? selectedBorderColor : buttonBorderColor}`,
                                background: isSelected ? selectedBackground : buttonBackground,
                                color: isSelected ? selectedTextColor : "#999999",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                minHeight: "36px",
                                minWidth: "36px",
                                outline: "none",
                                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
                                fontSize: "14px",
                                fontWeight: 400,
                                width: layout.height === "fill" ? "100%" : "auto",
                                ...buttonFont,
                                ":focus": {
                                    borderColor: "#0099FF"
                                }
                            }}
                            aria-pressed={isSelected}
                        >
                            {option.label}
                        </button>
                    )
                })}
            </div>
            {/* Hidden input for form submission */}
            <input 
                type="hidden" 
                name={name} 
                value={formValue} 
                required={required}
                data-framer-name={name}
                data-framer-form-input-type="button-group"
            />
        </div>
    )
}

addPropertyControls(ButtonGroup, {
    name: {
        type: ControlType.String,
        title: "Field Name",
        defaultValue: "buttonGroup",
    },
    options: {
        type: ControlType.Array,
        title: "Options",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Option",
                },
                value: {
                    type: ControlType.String,
                    title: "Value",
                    defaultValue: "",
                },
            },
        },
        defaultValue: [
            { label: "Option 1", value: "option1" },
            { label: "Option 2", value: "option2" },
            { label: "Option 3", value: "option3" },
        ],
    },
    multiSelect: {
        type: ControlType.Boolean,
        title: "Multi-select",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    required: {
        type: ControlType.Boolean,
        title: "Required",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            columns: {
                type: ControlType.Number,
                title: "Columns",
                defaultValue: 3,
                min: 1,
                max: 12,
                displayStepper: true,
            },
            height: {
                type: ControlType.Enum,
                title: "Height",
                options: ["fit", "fill"],
                optionTitles: ["Fit", "Fill"],
                defaultValue: "fit",
                displaySegmentedControl: true,
            },
            horizontalAlign: {
                type: ControlType.Enum,
                title: "Align",
                options: ["start", "center", "end"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "start",
                displaySegmentedControl: true,
            },
            verticalAlign: {
                type: ControlType.Enum,
                title: "Align",
                options: ["top", "center", "bottom"],
                optionTitles: ["Top", "Center", "Bottom"],
                defaultValue: "top",
                displaySegmentedControl: true,
            },
            gapH: {
                type: ControlType.Number,
                title: "Gap H",
                defaultValue: 10,
                min: 0,
                max: 100,
                step: 1,
            },
            gapV: {
                type: ControlType.Number,
                title: "Gap V",
                defaultValue: 10,
                min: 0,
                max: 100,
                step: 1,
            },
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            lineHeight: "1.2em",
        },
    },
    buttonRadius: {
        type: ControlType.Number,
        title: "Button Radius",
        defaultValue: 10,
        min: 0,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    buttonPadding: {
        type: ControlType.Number,
        title: "Button Padding",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
        displayStepper: true,
    },
    buttonBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(136, 136, 136, 0.1)",
    },
    buttonBackground: {
        type: ControlType.Color,
        title: "Button Background",
        defaultValue: "rgba(187, 187, 187, 0.15)",
    },
    selectedBackground: {
        type: ControlType.Color,
        title: "Selected Background",
        defaultValue: "#0055FF",
    },
    selectedTextColor: {
        type: ControlType.Color,
        title: "Selected Text Color",
        defaultValue: "#FFFFFF",
    },
    selectedBorderColor: {
        type: ControlType.Color,
        title: "Selected Border",
        defaultValue: "#0099FF",
    },
})