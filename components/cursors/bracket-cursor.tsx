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


// cursor: a Pulse square that tracks the pointer, four corner brackets that trail on a spring and lock
// around links and buttons, and a three-square steps burst on every click or tap. Touch devices keep their native
// behaviour and only get the tap burst. Place one instance anywhere in the layout template. Vizura Studio.

interface BracketCursorProps {
    color: string
    shell: string
    size: number
    bracket: number
    stiffness: number
    burst: boolean
    hideNative: boolean
    style?: React.CSSProperties
}

const HOVER_SEL = "a, button, [role='button'], [data-framer-name='Button'], label, select, summary"
const TEXT_SEL = "input, textarea, [contenteditable='true']"

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 40
 * @framerIntrinsicHeight 40
 */
export default function BracketCursor(props: BracketCursorProps) {
    const { color, shell, size, bracket, stiffness, burst, hideNative, style } = props
    const isStatic = useIsStaticRenderer()
    const layer = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const root = layer.current
        if (!root) return
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

        // fixed layer on top of everything, never blocks clicks
        const host = document.createElement("div")
        host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483646;overflow:hidden"
        document.body.appendChild(host)

        let styleTag: HTMLStyleElement | null = null
        if (fine && hideNative) {
            styleTag = document.createElement("style")
            styleTag.textContent = `html, body, * { cursor: none !important; } ${TEXT_SEL} { cursor: text !important; }`
            document.head.appendChild(styleTag)
        }

        const dot = document.createElement("div")
        const frame = document.createElement("div")
        const corners: HTMLDivElement[] = []
        if (fine) {
            dot.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px;background:${color};will-change:transform;transition:opacity .2s, width .25s, height .25s;opacity:0`
            frame.style.cssText = "position:absolute;left:0;top:0;will-change:transform,width,height;opacity:0;transition:opacity .25s"
            const L = bracket
            const base = `position:absolute;width:${L}px;height:${L}px;border-color:${shell};border-style:solid;border-width:0;transition:border-color .25s`
            const pos = [
                "left:0;top:0;border-left-width:1.5px;border-top-width:1.5px",
                "right:0;top:0;border-right-width:1.5px;border-top-width:1.5px",
                "left:0;bottom:0;border-left-width:1.5px;border-bottom-width:1.5px",
                "right:0;bottom:0;border-right-width:1.5px;border-bottom-width:1.5px",
            ]
            for (const p of pos) {
                const c = document.createElement("div")
                c.style.cssText = `${base};${p}`
                frame.appendChild(c)
                corners.push(c)
            }
            host.appendChild(frame)
            host.appendChild(dot)
        }

        // state: pointer, spring frame (x, y, w, h) with velocity
        const P = { x: -100, y: -100, seen: false }
        const F = { x: -100, y: -100, w: 34, h: 34, vx: 0, vy: 0, vw: 0, vh: 0 }
        let target: Element | null = null
        let pressed = false
        let textMode = false

        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            P.x = e.clientX
            P.y = e.clientY
            if (!P.seen) {
                P.seen = true
                F.x = P.x - F.w / 2
                F.y = P.y - F.h / 2
                dot.style.opacity = "1"
                frame.style.opacity = "1"
            }
            const el = e.target as Element | null
            textMode = !!el?.closest?.(TEXT_SEL)
            target = textMode ? null : el?.closest?.(HOVER_SEL) || null
        }
        const onLeave = () => {
            dot.style.opacity = "0"
            frame.style.opacity = "0"
            P.seen = false
        }
        // mouse bursts on press; touch bursts only on a real tap (no scroll, short press)
        let tStart = { x: 0, y: 0, t: 0 }
        const onDown = (e: PointerEvent) => {
            if (e.pointerType === "mouse") {
                pressed = true
                if (burst && !reduce) spawnBurst(e.clientX, e.clientY)
            } else tStart = { x: e.clientX, y: e.clientY, t: performance.now() }
        }
        const onUp = (e: PointerEvent) => {
            pressed = false
            if (e.pointerType !== "mouse" && burst && !reduce) {
                const moved = Math.hypot(e.clientX - tStart.x, e.clientY - tStart.y)
                if (moved < 8 && performance.now() - tStart.t < 350) spawnBurst(e.clientX, e.clientY)
            }
        }

        // three-square steps burst: squares step out on a diagonal staircase in four directions, then fade
        const spawnBurst = (x: number, y: number) => {
            const g = document.createElement("div")
            g.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0`
            host.appendChild(g)
            const dirs = [[1, -1], [-1, -1], [1, 1], [-1, 1]]
            const s = Math.max(4, size * 0.8)
            dirs.forEach(([dx, dy], i) => {
                for (let k = 1; k <= 3; k++) {
                    const q = document.createElement("div")
                    q.style.cssText = `position:absolute;left:${-s / 2}px;top:${-s / 2}px;width:${s}px;height:${s}px;background:${k === 3 ? shell : color}`
                    g.appendChild(q)
                    const ox = dx * (k * s * 1.25), oy = dy * (k * s * 1.25)
                    q.animate(
                        [
                            { transform: "translate(0,0) scale(0.4)", opacity: 1 },
                            { transform: `translate(${ox}px,${oy}px) scale(1)`, opacity: 1, offset: 0.55 },
                            { transform: `translate(${ox * 1.35}px,${oy * 1.35}px) scale(0.6)`, opacity: 0 },
                        ],
                        { duration: 560, delay: k * 35 + i * 10, easing: "cubic-bezier(.2,.7,.1,1)", fill: "forwards" }
                    )
                }
            })
            window.setTimeout(() => g.remove(), 900)
        }

        let raf = 0, last = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(0.034, (now - last) / 1000)
            last = now
            if (fine && P.seen) {
                let tx: number, ty: number, tw: number, th: number
                if (target) {
                    const r = (target as HTMLElement).getBoundingClientRect()
                    const pad = 6
                    tw = r.width + pad * 2
                    th = r.height + pad * 2
                    // a touch of magnetism toward the pointer
                    tx = r.left - pad + (P.x - (r.left + r.width / 2)) * 0.08
                    ty = r.top - pad + (P.y - (r.top + r.height / 2)) * 0.08
                } else {
                    const b = pressed ? 22 : 34
                    tw = b
                    th = b
                    tx = P.x - b / 2
                    ty = P.y - b / 2
                }
                const k = stiffness, damp = 2 * Math.sqrt(k) * 0.9
                const step = (pos: number, vel: number, to: number) => {
                    const a = k * (to - pos) - damp * vel
                    vel += a * dt
                    return [pos + vel * dt, vel]
                }
                ;[F.x, F.vx] = step(F.x, F.vx, tx)
                ;[F.y, F.vy] = step(F.y, F.vy, ty)
                ;[F.w, F.vw] = step(F.w, F.vw, tw)
                ;[F.h, F.vh] = step(F.h, F.vh, th)
                frame.style.transform = `translate3d(${F.x}px,${F.y}px,0)`
                frame.style.width = `${Math.max(8, F.w)}px`
                frame.style.height = `${Math.max(8, F.h)}px`
                const on = !!target
                for (const c of corners) c.style.borderColor = on ? color : shell
                const ds = textMode ? 0 : on ? size * 0.6 : pressed ? size * 1.5 : size
                dot.style.background = on ? shell : color
                dot.style.width = `${ds}px`
                dot.style.height = `${ds}px`
                dot.style.transform = `translate3d(${P.x - ds / 2}px,${P.y - ds / 2}px,0)`
                frame.style.opacity = textMode ? "0" : "1"
            }
            raf = requestAnimationFrame(tick)
        }
        if (fine) raf = requestAnimationFrame(tick)

        window.addEventListener("pointermove", onMove, { passive: true })
        window.addEventListener("pointerdown", onDown, { passive: true })
        window.addEventListener("pointerup", onUp, { passive: true })
        document.documentElement.addEventListener("mouseleave", onLeave)
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointerup", onUp)
            document.documentElement.removeEventListener("mouseleave", onLeave)
            host.remove()
            styleTag?.remove()
        }
    }, [isStatic, color, shell, size, bracket, stiffness, burst, hideNative])

    // on the canvas show a small preview of the cursor so the instance is easy to find
    return (
        <div ref={layer} style={{ ...style, position: "relative", width: 40, height: 40, pointerEvents: "none" }}>
            {isStatic && (
                <>
                    <div style={{ position: "absolute", inset: 4, border: `1.5px solid ${shell}`, clipPath: "polygon(0 0,35% 0,35% 1.5px,1.5px 1.5px,1.5px 35%,0 35%,0 65%,1.5px 65%,1.5px calc(100% - 1.5px),35% calc(100% - 1.5px),35% 100%,65% 100%,65% calc(100% - 1.5px),calc(100% - 1.5px) calc(100% - 1.5px),calc(100% - 1.5px) 65%,100% 65%,100% 35%,calc(100% - 1.5px) 35%,calc(100% - 1.5px) 1.5px,65% 1.5px,65% 0)" }} />
                    <div style={{ position: "absolute", left: 20 - size / 2, top: 20 - size / 2, width: size, height: size, background: color }} />
                </>
            )}
        </div>
    )
}

addPropertyControls(BracketCursor, {
    color: { type: ControlType.Color, title: "Pulse", defaultValue: "#C8FF3D" },
    shell: { type: ControlType.Color, title: "Brackets", defaultValue: "#EDE9E8" },
    size: { type: ControlType.Number, title: "Square", defaultValue: 8, min: 4, max: 20, step: 1 },
    bracket: { type: ControlType.Number, title: "Bracket", defaultValue: 8, min: 4, max: 20, step: 1 },
    stiffness: { type: ControlType.Number, title: "Spring", defaultValue: 260, min: 60, max: 900, step: 10 },
    burst: { type: ControlType.Boolean, title: "Click burst", defaultValue: true },
    hideNative: { type: ControlType.Boolean, title: "Hide system", defaultValue: true },
})
