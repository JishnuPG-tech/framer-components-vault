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
import { useEffect, useRef, useState } from "react"

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 360
 * @framerDisableUnlink
 */

type MaskShape =
    | "circle"
    | "squircle"
    | "arch"
    | "hexagon"
    | "flower"
    | "blob"
    | "diamond"

const SHAPES: MaskShape[] = [
    "circle",
    "squircle",
    "arch",
    "hexagon",
    "flower",
    "blob",
    "diamond",
]

const SHAPE_TITLES = [
    "Circle",
    "Squircle",
    "Arch",
    "Hexagon",
    "Flower",
    "Blob",
    "Diamond",
]

const INSIDE: Record<MaskShape, (x: number, y: number) => boolean> = {
    circle: (x, y) => x * x + y * y <= 0.25,
    squircle: (x, y) =>
        Math.pow(Math.abs(x) / 0.5, 4) + Math.pow(Math.abs(y) / 0.5, 4) <= 1,
    arch: (x, y) =>
        Math.abs(x) <= 0.42 &&
        y <= 0.5 &&
        (y >= -0.08 || x * x + (y + 0.08) * (y + 0.08) <= 0.42 * 0.42),
    hexagon: (x, y) => {
        const ax = Math.abs(x)
        const ay = Math.abs(y)
        return ay <= 0.433 && ax * 0.866 + ay * 0.5 <= 0.433
    },
    // 6 circular petals + center disk so every tip is a full radius, not a pointed rose tip.
    flower: (x, y) => {
        const petalR = 0.215
        const orbit = 0.5 - petalR
        if (x * x + y * y <= 0.2 * 0.2) return true
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2
            const cx = Math.cos(a) * orbit
            const cy = Math.sin(a) * orbit
            const dx = x - cx
            const dy = y - cy
            if (dx * dx + dy * dy <= petalR * petalR) return true
        }
        return false
    },
    blob: (x, y) => {
        const r = Math.hypot(x, y)
        const a = Math.atan2(y, x)
        return (
            r <=
            0.42 + 0.05 * Math.sin(3 * a + 1) + 0.035 * Math.cos(5 * a - 0.6)
        )
    },
    diamond: (x, y) => Math.abs(x) + Math.abs(y) <= 0.5,
}

const POINTS = 96
const CACHE = new Map<MaskShape, string>()

function polygonFor(shape: MaskShape): string {
    const inside = INSIDE[shape]
    const pts: string[] = []
    for (let i = 0; i < POINTS; i++) {
        const a = (i / POINTS) * Math.PI * 2 - Math.PI / 2
        const dx = Math.cos(a)
        const dy = Math.sin(a)
        let lo = 0
        let hi = 0.75
        for (let k = 0; k < 24; k++) {
            const mid = (lo + hi) / 2
            if (inside(dx * mid, dy * mid)) lo = mid
            else hi = mid
        }
        pts.push(
            `${(50 + dx * lo * 100).toFixed(3)}% ${(50 + dy * lo * 100).toFixed(3)}%`
        )
    }
    return `polygon(${pts.join(", ")})`
}

function shapePath(s: MaskShape): string {
    const cached = CACHE.get(s)
    if (cached) return cached
    const path = polygonFor(s)
    CACHE.set(s, path)
    return path
}

const collapsed = `polygon(${Array.from({ length: POINTS }, () => "50% 50%").join(", ")})`

interface ImageShapeMaskProps {
    image?: string
    alt?: string
    caption?: string
    title?: string
    shape?: MaskShape
    hoverShape?: MaskShape
    animateIn?: boolean
    zoom?: boolean
    zoomAmount?: number
    demoUI?: boolean
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

export default function ImageShapeMask(props: ImageShapeMaskProps) {
    const {
        image = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=80",
        alt = "Portrait photograph",
        caption = "",
        title = "",
        shape: shapeProp = "blob",
        hoverShape: hoverShapeProp = "circle",
        animateIn = true,
        zoom: zoomProp = true,
        zoomAmount = 1.08,
        demoUI = false,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduceMotion = Boolean(useReducedMotion())
    const freeze = isStatic || reduceMotion

    const rootRef = useRef<HTMLDivElement>(null)
    const maskRef = useRef<HTMLDivElement>(null)
    const isVisibleRef = useViewportVisible(rootRef, isStatic)

    const inView = useInView(maskRef, { once: true, amount: 0.3 })

    const [shape, setShape] = useState<MaskShape>(shapeProp)
    const [hoverShape, setHoverShape] = useState<MaskShape>(hoverShapeProp)
    const [zoom, setZoom] = useState(zoomProp)
    const [hover, setHover] = useState(false)

    useEffect(() => {
        setShape(shapeProp)
    }, [shapeProp])

    useEffect(() => {
        setHoverShape(hoverShapeProp)
    }, [hoverShapeProp])

    useEffect(() => {
        setZoom(zoomProp)
    }, [zoomProp])

    const activeShape = demoUI ? shape : shapeProp
    const activeHover = demoUI ? hoverShape : hoverShapeProp
    const activeZoom = demoUI ? zoom : zoomProp

    const shown = freeze || !animateIn || inView
    const liveHover = !freeze && hover && isVisibleRef.current
    const clip = !shown
        ? collapsed
        : shapePath(liveHover ? activeHover : activeShape)

    const clipTransition = isStatic
        ? { duration: 0 }
        : freeze
          ? { duration: 0 }
          : { type: "spring" as const, stiffness: 140, damping: 20, mass: 0.9 }

    const zoomTransition = isStatic
        ? { duration: 0 }
        : { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }

    const schema = {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        contentUrl: image,
        url: image,
        name: title || alt,
        description: alt,
        caption: caption || alt,
        representativeOfPage: false,
    }

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: demoUI ? "center" : "stretch",
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

            <figure
                style={{
                    margin: 0,
                    width: demoUI ? "min(100%, 380px)" : "100%",
                    height: demoUI
                        ? "min(100%, 380px)"
                        : caption
                          ? "auto"
                          : "100%",
                    flex: demoUI ? "0 0 auto" : 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    minHeight: 0,
                }}
            >
                <motion.div
                    ref={maskRef}
                    role="img"
                    aria-label={alt}
                    tabIndex={0}
                    title={title || alt}
                    onHoverStart={() => {
                        if (isStatic || !isVisibleRef.current) return
                        setHover(true)
                    }}
                    onHoverEnd={() => setHover(false)}
                    onFocus={() => {
                        if (isStatic) return
                        setHover(true)
                    }}
                    onBlur={() => setHover(false)}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: caption ? undefined : "100%",
                        aspectRatio: demoUI || caption ? "1 / 1" : undefined,
                        flex: caption ? undefined : 1,
                        outline: "none",
                        boxShadow: "none",
                    }}
                    whileFocus={
                        isStatic
                            ? undefined
                            : {
                                  outline: "2px solid #fff",
                                  outlineOffset: 4,
                              }
                    }
                >
                    <motion.div
                        initial={false}
                        animate={{ clipPath: clip }}
                        transition={isStatic ? { duration: 0 } : clipTransition}
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                            clipPath:
                                animateIn && !freeze
                                    ? collapsed
                                    : shapePath(activeShape),
                        }}
                    >
                        <motion.img
                            src={image}
                            alt={alt}
                            title={title || alt}
                            width={1200}
                            height={1200}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            initial={false}
                            animate={{
                                scale:
                                    !isStatic && activeZoom && liveHover
                                        ? zoomAmount
                                        : 1,
                            }}
                            transition={
                                isStatic ? { duration: 0 } : zoomTransition
                            }
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                transition: isStatic ? "none" : undefined,
                            }}
                        />
                    </motion.div>
                </motion.div>

                {caption ? (
                    <figcaption
                        style={{
                            marginTop: 10,
                            fontFamily:
                                "Inter, system-ui, -apple-system, sans-serif",
                            fontSize: 13,
                            lineHeight: 1.4,
                            color: "rgba(255,255,255,0.62)",
                            textAlign: "center",
                        }}
                    >
                        {caption}
                    </figcaption>
                ) : null}
            </figure>

            {demoUI ? (
                <div
                    role="toolbar"
                    aria-label="Image shape controls"
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
                        gap: 16,
                    }}
                >
                    <PillGroup
                        label="Shape"
                        value={shape}
                        onChange={setShape}
                        layoutId="shape"
                        isStatic={isStatic}
                    />
                    <PillGroup
                        label="On hover"
                        value={hoverShape}
                        onChange={setHoverShape}
                        layoutId="hover"
                        isStatic={isStatic}
                    />
                    <ZoomToggle
                        value={zoom}
                        onChange={setZoom}
                        isStatic={isStatic}
                    />
                </div>
            ) : null}
        </div>
    )
}

function PillGroup({
    label,
    value,
    onChange,
    layoutId,
    isStatic,
}: {
    label: string
    value: MaskShape
    onChange: (s: MaskShape) => void
    layoutId: string
    isStatic: boolean
}) {
    return (
        <div
            role="radiogroup"
            aria-label={label}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
            <span
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
                {label}
            </span>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 2,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                    padding: 4,
                }}
            >
                {SHAPES.map((s) => {
                    const active = s === value
                    return (
                        <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={`${label} ${s}`}
                            onClick={() => onChange(s)}
                            style={{
                                position: "relative",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                borderRadius: 999,
                                padding: "6px 12px",
                                fontSize: 12,
                                textTransform: "capitalize",
                                color: active
                                    ? "#111"
                                    : "rgba(255,255,255,0.45)",
                                fontFamily:
                                    "Inter, system-ui, -apple-system, sans-serif",
                            }}
                        >
                            {active ? (
                                <motion.span
                                    layoutId={
                                        isStatic
                                            ? undefined
                                            : `pill-${layoutId}`
                                    }
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: 999,
                                        background: "#fff",
                                        transition: isStatic
                                            ? "none"
                                            : undefined,
                                    }}
                                    transition={
                                        isStatic
                                            ? { duration: 0 }
                                            : {
                                                  type: "spring",
                                                  stiffness: 420,
                                                  damping: 32,
                                              }
                                    }
                                />
                            ) : null}
                            <span
                                style={{
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            >
                                {s}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function ZoomToggle({
    value,
    onChange,
    isStatic,
}: {
    value: boolean
    onChange: (v: boolean) => void
    isStatic: boolean
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
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
                    padding: "0 4px",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                }}
            >
                Zoom image
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={value}
                aria-label="Zoom image on hover"
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
                            : { type: "spring", stiffness: 500, damping: 32 }
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

addPropertyControls(ImageShapeMask, {
    image: {
        type: ControlType.Image,
        title: "Image",
        description: "Photo shown inside the morphing mask.",
    },
    alt: {
        type: ControlType.String,
        title: "Alt text",
        defaultValue: "Portrait photograph",
        displayTextArea: true,
        description:
            "Describe the image for screen readers and search engines.",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "",
        description:
            "Optional image title used in tooltip and structured data.",
    },
    caption: {
        type: ControlType.String,
        title: "Caption",
        defaultValue: "",
        displayTextArea: true,
        description: "Visible caption under the image (figcaption).",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: SHAPES,
        optionTitles: SHAPE_TITLES,
        defaultValue: "blob",
        displaySegmentedControl: true,
        description: "Default clip-path mask.",
    },
    hoverShape: {
        type: ControlType.Enum,
        title: "On Hover",
        options: SHAPES,
        optionTitles: SHAPE_TITLES,
        defaultValue: "circle",
        displaySegmentedControl: true,
        description: "Mask shape on hover and keyboard focus.",
    },
    animateIn: {
        type: ControlType.Boolean,
        title: "Animate In",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Grow the mask from the center when it enters view.",
    },
    zoom: {
        type: ControlType.Boolean,
        title: "Zoom Image",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Slow zoom of the photo inside the mask on hover.",
    },
    zoomAmount: {
        type: ControlType.Number,
        title: "Zoom Amount",
        defaultValue: 1.08,
        min: 1,
        max: 1.4,
        step: 0.02,
        hidden: (props: ImageShapeMaskProps) => !props.zoom,
    },
    demoUI: {
        type: ControlType.Boolean,
        title: "Demo UI",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "On-canvas control bar for Shape, On Hover, and Zoom. Turn off before publish.",
    },
})
