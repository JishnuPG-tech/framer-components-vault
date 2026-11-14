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

import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
} from "framer-motion"

type ShapeType = "orbit" | "spark" | "loops" | "waves"

type JellyItem = {
    eyebrow: string
    title: string
    description: string
    cta: string
    link: string
    color: string
    shapeColor: string
    shape: ShapeType
}

interface Props {
    items: JellyItem[]
    cardHeight: number
    gap: number
    radius: number
    padding: number
    stickerSize: number
    hoverLift: number
    magnetStrength: number
    motionSpeed: number
    background: string
    textColor: string
    pillColor: string
    pillText: string
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    buttonFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: JellyItem[] = [
    {
        eyebrow: "01 / CREATE",
        title: "Make a website.",
        description: "Give your next big idea a place to live.",
        cta: "Get Started",
        link: "",
        color: "#EDFA67",
        shapeColor: "#FF7354",
        shape: "orbit",
    },
    {
        eyebrow: "02 / TEMPLATES",
        title: "Find your fit.",
        description: "A fresh head start for your next project.",
        cta: "Explore Templates",
        link: "",
        color: "#B5B7FF",
        shapeColor: "#F77EC1",
        shape: "spark",
    },
    {
        eyebrow: "03 / COMPONENTS",
        title: "Add some magic.",
        description: "Little details. A lot more personality.",
        cta: "Browse Components",
        link: "",
        color: "#FFAD8F",
        shapeColor: "#5272EA",
        shape: "loops",
    },
    {
        eyebrow: "04 / LEARN",
        title: "Keep exploring.",
        description: "One new little trick at a time.",
        cta: "Learn More",
        link: "",
        color: "#AFE8C6",
        shapeColor: "#F2F36F",
        shape: "waves",
    },
]

const clamp = (number: number, low: number, high: number) =>
    Math.min(high, Math.max(low, number))

function ArrowIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            style={{ display: "block", flexShrink: 0 }}
        >
            <path
                d="M3.6 14.4 14.3 3.7M5.1 3.7h9.2v9.2"
                stroke="currentColor"
                strokeWidth="1.65"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function JellyArtwork({
    shape,
    ink,
}: {
    shape: ShapeType
    ink: string
}) {
    if (shape === "orbit") {
        return (
            <svg viewBox="0 0 180 180" width="100%" height="100%" aria-hidden="true">
                <circle cx="88" cy="91" r="54" fill="none" stroke={ink} strokeWidth="24" />
                <circle cx="88" cy="91" r="20" fill="#FFF1BE" />
                <circle cx="143" cy="44" r="15" fill="#FFE6AF" />
                <circle cx="38" cy="141" r="9" fill={ink} />
            </svg>
        )
    }
    if (shape === "spark") {
        return (
            <svg viewBox="0 0 180 180" width="100%" height="100%" aria-hidden="true">
                <path
                    d="M90 13 105 51 144 27 135 69 177 84 137 102 160 140 114 129 97 174 77 133 39 156 50 110 9 91 53 77 27 38 72 52Z"
                    fill="#EAFE73"
                    stroke={ink}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                />
                <circle cx="92" cy="90" r="26" fill={ink} />
                <circle cx="82" cy="85" r="5.5" fill="#FFFFFF" />
                <circle cx="104" cy="85" r="5.5" fill="#FFFFFF" />
                <path d="M81 104q12 12 25-1" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
            </svg>
        )
    }
    if (shape === "loops") {
        return (
            <svg viewBox="0 0 180 180" width="100%" height="100%" aria-hidden="true">
                <path
                    d="M33 106c-4-34 17-59 41-59 23 0 24 37 50 37 17 0 19-39 1-43-26-6-28 47-18 73 13 37 47 31 51 11"
                    fill="none"
                    stroke="#F7FF81"
                    strokeWidth="27"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M22 126c19 28 45 15 50-12 5-25-5-60 21-76"
                    fill="none"
                    stroke={ink}
                    strokeWidth="14"
                    strokeLinecap="round"
                />
                <circle cx="146" cy="125" r="17" fill="#FF83AE" />
            </svg>
        )
    }
    return (
        <svg viewBox="0 0 180 180" width="100%" height="100%" aria-hidden="true">
            <path
                d="M19 66c24-33 44 33 70 0s48-32 72 0M19 94c24-33 44 33 70 0s48-32 72 0M19 122c24-33 44 33 70 0s48-32 72 0"
                fill="none"
                stroke={ink}
                strokeWidth="13"
                strokeLinecap="round"
            />
            <circle cx="44" cy="31" r="9" fill="#FE8EA7" />
            <circle cx="143" cy="149" r="12" fill="#FE8EA7" />
        </svg>
    )
}

interface TileProps {
    item: JellyItem
    index: number
    cardHeight: number
    radius: number
    stickerSize: number
    hoverLift: number
    magnetStrength: number
    motionSpeed: number
    textColor: string
    pillColor: string
    pillText: string
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    buttonFont?: React.CSSProperties
    reduced: boolean
}

function JellyTile({
    item,
    index,
    cardHeight,
    radius,
    stickerSize,
    hoverLift,
    magnetStrength,
    motionSpeed,
    textColor,
    pillColor,
    pillText,
    titleFont,
    bodyFont,
    buttonFont,
    reduced,
}: TileProps) {
    const [hovered, setHovered] = React.useState(false)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const springX = useSpring(x, { stiffness: 190, damping: 19, mass: 0.6 })
    const springY = useSpring(y, { stiffness: 190, damping: 19, mass: 0.6 })
    const url = typeof item.link === "string" ? item.link.trim() : ""
    const linked = url.length > 0
    const showHover = hovered && !reduced
    const speed = clamp(motionSpeed, 0.5, 2)
    const spring = reduced
        ? { duration: 0 }
        : {
              type: "spring" as const,
              stiffness: 210 / speed,
              damping: 22 / Math.sqrt(speed),
              mass: 0.85,
          }

    function onMove(e: React.PointerEvent<HTMLElement>) {
        if (reduced || e.pointerType !== "mouse") return
        const rect = e.currentTarget.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return
        const nx = (e.clientX - rect.left) / rect.width - 0.5
        const ny = (e.clientY - rect.top) / rect.height - 0.5
        x.set(clamp(nx * magnetStrength * 2, -magnetStrength, magnetStrength))
        y.set(clamp(ny * magnetStrength * 2, -magnetStrength, magnetStrength))
    }

    function reset() {
        setHovered(false)
        x.set(0)
        y.set(0)
    }

    const Surface: any = linked ? motion.a : motion.div

    return (
        <Surface
            className="jelly-card"
            href={linked ? url : undefined}
            target={linked ? "_blank" : undefined}
            rel={linked ? "noopener noreferrer" : undefined}
            aria-label={
                linked
                    ? [item.title, item.cta].filter(Boolean).join(" — ")
                    : undefined
            }
            initial={false}
            animate={{
                y: showHover ? -hoverLift : 0,
                boxShadow: showHover
                    ? "0 17px 28px rgba(17,17,17,0.14)"
                    : "0 3px 5px rgba(17,17,17,0.035)",
            }}
            transition={spring}
            onPointerMove={onMove}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={reset}
            onFocus={() => setHovered(true)}
            onBlur={reset}
            style={{
                position: "relative",
                display: "block",
                isolation: "isolate",
                minWidth: 0,
                minHeight: cardHeight,
                height: "100%",
                background: item.color || "#EDFA67",
                color: textColor,
                borderRadius: radius,
                overflow: "hidden",
                cursor: linked ? "pointer" : "default",
                textDecoration: "none",
                boxSizing: "border-box",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <div
                className="jelly-topline"
                style={{
                    position: "absolute",
                    zIndex: 2,
                    left: 21,
                    top: 21,
                    right: 21,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span
                    className="jelly-eyebrow"
                    style={{
                        fontSize: 10,
                        fontWeight: 720,
                        lineHeight: "1.25em",
                        letterSpacing: "0.07em",
                        whiteSpace: "nowrap",
                    }}
                >
                    {item.eyebrow || String(index + 1).padStart(2, "0")}
                </span>
                {linked && (
                    <motion.span
                        initial={false}
                        animate={{
                            rotate: showHover ? 45 : 0,
                            scale: showHover ? 1.11 : 1,
                        }}
                        transition={spring}
                        aria-hidden="true"
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            display: "grid",
                            placeItems: "center",
                            background: "#191919",
                            color: "#FFFFFF",
                        }}
                    >
                        <ArrowIcon size={14} />
                    </motion.span>
                )}
            </div>

            <div
                className="jelly-art-stage"
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: 47,
                    left: "50%",
                    width: stickerSize,
                    height: stickerSize,
                    transform: "translateX(-50%)",
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            >
                <motion.div
                    initial={false}
                    animate={{
                        rotate: showHover ? (index % 2 === 0 ? 13 : -13) : index % 2 === 0 ? -8 : 8,
                        scale: showHover ? 1.13 : 1,
                        borderRadius: showHover
                            ? "40% 60% 26% 74% / 65% 36% 64% 35%"
                            : "57% 43% 62% 38% / 43% 58% 42% 57%",
                    }}
                    transition={spring}
                    style={{
                        x: springX,
                        y: springY,
                        position: "absolute",
                        inset: 0,
                        background: item.shapeColor || "#FF7354",
                        boxShadow: "inset -7px -9px 0 rgba(0,0,0,0.065)",
                        overflow: "hidden",
                        display: "grid",
                        placeItems: "center",
                        willChange: reduced ? "auto" : "transform",
                    }}
                >
                    <motion.div
                        initial={false}
                        animate={{
                            rotate: showHover ? -22 : 0,
                            scale: showHover ? 0.93 : 1,
                        }}
                        transition={spring}
                        style={{
                            width: "94%",
                            height: "94%",
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        <JellyArtwork
                            shape={item.shape || "orbit"}
                            ink="#191919"
                        />
                    </motion.div>
                </motion.div>
            </div>

            <div
                className="jelly-info"
                style={{
                    position: "absolute",
                    left: 20,
                    right: 20,
                    bottom: 18,
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 8,
                    pointerEvents: "none",
                }}
            >
                <motion.div
                    initial={false}
                    animate={{
                        x: showHover ? 3 : 0,
                    }}
                    transition={spring}
                    className="jelly-title"
                    style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 27,
                        fontWeight: 760,
                        letterSpacing: "-0.055em",
                        lineHeight: 1.03,
                        maxWidth: "100%",
                        minHeight: 56,
                        margin: 0,
                        overflowWrap: "break-word",
                        ...titleFont,
                    }}
                >
                    {item.title}
                </motion.div>
                <p
                    className="jelly-description"
                    style={{
                        margin: 0,
                        fontSize: 12.5,
                        lineHeight: 1.35,
                        fontWeight: 480,
                        letterSpacing: "-0.014em",
                        maxWidth: "100%",
                        opacity: 0.82,
                        ...bodyFont,
                    }}
                >
                    {item.description}
                </p>
                {linked && (
                    <div
                        className="jelly-cta"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            minHeight: 30,
                            maxWidth: "100%",
                            borderRadius: 100,
                            marginTop: 5,
                            padding: "7px 11px 7px 13px",
                            background: pillColor,
                            color: pillText,
                            fontSize: 11,
                            lineHeight: "1.1em",
                            fontWeight: 700,
                            letterSpacing: "-0.015em",
                            ...buttonFont,
                        }}
                    >
                        <span>{item.cta || "Explore"}</span>
                        <motion.span
                            initial={false}
                            animate={{ x: showHover ? 3 : 0, y: showHover ? -3 : 0 }}
                            transition={spring}
                        >
                            <ArrowIcon size={12} />
                        </motion.span>
                    </div>
                )}
            </div>
        </Surface>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 940
 * @framerIntrinsicHeight 378
 */
export default function JellyLinkNavigation(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        cardHeight = 356,
        gap = 12,
        radius = 27,
        padding = 12,
        stickerSize = 147,
        hoverLift = 10,
        magnetStrength = 15,
        motionSpeed = 1,
        background = "#FAFAF7",
        textColor = "#161616",
        pillColor = "#161616",
        pillText = "#FFFFFF",
        titleFont,
        bodyFont,
        buttonFont,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const reduced = isStatic || Boolean(prefersReducedMotion)
    const list = Array.isArray(items) && items.length ? items : DEFAULT_ITEMS
    const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const scope = '[data-jelly-links="' + uid + '"]'

    return (
        <nav
            aria-label="Quick links"
            data-jelly-links={uid}
            style={{
                width: "100%",
                minWidth: 0,
                height: "auto",
                background,
                boxSizing: "border-box",
                padding,
                fontFamily: "Inter, sans-serif",
                color: textColor,
                ...({ containerType: "inline-size" } as React.CSSProperties),
                ...style,
            }}
        >
            <style>{[
                scope + " * { box-sizing:border-box; }",
                scope + " .jelly-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:stretch; }",
                scope + " .jelly-card { outline:none; }",
                scope + " .jelly-card:focus-visible { outline:3px solid #171717;outline-offset:4px; }",
                scope + " .jelly-cta span {white-space:normal;}",
                "@container (max-width: 780px) {",
                scope + " .jelly-grid {grid-template-columns:repeat(2,minmax(0,1fr));}",
                scope + " .jelly-card {min-height:326px !important;}",
                scope + " .jelly-art-stage {top:43px !important;}",
                "}",
                "@container (max-width: 500px) {",
                scope + " .jelly-card {min-height:306px !important;}",
                scope + " .jelly-art-stage {width:116px !important;height:116px !important;top:41px !important;}",
                scope + " .jelly-topline {left:15px !important;right:15px !important;top:15px !important;}",
                scope + " .jelly-info {left:15px !important;right:15px !important;bottom:14px !important;gap:7px !important;}",
                scope + " .jelly-title {font-size:23px !important;letter-spacing:-.055em !important;}",
                scope + " .jelly-description {font-size:11.8px !important;}",
                scope + " .jelly-cta {font-size:10px !important;padding:7px 9px 7px 11px !important;}",
                scope + " .jelly-eyebrow {font-size:9px !important;}",
                "}",
                "@container (max-width: 330px) {",
                scope + " .jelly-grid {grid-template-columns:repeat(1,minmax(0,1fr));}",
                scope + " .jelly-card {min-height:258px !important;}",
                scope + " .jelly-art-stage {left:auto !important;right:24px !important;top:48px !important;transform:none !important;}",
                scope + " .jelly-title {font-size:25px !important;max-width:62% !important;}",
                scope + " .jelly-description {max-width:69% !important;}",
                "}",
                "@media (prefers-reduced-motion: reduce) {",
                scope + " * {scroll-behavior:auto !important;}",
                "}",
            ].join("\n")}</style>
            <div
                className="jelly-grid"
                style={{
                    width: "100%",
                    gap: Math.max(0, gap),
                }}
            >
                {list.map((item, index) => (
                    <JellyTile
                        key={index}
                        item={item}
                        index={index}
                        cardHeight={Math.max(240, cardHeight)}
                        radius={Math.max(8, radius)}
                        stickerSize={Math.max(60, stickerSize)}
                        hoverLift={Math.max(0, hoverLift)}
                        magnetStrength={Math.max(0, magnetStrength)}
                        motionSpeed={motionSpeed}
                        textColor={textColor}
                        pillColor={pillColor}
                        pillText={pillText}
                        titleFont={titleFont}
                        bodyFont={bodyFont}
                        buttonFont={buttonFont}
                        reduced={reduced}
                    />
                ))}
            </div>
        </nav>
    )
}

addPropertyControls(JellyLinkNavigation, {
    items: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 8,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                eyebrow: { type: ControlType.String, title: "Eyebrow" },
                title: { type: ControlType.String, title: "Title" },
                description: { type: ControlType.String, title: "Description", displayTextArea: true },
                cta: { type: ControlType.String, title: "CTA", defaultValue: "Explore" },
                link: { type: ControlType.Link, title: "URL", defaultValue: "" },
                color: { type: ControlType.Color, title: "Card Color" },
                shapeColor: { type: ControlType.Color, title: "Shape Color" },
                shape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: ["orbit", "spark", "loops", "waves"],
                    optionTitles: ["Orbit", "Spark", "Loops", "Waves"],
                },
            },
        },
    },
    cardHeight: { type: ControlType.Number, title: "Card Height", min: 240, max: 500, step: 2, defaultValue: 356 },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 32, step: 1, defaultValue: 12 },
    radius: { type: ControlType.Number, title: "Corners", min: 8, max: 60, step: 1, defaultValue: 27 },
    padding: { type: ControlType.Number, title: "Padding", min: 0, max: 60, step: 2, defaultValue: 12 },
    stickerSize: { type: ControlType.Number, title: "Shape Size", min: 60, max: 220, step: 2, defaultValue: 147 },
    hoverLift: { type: ControlType.Number, title: "Hover Lift", min: 0, max: 26, step: 1, defaultValue: 10 },
    magnetStrength: { type: ControlType.Number, title: "Magnet", min: 0, max: 36, step: 1, defaultValue: 15 },
    motionSpeed: { type: ControlType.Number, title: "Motion Speed", min: 0.5, max: 2, step: 0.1, defaultValue: 1 },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FAFAF7" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#161616" },
    pillColor: { type: ControlType.Color, title: "CTA Fill", defaultValue: "#161616" },
    pillText: { type: ControlType.Color, title: "CTA Text", defaultValue: "#FFFFFF" },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 27, variant: "Bold", lineHeight: "1.03em", letterSpacing: "-0.055em" } },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 12.5, variant: "Regular", lineHeight: "1.35em" } },
    buttonFont: { type: ControlType.Font, title: "CTA Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 11, variant: "Bold", lineHeight: "1.1em" } },
})
