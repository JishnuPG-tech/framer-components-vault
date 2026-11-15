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

import { AnimatePresence, motion, useInView, useMotionValue } from "framer-motion"

/*
Instructions:
Create a Framer component that follows the Framer component rules and achieves the user's goal.

CURSOR TRAILING IMAGE GALLERY — Original Mersi Shop Effect
When the user moves the mouse over the container area, a sequence of images appears and follows the cursor with a trailing/lagging motion.

Implementation:
- On mousemove over the trigger zone, show an image positioned at cursor (x, y)
- Image size: 280px × 380px, object-fit: cover
- Each image appears with slight delay (lerp: 0.08), creating a trailing feel
- Cycle through an array of images (8–12 images)
- Each new image appears every 80ms of continuous movement
- Previous images fade out: opacity 1 → 0 over 600ms
- Image entrance: opacity 0, scale 0.9 → opacity 1, scale 1, duration 0.4s
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- Images stack with z-index increment
- On mouseleave: all images fade out over 500ms
- Auto-remove old images after 800ms
*/

type ResponsiveImageLike = { src: string; srcSet?: string; alt?: string }

type TrailItem = {
    id: string
    imgIndex: number
    createdAt: number
    z: number
    leaving: boolean
}

type Props = {
    images: ResponsiveImageLike[]
    imageWidth: number
    imageHeight: number
    spawnIntervalMs: number
    lerp: number
    fadeOutMs: number
    exitOnLeaveMs: number
    lifetimeMs: number
    entranceMs: number
    cornerRadius: number
    debugTriggerBg: string
    debugTriggerBorder: string
    showDebug: boolean
    ariaLabel: string
    interactionMode: "mousemove" | "click" | "hover-hold"
    borderWidth: number
    borderColor: string
    shadowEnabled: boolean
    shadowColor: string
    shadowBlur: number
    shadowX: number
    shadowY: number
    blendMode: string
    style?: React.CSSProperties
}

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n))
}

const MAX_ACTIVE_IMAGES = 15 // Limit concurrent images for performance

function useRafLerpFollow(
    enabled: boolean,
    lerp: number,
    targetRef: React.MutableRefObject<{ x: number; y: number }>,
    initial: { x: number; y: number }
) {
    const x = useMotionValue(initial.x)
    const y = useMotionValue(initial.y)

    React.useEffect(() => {
        if (!enabled) return
        if (typeof window === "undefined") return

        let raf = 0
        let lastTime = performance.now()
        const step = (currentTime: number) => {
            const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2) // Cap at 2x for safety
            lastTime = currentTime
            
            const t = targetRef.current
            const cx = x.get()
            const cy = y.get()
            const a = clamp01(lerp * deltaTime)
            x.set(cx + (t.x - cx) * a)
            y.set(cy + (t.y - cy) * a)
            raf = window.requestAnimationFrame(step)
        }
        raf = window.requestAnimationFrame(step)
        return () => {
            if (typeof window !== "undefined") window.cancelAnimationFrame(raf)
        }
    }, [enabled, lerp, targetRef, x, y])

    return { x, y }
}

const TrailImage = React.memo(function TrailImage(props: {
    item: TrailItem
    image: ResponsiveImageLike
    enabled: boolean
    lerp: number
    targetRef: React.MutableRefObject<{ x: number; y: number }>
    width: number
    height: number
    radius: number
    easing: number[]
    entranceMs: number
    fadeOutMs: number
    exitOnLeaveMs: number
    borderWidth: number
    borderColor: string
    shadowEnabled: boolean
    shadowColor: string
    shadowBlur: number
    shadowX: number
    shadowY: number
    blendMode: string
}) {
    const {
        item,
        image,
        enabled,
        lerp,
        targetRef,
        width,
        height,
        radius,
        easing,
        entranceMs,
        fadeOutMs,
        exitOnLeaveMs,
        borderWidth,
        borderColor,
        shadowEnabled,
        shadowColor,
        shadowBlur,
        shadowX,
        shadowY,
        blendMode,
    } = props

    const follower = useRafLerpFollow(enabled, lerp, targetRef, { x: 0, y: 0 })

    const baseTransition = React.useMemo(() => {
        return { ease: easing as any }
    }, [easing])

    const boxShadow = React.useMemo(() => {
        if (!shadowEnabled) return "none"
        return `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
    }, [shadowEnabled, shadowX, shadowY, shadowBlur, shadowColor])

    return (
        <motion.div
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width,
                height,
                x: follower.x,
                y: follower.y,
                translateX: "-50%",
                translateY: "-50%",
                zIndex: item.z,
                pointerEvents: "none",
                willChange: "transform, opacity",
                borderRadius: radius,
                overflow: "hidden",
                transform: "translate3d(0, 0, 0)",
                backfaceVisibility: "hidden",
                border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
                boxShadow,
                mixBlendMode: blendMode as any,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
                opacity: item.leaving ? 0 : 1,
                scale: item.leaving ? 0.95 : 1,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                ...baseTransition,
                opacity: { duration: (item.leaving ? exitOnLeaveMs : entranceMs) / 1000 },
                scale: { duration: entranceMs / 1000 },
            }}
        >
            <img
                src={image?.src}
                srcSet={image?.srcSet}
                alt={image?.alt ?? ""}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
                draggable={false}
            />
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
                initial={false}
                animate={{ opacity: item.leaving ? 1 : 0 }}
                transition={{
                    ...baseTransition,
                    duration: (item.leaving ? (item.leaving ? exitOnLeaveMs : fadeOutMs) : 0) / 1000,
                }}
            />
        </motion.div>
    )
})

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CursorTrailingImageGallery(props: Props) {
    const {
        images = [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2 - Purple" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3 - Orange" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4 - Yellow" },
            { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gradient 5 - Green" },
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2 - Purple" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3 - Orange" },
        ],
        imageWidth,
        imageHeight,
        spawnIntervalMs,
        lerp,
        fadeOutMs,
        exitOnLeaveMs,
        lifetimeMs,
        entranceMs,
        cornerRadius,
        showDebug,
        debugTriggerBg,
        debugTriggerBorder,
        ariaLabel,
        interactionMode,
        borderWidth,
        borderColor,
        shadowEnabled,
        shadowColor,
        shadowBlur,
        shadowX,
        shadowY,
        blendMode,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const inViewRef = React.useRef<HTMLDivElement | null>(null)
    const isInView = useInView(inViewRef, { amount: 0.05 })

    const easing = React.useMemo(() => [0.16, 1, 0.3, 1], [])
    const targetRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const lastSpawnAtRef = React.useRef<number>(0)
    const imgIndexRef = React.useRef<number>(0)
    const zRef = React.useRef<number>(1)

    const [items, setItems] = React.useState<TrailItem[]>([])
    const [hovered, setHovered] = React.useState(false)
    const [imagesLoaded, setImagesLoaded] = React.useState(false)
    const [isHoldActive, setIsHoldActive] = React.useState(false)
    const holdIntervalRef = React.useRef<number | null>(null)

    // Preload all images
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!images || images.length === 0) {
            React.startTransition(() => setImagesLoaded(true))
            return
        }

        let loadedCount = 0
        const totalImages = images.length
        const imageElements: HTMLImageElement[] = []

        images.forEach((img) => {
            if (!img?.src) {
                loadedCount++
                if (loadedCount === totalImages) {
                    React.startTransition(() => setImagesLoaded(true))
                }
                return
            }

            const imageElement = new Image()
            imageElements.push(imageElement)

            imageElement.onload = () => {
                loadedCount++
                if (loadedCount === totalImages) {
                    React.startTransition(() => setImagesLoaded(true))
                }
            }

            imageElement.onerror = () => {
                loadedCount++
                if (loadedCount === totalImages) {
                    React.startTransition(() => setImagesLoaded(true))
                }
            }

            // Set src and srcSet to trigger loading
            if (img.srcSet) {
                imageElement.srcset = img.srcSet
            }
            imageElement.src = img.src
        })

        return () => {
            imageElements.forEach((img) => {
                img.onload = null
                img.onerror = null
            })
        }
    }, [images])

    const enabled = !isStatic && isInView

    const resolveLocalPoint = React.useCallback((clientX: number, clientY: number) => {
        const el = containerRef.current
        if (!el) return { x: clientX, y: clientY }
        const rect = el.getBoundingClientRect()
        return { x: clientX - rect.left, y: clientY - rect.top }
    }, [])

    const spawn = React.useCallback(() => {
        if (!enabled) return
        if (!images || images.length === 0) return

        const now = typeof performance !== "undefined" ? performance.now() : Date.now()
        const last = lastSpawnAtRef.current
        if (now - last < spawnIntervalMs) return
        lastSpawnAtRef.current = now

        const nextIndex = imgIndexRef.current % images.length
        imgIndexRef.current = (imgIndexRef.current + 1) % images.length

        const id = `${now}-${Math.random().toString(16).slice(2)}`
        const z = zRef.current++

        const newItem: TrailItem = { id, imgIndex: nextIndex, createdAt: now, z, leaving: false }

        React.startTransition(() => {
            setItems((prev) => {
                // Limit max active images for performance
                const next = prev.length >= MAX_ACTIVE_IMAGES ? [...prev.slice(1), newItem] : [...prev, newItem]
                return next
            })
        })

        if (typeof window !== "undefined") {
            window.setTimeout(() => {
                React.startTransition(() => {
                    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, leaving: true } : it)))
                })
            }, Math.max(0, lifetimeMs - fadeOutMs))

            window.setTimeout(() => {
                React.startTransition(() => {
                    setItems((prev) => prev.filter((it) => it.id !== id))
                })
            }, Math.max(0, lifetimeMs))
        }
    }, [enabled, images, spawnIntervalMs, lifetimeMs, fadeOutMs])

    const onMouseEnter = React.useCallback(() => {
        if (!enabled) return
        React.startTransition(() => setHovered(true))
    }, [enabled])

    const onMouseLeave = React.useCallback(() => {
        React.startTransition(() => {
            setHovered(false)
            setIsHoldActive(false)
        })
        
        // Clear hold interval if active
        if (holdIntervalRef.current !== null) {
            if (typeof window !== "undefined") {
                window.clearInterval(holdIntervalRef.current)
            }
            holdIntervalRef.current = null
        }
        
        if (typeof window === "undefined") return

        const leaveMs = exitOnLeaveMs
        React.startTransition(() => {
            setItems((prev) => prev.map((it) => ({ ...it, leaving: true })))
        })
        window.setTimeout(() => {
            React.startTransition(() => setItems([]))
        }, Math.max(0, leaveMs))
    }, [exitOnLeaveMs])

    const onMouseMove = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!enabled) return
            const { x, y } = resolveLocalPoint(e.clientX, e.clientY)
            targetRef.current = { x, y }
            
            // Only spawn on mousemove if in mousemove mode
            if (interactionMode === "mousemove") {
                spawn()
            }
        },
        [enabled, resolveLocalPoint, spawn, interactionMode]
    )

    const onClick = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!enabled || interactionMode !== "click") return
            const { x, y } = resolveLocalPoint(e.clientX, e.clientY)
            targetRef.current = { x, y }
            spawn()
        },
        [enabled, interactionMode, resolveLocalPoint, spawn]
    )

    const onMouseDown = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!enabled || interactionMode !== "hover-hold") return
            const { x, y } = resolveLocalPoint(e.clientX, e.clientY)
            targetRef.current = { x, y }
            
            React.startTransition(() => setIsHoldActive(true))
            
            // Spawn immediately on mouse down
            spawn()
            
            // Start interval for continuous spawning
            if (typeof window !== "undefined") {
                holdIntervalRef.current = window.setInterval(() => {
                    spawn()
                }, spawnIntervalMs)
            }
        },
        [enabled, interactionMode, resolveLocalPoint, spawn, spawnIntervalMs]
    )

    const onMouseUp = React.useCallback(() => {
        if (!enabled || interactionMode !== "hover-hold") return
        
        React.startTransition(() => setIsHoldActive(false))
        
        // Clear the interval
        if (holdIntervalRef.current !== null) {
            if (typeof window !== "undefined") {
                window.clearInterval(holdIntervalRef.current)
            }
            holdIntervalRef.current = null
        }
    }, [enabled, interactionMode])

    // Update mouse position during hover-hold mode
    const onMouseMoveHold = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!enabled || interactionMode !== "hover-hold" || !isHoldActive) return
            const { x, y } = resolveLocalPoint(e.clientX, e.clientY)
            targetRef.current = { x, y }
        },
        [enabled, interactionMode, isHoldActive, resolveLocalPoint]
    )

    // Cleanup interval on unmount
    React.useEffect(() => {
        return () => {
            if (holdIntervalRef.current !== null && typeof window !== "undefined") {
                window.clearInterval(holdIntervalRef.current)
            }
        }
    }, [])

    const hasImages = images && images.length > 0
    
    const renderedItems = React.useMemo(() => {
        return items.map((it) => {
            const img = images[it.imgIndex]
            if (!img?.src) return null
            return (
                <TrailImage
                    key={it.id}
                    item={it}
                    image={img}
                    enabled={enabled}
                    lerp={lerp}
                    targetRef={targetRef}
                    width={imageWidth}
                    height={imageHeight}
                    radius={cornerRadius}
                    easing={easing}
                    entranceMs={entranceMs}
                    fadeOutMs={fadeOutMs}
                    exitOnLeaveMs={exitOnLeaveMs}
                    borderWidth={borderWidth}
                    borderColor={borderColor}
                    shadowEnabled={shadowEnabled}
                    shadowColor={shadowColor}
                    shadowBlur={shadowBlur}
                    shadowX={shadowX}
                    shadowY={shadowY}
                    blendMode={blendMode}
                />
            )
        })
    }, [items, images, enabled, lerp, targetRef, imageWidth, imageHeight, cornerRadius, easing, entranceMs, fadeOutMs, exitOnLeaveMs, borderWidth, borderColor, shadowEnabled, shadowColor, shadowBlur, shadowX, shadowY, blendMode])

    return (
        <div
            ref={(node) => {
                containerRef.current = node
                inViewRef.current = node
            }}
            role="region"
            aria-label={ariaLabel}
            onMouseEnter={enabled ? onMouseEnter : undefined}
            onMouseLeave={enabled ? onMouseLeave : undefined}
            onMouseMove={enabled ? (interactionMode === "hover-hold" ? onMouseMoveHold : onMouseMove) : undefined}
            onClick={enabled && interactionMode === "click" ? onClick : undefined}
            onMouseDown={enabled && interactionMode === "hover-hold" ? onMouseDown : undefined}
            onMouseUp={enabled && interactionMode === "hover-hold" ? onMouseUp : undefined}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 5,
                minHeight: 5,
                overflow: "hidden",
                userSelect: "none",
                background: showDebug ? debugTriggerBg : "transparent",
                border: showDebug ? `1px dashed ${debugTriggerBorder}` : "none",
                cursor: enabled ? (hovered ? "none" : interactionMode === "click" ? "pointer" : "default") : "default",
                ...style,
            }}
        >
            {isStatic && hasImages ? (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: imageWidth,
                        height: imageHeight,
                        transform: "translate(-50%, -50%)",
                        borderRadius: cornerRadius,
                        overflow: "hidden",
                    }}
                >
                    <img
                        src={images[0]?.src}
                        srcSet={images[0]?.srcSet}
                        alt={images[0]?.alt ?? ""}
                        style={{ 
                            width: "100%", 
                            height: "100%", 
                            objectFit: "cover", 
                            display: "block",
                            border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
                            boxShadow: shadowEnabled ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}` : "none",
                        }}
                        draggable={false}
                    />
                </div>
            ) : null}

            <AnimatePresence initial={false} mode="popLayout">
                {renderedItems}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(CursorTrailingImageGallery, {
    interactionMode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["mousemove", "click", "hover-hold"],
        optionTitles: ["Mouse Move", "Click", "Hover & Hold"],
        defaultValue: "mousemove",
        displaySegmentedControl: false,
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 12,
        defaultValue: [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2 - Purple" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3 - Orange" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4 - Yellow" },
            { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gradient 5 - Green" },
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2 - Purple" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3 - Orange" },
        ],
        control: { type: ControlType.ResponsiveImage },
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Image W",
        defaultValue: 280,
        min: 80,
        max: 900,
        step: 1,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image H",
        defaultValue: 380,
        min: 80,
        max: 1200,
        step: 1,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border W",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.borderWidth === 0,
    },
    shadowEnabled: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0, 0, 0, 0.3)",
        hidden: (p) => !p.shadowEnabled,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        hidden: (p) => !p.shadowEnabled,
    },
    shadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
        hidden: (p) => !p.shadowEnabled,
    },
    shadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 10,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
        hidden: (p) => !p.shadowEnabled,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"],
        optionTitles: ["Normal", "Multiply", "Screen", "Overlay", "Darken", "Lighten", "Color Dodge", "Color Burn", "Hard Light", "Soft Light", "Difference", "Exclusion", "Hue", "Saturation", "Color", "Luminosity"],
        defaultValue: "normal",
    },
    spawnIntervalMs: {
        type: ControlType.Number,
        title: "Spawn",
        defaultValue: 80,
        min: 16,
        max: 400,
        step: 1,
        unit: "ms",
    },
    lerp: {
        type: ControlType.Number,
        title: "Lerp",
        defaultValue: 0.15,
        min: 0.01,
        max: 0.5,
        step: 0.01,
    },
    entranceMs: {
        type: ControlType.Number,
        title: "Enter",
        defaultValue: 500,
        min: 100,
        max: 1200,
        step: 10,
        unit: "ms",
    },
    fadeOutMs: {
        type: ControlType.Number,
        title: "Fade",
        defaultValue: 600,
        min: 100,
        max: 2000,
        step: 10,
        unit: "ms",
    },
    lifetimeMs: {
        type: ControlType.Number,
        title: "Lifetime",
        defaultValue: 800,
        min: 200,
        max: 4000,
        step: 10,
        unit: "ms",
    },
    exitOnLeaveMs: {
        type: ControlType.Number,
        title: "Leave",
        defaultValue: 500,
        min: 100,
        max: 2000,
        step: 10,
        unit: "ms",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA",
        defaultValue: "Cursor trailing image gallery",
    },
    showDebug: {
        type: ControlType.Boolean,
        title: "Debug",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    debugTriggerBg: {
        type: ControlType.Color,
        title: "Debug BG",
        defaultValue: "#F5F5F5",
        hidden: (p) => !p.showDebug,
    },
    debugTriggerBorder: {
        type: ControlType.Color,
        title: "Debug Border",
        defaultValue: "#CCCCCC",
        hidden: (p) => !p.showDebug,
    },
})