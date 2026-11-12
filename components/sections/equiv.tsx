import React, { useState, useEffect, useRef } from "react"
import {
    motion,
    AnimatePresence,
    useMotionValue,
    useSpring,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Synthesized tactile mechanical click using native Web Audio API
const playClickSFX = (freq: number = 850, type: "high" | "low" = "high") => {
    if (typeof window === "undefined") return
    try {
        const AudioCtx =
            window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = "sine"
        osc.frequency.setValueAtTime(
            type === "high" ? freq : 380,
            ctx.currentTime
        )
        osc.frequency.exponentialRampToValueAtTime(
            type === "high" ? 220 : 120,
            ctx.currentTime + 0.035
        )

        gain.gain.setValueAtTime(0.045, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        osc.stop(ctx.currentTime + 0.035)
    } catch (e) {
        // Silently handled
    }
}

// Crisp High-Tension Liquid Button (Static-safe)
function LiquidButton({
    ctaText,
    onClick,
    fontStyle,
    isStatic,
}: {
    ctaText: string
    onClick: () => void
    fontStyle: any
    isStatic: boolean
}) {
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [cursorOrigin, setCursorOrigin] = useState({ x: 50, y: 50 })

    const mouseX = useMotionValue(50)
    const mouseY = useMotionValue(50)
    const fluidX = useSpring(mouseX, { stiffness: 320, damping: 26 })
    const fluidY = useSpring(mouseY, { stiffness: 320, damping: 26 })

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isStatic || !buttonRef.current) return
        const rect = buttonRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setCursorOrigin({ x, y })
        mouseX.set(x)
        mouseY.set(y)
        setIsHovered(true)
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isStatic || !buttonRef.current) return
        const rect = buttonRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
    }

    if (isStatic) {
        return (
            <button
                type="button"
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 9999,
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "pointer",
                }}
            >
                <div
                    style={{
                        ...fontStyle,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#ffffff",
                    }}
                >
                    <span>{ctaText}</span>
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </div>
            </button>
        )
    }

    return (
        <motion.button
            ref={buttonRef}
            type="button"
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
                playClickSFX(1020)
                onClick()
            }}
            whileTap={{ scale: 0.98 }}
            style={{
                position: "relative",
                zIndex: 2,
                width: "100%",
                padding: "14px 20px",
                borderRadius: 9999,
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                outline: "none",
                cursor: "pointer",
                overflow: "hidden",
                boxSizing: "border-box",
                boxShadow: isHovered
                    ? "0 10px 28px -6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                    : "0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                transition: "box-shadow 0.25s ease, border-color 0.25s ease",
            }}
        >
            <motion.div
                initial={false}
                animate={{
                    scale: isHovered ? 3.4 : 0,
                    opacity: isHovered ? 1 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 26,
                    mass: 0.75,
                }}
                style={{
                    position: "absolute",
                    left: cursorOrigin.x - 65,
                    top: cursorOrigin.y - 65,
                    width: 130,
                    height: 130,
                    borderRadius: "48% 52% 58% 42% / 44% 56% 44% 56%",
                    background: "#ffffff",
                    pointerEvents: "none",
                }}
            />

            <motion.div
                animate={{
                    rotate: isHovered ? [0, 180, 360] : 0,
                    borderRadius: isHovered
                        ? [
                              "45% 55% 60% 40% / 48% 52% 48% 52%",
                              "55% 45% 40% 60% / 54% 46% 54% 46%",
                              "45% 55% 60% 40% / 48% 52% 48% 52%",
                          ]
                        : "50%",
                }}
                transition={{
                    rotate: { repeat: Infinity, duration: 4.5, ease: "linear" },
                    borderRadius: {
                        repeat: Infinity,
                        duration: 2.8,
                        ease: "easeInOut",
                    },
                }}
                style={{
                    position: "absolute",
                    left: fluidX,
                    top: fluidY,
                    x: "-50%",
                    y: "-50%",
                    width: 120,
                    height: 120,
                    background: "#ffffff",
                    pointerEvents: "none",
                    opacity: isHovered ? 0.95 : 0,
                    transition: "opacity 0.2s ease",
                }}
            />

            <div
                style={{
                    ...fontStyle,
                    position: "relative",
                    zIndex: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: isHovered ? "#000000" : "#ffffff",
                    transition: "color 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                <span>{ctaText}</span>
                <motion.svg
                    animate={{ x: isHovered ? 3 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                </motion.svg>
            </div>
        </motion.button>
    )
}

export default function Equiv(props: any) {
    const isStatic = useIsStaticRenderer()

    const {
        title,
        titleFont,
        subtitle,
        bodyFont,
        price,
        priceFont,
        cadenceText,
        badgePerkText,
        ctaText,
        deliverablesTitle,
        features,
    } = props

    const [currencyIndex, setCurrencyIndex] = useState<0 | 1>(0)
    const [openFeature, setOpenFeature] = useState<number | null>(0)
    const [isHovered, setIsHovered] = useState(false)
    const [isInView, setIsInView] = useState(true)

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const cardRef = useRef<HTMLDivElement | null>(null)

    const currencies = [
        { code: "USD", symbol: "$", rate: 1 },
        { code: "EUR", symbol: "€", rate: 0.92 },
    ]
    const activeCurrency = currencies[currencyIndex]
    const targetPrice = Math.round(price * activeCurrency.rate)

    const priceSpring = useSpring(targetPrice, { stiffness: 180, damping: 20 })
    const [displayPrice, setDisplayPrice] = useState(targetPrice)

    useEffect(() => {
        if (isStatic) {
            setDisplayPrice(targetPrice)
            return
        }
        priceSpring.set(targetPrice)
    }, [targetPrice, priceSpring, isStatic])

    useEffect(() => {
        if (isStatic) return
        return priceSpring.on("change", (latest) => {
            setDisplayPrice(Math.round(latest))
        })
    }, [priceSpring, isStatic])

    // Viewport-aware visibility check to halt render loops offscreen
    useEffect(() => {
        if (isStatic) return
        const cardEl = cardRef.current
        if (!cardEl || typeof IntersectionObserver === "undefined") return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting)
            },
            { threshold: 0.05 }
        )

        observer.observe(cardEl)
        return () => observer.disconnect()
    }, [isStatic])

    // 3D Canvas Wireframe Polyhedron with static & viewport handling
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animId: number
        let rotX = 0.4
        let rotY = 0.5

        const t = (1 + Math.sqrt(5)) / 2
        const rawVertices = [
            [-1, t, 0],
            [1, t, 0],
            [-1, -t, 0],
            [1, -t, 0],
            [0, -1, t],
            [0, 1, t],
            [0, -1, -t],
            [0, 1, -t],
            [t, 0, -1],
            [t, 0, 1],
            [-t, 0, -1],
            [-t, 0, 1],
        ].map(([x, y, z]) => {
            const len = Math.hypot(x, y, z)
            return [x / len, y / len, z / len]
        })

        const edges: [number, number][] = [
            [0, 11],
            [0, 5],
            [0, 1],
            [0, 7],
            [0, 10],
            [1, 5],
            [1, 9],
            [1, 8],
            [1, 7],
            [2, 11],
            [2, 10],
            [2, 6],
            [2, 4],
            [2, 3],
            [3, 8],
            [3, 9],
            [3, 4],
            [3, 6],
            [4, 5],
            [4, 9],
            [5, 11],
            [6, 7],
            [6, 10],
            [7, 8],
            [8, 9],
            [10, 11],
        ]

        const drawGeometry = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const cx = canvas.width / 2
            const cy = canvas.height / 2
            const scale = 32

            const cosX = Math.cos(rotX),
                sinX = Math.sin(rotX)
            const cosY = Math.cos(rotY),
                sinY = Math.sin(rotY)

            const projected = rawVertices.map(([x, y, z]) => {
                const x1 = x * cosY + z * sinY
                const z1 = -x * sinY + z * cosY
                const y1 = y * cosX - z1 * sinX
                const z2 = y * sinX + z1 * cosX
                return { x: cx + x1 * scale, y: cy + y1 * scale, z: z2 }
            })

            ctx.beginPath()
            ctx.ellipse(cx, cy, 40, 13, rotY * 0.3, 0, Math.PI * 2)
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)"
            ctx.lineWidth = 1
            ctx.stroke()

            edges.forEach(([i, j]) => {
                const p1 = projected[i]
                const p2 = projected[j]
                const avgZ = (p1.z + p2.z) / 2
                const alpha = Math.max(0.12, ((avgZ + 1.2) / 2.4) * 0.55)

                ctx.beginPath()
                ctx.moveTo(p1.x, p1.y)
                ctx.lineTo(p2.x, p2.y)
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
                ctx.lineWidth = 1.15
                ctx.stroke()
            })

            projected.forEach((p) => {
                const alpha = Math.max(0.2, (p.z + 1.2) / 2.4)
                ctx.beginPath()
                ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
                ctx.fill()
            })
        }

        if (isStatic || !isInView) {
            drawGeometry()
            return
        }

        const render = () => {
            rotY += isHovered ? 0.024 : 0.01
            rotX += isHovered ? 0.016 : 0.006
            drawGeometry()
            animId = requestAnimationFrame(render)
        }

        render()
        return () => cancelAnimationFrame(animId)
    }, [isHovered, isStatic, isInView])

    return (
        <div
            style={{
                width: 360,
                minWidth: 360,
                maxWidth: 360,
                display: "flex",
                justifyContent: "center",
                margin: "0 auto",
                boxSizing: "border-box",
            }}
        >
            <div
                ref={cardRef}
                onMouseEnter={() => !isStatic && setIsHovered(true)}
                onMouseLeave={() => !isStatic && setIsHovered(false)}
                style={{
                    position: "relative",
                    width: 360,
                    minWidth: 360,
                    maxWidth: 360,
                    height: 520,
                    minHeight: 520,
                    maxHeight: 520,
                    borderRadius: 24,
                    backgroundColor: "#0a0a0c",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    boxShadow:
                        "0 24px 48px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
                    padding: "24px 22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    color: "#ffffff",
                    boxSizing: "border-box",
                    userSelect: "none",
                    overflow: "hidden",
                    ...bodyFont,
                }}
            >
                {/* Top Bar: Currency Switcher */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        position: "relative",
                        zIndex: 2,
                    }}
                >
                    <div
                        role="group"
                        aria-label="Currency Selector"
                        style={{
                            display: "inline-flex",
                            background: "rgba(255, 255, 255, 0.03)",
                            borderRadius: 9999,
                            padding: 3,
                            border: "1px solid rgba(255, 255, 255, 0.07)",
                        }}
                    >
                        {currencies.map((curr, idx) => {
                            const isCurrActive = currencyIndex === idx
                            return (
                                <button
                                    key={curr.code}
                                    type="button"
                                    aria-pressed={isCurrActive}
                                    onClick={() => {
                                        if (isStatic) return
                                        playClickSFX(idx === 0 ? 680 : 760)
                                        setCurrencyIndex(idx as 0 | 1)
                                    }}
                                    style={{
                                        position: "relative",
                                        padding: "3px 9px",
                                        fontSize: 10.5,
                                        fontWeight: 600,
                                        border: "none",
                                        background:
                                            isStatic && isCurrActive
                                                ? "rgba(255, 255, 255, 0.12)"
                                                : "transparent",
                                        borderRadius: 9999,
                                        cursor: "pointer",
                                        color: isCurrActive
                                            ? "#ffffff"
                                            : "rgba(255, 255, 255, 0.4)",
                                        zIndex: 2,
                                        transition: "color 0.18s ease",
                                        ...bodyFont,
                                    }}
                                >
                                    {!isStatic && isCurrActive && (
                                        <motion.div
                                            layoutId="activeCurrPillTop"
                                            transition={{
                                                type: "spring",
                                                stiffness: 380,
                                                damping: 30,
                                            }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                backgroundColor:
                                                    "rgba(255, 255, 255, 0.12)",
                                                borderRadius: 9999,
                                                zIndex: -1,
                                            }}
                                        />
                                    )}
                                    {curr.code}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Header Info */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        position: "relative",
                        zIndex: 2,
                    }}
                >
                    <div style={{ maxWidth: 220 }}>
                        <h2
                            style={{
                                margin: 0,
                                letterSpacing: "-0.01em",
                                color: "#ffffff",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                ...titleFont,
                            }}
                        >
                            {title}
                        </h2>
                        <p
                            style={{
                                margin: "4px 0 0 0",
                                fontSize: 11.5,
                                color: "rgba(255, 255, 255, 0.45)",
                                lineHeight: 1.35,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                ...bodyFont,
                            }}
                        >
                            {subtitle}
                        </p>
                    </div>

                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 14,
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                        }}
                    >
                        <canvas ref={canvasRef} width={64} height={64} />
                    </div>
                </div>

                {/* Price Display Box */}
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: 16,
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "relative",
                        zIndex: 2,
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 3,
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.6em",
                                fontWeight: 500,
                                color: "rgba(255, 255, 255, 0.45)",
                                ...priceFont,
                            }}
                        >
                            {activeCurrency.symbol}
                        </span>
                        <span
                            style={{
                                color: "#ffffff",
                                lineHeight: 1,
                                letterSpacing: "-0.03em",
                                ...priceFont,
                            }}
                        >
                            {displayPrice}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                color: "rgba(255, 255, 255, 0.4)",
                                marginLeft: 4,
                                fontWeight: 500,
                                ...bodyFont,
                            }}
                        >
                            {cadenceText}
                        </span>
                    </div>

                    <span
                        style={{
                            fontSize: 10.5,
                            padding: "4px 8px",
                            borderRadius: 9999,
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            color: "rgba(255, 255, 255, 0.6)",
                            letterSpacing: "0.02em",
                            ...bodyFont,
                        }}
                    >
                        {badgePerkText}
                    </span>
                </div>

                {/* Accordion Deliverables */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        position: "relative",
                        zIndex: 2,
                        width: "100%",
                    }}
                >
                    <span
                        style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "rgba(255, 255, 255, 0.35)",
                            marginBottom: 2,
                            ...bodyFont,
                        }}
                    >
                        {deliverablesTitle}
                    </span>

                    {/* Fixed Height Container */}
                    <div
                        style={{
                            height: 165,
                            minHeight: 165,
                            maxHeight: 165,
                            width: "100%",
                            overflowY: "auto",
                            overflowX: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            boxSizing: "border-box",
                        }}
                    >
                        {features &&
                            features.map((item: any, idx: number) => {
                                const isOpen = openFeature === idx
                                const rowId = `equiv-feature-${idx}`
                                const contentId = `equiv-content-${idx}`

                                const toggleRow = () => {
                                    if (isStatic) return
                                    playClickSFX(isOpen ? 440 : 740)
                                    setOpenFeature(isOpen ? null : idx)
                                }

                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            width: "100%",
                                            borderRadius: 12,
                                            backgroundColor: isOpen
                                                ? "rgba(255, 255, 255, 0.04)"
                                                : "transparent",
                                            border: `1px solid ${isOpen ? "rgba(255, 255, 255, 0.08)" : "transparent"}`,
                                            transition:
                                                "background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                                            flexShrink: 0,
                                            boxSizing: "border-box",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            id={rowId}
                                            aria-expanded={isOpen}
                                            aria-controls={contentId}
                                            onClick={toggleRow}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === " "
                                                ) {
                                                    e.preventDefault()
                                                    toggleRow()
                                                }
                                            }}
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                background: "none",
                                                border: "none",
                                                padding: "8px 10px",
                                                margin: 0,
                                                cursor: "pointer",
                                                outline: "none",
                                                textAlign: "left",
                                                color: "inherit",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    minWidth: 0,
                                                    flex: 1,
                                                }}
                                            >
                                                <svg
                                                    width="13"
                                                    height="13"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#ffffff"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden="true"
                                                    style={{
                                                        opacity: isOpen
                                                            ? 0.95
                                                            : 0.6,
                                                        transition:
                                                            "opacity 0.2s ease",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        color: isOpen
                                                            ? "#ffffff"
                                                            : "rgba(255, 255, 255, 0.55)",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        transition:
                                                            "color 0.2s ease",
                                                        ...bodyFont,
                                                    }}
                                                >
                                                    {item.title}
                                                </span>
                                            </div>

                                            <motion.span
                                                animate={{
                                                    rotate: isOpen ? 45 : 0,
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 350,
                                                    damping: 25,
                                                }}
                                                aria-hidden="true"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 14,
                                                    color: isOpen
                                                        ? "#ffffff"
                                                        : "rgba(255, 255, 255, 0.4)",
                                                    lineHeight: 1,
                                                    marginLeft: 6,
                                                    flexShrink: 0,
                                                    transformOrigin: "center",
                                                }}
                                            >
                                                +
                                            </motion.span>
                                        </button>

                                        {isStatic ? (
                                            isOpen ? (
                                                <div
                                                    id={contentId}
                                                    role="region"
                                                    aria-labelledby={rowId}
                                                    style={{
                                                        padding:
                                                            "0 10px 8px 31px",
                                                        boxSizing: "border-box",
                                                    }}
                                                >
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: 11,
                                                            color: "rgba(255, 255, 255, 0.45)",
                                                            lineHeight: 1.4,
                                                            wordBreak:
                                                                "break-word",
                                                            ...bodyFont,
                                                        }}
                                                    >
                                                        {item.detail}
                                                    </p>
                                                </div>
                                            ) : null
                                        ) : (
                                            <AnimatePresence initial={false}>
                                                {isOpen && (
                                                    <motion.div
                                                        id={contentId}
                                                        role="region"
                                                        aria-labelledby={rowId}
                                                        initial={{
                                                            opacity: 0,
                                                            height: 0,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            height: "auto",
                                                            transition: {
                                                                height: {
                                                                    type: "spring",
                                                                    stiffness: 400,
                                                                    damping: 32,
                                                                    mass: 0.8,
                                                                },
                                                                opacity: {
                                                                    duration: 0.22,
                                                                    delay: 0.04,
                                                                    ease: [
                                                                        0.16, 1,
                                                                        0.3, 1,
                                                                    ],
                                                                },
                                                            },
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            height: 0,
                                                            transition: {
                                                                height: {
                                                                    type: "spring",
                                                                    stiffness: 450,
                                                                    damping: 35,
                                                                },
                                                                opacity: {
                                                                    duration: 0.15,
                                                                    ease: "easeOut",
                                                                },
                                                            },
                                                        }}
                                                        style={{
                                                            overflow: "hidden",
                                                            width: "100%",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                padding:
                                                                    "0 10px 8px 31px",
                                                                boxSizing:
                                                                    "border-box",
                                                            }}
                                                        >
                                                            <motion.p
                                                                initial={{
                                                                    y: -4,
                                                                }}
                                                                animate={{
                                                                    y: 0,
                                                                }}
                                                                exit={{ y: -4 }}
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 350,
                                                                    damping: 28,
                                                                }}
                                                                style={{
                                                                    margin: 0,
                                                                    fontSize: 11,
                                                                    color: "rgba(255, 255, 255, 0.45)",
                                                                    lineHeight: 1.45,
                                                                    wordBreak:
                                                                        "break-word",
                                                                    ...bodyFont,
                                                                }}
                                                            >
                                                                {item.detail}
                                                            </motion.p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        )}
                                    </div>
                                )
                            })}
                    </div>
                </div>

                {/* Liquid Button */}
                <LiquidButton
                    ctaText={ctaText}
                    onClick={() => {}}
                    fontStyle={bodyFont}
                    isStatic={isStatic}
                />
            </div>
        </div>
    )
}

Equiv.defaultProps = {
    title: "Equiv Pass",
    subtitle: "Perpetual access • Lifetime updates",
    price: 95,
    cadenceText: "One-time",
    badgePerkText: "Lifetime updates",
    ctaText: "Acquire Equiv Pass",
    deliverablesTitle: "Deliverables",
    features: [
        {
            title: "Complete motion component suite",
            detail: "Production-ready Framer components with spring transitions, micro-interactions, and responsive layout stacks.",
        },
        {
            title: "1-Click Framer remix & code export",
            detail: "Instant canvas paste URL plus raw TypeScript / TSX source code for custom Next.js integrations.",
        },
        {
            title: "Commercial perpetual license",
            detail: "Unrestricted commercial rights for client projects, SaaS web applications, and personal digital portfolios.",
        },
    ],
}

addPropertyControls(Equiv, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Equiv Pass",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "google",
        defaultValue: {
            fontFamily: "Playfair Display",
            fontSize: "24px",
            fontWeight: 400,
        },
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Perpetual access • Lifetime updates",
    },

    price: {
        type: ControlType.Number,
        title: "Price ($)",
        min: 0,
        max: 9999,
        step: 1,
        defaultValue: 95,
    },
    priceFont: {
        type: ControlType.Font,
        title: "Price Font",
        controls: "extended",
        defaultFontType: "google",
        defaultValue: {
            fontFamily: "Playfair Display",
            fontSize: "40px",
            fontWeight: 500,
        },
    },
    cadenceText: {
        type: ControlType.String,
        title: "Interval",
        defaultValue: "One-time",
    },
    badgePerkText: {
        type: ControlType.String,
        title: "Perk Tag",
        defaultValue: "Lifetime updates",
    },

    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "google",
        defaultValue: {
            fontFamily: "Plus Jakarta Sans",
            fontSize: "12px",
            fontWeight: 400,
        },
    },

    ctaText: {
        type: ControlType.String,
        title: "CTA Button",
        defaultValue: "Acquire Equiv Pass",
    },

    deliverablesTitle: {
        type: ControlType.String,
        title: "Deliverables Title",
        defaultValue: "Deliverables",
    },
    features: {
        type: ControlType.Array,
        title: "Accordion Items",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New deliverable",
                },
                detail: {
                    type: ControlType.String,
                    title: "Detail",
                    defaultValue: "Description of what is included.",
                },
            },
        },
    },
})
