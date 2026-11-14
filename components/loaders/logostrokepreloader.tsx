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


// Request: add trigger controls (Page Load/In View/Click/Hover) with replay/threshold/reset/interaction label while preserving legacy API behavior and visual design.

type SourceMode = "upload" | "path" | "image"
type ImageAnimationMode = "wipeRight" | "wipeLeft" | "wipeUp" | "wipeDown" | "fade"
type EasingMode = "linear" | "easeIn" | "easeOut" | "easeInOut"
type LoopMode = "reverse" | "restart"
type LineCapMode = "round" | "butt" | "square"
type TriggerMode = "Page Load" | "In View" | "Click" | "Hover"

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface MyComponentProps {
    source?: SourceMode | "SVG File" | "Path Data" | "Image"
    svgFile?: string
    image?: string | ResponsiveImageValue
    reveal?: ImageAnimationMode | "Wipe →" | "Wipe ←" | "Wipe ↑" | "Wipe ↓" | "Fade"
    imageAnimation?: ImageAnimationMode
    imageAlt?: string
    sVGPaths?: string
    pathData?: string
    viewBoxW?: number
    viewBoxH?: number
    viewBoxWidth?: number
    viewBoxHeight?: number
    sVGColors?: boolean
    useOriginalColors?: boolean
    stroke?: string
    strokeWidth?: number
    lineCap?: LineCapMode | "Round" | "Butt" | "Square"
    playing?: boolean
    speed?: number
    duration?: number
    stagger?: number
    startDelay?: number
    delay?: number
    easing?: EasingMode | "Linear" | "Ease In" | "Ease Out" | "Ease In-Out"
    loop?: boolean
    loopType?: LoopMode | "Reverse" | "Restart"
    loopPause?: number
    pauseBetween?: number
    fillAfterDraw?: boolean
    fillAfter?: boolean
    fillColor?: string
    fillSource?: boolean | "SVG" | "Custom"
    useOriginalFill?: boolean
    background?: boolean
    showBackground?: boolean
    bGColor?: string
    backgroundColor?: string
    logoSize?: number
    logoScale?: number
    canvasPreview?: boolean
    previewOnCanvas?: boolean
    trigger?: TriggerMode
    viewThreshold?: number
    replay?: boolean
    resetOnLeave?: boolean
    interactionLabel?: string
    style?: React.CSSProperties
}

const defaultImageFallback: ResponsiveImageValue = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Gradient 1 - Blue",
}

const SAFE_SVG_TAGS = new Set([
    "svg",
    "g",
    "path",
    "line",
    "polyline",
    "polygon",
    "circle",
    "rect",
    "ellipse",
])

const SAFE_ATTRS = new Set([
    "d",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "width",
    "height",
    "points",
    "viewBox",
    "fill",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-opacity",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-dasharray",
    "stroke-dashoffset",
    "opacity",
    "transform",
    "preserveAspectRatio",
    "xmlns",
])

const ALLOWED_PRESENTATION_VALUES = /^(none|currentColor|#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)$/
const PATH_SAFE_CHARS = /^[MmZzLlHhVvCcSsQqTtAa0-9,\.\-\+\sEe]+$/
const NUMBER_OR_LIST_SAFE = /^[0-9eE,\.\-\+\s%]+$/

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
    const n = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
}

function resolveImageSource(image?: string | ResponsiveImageValue): ResponsiveImageValue {
    if (typeof image === "string") return { src: image, alt: "" }
    return image ?? defaultImageFallback
}

function hasOwnProp<T extends object>(obj: T, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key)
}

function normalizeSource(value: MyComponentProps["source"]): SourceMode {
    if (value === "Image" || value === "image") return "image"
    if (value === "Path Data" || value === "path") return "path"
    return "upload"
}

function normalizeReveal(value: MyComponentProps["reveal"] | MyComponentProps["imageAnimation"]): ImageAnimationMode {
    if (value === "Wipe ←" || value === "wipeLeft") return "wipeLeft"
    if (value === "Wipe ↑" || value === "wipeUp") return "wipeUp"
    if (value === "Wipe ↓" || value === "wipeDown") return "wipeDown"
    if (value === "Fade" || value === "fade") return "fade"
    return "wipeRight"
}

function normalizeLineCap(value: MyComponentProps["lineCap"]): LineCapMode {
    if (value === "Butt" || value === "butt") return "butt"
    if (value === "Square" || value === "square") return "square"
    return "round"
}

function normalizeEasing(value: MyComponentProps["easing"]): EasingMode {
    if (value === "Linear" || value === "linear") return "linear"
    if (value === "Ease In" || value === "easeIn") return "easeIn"
    if (value === "Ease Out" || value === "easeOut") return "easeOut"
    return "easeInOut"
}

function normalizeLoopType(value: MyComponentProps["loopType"]): LoopMode {
    if (value === "Restart" || value === "restart") return "restart"
    return "reverse"
}

function normalizeFillSource(value: MyComponentProps["fillSource"] | MyComponentProps["useOriginalFill"]): boolean {
    if (value === "SVG") return true
    if (value === "Custom") return false
    return Boolean(value)
}

function normalizeTrigger(value: MyComponentProps["trigger"]): TriggerMode {
    if (value === "In View") return "In View"
    if (value === "Click") return "Click"
    if (value === "Hover") return "Hover"
    return "Page Load"
}

function isSafeUrlValue(value: string): boolean {
    const lower = value.trim().toLowerCase()
    if (lower.includes("javascript:")) return false
    if (lower.includes("data:text/html")) return false
    if (lower.includes("url(")) return false
    if (lower.startsWith("http:") || lower.startsWith("https:")) return false
    return true
}

function sanitizeAttr(name: string, value: string): string | null {
    if (!SAFE_ATTRS.has(name)) return null
    if (name.startsWith("on")) return null
    if (!isSafeUrlValue(value)) return null
    if (
        name === "fill" ||
        name === "stroke" ||
        name === "stroke-linecap" ||
        name === "stroke-linejoin"
    ) {
        return ALLOWED_PRESENTATION_VALUES.test(value.trim()) ? value.trim() : null
    }
    if (name === "d") return PATH_SAFE_CHARS.test(value.trim()) ? value.trim() : null
    if (name === "points") return NUMBER_OR_LIST_SAFE.test(value.trim()) ? value.trim() : null
    return value.trim()
}

function serializeSafeNode(doc: XMLDocument, sourceNode: Element): Element | null {
    const tag = sourceNode.tagName
    if (!SAFE_SVG_TAGS.has(tag)) return null
    const outNode = doc.createElementNS("http://www.w3.org/2000/svg", tag)

    Array.from(sourceNode.attributes).forEach((attr) => {
        const safeValue = sanitizeAttr(attr.name, attr.value)
        if (safeValue !== null) outNode.setAttribute(attr.name, safeValue)
    })

    Array.from(sourceNode.children).forEach((child) => {
        const safeChild = serializeSafeNode(doc, child)
        if (safeChild) outNode.appendChild(safeChild)
    })
    return outNode
}

function sanitizeSvgMarkup(rawSvg: string): string | null {
    if (typeof window === "undefined" || typeof DOMParser === "undefined") return null
    try {
        const parser = new DOMParser()
        const parsed = parser.parseFromString(rawSvg, "image/svg+xml")
        const root = parsed.documentElement
        if (!root || root.tagName !== "svg") return null
        const doc = document.implementation.createDocument("http://www.w3.org/2000/svg", "svg", null)
        const safeRoot = serializeSafeNode(doc, root)
        if (!safeRoot || safeRoot.tagName !== "svg") return null
        if (!safeRoot.getAttribute("xmlns")) {
            safeRoot.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        }
        doc.replaceChild(safeRoot, doc.documentElement)
        return new XMLSerializer().serializeToString(doc)
    } catch {
        return null
    }
}

function sanitizePathDataInput(raw: string): string[] {
    return raw
        .split(/\n|\|/)
        .map((p) => p.trim())
        .filter(Boolean)
        .filter((d) => PATH_SAFE_CHARS.test(d))
}

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LogoStrokePreloader(props: MyComponentProps) {
    const source = normalizeSource(props.source)
    const svgFile = props.svgFile ?? ""
    const image = props.image ?? defaultImageFallback
    const imageAnimation = hasOwnProp(props, "reveal")
        ? normalizeReveal(props.reveal)
        : normalizeReveal(props.imageAnimation)
    const imageAlt = props.imageAlt ?? "Logo"
    const pathData = hasOwnProp(props, "sVGPaths")
        ? props.sVGPaths ?? ""
        : (props.pathData ?? "M60 20 L20 100 L45 100 L45 160 L115 160 L115 100 L140 100 Z")
    const viewBoxWidth = hasOwnProp(props, "viewBoxW")
        ? props.viewBoxW ?? 160
        : (props.viewBoxWidth ?? 160)
    const viewBoxHeight = hasOwnProp(props, "viewBoxH")
        ? props.viewBoxH ?? 180
        : (props.viewBoxHeight ?? 180)
    const useOriginalColors = hasOwnProp(props, "sVGColors")
        ? Boolean(props.sVGColors)
        : Boolean(props.useOriginalColors ?? false)
    const stroke = props.stroke ?? "#FFFFFF"
    const strokeWidth = props.strokeWidth ?? 3
    const lineCap = normalizeLineCap(props.lineCap)
    const playing = props.playing ?? true
    const speed = props.speed ?? 1
    const duration = props.duration ?? 2
    const stagger = props.stagger ?? 0.3
    const delay = hasOwnProp(props, "startDelay")
        ? props.startDelay ?? 0
        : (props.delay ?? 0)
    const easing = normalizeEasing(props.easing)
    const loop = props.loop ?? true
    const loopType = normalizeLoopType(props.loopType)
    const pauseBetween = hasOwnProp(props, "loopPause")
        ? props.loopPause ?? 0.4
        : (props.pauseBetween ?? 0.4)
    const fillAfter = hasOwnProp(props, "fillAfterDraw")
        ? Boolean(props.fillAfterDraw)
        : Boolean(props.fillAfter ?? false)
    const fillColor = props.fillColor ?? "#FFFFFF"
    const useOriginalFill = hasOwnProp(props, "fillSource")
        ? normalizeFillSource(props.fillSource)
        : normalizeFillSource(props.useOriginalFill)
    const showBackground = hasOwnProp(props, "background")
        ? Boolean(props.background)
        : Boolean(props.showBackground ?? true)
    const backgroundColor = hasOwnProp(props, "bGColor")
        ? props.bGColor ?? "#0A0A0A"
        : (props.backgroundColor ?? "#0A0A0A")
    const logoScale = hasOwnProp(props, "logoSize")
        ? props.logoSize ?? 40
        : (props.logoScale ?? 40)
    const previewOnCanvas = hasOwnProp(props, "canvasPreview")
        ? Boolean(props.canvasPreview)
        : Boolean(props.previewOnCanvas ?? true)
    const trigger = normalizeTrigger(props.trigger)
    const viewThreshold = props.viewThreshold ?? 25
    const replay = props.replay ?? false
    const resetOnLeave = props.resetOnLeave ?? false
    const interactionLabel = props.interactionLabel ?? "Start logo animation"
    const style = props.style

    const safeDuration = clampNumber(duration, 0.05, 30, 2)
    const safeStagger = clampNumber(stagger, 0, 5, 0.3)
    const safeDelay = clampNumber(delay, 0, 20, 0)
    const safePause = clampNumber(pauseBetween, 0, 20, 0.4)
    const safeSpeed = clampNumber(speed, 0.05, 10, 1)
    const safeStrokeWidth = clampNumber(strokeWidth, 0.1, 200, 3)
    const safeScale = clampNumber(logoScale, 1, 100, 40)
    const safeViewBoxWidth = clampNumber(viewBoxWidth, 1, 4000, 160)
    const safeViewBoxHeight = clampNumber(viewBoxHeight, 1, 4000, 180)
    const safeViewThreshold = clampNumber(viewThreshold, 0, 100, 25) / 100

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const shouldAnimate = !isStatic && (!isCanvas || previewOnCanvas)

    const wrapperRef = React.useRef<HTMLDivElement | null>(null)
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const imgRef = React.useRef<HTMLImageElement | null>(null)
    const animationsRef = React.useRef<Animation[]>([])
    const hasTriggeredRef = React.useRef(false)
    const [svgMarkup, setSvgMarkup] = React.useState<string | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [triggerActive, setTriggerActive] = React.useState(
        trigger === "Page Load"
    )
    const [runVersion, setRunVersion] = React.useState(0)

    const easeMap: Record<EasingMode, string> = {
        linear: "linear",
        easeIn: "ease-in",
        easeOut: "ease-out",
        easeInOut: "ease-in-out",
    }

    const stopAllAnimations = React.useCallback(() => {
        animationsRef.current.forEach((a) => a.cancel())
        animationsRef.current = []
    }, [])

    const requestTriggerStart = React.useCallback(() => {
        if (!shouldAnimate || isStatic) return
        if (!replay && hasTriggeredRef.current) return
        hasTriggeredRef.current = true
        React.startTransition(() => {
            setTriggerActive(true)
            setRunVersion((v) => v + 1)
        })
    }, [isStatic, replay, shouldAnimate])

    const resetToInitial = React.useCallback(() => {
        React.startTransition(() => {
            setTriggerActive(false)
        })
    }, [])

    React.useEffect(() => {
        hasTriggeredRef.current = trigger === "Page Load"
        React.startTransition(() => {
            setRunVersion(0)
            setTriggerActive(trigger === "Page Load")
        })
    }, [trigger])

    React.useEffect(() => {
        if (!shouldAnimate || isStatic) return
        if (trigger === "Page Load") {
            requestTriggerStart()
            return
        }
        if (trigger !== "In View") return
        const target = wrapperRef.current
        if (!target) return
        if (
            typeof window === "undefined" ||
            typeof IntersectionObserver === "undefined"
        ) {
            requestTriggerStart()
            return
        }
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                if (entry.isIntersecting) {
                    requestTriggerStart()
                } else if (replay) {
                    hasTriggeredRef.current = false
                }
            },
            { threshold: safeViewThreshold }
        )
        observer.observe(target)
        return () => observer.disconnect()
    }, [
        isStatic,
        replay,
        requestTriggerStart,
        safeViewThreshold,
        shouldAnimate,
        trigger,
    ])

    React.useEffect(() => {
        if (source !== "upload" || !svgFile) {
            React.startTransition(() => {
                setSvgMarkup(null)
                setError(null)
                setLoading(false)
            })
            return
        }
        const controller = new AbortController()
        React.startTransition(() => {
            setLoading(true)
            setError(null)
        })

        fetch(svgFile, { signal: controller.signal })
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP_${r.status}`)
                return r.text()
            })
            .then((text) => {
                const clean = sanitizeSvgMarkup(text)
                React.startTransition(() => {
                    if (!clean) {
                        setError("Uploaded file is not a safe valid SVG.")
                        setSvgMarkup(null)
                    } else {
                        setSvgMarkup(clean)
                    }
                })
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return
                const msg =
                    err instanceof Error && err.message.startsWith("HTTP_")
                        ? "Could not load SVG file (server error)."
                        : "Could not load SVG file."
                React.startTransition(() => {
                    setError(msg)
                    setSvgMarkup(null)
                })
            })
            .finally(() => {
                if (controller.signal.aborted) return
                React.startTransition(() => setLoading(false))
            })

        return () => {
            controller.abort()
        }
    }, [source, svgFile])

    const pathModeMarkup = React.useMemo(() => {
        if (source !== "path") return null
        const safePaths = sanitizePathDataInput(pathData || "")
        const paths = safePaths.map((d) => `<path d="${d}" />`).join("")
        return `<svg viewBox="0 0 ${safeViewBoxWidth} ${safeViewBoxHeight}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`
    }, [source, pathData, safeViewBoxWidth, safeViewBoxHeight])

    useIsomorphicLayoutEffect(() => {
        if (source === "image") return
        const container = containerRef.current
        if (!container) return

        const svg = container.querySelector("svg") as SVGSVGElement | null
        if (!svg) return

        svg.removeAttribute("width")
        svg.removeAttribute("height")
        svg.style.width = "100%"
        svg.style.height = "100%"
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
        svg.style.overflow = "visible"

        stopAllAnimations()

        const els = Array.from(
            svg.querySelectorAll(
                "path, line, polyline, polygon, circle, rect, ellipse"
            )
        ) as SVGGeometryElement[]
        if (els.length === 0) return

        const drawDur = safeDuration * 1000
        const staggerMs = safeStagger * 1000
        const pauseMs = safePause * 1000
        const totalStagger = staggerMs * Math.max(els.length - 1, 0)
        const cycle = Math.max(1, drawDur + totalStagger + pauseMs)
        const fillDur = 600
        els.forEach((el, i) => {
            let len = 0
            try {
                len = el.getTotalLength ? el.getTotalLength() : 0
            } catch (e) {
                len = 0
            }
            if (!len) return

            const originalFill = el.getAttribute("fill")
            const hasFill =
                originalFill !== "none" &&
                (originalFill || el.tagName !== "line")

            if (!useOriginalColors || !el.getAttribute("stroke")) {
                el.setAttribute("stroke", stroke)
            }
            el.setAttribute("stroke-width", String(safeStrokeWidth))
            el.setAttribute("stroke-linecap", lineCap)
            el.setAttribute("stroke-linejoin", "round")
            el.style.strokeDasharray = `${len}`

            if (fillAfter && hasFill) {
                if (!useOriginalFill) el.setAttribute("fill", fillColor)
                else if (!originalFill) el.setAttribute("fill", stroke)
                el.style.fillOpacity = "0"
            } else {
                el.setAttribute("fill", "none")
            }

            if (!shouldAnimate || isStatic) {
                el.style.strokeDashoffset = "0"
                if (fillAfter && hasFill) el.style.fillOpacity = "1"
                return
            }

            if (!triggerActive) {
                el.style.strokeDashoffset = `${len}`
                if (fillAfter && hasFill) el.style.fillOpacity = "0"
                return
            }

            if (typeof el.animate !== "function") {
                el.style.strokeDashoffset = "0"
                if (fillAfter && hasFill) el.style.fillOpacity = "1"
                return
            }

            el.style.strokeDashoffset = `${len}`

            const startOffset = i * staggerMs
            const drawStart = startOffset / cycle
            const drawEnd = (startOffset + drawDur) / cycle

            const drawAnim = el.animate(
                [
                    { strokeDashoffset: len, offset: 0 },
                    {
                        strokeDashoffset: len,
                        offset: Math.min(drawStart, 0.999),
                        easing: easeMap[easing] || "ease-in-out",
                    },
                    {
                        strokeDashoffset: 0,
                        offset: Math.min(drawEnd, 0.9999),
                    },
                    { strokeDashoffset: 0, offset: 1 },
                ],
                {
                    duration: cycle,
                    delay: safeDelay * 1000,
                    iterations: loop ? Infinity : 1,
                    direction:
                        loop && loopType === "reverse"
                            ? "alternate"
                            : "normal",
                    fill: "forwards",
                }
            )
            drawAnim.playbackRate = safeSpeed
            if (!playing) drawAnim.pause()
            animationsRef.current.push(drawAnim)

            if (fillAfter && hasFill) {
                const fillStart = Math.min(
                    (drawDur + totalStagger) / cycle,
                    0.999
                )
                const fillEnd = Math.min(
                    (drawDur + totalStagger + fillDur) / cycle,
                    0.9999
                )
                const fillAnim = el.animate(
                    [
                        { fillOpacity: 0, offset: 0 },
                        { fillOpacity: 0, offset: fillStart },
                        { fillOpacity: 1, offset: fillEnd },
                        { fillOpacity: 1, offset: 1 },
                    ],
                    {
                        duration: cycle,
                        delay: safeDelay * 1000,
                        iterations: loop ? Infinity : 1,
                        direction:
                            loop && loopType === "reverse"
                                ? "alternate"
                                : "normal",
                        fill: "forwards",
                    }
                )
                fillAnim.playbackRate = safeSpeed
                if (!playing) fillAnim.pause()
                animationsRef.current.push(fillAnim)
            }
        })

        return () => {
            stopAllAnimations()
        }
    }, [
        svgMarkup,
        pathModeMarkup,
        source,
        stroke,
        strokeWidth,
        lineCap,
        duration,
        stagger,
        delay,
        easing,
        loop,
        loopType,
        pauseBetween,
        fillAfter,
        fillColor,
        useOriginalFill,
        useOriginalColors,
        shouldAnimate,
        triggerActive,
        playing,
        safeDuration,
        safeStagger,
        safePause,
        safeDelay,
        safeSpeed,
        safeStrokeWidth,
        stopAllAnimations,
        isStatic,
        runVersion,
    ])

    React.useEffect(() => {
        animationsRef.current.forEach((a) => {
            a.playbackRate = safeSpeed
            if (playing) a.play()
            else a.pause()
        })
    }, [playing, safeSpeed])

    useIsomorphicLayoutEffect(() => {
        if (source !== "image") return
        const el = imgRef.current
        if (!el) return
        stopAllAnimations()

        if (!shouldAnimate || isStatic) {
            el.style.clipPath = "inset(0 0 0 0)"
            el.style.opacity = "1"
            return
        }

        const clips: Record<Exclude<ImageAnimationMode, "fade">, [string, string]> = {
            wipeRight: ["inset(0 100% 0 0)", "inset(0 0 0 0)"],
            wipeLeft: ["inset(0 0 0 100%)", "inset(0 0 0 0)"],
            wipeUp: ["inset(100% 0 0 0)", "inset(0 0 0 0)"],
            wipeDown: ["inset(0 0 100% 0)", "inset(0 0 0 0)"],
        }
        const cycle = Math.max(1, (safeDuration + safePause) * 1000)
        const drawEnd = Math.min((safeDuration * 1000) / cycle, 0.9999)

        let keyframes: Keyframe[]
        if (imageAnimation === "fade") {
            keyframes = [
                { opacity: 0, offset: 0 },
                {
                    opacity: 1,
                    offset: drawEnd,
                    easing: easeMap[easing] || "ease-in-out",
                },
                { opacity: 1, offset: 1 },
            ]
        } else {
            const [from, to] =
                imageAnimation === "wipeLeft"
                    ? clips.wipeLeft
                    : imageAnimation === "wipeUp"
                      ? clips.wipeUp
                      : imageAnimation === "wipeDown"
                        ? clips.wipeDown
                        : clips.wipeRight
            keyframes = [
                { clipPath: from, offset: 0 },
                {
                    clipPath: to,
                    offset: drawEnd,
                    easing: easeMap[easing] || "ease-in-out",
                },
                { clipPath: to, offset: 1 },
            ]
        }

        if (!triggerActive) {
            if (imageAnimation === "fade") {
                el.style.opacity = "0"
                el.style.clipPath = "inset(0 0 0 0)"
            } else if (imageAnimation === "wipeLeft") {
                el.style.clipPath = "inset(0 0 0 100%)"
                el.style.opacity = "1"
            } else if (imageAnimation === "wipeUp") {
                el.style.clipPath = "inset(100% 0 0 0)"
                el.style.opacity = "1"
            } else if (imageAnimation === "wipeDown") {
                el.style.clipPath = "inset(0 0 100% 0)"
                el.style.opacity = "1"
            } else {
                el.style.clipPath = "inset(0 100% 0 0)"
                el.style.opacity = "1"
            }
            return
        }

        if (typeof el.animate !== "function") {
            el.style.clipPath = "inset(0 0 0 0)"
            el.style.opacity = "1"
            return
        }

        const anim = el.animate(keyframes, {
            duration: cycle,
            delay: safeDelay * 1000,
            iterations: loop ? Infinity : 1,
            direction:
                loop && loopType === "reverse" ? "alternate" : "normal",
            fill: "forwards",
        })
        anim.playbackRate = safeSpeed
        if (!playing) anim.pause()
        animationsRef.current.push(anim)

        return () => {
            stopAllAnimations()
        }
    }, [
        source,
        image,
        imageAnimation,
        duration,
        delay,
        easing,
        loop,
        loopType,
        pauseBetween,
        shouldAnimate,
        triggerActive,
        playing,
        safeDuration,
        safePause,
        safeDelay,
        safeSpeed,
        stopAllAnimations,
        isStatic,
        runVersion,
    ])
    const handleClick = React.useCallback(() => {
        if (trigger !== "Click") return
        requestTriggerStart()
    }, [requestTriggerStart, trigger])

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (trigger !== "Click") return
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                requestTriggerStart()
            }
        },
        [requestTriggerStart, trigger]
    )

    const handlePointerEnter = React.useCallback(() => {
        if (trigger !== "Hover") return
        requestTriggerStart()
    }, [requestTriggerStart, trigger])

    const handlePointerLeave = React.useCallback(() => {
        if (trigger !== "Hover" || !resetOnLeave) return
        stopAllAnimations()
        resetToInitial()
    }, [resetOnLeave, resetToInitial, stopAllAnimations, trigger])


    React.useEffect(() => {
        return () => stopAllAnimations()
    }, [stopAllAnimations])

    const resolvedImage = resolveImageSource(image)
    const imageSrc = resolvedImage.src || defaultImageFallback.src || ""
    const decorative = imageAlt.trim().length === 0

    const wrapperStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: showBackground ? backgroundColor : "transparent",
        overflow: "hidden",
        ...style,
    }

    const innerStyle: React.CSSProperties = {
        width: `${safeScale}%`,
        height: `${safeScale}%`,
        maxWidth: "100%",
        maxHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    if (source === "image") {
        return (
            <div
                ref={wrapperRef}
                style={wrapperStyle}
                role={trigger === "Click" ? "button" : undefined}
                tabIndex={trigger === "Click" ? 0 : undefined}
                aria-label={trigger === "Click" ? interactionLabel : undefined}
                onClick={trigger === "Click" ? handleClick : undefined}
                onKeyDown={trigger === "Click" ? handleKeyDown : undefined}
                onPointerEnter={trigger === "Hover" ? handlePointerEnter : undefined}
                onPointerLeave={trigger === "Hover" ? handlePointerLeave : undefined}
            >
                {imageSrc ? (
                    <img
                        ref={imgRef}
                        src={imageSrc}
                        srcSet={resolvedImage.srcSet}
                        alt={decorative ? "" : imageAlt}
                        aria-hidden={decorative}
                        style={{
                            ...innerStyle,
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                ) : (
                    <Placeholder
                        text="Add an image in the properties panel →"
                        role="status"
                    />
                )}
            </div>
        )
    }

    const markup = source === "upload" ? svgMarkup : pathModeMarkup

    return (
        <div
            ref={wrapperRef}
            style={wrapperStyle}
            role={trigger === "Click" ? "button" : undefined}
            tabIndex={trigger === "Click" ? 0 : undefined}
            aria-label={trigger === "Click" ? interactionLabel : undefined}
            onClick={trigger === "Click" ? handleClick : undefined}
            onKeyDown={trigger === "Click" ? handleKeyDown : undefined}
            onPointerEnter={trigger === "Hover" ? handlePointerEnter : undefined}
            onPointerLeave={trigger === "Hover" ? handlePointerLeave : undefined}
        >
            {loading ? (
                <Placeholder text="Loading SVG…" role="status" />
            ) : error ? (
                <Placeholder text={error} role="alert" />
            ) : markup ? (
                <div
                    ref={containerRef}
                    style={innerStyle}
                    dangerouslySetInnerHTML={{ __html: markup }}
                />
            ) : (
                <Placeholder
                    text={
                        source === "upload"
                            ? "Upload an SVG file in the properties panel →"
                            : "Paste SVG path data in the properties panel →"
                    }
                    role="status"
                />
            )}
        </div>
    )
}

function Placeholder({ text, role }: { text: string; role: "status" | "alert" }) {
    return (
        <div
            role={role}
            aria-live={role === "alert" ? "assertive" : "polite"}
            style={{
                padding: 20,
                borderRadius: 8,
                background: "rgba(136, 85, 255, 0.1)",
                border: "1px dashed rgba(136, 85, 255, 0.5)",
                color: "#85F",
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                textAlign: "center",
                maxWidth: "80%",
            }}
        >
            {text}
        </div>
    )
}

addPropertyControls(LogoStrokePreloader, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        defaultValue: "SVG File",
        options: ["SVG File", "Path Data", "Image"],
        optionTitles: ["SVG File", "Path Data", "Image"],
        displaySegmentedControl: true,
        description: "Choose SVG upload, direct path data, or image reveal.",
    },
    svgFile: {
        type: ControlType.File,
        title: "SVG Logo",
        allowedFileTypes: ["svg"],
        description: "Upload a trusted SVG file.",
        hidden: (p) => p.source !== "SVG File" && p.source !== "upload",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        description: "Logo image for reveal mode.",
        hidden: (p) => p.source !== "Image" && p.source !== "image",
    },
    reveal: {
        type: ControlType.Enum,
        title: "Reveal",
        defaultValue: "Wipe →",
        options: ["Wipe →", "Wipe ←", "Wipe ↑", "Wipe ↓", "Fade"],
        optionTitles: ["Wipe →", "Wipe ←", "Wipe ↑", "Wipe ↓", "Fade"],
        hidden: (p) => p.source !== "Image" && p.source !== "image",
    },
    imageAlt: {
        type: ControlType.String,
        title: "Image Alt",
        defaultValue: "Logo",
        placeholder: "Leave empty if decorative",
        description: "Accessibility text. Empty = decorative image.",
        hidden: (p) => p.source !== "Image" && p.source !== "image",
    },
    sVGPaths: {
        type: ControlType.String,
        title: "SVG Paths",
        defaultValue: "M60 20 L20 100 L45 100 L45 160 L115 160 L115 100 L140 100 Z",
        displayTextArea: true,
        description: "One path per line, or separate with |",
        hidden: (p) => p.source !== "Path Data" && p.source !== "path",
    },
    viewBoxW: {
        type: ControlType.Number,
        title: "ViewBox W",
        defaultValue: 160,
        min: 1,
        max: 4000,
        step: 1,
        hidden: (p) => p.source !== "Path Data" && p.source !== "path",
    },
    viewBoxH: {
        type: ControlType.Number,
        title: "ViewBox H",
        defaultValue: 180,
        min: 1,
        max: 4000,
        step: 1,
        hidden: (p) => p.source !== "Path Data" && p.source !== "path",
    },
    playing: { type: ControlType.Boolean, title: "Playing", defaultValue: true },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "x",
    },
    sVGColors: {
        type: ControlType.Boolean,
        title: "SVG Colors",
        defaultValue: false,
        enabledTitle: "Keep",
        disabledTitle: "Override",
        hidden: (p) => p.source === "Image" || p.source === "image",
    },
    stroke: {
        type: ControlType.Color,
        title: "Stroke",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.source === "Image" || p.source === "image" || p.sVGColors,
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 3,
        min: 0.5,
        max: 40,
        step: 0.5,
        hidden: (p) => p.source === "Image" || p.source === "image",
    },
    lineCap: {
        type: ControlType.Enum,
        title: "Line Cap",
        defaultValue: "Round",
        options: ["Round", "Butt", "Square"],
        optionTitles: ["Round", "Butt", "Square"],
        displaySegmentedControl: true,
        hidden: (p) => p.source === "Image" || p.source === "image",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.2,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.3,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
        description: "Delay between each path",
        hidden: (p) => p.source === "Image" || p.source === "image",
    },
    startDelay: {
        type: ControlType.Number,
        title: "Start Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "Ease In-Out",
        options: ["Linear", "Ease In", "Ease Out", "Ease In-Out"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In-Out"],
    },
    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true },
    loopType: {
        type: ControlType.Enum,
        title: "Loop Type",
        defaultValue: "Reverse",
        options: ["Reverse", "Restart"],
        optionTitles: ["Reverse", "Restart"],
        displaySegmentedControl: true,
        hidden: (p) => !p.loop,
    },
    loopPause: {
        type: ControlType.Number,
        title: "Loop Pause",
        defaultValue: 0.4,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        hidden: (p) => !p.loop,
    },
    fillAfterDraw: {
        type: ControlType.Boolean,
        title: "Fill After Draw",
        defaultValue: false,
        hidden: (p) => p.source === "Image" || p.source === "image",
    },
    fillSource: {
        type: ControlType.Boolean,
        title: "Fill Source",
        defaultValue: false,
        enabledTitle: "SVG",
        disabledTitle: "Custom",
        hidden: (p) =>
            p.source === "Image" ||
            p.source === "image" ||
            !p.fillAfterDraw,
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#FFFFFF",
        hidden: (p) =>
            p.source === "Image" ||
            p.source === "image" ||
            !p.fillAfterDraw ||
            p.fillSource === true ||
            p.fillSource === "SVG",
    },
    background: {
        type: ControlType.Boolean,
        title: "Background",
        defaultValue: true,
    },
    bGColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#0A0A0A",
        hidden: (p) => !p.background,
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 40,
        min: 5,
        max: 100,
        step: 1,
        unit: "%",
    },
    canvasPreview: {
        type: ControlType.Boolean,
        title: "Canvas Preview",
        defaultValue: true,
        description: "When off, canvas/static views show completed state.",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        defaultValue: "Page Load",
        options: ["Page Load", "In View", "Click", "Hover"],
        optionTitles: ["Page Load", "In View", "Click", "Hover"],
        description: "How animation starts.",
    },
    viewThreshold: {
        type: ControlType.Number,
        title: "View %",
        defaultValue: 25,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description: "Visible percentage before starting.",
        hidden: (p) => p.trigger !== "In View",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: false,
        description: "Allow repeated starts for trigger interactions.",
        hidden: (p) => p.trigger === "Page Load",
    },
    resetOnLeave: {
        type: ControlType.Boolean,
        title: "Reset Leave",
        defaultValue: false,
        description: "Reset to initial state when pointer leaves.",
        hidden: (p) => p.trigger !== "Hover",
    },
    interactionLabel: {
        type: ControlType.String,
        title: "Action Label",
        defaultValue: "Start logo animation",
        description: "Accessible label used in Click mode.",
        hidden: (p) => p.trigger !== "Click",
    },
})
