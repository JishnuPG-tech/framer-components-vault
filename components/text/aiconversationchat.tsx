// Please fix the following error: waitForComponentLoader timeout
//
// Fix: replace the component with a robust implementation that avoids runtime errors/infinite loops,
// adds the requested Scenes feature safely, and guards all browser-only APIs.

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

// Remove framer-motion useInView to avoid potential IntersectionObserver/network issues in Framer loader
// import { useInView } from "framer-motion"

type ThemePreset = "dark" | "light"

type Role = "user" | "ai"

type AttachmentKind = "image" | "video" | "document"

type Attachment = {
    kind: AttachmentKind
    url: string
    name?: string
    mime?: string
}

type MessageStatus = "sent" | "delivered" | "read"

type Message = {
    role: Role
    text: string
    ts?: number
    edited?: boolean
    reaction?: string
    status?: MessageStatus
    attachment?: Attachment
    quote?: { role: Role; text: string }
}

type Scene = {
    title: string
    messages: Message[]
}

type Props = {
    // Scenes
    useScenes: boolean
    scenes: Scene[]
    sceneDelayMs: number

    // Single thread
    title: string
    messages: Message[]

    // Profile
    userName: string
    userAvatar?: { src: string; srcSet?: string; alt?: string }
    profileStatus: string

    // Calls
    enableCalls: boolean
    audioCallLabel: string
    videoCallLabel: string

    // Reactions
    enableReactions: boolean
    reactionEmojis: string[]

    // Status indicators
    enableStatus: boolean
    deliveredDelayMs: number
    readDelayMs: number

    // Attachments
    enableAttachments: boolean
    allowImageAttachments: boolean
    allowVideoAttachments: boolean
    allowDocumentAttachments: boolean
    attachLabel: string

    // Interactive
    interactive: boolean
    inputPlaceholder: string
    sendLabel: string
    replyMode: "preset" | "echo" | "smart"
    presetReplies: string[]
    replyDelayMs: number
    maxMessages: number

    // Edit
    allowEdit: boolean
    editWindowMs: number
    editLabel: string
    saveLabel: string
    cancelLabel: string

    // Search
    enableSearch: boolean
    searchPlaceholder: string

    // Lazy loading
    enableLazyLoading: boolean
    initialVisibleMessages: number
    lazyBatchSize: number

    // Playback
    autoplay: boolean
    loop: boolean
    typingMsPerChar: number
    messageDelayMs: number
    loopDelayMs: number

    // Theme / Styling
    theme: ThemePreset
    backgroundColor: string
    panelColor: string
    borderColor: string
    titleColor: string
    userBubble: string
    aiBubble: string
    userTextColor: string
    aiTextColor: string
    titleFont: any
    messageFont: any
    padding: number
    gap: number
    radius: number

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    if (Number.isNaN(n)) return min
    return Math.max(min, Math.min(max, n))
}

function normalizeMessages(messages: Message[] | undefined | null): Message[] {
    const arr = Array.isArray(messages) ? messages : []
    return arr
        .map((m) => {
            const role: Role = m?.role === "user" ? "user" : "ai"
            const text = typeof m?.text === "string" ? m.text : ""
            const ts = typeof (m as any)?.ts === "number" ? (m as any).ts : undefined
            const edited = typeof (m as any)?.edited === "boolean" ? (m as any).edited : undefined
            const reaction = typeof (m as any)?.reaction === "string" ? (m as any).reaction : undefined
            const status: MessageStatus | undefined =
                (m as any)?.status === "sent" || (m as any)?.status === "delivered" || (m as any)?.status === "read"
                    ? (m as any).status
                    : undefined
            const q = (m as any)?.quote
            const quote =
                q && typeof q === "object" && typeof q.text === "string"
                    ? { role: q.role === "user" ? ("user" as Role) : ("ai" as Role), text: q.text }
                    : undefined
            const att = (m as any)?.attachment
            const attachment: Attachment | undefined =
                att && typeof att === "object" && typeof att.url === "string"
                    ? {
                          kind: att.kind === "video" ? "video" : att.kind === "document" ? "document" : "image",
                          url: att.url,
                          name: typeof att.name === "string" ? att.name : undefined,
                          mime: typeof att.mime === "string" ? att.mime : undefined,
                      }
                    : undefined
            return { role, text, ts, edited, reaction, status, attachment, quote }
        })
        .filter((m) => m.text.trim().length > 0 || !!m.attachment)
}

function useTimeouts() {
    const timeoutsRef = React.useRef<number[]>([])

    const clearAll = React.useCallback(() => {
        if (typeof window === "undefined") return
        for (const id of timeoutsRef.current) {
            window.clearTimeout(id)
        }
        timeoutsRef.current = []
    }, [])

    const setT = React.useCallback((fn: () => void, delay: number) => {
        if (typeof window === "undefined") return
        const id = window.setTimeout(fn, delay)
        timeoutsRef.current.push(id)
    }, [])

    React.useEffect(() => clearAll, [clearAll])

    return { setT, clearAll }
}

function formatTimestamp(ts: number | undefined) {
    if (typeof ts !== "number" || !Number.isFinite(ts)) return ""
    try {
        return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    } catch {
        return ""
    }
}

function withAutoTimestamps(messages: Message[], startTs: number) {
    const safeStart = Number.isFinite(startTs) ? startTs : Date.now()
    return messages.map((m, i) => ({ ...m, ts: typeof m.ts === "number" ? m.ts : safeStart + i * 60_000 }))
}

function canEditMessage(m: Message | undefined, windowMs: number) {
    if (!m || m.role !== "user") return false
    if (typeof m.ts !== "number" || !Number.isFinite(m.ts)) return false
    const w = clamp(windowMs, 0, 10 * 60_000)
    if (w <= 0) return false
    return Date.now() - m.ts <= w
}

function useSafeInView(
    ref: React.RefObject<HTMLElement>,
    enabled: boolean
): boolean {
    const [inView, setInView] = React.useState(true)

    React.useEffect(() => {
        if (!enabled) {
            React.startTransition(() => setInView(true))
            return
        }
        if (typeof window === "undefined") {
            React.startTransition(() => setInView(true))
            return
        }
        const el = ref.current
        if (!el) {
            React.startTransition(() => setInView(true))
            return
        }

        // If IntersectionObserver isn't available (or is blocked), just assume in view.
        const IO = (window as any).IntersectionObserver as typeof IntersectionObserver | undefined
        if (!IO) {
            React.startTransition(() => setInView(true))
            return
        }

        let canceled = false
        const observer = new IO(
            (entries) => {
                if (canceled) return
                const entry = entries[0]
                const next = !!entry?.isIntersecting
                React.startTransition(() => setInView(next))
            },
            { threshold: 0.25 }
        )

        try {
            observer.observe(el)
        } catch {
            React.startTransition(() => setInView(true))
        }

        return () => {
            canceled = true
            try {
                observer.disconnect()
            } catch {}
        }
    }, [ref, enabled])

    return inView
}

/**
 * AIConversationShowcase
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AIConversationShowcase(props: Props) {
    const isStatic = useIsStaticRenderer()

    const {
        useScenes,
        scenes,
        sceneDelayMs,
        title,
        autoplay,
        loop,
        typingMsPerChar,
        messageDelayMs,
        loopDelayMs,
        theme,
        backgroundColor,
        panelColor,
        userBubble,
        aiBubble,
        userTextColor,
        aiTextColor,
        titleColor,
        borderColor,
        titleFont,
        messageFont,
        padding,
        gap,
        radius,
        style,
        interactive,
        inputPlaceholder,
        sendLabel,
        replyMode,
        presetReplies,
        replyDelayMs,
        maxMessages,
        allowEdit,
        editWindowMs,
        editLabel,
        saveLabel,
        cancelLabel,
        enableSearch,
        searchPlaceholder,
        enableLazyLoading,
        initialVisibleMessages,
        lazyBatchSize,
        userName,
        userAvatar = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "User avatar",
        },
        profileStatus,
        enableCalls,
        audioCallLabel,
        videoCallLabel,
        enableReactions,
        reactionEmojis,
        enableStatus,
        deliveredDelayMs,
        readDelayMs,
        enableAttachments,
        allowImageAttachments,
        allowVideoAttachments,
        allowDocumentAttachments,
        attachLabel,
    } = props

    const baseTimeRef = React.useRef<number>(Date.now() - 10 * 60_000)

    const [searchQuery, setSearchQuery] = React.useState("")

    const normalizedScenes = React.useMemo(() => {
        const arr = Array.isArray(scenes) ? scenes : []
        return arr
            .map((s) => ({
                title: typeof (s as any)?.title === "string" ? (s as any).title : "",
                messages: normalizeMessages((s as any)?.messages),
            }))
            .filter((s) => s.messages.length > 0)
    }, [scenes])

    const [sceneIndex, setSceneIndex] = React.useState(0)

    const activeScene = React.useMemo(() => {
        if (!useScenes || normalizedScenes.length === 0) return null
        const idx = clamp(sceneIndex, 0, normalizedScenes.length - 1)
        return normalizedScenes[idx]
    }, [useScenes, normalizedScenes, sceneIndex])

    const showcaseMessages = React.useMemo(() => {
        if (activeScene) return activeScene.messages
        return normalizeMessages(props.messages)
    }, [activeScene, props.messages])

    const showcaseMessagesWithTs = React.useMemo(() => {
        const start = baseTimeRef.current - Math.max(0, showcaseMessages.length - 1) * 60_000
        return withAutoTimestamps(showcaseMessages, start)
    }, [showcaseMessages])

    const safeTyping = clamp(typingMsPerChar, 8, 200)
    const safeDelay = clamp(messageDelayMs, 0, 4000)
    const safeLoopDelay = clamp(loopDelayMs, 0, 8000)
    const safeSceneDelay = clamp(sceneDelayMs, 0, 12000)
    const safeReplyDelay = clamp(replyDelayMs, 0, 12000)
    const safeDeliveredDelay = clamp(deliveredDelayMs, 0, 12000)
    const safeReadDelay = clamp(readDelayMs, 0, 20000)
    const safeEditWindow = clamp(editWindowMs, 0, 10 * 60_000)

    const containerRef = React.useRef<HTMLDivElement>(null)
    const inView = useSafeInView(containerRef, !interactive && !isStatic)

    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [revealedText, setRevealedText] = React.useState<string>("")
    const [doneCount, setDoneCount] = React.useState(0)

    const { setT, clearAll } = useTimeouts()

    const shouldAnimate = !interactive && !isStatic && autoplay && inView

    const currentMessage = showcaseMessagesWithTs[currentIndex]

    const [threadMessages, setThreadMessages] = React.useState<Message[]>(() => showcaseMessagesWithTs)
    const [reactions, setReactions] = React.useState<Record<number, string>>({})
    const scrollPanelRef = React.useRef<HTMLDivElement>(null)
    const [visibleCount, setVisibleCount] = React.useState(() =>
        clamp(initialVisibleMessages, 10, 200)
    )
    const [composerValue, setComposerValue] = React.useState("")
    const [composerFocused, setComposerFocused] = React.useState(false)
    const [aiTyping, setAiTyping] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
    const [editingValue, setEditingValue] = React.useState("")
    const [menuIndex, setMenuIndex] = React.useState<number | null>(null)
    const [replyToIndex, setReplyToIndex] = React.useState<number | null>(null)
    const replyIndexRef = React.useRef(0)
    const endRef = React.useRef<HTMLDivElement>(null)
    const menuRef = React.useRef<HTMLDivElement>(null)

    const [profileOpen, setProfileOpen] = React.useState(false)
    const [callOpen, setCallOpen] = React.useState(false)
    const [callType, setCallType] = React.useState<"audio" | "video">("audio")

    React.useEffect(() => {
        if (!interactive) return
        React.startTransition(() => {
            setThreadMessages(
                withAutoTimestamps(
                    showcaseMessagesWithTs,
                    Date.now() - Math.max(0, showcaseMessagesWithTs.length - 1) * 60_000
                )
            )
            setReactions({})
            setComposerValue("")
            setComposerFocused(false)
            setEditingIndex(null)
            setEditingValue("")
            setMenuIndex(null)
            setReplyToIndex(null)
            setVisibleCount(clamp(initialVisibleMessages, 10, 200))
        })
        replyIndexRef.current = 0
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interactive])

    const safeReactionEmojis = React.useMemo(() => {
        const arr = Array.isArray(reactionEmojis) ? reactionEmojis : []
        return arr.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean).slice(0, 8)
    }, [reactionEmojis])

    const setReaction = React.useCallback(
        (index: number, emoji: string) => {
            if (!interactive || !enableReactions) return
            const e = (emoji || "").trim()
            if (!e) return
            React.startTransition(() => {
                setReactions((prev) => {
                    const curr = prev[index]
                    const next = { ...prev }
                    if (curr === e) {
                        delete next[index]
                    } else {
                        next[index] = e
                    }
                    return next
                })
            })
        },
        [interactive, enableReactions]
    )

    React.useEffect(() => {
        if (!interactive) return
        if (typeof window === "undefined") return
        if (menuIndex === null) return

        const onDown = (e: MouseEvent) => {
            const target = e.target as any
            if (!menuRef.current) return
            if (menuRef.current.contains(target)) return
            React.startTransition(() => setMenuIndex(null))
        }

        window.addEventListener("mousedown", onDown)
        return () => window.removeEventListener("mousedown", onDown)
    }, [interactive, menuIndex])

    React.useEffect(() => {
        if (!interactive) return
        if (typeof window === "undefined") return
        const id = window.setTimeout(() => {
            endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
        }, 0)
        return () => window.clearTimeout(id)
    }, [interactive, threadMessages.length])

    const toggleMenu = React.useCallback(
        (index: number) => {
            if (!interactive) return
            React.startTransition(() => {
                setMenuIndex((prev) => (prev === index ? null : index))
            })
        },
        [interactive]
    )

    const setReplyTo = React.useCallback(
        (index: number | null) => {
            if (!interactive) return
            React.startTransition(() => setReplyToIndex(index))
        },
        [interactive]
    )

    const forwardMessage = React.useCallback((text: string) => {
        if (typeof window === "undefined") return
        const t = (text || "").trim()
        if (!t) return
        try {
            const cb = (navigator as any)?.clipboard
            if (cb?.writeText) {
                cb.writeText(t)
                return
            }
        } catch {}
        try {
            const ta = document.createElement("textarea")
            ta.value = t
            ta.style.position = "fixed"
            ta.style.left = "-9999px"
            ta.style.top = "-9999px"
            document.body.appendChild(ta)
            ta.focus()
            ta.select()
            document.execCommand("copy")
            document.body.removeChild(ta)
        } catch {}
    }, [])

    const hashString = React.useCallback((s: string) => {
        // small deterministic hash (no crypto)
        let h = 2166136261
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i)
            h = Math.imul(h, 16777619)
        }
        return h >>> 0
    }, [])

    const generateSmartReply = React.useCallback(
        (input: string, turn: number): string => {
            const text = (input || "").trim()
            if (!text) return "Tell me a bit more."

            const lower = text.toLowerCase()
            const seed = hashString(`${turn}|${lower}`)
            const pick = (arr: string[]) => arr[seed % Math.max(1, arr.length)]

            const extractKeywords = (s: string) => {
                const cleaned = (s || "")
                    .toLowerCase()
                    .replace(/[^a-z0-9\s?]/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()

                const parts = cleaned.split(" ")
                const stop = new Set([
                    "the",
                    "a",
                    "an",
                    "and",
                    "or",
                    "to",
                    "of",
                    "in",
                    "on",
                    "for",
                    "with",
                    "is",
                    "are",
                    "was",
                    "were",
                    "be",
                    "do",
                    "does",
                    "did",
                    "i",
                    "you",
                    "we",
                    "they",
                    "me",
                    "my",
                    "your",
                    "our",
                    "this",
                    "that",
                    "it",
                    "kya",
                    "kia",
                    "ka",
                    "ki",
                    "ke",
                    "mein",
                    "main",
                    "ap",
                    "aap",
                    "tum",
                    "hum",
                    "plz",
                    "please",
                    "batao",
                    "btw",
                ])

                return parts.filter((p) => p && p.length > 2 && !stop.has(p)).slice(0, 5)
            }

            const openers = ["Got it.", "Absolutely.", "Good question.", "Sure — let’s do it.", "Understood."]

            const isGreeting = /^(hi|hello|hey|assalam|aslam|salam)\b/.test(lower)
            const isThanks = /\b(thanks|thank you|shukriya|jazak|ty)\b/.test(lower)
            const asksSteps = /\b(step|steps|process|kaise|kaisay|kese|how to|how do i|guide)\b/.test(lower)
            const asksList = /\b(ideas|options|suggest|suggestions|examples|recommend|list|top)\b/.test(lower)
            const asksFix = /\b(fix|issue|error|bug|timeout|crash|not working)\b/.test(lower)
            const mentionsCode = /\b(code|typescript|react|component|function|hook)\b/.test(lower)
            const isQuestion = /\?$/.test(lower) || /\b(what|why|how|when|where|who|which|kya|kia|kyun|kyu|kyon|kesay|kese|kaise)\b/.test(lower)

            const topic = (() => {
                if (lower.includes("headline") || lower.includes("tagline") || lower.includes("title")) return "headline"
                if (lower.includes("pricing") || lower.includes("price") || lower.includes("plan")) return "pricing"
                if (lower.includes("framer") || lower.includes("component") || lower.includes("ui")) return "framer"
                if (lower.includes("email") || lower.includes("subject")) return "email"
                if (lower.includes("instagram") || lower.includes("post") || lower.includes("launch")) return "launch"
                if (lower.includes("image") || lower.includes("video") || lower.includes("document") || lower.includes("pdf")) return "attachments"
                return "generic"
            })()

            const keywords = extractKeywords(lower)

            if (isGreeting) {
                return pick([
                    "Wa alaikum assalam — tell me what you want to build.",
                    "Hi — share your goal and I’ll help.",
                    "Hey! What do you want to do: rewrite, explain, suggest, or troubleshoot?",
                ])
            }

            if (isThanks) {
                return pick([
                    "You’re welcome. Want it short and WhatsApp-style, or more detailed?",
                    "Anytime. Share one example and I’ll match the tone.",
                    "No problem — what’s the next message you want to reply to?",
                ])
            }

            if (topic === "headline") {
                return [
                    `${pick(openers)} Here are 3 headline options:`,
                    "1) Showcase AI conversations with a polished chat UI",
                    "2) A modern chat demo component for Framer—fast and customizable",
                    "3) Turn your product story into a premium chat showcase",
                ].join("\n")
            }

            if (topic === "pricing") {
                return [
                    `${pick(openers)} Quick pricing upgrades:`,
                    "• Make one plan the obvious choice (badge + promise)",
                    "• Keep benefits outcome-based",
                    "• Add trust near the CTA (proof, guarantee, FAQ)",
                ].join("\n")
            }

            if (topic === "framer") {
                if (asksSteps) {
                    return [
                        `${pick(openers)} Here’s a clean Framer approach:`,
                        "1) Keep the chat UI in one component",
                        "2) Store messages in state; append user + AI",
                        "3) Add reply quotes + reactions + timestamps",
                        "4) Add typing delays for realism",
                    ].join("\n")
                }

                return [
                    `${pick(openers)} For a premium Framer chat component:`,
                    "• Subtle blur + thin border (glass)",
                    "• Timestamps, reactions, reply quotes",
                    "• Micro-animations (120–180ms)",
                ].join("\n")
            }

            if (topic === "email") {
                return [
                    `${pick(openers)} Send me:`,
                    "1) Audience",
                    "2) Offer",
                    "3) CTA",
                    "and I’ll draft subject + body.",
                ].join("\n")
            }

            if (topic === "launch") {
                return [
                    "New: a WhatsApp-style AI chat showcase for Framer.",
                    "Glass UI, smooth typing, reactions, replies, and attachments — drop it into any page for an instant premium demo.",
                    "Want it shorter, more hype, or more technical?",
                ].join("\n")
            }

            if (topic === "attachments") {
                return [
                    `${pick(openers)} For attachments, users expect:`,
                    "• Images: in-bubble preview",
                    "• Videos: player with controls",
                    "• Docs: filename + download",
                ].join("\n")
            }

            if (asksFix && mentionsCode) {
                return [
                    `${pick(openers)} To avoid repeating the same reply:`,
                    "1) Increment the turn counter per user message",
                    "2) Seed replies with (turn + user text)",
                    "3) Don’t reset state on every render",
                ].join("\n")
            }

            if (asksSteps) {
                return [
                    `${pick(openers)} Here’s a quick step-by-step:`,
                    "1) Define the outcome",
                    "2) Share constraints (tone/length/platform)",
                    "3) I’ll propose 2–3 options",
                    "4) You pick one, I refine",
                ].join("\n")
            }

            if (asksList) {
                return [
                    `${pick(openers)} Options:`,
                    "A) Short + punchy",
                    "B) Premium + professional",
                    "C) Friendly + WhatsApp-style",
                    "Reply with A/B/C and the topic.",
                ].join("\n")
            }

            if (topic === "generic" && isQuestion) {
                const k = keywords.join(", ")
                return `${pick(openers)} Share the goal${k ? ` (topic: ${k})` : ""} and any constraints, and I’ll answer precisely.`
            }

            return `${pick(openers)} Tell me what output you want (short answer, steps, or examples).`
        },
        [hashString]
    )

    const buildAcceptString = React.useCallback(() => {
        const parts: string[] = []
        if (allowImageAttachments) parts.push("image/*")
        if (allowVideoAttachments) parts.push("video/*")
        if (allowDocumentAttachments) parts.push(".pdf,.doc,.docx,.txt")
        return parts.join(",")
    }, [allowDocumentAttachments, allowImageAttachments, allowVideoAttachments])

    const updateStatusByTs = React.useCallback(
        (ts: number, status: MessageStatus) => {
            if (!interactive || !enableStatus) return
            React.startTransition(() => {
                setThreadMessages((prev) =>
                    prev.map((m) => (m.role === "user" && m.ts === ts ? { ...m, status } : m))
                )
            })
        },
        [interactive, enableStatus]
    )

    const scheduleStatusProgress = React.useCallback(
        (ts: number) => {
            if (!interactive || !enableStatus) return
            if (typeof window === "undefined") return
            if (safeDeliveredDelay >= 0) {
                setT(() => updateStatusByTs(ts, "delivered"), safeDeliveredDelay)
            }
            if (safeReadDelay >= 0) {
                setT(() => updateStatusByTs(ts, "read"), safeReadDelay)
            }
        },
        [interactive, enableStatus, safeDeliveredDelay, safeReadDelay, setT, updateStatusByTs]
    )

    const sendAttachment = React.useCallback(
        (file: File) => {
            if (!interactive || !enableAttachments) return
            if (typeof window === "undefined") return

            const kind: AttachmentKind = file.type.startsWith("video/")
                ? "video"
                : file.type.startsWith("image/")
                  ? "image"
                  : "document"

            if (kind === "image" && !allowImageAttachments) return
            if (kind === "video" && !allowVideoAttachments) return
            if (kind === "document" && !allowDocumentAttachments) return

            let url = ""
            try {
                url = URL.createObjectURL(file)
            } catch {
                return
            }

            const now = Date.now()
            const replyTo = replyToIndex

            const userMsg: Message = {
                role: "user",
                text: file.name || "Attachment",
                ts: now,
                status: "sent",
                attachment: { kind, url, name: file.name, mime: file.type },
            }

            React.startTransition(() => {
                setThreadMessages((prev) => {
                    const next = [...prev]

                    if (replyTo !== null && next[replyTo]) {
                        const quoted = (next[replyTo].text || "").trim()
                        if (quoted) {
                            userMsg.quote = { role: next[replyTo].role, text: quoted }
                        }
                    }

                    next.push(userMsg)

                    // Enforce max messages (keep the newest)
                    const limit = clamp(maxMessages, 4, 200)
                    const sliced = next.length > limit ? next.slice(next.length - limit) : next
                    return sliced
                })
                setReplyToIndex(null)
                setMenuIndex(null)
                setEditingIndex(null)
                setEditingValue("")
            })

            scheduleStatusProgress(now)

            if (typeof window === "undefined") return
            React.startTransition(() => setAiTyping(true))
            setT(() => {
                const kindLabel = kind === "image" ? "image" : kind === "video" ? "video" : "document"
                const aiMsg: Message = {
                    role: "ai",
                    text:
                        replyMode === "echo"
                            ? `Received your ${kindLabel}: ${file.name}`
                            : replyMode === "smart"
                              ? `Thanks — I received the ${kindLabel}. What should I do with it (summarize, extract key points, or draft a caption)?`
                              : "Nice — I received your file.",
                    ts: Date.now(),
                }

                React.startTransition(() => {
                    setAiTyping(false)
                    setThreadMessages((prev) => {
                        const next = [...prev, aiMsg]
                        const limit = clamp(maxMessages, 4, 200)
                        return next.length > limit ? next.slice(next.length - limit) : next
                    })
                })
            }, safeReplyDelay)
        },
        [
            interactive,
            enableAttachments,
            allowImageAttachments,
            allowVideoAttachments,
            allowDocumentAttachments,
            replyToIndex,
            maxMessages,
            replyMode,
            safeReplyDelay,
            setT,
            scheduleStatusProgress,
        ]
    )

    const sendMessage = React.useCallback(() => {
        if (!interactive) return

        const raw = composerValue
        const text = (raw || "").trim()
        if (!text) return

        // Ensure each reply turn advances even if multiple sends happen quickly.
        const currentTurn = replyIndexRef.current

        const now = Date.now()
        const replyTo = replyToIndex

        const userMsg: Message = {
            role: "user",
            text,
            ts: now,
            status: "sent",
        }

        React.startTransition(() => {
            setThreadMessages((prev) => {
                const next = [...prev]

                if (replyTo !== null && next[replyTo]) {
                    const quoted = (next[replyTo].text || "").trim()
                    if (quoted) {
                        userMsg.quote = { role: next[replyTo].role, text: quoted }
                    }
                }

                next.push(userMsg)

                // Enforce max messages (keep the newest)
                const limit = clamp(maxMessages, 4, 200)
                const sliced = next.length > limit ? next.slice(next.length - limit) : next
                return sliced
            })
            setComposerValue("")
            setReplyToIndex(null)
            setMenuIndex(null)
            setEditingIndex(null)
            setEditingValue("")
        })

        // AI reply
        if (typeof window === "undefined") return
        if (safeReplyDelay < 0) return

        React.startTransition(() => setAiTyping(true))
        setT(() => {
            const makeReply = () => {
                if (replyMode === "echo") return `You said: ${text}`
                if (replyMode === "smart") {
                    // Use a stable turn captured at send-time to avoid duplicate replies if state updates race.
                    replyIndexRef.current = Math.max(replyIndexRef.current + 1, currentTurn + 1)
                    return generateSmartReply(text, currentTurn)
                }

                const arr = Array.isArray(presetReplies) ? presetReplies : []
                const safeArr = arr.map((s) => (typeof s === "string" ? s : "")).filter((s) => s.trim().length > 0)
                const idx = replyIndexRef.current % Math.max(1, safeArr.length)
                replyIndexRef.current = replyIndexRef.current + 1

                const base = safeArr[idx] || "Got it."
                // Make preset mode feel more contextual
                const opener = (() => {
                    const lower = text.toLowerCase()
                    if (lower.includes("why") || lower.includes("how") || lower.includes("what") || lower.includes("?")) return "Good question."
                    if (lower.includes("help") || lower.includes("please")) return "Sure."
                    return "Got it."
                })()
                return `${opener} ${base}`.trim()
            }

            const aiMsg: Message = {
                role: "ai",
                text: makeReply(),
                ts: Date.now(),
            }

            React.startTransition(() => {
                setAiTyping(false)
                setThreadMessages((prev) => {
                    const next = [...prev, aiMsg]
                    const limit = clamp(maxMessages, 4, 200)
                    return next.length > limit ? next.slice(next.length - limit) : next
                })
            })
        }, safeReplyDelay)
    }, [
        interactive,
        composerValue,
        replyToIndex,
        replyMode,
        presetReplies,
        safeReplyDelay,
        setT,
        maxMessages,
        generateSmartReply,
        scheduleStatusProgress,
    ])

    const onComposerKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault()
                sendMessage()
            }
        },
        [sendMessage]
    )

    const onPickFile = React.useCallback(() => {
        if (!interactive || !enableAttachments) return
        fileInputRef.current?.click()
    }, [interactive, enableAttachments])

    const onFileChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            // allow selecting same file twice
            e.target.value = ""
            if (!file) return
            sendAttachment(file)
        },
        [sendAttachment])

    const startEdit = React.useCallback(
        (index: number) => {
            if (!interactive || !allowEdit) return
            React.startTransition(() => {
                setEditingIndex(index)
                setEditingValue(threadMessages[index]?.text ?? "")
            })
        },
        [interactive, allowEdit, threadMessages]
    )

    const cancelEdit = React.useCallback(() => {
        React.startTransition(() => {
            setEditingIndex(null)
            setEditingValue("")
        })
    }, [])

    const saveEdit = React.useCallback(() => {
        if (!interactive || !allowEdit) return
        if (editingIndex === null) return
        const nextText = editingValue.trim()
        if (!nextText) return

        const idx = editingIndex
        const ts = threadMessages[idx]?.ts

        React.startTransition(() => {
            setThreadMessages((prev): Message[] => {
                if (idx < 0 || idx >= prev.length) return prev
                const target = prev[idx]
                if (!canEditMessage(target, safeEditWindow)) return prev
                const next = [...prev]
                next[idx] = { ...target, text: nextText, edited: true }
                return next
            })
            setEditingIndex(null)
            setEditingValue("")
        })

        if (typeof ts === "number" && Number.isFinite(ts)) {
            scheduleStatusProgress(ts)
        }
    }, [
        interactive,
        allowEdit,
        editingIndex,
        editingValue,
        safeEditWindow,
        threadMessages,
        scheduleStatusProgress,
    ])

    const onEditKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault()
                saveEdit()
            }
            if (e.key === "Escape") {
                e.preventDefault()
                cancelEdit()
            }
        },
        [saveEdit, cancelEdit]
    )

    const messages = interactive ? threadMessages : showcaseMessagesWithTs

    // Revoke object URLs created from attachments to avoid leaks
    React.useEffect(() => {
        if (typeof window === "undefined") return
        const urls = new Set(
            (threadMessages || [])
                .map((m) => m?.attachment?.url)
                .filter((u): u is string => typeof u === "string" && u.startsWith("blob:"))
        )
        return () => {
            for (const u of urls) {
                try {
                    URL.revokeObjectURL(u)
                } catch {}
            }
        }
    }, [threadMessages])

    // Reset when messages/scene change
    React.useEffect(() => {
        if (interactive) return
        clearAll()
        React.startTransition(() => {
            setCurrentIndex(0)
            setRevealedText("")
            setDoneCount(0)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showcaseMessages, sceneIndex, useScenes, interactive])

    // Main playback loop
    React.useEffect(() => {
        clearAll()

        if (!shouldAnimate) return
        if (!showcaseMessages || showcaseMessages.length === 0) return

        // If completed all messages
        if (doneCount >= showcaseMessages.length) {
            if (!loop) return

            const canAdvanceScene = useScenes && normalizedScenes.length > 1
            if (canAdvanceScene) {
                setT(() => {
                    React.startTransition(() => {
                        setSceneIndex((prev) => (prev + 1) % normalizedScenes.length)
                        setCurrentIndex(0)
                        setRevealedText("")
                        setDoneCount(0)
                    })
                }, safeSceneDelay)
                return
            }

            setT(() => {
                React.startTransition(() => {
                    setCurrentIndex(0)
                    setRevealedText("")
                    setDoneCount(0)
                })
            }, safeLoopDelay)
            return
        }

        // Safety: guard indexes
        const safeIndex = clamp(currentIndex, 0, showcaseMessages.length - 1)
        if (safeIndex !== currentIndex) {
            React.startTransition(() => setCurrentIndex(safeIndex))
            return
        }

        const msg = showcaseMessages[safeIndex]
        const full = msg?.text ?? ""

        // If starting a new message
        if (revealedText.length === 0) {
            // Small pause before typing
            setT(() => {
                // Reveal at least 1 char, then continue
                const nextLen = Math.min(1, full.length)
                React.startTransition(() => setRevealedText(full.slice(0, nextLen)))
            }, safeDelay)
            return
        }

        // If fully revealed, advance to next message
        if (revealedText.length >= full.length) {
            setT(() => {
                React.startTransition(() => {
                    setDoneCount((c) => c + 1)
                    setCurrentIndex((i) => clamp(i + 1, 0, showcaseMessages.length))
                    setRevealedText("")
                })
            }, safeDelay)
            return
        }

        // Continue typing
        setT(() => {
            const nextLen = Math.min(revealedText.length + 1, full.length)
            React.startTransition(() => setRevealedText(full.slice(0, nextLen)))
        }, safeTyping)

        return
    }, [
        shouldAnimate,
        showcaseMessages,
        currentIndex,
        revealedText,
        doneCount,
        safeDelay,
        safeTyping,
        safeLoopDelay,
        safeSceneDelay,
        loop,
        useScenes,
        normalizedScenes.length,
        clearAll,
        setT,
    ])

    // When not animating, show all messages (static / paused)
    const renderedMessages = React.useMemo(() => {
        if (!showcaseMessagesWithTs || showcaseMessagesWithTs.length === 0)
            return [] as {
                role: Role
                text: string
                ts?: number
                edited?: boolean
                reaction?: string
                key: string
                index: number
                status?: MessageStatus
            }[]

        if (!shouldAnimate) {
            return showcaseMessagesWithTs.map((m, i) => ({
                role: m.role,
                text: m.text,
                ts: m.ts,
                edited: m.edited,
                reaction: m.reaction,
                status: m.status,
                key: `${i}`,
                index: i,
            }))
        }

        const completed = showcaseMessagesWithTs.slice(0, clamp(doneCount, 0, showcaseMessagesWithTs.length))
        const pendingCurrent = currentMessage
            ? [
                  {
                      role: currentMessage.role,
                      text: revealedText,
                      ts: currentMessage.ts,
                      edited: currentMessage.edited,
                      reaction: currentMessage.reaction,
                      status: currentMessage.status,
                      key: `typing-${currentIndex}`,
                      index: clamp(currentIndex, 0, Math.max(0, showcaseMessagesWithTs.length - 1)),
                  },
              ]
            : []

        return [
            ...completed.map((m, i) => ({
                role: m.role,
                text: m.text,
                ts: m.ts,
                edited: m.edited,
                reaction: m.reaction,
                status: m.status,
                key: `${i}`,
                index: i,
            })),
            ...pendingCurrent,
        ]
    }, [showcaseMessagesWithTs, shouldAnimate, doneCount, currentMessage, revealedText, currentIndex])

    const displayedMessages = interactive
        ? messages.map((m, i) => ({
              role: m.role,
              text: m.text,
              ts: m.ts,
              edited: m.edited,
              reaction: m.reaction,
              status: (m as any).status,
              key: `live-${i}`,
              index: i,
          }))
        : renderedMessages

    const normalizedQuery = React.useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery])

    const filteredMessages = React.useMemo(() => {
        if (!enableSearch) return displayedMessages
        if (!normalizedQuery) return displayedMessages
        return displayedMessages.filter((m) => (m.text || "").toLowerCase().includes(normalizedQuery))
    }, [displayedMessages, enableSearch, normalizedQuery])

    const safeInitialVisibleMessages = clamp(initialVisibleMessages, 10, 200)
    const safeLazyBatchSize = clamp(lazyBatchSize, 5, 200)

    const visibleMessages = React.useMemo(() => {
        if (!enableLazyLoading) return filteredMessages
        // When searching, show all matches to avoid hiding results
        if (enableSearch && normalizedQuery) return filteredMessages
        const count = clamp(
            visibleCount,
            safeInitialVisibleMessages,
            Math.max(safeInitialVisibleMessages, filteredMessages.length)
        )
        const start = Math.max(0, filteredMessages.length - count)
        return filteredMessages.slice(start)
    }, [enableLazyLoading, filteredMessages, enableSearch, normalizedQuery, visibleCount, safeInitialVisibleMessages])

    const canLoadOlder = enableLazyLoading && (!enableSearch || !normalizedQuery) && visibleMessages.length < filteredMessages.length

    const loadOlder = React.useCallback(() => {
        if (!canLoadOlder) return
        const el = scrollPanelRef.current
        const prevHeight = el ? el.scrollHeight : 0
        React.startTransition(() => {
            setVisibleCount((c) => clamp(c + safeLazyBatchSize, safeInitialVisibleMessages, filteredMessages.length))
        })
        if (typeof window === "undefined") return
        if (!el) return
        window.setTimeout(() => {
            try {
                const nextHeight = el.scrollHeight
                const delta = nextHeight - prevHeight
                if (delta > 0) el.scrollTop = el.scrollTop + delta
            } catch {}
        }, 0)
    }, [canLoadOlder, safeLazyBatchSize, safeInitialVisibleMessages, filteredMessages.length])

    React.useEffect(() => {
        if (!enableLazyLoading) return
        // If messages grow (newer), keep showing latest window
        React.startTransition(() => {
            setVisibleCount((c) =>
                clamp(Math.max(c, safeInitialVisibleMessages), safeInitialVisibleMessages, filteredMessages.length)
            )
        })
    }, [enableLazyLoading, safeInitialVisibleMessages, filteredMessages.length])

    const isDark = theme === "dark"
    const isOnline = /\bonline\b/i.test((profileStatus || "").trim())

    const outerBg = backgroundColor || (isDark ? "#0B0B0C" : "#FFFFFF")
    const panelBg = panelColor || (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")
    const border = borderColor || (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)")

    const closeOverlays = React.useCallback(() => {
        React.startTransition(() => {
            setProfileOpen(false)
            setCallOpen(false)
        })
    }, [])

    return (
        <section
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                background: outerBg,
                padding,
                display: "flex",
                flexDirection: "column",
                gap,
            }}
            aria-label="AI conversation showcase"
        >
            <header
                style={{
                    flex: "0 0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    color: titleColor,
                    ...(titleFont || {}),
                }}
            >
                <button
                    type="button"
                    onClick={() => {
                        React.startTransition(() => setProfileOpen(true))
                    }}
                    style={{
                        all: "unset" as any,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                        flex: 1,
                        cursor: "pointer",
                    }}
                    aria-label="Open profile"
                >
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            overflow: "hidden",
                            border: `1px solid ${border}`,
                            flex: "0 0 auto",
                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                            position: "relative",
                        }}
                        aria-hidden="true"
                    >
                        {isOnline && (
                            <span
                                style={{
                                    position: "absolute",
                                    right: 2,
                                    bottom: 2,
                                    width: 10,
                                    height: 10,
                                    borderRadius: 999,
                                    background: "#25D366",
                                    border: `2px solid ${outerBg}`,
                                    boxSizing: "border-box",
                                }}
                                aria-hidden="true"
                            />
                        )}
                        <img
                            src={userAvatar?.src}
                            srcSet={userAvatar?.srcSet}
                            alt={userAvatar?.alt || ""}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                    </div>
                    <div style={{ minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                        <p
                            style={{
                                margin: 0,
                                color: titleColor,
                                ...(titleFont || {}),
                                width: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {userName}
                        </p>
                        <p
                            style={{
                                margin: 0,
                                opacity: 0.7,
                                fontSize: "12px",
                                ...(messageFont || {}),
                                color: titleColor,
                                width: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {activeScene?.title?.trim()?.length ? activeScene.title : title}
                        </p>
                    </div>
                </button>

                {interactive && enableCalls && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
                        <button
                            type="button"
                            onClick={() => {
                                React.startTransition(() => {
                                    setCallType("audio")
                                    setCallOpen(true)
                                })
                            }}
                            style={{
                                border: `1px solid ${border}`,
                                borderRadius: 999,
                                padding: "8px 10px",
                                cursor: "pointer",
                                background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.5)",
                                color: isDark ? "#FFFFFF" : "#000000",
                                ...(messageFont || {}),
                                lineHeight: "1em",
                            }}
                            aria-label="Audio call"
                            title={audioCallLabel}
                        >
                            📞
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                React.startTransition(() => {
                                    setCallType("video")
                                    setCallOpen(true)
                                })
                            }}
                            style={{
                                border: `1px solid ${border}`,
                                borderRadius: 999,
                                padding: "8px 10px",
                                cursor: "pointer",
                                background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.5)",
                                color: isDark ? "#FFFFFF" : "#000000",
                                ...(messageFont || {}),
                                lineHeight: "1em",
                            }}
                            aria-label="Video call"
                            title={videoCallLabel}
                        >
                            🎥
                        </button>
                    </div>
                )}
            </header>

            {(profileOpen || callOpen) && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        boxSizing: "border-box",
                        zIndex: 50,
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={profileOpen ? "Profile" : callType === "video" ? "Video call" : "Audio call"}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeOverlays()
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: 420,
                            borderRadius: 18,
                            border: `1px solid ${border}`,
                            background: isDark ? "rgba(20,20,22,0.92)" : "rgba(255,255,255,0.95)",
                            boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.6)" : "0 16px 40px rgba(0,0,0,0.18)",
                            overflow: "hidden",
                            backdropFilter: "blur(14px)",
                            WebkitBackdropFilter: "blur(14px)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                                padding: 14,
                                borderBottom: `1px solid ${border}`,
                            }}
                        >
                            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                <div
                                    style={{
                                        ...(titleFont || {}),
                                        color: isDark ? "#FFFFFF" : "#000000",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {profileOpen ? userName : callType === "video" ? videoCallLabel : audioCallLabel}
                                </div>
                                <div
                                    style={{
                                        ...(messageFont || {}),
                                        color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)",
                                        fontSize: "12px",
                                    }}
                                >
                                    {profileOpen ? profileStatus : `Calling ${userName}…`}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeOverlays}
                                style={{
                                    border: `1px solid ${border}`,
                                    borderRadius: 999,
                                    padding: "8px 10px",
                                    cursor: "pointer",
                                    background: "transparent",
                                    color: isDark ? "#FFFFFF" : "#000000",
                                    ...(messageFont || {}),
                                    lineHeight: "1em",
                                }}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        {profileOpen ? (
                            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 999,
                                            overflow: "hidden",
                                            border: `1px solid ${border}`,
                                            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                            flex: "0 0 auto",
                                            position: "relative",
                                        }}
                                    >
                                        {isOnline && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    right: 4,
                                                    bottom: 4,
                                                    width: 14,
                                                    height: 14,
                                                    borderRadius: 999,
                                                    background: "#25D366",
                                                    border: `2px solid ${isDark ? "rgba(20,20,22,0.92)" : "rgba(255,255,255,0.95)"}`,
                                                    boxSizing: "border-box",
                                                }}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <img
                                            src={userAvatar?.src}
                                            srcSet={userAvatar?.srcSet}
                                            alt={userAvatar?.alt || ""}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                        />
                                    </div>
                                    <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                        <div style={{ ...(titleFont || {}), color: isDark ? "#FFFFFF" : "#000000" }}>{userName}</div>
                                        <div style={{ ...(messageFont || {}), color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)", fontSize: "12px" }}>{profileStatus}</div>
                                    </div>
                                </div>

                                {enableCalls && (
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                React.startTransition(() => {
                                                    setCallType("audio")
                                                    setCallOpen(true)
                                                    setProfileOpen(false)
                                                })
                                            }}
                                            style={{
                                                flex: 1,
                                                border: `1px solid ${border}`,
                                                borderRadius: 14,
                                                padding: "10px 12px",
                                                cursor: "pointer",
                                                background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.6)",
                                                color: isDark ? "#FFFFFF" : "#000000",
                                                ...(messageFont || {}),
                                            }}
                                            aria-label="Start audio call"
                                        >
                                            {audioCallLabel}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                React.startTransition(() => {
                                                    setCallType("video")
                                                    setCallOpen(true)
                                                    setProfileOpen(false)
                                                })
                                            }}
                                            style={{
                                                flex: 1,
                                                border: `1px solid ${border}`,
                                                borderRadius: 14,
                                                padding: "10px 12px",
                                                cursor: "pointer",
                                                background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.6)",
                                                color: isDark ? "#FFFFFF" : "#000000",
                                                ...(messageFont || {}),
                                            }}
                                            aria-label="Start video call"
                                        >
                                            {videoCallLabel}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                                <div
                                    style={{
                                        border: `1px solid ${border}`,
                                        borderRadius: 14,
                                        padding: 12,
                                        ...(messageFont || {}),
                                        color: isDark ? "#FFFFFF" : "#000000",
                                    }}
                                >
                                    {callType === "video"
                                        ? "Video call preview isn’t available in Framer preview. This is a UI-only simulation."
                                        : "Audio call preview isn’t available in Framer preview. This is a UI-only simulation."}
                                </div>
                                <button
                                    type="button"
                                    onClick={closeOverlays}
                                    style={{
                                        border: "none",
                                        borderRadius: 14,
                                        padding: "10px 12px",
                                        cursor: "pointer",
                                        background: "#E53935",
                                        color: "#FFFFFF",
                                        ...(messageFont || {}),
                                    }}
                                    aria-label="End call"
                                >
                                    End call
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div
                ref={scrollPanelRef}
                onScroll={(e) => {
                    if (!enableLazyLoading) return
                    if (!canLoadOlder) return
                    const el = e.currentTarget
                    if (el.scrollTop <= 20) {
                        loadOlder()
                    }
                }}
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    background: panelBg,
                    border: `1px solid ${border}`,
                    borderRadius: radius,
                    padding: Math.max(10, Math.round(padding * 0.75)),
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    overflow: "auto",
                    boxSizing: "border-box",
                    backdropFilter: isDark ? "blur(14px)" : "blur(10px)",
                    WebkitBackdropFilter: isDark ? "blur(14px)" : "blur(10px)",
                }}
            >
                {enableSearch && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input
                            value={searchQuery}
                            onChange={(e) => {
                                const v = e.target.value
                                React.startTransition(() => setSearchQuery(v))
                            }}
                            placeholder={searchPlaceholder}
                            aria-label="Search messages"
                            style={{
                                width: "100%",
                                border: `1px solid ${border}`,
                                borderRadius: 999,
                                padding: "10px 12px",
                                outline: "none",
                                background: isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.6)",
                                color: isDark ? "#FFFFFF" : "#000000",
                                ...(messageFont || {}),
                            }}
                        />
                    </div>
                )}

                {canLoadOlder && (
                    <button
                        type="button"
                        onClick={loadOlder}
                        style={{
                            border: `1px solid ${border}`,
                            borderRadius: 12,
                            padding: "10px 12px",
                            cursor: "pointer",
                            background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.6)",
                            color: isDark ? "#FFFFFF" : "#000000",
                            ...(messageFont || {}),
                        }}
                        aria-label="Load older messages"
                    >
                        Load older messages
                    </button>
                )}

                <style>{`\n                    @keyframes aiDots {\n                        0% { opacity: 0.25; transform: translateY(0px); }\n                        50% { opacity: 1; transform: translateY(-1px); }\n                        100% { opacity: 0.25; transform: translateY(0px); }\n                    }\n                `}</style>

                {visibleMessages.length === 0 ? (
                    <p style={{ margin: 0, opacity: 0.7, ...(messageFont || {}), color: isDark ? "#FFFFFF" : "#000000" }}>
                        {enableSearch && searchQuery.trim().length ? "No results." : "Add messages to begin."}
                    </p>
                ) : (
                    visibleMessages.map((m) => {
                        const isUser = m.role === "user"
                        const bubbleBg = isUser ? userBubble : aiBubble
                        const bubbleText = isUser ? userTextColor : aiTextColor
                        const stamp = formatTimestamp(m.ts)
                        const originalIndex = m.index
                        const isEditing = interactive && editingIndex === originalIndex
                        const canEditNow = interactive && allowEdit && canEditMessage(messages[originalIndex], safeEditWindow)
                        const menuOpen = interactive && menuIndex === originalIndex
                        const menuAllowed = interactive && isUser
                        const canReactNow = interactive && enableReactions
                        const reaction = reactions[originalIndex] || (messages[originalIndex] as any)?.reaction || m.reaction
                        const status: MessageStatus | undefined = (messages[originalIndex] as any)?.status || (m as any)?.status
                        const attachment = (messages[originalIndex] as any)?.attachment || (m as any)?.attachment
                        const quote = (messages[originalIndex] as any)?.quote || (m as any)?.quote

                        return (
                            <div
                                key={m.key}
                                style={{
                                    display: "flex",
                                    justifyContent: isUser ? "flex-end" : "flex-start",
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: "85%",
                                        padding: "10px 12px",
                                        borderRadius: 18,
                                        background: bubbleBg,
                                        color: bubbleText,
                                        border: `1px solid ${border}`,
                                        ...(messageFont || {}),
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6,
                                        position: "relative",
                                    }}
                                    role="article"
                                    aria-label={isUser ? "User message" : "AI message"}
                                    onDoubleClick={
                                        canReactNow && safeReactionEmojis[0]
                                            ? () => setReaction(originalIndex, safeReactionEmojis[0])
                                            : undefined
                                    }
                                >
                                    {isEditing ? (
                                        <input
                                            value={editingValue}
                                            onChange={(e) => {
                                                const v = e.target.value
                                                React.startTransition(() => setEditingValue(v))
                                            }}
                                            onKeyDown={onEditKeyDown}
                                            aria-label="Edit message"
                                            style={{
                                                width: "100%",
                                                border: `1px solid ${border}`,
                                                borderRadius: 12,
                                                padding: "10px 10px",
                                                outline: "none",
                                                background: isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.7)",
                                                color: bubbleText,
                                                ...(messageFont || {}),
                                            }}
                                        />
                                    ) : (
                                        <>
                                            {quote?.text ? (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        borderLeft: `3px solid ${border}`,
                                                        paddingLeft: 10,
                                                        paddingTop: 6,
                                                        paddingBottom: 6,
                                                        borderRadius: 10,
                                                        background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)",
                                                        boxSizing: "border-box",
                                                    }}
                                                    aria-label="Quoted message"
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            opacity: 0.85,
                                                            marginBottom: 2,
                                                            color: bubbleText,
                                                        }}
                                                        aria-hidden="true"
                                                    >
                                                        {quote.role === "user" ? userName : "AI"}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            opacity: 0.85,
                                                            color: bubbleText,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                        }}
                                                    >
                                                        {quote.text}
                                                    </div>
                                                </div>
                                            ) : null}
                                            {attachment?.url ? (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        borderRadius: 14,
                                                        overflow: "hidden",
                                                        border: `1px solid ${border}`,
                                                        background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)",
                                                    }}
                                                    aria-label="Message attachment"
                                                >
                                                    {attachment.kind === "image" ? (
                                                        <img
                                                            src={attachment.url}
                                                            alt={attachment.name || ""}
                                                            style={{ width: "100%", height: "auto", display: "block" }}
                                                        />
                                                    ) : attachment.kind === "video" ? (
                                                        <video
                                                            src={attachment.url}
                                                            controls
                                                            style={{ width: "100%", height: "auto", display: "block" }}
                                                        />
                                                    ) : (
                                                        <a
                                                            href={attachment.url}
                                                            download={attachment.name}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 8,
                                                                padding: "10px 12px",
                                                                color: bubbleText,
                                                                textDecoration: "none",
                                                            }}
                                                        >
                                                            <span aria-hidden="true">📄</span>
                                                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                                                >{attachment.name || "Document"}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            ) : null}
                                            {m.text ? <span>{m.text}</span> : null}
                                        </>
                                    )}

                                    {reaction ? (
                                        <div
                                            style={{
                                                alignSelf: "flex-start",
                                                padding: "2px 8px",
                                                borderRadius: 999,
                                                border: `1px solid ${border}`,
                                                background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.6)",
                                                fontSize: "12px",
                                                lineHeight: "1.4em",
                                                width: "max-content",
                                            }}
                                            aria-label="Message reaction"
                                        >
                                            {reaction}
                                        </div>
                                    ) : null}

                                    {(stamp || menuAllowed || isEditing || m.edited) && (
                                        <div
                                            style={{
                                                alignSelf: "flex-end",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                opacity: 0.8,
                                                position: "relative",
                                            }}
                                        >
                                            {m.edited ? (
                                                <span style={{ fontSize: "12px", lineHeight: "1em" }} aria-hidden="true">
                                                    edited
                                                </span>
                                            ) : null}
                                            {stamp ? (
                                                <span style={{ fontSize: "12px", lineHeight: "1em" }} aria-hidden="true">
                                                    {stamp}
                                                </span>
                                            ) : null}
                                            {isUser && enableStatus ? (
                                                <span
                                                    style={{
                                                        fontSize: "12px",
                                                        lineHeight: "1em",
                                                        color: status === "read" ? "#4FC3F7" : bubbleText,
                                                    }}
                                                    aria-label={status ? `Message ${status}` : "Message status"}
                                                >
                                                    {status === "sent" ? "✓" : status === "delivered" ? "✓✓" : status === "read" ? "✓✓" : ""}
                                                </span>
                                            ) : null}
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={saveEdit}
                                                        style={{
                                                            border: `1px solid ${border}`,
                                                            borderRadius: 999,
                                                            padding: "6px 10px",
                                                            cursor: "pointer",
                                                            background: "transparent",
                                                            color: bubbleText,
                                                            ...(messageFont || {}),
                                                        }}
                                                        aria-label="Save edit"
                                                    >
                                                        {saveLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        style={{
                                                            border: `1px solid ${border}`,
                                                            borderRadius: 999,
                                                            padding: "6px 10px",
                                                            cursor: "pointer",
                                                            background: "transparent",
                                                            color: bubbleText,
                                                            ...(messageFont || {}),
                                                        }}
                                                        aria-label="Cancel edit"
                                                    >
                                                        {cancelLabel}
                                                    </button>
                                                </>
                                            ) : menuAllowed ? (
                                                <div ref={menuOpen ? menuRef : undefined} style={{ position: "relative" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleMenu(originalIndex)}
                                                        style={{
                                                            border: `1px solid ${border}`,
                                                            borderRadius: 999,
                                                            padding: "6px 10px",
                                                            cursor: "pointer",
                                                            background: "transparent",
                                                            color: bubbleText,
                                                            ...(messageFont || {}),
                                                            lineHeight: "1em",
                                                        }}
                                                        aria-label="Message actions"
                                                    >
                                                        ⋮
                                                    </button>
                                                    {menuOpen && (
                                                        <div
                                                            style={{
                                                                position: "absolute",
                                                                right: 0,
                                                                bottom: "calc(100% + 8px)",
                                                                minWidth: 160,
                                                                background: isDark ? "rgba(20,20,22,0.92)" : "rgba(255,255,255,0.95)",
                                                                border: `1px solid ${border}`,
                                                                borderRadius: 12,
                                                                overflow: "hidden",
                                                                boxShadow: isDark
                                                                    ? "0 10px 30px rgba(0,0,0,0.5)"
                                                                    : "0 10px 30px rgba(0,0,0,0.15)",
                                                                zIndex: 10,
                                                            }}
                                                            role="menu"
                                                            aria-label="Message menu"
                                                        >
                                                            {enableReactions && safeReactionEmojis.length > 0 && (
                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        gap: 6,
                                                                        padding: "10px 10px 8px",
                                                                        borderBottom: `1px solid ${border}`,
                                                                        justifyContent: "flex-start",
                                                                        flexWrap: "wrap",
                                                                    }}
                                                                    role="group"
                                                                    aria-label="Reactions"
                                                                >
                                                                    {safeReactionEmojis.map((e) => (
                                                                        <button
                                                                            key={e}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setReaction(originalIndex, e)
                                                                                React.startTransition(() => setMenuIndex(null))
                                                                            }}
                                                                            style={{
                                                                                border: `1px solid ${border}`,
                                                                                borderRadius: 999,
                                                                                padding: "6px 8px",
                                                                                cursor: "pointer",
                                                                                background: "transparent",
                                                                                color: isDark ? "#FFFFFF" : "#000000",
                                                                                ...(messageFont || {}),
                                                                                lineHeight: "1em",
                                                                            }}
                                                                            aria-label={`React ${e}`}
                                                                        >
                                                                            {e}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setReplyTo(originalIndex)
                                                                    React.startTransition(() => setMenuIndex(null))
                                                                }}
                                                                style={{
                                                                    width: "100%",
                                                                    textAlign: "left",
                                                                    padding: "10px 12px",
                                                                    border: "none",
                                                                    background: "transparent",
                                                                    color: isDark ? "#FFFFFF" : "#000000",
                                                                    cursor: "pointer",
                                                                    ...(messageFont || {}),
                                                                }}
                                                                role="menuitem"
                                                            >
                                                                Reply
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    forwardMessage(messages[originalIndex]?.text || m.text)
                                                                    React.startTransition(() => setMenuIndex(null))
                                                                }}
                                                                style={{
                                                                    width: "100%",
                                                                    textAlign: "left",
                                                                    padding: "10px 12px",
                                                                    border: "none",
                                                                    background: "transparent",
                                                                    color: isDark ? "#FFFFFF" : "#000000",
                                                                    cursor: "pointer",
                                                                    ...(messageFont || {}),
                                                                }}
                                                                role="menuitem"
                                                            >
                                                                Forward
                                                            </button>
                                                            {canEditNow && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        startEdit(originalIndex)
                                                                        React.startTransition(() => setMenuIndex(null))
                                                                    }}
                                                                    style={{
                                                                        width: "100%",
                                                                        textAlign: "left",
                                                                        padding: "10px 12px",
                                                                        border: "none",
                                                                        background: "transparent",
                                                                        color: isDark ? "#FFFFFF" : "#000000",
                                                                        cursor: "pointer",
                                                                        ...(messageFont || {}),
                                                                    }}
                                                                    role="menuitem"
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
                {interactive && aiTyping && (
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <div
                            style={{
                                maxWidth: "85%",
                                padding: "10px 12px",
                                borderRadius: 18,
                                background: aiBubble,
                                color: aiTextColor,
                                border: `1px solid ${border}`,
                                ...(messageFont || {}),
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                            aria-label="AI typing"
                        >
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: aiTextColor, animation: "aiDots 1s infinite" }} />
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: aiTextColor, animation: "aiDots 1s infinite 0.15s" }} />
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: aiTextColor, animation: "aiDots 1s infinite 0.3s" }} />
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {interactive && (
                <div
                    style={{
                        flex: "0 0 auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: panelBg,
                        border: `1px solid ${border}`,
                        borderRadius: Math.max(12, Math.round(radius * 0.9)),
                        padding: 10,
                        boxSizing: "border-box",
                        backdropFilter: isDark ? "blur(14px)" : "blur(10px)",
                        WebkitBackdropFilter: isDark ? "blur(14px)" : "blur(10px)",
                        flexDirection: "column",
                    }}
                    role="group"
                    aria-label="Message composer"
                >
                    {replyToIndex !== null && threadMessages[replyToIndex] && (
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                                border: `1px solid ${border}`,
                                borderRadius: 12,
                                padding: "8px 10px",
                                background: isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.6)",
                                boxSizing: "border-box",
                            }}
                            aria-label="Replying to message"
                        >
                            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: "12px", opacity: 0.85, ...(messageFont || {}), color: isDark ? "#FFFFFF" : "#000000" }}>Replying to</span>
                                <span
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.85,
                                        ...(messageFont || {}),
                                        color: isDark ? "#FFFFFF" : "#000000",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {threadMessages[replyToIndex].text}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReplyTo(null)}
                                style={{
                                    border: `1px solid ${border}`,
                                    borderRadius: 999,
                                    padding: "6px 10px",
                                    cursor: "pointer",
                                    background: "transparent",
                                    color: isDark ? "#FFFFFF" : "#000000",
                                    ...(messageFont || {}),
                                    whiteSpace: "nowrap",
                                }}
                                aria-label="Cancel reply"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10 }}>
                    {enableAttachments && (allowImageAttachments || allowVideoAttachments || allowDocumentAttachments) && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={buildAcceptString()}
                                onChange={onFileChange}
                                style={{ display: "none" }}
                                aria-hidden="true"
                                tabIndex={-1}
                            />
                            <button
                                type="button"
                                onClick={onPickFile}
                                style={{
                                    border: `1px solid ${border}`,
                                    borderRadius: 999,
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    background: isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.5)",
                                    color: isDark ? "#FFFFFF" : "#000000",
                                    ...(messageFont || {}),
                                    whiteSpace: "nowrap",
                                }}
                                aria-label="Attach file"
                            >
                                {attachLabel}
                            </button>
                        </>
                    )}
                    <input
                        value={composerValue}
                        onChange={(e) => {
                            const v = e.target.value
                            React.startTransition(() => setComposerValue(v))
                        }}
                        onKeyDown={onComposerKeyDown}
                        onFocus={() => React.startTransition(() => setComposerFocused(true))}
                        onBlur={() => React.startTransition(() => setComposerFocused(false))}
                        placeholder={inputPlaceholder}
                        aria-label="Type a message"
                        style={{
                            flex: 1,
                            minWidth: 0,
                            border: `1px solid ${border}`,
                            borderRadius: 999,
                            padding: "10px 12px",
                            outline: "none",
                            background: isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.6)",
                            color: isDark ? "#FFFFFF" : "#000000",
                            ...(messageFont || {}),
                        }}
                    />
                    <button
                        type="button"
                        onClick={sendMessage}
                        style={{
                            border: "none",
                            borderRadius: 999,
                            padding: "10px 14px",
                            cursor: "pointer",
                            background: isDark ? "rgba(37, 211, 102, 0.9)" : "#25D366",
                            color: "#0B0B0C",
                            ...(messageFont || {}),
                            whiteSpace: "nowrap",
                        }}
                        aria-label="Send message"
                    >
                        {sendLabel}
                    </button>
                    </div>
                </div>
            )}
        </section>
    )
}

addPropertyControls(AIConversationShowcase, {
    useScenes: {
        type: ControlType.Boolean,
        title: "Scenes",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => p.interactive,
    },
    scenes: {
        type: ControlType.Array,
        title: "Scenes",
        maxCount: 6,
        hidden: (p) => !p.useScenes || p.interactive,
        defaultValue: [
            {
                title: "Launch Post",
                messages: [
                    { role: "user", text: "Draft a short launch post for our new feature." },
                    { role: "ai", text: "Sure. What’s the feature and who’s the audience?" },
                    { role: "user", text: "A glass UI chat showcase for Framer. Audience: designers." },
                    {
                        role: "ai",
                        text: "Launching today: a glassmorphism chat showcase for Framer—smooth, modern, and fully customizable. Drop it into your site to demo AI conversations with style.",
                    },
                ],
            },
            {
                title: "UX Feedback",
                messages: [
                    { role: "user", text: "Give 3 quick UX improvements for a pricing page." },
                    {
                        role: "ai",
                        text: "1) Make one plan the default with a clear value badge. 2) Add concise feature bullets per tier. 3) Reduce friction with FAQs and trust signals near the CTA.",
                    },
                ],
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Scene",
                },
                messages: {
                    type: ControlType.Array,
                    title: "Messages",
                    maxCount: 12,
                    defaultValue: [
                        { role: "user", text: "Hello" },
                        { role: "ai", text: "Hi there" },
                    ],
                    control: {
                        type: ControlType.Object,
                        controls: {
                            role: {
                                type: ControlType.Enum,
                                title: "Role",
                                options: ["user", "ai"],
                                optionTitles: ["User", "AI"],
                                defaultValue: "ai",
                                displaySegmentedControl: true,
                            },
                            text: {
                                type: ControlType.String,
                                title: "Text",
                                defaultValue: "Hello from the assistant.",
                                displayTextArea: true,
                            },
                        },
                    },
                },
            },
        },
    },
    sceneDelayMs: {
        type: ControlType.Number,
        title: "Scene Delay",
        defaultValue: 1200,
        min: 0,
        max: 12000,
        step: 50,
        unit: "ms",
        hidden: (p) => !p.useScenes || p.interactive,
    },

    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Conversation",
    },

    userName: {
        type: ControlType.String,
        title: "User Name",
        defaultValue: "You",
    },
    userAvatar: {
        type: ControlType.ResponsiveImage,
        title: "User Avatar",
    },
    profileStatus: {
        type: ControlType.String,
        title: "Status",
        defaultValue: "Online",
    },

    enableCalls: {
        type: ControlType.Boolean,
        title: "Calls",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.interactive,
    },
    audioCallLabel: {
        type: ControlType.String,
        title: "Audio Label",
        defaultValue: "Audio Call",
        hidden: (p) => !p.interactive || !p.enableCalls,
    },
    videoCallLabel: {
        type: ControlType.String,
        title: "Video Label",
        defaultValue: "Video Call",
        hidden: (p) => !p.interactive || !p.enableCalls,
    },

    enableReactions: {
        type: ControlType.Boolean,
        title: "Reactions",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.interactive,
    },
    reactionEmojis: {
        type: ControlType.Array,
        title: "Emojis",
        maxCount: 8,
        hidden: (p) => !p.interactive || !p.enableReactions,
        defaultValue: ["👍", "❤️", "😂", "😮", "😢", "🙏"],
        control: {
            type: ControlType.String,
            title: "Emoji",
            defaultValue: "👍",
        },
    },

    enableStatus: {
        type: ControlType.Boolean,
        title: "Status",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.interactive,
    },
    deliveredDelayMs: {
        type: ControlType.Number,
        title: "Delivered",
        defaultValue: 700,
        min: 0,
        max: 12000,
        step: 50,
        unit: "ms",
        hidden: (p) => !p.interactive || !p.enableStatus,
    },
    readDelayMs: {
        type: ControlType.Number,
        title: "Read",
        defaultValue: 1600,
        min: 0,
        max: 20000,
        step: 50,
        unit: "ms",
        hidden: (p) => !p.interactive || !p.enableStatus,
    },

    enableAttachments: {
        type: ControlType.Boolean,
        title: "Attach",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.interactive,
    },
    allowImageAttachments: {
        type: ControlType.Boolean,
        title: "Images",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.interactive || !p.enableAttachments,
    },
    allowVideoAttachments: {
        type: ControlType.Boolean,
        title: "Videos",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.interactive || !p.enableAttachments,
    },
    allowDocumentAttachments: {
        type: ControlType.Boolean,
        title: "Docs",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.interactive || !p.enableAttachments,
    },
    attachLabel: {
        type: ControlType.String,
        title: "Attach Label",
        defaultValue: "＋",
        hidden: (p) => !p.interactive || !p.enableAttachments,
    },

    messages: {
        type: ControlType.Array,
        title: "Messages",
        maxCount: 12,
        hidden: (p) => p.useScenes,
        defaultValue: [
            { role: "user", text: "Can you help me write a headline?" },
            { role: "ai", text: "Absolutely. What’s the product and audience?" },
            { role: "user", text: "A Framer component for chat demos." },
            { role: "ai", text: "Try: ‘Showcase AI conversations with a polished, customizable chat UI.’" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                role: {
                    type: ControlType.Enum,
                    title: "Role",
                    options: ["user", "ai"],
                    optionTitles: ["User", "AI"],
                    defaultValue: "ai",
                    displaySegmentedControl: true,
                },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "Hello from the assistant.",
                    displayTextArea: true,
                },
            },
        },
    },

    interactive: {
        type: ControlType.Boolean,
        title: "Interactive",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    inputPlaceholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Type a message…",
        hidden: (p) => !p.interactive,
    },
    sendLabel: {
        type: ControlType.String,
        title: "Send",
        defaultValue: "Send",
        hidden: (p) => !p.interactive,
    },
    replyMode: {
        type: ControlType.Enum,
        title: "Reply",
        options: ["smart", "preset", "echo"],
        optionTitles: ["Smart", "Preset", "Echo"],
        defaultValue: "smart",
        displaySegmentedControl: true,
        hidden: (p) => !p.interactive,
    },
    presetReplies: {
        type: ControlType.Array,
        title: "Replies",
        maxCount: 12,
        hidden: (p) => !p.interactive || p.replyMode !== "preset",
        defaultValue: [
            "Sure — tell me more.",
            "Okay. What’s your goal?",
            "Got it. Here’s a quick suggestion…",
        ],
        control: {
            type: ControlType.String,
            title: "Reply",
            defaultValue: "Got it.",
        },
    },
    replyDelayMs: {
        type: ControlType.Number,
        title: "Reply Delay",
        defaultValue: 700,
        min: 0,
        max: 12000,
        step: 50,
        unit: "ms",
        hidden: (p) => !p.interactive,
    },
    maxMessages: {
        type: ControlType.Number,
        title: "Max Msgs",
        defaultValue: 60,
        min: 4,
        max: 200,
        step: 1,
        hidden: (p) => !p.interactive,
    },

    allowEdit: {
        type: ControlType.Boolean,
        title: "Edit",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.interactive,
    },
    editWindowMs: {
        type: ControlType.Number,
        title: "Edit Window",
        defaultValue: 30_000,
        min: 0,
        max: 600_000,
        step: 1000,
        unit: "ms",
        hidden: (p) => !p.interactive || !p.allowEdit,
    },
    editLabel: {
        type: ControlType.String,
        title: "Edit Label",
        defaultValue: "Edit",
        hidden: (p) => !p.interactive || !p.allowEdit,
    },
    saveLabel: {
        type: ControlType.String,
        title: "Save Label",
        defaultValue: "Save",
        hidden: (p) => !p.interactive || !p.allowEdit,
    },
    cancelLabel: {
        type: ControlType.String,
        title: "Cancel Label",
        defaultValue: "Cancel",
        hidden: (p) => !p.interactive || !p.allowEdit,
    },

    enableSearch: {
        type: ControlType.Boolean,
        title: "Search",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    enableLazyLoading: {
        type: ControlType.Boolean,
        title: "Lazy Load",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    initialVisibleMessages: {
        type: ControlType.Number,
        title: "Initial Msgs",
        defaultValue: 40,
        min: 10,
        max: 200,
        step: 1,
        hidden: (p) => !p.enableLazyLoading,
    },
    lazyBatchSize: {
        type: ControlType.Number,
        title: "Load Batch",
        defaultValue: 20,
        min: 5,
        max: 200,
        step: 1,
        hidden: (p) => !p.enableLazyLoading,
    },

    searchPlaceholder: {
        type: ControlType.String,
        title: "Search Placeholder",
        defaultValue: "Search messages…",
        hidden: (p) => !p.enableSearch,
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => p.interactive,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => p.interactive,
    },
    typingMsPerChar: {
        type: ControlType.Number,
        title: "Typing",
        defaultValue: 18,
        min: 8,
        max: 200,
        step: 1,
        unit: "ms",
        hidden: (p) => p.interactive,
    },
    messageDelayMs: {
        type: ControlType.Number,
        title: "Msg Delay",
        defaultValue: 400,
        min: 0,
        max: 4000,
        step: 50,
        unit: "ms",
        hidden: (p) => p.interactive,
    },
    loopDelayMs: {
        type: ControlType.Number,
        title: "Loop Delay",
        defaultValue: 900,
        min: 0,
        max: 8000,
        step: 50,
        unit: "ms",
        hidden: (p) => !p.loop || p.useScenes || p.interactive,
    },

    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    panelColor: {
        type: ControlType.Color,
        title: "Panel",
        defaultValue: "#F5F5F5",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#000000",
    },
    userBubble: {
        type: ControlType.Color,
        title: "User Bubble",
        defaultValue: "#000000",
    },
    aiBubble: {
        type: ControlType.Color,
        title: "AI Bubble",
        defaultValue: "#CCCCCC",
    },
    userTextColor: {
        type: ControlType.Color,
        title: "User Text",
        defaultValue: "#FFFFFF",
    },
    aiTextColor: {
        type: ControlType.Color,
        title: "AI Text",
        defaultValue: "#000000",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    messageFont: {
        type: ControlType.Font,
        title: "Message Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },

    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
})

// Ensure Framer can always detect the component name
AIConversationShowcase.displayName = "AIConversationShowcase"