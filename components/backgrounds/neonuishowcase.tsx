// User instructions: Create a futuristic interactive UI showcase with multiple unique components floating in a dark neon environment. Add glowing cards, rotating icons, animated buttons, liquid glass panels, morphing circles, futuristic sliders, and cyberpunk navigation menus. Each component should react on hover with smooth scale animation, neon glow expansion, color shifting gradients, floating particles, and magnetic cursor interaction. Include hover-triggered effects where arrows slide smoothly, buttons pulse with energy, cards tilt in 3D, icons rotate, and borders animate like electric currents. Add soft ambient lighting, glassmorphism, parallax motion, space-inspired backgrounds, and ultra-smooth transitions to make the entire interface feel alive and futuristic.

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
    animate,
} from "framer-motion"

type NavItem = {
    label: string
}

type NeonShowcaseProps = {
    title: string
    subtitle: string
    buttonLabel: string
    background: string
    textColor: string
    accentA: string
    accentB: string
    glassTint: string
    glassOpacity: number
    glowIntensity: number
    enableParticles: boolean
    particleCount: number
    navItems: NavItem[]
    titleFont: any
    bodyFont: any
    buttonFont: any
    style?: React.CSSProperties
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

function useRafThrottledCallback<T extends (...args: any[]) => void>(cb: T) {
    const raf = React.useRef<number | null>(null)
    const lastArgs = React.useRef<any[] | null>(null)

    const wrapped = React.useCallback(
        (...args: any[]) => {
            lastArgs.current = args
            if (raf.current != null) return
            if (typeof window === "undefined") return
            raf.current = window.requestAnimationFrame(() => {
                raf.current = null
                if (lastArgs.current) cb(...(lastArgs.current as any[]))
            })
        },
        [cb]
    ) as T

    React.useEffect(() => {
        return () => {
            if (typeof window === "undefined") return
            if (raf.current != null) window.cancelAnimationFrame(raf.current)
        }
    }, [])

    return wrapped
}

function Magnetic(props: {
    children: React.ReactNode
    strength: number
    disabled?: boolean
    className?: string
    style?: React.CSSProperties
    onClick?: React.MouseEventHandler
    role?: string
    tabIndex?: number
    ariaLabel?: string
}) {
    const { strength, disabled, onClick, role, tabIndex, ariaLabel } = props
    const ref = React.useRef<HTMLDivElement>(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const sx = useSpring(x, { stiffness: 260, damping: 24, mass: 0.7 })
    const sy = useSpring(y, { stiffness: 260, damping: 24, mass: 0.7 })

    const handleMove = React.useCallback(
        (e: React.MouseEvent) => {
            if (disabled) return
            if (!ref.current) return
            const rect = ref.current.getBoundingClientRect()
            const relX = (e.clientX - rect.left) / rect.width - 0.5
            const relY = (e.clientY - rect.top) / rect.height - 0.5
            x.set(relX * strength)
            y.set(relY * strength)
        },
        [disabled, strength, x, y]
    )

    const handleLeave = React.useCallback(() => {
        x.set(0)
        y.set(0)
    }, [x, y])

    return (
        <motion.div
            ref={ref}
            style={{
                position: "relative",
                display: "inline-block",
                width: "100%",
                height: "100%",
                translateX: sx,
                translateY: sy,
                ...props.style,
            }}
            className={props.className}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            onClick={onClick}
            role={role}
            tabIndex={tabIndex}
            aria-label={ariaLabel}
        >
            {props.children}
        </motion.div>
    )
}

/**
 * Neon UI Showcase
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NeonUIShowcase(props: NeonShowcaseProps) {
    const {
        title,
        subtitle,
        buttonLabel,
        background,
        textColor,
        accentA,
        accentB,
        glassTint,
        glassOpacity,
        glowIntensity,
        enableParticles,
        particleCount,
        navItems,
        titleFont,
        bodyFont,
        buttonFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { amount: 0.2 })

    // Parallax / ambient gradient driven by cursor
    const mx = useMotionValue(0.5)
    const my = useMotionValue(0.5)
    const pmx = useSpring(mx, { stiffness: 120, damping: 26, mass: 0.8 })
    const pmy = useSpring(my, { stiffness: 120, damping: 26, mass: 0.8 })

    const glowX = useTransform(pmx, (v) => `${Math.round(v * 100)}%`)
    const glowY = useTransform(pmy, (v) => `${Math.round(v * 100)}%`)

    const handleMouseMove = useRafThrottledCallback((e: React.MouseEvent) => {
        if (isStatic) return
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
        const y = clamp((e.clientY - rect.top) / rect.height, 0, 1)
        mx.set(x)
        my.set(y)
    })

    const particles = React.useMemo(() => {
        const count = clamp(Math.round(particleCount), 0, 120)
        const seeded = [] as Array<{
            id: string
            x: number
            y: number
            r: number
            o: number
            s: number
            d: number
        }>
        for (let i = 0; i < count; i++) {
            const a = (i * 9301 + 49297) % 233280
            const b = (i * 233280 + 9301) % 49297
            const c = (i * 1103515245 + 12345) % 2147483647
            const x = (a / 233280) * 100
            const y = (b / 49297) * 100
            const r = 1.2 + (c % 24) / 10
            const o = 0.14 + ((c >> 4) % 60) / 300
            const s = 10 + ((c >> 6) % 60)
            const d = 4 + ((c >> 10) % 9)
            seeded.push({
                id: `p-${i}`,
                x,
                y,
                r,
                o,
                s,
                d,
            })
        }
        return seeded
    }, [particleCount])

    // Slider state
    const [slider, setSlider] = React.useState(0.62)

    // Click to shift the neon palette
    const [clicked, setClicked] = React.useState(false)
    const toggleClicked = React.useCallback(() => {
        React.startTransition(() => setClicked((v) => !v))
    }, [])

    const onSlider = React.useCallback((v: number) => {
        React.startTransition(() => setSlider(clamp(v, 0, 1)))
    }, [])

    // Animate ambient icon rotation when in view
    const iconRotation = useMotionValue(0)
    React.useEffect(() => {
        if (isStatic) return
        if (!inView) return
        const controls = animate(iconRotation, 360, {
            duration: 10,
            ease: "linear",
            repeat: Infinity,
        })
        return () => controls.stop()
    }, [iconRotation, inView, isStatic])

    const showMotion = !isStatic && inView

    const glow = `0 0 ${18 + glowIntensity * 32}px rgba(0, 255, 220, ${0.08 + glowIntensity * 0.18}), 0 0 ${40 + glowIntensity * 70}px rgba(140, 90, 255, ${0.06 + glowIntensity * 0.16})`

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                color: textColor,
                borderRadius: 16,
                filter: clicked ? "hue-rotate(70deg)" : "hue-rotate(0deg)",
                transition: "filter 520ms ease",
            }}
            onMouseMove={handleMouseMove}
        >
            {/* Space / neon background */}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(1200px 600px at 50% 45%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 55%), radial-gradient(800px 500px at 20% 20%, rgba(0,255,220,0.12) 0%, rgba(0,0,0,0) 55%), radial-gradient(900px 600px at 80% 40%, rgba(140,90,255,0.14) 0%, rgba(0,0,0,0) 60%), radial-gradient(700px 500px at 60% 90%, rgba(255,60,140,0.10) 0%, rgba(0,0,0,0) 55%)",
                    filter: "saturate(1.2)",
                    transform: "translateZ(0)",
                }}
                animate={
                    showMotion
                        ? {
                              filter: [
                                  "saturate(1.15)",
                                  "saturate(1.35)",
                                  "saturate(1.15)",
                              ],
                          }
                        : undefined
                }
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Parallax ambient light following cursor */}
            <motion.div
                style={{
                    position: "absolute",
                    inset: -80,
                    background: `radial-gradient(500px 400px at ${glowX} ${glowY}, rgba(0,255,220,0.22), rgba(0,0,0,0) 55%), radial-gradient(560px 460px at calc(${glowX} + 10%) calc(${glowY} - 8%), rgba(140,90,255,0.18), rgba(0,0,0,0) 60%)`,
                    opacity: 0.9,
                    mixBlendMode: "screen",
                    pointerEvents: "none",
                    filter: "blur(8px)",
                }}
            />

            {/* Particles */}
            {enableParticles && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                    aria-hidden
                >
                    {particles.map((p, idx) => {
                        const delay = (idx % 24) * 0.08
                        return (
                            <motion.div
                                key={p.id}
                                style={{
                                    position: "absolute",
                                    left: `${p.x}%`,
                                    top: `${p.y}%`,
                                    width: p.r * 2,
                                    height: p.r * 2,
                                    borderRadius: 999,
                                    background: "rgba(255,255,255,0.95)",
                                    opacity: p.o,
                                    boxShadow: `0 0 ${12 + p.r * 6}px rgba(0,255,220,0.18), 0 0 ${20 + p.r * 10}px rgba(140,90,255,0.12)`,
                                    transform: "translate(-50%, -50%)",
                                    willChange: "transform, opacity",
                                }}
                                animate={
                                    showMotion
                                        ? {
                                              y: [0, -p.s, 0],
                                              opacity: [p.o * 0.6, p.o, p.o * 0.55],
                                          }
                                        : undefined
                                }
                                transition={{
                                    duration: p.d,
                                    delay,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        )
                    })}
                </div>
            )}

            {/* Content */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    padding: 24,
                    boxSizing: "border-box",
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1fr",
                    gap: 18,
                }}
            >
                {/* Left column: hero + nav */}
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            padding: 18,
                            borderRadius: 18,
                            overflow: "hidden",
                            background: `linear-gradient(135deg, rgba(255,255,255,${0.08 + glassOpacity * 0.14}), rgba(255,255,255,${0.03 + glassOpacity * 0.1}))`,
                            border: `1px solid rgba(255,255,255,${0.10 + glassOpacity * 0.15})`,
                            backdropFilter: "blur(14px)",
                            WebkitBackdropFilter: "blur(14px)",
                            boxShadow: glow,
                        }}
                    >
                        {/* electric border */}
                        <motion.div
                            style={{
                                position: "absolute",
                                inset: -2,
                                background: `conic-gradient(from 180deg, ${accentA}, rgba(255,255,255,0) 20%, ${accentB}, rgba(255,255,255,0) 55%, ${accentA})`,
                                opacity: 0.35,
                                filter: "blur(0px)",
                                maskImage:
                                    "linear-gradient(#000, #000)",
                                WebkitMaskImage:
                                    "linear-gradient(#000, #000)",
                                padding: 2,
                                borderRadius: 20,
                                pointerEvents: "none",
                            }}
                            animate={
                                showMotion
                                    ? {
                                          rotate: 360,
                                      }
                                    : undefined
                            }
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        />
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                minWidth: 0,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            ...titleFont,
                                            margin: 0,
                                            letterSpacing: "-0.03em",
                                            lineHeight: titleFont?.lineHeight ?? "1em",
                                            fontSize: titleFont?.fontSize,
                                        }}
                                    >
                                        {title}
                                    </div>
                                    <div
                                        style={{
                                            ...bodyFont,
                                            opacity: 0.78,
                                            marginTop: 6,
                                            maxWidth: 420,
                                        }}
                                    >
                                        {subtitle}
                                    </div>
                                </div>

                                {/* rotating icon chip */}
                                <Magnetic
                                    strength={12}
                                    disabled={isStatic}
                                    style={{ width: 74, height: 74 }}
                                    ariaLabel="Rotating icon"
                                    role="img"
                                >
                                    <motion.div
                                        style={{
                                            position: "relative",
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: 20,
                                            background: `linear-gradient(135deg, rgba(0,0,0,0.35), rgba(255,255,255,0.08))`,
                                            border: `1px solid rgba(255,255,255,0.14)`,
                                            backdropFilter: "blur(10px)",
                                            WebkitBackdropFilter: "blur(10px)",
                                            boxShadow: `0 0 ${18 + glowIntensity * 26}px rgba(0,255,220,0.18)` ,
                                            display: "grid",
                                            placeItems: "center",
                                            overflow: "hidden",
                                        }}
                                        whileHover={
                                            isStatic
                                                ? undefined
                                                : {
                                                      scale: 1.04,
                                                      boxShadow: `0 0 ${26 + glowIntensity * 40}px rgba(0,255,220,0.25), 0 0 ${34 + glowIntensity * 48}px rgba(140,90,255,0.16)`,
                                                  }
                                        }
                                        transition={{ type: "spring", stiffness: 320, damping: 22 }}
                                    >
                                        <motion.div
                                            style={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 12,
                                                background: `linear-gradient(135deg, ${accentA}, ${accentB})`,
                                                boxShadow: `0 0 ${18 + glowIntensity * 34}px rgba(140,90,255,0.22)`,
                                                rotate: iconRotation,
                                            }}
                                            whileHover={isStatic ? undefined : { rotate: 180 }}
                                            transition={{ type: "spring", stiffness: 260, damping: 18 }}
                                        />
                                    </motion.div>
                                </Magnetic>
                            </div>

                            {/* Cyberpunk nav */}
                            <nav
                                aria-label="Cyberpunk navigation"
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    gap: 10,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                }}
                            >
                                {navItems?.slice(0, 6)?.map((item, idx) => {
                                    const label = item?.label ?? `Link ${idx + 1}`
                                    return (
                                        <Magnetic
                                            key={`${label}-${idx}`}
                                            strength={10}
                                            disabled={isStatic}
                                            style={{ width: "auto", height: "auto" }}
                                            role="button"
                                            tabIndex={0}
                                            ariaLabel={label}
                                        >
                                            <motion.button
                                                type="button"
                                                style={{
                                                    position: "relative",
                                                    appearance: "none",
                                                    border: "none",
                                                    background: "transparent",
                                                    color: textColor,
                                                    padding: "10px 12px",
                                                    borderRadius: 12,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    ...bodyFont,
                                                    fontSize: bodyFont?.fontSize ?? "14px",
                                                    whiteSpace: "nowrap",
                                                }}
                                                whileHover={
                                                    isStatic
                                                        ? undefined
                                                        : {
                                                              scale: 1.03,
                                                          }
                                                }
                                                transition={{ type: "spring", stiffness: 350, damping: 24 }}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    toggleClicked()
                                                }}
                                            >
                                                <motion.span
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        borderRadius: 12,
                                                        background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`,
                                                        border: `1px solid rgba(255,255,255,0.12)`,
                                                        backdropFilter: "blur(10px)",
                                                        WebkitBackdropFilter: "blur(10px)",
                                                        boxShadow: "0 0 0 rgba(0,0,0,0)",
                                                        opacity: 0.9,
                                                    }}
                                                    whileHover={
                                                        isStatic
                                                            ? undefined
                                                            : {
                                                                  boxShadow: `0 0 ${24 + glowIntensity * 36}px rgba(0,255,220,0.18)`,
                                                                  borderColor: "rgba(255,255,255,0.20)",
                                                              }
                                                    }
                                                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                                                />
                                                <span style={{ position: "relative", opacity: 0.92 }}>{label}</span>
                                                <motion.span
                                                    aria-hidden
                                                    style={{
                                                        position: "relative",
                                                        width: 14,
                                                        height: 14,
                                                        borderRadius: 5,
                                                        background: `linear-gradient(135deg, ${accentA}, ${accentB})`,
                                                        boxShadow: `0 0 ${14 + glowIntensity * 24}px rgba(0,255,220,0.18)`,
                                                    }}
                                                    whileHover={isStatic ? undefined : { rotate: 90, scale: 1.1 }}
                                                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                                                />
                                            </motion.button>
                                        </Magnetic>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Liquid glass panel */}
                    <Magnetic
                        strength={14}
                        disabled={isStatic}
                        style={{ width: "100%", flex: 1, minHeight: 180 }}
                        ariaLabel="Liquid glass panel"
                        role="group"
                    >
                        <motion.section
                            style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                                borderRadius: 22,
                                overflow: "hidden",
                                background: `linear-gradient(135deg, rgba(255,255,255,${0.06 + glassOpacity * 0.14}), rgba(255,255,255,${0.02 + glassOpacity * 0.12}))`,
                                border: `1px solid rgba(255,255,255,${0.10 + glassOpacity * 0.16})`,
                                backdropFilter: "blur(18px)",
                                WebkitBackdropFilter: "blur(18px)",
                                boxShadow: glow,
                                transformStyle: "preserve-3d",
                            }}
                            whileHover={
                                isStatic
                                    ? undefined
                                    : {
                                          scale: 1.01,
                                      }
                            }
                            transition={{ type: "spring", stiffness: 260, damping: 24 }}
                        >
                            <motion.div
                                style={{
                                    position: "absolute",
                                    inset: -60,
                                    background: `radial-gradient(600px 240px at 30% 30%, ${glassTint}, rgba(0,0,0,0) 60%), radial-gradient(520px 260px at 80% 60%, rgba(140,90,255,0.22), rgba(0,0,0,0) 60%)`,
                                    filter: "blur(10px)",
                                    opacity: 0.9,
                                }}
                                animate={
                                    showMotion
                                        ? {
                                              x: [0, 20, 0],
                                              y: [0, -12, 0],
                                          }
                                        : undefined
                                }
                                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                            />

                            {/* Morphing circles */}
                            <motion.div
                                style={{
                                    position: "absolute",
                                    left: 22,
                                    bottom: 22,
                                    width: 120,
                                    height: 120,
                                    borderRadius: 40,
                                    background: `linear-gradient(135deg, ${accentA}, ${accentB})`,
                                    opacity: 0.34,
                                    filter: "blur(0px)",
                                    boxShadow: `0 0 ${34 + glowIntensity * 60}px rgba(0,255,220,0.18)`,
                                    transform: "translateZ(20px)",
                                }}
                                animate={
                                    showMotion
                                        ? {
                                              borderRadius: [36, 60, 24, 52, 36],
                                              rotate: [0, 20, -12, 10, 0],
                                              scale: [1, 1.08, 0.98, 1.06, 1],
                                          }
                                        : undefined
                                }
                                transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
                                whileHover={
                                    isStatic
                                        ? undefined
                                        : {
                                              opacity: 0.44,
                                              scale: 1.12,
                                          }
                                }
                            />

                            <motion.div
                                style={{
                                    position: "absolute",
                                    right: 20,
                                    top: 24,
                                    width: 160,
                                    height: 110,
                                    borderRadius: 30,
                                    border: `1px solid rgba(255,255,255,0.16)`,
                                    background: `linear-gradient(135deg, rgba(0,0,0,0.25), rgba(255,255,255,0.06))`,
                                    boxShadow: `0 0 ${22 + glowIntensity * 36}px rgba(140,90,255,0.16)`,
                                    overflow: "hidden",
                                }}
                                animate={
                                    showMotion
                                        ? {
                                              y: [0, 10, 0],
                                          }
                                        : undefined
                                }
                                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <motion.div
                                    style={{
                                        position: "absolute",
                                        inset: -40,
                                        background: `conic-gradient(from 90deg, rgba(255,255,255,0), ${accentB}, rgba(255,255,255,0), ${accentA})`,
                                        opacity: 0.34,
                                        filter: "blur(8px)",
                                    }}
                                    animate={showMotion ? { rotate: 360 } : undefined}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                />
                            </motion.div>

                            <div
                                style={{
                                    position: "relative",
                                    padding: 18,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    gap: 12,
                                }}
                            >
                                <div
                                    style={{
                                        ...bodyFont,
                                        opacity: 0.92,
                                        maxWidth: 420,
                                    }}
                                >
                                    Liquid glass surfaces, morphing geometry, and ambient neon lighting. Hover elements feel magnetic and alive.
                                </div>

                                {/* Futuristic slider */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: 12,
                                        }}
                                    >
                                        <div style={{ ...bodyFont, opacity: 0.78 }}>Energy Flow</div>
                                        <div style={{ ...bodyFont, opacity: 0.9 }}>{Math.round(slider * 100)}%</div>
                                    </div>
                                    <div
                                        style={{
                                            position: "relative",
                                            height: 14,
                                            borderRadius: 999,
                                            background: "rgba(255,255,255,0.08)",
                                            border: "1px solid rgba(255,255,255,0.14)",
                                            overflow: "hidden",
                                        }}
                                        role="slider"
                                        aria-valuenow={Math.round(slider * 100)}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "ArrowLeft") onSlider(slider - 0.03)
                                            if (e.key === "ArrowRight") onSlider(slider + 0.03)
                                        }}
                                        onMouseDown={(e) => {
                                            if (isStatic) return
                                            const el = e.currentTarget
                                            const rect = el.getBoundingClientRect()
                                            const v = (e.clientX - rect.left) / rect.width
                                            onSlider(v)
                                        }}
                                    >
                                        <motion.div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                width: `${slider * 100}%`,
                                                background: `linear-gradient(90deg, ${accentA}, ${accentB})`,
                                                boxShadow: `0 0 ${20 + glowIntensity * 40}px rgba(0,255,220,0.20)`,
                                            }}
                                            animate={
                                                isStatic
                                                    ? undefined
                                                    : {
                                                          filter: [
                                                              "hue-rotate(0deg)",
                                                              "hue-rotate(18deg)",
                                                              "hue-rotate(0deg)",
                                                          ],
                                                      }
                                            }
                                            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                        <Magnetic
                                            strength={16}
                                            disabled={isStatic}
                                            style={{
                                                position: "absolute",
                                                left: `calc(${slider * 100}% - 14px)`,
                                                top: "50%",
                                                width: 28,
                                                height: 28,
                                                transform: "translateY(-50%)",
                                            }}
                                            ariaLabel="Slider thumb"
                                            role="img"
                                        >
                                            <motion.div
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    borderRadius: 12,
                                                    background: `linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))`,
                                                    border: "1px solid rgba(255,255,255,0.18)",
                                                    boxShadow: `0 0 ${28 + glowIntensity * 46}px rgba(140,90,255,0.18)`,
                                                    backdropFilter: "blur(12px)",
                                                    WebkitBackdropFilter: "blur(12px)",
                                                }}
                                                whileHover={
                                                    isStatic
                                                        ? undefined
                                                        : {
                                                              scale: 1.06,
                                                              boxShadow: `0 0 ${34 + glowIntensity * 64}px rgba(0,255,220,0.22), 0 0 ${34 + glowIntensity * 64}px rgba(140,90,255,0.16)`,
                                                          }
                                                }
                                                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                                            />
                                        </Magnetic>
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    </Magnetic>
                </div>

                {/* Right column: floating cards + animated buttons */}
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        gridTemplateRows: "auto 1fr",
                        gap: 18,
                        minWidth: 0,
                    }}
                >
                    {/* Animated button cluster */}
                    <div
                        style={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                            minWidth: 0,
                        }}
                    >
                        {[
                            { kind: "Primary", a: accentA, b: accentB },
                            { kind: "Ghost", a: "rgba(255,255,255,0.12)", b: "rgba(255,255,255,0.04)" },
                        ].map((b, idx) => (
                            <Magnetic
                                key={b.kind}
                                strength={14}
                                disabled={isStatic}
                                style={{ width: "100%", height: 56 }}
                                role="button"
                                tabIndex={0}
                                ariaLabel={`${b.kind} button`}
                            >
                                <motion.button
                                    type="button"
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: 16,
                                        border: "1px solid rgba(255,255,255,0.16)",
                                        background:
                                            b.kind === "Primary"
                                                ? `linear-gradient(135deg, ${b.a}, ${b.b})`
                                                : `linear-gradient(135deg, ${b.a}, ${b.b})`,
                                        color: b.kind === "Primary" ? "rgba(0,0,0,0.92)" : textColor,
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        boxShadow: b.kind === "Primary" ? glow : "none",
                                        ...buttonFont,
                                        whiteSpace: "nowrap",
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        toggleClicked()
                                    }}
                                    whileHover={
                                        isStatic
                                            ? undefined
                                            : {
                                                  scale: 1.03,
                                              }
                                    }
                                    whileTap={isStatic ? undefined : { scale: 0.99 }}
                                    transition={{ type: "spring", stiffness: 340, damping: 22 }}
                                >
                                    {/* Energy pulse */}
                                    <motion.span
                                        aria-hidden
                                        style={{
                                            position: "absolute",
                                            inset: -40,
                                            background:
                                                b.kind === "Primary"
                                                    ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), rgba(255,255,255,0) 55%)"
                                                    : `radial-gradient(circle at 30% 30%, rgba(0,255,220,0.18), rgba(0,0,0,0) 55%)`,
                                            opacity: 0.0,
                                        }}
                                        whileHover={isStatic ? undefined : { opacity: 1 }}
                                        animate={
                                            showMotion
                                                ? {
                                                      x: [0, 22, 0],
                                                      y: [0, -14, 0],
                                                  }
                                                : undefined
                                        }
                                        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                                    />

                                    <span
                                        style={{
                                            position: "relative",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        {idx === 0 ? buttonLabel : "Pulse Shield"}
                                        <motion.span
                                            aria-hidden
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: 6,
                                                border: `1px solid rgba(255,255,255,${idx === 0 ? 0.38 : 0.18})`,
                                                background:
                                                    idx === 0
                                                        ? "rgba(0,0,0,0.18)"
                                                        : "rgba(255,255,255,0.06)",
                                                display: "grid",
                                                placeItems: "center",
                                                overflow: "hidden",
                                            }}
                                            whileHover={isStatic ? undefined : { scale: 1.12 }}
                                            transition={{ type: "spring", stiffness: 380, damping: 18 }}
                                        >
                                            <motion.span
                                                aria-hidden
                                                style={{
                                                    width: 8,
                                                    height: 2,
                                                    borderRadius: 999,
                                                    background: idx === 0 ? "rgba(0,0,0,0.85)" : textColor,
                                                    display: "block",
                                                    transformOrigin: "left center",
                                                }}
                                                whileHover={isStatic ? undefined : { x: 4 }}
                                                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                                            />
                                        </motion.span>
                                    </span>
                                </motion.button>
                            </Magnetic>
                        ))}
                    </div>

                    {/* Floating cards grid */}
                    <div
                        style={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 14,
                            minHeight: 0,
                        }}
                    >
                        {[0, 1, 2, 3].map((i) => {
                            const heading = ["Glowing Card", "Neon Terminal", "Quantum Tile", "Holo Panel"][i]
                            const desc = [
                                "Hover to tilt in 3D and spark electric borders.",
                                "Animated gradients, subtle scanlines, and neon glow.",
                                "Magnetic cursor + floating particles + soft glass.",
                                "Parallax light + morphing shapes + smooth transitions.",
                            ][i]

                            return (
                                <TiltCard
                                    key={i}
                                    heading={heading}
                                    desc={desc}
                                    accentA={accentA}
                                    accentB={accentB}
                                    textColor={textColor}
                                    glassOpacity={glassOpacity}
                                    glowIntensity={glowIntensity}
                                    disabled={isStatic}
                                    showMotion={showMotion}
                                    bodyFont={bodyFont}
                                    onToggle={toggleClicked}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Soft vignette */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                        "radial-gradient(1200px 600px at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
                }}
                aria-hidden
            />
        </div>
    )
}

function TiltCard(props: {
    heading: string
    desc: string
    accentA: string
    accentB: string
    textColor: string
    glassOpacity: number
    glowIntensity: number
    disabled: boolean
    showMotion: boolean
    bodyFont: any
    onToggle: () => void
}) {
    const {
        heading,
        desc,
        accentA,
        accentB,
        textColor,
        glassOpacity,
        glowIntensity,
        disabled,
        showMotion,
        bodyFont,
        onToggle,
    } = props

    const ref = React.useRef<HTMLDivElement>(null)

    const rx = useMotionValue(0)
    const ry = useMotionValue(0)
    const srX = useSpring(rx, { stiffness: 220, damping: 22, mass: 0.8 })
    const srY = useSpring(ry, { stiffness: 220, damping: 22, mass: 0.8 })

    const handleMove = React.useCallback(
        (e: React.MouseEvent) => {
            if (disabled) return
            if (!ref.current) return
            const rect = ref.current.getBoundingClientRect()
            const px = (e.clientX - rect.left) / rect.width - 0.5
            const py = (e.clientY - rect.top) / rect.height - 0.5
            rx.set(clamp(-py * 10, -12, 12))
            ry.set(clamp(px * 12, -14, 14))
        },
        [disabled, rx, ry]
    )

    const handleLeave = React.useCallback(() => {
        rx.set(0)
        ry.set(0)
    }, [rx, ry])

    return (
        <Magnetic strength={12} disabled={disabled} style={{ width: "100%", height: "100%" }}>
            <motion.article
                ref={ref}
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: 20,
                    overflow: "hidden",
                    background: `linear-gradient(135deg, rgba(255,255,255,${0.06 + glassOpacity * 0.12}), rgba(255,255,255,${0.02 + glassOpacity * 0.10}))`,
                    border: `1px solid rgba(255,255,255,${0.11 + glassOpacity * 0.14})`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: `0 0 ${20 + glowIntensity * 44}px rgba(0,255,220,0.12), 0 0 ${28 + glowIntensity * 56}px rgba(140,90,255,0.10)`,
                    transformStyle: "preserve-3d",
                    rotateX: srX,
                    rotateY: srY,
                    willChange: "transform",
                    cursor: "default",
                    minHeight: 170,
                }}
                whileHover={
                    disabled
                        ? undefined
                        : {
                              scale: 1.02,
                          }
                }
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
                {/* electric border runner */}
                <motion.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: -2,
                        borderRadius: 22,
                        background: `conic-gradient(from 0deg, rgba(255,255,255,0), ${accentA}, rgba(255,255,255,0) 25%, ${accentB}, rgba(255,255,255,0) 60%, ${accentA})`,
                        opacity: 0.0,
                        filter: "blur(0px)",
                        pointerEvents: "none",
                    }}
                    whileHover={disabled ? undefined : { opacity: 0.35, rotate: 360 }}
                    transition={{ duration: 2.4, ease: "linear" }}
                />

                {/* subtle scanlines */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.0) 3px, rgba(255,255,255,0.0) 6px)",
                        opacity: 0.08,
                        mixBlendMode: "overlay",
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "relative",
                        padding: 16,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 10,
                        }}
                    >
                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    ...bodyFont,
                                    fontSize: "15px",
                                    letterSpacing: "-0.01em",
                                    opacity: 0.94,
                                }}
                            >
                                {heading}
                            </div>
                            <div style={{ ...bodyFont, opacity: 0.72, marginTop: 6 }}>{desc}</div>
                        </div>
                        <motion.div
                            aria-hidden
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 14,
                                background: `linear-gradient(135deg, ${accentA}, ${accentB})`,
                                boxShadow: `0 0 ${18 + glowIntensity * 34}px rgba(0,255,220,0.18)`,
                                flex: "0 0 auto",
                            }}
                            animate={showMotion ? { rotate: [0, 8, 0] } : undefined}
                            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                            whileHover={disabled ? undefined : { rotate: 90, scale: 1.08 }}
                        />
                    </div>

                    {/* animated CTA row */}
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                        <motion.div
                            style={{
                                height: 34,
                                padding: "0 12px",
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,0.16)",
                                background: "rgba(0,0,0,0.18)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                color: textColor,
                                ...bodyFont,
                                fontSize: "13px",
                                cursor: "pointer",
                                position: "relative",
                                overflow: "hidden",
                            }}
                            whileHover={
                                disabled
                                    ? undefined
                                    : {
                                          scale: 1.03,
                                          boxShadow: `0 0 ${22 + glowIntensity * 40}px rgba(140,90,255,0.14)`,
                                      }
                            }
                            transition={{ type: "spring", stiffness: 340, damping: 22 }}
                            role="button"
                            tabIndex={0}
                            aria-label="View details"
                            onClick={(e) => {
                                e.preventDefault()
                                onToggle()
                            }}
                        >
                            <motion.span
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    inset: -30,
                                    background: `radial-gradient(circle at 30% 30%, rgba(0,255,220,0.18), rgba(0,0,0,0) 60%)`,
                                    opacity: 0,
                                }}
                                whileHover={disabled ? undefined : { opacity: 1 }}
                                animate={
                                    showMotion
                                        ? {
                                              x: [0, 18, 0],
                                              y: [0, -10, 0],
                                          }
                                        : undefined
                                }
                                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <span style={{ position: "relative" }}>View</span>
                            <motion.span
                                aria-hidden
                                style={{
                                    position: "relative",
                                    width: 18,
                                    height: 2,
                                    borderRadius: 999,
                                    background: textColor,
                                    opacity: 0.85,
                                    transformOrigin: "left center",
                                }}
                                whileHover={disabled ? undefined : { x: 6 }}
                                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                            />
                            <motion.span
                                aria-hidden
                                style={{
                                    position: "relative",
                                    width: 8,
                                    height: 8,
                                    borderRight: `2px solid ${textColor}`,
                                    borderTop: `2px solid ${textColor}`,
                                    transform: "rotate(45deg)",
                                    marginLeft: -10,
                                    opacity: 0.85,
                                }}
                                whileHover={disabled ? undefined : { x: 6 }}
                                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                            />
                        </motion.div>

                        <motion.div
                            aria-hidden
                            style={{
                                flex: 1,
                                height: 2,
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.10)",
                                overflow: "hidden",
                            }}
                        >
                            <motion.div
                                style={{
                                    height: "100%",
                                    width: "40%",
                                    background: `linear-gradient(90deg, rgba(255,255,255,0), ${accentA}, rgba(255,255,255,0))`,
                                    opacity: 0.6,
                                }}
                                animate={
                                    showMotion
                                        ? {
                                              x: ["-20%", "220%"],
                                          }
                                        : undefined
                                }
                                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.article>
        </Magnetic>
    )
}

addPropertyControls(NeonUIShowcase, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Neon Interface",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "A living cyberpunk UI showcase with magnetic hover, glassmorphism, and electric motion.",
        displayTextArea: true,
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Boost Core",
    },
    navItems: {
        type: ControlType.Array,
        title: "Nav",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Overview",
                },
            },
        },
        defaultValue: [{ label: "Overview" }, { label: "Systems" }, { label: "Signals" }, { label: "Labs" }],
        maxCount: 6,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#05070D",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    accentA: {
        type: ControlType.Color,
        title: "Accent A",
        defaultValue: "#00FFD5",
    },
    accentB: {
        type: ControlType.Color,
        title: "Accent B",
        defaultValue: "#8C5AFF",
    },
    glassTint: {
        type: ControlType.Color,
        title: "Glass Tint",
        defaultValue: "rgba(0,255,213,0.22)",
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.01,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.01,
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
        title: "Count",
        defaultValue: 44,
        min: 0,
        max: 120,
        step: 1,
        hidden: (p) => !p.enableParticles,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Semibold",
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
