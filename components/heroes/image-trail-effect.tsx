// Inspired by Codrops (https://tympanus.net/codrops)
// Original concept: Image Trail Effects (https://tympanus.net/Development/ImageTrailEffects/)
// Licensed under MIT: https://opensource.org/licenses/MIT
// Copyright (c) Codrops

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
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
import { AnimatePresence, motion } from "framer-motion"

interface TrailImage {
    // From the Array control, `src` is a ResponsiveImage object; in the static
    // defaults it is a plain URL string. resolveSrc() normalizes both.
    src: any
    alt?: string
}

function resolveSrc(src: any): string {
    if (!src) return ""
    if (typeof src === "string") return src
    return src.src || ""
}

type ExitStyle =
    | "fade"
    | "zoom"
    | "shrink"
    | "drift"
    | "spin"
    | "fall"
    | "blur"
    | "flip"

interface ImageTrailEffectProps {
    images: TrailImage[]
    itemWidth: number
    aspectRatio: number
    radius: number
    threshold: number
    duration: number
    exitStyle: ExitStyle
    driftStrength: number
    maxRotation: number
    background: string
    cursorType: "default" | "none" | "crosshair" | "pointer" | "custom"
    customCursor: any
    cursorSize: number
    showHint: boolean
    hintText: string
    hintColor: string
    hintFont: any
    style?: CSSProperties
}

/**
 * Image Trail Effect
 *
 * Spawns a trail of images that follow the cursor as it moves across the area.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageTrailEffect(props: ImageTrailEffectProps) {
    const {
        images,
        itemWidth = 190,
        aspectRatio = 1.25,
        radius = 16,
        threshold = 70,
        duration = 0.9,
        exitStyle = "drift",
        driftStrength = 90,
        maxRotation = 10,
        background = "#0b0b0f",
        cursorType = "crosshair",
        customCursor,
        cursorSize = 32,
        showHint = true,
        hintText = "Move your cursor",
        hintColor = "rgba(255,255,255,0.55)",
        hintFont,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Treat the Framer canvas the same as static rendering: framer-motion can
    // still animate on the canvas, so disable both pointer-driven spawning and
    // the animated trail items there — only the static preview should show.
    const disabled = isStatic || isCanvas

    // Track pending removal timers so they can be cleared on unmount. Each
    // animated item schedules its own removal; without this, fast unmounts would
    // leave orphaned timers firing setState on a gone component.
    const timeoutsRef = useRef<number[]>([])
    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach((t) => window.clearTimeout(t))
            timeoutsRef.current = []
        }
    }, [])

    // Normalize the image array into plain URL strings. ResponsiveImage controls
    // don't honor `defaultValue`, so empty slots fall back to the stock gradients
    // (otherwise the trail would render blank until the user picks images).
    const pool = useMemo<{ src: string; alt?: string }[]>(() => {
        const src = images && images.length > 0 ? images : []
        const resolved = src.map((img, i) => {
            const url = resolveSrc(img?.src)
            const fallback = defaultImages[i % defaultImages.length]
            return {
                src: url || fallback.src,
                alt: img?.alt || fallback.alt,
            }
        })
        return resolved.length > 0 ? resolved : defaultImages
    }, [images])

    // Resolve the cursor CSS value. Custom uses a uploaded image hotspot-centered.
    const cursorValue = useMemo(() => {
        if (cursorType === "custom") {
            const url = resolveSrc(customCursor)
            if (url) {
                const half = cursorSize / 2
                return `url("${url}") ${half} ${half}, auto`
            }
            return "auto"
        }
        return cursorType
    }, [cursorType, customCursor, cursorSize])

    // Transient trail items currently mounted.
    const [items, setItems] = useState<
        {
            id: number
            src: string
            alt?: string
            x: number
            y: number
            rot: number
            dx: number
            dy: number
        }[]
    >([])
    const [hovered, setHovered] = useState(false)

    // Mutable refs so the pointer handler never rebuilds.
    const idRef = useRef(0)
    const imgIndexRef = useRef(0)
    const lastSpawnRef = useRef<{ x: number; y: number } | null>(null)
    const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null)
    const poolRef = useRef(pool)
    poolRef.current = pool

    const spawn = useCallback(
        (clientX: number, clientY: number) => {
            const el = containerRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const x = clientX - rect.left
            const y = clientY - rect.top

            const last = lastSpawnRef.current
            const dist = last ? Math.hypot(x - last.x, y - last.y) : Infinity
            if (dist < threshold) return

            // Velocity for direction-aware drift + rotation.
            const now = performance.now()
            const prevMove = lastMoveRef.current
            let vx = 0
            let vy = 0
            if (prevMove) {
                const dt = Math.max(now - prevMove.t, 1)
                vx = (x - prevMove.x) / dt
                vy = (y - prevMove.y) / dt
            }
            lastMoveRef.current = { x, y, t: now }
            lastSpawnRef.current = { x, y }

            const speed = Math.hypot(vx, vy)
            const dirX = speed > 0 ? vx / speed : 0
            const dirY = speed > 0 ? vy / speed : 0

            const live = poolRef.current
            const img = live[imgIndexRef.current % live.length]
            imgIndexRef.current += 1

            const id = idRef.current++
            const rot = (Math.random() * 2 - 1) * maxRotation

            startTransition(() =>
                setItems((prev) => {
                    const next = [
                        ...prev,
                        {
                            id,
                            src: img.src,
                            alt: img.alt,
                            x,
                            y,
                            rot,
                            dx: dirX * driftStrength,
                            dy: dirY * driftStrength,
                        },
                    ]
                    // Cap the live pool so fast flicks never flood the DOM.
                    return next.length > 40
                        ? next.slice(next.length - 40)
                        : next
                })
            )
        },
        [threshold, driftStrength, maxRotation]
    )

    const remove = useCallback((id: number) => {
        startTransition(() =>
            setItems((prev) => prev.filter((it) => it.id !== id))
        )
    }, [])

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            spawn(e.clientX, e.clientY)
        },
        [spawn]
    )

    // Canvas / static preview: lay out a few sample cards along a curve so the
    // component reads correctly without interaction.
    const previewItems = disabled
        ? pool.slice(0, 5).map((img, i) => {
              const t = i / 4
              return {
                  id: -1 - i,
                  src: img.src,
                  alt: img.alt,
                  x: 120 + t * 520,
                  y: 320 - Math.sin(t * Math.PI) * 180,
                  rot: (t - 0.5) * 2 * maxRotation,
                  dx: 0,
                  dy: 0,
                  opacity: 0.35 + t * 0.65,
              }
          })
        : []

    const itemHeight = itemWidth * aspectRatio

    const renderCard = (
        it: {
            id: number
            src: string
            alt?: string
            x: number
            y: number
            rot: number
            dx: number
            dy: number
            opacity?: number
        },
        animated: boolean
    ) => {
        const base: CSSProperties = {
            position: "absolute",
            top: 0,
            left: 0,
            width: itemWidth,
            height: itemHeight,
            marginLeft: -itemWidth / 2,
            marginTop: -itemHeight / 2,
            borderRadius: radius,
            overflow: "hidden",
            pointerEvents: "none",
            willChange: "transform, opacity, filter",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }

        const img = (
            <img
                src={it.src}
                alt={it.alt || ""}
                draggable={false}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
            />
        )

        if (!animated) {
            return (
                <div
                    key={it.id}
                    style={{
                        ...base,
                        transform: `translate(${it.x}px, ${it.y}px) rotate(${it.rot}deg)`,
                        opacity: it.opacity ?? 1,
                    }}
                >
                    {img}
                </div>
            )
        }

        // Each exit style is a target keyframe set merged over the resting pose.
        const exitMap: Record<ExitStyle, Record<string, any>> = {
            fade: { opacity: 0 },
            zoom: { opacity: 0, scale: 1.5 },
            shrink: { opacity: 0, scale: 0.2 },
            drift: { opacity: 0, scale: 0.9, x: it.x + it.dx, y: it.y + it.dy },
            spin: { opacity: 0, scale: 0.4, rotate: it.rot + 180 },
            fall: { opacity: 0, y: it.y + 160, rotate: it.rot + 25 },
            blur: { opacity: 0, scale: 1.1, filter: "blur(14px)" },
            flip: { opacity: 0, rotateY: 90, scale: 0.85 },
        }

        const is3D = exitStyle === "flip"

        return (
            <motion.div
                key={it.id}
                style={{
                    ...base,
                    ...(is3D ? { transformPerspective: 600 } : null),
                }}
                initial={{
                    opacity: 0,
                    scale: 0.55,
                    x: it.x,
                    y: it.y,
                    rotate: it.rot,
                    filter: exitStyle === "blur" ? "blur(0px)" : undefined,
                }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    x: it.x,
                    y: it.y,
                    rotate: it.rot,
                    rotateY: 0,
                    filter: exitStyle === "blur" ? "blur(0px)" : undefined,
                }}
                exit={{ rotate: it.rot, ...exitMap[exitStyle] }}
                transition={{
                    opacity: { duration: duration * 0.5 },
                    filter: { duration: duration * 0.6 },
                    default: {
                        type: "spring",
                        stiffness: 220,
                        damping: 26,
                    },
                }}
                onAnimationComplete={() => {
                    // Schedule removal once it has settled in. Track the timer so
                    // the unmount cleanup can clear any still-pending removals.
                    const t = window.setTimeout(() => {
                        timeoutsRef.current = timeoutsRef.current.filter(
                            (id) => id !== t
                        )
                        remove(it.id)
                    }, duration * 1000)
                    timeoutsRef.current.push(t)
                }}
            >
                {img}
            </motion.div>
        )
    }

    const isFixedWidth = props?.style?.width === "100%"

    return (
        <div
            ref={containerRef}
            onPointerMove={disabled ? undefined : handlePointerMove}
            onPointerEnter={() => startTransition(() => setHovered(true))}
            onPointerLeave={() => startTransition(() => setHovered(false))}
            style={{
                ...props.style,
                position: "relative",
                overflow: "hidden",
                background,
                borderRadius: radius,
                cursor: cursorValue,
                ...(isFixedWidth ? {} : { width: 800, height: 500 }),
                touchAction: "none",
            }}
        >
            {previewItems.map((it) => renderCard(it, false))}

            <AnimatePresence>
                {!disabled && items.map((it) => renderCard(it, true))}
            </AnimatePresence>

            {showHint && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        opacity: hovered && !isStatic ? 0 : 1,
                        transition: "opacity 0.4s ease",
                        color: hintColor,
                        ...hintFont,
                    }}
                >
                    {hintText}
                </div>
            )}
        </div>
    )
}

const defaultImages: { src: string; alt?: string }[] = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1 - Blue",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 2 - Purple",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3 - Orange",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5 - Green",
    },
]

addPropertyControls(ImageTrailEffect, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },
            },
        },
        // ResponsiveImage ignores defaultValue, so these seed empty slots; the
        // component fills any blank src with the matching stock gradient.
        defaultValue: [{}, {}, {}, {}, {}] as any,
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Item Width",
        defaultValue: 190,
        min: 60,
        max: 400,
        unit: "px",
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Aspect",
        defaultValue: 1.25,
        min: 0.5,
        max: 2,
        step: 0.05,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 80,
        unit: "px",
    },
    threshold: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 70,
        min: 10,
        max: 240,
        unit: "px",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.9,
        min: 0.2,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    exitStyle: {
        type: ControlType.Enum,
        title: "Exit",
        defaultValue: "drift",
        options: [
            "fade",
            "zoom",
            "shrink",
            "drift",
            "spin",
            "fall",
            "blur",
            "flip",
        ],
        optionTitles: [
            "Fade",
            "Zoom",
            "Shrink",
            "Drift",
            "Spin",
            "Fall",
            "Blur",
            "Flip",
        ],
    },
    driftStrength: {
        type: ControlType.Number,
        title: "Drift",
        defaultValue: 90,
        min: 0,
        max: 300,
        unit: "px",
        hidden: ({ exitStyle }) => exitStyle !== "drift",
    },
    maxRotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 10,
        min: 0,
        max: 45,
        unit: "deg",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0b0b0f",
    },
    cursorType: {
        type: ControlType.Enum,
        title: "Cursor",
        defaultValue: "crosshair",
        options: ["default", "none", "crosshair", "pointer", "custom"],
        optionTitles: ["Default", "Hidden", "Crosshair", "Pointer", "Custom"],
    },
    customCursor: {
        type: ControlType.ResponsiveImage,
        title: "Cursor Image",
        hidden: ({ cursorType }) => cursorType !== "custom",
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 32,
        min: 8,
        max: 128,
        unit: "px",
        hidden: ({ cursorType }) => cursorType !== "custom",
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Hint",
        defaultValue: true,
    },
    hintText: {
        type: ControlType.String,
        title: "Hint Text",
        defaultValue: "Move your cursor",
        hidden: ({ showHint }) => !showHint,
    },
    hintColor: {
        type: ControlType.Color,
        title: "Hint Color",
        defaultValue: "rgba(255,255,255,0.55)",
        hidden: ({ showHint }) => !showHint,
    },
    hintFont: {
        type: ControlType.Font,
        title: "Hint Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Medium",
            fontSize: "18px",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        hidden: ({ showHint }) => !showHint,
    },
})
