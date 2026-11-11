/*
 * Marketplace compliance notes
 * 1. Static renderer: the exported entry calls useIsStaticRenderer() first and
 *    returns <StaticView/>, built from plain divs only — no motion, transitions,
 *    filters, listeners, observers, timers or rAF on the canvas / export path.
 * 2. Offscreen loop: the rAF loop in <LiveView/> starts locked out and only runs
 *    once an IntersectionObserver reports the component in view. Visibility is
 *    re-checked every frame, the loop parks when scrolled away or when the tab
 *    is hidden, and drag momentum is cleared when it parks. Reduced-motion users
 *    get no auto-rotation. Without IntersectionObserver the live path still runs.
 */
import { useRef, useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type React from "react"

type Layout = "arc" | "valley" | "simple"

const LAYOUT_KEYS: Layout[] = ["arc", "valley", "simple"]
const LAYOUT_TITLES = ["Arc", "Valley", "Flat"]

interface Testimonial {
    quote: string
    name: string
    role: string
    avatar?: { src: string; srcSet?: string; alt?: string }
    avatarUrl?: string
    inputMethod?: "upload" | "url"
    glowColor?: string
    rating?: number
}

interface IntradosProps {
    testimonials: Testimonial[]
    slideWidth: number
    slideHeight: number
    gap: number
    speed: number
    direction: "left" | "right"
    curveHeight: number
    layoutStyle: Layout
    autoRotate: boolean
    enableDrag: boolean
    smoothness: number
    momentum: boolean
    friction: number
    cardShadow: string
    cardBorder: any
    cardBorderRadius: string
    cardBackground: string
    quoteFont: any
    quoteColor: string
    nameFont: any
    nameColor: string
    roleFont: any
    roleColor: string
    glowIntensity: number
    glowSize: number
    starColor: string
    starSize: number
    showStars: boolean
    showCanvasToggle: boolean
    toggleTheme: "light" | "dark"
    toggleLayouts: Layout[]
    morphDuration: number
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
    {
        quote: "Our launch week used to be chaos. Now the whole team works from one calm, shared plan and nothing slips through.",
        name: "Odalys Brenner",
        role: "Head of Operations",
        avatar: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Odalys Brenner",
        },
        inputMethod: "upload",
        glowColor: "#FF9B6A",
        rating: 5,
    },
    {
        quote: "Setup took an afternoon, and within a month we had cut our review cycle in half. Honestly hard to imagine going back.",
        name: "Kiran Holloway",
        role: "Founder",
        avatar: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Kiran Holloway",
        },
        inputMethod: "upload",
        glowColor: "#8EA8FF",
        rating: 5,
    },
    {
        quote: "Every detail feels considered. Our clients noticed the difference before we even told them we had switched.",
        name: "Tamsin Achterberg",
        role: "Creative Director",
        avatar: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Tamsin Achterberg",
        },
        inputMethod: "upload",
        glowColor: "#5FE3B8",
        rating: 5,
    },
    {
        quote: "Support replies in minutes, not days. That alone has saved us more hours than any feature on the list.",
        name: "Rafferty Okonjo",
        role: "Growth Lead",
        avatar: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Rafferty Okonjo",
        },
        inputMethod: "upload",
        glowColor: "#F59BD8",
        rating: 5,
    },
    {
        quote: "It quietly replaced three tools we were paying for. The team adopted it on day one without a single training call.",
        name: "Saoirse Whitlow",
        role: "Product Designer",
        avatar: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Saoirse Whitlow",
        },
        inputMethod: "upload",
        glowColor: "#FFC56B",
        rating: 5,
    },
]

const REFERENCE_DIST = 600

function hexToRgba(hex: string, alpha: number) {
    if (hex.startsWith("rgb")) {
        const match = hex.match(/rgba?\(([^)]+)\)/)
        if (match) {
            const parts = match[1].split(",").map((s) => s.trim())
            return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
        }
    }
    const cleaned = hex.replace("#", "")
    const full =
        cleaned.length === 3
            ? cleaned
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : cleaned.slice(0, 6)
    const bigint = parseInt(full, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const RAD = 180 / Math.PI

/**
 * Card pose for a given layout at horizontal distance x from centre.
 * y is the vertical offset, deg the card tilt, s the scale.
 * `amp` is the shape strength (Curve Height control).
 */
function layoutPose(layout: Layout, x: number, amp: number) {
    switch (layout) {
        case "arc": {
            const k = amp / (REFERENCE_DIST * REFERENCE_DIST)
            return { y: k * x * x, deg: Math.atan(2 * k * x) * RAD, s: 1 }
        }
        case "valley": {
            // Cards rise toward the edges; centre card sits lowest and largest
            const k = -amp / (REFERENCE_DIST * REFERENCE_DIST)
            const s = 1 - Math.min(0.18, Math.abs(x) / (REFERENCE_DIST * 5))
            return { y: k * x * x, deg: Math.atan(2 * k * x) * RAD, s }
        }
        default:
            return { y: 0, deg: 0, s: 1 }
    }
}

const easeInOut = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Intrados(props: IntradosProps) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticView {...props} />
    return <LiveView {...props} />
}

/* ───────────────────────── Static (canvas / export) ───────────────────────── */

function StaticView(props: IntradosProps) {
    const {
        testimonials = DEFAULT_TESTIMONIALS,
        slideWidth = 320,
        slideHeight = 460,
        gap = 40,
        curveHeight = 120,
        layoutStyle = "arc",
        cardShadow,
        cardBorder,
        cardBorderRadius = "24px",
        cardBackground = "#FFFFFF",
        quoteFont,
        quoteColor = "#1a1a1a",
        nameFont,
        nameColor = "#1a1a1a",
        roleFont,
        roleColor = "#9ca3af",
        glowIntensity = 0.7,
        glowSize = 70,
        starColor = "#FDE047",
        starSize = 16,
        showStars = true,
    } = props

    const list = testimonials.length ? testimonials : DEFAULT_TESTIMONIALS
    const n = list.length
    const stride = slideWidth + gap
    const slots = n >= 3 ? [-1, 0, 1] : n === 2 ? [0, 1] : [0]

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {slots.map((slot) => {
                const item = list[((slot % n) + n) % n]
                const x = slot * stride
                const { y, deg, s } = layoutPose(layoutStyle, x, curveHeight)
                const src =
                    item.inputMethod === "url"
                        ? item.avatarUrl
                        : item.avatar?.src
                const glow = item.glowColor || "#FF9B6A"
                return (
                    <div
                        key={slot}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: slideWidth,
                            height: slideHeight,
                            marginLeft: -slideWidth / 2,
                            marginTop: -slideHeight / 2,
                            transform: `translate(${x}px, ${y}px) rotate(${deg}deg) scale(${s})`,
                            zIndex: 10 - Math.abs(slot),
                            borderRadius: cardBorderRadius,
                            overflow: "hidden",
                            boxShadow: cardShadow,
                            backgroundColor: cardBackground,
                            ...cardBorder,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                zIndex: 2,
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                padding: "32px 28px",
                                boxSizing: "border-box",
                            }}
                        >
                            {showStars && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 4,
                                        marginBottom: 16,
                                    }}
                                >
                                    {[1, 2, 3, 4, 5].map((s) => {
                                        const filled = s <= (item.rating ?? 5)
                                        return (
                                            <svg
                                                key={s}
                                                width={starSize}
                                                height={starSize}
                                                viewBox="0 0 24 24"
                                                fill={
                                                    filled ? starColor : "none"
                                                }
                                                stroke={
                                                    filled
                                                        ? starColor
                                                        : "#d1d5db"
                                                }
                                                strokeWidth="1.5"
                                                strokeLinejoin="round"
                                            >
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        )
                                    })}
                                </div>
                            )}
                            <p
                                style={{
                                    margin: 0,
                                    color: quoteColor,
                                    ...quoteFont,
                                }}
                            >
                                {`\u201C${item.quote}\u201D`}
                            </p>
                            <div style={{ height: 28 }} />
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                {src && (
                                    <img
                                        src={src}
                                        alt={item.avatar?.alt || item.name}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: nameColor,
                                            ...nameFont,
                                        }}
                                    >
                                        {item.name}
                                    </span>
                                    <span
                                        style={{
                                            color: roleColor,
                                            ...roleFont,
                                        }}
                                    >
                                        {item.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                bottom: `-${glowSize / 2}%`,
                                left: "50%",
                                width: `${glowSize * 1.4}%`,
                                height: `${glowSize}%`,
                                marginLeft: `-${(glowSize * 1.4) / 2}%`,
                                background: `radial-gradient(ellipse at center, ${hexToRgba(glow, glowIntensity)} 0%, ${hexToRgba(glow, glowIntensity * 0.4)} 35%, ${hexToRgba(glow, 0)} 70%)`,
                                zIndex: 1,
                            }}
                        />
                    </div>
                )
            })}
        </div>
    )
}

/* ───────────────────────────── Live hooks ───────────────────────────── */

function useVisibility(ref: React.RefObject<HTMLElement>) {
    const [inView, setInView] = useState(false)
    const [tabVisible, setTabVisible] = useState(true)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            startTransition(() => setInView(true))
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                const e = entries[entries.length - 1]
                startTransition(() => setInView(e.isIntersecting))
            },
            { threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    useEffect(() => {
        if (typeof document === "undefined") return
        const onVis = () =>
            startTransition(() => setTabVisible(!document.hidden))
        onVis()
        document.addEventListener("visibilitychange", onVis)
        return () => document.removeEventListener("visibilitychange", onVis)
    }, [])

    return inView && tabVisible
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => startTransition(() => setReduced(mq.matches))
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])
    return reduced
}

/* ─────────────────────────── Layout switch ─────────────────────────── */

const LAYOUT_ICONS: Record<Layout, string> = {
    arc: "M2 11.5C4.2 6.2 11.8 6.2 14 11.5",
    valley: "M2 4.5C4.2 9.8 11.8 9.8 14 4.5",
    simple: "M2 8H14",
}

function LayoutSwitch({
    value,
    options,
    onChange,
    theme,
}: {
    value: Layout
    options: Layout[]
    onChange: (v: Layout) => void
    theme: "light" | "dark"
}) {
    const [hovered, setHovered] = useState<Layout | null>(null)
    const dark = theme === "dark"
    const segW = 82
    const activeIndex = Math.max(0, options.indexOf(value))
    const palette = dark
        ? {
              track: "rgba(20, 20, 24, 0.72)",
              border: "rgba(255, 255, 255, 0.10)",
              thumb: "#FFFFFF",
              thumbShadow:
                  "0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.25)",
              active: "#111114",
              idle: "rgba(255, 255, 255, 0.55)",
              hover: "rgba(255, 255, 255, 0.9)",
          }
        : {
              track: "rgba(255, 255, 255, 0.72)",
              border: "rgba(15, 15, 20, 0.08)",
              thumb: "#111114",
              thumbShadow:
                  "0 1px 2px rgba(0,0,0,0.12), 0 6px 14px rgba(0,0,0,0.14)",
              active: "#FFFFFF",
              idle: "rgba(17, 17, 20, 0.5)",
              hover: "rgba(17, 17, 20, 0.85)",
          }

    if (options.length < 2) return null

    return (
        <div
            role="radiogroup"
            aria-label="Layout"
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            style={{
                position: "absolute",
                top: 20,
                left: 20,
                zIndex: 9999,
                maxWidth: "calc(100% - 40px)",
                overflowX: "auto",
                scrollbarWidth: "none",
                display: "flex",
                padding: 4,
                borderRadius: 999,
                background: palette.track,
                border: `1px solid ${palette.border}`,
                boxShadow: dark
                    ? "0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "0 8px 24px rgba(15,15,20,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
                backdropFilter: "blur(14px) saturate(160%)",
                WebkitBackdropFilter: "blur(14px) saturate(160%)",
                cursor: "default",
            }}
        >
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: 4,
                    left: 4,
                    width: segW,
                    height: "calc(100% - 8px)",
                    borderRadius: 999,
                    background: palette.thumb,
                    boxShadow: palette.thumbShadow,
                    transform: `translateX(${activeIndex * segW}px)`,
                    transition:
                        "transform 0.45s cubic-bezier(0.34, 1.3, 0.5, 1)",
                }}
            />
            {options.map((key) => {
                const isActive = value === key
                const isHover = hovered === key && !isActive
                return (
                    <button
                        key={key}
                        role="radio"
                        aria-checked={isActive}
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange(key)
                        }}
                        onPointerEnter={() => setHovered(key)}
                        onPointerLeave={() => setHovered(null)}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            flexShrink: 0,
                            width: segW,
                            height: 34,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: 0,
                            border: "none",
                            background: "transparent",
                            borderRadius: 999,
                            cursor: "pointer",
                            outline: "none",
                            fontFamily:
                                "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
                            fontSize: 12.5,
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                            color: isActive
                                ? palette.active
                                : isHover
                                  ? palette.hover
                                  : palette.idle,
                            transition: "color 0.25s ease",
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            style={{
                                transform: isHover
                                    ? "translateY(-1px)"
                                    : "none",
                                transition: "transform 0.25s ease",
                            }}
                        >
                            <path
                                d={LAYOUT_ICONS[key]}
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {LAYOUT_TITLES[LAYOUT_KEYS.indexOf(key)]}
                    </button>
                )
            })}
        </div>
    )
}

/* ───────────────────────────── Live view ───────────────────────────── */

function LiveView(props: IntradosProps) {
    const {
        testimonials = DEFAULT_TESTIMONIALS,
        slideWidth = 320,
        slideHeight = 460,
        gap = 40,
        speed = 1.5,
        direction = "left",
        curveHeight = 120,
        layoutStyle = "arc",
        autoRotate = true,
        enableDrag = true,
        smoothness = 0.12,
        momentum = true,
        friction = 0.95,
        cardShadow,
        cardBorder,
        cardBorderRadius = "24px",
        cardBackground = "#FFFFFF",
        quoteFont,
        quoteColor = "#1a1a1a",
        nameFont,
        nameColor = "#1a1a1a",
        roleFont,
        roleColor = "#9ca3af",
        glowIntensity = 0.7,
        glowSize = 70,
        starColor = "#FDE047",
        starSize = 16,
        showStars = true,
        showCanvasToggle = true,
        toggleTheme = "light",
        toggleLayouts = LAYOUT_KEYS,
        morphDuration = 0.7,
    } = props

    const switchOptions = LAYOUT_KEYS.filter((k) =>
        (toggleLayouts && toggleLayouts.length
            ? toggleLayouts
            : LAYOUT_KEYS
        ).includes(k)
    )
    const list = testimonials.length ? testimonials : DEFAULT_TESTIMONIALS
    const containerRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<Map<number, HTMLDivElement>>(new Map())
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

    const visible = useVisibility(containerRef)
    const reducedMotion = useReducedMotion()
    const visibleRef = useRef(false)
    visibleRef.current = visible

    const offsetRef = useRef(0)
    const targetOffsetRef = useRef(0)
    const seededRef = useRef(false)
    const animationFrameRef = useRef<number>(0)
    const lastTimeRef = useRef(0)

    const [isDragging, setIsDragging] = useState(false)
    const dragStartRef = useRef(0)
    const dragStartOffsetRef = useRef(0)
    const velocityRef = useRef(0)
    const lastDragXRef = useRef(0)
    const lastDragTimeRef = useRef(0)
    const wheelTimeoutRef = useRef<number>(0)
    const [isWheeling, setIsWheeling] = useState(false)
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(
        null
    )
    const [activeLayout, setActiveLayout] = useState<Layout>(layoutStyle)

    useEffect(() => {
        startTransition(() => setActiveLayout(layoutStyle))
    }, [layoutStyle])

    useEffect(() => {
        const handleResize = () => {
            const el = containerRef.current
            if (!el) return
            startTransition(() =>
                setContainerSize({
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                })
            )
        }
        handleResize()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(handleResize)
        if (containerRef.current) observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    const itemStride = slideWidth + gap
    const displayItems = [...list, ...list, ...list]
    const totalWidth = displayItems.length * itemStride

    // Start with the first testimonial resting in the centre
    useEffect(() => {
        const seed = 0.5 * list.length * itemStride
        if (!seededRef.current) {
            offsetRef.current = seed
            targetOffsetRef.current = seed
            seededRef.current = true
        }
    }, [list.length, itemStride])

    // Layout morph: blend card poses from the previous layout to the new one
    const fromLayoutRef = useRef<Layout>(layoutStyle)
    const toLayoutRef = useRef<Layout>(layoutStyle)
    const morphStartRef = useRef(-1)
    const [morphTick, setMorphTick] = useState(0)

    useEffect(() => {
        if (toLayoutRef.current === activeLayout) return
        fromLayoutRef.current = toLayoutRef.current
        toLayoutRef.current = activeLayout
        morphStartRef.current = performance.now()
        startTransition(() => setMorphTick((t) => t + 1))
    }, [activeLayout])

    const morphProgress = () => {
        if (morphStartRef.current < 0) return 1
        const dur = reducedMotion ? 0 : Math.max(0, morphDuration) * 1000
        if (dur === 0) {
            morphStartRef.current = -1
            return 1
        }
        const t = (performance.now() - morphStartRef.current) / dur
        if (t >= 1) {
            morphStartRef.current = -1
            return 1
        }
        return easeInOut(Math.max(0, t))
    }

    const updateCardPositions = () => {
        if (containerSize.width === 0) return
        const centerX = containerSize.width / 2
        const centerY = containerSize.height / 2
        const edge = containerSize.width / 2 + slideWidth
        const m = morphProgress()

        cardsRef.current.forEach((card, index) => {
            const currentX = index * itemStride + offsetRef.current
            const wrappedX =
                (((currentX % totalWidth) + totalWidth) % totalWidth) -
                totalWidth / 2

            if (Math.abs(wrappedX) >= edge) {
                card.style.display = "none"
                return
            }
            const b = layoutPose(toLayoutRef.current, wrappedX, curveHeight)
            let { y, deg, s } = b
            if (m < 1) {
                const a = layoutPose(
                    fromLayoutRef.current,
                    wrappedX,
                    curveHeight
                )
                y = a.y + (b.y - a.y) * m
                deg = a.deg + (b.deg - a.deg) * m
                s = a.s + (b.s - a.s) * m
            }
            card.style.display = "block"
            card.style.transform = `translate3d(${centerX + wrappedX - slideWidth / 2}px, ${centerY + y - slideHeight / 2}px, 0) rotate(${deg}deg) scale(${s})`
            card.style.zIndex = String(Math.round(1000 - Math.abs(wrappedX)))
        })
    }

    // Park: clear momentum when the component leaves view
    useEffect(() => {
        if (!visible) {
            velocityRef.current = 0
            targetOffsetRef.current = offsetRef.current
            lastTimeRef.current = 0
        }
    }, [visible])

    useEffect(() => {
        if (!visible) return
        updateCardPositions()

        const shouldRotate = autoRotate && !reducedMotion

        const animate = (time: number) => {
            if (!visibleRef.current) {
                lastTimeRef.current = 0
                return
            }
            if (!lastTimeRef.current) lastTimeRef.current = time
            const deltaTime = Math.min(time - lastTimeRef.current, 64)
            lastTimeRef.current = time
            const frameScale = deltaTime / 16.667

            if (!isDragging && momentum && velocityRef.current !== 0) {
                targetOffsetRef.current += velocityRef.current * frameScale
                velocityRef.current *= Math.pow(friction, frameScale)
                if (Math.abs(velocityRef.current) < 0.02)
                    velocityRef.current = 0
            }

            if (isDragging) {
                offsetRef.current = targetOffsetRef.current
            } else {
                const k = 1 - Math.pow(1 - smoothness, frameScale)
                offsetRef.current +=
                    (targetOffsetRef.current - offsetRef.current) * k
            }

            if (
                shouldRotate &&
                !isDragging &&
                !isWheeling &&
                Math.abs(velocityRef.current) < 0.1
            ) {
                const move = deltaTime * 0.05 * speed
                targetOffsetRef.current += direction === "left" ? -move : move
            }

            updateCardPositions()

            // Self-sleep when nothing is moving
            const settled =
                !shouldRotate &&
                !isDragging &&
                !isWheeling &&
                morphStartRef.current < 0 &&
                velocityRef.current === 0 &&
                Math.abs(targetOffsetRef.current - offsetRef.current) < 0.05
            if (settled) {
                offsetRef.current = targetOffsetRef.current
                updateCardPositions()
                lastTimeRef.current = 0
                return
            }
            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)
        return () => {
            cancelAnimationFrame(animationFrameRef.current)
            lastTimeRef.current = 0
        }
    }, [
        visible,
        reducedMotion,
        speed,
        direction,
        isDragging,
        isWheeling,
        autoRotate,
        smoothness,
        momentum,
        friction,
        containerSize,
        slideWidth,
        slideHeight,
        gap,
        totalWidth,
        itemStride,
        curveHeight,
        morphTick,
        morphDuration,
    ])

    useEffect(
        () => () => {
            if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current)
        },
        []
    )

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!enableDrag) return
        startTransition(() => setIsDragging(true))
        dragStartRef.current = e.clientX
        dragStartOffsetRef.current = targetOffsetRef.current
        lastDragXRef.current = e.clientX
        lastDragTimeRef.current = performance.now()
        velocityRef.current = 0
        containerRef.current?.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!enableDrag || !isDragging) return
        const next =
            dragStartOffsetRef.current + (e.clientX - dragStartRef.current)
        targetOffsetRef.current = next
        offsetRef.current = next

        const now = performance.now()
        const dt = now - lastDragTimeRef.current
        if (dt > 0) {
            const v = ((e.clientX - lastDragXRef.current) / dt) * 16.667
            velocityRef.current = velocityRef.current * 0.2 + v * 0.8
        }
        lastDragXRef.current = e.clientX
        lastDragTimeRef.current = now
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!enableDrag || !isDragging) return
        startTransition(() => setIsDragging(false))
        if (momentum) {
            if (performance.now() - lastDragTimeRef.current > 100) {
                velocityRef.current = 0
            } else {
                velocityRef.current = Math.max(
                    -60,
                    Math.min(60, velocityRef.current)
                )
            }
        } else {
            velocityRef.current = 0
        }
        if (containerRef.current?.hasPointerCapture(e.pointerId)) {
            containerRef.current.releasePointerCapture(e.pointerId)
        }
    }

    const handleWheel = (e: React.WheelEvent) => {
        if (!enableDrag) return
        e.preventDefault()
        const delta =
            Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        targetOffsetRef.current -= delta * 0.5
        velocityRef.current = 0
        if (!isWheeling) startTransition(() => setIsWheeling(true))
        if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current)
        wheelTimeoutRef.current = window.setTimeout(() => {
            startTransition(() => setIsWheeling(false))
        }, 150)
    }

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: enableDrag
                    ? isDragging
                        ? "grabbing"
                        : "grab"
                    : "default",
                touchAction: enableDrag ? "pan-y" : "auto",
                userSelect: "none",
            }}
        >
            {showCanvasToggle && (
                <LayoutSwitch
                    value={activeLayout}
                    options={switchOptions}
                    onChange={(v) => startTransition(() => setActiveLayout(v))}
                    theme={toggleTheme}
                />
            )}

            {displayItems.map((item, index) => {
                const avatarSrc =
                    item.inputMethod === "url"
                        ? item.avatarUrl
                        : item.avatar?.src
                const glow = item.glowColor || "#FF9B6A"
                const isHovered = hoveredCardIndex === index

                return (
                    <div
                        key={index}
                        ref={(el) => {
                            if (el) cardsRef.current.set(index, el)
                            else cardsRef.current.delete(index)
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            display: "none",
                            width: slideWidth,
                            height: slideHeight,
                            borderRadius: cardBorderRadius,
                            overflow: "hidden",
                            boxShadow: cardShadow,
                            backgroundColor: cardBackground,
                            willChange: "transform",
                            ...cardBorder,
                        }}
                    >
                        <div
                            onPointerEnter={() =>
                                startTransition(() =>
                                    setHoveredCardIndex(index)
                                )
                            }
                            onPointerLeave={() =>
                                startTransition(() => setHoveredCardIndex(null))
                            }
                            style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                padding: "32px 28px",
                                boxSizing: "border-box",
                                zIndex: 2,
                            }}
                        >
                            {showStars && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 4,
                                        marginBottom: 16,
                                        flexShrink: 0,
                                    }}
                                >
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const filled =
                                            star <= (item.rating ?? 5)
                                        return (
                                            <svg
                                                key={star}
                                                width={starSize}
                                                height={starSize}
                                                viewBox="0 0 24 24"
                                                fill={
                                                    filled ? starColor : "none"
                                                }
                                                stroke={
                                                    filled
                                                        ? starColor
                                                        : "#d1d5db"
                                                }
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                style={{
                                                    transform: isHovered
                                                        ? "scale(1.15)"
                                                        : "scale(1)",
                                                    transition: `transform 0.25s ease-out ${star * 0.03}s`,
                                                }}
                                            >
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        )
                                    })}
                                </div>
                            )}

                            <p
                                style={{
                                    margin: 0,
                                    color: quoteColor,
                                    ...quoteFont,
                                    flexShrink: 0,
                                }}
                            >
                                {`\u201C${item.quote}\u201D`}
                            </p>

                            <div style={{ height: 28, flexShrink: 0 }} />

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    flexShrink: 0,
                                }}
                            >
                                {avatarSrc && (
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "50%",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                            backgroundColor: "#f3f4f6",
                                        }}
                                    >
                                        <img
                                            src={avatarSrc}
                                            srcSet={
                                                item.inputMethod === "url"
                                                    ? undefined
                                                    : item.avatar?.srcSet
                                            }
                                            alt={
                                                item.avatar?.alt ||
                                                item.name ||
                                                `Avatar ${index + 1}`
                                            }
                                            draggable={false}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    </div>
                                )}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: nameColor,
                                            ...nameFont,
                                        }}
                                    >
                                        {item.name}
                                    </span>
                                    <span
                                        style={{
                                            color: roleColor,
                                            ...roleFont,
                                        }}
                                    >
                                        {item.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                position: "absolute",
                                bottom: `-${glowSize / 2}%`,
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: `${glowSize * 1.4}%`,
                                height: `${glowSize}%`,
                                background: `radial-gradient(ellipse at center, ${hexToRgba(glow, glowIntensity)} 0%, ${hexToRgba(glow, glowIntensity * 0.5)} 30%, ${hexToRgba(glow, 0)} 70%)`,
                                filter: "blur(20px)",
                                pointerEvents: "none",
                                zIndex: 1,
                            }}
                        />
                    </div>
                )
            })}
        </div>
    )
}

/* ─────────────────────────── Property controls ─────────────────────────── */

addPropertyControls(Intrados, {
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    defaultValue: DEFAULT_TESTIMONIALS[0].quote,
                    displayTextArea: true,
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: DEFAULT_TESTIMONIALS[0].name,
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: DEFAULT_TESTIMONIALS[0].role,
                },
                rating: {
                    type: ControlType.Number,
                    title: "Rating",
                    defaultValue: 5,
                    min: 0,
                    max: 5,
                    step: 1,
                    displayStepper: true,
                },
                inputMethod: {
                    type: ControlType.Enum,
                    title: "Avatar Input",
                    options: ["upload", "url"],
                    optionTitles: ["Upload", "URL"],
                    displaySegmentedControl: true,
                    defaultValue: "upload",
                },
                avatar: {
                    type: ControlType.ResponsiveImage,
                    title: "Avatar",
                    hidden: ({ inputMethod }: any) => inputMethod === "url",
                },
                avatarUrl: {
                    type: ControlType.String,
                    title: "Avatar URL",
                    defaultValue: "",
                    hidden: ({ inputMethod }: any) => inputMethod !== "url",
                },
                glowColor: {
                    type: ControlType.Color,
                    title: "Glow Color",
                    defaultValue: "#FF9B6A",
                },
            },
        },
        defaultValue: DEFAULT_TESTIMONIALS,
    },
    layoutStyle: {
        type: ControlType.Enum,
        title: "Layout",
        options: LAYOUT_KEYS,
        optionTitles: LAYOUT_TITLES,
        defaultValue: "arc",
    },
    showCanvasToggle: {
        type: ControlType.Boolean,
        title: "Layout Toggle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    toggleTheme: {
        type: ControlType.Enum,
        title: "Toggle Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        displaySegmentedControl: true,
        defaultValue: "light",
        hidden: ({ showCanvasToggle }: any) => !showCanvasToggle,
    },
    toggleLayouts: {
        type: ControlType.Array,
        title: "Toggle Layouts",
        control: {
            type: ControlType.Enum,
            options: LAYOUT_KEYS,
            optionTitles: LAYOUT_TITLES,
        },
        defaultValue: LAYOUT_KEYS,
        maxCount: 3,
        hidden: ({ showCanvasToggle }: any) => !showCanvasToggle,
    },
    morphDuration: {
        type: ControlType.Number,
        title: "Morph Time",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.7,
        unit: "s",
    },
    showStars: {
        type: ControlType.Boolean,
        title: "Show Stars",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FDE047",
        hidden: ({ showStars }: any) => !showStars,
    },
    starSize: {
        type: ControlType.Number,
        title: "Star Size",
        min: 12,
        max: 32,
        step: 2,
        defaultValue: 16,
        unit: "px",
        hidden: ({ showStars }: any) => !showStars,
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableDrag: {
        type: ControlType.Boolean,
        title: "Enable Drag",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    smoothness: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0.02,
        max: 1,
        step: 0.01,
        defaultValue: 0.12,
        description: "Lower = softer, floatier follow. Higher = snappier.",
    },
    momentum: {
        type: ControlType.Boolean,
        title: "Momentum",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableDrag }: any) => !enableDrag,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        min: 0.8,
        max: 0.99,
        step: 0.01,
        defaultValue: 0.95,
        description: "Higher = longer glide after release.",
        hidden: ({ enableDrag, momentum }: any) => !enableDrag || !momentum,
    },
    slideWidth: {
        type: ControlType.Number,
        title: "Slide Width",
        min: 200,
        max: 800,
        step: 10,
        defaultValue: 320,
    },
    slideHeight: {
        type: ControlType.Number,
        title: "Slide Height",
        min: 200,
        max: 800,
        step: 10,
        defaultValue: 460,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: -50,
        max: 200,
        step: 5,
        defaultValue: 40,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 1.5,
        displayStepper: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
    },
    curveHeight: {
        type: ControlType.Number,
        title: "Curve Height",
        min: -500,
        max: 500,
        step: 10,
        defaultValue: 120,
        description: "Shape strength for every layout except Flat.",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    quoteColor: {
        type: ControlType.Color,
        title: "Quote Color",
        defaultValue: "#1a1a1a",
    },
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Medium",
            lineHeight: "1.35em",
            letterSpacing: "-0.01em",
        },
    },
    nameColor: {
        type: ControlType.Color,
        title: "Name Color",
        defaultValue: "#1a1a1a",
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            lineHeight: "1.3em",
        },
    },
    roleColor: {
        type: ControlType.Color,
        title: "Role Color",
        defaultValue: "#9ca3af",
    },
    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            lineHeight: "1.3em",
        },
    },
    cardShadow: {
        type: ControlType.BoxShadow,
        title: "Card Shadow",
        defaultValue: "0 20px 50px rgba(0,0,0,0.12)",
    },
    cardBorder: {
        type: ControlType.Border,
        title: "Card Border",
    },
    cardBorderRadius: {
        type: ControlType.BorderRadius,
        title: "Card Radius",
        defaultValue: "24px",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.7,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        min: 20,
        max: 150,
        step: 5,
        defaultValue: 70,
        unit: "%",
    },
})
