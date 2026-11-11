// Instructions: Create Image Motion Trail component. Use the provided CSS/JS behavior to create an image trail that follows the cursor with configurable delays, translation/rotation ranges, optional perspective, and optional opacity falloff.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
import { useInView } from "framer-motion"

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

type Range = { min: number; max: number }

interface Props {
    image: ResponsiveImageLike
    backgroundColor: string
    vignette: boolean
    vignetteStrength: number
    maxImageHeightVh: number
    imageWidth: number
    imageHeight: number
    totalTrailElements: number
    opacityChange: boolean

    perspectiveEnabled: boolean
    perspective: number

    rangeX: Range
    rangeY: Range
    rangeRZ: Range
    rangeRX: Range
    rangeRY: Range

    amtBase: number
    amtStep: number
    amtMain: number

    trackArea: "component" | "window"
    pauseWhenOffscreen: boolean
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MotionTrailImage(props: Props) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Image",
        },
        backgroundColor,
        vignette,
        vignetteStrength,
        maxImageHeightVh,
        imageWidth,
        imageHeight,
        totalTrailElements,
        opacityChange,
        perspectiveEnabled,
        perspective,
        rangeX,
        rangeY,
        rangeRZ,
        rangeRX,
        rangeRY,
        amtBase,
        amtStep,
        amtMain,
        trackArea,
        pauseWhenOffscreen,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const imgsRef = useRef<Array<HTMLImageElement | null>>([])
    const rafRef = useRef<number | null>(null)

    const [ready, setReady] = useState(false)

    const inView = useInView(containerRef, { margin: "200px 0px 200px 0px", amount: 0.05 })

    const ranges = useMemo(() => {
        const clampRange = (r: Range, fallback: Range) => {
            const min = Number.isFinite(r?.min) ? r.min : fallback.min
            const max = Number.isFinite(r?.max) ? r.max : fallback.max
            return min === max ? { min, max: max + 0.0001 } : { min, max }
        }
        return {
            x: clampRange(rangeX, { min: -200, max: 200 }),
            y: clampRange(rangeY, { min: -70, max: 70 }),
            rz: clampRange(rangeRZ, { min: -10, max: 10 }),
            rx: clampRange(rangeRX, { min: 0, max: 0 }),
            ry: clampRange(rangeRY, { min: 0, max: 0 }),
        }
    }, [rangeX, rangeY, rangeRZ, rangeRX, rangeRY])

    const options = useMemo(() => {
        const t = Math.max(1, Math.min(30, Math.round(totalTrailElements)))
        const base = Math.max(0, Math.min(1, amtBase))
        const step = Math.max(0, Math.min(1, amtStep))
        const main = Math.max(0, Math.min(1, amtMain))
        const persp = Math.max(0, perspective)

        return { t, base, step, main, persp }
    }, [totalTrailElements, amtBase, amtStep, amtMain, perspective])

    const opacityForIndex = useMemo(() => {
        const t = options.t
        if (!opacityChange) return (i: number) => 1
        // Similar to original: increasing opacity with index, topmost is 1
        return (i: number) => (i === t - 1 ? 1 : (1 / t) * i + 1 / t)
    }, [opacityChange, options.t])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const el = containerRef.current
        if (!el) return

        const shouldPause = pauseWhenOffscreen && !inView
        if (shouldPause) {
            if (rafRef.current != null) {
                window.cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            return
        }

        // Helpers
        const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b
        const map = (x: number, a: number, b: number, c: number, d: number) => {
            if (a === b) return (c + d) / 2
            return ((x - a) * (d - c)) / (b - a) + c
        }
        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

        // State kept in refs to avoid rerenders
        const cursor = { x: 0, y: 0 }
        const winsize = { width: 1, height: 1 }
        const bounds = { left: 0, top: 0, width: 1, height: 1 }

        const transforms: Array<{ x: number; y: number; rx: number; ry: number; rz: number }> = new Array(options.t)
            .fill(0)
            .map(() => ({ x: 0, y: 0, rx: 0, ry: 0, rz: 0 }))

        const updateBounds = () => {
            const rect = el.getBoundingClientRect()
            bounds.left = rect.left
            bounds.top = rect.top
            bounds.width = Math.max(1, rect.width)
            bounds.height = Math.max(1, rect.height)
        }

        const updateWinsize = () => {
            winsize.width = Math.max(1, window.innerWidth)
            winsize.height = Math.max(1, window.innerHeight)
        }

        const setInitialCursor = () => {
            if (trackArea === "window") {
                cursor.x = winsize.width / 2
                cursor.y = winsize.height / 2
            } else {
                cursor.x = bounds.left + bounds.width / 2
                cursor.y = bounds.top + bounds.height / 2
            }
        }

        updateBounds()
        updateWinsize()
        setInitialCursor()
        startTransition(() => setReady(true))

        const onResize = () => {
            updateBounds()
            updateWinsize()
        }

        const onScroll = () => {
            // bounds change on scroll
            updateBounds()
        }

        const onPointerMoveWindow = (ev: PointerEvent | MouseEvent) => {
            cursor.x = (ev as PointerEvent).clientX ?? 0
            cursor.y = (ev as PointerEvent).clientY ?? 0
        }

        const onPointerMoveEl = (ev: PointerEvent) => {
            cursor.x = ev.clientX
            cursor.y = ev.clientY
        }

        window.addEventListener("resize", onResize, { passive: true })
        window.addEventListener("scroll", onScroll, { passive: true })

        if (trackArea === "window") {
            window.addEventListener("pointermove", onPointerMoveWindow, { passive: true })
            window.addEventListener("mousemove", onPointerMoveWindow, { passive: true })
        } else {
            el.addEventListener("pointermove", onPointerMoveEl, { passive: true })
        }

        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => updateBounds()) : null
        ro?.observe(el)

        const loop = () => {
            // avoid work if unmounted
            const rectW = trackArea === "window" ? winsize.width : bounds.width
            const rectH = trackArea === "window" ? winsize.height : bounds.height

            const originX = trackArea === "window" ? 0 : bounds.left
            const originY = trackArea === "window" ? 0 : bounds.top

            const relX = clamp(cursor.x - originX, 0, rectW)
            const relY = clamp(cursor.y - originY, 0, rectH)

            for (let i = 0; i < options.t; i++) {
                const isTop = i === options.t - 1
                const amt = isTop ? options.main : clamp(options.base + options.step * i, 0, 1)

                const tx = map(relX, 0, rectW, ranges.x.min, ranges.x.max)
                const ty = map(relY, 0, rectH, ranges.y.min, ranges.y.max)

                transforms[i].x = lerp(transforms[i].x, tx, amt)
                transforms[i].y = lerp(transforms[i].y, ty, amt)

                const trz = map(relX, 0, rectW, ranges.rz.min, ranges.rz.max)
                transforms[i].rz = lerp(transforms[i].rz, trz, amt)

                if (perspectiveEnabled && options.persp > 0) {
                    const trx = map(relY, 0, rectH, ranges.rx.min, ranges.rx.max)
                    const tryy = map(relX, 0, rectW, ranges.ry.min, ranges.ry.max)
                    transforms[i].rx = lerp(transforms[i].rx, trx, amt)
                    transforms[i].ry = lerp(transforms[i].ry, tryy, amt)
                } else {
                    transforms[i].rx = 0
                    transforms[i].ry = 0
                }

                const node = imgsRef.current[i]
                if (node) {
                    node.style.transform = `translateX(${transforms[i].x}px) translateY(${transforms[i].y}px) rotateX(${transforms[i].rx}deg) rotateY(${transforms[i].ry}deg) rotateZ(${transforms[i].rz}deg)`
                }
            }

            rafRef.current = window.requestAnimationFrame(loop)
        }

        rafRef.current = window.requestAnimationFrame(loop)

        return () => {
            if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null

            window.removeEventListener("resize", onResize)
            window.removeEventListener("scroll", onScroll)

            if (trackArea === "window") {
                window.removeEventListener("pointermove", onPointerMoveWindow)
                window.removeEventListener("mousemove", onPointerMoveWindow)
            } else {
                el.removeEventListener("pointermove", onPointerMoveEl as any)
            }

            ro?.disconnect()
        }
    }, [
        isStatic,
        inView,
        pauseWhenOffscreen,
        perspectiveEnabled,
        options.t,
        options.base,
        options.step,
        options.main,
        options.persp,
        ranges,
        trackArea,
    ])

    const wrapperPerspective = perspectiveEnabled ? `${Math.max(0, options.persp)}px` : undefined

    const imgCount = useMemo(() => {
        return Math.max(1, Math.min(30, Math.round(totalTrailElements)))
    }, [totalTrailElements])

    imgsRef.current = imgsRef.current.slice(0, imgCount)

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                background: backgroundColor,
                userSelect: "none",
                touchAction: "none",
                display: "grid",
                placeItems: "center",
                ...(wrapperPerspective ? { perspective: wrapperPerspective } : {}),
            }}
            aria-label="Image motion trail"
            role="img"
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: trackArea === "component" ? "auto" : "none",
                }}
            >
                {new Array(imgCount).fill(0).map((_, i) => {
                    const opacity = opacityForIndex(i)
                    return (
                        <img
                            key={i}
                            ref={(node) => {
                                imgsRef.current[i] = node
                            }}
                            src={image?.src}
                            srcSet={image?.srcSet}
                            alt={i === imgCount - 1 ? image?.alt ?? "Image" : ""}
                            style={{
                                gridArea: "1 / 1 / 2 / 2",
                                maxHeight: `${Math.max(10, maxImageHeightVh)}vh`,
                                width: imageWidth > 0 ? `${imageWidth}px` : "auto",
                                height: imageHeight > 0 ? `${imageHeight}px` : "auto",
                                willChange: "transform",
                                position: "relative",
                                opacity,
                                pointerEvents: "none",
                                transform: ready ? undefined : "translateX(0px) translateY(0px) rotateZ(0deg)",
                                filter: i === imgCount - 1 ? "none" : "blur(0px)",
                            }}
                            draggable={false}
                        />
                    )
                })}
            </div>

            {vignette && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,${Math.max(
                            0,
                            Math.min(1, vignetteStrength),
                        )}) 70%, rgba(0,0,0,${Math.max(0, Math.min(1, vignetteStrength))}) 100%)`,
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(MotionTrailImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    vignette: {
        type: ControlType.Boolean,
        title: "Vignette",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    vignetteStrength: {
        type: ControlType.Number,
        title: "Vignette Str",
        description: "Darkness of the edge vignette overlay.",
        defaultValue: 0.75,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.vignette,
    },
    maxImageHeightVh: {
        type: ControlType.Number,
        title: "Max H",
        defaultValue: 50,
        min: 10,
        max: 100,
        step: 1,
        unit: "vh",
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Img W",
        description: "Image width in pixels (0 = auto).",
        defaultValue: 0,
        min: 0,
        max: 2000,
        step: 1,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Img H",
        description: "Image height in pixels (0 = auto).",
        defaultValue: 0,
        min: 0,
        max: 2000,
        step: 1,
        unit: "px",
    },
    trackArea: {
        type: ControlType.Enum,
        title: "Track",
        description: "Choose whether the trail follows the window cursor or only when hovering the component.",
        options: ["component", "window"],
        optionTitles: ["Component", "Window"],
        defaultValue: "window",
        displaySegmentedControl: true,
    },
    pauseWhenOffscreen: {
        type: ControlType.Boolean,
        title: "Pause Off",
        description: "Stops animation when the component is not visible to improve performance.",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    totalTrailElements: {
        type: ControlType.Number,
        title: "Trails",
        description: "Number of stacked images used for the trail.",
        defaultValue: 20,
        min: 1,
        max: 30,
        step: 1,
    },
    opacityChange: {
        type: ControlType.Boolean,
        title: "Opacity",
        description: "Fade older trail images so the top image is most visible.",
        defaultValue: true,
        enabledTitle: "Fade",
        disabledTitle: "Flat",
    },
    perspectiveEnabled: {
        type: ControlType.Boolean,
        title: "3D",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        description: "3D perspective distance (smaller = stronger 3D effect).",
        defaultValue: 800,
        min: 0,
        max: 4000,
        step: 10,
        unit: "px",
        hidden: (p) => !p.perspectiveEnabled,
    },
    rangeX: {
        type: ControlType.Object,
        title: "Range X",
        description: "Horizontal translation range mapped from cursor position.",
        icon: "effect",
        controls: {
            min: { type: ControlType.Number, title: "Min", defaultValue: -200, min: -1000, max: 0, step: 1 },
            max: { type: ControlType.Number, title: "Max", defaultValue: 200, min: 0, max: 1000, step: 1 },
        },
        defaultValue: { min: -200, max: 200 },
    },
    rangeY: {
        type: ControlType.Object,
        title: "Range Y",
        description: "Vertical translation range mapped from cursor position.",
        icon: "effect",
        controls: {
            min: { type: ControlType.Number, title: "Min", defaultValue: -70, min: -1000, max: 0, step: 1 },
            max: { type: ControlType.Number, title: "Max", defaultValue: 70, min: 0, max: 1000, step: 1 },
        },
        defaultValue: { min: -70, max: 70 },
    },
    rangeRZ: {
        type: ControlType.Object,
        title: "Rotate Z",
        description: "Rotation around Z axis mapped from cursor X.",
        icon: "effect",
        controls: {
            min: { type: ControlType.Number, title: "Min", defaultValue: -10, min: -180, max: 0, step: 1, unit: "deg" },
            max: { type: ControlType.Number, title: "Max", defaultValue: 10, min: 0, max: 180, step: 1, unit: "deg" },
        },
        defaultValue: { min: -10, max: 10 },
    },
    rangeRX: {
        type: ControlType.Object,
        title: "Rotate X",
        description: "Rotation around X axis (requires 3D).",
        icon: "effect",
        controls: {
            min: { type: ControlType.Number, title: "Min", defaultValue: 0, min: -180, max: 0, step: 1, unit: "deg" },
            max: { type: ControlType.Number, title: "Max", defaultValue: 0, min: 0, max: 180, step: 1, unit: "deg" },
        },
        defaultValue: { min: 0, max: 0 },
        hidden: (p) => !p.perspectiveEnabled,
    },
    rangeRY: {
        type: ControlType.Object,
        title: "Rotate Y",
        description: "Rotation around Y axis (requires 3D).",
        icon: "effect",
        controls: {
            min: { type: ControlType.Number, title: "Min", defaultValue: 0, min: -180, max: 0, step: 1, unit: "deg" },
            max: { type: ControlType.Number, title: "Max", defaultValue: 0, min: 0, max: 180, step: 1, unit: "deg" },
        },
        defaultValue: { min: 0, max: 0 },
        hidden: (p) => !p.perspectiveEnabled,
    },
    amtBase: {
        type: ControlType.Number,
        title: "Amt Base",
        description: "Base smoothing amount for the first trail images (lower = more lag).",
        defaultValue: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
    },
    amtStep: {
        type: ControlType.Number,
        title: "Amt Step",
        description: "How much smoothing increases per trail index.",
        defaultValue: 0.02,
        min: 0,
        max: 1,
        step: 0.01,
    },
    amtMain: {
        type: ControlType.Number,
        title: "Amt Main",
        description: "Smoothing amount for the top (front) image.",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
    },
})