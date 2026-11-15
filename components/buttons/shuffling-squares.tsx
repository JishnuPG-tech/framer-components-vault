import * as React from "react"
import { motion, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"

interface ImageSquaresProps extends React.HTMLAttributes<HTMLDivElement> {
    image: { src: string; alt?: string; positionX?: string; positionY?: string }
    gridSize: number
    gap: number
    imageFit: "cover" | "contain" | "fill"
    entryDelay: number
    disableAppearAnimation: boolean
    disableHoverAnimation: boolean
    borderRadius: number
    borderWidth: number
    borderColor: string
    style?: CSSProperties
}

const defaultImage = {
    src: "https://picsum.photos/seed/framer/1000/1000",
    alt: "Grid image",
    positionX: "center",
    positionY: "center",
}

/**
 * Image Squares Component
 * Slices an image into squares that assemble on view and react to hover
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageSquares(props: ImageSquaresProps) {
    const {
        image = defaultImage,
        gridSize = 5,
        gap = 2,
        imageFit = "cover",
        entryDelay = 0.5,
        disableAppearAnimation = false,
        disableHoverAnimation = false,
        borderRadius = 2,
        borderWidth = 0,
        borderColor = "#000000",
        style,
        ...rest
    } = props

    const resolvedImage = image?.src ? image : defaultImage
    const focalPoint =
        resolvedImage?.positionX && resolvedImage?.positionY
            ? `${resolvedImage.positionX} ${resolvedImage.positionY}`
            : "center"

    const containerRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas

    // We disable appear animation if on canvas (so it's easier to edit), if static, or if user turned it off
    const bypassAppear = isOnCanvas || isStatic || disableAppearAnimation

    // We disable hover animation if static or if user turned it off
    // Note: On canvas, we also don't want hover interactions to mess up selection
    const bypassHover = isOnCanvas || isStatic || disableHoverAnimation

    const isInView = useInView(containerRef, { once: true, amount: 0.2 })
    const hasEnteredView = bypassAppear || isInView

    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
    const [hasAnimatedIn, setHasAnimatedIn] = React.useState(false)

    React.useEffect(() => {
        if (hasEnteredView) {
            const t = setTimeout(
                () => setHasAnimatedIn(true),
                (entryDelay + gridSize * gridSize * 0.015) * 1000 + 500
            )
            return () => clearTimeout(t)
        }
    }, [hasEnteredView, entryDelay, gridSize])

    // Measure the container to align the inner backgrounds correctly
    React.useEffect(() => {
        if (!containerRef.current) return
        // Just use ResizeObserver for the exact dimensions
        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
                React.startTransition(() => {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height,
                    })
                })
            }
        })
        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    // Generate random starting positions scattered mainly inside the view
    const initialPositions = React.useMemo(() => {
        const positions = []
        for (let i = 0; i < gridSize * gridSize; i++) {
            // Angle between 0 and PI so y is always positive (comes from sides or below, never above)
            const angle = Math.random() * Math.PI
            // Shorter distance so they are mostly scattered inside, with a few possibly outside
            const distance = Math.random() * 300
            positions.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                rotate: (Math.random() - 0.5) * 90,
            })
        }
        return positions
    }, [gridSize])

    return (
        <div
            ref={containerRef}
            role="group"
            aria-label={image.alt || "Interactive image grid"}
            {...rest}
            style={{
                ...style,
                display: "grid",
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                gap: gap,
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            {/* Visually hidden image for SEO and screen readers */}
            <img
                src={resolvedImage.src}
                alt={resolvedImage.alt || "Interactive image grid"}
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            />

            {(isStatic || (bypassAppear && bypassHover)) &&
                dimensions.width === 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${resolvedImage.src})`,
                            backgroundSize: imageFit,
                            backgroundPosition: focalPoint,
                            backgroundRepeat: "no-repeat",
                            borderRadius: borderRadius,
                            border:
                                borderWidth > 0
                                    ? `${borderWidth}px solid ${borderColor}`
                                    : undefined,
                        }}
                    />
                )}

            {dimensions.width > 0 &&
                Array.from({ length: gridSize * gridSize }).map((_, i) => {
                    const r = Math.floor(i / gridSize)
                    const c = i % gridSize

                    // Calculate the exact size of a single cell
                    const cellWidth =
                        (dimensions.width - gap * (gridSize - 1)) / gridSize
                    const cellHeight =
                        (dimensions.height - gap * (gridSize - 1)) / gridSize

                    // Calculate the offset of this cell relative to the container
                    const left = c * cellWidth + c * gap
                    const top = r * cellHeight + r * gap

                    // Calculate dynamic hover radius based on gridSize
                    const hoverRadius = Math.max(
                        0,
                        Math.floor((gridSize - 2) / 5)
                    )

                    let isHovered = false
                    let targetX = 0
                    let targetY = 0
                    let isPushedAway = false

                    if (hasEnteredView && hoveredIndex !== null) {
                        const hr = Math.floor(hoveredIndex / gridSize)
                        const hc = hoveredIndex % gridSize
                        const dr = r - hr
                        const dc = c - hc

                        // Chebyshev distance gives a square brush
                        const distance = Math.max(Math.abs(dr), Math.abs(dc))

                        if (distance <= hoverRadius) {
                            isHovered = true
                        } else if (distance === hoverRadius + 1) {
                            const pushDistance = 15 // pixels to push away
                            targetX = Math.sign(dc) * pushDistance
                            targetY = Math.sign(dr) * pushDistance
                            isPushedAway = true
                        }
                    }

                    if (isStatic || (bypassAppear && bypassHover)) {
                        return (
                            <div
                                key={i}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    position: "relative",
                                    overflow: "hidden", // Important to clip the inner div
                                    borderRadius: borderRadius,
                                    border:
                                        borderWidth > 0
                                            ? `${borderWidth}px solid ${borderColor}`
                                            : undefined,
                                    boxSizing: "border-box",
                                    zIndex: 1,
                                }}
                            >
                                {/* Inner div exactly the size of the container, shifted back */}
                                <div
                                    style={{
                                        position: "absolute",
                                        width: dimensions.width,
                                        height: dimensions.height,
                                        left: -left,
                                        top: -top,
                                        backgroundImage: `url(${resolvedImage.src})`,
                                        backgroundSize: imageFit,
                                        backgroundPosition: focalPoint,
                                        backgroundRepeat: "no-repeat",
                                    }}
                                />
                            </div>
                        )
                    }

                    return (
                        <motion.div
                            key={i}
                            initial={
                                bypassAppear
                                    ? { x: 0, y: 0, rotate: 0, scale: 1 }
                                    : initialPositions[i]
                            }
                            animate={
                                hasEnteredView
                                    ? {
                                          x: targetX,
                                          y: targetY,
                                          rotate: 0,
                                          scale: isHovered ? 1.05 : 1,
                                      }
                                    : initialPositions[i]
                            }
                            transition={{
                                type: "spring",
                                damping: 20,
                                stiffness: 100,
                                mass: 1,
                                // Only apply stagger delay on the initial mount animation, not on hovers
                                delay:
                                    !hasAnimatedIn &&
                                    hasEnteredView &&
                                    !bypassAppear
                                        ? entryDelay + i * 0.015
                                        : 0,
                            }}
                            onMouseEnter={
                                bypassHover
                                    ? undefined
                                    : () =>
                                          React.startTransition(() =>
                                              setHoveredIndex(i)
                                          )
                            }
                            onMouseLeave={
                                bypassHover
                                    ? undefined
                                    : () =>
                                          React.startTransition(() =>
                                              setHoveredIndex(null)
                                          )
                            }
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                                overflow: "hidden", // Important to clip the inner div
                                borderRadius: borderRadius,
                                border:
                                    borderWidth > 0
                                        ? `${borderWidth}px solid ${borderColor}`
                                        : undefined,
                                boxSizing: "border-box",
                                zIndex: isHovered ? 10 : 1,
                            }}
                        >
                            {/* Inner div exactly the size of the container, shifted back */}
                            <div
                                style={{
                                    position: "absolute",
                                    width: dimensions.width,
                                    height: dimensions.height,
                                    left: -left,
                                    top: -top,
                                    backgroundImage: `url(${resolvedImage.src})`,
                                    backgroundSize: imageFit,
                                    backgroundPosition: focalPoint,
                                    backgroundRepeat: "no-repeat",
                                }}
                            />

                            {/* Frosted Glass Overlay for pushed away neighbors */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor:
                                        "rgba(255, 255, 255, 0.15)",
                                    backdropFilter: "blur(6px)",
                                    WebkitBackdropFilter: "blur(6px)",
                                    opacity: isPushedAway ? 1 : 0,
                                    transition: "opacity 0.3s ease",
                                    pointerEvents: "none", // Ensure mouse events fall through to parent
                                }}
                            />
                        </motion.div>
                    )
                })}
        </div>
    )
}

// Define the property controls for the Framer UI
addPropertyControls(ImageSquares, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        min: 2,
        max: 20,
        defaultValue: 5,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 50,
        defaultValue: 2,
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        defaultValue: 2,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 20,
        defaultValue: 0,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
        hidden: (props) => props.borderWidth === 0,
    },
    disableAppearAnimation: {
        type: ControlType.Boolean,
        title: "Disable Appear",
        defaultValue: false,
    },
    disableHoverAnimation: {
        type: ControlType.Boolean,
        title: "Disable Hover",
        defaultValue: false,
    },
    entryDelay: {
        type: ControlType.Number,
        title: "Entry Delay",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 0.5,
        unit: "s",
        hidden: (props) => props.disableAppearAnimation === true,
    },
})
