import * as React from "react"
import { useEffect, useId, useReducer, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, MotionConfig } from "framer-motion"

const DM_BASE = "https://ig.me/m/"
const PROFILE_BASE = "https://ig.me/"
const FALLBACK_AVATAR =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop&q=80"
const TYPE_STACK =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const ICON = {
    close: "M6 6l12 12M18 6 6 18",
    plane: "M20.5 3.5 3.5 9.7l7.1 3.7 3.7 7.1L20.5 3.5ZM10.6 13.4l9.9-9.9",
    smile: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-3.8 11.2c.95 1.4 2.25 2.1 3.8 2.1s2.85-.7 3.8-2.1",
}

const EMOJI =
    "😀 😂 😍 🥹 😊 😎 🤩 🥳 🤔 😮 🙌 👏 🙏 👍 👋 🫶 ❤️ 🔥 ✨ 💯 🎨 ✏️ 📐 🖌️ 💻 📱 🖥️ 🧩 💡 🚀 🎯 📅".split(
        " "
    )

type Shade = {
    panel: string
    line: string
    ink: string
    sub: string
    inBubble: string
    chipLine: string
    soft: string
    toast: string
    toastInk: string
}

const shadeFor = (dark: boolean): Shade =>
    dark
        ? {
              panel: "#000000",
              line: "#262626",
              ink: "#f5f5f5",
              sub: "#a8a8a8",
              inBubble: "#262626",
              chipLine: "#363636",
              soft: "#262626",
              toast: "#f5f5f5",
              toastInk: "#000000",
          }
        : {
              panel: "#ffffff",
              line: "#dbdbdb",
              ink: "#000000",
              sub: "#737373",
              inBubble: "#efefef",
              chipLine: "#dbdbdb",
              soft: "#efefef",
              toast: "#262626",
              toastInk: "#ffffff",
          }

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

type Chip = { label?: string; message?: string }

interface BilletProps {
    username?: string
    displayName?: string
    activity?: string
    tagline?: string
    avatar?: { src?: string; alt?: string }
    avatarUrl?: string
    profileButton?: string
    greetings?: string[]
    chips?: Chip[]
    placeholder?: string
    sendLabel?: string
    stampLabel?: string
    seenLabel?: string
    copiedToast?: string
    side?: "left" | "right"
    theme?: "light" | "dark"
    ringFrom?: string
    ringVia?: string
    ringTo?: string
    outFrom?: string
    outTo?: string
    sendColor?: string
    badge?: boolean
    typingFor?: number
    newTab?: boolean
    font?: React.CSSProperties
    canvasOpen?: boolean
    style?: React.CSSProperties
}

function resolve(p: BilletProps) {
    const handle = String(p.username ?? "")
        .replace(/^@+/, "")
        .trim()
    return {
        handle,
        name: p.displayName ?? "Studio Team",
        activity: p.activity ?? "Active now",
        tagline: p.tagline ?? "Design studio",
        face: p.avatar?.src || p.avatarUrl || FALLBACK_AVATAR,
        faceAlt: p.avatar?.alt || p.displayName || "Profile",
        profileButton: p.profileButton ?? "View profile",
        greetings: (p.greetings ?? []).filter((g) => g && g.trim()),
        chips: (p.chips ?? []).filter((c) => c && c.label),
        placeholder: p.placeholder ?? "Message…",
        sendLabel: p.sendLabel ?? "Send",
        stampLabel: p.stampLabel ?? "Today",
        seenLabel: p.seenLabel ?? "Seen",
        copiedToast: p.copiedToast ?? "Message copied — paste it in the chat",
        side: (p.side === "left" ? "left" : "right") as "left" | "right",
        shade: shadeFor(p.theme === "dark"),
        ring: `linear-gradient(45deg, ${p.ringFrom ?? "#FEDA75"}, ${p.ringVia ?? "#D62976"}, ${p.ringTo ?? "#4F5BD5"})`,
        outFill: `linear-gradient(180deg, ${p.outFrom ?? "#A033FF"}, ${p.outTo ?? "#3797F0"})`,
        outTo: p.outTo ?? "#3797F0",
        sendColor: p.sendColor ?? "#0095F6",
        badge: p.badge ?? true,
        typingFor: Math.max(0, p.typingFor ?? 1.4),
        newTab: p.newTab ?? true,
        font: p.font ?? {},
        canvasOpen: p.canvasOpen ?? true,
        style: p.style,
    }
}

const timeNow = () => {
    try {
        return new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        })
    } catch {
        return ""
    }
}

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
export default function Billet(props: BilletProps) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <BilletStill {...props} />
    return <BilletLive {...props} />
}

/* ------------------------------------------------------------------ */
/* Static path — plain divs, nothing running                          */
/* ------------------------------------------------------------------ */

function BilletStill(props: BilletProps) {
    const r = resolve(props)
    const s = r.shade
    const open = r.canvasOpen

    return (
        <div
            style={{
                ...r.style,
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
                    [r.side]: 24,
                    fontFamily: TYPE_STACK,
                    ...r.font,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: r.side === "right" ? "flex-end" : "flex-start",
                    pointerEvents: "auto",
                }}
            >
                {open && (
                    <div
                        style={{
                            width: 360,
                            height: 560,
                            marginBottom: 16,
                            background: s.panel,
                            color: s.ink,
                            borderRadius: 18,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow:
                                "0 20px 50px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "12px 12px 12px 16px",
                                borderBottom: `1px solid ${s.line}`,
                            }}
                        >
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    padding: 2,
                                    background: r.ring,
                                    boxSizing: "border-box",
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={r.face}
                                    alt={r.faceAlt}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        display: "block",
                                        border: `2px solid ${s.panel}`,
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        fontSize: "0.95em",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {r.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: "0.78em",
                                        color: s.sub,
                                        marginTop: 1,
                                    }}
                                >
                                    {r.activity}
                                </div>
                            </div>
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
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
                                        d={ICON.close}
                                        fill="none"
                                        stroke={s.ink}
                                        strokeWidth={1.9}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div
                            style={{
                                flex: 1,
                                padding: "18px 14px 10px",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                    marginBottom: 18,
                                }}
                            >
                                <img
                                    src={r.face}
                                    alt={r.faceAlt}
                                    style={{
                                        width: 76,
                                        height: 76,
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                                <div
                                    style={{
                                        fontWeight: 600,
                                        fontSize: "1.05em",
                                        marginTop: 10,
                                    }}
                                >
                                    {r.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: "0.82em",
                                        color: s.sub,
                                        marginTop: 2,
                                    }}
                                >
                                    {r.handle ? `${r.handle} · ` : ""}
                                    {r.tagline}
                                </div>
                                <div
                                    style={{
                                        marginTop: 10,
                                        padding: "6px 14px",
                                        borderRadius: 8,
                                        background: s.soft,
                                        fontSize: "0.82em",
                                        fontWeight: 600,
                                    }}
                                >
                                    {r.profileButton}
                                </div>
                            </div>
                            <div
                                style={{
                                    alignSelf: "center",
                                    fontSize: "0.75em",
                                    color: s.sub,
                                    marginBottom: 10,
                                }}
                            >
                                {r.stampLabel} {timeNow()}
                            </div>
                            {r.greetings.map((g, i) => {
                                const last = i === r.greetings.length - 1
                                const first = i === 0
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-end",
                                            gap: 8,
                                            marginTop: first ? 0 : 2,
                                        }}
                                    >
                                        <div
                                            style={{ width: 28, flexShrink: 0 }}
                                        >
                                            {last && (
                                                <img
                                                    src={r.face}
                                                    alt=""
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        display: "block",
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                maxWidth: "74%",
                                                padding: "8px 12px",
                                                background: s.inBubble,
                                                borderRadius: `${first ? 22 : 6}px 22px 22px ${last ? 22 : 6}px`,
                                                fontSize: "0.94em",
                                                lineHeight: 1.35,
                                                whiteSpace: "pre-line",
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {g}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {r.chips.length > 0 && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    padding: "4px 12px 6px",
                                    overflow: "hidden",
                                }}
                            >
                                {r.chips.map((c, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            flexShrink: 0,
                                            padding: "7px 14px",
                                            borderRadius: 18,
                                            border: `1px solid ${s.chipLine}`,
                                            fontSize: "0.84em",
                                            fontWeight: 500,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {c.label}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ padding: "6px 12px 12px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    height: 44,
                                    padding: "0 16px 0 10px",
                                    borderRadius: 22,
                                    border: `1px solid ${s.line}`,
                                    boxSizing: "border-box",
                                }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d={ICON.smile}
                                        fill="none"
                                        stroke={s.ink}
                                        strokeWidth={1.7}
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx="9"
                                        cy="9.8"
                                        r="1.2"
                                        fill={s.ink}
                                    />
                                    <circle
                                        cx="15"
                                        cy="9.8"
                                        r="1.2"
                                        fill={s.ink}
                                    />
                                </svg>
                                <div
                                    style={{
                                        flex: 1,
                                        color: s.sub,
                                        fontSize: "0.94em",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {r.placeholder}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        position: "relative",
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: r.ring,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 22px rgba(214,41,118,0.32)",
                    }}
                >
                    {open ? (
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d={ICON.close}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth={2.2}
                                strokeLinecap="round"
                            />
                        </svg>
                    ) : (
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d={ICON.plane}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth={1.9}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                        </svg>
                    )}
                    {!open && r.badge && (
                        <div
                            style={{
                                position: "absolute",
                                top: -2,
                                right: -2,
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: "#FF3040",
                                border: "2px solid #ffffff",
                                color: "#ffffff",
                                fontSize: 10,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
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

function useVisiblePermit(ref: React.RefObject<HTMLElement>) {
    const [seen, setSeen] = useState(false)
    const [awake, setAwake] = useState(true)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setSeen(true)
            return
        }
        const io = new IntersectionObserver((entries) => {
            const e = entries[entries.length - 1]
            setSeen(!!e && e.isIntersecting)
        })
        io.observe(el)
        return () => io.disconnect()
    }, [ref])
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setAwake(document.visibilityState !== "hidden")
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    return seen && awake
}

function useCalmMotion() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(q.matches)
        sync()
        if (q.addEventListener) q.addEventListener("change", sync)
        else q.addListener(sync)
        return () => {
            if (q.removeEventListener) q.removeEventListener("change", sync)
            else q.removeListener(sync)
        }
    }, [])
    return calm
}

function useNarrow(limit: number) {
    const [narrow, setNarrow] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const sync = () => setNarrow(window.innerWidth <= limit)
        sync()
        window.addEventListener("resize", sync)
        return () => window.removeEventListener("resize", sync)
    }, [limit])
    return narrow
}

type Line = { id: number; from: "them" | "me"; text: string }
type Convo = { shown: number; lines: Line[]; nextId: number }
type ConvoMove =
    | { type: "greet"; text: string }
    | { type: "say"; text: string }
    | { type: "restart" }

function convoReducer(state: Convo, move: ConvoMove): Convo {
    if (move.type === "greet")
        return {
            shown: state.shown + 1,
            nextId: state.nextId + 1,
            lines: [
                ...state.lines,
                { id: state.nextId, from: "them", text: move.text },
            ],
        }
    if (move.type === "say")
        return {
            ...state,
            nextId: state.nextId + 1,
            lines: [
                ...state.lines,
                { id: state.nextId, from: "me", text: move.text },
            ],
        }
    return { shown: 0, lines: [], nextId: state.nextId }
}

function copyText(text: string) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(() => undefined)
            return
        }
    } catch {
        /* fall through */
    }
    try {
        const area = document.createElement("textarea")
        area.value = text
        area.setAttribute("readonly", "")
        area.style.position = "fixed"
        area.style.opacity = "0"
        document.body.appendChild(area)
        area.select()
        document.execCommand("copy")
        document.body.removeChild(area)
    } catch {
        /* clipboard unavailable — the DM still opens */
    }
}

function BilletLive(props: BilletProps) {
    const r = resolve(props)
    const s = r.shade
    const scope = "bt" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const rootRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const launcherRef = useRef<HTMLButtonElement>(null)
    const threadRef = useRef<HTMLDivElement>(null)
    const fieldRef = useRef<HTMLInputElement>(null)

    const permit = useVisiblePermit(rootRef)
    const calm = useCalmMotion()
    const narrow = useNarrow(768)

    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState("")
    const [picker, setPicker] = useState(false)
    const [typing, setTyping] = useState(false)
    const [toast, setToast] = useState(false)
    const [badgeGone, setBadgeGone] = useState(false)
    const [convo, act] = useReducer(convoReducer, {
        shown: 0,
        lines: [],
        nextId: 1,
    })

    const greetKey = r.greetings.join("\u0001")
    useEffect(() => act({ type: "restart" }), [greetKey])

    // Greeting reveal — one bubble at a time, only while open and visible.
    useEffect(() => {
        if (!open || !permit || convo.shown >= r.greetings.length) {
            setTyping(false)
            return
        }
        setTyping(!calm)
        const t = window.setTimeout(
            () => act({ type: "greet", text: r.greetings[convo.shown] }),
            calm ? 0 : r.typingFor * 1000 * (convo.shown === 0 ? 1 : 0.75)
        )
        return () => window.clearTimeout(t)
    }, [open, permit, convo.shown, greetKey, r.typingFor, calm])

    // Toast auto-hide.
    useEffect(() => {
        if (!toast || !permit) return
        const t = window.setTimeout(() => setToast(false), 3200)
        return () => window.clearTimeout(t)
    }, [toast, permit])

    useEffect(() => {
        const box = threadRef.current
        if (box) box.scrollTop = box.scrollHeight
    }, [convo.lines.length, typing, open])

    // Click outside + Escape close the panel.
    useEffect(() => {
        if (!open || typeof document === "undefined") return
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node
            if (
                panelRef.current &&
                launcherRef.current &&
                !panelRef.current.contains(t) &&
                !launcherRef.current.contains(t)
            ) {
                setOpen(false)
                setPicker(false)
            }
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false)
                setPicker(false)
            }
        }
        document.addEventListener("mousedown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousedown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    const toggle = () => {
        setOpen((o) => !o)
        setPicker(false)
        setBadgeGone(true)
    }

    const openUrl = (url: string) => {
        if (typeof window === "undefined") return
        if (r.newTab) window.open(url, "_blank", "noopener,noreferrer")
        else window.location.href = url
    }

    const send = () => {
        const text = draft.trim()
        if (!text) return
        act({ type: "say", text })
        setDraft("")
        setPicker(false)
        copyText(text)
        setToast(true)
        openUrl(DM_BASE + encodeURIComponent(r.handle))
    }

    const pickChip = (c: Chip) => {
        setDraft(c.message || c.label || "")
        fieldRef.current?.focus({ preventScroll: true })
    }

    const addEmoji = (e: string) => {
        setDraft((d) => d + e)
        fieldRef.current?.focus({ preventScroll: true })
    }

    const lines = convo.lines
    const lastMine = (() => {
        for (let i = lines.length - 1; i >= 0; i--)
            if (lines[i].from === "me") return lines[i].id
        return -1
    })()
    const ready = draft.trim().length > 0
    const flick = calm
        ? { duration: 0 }
        : {
              duration: 0.22,
              ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
          }
    const bounce = calm
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 380, damping: 30 }

    const sheet = `
@keyframes ${scope}-pulse { 0%, 70%, 100% { opacity: .35; transform: scale(.85) } 35% { opacity: 1; transform: scale(1) } }
.${scope}-field::placeholder { color: ${s.sub}; opacity: 1 }
.${scope}-chips { scrollbar-width: none }
.${scope}-chips::-webkit-scrollbar { display: none }
.${scope}-thread { scrollbar-width: thin; scrollbar-color: ${s.line} transparent }
.${scope}-hit:focus-visible { outline: 2px solid ${r.sendColor}; outline-offset: 2px }
.${scope}-chip:hover { background: ${s.soft} }
.${scope}-emo:hover { background: ${s.soft} }
`

    const bare: React.CSSProperties = {
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        WebkitTapHighlightColor: "transparent",
    }

    return (
        <MotionConfig reducedMotion="user">
            <style>{sheet}</style>
            <div
                ref={rootRef}
                style={{
                    position: "fixed",
                    bottom: narrow ? 16 : 24,
                    [r.side]: narrow ? 16 : 24,
                    zIndex: 9999,
                    fontFamily: TYPE_STACK,
                    ...r.font,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: r.side === "right" ? "flex-end" : "flex-start",
                }}
            >
                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={panelRef}
                            role="dialog"
                            aria-label={`Message ${r.name}`}
                            initial={{ opacity: 0, y: 18, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{
                                opacity: 0,
                                y: 14,
                                scale: 0.96,
                                transition: calm
                                    ? { duration: 0 }
                                    : { duration: 0.16 },
                            }}
                            transition={bounce}
                            style={{
                                width: narrow ? "calc(100vw - 32px)" : 360,
                                height: narrow
                                    ? "min(620px, calc(100vh - 110px))"
                                    : "min(560px, calc(100vh - 120px))",
                                marginBottom: 16,
                                background: s.panel,
                                color: s.ink,
                                borderRadius: 18,
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                position: "relative",
                                transformOrigin:
                                    r.side === "right"
                                        ? "100% 100%"
                                        : "0% 100%",
                                boxShadow:
                                    "0 20px 50px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)",
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "12px 12px 12px 16px",
                                    borderBottom: `1px solid ${s.line}`,
                                    flexShrink: 0,
                                }}
                            >
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        padding: 2,
                                        background: r.ring,
                                        boxSizing: "border-box",
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src={r.face}
                                        alt={r.faceAlt}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            display: "block",
                                            border: `2px solid ${s.panel}`,
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: "0.95em",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {r.name}
                                    </div>
                                    <AnimatePresence
                                        mode="wait"
                                        initial={false}
                                    >
                                        <motion.div
                                            key={typing ? "t" : "a"}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.14 }}
                                            style={{
                                                fontSize: "0.78em",
                                                color: s.sub,
                                                marginTop: 1,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {typing ? "Typing…" : r.activity}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                <button
                                    type="button"
                                    className={`${scope}-hit`}
                                    aria-label="Close"
                                    onClick={toggle}
                                    style={{
                                        ...bare,
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
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
                                            d={ICON.close}
                                            fill="none"
                                            stroke={s.ink}
                                            strokeWidth={1.9}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Thread */}
                            <div
                                ref={threadRef}
                                className={`${scope}-thread`}
                                aria-live="polite"
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflowY: "auto",
                                    padding: "18px 14px 10px",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        textAlign: "center",
                                        marginBottom: 18,
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src={r.face}
                                        alt={r.faceAlt}
                                        draggable={false}
                                        style={{
                                            width: 76,
                                            height: 76,
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: "1.05em",
                                            marginTop: 10,
                                        }}
                                    >
                                        {r.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.82em",
                                            color: s.sub,
                                            marginTop: 2,
                                        }}
                                    >
                                        {r.handle ? `${r.handle} · ` : ""}
                                        {r.tagline}
                                    </div>
                                    <motion.button
                                        type="button"
                                        className={`${scope}-hit`}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() =>
                                            openUrl(
                                                PROFILE_BASE +
                                                    encodeURIComponent(r.handle)
                                            )
                                        }
                                        style={{
                                            ...bare,
                                            marginTop: 10,
                                            padding: "6px 14px",
                                            borderRadius: 8,
                                            background: s.soft,
                                            fontSize: "0.82em",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {r.profileButton}
                                    </motion.button>
                                </div>

                                <div
                                    style={{
                                        alignSelf: "center",
                                        fontSize: "0.75em",
                                        color: s.sub,
                                        marginBottom: 10,
                                        flexShrink: 0,
                                    }}
                                >
                                    {r.stampLabel} {timeNow()}
                                </div>

                                {lines.map((line, i) => {
                                    const prev = lines[i - 1]
                                    const next = lines[i + 1]
                                    const opens =
                                        !prev || prev.from !== line.from
                                    const closes =
                                        (!next || next.from !== line.from) &&
                                        !(
                                            line.from === "them" &&
                                            typing &&
                                            !next
                                        )
                                    const mine = line.from === "me"
                                    const radius = mine
                                        ? `22px ${opens ? 22 : 6}px ${closes ? 22 : 6}px 22px`
                                        : `${opens ? 22 : 6}px 22px 22px ${closes ? 22 : 6}px`
                                    return (
                                        <motion.div
                                            key={line.id}
                                            initial={{
                                                opacity: 0,
                                                y: 8,
                                                scale: 0.97,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            transition={flick}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: mine
                                                    ? "flex-end"
                                                    : "flex-start",
                                                marginTop:
                                                    i === 0
                                                        ? 0
                                                        : opens
                                                          ? 10
                                                          : 2,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-end",
                                                    gap: 8,
                                                    width: "100%",
                                                    justifyContent: mine
                                                        ? "flex-end"
                                                        : "flex-start",
                                                }}
                                            >
                                                {!mine && (
                                                    <div
                                                        style={{
                                                            width: 28,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {closes && (
                                                            <img
                                                                src={r.face}
                                                                alt=""
                                                                draggable={
                                                                    false
                                                                }
                                                                style={{
                                                                    width: 28,
                                                                    height: 28,
                                                                    borderRadius:
                                                                        "50%",
                                                                    objectFit:
                                                                        "cover",
                                                                    display:
                                                                        "block",
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        maxWidth: mine
                                                            ? "78%"
                                                            : "74%",
                                                        padding: "8px 12px",
                                                        background: mine
                                                            ? r.outFill
                                                            : s.inBubble,
                                                        color: mine
                                                            ? "#ffffff"
                                                            : s.ink,
                                                        borderRadius: radius,
                                                        fontSize: "0.94em",
                                                        lineHeight: 1.35,
                                                        whiteSpace: "pre-line",
                                                        wordBreak: "break-word",
                                                    }}
                                                >
                                                    {line.text}
                                                </div>
                                            </div>
                                            {mine && line.id === lastMine && (
                                                <div
                                                    style={{
                                                        fontSize: "0.72em",
                                                        color: s.sub,
                                                        marginTop: 4,
                                                        marginRight: 4,
                                                    }}
                                                >
                                                    {r.seenLabel}
                                                </div>
                                            )}
                                        </motion.div>
                                    )
                                })}

                                <AnimatePresence>
                                    {typing && (
                                        <motion.div
                                            key="typing"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{
                                                opacity: 0,
                                                transition: { duration: 0.08 },
                                            }}
                                            transition={flick}
                                            aria-label="Typing"
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-end",
                                                gap: 8,
                                                marginTop: lines.length ? 2 : 0,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <img
                                                src={r.face}
                                                alt=""
                                                draggable={false}
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 4,
                                                    padding: "12px 14px",
                                                    background: s.inBubble,
                                                    borderRadius: lines.length
                                                        ? "6px 22px 22px 22px"
                                                        : 22,
                                                }}
                                            >
                                                {[0, 1, 2].map((n) => (
                                                    <span
                                                        key={n}
                                                        style={{
                                                            width: 7,
                                                            height: 7,
                                                            borderRadius: "50%",
                                                            background: s.sub,
                                                            animation: `${scope}-pulse 1.2s ${n * 0.18}s infinite ease-in-out`,
                                                            animationPlayState:
                                                                permit && !calm
                                                                    ? "running"
                                                                    : "paused",
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Toast */}
                            <AnimatePresence>
                                {toast && (
                                    <motion.div
                                        key="toast"
                                        role="status"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        transition={flick}
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            bottom: r.chips.length ? 118 : 74,
                                            x: "-50%",
                                            padding: "8px 14px",
                                            borderRadius: 999,
                                            background: s.toast,
                                            color: s.toastInk,
                                            fontSize: "0.8em",
                                            fontWeight: 500,
                                            whiteSpace: "nowrap",
                                            zIndex: 5,
                                            boxShadow:
                                                "0 6px 18px rgba(0,0,0,0.2)",
                                        }}
                                    >
                                        {r.copiedToast}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Emoji tray */}
                            <AnimatePresence initial={false}>
                                {picker && (
                                    <motion.div
                                        key="tray"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={flick}
                                        style={{
                                            overflow: "hidden",
                                            borderTop: `1px solid ${s.line}`,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns:
                                                    "repeat(8, 1fr)",
                                                gap: 2,
                                                padding: "10px 10px 4px",
                                            }}
                                        >
                                            {EMOJI.map((e, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className={`${scope}-hit ${scope}-emo`}
                                                    onClick={() => addEmoji(e)}
                                                    style={{
                                                        ...bare,
                                                        height: 36,
                                                        borderRadius: 8,
                                                        fontSize: 22,
                                                        lineHeight: "36px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {e}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Chips */}
                            {r.chips.length > 0 && (
                                <div
                                    className={`${scope}-chips`}
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        padding: "6px 12px 6px",
                                        overflowX: "auto",
                                        flexShrink: 0,
                                    }}
                                >
                                    {r.chips.map((c, i) => (
                                        <motion.button
                                            key={i}
                                            type="button"
                                            className={`${scope}-hit ${scope}-chip`}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={
                                                calm
                                                    ? { duration: 0 }
                                                    : {
                                                          delay: 0.05 * i,
                                                          duration: 0.2,
                                                      }
                                            }
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => pickChip(c)}
                                            style={{
                                                ...bare,
                                                flexShrink: 0,
                                                padding: "7px 14px",
                                                borderRadius: 18,
                                                border: `1px solid ${s.chipLine}`,
                                                fontSize: "0.84em",
                                                fontWeight: 500,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {c.label}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {/* Composer */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    send()
                                }}
                                style={{
                                    padding: "6px 12px 12px",
                                    flexShrink: 0,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        height: 44,
                                        padding: "0 16px 0 10px",
                                        borderRadius: 22,
                                        border: `1px solid ${s.line}`,
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <button
                                        type="button"
                                        className={`${scope}-hit`}
                                        aria-label={
                                            picker ? "Hide emoji" : "Show emoji"
                                        }
                                        aria-expanded={picker}
                                        onClick={() => setPicker((v) => !v)}
                                        style={{
                                            ...bare,
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d={ICON.smile}
                                                fill="none"
                                                stroke={
                                                    picker ? r.sendColor : s.ink
                                                }
                                                strokeWidth={1.7}
                                                strokeLinecap="round"
                                            />
                                            <circle
                                                cx="9"
                                                cy="9.8"
                                                r="1.2"
                                                fill={
                                                    picker ? r.sendColor : s.ink
                                                }
                                            />
                                            <circle
                                                cx="15"
                                                cy="9.8"
                                                r="1.2"
                                                fill={
                                                    picker ? r.sendColor : s.ink
                                                }
                                            />
                                        </svg>
                                    </button>
                                    <input
                                        ref={fieldRef}
                                        className={`${scope}-field`}
                                        type="text"
                                        value={draft}
                                        placeholder={r.placeholder}
                                        aria-label="Message"
                                        onChange={(e) =>
                                            setDraft(e.target.value)
                                        }
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            border: "none",
                                            outline: "none",
                                            background: "transparent",
                                            color: s.ink,
                                            font: "inherit",
                                            fontSize: "0.94em",
                                            padding: 0,
                                        }}
                                    />
                                    <AnimatePresence initial={false}>
                                        {ready && (
                                            <motion.button
                                                key="send"
                                                type="submit"
                                                className={`${scope}-hit`}
                                                initial={{ opacity: 0, x: 6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 6 }}
                                                transition={flick}
                                                style={{
                                                    ...bare,
                                                    color: r.sendColor,
                                                    fontWeight: 600,
                                                    fontSize: "0.94em",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {r.sendLabel}
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Launcher */}
                <motion.button
                    ref={launcherRef}
                    type="button"
                    className={`${scope}-hit`}
                    aria-label={open ? "Close messages" : `Message ${r.name}`}
                    aria-expanded={open}
                    onClick={toggle}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    transition={bounce}
                    style={{
                        ...bare,
                        position: "relative",
                        width: narrow ? 56 : 60,
                        height: narrow ? 56 : 60,
                        borderRadius: "50%",
                        background: r.ring,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 8px 22px rgba(214,41,118,0.32)",
                    }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={open ? "x" : "dm"}
                            initial={{
                                opacity: 0,
                                rotate: open ? -80 : 40,
                                scale: 0.6,
                            }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{
                                opacity: 0,
                                rotate: open ? 80 : -40,
                                scale: 0.6,
                            }}
                            transition={{ duration: 0.18 }}
                            style={{ display: "flex" }}
                        >
                            {open ? (
                                <svg
                                    width="26"
                                    height="26"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d={ICON.close}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth={2.2}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d={ICON.plane}
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth={1.9}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            )}
                        </motion.span>
                    </AnimatePresence>
                    <AnimatePresence>
                        {!open && r.badge && !badgeGone && (
                            <motion.span
                                key="badge"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={bounce}
                                style={{
                                    position: "absolute",
                                    top: -2,
                                    right: -2,
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    background: "#FF3040",
                                    border: "2px solid #ffffff",
                                    color: "#ffffff",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                1
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </MotionConfig>
    )
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(Billet, {
    username: {
        type: ControlType.String,
        title: "Username",
        defaultValue: "studio.team",
        placeholder: "yourusername",
        description:
            "Your account username without the @. Messages and the profile button open this account. Test it in Preview or on the live site.",
    },
    displayName: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "Studio Team",
    },
    activity: {
        type: ControlType.String,
        title: "Activity",
        defaultValue: "Active now",
    },
    tagline: {
        type: ControlType.String,
        title: "Tagline",
        defaultValue: "Design studio",
    },
    avatar: { type: ControlType.ResponsiveImage, title: "Avatar" },
    avatarUrl: {
        type: ControlType.String,
        title: "Avatar URL",
        defaultValue: "",
        placeholder: "https://…",
    },
    profileButton: {
        type: ControlType.String,
        title: "Profile Button",
        defaultValue: "View profile",
    },
    greetings: {
        type: ControlType.Array,
        title: "Greetings",
        maxCount: 5,
        control: { type: ControlType.String, displayTextArea: true },
        defaultValue: [
            "Hey! 👋 Thanks for stopping by our studio.",
            "We design websites, apps and digital products. What are you working on?",
        ],
    },
    chips: {
        type: ControlType.Array,
        title: "Quick Replies",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Start a project",
                },
                message: {
                    type: ControlType.String,
                    title: "Message",
                    displayTextArea: true,
                    defaultValue:
                        "Hi! I'd like to talk about a new design project.",
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
                label: "📱 App & product UI",
                message:
                    "Hi! I need UI/UX design for an app or digital product. Can you help?",
            },
            {
                label: "💰 Pricing",
                message:
                    "Hi! Could you share your pricing and typical timelines?",
            },
            {
                label: "🗂️ Portfolio",
                message: "Hi! I'd love to see some of your recent work.",
            },
        ],
    },
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Message…",
    },
    sendLabel: {
        type: ControlType.String,
        title: "Send Label",
        defaultValue: "Send",
    },
    stampLabel: {
        type: ControlType.String,
        title: "Day Label",
        defaultValue: "Today",
    },
    seenLabel: {
        type: ControlType.String,
        title: "Seen Label",
        defaultValue: "Seen",
    },
    copiedToast: {
        type: ControlType.String,
        title: "Copied Toast",
        defaultValue: "Message copied — paste it in the chat",
        description:
            "Shown after sending, because DM links can't prefill text — the message is copied for the visitor to paste.",
    },
    side: {
        type: ControlType.Enum,
        title: "Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    ringFrom: {
        type: ControlType.Color,
        title: "Gradient 1",
        defaultValue: "#FEDA75",
    },
    ringVia: {
        type: ControlType.Color,
        title: "Gradient 2",
        defaultValue: "#D62976",
    },
    ringTo: {
        type: ControlType.Color,
        title: "Gradient 3",
        defaultValue: "#4F5BD5",
    },
    outFrom: {
        type: ControlType.Color,
        title: "Bubble Top",
        defaultValue: "#A033FF",
    },
    outTo: {
        type: ControlType.Color,
        title: "Bubble Bottom",
        defaultValue: "#3797F0",
    },
    sendColor: {
        type: ControlType.Color,
        title: "Send Color",
        defaultValue: "#0095F6",
    },
    badge: {
        type: ControlType.Boolean,
        title: "Badge",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    typingFor: {
        type: ControlType.Number,
        title: "Typing Time",
        defaultValue: 1.4,
        min: 0,
        max: 6,
        step: 0.1,
        unit: "s",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "Open Link In",
        defaultValue: true,
        enabledTitle: "New Tab",
        disabledTitle: "Same Tab",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", lineHeight: "1.35em" },
    },
    canvasOpen: {
        type: ControlType.Boolean,
        title: "Canvas Preview",
        defaultValue: true,
        enabledTitle: "Open",
        disabledTitle: "Closed",
    },
})
