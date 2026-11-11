// Integration hub component showing a central node connected to multiple service icons
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import type { CSSProperties } from "react"

interface IntegrationNode {
    image: {
        src: string
        alt: string
    }
}

interface IntegrationDiagramProps {
    centerImage: {
        src: string
        alt: string
    }
    leftNodes: IntegrationNode[]
    rightNodes: IntegrationNode[]
    backgroundColor: string
    nodeBackgroundColor: string
    centerBackgroundColor: string
    lineColor: string
    nodeShadow: string
    centerSize: number
    nodeSize: number
    lineWidth: number
    horizontalSpacing: number
    verticalSpacing: number
    animateLines: boolean
    animationDuration: number
    animationDirection: "leftToRight" | "rightToLeft" | "both"
    padding: {
        top: number
        right: number
        bottom: number
        left: number
    }
    style?: CSSProperties
}

/**
 * Integration Hub Component
 * 
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 * 
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function IntegrationDiagram(props: IntegrationDiagramProps) {
    const {
        centerImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Center Hub",
        },
        leftNodes = [
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Service 1",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Service 2",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Service 3",
                },
            },
        ],
        rightNodes = [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Service 4",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Service 5",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Service 6",
                },
            },
        ],
        backgroundColor = "#F5F5F5",
        nodeBackgroundColor = "#FFFFFF",
        centerBackgroundColor = "#0099FF",
        lineColor = "#EEEEEE",
        nodeShadow = "0 4px 20px rgba(0, 0, 0, 0.08)",
        centerSize = 120,
        nodeSize = 80,
        lineWidth = 2,
        horizontalSpacing = 200,
        verticalSpacing = 120,
        animateLines = true,
        animationDuration = 2,
        animationDirection = "leftToRight",
        padding = { top: 40, right: 40, bottom: 40, left: 40 },
    } = props

    const maxNodes = Math.max(leftNodes.length, rightNodes.length)
    const containerHeight = maxNodes > 1 ? (maxNodes - 1) * verticalSpacing + nodeSize : Math.max(centerSize, nodeSize)
    const containerWidth = horizontalSpacing * 2 + centerSize

    const centerX = containerWidth / 2
    const centerY = containerHeight / 2

    const getNodePosition = (index: number, total: number, isLeft: boolean) => {
        const startY = centerY - ((total - 1) * verticalSpacing) / 2
        const y = startY + index * verticalSpacing
        const x = isLeft ? centerX - horizontalSpacing : centerX + horizontalSpacing
        return { x, y }
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: containerHeight + padding.top + padding.bottom,
                backgroundColor,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                overflow: "visible",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: containerWidth + padding.left + padding.right,
                    height: containerHeight + padding.top + padding.bottom,
                    overflow: "visible",
                }}
            >
            <svg
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: containerWidth + padding.left + padding.right,
                    height: containerHeight + padding.top + padding.bottom,
                    pointerEvents: "none",
                }}
            >
                {leftNodes.map((_, index) => {
                    const { x, y } = getNodePosition(index, leftNodes.length, true)
                    const pathLength = Math.sqrt(
                        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                    )

                    const shouldAnimateLeftToCenter = animateLines && (animationDirection === "leftToRight" || animationDirection === "both")
                    const shouldAnimateCenterToLeft = animateLines && (animationDirection === "rightToLeft" || animationDirection === "both")

                    return (
                        <>
                            {/* Left to Center (for leftToRight flow) */}
                            {(animationDirection === "leftToRight" || animationDirection === "both") && (
                                <motion.line
                                    key={`left-out-${index}`}
                                    x1={x + padding.left}
                                    y1={y + padding.top}
                                    x2={centerX + padding.left}
                                    y2={centerY + padding.top}
                                    stroke={lineColor}
                                    strokeWidth={lineWidth}
                                    strokeDasharray={shouldAnimateLeftToCenter ? pathLength : undefined}
                                    strokeDashoffset={shouldAnimateLeftToCenter ? pathLength : undefined}
                                    animate={
                                        shouldAnimateLeftToCenter
                                            ? { 
                                                strokeDashoffset: [pathLength, 0],
                                                opacity: [0, 1, 1, 0]
                                            }
                                            : {}
                                    }
                                    transition={{
                                        duration: animationDuration / 2,
                                        ease: "easeInOut",
                                        repeat: Infinity,
                                        repeatDelay: animationDirection === "both" ? animationDuration : animationDuration / 2,
                                        delay: index * 0.1,
                                    }}
                                />
                            )}
                            {/* Center to Left (for rightToLeft flow) */}
                            {(animationDirection === "rightToLeft" || animationDirection === "both") && (
                                <motion.line
                                    key={`left-in-${index}`}
                                    x1={centerX + padding.left}
                                    y1={centerY + padding.top}
                                    x2={x + padding.left}
                                    y2={y + padding.top}
                                    stroke={lineColor}
                                    strokeWidth={lineWidth}
                                    strokeDasharray={shouldAnimateCenterToLeft ? pathLength : undefined}
                                    strokeDashoffset={shouldAnimateCenterToLeft ? pathLength : undefined}
                                    animate={
                                        shouldAnimateCenterToLeft
                                            ? { 
                                                strokeDashoffset: [pathLength, 0],
                                                opacity: [0, 1, 1, 0]
                                            }
                                            : {}
                                    }
                                    transition={{
                                        duration: animationDuration / 2,
                                        ease: "easeInOut",
                                        repeat: Infinity,
                                        repeatDelay: animationDirection === "both" ? animationDuration : animationDuration / 2,
                                        delay: animationDirection === "both" ? animationDuration + index * 0.1 : index * 0.1,
                                    }}
                                />
                            )}
                        </>
                    )
                })}
                {rightNodes.map((_, index) => {
                    const { x, y } = getNodePosition(index, rightNodes.length, false)
                    const pathLength = Math.sqrt(
                        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                    )

                    const shouldAnimateCenterToRight = animateLines && (animationDirection === "leftToRight" || animationDirection === "both")
                    const shouldAnimateRightToCenter = animateLines && (animationDirection === "rightToLeft" || animationDirection === "both")

                    return (
                        <>
                            {/* Center to Right (for leftToRight flow) */}
                            {(animationDirection === "leftToRight" || animationDirection === "both") && (
                                <motion.line
                                    key={`right-out-${index}`}
                                    x1={centerX + padding.left}
                                    y1={centerY + padding.top}
                                    x2={x + padding.left}
                                    y2={y + padding.top}
                                    stroke={lineColor}
                                    strokeWidth={lineWidth}
                                    strokeDasharray={shouldAnimateCenterToRight ? pathLength : undefined}
                                    strokeDashoffset={shouldAnimateCenterToRight ? pathLength : undefined}
                                    animate={
                                        shouldAnimateCenterToRight
                                            ? { 
                                                strokeDashoffset: [pathLength, 0],
                                                opacity: [0, 1, 1, 0]
                                            }
                                            : {}
                                    }
                                    transition={{
                                        duration: animationDuration / 2,
                                        ease: "easeInOut",
                                        repeat: Infinity,
                                        repeatDelay: animationDirection === "both" ? animationDuration : animationDuration / 2,
                                        delay: index * 0.1,
                                    }}
                                />
                            )}
                            {/* Right to Center (for rightToLeft flow) */}
                            {(animationDirection === "rightToLeft" || animationDirection === "both") && (
                                <motion.line
                                    key={`right-in-${index}`}
                                    x1={x + padding.left}
                                    y1={y + padding.top}
                                    x2={centerX + padding.left}
                                    y2={centerY + padding.top}
                                    stroke={lineColor}
                                    strokeWidth={lineWidth}
                                    strokeDasharray={shouldAnimateRightToCenter ? pathLength : undefined}
                                    strokeDashoffset={shouldAnimateRightToCenter ? pathLength : undefined}
                                    animate={
                                        shouldAnimateRightToCenter
                                            ? { 
                                                strokeDashoffset: [pathLength, 0],
                                                opacity: [0, 1, 1, 0]
                                            }
                                            : {}
                                    }
                                    transition={{
                                        duration: animationDuration / 2,
                                        ease: "easeInOut",
                                        repeat: Infinity,
                                        repeatDelay: animationDirection === "both" ? animationDuration : animationDuration / 2,
                                        delay: animationDirection === "both" ? animationDuration + index * 0.1 : index * 0.1,
                                    }}
                                />
                            )}
                        </>
                    )
                })}
            </svg>

            <div
                style={{
                    position: "absolute",
                    left: centerX - centerSize / 2 + padding.left,
                    top: centerY - centerSize / 2 + padding.top,
                    width: centerSize,
                    height: centerSize,
                    borderRadius: "50%",
                    backgroundColor: centerBackgroundColor,
                    boxShadow: nodeShadow,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                <img
                    {...centerImage}
                    style={{
                        width: "60%",
                        height: "60%",
                        objectFit: "contain",
                    }}
                />
            </div>

            {leftNodes.map((node, index) => {
                const { x, y } = getNodePosition(index, leftNodes.length, true)

                return (
                    <div
                        key={`left-${index}`}
                        style={{
                            position: "absolute",
                            left: x - nodeSize / 2 + padding.left,
                            top: y - nodeSize / 2 + padding.top,
                            width: nodeSize,
                            height: nodeSize,
                            borderRadius: "50%",
                            backgroundColor: nodeBackgroundColor,
                            boxShadow: nodeShadow,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            {...node.image}
                            style={{
                                width: "60%",
                                height: "60%",
                                objectFit: "contain",
                            }}
                        />
                    </div>
                )
            })}

            {rightNodes.map((node, index) => {
                const { x, y } = getNodePosition(index, rightNodes.length, false)

                return (
                    <div
                        key={`right-${index}`}
                        style={{
                            position: "absolute",
                            left: x - nodeSize / 2 + padding.left,
                            top: y - nodeSize / 2 + padding.top,
                            width: nodeSize,
                            height: nodeSize,
                            borderRadius: "50%",
                            backgroundColor: nodeBackgroundColor,
                            boxShadow: nodeShadow,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            {...node.image}
                            style={{
                                width: "60%",
                                height: "60%",
                                objectFit: "contain",
                            }}
                        />
                    </div>
                )
            })}
            </div>
        </div>
    )
}

addPropertyControls(IntegrationDiagram, {
    centerImage: {
        type: ControlType.ResponsiveImage,
        title: "Center Image",
    },
    leftNodes: {
        type: ControlType.Array,
        title: "Left Nodes",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Service 1",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Service 2",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Service 3",
                },
            },
        ],
    },
    rightNodes: {
        type: ControlType.Array,
        title: "Right Nodes",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Service 4",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Service 5",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Service 6",
                },
            },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    nodeBackgroundColor: {
        type: ControlType.Color,
        title: "Node Background",
        defaultValue: "#FFFFFF",
    },
    centerBackgroundColor: {
        type: ControlType.Color,
        title: "Center Background",
        defaultValue: "#0099FF",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#EEEEEE",
    },
    nodeShadow: {
        type: ControlType.BoxShadow,
        title: "Node Shadow",
        defaultValue: "0 4px 20px rgba(0, 0, 0, 0.08)",
    },
    centerSize: {
        type: ControlType.Number,
        title: "Center Size",
        defaultValue: 120,
        min: 60,
        max: 200,
        step: 10,
        unit: "px",
    },
    nodeSize: {
        type: ControlType.Number,
        title: "Node Size",
        defaultValue: 80,
        min: 40,
        max: 120,
        step: 10,
        unit: "px",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
    },
    horizontalSpacing: {
        type: ControlType.Number,
        title: "Horizontal Spacing",
        defaultValue: 200,
        min: 100,
        max: 400,
        step: 10,
        unit: "px",
    },
    verticalSpacing: {
        type: ControlType.Number,
        title: "Vertical Spacing",
        defaultValue: 120,
        min: 60,
        max: 200,
        step: 10,
        unit: "px",
    },
    animateLines: {
        type: ControlType.Boolean,
        title: "Animate Lines",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.5,
        unit: "s",
        hidden: ({ animateLines }) => !animateLines,
    },
    animationDirection: {
        type: ControlType.Enum,
        title: "Animation Direction",
        options: ["leftToRight", "rightToLeft", "both"],
        optionTitles: ["Left to Right", "Right to Left", "Both"],
        defaultValue: "leftToRight",
        displaySegmentedControl: true,
        hidden: ({ animateLines }) => !animateLines,
    },
    padding: {
        type: ControlType.Object,
        title: "Padding",
        controls: {
            top: {
                type: ControlType.Number,
                title: "Top",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 5,
                unit: "px",
            },
            right: {
                type: ControlType.Number,
                title: "Right",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 5,
                unit: "px",
            },
            bottom: {
                type: ControlType.Number,
                title: "Bottom",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 5,
                unit: "px",
            },
            left: {
                type: ControlType.Number,
                title: "Left",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 5,
                unit: "px",
            },
        },
        defaultValue: {
            top: 40,
            right: 40,
            bottom: 40,
            left: 40,
        },
    },
})