// User instructions: Create a Torus Ring Gallery Framer component in TypeScript/React with zero external dependencies, dual-axis rotating torus layout, depth scaling/opacity, drag with inertia, active card glow, per-image links with show/hide, responsive behavior, and optimize performance to run smoothly.

import * as React from "react"
import { useEffect, useMemo, useRef, useState, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type CardShape = "circle" | "square" | "rounded"

interface TorusRingGalleryProps {
    images: ResponsiveImage[]
    links: string[]
    defaultLink: string
    showLinks: boolean

    count: number
    majorRadius: number
    minorRadius: number

    rotXSpeed: number
    rotYSpeed: number

    dragEnabled: boolean
    autoSpin: boolean
    fogEnabled: boolean

    minOpacity: number
    minScale: number
    perspective: number

    cardSize: number
    cardShape: CardShape

    glowColor: string
    bgColor: string

    style?: CSSProperties
}

type CardParam = {
    phi: number
    cosPhi: number
    sinPhi: number
    theta: number
    imageIndex: number
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
}

function getNow() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now()
    return Date.now()
}

/**
 * Torus Ring Gallery
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TorusRingGallery(props: TorusRingGalleryProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2 - Purple",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3 - Orange",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4 - Yellow",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
        ],
        links = [
            "https://www.framer.com",
            "https://www.framer.com",
            "https://www.framer.com",
            "https://www.framer.com",
            "https://www.framer.com",
        ],
        defaultLink = "https://www.framer.com",
        showLinks = true,

        count = 12,
        majorRadius = 200,
        minorRadius = 80,

        rotXSpeed = 0.2,
        rotYSpeed = 0.4,

        dragEnabled = true,
        autoSpin = true,
        fogEnabled = true,

        minOpacity = 0.15,
        minScale = 0.4,
        perspective = 1000,

        cardSize = 100,
        cardShape = "circle",

        glowColor = "#6c47ff",
        bgColor = "#04040a",
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement | null>(null)
    const sceneRef = useRef<HTMLDivElement | null>(null)
    const isInView = useInView(sceneRef, { margin: "200px 0px 200px 0px", amount: 0.1 })

    const [responsiveScale, setResponsiveScale] = useState(1)

    const N = Math.max(0, Math.min(count, images.length, 30))

    const cardParams = useMemo<CardParam[]>(() => {
        const out: CardParam[] = []
        if (N <= 0) return out

        const goldenAngle = Math.PI * (3 - Math.sqrt(5))
        const twoPi = Math.PI * 2

        for (let i = 0; i < N; i++) {
            const phi = i * goldenAngle
            out.push({
                phi,
                cosPhi: Math.cos(phi),
                sinPhi: Math.sin(phi),
                theta: i * (twoPi / N),
                imageIndex: i % images.length,
            })
        }
        return out
    }, [N, images.length])

    const cardElsRef = useRef<Array<HTMLElement | null>>([])
    const activeIndexRef = useRef<number>(-1)

    const rotXRef = useRef(0)
    const rotYRef = useRef(0)

    const rafRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number>(getNow())

    // Drag / inertia
    const pointerIdRef = useRef<number | null>(null)
    const isDraggingRef = useRef(false)
    const dragStartedRef = useRef(false)
    const hasDraggedRef = useRef(false)
    const lastPointerRef = useRef({ x: 0, y: 0 })
    const inertiaRef = useRef({ vx: 0, vy: 0 })

    const borderRadius = useMemo(() => {
        if (cardShape === "circle") return "50%"
        if (cardShape === "rounded") return "12px"
        return "0px"
    }, [cardShape])

    // ResizeObserver-based responsive scaling (cheaper + more accurate than window resize)
    useEffect(() => {
        if (typeof window === "undefined") return
        const el = containerRef.current
        if (!el) return

        let frame: number | null = null

        const measure = () => {
            frame = null
            const rect = el.getBoundingClientRect()
            const w = rect.width
            const h = rect.height
            const minDim = Math.max(1, Math.min(w, h))
            const isPortrait = h > w
            const isMobile = minDim < 600

            let s = minDim / 800
            if (isMobile) s *= 0.7
            if (isPortrait) s *= 0.85
            s = clamp(s, 0.3, 1.5)

            startTransition(() => setResponsiveScale(s))
        }

        const ro = new ResizeObserver(() => {
            if (frame != null) return
            frame = window.requestAnimationFrame(measure)
        })

        ro.observe(el)
        measure()

        return () => {
            if (frame != null) window.cancelAnimationFrame(frame)
            ro.disconnect()
        }
    }, [])

    const resolveLinkForImageIndex = useCallback(
        (imageIndex: number) => {
            if (!showLinks) return ""
            const raw = links[imageIndex] || ""
            return raw || defaultLink || ""
        },
        [showLinks, links, defaultLink]
    )

    // Keep element refs aligned with N
    useEffect(() => {
        cardElsRef.current = cardElsRef.current.slice(0, N)
        // Reset glow when count changes
        activeIndexRef.current = -1
    }, [N])

    const stopRaf = useCallback(() => {
        if (rafRef.current != null && typeof window !== "undefined") {
            window.cancelAnimationFrame(rafRef.current)
        }
        rafRef.current = null
    }, [])

    const startRaf = useCallback(() => {
        if (typeof window === "undefined") return
        if (rafRef.current != null) return

        lastTimeRef.current = getNow()

        const tick = () => {
            rafRef.current = window.requestAnimationFrame(tick)

            const now = getNow()
            const dt = Math.min(0.05, Math.max(0, (now - lastTimeRef.current) / 1000))
            lastTimeRef.current = now

            // If not visible, do minimal work but keep RAF running for smoothness when it becomes visible
            if (!isInView) return

            let rotX = rotXRef.current
            let rotY = rotYRef.current

            if (autoSpin && !isDraggingRef.current) {
                rotX += rotXSpeed * dt
                rotY += rotYSpeed * dt
            }

            if (!isDraggingRef.current) {
                const { vx, vy } = inertiaRef.current
                if (Math.abs(vx) > 0.0005 || Math.abs(vy) > 0.0005) {
                    rotY += vx
                    rotX += vy
                    inertiaRef.current.vx *= 0.95
                    inertiaRef.current.vy *= 0.95
                }
            }

            rotXRef.current = rotX
            rotYRef.current = rotY

            const R = majorRadius * responsiveScale
            const r = minorRadius * responsiveScale
            const denom = Math.max(1, 2 * (R + r))

            const cosX = Math.cos(rotX)
            const sinX = Math.sin(rotX)

            let maxZ = -Infinity
            let maxIndex = 0

            // Do not allocate in the loop
            for (let i = 0; i < cardParams.length; i++) {
                const el = cardElsRef.current[i]
                if (!el) continue

                const p = cardParams[i]
                const angleY = p.theta + rotY
                const cosY = Math.cos(angleY)
                const sinY = Math.sin(angleY)

                const tube = R + r * p.cosPhi
                const x0 = tube * cosY
                const y0 = r * p.sinPhi
                const z0 = tube * sinY

                const x = x0
                const y = y0 * cosX - z0 * sinX
                const z = y0 * sinX + z0 * cosX

                if (z > maxZ) {
                    maxZ = z
                    maxIndex = i
                }

                const normalZ = (z + R + r) / denom
                const sc = minScale + normalZ * (1 - minScale)
                const op = fogEnabled ? minOpacity + normalZ * (1 - minOpacity) : 1
                const zi = Math.round(normalZ * 100)

                // Mutate style only
                el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(
                    2
                )}px) scale(${sc.toFixed(4)})`
                el.style.opacity = op.toFixed(3)
                el.style.zIndex = String(zi)
            }

            if (activeIndexRef.current !== maxIndex) {
                const prev = activeIndexRef.current
                activeIndexRef.current = maxIndex

                if (prev >= 0) {
                    const prevEl = cardElsRef.current[prev]
                    if (prevEl) prevEl.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)"
                }

                const nextEl = cardElsRef.current[maxIndex]
                if (nextEl) nextEl.style.boxShadow = `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`
            }
        }

        rafRef.current = window.requestAnimationFrame(tick)
    }, [
        isInView,
        autoSpin,
        rotXSpeed,
        rotYSpeed,
        majorRadius,
        minorRadius,
        responsiveScale,
        minScale,
        minOpacity,
        fogEnabled,
        glowColor,
        cardParams,
    ])

    // Manage RAF lifecycle
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        startRaf()
        return () => stopRaf()
    }, [isStatic, startRaf, stopRaf])

    // Pointer handlers (use React.PointerEvent types)
    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!dragEnabled) return
            pointerIdRef.current = e.pointerId

            dragStartedRef.current = false
            isDraggingRef.current = false
            hasDraggedRef.current = false

            lastPointerRef.current = { x: e.clientX, y: e.clientY }
            inertiaRef.current = { vx: 0, vy: 0 }
        },
        [dragEnabled]
    )

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!dragEnabled) return
            if (pointerIdRef.current == null) return

            const dx = e.clientX - lastPointerRef.current.x
            const dy = e.clientY - lastPointerRef.current.y

            if (!dragStartedRef.current) {
                if (Math.abs(dx) <= 3 && Math.abs(dy) <= 3) return

                dragStartedRef.current = true
                isDraggingRef.current = true
                hasDraggedRef.current = true

                const el = containerRef.current
                if (el) {
                    try {
                        el.setPointerCapture(e.pointerId)
                    } catch (_) {
                        // ignore
                    }
                }
            }

            const vx = dx * 0.008
            const vy = dy * 0.008

            inertiaRef.current.vx = vx
            inertiaRef.current.vy = vy

            rotYRef.current += vx
            rotXRef.current += vy

            lastPointerRef.current = { x: e.clientX, y: e.clientY }
        },
        [dragEnabled]
    )

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        pointerIdRef.current = null
        isDraggingRef.current = false
        dragStartedRef.current = false

        const el = containerRef.current
        if (el) {
            try {
                el.releasePointerCapture(e.pointerId)
            } catch (_) {
                // ignore
            }
        }

        if (typeof window !== "undefined") {
            window.setTimeout(() => {
                hasDraggedRef.current = false
            }, 0)
        } else {
            hasDraggedRef.current = false
        }
    }, [])

    const handleCardClick = useCallback(
        (link: string, e: React.MouseEvent<HTMLElement>) => {
            if (!showLinks || !link) return
            if (hasDraggedRef.current) {
                e.preventDefault()
                e.stopPropagation()
            }
        },
        [showLinks]
    )

    const scaledCardSize = cardSize * responsiveScale
    const scaledPerspective = perspective * responsiveScale

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: bgColor,
                touchAction: "none",
                userSelect: "none",
                contain: "layout paint size",
                WebkitFontSmoothing: "antialiased",
                cursor: dragEnabled ? (isDraggingRef.current ? "grabbing" : "grab") : "default",
            }}
            onPointerDown={isStatic ? undefined : handlePointerDown}
            onPointerMove={isStatic ? undefined : handlePointerMove}
            onPointerUp={isStatic ? undefined : handlePointerUp}
            onPointerCancel={isStatic ? undefined : handlePointerUp}
            aria-label="Torus ring gallery"
            role="group"
        >
            <div
                ref={sceneRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    perspective: `${scaledPerspective}px`,
                    transformStyle: "preserve-3d",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "100%",
                        height: "100%",
                        transform: "translate(-50%, -50%)",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {cardParams.map((p, index) => {
                        const img = images[p.imageIndex]
                        const link = resolveLinkForImageIndex(p.imageIndex)

                        const baseStyle: CSSProperties = {
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: `${scaledCardSize}px`,
                            height: `${scaledCardSize}px`,
                            borderRadius,
                            overflow: "hidden",
                            transform: "translate(-50%, -50%) translate3d(0px, 0px, 0px) scale(1)",
                            opacity: 1,
                            zIndex: 0,
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            transition: "box-shadow 200ms ease",
                            willChange: "transform, opacity",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            pointerEvents: link ? "auto" : "none",
                            cursor: link ? "pointer" : "default",
                            textDecoration: "none",
                            color: "inherit",
                        }

                        const imgEl = (
                            <img
                                src={img?.src}
                                srcSet={img?.srcSet}
                                alt={img?.alt || ""}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        )

                        if (link) {
                            return (
                                <a
                                    key={index}
                                    ref={(node) => {
                                        cardElsRef.current[index] = node
                                    }}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={baseStyle}
                                    onClick={(e) => handleCardClick(link, e)}
                                    aria-label={img?.alt || `Card ${index + 1}`}
                                >
                                    {imgEl}
                                </a>
                            )
                        }

                        return (
                            <div
                                key={index}
                                ref={(node) => {
                                    cardElsRef.current[index] = node
                                }}
                                style={baseStyle}
                                aria-label={img?.alt || `Card ${index + 1}`}
                                role="img"
                            >
                                {imgEl}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(TorusRingGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 30,
        defaultValue: [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1 - Blue" },
        ],
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        control: { type: ControlType.Link },
        maxCount: 30,
        defaultValue: ["https://www.framer.com"],
        hidden: ({ showLinks }) => !showLinks,
    },
    defaultLink: {
        type: ControlType.Link,
        title: "Default Link",
        defaultValue: "https://www.framer.com",
        hidden: ({ showLinks }) => !showLinks,
    },
    showLinks: {
        type: ControlType.Boolean,
        title: "Show Links",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    count: {
        type: ControlType.Number,
        title: "Count",
        defaultValue: 12,
        min: 6,
        max: 30,
        step: 1,
    },
    majorRadius: {
        type: ControlType.Number,
        title: "Major Radius",
        defaultValue: 200,
        min: 80,
        max: 400,
        step: 10,
    },
    minorRadius: {
        type: ControlType.Number,
        title: "Minor Radius",
        defaultValue: 80,
        min: 30,
        max: 200,
        step: 5,
    },
    rotXSpeed: {
        type: ControlType.Number,
        title: "RotX Speed",
        defaultValue: 0.2,
        min: 0,
        max: 1.5,
        step: 0.05,
    },
    rotYSpeed: {
        type: ControlType.Number,
        title: "RotY Speed",
        defaultValue: 0.4,
        min: 0,
        max: 1.5,
        step: 0.05,
    },
    dragEnabled: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoSpin: {
        type: ControlType.Boolean,
        title: "Auto Spin",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fogEnabled: {
        type: ControlType.Boolean,
        title: "Fog",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    minOpacity: {
        type: ControlType.Number,
        title: "Min Opacity",
        defaultValue: 0.15,
        min: 0.05,
        max: 0.5,
        step: 0.05,
    },
    minScale: {
        type: ControlType.Number,
        title: "Min Scale",
        defaultValue: 0.4,
        min: 0.2,
        max: 0.8,
        step: 0.05,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1000,
        min: 400,
        max: 2000,
        step: 50,
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size",
        defaultValue: 100,
        min: 40,
        max: 250,
        step: 5,
        unit: "px",
    },
    cardShape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "square", "rounded"],
        optionTitles: ["Circle", "Square", "Rounded"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "#6c47ff",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#04040a",
    },
})
