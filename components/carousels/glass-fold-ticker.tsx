// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"

type ResponsiveImageValue = { src?: string; srcSet?: string; alt?: string }

interface CardStyle {
    fill: string
    radius: string
}

interface GlassStyle {
    facets: number
    refraction: number
    chroma: number
    sheen: number
    light: number
    edge: string
    edgeWidth: number
}

interface DepthStyle {
    flat: number
    angle: number
    curve: number
    perspective: number
    walls: "toward" | "away"
}

interface Props {
    images: ResponsiveImageValue[]
    imageFit: "cover" | "contain"
    cardWidth: number
    cardHeight: number
    gap: number
    padding: string
    background: string
    card: CardStyle
    glass: GlassStyle
    depth: DepthStyle
    speed: number
    direction: "left" | "right"
    draggable: boolean
    pauseOnHover: boolean
    style?: CSSProperties
}

const PLACEHOLDER_COLORS = [
    "#1F3A5C",
    "#C64A3B",
    "#2E9E8F",
    "#E8B33C",
    "#2B2B30",
    "#7C6BB0",
]

const DEFAULT_CARD: CardStyle = {
    fill: "#1E1E22",
    radius: "0px 0px 0px 0px",
}

const DEFAULT_GLASS: GlassStyle = {
    facets: 5,
    refraction: 0,
    chroma: 18,
    sheen: 10,
    light: 40,
    edge: "rgba(255, 255, 255, 0.2)",
    edgeWidth: 0,
}

const DEFAULT_DEPTH: DepthStyle = {
    flat: 70,
    angle: 58,
    curve: 200,
    perspective: 1100,
    walls: "toward",
}

const FACET_BUDGET = 220 // hard ceiling on rendered panels
const MAX_SLOTS = 30
const BLEED = 1.003 // sub-pixel overlap so panel joins never open a hairline
const MAX_THROW = 4000 // px/s cap on release momentum
const CULL_MARGIN = 80 // px beyond the frame before a panel is hidden
const DEG = 180 / Math.PI

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

function isValidImage(img: unknown): img is ResponsiveImageValue {
    return (
        img !== undefined &&
        img !== null &&
        typeof img === "object" &&
        typeof (img as ResponsiveImageValue).src === "string" &&
        ((img as ResponsiveImageValue).src as string).length > 0
    )
}

function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v))
}

function mod(a: number, n: number) {
    return ((a % n) + n) % n
}

// Fixed per-panel variation, so every card breaks the same way and the
// panels stay visually consistent from one card to the next.
function drift(i: number) {
    const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453
    return 0.5 + 0.9 * (v - Math.floor(v))
}

// The card's four corners, in CSS order: top left, top right, bottom
// right, bottom left.
function cornerRadii(radius: string): [string, string, string, string] {
    const p = String(radius || "0px")
        .trim()
        .split(/\s+/)
    if (p.length === 1) return [p[0], p[0], p[0], p[0]]
    if (p.length === 2) return [p[0], p[1], p[0], p[1]]
    if (p.length === 3) return [p[0], p[1], p[2], p[1]]
    return [p[0], p[1], p[2], p[3]]
}

// A panel is a vertical slice of the card, so it only carries the card's
// corners that actually fall inside it. Without this the square panel and
// everything drawn on it, the seam line included, spills past the rounded
// corner of the picture.
function panelRadius(
    i: number,
    facets: number,
    r: [string, string, string, string]
) {
    const first = i === 0
    const last = i === facets - 1
    if (first && last) return `${r[0]} ${r[1]} ${r[2]} ${r[3]}`
    if (first) return `${r[0]} 0px 0px ${r[3]}`
    if (last) return `0px ${r[1]} ${r[2]} 0px`
    return "0px"
}

interface Layout {
    w: number
    fw: number
    facets: number
    step: number
    slots: number
    loop: number
    shift: number
    F: number
    R: number
    theta: number
    t: number
    perspective: number
    hideZ: number
    cullHalf: number
    sinNorm: number
}

interface Pt {
    x: number
    z: number
}

// Point at arc length s along the fold, measured from the centre.
// Flat inside +-F, then a circular bend, then a straight wall.
// Parameterised by ARC LENGTH, so equal slices of a card always map to
// equal lengths of the fold and the panels tile it exactly.
function pathPoint(s: number, lay: Layout, out: Pt): Pt {
    const a = Math.abs(s)
    if (a <= lay.F || lay.theta < 0.0001) {
        out.x = s
        out.z = 0
        return out
    }
    const side = s < 0 ? -1 : 1
    const e = a - lay.F
    const arc = lay.R * lay.theta
    let x: number
    let z: number
    if (e <= arc) {
        const phi = e / lay.R
        x = lay.F + lay.R * Math.sin(phi)
        z = lay.R * (1 - Math.cos(phi))
    } else {
        const r = e - arc
        x = lay.F + lay.R * Math.sin(lay.theta) + r * Math.cos(lay.theta)
        z = lay.R * (1 - Math.cos(lay.theta)) + r * Math.sin(lay.theta)
    }
    out.x = side * x
    out.z = lay.t * z
    return out
}

function projectX(p: Pt, lay: Layout) {
    const z = Math.min(p.z, lay.hideZ)
    return (p.x * lay.perspective) / (lay.perspective - z)
}

const PROBE: Pt = { x: 0, z: 0 }

function buildLayout(
    stageWidth: number,
    rootWidth: number,
    cardWidth: number,
    gap: number,
    count: number,
    wantFacets: number,
    depth: DepthStyle
): Layout {
    const w = Math.max(20, cardWidth)
    const step = w + Math.max(0, gap)
    const perspective = Math.max(200, depth.perspective)
    const theta = (clamp(depth.angle, 0, 85) * Math.PI) / 180

    const lay: Layout = {
        w,
        fw: w / wantFacets,
        facets: wantFacets,
        step,
        slots: count,
        loop: count * step,
        shift: 0,
        F: Math.max(0, (stageWidth * clamp(depth.flat, 0, 100)) / 100 / 2),
        R: Math.max(1, depth.curve),
        theta,
        t: depth.walls === "away" ? -1 : 1,
        perspective,
        hideZ: perspective * 0.8,
        cullHalf: Math.max(stageWidth, rootWidth) / 2 + CULL_MARGIN,
        // Normaliser so Light and Sheen reach full strength at whatever
        // wall angle is set, instead of only at very steep angles.
        sinNorm: Math.max(0.001, Math.sin(theta)),
    }

    // Walk outward until a card would sit fully outside the frame
    const limit = lay.cullHalf + w
    let S = lay.F + w
    for (let e = 0; e <= 16000; e += 10) {
        pathPoint(lay.F + e, lay, PROBE)
        S = lay.F + e
        if (Math.abs(PROBE.z) >= lay.hideZ) break
        if (projectX(PROBE, lay) > limit) break
    }

    // Slot count is a multiple of the image count, so every slot keeps the
    // same image for good and the loop never needs a React re-render. It
    // must also be long enough that a slot wraps well off screen, otherwise
    // cards visibly jump back to the start.
    const n = Math.max(1, count)
    const needed = 2 * (S + w) + step
    let slots = n * Math.ceil(needed / (n * step))
    if (slots > MAX_SLOTS) slots = n * Math.max(1, Math.floor(MAX_SLOTS / n))

    // Never trim slots to save panels, that is what causes the jump.
    // Trim panels per card instead.
    const facets = clamp(
        Math.min(wantFacets, Math.floor(FACET_BUDGET / slots)),
        1,
        12
    )

    lay.facets = facets
    lay.fw = w / facets
    lay.slots = slots
    lay.loop = slots * step
    lay.shift = slots % 2 === 0 ? step / 2 : 0
    return lay
}

interface FacetState {
    transform: string
    slide: string
    visible: boolean
    turn: number
}

const PT_A: Pt = { x: 0, z: 0 }
const PT_B: Pt = { x: 0, z: 0 }

// One panel of one card. Its two ends sit on the fold exactly one panel
// width apart along the arc, and the panel is squeezed onto the straight
// chord between them, so neighbouring panels meet with no overlap and no
// gap however far into the bend they are.
function facetState(
    j: number,
    i: number,
    offset: number,
    lay: Layout,
    refraction: number
): FacetState {
    const center =
        mod(j * lay.step - offset, lay.loop) - lay.loop / 2 + lay.shift
    const x0 = i * lay.fw
    const s0 = center - lay.w / 2 + x0

    const p0 = pathPoint(s0, lay, PT_A)
    const ax = p0.x
    const az = p0.z
    const p1 = pathPoint(s0 + lay.fw, lay, PT_B)

    const dx = p1.x - ax
    const dz = p1.z - az
    const chord = Math.sqrt(dx * dx + dz * dz) || 0.0001
    const rot = Math.atan2(-dz, dx)

    const pxA = projectX(p0, lay)
    const pxB = projectX(p1, lay)
    const visible =
        Math.abs(az) < lay.hideZ &&
        Math.max(pxA, pxB) > -lay.cullHalf &&
        Math.min(pxA, pxB) < lay.cullHalf

    // Refraction never pulls content past the edge of its own card, so the
    // picture stays aligned from one card to the next and no bare card
    // background is ever exposed.
    const slide = clamp(
        -Math.sin(rot) * refraction * drift(i),
        x0 + lay.fw - lay.w,
        x0
    )

    // The hairline bleed closes the join to the next panel, so the last
    // panel of a card only gets it when the cards actually touch. With a
    // gap it would poke a sliver of panel out into the empty space.
    const bleed = i < lay.facets - 1 || lay.step === lay.w ? BLEED : 1

    return {
        transform: `translate3d(${ax.toFixed(1)}px, 0px, ${az.toFixed(
            1
        )}px) rotateY(${(rot * DEG).toFixed(2)}deg) scaleX(${(
            (chord / lay.fw) *
            bleed
        ).toFixed(4)})`,
        slide: `translate3d(${slide.toFixed(2)}px, 0px, 0px)`,
        visible,
        // Symmetric, front-lit reaction: zero while a panel faces you and
        // building as it turns, whichever way it turns, so both walls read
        // exactly the same instead of one bright and one dark.
        turn: clamp(Math.abs(Math.sin(rot)) / lay.sinNorm, 0, 1),
    }
}

interface FacetCache {
    t?: string
    s?: string
    v?: string
    k?: number
}

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GlassFoldTicker(props: Props) {
    const {
        images,
        imageFit,
        cardWidth,
        cardHeight,
        gap,
        padding,
        background,
        speed,
        direction,
        draggable,
        pauseOnHover,
        style,
    } = props

    const card: CardStyle = { ...DEFAULT_CARD, ...(props.card || {}) }
    const glass: GlassStyle = { ...DEFAULT_GLASS, ...(props.glass || {}) }
    const depth: DepthStyle = { ...DEFAULT_DEPTH, ...(props.depth || {}) }

    const isOnCanvas = useIsOnFramerCanvas()
    const isStatic = useIsStaticRenderer()

    const validImages = Array.isArray(images) ? images.filter(isValidImage) : []
    const hasImages = validImages.length > 0
    const count = hasImages ? validImages.length : PLACEHOLDER_COLORS.length

    const wantFacets = clamp(Math.round(glass.facets) || 1, 1, 12)
    const refraction = clamp(glass.refraction, 0, 60)
    const edgeW = clamp(glass.edgeWidth, 0, 4)
    const sheen = clamp(glass.sheen, 0, 100) / 100
    const chroma = clamp(glass.chroma, 0, 100) / 100
    const dim = clamp(glass.light, 0, 100) / 100

    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const facetRefs = useRef<(HTMLDivElement | null)[]>([])
    const slideRefs = useRef<(HTMLDivElement | null)[]>([])
    const reactRefs = useRef<(HTMLDivElement | null)[]>([])
    const cache = useRef<FacetCache[]>([])
    const offsetRef = useRef(0)
    const velocityRef = useRef(0)
    const hoverRef = useRef(false)
    const inViewRef = useRef(true)
    const dragRef = useRef({
        active: false,
        pointerId: -1,
        lastX: 0,
        lastT: 0,
        vel: 0,
    })

    const [size, setSize] = useState({ stage: 1200, root: 1200 })
    const [reducedMotion, setReducedMotion] = useState(false)

    const layout = buildLayout(
        size.stage,
        size.root,
        cardWidth,
        gap,
        count,
        wantFacets,
        depth
    )

    const layoutRef = useRef(layout)
    layoutRef.current = layout
    const refractRef = useRef(refraction)
    refractRef.current = refraction
    const reactRef = useRef(sheen > 0 || chroma > 0 || dim > 0)
    reactRef.current = sheen > 0 || chroma > 0 || dim > 0

    const settingsRef = useRef({
        speed,
        direction,
        pauseOnHover,
        reducedMotion,
    })
    settingsRef.current = { speed, direction, pauseOnHover, reducedMotion }

    const canDrag = draggable && !isStatic

    // React just wrote fresh inline styles, so the write cache is stale
    useIsoLayoutEffect(() => {
        cache.current = []
    })

    // Measure so the bend starts where the flat area ends
    useIsoLayoutEffect(() => {
        const stage = stageRef.current
        const root = rootRef.current
        if (!stage || !root) return
        const update = () => {
            const s = stage.offsetWidth
            const r = root.offsetWidth
            if (s > 0 && r > 0)
                setSize((prev) =>
                    prev.stage === s && prev.root === r
                        ? prev
                        : { stage: s, root: r }
                )
        }
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(root)
        return () => ro.disconnect()
    }, [])

    // Skip all DOM work while the ticker is scrolled out of view
    useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic || typeof IntersectionObserver === "undefined")
            return
        const io = new IntersectionObserver(
            ([entry]) => (inViewRef.current = entry.isIntersecting),
            { rootMargin: "100px" }
        )
        io.observe(root)
        return () => io.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    // Animation loop. Writes straight to the DOM, no React re-renders, and
    // only values that actually changed are written, so flat panels in the
    // middle cost nothing and only the ones inside the bend do work.
    useEffect(() => {
        if (isStatic) return

        let raf = 0
        let last = performance.now()

        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now

            const s = settingsRef.current
            const drag = dragRef.current
            const lay = layoutRef.current
            const refract = refractRef.current
            const reacts = reactRef.current

            if (drag.active) {
                velocityRef.current = drag.vel
            } else {
                const auto = s.reducedMotion
                    ? 0
                    : s.speed * (s.direction === "left" ? 1 : -1)
                const target = s.pauseOnHover && hoverRef.current ? 0 : auto
                velocityRef.current +=
                    (target - velocityRef.current) * Math.min(1, dt * 3)
                offsetRef.current += velocityRef.current * dt
            }

            offsetRef.current = mod(offsetRef.current, lay.loop)

            if (inViewRef.current) {
                for (let j = 0; j < lay.slots; j++) {
                    for (let i = 0; i < lay.facets; i++) {
                        const idx = j * lay.facets + i
                        const el = facetRefs.current[idx]
                        if (!el) continue
                        const c =
                            cache.current[idx] || (cache.current[idx] = {})
                        const r = facetState(
                            j,
                            i,
                            offsetRef.current,
                            lay,
                            refract
                        )

                        const v = r.visible ? "visible" : "hidden"
                        if (c.v !== v) {
                            el.style.visibility = v
                            c.v = v
                        }
                        if (!r.visible) continue

                        if (c.t !== r.transform) {
                            el.style.transform = r.transform
                            c.t = r.transform
                        }
                        if (refract > 0 && c.s !== r.slide) {
                            const sEl = slideRefs.current[idx]
                            if (sEl) sEl.style.transform = r.slide
                            c.s = r.slide
                        }
                        if (reacts && c.k !== r.turn) {
                            const kEl = reactRefs.current[idx]
                            if (kEl) kEl.style.opacity = r.turn.toFixed(3)
                            c.k = r.turn
                        }
                    }
                }
            }

            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [isStatic])

    const setCursor = (c: string) => {
        if (rootRef.current) rootRef.current.style.cursor = c
    }

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!canDrag) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        dragRef.current = {
            active: true,
            pointerId: e.pointerId,
            lastX: e.clientX,
            lastT: performance.now(),
            vel: 0,
        }
        e.currentTarget.setPointerCapture?.(e.pointerId)
        setCursor("grabbing")
    }

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const d = dragRef.current
        if (!d.active || e.pointerId !== d.pointerId) return
        const now = performance.now()
        const dx = e.clientX - d.lastX
        const dt = Math.max(1, now - d.lastT) / 1000
        offsetRef.current -= dx
        d.vel = d.vel * 0.6 + (-dx / dt) * 0.4
        d.lastX = e.clientX
        d.lastT = now
    }

    const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
        const d = dragRef.current
        if (!d.active || e.pointerId !== d.pointerId) return
        d.active = false
        // Holding still before letting go means no throw
        const idle = performance.now() - d.lastT > 80
        velocityRef.current = idle ? 0 : clamp(d.vel, -MAX_THROW, MAX_THROW)
        e.currentTarget.releasePointerCapture?.(e.pointerId)
        setCursor(canDrag ? "grab" : "default")
    }

    const { facets, fw } = layout
    const slots = Array.from({ length: layout.slots }, (_, j) => j)
    const facetList = Array.from({ length: facets }, (_, i) => i)
    const radii = cornerRadii(card.radius)
    const panelRadii = facetList.map((i) => panelRadius(i, facets, radii))

    // The seam line belongs on folds between panels, never on a card's own
    // outer edge. With a gap there is no fold at the start of a card, so a
    // line there would just hang in the empty space beside the picture.
    const cardsTouch = layout.step === layout.w

    // Everything a panel does as it turns lives in one overlay driven by a
    // single opacity, so each panel costs one write per frame rather than
    // three separate fading layers that used to beat on each other.
    const reactLayers: string[] = []
    if (chroma > 0)
        reactLayers.push(
            `linear-gradient(90deg, rgba(120,210,255,${(0.55 * chroma).toFixed(
                3
            )}) 0%, rgba(120,210,255,0) 18%, rgba(0,0,0,0) 50%, rgba(255,120,190,0) 82%, rgba(255,120,190,${(
                0.55 * chroma
            ).toFixed(3)}) 100%)`
        )
    if (sheen > 0)
        reactLayers.push(
            `linear-gradient(104deg, rgba(255,255,255,${(0.45 * sheen).toFixed(
                3
            )}) 0%, rgba(255,255,255,0) 58%)`
        )
    if (dim > 0)
        reactLayers.push(
            `linear-gradient(0deg, rgba(5,7,12,${dim.toFixed(
                3
            )}), rgba(5,7,12,${dim.toFixed(3)}))`
        )
    const reacts = reactLayers.length > 0

    // Faint pane reflection that is always there, so glass reads as glass
    // even where the ticker is perfectly flat.
    const paneSheen = sheen > 0 || edgeW > 0

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                background,
                padding,
                boxSizing: "border-box",
                cursor: canDrag ? "grab" : "default",
                touchAction: canDrag ? "pan-y" : "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
            onPointerEnter={(e) => {
                if (e.pointerType === "mouse") hoverRef.current = true
            }}
            onPointerLeave={(e) => {
                if (e.pointerType === "mouse") hoverRef.current = false
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDragStart={(e) => canDrag && e.preventDefault()}
        >
            <div
                ref={stageRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: cardHeight,
                    flexShrink: 0,
                    perspective: `${layout.perspective}px`,
                    perspectiveOrigin: "50% 50%",
                    transformStyle: "preserve-3d",
                }}
            >
                {slots.map((j) => {
                    const index = j % count
                    const img = hasImages ? validImages[index] : null

                    return facetList.map((i) => {
                        const idx = j * facets + i
                        const x0 = i * fw
                        // Initial state, so the canvas shows a real snapshot
                        const r = facetState(
                            j,
                            i,
                            offsetRef.current,
                            layout,
                            refraction
                        )

                        return (
                            <div
                                key={idx}
                                ref={(el) => (facetRefs.current[idx] = el)}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "50%",
                                    // The panel is exactly one panel wide and
                                    // clips by overflow, so its composited
                                    // layer is a fraction of a full card.
                                    width: fw,
                                    height: cardHeight,
                                    overflow: "hidden",
                                    // Carries only the card corners that fall
                                    // inside this panel, so nothing drawn on
                                    // it escapes the rounded picture.
                                    borderRadius: panelRadii[i],
                                    transformOrigin: "0% 50%",
                                    transform: r.transform,
                                    visibility: r.visible
                                        ? "visible"
                                        : "hidden",
                                    transformStyle: "flat",
                                    backfaceVisibility: "hidden",
                                    willChange: "transform",
                                    contain: "layout paint style",
                                    pointerEvents: "none",
                                }}
                            >
                                <div
                                    ref={(el) => (slideRefs.current[idx] = el)}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: -x0,
                                        width: cardWidth,
                                        height: "100%",
                                        transform: r.slide,
                                        borderRadius: card.radius,
                                        background: img
                                            ? card.fill
                                            : PLACEHOLDER_COLORS[
                                                  index %
                                                      PLACEHOLDER_COLORS.length
                                              ],
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {img ? (
                                        <img
                                            src={img.src}
                                            srcSet={img.srcSet}
                                            sizes={`${cardWidth}px`}
                                            alt={img.alt || ""}
                                            draggable={false}
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                height: "100%",
                                                objectFit: imageFit,
                                                userSelect: "none",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    ) : (
                                        isOnCanvas &&
                                        i === 0 && (
                                            <span
                                                style={{
                                                    fontFamily: "sans-serif",
                                                    fontSize: 13,
                                                    whiteSpace: "nowrap",
                                                    color: "rgba(255,255,255,0.9)",
                                                    background:
                                                        "rgba(0,0,0,0.35)",
                                                    padding: "6px 10px",
                                                    borderRadius: 6,
                                                }}
                                            >
                                                Add images →
                                            </span>
                                        )
                                    )}
                                </div>

                                {/* always-on pane reflection, and a single
                                    seam line so joins are never drawn twice */}
                                {paneSheen && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            pointerEvents: "none",
                                            backgroundImage:
                                                sheen > 0
                                                    ? `linear-gradient(104deg, rgba(255,255,255,${(
                                                          sheen * 0.3
                                                      ).toFixed(
                                                          3
                                                      )}) 0%, rgba(255,255,255,0) 46%)`
                                                    : undefined,
                                            borderLeft:
                                                edgeW > 0 &&
                                                (i > 0 || cardsTouch)
                                                    ? `${edgeW}px solid ${glass.edge}`
                                                    : undefined,
                                            borderRadius: panelRadii[i],
                                            boxSizing: "border-box",
                                        }}
                                    />
                                )}

                                {/* one overlay for everything that changes
                                    as the panel turns */}
                                {reacts && (
                                    <div
                                        ref={(el) =>
                                            (reactRefs.current[idx] = el)
                                        }
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            pointerEvents: "none",
                                            opacity: r.turn,
                                            borderRadius: panelRadii[i],
                                            backgroundImage:
                                                reactLayers.join(", "),
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })
                })}
            </div>

            {isOnCanvas && (
                <span
                    style={{
                        position: "absolute",
                        bottom: 6,
                        right: 8,
                        fontSize: 9,
                        fontFamily: "sans-serif",
                        color: "#FFFFFF",
                        opacity: 0.4,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                >
                    preview · live in publish
                </span>
            )}
        </div>
    )
}

GlassFoldTicker.defaultProps = {
    images: [],
    imageFit: "cover",
    cardWidth: 600,
    cardHeight: 420,
    gap: 12,
    padding: "70px 0px 70px 0px",
    background: "#0B0D12",
    card: {
        fill: "#1E1E22",
        radius: "0px 0px 0px 0px",
    },
    glass: {
        facets: 5,
        refraction: 0,
        chroma: 18,
        sheen: 10,
        light: 40,
        edge: "rgba(255, 255, 255, 0.2)",
        edgeWidth: 0,
    },
    depth: {
        flat: 70,
        angle: 58,
        curve: 200,
        perspective: 1100,
        walls: "toward",
    },
    speed: 45,
    direction: "left",
    draggable: true,
    pauseOnHover: true,
}

addPropertyControls(GlassFoldTicker, {
    // Content
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 24,
        defaultValue: [],
        description: "Images shown in the ticker. They loop endlessly.",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        displaySegmentedControl: true,
        defaultValue: "cover",
        description:
            "Fill crops images to the card. Fit shows the whole image.",
    },

    // Layout
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 600,
        min: 60,
        max: 1600,
        step: 1,
        unit: "px",
        displayStepper: true,
        description: "Width of each image card.",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 420,
        min: 60,
        max: 1600,
        step: 1,
        unit: "px",
        displayStepper: true,
        description: "Height of each image card.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
        description:
            "Space between cards. Set it to 0 when the images are slices of one continuous picture.",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "70px 0px 70px 0px",
        description:
            "Space around the ticker. Top and bottom padding gives the walls room to grow as they lean toward you.",
    },

    // Style
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0D12",
        description:
            "Background color behind the cards. For a gradient, set this to fully transparent and put the gradient on the frame behind.",
    },
    card: {
        type: ControlType.Object,
        title: "Card",
        buttonTitle: "Card style",
        description: "Look of each image card.",
        controls: {
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#1E1E22",
                description: "Shown behind images, visible with Fit.",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "0px 0px 0px 0px",
                description:
                    "Corner radius of each card. Only the panels at the ends of a card show it.",
            },
        },
    },
    glass: {
        type: ControlType.Object,
        title: "Glass",
        buttonTitle: "Glass panels",
        icon: "effect",
        description:
            "Splits each card into equal glass panels that fold on the bend and react to the light as they turn.",
        controls: {
            facets: {
                type: ControlType.Number,
                title: "Panels",
                defaultValue: 5,
                min: 1,
                max: 12,
                step: 1,
                displayStepper: true,
                description:
                    "Equal panels per card, all the same width. More panels means a smoother bend and more work for the browser.",
            },
            refraction: {
                type: ControlType.Number,
                title: "Refract",
                defaultValue: 0,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                description:
                    "Slides the picture inside each panel as it turns, so the image visibly breaks at the seams. Keep it at 0 when the images are slices of one continuous picture.",
            },
            chroma: {
                type: ControlType.Number,
                title: "Chroma",
                defaultValue: 18,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "Colour fringe along the panel edges, like light through a prism. Fades in as a panel turns.",
            },
            sheen: {
                type: ControlType.Number,
                title: "Sheen",
                defaultValue: 10,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "Reflection across each pane. Faint while flat, stronger as the panel turns.",
            },
            light: {
                type: ControlType.Number,
                title: "Light",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "How much a panel dims as it turns away from you. Both walls dim the same amount, so neither side is brighter. 0 keeps everything flat.",
            },
            edge: {
                type: ControlType.Color,
                title: "Edge",
                defaultValue: "rgba(255, 255, 255, 0.2)",
                description: "Colour of the seam line between panels.",
            },
            edgeWidth: {
                type: ControlType.Number,
                title: "Edge Size",
                defaultValue: 0,
                min: 0,
                max: 4,
                step: 0.5,
                unit: "px",
                description:
                    "Thickness of the seam line. It is only drawn on folds between panels, never around the outside of a card. 0 leaves the folds to read from the shading alone, which is cleaner in motion.",
            },
        },
    },
    depth: {
        type: ControlType.Object,
        title: "Depth",
        buttonTitle: "3D walls",
        icon: "effect",
        description: "Where and how hard the panels fold at the edges.",
        controls: {
            flat: {
                type: ControlType.Number,
                title: "Flat Area",
                defaultValue: 70,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "Share of the width that stays flat. Panels start folding where it ends.",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 58,
                min: 0,
                max: 85,
                step: 1,
                unit: "°",
                description: "How far the walls turn. 0 is a flat ticker.",
            },
            curve: {
                type: ControlType.Number,
                title: "Curve",
                defaultValue: 200,
                min: 0,
                max: 800,
                step: 5,
                unit: "px",
                description:
                    "How far the bend is spread out. Low is a sharp corner, high folds gradually across several panels and looks smoother in motion.",
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: 1100,
                min: 200,
                max: 4000,
                step: 50,
                unit: "px",
                description:
                    "Camera distance. Lower is more dramatic, higher is flatter.",
            },
            walls: {
                type: ControlType.Enum,
                title: "Walls",
                options: ["toward", "away"],
                optionTitles: ["Toward", "Away"],
                displaySegmentedControl: true,
                defaultValue: "toward",
                description:
                    "Toward folds the edges at you like a corridor. Away folds them back.",
            },
        },
    },

    // Behavior
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 45,
        min: 0,
        max: 600,
        step: 5,
        unit: "px/s",
        description: "Auto scroll speed. 0 turns it into a drag-only carousel.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
        description: "Which way the cards move.",
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Drag",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        description:
            "Lets visitors drag and throw the ticker. It glides back to auto speed after.",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Hover",
        enabledTitle: "Pause",
        disabledTitle: "Keep",
        defaultValue: true,
        description:
            "Smoothly slows to a stop while hovered.\n\nMade by [Justyna](https://framer.link/justyna-d)",
    },
})
