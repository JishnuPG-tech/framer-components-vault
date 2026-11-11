// Wipe-to-reveal animation - reveal an image by wiping/dragging across it
// User goal: Fix the provider error for the Image Wipe Reveal Framer component.

import React, {
    useRef,
    useState,
    useCallback,
    useEffect,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Safe startTransition for React 18+ with fallback
const startTransition = (callback: () => void) => {
    if (typeof (React as any).startTransition === "function") {
        ;(React as any).startTransition(callback)
    } else {
        callback()
    }
}

// Fixed padding around the canvas so changing blurAmount does not change
// the perceived zoom level of the image.
const CANVAS_PADDING = 40

interface Border {
    borderWidth?: number
    borderStyle?: string
    borderColor?: string
}

interface ImageWipeRevealProps {
    backgroundImage: { src: string; alt: string }
    brushSize: number
    brushColor: string
    showBrush: boolean
    showHint: boolean
    hintText: string
    hintColor: string
    hintFont: any
    hintBackgroundColor: string
    hintBorder?: Border
    hintPadding: string
    hintRadius: string
    hintShadow: string
    blurAmount: number
    overlayTint: string
    interactionMode: "drag" | "hover"
    hoverHintText: string
    imageFit: "fit" | "fill" | "stretch"
    fitBackgroundColor: string
}

/**
 * Wipe to Reveal
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageWipeReveal(props: ImageWipeRevealProps) {
    const {
        backgroundImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Base Image",
        },
        brushSize = 50,
        brushColor = "#FFFFFF",
        showBrush = true,
        showHint = true,
        hintText = "Click and drag to reveal the image",
        hoverHintText = "Hover to reveal the image",
        hintColor = "#FFFFFF",
        hintBackgroundColor = "rgba(0, 0, 0, 0.5)",
        hintBorder = {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(255, 255, 255, 0.2)",
        },
        hintPadding = "12px",
        hintRadius = "8px",
        hintShadow = "0 4px 6px rgba(0,0,0,0.1)",
        hintFont = {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "0.02em",
            lineHeight: "1.3em",
        },
        blurAmount = 16,
        overlayTint = "rgba(0,0,0,0.4)",
        interactionMode = "drag",
        imageFit = "fill",
        fitBackgroundColor = "#000000",
    } = props

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const sourceImageRef = useRef<HTMLImageElement | null>(null)
    const lastPointRef = useRef<{ x: number; y: number } | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
    const [showCursor, setShowCursor] = useState(false)
    const [hintVisible, setHintVisible] = useState(showHint)
    const mouseMoveListenerRef = useRef<((event: any) => void) | null>(null)
    const mouseUpListenerRef = useRef<(() => void) | null>(null)
    const touchMoveListenerRef = useRef<((event: any) => void) | null>(null)
    const touchEndListenerRef = useRef<(() => void) | null>(null)
    const isStatic = useIsStaticRenderer()
    const [isSafari, setIsSafari] = useState(false)
    const isSafariRef = useRef(false)
    const [overlayReady, setOverlayReady] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        const ua = window.navigator.userAgent
        const isSafariBrowser =
            /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua)
        isSafariRef.current = isSafariBrowser
        startTransition(() => setIsSafari(isSafariBrowser))
    }, [])

    useEffect(() => {
        if (isStatic) return

        const handleInitialMouseMove = (e: MouseEvent) => {
            const container = containerRef.current
            if (!container) return
            const rect = container.getBoundingClientRect()
            if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            ) {
                startTransition(() => {
                    setCursorPos({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                    })
                    setShowCursor(true)
                })
            }
        }

        window.addEventListener("mousemove", handleInitialMouseMove, {
            once: true,
        })
        return () => {
            window.removeEventListener("mousemove", handleInitialMouseMove)
        }
    }, [isStatic])

    useEffect(() => {
        startTransition(() => setHintVisible(showHint))
    }, [showHint])

    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = container.getBoundingClientRect()
        const dpr = 1
        const padding = CANVAS_PADDING

        // Make the drawing area slightly larger than the visible container
        // and draw the blurred image across the full canvas so the blur
        // always covers the complete image, including left/right edges.
        canvas.width = rect.width + padding * 2
        canvas.height = rect.height + padding * 2

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const img = sourceImageRef.current
        if (!img || !img.complete) return

        ctx.globalCompositeOperation = "source-over"

        // Apply blur to the image content directly on the canvas so revealed areas are perfectly sharp
        if (!isSafariRef.current) {
            ctx.filter = `blur(${blurAmount}px)`
        }

        // Calculate draw dimensions based on the selected image fit mode
        // We calculate relative to the container size (rect) to match the CSS background-size behavior
        // and then offset by padding to position correctly on the canvas.
        const imgRatio = img.naturalWidth / img.naturalHeight
        const containerRatio = rect.width / rect.height
        let drawWidth, drawHeight, drawX, drawY

        if (imageFit === "stretch") {
            // Stretch the blurred image so it fully covers the canvas area that maps to the
            // visible image, preventing unblurred stripes at the left/right edges.
            drawWidth = rect.width + padding * 2
            drawHeight = rect.height + padding * 2
            drawX = 0
            drawY = 0
        } else {
            // For blur coverage we intentionally use a "cover"-style fit for
            // "fill" so the blurred overlay always extends all the way
            // to the visible image edges, while "fit" uses a
            // "contain" behavior that still overdraws slightly beyond
            // the visible area so the blur reaches the very edges.
            const useCover = imageFit === "fill"

            if (useCover) {
                // Cover behavior (image covers the entire canvas, may be cropped)
                if (imgRatio > containerRatio) {
                    drawHeight = rect.height + padding * 2
                    drawWidth = drawHeight * imgRatio
                    drawY = 0
                    drawX = (canvas.width - drawWidth) / 2
                } else {
                    drawWidth = rect.width + padding * 2
                    drawHeight = drawWidth / imgRatio
                    drawX = 0
                    drawY = (canvas.height - drawHeight) / 2
                }
            } else {
                // Contain behavior (entire image visible, may letterbox).
                // We calculate based on the container but extend drawing
                // beyond the visible bounds so that blur always covers
                // right up to (and slightly past) the image edges.
                if (imgRatio > containerRatio) {
                    // Image is wider than container -> letterbox top/bottom.
                    // Make the drawn width span the full canvas width so
                    // the blur reaches the left/right edges.
                    drawWidth = rect.width + padding * 2
                    drawHeight = drawWidth / imgRatio
                    drawX = 0
                    drawY = (canvas.height - drawHeight) / 2
                } else {
                    // Image is taller than container -> letterbox left/right.
                    // Make the drawn height span the full canvas height so
                    // the blur reaches the top/bottom edges.
                    drawHeight = rect.height + padding * 2
                    drawWidth = drawHeight * imgRatio
                    drawY = 0
                    drawX = (canvas.width - drawWidth) / 2
                }
            }
        }

        // Draw the main image across the canvas
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

        // Reset filter so overlay tint is not blurred
        if (!isSafariRef.current) {
            ctx.filter = "none"
        }

        // Apply the overlay tint only over the actual image area when using
        // "fit" so the letterbox bars stay clean, but cover the full
        // canvas for "fill" and "stretch" so the blur reaches the edges.
        ctx.fillStyle = overlayTint
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.globalCompositeOperation = "destination-out"

        startTransition(() => {
            setHintVisible(showHint)
            setOverlayReady(true)
        })
    }, [showHint, blurAmount, overlayTint, imageFit])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        initCanvas()

        const container = containerRef.current
        if (!container || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(() => {
            initCanvas()
        })

        observer.observe(container)

        return () => {
            observer.disconnect()
        }
    }, [initCanvas, isStatic])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        if (!isSafari) return
        const canvas = canvasRef.current
        if (!canvas) return

        const originalTransform = canvas.style.transform || "translate3d(0,0,0)"
        canvas.style.transform = `${originalTransform} translateZ(0.0001px)`

        const id = window.requestAnimationFrame(() => {
            canvas.style.transform = originalTransform
        })

        return () => {
            window.cancelAnimationFrame(id)
        }
    }, [blurAmount, isSafari, isStatic])

    const draw = useCallback(
        (x: number, y: number, prevPoint?: { x: number; y: number } | null) => {
            const canvas = canvasRef.current
            if (!canvas) return

            const ctx = canvas.getContext("2d")
            if (!ctx) return

            const padding = CANVAS_PADDING
            const drawX = x + padding
            const drawY = y + padding
            const radius = brushSize / 2

            ctx.globalCompositeOperation = "destination-out"

            const stamp = (sx: number, sy: number) => {
                // Softer radial gradient with a crisp inner core and feathered outer edge
                // for a cleaner-looking brush without visible banding.
                const softRadius = radius * 1.05
                const gradient = ctx.createRadialGradient(
                    sx,
                    sy,
                    0,
                    sx,
                    sy,
                    softRadius
                )
                gradient.addColorStop(0, "rgba(0,0,0,1)")
                gradient.addColorStop(0.7, "rgba(0,0,0,1)")
                gradient.addColorStop(1, "rgba(0,0,0,0)")
                ctx.fillStyle = gradient

                ctx.beginPath()
                ctx.arc(sx, sy, softRadius, 0, Math.PI * 2)
                ctx.fill()
            }

            if (prevPoint) {
                const prevX = prevPoint.x + padding
                const prevY = prevPoint.y + padding
                const dx = drawX - prevX
                const dy = drawY - prevY
                const distance = Math.hypot(dx, dy)
                // Smaller step for more overlap between stamps, which smooths
                // out the stroke and makes the wipe animation feel cleaner.
                const step = Math.max(1, radius / 6)
                const steps = Math.max(1, Math.floor(distance / step))

                for (let i = 0; i <= steps; i++) {
                    const t = i / steps
                    const sx = prevX + dx * t
                    const sy = prevY + dy * t
                    stamp(sx, sy)
                }
            } else {
                stamp(drawX, drawY)
            }
        },
        [brushSize]
    )

    // Define endDrawing before beginDrawing to avoid "used before declaration" issues
    const endDrawing = useCallback(() => {
        if (isStatic) return
        startTransition(() => setIsDrawing(false))
        lastPointRef.current = null

        if (typeof window !== "undefined") {
            if (mouseMoveListenerRef.current) {
                window.removeEventListener(
                    "mousemove",
                    mouseMoveListenerRef.current
                )
                mouseMoveListenerRef.current = null
            }
            if (mouseUpListenerRef.current) {
                window.removeEventListener(
                    "mouseup",
                    mouseUpListenerRef.current
                )
                mouseUpListenerRef.current = null
            }
            if (touchMoveListenerRef.current) {
                window.removeEventListener(
                    "touchmove",
                    touchMoveListenerRef.current
                )
                touchMoveListenerRef.current = null
            }
            if (touchEndListenerRef.current) {
                window.removeEventListener(
                    "touchend",
                    touchEndListenerRef.current
                )
                touchEndListenerRef.current = null
            }
        }
    }, [isStatic])

    const beginDrawing = useCallback(() => {
        if (interactionMode === "hover") return

        startTransition(() => {
            setIsDrawing(true)
            setHintVisible(false)
        })

        lastPointRef.current = null

        if (typeof window !== "undefined") {
            if (!mouseMoveListenerRef.current) {
                const handleGlobalMouseMove = (e: any) => {
                    const container = containerRef.current
                    if (!container) return

                    const rect = container.getBoundingClientRect()
                    const localX = e.clientX - rect.left
                    const localY = e.clientY - rect.top
                    startTransition(() => {
                        setCursorPos({
                            x: localX,
                            y: localY,
                        })
                    })
                    draw(localX, localY, lastPointRef.current)
                    lastPointRef.current = { x: localX, y: localY }
                }

                mouseMoveListenerRef.current = handleGlobalMouseMove
                window.addEventListener("mousemove", handleGlobalMouseMove)
            }

            if (!mouseUpListenerRef.current) {
                const handleGlobalMouseUp = () => {
                    endDrawing()
                }

                mouseUpListenerRef.current = handleGlobalMouseUp
                window.addEventListener("mouseup", handleGlobalMouseUp)
            }

            if (!touchMoveListenerRef.current) {
                const handleGlobalTouchMove = (e: any) => {
                    e.preventDefault()
                    const touch = e.touches[0]
                    if (!touch) return

                    const container = containerRef.current
                    if (!container) return

                    const rect = container.getBoundingClientRect()
                    const localX = touch.clientX - rect.left
                    const localY = touch.clientY - rect.top
                    startTransition(() => {
                        setCursorPos({
                            x: localX,
                            y: localY,
                        })
                    })
                    draw(localX, localY, lastPointRef.current)
                    lastPointRef.current = { x: localX, y: localY }
                }

                touchMoveListenerRef.current = handleGlobalTouchMove
                window.addEventListener("touchmove", handleGlobalTouchMove, {
                    passive: false,
                })
            }

            if (!touchEndListenerRef.current) {
                const handleGlobalTouchEnd = () => {
                    endDrawing()
                }

                touchEndListenerRef.current = handleGlobalTouchEnd
                window.addEventListener("touchend", handleGlobalTouchEnd)
            }
        }
    }, [draw, endDrawing, interactionMode])

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (isStatic) return
            const container = containerRef.current
            if (!container) return
            const rect = container.getBoundingClientRect()
            const localX = e.clientX - rect.left
            const localY = e.clientY - rect.top
            beginDrawing()
            startTransition(() => {
                setCursorPos({ x: localX, y: localY })
            })
            draw(localX, localY, lastPointRef.current)
            lastPointRef.current = { x: localX, y: localY }
        },
        [draw, isStatic, beginDrawing]
    )

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (isStatic) return

            const container = containerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()
            const localX = e.clientX - rect.left
            const localY = e.clientY - rect.top
            startTransition(() => {
                setCursorPos({
                    x: localX,
                    y: localY,
                })
            })

            if (interactionMode === "hover" || isDrawing) {
                startTransition(() => setHintVisible(false))
                draw(localX, localY, lastPointRef.current)
                lastPointRef.current = { x: localX, y: localY }
            }
        },
        [isDrawing, draw, isStatic, interactionMode]
    )

    const handleMouseUp = useCallback(() => {
        endDrawing()
    }, [endDrawing])

    const handleMouseEnter = useCallback(
        (e: React.MouseEvent) => {
            if (isStatic) return

            const container = containerRef.current
            if (!container) {
                startTransition(() => setShowCursor(true))
                return
            }

            const rect = container.getBoundingClientRect()
            const localX = e.clientX - rect.left
            const localY = e.clientY - rect.top

            startTransition(() => {
                setShowCursor(true)
                setCursorPos({ x: localX, y: localY })
            })

            if (e.buttons === 1) {
                beginDrawing()
                draw(localX, localY, lastPointRef.current)
                lastPointRef.current = { x: localX, y: localY }
            }
        },
        [isStatic, beginDrawing, draw]
    )

    const handleMouseLeave = useCallback(() => {
        if (isStatic) return
        startTransition(() => {
            setShowCursor(false)
        })
        endDrawing()
    }, [endDrawing, isStatic])

    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                if (mouseMoveListenerRef.current) {
                    window.removeEventListener(
                        "mousemove",
                        mouseMoveListenerRef.current
                    )
                    mouseMoveListenerRef.current = null
                }
                if (mouseUpListenerRef.current) {
                    window.removeEventListener(
                        "mouseup",
                        mouseUpListenerRef.current
                    )
                    mouseUpListenerRef.current = null
                }
                if (touchMoveListenerRef.current) {
                    window.removeEventListener(
                        "touchmove",
                        touchMoveListenerRef.current
                    )
                    touchMoveListenerRef.current = null
                }
                if (touchEndListenerRef.current) {
                    window.removeEventListener(
                        "touchend",
                        touchEndListenerRef.current
                    )
                    touchEndListenerRef.current = null
                }
            }
        }
    }, [])

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (isStatic) return
            const touch = e.touches[0]
            if (!touch) return
            const container = containerRef.current
            if (!container) return
            const rect = container.getBoundingClientRect()
            const localX = touch.clientX - rect.left
            const localY = touch.clientY - rect.top
            beginDrawing()
            startTransition(() => {
                setCursorPos({ x: localX, y: localY })
            })
            draw(localX, localY, lastPointRef.current)
            lastPointRef.current = { x: localX, y: localY }
        },
        [draw, isStatic, beginDrawing]
    )

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (isStatic) return
            const touch = e.touches[0]
            if (!touch) return

            const container = containerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()
            const localX = touch.clientX - rect.left
            const localY = touch.clientY - rect.top
            startTransition(() => {
                setCursorPos({
                    x: localX,
                    y: localY,
                })
            })

            if (isDrawing) {
                draw(localX, localY, lastPointRef.current)
                lastPointRef.current = { x: localX, y: localY }
            }
        },
        [isDrawing, draw, isStatic]
    )

    const handleTouchEnd = useCallback(() => {
        endDrawing()
    }, [endDrawing])

    const currentHintText =
        interactionMode === "hover" ? hoverHintText : hintText

    const backgroundSize =
        imageFit === "stretch"
            ? "100% 100%"
            : imageFit === "fit"
              ? "contain"
              : "cover"

    if (isStatic) {
        return (
            <div
                ref={containerRef}
                role="img"
                aria-label={backgroundImage.alt}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    cursor: "default",
                    userSelect: "none",
                    touchAction: "none",
                    backgroundColor:
                        imageFit === "fit" ? fitBackgroundColor : "transparent",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${backgroundImage.src})`,
                        backgroundSize,
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        filter: `blur(${blurAmount}px)`,
                    }}
                    aria-hidden="true"
                />
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: overlayTint,
                    }}
                    aria-hidden="true"
                />

                {showHint && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            padding: hintPadding,
                            background: hintBackgroundColor,
                            color: hintColor,
                            borderRadius: hintRadius,
                            fontSize: 14,
                            pointerEvents: "none",
                            textAlign: "center",
                            boxShadow: hintShadow,
                            borderWidth: hintBorder?.borderWidth,
                            borderStyle: hintBorder?.borderStyle,
                            borderColor: hintBorder?.borderColor,
                            letterSpacing: "0.02em",
                            zIndex: 10,
                            ...hintFont,
                        }}
                    >
                        {currentHintText}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            role="img"
            aria-label={backgroundImage.alt}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: isStatic || !showBrush ? "default" : "none",
                userSelect: "none",
                touchAction: "none",
                backgroundColor:
                    imageFit === "fit" ? fitBackgroundColor : "transparent",
            }}
            onMouseDown={isStatic ? undefined : handleMouseDown}
            onMouseMove={isStatic ? undefined : handleMouseMove}
            onMouseUp={isStatic ? undefined : handleMouseUp}
            onMouseEnter={isStatic ? undefined : handleMouseEnter}
            onMouseLeave={isStatic ? undefined : handleMouseLeave}
            onTouchStart={isStatic ? undefined : handleTouchStart}
            onTouchMove={isStatic ? undefined : handleTouchMove}
            onTouchEnd={isStatic ? undefined : handleTouchEnd}
        >
            {/* Base image is only ever shown through the blurred/tinted overlay and wipe, never before the overlay is ready */}
            <img
                ref={sourceImageRef}
                src={backgroundImage.src}
                alt=""
                style={{ display: "none" }}
                onLoad={initCanvas}
            />
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${backgroundImage.src})`,
                    backgroundSize,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    visibility: overlayReady ? "visible" : "hidden",
                }}
                aria-hidden="true"
            />

            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: -CANVAS_PADDING,
                    left: -CANVAS_PADDING,
                    width: `calc(100% + ${CANVAS_PADDING * 2}px)`,
                    height: `calc(100% + ${CANVAS_PADDING * 2}px)`,
                    pointerEvents: "none",
                    opacity: overlayReady ? 1 : 0,
                    transform: "translate3d(0,0,0)",
                    transformOrigin: "center center",
                    willChange: "transform",
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                    filter: isSafari ? `blur(${blurAmount}px)` : "none",
                }}
            />

            {(isStatic ? showHint : showHint && hintVisible) && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        padding: hintPadding,
                        background: hintBackgroundColor,
                        color: hintColor,
                        borderRadius: hintRadius,
                        fontSize: 14,
                        pointerEvents: "none",
                        textAlign: "center",
                        boxShadow: hintShadow,
                        borderWidth: hintBorder?.borderWidth,
                        borderStyle: hintBorder?.borderStyle,
                        borderColor: hintBorder?.borderColor,
                        letterSpacing: "0.02em",
                        zIndex: 10,
                        ...hintFont,
                    }}
                >
                    {currentHintText}
                </div>
            )}

            {showBrush && showCursor && !isStatic && (
                <div
                    style={{
                        position: "absolute",
                        left: cursorPos.x - brushSize / 2,
                        top: cursorPos.y - brushSize / 2,
                        width: brushSize,
                        height: brushSize,
                        borderRadius: "50%",
                        WebkitBorderRadius: "50%",
                        border: `2px solid ${brushColor}`,
                        pointerEvents: "none",
                        opacity: 0.6,
                        transform: isDrawing
                            ? "scale(1.1) translateZ(0)"
                            : "scale(1) translateZ(0)",
                        WebkitTransform: isDrawing
                            ? "scale(1.1) translateZ(0)"
                            : "scale(1) translateZ(0)",
                        transition:
                            "transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)",
                        willChange: "transform, left, top",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        overflow: "hidden",
                        WebkitMaskImage:
                            "-webkit-radial-gradient(white, black)",
                    }}
                />
            )}
        </div>
    )
}

ImageWipeReveal.displayName = "ImageWipeReveal"

addPropertyControls(ImageWipeReveal, {
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Real Image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["fill", "fit", "stretch"],
        optionTitles: ["Fill", "Fit", "Stretch"],
        defaultValue: "fill",
    },
    fitBackgroundColor: {
        type: ControlType.Color,
        title: "Fit Border Color",
        defaultValue: "#000000",
        hidden: ({ imageFit }) => imageFit !== "fit",
    },
    brushSize: {
        type: ControlType.Number,
        title: "Brush Size",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 5,
        unit: "px",
    },
    brushColor: {
        type: ControlType.Color,
        title: "Brush Color",
        defaultValue: "#FFFFFF",
    },
    showBrush: {
        type: ControlType.Boolean,
        title: "Show Brush",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    interactionMode: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["drag", "hover"],
        optionTitles: ["Click & Drag", "Hover"],
        defaultValue: "drag",
        displaySegmentedControl: true,
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Show Hint",
        defaultValue: true,
    },
    hintText: {
        type: ControlType.String,
        title: "Hint Text",
        defaultValue: "Click and drag to reveal the image",
        hidden: ({ showHint }) => !showHint,
    },
    hoverHintText: {
        type: ControlType.String,
        title: "Hover Hint Text",
        defaultValue: "Hover to reveal the image",
        hidden: ({ showHint }) => !showHint,
    },
    hintColor: {
        type: ControlType.Color,
        title: "Hint Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showHint }) => !showHint,
    },
    hintBackgroundColor: {
        type: ControlType.Color,
        title: "Hint Bg",
        defaultValue: "rgba(0, 0, 0, 0.5)",
        hidden: ({ showHint }) => !showHint,
    },
    hintBorder: {
        type: ControlType.Border,
        title: "Hint Border",
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(255, 255, 255, 0.2)",
        },
        hidden: ({ showHint }) => !showHint,
    },
    hintPadding: {
        type: ControlType.Padding,
        title: "Hint Padding",
        defaultValue: "12px",
        hidden: ({ showHint }) => !showHint,
    },
    hintRadius: {
        type: ControlType.BorderRadius,
        title: "Hint Radius",
        defaultValue: "8px",
        hidden: ({ showHint }) => !showHint,
    },
    hintShadow: {
        type: ControlType.BoxShadow,
        title: "Hint Shadow",
        defaultValue: "0 4px 6px rgba(0,0,0,0.1)",
        hidden: ({ showHint }) => !showHint,
    },
    hintFont: {
        type: ControlType.Font,
        title: "Hint Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "0.02em",
            lineHeight: "1.3em",
        },
        hidden: ({ showHint }) => !showHint,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    overlayTint: {
        type: ControlType.Color,
        title: "Overlay Tint",
        defaultValue: "rgba(0,0,0,0.4)",
        description:
            "Built by Matthias Ölschlegel 💪\n[Explore more components](https://dub.sh/dsw13)",
    },
})
