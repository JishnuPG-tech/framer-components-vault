// Instructions: Create a Framer component that recreates “avathiery.com | Escher Cube Field” with an SVG cube field that flips near the cursor, plus optional centered overlay text.

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


type CubeNode = {
    g: SVGGElement
    cx: number
    cy: number
    top: SVGPolygonElement
    left: SVGPolygonElement
    right: SVGPolygonElement
    flipped: boolean
}

interface Props {
    backgroundColor: string

    cubeSize: number
    flipRadius: number
    transitionSeconds: number

    topColor: string
    leftColor: string
    rightColor: string

    flippedTopColor: string
    flippedLeftColor: string
    flippedRightColor: string

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

/**
 * Escher Cube Field
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function EscherCubeField(props: Props) {
    const {
        backgroundColor,
        cubeSize,
        flipRadius,
        transitionSeconds,
        topColor,
        leftColor,
        rightColor,
        flippedTopColor,
        flippedLeftColor,
        flippedRightColor,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const svgRef = React.useRef<SVGSVGElement | null>(null)

    const cubesRef = React.useRef<CubeNode[]>([])
    const rafRef = React.useRef<number | null>(null)
    const cursorRef = React.useRef({ x: -99999, y: -99999, active: false })

    const COS30 = React.useMemo(() => Math.cos(Math.PI / 6), [])
    const SVG_NS = "http://www.w3.org/2000/svg"

    const transition = React.useMemo(() => {
        const t = clamp(transitionSeconds, 0, 5)
        return `fill ${t}s cubic-bezier(0.22, 1, 0.36, 1)`
    }, [transitionSeconds])

    const paintCube = React.useCallback(
        (cube: CubeNode, flip: boolean) => {
            if (cube.flipped === flip) return
            cube.flipped = flip
            if (flip) {
                cube.top.setAttribute("fill", flippedTopColor)
                cube.left.setAttribute("fill", flippedLeftColor)
                cube.right.setAttribute("fill", flippedRightColor)
            } else {
                cube.top.setAttribute("fill", topColor)
                cube.left.setAttribute("fill", leftColor)
                cube.right.setAttribute("fill", rightColor)
            }
        },
        [flippedLeftColor, flippedRightColor, flippedTopColor, leftColor, rightColor, topColor]
    )

    const updateFlips = React.useCallback(() => {
        rafRef.current = null

        const cubes = cubesRef.current
        if (!cubes || cubes.length === 0) return

        const { x, y, active } = cursorRef.current
        const radius = clamp(flipRadius, 0, 5000)

        if (!active || radius <= 0) {
            for (const cube of cubes) paintCube(cube, false)
            return
        }

        const r2 = radius * radius
        for (const cube of cubes) {
            const dx = cube.cx - x
            const dy = cube.cy - y
            const d2 = dx * dx + dy * dy
            paintCube(cube, d2 < r2)
        }
    }, [flipRadius, paintCube])

    const scheduleUpdate = React.useCallback(() => {
        if (rafRef.current != null) return
        if (typeof window === "undefined") return
        rafRef.current = window.requestAnimationFrame(updateFlips)
    }, [updateFlips])

    const build = React.useCallback(() => {
        if (typeof window === "undefined") return
        const svg = svgRef.current
        const container = containerRef.current
        if (!svg || !container) return

        const rect = container.getBoundingClientRect()
        const W = Math.max(0, rect.width)
        const H = Math.max(0, rect.height)
        if (W < 2 || H < 2) return

        const s = clamp(cubeSize, 6, 240)
        const hexW = s * 2 * COS30
        const hexH = s * 1.5

        svg.setAttribute("viewBox", `0 0 ${W} ${H}`)
        svg.setAttribute("width", String(W))
        svg.setAttribute("height", String(H))

        while (svg.firstChild) svg.removeChild(svg.firstChild)
        cubesRef.current = []

        const cols = Math.ceil(W / hexW) + 2
        const rows = Math.ceil(H / hexH) + 2

        const makePoly = (fill: string, points: string) => {
            const poly = document.createElementNS(SVG_NS, "polygon")
            poly.setAttribute("points", points)
            poly.setAttribute("fill", fill)
            ;(poly.style as any).transition = transition
            return poly
        }

        for (let r = -1; r < rows; r++) {
            for (let c = -1; c < cols; c++) {
                const offsetX = r % 2 === 0 ? 0 : hexW / 2
                const cx = c * hexW + offsetX
                const cy = r * hexH

                const top = [cx, cy - s]
                const tr = [cx + s * COS30, cy - s / 2]
                const br = [cx + s * COS30, cy + s / 2]
                const bot = [cx, cy + s]
                const bl = [cx - s * COS30, cy + s / 2]
                const tl = [cx - s * COS30, cy - s / 2]

                const g = document.createElementNS(SVG_NS, "g")

                const topFace = makePoly(topColor, `${top[0]},${top[1]} ${tr[0]},${tr[1]} ${cx},${cy} ${tl[0]},${tl[1]}`)
                const leftFace = makePoly(leftColor, `${tl[0]},${tl[1]} ${cx},${cy} ${bot[0]},${bot[1]} ${bl[0]},${bl[1]}`)
                const rightFace = makePoly(rightColor, `${tr[0]},${tr[1]} ${br[0]},${br[1]} ${bot[0]},${bot[1]} ${cx},${cy}`)

                g.appendChild(topFace)
                g.appendChild(leftFace)
                g.appendChild(rightFace)

                svg.appendChild(g)

                cubesRef.current.push({ g, cx, cy, top: topFace, left: leftFace, right: rightFace, flipped: false })
            }
        }

        scheduleUpdate()
    }, [COS30, SVG_NS, cubeSize, leftColor, rightColor, scheduleUpdate, topColor, transition])

    // Rebuild when sizing-critical props change
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) {
            build()
            return
        }
        build()
    }, [build, isStatic])

    // Update styling props without full rebuild
    React.useEffect(() => {
        const cubes = cubesRef.current
        for (const cube of cubes) {
            ;(cube.top.style as any).transition = transition
            ;(cube.left.style as any).transition = transition
            ;(cube.right.style as any).transition = transition
        }
        scheduleUpdate()
    }, [scheduleUpdate, transition])

    React.useEffect(() => {
        scheduleUpdate()
    }, [scheduleUpdate, topColor, leftColor, rightColor, flippedTopColor, flippedLeftColor, flippedRightColor])

    // Pointer interactions
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        const el = containerRef.current
        if (!el) return

        const onMove = (e: PointerEvent) => {
            const rect = el.getBoundingClientRect()
            cursorRef.current.x = e.clientX - rect.left
            cursorRef.current.y = e.clientY - rect.top
            cursorRef.current.active = true
            scheduleUpdate()
        }

        const onLeave = () => {
            cursorRef.current.active = false
            scheduleUpdate()
        }

        el.addEventListener("pointermove", onMove)
        el.addEventListener("pointerdown", onMove)
        el.addEventListener("pointerleave", onLeave)

        return () => {
            el.removeEventListener("pointermove", onMove)
            el.removeEventListener("pointerdown", onMove)
            el.removeEventListener("pointerleave", onLeave)
        }
    }, [isStatic, scheduleUpdate])

    // Resize handling: ResizeObserver (preferred) with window resize fallback
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        const el = containerRef.current
        if (!el) return

        build()

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => build())
            ro.observe(el)
            return () => ro?.disconnect()
        }

        const onResize = () => build()
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [build, isStatic])

    // RAF cleanup
    React.useEffect(() => {
        return () => {
            if (typeof window === "undefined") return
            if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                cursor: isStatic ? "default" : "crosshair",
                userSelect: "none",
                touchAction: "none",
            }}
            aria-label="Escher cube field"
            role="img"
        >
            <svg
                ref={svgRef}
                xmlns={SVG_NS}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
                preserveAspectRatio="none"
                aria-hidden={true}
            />
        </div>
    )
}

addPropertyControls(EscherCubeField, {
    backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#888888" },

    cubeSize: { type: ControlType.Number, title: "Cube Size", defaultValue: 38, min: 8, max: 140, step: 1, unit: "px" },
    flipRadius: { type: ControlType.Number, title: "Flip Radius", defaultValue: 75, min: 0, max: 400, step: 1, unit: "px" },
    transitionSeconds: { type: ControlType.Number, title: "Transition", defaultValue: 0.5, min: 0, max: 2, step: 0.05, unit: "s" },

    topColor: { type: ControlType.Color, title: "Top", defaultValue: "#FFFFFF" },
    leftColor: { type: ControlType.Color, title: "Left", defaultValue: "#0A0A0A" },
    rightColor: { type: ControlType.Color, title: "Right", defaultValue: "#888888" },

    flippedTopColor: { type: ControlType.Color, title: "Flip Top", defaultValue: "#0A0A0A" },
    flippedLeftColor: { type: ControlType.Color, title: "Flip Left", defaultValue: "#FFFFFF" },
    flippedRightColor: { type: ControlType.Color, title: "Flip Right", defaultValue: "#888888" },
})
