// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react"

/**
 * CursorReveal
 * A line of text that sits dim until the cursor passes over it, revealing a
 * bright, glowing copy through a soft radial mask that follows the pointer.
 *
 * The glow is applied as a drop-shadow on an unmasked wrapper (not a
 * text-shadow on the masked layer) so it blooms past the glyph bounds instead
 * of being clipped to the font's bounding box.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

interface CursorRevealProps {
    text: string
    fontFamily: string
    fontWeight: number
    fontSize: number
    letterSpacing: number
    dim: string
    bright: string
    radius: number
    follow: number
    glow: boolean
    glowStrength: number
}

export default function CursorReveal(props: CursorRevealProps) {
    const {
        text = "Hover to reveal",
        fontFamily = "inherit",
        fontWeight = 600,
        fontSize = 28,
        letterSpacing = 0,
        dim = "#5a6b82",
        bright = "#eef3fb",
        radius = 90,
        follow = 0.2,
        glow = true,
        glowStrength = 1,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLSpanElement | null>(null)
    const frameRef = useRef<number>(0)
    const currentRef = useRef({ x: 0, y: 0, initialized: false })
    const targetRef = useRef({ x: 0, y: 0 })

    const applyVars = useCallback((x: number, y: number, r: number) => {
        const node = containerRef.current
        if (!node) return
        node.style.setProperty("--x", `${x}px`)
        node.style.setProperty("--y", `${y}px`)
        node.style.setProperty("--r", `${r}px`)
    }, [])

    useEffect(() => {
        const node = containerRef.current
        if (!node || isStatic) return

        applyVars(0, 0, 0)

        const onPointerEnter = (e: PointerEvent) => {
            const rect = node.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            targetRef.current.x = x
            targetRef.current.y = y
            currentRef.current.x = x
            currentRef.current.y = y
            currentRef.current.initialized = true
            applyVars(x, y, radius)
        }

        const onPointerMove = (e: PointerEvent) => {
            const rect = node.getBoundingClientRect()
            targetRef.current.x = e.clientX - rect.left
            targetRef.current.y = e.clientY - rect.top
        }

        const onPointerLeave = () => {
            node.style.setProperty("--r", "0px")
        }

        const tick = () => {
            const c = currentRef.current
            const t = targetRef.current
            if (c.initialized) {
                c.x += (t.x - c.x) * follow
                c.y += (t.y - c.y) * follow
                node.style.setProperty("--x", `${c.x}px`)
                node.style.setProperty("--y", `${c.y}px`)
            }
            frameRef.current = requestAnimationFrame(tick)
        }

        node.addEventListener("pointerenter", onPointerEnter)
        node.addEventListener("pointermove", onPointerMove)
        node.addEventListener("pointerleave", onPointerLeave)
        frameRef.current = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(frameRef.current)
            node.removeEventListener("pointerenter", onPointerEnter)
            node.removeEventListener("pointermove", onPointerMove)
            node.removeEventListener("pointerleave", onPointerLeave)
        }
    }, [applyVars, follow, isStatic, radius])

    const textStyle = useMemo<CSSProperties>(
        () => ({
            fontFamily,
            fontWeight,
            fontSize: `${fontSize}px`,
            letterSpacing: `${letterSpacing}px`,
            lineHeight: 1.1,
            whiteSpace: "pre" as const,
            display: "inline-block",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            textRendering: "optimizeLegibility",
        }),
        [fontFamily, fontSize, fontWeight, letterSpacing]
    )

    const glowFilter = useMemo(() => {
        if (!glow) return undefined
        const near = Math.round(10 * glowStrength)
        const far = Math.round(24 * glowStrength)
        return `drop-shadow(0 0 ${near}px ${bright}) drop-shadow(0 0 ${far}px ${bright})`
    }, [glow, glowStrength, bright])

    return (
        <span
            ref={containerRef}
            style={
                {
                    display: "inline-block",
                    position: "relative",
                    width: "fit-content",
                    "--x": "50%",
                    "--y": "50%",
                    "--r": "0px",
                } as any
            }
        >
            <span style={{ ...textStyle, color: dim }}>{text}</span>
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    // Glow lives on the unmasked wrapper as a drop-shadow so it is
                    // generated from the already-revealed text and paints outside
                    // the box — a text-shadow on the masked layer would be clipped
                    // to the font's bounding box.
                    filter: glowFilter,
                }}
            >
                <span
                    style={{
                        ...textStyle,
                        color: bright,
                        maskImage:
                            "radial-gradient(circle var(--r) at var(--x) var(--y), #000 0%, #000 22%, transparent 68%)",
                        WebkitMaskImage:
                            "radial-gradient(circle var(--r) at var(--x) var(--y), #000 0%, #000 22%, transparent 68%)",
                    }}
                >
                    {text}
                </span>
            </span>
        </span>
    )
}

addPropertyControls(CursorReveal, {
    text: {
        type: ControlType.String,
        defaultValue: "Hover to reveal",
    },
    fontFamily: {
        type: ControlType.String,
        defaultValue: "inherit",
    },
    fontWeight: {
        type: ControlType.Number,
        defaultValue: 600,
        min: 100,
        max: 900,
        step: 100,
    },
    fontSize: {
        type: ControlType.Number,
        defaultValue: 28,
        min: 8,
        max: 400,
        unit: "px",
        step: 1,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: 0,
        min: -20,
        max: 40,
        unit: "px",
        step: 0.5,
    },
    dim: {
        type: ControlType.Color,
        defaultValue: "#5a6b82",
    },
    bright: {
        type: ControlType.Color,
        defaultValue: "#eef3fb",
    },
    radius: {
        type: ControlType.Number,
        title: "Reveal Size",
        defaultValue: 90,
        min: 0,
        max: 400,
        unit: "px",
        step: 1,
    },
    follow: {
        type: ControlType.Number,
        title: "Follow",
        defaultValue: 0.2,
        min: 0.02,
        max: 1,
        step: 0.01,
    },
    glow: {
        type: ControlType.Boolean,
        defaultValue: true,
    },
    glowStrength: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
        hidden: (props: CursorRevealProps) => !props.glow,
    },
})
