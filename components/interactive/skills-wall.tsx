// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import Matter from "matter-js"

type Tool = { name: string; image?: { src: string; alt?: string }; skills: string; facts?: string }

const WALL = 0x0001
const PILL = 0x0002

const key = (s: string) => (s || "").trim().toLowerCase()

const TIP_PAPER = "#F7F1DE"
const TIP_INK = "#2A2622"
const TIP_RED = "#8B2A22"

/** Ink speech bubble: paper fill, hand-drawn ink edge, a tail pointing at the tool */
function InkTip({ name, tags, below = false }: { name: string; tags: string[]; below?: boolean }) {
    return (
        <div style={{ position: "relative", padding: "7px 12px 8px", fontFamily: '"Poppins", sans-serif', color: TIP_INK, whiteSpace: "nowrap" }}>
            <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
                <filter id="swtip-rough">
                    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
                    <feDisplacementMap in="SourceGraphic" scale="1.2" />
                </filter>
            </svg>
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    background: TIP_PAPER,
                    border: `1.6px solid ${TIP_INK}`,
                    borderRadius: "10px 11px 10px 12px",
                    filter: "url(#swtip-rough)",
                    boxShadow: "0 4px 12px -6px rgba(42,38,34,.3)",
                }}
            />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.2, letterSpacing: "0.01em" }}>{name}</span>
                {tags.length > 0 && (
                    <span style={{ display: "flex", gap: 5 }}>
                        {tags.map((t) => (
                            <span
                                key={t}
                                style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    lineHeight: 1.2,
                                    color: TIP_RED,
                                    border: `1px solid ${TIP_RED}`,
                                    borderRadius: 999,
                                    padding: "3px 8px",
                                    background: "rgba(139,42,34,.05)",
                                }}
                            >
                                {t}
                            </span>
                        ))}
                    </span>
                )}
            </div>
        </div>
    )
}


// A dry-brush line from (x0,y0) to (x1,y1): a filled ribbon that wanders slightly, swells and thins, and
// tapers at both ends. Seeded, so each line keeps its shape between renders.
function brushLine(x0: number, y0: number, x1: number, y1: number, w: number, seed: number) {
    const len = Math.hypot(x1 - x0, y1 - y0) || 1
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len
    const nx = -uy, ny = ux
    const n = Math.max(12, Math.round(len / 6))
    const a = seed * 1.7, b = seed * 3.1
    const left: string[] = [], right: string[] = []
    for (let i = 0; i <= n; i++) {
        const t = i / n
        const wander = Math.sin(t * 5.3 + a) * 0.9 + Math.sin(t * 13.7 + b) * 0.35
        const taper = Math.min(1, t / 0.08, (1 - t) / 0.12)
        const half = (w / 2) * Math.max(0.15, taper) * (0.75 + 0.25 * Math.sin(t * 9.1 + a * 2))
        const cx = x0 + ux * len * t + nx * wander, cy = y0 + uy * len * t + ny * wander
        left.push(`${(cx + nx * half).toFixed(1)},${(cy + ny * half).toFixed(1)}`)
        right.unshift(`${(cx - nx * half).toFixed(1)},${(cy - ny * half).toFixed(1)}`)
    }
    return "M" + left.join("L") + "L" + right.join("L") + "Z"
}

/**
 * Skills Wall — tool pieces in a faded grid behind, skill pills piled up in front with real physics.
 * Hover a tool and the skills it's linked to float up out of the pile and hover there, bobbing gently;
 * leave and they drop back. Hover a pill and the tools behind it light up. Pills can be picked up and thrown.
 * Phones: tap a tool to lift its skills; the page keeps scrolling normally.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 */
export default function SkillsWall(props) {
    const {
        tools,
        skills,
        columns,
        pieceSize,
        gridGapX,
        gridGapY,
        gridTop,
        restOpacity,
        gridLines,
        lineColor,
        lineOpacity,
        lineWidth,
        lineOverhang,
        pillFont,
        pillText,
        pillFill,
        pillBorder,
        pillBorderWidth,
        pillPadX,
        pillPadY,
        gravity,
        liftHeight,
        liftOnHover = true,
        bob,
        bounce,
        drag,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const cls = "skw-" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const rootRef = useRef<HTMLDivElement>(null)
    const pillRefs = useRef<(HTMLDivElement | null)[]>([])
    const labels: string[] = (skills || []).map((s) => (s || "").trim()).filter(Boolean)
    const toolList: Tool[] = (tools || []).filter((t) => t && (t.name || t.image?.src))

    // tool index → pill indexes, and pill index → tool indexes
    const links = useMemo(() => {
        const byLabel = new Map(labels.map((l, i) => [key(l), i]))
        const toolToPills = toolList.map((t) =>
            (t.skills || "")
                .split(",")
                .map((s) => byLabel.get(key(s)))
                .filter((i): i is number => i !== undefined)
        )
        const pillToTools = labels.map((_, p) => toolToPills.map((ps, t) => (ps.includes(p) ? t : -1)).filter((t) => t >= 0))
        return { toolToPills, pillToTools }
    }, [labels.join("|"), toolList.map((t) => t.name + ":" + t.skills).join("|")])

    // Where the grid lines go: halfway between neighbouring columns and rows, measured from the pieces
    const gridRef = useRef<HTMLDivElement>(null)
    const [lines, setLines] = useState<{ w: number; h: number; xs: number[]; ys: number[] }>({ w: 0, h: 0, xs: [], ys: [] })
    const measureLines = () => {
        const g = gridRef.current
        if (!g) return
        const kids = Array.from(g.children).filter((c) => (c as HTMLElement).dataset.piece !== undefined) as HTMLElement[]
        const spans = (get: (el: HTMLElement) => [number, number]) => {
            const m = new Map<number, number>()
            kids.forEach((el) => {
                const [start, end] = get(el)
                const k = Math.round(start)
                m.set(k, Math.max(m.get(k) || 0, end))
            })
            const starts = [...m.keys()].sort((p, q) => p - q)
            return starts.slice(1).map((st, i) => (m.get(starts[i])! + st) / 2)
        }
        const xs = spans((el) => [el.offsetLeft, el.offsetLeft + el.offsetWidth])
        const ys = spans((el) => [el.offsetTop, el.offsetTop + el.offsetHeight])
        const next = { w: g.offsetWidth, h: g.offsetHeight, xs, ys }
        setLines((o) => (JSON.stringify(o) === JSON.stringify(next) ? o : next))
    }
    useLayoutEffect(() => {
        measureLines()
        const g = gridRef.current
        if (!g || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measureLines)
        ro.observe(g)
        return () => ro.disconnect()
    }, [toolList.length, columns, pieceSize, gridGapX, gridGapY])

    const [hotTool, setHotTool] = useState<number | null>(null)
    const [hotPill, setHotPill] = useState<number | null>(null)
    const [lifted, setLifted] = useState<Set<number>>(new Set())
    const liftedRef = useRef<Set<number>>(new Set())
    const physicsRef = useRef<{ wake: () => void } | null>(null)

    // What floats: the hovered tool's skills
    useEffect(() => {
        const next = new Set(hotTool === null || !liftOnHover ? [] : links.toolToPills[hotTool] || [])
        liftedRef.current = next
        setLifted(next)
        physicsRef.current?.wake()
    }, [hotTool, links, liftOnHover])

    // ---- Physics ------------------------------------------------------------------------------------
    useLayoutEffect(() => {
        const root = rootRef.current
        if (isStatic || !root || labels.length === 0) return
        let dead = false
        let raf = 0
        let started = false
        let visible = false
        const touch = window.matchMedia("(hover: none)").matches
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const engine = Matter.Engine.create({ enableSleeping: true })
        engine.gravity.y = gravity
        const world = engine.world
        let W = root.clientWidth
        let H = root.clientHeight
        let walls: Matter.Body[] = []
        const T = 200 // wall thickness, thick enough that fast throws can't tunnel through
        const makeWalls = () => {
            if (walls.length) Matter.Composite.remove(world, walls)
            const o = { isStatic: true, restitution: 0.1, friction: 0.6, collisionFilter: { category: WALL, mask: PILL } }
            walls = [
                Matter.Bodies.rectangle(W / 2, H + T / 2, W + T * 2, T, o),
                Matter.Bodies.rectangle(W / 2, -T / 2, W + T * 2, T, o),
                Matter.Bodies.rectangle(-T / 2, H / 2, T, H * 2, o),
                Matter.Bodies.rectangle(W + T / 2, H / 2, T, H * 2, o),
            ]
            Matter.Composite.add(world, walls)
        }
        makeWalls()

        // One rounded body per pill, sized from the rendered label
        const els = pillRefs.current.slice(0, labels.length)
        const sizes = els.map((el) => ({ w: el?.offsetWidth || 120, h: el?.offsetHeight || 36 }))
        const bodies = sizes.map((s, i) => {
            const x = s.w / 2 + Math.random() * Math.max(1, W - s.w)
            const y = s.h / 2 + 10 + Math.random() * H * 0.35
            const b = Matter.Bodies.rectangle(x, y, s.w, s.h, {
                chamfer: { radius: s.h / 2 - 0.5 },
                restitution: bounce,
                friction: 0.35,
                frictionAir: 0.012,
                density: 0.0015,
                angle: (Math.random() - 0.5) * 0.6,
                collisionFilter: { category: PILL, mask: WALL | PILL },
            })
            ;(b as any).phase = Math.random() * Math.PI * 2
            ;(b as any).index = i
            return b
        })
        Matter.Composite.add(world, bodies)

        // Grab and throw with the mouse (desktop only, so phones keep scrolling)
        let mc: Matter.MouseConstraint | null = null
        if (drag && !touch) {
            const mouse = Matter.Mouse.create(root)
            const m = mouse as any
            root.removeEventListener("mousewheel", m.mousewheel)
            root.removeEventListener("DOMMouseScroll", m.mousewheel)
            root.removeEventListener("wheel", m.mousewheel)
            root.removeEventListener("touchstart", m.mousedown)
            root.removeEventListener("touchmove", m.mousemove)
            root.removeEventListener("touchend", m.mouseup)
            mouse.pixelRatio = 1
            mc = Matter.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.12, angularStiffness: 0 } as any })
            mc.collisionFilter.mask = PILL
            Matter.Composite.add(world, mc)
            Matter.Events.on(mc, "startdrag", () => (root.style.cursor = "grabbing"))
            Matter.Events.on(mc, "enddrag", () => (root.style.cursor = ""))
        }
        // Leaving the section lets go of whatever is held
        const onLeave = () => {
            if (mc) (mc.mouse as any).button = -1
        }
        root.addEventListener("mouseleave", onLeave)

        // Floating: lifted pills rise to their height and bob there. They pass through the other pills like
        // ghosts while lifted (floating ones gently drift apart instead of colliding). Once let go they fall,
        // and turn solid again only when they're clear of every other pill, so nothing ever gets shoved.
        const SOLID = WALL | PILL
        const overlap = (b: Matter.Body) => {
            for (const o of bodies) {
                if (o === b || !Matter.Bounds.overlaps(b.bounds, o.bounds)) continue
                if (Matter.Query.collides(b, [o]).length) return o
            }
            return null
        }
        const nudgeAway = (b: Matter.Body, o: Matter.Body, push: number) => {
            const dx = b.position.x - o.position.x || (Math.random() - 0.5)
            Matter.Body.setVelocity(b, { x: b.velocity.x + Math.sign(dx) * push, y: b.velocity.y })
        }
        const hover = (now: number) => {
            const set = liftedRef.current
            const ceiling = Math.max(40, H - liftHeight)
            for (const b of bodies) {
                const i = (b as any).index
                const up = set.has(i)
                if (!up) {
                    if (b.collisionFilter.mask !== SOLID) {
                        const o = overlap(b)
                        const waited = ((b as any).ghostFor = ((b as any).ghostFor || 0) + 1)
                        if (!o || waited > 120) {
                            b.collisionFilter.mask = SOLID
                            ;(b as any).ghostFor = 0
                        } else nudgeAway(b, o, 0.25)
                        Matter.Sleeping.set(b, false)
                    }
                    continue
                }
                b.collisionFilter.mask = WALL
                ;(b as any).ghostFor = 0
                const ty = ceiling - sizes[i].h / 2 + (reduce ? 0 : Math.sin(now / 700 + (b as any).phase) * bob)
                // Floating pills that overlap slide apart sideways, softly
                if (b.position.y - ty < 24) {
                    for (const o of bodies) {
                        if (o === b || !set.has((o as any).index)) continue
                        if (Matter.Bounds.overlaps(b.bounds, o.bounds)) nudgeAway(b, o, 0.35)
                    }
                }
                const vy = b.velocity.y + ((ty - b.position.y) * 0.06 - b.velocity.y) * 0.18
                Matter.Body.setVelocity(b, { x: b.velocity.x * 0.96, y: vy })
                Matter.Body.setAngularVelocity(b, b.angularVelocity * 0.9 - b.angle * 0.01)
                // Cancel gravity while floating
                Matter.Body.applyForce(b, b.position, { x: 0, y: -b.mass * engine.gravity.y * engine.gravity.scale })
                Matter.Sleeping.set(b, false)
            }
        }

        const paint = () => {
            for (const b of bodies) {
                const i = (b as any).index
                const el = els[i]
                if (!el) continue
                const { x, y } = b.position
                el.style.transform = `translate3d(${(x - sizes[i].w / 2).toFixed(2)}px,${(y - sizes[i].h / 2).toFixed(2)}px,0) rotate(${b.angle.toFixed(4)}rad)`
            }
        }

        let last = 0
        let idle = 0
        const loop = (now: number) => {
            raf = 0
            if (dead) return
            const dt = Math.min(1000 / 30, last ? now - last : 1000 / 60)
            last = now
            hover(now)
            Matter.Engine.update(engine, dt)
            paint()
            // Stop the loop once everything has settled; any hover, drag or resize wakes it again
            const still = liftedRef.current.size === 0 && !(mc && (mc as any).body) && bodies.every((b) => b.isSleeping)
            idle = still ? idle + 1 : 0
            if (visible && !document.hidden && idle < 30) raf = requestAnimationFrame(loop)
        }
        const wake = () => {
            if (!started || dead || raf || !visible) return
            idle = 0
            last = 0
            raf = requestAnimationFrame(loop)
        }
        physicsRef.current = { wake }
        const wakeAll = () => {
            bodies.forEach((b) => Matter.Sleeping.set(b, false))
            wake()
        }
        root.addEventListener("pointerdown", wakeAll)
        root.addEventListener("pointermove", wake)

        // The pills drop in the first time the section comes into view
        paint()
        els.forEach((el) => el && (el.style.opacity = "0"))
        const io = new IntersectionObserver(
            ([e]) => {
                visible = e.isIntersecting
                if (visible && !started) {
                    started = true
                    els.forEach((el) => el && (el.style.opacity = "1"))
                }
                if (visible) wakeAll()
            },
            { threshold: 0.3 }
        )
        io.observe(root)
        const onVis = () => !document.hidden && wake()
        document.addEventListener("visibilitychange", onVis)

        const ro = new ResizeObserver(() => {
            const w = root.clientWidth, h = root.clientHeight
            if (Math.abs(w - W) < 1 && Math.abs(h - H) < 1) return
            W = w
            H = h
            makeWalls()
            bodies.forEach((b) => {
                const i = (b as any).index
                Matter.Body.setPosition(b, { x: Math.min(Math.max(b.position.x, sizes[i].w / 2), W - sizes[i].w / 2), y: Math.min(b.position.y, H - sizes[i].h / 2) })
            })
            wakeAll()
        })
        ro.observe(root)

        return () => {
            dead = true
            cancelAnimationFrame(raf)
            physicsRef.current = null
            io.disconnect()
            ro.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            root.removeEventListener("mouseleave", onLeave)
            root.removeEventListener("pointerdown", wakeAll)
            root.removeEventListener("pointermove", wake)
            if (mc) {
                Matter.Mouse.clearSourceEvents(mc.mouse)
                const m = mc.mouse as any
                root.removeEventListener("mousemove", m.mousemove)
                root.removeEventListener("mousedown", m.mousedown)
                root.removeEventListener("mouseup", m.mouseup)
            }
            Matter.Composite.clear(world, false)
            Matter.Engine.clear(engine)
        }
        // Rebuild only when the pills or the physics settings change
    }, [isStatic, labels.join("|"), JSON.stringify(pillFont), pillPadX, pillPadY, pillBorderWidth, gravity, liftHeight, bob, bounce, drag])

    // ---- Look ---------------------------------------------------------------------------------------
    const css = `
.${cls}{position:relative;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:pan-y}
.${cls}-grid{position:absolute;left:50%;transform:translateX(-50%);display:grid;grid-template-columns:repeat(${Math.max(1, columns)},${pieceSize}px);column-gap:${gridGapX}px;row-gap:${gridGapY}px;z-index:0}
.${cls}-lines{position:absolute;left:0;top:0;overflow:visible;pointer-events:none;opacity:${lineOpacity}}
.${cls}-piece{position:relative;z-index:1;width:${pieceSize}px;cursor:pointer;opacity:${restOpacity};transition:opacity .45s ease,transform .5s cubic-bezier(.2,.75,.2,1)}
.${cls}-piece img{width:100%;height:auto;display:block;-webkit-user-drag:none;pointer-events:none;filter:drop-shadow(0 2px 2px rgba(0,0,0,.18))}
.${cls}-piece[data-hot]{opacity:1;transform:translateY(-6px) scale(1.07)}
.${cls}-piece[data-tip]{z-index:5}
.${cls}-tip{position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%);pointer-events:none;z-index:6;animation:${cls}-tipin .22s cubic-bezier(.2,.75,.2,1) both}
@keyframes ${cls}-tipin{from{opacity:0;transform:translate(-50%,6px) scale(.96)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
.${cls}-piece[data-hot] img{filter:drop-shadow(0 12px 14px rgba(0,0,0,.28))}
.${cls}-pill{position:absolute;left:0;top:0;white-space:nowrap;box-sizing:border-box;padding:${pillPadY}px ${pillPadX}px;border-radius:999px;background:${pillFill};color:${pillText};border:${pillBorderWidth}px solid ${pillBorder};box-shadow:0 1px 1px rgba(0,0,0,.18),0 3px 6px -2px rgba(0,0,0,.22);will-change:transform;transition:box-shadow .5s ease,opacity .4s ease;cursor:grab;z-index:2}
.${cls}-pill[data-up]{box-shadow:0 0 0 1px rgba(255,255,255,.4) inset,0 18px 24px -8px rgba(0,0,0,.32),0 4px 8px -2px rgba(0,0,0,.18);z-index:3}
.${cls}-pill[data-hot]{z-index:4}
@media (prefers-reduced-motion:reduce){.${cls}-piece,.${cls}-pill{transition:none}}`

    const relatedTools = new Set(hotPill === null ? [] : links.pillToTools[hotPill] || [])

    // Canvas: a still pile along the bottom so the layout can be styled without running physics
    const staticPill = (i: number): React.CSSProperties => {
        const perRow = 6
        const row = Math.floor(i / perRow), col = i % perRow
        return { left: `${4 + col * 16 + (row % 2) * 6}%`, top: "auto", bottom: `${8 + row * 9}%`, transform: `rotate(${((i * 37) % 11) - 5}deg)` }
    }

    return (
        <div ref={rootRef} className={cls} style={{ width: 600, height: 400, ...style }}>
            <style>{css}</style>
            <div ref={gridRef} className={`${cls}-grid`} style={{ top: `${gridTop}%` }}>
                {gridLines && lines.w > 0 && (
                    <svg className={`${cls}-lines`} width={lines.w} height={lines.h} aria-hidden="true">
                        <defs>
                            {/* Dry brush: streaks of bare paper along the stroke and a crumbly edge */}
                            <filter id={`${cls}-dry`} x="-10%" y="-10%" width="120%" height="120%">
                                <feTurbulence type="fractalNoise" baseFrequency="0.9 0.04" numOctaves={2} seed={7} result="s" />
                                <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -2.4" result="gaps" />
                                <feComposite in="SourceGraphic" in2="gaps" operator="out" result="dry" />
                                <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves={2} seed={3} result="e" />
                                <feDisplacementMap in="dry" in2="e" scale={2.2} xChannelSelector="R" yChannelSelector="G" />
                            </filter>
                        </defs>
                        <g fill={lineColor} filter={`url(#${cls}-dry)`}>
                            {lines.xs.map((x, i) => (
                                <path key={`x${i}`} d={brushLine(x, -lineOverhang, x + (i % 2 ? 1.5 : -1.5), lines.h + lineOverhang, lineWidth, i + 1)} />
                            ))}
                            {lines.ys.map((y, i) => (
                                <path key={`y${i}`} d={brushLine(-lineOverhang, y, lines.w + lineOverhang, y + (i % 2 ? -1.5 : 1.5), lineWidth, i + 11)} />
                            ))}
                        </g>
                    </svg>
                )}
                {toolList.map((t, i) => {
                    const hot = hotTool === i || relatedTools.has(i)
                    return (
                        <div
                            key={i}
                            className={`${cls}-piece`}
                            data-piece=""
                            data-hot={hot ? "" : undefined}
                            data-tip={hotTool === i ? "" : undefined}
                            aria-label={t.name}
                            onPointerEnter={(e) => e.pointerType === "mouse" && setHotTool(i)}
                            onPointerLeave={(e) => e.pointerType === "mouse" && setHotTool((h) => (h === i ? null : h))}
                            onClick={() => window.matchMedia("(hover: none)").matches && setHotTool((h) => (h === i ? null : i))}
                        >
                            {t.image?.src ? (
                                <img src={t.image.src} alt={t.image.alt || t.name} draggable={false} onLoad={measureLines} />
                            ) : (
                                <div style={{ aspectRatio: "0.85", borderRadius: 8, border: "1px dashed rgba(0,0,0,.25)", display: "grid", placeItems: "center", font: "500 11px system-ui, sans-serif", color: "rgba(0,0,0,.5)" }}>{t.name}</div>
                            )}
                            {hotTool === i && !isStatic && (
                                <div className={`${cls}-tip`} role="tooltip">
                                    <InkTip
                                        name={t.name}
                                        tags={(t.facts || "").split(/,(?!\d)/).map((f) => f.trim()).filter(Boolean)}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            {labels.map((label, i) => (
                <div
                    key={label + i}
                    ref={(el) => {
                        pillRefs.current[i] = el
                    }}
                    className={`${cls}-pill`}
                    data-up={lifted.has(i) ? "" : undefined}
                    data-hot={hotPill === i ? "" : undefined}
                    style={{ ...pillFont, ...(isStatic ? staticPill(i) : null) }}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setHotPill(i)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && setHotPill((h) => (h === i ? null : h))}
                >
                    {label}
                </div>
            ))}
        </div>
    )
}

SkillsWall.displayName = "Skills Wall"

const DEFAULT_SKILLS = [
    "Interaction Design", "Framer Development", "Prototyping", "Web Development", "Responsive Design",
    "User Research", "UX Writing", "User Testing", "Design Thinking", "Wireframing", "Design Systems",
    "Product Design", "Brand Design", "Motion Design", "Micro-interactions", "AI Art Direction",
    "Prompt Engineering", "Workflow Automation", "Data-informed Design", "E-commerce Design",
    "Collaboration", "Problem-Solving",
]

const DEFAULT_TOOLS = [
    { name: "Framer", skills: "Interaction Design, Framer Development, Prototyping, Web Development, Responsive Design" },
    { name: "Figma", skills: "Wireframing, Design Systems, Prototyping, Product Design, Brand Design" },
    { name: "Claude", skills: "Web Development, Prompt Engineering, Workflow Automation" },
    { name: "ChatGPT", skills: "AI Art Direction, Prompt Engineering, UX Writing" },
    { name: "Shopify", skills: "E-commerce Design, Web Development" },
    { name: "Miro", skills: "Design Thinking, Collaboration, Problem-Solving" },
    { name: "Notion", skills: "Collaboration, UX Writing, Product Design" },
    { name: "Maze", skills: "User Research, UX Writing, User Testing" },
    { name: "Google Analytics", skills: "Data-informed Design, User Research" },
    { name: "Webflow", skills: "Web Development, Responsive Design, Interaction Design" },
    { name: "Lottie", skills: "Motion Design, Micro-interactions" },
    { name: "n8n", skills: "Workflow Automation, Problem-Solving" },
]

SkillsWall.defaultProps = {
    tools: DEFAULT_TOOLS,
    skills: DEFAULT_SKILLS,
    columns: 4,
    pieceSize: 84,
    gridGapX: 72,
    gridGapY: 28,
    gridTop: 22,
    restOpacity: 0.4,
    gridLines: true,
    lineColor: "#1d1b18",
    lineOpacity: 0.18,
    lineWidth: 3,
    lineOverhang: 16,
    pillFont: { fontSize: 15, fontWeight: 600, lineHeight: "1.2em" },
    pillText: "#4a1712",
    pillFill: "#fbf3df",
    pillBorder: "#7a1f1a",
    pillBorderWidth: 2,
    pillPadX: 20,
    pillPadY: 9,
    gravity: 1,
    liftHeight: 300,
    bob: 6,
    bounce: 0.15,
    drag: true,
}

addPropertyControls(SkillsWall, {
    tools: {
        type: ControlType.Array,
        title: "Tools",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name" },
                image: { type: ControlType.ResponsiveImage, title: "Piece" },
                skills: { type: ControlType.String, title: "Lifts", displayTextArea: true, placeholder: "Prototyping, Interaction Design", description: "Skills this tool lifts, comma-separated, written exactly as in Skills." },
                facts: { type: ControlType.String, title: "Facts", placeholder: "1,500+ hours, Verified expert", description: "Shown as tags in the hover bubble, comma-separated (commas inside numbers like 1,500 are kept). Leave empty to show just the name." },
            },
        },
        defaultValue: DEFAULT_TOOLS,
    },
    skills: {
        type: ControlType.Array,
        title: "Skills",
        maxCount: 40,
        control: { type: ControlType.String },
        defaultValue: DEFAULT_SKILLS,
    },
    columns: { type: ControlType.Number, title: "Columns", min: 1, max: 8, step: 1, displayStepper: true, defaultValue: 4 },
    pieceSize: { type: ControlType.Number, title: "Piece Size", min: 30, max: 200, step: 1, unit: "px", defaultValue: 84 },
    gridGapX: { type: ControlType.Number, title: "Gap X", min: 0, max: 200, step: 1, unit: "px", defaultValue: 72 },
    gridGapY: { type: ControlType.Number, title: "Gap Y", min: 0, max: 200, step: 1, unit: "px", defaultValue: 28 },
    gridTop: { type: ControlType.Number, title: "Grid Top", min: 0, max: 80, step: 1, unit: "%", defaultValue: 22 },
    gridLines: { type: ControlType.Boolean, title: "Grid Lines", defaultValue: true, description: "Faint brush strokes between the tools." },
    lineColor: { type: ControlType.Color, title: "Line Colour", defaultValue: "#1d1b18", hidden: (p) => !p.gridLines },
    lineOpacity: { type: ControlType.Number, title: "Line Opacity", min: 0.02, max: 1, step: 0.01, defaultValue: 0.18, hidden: (p) => !p.gridLines },
    lineWidth: { type: ControlType.Number, title: "Line Width", min: 0.5, max: 12, step: 0.5, unit: "px", defaultValue: 3, hidden: (p) => !p.gridLines },
    lineOverhang: { type: ControlType.Number, title: "Overhang", min: 0, max: 80, step: 1, unit: "px", defaultValue: 16, hidden: (p) => !p.gridLines, description: "How far the strokes run past the outer pieces." },
    restOpacity: { type: ControlType.Number, title: "Faded To", min: 0.05, max: 1, step: 0.05, defaultValue: 0.4, description: "Tool opacity until hovered. Hovered tools, and the tools behind a hovered skill, go to 100%." },
    pillFont: { type: ControlType.Font, title: "Pill Font", controls: "extended", defaultValue: { fontSize: 15, variant: "Semibold", lineHeight: "1.2em" } },
    pillText: { type: ControlType.Color, title: "Pill Text", defaultValue: "#4a1712" },
    pillFill: { type: ControlType.Color, title: "Pill Fill", defaultValue: "#fbf3df" },
    pillBorder: { type: ControlType.Color, title: "Pill Border", defaultValue: "#7a1f1a" },
    pillBorderWidth: { type: ControlType.Number, title: "Border", min: 0, max: 6, step: 0.5, unit: "px", defaultValue: 2 },
    pillPadX: { type: ControlType.Number, title: "Pad X", min: 4, max: 60, step: 1, unit: "px", defaultValue: 20 },
    pillPadY: { type: ControlType.Number, title: "Pad Y", min: 2, max: 30, step: 1, unit: "px", defaultValue: 9 },
    gravity: { type: ControlType.Number, title: "Gravity", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
    liftOnHover: { type: ControlType.Boolean, title: "Lift On Hover", defaultValue: true, description: "Off: hovering a tool shows only its bubble, and the skills stay where they are." },
    liftHeight: { type: ControlType.Number, title: "Lift To", min: 60, max: 800, step: 10, unit: "px", defaultValue: 300, description: "How far above the floor the linked skills float." },
    bob: { type: ControlType.Number, title: "Bob", min: 0, max: 20, step: 1, unit: "px", defaultValue: 6, description: "Gentle up-and-down while floating." },
    bounce: { type: ControlType.Number, title: "Bounce", min: 0, max: 0.8, step: 0.05, defaultValue: 0.15 },
    drag: { type: ControlType.Boolean, title: "Drag Pills", defaultValue: true, description: "Desktop only. Phones keep scrolling and tap a tool instead." },
})
