import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type LinkItem = { label: string; link?: string; newTab?: boolean }

type Props = {
    logo?: "mark" | "image" | "none"
    logoImage?: { src?: string; srcSet?: string; alt?: string }
    logoSize?: number
    brand?: string
    brandLink?: string
    brandNewTab?: boolean
    links?: LinkItem[]
    note?: string
    noteLink?: string
    noteNewTab?: boolean
    secondary?: LinkItem[]
    menuLabel?: string
    closeLabel?: string
    showLabel?: boolean
    showNumbers?: boolean
    align?: "left" | "center"
    reveal?: "fade" | "wipe" | "circle"
    stagger?: number
    duration?: number
    hoverShift?: number
    dimOthers?: boolean
    brandFont?: any
    linkFont?: any
    headerColor?: string
    barBackground?: string
    barBorder?: string
    overlayBackground?: string
    overlayZIndex?: number
    overlayText?: string
    overlayBar?: string
    accent?: string
    glow?: string
    barRadius?: string
    barShadow?: boolean
    barBlur?: number
    blur?: number
    headerPadding?: string
    overlayPadding?: string
    canvasHeight?: number
    openOnCanvas?: boolean
    style?: React.CSSProperties
}

const configuredHref = (value?: string): string | undefined => value?.trim() || undefined
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1]
const EASE_SMOOTH: [number, number, number, number] = [0.65, 0, 0.35, 1]
const ICON_MS = 520
// Keep the live overlay above page chrome without covering custom cursors.
const DEFAULT_OVERLAY_Z_INDEX = 10000
const DEFAULT_LINKS: LinkItem[] = [
    { label: "Work" },
    { label: "Studio" },
    { label: "Journal" },
    { label: "Contact" },
]
const DEFAULT_SECONDARY: LinkItem[] = [
    { label: "Instagram" },
    { label: "LinkedIn" },
    { label: "X" },
]

const CSS = [
    "[data-smo-static], [data-smo-static] * { animation: none !important; transition: none !important; }",
    "[data-smo-static] { pointer-events: none; }",
    ".smo-link, .smo-btn, .smo-brand, .smo-sec { -webkit-tap-highlight-color: transparent; }",
    ".smo-link:focus, .smo-btn:focus, .smo-brand:focus, .smo-sec:focus { outline: none; }",
    ".smo-link:focus-visible, .smo-brand:focus-visible, .smo-sec:focus-visible {",
    "  outline: 2px solid currentColor; outline-offset: 6px; border-radius: 6px;",
    "}",
    ".smo-btn:focus-visible .smo-icon { box-shadow: 0 0 0 2px currentColor; }",
    ".smo-sec .smo-ul { transform: scaleX(0); transform-origin: left; transition: transform .4s cubic-bezier(.22,1,.36,1); }",
    ".smo-sec[href]:hover .smo-ul, .smo-sec:focus-visible .smo-ul { transform: scaleX(1); }",
    ".smo-brand[href]:hover .smo-mark { transform: rotate(180deg); }",
    ".smo-mark { transition: transform .6s cubic-bezier(.65,0,.35,1); }",
    ".smo-nav { scrollbar-width: none; }",
    ".smo-nav::-webkit-scrollbar { display: none; }",
    "@media (prefers-reduced-motion: reduce) {",
    "  .smo-sec .smo-ul, .smo-mark { transition: none; }",
    "}",
].join(" ")

function splitFont(font: any, fallbackSize: number) {
    const f = font && typeof font === "object" ? { ...font } : {}
    const raw = f.fontSize
    const size =
        typeof raw === "number" ? raw : parseFloat(raw) || fallbackSize
    delete f.fontSize
    delete f.textAlign
    return { fontStyle: f as React.CSSProperties, size }
}

function pad(n: number) {
    return String(n).padStart(2, "0")
}

function mix(color: string, pct: number) {
    return "color-mix(in srgb, " + color + " " + pct + "%, transparent)"
}

function Mark({ size }: { size: number }) {
    return (
        <svg
            className="smo-mark"
            width={size}
            height={size}
            viewBox="0 0 20 20"
            aria-hidden="true"
            style={{ display: "block", flex: "none" }}
        >
            <circle
                cx="10"
                cy="10"
                r="8.25"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path d="M10 1.75 A8.25 8.25 0 0 1 10 18.25 Z" fill="currentColor" />
        </svg>
    )
}

type BarProps = {
    logo: "mark" | "image" | "none"
    logoImage?: { src?: string; srcSet?: string; alt?: string }
    logoSize: number
    brand: string
    brandHref: string | undefined
    brandNewTab: boolean
    brandFontStyle: React.CSSProperties
    brandSize: number
    color: string
    background: string
    border: string
    radius: string
    shadow: boolean
    blur: number
    padding: string
    open: boolean
    menuLabel: string
    closeLabel: string
    showLabel: boolean
    ariaLabel: string
    onToggle: () => void
    buttonRef?: React.Ref<HTMLButtonElement>
    barRef?: React.Ref<HTMLDivElement>
    fromClosed?: boolean
    reduce: boolean
}

function TopBar({
    logo,
    logoImage,
    logoSize,
    brand,
    brandHref,
    brandNewTab,
    brandFontStyle,
    brandSize,
    color,
    background,
    border,
    radius,
    shadow,
    blur,
    padding,
    open,
    menuLabel,
    closeLabel,
    showLabel,
    ariaLabel,
    onToggle,
    buttonRef,
    barRef,
    fromClosed,
    reduce,
}: BarProps) {
    const isStatic = useIsStaticRenderer() || [RenderTarget.canvas, RenderTarget.thumbnail, RenderTarget.export].includes(RenderTarget.current())
    const [hover, setHover] = useState(false)
    const line: React.CSSProperties = {
        display: "block",
        height: 2,
        borderRadius: 2,
        background: "currentColor",
        transformOrigin: "center",
    }
    const active = (!isStatic && hover) || open
    // Two-phase morph: lines meet in the middle, then rotate into an X.
    // Closing plays the same path in reverse.
    const dur = isStatic || reduce ? 0 : ICON_MS / 1000
    const phase = {
        duration: dur,
        times: [0, 0.5, 1],
        ease: EASE_SMOOTH,
    }
    // Variants only re-run when the open/closed state flips, so hovering
    // (which only changes the bottom line width via CSS) never replays the morph.
    const topVariants: any = {
        open: { y: [null, 3.5, 3.5], rotate: [null, 0, 45], transition: phase },
        closed: { y: [null, 3.5, 0], rotate: [null, 0, 0], transition: phase },
    }
    const bottomVariants: any = {
        open: { y: [null, -3.5, -3.5], rotate: [null, 0, -45], transition: phase },
        closed: { y: [null, -3.5, 0], rotate: [null, 0, 0], transition: phase },
    }
    const state = open ? "open" : "closed"
    const widthTransition = reduce
        ? undefined
        : "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)"
    const labelTransition = { duration: dur, ease: EASE_SMOOTH }
    const labelBase: React.CSSProperties = {
        gridArea: "1 / 1",
        whiteSpace: "nowrap",
        display: "block",
    }
    const showImage = logo === "image" && logoImage && logoImage.src
    return (
        <div
            ref={barRef}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                boxSizing: "border-box",
                padding,
                color,
                background,
                border: "1px solid " + border,
                borderRadius: radius,
                boxShadow: shadow
                    ? "0 12px 32px -14px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.35)"
                    : undefined,
                backdropFilter: blur ? "blur(" + blur + "px) saturate(160%)" : undefined,
                WebkitBackdropFilter: blur
                    ? "blur(" + blur + "px) saturate(160%)"
                    : undefined,
                flex: "none",
            }}
        >
            <a
                className="smo-brand"
                href={brandHref}
                target={brandNewTab ? "_blank" : undefined}
                rel={brandNewTab ? "noopener noreferrer" : undefined}
                style={{
                    ...brandFontStyle,
                    fontSize: brandSize,
                    color: "inherit",
                    textDecoration: "none",
                    cursor: brandHref ? "pointer" : "default",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                }}
            >
                {logo === "mark" && <Mark size={logoSize} />}
                {showImage && (
                    <img
                        src={logoImage!.src}
                        srcSet={logoImage!.srcSet}
                        alt={logoImage!.alt || ""}
                        style={{
                            height: logoSize,
                            width: "auto",
                            display: "block",
                            flex: "none",
                        }}
                    />
                )}
                {brand && <span className="smo-brand-text">{brand}</span>}
            </a>
            <button
                ref={buttonRef}
                type="button"
                className="smo-btn"
                aria-label={ariaLabel}
                aria-expanded={open}
                onClick={isStatic ? undefined : onToggle}
                onPointerEnter={(e) => {
                    if (!isStatic && e.pointerType === "mouse") setHover(true)
                }}
                onPointerLeave={() => setHover(false)}
                style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    background: "none",
                    border: 0,
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    color: "inherit",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    touchAction: "manipulation",
                }}
            >
                {showLabel && (
                    <span
                        aria-hidden="true"
                        style={{
                            ...brandFontStyle,
                            fontSize: Math.round(brandSize * 0.82),
                            letterSpacing: "0.02em",
                            lineHeight: 1,
                            display: "grid",
                            justifyItems: "end",
                            overflow: "hidden",
                            padding: "3px 0",
                            margin: "-3px 0",
                            opacity: active ? 1 : 0.7,
                            transition: reduce ? undefined : "opacity 0.3s",
                        }}
                    >
                        <motion.span
                            style={labelBase}
                            initial={!isStatic && fromClosed ? { y: 0, opacity: 1 } : false}
                            animate={{ y: open ? -12 : 0, opacity: open ? 0 : 1 }}
                            transition={labelTransition}
                        >
                            {menuLabel}
                        </motion.span>
                        <motion.span
                            style={labelBase}
                            initial={!isStatic && fromClosed ? { y: 12, opacity: 0 } : false}
                            animate={{ y: open ? 0 : 12, opacity: open ? 1 : 0 }}
                            transition={labelTransition}
                        >
                            {closeLabel}
                        </motion.span>
                    </span>
                )}
                <span
                    className="smo-icon"
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        background: active ? mix(color, 14) : mix(color, 7),
                        transition: reduce
                            ? undefined
                            : "background-color 0.35s ease",
                        border: "1px solid " + mix(color, 12),
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: 5,
                        boxSizing: "border-box",
                        padding: "0 11px",
                        flex: "none",
                    }}
                >
                    <motion.span
                        style={{ ...line, width: 18 }}
                        variants={isStatic ? { open: { y: 3.5, rotate: 45 }, closed: { y: 0, rotate: 0 } } : topVariants}
                        transition={isStatic ? { duration: 0 } : undefined}
                        initial={!isStatic && fromClosed ? "closed" : false}
                        animate={state}
                    />
                    <motion.span
                        style={{
                            ...line,
                            width: open || hover ? 18 : 11,
                            transition: widthTransition,
                        }}
                        variants={isStatic ? { open: { y: -3.5, rotate: -45 }, closed: { y: 0, rotate: 0 } } : bottomVariants}
                        transition={isStatic ? { duration: 0 } : undefined}
                        initial={!isStatic && fromClosed ? "closed" : false}
                        animate={state}
                    />
                </span>
            </button>
        </div>
    )
}

/**
 * Motion Overlay Menu
 * Floating glass header that opens a full-screen overlay. Links reveal with a
 * staggered blur + slide, hover shifts the active link and dims the others.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 66
 * @framerDisableUnlink
 */
export default function MotionOverlayMenu(props: Props) {
    const {
        logo = "mark",
        logoImage,
        logoSize = 22,
        brand = "Meridian",
        brandLink,
        brandNewTab = false,
        links = DEFAULT_LINKS,
        note = "© Made by Matt",
        noteLink,
        noteNewTab = false,
        secondary = DEFAULT_SECONDARY,
        menuLabel = "Menu",
        closeLabel = "Close",
        showLabel = true,
        showNumbers = true,
        align = "left",
        reveal = "circle",
        stagger = 70,
        duration = 0.8,
        hoverShift = 16,
        dimOthers = true,
        brandFont,
        linkFont,
        headerColor = "#111111",
        barBackground = "rgba(255, 255, 255, 0.62)",
        barBorder = "rgba(0, 0, 0, 0.08)",
        overlayBackground = "rgba(10, 10, 11, 0.94)",
        overlayZIndex = DEFAULT_OVERLAY_Z_INDEX,
        overlayText = "#FAFAFA",
        overlayBar = "rgba(255, 255, 255, 0.06)",
        accent = "#8A8A8E",
        glow = "rgba(255, 255, 255, 0.08)",
        barRadius = "999px",
        barShadow = true,
        barBlur = 16,
        blur = 20,
        headerPadding = "12px 12px 12px 24px",
        overlayPadding = "40px 32px 40px 32px",
        canvasHeight = 800,
        openOnCanvas = false,
        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const target = RenderTarget.current()
    const isCanvas = isStaticRenderer ||
        target === RenderTarget.canvas ||
        target === RenderTarget.thumbnail ||
        target === RenderTarget.export

    const reduceMotion = useReducedMotion()
    const reduce = isCanvas || !!reduceMotion

    const [openState, setOpenState] = useState(false)
    const [closing, setClosing] = useState(false)
    const open = isCanvas ? !!openOnCanvas : openState
    const [hovered, setHovered] = useState<number | null>(null)
    const [mounted, setMounted] = useState(false)
    const [narrow, setNarrow] = useState(false)
    const [barRect, setBarRect] = useState<{
        top: number
        left: number
        width: number
        height: number
        layoutWidth: number
        insetLeft: number
        insetRight: number
        brandOffset: number
    } | null>(null)

    const rootRef = useRef<HTMLDivElement>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const toggleRef = useRef<HTMLButtonElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const wasOpen = useRef(false)
    const closeTimer = useRef<number | null>(null)
    const origin = useRef<string>("calc(100% - 44px) 36px")

    useEffect(() => {
        setMounted(true)
    }, [])

    // Measure only this component's own bar. The portal, menu and footer use
    // one horizontal grid even when Framer constrains the instance with maxWidth.
    const measure = useCallback(() => {
        const root = rootRef.current
        const bar = barRef.current
        if (!root || !bar || typeof window === "undefined") return
        const r = root.getBoundingClientRect()
        // Keep the circular reveal anchored to this bar's button after resize.
        // Read both bounds together before committing the updated layout.
        const button = toggleRef.current
        if (button) {
            const buttonRect = button.getBoundingClientRect()
            origin.current =
                Math.round(buttonRect.right - 20) + "px " +
                Math.round(buttonRect.top + buttonRect.height / 2) + "px"
        }
        const computed = window.getComputedStyle(bar)
        const brandNode = bar.querySelector<HTMLElement>(".smo-brand")
        const brandText = bar.querySelector<HTMLElement>(".smo-brand-text")
        const next = {
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            layoutWidth: root.offsetWidth,
            insetLeft: (parseFloat(computed.paddingLeft) || 0) +
                (parseFloat(computed.borderLeftWidth) || 0),
            insetRight: (parseFloat(computed.paddingRight) || 0) +
                (parseFloat(computed.borderRightWidth) || 0),
            // offsetLeft uses local layout coordinates, including on a scaled
            // or rotated canvas; both elements share the same offsetParent.
            brandOffset: brandNode && brandText
                ? Math.max(0, brandText.offsetLeft - brandNode.offsetLeft)
                : 0,
        }
        setNarrow(next.layoutWidth < 640)
        setBarRect((previous) => previous &&
            Object.keys(next).every((key) =>
                previous[key as keyof typeof next] === next[key as keyof typeof next])
            ? previous : next)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        measure()
        const ro = "ResizeObserver" in window ? new ResizeObserver(measure) : null
        if (rootRef.current) ro?.observe(rootRef.current)
        if (barRef.current) {
            ro?.observe(barRef.current)
            const brandNode = barRef.current.querySelector<HTMLElement>(".smo-brand")
            if (brandNode) ro?.observe(brandNode)
        }
        // A centered max-width bar can move without changing its own width.
        window.addEventListener("resize", measure)
        return () => {
            ro?.disconnect()
            window.removeEventListener("resize", measure)
        }
    }, [measure, headerPadding, logo, logoSize, logoImage?.src, brand, brandFont])

    const openMenu = useCallback(() => {
        if (closeTimer.current) {
            window.clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
        const el = toggleRef.current
        if (el && typeof window !== "undefined") {
            const r = el.getBoundingClientRect()
            origin.current =
                Math.round(r.left + r.width - 20) +
                "px " +
                Math.round(r.top + r.height / 2) +
                "px"
        }
        measure()
        setHovered(null)
        setClosing(false)
        setOpenState(true)
    }, [measure])

    // Close: morph the icon back first, then let the overlay leave.
    const closeMenu = useCallback(() => {
        if (closeTimer.current) return
        setClosing(true)
        const wait = reduce ? 0 : ICON_MS * 0.35
        closeTimer.current = window.setTimeout(() => {
            closeTimer.current = null
            setClosing(false)
            setOpenState(false)
        }, wait)
    }, [reduce])

    useEffect(
        () => () => {
            if (closeTimer.current) window.clearTimeout(closeTimer.current)
        },
        []
    )

    // Escape key, scroll lock and re-measure while open (live only)
    useEffect(() => {
        if (!open || isCanvas || typeof document === "undefined") return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeMenu()
        }
        window.addEventListener("keydown", onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        measure()
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = prev
        }
    }, [open, isCanvas, closeMenu, measure])

    // Focus management: dialog on open, back to the toggle on close
    useEffect(() => {
        if (isCanvas) return
        if (open) {
            wasOpen.current = true
            const t = window.setTimeout(() => {
                // Announce the dialog without highlighting a menu item on open.
                // Actual Tab navigation still gives links their visible focus ring.
                overlayRef.current?.focus({ preventScroll: true })
            }, 80)
            return () => window.clearTimeout(t)
        }
        if (wasOpen.current) {
            wasOpen.current = false
            toggleRef.current?.focus({ preventScroll: true })
        }
    }, [open, isCanvas])

    const onOverlayKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "Tab" || !overlayRef.current) return
        const nodes = overlayRef.current.querySelectorAll<HTMLElement>(
            'a[href], button, [tabindex]:not([tabindex="-1"])'
        )
        if (!nodes.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        const active = document.activeElement
        if (active === overlayRef.current) {
            e.preventDefault()
            const initialLink = overlayRef.current.querySelector<HTMLElement>('.smo-link[href]')
            ;(e.shiftKey ? last : initialLink || first).focus()
        } else if (e.shiftKey && active === first) {
            e.preventDefault()
            last.focus()
        } else if (!e.shiftKey && active === last) {
            e.preventDefault()
            first.focus()
        }
    }

    const { fontStyle: brandFontStyle, size: brandSize } = splitFont(
        brandFont,
        15
    )
    const { fontStyle: linkFontStyle, size: linkSize } = splitFont(linkFont, 72)

    const d = isCanvas ? 0 : reduce ? 0.2 : Math.max(0.1, duration || 0.8)
    const staggerS = reduce ? 0 : Math.max(0, stagger || 0) / 1000
    const brandHref = configuredHref(brandLink)
    const noteHref = configuredHref(noteLink)
    const iconOpen = open && !closing
    const smallSize = Math.max(12, Math.round(brandSize * 0.86))

    const circleAt = isCanvas ? "calc(100% - 44px) 36px" : origin.current
    const bgVariants: any =
        reveal === "wipe"
            ? {
                  hidden: { clipPath: "inset(0 0 100% 0)" },
                  visible: {
                      clipPath: "inset(0 0 0% 0)",
                      transition: { duration: d, ease: EASE_OUT },
                  },
                  exit: {
                      clipPath: "inset(0 0 100% 0)",
                      transition: { duration: d, ease: EASE_IN },
                  },
              }
            : reveal === "circle"
              ? {
                    hidden: { clipPath: "circle(0% at " + circleAt + ")" },
                    visible: {
                        clipPath: "circle(150% at " + circleAt + ")",
                        transition: { duration: d * 1.1, ease: EASE_OUT },
                    },
                    exit: {
                        clipPath: "circle(0% at " + circleAt + ")",
                        transition: { duration: d * 1.1, ease: EASE_IN },
                    },
                }
              : {
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { duration: d * 0.6, ease: EASE_OUT },
                    },
                    exit: {
                        opacity: 0,
                        transition: { duration: d * 0.6, ease: EASE_IN },
                    },
                }

    const itemVariants: any = {
        hidden: {
            opacity: 0,
            y: reduce ? 0 : 28,
            filter: reduce ? "blur(0px)" : "blur(12px)",
        },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                duration: d,
                ease: EASE_OUT,
                delay: d * 0.3 + i * staggerS,
            },
        }),
        exit: {
            opacity: 0,
            y: reduce ? 0 : -10,
            filter: reduce ? "blur(0px)" : "blur(8px)",
            transition: { duration: d * 0.35, ease: EASE_IN },
        },
    }

    const footerDelay = isCanvas ? 0 : d * 0.3 + links.length * staggerS + 0.05
    const dividerVariants: any = {
        hidden: { scaleX: 0, opacity: 0 },
        visible: {
            scaleX: 1,
            opacity: 1,
            transition: { duration: d, ease: EASE_OUT, delay: footerDelay },
        },
        exit: {
            opacity: 0,
            transition: { duration: d * 0.3, ease: EASE_IN },
        },
    }
    const footerVariants: any = {
        hidden: { opacity: 0, y: reduce ? 0 : 12 },
        visible: (j: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: d * 0.8,
                ease: EASE_OUT,
                delay: isCanvas ? 0 : footerDelay + 0.1 + j * 0.06,
            },
        }),
        exit: {
            opacity: 0,
            transition: { duration: d * 0.3, ease: EASE_IN },
        },
    }

    const fixedBar = !isCanvas && barRect
    const overlayBarBorder = mix(overlayText, 14)
    const hasFooter = !!note || secondary.length > 0
    const contentLeft = barRect?.insetLeft ?? 25
    const contentRight = barRect?.insetRight ?? 13
    const brandOffset = barRect?.brandOffset ??
        (logo === "mark" || (logo === "image" && logoImage?.src) ? logoSize + 10 : 0)
    const leftAligned = align !== "center" || narrow
    const numberWidth = brandOffset || Math.max(20, linkSize * 0.36)
    const menuWidth = isCanvas ? barRect?.layoutWidth : barRect?.width
    const overlayLayer = Number.isFinite(overlayZIndex)
        ? Math.min(2147483647, Math.max(1, Math.round(overlayZIndex)))
        : DEFAULT_OVERLAY_Z_INDEX

    const overlay = (
        <motion.div
            ref={overlayRef}
            data-smo-static={isCanvas ? "" : undefined}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            onKeyDown={onOverlayKeyDown}
            variants={bgVariants}
            initial={isCanvas ? false : "hidden"}
            animate="visible"
            exit={isCanvas ? undefined : "exit"}
            style={{
                position: isCanvas ? "absolute" : "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: isCanvas ? canvasHeight : "100%",
                zIndex: overlayLayer,
                outline: "none",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: overlayBackground,
                backdropFilter: blur ? "blur(" + blur + "px)" : undefined,
                WebkitBackdropFilter: blur ? "blur(" + blur + "px)" : undefined,
                color: overlayText,
                willChange: "clip-path, opacity",
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: "radial-gradient(720px 520px at 88% 12%, " + glow + ", transparent 70%)",
                }}
            />
            <div
                style={
                    fixedBar
                        ? {
                              position: "absolute",
                              top: barRect!.top,
                              left: barRect!.left,
                              width: barRect!.width,
                              zIndex: 2,
                          }
                        : { position: "relative", width: "100%", zIndex: 2 }
                }
            >
                <TopBar
                    logo={logo}
                    logoImage={logoImage}
                    logoSize={logoSize}
                    brand={brand}
                    brandHref={brandHref}
                    brandNewTab={brandNewTab}
                    brandFontStyle={brandFontStyle}
                    brandSize={brandSize}
                    color={overlayText}
                    background={overlayBar}
                    border={overlayBarBorder}
                    radius={barRadius}
                    shadow={false}
                    blur={0}
                    padding={headerPadding}
                    open={iconOpen}
                    menuLabel={menuLabel}
                    closeLabel={closeLabel}
                    showLabel={showLabel}
                    ariaLabel="Close menu"
                    onToggle={closeMenu}
                    fromClosed
                    reduce={reduce}
                />
            </div>
            {fixedBar && (
                <div
                    style={{
                        flex: "none",
                        height: barRect!.top + barRect!.height,
                    }}
                />
            )}
            <div
                className="smo-nav"
                style={{
                    position: "relative",
                    zIndex: 1,
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    // Preserve vertical overlay padding; horizontal content
                    // follows the bar's logo and close-button inner edges.
                    padding: overlayPadding,
                    paddingLeft: contentLeft,
                    paddingRight: contentRight,
                    width: fixedBar ? barRect!.width : "100%",
                    marginLeft: fixedBar ? barRect!.left : 0,
                    boxSizing: "border-box",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                <nav
                    aria-label="Main"
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: narrow ? "flex-start" : "center",
                        paddingTop: narrow ? "6vh" : 0,
                        paddingBottom: hasFooter ? 32 : 0,
                    }}
                >
                    <ul
                        style={{
                            listStyle: "none",
                            margin: 0,
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems:
                                align === "center" && !narrow
                                    ? "center"
                                    : "flex-start",
                            gap: narrow ? "0.22em" : "0.1em",
                            ...linkFontStyle,
                            fontSize: menuWidth
                                ? Math.min(linkSize, menuWidth * (narrow ? 0.13 : 0.11))
                                : "min(" + linkSize + "px, " + (narrow ? 13 : 11) + "vw)",
                        }}
                    >
                        {links.map((item, i) => {
                            const isHovered = hovered === i
                            const dimmed =
                                dimOthers && hovered !== null && !isHovered
                            const href = configuredHref(item.link)
                            return (
                                <motion.li
                                    key={i}
                                    custom={i}
                                    variants={itemVariants}
                                    style={{
                                        margin: 0,
                                        padding: 0,
                                        willChange: "transform, opacity, filter",
                                    }}
                                >
                                    <motion.a
                                        className="smo-link"
                                        href={href}
                                        target={item.newTab ? "_blank" : undefined}
                                        rel={
                                            item.newTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        data-smo-first={i === 0 ? "" : undefined}
                                        onPointerEnter={(e) => {
                                            if (!isCanvas && href && e.pointerType === "mouse")
                                                setHovered(i)
                                        }}
                                        onPointerLeave={() =>
                                            setHovered((h) =>
                                                h === i ? null : h
                                            )
                                        }
                                        onClick={() => {
                                            if (href && !isCanvas) closeMenu()
                                        }}
                                        animate={{
                                            x:
                                                isHovered && !reduce
                                                    ? hoverShift
                                                    : 0,
                                            opacity: dimmed ? 0.32 : 1,
                                        }}
                                        transition={isCanvas ? { duration: 0 } : {
                                            type: "spring",
                                            stiffness: 320,
                                            damping: 28,
                                            mass: 0.7,
                                        }}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "baseline",
                                            gap: leftAligned ? 0 : "0.28em",
                                            color: "inherit",
                                            textDecoration: "none",
                                            cursor: href ? "pointer" : "default",
                                            userSelect: "none",
                                            WebkitUserSelect: "none",
                                            touchAction: "manipulation",
                                            padding: "0.02em 0",
                                            paddingLeft: leftAligned && !showNumbers ? brandOffset : undefined,
                                        }}
                                    >
                                        {showNumbers && (
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    fontSize:
                                                        "max(11px, 0.18em)",
                                                    fontWeight: 500,
                                                    letterSpacing: "0.08em",
                                                    lineHeight: 1,
                                                    color: accent,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                    transform:
                                                        "translateY(-0.9em)",
                                                    display: "inline-block",
                                                    flex: "none",
                                                    width: leftAligned ? numberWidth : undefined,
                                                    marginLeft: leftAligned && !brandOffset ? -Math.min(contentLeft, numberWidth) : undefined,
                                                }}
                                            >
                                                {pad(i + 1)}
                                            </span>
                                        )}
                                        <span>{item.label}</span>
                                    </motion.a>
                                </motion.li>
                            )
                        })}
                    </ul>
                </nav>
                {hasFooter && (
                    <div style={{ flex: "none" }}>
                        <motion.div
                            variants={dividerVariants}
                            style={{
                                height: 1,
                                background: mix(overlayText, 14),
                                transformOrigin: "left",
                                marginBottom: 20,
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: narrow ? "column" : "row",
                                justifyContent: "space-between",
                                alignItems: narrow ? "flex-start" : "center",
                                gap: narrow ? 16 : 24,
                                ...brandFontStyle,
                                fontSize: smallSize,
                                lineHeight: 1.4,
                            }}
                        >
                            {note ? (
                                <motion.div
                                    custom={0}
                                    variants={footerVariants}
                                    style={{ maxWidth: 420 }}
                                >
                                    <a
                                        className="smo-sec"
                                        href={noteHref}
                                        target={noteNewTab ? "_blank" : undefined}
                                        rel={
                                            noteNewTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        onClick={() => {
                                            if (noteHref && !isCanvas) closeMenu()
                                        }}
                                        style={{
                                            color: accent,
                                            textDecoration: "none",
                                            display: "inline-block",
                                            paddingBottom: 3,
                                            position: "relative",
                                            cursor: noteHref ? "pointer" : "default",
                                        }}
                                    >
                                        {note}
                                        <span
                                            className="smo-ul"
                                            aria-hidden="true"
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                height: 1,
                                                background: "currentColor",
                                            }}
                                        />
                                    </a>
                                </motion.div>
                            ) : (
                                <span />
                            )}
                            {secondary.length > 0 && (
                                <ul
                                    aria-label="Secondary"
                                    style={{
                                        listStyle: "none",
                                        margin: 0,
                                        padding: 0,
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "8px 24px",
                                        alignSelf: narrow ? "flex-start" : undefined,
                                        justifyContent: narrow ? "flex-start" : "flex-end",
                                    }}
                                >
                                    {secondary.map((item, j) => (
                                        <motion.li
                                            key={j}
                                            custom={j + 1}
                                            variants={footerVariants}
                                            style={{ margin: 0, padding: 0 }}
                                        >
                                            <a
                                                className="smo-sec"
                                                href={configuredHref(item.link)}
                                                target={
                                                    item.newTab
                                                        ? "_blank"
                                                        : undefined
                                                }
                                                rel={
                                                    item.newTab
                                                        ? "noopener noreferrer"
                                                        : undefined
                                                }
                                                onClick={() => {
                                                    if (configuredHref(item.link) && !isCanvas) closeMenu()
                                                }}
                                                style={{
                                                    color: "inherit",
                                                    textDecoration: "none",
                                                    display: "inline-block",
                                                    paddingBottom: 3,
                                                    position: "relative",
                                                    cursor: configuredHref(item.link) ? "pointer" : "default",
                                                }}
                                            >
                                                {item.label}
                                                <span
                                                    className="smo-ul"
                                                    aria-hidden="true"
                                                    style={{
                                                        position: "absolute",
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        height: 1,
                                                        background:
                                                            "currentColor",
                                                    }}
                                                />
                                            </a>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )

    const presence = isCanvas ? (open ? overlay : null) : <AnimatePresence>{open ? overlay : null}</AnimatePresence>
    const usePortal =
        !isCanvas && mounted && typeof document !== "undefined"

    return (
        <div
            ref={rootRef}
            data-smo-static={isCanvas ? "" : undefined}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
            }}
        >
            <style>{CSS}</style>
            <TopBar
                logo={logo}
                logoImage={logoImage}
                logoSize={logoSize}
                brand={brand}
                brandHref={brandHref}
                brandNewTab={brandNewTab}
                brandFontStyle={brandFontStyle}
                brandSize={brandSize}
                color={headerColor}
                background={barBackground}
                border={barBorder}
                radius={barRadius}
                shadow={barShadow}
                blur={barBlur}
                padding={headerPadding}
                open={iconOpen}
                menuLabel={menuLabel}
                closeLabel={closeLabel}
                showLabel={showLabel}
                ariaLabel="Open menu"
                onToggle={open ? closeMenu : openMenu}
                buttonRef={toggleRef}
                barRef={barRef}
                reduce={reduce}
            />
            {usePortal ? createPortal(presence, document.body) : presence}
        </div>
    )
}

addPropertyControls(MotionOverlayMenu, {
    logo: {
        type: ControlType.Enum,
        title: "Logo",
        options: ["mark", "image", "none"],
        optionTitles: ["Mark", "Image", "None"],
        defaultValue: "mark",
        displaySegmentedControl: true,
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: (props: any) => props.logo !== "image",
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        min: 14,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 22,
        hidden: (props: any) => props.logo === "none",
    },
    brand: {
        type: ControlType.String,
        title: "Brand",
        defaultValue: "Meridian",
    },
    brandLink: {
        type: ControlType.Link,
        title: "Brand Link",
    },
    brandNewTab: {
        type: ControlType.Boolean,
        title: "Brand New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Link",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
        defaultValue: [
            { label: "Work" },
            { label: "Studio" },
            { label: "Journal" },
            { label: "Contact" },
        ],
    },
    note: {
        type: ControlType.String,
        title: "Note",
        displayTextArea: true,
        defaultValue: "© Made by Matt",
    },
    noteLink: {
        type: ControlType.Link,
        title: "Note Link",
    },
    noteNewTab: {
        type: ControlType.Boolean,
        title: "Note New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    secondary: {
        type: ControlType.Array,
        title: "Secondary",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Link",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
        defaultValue: [
            { label: "Instagram" },
            { label: "LinkedIn" },
            { label: "X" },
        ],
    },
    menuLabel: {
        type: ControlType.String,
        title: "Menu Label",
        defaultValue: "Menu",
    },
    closeLabel: {
        type: ControlType.String,
        title: "Close Label",
        defaultValue: "Close",
    },
    showLabel: {
        type: ControlType.Boolean,
        title: "Label",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showNumbers: {
        type: ControlType.Boolean,
        title: "Numbers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    reveal: {
        type: ControlType.Enum,
        title: "Reveal",
        options: ["circle", "wipe", "fade"],
        optionTitles: ["Circle", "Wipe", "Fade"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 1.6,
        step: 0.05,
        unit: "s",
        defaultValue: 0.8,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 200,
        step: 5,
        unit: "ms",
        defaultValue: 70,
    },
    hoverShift: {
        type: ControlType.Number,
        title: "Hover Shift",
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    dimOthers: {
        type: ControlType.Boolean,
        title: "Dim Others",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    brandFont: {
        type: ControlType.Font,
        title: "Brand Font",
        controls: "extended",
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            lineHeight: "1em",
            letterSpacing: "-0.01em",
        },
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link Font",
        controls: "extended",
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "72px",
            variant: "Medium",
            lineHeight: "1.05em",
            letterSpacing: "-0.03em",
        },
    },
    headerColor: {
        type: ControlType.Color,
        title: "Header",
        defaultValue: "#111111",
    },
    barBackground: {
        type: ControlType.Color,
        title: "Bar",
        defaultValue: "rgba(255, 255, 255, 0.62)",
    },
    barBorder: {
        type: ControlType.Color,
        title: "Bar Border",
        defaultValue: "rgba(0, 0, 0, 0.08)",
    },
    overlayBackground: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "rgba(10, 10, 11, 0.94)",
    },
    overlayText: {
        type: ControlType.Color,
        title: "Overlay Text",
        defaultValue: "#FAFAFA",
    },
    overlayBar: {
        type: ControlType.Color,
        title: "Overlay Bar",
        defaultValue: "rgba(255, 255, 255, 0.06)",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#8A8A8E",
    },
    glow: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "rgba(255, 255, 255, 0.08)",
    },
    barRadius: {
        type: ControlType.BorderRadius,
        title: "Bar Radius",
        defaultValue: "999px",
    },
    barShadow: {
        type: ControlType.Boolean,
        title: "Bar Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    barBlur: {
        type: ControlType.Number,
        title: "Bar Blur",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    overlayZIndex: {
        type: ControlType.Number,
        title: "Overlay Layer",
        defaultValue: DEFAULT_OVERLAY_Z_INDEX,
        min: 1,
        max: 2147483647,
        step: 1,
        displayStepper: true,
        description:
            "Keep above page content and below your custom cursor. Increase only if the menu is covered by another layer.",
    },
    blur: {
        type: ControlType.Number,
        title: "Overlay Blur",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 20,
    },
    headerPadding: {
        type: ControlType.Padding,
        title: "Header Padding",
        defaultValue: "12px 12px 12px 24px",
    },
    overlayPadding: {
        type: ControlType.Padding,
        title: "Overlay Padding",
        defaultValue: "40px 32px 40px 32px",
    },
    canvasHeight: {
        type: ControlType.Number,
        title: "Open Height",
        min: 480,
        max: 1600,
        step: 10,
        unit: "px",
        defaultValue: 800,
        hidden: (props: any) => !props.openOnCanvas,
    },
    openOnCanvas: {
        type: ControlType.Boolean,
        title: "Open on Canvas",
        defaultValue: false,
        enabledTitle: "Open",
        disabledTitle: "Closed",
        description:
            "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
