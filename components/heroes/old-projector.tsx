// Old-fashioned projector component. Accepts a photo or video and projects
// it onto the frame like a real projector aimed at a wall: keystone
// perspective distortion (tilt + depth), zoom (small beam to large beam),
// free positioning of the beam, an "age" dial that blends heavy vintage
// grain/flicker/vignette into a crisp modern look, an optional monochrome
// mode, edge feathering, and a glitch toggle whose intensity ranges from
// barely-there to heavy VHS-style tearing. Also supports a Gallery layout:
// an unlimited, wrapping grid of projected photos/videos, each with the
// same vintage treatment and an optional caption underneath.
import { useEffect, useMemo, useRef, useState, startTransition } from 'react'
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from 'framer-motion'

interface ProjectorImage {
    src: string
    srcSet?: string
    alt?: string
}

interface GalleryItem {
    mediaType: 'photo' | 'video'
    image?: ProjectorImage
    video?: string
    title?: string
}

interface OldProjectorProps {
    layout: 'single' | 'gallery'
    mediaType: 'photo' | 'video'
    image: ProjectorImage
    video: string
    zoom: number
    positionX: number
    positionY: number
    tiltX: number
    tiltY: number
    depth: number
    straightOn: boolean
    items: GalleryItem[]
    arrangement: 'grid' | 'columns' | 'stack'
    columns: number
    itemSize: number
    gap: number
    showTitles: boolean
    captionColor: string
    captionFont?: React.CSSProperties
    galleryTiltX: number
    galleryTiltY: number
    galleryDepth: number
    age: number
    monochrome: boolean
    opacity: number
    edgeBlur: number
    glitch: boolean
    glitchIntensity: number
    maxWidth: number
    wallColor: string
    style?: React.CSSProperties
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

interface ProjectedTileProps {
    mediaType: 'photo' | 'video'
    image?: ProjectorImage
    video?: string
    title?: string
    showTitle: boolean
    captionColor: string
    captionFont?: React.CSSProperties
    sizePx: number | string
    mediaFilter: string
    edgeMaskImage: string | null
    grainOpacity: number
    vignetteOpacity: number
    vignetteBackground: string
    scratchBaseOpacity: number
    flickerMagnitude: number
    grainEveryN: number
    textureOpacity: number
    screenTextureBackground: string
    opacity: number
    glitch: boolean
    glitchIntensity: number
    skipStaticAnimation: boolean
}

// A single projected tile used by the gallery grid. Mirrors the single-mode
// beam's vintage treatment (grain, texture, vignette, edge feather, glitch)
// but sizes itself to its own media's aspect ratio and animates
// independently so tiles don't flicker/glitch in lockstep.
function ProjectedTile(props: ProjectedTileProps) {
    const {
        mediaType,
        image,
        video,
        title,
        showTitle,
        captionColor,
        captionFont = {},
        sizePx,
        mediaFilter,
        edgeMaskImage,
        grainOpacity,
        vignetteOpacity,
        vignetteBackground,
        scratchBaseOpacity,
        flickerMagnitude,
        grainEveryN,
        textureOpacity,
        screenTextureBackground,
        opacity,
        glitch,
        glitchIntensity,
        skipStaticAnimation,
    } = props

    const wrapRef = useRef<HTMLDivElement | null>(null)
    const frameRef = useRef<HTMLDivElement | null>(null)
    const clipRef = useRef<HTMLDivElement | null>(null)
    const mediaWrapRef = useRef<HTMLDivElement | null>(null)
    const mediaElRef = useRef<HTMLImageElement | HTMLVideoElement | null>(
        null
    )
    const grainCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const glitchTearRef = useRef<HTMLDivElement | null>(null)
    const scratchRefs = useRef<Array<HTMLDivElement | null>>([])

    const [aspect, setAspect] = useState(4 / 3)

    // Checked directly here (in addition to the flag threaded down from the
    // parent) so this component never drives continuous animation/canvas
    // redraws when rendered by the Framer canvas or during a static export —
    // only the plain, already-styled elements are shown.
    const isStaticSelf = useIsStaticRenderer()
    const isInView = useInView(wrapRef, { once: false, amount: 0.15 })
    const skipAnimation = skipStaticAnimation || isStaticSelf || !isInView

    function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const el = e.currentTarget
        if (el.naturalWidth && el.naturalHeight) {
            startTransition(() => setAspect(el.naturalWidth / el.naturalHeight))
        }
    }

    function handleVideoMeta(e: React.SyntheticEvent<HTMLVideoElement>) {
        const el = e.currentTarget
        if (el.videoWidth && el.videoHeight) {
            startTransition(() => setAspect(el.videoWidth / el.videoHeight))
        }
    }

    const layoutRef = useRef<() => void>(() => {})
    layoutRef.current = () => {
        const el = clipRef.current
        const canvas = grainCanvasRef.current
        if (!el || !canvas) return
        const rect = el.getBoundingClientRect()
        const res = 0.35
        const w = Math.max(2, Math.round(rect.width * res))
        const h = Math.max(2, Math.round(rect.height * res))
        if (canvas.width !== w) canvas.width = w
        if (canvas.height !== h) canvas.height = h
    }

    useEffect(() => {
        layoutRef.current()
    }, [aspect])

    useEffect(() => {
        const el = clipRef.current
        if (!el || typeof ResizeObserver === 'undefined') return
        const ro = new ResizeObserver(() => layoutRef.current())
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (mediaType !== 'video') return
        const el = mediaElRef.current as HTMLVideoElement | null
        if (!el) return
        if (isInView && !skipStaticAnimation && !isStaticSelf) {
            el.play?.().catch(() => {})
        } else {
            el.pause?.()
        }
    }, [isInView, skipStaticAnimation, isStaticSelf, mediaType])

    function drawGrain() {
        const canvas = grainCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const { width, height } = canvas
        if (width < 1 || height < 1) return
        const imageData = ctx.createImageData(width, height)
        const buf = imageData.data
        for (let i = 0; i < buf.length; i += 4) {
            const v = Math.random() * 255
            buf[i] = v
            buf[i + 1] = v
            buf[i + 2] = v
            buf[i + 3] = 255
        }
        ctx.putImageData(imageData, 0, 0)
    }

    useEffect(() => {
        if (skipAnimation) {
            drawGrain()
            if (frameRef.current) frameRef.current.style.filter = 'brightness(1)'
            if (glitchTearRef.current) glitchTearRef.current.style.opacity = '0'
            if (mediaWrapRef.current)
                mediaWrapRef.current.style.transform = 'translateX(0px)'
            return
        }

        let raf = 0
        let frame = 0
        const glitchState = {
            active: false,
            until: 0,
            dx: 0,
            tearY: 0,
            tearH: 0,
        }

        const glitchChancePerFrame =
            0.00015 + (glitchIntensity / 100) * 0.045
        // The tear band's own opacity — barely-there at the lowest
        // intensity, full strength at the highest.
        const tearOpacity = 0.08 + (glitchIntensity / 100) * 0.37

        const loop = (now: number) => {
            frame += 1

            if (frameRef.current) {
                const jitter = (Math.random() - 0.5) * 2 * flickerMagnitude
                frameRef.current.style.filter = `brightness(${(1 + jitter).toFixed(3)})`
            }

            if (frame % grainEveryN === 0) drawGrain()

            if (frame % 6 === 0) {
                // Only ever show at most one scratch line at a time — a
                // cluster of several flickering together read as "too many
                // lines" rather than an occasional stray scratch.
                const activeIndex =
                    Math.random() < scratchBaseOpacity
                        ? Math.floor(Math.random() * scratchRefs.current.length)
                        : -1
                scratchRefs.current.forEach((el, i) => {
                    if (!el) return
                    if (i === activeIndex) {
                        el.style.opacity = String(0.15 + Math.random() * 0.4)
                        el.style.left = `${Math.random() * 100}%`
                    } else {
                        el.style.opacity = '0'
                    }
                })
            }

            if (glitch) {
                if (!glitchState.active) {
                    if (Math.random() < glitchChancePerFrame) {
                        glitchState.active = true
                        glitchState.until =
                            now +
                            15 +
                            Math.random() * 35 +
                            (glitchIntensity / 100) * 180
                        const mag = 0.2 + (glitchIntensity / 100) * 22
                        glitchState.dx = (Math.random() - 0.5) * 2 * mag
                        glitchState.tearY = Math.random() * 90
                        glitchState.tearH =
                            0.4 + (glitchIntensity / 100) * 9
                    }
                } else if (now > glitchState.until) {
                    glitchState.active = false
                }

                if (mediaWrapRef.current) {
                    mediaWrapRef.current.style.transform = glitchState.active
                        ? `translateX(${glitchState.dx.toFixed(2)}px)`
                        : 'translateX(0px)'
                }
                if (glitchTearRef.current) {
                    if (glitchState.active) {
                        glitchTearRef.current.style.opacity =
                            String(tearOpacity)
                        glitchTearRef.current.style.top = `${glitchState.tearY}%`
                        glitchTearRef.current.style.height = `${glitchState.tearH}%`
                    } else {
                        glitchTearRef.current.style.opacity = '0'
                    }
                }
            } else {
                if (mediaWrapRef.current)
                    mediaWrapRef.current.style.transform = 'translateX(0px)'
                if (glitchTearRef.current)
                    glitchTearRef.current.style.opacity = '0'
            }

            raf = requestAnimationFrame(loop)
        }

        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [
        skipAnimation,
        flickerMagnitude,
        grainEveryN,
        scratchBaseOpacity,
        glitch,
        glitchIntensity,
    ])

    return (
        <div
            ref={wrapRef}
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: sizePx,
                flexShrink: 0,
            }}
        >
            <div
                ref={frameRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: String(aspect),
                    opacity: Math.max(0, Math.min(100, opacity)) / 100,
                    willChange: 'filter',
                }}
            >
                <div
                    ref={clipRef}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'hidden',
                        boxShadow:
                            'inset 0 0 24px rgba(255,255,255,0.08), inset 0 0 8px rgba(0,0,0,0.16)',
                        ...(edgeMaskImage
                            ? {
                                  WebkitMaskImage: edgeMaskImage,
                                  maskImage: edgeMaskImage,
                                  WebkitMaskComposite: 'source-in',
                                  maskComposite: 'intersect',
                                  WebkitMaskSize: '100% 100%',
                                  maskSize: '100% 100%',
                              }
                            : {}),
                    }}
                >
                    <div
                        ref={mediaWrapRef}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            filter: mediaFilter,
                            willChange: 'transform',
                        }}
                    >
                        {mediaType === 'video' ? (
                            <video
                                ref={(el) => {
                                    mediaElRef.current = el
                                }}
                                src={video}
                                muted
                                loop
                                playsInline
                                autoPlay={!isStaticSelf}
                                onLoadedMetadata={handleVideoMeta}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        ) : (
                            <img
                                ref={(el) => {
                                    mediaElRef.current = el
                                }}
                                src={image?.src}
                                srcSet={image?.srcSet}
                                alt={image?.alt || title || ''}
                                onLoad={handleImageLoad}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        )}
                    </div>

                    <canvas
                        ref={grainCanvasRef}
                        aria-hidden='true'
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            mixBlendMode: 'overlay',
                            opacity: grainOpacity,
                            pointerEvents: 'none',
                        }}
                    />

                    <div
                        aria-hidden='true'
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            mixBlendMode: 'soft-light',
                            opacity: textureOpacity,
                            backgroundImage: screenTextureBackground,
                        }}
                    />

                    <div
                        aria-hidden='true'
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background: vignetteBackground,
                            opacity: vignetteOpacity,
                        }}
                    />

                    <div
                        aria-hidden='true'
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                        }}
                    >
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                ref={(el) => {
                                    scratchRefs.current[i] = el
                                }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    width: '1px',
                                    height: '100%',
                                    background: 'rgba(255,255,255,0.85)',
                                    mixBlendMode: 'screen',
                                    opacity: 0,
                                }}
                            />
                        ))}
                    </div>

                    {glitch && (
                        <div
                            ref={glitchTearRef}
                            aria-hidden='true'
                            style={{
                                position: 'absolute',
                                left: 0,
                                width: '100%',
                                pointerEvents: 'none',
                                mixBlendMode: 'difference',
                                background: 'rgba(255,255,255,0.6)',
                                opacity: 0,
                            }}
                        />
                    )}
                </div>
            </div>

            {showTitle && title ? (
                <div
                    style={{
                        marginTop: 8,
                        fontSize: 13,
                        lineHeight: 1.4,
                        color: captionColor,
                        ...captionFont,
                    }}
                >
                    {title}
                </div>
            ) : null}
        </div>
    )
}

/**
 * Old Projector
 *
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function OldProjector(props: OldProjectorProps) {
    const {
        layout = 'single',
        mediaType = 'photo',
        image = {
            src: 'https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg',
            alt: 'Projected photo',
        },
        video = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        zoom = 100,
        positionX = 0,
        positionY = 0,
        tiltX = 18,
        tiltY = 8,
        depth = 900,
        straightOn = false,
        items = [],
        arrangement = 'grid',
        columns = 3,
        itemSize = 220,
        gap = 28,
        showTitles = true,
        captionColor = '#EDEDED',
        captionFont = {},
        galleryTiltX = 0,
        galleryTiltY = 0,
        galleryDepth = 900,
        age = 25,
        monochrome = false,
        opacity = 100,
        edgeBlur = 20,
        glitch = true,
        glitchIntensity = 25,
        maxWidth = 0,
        wallColor = 'rgba(0,0,0,0)',
        style,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const beamRef = useRef<HTMLDivElement | null>(null)
    const galleryGridRef = useRef<HTMLDivElement | null>(null)
    const mediaWrapRef = useRef<HTMLDivElement | null>(null)
    const mediaElRef = useRef<HTMLImageElement | HTMLVideoElement | null>(
        null
    )
    const grainCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const glitchTearRef = useRef<HTMLDivElement | null>(null)
    const scratchRefs = useRef<Array<HTMLDivElement | null>>([])

    const [mediaAspect, setMediaAspect] = useState({ w: 4, h: 3 })

    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { once: false, amount: 0.15 })

    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') return false
        return (
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
            false
        )
    }, [])

    const skipStaticAnimation = isStatic || prefersReducedMotion
    const skipAnimation = skipStaticAnimation || !isInView

    // 0 = fully vintage, 1 = fully modern.
    const t = Math.min(1, Math.max(0, age / 100))

    const grainOpacity = lerp(0.5, 0.09, t)
    const vignetteOpacity = lerp(0.55, 0.1, t)
    const scratchBaseOpacity = lerp(0.4, 0.03, t)
    const flickerMagnitude = lerp(0.12, 0.015, t)
    const grainEveryN = Math.max(1, Math.round(lerp(2, 6, t)))
    // Real projections are never perfectly crisp — soften more the older it is.
    const blurPx = lerp(1.6, 0.55, t)
    const textureOpacity = lerp(0.16, 0.06, t)

    const mediaFilter = useMemo(() => {
        const contrast = lerp(0.82, 1.05, t)
        const saturate = monochrome ? 0 : lerp(0.55, 1.05, t)
        const sepia = monochrome ? 0 : lerp(0.32, 0, t)
        const grayscale = monochrome ? 1 : 0
        return `grayscale(${grayscale}) sepia(${sepia.toFixed(
            3
        )}) contrast(${contrast.toFixed(3)}) saturate(${saturate.toFixed(
            3
        )}) blur(${blurPx.toFixed(2)}px)`
    }, [monochrome, t, blurPx])

    const vignetteBackground =
        'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.9) 100%)'

    // A faint woven/canvas-like pattern standing in for the texture of the
    // physical projection surface, independent of the film-grain flicker.
    const screenTextureBackground = useMemo(
        () =>
            [
                'repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
                'repeating-linear-gradient(25deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)',
            ].join(', '),
        []
    )

    // Feathers all four edges of the beam so it fades into the wall instead
    // of cutting off sharply — built from two intersecting linear-gradient
    // masks, one per axis, so the falloff also softens naturally into the
    // corners.
    const edgeMask = useMemo(() => {
        const feather = Math.max(
            0,
            Math.min(48, (Math.max(0, Math.min(100, edgeBlur)) / 100) * 48)
        )
        if (feather <= 0.01) return null
        const image = `linear-gradient(to right, transparent 0%, black ${feather}%, black ${100 - feather}%, transparent 100%), linear-gradient(to bottom, transparent 0%, black ${feather}%, black ${100 - feather}%, transparent 100%)`
        return { image }
    }, [edgeBlur])

    // Keep the media's natural aspect ratio so the beam letterboxes correctly.
    function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const el = e.currentTarget
        if (el.naturalWidth && el.naturalHeight) {
            startTransition(() =>
                setMediaAspect({ w: el.naturalWidth, h: el.naturalHeight })
            )
        }
    }

    function handleVideoMeta(e: React.SyntheticEvent<HTMLVideoElement>) {
        const el = e.currentTarget
        if (el.videoWidth && el.videoHeight) {
            startTransition(() =>
                setMediaAspect({ w: el.videoWidth, h: el.videoHeight })
            )
        }
    }

    // Positions and sizes the projected beam based on zoom / position / the
    // media's aspect ratio / the container's current size.
    const layoutRef = useRef<() => void>(() => {})
    layoutRef.current = () => {
        const container = containerRef.current
        const beam = beamRef.current
        if (!container || !beam) return

        const rect = container.getBoundingClientRect()
        const cw = rect.width || 1
        const ch = rect.height || 1
        const aspect = mediaAspect.w / mediaAspect.h || 4 / 3
        const containerAspect = cw / ch

        let baseW: number
        let baseH: number
        if (aspect > containerAspect) {
            baseW = cw * 0.92
            baseH = baseW / aspect
        } else {
            baseH = ch * 0.92
            baseW = baseH * aspect
        }

        const z = Math.max(0.05, zoom / 100)
        const beamW = baseW * z
        const beamH = baseH * z

        const posX = straightOn ? 0 : positionX
        const posY = straightOn ? 0 : positionY
        const tx = straightOn ? 0 : tiltX
        const ty = straightOn ? 0 : tiltY

        beam.style.width = `${beamW}px`
        beam.style.height = `${beamH}px`
        beam.style.left = `${50 + posX}%`
        beam.style.top = `${50 + posY}%`

        // CSS perspective() is a fixed pixel distance, so the same value
        // produces wildly different keystone severity depending on how big
        // the beam actually renders — mild on a small canvas frame, extreme
        // once a "Fill" width frame stretches the beam to fill a wide
        // section or the whole viewport on the published site (the beam can
        // end up bigger than the perspective distance itself, causing the
        // exaggerated, clipped-looking warp). Scale the effective distance
        // with the beam's own width so the keystone look stays consistent
        // no matter how large or small the beam renders. 640 matches the
        // frame width the default Depth value (900) was tuned against.
        const effectiveDepth = Math.max(50, depth * (beamW / 640))

        beam.style.transform = `translate(-50%, -50%) perspective(${effectiveDepth}px) rotateX(${tx}deg) rotateY(${ty}deg)`

        const canvas = grainCanvasRef.current
        if (canvas) {
            const res = 0.35
            const w = Math.max(2, Math.round(beamW * res))
            const h = Math.max(2, Math.round(beamH * res))
            if (canvas.width !== w) canvas.width = w
            if (canvas.height !== h) canvas.height = h
        }
    }

    useEffect(() => {
        if (layout !== 'single') return
        layoutRef.current()
    }, [
        layout,
        zoom,
        positionX,
        positionY,
        tiltX,
        tiltY,
        depth,
        straightOn,
        mediaAspect,
    ])

    useEffect(() => {
        if (layout !== 'single') return
        const container = containerRef.current
        if (!container || typeof ResizeObserver === 'undefined') return
        const ro = new ResizeObserver(() => layoutRef.current())
        ro.observe(container)
        return () => ro.disconnect()
    }, [layout])

    // Tilts the whole gallery grid as a single unit (as opposed to each tile
    // individually) — like looking at a wall of projected photos at an
    // angle. Uses the same fixed-pixel-perspective scaling fix as the
    // single-mode beam so the keystone severity stays consistent no matter
    // how large or small the grid renders.
    const galleryLayoutRef = useRef<() => void>(() => {})
    galleryLayoutRef.current = () => {
        const grid = galleryGridRef.current
        if (!grid) return
        if (galleryTiltX === 0 && galleryTiltY === 0) {
            grid.style.transform = 'none'
            return
        }
        const rect = grid.getBoundingClientRect()
        const gridW = rect.width || 1
        const effectiveDepth = Math.max(50, galleryDepth * (gridW / 640))
        grid.style.transform = `perspective(${effectiveDepth}px) rotateX(${galleryTiltX}deg) rotateY(${galleryTiltY}deg)`
    }

    useEffect(() => {
        if (layout !== 'gallery') return
        galleryLayoutRef.current()
    }, [layout, galleryTiltX, galleryTiltY, galleryDepth, items, arrangement])

    useEffect(() => {
        if (layout !== 'gallery') return
        const grid = galleryGridRef.current
        if (!grid || typeof ResizeObserver === 'undefined') return
        const ro = new ResizeObserver(() => galleryLayoutRef.current())
        ro.observe(grid)
        return () => ro.disconnect()
    }, [layout])

    // Play/pause the video based on visibility so it never runs offscreen.
    useEffect(() => {
        if (layout !== 'single' || mediaType !== 'video') return
        const el = mediaElRef.current as HTMLVideoElement | null
        if (!el) return
        if (isInView && !isStatic) {
            el.play?.().catch(() => {})
        } else {
            el.pause?.()
        }
    }, [layout, isInView, isStatic, mediaType])

    function drawGrain() {
        const canvas = grainCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const { width, height } = canvas
        if (width < 1 || height < 1) return
        const imageData = ctx.createImageData(width, height)
        const buf = imageData.data
        for (let i = 0; i < buf.length; i += 4) {
            const v = Math.random() * 255
            buf[i] = v
            buf[i + 1] = v
            buf[i + 2] = v
            buf[i + 3] = 255
        }
        ctx.putImageData(imageData, 0, 0)
    }

    // Single animation loop driving grain, bulb flicker, scratches, and
    // glitch bursts. Paused entirely when static, offscreen, not in single
    // layout, or when the person prefers reduced motion.
    useEffect(() => {
        if (layout !== 'single' || skipAnimation) {
            drawGrain()
            if (beamRef.current) beamRef.current.style.filter = 'brightness(1)'
            if (glitchTearRef.current) glitchTearRef.current.style.opacity = '0'
            if (mediaWrapRef.current)
                mediaWrapRef.current.style.transform = 'translateX(0px)'
            return
        }

        let raf = 0
        let frame = 0
        const glitchState = {
            active: false,
            until: 0,
            dx: 0,
            tearY: 0,
            tearH: 0,
        }

        const glitchChancePerFrame =
            0.00015 + (glitchIntensity / 100) * 0.045
        // The tear band's own opacity — barely-there at the lowest
        // intensity, full strength at the highest.
        const tearOpacity = 0.08 + (glitchIntensity / 100) * 0.37

        const loop = (now: number) => {
            frame += 1

            if (beamRef.current) {
                const jitter = (Math.random() - 0.5) * 2 * flickerMagnitude
                beamRef.current.style.filter = `brightness(${(1 + jitter).toFixed(3)})`
            }

            if (frame % grainEveryN === 0) drawGrain()

            if (frame % 6 === 0) {
                // Only ever show at most one scratch line at a time — a
                // cluster of several flickering together read as "too many
                // lines" rather than an occasional stray scratch.
                const activeIndex =
                    Math.random() < scratchBaseOpacity
                        ? Math.floor(Math.random() * scratchRefs.current.length)
                        : -1
                scratchRefs.current.forEach((el, i) => {
                    if (!el) return
                    if (i === activeIndex) {
                        el.style.opacity = String(0.15 + Math.random() * 0.4)
                        el.style.left = `${Math.random() * 100}%`
                    } else {
                        el.style.opacity = '0'
                    }
                })
            }

            if (glitch) {
                if (!glitchState.active) {
                    if (Math.random() < glitchChancePerFrame) {
                        glitchState.active = true
                        glitchState.until =
                            now +
                            15 +
                            Math.random() * 35 +
                            (glitchIntensity / 100) * 180
                        const mag = 0.2 + (glitchIntensity / 100) * 22
                        glitchState.dx = (Math.random() - 0.5) * 2 * mag
                        glitchState.tearY = Math.random() * 90
                        glitchState.tearH =
                            0.4 + (glitchIntensity / 100) * 9
                    }
                } else if (now > glitchState.until) {
                    glitchState.active = false
                }

                if (mediaWrapRef.current) {
                    mediaWrapRef.current.style.transform = glitchState.active
                        ? `translateX(${glitchState.dx.toFixed(2)}px)`
                        : 'translateX(0px)'
                }
                if (glitchTearRef.current) {
                    if (glitchState.active) {
                        glitchTearRef.current.style.opacity =
                            String(tearOpacity)
                        glitchTearRef.current.style.top = `${glitchState.tearY}%`
                        glitchTearRef.current.style.height = `${glitchState.tearH}%`
                    } else {
                        glitchTearRef.current.style.opacity = '0'
                    }
                }
            } else {
                if (mediaWrapRef.current)
                    mediaWrapRef.current.style.transform = 'translateX(0px)'
                if (glitchTearRef.current)
                    glitchTearRef.current.style.opacity = '0'
            }

            raf = requestAnimationFrame(loop)
        }

        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [
        layout,
        skipAnimation,
        flickerMagnitude,
        grainEveryN,
        scratchBaseOpacity,
        glitch,
        glitchIntensity,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: layout === 'gallery' ? 'auto' : '100%',
                // If the frame's height is set to "Auto" in Framer, the
                // percentage height above resolves to auto and collapses to
                // 0 (the beam is absolutely positioned, so it contributes no
                // intrinsic height). This aspect-ratio fallback only kicks
                // in when height is actually auto — if the frame has a real
                // fixed height, that always wins and this is ignored.
                aspectRatio:
                    layout === 'single'
                        ? `${mediaAspect.w} / ${mediaAspect.h}`
                        : undefined,
                // "visible" for gallery so nothing is ever scroll-clipped —
                // the grid always renders at its full natural size and the
                // flex-centering wrapper below centers it, whatever box the
                // frame happens to be.
                overflow: layout === 'gallery' ? 'visible' : 'hidden',
                background: wallColor,
                // Caps the component so it doesn't stretch edge-to-edge when
                // placed in a full-width section on the published site — 0
                // means no cap (fills whatever frame it's given, as before).
                ...(maxWidth > 0
                    ? { maxWidth: `${maxWidth}px`, margin: '0 auto' }
                    : {}),
                ...style,
            }}
        >
            {layout === 'gallery' ? (
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        minHeight: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        ref={galleryGridRef}
                        style={
                            arrangement === 'stack'
                                ? {
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap,
                                      width: '100%',
                                      transformOrigin: '50% 50%',
                                      willChange: 'transform',
                                  }
                                : arrangement === 'columns'
                                  ? {
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${Math.max(
                                            1,
                                            Math.round(columns)
                                        )}, 1fr)`,
                                        gap,
                                        width: '100%',
                                        alignItems: 'start',
                                        transformOrigin: '50% 50%',
                                        willChange: 'transform',
                                    }
                                  : {
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(auto-fit, minmax(${Math.max(
                                            40,
                                            itemSize
                                        )}px, ${Math.max(40, itemSize)}px))`,
                                        gap,
                                        width: '100%',
                                        alignItems: 'start',
                                        justifyContent: 'center',
                                        transformOrigin: '50% 50%',
                                        willChange: 'transform',
                                    }
                        }
                    >
                        {items.map((item, i) => (
                            <ProjectedTile
                                key={i}
                                mediaType={item?.mediaType || 'photo'}
                                image={item?.image}
                                video={item?.video}
                                title={item?.title}
                                showTitle={showTitles}
                                captionColor={captionColor}
                                captionFont={captionFont}
                                sizePx={
                                    arrangement === 'columns'
                                        ? '100%'
                                        : Math.max(40, itemSize)
                                }
                                mediaFilter={mediaFilter}
                                edgeMaskImage={edgeMask?.image ?? null}
                                grainOpacity={grainOpacity}
                                vignetteOpacity={vignetteOpacity}
                                vignetteBackground={vignetteBackground}
                                scratchBaseOpacity={scratchBaseOpacity}
                                flickerMagnitude={flickerMagnitude}
                                grainEveryN={grainEveryN}
                                textureOpacity={textureOpacity}
                                screenTextureBackground={
                                    screenTextureBackground
                                }
                                opacity={opacity}
                                glitch={glitch}
                                glitchIntensity={glitchIntensity}
                                skipStaticAnimation={skipStaticAnimation}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div
                    ref={beamRef}
                    style={{
                        position: 'absolute',
                        transformOrigin: '50% 50%',
                        willChange: 'transform, filter',
                        opacity: Math.max(0, Math.min(100, opacity)) / 100,
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            overflow: 'hidden',
                            background: 'transparent',
                            boxShadow:
                                'inset 0 0 44px rgba(255,255,255,0.1), inset 0 0 14px rgba(0,0,0,0.18)',
                            ...(edgeMask
                                ? {
                                      WebkitMaskImage: edgeMask.image,
                                      maskImage: edgeMask.image,
                                      WebkitMaskComposite: 'source-in',
                                      maskComposite: 'intersect',
                                      WebkitMaskSize: '100% 100%',
                                      maskSize: '100% 100%',
                                  }
                                : {}),
                        }}
                    >
                        <div
                            ref={mediaWrapRef}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                filter: mediaFilter,
                                willChange: 'transform',
                            }}
                        >
                            {mediaType === 'video' ? (
                                <video
                                    ref={(el) => {
                                        mediaElRef.current = el
                                    }}
                                    src={video}
                                    muted
                                    loop
                                    playsInline
                                    autoPlay={!isStatic}
                                    onLoadedMetadata={handleVideoMeta}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            ) : (
                                <img
                                    ref={(el) => {
                                        mediaElRef.current = el
                                    }}
                                    src={image?.src}
                                    srcSet={image?.srcSet}
                                    alt={image?.alt || ''}
                                    onLoad={handleImageLoad}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                    }}
                                />
                            )}
                        </div>

                        {/* Film grain */}
                        <canvas
                            ref={grainCanvasRef}
                            aria-hidden='true'
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                mixBlendMode: 'overlay',
                                opacity: grainOpacity,
                                pointerEvents: 'none',
                            }}
                        />

                        {/* Woven screen texture — the physical projection surface */}
                        <div
                            aria-hidden='true'
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                mixBlendMode: 'soft-light',
                                opacity: textureOpacity,
                                backgroundImage: screenTextureBackground,
                            }}
                        />

                        {/* Vignette */}
                        <div
                            aria-hidden='true'
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                background: vignetteBackground,
                                opacity: vignetteOpacity,
                            }}
                        />

                        {/* Dust / scratch lines */}
                        <div
                            aria-hidden='true'
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                            }}
                        >
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    ref={(el) => {
                                        scratchRefs.current[i] = el
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        width: '1px',
                                        height: '100%',
                                        background: 'rgba(255,255,255,0.85)',
                                        mixBlendMode: 'screen',
                                        opacity: 0,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Glitch tear band */}
                        {glitch && (
                            <div
                                ref={glitchTearRef}
                                aria-hidden='true'
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    width: '100%',
                                    pointerEvents: 'none',
                                    mixBlendMode: 'difference',
                                    background: 'rgba(255,255,255,0.6)',
                                    opacity: 0,
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(OldProjector, {
    layout: {
        type: ControlType.Enum,
        title: 'Layout',
        options: ['single', 'gallery'],
        optionTitles: ['Single', 'Gallery'],
        defaultValue: 'single',
        displaySegmentedControl: true,
    },
    mediaType: {
        type: ControlType.Enum,
        title: 'Media',
        options: ['photo', 'video'],
        optionTitles: ['Photo', 'Video'],
        defaultValue: 'photo',
        displaySegmentedControl: true,
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery',
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: 'Photo',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery' || props.mediaType !== 'photo',
    },
    video: {
        type: ControlType.File,
        title: 'Video',
        allowedFileTypes: ['mp4', 'webm', 'mov'],
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery' || props.mediaType !== 'video',
    },
    zoom: {
        type: ControlType.Number,
        title: 'Zoom',
        defaultValue: 100,
        min: 10,
        max: 250,
        step: 1,
        unit: '%',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery',
    },
    positionX: {
        type: ControlType.Number,
        title: 'Position X',
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: '%',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery' || Boolean(props.straightOn),
    },
    positionY: {
        type: ControlType.Number,
        title: 'Position Y',
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: '%',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery' || Boolean(props.straightOn),
    },
    tiltX: {
        type: ControlType.Number,
        title: 'Tilt Vertical',
        description: 'Keystone tilt, like a projector aimed up or down.',
        defaultValue: 18,
        min: -60,
        max: 60,
        step: 1,
        unit: '°',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery' || Boolean(props.straightOn),
    },
    tiltY: {
        type: ControlType.Number,
        title: 'Tilt Horizontal',
        description: 'Keystone tilt, like a projector aimed left or right.',
        defaultValue: 8,
        min: -60,
        max: 60,
        step: 1,
        unit: '°',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery' || Boolean(props.straightOn),
    },
    straightOn: {
        type: ControlType.Boolean,
        title: 'Straight On Wall',
        description:
            'Ignore position and tilt — project flat and centered on the wall.',
        defaultValue: false,
        enabledTitle: 'On',
        disabledTitle: 'Off',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery',
    },
    depth: {
        type: ControlType.Number,
        title: 'Depth',
        description: 'Perspective distance — lower is a more extreme, close-up distortion.',
        defaultValue: 900,
        min: 200,
        max: 3000,
        step: 10,
        unit: 'px',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout === 'gallery',
    },
    items: {
        type: ControlType.Array,
        title: 'Items',
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: 'Type',
                    options: ['photo', 'video'],
                    optionTitles: ['Photo', 'Video'],
                    defaultValue: 'photo',
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: 'Photo',
                },
                video: {
                    type: ControlType.File,
                    title: 'Video',
                    allowedFileTypes: ['mp4', 'webm', 'mov'],
                },
                title: {
                    type: ControlType.String,
                    title: 'Title',
                    defaultValue: '',
                    placeholder: 'Caption…',
                },
            },
        },
        defaultValue: [
            {
                mediaType: 'photo',
                image: {
                    src: 'https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg',
                    alt: 'Sample photo one',
                },
                title: 'Replace me',
            },
            {
                mediaType: 'photo',
                image: {
                    src: 'https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg',
                    alt: 'Sample photo two',
                },
                title: 'Replace me too',
            },
        ],
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery',
    },
    arrangement: {
        type: ControlType.Enum,
        title: 'Arrangement',
        description:
            'Grid wraps to fit by item size. Columns is a fixed column count. Stack centers items in one column.',
        options: ['grid', 'columns', 'stack'],
        optionTitles: ['Grid', 'Columns', 'Stack'],
        defaultValue: 'grid',
        displaySegmentedControl: true,
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery',
    },
    columns: {
        type: ControlType.Number,
        title: 'Columns',
        description: 'Number of fixed columns, e.g. 2 side by side or 3 in a row.',
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery' || props.arrangement !== 'columns',
    },
    itemSize: {
        type: ControlType.Number,
        title: 'Item Size',
        description: 'Minimum width of each tile — the grid wraps to fit.',
        defaultValue: 220,
        min: 80,
        max: 640,
        step: 10,
        unit: 'px',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery' || props.arrangement === 'columns',
    },
    gap: {
        type: ControlType.Number,
        title: 'Gap',
        description: 'Spacing between items in the grid.',
        defaultValue: 28,
        min: 0,
        max: 200,
        step: 2,
        unit: 'px',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery',
    },
    showTitles: {
        type: ControlType.Boolean,
        title: 'Show Titles',
        defaultValue: true,
        enabledTitle: 'On',
        disabledTitle: 'Off',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery',
    },
    captionColor: {
        type: ControlType.Color,
        title: 'Caption Color',
        defaultValue: '#EDEDED',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery' || !props.showTitles,
    },
    captionFont: {
        type: ControlType.Font,
        title: 'Caption Font',
        controls: 'extended',
        defaultFontType: 'sans-serif',
        defaultValue: {
            fontSize: 13,
            lineHeight: '1.4em',
        },
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery' || !props.showTitles,
    },
    galleryTiltX: {
        type: ControlType.Number,
        title: 'Grid Tilt Vertical',
        description:
            'Keystone tilt applied to the whole grid at once, like viewing a wall of projections from above or below.',
        defaultValue: 0,
        min: -60,
        max: 60,
        step: 1,
        unit: '°',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery',
    },
    galleryTiltY: {
        type: ControlType.Number,
        title: 'Grid Tilt Horizontal',
        description:
            'Keystone tilt applied to the whole grid at once, like viewing a wall of projections from the side.',
        defaultValue: 0,
        min: -60,
        max: 60,
        step: 1,
        unit: '°',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery',
    },
    galleryDepth: {
        type: ControlType.Number,
        title: 'Grid Depth',
        description: 'Perspective distance for the grid tilt — lower is a more extreme distortion.',
        defaultValue: 900,
        min: 200,
        max: 3000,
        step: 10,
        unit: 'px',
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            props.layout !== 'gallery' ||
            (props.galleryTiltX === 0 && props.galleryTiltY === 0),
    },
    age: {
        type: ControlType.Number,
        title: 'Projector Age',
        description: '0 = old and grainy, 100 = clean and modern.',
        defaultValue: 25,
        min: 0,
        max: 100,
        step: 1,
    },
    monochrome: {
        type: ControlType.Boolean,
        title: 'Monochrome',
        defaultValue: false,
        enabledTitle: 'On',
        disabledTitle: 'Off',
    },
    opacity: {
        type: ControlType.Number,
        title: 'Opacity',
        description: 'Fade the projection to blend it over text or other layers.',
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
    },
    edgeBlur: {
        type: ControlType.Number,
        title: 'Edge Blur',
        description:
            'Feathers the border so the projection fades into the wall instead of cutting off sharply.',
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
    },
    glitch: {
        type: ControlType.Boolean,
        title: 'Glitches',
        defaultValue: true,
        enabledTitle: 'On',
        disabledTitle: 'Off',
    },
    glitchIntensity: {
        type: ControlType.Number,
        title: 'Glitch Intensity',
        defaultValue: 25,
        min: 1,
        max: 100,
        step: 1,
        hidden: (props: Partial<OldProjectorProps>): boolean =>
            !props.glitch,
    },
    maxWidth: {
        type: ControlType.Number,
        title: 'Max Width',
        description:
            'Caps how wide the component can grow — useful if the frame stretches to fill a wide section on the published site. 0 = no cap.',
        defaultValue: 0,
        min: 0,
        max: 2400,
        step: 10,
        unit: 'px',
    },
    wallColor: {
        type: ControlType.Color,
        title: 'Wall Color',
        description:
            'Backdrop behind the projection. Handy when Zoom is small and the beam leaves visible space around it — transparent by default.',
        defaultValue: 'rgba(0,0,0,0)',
    },
})
