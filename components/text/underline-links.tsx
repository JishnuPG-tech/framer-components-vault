// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 48
 * @framerDisableUnlink
 */

type UnderlineVariant =
    | "slide"
    | "center"
    | "fill"
    | "wave"
    | "marker"
    | "arrow"

const VARIANTS: UnderlineVariant[] = [
    "slide",
    "center",
    "fill",
    "wave",
    "marker",
    "arrow",
]

const VARIANT_TITLES = ["Slide", "Center", "Fill", "Wave", "Marker", "Arrow"]

interface UnderlineLinksProps {
    text?: string
    href?: string
    title?: string
    variant?: UnderlineVariant
    textColor?: string
    color?: string
    fillColor?: string
    markerColor?: string
    thickness?: number
    external?: boolean
    resting?: boolean
    demoUI?: boolean
    font?: React.CSSProperties
    style?: React.CSSProperties
}

function useViewportVisible(
    ref: React.RefObject<HTMLElement | null>,
    isStatic: boolean
): React.MutableRefObject<boolean> {
    const isVisibleRef = useRef(true)

    useEffect(() => {
        if (isStatic) return
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic, ref])

    return isVisibleRef
}

export default function UnderlineLinks(props: UnderlineLinksProps) {
    const {
        text = "Underline link",
        href = "/",
        title = "",
        variant: variantProp = "slide",
        textColor = "#ffffff",
        color = "#ffffff",
        fillColor = "#F5F4F1",
        markerColor = "rgba(255,122,107,0.45)",
        thickness: thicknessProp = 1.5,
        external: externalProp = false,
        resting: restingProp = true,
        demoUI = false,
        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduceMotion = Boolean(useReducedMotion())
    const freeze = isStatic || reduceMotion

    const rootRef = useRef<HTMLDivElement>(null)
    useViewportVisible(rootRef, isStatic)

    const [variant, setVariant] = useState<UnderlineVariant>(variantProp)
    const [thickness, setThickness] = useState(thicknessProp)
    const [resting, setResting] = useState(restingProp)
    const [external, setExternal] = useState(externalProp)

    useEffect(() => {
        if (isStatic) return
        setVariant(variantProp)
    }, [variantProp, isStatic])

    useEffect(() => {
        if (isStatic) return
        setThickness(thicknessProp)
    }, [thicknessProp, isStatic])

    useEffect(() => {
        if (isStatic) return
        setResting(restingProp)
    }, [restingProp, isStatic])

    useEffect(() => {
        if (isStatic) return
        setExternal(externalProp)
    }, [externalProp, isStatic])

    const activeVariant = demoUI ? variant : variantProp
    const activeThickness = demoUI ? thickness : thicknessProp
    const activeResting = demoUI ? resting : restingProp
    const activeExternal = demoUI ? external : externalProp

    const schema = {
        "@context": "https://schema.org",
        "@type": "SiteNavigationElement",
        name: text,
        url: href,
        description: title || text,
    }

    return (
        <nav
            ref={rootRef}
            aria-label={text}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: demoUI ? 28 : 0,
                minWidth: 0,
                minHeight: 0,
                ...style,
            }}
        >
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />

            <AnimatedUnderlineLink
                href={href}
                text={text}
                title={title}
                variant={activeVariant}
                textColor={textColor}
                color={color}
                fillColor={fillColor}
                markerColor={markerColor}
                thickness={activeThickness}
                external={activeExternal}
                resting={activeResting}
                font={font}
                isStatic={isStatic}
                freeze={freeze}
            />

            {demoUI ? (
                <div
                    role="toolbar"
                    aria-label="Underline link controls"
                    style={{
                        width: "min(100%, 920px)",
                        borderRadius: 28,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(23,23,23,0.92)",
                        padding: "16px 20px 18px",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: 20,
                    }}
                >
                    <StyleSelect
                        value={variant}
                        onChange={setVariant}
                        isStatic={isStatic}
                    />
                    <ThicknessSlider
                        value={thickness}
                        onChange={setThickness}
                        isStatic={isStatic}
                    />
                    <Toggle
                        label="Resting line"
                        value={resting}
                        onChange={setResting}
                        isStatic={isStatic}
                    />
                    <Toggle
                        label="External"
                        value={external}
                        onChange={setExternal}
                        isStatic={isStatic}
                    />
                </div>
            ) : null}
        </nav>
    )
}

function AnimatedUnderlineLink({
    href,
    text,
    title,
    variant,
    textColor,
    color,
    fillColor,
    markerColor,
    thickness,
    external,
    resting,
    font,
    isStatic,
    freeze,
}: {
    href: string
    text: string
    title: string
    variant: UnderlineVariant
    textColor: string
    color: string
    fillColor: string
    markerColor: string
    thickness: number
    external: boolean
    resting: boolean
    font: React.CSSProperties | undefined
    isStatic: boolean
    freeze: boolean
}) {
    const ease = [0.65, 0, 0.35, 1] as const
    const dur = freeze ? 0 : 0.35
    const lineTransition = isStatic ? { duration: 0 } : { duration: dur, ease }

    const center = {
        rest: { scaleX: 0, originX: 0.5, transition: lineTransition },
        hover: { scaleX: 1, originX: 0.5, transition: lineTransition },
    }

    const slide = {
        rest: { scaleX: 0, originX: 1, transition: lineTransition },
        hover: { scaleX: 1, originX: 0, transition: lineTransition },
    }

    const showResting =
        resting &&
        (variant === "slide" || variant === "center" || variant === "arrow")

    return (
        <motion.a
            href={href}
            title={title || text}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            initial={isStatic ? false : "rest"}
            animate="rest"
            whileHover={isStatic ? undefined : "hover"}
            whileFocus={isStatic ? undefined : "hover"}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "baseline",
                width: "max-content",
                maxWidth: "100%",
                textDecoration: "none",
                color: textColor,
                gap: variant === "arrow" || external ? 4 : 0,
                paddingLeft: variant === "fill" ? 6 : 0,
                paddingRight: variant === "fill" ? 6 : 0,
                borderRadius: 4,
                outline: isStatic ? "none" : undefined,
                cursor: "pointer",
                ...font,
            }}
        >
            {showResting ? (
                <span
                    aria-hidden
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        right: 0,
                        bottom: -2,
                        left: 0,
                        height: thickness,
                        background: color,
                        opacity: 0.25,
                    }}
                />
            ) : null}

            {variant === "slide" || variant === "arrow" ? (
                <motion.span
                    aria-hidden
                    variants={slide}
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        right: 0,
                        bottom: -2,
                        left: 0,
                        height: thickness,
                        background: color,
                        scaleX: isStatic ? 1 : undefined,
                        transformOrigin: "left center",
                        transition: isStatic ? "none" : undefined,
                    }}
                />
            ) : null}

            {variant === "center" ? (
                <motion.span
                    aria-hidden
                    variants={center}
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        right: 0,
                        bottom: -2,
                        left: 0,
                        height: thickness,
                        background: color,
                        scaleX: isStatic ? 1 : undefined,
                        transformOrigin: "center",
                        transition: isStatic ? "none" : undefined,
                    }}
                />
            ) : null}

            {variant === "fill" ? (
                <motion.span
                    aria-hidden
                    variants={{
                        rest: { scaleY: 0.1, transition: lineTransition },
                        hover: { scaleY: 1, transition: lineTransition },
                    }}
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        inset: 0,
                        zIndex: 0,
                        borderRadius: 6,
                        background: fillColor,
                        transformOrigin: "center bottom",
                        scaleY: isStatic ? 0.1 : undefined,
                        transition: isStatic ? "none" : undefined,
                    }}
                />
            ) : null}

            {variant === "marker" ? (
                <motion.span
                    aria-hidden
                    variants={
                        resting
                            ? {
                                  rest: {
                                      scaleX: 1,
                                      scaleY: 0.22,
                                      transition: lineTransition,
                                  },
                                  hover: {
                                      scaleX: 1,
                                      scaleY: 1,
                                      transition: lineTransition,
                                  },
                              }
                            : {
                                  rest: {
                                      scaleX: 0,
                                      scaleY: 1,
                                      transition: lineTransition,
                                  },
                                  hover: {
                                      scaleX: 1,
                                      scaleY: 1,
                                      transition: lineTransition,
                                  },
                              }
                    }
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        left: -3,
                        right: -3,
                        top: "6%",
                        bottom: 0,
                        zIndex: 0,
                        borderRadius: 3,
                        background: markerColor,
                        transformOrigin: "left bottom",
                        transition: isStatic ? "none" : undefined,
                    }}
                />
            ) : null}

            {variant === "wave" ? (
                <svg
                    aria-hidden
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: -8,
                        width: "100%",
                        height: 10,
                        overflow: "visible",
                        display: "block",
                    }}
                >
                    <motion.path
                        d="M0 5 Q 6.25 1 12.5 5 T 25 5 T 37.5 5 T 50 5 T 62.5 5 T 75 5 T 87.5 5 T 100 5"
                        fill="none"
                        stroke={color}
                        strokeWidth={thickness}
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="butt"
                        strokeLinejoin="round"
                        variants={{
                            rest: {
                                pathLength: 0,
                                opacity: 0,
                                transition: isStatic
                                    ? { duration: 0 }
                                    : { duration: dur },
                            },
                            hover: {
                                pathLength: 1,
                                opacity: 1,
                                transition: isStatic
                                    ? { duration: 0 }
                                    : {
                                          duration: freeze ? 0 : 0.55,
                                          ease: "easeOut",
                                      },
                            },
                        }}
                    />
                </svg>
            ) : null}

            <motion.span
                variants={
                    variant === "fill"
                        ? {
                              rest: {
                                  color: textColor,
                                  transition: lineTransition,
                              },
                              hover: {
                                  color: "#0A0A0A",
                                  transition: lineTransition,
                              },
                          }
                        : undefined
                }
                style={{
                    position: "relative",
                    zIndex: 1,
                    color: textColor,
                    transition: isStatic ? "none" : undefined,
                }}
            >
                {text}
            </motion.span>

            {variant === "arrow" || external ? (
                <motion.svg
                    aria-hidden
                    width="0.8em"
                    height="0.8em"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={{
                        rest: { x: 0, y: 0 },
                        hover: external ? { x: 2, y: -2 } : { x: 3, y: 0 },
                    }}
                    transition={
                        isStatic
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 500, damping: 24 }
                    }
                    style={{
                        position: "relative",
                        flexShrink: 0,
                        alignSelf: "center",
                        zIndex: 1,
                    }}
                >
                    {external ? (
                        <path d="M7 17 17 7M8 7h9v9" />
                    ) : (
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    )}
                </motion.svg>
            ) : null}

            {external ? (
                <span
                    style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        padding: 0,
                        margin: -1,
                        overflow: "hidden",
                        clip: "rect(0, 0, 0, 0)",
                        whiteSpace: "nowrap",
                        border: 0,
                    }}
                >
                    (opens in a new tab)
                </span>
            ) : null}
        </motion.a>
    )
}

function StyleSelect({
    value,
    onChange,
    isStatic,
}: {
    value: UnderlineVariant
    onChange: (v: UnderlineVariant) => void
    isStatic: boolean
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label
                htmlFor="underline-style"
                style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    padding: "0 4px",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                }}
            >
                Style
            </label>
            <div style={{ position: "relative", minWidth: 148 }}>
                <select
                    id="underline-style"
                    aria-label="Underline style"
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value as UnderlineVariant)
                    }
                    style={{
                        appearance: "none",
                        WebkitAppearance: "none",
                        width: "100%",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#fff",
                        borderRadius: 999,
                        padding: "8px 32px 8px 14px",
                        fontSize: 12,
                        textTransform: "capitalize",
                        fontFamily:
                            "Inter, system-ui, -apple-system, sans-serif",
                        cursor: "pointer",
                        outline: isStatic ? "none" : "2px solid transparent",
                        outlineOffset: 2,
                        transition: isStatic
                            ? "none"
                            : "border-color 0.2s ease",
                    }}
                >
                    {VARIANTS.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <span
                    aria-hidden
                    style={{
                        pointerEvents: "none",
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "rgba(255,255,255,0.55)",
                        fontSize: 10,
                    }}
                >
                    ▼
                </span>
            </div>
        </div>
    )
}

function ThicknessSlider({
    value,
    onChange,
    isStatic,
}: {
    value: number
    onChange: (n: number) => void
    isStatic: boolean
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 140,
            }}
        >
            <label
                htmlFor="underline-thickness"
                style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                }}
            >
                Thickness
            </label>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 28,
                }}
            >
                <input
                    id="underline-thickness"
                    type="range"
                    min={0.5}
                    max={4}
                    step={0.1}
                    value={value}
                    aria-valuemin={0.5}
                    aria-valuemax={4}
                    aria-valuenow={value}
                    aria-label="Underline thickness"
                    onChange={(e) => onChange(Number(e.target.value))}
                    style={{
                        width: 88,
                        accentColor: "#fff",
                        cursor: "pointer",
                        transition: isStatic ? "none" : undefined,
                    }}
                />
                <span
                    style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.7)",
                        fontFamily:
                            "Inter, system-ui, -apple-system, sans-serif",
                        minWidth: 20,
                    }}
                >
                    {value.toFixed(1)}
                </span>
            </div>
        </div>
    )
}

function Toggle({
    label,
    value,
    onChange,
    isStatic,
}: {
    label: string
    value: boolean
    onChange: (v: boolean) => void
    isStatic: boolean
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 8,
            }}
        >
            <span
                style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                }}
            >
                {label}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={value}
                aria-pressed={value}
                aria-label={label}
                onClick={() => onChange(!value)}
                style={{
                    position: "relative",
                    width: 48,
                    height: 28,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: value ? "#fff" : "rgba(255,255,255,0.15)",
                    padding: 0,
                    transition: isStatic ? "none" : "background 0.2s ease",
                }}
            >
                <motion.span
                    aria-hidden
                    animate={{ left: value ? 22 : 2 }}
                    transition={
                        isStatic
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 500, damping: 24 }
                    }
                    style={{
                        position: "absolute",
                        top: 2,
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        background: value ? "#171717" : "#fff",
                        transition: isStatic ? "none" : undefined,
                    }}
                />
            </button>
        </div>
    )
}

addPropertyControls(UnderlineLinks, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Underline link",
        description: "Visible link label. Use a descriptive phrase for SEO.",
    },
    href: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "/",
        description: "Destination URL. Prefer real paths over #.",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "",
        description: "Optional tooltip and structured-data description.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    variant: {
        type: ControlType.Enum,
        title: "Style",
        options: VARIANTS,
        optionTitles: VARIANT_TITLES,
        defaultValue: "slide",
        description: "Hover underline animation style.",
    },
    color: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#ffffff",
        description: "Color of slide, center, wave and arrow lines.",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#F5F4F1",
        hidden: (props: UnderlineLinksProps) => props.variant !== "fill",
    },
    markerColor: {
        type: ControlType.Color,
        title: "Marker Color",
        defaultValue: "rgba(255,122,107,0.45)",
        hidden: (props: UnderlineLinksProps) => props.variant !== "marker",
    },
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 1.5,
        min: 0.5,
        max: 4,
        step: 0.1,
        displayStepper: true,
        description: "Stroke weight for slide, center, wave and arrow.",
    },
    resting: {
        type: ControlType.Boolean,
        title: "Resting Line",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Faint line before hover on slide, center and arrow.",
    },
    external: {
        type: ControlType.Boolean,
        title: "External",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Adds ↗ and opens in a new tab with rel=noopener.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            letterSpacing: 0,
            lineHeight: 1.4,
        },
    },
    demoUI: {
        type: ControlType.Boolean,
        title: "Demo UI",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "On-canvas Style dropdown, thickness and toggles.",
    },
})
