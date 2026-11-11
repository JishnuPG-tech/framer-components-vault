// @framerDisableUnlink
// @framerSupportedLayoutWidth: any
// @framerSupportedLayoutHeight: auto

/**
 * Kern_FlowingMenu — Interactive navigation menu with reveal overlays
 * @version 2.0.0
 * @description Animated nav rows with 5 reveal modes, marquee overlay,
 * pill/background images, magnetic text, custom cursor, and full responsive.
 * Built to NORMA_UNIFICADA v2.0 — KERN Studio.
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 */

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
    useSpring,
    useAnimationFrame,
    useReducedMotion,
    useInView,
} from "framer-motion"
import {
    useRef,
    useState,
    useLayoutEffect,
    useCallback,
    useMemo,
    type CSSProperties,
    type MouseEvent as RME,
} from "react"

/* ═══════════════════════════════════════════════════════════════════
   TYPES — Group Interfaces
   ═══════════════════════════════════════════════════════════════════ */

interface NavItem {
    label: string
    link: string
    image: { src: string; alt: string }
}

type RevealMode =
    | "edge-slide"
    | "clip-circle"
    | "horizontal-wipe"
    | "blur-in"
    | "split"

interface ColorsGroup {
    textColor: string
    backgroundColor: string
    overlayBg: string
    overlayText: string
}

interface BorderGroup {
    borderColor: string
    borderStyle: "solid" | "gradient-fade" | "dashed-subtle"
    borderWidth: number
}

interface TypographyGroup {
    fontSize: number
    fontSizeTablet: number
    fontSizeMobile: number
    fontWeight: number
    lineHeight: string
    letterSpacing: string
    textTransform: "none" | "uppercase" | "lowercase" | "capitalize"
    textAlign: "left" | "center" | "right"
}

interface LayoutGroup {
    rowHeight: number
    rowHeightTablet: number
    rowHeightMobile: number
    imageDisplayMode: "pill" | "background"
    imageWidth: number
    imageBorderRadius: number
    imageOpacity: number
}

interface AnimationGroup {
    revealMode: RevealMode
    marqueeSpeed: number
    slideDuration: number
    livingImages: boolean
}

interface MagneticTextGroup {
    scatterRadius: number
    scatterStrength: number
}

interface InteractionGroup {
    dimInactiveRows: boolean
    inactiveOpacity: number
}

interface CustomCursorGroup {
    cursorSize: number
    cursorColor: string
}

interface Props {
    items: NavItem[]
    font: CSSProperties
    ariaLabel: string
    colors: ColorsGroup
    border: BorderGroup
    typography: TypographyGroup
    layout: LayoutGroup
    animation: AnimationGroup
    magneticText?: MagneticTextGroup
    interaction: InteractionGroup
    customCursor?: CustomCursorGroup
    style?: CSSProperties
}

/* ═══════════════════════════════════════════════════════════════════
   DEFAULTS
   ═══════════════════════════════════════════════════════════════════ */

const COLORS_DEFAULTS: ColorsGroup = {
    textColor: "#FFFFFF",
    backgroundColor: "#0A0A0A",
    overlayBg: "#FFFFFF",
    overlayText: "#0A0A0A",
}

const BORDER_DEFAULTS: BorderGroup = {
    borderColor: "rgba(255,255,255,0.15)",
    borderStyle: "gradient-fade",
    borderWidth: 1,
}

const TYPOGRAPHY_DEFAULTS: TypographyGroup = {
    fontSize: 52,
    fontSizeTablet: 38,
    fontSizeMobile: 26,
    fontWeight: 600,
    lineHeight: "1.1",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    textAlign: "center",
}

const LAYOUT_DEFAULTS: LayoutGroup = {
    rowHeight: 150,
    rowHeightTablet: 110,
    rowHeightMobile: 80,
    imageDisplayMode: "pill",
    imageWidth: 160,
    imageBorderRadius: 999,
    imageOpacity: 0.3,
}

const ANIMATION_DEFAULTS: AnimationGroup = {
    revealMode: "edge-slide",
    marqueeSpeed: 180,
    slideDuration: 0.6,
    livingImages: true,
}

const MAGNETIC_DEFAULTS: MagneticTextGroup = {
    scatterRadius: 150,
    scatterStrength: 25,
}

const INTERACTION_DEFAULTS: InteractionGroup = {
    dimInactiveRows: true,
    inactiveOpacity: 0.35,
}

const CURSOR_DEFAULTS: CustomCursorGroup = {
    cursorSize: 64,
    cursorColor: "#FFFFFF",
}

const DEFAULT_ITEMS: NavItem[] = [
    {
        label: "Studio",
        link: "#",
        image: {
            src: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80",
            alt: "Studio showcase image",
        },
    },
    {
        label: "Archive",
        link: "#",
        image: {
            src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
            alt: "Archive collection image",
        },
    },
    {
        label: "Process",
        link: "#",
        image: {
            src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80",
            alt: "Process workflow image",
        },
    },
    {
        label: "Contact",
        link: "#",
        image: {
            src: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&q=80",
            alt: "Contact section image",
        },
    },
]

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const COPIES = 4
const SPRING_STD = { stiffness: 90, damping: 18, mass: 1.1 }
const SPRING_FAST = { stiffness: 120, damping: 14, mass: 0.9 }
const SPRING_SOFT = { stiffness: 60, damping: 20, mass: 1.2 }

function edgeY(mouseY: number, h: number): "top" | "bottom" {
    return mouseY < h / 2 ? "top" : "bottom"
}

/** Responsive clamp: mobile → tablet → desktop */
function clampPx(mobile: number, desktop: number): string {
    return `clamp(${mobile}px, calc(${mobile}px + (${desktop} - ${mobile}) * ((100vw - 390px) / (1440 - 390))), ${desktop}px)`
}

/* ═══════════════════════════════════════════════════════════════════
   PILL IMAGE — Sub-component
   ═══════════════════════════════════════════════════════════════════ */

interface PillProps {
    src: string
    alt: string
    w: number
    h: number
    radius: number
    living: boolean
    visible: boolean
    idx: number
    reduced: boolean
}

function Pill({
    src,
    alt,
    w,
    h,
    radius,
    living,
    visible,
    idx,
    reduced,
}: PillProps) {
    const shouldLive = living && visible && !reduced
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={
                visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }
            }
            transition={{
                opacity: {
                    type: "spring",
                    ...SPRING_STD,
                    delay: visible ? idx * 0.06 : 0,
                },
                scale: {
                    type: "spring",
                    ...SPRING_SOFT,
                    delay: visible ? idx * 0.06 : 0,
                },
            }}
            style={{
                width: w,
                height: h,
                borderRadius: radius,
                overflow: "hidden",
                flexShrink: 0,
                willChange: visible ? "transform, opacity" : "auto",
            }}
        >
            <motion.img
                src={src}
                alt={alt}
                loading="lazy"
                animate={shouldLive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={
                    shouldLive
                        ? { duration: 10, repeat: Infinity, ease: "easeInOut" }
                        : { type: "spring", ...SPRING_STD }
                }
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    willChange: shouldLive ? "transform" : "auto",
                }}
            />
        </motion.div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   MAGNETIC TEXT — Sub-component
   ═══════════════════════════════════════════════════════════════════ */

interface MagTextProps {
    text: string
    active: boolean
    cursor: { x: number; y: number }
    color: string
    font: CSSProperties
    radius: number
    strength: number
}

function MagText({
    text,
    active,
    cursor,
    color,
    font,
    radius,
    strength,
}: MagTextProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [offsets, setOffsets] = useState<{ x: number; y: number }[]>(() =>
        text.split("").map(() => ({ x: 0, y: 0 }))
    )

    useLayoutEffect(() => {
        if (!ref.current || !active) {
            setOffsets(text.split("").map(() => ({ x: 0, y: 0 })))
            return
        }
        const box = ref.current.getBoundingClientRect()
        const spans = ref.current.querySelectorAll<HTMLElement>("[data-mc]")
        const next = Array.from(spans).map((s) => {
            const r = s.getBoundingClientRect()
            const cx = r.left + r.width / 2 - box.left
            const cy = r.top + r.height / 2 - box.top
            const dx = cx - cursor.x
            const dy = cy - cursor.y
            const dist = Math.hypot(dx, dy)
            if (dist > radius || dist === 0) return { x: 0, y: 0 }
            const falloff = 1 - dist / radius
            const force = strength * falloff * falloff
            return { x: (dx / dist) * force, y: (dy / dist) * force }
        })
        setOffsets(next)
    }, [active, cursor.x, cursor.y, radius, strength, text])

    return (
        <div
            ref={ref}
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
                ...font,
                pointerEvents: "none",
            }}
        >
            {text.split("").map((ch, i) => (
                <motion.span
                    key={i}
                    data-mc
                    animate={{ x: offsets[i]?.x ?? 0, y: offsets[i]?.y ?? 0 }}
                    transition={{ type: "spring", ...SPRING_FAST }}
                    style={{
                        display: "inline-block",
                        willChange: active ? "transform" : "auto",
                    }}
                >
                    {ch === " " ? "\u00A0" : ch}
                </motion.span>
            ))}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   NAV ROW — Sub-component
   ═══════════════════════════════════════════════════════════════════ */

interface RowProps {
    item: NavItem
    idx: number
    total: number
    // Resolved values
    revealMode: RevealMode
    textColor: string
    bg: string
    overlayBg: string
    overlayText: string
    borderColor: string
    borderStyle: "solid" | "gradient-fade" | "dashed-subtle"
    borderWidth: number
    font: CSSProperties
    rowHeight: number
    imageDisplayMode: "pill" | "background"
    imageWidth: number
    imageBorderRadius: number
    imageOpacity: number
    marqueeSpeed: number
    slideDuration: number
    livingImages: boolean
    magneticEnabled: boolean
    scatterRadius: number
    scatterStrength: number
    isHoveredRow: boolean
    anyHover: boolean
    dimInactive: boolean
    inactiveOp: number
    cursorEnabled: boolean
    onHover: (h: boolean) => void
    reduced: boolean
    isStaticRenderer: boolean
}

function NavRow({
    item,
    idx,
    total,
    revealMode,
    textColor,
    bg,
    overlayBg,
    overlayText,
    borderColor,
    borderStyle,
    borderWidth,
    font,
    rowHeight,
    imageDisplayMode,
    imageWidth,
    imageBorderRadius,
    imageOpacity,
    marqueeSpeed,
    slideDuration,
    livingImages,
    magneticEnabled,
    scatterRadius,
    scatterStrength,
    isHoveredRow,
    anyHover,
    dimInactive,
    inactiveOp,
    cursorEnabled,
    onHover,
    reduced,
    isStaticRenderer,
}: RowProps) {
    const rowRef = useRef<HTMLAnchorElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(rowRef, { once: false, amount: 0.2 })
    const shouldAnimate = !isStaticRenderer && isInView && !reduced

    const [hover, setHover] = useState(false)
    const [overlay, setOverlay] = useState(false)
    const [edge, setEdge] = useState<"top" | "bottom">("top")
    const [cursor, setCursor] = useState({ x: 0, y: 0 })
    const [clipR, setClipR] = useState(0)
    const pendingCursorRef = useRef<{ x: number; y: number } | null>(null)
    const cursorRafRef = useRef<number>(0)

    // Marquee scroll
    const mx = useMotionValue(0)
    const hoverRef = useRef(false)
    const lastTimeRef = useRef(0)
    const rafIdRef = useRef(0)

    useAnimationFrame((time) => {
        if (
            !hoverRef.current ||
            reduced ||
            isStaticRenderer ||
            !trackRef.current
        )
            return
        if (lastTimeRef.current === 0) {
            lastTimeRef.current = time
            return
        }
        const delta = time - lastTimeRef.current
        lastTimeRef.current = time
        const part = trackRef.current.querySelector<HTMLElement>("[data-part]")
        if (!part) return
        const pw = part.offsetWidth
        if (pw === 0) return
        const cur = mx.get() - (delta * marqueeSpeed) / 1000
        mx.set(Math.abs(cur) >= pw ? cur + pw : cur)
    })

    // Handlers
    const enter = useCallback(
        (e: RME<HTMLAnchorElement>) => {
            if (!rowRef.current || isStaticRenderer) return
            const r = rowRef.current.getBoundingClientRect()
            const my = e.clientY - r.top
            const ex = e.clientX - r.left
            setEdge(edgeY(my, r.height))
            setCursor({ x: ex, y: my })
            const maxR = Math.max(
                Math.hypot(ex, my),
                Math.hypot(r.width - ex, my),
                Math.hypot(ex, r.height - my),
                Math.hypot(r.width - ex, r.height - my)
            )
            setClipR(maxR)
            setHover(true)
            hoverRef.current = true
            lastTimeRef.current = 0
            mx.set(0)
            onHover(true)
            rafIdRef.current = requestAnimationFrame(() => setOverlay(true))
        },
        [onHover, mx, isStaticRenderer]
    )

    const move = useCallback(
        (e: RME<HTMLAnchorElement>) => {
            if (!rowRef.current || !hoverRef.current || isStaticRenderer) return
            const r = rowRef.current.getBoundingClientRect()
            const cx = e.clientX - r.left
            const cy = e.clientY - r.top
            pendingCursorRef.current = { x: cx, y: cy }
            if (cursorRafRef.current) return
            cursorRafRef.current = requestAnimationFrame(() => {
                cursorRafRef.current = 0
                const next = pendingCursorRef.current
                if (!next || !rowRef.current) return
                setCursor(next)
                if (revealMode === "clip-circle") {
                    const maxR = Math.max(
                        Math.hypot(next.x, next.y),
                        Math.hypot(r.width - next.x, next.y),
                        Math.hypot(next.x, r.height - next.y),
                        Math.hypot(r.width - next.x, r.height - next.y)
                    )
                    setClipR(maxR)
                }
            })
        },
        [revealMode, isStaticRenderer]
    )

    const leave = useCallback(
        (e: RME<HTMLAnchorElement>) => {
            if (!rowRef.current) return
            const r = rowRef.current.getBoundingClientRect()
            const my = e.clientY - r.top
            setEdge(edgeY(my, r.height))
            setHover(false)
            hoverRef.current = false
            lastTimeRef.current = 0
            if (cursorRafRef.current) {
                cancelAnimationFrame(cursorRafRef.current)
                cursorRafRef.current = 0
            }
            setOverlay(false)
            onHover(false)
        },
        [onHover]
    )

    // Cleanup rAF from enter callback
    useLayoutEffect(() => {
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
            if (cursorRafRef.current) cancelAnimationFrame(cursorRafRef.current)
        }
    }, [])

    const rowOp = dimInactive && anyHover && !isHoveredRow ? inactiveOp : 1
    const isLast = idx === total - 1
    const hasSrc = !!item.image?.src
    const imgH = rowHeight * 0.6

    // Overlay animation per mode — spring physics
    const overlayAnim = useMemo(() => {
        if (revealMode === "edge-slide") {
            const from = edge === "top" ? "-101%" : "101%"
            return {
                initial: { y: from } as const,
                animate: overlay ? { y: "0%" } : { y: from },
                transition: { type: "spring" as const, ...SPRING_STD },
            }
        }
        if (revealMode === "clip-circle") {
            return {
                initial: {
                    clipPath: `circle(0px at ${cursor.x}px ${cursor.y}px)`,
                },
                animate: overlay
                    ? {
                          clipPath: `circle(${clipR + 50}px at ${cursor.x}px ${cursor.y}px)`,
                      }
                    : {
                          clipPath: `circle(0px at ${cursor.x}px ${cursor.y}px)`,
                      },
                transition: {
                    type: "spring" as const,
                    stiffness: 80,
                    damping: 22,
                    mass: 1.0,
                },
            }
        }
        if (revealMode === "horizontal-wipe") {
            const dir = idx % 2 === 0 ? "-101%" : "101%"
            return {
                initial: { x: dir } as const,
                animate: overlay ? { x: "0%" } : { x: dir },
                transition: { type: "spring" as const, ...SPRING_STD },
            }
        }
        if (revealMode === "blur-in") {
            return {
                initial: { opacity: 0, filter: "blur(20px)", scale: 0.96 },
                animate: overlay
                    ? { opacity: 1, filter: "blur(0px)", scale: 1 }
                    : { opacity: 0, filter: "blur(20px)", scale: 0.96 },
                transition: { type: "spring" as const, ...SPRING_SOFT },
            }
        }
        // split
        return {
            initial: { opacity: 1 } as const,
            animate: { opacity: 1 },
            transition: { duration: 0 },
        }
    }, [revealMode, edge, overlay, cursor.x, cursor.y, clipR, idx])

    // Inner content counter-animation
    const innerAnim = useMemo(() => {
        if (revealMode === "edge-slide") {
            const from = edge === "top" ? "101%" : "-101%"
            return {
                initial: { y: from } as const,
                animate: overlay ? { y: "0%" } : { y: from },
                transition: {
                    type: "spring" as const,
                    ...SPRING_STD,
                    delay: overlay ? 0.05 : 0,
                },
            }
        }
        if (revealMode === "horizontal-wipe") {
            const dir = idx % 2 === 0 ? "101%" : "-101%"
            return {
                initial: { x: dir } as const,
                animate: overlay ? { x: "0%" } : { x: dir },
                transition: {
                    type: "spring" as const,
                    ...SPRING_STD,
                    delay: overlay ? 0.05 : 0,
                },
            }
        }
        return {}
    }, [revealMode, edge, overlay, idx])

    // Border element
    const borderEl = !isLast && (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: `${borderWidth}px`,
                zIndex: 50,
                pointerEvents: "none",
                background:
                    borderStyle === "gradient-fade"
                        ? `linear-gradient(90deg, transparent 0%, ${borderColor} 8%, ${borderColor} 92%, transparent 100%)`
                        : borderStyle === "dashed-subtle"
                          ? "none"
                          : borderColor,
                borderBottom:
                    borderStyle === "dashed-subtle"
                        ? `${borderWidth}px dashed ${borderColor}`
                        : "none",
                opacity: borderStyle === "dashed-subtle" ? 0.35 : 1,
            }}
        />
    )

    // Background image (for background mode)
    const backgroundImage = imageDisplayMode === "background" && hasSrc && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={overlay ? { opacity: imageOpacity } : { opacity: 0 }}
            transition={{ type: "spring", ...SPRING_SOFT }}
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                pointerEvents: "none",
                willChange: overlay ? "opacity" : "auto",
            }}
        >
            <motion.div
                animate={
                    livingImages && overlay && !reduced
                        ? { scale: [1, 1.08, 1] }
                        : { scale: 1 }
                }
                transition={
                    livingImages && overlay && !reduced
                        ? { duration: 12, repeat: Infinity, ease: "easeInOut" }
                        : { type: "spring", ...SPRING_STD }
                }
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${item.image.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    willChange:
                        livingImages && overlay && !reduced
                            ? "transform"
                            : "auto",
                }}
            />
        </motion.div>
    )

    // Marquee track
    const marqueeContent = useMemo(
        () => (
            <motion.div
                ref={trackRef}
                style={{
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    x: mx,
                    willChange: hover ? "transform" : "auto",
                }}
            >
                {Array.from({ length: COPIES }).map((_, i) => (
                    <div
                        key={i}
                        data-part
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                ...font,
                                color: overlayText,
                                padding: "0 0.4em",
                            }}
                        >
                            {item.label}
                        </span>
                        {hasSrc && imageDisplayMode === "pill" && (
                            <Pill
                                src={item.image.src}
                                alt={item.image.alt || ""}
                                w={imageWidth}
                                h={imgH}
                                radius={imageBorderRadius}
                                living={livingImages}
                                visible={overlay}
                                idx={i}
                                reduced={reduced}
                            />
                        )}
                    </div>
                ))}
            </motion.div>
        ),
        [
            item.label,
            item.image,
            font,
            overlayText,
            hasSrc,
            imageDisplayMode,
            imageWidth,
            imgH,
            imageBorderRadius,
            livingImages,
            overlay,
            mx,
            hover,
            reduced,
        ]
    )

    // Static renderer preview — static fallbacks, no animation
    if (isStaticRenderer) {
        return (
            <div
                style={{
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: rowHeight,
                    backgroundColor: bg,
                    overflow: "hidden",
                }}
            >
                {borderEl}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            font.textAlign === "left"
                                ? "flex-start"
                                : font.textAlign === "right"
                                  ? "flex-end"
                                  : "center",
                        color: textColor,
                        ...font,
                        padding: "0 2rem",
                        zIndex: 2,
                    }}
                >
                    {item.label}
                </div>
            </div>
        )
    }

    // Reduced motion — simple fade
    if (reduced) {
        return (
            <motion.a
                ref={rowRef}
                href={item.link}
                aria-label={item.label}
                onMouseEnter={enter}
                onMouseLeave={leave}
                animate={{ opacity: rowOp }}
                transition={{ type: "spring", ...SPRING_SOFT }}
                style={{
                    display: "block",
                    position: "relative",
                    width: "100%",
                    height: rowHeight,
                    backgroundColor: hover ? overlayBg : bg,
                    textDecoration: "none",
                    overflow: "hidden",
                    transition: `background-color ${slideDuration}s ease`,
                }}
            >
                {borderEl}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            font.textAlign === "left"
                                ? "flex-start"
                                : font.textAlign === "right"
                                  ? "flex-end"
                                  : "center",
                        color: hover ? overlayText : textColor,
                        ...font,
                        transition: `color ${slideDuration}s ease`,
                        padding: "0 2rem",
                        zIndex: 2,
                    }}
                >
                    {item.label}
                </div>
            </motion.a>
        )
    }

    // Desktop — full interactive
    return (
        <motion.a
            ref={rowRef}
            href={item.link}
            aria-label={item.label}
            onMouseEnter={enter}
            onMouseMove={move}
            onMouseLeave={leave}
            initial={shouldAnimate ? { opacity: 0, y: 40 } : false}
            animate={{ opacity: rowOp, y: 0 }}
            transition={{
                opacity: {
                    type: "spring",
                    ...SPRING_STD,
                    delay: idx * 0.08,
                },
                y: {
                    type: "spring",
                    ...SPRING_STD,
                    delay: idx * 0.08,
                },
            }}
            style={{
                display: "block",
                position: "relative",
                width: "100%",
                height: rowHeight,
                backgroundColor: bg,
                textDecoration: "none",
                overflow: "hidden",
                cursor: cursorEnabled ? "none" : "pointer",
                willChange: anyHover ? "opacity" : "auto",
            }}
        >
            {borderEl}

            {/* Static text layer */}
            {magneticEnabled ? (
                <MagText
                    text={item.label}
                    active={hover && !overlay}
                    cursor={cursor}
                    color={textColor}
                    font={font}
                    radius={scatterRadius}
                    strength={scatterStrength}
                />
            ) : revealMode === "split" ? (
                <>
                    <motion.div
                        animate={overlay ? { y: -rowHeight } : { y: 0 }}
                        transition={{ type: "spring", ...SPRING_STD }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "50%",
                            overflow: "hidden",
                            backgroundColor: bg,
                            zIndex: 20,
                            willChange: overlay ? "transform" : "auto",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: rowHeight,
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                    font.textAlign === "left"
                                        ? "flex-start"
                                        : font.textAlign === "right"
                                          ? "flex-end"
                                          : "center",
                                color: textColor,
                                ...font,
                                padding: "0 2rem",
                            }}
                        >
                            {item.label}
                        </div>
                    </motion.div>
                    <motion.div
                        animate={overlay ? { y: rowHeight } : { y: 0 }}
                        transition={{ type: "spring", ...SPRING_STD }}
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            width: "100%",
                            height: "50%",
                            overflow: "hidden",
                            backgroundColor: bg,
                            zIndex: 20,
                            willChange: overlay ? "transform" : "auto",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: -rowHeight / 2,
                                left: 0,
                                width: "100%",
                                height: rowHeight,
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                    font.textAlign === "left"
                                        ? "flex-start"
                                        : font.textAlign === "right"
                                          ? "flex-end"
                                          : "center",
                                color: textColor,
                                ...font,
                                padding: "0 2rem",
                            }}
                        >
                            {item.label}
                        </div>
                    </motion.div>
                </>
            ) : (
                <motion.div
                    animate={{ scale: hover ? 1.04 : 1 }}
                    transition={{ type: "spring", ...SPRING_SOFT }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            font.textAlign === "left"
                                ? "flex-start"
                                : font.textAlign === "right"
                                  ? "flex-end"
                                  : "center",
                        color: textColor,
                        ...font,
                        zIndex: 5,
                        padding: "0 2rem",
                        willChange: hover ? "transform" : "auto",
                    }}
                >
                    {item.label}
                </motion.div>
            )}

            {/* Overlay */}
            <motion.div
                {...overlayAnim}
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: overlayBg,
                    overflow: "hidden",
                    zIndex: revealMode === "split" ? 10 : 15,
                    willChange: overlay
                        ? "transform, clip-path, opacity, filter"
                        : "auto",
                }}
            >
                {backgroundImage}
                <motion.div
                    {...innerAnim}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        position: "relative",
                        zIndex: 2,
                        willChange:
                            overlay &&
                            (revealMode === "edge-slide" ||
                                revealMode === "horizontal-wipe")
                                ? "transform"
                                : "auto",
                    }}
                >
                    {marqueeContent}
                </motion.div>
            </motion.div>
        </motion.a>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function Kern_FlowingMenu(props: Partial<Props>) {
    const {
        items = DEFAULT_ITEMS,
        font = { fontSize: 52, fontWeight: 600, letterSpacing: "0.04em" },
        ariaLabel = "Navigation menu",
        style = {},
    } = props

    // ── Nested group destructuring ──
    const {
        textColor = COLORS_DEFAULTS.textColor,
        backgroundColor = COLORS_DEFAULTS.backgroundColor,
        overlayBg = COLORS_DEFAULTS.overlayBg,
        overlayText = COLORS_DEFAULTS.overlayText,
    } = props.colors ?? COLORS_DEFAULTS

    const {
        borderColor = BORDER_DEFAULTS.borderColor,
        borderStyle = BORDER_DEFAULTS.borderStyle,
        borderWidth = BORDER_DEFAULTS.borderWidth,
    } = props.border ?? BORDER_DEFAULTS

    const {
        fontSize = TYPOGRAPHY_DEFAULTS.fontSize,
        fontSizeTablet = TYPOGRAPHY_DEFAULTS.fontSizeTablet,
        fontSizeMobile = TYPOGRAPHY_DEFAULTS.fontSizeMobile,
        fontWeight = TYPOGRAPHY_DEFAULTS.fontWeight,
        lineHeight = TYPOGRAPHY_DEFAULTS.lineHeight,
        letterSpacing = TYPOGRAPHY_DEFAULTS.letterSpacing,
        textTransform = TYPOGRAPHY_DEFAULTS.textTransform,
        textAlign = TYPOGRAPHY_DEFAULTS.textAlign,
    } = props.typography ?? TYPOGRAPHY_DEFAULTS

    const {
        rowHeight = LAYOUT_DEFAULTS.rowHeight,
        rowHeightTablet = LAYOUT_DEFAULTS.rowHeightTablet,
        rowHeightMobile = LAYOUT_DEFAULTS.rowHeightMobile,
        imageDisplayMode = LAYOUT_DEFAULTS.imageDisplayMode,
        imageWidth = LAYOUT_DEFAULTS.imageWidth,
        imageBorderRadius = LAYOUT_DEFAULTS.imageBorderRadius,
        imageOpacity = LAYOUT_DEFAULTS.imageOpacity,
    } = props.layout ?? LAYOUT_DEFAULTS

    const {
        revealMode = ANIMATION_DEFAULTS.revealMode,
        marqueeSpeed = ANIMATION_DEFAULTS.marqueeSpeed,
        slideDuration = ANIMATION_DEFAULTS.slideDuration,
        livingImages = ANIMATION_DEFAULTS.livingImages,
    } = props.animation ?? ANIMATION_DEFAULTS

    // Optional groups
    const magneticEnabled = props.magneticText !== undefined
    const {
        scatterRadius = MAGNETIC_DEFAULTS.scatterRadius,
        scatterStrength = MAGNETIC_DEFAULTS.scatterStrength,
    } = props.magneticText ?? MAGNETIC_DEFAULTS

    const {
        dimInactiveRows = INTERACTION_DEFAULTS.dimInactiveRows,
        inactiveOpacity = INTERACTION_DEFAULTS.inactiveOpacity,
    } = props.interaction ?? INTERACTION_DEFAULTS

    const cursorEnabled = props.customCursor !== undefined
    const {
        cursorSize = CURSOR_DEFAULTS.cursorSize,
        cursorColor = CURSOR_DEFAULTS.cursorColor,
    } = props.customCursor ?? CURSOR_DEFAULTS

    // ── Framer hooks ──
    const isStaticRenderer = useIsStaticRenderer()
    const prefersReduced = useReducedMotion() ?? false
    const navRef = useRef<HTMLElement>(null)
    const isInView = useInView(navRef, { once: false, amount: 0.1 })
    const reduced = prefersReduced || isStaticRenderer

    // ── State ──
    const [hovIdx, setHovIdx] = useState<number | null>(null)
    const [showCursor, setShowCursor] = useState(false)
    const navCursorRafRef = useRef<number>(0)
    const pendingNavCursorRef = useRef<{ x: number; y: number } | null>(null)

    // Breakpoint detection
    const [bp, setBp] = useState<"desktop" | "tablet" | "mobile">("desktop")

    useLayoutEffect(() => {
        const win =
            typeof globalThis !== "undefined" &&
            "addEventListener" in globalThis &&
            "innerWidth" in globalThis
                ? (globalThis as Window & typeof globalThis)
                : null
        if (!win) return
        const update = () => {
            const w = win.innerWidth
            if (w <= 810) setBp("mobile")
            else if (w <= 1200) setBp("tablet")
            else setBp("desktop")
        }
        update()
        win.addEventListener("resize", update, { passive: true })
        return () => win.removeEventListener("resize", update)
    }, [])

    // Cursor tracking
    const curX = useMotionValue(0)
    const curY = useMotionValue(0)
    const sX = useSpring(curX, { stiffness: 200, damping: 25, mass: 0.1 })
    const sY = useSpring(curY, { stiffness: 200, damping: 25, mass: 0.1 })

    const onNavMouseMove = useCallback(
        (e: RME<HTMLElement>) => {
            if (!cursorEnabled || isStaticRenderer) return
            const navRect = e.currentTarget.getBoundingClientRect()
            pendingNavCursorRef.current = {
                x: e.clientX - navRect.left,
                y: e.clientY - navRect.top,
            }
            if (navCursorRafRef.current) return
            navCursorRafRef.current = requestAnimationFrame(() => {
                navCursorRafRef.current = 0
                const next = pendingNavCursorRef.current
                if (!next) return
                curX.set(next.x)
                curY.set(next.y)
            })
        },
        [cursorEnabled, isStaticRenderer, curX, curY]
    )

    useLayoutEffect(() => {
        return () => {
            if (navCursorRafRef.current) {
                cancelAnimationFrame(navCursorRafRef.current)
            }
        }
    }, [])

    // ── Resolved values ──
    const resolvedRowHeight = useMemo(() => {
        if (bp === "mobile") return Math.max(rowHeightMobile, 44)
        if (bp === "tablet") return rowHeightTablet
        return rowHeight
    }, [bp, rowHeight, rowHeightTablet, rowHeightMobile])

    const resolvedFontSize = useMemo(() => {
        if (bp === "mobile") return fontSizeMobile
        if (bp === "tablet") return fontSizeTablet
        return fontSize
    }, [bp, fontSize, fontSizeTablet, fontSizeMobile])

    const mergedFont: CSSProperties = useMemo(
        () => ({
            ...font,
            fontSize: resolvedFontSize,
            fontWeight,
            lineHeight,
            letterSpacing: font.letterSpacing || letterSpacing,
            textTransform:
                (font.textTransform as CSSProperties["textTransform"]) ||
                textTransform,
            textAlign,
        }),
        [
            font,
            resolvedFontSize,
            fontWeight,
            lineHeight,
            letterSpacing,
            textTransform,
            textAlign,
        ]
    )

    // Total height = sum of rows
    const totalHeight = useMemo(
        () => items.length * resolvedRowHeight,
        [items.length, resolvedRowHeight]
    )

    return (
        <nav
            ref={navRef}
            aria-label={ariaLabel}
            role="navigation"
            onMouseMove={onNavMouseMove}
            style={{
                width: "100%",
                height: Math.max(totalHeight, 100),
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                cursor:
                    cursorEnabled && showCursor && !reduced ? "none" : "auto",
                ...style,
            }}
        >
            {items.map((item, i) => (
                <NavRow
                    key={`${item.label}-${i}`}
                    item={item}
                    idx={i}
                    total={items.length}
                    revealMode={revealMode}
                    textColor={textColor}
                    bg={backgroundColor}
                    overlayBg={overlayBg}
                    overlayText={overlayText}
                    borderColor={borderColor}
                    borderStyle={borderStyle}
                    borderWidth={borderWidth}
                    font={mergedFont}
                    rowHeight={resolvedRowHeight}
                    imageDisplayMode={imageDisplayMode}
                    imageWidth={imageWidth}
                    imageBorderRadius={imageBorderRadius}
                    imageOpacity={imageOpacity}
                    marqueeSpeed={marqueeSpeed}
                    slideDuration={slideDuration}
                    livingImages={livingImages}
                    magneticEnabled={magneticEnabled}
                    scatterRadius={scatterRadius}
                    scatterStrength={scatterStrength}
                    isHoveredRow={hovIdx === i}
                    anyHover={hovIdx !== null}
                    dimInactive={dimInactiveRows}
                    inactiveOp={inactiveOpacity}
                    cursorEnabled={cursorEnabled}
                    onHover={(h) => {
                        setHovIdx(h ? i : null)
                        setShowCursor(h)
                    }}
                    reduced={reduced}
                    isStaticRenderer={isStaticRenderer}
                />
            ))}

            {/* Custom cursor */}
            {cursorEnabled && showCursor && !reduced && !isStaticRenderer && (
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: cursorSize,
                        height: cursorSize,
                        borderRadius: "50%",
                        backgroundColor: cursorColor,
                        mixBlendMode: "difference",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 999,
                        x: sX,
                        y: sY,
                        translateX: "-50%",
                        translateY: "-50%",
                        willChange: "transform",
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 0.8,
                    }}
                />
            )}
        </nav>
    )
}

Kern_FlowingMenu.defaultProps = {
    style: {
        minWidth: 100,
        minHeight: 100,
    },
}

/* ═══════════════════════════════════════════════════════════════════
   PROPERTY CONTROLS — Nested ControlType.Object Architecture
   Total: 39 controls across 8 groups (2 optional)
   ═══════════════════════════════════════════════════════════════════ */

addPropertyControls(Kern_FlowingMenu, {
    // ── CONTENT (top level) ──────────────────────────────────────────
    items: {
        type: ControlType.Array,
        title: "Navigation Items",
        description:
            "Menu rows. Each has label, link, and an optional image for the marquee overlay.",
        maxCount: 8,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    description: "Menu item text displayed in the row.",
                    defaultValue: "Item",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Destination URL or page.",
                    defaultValue: "#",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "Pill image in marquee or background overlay.",
                },
            },
        },
    },

    font: {
        type: ControlType.Font,
        title: "Font Family",
        description: "Font family, style, and base weight.",
        controls: "extended",
    },

    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        description:
            "Accessible landmark label for screen readers.\nDescribes this navigation region.",
        defaultValue: "Navigation menu",
    },

    // ── COLORS (Object group) ────────────────────────────────────────
    colors: {
        type: ControlType.Object,
        title: "Colors",
        buttonTitle: "Colors",
        icon: "color",
        optional: false,
        description: "Text, background, and overlay color scheme.",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text",
                description: "Default row text color.",
                defaultValue: "#FFFFFF",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                description: "Component background color.",
                defaultValue: "#0A0A0A",
            },
            overlayBg: {
                type: ControlType.Color,
                title: "Overlay BG",
                description: "Marquee overlay background on hover.",
                defaultValue: "#FFFFFF",
            },
            overlayText: {
                type: ControlType.Color,
                title: "Overlay Text",
                description: "Marquee text color on hover.",
                defaultValue: "#0A0A0A",
            },
        },
    },

    // ── BORDER (Object group) ────────────────────────────────────────
    border: {
        type: ControlType.Object,
        title: "Border",
        buttonTitle: "Border",
        icon: "border",
        optional: false,
        description: "Row divider style, color, and thickness.",
        controls: {
            borderColor: {
                type: ControlType.Color,
                title: "Color",
                description: "Divider line color.",
                defaultValue: "rgba(255,255,255,0.15)",
            },
            borderStyle: {
                type: ControlType.Enum,
                title: "Style",
                description: "Divider visual style.",
                options: ["solid", "gradient-fade", "dashed-subtle"],
                optionTitles: ["Solid", "Gradient Fade", "Dashed"],
                defaultValue: "gradient-fade",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Width",
                description: "Divider thickness in pixels.",
                defaultValue: 1,
                min: 0,
                max: 4,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
        },
    },

    // ── TYPOGRAPHY (Object group) ────────────────────────────────────
    typography: {
        type: ControlType.Object,
        title: "Typography",
        buttonTitle: "Typography",
        icon: "text",
        optional: false,
        description:
            "Font sizes per breakpoint, weight, line-height, spacing, and alignment.",
        controls: {
            fontSize: {
                type: ControlType.Number,
                title: "Size — Desktop",
                description: "Font size on desktop (1440px+).",
                defaultValue: 52,
                min: 14,
                max: 120,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            fontSizeTablet: {
                type: ControlType.Number,
                title: "Size — Tablet",
                description: "Font size on tablet (810–1200px).",
                defaultValue: 38,
                min: 14,
                max: 96,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            fontSizeMobile: {
                type: ControlType.Number,
                title: "Size — Mobile",
                description: "Font size under 810px.",
                defaultValue: 26,
                min: 14,
                max: 72,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            fontWeight: {
                type: ControlType.Number,
                title: "Weight",
                description: "100 (thin) → 900 (black).",
                defaultValue: 600,
                min: 100,
                max: 900,
                step: 100,
                displayStepper: true,
            },
            lineHeight: {
                type: ControlType.String,
                title: "Line Height",
                description: "e.g. 1.1 or 1.5em.",
                defaultValue: "1.1",
            },
            letterSpacing: {
                type: ControlType.String,
                title: "Letter Spacing",
                description: "e.g. 0.04em or -0.02em.",
                defaultValue: "0.04em",
            },
            textTransform: {
                type: ControlType.Enum,
                title: "Transform",
                description: "Text capitalization style.",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "uppercase",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            textAlign: {
                type: ControlType.Enum,
                title: "Align",
                description: "Horizontal text alignment.",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "center",
                displaySegmentedControl: true,
            },
        },
    },

    // ── LAYOUT (Object group) ────────────────────────────────────────
    layout: {
        type: ControlType.Object,
        title: "Layout",
        buttonTitle: "Layout",
        icon: "layout",
        optional: false,
        description: "Row heights per breakpoint and image display settings.",
        controls: {
            rowHeight: {
                type: ControlType.Number,
                title: "Row — Desktop",
                description: "Row height on desktop.",
                defaultValue: 150,
                min: 60,
                max: 400,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            rowHeightTablet: {
                type: ControlType.Number,
                title: "Row — Tablet",
                description: "Row height on tablet.",
                defaultValue: 110,
                min: 60,
                max: 300,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            rowHeightMobile: {
                type: ControlType.Number,
                title: "Row — Mobile",
                description: "Row height on mobile (min 44px for touch).",
                defaultValue: 80,
                min: 44,
                max: 200,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            imageDisplayMode: {
                type: ControlType.Enum,
                title: "Image Mode",
                description:
                    "Show images as pills in marquee or as background.",
                options: ["pill", "background"],
                optionTitles: ["Pill", "Background"],
                defaultValue: "pill",
                displaySegmentedControl: true,
            },
            imageWidth: {
                type: ControlType.Number,
                title: "Image Width",
                description: "Pill image width in the marquee track.",
                defaultValue: 160,
                min: 60,
                max: 400,
                step: 10,
                unit: "px",
                displayStepper: true,
                hidden: (p) => p.imageDisplayMode === "background",
            },
            imageBorderRadius: {
                type: ControlType.Number,
                title: "Image Radius",
                description: "999 for full pill shape.",
                defaultValue: 999,
                min: 0,
                max: 999,
                step: 1,
                unit: "px",
                hidden: (p) => p.imageDisplayMode === "background",
            },
            imageOpacity: {
                type: ControlType.Number,
                title: "Image Opacity",
                description: "Background image opacity when revealed.",
                defaultValue: 0.3,
                min: 0.05,
                max: 1,
                step: 0.05,
                hidden: (p) => p.imageDisplayMode === "pill",
            },
        },
    },

    // ── ANIMATION (Object group) ─────────────────────────────────────
    animation: {
        type: ControlType.Object,
        title: "Animation",
        buttonTitle: "Animation",
        icon: "play",
        optional: false,
        description:
            "Reveal mode, marquee speed, timing, and living images toggle.",
        controls: {
            revealMode: {
                type: ControlType.Enum,
                title: "Reveal Mode",
                description:
                    "How the marquee overlay appears on hover.\nEdge Slide and Split are directional.",
                options: [
                    "edge-slide",
                    "clip-circle",
                    "horizontal-wipe",
                    "blur-in",
                    "split",
                ],
                optionTitles: [
                    "Edge Slide",
                    "Clip Circle",
                    "Horizontal Wipe",
                    "Blur In",
                    "Split",
                ],
                defaultValue: "edge-slide",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            marqueeSpeed: {
                type: ControlType.Number,
                title: "Marquee Speed",
                description: "Horizontal scroll speed in pixels per second.",
                defaultValue: 180,
                min: 40,
                max: 500,
                step: 10,
                unit: "px/s",
            },
            slideDuration: {
                type: ControlType.Number,
                title: "Slide Duration",
                description:
                    "Base time for overlay reveal and exit.\nUsed only as fallback for reduced-motion.",
                defaultValue: 0.6,
                min: 0.2,
                max: 1.5,
                step: 0.05,
                unit: "s",
            },
            livingImages: {
                type: ControlType.Boolean,
                title: "Living Images",
                description:
                    "Ken Burns slow zoom effect on pill images.\nDisabled when prefers-reduced-motion is on.",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },

    // ── MAGNETIC TEXT (optional Object) ───────────────────────────────
    magneticText: {
        type: ControlType.Object,
        title: "Magnetic Text",
        buttonTitle: "Magnetic Text",
        optional: true,
        description:
            "Letters scatter away from cursor on hover.\nToggle off to disable magnetic effect.",
        controls: {
            scatterRadius: {
                type: ControlType.Number,
                title: "Scatter Radius",
                description: "Cursor influence area in pixels.",
                defaultValue: 150,
                min: 50,
                max: 300,
                step: 10,
                unit: "px",
            },
            scatterStrength: {
                type: ControlType.Number,
                title: "Scatter Force",
                description: "Max letter displacement force.",
                defaultValue: 25,
                min: 5,
                max: 60,
                step: 1,
                unit: "px",
            },
        },
    },

    // ── INTERACTION (Object group) ───────────────────────────────────
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        buttonTitle: "Interaction",
        optional: false,
        description: "Row dimming behavior when hovering other rows.",
        controls: {
            dimInactiveRows: {
                type: ControlType.Boolean,
                title: "Dim Inactive",
                description: "Reduce opacity of non-hovered rows.",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            inactiveOpacity: {
                type: ControlType.Number,
                title: "Inactive Opacity",
                description: "Opacity of dimmed rows (0.1 = nearly hidden).",
                defaultValue: 0.35,
                min: 0.1,
                max: 1,
                step: 0.05,
                hidden: (p) => !p.dimInactiveRows,
            },
        },
    },

    // ── CUSTOM CURSOR (optional Object) ──────────────────────────────
    customCursor: {
        type: ControlType.Object,
        title: "Custom Cursor",
        buttonTitle: "Custom Cursor",
        optional: true,
        description:
            "Circular cursor with blend mode.\nToggle off for default browser cursor.",
        controls: {
            cursorSize: {
                type: ControlType.Number,
                title: "Size",
                description: "Cursor circle diameter.",
                defaultValue: 64,
                min: 32,
                max: 120,
                step: 4,
                unit: "px",
                displayStepper: true,
            },
            cursorColor: {
                type: ControlType.Color,
                title: "Color",
                description: "Cursor color. Uses mix-blend-mode: difference.",
                defaultValue: "#FFFFFF",
            },
        },
    },
})
