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

import {
    motion,
    useScroll,
    useTransform,
    useMotionValue,
    useAnimationFrame,
} from "framer-motion"

type Mode = "3D" | "2D" | "Path Flow"
type DriveMode = "Auto" | "Scroll"
type RadiusMode = "Auto" | "Manual"
type EqualWidthMode = "Off" | "Auto" | "Manual"
type TextAlign = "Left" | "Center" | "Right"
type FitMode2D = "Off" | "Auto Radius" | "Auto Font"

const DEFAULT_FONT = {
    fontFamily: "Inter",
    fontSize: 26,
    fontWeight: 500,
    letterSpacing: 0,
    lineHeight: 1,
}

function toNumber(v: any, fallback: number) {
    if (typeof v === "number") return Number.isFinite(v) ? v : fallback
    if (typeof v === "string") {
        const n = parseFloat(v)
        return Number.isFinite(n) ? n : fallback
    }
    return fallback
}

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n))
}

function parseItems(text: string) {
    const raw = String(text || "")
        .split(/\n|,/g)
        .map((s) => s.trim())
        .filter(Boolean)
    return raw.length
        ? raw
        : ["Felicity", "Denouement", "Chatoyant", "Bungalow", "Aurora"]
}

function buildCanvasFont(f: any, fontSize: number) {
    const weight = f?.fontWeight ?? 400
    const style = f?.fontStyle ?? "normal"
    const family = f?.fontFamily ?? "Inter"
    return `${style} ${weight} ${fontSize}px ${family}`
}

function makeEllipsePath(size: number, rx: number, ry: number) {
    const cx = size / 2
    const cy = size / 2
    const x = cx - rx
    const y = cy
    return `M ${x} ${y} a ${rx} ${ry} 0 1 1 ${rx * 2} 0 a ${rx} ${ry} 0 1 1 -${
        rx * 2
    } 0`
}

function renderWordWithFirstChar(
    word: string,
    enabled: boolean,
    firstColor: string,
    normalColor: string
) {
    if (!enabled || !word) return word
    const first = word.charAt(0)
    const rest = word.slice(1)
    return (
        <>
            <span style={{ color: firstColor }}>{first}</span>
            <span style={{ color: normalColor }}>{rest}</span>
        </>
    )
}

function useStableMeasuredSize<T extends HTMLElement>() {
    const ref = React.useRef<T | null>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })
    const lastNonZero = React.useRef({ w: 0, h: 0 })

    React.useLayoutEffect(() => {
        const el = ref.current
        if (!el) return

        const update = (w: number, h: number) => {
            const ww = Math.round(w)
            const hh = Math.round(h)
            if (ww > 0 && hh > 0) {
                lastNonZero.current = { w: ww, h: hh }
                setSize({ w: ww, h: hh })
            } else if (lastNonZero.current.w > 0 && lastNonZero.current.h > 0) {
                setSize(lastNonZero.current)
            }
        }

        const ro = new ResizeObserver((entries) => {
            const cr = entries[0]?.contentRect
            if (!cr) return
            update(cr.width, cr.height)
        })
        ro.observe(el)

        let raf = 0
        let active = true
        const tick = () => {
            if (!active) return
            const r = el.getBoundingClientRect()
            update(r.width, r.height)
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        return () => {
            active = false
            ro.disconnect()
            cancelAnimationFrame(raf)
        }
    }, [])

    return [ref, size] as const
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CircularText(props: any) {
    const mode: Mode = props.mode ?? "3D"
    const drive: DriveMode = props.drive ?? "Auto"
    const radiusMode: RadiusMode = props.radiusMode ?? "Auto"
    const equalWidth: EqualWidthMode = props.equalWidth ?? "Auto"
    const align: TextAlign = props.align ?? "Center"

    const fit2D: FitMode2D =
        props.fit2D === "Auto Radius" ||
        props.fit2D === "Auto Font" ||
        props.fit2D === "Off"
            ? props.fit2D
            : "Auto Font"

    const radius2DMode: RadiusMode = props.radius2DMode ?? "Auto"
    const radius2D: number = toNumber(props.radius2D, 180)

    const words: string = props.words ?? ""
    const background: string = props.background ?? "transparent"

    const enableFirstCharColor: boolean = !!props.enableFirstCharColor
    const firstCharColor: string = props.firstCharColor ?? "#FF3B30"

    const speed: number = toNumber(props.speed, 10)
    const reverse: boolean = !!props.reverse
    const scrollFactor: number = toNumber(props.scrollFactor, 0.15)

    const font = props.font || DEFAULT_FONT
    const color: string = props.color ?? "#ffffff"

    // ✅ negative padding supported
    const padding: number = clamp(toNumber(props.padding, 0), -600, 600)

    const radius: number = toNumber(props.radius, 180)
    const startAngle: number = toNumber(props.startAngle, 0)

    const readableFlip: boolean = props.readableFlip !== false
    const itemWidth: number = toNumber(props.itemWidth, 220)

    const gap2D: number = clamp(toNumber(props.gap2D, 12), 0, 240)

    // Path Flow
    const flowText: string = props.flowText ?? ""
    const flowSpeed: number = toNumber(props.flowSpeed, 16)
    const flowReverse: boolean = !!props.flowReverse
    const flowStartOffset: number = clamp(
        toNumber(props.flowStartOffset, 0),
        -100,
        100
    )
    const flowRotate: number = toNumber(props.flowRotate, -40)
    const flowEllipse: boolean = props.flowEllipse !== false
    const flowRadiusX: number = toNumber(props.flowRadiusX, 190)
    const flowRadiusY: number = toNumber(props.flowRadiusY, 135)
    const flowTracking: number = clamp(toNumber(props.flowTracking, 0), 0, 20)
    const flowDuplicateGap: number = clamp(
        toNumber(props.flowDuplicateGap, 0),
        -50,
        50
    )
    const flowDepth: boolean = props.flowDepth !== false
    const flowDepthTilt: number = clamp(
        toNumber(props.flowDepthTilt, 65),
        0,
        85
    )
    const flowPerspective: number = clamp(
        toNumber(props.flowPerspective, 900),
        200,
        3000
    )

    const { style, className } = props

    const [wrapRef, measured] = useStableMeasuredSize<HTMLDivElement>()
    const measuredW = measured.w > 0 ? measured.w : 520
    const measuredH = measured.h > 0 ? measured.h : 520
    const ready = measuredW > 10 && measuredH > 10

    const outerSize = clamp(Math.min(measuredW, measuredH), 10, 4000)

    const mergedFont = { ...DEFAULT_FONT, ...(font || {}) }
    const baseFontSize = toNumber(mergedFont.fontSize, DEFAULT_FONT.fontSize)

    // ✅ AUTO SAFE INSET so overflow:hidden never clips the text
    const safeInset = React.useMemo(() => {
        const fontPad = baseFontSize * 1.15 + 10
        const negPadBoost = Math.max(0, -padding)
        return clamp(fontPad + negPadBoost, 0, 600)
    }, [baseFontSize, padding])

    const size = Math.max(10, outerSize - safeInset * 2)
    const pad = padding

    const items = React.useMemo(() => parseItems(words), [words])
    const total = Math.max(1, items.length)

    const dir = reverse ? -1 : 1

    // Sync rotation across Canvas/Preview
    const autoAngle = useMotionValue(0)
    useAnimationFrame(() => {
        if (!ready) return
        if (drive !== "Auto") return
        if (mode === "Path Flow") return
        const duration = Math.max(0.25, speed)
        const nowS = Date.now() / 1000
        const p = (nowS / duration) % 1
        autoAngle.set(p * 360 * dir)
    })

    const { scrollY } = useScroll()
    const scrollAngle = useTransform(scrollY, (v) => v * scrollFactor * dir)
    const rotateZ = drive === "Scroll" ? scrollAngle : autoAngle
    const startFrac = ((startAngle % 360) / 360 + 1) % 1

    // Canvas measure ctx
    const ctxMeasure = React.useMemo(() => {
        const ctx =
            typeof document !== "undefined"
                ? document.createElement("canvas").getContext("2d")
                : null
        return ctx
    }, [])

    // 3D radius
    const rAuto3D = React.useMemo(() => {
        const fs = baseFontSize
        return Math.max(10, size / 2 - fs * 1.25 - pad)
    }, [size, baseFontSize, pad])

    // 3D computed width
    const computedWidth = React.useMemo(() => {
        if (equalWidth === "Off") return 0
        if (equalWidth === "Manual") return clamp(itemWidth, 40, 2000)
        if (!ctxMeasure) return clamp(itemWidth, 40, 2000)

        ctxMeasure.font = buildCanvasFont(mergedFont, baseFontSize)
        let maxW = 0
        for (const word of items) {
            const ww = ctxMeasure.measureText(word).width
            if (ww > maxW) maxW = ww
        }
        return clamp(maxW + 8, 40, 2000)
    }, [equalWidth, itemWidth, items, ctxMeasure, mergedFont, baseFontSize])

    const justifyContent =
        align === "Left"
            ? "flex-start"
            : align === "Right"
              ? "flex-end"
              : "center"

    // ---------- 2D SMART LAYOUT ----------
    const pid = React.useId().replace(/:/g, "_")

    const { r2D, fontSize2D, circlePathD } = React.useMemo(() => {
        const minFont = 10
        let fs = baseFontSize

        const rAuto = Math.max(10, size / 2 - fs * 1.25 - pad)

        let rr =
            radius2DMode === "Manual"
                ? clamp(radius2D, 10, 5000)
                : clamp(rAuto, 10, 5000)

        const measureTotal = (fontSize: number) => {
            if (!ctxMeasure) return total * 60 + gap2D * total
            ctxMeasure.font = buildCanvasFont(mergedFont, fontSize)
            let sum = 0
            for (const w of items) sum += ctxMeasure.measureText(w).width
            sum += gap2D * total
            return sum
        }

        const circumference = (rad: number) => 2 * Math.PI * rad

        if (fit2D === "Auto Radius") {
            const needed = measureTotal(fs)
            const minR = Math.max(10, needed / (2 * Math.PI))
            rr = Math.max(rr, minR)
        } else if (fit2D === "Auto Font") {
            let tries = 0
            while (tries < 80) {
                const needed = measureTotal(fs)
                const avail = circumference(rr)
                if (needed <= avail) break
                fs = Math.max(minFont, fs - 1)
                tries++
            }
        }

        const cx = size / 2
        const cy = size / 2
        const pathD = `M ${cx}, ${cy} m -${rr}, 0 a ${rr},${rr} 0 1,1 ${
            rr * 2
        },0 a ${rr},${rr} 0 1,1 -${rr * 2},0`

        return { r2D: rr, fontSize2D: fs, circlePathD: pathD }
    }, [
        fit2D,
        baseFontSize,
        size,
        pad,
        ctxMeasure,
        mergedFont,
        items,
        total,
        gap2D,
        radius2DMode,
        radius2D,
    ])

    const wordOffsets2D = React.useMemo(() => {
        const circ = 2 * Math.PI * r2D

        const widths: number[] = []
        if (ctxMeasure) {
            ctxMeasure.font = buildCanvasFont(mergedFont, fontSize2D)
            for (const w of items) widths.push(ctxMeasure.measureText(w).width)
        } else {
            for (const _ of items) widths.push(60)
        }

        const totalLen = widths.reduce((a, b) => a + b, 0) + gap2D * total
        const startPx = (startAngle / 360) * circ

        let acc = 0
        const offsets: number[] = []
        for (let i = 0; i < total; i++) {
            const w = widths[i]
            const center = acc + w / 2
            const along = startPx + (center / totalLen) * circ
            const pct = ((along % circ) / circ) * 100
            offsets.push((pct + 100) % 100)
            acc += w + gap2D
        }
        return offsets
    }, [
        r2D,
        items,
        total,
        gap2D,
        startAngle,
        ctxMeasure,
        mergedFont,
        fontSize2D,
    ])

    // ---------- Path Flow ----------
    const flowPid = `${pid}_flow`

    const flowBaseText = React.useMemo(() => {
        const t = String(flowText || "").trim()
        if (t) return t
        return items.join(" • ") + " • "
    }, [flowText, items])

    const flowTextSpaced = React.useMemo(() => {
        if (flowTracking <= 0) return flowBaseText
        const spacer = "\u2009".repeat(Math.min(10, Math.floor(flowTracking)))
        return flowBaseText.split("").join(spacer)
    }, [flowBaseText, flowTracking])

    const flowPathD = React.useMemo(() => {
        const rxAuto = Math.max(10, size / 2 - baseFontSize * 1.25 - pad)
        const rx = flowEllipse ? clamp(flowRadiusX, 10, 4000) : rxAuto
        const ry = flowEllipse ? clamp(flowRadiusY, 10, 4000) : rxAuto
        return makeEllipsePath(size, rx, ry)
    }, [size, baseFontSize, pad, flowEllipse, flowRadiusX, flowRadiusY])

    const tp1Ref = React.useRef<SVGTextPathElement | null>(null)
    const tp2Ref = React.useRef<SVGTextPathElement | null>(null)

    useAnimationFrame(() => {
        if (!ready) return
        if (mode !== "Path Flow") return

        const dur = Math.max(1, flowSpeed)
        const nowS = Date.now() / 1000
        const p = (nowS / dur) % 1

        const d = flowReverse ? -1 : 1
        const a = flowStartOffset + 100 * p * d
        const b = a - 100 * d + flowDuplicateGap

        if (tp1Ref.current) tp1Ref.current.setAttribute("startOffset", `${a}%`)
        if (tp2Ref.current) tp2Ref.current.setAttribute("startOffset", `${b}%`)
    })

    const depthOn = mode === "Path Flow" && !!flowDepth
    const rotate2D = flowRotate

    const svgWord = (word: string) => {
        if (!enableFirstCharColor || !word) return word
        return (
            <>
                <tspan fill={firstCharColor}>{word.charAt(0)}</tspan>
                <tspan fill={color}>{word.slice(1)}</tspan>
            </>
        )
    }

    const flowTspans = React.useMemo(() => {
        if (!enableFirstCharColor) return null
        const parts = flowTextSpaced.split(/(\s+)/)
        return parts.map((p: string, i: number) => {
            if (!p) return null
            if (/^\s+$/.test(p)) {
                return (
                    <tspan key={i} fill={color}>
                        {p}
                    </tspan>
                )
            }
            return (
                <tspan key={i}>
                    <tspan fill={firstCharColor}>{p.charAt(0)}</tspan>
                    <tspan fill={color}>{p.slice(1)}</tspan>
                </tspan>
            )
        })
    }, [enableFirstCharColor, flowTextSpaced, firstCharColor, color])

    return (
        <div
            ref={wrapRef}
            className={className}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                // ✅ Keeps Marketplace preview clean (no seams)
                overflow: "hidden",

                // ✅ Background always fills full bounds
                background,

                boxSizing: "border-box",
                transform: "translateZ(0)",
                isolation: "isolate",
            }}
        >
            {!ready ? null : (
                <motion.div
                    style={{
                        width: size,
                        height: size,
                        position: "relative",
                        overflow: "visible",
                        rotateZ: mode === "Path Flow" ? 0 : rotateZ,
                        transformOrigin: "50% 50%",
                    }}
                >
                    {mode === "3D" ? (
                        items.map((word: string, i: number) => {
                            const frac = (i / total + startFrac) % 1
                            const deg = frac * 360
                            const needsFlip =
                                readableFlip && deg > 90 && deg < 270
                            const flip = needsFlip ? 180 : 0
                            const textRotation = -90 + flip

                            const transform = `
                                translate(-50%, -50%)
                                rotateZ(${deg}deg)
                                translateY(${-rAuto3D}px)
                                rotateZ(${textRotation}deg)
                            `

                            return (
                                <div
                                    key={i}
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        transform,
                                        transformOrigin: "50% 50%",
                                        color,
                                        ...mergedFont,
                                        fontSize: baseFontSize,
                                        userSelect: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent,
                                        width:
                                            equalWidth === "Off"
                                                ? "auto"
                                                : computedWidth,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {renderWordWithFirstChar(
                                        word,
                                        enableFirstCharColor,
                                        firstCharColor,
                                        color
                                    )}
                                </div>
                            )
                        })
                    ) : mode === "2D" ? (
                        <svg
                            width={size}
                            height={size}
                            viewBox={`0 0 ${size} ${size}`}
                            style={{ overflow: "visible", display: "block" }}
                        >
                            <defs>
                                <path id={`p_${pid}`} d={circlePathD} />
                            </defs>

                            {items.map((word: string, i: number) => (
                                <text
                                    key={i}
                                    fill={color}
                                    style={{
                                        ...mergedFont,
                                        fontSize: fontSize2D,
                                    }}
                                >
                                    <textPath
                                        href={`#p_${pid}`}
                                        startOffset={`${wordOffsets2D[i]}%`}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        {svgWord(word)}
                                    </textPath>
                                </text>
                            ))}
                        </svg>
                    ) : (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "visible",
                                perspective: depthOn
                                    ? `${flowPerspective}px`
                                    : undefined,
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <div
                                style={{
                                    width: size,
                                    height: size,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    overflow: "visible",
                                    transformStyle: "preserve-3d",
                                    transformOrigin: "50% 50%",
                                    transform: depthOn
                                        ? `rotate(${rotate2D}deg) rotateX(${flowDepthTilt}deg)`
                                        : `rotate(${rotate2D}deg)`,
                                    willChange: "transform",
                                }}
                            >
                                <svg
                                    width={size}
                                    height={size}
                                    viewBox={`0 0 ${size} ${size}`}
                                    style={{
                                        overflow: "visible",
                                        display: "block",
                                    }}
                                >
                                    <defs>
                                        <path id={flowPid} d={flowPathD} />
                                    </defs>

                                    <text
                                        fill={color}
                                        style={{
                                            ...mergedFont,
                                            fontSize: baseFontSize,
                                        }}
                                    >
                                        <textPath
                                            ref={tp1Ref}
                                            href={`#${flowPid}`}
                                            startOffset="0%"
                                            textAnchor="start"
                                            dominantBaseline="middle"
                                        >
                                            {enableFirstCharColor
                                                ? flowTspans
                                                : flowTextSpaced}
                                        </textPath>

                                        <textPath
                                            ref={tp2Ref}
                                            href={`#${flowPid}`}
                                            startOffset="-100%"
                                            textAnchor="start"
                                            dominantBaseline="middle"
                                        >
                                            {enableFirstCharColor
                                                ? flowTspans
                                                : flowTextSpaced}
                                        </textPath>
                                    </text>
                                </svg>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    )
}

CircularText.defaultProps = {
    width: 520,
    height: 520,

    mode: "3D",
    words: "Felicity\nDenouement\nChatoyant\nBungalow\nAurora\nLullaby\nLagoon\nLabyrinth\nIdyllic\nLadybird\nLagoon\nAurora",

    background: "transparent",

    enableFirstCharColor: false,
    firstCharColor: "#FF3B30",

    drive: "Auto",
    speed: 10,
    reverse: false,
    scrollFactor: 0.15,

    font: DEFAULT_FONT,
    color: "#ffffff",
    padding: 0,

    radiusMode: "Auto",
    radius: 180,
    startAngle: 0,

    readableFlip: true,
    equalWidth: "Auto",
    itemWidth: 220,
    align: "Center",

    gap2D: 12,
    fit2D: "Auto Font",
    radius2DMode: "Auto",
    radius2D: 180,

    flowText:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do • ",
    flowSpeed: 16,
    flowReverse: false,
    flowStartOffset: 0,
    flowRotate: -40,
    flowEllipse: true,
    flowRadiusX: 190,
    flowRadiusY: 135,
    flowTracking: 0,
    flowDuplicateGap: 0,

    flowDepth: true,
    flowDepthTilt: 65,
    flowPerspective: 900,
}

addPropertyControls(CircularText, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["3D", "2D", "Path Flow"],
        optionTitles: ["3D (Spokes)", "2D (Path)", "Path Flow"],
    },

    background: { type: ControlType.Color, title: "Background" },

    enableFirstCharColor: { type: ControlType.Boolean, title: "First Char" },
    firstCharColor: {
        type: ControlType.Color,
        title: "First Color",
        hidden: (p) => !p.enableFirstCharColor,
    },

    words: {
        type: ControlType.String,
        title: "Words",
        displayTextArea: true,
        hidden: (p) => p.mode === "Path Flow",
    },

    drive: {
        type: ControlType.Enum,
        title: "Drive",
        options: ["Auto", "Scroll"],
        hidden: (p) => p.mode === "Path Flow",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.5,
        max: 60,
        unit: "s",
        hidden: (p) => p.mode === "Path Flow",
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        hidden: (p) => p.mode === "Path Flow",
    },
    scrollFactor: {
        type: ControlType.Number,
        title: "Scroll",
        min: 0.01,
        max: 1,
        step: 0.01,
        hidden: (p) => p.mode === "Path Flow" || p.drive !== "Scroll",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: DEFAULT_FONT,
    },
    color: { type: ControlType.Color, title: "Text" },

    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: -600,
        max: 600,
        step: 1,
    },

    radiusMode: {
        type: ControlType.Enum,
        title: "Radius",
        options: ["Auto", "Manual"],
        hidden: (p) => p.mode === "Path Flow",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius Px",
        min: 40,
        max: 1400,
        step: 1,
        hidden: (p) => p.mode === "Path Flow" || p.radiusMode !== "Manual",
    },

    startAngle: {
        type: ControlType.Number,
        title: "Start",
        min: -180,
        max: 180,
        step: 1,
    },

    readableFlip: {
        type: ControlType.Boolean,
        title: "Readable",
        hidden: (p) => p.mode !== "3D",
    },
    equalWidth: {
        type: ControlType.Enum,
        title: "Equal W",
        options: ["Off", "Auto", "Manual"],
        hidden: (p) => p.mode !== "3D",
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 40,
        max: 1200,
        step: 1,
        hidden: (p) => p.mode !== "3D" || p.equalWidth !== "Manual",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["Left", "Center", "Right"],
        hidden: (p) => p.mode !== "3D" || p.equalWidth === "Off",
    },

    gap2D: {
        type: ControlType.Number,
        title: "2D Gap",
        min: 0,
        max: 240,
        step: 1,
        hidden: (p) => p.mode !== "2D",
    },
    fit2D: {
        type: ControlType.Enum,
        title: "2D Fit",
        options: ["Off", "Auto Radius", "Auto Font"],
        hidden: (p) => p.mode !== "2D",
    },

    radius2DMode: {
        type: ControlType.Enum,
        title: "2D Radius",
        options: ["Auto", "Manual"],
        hidden: (p) => p.mode !== "2D",
    },
    radius2D: {
        type: ControlType.Number,
        title: "2D Radius Px",
        min: 40,
        max: 2000,
        step: 1,
        hidden: (p) => p.mode !== "2D" || p.radius2DMode !== "Manual",
    },

    flowText: {
        type: ControlType.String,
        title: "Flow Text",
        displayTextArea: true,
        hidden: (p) => p.mode !== "Path Flow",
    },
    flowSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 1,
        max: 120,
        step: 1,
        unit: "s",
        hidden: (p) => p.mode !== "Path Flow",
    },
    flowReverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        hidden: (p) => p.mode !== "Path Flow",
    },
    flowStartOffset: {
        type: ControlType.Number,
        title: "Start %",
        min: -100,
        max: 100,
        step: 1,
        hidden: (p) => p.mode !== "Path Flow",
    },
    flowRotate: {
        type: ControlType.Number,
        title: "Rotate",
        min: -180,
        max: 180,
        step: 1,
        hidden: (p) => p.mode !== "Path Flow",
    },
    flowEllipse: {
        type: ControlType.Boolean,
        title: "Ellipse",
        hidden: (p) => p.mode !== "Path Flow",
    },
    flowRadiusX: {
        type: ControlType.Number,
        title: "Radius X",
        min: 40,
        max: 2000,
        step: 1,
        hidden: (p) => p.mode !== "Path Flow" || !p.flowEllipse,
    },
    flowRadiusY: {
        type: ControlType.Number,
        title: "Radius Y",
        min: 40,
        max: 2000,
        step: 1,
        hidden: (p) => p.mode !== "Path Flow" || !p.flowEllipse,
    },
    flowTracking: {
        type: ControlType.Number,
        title: "Tracking",
        min: 0,
        max: 20,
        step: 1,
        hidden: (p) => p.mode !== "Path Flow",
    },
    flowDuplicateGap: {
        type: ControlType.Number,
        title: "Gap",
        min: -50,
        max: 50,
        step: 1,
        hidden: (p) => p.mode !== "Path Flow",
    },

    flowDepth: {
        type: ControlType.Boolean,
        title: "Depth",
        hidden: (p) => p.mode !== "Path Flow",
    },
    flowDepthTilt: {
        type: ControlType.Number,
        title: "Tilt",
        min: 0,
        max: 85,
        step: 1,
        hidden: (p) => p.mode !== "Path Flow" || !p.flowDepth,
    },
    flowPerspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 200,
        max: 3000,
        step: 10,
        hidden: (p) => p.mode !== "Path Flow" || !p.flowDepth,
    },
})
