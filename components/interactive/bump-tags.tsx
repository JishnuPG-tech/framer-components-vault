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


/* ────────────────────────────────────────────────────────────────────────
   BumpTags

   A tidy pack of colourful tags. Sweep the cursor through them and they
   are knocked outward — harder the faster you move — tilting as they
   bump into each other. Then every tag is pulled back to its own spot
   like a magnet. There is no gravity and no pile: the cloud always tidies
   itself up. Tags can also be grabbed and thrown.

   Home positions come from a normal wrapped flex layout; each tag then
   gets an offset, velocity, angle and spin simulated in one loop that
   sleeps when everything is home.
   ──────────────────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────────────
   GUIDE FOR EDITING THIS FILE (people and AI coding agents)

   A Framer code component: one file, one default export, imports only
   from "react", "react-dom", "framer" and "framer-motion".

   ## Map
   1. Types and DEFAULT_* objects
   2. BumpTags component
        a. layout: tags render in a wrapped row; homes are measured
        b. bodies: offset, velocity, angle, spin per tag (refs)
        c. loop: cursor push, magnet spring, collisions, sleep
        d. pointer: sweep and drag/throw
   3. addPropertyControls

   ## Rules
   - Keep control keys stable; renaming one resets it on placed instances.
   - useIsStaticRenderer() is true on the Framer canvas and in export:
     show the tidy cloud, no loop and no listeners.
   - The loop writes transforms straight to the DOM; never put body
     positions in React state.
   - Tags with a link are real <a> elements; a drag never follows a link.
   - Respect prefers-reduced-motion: tags stay still.
   - No template literals in this file (keeps it easy to paste into tools
     that wrap code in backticks).

   ## Common changes
   - Different push: edit the cursor block in step().
   - Per-tag field: add it to TagProp, the "tags" control and the tag JSX.
   ──────────────────────────────────────────────────────────────────────── */

interface TagProp {
    label?: string
    fill?: string
    color?: string
    link?: string
}
interface Props {
    style?: React.CSSProperties
    tags: TagProp[]
    look: { font: any; paddingX: number; paddingY: number; radius: number; gap: number; maxWidth: number; align: "center" | "left"; border: string; borderWidth: number }
    physics: { push: number; radius: number; magnet: number; damping: number; tilt: number; collide: boolean; drag: boolean }
}

const DEFAULT_TAGS: TagProp[] = [
    { label: "Hi-fi", fill: "#2B2BD9", color: "#FFFFFF" },
    { label: "Cassette", fill: "#E4F21A", color: "#111111" },
    { label: "Vinyl", fill: "#C9C9C6", color: "#111111" },
    { label: "Radio", fill: "#FFFFFF", color: "#111111" },
    { label: "Keyboards", fill: "#C9C9C6", color: "#111111" },
    { label: "CRT", fill: "#111111", color: "#FFFFFF" },
    { label: "Speakers", fill: "#2B2BD9", color: "#FFFFFF" },
    { label: "Analog", fill: "#E4F21A", color: "#111111" },
    { label: "Headphones", fill: "#FFFFFF", color: "#111111" },
    { label: "Desktop", fill: "#111111", color: "#FFFFFF" },
]
const DEFAULT_LOOK = { font: { fontSize: 18, fontWeight: 500 }, paddingX: 18, paddingY: 9, radius: 999, gap: 8, maxWidth: 420, align: "center" as const, border: "rgba(0,0,0,0)", borderWidth: 0 }
const DEFAULT_PHYSICS = { push: 1, radius: 90, magnet: 0.5, damping: 0.5, tilt: 1, collide: true, drag: true }

interface Body {
    x: number
    y: number
    vx: number
    vy: number
    a: number
    va: number
    w: number
    h: number
    hx: number // home centre
    hy: number
}

function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])
    return reduced
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 420
 */
export default function BumpTags(props: Props) {
    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const tags = Array.isArray(props.tags) && props.tags.length ? props.tags : DEFAULT_TAGS
    const lk = { ...DEFAULT_LOOK, ...props.look }
    const ph = { ...DEFAULT_PHYSICS, ...props.physics }
    const live = !isStatic && !reduced

    const rootRef = React.useRef<HTMLDivElement>(null)
    const tagRefs = React.useRef<(HTMLElement | null)[]>([])
    const bodies = React.useRef<Body[]>([])
    const cursor = React.useRef({ x: -9999, y: -9999, vx: 0, vy: 0, t: 0, inside: false })
    const grab = React.useRef<{ i: number; dx: number; dy: number; moved: boolean } | null>(null)
    const raf = React.useRef(0)
    const threw = React.useRef(false) // the last press was a drag, so its click must not follow a link
    const poked = React.useRef(0) // last push/drag time; collisions only run shortly after, so tags can always slide home

    /* ── a. homes ────────────────────────────────────────────────────── */
    const measure = React.useCallback(() => {
        const root = rootRef.current
        if (!root) return
        const rr = root.getBoundingClientRect()
        bodies.current = tagRefs.current.map((el, i) => {
            const old = bodies.current[i]
            if (!el) return old
            // Measure without our transform so the home is the layout position.
            const prev = el.style.transform
            el.style.transform = "none"
            const r = el.getBoundingClientRect()
            el.style.transform = prev
            const hx = r.left - rr.left + r.width / 2
            const hy = r.top - rr.top + r.height / 2
            return { x: old ? old.x : 0, y: old ? old.y : 0, vx: old ? old.vx : 0, vy: old ? old.vy : 0, a: old ? old.a : 0, va: old ? old.va : 0, w: r.width, h: r.height, hx, hy }
        })
    }, [])
    React.useLayoutEffect(() => {
        measure()
        const el = rootRef.current
        // Homes move when the frame, the list or any tag changes size (web fonts loading, edits).
        let alive = true
        ;(document as any).fonts?.ready?.then(() => alive && measure())
        if (!el || typeof ResizeObserver === "undefined") return () => (alive = false)
        const ro = new ResizeObserver(() => measure())
        ro.observe(el)
        if (el.firstElementChild) ro.observe(el.firstElementChild)
        tagRefs.current.forEach((t) => t && ro.observe(t))
        return () => {
            alive = false
            ro.disconnect()
        }
    }, [measure, tags.length, lk.font?.fontSize, lk.paddingX, lk.paddingY, lk.gap, lk.maxWidth])

    /* ── c. loop ─────────────────────────────────────────────────────── */
    const paint = () => {
        bodies.current.forEach((b, i) => {
            const el = tagRefs.current[i]
            if (!el || !b) return
            el.style.transform = "translate(" + b.x.toFixed(2) + "px," + b.y.toFixed(2) + "px) rotate(" + b.a.toFixed(2) + "deg)"
        })
    }
    const step = (dt: number) => {
        const bs = bodies.current
        const c = cursor.current
        const k = 20 + ph.magnet * 120 // magnet spring
        const damp = Math.exp(-(3 + ph.damping * 18) * dt) // near critical at the default: a short wobble, then home
        const speed = Math.hypot(c.vx, c.vy)
        for (let i = 0; i < bs.length; i++) {
            const b = bs[i]
            if (!b) continue
            if (grab.current && grab.current.i === i) continue
            // Cursor push: only while moving, scaled by speed, away from the cursor.
            if (c.inside && speed > 0.02) {
                const cx = b.hx + b.x
                const cy = b.hy + b.y
                const dx = cx - c.x
                const dy = cy - c.y
                const reach = ph.radius + Math.max(b.w, b.h) / 2
                const d = Math.hypot(dx, dy)
                if (d < reach) {
                    poked.current = performance.now()
                    const f = (1 - d / reach) * Math.min(4, speed) * 900 * ph.push * dt
                    const nx = d > 0.001 ? dx / d : 0
                    const ny = d > 0.001 ? dy / d : -1
                    b.vx += (nx + c.vx * 0.6) * f
                    b.vy += (ny + c.vy * 0.6) * f
                    b.va += (nx * c.vy - ny * c.vx) * f * 0.4 * ph.tilt
                }
            }
            // Magnet back home, and the angle back to level.
            b.vx += -b.x * k * dt
            b.vy += -b.y * k * dt
            b.va += -b.a * k * 0.6 * dt
            b.vx *= damp
            b.vy *= damp
            b.va *= damp
        }
        // Collisions: separate overlapping boxes and trade a little spin, but only right
        // after a push or drag; otherwise two swapped tags could block each other forever.
        if (ph.collide && (grab.current || performance.now() - poked.current < 700)) {
            for (let i = 0; i < bs.length; i++) {
                for (let j = i + 1; j < bs.length; j++) {
                    const A = bs[i]
                    const B = bs[j]
                    if (!A || !B) continue
                    const dx = B.hx + B.x - (A.hx + A.x)
                    const dy = B.hy + B.y - (A.hy + A.y)
                    const ox = (A.w + B.w) / 2 - Math.abs(dx)
                    const oy = (A.h + B.h) / 2 - Math.abs(dy)
                    if (ox <= 0 || oy <= 0) continue
                    // A held tag is immovable: the other tag takes the whole correction.
                    const g = grab.current ? grab.current.i : -1
                    const wa = i === g ? 0 : j === g ? 1 : 0.5
                    const wb = j === g ? 0 : i === g ? 1 : 0.5
                    if (ox < oy) {
                        const s = (dx > 0 ? 1 : -1) * ox
                        A.x -= s * wa
                        B.x += s * wb
                        const vrel = (B.vx - A.vx) * 0.5
                        A.vx += vrel
                        B.vx -= vrel
                        A.va -= dy * 0.04 * ph.tilt
                        B.va += dy * 0.04 * ph.tilt
                    } else {
                        const s = (dy > 0 ? 1 : -1) * oy
                        A.y -= s * wa
                        B.y += s * wb
                        const vrel = (B.vy - A.vy) * 0.5
                        A.vy += vrel
                        B.vy -= vrel
                        A.va += dx * 0.03 * ph.tilt
                        B.va -= dx * 0.03 * ph.tilt
                    }
                }
            }
        }
        for (let i = 0; i < bs.length; i++) {
            const b = bs[i]
            if (!b || (grab.current && grab.current.i === i)) continue // the cursor places a held tag
            b.x += b.vx * dt
            b.y += b.vy * dt
            b.a = Math.max(-40, Math.min(40, b.a + b.va * dt))
        }
        c.vx *= 0.6
        c.vy *= 0.6
    }
    const wake = () => {
        if (raf.current || !live) return
        let last = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(0.033, (now - last) / 1000)
            last = now
            step(dt)
            paint()
            // Sleep once every tag is within half a pixel of home and nearly still.
            let settled = !grab.current
            for (const b of bodies.current) if (b && (Math.abs(b.x) > 0.5 || Math.abs(b.y) > 0.5 || Math.abs(b.a) > 0.3 || Math.abs(b.vx) + Math.abs(b.vy) > 3)) settled = false
            if (settled) {
                for (const b of bodies.current) if (b) Object.assign(b, { x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0 })
                paint()
                raf.current = 0
                return
            }
            raf.current = requestAnimationFrame(tick)
        }
        raf.current = requestAnimationFrame(tick)
    }
    React.useEffect(() => () => cancelAnimationFrame(raf.current), [])

    /* ── d. pointer ──────────────────────────────────────────────────── */
    const local = (e: { clientX: number; clientY: number }) => {
        const r = rootRef.current?.getBoundingClientRect()
        return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 }
    }
    const onMove = (e: React.PointerEvent) => {
        if (!live) return
        const p = local(e)
        const c = cursor.current
        const now = performance.now()
        if (c.inside && c.t) {
            const dt = Math.max(1, now - c.t)
            c.vx = (p.x - c.x) / dt
            c.vy = (p.y - c.y) / dt
        }
        c.x = p.x
        c.y = p.y
        c.t = now
        c.inside = true
        const g = grab.current
        if (g) {
            const b = bodies.current[g.i]
            if (b) {
                const nx = p.x - g.dx - b.hx
                const ny = p.y - g.dy - b.hy
                b.vx = (nx - b.x) * 60
                b.vy = (ny - b.y) * 60
                if (Math.hypot(nx - b.x, ny - b.y) > 2) g.moved = true
                b.x = nx
                b.y = ny
            }
        }
        wake()
    }
    const onLeave = () => {
        cursor.current.inside = false
        cursor.current.t = 0
    }
    const onDown = (e: React.PointerEvent, i: number) => {
        if (!live || !ph.drag || e.button !== 0) return
        const p = local(e)
        const b = bodies.current[i]
        if (!b) return
        grab.current = { i, dx: p.x - (b.hx + b.x), dy: p.y - (b.hy + b.y), moved: false }
        poked.current = performance.now()
        const el = tagRefs.current[i]
        if (el) el.style.zIndex = "10" // the held tag rides on top
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        wake()
    }
    const onUp = () => {
        const el = grab.current ? tagRefs.current[grab.current.i] : null
        if (el) el.style.zIndex = ""
        threw.current = !!grab.current?.moved
        grab.current = null
        poked.current = performance.now()
        wake()
    }

    /* ── b. render ───────────────────────────────────────────────────── */
    const fontSize = lk.font?.fontSize
    return (
        <div
            ref={rootRef}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            style={{ ...props.style, position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", touchAction: ph.drag ? "none" : undefined, userSelect: "none", WebkitUserSelect: "none" }}
        >
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", justifyContent: lk.align === "center" ? "center" : "flex-start", gap: lk.gap, maxWidth: lk.maxWidth }}>
                {tags.map((t, i) => {
                    const Tag: any = t?.link ? "a" : "span"
                    return (
                        <li key={i} style={{ display: "block" }}>
                            <Tag
                                ref={(el: HTMLElement | null) => {
                                    tagRefs.current[i] = el
                                }}
                                href={t?.link || undefined}
                                draggable={false}
                                onPointerDown={(e: React.PointerEvent) => onDown(e, i)}
                                onPointerUp={onUp}
                                onClick={(e: React.MouseEvent) => {
                                    if (threw.current) e.preventDefault()
                                    threw.current = false
                                }}
                                style={{
                                    display: "inline-block",
                                    ...lk.font,
                                    fontSize: typeof fontSize === "number" ? fontSize + "px" : fontSize,
                                    lineHeight: 1.2,
                                    padding: lk.paddingY + "px " + lk.paddingX + "px",
                                    borderRadius: lk.radius,
                                    background: t?.fill || "#E5E5E5",
                                    color: t?.color || "#111111",
                                    border: lk.borderWidth > 0 ? lk.borderWidth + "px solid " + lk.border : "none",
                                    whiteSpace: "nowrap",
                                    textDecoration: "none",
                                    cursor: ph.drag && live ? "grab" : t?.link ? "pointer" : "default",
                                    willChange: live ? "transform" : undefined,
                                    position: "relative",
                                }}
                            >
                                {t?.label || ""}
                            </Tag>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

addPropertyControls(BumpTags, {
    tags: {
        type: ControlType.Array,
        title: "Tags",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Tag" },
                fill: { type: ControlType.Color, title: "Fill", defaultValue: "#E5E5E5" },
                color: { type: ControlType.Color, title: "Text", defaultValue: "#111111" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_TAGS,
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        controls: {
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: DEFAULT_LOOK.font },
            paddingX: { type: ControlType.Number, title: "Padding X", min: 0, max: 60, unit: "px", defaultValue: DEFAULT_LOOK.paddingX },
            paddingY: { type: ControlType.Number, title: "Padding Y", min: 0, max: 40, unit: "px", defaultValue: DEFAULT_LOOK.paddingY },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 999, unit: "px", defaultValue: DEFAULT_LOOK.radius },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 40, unit: "px", defaultValue: DEFAULT_LOOK.gap },
            maxWidth: { type: ControlType.Number, title: "Cloud Width", min: 120, max: 2000, step: 10, unit: "px", defaultValue: DEFAULT_LOOK.maxWidth },
            align: { type: ControlType.Enum, title: "Align", options: ["center", "left"], optionTitles: ["Center", "Left"], defaultValue: DEFAULT_LOOK.align, displaySegmentedControl: true },
            borderWidth: { type: ControlType.Number, title: "Border", min: 0, max: 6, unit: "px", defaultValue: DEFAULT_LOOK.borderWidth },
            border: { type: ControlType.Color, title: "Border Color", defaultValue: DEFAULT_LOOK.border, hidden: (p: any) => !p.borderWidth },
        },
    },
    physics: {
        type: ControlType.Object,
        title: "Physics",
        controls: {
            push: { type: ControlType.Number, title: "Push", min: 0, max: 3, step: 0.05, defaultValue: DEFAULT_PHYSICS.push, description: "How hard a sweep knocks the tags." },
            radius: { type: ControlType.Number, title: "Reach", min: 10, max: 300, unit: "px", defaultValue: DEFAULT_PHYSICS.radius },
            magnet: { type: ControlType.Number, title: "Magnet", min: 0, max: 1, step: 0.01, defaultValue: DEFAULT_PHYSICS.magnet, description: "How strongly tags are pulled home." },
            damping: { type: ControlType.Number, title: "Damping", min: 0, max: 1, step: 0.01, defaultValue: DEFAULT_PHYSICS.damping, description: "Higher settles sooner with less wobble." },
            tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 3, step: 0.05, defaultValue: DEFAULT_PHYSICS.tilt },
            collide: { type: ControlType.Boolean, title: "Collide", defaultValue: DEFAULT_PHYSICS.collide },
            drag: { type: ControlType.Boolean, title: "Drag & Throw", defaultValue: DEFAULT_PHYSICS.drag },
        },
    },
})
