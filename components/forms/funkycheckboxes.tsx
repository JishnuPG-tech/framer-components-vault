// Animated Checkbox component with various animation effects

import { useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const effects = [
    { id: "none", title: "None" },
    { id: "cranky", title: "Wiggle" },
    { id: "sleepy", title: "Sleep" },
    { id: "fearful", title: "Shake" },
    { id: "drunk", title: "Stagger" },
    { id: "dreamy", title: "Float" },
    { id: "peppy", title: "Bounce" },
]

interface CheckboxItem {
    label: string
    name: string
    value: string
    defaultChecked: boolean
    animation?: {
        effect: string
        wiggleIntensity?: number
        wiggleDegree?: number
        sleepIntensity?: number
        shakeIntensity?: number
        staggerIntensity?: number
        staggerDegree?: number
        floatIntensity?: number
        bounceIntensity?: number
    }
}

interface AnimatedCheckboxesProps {
    checkboxes: CheckboxItem[]
    onChange?: (
        values: { name: string; value: string; checked: boolean }[]
    ) => void
    alignment: "left" | "center" | "right"
    labelStyle: {
        font: CSSProperties
        color: string
        textCase?: "none" | "uppercase" | "lowercase" | "capitalize"
    }
    checkboxAppearance: {
        size: number
        backgroundColor: string
        borderColor: string
        borderWidth: number
        borderRadius: number
    }
    checkedState: {
        backgroundColor: string
        borderColor: string
        borderWidth: number
        borderRadius: number
        showCheckmark: boolean
        checkmarkColor: string
        customCheckmark?: {
            src: string
            alt?: string
        }
    }
    focusStyle: {
        enabled: boolean
        outlineColor: string
        outlineWidth: number
        outlineOffset: number
    }
    style?: CSSProperties
    // New props for strikethrough
    strikethroughEnabled?: boolean
    strikethroughAnimation?: "left" | "middle" | "none"
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 *
 * @framerDisableUnlink
 *
 */
export default function AnimatedCheckboxes(props: AnimatedCheckboxesProps) {
    const {
        checkboxes = [
            {
                label: "Option 1",
                name: "option1",
                value: "value1",
                defaultChecked: false,
            },
            {
                label: "Option 2",
                name: "option2",
                value: "value2",
                defaultChecked: false,
            },
        ],
        onChange,
        alignment = "left",
        labelStyle = { font: {}, color: "#9f01fc", textCase: "none" },
        checkboxAppearance = { size: 20, color: "#d59af7" },
        checkedState = {
            backgroundColor: "#d59af7",
            borderColor: "#d59af7",
            borderWidth: 5,
            borderRadius: 3,
            showCheckmark: true,
            checkmarkColor: "#FFFFFF",
        },
        focusStyle = {
            enabled: true,
            outlineColor: "#9f01fc",
            outlineWidth: 2,
            outlineOffset: 2,
        },
        strikethroughEnabled = false,
        strikethroughAnimation = "none",
    } = props

    const [checkedStates, setCheckedStates] = useState<Record<string, boolean>>(
        () => {
            const initial: Record<string, boolean> = {}
            checkboxes.forEach((checkbox, index) => {
                initial[`${checkbox.name}-${index}`] = checkbox.defaultChecked
            })
            return initial
        }
    )

    const handleChange = (checkboxIndex: number, checkboxName: string) => {
        const key = `${checkboxName}-${checkboxIndex}`
        const newValue = !checkedStates[key]

        setCheckedStates((prev) => ({
            ...prev,
            [key]: newValue,
        }))

        if (onChange) {
            const allValues = checkboxes.map((checkbox, index) => ({
                name: checkbox.name,
                value: checkbox.value,
                checked:
                    index === checkboxIndex
                        ? newValue
                        : checkedStates[`${checkbox.name}-${index}`] || false,
            }))
            onChange(allValues)
        }
    }

    const { font, color, textCase = "none" } = labelStyle
    // Fix: Provide fallback values for missing properties in checkboxAppearance
    const {
        size,
        backgroundColor: defaultBg = "transparent",
        borderColor: defaultBorderColor = "#d59af7",
        borderWidth: defaultBorderWidth = 2,
        borderRadius: defaultBorderRadius = 3,
    } = checkboxAppearance as any
    const {
        backgroundColor: checkedBackgroundColor,
        borderColor: checkedBorderColor,
        borderWidth: checkedBorderWidth,
        borderRadius: checkedBorderRadius,
        showCheckmark = true,
        checkmarkColor = "#FFFFFF",
        customCheckmark,
    } = checkedState
    const {
        outlineColor: focusOutlineColor,
        outlineWidth: focusOutlineWidth,
        enabled: focusEnabled,
        outlineOffset: focusOutlineOffset = 2,
    } = focusStyle

    return (
        <div
            style={{
                display: "flex",
                alignItems:
                    alignment === "left"
                        ? "flex-start"
                        : alignment === "right"
                          ? "flex-end"
                          : "center",
                flexDirection: "column",
                gap: 12,
                width: "100%",
            }}
        >
            {checkboxes.map((checkbox, index) => {
                const key = `${checkbox.name}-${index}`
                const isSelected = checkedStates[key] || false

                // Get animation settings for this specific checkbox
                const animation = checkbox.animation || { effect: "none" }
                const {
                    effect = "none",
                    wiggleIntensity = 1,
                    wiggleDegree = 15,
                    sleepIntensity = 1,
                    shakeIntensity = 5,
                    staggerIntensity = 1,
                    staggerDegree = 45,
                    floatIntensity = 15,
                    bounceIntensity = 20,
                } = animation

                // Calculate actual values based on intensity multiplier
                const actualWiggleDegree = wiggleDegree * wiggleIntensity
                const actualStaggerDegree = staggerDegree * staggerIntensity

                return (
                    <label
                        key={key}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            position: "relative",
                            transition: "all 0.3s ease",
                            width: "max-content",
                        }}
                        htmlFor={`checkbox-${key}`}
                        // Add role and aria-checked for accessibility
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                                e.preventDefault()
                                handleChange(index, checkbox.name)
                            }
                        }}
                    >
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 10,
                                width: `${size}px`,
                                height: `${size}px`,
                                position: "relative",
                                flexShrink: 0,
                            }}
                        >
                            <input
                                type="checkbox"
                                id={`checkbox-${key}`}
                                name={checkbox.name}
                                value={checkbox.value}
                                checked={isSelected}
                                onChange={() => handleChange(index, checkbox.name)}
                                onDoubleClick={() => {
                                    const key = `${checkbox.name}-${index}`
                                    setCheckedStates((prev) => ({
                                        ...prev,
                                        [key]: false,
                                    }))
                                    if (onChange) {
                                        const allValues = checkboxes.map(
                                            (cb, idx) => ({
                                                name: cb.name,
                                                value: cb.value,
                                                checked:
                                                    idx === index
                                                        ? false
                                                        : checkedStates[
                                                              `${cb.name}-${idx}`
                                                          ] || false,
                                            })
                                        )
                                        onChange(allValues)
                                    }
                                }}
                                className={`checkbox-${index}`}
                                style={{
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    MozAppearance: "none",
                                    margin: 0,
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    cursor: "pointer",
                                    boxSizing: "border-box",
                                    borderRadius: isSelected
                                        ? `${checkedBorderRadius}px`
                                        : `${defaultBorderRadius}px`,
                                    transition: "0.2s all linear",
                                    border: isSelected
                                        ? `${checkedBorderWidth}px solid ${checkedBorderColor}`
                                        : `${defaultBorderWidth}px solid ${defaultBorderColor}`,
                                    background: isSelected
                                        ? checkedBackgroundColor
                                        : defaultBg,
                                    width: "100%",
                                    height: "100%",
                                }}
                                aria-checked={isSelected}
                                aria-label={checkbox.label}
                            />
                            {isSelected && showCheckmark && (
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        pointerEvents: "none",
                                        animation:
                                            "checkmark-appear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                        position: "relative",
                                    }}
                                    aria-hidden="true"
                                >
                                    {customCheckmark?.src ? (
                                        <img
                                            src={customCheckmark.src}
                                            alt={customCheckmark.alt || "checkmark"}
                                            style={{
                                                width: `${size * 0.6}px`,
                                                height: `${size * 0.6}px`,
                                                objectFit: "contain",
                                            }}
                                        />
                                    ) : (
                                        <svg
                                            width={size * 0.6}
                                            height={size * 0.6}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M20 6L9 17L4 12"
                                                stroke={checkmarkColor}
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </span>
                            )}
                        </span>
                        <span
                            style={{
                                ...font,
                                color,
                                textTransform:
                                    textCase === "none" ? undefined : textCase,
                                // Add strikethrough animation if enabled and checked
                                ...(isSelected
                                    ? {
                                          position: "relative",
                                          display: "inline-block",
                                          transition: "color 0.3s",
                                      }
                                    : {}),
                            }}
                        >
                            {checkbox.label}
                            {/* Strikethrough animation */}
                            {strikethroughEnabled &&
                                isSelected &&
                                strikethroughAnimation !== "none" &&
                                (strikethroughAnimation === "middle" ? (
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: "50%",
                                            width: "100%",
                                            height: 2,
                                            background: color,
                                            transform: "scaleX(0)",
                                            animation:
                                                "strike-through 0.4s forwards",
                                            pointerEvents: "none",
                                        }}
                                        aria-hidden="true"
                                    />
                                ) : strikethroughAnimation === "left" ? (
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: "50%",
                                            width: "100%",
                                            height: 2,
                                            background: color,
                                            transform: "scaleX(0)",
                                            animation:
                                                "strike-through-left 0.4s forwards",
                                            pointerEvents: "none",
                                        }}
                                        aria-hidden="true"
                                    />
                                ) : null)}
                        </span>
                        {/* Confetti animation */}
                        {isSelected && (
                            <span
                                style={{
                                    position: "absolute",
                                    left: "100%",
                                    top: 0,
                                    width: 0,
                                    height: 0,
                                    pointerEvents: "none",
                                    zIndex: 10,
                                }}
                                aria-hidden="true"
                            >
                                <span className="confetti" />
                            </span>
                        )}
                    </label>
                )
            })}

            <style>
                {`
                    @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&display=swap");

                    ${
                        focusEnabled
                            ? `
                        input[type="checkbox"]:focus {
                            outline: ${focusOutlineWidth}px solid ${focusOutlineColor};
                            outline-offset: ${focusOutlineOffset}px;
                            box-shadow: 0 0 0 ${focusOutlineOffset + focusOutlineWidth}px ${focusOutlineColor}33;
                        }
                        label:focus {
                            outline: ${focusOutlineWidth}px solid ${focusOutlineColor};
                            outline-offset: ${focusOutlineOffset}px;
                            box-shadow: 0 0 0 ${focusOutlineOffset + focusOutlineWidth}px ${focusOutlineColor}33;
                            border-radius: 4px;
                        }
                    `
                            : `
                        input[type="checkbox"]:focus {
                            outline: none;
                        }
                        label:focus {
                            outline: none;
                        }
                    `
                    }

                    /* Strikethrough animation */
                    @keyframes strike-through {
                        to {
                            transform: scaleX(1);
                        }
                    }
                    @keyframes strike-through-left {
                        from {
                            transform: scaleX(0);
                            transform-origin: left;
                        }
                        to {
                            transform: scaleX(1);
                            transform-origin: left;
                        }
                    }
                    /* Confetti animation (simple dots) */
                    .confetti {
                        display: inline-block;
                        width: 0;
                        height: 0;
                        animation: confetti-pop 0.7s linear forwards;
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                    @keyframes confetti-pop {
                        0% { opacity: 1; }
                        100% { opacity: 0; }
                    }

                    ${checkboxes
                        .map((checkbox, index) => {
                            const animation = checkbox.animation || {
                                effect: "none",
                            }
                            const {
                                effect = "none",
                                wiggleIntensity = 1,
                                wiggleDegree = 15,
                                sleepIntensity = 1,
                                shakeIntensity = 5,
                                staggerIntensity = 1,
                                staggerDegree = 45,
                                floatIntensity = 15,
                                bounceIntensity = 20,
                            } = animation

                            const actualWiggleDegree =
                                wiggleDegree * wiggleIntensity
                            const actualStaggerDegree =
                                staggerDegree * staggerIntensity

                            if (effect === "none") return ""

                            return `
                            .checkbox-${index}:checked {
                                animation: ${getAnimationName(effect, index)} ${getAnimationDuration(effect)} ${getAnimationTiming(effect)};
                            }

                            ${generateKeyframes(effect, index, actualWiggleDegree, sleepIntensity, shakeIntensity, actualStaggerDegree, floatIntensity, bounceIntensity, size)}
                        `
                        })
                        .join("\n")}
                `}
            </style>
        </div>
    )
}

function getAnimationName(effect: string, index: number): string {
    switch (effect) {
        case "cranky":
            return `wiggle-${index}`
        case "sleepy":
            return `sleep-${index}`
        case "fearful":
            return `shake-${index}`
        case "drunk":
            return `stagger-${index}`
        case "dreamy":
            return `float-${index}`
        case "peppy":
            return `bounce-${index}`
        default:
            return "none"
    }
}

function getAnimationDuration(effect: string): string {
    switch (effect) {
        case "cranky":
            return "1s"
        case "sleepy":
            return "2s"
        case "fearful":
            return "0.1s"
        case "drunk":
            return "2s"
        case "dreamy":
            return "10s"
        case "peppy":
            return "0.5s"
        default:
            return "0s"
    }
}

function getAnimationTiming(effect: string): string {
    switch (effect) {
        case "cranky":
            return "infinite"
        case "sleepy":
            return "alternate infinite"
        case "fearful":
            return "infinite"
        case "drunk":
            return "forwards ease-in-out"
        case "dreamy":
            return "ease-in-out infinite alternate-reverse"
        case "peppy":
            return "infinite"
        default:
            return ""
    }
}

function generateKeyframes(
    effect: string,
    index: number,
    wiggleDegree: number,
    sleepIntensity: number,
    shakeIntensity: number,
    staggerDegree: number,
    floatIntensity: number,
    bounceIntensity: number,
    size: number
): string {
    switch (effect) {
        case "cranky":
            return `
                @keyframes wiggle-${index} {
                    0%, 7% { transform: rotateZ(0); }
                    15% { transform: rotateZ(-${wiggleDegree}deg); }
                    20% { transform: rotateZ(${wiggleDegree * 0.67}deg); }
                    25% { transform: rotateZ(-${wiggleDegree * 0.67}deg); }
                    30% { transform: rotateZ(${wiggleDegree * 0.4}deg); }
                    35% { transform: rotateZ(-${wiggleDegree * 0.27}deg); }
                    40%, 100% { transform: rotateZ(0); }
                }
            `
        case "sleepy":
            return `
                @keyframes sleep-${index} {
                    from { opacity: ${0.4 + sleepIntensity * 0.3}; border-width: ${size / 2.5}px; }
                    to { opacity: 1; border-width: ${size / 5}px; }
                }
            `
        case "fearful":
            return `
                @keyframes shake-${index} {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(${shakeIntensity}px); }
                    100% { transform: translateX(-${shakeIntensity}px); }
                }
            `
        case "drunk":
            return `
                @keyframes stagger-${index} {
                    0% { transform: rotate(0); }
                    25% { transform: rotate(-${staggerDegree}deg); }
                    50% { transform: rotate(${staggerDegree * 0.67}deg); }
                    75% { transform: rotate(${staggerDegree * 2}deg); }
                    100% { transform: rotate(${staggerDegree}deg); }
                }
            `
        case "dreamy":
            return `
                @keyframes float-${index} {
                    0% { transform: translateY(0) rotateZ(${floatIntensity * 1.67}deg); }
                    30% { transform: translateY(-${floatIntensity * 0.67}px) rotateZ(-${floatIntensity * 1.67}deg); }
                    55% { transform: translateY(-${floatIntensity}px) rotateZ(${floatIntensity * 1.67}deg); }
                    75% { transform: translateY(-${floatIntensity * 0.67}px) rotateZ(-${floatIntensity * 1.67}deg); }
                    100% { transform: translateY(0) rotateZ(0deg); }
                }
            `
        case "peppy":
            return `
                @keyframes bounce-${index} {
                    0%, 40%, 100% { transform: translateY(0); }
                    20% { transform: translateY(-${bounceIntensity}px); }
                }
            `
        default:
            return ""
    }
}

addPropertyControls(AnimatedCheckboxes, {
    checkboxes: {
        type: ControlType.Array,
        title: "Checkboxes",
        description: "Add and configure multiple checkboxes",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Option",
                    description: "The text displayed next to the checkbox",
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "checkbox",
                    description: "Form field name for form submission",
                },
                value: {
                    type: ControlType.String,
                    title: "Value",
                    defaultValue: "value",
                    description: "Form field value when checked",
                },
                defaultChecked: {
                    type: ControlType.Boolean,
                    title: "Default Checked",
                    defaultValue: false,
                    description: "Initial checked state of the checkbox",
                },
                animation: {
                    type: ControlType.Object,
                    title: "Animation",
                    description:
                        "Configure the animation effect when this checkbox is checked",
                    optional: true,
                    controls: {
                        effect: {
                            type: ControlType.Enum,
                            title: "Effect",
                            description:
                                "Choose an animation effect for the checked state",
                            options: effects.map((e) => e.id),
                            optionTitles: effects.map((e) => e.title),
                            defaultValue: "none",
                        },
                        wiggleIntensity: {
                            type: ControlType.Number,
                            title: "Intensity",
                            description:
                                "Controls how strong the wiggle effect is (0-1)",
                            defaultValue: 1,
                            min: 0,
                            max: 1,
                            step: 0.1,
                            hidden: ({ effect }) => effect !== "cranky",
                        },
                        wiggleDegree: {
                            type: ControlType.Number,
                            title: "Degree",
                            description:
                                "Maximum rotation angle for the wiggle effect",
                            defaultValue: 15,
                            min: 1,
                            max: 45,
                            step: 1,
                            unit: "deg",
                            hidden: ({ effect }) => effect !== "cranky",
                        },
                        sleepIntensity: {
                            type: ControlType.Number,
                            title: "Intensity",
                            description:
                                "Controls the opacity fade strength of the sleep effect",
                            defaultValue: 1,
                            min: 0.1,
                            max: 2,
                            step: 0.1,
                            hidden: ({ effect }) => effect !== "sleepy",
                        },
                        shakeIntensity: {
                            type: ControlType.Number,
                            title: "Intensity",
                            description:
                                "Distance the checkbox shakes horizontally",
                            defaultValue: 5,
                            min: 1,
                            max: 20,
                            step: 1,
                            unit: "px",
                            hidden: ({ effect }) => effect !== "fearful",
                        },
                        staggerIntensity: {
                            type: ControlType.Number,
                            title: "Intensity",
                            description:
                                "Controls how strong the stagger rotation is (0-1)",
                            defaultValue: 1,
                            min: 0,
                            max: 1,
                            step: 0.1,
                            hidden: ({ effect }) => effect !== "drunk",
                        },
                        staggerDegree: {
                            type: ControlType.Number,
                            title: "Degree",
                            description:
                                "Base rotation angle for the stagger effect",
                            defaultValue: 45,
                            min: 10,
                            max: 90,
                            step: 5,
                            unit: "deg",
                            hidden: ({ effect }) => effect !== "drunk",
                        },
                        floatIntensity: {
                            type: ControlType.Number,
                            title: "Intensity",
                            description:
                                "Distance the checkbox floats up and down",
                            defaultValue: 15,
                            min: 5,
                            max: 30,
                            step: 1,
                            unit: "px",
                            hidden: ({ effect }) => effect !== "dreamy",
                        },
                        bounceIntensity: {
                            type: ControlType.Number,
                            title: "Intensity",
                            description: "Height of the bounce effect",
                            defaultValue: 20,
                            min: 5,
                            max: 40,
                            step: 1,
                            unit: "px",
                            hidden: ({ effect }) => effect !== "peppy",
                        },
                    },
                },
            },
        },
        defaultValue: [
            {
                label: "Option 1",
                name: "option1",
                value: "value1",
                defaultChecked: false,
            },
            {
                label: "Option 2",
                name: "option2",
                value: "value2",
                defaultChecked: false,
            },
            {
                label: "Option 3",
                name: "option3",
                value: "value3",
                defaultChecked: false,
            },
        ],
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        description: "Horizontal alignment of the checkbox stack",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    labelStyle: {
        type: ControlType.Object,
        title: "Label Style",
        description: "Customize the appearance of the label text",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                description: "Typography settings for the label",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayTextAlignment: true,
                displayFontSize: true,
                defaultValue: {
                    fontSize: "16px",
                    variant: "Medium",
                    lineHeight: "1.2em",
                    letterSpacing: "-0.01em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                description: "Text color of the label",
                defaultValue: "#9f01fc",
            },
            textCase: {
                type: ControlType.Enum,
                title: "Text Case",
                description: "Change the case of the checkbox label text",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
        },
    },
    checkboxAppearance: {
        type: ControlType.Object,
        title: "Checkbox",
        description: "Configure the checkbox appearance in unchecked state",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                description: "Width and height of the checkbox",
                defaultValue: 20,
                min: 10,
                max: 50,
                step: 2,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background (Default)",
                description: "Fill color when unchecked",
                defaultValue: "transparent",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color (Default)",
                description: "Border color when unchecked",
                defaultValue: "#d59af7",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width (Default)",
                description: "Thickness of the border when unchecked",
                defaultValue: 2,
                min: 0,
                max: 20,
                step: 1,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius (Default)",
                description: "Corner roundness when unchecked",
                defaultValue: 3,
                min: 0,
                max: 25,
                step: 1,
            },
        },
    },
    checkedState: {
        type: ControlType.Object,
        title: "Checked State",
        description: "Customize how the checkbox looks when checked",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                description: "Fill color when checked",
                defaultValue: "#d59af7",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                description: "Border color when checked",
                defaultValue: "#d59af7",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                description: "Thickness of the border when checked",
                defaultValue: 5,
                min: 0,
                max: 20,
                step: 1,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                description: "Corner roundness when checked",
                defaultValue: 3,
                min: 0,
                max: 25,
                step: 1,
            },
            showCheckmark: {
                type: ControlType.Boolean,
                title: "Show Checkmark",
                description: "Display checkmark icon when checked",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            checkmarkColor: {
                type: ControlType.Color,
                title: "Checkmark Color",
                description: "Color of the checkmark icon",
                defaultValue: "#FFFFFF",
                hidden: ({ showCheckmark }) => !showCheckmark,
            },
            customCheckmark: {
                type: ControlType.ResponsiveImage,
                title: "Custom Checkmark",
                description: "Upload a custom checkmark icon",
                hidden: ({ showCheckmark }) => !showCheckmark,
            },
        },
    },
    focusStyle: {
        type: ControlType.Object,
        title: "Focus Style",
        description:
            "Visual feedback when checkbox is focused (keyboard navigation)",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable Focus",
                description: "Show focus outline for keyboard navigation",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            outlineColor: {
                type: ControlType.Color,
                title: "Outline Color",
                description: "Color of the focus outline",
                defaultValue: "#9f01fc",
                hidden: ({ enabled }) => !enabled,
            },
            outlineWidth: {
                type: ControlType.Number,
                title: "Outline Width",
                description: "Thickness of the focus outline",
                defaultValue: 2,
                min: 0,
                max: 10,
                step: 1,
                hidden: ({ enabled }) => !enabled,
            },
            outlineOffset: {
                type: ControlType.Number,
                title: "Outline Offset",
                description: "Distance of the focus outline from the checkbox",
                defaultValue: 2,
                min: 0,
                max: 10,
                step: 1,
                hidden: ({ enabled }) => !enabled,
            },
        },
    },
    strikethroughEnabled: {
        type: ControlType.Boolean,
        title: "Strikethrough",
        description: "Enable strikethrough animation when checked",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    strikethroughAnimation: {
        type: ControlType.Enum,
        title: "Strikethrough Animation",
        description:
            "Choose strikethrough animation style \n \n Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works/)",
        options: ["left", "middle"],
        optionTitles: ["Left", "Middle"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: ({ strikethroughEnabled }) => !strikethroughEnabled,
    },
})
