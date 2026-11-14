// User instructions: Create a highly unique premium component called Neural Orbit Dashboard featuring a glowing central sphere, orbiting glassmorphism cards, animated connection lines, dynamic gradients, magnetic hover, mouse tracking glow, floating particles, smooth orbit animations, expandable information cards, premium typography, exceptional spacing, fully responsive, Framer Motion animations, high-performance rendering.

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

import {
    motion,
    useInView,
    useMotionValue,
    useSpring,
    useTransform,
    useReducedMotion,
} from "framer-motion"

type CardItem = {
    title: string
    description: string
    metric: string
    tag: string
}

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type Props = {
    title: string
    subtitle: string

    cards: CardItem[]

    background: string
    glowA: string
    glowB: string
    glowC: string
    textPrimary: string
    textSecondary: string

    sphereGradientA: string
    sphereGradientB: string

    meshOpacity: number
    glassOpacity: number
    borderOpacity: number

    radius: number
    sphereSize: number
    orbitTilt: number
    orbitSpeed: number

    enableParticles: boolean
    particleCount: number

    enableLines: boolean
    lineOpacity: number

    expandOnClick: boolean

    cornerRadius: number
    shadowStrength: number

    headingFont: any
    subtitleFont: any
    cardTitleFont: any
    cardBodyFont: any
    metricFont: any

    heroIcon: ResponsiveImage

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function mix(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function usePrefersFinePointer() {
    const [fine, setFine] = React.useState(true)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const mql = window.matchMedia("(pointer:fine)")
        const update = () => {
            React.startTransition(() => setFine(!!mql.matches))
        }
        update()
        if (mql.addEventListener) mql.addEventListener("change", update)
        else mql.addListener(update)
        return () => {
            if (mql.removeEventListener) mql.removeEventListener("change", update)
            else mql.removeListener(update)
        }
    }, [])

    return fine
}

function cardAngleForIndex(i: number, count: number) {
    const base = -Math.PI / 2
    return base + (i * (Math.PI * 2)) / Math.max(1, count)
}

function Card({
    item,
    index,
    count,
    radius,
    tilt,
    isStatic,
    canMagnet,
    expanded,
    onToggle,
    accent,
    textPrimary,
    textSecondary,
    glassOpacity,
    borderOpacity,
    cornerRadius,
    shadowStrength,
    cardTitleFont,
    cardBodyFont,
    metricFont,
}: {
    item: CardItem
    index: number
    count: number
    radius: number
    tilt: number
    isStatic: boolean
    canMagnet: boolean
    expanded: boolean
    onToggle: () => void
    accent: string
    textPrimary: string
    textSecondary: string
    glassOpacity: number
    borderOpacity: number
    cornerRadius: number
    shadowStrength: number
    cardTitleFont: any
    cardBodyFont: any
    metricFont: any
}) {
    const ref = React.useRef<HTMLButtonElement>(null)

    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const mxSpring = useSpring(mx, { stiffness: 260, damping: 28, mass: 0.7 })
    const mySpring = useSpring(my, { stiffness: 260, damping: 28, mass: 0.7 })

    const rX = useTransform(mySpring, [-24, 24], [8, -8])
    const rY = useTransform(mxSpring, [-24, 24], [-10, 10])

    const handlePointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (!canMagnet) return
            if (!ref.current) return
            const rect = ref.current.getBoundingClientRect()
            const px = e.clientX - rect.left
            const py = e.clientY - rect.top
            const dx = (px - rect.width / 2) / rect.width
            const dy = (py - rect.height / 2) / rect.height
            mx.set(clamp(dx * 36, -24, 24))
            my.set(clamp(dy * 36, -24, 24))
        },
        [canMagnet, mx, my]
    )

    const handlePointerLeave = React.useCallback(() => {
        mx.set(0)
        my.set(0)
    }, [mx, my])

    const angle = cardAngleForIndex(index, count)
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius * 0.62

    const z = Math.sin(angle) * 26

    const baseTransform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${tilt}deg)`

    const shadow = `0 ${12 + shadowStrength * 8}px ${40 + shadowStrength * 60}px rgba(0,0,0,${mix(
        0.28,
        0.42,
        clamp(shadowStrength, 0, 1)
    )})`

    return (
        <motion.button
            ref={ref}
            type="button"
            aria-expanded={expanded}
            onClick={onToggle}
            onPointerMove={isStatic ? undefined : handlePointerMove}
            onPointerLeave={isStatic ? undefined : handlePointerLeave}
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: baseTransform,
                transformOrigin: "center",
                translateX: "-50%",
                translateY: "-50%",
                width: expanded ? 360 : 260,
                maxWidth: "min(360px, 78vw)",
                height: expanded ? 220 : 150,
                padding: expanded ? 18 : 16,
                borderRadius: cornerRadius,
                border: `1px solid rgba(255,255,255,${borderOpacity})`,
                background: `linear-gradient(180deg, rgba(255,255,255,${glassOpacity}) 0%, rgba(255,255,255,${glassOpacity * 0.65}) 100%)`,
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                boxShadow: shadow,
                display: "flex",
                flexDirection: "column",
                gap: expanded ? 10 : 8,
                textAlign: "left",
                cursor: "pointer",
                userSelect: "none",
                outline: "none",
                color: textPrimary,
                overflow: "hidden",
                perspective: 800,
                willChange: "transform",
            }}
            initial={false}
            animate={{
                width: expanded ? 360 : 260,
                height: expanded ? 220 : 150,
            }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 28,
                mass: 0.8,
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    inset: -2,
                    borderRadius: cornerRadius + 2,
                    background: `radial-gradient(120px 120px at 20% 10%, ${accent}55 0%, transparent 60%), radial-gradient(140px 140px at 80% 0%, ${accent}33 0%, transparent 62%), radial-gradient(180px 180px at 40% 110%, rgba(255,255,255,0.10) 0%, transparent 60%)`,
                    pointerEvents: "none",
                    filter: "saturate(1.2)",
                }}
                animate={isStatic ? undefined : { opacity: [0.65, 1, 0.7] }}
                transition={
                    isStatic
                        ? undefined
                        : { duration: 5.5, ease: "easeInOut", repeat: Infinity }
                }
            />

            <motion.div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 10,
                    zIndex: 1,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <div
                        style={{
                            ...cardTitleFont,
                            color: textPrimary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {item.title}
                    </div>
                    <div style={{
                        ...cardBodyFont,
                        color: textSecondary,
                        opacity: 0.92,
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                    }}>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 8px",
                                borderRadius: 999,
                                border: `1px solid rgba(255,255,255,${borderOpacity})`,
                                background: "rgba(0,0,0,0.18)",
                                color: textSecondary,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {item.tag}
                        </span>
                    </div>
                </div>
                <div
                    style={{
                        ...metricFont,
                        color: textPrimary,
                        letterSpacing: "-0.02em",
                        textShadow: "0 6px 24px rgba(0,0,0,0.35)",
                        flexShrink: 0,
                    }}
                >
                    {item.metric}
                </div>
            </motion.div>

            <motion.div
                style={{
                    position: "relative",
                    zIndex: 1,
                    ...cardBodyFont,
                    color: textSecondary,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: expanded ? 5 : 2,
                }}
                initial={false}
                animate={{ opacity: expanded ? 1 : 0.92 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
            >
                {item.description}
            </motion.div>

            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: cornerRadius,
                    pointerEvents: "none",
                    zIndex: 2,
                    mixBlendMode: "screen",
                    opacity: 0.8,
                }}
                initial={false}
                animate={
                    isStatic
                        ? undefined
                        : {
                              x: [-6, 6, -6],
                              y: [4, -4, 4],
                              opacity: [0.55, 0.8, 0.6],
                          }
                }
                transition={
                    isStatic
                        ? undefined
                        : { duration: 6 + index * 0.5, ease: "easeInOut", repeat: Infinity }
                }
            >
                <div
                    style={{
                        position: "absolute",
                        inset: -40,
                        background: `radial-gradient(220px 160px at 20% 20%, rgba(255,255,255,0.16) 0%, transparent 60%), radial-gradient(260px 200px at 80% 40%, ${accent}40 0%, transparent 68%)`,
                        filter: "blur(6px)",
                    }}
                />
            </motion.div>

            <motion.div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: cornerRadius,
                    pointerEvents: "none",
                    zIndex: 3,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,${borderOpacity}), inset 0 0 0 1px rgba(255,255,255,${borderOpacity * 0.6})`,
                }}
            />

            <motion.div
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: cornerRadius,
                    pointerEvents: "none",
                    zIndex: 4,
                    x: mxSpring,
                    y: mySpring,
                    rotateX: rX,
                    rotateY: rY,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
            />
        </motion.button>
    )
}

function Particles({
    count,
    isStatic,
    glowA,
    glowB,
}: {
    count: number
    isStatic: boolean
    glowA: string
    glowB: string
}) {
    const seeds = React.useMemo(() => {
        const c = clamp(Math.round(count), 0, 80)
        const arr = new Array(c).fill(0).map((_, i) => {
            const r1 = (Math.sin(i * 999) + 1) / 2
            const r2 = (Math.sin(i * 1337 + 2.2) + 1) / 2
            const r3 = (Math.sin(i * 777 + 0.7) + 1) / 2
            const size = mix(1.2, 3.6, r1)
            const x = mix(6, 94, r2)
            const y = mix(10, 90, r3)
            const duration = mix(6, 13, r2)
            const delay = mix(0, 2.8, r3)
            const blur = mix(0, 2.5, r1)
            const alpha = mix(0.25, 0.75, r2)
            return { i, size, x, y, duration, delay, blur, alpha }
        })
        return arr
    }, [count])

    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            {seeds.map((p) => {
                const c = p.i % 2 === 0 ? glowA : glowB
                return (
                    <motion.div
                        key={p.i}
                        style={{
                            position: "absolute",
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                            borderRadius: 999,
                            background: c,
                            filter: `blur(${p.blur}px)`,
                            opacity: p.alpha,
                            boxShadow: `0 0 ${mix(10, 22, p.alpha)}px ${c}66`,
                            willChange: "transform, opacity",
                        }}
                        animate={
                            isStatic
                                ? undefined
                                : {
                                      x: [0, mix(-30, 30, (p.i % 7) / 6), 0],
                                      y: [0, mix(-22, 22, (p.i % 5) / 4), 0],
                                      opacity: [p.alpha, p.alpha * 0.55, p.alpha],
                                  }
                        }
                        transition={
                            isStatic
                                ? undefined
                                : {
                                      duration: p.duration,
                                      delay: p.delay,
                                      ease: "easeInOut",
                                      repeat: Infinity,
                                  }
                        }
                    />
                )
            })}
        </div>
    )
}

/**
 * Neural Orbit Dashboard
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NeuralOrbitDashboard(props: Props) {
    const {
        title,
        subtitle,
        cards,
        background,
        glowA,
        glowB,
        glowC,
        textPrimary,
        textSecondary,
        sphereGradientA,
        sphereGradientB,
        meshOpacity,
        glassOpacity,
        borderOpacity,
        radius,
        sphereSize,
        orbitTilt,
        orbitSpeed,
        enableParticles,
        particleCount,
        enableLines,
        lineOpacity,
        expandOnClick,
        cornerRadius,
        shadowStrength,
        headingFont,
        subtitleFont,
        cardTitleFont,
        cardBodyFont,
        metricFont,
        heroIcon = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gradient",
        },
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const finePointer = usePrefersFinePointer()

    const containerRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { amount: 0.25, margin: "-10% 0px -10% 0px" })

    const pointerX = useMotionValue(0.5)
    const pointerY = useMotionValue(0.4)

    const px = useSpring(pointerX, { stiffness: 220, damping: 26, mass: 0.6 })
    const py = useSpring(pointerY, { stiffness: 220, damping: 26, mass: 0.6 })

    const glowPos = useTransform([px, py], ([x, y]: [number, number]) => {
        return `${Math.round(x * 100)}% ${Math.round(y * 100)}%`
    })

    const safeCards = React.useMemo(() => {
        const base = Array.isArray(cards) ? cards : []
        const cleaned = base
            .filter(Boolean)
            .slice(0, 6)
            .map((c, i) => ({
                title: c.title ?? `Node ${i + 1}`,
                description:
                    c.description ??
                    "Neural stream synchronized. Latency reduced, throughput stabilized, and safety checks passing.",
                metric: c.metric ?? `${Math.round(86 + i * 3)}%`,
                tag: c.tag ?? "Live",
            }))
        return cleaned
    }, [cards])

    const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null)

    const handleToggle = React.useCallback(
        (idx: number) => {
            if (!expandOnClick) return
            React.startTransition(() => {
                setExpandedIndex((cur) => (cur === idx ? null : idx))
            })
        },
        [expandOnClick]
    )

    const handlePointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (isStatic || !finePointer) return
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
            const y = clamp((e.clientY - rect.top) / rect.height, 0, 1)
            pointerX.set(x)
            pointerY.set(y)
        },
        [finePointer, isStatic, pointerX, pointerY]
    )

    const handlePointerLeave = React.useCallback(() => {
        if (isStatic || !finePointer) return
        pointerX.set(0.5)
        pointerY.set(0.4)
    }, [finePointer, isStatic, pointerX, pointerY])

    const activeOrbit = !isStatic && inView && !reduced

    const orbitDuration = React.useMemo(() => {
        const s = clamp(orbitSpeed, 0.2, 3)
        return mix(28, 10, (s - 0.2) / (3 - 0.2))
    }, [orbitSpeed])

    const accentFor = React.useCallback(
        (i: number) => {
            const arr = [glowA, glowB, glowC]
            return arr[i % arr.length]
        },
        [glowA, glowB, glowC]
    )

    const isFixedWidth = !!(style && style.width === "100%")
    const isFixedHeight = !!(style && style.height === "100%")

    return (
        <section
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: isFixedHeight ? undefined : 520,
                borderRadius: cornerRadius + 8,
                overflow: "hidden",
                background,
                color: textPrimary,
                display: "flex",
                flexDirection: "column",
                padding: "28px",
                gap: "20px",
                boxShadow: `0 ${20 + shadowStrength * 20}px ${80 + shadowStrength * 100}px rgba(0,0,0,${mix(
                    0.35,
                    0.55,
                    clamp(shadowStrength, 0, 1)
                )})`,
                transformStyle: "preserve-3d",
            }}
            aria-label="Neural Orbit Dashboard"
        >
            <motion.div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(900px 420px at ${glowPos}, ${glowA}40 0%, transparent 55%), radial-gradient(820px 520px at 70% 30%, ${glowB}33 0%, transparent 60%), radial-gradient(700px 480px at 30% 85%, ${glowC}2E 0%, transparent 62%)`,
                    opacity: 0.95,
                    willChange: "background-position",
                    pointerEvents: "none",
                }}
            />

            <motion.div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: -120,
                    background: `conic-gradient(from 210deg, ${glowA}00, ${glowA}55, ${glowB}44, ${glowC}44, ${glowA}00)`,
                    filter: "blur(60px)",
                    opacity: meshOpacity,
                    transform: "translateZ(-40px)",
                    pointerEvents: "none",
                }}
                animate={
                    activeOrbit
                        ? {
                              rotate: [0, 360],
                          }
                        : undefined
                }
                transition={
                    activeOrbit
                        ? {
                              duration: 26,
                              ease: "linear",
                              repeat: Infinity,
                          }
                        : undefined
                }
            />

            {enableParticles && (
                <Particles count={particleCount} isStatic={!activeOrbit} glowA={glowA} glowB={glowB} />
            )}

            <header
                style={{
                    position: "relative",
                    zIndex: 5,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        minWidth: isFixedWidth ? 0 : "max-content",
                        maxWidth: "min(680px, 70vw)",
                    }}
                >
                    <div
                        style={{
                            ...headingFont,
                            color: textPrimary,
                            letterSpacing: "-0.04em",
                            textShadow: "0 18px 70px rgba(0,0,0,0.55)",
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            ...subtitleFont,
                            color: textSecondary,
                            maxWidth: 720,
                            opacity: 0.95,
                        }}
                    >
                        {subtitle}
                    </div>
                </div>

                <div
                    style={{
                        width: 54,
                        height: 54,
                        borderRadius: 18,
                        border: `1px solid rgba(255,255,255,${borderOpacity})`,
                        background: `linear-gradient(180deg, rgba(255,255,255,${glassOpacity}) 0%, rgba(255,255,255,${glassOpacity * 0.6}) 100%)`,
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
                        overflow: "hidden",
                        flexShrink: 0,
                        position: "relative",
                    }}
                    aria-hidden
                >
                    <img
                        {...heroIcon}
                        alt={heroIcon.alt ?? ""}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `radial-gradient(60px 60px at 20% 10%, ${glowA}60 0%, transparent 60%), radial-gradient(70px 70px at 80% 50%, ${glowB}4D 0%, transparent 62%)`,
                            mixBlendMode: "screen",
                        }}
                    />
                </div>
            </header>

            <div
                style={{
                    position: "relative",
                    zIndex: 5,
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    alignItems: "center",
                }}
            >
                <motion.div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        minHeight: 360,
                        transformStyle: "preserve-3d",
                        perspective: 1100,
                    }}
                >
                    {enableLines && (
                        <motion.svg
                            aria-hidden
                            width="100%"
                            height="100%"
                            viewBox="0 0 1000 600"
                            preserveAspectRatio="none"
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 1,
                                pointerEvents: "none",
                                opacity: lineOpacity,
                                filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.55))",
                            }}
                        >
                            <defs>
                                <linearGradient id="nod-line" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0" stopColor={glowA} stopOpacity="0.9" />
                                    <stop offset="0.5" stopColor={glowB} stopOpacity="0.75" />
                                    <stop offset="1" stopColor={glowC} stopOpacity="0.9" />
                                </linearGradient>
                            </defs>
                            {safeCards.map((_, i) => {
                                const angle = cardAngleForIndex(i, safeCards.length)
                                const cx = 500
                                const cy = 300
                                const x = cx + Math.cos(angle) * 310
                                const y = cy + Math.sin(angle) * 175
                                const d = `M ${cx} ${cy} Q ${mix(cx, x, 0.55)} ${mix(cy, y, 0.35)} ${x} ${y}`
                                return (
                                    <motion.path
                                        key={i}
                                        d={d}
                                        fill="none"
                                        stroke="url(#nod-line)"
                                        strokeWidth={1.5}
                                        strokeLinecap="round"
                                        initial={false}
                                        animate={
                                            activeOrbit
                                                ? {
                                                      opacity: [0.25, 0.85, 0.35],
                                                  }
                                                : { opacity: 0.55 }
                                        }
                                        transition={
                                            activeOrbit
                                                ? {
                                                      duration: 2.8 + i * 0.25,
                                                      ease: "easeInOut",
                                                      repeat: Infinity,
                                                      delay: i * 0.18,
                                                  }
                                                : { duration: 0.2 }
                                        }
                                    />
                                )
                            })}
                        </motion.svg>
                    )}

                    <motion.div
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            translateX: "-50%",
                            translateY: "-50%",
                            width: sphereSize,
                            height: sphereSize,
                            borderRadius: 999,
                            zIndex: 3,
                            transformStyle: "preserve-3d",
                            background: `radial-gradient(140px 140px at ${glowPos}, rgba(255,255,255,0.24) 0%, transparent 55%), radial-gradient(110% 110% at 30% 20%, ${sphereGradientA} 0%, ${sphereGradientB} 45%, rgba(0,0,0,0.20) 80%)`,
                            boxShadow: `0 30px 120px rgba(0,0,0,0.65), 0 0 60px ${glowB}55, 0 0 120px ${glowA}33`,
                            border: `1px solid rgba(255,255,255,${borderOpacity})`,
                            filter: "saturate(1.2)",
                            willChange: "transform",
                        }}
                        animate={
                            activeOrbit
                                ? {
                                      y: [0, -10, 0],
                                      scale: [1, 1.02, 1],
                                  }
                                : undefined
                        }
                        transition={
                            activeOrbit
                                ? { duration: 4.8, ease: "easeInOut", repeat: Infinity }
                                : undefined
                        }
                    >
                        <motion.div
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: -40,
                                borderRadius: 999,
                                background: `radial-gradient(200px 120px at 20% 30%, ${glowA}55 0%, transparent 60%), radial-gradient(240px 180px at 80% 70%, ${glowC}44 0%, transparent 65%)`,
                                filter: "blur(18px)",
                                opacity: 0.85,
                                mixBlendMode: "screen",
                            }}
                            animate={
                                activeOrbit
                                    ? { rotate: [0, 360] }
                                    : undefined
                            }
                            transition={
                                activeOrbit
                                    ? { duration: 18, ease: "linear", repeat: Infinity }
                                    : undefined
                            }
                        />
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 999,
                                background: `radial-gradient(60% 60% at 35% 25%, rgba(255,255,255,0.22) 0%, transparent 70%)`,
                            }}
                        />
                    </motion.div>

                    <motion.div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: 1,
                            height: 1,
                            transformStyle: "preserve-3d",
                            zIndex: 4,
                            willChange: "transform",
                        }}
                        animate={
                            activeOrbit
                                ? { rotateZ: [0, 360] }
                                : undefined
                        }
                        transition={
                            activeOrbit
                                ? { duration: orbitDuration, ease: "linear", repeat: Infinity }
                                : undefined
                        }
                    >
                        {safeCards.map((item, i) => (
                            <Card
                                key={i}
                                item={item}
                                index={i}
                                count={safeCards.length}
                                radius={radius}
                                tilt={orbitTilt}
                                isStatic={!activeOrbit}
                                canMagnet={finePointer}
                                expanded={expandedIndex === i}
                                onToggle={() => handleToggle(i)}
                                accent={accentFor(i)}
                                textPrimary={textPrimary}
                                textSecondary={textSecondary}
                                glassOpacity={glassOpacity}
                                borderOpacity={borderOpacity}
                                cornerRadius={cornerRadius}
                                shadowStrength={shadowStrength}
                                cardTitleFont={cardTitleFont}
                                cardBodyFont={cardBodyFont}
                                metricFont={metricFont}
                            />
                        ))}
                    </motion.div>

                    <motion.div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            pointerEvents: "none",
                            background: `radial-gradient(600px 240px at ${glowPos}, rgba(255,255,255,0.10) 0%, transparent 55%)`,
                            mixBlendMode: "overlay",
                        }}
                    />
                </motion.div>
            </div>

            <footer
                style={{
                    position: "relative",
                    zIndex: 5,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 4,
                }}
            >
                <div
                    style={{
                        ...cardBodyFont,
                        color: textSecondary,
                        opacity: 0.9,
                        minWidth: isFixedWidth ? 0 : "max-content",
                    }}
                >
                    {expandOnClick
                        ? "Tip: Click a card to expand. Move your mouse to bend the glass." 
                        : "Move your mouse to shift the lightfield."}
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                    }}
                    aria-hidden
                >
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: glowA,
                            boxShadow: `0 0 18px ${glowA}88`,
                        }}
                    />
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: glowB,
                            boxShadow: `0 0 18px ${glowB}88`,
                        }}
                    />
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: glowC,
                            boxShadow: `0 0 18px ${glowC}88`,
                        }}
                    />
                </div>
            </footer>
        </section>
    )
}

addPropertyControls(NeuralOrbitDashboard, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Neural Orbit Dashboard",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue:
            "A premium AI control surface with orbiting glass nodes, dynamic lightfield gradients, and magnetic micro-interactions.",
        displayTextArea: true,
    },

    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Inference" },
                metric: { type: ControlType.String, title: "Metric", defaultValue: "92%" },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "Live" },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue:
                        "Self-optimizing pipeline running at low latency. Confidence remains stable while adaptive routing increases throughput.",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                title: "Inference",
                metric: "92%",
                tag: "Live",
                description:
                    "Self-optimizing pipeline running at low latency. Confidence remains stable while adaptive routing increases throughput.",
            },
            {
                title: "Vector Search",
                metric: "3.1ms",
                tag: "Index",
                description:
                    "Embedding recall tuned with dynamic filters. Hybrid scoring improves relevance with minimal compute overhead.",
            },
            {
                title: "Security",
                metric: "A+",
                tag: "Shield",
                description:
                    "Realtime anomaly checks, policy gating, and memory isolation. Drift detection is active across all streams.",
            },
            {
                title: "Orchestrator",
                metric: "7 pods",
                tag: "Scale",
                description:
                    "Autonomous workload balancing with predictive warmup. Burst traffic absorbed with minimal jitter.",
            },
        ],
    },

    background: { type: ControlType.Color, title: "Background", defaultValue: "#0B0E17" },
    glowA: { type: ControlType.Color, title: "Glow A", defaultValue: "#0099FF" },
    glowB: { type: ControlType.Color, title: "Glow B", defaultValue: "#8855FF" },
    glowC: { type: ControlType.Color, title: "Glow C", defaultValue: "#FF5588" },
    textPrimary: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    textSecondary: { type: ControlType.Color, title: "Subtext", defaultValue: "#CCCCCC" },

    sphereGradientA: { type: ControlType.Color, title: "Sphere A", defaultValue: "#00D2FF" },
    sphereGradientB: { type: ControlType.Color, title: "Sphere B", defaultValue: "#7A5CFF" },

    meshOpacity: {
        type: ControlType.Number,
        title: "Mesh Opacity",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass",
        defaultValue: 0.08,
        min: 0.02,
        max: 0.18,
        step: 0.01,
    },
    borderOpacity: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 0.18,
        min: 0.05,
        max: 0.5,
        step: 0.01,
    },

    radius: {
        type: ControlType.Number,
        title: "Orbit Radius",
        defaultValue: 260,
        min: 150,
        max: 380,
        step: 1,
        unit: "px",
    },
    sphereSize: {
        type: ControlType.Number,
        title: "Sphere Size",
        defaultValue: 190,
        min: 120,
        max: 260,
        step: 1,
        unit: "px",
    },
    orbitTilt: {
        type: ControlType.Number,
        title: "Orbit Tilt",
        defaultValue: 18,
        min: -40,
        max: 40,
        step: 1,
        unit: "deg",
    },
    orbitSpeed: {
        type: ControlType.Number,
        title: "Orbit Speed",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.05,
    },

    enableParticles: {
        type: ControlType.Boolean,
        title: "Particles",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particle Count",
        defaultValue: 26,
        min: 0,
        max: 80,
        step: 1,
        hidden: ({ enableParticles }) => !enableParticles,
    },

    enableLines: {
        type: ControlType.Boolean,
        title: "Lines",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lineOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ enableLines }) => !enableLines,
    },

    expandOnClick: {
        type: ControlType.Boolean,
        title: "Expandable",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 18,
        min: 8,
        max: 32,
        step: 1,
    },
    shadowStrength: {
        type: ControlType.Number,
        title: "Depth",
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.01,
    },

    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1.05em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
    },
    cardTitleFont: {
        type: ControlType.Font,
        title: "Card Title",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    cardBodyFont: {
        type: ControlType.Font,
        title: "Card Body",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.35em",
        },
    },
    metricFont: {
        type: ControlType.Font,
        title: "Metric",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },

    heroIcon: {
        type: ControlType.ResponsiveImage,
        title: "Icon",
    },
})
