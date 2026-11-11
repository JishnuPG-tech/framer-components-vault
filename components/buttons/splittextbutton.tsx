// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState } from "react"

export default function SplitTextButton(props: {
    label: string
    hoverLabel: string
    fontSize: number
    fontWeight: string
    paddingH: number
    paddingV: number
    borderRadius: number
    borderColor: string
    borderWidth: number
    bgColor: string
    useGradient: boolean
    gradientFrom: string
    gradientTo: string
    gradientAngle: number
    useHoverGradient: boolean
    hoverGradientFrom: string
    hoverGradientTo: string
    hoverGradientAngle: number
    textColor: string
    hoverBgColor: string
    hoverTextColor: string
    letterSpacing: number
    animDuration: number
    link: string
    linkTarget: string
    onClick: () => void
}) {
    const {
        label = "Start Free",
        hoverLabel = "Start Free",
        fontSize = 15,
        fontWeight = "900",
        paddingH = 48,
        paddingV = 17,
        borderRadius = 999,
        borderColor = "#d7d7d7",
        borderWidth = 1,
        bgColor = "#ffffff",
        useGradient = false,
        gradientFrom = "#6366f1",
        gradientTo = "#06b6d4",
        gradientAngle = 135,
        useHoverGradient = false,
        hoverGradientFrom = "#818cf8",
        hoverGradientTo = "#22d3ee",
        hoverGradientAngle = 135,
        textColor = "#000000",
        hoverBgColor = "#ffffff",
        hoverTextColor = "#000000",
        letterSpacing = 0.08,
        animDuration = 250,
        link = "",
        linkTarget = "_self",
        onClick,
    } = props

    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = useState(false)

    const resolvedBg = useGradient
        ? `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`
        : bgColor

    const resolvedHoverBg = useHoverGradient
        ? `linear-gradient(${hoverGradientAngle}deg, ${hoverGradientFrom}, ${hoverGradientTo})`
        : hoverBgColor

    const letters = hoverLabel.replace(/\s/g, "\u00A0").split("")

    const baseStyles: React.CSSProperties = {
        position: "relative",
        display: "inline-block",
        padding: `${paddingV}px ${paddingH}px`,
        borderRadius,
        border: `${borderWidth}px solid ${borderColor}`,
        background: resolvedBg,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize,
        fontWeight,
        fontVariantNumeric: "normal",
        textTransform: "uppercase",
        letterSpacing: `${letterSpacing}em`,
        cursor: "pointer",
        overflow: "hidden",
        WebkitMaskImage: "-webkit-radial-gradient(#000, #fff)",
        transform: "translateZ(0)",
        textDecoration: "none",
        outline: "none",
        WebkitAppearance: "none",
        lineHeight: 1.5,
        userSelect: "none",
    }

    // static / export fallback
    if (isStatic) {
        const el = (
            <span
                style={{
                    ...baseStyles,
                    background: resolvedBg,
                    color: textColor,
                }}
            >
                {label}
            </span>
        )
        if (link)
            return (
                <a
                    href={link}
                    target={linkTarget}
                    rel={
                        linkTarget === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                    }
                    style={{ textDecoration: "none" }}
                >
                    {el}
                </a>
            )
        return el
    }

    const dur = isStatic ? "0ms" : `${animDuration}ms`
    const ease = "cubic-bezier(0.87, 0, 0.13, 1)"
    const transition = isStatic ? "none" : `transform ${dur} ${ease}`

    const inner = (
        <>
            {/* original label — slides down on hover */}
            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    bottom: -2,
                    display: "grid",
                    placeContent: "center",
                    background: resolvedBg,
                    color: textColor,
                    transform: hovered ? "translateY(100%)" : "translateY(0%)",
                    transition: transition,
                    pointerEvents: "none",
                    fontWeight,
                    fontSize,
                    letterSpacing: `${letterSpacing}em`,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </span>

            {/* staggered letters — fly in from alternating directions */}
            <span
                style={{
                    display: "inline-flex",
                    gap: "0.05em",
                    visibility: "hidden", // keeps sizing, letters are abs-positioned via opacity
                    pointerEvents: "none",
                    fontWeight,
                    fontSize,
                    letterSpacing: `${letterSpacing}em`,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                }}
            >
                {letters.map((ch, i) => {
                    const isEven = i % 2 === 1
                    const delay = hovered ? `${i * 50}ms` : "0ms"
                    return (
                        <span
                            key={i}
                            aria-hidden="true"
                            style={{
                                display: "inline-block",
                                color: hoverTextColor,
                                opacity: hovered ? 1 : 0,
                                transform: hovered
                                    ? "translateY(0)"
                                    : isEven
                                      ? "translateY(15px)"
                                      : "translateY(-15px)",
                                transition: isStatic
                                    ? "none"
                                    : hovered
                                      ? `transform ${dur} ${ease} ${delay}, opacity ${dur} ${ease} ${delay}`
                                      : `transform ${dur} ${ease}, opacity ${dur} ${ease}`,
                                visibility: "visible",
                                whiteSpace: "pre",
                            }}
                        >
                            {ch}
                        </span>
                    )
                })}
            </span>
        </>
    )

    const handlers = {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        onClick,
    }

    if (link)
        return (
            <a
                href={link}
                target={linkTarget}
                rel={
                    linkTarget === "_blank" ? "noopener noreferrer" : undefined
                }
                aria-label={label}
                style={{
                    ...baseStyles,
                    background: hovered ? resolvedHoverBg : resolvedBg,
                }}
                {...handlers}
            >
                {inner}
            </a>
        )

    return (
        <button
            type="button"
            aria-label={label}
            style={{
                ...baseStyles,
                background: hovered ? resolvedHoverBg : resolvedBg,
            }}
            {...handlers}
        >
            {inner}
        </button>
    )
}

SplitTextButton.defaultProps = {
    label: "Start Free",
    hoverLabel: "Start Free",
    fontSize: 15,
    fontWeight: "900",
    paddingH: 48,
    paddingV: 17,
    borderRadius: 999,
    borderColor: "#d7d7d7",
    borderWidth: 1,
    bgColor: "#ffffff",
    useGradient: false,
    gradientFrom: "#6366f1",
    gradientTo: "#06b6d4",
    gradientAngle: 135,
    useHoverGradient: false,
    hoverGradientFrom: "#818cf8",
    hoverGradientTo: "#22d3ee",
    hoverGradientAngle: 135,
    textColor: "#000000",
    hoverBgColor: "#ffffff",
    hoverTextColor: "#000000",
    letterSpacing: 0.08,
    animDuration: 250,
    link: "",
    linkTarget: "_self",
}

addPropertyControls(SplitTextButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Start Free",
    },
    hoverLabel: {
        type: ControlType.String,
        title: "Hover Label",
        defaultValue: "Start Free",
        description:
            "Text shown as staggered letters on hover (can differ from label)",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 15,
        min: 10,
        max: 40,
        step: 1,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        defaultValue: "900",
        options: ["400", "500", "600", "700", "800", "900"],
        optionTitles: [
            "Regular",
            "Medium",
            "SemiBold",
            "Bold",
            "ExtraBold",
            "Black",
        ],
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0.08,
        min: 0,
        max: 0.5,
        step: 0.01,
    },
    paddingH: {
        type: ControlType.Number,
        title: "Padding H",
        defaultValue: 48,
        min: 8,
        max: 120,
        step: 2,
    },
    paddingV: {
        type: ControlType.Number,
        title: "Padding V",
        defaultValue: 17,
        min: 4,
        max: 60,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        step: 1,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 0.5,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#d7d7d7",
    },
    bgColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#ffffff",
    },
    useGradient: {
        type: ControlType.Boolean,
        title: "Use Gradient",
        defaultValue: false,
        enabledTitle: "Gradient",
        disabledTitle: "Solid",
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "Gradient From",
        defaultValue: "#6366f1",
        hidden: (props) => !props.useGradient,
    },
    gradientTo: {
        type: ControlType.Color,
        title: "Gradient To",
        defaultValue: "#06b6d4",
        hidden: (props) => !props.useGradient,
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 135,
        min: 0,
        max: 360,
        step: 5,
        unit: "°",
        hidden: (props) => !props.useGradient,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    hoverBgColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#ffffff",
    },
    useHoverGradient: {
        type: ControlType.Boolean,
        title: "Hover Gradient",
        defaultValue: false,
        enabledTitle: "Gradient",
        disabledTitle: "Solid",
    },
    hoverGradientFrom: {
        type: ControlType.Color,
        title: "Hover From",
        defaultValue: "#818cf8",
        hidden: (props) => !props.useHoverGradient,
    },
    hoverGradientTo: {
        type: ControlType.Color,
        title: "Hover To",
        defaultValue: "#22d3ee",
        hidden: (props) => !props.useHoverGradient,
    },
    hoverGradientAngle: {
        type: ControlType.Number,
        title: "Hover Angle",
        defaultValue: 135,
        min: 0,
        max: 360,
        step: 5,
        unit: "°",
        hidden: (props) => !props.useHoverGradient,
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text Color",
        defaultValue: "#000000",
    },
    animDuration: {
        type: ControlType.Number,
        title: "Anim Speed (ms)",
        defaultValue: 250,
        min: 100,
        max: 800,
        step: 25,
        displayStepper: true,
    },
    link: {
        type: ControlType.String,
        title: "Link URL",
        defaultValue: "",
        placeholder: "https://...",
    },
    linkTarget: {
        type: ControlType.Enum,
        title: "Open In",
        defaultValue: "_self",
        options: ["_self", "_blank"],
        optionTitles: ["Same Tab", "New Tab"],
    },
    onClick: { type: ControlType.EventHandler, title: "On Click" },
})
