// Create an advanced React-based Framer Code Component that generates a calligraphy-style handwriting animation from user input text.
// Requirements: text input, font URL (.ttf/.otf), convert to SVG path via opentype.js, handwriting animation, duration control, loop, replay trigger, responsive SVG scaling, performance optimizations, mask-based filled-path reveal.

import * as React from "react"
import { startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import type { Transition } from "framer-motion"

type ResponsiveImageLike = { src: string; alt?: string } // unused, but keeps patterns consistent

type OpentypeFont = any

interface CalligraphySignatureProps {
    text: string
    fontPreset: "pinyon" | "allura" | "dancingscript" | "greatvibes" | "custom"
    fontUrl: string
    fontSize: number
    color: string
    strokeThickness: number
    animationTime: number
    loop: boolean
    loopInterval: number
    showGuide: boolean
    stayAfter: boolean
    afterHold: number
    afterFade: number
    padding: string
    style?: React.CSSProperties
}

type FontCacheEntry =
    | { status: "loading"; promise: Promise<OpentypeFont> }
    | { status: "loaded"; font: OpentypeFont }
    | { status: "error"; error: any }

const fontCache = new Map<string, FontCacheEntry>()

const fontPresets: Record<CalligraphySignatureProps["fontPreset"], string> = {
    pinyon: "https://raw.githubusercontent.com/google/fonts/main/ofl/pinyonscript/PinyonScript-Regular.ttf",
    allura: "https://raw.githubusercontent.com/google/fonts/main/ofl/allura/Allura-Regular.ttf",
    dancingscript:
        "https://raw.githubusercontent.com/google/fonts/main/ofl/dancingscript/DancingScript[wght].ttf",
    greatvibes:
        "https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf",
    custom: "",
}

const BASE_LAYOUT_FONT_SIZE = 150

const DEFAULT_VIEWBOX_W = 700
const DEFAULT_VIEWBOX_H = 240

let openTypeModulePromise: Promise<any> | null = null

async function loadOpenTypeModule(): Promise<any> {
    // Avoid TypeScript module-resolution errors by importing via a runtime string.
    // This also ensures the module is loaded only once.
    if (openTypeModulePromise) return openTypeModulePromise

    if (typeof window === "undefined") {
        throw new Error("OpenType module can only be loaded in the browser")
    }

    const url =
        "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.module.js"

    openTypeModulePromise = (async () => {
        const dynamicImport = Function("u", "return import(u)") as (
            u: string
        ) => Promise<any>
        return await dynamicImport(url)
    })()

    return openTypeModulePromise
}

async function loadFontFromUrl(url: string): Promise<OpentypeFont> {
    if (!url) throw new Error("Missing font URL")

    const cached = fontCache.get(url)
    if (cached?.status === "loaded") return cached.font
    if (cached?.status === "loading") return cached.promise

    const promise = (async () => {
        const opentype = await loadOpenTypeModule()

        const res = await fetch(url, { mode: "cors" })
        if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`)
        const buf = await res.arrayBuffer()

        // opentype.parse accepts ArrayBuffer
        const font = opentype.parse(buf)
        fontCache.set(url, { status: "loaded", font })
        return font
    })()

    fontCache.set(url, { status: "loading", promise })

    try {
        return await promise
    } catch (e) {
        fontCache.set(url, { status: "error", error: e })
        throw e
    }
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function parsePadding(value: any): { top: number; right: number; bottom: number; left: number } {
    const raw = typeof value === "string" ? value.trim() : "0px"
    const parts = raw.split(/\s+/).filter(Boolean)
    const toPx = (v: string) => {
        const num = parseFloat(v)
        return Number.isFinite(num) ? clamp(num, 0, 400) : 0
    }

    const a = toPx(parts[0] ?? "0")
    const b = toPx(parts[1] ?? parts[0] ?? "0")
    const c = toPx(parts[2] ?? parts[0] ?? "0")
    const d = toPx(parts[3] ?? parts[1] ?? parts[0] ?? "0")

    return { top: a, right: b, bottom: c, left: d }
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 240
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CalligraphySignature(props: CalligraphySignatureProps) {
    const {
        text,
        fontPreset,
        fontUrl,
        fontSize,
        color,
        strokeThickness,
        animationTime,
        loop,
        loopInterval,
        showGuide,
        stayAfter,
        afterHold,
        afterFade,
        padding,
        style,
    } = props

    const paddingPx = React.useMemo(() => parsePadding(padding), [padding])

    const safeFontSize = React.useMemo(
        () => clamp(Number(fontSize) || 120, 8, 600),
        [fontSize]
    )
    const safeDuration = React.useMemo(
        () => clamp(Number(animationTime) || 2.8, 0.2, 30),
        [animationTime]
    )

    const safeLoopInterval = React.useMemo(
        () => clamp(Number(loopInterval) || 0, 0, 30),
        [loopInterval]
    )

    const safeAfterHold = React.useMemo(
        () => clamp(Number(afterHold) || 0, 0, 30),
        [afterHold]
    )
    const safeAfterFade = React.useMemo(
        () => clamp(Number(afterFade) || 0.5, 0, 10),
        [afterFade]
    )

    const resolvedFontUrl = React.useMemo(() => {
        if (fontPreset && fontPreset !== "custom")
            return fontPresets[fontPreset]
        return fontUrl
    }, [fontPreset, fontUrl])

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement | null>(null)

    const isFixedWidth = !!style && style.width === "100%"
    const isFixedHeight = !!style && style.height === "100%"

    const [containerSize, setContainerSize] = React.useState({
        width: DEFAULT_VIEWBOX_W,
        height: DEFAULT_VIEWBOX_H,
    })

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!isFixedWidth && !isFixedHeight) return
        const el = containerRef.current
        if (!el) return

        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (!r) return
            startTransition(() =>
                setContainerSize({
                    width: Math.round(r.width),
                    height: Math.round(r.height),
                })
            )
        })

        ro.observe(el)
        return () => ro.disconnect()
    }, [isFixedWidth, isFixedHeight])

    const canStart = true

    const [font, setFont] = React.useState<OpentypeFont | null>(null)
    const [error, setError] = React.useState<string>("")
    const [animKey, setAnimKey] = React.useState(0)
    const [phase, setPhase] = React.useState<
        "idle" | "playing" | "done" | "fading" | "hidden"
    >("idle")

    const completedRunKeyRef = React.useRef<number | null>(null)
    const hasPlayedOnceRef = React.useRef(false)

    const restartTimerRef = React.useRef<number | null>(null)
    const afterTimerRef = React.useRef<number | null>(null)
    const fadeTimerRef = React.useRef<number | null>(null)
    const startRunRef = React.useRef<(() => void) | null>(null)
    const loopRestartPendingRef = React.useRef(false)

    React.useEffect(() => {
        // In Framer Canvas/Export (static renderer), show the finished signature immediately.
        if (!isStatic) return
        startTransition(() => setPhase("done"))
    }, [isStatic])

    React.useEffect(() => {
        let cancelled = false

        if (typeof window === "undefined") return

        setError("")
        startTransition(() => setFont(null))
        ;(async () => {
            try {
                const f = await loadFontFromUrl(resolvedFontUrl)
                if (cancelled) return
                startTransition(() => setFont(f))
            } catch (e: any) {
                if (cancelled) return
                startTransition(() => {
                    setError(e?.message || "Failed to load font")
                    setFont(null)
                })
            }
        })()

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedFontUrl])

    React.useEffect(() => {
        // Reset back to idle on content changes; will start again when in view.
        startTransition(() => {
            setPhase("idle")
        })
        hasPlayedOnceRef.current = false
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        text,
        resolvedFontUrl,
        safeFontSize,
        color,
        safeDuration,
        loop,
        safeLoopInterval,
        stayAfter,
        safeAfterHold,
        safeAfterFade,
    ])

    const startRun = React.useCallback(() => {
        loopRestartPendingRef.current = false
        if (restartTimerRef.current != null && typeof window !== "undefined") {
            window.clearTimeout(restartTimerRef.current)
            restartTimerRef.current = null
        }
        if (afterTimerRef.current != null && typeof window !== "undefined") {
            window.clearTimeout(afterTimerRef.current)
            afterTimerRef.current = null
        }
        if (fadeTimerRef.current != null && typeof window !== "undefined") {
            window.clearTimeout(fadeTimerRef.current)
            fadeTimerRef.current = null
        }
        startTransition(() => {
            setAnimKey((k) => {
                const next = k + 1
                completedRunKeyRef.current = null
                return next
            })
            setPhase("playing")
        })
    }, [])

    // Keep latest startRun in a ref for use inside animation callbacks
    React.useEffect(() => {
        startRunRef.current = startRun
    }, [startRun])

    const pathData = React.useMemo(() => {
        if (!font) return null
        if (!text?.trim()) return null

        try {
            // Build per-glyph paths so we can animate letter-by-letter instead of drawing all subpaths at once.
            // IMPORTANT: generate paths at the user-selected font size so fontSize always updates correctly.
            const paths = font.getPaths(text, 0, 0, safeFontSize)
            if (!paths || paths.length === 0) return null

            let x1 = Infinity
            let y1 = Infinity
            let x2 = -Infinity
            let y2 = -Infinity

            const glyphs = paths
                .map((p: any) => {
                    const d = p.toPathData(3)
                    const b = p.getBoundingBox()
                    if (Number.isFinite(b.x1)) x1 = Math.min(x1, b.x1)
                    if (Number.isFinite(b.y1)) y1 = Math.min(y1, b.y1)
                    if (Number.isFinite(b.x2)) x2 = Math.max(x2, b.x2)
                    if (Number.isFinite(b.y2)) y2 = Math.max(y2, b.y2)
                    return { d, bbox: b }
                })
                .filter((g: any) => typeof g.d === "string" && g.d.length > 0)

            if (glyphs.length === 0) return null

            const bbox = { x1, y1, x2, y2 }
            return { glyphs, bbox }
        } catch (e: any) {
            return null
        }
    }, [font, text, safeFontSize])

    const naturalSize = React.useMemo(() => {
        if (!pathData) {
            return {
                width: DEFAULT_VIEWBOX_W,
                height: DEFAULT_VIEWBOX_H,
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
            }
        }

        const { bbox } = pathData
        const w = Math.max(1, bbox.x2 - bbox.x1)
        const h = Math.max(1, bbox.y2 - bbox.y1)
        const padX = paddingPx.left + paddingPx.right
        const padY = paddingPx.top + paddingPx.bottom

        return {
            width: Math.ceil(w + padX),
            height: Math.ceil(h + padY),
            padding: paddingPx,
        }
    }, [pathData, paddingPx])

    React.useEffect(() => {
        if (isFixedWidth || isFixedHeight) return
        startTransition(() =>
            setContainerSize({
                width: naturalSize.width,
                height: naturalSize.height,
            })
        )
    }, [isFixedWidth, isFixedHeight, naturalSize.width, naturalSize.height])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        if (!pathData) return
        if (!canStart) return
        if (safeDuration <= 0) return
        if (phase !== "idle") return
        if (loopRestartPendingRef.current) return
        if (!loop && hasPlayedOnceRef.current) return

        startRun()
    }, [canStart, isStatic, pathData, phase, safeDuration, startRun])

    const geometry = React.useMemo(() => {
        const fallback = {
            viewBox: `0 0 ${DEFAULT_VIEWBOX_W} ${DEFAULT_VIEWBOX_H}`,
            transform: `translate(0 0)`,
            strokeWidth: Math.max(1, safeFontSize * 0.12),
        }

        if (!pathData) return fallback

        const { bbox } = pathData
        const w = Math.max(1, bbox.x2 - bbox.x1)
        const h = Math.max(1, bbox.y2 - bbox.y1)

        const cw = Math.max(
            1,
            (isFixedWidth ? containerSize.width : naturalSize.width) ||
                DEFAULT_VIEWBOX_W
        )
        const ch = Math.max(
            1,
            (isFixedHeight ? containerSize.height : naturalSize.height) ||
                DEFAULT_VIEWBOX_H
        )

        const padX = paddingPx.left + paddingPx.right
        const padY = paddingPx.top + paddingPx.bottom

        // Paths are already generated at safeFontSize; only scale DOWN to fit when needed.
        const fitScale = Math.min(1, (cw - padX) / w, (ch - padY) / h)
        const scale = Number.isFinite(fitScale) ? fitScale : 1

        const centerX = (bbox.x1 + bbox.x2) / 2
        const centerY = (bbox.y1 + bbox.y2) / 2

        const offsetX = (paddingPx.left - paddingPx.right) / 2
        const offsetY = (paddingPx.top - paddingPx.bottom) / 2

        return {
            viewBox: `0 0 ${cw} ${ch}`,
            transform: `translate(${cw / 2 + offsetX} ${ch / 2 + offsetY}) scale(${scale}) translate(${-centerX} ${-centerY})`,
            strokeWidth: Math.max(1, safeFontSize * 0.12 * scale),
        }
    }, [
        pathData,
        safeFontSize,
        containerSize.width,
        containerSize.height,
        isFixedWidth,
        isFixedHeight,
        naturalSize.width,
        naturalSize.height,
        naturalSize.padding,
        paddingPx,
    ])

    const thickness = React.useMemo(
        () => clamp(Number(strokeThickness) || 1, 0.1, 3),
        [strokeThickness]
    )

    const shouldAnimate =
        !isStatic &&
        !!pathData &&
        safeDuration > 0 &&
        canStart &&
        phase === "playing"

    // Cleanup any pending loop restart timer
    React.useEffect(() => {
        return () => {
            if (typeof window === "undefined") return
            if (restartTimerRef.current != null)
                window.clearTimeout(restartTimerRef.current)
            if (afterTimerRef.current != null)
                window.clearTimeout(afterTimerRef.current)
            if (fadeTimerRef.current != null)
                window.clearTimeout(fadeTimerRef.current)
        }
    }, [])

    const glyphCount = React.useMemo(
        () => (pathData?.glyphs?.length ? pathData.glyphs.length : 0),
        [pathData]
    )
    const perGlyphDuration = React.useMemo(() => {
        if (!glyphCount) return safeDuration
        return Math.max(0.05, safeDuration / glyphCount)
    }, [safeDuration, glyphCount])

    const inkStrokeWidth = React.useMemo(
        () => geometry.strokeWidth * thickness,
        [geometry.strokeWidth, thickness]
    )

    // Avoid flashing default SVG <text> before the font/path data is ready.
    // Only show fallback when there's an error, or when there's no input text (placeholder state).
    // Also show fallback while loading (pathData is null) to avoid runtime errors.
    const showFallbackText = !pathData || !!error || !text?.trim()

    const baseDashOffset = React.useMemo(() => {
        // Hide everything before start; show final result when done unless stayAfter is off.
        if (isStatic) return 0
        if (phase === "idle" || phase === "hidden") return 1
        return 0
    }, [phase, isStatic])

    const inkOpacity = React.useMemo(() => {
        if (isStatic) return 1
        if (phase === "idle" || phase === "hidden") return 0
        if (phase === "fading") return 0
        return 1
    }, [isStatic, phase])

    const inkOpacityTransition = React.useMemo(() => {
        if (isStatic) return { duration: 0 } as Transition
        if (phase === "fading")
            return {
                duration: safeAfterFade,
                ease: [0.2, 0.0, 0.1, 1.0],
            } as Transition
        return { duration: 0 } as Transition
    }, [isStatic, phase, safeAfterFade])

    // Note: if some fonts look slightly clipped, the two common fixes are: (1) add a user padding control, or (2) change the wrapper overflow to "visible".
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: isFixedWidth ? "100%" : containerSize.width,
                height: isFixedHeight ? "100%" : containerSize.height,
                overflow: "visible",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "stretch",
                background: "transparent",
            }}
            aria-label="Handwriting animation"
        >
            <svg
                width="100%"
                height="100%"
                viewBox={geometry.viewBox}
                preserveAspectRatio="xMidYMid meet"
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    overflow: "visible",
                }}
                role="img"
                aria-label={text}
            >
                {showFallbackText ? (
                    <g>
                        {!text?.trim() ? (
                            <text
                                x="50%"
                                y="55%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={color}
                                style={{
                                    fontSize: 16,
                                    fontFamily:
                                        "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                                }}
                            >
                                Type text…
                            </text>
                        ) : null}
                        {!!error && (
                            <text
                                x="50%"
                                y="75%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={color}
                                opacity={0.7}
                                style={{
                                    fontSize: 12,
                                    fontFamily:
                                        "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                                }}
                            >
                                {error}
                            </text>
                        )}
                    </g>
                ) : (
                    <g transform={`${geometry.transform}`}>
                        {/* Base faint guide (hidden until animation starts) */}
                        {showGuide &&
                            (isStatic ||
                                phase === "playing" ||
                                phase === "done") &&
                            (pathData?.glyphs ?? []).map(
                                (g: any, i: number) => (
                                    <path
                                        key={`guide-${animKey}-${i}`}
                                        d={g.d}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={inkStrokeWidth}
                                        opacity={0.18}
                                    />
                                )
                            )}

                        {/* Stroke drawing (classic handwriting line) */}
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: inkOpacity }}
                            transition={inkOpacityTransition}
                        >
                            {(pathData?.glyphs ?? []).map(
                                (g: any, i: number) =>
                                    isStatic ? (
                                        <path
                                            key={`ink-glyph-static-${i}`}
                                            d={g.d}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={inkStrokeWidth}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    ) : (
                                        <motion.path
                                            key={`ink-glyph-${animKey}-${i}`}
                                            d={g.d}
                                            fill="none"
                                            stroke={color}
                                            strokeWidth={inkStrokeWidth}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            pathLength={1}
                                            strokeDasharray={1}
                                            initial={{
                                                strokeDashoffset: 1,
                                                opacity: 0,
                                            }}
                                            animate={
                                                shouldAnimate
                                                    ? {
                                                          strokeDashoffset: 0,
                                                          opacity: 1,
                                                      }
                                                    : {
                                                          strokeDashoffset:
                                                              baseDashOffset,
                                                          opacity:
                                                              baseDashOffset >=
                                                              1
                                                                  ? 0
                                                                  : 1,
                                                      }
                                            }
                                            transition={
                                                shouldAnimate
                                                    ? ({
                                                          strokeDashoffset: {
                                                              duration:
                                                                  perGlyphDuration,
                                                              delay:
                                                                  i *
                                                                  perGlyphDuration,
                                                              ease: [
                                                                  0.2, 0.0, 0.1,
                                                                  1.0,
                                                              ],
                                                          },
                                                          opacity: {
                                                              duration: 0,
                                                              delay:
                                                                  i *
                                                                  perGlyphDuration,
                                                          },
                                                      } as any)
                                                    : { duration: 0 }
                                            }
                                            onAnimationComplete={() => {
                                                if (i !== glyphCount - 1) return

                                                if (
                                                    completedRunKeyRef.current ===
                                                    animKey
                                                )
                                                    return
                                                completedRunKeyRef.current =
                                                    animKey
                                                hasPlayedOnceRef.current = true

                                                if (loop) {
                                                    if (
                                                        typeof window ===
                                                        "undefined"
                                                    )
                                                        return

                                                    loopRestartPendingRef.current = true
                                                    startTransition(() =>
                                                        setPhase("idle")
                                                    )

                                                    if (
                                                        restartTimerRef.current !=
                                                        null
                                                    ) {
                                                        window.clearTimeout(
                                                            restartTimerRef.current
                                                        )
                                                    }

                                                    restartTimerRef.current =
                                                        window.setTimeout(
                                                            () => {
                                                                if (
                                                                    !startRunRef.current
                                                                )
                                                                    return
                                                                if (!canStart)
                                                                    return
                                                                startRunRef.current()
                                                            },
                                                            Math.max(
                                                                0,
                                                                safeLoopInterval
                                                            ) * 1000
                                                        )
                                                    return
                                                }

                                                // Non-looping
                                                if (stayAfter) {
                                                    startTransition(() =>
                                                        setPhase("done")
                                                    )
                                                    return
                                                }

                                                if (
                                                    typeof window ===
                                                    "undefined"
                                                ) {
                                                    startTransition(() =>
                                                        setPhase("hidden")
                                                    )
                                                    return
                                                }

                                                startTransition(() =>
                                                    setPhase("done")
                                                )

                                                if (
                                                    afterTimerRef.current !=
                                                    null
                                                ) {
                                                    window.clearTimeout(
                                                        afterTimerRef.current
                                                    )
                                                }
                                                if (
                                                    fadeTimerRef.current != null
                                                ) {
                                                    window.clearTimeout(
                                                        fadeTimerRef.current
                                                    )
                                                }

                                                afterTimerRef.current =
                                                    window.setTimeout(
                                                        () => {
                                                            startTransition(
                                                                () =>
                                                                    setPhase(
                                                                        "fading"
                                                                    )
                                                            )

                                                            fadeTimerRef.current =
                                                                window.setTimeout(
                                                                    () => {
                                                                        startTransition(
                                                                            () =>
                                                                                setPhase(
                                                                                    "hidden"
                                                                                )
                                                                        )
                                                                    },
                                                                    Math.max(
                                                                        0,
                                                                        safeAfterFade
                                                                    ) * 1000
                                                                )
                                                        },
                                                        Math.max(
                                                            0,
                                                            safeAfterHold
                                                        ) * 1000
                                                    )
                                            }}
                                        />
                                    )
                            )}
                        </motion.g>
                    </g>
                )}
            </svg>
        </div>
    )
}

addPropertyControls(CalligraphySignature, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Your Signature",
    },
    fontPreset: {
        type: ControlType.Enum,
        title: "Font",
        defaultValue: "pinyon",
        options: ["pinyon", "allura", "dancingscript", "greatvibes", "custom"],
        optionTitles: [
            "Pinyon Script",
            "Allura",
            "Dancing Script",
            "Great Vibes",
            "Custom URL",
        ],
    },
    fontUrl: {
        type: ControlType.String,
        title: "Font URL",
        defaultValue:
            "https://raw.githubusercontent.com/google/fonts/main/ofl/pinyonscript/PinyonScript-Regular.ttf",
        placeholder: "https://…/font.ttf",
        description:
            "Paste a direct font file URL allowing CORS. Supported formats: .ttf, .otf, .woff, .woff2 (parsed by [OpenType.js](https://github.com/opentypejs/opentype.js)).",
        hidden: ({ fontPreset }) => fontPreset !== "custom",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 60,
        min: 8,
        max: 600,
        step: 1,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    strokeThickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 0.3,
        min: 0.1,
        max: 3,
        step: 0.05,
    },
    animationTime: {
        type: ControlType.Number,
        title: "Animation Time",
        defaultValue: 1.2,
        min: 0.2,
        max: 30,
        step: 0.1,
        unit: "s",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loopInterval: {
        type: ControlType.Number,
        title: "Loop Interval",
        defaultValue: 0.4,
        min: 0,
        max: 30,
        step: 0.1,
        unit: "s",
        hidden: ({ loop }) => !loop,
    },
    stayAfter: {
        type: ControlType.Boolean,
        title: "After",
        defaultValue: true,
        enabledTitle: "Stay",
        disabledTitle: "Disappear",
        hidden: ({ loop }) => !!loop,
    },
    afterHold: {
        type: ControlType.Number,
        title: "After Hold",
        defaultValue: 0.5,
        min: 0,
        max: 30,
        step: 0.1,
        unit: "s",
        hidden: ({ stayAfter, loop }) => !!stayAfter || !!loop,
    },
    afterFade: {
        type: ControlType.Number,
        title: "After Fade",
        defaultValue: 0.5,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: ({ stayAfter, loop }) => !!stayAfter || !!loop,
    },
    showGuide: {
        type: ControlType.Boolean,
        title: "Guide",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px",
    },
})
