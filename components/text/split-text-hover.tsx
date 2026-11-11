import {
    useRef,
    useState,
    useCallback,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"
// DODANO: useIsStaticRenderer import
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

interface SplitTextHoverProps {
    text: string
    tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span"
    font: any
    textColor: string
    hoverTextColor: string
    duration: number
    staggerDelay: number
    yOffset: number
    letterOffset: number
    padding: number
    gap: number
    showIcon: boolean
    icon?: React.ReactNode
    iconPosition: "left" | "right"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function SplitTextHover(props: SplitTextHoverProps) {
    const {
        text = "Split Text Hover",
        tag = "span",
        font,
        textColor = "#1215CC",
        hoverTextColor = "#F63737",
        duration = 0.3,
        staggerDelay = 0.02,
        yOffset = 30,
        letterOffset = 0,
        padding = 0,
        gap = 12,
        showIcon = false,
        icon,
        iconPosition = "left",
    } = props

    // DODANO: Hook za provjeru statičnog renderera
    const isStatic = useIsStaticRenderer()

    const [isHovered, setIsHovered] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Određivanje dinamičkog HTML taga
    const Tag = tag as keyof JSX.IntrinsicElements

    const characters = useMemo(() => {
        return text.split("").map((char, index) => ({
            char: char === " " ? "\u00A0" : char,
            key: `${index}-${char}`,
        }))
    }, [text])

    const handlePointerEnter = useCallback(() => {
        startTransition(() => setIsHovered(true))
    }, [])

    const handlePointerLeave = useCallback(() => {
        startTransition(() => setIsHovered(false))
    }, [])

    const cleanedFont = useMemo(() => {
        if (!font) return {}

        const { variant, ...rest } = font
        const style: any = { ...rest }

        if (variant && (style.fontWeight == null || style.fontStyle == null)) {
            const italic = String(variant).toLowerCase().includes("italic")
            if (style.fontStyle == null)
                style.fontStyle = italic ? "italic" : "normal"

            const weightMap: Record<string, number> = {
                thin: 100,
                "extra light": 200,
                light: 300,
                regular: 400,
                medium: 500,
                semibold: 600,
                bold: 700,
                "extra bold": 800,
                black: 900,
            }

            const normalized = String(variant)
                .replace(/\s*Italic\s*$/i, "")
                .trim()
                .toLowerCase()

            if (style.fontWeight == null) {
                style.fontWeight =
                    weightMap[normalized] ??
                    (normalized === "variable" ? 400 : undefined)
            }
        }

        if (style.fontVariationSettings && style.fontWeight != null) {
            style.fontWeight = "normal"
        }

        return style
    }, [font])

    const { fontSize, ...letterFontProps } = cleanedFont
    const effectiveFontSize = fontSize || "24px"

    const letterStyle: CSSProperties = {
        display: "inline-block",
        ...(letterFontProps as any),
    }

    const contentHeight = cleanedFont.lineHeight || "1em"

    // DODANO: Statični Fallback UI za Framer platno (canvas) i izvoz (export)
    if (isStatic) {
        return (
            <Tag
                aria-label={text}
                style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    padding: `${padding}px`,
                    gap: `${gap}px`,
                    boxSizing: "border-box",
                    alignItems: "center",
                    flexDirection:
                        iconPosition === "left" ? "row" : "row-reverse",
                    margin: 0,
                    ...props.style,
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        display: "flex",
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent:
                            iconPosition === "left" ? "flex-start" : "flex-end",
                        gap: `${gap}px`,
                        flexDirection:
                            iconPosition === "left" ? "row" : "row-reverse",
                    }}
                >
                    {showIcon && icon && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            {icon}
                        </div>
                    )}
                    <div
                        style={{
                            position: "relative",
                            display: "inline-flex",
                            overflow: "hidden",
                            height: contentHeight,
                            alignItems: "center",
                            fontSize: effectiveFontSize,
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                color: textColor,
                                height: "100%",
                                lineHeight: cleanedFont.lineHeight || "1em",
                                fontSize: effectiveFontSize,
                            }}
                        >
                            {characters.map(({ char, key }) => (
                                <span key={`static-${key}`} style={letterStyle}>
                                    {char}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </Tag>
        )
    }

    // ORIGINALNA ANIMIRANA KOMPONENTA (za pregled i objavljenu stranicu)
    const content = (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                display: "inline-flex",
                overflow: "hidden",
                height: contentHeight,
                alignItems: "center",
                fontSize: effectiveFontSize,
            }}
        >
            {/* ORIGINALNI TEKST (Sloj koji nestaje) */}
            <motion.div
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    color: textColor,
                    height: "100%",
                    lineHeight: cleanedFont.lineHeight || "1em",
                    fontSize: effectiveFontSize,
                }}
            >
                {characters.map(({ char, key }, index) => (
                    <motion.span
                        key={`original-${key}`}
                        style={letterStyle}
                        initial={{ y: 0 }}
                        animate={{
                            y: isHovered
                                ? -(yOffset + index * letterOffset)
                                : 0,
                        }}
                        transition={{
                            duration: duration,
                            delay: index * staggerDelay,
                            ease: [0.25, 0.1, 0.25, 1],
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
            </motion.div>

            {/* HOVER TEKST (Sloj koji se pojavljuje odozdo) */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    color: hoverTextColor,
                    lineHeight: cleanedFont.lineHeight || "1em",
                    fontSize: effectiveFontSize,
                    pointerEvents: "none", // Sprječava titranje (flickering) prikaza na mišu
                }}
            >
                {characters.map(({ char, key }, index) => (
                    <motion.span
                        key={`hover-${key}`}
                        style={letterStyle}
                        initial={{ y: yOffset + index * letterOffset }}
                        animate={{
                            y: isHovered ? 0 : yOffset + index * letterOffset,
                        }}
                        transition={{
                            duration: duration,
                            delay: index * staggerDelay,
                            ease: [0.25, 0.1, 0.25, 1],
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
            </motion.div>
        </div>
    )

    return (
        <Tag
            // Pravilna pristupačnost - screen reader čita samo ovaj label, preskače animirana slova
            aria-label={text}
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                padding: `${padding}px`,
                gap: `${gap}px`,
                boxSizing: "border-box",
                alignItems: "center",
                flexDirection: iconPosition === "left" ? "row" : "row-reverse",
                margin: 0, // Ključno: poništava default margine H1-H6 tagova unutar Framera
                ...props.style,
            }}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
        >
            {/* Sakrivamo vizualne elemente od screen readera kako bi se izbjeglo dvostruko čitanje */}
            <div
                aria-hidden="true"
                style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent:
                        iconPosition === "left" ? "flex-start" : "flex-end",
                    gap: `${gap}px`,
                    flexDirection:
                        iconPosition === "left" ? "row" : "row-reverse",
                }}
            >
                {showIcon && icon && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </div>
                )}
                {content}
            </div>
        </Tag>
    )
}

addPropertyControls(SplitTextHover, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Split Text Hover",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.4em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#0099FF",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text Color",
        defaultValue: "#F63737",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.02,
        min: 0.0,
        max: 0.2,
        step: 0.001,
        unit: "s",
    },
    yOffset: {
        type: ControlType.Number,
        title: "Y Offset",
        defaultValue: 30,
        min: 10,
        max: 2000,
        step: 1,
        unit: "px",
    },
    letterOffset: {
        type: ControlType.Number,
        title: "Letter Offset",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 0,
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Icon Gap",
        defaultValue: 12,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    icon: {
        type: ControlType.Slot,
        title: "Icon",
        maxCount: 1,
        hidden: ({ showIcon }) => !showIcon,
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: ({ showIcon }) => !showIcon,
    },
    tag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "span"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "Span"],
        defaultValue: "span",
        description:
            "Crafted with 🖤 by Igor.\n\nGrab more [Framer components](https://www.framer.com/%40igor-reif/?tab=marketplace), and if this freebie saved you some time, feel free to [Buy me a beer](https://revolut.me/ireif). Cheers!🍻",
    },
})
