// Chat sequence component with sender/receiver text color distinction for each theme
import React, { useState, useEffect, useRef, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useReducedMotion, useInView } from "framer-motion"

// === THEME PRESETS ===
const themes = {
    iMessage: {
        receiverColor: "#e5e5ea",
        receiverTextColor: "#000000",
        senderGradient: false,
        senderColor: "#007aff",
        senderGradientStart: "#007aff",
        senderGradientEnd: "#0051a8",
        senderTextColor: "#ffffff",
    },
    WhatsApp: {
        receiverColor: "#ffffff",
        receiverTextColor: "#000000",
        senderGradient: true,
        senderColor: "#075e54",
        senderGradientStart: "#25d366",
        senderGradientEnd: "#075e54",
        senderTextColor: "#ffffff",
    },
    Messenger: {
        receiverColor: "#f1f0f0",
        receiverTextColor: "#000000",
        senderGradient: true,
        senderColor: "#0084ff",
        senderGradientStart: "#0084ff",
        senderGradientEnd: "#006aff",
        senderTextColor: "#ffffff",
    },
    Custom: {}
} as const

type ThemeKey = keyof typeof themes

interface ChatSequenceProps {
    message1: string
    message2: string
    message3: string
    showMessage3: boolean
    startWithSender: boolean
    typingDurationMs: number | "auto"
    messageRevealGapMs: number
    receiverColor?: string
    senderColor?: string
    senderGradient?: boolean
    senderGradientStart?: string
    senderGradientEnd?: string
    receiverTextColor?: string
    senderTextColor?: string
    textColor?: string
    font?: any
    borderRadius?: number
    triggerMode?: "auto" | "click" | "hover" | "inView"
    resetOnTrigger?: boolean
    onMessageComplete?: () => void
    onSequenceComplete?: () => void
    style?: CSSProperties
    theme?: ThemeKey
    autoTextColor?: boolean
    /** New: Array of steps/messages for extensibility. If present, this takes precedence. */
    messages?: { text: string; sender: boolean }[]
    // Add new optional props for receiver gradient to match controls
    receiverGradient?: boolean
    receiverGradientStart?: string
    receiverGradientEnd?: string
}

type Stage = "typing" | "message"

const TypingIndicator: React.FC<{
    sender: boolean
    colors: { receiver: string; sender: string; receiverText: string; senderText: string; text: string }
    font: any
}> = ({ sender, colors, font }) => {
    const reduced = useReducedMotion()
    const bubbleColor = sender ? colors.sender : colors.receiver
    const textColor = sender ? colors.senderText : colors.receiverText
    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
                alignSelf: sender ? "flex-end" : "flex-start",
                background: bubbleColor,
                color: textColor,
                borderRadius: 16,
                padding: "12px 16px",
                maxWidth: "80%",
                display: "flex",
                gap: 4,
                alignItems: "center",
                ...font
            }}
        >
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: textColor,
                        display: "block"
                    }}
                    animate={reduced ? { opacity: 0.6 } : { opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </motion.div>
    )
}

const MessageBubble: React.FC<{
    text: string
    sender: boolean
    colors: { receiver: string; sender: string; receiverText: string; senderText: string; text: string }
    font: any
    borderRadius: number
}> = ({ text, sender, colors, font, borderRadius }) => {
    const bubbleColor = sender ? colors.sender : colors.receiver
    const textColor = sender ? colors.senderText : colors.receiverText
    const parseText = (text: string): React.ReactNode => {
        const parts = text.split(/\*\*(.*?)\*\*/g)
        return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
    }
    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
                alignSelf: sender ? "flex-end" : "flex-start",
                background: bubbleColor,
                color: textColor,
                borderRadius,
                padding: "12px 16px",
                maxWidth: "80%",
                wordBreak: "break-word",
                ...font
            }}
        >
            {parseText(text)}
        </motion.div>
    )
}

// Utility functions
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const isHex = (s?: string) => !!s && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)
const normalizeHex = (hex?: string, fallback = "#000000") => {
    if (!isHex(hex)) return fallback
    const h = hex!.replace("#", "")
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
    return `#${full}`.toLowerCase()
}
const contrastYIQ = (hex?: string) => {
    const safe = normalizeHex(hex, "#000000")
    const r = parseInt(safe.slice(1, 3), 16)
    const g = parseInt(safe.slice(3, 5), 16)
    const b = parseInt(safe.slice(5, 7), 16)
    return ((r * 299 + g * 587 + b * 114) / 1000) >= 128 ? "#000000" : "#FFFFFF"
}
const autoDuration = (msg: string) => {
    const cps = 12
    return clamp(Math.round(((msg?.length || 0) / cps) * 1000), 600, 3200)
}

// Central theme/colors logic
function resolveTheme(opts: {
    theme: ThemeKey
    autoTextColor: boolean
    receiverColor?: string
    receiverTextColor?: string
    receiverGradient?: boolean
    receiverGradientStart?: string
    receiverGradientEnd?: string
    senderGradient?: boolean
    senderColor?: string
    senderGradientStart?: string
    senderGradientEnd?: string
    senderTextColor?: string
}) {
    const {
        theme,
        autoTextColor,
        receiverColor,
        receiverTextColor,
        receiverGradient,
        receiverGradientStart,
        receiverGradientEnd,
        senderGradient,
        senderColor,
        senderGradientStart,
        senderGradientEnd,
        senderTextColor,
    } = opts
    if (theme !== "Custom") {
        const t = themes[theme] as any
        const senderSample = t.senderGradient ? t.senderGradientEnd : t.senderColor
        return {
            receiver: t.receiverColor,
            sender: t.senderGradient
                ? `linear-gradient(135deg, ${t.senderGradientStart}, ${t.senderGradientEnd})`
                : t.senderColor,
            receiverText: autoTextColor ? contrastYIQ(t.receiverColor) : (t.receiverTextColor ?? "#000000"),
            senderText: autoTextColor ? contrastYIQ(senderSample) : (t.senderTextColor ?? "#000000"),
            text: "#000000",
        }
    }
    const rc = receiverColor ?? "#f1f0f0"
    const rg = !!receiverGradient
    const rgs = receiverGradientStart ?? "#f1f0f0"
    const rge = receiverGradientEnd ?? "#e5e5ea"
    const sg = !!senderGradient
    const sc = senderColor ?? "#0084ff"
    const sgs = senderGradientStart ?? "#0084ff"
    const sge = senderGradientEnd ?? "#0066cc"
    const senderSample = sg ? sge : sc
    const receiverSample = rg ? rge : rc
    return {
        receiver: rg ? `linear-gradient(135deg, ${rgs}, ${rge})` : rc,
        sender: sg ? `linear-gradient(135deg, ${sgs}, ${sge})` : sc,
        receiverText: autoTextColor ? contrastYIQ(receiverSample) : (receiverTextColor ?? "#000000"),
        senderText: autoTextColor ? contrastYIQ(senderSample) : (senderTextColor ?? "#000000"),
        text: "#000000",
    }
}

/**
 * Chat Sequence - Animated chat conversation with typing indicators
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ChatSequence(props: ChatSequenceProps) {
    const {
        message1 = "Need a way to manage all my projects in one place.",
        message2 = "FlowDesk keeps tasks, chat, and files together so your team never loses track.",
        message3 = "Can I invite clients?",
        showMessage3 = false,
        startWithSender = false,
        typingDurationMs = "auto",
        messageRevealGapMs = 600,
        theme = "iMessage",
        autoTextColor = true,
        receiverColor,
        receiverTextColor,
        receiverGradient = false,
        receiverGradientStart = "#f1f0f0",
        receiverGradientEnd = "#e5e5ea",
        senderGradient,
        senderColor,
        senderGradientStart,
        senderGradientEnd,
        senderTextColor,
        textColor = "#000000",
        font = { fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif" },
        borderRadius = 16,
        triggerMode = "auto",
        resetOnTrigger = true,
        onMessageComplete,
        onSequenceComplete,
        style,
        messages,
    } = props

    // Build sequence from array or legacy fields
    const sequence = React.useMemo(() => {
        if (Array.isArray(messages) && messages.length > 0) return messages
        const steps = [
            { text: message1, sender: startWithSender },
            { text: message2, sender: !startWithSender },
        ]
        if (showMessage3) steps.push({ text: message3, sender: startWithSender })
        return steps
    }, [messages, message1, message2, message3, showMessage3, startWithSender])
    const durations = useMemo(
        () => sequence.map((s) => (typingDurationMs === "auto" ? autoDuration(s.text) : typingDurationMs as number)),
        [sequence, typingDurationMs]
    )
    const colors = useMemo(
        () =>
            resolveTheme({
                theme,
                autoTextColor,
                receiverColor,
                receiverTextColor,
                receiverGradient,
                receiverGradientStart,
                receiverGradientEnd,
                senderGradient,
                senderColor,
                senderGradientStart,
                senderGradientEnd,
                senderTextColor,
            }),
        [theme, autoTextColor, receiverColor, receiverTextColor, receiverGradient, receiverGradientStart, receiverGradientEnd, senderGradient, senderColor, senderGradientStart, senderGradientEnd, senderTextColor]
    )
    const [hasStarted, setHasStarted] = useState(false)
    const [index, setIndex] = useState(0)
    const [stage, setStage] = useState<Stage>("typing")
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.3 })
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])
    useEffect(() => {
        if (
            (triggerMode === "inView" && isInView && !hasStarted) ||
            (triggerMode === "auto" && !hasStarted)
        ) {
            startTransition(() => { setHasStarted(true); setIndex(0); setStage("typing") })
        }
    }, [triggerMode, isInView, hasStarted])

    const handleTrigger = () => {
        if (resetOnTrigger || !hasStarted) {
            startTransition(() => { setHasStarted(true); setIndex(0); setStage("typing") })
        }
    }
    const handleClick = () => { if (triggerMode === "click") handleTrigger() }
    const handleMouseEnter = () => { if (triggerMode === "hover") handleTrigger() }
    useEffect(() => {
        if (!hasStarted) return
        if (sequence.length === 0) { onSequenceComplete?.(); return }
        // ADDED sequence length correction guard
        if (index >= sequence.length) {
            setIndex(0)
            setStage("typing")
            return
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        const wait = stage === "typing" ? durations[index] : messageRevealGapMs
        timeoutRef.current = setTimeout(() => {
            startTransition(() => {
                if (stage === "typing") {
                    setStage("message")
                    onMessageComplete?.()
                } else {
                    const next = index + 1
                    if (next < sequence.length) {
                        setIndex(next)
                        setStage("typing")
                    } else {
                        onSequenceComplete?.()
                    }
                }
            })
        }, wait)
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
    }, [hasStarted, index, stage, sequence, durations, messageRevealGapMs, onMessageComplete, onSequenceComplete])

    // ADDED: resets index and stage if sequence array shrinks while animating
    useEffect(() => {
        if (index >= sequence.length) {
            setIndex(0)
            setStage("typing")
        }
    }, [sequence.length])
    return (
        <div
            ref={containerRef}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                width: '100%',
                height: '100%',
                padding: 16,
                backgroundColor: 'transparent',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                cursor: triggerMode === 'click' || triggerMode === 'hover' ? 'pointer' : 'default',
                position: 'relative',
                justifyContent: 'flex-end', // chat bubbles should stack upwards from bottom
                ...style
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
                {sequence.map((step, i) => {
                    // Always display every message so far as a MessageBubble
                    // Typing indicator only for the next message about to be shown
                    const isActive = i === index
                    return (
                        <React.Fragment key={`row-${i}`}>
                            {/* Show the typing indicator if this is the next message and we're in typing */}
                            {isActive && stage === "typing" && (
                                <TypingIndicator sender={step.sender} colors={{ ...colors, text: textColor! }} font={font} />
                            )}
                            {/* Show the message bubble if this message has already been reached or typed */}
                            {(i < index || (isActive && stage === "message")) && (
                                <MessageBubble 
                                    text={step.text} 
                                    sender={step.sender} 
                                    colors={{ ...colors, text: textColor! }} 
                                    font={font} 
                                    borderRadius={borderRadius!} 
                                />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
            {!hasStarted && triggerMode !== 'auto' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: '#999999',
                        pointerEvents: 'none',
                        ...font
                    }}
                >
                    {triggerMode === 'click' && 'Click to start chat'}
                    {triggerMode === 'hover' && 'Hover to start chat'}
                    {triggerMode === 'inView' && 'Scroll to view chat'}
                </motion.div>
            )}
        </div>
    )
}

addPropertyControls(ChatSequence, {
    // Array-based flexible messages
    messages: {
        type: ControlType.Array,
        title: "Messages (array)",
        group: "Messages",
        defaultValue: [
            { text: "Need a way to manage all my projects in one place.", sender: false },
            { text: "FlowDesk keeps tasks, chat, and files together so your team never loses track.", sender: false },
            { text: "Can I invite clients?", sender: true },
            { text: "Sure, just share a link — no account needed.", sender: false },
            { text: "Is there a free plan?", sender: true },
            { text: "Yep, get started free at flowdesk.app.", sender: false }
        ],
        propertyControl: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Message Text",
                    displayTextArea: true,
                    defaultValue: "Type message..."
                },
                sender: {
                    type: ControlType.Boolean,
                    title: "Sender?",
                    enabledTitle: "Sender",
                    disabledTitle: "Receiver",
                    defaultValue: false
                },
            }
        },
    },
    // Messages
    message1: {
        type: ControlType.String,
        title: "Message 1 (from Receiver)",
        defaultValue: "Need a way to manage all my projects in one place.",
        group: "Messages",
        displayTextArea: true,
        hidden: (p) => Array.isArray(p.messages) && p.messages.length > 0
    },
    message2: {
        type: ControlType.String,
        title: "Message 2 (from Sender)",
        defaultValue: "FlowDesk keeps tasks, chat, and files together so your team never loses track.",
        group: "Messages",
        displayTextArea: true,
        hidden: (p) => Array.isArray(p.messages) && p.messages.length > 0
    },
    showMessage3: {
        type: ControlType.Boolean,
        title: "Show Message 3",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        group: "Messages",
        hidden: (p) => Array.isArray(p.messages) && p.messages.length > 0
    },
    message3: {
        type: ControlType.String,
        title: "Message 3 (optional)",
        defaultValue: "Can I invite clients?",
        group: "Messages",
        displayTextArea: true,
        hidden: (p) => Array.isArray(p.messages) && p.messages.length > 0 || !p.showMessage3
    },
    startWithSender: {
        type: ControlType.Boolean,
        title: "Start With",
        defaultValue: false,
        enabledTitle: "Sender",
        disabledTitle: "Receiver",
        group: "Messages",
        hidden: (p) => Array.isArray(p.messages) && p.messages.length > 0
    },
    // Pacing
    typingDurationMs: {
        type: ControlType.Enum,
        title: "Typing Duration",
        options: ["auto", 600, 900, 1200, 1500, 2000],
        optionTitles: ["Auto (natural)", "600ms", "900ms", "1200ms", "1500ms", "2000ms"],
        defaultValue: "auto",
        group: "Pacing",
        description: "Auto scales with message length"
    },
    messageRevealGapMs: {
        type: ControlType.Number,
        title: "Message Gap",
        defaultValue: 600,
        min: 100,
        max: 3000,
        step: 50,
        unit: "ms",
        group: "Pacing",
        description: "Delay between messages."
    },
    // Theme
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["iMessage", "WhatsApp", "Messenger", "Custom"],
        optionTitles: ["iMessage", "WhatsApp", "Messenger", "Custom"],
        defaultValue: "iMessage",
        group: "Theme"
    },
    autoTextColor: {
        type: ControlType.Boolean,
        title: "Auto Text Contrast",
        defaultValue: true,
        enabledTitle: "Auto",
        disabledTitle: "Manual",
        group: "Theme",
        description: "Auto text color based on bubble background"
    },
    // Custom receiver
    receiverColor: {
        type: ControlType.Color,
        title: "Receiver Bubble",
        defaultValue: "#f1f0f0",
        group: "Receiver Style",
        hidden: (p) => p.theme !== "Custom"
    },
    receiverTextColor: {
        type: ControlType.Color,
        title: "Receiver Text",
        defaultValue: "#000000",
        group: "Receiver Style",
        description: "Text color in receiver bubble",
        hidden: (p) => p.theme !== "Custom" || p.autoTextColor !== false,
    },
    // Add receiverGradient controls
    receiverGradient: {
        type: ControlType.Boolean,
        title: "Receiver Fill",
        defaultValue: false,
        enabledTitle: "Gradient",
        disabledTitle: "Solid",
        group: "Receiver Style",
        hidden: (p) => p.theme !== "Custom",
    },
    receiverGradientStart: {
        type: ControlType.Color,
        title: "Gradient Start",
        defaultValue: "#f1f0f0",
        group: "Receiver Style",
        hidden: (p) => p.theme !== "Custom" || !p.receiverGradient
    },
    receiverGradientEnd: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "#e5e5ea",
        group: "Receiver Style",
        hidden: (p) => p.theme !== "Custom" || !p.receiverGradient
    },
    // Custom sender
    senderGradient: {
        type: ControlType.Boolean,
        title: "Sender Fill",
        defaultValue: false,
        enabledTitle: "Gradient",
        disabledTitle: "Solid",
        group: "Sender Style",
        hidden: (p) => p.theme !== "Custom"
    },
    senderColor: {
        type: ControlType.Color,
        title: "Sender Bubble",
        defaultValue: "#0084ff",
        group: "Sender Style",
        hidden: (p) => p.theme !== "Custom" || p.senderGradient
    },
    senderGradientStart: {
        type: ControlType.Color,
        title: "Gradient Start",
        defaultValue: "#0084ff",
        group: "Sender Style",
        hidden: (p) => p.theme !== "Custom" || !p.senderGradient
    },
    senderGradientEnd: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "#0066cc",
        group: "Sender Style",
        hidden: (p) => p.theme !== "Custom" || !p.senderGradient
    },
    senderTextColor: {
        type: ControlType.Color,
        title: "Sender Text",
        defaultValue: "#000000",
        group: "Sender Style",
        description: "Text color in sender bubble",
        hidden: (p) => p.theme !== "Custom" || p.autoTextColor !== false,
    },
    // Style
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em"
        },
        group: "General Style"
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Bubble Radius",
        defaultValue: 16,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        group: "General Style"
    },
    textColor: {
        type: ControlType.Color,
        title: "Fallback Text Color",
        defaultValue: "#000000",
        group: "General Style",
        hidden: (p) => p.autoTextColor !== false && p.theme !== "Custom"
    },
    // Triggers
    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger Mode",
        options: ["auto", "click", "hover", "inView"],
        optionTitles: ["Auto Start", "On Click", "On Hover", "On Scroll"],
        defaultValue: "auto",
        group: "Triggers"
    },
    resetOnTrigger: {
        type: ControlType.Boolean,
        title: "Reset on Trigger",
        defaultValue: true,
        enabledTitle: "Reset",
        disabledTitle: "Once",
        group: "Triggers"
    },
})
