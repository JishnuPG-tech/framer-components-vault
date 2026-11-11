// Liquid blob that follows the cursor and morphs shape based on movement, speed, and velocity
import { useRef, useEffect, useCallback, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate } from "framer-motion"

/**
 * Liquid Blob Cursor
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

export default function LiquidBlob(props) {
    const {
        color = "#5227FF",
        size = 125,
        trailCount = 3,
        innerColor = "rgba(255,255,255,0.8)",
        shadowColor = "rgba(0,0,0,0.75)",
        shadowBlur = 5,
        useFilter = true,
        filterStdDeviation = 30,
        fastDuration = 0.1,
        slowDuration = 0.5,
        style,
    } = props
    
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef(null)
    const blobsRef = useRef([])
    const animationsRef = useRef([])
    const positionHistoryRef = useRef([])

    const handleMove = useCallback(
        e => {
            const x = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX
            const y = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY
            
            if (x === undefined || y === undefined) return

            // Add current position to history
            positionHistoryRef.current.unshift({ x, y })
            
            // Keep history limited to prevent memory issues
            const maxHistory = trailCount * 10
            if (positionHistoryRef.current.length > maxHistory) {
                positionHistoryRef.current = positionHistoryRef.current.slice(0, maxHistory)
            }

            blobsRef.current.forEach((el, i) => {
                if (!el) return
                
                // Cancel previous animation if exists
                if (animationsRef.current[i]) {
                    animationsRef.current[i].stop()
                }
                
                // Each blob follows a position from history based on its index
                const historyIndex = i * 5 // Spacing between blobs in history
                const targetPos = positionHistoryRef.current[historyIndex] || { x, y }
                
                // Each blob gets progressively slower to create separation
                const duration = fastDuration + (i * slowDuration)
                
                animationsRef.current[i] = animate(el, {
                    x: targetPos.x,
                    y: targetPos.y,
                }, {
                    duration: duration,
                    ease: "easeOut"
                })
            })
        },
        [fastDuration, slowDuration, trailCount]
    )

    useEffect(() => {
        if (isStatic) return
        
        window.addEventListener("mousemove", handleMove)
        window.addEventListener("touchmove", handleMove)
        
        return () => {
            window.removeEventListener("mousemove", handleMove)
            window.removeEventListener("touchmove", handleMove)
            // Clean up animations
            animationsRef.current.forEach(anim => anim?.stop())
        }
    }, [handleMove, isStatic])

    // Calculate sizes for blobs
    const sizes = [size, size * 1.5, size * 0.9]
    const innerSizes = [size * 0.3, size * 0.4, size * 0.35]
    const opacities = [0.6, 0.4, 0.5]

    // Static preview
    if (isStatic) {
        return (
            <div style={{ 
                width: "100%", 
                height: "100%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                ...style 
            }}>
                <div
                    style={{
                        width: size,
                        height: size,
                        borderRadius: "50%",
                        backgroundColor: color,
                        opacity: 0.6,
                        boxShadow: `10px 10px ${shadowBlur}px 0 ${shadowColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            width: size * 0.3,
                            height: size * 0.3,
                            backgroundColor: innerColor,
                            borderRadius: "50%",
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 9999,
                overflow: "hidden",
                ...style,
            }}
        >
            {useFilter && (
                <svg style={{ position: "absolute", width: 0, height: 0 }}>
                    <filter id="blob-filter">
                        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation={filterStdDeviation} />
                        <feColorMatrix 
                            in="blur" 
                            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 35 -10" 
                        />
                    </filter>
                </svg>
            )}

            <div style={{ 
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                filter: useFilter ? "url(#blob-filter)" : undefined 
            }}>
                {Array.from({ length: trailCount }).map((_, i) => (
                    <div
                        key={i}
                        ref={el => (blobsRef.current[i] = el)}
                        style={{
                            position: "absolute",
                            width: sizes[i],
                            height: sizes[i],
                            borderRadius: "50%",
                            backgroundColor: color,
                            opacity: opacities[i],
                            boxShadow: `10px 10px ${shadowBlur}px 0 ${shadowColor}`,
                            transform: "translate(-50%, -50%)",
                            willChange: "transform",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                width: innerSizes[i],
                                height: innerSizes[i],
                                top: (sizes[i] - innerSizes[i]) / 2,
                                left: (sizes[i] - innerSizes[i]) / 2,
                                backgroundColor: innerColor,
                                borderRadius: "50%",
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

addPropertyControls(LiquidBlob, {
    color: {
        type: ControlType.Color,
        title: "Blob Color",
        defaultValue: "#5227FF",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 125,
        min: 50,
        max: 300,
        unit: "px",
    },
    trailCount: {
        type: ControlType.Number,
        title: "Trail Count",
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
    },
    innerColor: {
        type: ControlType.Color,
        title: "Inner Color",
        defaultValue: "rgba(255,255,255,0.8)",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.75)",
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 5,
        min: 0,
        max: 20,
        unit: "px",
    },
    useFilter: {
        type: ControlType.Boolean,
        title: "Liquid Filter",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    filterStdDeviation: {
        type: ControlType.Number,
        title: "Filter Blur",
        defaultValue: 30,
        min: 10,
        max: 50,
        step: 1,
    },
    fastDuration: {
        type: ControlType.Number,
        title: "Lead Speed",
        defaultValue: 0.1,
        min: 0.05,
        max: 0.5,
        step: 0.05,
    },
    slowDuration: {
        type: ControlType.Number,
        title: "Trail Speed",
        defaultValue: 0.5,
        min: 0.1,
        max: 1.5,
        step: 0.1,
    },
})
