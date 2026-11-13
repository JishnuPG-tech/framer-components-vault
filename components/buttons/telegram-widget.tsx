// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useState, useEffect, useRef } from "react"

// ── Brand constants ──────────────────────────────────────────
const TG_BLUE = "#2AABEE"
const TG_DEEP = "#1a8fc2"

// ── Icons ────────────────────────────────────────────────────

const TelegramIcon = ({ size = 28, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z" />
    </svg>
)

const SendIcon = ({ color = TG_BLUE }) => (
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

const SeenIcon = ({ color = TG_BLUE }) => (
    <svg width={16} height={11} viewBox="0 0 16 11" fill="none">
        <path
            d="M1 5.5L4.5 9L10 3"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6 5.5L9.5 9L15 3"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const VerifiedIcon = ({ color = "#fff", size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

// ── Telegram-style background (light blue dot pattern) ───────
const TG_BG = `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='28' height='28' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='14' cy='14' r='0.9' fill='%23c8dff0' opacity='0.55'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23eef5fb'/%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E")`

// ── Types ────────────────────────────────────────────────────

type AvailabilityMode = "online" | "away" | "offline"

const STATUS_COLORS: Record<AvailabilityMode, string> = {
    online: "#4ade80",
    away: "#f59e0b",
    offline: "#9ca3af",
}

const STATUS_LABELS: Record<AvailabilityMode, string> = {
    online: "online",
    away: "away",
    offline: "offline",
}

interface QuickReply {
    emoji: string
    label: string
    message: string
}

interface AgentGroup {
    agentName: string
    agentStatus: string
    agentAvatar: any
    username: string
    showVerified: boolean
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

// ── Component ────────────────────────────────────────────────

export default function TelegramWidget(props: Props) {
    const {
        agentName = "Support",
        agentStatus = "usually replies in minutes",
        agentAvatar = "",
        username = "yourusername",
        showVerified = false,
        availabilityMode = "online" as AvailabilityMode,
        offlineMessage = "We're offline right now. Write to us and we'll reply as soon as we're back.",
    } = (props.agent || {}) as AgentGroup

    const {
        greeting = "Hello! ✈️\n\nHow can we assist you today?",
        quickReplies = [
            {
                emoji: "💬",
                label: "Start a chat",
                message: "Hi! I'd like to chat with you.",
            },
            {
                emoji: "❓",
                label: "Ask a question",
                message: "I have a question for you.",
            },
            {
                emoji: "📋",
                label: "Get information",
                message: "I'd like some information.",
            },
        ],
        popupMessage = "✈️ Hey! Got questions? We reply fast — message us now.",
    } = (props.content || {}) as ContentGroup

    const {
        accentColor = TG_BLUE,
        gradientEnd = TG_DEEP,
        fontFamily = "system-ui, -apple-system, sans-serif",
        agentNameFontSize = 15,
        greetingFontSize = 14,
        quickReplyFontSize = 13.5,
        inputFontSize = 14,
        widgetBorderRadius = 18,
        buttonBorderRadius = 22,
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
    const uid = useRef(`tg-${Math.random().toString(36).slice(2, 7)}`).current

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
    const cleanUsername = username.replace(/^@/, "")

    // ── Effects ──────────────────────────────────────────────

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
        if (popupDelay > 0 && !popupDismissed && !isOpen) {
            const t = setTimeout(() => setShowPopup(true), popupDelay * 1000)
            return () => clearTimeout(t)
        }
    }, [popupDelay, popupDismissed, isOpen])

    useEffect(() => {
        if (isOpen) {
            setShowBadge(false)
            setShowPopup(false)
            secondsRef.current = 0

            const startTimer = () => {
                timerRef.current = setInterval(() => {
                    secondsRef.current += 1
                    const m = Math.floor(secondsRef.current / 60)
                        .toString()
                        .padStart(2, "0")
                    const s = (secondsRef.current % 60)
                        .toString()
                        .padStart(2, "0")
                    setMsgTime(`${m}:${s}`)
                }, 1000)
            }

            if (typingDuration > 0) {
                setShowTyping(true)
                setGreetingVisible(false)
                startTimer()
                const t = setTimeout(() => {
                    setShowTyping(false)
                    setGreetingVisible(true)
                }, typingDuration * 1000)
                setTimeout(() => inputRef.current?.focus(), 420)
                return () => {
                    clearTimeout(t)
                    if (timerRef.current) clearInterval(timerRef.current)
                }
            } else {
                setShowTyping(false)
                setGreetingVisible(true)
                startTimer()
                setTimeout(() => inputRef.current?.focus(), 420)
            }
        } else {
            setShowTyping(false)
            setGreetingVisible(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isOpen])

    // ── Handlers ─────────────────────────────────────────────

    const handleOpen = () => setIsOpen(true)
    const handleClose = () => setIsOpen(false)
    const handleDismissPopup = (e: React.MouseEvent) => {
        e.stopPropagation()
        setShowPopup(false)
        setPopupDismissed(true)
    }
    const openTelegram = (msg?: string) => {
        const base = `https://t.me/${cleanUsername}`
        window.open(
            msg ? `${base}?text=${encodeURIComponent(msg)}` : base,
            "_blank"
        )
    }
    const handleSend = () => {
        const msg = inputValue.trim()
        if (!msg) return
        openTelegram(msg)
        setInputValue("")
    }
    const handleQuickReply = (qr: QuickReply) => {
        setInputValue(qr.message)
        setTimeout(() => inputRef.current?.focus(), 50)
    }
    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSend()
    }

    const isRight = position !== "bottom-left"
    const posStyle = isRight
        ? { right: 24, left: "auto" as const }
        : { left: 24, right: "auto" as const }
    const chatOrigin = isRight ? "bottom right" : "bottom left"

    const avatarSrc = agentAvatar
        ? typeof agentAvatar === "string"
            ? agentAvatar
            : agentAvatar?.src
        : null

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
                    boxShadow: isOffline
                        ? "0 6px 24px rgba(107,114,128,0.4)"
                        : `0 8px 28px ${accentColor}70`,
                    position: "relative",
                }}
            >
                <TelegramIcon size={30} color="#fff" />
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
                        }}
                    >
                        {notificationCount > 9 ? "9+" : notificationCount}
                    </div>
                )}
            </div>
        )
    }

    // ── Sub-components ───────────────────────────────────────

    const AvatarEl = ({ size }: { size: number }) =>
        avatarSrc ? (
            <img
                src={avatarSrc}
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
                    background: `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: size * 0.42,
                    flexShrink: 0,
                }}
            >
                ✈️
            </div>
        )

    const MsgAvatar = () => (
        <div
            style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
            }}
        >
            {avatarSrc ? (
                <img
                    src={avatarSrc}
                    style={{ width: 30, height: 30, objectFit: "cover" }}
                />
            ) : (
                <TelegramIcon size={16} color="#fff" />
            )}
        </div>
    )

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
                            "0 16px 48px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
                        cursor: "pointer",
                        overflow: "hidden",
                        animation: `${uid}-popup-in 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards`,
                        willChange: "transform, opacity",
                    }}
                >
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
                                <AvatarEl size={36} />
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
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                }}
                            >
                                {agentName}
                                {showVerified && (
                                    <VerifiedIcon
                                        color="rgba(255,255,255,0.9)"
                                        size={12}
                                    />
                                )}
                            </div>
                            <div
                                style={{
                                    color: "rgba(255,255,255,0.8)",
                                    fontSize: 11,
                                }}
                            >
                                @{cleanUsername}
                            </div>
                        </div>
                        <button
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
                    <div
                        style={{
                            padding: "13px 14px 14px",
                            backgroundImage: TG_BG,
                            backgroundSize: "cover",
                        }}
                    >
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: "4px 16px 16px 16px",
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
                            Tap to open Telegram →
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
                        ? "0 24px 72px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)"
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
                {/* Header */}
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
                                width: 46,
                                height: 46,
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: "2.5px solid rgba(255,255,255,0.45)",
                                flexShrink: 0,
                            }}
                        >
                            <AvatarEl size={46} />
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
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            {agentName}
                            {showVerified && (
                                <VerifiedIcon
                                    color="rgba(255,255,255,0.92)"
                                    size={agentNameFontSize}
                                />
                            )}
                        </div>
                        <div
                            style={{
                                color: "rgba(255,255,255,0.82)",
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
                            <span>
                                @{cleanUsername} · {statusText}
                            </span>
                        </div>
                    </div>
                    <button
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

                {/* Availability banners */}
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

                {/* Messages area */}
                <div
                    style={{
                        backgroundImage: TG_BG,
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
                            <MsgAvatar />
                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: "4px 18px 18px 18px",
                                    padding: "11px 16px",
                                    boxShadow: "0 1px 5px rgba(0,0,0,0.08)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    animation: `${uid}-msg-in 0.3s ease forwards`,
                                }}
                            >
                                <div
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                        animation: `${uid}-dot 1.2s ease-in-out 0s infinite`,
                                    }}
                                />
                                <div
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                        animation: `${uid}-dot 1.2s ease-in-out 0.2s infinite`,
                                    }}
                                />
                                <div
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                        animation: `${uid}-dot 1.2s ease-in-out 0.4s infinite`,
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
                                animation: `${uid}-msg-in 0.38s cubic-bezier(0.34,1.2,0.64,1) forwards`,
                            }}
                        >
                            <MsgAvatar />
                            <div style={{ maxWidth: 258 }}>
                                <div
                                    style={{
                                        background: "#fff",
                                        borderRadius: "4px 18px 18px 18px",
                                        padding: "10px 14px",
                                        boxShadow: "0 1px 5px rgba(0,0,0,0.08)",
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
                                    <SeenIcon color={accentColor} />
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
                                gap: 7,
                                marginTop: 4,
                                animation: `${uid}-msg-in 0.42s cubic-bezier(0.34,1.2,0.64,1) 0.1s both`,
                            }}
                        >
                            {quickReplies.map((qr, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickReply(qr)}
                                    style={{
                                        background: "#fff",
                                        border: "none",
                                        borderRadius: buttonBorderRadius,
                                        padding: "9px 16px",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        fontSize: quickReplyFontSize,
                                        fontWeight: 500,
                                        color: "#222",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        transition:
                                            "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                                        fontFamily,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`
                                        e.currentTarget.style.color = "#fff"
                                        e.currentTarget.style.transform =
                                            "translateX(4px) scale(1.01)"
                                        e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.15)`
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                            "#fff"
                                        e.currentTarget.style.color = "#222"
                                        e.currentTarget.style.transform =
                                            "translateX(0) scale(1)"
                                        e.currentTarget.style.boxShadow =
                                            "0 1px 4px rgba(0,0,0,0.07)"
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: quickReplyFontSize + 2,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {qr.emoji}
                                    </span>
                                    {qr.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div
                    style={{
                        background: "#fff",
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        borderTop: "1px solid #eef2f7",
                    }}
                >
                    <div
                        style={{
                            fontSize: 22,
                            cursor: "pointer",
                            userSelect: "none",
                            flexShrink: 0,
                            transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.transform =
                                "scale(1.2)")
                        }
                        onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.transform =
                                "scale(1)")
                        }
                    >
                        😊
                    </div>
                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Write a message..."
                        style={{
                            flex: 1,
                            border: "1.5px solid #eef2f7",
                            borderRadius: 22,
                            padding: "8px 14px",
                            fontSize: inputFontSize,
                            background: "#f7fafd",
                            outline: "none",
                            color: "#111",
                            transition: "border-color 0.2s, background 0.2s",
                            fontFamily,
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = accentColor
                            e.currentTarget.style.background = "#fff"
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = "#eef2f7"
                            e.currentTarget.style.background = "#f7fafd"
                        }}
                    />
                    <button
                        onClick={handleSend}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: inputValue.trim()
                                ? `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`
                                : "#e4e9ef",
                            border: "none",
                            cursor: inputValue.trim() ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition:
                                "background 0.22s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s",
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
                        borderTop: "1px solid #f2f5f9",
                        fontFamily,
                    }}
                >
                    Open in{" "}
                    <span
                        style={{
                            background: `linear-gradient(135deg, ${accentColor}, ${gradientEnd})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontWeight: 700,
                        }}
                    >
                        Telegram
                    </span>
                </div>
            </div>

            {/* ── FAB wrapper ── */}
            <div style={{ position: "relative", display: "inline-flex" }}>
                <button
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
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.18)",
                            transform: "scale(0)",
                            animation: isOpen
                                ? `${uid}-ripple 0.4s ease-out forwards`
                                : "none",
                            pointerEvents: "none",
                        }}
                    />

                    {!isOpen && !isOffline && (
                        <>
                            <div
                                style={{
                                    position: "absolute",
                                    inset: -5,
                                    borderRadius: "50%",
                                    border: `2px solid ${accentColor}`,
                                    animation: `${uid}-pulse 2.4s ease-in-out 1.2s infinite`,
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    inset: -11,
                                    borderRadius: "50%",
                                    border: `1.5px solid ${gradientEnd}`,
                                    animation: `${uid}-pulse 2.4s ease-in-out 1.8s infinite`,
                                    pointerEvents: "none",
                                    opacity: 0.4,
                                }}
                            />
                        </>
                    )}

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
                        <TelegramIcon size={30} color="#fff" />
                    </div>
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
                            animation: `${uid}-badge-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 1.1s both`,
                        }}
                    >
                        {notificationCount > 9 ? "9+" : notificationCount}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes ${uid}-pulse {
                    0%   { transform: scale(1); opacity: 0.6; }
                    70%  { transform: scale(1.6); opacity: 0; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
                @keyframes ${uid}-ripple {
                    0%   { transform: scale(0); opacity: 1; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                @keyframes ${uid}-badge-pop {
                    0%   { transform: scale(0) rotate(-20deg); }
                    70%  { transform: scale(1.25) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                @keyframes ${uid}-dot {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30%           { transform: translateY(-5px); opacity: 1; }
                }
                @keyframes ${uid}-msg-in {
                    from { transform: translateY(12px) scale(0.95); opacity: 0; }
                    to   { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes ${uid}-popup-in {
                    from { transform: translateY(18px) scale(0.88); opacity: 0; }
                    to   { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

TelegramWidget.displayName = "Telegram Widget"

// ── Property Controls (4 groups) ─────────────────────────────

addPropertyControls(TelegramWidget, {
    agent: {
        type: ControlType.Object,
        title: "Agent",
        controls: {
            agentName: {
                type: ControlType.String,
                title: "Name",
                defaultValue: "Support",
            },
            agentStatus: {
                type: ControlType.String,
                title: "Status Text",
                defaultValue: "usually replies in minutes",
            },
            agentAvatar: { type: ControlType.ResponsiveImage, title: "Avatar" },
            username: {
                type: ControlType.String,
                title: "Telegram Username",
                defaultValue: "yourusername",
                placeholder: "without @",
            },
            showVerified: {
                type: ControlType.Boolean,
                title: "Verified Badge",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
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
                    "We're offline right now. Write to us and we'll reply as soon as we're back.",
                displayTextArea: true,
                hidden: (agent) => agent.availabilityMode !== "offline",
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
                defaultValue: "Hello! ✈️\n\nHow can we assist you today?",
                displayTextArea: true,
            },
            popupMessage: {
                type: ControlType.String,
                title: "Popup Message",
                defaultValue:
                    "✈️ Hey! Got questions? We reply fast — message us now.",
                displayTextArea: true,
            },
            quickReplies: {
                type: ControlType.Array,
                title: "Quick Replies",
                control: {
                    type: ControlType.Object,
                    controls: {
                        emoji: {
                            type: ControlType.String,
                            title: "Emoji",
                            defaultValue: "💬",
                        },
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
                        emoji: "💬",
                        label: "Start a chat",
                        message: "Hi! I'd like to chat with you.",
                    },
                    {
                        emoji: "❓",
                        label: "Ask a question",
                        message: "I have a question for you.",
                    },
                    {
                        emoji: "📋",
                        label: "Get information",
                        message: "I'd like some information.",
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
                defaultValue: TG_BLUE,
            },
            gradientEnd: {
                type: ControlType.Color,
                title: "Gradient End",
                defaultValue: TG_DEEP,
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
                defaultValue: 18,
                min: 0,
                max: 32,
                step: 1,
                displayStepper: true,
            },
            buttonBorderRadius: {
                type: ControlType.Number,
                title: "Button Radius",
                defaultValue: 22,
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
