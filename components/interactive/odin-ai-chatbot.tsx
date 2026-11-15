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


function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function renderMarkdown(text) {
    if (!text) return null
    const lines = text.split("\n").filter((l) => l.trim() !== "")
    const elements = []
    let listBuffer = []

    function flushList(key) {
        if (listBuffer.length > 0) {
            elements.push(
                <ul
                    key={`ul-${key}`}
                    style={{ margin: "8px 0", paddingLeft: 20 }}
                >
                    {listBuffer.map((item, i) => (
                        <li
                            key={i}
                            style={{ marginBottom: 6, lineHeight: 1.5 }}
                        >
                            {renderInline(item)}
                        </li>
                    ))}
                </ul>
            )
            listBuffer = []
        }
    }

    function renderInline(str) {
        const parts = str.split(/(\*\*.*?\*\*|https?:\/\/[^\s)]+)/g)
        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i}>{part.slice(2, -2)}</strong>
            }
            if (/^https?:\/\//.test(part)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: "#E85D00",
                            textDecoration: "underline",
                        }}
                    >
                        {part}
                    </a>
                )
            }
            return <span key={i}>{part}</span>
        })
    }

    lines.forEach((line, idx) => {
        const trimmed = line.trim()
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            listBuffer.push(trimmed.slice(2))
        } else {
            flushList(idx)
            elements.push(
                <p key={idx} style={{ margin: "0 0 10px 0", lineHeight: 1.55 }}>
                    {renderInline(trimmed)}
                </p>
            )
        }
    })
    flushList("end")
    return elements
}

export default function AskOdin(props) {
    const {
        assistantName,
        aboutMe,
        accentColor,
        backendUrl,
        questions,
        leftImage,
        panelWidth,
        panelHeight,
        borderRadius,
        leftPanelRatio,
        position,
        offset,
        backdropOpacity,
        backdropColor,
        animationDuration,
        shadowIntensity,
        iconColor,
        pillBackground,
        pillTextColor,
        suggestionHoverColor,
        dotColor,
        triggerText,
        imageCredit,
    } = props

    const isStatic = useIsStaticRenderer()

    const [isOpen, setIsOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [visibleQuestions, setVisibleQuestions] = useState(() =>
        shuffle(questions).slice(0, 3)
    )
    const [askedQuestions, setAskedQuestions] = useState([])
    const [questionCount, setQuestionCount] = useState(0)
    const MAX_QUESTIONS_PER_SESSION = 10
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [typedLength, setTypedLength] = useState(0)
    const [isTypingReply, setIsTypingReply] = useState(false)
    const [showInfoCard, setShowInfoCard] = useState(false)
    const [backendLimited, setBackendLimited] = useState(false)
    const dragStartRef = useRef({
        mouseX: 0,
        mouseY: 0,
        offsetX: 0,
        offsetY: 0,
    })

    useEffect(() => {
        function check() {
            setIsMobile(window.innerWidth < 768)
        }
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    useEffect(() => {
        if (!showInfoCard) return
        function handleOutsideClick() {
            setShowInfoCard(false)
        }
        window.addEventListener("click", handleOutsideClick)
        return () => window.removeEventListener("click", handleOutsideClick)
    }, [showInfoCard])

    useEffect(() => {
        const last = messages[messages.length - 1]
        if (!last || last.role !== "bot") return

        const fullText = last.text

        if (isStatic) {
            setTypedLength(fullText.length)
            setIsTypingReply(false)
            return
        }

        setTypedLength(0)
        setIsTypingReply(true)

        let i = 0
        const speed = 15
        const interval = setInterval(() => {
            i++
            setTypedLength(i)
            if (i >= fullText.length) {
                clearInterval(interval)
                setIsTypingReply(false)
            }
        }, speed)

        return () => clearInterval(interval)
    }, [messages.length, isStatic])

    function openPanel() {
        setIsOpen(true)
        if (isStatic) {
            setIsVisible(true)
            return
        }
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setIsVisible(true))
        )
    }
    function closePanel() {
        setIsVisible(false)
        if (isStatic) {
            setIsOpen(false)
            setDragOffset({ x: 0, y: 0 })
            return
        }
        setTimeout(() => {
            setIsOpen(false)
            setDragOffset({ x: 0, y: 0 })
        }, animationDuration)
    }

    function pickNextQuestions(justAsked) {
        const updatedAsked = [...askedQuestions, justAsked]
        setAskedQuestions(updatedAsked)
        const remaining = questions.filter((q) => !updatedAsked.includes(q))
        const pool =
            remaining.length >= 3
                ? remaining
                : questions.filter((q) => q !== justAsked)
        setVisibleQuestions(shuffle(pool).slice(0, 3))
    }

    async function send(q) {
        if (
            !q.trim() ||
            questionCount >= MAX_QUESTIONS_PER_SESSION ||
            backendLimited
        )
            return

        const updatedMessages = [...messages, { role: "user", text: q }]
        setMessages(updatedMessages)
        setInput("")
        setLoading(true)
        setQuestionCount((c) => c + 1)
        pickNextQuestions(q)
        try {
            const res = await fetch(backendUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: q,
                    name: assistantName,
                    history: updatedMessages.map((m) => ({
                        role: m.role === "user" ? "user" : "assistant",
                        content: m.text,
                    })),
                }),
            })
            const data = await res.json()
            setMessages((m) => [...m, { role: "bot", text: data.reply }])
            if (data.limited) setBackendLimited(true)
        } catch {
            setMessages((m) => [
                ...m,
                {
                    role: "bot",
                    text: "Something went wrong on my end. Give it another try in a moment!",
                },
            ])
        }
        setLoading(false)
    }

    function reset() {
        setMessages([])
        setInput("")
        setAskedQuestions([])
        setVisibleQuestions(shuffle(questions).slice(0, 3))
    }

    function handleDragStart(e) {
        if (isStatic) return
        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        const clientY = e.touches ? e.touches[0].clientY : e.clientY
        dragStartRef.current = {
            mouseX: clientX,
            mouseY: clientY,
            offsetX: dragOffset.x,
            offsetY: dragOffset.y,
        }
        setIsDragging(true)
    }

    useEffect(() => {
        if (!isDragging || isStatic) return

        function handleMove(e) {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX
            const clientY = e.touches ? e.touches[0].clientY : e.clientY
            const dx = clientX - dragStartRef.current.mouseX
            const dy = clientY - dragStartRef.current.mouseY
            setDragOffset({
                x: dragStartRef.current.offsetX + dx,
                y: dragStartRef.current.offsetY + dy,
            })
        }
        function handleUp() {
            setIsDragging(false)
        }

        window.addEventListener("mousemove", handleMove)
        window.addEventListener("mouseup", handleUp)
        window.addEventListener("touchmove", handleMove)
        window.addEventListener("touchend", handleUp)
        return () => {
            window.removeEventListener("mousemove", handleMove)
            window.removeEventListener("mouseup", handleUp)
            window.removeEventListener("touchmove", handleMove)
            window.removeEventListener("touchend", handleUp)
        }
    }, [isDragging, isStatic])

    const fallbackGradient =
        "radial-gradient(circle at 35% 65%, #f2a33a 0%, #f2793a 18%, rgba(242,121,58,0) 42%), radial-gradient(circle at 60% 30%, #f6c85f 0%, rgba(246,200,95,0) 35%), linear-gradient(160deg, #a9c8e6 0%, #bcd3ea 60%, #cfe0f0 100%)"

    const lastAnswerPair = []
    for (let i = 0; i < messages.length; i += 2)
        lastAnswerPair.push({ q: messages[i], a: messages[i + 1] })

    const posStyles = {}
    if (!isMobile) {
        if (position === "bottom-right") {
            posStyles.bottom = offset
            posStyles.right = offset
        } else if (position === "bottom-left") {
            posStyles.bottom = offset
            posStyles.left = offset
        } else if (position === "top-right") {
            posStyles.top = offset
            posStyles.right = offset
        } else if (position === "top-left") {
            posStyles.top = offset
            posStyles.left = offset
        } else if (position === "center") {
            posStyles.top = "50%"
            posStyles.left = "50%"
            posStyles.transform = isVisible
                ? "translate(-50%, -50%) scale(1)"
                : "translate(-50%, -50%) scale(0.97)"
        }
    } else {
        posStyles.top = "50%"
        posStyles.left = "50%"
        posStyles.transform = isVisible
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.97)"
    }

    const transformOrigin =
        position === "center" || isMobile ? "center" : position
    const imageSrc = leftImage
        ? typeof leftImage === "string"
            ? leftImage
            : leftImage.src
        : null

    return (
        <div
            style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                position: "relative",
                display: "inline-block",
            }}
        >
            <style>{`
    .ao-suggestion { transition: ${isStatic ? "none" : "color 150ms ease"}; }
    .ao-suggestion:hover { color: ${suggestionHoverColor} !important; }
    ${
        !isStatic
            ? `
    @keyframes ao-bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-5px); }
    }
    .ao-dot { animation: ao-bounce 1.2s infinite ease-in-out; }
    .ao-dot:nth-child(2) { animation-delay: 0.15s; }
    .ao-dot:nth-child(3) { animation-delay: 0.3s; }
    `
            : ""
    }
`}</style>

            <div
                onClick={() => (isOpen ? closePanel() : openPanel())}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: triggerText ? 8 : 0,
                    background: pillBackground,
                    color: pillTextColor,
                    padding: triggerText ? "9px 18px 9px 14px" : 0,
                    width: triggerText ? "auto" : 44,
                    height: triggerText ? "auto" : 44,
                    borderRadius: 999,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    userSelect: "none",
                }}
            >
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0 }}
                >
                    <path
                        d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z"
                        fill={iconColor}
                    />
                </svg>
                {triggerText && <span>{triggerText}</span>}
            </div>

            {isOpen && (
                <>
                    <div
                        onClick={closePanel}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: backdropColor,
                            opacity: isVisible ? backdropOpacity : 0,
                            zIndex: 9998,
                            transition: isStatic
                                ? "none"
                                : `opacity ${animationDuration}ms ease`,
                        }}
                    />
                    <div
                        style={{
                            position: "fixed",
                            ...posStyles,
                            width: isMobile ? "90vw" : panelWidth,
                            height: isMobile ? "50vh" : panelHeight,
                            maxWidth: "95vw",
                            maxHeight: "95vh",
                            background: "#fff",
                            borderRadius: borderRadius,
                            boxShadow: `0 20px 60px rgba(0,0,0,${shadowIntensity})`,
                            zIndex: 9999,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            opacity: isVisible ? 1 : 0,
                            transform:
                                position === "center" || isMobile
                                    ? `${posStyles.transform} translate(${dragOffset.x}px, ${dragOffset.y}px)`
                                    : isVisible
                                      ? `translate(${dragOffset.x}px, ${dragOffset.y}px)`
                                      : "translateY(16px) scale(0.97)",
                            transition:
                                isDragging || isStatic
                                    ? "none"
                                    : `transform ${animationDuration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${animationDuration}ms ease`,
                            transformOrigin: transformOrigin,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #eaeaea",
                                padding: "16px 22px",
                                flexShrink: 0,
                                position: "relative",
                            }}
                        >
                            <span
                                onMouseDown={handleDragStart}
                                onTouchStart={handleDragStart}
                                title="Drag to move"
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate(-50%, -50%)",
                                    cursor: isStatic
                                        ? "default"
                                        : isDragging
                                          ? "grabbing"
                                          : "grab",
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gridTemplateRows: "repeat(2, 1fr)",
                                    gap: 3,
                                    padding: 4,
                                }}
                            >
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                                <span
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: "50%",
                                        background: "#bbb",
                                    }}
                                />
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: accentColor,
                                        display: "inline-block",
                                    }}
                                />
                                <span
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 13,
                                        letterSpacing: 1,
                                    }}
                                >
                                    {assistantName?.toUpperCase()}
                                </span>
                                <div style={{ position: "relative" }}>
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowInfoCard((v) => !v)
                                        }}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="#999"
                                                strokeWidth="1.6"
                                            />
                                            <line
                                                x1="12"
                                                y1="11"
                                                x2="12"
                                                y2="16.5"
                                                stroke="#999"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                            />
                                            <circle
                                                cx="12"
                                                cy="7.7"
                                                r="1.1"
                                                fill="#999"
                                            />
                                        </svg>
                                    </span>

                                    {showInfoCard && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 22,
                                                left: 0,
                                                width: 220,
                                                background: "#FFFFFF",
                                                borderRadius: 10,
                                                padding: "10px 12px",
                                                fontSize: 12,
                                                lineHeight: 1.5,
                                                color: "#444",
                                                boxShadow:
                                                    "0 6px 20px rgba(0,0,0,0.15)",
                                                zIndex: 10000,
                                            }}
                                        >
                                            {assistantName} LLM is a chatbot and
                                            may occasionally hallucinate or give
                                            inaccurate answers. Please verify
                                            anything important.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 18,
                                }}
                            >
                                {messages.length > 0 && (
                                    <span
                                        onClick={reset}
                                        title="Reset"
                                        style={{
                                            cursor: "pointer",
                                            fontSize: 15,
                                            color: "#555",
                                            lineHeight: 1,
                                        }}
                                    >
                                        ↺
                                    </span>
                                )}
                                <span
                                    onClick={closePanel}
                                    style={{
                                        cursor: "pointer",
                                        fontSize: 13,
                                        color: "#333",
                                    }}
                                >
                                    Close
                                </span>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: isMobile ? "column" : "row",
                                flex: 1,
                                minHeight: 0,
                            }}
                        >
                            {!isMobile && (
                                <div
                                    style={{
                                        width: `${leftPanelRatio}%`,
                                        height: "100%",
                                        flexShrink: 0,
                                        borderRight: "1px solid #eaeaea",
                                        background: imageSrc
                                            ? "#eee"
                                            : fallbackGradient,
                                        overflow: "hidden",
                                        position: "relative",
                                    }}
                                >
                                    {imageSrc && (
                                        <img
                                            src={imageSrc}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    )}
                                    {imageCredit && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: 8,
                                                left: 10,
                                                fontSize: 10,
                                                color: "rgba(255,255,255,0.85)",
                                                textShadow:
                                                    "0 1px 2px rgba(0,0,0,0.5)",
                                            }}
                                        >
                                            {imageCredit}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    minHeight: 0,
                                    background: "#fff",
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        overflowY: "auto",
                                        padding: isMobile
                                            ? "20px 18px"
                                            : "28px 32px",
                                    }}
                                >
                                    {messages.length === 0 ? (
                                        <>
                                            <div style={{ flex: 1 }} />
                                            <h2
                                                style={{
                                                    fontFamily:
                                                        "Georgia, 'Times New Roman', serif",
                                                    fontStyle: "italic",
                                                    fontWeight: 400,
                                                    fontSize: isMobile
                                                        ? 19
                                                        : 21,
                                                    margin: "0 0 18px 0",
                                                    color: "#1a1a1a",
                                                }}
                                            >
                                                What would you like to know?
                                            </h2>
                                            <div>
                                                {visibleQuestions.map(
                                                    (q, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() =>
                                                                send(q)
                                                            }
                                                            className="ao-suggestion"
                                                            style={{
                                                                cursor: "pointer",
                                                                color: "#8a8a8a",
                                                                fontSize: 14,
                                                                margin: "8px 0",
                                                                display: "flex",
                                                                gap: 8,
                                                            }}
                                                        >
                                                            <span>↳</span>
                                                            <span>{q}</span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {lastAnswerPair.map((pair, i) => (
                                                <div
                                                    key={i}
                                                    style={{ marginBottom: 24 }}
                                                >
                                                    {pair.q && (
                                                        <div
                                                            style={{
                                                                color: "#9a9a9a",
                                                                fontSize: 14,
                                                                marginBottom: 12,
                                                            }}
                                                        >
                                                            {pair.q.text}
                                                        </div>
                                                    )}
                                                    {pair.a && (
                                                        <div
                                                            style={{
                                                                color: "#1a1a1a",
                                                                fontSize: 15,
                                                            }}
                                                        >
                                                            {renderMarkdown(
                                                                i ===
                                                                    lastAnswerPair.length -
                                                                        1 &&
                                                                    isTypingReply
                                                                    ? pair.a.text.slice(
                                                                          0,
                                                                          typedLength
                                                                      )
                                                                    : pair.a
                                                                          .text
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {loading && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 5,
                                                        padding: "4px 0",
                                                    }}
                                                >
                                                    <span
                                                        className="ao-dot"
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background:
                                                                dotColor,
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    />
                                                    <span
                                                        className="ao-dot"
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background:
                                                                dotColor,
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    />
                                                    <span
                                                        className="ao-dot"
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            background:
                                                                dotColor,
                                                            display:
                                                                "inline-block",
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {!loading && !isTypingReply && (
                                                <div style={{ marginTop: 18 }}>
                                                    {visibleQuestions.map(
                                                        (q, i) => (
                                                            <div
                                                                key={i}
                                                                onClick={() =>
                                                                    send(q)
                                                                }
                                                                className="ao-suggestion"
                                                                style={{
                                                                    cursor: "pointer",
                                                                    color: "#8a8a8a",
                                                                    fontSize: 14,
                                                                    margin: "8px 0",
                                                                    display:
                                                                        "flex",
                                                                    gap: 8,
                                                                }}
                                                            >
                                                                <span>↳</span>
                                                                <span>{q}</span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                {questionCount < MAX_QUESTIONS_PER_SESSION ? (
                                    <div
                                        style={{
                                            padding: isMobile
                                                ? "0 18px 6px"
                                                : "0 32px 6px",
                                            fontSize: 11,
                                            color: "#b0b0b0",
                                            textAlign: "right",
                                        }}
                                    >
                                        {questionCount}/
                                        {MAX_QUESTIONS_PER_SESSION} questions
                                    </div>
                                ) : null}
                                <div
                                    style={{
                                        padding: isMobile
                                            ? "12px 18px 18px"
                                            : "12px 32px 22px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            background: "#f4f4f4",
                                            borderRadius: 999,
                                            padding: "8px 8px 8px 18px",
                                        }}
                                    >
                                        <input
                                            value={input}
                                            onChange={(e) =>
                                                setInput(e.target.value)
                                            }
                                            onKeyDown={(e) =>
                                                e.key === "Enter" && send(input)
                                            }
                                            placeholder={`Ask ${assistantName}...`}
                                            style={{
                                                flex: 1,
                                                border: "none",
                                                background: "transparent",
                                                outline: "none",
                                                fontSize: 14,
                                                color: "#333",
                                            }}
                                        />
                                        <button
                                            onClick={() => send(input)}
                                            style={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: "50%",
                                                border: "none",
                                                background: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.15)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#666",
                                            }}
                                        >
                                            ↑
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

addPropertyControls(AskOdin, {
    assistantName: {
        type: ControlType.String,
        title: "Assistant Name",
        defaultValue: "Odin",
    },
    triggerText: {
        type: ControlType.String,
        title: "Trigger Text",
        defaultValue: "Ask Odin LLM",
    },
    imageCredit: {
        type: ControlType.String,
        title: "Image Credit",
        defaultValue: "",
    },
    aboutMe: {
        type: ControlType.String,
        defaultValue: "Bio goes here...",
        displayTextArea: true,
    },
    accentColor: { type: ControlType.Color, defaultValue: "#E07802" },
    backendUrl: {
        type: ControlType.String,
        defaultValue: "https://your-project.vercel.app/api/chat",
    },
    leftImage: { type: ControlType.Image, title: "Left Image" },
    questions: {
        type: ControlType.Array,
        control: { type: ControlType.String },
        defaultValue: [
            "What projects have you worked on?",
            "How do you approach product strategy?",
            "What are your favorite parts of design?",
            "What was your experience at your last role?",
            "What are you most proud of?",
        ],
    },
    panelWidth: {
        type: ControlType.String,
        title: "Width",
        defaultValue: "min(760px, 60vw)",
    },
    panelHeight: {
        type: ControlType.String,
        title: "Height",
        defaultValue: "min(560px, 80vh)",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 48,
        step: 1,
    },
    leftPanelRatio: {
        type: ControlType.Number,
        title: "Left Panel %",
        defaultValue: 38,
        min: 20,
        max: 60,
        step: 1,
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: [
            "bottom-right",
            "bottom-left",
            "top-right",
            "top-left",
            "center",
        ],
        optionTitles: [
            "Bottom Right",
            "Bottom Left",
            "Top Right",
            "Top Left",
            "Center",
        ],
        defaultValue: "bottom-right",
    },
    offset: {
        type: ControlType.Number,
        title: "Edge Offset",
        defaultValue: 32,
        min: 0,
        max: 120,
        step: 1,
    },
    backdropColor: {
        type: ControlType.Color,
        title: "Backdrop Color",
        defaultValue: "#000000",
    },
    backdropOpacity: {
        type: ControlType.Number,
        title: "Backdrop Opacity",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Strength",
        defaultValue: 0.25,
        min: 0,
        max: 0.6,
        step: 0.05,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation (ms)",
        defaultValue: 280,
        min: 100,
        max: 800,
        step: 10,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#E07802",
    },
    pillBackground: {
        type: ControlType.Color,
        title: "Pill Background",
        defaultValue: "#0d0d0d",
    },
    pillTextColor: {
        type: ControlType.Color,
        title: "Pill Text Color",
        defaultValue: "#ffffff",
    },
    suggestionHoverColor: {
        type: ControlType.Color,
        title: "Suggestion Hover Color",
        defaultValue: "#E85D00",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Loading Dot Color",
        defaultValue: "#E85D00",
    },
})
