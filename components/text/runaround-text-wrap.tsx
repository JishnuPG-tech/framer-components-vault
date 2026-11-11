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

import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : useEffect

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type Span = { left: number; right: number }
type Line = { text: string; x: number; y: number; width: number }

type WrapImageItem = {
    image?: ResponsiveImage
    x: number
    y: number
    scale: number
}

interface DebugZone {
    x: number
    y: number
    width: number
    height: number
}

interface RunaroundTextWrapProps {
    // New multi-image API
    images?: WrapImageItem[]

    // Backwards-compatible single-image API
    image?: ResponsiveImage

    text: string

    style?: CSSProperties

    font: any
    textColor: string

    textPadding?: number
    wrapPadding: number

    // Backwards-compatible single-image positioning
    imageX: number
    imageY: number
    imageScale: number

    alphaThreshold: number
    sampleStep: number

    debug: boolean
    dragToMove: boolean
    clipContent: boolean
}

/**
 * Instructions:
 * Create a Framer React code component called Runaround Text Wrap.
 * The component should have two main inputs in the Framer property panel:
 * 1. Image: transparent PNG/SVG image used as the wrapping object.
 * 2. Text: long body text that wraps around the visible shape of the image.
 * The image should be positioned absolutely inside the component using X, Y, width, and height controls.
 * The text must wrap around the actual visible pixels of the image, ignoring transparent background pixels. Do not wrap around the image bounding box.
 * Implement by loading the image into an offscreen canvas, reading its alpha channel, calculating occupied horizontal spans for every text line,
 * and laying out the text manually line-by-line using canvas text measurement. Render the final result as absolutely positioned text lines inside the component.
 * Include controls for font family, font size, line height, text color, image position, image size, wrap padding, text padding, and debug mode.
 * Debug mode should show the image bounding box and sampled wrap zones.
 *
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RunaroundTextWrap(props: RunaroundTextWrapProps) {
    const {
        images: imagesProp,
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Wrap image",
        },
        text,
        style,
        font,
        textColor,
        textPadding = 24,
        wrapPadding,
        imageX,
        imageY,
        imageScale,
        alphaThreshold,
        sampleStep,
        debug,
        dragToMove,
        clipContent,
    } = props

    const isStatic = useIsStaticRenderer()
    const renderTarget = RenderTarget.current()
    const allowDynamicLayout = renderTarget === RenderTarget.preview || renderTarget === RenderTarget.canvas
    const containerRef = useRef<HTMLDivElement>(null)
    const [lines, setLines] = useState<Line[]>([])
    const [debugZones, setDebugZones] = useState<DebugZone[]>([])

    const hasMulti = Array.isArray(imagesProp) && imagesProp.length > 0

    // IMPORTANT: Do not memoize this. In Framer, Array/Object controls can sometimes mutate in-place,
    // and memoization can cause stale positions between Canvas and Preview.
    const images = hasMulti
        ? imagesProp!.map((it) => ({
              image: it.image,
              x: Number.isFinite(it.x) ? it.x : imageX,
              y: Number.isFinite(it.y) ? it.y : imageY,
              scale: Number.isFinite(it.scale) ? it.scale : imageScale,
          }))
        : [
              {
                  image,
                  x: imageX,
                  y: imageY,
                  scale: imageScale,
              },
          ]

    const [dragPositions, setDragPositions] = useState<Array<{ x: number; y: number }>>(() => images.map((it) => ({ x: it.x, y: it.y })))
    const dragPositionsRef = useRef<Array<{ x: number; y: number }>>([])

    const imageElBySrcRef = useRef<Record<string, HTMLImageElement>>({})
    const imageBaseSizeBySrcRef = useRef<Record<string, { width: number; height: number }>>({})

    const [imageBaseSize, setImageBaseSize] = useState<{ width: number; height: number }>({ width: 220, height: 220 })
    const imageDrawWidth = useMemo(() => Math.max(1, Math.round(imageBaseSize.width * imageScale)), [imageBaseSize.width, imageScale])
    const imageDrawHeight = useMemo(() => Math.max(1, Math.round(imageBaseSize.height * imageScale)), [imageBaseSize.height, imageScale])

    const dragImageXRef = useRef(imageX)
    const dragImageYRef = useRef(imageY)

    const imgRef = useRef<HTMLImageElement | null>(null)
    const imgSrcRef = useRef<string>("")
    const maskCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const layoutRafRef = useRef<number>(0)
    const computeLayoutRef = useRef<(() => void) | null>(null)

    const dragStateRef = useRef<{
        active: boolean
        index: number
        startX: number
        startY: number
        originX: number
        originY: number
    } | null>(null)

    const normalizedText = useMemo(() => {
        const t = (text ?? "").replace(/\s+/g, " ").trim()
        return t
    }, [text])

    const resolvedFont = useMemo(() => {
        const family = font?.fontFamily || "Inter"
        const weight = font?.fontWeight || 400
        const style = font?.fontStyle || "normal"
        return {
            fontFamily: family,
            fontWeight: weight,
            fontStyle: style,
            letterSpacing: font?.letterSpacing,
            textAlign: font?.textAlign,
        }
    }, [font])

    const fontSizePx = useMemo(() => {
        const fs = font?.fontSize
        if (typeof fs === "number" && Number.isFinite(fs)) return Math.max(1, fs)
        if (typeof fs === "string") {
            const px = fs.match(/^(\s*([0-9.]+)px\s*)$/i)
            if (px) return Math.max(1, parseFloat(px[2]))
            const num = fs.match(/^(\s*([0-9.]+)\s*)$/)
            if (num) return Math.max(1, parseFloat(num[2]))
        }
        return 22
    }, [font?.fontSize])

    const effectiveLineHeight = useMemo(() => {
        const lh = font?.lineHeight

        let computed: number | null = null

        if (typeof lh === "number" && Number.isFinite(lh)) {
            // Framer Font control may provide a unitless multiplier as a number (e.g. 1.2).
            // Treat small numbers as multipliers to avoid collapsed lines.
            computed = lh > 0 && lh < 4 ? lh * fontSizePx : lh
        } else if (typeof lh === "string") {
            const trimmed = lh.trim().toLowerCase()
            if (trimmed && trimmed !== "normal") {
                const px = trimmed.match(/^([0-9.]+)px$/)
                if (px) computed = parseFloat(px[1])
                const em = trimmed.match(/^([0-9.]+)em$/)
                if (em) computed = parseFloat(em[1]) * fontSizePx
                const pct = trimmed.match(/^([0-9.]+)%$/)
                if (pct) computed = (parseFloat(pct[1]) / 100) * fontSizePx
                const unitless = trimmed.match(/^([0-9.]+)$/ )
                if (unitless) computed = parseFloat(unitless[1]) * fontSizePx
            }
        }

        const fallback = fontSizePx * 1.2
        const value = computed && Number.isFinite(computed) ? computed : fallback

        // Don't clamp to a large minimum (it prevents low line-heights from taking effect).
        // Only guard against invalid/zero values.
        const safe = value > 1 ? value : fallback
        return Math.round(safe)
    }, [font?.lineHeight, fontSizePx])

    const scheduleLayout = useCallback(() => {
        if (typeof window === "undefined") return
        if (!allowDynamicLayout) return
        if (layoutRafRef.current) cancelAnimationFrame(layoutRafRef.current)
        layoutRafRef.current = requestAnimationFrame(() => {
            computeLayoutRef.current?.()
        })
    }, [allowDynamicLayout])

    const computeLayout = useCallback(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return
        const container = containerRef.current
        if (!container) return
        if (!allowDynamicLayout) return

        const containerWidth = Math.max(1, Math.floor(container.clientWidth))
        const measuredHeight = Math.max(1, Math.floor(container.clientHeight))

        const fixedHeight = (style as any)?.height === "100%"
        const maxLinesForAuto = 2000
        const desiredTextHeight = Math.ceil(textPadding * 2 + effectiveLineHeight * maxLinesForAuto)

        const desiredImageHeight = images.reduce((acc, it, idx) => {
            const pos = dragPositionsRef.current[idx] ?? { x: it.x, y: it.y }
            const src = it.image?.src
            if (!src) return acc
            const base = imageBaseSizeBySrcRef.current[src] ?? { width: 220, height: 220 }
            const w = Math.max(1, Math.round(base.width * it.scale))
            const h = Math.max(1, Math.round(base.height * it.scale))
            return Math.max(acc, Math.ceil(Math.max(0, pos.y + h) + textPadding))
        }, 0)

        // In Fit Height (auto) mode, don't let the current element height limit the layout
        // otherwise the component can collapse and stop laying out lines.
        const containerHeight = fixedHeight ? measuredHeight : Math.min(12000, Math.max(measuredHeight, desiredTextHeight, desiredImageHeight))

        const measureCanvas = document.createElement("canvas")
        const ctx = measureCanvas.getContext("2d")
        if (!ctx) return

        const cssFont = `${resolvedFont.fontStyle} ${resolvedFont.fontWeight} ${fontSizePx}px ${resolvedFont.fontFamily}`
        ctx.font = cssFont
        ctx.textBaseline = "alphabetic"

        const commitNoWrap = () => {
            const result = buildLines({
                text: normalizedText,
                ctx,
                containerWidth,
                containerHeight,
                lineHeight: effectiveLineHeight,
                textPadding,
                blockedSpansByY: () => [],
            })
            startTransition(() => {
                setLines(result)
                setDebugZones([])
            })
        }

        if (!normalizedText) {
            startTransition(() => {
                setLines([])
                setDebugZones([])
            })
            return
        }

        const hasAnyImage = images.some((it) => !!it.image?.src)
        if (!hasAnyImage) {
            commitNoWrap()
            return
        }

        const ensureMaskCanvas = () => {
            if (!maskCanvasRef.current) {
                maskCanvasRef.current = document.createElement("canvas")
            }
            const c = maskCanvasRef.current
            if (!c) return null
            if (c.width !== containerWidth) c.width = containerWidth
            if (c.height !== containerHeight) c.height = containerHeight
            const maskCtx = c.getContext("2d", { willReadFrequently: true })
            return maskCtx
        }

        const maskCtx = ensureMaskCanvas()
        if (!maskCtx) {
            commitNoWrap()
            return
        }

        // Ensure all images are loaded (cached by src).
        for (const it of images) {
            const src = it.image?.src
            if (!src) continue
            if (imageElBySrcRef.current[src]) continue

            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                imageElBySrcRef.current[src] = img
                const nw = img.naturalWidth || 0
                const nh = img.naturalHeight || 0
                imageBaseSizeBySrcRef.current[src] = nw > 0 && nh > 0 ? { width: nw, height: nh } : { width: 220, height: 220 }
                scheduleLayout()
            }
            img.onerror = () => {
                delete imageElBySrcRef.current[src]
                delete imageBaseSizeBySrcRef.current[src]
                scheduleLayout()
            }
            img.src = src
        }

        const allLoaded = images.every((it) => {
            const src = it.image?.src
            if (!src) return true
            return !!imageElBySrcRef.current[src]
        })

        if (!allLoaded) return

        maskCtx.clearRect(0, 0, containerWidth, containerHeight)
        maskCtx.imageSmoothingEnabled = true

        for (let i = 0; i < images.length; i++) {
            const it = images[i]
            const src = it.image?.src
            if (!src) continue
            const img = imageElBySrcRef.current[src]
            if (!img) continue

            const pos = dragPositionsRef.current[i] ?? { x: it.x, y: it.y }
            const base = imageBaseSizeBySrcRef.current[src] ?? { width: 220, height: 220 }
            const w = Math.max(1, Math.round(base.width * it.scale))
            const h = Math.max(1, Math.round(base.height * it.scale))

            try {
                maskCtx.drawImage(img, pos.x, pos.y, w, h)
            } catch {
                // ignore a single image draw failure
            }
        }

        let imageData: ImageData | null = null
        try {
            imageData = maskCtx.getImageData(0, 0, containerWidth, containerHeight)
        } catch {
            commitNoWrap()
            return
        }

        const data = imageData.data
        const step = Math.max(1, Math.floor(sampleStep))

        const blockedSpansByY = (lineTop: number, lineBottom: number): Span[] => {
            const startY = Math.max(0, Math.floor(lineTop))
            const endY = Math.min(containerHeight, Math.ceil(lineBottom))
            if (endY <= startY) return []

            let merged: Span[] = []
            for (let y = startY; y < endY; y += step) {
                const spans = scanRowForAlphaSpans({
                    data,
                    width: containerWidth,
                    y,
                    alphaThreshold,
                    step,
                })
                if (spans.length === 0) continue
                merged = mergeSpans(merged.concat(spans))
            }

            if (merged.length === 0) return []

            const padded = merged
                .map((s) => ({
                    left: Math.max(0, s.left - wrapPadding),
                    right: Math.min(containerWidth, s.right + wrapPadding),
                }))
                .filter((s) => s.right > s.left)

            return mergeSpans(padded)
        }

        const result = buildLines({
            text: normalizedText,
            ctx,
            containerWidth,
            containerHeight,
            lineHeight: effectiveLineHeight,
            textPadding,
            blockedSpansByY,
        })

        if (debug) {
            const zones: DebugZone[] = []
            for (let y = textPadding; y <= containerHeight - textPadding - effectiveLineHeight; y += effectiveLineHeight) {
                const spans = blockedSpansByY(y, y + effectiveLineHeight)
                for (const s of spans) {
                    zones.push({
                        x: s.left,
                        y,
                        width: s.right - s.left,
                        height: effectiveLineHeight,
                    })
                }
            }
            startTransition(() => {
                setLines(result)
                setDebugZones(zones)
            })
        } else {
            startTransition(() => {
                setLines(result)
                setDebugZones([])
            })
        }
    }, [
        allowDynamicLayout,
        images,
        normalizedText,
        resolvedFont.fontFamily,
        resolvedFont.fontWeight,
        resolvedFont.fontStyle,
        fontSizePx,
        effectiveLineHeight,
        textPadding,
        wrapPadding,
        alphaThreshold,
        sampleStep,
        debug,
        scheduleLayout,
        (style as any)?.height,
    ])

    useEffect(() => {
        computeLayoutRef.current = computeLayout
    }, [computeLayout])

    const imagesSignature = useMemo(() => {
        return images
            .map((it) => `${it.image?.src ?? ""}@${Math.round(it.x)}:${Math.round(it.y)}:${it.scale}`)
            .join("|")
    }, [images])

    useIsomorphicLayoutEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return
        if (!containerRef.current) return
        if (!allowDynamicLayout) return

        // Sync drag positions to props whenever the image list/values change or when switching targets.
        // Avoids Canvas vs Preview mismatches.
        const next = images.map((it) => ({ x: it.x, y: it.y }))
        dragPositionsRef.current = next
        startTransition(() => setDragPositions(next))
    }, [imagesSignature, allowDynamicLayout, renderTarget])

    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return
        if (!containerRef.current) return
        if (!allowDynamicLayout) return

        const el = containerRef.current

        const ro = new ResizeObserver(() => scheduleLayout())
        ro.observe(el)

        scheduleLayout()

        return () => {
            if (layoutRafRef.current) cancelAnimationFrame(layoutRafRef.current)
            ro.disconnect()
        }
    }, [allowDynamicLayout, scheduleLayout])

    useEffect(() => {
        scheduleLayout()
    }, [
        images,
        normalizedText,
        resolvedFont.fontFamily,
        resolvedFont.fontWeight,
        resolvedFont.fontStyle,
        fontSizePx,
        effectiveLineHeight,
        textPadding,
        wrapPadding,
        alphaThreshold,
        sampleStep,
        debug,
        allowDynamicLayout,
        dragPositions,
        scheduleLayout,
    ])

    const renderedLines = useMemo(() => {
        // In export/thumbnail we fallback to a simple block; in Canvas/Preview we render the true layout.
        if (!allowDynamicLayout) return null
        return lines
    }, [allowDynamicLayout, lines])

    const contentHeight = useMemo(() => {
        const textMax = lines.reduce((acc, l) => Math.max(acc, l.y + effectiveLineHeight), textPadding)
        const imgMax = images.reduce((acc, it, idx) => {
            const src = it.image?.src
            if (!src) return acc
            const base = imageBaseSizeBySrcRef.current[src] ?? { width: 220, height: 220 }
            const h = Math.max(1, Math.round(base.height * it.scale))
            const pos = dragPositions[idx] ?? { x: it.x, y: it.y }
            return Math.max(acc, Math.max(0, pos.y + h))
        }, 0)
        const maxBottom = Math.max(textMax, imgMax)
        return Math.max(1, Math.ceil(maxBottom + textPadding))
    }, [lines, effectiveLineHeight, textPadding, images, dragPositions])

    const isFixedHeight = (style as any)?.height === "100%"
    const resolvedHeight = isFixedHeight ? "100%" : contentHeight

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: (style as any)?.width ?? "100%",
                height: resolvedHeight,
                position: "relative",
                overflow: clipContent ? "hidden" : "visible",
                background: "transparent",
            }}
        >
            {/* Provides intrinsic height when component is set to Fit Content (auto height) */}
            {!isFixedHeight && (
                <div
                    style={{
                        position: "relative",
                        width: 1,
                        height: contentHeight,
                        pointerEvents: "none",
                        opacity: 0,
                    }}
                    aria-hidden
                />
            )}
            {images.map((it, idx) => {
                const src = it.image?.src
                if (!src) return null
                const baseKnown = !!imageBaseSizeBySrcRef.current[src]
                const base = imageBaseSizeBySrcRef.current[src] ?? { width: 220, height: 220 }
                const w = Math.max(1, Math.round(base.width * it.scale))
                const h = Math.max(1, Math.round(base.height * it.scale))
                const pos = dragPositions[idx] ?? { x: it.x, y: it.y }

                return (
                    <img
                        key={idx}
                        src={src}
                        srcSet={it.image?.srcSet}
                        crossOrigin="anonymous"
                        alt={it.image?.alt ?? ""}
                        style={{
                            position: "absolute",
                            left: pos.x,
                            top: pos.y,
                            width: w,
                            height: h,
                            objectFit: "contain",
                            opacity: baseKnown ? 1 : 0,
                            transition: "opacity 120ms ease-out",
                            pointerEvents: baseKnown && !isStatic && allowDynamicLayout && dragToMove ? "auto" : "none",
                            userSelect: "none",
                            cursor: baseKnown && !isStatic && allowDynamicLayout && dragToMove ? "move" : "default",
                            touchAction: "none",
                        }}
                        draggable={false}
                        onLoad={(e) => {
                            const imgEl = e.currentTarget
                            const nw = imgEl.naturalWidth || 0
                            const nh = imgEl.naturalHeight || 0
                            if (nw > 0 && nh > 0) {
                                imageBaseSizeBySrcRef.current[src] = { width: nw, height: nh }
                                // Do not cache the DOM <img> for masking; it may taint the canvas unless crossOrigin is set consistently.
                                // Ensure the cached mask image is always a CORS-safe Image() instance.
                                if (!imageElBySrcRef.current[src]) {
                                    const safeImg = new Image()
                                    safeImg.crossOrigin = "anonymous"
                                    safeImg.onload = () => {
                                        imageElBySrcRef.current[src] = safeImg
                                        scheduleLayout()
                                    }
                                    safeImg.onerror = () => {
                                        delete imageElBySrcRef.current[src]
                                        scheduleLayout()
                                    }
                                    safeImg.src = src
                                }
                                scheduleLayout()
                            }
                        }}
                        onPointerDown={(e) => {
                            if (isStatic || !allowDynamicLayout || !dragToMove) return
                            e.preventDefault()
                            ;(e.currentTarget as any).setPointerCapture?.(e.pointerId)
                            dragStateRef.current = {
                                active: true,
                                index: idx,
                                startX: e.clientX,
                                startY: e.clientY,
                                originX: pos.x,
                                originY: pos.y,
                            }
                        }}
                        onPointerMove={(e) => {
                            const s = dragStateRef.current
                            if (!s?.active || s.index !== idx) return
                            const dx = e.clientX - s.startX
                            const dy = e.clientY - s.startY
                            const nextX = s.originX + dx
                            const nextY = s.originY + dy

                            const next = dragPositionsRef.current.slice()
                            next[idx] = { x: nextX, y: nextY }
                            dragPositionsRef.current = next
                            startTransition(() => setDragPositions(next))
                            scheduleLayout()
                        }}
                        onPointerUp={() => {
                            const s = dragStateRef.current
                            if (!s) return
                            dragStateRef.current = { ...s, active: false }
                        }}
                        onPointerCancel={() => {
                            const s = dragStateRef.current
                            if (!s) return
                            dragStateRef.current = { ...s, active: false }
                        }}
                    />
                )
            })}

            {!allowDynamicLayout ? (
                <div
                    style={{
                        position: "absolute",
                        left: textPadding,
                        top: textPadding,
                        right: textPadding,
                        color: textColor,
                        lineHeight: `${effectiveLineHeight}px`,
                        whiteSpace: "pre-wrap",
                        ...resolvedFont,
                        fontSize: fontSizePx,
                    }}
                >
                    {normalizedText}
                </div>
            ) : (
                renderedLines?.map((line, index) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            left: line.x,
                            top: line.y,
                            width: line.width,
                            textAlign: resolvedFont.textAlign ?? "left",
                            color: textColor,
                            whiteSpace: "nowrap",
                            lineHeight: `${effectiveLineHeight}px`,
                            ...resolvedFont,
                            fontSize: fontSizePx,
                        }}
                    >
                        {line.text}
                    </div>
                ))
            )}

            {debug && allowDynamicLayout && (
                <>
                    {images.map((it, idx) => {
                        const src = it.image?.src
                        if (!src) return null
                        const base = imageBaseSizeBySrcRef.current[src] ?? { width: 220, height: 220 }
                        const w = Math.max(1, Math.round(base.width * it.scale))
                        const h = Math.max(1, Math.round(base.height * it.scale))
                        const pos = dragPositions[idx] ?? { x: it.x, y: it.y }
                        const baseKnown = !!imageBaseSizeBySrcRef.current[src]
                        if (!baseKnown) return null
                        return (
                            <div
                                key={idx}
                                style={{
                                    position: "absolute",
                                    left: pos.x,
                                    top: pos.y,
                                    width: w,
                                    height: h,
                                    border: "1px dashed red",
                                    pointerEvents: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                        )
                    })}

                    {debugZones.map((zone, index) => (
                        <div
                            key={"z-" + index}
                            style={{
                                position: "absolute",
                                left: zone.x,
                                top: zone.y,
                                width: zone.width,
                                height: zone.height,
                                background: "rgba(255, 0, 0, 0.12)",
                                pointerEvents: "none",
                            }}
                        />
                    ))}
                </>
            )}
        </div>
    )
}

function buildLines(params: {
    text: string
    ctx: CanvasRenderingContext2D
    containerWidth: number
    containerHeight: number
    lineHeight: number
    textPadding: number
    blockedSpansByY: (lineTop: number, lineBottom: number) => Span[]
}): Line[] {
    const { text, ctx, containerWidth, containerHeight, lineHeight, textPadding, blockedSpansByY } = params

    const words = text ? text.split(" ") : []
    const out: Line[] = []

    let wordIndex = 0
    let y = textPadding

    const minRunWidth = 16
    const maxWordWidth = Math.max(1, containerWidth - textPadding * 2)

    while (wordIndex < words.length && y <= containerHeight - textPadding - lineHeight) {
        const lineTop = y
        const lineBottom = y + lineHeight
        const blockedSpans = blockedSpansByY(lineTop, lineBottom)

        const availableRuns = getAvailableRuns({
            containerWidth,
            textPadding,
            blockedSpans,
            minRunWidth,
        })

        let placedOnRow = false

        for (const run of availableRuns) {
            if (wordIndex >= words.length) break

            let lineText = ""
            let testText = ""
            let fitCount = 0

            while (wordIndex < words.length) {
                testText = lineText ? `${lineText} ${words[wordIndex]}` : words[wordIndex]
                const width = ctx.measureText(testText).width
                if (width > run.width) break
                lineText = testText
                wordIndex++
                fitCount++
            }

            // Never break words. If a single word cannot fit in this run, try the next run.
            // If it can't fit in any run on this row (or is longer than the max usable width),
            // place it as-is in the first run so we can always make progress.
            if (!lineText && wordIndex < words.length) {
                const word = words[wordIndex]
                const wordWidth = ctx.measureText(word).width

                if (wordWidth > maxWordWidth && availableRuns.length > 0 && run === availableRuns[0]) {
                    lineText = word
                    wordIndex++
                } else {
                    continue
                }
            }

            if (lineText) {
                out.push({ text: lineText, x: run.left, y, width: run.width })
                placedOnRow = true
            }

            if (fitCount > 0) {
                // continue
            }
        }

        // If nothing could be placed (e.g. all runs are too small), advance to the next row to avoid stalling.
        if (!placedOnRow) {
            const word = words[wordIndex]
            if (!word) break
            // If there are no runs at all, we can't place anything on this row.
            // We'll just advance y and try again.
        }

        y += lineHeight
    }

    return out
}

function getAvailableRuns(params: {
    containerWidth: number
    textPadding: number
    blockedSpans: Span[]
    minRunWidth: number
}): Array<{ left: number; right: number; width: number }> {
    const { containerWidth, textPadding, blockedSpans, minRunWidth } = params

    let runs: Span[] = [{ left: textPadding, right: containerWidth - textPadding }]

    const blocks = mergeSpans(blockedSpans)

    for (const block of blocks) {
        const next: Span[] = []
        for (const run of runs) {
            if (block.right <= run.left || block.left >= run.right) {
                next.push(run)
                continue
            }
            if (block.left > run.left) next.push({ left: run.left, right: block.left })
            if (block.right < run.right) next.push({ left: block.right, right: run.right })
        }
        runs = next
        if (runs.length === 0) break
    }

    return runs
        .map((r) => ({ ...r, width: r.right - r.left }))
        .filter((r) => r.width >= minRunWidth)
}

function scanRowForAlphaSpans(params: {
    data: Uint8ClampedArray
    width: number
    y: number
    alphaThreshold: number
    step: number
}): Span[] {
    const { data, width, y, alphaThreshold, step } = params
    const spans: Span[] = []

    let inSpan = false
    let spanStart = 0

    // Noise guard: require a small streak of occupied samples to begin a span,
    // and a small streak of empty samples to end it. This prevents tiny stray pixels
    // (common in complex/antialiased images) from creating random wrap gaps far away.
    const beginStreak = 2
    const endStreak = 2
    let occStreak = 0
    let emptyStreak = 0

    const rowOffset = y * width * 4

    for (let x = 0; x < width; x += step) {
        const idx = rowOffset + x * 4 + 3
        const a = data[idx]
        const occupied = a > alphaThreshold

        if (occupied) {
            occStreak++
            emptyStreak = 0
        } else {
            emptyStreak++
            occStreak = 0
        }

        if (!inSpan && occStreak >= beginStreak) {
            inSpan = true
            spanStart = Math.max(0, x - (beginStreak - 1) * step)
        }

        if (inSpan && emptyStreak >= endStreak) {
            inSpan = false
            const spanEnd = Math.max(spanStart, x - (endStreak - 1) * step)
            spans.push({ left: spanStart, right: Math.min(width, spanEnd) })
        }
    }

    if (inSpan) spans.push({ left: spanStart, right: width })

    const minSpanWidth = Math.max(2, step * 2)

    // Expand spans slightly to compensate for sampling step gaps,
    // but drop extremely small spans that are likely alpha noise.
    return spans
        .map((s) => ({
            left: Math.max(0, s.left - step),
            right: Math.min(width, s.right + step),
        }))
        .filter((s) => s.right - s.left >= minSpanWidth)
}

function mergeSpans(spans: Span[]): Span[] {
    if (spans.length <= 1) return spans.slice()

    const sorted = spans
        .filter((s) => Number.isFinite(s.left) && Number.isFinite(s.right))
        .map((s) => ({ left: Math.min(s.left, s.right), right: Math.max(s.left, s.right) }))
        .filter((s) => s.right > s.left)
        .sort((a, b) => a.left - b.left)

    const out: Span[] = []
    let cur = sorted[0]

    for (let i = 1; i < sorted.length; i++) {
        const s = sorted[i]
        if (s.left <= cur.right) {
            cur = { left: cur.left, right: Math.max(cur.right, s.right) }
        } else {
            out.push(cur)
            cur = s
        }
    }
    out.push(cur)
    return out
}

function breakWordToFit(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): { fit: string; rest: string } {
    if (!word) return { fit: "", rest: "" }
    if (ctx.measureText(word).width <= maxWidth) return { fit: word, rest: "" }

    let fit = ""
    for (let i = 1; i <= word.length; i++) {
        const test = word.slice(0, i)
        if (ctx.measureText(test).width > maxWidth) break
        fit = test
    }
    return { fit, rest: word.slice(fit.length) }
}

addPropertyControls(RunaroundTextWrap, {
    images: {
        type: ControlType.Array,
        title: "Images",
        defaultValue: [{ x: 280, y: 90, scale: 1 }],
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                x: { type: ControlType.Number, title: "X", defaultValue: 280, min: -2000, max: 4000, step: 1 },
                y: { type: ControlType.Number, title: "Y", defaultValue: 90, min: -2000, max: 4000, step: 1 },
                scale: { type: ControlType.Number, title: "Scale", defaultValue: 1, min: 0.1, max: 5, step: 0.05 },
            },
        },
    },
    image: { type: ControlType.ResponsiveImage, title: "Image", hidden: ({ images }) => Array.isArray(images) && images.length > 0 },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "Drop an image with transparency into this component and the text will wrap around the visible shape instead of the image box. This creates magazine-like editorial wrapping directly inside Framer.",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#000000" },
    wrapPadding: { type: ControlType.Number, title: "Wrap Padding", description: "Extra gap between text and the visible image edge. Best for readability and busy images.", defaultValue: 14, min: 0, max: 120, step: 1 },
    imageX: {
        type: ControlType.Number,
        title: "Image X",
        defaultValue: 280,
        min: -2000,
        max: 4000,
        step: 1,
        hidden: ({ images }) => Array.isArray(images) && images.length > 0,
    },
    imageY: {
        type: ControlType.Number,
        title: "Image Y",
        defaultValue: 90,
        min: -2000,
        max: 4000,
        step: 1,
        hidden: ({ images }) => Array.isArray(images) && images.length > 0,
    },
    imageScale: {
        type: ControlType.Number,
        title: "Image Scale",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.05,
        hidden: ({ images }) => Array.isArray(images) && images.length > 0,
    },
    alphaThreshold: { type: ControlType.Number, title: "Alpha Threshold", description: "Alpha cutoff (0–255) for what counts as solid. Higher = wrap closer into soft edges/glows.", defaultValue: 20, min: 0, max: 255, step: 1 },
    sampleStep: { type: ControlType.Number, title: "Sample Step", description: "Sampling density for the alpha mask. Lower = more accurate, higher = faster (use higher for large canvases).", defaultValue: 2, min: 1, max: 12, step: 1 },
    debug: { type: ControlType.Boolean, title: "Debug", description: "Shows image bounds + sampled wrap zones. Best when tuning threshold/step/padding.", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    dragToMove: {
        type: ControlType.Boolean,
        title: "Drag Image",
        description: "Drag images in Canvas/Preview to place them; layout updates live. Turn off to avoid accidental moves.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    clipContent: {
        type: ControlType.Boolean,
        title: "Clipping",
        description: "Hide overflow outside the component bounds. On for clean frames; off when images extend past edges.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})

RunaroundTextWrap.displayName = "Runaround Text Wrap"