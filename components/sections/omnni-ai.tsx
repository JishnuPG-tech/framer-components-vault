import * as React from "react"
import { useState, useEffect, useRef } from "react"
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
 * AI Chat Simulator - Marketplace Standard (Stable Edition)
 * @framerIntrinsicWidth 450
 * @framerIntrinsicHeight 600
 */

export default function AIChatSim(props) {
    const {
        messages,
        typingSpeed,
        accentColor,
        borderRadius,
        botName,
        fontSize,
        showThinking,
        trigger,
        aiAvatar,
        userAvatar,
        showAvatars,
        backgroundColor,
        textColor,
        botBubbleColor,
        headerBgColor,
        borderColor,
        inputPlaceholder,
        inputBgColor,
        inputTextColor,
        buttonText,
        buttonBgColor,
        buttonTextColor,
        isGlass,
        blurAmount,
        shouldLoop,
        restartDelay,
    } = props

    const [visibleMessages, setVisibleMessages] = useState([])
    const [currentMsgIndex, setCurrentMsgIndex] = useState(0)
    const [displayedText, setDisplayedText] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [isThinking, setIsThinking] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)

    const scrollRef = useRef(null)
    const containerRef = useRef(null)

    const getGlassStyle = (solidColor, opacity = 0.4) => {
        if (!isGlass) return { background: solidColor }
        return {
            background: `rgba(255, 255, 255, ${opacity})`,
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
        }
    }

    const formatText = (text) => {
        if (typeof text !== "string") return ""
        const parts = text.split(/(\`{3}[\s\S]*?\`{3})/)
        return parts.map((part, i) => {
            if (part.startsWith("```")) {
                const code = part
                    .replace(/\`{3}(\w+)?/, "")
                    .replace(/\`{3}$/, "")
                return (
                    <pre
                        key={i}
                        style={{
                            background: "#000",
                            color: "#10B981",
                            padding: "12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            margin: "8px 0",
                            overflowX: "auto",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <code>{code}</code>
                    </pre>
                )
            }
            const lines = part.split("\n").map((line, j) => {
                let formattedLine = line
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>")
                    .replace(
                        /\`(.*?)\`/g,
                        `<code style='background:rgba(0,0,0,0.1);padding:2px 4px;border-radius:4px'>$1</code>`
                    )
                return (
                    <span
                        key={j}
                        dangerouslySetInnerHTML={{
                            __html: formattedLine + "<br/>",
                        }}
                    />
                )
            })
            return <span key={i}>{lines}</span>
        })
    }

    useEffect(() => {
        if (trigger === "scroll") {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setHasStarted(true)
                        observer.disconnect()
                    }
                },
                { threshold: 0.1 }
            )
            if (containerRef.current) observer.observe(containerRef.current)
            return () => observer.disconnect()
        } else {
            setHasStarted(true)
        }
    }, [trigger])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            })
        }
    }, [displayedText, visibleMessages, isThinking])

    useEffect(() => {
        if (!hasStarted || currentMsgIndex >= messages.length) return
        const msg = messages[currentMsgIndex]
        const contentStr = String(msg.content || "")

        if (msg.role === "user") {
            const timeout = setTimeout(() => {
                setVisibleMessages((prev) => [
                    ...prev,
                    { role: "user", content: contentStr },
                ])
                setCurrentMsgIndex((prev) => prev + 1)
            }, 800)
            return () => clearTimeout(timeout)
        } else {
            setIsThinking(true)
            const thinkingTimeout = setTimeout(
                () => {
                    setIsThinking(false)
                    setIsTyping(true)
                    let i = 0
                    const timer = setInterval(() => {
                        setDisplayedText(contentStr.slice(0, i + 1))
                        i++
                        if (i >= contentStr.length) {
                            clearInterval(timer)
                            setVisibleMessages((prev) => [
                                ...prev,
                                { role: "assistant", content: contentStr },
                            ])
                            setDisplayedText("")
                            setIsTyping(false)
                            setCurrentMsgIndex((prev) => prev + 1)
                        }
                    }, 1000 / typingSpeed)
                    return () => clearInterval(timer)
                },
                showThinking ? 1200 : 0
            )
            return () => clearTimeout(thinkingTimeout)
        }
    }, [currentMsgIndex, messages, typingSpeed, showThinking, hasStarted])

    useEffect(() => {
        if (
            shouldLoop &&
            currentMsgIndex === messages.length &&
            !isTyping &&
            !isThinking
        ) {
            const restartTimer = setTimeout(() => {
                setVisibleMessages([])
                setCurrentMsgIndex(0)
                setDisplayedText("")
            }, restartDelay * 1000)
            return () => clearTimeout(restartTimer)
        }
    }, [
        currentMsgIndex,
        isTyping,
        isThinking,
        shouldLoop,
        messages.length,
        restartDelay,
    ])

    const Avatar = ({ src, fallback }) => (
        <div
            style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                background: "#EEE",
                display: showAvatars ? "block" : "none",
            }}
        >
            {src ? (
                <img
                    src={src}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            ) : (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        background: accentColor,
                        color: "white",
                        fontSize: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {fallback}
                </div>
            )}
        </div>
    )

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                ...getGlassStyle(backgroundColor, 0.1),
                color: textColor,
                borderRadius,
                border: `1px solid ${borderColor}`,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: "Inter, sans-serif",
                fontSize: `${fontSize}px`,
            }}
        >
            <div
                style={{
                    padding: "14px 20px",
                    background: headerBgColor,
                    borderBottom: `1px solid ${borderColor}`,
                    fontWeight: 600,
                }}
            >
                {botName}
            </div>

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                {visibleMessages.map((m, i) => (
                    <div
                        key={i}
                        className="msg-animate"
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexDirection:
                                m.role === "user" ? "row-reverse" : "row",
                            alignSelf:
                                m.role === "user" ? "flex-end" : "flex-start",
                            maxWidth: "90%",
                        }}
                    >
                        <Avatar
                            src={m.role === "user" ? userAvatar : aiAvatar}
                            fallback={m.role === "user" ? "U" : "AI"}
                        />
                        <div
                            style={{
                                ...getGlassStyle(
                                    m.role === "user"
                                        ? accentColor
                                        : botBubbleColor,
                                    m.role === "user" ? 0.8 : 0.15
                                ),
                                background:
                                    m.role === "user"
                                        ? accentColor
                                        : isGlass
                                          ? "rgba(255,255,255,0.1)"
                                          : botBubbleColor,
                                color: m.role === "user" ? "#FFF" : textColor,
                                padding: "10px 14px",
                                borderRadius: "14px",
                                border: isGlass
                                    ? "1px solid rgba(255,255,255,0.1)"
                                    : "none",
                            }}
                        >
                            {formatText(m.content)}
                        </div>
                    </div>
                ))}

                {isThinking && (
                    <div
                        className="msg-animate"
                        style={{
                            display: "flex",
                            gap: "10px",
                            alignSelf: "flex-start",
                        }}
                    >
                        <Avatar src={aiAvatar} fallback="AI" />
                        <div
                            style={{
                                ...getGlassStyle(botBubbleColor, 0.15),
                                padding: "12px 18px",
                                borderRadius: "14px",
                                display: "flex",
                                gap: "4px",
                            }}
                        >
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="dot"
                                    style={{
                                        width: 4,
                                        height: 4,
                                        background: textColor,
                                        borderRadius: "50%",
                                        opacity: 0.4,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {isTyping && (
                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            alignSelf: "flex-start",
                            maxWidth: "90%",
                        }}
                    >
                        <Avatar src={aiAvatar} fallback="AI" />
                        <div
                            style={{
                                ...getGlassStyle(botBubbleColor, 0.15),
                                padding: "10px 14px",
                                borderRadius: "14px",
                            }}
                        >
                            {formatText(displayedText)}
                            <span style={{ marginLeft: "2px", opacity: 0.5 }}>
                                █
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{
                    padding: "12px 16px",
                    borderTop: `1px solid ${borderColor}`,
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        flex: 1,
                        padding: "10px 14px",
                        ...getGlassStyle(inputBgColor, 0.05),
                        borderRadius: "8px",
                        color: inputTextColor,
                        opacity: 0.7,
                        fontSize: "0.9em",
                    }}
                >
                    {inputPlaceholder}
                </div>
                <div
                    style={{
                        padding: "8px 16px",
                        background: buttonBgColor,
                        color: buttonTextColor,
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "0.85em",
                    }}
                >
                    {buttonText}
                </div>
            </div>

            <style>{`
                .msg-animate { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes popIn { 0% { opacity: 0; transform: translateY(10px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                .dot { animation: dot-bounce 1s infinite; }
                .dot:nth-child(2) { animation-delay: 0.2s; }
                .dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes dot-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
            `}</style>
        </div>
    )
}

addPropertyControls(AIChatSim, {
    trigger: {
        type: ControlType.Enum,
        options: ["immediate", "scroll"],
        defaultValue: "immediate",
    },
    messages: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                role: {
                    type: ControlType.Enum,
                    options: ["user", "assistant"],
                },
                content: { type: ControlType.String, displayTextArea: true },
            },
        },
        defaultValue: [
            { role: "user", content: "Is this version cleaner?" },
            {
                role: "assistant",
                content:
                    "Yes! I've removed the audio to ensure **100% stability** across all browsers.",
            },
        ],
    },
    // Design - Colors
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: "#0F172A",
        title: "Background",
    },
    textColor: {
        type: ControlType.Color,
        defaultValue: "#F1F5F9",
        title: "Text",
    },
    botBubbleColor: {
        type: ControlType.Color,
        defaultValue: "#1E293B",
        title: "Bot Bubble",
    },
    accentColor: {
        type: ControlType.Color,
        defaultValue: "#0070FF",
        title: "Accent/User",
    },
    headerBgColor: {
        type: ControlType.Color,
        defaultValue: "#0F172A",
        title: "Header",
    },
    borderColor: {
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.1)",
        title: "Border",
    },
    // Design - Glass
    isGlass: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "Glass Mode",
    },
    blurAmount: {
        type: ControlType.Number,
        defaultValue: 10,
        min: 0,
        max: 50,
        title: "Blur",
    },
    // Avatars
    showAvatars: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Show Avatars",
    },
    aiAvatar: { type: ControlType.Image, title: "AI Image" },
    userAvatar: { type: ControlType.Image, title: "User Image" },
    // Logic & Loop
    shouldLoop: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Loop Chat",
    },
    restartDelay: {
        type: ControlType.Number,
        defaultValue: 3,
        min: 1,
        max: 20,
        title: "Restart Delay",
    },
    // Input Mimic
    inputPlaceholder: {
        type: ControlType.String,
        defaultValue: "Ask me anything...",
        title: "Placeholder",
    },
    inputBgColor: {
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.05)",
        title: "Input BG",
    },
    inputTextColor: {
        type: ControlType.Color,
        defaultValue: "#94A3B8",
        title: "Input Text",
    },
    buttonText: {
        type: ControlType.String,
        defaultValue: "Send",
        title: "Btn Text",
    },
    buttonBgColor: {
        type: ControlType.Color,
        defaultValue: "#0070FF",
        title: "Btn BG",
    },
    buttonTextColor: {
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        title: "Btn Text",
    },
    // General
    botName: { type: ControlType.String, defaultValue: "Nexus AI" },
    typingSpeed: {
        type: ControlType.Number,
        min: 1,
        max: 200,
        defaultValue: 60,
    },
    showThinking: { type: ControlType.Boolean, defaultValue: true },
    fontSize: { type: ControlType.Number, defaultValue: 14 },
    borderRadius: { type: ControlType.Number, defaultValue: 20 },
})
