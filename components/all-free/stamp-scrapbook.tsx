import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react"
import { createPortal } from "react-dom"
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
    AnimatePresence,
    motion,
    useAnimationFrame,
    useInView,
    useMotionValue,
    useReducedMotion,
    useTransform,
    type MotionValue,
} from "framer-motion"

interface StampImage {
    src: string
    srcSet?: string
    alt?: string
}

interface Stamp {
    image?: StampImage
    title?: string
    caption?: string
    description?: string
}

interface StampScrapbookProps {
    stamps?: Stamp[]
    stampHeight?: number
    spread?: number
    tilt?: number
    autoRotate?: boolean
    speed?: number
    cursorSteer?: boolean
    hoverSpeed?: number
    scrollTilt?: boolean
    scrollTiltStrength?: number
    stampShadow?: boolean
    panelColor?: string
    backdropColor?: string
    titleColor?: string
    textColor?: string
    accentColor?: string
    sealUrl?: string
    sealMonogram?: string
    titleFont?: CSSProperties
    captionFont?: CSSProperties
    bodyFont?: CSSProperties
    messageFont?: CSSProperties
    style?: CSSProperties
}

const FALLBACK_STAMPS: Required<Pick<Stamp, "image" | "title" | "caption" | "description">>[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/rah9krKNzgJYwNBPXKg3l4nYpOQ.webp",
            alt: "Vintage postage stamp of a railway terminus station",
        },
        title: "The Terminus",
        caption: "Amsterdam · 1924",
        description: "Under the great iron vault of Centraal, where every adventure in this book began.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/q1J777u9lVCmKnqrK3bmGjP6QI.webp",
            alt: "Vintage postage stamp of stacked bicycles in Amsterdam",
        },
        title: "Bicycles",
        caption: "Amsterdam · 1974",
        description:
            "Every railing on the Prinsengracht wears a crown of handlebars. I counted forty bikes before giving up and buying one of my own.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/MoFCkLAnxIh5Vwz6OckkPNOR48.webp",
            alt: "Vintage postage stamp of a red bicycle",
        },
        title: "The Red Velo",
        caption: "Amsterdam · 1974",
        description: "My red bicycle, briefly the fastest thing on the Herengracht.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/tveyjEWtoLiyAFVqmZ0uWCtotE.webp",
            alt: "Vintage postage stamp of a brown café facade",
        },
        title: "Café Heritage",
        caption: "Amsterdam · 1974",
        description:
            "The brown café on the corner where the barman knew my order by day three. Condensation on the glass, cards on the table.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/Wt1oJghFBc08KwbF6mMq9xF4E.webp",
            alt: "Vintage postage stamp of a café booth interior",
        },
        title: "The Booth",
        caption: "Amsterdam · 1974",
        description: "Our corner booth. Leather worn soft, coffee rings on the table, and nowhere else to be.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/E0762tXcs7kMN6spT6EUhTHdI.webp",
            alt: "Vintage postage stamp of a canal walk at sunset",
        },
        title: "City Walk",
        caption: "Amsterdam · 1974",
        description: "Golden hour along the canal ring. The gables lean like old friends sharing a secret.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/KWntrX2PSJhIUe6eIbAeEtJTO30.webp",
            alt: "Vintage postage stamp of Amsterdam facades",
        },
        title: "Facades",
        caption: "Amsterdam · 1978",
        description:
            "Counting hoist beams and crooked window frames. Four hundred years of houses standing shoulder to shoulder.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/RqepdwcRvO2tdLtflEvQh80HSH0.webp",
            alt: "Vintage postage stamp of a botanical garden",
        },
        title: "Carefree",
        caption: "Amsterdam · 1974",
        description:
            "Sun on my face, a tulip in hand, and not a single plan for the day.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/DvuBw3HnxEVQe2pZOBUR3FucNhg.webp",
            alt: "Vintage postage stamp of a Delft ceramic cow",
        },
        title: "Delft Bovine",
        caption: "Delft · 1892",
        description: "A blue-and-white ceramic cow from the market stall — the oldest treasure in this collection.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/riU79NitRfVzCflkw1yWoiP2zww.webp",
            alt: "Vintage postage stamp of a Dutch windmill",
        },
        title: "The Windmill",
        caption: "Rotterdam · 1955",
        description: "Sails turning slow against a pewter sky. Some machines are patient.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/FvbllamB85csQxoenDGhwOg0Y.webp",
            alt: "Vintage postage stamp of a fishing vessel",
        },
        title: "The Fleet",
        caption: "The Port · 1955",
        description: "Diesel, salt, and gulls arguing over the morning catch.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/lLP2szrprxISJg1YiEhXL0IB0Y.webp",
            alt: "Vintage postage stamp of golden fries in a paper cone",
        },
        title: "Golden Fries",
        caption: "Street Food · 1978",
        description: "Paper cone, too much mayonnaise, absolutely no regrets.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/mTf6zMaRl92NQ8wk2t0BN9Ov004.webp",
            alt: "Vintage postage stamp of a New York fire escape",
        },
        title: "Fire Escape",
        caption: "New York · 1982",
        description:
            "Steel zig-zags over the sidewalk heat. The city stacked its balconies like ladders to the sky.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/7m7du4CGgAaVGS6HPiDavHcoo.webp",
            alt: "Vintage postage stamp of a steel lattice bridge",
        },
        title: "The Lattice Bridge",
        caption: "The River · 1934",
        description: "Ten thousand rivets holding the crossing together, each one hammered by hand.",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/8XKgeinvRua8zTkzs4QThRhFs.webp",
            alt: "Vintage postage stamp of an ornate manhole cover",
        },
        title: "Underfoot",
        caption: "The Street · 1954",
        description: "Even the street lids here are cast like medallions. Look down once in a while.",
    },
]

const STAMP_ASPECT = 2 / 3

// Postcard swipe: the open card slides in from one side and the outgoing card
// glides off the other — like dealing physical postcards. `dir` is the nav
// direction (1 = next → new arrives from the right; -1 = prev → from the left).
const POSTCARD_VARIANTS = {
    // dir 0 = open/close → one clean half-turn: the stamp flips over and scales
    // forward. dir ±1 = prev/next → the postcards slide sideways like dealing cards.
    enter: (dir: number) =>
        dir === 0
            ? { rotateY: 180, scale: 0.5, opacity: 0, x: 0, rotate: 0 }
            : { x: dir > 0 ? 460 : -460, opacity: 0, rotate: dir > 0 ? 4 : -4, rotateY: 0, scale: 1 },
    center: { x: 0, rotateY: 0, scale: 1, opacity: 1, rotate: 0 },
    exit: (dir: number) =>
        dir === 0
            ? { rotateY: 180, scale: 0.5, opacity: 0, x: 0, rotate: 0 }
            : { x: dir > 0 ? -460 : 460, opacity: 0, rotate: dir > 0 ? -4 : 4, rotateY: 0, scale: 1 },
}

function ringRadius(count: number, stampWidth: number, spread: number): number {
    if (count < 3) return stampWidth * 0.75 * spread
    return (stampWidth / (2 * Math.tan(Math.PI / count))) * 1.18 * spread
}

// Faint ruled "writing area" lines behind the handwritten message, at a fixed
// line pitch so the script sits on the rules like a real postcard.
function ruledLines(pitch: number): CSSProperties {
    // Draw the rule near each line's baseline (~72% down the band) so the
    // handwriting sits ON the line instead of floating above it.
    const lineAt = Math.round(pitch * 0.92)
    return {
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${lineAt - 1}px, rgba(187, 187, 187, 0.55) ${lineAt - 1}px, rgba(187, 187, 187, 0.55) ${lineAt}px, transparent ${lineAt}px, transparent ${pitch}px)`,
    }
}

interface StampCardProps {
    stamp: Stamp
    index: number
    count: number
    radius: number
    width: number
    height: number
    angle: MotionValue<number>
    shadow: boolean
    isStatic: boolean
    onOpen: (index: number) => void
    wasDragged: () => boolean
}

function StampCard(props: StampCardProps) {
    const { stamp, index, count, radius, width, height, angle, shadow, isStatic, onOpen, wasDragged } = props
    const step = 360 / count
    const facing = index * step

    // Depth cue: dim cards as they travel around the back of the ring.
    // Applied as a brightness filter on the image itself so the stamp's
    // transparent perforations stay transparent on any page background.
    const imageFilter = useTransform(angle, value => {
        const relative = ((((facing + value) % 360) + 540) % 360) - 180
        const t = Math.abs(relative) / 180
        const brightness = 1 - 0.5 * Math.pow(t, 1.6)
        return `brightness(${brightness.toFixed(3)})${shadow ? " drop-shadow(0 16px 24px rgba(4, 9, 22, 0.4))" : ""}`
    })

    return (
        <div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width,
                height,
                marginLeft: -width / 2,
                marginTop: -height / 2,
                transform: `rotateY(${facing}deg) translateZ(${radius}px)`,
                transformStyle: "preserve-3d",
            }}
        >
            <motion.button
                type="button"
                aria-label={`Open stamp: ${stamp.title ?? `Stamp ${index + 1}`}`}
                onClick={() => {
                    if (!wasDragged()) onOpen(index)
                }}
                whileHover={isStatic ? undefined : { scale: 1.05, y: -6 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                style={{
                    width: "100%",
                    height: "100%",
                    padding: 0,
                    margin: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "block",
                }}
            >
                {stamp.image?.src ? (
                    <motion.img
                        src={stamp.image.src}
                        srcSet={stamp.image.srcSet}
                        alt={stamp.image.alt ?? stamp.title ?? ""}
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            pointerEvents: "none",
                            filter: isStatic
                                ? shadow
                                    ? "drop-shadow(0 16px 24px rgba(4, 9, 22, 0.4))"
                                    : undefined
                                : imageFilter,
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 6,
                            border: "2px dashed rgba(120, 100, 80, 0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            color: "rgba(120, 100, 80, 0.8)",
                        }}
                    >
                        Add image
                    </div>
                )}
            </motion.button>
        </div>
    )
}

/**
 * Scrapbook Carousel
 *
 * A 3D rotating carousel of postage stamps. Drag to spin, click a stamp to
 * lift it out of the ring and read the memory behind it.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 640
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function StampScrapbook(props: StampScrapbookProps) {
    const {
        stamps,
        stampHeight = 300,
        spread = 1,
        tilt = -6,
        autoRotate = true,
        speed = 10,
        cursorSteer = true,
        hoverSpeed = 24,
        scrollTilt = true,
        scrollTiltStrength = 16,
        stampShadow = true,
        panelColor = "#F7F0E1",
        backdropColor = "rgba(7, 15, 35, 0.86)",
        titleColor = "#2B2119",
        textColor = "#2550D8",
        accentColor = "#B5843B",
        sealUrl,
        sealMonogram = "H",
        titleFont,
        captionFont,
        bodyFont,
        messageFont,
        style,
    } = props

    const items = useMemo<Stamp[]>(() => {
        const source = stamps && stamps.length > 0 ? stamps : FALLBACK_STAMPS
        return source.map((stamp, index) => ({
            ...stamp,
            image: stamp.image?.src ? stamp.image : FALLBACK_STAMPS[index % FALLBACK_STAMPS.length].image,
        }))
    }, [stamps])

    const count = items.length

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const rootRef = useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef)

    const angle = useMotionValue(0)

    // Scroll-driven "gravity" tilt. Plain motion value driven by a scroll
    // listener and eased in the animation loop — avoids framer-motion's scroll
    // hooks, which aren't guaranteed across every runtime. rotateX (tilt) and
    // rotateY (spin) live on separate nested elements so each transform has a
    // single input.
    const tiltMV = useMotionValue(0)
    const yawTransform = useTransform(angle, a => `rotateY(${a}deg)`)
    const tiltTransform = useTransform(tiltMV, t => `rotateX(${tilt + t}deg)`)

    const [mounted, setMounted] = useState(false)
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    const [direction, setDirection] = useState(1) // swipe direction: 1 = next (slide left), -1 = prev
    const [containerWidth, setContainerWidth] = useState(1200)
    const [viewportNarrow, setViewportNarrow] = useState(false)
    const isNarrow = containerWidth < 640

    // Scale stamps down on narrow containers so the front card never
    // overwhelms the viewport (perspective magnifies it by ~1.5x).
    const cardHeight = Math.round(Math.min(stampHeight, Math.max(140, containerWidth * 0.6)))
    const cardWidth = Math.round(cardHeight * STAMP_ASPECT)
    const radius = Math.round(ringRadius(count, cardWidth, spread))

    const draggingRef = useRef(false)
    const dragDistanceRef = useRef(0)
    const lastXRef = useRef(0)
    const lastTimeRef = useRef(0)
    const flingRef = useRef(0) // decaying drag momentum
    const steerVelRef = useRef(speed) // current eased angular velocity (idle drift + cursor steer)
    const pointerNormXRef = useRef(0) // cursor X normalised to [-1, 1] about component centre
    const tiltTargetRef = useRef(0) // scroll-driven tilt target (decays to 0)
    const hoverRef = useRef(false)

    // Portal target (document.body) is only available on the client; gate the
    // modal portal on this flag to stay SSR/hydration-safe.
    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        const node = rootRef.current
        if (!node) return
        const observer = new ResizeObserver(entries => {
            const width = entries[0]?.contentRect.width ?? 0
            if (width > 0) startTransition(() => setContainerWidth(width))
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    // The ring never stops. Each frame we ease the current angular velocity
    // toward a target: a gentle idle drift, boosted toward whichever edge the
    // cursor is near while hovering (cursor-steered). Drag momentum decays on
    // top and blends back into the drift — no hard stop.
    const STEER_RESPONSE = 3
    useAnimationFrame((_, delta) => {
        if (isStatic || openIndex !== null || draggingRef.current || !inView) return
        const dt = Math.min(delta, 48) / 1000

        const idle = autoRotate && !reducedMotion ? speed : 0
        // While steering, velocity is purely cursor-driven and symmetric about
        // centre (no idle offset), so left and right feel identical and centre
        // eases to a gentle hold. Idle drift resumes on mouse-leave.
        const target = cursorSteer && hoverRef.current ? pointerNormXRef.current * hoverSpeed : idle
        const ease = 1 - Math.exp(-dt * STEER_RESPONSE)
        steerVelRef.current += (target - steerVelRef.current) * ease

        flingRef.current *= Math.exp(-dt * 2.2)
        if (Math.abs(flingRef.current) < 1) flingRef.current = 0

        angle.set(angle.get() + (steerVelRef.current + flingRef.current) * dt)

        // Scroll-driven tilt: the target decays to 0 (springs back to level when
        // scrolling stops); ease the live tilt toward it.
        tiltTargetRef.current *= Math.exp(-dt * 3)
        tiltMV.set(tiltMV.get() + (tiltTargetRef.current - tiltMV.get()) * (1 - Math.exp(-dt * 8)))
    })

    const handlePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (isStatic || openIndex !== null) return
            // No pointer capture: capturing retargets pointerup to the
            // container, which would swallow the stamps' click events.
            draggingRef.current = true
            dragDistanceRef.current = 0
            flingRef.current = 0
            lastXRef.current = event.clientX
            lastTimeRef.current = event.timeStamp
        },
        [isStatic, openIndex]
    )

    const handlePointerMove = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            // Track absolute cursor X (normalised to [-1, 1] about centre) on
            // every move — this steers the rotation. rect is read here, never
            // per-frame in the animation loop.
            const rect = event.currentTarget.getBoundingClientRect()
            const nx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1
            pointerNormXRef.current = Math.max(-1, Math.min(1, nx))

            if (!draggingRef.current) return
            const deltaX = event.clientX - lastXRef.current
            const deltaTime = Math.max(event.timeStamp - lastTimeRef.current, 1)
            lastXRef.current = event.clientX
            lastTimeRef.current = event.timeStamp
            dragDistanceRef.current += Math.abs(deltaX)
            const degrees = deltaX * 0.28
            angle.set(angle.get() + degrees)
            flingRef.current = (degrees / deltaTime) * 1000
        },
        [angle]
    )

    const handlePointerUp = useCallback(() => {
        draggingRef.current = false
        flingRef.current = Math.max(-260, Math.min(260, flingRef.current))
    }, [])

    const wasDragged = useCallback(() => dragDistanceRef.current > 6, [])

    const openStamp = useCallback((index: number) => {
        setDirection(0) // 0 → flip-and-scale entrance
        startTransition(() => setOpenIndex(index))
    }, [])

    const closeStamp = useCallback(() => {
        setDirection(0) // flip back out on close
        startTransition(() => setOpenIndex(null))
    }, [])

    const stepStamp = useCallback(
        (dir: 1 | -1) => {
            setDirection(dir)
            startTransition(() =>
                setOpenIndex(current => (current === null ? current : (current + dir + count) % count))
            )
        },
        [count]
    )

    // While a stamp is open: keyboard controls + lock body scroll (the modal is
    // a full-viewport portal, so background scroll would be disorienting).
    useEffect(() => {
        if (openIndex === null || typeof window === "undefined") return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeStamp()
            if (event.key === "ArrowRight") stepStamp(1)
            if (event.key === "ArrowLeft") stepStamp(-1)
        }
        window.addEventListener("keydown", onKeyDown)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKeyDown)
            document.body.style.overflow = previousOverflow
        }
    }, [openIndex, closeStamp, stepStamp])

    // Modal layout keys off the actual viewport width, not the component width
    // (the modal now covers the whole page via a portal).
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(max-width: 640px)")
        const update = () => setViewportNarrow(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])

    // Scroll-driven tilt: translate page-scroll velocity into a bounded tilt
    // target. The loop eases toward it and decays it back to 0.
    useEffect(() => {
        if (typeof window === "undefined") return
        let lastY = window.scrollY
        let lastT = Date.now()
        const onScroll = () => {
            const now = Date.now()
            const y = window.scrollY
            const dt = Math.max(now - lastT, 1)
            const v = ((y - lastY) / dt) * 1000 // px/s
            lastY = y
            lastT = now
            const range = scrollTilt ? scrollTiltStrength : 0
            tiltTargetRef.current = Math.max(-range, Math.min(range, -(v / 2500) * range))
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [scrollTilt, scrollTiltStrength])

    const openStampData = openIndex === null ? null : items[openIndex]

    // Bare cream chevrons for the off-card nav (no circle outline).
    const chevButtonStyle: CSSProperties = {
        border: "none",
        background: "transparent",
        color: panelColor,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        padding: 6,
    }

    // Wax-seal monogram badge: double ring + gold sunburst + centred initial.
    // Becomes a link when a Seal Link is set.
    const sunburstPoints = Array.from({ length: 24 })
        .map((_, i) => {
            const a = (i / 24) * Math.PI * 2 - Math.PI / 2
            const rad = i % 2 === 0 ? 13.5 : 9
            return `${(22 + Math.cos(a) * rad).toFixed(2)},${(22 + Math.sin(a) * rad).toFixed(2)}`
        })
        .join(" ")
    const sealSvg = (
        <svg width="46" height="46" viewBox="0 0 44 44" aria-hidden style={{ display: "block", transform: "rotate(-4deg)" }}>
            <defs>
                {/* subtle roughening so the seal reads like a hand-stamped ink mark */}
                <filter id="sealTexture" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="1" seed="4" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </defs>
            <g filter="url(#sealTexture)">
                <circle cx="22" cy="22" r="21" fill="none" stroke={accentColor} strokeWidth="1.1" />
                <circle cx="22" cy="22" r="18" fill="none" stroke={accentColor} strokeWidth="1.1" />
                <polygon points={sunburstPoints} fill={accentColor} />
                {sealMonogram ? (
                    <text
                        x="22"
                        y="22.5"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={panelColor}
                        fontSize="14"
                        fontWeight={700}
                        fontFamily="Georgia, 'Times New Roman', serif"
                    >
                        {sealMonogram}
                    </text>
                ) : null}
            </g>
        </svg>
    )
    const sealNode = sealUrl ? (
        <a
            href={sealUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit website"
            onPointerDown={event => event.stopPropagation()}
            style={{ display: "inline-block", marginBottom: 16, lineHeight: 0, cursor: "pointer" }}
        >
            {sealSvg}
        </a>
    ) : (
        <span style={{ display: "inline-block", marginBottom: 16, lineHeight: 0 }} aria-hidden>
            {sealSvg}
        </span>
    )

    // Textured "pen ink": desaturated fractal-noise fields clipped to the text
    // via background-clip and blended over the ink colour so the writing gets
    // faded/denser patches like a real pen. Two layers — a fine grain plus a
    // COARSER layer for bigger dry-pen patches (tune baseFrequency / blend /
    // backgroundSize below). Self-contained (inline SVG).
    const inkNoiseFine = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='210'><filter id='pf'><feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#pf)'/></svg>`
    const inkNoiseCoarse = `<svg xmlns='http://www.w3.org/2000/svg' width='440' height='320'><filter id='pc'><feTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#pc)'/></svg>`
    const inkFineUrl = `url("data:image/svg+xml,${encodeURIComponent(inkNoiseFine)}")`
    const inkCoarseUrl = `url("data:image/svg+xml,${encodeURIComponent(inkNoiseCoarse)}")`
    const texturedInk = (color: string, op = 0.9, subtle = false): CSSProperties => ({
        opacity: op,
        color: "transparent",
        WebkitTextFillColor: "transparent",
        backgroundColor: color,
        // subtle = just the fine grain (keeps high contrast, e.g. the title);
        // full = fine grain + coarse dry-pen patches (the handwritten message).
        backgroundImage: subtle ? inkFineUrl : `${inkCoarseUrl}, ${inkFineUrl}`,
        // soft-light (not overlay) preserves the vibrant blue while still mottling
        backgroundBlendMode: subtle ? "soft-light" : "soft-light, soft-light",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
    })

    return (
        <div
            ref={rootRef}
            role="group"
            aria-roledescription="3D stamp carousel"
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                userSelect: "none",
                touchAction: "pan-y",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onMouseEnter={() => {
                hoverRef.current = true
            }}
            onMouseLeave={() => {
                hoverRef.current = false
            }}
        >
            <div
                aria-hidden={openIndex !== null}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: 1400,
                }}
            >
                <motion.div
                    style={{
                        position: "relative",
                        transformStyle: "preserve-3d",
                        transform: isStatic ? `rotateX(${tilt}deg)` : tiltTransform,
                    }}
                >
                    <motion.div
                        style={{
                            position: "relative",
                            width: cardWidth,
                            height: cardHeight,
                            transformStyle: "preserve-3d",
                            transform: isStatic ? "rotateY(12deg)" : yawTransform,
                        }}
                    >
                        {items.map((stamp, index) => (
                            <StampCard
                                key={index}
                                stamp={stamp}
                                index={index}
                                count={count}
                                radius={radius}
                                width={cardWidth}
                                height={cardHeight}
                                angle={angle}
                                shadow={stampShadow}
                                isStatic={isStatic}
                                onOpen={openStamp}
                                wasDragged={wasDragged}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            {mounted &&
                !isStatic &&
                typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                {openStampData && (
                    <motion.div
                        key="stamp-detail"
                        role="dialog"
                        aria-modal="true"
                        aria-label={openStampData.title ?? "Stamp detail"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 2147483000,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: viewportNarrow ? 16 : 20,
                            padding: viewportNarrow ? 16 : 40,
                            background: backdropColor,
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            perspective: 1600,
                        }}
                        onPointerDown={event => event.stopPropagation()}
                        onClick={event => {
                            if (event.target === event.currentTarget) closeStamp()
                        }}
                    >
                        <AnimatePresence initial={true} custom={direction} mode="popLayout">
                            <motion.div
                                key={openIndex}
                                custom={direction}
                                variants={POSTCARD_VARIANTS}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 32 },
                                    rotate: { type: "spring", stiffness: 300, damping: 32 },
                                    rotateY: { type: "spring", stiffness: 70, damping: 14 },
                                    scale: { type: "spring", stiffness: 120, damping: 15 },
                                    opacity: { duration: 0.28 },
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.7}
                                onDragEnd={(_, info) => {
                                    const power = info.offset.x + info.velocity.x * 0.2
                                    if (power < -90) stepStamp(1)
                                    else if (power > 90) stepStamp(-1)
                                }}
                                style={{
                                    position: "relative",
                                    width: viewportNarrow ? "100%" : 380,
                                    maxWidth: "100%",
                                    maxHeight: "calc(100% - 60px)",
                                    cursor: "grab",
                                    pointerEvents: "auto",
                                    transformStyle: "preserve-3d",
                                    filter: "drop-shadow(0 24px 44px rgba(2, 6, 18, 0.55))",
                                }}
                            >
                              <div
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    background: panelColor,
                                    // softly rounded corners + a slight hand-placed tilt
                                    boxSizing: "border-box",
                                    borderRadius: 6,
                                    transform: "rotate(-1.5deg)",
                                    padding: viewportNarrow ? "30px 26px 26px" : "46px 44px 36px",
                                    width: "100%",
                                    minHeight: viewportNarrow ? undefined : 540,
                                    maxHeight: "100%",
                                    overflow: "hidden",
                                }}
                              >
                                {/* Header — title block (top-left) + stamp scaled up into the top-right */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: 16,
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                                        {sealNode}
                                        <h3
                                            style={{
                                                margin: 0,
                                                fontSize: viewportNarrow ? 26 : 32,
                                                lineHeight: 1.08,
                                                ...titleFont,
                                                ...texturedInk(titleColor, 1, true),
                                            }}
                                        >
                                            {openStampData.title ?? "Untitled"}
                                        </h3>
                                    </div>
                                    <img
                                        src={openStampData.image?.src}
                                        srcSet={openStampData.image?.srcSet}
                                        alt={openStampData.image?.alt ?? openStampData.title ?? ""}
                                        draggable={false}
                                        style={{
                                            height: viewportNarrow ? 132 : 180,
                                            width: "auto",
                                            objectFit: "contain",
                                            flexShrink: 0,
                                            marginTop: -18,
                                            marginRight: -14,
                                            // slightly askew, hand-placed, and pressed flat onto the
                                            // paper — a tight contact shadow instead of a floating one
                                            transform: "rotate(-4deg)",
                                            filter: "drop-shadow(0 1px 1.5px rgba(2, 6, 18, 0.28))",
                                        }}
                                    />
                                </div>

                                {/* Handwritten message on a faint ruled writing area */}
                                {openStampData.description && (
                                    <p
                                        style={{
                                            marginTop: "auto", // pin the message to the bottom of the card
                                            marginBottom: 0,
                                            color: textColor,
                                            ...bodyFont,
                                            fontFamily: "'Caveat', 'Segoe Script', 'Bradley Hand', cursive",
                                            fontSize: viewportNarrow ? 21 : 24,
                                            ...messageFont,
                                            // fixed pitch + matching rules, applied last so the script
                                            // always sits on the lines regardless of the chosen font;
                                            // generous pitch gives the handwriting breathing room
                                            lineHeight: viewportNarrow ? "46px" : "54px",
                                            ...ruledLines(viewportNarrow ? 46 : 54),
                                        }}
                                    >
                                        {/* text dimmed to a secondary tone; the ruled lines
                                            stay at full strength on the <p> itself */}
                                        <span style={texturedInk(textColor, 0.9)}>{openStampData.description}</span>
                                    </p>
                                )}
                              </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Controls — off the postcard, centered: ‹  1 / 15  › */}
                        <div
                            style={{
                                flexShrink: 0,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 22,
                                pointerEvents: "auto",
                            }}
                        >
                            <button
                                type="button"
                                aria-label="Previous stamp"
                                onClick={() => stepStamp(-1)}
                                style={chevButtonStyle}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                                    <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <span
                                style={{
                                    color: panelColor,
                                    opacity: 0.75,
                                    fontSize: 15,
                                    letterSpacing: "0.08em",
                                    ...captionFont,
                                }}
                            >
                                {(openIndex ?? 0) + 1} / {count}
                            </span>
                            <button
                                type="button"
                                aria-label="Next stamp"
                                onClick={() => stepStamp(1)}
                                style={chevButtonStyle}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                                    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Close — off the postcard, top-right of the screen */}
                        <button
                            type="button"
                            aria-label="Close stamp detail"
                            onClick={closeStamp}
                            style={{
                                position: "absolute",
                                top: viewportNarrow ? 16 : 28,
                                right: viewportNarrow ? 16 : 32,
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                border: "none",
                                background: "transparent",
                                color: panelColor,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                pointerEvents: "auto",
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
                                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>
                    </motion.div>
                )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    )
}

addPropertyControls(StampScrapbook, {
    stamps: {
        type: ControlType.Array,
        title: "Stamps",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Untitled" },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    placeholder: "Place · Year",
                },
                description: {
                    type: ControlType.String,
                    title: "Story",
                    displayTextArea: true,
                    placeholder: "The memory behind this stamp…",
                },
            },
        },
        defaultValue: FALLBACK_STAMPS.map(({ title, caption, description }) => ({ title, caption, description })),
        maxCount: 24,
    },
    stampHeight: {
        type: ControlType.Number,
        title: "Stamp Size",
        defaultValue: 300,
        min: 120,
        max: 520,
        step: 10,
        unit: "px",
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 1,
        min: 0.7,
        max: 2,
        step: 0.05,
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: -6,
        min: -25,
        max: 25,
        step: 1,
        unit: "°",
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Base Speed",
        defaultValue: 10,
        min: 0,
        max: 60,
        step: 1,
        unit: "°/s",
        hidden: props => !props.autoRotate,
    },
    cursorSteer: {
        type: ControlType.Boolean,
        title: "Cursor Steer",
        defaultValue: true,
    },
    hoverSpeed: {
        type: ControlType.Number,
        title: "Steer Speed",
        defaultValue: 24,
        min: 0,
        max: 220,
        step: 5,
        unit: "°/s",
        hidden: props => !props.cursorSteer,
    },
    scrollTilt: {
        type: ControlType.Boolean,
        title: "Scroll Tilt",
        defaultValue: true,
    },
    scrollTiltStrength: {
        type: ControlType.Number,
        title: "Tilt Strength",
        defaultValue: 16,
        min: 0,
        max: 30,
        step: 1,
        unit: "°",
        hidden: props => !props.scrollTilt,
    },
    stampShadow: {
        type: ControlType.Boolean,
        title: "Stamp Shadow",
        defaultValue: true,
    },
    panelColor: {
        type: ControlType.Color,
        title: "Panel",
        defaultValue: "#F7F0E1",
    },
    backdropColor: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: "rgba(7, 15, 35, 0.86)",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#2B2119",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#2550D8",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Seal Color",
        defaultValue: "#B5843B",
    },
    sealUrl: {
        type: ControlType.Link,
        title: "Seal Link",
    },
    sealMonogram: {
        type: ControlType.String,
        title: "Seal Monogram",
        defaultValue: "H",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "28px",
            lineHeight: "1.1em",
            letterSpacing: "-0.01em",
        },
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: "11px",
            letterSpacing: "0.16em",
            lineHeight: "1.4em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "15px",
            lineHeight: "1.55em",
        },
    },
    messageFont: {
        type: ControlType.Font,
        title: "Message Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "22px",
            lineHeight: "1.55em",
        },
    },
})

StampScrapbook.displayName = "Scrapbook Carousel"
