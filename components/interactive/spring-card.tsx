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

import { motion, useInView, useReducedMotion } from "framer-motion"

type Font = React.CSSProperties
interface CardProps {
    title?: string
    description?: string
    link?: string
    newTab?: boolean
    previewHover?: boolean
    touchExpanded?: boolean
    colors?: Partial<typeof colorDefaults>
    layout?: Partial<typeof layoutDefaults>
    stack?: Partial<typeof stackDefaults>
    arrow?: Partial<typeof arrowDefaults>
    badge?: Partial<typeof badgeDefaults>
    button?: Partial<typeof buttonDefaults>
    animation?: Partial<typeof animationDefaults>
    titleFont?: Font
    bodyFont?: Font
    buttonFont?: Font
    badgeFont?: Font
    style?: React.CSSProperties
}
const colorDefaults = {
    background: "#FFA1A3",
    hoverBackground: "#FFA1A3",
    text: "#000000",
    hoverText: "#000000",
    border: "#000000",
}
const layoutDefaults = {
    padding: 48,
    borderWidth: 3,
    radius: 0,
    contentGap: 24,
}
const stackDefaults = {
    enabled: true,
    layers: 2,
    offsetX: 12,
    offsetY: 12,
    liftX: -12,
    liftY: -12,
    color: "#FFA1A3",
    matchCard: true,
}
const arrowDefaults = {
    enabled: true,
    size: 32,
    gap: 14,
    stroke: 2.5,
    rotation: 0,
    color: "#000000",
    fromX: -18,
}
const badgeDefaults = {
    enabled: true,
    text: "LEARN MORE • ",
    repeats: 4,
    size: 240,
    right: -120,
    top: -120,
    color: "#000000",
    duration: 12,
    reverse: false,
    startAngle: 0,
}
const buttonDefaults = {
    enabled: true,
    label: "LET’S GO",
    height: 64,
    inset: 12,
    gap: 32,
    background: "#FFFFFF",
    text: "#000000",
    border: "#000000",
    borderWidth: 3,
    radius: 0,
}
const animationDefaults = {
    duration: 0.35,
    easing: "easeOut",
    scale: 1,
    rotation: 0,
}
const titleDefault: Font = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 36,
    fontWeight: 700,
    lineHeight: "1.1em",
    letterSpacing: "-0.02em",
}
const bodyDefault: Font = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 24,
    fontWeight: 400,
    lineHeight: "1.4em",
    letterSpacing: "-0.025em",
}
const buttonDefault: Font = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 24,
    fontWeight: 500,
    lineHeight: "1em",
}
const badgeDefault: Font = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: "-0.04em",
}

/**
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 435
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function StackedHoverCard(props: CardProps) {
    const {
        title = "DUTIFUL",
        description = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Exercitationem doloremque vitae minima.",
        link = "",
        newTab = false,
        previewHover = false,
        touchExpanded = true,
        style,
    } = props
    const c = { ...colorDefaults, ...props.colors }
    const l = { ...layoutDefaults, ...props.layout }
    const s = { ...stackDefaults, ...props.stack }
    const a = { ...arrowDefaults, ...props.arrow }
    const b = { ...badgeDefaults, ...props.badge }
    const btn = { ...buttonDefaults, ...props.button }
    const anim = { ...animationDefaults, ...props.animation }
    const root = React.useRef<HTMLDivElement>(null)
    const inView = useInView(root)
    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [touch, setTouch] = React.useState(false)
    const id = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    React.useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const query = window.matchMedia("(hover: none)")
        const update = () => setTouch(query.matches)
        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [isStatic])
    const active = isStatic
        ? previewHover
        : hovered || focused || (touch && touchExpanded)
    const transition = {
        duration: reduced || isStatic ? 0 : anim.duration,
        ease: anim.easing as "easeOut" | "easeInOut" | "linear",
    }
    const border = `${l.borderWidth}px solid ${c.border}`
    const visibleButton = active && btn.enabled
    const rotationName = `cardRing${id}`
    const sharedText: Font = {
        minWidth: 0,
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap",
    }
    const surface = (
        <>
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: l.contentGap,
                    padding: l.padding,
                }}
            >
                <div style={{ position: "relative", flexShrink: 0 }}>
                    {a.enabled && (
                        <motion.span
                            aria-hidden="true"
                            initial={false}
                            animate={{
                                opacity: active ? 1 : 0,
                                x: active ? 0 : a.fromX,
                                rotate: a.rotation,
                            }}
                            transition={transition}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                color: a.color,
                            }}
                        >
                            <svg
                                width={a.size}
                                height={a.size}
                                viewBox="0 0 32 32"
                                fill="none"
                            >
                                <path
                                    d="M4 16h23M16 5l11 11-11 11"
                                    stroke="currentColor"
                                    strokeWidth={a.stroke}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </motion.span>
                    )}
                    <motion.h3
                        initial={false}
                        animate={{
                            paddingLeft:
                                active && a.enabled ? a.size + a.gap : 0,
                        }}
                        transition={transition}
                        style={{
                            ...titleDefault,
                            ...props.titleFont,
                            ...sharedText,
                            margin: 0,
                        }}
                    >
                        {title}
                    </motion.h3>
                </div>
                <div style={{ flex: 1, minHeight: l.contentGap }} />
                <p
                    style={{
                        ...bodyDefault,
                        ...props.bodyFont,
                        ...sharedText,
                        margin: 0,
                        flexShrink: 0,
                    }}
                >
                    {description}
                </p>
            </div>
            <motion.div
                initial={false}
                animate={{
                    height: visibleButton
                        ? btn.height + btn.inset + btn.gap
                        : 0,
                    opacity: visibleButton ? 1 : 0,
                    marginTop: visibleButton ? -l.padding : 0,
                }}
                transition={transition}
                aria-hidden={!visibleButton}
                style={{ flexShrink: 0, overflow: "hidden" }}
            >
                <div
                    style={{
                        padding: `${btn.gap}px ${btn.inset}px ${btn.inset}px`,
                    }}
                >
                    <div
                        style={{
                            ...buttonDefault,
                            ...props.buttonFont,
                            minHeight: btn.height,
                            boxSizing: "border-box",
                            padding: "8px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: btn.background,
                            color: btn.text,
                            border: `${btn.borderWidth}px solid ${btn.border}`,
                            borderRadius: btn.radius,
                            overflowWrap: "anywhere",
                        }}
                    >
                        {btn.label}
                    </div>
                </div>
            </motion.div>
            {b.enabled && (
                <motion.div
                    aria-hidden="true"
                    initial={false}
                    animate={{ opacity: active ? 1 : 0 }}
                    transition={transition}
                    style={{
                        position: "absolute",
                        width: b.size,
                        height: b.size,
                        right: b.right,
                        top: b.top,
                        pointerEvents: "none",
                    }}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 240 240"
                        style={{
                            overflow: "visible",
                            animation: `${rotationName} ${Math.max(0.1, b.duration)}s linear infinite`,
                            animationDirection: b.reverse
                                ? "reverse"
                                : "normal",
                            animationPlayState:
                                active && inView && !isStatic && !reduced
                                    ? "running"
                                    : "paused",
                        }}
                    >
                        <defs>
                            <path
                                id={`ring${id}`}
                                d="M 120,120 m -99,0 a 99,99 0 1,1 198,0 a 99,99 0 1,1 -198,0"
                            />
                        </defs>
                        <text
                            fill={b.color}
                            style={{ ...badgeDefault, ...props.badgeFont }}
                        >
                            <textPath
                                href={`#ring${id}`}
                                textLength={Math.PI * 198}
                                lengthAdjust="spacing"
                            >
                                {Array.from(
                                    {
                                        length: Math.max(
                                            1,
                                            Math.round(b.repeats)
                                        ),
                                    },
                                    () => b.text
                                ).join("")}
                            </textPath>
                        </text>
                    </svg>
                </motion.div>
            )}
        </>
    )
    const frontStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        border,
        borderRadius: l.radius,
        overflow: "hidden",
        textDecoration: "none",
        color: active ? c.hoverText : c.text,
        background: active ? c.hoverBackground : c.background,
        outlineOffset: 5,
    }
    const frontAnimation = {
        x: active && s.enabled ? s.liftX : 0,
        y: active && s.enabled ? s.liftY : 0,
        scale: active ? anim.scale : 1,
        rotate: active ? anim.rotation : 0,
    }
    return (
        <div
            ref={root}
            onPointerEnter={(e) => {
                if (e.pointerType !== "touch") setHovered(true)
            }}
            onPointerLeave={() => setHovered(false)}
            onFocusCapture={() => setFocused(true)}
            onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node))
                    setFocused(false)
            }}
            style={{
                width: "100%",
                height: "100%",
                ...style,
                position: "relative",
                isolation: "isolate",
                overflow: "visible",
            }}
        >
            <style>{`@keyframes ${rotationName}{from{transform:rotate(${b.startAngle}deg)}to{transform:rotate(${b.startAngle + 360}deg)}}`}</style>
            {s.enabled &&
                Array.from(
                    { length: Math.max(0, Math.round(s.layers)) },
                    (_, i) => {
                        const n = s.layers - i
                        return (
                            <motion.div
                                key={i}
                                aria-hidden="true"
                                initial={false}
                                animate={{
                                    x: active ? s.liftX + s.offsetX * n : 0,
                                    y: active ? s.liftY + s.offsetY * n : 0,
                                    opacity: active ? 1 : 0,
                                    rotate: active ? anim.rotation : 0,
                                    scale: active ? anim.scale : 1,
                                }}
                                transition={transition}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    border,
                                    borderRadius: l.radius,
                                    boxSizing: "border-box",
                                    background: s.matchCard
                                        ? c.hoverBackground
                                        : s.color,
                                    pointerEvents: "none",
                                }}
                            />
                        )
                    }
                )}
            {link ? (
                <motion.a
                    href={link}
                    target={newTab ? "_blank" : undefined}
                    rel={newTab ? "noopener noreferrer" : undefined}
                    aria-label={`${title}${btn.enabled ? ` — ${btn.label}` : ""}`}
                    initial={false}
                    animate={frontAnimation}
                    transition={transition}
                    style={{ ...frontStyle, cursor: "pointer" }}
                >
                    {surface}
                </motion.a>
            ) : (
                <motion.article
                    tabIndex={0}
                    aria-label={title}
                    initial={false}
                    animate={frontAnimation}
                    transition={transition}
                    style={frontStyle}
                >
                    {surface}
                </motion.article>
            )}
        </div>
    )
}

const num = (
    title: string,
    value: number,
    min: number,
    max: number,
    step = 1
) => ({
    type: ControlType.Number as const,
    title,
    defaultValue: value,
    min,
    max,
    step,
})
const color = (title: string, value: string) => ({
    type: ControlType.Color as const,
    title,
    defaultValue: value,
})
const bool = (title: string, value = true) => ({
    type: ControlType.Boolean as const,
    title,
    defaultValue: value,
})
const font = (
    title: string,
    size: number,
    variant: "Bold" | "Regular" | "Medium" | "Black",
    lineHeight: string
) => ({
    type: ControlType.Font as const,
    title,
    controls: "extended" as const,
    defaultFontType: "sans-serif" as const,
    defaultValue: {
        fontSize: `${size}px`,
        variant,
        lineHeight,
        letterSpacing: "-0.02em",
    },
})
addPropertyControls(StackedHoverCard, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "DUTIFUL",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
        defaultValue:
            "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Exercitationem doloremque vitae minima.",
    },
    link: { type: ControlType.Link, title: "Link", defaultValue: "" },
    newTab: bool("New Tab", false),
    previewHover: bool("Preview Hover", false),
    touchExpanded: bool("Touch Expanded", true),
    colors: {
        type: ControlType.Object,
        title: "Colors",
        defaultValue: colorDefaults,
        controls: {
            background: color("Card", colorDefaults.background),
            hoverBackground: color("Hover Card", colorDefaults.hoverBackground),
            text: color("Text", "#000000"),
            hoverText: color("Hover Text", "#000000"),
            border: color("Border", "#000000"),
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        defaultValue: layoutDefaults,
        controls: {
            padding: num("Padding", 48, 0, 120),
            borderWidth: num("Border", 3, 0, 12),
            radius: num("Radius", 0, 0, 100),
            contentGap: num("Min Gap", 24, 0, 100),
        },
    },
    stack: {
        type: ControlType.Object,
        title: "Stack",
        defaultValue: stackDefaults,
        controls: {
            enabled: bool("Enabled"),
            layers: num("Layers", 2, 1, 5),
            offsetX: num("Layer X", 12, -50, 50),
            offsetY: num("Layer Y", 12, -50, 50),
            liftX: num("Lift X", -12, -80, 80),
            liftY: num("Lift Y", -12, -80, 80),
            matchCard: bool("Match Card"),
            color: {
                ...color("Layer Color", "#FFA1A3"),
                hidden: (p: any) => p.matchCard,
            },
        },
    },
    arrow: {
        type: ControlType.Object,
        title: "Arrow",
        defaultValue: arrowDefaults,
        controls: {
            enabled: bool("Enabled"),
            size: num("Size", 32, 8, 100),
            gap: num("Title Gap", 14, 0, 60),
            stroke: num("Stroke", 2.5, 0.5, 8, 0.5),
            rotation: num("Angle", 0, -180, 180),
            fromX: num("Enter X", -18, -80, 80),
            color: color("Color", "#000000"),
        },
    },
    badge: {
        type: ControlType.Object,
        title: "Learn More Ring",
        defaultValue: badgeDefaults,
        controls: {
            enabled: bool("Enabled"),
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "LEARN MORE • ",
            },
            repeats: num("Repeats", 4, 1, 12),
            size: num("Size", 240, 60, 500),
            right: num("Right", -120, -300, 200),
            top: num("Top", -120, -300, 200),
            color: color("Color", "#000000"),
            duration: num("Seconds / Turn", 12, 1, 60, 0.5),
            reverse: bool("Reverse", false),
            startAngle: num("Start Angle", 0, -180, 180),
        },
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        defaultValue: buttonDefaults,
        controls: {
            enabled: bool("Enabled"),
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "LET’S GO",
            },
            height: num("Min Height", 64, 24, 150),
            inset: num("Edge Inset", 12, 0, 80),
            gap: num("Top Gap", 32, 0, 100),
            background: color("Background", "#FFFFFF"),
            text: color("Text", "#000000"),
            border: color("Border", "#000000"),
            borderWidth: num("Border Width", 3, 0, 12),
            radius: num("Radius", 0, 0, 80),
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Motion",
        defaultValue: animationDefaults,
        controls: {
            duration: num("Duration", 0.35, 0, 2, 0.05),
            easing: {
                type: ControlType.Enum,
                title: "Easing",
                options: ["easeOut", "easeInOut", "linear"],
                defaultValue: "easeOut",
            },
            scale: num("Hover Scale", 1, 0.8, 1.2, 0.01),
            rotation: num("Hover Rotate", 0, -15, 15, 0.5),
        },
    },
    titleFont: font("Title Font", 36, "Bold", "1.1em"),
    bodyFont: font("Body Font", 24, "Regular", "1.4em"),
    buttonFont: font("Button Font", 24, "Medium", "1em"),
    badgeFont: font("Ring Font", 24, "Black", "1em"),
})
