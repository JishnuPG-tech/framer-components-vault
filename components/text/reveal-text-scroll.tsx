import * as React from "react"
import { useRef, useLayoutEffect, useState, useEffect, useMemo } from "react"
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
    useSpring,
    useTransform,
    useMotionValue,
    mix,
} from "framer-motion"

type OffsetOption = "None" | "Bottom" | "Top" | "Left" | "Right"
type EffectOption =
    | "None"
    | "Blur"
    | "Color Morph"
    | "Scramble"
    | "Typewriter"
    | "Kerning Tighten"
    | "Chromatic Aberration"

type KineticAnimMode =
    | "ring"
    | "cube"
    | "wave"
    | "tunnel"
    | "vertical"
    | "classic"
    | "helix"
    | "snake"
    | "vortex"
    | "figure8"
    | "globe"
    | "mobius"
    | "heart"
    | "knot"
    | "stairs"
    | "galaxy"
    | "ribbon"
    | "flower"
    | "hourglass"
    | "lissajous"

export default function Reveal_Text_Ultra(props: {
    // Top Level Toggle
    kineticMode: boolean

    // Shared
    text: string
    fontFamily?: { fontFamily?: string; fontWeight?: number }
    fontSize: number
    color: string
    letterSpacing: number
    textAlign: "left" | "center" | "right"

    // --- DOM Scroll Props ---
    lineHeight: number
    revealStart: number
    revealEnd: number
    edgePct: number
    directionPreset: string
    repeatReveal: boolean
    offsetFrom: OffsetOption
    effect: EffectOption
    blurPx: number
    fromColor: string
    toColor: string
    morphStart: number
    morphEnd: number
    scrambleSpeed: number
    scrambleCharset: string
    scrambleSeed: number
    typeCaretOn: boolean
    caretBlinkMs: number
    lsFromPx: number
    caMaxPx: number
    caOpacity: number
    caBlend: "screen" | "normal"

    // --- Kinetic Canvas Props ---
    kineticModeType: KineticAnimMode
    kineticMultipleText: boolean
    kineticInverseText: boolean
    kineticAutoScale: boolean
    kineticBaseWidth: number
    kineticSpeed: number
    kineticRadius: number
    kineticStagger: number
    kineticFocal: number
    kineticDisableDepth: boolean
    kineticRotSpeed: number
    kineticRotStagger: number
    kineticEchoCount: number
    kineticEchoGap: number
    kineticEchoFade: number
    kineticStopAnimation: boolean
    kineticLogo?: string
    kineticLogoSize: number
}) {
    const {
        kineticMode,
        text,
        fontFamily,
        fontSize,
        color,
        letterSpacing,
        textAlign,

        // DOM specific
        lineHeight,
        revealStart,
        revealEnd,
        edgePct,
        directionPreset,
        repeatReveal,
        offsetFrom,
        effect,
        blurPx,
        fromColor,
        toColor,
        morphStart,
        morphEnd,
        scrambleSpeed,
        scrambleCharset,
        scrambleSeed,
        typeCaretOn,
        caretBlinkMs,
        lsFromPx,
        caMaxPx,
        caOpacity,
        caBlend,

        // Kinetic specific
        kineticModeType,
        kineticMultipleText,
        kineticInverseText,
        kineticAutoScale,
        kineticBaseWidth,
        kineticSpeed,
        kineticRadius,
        kineticStagger,
        kineticFocal,
        kineticDisableDepth,
        kineticRotSpeed,
        kineticRotStagger,
        kineticEchoCount,
        kineticEchoGap,
        kineticEchoFade,
        kineticStopAnimation,
        kineticLogo,
        kineticLogoSize,
    } = props

    const rootRef = useRef<HTMLDivElement | null>(null)

    // ==========================================
    // MODULE 1: DOM SCROLL LOGIC
    // ==========================================
    const pRef = useRef<HTMLParagraphElement | null>(null)
    const [measuredH, setMeasuredH] = useState<number | undefined>(undefined)

    useLayoutEffect(() => {
        if (kineticMode) return
        const el = pRef.current
        if (!el) return
        const read = () => {
            const paddingOffset = fontSize * 0.8
            setMeasuredH(Math.max(0, el.scrollHeight - paddingOffset))
        }
        const ro = new ResizeObserver(read)
        ro.observe(el)
        read()
        return () => ro.disconnect()
    }, [
        kineticMode,
        text,
        fontSize,
        lineHeight,
        letterSpacing,
        fontFamily?.fontFamily,
        fontFamily?.fontWeight,
    ])

    const { scrollYProgress } = useScroll({
        target: rootRef,
        offset: [`start ${revealStart}`, `start ${revealEnd}`],
    })
    const smooth = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 30,
        mass: 0.25,
    })

    const maskProg = useMotionValue(0)
    const offsetProg = useMotionValue(0)

    useEffect(() => {
        if (kineticMode) return
        if (repeatReveal) {
            const u = smooth.on("change", (v) => {
                maskProg.set(v)
                offsetProg.set(v)
            })
            return () => u()
        } else {
            let cm = maskProg.get(),
                co = offsetProg.get()
            const u = smooth.on("change", (v) => {
                cm = Math.max(cm, v)
                co = Math.max(co, v)
                maskProg.set(cm)
                offsetProg.set(co)
            })
            return () => u()
        }
    }, [smooth, repeatReveal, kineticMode])

    const visiblePct = useTransform(maskProg, [0, 1], [0, 100])

    const edgePctMV = useMotionValue(edgePct)
    const dirMV = useMotionValue(directionPreset)
    const offsetFromMV = useMotionValue(offsetFrom)
    const effectMV = useMotionValue(effect)
    const blurPxMV = useMotionValue(blurPx)
    const colorMV = useMotionValue(color)
    const fromColorMV = useMotionValue(fromColor)
    const toColorMV = useMotionValue(toColor)
    const morphStartMV = useMotionValue(morphStart)
    const morphEndMV = useMotionValue(morphEnd)
    const lsFromPxMV = useMotionValue(lsFromPx)
    const letterSpacingMV = useMotionValue(letterSpacing)
    const caMaxPxMV = useMotionValue(caMaxPx)

    useEffect(() => {
        edgePctMV.set(edgePct)
        dirMV.set(directionPreset)
        offsetFromMV.set(offsetFrom)
        effectMV.set(effect)
        blurPxMV.set(blurPx)
        colorMV.set(color)
        fromColorMV.set(fromColor)
        toColorMV.set(toColor)
        morphStartMV.set(morphStart)
        morphEndMV.set(morphEnd)
        lsFromPxMV.set(lsFromPx)
        letterSpacingMV.set(letterSpacing)
        caMaxPxMV.set(caMaxPx)
    }, [
        edgePct,
        directionPreset,
        offsetFrom,
        effect,
        blurPx,
        color,
        fromColor,
        toColor,
        morphStart,
        morphEnd,
        lsFromPx,
        letterSpacing,
        caMaxPx,
    ])

    const globalMask = useTransform(
        [visiblePct, edgePctMV, dirMV],
        ([vPct, ePct, dir]) => {
            const angle =
                dir === "Top → Bottom"
                    ? "180deg"
                    : dir === "Bottom → Top"
                      ? "180deg|inv"
                      : dir === "Left → Right"
                        ? "90deg"
                        : dir === "Right → Left"
                          ? "270deg"
                          : dir === "Top-Left → Bottom-Right"
                            ? "135deg"
                            : dir === "Bottom-Right → Top-Left"
                              ? "315deg"
                              : dir === "Top-Right → Bottom-Left"
                                ? "225deg"
                                : dir === "Bottom-Left → Top-Right"
                                  ? "45deg"
                                  : "180deg|inv"

            if (typeof angle === "string" && angle.endsWith("|inv")) {
                const ang = angle.slice(0, -4)
                return `linear-gradient(${ang}, rgba(0,0,0,0) 0%, rgba(0,0,0,0) calc(100% - ${vPct}% - ${ePct}%), rgba(0,0,0,1) calc(100% - ${vPct}%), rgba(0,0,0,1) 100%)`
            }
            return `linear-gradient(${angle}, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${vPct}%, rgba(0,0,0,0) calc(${vPct}% + ${ePct}%), rgba(0,0,0,0) 100%)`
        }
    )

    const baseY = useTransform([offsetProg, offsetFromMV], ([prog, off]) => {
        if (off === "Top") return -100 * (1 - prog)
        if (off === "Bottom") return 100 * (1 - prog)
        return 0
    })

    const baseX = useTransform([offsetProg, offsetFromMV], ([prog, off]) => {
        if (off === "Left") return -100 * (1 - prog)
        if (off === "Right") return 100 * (1 - prog)
        return 0
    })

    const blurFilter = useTransform(
        [maskProg, blurPxMV, effectMV],
        ([prog, bPx, eff]) =>
            eff === "Blur" ? `blur(${bPx * (1 - prog)}px)` : "none"
    )

    const morphWin = useTransform(
        [maskProg, morphStartMV, morphEndMV],
        ([prog, mStart, mEnd]) => {
            const range = Math.max(1e-6, mEnd - mStart)
            const val = (prog - mStart) / range
            return Math.max(0, Math.min(1, val))
        }
    )

    const currentColor = useTransform(
        [morphWin, effectMV, colorMV, fromColorMV, toColorMV],
        ([win, eff, c, cFrom, cTo]) =>
            eff === "Color Morph" ? mix(cFrom, cTo)(win as number) : c
    )

    const tightLs = useTransform(
        [maskProg, lsFromPxMV, letterSpacingMV],
        ([prog, lsFrom, lsTo]) => lsFrom + (lsTo - lsFrom) * prog
    )
    const currentLetterSpacing = useTransform(
        [tightLs, effectMV, letterSpacingMV],
        ([tight, eff, ls]) =>
            eff === "Kerning Tighten" ? `${tight}px` : `${ls}px`
    )

    const caOffset = useTransform(
        [maskProg, effectMV, caMaxPxMV],
        ([prog, eff, caMax]) =>
            eff === "Chromatic Aberration" ? caMax * (1 - prog) : 0
    )
    const xRed = useTransform([baseX, caOffset], ([bx, c]) => bx + c)
    const xCyan = useTransform([baseX, caOffset], ([bx, c]) => bx - c)

    const graphemes = useMemo(() => Array.from(text || ""), [text])
    const stepsMV = useMotionValue(Math.max(1, graphemes.length))
    const lenMV = useMotionValue(graphemes.length)

    useEffect(() => {
        stepsMV.set(Math.max(1, graphemes.length))
        lenMV.set(graphemes.length)
    }, [graphemes.length])

    const visibleCountTyped = useTransform(
        [maskProg, stepsMV],
        ([prog, steps]) => {
            const quantizedProg = Math.floor(prog * steps) / steps
            return Math.round(quantizedProg * steps)
        }
    )
    const [typedVisible, setTypedVisible] = useState(0)

    const [scrFrame, setScrFrame] = useState(0)
    useEffect(() => {
        if (effect !== "Scramble" || kineticMode) return
        let raf = 0,
            last = performance.now()
        const step = 1000 / Math.max(1, scrambleSpeed)
        const loop = (t: number) => {
            if (t - last >= step) {
                setScrFrame((f) => f + 1)
                last = t
            }
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [effect, scrambleSpeed, kineticMode])

    const revealedCountScr = useTransform([maskProg, lenMV], ([prog, len]) =>
        Math.round(len * prog)
    )

    function prng(i: number) {
        const x = Math.sin(i * 9301 + scrambleSeed * 49297) * 233280
        return x - Math.floor(x)
    }
    const CHARSET =
        scrambleCharset || "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&*+-=?"
    const [scrambledOut, setScrambledOut] = useState<string[]>(graphemes)

    useEffect(() => setScrambledOut(graphemes), [graphemes])
    useEffect(() => {
        if (effect !== "Scramble" || kineticMode) return
        const u = revealedCountScr.on("change", (n) => {
            const N = Math.max(0, Math.min(graphemes.length, n))
            const out = new Array(graphemes.length)
            for (let i = 0; i < graphemes.length; i++) {
                out[i] =
                    i < N
                        ? graphemes[i]
                        : CHARSET[
                              Math.floor(prng(i + scrFrame) * CHARSET.length)
                          ]
            }
            setScrambledOut(out)
        })
        return () => u()
    }, [effect, revealedCountScr, scrFrame, graphemes, CHARSET, kineticMode])

    useEffect(() => {
        if (effect !== "Typewriter" || kineticMode) return
        const u = visibleCountTyped.on("change", (n) => setTypedVisible(n))
        return () => u()
    }, [effect, visibleCountTyped, kineticMode])

    useEffect(() => {
        if (effect !== "Typewriter" || !typeCaretOn || kineticMode) return
        const id = "rt_blink_style"
        if (!document.getElementById(id)) {
            const s = document.createElement("style")
            s.id = id
            s.textContent = `@keyframes rt_blink{50%{opacity:0}}`
            document.head.appendChild(s)
        }
    }, [effect, typeCaretOn, kineticMode])

    const mainContentDOM =
        effect === "Scramble" ? (
            <span aria-label="scramble">
                {scrambledOut.map((ch, i) => (
                    <span key={i}>{ch}</span>
                ))}
            </span>
        ) : effect === "Typewriter" ? (
            <span aria-label="typewriter">
                {graphemes.slice(0, typedVisible).join("")}
                {typeCaretOn && (
                    <span
                        style={{
                            display: "inline-block",
                            width: "0.5ch",
                            height: `0.5ch`,
                            background: color,
                            marginLeft: "0.05ch",
                            verticalAlign: "baseline",
                            animation: `rt_blink ${Math.max(120, caretBlinkMs)}ms steps(1,end) infinite`,
                        }}
                    />
                )}
            </span>
        ) : (
            text
        )

    const baseFontFamily =
        fontFamily?.fontFamily || "system-ui, -apple-system, Segoe UI, Arial"
    const baseFontWeight = fontFamily?.fontWeight || 400

    // ==========================================
    // MODULE 2: KINETIC CANVAS LOGIC
    // ==========================================
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)
    const [fontLoadedTrigger, setFontLoadedTrigger] = useState(0)

    useEffect(() => {
        if (!kineticMode || typeof document === "undefined" || !document.fonts)
            return
        let isActive = true
        document.fonts.ready.then(() => {
            if (isActive) setFontLoadedTrigger((v) => v + 1)
        })
        const handleFontLoad = () => {
            if (isActive) setFontLoadedTrigger((v) => v + 1)
        }
        document.fonts.addEventListener("loadingdone", handleFontLoad)
        return () => {
            isActive = false
            document.fonts.removeEventListener("loadingdone", handleFontLoad)
        }
    }, [kineticMode, baseFontFamily, baseFontWeight])

    useEffect(() => {
        if (!kineticMode || !kineticLogo || typeof document === "undefined") {
            setLogoImg(null)
            return
        }
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = kineticLogo
        img.onload = () => {
            if (img.width > 0 && img.height > 0) setLogoImg(img)
        }
    }, [kineticMode, kineticLogo])

    const charCache = useMemo(() => {
        if (!kineticMode || typeof document === "undefined") return {}

        const cache: Record<
            string,
            { img: HTMLCanvasElement; width: number; height: number }
        > = {}
        const uniqueChars = [...new Set((text || "").split(""))]
        const scaleMult = 1.5
        const fontSizePx = Math.round(fontSize * scaleMult)

        const familyStr = baseFontFamily.includes(",")
            ? baseFontFamily
            : `"${baseFontFamily}"`
        const fontStr = `${baseFontWeight} ${fontSizePx}px ${familyStr}, sans-serif`

        uniqueChars.forEach((char) => {
            if (char === "\n") return

            const c = document.createElement("canvas")
            const cx = c.getContext("2d")
            if (!cx) return
            const size = Math.ceil(fontSizePx * 1.5)
            c.width = size
            c.height = size
            cx.font = fontStr
            cx.fillStyle = color
            cx.textAlign = "center"
            cx.textBaseline = "middle"
            cx.fillText(char, size / 2, size / 2)
            cache[char] = { img: c, width: size, height: size }
        })
        return cache
    }, [
        kineticMode,
        text,
        fontSize,
        color,
        baseFontFamily,
        baseFontWeight,
        fontLoadedTrigger,
    ])

    useEffect(() => {
        if (!kineticMode || !canvasRef.current || !rootRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) return

        let animationId: number
        let time = 0
        let width = rootRef.current.clientWidth
        let height = rootRef.current.clientHeight || 400

        const resizeCanvas = () => {
            if (!rootRef.current) return
            const dpr = window.devicePixelRatio || 1
            width = rootRef.current.clientWidth
            height = rootRef.current.clientHeight || 400
            canvas.width = width * dpr
            canvas.height = height * dpr
            ctx.scale(dpr, dpr)
        }

        const ro = new ResizeObserver(resizeCanvas)
        ro.observe(rootRef.current)
        resizeCanvas()

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            const isCanvasEditor =
                typeof RenderTarget !== "undefined"
                    ? RenderTarget.current() === RenderTarget.canvas
                    : false
            if (!(kineticStopAnimation && isCanvasEditor)) {
                time += kineticSpeed
            }

            const globalRenderList: any[] = []

            const lines = (text || "").split("\n")
            // Рассчитываем сколько реально линий будет активно для центровки
            const activeLinesCount = kineticMultipleText
                ? Math.min(lines.length, kineticEchoCount + 1)
                : 1

            const buildLayer = (
                timeShift: number,
                layerOpacity: number,
                layerText: string,
                lineIndex: number,
                totalLines: number
            ) => {
                if (!layerText) return

                let chars = layerText.split("")

                // --- INVERSE TEXT LOGIC ---
                if (kineticInverseText) {
                    chars = chars.reverse()
                }

                const totalWidth = chars.length * letterSpacing
                const startX = -(totalWidth / 2) + letterSpacing / 2

                // --- VERTICAL OFFSET FOR MULTIPLE TEXT ---
                // Центруем блок строк по оси Y
                const yOffset = kineticMultipleText
                    ? (lineIndex - (totalLines - 1) / 2) * (fontSize * 1.2)
                    : 0

                chars.forEach((char, i) => {
                    const cached = charCache[char]
                    if (!cached) return

                    const localTime = time + timeShift
                    let x3d = 0,
                        y3d = 0,
                        z3d = 0,
                        theta = 0

                    switch (kineticModeType) {
                        case "ring":
                            theta = localTime + i * kineticStagger
                            x3d = Math.cos(theta) * (kineticRadius * 1.5)
                            z3d = Math.sin(theta) * (kineticRadius * 1.5)
                            y3d = 0
                            break
                        case "cube":
                            theta = localTime + i * kineticStagger
                            const clampCube = (v: number) =>
                                Math.max(-1, Math.min(1, v * 1.5))
                            x3d = clampCube(Math.cos(theta)) * kineticRadius
                            z3d = clampCube(Math.sin(theta)) * kineticRadius
                            y3d =
                                clampCube(Math.cos(theta * 0.5)) * kineticRadius
                            break
                        case "wave":
                            theta = localTime + i * kineticStagger
                            x3d = startX + i * letterSpacing
                            y3d = Math.sin(theta) * kineticRadius
                            z3d = Math.cos(theta) * (kineticRadius * 0.2)
                            break
                        case "tunnel":
                            theta = localTime + i * kineticStagger
                            x3d = Math.cos(theta) * (kineticRadius * 1.5)
                            y3d = Math.sin(theta) * (kineticRadius * 1.5)
                            const depthWrap = Math.max(
                                1000,
                                chars.length * letterSpacing * 2
                            )
                            let zPos =
                                (i * letterSpacing * 2 -
                                    depthWrap / 2 +
                                    localTime * 300) %
                                depthWrap
                            if (zPos < 0) zPos += depthWrap
                            z3d = zPos - depthWrap / 2
                            break
                        case "classic":
                            theta = localTime + i * kineticStagger
                            x3d = startX + i * letterSpacing
                            y3d = Math.sin(theta) * kineticRadius
                            z3d = Math.cos(theta) * kineticRadius
                            break
                        case "vertical":
                            theta = localTime + i * kineticStagger
                            x3d = Math.sin(theta) * (kineticRadius * 1.5)
                            z3d = Math.cos(theta) * (kineticRadius * 1.5)
                            y3d =
                                i * letterSpacing * 0.5 -
                                chars.length * letterSpacing * 0.25 +
                                Math.sin(time * 2 + i * 0.2) * 20
                            break
                        case "helix":
                            theta = localTime + i * kineticStagger
                            x3d = Math.sin(theta) * kineticRadius
                            z3d = Math.cos(theta) * kineticRadius
                            y3d =
                                i * letterSpacing * 0.8 -
                                chars.length * letterSpacing * 0.4
                            break
                        case "snake":
                            theta = localTime + i * kineticStagger
                            x3d = startX + i * letterSpacing
                            y3d = Math.sin(theta) * kineticRadius
                            z3d = Math.cos(theta * 0.5) * kineticRadius
                            break
                        case "vortex":
                            theta = localTime + i * kineticStagger
                            x3d = Math.cos(theta) * (kineticRadius + i * 5)
                            y3d = Math.sin(theta) * (kineticRadius + i * 5)
                            z3d = i * 60 - chars.length * 30
                            break
                        case "figure8":
                            theta =
                                localTime + (chars.length - i) * kineticStagger
                            x3d = Math.cos(theta) * (kineticRadius * 1.5) * 1.5
                            y3d = Math.sin(theta * 2) * (kineticRadius * 0.75)
                            z3d = Math.sin(theta) * (kineticRadius * 1.5)
                            break
                        case "globe":
                            theta = localTime + i * kineticStagger
                            const phi = (i / chars.length - 0.5) * Math.PI
                            x3d =
                                kineticRadius *
                                1.5 *
                                Math.cos(phi) *
                                Math.cos(theta)
                            z3d =
                                kineticRadius *
                                1.5 *
                                Math.cos(phi) *
                                Math.sin(theta)
                            y3d = kineticRadius * 1.5 * Math.sin(phi)
                            break
                        case "mobius":
                            theta = localTime + i * kineticStagger
                            const rM = kineticRadius * 1.2
                            const wM = kineticRadius * 0.4
                            x3d =
                                (rM + wM * Math.cos(theta / 2)) *
                                Math.cos(theta)
                            y3d =
                                (rM + wM * Math.cos(theta / 2)) *
                                Math.sin(theta)
                            z3d = wM * Math.sin(theta / 2)
                            break
                        case "heart":
                            theta = localTime + i * kineticStagger
                            const rH = kineticRadius / 15
                            x3d = rH * 16 * Math.pow(Math.sin(theta), 3)
                            y3d =
                                -rH *
                                (13 * Math.cos(theta) -
                                    5 * Math.cos(2 * theta) -
                                    2 * Math.cos(3 * theta) -
                                    Math.cos(4 * theta))
                            z3d = rH * 5 * Math.sin(theta) * Math.cos(theta)
                            break
                        case "knot":
                            theta = localTime + i * kineticStagger
                            x3d =
                                kineticRadius *
                                0.8 *
                                (2 + Math.cos(3 * theta)) *
                                Math.cos(2 * theta)
                            y3d =
                                kineticRadius *
                                0.8 *
                                (2 + Math.cos(3 * theta)) *
                                Math.sin(2 * theta)
                            z3d =
                                kineticRadius * 0.8 * Math.sin(3 * theta) * 1.5
                            break
                        case "stairs":
                            theta = localTime + i * kineticStagger
                            x3d = Math.cos(theta) * kineticRadius
                            z3d = Math.sin(theta) * kineticRadius
                            y3d = i * 30 - chars.length * 15
                            break
                        case "galaxy":
                            theta = localTime + i * kineticStagger * 0.8
                            x3d =
                                Math.cos(theta) * (i * (kineticRadius / 8) + 50)
                            z3d =
                                Math.sin(theta) * (i * (kineticRadius / 8) + 50)
                            y3d = Math.sin(theta * 2) * 20
                            break
                        case "ribbon":
                            theta = localTime * 1.5 + i * 0.2
                            x3d = startX + i * letterSpacing
                            y3d = Math.sin(theta) * kineticRadius
                            z3d = Math.cos(theta) * (kineticRadius * 0.5)
                            break
                        case "flower":
                            theta = localTime + i * 0.1
                            const rF = kineticRadius * 1.5 * Math.cos(3 * theta)
                            x3d = rF * Math.cos(theta)
                            y3d = rF * Math.sin(theta)
                            z3d = Math.sin(theta * 5) * 50
                            break
                        case "hourglass":
                            const yHG =
                                i * letterSpacing * 0.6 -
                                chars.length * letterSpacing * 0.3
                            theta = localTime + i * kineticStagger
                            x3d =
                                (Math.abs(yHG) +
                                    40 +
                                    Math.sin(localTime) * 20) *
                                Math.cos(theta)
                            z3d =
                                (Math.abs(yHG) +
                                    40 +
                                    Math.sin(localTime) * 20) *
                                Math.sin(theta)
                            y3d = yHG
                            break
                        case "lissajous":
                            theta = localTime + i * 0.15
                            x3d = kineticRadius * 1.5 * Math.sin(3 * theta)
                            y3d = kineticRadius * 1.5 * Math.sin(2 * theta)
                            z3d = kineticRadius * 1.5 * Math.cos(theta)
                            break
                    }

                    // Применяем отступ между строками, если Multiple Text включен
                    y3d += yOffset

                    const rotationAngle =
                        localTime * kineticRotSpeed + i * kineticRotStagger

                    globalRenderList.push({
                        isLogo: false,
                        char,
                        cached,
                        x3d,
                        y3d,
                        z3d,
                        rotationAngle,
                        layerOpacity,
                    })
                })
            }

            // 1. Calculate Echo Layers (или строки, если включен Multiple Text)
            for (let e = kineticEchoCount; e > 0; e--) {
                const offset = e * kineticEchoGap * (kineticSpeed < 0 ? 1 : -1)
                const fade = Math.max(0, 1 - e * kineticEchoFade)

                const currentLayerText = kineticMultipleText
                    ? lines[e] || ""
                    : text

                if (fade > 0 && currentLayerText) {
                    buildLayer(
                        offset,
                        fade,
                        currentLayerText,
                        e,
                        activeLinesCount
                    )
                }
            }

            // 2. Calculate Main Layer
            const mainLayerText = kineticMultipleText ? lines[0] || "" : text
            if (mainLayerText) {
                buildLayer(0, 1.0, mainLayerText, 0, activeLinesCount)
            }

            // 3. Inject Logo
            if (logoImg) {
                globalRenderList.push({
                    isLogo: true,
                    cached: {
                        img: logoImg,
                        width: logoImg.width,
                        height: logoImg.height,
                    },
                    x3d: 0,
                    y3d: 0,
                    z3d: 0,
                    rotationAngle: 0,
                    layerOpacity: 1.0,
                })
            }

            // 4. Sort Elements by Depth
            globalRenderList.sort((a, b) => a.z3d - b.z3d)

            // 5. Draw
            globalRenderList.forEach((item) => {
                let depth = kineticFocal - item.z3d
                if (depth < 10) depth = 10

                let baseScaleFactor = kineticFocal / depth
                const scaleFactor = kineticAutoScale
                    ? baseScaleFactor * (width / kineticBaseWidth)
                    : baseScaleFactor

                const x2d = width / 2 + item.x3d * scaleFactor
                const y2d = height / 2 + item.y3d * scaleFactor

                ctx.save()
                ctx.translate(x2d, y2d)

                if (item.isLogo) {
                    const aspect =
                        item.cached.height > 0
                            ? item.cached.width / item.cached.height
                            : 1
                    let drawW = kineticLogoSize
                    let drawH = kineticLogoSize
                    if (aspect > 1) {
                        drawH = kineticLogoSize / aspect
                    } else {
                        drawW = kineticLogoSize * aspect
                    }

                    const finalW = drawW * scaleFactor
                    const finalH = drawH * scaleFactor

                    ctx.globalAlpha = 1.0
                    ctx.drawImage(
                        item.cached.img,
                        -finalW / 2,
                        -finalH / 2,
                        finalW,
                        finalH
                    )
                } else {
                    ctx.rotate(item.rotationAngle)

                    let alpha = 1.0

                    if (!kineticDisableDepth) {
                        const normalizedDepth =
                            (item.z3d + kineticRadius * 1.5) /
                            (2 * kineticRadius * 1.5)
                        alpha = 0.15 + normalizedDepth * 0.85
                    }

                    alpha *= item.layerOpacity

                    if (alpha < 0) alpha = 0
                    if (alpha > 1) alpha = 1
                    if (alpha < 0.01) {
                        ctx.restore()
                        return
                    }

                    const spriteScale = fontSize / item.cached.width
                    const finalScale = scaleFactor * spriteScale
                    ctx.scale(finalScale, finalScale)
                    ctx.globalAlpha = alpha
                    ctx.drawImage(
                        item.cached.img,
                        -item.cached.width / 2,
                        -item.cached.height / 2
                    )
                }

                ctx.restore()
            })

            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            cancelAnimationFrame(animationId)
            ro.disconnect()
        }
    }, [
        kineticMode,
        charCache,
        kineticModeType,
        kineticMultipleText,
        kineticInverseText,
        kineticAutoScale,
        kineticBaseWidth,
        kineticSpeed,
        kineticRadius,
        kineticStagger,
        kineticFocal,
        kineticDisableDepth,
        kineticRotSpeed,
        kineticRotStagger,
        kineticEchoCount,
        kineticEchoGap,
        kineticEchoFade,
        kineticStopAnimation,
        text,
        letterSpacing,
        fontSize,
        logoImg,
        kineticLogoSize,
    ])

    // ==========================================
    // RENDER TREE
    // ==========================================
    return (
        <motion.div
            ref={rootRef}
            style={{
                position: "relative",
                minWidth: "240px",
                height: kineticMode
                    ? "100%"
                    : measuredH !== undefined
                      ? `${measuredH + 2}px`
                      : "auto",
                minHeight: kineticMode ? "300px" : "auto",
                overflow: kineticMode ? "hidden" : "visible",
                willChange: "transform",
            }}
        >
            {kineticMode ? (
                // CANVAS LAYER
                <canvas
                    ref={canvasRef}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                />
            ) : (
                // DOM LAYER
                <>
                    {effect === "Chromatic Aberration" && (
                        <>
                            <motion.p
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: "100%",
                                    x: xRed,
                                    y: baseY,
                                    margin: "-0.4em 0",
                                    padding: "0.4em 0",
                                    fontFamily: baseFontFamily,
                                    fontSize: `${fontSize}px`,
                                    fontWeight: baseFontWeight,
                                    lineHeight: `${lineHeight}px`,
                                    letterSpacing: currentLetterSpacing,
                                    textAlign,
                                    color: "rgb(255,0,0)",
                                    opacity: caOpacity,
                                    mixBlendMode: caBlend,
                                    WebkitMaskImage: globalMask,
                                    maskImage: globalMask,
                                    WebkitMaskRepeat: "no-repeat",
                                    maskRepeat: "no-repeat",
                                    WebkitMaskSize: "100% 100%",
                                    maskSize: "100% 100%",
                                    whiteSpace: "pre-wrap",
                                    pointerEvents: "none",
                                    willChange: "transform",
                                }}
                            >
                                {text}
                            </motion.p>
                            <motion.p
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: "100%",
                                    x: xCyan,
                                    y: baseY,
                                    margin: "-0.4em 0",
                                    padding: "0.4em 0",
                                    fontFamily: baseFontFamily,
                                    fontSize: `${fontSize}px`,
                                    fontWeight: baseFontWeight,
                                    lineHeight: `${lineHeight}px`,
                                    letterSpacing: currentLetterSpacing,
                                    textAlign,
                                    color: "rgb(0,255,255)",
                                    opacity: caOpacity,
                                    mixBlendMode: caBlend,
                                    WebkitMaskImage: globalMask,
                                    maskImage: globalMask,
                                    WebkitMaskRepeat: "no-repeat",
                                    maskRepeat: "no-repeat",
                                    WebkitMaskSize: "100% 100%",
                                    maskSize: "100% 100%",
                                    whiteSpace: "pre-wrap",
                                    pointerEvents: "none",
                                    willChange: "transform",
                                }}
                            >
                                {text}
                            </motion.p>
                        </>
                    )}

                    <motion.p
                        ref={pRef}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: "100%",
                            x: baseX,
                            y: baseY,
                            margin: "-0.4em 0",
                            padding: "0.4em 0",
                            fontFamily: baseFontFamily,
                            fontSize: `${fontSize}px`,
                            fontWeight: baseFontWeight,
                            lineHeight: `${lineHeight}px`,
                            letterSpacing: currentLetterSpacing,
                            textAlign,
                            color: currentColor,
                            filter: blurFilter,
                            WebkitMaskImage: globalMask,
                            maskImage: globalMask,
                            WebkitMaskRepeat: "no-repeat",
                            maskRepeat: "no-repeat",
                            WebkitMaskSize: "100% 100%",
                            maskSize: "100% 100%",
                            whiteSpace: "pre-wrap",
                            display: "block",
                            overflow: "visible",
                            willChange: "transform, color, filter",
                        }}
                    >
                        {mainContentDOM}
                    </motion.p>
                </>
            )}
        </motion.div>
    )
}

// ==========================================
// PROPERTY CONTROLS
// ==========================================
addPropertyControls(Reveal_Text_Ultra, {
    kineticMode: {
        title: "Kinetic Mode",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue: "MODERN AGENCY",
        displayTextArea: true,
    },
    fontFamily: { title: "Font", type: ControlType.Font },
    fontSize: {
        title: "Size",
        type: ControlType.Number,
        defaultValue: 77,
        min: 10,
        max: 200,
    },
    letterSpacing: {
        title: "Spacing",
        type: ControlType.Number,
        defaultValue: 0,
        min: -50,
        max: 100,
        step: 0.01,
    },
    color: { title: "Color", type: ControlType.Color, defaultValue: "#FFFFFF" },
    textAlign: {
        title: "Align",
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        hidden: (p: any) => p.kineticMode,
    },

    // --- KINETIC CONTROLS ---
    kineticModeType: {
        title: "K: Path Mode",
        type: ControlType.Enum,
        options: [
            "ring",
            "cube",
            "wave",
            "tunnel",
            "vertical",
            "classic",
            "helix",
            "snake",
            "vortex",
            "figure8",
            "globe",
            "mobius",
            "heart",
            "knot",
            "stairs",
            "galaxy",
            "ribbon",
            "flower",
            "hourglass",
            "lissajous",
        ],
        optionTitles: [
            "Ring",
            "Cube",
            "Wave",
            "Tunnel",
            "Vertical",
            "Classic",
            "Helix",
            "Snake",
            "Vortex",
            "Figure 8",
            "Globe",
            "Mobius",
            "Heart",
            "Knot",
            "Stairs",
            "Galaxy",
            "Ribbon",
            "Flower",
            "Hourglass",
            "Lissajous",
        ],
        defaultValue: "ring",
        hidden: (p: any) => !p.kineticMode,
    },
    kineticMultipleText: {
        title: "K: Multiple Text",
        type: ControlType.Boolean,
        defaultValue: false,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticInverseText: {
        title: "K: Inverse Text",
        type: ControlType.Boolean,
        defaultValue: false,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticAutoScale: {
        title: "K: Auto Scale",
        type: ControlType.Boolean,
        defaultValue: true,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticBaseWidth: {
        title: "K: Base Width",
        type: ControlType.Number,
        defaultValue: 1000,
        min: 200,
        max: 4000,
        step: 10,
        hidden: (p: any) => !p.kineticMode || !p.kineticAutoScale,
    },
    kineticLogo: {
        title: "K: Center Logo",
        type: ControlType.Image,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticLogoSize: {
        title: "K: Logo Size",
        type: ControlType.Number,
        defaultValue: 200,
        min: 10,
        max: 1000,
        step: 1,
        hidden: (p: any) => !p.kineticMode || !p.kineticLogo,
    },
    kineticSpeed: {
        title: "K: Speed",
        type: ControlType.Number,
        defaultValue: -0.013,
        min: -0.05,
        max: 0.05,
        step: 0.001,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticStopAnimation: {
        title: "K: Stop Anim",
        type: ControlType.Boolean,
        defaultValue: false,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticRadius: {
        title: "K: Radius",
        type: ControlType.Number,
        defaultValue: 226,
        min: 10,
        max: 500,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticStagger: {
        title: "K: Twist",
        type: ControlType.Number,
        defaultValue: 0.18,
        min: 0,
        max: 1.0,
        step: 0.01,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticFocal: {
        title: "K: Camera FOV",
        type: ControlType.Number,
        defaultValue: 600,
        min: 200,
        max: 2000,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticDisableDepth: {
        title: "K: Disable Depth",
        type: ControlType.Boolean,
        defaultValue: false,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticEchoCount: {
        title: "K: Echo Count",
        type: ControlType.Number,
        defaultValue: 2,
        min: 0,
        max: 15,
        step: 1,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticEchoGap: {
        title: "K: Echo Gap",
        type: ControlType.Number,
        defaultValue: 1.22,
        min: 0.1,
        max: 5.0,
        step: 0.01,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticEchoFade: {
        title: "K: Echo Fade",
        type: ControlType.Number,
        defaultValue: 0.2,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticRotSpeed: {
        title: "K: Rot Speed",
        type: ControlType.Number,
        defaultValue: 0.0,
        min: -0.2,
        max: 0.2,
        step: 0.001,
        hidden: (p: any) => !p.kineticMode,
    },
    kineticRotStagger: {
        title: "K: Rot Stagger",
        type: ControlType.Number,
        defaultValue: 0.0,
        min: -1.0,
        max: 1.0,
        step: 0.01,
        hidden: (p: any) => !p.kineticMode,
    },

    // --- DOM CONTROLS ---
    lineHeight: {
        title: "Line Height",
        type: ControlType.Number,
        defaultValue: 60,
        min: 12,
        max: 200,
        hidden: (p: any) => p.kineticMode,
    },
    revealStart: {
        title: "Reveal Start",
        type: ControlType.Number,
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p: any) => p.kineticMode,
    },
    revealEnd: {
        title: "Reveal End",
        type: ControlType.Number,
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p: any) => p.kineticMode,
    },
    edgePct: {
        title: "Edge %",
        type: ControlType.Number,
        defaultValue: 25,
        min: 0,
        max: 70,
        step: 1,
        hidden: (p: any) => p.kineticMode,
    },
    directionPreset: {
        title: "Direction",
        type: ControlType.Enum,
        options: [
            "Top → Bottom",
            "Bottom → Top",
            "Left → Right",
            "Right → Left",
            "Top-Left → Bottom-Right",
            "Bottom-Right → Top-Left",
            "Top-Right → Bottom-Left",
            "Bottom-Left → Top-Right",
        ],
        optionTitles: [
            "Top → Bottom",
            "Bottom → Top",
            "Left → Right",
            "Right → Left",
            "Top-Left → Bottom-Right",
            "Bottom-Right → Top-Left",
            "Top-Right → Bottom-Left",
            "Bottom-Left → Top-Right",
        ],
        defaultValue: "Top → Bottom",
        hidden: (p: any) => p.kineticMode,
    },
    repeatReveal: {
        title: "Repeat on Scroll",
        type: ControlType.Boolean,
        defaultValue: true,
        hidden: (p: any) => p.kineticMode,
    },
    offsetFrom: {
        title: "Offset From",
        type: ControlType.Enum,
        options: ["None", "Bottom", "Top", "Left", "Right"],
        optionTitles: ["None", "Bottom", "Top", "Left", "Right"],
        defaultValue: "None",
        hidden: (p: any) => p.kineticMode,
    },
    effect: {
        title: "Effect",
        type: ControlType.Enum,
        options: [
            "None",
            "Blur",
            "Color Morph",
            "Scramble",
            "Typewriter",
            "Kerning Tighten",
            "Chromatic Aberration",
        ],
        optionTitles: [
            "None",
            "Blur",
            "Color Morph",
            "Scramble",
            "Typewriter",
            "Kerning Tighten",
            "Chromatic Aberration",
        ],
        defaultValue: "None",
        hidden: (p: any) => p.kineticMode,
    },
    blurPx: {
        title: "Blur px",
        type: ControlType.Number,
        defaultValue: 12,
        min: 0,
        max: 48,
        step: 1,
        hidden: (p: any) => p.kineticMode || p.effect !== "Blur",
    },
    fromColor: {
        title: "From Color",
        type: ControlType.Color,
        defaultValue: "#BFD8F5",
        hidden: (p: any) => p.kineticMode || p.effect !== "Color Morph",
    },
    toColor: {
        title: "To Color",
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        hidden: (p: any) => p.kineticMode || p.effect !== "Color Morph",
    },
    morphStart: {
        title: "Morph Start",
        type: ControlType.Number,
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p: any) => p.kineticMode || p.effect !== "Color Morph",
    },
    morphEnd: {
        title: "Morph End",
        type: ControlType.Number,
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p: any) => p.kineticMode || p.effect !== "Color Morph",
    },
    scrambleSpeed: {
        title: "Scramble FPS",
        type: ControlType.Number,
        defaultValue: 24,
        min: 1,
        max: 60,
        step: 1,
        hidden: (p: any) => p.kineticMode || p.effect !== "Scramble",
    },
    scrambleCharset: {
        title: "Charset",
        type: ControlType.String,
        defaultValue: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&*+-=?",
        hidden: (p: any) => p.kineticMode || p.effect !== "Scramble",
    },
    scrambleSeed: {
        title: "Seed",
        type: ControlType.Number,
        defaultValue: 7,
        min: 0,
        max: 9999,
        step: 1,
        hidden: (p: any) => p.kineticMode || p.effect !== "Scramble",
    },
    typeCaretOn: {
        title: "Caret",
        type: ControlType.Boolean,
        defaultValue: true,
        hidden: (p: any) => p.kineticMode || p.effect !== "Typewriter",
    },
    caretBlinkMs: {
        title: "Caret Blink ms",
        type: ControlType.Number,
        defaultValue: 600,
        min: 120,
        max: 2000,
        step: 20,
        hidden: (p: any) =>
            p.kineticMode || p.effect !== "Typewriter" || !p.typeCaretOn,
    },
    lsFromPx: {
        title: "LS From px",
        type: ControlType.Number,
        defaultValue: 1.5,
        min: -5,
        max: 10,
        step: 0.05,
        hidden: (p: any) => p.kineticMode || p.effect !== "Kerning Tighten",
    },
    caMaxPx: {
        title: "CA Max px",
        type: ControlType.Number,
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.1,
        hidden: (p: any) =>
            p.kineticMode || p.effect !== "Chromatic Aberration",
    },
    caOpacity: {
        title: "CA Opacity",
        type: ControlType.Number,
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p: any) =>
            p.kineticMode || p.effect !== "Chromatic Aberration",
    },
    caBlend: {
        title: "CA Blend",
        type: ControlType.Enum,
        options: ["screen", "normal"],
        optionTitles: ["screen", "normal"],
        defaultValue: "screen",
        hidden: (p: any) =>
            p.kineticMode || p.effect !== "Chromatic Aberration",
    },
})
