// Interactive grid of vertical lines that ripple with noise-based motion and
// react to the cursor/touch, similar to the classic "fluid lines" hero effect.
import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Bundled 2D simplex noise (classic Gustavson-style implementation) so the
// component has no runtime dependency on an external CDN.
function buildPermutationTable(seed: number) {
    const table = new Uint8Array(256)
    for (let i = 0; i < 256; i++) table[i] = i

    let s = seed * 65536
    for (let i = 255; i > 0; i--) {
        s = (s * 16807) % 2147483647
        const n = Math.floor((s / 2147483647) * (i + 1))
        const q = table[i]
        table[i] = table[n]
        table[n] = q
    }
    return table
}

function createNoise2D(seed = Math.random()) {
    const p = buildPermutationTable(seed)
    const perm = new Uint8Array(512)
    const permMod12 = new Uint8Array(512)
    for (let i = 0; i < 512; i++) {
        perm[i] = p[i & 255]
        permMod12[i] = perm[i] % 12
    }

    const grad2 = [
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
        [1, 0],
        [-1, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [0, 1],
        [0, -1],
    ]

    const F2 = 0.5 * (Math.sqrt(3) - 1)
    const G2 = (3 - Math.sqrt(3)) / 6

    return function noise2D(x: number, y: number): number {
        let n0 = 0
        let n1 = 0
        let n2 = 0

        const s = (x + y) * F2
        const i = Math.floor(x + s)
        const j = Math.floor(y + s)
        const t = (i + j) * G2
        const X0 = i - t
        const Y0 = j - t
        const x0 = x - X0
        const y0 = y - Y0

        let i1: number
        let j1: number
        if (x0 > y0) {
            i1 = 1
            j1 = 0
        } else {
            i1 = 0
            j1 = 1
        }

        const x1 = x0 - i1 + G2
        const y1 = y0 - j1 + G2
        const x2 = x0 - 1 + 2 * G2
        const y2 = y0 - 1 + 2 * G2

        const ii = i & 255
        const jj = j & 255

        let t0 = 0.5 - x0 * x0 - y0 * y0
        if (t0 >= 0) {
            t0 *= t0
            const gi0 = permMod12[ii + perm[jj]]
            n0 = t0 * t0 * (grad2[gi0][0] * x0 + grad2[gi0][1] * y0)
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1
        if (t1 >= 0) {
            t1 *= t1
            const gi1 = permMod12[ii + i1 + perm[jj + j1]]
            n1 = t1 * t1 * (grad2[gi1][0] * x1 + grad2[gi1][1] * y1)
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2
        if (t2 >= 0) {
            t2 *= t2
            const gi2 = permMod12[ii + 1 + perm[jj + 1]]
            n2 = t2 * t2 * (grad2[gi2][0] * x2 + grad2[gi2][1] * y2)
        }

        return 70 * (n0 + n1 + n2)
    }
}

interface Point {
    x: number
    y: number
    wave: { x: number; y: number }
    cursor: {
        x: number
        y: number
        vx: number
        vy: number
    }
}

interface WavesProps {
    strokeColor: string
    backgroundColor: string
    pointerSize: number
    showPointer: boolean
    spacing: number
    style?: CSSProperties
}

/**
 * Waves
 *
 * A full-bleed grid of vertical lines that gently ripple and bend toward the
 * cursor or touch point.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Waves(props: WavesProps) {
    const {
        strokeColor = "#ffffff",
        backgroundColor = "#000000",
        pointerSize = 0.5,
        showPointer = true,
        spacing = 8,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const isStatic = useIsStaticRenderer()

    const mouseRef = useRef({
        x: -10,
        y: 0,
        lx: 0,
        ly: 0,
        sx: 0,
        sy: 0,
        v: 0,
        vs: 0,
        a: 0,
        set: false,
    })
    const pathsRef = useRef<SVGPathElement[]>([])
    const linesRef = useRef<Point[][]>([])
    const noiseRef = useRef<((x: number, y: number) => number) | null>(null)
    const rafRef = useRef<number | null>(null)
    const boundingRef = useRef<DOMRect | null>(null)
    const isVisibleRef = useRef(false)
    const isActiveRef = useRef(false)
    const loopControlRef = useRef<() => void>(() => {})

    const onPointerActive = () => {
        isActiveRef.current = true
        loopControlRef.current()
    }

    const onPointerInactive = () => {
        isActiveRef.current = false
        loopControlRef.current()
    }

    useEffect(() => {
        if (!containerRef.current || !svgRef.current) return

        noiseRef.current = createNoise2D()

        setSize()
        setLines()

        if (isStatic) {
            drawLines()
            return
        }

        window.addEventListener("resize", onResize)
        containerRef.current.addEventListener("mousemove", onMouseMove)
        containerRef.current.addEventListener("mouseenter", onPointerActive)
        containerRef.current.addEventListener("mouseleave", onPointerInactive)
        containerRef.current.addEventListener("touchstart", onPointerActive, {
            passive: true,
        })
        containerRef.current.addEventListener("touchmove", onTouchMove, {
            passive: false,
        })
        containerRef.current.addEventListener("touchend", onPointerInactive)
        containerRef.current.addEventListener("touchcancel", onPointerInactive)

        const startLoop = () => {
            if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(tick)
            }
        }

        const stopLoop = () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }

        const evaluateLoop = () => {
            if (isVisibleRef.current && isActiveRef.current) {
                startLoop()
            } else {
                stopLoop()
            }
        }

        loopControlRef.current = evaluateLoop

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
                evaluateLoop()
            },
            { threshold: 0 }
        )
        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
            stopLoop()
            window.removeEventListener("resize", onResize)
            containerRef.current?.removeEventListener("mousemove", onMouseMove)
            containerRef.current?.removeEventListener(
                "mouseenter",
                onPointerActive
            )
            containerRef.current?.removeEventListener(
                "mouseleave",
                onPointerInactive
            )
            containerRef.current?.removeEventListener(
                "touchstart",
                onPointerActive
            )
            containerRef.current?.removeEventListener("touchmove", onTouchMove)
            containerRef.current?.removeEventListener(
                "touchend",
                onPointerInactive
            )
            containerRef.current?.removeEventListener(
                "touchcancel",
                onPointerInactive
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, spacing])

    const setSize = () => {
        if (!containerRef.current || !svgRef.current) return

        boundingRef.current = containerRef.current.getBoundingClientRect()
        const { width, height } = boundingRef.current

        svgRef.current.style.width = `${width}px`
        svgRef.current.style.height = `${height}px`
    }

    const setLines = () => {
        if (!svgRef.current || !boundingRef.current) return

        const { width, height } = boundingRef.current
        linesRef.current = []

        pathsRef.current.forEach((path) => path.remove())
        pathsRef.current = []

        const xGap = Math.max(2, spacing)
        const yGap = Math.max(2, spacing)

        const oWidth = width + 200
        const oHeight = height + 30

        const totalLines = Math.ceil(oWidth / xGap)
        const totalPoints = Math.ceil(oHeight / yGap)

        const xStart = (width - xGap * totalLines) / 2
        const yStart = (height - yGap * totalPoints) / 2

        for (let i = 0; i < totalLines; i++) {
            const points: Point[] = []

            for (let j = 0; j < totalPoints; j++) {
                points.push({
                    x: xStart + xGap * i,
                    y: yStart + yGap * j,
                    wave: { x: 0, y: 0 },
                    cursor: { x: 0, y: 0, vx: 0, vy: 0 },
                })
            }

            const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            )
            path.setAttribute("fill", "none")
            path.setAttribute("stroke", strokeColor)
            path.setAttribute("stroke-width", "1")

            svgRef.current.appendChild(path)
            pathsRef.current.push(path)
            linesRef.current.push(points)
        }
    }

    const onResize = () => {
        setSize()
        setLines()
    }

    const onMouseMove = (e: MouseEvent) => {
        updateMousePosition(e.pageX, e.pageY)
    }

    const onTouchMove = (e: TouchEvent) => {
        e.preventDefault()
        const touch = e.touches[0]
        updateMousePosition(touch.pageX, touch.pageY)
    }

    const updateMousePosition = (x: number, y: number) => {
        if (!boundingRef.current) return

        const mouse = mouseRef.current
        mouse.x = x - boundingRef.current.left
        mouse.y = y - boundingRef.current.top + window.scrollY

        if (!mouse.set) {
            mouse.sx = mouse.x
            mouse.sy = mouse.y
            mouse.lx = mouse.x
            mouse.ly = mouse.y
            mouse.set = true
        }

        if (containerRef.current) {
            containerRef.current.style.setProperty("--x", `${mouse.sx}px`)
            containerRef.current.style.setProperty("--y", `${mouse.sy}px`)
        }
    }

    const movePoints = (time: number) => {
        const { current: lines } = linesRef
        const { current: mouse } = mouseRef
        const { current: noise } = noiseRef

        if (!noise) return

        lines.forEach((points) => {
            points.forEach((p: Point) => {
                const move =
                    noise(
                        (p.x + time * 0.008) * 0.003,
                        (p.y + time * 0.003) * 0.002
                    ) * 8

                p.wave.x = Math.cos(move) * 12
                p.wave.y = Math.sin(move) * 6

                const dx = p.x - mouse.sx
                const dy = p.y - mouse.sy
                const d = Math.hypot(dx, dy)
                const l = Math.max(175, mouse.vs)

                if (d < l) {
                    const s = 1 - d / l
                    const f = Math.cos(d * 0.001) * s

                    p.cursor.vx +=
                        Math.cos(mouse.a) * f * l * mouse.vs * 0.00035
                    p.cursor.vy +=
                        Math.sin(mouse.a) * f * l * mouse.vs * 0.00035
                }

                p.cursor.vx += (0 - p.cursor.x) * 0.01
                p.cursor.vy += (0 - p.cursor.y) * 0.01

                p.cursor.vx *= 0.95
                p.cursor.vy *= 0.95

                p.cursor.x += p.cursor.vx
                p.cursor.y += p.cursor.vy

                p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x))
                p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y))
            })
        })
    }

    const moved = (point: Point, withCursorForce = true) => ({
        x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
        y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
    })

    const drawLines = () => {
        const { current: lines } = linesRef
        const { current: paths } = pathsRef

        lines.forEach((points, lIndex) => {
            if (points.length < 2 || !paths[lIndex]) return

            const firstPoint = moved(points[0], false)
            let d = `M ${firstPoint.x} ${firstPoint.y}`

            for (let i = 1; i < points.length; i++) {
                const current = moved(points[i])
                d += `L ${current.x} ${current.y}`
            }

            paths[lIndex].setAttribute("d", d)
        })
    }

    const tick = (time: number) => {
        const { current: mouse } = mouseRef

        mouse.sx += (mouse.x - mouse.sx) * 0.1
        mouse.sy += (mouse.y - mouse.sy) * 0.1

        const dx = mouse.x - mouse.lx
        const dy = mouse.y - mouse.ly
        const d = Math.hypot(dx, dy)

        mouse.v = d
        mouse.vs += (d - mouse.vs) * 0.1
        mouse.vs = Math.min(100, mouse.vs)

        mouse.lx = mouse.x
        mouse.ly = mouse.y
        mouse.a = Math.atan2(dy, dx)

        if (containerRef.current) {
            containerRef.current.style.setProperty("--x", `${mouse.sx}px`)
            containerRef.current.style.setProperty("--y", `${mouse.sy}px`)
        }

        movePoints(time)
        drawLines()

        rafRef.current = requestAnimationFrame(tick)
    }

    return (
        <div
            ref={containerRef}
            style={
                {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    backgroundColor,
                    "--x": "-0.5rem",
                    "--y": "50%",
                } as CSSProperties
            }
        >
            <svg
                ref={svgRef}
                style={{ display: "block", width: "100%", height: "100%" }}
                xmlns="http://www.w3.org/2000/svg"
            />
            {showPointer && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: `${pointerSize}rem`,
                        height: `${pointerSize}rem`,
                        background: strokeColor,
                        borderRadius: "50%",
                        transform:
                            "translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)",
                        willChange: "transform",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(Waves, {
    strokeColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#ffffff",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    spacing: {
        type: ControlType.Number,
        title: "Line Spacing",
        defaultValue: 8,
        min: 4,
        max: 30,
        step: 1,
    },
    showPointer: {
        type: ControlType.Boolean,
        title: "Show Pointer",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    pointerSize: {
        type: ControlType.Number,
        title: "Pointer Size",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
        unit: "rem",
        hidden: ({ showPointer }) => !showPointer,
    },
})
