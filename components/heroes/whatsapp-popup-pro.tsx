import * as React from "react"
import {
    useState,
    startTransition,
    type CSSProperties,
    useEffect,
    useRef,
} from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ChatPopupProps {
    countryCode?: string
    customCountryCode?: string
    phoneNumber: string
    accountName: string
    accountStatus: string
    profileImage?: { src?: string; alt?: string }
    profileImageUrl?: string
    initialMessage: string
    placeholderText: string
    dayLabel?: string
    position: "left" | "right"
    primaryColor: string
    headerColor?: string
    accentColor?: string
    darkMode: boolean
    showNotificationBadge: boolean
    openInNewTab: boolean
    fonts: {
        accountName: CSSProperties
        accountStatus: CSSProperties
        message: CSSProperties
        quickReply: CSSProperties
    }
    typingDuration: number
    presetMessages: Array<{ label: string; message: string }>
    quickReplyColor: string
    previewOpen?: boolean
    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/* Shared data                                                         */
/* ------------------------------------------------------------------ */

const CHAT_ENDPOINT = "https://wa.me/"
const FALLBACK_AVATAR =
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80"
const FONT_STACK =
    "'Segoe UI', 'Helvetica Neue', Helvetica, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"

// Country dialling codes for the "Country" dropdown — [code, label].
const COUNTRY_CODES: Array<[string, string]> = [
    ["91", "🇮🇳 India (+91)"],
    ["1", "🇺🇸 USA / Canada (+1)"],
    ["44", "🇬🇧 United Kingdom (+44)"],
    ["971", "🇦🇪 UAE (+971)"],
    ["966", "🇸🇦 Saudi Arabia (+966)"],
    ["974", "🇶🇦 Qatar (+974)"],
    ["965", "🇰🇼 Kuwait (+965)"],
    ["968", "🇴🇲 Oman (+968)"],
    ["973", "🇧🇭 Bahrain (+973)"],
    ["61", "🇦🇺 Australia (+61)"],
    ["64", "🇳🇿 New Zealand (+64)"],
    ["65", "🇸🇬 Singapore (+65)"],
    ["60", "🇲🇾 Malaysia (+60)"],
    ["62", "🇮🇩 Indonesia (+62)"],
    ["63", "🇵🇭 Philippines (+63)"],
    ["66", "🇹🇭 Thailand (+66)"],
    ["84", "🇻🇳 Vietnam (+84)"],
    ["81", "🇯🇵 Japan (+81)"],
    ["82", "🇰🇷 South Korea (+82)"],
    ["86", "🇨🇳 China (+86)"],
    ["852", "🇭🇰 Hong Kong (+852)"],
    ["92", "🇵🇰 Pakistan (+92)"],
    ["880", "🇧🇩 Bangladesh (+880)"],
    ["94", "🇱🇰 Sri Lanka (+94)"],
    ["977", "🇳🇵 Nepal (+977)"],
    ["49", "🇩🇪 Germany (+49)"],
    ["33", "🇫🇷 France (+33)"],
    ["39", "🇮🇹 Italy (+39)"],
    ["34", "🇪🇸 Spain (+34)"],
    ["351", "🇵🇹 Portugal (+351)"],
    ["31", "🇳🇱 Netherlands (+31)"],
    ["32", "🇧🇪 Belgium (+32)"],
    ["41", "🇨🇭 Switzerland (+41)"],
    ["43", "🇦🇹 Austria (+43)"],
    ["46", "🇸🇪 Sweden (+46)"],
    ["47", "🇳🇴 Norway (+47)"],
    ["45", "🇩🇰 Denmark (+45)"],
    ["353", "🇮🇪 Ireland (+353)"],
    ["48", "🇵🇱 Poland (+48)"],
    ["90", "🇹🇷 Türkiye (+90)"],
    ["7", "🇷🇺 Russia (+7)"],
    ["380", "🇺🇦 Ukraine (+380)"],
    ["20", "🇪🇬 Egypt (+20)"],
    ["27", "🇿🇦 South Africa (+27)"],
    ["234", "🇳🇬 Nigeria (+234)"],
    ["254", "🇰🇪 Kenya (+254)"],
    ["212", "🇲🇦 Morocco (+212)"],
    ["55", "🇧🇷 Brazil (+55)"],
    ["52", "🇲🇽 Mexico (+52)"],
    ["54", "🇦🇷 Argentina (+54)"],
    ["57", "🇨🇴 Colombia (+57)"],
    ["56", "🇨🇱 Chile (+56)"],
    ["custom", "Other — type code"],
]

// Joins the country code and local number into one international number.
// Strips spaces, dashes, brackets and "+", and the leading 0 many local
// numbers are written with (e.g. 098765 43210 → 9876543210).
const buildNumber = (
    code: string | undefined,
    custom: string | undefined,
    local: string | undefined
) => {
    const cc = String(code === "custom" ? custom || "" : code || "").replace(
        /\D/g,
        ""
    )
    let rest = String(local || "").replace(/\D/g, "")
    if (cc && rest.startsWith("00" + cc)) rest = rest.slice(2 + cc.length)
    else if (cc && rest.length > 10 && rest.startsWith(cc))
        rest = rest.slice(cc.length)
    rest = rest.replace(/^0+/, "")
    return cc + rest
}

const EMOJI_GROUPS: Array<{ title: string; items: string[] }> = [
    {
        title: "Faces",
        items: [
            "😀",
            "😁",
            "😆",
            "😅",
            "🤭",
            "😊",
            "🥹",
            "😌",
            "😍",
            "🤗",
            "😉",
            "🙂",
            "🤔",
            "🫡",
            "😮",
            "😴",
            "🤤",
            "😇",
            "🥲",
            "😏",
            "😬",
            "🤩",
            "🥳",
            "😎",
        ],
    },
    {
        title: "Hands",
        items: [
            "👋",
            "🙌",
            "👏",
            "🙏",
            "🤝",
            "👍",
            "👌",
            "✌️",
            "🤞",
            "🫶",
            "💪",
            "☝️",
            "👉",
            "👈",
            "✍️",
            "🤙",
        ],
    },
    {
        title: "Love",
        items: [
            "❤️",
            "🩷",
            "🧡",
            "💛",
            "💚",
            "🩵",
            "💙",
            "💜",
            "🤍",
            "💖",
            "💫",
            "✨",
            "🌸",
            "🌼",
            "🌿",
            "☀️",
        ],
    },
    {
        title: "Design",
        items: [
            "🎨",
            "🖌️",
            "✏️",
            "📐",
            "📏",
            "🖼️",
            "💻",
            "📱",
            "🖥️",
            "🧩",
            "💡",
            "🚀",
            "🎯",
            "📈",
            "✅",
            "📅",
        ],
    },
]

const palette = (dark: boolean, headerColor: string) => ({
    panel: dark ? "#111b21" : "#ffffff",
    text: dark ? "#e9edef" : "#111b21",
    sub: dark ? "#8696a0" : "#667781",
    header: dark ? "#202c33" : headerColor,
    headerText: dark ? "#e9edef" : "#ffffff",
    headerSub: dark ? "#8696a0" : "rgba(255,255,255,0.82)",
    wall: dark ? "#0b141a" : "#efeae2",
    doodle: dark ? "rgba(233,237,239,0.055)" : "rgba(84,101,111,0.085)",
    inBubble: dark ? "#202c33" : "#ffffff",
    outBubble: dark ? "#005c4b" : "#d9fdd3",
    bubbleShadow: dark
        ? "0 1px 0.5px rgba(0,0,0,0.35)"
        : "0 1px 0.5px rgba(11,20,26,0.13)",
    chip: dark ? "#182229" : "#ffffff",
    chipText: dark ? "#8696a0" : "#54656f",
    bar: dark ? "#202c33" : "#f0f2f5",
    field: dark ? "#2a3942" : "#ffffff",
    icon: dark ? "#8696a0" : "#54656f",
    hover: dark ? "#2a3942" : "#f0f2f5",
    tick: "#53bdeb",
})

// Original doodle wallpaper tile (simple line shapes), tinted per theme.
const doodleTile = (stroke: string) => {
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150' fill='none' stroke='${stroke}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>` +
        `<circle cx='20' cy='22' r='7'/>` +
        `<path d='M56 12l3 6.2 6.8 1-4.9 4.7 1.2 6.7-6.1-3.2-6.1 3.2 1.2-6.7-4.9-4.7 6.8-1z'/>` +
        `<path d='M104 20c4-6 12-2 8 4l-8 8-8-8c-4-6 4-10 8-4z'/>` +
        `<path d='M132 42c6 0 6 8 0 8s-6 8 0 8'/>` +
        `<path d='M14 66h12M20 60v12'/>` +
        `<path d='M50 76l10-14 10 14z'/>` +
        `<rect x='90' y='62' width='18' height='13' rx='3'/><path d='M94 62v-3a5 5 0 0 1 10 0v3'/>` +
        `<path d='M10 110c6-6 12 6 18 0s12 6 18 0'/>` +
        `<circle cx='74' cy='112' r='1.8'/><circle cx='82' cy='104' r='1.8'/><circle cx='66' cy='104' r='1.8'/>` +
        `<path d='M110 100l14 14M124 100l-14 14'/>` +
        `<path d='M60 136c0-6 9-6 9 0'/>` +
        `<path d='M138 130a6 6 0 1 1-6-6'/>` +
        `<path d='M30 136l6-6 6 6'/>` +
        `</svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const PATHS = {
    close: "M6 6l12 12M18 6 6 18",
    send: "M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z",
    smile: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-3.8 11.2c.95 1.4 2.25 2.1 3.8 2.1s2.85-.7 3.8-2.1",
    bubble: "M12 2.6c-5.3 0-9.6 3.8-9.6 8.6 0 2.4 1.07 4.6 2.82 6.15L4.4 21.4l4.55-1.86c.97.27 1.99.4 3.05.4 5.3 0 9.6-3.85 9.6-8.7S17.3 2.6 12 2.6Z",
    ticks: "M1.5 8.6 4.6 11.7 11 4.6M7.6 10.7l1 1 6.4-7.1",
    tailIn: "M8 0H1.5C.3 0-.3 1.4.5 2.3L8 11V0Z",
    tailOut: "M0 0h6.5c1.2 0 1.8 1.4 1 2.3L0 11V0Z",
}

const clockNow = () => {
    try {
        return new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })
    } catch {
        return "12:00"
    }
}

const avatarOf = (p: ChatPopupProps) => ({
    src: p.profileImage?.src || p.profileImageUrl || FALLBACK_AVATAR,
    alt: p.profileImage?.alt || p.accountName || "Profile",
})

const fontsOf = (p: ChatPopupProps) => ({
    accountName: p.fonts?.accountName ?? {},
    accountStatus: p.fonts?.accountStatus ?? {},
    message: p.fonts?.message ?? {},
    quickReply: p.fonts?.quickReply ?? {},
})

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Missive(props: ChatPopupProps) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticChatPopup {...props} />
    return <LiveChatPopup {...props} />
}

/* ------------------------------------------------------------------ */
/* Static path — plain divs, nothing running                          */
/* ------------------------------------------------------------------ */

function StaticChatPopup(props: ChatPopupProps) {
    const {
        accountName,
        accountStatus,
        initialMessage,
        placeholderText,
        dayLabel = "Today",
        position = "right",
        primaryColor,
        headerColor = "#008069",
        accentColor = "#00a884",
        darkMode,
        showNotificationBadge,
        presetMessages,
        quickReplyColor,
        previewOpen = true,
    } = props
    const c = palette(darkMode, headerColor)
    const fonts = fontsOf(props)
    const avatar = avatarOf(props)

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    bottom: 24,
                    [position]: 24,
                    fontFamily: FONT_STACK,
                    display: "flex",
                    flexDirection: "column",
                    alignItems:
                        position === "right" ? "flex-end" : "flex-start",
                    pointerEvents: "auto",
                }}
            >
                {previewOpen && (
                    <div
                        style={{
                            width: 370,
                            height: 540,
                            backgroundColor: c.panel,
                            borderRadius: 14,
                            boxShadow:
                                "0 18px 48px rgba(11,20,26,0.28), 0 2px 6px rgba(11,20,26,0.12)",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: c.header,
                                padding: "10px 12px 10px 14px",
                                minHeight: 62,
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <img
                                src={avatar.src}
                                alt={avatar.alt}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    display: "block",
                                    flexShrink: 0,
                                }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        color: c.headerText,
                                        ...fonts.accountName,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {accountName}
                                </div>
                                <div
                                    style={{
                                        color: c.headerSub,
                                        marginTop: 3,
                                        ...fonts.accountStatus,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {accountStatus}
                                </div>
                            </div>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d={PATHS.close}
                                        fill="none"
                                        stroke={c.headerText}
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div
                            style={{
                                flex: 1,
                                padding: "12px 18px 12px",
                                backgroundColor: c.wall,
                                backgroundImage: doodleTile(c.doodle),
                                backgroundSize: "150px 150px",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <div
                                style={{
                                    alignSelf: "center",
                                    backgroundColor: c.chip,
                                    color: c.chipText,
                                    fontSize: 12.5,
                                    padding: "5px 12px 6px",
                                    borderRadius: 7.5,
                                    boxShadow: c.bubbleShadow,
                                    marginBottom: 12,
                                }}
                            >
                                {dayLabel}
                            </div>
                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    alignSelf: "flex-start",
                                    maxWidth: "88%",
                                    gap: 2,
                                }}
                            >
                                <div
                                    style={{
                                        position: "relative",
                                        backgroundColor: c.inBubble,
                                        color: c.text,
                                        padding: "6px 7px 8px 9px",
                                        borderRadius: "0 7.5px 7.5px 7.5px",
                                        boxShadow: c.bubbleShadow,
                                        whiteSpace: "pre-line",
                                        wordBreak: "break-word",
                                        ...fonts.message,
                                    }}
                                >
                                    <svg
                                        width="8"
                                        height="13"
                                        viewBox="0 0 8 13"
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            left: -8,
                                            top: 0,
                                            display: "block",
                                        }}
                                    >
                                        <path
                                            d={PATHS.tailIn}
                                            fill={c.inBubble}
                                        />
                                    </svg>
                                    {initialMessage}
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: 64,
                                        }}
                                    />
                                    <span
                                        style={{
                                            position: "absolute",
                                            right: 7,
                                            bottom: 4,
                                            fontSize: 11,
                                            lineHeight: "15px",
                                            color: c.sub,
                                        }}
                                    >
                                        {clockNow()}
                                    </span>
                                </div>
                                {presetMessages &&
                                    presetMessages.map((preset, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                backgroundColor: c.inBubble,
                                                color: quickReplyColor,
                                                borderRadius: 7.5,
                                                padding: "10px 12px",
                                                textAlign: "center",
                                                boxShadow: c.bubbleShadow,
                                                ...fonts.quickReply,
                                            }}
                                        >
                                            {preset.label}
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div
                            style={{
                                backgroundColor: c.bar,
                                padding: "8px 10px",
                                minHeight: 62,
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <svg
                                    width="26"
                                    height="26"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d={PATHS.smile}
                                        fill="none"
                                        stroke={c.icon}
                                        strokeWidth={1.7}
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx="9"
                                        cy="9.8"
                                        r="1.2"
                                        fill={c.icon}
                                    />
                                    <circle
                                        cx="15"
                                        cy="9.8"
                                        r="1.2"
                                        fill={c.icon}
                                    />
                                </svg>
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    backgroundColor: c.field,
                                    borderRadius: 8,
                                    padding: "11px 14px",
                                    fontSize: 15,
                                    color: c.sub,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {placeholderText}
                            </div>
                            <div
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: "50%",
                                    backgroundColor: accentColor,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    width="19"
                                    height="19"
                                    aria-hidden="true"
                                    style={{ marginLeft: 2 }}
                                >
                                    <path d={PATHS.send} fill="#ffffff" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        width: 60,
                        height: 60,
                        backgroundColor: primaryColor,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                        position: "relative",
                    }}
                >
                    {previewOpen ? (
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d={PATHS.close}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth={2.2}
                                strokeLinecap="round"
                            />
                        </svg>
                    ) : (
                        <svg
                            width="34"
                            height="34"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d={PATHS.bubble} fill="#ffffff" />
                            <circle
                                cx="8.2"
                                cy="11.3"
                                r="1.3"
                                fill={primaryColor}
                            />
                            <circle
                                cx="12"
                                cy="11.3"
                                r="1.3"
                                fill={primaryColor}
                            />
                            <circle
                                cx="15.8"
                                cy="11.3"
                                r="1.3"
                                fill={primaryColor}
                            />
                        </svg>
                    )}
                    {!previewOpen && showNotificationBadge && (
                        <div
                            style={{
                                position: "absolute",
                                top: -2,
                                right: -2,
                                backgroundColor: "#ff3b30",
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: "2px solid #ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                color: "#fff",
                                fontWeight: "bold",
                            }}
                        >
                            1
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Live path                                                           */
/* ------------------------------------------------------------------ */

function useOnScreenPermit(ref: React.RefObject<HTMLElement>) {
    const [inView, setInView] = useState(false)
    const [tabAwake, setTabAwake] = useState(true)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const watcher = new IntersectionObserver((entries) => {
            const last = entries[entries.length - 1]
            setInView(!!last && last.isIntersecting)
        })
        watcher.observe(el)
        return () => watcher.disconnect()
    }, [ref])

    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setTabAwake(document.visibilityState !== "hidden")
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])

    return inView && tabAwake
}

function useReducedMotionPref() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const list = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduced(list.matches)
        sync()
        if (list.addEventListener) list.addEventListener("change", sync)
        else list.addListener(sync)
        return () => {
            if (list.removeEventListener)
                list.removeEventListener("change", sync)
            else list.removeListener(sync)
        }
    }, [])
    return reduced
}

type SentNote = { id: number; text: string; at: string }

function LiveChatPopup(props: ChatPopupProps) {
    const {
        phoneNumber,
        accountName,
        accountStatus,
        initialMessage,
        placeholderText,
        dayLabel = "Today",
        position = "right",
        primaryColor,
        headerColor = "#008069",
        accentColor = "#00a884",
        darkMode,
        showNotificationBadge,
        openInNewTab,
        typingDuration,
        presetMessages,
        quickReplyColor,
    } = props
    const fonts = fontsOf(props)
    const avatar = avatarOf(props)

    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState("")
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [phase, setPhase] = useState<"idle" | "typing" | "shown">("idle")
    const [sent, setSent] = useState<SentNote[]>([])
    const [isMobile, setIsMobile] = useState(false)

    const rootRef = useRef<HTMLDivElement>(null)
    const chatRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const threadRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const noteId = useRef(0)

    const permit = useOnScreenPermit(rootRef)
    const reduced = useReducedMotionPref()

    // Detect mobile screen size
    useEffect(() => {
        if (typeof window === "undefined") return
        const checkMobile = () =>
            startTransition(() => setIsMobile(window.innerWidth <= 768))
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Typing intro: runs each time the chat opens, only while visible.
    useEffect(() => {
        if (!isOpen) {
            setPhase("idle")
            return
        }
        if (!permit) return
        if (reduced || typingDuration <= 0) {
            setPhase("shown")
            return
        }
        setPhase((p) => (p === "shown" ? p : "typing"))
        const timer = window.setTimeout(
            () => startTransition(() => setPhase("shown")),
            typingDuration * 1000
        )
        return () => window.clearTimeout(timer)
    }, [isOpen, permit, reduced, typingDuration])

    // Keep the newest bubble in view.
    useEffect(() => {
        const box = threadRef.current
        if (box) box.scrollTop = box.scrollHeight
    }, [phase, sent.length, isOpen])

    // Close chat when clicking outside
    useEffect(() => {
        if (!isOpen || typeof document === "undefined") return
        const handleClickOutside = (event: MouseEvent) => {
            if (
                chatRef.current &&
                buttonRef.current &&
                !chatRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                startTransition(() => {
                    setIsOpen(false)
                    setShowEmojiPicker(false)
                })
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () =>
            document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    const handleSend = () => {
        const text = message.trim()
        if (!text || typeof window === "undefined") return
        const target = buildNumber(
            props.countryCode,
            props.customCountryCode,
            phoneNumber
        )
        const url = `${CHAT_ENDPOINT}${target}?text=${encodeURIComponent(text)}`
        noteId.current += 1
        const note = { id: noteId.current, text, at: clockNow() }
        startTransition(() => {
            setSent((list) => [...list, note])
            setMessage("")
            setShowEmojiPicker(false)
        })
        if (openInNewTab) window.open(url, "_blank", "noopener,noreferrer")
        else window.location.href = url
    }

    const toggleChat = () => {
        startTransition(() => {
            setIsOpen((o) => !o)
            setShowEmojiPicker(false)
        })
    }

    const toggleEmojiPicker = () =>
        startTransition(() => setShowEmojiPicker((v) => !v))

    const insertEmoji = (emoji: string) => {
        startTransition(() => {
            setMessage((prev) => prev + emoji)
            setShowEmojiPicker(false)
        })
        inputRef.current?.focus({ preventScroll: true })
    }

    const handlePresetClick = (presetMessage: string) => {
        startTransition(() => setMessage(presetMessage))
        inputRef.current?.focus({ preventScroll: true })
    }

    const c = palette(darkMode, headerColor)
    const greetingTime = clockNow()
    const canSend = message.trim().length > 0

    // Responsive dimensions
    const chatWidth = isMobile ? "calc(100vw - 32px)" : "370px"
    const chatHeight = isMobile ? "calc(100vh - 120px)" : "540px"
    const chatMaxHeight = isMobile ? "620px" : "540px"
    const bottomPosition = isMobile ? "16px" : "24px"
    const sidePosition = isMobile ? "16px" : "24px"

    return (
        <MotionConfig reducedMotion="user">
            <div
                ref={rootRef}
                style={{
                    position: "fixed",
                    bottom: bottomPosition,
                    [position]: sidePosition,
                    zIndex: 9999,
                    fontFamily: FONT_STACK,
                    display: "flex",
                    flexDirection: "column",
                    alignItems:
                        position === "right" ? "flex-end" : "flex-start",
                }}
            >
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={chatRef}
                            role="dialog"
                            aria-label={`Chat with ${accountName}`}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300,
                            }}
                            style={{
                                width: chatWidth,
                                height: chatHeight,
                                maxHeight: chatMaxHeight,
                                backgroundColor: c.panel,
                                borderRadius: "14px",
                                boxShadow:
                                    "0 18px 48px rgba(11,20,26,0.28), 0 2px 6px rgba(11,20,26,0.12)",
                                display: "flex",
                                flexDirection: "column",
                                overflow: "hidden",
                                marginBottom: "16px",
                                transformOrigin:
                                    position === "right"
                                        ? "bottom right"
                                        : "bottom left",
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    backgroundColor: c.header,
                                    padding: "10px 12px 10px 14px",
                                    minHeight: 62,
                                    boxSizing: "border-box",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={avatar.src}
                                    alt={avatar.alt}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        display: "block",
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4
                                        style={{
                                            margin: 0,
                                            color: c.headerText,
                                            ...fonts.accountName,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {accountName}
                                    </h4>
                                    <AnimatePresence
                                        mode="wait"
                                        initial={false}
                                    >
                                        <motion.p
                                            key={
                                                phase === "typing"
                                                    ? "typing"
                                                    : "status"
                                            }
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                margin: "3px 0 0",
                                                color: c.headerSub,
                                                ...fonts.accountStatus,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {phase === "typing"
                                                ? "typing…"
                                                : accountStatus}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                                <button
                                    onClick={toggleChat}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 0,
                                    }}
                                    aria-label="Close chat"
                                >
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d={PATHS.close}
                                            fill="none"
                                            stroke={c.headerText}
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Thread */}
                            <div
                                ref={threadRef}
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    padding: isMobile
                                        ? "12px 16px"
                                        : "12px 18px",
                                    backgroundColor: c.wall,
                                    backgroundImage: doodleTile(c.doodle),
                                    backgroundSize: "150px 150px",
                                    overflowY: "auto",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        alignSelf: "center",
                                        backgroundColor: c.chip,
                                        color: c.chipText,
                                        fontSize: 12.5,
                                        padding: "5px 12px 6px",
                                        borderRadius: 7.5,
                                        boxShadow: c.bubbleShadow,
                                        marginBottom: 12,
                                        flexShrink: 0,
                                    }}
                                >
                                    {dayLabel}
                                </div>

                                {phase === "typing" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        aria-label="Typing"
                                        style={{
                                            position: "relative",
                                            alignSelf: "flex-start",
                                            backgroundColor: c.inBubble,
                                            padding: "12px 14px",
                                            borderRadius: "0 7.5px 7.5px 7.5px",
                                            boxShadow: c.bubbleShadow,
                                            display: "inline-flex",
                                            gap: "4px",
                                            alignItems: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <svg
                                            width="8"
                                            height="13"
                                            viewBox="0 0 8 13"
                                            aria-hidden="true"
                                            style={{
                                                position: "absolute",
                                                left: -8,
                                                top: 0,
                                                display: "block",
                                            }}
                                        >
                                            <path
                                                d={PATHS.tailIn}
                                                fill={c.inBubble}
                                            />
                                        </svg>
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={
                                                    permit
                                                        ? {
                                                              y: [0, -4, 0],
                                                              opacity: [
                                                                  0.4, 1, 0.4,
                                                              ],
                                                          }
                                                        : { y: 0, opacity: 0.6 }
                                                }
                                                transition={
                                                    permit
                                                        ? {
                                                              duration: 1.1,
                                                              repeat: Infinity,
                                                              delay: i * 0.15,
                                                              ease: "easeInOut",
                                                          }
                                                        : { duration: 0 }
                                                }
                                                style={{
                                                    width: 7,
                                                    height: 7,
                                                    borderRadius: "50%",
                                                    backgroundColor: c.sub,
                                                }}
                                            />
                                        ))}
                                    </motion.div>
                                )}

                                {phase === "shown" && (
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            flexDirection: "column",
                                            alignSelf: "flex-start",
                                            maxWidth: "88%",
                                            gap: 2,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                y: 6,
                                                scale: 0.98,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            transition={{ duration: 0.22 }}
                                            style={{
                                                position: "relative",
                                                backgroundColor: c.inBubble,
                                                color: c.text,
                                                padding: "6px 7px 8px 9px",
                                                borderRadius:
                                                    "0 7.5px 7.5px 7.5px",
                                                boxShadow: c.bubbleShadow,
                                                whiteSpace: "pre-line",
                                                wordBreak: "break-word",
                                                transformOrigin: "0% 0%",
                                                ...fonts.message,
                                            }}
                                        >
                                            <svg
                                                width="8"
                                                height="13"
                                                viewBox="0 0 8 13"
                                                aria-hidden="true"
                                                style={{
                                                    position: "absolute",
                                                    left: -8,
                                                    top: 0,
                                                    display: "block",
                                                }}
                                            >
                                                <path
                                                    d={PATHS.tailIn}
                                                    fill={c.inBubble}
                                                />
                                            </svg>
                                            {initialMessage}
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: 64,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    right: 7,
                                                    bottom: 4,
                                                    fontSize: 11,
                                                    lineHeight: "15px",
                                                    color: c.sub,
                                                }}
                                            >
                                                {greetingTime}
                                            </span>
                                        </motion.div>
                                        {presetMessages &&
                                            presetMessages.map(
                                                (preset, idx) => (
                                                    <motion.button
                                                        key={idx}
                                                        initial={{
                                                            opacity: 0,
                                                            y: 6,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        transition={{
                                                            delay:
                                                                0.15 +
                                                                idx * 0.06,
                                                            duration: 0.2,
                                                        }}
                                                        whileTap={{
                                                            scale: 0.98,
                                                        }}
                                                        onClick={() =>
                                                            handlePresetClick(
                                                                preset.message
                                                            )
                                                        }
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor =
                                                                c.hover
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor =
                                                                c.inBubble
                                                        }}
                                                        style={{
                                                            backgroundColor:
                                                                c.inBubble,
                                                            color: quickReplyColor,
                                                            border: "none",
                                                            borderRadius: 7.5,
                                                            padding:
                                                                "10px 12px",
                                                            cursor: "pointer",
                                                            textAlign: "center",
                                                            boxShadow:
                                                                c.bubbleShadow,
                                                            ...fonts.quickReply,
                                                        }}
                                                    >
                                                        {preset.label}
                                                    </motion.button>
                                                )
                                            )}
                                    </div>
                                )}

                                {sent.map((note) => (
                                    <motion.div
                                        key={note.id}
                                        initial={{
                                            opacity: 0,
                                            y: 8,
                                            scale: 0.98,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.22 }}
                                        style={{
                                            position: "relative",
                                            alignSelf: "flex-end",
                                            maxWidth: "82%",
                                            marginTop: 10,
                                            backgroundColor: c.outBubble,
                                            color: c.text,
                                            padding: "6px 7px 8px 9px",
                                            borderRadius: "7.5px 0 7.5px 7.5px",
                                            boxShadow: c.bubbleShadow,
                                            whiteSpace: "pre-line",
                                            wordBreak: "break-word",
                                            transformOrigin: "100% 0%",
                                            flexShrink: 0,
                                            ...fonts.message,
                                        }}
                                    >
                                        <svg
                                            width="8"
                                            height="13"
                                            viewBox="0 0 8 13"
                                            aria-hidden="true"
                                            style={{
                                                position: "absolute",
                                                right: -8,
                                                top: 0,
                                                display: "block",
                                            }}
                                        >
                                            <path
                                                d={PATHS.tailOut}
                                                fill={c.outBubble}
                                            />
                                        </svg>
                                        {note.text}
                                        <span
                                            style={{
                                                display: "inline-block",
                                                width: 84,
                                            }}
                                        />
                                        <span
                                            style={{
                                                position: "absolute",
                                                right: 7,
                                                bottom: 4,
                                                fontSize: 11,
                                                lineHeight: "15px",
                                                color: c.sub,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 3,
                                            }}
                                        >
                                            {note.at}
                                            <svg
                                                width="16"
                                                height="15"
                                                viewBox="0 0 16 15"
                                                aria-hidden="true"
                                                style={{ display: "block" }}
                                            >
                                                <path
                                                    d={PATHS.ticks}
                                                    fill="none"
                                                    stroke={c.tick}
                                                    strokeWidth={1.6}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Composer */}
                            <div
                                style={{
                                    backgroundColor: c.bar,
                                    padding: "8px 10px",
                                    minHeight: 62,
                                    boxSizing: "border-box",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    position: "relative",
                                    flexShrink: 0,
                                }}
                            >
                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            transition={{ duration: 0.16 }}
                                            style={{
                                                position: "absolute",
                                                bottom: "100%",
                                                left: 10,
                                                right: 10,
                                                marginBottom: 8,
                                                backgroundColor: c.panel,
                                                borderRadius: 10,
                                                boxShadow:
                                                    "0 6px 24px rgba(11,20,26,0.22)",
                                                padding: 12,
                                                maxHeight: 260,
                                                overflowY: "auto",
                                                zIndex: 10,
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            {EMOJI_GROUPS.map((group, gIdx) => (
                                                <div
                                                    key={group.title}
                                                    style={{
                                                        marginBottom:
                                                            gIdx <
                                                            EMOJI_GROUPS.length -
                                                                1
                                                                ? 10
                                                                : 0,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 500,
                                                            color: c.sub,
                                                            margin: "0 2px 6px",
                                                        }}
                                                    >
                                                        {group.title}
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: "grid",
                                                            gridTemplateColumns:
                                                                "repeat(8, 1fr)",
                                                            gap: 2,
                                                        }}
                                                    >
                                                        {group.items.map(
                                                            (emoji, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() =>
                                                                        insertEmoji(
                                                                            emoji
                                                                        )
                                                                    }
                                                                    style={{
                                                                        background:
                                                                            "none",
                                                                        border: "none",
                                                                        fontSize: 24,
                                                                        lineHeight:
                                                                            "34px",
                                                                        height: 38,
                                                                        cursor: "pointer",
                                                                        padding: 0,
                                                                        borderRadius: 6,
                                                                        transition:
                                                                            "background 0.15s",
                                                                    }}
                                                                    onMouseEnter={(
                                                                        e
                                                                    ) => {
                                                                        e.currentTarget.style.backgroundColor =
                                                                            c.hover
                                                                    }}
                                                                    onMouseLeave={(
                                                                        e
                                                                    ) => {
                                                                        e.currentTarget.style.backgroundColor =
                                                                            "transparent"
                                                                    }}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={toggleEmojiPicker}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        width: 36,
                                        height: 36,
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                    aria-label="Emoji picker"
                                    aria-expanded={showEmojiPicker}
                                >
                                    <svg
                                        width="26"
                                        height="26"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d={PATHS.smile}
                                            fill="none"
                                            stroke={
                                                showEmojiPicker
                                                    ? accentColor
                                                    : c.icon
                                            }
                                            strokeWidth={1.7}
                                            strokeLinecap="round"
                                        />
                                        <circle
                                            cx="9"
                                            cy="9.8"
                                            r="1.2"
                                            fill={
                                                showEmojiPicker
                                                    ? accentColor
                                                    : c.icon
                                            }
                                        />
                                        <circle
                                            cx="15"
                                            cy="9.8"
                                            r="1.2"
                                            fill={
                                                showEmojiPicker
                                                    ? accentColor
                                                    : c.icon
                                            }
                                        />
                                    </svg>
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={message}
                                    onChange={(e) => {
                                        const v = e.target.value
                                        startTransition(() => setMessage(v))
                                    }}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handleSend()
                                    }
                                    placeholder={placeholderText}
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        backgroundColor: c.field,
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "11px 14px",
                                        fontSize: 15,
                                        fontFamily: "inherit",
                                        color: c.text,
                                        outline: "none",
                                    }}
                                    aria-label="Message input"
                                />
                                <motion.button
                                    onClick={handleSend}
                                    disabled={!canSend}
                                    whileTap={
                                        canSend ? { scale: 0.92 } : undefined
                                    }
                                    animate={{
                                        opacity: canSend ? 1 : 0.55,
                                        scale: canSend ? 1 : 0.94,
                                    }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: "50%",
                                        backgroundColor: accentColor,
                                        border: "none",
                                        cursor: canSend ? "pointer" : "default",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        padding: 0,
                                    }}
                                    aria-label="Send message"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="19"
                                        height="19"
                                        aria-hidden="true"
                                        style={{ marginLeft: 2 }}
                                    >
                                        <path d={PATHS.send} fill="#ffffff" />
                                    </svg>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    ref={buttonRef}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleChat}
                    style={{
                        width: isMobile ? "56px" : "60px",
                        height: isMobile ? "56px" : "60px",
                        backgroundColor: primaryColor,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                        position: "relative",
                        padding: 0,
                    }}
                    aria-label={isOpen ? "Close chat" : "Open chat"}
                    aria-expanded={isOpen}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.span
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                style={{ display: "flex" }}
                            >
                                <svg
                                    width="26"
                                    height="26"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d={PATHS.close}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth={2.2}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </motion.span>
                        ) : (
                            <motion.div
                                key="chat"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                style={{ display: "flex" }}
                            >
                                <svg
                                    width={isMobile ? "30" : "34"}
                                    height={isMobile ? "30" : "34"}
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d={PATHS.bubble} fill="#ffffff" />
                                    <circle
                                        cx="8.2"
                                        cy="11.3"
                                        r="1.3"
                                        fill={primaryColor}
                                    />
                                    <circle
                                        cx="12"
                                        cy="11.3"
                                        r="1.3"
                                        fill={primaryColor}
                                    />
                                    <circle
                                        cx="15.8"
                                        cy="11.3"
                                        r="1.3"
                                        fill={primaryColor}
                                    />
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isOpen && showNotificationBadge && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                                position: "absolute",
                                top: "-2px",
                                right: "-2px",
                                backgroundColor: "#ff3b30",
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                border: "2px solid #ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                color: "#fff",
                                fontWeight: "bold",
                            }}
                        >
                            1
                        </motion.div>
                    )}
                </motion.button>
            </div>
        </MotionConfig>
    )
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(Missive, {
    countryCode: {
        type: ControlType.Enum,
        title: "Country",
        options: COUNTRY_CODES.map(([code]) => code),
        optionTitles: COUNTRY_CODES.map(([, label]) => label),
        defaultValue: "91",
        description:
            "Pick the country of the number that should receive the chats.",
    },
    customCountryCode: {
        type: ControlType.String,
        title: "Country Code",
        defaultValue: "",
        placeholder: "e.g. 351",
        description: "Digits only, without the + sign.",
        hidden: (p: any) => p.countryCode !== "custom",
    },
    phoneNumber: {
        type: ControlType.String,
        title: "Phone Number",
        defaultValue: "98765 43210",
        placeholder: "98765 43210",
        description:
            "Your number without the country code. Spaces, dashes and a leading 0 are fine — they're cleaned up automatically. Test it in Preview or on the live site.",
    },
    accountName: {
        type: ControlType.String,
        title: "Account Name",
        defaultValue: "Studio Team",
    },
    accountStatus: {
        type: ControlType.String,
        title: "Status",
        defaultValue: "online",
    },
    profileImage: {
        type: ControlType.ResponsiveImage,
        title: "Profile Image",
    },
    profileImageUrl: {
        type: ControlType.String,
        title: "Image URL",
        defaultValue: "",
        placeholder: "https://…",
    },
    initialMessage: {
        type: ControlType.String,
        title: "Initial Message",
        defaultValue:
            "Hi there! 👋\n\nPlanning a new website, app or product design? Tell us what you're working on and we'll get back to you with ideas, timelines and pricing.",
        displayTextArea: true,
    },
    presetMessages: {
        type: ControlType.Array,
        title: "Quick Replies",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Button Label",
                    defaultValue: "Start a project",
                },
                message: {
                    type: ControlType.String,
                    title: "Message",
                    defaultValue:
                        "Hi! I'd like to talk about a new design project.",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                label: "🌐 Website design",
                message:
                    "Hi! I'm looking for a new website design. Can we talk about my project?",
            },
            {
                label: "📱 App & product design",
                message:
                    "Hi! I need UI/UX design for an app or digital product. Can you help?",
            },
            {
                label: "💰 Pricing & timelines",
                message:
                    "Hi! Could you share your pricing and typical timelines for a design project?",
            },
            {
                label: "🗂️ See your portfolio",
                message: "Hi! I'd love to see some of your recent design work.",
            },
        ],
        maxCount: 5,
    },
    placeholderText: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Type a message",
    },
    dayLabel: {
        type: ControlType.String,
        title: "Day Label",
        defaultValue: "Today",
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#25D366",
    },
    headerColor: {
        type: ControlType.Color,
        title: "Header Color",
        defaultValue: "#008069",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Send Color",
        defaultValue: "#00A884",
    },
    quickReplyColor: {
        type: ControlType.Color,
        title: "Quick Reply Color",
        defaultValue: "#027EB5",
    },
    darkMode: {
        type: ControlType.Boolean,
        title: "Dark Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showNotificationBadge: {
        type: ControlType.Boolean,
        title: "Notification Badge",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open Link In",
        defaultValue: true,
        enabledTitle: "New Tab",
        disabledTitle: "Same Tab",
    },
    typingDuration: {
        type: ControlType.Number,
        title: "Typing Duration",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "s",
        displayStepper: false,
    },
    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        controls: {
            accountName: {
                type: ControlType.Font,
                title: "Account Name",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Medium",
                    letterSpacing: "0em",
                    lineHeight: "1.2em",
                },
            },
            accountStatus: {
                type: ControlType.Font,
                title: "Status",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "13px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.2em",
                },
            },
            message: {
                type: ControlType.Font,
                title: "Message",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14.2px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.35em",
                },
            },
            quickReply: {
                type: ControlType.Font,
                title: "Quick Reply",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "0em",
                    lineHeight: "1.2em",
                },
            },
        },
    },
    previewOpen: {
        type: ControlType.Boolean,
        title: "Canvas Preview",
        defaultValue: true,
        enabledTitle: "Open",
        disabledTitle: "Closed",
    },
})
