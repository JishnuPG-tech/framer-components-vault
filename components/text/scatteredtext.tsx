// Framer Component: Scroll-Driven Scattered Letter Animation
// Paste this into a Framer Code Component

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, useState, useCallback } from "react"
import { useScroll } from "framer-motion"

// ─── Seeded random ────────────────────────────────────────────────────────────
function seededRandom(seed: number) {
    let s = seed
    return () => {
        s = (s * 16807 + 0) % 2147483647
        return (s - 1) / 2147483646
    }
}

// ─── Parse stop list from CSS gradient args ───────────────────────────────────
function parseStops(raw: string): { color: string; pos: number }[] {
    const parts: string[] = []
    let depth = 0,
        cur = ""
    for (const ch of raw) {
        if (ch === "(") depth++
        if (ch === ")") depth--
        if (ch === "," && depth === 0) {
            parts.push(cur.trim())
            cur = ""
        } else cur += ch
    }
    if (cur.trim()) parts.push(cur.trim())

    const stops: { color: string; pos: number }[] = []
    parts.forEach((part, i) => {
        const m = part.match(/^(.*?)\s+([\d.]+)%\s*$/)
        if (m) {
            stops.push({ color: m[1].trim(), pos: parseFloat(m[2]) / 100 })
        } else {
            stops.push({
                color: part.trim(),
                pos: i / Math.max(parts.length - 1, 1),
            })
        }
    })
    return stops
}

// ─── Build a Canvas2D fillStyle from any CSS fill string ──────────────────────
function buildFill(
    ctx: CanvasRenderingContext2D,
    fill: string,
    cw: number,
    ch: number
): string | CanvasGradient {
    const s = fill.trim()

    const linMatch = s.match(/^linear-gradient\(\s*(.*)\s*\)$/i)
    if (linMatch) {
        const inner = linMatch[1]
        const angleMatch = inner.match(/^(-?[\d.]+)deg\s*,\s*/)
        let angle = 180,
            stopsStr = inner
        if (angleMatch) {
            angle = parseFloat(angleMatch[1])
            stopsStr = inner.slice(angleMatch[0].length)
        } else if (/^to\s+/i.test(inner)) {
            const toMatch = inner.match(/^to\s+([\w\s]+?)\s*,\s*/i)
            if (toMatch) {
                const dir = toMatch[1].trim().toLowerCase()
                angle =
                    dir === "right"
                        ? 90
                        : dir === "left"
                          ? 270
                          : dir === "bottom"
                            ? 180
                            : dir === "top"
                              ? 0
                              : dir === "bottom right"
                                ? 135
                                : dir === "bottom left"
                                  ? 225
                                  : dir === "top right"
                                    ? 45
                                    : dir === "top left"
                                      ? 315
                                      : 180
                stopsStr = inner.slice(toMatch[0].length)
            }
        }
        const rad = ((angle - 90) * Math.PI) / 180
        const len = Math.abs(cw * Math.cos(rad)) + Math.abs(ch * Math.sin(rad))
        const x0 = cw / 2 - (Math.cos(rad) * len) / 2
        const y0 = ch / 2 - (Math.sin(rad) * len) / 2
        const x1 = cw / 2 + (Math.cos(rad) * len) / 2
        const y1 = ch / 2 + (Math.sin(rad) * len) / 2
        const grad = ctx.createLinearGradient(x0, y0, x1, y1)
        parseStops(stopsStr).forEach((st) =>
            grad.addColorStop(Math.max(0, Math.min(1, st.pos)), st.color)
        )
        return grad
    }

    const radMatch = s.match(/^radial-gradient\(\s*(.*)\s*\)$/i)
    if (radMatch) {
        const inner = radMatch[1]
        const hintMatch = inner.match(
            /^(?:ellipse|circle)?(?:\s+[\w%\s]+?)?\s+at\s+[\w%\s]+?\s*,\s*/i
        )
        const stopsStr = hintMatch ? inner.slice(hintMatch[0].length) : inner
        const r = Math.sqrt(cw * cw + ch * ch) / 2
        const grad = ctx.createRadialGradient(
            cw / 2,
            ch / 2,
            0,
            cw / 2,
            ch / 2,
            r
        )
        parseStops(stopsStr).forEach((st) =>
            grad.addColorStop(Math.max(0, Math.min(1, st.pos)), st.color)
        )
        return grad
    }

    const conicMatch = s.match(/^conic-gradient\(\s*(.*)\s*\)$/i)
    if (conicMatch) {
        const inner = conicMatch[1]
        const fromMatch = inner.match(
            /^from\s+(-?[\d.]+)deg\s+at\s+[\w%\s]+?\s*,\s*/i
        )
        const startAngle = fromMatch
            ? (parseFloat(fromMatch[1]) * Math.PI) / 180
            : 0
        const stopsStr = fromMatch ? inner.slice(fromMatch[0].length) : inner
        // @ts-ignore
        const grad = ctx.createConicGradient(startAngle, cw / 2, ch / 2)
        parseStops(stopsStr).forEach((st) =>
            grad.addColorStop(Math.max(0, Math.min(1, st.pos)), st.color)
        )
        return grad
    }

    return s
}

// ─── Spring simulator ─────────────────────────────────────────────────────────
interface SpringState {
    x: number
    y: number
    rot: number
    scale: number
    opacity: number
    vx: number
    vy: number
    vrot: number
    vscale: number
    vopacity: number
}

function springStep(
    state: SpringState,
    target: {
        x: number
        y: number
        rot: number
        scale: number
        opacity: number
    },
    stiffness: number,
    damping: number,
    dt: number
): SpringState {
    const clampedDt = Math.min(dt, 0.05)
    const ax = (target.x - state.x) * stiffness - state.vx * damping
    const ay = (target.y - state.y) * stiffness - state.vy * damping
    const ar = (target.rot - state.rot) * stiffness - state.vrot * damping
    const as_ =
        (target.scale - state.scale) * stiffness - state.vscale * damping
    const ao =
        (target.opacity - state.opacity) * stiffness - state.vopacity * damping
    return {
        x: state.x + state.vx * clampedDt,
        y: state.y + state.vy * clampedDt,
        rot: state.rot + state.vrot * clampedDt,
        scale: state.scale + state.vscale * clampedDt,
        opacity: state.opacity + state.vopacity * clampedDt,
        vx: state.vx + ax * clampedDt,
        vy: state.vy + ay * clampedDt,
        vrot: state.vrot + ar * clampedDt,
        vscale: state.vscale + as_ * clampedDt,
        vopacity: state.vopacity + ao * clampedDt,
    }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScatterPos {
    x: number
    y: number
    rotation: number
    scale: number
}
interface FinalPos {
    x: number
    y: number
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 3000
 */
export default function ScatteredTextAnimation({
    text,
    font,
    color,
    scatteredColor,
    scatteredOpacity,
    textAlign,
    padding,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    paddingPerSide,
    scatterRadius,
    rotationRange,
    scaleMin,
    staggerDelay,
    springStiffness,
    springDamping,
    scrollHeight,
    stickyOffset,
    style,
}: {
    text: string
    font: any
    color: string
    scatteredColor: string
    scatteredOpacity: number
    textAlign: "left" | "center" | "right"
    padding: number
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
    paddingPerSide: boolean
    scatterRadius: number
    rotationRange: number
    scaleMin: number
    staggerDelay: number
    springStiffness: number
    springDamping: number
    scrollHeight: number
    stickyOffset: number
    style?: React.CSSProperties
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const ghostRefs = useRef<(HTMLSpanElement | null)[]>([])
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const progressRef = useRef(0)
    const prevProgressRef = useRef(0)
    const finalPosRef = useRef<FinalPos[]>([])
    const scatterPosRef = useRef<ScatterPos[]>([])
    const springStatesRef = useRef<SpringState[]>([])
    const rafRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)
    const measuredRef = useRef(false)
    const mountSeedRef = useRef(Math.floor(Math.random() * 999983))

    const [ready, setReady] = useState(false)
    const { scrollY } = useScroll()

    // True when running inside the Framer editor canvas (iframe)
    // RenderTarget.current() is "canvas" in Framer editor, "preview" or other on live site
    const inCanvas = RenderTarget.current() === RenderTarget.canvas

    const allChars = text.split("")

    const fontStyle: React.CSSProperties = font
        ? {
              fontFamily: font.fontFamily ?? font.family ?? "sans-serif",
              fontWeight: font.fontWeight ?? font.weight ?? 400,
              fontStyle: font.fontStyle ?? font.style ?? "normal",
          }
        : { fontFamily: "sans-serif", fontWeight: 400, fontStyle: "normal" }

    const rawSize = font?.fontSize ?? font?.size ?? 32
    const fontSize: number =
        typeof rawSize === "string" ? parseFloat(rawSize) || 32 : rawSize

    const fontRef = useRef({
        fontSize,
        fontFamily: fontStyle.fontFamily as string,
        fontWeight: (fontStyle.fontWeight ?? 400).toString(),
        fontStyleStr: (fontStyle.fontStyle ?? "normal").toString(),
    })
    fontRef.current = {
        fontSize,
        fontFamily: fontStyle.fontFamily as string,
        fontWeight: (fontStyle.fontWeight ?? 400).toString(),
        fontStyleStr: (fontStyle.fontStyle ?? "normal").toString(),
    }

    const colorRef = useRef({
        textFill: color,
        scatterFill: scatteredColor,
        scatteredOpacity,
    })
    colorRef.current = {
        textFill: color,
        scatterFill: scatteredColor,
        scatteredOpacity,
    }

    // ── Measure ghost layout → final + scatter positions ──────────────────────
    const measure = useCallback(() => {
        const vp = viewportRef.current
        if (!vp) return

        const vw = vp.offsetWidth
        const vh = vp.offsetHeight
        const vpRect = vp.getBoundingClientRect()
        const scaleX = vpRect.width / vw
        const scaleY = vpRect.height / vh

        const finals: FinalPos[] = []
        const scatters: ScatterPos[] = []
        const initStates: SpringState[] = []

        mountSeedRef.current = Math.floor(Math.random() * 999983)
        const baseSeed = mountSeedRef.current

        allChars.forEach((char, i) => {
            if (char === " ") return
            const el = ghostRefs.current[i]
            const r = el ? el.getBoundingClientRect() : null

            const fx = r
                ? (r.left - vpRect.left) / scaleX +
                  r.width / scaleX / 2 -
                  vw / 2
                : 0
            const fy = r
                ? (r.top - vpRect.top) / scaleY + r.height / scaleY / 2 - vh / 2
                : 0

            const rand = seededRandom(baseSeed + i * 9301 + 49297)
            const push = 0.2 + (scatterRadius / 1200) * 0.35
            const rx = rand()
            const halfW = vw / 2
            const sx =
                textAlign === "left"
                    ? -(rx * halfW)
                    : textAlign === "right"
                      ? rx * halfW
                      : (rand() * 2 - 1) * vw * push
            const sy = (rand() * 2 - 1) * vh * push
            const srot = (rand() * 2 - 1) * rotationRange
            const ssc = scaleMin + rand() * (1 - scaleMin)

            finals.push({ x: fx, y: fy })
            scatters.push({ x: sx, y: sy, rotation: srot, scale: ssc })
            initStates.push({
                x: sx,
                y: sy,
                rot: srot,
                scale: ssc,
                opacity: 1,
                vx: 0,
                vy: 0,
                vrot: 0,
                vscale: 0,
                vopacity: 0,
            })
        })

        finalPosRef.current = finals
        scatterPosRef.current = scatters
        springStatesRef.current = initStates
        measuredRef.current = true

        // Reset progress so preview restarts from scatter on any prop change
        if (inCanvas) progressRef.current = 0

        setReady(true)
    }, [
        text,
        font,
        fontSize,
        scatterRadius,
        rotationRange,
        scaleMin,
        textAlign,
        padding,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        paddingPerSide,
    ])

    useEffect(() => {
        setReady(false)
        measuredRef.current = false
        const id = setTimeout(measure, 80)
        return () => clearTimeout(id)
    }, [measure])

    useEffect(() => {
        const ro = new ResizeObserver(measure)
        if (viewportRef.current) ro.observe(viewportRef.current)
        return () => ro.disconnect()
    }, [measure])

    // ── Rescatter on scroll-up (live site only) ───────────────────────────────
    const rescatter = useCallback(() => {
        const vp = viewportRef.current
        if (!vp) return
        const vw = vp.offsetWidth
        const vh = vp.offsetHeight
        const newSeed = Math.floor(Math.random() * 999983)
        const push = 0.2 + (scatterRadius / 1200) * 0.35
        const newScatters: ScatterPos[] = []
        allChars.forEach((char, i) => {
            if (char === " ") return
            const rand = seededRandom(newSeed + i * 9301 + 49297)
            const rx = rand()
            const halfW = vw / 2
            const sx =
                textAlign === "left"
                    ? -(rx * halfW)
                    : textAlign === "right"
                      ? rx * halfW
                      : (rand() * 2 - 1) * vw * push
            newScatters.push({
                x: sx,
                y: (rand() * 2 - 1) * vh * push,
                rotation: (rand() * 2 - 1) * rotationRange,
                scale: scaleMin + rand() * (1 - scaleMin),
            })
        })
        scatterPosRef.current = newScatters
    }, [scatterRadius, rotationRange, scaleMin, text, textAlign])

    // ── Scroll listener — skipped inside Framer canvas ────────────────────────
    useEffect(() => {
        if (inCanvas) return
        return scrollY.on("change", (y) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const top = y + rect.top - stickyOffset
            const range = Math.max(1, scrollHeight - window.innerHeight)
            const p = Math.max(0, Math.min(1, (y - top) / range))
            const prev = prevProgressRef.current
            if (p < prev && prev > 0.15 && p < 0.15) rescatter()
            prevProgressRef.current = p
            progressRef.current = p
        })
    }, [scrollY, scrollHeight, stickyOffset, rescatter, inCanvas])

    // ── Live preview (Framer canvas only) ────────────────────────────────────
    // Plays 0 -> 1 once whenever an animation prop changes, then freezes.
    // You see the effect of each tweak without continuous looping.
    useEffect(() => {
        if (!inCanvas || !ready) return

        const DURATION = 3000 // ms for one scatter -> settled play-through
        let startTime: number | null = null
        let raf: number

        // Snap spring states back to scatter so preview always starts fresh
        const scatters = scatterPosRef.current
        springStatesRef.current = springStatesRef.current.map((_, i) => {
            const s = scatters[i] ?? { x: 0, y: 0, rotation: 0, scale: 1 }
            return {
                x: s.x,
                y: s.y,
                rot: s.rotation,
                scale: s.scale,
                opacity: 1,
                vx: 0,
                vy: 0,
                vrot: 0,
                vscale: 0,
                vopacity: 0,
            }
        })
        progressRef.current = 0

        const tick = (t: number) => {
            if (!startTime) startTime = t
            const p = Math.min(1, (t - startTime) / DURATION)
            progressRef.current = p
            if (p < 1) raf = requestAnimationFrame(tick)
            // stops at p === 1, freezing in the fully settled position
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [
        inCanvas,
        ready,
        staggerDelay,
        springStiffness,
        springDamping,
        scatterRadius,
        rotationRange,
        scaleMin,
        color,
        scatteredColor,
        scatteredOpacity,
        textAlign,
    ])

    // ── RAF loop — spring simulation + canvas draw ────────────────────────────
    useEffect(() => {
        if (!ready) return

        const totalLetters = springStatesRef.current.length
        const stiffness = springStiffness
        const damping = springDamping

        const loop = (time: number) => {
            const dt = lastTimeRef.current
                ? (time - lastTimeRef.current) / 1000
                : 0.016
            lastTimeRef.current = time

            const p = progressRef.current
            const states = springStatesRef.current
            const finals = finalPosRef.current
            const scatters = scatterPosRef.current

            const {
                textFill,
                scatterFill,
                scatteredOpacity: scOpacity,
            } = colorRef.current
            const {
                fontSize: fs,
                fontFamily: ff,
                fontWeight: fw,
                fontStyleStr: fst,
            } = fontRef.current

            const staggerMs = staggerDelay
            const totalMs = staggerMs * (totalLetters - 1)
            const scrollMs = p * (totalMs + 600)

            const lpValues: number[] = []
            for (let i = 0; i < totalLetters; i++) {
                const letterMs = scrollMs - i * staggerMs
                const lp = Math.max(0, Math.min(1, letterMs / 400))
                lpValues.push(lp)

                const f = finals[i] ?? { x: 0, y: 0 }
                const s = scatters[i] ?? { x: 0, y: 0, rotation: 0, scale: 1 }

                const target = {
                    x: s.x + (f.x - s.x) * lp,
                    y: s.y + (f.y - s.y) * lp,
                    rot: s.rotation * (1 - lp),
                    scale: s.scale + (1 - s.scale) * lp,
                    opacity: 1,
                }

                states[i] = springStep(
                    states[i],
                    target,
                    stiffness,
                    damping,
                    dt
                )
            }

            // ── Draw ──────────────────────────────────────────────────────────
            const canvas = canvasRef.current
            if (canvas) {
                const ctx = canvas.getContext("2d")
                if (ctx) {
                    const dpr = window.devicePixelRatio || 1
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    ctx.save()
                    ctx.scale(dpr, dpr)

                    // All positions are in CSS pixels; buffer is dpr× larger for crispness
                    const cssW = canvas.width / dpr
                    const cssH = canvas.height / dpr
                    const cx = cssW / 2
                    const cy = cssH / 2

                    ctx.font = `${fst} ${fw} ${fs}px ${ff}`
                    ctx.textAlign = "center"
                    ctx.textBaseline = "middle"

                    const activeFill = buildFill(ctx, textFill, cssW, cssH)
                    const activeScat = buildFill(ctx, scatterFill, cssW, cssH)

                    let nonSpaceIdx = 0
                    allChars.forEach((char) => {
                        if (char === " ") return
                        const st = states[nonSpaceIdx]
                        if (!st) {
                            nonSpaceIdx++
                            return
                        }

                        const lp = lpValues[nonSpaceIdx] ?? 0
                        const isScattered = lp < 0.05

                        ctx.save()
                        ctx.globalAlpha = isScattered ? scOpacity : 1
                        ctx.fillStyle = isScattered ? activeScat : activeFill
                        ctx.translate(cx + st.x, cy + st.y)
                        ctx.rotate((st.rot * Math.PI) / 180)
                        ctx.scale(st.scale, st.scale)
                        ctx.fillText(char, 0, 0)
                        ctx.restore()

                        nonSpaceIdx++
                    })

                    ctx.restore() // pop dpr scale
                }
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(rafRef.current)
    }, [ready, springStiffness, springDamping, staggerDelay])

    // ── Canvas resize — DPR-aware for crisp Retina rendering ──────────────────
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current
            const vp = viewportRef.current
            if (!canvas || !vp) return
            const dpr = window.devicePixelRatio || 1
            const w = vp.offsetWidth
            const h = vp.offsetHeight
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = w + "px"
            canvas.style.height = h + "px"
        }
        resize()
        const ro = new ResizeObserver(resize)
        if (viewportRef.current) ro.observe(viewportRef.current)
        window.addEventListener("resize", resize)
        return () => {
            ro.disconnect()
            window.removeEventListener("resize", resize)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                width: 600,
                height: scrollHeight,
                ...style,
                position: "relative",
            }}
        >
            <div
                ref={viewportRef}
                style={{
                    position: "sticky",
                    top: stickyOffset,
                    height: "100vh",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* Ghost layer — invisible, purely for layout measurement */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent:
                            textAlign === "left"
                                ? "flex-start"
                                : textAlign === "right"
                                  ? "flex-end"
                                  : "center",
                        alignContent: "center",
                        paddingTop: paddingPerSide ? paddingTop : padding,
                        paddingRight: paddingPerSide ? paddingRight : padding,
                        paddingBottom: paddingPerSide ? paddingBottom : padding,
                        paddingLeft: paddingPerSide ? paddingLeft : padding,
                        lineHeight: 1.3,
                        pointerEvents: "none",
                        opacity: 0,
                        boxSizing: "border-box",
                    }}
                >
                    {(() => {
                        const groups: { chars: string[]; indices: number[] }[] =
                            []
                        let currentWord: string[] = [],
                            currentIdx: number[] = []
                        allChars.forEach((char, i) => {
                            if (char === " ") {
                                if (currentWord.length) {
                                    groups.push({
                                        chars: currentWord,
                                        indices: currentIdx,
                                    })
                                    currentWord = []
                                    currentIdx = []
                                }
                                groups.push({ chars: [" "], indices: [i] })
                            } else {
                                currentWord.push(char)
                                currentIdx.push(i)
                            }
                        })
                        if (currentWord.length)
                            groups.push({
                                chars: currentWord,
                                indices: currentIdx,
                            })

                        return groups.map((group, gi) => (
                            <span
                                key={gi}
                                style={{
                                    display: "inline-block",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {group.chars.map((char, ci) => (
                                    <span
                                        key={ci}
                                        ref={(el) => {
                                            ghostRefs.current[
                                                group.indices[ci]
                                            ] = el
                                        }}
                                        style={{
                                            display: "inline-block",
                                            fontSize,
                                            ...fontStyle,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {char === " " ? "\u00A0" : char}
                                    </span>
                                ))}
                            </span>
                        ))
                    })()}
                </div>

                {/* Canvas — spring-animated letters drawn here */}
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                />
            </div>
        </div>
    )
}

ScatteredTextAnimation.defaultProps = {
    text: "Letters find their way home",
    color: "#ffffff",
    scatteredColor: "#ff4444",
    scatteredOpacity: 1,
    textAlign: "center" as "left" | "center" | "right",
    padding: 40,
    paddingTop: 40,
    paddingRight: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingPerSide: false,
    scatterRadius: 300,
    rotationRange: 140,
    scaleMin: 0.5,
    staggerDelay: 60,
    springStiffness: 120,
    springDamping: 14,
    scrollHeight: 3000,
    stickyOffset: 0,
    style: { width: 600, height: 3000 },
}

addPropertyControls(ScatteredTextAnimation, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Letters find their way home",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    scatteredColor: {
        type: ControlType.Color,
        title: "Scattered Color",
        defaultValue: "#ff4444",
    },
    scatteredOpacity: {
        type: ControlType.Number,
        title: "Scattered Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    textAlign: {
        type: ControlType.SegmentedEnum,
        title: "Alignment",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
    },
    padding: {
        type: ControlType.FusedNumber,
        title: "Padding",
        defaultValue: 40,
        toggleKey: "paddingPerSide",
        toggleTitles: ["All", "Individual"],
        valueKeys: [
            "paddingTop",
            "paddingRight",
            "paddingBottom",
            "paddingLeft",
        ],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
    },
    scatterRadius: {
        type: ControlType.Number,
        title: "Scatter Radius",
        defaultValue: 300,
        min: 50,
        max: 1200,
        step: 10,
        unit: "px",
        description: "How far letters are thrown across the viewport",
    },
    rotationRange: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 140,
        min: 0,
        max: 360,
        step: 5,
        unit: "°",
        description: "Max spin angle of scattered letters",
    },
    scaleMin: {
        type: ControlType.Number,
        title: "Min Scale",
        defaultValue: 0.5,
        min: 0.1,
        max: 1,
        step: 0.05,
        description: "How small letters shrink when scattered",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 60,
        min: 0,
        max: 300,
        step: 5,
        unit: "ms",
        description: "Time gap between each letter starting to settle",
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 120,
        min: 20,
        max: 400,
        step: 5,
        description: "How fast letters snap into place — higher = snappier",
    },
    springDamping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 14,
        min: 1,
        max: 40,
        step: 1,
        description: "How much letters overshoot — lower = more bounce",
    },
    scrollHeight: {
        type: ControlType.Number,
        title: "Scroll Height",
        defaultValue: 3000,
        min: 850,
        max: 10000,
        step: 10,
        unit: "px",
        description: "Total scrollable height — controls animation duration",
    },
    stickyOffset: {
        type: ControlType.Number,
        title: "Sticky Offset",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        description: "Top offset for sticky panel (e.g. navbar height)",
    },
})
