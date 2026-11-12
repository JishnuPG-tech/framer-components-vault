import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * FluidLoader — starts as a solid full-screen color. Then a thick swirl drains
 * along its path while thinning out, revealing the website between its loops,
 * and finally slips off through the top-right corner.
 * Place it on top of your page: Position Fixed, 100vw × 100vh, high z-index.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */

interface Props {
    color: string
    hold: number
    duration: number
    endWidth: number
    flip: boolean
    waitForLoad: boolean
    lockScroll: boolean
    loop: boolean
    onComplete?: () => void
    style?: React.CSSProperties
}

// Swirl in a 1000 × 1000 box: outer loop → middle loop → inner loop →
// exit through the top-right corner.
const PATH =
    "M-90 670C-36.7 713.3 105 884.2 230 930C355 975.8 542.5 978.3 660 945C777.5 911.7 890 830.8 935 730C980 629.2 979.2 450.8 930 340C880.8 229.2 760 109.2 640 65C520 20.8 308.3 34.2 210 75C111.7 115.8 56.7 210.8 50 310C43.3 409.2 98.3 594.2 170 670C241.7 745.8 380 775 480 765C580 755 733.3 685.8 770 610C806.7 534.2 756.7 367.5 700 310C643.3 252.5 493.3 243.3 430 265C366.7 286.7 313.3 389.2 320 440C326.7 490.8 408.3 560 470 570C531.7 580 623.3 556.7 690 500C756.7 443.3 803.3 328.3 870 230C936.7 131.7 1053.3 -36.7 1090 -90"
// Stroke width at which the swirl covers every point of the screen
const COVER_WIDTH = 452
const VB = 1000

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
// power1.inOut (quadratic ease-in-out), same curve as the reference
const ease = (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

export default function FluidLoader(props: Props) {
    const {
        color,
        hold,
        duration,
        endWidth,
        flip,
        waitForLoad,
        lockScroll,
        loop,
        onComplete,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const rootRef = useRef<HTMLDivElement>(null)
    const solidRef = useRef<SVGRectElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const [done, setDone] = useState(false)

    const endW = (endWidth / 100) * VB

    // e: eased progress 0 → 1. The visible part runs from e to the end of the
    // path (it drains from its start), and the stroke thins as it goes.
    const apply = (e: number) => {
        const el = pathRef.current
        if (solidRef.current) solidRef.current.style.opacity = e > 0 ? "0" : "1"
        if (!el) return
        const visible = (1 - e) * 1000 // pathLength = 1000
        el.setAttribute("stroke-dasharray", `${visible.toFixed(2)} 2000`)
        el.setAttribute("stroke-dashoffset", (-e * 1000).toFixed(2))
        el.setAttribute(
            "stroke-width",
            (COVER_WIDTH + (endW - COVER_WIDTH) * e).toFixed(1)
        )
        el.setAttribute("opacity", visible < 0.05 ? "0" : "1")
    }

    useEffect(() => {
        if (isCanvas) return
        const reduced = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const html = document.documentElement
        const prevOverflow = html.style.overflow
        const setLock = (on: boolean) => {
            if (lockScroll) html.style.overflow = on ? "hidden" : prevOverflow
        }

        let raf = 0
        let timer: ReturnType<typeof setTimeout>
        let cap: ReturnType<typeof setTimeout>
        let cancelled = false
        let t0 = 0

        const finish = () => {
            setLock(false)
            if (rootRef.current) rootRef.current.style.pointerEvents = "none"
            setDone(true)
            onComplete?.()
        }

        const frame = (now: number) => {
            if (cancelled) return
            if (!t0) t0 = now
            const t = clamp((now - t0) / 1000 / duration)
            const e = ease(t)
            apply(e)
            if (e > 0.3) {
                setLock(false)
                if (rootRef.current)
                    rootRef.current.style.pointerEvents = "none"
            }
            if (t >= 1) {
                if (loop) {
                    // demo: snap back to solid, pause, play again
                    apply(0)
                    if (rootRef.current)
                        rootRef.current.style.pointerEvents = "auto"
                    t0 = 0
                    timer = setTimeout(
                        () => (raf = requestAnimationFrame(frame)),
                        (hold + 0.6) * 1000
                    )
                    return
                }
                finish()
                return
            }
            raf = requestAnimationFrame(frame)
        }

        const start = () => {
            if (cancelled) return
            if (reduced && !loop) {
                const el = rootRef.current
                if (el) {
                    el.style.transition = "opacity 0.4s ease"
                    el.style.opacity = "0"
                }
                timer = setTimeout(finish, 450)
                return
            }
            raf = requestAnimationFrame(frame)
        }

        setLock(true)
        let kicked = false
        const kick = () => {
            if (kicked) return
            kicked = true
            timer = setTimeout(start, hold * 1000)
        }
        if (waitForLoad && document.readyState !== "complete") {
            window.addEventListener("load", kick, { once: true })
            cap = setTimeout(kick, 2500) // never hold the color longer than this
        } else kick()

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            clearTimeout(timer)
            clearTimeout(cap)
            window.removeEventListener("load", kick)
            html.style.overflow = prevOverflow
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCanvas, hold, duration, endW, waitForLoad, lockScroll, loop])

    if (done) return null

    return (
        <div
            ref={rootRef}
            aria-hidden="true"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "auto",
            }}
        >
            <svg
                viewBox={`0 0 ${VB} ${VB}`}
                preserveAspectRatio="none"
                width="100%"
                height="100%"
                style={{ display: "block", overflow: "visible" }}
            >
                <g
                    transform={
                        flip ? `translate(${VB} 0) scale(-1 1)` : undefined
                    }
                >
                    <path
                        ref={pathRef}
                        d={PATH}
                        pathLength={1000}
                        fill="none"
                        stroke={color}
                        strokeWidth={COVER_WIDTH}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="1000 2000"
                        strokeDashoffset={0}
                    />
                </g>
                {/* Solid full-screen color until the reveal starts */}
                <rect
                    ref={solidRef}
                    x={-10}
                    y={-10}
                    width={VB + 20}
                    height={VB + 20}
                    fill={color}
                />
            </svg>
            {isCanvas && (
                <div
                    style={{
                        position: "absolute",
                        left: 16,
                        bottom: 12,
                        font: "500 12px/1 Inter, system-ui, sans-serif",
                        color: "rgba(255,255,255,0.85)",
                    }}
                >
                    FluidLoader · reveals in Preview
                </div>
            )}
        </div>
    )
}

FluidLoader.defaultProps = {
    color: "#FF6A13",
    hold: 0.1,
    duration: 1.25,
    endWidth: 5,
    flip: false,
    waitForLoad: false,
    lockScroll: true,
    loop: false,
}

addPropertyControls(FluidLoader, {
    color: { type: ControlType.Color, title: "Color", defaultValue: "#FF6A13" },
    hold: {
        type: ControlType.Number,
        title: "Hold",
        min: 0,
        max: 5,
        step: 0.05,
        unit: "s",
        defaultValue: 0.1,
        description: "How long the solid color stays before the reveal",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.3,
        max: 4,
        step: 0.05,
        unit: "s",
        defaultValue: 1.25,
    },
    endWidth: {
        type: ControlType.Number,
        title: "End width",
        min: 1,
        max: 30,
        step: 0.5,
        unit: "%",
        defaultValue: 5,
        description: "How thin the swirl gets before it slips away",
    },
    flip: {
        type: ControlType.Boolean,
        title: "Mirror",
        defaultValue: false,
        description: "Exit through the top-left corner instead",
    },
    waitForLoad: {
        type: ControlType.Boolean,
        title: "Wait for load",
        defaultValue: false,
        description: "Hold the color until images finish loading (max 2.5s)",
    },
    lockScroll: {
        type: ControlType.Boolean,
        title: "Lock scroll",
        defaultValue: true,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop (demo)",
        defaultValue: false,
    },
    onComplete: { type: ControlType.EventHandler },
})
