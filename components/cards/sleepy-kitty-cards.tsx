import {
    useState,
    useId,
    useRef,
    useEffect,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    AnimatePresence,
    useInView,
    useReducedMotion,
    useMotionValue,
    useSpring,
    useTransform,
    type TargetAndTransition,
    type Transition,
} from "framer-motion"

/**
 * Sleepy Kitty Cards
 * Cozy service cards for creative studios. Each card has a napping kitty.
 * Hover: the card tilts toward the cursor, a soft glow follows it and the kitty peeks.
 * Click: the card squishes, hearts, paws and sparkles burst out and the kitty wakes up.
 */

type Pattern = "plain" | "tabby" | "tuxedo" | "spots"
type Bed = "pillow" | "basket" | "box" | "laptop"
type Accessory = "none" | "nightcap" | "bow" | "beret" | "glasses" | "headphones"
type HoverEffect = "tilt" | "lift" | "none"
type ClickEffect = "both" | "burst" | "ripple" | "none"

interface KittyCard {
    eyebrow?: string
    title?: string
    description?: string
    selectedText?: string
    ctaLabel?: string
    link?: string
    newTab?: boolean
    cardColor?: string
    catColor?: string
    pattern?: Pattern
    patternColor?: string
    bed?: Bed
    bedColor?: string
    accessory?: Accessory
    accessoryColor?: string
    detailColor?: string
}

interface Props {
    items?: KittyCard[]
    defaultActive?: number
    hoverEffect?: HoverEffect
    tiltAmount?: number
    spotlight?: boolean
    clickEffect?: ClickEffect
    burstCount?: number
    inkColor?: string
    textColor?: string
    cheekColor?: string
    noseColor?: string
    outline?: boolean
    cardHeight?: number
    minCardWidth?: number
    gap?: number
    padding?: number
    radius?: number
    activeLift?: number
    speed?: number
    titleFont?: CSSProperties
    bodyFont?: CSSProperties
    eyebrowFont?: CSSProperties
    style?: CSSProperties
}

const DEFAULT_ITEMS: KittyCard[] = [
    {
        eyebrow: "01 / BRANDING",
        title: "Brand identity.",
        description: "Logos and visual systems that let your brand sleep easy.",
        selectedText: "Identities with personality, made to be remembered.",
        ctaLabel: "See branding",
        link: "",
        cardColor: "#FFD9E4",
        catColor: "#F6A766",
        pattern: "tabby",
        patternColor: "#E27D36",
        bed: "pillow",
        bedColor: "#FFB3C7",
        accessory: "beret",
        accessoryColor: "#E8506E",
        detailColor: "#FFFFFF",
    },
    {
        eyebrow: "02 / WEB DESIGN",
        title: "Websites.",
        description: "Cozy, fast sites dreamed up pixel by pixel.",
        selectedText: "Sites that feel alive and convert like magic.",
        ctaLabel: "See websites",
        link: "",
        cardColor: "#D6E4FF",
        catColor: "#8E97AD",
        pattern: "tuxedo",
        patternColor: "#FFFFFF",
        bed: "laptop",
        bedColor: "#4A4370",
        accessory: "glasses",
        accessoryColor: "#FFFFFF",
        detailColor: "#FFFFFF",
    },
    {
        eyebrow: "03 / MOTION",
        title: "Motion & social.",
        description: "Little moments of motion that stop the scroll.",
        selectedText: "Reels, loops and animations that purr on every feed.",
        ctaLabel: "See motion",
        link: "",
        cardColor: "#FFF0B8",
        catColor: "#FFF8EE",
        pattern: "spots",
        patternColor: "#F2A65A",
        bed: "box",
        bedColor: "#E7B98A",
        accessory: "headphones",
        accessoryColor: "#7C83FD",
        detailColor: "#FFFFFF",
    },
]

/* ---------- SVG geometry (viewBox 0 0 240 200) ---------- */

const BODY = "M66 158 C 62 118, 86 102, 120 102 C 154 102, 178 118, 174 158 Z"
const TAIL = "M174 152 C 204 154, 212 128, 198 113"
const EAR_L =
    "M82 72 C 80 54, 82 40, 88 32 Q 92 27, 98 31 C 104 36, 110 44, 116 54 Z"
const EAR_L_IN =
    "M89 61 C 88 51, 90 45, 93 41 Q 95 39, 98 42 C 101 46, 104 51, 106 56 Z"
const EAR_R =
    "M158 72 C 160 54, 158 40, 152 32 Q 148 27, 142 31 C 136 36, 130 44, 124 54 Z"
const EAR_R_IN =
    "M151 61 C 152 51, 150 45, 147 41 Q 145 39, 142 42 C 139 46, 136 51, 134 56 Z"
const HEART = "M0 6 C -11 -2, -8 -13, 0 -7 C 8 -13, 11 -2, 0 6 Z"
const SPARKLE = "M0 -7 Q 1 -1 7 0 Q 1 1 0 7 Q -1 1 -7 0 Q -1 -1 0 -7 Z"
const MOON = "M46 24 A 15 15 0 1 0 60 48 A 12 12 0 1 1 46 24 Z"

interface KittyProps {
    item: KittyCard
    ink: string
    cheek: string
    nose: string
    outline: boolean
    awake: boolean
    peek: boolean
    speed: number
    reduce: boolean
    /** True while the card is off-screen: looping animations stop. */
    paused: boolean
    uid: string
}

function Paws({
    y,
    color,
    ink,
    stroke,
}: {
    y: number
    color: string
    ink: string
    stroke: string
}) {
    return (
        <g>
            {[105, 135].map((x) => (
                <g key={x}>
                    <ellipse
                        cx={x}
                        cy={y}
                        rx={11}
                        ry={7.5}
                        fill={color}
                        stroke={stroke}
                        strokeWidth={2.6}
                    />
                    <path
                        d={"M" + (x - 3) + " " + (y + 1) + " v 4 M" + (x + 3) + " " + (y + 1) + " v 4"}
                        stroke={ink}
                        strokeOpacity={0.35}
                        strokeWidth={1.8}
                        strokeLinecap="round"
                    />
                </g>
            ))}
        </g>
    )
}

interface EyeAnimation {
    animate: TargetAndTransition
    transition: Transition
}

function eyeAnimation(open: boolean, half: boolean, loop: boolean, k: number): EyeAnimation {
    if (open) {
        return {
            animate: loop
                ? { opacity: 1, scaleY: [0.1, 1, 1, 0.1, 1] }
                : { opacity: 1, scaleY: 1 },
            transition: loop
                ? {
                      opacity: { duration: 0.1 },
                      scaleY: {
                          duration: 3.6 * k,
                          times: [0, 0.06, 0.9, 0.95, 1],
                          repeat: Infinity,
                      },
                  }
                : { duration: 0.15 },
        }
    }
    if (half) {
        return {
            animate: { opacity: 1, scaleY: 0.55 },
            transition: { type: "spring", stiffness: 400, damping: 22 },
        }
    }
    return {
        animate: { opacity: 0, scaleY: 0.1 },
        transition: { duration: 0.15 },
    }
}

function Kitty({
    item,
    ink,
    cheek,
    nose,
    outline,
    awake,
    peek,
    speed,
    reduce,
    paused,
    uid,
}: KittyProps) {
    const cat = item.catColor || "#F6A766"
    const pat = item.patternColor || "#E27D36"
    const pattern: Pattern = item.pattern || "plain"
    const bed: Bed = item.bed || "pillow"
    const bedColor = item.bedColor || "#FFB3C7"
    const acc: Accessory = item.accessory || "none"
    const accColor = item.accessoryColor || "#8C8CF5"
    const detail = item.detailColor || "#FFFFFF"
    const stroke = outline ? ink : "none"
    const sw = 2.6
    const k = 1 / Math.max(0.1, speed)
    const loop = !reduce && !paused
    const headClip = uid + "-head"
    const bodyClip = uid + "-body"
    const pawColor = pattern === "tuxedo" ? pat : cat
    const pawY =
        bed === "pillow" ? 158 : bed === "basket" ? 134 : bed === "laptop" ? 118 : 125

    const leftEye = eyeAnimation(awake, false, loop, k)
    const rightEye = eyeAnimation(awake, peek, loop, k)

    const tail = (
        <motion.g
            style={{ originX: 0, originY: 1 }}
            animate={
                awake && loop
                    ? { rotate: [0, 14, -6, 14, 0] }
                    : peek && loop
                      ? { rotate: [0, 8, 0] }
                      : { rotate: 0 }
            }
            transition={
                awake && loop
                    ? {
                          duration: 1.4 * k,
                          repeat: Infinity,
                          repeatDelay: 0.4 * k,
                          ease: "easeInOut",
                      }
                    : peek && loop
                      ? { duration: 0.9 * k, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.4 * k }
            }
        >
            {outline && (
                <path
                    d={TAIL}
                    fill="none"
                    stroke={ink}
                    strokeWidth={13 + sw * 2}
                    strokeLinecap="round"
                />
            )}
            <path
                d={TAIL}
                fill="none"
                stroke={cat}
                strokeWidth={13}
                strokeLinecap="round"
            />
            {pattern === "tabby" && (
                <path
                    d="M196 128 l 9 2 M201 118 l 8 -2"
                    stroke={pat}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                />
            )}
        </motion.g>
    )

    const earTransition: Transition =
        peek && loop
            ? { duration: 0.5 * k, ease: "easeInOut" }
            : { type: "spring", stiffness: 260, damping: 14 }

    return (
        <svg
            viewBox="0 0 240 200"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: "visible", display: "block" }}
            aria-hidden="true"
        >
            <defs>
                <clipPath id={headClip}>
                    <ellipse cx={120} cy={84} rx={42} ry={35} />
                </clipPath>
                <clipPath id={bodyClip}>
                    <path d={BODY} />
                </clipPath>
            </defs>

            {/* night sky details */}
            <motion.path
                d={MOON}
                fill={detail}
                animate={
                    loop && !awake
                        ? { opacity: [0.75, 1, 0.75] }
                        : { opacity: awake ? 0.45 : 0.9 }
                }
                transition={
                    loop && !awake
                        ? { duration: 3.6 * k, repeat: Infinity }
                        : { duration: 0.4 }
                }
            />
            {[
                { x: 206, y: 66, s: 1, d: 0 },
                { x: 30, y: 96, s: 0.7, d: 0.8 },
                { x: 72, y: 20, s: 0.55, d: 1.6 },
            ].map((st, i) => (
                <g
                    key={i}
                    transform={"translate(" + st.x + " " + st.y + ") scale(" + st.s + ")"}
                >
                    <motion.path
                        d={SPARKLE}
                        fill={detail}
                        animate={
                            loop
                                ? { opacity: [0.25, 1, 0.25], scale: [0.8, 1.1, 0.8] }
                                : { opacity: 0.8 }
                        }
                        transition={
                            loop
                                ? {
                                      duration: (peek ? 1.2 : 2.4) * k,
                                      repeat: Infinity,
                                      delay: st.d * k,
                                  }
                                : undefined
                        }
                    />
                </g>
            ))}

            {/* pillow sits behind the kitty */}
            {bed === "pillow" && (
                <g>
                    <path
                        d="M40 152 Q 34 146 42 142 Q 120 132 198 142 Q 206 146 200 152 L 202 176 Q 206 186 194 186 Q 120 194 46 186 Q 34 186 38 176 Z"
                        fill={bedColor}
                        stroke={stroke}
                        strokeWidth={sw}
                        strokeLinejoin="round"
                    />
                    <path
                        d="M56 178 Q 120 184 184 178"
                        fill="none"
                        stroke={ink}
                        strokeOpacity={0.15}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeDasharray="2 7"
                    />
                </g>
            )}

            {/* kitty: breathes while asleep, hops when it wakes up */}
            <motion.g
                style={{ originX: 0.5, originY: 1 }}
                animate={
                    awake
                        ? { scaleY: 1, scaleX: 1, y: loop ? [0, -10, 0] : 0 }
                        : loop
                          ? { scaleY: [1, 1.04, 1], scaleX: [1, 0.99, 1], y: 0 }
                          : { scaleY: 1, scaleX: 1, y: 0 }
                }
                transition={
                    awake
                        ? { duration: 0.45 * k, ease: "easeOut" }
                        : loop
                          ? { duration: 3.2 * k, repeat: Infinity, ease: "easeInOut" }
                          : { duration: 0.3 }
                }
            >
                {bed === "pillow" && tail}

                {/* body */}
                <path d={BODY} fill={cat} />
                <g clipPath={"url(#" + bodyClip + ")"}>
                    {pattern === "tuxedo" && (
                        <ellipse cx={120} cy={134} rx={22} ry={26} fill={pat} />
                    )}
                    {pattern === "spots" && (
                        <>
                            <circle cx={166} cy={150} r={22} fill={pat} />
                            <circle cx={74} cy={124} r={11} fill={pat} />
                        </>
                    )}
                    {pattern === "tabby" && (
                        <path
                            d="M70 130 Q 80 128 86 136 M68 144 Q 78 142 84 150 M170 130 Q 160 128 154 136 M172 144 Q 162 142 156 150"
                            fill="none"
                            stroke={pat}
                            strokeWidth={4}
                            strokeLinecap="round"
                        />
                    )}
                </g>
                {outline && (
                    <path
                        d={BODY}
                        fill="none"
                        stroke={ink}
                        strokeWidth={sw}
                        strokeLinejoin="round"
                    />
                )}

                {bed === "pillow" && (
                    <Paws y={pawY} color={pawColor} ink={ink} stroke={stroke} />
                )}

                {/* head: tilts sleepily, straightens when awake */}
                <motion.g
                    style={{ originX: 0.5, originY: 0.9 }}
                    animate={{ rotate: awake ? 0 : peek ? -3 : -7 }}
                    transition={{ type: "spring", stiffness: 180, damping: 14 }}
                >
                    {/* ears */}
                    <motion.g
                        style={{ originX: 0.5, originY: 1 }}
                        animate={{ rotate: awake ? 0 : peek ? -4 : -10 }}
                        transition={{ type: "spring", stiffness: 260, damping: 12 }}
                    >
                        <path
                            d={EAR_L}
                            fill={cat}
                            stroke={stroke}
                            strokeWidth={sw}
                            strokeLinejoin="round"
                        />
                        <path d={EAR_L_IN} fill={nose} opacity={0.75} />
                    </motion.g>
                    <motion.g
                        style={{ originX: 0.5, originY: 1 }}
                        animate={
                            awake
                                ? { rotate: 0 }
                                : peek && loop
                                  ? { rotate: [10, -6, 14, 2] }
                                  : { rotate: 10 }
                        }
                        transition={earTransition}
                    >
                        <path
                            d={EAR_R}
                            fill={cat}
                            stroke={stroke}
                            strokeWidth={sw}
                            strokeLinejoin="round"
                        />
                        <path d={EAR_R_IN} fill={nose} opacity={0.75} />
                    </motion.g>

                    {/* head */}
                    <ellipse cx={120} cy={84} rx={42} ry={35} fill={cat} />
                    <g clipPath={"url(#" + headClip + ")"}>
                        {pattern === "spots" && (
                            <circle cx={86} cy={58} r={26} fill={pat} />
                        )}
                        {pattern === "tuxedo" && (
                            <path
                                d="M120 64 C 108 80, 96 92, 96 104 Q 120 124 144 104 C 144 92, 132 80, 120 64 Z"
                                fill={pat}
                            />
                        )}
                        {pattern === "tabby" && (
                            <path
                                d="M111 52 L 113 63 M120 50 L 120 62 M129 52 L 127 63 M78 82 L 90 85 M80 92 L 90 92 M162 82 L 150 85 M160 92 L 150 92"
                                fill="none"
                                stroke={pat}
                                strokeWidth={4}
                                strokeLinecap="round"
                            />
                        )}
                    </g>
                    {outline && (
                        <ellipse
                            cx={120}
                            cy={84}
                            rx={42}
                            ry={35}
                            fill="none"
                            stroke={ink}
                            strokeWidth={sw}
                        />
                    )}

                    {/* cheeks */}
                    <motion.ellipse
                        cx={95}
                        cy={97}
                        rx={7.5}
                        ry={4.5}
                        fill={cheek}
                        animate={{ opacity: peek || awake ? 0.9 : 0.6 }}
                    />
                    <motion.ellipse
                        cx={145}
                        cy={97}
                        rx={7.5}
                        ry={4.5}
                        fill={cheek}
                        animate={{ opacity: peek || awake ? 0.9 : 0.6 }}
                    />

                    {/* sleepy eyes */}
                    <motion.path
                        d="M97 86 Q 104 93 111 86"
                        fill="none"
                        stroke={ink}
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        animate={{ opacity: awake ? 0 : 1 }}
                        transition={{ duration: 0.15 }}
                    />
                    <motion.path
                        d="M129 86 Q 136 93 143 86"
                        fill="none"
                        stroke={ink}
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        animate={{ opacity: awake || peek ? 0 : 1 }}
                        transition={{ duration: 0.12 }}
                    />
                    {/* open eyes: left opens when awake, right peeks on hover */}
                    <motion.g
                        style={{ originX: 0.5, originY: 0.5 }}
                        initial={false}
                        animate={leftEye.animate}
                        transition={leftEye.transition}
                    >
                        <ellipse cx={104} cy={85} rx={6} ry={7} fill={ink} />
                        <circle cx={106.2} cy={82.4} r={2.1} fill="#FFFFFF" />
                    </motion.g>
                    <motion.g
                        style={{ originX: 0.5, originY: 0.5 }}
                        initial={false}
                        animate={rightEye.animate}
                        transition={rightEye.transition}
                    >
                        <ellipse cx={136} cy={85} rx={6} ry={7} fill={ink} />
                        <circle cx={138.2} cy={82.4} r={2.1} fill="#FFFFFF" />
                    </motion.g>

                    {/* nose + mouth + whiskers */}
                    <path
                        d="M115.5 94.5 L 124.5 94.5 L 120 99.5 Z"
                        fill={nose}
                        stroke={nose}
                        strokeWidth={2}
                        strokeLinejoin="round"
                    />
                    <path
                        d="M113.5 101 Q 116.75 105.5 120 101 Q 123.25 105.5 126.5 101"
                        fill="none"
                        stroke={ink}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                    />
                    <path
                        d="M76 93 L 91 95.5 M77 101 L 91 100 M164 93 L 149 95.5 M163 101 L 149 100"
                        stroke={ink}
                        strokeOpacity={0.45}
                        strokeWidth={1.8}
                        strokeLinecap="round"
                    />

                    {/* accessories */}
                    {acc === "glasses" && (
                        <g>
                            <circle
                                cx={104}
                                cy={86}
                                r={11.5}
                                fill={accColor}
                                fillOpacity={0.3}
                                stroke={ink}
                                strokeWidth={2.6}
                            />
                            <circle
                                cx={136}
                                cy={86}
                                r={11.5}
                                fill={accColor}
                                fillOpacity={0.3}
                                stroke={ink}
                                strokeWidth={2.6}
                            />
                            <path
                                d="M115.5 85 Q 120 81.5 124.5 85 M92.5 84 L 80 80 M147.5 84 L 160 80"
                                fill="none"
                                stroke={ink}
                                strokeWidth={2.6}
                                strokeLinecap="round"
                            />
                        </g>
                    )}
                    {acc === "headphones" && (
                        <g>
                            {outline && (
                                <path
                                    d="M79 82 C 76 34, 164 34, 161 82"
                                    fill="none"
                                    stroke={ink}
                                    strokeWidth={7 + sw * 2}
                                    strokeLinecap="round"
                                />
                            )}
                            <path
                                d="M79 82 C 76 34, 164 34, 161 82"
                                fill="none"
                                stroke={accColor}
                                strokeWidth={7}
                                strokeLinecap="round"
                            />
                            <rect
                                x={68}
                                y={72}
                                width={17}
                                height={29}
                                rx={8}
                                fill={accColor}
                                stroke={stroke}
                                strokeWidth={sw}
                            />
                            <rect
                                x={155}
                                y={72}
                                width={17}
                                height={29}
                                rx={8}
                                fill={accColor}
                                stroke={stroke}
                                strokeWidth={sw}
                            />
                            <path
                                d="M73 78 L 73 92 M167 78 L 167 92"
                                stroke="#FFFFFF"
                                strokeOpacity={0.45}
                                strokeWidth={3}
                                strokeLinecap="round"
                            />
                        </g>
                    )}
                    {acc === "beret" && (
                        <motion.g
                            style={{ originX: 0.3, originY: 1 }}
                            animate={awake ? { rotate: [0, -8, 4, 0] } : { rotate: 0 }}
                            transition={{ duration: 0.6 * k }}
                        >
                            {outline && (
                                <path
                                    d="M118 40 L 121 30"
                                    stroke={ink}
                                    strokeWidth={5 + sw * 2}
                                    strokeLinecap="round"
                                />
                            )}
                            <path
                                d="M118 40 L 121 30"
                                stroke={accColor}
                                strokeWidth={5}
                                strokeLinecap="round"
                            />
                            <ellipse
                                cx={114}
                                cy={50}
                                rx={38}
                                ry={13.5}
                                transform="rotate(-12 114 50)"
                                fill={accColor}
                                stroke={stroke}
                                strokeWidth={sw}
                            />
                            <path
                                d="M88 54 Q 104 40 128 38"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeOpacity={0.35}
                                strokeWidth={3.5}
                                strokeLinecap="round"
                            />
                        </motion.g>
                    )}
                    {acc === "bow" && (
                        <g transform="translate(97 55) rotate(-18)">
                            <path
                                d="M0 0 L -14 -8 Q -17 0 -14 8 Z M0 0 L 14 -8 Q 17 0 14 8 Z"
                                fill={accColor}
                                stroke={stroke}
                                strokeWidth={2.2}
                                strokeLinejoin="round"
                            />
                            <circle
                                r={4.2}
                                fill={accColor}
                                stroke={stroke}
                                strokeWidth={2.2}
                            />
                        </g>
                    )}
                    {acc === "nightcap" && (
                        <motion.g
                            style={{ originX: 0.15, originY: 1 }}
                            animate={awake ? { rotate: [0, -6, 3, 0] } : { rotate: 0 }}
                            transition={{ duration: 0.6 * k }}
                        >
                            <path
                                d="M90 60 C 96 30, 134 14, 172 24 C 188 30, 198 46, 198 62 C 188 52, 174 46, 160 50 C 150 46, 120 44, 90 60 Z"
                                fill={accColor}
                                stroke={stroke}
                                strokeWidth={sw}
                                strokeLinejoin="round"
                            />
                            <path
                                d="M118 30 Q 128 38 126 50 M146 22 Q 152 34 150 48"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeOpacity={0.45}
                                strokeWidth={4}
                                strokeLinecap="round"
                            />
                            {outline && (
                                <path
                                    d="M86 62 Q 122 42 162 56"
                                    fill="none"
                                    stroke={ink}
                                    strokeWidth={12 + sw * 2}
                                    strokeLinecap="round"
                                />
                            )}
                            <path
                                d="M86 62 Q 122 42 162 56"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeWidth={12}
                                strokeLinecap="round"
                            />
                            <circle
                                cx={199}
                                cy={67}
                                r={8.5}
                                fill="#FFFFFF"
                                stroke={stroke}
                                strokeWidth={sw}
                            />
                        </motion.g>
                    )}
                </motion.g>
            </motion.g>

            {/* basket / box / laptop sit in front of the kitty */}
            {bed === "basket" && (
                <g>
                    <path
                        d="M40 128 Q 120 144 200 128 L 190 172 Q 186 186 170 186 L 70 186 Q 54 186 50 172 Z"
                        fill={bedColor}
                        stroke={stroke}
                        strokeWidth={sw}
                        strokeLinejoin="round"
                    />
                    <path
                        d="M72 140 Q 74 162 74 184 M97 143 Q 98 164 98 185 M120 144 L 120 185 M143 143 Q 142 164 142 185 M168 140 Q 166 162 166 184 M50 158 Q 120 172 190 158"
                        fill="none"
                        stroke={ink}
                        strokeOpacity={0.18}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                    <path
                        d="M42 129 Q 120 145 198 129"
                        fill="none"
                        stroke={ink}
                        strokeOpacity={0.22}
                        strokeWidth={6}
                        strokeLinecap="round"
                    />
                </g>
            )}
            {bed === "box" && (
                <g>
                    <path
                        d="M50 124 L 26 100 L 60 96 L 80 124 Z"
                        fill={bedColor}
                        stroke={stroke}
                        strokeWidth={sw}
                        strokeLinejoin="round"
                    />
                    <path
                        d="M190 124 L 214 100 L 180 96 L 160 124 Z"
                        fill={bedColor}
                        stroke={stroke}
                        strokeWidth={sw}
                        strokeLinejoin="round"
                    />
                    <path
                        d="M50 124 L 26 100 L 60 96 L 80 124 Z M190 124 L 214 100 L 180 96 L 160 124 Z"
                        fill="#FFFFFF"
                        opacity={0.22}
                    />
                    <rect
                        x={48}
                        y={122}
                        width={144}
                        height={64}
                        rx={5}
                        fill={bedColor}
                        stroke={stroke}
                        strokeWidth={sw}
                    />
                    <path
                        d={HEART}
                        transform="translate(120 156) scale(1.15)"
                        fill={nose}
                        opacity={0.9}
                    />
                    <path
                        d="M60 176 L 84 176"
                        stroke={ink}
                        strokeOpacity={0.2}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                    />
                </g>
            )}
            {bed === "laptop" && (
                <g>
                    <rect
                        x={60}
                        y={114}
                        width={120}
                        height={66}
                        rx={9}
                        fill={bedColor}
                        stroke={stroke}
                        strokeWidth={sw}
                    />
                    <path
                        d="M70 122 L 92 122"
                        stroke="#FFFFFF"
                        strokeOpacity={0.25}
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                    <path
                        d={HEART}
                        transform="translate(120 148) scale(1.2)"
                        fill={nose}
                    />
                    <path
                        d="M42 180 L 198 180 Q 204 180 202 186 Q 200 190 194 190 L 46 190 Q 40 190 38 186 Q 36 180 42 180 Z"
                        fill={bedColor}
                        stroke={stroke}
                        strokeWidth={sw}
                        strokeLinejoin="round"
                    />
                    <path
                        d="M42 180 L 198 180 Q 204 180 202 186 Q 200 190 194 190 L 46 190 Q 40 190 38 186 Q 36 180 42 180 Z"
                        fill="#FFFFFF"
                        opacity={0.18}
                    />
                </g>
            )}
            {bed !== "pillow" && tail}
            {bed !== "pillow" && (
                <Paws y={pawY} color={pawColor} ink={ink} stroke={stroke} />
            )}

            {/* zzz while asleep, a heart once awake */}
            <AnimatePresence>
                {!awake &&
                    [0, 1, 2].map((i) => (
                        <motion.text
                            key={"z" + i}
                            x={166 + i * 8}
                            y={50 - i * 9}
                            fill={ink}
                            fontSize={12 + i * 4}
                            fontWeight={800}
                            fontFamily="inherit"
                            initial={{ opacity: 0, x: 0, y: 0 }}
                            animate={
                                loop
                                    ? {
                                          opacity: [0, 1, 1, 0],
                                          x: [0, 4, 9, 14],
                                          y: [0, -6, -12, -18],
                                      }
                                    : { opacity: 0.9 - i * 0.15 }
                            }
                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                            transition={
                                loop
                                    ? {
                                          duration: 2.7 * k,
                                          repeat: Infinity,
                                          delay: i * 0.9 * k,
                                          ease: "easeOut",
                                      }
                                    : undefined
                            }
                        >
                            z
                        </motion.text>
                    ))}
                {awake && (
                    <motion.g
                        key="heart"
                        initial={{ opacity: 0, scale: 0.2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ type: "spring", stiffness: 380, damping: 14 }}
                        style={{ originX: 0.5, originY: 0.5 }}
                    >
                        <motion.g
                            animate={loop ? { y: [0, -5, 0] } : { y: 0 }}
                            transition={
                                loop
                                    ? { duration: 1.6 * k, repeat: Infinity, ease: "easeInOut" }
                                    : undefined
                            }
                        >
                            <path
                                d={HEART}
                                transform="translate(186 36) scale(1.5)"
                                fill={nose}
                                stroke={stroke}
                                strokeWidth={1.6}
                                strokeLinejoin="round"
                            />
                        </motion.g>
                    </motion.g>
                )}
            </AnimatePresence>
        </svg>
    )
}

function PawIcon({ color, size = 14 }: { color: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <ellipse cx="12" cy="16" rx="5.5" ry="4.6" fill={color} />
            <ellipse cx="5" cy="10.5" rx="2.3" ry="2.9" fill={color} />
            <ellipse cx="9.4" cy="6" rx="2.3" ry="2.9" fill={color} />
            <ellipse cx="14.6" cy="6" rx="2.3" ry="2.9" fill={color} />
            <ellipse cx="19" cy="10.5" rx="2.3" ry="2.9" fill={color} />
        </svg>
    )
}

/* ---------- click burst ---------- */

interface Burst {
    id: number
    x: number
    y: number
}

function seeded(n: number) {
    const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453
    return v - Math.floor(v)
}

function Particle({
    burst,
    index,
    count,
    colors,
    speed,
}: {
    burst: Burst
    index: number
    count: number
    colors: string[]
    speed: number
}) {
    const r1 = seeded(burst.id * 31 + index * 7)
    const r2 = seeded(burst.id * 17 + index * 13)
    const r3 = seeded(burst.id * 5 + index * 3)
    const angle = (index / count) * Math.PI * 2 + (r1 - 0.5) * 0.6
    const dist = 70 + r2 * 80
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist - 20
    const size = 16 + Math.round(r3 * 10)
    const kind = index % 3
    const color = colors[index % colors.length]
    const k = 1 / Math.max(0.1, speed)
    return (
        <motion.div
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
                x: dx,
                y: [0, dy, dy + 22],
                scale: [0, 1.15, 0.8],
                opacity: [1, 1, 0],
                rotate: (r1 - 0.5) * 140,
            }}
            transition={{ duration: 0.95 * k, ease: "easeOut", times: [0, 0.55, 1] }}
            style={{
                position: "absolute",
                left: burst.x - size / 2,
                top: burst.y - size / 2,
                width: size,
                height: size,
                pointerEvents: "none",
                zIndex: 4,
            }}
        >
            {kind === 0 && (
                <svg width={size} height={size} viewBox="-12 -14 24 22" aria-hidden="true">
                    <path d={HEART} fill={color} />
                </svg>
            )}
            {kind === 1 && <PawIcon color={color} size={size} />}
            {kind === 2 && (
                <svg width={size} height={size} viewBox="-8 -8 16 16" aria-hidden="true">
                    <path d={SPARKLE} fill={color} />
                </svg>
            )}
        </motion.div>
    )
}

/* ---------- card ---------- */

interface Shared {
    ink: string
    textColor: string
    cheek: string
    nose: string
    outline: boolean
    cardHeight: number
    padding: number
    radius: number
    activeLift: number
    speed: number
    reduce: boolean
    hoverEffect: HoverEffect
    tiltAmount: number
    spotlight: boolean
    clickEffect: ClickEffect
    burstCount: number
    titleFont?: CSSProperties
    bodyFont?: CSSProperties
    eyebrowFont?: CSSProperties
}

function Card({
    item,
    isActive,
    onToggle,
    uid,
    s,
}: {
    item: KittyCard
    isActive: boolean
    onToggle: () => void
    uid: string
    s: Shared
}) {
    const ref = useRef<HTMLDivElement>(null)
    const timers = useRef<Set<number>>(new Set())
    const nextId = useRef(1)
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    const [bursts, setBursts] = useState<Burst[]>([])
    // Only run the looping kitty animations while the card is near the viewport.
    const inView = useInView(ref, { margin: "120px 0px 120px 0px" })

    const rxRaw = useMotionValue(0)
    const ryRaw = useMotionValue(0)
    const rotateX = useSpring(rxRaw, { stiffness: 220, damping: 18 })
    const rotateY = useSpring(ryRaw, { stiffness: 220, damping: 18 })
    const gx = useMotionValue(50)
    const gy = useMotionValue(30)
    const glow = useTransform([gx, gy], (v: number[]) =>
        "radial-gradient(circle at " +
        v[0] +
        "% " +
        v[1] +
        "%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 55%)"
    )

    useEffect(() => {
        const list = timers.current
        return () => {
            list.forEach((t) => window.clearTimeout(t))
            list.clear()
        }
    }, [])

    const tiltOn = s.hoverEffect === "tilt" && !s.reduce
    const hoverOn = s.hoverEffect !== "none"
    const k = 1 / Math.max(0.1, s.speed)

    const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.pointerType === "touch") return
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
        const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
        gx.set(px * 100)
        gy.set(py * 100)
        if (tiltOn) {
            ryRaw.set((px - 0.5) * 2 * s.tiltAmount)
            rxRaw.set(-(py - 0.5) * 2 * s.tiltAmount)
        }
    }

    const onLeave = () => {
        setHovered(false)
        rxRaw.set(0)
        ryRaw.set(0)
    }

    const onClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
        const el = ref.current
        if (el && !s.reduce && s.clickEffect !== "none") {
            const r = el.getBoundingClientRect()
            const fromPointer = e.clientX !== 0 || e.clientY !== 0
            const x = fromPointer ? e.clientX - r.left : r.width / 2
            const y = fromPointer ? e.clientY - r.top : r.height * 0.4
            const id = nextId.current++
            setBursts((b) => [...b.slice(-3), { id, x, y }])
            const t = window.setTimeout(() => {
                timers.current.delete(t)
                setBursts((b) => b.filter((item) => item.id !== id))
            }, 1200 * k)
            timers.current.add(t)
        }
        onToggle()
    }

    const hasLink = !!(item.link && item.link.length > 0)
    // Links open in the same tab unless "New Tab" is on. New tabs always get rel="noopener noreferrer".
    const openInNewTab = hasLink && item.newTab === true
    const linkHost = hasLink ? externalHost(item.link as string) : ""
    const linkContext =
        " about " +
        (item.title || "this service") +
        (linkHost ? ", on " + linkHost : "") +
        (openInNewTab ? " (opens in a new tab)" : "")
    const card = item.cardColor || "#FFD9E4"
    const particleColors = [
        s.nose,
        item.patternColor || s.ink,
        item.accessoryColor && item.accessory !== "glasses" ? item.accessoryColor : s.ink,
        "#FFFFFF",
        s.ink,
    ]
    const showBurst = s.clickEffect === "both" || s.clickEffect === "burst"
    const showRipple = s.clickEffect === "both" || s.clickEffect === "ripple"
    const spring: Transition = s.reduce
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 300, damping: 24 }

    const hoverY = hoverOn && hovered ? (s.hoverEffect === "lift" ? -8 : -4) : 0

    return (
        <motion.div
            ref={ref}
            role="listitem"
            onPointerEnter={() => setHovered(true)}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            initial={false}
            animate={{
                y: isActive ? -s.activeLift : hoverY,
                scale: hoverOn && hovered && !isActive ? 1.015 : 1,
                boxShadow: isActive
                    ? "0px 26px 44px -22px rgba(43, 35, 64, 0.45)"
                    : hoverOn && hovered
                      ? "0px 18px 36px -24px rgba(43, 35, 64, 0.35)"
                      : "0px 0px 0px 0px rgba(43, 35, 64, 0)",
            }}
            whileTap={s.reduce ? undefined : { scale: 0.965 }}
            transition={spring}
            style={{
                position: "relative",
                height: s.cardHeight,
                borderRadius: s.radius,
                background: card,
                padding: s.padding,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                outline: focused ? "2px solid " + s.ink : "none",
                outlineOffset: 3,
                rotateX: tiltOn ? rotateX : 0,
                rotateY: tiltOn ? rotateY : 0,
                transformPerspective: 900,
                willChange: "transform",
            }}
        >
            {/* cursor glow */}
            {s.spotlight && !s.reduce && (
                <motion.div
                    aria-hidden="true"
                    animate={{ opacity: hovered ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: glow,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
            )}

            {/* click ripples + particles */}
            <AnimatePresence>
                {bursts.map((b) => (
                    <div
                        key={b.id}
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            zIndex: 4,
                        }}
                    >
                        {showRipple && (
                            <motion.div
                                initial={{ scale: 0.2, opacity: 1 }}
                                animate={{ scale: 1, opacity: 0 }}
                                transition={{ duration: 0.7 * k, ease: "easeOut" }}
                                style={{
                                    position: "absolute",
                                    left: b.x - 110,
                                    top: b.y - 110,
                                    width: 220,
                                    height: 220,
                                    borderRadius: 220,
                                    border: "3px solid rgba(255,255,255,0.95)",
                                    boxSizing: "border-box",
                                }}
                            />
                        )}
                        {showBurst &&
                            Array.from({ length: Math.max(1, s.burstCount) }).map((_, i) => (
                                <Particle
                                    key={i}
                                    burst={b}
                                    index={i}
                                    count={Math.max(1, s.burstCount)}
                                    colors={particleColors}
                                    speed={s.speed}
                                />
                            ))}
                    </div>
                ))}
            </AnimatePresence>

            {/* full-card toggle (kept separate from the CTA link) */}
            <button
                type="button"
                aria-pressed={isActive}
                aria-label={(item.title || "Card") + (isActive ? " (awake)" : " (sleeping)")}
                onClick={onClick}
                onFocus={(e) => {
                    if (e.currentTarget.matches(":focus-visible")) setFocused(true)
                }}
                onBlur={() => setFocused(false)}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    borderRadius: s.radius,
                    outline: "none",
                }}
            />

            {/* header */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    pointerEvents: "none",
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: s.textColor,
                        ...s.eyebrowFont,
                    }}
                >
                    {item.eyebrow}
                </span>
                <motion.span
                    animate={{
                        scale: isActive ? 1.35 : hovered && hoverOn ? 1.2 : 1,
                        backgroundColor: isActive ? s.ink : item.patternColor || s.nose,
                    }}
                    transition={spring}
                    style={{ width: 8, height: 8, borderRadius: 8, display: "block" }}
                />
            </div>

            {/* illustration */}
            <motion.div
                animate={{ scale: hoverOn && hovered && !isActive ? 1.04 : 1 }}
                transition={spring}
                style={{
                    position: "relative",
                    flex: "1 1 0",
                    minHeight: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 0 4px",
                    pointerEvents: "none",
                }}
            >
                <Kitty
                    item={item}
                    ink={s.ink}
                    cheek={s.cheek}
                    nose={s.nose}
                    outline={s.outline}
                    awake={isActive}
                    peek={hoverOn && hovered && !isActive}
                    speed={s.speed}
                    reduce={s.reduce}
                    paused={!inView}
                    uid={uid}
                />
            </motion.div>

            {/* copy */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    pointerEvents: "none",
                    color: s.textColor,
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontSize: 30,
                        fontWeight: 700,
                        letterSpacing: "-0.03em",
                        lineHeight: 1,
                        ...s.titleFont,
                    }}
                >
                    {item.title}
                </h3>
                <div style={{ position: "relative", minHeight: "2.9em" }}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                            key={isActive ? "awake" : "asleep"}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: s.reduce ? 0 : 0.22 * k }}
                            style={{
                                margin: 0,
                                fontSize: 14,
                                lineHeight: 1.45,
                                opacity: 0.85,
                                ...s.bodyFont,
                            }}
                        >
                            {isActive ? item.selectedText || item.description : item.description}
                        </motion.p>
                    </AnimatePresence>
                </div>
                <AnimatePresence initial={false}>
                    {isActive && item.ctaLabel && (
                        <motion.div
                            key="cta"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={spring}
                            style={{ overflow: "hidden" }}
                        >
                            {hasLink ? (
                                <a
                                    href={item.link}
                                    target={openInNewTab ? "_blank" : undefined}
                                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                                    style={{
                                        ...ctaStyle(s.ink),
                                        pointerEvents: "auto",
                                        position: "relative",
                                        zIndex: 2,
                                        ...s.bodyFont,
                                        fontWeight: 700,
                                    }}
                                >
                                    {item.ctaLabel}
                                    <span style={srOnly}>{linkContext}</span>
                                    <span style={pawBadge(s.ink)} aria-hidden="true">
                                        <PawIcon color={card} />
                                    </span>
                                </a>
                            ) : (
                                <span style={{ ...ctaStyle(s.ink), ...s.bodyFont, fontWeight: 700 }}>
                                    {item.ctaLabel}
                                    <span style={pawBadge(s.ink)}>
                                        <PawIcon color={card} />
                                    </span>
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SleepyKittyCards(props: Props) {
    const {
        items,
        defaultActive = 0,
        hoverEffect = "tilt",
        tiltAmount = 8,
        spotlight = true,
        clickEffect = "both",
        burstCount = 12,
        inkColor = "#2B2340",
        textColor = "#2B2340",
        cheekColor = "#FF8FAB",
        noseColor = "#FF7FA3",
        outline = true,
        cardHeight = 440,
        minCardWidth = 240,
        gap = 16,
        padding = 22,
        radius = 28,
        activeLift = 10,
        speed = 1,
        titleFont,
        bodyFont,
        eyebrowFont,
        style,
    } = props

    const list = items && items.length > 0 ? items : DEFAULT_ITEMS
    // Static renders (thumbnails, exports) and reduced-motion users get a still frame.
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const reduce = !!reducedMotion || isStatic
    const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const [active, setActive] = useState<number>(
        defaultActive > 0 && defaultActive <= list.length ? defaultActive - 1 : -1
    )

    const shared: Shared = {
        ink: inkColor,
        textColor,
        cheek: cheekColor,
        nose: noseColor,
        outline,
        cardHeight,
        padding,
        radius,
        activeLift,
        speed,
        reduce,
        hoverEffect,
        tiltAmount,
        spotlight,
        clickEffect,
        burstCount,
        titleFont,
        bodyFont,
        eyebrowFont,
    }

    return (
        <div
            role="list"
            style={{
                ...style,
                display: "grid",
                gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(" + minCardWidth + "px, 100%), 1fr))",
                gap,
                paddingTop: activeLift + 6,
                paddingBottom: 6,
                boxSizing: "border-box",
            }}
        >
            {list.map((item, i) => (
                <Card
                    key={i}
                    item={item}
                    isActive={active === i}
                    onToggle={() => setActive(active === i ? -1 : i)}
                    uid={baseId + "-" + i}
                    s={shared}
                />
            ))}
        </div>
    )
}

/** Hostname for absolute external URLs, empty for internal/relative links. */
function externalHost(link: string): string {
    if (!/^(https?:)?\/\//i.test(link)) return ""
    try {
        const url = new URL(link, "https://example.com")
        return url.hostname.replace(/^www\./, "")
    } catch {
        return ""
    }
}

/** Visually hidden, still announced by screen readers. */
const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
}

function ctaStyle(ink: string): CSSProperties {
    return {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        marginTop: 8,
        fontSize: 13,
        color: ink,
        textDecoration: "none",
    }
}

function pawBadge(ink: string): CSSProperties {
    return {
        width: 28,
        height: 28,
        borderRadius: 28,
        background: ink,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    }
}

SleepyKittyCards.displayName = "Sleepy Kitty Cards"

const patternOptions: Pattern[] = ["plain", "tabby", "tuxedo", "spots"]
const bedOptions: Bed[] = ["pillow", "basket", "box", "laptop"]
const accessoryOptions: Accessory[] = ["none", "beret", "glasses", "headphones", "nightcap", "bow"]

addPropertyControls(SleepyKittyCards, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 6,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "01 / BRANDING" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Brand identity." },
                description: {
                    type: ControlType.String,
                    title: "Sleeping",
                    displayTextArea: true,
                    defaultValue: "Logos and visual systems that let your brand sleep easy.",
                },
                selectedText: {
                    type: ControlType.String,
                    title: "Awake",
                    displayTextArea: true,
                    defaultValue: "Identities with personality, made to be remembered.",
                },
                ctaLabel: { type: ControlType.String, title: "CTA", defaultValue: "Learn more" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
                cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#FFD9E4" },
                catColor: { type: ControlType.Color, title: "Kitty", defaultValue: "#F6A766" },
                pattern: {
                    type: ControlType.Enum,
                    title: "Coat",
                    options: patternOptions,
                    optionTitles: ["Plain", "Tabby", "Tuxedo", "Spots"],
                    defaultValue: "tabby",
                },
                patternColor: {
                    type: ControlType.Color,
                    title: "Coat Color",
                    defaultValue: "#E27D36",
                    hidden: (p: KittyCard) => p.pattern === "plain",
                },
                bed: {
                    type: ControlType.Enum,
                    title: "Bed",
                    options: bedOptions,
                    optionTitles: ["Pillow", "Basket", "Box", "Laptop"],
                    defaultValue: "pillow",
                },
                bedColor: { type: ControlType.Color, title: "Bed Color", defaultValue: "#FFB3C7" },
                accessory: {
                    type: ControlType.Enum,
                    title: "Extra",
                    options: accessoryOptions,
                    optionTitles: ["None", "Beret", "Glasses", "Headphones", "Nightcap", "Bow"],
                    defaultValue: "none",
                },
                accessoryColor: {
                    type: ControlType.Color,
                    title: "Extra Color",
                    defaultValue: "#8C8CF5",
                    hidden: (p: KittyCard) => p.accessory === "none",
                },
                detailColor: { type: ControlType.Color, title: "Stars", defaultValue: "#FFFFFF" },
            },
        },
    },
    defaultActive: {
        type: ControlType.Number,
        title: "Awake Card",
        description: "0 = all asleep",
        defaultValue: 0,
        min: 0,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    hoverEffect: {
        type: ControlType.Enum,
        title: "Hover",
        options: ["tilt", "lift", "none"],
        optionTitles: ["3D Tilt + Peek", "Lift + Peek", "None"],
        defaultValue: "tilt",
    },
    tiltAmount: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 8,
        min: 0,
        max: 20,
        unit: "°",
        hidden: (p: Props) => p.hoverEffect !== "tilt",
    },
    spotlight: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p: Props) => p.hoverEffect === "none",
    },
    clickEffect: {
        type: ControlType.Enum,
        title: "Click",
        options: ["both", "burst", "ripple", "none"],
        optionTitles: ["Burst + Ripple", "Burst", "Ripple", "None"],
        defaultValue: "both",
    },
    burstCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 12,
        min: 3,
        max: 30,
        step: 1,
        hidden: (p: Props) => p.clickEffect === "none" || p.clickEffect === "ripple",
    },
    inkColor: { type: ControlType.Color, title: "Ink", defaultValue: "#2B2340" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#2B2340" },
    cheekColor: { type: ControlType.Color, title: "Cheeks", defaultValue: "#FF8FAB" },
    noseColor: { type: ControlType.Color, title: "Nose", defaultValue: "#FF7FA3" },
    outline: {
        type: ControlType.Boolean,
        title: "Outline",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cardHeight: { type: ControlType.Number, title: "Height", defaultValue: 440, min: 280, max: 800, unit: "px" },
    minCardWidth: { type: ControlType.Number, title: "Min Width", defaultValue: 240, min: 160, max: 600, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 16, min: 0, max: 80, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 22, min: 0, max: 64, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 28, min: 0, max: 80, unit: "px" },
    activeLift: { type: ControlType.Number, title: "Lift", defaultValue: 10, min: 0, max: 40, unit: "px" },
    speed: { type: ControlType.Number, title: "Speed", defaultValue: 1, min: 0.25, max: 3, step: 0.05 },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 30, variant: "Bold", letterSpacing: "-0.03em", lineHeight: "1em" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14, variant: "Medium", letterSpacing: "0em", lineHeight: "1.45em" },
    },
    eyebrowFont: {
        type: ControlType.Font,
        title: "Eyebrow Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 11, variant: "Bold", letterSpacing: "0.08em", lineHeight: "1em" },
    },
})
