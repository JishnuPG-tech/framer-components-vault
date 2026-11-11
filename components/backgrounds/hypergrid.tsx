import React, {
    useRef,
    useMemo,
    useEffect,
    useState,
    useLayoutEffect,
} from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    MotionValue,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * HYPERGRID AUTO-FILL v6.0
 */

type GridShape = "square" | "circle" | "cube" | "cross" | "dot"
type InteractionMode = "lift" | "repel" | "attract" | "vortex" | "rotate"

export interface HyperGridProps {
    gap: number
    cellSize: number
    gridScale: number
    shape: GridShape
    primaryColor: string
    secondaryColor: string
    containerBackground: string
    interactionMode: InteractionMode
    sensitivity: number
    depth: number
    rotationIntensity: number
    glowIntensity: number
    glowColor: string
    itemIdleOpacity: number
    itemActiveOpacity: number
    borderWidth: number
    borderRadius: number
    perspective: number
    damping: number
    stiffness: number
    mouseSmoothing: number
    maskFade: number
    autoRotateSpeed: number
    className?: string
    width?: number | string
    height?: number | string
    style?: React.CSSProperties
}

const GridItem: React.FC<{
    itemX: number
    itemY: number
    mouseX: MotionValue<number>
    mouseY: MotionValue<number>
    cellSize: number
    shape: GridShape
    primaryColor: string
    secondaryColor: string
    interactionMode: InteractionMode
    sensitivity: number
    depth: number
    rotationIntensity: number
    glowIntensity: number
    glowColor: string
    idleOpacity: number
    activeOpacity: number
    borderWidth: number
    borderRadius: number
    damping: number
    stiffness: number
}> = ({
    itemX,
    itemY,
    mouseX,
    mouseY,
    cellSize,
    shape,
    primaryColor,
    secondaryColor,
    interactionMode,
    sensitivity,
    depth,
    rotationIntensity,
    glowIntensity,
    glowColor,
    idleOpacity,
    activeOpacity,
    borderWidth,
    borderRadius,
    damping,
    stiffness,
}) => {
    const distance = useTransform([mouseX, mouseY], ([lx, ly]: any) => {
        const dx = lx - itemX
        const dy = ly - itemY
        return Math.sqrt(dx * dx + dy * dy)
    })

    const influenceRange = 600 * sensitivity
    const influence = useTransform(distance, [0, influenceRange], [1, 0], {
        clamp: true,
    })
    const springConfig = { damping, stiffness }

    const baseZ = useTransform(influence, (v) =>
        interactionMode === "lift" ? v * depth : 0
    )
    const z = useSpring(baseZ, springConfig)

    const rotateX = useSpring(
        useTransform(
            [mouseY, influence],
            ([my, inf]: any) =>
                (my - itemY) * 0.15 * inf * (rotationIntensity / 45)
        ),
        springConfig
    )
    const rotateY = useSpring(
        useTransform(
            [mouseX, influence],
            ([mx, inf]: any) =>
                (itemX - mx) * 0.15 * inf * (rotationIntensity / 45)
        ),
        springConfig
    )

    const shiftX = useSpring(
        useTransform([mouseX, mouseY, influence], ([mx, my, inf]: any) => {
            if (interactionMode === "repel") return (itemX - mx) * inf * 0.8
            if (interactionMode === "attract") return (mx - itemX) * inf * 0.8
            if (interactionMode === "vortex") return (itemY - my) * inf * 0.8
            return 0
        }),
        springConfig
    )

    const shiftY = useSpring(
        useTransform([mouseX, mouseY, influence], ([mx, my, inf]: any) => {
            if (interactionMode === "repel") return (itemY - my) * inf * 0.8
            if (interactionMode === "attract") return (my - itemY) * inf * 0.8
            if (interactionMode === "vortex") return (mx - itemX) * inf * 0.8
            return 0
        }),
        springConfig
    )

    const scale = useSpring(
        useTransform(influence, [0, 1], [1, 1.45]),
        springConfig
    )
    const opacity = useTransform(
        influence,
        [0, 1],
        [idleOpacity, activeOpacity]
    )
    const colorMix = useTransform(
        influence,
        [0, 1],
        [primaryColor, secondaryColor]
    )

    const renderShape = () => {
        const style: React.CSSProperties = {
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            borderRadius: shape === "circle" ? "50%" : borderRadius,
            boxShadow:
                glowIntensity > 0
                    ? `0 0 ${35 * glowIntensity}px ${glowColor}`
                    : "none",
            border:
                shape === "dot"
                    ? "none"
                    : `${borderWidth}px solid currentColor`,
            background: "rgba(255,255,255,0.01)",
            willChange: "transform, opacity, color",
        }

        switch (shape) {
            case "cross":
                return (
                    <div
                        style={{
                            ...style,
                            border: "none",
                            background: "none",
                            boxShadow: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: `${borderWidth}px`,
                                background: "currentColor",
                                borderRadius: "100px",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                height: "100%",
                                width: `${borderWidth}px`,
                                background: "currentColor",
                                borderRadius: "100px",
                            }}
                        />
                    </div>
                )
            case "dot":
                return (
                    <div
                        style={{
                            width: "35%",
                            height: "35%",
                            margin: "auto",
                            borderRadius: "50%",
                            background: "currentColor",
                        }}
                    />
                )
            case "cube":
                return (
                    <div
                        style={{
                            ...style,
                            transformStyle: "preserve-3d",
                            background: "none",
                            border: "none",
                            boxShadow: "none",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                border: `${borderWidth}px solid currentColor`,
                                background: "rgba(255,255,255,0.05)",
                                transform: "translateZ(10px)",
                                borderRadius: borderRadius,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                border: `${borderWidth}px solid currentColor`,
                                background: "rgba(255,255,255,0.02)",
                                transform: "rotateY(90deg) translateZ(10px)",
                                borderRadius: borderRadius,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                border: `${borderWidth}px solid currentColor`,
                                background: "rgba(255,255,255,0.02)",
                                transform: "rotateX(90deg) translateZ(10px)",
                                borderRadius: borderRadius,
                            }}
                        />
                    </div>
                )
            default:
                return <div style={style} />
        }
    }

    return (
        <motion.div
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: cellSize,
                height: cellSize,
                x: itemX,
                y: itemY,
                translateX: shiftX,
                translateY: shiftY,
                translateZ: z,
                rotateX,
                rotateY,
                scale,
                opacity,
                color: colorMix as any,
                pointerEvents: "none",
                transformStyle: "preserve-3d",
            }}
        >
            {renderShape()}
        </motion.div>
    )
}

export default function HyperGrid(props: HyperGridProps) {
    const {
        gap,
        cellSize,
        gridScale,
        shape,
        primaryColor,
        secondaryColor,
        containerBackground,
        interactionMode,
        sensitivity,
        depth,
        rotationIntensity,
        glowIntensity,
        glowColor,
        itemIdleOpacity,
        itemActiveOpacity,
        borderWidth,
        borderRadius,
        perspective,
        damping,
        stiffness,
        mouseSmoothing,
        maskFade,
        autoRotateSpeed,
        className,
        width,
        height,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    // Extract a safe fallback baseline if Framer passes dynamic string values
    const fallbackW = typeof width === "number" ? width : 800
    const fallbackH = typeof height === "number" ? height : 600

    const [containerSize, setContainerSize] = useState({
        width: fallbackW,
        height: fallbackH,
    })

    const isVisibleRef = useRef(false)
    const rafRef = useRef<number | null>(null)
    const listenerRef = useRef<((e: MouseEvent) => void) | null>(null)

    const gridLayout = useMemo(() => {
        const w = containerSize.width
        const h = containerSize.height
        if (w === 0 || h === 0) return { items: [], rows: 0, cols: 0 }

        const step = cellSize + gap
        const cols = Math.ceil(w / step) + 4
        const rows = Math.ceil(h / step) + 4

        const items = []
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                items.push({
                    id: `${r}-${c}`,
                    x: (c - (cols - 1) / 2) * step,
                    y: (r - (rows - 1) / 2) * step,
                })
            }
        }
        return { items, rows, cols }
    }, [containerSize, cellSize, gap])

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const smoothMouseX = useSpring(mouseX, {
        damping: 40 + (100 - mouseSmoothing),
        stiffness: 100 + mouseSmoothing * 2,
    })
    const smoothMouseY = useSpring(mouseY, {
        damping: 40 + (100 - mouseSmoothing),
        stiffness: 100 + mouseSmoothing * 2,
    })
    const [time, setTime] = useState(0)

    useLayoutEffect(() => {
        const el = containerRef.current

        // Failsafe: Ensure we don't adopt a 0x0 size from a collapsed "Fit" container
        const w = el && el.offsetWidth > 0 ? el.offsetWidth : fallbackW
        const h = el && el.offsetHeight > 0 ? el.offsetHeight : fallbackH
        setContainerSize({ width: w, height: h })

        if (!el) return
        const observer = new ResizeObserver(() => {
            const rw = el.offsetWidth
            const rh = el.offsetHeight

            // Only update state if the dimensions are valid to prevent wiping out the grid
            if (rw > 0 && rh > 0) {
                setContainerSize({ width: rw, height: rh })
            }
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [width, height, fallbackW, fallbackH])

    useEffect(() => {
        if (isStatic) return

        const container = containerRef.current
        if (!container) return

        const startLoop = () => {
            if (!listenerRef.current) {
                listenerRef.current = (e: MouseEvent) => {
                    if (!containerRef.current) return
                    const rect = containerRef.current.getBoundingClientRect()
                    mouseX.set(e.clientX - rect.left - rect.width / 2)
                    mouseY.set(e.clientY - rect.top - rect.height / 2)
                }
                window.addEventListener("mousemove", listenerRef.current)
            }

            if (autoRotateSpeed > 0 && rafRef.current === null) {
                const loop = (t: number) => {
                    setTime(t * 0.001 * autoRotateSpeed)
                    rafRef.current = requestAnimationFrame(loop)
                }
                rafRef.current = requestAnimationFrame(loop)
            }
        }

        const stopLoop = () => {
            if (listenerRef.current) {
                window.removeEventListener("mousemove", listenerRef.current)
                listenerRef.current = null
            }
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
                if (entry.isIntersecting) {
                    startLoop()
                } else {
                    stopLoop()
                }
            },
            { threshold: 0 }
        )

        observer.observe(container)
        startLoop()

        return () => {
            observer.disconnect()
            stopLoop()
        }
    }, [isStatic, autoRotateSpeed, mouseX, mouseY])

    const maskStyle: React.CSSProperties =
        maskFade > 0
            ? {
                  WebkitMaskImage: `radial-gradient(circle, black ${100 - maskFade}%, transparent 100%)`,
                  maskImage: `radial-gradient(circle, black ${100 - maskFade}%, transparent 100%)`,
              }
            : {}

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: width ?? "100%",
                height: height ?? "100%",
                minWidth: 800,
                minHeight: 600,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: perspective,
                background: containerBackground,
                touchAction: "none",
                ...maskStyle,
                ...style,
            }}
        >
            <motion.div
                style={{
                    transformStyle: "preserve-3d",
                    position: "relative",
                    scale: gridScale,
                    rotateY: isStatic ? 0 : time * 10,
                    rotateX: isStatic ? 0 : Math.sin(time) * 5,
                }}
            >
                {gridLayout.items.map((item) => (
                    <GridItem
                        key={item.id}
                        itemX={item.x}
                        itemY={item.y}
                        mouseX={smoothMouseX}
                        mouseY={smoothMouseY}
                        cellSize={cellSize}
                        shape={shape}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                        interactionMode={interactionMode}
                        sensitivity={sensitivity}
                        depth={depth}
                        rotationIntensity={rotationIntensity}
                        glowIntensity={glowIntensity}
                        glowColor={glowColor}
                        idleOpacity={itemIdleOpacity}
                        activeOpacity={itemActiveOpacity}
                        borderWidth={borderWidth}
                        borderRadius={borderRadius}
                        damping={damping}
                        stiffness={stiffness}
                    />
                ))}
            </motion.div>
        </div>
    )
}

HyperGrid.defaultProps = {
    width: "100%",
    height: "100%",
    gap: 61,
    cellSize: 19,
    gridScale: 1,
    shape: "circle",
    primaryColor: "#424242",
    secondaryColor: "#68E34F",
    containerBackground: "transparent",
    interactionMode: "lift",
    sensitivity: 0.39,
    depth: 1641,
    rotationIntensity: 66,
    glowIntensity: 0.25,
    glowColor: "#90EB8C",
    itemIdleOpacity: 0.04,
    itemActiveOpacity: 1,
    borderWidth: 1.5,
    borderRadius: 1,
    perspective: 5000,
    damping: 30,
    stiffness: 150,
    mouseSmoothing: 100,
    maskFade: 0,
    autoRotateSpeed: 0,
}

addPropertyControls(HyperGrid, {
    cellSize: {
        type: ControlType.Number,
        min: 2,
        max: 500,
        title: "Cell Size",
        defaultValue: 19,
        description: "The width and height of each individual grid item.",
    },
    gap: {
        type: ControlType.Number,
        min: 0,
        max: 200,
        title: "Gap",
        defaultValue: 61,
        description: "The spacing between each grid item.",
    },
    gridScale: {
        type: ControlType.Number,
        min: 0.1,
        max: 5,
        step: 0.1,
        title: "Master Scale",
        defaultValue: 1,
        description: "Scales the entire grid container up or down.",
    },
    interactionMode: {
        type: ControlType.Enum,
        options: ["lift", "repel", "attract", "vortex", "rotate"],
        optionTitles: ["Lift", "Push", "Pull", "Vortex", "Tilt Only"],
        title: "Physics",
        defaultValue: "lift",
        description: "How the grid items react to the mouse cursor.",
    },
    sensitivity: {
        type: ControlType.Number,
        min: 0,
        max: 2,
        step: 0.01,
        title: "Radius",
        defaultValue: 0.39,
        description: "The size of the influence radius around the cursor.",
    },
    depth: {
        type: ControlType.Number,
        min: 0,
        max: 3000,
        title: "Depth",
        defaultValue: 1641,
        description: "How far the items move along the Z-axis when hovered.",
    },
    rotationIntensity: {
        type: ControlType.Number,
        min: 0,
        max: 720,
        title: "Rotation",
        defaultValue: 66,
        description: "How much the items tilt towards or away from the cursor.",
    },
    mouseSmoothing: {
        type: ControlType.Number,
        min: 0,
        max: 100,
        title: "Smoothing",
        defaultValue: 100,
        description:
            "Adds friction and spring smoothing to the mouse tracking.",
    },
    shape: {
        type: ControlType.Enum,
        options: ["square", "circle", "cube", "cross", "dot"],
        title: "Shape",
        defaultValue: "circle",
        description: "The geometric shape of the individual grid items.",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Idle Color",
        defaultValue: "#424242",
        description:
            "The default color of items when not being interacted with.",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#68E34F",
        description: "The color the items transition to when hovered.",
    },
    itemIdleOpacity: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.01,
        title: "Idle Opacity",
        defaultValue: 0.04,
        description: "The base opacity of items when the cursor is far away.",
    },
    itemActiveOpacity: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.01,
        title: "Active Opacity",
        defaultValue: 1,
        description:
            "The opacity of items when directly hovered by the cursor.",
    },
    borderWidth: {
        type: ControlType.Number,
        min: 0,
        max: 20,
        step: 0.5,
        title: "Border",
        defaultValue: 1.5,
        description: "The thickness of the shape's stroke or border.",
    },
    borderRadius: {
        type: ControlType.Number,
        min: 0,
        max: 100,
        title: "Corners",
        defaultValue: 1,
        description: "The roundness of the shape's corners (if applicable).",
    },
    maskFade: {
        type: ControlType.Number,
        min: 0,
        max: 100,
        title: "Edge Mask",
        defaultValue: 0,
        description:
            "Creates a radial gradient to fade out the edges of the grid.",
    },
    autoRotateSpeed: {
        type: ControlType.Number,
        min: 0,
        max: 50,
        title: "Auto-Rotate",
        defaultValue: 0,
        description:
            "The speed at which the entire grid slowly rotates continuously.",
    },
    perspective: {
        type: ControlType.Number,
        min: 100,
        max: 5000,
        title: "Perspective",
        defaultValue: 5000,
        description: "The 3D perspective depth of the main container.",
    },
    glowIntensity: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.05,
        title: "Glow Power",
        defaultValue: 0.25,
        description: "The strength of the outer glow effect on active items.",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#90EB8C",
        description: "The color used for the active item glow.",
    },
    containerBackground: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
        description: "The background color of the grid container.",
    },
})
