// ═══════════════════════════════════════════════════════════════════════════
//
//  Infinite Image Spin — Vertical scrolling image carousel for Framer
//
//  OVERVIEW:
//  Single card with vertical scroll effect. Holds 3 images (or customizable)
//  and scrolls through them via CSS transitions (GPU-accelerated, low CPU).
//
//  CORE FEATURES:
//  • Infinite vertical scroll: Scrolls through images in a loop
//  • Shuffle images: Image order is randomly shuffled
//  • Pause when off-screen: Uses IntersectionObserver to save CPU
//  • 3D Drum Roll: Optional rotateX + scale animation per scroll step
//
//  PERFORMANCE:
//  • Track transform updated via ref (no React re-renders during scroll)
//  • CSS containment for layout isolation; willChange only on track
//  • Memoized styles and stable dependency keys
//
//  https://AliThemes.com
//
// ═══════════════════════════════════════════════════════════════════════════

import * as React from "react"
import { useEffect, useRef, useMemo, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const EASE_IN_OUT = "cubic-bezier(0.42, 0, 0.58, 1)"

function getImages(images: string[], imagesPerItem: number): string[] {
    const n = images.length
    if (n === 0) return []
    const result: string[] = []
    for (let j = 0; j < imagesPerItem; j++) {
        result.push(images[j % n])
    }
    return result
}

const DEFAULT_IMAGES = [
    "https://cdn-icons-png.flaticon.com/256/732/732228.png",
    "https://cdn-icons-png.flaticon.com/256/732/732221.png",
    "https://cdn-icons-png.flaticon.com/256/174/174854.png",
    "https://cdn-icons-png.flaticon.com/256/5968/5968764.png",
    "https://cdn-icons-png.flaticon.com/256/5968/5968705.png",
]

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function InfiniteImageSpin(props: Record<string, any>) {
    const {
        images,
        imagesPerItem,
        borderRadius,
        borderColor,
        backgroundColor,
        imageHeight,
        scrollDuration,
        pauseMin,
        pauseMax,
        initialDelayMax,
        shuffleOrder,
        enable3D,
        perspective3D,
        rotateX3D,
        infiniteLoop,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const cancelledRef = useRef(false)

    const imageList = useMemo(
        () => (images?.length > 0 ? images : DEFAULT_IMAGES),
        [images]
    )
    const imageListKey = imageList.join("\u0000")

    const shuffledImages = useMemo(() => {
        const items = getImages(imageList, imagesPerItem)
        return shuffleOrder
            ? items.slice().sort(() => Math.random() - 0.5)
            : items
    }, [imageListKey, imagesPerItem, shuffleOrder])

    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.1, rootMargin: "50px" }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    useEffect(() => {
        if (shuffledImages.length === 0 || !isVisible) return

        const trackEl = trackRef.current
        if (!trackEl) return

        cancelledRef.current = false

        const transitionValue = `transform ${scrollDuration}s ${EASE_IN_OUT}`
        const durationMs = scrollDuration * 1000

        const easeInOut = (t: number) =>
            t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

        const animate3DStep = (fromY: number, toY: number): Promise<void> => {
            return new Promise((resolve) => {
                const start = performance.now()
                const tick = (now: number) => {
                    if (cancelledRef.current) {
                        resolve()
                        return
                    }
                    const rawP = Math.min(1, (now - start) / durationMs)
                    const p = easeInOut(rawP)

                    const currentY = fromY + (toY - fromY) * p
                    const rotation = rotateX3D * Math.sin(Math.PI * rawP)
                    const s = 1 - 0.04 * Math.sin(Math.PI * rawP)

                    trackEl.style.transform = `perspective(${perspective3D}px) rotateX(${rotation.toFixed(2)}deg) translate3d(0, ${currentY.toFixed(1)}px, 0) scale(${s.toFixed(4)})`

                    if (rawP < 1) {
                        requestAnimationFrame(tick)
                    } else {
                        trackEl.style.transform = `translate3d(0, ${toY}px, 0)`
                        resolve()
                    }
                }
                requestAnimationFrame(tick)
            })
        }

        if (!enable3D) {
            trackEl.style.transition = transitionValue
        } else {
            trackEl.style.transition = "none"
        }
        trackEl.style.transform = "translate3d(0, 0, 0)"

        const N = shuffledImages.length

        const scrollStep = async (fromY: number, toY: number) => {
            if (enable3D) {
                await animate3DStep(fromY, toY)
            } else {
                trackEl.style.transform = `translate3d(0, ${toY}px, 0)`
                await delay(durationMs)
            }
        }

        const silentReset = (): Promise<void> =>
            new Promise((resolve) => {
                trackEl.style.transition = "none"
                trackEl.style.transform = "translate3d(0, 0, 0)"
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (!enable3D)
                            trackEl.style.transition = transitionValue
                        resolve()
                    })
                })
            })

        const randomPause = () =>
            delay((pauseMin + Math.random() * (pauseMax - pauseMin)) * 1000)

        const runInfinite = async () => {
            if (cancelledRef.current) return
            await delay(Math.random() * initialDelayMax * 1000)
            if (cancelledRef.current) return

            let cyclePos = 0

            while (!cancelledRef.current) {
                await randomPause()
                if (cancelledRef.current) return

                const fromY = -cyclePos * imageHeight
                const toY = -(cyclePos + 1) * imageHeight

                await scrollStep(fromY, toY)
                if (cancelledRef.current) return

                cyclePos++

                if (cyclePos >= N) {
                    await silentReset()
                    cyclePos = 0
                }
            }
        }

        const runSequence = async () => {
            if (cancelledRef.current) return
            await delay(Math.random() * initialDelayMax * 1000)
            if (cancelledRef.current) return

            for (let i = 0; i < N; i++) {
                await randomPause()
                if (cancelledRef.current) return

                await scrollStep(-i * imageHeight, -(i + 1) * imageHeight)
                if (cancelledRef.current) return
            }

            await silentReset()
            if (!cancelledRef.current) requestAnimationFrame(runSequence)
        }

        if (infiniteLoop) {
            runInfinite()
        } else {
            runSequence()
        }

        return () => {
            cancelledRef.current = true
        }
    }, [
        imageListKey,
        imagesPerItem,
        shuffleOrder,
        imageHeight,
        scrollDuration,
        pauseMin,
        pauseMax,
        initialDelayMax,
        isVisible,
        enable3D,
        perspective3D,
        rotateX3D,
        infiniteLoop,
    ])

    const slideStyle = useMemo<React.CSSProperties>(
        () => ({
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: imageHeight,
            minHeight: imageHeight,
            flexShrink: 0,
        }),
        [imageHeight]
    )

    const imgStyle = useMemo<React.CSSProperties>(
        () => ({
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain" as const,
            display: "block",
        }),
        []
    )

    const trackStyle = useMemo<React.CSSProperties>(
        () => ({
            position: "absolute" as const,
            top: 0,
            left: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column" as const,
            flexShrink: 0,
            willChange: "transform",
            contain: "layout" as const,
            transformOrigin: "center center",
            ...(enable3D && { transformStyle: "preserve-3d" as const }),
        }),
        [enable3D]
    )

    const containerStyle = useMemo<React.CSSProperties>(
        () => ({
            width: "100%",
            height: "100%",
            borderRadius,
            border: `1px solid ${borderColor}`,
            backgroundColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxSizing: "border-box",
            position: "relative",
            contain: "layout" as const,
        }),
        [borderRadius, borderColor, backgroundColor]
    )

    const viewportStyle = useMemo<React.CSSProperties>(
        () => ({
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            contain: "layout" as const,
        }),
        []
    )

    const windowStyle = useMemo<React.CSSProperties>(
        () => ({
            position: "relative" as const,
            overflow: "hidden",
            width: "100%",
            height: imageHeight,
            flexShrink: 0,
            margin: "auto",
            ...(enable3D && {
                perspective: `${perspective3D}px`,
                perspectiveOrigin: "center center",
            }),
        }),
        [imageHeight, enable3D, perspective3D]
    )

    return (
        <div ref={containerRef} style={containerStyle}>
            <div style={viewportStyle}>
                <div style={windowStyle}>
                    <div ref={trackRef} style={trackStyle}>
                        {shuffledImages.map((src, i) => (
                            <div key={`${src}-${i}`} style={slideStyle}>
                                <img
                                    src={src}
                                    alt=""
                                    decoding="async"
                                    style={imgStyle}
                                />
                            </div>
                        ))}
                        <div style={slideStyle}>
                            <img
                                src={shuffledImages[0]}
                                alt=""
                                decoding="async"
                                style={imgStyle}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Defaults ────────────────────────────────────────────────────────────

InfiniteImageSpin.defaultProps = {
    images: [],
    imagesPerItem: 3,
    borderRadius: 16,
    borderColor: "#DFDFDF",
    backgroundColor: "#FEFEFE",
    imageHeight: 70,
    scrollDuration: 1,
    pauseMin: 1,
    pauseMax: 1.8,
    initialDelayMax: 1.5,
    shuffleOrder: true,
    infiniteLoop: true,
    enable3D: false,
    perspective3D: 600,
    rotateX3D: 25,
}

// ─── Property Controls ───────────────────────────────────────────────────

addPropertyControls(InfiniteImageSpin, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
    },

    imagesPerItem: {
        type: ControlType.Number,
        title: "Images Count",
        min: 2,
        max: 6,
        step: 1,
        description: "Number of images to scroll through",
    },

    // Layout
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 32,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        min: 40,
        max: 120,
        step: 5,
        description: "Height of each image slide",
    },

    // Animation
    scrollDuration: {
        type: ControlType.Number,
        title: "Scroll Duration",
        min: 0.3,
        max: 3,
        step: 0.1,
        description: "Seconds",
    },
    pauseMin: {
        type: ControlType.Number,
        title: "Pause Min",
        min: 0.2,
        max: 3,
        step: 0.1,
    },
    pauseMax: {
        type: ControlType.Number,
        title: "Pause Max",
        min: 0.5,
        max: 5,
        step: 0.1,
    },
    initialDelayMax: {
        type: ControlType.Number,
        title: "Initial Delay Max",
        min: 0,
        max: 4,
        step: 0.1,
    },
    shuffleOrder: {
        type: ControlType.Boolean,
        title: "Shuffle Order",
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    infiniteLoop: {
        type: ControlType.Boolean,
        title: "Infinite Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "On: scrolls continuously. Off: resets after each cycle.",
    },

    // 3D Effect
    enable3D: {
        type: ControlType.Boolean,
        title: "3D Effect",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    rotateX3D: {
        type: ControlType.Number,
        title: "3D Rotate X",
        defaultValue: 25,
        min: 5,
        max: 60,
        step: 1,
        description: "Peak rotation angle during scroll step",
        hidden: (p: any) => !p.enable3D,
    },
    perspective3D: {
        type: ControlType.Number,
        title: "3D Perspective",
        defaultValue: 600,
        min: 200,
        max: 1500,
        step: 50,
        description: "Lower = more dramatic 3D depth",
        hidden: (p: any) => !p.enable3D,
    },
})
