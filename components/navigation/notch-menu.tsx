import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * NOTCH MENU V6.3 — Marketplace compatibility & performance update
 *
 * - One uninterrupted background shape morphs between the two menu states.
 * - Solid, frosted Glass, or Adaptive (closed Glass -> expanded Solid).
 * - Native CSS fill/blur transitions run alongside the unchanged V5.7 shape spring.
 * - Static Framer Canvas/export: no portals, timers, listeners, or animations.
 * - Text/logo links to Home; hamburger/X is the only open/close control.
 * - Accessible dialog semantics, visible keyboard focus, trapped Tab, Esc to close.
 * - Exact V5.7 spring animation for the shape, toggle and content; no reduced-motion override.
 * - Modal scroll gestures are contained within the component overlay (no global wheel/touch locks).
 * - No forced page scroll resets or body/html style mutations.
 * - Viewport observers only subscribe when needed; Follow Frame tracks its anchor while closed.
 * - Focus-visible rings are instance-scoped without global style tags.
 * - Dynamic viewport bounds and internal scrolling on compact screens.
 *
 * Add ONE instance per page. Interactions run only in Preview/Published mode.
 */

type ResponsiveImage = { src?: string; srcSet?: string; alt?: string }
type MenuItem = {
    label: string
    url: string
    image?: ResponsiveImage
}
type Corners = {
    topLeft: number
    topRight: number
    bottomRight: number
    bottomLeft: number
}
type Placement = "frame" | "viewport"
type TriggerType = "text" | "logo"
type ToggleIcon = "lines" | "plus"
type AppearanceMode = "solid" | "glass" | "adaptive"

type Props = {
    items: MenuItem[]
    triggerType: TriggerType
    triggerText: string
    homeUrl: string
    triggerLogo?: ResponsiveImage
    logoWidth: number
    triggerFont: React.CSSProperties
    iconType: ToggleIcon
    iconBoxSize: number
    iconBoxRadius: number
    iconBackground: string
    iconForeground: string
    background: string
    appearanceMode: AppearanceMode
    glassTint: string
    glassOpacity: number
    glassBlur: number
    glassBorderColor: string
    glassBorderOpacity: number
    glassBorderWidth: number
    foreground: string
    muted: string
    accent: string
    menuFont: React.CSSProperties
    showPreview: boolean
    dimBackground: boolean
    placement: Placement
    horizontal: "left" | "center" | "right"
    topOffset: number
    xOffset: number
    edgeMargin: number
    openPadding: number
    closedWidth: number
    closedHeight: number
    closedCorners: Corners
    openCorners: Corners
    style?: React.CSSProperties
}

const ITEMS: MenuItem[] = [
    { label: "Home", url: "/" },
    { label: "Work", url: "/work" },
    { label: "About", url: "/about" },
    { label: "Contact", url: "/contact" },
]
const CLOSED: Corners = {
    topLeft: 4,
    topRight: 4,
    bottomRight: 4,
    bottomLeft: 4,
}
const OPEN: Corners = {
    topLeft: 12,
    topRight: 12,
    bottomRight: 12,
    bottomLeft: 12,
}
const FALLBACK_ART = [
    "linear-gradient(145deg,#b1c1ad,#47695c)",
    "linear-gradient(145deg,#d9c49e,#9a704c)",
    "linear-gradient(145deg,#b6baca,#595b81)",
    "linear-gradient(145deg,#e0ada7,#8c635c)",
]
const limit = (v: number, lo: number, hi: number) =>
    Math.min(Math.max(v, lo), hi)
// Convert the colors emitted by Framer's Color Control (#hex, rgb(), rgba())
// to a tint with opacity controlled by the separate Glass Opacity slider.
// An unrecognized color uses the safe, neutral default rather than breaking CSS.
function rgbaTint(value: string, opacityPercent: number): string {
    const alpha = limit(opacityPercent, 0, 100) / 100
    const color = (value || "#F1F1ED").trim()
    if (color.startsWith("#")) {
        let hex = color.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .slice(0, 3)
                .split("")
                .map((c) => c + c)
                .join("")
        } else if (hex.length === 8) {
            hex = hex.slice(0, 6)
        }
        if (/^[\da-f]{6}$/i.test(hex)) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }
    }
    const rgb = color.match(
        /^rgba?\(\s*(\d+(?:\.\d+)?)\s*[,\s]+(\d+(?:\.\d+)?)\s*[,\s]+(\d+(?:\.\d+)?)/i
    )
    if (rgb) {
        const channels = rgb.slice(1, 4).map((v) => limit(Number(v), 0, 255))
        return `rgba(${channels.join(", ")}, ${alpha})`
    }
    return `rgba(241, 241, 237, ${alpha})`
}

function safeUrl(value?: string, fallback = "") {
    const href = (value || "").trim()
    if (!href) return fallback
    // Reject script/data destinations; permit site pages and conventional external links.
    if (/^(?:javascript|data|vbscript|file):/i.test(href)) return fallback
    if (
        /^[a-z][a-z0-9+.-]*:/i.test(href) &&
        !/^(?:https?|mailto|tel):/i.test(href)
    )
        return fallback
    return href
}

const fileSrc = (image?: ResponsiveImage) => image?.src || ""

// visualViewport takes mobile browser toolbars / dynamic viewport height into
// account (innerHeight alone can be taller than the actually visible area).
function readViewport() {
    if (typeof window === "undefined")
        return { width: 1200, height: 850, left: 0, top: 0 }
    const visual = window.visualViewport
    return {
        width: visual?.width || window.innerWidth,
        height: visual?.height || window.innerHeight,
        left: visual?.offsetLeft || 0,
        top: visual?.offsetTop || 0,
    }
}

// The same non-bouncy spring drives every physical dimension of the shape.
// No arbitrary animation speed setting; it is tuned for this component.
const SHAPE_SPRING = {
    type: "spring" as const,
    stiffness: 210,
    damping: 28,
    mass: 0.92,
    restSpeed: 0.1,
    restDelta: 0.2,
}
const SOFT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function MenuGlyph({
    open,
    type,
    color,
}: {
    open: boolean
    type: ToggleIcon
    color: string
}) {
    const length = 17
    const offset = type === "lines" ? 3.4 : 0
    const transition = { type: "spring" as const, stiffness: 370, damping: 28 }
    const line: React.CSSProperties = {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: length,
        height: 1.8,
        borderRadius: 9,
        backgroundColor: color,
        marginLeft: -length / 2,
        marginTop: -0.9,
        transformOrigin: "center",
        display: "block",
    }
    return (
        <span
            aria-hidden="true"
            style={{
                width: 21,
                height: 21,
                display: "block",
                position: "relative",
            }}
        >
            <motion.span
                style={line}
                initial={false}
                animate={{ y: open ? 0 : -offset, rotate: open ? 45 : 0 }}
                transition={transition}
            />
            <motion.span
                style={line}
                initial={false}
                animate={{
                    y: open ? 0 : offset,
                    rotate: open ? -45 : type === "plus" ? 90 : 0,
                }}
                transition={transition}
            />
        </span>
    )
}

function TriggerBrand({ props }: { props: Props }) {
    return (
        <span
            style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                minWidth: 0,
                overflow: "hidden",
            }}
        >
            {props.triggerType === "logo" && fileSrc(props.triggerLogo) ? (
                <img
                    src={fileSrc(props.triggerLogo)}
                    srcSet={props.triggerLogo?.srcSet}
                    alt={props.triggerLogo?.alt || props.triggerText || "Home"}
                    style={{
                        width: Math.max(40, props.logoWidth),
                        maxWidth: "100%",
                        maxHeight: Math.max(26, props.closedHeight - 12),
                        objectFit: "contain",
                        objectPosition: "left center",
                        display: "block",
                    }}
                />
            ) : (
                <span
                    style={{
                        ...props.triggerFont,
                        display: "block",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        lineHeight: 1.2,
                        color: props.foreground,
                    }}
                >
                    {props.triggerText || "MENU"}
                </span>
            )}
        </span>
    )
}

function ToggleVisual({ props, open }: { props: Props; open: boolean }) {
    return (
        <span
            style={{
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                width: props.iconBoxSize,
                height: props.iconBoxSize,
                background: props.iconBackground,
                borderRadius: props.iconBoxRadius,
                transition: "background-color 180ms ease",
            }}
        >
            <MenuGlyph
                open={open}
                type={props.iconType}
                color={props.iconForeground}
            />
        </span>
    )
}

/**
 * Thin, square-ended northeast arrow from the user's reference image.
 * Straight horizontal and vertical bars form a hard top-right corner;
 * a diagonal runs into that corner. SVG scales to 1em with the nav font.
 */
function ReferenceArrow() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 32 32"
            width="1em"
            height="1em"
            focusable="false"
            style={{
                display: "block",
                width: "1em",
                height: "1em",
                flex: "0 0 1em",
                color: "inherit",
            }}
        >
            <path
                d="M5 5 H27 V27 M4.5 27.5 L26.9 5.1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="butt"
                strokeLinejoin="miter"
            />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 230
 * @framerIntrinsicHeight 50
 */
export default function NotchMenuV63(props: Props) {
    // Framer-approved static guard: Canvas AND asset/thumbnail export.
    const onCanvas = useIsStaticRenderer()
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const [focusRing, setFocusRing] = useState<string | null>(null)
    const anchorRef = useRef<HTMLDivElement>(null)
    const shellRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const toggleRef = useRef<HTMLButtonElement>(null)
    const wasOpenRef = useRef(false)
    const menuScrollRef = useRef<HTMLDivElement>(null)
    const navId = React.useId()
    const [viewport, setViewport] = useState(readViewport)
    const [anchor, setAnchor] = useState({ center: 0, top: 0, measured: false })
    // An intentionally empty list stays empty (do not secretly restore defaults).
    const items = Array.isArray(props.items)
        ? props.items.filter((item) => Boolean(item && item.label?.trim()))
        : ITEMS
    const closedCorners = { ...CLOSED, ...(props.closedCorners || {}) }
    const openCorners = { ...OPEN, ...(props.openCorners || {}) }

    // The tint is painted on the SAME shell element as the V6.1 morph. There
    // is no replacement panel / duplicate background during expansion.
    const appearanceMode = props.appearanceMode || "adaptive"
    const closedGlass = appearanceMode !== "solid"
    const expandedGlass = appearanceMode === "glass"
    const glassFill = rgbaTint(props.glassTint, props.glassOpacity ?? 85)
    const closedFill = closedGlass ? glassFill : props.background
    const expandedFill = expandedGlass ? glassFill : props.background
    const glassBlur = limit(props.glassBlur ?? 20, 0, 40)
    const currentFill = open ? expandedFill : closedFill
    const currentBlur = open
        ? expandedGlass
            ? glassBlur
            : 0
        : closedGlass
          ? glassBlur
          : 0
    const glassBorderAlpha = limit(props.glassBorderOpacity ?? 35, 0, 100) / 100
    const currentBorderOpacity = (open ? expandedGlass : closedGlass)
        ? glassBorderAlpha
        : 0

    // Observe only what the current mode needs:
    // - resize always, so the floating trigger remains responsive when collapsed;
    // - visualViewport changes only while expanded (mobile browser chrome/keyboard);
    // - scroll position only while collapsed in Follow Frame mode, because the
    //   fixed portal must track the actual frame's on-screen position;
    // - ResizeObserver on that frame rather than observing the whole document.
    useLayoutEffect(() => {
        if (onCanvas || typeof window === "undefined") return
        const followFrame = props.placement === "frame"
        let raf = 0
        let viewportDirty = false
        let anchorDirty = false

        const measureViewport = () => {
            const next = readViewport()
            setViewport((prev) =>
                prev.width === next.width &&
                prev.height === next.height &&
                prev.left === next.left &&
                prev.top === next.top
                    ? prev
                    : next
            )
        }
        const measureAnchor = () => {
            if (!followFrame) return
            const rect = anchorRef.current?.getBoundingClientRect()
            if (!rect) return
            const center = rect.left + rect.width / 2
            const top = rect.top
            setAnchor((prev) =>
                prev.measured &&
                Math.abs(prev.center - center) < 0.5 &&
                Math.abs(prev.top - top) < 0.5
                    ? prev
                    : { center, top, measured: true }
            )
        }
        const flush = () => {
            raf = 0
            const updateViewport = viewportDirty
            const updateAnchor = anchorDirty
            viewportDirty = false
            anchorDirty = false
            if (updateViewport) measureViewport()
            if (updateAnchor) measureAnchor()
        }
        const schedule = (checkViewport: boolean, checkAnchor: boolean) => {
            viewportDirty = viewportDirty || checkViewport
            anchorDirty = anchorDirty || checkAnchor
            if (!raf) raf = window.requestAnimationFrame(flush)
        }
        const onResize = () => schedule(true, followFrame)
        const onVisualViewportChange = () => schedule(true, followFrame)
        const onFrameScroll = () => schedule(false, true)
        const onAnchorResize = () => schedule(false, true)

        measureViewport()
        if (followFrame) measureAnchor()
        window.addEventListener("resize", onResize, { passive: true })
        if (open) {
            window.visualViewport?.addEventListener(
                "resize",
                onVisualViewportChange
            )
            window.visualViewport?.addEventListener(
                "scroll",
                onVisualViewportChange
            )
        }
        if (followFrame && !open) {
            // Capture nested scrolling containers as well as window scrolling.
            window.addEventListener("scroll", onFrameScroll, true)
        }
        const observer =
            followFrame && typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(onAnchorResize)
                : null
        if (anchorRef.current) observer?.observe(anchorRef.current)

        return () => {
            window.removeEventListener("resize", onResize)
            window.visualViewport?.removeEventListener(
                "resize",
                onVisualViewportChange
            )
            window.visualViewport?.removeEventListener(
                "scroll",
                onVisualViewportChange
            )
            window.removeEventListener("scroll", onFrameScroll, true)
            observer?.disconnect()
            if (raf) window.cancelAnimationFrame(raf)
        }
    }, [onCanvas, open, props.placement])

    // Keep wheel/touch guards on the OVERLAY node, never on document/window.
    // The backdrop catches outside gestures; the inner menu retains native
    // scrolling when content exceeds the visible viewport. No scrollTo resets.
    useEffect(() => {
        if (!open || onCanvas || typeof window === "undefined") return
        const overlay = overlayRef.current
        if (!overlay) return
        let lastTouchY = 0
        let lastTouchX = 0

        const canScrollMenu = (
            target: EventTarget | null,
            deltaY: number,
            deltaX = 0
        ) => {
            const container = menuScrollRef.current
            if (
                !container ||
                !(target instanceof Node) ||
                !container.contains(target)
            )
                return false

            const maxY = container.scrollHeight - container.clientHeight
            const maxX = container.scrollWidth - container.clientWidth
            if (Math.abs(deltaY) >= Math.abs(deltaX)) {
                if (maxY <= 1) return false
                if (deltaY > 0) return container.scrollTop < maxY - 1
                if (deltaY < 0) return container.scrollTop > 1
                return true
            }
            if (maxX <= 1) return false
            if (deltaX > 0) return container.scrollLeft < maxX - 1
            if (deltaX < 0) return container.scrollLeft > 1
            return true
        }
        const stopWheel = (event: WheelEvent) => {
            // Preserve native browser zoom gestures.
            if (event.ctrlKey || event.metaKey) return
            if (!canScrollMenu(event.target, event.deltaY, event.deltaX)) {
                if (event.cancelable) event.preventDefault()
            }
        }
        const rememberTouch = (event: TouchEvent) => {
            if (event.touches.length !== 1) return
            lastTouchX = event.touches[0].clientX
            lastTouchY = event.touches[0].clientY
        }
        const stopTouch = (event: TouchEvent) => {
            if (event.touches.length !== 1) return
            const touch = event.touches[0]
            const deltaY = lastTouchY - touch.clientY
            const deltaX = lastTouchX - touch.clientX
            lastTouchX = touch.clientX
            lastTouchY = touch.clientY
            if (!canScrollMenu(event.target, deltaY, deltaX)) {
                if (event.cancelable) event.preventDefault()
            }
        }
        overlay.addEventListener("wheel", stopWheel, {
            passive: false,
            capture: true,
        })
        overlay.addEventListener("touchstart", rememberTouch, {
            passive: true,
            capture: true,
        })
        overlay.addEventListener("touchmove", stopTouch, {
            passive: false,
            capture: true,
        })
        return () => {
            overlay.removeEventListener("wheel", stopWheel, true)
            overlay.removeEventListener("touchstart", rememberTouch, true)
            overlay.removeEventListener("touchmove", stopTouch, true)
        }
    }, [open, onCanvas])

    // Focus moves into the modal when opened and returns to its toggle on
    // close. Keyboard trapping itself is handled by the shell's own event
    // handler below, not a permanent or document-wide keydown subscription.
    useEffect(() => {
        if (onCanvas || typeof window === "undefined") return
        if (!open) {
            if (wasOpenRef.current) {
                toggleRef.current?.focus({ preventScroll: true })
            }
            wasOpenRef.current = false
            return
        }
        wasOpenRef.current = true
        const focusTimer = window.setTimeout(() => {
            const firstNav =
                menuScrollRef.current?.querySelector<HTMLAnchorElement>(
                    'nav a[href]:not([tabindex="-1"])'
                )
            ;(firstNav || toggleRef.current)?.focus({ preventScroll: true })
        }, 300)
        return () => window.clearTimeout(focusTimer)
    }, [open, onCanvas])

    const handleModalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!open) return
        if (event.key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
            setOpen(false)
            return
        }
        if (event.key === "Tab") {
            const shell = shellRef.current
            if (!shell) return
            const elements = Array.from(
                shell.querySelectorAll<HTMLElement>(
                    'a[href]:not([tabindex="-1"]), button:not([disabled]), [tabindex="0"]'
                )
            ).filter((element) => element.getClientRects().length > 0)
            if (!elements.length) {
                event.preventDefault()
                return
            }
            const first = elements[0]
            const last = elements[elements.length - 1]
            const focused = document.activeElement
            if (event.shiftKey && focused === first) {
                event.preventDefault()
                last.focus({ preventScroll: true })
            } else if (!event.shiftKey && focused === last) {
                event.preventDefault()
                first.focus({ preventScroll: true })
            }
            return
        }
        // Scroll keys are handled only while keyboard focus is inside our
        // dialog. This leaves unrelated page components untouched.
        if (
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.defaultPrevented
        )
            return
        const target = event.target
        if (
            target instanceof HTMLElement &&
            (target.isContentEditable ||
                /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
        )
            return
        if (event.key === " " && target instanceof HTMLButtonElement) return

        const container = menuScrollRef.current
        const page = container?.clientHeight || 400
        let step: number | null = null
        if (event.key === "ArrowDown") step = 64
        if (event.key === "ArrowUp") step = -64
        if (event.key === "PageDown" || event.key === " ")
            step = page * (event.shiftKey ? -0.85 : 0.85)
        if (event.key === "PageUp") step = -page * 0.85
        if (event.key === "Home") step = -Number.MAX_SAFE_INTEGER
        if (event.key === "End") step = Number.MAX_SAFE_INTEGER
        if (step === null) return
        event.preventDefault()
        if (container) container.scrollTop += step
    }

    // Local focus-visible state replaces the per-instance <style> tag.
    // Browser :focus-visible matching avoids outlines on mouse clicks.
    const showFocusRing = (
        event: React.FocusEvent<HTMLElement>,
        key: string
    ) => {
        setFocusRing(event.currentTarget.matches(":focus-visible") ? key : null)
    }
    const hideFocusRing = (key: string) => {
        setFocusRing((prev) => (prev === key ? null : prev))
    }

    const mobile = viewport.width < 680
    const tablet = viewport.width >= 680 && viewport.width < 1024
    const outerGap = mobile ? 16 : tablet ? 24 : 40
    const safeHorizontal = Math.min(
        Math.max(6, props.edgeMargin, outerGap),
        Math.max(0, (viewport.width - 1) / 2)
    )
    const safeVertical = Math.min(
        mobile ? 12 : tablet ? 16 : 24,
        Math.max(0, (viewport.height - 1) / 2)
    )
    // Both states are safe on narrow mobile / split-screen viewports.
    const openW = Math.max(1, viewport.width - safeHorizontal * 2)
    const closedW = Math.min(Math.max(1, props.closedWidth), openW)
    const closedH = Math.min(
        Math.max(1, props.closedHeight),
        Math.max(1, viewport.height - safeVertical * 2)
    )
    const sourceTop =
        props.placement === "viewport"
            ? viewport.top + props.topOffset
            : anchor.top
    const closedTop =
        props.placement === "viewport"
            ? limit(
                  sourceTop,
                  viewport.top + safeVertical,
                  viewport.top + viewport.height - safeVertical - closedH
              )
            : sourceTop
    const sourceCenter =
        props.placement === "frame"
            ? anchor.center
            : props.horizontal === "left"
              ? viewport.left + safeHorizontal + closedW / 2
              : props.horizontal === "right"
                ? viewport.left + viewport.width - safeHorizontal - closedW / 2
                : viewport.left + viewport.width / 2
    const desiredCenter = sourceCenter + props.xOffset
    const closedCenter = limit(
        desiredCenter,
        viewport.left + safeHorizontal + closedW / 2,
        viewport.left + viewport.width - safeHorizontal - closedW / 2
    )

    // A trigger placed low in the page can expand UPWARDS to remain in view.
    // Otherwise the open panel retains its top offset, with a balanced bottom gap.
    const usableHeight = Math.max(1, viewport.height - safeVertical * 2)
    const minComfortableHeight = mobile ? 320 : tablet ? 380 : 440
    const maxOpenTop = Math.max(
        safeVertical,
        viewport.height -
            Math.max(safeVertical, outerGap) -
            Math.min(minComfortableHeight, usableHeight)
    )
    const openTop =
        viewport.top + limit(closedTop - viewport.top, safeVertical, maxOpenTop)
    const bottomGap = Math.max(
        safeVertical,
        Math.min(openTop - viewport.top, outerGap)
    )
    const openH = Math.max(
        1,
        viewport.height - (openTop - viewport.top) - bottomGap
    )
    const openLeft = viewport.left + safeHorizontal
    const closedLeft = closedCenter - closedW / 2

    // Physically animate ONE element's rectangular box. These individual
    // numeric values interpolate
    // reliably with Framer Motion in a spring animation.
    const openPadding = limit(props.openPadding ?? 18, 8, mobile ? 28 : 64)
    const triggerOpenTop = Math.max(
        0,
        openPadding - (closedH - props.iconBoxSize) / 2
    )
    const bodyTop = closedH + openPadding
    const shellTween = SHAPE_SPRING
    const bodyTween = {
        opacity: {
            duration: open ? 0.34 : 0.12,
            delay: open ? 0.24 : 0,
            ease: SOFT_EASE,
        },
        y: {
            duration: open ? 0.4 : 0.14,
            delay: open ? 0.22 : 0,
            ease: SOFT_EASE,
        },
    }
    const navFontSize =
        Number.parseFloat(String(props.menuFont?.fontSize ?? 48)) || 48
    const navSize = mobile
        ? Math.min(38, Math.max(27, viewport.width * 0.086), navFontSize)
        : tablet
          ? Math.min(45, navFontSize)
          : navFontSize
    const safeActive = items.length
        ? limit(activeIndex, 0, items.length - 1)
        : 0
    const selected = items[safeActive]
    const close = () => setOpen(false)
    const toggle = () => setOpen((v) => !v)
    const brandStyle: React.CSSProperties = {
        flex: "1 1 auto",
        display: "flex",
        alignItems: "center",
        height: "100%",
        minWidth: 0,
        color: props.foreground,
        textDecoration: "none",
        cursor: "pointer",
        outlineOffset: 3,
        outline: focusRing === "brand" ? "2px solid currentColor" : "none",
        borderRadius: 3,
        WebkitTapHighlightColor: "transparent",
    }
    const toggleStyle: React.CSSProperties = {
        flex: "0 0 auto",
        display: "grid",
        placeItems: "center",
        padding: 0,
        width: props.iconBoxSize,
        height: props.iconBoxSize,
        border: 0,
        background: "transparent",
        appearance: "none",
        cursor: "pointer",
        outline: focusRing === "toggle" ? "2px solid currentColor" : "none",
        outlineOffset: 3,
        borderRadius: 3,
        WebkitTapHighlightColor: "transparent",
    }
    const triggerBase: React.CSSProperties = {
        height: closedH,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0 7px 0 14px",
        boxSizing: "border-box",
        border: "none",
        background: "transparent",
        color: props.foreground,
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
    }

    // Canvas: visible closed-state shape that follows the editable Framer frame.
    // No fixed portal on Canvas, so placement is intuitive when designing.
    if (onCanvas) {
        return (
            <div
                ref={anchorRef}
                style={{
                    ...props.style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: `min(${closedW}px, 100%)`,
                        height: closedH,
                        backgroundColor: closedFill,
                        backdropFilter: `blur(${closedGlass ? glassBlur : 0}px)`,
                        WebkitBackdropFilter: `blur(${closedGlass ? glassBlur : 0}px)`,
                        color: props.foreground,
                        overflow: "hidden",
                        borderTopLeftRadius: closedCorners.topLeft,
                        borderTopRightRadius: closedCorners.topRight,
                        borderBottomRightRadius: closedCorners.bottomRight,
                        borderBottomLeftRadius: closedCorners.bottomLeft,
                        // Overlay-only rim; no external drop shadow or layout shift.
                        boxShadow:
                            closedGlass && glassBorderAlpha > 0
                                ? `inset 0 0 0 ${limit(props.glassBorderWidth ?? 1, 0, 3)}px ${rgbaTint(props.glassBorderColor, props.glassBorderOpacity ?? 35)}`
                                : "none",
                    }}
                >
                    <div style={{ ...triggerBase, width: "100%" }}>
                        <span style={{ ...brandStyle, cursor: "default" }}>
                            <TriggerBrand props={props} />
                        </span>
                        <span style={{ ...toggleStyle, cursor: "default" }}>
                            <ToggleVisual props={props} open={false} />
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    const body = (
        <motion.div
            ref={menuScrollRef}
            id={navId}
            initial={false}
            animate={{ opacity: open ? 1 : 0, y: open ? 0 : 10 }}
            transition={bodyTween}
            aria-hidden={!open}
            style={{
                position: "absolute",
                left: 0,
                top: bodyTop,
                width: openW,
                height: Math.max(0, openH - bodyTop),
                boxSizing: "border-box",
                pointerEvents: open ? "auto" : "none",
                display: "flex",
                flexDirection: "column",
                padding: `0 ${openPadding}px ${openPadding}px`,
                overflowY: "auto",
                overscrollBehavior: "contain",
                touchAction: "pan-y",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                color: props.foreground,
                minHeight: 0,
            }}
        >
            <div
                style={{
                    display: "grid",
                    flex: "1 0 100%",
                    minHeight: "100%",
                    alignItems: "stretch",
                    gridTemplateColumns:
                        props.showPreview && !mobile
                            ? "minmax(0, 1.03fr) minmax(0, .97fr)"
                            : "minmax(0, 1fr)",
                    columnGap: tablet ? 22 : 30,
                    rowGap: 22,
                }}
            >
                <nav aria-label="Main navigation" style={{ minWidth: 0 }}>
                    <div>
                        {items.length === 0 && (
                            <p
                                style={{
                                    color: props.muted,
                                    fontSize: 16,
                                    margin: 0,
                                }}
                            >
                                Add menu items in the Framer Properties panel.
                            </p>
                        )}
                        {items.map((item, i) => (
                            <motion.a
                                key={`${item.label}-${i}`}
                                href={safeUrl(item.url, "#")}
                                tabIndex={open ? 0 : -1}
                                onClick={(event) => {
                                    if (!safeUrl(item.url)) {
                                        event.preventDefault()
                                        return
                                    }
                                    setOpen(false)
                                }}
                                onMouseEnter={() => setActiveIndex(i)}
                                onFocus={(event) => {
                                    setActiveIndex(i)
                                    showFocusRing(event, `nav-${i}`)
                                }}
                                onBlur={() => hideFocusRing(`nav-${i}`)}
                                whileHover={{ x: 5 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 26,
                                }}
                                style={{
                                    ...props.menuFont,
                                    textDecoration: "none",
                                    lineHeight: 1.12,
                                    letterSpacing: "-0.045em",
                                    fontSize: navSize,
                                    color:
                                        safeActive === i
                                            ? props.foreground
                                            : props.muted,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: mobile ? "4px 0" : "5px 0 9px",
                                    transition: "color 210ms ease",
                                    outlineOffset: 3,
                                    outline:
                                        focusRing === `nav-${i}`
                                            ? "2px solid currentColor"
                                            : "none",
                                    borderRadius: 3,
                                }}
                            >
                                <span
                                    style={{
                                        overflowWrap: "anywhere",
                                        minWidth: 0,
                                    }}
                                >
                                    {item.label}
                                </span>
                                <span
                                    aria-hidden="true"
                                    style={{
                                        display: "inline-flex",
                                        flex: "0 0 1em",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: navSize,
                                        lineHeight: 1,
                                        letterSpacing: 0,
                                        opacity: safeActive === i ? 1 : 0.35,
                                        color: props.accent,
                                    }}
                                >
                                    <ReferenceArrow />
                                </span>
                            </motion.a>
                        ))}
                    </div>
                </nav>
                {props.showPreview && items.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                            minHeight: mobile ? 150 : 220,
                            height: "100%",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                flex: "1 1 auto",
                                minHeight: mobile ? 142 : 185,
                                borderRadius: 12,
                                overflow: "hidden",
                                background: "#D0D1C9",
                            }}
                        >
                            <AnimatePresence initial={false}>
                                <motion.div
                                    key={safeActive}
                                    initial={{ opacity: 0, scale: 1.025 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.01 }}
                                    transition={{
                                        opacity: { duration: 0.27 },
                                        scale: {
                                            duration: 0.55,
                                            ease: SOFT_EASE,
                                        },
                                    }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                            FALLBACK_ART[
                                                safeActive % FALLBACK_ART.length
                                            ],
                                    }}
                                >
                                    {fileSrc(selected?.image) && (
                                        <img
                                            src={fileSrc(selected?.image)}
                                            srcSet={selected?.image?.srcSet}
                                            alt={
                                                selected?.image?.alt ||
                                                selected?.label ||
                                                "Project preview"
                                            }
                                            draggable={false}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )

    const scene = (
        <div
            ref={overlayRef}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                pointerEvents: open ? "auto" : "none",
                overflow: "hidden",
                overscrollBehavior: "none",
            }}
        >
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="backdrop"
                        aria-hidden="true"
                        onClick={close}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            padding: 0,
                            border: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "auto",
                            background: props.dimBackground
                                ? "rgba(0,0,0,0.17)"
                                : "transparent",
                            cursor: "default",
                        }}
                    />
                )}
            </AnimatePresence>
            <motion.div
                className="notch-v6"
                ref={shellRef}
                onKeyDownCapture={handleModalKeyDown}
                role={open ? "dialog" : undefined}
                aria-modal={open ? true : undefined}
                aria-label={open ? "Site navigation" : undefined}
                initial={false}
                animate={{
                    top: open ? openTop : closedTop,
                    left: open ? openLeft : closedLeft,
                    width: open ? openW : closedW,
                    height: open ? openH : closedH,
                    borderTopLeftRadius: open
                        ? openCorners.topLeft
                        : closedCorners.topLeft,
                    borderTopRightRadius: open
                        ? openCorners.topRight
                        : closedCorners.topRight,
                    borderBottomRightRadius: open
                        ? openCorners.bottomRight
                        : closedCorners.bottomRight,
                    borderBottomLeftRadius: open
                        ? openCorners.bottomLeft
                        : closedCorners.bottomLeft,
                }}
                transition={shellTween}
                style={{
                    position: "absolute",
                    top: closedTop,
                    left: closedLeft,
                    width: closedW,
                    height: closedH,
                    borderTopLeftRadius: closedCorners.topLeft,
                    borderTopRightRadius: closedCorners.topRight,
                    borderBottomRightRadius: closedCorners.bottomRight,
                    borderBottomLeftRadius: closedCorners.bottomLeft,
                    boxSizing: "border-box",
                    isolation: "isolate",
                    backgroundColor: currentFill,
                    backdropFilter: `blur(${currentBlur}px)`,
                    WebkitBackdropFilter: `blur(${currentBlur}px)`,
                    transition: [
                        "background-color 360ms cubic-bezier(0.22, 1, 0.36, 1)",
                        "backdrop-filter 360ms cubic-bezier(0.22, 1, 0.36, 1)",
                        "-webkit-backdrop-filter 360ms cubic-bezier(0.22, 1, 0.36, 1)",
                    ].join(", "),
                    color: props.foreground,
                    pointerEvents: "auto",
                    overflow: "hidden",
                    fontFamily: "Inter, Arial, sans-serif",
                    willChange: "top, left, width, height, border-radius",
                    // SAME uninterrupted painted background at every frame.
                    // Intentionally zero shadow in both states.
                }}
            >
                <motion.div
                    initial={false}
                    animate={{
                        top: open ? triggerOpenTop : 0,
                        paddingLeft: open ? openPadding : 14,
                        paddingRight: open ? openPadding : 7,
                    }}
                    transition={shellTween}
                    style={{
                        ...triggerBase,
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        zIndex: 2,
                    }}
                >
                    {/* Separate link: the logo/text ALWAYS goes Home, even when the menu is open. */}
                    <a
                        href={safeUrl(props.homeUrl, "/")}
                        onClick={() => setOpen(false)}
                        onFocus={(event) => showFocusRing(event, "brand")}
                        onBlur={() => hideFocusRing("brand")}
                        aria-label="Go to home"
                        style={brandStyle}
                    >
                        <TriggerBrand props={props} />
                    </a>
                    {/* The burger/X alone toggles expansion. No nested click handlers. */}
                    <button
                        type="button"
                        ref={toggleRef}
                        onClick={toggle}
                        onFocus={(event) => showFocusRing(event, "toggle")}
                        onBlur={() => hideFocusRing("toggle")}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-controls={navId}
                        aria-label={open ? "Close menu" : "Open menu"}
                        style={toggleStyle}
                    >
                        <ToggleVisual props={props} open={open} />
                    </button>
                </motion.div>
                {body}
                {/* Thin glass highlight follows the SAME shape, without altering its size. */}
                <motion.div
                    aria-hidden="true"
                    initial={false}
                    animate={{ opacity: currentBorderOpacity }}
                    transition={{ duration: 0.36, ease: SOFT_EASE }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        boxSizing: "border-box",
                        border: `${limit(props.glassBorderWidth ?? 1, 0, 3)}px solid ${props.glassBorderColor || "#FFFFFF"}`,
                        borderRadius: "inherit",
                        zIndex: 3,
                        pointerEvents: "none",
                    }}
                />
            </motion.div>
        </div>
    )

    return (
        <>
            <div
                ref={anchorRef}
                style={{
                    ...props.style,
                    width: "100%",
                    height: "100%",
                    minHeight: 1,
                    position: "relative",
                    pointerEvents: "none",
                }}
            />
            {typeof document !== "undefined" &&
            (props.placement === "viewport" || anchor.measured)
                ? createPortal(scene, document.body)
                : null}
        </>
    )
}

NotchMenuV63.defaultProps = {
    items: ITEMS,
    triggerType: "text",
    triggerText: "STUDIO",
    homeUrl: "/",
    logoWidth: 142,
    triggerFont: {
        fontFamily: "Inter",
        fontSize: 19,
        fontWeight: 700,
        letterSpacing: "-0.045em",
    },
    iconType: "lines",
    iconBoxSize: 37,
    iconBoxRadius: 4,
    iconBackground: "#E9E9E5",
    iconForeground: "#161616",
    background: "#F1F1ED",
    appearanceMode: "adaptive",
    glassTint: "#F1F1ED",
    glassOpacity: 85,
    glassBlur: 20,
    glassBorderColor: "#FFFFFF",
    glassBorderOpacity: 35,
    glassBorderWidth: 1,
    foreground: "#171717",
    muted: "#93938E",
    accent: "#171717",
    menuFont: { fontFamily: "Inter", fontSize: 49, fontWeight: 500 },
    showPreview: true,
    dimBackground: false,
    placement: "frame",
    horizontal: "center",
    topOffset: 24,
    xOffset: 0,
    edgeMargin: 12,
    openPadding: 18,
    closedWidth: 230,
    closedHeight: 50,
    closedCorners: CLOSED,
    openCorners: OPEN,
}

const closedRadiusControls = {
    topLeft: {
        type: ControlType.Number,
        title: "Top Left",
        min: 0,
        max: 100,
        defaultValue: 4,
        unit: "px",
    },
    topRight: {
        type: ControlType.Number,
        title: "Top Right",
        min: 0,
        max: 100,
        defaultValue: 4,
        unit: "px",
    },
    bottomRight: {
        type: ControlType.Number,
        title: "Bottom Right",
        min: 0,
        max: 100,
        defaultValue: 4,
        unit: "px",
    },
    bottomLeft: {
        type: ControlType.Number,
        title: "Bottom Left",
        min: 0,
        max: 100,
        defaultValue: 4,
        unit: "px",
    },
}
const openRadiusControls = {
    topLeft: {
        type: ControlType.Number,
        title: "Top Left",
        min: 0,
        max: 120,
        defaultValue: 12,
        unit: "px",
    },
    topRight: {
        type: ControlType.Number,
        title: "Top Right",
        min: 0,
        max: 120,
        defaultValue: 12,
        unit: "px",
    },
    bottomRight: {
        type: ControlType.Number,
        title: "Bottom Right",
        min: 0,
        max: 120,
        defaultValue: 12,
        unit: "px",
    },
    bottomLeft: {
        type: ControlType.Number,
        title: "Bottom Left",
        min: 0,
        max: 120,
        defaultValue: 12,
        unit: "px",
    },
}

addPropertyControls(NotchMenuV63, {
    triggerType: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["text", "logo"],
        optionTitles: ["Text", "Logo"],
        defaultValue: "text",
        displaySegmentedControl: true,
    },
    triggerText: {
        type: ControlType.String,
        title: "Text / Alt",
        defaultValue: "STUDIO",
        description: "Clickable text, or fallback if no logo is uploaded.",
    },
    homeUrl: {
        type: ControlType.Link,
        title: "Home Link",
        defaultValue: "/",
        description:
            "Clicking the trigger text/logo navigates here. Only the toggle icon opens the menu.",
    },
    triggerLogo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
        hidden: (p) => p.triggerType !== "logo",
    },
    logoWidth: {
        type: ControlType.Number,
        title: "Logo Width",
        min: 40,
        max: 330,
        defaultValue: 142,
        unit: "px",
        hidden: (p) => p.triggerType !== "logo",
    },
    triggerFont: {
        type: ControlType.Font,
        title: "Trigger Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 19,
            variant: "Bold",
            letterSpacing: "-0.045em",
        },
        hidden: (p) => p.triggerType !== "text",
    },
    iconType: {
        type: ControlType.Enum,
        title: "Toggle Icon",
        options: ["lines", "plus"],
        optionTitles: ["Hamburger ↔ X", "Plus ↔ X"],
        defaultValue: "lines",
    },
    iconBoxSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 37,
        min: 24,
        max: 68,
        unit: "px",
    },
    iconBoxRadius: {
        type: ControlType.Number,
        title: "Icon Radius",
        defaultValue: 4,
        min: 0,
        max: 34,
        unit: "px",
    },
    iconBackground: {
        type: ControlType.Color,
        title: "Icon BG",
        defaultValue: "#E9E9E5",
    },
    iconForeground: {
        type: ControlType.Color,
        title: "Icon Lines",
        defaultValue: "#161616",
    },
    items: {
        type: ControlType.Array,
        title: "Menu Items",
        maxCount: 9,
        defaultValue: ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "New page",
                },
                url: { type: ControlType.Link, title: "Link" },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Preview Image",
                },
            },
        },
    },
    menuFont: {
        type: ControlType.Font,
        title: "Menu Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 49,
            variant: "Medium",
            letterSpacing: "-0.04em",
        },
    },
    showPreview: {
        type: ControlType.Boolean,
        title: "Image Preview",
        defaultValue: true,
    },
    appearanceMode: {
        type: ControlType.Enum,
        title: "Appearance",
        options: ["solid", "glass", "adaptive"],
        optionTitles: ["Solid", "Glass", "Adaptive"],
        defaultValue: "adaptive",
        displaySegmentedControl: true,
        description:
            "Adaptive uses frosted glass when closed and solid color when expanded.",
    },
    background: {
        type: ControlType.Color,
        title: "Solid Color",
        defaultValue: "#F1F1ED",
        hidden: (p) => p.appearanceMode === "glass",
    },
    glassTint: {
        type: ControlType.Color,
        title: "Glass Tint",
        defaultValue: "#F1F1ED",
        hidden: (p) => p.appearanceMode === "solid",
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Opacity",
        defaultValue: 85,
        min: 20,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => p.appearanceMode === "solid",
    },
    glassBlur: {
        type: ControlType.Number,
        title: "Glass Blur",
        defaultValue: 20,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p) => p.appearanceMode === "solid",
    },
    glassBorderColor: {
        type: ControlType.Color,
        title: "Glass Border",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.appearanceMode === "solid",
    },
    glassBorderOpacity: {
        type: ControlType.Number,
        title: "Border Opacity",
        defaultValue: 35,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => p.appearanceMode === "solid",
    },
    glassBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.5,
        unit: "px",
        hidden: (p) => p.appearanceMode === "solid",
    },
    foreground: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#171717",
    },
    muted: {
        type: ControlType.Color,
        title: "Muted Color",
        defaultValue: "#93938E",
    },
    accent: {
        type: ControlType.Color,
        title: "Link Arrow",
        defaultValue: "#171717",
    },
    dimBackground: {
        type: ControlType.Boolean,
        title: "Dim Backdrop",
        defaultValue: false,
    },
    placement: {
        type: ControlType.Enum,
        title: "Position",
        options: ["frame", "viewport"],
        optionTitles: ["Follow Frame", "Fixed Viewport"],
        defaultValue: "frame",
    },
    horizontal: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        hidden: (p) => p.placement !== "viewport",
    },
    topOffset: {
        type: ControlType.Number,
        title: "Top Offset",
        min: 0,
        max: 450,
        defaultValue: 24,
        unit: "px",
        hidden: (p) => p.placement !== "viewport",
    },
    xOffset: {
        type: ControlType.Number,
        title: "X Offset",
        min: -500,
        max: 500,
        defaultValue: 0,
        unit: "px",
    },
    edgeMargin: {
        type: ControlType.Number,
        title: "Safe Margin",
        min: 6,
        max: 80,
        defaultValue: 12,
        unit: "px",
    },
    openPadding: {
        type: ControlType.Number,
        title: "Inner Padding",
        min: 8,
        max: 64,
        defaultValue: 18,
        unit: "px",
        description:
            "Equal horizontal and vertical padding inside the expanded menu.",
    },
    closedWidth: {
        type: ControlType.Number,
        title: "Closed Width",
        min: 150,
        max: 400,
        defaultValue: 230,
        unit: "px",
    },
    closedHeight: {
        type: ControlType.Number,
        title: "Closed Height",
        min: 42,
        max: 100,
        defaultValue: 50,
        unit: "px",
    },
    closedCorners: {
        type: ControlType.Object,
        title: "Closed Corners",
        controls: closedRadiusControls,
        defaultValue: CLOSED,
    },
    openCorners: {
        type: ControlType.Object,
        title: "Open Corners",
        controls: openRadiusControls,
        defaultValue: OPEN,
    },
})
