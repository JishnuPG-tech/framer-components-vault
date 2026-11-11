import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion } from "framer-motion"

type AvatarStyle = "emoji" | "initial" | "image" | "icon"
type Position = "bottom-left" | "bottom-right" | "top-left" | "top-right"
type Theme = "light" | "dark" | "glass"
type Shadow = "none" | "soft" | "strong"
type AnimationStyle = "slideUp" | "slideIn" | "fade" | "bounce"

interface Notification {
    name?: string
    location?: string
    action?: string
    emoji?: string
    icon?: string
    avatarStyle?: AvatarStyle
    avatarImage?: { src?: string; alt?: string }
    timestamp?: string
}

interface SocialProofToastProps {
    notifications: Notification[]
    initialDelay: number
    displayDuration: number
    interval: number
    loop: boolean
    position: Position
    width: number
    borderRadius: number
    fontSize: number
    theme: Theme
    accentColor?: string
    backgroundColor?: string
    primaryTextColor?: string
    secondaryTextColor?: string
    showBorder: boolean
    borderColor?: string
    shadow: Shadow
    animationStyle: AnimationStyle
    showAvatar: boolean
    showTimestamp: boolean
    showLocation: boolean
    showLiveDot: boolean
    style?: CSSProperties
}

interface ThemePreset {
    background: string
    primaryText: string
    secondaryText: string
    border: string
    accent: string
    shadowColor: string
    glass: boolean
}

const THEMES: Record<Theme, ThemePreset> = {
    light: {
        background: "#FFFFFF",
        primaryText: "#1A1A1A",
        secondaryText: "#6B7280",
        border: "#E8E8EC",
        accent: "#16A34A",
        shadowColor: "rgba(17, 24, 39, 0.12)",
        glass: false,
    },
    dark: {
        background: "#1C1C1F",
        primaryText: "#F5F5F7",
        secondaryText: "#9CA3AF",
        border: "#2E2E33",
        accent: "#22C55E",
        shadowColor: "rgba(0, 0, 0, 0.5)",
        glass: false,
    },
    glass: {
        background: "rgba(255, 255, 255, 0.14)",
        primaryText: "#FFFFFF",
        secondaryText: "rgba(255, 255, 255, 0.72)",
        border: "rgba(255, 255, 255, 0.25)",
        accent: "#22C55E",
        shadowColor: "rgba(0, 0, 0, 0.28)",
        glass: true,
    },
}

const LIVE_DOT_COLOR = "#2DD36F"

// Curated inline SVG icons (Lucide-style, 24x24 viewBox, stroke-based)
const ICON_PATHS: Record<string, string[]> = {
    sparkles: [
        "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
        "M20 3v4",
        "M22 5h-4",
        "M4 17v2",
        "M5 18H3",
    ],
    zap: [
        "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
    ],
    star: [
        "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
    ],
    rocket: [
        "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
        "M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
        "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0",
        "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",
    ],
    gem: [
        "M6 3h12l4 6-10 13L2 9Z",
        "M11 3 8 9l4 13 4-13-3-6",
        "M2 9h20",
    ],
    shoppingBag: [
        "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",
        "M3 6h18",
        "M16 10a4 4 0 0 1-8 0",
    ],
    checkCircle: [
        "M21.801 10A10 10 0 1 1 17 3.335",
        "m9 11 3 3L22 4",
    ],
    heart: [
        "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
    ],
    bell: [
        "M10.268 21a2 2 0 0 0 3.464 0",
        "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
    ],
    trendingUp: [
        "M16 7h6v6",
        "m22 7-8.5 8.5-5-5L2 17",
    ],
}

const EMOJI_TO_ICON: Record<string, string> = {
    "🎉": "sparkles",
    "✨": "sparkles",
    "👋": "sparkles",
    "⚡": "zap",
    "⭐": "star",
    "🌟": "star",
    "🚀": "rocket",
    "💎": "gem",
    "🛒": "shoppingBag",
    "🛍️": "shoppingBag",
    "✅": "checkCircle",
    "❤️": "heart",
    "💖": "heart",
    "🔔": "bell",
    "📈": "trendingUp",
}

function GlyphIcon(props: { name: string; color: string; size?: number }) {
    const { name, color, size = 20 } = props
    const paths = ICON_PATHS[name]
    if (!paths) return null
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ display: "block" }}
        >
            {paths.map((d, i) => (
                <path key={i} d={d} />
            ))}
        </svg>
    )
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
    {
        name: "Sarah K.",
        location: "London",
        action: "just joined the waitlist",
        emoji: "🎉",
        icon: "sparkles",
        avatarStyle: "icon",
        timestamp: "2 min ago",
    },
    {
        name: "Ahmed R.",
        location: "Dubai",
        action: "just purchased the Pro plan",
        emoji: "⚡",
        icon: "shoppingBag",
        avatarStyle: "icon",
        timestamp: "5 min ago",
    },
    {
        name: "Maria L.",
        location: "Barcelona",
        action: "left a 5-star review",
        emoji: "⭐",
        icon: "star",
        avatarStyle: "icon",
        timestamp: "8 min ago",
    },
    {
        name: "James T.",
        location: "New York",
        action: "started a free trial",
        emoji: "🚀",
        icon: "rocket",
        avatarStyle: "icon",
        timestamp: "12 min ago",
    },
    {
        name: "Lena M.",
        location: "Berlin",
        action: "upgraded to annual",
        emoji: "💎",
        icon: "gem",
        avatarStyle: "icon",
        timestamp: "just now",
    },
]

function getEnterVariant(animationStyle: AnimationStyle) {
    switch (animationStyle) {
        case "slideIn":
            return {
                initial: { opacity: 0, x: -36, scale: 1 },
                animate: { opacity: 1, x: 0, scale: 1 },
                transition: { type: "spring", stiffness: 520, damping: 34 } as const,
            }
        case "fade":
            return {
                initial: { opacity: 0, y: 0, scale: 1 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: {
                    type: "tween",
                    duration: 0.32,
                    ease: [0.22, 1, 0.36, 1],
                } as const,
            }
        case "bounce":
            return {
                initial: { opacity: 0, y: 8, scale: 0.8 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: { type: "spring", stiffness: 600, damping: 18 } as const,
            }
        case "slideUp":
        default:
            return {
                initial: { opacity: 0, y: 20, scale: 0.95 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: { type: "spring", stiffness: 460, damping: 32 } as const,
            }
    }
}

const EXIT = {
    opacity: 0,
    y: 10,
    scale: 1,
    transition: { type: "tween", duration: 0.22, ease: [0.4, 0, 1, 1] } as const,
}

const POSITIONS: Record<
    Position,
    { vertical: CSSProperties; align: CSSProperties["alignItems"] }
> = {
    "bottom-left": { vertical: { bottom: 24, left: 24 }, align: "flex-start" },
    "bottom-right": { vertical: { bottom: 24, right: 24 }, align: "flex-end" },
    "top-left": { vertical: { top: 24, left: 24 }, align: "flex-start" },
    "top-right": { vertical: { top: 24, right: 24 }, align: "flex-end" },
}

function resolveShadow(shadow: Shadow, color: string): string {
    if (shadow === "none") return "none"
    if (shadow === "strong") return `0 14px 40px ${color}`
    return `0 6px 22px ${color}`
}

interface CardColors {
    background: string
    primaryText: string
    secondaryText: string
    border: string
    accent: string
}

interface CardProps {
    notification: Notification
    colors: CardColors
    width: number
    borderRadius: number
    fontSize: number
    boxShadow: string
    showBorder: boolean
    borderColorValue: string
    glass: boolean
    showAvatar: boolean
    showTimestamp: boolean
    showLocation: boolean
    showLiveDot: boolean
    animateDot: boolean
}

function ToastCard(props: CardProps) {
    const {
        notification,
        colors,
        width,
        borderRadius,
        fontSize,
        boxShadow,
        showBorder,
        borderColorValue,
        glass,
        showAvatar,
        showTimestamp,
        showLocation,
        showLiveDot,
        animateDot,
    } = props

    const name = notification.name || ""
    const action = notification.action || ""
    const avatarStyle: AvatarStyle = notification.avatarStyle || "emoji"
    const isImage = avatarStyle === "image"
    const avatarRadius = isImage ? "50%" : Math.min(12, borderRadius)

    const locationText = showLocation ? (notification.location || "").trim() : ""
    const timestampText = showTimestamp ? (notification.timestamp || "").trim() : ""
    const metaParts = [locationText, timestampText].filter(Boolean)

    const initial = name.trim().charAt(0).toUpperCase() || "•"

    // Resolve an SVG icon for "icon" style, or map a known emoji to one
    const emojiIcon = notification.emoji
        ? EMOJI_TO_ICON[notification.emoji]
        : undefined
    const iconName =
        avatarStyle === "icon"
            ? notification.icon || "sparkles"
            : avatarStyle === "emoji"
              ? emojiIcon
              : undefined

    const primarySize = fontSize
    const metaSize = Math.max(10, fontSize - 2)

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{
                position: "relative",
                pointerEvents: "auto",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 12,
                width,
                maxWidth: "calc(100vw - 32px)",
                padding: "12px 14px",
                background: colors.background,
                border: showBorder ? `1px solid ${borderColorValue}` : "none",
                borderRadius,
                boxShadow,
                color: colors.primaryText,
                fontFamily: "inherit",
                WebkitBackdropFilter: glass ? "blur(14px)" : undefined,
                backdropFilter: glass ? "blur(14px)" : undefined,
            }}
        >
            {showLiveDot && (
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: LIVE_DOT_COLOR,
                        boxShadow: `0 0 0 0 ${LIVE_DOT_COLOR}`,
                        animation: animateDot
                            ? "sptPulse 1.8s ease-in-out infinite"
                            : undefined,
                    }}
                />
            )}

            {showAvatar && (
                <div
                    aria-hidden={isImage ? undefined : "true"}
                    style={{
                        position: "relative",
                        flex: "0 0 auto",
                        width: 40,
                        height: 40,
                        borderRadius: avatarRadius,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {!isImage && (
                        <span
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: colors.accent,
                                opacity: 0.14,
                            }}
                        />
                    )}
                    {isImage && notification.avatarImage?.src ? (
                        <img
                            src={notification.avatarImage.src}
                            alt={notification.avatarImage.alt || name}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : avatarStyle === "initial" ? (
                        <span
                            style={{
                                position: "relative",
                                fontSize: 16,
                                fontWeight: 600,
                                color: colors.accent,
                                lineHeight: 1,
                            }}
                        >
                            {initial}
                        </span>
                    ) : iconName ? (
                        <span style={{ position: "relative", display: "flex" }}>
                            <GlyphIcon name={iconName} color={colors.accent} size={20} />
                        </span>
                    ) : (
                        <span style={{ position: "relative", fontSize: 19, lineHeight: 1 }}>
                            {notification.emoji || "👋"}
                        </span>
                    )}
                </div>
            )}

            <div
                style={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <div
                    style={{
                        fontSize: primarySize,
                        lineHeight: 1.35,
                        color: colors.primaryText,
                    }}
                >
                    {name && <span style={{ fontWeight: 600 }}>{name}</span>}
                    {name && action ? " " : ""}
                    {action && <span style={{ fontWeight: 400 }}>{action}</span>}
                </div>
                {metaParts.length > 0 && (
                    <div
                        style={{
                            fontSize: metaSize,
                            lineHeight: 1.3,
                            color: colors.secondaryText,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {metaParts.join(" · ")}
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Social Proof Toast
 *
 * Rotating social-proof notification popups pinned to any screen corner.
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 64
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SocialProofToast(props: SocialProofToastProps) {
    const {
        notifications = DEFAULT_NOTIFICATIONS,
        initialDelay = 1.5,
        displayDuration = 3,
        interval = 4,
        loop = true,
        position = "bottom-left",
        width = 320,
        borderRadius = 14,
        fontSize = 14,
        theme = "light",
        accentColor,
        backgroundColor,
        primaryTextColor,
        secondaryTextColor,
        showBorder = true,
        borderColor,
        shadow = "soft",
        animationStyle = "slideUp",
        showAvatar = true,
        showTimestamp = true,
        showLocation = true,
        showLiveDot = true,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const items = notifications && notifications.length > 0 ? notifications : []

    const preset = THEMES[theme] || THEMES.light
    const colors: CardColors = {
        background: backgroundColor ?? preset.background,
        primaryText: primaryTextColor ?? preset.primaryText,
        secondaryText: secondaryTextColor ?? preset.secondaryText,
        border: borderColor ?? preset.border,
        accent: accentColor ?? preset.accent,
    }
    const boxShadow = resolveShadow(shadow, preset.shadowColor)

    const [activeIndex, setActiveIndex] = useState(0)
    const [visible, setVisible] = useState(false)

    const indexRef = useRef(0)

    useEffect(() => {
        if (isStatic) return
        if (items.length === 0) return

        let cancelled = false
        const timers: number[] = []
        indexRef.current = 0

        const clearTimers = () => {
            for (const t of timers) clearTimeout(t)
            timers.length = 0
        }

        const showNext = (delay: number) => {
            const showTimer = window.setTimeout(() => {
                if (cancelled) return
                setActiveIndex(indexRef.current)
                setVisible(true)

                const hideTimer = window.setTimeout(() => {
                    if (cancelled) return
                    setVisible(false)
                }, Math.max(0, displayDuration * 1000))
                timers.push(hideTimer)

                const advanceTimer = window.setTimeout(() => {
                    if (cancelled) return
                    const next = indexRef.current + 1
                    if (next >= items.length) {
                        if (!loop) return
                        indexRef.current = 0
                    } else {
                        indexRef.current = next
                    }
                    showNext(0)
                }, Math.max(displayDuration * 1000, interval * 1000))
                timers.push(advanceTimer)
            }, Math.max(0, delay))
            timers.push(showTimer)
        }

        showNext(initialDelay * 1000)

        return () => {
            cancelled = true
            clearTimers()
            setVisible(false)
        }
    }, [
        isStatic,
        items.length,
        initialDelay,
        displayDuration,
        interval,
        loop,
    ])

    const enter = useMemo(() => getEnterVariant(animationStyle), [animationStyle])

    const keyframes = (
        <style>{`@keyframes sptPulse {
0% { box-shadow: 0 0 0 0 rgba(45, 211, 111, 0.55); }
70% { box-shadow: 0 0 0 7px rgba(45, 211, 111, 0); }
100% { box-shadow: 0 0 0 0 rgba(45, 211, 111, 0); }
}`}</style>
    )

    // Canvas / export / thumbnail: static, non-animated preview of the first item.
    if (isStatic) {
        const previewItem = items[0] || DEFAULT_NOTIFICATIONS[0]
        return (
            <div style={{ position: "relative", ...style }}>
                {keyframes}
                <ToastCard
                    notification={previewItem}
                    colors={colors}
                    width={width}
                    borderRadius={borderRadius}
                    fontSize={fontSize}
                    boxShadow={boxShadow}
                    showBorder={showBorder}
                    borderColorValue={colors.border}
                    glass={preset.glass}
                    showAvatar={showAvatar}
                    showTimestamp={showTimestamp}
                    showLocation={showLocation}
                    showLiveDot={showLiveDot}
                    animateDot={false}
                />
            </div>
        )
    }

    const positionConfig = POSITIONS[position] || POSITIONS["bottom-left"]
    const current = items[activeIndex] || items[0]

    return (
        <div style={{ position: "relative", ...style }}>
            {keyframes}
            <div
                style={{
                    position: "fixed",
                    ...positionConfig.vertical,
                    zIndex: 2147483000,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: positionConfig.align,
                    pointerEvents: "none",
                }}
            >
                <AnimatePresence mode="wait">
                    {visible && current && (
                        <motion.div
                            key={activeIndex}
                            initial={enter.initial}
                            animate={enter.animate}
                            exit={EXIT}
                            transition={enter.transition}
                            style={{ transformOrigin: "bottom center" }}
                        >
                            <ToastCard
                                notification={current}
                                colors={colors}
                                width={width}
                                borderRadius={borderRadius}
                                fontSize={fontSize}
                                boxShadow={boxShadow}
                                showBorder={showBorder}
                                borderColorValue={colors.border}
                                glass={preset.glass}
                                showAvatar={showAvatar}
                                showTimestamp={showTimestamp}
                                showLocation={showLocation}
                                showLiveDot={showLiveDot}
                                animateDot={true}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

addPropertyControls(SocialProofToast, {
    notifications: {
        type: ControlType.Array,
        title: "Notifications",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Sarah K.",
                },
                action: {
                    type: ControlType.String,
                    title: "Action",
                    defaultValue: "just joined the waitlist",
                },
                location: {
                    type: ControlType.String,
                    title: "Location",
                    defaultValue: "London",
                },
                timestamp: {
                    type: ControlType.String,
                    title: "Timestamp",
                    defaultValue: "2 min ago",
                },
                avatarStyle: {
                    type: ControlType.Enum,
                    title: "Avatar",
                    options: ["icon", "emoji", "initial", "image"],
                    optionTitles: ["Icon", "Emoji", "Initial", "Image"],
                    defaultValue: "icon",
                    displaySegmentedControl: true,
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: [
                        "sparkles",
                        "zap",
                        "star",
                        "rocket",
                        "gem",
                        "shoppingBag",
                        "checkCircle",
                        "heart",
                        "bell",
                        "trendingUp",
                    ],
                    optionTitles: [
                        "Sparkles",
                        "Bolt",
                        "Star",
                        "Rocket",
                        "Gem",
                        "Shopping Bag",
                        "Check",
                        "Heart",
                        "Bell",
                        "Trending Up",
                    ],
                    defaultValue: "sparkles",
                    hidden: (p: Notification) => p.avatarStyle !== "icon",
                },
                emoji: {
                    type: ControlType.String,
                    title: "Emoji",
                    defaultValue: "🎉",
                    hidden: (p: Notification) =>
                        p.avatarStyle === "image" || p.avatarStyle === "icon",
                },
                avatarImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: Notification) => p.avatarStyle !== "image",
                },
            },
        },
        defaultValue: DEFAULT_NOTIFICATIONS,
    },

    initialDelay: {
        type: ControlType.Number,
        title: "Initial Delay",
        defaultValue: 1.5,
        min: 0,
        max: 15,
        step: 0.1,
        unit: "s",
    },
    displayDuration: {
        type: ControlType.Number,
        title: "Display Time",
        defaultValue: 3,
        min: 1,
        max: 15,
        step: 0.5,
        unit: "s",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 4,
        min: 2,
        max: 30,
        step: 0.5,
        unit: "s",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },

    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["bottom-left", "bottom-right", "top-left", "top-right"],
        optionTitles: ["Bottom Left", "Bottom Right", "Top Left", "Top Right"],
        defaultValue: "bottom-left",
    },
    width: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 320,
        min: 240,
        max: 400,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 14,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Text Size",
        defaultValue: 14,
        min: 11,
        max: 20,
        step: 1,
        unit: "px",
        description: "Name line; the meta line scales with it",
    },

    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "glass"],
        optionTitles: ["Light", "Dark", "Glass"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        optional: true,
        description: "Overrides the theme accent",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        optional: true,
        description: "Overrides the theme background",
    },
    primaryTextColor: {
        type: ControlType.Color,
        title: "Text",
        optional: true,
        description: "Overrides the theme primary text",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Muted Text",
        optional: true,
        description: "Overrides the theme secondary text",
    },
    showBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        optional: true,
        hidden: (p: Partial<SocialProofToastProps>) => !p.showBorder,
    },
    shadow: {
        type: ControlType.Enum,
        title: "Shadow",
        options: ["none", "soft", "strong"],
        optionTitles: ["None", "Soft", "Strong"],
        defaultValue: "soft",
        displaySegmentedControl: true,
    },

    animationStyle: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["slideUp", "slideIn", "fade", "bounce"],
        optionTitles: ["Slide Up", "Slide In", "Fade", "Bounce"],
        defaultValue: "slideUp",
    },

    showAvatar: {
        type: ControlType.Boolean,
        title: "Avatar",
        defaultValue: true,
    },
    showTimestamp: {
        type: ControlType.Boolean,
        title: "Timestamp",
        defaultValue: true,
    },
    showLocation: {
        type: ControlType.Boolean,
        title: "Location",
        defaultValue: true,
    },
    showLiveDot: {
        type: ControlType.Boolean,
        title: "Live Dot",
        defaultValue: true,
    },
})
