import * as React from "react"
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ===============================
   Grouped prop types
================================ */
type Props = {
    appearance: {
        startColor: string
        endColor: string
        opacity: number
        lineWeight: number
    }
    lines: {
        lineDensity: number
        lineVariation: number
    }
    wave: {
        waveHeight: number
        waveComplexity: number
    }
    interaction: {
        influenceSize: number
        paintMode: boolean
        rippleIntensity: number
        rippleFrequency: number
        rippleDecay: number
        brushStrength: number
        brushResistance: number
    }
    animation: {
        breathingDepth: number
        breathingSpeed: number
    }
}

export default function TopographicContourLines({
    appearance = {
        startColor: "#A855F7",
        endColor: "#60A5FA",
        opacity: 0.7,
        lineWeight: 1,
    },
    lines = {
        lineDensity: 10,
        lineVariation: 8,
    },
    wave = {
        waveHeight: 30,
        waveComplexity: 5,
    },
    interaction = {
        influenceSize: 240,
        paintMode: false,
        rippleIntensity: 22,
        rippleFrequency: 0.025,
        rippleDecay: 0.08,
        brushStrength: 0.18,
        brushResistance: 0.02,
    },
    animation = {
        breathingDepth: 10,
        breathingSpeed: 0.15,
    },
}: Props) {
    // Destructure groups for convenient access
    const { startColor, endColor, opacity, lineWeight } = appearance
    const { lineDensity, lineVariation } = lines
    const { waveHeight, waveComplexity } = wave
    const {
        influenceSize,
        paintMode,
        rippleIntensity,
        rippleFrequency,
        rippleDecay,
        brushStrength,
        brushResistance,
    } = interaction
    const { breathingDepth, breathingSpeed } = animation

    // Hardcoded internals (not user-adjustable)
    const mouseSmoothing = 0 // zero lag
    const curveTension = 10 // maximum line softness
    const envelopeStrength = 0.6 // kept internally at default
    const envelopeScale = 0.0025 // kept internally at default
    const lineDetail = 500 // hardcoded, not adjustable
    // Map user-friendly 0-10 scale to internal 0.001-0.03 range
    const waveComplexityInternal = 0.001 + (waveComplexity / 10) * 0.029

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const rafRef = useRef<number | null>(null)

    const sizeRef = useRef({ w: 0, h: 0 })

    const mouseRef = useRef({ x: -1000, y: -1000 })
    const targetMouseRef = useRef({ x: -1000, y: -1000 })
    const prevMouseRef = useRef({ x: -1000, y: -1000 })

    const seedRef = useRef(Math.random() * 100000)
    const t0Ref = useRef<number>(0)

    const baseYRef = useRef<number[]>([])
    const lineCountRef = useRef<number>(0)

    const blendARef = useRef<number[]>([])
    const blendBRef = useRef<number[]>([])
    const blendTRef = useRef<number[]>([])

    const controlWavesRef = useRef<Float32Array[]>([])
    const controlYJitterRef = useRef<number[]>([])

    const offsetsRef = useRef<Float32Array[]>([])

    const isTouch =
        typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0)

    /* ===============================
       Mouse tracking
    ================================ */
    useEffect(() => {
        if (typeof window === "undefined") return
        if (isTouch) return

        const onMove = (e: MouseEvent) => {
            targetMouseRef.current.x = e.clientX
            targetMouseRef.current.y = e.clientY
        }

        window.addEventListener("mousemove", onMove)
        return () => window.removeEventListener("mousemove", onMove)
    }, [isTouch])

    /* ===============================
       Build blended contour field
    ================================ */
    useEffect(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
        const safeInterval = Math.max(1, Math.floor(lineVariation))

        const hash01 = (a: number, b: number, seed: number) => {
            const s =
                Math.sin(a * 127.1 + b * 311.7 + seed * 1013.9) * 43758.5453123
            return s - Math.floor(s)
        }

        const buildControlWave = (
            controlLineIndex: number,
            N: number,
            w: number,
            ns: number,
            amp: number,
            envStrength: number,
            envScale: number,
            seed: number
        ) => {
            const n1 = hash01(controlLineIndex, 1, seed)
            const n2 = hash01(controlLineIndex, 2, seed)
            const n3 = hash01(controlLineIndex, 3, seed)
            const n4 = hash01(controlLineIndex, 4, seed)
            const n5 = hash01(controlLineIndex, 5, seed)
            const n6 = hash01(controlLineIndex, 6, seed)

            const a1 = 0.55 + n1 * 0.35
            const a2 = 0.25 + n2 * 0.25
            const a3 = 0.1 + n3 * 0.2

            const f1 = 0.6 + n4 * 1.0
            const f2 = 1.2 + n5 * 1.2
            const f3 = 2.2 + n6 * 1.6

            const p1 = hash01(controlLineIndex, 11, seed) * Math.PI * 2
            const p2 = hash01(controlLineIndex, 12, seed) * Math.PI * 2
            const p3 = hash01(controlLineIndex, 13, seed) * Math.PI * 2

            const ef1 = 0.6 + hash01(controlLineIndex, 201, seed) * 1.2
            const ef2 = 1.1 + hash01(controlLineIndex, 202, seed) * 1.6
            const ep1 = hash01(controlLineIndex, 211, seed) * Math.PI * 2
            const ep2 = hash01(controlLineIndex, 212, seed) * Math.PI * 2

            const wave = new Float32Array(N)
            for (let i = 0; i < N; i++) {
                const x = (i / (N - 1)) * w
                const u = x * ns

                const base =
                    Math.sin(u * f1 + p1) * a1 +
                    Math.sin(u * f2 + p2) * a2 +
                    Math.sin(u * f3 + p3) * a3

                const eu = x * envScale
                const envRaw =
                    Math.sin(eu * ef1 + ep1) * 0.65 +
                    Math.sin(eu * ef2 + ep2) * 0.35
                const env = 1 + clamp01(envStrength) * envRaw

                wave[i] = base * amp * env
            }
            return wave
        }

        const rebuild = () => {
            const dpr = window.devicePixelRatio || 1
            const w = window.innerWidth
            const h = window.innerHeight
            sizeRef.current = { w, h }

            canvas.width = Math.max(1, Math.floor(w * dpr))
            canvas.height = Math.max(1, Math.floor(h * dpr))
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            const sp = Math.max(8, lineDensity)
            const pad = sp * 2
            const lineCount = Math.max(2, Math.ceil((h + pad * 2) / sp))
            lineCountRef.current = lineCount

            const N = Math.max(24, Math.floor(lineDetail))
            const ns = Math.max(0.0001, waveComplexityInternal)
            const amp = Math.max(0, waveHeight)

            const baseY: number[] = new Array(lineCount)
            for (let li = 0; li < lineCount; li++) {
                baseY[li] = -pad + li * sp + sp * 0.5
            }
            baseYRef.current = baseY

            const controlLineIndices: number[] = []
            for (let li = 0; li < lineCount; li += safeInterval) {
                controlLineIndices.push(li)
            }
            if (
                controlLineIndices[controlLineIndices.length - 1] !==
                lineCount - 1
            ) {
                controlLineIndices.push(lineCount - 1)
            }

            const seed = seedRef.current

            const controlWaves: Float32Array[] = []
            const controlYJitter: number[] = []
            for (let ci = 0; ci < controlLineIndices.length; ci++) {
                const lineIndex = controlLineIndices[ci]
                const jy = (hash01(lineIndex, 99, seed) - 0.5) * sp * 0.35
                controlYJitter.push(jy)
                controlWaves.push(
                    buildControlWave(
                        lineIndex,
                        N,
                        w,
                        ns,
                        amp,
                        envelopeStrength,
                        envelopeScale,
                        seed
                    )
                )
            }
            controlWavesRef.current = controlWaves
            controlYJitterRef.current = controlYJitter

            const blendA = new Array<number>(lineCount)
            const blendB = new Array<number>(lineCount)
            const blendT = new Array<number>(lineCount)

            let currentControl = 0
            for (let li = 0; li < lineCount; li++) {
                while (
                    currentControl < controlLineIndices.length - 2 &&
                    li > controlLineIndices[currentControl + 1]
                ) {
                    currentControl++
                }

                const aLine = controlLineIndices[currentControl]
                const bLine =
                    controlLineIndices[
                        Math.min(
                            currentControl + 1,
                            controlLineIndices.length - 1
                        )
                    ]
                const aIdx = currentControl
                const bIdx = Math.min(
                    currentControl + 1,
                    controlLineIndices.length - 1
                )

                const denom = Math.max(1, bLine - aLine)
                const t = clamp01((li - aLine) / denom)

                blendA[li] = aIdx
                blendB[li] = bIdx
                blendT[li] = t
            }

            blendARef.current = blendA
            blendBRef.current = blendB
            blendTRef.current = blendT

            const offsets: Float32Array[] = new Array(lineCount)
            for (let li = 0; li < lineCount; li++)
                offsets[li] = new Float32Array(N)
            offsetsRef.current = offsets
        }

        rebuild()
        window.addEventListener("resize", rebuild)
        return () => window.removeEventListener("resize", rebuild)
    }, [lineDensity, lineVariation, waveHeight, waveComplexity])

    /* ===============================
       Render loop
    ================================ */
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        if (typeof window === "undefined") return

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t
        const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

        const drawSmoothLine = (
            xs: Float32Array,
            ys: Float32Array,
            tension: number
        ) => {
            const n = xs.length
            if (n < 2) return

            const t = clamp01(tension)
            const k = ((1 - t) * 1) / 6

            ctx.beginPath()
            ctx.moveTo(xs[0], ys[0])

            for (let i = 0; i < n - 1; i++) {
                const x0 = xs[Math.max(0, i - 1)]
                const y0 = ys[Math.max(0, i - 1)]
                const x1 = xs[i]
                const y1 = ys[i]
                const x2 = xs[i + 1]
                const y2 = ys[i + 1]
                const x3 = xs[Math.min(n - 1, i + 2)]
                const y3 = ys[Math.min(n - 1, i + 2)]

                const cp1x = x1 + (x2 - x0) * k
                const cp1y = y1 + (y2 - y0) * k
                const cp2x = x2 - (x3 - x1) * k
                const cp2y = y2 - (y3 - y1) * k

                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2)
            }

            ctx.stroke()
        }

        let xs = new Float32Array(0)
        let ys = new Float32Array(0)

        const draw = (now: number) => {
            if (!t0Ref.current) t0Ref.current = now
            const time = (now - t0Ref.current) / 1000

            mouseRef.current.x = lerp(
                mouseRef.current.x,
                targetMouseRef.current.x,
                mouseSmoothing === 0 ? 1 : mouseSmoothing
            )
            mouseRef.current.y = lerp(
                mouseRef.current.y,
                targetMouseRef.current.y,
                mouseSmoothing === 0 ? 1 : mouseSmoothing
            )

            const mx = mouseRef.current.x
            const my = mouseRef.current.y
            const hasMouse = mx > -999 && my > -999

            const mvx = mx - prevMouseRef.current.x
            const mvy = my - prevMouseRef.current.y
            prevMouseRef.current.x = mx
            prevMouseRef.current.y = my
            const speed = Math.sqrt(mvx * mvx + mvy * mvy)

            const { w, h } = sizeRef.current
            ctx.clearRect(0, 0, w, h)

            const grad = ctx.createLinearGradient(0, 0, w, 0)
            grad.addColorStop(0, startColor)
            grad.addColorStop(1, endColor)

            ctx.save()
            ctx.globalAlpha = clamp01(opacity)
            ctx.strokeStyle = grad
            ctx.lineWidth = Math.max(0.1, lineWeight)
            ctx.lineJoin = "round"
            ctx.lineCap = "round"

            const baseY = baseYRef.current
            const offsets = offsetsRef.current
            const blendA = blendARef.current
            const blendB = blendBRef.current
            const blendT = blendTRef.current
            const controlWaves = controlWavesRef.current
            const controlYJitter = controlYJitterRef.current

            if (!baseY.length || !offsets.length || !controlWaves.length) {
                ctx.restore()
                rafRef.current = requestAnimationFrame(draw)
                return
            }

            const lineCount = lineCountRef.current
            const N = offsets[0]?.length ?? Math.max(24, Math.floor(lineDetail))

            if (xs.length !== N) {
                xs = new Float32Array(N)
                ys = new Float32Array(N)
                for (let i = 0; i < N; i++) xs[i] = (i / (N - 1)) * w
            } else {
                for (let i = 0; i < N; i++) xs[i] = (i / (N - 1)) * w
            }

            const stepX = w / (N - 1)
            const R = Math.max(1, influenceSize)
            const invR = 1 / R

            const speedFactor = 1 / (1 + speed * Math.max(0, brushResistance))

            for (let li = 0; li < lineCount; li++) {
                const off = offsets[li]

                for (let i = 0; i < N; i++) {
                    if (!paintMode) {
                        off[i] = lerp(off[i], 0, clamp01(rippleDecay))
                    }
                    if (!hasMouse) continue

                    const x = i * stepX
                    const dx = x - mx

                    const aIdx = blendA[li]
                    const bIdx = blendB[li]
                    const t = blendT[li]
                    const jy = lerp(
                        controlYJitter[aIdx] ?? 0,
                        controlYJitter[bIdx] ?? 0,
                        t
                    )

                    const yBase = baseY[li] + jy
                    const dy = yBase - my
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const fall = clamp01(1 - dist * invR)
                    if (fall <= 0) continue

                    if (paintMode) {
                        const drag = brushStrength * fall * speedFactor
                        off[i] += mvy * drag
                    } else {
                        const wave = Math.sin(
                            dist * rippleFrequency -
                                time * (breathingSpeed * 2.0)
                        )
                        off[i] += wave * rippleIntensity * fall * speedFactor
                    }
                }
            }

            for (let li = 0; li < lineCount; li++) {
                const aIdx = blendA[li]
                const bIdx = blendB[li]
                const t = blendT[li]

                const waveA = controlWaves[aIdx]
                const waveB = controlWaves[bIdx]
                if (!waveA || !waveB) continue

                const jy = lerp(
                    controlYJitter[aIdx] ?? 0,
                    controlYJitter[bIdx] ?? 0,
                    t
                )

                const off = offsets[li]

                for (let i = 0; i < N; i++) {
                    const x = xs[i]
                    const baseWave = lerp(waveA[i], waveB[i], t)

                    const drift =
                        breathingDepth *
                        Math.sin(time * breathingSpeed + x * 0.01 + li * 0.12)

                    ys[i] = baseY[li] + jy + baseWave + drift * 0.35 + off[i]
                }

                drawSmoothLine(xs, ys, curveTension)
            }

            ctx.restore()
            rafRef.current = requestAnimationFrame(draw)
        }

        rafRef.current = requestAnimationFrame(draw)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            t0Ref.current = 0
        }
    }, [
        startColor,
        endColor,
        opacity,
        lineWeight,
        influenceSize,
        rippleIntensity,
        rippleFrequency,
        rippleDecay,
        paintMode,
        brushStrength,
        brushResistance,
        breathingDepth,
        breathingSpeed,
        isTouch,
    ])

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
                zIndex: 0,
            }}
        >
            <canvas ref={canvasRef} />
        </div>
    )
}

/* ===============================
   Controls
=============================== */
addPropertyControls(TopographicContourLines, {
    // Appearance
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            startColor: {
                type: ControlType.Color,
                title: "Start",
                defaultValue: "#A855F7",
            },
            endColor: {
                type: ControlType.Color,
                title: "End",
                defaultValue: "#60A5FA",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.7,
            },
            lineWeight: {
                type: ControlType.Number,
                title: "Weight",
                min: 0.1,
                max: 6,
                step: 0.1,
                defaultValue: 1,
            },
        },
    },

    // Lines
    lines: {
        type: ControlType.Object,
        title: "Lines",
        controls: {
            lineDensity: {
                type: ControlType.Number,
                title: "Density",
                description:
                    "How many lines appear on screen. Lower = fewer, more spaced-out lines.",
                min: 8,
                max: 120,
                step: 1,
                defaultValue: 10,
            },
            lineVariation: {
                type: ControlType.Number,
                title: "Variation",
                description:
                    "How different each line's shape is from its neighbours. Lower = more uniform, higher = more varied.",
                min: 2,
                max: 40,
                step: 1,
                defaultValue: 8,
            },
        },
    },

    // Wave
    wave: {
        type: ControlType.Object,
        title: "Wave",
        controls: {
            waveHeight: {
                type: ControlType.Number,
                title: "Height",
                description:
                    "How far lines deviate up and down from their baseline position.",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 30,
            },
            waveComplexity: {
                type: ControlType.Number,
                title: "Complexity",
                description:
                    "How intricate the wave shapes are. 0 = very smooth and simple, 10 = detailed and irregular.",
                min: 0,
                max: 10,
                step: 1,
                defaultValue: 5,
            },
        },
    },

    // Interaction
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            influenceSize: {
                type: ControlType.Number,
                title: "Radius",
                description:
                    "Area around the cursor that affects the lines. Larger = wider disturbance.",
                min: 40,
                max: 900,
                step: 10,
                defaultValue: 240,
            },
            paintMode: {
                type: ControlType.Boolean,
                title: "Paint Mode",
                description:
                    "Off = lines ripple and spring back. On = lines are pushed and stay where dragged.",
                defaultValue: false,
            },
            rippleIntensity: {
                type: ControlType.Number,
                title: "Intensity",
                description:
                    "How strongly the cursor displaces lines as you move over them.",
                min: 0,
                max: 140,
                step: 1,
                defaultValue: 22,
                hidden: (p) => p.paintMode,
            },
            rippleFrequency: {
                type: ControlType.Number,
                title: "Density",
                description:
                    "How tightly packed the ripple waves are around the cursor.",
                min: 0.005,
                max: 0.12,
                step: 0.005,
                defaultValue: 0.025,
                hidden: (p) => p.paintMode,
            },
            rippleDecay: {
                type: ControlType.Number,
                title: "Decay",
                description:
                    "How quickly lines return to their original position after being disturbed.",
                min: 0.01,
                max: 0.5,
                step: 0.01,
                defaultValue: 0.08,
                hidden: (p) => p.paintMode,
            },
            brushStrength: {
                type: ControlType.Number,
                title: "Strength",
                description:
                    "How far lines are pushed when dragging in Paint Mode.",
                min: 0,
                max: 10,
                step: 0.01,
                defaultValue: 0.18,
                hidden: (p) => !p.paintMode,
            },
            brushResistance: {
                type: ControlType.Number,
                title: "Resistance",
                description:
                    "Reduces the brush effect at high cursor speeds — slower movement = stronger push.",
                min: 0,
                max: 0.2,
                step: 0.005,
                defaultValue: 0.02,
                hidden: (p) => !p.paintMode,
            },
        },
    },

    // Animation
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            breathingDepth: {
                type: ControlType.Number,
                title: "Depth",
                description:
                    "How much the lines drift up and down in the idle animation. 0 = completely still.",
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 10,
            },
            breathingSpeed: {
                type: ControlType.Number,
                title: "Speed",
                description:
                    "How fast the idle drift animation cycles. Higher = faster.",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 0.15,
            },
        },
    },
})
