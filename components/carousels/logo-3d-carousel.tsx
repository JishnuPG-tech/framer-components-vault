import * as React from "react"
import { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- Constants ---
const FALLBACK_BG_COLOR = "#cbd5e1"
const MAX_SCREEN_WIDTH_BUFFER = 4840

// --- Types ---
interface FramerImageObj {
    src?: string
    width?: number
    height?: number
}

type FramerImage = string | FramerImageObj | null

interface LogoItem {
    image: FramerImage
}

interface Logo3DCarouselProps {
    width?: number
    height?: number
    logos: LogoItem[]
    itemHeight: number
    gap: number
    speed: number
    direction: "left" | "right"
    maxBlur: number
    blurEnd: number
    pauseOnHover: boolean
    easingResponsiveness: number
    enableDrag: boolean
    minScale: number
    maxScale: number
}

// --- Helper Functions ---
const getImageDimensions = (image: FramerImage, fallbackSize: number) => {
    const src = typeof image === "string" ? image : image?.src
    if (!src) return { width: fallbackSize, height: fallbackSize }

    if (typeof image === "object" && image?.width && image?.height) {
        return { width: image.width, height: image.height }
    }

    try {
        const url = new URL(src, "https://framer.com")
        const width = parseInt(url.searchParams.get("width") || "0", 10)
        const height = parseInt(url.searchParams.get("height") || "0", 10)
        if (width > 0 && height > 0) return { width, height }
    } catch {
        // Silently ignore URL parsing errors
    }

    return { width: fallbackSize, height: fallbackSize }
}

const calculateMagnification = (
    distanceFromCenter: number,
    screenCenter: number,
    avgScale: number,
    scaleConstant: number,
    piDivCenter: number,
    centerDivPi: number,
    minScale: number
) => {
    let warpedX: number
    let finalScale: number

    if (Math.abs(distanceFromCenter) <= screenCenter) {
        warpedX =
            avgScale * distanceFromCenter +
            scaleConstant *
                centerDivPi *
                Math.sin(distanceFromCenter * piDivCenter)
        finalScale =
            avgScale +
            scaleConstant * Math.cos(distanceFromCenter * piDivCenter)
    } else {
        const sign = Math.sign(distanceFromCenter)
        warpedX =
            sign * (avgScale * screenCenter) +
            minScale * (distanceFromCenter - sign * screenCenter)
        finalScale = minScale
    }

    return { warpedX, finalScale }
}

const drawFallbackRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
) => {
    ctx.fillStyle = FALLBACK_BG_COLOR
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, 8)
    ctx.fill()
}

// --- Main Component ---

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 800
 */

export default function Logo3DCarousel(props: Logo3DCarouselProps) {
    // 1. ADDED: Initialize the static renderer check
    const isStatic = useIsStaticRenderer()

    const {
        logos = [],
        itemHeight = 32,
        gap = 64,
        speed = 32,
        direction = "left",
        maxBlur = 4,
        blurEnd = 48,
        pauseOnHover = true,
        easingResponsiveness = 4,
        enableDrag = true,
        minScale = 0.1,
        maxScale = 2.0,
    } = props

    const propsRef = useRef({
        gap,
        speed,
        direction,
        maxBlur,
        blurEnd,
        pauseOnHover,
        easingResponsiveness,
        minScale,
        maxScale,
    })

    propsRef.current = {
        gap,
        speed,
        direction,
        maxBlur,
        blurEnd,
        pauseOnHover,
        easingResponsiveness,
        minScale,
        maxScale,
    }

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const globalOffsetRef = useRef(0)
    const isHoveredRef = useRef(false)

    const isDraggingRef = useRef(false)
    const lastDragXRef = useRef(0)

    const [containerWidth, setContainerWidth] = useState(0)
    const [loadedImages, setLoadedImages] = useState<
        (HTMLImageElement | null)[]
    >([])

    const containerHeight = itemHeight
    const baseItemHeight = itemHeight / maxScale

    const canvasPaddingY = Math.ceil(maxBlur) * 3
    const extendedCanvasHeight = containerHeight + canvasPaddingY * 2

    const { safeImages, renderCount, precalculatedWidths } = useMemo(() => {
        const rawImages = logos.map((logo) => logo.image)
        const sImages = rawImages?.length > 0 ? rawImages : [null]

        const widths = sImages.map((img) => {
            if (!img) return baseItemHeight
            const { width, height } = getImageDimensions(img, baseItemHeight)
            return (baseItemHeight / height) * width
        })

        const setWidth = widths.reduce((sum, w) => sum + w + gap, 0)

        const setsNeeded = Math.max(
            2,
            Math.ceil(MAX_SCREEN_WIDTH_BUFFER / (setWidth || 1))
        )

        return {
            safeImages: sImages,
            renderCount: setsNeeded * sImages.length,
            precalculatedWidths: widths,
        }
    }, [logos, baseItemHeight, gap])

    useLayoutEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setContainerWidth(entry.contentRect.width)
        })

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        let active = true
        const pendingImages: HTMLImageElement[] = []

        Promise.all(
            safeImages.map(
                (img) =>
                    new Promise<HTMLImageElement | null>((resolve) => {
                        const src = typeof img === "string" ? img : img?.src
                        if (!src) return resolve(null)

                        const image = new Image()
                        pendingImages.push(image)

                        image.crossOrigin = "anonymous"
                        image.onload = () => resolve(image)
                        image.onerror = () => resolve(null)
                        image.src = src
                    })
            )
        ).then((results) => {
            if (active) setLoadedImages(results)
        })

        return () => {
            active = false
            pendingImages.forEach((img) => {
                img.onload = null
                img.onerror = null
                img.src = ""
            })
        }
    }, [safeImages])

    // 2. UPDATED: Canvas render loop now respects `isStatic`
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (
            !canvas ||
            !container ||
            containerWidth === 0 ||
            loadedImages.length === 0
        )
            return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId: number = 0
        let lastTime = performance.now()
        let isVisible = false
        let hasRenderedOnce = false
        let lastRenderedOffset = globalOffsetRef.current

        let currentSpeed =
            propsRef.current.pauseOnHover && isHoveredRef.current
                ? 0
                : propsRef.current.speed

        const screenCenter = containerWidth / 2
        const piDivCenter = Math.PI / screenCenter
        const centerDivPi = screenCenter / Math.PI

        const positions = new Float32Array(renderCount)
        let wrapLength = 0
        let maxW = 0

        for (let i = 0; i < renderCount; i++) {
            const texIdx = i % safeImages.length
            const w = precalculatedWidths[texIdx] || baseItemHeight
            if (w > maxW) maxW = w
            positions[i] = wrapLength
            wrapLength += w + propsRef.current.gap
        }
        const minXBound = -maxW * 2

        const dpr = window.devicePixelRatio || 1

        canvas.width = containerWidth * dpr
        canvas.height = extendedCanvasHeight * dpr
        ctx.scale(dpr, dpr)
        ctx.imageSmoothingEnabled = true

        const render = (currentTime: number) => {
            // Bypass visibility check if rendering statically for the editor
            if (!isVisible && !isStatic) return

            const p = propsRef.current

            const scaleConstant = (p.maxScale - p.minScale) / 2
            const avgScale = p.minScale + scaleConstant
            const scaleRange = p.maxScale - p.minScale

            const blurEndRadius = screenCenter * (p.blurEnd / 100)
            const dirMultiplier = p.direction === "right" ? -1 : 1

            const delta = currentTime - lastTime
            lastTime = currentTime
            const dt = Math.min(delta / 1000, 0.05)

            // 3. UPDATED: Do not calculate movement/speed if rendering in static mode
            if (!isStatic) {
                const targetSpeed =
                    (p.pauseOnHover && isHoveredRef.current) ||
                    isDraggingRef.current
                        ? 0
                        : p.speed

                currentSpeed +=
                    (targetSpeed - currentSpeed) * p.easingResponsiveness * dt

                globalOffsetRef.current += currentSpeed * dt * dirMultiplier
            }

            const offsetChanged =
                Math.abs(globalOffsetRef.current - lastRenderedOffset) > 0.001

            const isIdle = Math.abs(currentSpeed) < 0.01 && !offsetChanged

            // 4. UPDATED: Stop the loop from persisting in static mode
            if (isIdle && hasRenderedOnce && !isStatic) {
                animationFrameId = requestAnimationFrame(render)
                return
            }

            hasRenderedOnce = true
            lastRenderedOffset = globalOffsetRef.current

            const currentOffset = globalOffsetRef.current
            ctx.clearRect(0, 0, containerWidth, extendedCanvasHeight)

            for (let i = 0; i < renderCount; i++) {
                const texIdx = i % safeImages.length
                const img = loadedImages[texIdx]
                const w = precalculatedWidths[texIdx] || baseItemHeight

                const baseX = positions[i]

                let relativeX = (baseX - currentOffset - minXBound) % wrapLength
                if (relativeX < 0) relativeX += wrapLength
                const currentX = relativeX + minXBound

                const unwarpedCenter = currentX + w / 2
                const distanceFromCenter = unwarpedCenter - screenCenter

                const { warpedX, finalScale } = calculateMagnification(
                    distanceFromCenter,
                    screenCenter,
                    avgScale,
                    scaleConstant,
                    piDivCenter,
                    centerDivPi,
                    p.minScale
                )

                const finalX = screenCenter + warpedX - w / 2

                const absDist = Math.abs(distanceFromCenter)
                let exactBlurAmount = 0

                if (p.maxBlur > 0) {
                    if (blurEndRadius <= 0) {
                        exactBlurAmount = p.maxBlur
                    } else if (absDist >= blurEndRadius) {
                        exactBlurAmount = p.maxBlur
                    } else {
                        const blurProgress = absDist / blurEndRadius
                        const smoothProgress =
                            blurProgress * blurProgress * (3 - 2 * blurProgress)
                        exactBlurAmount = smoothProgress * p.maxBlur
                    }
                }

                const depthRatio = (finalScale - p.minScale) / scaleRange
                const opacity = 0.45 + 0.55 * depthRatio

                const centerX = finalX + w / 2
                const centerY = extendedCanvasHeight / 2

                ctx.save()
                ctx.translate(centerX, centerY)
                ctx.scale(finalScale, finalScale)
                ctx.rotate(0.001)

                ctx.globalAlpha = opacity

                const localBlurAmount = exactBlurAmount / finalScale
                ctx.filter =
                    localBlurAmount > 0.1
                        ? `blur(${localBlurAmount}px)`
                        : "none"

                const drawX = -w / 2
                const drawY = -baseItemHeight / 2

                if (img) {
                    ctx.drawImage(img, drawX, drawY, w, baseItemHeight)
                } else {
                    drawFallbackRect(ctx, drawX, drawY, w, baseItemHeight)
                }

                ctx.restore()
            }

            // 5. UPDATED: Only request a new frame if we are NOT in the editor
            if (!isStatic) {
                animationFrameId = requestAnimationFrame(render)
            }
        }

        // 6. UPDATED: Either draw once for the editor, or set up the observer for the live site
        if (isStatic) {
            isVisible = true
            render(performance.now())
        } else {
            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    isVisible = true
                    lastTime = performance.now()
                    if (!animationFrameId) {
                        animationFrameId = requestAnimationFrame(render)
                    }
                } else {
                    isVisible = false
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId)
                        animationFrameId = 0
                    }
                }
            })

            observer.observe(container)

            return () => {
                observer.disconnect()
                if (animationFrameId) cancelAnimationFrame(animationFrameId)
            }
        }

        // Added `isStatic` to the dependency array
    }, [
        containerWidth,
        loadedImages,
        renderCount,
        precalculatedWidths,
        baseItemHeight,
        extendedCanvasHeight,
        isStatic,
    ])

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enableDrag || logos.length === 0 || isStatic) return
        isDraggingRef.current = true
        lastDragXRef.current = e.clientX

        e.currentTarget.setPointerCapture(e.pointerId)

        if (containerRef.current) containerRef.current.style.cursor = "grabbing"
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enableDrag || !isDraggingRef.current || isStatic) return

        const deltaX = e.clientX - lastDragXRef.current
        lastDragXRef.current = e.clientX

        globalOffsetRef.current -= deltaX
    }

    const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enableDrag || isStatic) return
        isDraggingRef.current = false
        e.currentTarget.releasePointerCapture(e.pointerId)
        if (containerRef.current) containerRef.current.style.cursor = "grab"
    }

    return (
        <div
            ref={containerRef}
            onPointerEnter={() => (isHoveredRef.current = true)}
            onPointerLeave={() => (isHoveredRef.current = false)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            style={{
                width: "100%",
                height: containerHeight,
                position: "relative",
                overflow: "visible",
                cursor:
                    logos.length > 0
                        ? enableDrag
                            ? "grab"
                            : "pointer"
                        : "default",
                touchAction: enableDrag ? "pan-y" : "auto",
                userSelect: enableDrag ? "none" : "auto",
                WebkitUserSelect: enableDrag ? "none" : "auto",
                backgroundColor:
                    logos.length === 0
                        ? "rgba(143, 143, 143, 0.15)"
                        : "transparent",
                borderRadius: logos.length === 0 ? 8 : 0,
            }}
        >
            {logos.length === 0 ? (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                        fontFamily: "system-ui, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                >
                    Add logos from the props panel
                </div>
            ) : (
                <canvas
                    ref={canvasRef}
                    style={{
                        width: "100%",
                        height: extendedCanvasHeight,
                        position: "absolute",
                        top: -canvasPaddingY,
                        left: 0,
                        pointerEvents: "none",
                        display: "block",
                        WebkitMaskImage:
                            "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
                        maskImage:
                            "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
                    }}
                />
            )}
        </div>
    )
}

// --- Property Controls ---
addPropertyControls(Logo3DCarousel, {
    logos: {
        type: ControlType.Array,
        title: "Logos",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Logo",
                },
            },
        },
        maxCount: 20,
    },
    enableDrag: {
        title: "Enable Drag",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    maxScale: {
        title: "Max Scale (Center)",
        type: ControlType.Number,
        defaultValue: 2.0,
        min: 1,
        max: 3,
        step: 0.1,
        displayStepper: true,
    },
    minScale: {
        title: "Min Scale (Edges)",
        type: ControlType.Number,
        defaultValue: 0.1,
        min: 0.1,
        max: 1,
        step: 0.1,
        displayStepper: true,
    },
    itemHeight: {
        title: "Max Height",
        type: ControlType.Number,
        defaultValue: 32,
        min: 20,
        max: 600,
        step: 1,
    },
    gap: {
        title: "Gap",
        type: ControlType.Number,
        defaultValue: 64,
        min: 0,
        max: 200,
        step: 1,
    },
    speed: {
        title: "Speed",
        type: ControlType.Number,
        defaultValue: 32,
        min: 0,
        max: 96,
        step: 1,
    },
    direction: {
        title: "Direction",
        type: ControlType.Enum,
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    maxBlur: {
        title: "Max Blur",
        type: ControlType.Number,
        defaultValue: 4,
        min: 0,
        max: 8,
        step: 0.5,
    },
    blurEnd: {
        title: "Blur Max (%)",
        description:
            "Distance from center where the blur reaches its max value.",
        type: ControlType.Number,
        defaultValue: 64,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    pauseOnHover: {
        title: "Pause on Hover",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    easingResponsiveness: {
        title: "Hover/Drag Easing",
        description: "Lower numbers = slower easing",
        type: ControlType.Number,
        defaultValue: 4,
        min: 1,
        max: 50,
        step: 1,
    },
})
