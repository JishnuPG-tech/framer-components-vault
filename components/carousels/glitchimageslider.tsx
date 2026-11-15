// Build an image slider with a digital glitch transition. When changing slides, apply a brief RGB shift and pixelated distortion effect to the images.
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

import { useInView } from "framer-motion"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type SlideItem = { image: ResponsiveImage; title?: string; link?: string }

type ArrowStyle = "minimal" | "pill"

type TransitionEffect = "glitch" | "fade" | "slide" | "dissolve"

type Props = {
    images: Array<ResponsiveImage | SlideItem>
    fit: "cover" | "contain"
    align: "center" | "top" | "bottom" | "left" | "right"
    backgroundColor: string

    imagePadding: string

    autoplay: boolean
    autoplaySeconds: number
    pauseOnHover: boolean

    transitionMs: number
    transitionEffect: TransitionEffect
    glitchStrength: number
    rgbShiftPx: number
    pixelSize: number
    sliceCount: number

    showArrows: boolean
    arrowStyle: ArrowStyle
    arrowColor: string
    arrowBackground: string
    arrowBorderColor: string
    arrowBorderWidth: number
    arrowRadius: string
    arrowPadding: string

    showDots: boolean
    dotColor: string
    dotActiveColor: string
    dotBackground: string
    dotRadius: string
    dotsPadding: string

    borderRadius: string
    imageBorderRadius: string
    style?: React.CSSProperties
    showTitle: boolean
    titleColor: string
    titleBackground: string
    titlePadding: string
    titleGap: number
    titleFont: any
}

const defaultSlides: SlideItem[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5 - Green",
        },
        title: "Gradient 5 - Green",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Gradient 4 - Yellow",
        },
        title: "Gradient 4 - Yellow",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Gradient 3 - Orange",
        },
        title: "Gradient 3 - Orange",
    },
]

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function mulberry32(seed: number) {
    let a = seed >>> 0
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function getObjectPosition(align: Props["align"]) {
    switch (align) {
        case "top":
            return "50% 0%"
        case "bottom":
            return "50% 100%"
        case "left":
            return "0% 50%"
        case "right":
            return "100% 50%"
        case "center":
        default:
            return "50% 50%"
    }
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function GlitchImageSlider(props: Props) {
    const {
        images = defaultSlides,
        fit = "cover",
        align = "center",
        backgroundColor = "#FFFFFF",

        imagePadding = "0px",

        autoplay = true,
        autoplaySeconds = 3,
        pauseOnHover = true,

        transitionMs = 520,
        transitionEffect = "glitch",
        glitchStrength = 0.8,
        rgbShiftPx = 10,
        pixelSize = 10,
        sliceCount = 14,

        showArrows = true,
        arrowStyle = "pill",
        arrowColor = "#000000",
        arrowBackground = "rgba(255,255,255,0.82)",
        arrowBorderColor = "rgba(0,0,0,0.08)",
        arrowBorderWidth = 1,
        arrowRadius = "999px",
        arrowPadding = "10px",

        showDots = true,
        dotColor = "rgba(0,0,0,0.35)",
        dotActiveColor = "rgba(0,0,0,0.9)",
        dotBackground = "rgba(255,255,255,0.7)",
        dotRadius = "999px",
        dotsPadding = "10px",

        borderRadius = "16px",
        imageBorderRadius = "16px",
        style,
        showTitle = true,
        titleColor = "#000000",
        titleBackground = "transparent",
        titlePadding = "12px 12px",
        titleGap = 0,
        titleFont,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const viewportRef = React.useRef<HTMLDivElement | null>(null)
    const inView = useInView(rootRef, { amount: 0.2 })
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

    const [index, setIndex] = React.useState(0)
    const [isHovering, setIsHovering] = React.useState(false)
    const [isTransitioning, setIsTransitioning] = React.useState(false)
    const [toIndex, setToIndex] = React.useState<number | null>(null)

    const rafRef = React.useRef<number | null>(null)
    const transitionStartRef = React.useRef<number>(0)
    const transitionSeedRef = React.useRef<number>(1337)

    const imgRefMap = React.useRef<Map<string, HTMLImageElement>>(new Map())
    const offscreenRef = React.useRef<HTMLCanvasElement | null>(null)
    const offscreenCtxRef = React.useRef<CanvasRenderingContext2D | null>(null)

    const fromIndexRef = React.useRef<number>(0)
    const toIndexRef = React.useRef<number | null>(null)
    const directionRef = React.useRef<1 | -1>(1)

    const imagesSafe = React.useMemo(() => {
        const normalized: SlideItem[] = (images || [])
            .map((it: any) => {
                if (!it) return null
                if (it.image && typeof it.image.src === "string") {
                    return {
                        image: it.image,
                        title: typeof it.title === "string" ? it.title : it.image?.alt,
                        link: typeof it.link === "string" ? it.link : "",
                    } as SlideItem
                }
                if (typeof it.src === "string") {
                    return {
                        image: it as ResponsiveImage,
                        title: typeof it.alt === "string" ? it.alt : "",
                        link: "",
                    } as SlideItem
                }
                return null
            })
            .filter((s): s is SlideItem => !!s && !!s.image && typeof s.image.src === "string" && s.image.src.length > 0)

        return normalized.length > 0 ? normalized : defaultSlides
    }, [images])

    const activeIndex = clamp(index, 0, Math.max(0, imagesSafe.length - 1))

    const active = imagesSafe[activeIndex]
    const upcoming = toIndex != null ? imagesSafe[clamp(toIndex, 0, imagesSafe.length - 1)] : null
    const titleSlide = isTransitioning && upcoming ? upcoming : active

    const activeLink = React.useMemo(() => {
        const raw = (active?.link || "").toString().trim()
        return raw
    }, [active?.link])

    const titleText = React.useMemo(() => {
        const raw = (titleSlide?.title || titleSlide?.image?.alt || "").toString()
        return raw.trim()
    }, [titleSlide])

    const ensureImage = React.useCallback((src: string) => {
        if (!src) return null
        const cached = imgRefMap.current.get(src)
        if (cached) return cached
        if (typeof window === "undefined") return null
        const img = new window.Image()
        img.decoding = "async"
        img.crossOrigin = "anonymous"
        img.src = src
        imgRefMap.current.set(src, img)
        return img
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        for (const it of imagesSafe) ensureImage(it.image?.src)
    }, [imagesSafe, ensureImage])

    const setupOffscreen = React.useCallback((w: number, h: number) => {
        if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas")
        const c = offscreenRef.current
        c.width = Math.max(1, Math.floor(w))
        c.height = Math.max(1, Math.floor(h))
        if (!offscreenCtxRef.current) offscreenCtxRef.current = c.getContext("2d")
        return { canvas: c, ctx: offscreenCtxRef.current }
    }, [])

    const resizeCanvasToElement = React.useCallback(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        const el = viewportRef.current
        if (!canvas || !el) return
        const rect = el.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        const nextW = Math.max(1, Math.round(rect.width * dpr))
        const nextH = Math.max(1, Math.round(rect.height * dpr))

        if (canvas.width !== nextW || canvas.height !== nextH) {
            canvas.width = nextW
            canvas.height = nextH
        }
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        resizeCanvasToElement()
        const el = viewportRef.current
        if (!el) return

        const ro = new ResizeObserver(() => {
            resizeCanvasToElement()
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [resizeCanvasToElement])

    const stopRaf = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (rafRef.current != null) {
            window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    React.useEffect(() => {
        return () => stopRaf()
    }, [stopRaf])

    const drawImageCover = React.useCallback(
        (ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) => {
            const iw = img.naturalWidth || img.width || 1
            const ih = img.naturalHeight || img.height || 1

            const pos = getObjectPosition(align)
            const [px, py] = pos.split(" ").map((p) => {
                const v = parseFloat(p)
                if (!isFinite(v)) return 50
                return clamp(v, 0, 100)
            })
            const ax = px / 100
            const ay = py / 100

            if (fit === "contain") {
                const scale = Math.min(cw / iw, ch / ih)
                const w = iw * scale
                const h = ih * scale
                const dx = (cw - w) * ax
                const dy = (ch - h) * ay
                ctx.drawImage(img, dx, dy, w, h)
                return
            }

            const scale = Math.max(cw / iw, ch / ih)
            const w = iw * scale
            const h = ih * scale
            const dx = (cw - w) * ax
            const dy = (ch - h) * ay
            ctx.drawImage(img, dx, dy, w, h)
        },
        [align, fit]
    )

    const drawTintedShift = React.useCallback(
        (
            ctx: CanvasRenderingContext2D,
            img: HTMLImageElement,
            cw: number,
            ch: number,
            dx: number,
            dy: number,
            color: string,
            alpha: number
        ) => {
            ctx.save()
            ctx.translate(dx, dy)

            ctx.globalAlpha = clamp(alpha, 0, 1)
            drawImageCover(ctx, img, cw, ch)

            ctx.globalCompositeOperation = "source-in"
            ctx.fillStyle = color
            ctx.fillRect(-dx, -dy, cw, ch)

            ctx.restore()
            ctx.globalCompositeOperation = "source-over"
        },
        [drawImageCover]
    )

    const drawPixelated = React.useCallback(
        (
            ctx: CanvasRenderingContext2D,
            img: HTMLImageElement,
            cw: number,
            ch: number,
            pixel: number,
            alpha: number
        ) => {
            if (typeof window === "undefined") return
            const p = Math.max(1, Math.floor(pixel))
            const wSmall = Math.max(1, Math.floor(cw / p))
            const hSmall = Math.max(1, Math.floor(ch / p))

            const { canvas: off, ctx: offCtx } = setupOffscreen(wSmall, hSmall)
            if (!offCtx) return

            off.width = wSmall
            off.height = hSmall

            offCtx.setTransform(1, 0, 0, 1, 0, 0)
            offCtx.clearRect(0, 0, wSmall, hSmall)
            offCtx.globalAlpha = 1
            offCtx.imageSmoothingEnabled = true
            drawImageCover(offCtx, img, wSmall, hSmall)

            ctx.save()
            ctx.globalAlpha = clamp(alpha, 0, 1)
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(off, 0, 0, wSmall, hSmall, 0, 0, cw, ch)
            ctx.restore()
            ctx.imageSmoothingEnabled = true
        },
        [drawImageCover, setupOffscreen]
    )

    const drawGlitchSlices = React.useCallback(
        (
            ctx: CanvasRenderingContext2D,
            img: HTMLImageElement,
            cw: number,
            ch: number,
            strength: number,
            count: number,
            seed: number,
            timeT: number
        ) => {
            const rand = mulberry32(seed)
            const s = clamp(strength, 0, 1)
            const n = Math.max(1, Math.floor(count))

            for (let i = 0; i < n; i++) {
                const y = Math.floor(rand() * ch)
                const sliceH = Math.max(2, Math.floor((rand() * 0.08 + 0.01) * ch))
                const h = Math.min(sliceH, ch - y)

                const phase = rand() * Math.PI * 2
                const wobble = 0.35 + 0.65 * Math.sin(phase + timeT * 10)

                const xShift = (rand() * 2 - 1) * (cw * 0.08) * s * wobble
                const yShift = (rand() * 2 - 1) * (ch * 0.01) * s * wobble

                ctx.save()
                ctx.beginPath()
                ctx.rect(0, y, cw, h)
                ctx.clip()
                ctx.translate(xShift, yShift)

                ctx.globalAlpha = 0.9
                drawImageCover(ctx, img, cw, ch)

                ctx.globalAlpha = 0.35
                ctx.globalCompositeOperation = "screen"
                const color = rand() > 0.66 ? "rgba(255,0,80,1)" : rand() > 0.33 ? "rgba(0,255,200,1)" : "rgba(80,120,255,1)"
                ctx.fillStyle = color
                ctx.fillRect(-xShift, y - yShift, cw, h)

                ctx.restore()
                ctx.globalCompositeOperation = "source-over"
            }
        },
        [drawImageCover]
    )

    const renderTransitionFrame = React.useCallback(
        (now: number) => {
            if (typeof window === "undefined") return
            const canvas = canvasRef.current
            const el = viewportRef.current
            if (!canvas || !el) return

            const fromSlide = imagesSafe[clamp(fromIndexRef.current, 0, Math.max(0, imagesSafe.length - 1))]
            const toSlide =
                toIndexRef.current != null
                    ? imagesSafe[clamp(toIndexRef.current, 0, Math.max(0, imagesSafe.length - 1))]
                    : null

            const fromImg = ensureImage(fromSlide?.image?.src || "")
            const toImg = ensureImage(toSlide?.image?.src || "")

            const ctx = canvas.getContext("2d")
            if (!ctx) return

            const rect = el.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            const cw = Math.max(1, Math.round(rect.width * dpr))
            const ch = Math.max(1, Math.round(rect.height * dpr))

            if (canvas.width !== cw || canvas.height !== ch) {
                canvas.width = cw
                canvas.height = ch
            }

            const start = transitionStartRef.current
            const dur = Math.max(120, transitionMs)
            const rawT = clamp((now - start) / dur, 0, 1)
            const t = easeInOutCubic(rawT)

            // Deterministic per-transition randomness (stable across frames for fluid motion)
            const seed = transitionSeedRef.current
            const rand = mulberry32(seed)

            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, cw, ch)

            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, cw, ch)

            const showFrom = !!fromImg && (fromImg.complete || fromImg.naturalWidth > 0)
            const showTo = !!toImg && (toImg.complete || toImg.naturalWidth > 0)

            if (transitionEffect === "slide") {
                const dir = directionRef.current || 1
                const offset = cw * (1 - t) * dir

                if (showFrom) {
                    ctx.save()
                    ctx.translate(-cw * t * dir, 0)
                    ctx.globalAlpha = 1
                    drawImageCover(ctx, fromImg!, cw, ch)
                    ctx.restore()
                }

                if (showTo) {
                    ctx.save()
                    ctx.translate(offset, 0)
                    ctx.globalAlpha = 1
                    drawImageCover(ctx, toImg!, cw, ch)
                    ctx.restore()
                }

                ctx.globalAlpha = 1
            } else if (transitionEffect === "dissolve") {
                if (showFrom) {
                    ctx.globalAlpha = 1
                    drawImageCover(ctx, fromImg!, cw, ch)
                }
                ctx.globalAlpha = 1

                if (showTo) {
                    const blocks = 220
                    ctx.save()
                    ctx.beginPath()
                    for (let i = 0; i < blocks; i++) {
                        // deterministic per transition
                        const rx = rand()
                        const ry = rand()
                        const rw = (0.02 + rand() * 0.08) * cw
                        const rh = (0.01 + rand() * 0.06) * ch
                        if (rand() < t) {
                            ctx.rect(rx * cw, ry * ch, rw, rh)
                        }
                    }
                    ctx.clip()
                    drawImageCover(ctx, toImg!, cw, ch)
                    ctx.restore()
                }
            } else if (transitionEffect === "fade") {
                if (showFrom) {
                    ctx.globalAlpha = 1 - t
                    drawImageCover(ctx, fromImg!, cw, ch)
                }
                if (showTo) {
                    ctx.globalAlpha = t
                    drawImageCover(ctx, toImg!, cw, ch)
                }
                ctx.globalAlpha = 1
            } else {
                const midPulse = Math.sin(Math.PI * t)
                const s = clamp(glitchStrength, 0, 1) * midPulse

                if (showFrom) {
                    ctx.globalAlpha = 1 - t
                    drawImageCover(ctx, fromImg!, cw, ch)
                }

                if (showTo) {
                    ctx.globalAlpha = t
                    drawImageCover(ctx, toImg!, cw, ch)
                }
                ctx.globalAlpha = 1

                const base = showTo ? toImg! : showFrom ? fromImg! : null
                if (base) {
                    const phase = rand() * Math.PI * 2
                    const shift = Math.max(0, rgbShiftPx) * dpr * s * (0.65 + 0.35 * Math.sin(phase + t * 12))
                    const a = clamp(0.55 * s, 0, 0.55)

                    ctx.globalCompositeOperation = "screen"
                    drawTintedShift(ctx, base, cw, ch, -shift, 0, "rgba(255,0,90,1)", a)
                    drawTintedShift(ctx, base, cw, ch, shift, 0, "rgba(0,255,220,1)", a)
                    drawTintedShift(ctx, base, cw, ch, 0, -shift * 0.5, "rgba(80,120,255,1)", a * 0.9)
                    ctx.globalCompositeOperation = "source-over"

                    drawGlitchSlices(ctx, base, cw, ch, s, sliceCount, seed, t)

                    // Subtle pixelation pulse blended on top (kept light for smoothness)
                    const px = Math.max(1, pixelSize) * dpr * (0.6 + 1.2 * midPulse)
                    ctx.save()
                    ctx.globalAlpha = clamp(0.22 * s, 0, 0.22)
                    drawPixelated(ctx, base, cw, ch, px, 1)
                    ctx.restore()
                }
            }

            if (rawT < 1) {
                rafRef.current = window.requestAnimationFrame(renderTransitionFrame)
                return
            }

            stopRaf()
            React.startTransition(() => {
                const finalIndex =
                    toIndexRef.current != null
                        ? clamp(toIndexRef.current, 0, Math.max(0, imagesSafe.length - 1))
                        : activeIndex
                setIndex(finalIndex)
                setToIndex(null)
                setIsTransitioning(false)
            })
            toIndexRef.current = null
        },
        [
            activeIndex,
            backgroundColor,
            drawGlitchSlices,
            drawImageCover,
            drawPixelated,
            drawTintedShift,
            ensureImage,
            imagesSafe,
            imagesSafe.length,
            pixelSize,
            rgbShiftPx,
            sliceCount,
            stopRaf,
            transitionMs,
            glitchStrength,
            transitionEffect,
        ]
    )

    const goTo = React.useCallback(
        (next: number) => {
            if (isStatic) {
                React.startTransition(() => setIndex(clamp(next, 0, imagesSafe.length - 1)))
                return
            }
            if (typeof window === "undefined") return
            if (imagesSafe.length <= 1) return
            const n = clamp(next, 0, imagesSafe.length - 1)
            if (n === activeIndex) return
            if (isTransitioning) return

            stopRaf()
            transitionStartRef.current = window.performance.now()
            transitionSeedRef.current =
                (Math.floor(transitionStartRef.current * 1000) ^
                    ((activeIndex + 1) * 1000003) ^
                    ((n + 1) * 9176)) >>>
                0
            fromIndexRef.current = activeIndex
            toIndexRef.current = n
            directionRef.current = (activeIndex + 1) % imagesSafe.length === n ? 1 : -1
            React.startTransition(() => {
                setIsTransitioning(true)
                setToIndex(n)
            })
            rafRef.current = window.requestAnimationFrame(renderTransitionFrame)
        },
        [activeIndex, imagesSafe.length, isStatic, isTransitioning, renderTransitionFrame, stopRaf]
    )

    const next = React.useCallback(() => {
        if (imagesSafe.length <= 1) return
        goTo((activeIndex + 1) % imagesSafe.length)
    }, [activeIndex, goTo, imagesSafe.length])

    const prev = React.useCallback(() => {
        if (imagesSafe.length <= 1) return
        goTo((activeIndex - 1 + imagesSafe.length) % imagesSafe.length)
    }, [activeIndex, goTo, imagesSafe.length])

    React.useEffect(() => {
        if (isStatic) return
        if (!autoplay) return
        if (!inView) return
        if (isTransitioning) return
        if (pauseOnHover && isHovering) return
        if (typeof window === "undefined") return
        if (imagesSafe.length <= 1) return

        const ms = Math.max(0.6, autoplaySeconds) * 1000
        const id = window.setInterval(() => {
            next()
        }, ms)

        return () => window.clearInterval(id)
    }, [autoplay, autoplaySeconds, inView, isHovering, isStatic, isTransitioning, next, pauseOnHover, imagesSafe.length])

    const objectPosition = React.useMemo(() => getObjectPosition(align), [align])

    const arrowButtonStyle: React.CSSProperties = React.useMemo(() => {
        const base: React.CSSProperties = {
            appearance: "none",
            border: `${arrowBorderWidth}px solid ${arrowBorderColor}`,
            background: arrowBackground,
            color: arrowColor,
            borderRadius: arrowRadius,
            padding: arrowPadding,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            backdropFilter: "blur(10px)",
        }
        if (arrowStyle === "minimal") {
            return {
                ...base,
                background: "transparent",
                border: "none",
                padding: "6px",
                backdropFilter: "none",
            }
        }
        return base
    }, [
        arrowBackground,
        arrowBorderColor,
        arrowBorderWidth,
        arrowColor,
        arrowPadding,
        arrowRadius,
        arrowStyle,
    ])

    const canNavigate = imagesSafe.length > 1 && !isTransitioning

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                background: backgroundColor,
                display: "flex",
                flexDirection: "column",
                gap: showTitle ? `${Math.max(0, titleGap)}px` : undefined,
                ...style,
            }}
            onMouseEnter={
                pauseOnHover
                    ? () => {
                          React.startTransition(() => setIsHovering(true))
                      }
                    : undefined
            }
            onMouseLeave={
                pauseOnHover
                    ? () => {
                          React.startTransition(() => setIsHovering(false))
                      }
                    : undefined
            }
            role="region"
            aria-label="Image slider"
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    flex: "1 1 auto",
                    minHeight: 0,
                    overflow: "hidden",
                    padding: imagePadding,
                }}
            >
                <div
                    ref={viewportRef}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        borderRadius: imageBorderRadius,
                    }}
                >
                    <img
                        src={active?.image?.src}
                        srcSet={active?.image?.srcSet}
                        alt={active?.image?.alt || ""}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: fit,
                            objectPosition,
                            borderRadius: imageBorderRadius,
                            opacity: isTransitioning ? 0 : 1,
                            transition: "none",
                            willChange: "opacity",
                            pointerEvents: "none",
                            userSelect: "none",
                            zIndex: 0,
                        }}
                        draggable={false}
                    />

                    <canvas
                        ref={canvasRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            borderRadius: imageBorderRadius,
                            opacity: isTransitioning ? 1 : 0,
                            transition: "none",
                            willChange: "opacity",
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                        aria-hidden
                    />

                    {activeLink && (
                        <a
                            href={activeLink}
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 1,
                                cursor: "pointer",
                                textDecoration: "none",
                                color: "inherit",
                            }}
                            aria-label={active?.title || active?.image?.alt || "Open slide link"}
                        />
                    )}

                    {showArrows && imagesSafe.length > 1 && (
                        <>
                            <button
                                type="button"
                                aria-label="Previous slide"
                                onClick={canNavigate ? prev : undefined}
                                disabled={!canNavigate}
                                style={{
                                    ...arrowButtonStyle,
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    opacity: canNavigate ? 1 : 0.6,
                                    zIndex: 3,
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path
                                        d="M15 6l-6 6 6 6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>

                            <button
                                type="button"
                                aria-label="Next slide"
                                onClick={canNavigate ? next : undefined}
                                disabled={!canNavigate}
                                style={{
                                    ...arrowButtonStyle,
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    opacity: canNavigate ? 1 : 0.6,
                                    zIndex: 3,
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path
                                        d="M9 6l6 6-6 6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </>
                    )}

                    {showDots && imagesSafe.length > 1 && (
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                bottom: 12,
                                transform: "translateX(-50%)",
                                display: "flex",
                                gap: 8,
                                padding: dotsPadding,
                                borderRadius: dotRadius,
                                background: dotBackground,
                                backdropFilter: "blur(10px)",
                                zIndex: 3,
                            }}
                            role="tablist"
                            aria-label="Slides"
                        >
                            {imagesSafe.map((_, i) => {
                                const isActive = i === activeIndex
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        aria-label={`Go to slide ${i + 1}`}
                                        aria-selected={isActive}
                                        role="tab"
                                        onClick={canNavigate ? () => goTo(i) : undefined}
                                        disabled={!canNavigate}
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 99,
                                            border: "none",
                                            padding: 0,
                                            background: isActive ? dotActiveColor : dotColor,
                                            opacity: canNavigate ? 1 : 0.7,
                                            cursor: "pointer",
                                        }}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showTitle && titleText.length > 0 && (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        background: titleBackground,
                        color: titleColor,
                        padding: titlePadding,
                        ...titleFont,
                    }}
                    aria-live="polite"
                >
                    <div style={{ width: "100%", minWidth: 0 }}>{titleText}</div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(GlitchImageSlider, {
    images: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 10,
        defaultValue: defaultSlides,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    fit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    align: {
        type: ControlType.Enum,
        title: "Image Align",
        options: ["center", "top", "bottom", "left", "right"],
        defaultValue: "center",
    },
    imagePadding: {
        type: ControlType.Padding,
        title: "Image Padding",
        defaultValue: "0px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Container Radius",
        defaultValue: "16px",
    },
    imageBorderRadius: {
        type: ControlType.BorderRadius,
        title: "Image Radius",
        defaultValue: "16px",
    },

    showTitle: {
        type: ControlType.Boolean,
        title: "Title",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: ({ showTitle }) => !showTitle,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
        hidden: ({ showTitle }) => !showTitle,
    },
    titleBackground: {
        type: ControlType.Color,
        title: "Title Background",
        defaultValue: "transparent",
        hidden: ({ showTitle }) => !showTitle,
    },
    titlePadding: {
        type: ControlType.Padding,
        title: "Title Padding",
        defaultValue: "12px 12px",
        hidden: ({ showTitle }) => !showTitle,
    },
    titleGap: {
        type: ControlType.Number,
        title: "Title Gap",
        defaultValue: 0,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ showTitle }) => !showTitle,
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplaySeconds: {
        type: ControlType.Number,
        title: "Autoplay Interval",
        defaultValue: 3,
        min: 0.6,
        max: 20,
        step: 0.1,
        unit: "s",
        hidden: ({ autoplay }) => !autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ autoplay }) => !autoplay,
    },

    transitionEffect: {
        type: ControlType.Enum,
        title: "Transition Effect",
        options: ["glitch", "fade", "slide", "dissolve"],
        optionTitles: ["Glitch", "Fade", "Slide", "Dissolve"],
        defaultValue: "glitch",
    },
    transitionMs: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 520,
        min: 120,
        max: 2000,
        step: 10,
        unit: "ms",
    },

    glitchStrength: {
        type: ControlType.Number,
        title: "Glitch Strength",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ transitionEffect }) => transitionEffect !== "glitch",
    },
    rgbShiftPx: {
        type: ControlType.Number,
        title: "RGB Shift",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ transitionEffect }) => transitionEffect !== "glitch",
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 10,
        min: 1,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ transitionEffect }) => transitionEffect !== "glitch",
    },
    sliceCount: {
        type: ControlType.Number,
        title: "Slice Count",
        defaultValue: 14,
        min: 4,
        max: 40,
        step: 1,
        hidden: ({ transitionEffect }) => transitionEffect !== "glitch",
    },

    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowStyle: {
        type: ControlType.Enum,
        title: "Arrow Style",
        options: ["pill", "minimal"],
        optionTitles: ["Pill", "Minimal"],
        defaultValue: "pill",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#000000",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowBackground: {
        type: ControlType.Color,
        title: "Arrow Background",
        defaultValue: "#FFFFFF",
        hidden: ({ showArrows, arrowStyle }) => !showArrows || arrowStyle === "minimal",
    },
    arrowBorderColor: {
        type: ControlType.Color,
        title: "Arrow Border Color",
        defaultValue: "#EEEEEE",
        hidden: ({ showArrows, arrowStyle }) => !showArrows || arrowStyle === "minimal",
    },
    arrowBorderWidth: {
        type: ControlType.Number,
        title: "Arrow Border Width",
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 1,
        hidden: ({ showArrows, arrowStyle }) => !showArrows || arrowStyle === "minimal",
    },
    arrowRadius: {
        type: ControlType.BorderRadius,
        title: "Arrow Radius",
        defaultValue: "999px",
        hidden: ({ showArrows, arrowStyle }) => !showArrows || arrowStyle === "minimal",
    },
    arrowPadding: {
        type: ControlType.Padding,
        title: "Arrow Padding",
        defaultValue: "10px",
        hidden: ({ showArrows }) => !showArrows,
    },

    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#CCCCCC",
        hidden: ({ showDots }) => !showDots,
    },
    dotActiveColor: {
        type: ControlType.Color,
        title: "Dot Active",
        defaultValue: "#000000",
        hidden: ({ showDots }) => !showDots,
    },
    dotBackground: {
        type: ControlType.Color,
        title: "Dots Background",
        defaultValue: "#FFFFFF",
        hidden: ({ showDots }) => !showDots,
    },
    dotRadius: {
        type: ControlType.BorderRadius,
        title: "Dots Radius",
        defaultValue: "999px",
        hidden: ({ showDots }) => !showDots,
    },
    dotsPadding: {
        type: ControlType.Padding,
        title: "Dots Padding",
        defaultValue: "10px",
        hidden: ({ showDots }) => !showDots,
    },
})