import * as React from "react"
import { useState, useId } from "react"
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
    useReducedMotion,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion"

// Very fine grain so the glass reads as frosted, not plastic
const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`

const NAVY = "#1a2745"
const alpha = (c: string, p: number) =>
    `color-mix(in srgb, ${c} ${p}%, transparent)`

/**
 * A thick extruded glass speech-bubble slab.
 *  - real side wall (stacked extrusion that shifts with tilt = parallax)
 *  - perspective tilt that follows the pointer, lifts on hover
 *  - slow idle float
 *  - clear glass face with bevel, reflections, glints, grain
 */
function Slab(props) {
    const {
        from,
        to,
        side,
        radius,
        blur,
        tint,
        depth,
        tilt,
        float,
        phase = 0,
        reduce,
        tag = "div",
        bodyProps = {},
        bodyStyle = {},
        children,
    } = props

    // Canvas / export / thumbnails: no continuous or interactive motion
    const isStatic = useIsStaticRenderer()
    const still = !!reduce || isStatic

    const [hovered, setHovered] = useState(false)

    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const sx = useSpring(mx, { stiffness: 130, damping: 15 })
    const sy = useSpring(my, { stiffness: 130, damping: 15 })

    const baseY = side === "left" ? 8 : -8
    const rotateY = useTransform(sx, (v) => baseY + v * 18)
    const rotateX = useTransform(sy, (v) => 5 - v * 14)
    const bandX = useTransform(sx, (v) => `${v * -90}%`)

    const mid = `color-mix(in srgb, ${from} 35%, ${to})`
    const edge = `color-mix(in srgb, ${to} 72%, ${NAVY})`

    // Side wall: a stack of offset copies drawn only outside the face
    // (box-shadows never paint under the element), so the face stays clear.
    const N = Math.max(0, Math.round(depth / 1.5))
    const wallA = Math.min(90, Math.round(28 + tint * 0.75))
    const wall = useTransform([sx, sy], (latest: any) => {
        const [vx, vy] = latest as number[]
        if (N === 0) return "none"
        const lean = (side === "left" ? 1 : -1) * depth * 0.22
        const parts: string[] = []
        for (let k = 1; k <= N; k++) {
            const f = k / N
            const dx = f * (-vx * depth * 1.3 + lean)
            const dy = f * depth * (1 - vy * 0.9)
            const col = `color-mix(in srgb, ${to} ${Math.round(88 - f * 34)}%, ${NAVY})`
            parts.push(
                `${dx.toFixed(1)}px ${dy.toFixed(1)}px 0 0 ${alpha(col, wallA)}`
            )
        }
        const dxN = -vx * depth * 1.3 + lean
        const dyN = depth * (1 - vy * 0.9)
        parts.push(
            `${dxN.toFixed(1)}px ${(dyN + 1.5).toFixed(1)}px 0 0 rgba(255,255,255,0.6)`
        )
        parts.push(
            `${dxN.toFixed(1)}px ${(dyN + 10).toFixed(1)}px 20px ${alpha(edge, 32)}`
        )
        return parts.join(", ")
    })

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!tilt || still) return
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
    }
    const onLeave = () => {
        mx.set(0)
        my.set(0)
        setHovered(false)
    }

    const Body: any = tag

    const bevelMask: any = {
        WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
    }

    return (
        <div
            onPointerMove={onMove}
            onPointerEnter={() => !still && setHovered(true)}
            onPointerLeave={onLeave}
            style={{ position: "relative", width: "100%", perspective: 900 }}
        >
            {/* tight contact shadow */}
            <motion.div
                aria-hidden="true"
                animate={{
                    opacity: hovered ? 0.55 : 0.9,
                    scaleX: hovered ? 0.92 : 1,
                }}
                transition={{ duration: still ? 0 : 0.3 }}
                style={{
                    position: "absolute",
                    left: "8%",
                    right: "8%",
                    bottom: -(depth + 14),
                    height: 14,
                    borderRadius: "50%",
                    background: "rgba(20,33,61,0.22)",
                    filter: "blur(7px)",
                    pointerEvents: "none",
                }}
            />
            {/* coloured light passing through onto the surface */}
            <motion.div
                aria-hidden="true"
                animate={{
                    opacity: hovered ? 0.8 : 1,
                    scaleX: hovered ? 0.94 : 1,
                    y: hovered ? 6 : 0,
                }}
                transition={{ duration: still ? 0 : 0.3 }}
                style={{
                    position: "absolute",
                    left: "6%",
                    right: "6%",
                    bottom: -(depth + 30),
                    height: 36,
                    borderRadius: "50%",
                    background: alpha(mid, 62),
                    filter: "blur(22px)",
                    pointerEvents: "none",
                }}
            />

            <motion.div
                animate={float && !still ? { y: [0, -5, 0] } : { y: 0 }}
                transition={
                    float && !still
                        ? {
                              duration: 5 + (phase % 3) * 0.8,
                              delay: (phase % 4) * 0.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                          }
                        : { duration: 0 }
                }
                style={{ position: "relative" }}
            >
                <motion.div
                    whileHover={still ? undefined : { scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    style={{
                        position: "relative",
                        rotateX,
                        rotateY,
                        transformOrigin: "50% 60%",
                    }}
                >
                    {/* extruded side wall */}
                    <motion.div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: radius,
                            boxShadow: wall,
                            pointerEvents: "none",
                        }}
                    />

                    {/* slab thickness seen through the glass */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: 2,
                            right: 2,
                            top: 8,
                            bottom: -8,
                            borderRadius: radius,
                            background: `linear-gradient(to bottom, ${alpha(edge, 28)}, ${alpha(edge, 50)})`,
                            pointerEvents: "none",
                        }}
                    />

                    {/* tail, with its own thickness */}
                    <svg
                        aria-hidden="true"
                        width="30"
                        height="26"
                        viewBox="0 0 30 26"
                        style={{
                            position: "absolute",
                            top: "calc(100% - 2px)",
                            [side]: 38,
                            transform:
                                side === "right" ? "scaleX(-1)" : undefined,
                            zIndex: 1,
                            display: "block",
                            pointerEvents: "none",
                            filter: [
                                `drop-shadow(0 3px 0 ${alpha(edge, 70)})`,
                                `drop-shadow(0 6px 0 ${alpha(edge, 55)})`,
                                `drop-shadow(0 ${Math.max(8, depth * 0.7)}px 5px ${alpha(edge, 30)})`,
                            ].join(" "),
                        }}
                    >
                        <defs>
                            <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0"
                                    stopColor="#fff"
                                    stopOpacity="0.5"
                                />
                                <stop
                                    offset="1"
                                    stopColor="#fff"
                                    stopOpacity="0.05"
                                />
                            </linearGradient>
                        </defs>
                        <path
                            d="M5 0 H28 Q12 8 3 25 Q4 10 5 0Z"
                            fill={alpha(mid, tint * 0.9)}
                        />
                        <path
                            d="M5 0 H28 Q12 8 3 25 Q4 10 5 0Z"
                            fill="url(#tg)"
                        />
                        <path
                            d="M28 0 Q12 8 3 25 Q4 10 5 0"
                            fill="none"
                            stroke="rgba(255,255,255,0.85)"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                        />
                    </svg>

                    {/* glass face */}
                    <Body
                        {...bodyProps}
                        style={{
                            all: tag === "button" ? "unset" : undefined,
                            position: "relative",
                            zIndex: 2,
                            boxSizing: "border-box",
                            display: "block",
                            width: "100%",
                            overflow: "hidden",
                            borderRadius: radius,
                            background: [
                                `radial-gradient(90% 150% at 112% 80%, ${alpha(to, Math.min(95, tint + 40))} 0%, ${alpha(to, Math.min(95, tint + 40))} 38%, ${alpha(to, 0)} 50%)`,
                                `linear-gradient(165deg, ${alpha(from, Math.min(95, tint + 15))}, ${alpha(from, tint)})`,
                            ].join(", "),
                            boxShadow: [
                                "inset 2px 3px 4px rgba(255,255,255,0.75)",
                                `inset -2px -3px 6px ${alpha(edge, 45)}`,
                                `inset 0 -14px 22px -10px ${alpha(mid, 75)}`,
                                "inset 3px 0 6px -2px rgba(255,90,140,0.22)",
                                "inset -3px 0 6px -2px rgba(70,190,255,0.25)",
                                "inset 0 0 36px rgba(255,255,255,0.22)",
                            ].join(", "),
                            backdropFilter: `blur(${blur}px) saturate(1.8) brightness(1.06)`,
                            WebkitBackdropFilter: `blur(${blur}px) saturate(1.8) brightness(1.06)`,
                            ...bodyStyle,
                        }}
                    >
                        {/* bevel */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: radius,
                                padding: 2,
                                pointerEvents: "none",
                                background: `linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.15) 28%, ${alpha(mid, 30)} 55%, ${alpha(edge, 55)} 80%, rgba(255,255,255,0.7) 100%)`,
                                ...bevelMask,
                            }}
                        />
                        {/* inner bevel ring */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 7,
                                borderRadius: Math.max(0, radius - 7),
                                padding: 1.5,
                                pointerEvents: "none",
                                filter: "blur(0.4px)",
                                background: `linear-gradient(160deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.1) 35%, ${alpha(edge, 30)} 70%, rgba(255,255,255,0.5) 100%)`,
                                ...bevelMask,
                            }}
                        />
                        {/* soft window light */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background:
                                    "radial-gradient(120% 90% at 10% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0) 62%)",
                            }}
                        />
                        {/* hard-edged window reflection that slides on tilt */}
                        <motion.div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: "4%",
                                width: "46%",
                                x: bandX,
                                filter: "blur(5px)",
                                pointerEvents: "none",
                                opacity: 0.65,
                                background:
                                    "linear-gradient(112deg, rgba(255,255,255,0) 12%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0) 50%)",
                            }}
                        />
                        {/* specular streak, glint, bottom caustic */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 5,
                                left: radius * 0.65,
                                right: radius * 0.9,
                                height: 8,
                                borderRadius: 8,
                                background:
                                    "linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0))",
                                filter: "blur(1px)",
                                pointerEvents: "none",
                            }}
                        />
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 9,
                                left: radius * 0.35,
                                width: 16,
                                height: 8,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.95)",
                                transform: "rotate(-28deg)",
                                filter: "blur(1.5px)",
                                pointerEvents: "none",
                            }}
                        />
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                bottom: 4,
                                left: radius * 0.7,
                                right: radius * 0.7,
                                height: 6,
                                borderRadius: 6,
                                background:
                                    "linear-gradient(to top, rgba(255,255,255,0.55), rgba(255,255,255,0))",
                                filter: "blur(2px)",
                                pointerEvents: "none",
                            }}
                        />
                        {/* frosted grain */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                backgroundImage: GRAIN,
                                opacity: 0.2,
                                mixBlendMode: "soft-light",
                            }}
                        />

                        <div
                            style={{
                                position: "relative",
                                zIndex: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 16,
                            }}
                        >
                            {children}
                        </div>
                    </Body>
                </motion.div>
            </motion.div>
        </div>
    )
}

/**
 * 3D Glass Bubble FAQ
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function FAQGlass3D(props) {
    const {
        items,
        colors,
        answerFrom,
        answerTo,
        allowMultiple,
        defaultOpen,
        textColor,
        answerTextColor,
        radius,
        gap,
        bubbleWidth,
        blur,
        tint,
        depth,
        glow,
        surface,
        tilt,
        float,
        speed,
        questionFont,
        answerFont,
    } = props

    const baseId = useId().replace(/:/g, "")
    const isStatic = useIsStaticRenderer()
    const reduce = !!useReducedMotion() || isStatic
    const dur = reduce ? 0 : speed
    const palette =
        colors && colors.length ? colors : [{ from: "#46CDF2", to: "#8EDFF7" }]
    const room = depth + 40 // space for wall, tail and shadows

    const [open, setOpen] = useState<number[]>(
        defaultOpen >= 0 && defaultOpen < items.length ? [defaultOpen] : []
    )

    const toggle = (i: number) =>
        setOpen((prev) => {
            const isOpen = prev.includes(i)
            if (allowMultiple)
                return isOpen ? prev.filter((n) => n !== i) : [...prev, i]
            return isOpen ? [] : [i]
        })

    const orbs = [
        { left: "-6%", top: "4%", size: 200, c: palette[0].to },
        {
            right: "-6%",
            top: "38%",
            size: 240,
            c: palette[1 % palette.length].to,
        },
        {
            left: "8%",
            bottom: "4%",
            size: 180,
            c: palette[2 % palette.length].to,
        },
    ]

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: gap + depth * 0.5,
                width: "100%",
                boxSizing: "border-box",
                padding: 28,
                paddingBottom: room + 28,
                background: `linear-gradient(165deg, color-mix(in srgb, ${surface} 55%, white), ${surface})`,
            }}
        >
            <style>{`.fq-${baseId}:focus-visible{outline:2px solid ${textColor};outline-offset:5px}`}</style>

            {glow &&
                orbs.map((o, k) => (
                    <div
                        key={k}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            width: o.size,
                            height: o.size,
                            borderRadius: "50%",
                            left: (o as any).left,
                            right: (o as any).right,
                            top: (o as any).top,
                            bottom: (o as any).bottom,
                            background: alpha(o.c, 75),
                            filter: "blur(46px)",
                            pointerEvents: "none",
                        }}
                    />
                ))}

            {items.map((item, i) => {
                const isOpen = open.includes(i)
                const c = palette[i % palette.length]
                const fromRight = i % 2 === 1
                const panelId = `${baseId}-p${i}`
                const buttonId = `${baseId}-b${i}`

                return (
                    <div
                        key={i}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: fromRight ? "flex-end" : "flex-start",
                            gap: 22 + depth * 0.5,
                        }}
                    >
                        {/* Question */}
                        <div style={{ width: `${bubbleWidth}%` }}>
                            <Slab
                                from={c.from}
                                to={c.to}
                                side={fromRight ? "right" : "left"}
                                radius={radius}
                                blur={blur}
                                tint={tint}
                                depth={depth}
                                tilt={tilt}
                                float={float}
                                phase={i}
                                reduce={reduce}
                                tag="button"
                                bodyProps={{
                                    id: buttonId,
                                    className: `fq-${baseId}`,
                                    "aria-expanded": isOpen,
                                    "aria-controls": panelId,
                                    onClick: () => toggle(i),
                                }}
                                bodyStyle={{
                                    padding: "22px 22px 22px 32px",
                                    cursor: "pointer",
                                    color: textColor,
                                    ...questionFont,
                                }}
                            >
                                <span style={{ flex: 1 }}>{item.question}</span>
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: "50%",
                                        flexShrink: 0,
                                        display: "grid",
                                        placeItems: "center",
                                        background:
                                            "linear-gradient(160deg, rgba(255,255,255,0.85), rgba(255,255,255,0.25))",
                                        boxShadow:
                                            "inset 0 1px 1px #fff, inset 0 -3px 5px rgba(255,255,255,0.4), 0 3px 6px rgba(20,33,61,0.18)",
                                    }}
                                >
                                    <motion.svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 14 14"
                                        fill="none"
                                        stroke={textColor}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        animate={{ rotate: isOpen ? 45 : 0 }}
                                        transition={{ duration: dur }}
                                    >
                                        <path d="M7 1v12M1 7h12" />
                                    </motion.svg>
                                </span>
                            </Slab>
                        </div>

                        {/* Answer */}
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    id={panelId}
                                    role="region"
                                    aria-labelledby={buttonId}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{
                                        duration: dur,
                                        ease: [0.4, 0, 0.2, 1],
                                    }}
                                    style={{
                                        overflow: "hidden",
                                        boxSizing: "content-box",
                                        padding: room,
                                        margin: -room,
                                        width: `${bubbleWidth}%`,
                                        pointerEvents: "none",
                                    }}
                                >
                                    <div style={{ pointerEvents: "auto" }}>
                                        <Slab
                                            from={answerFrom}
                                            to={answerTo}
                                            side={fromRight ? "left" : "right"}
                                            radius={radius}
                                            blur={blur}
                                            tint={Math.min(100, tint + 10)}
                                            depth={depth}
                                            tilt={tilt}
                                            float={float}
                                            phase={i + 2}
                                            reduce={reduce}
                                            bodyStyle={{
                                                padding: "22px 32px",
                                                color: answerTextColor,
                                                whiteSpace: "pre-wrap",
                                                ...answerFont,
                                            }}
                                        >
                                            <span style={{ flex: 1 }}>
                                                {item.answer}
                                            </span>
                                        </Slab>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )
            })}
        </div>
    )
}

FAQGlass3D.defaultProps = {
    items: [
        {
            question: "How do I get started?",
            answer: "Create a free account, pick a plan later, and invite your team. Your first workspace is ready in under a minute.",
        },
        {
            question: "Is my data private?",
            answer: "Yes. Messages are encrypted in transit and at rest, and only the people in a conversation can read them.",
        },
        {
            question: "Can I use it on my phone?",
            answer: "Yes. The iOS and Android apps stay in sync with the web version, so you can switch devices at any time.",
        },
        {
            question: "Can I change or cancel my plan?",
            answer: "You can upgrade, downgrade or cancel from Settings whenever you like. Changes apply at the next billing date.",
        },
        {
            question: "How do I reach support?",
            answer: "Send us a message from the help button in the app. We usually reply within a few hours on weekdays.",
        },
    ],
    colors: [
        { from: "#A9DDF3", to: "#2E9BE3" },
        { from: "#BFB3F3", to: "#6B3FD1" },
        { from: "#DDEFC2", to: "#7DC83C" },
        { from: "#A9DDF3", to: "#2E9BE3" },
    ],
    surface: "#D6E6F2",
    answerFrom: "#F4FAFE",
    answerTo: "#A9D5EE",
    allowMultiple: false,
    defaultOpen: 0,
    textColor: "#14213D",
    answerTextColor: "#34405C",
    radius: 48,
    gap: 14,
    bubbleWidth: 88,
    blur: 16,
    tint: 46,
    depth: 16,
    glow: true,
    tilt: true,
    float: true,
    speed: 0.35,
    questionFont: {
        fontSize: 18,
        fontWeight: 600,
        lineHeight: 1.35,
        fontFamily: "Inter, sans-serif",
    },
    answerFont: {
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.6,
        fontFamily: "Inter, sans-serif",
    },
}

addPropertyControls(FAQGlass3D, {
    items: {
        type: ControlType.Array,
        title: "Questions",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "Your question",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    displayTextArea: true,
                    defaultValue: "Your answer",
                },
            },
        },
    },
    colors: {
        type: ControlType.Array,
        title: "Bubble Colors",
        control: {
            type: ControlType.Object,
            controls: {
                from: {
                    type: ControlType.Color,
                    title: "Light",
                    defaultValue: "#A9DDF3",
                },
                to: {
                    type: ControlType.Color,
                    title: "Deep",
                    defaultValue: "#2E9BE3",
                },
            },
        },
    },
    surface: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#D6E6F2",
    },
    answerFrom: {
        type: ControlType.Color,
        title: "Answer Light",
        defaultValue: "#F4FAFE",
    },
    answerTo: {
        type: ControlType.Color,
        title: "Answer Deep",
        defaultValue: "#A9D5EE",
    },
    textColor: {
        type: ControlType.Color,
        title: "Question",
        defaultValue: "#14213D",
    },
    answerTextColor: {
        type: ControlType.Color,
        title: "Answer",
        defaultValue: "#34405C",
    },
    depth: {
        type: ControlType.Number,
        title: "3D Depth",
        min: 0,
        max: 30,
        unit: "px",
        defaultValue: 16,
        description: "Thickness of the glass slab",
    },
    tint: {
        type: ControlType.Number,
        title: "Glass Tint",
        min: 5,
        max: 90,
        unit: "%",
        defaultValue: 46,
        description: "Lower = clearer glass",
    },
    blur: {
        type: ControlType.Number,
        title: "Frost Blur",
        min: 0,
        max: 40,
        defaultValue: 16,
    },
    tilt: { type: ControlType.Boolean, title: "3D Tilt", defaultValue: true },
    float: {
        type: ControlType.Boolean,
        title: "Idle Float",
        defaultValue: true,
    },
    glow: {
        type: ControlType.Boolean,
        title: "Backdrop Glow",
        defaultValue: true,
    },
    allowMultiple: {
        type: ControlType.Boolean,
        title: "Multi Open",
        defaultValue: false,
    },
    defaultOpen: {
        type: ControlType.Number,
        title: "Default Open",
        min: -1,
        step: 1,
        displayStepper: true,
        defaultValue: 0,
        description: "-1 keeps all closed",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 8,
        max: 60,
        defaultValue: 48,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: -40,
        max: 80,
        defaultValue: 14,
    },
    bubbleWidth: {
        type: ControlType.Number,
        title: "Width %",
        min: 50,
        max: 100,
        unit: "%",
        defaultValue: 88,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
    },
    questionFont: {
        type: ControlType.Font,
        title: "Q Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 18, fontWeight: 600, lineHeight: 1.35 },
    },
    answerFont: {
        type: ControlType.Font,
        title: "A Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
    },
})
