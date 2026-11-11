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
    useMotionValue,
    useMotionTemplate,
    useSpring,
    animate,
} from "framer-motion"

interface MyComponentProps {
    style?: React.CSSProperties
    patternStyle?: "dots" | "grid" | "crosses" | string
    dotRadius?: number
    fadeAmount?: number
    dotSize?: number
    spacing?: number
    dotColor?: string
    glowColor?: string
    glowRadius?: number
    rippleRadius?: number
    backgroundColor?: string
    pattern?: string
    cornerRadius?: number
    fadeEdges?: number
    thickness?: number
    baseColor?: string
    background?: string
}

interface Ripple {
    id: number
    x: number
    y: number
}

function getSvgPattern(
    pattern: string,
    spacing: number,
    size: number,
    color: string,
    radiusPx: number
) {
    const safeSpacing = Math.max(1, spacing)
    const safeSize = Math.max(0, size)
    const c = safeSpacing / 2
    const safeColor = color || "#000000"
    let inner = ""

    if (pattern === "dots") {
        const rx = Math.max(0, Math.min(radiusPx, safeSize / 2))
        inner = `<rect x="${c - safeSize / 2}" y="${c - safeSize / 2}" width="${safeSize}" height="${safeSize}" rx="${rx}" fill="${safeColor}" />`
    } else if (pattern === "grid") {
        inner = `<path d="M ${safeSpacing} 0 L 0 0 L 0 ${safeSpacing}" fill="none" stroke="${safeColor}" stroke-width="${size}" />`
    } else if (pattern === "crosses") {
        const r = safeSpacing * 0.25
        inner = `<path d="M ${c - r} ${c} L ${c + r} ${c} M ${c} ${c - r} L ${c} ${c + r}" fill="none" stroke="${safeColor}" stroke-width="${size}" stroke-linecap="round" />`
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${safeSpacing}" height="${safeSpacing}" viewBox="0 0 ${safeSpacing} ${safeSpacing}">${inner}</svg>`
    const encodedSvg = encodeURIComponent(svg)
    return `url("data:image/svg+xml;utf8,${encodedSvg}")`
}

function RippleMask({
    x,
    y,
    bgImage,
    bgSize,
    rippleRadius,
    onComplete,
    isStatic,
}: {
    x: number
    y: number
    bgImage: string
    bgSize: string
    rippleRadius: number
    onComplete: () => void
    isStatic: boolean
}) {
    const ringScale = useMotionValue(0)
    const opacity = useMotionValue(1)

    React.useEffect(() => {
        if (isStatic) return

        const rAnim = animate(ringScale, rippleRadius, {
            duration: 0.7,
            ease: "easeOut",
        })
        const oAnim = animate(opacity, 0, {
            duration: 0.7,
            ease: "easeOut",
            onComplete,
        })
        return () => {
            rAnim.stop()
            oAnim.stop()
        }
    }, [rippleRadius, onComplete, isStatic])

    const mask = useMotionTemplate`radial-gradient(${ringScale}px circle at ${x}px ${y}px, transparent calc(100% - 40px), black calc(100% - 10px), transparent 100%)`

    return (
        <motion.div
            style={{
                position: "absolute",
                inset: 0,
                backgroundImage: bgImage,
                backgroundSize: bgSize,
                backgroundPosition: "center",
                opacity: opacity,
                WebkitMaskImage: mask,
                maskImage: mask,
                pointerEvents: "none",
            }}
        />
    )
}

/**
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 1000
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
function NovaPixels(props: MyComponentProps) {
    const isStatic = useIsStaticRenderer()
    const {
        dotRadius = 100,
        fadeAmount = 100,
        dotSize = 2,
        spacing = 24,
        dotColor = "#404040",
        glowColor = "#00E5FF",
        glowRadius = 160,
        rippleRadius = 400,
        backgroundColor = "#000000",
        pattern,
        cornerRadius,
        fadeEdges,
        thickness,
        baseColor,
        background,
    } = props

    const normalizedPattern = React.useMemo(() => {
        const raw = (props.patternStyle ?? pattern ?? "dots")
            .toString()
            .trim()
            .toLowerCase()
        if (raw === "dot" || raw === "dots") return "dots"
        if (raw === "grid") return "grid"
        if (raw === "cross" || raw === "crosses") return "crosses"
        return "dots"
    }, [props.patternStyle, pattern])
    const resolvedDotRadius = cornerRadius ?? dotRadius
    const resolvedFadeAmount = fadeEdges ?? fadeAmount
    const resolvedDotSize = thickness ?? dotSize
    const resolvedDotColor = baseColor ?? dotColor
    const resolvedBackgroundColor = background ?? backgroundColor

    const pointerX = useMotionValue(500)
    const pointerY = useMotionValue(500)
    const isHovered = useMotionValue(isStatic ? 1 : 0)

    const [ripples, setRipples] = React.useState<Ripple[]>([])

    const springConfig = { damping: 30, stiffness: 200, mass: 0.5 }
    const smoothX = useSpring(pointerX, springConfig)
    const smoothY = useSpring(pointerY, springConfig)
    const smoothOpacity = useSpring(isHovered, { damping: 20, stiffness: 150 })

    const glowRadiusMotion = useMotionValue(glowRadius)
    React.useEffect(() => {
        glowRadiusMotion.set(glowRadius)
    }, [glowRadius, glowRadiusMotion])

    React.useEffect(() => {
        isHovered.set(isStatic ? 1 : 0)
    }, [isStatic, isHovered])

    const handlePointerMove = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            const { left, top } = e.currentTarget.getBoundingClientRect()
            pointerX.set(e.clientX - left)
            pointerY.set(e.clientY - top)
        },
        [isStatic, pointerX, pointerY]
    )

    const handlePointerDown = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            const { left, top } = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - left
            const y = e.clientY - top
            React.startTransition(() => {
                setRipples((current) => [
                    ...current,
                    { id: Date.now() + Math.random(), x, y },
                ])
            })
        },
        [isStatic]
    )

    const bgPatternNormal = React.useMemo(
        () =>
            getSvgPattern(
                normalizedPattern,
                spacing,
                resolvedDotSize,
                resolvedDotColor,
                resolvedDotRadius
            ),
        [
            normalizedPattern,
            spacing,
            resolvedDotSize,
            resolvedDotColor,
            resolvedDotRadius,
        ]
    )
    const bgPatternGlow = React.useMemo(
        () =>
            getSvgPattern(
                normalizedPattern,
                spacing,
                resolvedDotSize,
                glowColor,
                resolvedDotRadius
            ),
        [
            normalizedPattern,
            spacing,
            resolvedDotSize,
            glowColor,
            resolvedDotRadius,
        ]
    )
    const bgSize = React.useMemo(() => `${spacing}px ${spacing}px`, [spacing])

    const clampedFade = Math.max(0, Math.min(100, resolvedFadeAmount))
    const safeCenterStop = Math.max(30, 100 - clampedFade * 0.7)
    const containerMask = React.useMemo(
        () =>
            clampedFade > 0
                ? `radial-gradient(ellipse at center, black ${safeCenterStop}%, transparent 100%)`
                : "none",
        [clampedFade, safeCenterStop]
    )

    const interactiveHoverMask = useMotionTemplate`radial-gradient(${glowRadiusMotion}px circle at ${smoothX}px ${smoothY}px, black 0%, transparent 100%)`
    const staticHoverMask = React.useMemo(
        () =>
            `radial-gradient(${glowRadius}px circle at 50% 50%, black 0%, transparent 100%)`,
        [glowRadius]
    )
    const hoverMask = isStatic ? staticHoverMask : interactiveHoverMask

    return (
        <div
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: resolvedBackgroundColor,
                WebkitMaskImage: containerMask,
                maskImage: containerMask,
            }}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => !isStatic && isHovered.set(1)}
            onPointerLeave={() => !isStatic && isHovered.set(0)}
            onPointerDown={handlePointerDown}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: bgPatternNormal,
                    backgroundSize: bgSize,
                    backgroundPosition: "center",
                }}
            />

            {!isStatic &&
                ripples.map((r) => (
                    <RippleMask
                        key={r.id}
                        x={r.x}
                        y={r.y}
                        bgImage={bgPatternGlow}
                        bgSize={bgSize}
                        rippleRadius={rippleRadius}
                        isStatic={isStatic}
                        onComplete={() =>
                            React.startTransition(() => {
                                setRipples((current) =>
                                    current.filter((item) => item.id !== r.id)
                                )
                            })
                        }
                    />
                ))}

            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: bgPatternGlow,
                    backgroundSize: bgSize,
                    backgroundPosition: "center",
                    opacity: isStatic ? 1 : smoothOpacity,
                    WebkitMaskImage: hoverMask,
                    maskImage: hoverMask,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

NovaPixels.displayName = "Nova Pixels"

addPropertyControls(NovaPixels, {
    patternStyle: {
        type: ControlType.Enum,
        title: "Pattern",
        options: ["dots", "grid", "crosses"],
        optionTitles: ["Dots", "Grid", "Crosses"],
        defaultValue: "dots",
    },
    dotRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 100,
        min: 0,
        max: 100,
        unit: "px",
        displayStepper: false,
        step: 5,
        hidden(props) {
            return props.patternStyle !== "dots"
        },
    },
    fadeAmount: {
        type: ControlType.Number,
        title: "Fade Edges",
        defaultValue: 100,
        min: 0,
        max: 100,
        displayStepper: false,
        step: 5,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 24,
        min: 4,
        max: 100,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#404040",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#00E5FF",
    },
    glowRadius: {
        type: ControlType.Number,
        title: "Glow Radius",
        defaultValue: 160,
        min: 50,
        max: 800,
        step: 10,
    },
    rippleRadius: {
        type: ControlType.Number,
        title: "Ripple Radius",
        defaultValue: 400,
        min: 100,
        max: 1000,
        step: 10,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description:
            "Crafted by [Shouvik Biswas](https://dub.sh/framer-components)",
        defaultValue: "#000000",
    },
})

export default NovaPixels
