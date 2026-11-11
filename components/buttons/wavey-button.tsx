// ScrambleButtons — Framer Marketplace Component
// Two animated buttons with center-out wave scramble on hover.
// by Thomas Peter · thomasbuilds.net

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useEffect } from "react"

// ─── Wave scramble ────────────────────────────────────────────────────────────

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const TRAIL = 2.5

type Slot = { char: string; opacity: number }

function useWaveScramble(text: string, speed: number, interval: number) {
    const idle = text.split("").map((c) => ({ char: c, opacity: 1 }))
    const [slots, setSlots] = useState<Slot[]>(idle)
    const timer = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        setSlots(text.split("").map((c) => ({ char: c, opacity: 1 })))
    }, [text])

    const scramble = () => {
        const center = (text.length - 1) / 2
        let wave = 0
        clearInterval(timer.current!)
        timer.current = setInterval(() => {
            setSlots(
                text.split("").map((char, i): Slot => {
                    if (char === " ") return { char: " ", opacity: 1 }
                    const dist = Math.abs(i - center)
                    if (dist > wave)
                        return {
                            char: CHARS[
                                Math.floor(Math.random() * CHARS.length)
                            ],
                            opacity: 0,
                        }
                    if (dist > wave - TRAIL)
                        return {
                            char: CHARS[
                                Math.floor(Math.random() * CHARS.length)
                            ],
                            opacity: 1,
                        }
                    return { char: text[i], opacity: 1 }
                })
            )
            wave += speed
            if (wave > center + TRAIL + 1) {
                clearInterval(timer.current!)
                setSlots(idle)
            }
        }, interval)
    }

    const reset = () => {
        clearInterval(timer.current!)
        setSlots(idle)
    }
    return { slots, scramble, reset }
}

// ─── Single Button ────────────────────────────────────────────────────────────

interface BtnProps {
    label: string
    href: string
    variant: "primary" | "outline"
    fontFamily: string
    fontSize: number
    paddingX: number
    paddingY: number
    letterSpacing: number
    waveSpeed: number
    waveInterval: number
    primaryBg: string
    primaryText: string
    primaryHoverBg: string
    primaryHoverText: string
    primaryBorderColor: string
    outlineText: string
    outlineBorder: string
    outlineHoverText: string
    outlineHoverBorder: string
    outlineHoverBg: string
    borderWidth: number
    borderRadius: number
}

function ScrambleBtn({
    label,
    href,
    variant,
    fontFamily,
    fontSize,
    paddingX,
    paddingY,
    letterSpacing,
    waveSpeed,
    waveInterval,
    primaryBg,
    primaryText,
    primaryHoverBg,
    primaryHoverText,
    primaryBorderColor,
    outlineText,
    outlineBorder,
    outlineHoverText,
    outlineHoverBorder,
    outlineHoverBg,
    borderWidth,
    borderRadius,
}: BtnProps) {
    const { slots, scramble, reset } = useWaveScramble(
        label,
        waveSpeed,
        waveInterval
    )
    const [hovered, setHovered] = useState(false)
    const ref = useRef<HTMLAnchorElement>(null)
    const [w, setW] = useState<number | undefined>()
    const toEm = (v: number) => `${(v / 100).toFixed(3)}em`

    useEffect(() => {
        const measure = () => {
            if (ref.current) {
                ref.current.style.width = "auto"
                const measured = ref.current.offsetWidth
                // Only lock width if we got a real measurement.
                // If the font hasn't loaded yet, offsetWidth = 0 — skip it
                // so the button stays "auto" until a valid size is known.
                if (measured > 0) setW(measured)
            }
        }

        // Attempt 1: immediately (works when font is already cached)
        measure()

        // Attempt 2: when ALL document fonts are ready
        if (document.fonts?.ready) {
            document.fonts.ready.then(() => {
                requestAnimationFrame(() => requestAnimationFrame(measure))
            })
        }

        // Attempt 3: when this specific font is loaded
        if (document.fonts?.load) {
            document.fonts
                .load(`${fontSize}px "${fontFamily}"`)
                .then(() => {
                    requestAnimationFrame(() => requestAnimationFrame(measure))
                })
                .catch(() => {})
        }

        // Attempt 4 & 5: hard fallbacks for slow @import stylesheets
        const t1 = setTimeout(measure, 300)
        const t2 = setTimeout(measure, 800)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [label, fontFamily, fontSize, paddingX, paddingY, letterSpacing])

    const isPrimary = variant === "primary"
    const bg = isPrimary
        ? hovered
            ? primaryHoverBg
            : primaryBg
        : hovered
          ? outlineHoverBg
          : "transparent"
    const color = isPrimary
        ? hovered
            ? primaryHoverText
            : primaryText
        : hovered
          ? outlineHoverText
          : outlineText
    const border = isPrimary
        ? `${borderWidth}px solid ${primaryBorderColor}`
        : `${borderWidth}px solid ${hovered ? outlineHoverBorder : outlineBorder}`

    return (
        <a
            ref={ref}
            href={href || "#"}
            style={{
                fontFamily: `'${fontFamily}', sans-serif`,
                fontSize,
                fontWeight: 400,
                letterSpacing: toEm(letterSpacing),
                border,
                borderRadius,
                paddingTop: paddingY,
                paddingBottom: paddingY,
                paddingLeft: paddingX,
                paddingRight: paddingX,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                background: bg,
                color,
                transition:
                    "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
                whiteSpace: "nowrap",
                lineHeight: 1,
                userSelect: "none" as const,
                width: w ?? "auto",
                boxSizing: "border-box" as const,
            }}
            onMouseEnter={() => {
                setHovered(true)
                scramble()
            }}
            onMouseLeave={() => {
                setHovered(false)
                reset()
            }}
        >
            {slots.map((s, i) => (
                <span
                    key={i}
                    style={{
                        opacity: s.opacity,
                        display: "inline-block",
                        minWidth: s.char === " " ? "0.4em" : undefined,
                    }}
                >
                    {s.char}
                </span>
            ))}
        </a>
    )
}

// ─── ScrambleButtons ──────────────────────────────────────────────────────────

interface Props {
    fontName: string
    showPrimaryButton: boolean
    primaryLabel: string
    primaryHref: string
    primaryBg: string
    primaryText: string
    primaryHoverBg: string
    primaryHoverText: string
    primaryBorderColor: string
    showOutlineButton: boolean
    outlineLabel: string
    outlineHref: string
    outlineText: string
    outlineBorder: string
    outlineHoverText: string
    outlineHoverBorder: string
    outlineHoverBg: string
    fontSize: number
    letterSpacing: number
    borderWidth: number
    borderRadius: number
    paddingX: number
    paddingY: number
    mobilePaddingX: number
    mobilePaddingY: number
    waveSpeed: number
    waveInterval: number
    swapButtons: boolean
    gap: number
    direction: "row" | "column"
    alignment: "flex-start" | "center" | "flex-end"
}

export default function ScrambleButtons({
    fontName = "Press Start 2P",
    showPrimaryButton = true,
    primaryLabel = "START A PROJECT",
    primaryHref = "#contact",
    primaryBg = "#FFFFFF",
    primaryText = "#000000",
    primaryHoverBg = "#000000",
    primaryHoverText = "#FFFFFF",
    primaryBorderColor = "#FFFFFF",
    showOutlineButton = true,
    outlineLabel = "SEE SERVICES",
    outlineHref = "#services",
    outlineText = "#FFFFFF",
    outlineBorder = "#FFFFFF",
    outlineHoverText = "#4ADE80",
    outlineHoverBorder = "#4ADE80",
    outlineHoverBg = "transparent",
    fontSize = 12,
    letterSpacing = 10,
    borderWidth = 2,
    borderRadius = 0,
    paddingX = 24,
    paddingY = 14,
    mobilePaddingX = 16,
    mobilePaddingY = 12,
    waveSpeed = 0.25,
    waveInterval = 45,
    swapButtons = false,
    gap = 12,
    direction = "row" as "row" | "column",
    alignment = "center" as "flex-start" | "center" | "flex-end",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(600)

    useEffect(() => {
        const obs = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
        if (containerRef.current) obs.observe(containerRef.current)
        return () => obs.disconnect()
    }, [])

    const isMobile = width < 480
    const pX = isMobile ? mobilePaddingX : paddingX
    const pY = isMobile ? mobilePaddingY : paddingY

    const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontName.trim().replace(/ /g, "+")}:wght@400;700&display=swap`

    const shared = {
        fontFamily: fontName,
        fontSize,
        letterSpacing,
        paddingX: pX,
        paddingY: pY,
        waveSpeed,
        waveInterval,
        primaryBg,
        primaryText,
        primaryHoverBg,
        primaryHoverText,
        primaryBorderColor,
        outlineText,
        outlineBorder,
        outlineHoverText,
        outlineHoverBorder,
        outlineHoverBg,
        borderWidth,
        borderRadius,
    }

    const primaryBtn = showPrimaryButton ? (
        <ScrambleBtn
            key="primary"
            {...shared}
            label={primaryLabel}
            href={primaryHref}
            variant="primary"
        />
    ) : null

    const outlineBtn = showOutlineButton ? (
        <ScrambleBtn
            key="outline"
            {...shared}
            label={outlineLabel}
            href={outlineHref}
            variant="outline"
        />
    ) : null

    const buttons = swapButtons
        ? [outlineBtn, primaryBtn]
        : [primaryBtn, outlineBtn]

    return (
        <>
            <style>{`@import url('${googleFontsUrl}');`}</style>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: direction,
                    alignItems: alignment,
                    justifyContent: alignment,
                    gap,
                    flexWrap: "wrap",
                    boxSizing: "border-box" as const,
                }}
            >
                {buttons}
            </div>
        </>
    )
}

// ─── Property Controls ───────────────────────────────────────────────────────

addPropertyControls(ScrambleButtons, {
    // ╔══════════════════════════════╗
    // ║           FONT               ║
    // ╚══════════════════════════════╝
    fontName: {
        type: ControlType.String,
        title: "Font · Name",
        defaultValue: "Press Start 2P",
        description:
            "Type any Google Font name — e.g. 'Inter', 'Bebas Neue', 'Orbitron', 'Roboto Mono'. Find names at fonts.google.com. Loads automatically.",
    },

    // ╔══════════════════════════════╗
    // ║       PRIMARY BUTTON         ║
    // ╚══════════════════════════════╝
    showPrimaryButton: {
        type: ControlType.Boolean,
        title: "Primary · Show",
        defaultValue: true,
    },
    primaryLabel: {
        type: ControlType.String,
        title: "Primary · Label",
        defaultValue: "START A PROJECT",
    },
    primaryHref: {
        type: ControlType.String,
        title: "Primary · Link",
        defaultValue: "#contact",
        description: "Use #section-id, /page, or a full URL.",
    },
    primaryBg: {
        type: ControlType.Color,
        title: "Primary · Background",
        defaultValue: "#FFFFFF",
    },
    primaryText: {
        type: ControlType.Color,
        title: "Primary · Text Color",
        defaultValue: "#000000",
    },
    primaryHoverBg: {
        type: ControlType.Color,
        title: "Primary · Hover Background",
        defaultValue: "#000000",
    },
    primaryHoverText: {
        type: ControlType.Color,
        title: "Primary · Hover Text",
        defaultValue: "#FFFFFF",
    },
    primaryBorderColor: {
        type: ControlType.Color,
        title: "Primary · Border Color",
        defaultValue: "#FFFFFF",
    },

    // ╔══════════════════════════════╗
    // ║       OUTLINE BUTTON         ║
    // ╚══════════════════════════════╝
    showOutlineButton: {
        type: ControlType.Boolean,
        title: "Outline · Show",
        defaultValue: true,
    },
    outlineLabel: {
        type: ControlType.String,
        title: "Outline · Label",
        defaultValue: "SEE SERVICES",
    },
    outlineHref: {
        type: ControlType.String,
        title: "Outline · Link",
        defaultValue: "#services",
        description: "Use #section-id, /page, or a full URL.",
    },
    outlineText: {
        type: ControlType.Color,
        title: "Outline · Text Color",
        defaultValue: "#FFFFFF",
    },
    outlineBorder: {
        type: ControlType.Color,
        title: "Outline · Border Color",
        defaultValue: "#FFFFFF",
    },
    outlineHoverText: {
        type: ControlType.Color,
        title: "Outline · Hover Text",
        defaultValue: "#4ADE80",
    },
    outlineHoverBorder: {
        type: ControlType.Color,
        title: "Outline · Hover Border",
        defaultValue: "#4ADE80",
    },
    outlineHoverBg: {
        type: ControlType.Color,
        title: "Outline · Hover Background",
        defaultValue: "transparent",
    },

    // ╔══════════════════════════════╗
    // ║        BUTTON STYLE          ║
    // ╚══════════════════════════════╝
    fontSize: {
        type: ControlType.Number,
        title: "Style · Font Size",
        defaultValue: 12,
        min: 8,
        max: 40,
        step: 1,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Style · Letter Spacing",
        defaultValue: 10,
        min: 0,
        max: 60,
        step: 1,
        description: "Value × 0.01 = em. E.g. 10 → 0.1em spacing.",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Style · Border Width (px)",
        defaultValue: 2,
        min: 0,
        max: 8,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Style · Border Radius (px)",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Style · Padding X",
        defaultValue: 24,
        min: 4,
        max: 80,
        step: 2,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Style · Padding Y",
        defaultValue: 14,
        min: 4,
        max: 40,
        step: 2,
    },
    mobilePaddingX: {
        type: ControlType.Number,
        title: "Style · Padding X (Mobile)",
        defaultValue: 16,
        min: 4,
        max: 60,
        step: 2,
    },
    mobilePaddingY: {
        type: ControlType.Number,
        title: "Style · Padding Y (Mobile)",
        defaultValue: 12,
        min: 4,
        max: 30,
        step: 2,
    },

    // ╔══════════════════════════════╗
    // ║         ANIMATION            ║
    // ╚══════════════════════════════╝
    waveSpeed: {
        type: ControlType.Number,
        title: "Animation · Wave Speed",
        defaultValue: 0.25,
        min: 0.05,
        max: 0.8,
        step: 0.05,
        description: "Scramble front speed. Lower = slower, more cinematic.",
    },
    waveInterval: {
        type: ControlType.Number,
        title: "Animation · Interval (ms)",
        defaultValue: 45,
        min: 15,
        max: 120,
        step: 5,
        description: "Milliseconds per animation tick. Higher = slower.",
    },

    // ╔══════════════════════════════╗
    // ║          LAYOUT              ║
    // ╚══════════════════════════════╝
    swapButtons: {
        type: ControlType.Boolean,
        title: "Layout · Swap Order",
        defaultValue: false,
        description: "Flips the position of primary and outline buttons.",
    },
    gap: {
        type: ControlType.Number,
        title: "Layout · Gap Between Buttons",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 2,
    },
    direction: {
        type: ControlType.Enum,
        title: "Layout · Direction",
        options: ["row", "column"],
        optionTitles: ["Side by side →", "Stacked ↓"],
        defaultValue: "row",
    },
    alignment: {
        type: ControlType.Enum,
        title: "Layout · Alignment",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
    },
})
