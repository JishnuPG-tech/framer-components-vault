// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, useCallback } from "react"

// ─── Card fan positions ───────────────────────────────────────────────────────

const POSITIONS = [
    { xRatio: -1.08, z: -80, ry: 12, scale: 0.82, opacity: 0.38, zIndex: 1 },
    { xRatio: -0.56, z: -30, ry: 7, scale: 0.91, opacity: 0.68, zIndex: 2 },
    { xRatio: 0.07, z: 60, ry: 0, scale: 1.0, opacity: 1.0, zIndex: 5 },
    { xRatio: 0.64, z: -30, ry: -7, scale: 0.91, opacity: 0.68, zIndex: 2 },
    { xRatio: 1.09, z: -80, ry: -12, scale: 0.82, opacity: 0.38, zIndex: 1 },
]

function getPos(i: number, current: number, total: number): number {
    const offset = (((i - current) % total) + total) % total
    if (offset === 0) return 2
    if (offset === 1) return 3
    if (offset === 2) return 4
    if (offset === total - 1) return 1
    if (offset === total - 2) return 0
    return -1
}

// ─── Colour helper ────────────────────────────────────────────────────────────

function toRgb(color: string): string {
    if (!color) return "0,0,0"
    if (color.startsWith("rgb")) return color
    const hex = color.replace("#", "")
    const full =
        hex.length === 3
            ? hex
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : hex
    return `${parseInt(full.slice(0, 2), 16)},${parseInt(full.slice(2, 4), 16)},${parseInt(full.slice(4, 6), 16)}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlideData {
    tag: string
    title: string
    subtitle: string
    // ✅ ResponsiveImage yields { src, srcSet, alt, ... } or a plain string
    image: string | { src: string; srcSet?: string; alt?: string }
    gradientFrom: string
    gradientTo: string
    overlayColor: string
    overlayOpacity: number
    accentColor: string
}

interface Props {
    slides: SlideData[]
    titleFont: string
    uiFont: string
    cardWidth: number
    cardHeight: number
    cardRadius: number
    perspective: number
    autoPlay: boolean
    autoPlayInterval: number
    showDots: boolean
    showCounter: boolean
    showProgressRing: boolean
    showCustomCursor: boolean
    showLabel: boolean
    labelText: string
    transparentBackground: boolean
    backgroundColor: string
    controlsGap: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CinematicCarousel(props: Props) {
    const {
        slides = [],
        // ControlType.Font delivers a full CSS font shorthand.
        // We fall back to sensible system stacks when undefined
        // (i.e. before the user picks anything in the panel).
        titleFont,
        uiFont,
        cardWidth = 300,
        cardHeight = 390,
        cardRadius = 12,
        perspective = 1200,
        autoPlay = true,
        autoPlayInterval = 4500,
        showDots = true,
        showCounter = true,
        showProgressRing = true,
        showCustomCursor = true,
        showLabel = true,
        labelText = "Featured Collection",
        transparentBackground = false,
        backgroundColor = "#090909",
        controlsGap = 24,
    } = props

    // ControlType.Font returns a style object { fontFamily, fontWeight, ... }.
    // We spread it onto elements but strip fontSize so our size steppers win.
    const titleFontFamily =
        getFontFamily(titleFont) || "'Playfair Display', serif"
    const titleFontStyles = getFontStyles(titleFont)
    const uiFontFamily = getFontFamily(uiFont) || "'DM Mono', monospace"
    const uiFontStyles = getFontStyles(uiFont)

    const safeSlides: SlideData[] =
        slides.length > 0
            ? slides
            : [
                  {
                      tag: "Add slides in the panel →",
                      title: "Your Title Here",
                      subtitle: "A short description that reveals on hover.",
                      image: "",
                      gradientFrom: "#1a0a2e",
                      gradientTo: "#0f3460",
                      overlayColor: "#000000",
                      overlayOpacity: 55,
                      accentColor: "#7b61ff",
                  },
              ]

    const [current, setCurrent] = useState(0)
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [progress, setProgress] = useState(0)

    const rootRef = useRef<HTMLDivElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const dotElRef = useRef<HTMLDivElement>(null)
    const ringElRef = useRef<HTMLDivElement>(null)
    const rafRef = useRef<number>(0)
    const progressRef = useRef(0)
    const lastTimeRef = useRef(performance.now())
    const mouseRef = useRef({ x: 0, y: 0 })
    const cursorRef = useRef({ x: 0, y: 0 })
    const ringPosRef = useRef({ x: 0, y: 0 })
    const visibleRef = useRef(false)
    const touchRef = useRef(0)

    const goTo = useCallback(
        (delta: number) => {
            setCurrent(
                (c) =>
                    (((c + delta) % safeSlides.length) + safeSlides.length) %
                    safeSlides.length
            )
            progressRef.current = 0
            lastTimeRef.current = performance.now()
        },
        [safeSlides.length]
    )

    useEffect(() => {
        setCurrent((c) => Math.min(c, safeSlides.length - 1))
    }, [safeSlides.length])

    useEffect(() => {
        const loop = (now: number) => {
            const m = mouseRef.current,
                c = cursorRef.current,
                r = ringPosRef.current
            c.x += (m.x - c.x) * 0.18
            c.y += (m.y - c.y) * 0.18
            r.x += (m.x - r.x) * 0.08
            r.y += (m.y - r.y) * 0.08
            if (dotElRef.current && showCustomCursor) {
                dotElRef.current.style.left = c.x + "px"
                dotElRef.current.style.top = c.y + "px"
            }
            if (ringElRef.current && showCustomCursor) {
                ringElRef.current.style.left = r.x + "px"
                ringElRef.current.style.top = r.y + "px"
            }

            if (wrapperRef.current && rootRef.current && visibleRef.current) {
                const w = rootRef.current.offsetWidth || 800
                const h = rootRef.current.offsetHeight || 560
                wrapperRef.current.style.transform = `rotateX(${(m.y / h - 0.5) * -4}deg) rotateY(${(m.x / w - 0.5) * 6}deg)`
            }

            if (autoPlay) {
                const dt = now - lastTimeRef.current
                lastTimeRef.current = now
                progressRef.current = Math.min(
                    progressRef.current + dt / Math.max(autoPlayInterval, 500),
                    1
                )
                setProgress(progressRef.current)
                if (progressRef.current >= 1) {
                    progressRef.current = 0
                    setCurrent((c) => (c + 1) % safeSlides.length)
                }
            } else {
                lastTimeRef.current = now
            }
            rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(rafRef.current)
    }, [autoPlay, autoPlayInterval, safeSlides.length, showCustomCursor])

    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const r = rootRef.current?.getBoundingClientRect()
        if (r)
            mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onEnter = () => {
        visibleRef.current = true
        if (dotElRef.current) dotElRef.current.style.opacity = "1"
        if (ringElRef.current) ringElRef.current.style.opacity = "1"
    }
    const onLeave = () => {
        visibleRef.current = false
        if (dotElRef.current) dotElRef.current.style.opacity = "0"
        if (ringElRef.current) ringElRef.current.style.opacity = "0"
        if (wrapperRef.current)
            wrapperRef.current.style.transform = "rotateX(0deg) rotateY(0deg)"
    }
    const onTouchStart = (e: React.TouchEvent) => {
        touchRef.current = e.touches[0].clientX
    }
    const onTouchEnd = (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchRef.current
        if (Math.abs(dx) > 40) goTo(dx < 0 ? 1 : -1)
    }

    const circ = 2 * Math.PI * 14
    const dashOff = circ * (1 - progress)
    const HEADER_H = 52
    const NAV_H = 42 // height of the nav buttons themselves
    const CONTROLS_H = controlsGap + NAV_H // gap between cards and nav + nav height
    const totalH = HEADER_H + cardHeight + CONTROLS_H

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: totalH,
                background: transparentBackground
                    ? "transparent"
                    : backgroundColor,
                borderRadius: transparentBackground ? 0 : 16,
                overflow: "hidden",
                cursor: showCustomCursor ? "none" : "default",
                ...uiFontStyles,
                fontFamily: uiFontFamily,
            }}
            onMouseMove={onMouseMove}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Grain overlay — hidden when background is transparent */}
            {!transparentBackground && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 10,
                        opacity: 0.04,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }}
                />
            )}

            {/* Cursor */}
            {showCustomCursor && (
                <>
                    <div
                        ref={dotElRef}
                        style={{
                            position: "absolute",
                            width: 10,
                            height: 10,
                            background: "#fff",
                            borderRadius: "50%",
                            transform: "translate(-50%,-50%)",
                            pointerEvents: "none",
                            zIndex: 100,
                            mixBlendMode: "difference",
                            opacity: 0,
                            transition: "opacity 0.2s",
                        }}
                    />
                    <div
                        ref={ringElRef}
                        style={{
                            position: "absolute",
                            width: 44,
                            height: 44,
                            border: "1px solid rgba(255,255,255,0.38)",
                            borderRadius: "50%",
                            transform: "translate(-50%,-50%)",
                            pointerEvents: "none",
                            zIndex: 99,
                            opacity: 0,
                            transition:
                                "opacity 0.2s, width 0.4s cubic-bezier(.23,1,.32,1), height 0.4s cubic-bezier(.23,1,.32,1)",
                        }}
                    />
                </>
            )}

            {/* Label */}
            {showLabel && (
                <div
                    style={{
                        position: "absolute",
                        top: 24,
                        left: 28,
                        zIndex: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <div
                        style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#fff",
                            opacity: 0.5,
                        }}
                    />
                    <span
                        style={{
                            fontSize: 9,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.35)",
                            ...uiFontStyles,
                            fontFamily: uiFontFamily,
                        }}
                    >
                        {labelText}
                    </span>
                </div>
            )}

            {/* Counter */}
            {showCounter && (
                <div
                    style={{
                        position: "absolute",
                        top: 24,
                        right: 28,
                        zIndex: 20,
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        color: "rgba(255,255,255,0.3)",
                        ...uiFontStyles,
                        fontFamily: uiFontFamily,
                    }}
                >
                    <span style={{ color: "rgba(255,255,255,0.85)" }}>
                        {String(current + 1).padStart(2, "0")}
                    </span>{" "}
                    / {String(safeSlides.length).padStart(2, "0")}
                </div>
            )}

            {/* Cards track */}
            <div
                style={{
                    position: "absolute",
                    top: HEADER_H,
                    left: 0,
                    right: 0,
                    height: cardHeight,
                    perspective,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    ref={wrapperRef}
                    style={{
                        position: "relative",
                        width: cardWidth + 40,
                        height: cardHeight,
                        transformStyle: "preserve-3d",
                        transition: "transform 0.12s ease-out",
                    }}
                >
                    {safeSlides.map((slide, i) => {
                        const pos = getPos(i, current, safeSlides.length)
                        const visible = pos !== -1
                        const p = visible ? POSITIONS[pos] : POSITIONS[0]
                        const isActive = pos === 2
                        const isHov = hoveredCard === i && isActive

                        // ✅ Handle ResponsiveImage object or plain string URL
                        const imgSrc = slide.image
                            ? typeof slide.image === "object"
                                ? ((slide.image as any).src ?? "")
                                : slide.image
                            : ""
                        const imgAlt =
                            slide.image &&
                            typeof slide.image === "object" &&
                            (slide.image as any).alt
                                ? (slide.image as any).alt
                                : (slide.title ?? "")
                        const hasImg = Boolean(imgSrc)

                        const ovRgb = toRgb(slide.overlayColor ?? "#000000")
                        const ovAlpha = (
                            (slide.overlayOpacity ?? 55) / 100
                        ).toFixed(2)

                        return (
                            <div
                                key={i}
                                onClick={() => {
                                    if (!isActive && visible) goTo(i - current)
                                }}
                                onMouseEnter={() => setHoveredCard(i)}
                                onMouseLeave={() => setHoveredCard(null)}
                                style={{
                                    position: "absolute",
                                    width: cardWidth,
                                    height: cardHeight,
                                    borderRadius: cardRadius,
                                    overflow: "hidden",
                                    left: "50%",
                                    marginLeft: -(cardWidth / 2),
                                    transformOrigin: "center center",
                                    transform: visible
                                        ? `translateX(${p.xRatio * cardWidth}px) translateZ(${p.z}px) rotateY(${p.ry}deg) scale(${p.scale})`
                                        : "translateX(0) translateZ(-200px) scale(0.7)",
                                    opacity: visible ? p.opacity : 0,
                                    zIndex: visible ? p.zIndex : 0,
                                    filter: isActive
                                        ? "brightness(1)"
                                        : "brightness(0.6)",
                                    transition:
                                        "transform 0.8s cubic-bezier(.23,1,.32,1), opacity 0.8s cubic-bezier(.23,1,.32,1), filter 0.8s cubic-bezier(.23,1,.32,1)",
                                    cursor: showCustomCursor
                                        ? "none"
                                        : isActive
                                          ? "default"
                                          : "pointer",
                                }}
                            >
                                {/* Background — image or gradient */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        transform: isHov
                                            ? "scale(1.06)"
                                            : "scale(1)",
                                        transition:
                                            "transform 0.65s cubic-bezier(.23,1,.32,1)",
                                    }}
                                >
                                    {hasImg ? (
                                        <img
                                            src={imgSrc}
                                            // ✅ alt text forwarded from ResponsiveImage
                                            alt={imgAlt}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                                pointerEvents: "none",
                                                userSelect: "none",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                background: `linear-gradient(145deg, ${slide.gradientFrom} 0%, ${slide.gradientTo} 100%)`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    bottom: -40,
                                                    right: -40,
                                                    width: 200,
                                                    height: 200,
                                                    borderRadius: "50%",
                                                    background: `radial-gradient(circle, ${slide.accentColor}33 0%, transparent 70%)`,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Readability overlay */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 2,
                                        background: `linear-gradient(to bottom, rgba(${ovRgb},${ovAlpha}) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)`,
                                    }}
                                />

                                {/* Accent rings */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 22,
                                        right: 22,
                                        width: 54,
                                        height: 54,
                                        borderRadius: "50%",
                                        border: `1px solid ${slide.accentColor}44`,
                                        pointerEvents: "none",
                                        zIndex: 3,
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 29,
                                        right: 29,
                                        width: 40,
                                        height: 40,
                                        borderRadius: "50%",
                                        border: `1px solid ${slide.accentColor}22`,
                                        pointerEvents: "none",
                                        zIndex: 3,
                                    }}
                                />

                                {/* Text content */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: "24px 22px",
                                        zIndex: 4,
                                        transform: isHov
                                            ? "translateY(0)"
                                            : "translateY(5px)",
                                        transition:
                                            "transform 0.5s cubic-bezier(.23,1,.32,1)",
                                    }}
                                >
                                    <div
                                        style={{
                                            letterSpacing: "0.18em",
                                            textTransform: "uppercase",
                                            color: "rgba(255,255,255,0.55)",
                                            marginBottom: 7,
                                            ...uiFontStyles,
                                            fontFamily: uiFontFamily,
                                        }}
                                    >
                                        {slide.tag}
                                    </div>
                                    <div
                                        style={{
                                            width: isHov ? 46 : 22,
                                            height: 1,
                                            background: isHov
                                                ? "#fff"
                                                : "rgba(255,255,255,0.38)",
                                            marginBottom: 9,
                                            transition:
                                                "width 0.4s cubic-bezier(.23,1,.32,1), background 0.3s",
                                        }}
                                    />
                                    <div
                                        style={{
                                            ...titleFontStyles,
                                            fontFamily: titleFontFamily,
                                            fontWeight:
                                                titleFontStyles.fontWeight ??
                                                700,
                                            color: "#fff",
                                            lineHeight: 1.2,
                                            marginBottom: 9,
                                        }}
                                    >
                                        {slide.title}
                                    </div>
                                    <div
                                        style={{
                                            letterSpacing: "0.05em",
                                            color: "rgba(255,255,255,0.5)",
                                            lineHeight: 1.65,
                                            ...uiFontStyles,
                                            fontFamily: uiFontFamily,
                                            maxHeight: isHov ? 72 : 0,
                                            overflow: "hidden",
                                            opacity: isHov ? 1 : 0,
                                            transition:
                                                "max-height 0.5s cubic-bezier(.23,1,.32,1), opacity 0.45s",
                                        }}
                                    >
                                        {slide.subtitle}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Nav */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: CONTROLS_H,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                    zIndex: 20,
                }}
            >
                <NavBtn onClick={() => goTo(-1)} noCursor={showCustomCursor}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </NavBtn>
                {showDots && (
                    <div
                        style={{
                            display: "flex",
                            gap: 7,
                            alignItems: "center",
                        }}
                    >
                        {safeSlides.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => goTo(i - current)}
                                style={{
                                    width: i === current ? 18 : 4,
                                    height: 4,
                                    borderRadius: i === current ? 3 : "50%",
                                    background:
                                        i === current
                                            ? "#fff"
                                            : "rgba(255,255,255,0.25)",
                                    cursor: showCustomCursor
                                        ? "none"
                                        : "pointer",
                                    transition:
                                        "width 0.4s cubic-bezier(.23,1,.32,1), background 0.3s",
                                }}
                            />
                        ))}
                    </div>
                )}
                <NavBtn onClick={() => goTo(1)} noCursor={showCustomCursor}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </NavBtn>
            </div>

            {/* Progress ring */}
            {showProgressRing && (
                <svg
                    style={{
                        position: "absolute",
                        bottom: 18,
                        right: 28,
                        zIndex: 20,
                    }}
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                >
                    <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1.5"
                    />
                    <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth="1.5"
                        strokeDasharray={circ}
                        strokeDashoffset={dashOff}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                        style={{ transition: "stroke-dashoffset 0.06s linear" }}
                    />
                </svg>
            )}
        </div>
    )
}

// ─── Font helpers ─────────────────────────────────────────────────────────────
// ControlType.Font returns a React style object:
//   { fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, ... }
// We spread it onto elements but override fontSize with our own size stepper
// so the dedicated size controls keep working independently.

type FontValue = Record<string, any> | string | undefined

function getFontFamily(font: FontValue): string {
    if (!font) return ""
    if (typeof font === "object") return font.fontFamily ?? ""
    return "" // plain string fallback — shouldn't occur with ControlType.Font
}

function getFontStyles(font: FontValue): Record<string, any> {
    if (!font || typeof font !== "object") return {}
    return { ...font }
}

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavBtn({
    onClick,
    children,
    noCursor,
}: {
    onClick: () => void
    children: React.ReactNode
    noCursor: boolean
}) {
    const [hov, setHov] = useState(false)
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                outline: "none",
                border: `1px solid ${hov ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.16)"}`,
                background: hov
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.7)",
                cursor: noCursor ? "none" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                transform: hov ? "scale(1.08)" : "scale(1)",
                transition:
                    "background 0.25s, border-color 0.25s, transform 0.2s",
            }}
        >
            {children}
        </button>
    )
}

// ─── Property controls ────────────────────────────────────────────────────────

addPropertyControls(CinematicCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                tag: {
                    type: ControlType.String,
                    title: "Tag",
                    defaultValue: "Category · Year",
                    placeholder: "e.g. Architecture · 2025",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Slide Title",
                    placeholder: "Your headline",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "A short description that reveals on hover.",
                    placeholder: "Description…",
                },
                // ✅ ResponsiveImage: gives srcSet, alt, and proper Framer asset handling
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                gradientFrom: {
                    type: ControlType.Color,
                    title: "Grad. Start",
                    defaultValue: "#1a0a2e",
                },
                gradientTo: {
                    type: ControlType.Color,
                    title: "Grad. End",
                    defaultValue: "#0f3460",
                },
                overlayColor: {
                    type: ControlType.Color,
                    title: "Overlay Color",
                    defaultValue: "#000000",
                },
                overlayOpacity: {
                    type: ControlType.Number,
                    title: "Overlay Opacity",
                    defaultValue: 55,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
                accentColor: {
                    type: ControlType.Color,
                    title: "Accent",
                    defaultValue: "#7b61ff",
                },
            },
        },
        defaultValue: [
            {
                tag: "Architecture · 2025",
                title: "The Obsidian Tower",
                subtitle: "Where brutalist form meets digital geometry.",
                image: "",
                gradientFrom: "#1a0a2e",
                gradientTo: "#0f3460",
                overlayColor: "#000000",
                overlayOpacity: 50,
                accentColor: "#7b61ff",
            },
            {
                tag: "Photography · Series II",
                title: "Neon Meridian",
                subtitle: "A journey through light-polluted cityscapes.",
                image: "",
                gradientFrom: "#1a0a0a",
                gradientTo: "#3d0000",
                overlayColor: "#000000",
                overlayOpacity: 50,
                accentColor: "#ff3b3b",
            },
            {
                tag: "Industrial · Design",
                title: "Copper & Void",
                subtitle: "Material studies from the foundry floor.",
                image: "",
                gradientFrom: "#1c1207",
                gradientTo: "#3d2600",
                overlayColor: "#000000",
                overlayOpacity: 50,
                accentColor: "#e8850a",
            },
            {
                tag: "Nature · Film",
                title: "Depths Unknown",
                subtitle: "The bioluminescent frontier beneath the waves.",
                image: "",
                gradientFrom: "#041f1a",
                gradientTo: "#063d30",
                overlayColor: "#000000",
                overlayOpacity: 50,
                accentColor: "#00e5a0",
            },
            {
                tag: "Sculpture · 2025",
                title: "Marble & Static",
                subtitle: "Ancient forms fractured by digital interference.",
                image: "",
                gradientFrom: "#181818",
                gradientTo: "#2a2a2a",
                overlayColor: "#000000",
                overlayOpacity: 50,
                accentColor: "#e0e0e0",
            },
        ],
    },

    // ─── Typography ──────────────────────────────────────────────
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
    },
    uiFont: {
        type: ControlType.Font,
        title: "UI / Tag Font",
        controls: "extended",
    },

    // ─── Layout ──────────────────────────────────────────────────
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 300,
        min: 180,
        max: 520,
        step: 4,
        displayStepper: true,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 390,
        min: 200,
        max: 680,
        step: 4,
        displayStepper: true,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1200,
        min: 400,
        max: 3000,
        step: 100,
        displayStepper: true,
    },
    controlsGap: {
        type: ControlType.Number,
        title: "Controls Gap",
        defaultValue: 24,
        min: 8,
        max: 80,
        step: 2,
        displayStepper: true,
    },

    // ─── Behaviour ───────────────────────────────────────────────
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
    },
    autoPlayInterval: {
        type: ControlType.Number,
        title: "Interval (ms)",
        defaultValue: 4500,
        min: 1000,
        max: 12000,
        step: 250,
        displayStepper: true,
        hidden: (p) => !p.autoPlay,
    },

    // ─── UI chrome ───────────────────────────────────────────────
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        defaultValue: true,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Show Counter",
        defaultValue: true,
    },
    showProgressRing: {
        type: ControlType.Boolean,
        title: "Progress Ring",
        defaultValue: true,
    },
    showCustomCursor: {
        type: ControlType.Boolean,
        title: "Custom Cursor",
        defaultValue: true,
    },
    showLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
    },
    labelText: {
        type: ControlType.String,
        title: "Label Text",
        defaultValue: "Featured Collection",
        hidden: (p) => !p.showLabel,
    },

    // ─── Theme ───────────────────────────────────────────────────
    transparentBackground: {
        type: ControlType.Boolean,
        title: "Transparent BG",
        defaultValue: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#090909",
        hidden: (p) => p.transparentBackground,
        description:
            "Get more Framer stuff at [Framerbitz](https://contra.com/AndrewNorman/products?r=AndrewNorman/)",
    },
})
