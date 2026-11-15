// User goal: Create a 3D Depth Tunnel Carousel Framer component in TypeScript/React with infinite Z-axis tunnel looping, optional fog/vignette/blur, scatter mode via xSpread, scroll wheel reaction, smooth auto animation starting mid-cycle, per-card link defaulting to https://framer.link/dulaj80, and addPropertyControls for all requested props.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
import { useInView } from "framer-motion"

type TunnelImage = {
    src: string
    alt?: string
}

type Props = {
    images: TunnelImage[]
    depthLevels: number
    zSpacing: number
    perspective: number
    autoPull: boolean
    pullSpeed: number
    scrollReact: boolean
    loop: boolean
    fogEnabled: boolean
    fogColor: string
    vignetteEnabled: boolean
    blurFar: number
    cardWidth: number
    cardHeight: number
    cardRadius: number
    xSpread: number
    scrollSensitivity: number
    onCardClick?: (event?: any) => void
    link: string
    style?: CSSProperties
}

const fallbackImages: TunnelImage[] = [
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
]

function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v))
}

function mod(n: number, m: number) {
    return ((n % m) + m) % m
}

function computeXOffset(index: number, xSpread: number) {
    if (xSpread <= 0) return 0
    return ((index % 3) - 1) * xSpread
}

function stylesForZ(params: {
    z: number
    N: number
    zSpacing: number
    fogEnabled: boolean
    blurFar: number
}) {
    const { z, N, zSpacing, fogEnabled, blurFar } = params
    const totalDepth = Math.max(1, N * zSpacing)
    const normalDepth = clamp(Math.abs(z) / totalDepth, 0, 1)

    const scale = Math.max(0.05, 1 - normalDepth * 0.9)
    const opacity = fogEnabled ? Math.max(0, 1 - normalDepth * 1.3) : 1
    const blur = blurFar * normalDepth
    const zIndex = Math.round((1 - normalDepth) * 100)

    return { normalDepth, scale, opacity, blur, zIndex }
}

/**
 * 3D Depth Tunnel Carousel
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Card3DTunnel(props: Props) {
    const {
        images: imagesProp,
        depthLevels,
        zSpacing,
        perspective,
        autoPull,
        pullSpeed,
        scrollReact,
        loop,
        fogEnabled,
        fogColor,
        vignetteEnabled,
        blurFar,
        cardWidth,
        cardHeight,
        cardRadius,
        xSpread,
        scrollSensitivity,
        onCardClick,
        link,
        style,
    } = props

    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })

    // Responsive sizing: scale cards down on small containers (mobile) while preserving the visual effect.
    const effectiveCardWidth = useMemo(() => {
        const w = containerSize.w
        if (!w) return cardWidth
        return Math.max(1, Math.min(cardWidth, w * 0.92))
    }, [cardWidth, containerSize.w])

    const effectiveCardHeight = useMemo(() => {
        const h = containerSize.h
        if (!h) return cardHeight
        return Math.max(1, Math.min(cardHeight, h * 0.72))
    }, [cardHeight, containerSize.h])

    const images = useMemo(() => {
        const arr = (imagesProp && imagesProp.length > 0 ? imagesProp : fallbackImages) as TunnelImage[]
        return arr.filter((i) => i && typeof i.src === "string" && i.src.length > 0)
    }, [imagesProp])

    const N = Math.max(1, Math.min(depthLevels, images.length || 1))
    const totalDepth = N * zSpacing

    const containerRef = useRef<HTMLDivElement | null>(null)
    const sceneRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
    const wrapperRefs = useRef<(HTMLDivElement | null)[]>([])
    const zRef = useRef<number[]>([])
    const rafRef = useRef<number | null>(null)
    const lastTRef = useRef<number>(0)
    const scrollImpulseRef = useRef<number>(0)
    const lastAppliedRef = useRef<
        {
            t: string
            o: string
            f: string
            z: string
            p: "auto" | "none"
        }[]
    >([])

    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef as any, { margin: "200px 0px 200px 0px", amount: 0.1 })

    useEffect(() => {
        if (typeof window === "undefined") return
        const el = containerRef.current
        if (!el) return
        if (typeof ResizeObserver === "undefined") return

        const ro = new ResizeObserver((entries) => {
            const entry = entries[0]
            const cr = entry?.contentRect
            if (!cr) return
            startTransition(() => setContainerSize({ w: cr.width, h: cr.height }))
        })

        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Init Z positions: start in the middle of a cycle so the tunnel looks "already running".
    // We keep this synchronous to avoid a first-frame "pop".
    if (zRef.current.length !== N || cardRefs.current.length !== N) {
        zRef.current = new Array(N)
        cardRefs.current = new Array(N).fill(null)
        wrapperRefs.current = new Array(N).fill(null)
        lastAppliedRef.current = new Array(N).fill(null).map(() => ({
            t: "",
            o: "",
            f: "",
            z: "",
            p: "auto",
        }))
        const midOffset = totalDepth * 0.5
        for (let i = 0; i < N; i++) {
            zRef.current[i] = -i * zSpacing + midOffset
        }
    }

    const applyToCard = useCallback(
        (i: number, z: number) => {
            const wrapper = wrapperRefs.current[i]
            if (!wrapper) return

            const { scale, opacity, blur, zIndex } = stylesForZ({
                z,
                N,
                zSpacing,
                fogEnabled,
                blurFar,
            })

            const x = computeXOffset(i, xSpread)

            const t = `translate(-50%, -50%) translate3d(${x}px, 0px, ${z}px) scale(${scale})`
            const o = String(opacity)
            const f = blur > 0 ? `blur(${blur}px)` : "none"
            const zi = String(zIndex)
            const p: "auto" | "none" = opacity > 0.08 ? "auto" : "none"

            const last = lastAppliedRef.current[i]
            if (last) {
                if (last.t !== t) {
                    wrapper.style.transform = t
                    last.t = t
                }
                if (last.o !== o) {
                    wrapper.style.opacity = o
                    last.o = o
                }
                if (last.f !== f) {
                    wrapper.style.filter = f
                    last.f = f
                }
                if (last.z !== zi) {
                    wrapper.style.zIndex = zi
                    last.z = zi
                }
                if (last.p !== p) {
                    wrapper.style.pointerEvents = p
                    last.p = p
                }
            }
        },
        [N, zSpacing, fogEnabled, blurFar, xSpread]
    )

    const tick = useCallback(
        (t: number) => {
            if (lastTRef.current === 0) lastTRef.current = t
            const dt = clamp((t - lastTRef.current) / 1000, 0, 0.05)
            lastTRef.current = t

            const zArr = zRef.current
            if (zArr.length !== N) return

            // dt-based movement (units are px in Z per second; pullSpeed is scaled to feel like original spec)
            const autoMove = autoPull ? pullSpeed * 60 * dt : 0
            const scrollMove = scrollImpulseRef.current
            const move = autoMove + scrollMove

            for (let i = 0; i < N; i++) {
                let z = zArr[i] + move

                if (loop) {
                    // Spec: if z > zSpacing -> teleport to back.
                    // Use wrap to avoid drift; keep motion continuous.
                    const threshold = zSpacing
                    if (z > threshold) {
                        // Move it back by totalDepth (one full cycle).
                        z -= totalDepth
                    }
                } else {
                    // Clamp so it doesn't shoot way past the front
                    z = Math.min(z, zSpacing)
                }

                zArr[i] = z
                applyToCard(i, z)
            }

            // Smooth decay scroll impulse (friction)
            scrollImpulseRef.current *= 0.86
            if (Math.abs(scrollImpulseRef.current) < 0.0001) scrollImpulseRef.current = 0

            rafRef.current = requestAnimationFrame(tick)
        },
        [N, zSpacing, totalDepth, autoPull, pullSpeed, loop, applyToCard]
    )

    // Start/stop rAF. Avoid running in static renderers.
    useEffect(() => {
        if (isStatic) return
        if (!isInView) return
        if (typeof window === "undefined") return

        // Ensure initial DOM styles are applied immediately for first preview frame
        for (let i = 0; i < N; i++) {
            applyToCard(i, zRef.current[i])
        }

        lastTRef.current = 0
        rafRef.current = requestAnimationFrame(tick)

        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            lastTRef.current = 0
        }
    }, [isStatic, isInView, N, tick, applyToCard])

    const onWheel = useCallback(
        (e: WheelEvent) => {
            if (!scrollReact) return
            // Keep page from scrolling when interacting with the tunnel
            e.preventDefault()
            // Accumulate a small impulse; sign keeps natural direction
            scrollImpulseRef.current += e.deltaY * scrollSensitivity * 0.5
            // Clamp to avoid huge jumps
            scrollImpulseRef.current = clamp(scrollImpulseRef.current, -zSpacing * 0.8, zSpacing * 0.8)
        },
        [scrollReact, scrollSensitivity, zSpacing]
    )

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        if (!scrollReact) return
        if (typeof window === "undefined") return

        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [onWheel, scrollReact])

    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: fogColor,
                perspective: `${perspective}px`,
                WebkitPerspective: `${perspective}px`,
            }}
            aria-label="3D depth tunnel carousel"
            role="region"
        >
            <div
                ref={sceneRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    WebkitTransformStyle: "preserve-3d",
                }}
            >
                {new Array(N).fill(0).map((_, i) => {
                    const img = images[mod(i, images.length)]
                    const z = zRef.current[i] ?? -i * zSpacing
                    const { scale, opacity, blur, zIndex } = stylesForZ({
                        z,
                        N,
                        zSpacing,
                        fogEnabled,
                        blurFar,
                    })
                    const x = computeXOffset(i, xSpread)

                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                wrapperRefs.current[i] = el
                            }}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: `${effectiveCardWidth}px`,
                                height: `${effectiveCardHeight}px`,
                                transform: `translate(-50%, -50%) translate3d(${x}px, 0px, ${z}px) scale(${scale})`,
                                transformStyle: "preserve-3d",
                                borderRadius: `${cardRadius}px`,
                                overflow: "hidden",
                                boxShadow: "0 14px 60px rgba(0,0,0,0.35)",
                                opacity,
                                filter: blur > 0 ? `blur(${blur}px)` : "none",
                                zIndex,
                                willChange: isThumbnail ? undefined : "transform, opacity, filter",
                                backfaceVisibility: "hidden",
                                pointerEvents: opacity > 0.08 ? "auto" : "none",
                            }}
                        >
                            {link ? (
                                <a
                                    ref={(el) => {
                                        cardRefs.current[i] = el
                                    }}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(ev) => {
                                        if (onCardClick) onCardClick(ev)
                                    }}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: `${cardRadius}px`,
                                        textDecoration: "none",
                                        cursor: "pointer",
                                    }}
                                    aria-label={img?.alt ? img.alt : `Card ${i + 1}`}
                                >
                                    <img
                                        src={img?.src}
                                        alt={img?.alt || ""}
                                        loading={i < 3 ? "eager" : "lazy"}
                                        decoding="async"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            transform: "translateZ(0)",
                                        }}
                                        draggable={false}
                                    />
                                </a>
                            ) : (
                                <div
                                    ref={(el) => {
                                        cardRefs.current[i] = el as any
                                    }}
                                    onClick={(ev) => {
                                        if (onCardClick) onCardClick(ev)
                                    }}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: `${cardRadius}px`,
                                        cursor: onCardClick ? "pointer" : "default",
                                    }}
                                    aria-label={img?.alt ? img.alt : `Card ${i + 1}`}
                                >
                                    <img
                                        src={img?.src}
                                        alt={img?.alt || ""}
                                        loading={i < 3 ? "eager" : "lazy"}
                                        decoding="async"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            transform: "translateZ(0)",
                                        }}
                                        draggable={false}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {vignetteEnabled && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, ${fogColor} 100%)`,
                        pointerEvents: "none",
                        zIndex: 1000,
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(Card3DTunnel, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 20,
        defaultValue: fallbackImages,
        control: {
            type: ControlType.ResponsiveImage,
        },
    },
    depthLevels: {
        type: ControlType.Number,
        title: "Depth Levels",
        defaultValue: 8,
        min: 4,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    zSpacing: {
        type: ControlType.Number,
        title: "Z Spacing",
        defaultValue: 180,
        min: 80,
        max: 400,
        step: 10,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1200,
        min: 400,
        max: 3000,
        step: 50,
        unit: "px",
    },
    autoPull: {
        type: ControlType.Boolean,
        title: "Auto Pull",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    pullSpeed: {
        type: ControlType.Number,
        title: "Pull Speed",
        defaultValue: 1.5,
        min: 0.2,
        max: 8,
        step: 0.1,
        hidden: (p) => !p.autoPull,
    },
    scrollReact: {
        type: ControlType.Boolean,
        title: "Scroll React",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
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
    fogColor: {
        type: ControlType.Color,
        title: "Fog Color",
        defaultValue: "#04040a",
    },
    vignetteEnabled: {
        type: ControlType.Boolean,
        title: "Vignette",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    blurFar: {
        type: ControlType.Number,
        title: "Blur Far",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 300,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 200,
        min: 80,
        max: 500,
        step: 10,
        unit: "px",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    xSpread: {
        type: ControlType.Number,
        title: "X Spread",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 10,
        unit: "px",
    },
    scrollSensitivity: {
        type: ControlType.Number,
        title: "Scroll Sensitivity",
        defaultValue: 0.8,
        min: 0.1,
        max: 3,
        step: 0.1,
        hidden: (p) => !p.scrollReact,
    },
    onCardClick: {
        type: ControlType.EventHandler,
        title: "On Card Click",
    },
    link: {
        type: ControlType.Link,
        title: "Card Link",
    },
})
