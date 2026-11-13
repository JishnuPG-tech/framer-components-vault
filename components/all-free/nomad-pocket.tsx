import { motion } from "framer-motion"
import { useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Helper to adjust hex color brightness
const adjustHex = (hex: string, percent: number): string => {
    let r = parseInt(hex.slice(1, 3), 16)
    let g = parseInt(hex.slice(3, 5), 16)
    let b = parseInt(hex.slice(5, 7), 16)
    r = Math.max(0, Math.min(255, r + (r * percent) / 100))
    g = Math.max(0, Math.min(255, g + (g * percent) / 100))
    b = Math.max(0, Math.min(255, b + (b * percent) / 100))
    return `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`
}

// Generate theme dynamically from any color
const getTheme = (color: string) => {
    let hex = color.startsWith("#") ? color : `#${color}`
    if (hex.length !== 7) hex = "#0a3d2e"

    return {
        door: `linear-gradient(135deg, ${hex} 0%, ${adjustHex(hex, -15)} 100%)`,
        inside: `linear-gradient(180deg, ${adjustHex(hex, -10)} 0%, ${adjustHex(hex, -25)} 50%, ${adjustHex(hex, -10)} 100%)`,
        hinge: adjustHex(hex, 25),
        pocket: `linear-gradient(180deg, ${adjustHex(hex, -20)} 0%, ${adjustHex(hex, -35)} 100%)`,
    }
}

// --- INTERACTIVE COMPONENTS ---

const Ticket1 = ({ isOut, onClick }: any) => {
    return (
        <motion.div
            style={{
                position: "absolute",
                width: 200,
                height: 100,
                left: 50,
                top: 20,
                cursor: isOut ? "grab" : "default",
            }}
            drag={isOut}
            dragMomentum={false}
            dragElastic={0.2}
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            whileDrag={{ scale: 1.05, cursor: "grabbing" }}
            animate={{
                y: isOut ? -130 : 0,
                rotate: isOut ? -3 : -2,
                scale: isOut ? 1.1 : 1,
            }}
            transition={{
                y: { type: "spring", stiffness: 80, damping: 16 },
                rotate: { type: "spring", stiffness: 60, damping: 12 },
                scale: { type: "spring", stiffness: 80, damping: 16 },
            }}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
        >
            <svg viewBox="0 0 200 100" width="200" height="100">
                <rect
                    x="0"
                    y="0"
                    width="200"
                    height="100"
                    rx="4"
                    fill="#fdf6e3"
                />
                <circle cx="10" cy="50" r="6" fill="white" />
                <circle cx="190" cy="50" r="6" fill="white" />
                <line
                    x1="16"
                    y1="50"
                    x2="184"
                    y2="50"
                    stroke="#d4c5a9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                />
                <rect
                    x="0"
                    y="0"
                    width="60"
                    height="100"
                    fill="#e8d5b5"
                    rx="4"
                />
                <text
                    x="30"
                    y="35"
                    fontSize="10"
                    fill="#8b4513"
                    fontFamily="serif"
                    textAnchor="middle"
                    fontWeight="bold"
                >
                    JR PASS
                </text>
                <text
                    x="30"
                    y="50"
                    fontSize="8"
                    fill="#8b4513"
                    fontFamily="serif"
                    textAnchor="middle"
                >
                    新幹線
                </text>
                <text
                    x="30"
                    y="70"
                    fontSize="14"
                    fill="#8b4513"
                    fontFamily="serif"
                    textAnchor="middle"
                    fontWeight="bold"
                >
                    042
                </text>
                <text
                    x="75"
                    y="30"
                    fontSize="12"
                    fill="#333"
                    fontFamily="monospace"
                    fontWeight="bold"
                >
                    KYOTO ➔ TOKYO
                </text>
                <text
                    x="75"
                    y="50"
                    fontSize="9"
                    fill="#666"
                    fontFamily="monospace"
                >
                    Car 5 | Seat 12A
                </text>
                <text
                    x="75"
                    y="65"
                    fontSize="9"
                    fill="#666"
                    fontFamily="monospace"
                >
                    2026.08.19 | 09:30
                </text>
                <g transform="translate(145, 62) scale(0.35)">
                    <path
                        d="M 10 60 Q 50 40 100 50"
                        stroke="#6b7c93"
                        strokeWidth="1.5"
                        fill="none"
                    />
                    <path
                        d="M 40 50 Q 50 70 45 90"
                        stroke="#6b7c93"
                        strokeWidth="1"
                        fill="none"
                    />
                    <path
                        d="M 70 48 Q 75 65 72 80"
                        stroke="#6b7c93"
                        strokeWidth="1"
                        fill="none"
                    />
                    <ellipse
                        cx="45"
                        cy="88"
                        rx="8"
                        ry="3"
                        fill="#c4956a"
                        transform="rotate(-30 45 88)"
                    />
                    <ellipse
                        cx="72"
                        cy="78"
                        rx="7"
                        ry="3"
                        fill="#c4956a"
                        transform="rotate(20 72 78)"
                    />
                    <ellipse
                        cx="30"
                        cy="75"
                        rx="6"
                        ry="2.5"
                        fill="#a8b5c4"
                        transform="rotate(-45 30 75)"
                    />
                    <motion.g
                        animate={
                            isOut
                                ? { y: [0, -5, 0], rotate: [0, 3, 0] }
                                : { y: 0, rotate: 0 }
                        }
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        style={{ transformOrigin: "55px 35px" }}
                    >
                        <ellipse
                            cx="55"
                            cy="35"
                            rx="22"
                            ry="16"
                            fill="#e8e4df"
                            stroke="#6b7c93"
                            strokeWidth="1"
                        />
                        <circle cx="72" cy="22" r="10" fill="#6b7c93" />
                        <circle cx="75" cy="20" r="2" fill="white" />
                        <circle cx="76" cy="20" r="1" fill="#333" />
                        <path d="M 80 22 L 86 20 L 80 24 Z" fill="#c4956a" />
                        <motion.path
                            d="M 40 30 Q 55 25 65 35 Q 55 40 40 35 Z"
                            fill="#a8b5c4"
                            stroke="#6b7c93"
                            strokeWidth="0.5"
                            animate={
                                isOut
                                    ? {
                                          d: [
                                              "M 40 30 Q 55 25 65 35 Q 55 40 40 35 Z",
                                              "M 40 30 Q 55 10 65 20 Q 55 25 40 35 Z",
                                              "M 40 30 Q 55 25 65 35 Q 55 40 40 35 Z",
                                          ],
                                      }
                                    : {
                                          d: "M 40 30 Q 55 25 65 35 Q 55 40 40 35 Z",
                                      }
                            }
                            transition={
                                isOut
                                    ? {
                                          duration: 0.3,
                                          repeat: Infinity,
                                          ease: "easeInOut",
                                      }
                                    : { duration: 0 }
                            }
                        />
                        <path
                            d="M 33 35 L 20 45 L 25 40 Z"
                            fill="#a8b5c4"
                            stroke="#6b7c93"
                            strokeWidth="0.5"
                        />
                        <line
                            x1="50"
                            y1="48"
                            x2="48"
                            y2="55"
                            stroke="#c4956a"
                            strokeWidth="1"
                        />
                        <line
                            x1="60"
                            y1="48"
                            x2="62"
                            y2="55"
                            stroke="#c4956a"
                            strokeWidth="1"
                        />
                    </motion.g>
                </g>
                <motion.circle
                    cx="155"
                    cy="70"
                    r="1.5"
                    fill="#ffb7c5"
                    animate={{ y: [0, 30], opacity: [0, 1, 0], x: [0, -5] }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.circle
                    cx="165"
                    cy="75"
                    r="1"
                    fill="#ff9eb5"
                    animate={{ y: [0, 25], opacity: [0, 1, 0], x: [0, 5] }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: 0.8,
                        ease: "easeInOut",
                    }}
                />
                <motion.circle
                    cx="160"
                    cy="65"
                    r="2"
                    fill="#ffb7c5"
                    animate={{ y: [0, 35], opacity: [0, 1, 0], x: [0, -3] }}
                    transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        delay: 1.5,
                        ease: "easeInOut",
                    }}
                />
            </svg>
        </motion.div>
    )
}

const Ticket2 = ({ isOut, onClick }: any) => {
    return (
        <motion.div
            style={{
                position: "absolute",
                width: 160,
                height: 180,
                left: 70,
                top: 40,
                cursor: isOut ? "grab" : "default",
            }}
            drag={isOut}
            dragMomentum={false}
            dragElastic={0.2}
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            whileDrag={{ scale: 1.05, cursor: "grabbing" }}
            animate={{
                y: isOut ? -110 : 0,
                rotate: isOut ? 4 : 3,
                scale: isOut ? 1.05 : 1,
            }}
            transition={{
                y: { type: "spring", stiffness: 80, damping: 16, delay: 0.05 },
                rotate: { type: "spring", stiffness: 60, damping: 12 },
                scale: { type: "spring", stiffness: 80, damping: 16 },
            }}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
        >
            <svg viewBox="0 0 160 180" width="160" height="180">
                <rect x="0" y="0" width="160" height="180" fill="#fffef0" />
                <path
                    d="M 0 5 L 5 0 L 10 5 L 15 0 L 20 5 L 25 0 L 30 5 L 35 0 L 40 5 L 45 0 L 50 5 L 55 0 L 60 5 L 65 0 L 70 5 L 75 0 L 80 5 L 85 0 L 90 5 L 95 0 L 100 5 L 105 0 L 110 5 L 115 0 L 120 5 L 125 0 L 130 5 L 135 0 L 140 5 L 145 0 L 150 5 L 155 0 L 160 5 L 160 180 L 0 180 Z"
                    fill="#fffef0"
                />
                <text
                    x="80"
                    y="30"
                    fontSize="14"
                    fill="#2c2c2c"
                    fontFamily="serif"
                    textAnchor="middle"
                    fontWeight="bold"
                    letterSpacing="2"
                >
                    MORNING BREW
                </text>
                <text
                    x="80"
                    y="45"
                    fontSize="8"
                    fill="#666"
                    fontFamily="monospace"
                    textAnchor="middle"
                >
                    コーヒー専門店
                </text>
                <line
                    x1="10"
                    y1="55"
                    x2="150"
                    y2="55"
                    stroke="#2c2c2c"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                />
                <text
                    x="15"
                    y="75"
                    fontSize="10"
                    fill="#2c2c2c"
                    fontFamily="monospace"
                >
                    Espresso x2
                </text>
                <text
                    x="145"
                    y="75"
                    fontSize="10"
                    fill="#2c2c2c"
                    fontFamily="monospace"
                    textAnchor="end"
                >
                    ¥600
                </text>
                <text
                    x="15"
                    y="95"
                    fontSize="10"
                    fill="#2c2c2c"
                    fontFamily="monospace"
                >
                    Latte
                </text>
                <text
                    x="145"
                    y="95"
                    fontSize="10"
                    fill="#2c2c2c"
                    fontFamily="monospace"
                    textAnchor="end"
                >
                    ¥450
                </text>
                <text
                    x="15"
                    y="115"
                    fontSize="10"
                    fill="#2c2c2c"
                    fontFamily="monospace"
                >
                    Croissant
                </text>
                <text
                    x="145"
                    y="115"
                    fontSize="10"
                    fill="#2c2c2c"
                    fontFamily="monospace"
                    textAnchor="end"
                >
                    ¥350
                </text>
                <line
                    x1="10"
                    y1="125"
                    x2="150"
                    y2="125"
                    stroke="#2c2c2c"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                />
                <text
                    x="15"
                    y="145"
                    fontSize="12"
                    fill="#2c2c2c"
                    fontFamily="monospace"
                    fontWeight="bold"
                >
                    TOTAL
                </text>
                <text
                    x="145"
                    y="145"
                    fontSize="12"
                    fill="#2c2c2c"
                    fontFamily="monospace"
                    textAnchor="end"
                    fontWeight="bold"
                >
                    ¥1,400
                </text>
                <text
                    x="80"
                    y="172"
                    fontSize="7"
                    fill="#888"
                    fontFamily="monospace"
                    textAnchor="middle"
                >
                    Thank you! / ありがとうございました
                </text>
            </svg>
        </motion.div>
    )
}

// --- STATIC FALLBACK COMPONENTS (No animations, zero performance cost) ---

const Ticket1Static = () => (
    <div
        style={{
            position: "absolute",
            width: 200,
            height: 100,
            left: 50,
            top: 20,
            transform: "rotate(-2deg)",
        }}
    >
        <svg viewBox="0 0 200 100" width="200" height="100">
            <rect x="0" y="0" width="200" height="100" rx="4" fill="#fdf6e3" />
            <circle cx="10" cy="50" r="6" fill="white" />
            <circle cx="190" cy="50" r="6" fill="white" />
            <line
                x1="16"
                y1="50"
                x2="184"
                y2="50"
                stroke="#d4c5a9"
                strokeWidth="1"
                strokeDasharray="4 4"
            />
            <rect x="0" y="0" width="60" height="100" fill="#e8d5b5" rx="4" />
            <text
                x="30"
                y="35"
                fontSize="10"
                fill="#8b4513"
                fontFamily="serif"
                textAnchor="middle"
                fontWeight="bold"
            >
                JR PASS
            </text>
            <text
                x="30"
                y="50"
                fontSize="8"
                fill="#8b4513"
                fontFamily="serif"
                textAnchor="middle"
            >
                新幹線
            </text>
            <text
                x="30"
                y="70"
                fontSize="14"
                fill="#8b4513"
                fontFamily="serif"
                textAnchor="middle"
                fontWeight="bold"
            >
                042
            </text>
            <text
                x="75"
                y="30"
                fontSize="12"
                fill="#333"
                fontFamily="monospace"
                fontWeight="bold"
            >
                KYOTO ➔ TOKYO
            </text>
            <text x="75" y="50" fontSize="9" fill="#666" fontFamily="monospace">
                Car 5 | Seat 12A
            </text>
            <text x="75" y="65" fontSize="9" fill="#666" fontFamily="monospace">
                2026.08.19 | 09:30
            </text>
            <g transform="translate(145, 62) scale(0.35)">
                <path
                    d="M 10 60 Q 50 40 100 50"
                    stroke="#6b7c93"
                    strokeWidth="1.5"
                    fill="none"
                />
                <path
                    d="M 40 50 Q 50 70 45 90"
                    stroke="#6b7c93"
                    strokeWidth="1"
                    fill="none"
                />
                <path
                    d="M 70 48 Q 75 65 72 80"
                    stroke="#6b7c93"
                    strokeWidth="1"
                    fill="none"
                />
                <ellipse
                    cx="45"
                    cy="88"
                    rx="8"
                    ry="3"
                    fill="#c4956a"
                    transform="rotate(-30 45 88)"
                />
                <ellipse
                    cx="72"
                    cy="78"
                    rx="7"
                    ry="3"
                    fill="#c4956a"
                    transform="rotate(20 72 78)"
                />
                <ellipse
                    cx="30"
                    cy="75"
                    rx="6"
                    ry="2.5"
                    fill="#a8b5c4"
                    transform="rotate(-45 30 75)"
                />
                <g style={{ transformOrigin: "55px 35px" }}>
                    <ellipse
                        cx="55"
                        cy="35"
                        rx="22"
                        ry="16"
                        fill="#e8e4df"
                        stroke="#6b7c93"
                        strokeWidth="1"
                    />
                    <circle cx="72" cy="22" r="10" fill="#6b7c93" />
                    <circle cx="75" cy="20" r="2" fill="white" />
                    <circle cx="76" cy="20" r="1" fill="#333" />
                    <path d="M 80 22 L 86 20 L 80 24 Z" fill="#c4956a" />
                    <path
                        d="M 40 30 Q 55 25 65 35 Q 55 40 40 35 Z"
                        fill="#a8b5c4"
                        stroke="#6b7c93"
                        strokeWidth="0.5"
                    />
                    <path
                        d="M 33 35 L 20 45 L 25 40 Z"
                        fill="#a8b5c4"
                        stroke="#6b7c93"
                        strokeWidth="0.5"
                    />
                    <line
                        x1="50"
                        y1="48"
                        x2="48"
                        y2="55"
                        stroke="#c4956a"
                        strokeWidth="1"
                    />
                    <line
                        x1="60"
                        y1="48"
                        x2="62"
                        y2="55"
                        stroke="#c4956a"
                        strokeWidth="1"
                    />
                </g>
            </g>
        </svg>
    </div>
)

const Ticket2Static = () => (
    <div
        style={{
            position: "absolute",
            width: 160,
            height: 180,
            left: 70,
            top: 40,
            transform: "rotate(3deg)",
        }}
    >
        <svg viewBox="0 0 160 180" width="160" height="180">
            <rect x="0" y="0" width="160" height="180" fill="#fffef0" />
            <path
                d="M 0 5 L 5 0 L 10 5 L 15 0 L 20 5 L 25 0 L 30 5 L 35 0 L 40 5 L 45 0 L 50 5 L 55 0 L 60 5 L 65 0 L 70 5 L 75 0 L 80 5 L 85 0 L 90 5 L 95 0 L 100 5 L 105 0 L 110 5 L 115 0 L 120 5 L 125 0 L 130 5 L 135 0 L 140 5 L 145 0 L 150 5 L 155 0 L 160 5 L 160 180 L 0 180 Z"
                fill="#fffef0"
            />
            <text
                x="80"
                y="30"
                fontSize="14"
                fill="#2c2c2c"
                fontFamily="serif"
                textAnchor="middle"
                fontWeight="bold"
                letterSpacing="2"
            >
                MORNING BREW
            </text>
            <text
                x="80"
                y="45"
                fontSize="8"
                fill="#666"
                fontFamily="monospace"
                textAnchor="middle"
            >
                コーヒー専門店
            </text>
            <line
                x1="10"
                y1="55"
                x2="150"
                y2="55"
                stroke="#2c2c2c"
                strokeWidth="1"
                strokeDasharray="2 2"
            />
            <text
                x="15"
                y="75"
                fontSize="10"
                fill="#2c2c2c"
                fontFamily="monospace"
            >
                Espresso x2
            </text>
            <text
                x="145"
                y="75"
                fontSize="10"
                fill="#2c2c2c"
                fontFamily="monospace"
                textAnchor="end"
            >
                ¥600
            </text>
            <text
                x="15"
                y="95"
                fontSize="10"
                fill="#2c2c2c"
                fontFamily="monospace"
            >
                Latte
            </text>
            <text
                x="145"
                y="95"
                fontSize="10"
                fill="#2c2c2c"
                fontFamily="monospace"
                textAnchor="end"
            >
                ¥450
            </text>
            <text
                x="15"
                y="115"
                fontSize="10"
                fill="#2c2c2c"
                fontFamily="monospace"
            >
                Croissant
            </text>
            <text
                x="145"
                y="115"
                fontSize="10"
                fill="#2c2c2c"
                fontFamily="monospace"
                textAnchor="end"
            >
                ¥350
            </text>
            <line
                x1="10"
                y1="125"
                x2="150"
                y2="125"
                stroke="#2c2c2c"
                strokeWidth="1"
                strokeDasharray="2 2"
            />
            <text
                x="15"
                y="145"
                fontSize="12"
                fill="#2c2c2c"
                fontFamily="monospace"
                fontWeight="bold"
            >
                TOTAL
            </text>
            <text
                x="145"
                y="145"
                fontSize="12"
                fill="#2c2c2c"
                fontFamily="monospace"
                textAnchor="end"
                fontWeight="bold"
            >
                ¥1,400
            </text>
            <text
                x="80"
                y="172"
                fontSize="7"
                fill="#888"
                fontFamily="monospace"
                textAnchor="middle"
            >
                Thank you! / ありがとうございました
            </text>
        </svg>
    </div>
)

const TicketIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
            x="3"
            y="6"
            width="18"
            height="12"
            rx="2"
            stroke="white"
            strokeWidth="1.5"
        />
        <circle cx="8" cy="12" r="1.5" fill="white" />
        <circle cx="16" cy="12" r="1.5" fill="white" />
        <line
            x1="12"
            y1="6"
            x2="12"
            y2="18"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="2 2"
        />
    </svg>
)

// --- MAIN COMPONENT ---

export default function StampCollection(props: any) {
    // 1. Check if we are in the Framer editor canvas or static export
    const isStatic = useIsStaticRenderer()
    const theme = getTheme(props.folderColor || "#0a3d2e")

    // 2. If static, return a lightweight, zero-animation fallback
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: 300,
                    height: 380,
                    perspective: 1500,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 300,
                        height: 380,
                        background: theme.inside,
                        borderRadius: 12,
                        zIndex: 1,
                        overflow: "hidden",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 50,
                        width: 200,
                        height: 120,
                        background: theme.pocket,
                        borderRadius: "8px 8px 0 0",
                        zIndex: 3,
                        borderTop: `1px solid ${theme.hinge}`,
                    }}
                />

                {/* Left Door (Closed) */}
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 151,
                        height: 380,
                        background: theme.door,
                        borderRadius: "12px 0 0 12px",
                        zIndex: 10,
                        boxShadow: "inset -2px 0 5px rgba(0,0,0,0.2)",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 16,
                            left: 16,
                            zIndex: 20,
                        }}
                    >
                        <TicketIcon />
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            bottom: 20,
                            left: 20,
                            zIndex: 20,
                        }}
                    >
                        <div
                            style={{
                                color: "white",
                                fontSize: 13,
                                fontFamily: "monospace",
                                letterSpacing: 0.5,
                            }}
                        >
                            Travel Memories
                        </div>
                        <div
                            style={{
                                color: "rgba(255,255,255,0.7)",
                                fontSize: 11,
                                fontFamily: "monospace",
                                marginTop: 4,
                            }}
                        >
                            02 tickets
                        </div>
                    </div>
                    <div
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: `2px solid ${theme.hinge}`,
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                        }}
                    />
                </div>

                {/* Right Door (Closed) */}
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        width: 150,
                        height: 380,
                        background: theme.door,
                        borderRadius: "0 12px 12px 0",
                        zIndex: 10,
                        boxShadow: "inset 2px 0 5px rgba(0,0,0,0.2)",
                    }}
                >
                    <div
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: `2px solid ${theme.hinge}`,
                            position: "absolute",
                            left: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                        }}
                    />
                </div>

                {/* Center Hinge */}
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: `2px solid ${theme.hinge}`,
                        transform: "translate(-50%, -50%)",
                        zIndex: 15,
                        background: theme.door,
                    }}
                />

                {/* Tickets (Tucked inside, behind doors) */}
                <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
                    <Ticket2Static />
                    <Ticket1Static />
                </div>
            </div>
        )
    }

    // 3. Otherwise, render the full interactive experience
    const [isHovered, setIsHovered] = useState(false)
    const [ticketsOut, setTicketsOut] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const isFolderOpen = isHovered

    const handleClick = () => {
        if (isAnimating) return
        if (!ticketsOut) {
            setTicketsOut(true)
            setIsHovered(false)
        } else {
            setIsAnimating(true)
            setIsHovered(true)
            setTimeout(() => setTicketsOut(false), 400)
            setTimeout(() => {
                setIsHovered(false)
                setIsAnimating(false)
            }, 900)
        }
    }

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                background: "white",
                position: "relative",
                overflow: "visible",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: 300,
                    height: 380,
                    perspective: 1500,
                }}
                onMouseEnter={() =>
                    !ticketsOut && !isAnimating && setIsHovered(true)
                }
                onMouseLeave={() =>
                    !ticketsOut && !isAnimating && setIsHovered(false)
                }
                onClick={handleClick}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 300,
                        height: 380,
                        background: theme.inside,
                        borderRadius: 12,
                        zIndex: 1,
                        overflow: "hidden",
                    }}
                />

                <motion.div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 50,
                        width: 200,
                        height: 120,
                        background: theme.pocket,
                        borderRadius: "8px 8px 0 0",
                        zIndex: 3,
                        borderTop: `1px solid ${theme.hinge}`,
                        boxShadow: "0 -4px 10px rgba(0,0,0,0.1)",
                    }}
                    animate={{ height: ticketsOut ? 10 : 120 }}
                    transition={{ type: "spring", stiffness: 80, damping: 18 }}
                />

                <motion.div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 151,
                        height: 380,
                        background: theme.door,
                        borderRadius: "12px 0 0 12px",
                        cursor: "pointer",
                        transformOrigin: "left center",
                        zIndex: 10,
                        boxShadow: "inset -2px 0 5px rgba(0,0,0,0.2)",
                    }}
                    animate={{ rotateY: isFolderOpen ? -105 : 0 }}
                    transition={{ type: "spring", stiffness: 60, damping: 18 }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 16,
                            left: 16,
                            zIndex: 20,
                        }}
                    >
                        <TicketIcon />
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            bottom: 20,
                            left: 20,
                            zIndex: 20,
                        }}
                    >
                        <div
                            style={{
                                color: "white",
                                fontSize: 13,
                                fontFamily: "monospace",
                                letterSpacing: 0.5,
                            }}
                        >
                            Travel Memories
                        </div>
                        <div
                            style={{
                                color: "rgba(255,255,255,0.7)",
                                fontSize: 11,
                                fontFamily: "monospace",
                                marginTop: 4,
                            }}
                        >
                            02 tickets
                        </div>
                    </div>
                    <div
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: `2px solid ${theme.hinge}`,
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                        }}
                    />
                </motion.div>

                <motion.div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        width: 150,
                        height: 380,
                        background: theme.door,
                        borderRadius: "0 12px 12px 0",
                        cursor: "pointer",
                        transformOrigin: "right center",
                        zIndex: 10,
                        boxShadow: "inset 2px 0 5px rgba(0,0,0,0.2)",
                    }}
                    animate={{ rotateY: isFolderOpen ? 105 : 0 }}
                    transition={{ type: "spring", stiffness: 60, damping: 18 }}
                >
                    <div
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: `2px solid ${theme.hinge}`,
                            position: "absolute",
                            left: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                        }}
                    />
                </motion.div>

                <motion.div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: `2px solid ${theme.hinge}`,
                        transform: "translate(-50%, -50%)",
                        zIndex: 15,
                        background: theme.door,
                        pointerEvents: "none",
                    }}
                    animate={{ opacity: isFolderOpen ? 0 : 1 }}
                    transition={{
                        opacity: {
                            duration: 0.3,
                            delay: isFolderOpen ? 0 : 0.5,
                        },
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: ticketsOut ? 20 : 2,
                        pointerEvents: ticketsOut ? "auto" : "none",
                    }}
                >
                    <Ticket2 isOut={ticketsOut} onClick={handleClick} />
                    <Ticket1 isOut={ticketsOut} onClick={handleClick} />
                </div>
            </div>
        </div>
    )
}

addPropertyControls(StampCollection, {
    folderColor: {
        type: ControlType.Color,
        defaultValue: "#0a3d2e",
        title: "Folder Color",
        description: "Pick any color for the folder",
    },
})
