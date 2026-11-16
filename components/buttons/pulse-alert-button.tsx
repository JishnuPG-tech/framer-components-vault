import * as React from "react"
import { useEffect, useId, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion"

/*
 * PulseButton — Micro-Motion Pulse Alert Button
 * Magnetic proximity pull · breathing neon halo · alert shock-rings ·
 * rotating specular rim · elastic press + fluid click ripple.
 * GPU-friendly: transforms/opacity only, single passive pointer listener, springs via motion values.
 */

interface Props {
    label: string
    link: string
    newTab: boolean
    font: React.CSSProperties
    textColor: string
    fillColor: string
    neonColor: string
    rimColor: string
    rippleColor: string
    innerPadding: string
    radius: string
    magnetStrength: number
    magnetRadius: number
    pulseSpeed: number
    pulseIntensity: number
    alertRings: boolean
    showArrow: boolean
    onClick?: () => void
    style?: React.CSSProperties
}

interface Ripple {
    id: number
    x: number
    y: number
    size: number
}

const DEFAULTS: Omit<Props, "style" | "onClick"> = {
    label: "Get early access",
    link: "",
    newTab: false,
    font: {},
    textColor: "#F4FBFF",
    fillColor: "#0B1220",
    neonColor: "#39E6FF",
    rimColor: "#B79CFF",
    rippleColor: "#FFFFFF",
    innerPadding: "16px 28px",
    radius: "999px",
    magnetStrength: 0.5,
    magnetRadius: 120,
    pulseSpeed: 1,
    pulseIntensity: 1,
    alertRings: true,
    showArrow: true,
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const mix = (color: string, pct: number, other = "transparent") =>
    "color-mix(in srgb, " + color + " " + Math.round(clamp(pct, 0, 100)) + "%, " + other + ")"

const PRESS_SPRING = { type: "spring" as const, stiffness: 520, damping: 13, mass: 0.6 }

/**
 * Micro-Motion Pulse Alert Button
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 56
 */
export default function PulseButton(inputProps: Partial<Props>) {
    const p = { ...DEFAULTS, ...inputProps } as Props
    const rawId = useId()
    const uid = "nova" + rawId.replace(/[^a-zA-Z0-9]/g, "")
    const anchorRef = useRef<HTMLSpanElement>(null)
    const faceRef = useRef<HTMLElement | null>(null)
    const rippleSeq = useRef(0)
    const [ripples, setRipples] = useState<Ripple[]>([])
    const [burst, setBurst] = useState(0)

    const target = RenderTarget.current()
    const isStatic = target === RenderTarget.canvas || target === RenderTarget.thumbnail || target === RenderTarget.export
    const reduceMotion = useReducedMotion() === true
    const animate = !isStatic && !reduceMotion

    // ── Magnetic field ───────────────────────────────────────
    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const prox = useMotionValue(0)
    const x = useSpring(mx, { stiffness: 170, damping: 14, mass: 0.55 })
    const y = useSpring(my, { stiffness: 170, damping: 14, mass: 0.55 })
    const near = useSpring(prox, { stiffness: 120, damping: 20 })
    const labelX = useTransform(x, (v) => v * 0.45)
    const labelY = useTransform(y, (v) => v * 0.45)
    const haloScale = useTransform(near, [0, 1], [1, 1.18])
    const haloOpacity = useTransform(near, [0, 1], [0.8, 1])

    const strengthRef = useRef(p.magnetStrength)
    const radiusRef = useRef(p.magnetRadius)
    strengthRef.current = p.magnetStrength
    radiusRef.current = p.magnetRadius

    useEffect(() => {
        if (!animate) return
        const reset = () => {
            mx.set(0)
            my.set(0)
            prox.set(0)
        }
        const onMove = (e: PointerEvent) => {
            const el = anchorRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const dx = e.clientX - (r.left + r.width / 2)
            const dy = e.clientY - (r.top + r.height / 2)
            const reach = Math.max(1, radiusRef.current) + Math.max(r.width, r.height) / 2
            const d = Math.hypot(dx, dy)
            if (d >= reach) {
                reset()
                return
            }
            const t = 1 - d / reach
            const f = t * t * (3 - 2 * t) // smoothstep falloff — no snap at the field edge
            const s = clamp(strengthRef.current, 0, 1.5) * 0.5
            mx.set(dx * s * f)
            my.set(dy * s * f)
            prox.set(f)
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        document.addEventListener("pointerleave", reset)
        window.addEventListener("blur", reset)
        return () => {
            window.removeEventListener("pointermove", onMove)
            document.removeEventListener("pointerleave", reset)
            window.removeEventListener("blur", reset)
        }
    }, [animate, mx, my, prox])

    // ── Click ripple + shock ring ────────────────────────────
    const onPointerDown = (e: React.PointerEvent) => {
        const el = faceRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const sx = r.width / (el.offsetWidth || r.width)
        const sy = r.height / (el.offsetHeight || r.height)
        const lx = (e.clientX - r.left) / sx
        const ly = (e.clientY - r.top) / sy
        const w = el.offsetWidth
        const h = el.offsetHeight
        const far = Math.max(Math.hypot(lx, ly), Math.hypot(w - lx, ly), Math.hypot(lx, h - ly), Math.hypot(w - lx, h - ly))
        const id = ++rippleSeq.current
        setRipples((rs) => rs.slice(-3).concat({ id, x: lx, y: ly, size: far * 2 }))
        setBurst((b) => b + 1)
    }
    const removeRipple = (id: number) => setRipples((rs) => rs.filter((r) => r.id !== id))

    // ── Styling ──────────────────────────────────────────────
    const speed = clamp(p.pulseSpeed, 0.1, 4)
    const pulseDur = (2.6 / speed).toFixed(2) + "s"
    const intensity = clamp(p.pulseIntensity, 0, 2)
    const neon = p.neonColor
    const fontStyle: React.CSSProperties = {
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "0.01em",
        lineHeight: "1em",
        ...p.font,
    }

    const css =
        "@keyframes " + uid + "pulse{0%,100%{transform:scale(.94);opacity:.5}50%{transform:scale(1.06);opacity:1}}" +
        "@keyframes " + uid + "ring{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.22,1.75);opacity:0}}" +
        "@keyframes " + uid + "spin{to{transform:rotate(360deg)}}" +
        "." + uid + "face{outline:none}" +
        "." + uid + "face:focus-visible{box-shadow:0 0 0 2px " + p.fillColor + ",0 0 0 4px " + neon + "}"

    const anim = (name: string, dur: string, extra = "") =>
        animate ? uid + name + " " + dur + " " + extra : "none"

    const content = (
        <>
            {/* rotating specular rim (1px conic sweep) */}
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: p.radius,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                <span
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "300%",
                        aspectRatio: "1 / 1",
                        marginLeft: "-150%",
                        marginTop: "-150%",
                        background:
                            "conic-gradient(from 0deg, transparent 0deg, " + mix(neon, 90) + " 50deg, transparent 110deg, transparent 180deg, " +
                            mix(p.rimColor, 85) + " 235deg, transparent 300deg)",
                        animation: anim("spin", (5 / speed).toFixed(2) + "s", "linear infinite"),
                    }}
                />
                <span
                    style={{
                        position: "absolute",
                        inset: 1,
                        borderRadius: "inherit",
                        background:
                            "linear-gradient(180deg, " + mix(p.fillColor, 82, "#ffffff") + " 0%, " + p.fillColor + " 55%, " +
                            mix(p.fillColor, 88, "#000000") + " 100%)",
                        boxShadow:
                            "inset 0 1px 0 " + mix("#ffffff", 28) + ", inset 0 -10px 18px " + mix("#000000", 30) +
                            ", inset 0 0 22px " + mix(neon, 18 * intensity),
                    }}
                />
            </span>

            {/* ripples */}
            <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: p.radius, overflow: "hidden", pointerEvents: "none" }}>
                {ripples.map((r) => (
                    <motion.span
                        key={r.id}
                        initial={{ scale: 0, opacity: 0.55 }}
                        animate={{ scale: 1, opacity: 0 }}
                        transition={{ scale: { duration: 0.75, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.9, ease: "easeOut" } }}
                        onAnimationComplete={() => removeRipple(r.id)}
                        style={{
                            position: "absolute",
                            left: r.x - r.size / 2,
                            top: r.y - r.size / 2,
                            width: r.size,
                            height: r.size,
                            borderRadius: "50%",
                            background:
                                "radial-gradient(circle, " + mix(p.rippleColor, 55) + " 0%, " + mix(neon, 35) + " 45%, transparent 70%)",
                        }}
                    />
                ))}
            </span>

            {/* label */}
            <motion.span
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.55em",
                    whiteSpace: "nowrap",
                    color: p.textColor,
                    textShadow: "0 0 14px " + mix(neon, 45 * intensity),
                    x: labelX,
                    y: labelY,
                    ...fontStyle,
                }}
            >
                {p.label}
                {p.showArrow && (
                    <motion.svg
                        variants={{ rest: { x: 0 }, hover: { x: 3 }, tap: { x: 5 } }}
                        transition={PRESS_SPRING}
                        width="1em"
                        height="1em"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                    >
                        <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                )}
            </motion.span>
        </>
    )

    const faceStyle: React.CSSProperties = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: p.innerPadding || DEFAULTS.innerPadding,
        borderRadius: p.radius,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        textDecoration: "none",
        WebkitTapHighlightColor: "transparent",
        boxShadow:
            "0 0 0 1px " + mix(neon, 22) + ", 0 0 " + Math.round(18 * intensity) + "px " + mix(neon, 40 * intensity) +
            ", 0 0 " + Math.round(56 * intensity) + "px " + mix(neon, 22 * intensity) +
            ", 0 10px 30px -8px " + mix("#000000", 60),
        isolation: "isolate",
    }

    const faceMotion = {
        className: uid + "face",
        initial: "rest",
        whileHover: "hover",
        whileTap: "tap",
        variants: {
            rest: { scale: 1, filter: "brightness(1)" },
            hover: { scale: 1.03, filter: "brightness(1.12)" },
            tap: { scale: 0.94, filter: "brightness(1.2)" },
        },
        transition: PRESS_SPRING,
        onPointerDown,
        style: faceStyle,
    }

    return (
        <span
            ref={anchorRef}
            style={{ position: "relative", display: "inline-flex", isolation: "isolate", ...p.style }}
        >
            <style>{css}</style>
            <motion.span style={{ position: "relative", display: "inline-flex", x, y }}>
                {/* breathing neon halo (proximity-boosted) */}
                <motion.span
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: "-45% -22%",
                        pointerEvents: "none",
                        zIndex: -1,
                        scale: haloScale,
                        opacity: haloOpacity,
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "999px",
                            background:
                                "radial-gradient(closest-side, " + mix(neon, 80 * intensity) + " 0%, " + mix(neon, 34 * intensity) +
                                " 38%, " + mix(neon, 9 * intensity) + " 66%, transparent 100%)",
                            filter: "blur(18px)",
                            animation: anim("pulse", pulseDur, "ease-in-out infinite"),
                            opacity: animate ? undefined : 0.85,
                        }}
                    />
                </motion.span>

                {/* alert shock-rings */}
                {p.alertRings &&
                    [0, 1].map((i) => (
                        <span
                            key={i}
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: p.radius,
                                border: "1.5px solid " + mix(neon, 75),
                                boxShadow: "0 0 12px " + mix(neon, 45),
                                pointerEvents: "none",
                                zIndex: -1,
                                opacity: 0,
                                animation: anim(
                                    "ring",
                                    pulseDur,
                                    "cubic-bezier(.2,.7,.3,1) " + ((i * 2.6) / speed / 2).toFixed(2) + "s infinite"
                                ),
                            }}
                        />
                    ))}

                {/* click shock-wave */}
                {burst > 0 && (
                    <motion.span
                        key={"burst" + burst}
                        aria-hidden
                        initial={{ scale: 1, opacity: 0.9 }}
                        animate={{ scale: 1.45, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: p.radius,
                            border: "2px solid " + neon,
                            boxShadow: "0 0 24px " + mix(neon, 70),
                            pointerEvents: "none",
                        }}
                    />
                )}

                {p.link ? (
                    <motion.a
                        {...faceMotion}
                        ref={(el: HTMLAnchorElement | null) => {
                            faceRef.current = el
                        }}
                        href={p.link}
                        target={p.newTab ? "_blank" : undefined}
                        rel={p.newTab ? "noopener noreferrer" : undefined}
                        onClick={p.onClick}
                    >
                        {content}
                    </motion.a>
                ) : (
                    <motion.button
                        {...faceMotion}
                        ref={(el: HTMLButtonElement | null) => {
                            faceRef.current = el
                        }}
                        type="button"
                        onClick={p.onClick}
                    >
                        {content}
                    </motion.button>
                )}
            </motion.span>
        </span>
    )
}

PulseButton.displayName = "Pulse Alert Button"

addPropertyControls(PulseButton, {
    label: { type: ControlType.String, title: "Label", defaultValue: DEFAULTS.label },
    link: { type: ControlType.Link, title: "Link" },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, hidden: (props: Props) => !props.link },
    onClick: { type: ControlType.EventHandler },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, letterSpacing: "0.01em", lineHeight: "1em" },
    },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: DEFAULTS.textColor },
    fillColor: { type: ControlType.Color, title: "Fill", defaultValue: DEFAULTS.fillColor },
    neonColor: { type: ControlType.Color, title: "Neon", defaultValue: DEFAULTS.neonColor },
    rimColor: { type: ControlType.Color, title: "Rim Accent", defaultValue: DEFAULTS.rimColor },
    rippleColor: { type: ControlType.Color, title: "Ripple", defaultValue: DEFAULTS.rippleColor },
    innerPadding: { type: ControlType.Padding, title: "Padding", defaultValue: DEFAULTS.innerPadding },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: DEFAULTS.radius },
    magnetStrength: { type: ControlType.Number, title: "Magnet", min: 0, max: 1.5, step: 0.05, defaultValue: DEFAULTS.magnetStrength },
    magnetRadius: { type: ControlType.Number, title: "Magnet Reach", min: 0, max: 400, step: 10, unit: "px", defaultValue: DEFAULTS.magnetRadius },
    pulseSpeed: { type: ControlType.Number, title: "Pulse Speed", min: 0.1, max: 4, step: 0.05, defaultValue: DEFAULTS.pulseSpeed },
    pulseIntensity: { type: ControlType.Number, title: "Glow", min: 0, max: 2, step: 0.05, defaultValue: DEFAULTS.pulseIntensity },
    alertRings: { type: ControlType.Boolean, title: "Alert Rings", enabledTitle: "On", disabledTitle: "Off", defaultValue: DEFAULTS.alertRings },
    showArrow: { type: ControlType.Boolean, title: "Arrow", enabledTitle: "Show", disabledTitle: "Hide", defaultValue: DEFAULTS.showArrow },
})
