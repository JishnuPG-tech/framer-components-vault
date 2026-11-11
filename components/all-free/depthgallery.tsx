// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useRef, useCallback, CSSProperties } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Item {
    title?: string
    subtitle?: string
    image?: string
    link?: string
}

interface Props {
    items: Item[]
    cardWidth: number
    cardHeight: number
    gap: number
    activeScale: number
    sideScale: number
    sideDepth: number
    sideOpacity: number
    blurAmount: number
    sideRotate: number
    perspective: number
    borderRadius: number
    shadow: boolean
    lighting: boolean
    parallax: boolean
    parallaxIntensity: number
    shine: boolean
    showOverlay: boolean
    showTitles: boolean
    showSubtitle: boolean
    showArrows: boolean
    showDots: boolean
    showCounter: boolean
    autoPlay: boolean
    autoPlayInterval: number
    loop: boolean
    backgroundColor: string
    overlayGradient: string
    titleColor: string
    subtitleColor: string
    titleSize: number
    subtitleSize: number
    textAlign: "left" | "center" | "right"
    transitionDuration: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FALLBACK_GRADIENTS = [
    "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    "linear-gradient(135deg, #2d1b69 0%, #11998e 100%)",
    "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
    "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    "linear-gradient(135deg, #1a1a1a 0%, #363636 100%)",
]

// ─── Nav Button ───────────────────────────────────────────────────────────────

function NavButton({
    dir,
    onClick,
}: {
    dir: "prev" | "next"
    onClick: () => void
}) {
    const [hovered, setHovered] = useState(false)
    return (
        <button
            aria-label={dir === "prev" ? "Previous slide" : "Next slide"}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "absolute",
                top: "50%",
                marginTop: -22,
                zIndex: 20,
                ...(dir === "prev" ? { left: 20 } : { right: 20 }),
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.15)",
                background: hovered
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                color: "#fff",
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: hovered ? "scale(1.1)" : "scale(1)",
                transition: "transform 180ms ease, background 180ms ease",
                outline: "none",
            }}
        >
            {dir === "prev" ? "‹" : "›"}
        </button>
    )
}

// ─── Depth Gallery ────────────────────────────────────────────────────────────

export default function DepthGallery({
    items = [],
    cardWidth = 400,
    cardHeight = 520,
    gap = 380,
    activeScale = 1,
    sideScale = 0.78,
    sideDepth = 150,
    sideOpacity = 0.65,
    blurAmount = 2.5,
    sideRotate = 20,
    perspective = 900,
    borderRadius = 16,
    shadow = true,
    lighting = true,
    parallax = true,
    parallaxIntensity = 10,
    shine = true,
    showOverlay = true,
    showTitles = true,
    showSubtitle = true,
    showArrows = true,
    showDots = true,
    showCounter = false,
    autoPlay = false,
    autoPlayInterval = 3,
    loop = true,
    backgroundColor = "#0d0d0d",
    overlayGradient = "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
    titleColor = "#ffffff",
    subtitleColor = "rgba(255,255,255,0.7)",
    titleSize = 22,
    subtitleSize = 14,
    textAlign = "left",
    transitionDuration = 500,
}: Props) {
    const count = items.length

    // ─── State ────────────────────────────────────────────────────────────────

    const [active, setActive] = useState(0)
    const [tilt, setTilt] = useState({ x: 0, y: 0 })
    const [shining, setShining] = useState(false)

    // parallaxReady gates whether the active card uses the fast 80 ms transition
    // (hover mode) or the full transitionDuration (navigation mode).
    // It flips false on every navigate, then back to true after the animation
    // settles — so the two transitions NEVER overlap mid-animation.
    const [parallaxReady, setParallaxReady] = useState(true)

    // ─── Refs ─────────────────────────────────────────────────────────────────

    const hovering = useRef(false)
    const swiped = useRef(false)
    const touchX = useRef(0)
    const isDragging = useRef(false)
    const dragStartX = useRef(0)
    const navTimer = useRef<ReturnType<typeof setTimeout>>()
    const shineTimer = useRef<ReturnType<typeof setTimeout>>()
    const prevActiveRef = useRef(active)

    // Always-fresh transition value for timers created in useCallback
    const transitionRef = useRef(transitionDuration)
    useEffect(() => {
        transitionRef.current = transitionDuration
    }, [transitionDuration])

    // ─── Inject @keyframes once ───────────────────────────────────────────────

    useEffect(() => {
        const id = "dg-kf"
        if (document.getElementById(id)) return
        const el = document.createElement("style")
        el.id = id
        el.textContent = `
            @keyframes dg-shine {
                0%   { transform: translateX(-130%) skewX(-15deg); }
                100% { transform: translateX(230%)  skewX(-15deg); }
            }
        `
        document.head.appendChild(el)
    }, [])

    // ─── Navigation ───────────────────────────────────────────────────────────
    // scheduleRef always calls the freshest schedule logic from any closure.

    const scheduleRef = useRef(() => {})
    scheduleRef.current = () => {
        clearTimeout(navTimer.current)
        navTimer.current = setTimeout(
            () => setParallaxReady(true),
            transitionRef.current + 80
        )
    }

    const prev = useCallback(() => {
        setActive((i) => (!loop && i === 0 ? i : (i - 1 + count) % count))
        setTilt({ x: 0, y: 0 })
        setParallaxReady(false)
        scheduleRef.current()
    }, [count, loop])

    const next = useCallback(() => {
        setActive((i) => (!loop && i === count - 1 ? i : (i + 1) % count))
        setTilt({ x: 0, y: 0 })
        setParallaxReady(false)
        scheduleRef.current()
    }, [count, loop])

    function goTo(i: number) {
        setActive(i)
        setTilt({ x: 0, y: 0 })
        setParallaxReady(false)
        scheduleRef.current()
    }

    // ─── Drag — window-level mouseup, e.preventDefault on mousedown ──────────

    const prevRef = useRef(prev)
    const nextRef = useRef(next)
    prevRef.current = prev
    nextRef.current = next

    useEffect(() => {
        const onUp = (e: MouseEvent) => {
            if (!isDragging.current) return
            isDragging.current = false
            const dx = e.clientX - dragStartX.current
            if (Math.abs(dx) > 50) {
                swiped.current = true
                dx < 0 ? nextRef.current() : prevRef.current()
            }
        }
        window.addEventListener("mouseup", onUp)
        return () => window.removeEventListener("mouseup", onUp)
    }, [])

    // ─── Autoplay ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!autoPlay || count < 2) return
        const id = setInterval(() => {
            if (!hovering.current) nextRef.current()
        }, autoPlayInterval * 1000)
        return () => clearInterval(id)
    }, [autoPlay, autoPlayInterval, count])

    // ─── Keyboard ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prevRef.current()
            if (e.key === "ArrowRight") nextRef.current()
        }
        window.addEventListener("keydown", h)
        return () => window.removeEventListener("keydown", h)
    }, [])

    // ─── Keep active in bounds ────────────────────────────────────────────────

    useEffect(() => {
        if (count > 0) setActive((i) => Math.min(i, count - 1))
    }, [count])

    // ─── Shine on card change ─────────────────────────────────────────────────

    useEffect(() => {
        if (active === prevActiveRef.current || !shine) {
            prevActiveRef.current = active
            return
        }
        prevActiveRef.current = active
        setShining(false)
        clearTimeout(shineTimer.current)
        const t = setTimeout(() => {
            setShining(true)
            shineTimer.current = setTimeout(() => setShining(false), 700)
        }, 40)
        return () => clearTimeout(t)
    }, [active, shine])

    // ─── Offset ───────────────────────────────────────────────────────────────

    function getOffset(i: number): number {
        if (count === 0) return 0
        const d = (((i - active) % count) + count) % count
        return d > count / 2 ? d - count : d
    }

    // ─── Card transform ───────────────────────────────────────────────────────
    //
    // PARALLAX IS ON THE OUTER CARD — the whole card (border, radius, shadow)
    // tilts, not just the image inside it.
    //
    // Transition logic:
    //   parallaxReady = false  →  transitionDuration ms  expo-out   (navigating)
    //   parallaxReady = true   →  80 ms  ease-out                   (hover tilt)
    //
    // The two modes only switch when the card is at rest, so they never
    // interrupt each other. Smooth every time.

    function cardStyle(i: number): CSSProperties {
        const off = getOffset(i)
        const abs = Math.abs(off)
        const sign = Math.sign(off)

        const tx =
            off === 0 ? 0 : sign * gap * (abs === 1 ? 1 : 1 + (abs - 1) * 0.8)
        const tz = -abs * sideDepth
        const scale =
            abs === 0 ? activeScale : sideScale * Math.pow(0.88, abs - 1)
        const opacity = abs === 0 ? 1 : sideOpacity * Math.pow(0.55, abs - 1)
        const blur = blurAmount * abs

        // Active card: tilt from mouse; side cards: fixed rotation
        const rotX = abs === 0 ? tilt.y : 0
        const rotY = abs === 0 ? tilt.x : off * sideRotate

        const isHoverMode = abs === 0 && parallaxReady && parallax
        const dur = isHoverMode ? 80 : transitionDuration
        const ease = isHoverMode ? "ease-out" : "cubic-bezier(0.16,1,0.3,1)"

        return {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            borderRadius,
            overflow: "hidden",
            cursor: abs === 0 ? "default" : "pointer",
            zIndex: 10 - abs * 2,
            transform: `perspective(${perspective}px) translateX(${tx}px) translateZ(${tz}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : "none",
            boxShadow:
                abs === 0 && shadow
                    ? "0 40px 100px rgba(0,0,0,0.75), 0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)"
                    : "none",
            transition: `transform ${dur}ms ${ease}, opacity ${transitionDuration}ms ease, filter ${transitionDuration}ms ease, box-shadow ${transitionDuration}ms ease`,
            willChange: "transform, opacity",
        }
    }

    // ─── Parallax handlers ────────────────────────────────────────────────────

    function onActiveMove(e: React.MouseEvent) {
        if (!parallax || !parallaxReady) return
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const nx = (e.clientX - r.left - r.width / 2) / (r.width / 2)
        const ny = (e.clientY - r.top - r.height / 2) / (r.height / 2)
        setTilt({ x: nx * parallaxIntensity, y: -ny * parallaxIntensity })
    }

    function onActiveLeave() {
        if (parallax) setTilt({ x: 0, y: 0 })
    }

    // ─── Empty state ──────────────────────────────────────────────────────────

    if (count === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "sans-serif",
                    fontSize: 14,
                }}
            >
                Add items to get started
            </div>
        )
    }

    const cur = items[active]
    const visible = items
        .map((item, i) => ({ item, i, off: getOffset(i) }))
        .filter(({ off }) => Math.abs(off) <= 2)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: backgroundColor,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // NO overflow: hidden — side cards must bleed beyond the frame
                userSelect: "none",
            }}
            onMouseEnter={() => (hovering.current = true)}
            onMouseLeave={() => (hovering.current = false)}
        >
            {/* ── Stage ─────────────────────────────────────────────────────── */}
            <div
                style={{
                    flex: 1,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: "grab",
                    // NO overflow: hidden here either
                }}
                onMouseDown={(e) => {
                    // Suppress browser's native element drag behaviour
                    e.preventDefault()
                    isDragging.current = true
                    dragStartX.current = e.clientX
                    swiped.current = false
                }}
                onTouchStart={(e) => {
                    touchX.current = e.touches[0].clientX
                    swiped.current = false
                }}
                onTouchEnd={(e) => {
                    const dx = e.changedTouches[0].clientX - touchX.current
                    if (Math.abs(dx) > 50) {
                        swiped.current = true
                        dx < 0 ? next() : prev()
                    }
                }}
            >
                {/* ── Card container ──────────────────────────────────────── */}
                <div
                    style={{
                        position: "relative",
                        width: cardWidth,
                        height: cardHeight,
                    }}
                >
                    {visible.map(({ item, i, off }) => {
                        const abs = Math.abs(off)
                        const shade = Math.min(0.55, abs * 0.28)
                        const shadeBg =
                            off > 0
                                ? `linear-gradient(to right, transparent 20%, rgba(0,0,0,${shade}) 100%)`
                                : `linear-gradient(to left,  transparent 20%, rgba(0,0,0,${shade}) 100%)`

                        return (
                            <div
                                key={i}
                                style={cardStyle(i)}
                                draggable={false}
                                onMouseMove={
                                    abs === 0 ? onActiveMove : undefined
                                }
                                onMouseLeave={
                                    abs === 0 ? onActiveLeave : undefined
                                }
                                onClick={() => {
                                    if (swiped.current) return
                                    if (abs === 0 && item.link)
                                        window.open(item.link, "_blank")
                                    else if (abs !== 0) goTo(i)
                                }}
                            >
                                {/* Gradient fallback */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                            FALLBACK_GRADIENTS[
                                                i % FALLBACK_GRADIENTS.length
                                            ],
                                    }}
                                />

                                {/* Image */}
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.title ?? ""}
                                        draggable={false}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            pointerEvents: "none",
                                        }}
                                        onError={(e) =>
                                            ((
                                                e.target as HTMLImageElement
                                            ).style.display = "none")
                                        }
                                    />
                                )}

                                {/* Directional lighting */}
                                {lighting && abs > 0 && (
                                    <>
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background: shadeBg,
                                                pointerEvents: "none",
                                                zIndex: 2,
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background:
                                                    off < 0
                                                        ? "linear-gradient(to right, rgba(255,255,255,0.07) 0px, transparent 2px)"
                                                        : "linear-gradient(to left,  rgba(255,255,255,0.07) 0px, transparent 2px)",
                                                pointerEvents: "none",
                                                zIndex: 3,
                                            }}
                                        />
                                    </>
                                )}

                                {/* Text overlay */}
                                {abs === 0 &&
                                    showOverlay &&
                                    (showTitles || showSubtitle) && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background: overlayGradient,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "flex-end",
                                                padding: "24px 20px",
                                                textAlign,
                                                zIndex: 4,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {showTitles && cur.title && (
                                                <div
                                                    style={{
                                                        color: titleColor,
                                                        fontSize: titleSize,
                                                        fontWeight: 600,
                                                        lineHeight: 1.3,
                                                        marginBottom:
                                                            cur.subtitle &&
                                                            showSubtitle
                                                                ? 4
                                                                : 0,
                                                    }}
                                                >
                                                    {cur.title}
                                                </div>
                                            )}
                                            {showSubtitle && cur.subtitle && (
                                                <div
                                                    style={{
                                                        color: subtitleColor,
                                                        fontSize: subtitleSize,
                                                        lineHeight: 1.5,
                                                    }}
                                                >
                                                    {cur.subtitle}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                {/* Shine sweep */}
                                {abs === 0 && shine && shining && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            overflow: "hidden",
                                            pointerEvents: "none",
                                            zIndex: 5,
                                            borderRadius,
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "45%",
                                                height: "100%",
                                                background:
                                                    "linear-gradient(105deg, transparent, rgba(255,255,255,0.12) 50%, transparent)",
                                                animation:
                                                    "dg-shine 0.65s ease-out forwards",
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Arrows */}
                {showArrows && count > 1 && (
                    <>
                        <NavButton dir="prev" onClick={prev} />
                        <NavButton dir="next" onClick={next} />
                    </>
                )}

                {/* Counter */}
                {showCounter && count > 1 && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 16,
                            right: 20,
                            color: "rgba(255,255,255,0.45)",
                            fontSize: 12,
                            fontFamily: "monospace",
                            letterSpacing: "0.08em",
                            zIndex: 20,
                            pointerEvents: "none",
                        }}
                    >
                        {String(active + 1).padStart(2, "0")}
                        <span style={{ opacity: 0.4, margin: "0 4px" }}>/</span>
                        {String(count).padStart(2, "0")}
                    </div>
                )}
            </div>

            {/* ── Dots ──────────────────────────────────────────────────────── */}
            {showDots && count > 1 && (
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        padding: "16px 0",
                        alignItems: "center",
                    }}
                >
                    {items.map((_, i) => (
                        <button
                            key={i}
                            aria-label={`Go to slide ${i + 1}`}
                            onClick={() => goTo(i)}
                            style={{
                                width: i === active ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                background:
                                    i === active
                                        ? "#fff"
                                        : "rgba(255,255,255,0.25)",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                transform:
                                    i === active ? "scaleY(1)" : "scaleY(0.8)",
                                transition: `width ${transitionDuration}ms cubic-bezier(0.16,1,0.3,1), background ${transitionDuration}ms ease, transform ${transitionDuration}ms ease`,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(DepthGallery, {
    items: {
        title: "Items",
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    title: "Title",
                    type: ControlType.String,
                    defaultValue: "Slide Title",
                },
                subtitle: {
                    title: "Subtitle",
                    type: ControlType.String,
                    defaultValue: "A short description",
                },
                image: { title: "Image", type: ControlType.Image },
                link: { title: "Link", type: ControlType.Link },
            },
        },
        defaultValue: [
            { title: "First Slide", subtitle: "Explore the depth effect" },
            {
                title: "Second Slide",
                subtitle: "Each card has its own layer",
            },
            {
                title: "Third Slide",
                subtitle: "Smooth and elegant transitions",
            },
        ],
    },
    cardWidth: {
        title: "Card Width",
        type: ControlType.Number,
        defaultValue: 400,
        min: 160,
        max: 900,
        step: 4,
        unit: "px",
    },
    cardHeight: {
        title: "Card Height",
        type: ControlType.Number,
        defaultValue: 520,
        min: 160,
        max: 900,
        step: 4,
        unit: "px",
    },
    gap: {
        title: "Gap",
        type: ControlType.Number,
        defaultValue: 380,
        min: 80,
        max: 800,
        step: 4,
        unit: "px",
        description: "X distance from center to nearest side card",
    },
    borderRadius: {
        title: "Radius",
        type: ControlType.Number,
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    perspective: {
        title: "Perspective",
        type: ControlType.Number,
        defaultValue: 900,
        min: 300,
        max: 3000,
        step: 50,
        unit: "px",
        description: "Lower = more dramatic",
    },
    sideRotate: {
        title: "Side Rotate Y",
        type: ControlType.Number,
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 1,
        unit: "°",
    },
    sideDepth: {
        title: "Side Depth Z",
        type: ControlType.Number,
        defaultValue: 150,
        min: 0,
        max: 600,
        step: 10,
        unit: "px",
    },
    activeScale: {
        title: "Active Scale",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.8,
        max: 1.2,
        step: 0.01,
    },
    sideScale: {
        title: "Side Scale",
        type: ControlType.Number,
        defaultValue: 0.78,
        min: 0.4,
        max: 1,
        step: 0.01,
    },
    sideOpacity: {
        title: "Side Opacity",
        type: ControlType.Number,
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.01,
    },
    blurAmount: {
        title: "Blur",
        type: ControlType.Number,
        defaultValue: 2.5,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    shadow: {
        title: "Active Shadow",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    lighting: {
        title: "Lighting",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    parallax: {
        title: "Parallax",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    parallaxIntensity: {
        title: "Parallax Intensity",
        type: ControlType.Number,
        defaultValue: 10,
        min: 1,
        max: 30,
        step: 1,
        unit: "°",
        hidden: (props: any) => !props.parallax,
    },
    shine: {
        title: "Shine Sweep",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    transitionDuration: {
        title: "Transition",
        type: ControlType.Number,
        defaultValue: 500,
        min: 100,
        max: 1200,
        step: 10,
        unit: "ms",
    },
    showArrows: {
        title: "Show Arrows",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    showDots: {
        title: "Show Dots",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    showCounter: {
        title: "Show Counter",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    showOverlay: {
        title: "Show Overlay",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    showTitles: {
        title: "Show Title",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    showSubtitle: {
        title: "Show Subtitle",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    overlayGradient: {
        title: "Overlay Gradient",
        type: ControlType.String,
        defaultValue:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
    },
    titleColor: {
        title: "Title Color",
        type: ControlType.Color,
        defaultValue: "#ffffff",
    },
    subtitleColor: {
        title: "Subtitle Color",
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.7)",
    },
    titleSize: {
        title: "Title Size",
        type: ControlType.Number,
        defaultValue: 22,
        min: 10,
        max: 60,
        step: 1,
        unit: "px",
    },
    subtitleSize: {
        title: "Subtitle Size",
        type: ControlType.Number,
        defaultValue: 14,
        min: 10,
        max: 40,
        step: 1,
        unit: "px",
    },
    textAlign: {
        title: "Text Align",
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        defaultValue: "left",
    },
    autoPlay: {
        title: "Auto Play",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    autoPlayInterval: {
        title: "Interval",
        type: ControlType.Number,
        defaultValue: 3,
        min: 1,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: (props: any) => !props.autoPlay,
    },
    loop: {
        title: "Loop",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#0d0d0d",
    },
})
