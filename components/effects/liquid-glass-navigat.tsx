// User instructions: Create a premium, highly customizable Responsive Navigation Bar component for Framer inspired by modern Apple iOS glassmorphism and liquid-glass design. Fully responsive across Desktop/Tablet/Mobile, optional sticky with configurable offset, glass background with blur/noise/highlights and configurable opacity, smooth hover interactions with liquid bubble indicator that follows cursor with spring physics, persistent active indicator animating between items, unlimited nav links, full-screen mobile overlay menu with open/close animations and staggered items, optional CTA button, logo image upload support, light/dark mode, accessibility with keyboard navigation and focus states, performance optimized with hardware-accelerated animations, page-load reveal, and background becomes slightly more opaque when scrolling.

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
    AnimatePresence,
    LayoutGroup,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion"
import { createPortal } from "react-dom"

type Mode = "light" | "dark"

type NavItem = {
    label: string
    link: string
}

type ResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

interface LiquidGlassNavBarProps {
    logoImage?: ResponsiveImage
    logoWidth: number

    items: NavItem[]
    activeItem: number

    showCTA: boolean
    ctaText: string
    ctaLink: string

    sticky: boolean
    stickyOffset: number

    navHeight: number
    cornerRadius: number

    backgroundOpacity: number
    blurStrength: number

    bubbleColor: string
    bubbleOpacity: number
    bubbleScale: number

    hoverAnimationSpeed: number
    springStiffness: number
    springDamping: number

    textColor: string
    activeTextColor: string

    mobileBreakpoint: number
    mode: Mode

    navFont: any
    ctaFont: any

    style?: React.CSSProperties
}

const NOISE_DATA_URL =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.26'/%3E%3C/svg%3E"

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function rgbaFromMode(mode: Mode, opacity: number) {
    const o = clamp(opacity, 0, 1)
    if (mode === "dark") return `rgba(14, 14, 16, ${o})`
    return `rgba(255, 255, 255, ${o})`
}

function safeItems(items: NavItem[]): NavItem[] {
    const base = Array.isArray(items) ? items : []
    const cleaned = base
        .map((it) => ({
            label:
                typeof it?.label === "string" && it.label.trim()
                    ? it.label
                    : "Item",
            link:
                typeof it?.link === "string" && it.link.trim() ? it.link : "#",
        }))
        .filter((it) => it.label.trim().length > 0)

    return cleaned.length ? cleaned : [{ label: "Home", link: "#" }]
}

/**
 * Liquid Glass Navigation Bar
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 80
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function LiquidGlassNavBar(props: LiquidGlassNavBarProps) {
    const isStatic = useIsStaticRenderer()

    const {
        logoImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Logo",
        },
        logoWidth,

        items,
        activeItem,

        showCTA,
        ctaText,
        ctaLink,

        sticky,
        stickyOffset,

        navHeight,
        cornerRadius,

        backgroundOpacity,
        blurStrength,

        bubbleColor,
        bubbleOpacity,
        bubbleScale,

        hoverAnimationSpeed,
        springStiffness,
        springDamping,

        textColor,
        activeTextColor,

        mobileBreakpoint,
        mode,

        navFont,
        ctaFont,

        style,
    } = props

    const canAnimate =
        !isStatic && RenderTarget.current() !== RenderTarget.thumbnail

    const itemsSafe = React.useMemo(() => safeItems(items), [items])
    const activeIndex = React.useMemo(() => {
        const idx = Number.isFinite(activeItem) ? Math.floor(activeItem) : 0
        return clamp(idx, 0, Math.max(0, itemsSafe.length - 1))
    }, [activeItem, itemsSafe.length])

    const [isMobile, setIsMobile] = React.useState(false)
    const [mobileOpen, setMobileOpen] = React.useState(false)
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
    const [scrolled, setScrolled] = React.useState(false)
    const [canPortal, setCanPortal] = React.useState(false)

    const closeMobile = React.useCallback(() => {
        React.startTransition(() => setMobileOpen(false))
    }, [])

    const toggleMobile = React.useCallback(() => {
        React.startTransition(() => setMobileOpen((v) => !v))
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const mq = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`) // inclusive
        const update = () =>
            React.startTransition(() => setIsMobile(!!mq.matches))
        update()

        if (typeof mq.addEventListener === "function")
            mq.addEventListener("change", update)
        else mq.addListener(update)

        return () => {
            if (typeof mq.removeEventListener === "function")
                mq.removeEventListener("change", update)
            else mq.removeListener(update)
        }
    }, [mobileBreakpoint])

    React.useEffect(() => {
        if (typeof document === "undefined") return
        React.startTransition(() => setCanPortal(true))
    }, [])

    React.useEffect(() => {
        if (!isMobile) React.startTransition(() => setMobileOpen(false))
    }, [isMobile])

    React.useEffect(() => {
        if (typeof document === "undefined") return
        if (!mobileOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = prev
        }
    }, [mobileOpen])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!sticky || isStatic) return

        const onScroll = () => {
            const y = window.scrollY || 0
            React.startTransition(() => setScrolled(y > 8))
        }

        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [sticky, isStatic])

    // Magnetic cursor-following offset for the bubble highlight
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const xSpring = useSpring(mouseX, {
        stiffness: springStiffness,
        damping: springDamping,
        mass: 0.7,
    })

    const ySpring = useSpring(mouseY, {
        stiffness: springStiffness,
        damping: springDamping,
        mass: 0.7,
    })

    const bubbleOffsetX = useTransform(xSpring, (v) => clamp(v, -14, 14))
    const bubbleOffsetY = useTransform(ySpring, (v) => clamp(v, -8, 8))

    const updateMagneticFromEvent = React.useCallback(
        (e: React.MouseEvent, el: HTMLElement | null) => {
            if (!el) return
            const rect = el.getBoundingClientRect()
            const px = (e.clientX - rect.left) / Math.max(1, rect.width)
            const py = (e.clientY - rect.top) / Math.max(1, rect.height)
            mouseX.set((px - 0.5) * 28)
            mouseY.set((py - 0.5) * 16)
        },
        [mouseX, mouseY]
    )

    const clearMagnetic = React.useCallback(() => {
        mouseX.set(0)
        mouseY.set(0)
    }, [mouseX, mouseY])

    const borderColor =
        mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"

    const glassBackground = scrolled
        ? rgbaFromMode(mode, clamp(backgroundOpacity + 0.12, 0, 1))
        : rgbaFromMode(mode, backgroundOpacity)

    const containerRadius = `${cornerRadius}px`

    const fastTransition = React.useMemo(
        () =>
            ({
                type: "tween" as const,
                duration: clamp(hoverAnimationSpeed, 0.08, 0.8),
                ease: [0.22, 1, 0.36, 1] as const,
            }) as const,
        [hoverAnimationSpeed]
    )

    const springTransition = React.useMemo(
        () =>
            ({
                type: "spring" as const,
                stiffness: springStiffness,
                damping: springDamping,
                mass: 0.7,
            }) as const,
        [springStiffness, springDamping]
    )

    const navPositionStyle: React.CSSProperties = React.useMemo(() => {
        if (!sticky) return { position: "relative" }
        return { position: "sticky", top: stickyOffset, zIndex: 1000 }
    }, [sticky, stickyOffset])

    const currentIndicatorIndex = hoveredIndex ?? activeIndex

    const mobileOverlay = (
        <AnimatePresence>
            {isMobile && mobileOpen && (
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Mobile navigation"
                    initial={canAnimate ? { opacity: 0 } : false}
                    animate={canAnimate ? { opacity: 1 } : undefined}
                    exit={canAnimate ? { opacity: 0 } : undefined}
                    transition={canAnimate ? fastTransition : undefined}
                    style={{
                        position: "fixed",
                        left: 0,
                        top: 0,
                        width: "100vw",
                        height: "100vh",
                        padding: 16,
                        boxSizing: "border-box",
                        background: rgbaFromMode(
                            mode,
                            clamp(backgroundOpacity + 0.1, 0, 1)
                        ),
                        backdropFilter: `blur(${blurStrength + 10}px) saturate(170%)`,
                        WebkitBackdropFilter: `blur(${blurStrength + 10}px) saturate(170%)`,
                        zIndex: 10000,
                        overflow: "hidden",
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") closeMobile()
                    }}
                >
                    <div
                        aria-hidden
                        style={{
                            pointerEvents: "none",
                            position: "absolute",
                            inset: 0,
                            background:
                                mode === "dark"
                                    ? "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 60%)"
                                    : "linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.00) 60%)",
                            opacity: 0.55,
                        }}
                    />
                    <div
                        aria-hidden
                        style={{
                            pointerEvents: "none",
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${NOISE_DATA_URL})`,
                            backgroundSize: "220px 220px",
                            opacity: mode === "dark" ? 0.2 : 0.16,
                            mixBlendMode:
                                mode === "dark" ? "overlay" : "multiply",
                        }}
                    />

                    <div
                        style={{
                            position: "relative",
                            zIndex: 1,
                            height: "100%",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 6px 14px 6px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <img
                                    src={logoImage?.src}
                                    srcSet={logoImage?.srcSet}
                                    alt={logoImage?.alt || ""}
                                    style={{
                                        width: logoWidth,
                                        height: "auto",
                                        display: "block",
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                aria-label="Close menu"
                                onClick={closeMobile}
                                style={{
                                    height: 42,
                                    width: 46,
                                    borderRadius: 14,
                                    border: `1px solid ${borderColor}`,
                                    background:
                                        mode === "dark"
                                            ? "rgba(255,255,255,0.06)"
                                            : "rgba(255,255,255,0.55)",
                                    color: textColor,
                                    cursor: "pointer",
                                    outline: "none",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <motion.div
                            initial={canAnimate ? "hidden" : false}
                            animate={canAnimate ? "show" : undefined}
                            exit={canAnimate ? "hidden" : undefined}
                            variants={{
                                hidden: {},
                                show: {
                                    transition: {
                                        staggerChildren: 0.06,
                                        delayChildren: 0.05,
                                    },
                                },
                            }}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                padding: 8,
                            }}
                        >
                            {itemsSafe.map((item, i) => {
                                const isActive = i === activeIndex
                                return (
                                    <motion.a
                                        key={`${item.label}-${i}-mobile`}
                                        href={isStatic ? undefined : item.link}
                                        onClick={(e) => {
                                            if (isStatic) e.preventDefault()
                                            closeMobile()
                                        }}
                                        variants={{
                                            hidden: { opacity: 0, y: 8 },
                                            show: { opacity: 1, y: 0 },
                                        }}
                                        transition={
                                            canAnimate
                                                ? fastTransition
                                                : undefined
                                        }
                                        style={{
                                            textDecoration: "none",
                                            padding: "14px 14px",
                                            borderRadius: 18,
                                            border: `1px solid ${borderColor}`,
                                            background: isActive
                                                ? rgbaFromMode(
                                                      mode,
                                                      clamp(
                                                          backgroundOpacity +
                                                              0.22,
                                                          0,
                                                          1
                                                      )
                                                  )
                                                : rgbaFromMode(
                                                      mode,
                                                      clamp(
                                                          backgroundOpacity +
                                                              0.12,
                                                          0,
                                                          1
                                                      )
                                                  ),
                                            color: isActive
                                                ? activeTextColor
                                                : textColor,
                                            backdropFilter: `blur(${blurStrength}px)`,
                                            WebkitBackdropFilter: `blur(${blurStrength}px)`,
                                            transform: "translateZ(0)",
                                            outline: "none",
                                            ...navFont,
                                            fontSize: "18px",
                                        }}
                                        onMouseEnter={() =>
                                            React.startTransition(() =>
                                                setHoveredIndex(i)
                                            )
                                        }
                                        onMouseLeave={() =>
                                            React.startTransition(() =>
                                                setHoveredIndex(null)
                                            )
                                        }
                                    >
                                        {item.label}
                                    </motion.a>
                                )
                            })}

                            {showCTA && (
                                <motion.a
                                    href={isStatic ? undefined : ctaLink}
                                    onClick={(e) => {
                                        if (isStatic) e.preventDefault()
                                        closeMobile()
                                    }}
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        show: { opacity: 1, y: 0 },
                                    }}
                                    transition={
                                        canAnimate ? fastTransition : undefined
                                    }
                                    style={{
                                        marginTop: 8,
                                        textDecoration: "none",
                                        padding: "14px 14px",
                                        borderRadius: 18,
                                        border: `1px solid ${borderColor}`,
                                        background:
                                            mode === "dark"
                                                ? "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06))"
                                                : "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0.60))",
                                        color:
                                            mode === "dark"
                                                ? "rgba(255,255,255,0.95)"
                                                : "rgba(0,0,0,0.92)",
                                        boxShadow:
                                            mode === "dark"
                                                ? "inset 0 1px 0 rgba(255,255,255,0.16), 0 18px 28px rgba(0,0,0,0.35)"
                                                : "inset 0 1px 0 rgba(255,255,255,0.65), 0 18px 28px rgba(0,0,0,0.12)",
                                        transform: "translateZ(0)",
                                        outline: "none",
                                        ...ctaFont,
                                        fontSize: "18px",
                                    }}
                                >
                                    {ctaText}
                                </motion.a>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )

    return (
        <motion.nav
            aria-label="Primary"
            initial={canAnimate ? { opacity: 0, y: -10 } : false}
            animate={canAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={
                canAnimate
                    ? {
                          type: "tween",
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1],
                      }
                    : undefined
            }
            style={{
                ...navPositionStyle,
                position: navPositionStyle.position as any,
                width: "100%",
                height: navHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                boxSizing: "border-box",
                borderRadius: containerRadius,
                overflow: "hidden",
                background: glassBackground,
                border: `1px solid ${borderColor}`,
                boxShadow:
                    mode === "dark"
                        ? "0 10px 30px rgba(0,0,0,0.35)"
                        : "0 10px 30px rgba(0,0,0,0.10)",
                backdropFilter: `blur(${blurStrength}px) saturate(160%)`,
                WebkitBackdropFilter: `blur(${blurStrength}px) saturate(160%)`,
                transform: "translateZ(0)",
                willChange: "transform, background",
                ...style,
            }}
        >
            {/* Highlights */}
            <div
                aria-hidden
                style={{
                    pointerEvents: "none",
                    position: "absolute",
                    inset: 0,
                    background:
                        mode === "dark"
                            ? "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 55%), radial-gradient(70% 120% at 20% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 60%)"
                            : "linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.00) 52%), radial-gradient(70% 120% at 20% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.00) 60%)",
                    opacity: mode === "dark" ? 0.65 : 0.45,
                    mixBlendMode: mode === "dark" ? "screen" : "normal",
                }}
            />

            {/* Noise */}
            <div
                aria-hidden
                style={{
                    pointerEvents: "none",
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${NOISE_DATA_URL})`,
                    backgroundSize: "180px 180px",
                    opacity: mode === "dark" ? 0.18 : 0.14,
                    mixBlendMode: mode === "dark" ? "overlay" : "multiply",
                }}
            />

            {/* Left: Logo */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minWidth: "max-content",
                    zIndex: 2,
                }}
            >
                <a
                    href={isStatic ? undefined : "#"}
                    aria-label="Home"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textDecoration: "none",
                        color: textColor,
                        outline: "none",
                        borderRadius: 10,
                        padding: "6px 8px",
                    }}
                    onClick={(e) => {
                        if (isStatic) e.preventDefault()
                        closeMobile()
                    }}
                >
                    <img
                        src={logoImage?.src}
                        srcSet={logoImage?.srcSet}
                        alt={logoImage?.alt || ""}
                        style={{
                            width: logoWidth,
                            height: "auto",
                            display: "block",
                            objectFit: "contain",
                            filter: mode === "dark" ? "saturate(1.1)" : "none",
                            transform: "translateZ(0)",
                        }}
                    />
                </a>
            </div>

            {/* Center: Desktop / Tablet menu */}
            {!isMobile && (
                <LayoutGroup>
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: 4,
                            borderRadius: 999,
                            zIndex: 2,
                        }}
                        onMouseLeave={() => {
                            clearMagnetic()
                            React.startTransition(() => setHoveredIndex(null))
                        }}
                    >
                        {itemsSafe.map((item, i) => {
                            const isActive = i === activeIndex
                            const isHover = i === hoveredIndex
                            const showBubble =
                                i === currentIndicatorIndex ||
                                (hoveredIndex === null && isActive)

                            return (
                                <motion.a
                                    key={`${item.label}-${i}`}
                                    href={isStatic ? undefined : item.link}
                                    style={{
                                        position: "relative",
                                        zIndex: 2,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        textDecoration: "none",
                                        color:
                                            isActive || isHover
                                                ? activeTextColor
                                                : textColor,
                                        padding: "10px 14px",
                                        borderRadius: 999,
                                        outline: "none",
                                        userSelect: "none",
                                        WebkitTapHighlightColor: "transparent",
                                        transform: "translateZ(0)",
                                        willChange: "transform",
                                        ...navFont,
                                    }}
                                    onClick={(e) => {
                                        if (isStatic) e.preventDefault()
                                        closeMobile()
                                    }}
                                    onMouseEnter={() => {
                                        React.startTransition(() =>
                                            setHoveredIndex(i)
                                        )
                                    }}
                                    onMouseMove={(e) =>
                                        updateMagneticFromEvent(
                                            e,
                                            e.currentTarget
                                        )
                                    }
                                    onFocus={() => {
                                        React.startTransition(() =>
                                            setHoveredIndex(i)
                                        )
                                    }}
                                    onBlur={() => {
                                        React.startTransition(() =>
                                            setHoveredIndex(null)
                                        )
                                        clearMagnetic()
                                    }}
                                    animate={
                                        canAnimate
                                            ? { scale: isHover ? 1.02 : 1 }
                                            : undefined
                                    }
                                    transition={
                                        canAnimate ? fastTransition : undefined
                                    }
                                >
                                    {showBubble && (
                                        <motion.span
                                            aria-hidden
                                            layoutId="liquid-bubble"
                                            transition={
                                                canAnimate
                                                    ? springTransition
                                                    : fastTransition
                                            }
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                borderRadius: 999,
                                                background: bubbleColor,
                                                opacity: bubbleOpacity,
                                                transform: `scale(${bubbleScale})`,
                                                x: bubbleOffsetX,
                                                y: bubbleOffsetY,
                                                boxShadow:
                                                    mode === "dark"
                                                        ? "inset 0 1px 0 rgba(255,255,255,0.18), 0 18px 30px rgba(0,0,0,0.30)"
                                                        : "inset 0 1px 0 rgba(255,255,255,0.55), 0 16px 28px rgba(0,0,0,0.10)",
                                                backdropFilter: `blur(${Math.max(blurStrength - 6, 0)}px)`,
                                                WebkitBackdropFilter: `blur(${Math.max(blurStrength - 6, 0)}px)`,
                                                willChange: "transform",
                                            }}
                                        />
                                    )}

                                    <span
                                        style={{
                                            position: "relative",
                                            zIndex: 2,
                                            lineHeight: 1,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {item.label}
                                    </span>

                                    <span
                                        aria-hidden
                                        style={{
                                            position: "absolute",
                                            inset: -2,
                                            borderRadius: 999,
                                            boxShadow:
                                                mode === "dark"
                                                    ? "0 0 0 2px rgba(255,255,255,0.20)"
                                                    : "0 0 0 2px rgba(0,0,0,0.12)",
                                            opacity: 0,
                                            transition: "opacity 120ms ease",
                                        }}
                                        className="_focusRing"
                                    />
                                </motion.a>
                            )
                        })}

                        <style>{`
                            a:focus-visible ._focusRing { opacity: 1; }
                        `}</style>
                    </div>
                </LayoutGroup>
            )}

            {/* Right: CTA or Mobile toggle */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 10,
                    minWidth: "max-content",
                    zIndex: 3,
                }}
            >
                {!isMobile && showCTA && (
                    <motion.a
                        href={isStatic ? undefined : ctaLink}
                        onClick={(e) => {
                            if (isStatic) e.preventDefault()
                        }}
                        style={{
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "10px 14px",
                            borderRadius: 999,
                            textDecoration: "none",
                            color:
                                mode === "dark"
                                    ? "rgba(255,255,255,0.92)"
                                    : "rgba(0,0,0,0.92)",
                            background:
                                mode === "dark"
                                    ? "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))"
                                    : "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
                            border: `1px solid ${borderColor}`,
                            boxShadow:
                                mode === "dark"
                                    ? "inset 0 1px 0 rgba(255,255,255,0.16), 0 14px 26px rgba(0,0,0,0.35)"
                                    : "inset 0 1px 0 rgba(255,255,255,0.65), 0 14px 26px rgba(0,0,0,0.10)",
                            backdropFilter: `blur(${blurStrength}px)`,
                            WebkitBackdropFilter: `blur(${blurStrength}px)`,
                            outline: "none",
                            transform: "translateZ(0)",
                            willChange: "transform, box-shadow",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                            ...ctaFont,
                        }}
                        whileHover={
                            canAnimate
                                ? {
                                      y: -2,
                                      boxShadow:
                                          mode === "dark"
                                              ? "inset 0 1px 0 rgba(255,255,255,0.18), 0 16px 30px rgba(0,0,0,0.42)"
                                              : "inset 0 1px 0 rgba(255,255,255,0.75), 0 16px 30px rgba(0,0,0,0.14)",
                                  }
                                : undefined
                        }
                        transition={canAnimate ? fastTransition : undefined}
                    >
                        {ctaText}
                    </motion.a>
                )}

                {isMobile && (
                    <button
                        type="button"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                        onClick={toggleMobile}
                        style={{
                            height: 42,
                            width: 46,
                            borderRadius: 14,
                            border: `1px solid ${borderColor}`,
                            background:
                                mode === "dark"
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(255,255,255,0.55)",
                            color: textColor,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            outline: "none",
                            backdropFilter: `blur(${blurStrength}px)`,
                            WebkitBackdropFilter: `blur(${blurStrength}px)`,
                            transform: "translateZ(0)",
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") closeMobile()
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                toggleMobile()
                            }
                        }}
                    >
                        <span aria-hidden style={{ display: "grid", gap: 4 }}>
                            <span
                                style={{
                                    width: 18,
                                    height: 2,
                                    borderRadius: 2,
                                    background: textColor,
                                    transform: mobileOpen
                                        ? "translateY(3px) rotate(45deg)"
                                        : "none",
                                    transition: "transform 180ms ease",
                                }}
                            />
                            <span
                                style={{
                                    width: 18,
                                    height: 2,
                                    borderRadius: 2,
                                    background: textColor,
                                    opacity: mobileOpen ? 0 : 1,
                                    transition: "opacity 180ms ease",
                                }}
                            />
                            <span
                                style={{
                                    width: 18,
                                    height: 2,
                                    borderRadius: 2,
                                    background: textColor,
                                    transform: mobileOpen
                                        ? "translateY(-3px) rotate(-45deg)"
                                        : "none",
                                    transition: "transform 180ms ease",
                                }}
                            />
                        </span>
                    </button>
                )}
            </div>

            {canPortal && typeof document !== "undefined"
                ? createPortal(mobileOverlay, document.body)
                : mobileOverlay}
        </motion.nav>
    )
}

addPropertyControls(LiquidGlassNavBar, {
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
    },
    logoWidth: {
        type: ControlType.Number,
        title: "Logo Width",
        defaultValue: 34,
        min: 16,
        max: 140,
        step: 1,
        unit: "px",
    },

    items: {
        type: ControlType.Array,
        title: "Navigation Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Home",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { label: "Home", link: "#" },
            { label: "Product", link: "#" },
            { label: "Pricing", link: "#" },
            { label: "Company", link: "#" },
        ],
    },
    activeItem: {
        type: ControlType.Number,
        title: "Active Item",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
    },

    showCTA: {
        type: ControlType.Boolean,
        title: "Show CTA",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    ctaText: {
        type: ControlType.String,
        title: "CTA Button Text",
        defaultValue: "Get Started",
    },
    ctaLink: {
        type: ControlType.Link,
        title: "CTA Button Link",
        defaultValue: "#",
    },

    sticky: {
        type: ControlType.Boolean,
        title: "Sticky Navigation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    stickyOffset: {
        type: ControlType.Number,
        title: "Sticky Offset",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (p) => !p.sticky,
    },

    navHeight: {
        type: ControlType.Number,
        title: "Navigation Height",
        defaultValue: 64,
        min: 44,
        max: 120,
        step: 1,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 18,
        min: 0,
        max: 44,
        step: 1,
        unit: "px",
    },

    backgroundOpacity: {
        type: ControlType.Number,
        title: "Background Opacity",
        defaultValue: 0.62,
        min: 0,
        max: 1,
        step: 0.01,
    },
    blurStrength: {
        type: ControlType.Number,
        title: "Blur Strength",
        defaultValue: 18,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },

    bubbleColor: {
        type: ControlType.Color,
        title: "Bubble Color",
        defaultValue: "#FFFFFF",
    },
    bubbleOpacity: {
        type: ControlType.Number,
        title: "Bubble Opacity",
        defaultValue: 0.24,
        min: 0,
        max: 1,
        step: 0.01,
    },
    bubbleScale: {
        type: ControlType.Number,
        title: "Bubble Scale",
        defaultValue: 1.02,
        min: 0.9,
        max: 1.15,
        step: 0.01,
    },

    hoverAnimationSpeed: {
        type: ControlType.Number,
        title: "Hover Animation Speed",
        defaultValue: 0.18,
        min: 0.08,
        max: 0.8,
        step: 0.01,
        unit: "s",
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        defaultValue: 520,
        min: 80,
        max: 1400,
        step: 10,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Spring Damping",
        defaultValue: 36,
        min: 10,
        max: 90,
        step: 1,
    },

    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Active Text Color",
        defaultValue: "#000000",
    },

    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 760,
        min: 320,
        max: 1400,
        step: 10,
        unit: "px",
    },

    mode: {
        type: ControlType.Enum,
        title: "Light/Dark Mode",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },

    navFont: {
        type: ControlType.Font,
        title: "Nav Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },

    ctaFont: {
        type: ControlType.Font,
        title: "CTA Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
