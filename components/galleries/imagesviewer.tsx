import * as React from "react"
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ─────────────────── Types ─────────────────── */
type Metrics = {
    scrollLeft: number
    scrollTop: number
    clientWidth: number
    clientHeight: number
    scrollWidth: number
    scrollHeight: number
}
type Link = {
    getMetrics: () => Metrics | null
    getImages: () => string[]
    subscribe: (cb: () => void) => () => void
    setScroll: (left: number, top: number, behavior?: ScrollBehavior) => void
    getPadding: () => number
    getGap: () => number
}

/* ─────────────────── Strong registry (owner + priority) ─────────────────── */
type RegEntry = { link: Link; owner: symbol; priority: number }
const _registry = new Map<string, RegEntry>()

const regSubs = new Map<string, Set<() => void>>()
function _notifyReg(id: string) {
    regSubs.get(id)?.forEach((cb) => cb())
}
function onReg(id: string, cb: () => void) {
    const s = regSubs.get(id) ?? new Set<() => void>()
    s.add(cb)
    regSubs.set(id, s)
    return () => {
        s.delete(cb)
    }
}
function setRegistry(id: string, link: Link, priority: number) {
    const owner = Symbol(id)
    const prev = _registry.get(id)
    if (!prev || priority >= prev.priority) {
        _registry.set(id, { link, owner, priority })
        _notifyReg(id)
    }
    return owner
}
function unsetRegistry(id: string, owner: symbol) {
    const cur = _registry.get(id)
    if (cur && cur.owner === owner) {
        _registry.delete(id)
        _notifyReg(id)
    }
}
function getLink(id: string): Link | null {
    return _registry.get(id)?.link ?? null
}

/* ─────────────────── Utils ─────────────────── */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const decayFor = (t: "none" | "short" | "medium" | "long") =>
    t === "none" ? 0 : t === "short" ? 0.9 : t === "medium" ? 0.94 : 0.97

/* ─────────────────── Drag + inertia ─────────────────── */
function useDragScroll(
    ref: React.RefObject<HTMLElement>,
    enabled: boolean,
    speed: number,
    transition: "none" | "short" | "medium" | "long"
) {
    const isDown = useRef(false)
    const start = useRef({ x: 0, y: 0, sl: 0, st: 0 })
    const vel = useRef({ vx: 0, vy: 0 })
    const last = useRef({ x: 0, y: 0, t: 0 })
    const raf = useRef<number | null>(null)
    const stopRAF = () => {
        if (raf.current) cancelAnimationFrame(raf.current)
        raf.current = null
    }

    const onPointerDown = (e: React.PointerEvent) => {
        if (!enabled) return
        const el = ref.current
        if (!el) return
        el.setPointerCapture?.(e.pointerId)
        isDown.current = true
        stopRAF()
        start.current = {
            x: e.clientX,
            y: e.clientY,
            sl: el.scrollLeft,
            st: el.scrollTop,
        }
        last.current = { x: e.clientX, y: e.clientY, t: performance.now() }
        el.style.cursor = "grabbing"
    }
    const onPointerMove = (e: React.PointerEvent) => {
        if (!enabled || !isDown.current) return
        const el = ref.current
        if (!el) return
        const dx = e.clientX - start.current.x
        const dy = e.clientY - start.current.y
        el.scrollLeft = start.current.sl - dx
        el.scrollTop = start.current.st - dy
        const now = performance.now()
        const dt = Math.max(1, now - last.current.t)
        vel.current.vx = (e.clientX - last.current.x) / dt
        vel.current.vy = (e.clientY - last.current.y) / dt
        last.current = { x: e.clientX, y: e.clientY, t: now }
    }
    const onPointerUp = () => {
        if (!enabled) return
        const el = ref.current
        if (!el) return
        isDown.current = false
        el.style.cursor = ""
        const decay = decayFor(transition)
        if (decay === 0) return
        const mult = clamp(speed, 0.5, 2)
        const step = () => {
            const maxL = Math.max(0, el.scrollWidth - el.clientWidth)
            const maxT = Math.max(0, el.scrollHeight - el.clientHeight)
            let nextL = el.scrollLeft - vel.current.vx * mult * 16
            let nextT = el.scrollTop - vel.current.vy * mult * 16
            if (nextL <= 0 || nextL >= maxL) {
                nextL = clamp(nextL, 0, maxL)
                vel.current.vx *= 0.35
            }
            if (nextT <= 0 || nextT >= maxT) {
                nextT = clamp(nextT, 0, maxT)
                vel.current.vy *= 0.35
            }
            el.scrollLeft = nextL
            el.scrollTop = nextT
            vel.current.vx *= decay
            vel.current.vy *= decay
            if (
                Math.abs(vel.current.vx) < 0.01 &&
                Math.abs(vel.current.vy) < 0.01
            )
                return
            raf.current = requestAnimationFrame(step)
        }
        step()
    }
    return { onPointerDown, onPointerMove, onPointerUp }
}

/* ─────────────────── Gallery (inner) ─────────────────── */
type GalleryProps = {
    linkId: string
    images: string[]
    gap: number
    padding: number
    headless?: boolean
    layout?: { gap?: number; padding?: number }
    style?: {
        bg?: string
        radius?: number
        itemRadius?: number
        itemBG?: string
        hideScrollbar?: boolean
    }
    behavior?: {
        dragEnabled?: boolean
        dragSpeed?: number
        dragTransition?: "none" | "short" | "medium" | "long"
        lenisCompat?: boolean
    }
}

function GalleryImages(props: Partial<GalleryProps>) {
    const {
        linkId = "gal-1",
        images = [],
        gap = 12,
        padding = 12,
        headless = false,
        layout,
        style,
        behavior,
    } = props

    const GAP = layout?.gap ?? gap
    const PADDING = layout?.padding ?? padding
    const BG = style?.bg ?? "#0f0f12"
    const RADIUS = style?.radius ?? 12
    const ITEM_RADIUS = style?.itemRadius ?? 10
    const ITEM_BG = style?.itemBG ?? "rgba(255,255,255,0.03)"
    const HIDE_SCROLL = style?.hideScrollbar ?? true
    const DRAG_ENABLED = (behavior?.dragEnabled ?? true) && !headless
    const DRAG_SPEED = behavior?.dragSpeed ?? 1
    const DRAG_TRANSITION = behavior?.dragTransition ?? "medium"
    const LENIS = behavior?.lenisCompat ?? true

    const scRef = useRef<HTMLDivElement | null>(null)
    const subs = useRef(new Set<() => void>())
    const { onPointerDown, onPointerMove, onPointerUp } = useDragScroll(
        scRef,
        DRAG_ENABLED,
        DRAG_SPEED,
        DRAG_TRANSITION
    )
    const notify = () => subs.current.forEach((cb) => cb())

    const getMetrics = (): Metrics | null => {
        const el = scRef.current
        if (!el) return null
        return {
            scrollLeft: el.scrollLeft,
            scrollTop: el.scrollTop,
            clientWidth: el.clientWidth,
            clientHeight: el.clientHeight,
            scrollWidth: el.scrollWidth,
            scrollHeight: el.scrollHeight,
        }
    }

    // strong registry: set/unset with priority
    const ownerRef = useRef<symbol | null>(null)
    useLayoutEffect(() => {
        const link: Link = {
            getMetrics,
            getImages: () => images,
            subscribe: (cb) => {
                subs.current.add(cb)
                return () => subs.current.delete(cb)
            },
            setScroll: (l, t, behavior: ScrollBehavior = "auto") =>
                scRef.current?.scrollTo({ left: l, top: t, behavior }),
            getPadding: () => PADDING,
            getGap: () => GAP,
        }
        ownerRef.current = setRegistry(linkId, link, headless ? 0 : 1)
        return () => {
            if (ownerRef.current) unsetRegistry(linkId, ownerRef.current)
        }
    }, [linkId, images, PADDING, GAP, headless])

    useEffect(() => {
        const el = scRef.current
        if (!el) return
        const onScroll = () => notify()
        el.addEventListener("scroll", onScroll, { passive: true })
        const ro = new ResizeObserver(() => notify())
        ro.observe(el)
        notify()
        return () => {
            el.removeEventListener("scroll", onScroll)
            ro.disconnect()
        }
    }, [images.length])

    const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
        if (!LENIS || headless) return
        const el = scRef.current
        if (!el) return
        el.scrollTop += e.deltaY
        el.scrollLeft += e.deltaX
        e.stopPropagation()
    }

    const container: React.CSSProperties = {
        width: "100%",
        height: "100%",
        overflow: "auto",
        background: BG,
        borderRadius: RADIUS,
        cursor: DRAG_ENABLED ? "grab" : "default",
        userSelect: "none",
        boxSizing: "border-box",
        padding: PADDING,
        touchAction: "none",
        overscrollBehavior: "contain",
        scrollbarWidth: HIDE_SCROLL ? "none" : undefined,
        msOverflowStyle: HIDE_SCROLL ? "none" : undefined,
        ...(headless
            ? {
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  pointerEvents: "none",
              }
            : {}),
    }
    const list: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: GAP,
    }
    const wrap: React.CSSProperties = {
        width: "100%",
        overflow: "hidden",
        borderRadius: ITEM_RADIUS,
        background: ITEM_BG,
    }
    const img: React.CSSProperties = {
        width: "100%",
        height: "auto",
        display: "block",
        objectFit: "contain",
        userSelect: "none",
        pointerEvents: "none",
        WebkitUserDrag: "none" as any,
    }

    return (
        <div
            data-gal={linkId}
            ref={scRef}
            style={container}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            data-lenis-prevent={LENIS ? "" : undefined}
            data-lenis-prevent-wheel={LENIS ? "" : undefined}
            data-lenis-prevent-touch={LENIS ? "" : undefined}
        >
            {HIDE_SCROLL && (
                <style>{`[data-gal="${linkId}"]::-webkit-scrollbar{width:0;height:0}`}</style>
            )}
            <div style={list}>
                {images.map((src, i) => (
                    <div key={i} style={wrap}>
                        <img
                            src={src}
                            alt={`img-${i}`}
                            style={img}
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            onLoad={notify}
                            onError={notify}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ─────────────────── MiniMap (inner) ─────────────────── */
type MiniMapProps = {
    linkId: string
    style?: {
        bg?: string
        radius?: number
        miniPadding?: number
        outline?: boolean
        outlineColor?: string
        outlineWidth?: number
        thumbRadius?: number
        thumbBG?: string
        dimOpacity?: number
    }
    viewport?: {
        showViewport?: boolean
        viewportStroke?: number
        viewportColor?: string
        viewportFill?: string
        viewportRadius?: number
    }
    behavior?: {
        horizontal?: boolean
        vpDragEnabled?: boolean
        vpDragSpeed?: number
        vpTransition?: "none" | "short" | "medium" | "long"
        clickToJump?: boolean
        jumpMs?: number
        jumpEase?: "linear" | "easeOut"
        lenisCompat?: boolean
    }
}

function MiniMapImages(props: Partial<MiniMapProps>) {
    const { linkId = "gal-1", style, viewport, behavior } = props

    const RADIUS = style?.radius ?? 8
    const BG = style?.bg ?? "rgba(255,255,255,0.04)"
    const MINI_PADDING = style?.miniPadding ?? 0
    const OUTLINE = style?.outline ?? true
    const OUTLINE_COLOR = style?.outlineColor ?? "rgba(255,255,255,0.08)"
    const OUTLINE_W = style?.outlineWidth ?? 1
    const THUMB_RADIUS = style?.thumbRadius ?? 6
    const THUMB_BG = style?.thumbBG ?? "rgba(255,255,255,0.03)"
    const DIM_OP = style?.dimOpacity ?? 0.95

    const VP_VISIBLE = viewport?.showViewport ?? true
    const VP_STROKE = viewport?.viewportStroke ?? 1
    const VP_COLOR = viewport?.viewportColor ?? "rgba(255,255,255,0.95)"
    const VP_FILL = viewport?.viewportFill ?? "rgba(255,255,255,0.08)"
    const VP_RADIUS = viewport?.viewportRadius ?? 6

    const H = behavior?.horizontal ?? false
    const VP_DRAG = behavior?.vpDragEnabled ?? true
    const VP_SPEED = behavior?.vpDragSpeed ?? 1
    const VP_TRANS = behavior?.vpTransition ?? "none"
    const CLICK_JUMP = behavior?.clickToJump ?? true
    const JUMP_MS = behavior?.jumpMs ?? 350
    const JUMP_EASE = behavior?.jumpEase ?? "easeOut"
    const LENIS = behavior?.lenisCompat ?? true

    const wrapRef = useRef<HTMLDivElement | null>(null)
    const shellRef = useRef<HTMLDivElement | null>(null)
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [images, setImages] = useState<string[]>([])
    const [s, setS] = useState(1)
    const linkRef = useRef<Link | null>(null)
    const unsubRef = useRef<null | (() => void)>(null)

    // re-bind on registry changes
    useEffect(() => {
        const rebind = () => {
            const newLink = getLink(linkId)
            if (linkRef.current === newLink) return
            unsubRef.current?.()
            linkRef.current = newLink
            if (newLink) {
                const update = () => {
                    setMetrics(newLink.getMetrics())
                    setImages(newLink.getImages())
                }
                unsubRef.current = newLink.subscribe(update)
                update()
            } else {
                setMetrics(null)
                setImages([])
            }
        }
        rebind()
        const off = onReg(linkId, rebind)
        return () => {
            off()
            unsubRef.current?.()
        }
    }, [linkId])

    const PAD = linkRef.current?.getPadding?.() ?? 0
    const GAP = linkRef.current?.getGap?.() ?? 8

    const model = useMemo(() => {
        if (!metrics) return null
        if (!H) {
            return {
                contentW: metrics.scrollWidth,
                contentH: metrics.scrollHeight,
                itemBox: 0,
                stripW: 0,
            }
        }
        const itemBox = Math.max(0, metrics.clientHeight - 2 * PAD)
        const n = images.length
        const stripW = n > 0 ? n * itemBox + (n - 1) * GAP : 0
        const contentW = 2 * PAD + stripW
        const contentH = metrics.clientHeight
        return { contentW, contentH, itemBox, stripW }
    }, [metrics, H, images.length, PAD, GAP])

    /* scale */
    const recalcScale = useCallback(() => {
        const wrap = wrapRef.current,
            shell = shellRef.current
        if (!wrap || !shell || !model) return
        const availW = Math.max(0, wrap.clientWidth - 2 * MINI_PADDING)
        const availH = Math.max(0, wrap.clientHeight - 2 * MINI_PADDING)
        const sx = availW / Math.max(1, model.contentW)
        const sy = availH / Math.max(1, model.contentH)
        const sn = Math.min(sx, sy)
        setS(sn)
        shell.style.transform = `translate(${MINI_PADDING}px, ${MINI_PADDING}px) scale(${sn})`
        shell.style.transformOrigin = "top left"
    }, [model, MINI_PADDING])

    useEffect(() => {
        recalcScale()
        const ro1 = new ResizeObserver(recalcScale)
        const ro2 = new ResizeObserver(recalcScale)
        if (wrapRef.current) ro1.observe(wrapRef.current)
        if (shellRef.current) ro2.observe(shellRef.current)
        return () => {
            ro1.disconnect()
            ro2.disconnect()
        }
    }, [recalcScale])

    /* thumbs */
    const thumbs = useMemo(() => {
        if (!metrics || !model) return null

        if (H) {
            const itemH = model.itemBox
            const itemStyle: React.CSSProperties = {
                height: itemH,
                width: "auto",
                overflow: "hidden",
                borderRadius: THUMB_RADIUS,
                opacity: DIM_OP,
                background: THUMB_BG,
                flex: "0 0 auto",
            }
            const imgStyle: React.CSSProperties = {
                height: "100%",
                width: "auto",
                display: "block",
                objectFit: "contain",
                userSelect: "none",
                pointerEvents: "none",
                WebkitUserDrag: "none" as any,
            }
            return (
                <div style={{ width: model.contentW, height: model.contentH }}>
                    <div style={{ height: PAD }} />
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: GAP,
                            padding: `0 ${PAD}px`,
                        }}
                    >
                        {images.map((src, i) => (
                            <div key={i} style={itemStyle}>
                                <img
                                    src={src}
                                    alt={`thumb-${i}`}
                                    style={imgStyle}
                                    draggable={false}
                                    onDragStart={(e) => e.preventDefault()}
                                />
                            </div>
                        ))}
                    </div>
                    <div style={{ height: PAD }} />
                </div>
            )
        }

        const contentWidth = metrics.clientWidth
        const itemWidth = Math.max(0, contentWidth - 2 * PAD)
        const itemStyleV: React.CSSProperties = {
            width: itemWidth,
            overflow: "hidden",
            borderRadius: THUMB_RADIUS,
            opacity: DIM_OP,
            background: THUMB_BG,
        }
        const imgStyleV: React.CSSProperties = {
            width: "100%",
            height: "auto",
            display: "block",
            objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
            WebkitUserDrag: "none" as any,
        }
        return (
            <div style={{ width: contentWidth, padding: PAD }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: GAP,
                    }}
                >
                    {images.map((src, i) => (
                        <div key={i} style={itemStyleV}>
                            <img
                                src={src}
                                alt={`thumb-${i}`}
                                style={imgStyleV}
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                            />
                        </div>
                    ))}
                </div>
            </div>
        )
    }, [images, metrics, model, PAD, GAP, DIM_OP, THUMB_BG, THUMB_RADIUS, H])

    /* viewport rect (safe against 0x0 metrics) */
    const m =
        metrics && metrics.clientWidth > 0 && metrics.clientHeight > 0
            ? metrics
            : null
    const vp = useMemo(() => {
        if (!m || !model) return null
        if (H) {
            const stripW = model.stripW
            const fracLeft = m.scrollTop / Math.max(1, m.scrollHeight)
            const fracWidth = Math.min(
                1,
                m.clientHeight / Math.max(1, m.scrollHeight)
            )
            const xLeft = PAD + fracLeft * stripW
            const w = fracWidth * stripW
            const y = PAD
            const h = model.contentH - 2 * PAD
            return {
                x: MINI_PADDING + xLeft * s,
                y: MINI_PADDING + y * s,
                w: Math.max(8, w * s),
                h: Math.max(8, h * s),
            }
        }
        return {
            x: MINI_PADDING + (PAD + m.scrollLeft) * s,
            y: MINI_PADDING + m.scrollTop * s,
            w: Math.max(8, m.clientWidth * s),
            h: Math.max(8, m.clientHeight * s),
        }
    }, [m, model, s, MINI_PADDING, PAD, H])

    /* helpers */
    const xToScrollTop = (xContent: number) => {
        if (!m || !model) return 0
        const stripW = model.stripW
        const target =
            (xContent / Math.max(1, stripW)) * Math.max(1, m.scrollHeight)
        const maxT = Math.max(0, m.scrollHeight - m.clientHeight)
        return clamp(target, 0, maxT)
    }
    const setScrollXYFromMini = (xMM: number, yMM: number) => {
        const link = getLink(linkId)
        const mm = link?.getMetrics()
        if (!link || !mm || !model) return
        if (H) {
            const xContent = (xMM - MINI_PADDING) / Math.max(s, 0.0001)
            const st = xToScrollTop(xContent - PAD)
            link.setScroll(mm.scrollLeft, st, "auto")
        } else {
            const sl = (xMM - MINI_PADDING) / Math.max(s, 0.0001)
            const st = (yMM - MINI_PADDING) / Math.max(s, 0.0001)
            link.setScroll(sl, st, "auto")
        }
    }

    /* drag viewport */
    const dragging = useRef(false)
    const dragOffset = useRef({ dx: 0, dy: 0 })
    const vel = useRef({ vx: 0, vy: 0 })
    const last = useRef({ x: 0, y: 0, t: 0 })

    const onViewportDown = (e: React.PointerEvent) => {
        if (!VP_DRAG || !vp) return
        dragging.current = true
        const rect = (wrapRef.current as HTMLDivElement).getBoundingClientRect()
        dragOffset.current = {
            dx: e.clientX - rect.left - vp.x,
            dy: e.clientY - rect.top - vp.y,
        }
        last.current = { x: e.clientX, y: e.clientY, t: performance.now() }
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    }
    const onViewportMove = (e: React.PointerEvent) => {
        if (!VP_DRAG || !dragging.current || !vp) return
        const rect = (wrapRef.current as HTMLDivElement).getBoundingClientRect()
        let x = e.clientX - rect.left - dragOffset.current.dx
        let y = e.clientY - rect.top - dragOffset.current.dy
        if (H) {
            const vpWContent = vp.w / Math.max(s, 0.0001)
            const minX = MINI_PADDING + PAD * s
            const maxX = MINI_PADDING + (PAD + model!.stripW - vpWContent) * s
            x = clamp(x, minX, maxX)
            y = vp.y
        }
        setScrollXYFromMini(x, y)
        const now = performance.now()
        const dt = Math.max(1, now - last.current.t)
        vel.current.vx = (e.clientX - last.current.x) / dt
        vel.current.vy = (e.clientY - last.current.y) / dt
        last.current = { x: e.clientX, y: e.clientY, t: now }
        e.preventDefault()
    }
    const onViewportUp = (e: React.PointerEvent) => {
        if (!dragging.current) return
        dragging.current = false
        ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
        const decay = decayFor(VP_TRANS)
        if (decay === 0) return
        const mult = clamp(VP_SPEED, 0.5, 2)
        const link = getLink(linkId)
        const step = () => {
            const mm = link?.getMetrics()
            if (!link || !mm) return
            if (H) {
                let nextT = mm.scrollTop - vel.current.vx * mult * 16
                const maxT = Math.max(0, mm.scrollHeight - mm.clientHeight)
                if (nextT <= 0 || nextT >= maxT) {
                    nextT = clamp(nextT, 0, maxT)
                    vel.current.vx *= 0.35
                }
                link.setScroll(mm.scrollLeft, nextT, "auto")
                vel.current.vx *= decay
                if (Math.abs(vel.current.vx) < 0.01) return
            } else {
                let nextL = mm.scrollLeft - vel.current.vx * mult * 16
                let nextT = mm.scrollTop - vel.current.vy * mult * 16
                const maxL = Math.max(0, mm.scrollWidth - mm.clientWidth)
                const maxT = Math.max(0, mm.scrollHeight - mm.clientHeight)
                if (nextL <= 0 || nextL >= maxL) {
                    nextL = clamp(nextL, 0, maxL)
                    vel.current.vx *= 0.35
                }
                if (nextT <= 0 || nextT >= maxT) {
                    nextT = clamp(nextT, 0, maxT)
                    vel.current.vy *= 0.35
                }
                link.setScroll(nextL, nextT, "auto")
                vel.current.vx *= decay
                vel.current.vy *= decay
                if (
                    Math.abs(vel.current.vx) < 0.01 &&
                    Math.abs(vel.current.vy) < 0.01
                )
                    return
            }
            requestAnimationFrame(step)
        }
        step()
    }

    /* wheel (Lenis compat) */
    const onWheelMini: React.WheelEventHandler<HTMLDivElement> = (e) => {
        if (!LENIS) return
        const link = getLink(linkId)
        const mm = link?.getMetrics()
        if (!link || !mm) return
        const dominant =
            Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        if (H)
            link.setScroll(
                mm.scrollLeft,
                mm.scrollTop + dominant / Math.max(s, 0.0001),
                "auto"
            )
        else
            link.setScroll(
                mm.scrollLeft,
                mm.scrollTop + e.deltaY / Math.max(s, 0.0001),
                "auto"
            )
        e.stopPropagation()
    }

    const vpOuter = !vp
        ? { display: "none" as const }
        : ({
              position: "absolute" as const,
              left: vp.x,
              top: vp.y,
              width: vp.w,
              height: vp.h,
              borderRadius: VP_RADIUS,
              pointerEvents: "auto",
              cursor: "grab",
              touchAction: "none",
          } as const)
    const vpInner: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius: VP_RADIUS,
        boxShadow: `0 0 0 ${VP_STROKE}px ${VP_COLOR}`,
        background: VP_FILL,
        pointerEvents: "none",
    }

    return (
        <div
            ref={wrapRef}
            onClick={(e) => {
                if (!CLICK_JUMP || !m || !model) return
                const rect = (
                    wrapRef.current as HTMLDivElement
                ).getBoundingClientRect()
                const link = getLink(linkId)
                const mm = link?.getMetrics()
                if (!link || !mm) return

                if (H) {
                    const stripW = model.stripW
                    const xContent =
                        (e.clientX - rect.left - MINI_PADDING) /
                        Math.max(s, 0.0001)
                    const halfWin =
                        (m.clientHeight / Math.max(1, m.scrollHeight)) *
                        stripW *
                        0.5
                    const xLeftDesired =
                        clamp(xContent - halfWin, PAD, PAD + stripW) - PAD
                    const targetT = xToScrollTop(xLeftDesired)
                    const fromT = mm.scrollTop
                    const dur = Math.max(0, JUMP_MS)
                    if (dur === 0) {
                        link.setScroll(mm.scrollLeft, targetT, "auto")
                        return
                    }
                    const t0 = performance.now()
                    const ease = (t: number) =>
                        JUMP_EASE === "linear" ? t : 1 - Math.pow(1 - t, 3)
                    const tick = () => {
                        const t = Math.min(1, (performance.now() - t0) / dur)
                        const k = ease(t)
                        link.setScroll(
                            mm.scrollLeft,
                            fromT + (targetT - fromT) * k,
                            "auto"
                        )
                        if (t < 1) requestAnimationFrame(tick)
                    }
                    requestAnimationFrame(tick)
                    return
                }

                const xContent =
                    (e.clientX - rect.left - MINI_PADDING) / Math.max(s, 0.0001)
                const yContent =
                    (e.clientY - rect.top - MINI_PADDING) / Math.max(s, 0.0001)
                const targetL = clamp(
                    xContent - mm.clientWidth / 2,
                    0,
                    Math.max(0, mm.scrollWidth - mm.clientWidth)
                )
                const targetT = clamp(
                    yContent - mm.clientHeight / 2,
                    0,
                    Math.max(0, mm.scrollHeight - mm.clientHeight)
                )
                const fromL = mm.scrollLeft,
                    fromT = mm.scrollTop
                const dur = Math.max(0, JUMP_MS)
                if (dur === 0) {
                    link.setScroll(targetL, targetT, "auto")
                    return
                }
                const t0 = performance.now()
                const ease = (t: number) =>
                    JUMP_EASE === "linear" ? t : 1 - Math.pow(1 - t, 3)
                const tick = () => {
                    const t = Math.min(1, (performance.now() - t0) / dur)
                    const k = ease(t)
                    link.setScroll(
                        fromL + (targetL - fromL) * k,
                        fromT + (targetT - fromT) * k,
                        "auto"
                    )
                    if (t < 1) requestAnimationFrame(tick)
                }
                requestAnimationFrame(tick)
            }}
            onWheel={onWheelMini}
            data-lenis-prevent={LENIS ? "" : undefined}
            data-lenis-prevent-wheel={LENIS ? "" : undefined}
            data-lenis-prevent-touch={LENIS ? "" : undefined}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius: RADIUS,
                background: BG,
                boxSizing: "border-box",
                padding: 0,
                outline: OUTLINE
                    ? `${OUTLINE_W}px solid ${OUTLINE_COLOR}`
                    : "none",
                userSelect: "none",
                overscrollBehavior: "contain",
            }}
        >
            <div
                ref={shellRef}
                style={{ position: "absolute", inset: "0 auto auto 0" }}
            >
                {thumbs}
            </div>

            {VP_VISIBLE && vp && (
                <div
                    style={vpOuter}
                    onPointerDown={onViewportDown}
                    onPointerMove={onViewportMove}
                    onPointerUp={onViewportUp}
                    onPointerCancel={onViewportUp}
                >
                    <div style={vpInner} />
                </div>
            )}
        </div>
    )
}

/* ─────────────────── Wrapper (+ switch) ─────────────────── */
type ViewerProps = {
    mode: "gallery" | "minimap"
    linkId: string
    images: string[]
    galleryLayout?: { gap?: number; padding?: number }
    galleryStyle?: {
        bg?: string
        radius?: number
        itemRadius?: number
        itemBG?: string
        hideScrollbar?: boolean
    }
    galleryBehavior?: {
        dragEnabled?: boolean
        dragSpeed?: number
        dragTransition?: "none" | "short" | "medium" | "long"
        lenisCompat?: boolean
    }
    miniStyle?: MiniMapProps["style"]
    miniViewport?: MiniMapProps["viewport"]
    miniBehavior?: MiniMapProps["behavior"]
}
/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ImagesViewer(props: Partial<ViewerProps>) {
    const {
        mode = "gallery",
        linkId = "gal-1",
        images = [],
        galleryLayout,
        galleryStyle,
        galleryBehavior,
        miniStyle,
        miniViewport,
        miniBehavior,
    } = props

    if (mode === "minimap") {
        const hasLink = !!getLink(linkId)
        return (
            <div
                style={{ width: "100%", height: "100%", position: "relative" }}
            >
                {!hasLink && (
                    <GalleryImages
                        linkId={linkId}
                        images={images}
                        layout={galleryLayout}
                        style={galleryStyle}
                        behavior={galleryBehavior}
                        headless
                    />
                )}
                <MiniMapImages
                    linkId={linkId}
                    style={miniStyle}
                    viewport={miniViewport}
                    behavior={miniBehavior}
                />
            </div>
        )
    }

    return (
        <GalleryImages
            linkId={linkId}
            images={images}
            layout={galleryLayout}
            style={galleryStyle}
            behavior={galleryBehavior}
        />
    )
}

/* ─────────────────── PropertyControls (wrapper only) ─────────────────── */
addPropertyControls(ImagesViewer, {
    mode: {
        type: ControlType.Enum,
        title: "Render",
        options: ["gallery", "minimap"],
        optionTitles: ["Gallery", "MiniMap"],
        displaySegmentedControl: true as any,
    },
    linkId: {
        type: ControlType.String,
        title: "Link ID",
        defaultValue: "gal-1",
        description:
            "Use the same Link ID on the Gallery and MiniMap to sync them.",
    },

    images: {
        type: ControlType.Array,
        title: "Images",
        hidden: (p: any) => p.mode === "minimap",
        propertyControl: { type: ControlType.Image },
    },
    galleryLayout: {
        type: ControlType.Object,
        title: "Layout",
        hidden: (p: any) => p.mode === "minimap",
        controls: {
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 64,
                step: 1,
                defaultValue: 12,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 64,
                step: 1,
                defaultValue: 12,
            },
        },
    },
    galleryStyle: {
        type: ControlType.Object,
        title: "Style",
        hidden: (p: any) => p.mode === "minimap",
        controls: {
            bg: {
                type: ControlType.Color,
                title: "BG",
                defaultValue: "rgba(15,15,18,1)",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 32,
                step: 1,
                defaultValue: 12,
            },
            itemRadius: {
                type: ControlType.Number,
                title: "IMG Radius",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 10,
            },
            itemBG: {
                type: ControlType.Color,
                title: "IMG BG",
                defaultValue: "rgba(255,255,255,0.03)",
            },
            hideScrollbar: {
                type: ControlType.Boolean,
                title: "Scrollbar",
                defaultValue: true,
                description: "Set 'Yes' to hide the scrollbar",
            },
        },
    },
    galleryBehavior: {
        type: ControlType.Object,
        title: "Behavior",
        hidden: (p: any) => p.mode === "minimap",
        controls: {
            dragEnabled: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
            },
            dragSpeed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.5,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
            dragTransition: {
                type: ControlType.Enum,
                title: "Transition",
                options: ["none", "short", "medium", "long"],
                optionTitles: ["None", "Short", "Medium", "Long"],
                defaultValue: "medium",
            },
            lenisCompat: {
                type: ControlType.Boolean,
                title: "Lenis",
                defaultValue: true,
                description: "Set 'Yes' if you use lenis smooth scroll",
            },
        },
        description: "Made by [OtVos Studio](https://x.com/OtVosStudio)",
    },

    miniStyle: {
        type: ControlType.Object,
        title: "Style",
        hidden: (p: any) => p.mode !== "minimap",
        controls: {
            bg: {
                type: ControlType.Color,
                title: "BG",
                defaultValue: "rgba(255,255,255,0.04)",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 32,
                step: 1,
                defaultValue: 8,
            },
            miniPadding: {
                type: ControlType.Number,
                title: "Inner Padding",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 0,
            },
            outline: {
                type: ControlType.Boolean,
                title: "Outline",
                defaultValue: true,
            },
            outlineColor: {
                type: ControlType.Color,
                title: "Outline Color",
                defaultValue: "rgba(255,255,255,0.08)",
            },
            outlineWidth: {
                type: ControlType.Number,
                title: "Outline W",
                min: 0,
                max: 6,
                step: 1,
                defaultValue: 1,
            },
            thumbRadius: {
                type: ControlType.Number,
                title: "IMG Radius",
                min: 0,
                max: 24,
                step: 1,
                defaultValue: 6,
            },
            thumbBG: {
                type: ControlType.Color,
                title: "IMG BG",
                defaultValue: "rgba(255,255,255,0.03)",
            },
            dimOpacity: {
                type: ControlType.Number,
                title: "IMG Opacity",
                min: 0.2,
                max: 1,
                step: 0.05,
                defaultValue: 0.95,
            },
        },
    },
    miniViewport: {
        type: ControlType.Object,
        title: "Viewport",
        hidden: (p: any) => p.mode !== "minimap",
        controls: {
            showViewport: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
            },
            viewportStroke: {
                type: ControlType.Number,
                title: "Stroke",
                min: 1,
                max: 6,
                step: 1,
                defaultValue: 1,
            },
            viewportColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(255,255,255,0.95)",
            },
            viewportFill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "rgba(255,255,255,0.08)",
            },
            viewportRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 24,
                step: 1,
                defaultValue: 6,
            },
        },
    },
    miniBehavior: {
        type: ControlType.Object,
        title: "Behavior",
        hidden: (p: any) => p.mode !== "minimap",
        controls: {
            horizontal: {
                type: ControlType.Boolean,
                title: "Horizontal",
                defaultValue: false,
            },
            vpDragEnabled: {
                type: ControlType.Boolean,
                title: "VP Drag",
                defaultValue: true,
            },
            vpDragSpeed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.5,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
            vpTransition: {
                type: ControlType.Enum,
                title: "Transition",
                options: ["none", "short", "medium", "long"],
                optionTitles: ["None", "Short", "Medium", "Long"],
                defaultValue: "none",
            },
            clickToJump: {
                type: ControlType.Boolean,
                title: "Click IMG",
                defaultValue: true,
            },
            jumpMs: {
                type: ControlType.Number,
                title: "Jump ms",
                min: 0,
                max: 1500,
                step: 25,
                defaultValue: 350,
            },
            jumpEase: {
                type: ControlType.Enum,
                title: "Jump Ease",
                options: ["linear", "easeOut"],
                optionTitles: ["Linear", "EaseOut"],
                defaultValue: "easeOut",
            },
            lenisCompat: {
                type: ControlType.Boolean,
                title: "Lenis",
                defaultValue: true,
                description: "Set 'Yes' if you use lenis smooth scroll",
            },
        },
        description: "Made by [OtVos Studio](https://x.com/OtVosStudio)",
    },
})
