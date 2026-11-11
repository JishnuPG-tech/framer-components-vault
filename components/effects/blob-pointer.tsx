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

import { useRef, useEffect, useCallback, useId } from "react"
import gsap from "gsap"

interface BlobCursorProps {
    blobType: "circle" | "square"
    fillColor: string
    trailCount: number

    size1: number
    size2: number
    size3: number

    innerSize1: number
    innerSize2: number
    innerSize3: number

    innerColor: string

    opacity1: number
    opacity2: number
    opacity3: number

    shadowColor: string
    shadowBlur: number
    shadowOffsetX: number
    shadowOffsetY: number

    filterId: string
    filterStdDeviation: number
    useFilter: boolean

    fastDuration: number
    slowDuration: number

    fastEase: string
    slowEase: string

    zIndex: number
}

export default function BlobCursor(props: BlobCursorProps) {
    const {
        blobType,
        fillColor,
        trailCount,

        size1,
        size2,
        size3,

        innerSize1,
        innerSize2,
        innerSize3,

        innerColor,

        opacity1,
        opacity2,
        opacity3,

        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY,

        filterId,
        filterStdDeviation,
        useFilter,

        fastDuration,
        slowDuration,

        fastEase,
        slowEase,

        zIndex,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const blobsRef = useRef<(HTMLDivElement | null)[]>([])

    // Required by Framer for static rendering/export.
    const isStaticRenderer = useIsStaticRenderer()

    // Create a unique filter ID for multiple component instances.
    const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const uniqueFilterId = `${filterId}-${instanceId}`

    const sizes = [size1, size2, size3]
    const innerSizes = [innerSize1, innerSize2, innerSize3]
    const opacities = [opacity1, opacity2, opacity3]

    /**
     * Convert viewport coordinates into coordinates
     * relative to the component.
     */
    const getLocalPosition = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) {
            return {
                x: 0,
                y: 0,
            }
        }

        const rect = containerRef.current.getBoundingClientRect()

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        }
    }, [])

    /**
     * Move the blob trail.
     *
     * This function is only called during the live,
     * interactive version of the component.
     */
    const handleMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            // Never run GSAP in static rendering mode.
            if (isStaticRenderer) return

            const { x, y } = getLocalPosition(event.clientX, event.clientY)

            blobsRef.current.forEach((element, index) => {
                if (!element) return

                const isLead = index === 0

                gsap.to(element, {
                    x,
                    y,
                    duration: isLead ? fastDuration : slowDuration,
                    ease: isLead ? fastEase : slowEase,
                    overwrite: "auto",
                })
            })
        },
        [
            isStaticRenderer,
            getLocalPosition,
            fastDuration,
            slowDuration,
            fastEase,
            slowEase,
        ]
    )

    /**
     * Clean up GSAP animations when the component
     * unmounts or when static rendering changes.
     */
    useEffect(() => {
        if (isStaticRenderer) {
            // Make absolutely sure there are no active tweens.
            gsap.killTweensOf(blobsRef.current)
            return
        }

        return () => {
            gsap.killTweensOf(blobsRef.current)
        }
    }, [isStaticRenderer])

    /**
     * Reset blob positions when component size changes.
     */
    useEffect(() => {
        if (isStaticRenderer) return

        const container = containerRef.current
        if (!container) return

        const resetPosition = () => {
            const rect = container.getBoundingClientRect()

            const centerX = rect.width / 2
            const centerY = rect.height / 2

            blobsRef.current.forEach((element) => {
                if (!element) return

                gsap.set(element, {
                    x: centerX,
                    y: centerY,
                })
            })
        }

        resetPosition()

        const resizeObserver = new ResizeObserver(() => {
            resetPosition()
        })

        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()
        }
    }, [isStaticRenderer])

    /**
     * STATIC RENDER
     *
     * Framer uses this when:
     * - generating previews
     * - exporting
     * - creating thumbnails
     * - rendering static content
     *
     * No pointer animation or continuous GSAP
     * effects are used here.
     */
    if (isStaticRenderer) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    pointerEvents: "none",
                    zIndex,
                }}
            >
                {useFilter && (
                    <svg
                        width="0"
                        height="0"
                        style={{
                            position: "absolute",
                            pointerEvents: "none",
                        }}
                    >
                        <defs>
                            <filter id={uniqueFilterId}>
                                <feGaussianBlur
                                    in="SourceGraphic"
                                    result="blur"
                                    stdDeviation={filterStdDeviation}
                                />

                                <feColorMatrix
                                    in="blur"
                                    values="1 0 0 0 0
                                            0 1 0 0 0
                                            0 0 1 0 0
                                            0 0 0 35 -10"
                                />
                            </filter>
                        </defs>
                    </svg>
                )}

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        filter: useFilter ? `url(#${uniqueFilterId})` : "none",
                    }}
                >
                    {Array.from({
                        length: Math.min(Math.max(trailCount, 1), 3),
                    }).map((_, index) => {
                        const size = sizes[index]
                        const innerSize = innerSizes[index]
                        const opacity = opacities[index]

                        return (
                            <div
                                key={index}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    width: size,
                                    height: size,
                                    marginLeft: -size / 2,
                                    marginTop: -size / 2,
                                    backgroundColor: fillColor,
                                    opacity,
                                    borderRadius:
                                        blobType === "circle" ? "50%" : "0px",
                                    boxShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px 0 ${shadowColor}`,
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        width: innerSize,
                                        height: innerSize,
                                        left: (size - innerSize) / 2,
                                        top: (size - innerSize) / 2,
                                        backgroundColor: innerColor,
                                        borderRadius:
                                            blobType === "circle"
                                                ? "50%"
                                                : "0px",
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    /**
     * LIVE / INTERACTIVE RENDER
     */
    return (
        <div
            ref={containerRef}
            onPointerMove={handleMove}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                pointerEvents: "auto",
                zIndex,
            }}
        >
            {useFilter && (
                <svg
                    width="0"
                    height="0"
                    style={{
                        position: "absolute",
                        pointerEvents: "none",
                    }}
                >
                    <defs>
                        <filter id={uniqueFilterId}>
                            <feGaussianBlur
                                in="SourceGraphic"
                                result="blur"
                                stdDeviation={filterStdDeviation}
                            />

                            <feColorMatrix
                                in="blur"
                                values="1 0 0 0 0
                                        0 1 0 0 0
                                        0 0 1 0 0
                                        0 0 0 35 -10"
                            />
                        </filter>
                    </defs>
                </svg>
            )}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    filter: useFilter ? `url(#${uniqueFilterId})` : "none",
                }}
            >
                {Array.from({
                    length: Math.min(Math.max(trailCount, 1), 3),
                }).map((_, index) => {
                    const size = sizes[index]
                    const innerSize = innerSizes[index]
                    const opacity = opacities[index]

                    return (
                        <div
                            key={index}
                            ref={(element) => {
                                blobsRef.current[index] = element
                            }}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,

                                width: size,
                                height: size,

                                marginLeft: -size / 2,
                                marginTop: -size / 2,

                                backgroundColor: fillColor,

                                opacity,

                                borderRadius:
                                    blobType === "circle" ? "50%" : "0px",

                                boxShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px 0 ${shadowColor}`,

                                willChange: "transform",

                                pointerEvents: "none",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",

                                    width: innerSize,
                                    height: innerSize,

                                    left: (size - innerSize) / 2,
                                    top: (size - innerSize) / 2,

                                    backgroundColor: innerColor,

                                    borderRadius:
                                        blobType === "circle" ? "50%" : "0px",

                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

BlobCursor.defaultProps = {
    width: 500,
    height: 500,

    blobType: "circle",

    fillColor: "#5227FF",

    trailCount: 3,

    size1: 60,
    size2: 125,
    size3: 75,

    innerSize1: 20,
    innerSize2: 35,
    innerSize3: 25,

    innerColor: "rgba(255,255,255,0.8)",

    opacity1: 0.6,
    opacity2: 0.6,
    opacity3: 0.6,

    shadowColor: "rgba(0,0,0,0.75)",
    shadowBlur: 5,
    shadowOffsetX: 10,
    shadowOffsetY: 10,

    filterId: "blob-framer",
    filterStdDeviation: 30,

    useFilter: true,

    fastDuration: 0.1,
    slowDuration: 0.5,

    fastEase: "power3.out",
    slowEase: "power1.out",

    zIndex: 100,
}

addPropertyControls(BlobCursor, {
    blobType: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "square"],
        optionTitles: ["Circle", "Square"],
        defaultValue: "circle",
    },

    fillColor: {
        type: ControlType.Color,
        title: "Blob Color",
        defaultValue: "#5227FF",
    },

    trailCount: {
        type: ControlType.Number,
        title: "Trail Count",
        min: 1,
        max: 3,
        step: 1,
        defaultValue: 3,
        displayStepper: true,
    },

    size1: {
        type: ControlType.Number,
        title: "Size 1",
        min: 10,
        max: 300,
        step: 1,
        defaultValue: 60,
        unit: "px",
    },

    size2: {
        type: ControlType.Number,
        title: "Size 2",
        min: 10,
        max: 300,
        step: 1,
        defaultValue: 125,
        unit: "px",
    },

    size3: {
        type: ControlType.Number,
        title: "Size 3",
        min: 10,
        max: 300,
        step: 1,
        defaultValue: 75,
        unit: "px",
    },

    innerSize1: {
        type: ControlType.Number,
        title: "Inner 1",
        min: 0,
        max: 150,
        step: 1,
        defaultValue: 20,
        unit: "px",
    },

    innerSize2: {
        type: ControlType.Number,
        title: "Inner 2",
        min: 0,
        max: 150,
        step: 1,
        defaultValue: 35,
        unit: "px",
    },

    innerSize3: {
        type: ControlType.Number,
        title: "Inner 3",
        min: 0,
        max: 150,
        step: 1,
        defaultValue: 25,
        unit: "px",
    },

    innerColor: {
        type: ControlType.Color,
        title: "Inner Color",
        defaultValue: "rgba(255,255,255,0.8)",
    },

    opacity1: {
        type: ControlType.Number,
        title: "Opacity 1",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
    },

    opacity2: {
        type: ControlType.Number,
        title: "Opacity 2",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
    },

    opacity3: {
        type: ControlType.Number,
        title: "Opacity 3",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
    },

    shadowColor: {
        type: ControlType.Color,
        title: "Shadow",
        defaultValue: "rgba(0,0,0,0.75)",
    },

    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 5,
        unit: "px",
    },

    shadowOffsetX: {
        type: ControlType.Number,
        title: "Shadow X",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 10,
        unit: "px",
    },

    shadowOffsetY: {
        type: ControlType.Number,
        title: "Shadow Y",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 10,
        unit: "px",
    },

    useFilter: {
        type: ControlType.Boolean,
        title: "Blob Filter",
        defaultValue: true,
    },

    filterStdDeviation: {
        type: ControlType.Number,
        title: "Blur Amount",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 30,
        unit: "px",
        hidden: (props) => !props.useFilter,
    },

    fastDuration: {
        type: ControlType.Number,
        title: "Lead Speed",
        min: 0.01,
        max: 2,
        step: 0.01,
        defaultValue: 0.1,
        unit: "s",
    },

    slowDuration: {
        type: ControlType.Number,
        title: "Trail Speed",
        min: 0.05,
        max: 3,
        step: 0.05,
        defaultValue: 0.5,
        unit: "s",
    },

    fastEase: {
        type: ControlType.String,
        title: "Lead Ease",
        defaultValue: "power3.out",
    },

    slowEase: {
        type: ControlType.String,
        title: "Trail Ease",
        defaultValue: "power1.out",
    },

    zIndex: {
        type: ControlType.Number,
        title: "Z Index",
        min: 0,
        max: 9999,
        step: 1,
        defaultValue: 100,
    },
})
