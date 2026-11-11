// @ts-ignore - Ignore missing type declarations for external library
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import { useRef, useEffect, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MotionLayerScrollerProps {
    // General settings
    backgroundColor: string
    scrollSensitivity: number
    perspective: number
    cameraTilt: number
    cameraRotation: number
    minLayers: number // Added configurable minimum layers

    // Layer appearance
    layerSettings: {
        spacing: number
        color: string
        opacity: number
        width: number | string
        height: number | string
        widthType: number
        heightType: number
        borderRadius: number
        border: {
            enabled: boolean
            width: number
            color: string
            style: string // "solid" | "dashed" | "dotted"
        }
        shadow: {
            x: number
            y: number
            blur: number
            spread: number
            color: string
            enabled: boolean
        }
    }

    // Hover settings
    hoverSettings: {
        enabled: boolean
        elevation: number
        scale: number
        exitDelay: number
        pauseOnHover: boolean
        transition?: any
    }

    // Content settings
    contentSettings: {
        sizing: string // "fill" | "fit" | "fixed" | "stretched"
        fixedWidth?: number
        fixedHeight?: number
        padding: number
        alignment: string // "center" | "start" | "end" | "stretch"
    }

    // Auto Play settings
    autoPlay: {
        enabled: boolean
        mode: string // "continuous" | "step"
        speed: number // For continuous mode
        stepDelay: number // For step mode
        stepTransition?: any // For step mode
    }

    // Depth of Field settings
    depthOfField: {
        enabled: boolean
        opacityFactor: number // How strong the opacity fade is
        blurFactor: number // How strong the blur effect is
        focusRange: number // How much of the center stays in focus
    }

    // Content
    linkedObjects: React.ReactNode[]
}

/**
 * MotionLayerScroller - A 3D layer scroller component using Framer Motion
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 400
 * @framerDisableUnlink
 */
export default function MotionLayerScroller(props: MotionLayerScrollerProps) {
    const {
        backgroundColor,
        scrollSensitivity,
        perspective,
        cameraTilt,
        cameraRotation,
        minLayers = 20, // Default to 20 if not specified
        layerSettings,
        hoverSettings,
        contentSettings,
        autoPlay,
        depthOfField,
        linkedObjects,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

    // Motion values for smooth animations
    const scrollY = useMotionValue(0)
    const smoothScroll = useSpring(scrollY, { stiffness: 100, damping: 30 })

    // Calculate total layers needed based on linked objects
    // Use configurable minimum number of layers for the looping effect
    const numLinked = linkedObjects?.length || 0
    const totalLayers = Math.max(
        minLayers,
        numLinked > 0 ? Math.max(numLinked * 2, minLayers) : minLayers
    ) // Ensure enough layers for looping if objects exist

    // Handle manual wheel scrolling with native non-passive listener
    const handleWheel = React.useCallback(
        (e: WheelEvent) => {
            e.preventDefault()

            // Normalize delta across devices
            const factor =
                e.deltaMode === 1
                    ? 16
                    : e.deltaMode === 2
                      ? window.innerHeight
                      : 1
            const delta = e.deltaY * factor * scrollSensitivity

            const current = scrollY.get() + delta
            scrollY.set(current)
        },
        [scrollSensitivity, scrollY]
    )

    // Update container size on resize and add non-passive wheel listener
    useEffect(() => {
        if (!containerRef.current) return

        const container = containerRef.current

        const updateSize = () => {
            if (container) {
                setContainerSize({
                    width: container.offsetWidth,
                    height: container.offsetHeight,
                })
            }
        }

        updateSize()
        const resizeObserver = new ResizeObserver(updateSize)
        resizeObserver.observe(container)

        // Add non-passive wheel listener
        container.addEventListener("wheel", handleWheel, { passive: false })

        return () => {
            resizeObserver.disconnect()
            container.removeEventListener("wheel", handleWheel)
        }
    }, [handleWheel])

    // Auto Play functionality
    useEffect(() => {
        if (!autoPlay?.enabled) return

        if (autoPlay.mode === "continuous") {
            // Continuous scroll mode
            let animationFrameId: number
            let lastTime = performance.now()

            const animate = (currentTime: number) => {
                const deltaTime = currentTime - lastTime
                lastTime = currentTime

                // Speed is in pixels per second, convert to pixels per frame
                const increment = (autoPlay.speed || 50) * (deltaTime / 1000)
                const current = scrollY.get()
                scrollY.set(current + increment)

                animationFrameId = requestAnimationFrame(animate)
            }

            animationFrameId = requestAnimationFrame(animate)

            return () => {
                cancelAnimationFrame(animationFrameId)
            }
        } else if (autoPlay.mode === "step") {
            // Step-by-step mode: move exactly one layer spacing at a time
            const stepInterval = setInterval(() => {
                const current = scrollY.get()
                const targetScroll = current + layerSettings.spacing

                // Animate to the next layer position
                const startScroll = current
                const duration = autoPlay.stepTransition?.duration || 0.5
                const startTime = performance.now()

                const animateStep = (currentTime: number) => {
                    const elapsed = (currentTime - startTime) / 1000
                    const progress = Math.min(elapsed / duration, 1)

                    // Easing function (easeInOut)
                    const eased =
                        progress < 0.5
                            ? 2 * progress * progress
                            : 1 - Math.pow(-2 * progress + 2, 2) / 2

                    const newScroll =
                        startScroll + (targetScroll - startScroll) * eased
                    scrollY.set(newScroll)

                    if (progress < 1) {
                        requestAnimationFrame(animateStep)
                    }
                }

                requestAnimationFrame(animateStep)
            }, autoPlay.stepDelay || 1000)

            return () => {
                clearInterval(stepInterval)
            }
        }
    }, [autoPlay, scrollY, layerSettings.spacing])

    // Create velocity-based dynamic tilt that returns to equilibrium
    const scrollVelocity = useVelocity(smoothScroll)
    const smoothVelocity = useSpring(scrollVelocity, {
        stiffness: 100,
        damping: 30,
    })

    // Map velocity to rotation offset (scrolling adds tilt, stopping returns to base)
    const velocityRotation = useTransform(
        smoothVelocity,
        [-1000, 0, 1000], // velocity range
        [-5, 0, 5] // rotation offset range
    )

    // Combine base cameraTilt with velocity-based offset
    const sceneRotateX = useTransform(
        velocityRotation,
        (offset) => cameraTilt + offset
    )

    // Create layers with linked objects
    const renderLayers = () => {
        // Always render layers, even without content (for canvas preview)
        return Array.from({ length: totalLayers }).map((_, index) => {
            let content = null

            if (linkedObjects && linkedObjects.length > 0) {
                const objectIndex = index % linkedObjects.length
                content = linkedObjects[objectIndex]
            } else {
                // Show placeholder content when no content is provided
                content = (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            border: "2px dashed rgba(255, 255, 255, 0.3)",
                            color: "rgba(255, 255, 255, 0.7)",
                            fontSize: "48px",
                            fontWeight: "bold",
                            userSelect: "none",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        {index + 1}
                    </div>
                )
            }

            return renderSingleLayer(index, content)
        })
    }

    // Helper to convert size values from Framer controls to CSS values
    const getSizeValue = (value: number | string, type: number) => {
        // Fixed mode (0) returns direct pixels, otherwise return the value as is (should be string already)
        return type === 0 ? `${value}px` : value
    }

    // Helper to create shadow string
    const getBoxShadow = (shadow: {
        x: number
        y: number
        blur: number
        spread: number
        color: string
        enabled: boolean
    }) => {
        if (!shadow.enabled) return "none"
        return `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`
    }

    // Helper to create border string
    const getBorder = (border: {
        enabled: boolean
        width: number
        color: string
        style: string
    }) => {
        if (!border?.enabled) return "none"
        return `${border.width}px ${border.style} ${border.color}`
    }

    // Helper to get content container styles based on sizing mode
    const getContentStyles = () => {
        const settings = contentSettings || {
            sizing: "fill",
            padding: 16,
            alignment: "center",
            fixedWidth: 200,
            fixedHeight: 150,
        }

        const baseStyles = {
            boxSizing: "border-box" as const,
            padding: `${settings.padding}px`,
            borderRadius:
                layerSettings.borderRadius > 0
                    ? `${layerSettings.borderRadius - 4}px`
                    : "0px",
            pointerEvents: "auto" as const,
        }

        switch (settings.sizing) {
            case "fill":
                return {
                    ...baseStyles,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent:
                        settings.alignment === "start"
                            ? "flex-start"
                            : settings.alignment === "end"
                              ? "flex-end"
                              : "center",
                    alignItems:
                        settings.alignment === "start"
                            ? "flex-start"
                            : settings.alignment === "end"
                              ? "flex-end"
                              : "center",
                }
            case "fit":
                return {
                    ...baseStyles,
                    width: "fit-content",
                    height: "fit-content",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }
            case "fixed":
                return {
                    ...baseStyles,
                    width: settings.fixedWidth
                        ? `${settings.fixedWidth}px`
                        : "100%",
                    height: settings.fixedHeight
                        ? `${settings.fixedHeight}px`
                        : "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                }
            case "stretched":
                return {
                    ...baseStyles,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "stretch",
                }
            default:
                return {
                    ...baseStyles,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }
        }
    }

    // Layer component to fix hooks-in-loop violation
    const Layer = React.memo(
        ({ index, content }: { index: number; content: React.ReactNode }) => {
            const [hovered, setHovered] = useState(false)

            // Process layer background color to remove alpha when DOF is disabled
            const layerBackgroundColor = React.useMemo(() => {
                if (!depthOfField?.enabled) {
                    // Remove alpha channel when DOF is disabled for crisp rendering
                    const color = layerSettings.color

                    // Convert rgba to rgb
                    if (color.startsWith("rgba")) {
                        const match = color.match(
                            /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*[\d.]+\)/
                        )
                        if (match) {
                            return `rgb(${match[1]}, ${match[2]}, ${match[3]})`
                        }
                    }
                    // Convert hsla to hsl
                    if (color.startsWith("hsla")) {
                        const match = color.match(
                            /hsla?\(([\d.]+),\s*([\d.%]+),\s*([\d.%]+),\s*[\d.]+\)/
                        )
                        if (match) {
                            return `hsl(${match[1]}, ${match[2]}, ${match[3]})`
                        }
                    }
                    // Remove alpha from 8-digit hex (#RRGGBBAA)
                    if (color.length === 9 && color.startsWith("#")) {
                        return color.slice(0, 7)
                    }

                    return color // Already solid
                }
                return layerSettings.color // Keep alpha when DOF is active
            }, [depthOfField?.enabled, layerSettings.color])

            // Calculate initial z position
            const zInitial = -index * layerSettings.spacing

            // Transform z-position with improved infinite looping
            const layerZ = useTransform(smoothScroll, (value) => {
                const totalDepth = totalLayers * layerSettings.spacing
                let currentZ = zInitial + value
                const cycle = totalDepth
                const normalizedZ = ((currentZ % cycle) + cycle) % cycle
                const wrappedZ = normalizedZ - cycle * 0.5
                return wrappedZ
            })

            // Calculate scale based on z position for depth effect
            // Proper perspective: closer objects (positive z) should be larger
            const scale = useTransform(
                layerZ,
                [
                    -totalLayers * layerSettings.spacing * 0.5, // Far back
                    0, // Center
                    totalLayers * layerSettings.spacing * 0.5, // Far forward
                ],
                [0.6, 1, 1.4], // Back small, center normal, front large
                { clamp: false }
            )

            // Calculate opacity based on z position for fade effect
            const opacity = useTransform(
                layerZ,
                depthOfField?.enabled
                    ? [
                          -totalLayers * layerSettings.spacing * 0.5,
                          -totalLayers *
                              layerSettings.spacing *
                              (depthOfField.focusRange || 0.25),
                          0,
                          totalLayers *
                              layerSettings.spacing *
                              (depthOfField.focusRange || 0.25),
                          totalLayers * layerSettings.spacing * 0.5,
                      ]
                    : [
                          -totalLayers * layerSettings.spacing * 0.5,
                          0,
                          totalLayers * layerSettings.spacing * 0.5,
                      ], // Simple range when DOF is disabled
                depthOfField?.enabled
                    ? [
                          0,
                          layerSettings.opacity *
                              (1 - (depthOfField.opacityFactor || 0.5)),
                          layerSettings.opacity,
                          layerSettings.opacity *
                              (1 - (depthOfField.opacityFactor || 0.5)),
                          0,
                      ]
                    : [
                          layerSettings.opacity,
                          layerSettings.opacity,
                          layerSettings.opacity,
                      ], // Full opacity when DOF is disabled
                { clamp: true }
            )

            // Calculate blur based on z position for depth of field effect
            const blur = useTransform(
                layerZ,
                [
                    -totalLayers * layerSettings.spacing * 0.5,
                    -totalLayers *
                        layerSettings.spacing *
                        (depthOfField?.focusRange || 0.25),
                    0,
                    totalLayers *
                        layerSettings.spacing *
                        (depthOfField?.focusRange || 0.25),
                    totalLayers * layerSettings.spacing * 0.5,
                ],
                depthOfField?.enabled && depthOfField.blurFactor > 0
                    ? [
                          depthOfField.blurFactor * 10,
                          depthOfField.blurFactor * 2,
                          0,
                          depthOfField.blurFactor * 2,
                          depthOfField.blurFactor * 10,
                      ]
                    : [0, 0, 0, 0, 0],
                { clamp: true }
            )

            // Create a stable filter value that respects hover state
            const filterValue = useTransform(blur, (blurValue) => {
                if (!depthOfField?.enabled || depthOfField.blurFactor <= 0)
                    return "none"
                if (hovered) return "none"
                return blurValue <= 0 ? "none" : `blur(${blurValue}px)`
            })

            // Calculate z-index based on z position for proper layering
            // Use a larger base value and multiplier for better Safari compatibility
            const zIndex = useTransform(layerZ, (zValue) =>
                Math.round(5000 + zValue * 10)
            )

            return (
                <motion.div
                    className="motion-layer"
                    style={{
                        position: "absolute",
                        width: getSizeValue(
                            layerSettings.width,
                            layerSettings.widthType
                        ),
                        height: getSizeValue(
                            layerSettings.height,
                            layerSettings.heightType
                        ),
                        left: "50%",
                        top: "50%",
                        x: "-50%",
                        y: "-50%",
                        transformOrigin: "center center",
                        translateZ: layerZ,
                        scale,
                        opacity,
                        filter: filterValue,
                        zIndex: hovered ? 999999 : zIndex,
                        backgroundColor: layerBackgroundColor,
                        boxShadow: getBoxShadow(layerSettings.shadow),
                        borderRadius: `${layerSettings.borderRadius}px`,
                        border: getBorder(layerSettings.border),
                        pointerEvents: "auto",
                        willChange: "transform, opacity",
                        overflow: "hidden",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: hoverSettings.enabled ? "pointer" : "default",
                    }}
                    whileHover={
                        hoverSettings.enabled
                            ? {
                                  translateY: -hoverSettings.elevation, // Pixel-perfect elevation control
                                  boxShadow: `0 ${hoverSettings.elevation}px ${hoverSettings.elevation * 2}px rgba(0,0,0,0.25)`,
                              }
                            : undefined
                    }
                    transition={
                        hoverSettings.transition || {
                            duration: 0.2,
                            ease: "easeOut",
                        }
                    }
                    whileTap={
                        hoverSettings.enabled
                            ? {
                                  translateY: -5, // Slight press down effect
                              }
                            : undefined
                    }
                    onHoverStart={() => {
                        setHovered(true)
                    }}
                    onHoverEnd={() => {
                        // Immediate state change to prevent stuck blur
                        setHovered(false)
                    }}
                    // Remove animate block - let style handle MotionValues
                >
                    {/* Content container with configurable sizing */}
                    <div style={getContentStyles()}>{content}</div>
                </motion.div>
            )
        }
    )

    const renderSingleLayer = (index: number, content: React.ReactNode) => {
        return <Layer key={`layer-${index}`} index={index} content={content} />
    }

    return (
        <Frame
            width="100%"
            height="100%"
            background={backgroundColor}
            style={{ overflow: "hidden" }}
        >
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    perspective: `${perspective}px`,
                    perspectiveOrigin: "center center",
                    WebkitTransformStyle: "preserve-3d",
                    transformStyle: "preserve-3d",
                    pointerEvents: "auto",
                }}
            >
                <motion.div
                    className="scene-container"
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        transformOrigin: "center center",
                        rotateX: sceneRotateX,
                        rotateY: cameraRotation,
                        willChange: "transform",
                        WebkitTransformStyle: "preserve-3d",
                        pointerEvents: "none",
                    }}
                >
                    {renderLayers()}
                </motion.div>
            </div>
        </Frame>
    )
}

// Add Property Controls for Framer
addPropertyControls(MotionLayerScroller, {
    // General Settings
    minLayers: {
        type: ControlType.Number,
        title: "Min Layers",
        description: "Minimum number of layers for smooth looping",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 5,
        displayStepper: true,
    },

    // Camera and View Settings
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        description: "Controls the intensity of the 3D effect",
        defaultValue: 1900,
        min: 200,
        max: 3000,
        step: 50,
        displayStepper: true,
    },
    cameraTilt: {
        type: ControlType.Number,
        title: "Camera Tilt",
        description: "Adjust the viewing angle in degrees",
        defaultValue: -25,
        min: -45,
        max: 45,
        step: 1,
        displayStepper: true,
        unit: "°",
    },
    cameraRotation: {
        type: ControlType.Number,
        title: "Camera Rotation",
        description: "Rotate the view for isometric perspective",
        defaultValue: -45,
        min: -180,
        max: 180,
        step: 5,
        displayStepper: true,
        unit: "°",
    },

    // Interaction Settings
    scrollSensitivity: {
        type: ControlType.Number,
        title: "Scroll Sensitivity",
        description: "How fast layers move when scrolling",
        defaultValue: 0.5,
        min: 0.05,
        max: 3,
        step: 0.05,
        displayStepper: true,
    },

    // Layer Settings
    layerSettings: {
        type: ControlType.Object,
        title: "Layer Settings",
        controls: {
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                description: "Distance between layers",
                defaultValue: 128,
                min: 20,
                max: 500,
                step: 10,
                displayStepper: true,
            },
            width: {
                type: ControlType.FusedNumber,
                title: "Width",
                defaultValue: 400,
                toggleKey: "widthType",
                toggleTitles: ["px", "%", "vw", "vh"],
                valueKeys: ["width", "width", "width", "width"],
                valueLabels: ["px", "%", "vw", "vh"],
                min: 50,
            },
            height: {
                type: ControlType.FusedNumber,
                title: "Height",
                defaultValue: 400,
                toggleKey: "heightType",
                toggleTitles: ["px", "%", "vw", "vh"],
                valueKeys: ["height", "height", "height", "height"],
                valueLabels: ["px", "%", "vw", "vh"],
                min: 50,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                description: "Corner radius of layers",
                defaultValue: 8,
                min: 0,
                max: 100,
                displayStepper: true,
                step: 1,
            },
            border: {
                type: ControlType.Object,
                title: "Border",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Border",
                        defaultValue: false,
                        enabledTitle: "On",
                        disabledTitle: "Off",
                    },
                    width: {
                        type: ControlType.Number,
                        title: "Width",
                        defaultValue: 2,
                        min: 1,
                        max: 20,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                        hidden: (props) => !props.enabled,
                    },
                    style: {
                        type: ControlType.Enum,
                        title: "Style",
                        options: ["solid", "dashed", "dotted"],
                        optionTitles: ["Solid", "Dashed", "Dotted"],
                        defaultValue: "solid",
                        hidden: (props) => !props.enabled,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "rgba(255,255,255,0.3)",
                        hidden: (props) => !props.enabled,
                    },
                },
            },
            shadow: {
                type: ControlType.Object,
                title: "Shadow",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Shadow",
                        defaultValue: false,
                        enabledTitle: "On",
                        disabledTitle: "Off",
                    },
                    x: {
                        type: ControlType.Number,
                        title: "X",
                        defaultValue: 0,
                        min: -100,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                        hidden: (props) => !props.enabled,
                    },
                    y: {
                        type: ControlType.Number,
                        title: "Y",
                        defaultValue: 4,
                        min: -100,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                        hidden: (props) => !props.enabled,
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        defaultValue: 30,
                        min: 0,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                        hidden: (props) => !props.enabled,
                    },
                    spread: {
                        type: ControlType.Number,
                        title: "Spread",
                        defaultValue: 0,
                        min: -50,
                        max: 50,
                        step: 1,
                        displayStepper: true,
                        hidden: (props) => !props.enabled,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "rgba(0,0,0,0.3)",
                        hidden: (props) => !props.enabled,
                    },
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                description:
                    "Background color of layers (alpha only works with DOF enabled)",
                defaultValue: "rgb(50, 50, 50)",
            },
            opacity: {
                type: ControlType.Number,
                title: "Max Opacity",
                description: "Maximum opacity for closest layers",
                defaultValue: 0.9,
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
            },
        },
    },

    // Hover Effects
    hoverSettings: {
        type: ControlType.Object,
        title: "Hover Effects",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable Hover",
                description: "Enable hover animations on layers",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            elevation: {
                type: ControlType.Number,
                title: "Elevation",
                description: "How many pixels the card lifts on hover",
                defaultValue: 20,
                min: 0,
                max: 100,
                step: 5,
                displayStepper: true,
                unit: "px",
                hidden: (props) => !props.enabled,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                description: "Scale multiplier on hover",
                defaultValue: 1.05,
                min: 0.8,
                max: 1.5,
                step: 0.05,
                displayStepper: true,
                hidden: (props) => !props.enabled,
            },
            transition: {
                type: ControlType.Transition,
                title: "Transition",
                defaultValue: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                },
                hidden: (props) => !props.enabled,
            },
            exitDelay: {
                type: ControlType.Number,
                title: "Exit Delay",
                description: "Delay before resuming scroll after hover ends",
                defaultValue: 500,
                min: 0,
                max: 2000,
                step: 100,
                displayStepper: true,
                unit: "ms",
                hidden: (props) => !props.enabled,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on Hover",
                description: "Pause scrolling when hovering over layers",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                hidden: (props) => !props.enabled,
            },
        },
    },

    // Content Settings
    contentSettings: {
        type: ControlType.Object,
        title: "Content Settings",
        defaultValue: {
            sizing: "fill",
            fixedWidth: 200,
            fixedHeight: 150,
            padding: 16,
            alignment: "center",
        },
        controls: {
            sizing: {
                type: ControlType.Enum,
                title: "Sizing Mode",
                description: "How content should be sized within layers",
                options: ["fill", "fit", "fixed", "stretched"],
                optionTitles: [
                    "Fill",
                    "Fit Content",
                    "Fixed Size",
                    "Stretched",
                ],
                defaultValue: "fill",
            },
            fixedWidth: {
                type: ControlType.Number,
                title: "Fixed Width",
                description: "Width in pixels when using fixed sizing",
                defaultValue: 200,
                min: 50,
                max: 1000,
                step: 10,
                displayStepper: true,
                unit: "px",
                hidden: (props) => props.sizing !== "fixed",
            },
            fixedHeight: {
                type: ControlType.Number,
                title: "Fixed Height",
                description: "Height in pixels when using fixed sizing",
                defaultValue: 150,
                min: 50,
                max: 1000,
                step: 10,
                displayStepper: true,
                unit: "px",
                hidden: (props) => props.sizing !== "fixed",
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                description: "Inner padding around content",
                defaultValue: 16,
                min: 0,
                max: 100,
                step: 4,
                displayStepper: true,
                unit: "px",
            },
            alignment: {
                type: ControlType.Enum,
                title: "Alignment",
                description: "Content alignment within layers",
                options: ["center", "start", "end", "stretch"],
                optionTitles: ["Center", "Start", "End", "Stretch"],
                defaultValue: "center",
                hidden: (props) => props.sizing === "stretched",
            },
        },
    },

    // Auto Play Settings
    autoPlay: {
        type: ControlType.Object,
        title: "Auto Play",
        defaultValue: {
            enabled: false,
            mode: "continuous",
            speed: 50,
            stepDelay: 1000,
        },
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Auto Play",
                description: "Automatically scroll through layers",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["continuous", "step"],
                optionTitles: ["Continuous", "Step by Step"],
                defaultValue: "continuous",
                hidden: (props) => !props.enabled,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                description: "Scroll speed in pixels per second",
                defaultValue: 50,
                min: 10,
                max: 500,
                step: 10,
                displayStepper: true,
                unit: "px/s",
                hidden: (props) =>
                    !props.enabled || props.mode !== "continuous",
            },
            stepDelay: {
                type: ControlType.Number,
                title: "Step Delay",
                description: "Delay between steps in milliseconds",
                defaultValue: 1000,
                min: 100,
                max: 5000,
                step: 100,
                displayStepper: true,
                unit: "ms",
                hidden: (props) => !props.enabled || props.mode !== "step",
            },
            stepTransition: {
                type: ControlType.Transition,
                title: "Step Transition",
                defaultValue: {
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                },
                hidden: (props) => !props.enabled || props.mode !== "step",
            },
        },
    },

    // Depth of Field Settings
    depthOfField: {
        type: ControlType.Object,
        title: "Depth of Field",
        defaultValue: {
            enabled: false,
            opacityFactor: 0.6,
            blurFactor: 0,
            focusRange: 0.3,
        },
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable DOF",
                description: "Enable depth of field effects for distant layers",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            opacityFactor: {
                type: ControlType.Number,
                title: "Opacity Factor",
                description:
                    "How much distant layers fade (0 = no fade, 1 = complete fade)",
                defaultValue: 0.6,
                min: 0,
                max: 1,
                step: 0.1,
                displayStepper: true,
                hidden: (props) => !props.enabled,
            },
            blurFactor: {
                type: ControlType.Number,
                title: "Blur Factor",
                description:
                    "How much distant layers blur (0 = no blur, higher = more blur)",
                defaultValue: 0,
                min: 0,
                max: 20,
                step: 1,
                displayStepper: true,
                unit: "px",
                hidden: (props) => !props.enabled,
            },
            focusRange: {
                type: ControlType.Number,
                title: "Focus Range",
                description:
                    "Size of the in-focus area (0.1 = narrow focus, 0.5 = wide focus)",
                defaultValue: 0.3,
                min: 0.1,
                max: 0.5,
                step: 0.05,
                displayStepper: true,
                hidden: (props) => !props.enabled,
            },
        },
    },

    // Content
    linkedObjects: {
        type: ControlType.Array,
        title: "Content",
        description: "Elements to display in each layer",
        control: {
            type: ControlType.ComponentInstance,
        },
        defaultValue: [],
    },

    // Appearance
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color behind the scroller",
        defaultValue: "#000000",
    },
})
