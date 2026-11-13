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

import { motion, AnimatePresence } from "framer-motion"

// =============================================================================
// FeatureWheel — Framer Code Component
// -----------------------------------------------------------------------------
// A radial wheel of icons around a center showcase image. Hovering (or tapping)
// an icon:
//   • activates it (dark fill, white glyph, 3D tilted card behind it)
//   • cross-fades the center image with a soft blur
//   • slides the title + description to the side closest to the icon
//
// Layouts (auto-switched via a ResizeObserver on the container):
//   ≥ breakpoint:  [ left-label gutter ] [ wheel ] [ right-label gutter ]
//   <  breakpoint: stacked vertical — heading, smaller wheel, label below
//
// All transitions use easing or springs. Items, icons, titles, descriptions
// and center images come from a single `items` array exposed via Framer
// property controls.
// =============================================================================

// -----------------------------------------------------------------------------
// Inline SVG icon library — rendered as JSX so they always render in Framer.
// -----------------------------------------------------------------------------

type IconProps = { color: string; size?: number | string }

const IconShield = ({ color, size = "55%" }: IconProps) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size, height: size }}
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
    </svg>
)

const IconDoc = ({ color, size = "55%" }: IconProps) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size, height: size }}
    >
        <rect x={4} y={3} width={16} height={18} rx={2} />
        <line x1={8} y1={8} x2={16} y2={8} />
        <line x1={8} y1={12} x2={16} y2={12} />
        <line x1={8} y1={16} x2={13} y2={16} />
    </svg>
)

const IconHalf = ({ color, size = "55%" }: IconProps) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        style={{ width: size, height: size }}
    >
        <circle cx={12} cy={12} r={9} />
        <path d="M12 3 A9 9 0 0 1 12 21 Z" fill={color} />
    </svg>
)

const IconEdit = ({ color, size = "55%" }: IconProps) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size, height: size }}
    >
        <path d="M4 20h4l10-10-4-4L4 16v4z" />
        <path d="M14 6l4 4" />
    </svg>
)

const IconBrain = ({ color, size = "55%" }: IconProps) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size, height: size }}
    >
        <path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5.5A3 3 0 0 0 6 18a3 3 0 0 0 3 3 1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z" />
        <path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5.5A3 3 0 0 1 18 18a3 3 0 0 1-3 3 1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
    </svg>
)

const IconChart = ({ color, size = "55%" }: IconProps) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size, height: size }}
    >
        <line x1={6} y1={20} x2={6} y2={12} />
        <line x1={12} y1={20} x2={12} y2={6} />
        <line x1={18} y1={20} x2={18} y2={14} />
    </svg>
)

const DEFAULT_ICONS = [
    IconShield,
    IconDoc,
    IconHalf,
    IconEdit,
    IconBrain,
    IconChart,
]

// -----------------------------------------------------------------------------
// Inline placeholder for the center image (used when no image is uploaded).
// -----------------------------------------------------------------------------

function CenterPlaceholder({
    width,
    height,
    accent,
    gradId,
}: {
    width: number
    height: number
    accent: string
    gradId: string
}) {
    return (
        <svg
            viewBox="0 0 600 460"
            preserveAspectRatio="xMidYMid slice"
            style={{
                width,
                height,
                borderRadius: 18,
                display: "block",
                boxShadow:
                    "0 30px 60px -20px rgba(20,40,80,0.18), 0 12px 24px -10px rgba(20,40,80,0.10)",
            }}
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f6f9ff" />
                    <stop offset="100%" stopColor="#e6ecf6" />
                </linearGradient>
            </defs>
            <rect width={600} height={460} rx={22} fill={`url(#${gradId})`} />
            <rect
                x={40}
                y={40}
                width={520}
                height={46}
                rx={10}
                fill="#ffffff"
                opacity={0.92}
            />
            <rect x={56} y={56} width={160} height={14} rx={4} fill="#c8d2e2" />
            <rect
                x={40}
                y={110}
                width={250}
                height={120}
                rx={12}
                fill="#ffffff"
                opacity={0.95}
            />
            <rect
                x={310}
                y={110}
                width={250}
                height={120}
                rx={12}
                fill={accent}
                opacity={0.85}
            />
            <rect
                x={40}
                y={250}
                width={520}
                height={60}
                rx={10}
                fill="#ffffff"
                opacity={0.92}
            />
            <rect
                x={40}
                y={324}
                width={520}
                height={60}
                rx={10}
                fill="#ffffff"
                opacity={0.92}
            />
            <rect
                x={40}
                y={398}
                width={240}
                height={20}
                rx={6}
                fill="#c8d2e2"
            />
        </svg>
    )
}

const PLACEHOLDER_ACCENTS = [
    "#cfe0ff",
    "#dce6fb",
    "#cfd9f0",
    "#d6dff5",
    "#d2dcef",
    "#dde6f8",
]

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ResponsiveImageValue = {
    src: string
    srcSet?: string
    alt?: string
}

type FeatureItem = {
    title: string
    description: string
    iconImage?: ResponsiveImageValue
    image?: ResponsiveImageValue
}

type Props = {
    style?: React.CSSProperties
    heading: string
    subheading: string
    items: FeatureItem[]

    radius: number
    iconSize: number
    centerWidth: number
    centerHeight: number
    labelWidth: number
    breakpoint: number

    headingColor: string
    bodyColor: string
    mutedColor: string
    activeBg: string
    inactiveBg: string
    ringTint: string
}

// -----------------------------------------------------------------------------
// useContainerWidth — measures the rendered width via ResizeObserver, only
// re-renders when crossing the breakpoint so we don't thrash on every pixel.
// -----------------------------------------------------------------------------

function useIsCompact(
    ref: React.RefObject<HTMLElement>,
    breakpoint: number
): boolean {
    const [isCompact, setIsCompact] = React.useState(false)

    React.useLayoutEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        let last: boolean | null = null
        const update = () => {
            const w = el.getBoundingClientRect().width
            if (w <= 0) return
            const next = w < breakpoint
            if (next !== last) {
                last = next
                setIsCompact(next)
            }
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [ref, breakpoint])

    return isCompact
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 720
 */
export default function FeatureWheel(props: Props) {
    const {
        style,
        heading,
        subheading,
        items,
        radius,
        iconSize,
        centerWidth,
        centerHeight,
        labelWidth,
        breakpoint,
        headingColor,
        bodyColor,
        mutedColor,
        activeBg,
        inactiveBg,
        ringTint,
    } = props

    const safeItems = items && items.length > 0 ? items : []
    const [activeIndex, setActiveIndex] = React.useState(0)

    React.useEffect(() => {
        if (activeIndex >= safeItems.length && safeItems.length > 0) {
            setActiveIndex(0)
        }
    }, [safeItems.length, activeIndex])

    // Measure rendered width — switch to stacked mobile layout below breakpoint.
    const containerRef = React.useRef<HTMLDivElement>(null)
    const isCompact = useIsCompact(containerRef, breakpoint)

    // Stable suffix for SVG <linearGradient> ids so multiple instances on a
    // page never collide.
    const reactId = React.useId()
    const idSafe = reactId.replace(/[^a-zA-Z0-9]/g, "")

    // Effective dimensions — scale wheel + center image down in compact mode
    // so they fit a phone-width viewport without overflow.
    const eff = isCompact
        ? {
              radius: Math.min(radius, 130),
              iconSize: Math.min(iconSize, 44),
              centerWidth: Math.min(centerWidth, 220),
              centerHeight: Math.min(centerHeight, 180),
              headingSize: 28,
              subSize: 14,
              titleSize: 17,
              descSize: 13,
          }
        : {
              radius,
              iconSize,
              centerWidth,
              centerHeight,
              headingSize: 44,
              subSize: 15,
              titleSize: 18,
              descSize: 13.5,
          }

    // Distribute items evenly. -135° puts the first item at the top-left.
    const startAngle = -135
    const getPosition = (index: number, total: number) => {
        const step = 360 / Math.max(total, 1)
        const angleDeg = startAngle + step * index
        const rad = (angleDeg * Math.PI) / 180
        return {
            x: Math.cos(rad) * eff.radius,
            y: Math.sin(rad) * eff.radius,
            angleDeg,
        }
    }

    const activePos =
        safeItems.length > 0
            ? getPosition(activeIndex, safeItems.length)
            : { x: 0, y: 0, angleDeg: 0 }
    const labelOnRight = activePos.x >= 0
    const activeItem = safeItems[activeIndex]

    const ease = [0.32, 0.72, 0, 1] as const
    const spring = {
        type: "spring" as const,
        stiffness: 220,
        damping: 30,
        mass: 0.9,
    }

    const wheelSize = eff.radius * 2 + eff.iconSize * 2 + 16

    // ---- Reusable label block ----
    const LabelText = (
        <>
            <div
                style={{
                    fontSize: eff.titleSize,
                    fontWeight: 600,
                    color: bodyColor,
                    marginBottom: 8,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                }}
            >
                {activeItem ? activeItem.title : ""}
            </div>
            <div
                style={{
                    fontSize: eff.descSize,
                    lineHeight: 1.55,
                    color: mutedColor,
                    fontWeight: 400,
                }}
            >
                {activeItem ? activeItem.description : ""}
            </div>
        </>
    )

    // ---- Side-gutter label (desktop) ----
    const SideLabel = ({ side }: { side: "left" | "right" }) => {
        if (!activeItem) return null
        return (
            <motion.div
                key={`${activeIndex}-${side}`}
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                animate={{
                    opacity: 1,
                    y: activePos.y,
                    filter: "blur(0px)",
                }}
                exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease }}
                style={{
                    position: "absolute",
                    top: "50%",
                    [side]: 0,
                    width: labelWidth,
                    textAlign: side === "left" ? "right" : "left",
                    pointerEvents: "none",
                    paddingLeft: side === "right" ? 12 : 0,
                    paddingRight: side === "left" ? 12 : 0,
                }}
            >
                {LabelText}
            </motion.div>
        )
    }

    // ---- Bottom label (compact / mobile) ----
    const BottomLabel = () => {
        if (!activeItem) return null
        return (
            <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease }}
                style={{
                    width: "100%",
                    maxWidth: 360,
                    textAlign: "center",
                    padding: "0 16px",
                }}
            >
                {LabelText}
            </motion.div>
        )
    }

    // ---- The wheel itself (heading-less; sized via `eff`) ----
    const Wheel = (
        <div
            style={{
                position: "relative",
                width: wheelSize,
                height: wheelSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            {/* Soft outer ring background */}
            <div
                style={{
                    position: "absolute",
                    width: eff.radius * 2 + 24,
                    height: eff.radius * 2 + 24,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 50% 35%, ${ringTint} 0%, rgba(255,255,255,0) 72%)`,
                    border: "1px solid rgba(20,40,80,0.04)",
                    pointerEvents: "none",
                }}
            />

            {/* Center image — concurrent cross-fade */}
            <div
                style={{
                    position: "relative",
                    width: eff.centerWidth,
                    height: eff.centerHeight,
                    borderRadius: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <AnimatePresence initial={false}>
                    {activeItem && (
                        <motion.div
                            key={activeIndex}
                            initial={{
                                opacity: 0,
                                scale: 0.96,
                                filter: "blur(10px)",
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                filter: "blur(0px)",
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.985,
                                filter: "blur(8px)",
                            }}
                            transition={{ duration: 0.55, ease }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {activeItem.image && activeItem.image.src ? (
                                <img
                                    src={activeItem.image.src}
                                    srcSet={activeItem.image.srcSet}
                                    alt={
                                        activeItem.image.alt || activeItem.title
                                    }
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: 18,
                                        boxShadow:
                                            "0 30px 60px -20px rgba(20,40,80,0.18), 0 12px 24px -10px rgba(20,40,80,0.10)",
                                    }}
                                    draggable={false}
                                />
                            ) : (
                                <CenterPlaceholder
                                    width={eff.centerWidth}
                                    height={eff.centerHeight}
                                    accent={
                                        PLACEHOLDER_ACCENTS[
                                            activeIndex %
                                                PLACEHOLDER_ACCENTS.length
                                        ]
                                    }
                                    gradId={`fw-grad-${idSafe}-${activeIndex}`}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Icons distributed around the circle */}
            {safeItems.map((item, i) => {
                const pos = getPosition(i, safeItems.length)
                const isActive = i === activeIndex
                const platformRotate = pos.angleDeg + 90
                const DefaultIcon = DEFAULT_ICONS[i % DEFAULT_ICONS.length]
                const iconColor = isActive ? "#ffffff" : "#0f1b2d"
                const iconOpacity = isActive ? 1 : 0.32

                const activate = () => setActiveIndex(i)

                return (
                    <motion.div
                        key={i}
                        // Compact (mobile/touch): click-only — no hover trigger,
                        // because synthetic mouseEnter on touch devices can fire
                        // when a finger drags across the wheel during scroll.
                        // Desktop: hover OR click OR focus — all activate.
                        onMouseEnter={isCompact ? undefined : activate}
                        onClick={activate}
                        onFocus={activate}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                activate()
                            }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={item.title}
                        aria-pressed={isActive}
                        animate={{
                            x: pos.x,
                            y: pos.y,
                            scale: isActive ? 1.12 : 1,
                            zIndex: isActive ? 10 : 2,
                        }}
                        transition={spring}
                        style={{
                            position: "absolute",
                            width: eff.iconSize,
                            height: eff.iconSize,
                            cursor: "pointer",
                            outline: "none",
                            // Mobile UX: kill the iOS 300ms tap delay + the
                            // grey tap-flash so taps feel native and instant.
                            touchAction: "manipulation",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        {/* 3D-tilted "platform" card behind active icon */}
                        <AnimatePresence>
                            {isActive && (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        scale: 0.6,
                                        rotateX: 0,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        rotateX: 22,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.7,
                                        rotateX: 0,
                                    }}
                                    transition={{ duration: 0.5, ease }}
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        width: eff.iconSize * 1.55,
                                        height: eff.iconSize * 1.55,
                                        marginLeft: -(eff.iconSize * 1.55) / 2,
                                        marginTop: -(eff.iconSize * 1.55) / 2,
                                        borderRadius: 22,
                                        background:
                                            "linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(236,242,252,0.95) 100%)",
                                        boxShadow:
                                            "0 28px 50px -18px rgba(20,40,80,0.18), 0 8px 16px -6px rgba(20,40,80,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
                                        border: "1px solid rgba(255,255,255,0.85)",
                                        transform: `rotateZ(${platformRotate}deg)`,
                                        transformStyle: "preserve-3d",
                                        pointerEvents: "none",
                                        zIndex: -1,
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Icon badge */}
                        <motion.div
                            animate={{
                                background: isActive ? activeBg : inactiveBg,
                                boxShadow: isActive
                                    ? "0 14px 24px -8px rgba(20,40,80,0.35), inset 0 1px 0 rgba(255,255,255,0.15)"
                                    : "0 1px 2px rgba(20,40,80,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
                                borderColor: isActive
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(20,40,80,0.06)",
                            }}
                            transition={{ duration: 0.45, ease }}
                            style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                borderRadius: 14,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderStyle: "solid",
                                borderWidth: 1,
                            }}
                        >
                            {item.iconImage && item.iconImage.src ? (
                                <motion.img
                                    src={item.iconImage.src}
                                    srcSet={item.iconImage.srcSet}
                                    alt={item.iconImage.alt || ""}
                                    animate={{
                                        filter: isActive
                                            ? "none"
                                            : "brightness(0) opacity(0.32)",
                                    }}
                                    transition={{ duration: 0.45, ease }}
                                    style={{
                                        width: "55%",
                                        height: "55%",
                                        pointerEvents: "none",
                                    }}
                                    draggable={false}
                                />
                            ) : (
                                <motion.div
                                    animate={{ opacity: iconOpacity }}
                                    transition={{ duration: 0.45, ease }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                        height: "100%",
                                        pointerEvents: "none",
                                    }}
                                >
                                    <DefaultIcon color={iconColor} />
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )
            })}
        </div>
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                fontFamily:
                    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                background: "transparent",
                overflow: "visible",
                userSelect: "none",
            }}
        >
            {/* Heading */}
            <div
                style={{
                    textAlign: "center",
                    paddingTop: isCompact ? 16 : 24,
                    maxWidth: 560,
                    paddingLeft: 16,
                    paddingRight: 16,
                }}
            >
                <h2
                    style={{
                        fontSize: eff.headingSize,
                        lineHeight: 1.1,
                        fontWeight: 600,
                        color: headingColor,
                        margin: 0,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {heading}
                </h2>
                <p
                    style={{
                        fontSize: eff.subSize,
                        lineHeight: 1.55,
                        color: mutedColor,
                        marginTop: 12,
                        marginBottom: 0,
                        fontWeight: 400,
                    }}
                >
                    {subheading}
                </p>
            </div>

            {isCompact ? (
                // ----- COMPACT (mobile) layout -----
                <div
                    style={{
                        flex: 1,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: 16,
                        paddingTop: 16,
                        paddingBottom: 24,
                        overflow: "visible",
                    }}
                >
                    {Wheel}

                    <AnimatePresence mode="wait" initial={false}>
                        <BottomLabel />
                    </AnimatePresence>
                </div>
            ) : (
                // ----- DESKTOP layout: [gutter] [wheel] [gutter] -----
                <div
                    style={{
                        flex: 1,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "visible",
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            width: labelWidth,
                            height: wheelSize,
                            position: "relative",
                            flexShrink: 1,
                            minWidth: 0,
                        }}
                    >
                        <AnimatePresence initial={false}>
                            {!labelOnRight && <SideLabel side="left" />}
                        </AnimatePresence>
                    </div>

                    {Wheel}

                    <div
                        style={{
                            width: labelWidth,
                            height: wheelSize,
                            position: "relative",
                            flexShrink: 1,
                            minWidth: 0,
                        }}
                    >
                        <AnimatePresence initial={false}>
                            {labelOnRight && <SideLabel side="right" />}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    )
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

const DEFAULT_ITEMS: FeatureItem[] = [
    {
        title: "Secure Client Messaging",
        description:
            "A private, encrypted space for clients to securely share files and track their plan's progress.",
    },
    {
        title: "Transparent Planning",
        description:
            "Visualizing the full lifecycle of the trust, mapping out grantor roles, successor triggers, and final distribution methods in one unified view.",
    },
    {
        title: "Full Oversight",
        description:
            "See every moving part of your practice in one clear view.",
    },
    {
        title: "Automated Drafting",
        description:
            "Instantly generate wills, trusts, and ancillary documents from your structured intake data.",
    },
    {
        title: "Smart Client Interview",
        description:
            "Capture details your way — manually enter data or extract insights from uploaded notes.",
    },
    {
        title: "Automated Client Intake",
        description:
            "View your entire practice from a single dashboard with real-time matter updates.",
    },
]

FeatureWheel.defaultProps = {
    heading: "Total Control. Zero Chaos.",
    subheading:
        "We handle the heavy lifting of organization and tracking to keep your firm running smoothly.",
    radius: 200,
    iconSize: 56,
    centerWidth: 360,
    centerHeight: 300,
    labelWidth: 240,
    breakpoint: 500,
    headingColor: "#0F1B2D",
    bodyColor: "#0F1B2D",
    mutedColor: "#7C8597",
    activeBg: "linear-gradient(160deg, #1B2A47 0%, #25365A 50%, #1B2A47 100%)",
    inactiveBg: "#EEF1F6",
    ringTint: "rgba(210,222,242,0.45)",
    items: DEFAULT_ITEMS,
}

// -----------------------------------------------------------------------------
// Property Controls
// -----------------------------------------------------------------------------

addPropertyControls(FeatureWheel, {
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: FeatureWheel.defaultProps.heading,
        description: "The big title shown above the wheel.",
    },
    subheading: {
        type: ControlType.String,
        title: "Subheading",
        defaultValue: FeatureWheel.defaultProps.subheading,
        displayTextArea: true,
        description: "Supporting copy beneath the heading.",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        description:
            "Each item is one feature on the wheel — title, description, plus an optional custom icon and center image. Six is a good count; the wheel auto-distributes any number around the circle.",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Feature title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Short description of this feature.",
                },
                iconImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                    description:
                        "Optional. Upload a **white** monochrome PNG/SVG. If empty, a built-in default icon is used.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Center Image",
                    description:
                        "Optional. Shown in the middle of the wheel when this item is active. If empty, a soft device-style placeholder is used.",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    radius: {
        type: ControlType.Number,
        title: "Wheel Radius",
        min: 120,
        max: 360,
        step: 4,
        unit: "px",
        defaultValue: 200,
        description: "Distance from the wheel's center to each icon.",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 36,
        max: 96,
        step: 2,
        unit: "px",
        defaultValue: 56,
    },
    centerWidth: {
        type: ControlType.Number,
        title: "Center Width",
        min: 200,
        max: 560,
        step: 4,
        unit: "px",
        defaultValue: 360,
        description: "Width of the showcase image in the middle of the wheel.",
    },
    centerHeight: {
        type: ControlType.Number,
        title: "Center Height",
        min: 160,
        max: 480,
        step: 4,
        unit: "px",
        defaultValue: 300,
    },
    labelWidth: {
        type: ControlType.Number,
        title: "Label Width",
        min: 160,
        max: 360,
        step: 4,
        unit: "px",
        defaultValue: 240,
        description:
            "Reserved space on each side of the wheel for the title + description (desktop layout only).",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        min: 320,
        max: 900,
        step: 10,
        unit: "px",
        defaultValue: 500,
        description:
            "Below this width, the wheel switches to a stacked vertical layout with the label below the wheel.",
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#0F1B2D",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#0F1B2D",
        description: "Color of the active feature's title.",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Color",
        defaultValue: "#7C8597",
        description: "Used for the subheading and feature descriptions.",
    },
    activeBg: {
        type: ControlType.String,
        title: "Active Icon BG",
        defaultValue: FeatureWheel.defaultProps.activeBg,
        description:
            "CSS color or gradient for the active icon's background. Try `#1B2A47` or a `linear-gradient(...)` value.",
    },
    inactiveBg: {
        type: ControlType.Color,
        title: "Inactive Icon BG",
        defaultValue: "#EEF1F6",
    },
    ringTint: {
        type: ControlType.Color,
        title: "Ring Tint",
        defaultValue: "rgba(210,222,242,0.45)",
        description: "Soft tint of the circular halo behind the wheel.",
    },
})
