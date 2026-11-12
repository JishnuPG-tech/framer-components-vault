import { useRef, useCallback, useState, useEffect, type CSSProperties, type ReactNode, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface BorderGlowProps {
    edgeSensitivity?: number
    glowColor?: string
    backgroundColor?: string
    borderRadius?: number
    glowRadius?: number
    glowIntensity?: number
    coneSpread?: number
    animated?: boolean
    colors?: string[]
    fillOpacity?: number
    text?: string
    textFont?: any
    padding?: string
    style?: CSSProperties
}

function parseHSL(hslStr: string): { h: number; s: number; l: number } {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
    if (!match) return { h: 40, s: 80, l: 80 }
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) }
}

function buildBoxShadow(glowColor: string, intensity: number): string {
    const { h, s, l } = parseHSL(glowColor)
    const base = `${h}deg ${s}% ${l}%`
    const layers: [number, number, number, number, number, boolean][] = [
        [0, 0, 0, 1, 100, true],
        [0, 0, 1, 0, 60, true],
        [0, 0, 3, 0, 50, true],
        [0, 0, 6, 0, 40, true],
        [0, 0, 15, 0, 30, true],
        [0, 0, 25, 2, 20, true],
        [0, 0, 50, 2, 10, true],
        [0, 0, 1, 0, 60, false],
        [0, 0, 3, 0, 50, false],
        [0, 0, 6, 0, 40, false],
        [0, 0, 15, 0, 30, false],
        [0, 0, 25, 2, 20, false],
        [0, 0, 50, 2, 10, false],
    ]
    return layers
        .map(([x, y, blur, spread, alpha, inset]) => {
            const a = Math.min(alpha * intensity, 100)
            return `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px hsl(${base} / ${a}%)`
        })
        .join(", ")
}

function easeOutCubic(x: number) {
    return 1 - Math.pow(1 - x, 3)
}
function easeInCubic(x: number) {
    return x * x * x
}

interface AnimateOpts {
    start?: number
    end?: number
    duration?: number
    delay?: number
    ease?: (t: number) => number
    onUpdate: (v: number) => void
    onEnd?: () => void
}

function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }: AnimateOpts) {
    const t0 = performance.now() + delay
    let rafId: number
    function tick() {
        const elapsed = performance.now() - t0
        const t = Math.min(elapsed / duration, 1)
        onUpdate(start + (end - start) * ease(t))
        if (t < 1) {
            rafId = requestAnimationFrame(tick)
        } else if (onEnd) {
            onEnd()
        }
    }
    const timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(tick)
    }, delay)
    
    return () => {
        clearTimeout(timeoutId)
        cancelAnimationFrame(rafId)
    }
}

const GRADIENT_POSITIONS = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"]
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1]

function buildMeshGradients(colors: string[]): string[] {
    if (!colors || colors.length === 0) return []
    const gradients: string[] = []
    for (let i = 0; i < 7; i++) {
        const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)]
        gradients.push(`radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`)
    }
    const baseColor = colors[0] || "#000000"
    gradients.push(`linear-gradient(${baseColor} 0 100%)`)
    return gradients
}

/**
 * Border Glow
 *
 * A card component with an animated glowing border effect that responds to cursor position.
 * The glow effect appears when hovering near the edges of the card.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function BorderGlow(props: BorderGlowProps) {
    const {
        edgeSensitivity = 30,
        glowColor = "40 80 80",
        backgroundColor = "#060010",
        borderRadius = 28,
        glowRadius = 40,
        glowIntensity = 1.0,
        coneSpread = 25,
        animated = false,
        colors = ["#c084fc", "#f472b6", "#38bdf8"],
        fillOpacity = 0.5,
        text = "Hover Me",
        textFont = {
            fontSize: "24px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        padding = "40px 48px",
    } = props

    const cardRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [cursorAngle, setCursorAngle] = useState(45)
    const [edgeProximity, setEdgeProximity] = useState(0)
    const [sweepActive, setSweepActive] = useState(false)

    const getCenterOfElement = useCallback((el: HTMLElement) => {
        const { width, height } = el.getBoundingClientRect()
        return [width / 2, height / 2]
    }, [])

    const getEdgeProximity = useCallback(
        (el: HTMLElement, x: number, y: number) => {
            const [cx, cy] = getCenterOfElement(el)
            const dx = x - cx
            const dy = y - cy
            let kx = Infinity
            let ky = Infinity
            if (dx !== 0) kx = cx / Math.abs(dx)
            if (dy !== 0) ky = cy / Math.abs(dy)
            return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
        },
        [getCenterOfElement]
    )

    const getCursorAngle = useCallback(
        (el: HTMLElement, x: number, y: number) => {
            const [cx, cy] = getCenterOfElement(el)
            const dx = x - cx
            const dy = y - cy
            if (dx === 0 && dy === 0) return 0
            const radians = Math.atan2(dy, dx)
            let degrees = radians * (180 / Math.PI) + 90
            if (degrees < 0) degrees += 360
            return degrees
        },
        [getCenterOfElement]
    )

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const card = cardRef.current
            if (!card) return
            const rect = card.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            startTransition(() => {
                setEdgeProximity(getEdgeProximity(card, x, y))
                setCursorAngle(getCursorAngle(card, x, y))
            })
        },
        [getEdgeProximity, getCursorAngle]
    )

    useEffect(() => {
        if (!animated) return
        const angleStart = 110
        const angleEnd = 465
        startTransition(() => setSweepActive(true))
        startTransition(() => setCursorAngle(angleStart))

        const cancels: (() => void)[] = []

        cancels.push(animateValue({
            duration: 500,
            onUpdate: (v) => startTransition(() => setEdgeProximity(v / 100)),
        }))
        cancels.push(animateValue({
            ease: easeInCubic,
            duration: 1500,
            end: 50,
            onUpdate: (v) =>
                startTransition(() =>
                    setCursorAngle((angleEnd - angleStart) * (v / 100) + angleStart)
                ),
        }))
        cancels.push(animateValue({
            ease: easeOutCubic,
            delay: 1500,
            duration: 2250,
            start: 50,
            end: 100,
            onUpdate: (v) =>
                startTransition(() =>
                    setCursorAngle((angleEnd - angleStart) * (v / 100) + angleStart)
                ),
        }))
        cancels.push(animateValue({
            ease: easeInCubic,
            delay: 2500,
            duration: 1500,
            start: 100,
            end: 0,
            onUpdate: (v) => startTransition(() => setEdgeProximity(v / 100)),
            onEnd: () => startTransition(() => setSweepActive(false)),
        }))

        return () => {
            cancels.forEach(cancel => cancel())
        }
    }, [animated])

    const colorSensitivity = edgeSensitivity + 20
    const isVisible = isHovered || sweepActive
    const borderOpacity = isVisible
        ? Math.max(
              0,
              (edgeProximity * 100 - colorSensitivity) / (100 - colorSensitivity)
          )
        : 0
    const glowOpacity = isVisible
        ? Math.max(
              0,
              (edgeProximity * 100 - edgeSensitivity) / (100 - edgeSensitivity)
          )
        : 0

    const meshGradients = buildMeshGradients(colors)
    const borderBg = meshGradients.map((g) => `${g} border-box`)
    const fillBg = meshGradients.map((g) => `${g} padding-box`)
    const angleDeg = `${cursorAngle.toFixed(3)}deg`

    return (
        <div
            ref={cardRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => startTransition(() => setIsHovered(true))}
            onPointerLeave={() => startTransition(() => setIsHovered(false))}
            style={{
                position: "relative",
                display: "flex",
                isolation: "isolate",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: backgroundColor,
                borderRadius: `${borderRadius}px`,
                transform: "translate3d(0, 0, 0.01px)",
                boxShadow:
                    "rgba(0,0,0,0.1) 0 1px 2px, rgba(0,0,0,0.1) 0 2px 4px, rgba(0,0,0,0.1) 0 4px 8px, rgba(0,0,0,0.1) 0 8px 16px, rgba(0,0,0,0.1) 0 16px 32px, rgba(0,0,0,0.1) 0 32px 64px",
            }}
        >
            {/* mesh gradient border */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    zIndex: -1,
                    border: "1px solid transparent",
                    background: [
                        `linear-gradient(${backgroundColor} 0 100%) padding-box`,
                        "linear-gradient(rgb(255 255 255 / 0%) 0% 100%) border-box",
                        ...borderBg,
                    ].join(", "),
                    opacity: borderOpacity,
                    maskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
                    WebkitMaskImage: `conic-gradient(from ${angleDeg} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
                    transition: isVisible
                        ? "opacity 0.25s ease-out"
                        : "opacity 0.75s ease-in-out",
                }}
            />

            {/* mesh gradient fill near edges */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    zIndex: -1,
                    border: "1px solid transparent",
                    background: fillBg.join(", "),
                    maskImage: [
                        "linear-gradient(to bottom, black, black)",
                        "radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)",
                        "radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)",
                        "radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)",
                        "radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%)",
                        "radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%)",
                        `conic-gradient(from ${angleDeg} at center, transparent 5%, black 15%, black 85%, transparent 95%)`,
                    ].join(", "),
                    WebkitMaskImage: [
                        "linear-gradient(to bottom, black, black)",
                        "radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)",
                        "radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)",
                        "radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)",
                        "radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%)",
                        "radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%)",
                        `conic-gradient(from ${angleDeg} at center, transparent 5%, black 15%, black 85%, transparent 95%)`,
                    ].join(", "),
                    maskComposite: "subtract, add, add, add, add, add",
                    WebkitMaskComposite: "source-out, source-over, source-over, source-over, source-over, source-over",
                    opacity: borderOpacity * fillOpacity,
                    mixBlendMode: "soft-light",
                    transition: isVisible
                        ? "opacity 0.25s ease-out"
                        : "opacity 0.75s ease-in-out",
                } as CSSProperties}
            />

            {/* outer glow */}
            <span
                style={{
                    position: "absolute",
                    pointerEvents: "none",
                    zIndex: 1,
                    borderRadius: "inherit",
                    inset: `${-glowRadius}px`,
                    maskImage: `conic-gradient(from ${angleDeg} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
                    WebkitMaskImage: `conic-gradient(from ${angleDeg} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
                    opacity: glowOpacity,
                    mixBlendMode: "plus-lighter",
                    transition: isVisible
                        ? "opacity 0.25s ease-out"
                        : "opacity 0.75s ease-in-out",
                } as CSSProperties}
            >
                <span
                    style={{
                        position: "absolute",
                        borderRadius: "inherit",
                        inset: `${glowRadius}px`,
                        boxShadow: buildBoxShadow(glowColor, glowIntensity),
                    }}
                />
            </span>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "auto",
                    zIndex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding,
                    width: "max-content",
                    height: "max-content",
                }}
            >
                <span
                    style={{
                        fontSize: textFont?.fontSize,
                        fontWeight: textFont?.fontWeight,
                        fontFamily: textFont?.fontFamily,
                        fontStyle: textFont?.fontStyle,
                        letterSpacing: textFont?.letterSpacing,
                        lineHeight: textFont?.lineHeight,
                        textAlign: "center",
                        color: "white",
                        whiteSpace: "nowrap",
                    }}
                >
                    {text}
                </span>
            </div>
        </div>
    )
}

addPropertyControls(BorderGlow, {
    edgeSensitivity: {
        type: ControlType.Number,
        title: "Edge Sensitivity",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 1,
    },
    glowColor: {
        type: ControlType.String,
        title: "Glow Color",
        defaultValue: "40 80 80",
        placeholder: "HSL values e.g. 40 80 80",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#060010",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 28,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    glowRadius: {
        type: ControlType.Number,
        title: "Glow Radius",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 1.0,
        min: 0,
        max: 3,
        step: 0.1,
    },
    coneSpread: {
        type: ControlType.Number,
        title: "Cone Spread",
        defaultValue: 25,
        min: 0,
        max: 50,
        step: 1,
    },
    animated: {
        type: ControlType.Boolean,
        title: "Animated",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    colors: {
        type: ControlType.Array,
        title: "Gradient Colors",
        control: {
            type: ControlType.Color,
        },
        defaultValue: ["#c084fc", "#f472b6", "#38bdf8"],
        maxCount: 5,
    },
    fillOpacity: {
        type: ControlType.Number,
        title: "Fill Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover Me",
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "40px 48px",
    },
})
