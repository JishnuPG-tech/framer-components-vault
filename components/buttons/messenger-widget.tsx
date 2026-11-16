// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useRef } from "react"

// ── Brand constants ──────────────────────────────────────────
const MSN_BLUE = "#0084FF"
const MSN_PURPLE = "#9333ea"

// ── Keyframe CSS (injected once via useEffect to avoid multi-instance duplication) ──
const KEYFRAMES = `
    @keyframes msn-pulse {
        0%   { transform: scale(1); opacity: 0.6; }
        70%  { transform: scale(1.6); opacity: 0; }
        100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes msn-ripple {
        0%   { transform: scale(0); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
    }
    @keyframes msn-badge-pop {
        0%   { transform: scale(0) rotate(-20deg); }
        70%  { transform: scale(1.25) rotate(5deg); }
        100% { transform: scale(1) rotate(0deg); }
    }
    @keyframes msn-dot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30%            { transform: translateY(-5px); opacity: 1; }
    }
    @keyframes msn-msg-in {
        from { transform: translateY(12px) scale(0.95); opacity: 0; }
        to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes msn-popup-in {
        from { transform: translateY(18px) scale(0.88); opacity: 0; }
        to   { transform: translateY(0) scale(1); opacity: 1; }
    }
`

// ── Icons ────────────────────────────────────────────────────

const MessengerIcon = ({ size = 28, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
        <path d="M0 7.76C0 3.301 3.493 0 8 0s8 3.301 8 7.76-3.493 7.76-8 7.76c-.81 0-1.586-.107-2.316-.307a.639.639 0 0 0-.427.03l-1.588.702a.64.64 0 0 1-.898-.566l-.044-1.423a.639.639 0 0 0-.215-.456C.956 12.108 0 10.092 0 7.76zm5.546-1.921-2.37 3.763c-.192.305.163.658.46.445l2.56-1.955a.326.326 0 0 1 .389.006l1.893 1.42a.819.819 0 0 0 1.205-.229l2.37-3.763c.192-.305-.163-.658-.459-.445L9.033 6.08a.326.326 0 0 1-.389-.006L6.75 4.654a.819.819 0 0 0-1.204.229z" />
    </svg>
)

const SendIcon = ({ color = MSN_BLUE }) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <path
            d="M22 2L11 13"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M22 2L15 22L11 13L2 9L22 2Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const CloseIcon = ({ color = "#fff", size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
            d="M18 6L6 18M6 6l12 12"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
        />
    </svg>
)

const LikeIcon = ({ color = MSN_BLUE, size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
)

// ── Messenger background (subtle dot pattern in light grey) ──
const MSN_BG = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='32' height='32' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='16' cy='16' r='1' fill='%23d1d5db' opacity='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23f0f2f5'/%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E")`

// ── Types ────────────────────────────────────────────────────

type AvailabilityMode = "online" | "away" | "offline"

const STATUS_COLORS: Record<AvailabilityMode, string> = {
    online: "#31a24c",
    away: "#f59e0b",
    offline: "#9ca3af",
}

const STATUS_LABELS: Record<AvailabilityMode, string> = {
    online: "Active now",
    away: "Away",
    offline: "Offline",
}

interface QuickReply {
    label: string
    message: string
}

interface AgentGroup {
    agentName: string
    agentStatus: string
    agentAvatar: any
    pageId: string
    availabilityMode: AvailabilityMode
    offlineMessage: string
}

interface ContentGroup {
    greeting: string
    quickReplies: QuickReply[]
    popupMessage: string
}

interface AppearanceGroup {
    accentColor: string
    gradientEnd: string
    fontFamily: string
    agentNameFontSize: number
    greetingFontSize: number
    quickReplyFontSize: number
    inputFontSize: number
    widgetBorderRadius: number
    buttonBorderRadius: number
}

interface BehaviorGroup {
    position: "bottom-right" | "bottom-left"
    notificationCount: number
    autoOpenDelay: number
    popupDelay: number
    typingDuration: number
}

interface Props {
    agent: AgentGroup
    content: ContentGroup
    appearance: AppearanceGroup
    behavior: BehaviorGroup
}

// ── Sub-components (outside main component to prevent remount on every render) ──

interface AvatarElProps {
    size: number
    src: string | null
}
const AvatarEl = ({ size, src }: AvatarElProps) =>
    src ? (
        <img
            src={src}
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
            }}
        />
    ) : (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size * 0.42,
                flexShrink: 0,
            }}
        >
            🧑‍💼
        </div>
    )

interface MsgAvatarProps {
    src: string | null
    isOffline: boolean
    accentColor: string
    gradientEnd: string
}
const MsgAvatar = ({
    src,
    isOffline,
    accentColor,
    gradientEnd,
}: MsgAvatarProps) => (
    <div
        style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: isOffline
                ? "#9ca3af"
                : `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
        }}
    >
        {src ? (
            <img
                src={src}
                style={{ width: 28, height: 28, objectFit: "cover" }}
            />
        ) : (
            <span style={{ fontSize: 13 }}>🧑‍💼</span>
        )}
    </div>
)

// ── Component ────────────────────────────────────────────────

export default function MessengerWidget(props: Props) {
    const {
        agentName = "Support Team",
        agentStatus = "Typically replies instantly",
        agentAvatar = "",
        pageId = "yourpagename",
        availabilityMode = "online" as AvailabilityMode,
        offlineMessage = "We're currently offline. Send us a message and we'll get back to you soon.",
    } = (props.agent || {}) as AgentGroup

    const {
        greeting = "Hi! 👋 Welcome!\n\nHow can we help you today?",
        quickReplies = [
            { label: "Get started", message: "I'd like to get started" },
            {
                label: "Learn more",
                message: "Tell me more about your services",
            },
            { label: "Talk to us", message: "I'd like to speak with someone" },
        ],
        popupMessage = "👋 Hey there! Have a question? We're here to help.",
    } = (props.content || {}) as ContentGroup

    const {
        accentColor = MSN_BLUE,
        gradientEnd = MSN_PURPLE,
        fontFamily = "system-ui, -apple-system, sans-serif",
        agentNameFontSize = 15,
        greetingFontSize = 14,
        quickReplyFontSize = 13.5,
        inputFontSize = 14,
        widgetBorderRadius = 20,
        buttonBorderRadius = 20,
    } = (props.appearance || {}) as AppearanceGroup

    const {
        position = "bottom-right" as const,
        notificationCount = 1,
        autoOpenDelay = 0,
        popupDelay = 4,
        typingDuration = 1.5,
    } = (props.behavior || {}) as BehaviorGroup

    // ── State ────────────────────────────────────────────────

    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const [showBadge, setShowBadge] = useState(notificationCount > 0)
    const [msgTime, setMsgTime] = useState("00:00")
    const [showPopup, setShowPopup] = useState(false)
    const [popupDismissed, setPopupDismissed] = useState(false)
    const [showTyping, setShowTyping] = useState(false)
    const [greetingVisible, setGreetingVisible] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const secondsRef = useRef(0)
    const isOpenRef = useRef(isOpen)

    const isOffline = availabilityMode === "offline"
    const isAway = availabilityMode === "away"
    const dotColor = STATUS_COLORS[availabilityMode]
    const statusText = isOffline
        ? STATUS_LABELS.offline
        : isAway
          ? STATUS_LABELS.away
          : agentStatus
    const headerGradient = isOffline
        ? "linear-gradient(140deg, #6b7280 0%, #4b5563 100%)"
        : `linear-gradient(140deg, ${accentColor} 0%, ${gradientEnd} 100%)`

    const avatarSrc = agentAvatar
        ? typeof agentAvatar === "string"
            ? agentAvatar
            : agentAvatar?.src
        : null

    const isRight = position !== "bottom-left"
    const posStyle = isRight
        ? { right: 24, left: "auto" as const }
        : { left: 24, right: "auto" as const }
    const chatOrigin = isRight ? "bottom right" : "bottom left"

    // ── Effects ──────────────────────────────────────────────

    // Inject keyframes once — prevents duplicate <style> tags when multiple instances exist
    useEffect(() => {
        if (typeof document === "undefined") return
        if (document.getElementById("msn-widget-styles")) return
        const style = document.createElement("style")
        style.id = "msn-widget-styles"
        style.textContent = KEYFRAMES
        document.head.appendChild(style)
    }, [])

    useEffect(() => {
        isOpenRef.current = isOpen
    }, [isOpen])

    useEffect(() => {
        const t = setTimeout(() => setIsVisible(true), 300)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        if (autoOpenDelay > 0) {
            const t = setTimeout(() => setIsOpen(true), autoOpenDelay * 1000)
            return () => clearTimeout(t)
        }
    }, [autoOpenDelay])

    useEffect(() => {
        if (popupDelay > 0 && !popupDismissed) {
            const t = setTimeout(() => {
                if (!isOpenRef.current) setShowPopup(true)
            }, popupDelay * 1000)
            return () => clearTimeout(t)
        }
    }, [popupDelay, popupDismissed])

    useEffect(() => {
        if (!isOpen) {
            setShowTyping(false)
            setGreetingVisible(false)
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }

        setShowBadge(false)
        setShowPopup(false)
        secondsRef.current = 0

        timerRef.current = setInterval(() => {
            secondsRef.current += 1
            const m = Math.floor(secondsRef.current / 60)
                .toString()
                .padStart(2, "0")
            const s = (secondsRef.current % 60).toString().padStart(2, "0")
            setMsgTime(`${m}:${s}`)
        }, 1000)

        let typingTimeout: ReturnType<typeof setTimeout> | null = null

        if (typingDuration > 0) {
            setShowTyping(true)
            setGreetingVisible(false)
            typingTimeout = setTimeout(() => {
                setShowTyping(false)
                setGreetingVisible(true)
            }, typingDuration * 1000)
        } else {
            setShowTyping(false)
            setGreetingVisible(true)
        }

        setTimeout(() => inputRef.current?.focus(), 420)

        return () => {
            if (typingTimeout) clearTimeout(typingTimeout)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isOpen, typingDuration])

    // ── Handlers ─────────────────────────────────────────────

    const handleOpen = () => setIsOpen(true)
    const handleClose = () => setIsOpen(false)
    const handleDismissPopup = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShowPopup(false)
        setPopupDismissed(true)
    }

    // SSR guard: window may not exist in server-side rendering
    const openMessenger = (msg?: string) => {
        if (typeof window === "undefined") return
        const url = msg
            ? `https://m.me/${pageId}?text=${encodeURIComponent(msg)}`
            : `https://m.me/${pageId}`
        window.open(url, "_blank")
    }

    const handleSend = () => {
        const msg = inputValue.trim()
        if (!msg) return
        openMessenger(msg)
        setInputValue("")
    }

    const handleQuickReply = (qr: QuickReply) => {
        setInputValue(qr.message)
        setTimeout(() => inputRef.current?.focus(), 50)
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSend()
    }

    // ── Canvas preview (Framer editor) ───────────────────────

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    if (isCanvas) {
        return (
            <div
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: isOffline
                        ? "linear-gradient(135deg, #6b7280, #4b5563)"
                        : `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 8px 28px ${accentColor}70`,
                    position: "relative",
                }}
            >
                <MessengerIcon size={30} color="#fff" />
                {notificationCount > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            minWidth: 20,
                            height: 20,
                            borderRadius: 10,
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 5px",
                            border: "2.5px solid #fff",
                            boxShadow: "0 2px 8px rgba(239,68,68,0.55)",
                        }}
                    >
                        {notificationCount > 9 ? "9+" : notificationCount}
                    </div>
                )}
            </div>
        )
    }

    // ── Render ───────────────────────────────────────────────

    return (
        <div
            style={{
                position: "fixed",
                bottom: 24,
                zIndex: 99999,
                ...posStyle,
                fontFamily,
            }}
        >
            {/* ── Notification Popup ── */}
            {showPopup && !isOpen && (
                <div
                    onClick={handleOpen}
                    style={{
                        position: "absolute",
                        bottom: 76,
                        ...(isRight ? { right: 0 } : { left: 0 }),
                        width: 300,
                        background: "#fff",
                        borderRadius: widgetBorderRadius,
                        boxShadow:
                            "0 16px 48px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)",
                        cursor: "pointer",
                        overflow: "hidden",
                        animation:
                            "msn-popup-in 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards",
                        willChange: "transform, opacity",
                    }}
                >
                    {/* Popup header */}
                    <div
                        style={{
                            background: headerGradient,
                            padding: "12px 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    border: "2px solid rgba(255,255,255,0.4)",
                                }}
                            >
                                <AvatarEl size={36} src={avatarSrc} />
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: dotColor,
                                    border: "2px solid white",
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: agentNameFontSize - 2,
                                }}
                            >
                                {agentName}
                            </div>
                            <div
                                style={{
                                    color: "rgba(255,255,255,0.82)",
                                    fontSize: 11,
                                }}
                            >
                                {statusText}
                            </div>
                        </div>
                        <button
                            aria-label="Dismiss notification"
                            onClick={handleDismissPopup}
                            style={{
                                background: "rgba(255,255,255,0.18)",
                                border: "none",
                                borderRadius: "50%",
                                width: 26,
                                height: 26,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                flexShrink: 0,
                                transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                    "rgba(255,255,255,0.32)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                    "rgba(255,255,255,0.18)")
                            }
                        >
                            <CloseIcon size={13} />
                        </button>
                    </div>

                    {/* Popup body */}
                    <div
                        style={{
                            padding: "14px 14px 14px",
                            background: "#f0f2f5",
                        }}
                    >
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: "0 16px 16px 16px",
                                padding: "10px 13px",
                                fontSize: greetingFontSize,
                                lineHeight: 1.5,
                                color: "#111",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                                display: "inline-block",
                                maxWidth: "100%",
                            }}
                        >
                            {popupMessage}
                        </div>
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 11.5,
                                color: "#888",
                                textAlign: isRight ? "right" : "left",
                            }}
                        >
                            Tap to reply →
                        </div>
                    </div>
                </div>
            )}

            {/* ── Chat window ── */}
            <div
                style={{
                    position: "absolute",
                    bottom: 76,
                    ...(isRight ? { right: 0 } : { left: 0 }),
                    width: 360,
                    borderRadius: widgetBorderRadius,
                    overflow: "hidden",
                    boxShadow: isOpen
                        ? "0 24px 72px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.1)"
                        : "none",
                    background: "#fff",
                    transformOrigin: chatOrigin,
                    transform: isOpen
                        ? "scale(1) translateY(0px)"
                        : "scale(0.72) translateY(24px)",
                    opacity: isOpen ? 1 : 0,
                    filter: isOpen ? "blur(0px)" : "blur(6px)",
                    pointerEvents: isOpen ? "all" : "none",
                    transition: isOpen
                        ? "transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease, filter 0.28s ease, box-shadow 0.3s ease"
                        : "transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease, filter 0.22s ease",
                    willChange: "transform, opacity, filter",
                }}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        background: headerGradient,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "background 0.4s ease",
                    }}
                >
                    <div style={{ position: "relative" }}>
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: "2px solid rgba(255,255,255,0.4)",
                                flexShrink: 0,
                            }}
                        >
                            <AvatarEl size={44} src={avatarSrc} />
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                bottom: 1,
                                right: 1,
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: dotColor,
                                border: "2.5px solid white",
                                transition: "background 0.3s",
                            }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: agentNameFontSize,
                                lineHeight: 1.2,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {agentName}
                        </div>
                        <div
                            style={{
                                color: "rgba(255,255,255,0.85)",
                                fontSize: agentNameFontSize - 3,
                                marginTop: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                            }}
                        >
                            {(isOffline || isAway) && (
                                <span
                                    style={{
                                        background: "rgba(255,255,255,0.22)",
                                        borderRadius: 4,
                                        padding: "1px 6px",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {STATUS_LABELS[
                                        availabilityMode
                                    ].toUpperCase()}
                                </span>
                            )}
                            {statusText}
                        </div>
                    </div>
                    <button
                        aria-label="Close chat"
                        onClick={handleClose}
                        style={{
                            background: "rgba(255,255,255,0.18)",
                            border: "none",
                            borderRadius: "50%",
                            width: 32,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                            transition: "background 0.2s, transform 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                                "rgba(255,255,255,0.3)"
                            e.currentTarget.style.transform = "scale(1.1)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                                "rgba(255,255,255,0.18)"
                            e.currentTarget.style.transform = "scale(1)"
                        }}
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* ── Availability banners ── */}
                {isOffline && (
                    <div
                        style={{
                            background: "#fef3c7",
                            borderBottom: "1px solid #fde68a",
                            padding: "9px 14px",
                            fontSize: greetingFontSize - 1.5,
                            color: "#92400e",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 7,
                        }}
                    >
                        <span style={{ fontSize: 14, flexShrink: 0 }}>🔔</span>
                        <span>{offlineMessage}</span>
                    </div>
                )}
                {isAway && (
                    <div
                        style={{
                            background: "#fffbeb",
                            borderBottom: "1px solid #fde68a",
                            padding: "9px 14px",
                            fontSize: greetingFontSize - 1.5,
                            color: "#92400e",
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                        }}
                    >
                        <span style={{ fontSize: 14 }}>🕐</span>
                        <span>
                            Response times may be a bit slower right now.
                        </span>
                    </div>
                )}

                {/* ── Messages area ── */}
                <div
                    style={{
                        backgroundImage: MSN_BG,
                        backgroundSize: "cover",
                        padding: "16px 14px",
                        minHeight: 220,
                        maxHeight: 320,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    {/* Typing indicator */}
                    {showTyping && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 8,
                            }}
                        >
                            <MsgAvatar
                                src={avatarSrc}
                                isOffline={isOffline}
                                accentColor={accentColor}
                                gradientEnd={gradientEnd}
                            />
                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: "4px 18px 18px 18px",
                                    padding: "11px 16px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    animation: "msn-msg-in 0.3s ease forwards",
                                }}
                            >
                                <div
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                        animation:
                                            "msn-dot 1.2s ease-in-out 0s infinite",
                                    }}
                                />
                                <div
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                        animation:
                                            "msn-dot 1.2s ease-in-out 0.2s infinite",
                                    }}
                                />
                                <div
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                        animation:
                                            "msn-dot 1.2s ease-in-out 0.4s infinite",
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Greeting bubble */}
                    {greetingVisible && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 8,
                                animation:
                                    "msn-msg-in 0.38s cubic-bezier(0.34,1.2,0.64,1) forwards",
                            }}
                        >
                            <MsgAvatar
                                src={avatarSrc}
                                isOffline={isOffline}
                                accentColor={accentColor}
                                gradientEnd={gradientEnd}
                            />
                            <div style={{ maxWidth: 256 }}>
                                <div
                                    style={{
                                        background: "#fff",
                                        borderRadius: "4px 18px 18px 18px",
                                        padding: "10px 14px",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                        fontSize: greetingFontSize,
                                        lineHeight: 1.55,
                                        color: "#111",
                                        whiteSpace: "pre-line",
                                    }}
                                >
                                    {greeting}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        marginTop: 4,
                                        paddingLeft: 4,
                                    }}
                                >
                                    <span
                                        style={{ fontSize: 11, color: "#aaa" }}
                                    >
                                        {msgTime}
                                    </span>
                                    <div
                                        style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: "50%",
                                            background: `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <svg
                                            width={8}
                                            height={8}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                d="M20 6L9 17L4 12"
                                                stroke="#fff"
                                                strokeWidth={3}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick replies */}
                    {greetingVisible && quickReplies.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                marginTop: 4,
                                animation:
                                    "msn-msg-in 0.42s cubic-bezier(0.34,1.2,0.64,1) 0.1s both",
                            }}
                        >
                            {quickReplies.map((qr, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickReply(qr)}
                                    style={{
                                        background: "#fff",
                                        border: `1.5px solid ${accentColor}`,
                                        borderRadius: buttonBorderRadius,
                                        padding: "9px 16px",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        fontSize: quickReplyFontSize,
                                        fontWeight: 500,
                                        color: accentColor,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        transition:
                                            "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                        fontFamily,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`
                                        e.currentTarget.style.color = "#fff"
                                        e.currentTarget.style.borderColor =
                                            "transparent"
                                        e.currentTarget.style.transform =
                                            "translateX(4px) scale(1.01)"
                                        e.currentTarget.style.boxShadow = `0 6px 20px ${accentColor}44`
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                            "#fff"
                                        e.currentTarget.style.color =
                                            accentColor
                                        e.currentTarget.style.borderColor =
                                            accentColor
                                        e.currentTarget.style.transform =
                                            "translateX(0) scale(1)"
                                        e.currentTarget.style.boxShadow =
                                            "0 1px 4px rgba(0,0,0,0.06)"
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            background: "currentColor",
                                            flexShrink: 0,
                                            opacity: 0.6,
                                        }}
                                    />
                                    {qr.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Input area ── */}
                <div
                    style={{
                        background: "#fff",
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        borderTop: "1px solid #e4e6e9",
                    }}
                >
                    <button
                        aria-label="Send thumbs up"
                        onClick={() => openMessenger("👍")}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            flexShrink: 0,
                            opacity: 0.6,
                            transition: "opacity 0.2s, transform 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "1"
                            e.currentTarget.style.transform = "scale(1.2)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "0.6"
                            e.currentTarget.style.transform = "scale(1)"
                        }}
                    >
                        <LikeIcon color={accentColor} size={22} />
                    </button>

                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Write a message…"
                        aria-label="Type a message"
                        style={{
                            flex: 1,
                            border: "1.5px solid #e4e6e9",
                            borderRadius: 22,
                            padding: "8px 14px",
                            fontSize: inputFontSize,
                            background: "#f0f2f5",
                            outline: "none",
                            color: "#111",
                            transition: "border-color 0.2s",
                            fontFamily,
                        }}
                        onFocus={(e) =>
                            (e.currentTarget.style.borderColor = accentColor)
                        }
                        onBlur={(e) =>
                            (e.currentTarget.style.borderColor = "#e4e6e9")
                        }
                    />

                    <button
                        aria-label="Send message"
                        onClick={handleSend}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: inputValue.trim()
                                ? `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`
                                : "#e4e6e9",
                            border: "none",
                            cursor: inputValue.trim() ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition:
                                "background 0.22s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                            boxShadow: inputValue.trim()
                                ? `0 4px 14px ${accentColor}55`
                                : "none",
                            flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                            if (inputValue.trim())
                                e.currentTarget.style.transform = "scale(1.12)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)"
                        }}
                    >
                        <SendIcon color="#fff" />
                    </button>
                </div>

                {/* Footer */}
                <div
                    style={{
                        background: "#fff",
                        textAlign: "center",
                        padding: "5px 0 9px",
                        fontSize: 11,
                        color: "#bbb",
                        borderTop: "1px solid #f0f2f5",
                        fontFamily,
                    }}
                >
                    Powered by{" "}
                    <span
                        style={{
                            background: `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`,
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontWeight: 700,
                        }}
                    >
                        Messenger
                    </span>
                </div>
            </div>

            {/* ── FAB wrapper ── */}
            <div style={{ position: "relative", display: "inline-flex" }}>
                <button
                    aria-label={isOpen ? "Close chat" : "Open chat"}
                    onClick={isOpen ? handleClose : handleOpen}
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: isOpen
                            ? "linear-gradient(135deg, #ff6b6b, #ee5a24)"
                            : isOffline
                              ? "linear-gradient(135deg, #6b7280, #4b5563)"
                              : `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isOpen
                            ? "0 6px 24px rgba(238,90,36,0.45)"
                            : isOffline
                              ? "0 6px 24px rgba(107,114,128,0.4)"
                              : `0 8px 28px ${accentColor}70`,
                        transform: isVisible ? "scale(1)" : "scale(0)",
                        opacity: isVisible ? 1 : 0,
                        transition:
                            "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease, background 0.4s ease, box-shadow 0.3s ease",
                        position: "relative",
                        overflow: "hidden",
                        willChange: "transform",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)"
                    }}
                >
                    {/* Click ripple */}
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.18)",
                            transform: "scale(0)",
                            animation: isOpen
                                ? "msn-ripple 0.4s ease-out forwards"
                                : "none",
                            pointerEvents: "none",
                        }}
                    />

                    {/* Pulse rings */}
                    {!isOpen && !isOffline && (
                        <>
                            <div
                                style={{
                                    position: "absolute",
                                    inset: -5,
                                    borderRadius: "50%",
                                    border: `2px solid ${accentColor}`,
                                    animation:
                                        "msn-pulse 2.4s ease-in-out 1.2s infinite",
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    inset: -11,
                                    borderRadius: "50%",
                                    border: `1.5px solid ${gradientEnd}`,
                                    animation:
                                        "msn-pulse 2.4s ease-in-out 1.8s infinite",
                                    pointerEvents: "none",
                                    opacity: 0.45,
                                }}
                            />
                        </>
                    )}

                    {/* Messenger icon */}
                    <div
                        style={{
                            position: "absolute",
                            transition:
                                "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
                            transform: isOpen
                                ? "rotate(-90deg) scale(0.3)"
                                : "rotate(0deg) scale(1)",
                            opacity: isOpen ? 0 : 1,
                            pointerEvents: "none",
                        }}
                    >
                        <MessengerIcon size={30} color="#fff" />
                    </div>

                    {/* Close icon */}
                    <div
                        style={{
                            position: "absolute",
                            transition:
                                "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
                            transform: isOpen
                                ? "rotate(0deg) scale(1)"
                                : "rotate(90deg) scale(0.3)",
                            opacity: isOpen ? 1 : 0,
                            pointerEvents: "none",
                        }}
                    >
                        <CloseIcon color="#fff" size={22} />
                    </div>
                </button>

                {/* Notification badge */}
                {!isOpen && showBadge && notificationCount > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            minWidth: 20,
                            height: 20,
                            borderRadius: 10,
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 5px",
                            border: "2.5px solid #fff",
                            boxShadow: "0 2px 8px rgba(239,68,68,0.55)",
                            pointerEvents: "none",
                            zIndex: 1,
                            animation:
                                "msn-badge-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 1.1s both",
                        }}
                    >
                        {notificationCount > 9 ? "9+" : notificationCount}
                    </div>
                )}
            </div>
        </div>
    )
}

MessengerWidget.displayName = "Messenger Widget"

// ── Property Controls (4 groups) ─────────────────────────────

addPropertyControls(MessengerWidget, {
    agent: {
        type: ControlType.Object,
        title: "Agent",
        controls: {
            agentName: {
                type: ControlType.String,
                title: "Name",
                defaultValue: "Support Team",
            },
            agentStatus: {
                type: ControlType.String,
                title: "Status Text",
                defaultValue: "Typically replies instantly",
            },
            agentAvatar: { type: ControlType.ResponsiveImage, title: "Avatar" },
            pageId: {
                type: ControlType.String,
                title: "Page ID / Username",
                defaultValue: "yourpagename",
                placeholder: "e.g. yourpagename",
            },
            availabilityMode: {
                type: ControlType.Enum,
                title: "Availability",
                defaultValue: "online",
                options: ["online", "away", "offline"],
                optionTitles: ["Online", "Away", "Offline"],
            },
            offlineMessage: {
                type: ControlType.String,
                title: "Offline Banner",
                defaultValue:
                    "We're currently offline. Send us a message and we'll get back to you soon.",
                displayTextArea: true,
                hidden: (agent) => agent.availabilityMode === "online",
            },
        },
    },

    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            greeting: {
                type: ControlType.String,
                title: "Greeting",
                defaultValue: "Hi! 👋 Welcome!\n\nHow can we help you today?",
                displayTextArea: true,
            },
            popupMessage: {
                type: ControlType.String,
                title: "Popup Message",
                defaultValue:
                    "👋 Hey there! Have a question? We're here to help.",
                displayTextArea: true,
            },
            quickReplies: {
                type: ControlType.Array,
                title: "Quick Replies",
                control: {
                    type: ControlType.Object,
                    controls: {
                        label: {
                            type: ControlType.String,
                            title: "Label",
                            defaultValue: "Quick reply",
                        },
                        message: {
                            type: ControlType.String,
                            title: "Message",
                            defaultValue: "Hello!",
                        },
                    },
                },
                defaultValue: [
                    {
                        label: "Get started",
                        message: "I'd like to get started",
                    },
                    {
                        label: "Learn more",
                        message: "Tell me more about your services",
                    },
                    {
                        label: "Talk to us",
                        message: "I'd like to speak with someone",
                    },
                ],
                maxCount: 5,
            },
        },
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            accentColor: {
                type: ControlType.Color,
                title: "Primary Color",
                defaultValue: MSN_BLUE,
            },
            gradientEnd: {
                type: ControlType.Color,
                title: "Gradient End",
                defaultValue: MSN_PURPLE,
            },
            fontFamily: {
                type: ControlType.String,
                title: "Font Family",
                defaultValue: "system-ui, -apple-system, sans-serif",
            },
            agentNameFontSize: {
                type: ControlType.Number,
                title: "Agent Name Size",
                defaultValue: 15,
                min: 10,
                max: 24,
                step: 0.5,
                displayStepper: true,
            },
            greetingFontSize: {
                type: ControlType.Number,
                title: "Greeting Size",
                defaultValue: 14,
                min: 10,
                max: 22,
                step: 0.5,
                displayStepper: true,
            },
            quickReplyFontSize: {
                type: ControlType.Number,
                title: "Button Size",
                defaultValue: 13.5,
                min: 10,
                max: 20,
                step: 0.5,
                displayStepper: true,
            },
            inputFontSize: {
                type: ControlType.Number,
                title: "Input Size",
                defaultValue: 14,
                min: 10,
                max: 20,
                step: 0.5,
                displayStepper: true,
            },
            widgetBorderRadius: {
                type: ControlType.Number,
                title: "Widget Radius",
                defaultValue: 20,
                min: 0,
                max: 32,
                step: 1,
                displayStepper: true,
            },
            buttonBorderRadius: {
                type: ControlType.Number,
                title: "Button Radius",
                defaultValue: 20,
                min: 0,
                max: 32,
                step: 1,
                displayStepper: true,
            },
        },
    },

    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            position: {
                type: ControlType.Enum,
                title: "Position",
                defaultValue: "bottom-right",
                options: ["bottom-right", "bottom-left"],
                optionTitles: ["Bottom Right", "Bottom Left"],
            },
            notificationCount: {
                type: ControlType.Number,
                title: "Badge Count",
                defaultValue: 1,
                min: 0,
                max: 99,
                step: 1,
                displayStepper: true,
            },
            popupDelay: {
                type: ControlType.Number,
                title: "Popup Delay (s)",
                defaultValue: 4,
                min: 0,
                max: 60,
                step: 1,
                displayStepper: true,
                description: "0 = disabled",
            },
            typingDuration: {
                type: ControlType.Number,
                title: "Typing Duration (s)",
                defaultValue: 1.5,
                min: 0,
                max: 5,
                step: 0.5,
                displayStepper: true,
                description: "0 = disabled",
            },
            autoOpenDelay: {
                type: ControlType.Number,
                title: "Auto Open (s)",
                defaultValue: 0,
                min: 0,
                max: 60,
                step: 1,
                displayStepper: true,
                description: "0 = disabled",
            },
        },
    },
})
