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

/**
 * CurvedTextPro
 *
 * Infinity Loop FIX (proper, finally):
 * • Infinity Loop animates ALONG the lemniscate path (letters follow the loop direction).
 * • No "hole" and no "slovo po slovo" because:
 *   1) Infinity uses a NEGATIVE startOffset range (supported by SVG) so the text wraps across the path start.
 *   2) Infinity guarantees massive overfill: reps computed from pathLen so string length >> path length.
 * • Direction control is disabled for Infinity Loop (locked to the correct direction).
 *
 * Open paths:
 * • Scroll via px startOffset on an extended path (leader + trailer) and a mask on the visible path.
 * • Direction stays available for open presets + open custom.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type TransformOp = "none" | "uppercase" | "lowercase" | "capitalize"
type ManualMode = "arc" | "wave" | "circle"
type AnimDir = "forward" | "backward"

type PresetKey =
    | "none"
    | "arch"
    | "stadium_wide"
    | "s_curve"
    | "diagonal"
    | "wave_single"
    | "wave_double"
    | "infinity_loop"

interface FontObject {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    fontStyle?: string
    letterSpacing?: number | string
    [key: string]: unknown
}

const PRESET_TYPO: Record<
    PresetKey,
    Partial<{
        fontSize: number
        fontWeight: string
        letterSpacing: number
        transform: TransformOp
    }>
> = {
    none: {},
    arch: { fontSize: 34, fontWeight: "700", letterSpacing: 1 },
    stadium_wide: {
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: 5,
        transform: "uppercase",
    },
    s_curve: { fontSize: 26, fontWeight: "400", letterSpacing: 0 },
    diagonal: { fontSize: 28, fontWeight: "600", letterSpacing: 2 },
    wave_single: { fontSize: 38, fontWeight: "800", letterSpacing: 0 },
    wave_double: { fontSize: 30, fontWeight: "900", letterSpacing: 1 },
    infinity_loop: { fontSize: 17, fontWeight: "700", letterSpacing: 2 },
}

const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n))
const safe = (v: unknown, fb: number): number => {
    const n = Number(v)
    return isFinite(n) ? n : fb
}
const parsePx = (v: unknown): number =>
    safe(typeof v === "string" ? parseFloat(v) : v, 0)

const SEP = "   ·   "
const EPS = 0.75

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y)

// Debounce helper for expensive operations
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState(value)
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

function useSize(ref: React.RefObject<HTMLDivElement>) {
    const [s, setS] = React.useState({ w: 400, h: 300 })
    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((es) => {
            const { width: w, height: h } = es[0].contentRect
            if (w > 0 && h > 0) setS({ w, h })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [ref])
    return s
}

function isPathClosed(pathEl: SVGPathElement | null) {
    if (!pathEl) return false
    let len = 0
    try {
        len = pathEl.getTotalLength()
    } catch {
        return false
    }
    if (!len) return false
    const sp = pathEl.getPointAtLength(0)
    const ep = pathEl.getPointAtLength(len)
    return dist(sp, ep) < EPS
}

function fullCircle(cx: number, cy: number, r: number) {
    const [lx, rx, y, rs] = [
        (cx - r).toFixed(2),
        (cx + r).toFixed(2),
        cy.toFixed(2),
        r.toFixed(2),
    ]
    return `M ${lx} ${y} A ${rs} ${rs} 0 1 1 ${rx} ${y} A ${rs} ${rs} 0 1 1 ${lx} ${y}`
}

function polar(cx: number, cy: number, r: number, deg: number) {
    const a = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(
    cx: number,
    cy: number,
    r: number,
    a1: number,
    a2: number,
    rev: boolean
) {
    const from = rev ? a2 : a1
    const to = rev ? a1 : a2
    let span = (to - from + 360) % 360
    if (!span) span = 359.5
    const s = polar(cx, cy, r, from)
    const e = polar(cx, cy, r, from + span)
    const rs = r.toFixed(2)
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${rs} ${rs} 0 ${span > 180 ? 1 : 0} 1 ${e.x.toFixed(
        2
    )} ${e.y.toFixed(2)}`
}

function wavePath(
    x0: number,
    cy: number,
    w: number,
    amp: number,
    freq: number,
    phDeg: number,
    steps: number
) {
    const ph = (phDeg * Math.PI) / 180
    const s = Math.max(80, Math.min(2000, Math.floor(steps)))
    const pts: string[] = []
    for (let i = 0; i <= s; i++) {
        const t = i / s
        const x = x0 + t * w
        pts.push(
            `${x.toFixed(1)},${(cy + Math.sin(t * Math.PI * 2 * freq + ph) * amp).toFixed(1)}`
        )
    }
    return `M ${pts.join(" L ")}`
}

function lemniscate(cx: number, cy: number, a: number) {
    const steps = 180
    const pts: string[] = []
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2
        const d = 1 + Math.sin(t) ** 2
        pts.push(
            `${(cx + (a * Math.cos(t)) / d).toFixed(1)},${(cy + (a * Math.sin(t) * Math.cos(t)) / d).toFixed(1)}`
        )
    }
    return `M ${pts.join(" L ")}`
}

function buildExtendedPath(
    visPath: SVGPathElement | null,
    pathD: string,
    ext: number
): string {
    if (!visPath || ext <= 0) return pathD
    let len = 0
    try {
        len = visPath.getTotalLength()
    } catch {
        return pathD
    }
    if (!len) return pathD

    const sp = visPath.getPointAtLength(0)
    const ep = visPath.getPointAtLength(len)

    const rest = pathD.replace(/^M\s*[-\d.eE+]+[\s,]+[-\d.eE+]+\s*/, "")
    return (
        `M ${(sp.x - ext).toFixed(2)} ${sp.y.toFixed(2)} ` +
        `L ${sp.x.toFixed(2)} ${sp.y.toFixed(2)} ` +
        rest +
        ` L ${(ep.x + ext).toFixed(2)} ${ep.y.toFixed(2)}`
    )
}

/* ─── Default values (single source of truth) ─── */
const DEFAULT_TEXT =
    "Designed to enhance flexibility · build strength · promote relaxation"
const DEFAULT_PRESET: PresetKey = "arch"
const DEFAULT_TYPOGRAPHY = {
    font: {} as FontObject,
    fill: "#111111",
    textTransform: "none" as TransformOp,
}
const DEFAULT_ANIMATION = {
    enabled: true,
    dir: "forward" as AnimDir,
    duration: 40,
}
const DEFAULT_STYLE = {
    strokeEnabled: false,
    strokeColor: "#ffffff",
    strokeWidth: 4,
    bgShow: false,
    bgColor: "#f5f0eb",
    bgPadding: 12,
}
const DEFAULT_PATH_CUSTOM = {
    manualMode: "arc" as ManualMode,
    arcRadius: 46,
    arcStartAngle: 210,
    arcEndAngle: 330,
    arcReverse: false,
    arcFullCircle: false,
    circleRadius: 42,
    waveAmplitude: 28,
    waveFrequency: 1.5,
    wavePhase: 0,
    waveBaseline: 50,
    waveXPad: 2,
    waveSamples: 700,
}

export default function CurvedTextPro({
    text = DEFAULT_TEXT,
    preset = DEFAULT_PRESET,
    typography = DEFAULT_TYPOGRAPHY,
    animation = DEFAULT_ANIMATION,
    style = DEFAULT_STYLE,
    pathCustom = DEFAULT_PATH_CUSTOM,
}: {
    text?: string
    preset?: PresetKey
    typography?: {
        font?: FontObject
        fill?: string
        textTransform?: TransformOp
    }
    animation?: { enabled?: boolean; dir?: AnimDir; duration?: number }
    style?: {
        strokeEnabled?: boolean
        strokeColor?: string
        strokeWidth?: number
        bgShow?: boolean
        bgColor?: string
        bgPadding?: number
    }
    pathCustom?: {
        manualMode?: ManualMode
        arcRadius?: number
        arcStartAngle?: number
        arcEndAngle?: number
        arcReverse?: boolean
        arcFullCircle?: boolean
        circleRadius?: number
        waveAmplitude?: number
        waveFrequency?: number
        wavePhase?: number
        waveBaseline?: number
        waveXPad?: number
        waveSamples?: number
    }
}) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const visPathRef = React.useRef<SVGPathElement>(null)
    const textPathRef = React.useRef<SVGTextPathElement>(null)
    const measureRef = React.useRef<SVGTextElement>(null)

    const rafRef = React.useRef<number>(0)
    const offsetRef = React.useRef<number>(0)
    const prevPreset = React.useRef<PresetKey>(preset)
    const fontLoadedRef = React.useRef<boolean>(false)
    const lastMeasureTime = React.useRef<number>(0)

    const [tileLen, setTileLen] = React.useState<number>(800)
    const [pathLen, setPathLen] = React.useState<number>(0)
    const [extPathD, setExtPathD] = React.useState<string>("")
    const [closedPath, setClosedPath] = React.useState<boolean>(false)

    const { w, h } = useSize(containerRef)
    const isInView = useInView(containerRef, { amount: 0, once: false })
    const isPreview = RenderTarget.current() === RenderTarget.preview

    const debouncedW = useDebounce(w, 100)
    const debouncedH = useDebounce(h, 100)

    const visPathId = React.useId()
    const extPathId = React.useId()
    const maskId = React.useId()

    const font = typography?.font ?? {}
    const fill = typography?.fill ?? DEFAULT_TYPOGRAPHY.fill
    const textTransform =
        typography?.textTransform ?? DEFAULT_TYPOGRAPHY.textTransform
    const animEnabled = animation?.enabled ?? DEFAULT_ANIMATION.enabled
    const animDir = animation?.dir ?? DEFAULT_ANIMATION.dir
    const animDuration = Math.max(
        4,
        safe(animation?.duration, DEFAULT_ANIMATION.duration)
    )

    const pt = PRESET_TYPO[preset] ?? {}
    const fontFamily = String(font?.fontFamily ?? "Inter, sans-serif")
    const fontStyleV = String(font?.fontStyle ?? "normal")
    const fontSize = clamp(
        pt.fontSize != null ? pt.fontSize : parsePx(font?.fontSize) || 28,
        4,
        400
    )
    const fontWeight =
        pt.fontWeight != null
            ? pt.fontWeight
            : String(font?.fontWeight ?? "600")
    const letterSp =
        pt.letterSpacing != null
            ? pt.letterSpacing
            : parsePx(font?.letterSpacing)
    const resolvedTx = (pt.transform ?? textTransform) as TransformOp

    const bgPadding = clamp(
        safe(style?.bgPadding, DEFAULT_STYLE.bgPadding),
        0,
        80
    )
    const dy = fontSize * 0.23
    const bgStrokeWidth = fontSize * 0.96 + bgPadding * 2
    const strokeW = style?.strokeEnabled
        ? clamp(safe(style?.strokeWidth, DEFAULT_STYLE.strokeWidth), 0.5, 40)
        : 0

    const safetyMargin = clamp(
        fontSize * 0.9 +
            (style?.bgShow ? bgStrokeWidth / 2 : 0) +
            strokeW * 1.25,
        6,
        220
    )
    const safeW = Math.max(1, debouncedW - safetyMargin * 2)
    const safeH = Math.max(1, debouncedH - safetyMargin * 2)
    const cx = debouncedW / 2
    const cy = debouncedH / 2

    const baseText = React.useMemo(() => {
        const b = text ?? ""
        switch (resolvedTx) {
            case "uppercase":
                return b.toUpperCase()
            case "lowercase":
                return b.toLowerCase()
            case "capitalize":
                return b.replace(/\b\w/g, (c) => c.toUpperCase())
            default:
                return b
        }
    }, [text, resolvedTx])

    const textStyle: React.CSSProperties = {
        fontFamily,
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight as React.CSSProperties["fontWeight"],
        fontStyle: fontStyleV,
        letterSpacing: `${letterSp}px`,
    }

    const pathD = React.useMemo(() => {
        const arch = () =>
            `M ${(debouncedW * 0.02).toFixed(1)} ${(debouncedH * 0.78).toFixed(1)} Q ${(debouncedW / 2).toFixed(1)} ${(
                debouncedH * 0.12
            ).toFixed(
                1
            )} ${(debouncedW * 0.98).toFixed(1)} ${(debouncedH * 0.78).toFixed(1)}`

        const stadium = () =>
            `M ${(debouncedW * 0.02).toFixed(1)} ${(debouncedH * 0.72).toFixed(1)} Q ${(debouncedW / 2).toFixed(1)} ${(
                debouncedH * 0.1
            ).toFixed(
                1
            )} ${(debouncedW * 0.98).toFixed(1)} ${(debouncedH * 0.72).toFixed(1)}`

        const sCurve = () =>
            `M ${(debouncedW * 0.02).toFixed(1)} ${(debouncedH * 0.78).toFixed(1)} C ${(debouncedW * 0.15).toFixed(1)} ${(
                debouncedH * 0.78
            ).toFixed(
                1
            )},${(debouncedW * 0.38).toFixed(1)} ${(debouncedH * 0.1).toFixed(1)},${(debouncedW * 0.5).toFixed(1)} ${(
                debouncedH * 0.44
            ).toFixed(
                1
            )} S ${(debouncedW * 0.88).toFixed(1)} ${(debouncedH * 0.9).toFixed(1)},${(debouncedW * 0.98).toFixed(1)} ${(debouncedH * 0.22).toFixed(1)}`

        const diagonal = () =>
            `M ${(debouncedW * 0.02).toFixed(1)} ${(debouncedH * 0.92).toFixed(1)} C ${(debouncedW * 0.28).toFixed(1)} ${(
                debouncedH * 0.86
            ).toFixed(
                1
            )},${(debouncedW * 0.62).toFixed(1)} ${(debouncedH * 0.18).toFixed(1)},${(debouncedW * 0.98).toFixed(1)} ${(debouncedH * 0.08).toFixed(1)}`

        const wavePreset = (freq: number, ampPct: number) => {
            const amp = safeH * clamp(ampPct / 100, 0.02, 0.48)
            const y =
                debouncedH *
                clamp(
                    safe(
                        pathCustom?.waveBaseline,
                        DEFAULT_PATH_CUSTOM.waveBaseline
                    ) / 100,
                    0.05,
                    0.95
                )
            const pad =
                clamp(
                    safe(pathCustom?.waveXPad, DEFAULT_PATH_CUSTOM.waveXPad),
                    0,
                    20
                ) / 100
            const x0 = debouncedW * pad
            const ww = debouncedW * (1 - pad * 2)
            const samples = Math.min(
                clamp(
                    safe(
                        pathCustom?.waveSamples,
                        DEFAULT_PATH_CUSTOM.waveSamples
                    ),
                    120,
                    1800
                ),
                200
            )
            const phase = clamp(
                safe(pathCustom?.wavePhase, DEFAULT_PATH_CUSTOM.wavePhase),
                0,
                360
            )
            return wavePath(
                x0,
                y,
                ww,
                amp,
                clamp(freq, 0.25, 6),
                phase,
                samples
            )
        }

        if (preset === "arch") return arch()
        if (preset === "stadium_wide") return stadium()
        if (preset === "s_curve") return sCurve()
        if (preset === "diagonal") return diagonal()
        if (preset === "wave_single") return wavePreset(1, 36)
        if (preset === "wave_double") return wavePreset(2, 28)

        if (preset === "infinity_loop") {
            const a = Math.max(10, Math.min(safeW * 0.42, safeH * 0.48))
            return lemniscate(cx, cy, a)
        }

        const m = (pathCustom?.manualMode ??
            DEFAULT_PATH_CUSTOM.manualMode) as ManualMode

        if (m === "circle") {
            const rPct =
                clamp(
                    safe(
                        pathCustom?.circleRadius,
                        DEFAULT_PATH_CUSTOM.circleRadius
                    ),
                    5,
                    95
                ) / 100
            const r = Math.max(6, Math.min(safeW, safeH) * 0.5 * rPct)
            return fullCircle(cx, cy, r)
        }

        if (m === "arc") {
            const full = !!pathCustom?.arcFullCircle
            const rPct =
                clamp(
                    safe(pathCustom?.arcRadius, DEFAULT_PATH_CUSTOM.arcRadius),
                    5,
                    95
                ) / 100
            const r = Math.max(6, Math.min(safeW, safeH) * 0.5 * rPct)
            if (full) return fullCircle(cx, cy, r)

            const a1 = clamp(
                safe(
                    pathCustom?.arcStartAngle,
                    DEFAULT_PATH_CUSTOM.arcStartAngle
                ),
                0,
                360
            )
            const a2 = clamp(
                safe(pathCustom?.arcEndAngle, DEFAULT_PATH_CUSTOM.arcEndAngle),
                0,
                360
            )
            const rev = !!pathCustom?.arcReverse
            return arcPath(cx, cy, r, a1, a2, rev)
        }

        const ampPct = clamp(
            safe(pathCustom?.waveAmplitude, DEFAULT_PATH_CUSTOM.waveAmplitude),
            2,
            48
        )
        const freq = clamp(
            safe(pathCustom?.waveFrequency, DEFAULT_PATH_CUSTOM.waveFrequency),
            0.25,
            6
        )
        const amp = safeH * clamp(ampPct / 100, 0.02, 0.48)
        const y =
            debouncedH *
            clamp(
                safe(
                    pathCustom?.waveBaseline,
                    DEFAULT_PATH_CUSTOM.waveBaseline
                ) / 100,
                0.05,
                0.95
            )
        const pad =
            clamp(
                safe(pathCustom?.waveXPad, DEFAULT_PATH_CUSTOM.waveXPad),
                0,
                20
            ) / 100
        const x0 = debouncedW * pad
        const ww = debouncedW * (1 - pad * 2)
        const samples = Math.min(
            clamp(
                safe(pathCustom?.waveSamples, DEFAULT_PATH_CUSTOM.waveSamples),
                120,
                1800
            ),
            200
        )
        const phase = clamp(
            safe(pathCustom?.wavePhase, DEFAULT_PATH_CUSTOM.wavePhase),
            0,
            360
        )
        return wavePath(x0, y, ww, amp, freq, phase, samples)
    }, [preset, debouncedW, debouncedH, cx, cy, safeW, safeH, pathCustom])

    const doMeasure = React.useCallback(() => {
        const now = Date.now()
        if (now - lastMeasureTime.current < 50) return false
        lastMeasureTime.current = now

        const el = measureRef.current as SVGTextContentElement | null
        if (!el) return false
        try {
            const tl = el.getComputedTextLength()
            if (tl > 0) {
                setTileLen(tl)
                fontLoadedRef.current = true
                return true
            }
        } catch {
            return false
        }
        return false
    }, [])

    React.useEffect(() => {
        if (fontLoadedRef.current && doMeasure()) return

        const anyDoc = document as any
        const fontsReady: Promise<any> | undefined = anyDoc?.fonts?.ready
        if (
            fontsReady &&
            typeof fontsReady.then === "function" &&
            !fontLoadedRef.current
        ) {
            fontsReady
                .then(() => requestAnimationFrame(() => doMeasure()))
                .catch(() => {})
            return
        }
        const t = window.setTimeout(() => doMeasure(), 80)
        return () => window.clearTimeout(t)
    }, [baseText, fontSize, fontWeight, fontFamily, letterSp, doMeasure])

    React.useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const vp = visPathRef.current
            const closed = isPathClosed(vp)
            setClosedPath(closed)

            let len = 0
            try {
                len = vp?.getTotalLength?.() ?? 0
            } catch {
                len = 0
            }
            setPathLen(len)

            const d = closed ? pathD : buildExtendedPath(vp, pathD, tileLen)
            setExtPathD(d || pathD)
        })
        return () => cancelAnimationFrame(frame)
    }, [pathD, tileLen, w, h])

    const isInfinity = preset === "infinity_loop"
    const isClosedCustom =
        preset === "none" &&
        (pathCustom?.manualMode === "circle" ||
            (pathCustom?.manualMode === "arc" && !!pathCustom?.arcFullCircle))

    const closedLocked = isInfinity || isClosedCustom

    const reps = React.useMemo(() => {
        const tl = Math.max(1, tileLen)
        const pl = Math.max(1, pathLen || Math.max(debouncedW, debouncedH) * 3)

        if (closedPath) {
            const min = isInfinity ? 30 : 20
            const need = pl * 2 + tl * 4
            return Math.max(min, Math.ceil(need / tl) + 6)
        }

        const minOpen = 15
        const needOpen = pl + tl * 8
        return Math.max(minOpen, Math.ceil(needOpen / tl) + 6)
    }, [tileLen, pathLen, debouncedW, debouncedH, closedPath, isInfinity])

    const tiledText = React.useMemo(
        () =>
            Array(reps)
                .fill(baseText + SEP)
                .join(""),
        [reps, baseText]
    )

    React.useLayoutEffect(() => {
        if (prevPreset.current === preset) return
        prevPreset.current = preset
        cancelAnimationFrame(rafRef.current)
        offsetRef.current = 0
        textPathRef.current?.setAttribute("startOffset", "0")
    }, [preset])

    React.useEffect(() => {
        cancelAnimationFrame(rafRef.current)
        const tp = textPathRef.current
        if (!tp) return

        if (!animEnabled || !isInView || !isPreview) {
            tp.setAttribute("startOffset", "0")
            return
        }

        const tl = Math.max(1, tileLen)

        if (closedPath && closedLocked) {
            const dir = -1
            const speedPx = tl / (animDuration * 60)
            offsetRef.current = 0
            let lastTime = performance.now()

            const tick = (currentTime: number) => {
                const delta = currentTime - lastTime
                if (delta < 16) {
                    rafRef.current = requestAnimationFrame(tick)
                    return
                }
                lastTime = currentTime
                offsetRef.current += dir * speedPx
                if (offsetRef.current <= -tl) offsetRef.current += tl
                if (offsetRef.current > 0) offsetRef.current -= tl
                tp.setAttribute("startOffset", offsetRef.current.toFixed(2))
                rafRef.current = requestAnimationFrame(tick)
            }

            rafRef.current = requestAnimationFrame(tick)
            return () => cancelAnimationFrame(rafRef.current)
        }

        const dir = animDir === "forward" ? -1 : 1
        const speedPx = tl / (animDuration * 60)
        offsetRef.current = 0
        let lastTime = performance.now()

        const tick = (currentTime: number) => {
            const delta = currentTime - lastTime
            if (delta < 16) {
                rafRef.current = requestAnimationFrame(tick)
                return
            }
            lastTime = currentTime
            offsetRef.current = (offsetRef.current + dir * speedPx + tl) % tl
            tp.setAttribute("startOffset", offsetRef.current.toFixed(2))
            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, [
        animEnabled,
        animDuration,
        animDir,
        tileLen,
        closedPath,
        closedLocked,
        isInView,
        isPreview,
    ])

    const maskStrokeWidth = clamp(
        bgStrokeWidth + strokeW * 2 + fontSize * 2.6,
        fontSize * 2.6,
        2200
    )

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "visible",
                willChange:
                    animEnabled && isInView && isPreview ? "transform" : "auto",
            }}
        >
            {w > 0 && (
                <svg
                    width={w}
                    height={h}
                    viewBox={`0 0 ${w} ${h}`}
                    style={{
                        display: "block",
                        overflow: "visible",
                        willChange:
                            animEnabled && isInView && isPreview
                                ? "transform"
                                : "auto",
                    }}
                    aria-label={text}
                >
                    <defs>
                        <path ref={visPathRef} id={visPathId} d={pathD} />
                        <path id={extPathId} d={extPathD || pathD} />

                        {pathD && (
                            <mask id={maskId} maskUnits="userSpaceOnUse">
                                <rect
                                    x="0"
                                    y="0"
                                    width={w}
                                    height={h}
                                    fill="black"
                                />
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="white"
                                    strokeWidth={maskStrokeWidth}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </mask>
                        )}
                    </defs>

                    <text
                        ref={measureRef}
                        style={{ ...textStyle, visibility: "hidden" }}
                        x="0"
                        y="-9999"
                        aria-hidden="true"
                    >
                        {baseText + SEP}
                    </text>

                    {style?.bgShow && (
                        <path
                            d={pathD}
                            fill="none"
                            stroke={style.bgColor}
                            strokeWidth={bgStrokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    <text
                        dy={dy}
                        style={{
                            ...textStyle,
                            willChange:
                                animEnabled && isInView && isPreview
                                    ? "transform"
                                    : "auto",
                        }}
                        fill={fill}
                        stroke={
                            style?.strokeEnabled ? style.strokeColor : "none"
                        }
                        strokeWidth={style?.strokeEnabled ? strokeW : 0}
                        paintOrder={
                            style?.strokeEnabled ? "stroke fill" : undefined
                        }
                        textAnchor="start"
                        mask={pathD ? `url(#${maskId})` : undefined}
                    >
                        <textPath
                            ref={textPathRef}
                            href={`#${extPathId}`}
                            startOffset="0"
                            method="align"
                            spacing="auto"
                        >
                            {tiledText}
                        </textPath>
                    </text>
                </svg>
            )}
        </div>
    )
}

CurvedTextPro.defaultProps = {
    text: DEFAULT_TEXT,
    preset: DEFAULT_PRESET,
    typography: DEFAULT_TYPOGRAPHY,
    animation: DEFAULT_ANIMATION,
    style: DEFAULT_STYLE,
    pathCustom: DEFAULT_PATH_CUSTOM,
}

addPropertyControls(CurvedTextPro, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: DEFAULT_TEXT,
    },

    preset: {
        type: ControlType.Enum,
        title: "Preset",
        defaultValue: DEFAULT_PRESET,
        options: [
            "none",
            "arch",
            "stadium_wide",
            "s_curve",
            "diagonal",
            "wave_single",
            "wave_double",
            "infinity_loop",
        ] as PresetKey[],
        optionTitles: [
            "— Custom —",
            "Arch",
            "Stadium Wide",
            "S Curve",
            "Diagonal",
            "Wave · Single",
            "Wave · Double",
            "Infinity Loop",
        ],
    },

    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            // @ts-ignore
            font: {
                // @ts-ignore
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                displayFontSize: true,
                displayTextAlignment: false,
                defaultValue: {
                    fontSize: 28,
                    variant: "Semibold",
                    letterSpacing: "0px",
                },
            },
            fill: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: DEFAULT_TYPOGRAPHY.fill,
            },
            textTransform: {
                type: ControlType.Enum,
                title: "Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: DEFAULT_TYPOGRAPHY.textTransform,
            },
        },
    },

    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Animate",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: DEFAULT_ANIMATION.enabled,
            },
            dir: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["forward", "backward"] as AnimDir[],
                optionTitles: ["→", "←"],
                displaySegmentedControl: true,
                defaultValue: DEFAULT_ANIMATION.dir,
                hidden: (p: any) => !p.enabled,
            },
            duration: {
                type: ControlType.Number,
                title: "Speed",
                min: 4,
                max: 120,
                step: 2,
                unit: "s",
                description: "Seconds per cycle. Higher = slower.",
                defaultValue: DEFAULT_ANIMATION.duration,
                hidden: (p: any) => !p.enabled,
            },
        },
    },

    style: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            bgShow: {
                type: ControlType.Boolean,
                title: "Background",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: DEFAULT_STYLE.bgShow,
            },
            bgColor: {
                type: ControlType.Color,
                title: "BG Color",
                defaultValue: DEFAULT_STYLE.bgColor,
                hidden: (p: any) => !p.bgShow,
            },
            bgPadding: {
                type: ControlType.Number,
                title: "BG Padding",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: DEFAULT_STYLE.bgPadding,
                hidden: (p: any) => !p.bgShow,
            },

            strokeEnabled: {
                type: ControlType.Boolean,
                title: "Stroke",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: DEFAULT_STYLE.strokeEnabled,
            },
            strokeColor: {
                type: ControlType.Color,
                title: "Stroke Color",
                defaultValue: DEFAULT_STYLE.strokeColor,
                hidden: (p: any) => !p.strokeEnabled,
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Stroke Width",
                min: 0.5,
                max: 40,
                step: 0.5,
                defaultValue: DEFAULT_STYLE.strokeWidth,
                hidden: (p: any) => !p.strokeEnabled,
            },
        },
    },

    pathCustom: {
        type: ControlType.Object,
        title: "Path Settings",
        hidden: (p: any) => p.preset !== "none",
        controls: {
            manualMode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["arc", "circle", "wave"] as ManualMode[],
                optionTitles: ["Arc", "Circle", "Wave"],
                displaySegmentedControl: true,
                defaultValue: DEFAULT_PATH_CUSTOM.manualMode,
            },

            arcFullCircle: {
                type: ControlType.Boolean,
                title: "Full Circle",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: DEFAULT_PATH_CUSTOM.arcFullCircle,
                hidden: (p: any) => p.manualMode !== "arc",
            },
            arcRadius: {
                type: ControlType.Number,
                title: "Radius %",
                min: 5,
                max: 95,
                step: 1,
                unit: "%",
                defaultValue: DEFAULT_PATH_CUSTOM.arcRadius,
                hidden: (p: any) => p.manualMode !== "arc",
            },
            arcStartAngle: {
                type: ControlType.Number,
                title: "Start °",
                min: 0,
                max: 360,
                step: 1,
                defaultValue: DEFAULT_PATH_CUSTOM.arcStartAngle,
                hidden: (p: any) => p.manualMode !== "arc" || p.arcFullCircle,
            },
            arcEndAngle: {
                type: ControlType.Number,
                title: "End °",
                min: 0,
                max: 360,
                step: 1,
                defaultValue: DEFAULT_PATH_CUSTOM.arcEndAngle,
                hidden: (p: any) => p.manualMode !== "arc" || p.arcFullCircle,
            },
            arcReverse: {
                type: ControlType.Boolean,
                title: "Reverse",
                defaultValue: DEFAULT_PATH_CUSTOM.arcReverse,
                hidden: (p: any) => p.manualMode !== "arc" || p.arcFullCircle,
            },

            circleRadius: {
                type: ControlType.Number,
                title: "Radius %",
                min: 5,
                max: 95,
                step: 1,
                unit: "%",
                defaultValue: DEFAULT_PATH_CUSTOM.circleRadius,
                hidden: (p: any) => p.manualMode !== "circle",
            },

            waveBaseline: {
                type: ControlType.Number,
                title: "Baseline %",
                min: 5,
                max: 95,
                step: 1,
                unit: "%",
                defaultValue: DEFAULT_PATH_CUSTOM.waveBaseline,
                hidden: (p: any) => p.manualMode !== "wave",
            },
            waveAmplitude: {
                type: ControlType.Number,
                title: "Amplitude %",
                min: 2,
                max: 48,
                step: 1,
                unit: "%",
                defaultValue: DEFAULT_PATH_CUSTOM.waveAmplitude,
                hidden: (p: any) => p.manualMode !== "wave",
            },
            waveFrequency: {
                type: ControlType.Number,
                title: "Frequency",
                min: 0.25,
                max: 6,
                step: 0.25,
                defaultValue: DEFAULT_PATH_CUSTOM.waveFrequency,
                hidden: (p: any) => p.manualMode !== "wave",
            },
            wavePhase: {
                type: ControlType.Number,
                title: "Phase °",
                min: 0,
                max: 360,
                step: 1,
                defaultValue: DEFAULT_PATH_CUSTOM.wavePhase,
                hidden: (p: any) => p.manualMode !== "wave",
            },
            waveXPad: {
                type: ControlType.Number,
                title: "X Padding %",
                min: 0,
                max: 20,
                step: 0.5,
                unit: "%",
                defaultValue: DEFAULT_PATH_CUSTOM.waveXPad,
                hidden: (p: any) => p.manualMode !== "wave",
            },
            waveSamples: {
                type: ControlType.Number,
                title: "Samples",
                min: 120,
                max: 1800,
                step: 20,
                defaultValue: DEFAULT_PATH_CUSTOM.waveSamples,
                hidden: (p: any) => p.manualMode !== "wave",
            },
        },
    },
    _contact: {
        type: ControlType.Link,
        title: "Need help?",
        defaultValue: "zlatkomarjanovic.zm@gmail.com",
    },
})
