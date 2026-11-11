// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, useRef, useState } from "react"

const PLACEHOLDERS = [
    "https://picsum.photos/seed/hpg1/900/600",
    "https://picsum.photos/seed/hpg2/900/600",
    "https://picsum.photos/seed/hpg3/900/600",
    "https://picsum.photos/seed/hpg4/900/600",
    "https://picsum.photos/seed/hpg5/900/600",
    "https://picsum.photos/seed/hpg6/900/600",
    "https://picsum.photos/seed/hpg7/900/600",
    "https://picsum.photos/seed/hpg8/900/600",
]

type MediaType = "image" | "video"
type Source = "manual" | "cms"
type WidthMode = "aspect" | "custom"
type ImgValue = { src?: string } | string | undefined
type RawItem = {
    type?: MediaType
    image?: ImgValue
    video?: string
    poster?: ImgValue
    caption?: string
    link?: string
}
type Item = {
    type: MediaType
    src: string
    poster?: string
    caption?: string
    link?: string
}

const ASPECTS: Record<string, number> = {
    "3:2": 3 / 2,
    "4:3": 4 / 3,
    "16:9": 16 / 9,
    "1:1": 1,
    "3:4": 3 / 4,
    "9:16": 9 / 16,
}

function resolveSrc(value: ImgValue): string | undefined {
    if (!value) return undefined
    return typeof value === "string" ? value : value.src
}

function clamp(v: number, lo: number, hi: number) {
    return v < lo ? lo : v > hi ? hi : v
}

function fallbackItems(): Item[] {
    return PLACEHOLDERS.map((src) => ({ type: "image" as MediaType, src }))
}

const LINK_ATTRS = [
    "data-framer-link",
    "data-framer-link-target",
    "data-framer-navigation",
    "data-framer-page-link",
    "data-href",
    "data-link",
    "data-url",
]

function findLink(el: Element, stop?: Element | null): string | undefined {
    let cur: Element | null = el
    let depth = 0
    while (cur && cur !== stop && depth < 30) {
        if (cur.tagName === "A") {
            const href = (cur as HTMLAnchorElement).getAttribute("href")
            if (href) return href
        }
        for (const attr of LINK_ATTRS) {
            const v = cur.getAttribute(attr)
            if (v) return v
        }
        cur = cur.parentElement
        depth++
    }
    return undefined
}

function mediaSrc(m: HTMLImageElement | HTMLVideoElement): string {
    if (m.tagName === "IMG") {
        const img = m as HTMLImageElement
        return img.currentSrc || img.src
    }
    const vid = m as HTMLVideoElement
    return (
        vid.currentSrc ||
        vid.src ||
        vid.querySelector("source")?.getAttribute("src") ||
        ""
    )
}

// Find the real Framer-generated anchor that a given media src lives inside, so
// CMS tiles click Framer's OWN anchor instead of a synthesised one. Framer's
// router is wired to its anchors, so clicking them resolves the route correctly
// in canvas preview, popout preview, and the published site — a synthesised
// relative link 404s against the editor's base path in preview. Same approach
// proven on the 3D Sphere Gallery.
function findSourceAnchor(
    probe: HTMLElement,
    src: string
): HTMLAnchorElement | null {
    const medias = Array.from(
        probe.querySelectorAll("img, video")
    ) as Array<HTMLImageElement | HTMLVideoElement>
    for (const m of medias) {
        if (mediaSrc(m) !== src) continue
        let cur: Element | null = m
        while (cur && cur !== probe) {
            if (cur.tagName === "A") return cur as HTMLAnchorElement
            cur = cur.parentElement
        }
    }
    return null
}

// Synthesise a real anchor click for a manual link. Used in loop mode where the
// stage owns pointer capture, so a tile's own <a>/onClick never fires — we hit-
// test the click and navigate here instead.
function navigateManual(href: string) {
    if (!href || typeof document === "undefined") return
    try {
        const a = document.createElement("a")
        a.href = href
        a.style.position = "absolute"
        a.style.left = "-9999px"
        a.style.opacity = "0"
        a.style.pointerEvents = "none"
        document.body.appendChild(a)
        a.click()
        a.remove()
    } catch (err) {
        try {
            window.location.assign(href)
        } catch (err2) {}
    }
}

interface Props {
    width?: number
    height?: number
    source?: Source
    items?: RawItem[]
    collectionSlot?: React.ReactNode
    layout?: {
        mediaHeight?: number
        widthMode?: WidthMode
        aspect?: keyof typeof ASPECTS
        mediaWidth?: number
        gap?: number
        paddingTop?: number
        paddingBottom?: number
        paddingStart?: number
        paddingEnd?: number
        stageHeight?: number
    }
    motion?: {
        ease?: number
        parallax?: number
        overscan?: number
    }
    loop?: {
        enabled?: boolean
        speed?: number
        direction?: "left" | "right"
        wheel?: boolean
    }
    effect?: {
        centerFocus?: number
        curve?: number
        velocitySkew?: number
        desaturate?: number
    }
    style?: {
        background?: string
        mediaRadius?: number
        showCaptions?: boolean
        captionColor?: string
        showProgress?: boolean
        progressColor?: string
        lockOverscroll?: boolean
    }
}

const RUNWAY_FALLBACK = 3000
const LOOP_HEIGHT_FALLBACK = 600
const FRICTION = 0.92
const CLICK_MOVEMENT_THRESHOLD = 6

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 2600
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function HorizontalParallaxGallery(props: Props) {
    const {
        width,
        height,
        source,
        items,
        collectionSlot,
        layout,
        motion,
        loop,
        effect,
        style,
    } = props

    const resolvedSource: Source = source === "cms" ? "cms" : "manual"

    const mediaHeight = layout?.mediaHeight ?? 60
    const widthMode: WidthMode =
        layout?.widthMode === "custom" ? "custom" : "aspect"
    const aspectKey = layout?.aspect ?? "3:2"
    const mediaWidth = clamp(layout?.mediaWidth ?? 40, 5, 100)
    const gap = layout?.gap ?? 32
    const paddingTop = layout?.paddingTop ?? 0
    const paddingBottom = layout?.paddingBottom ?? 0
    const paddingStart = layout?.paddingStart ?? 0
    const paddingEnd = layout?.paddingEnd ?? 0
    const stageHeight = clamp(layout?.stageHeight ?? 100, 40, 100)

    const ease = clamp(motion?.ease ?? 0.08, 0.01, 0.3)
    const overscan = clamp(motion?.overscan ?? 25, 6, 60)
    const parallax = clamp(motion?.parallax ?? 10, 0, overscan / 2)

    const infinite = loop?.enabled ?? false
    const autoSpeed = clamp(loop?.speed ?? 40, 0, 600)
    const direction = loop?.direction === "right" ? "right" : "left"
    const dirSign = direction === "left" ? 1 : -1
    const wheelMove = loop?.wheel ?? true

    const centerFocus = clamp(effect?.centerFocus ?? 0.2, 0, 0.6)
    const curve = clamp(effect?.curve ?? 0, -160, 160)
    const velocitySkew = clamp(effect?.velocitySkew ?? 0.5, 0, 2)
    const desaturate = clamp(effect?.desaturate ?? 0, 0, 1)

    const background = style?.background ?? "#0A0A0A"
    const mediaRadius = style?.mediaRadius ?? 8
    const showCaptions = style?.showCaptions ?? true
    const captionColor = style?.captionColor ?? "#FFFFFF"
    const showProgress = style?.showProgress ?? true
    const progressColor = style?.progressColor ?? "#FFFFFF"
    const lockOverscroll = style?.lockOverscroll ?? true

    const aspect = ASPECTS[aspectKey] ?? 3 / 2

    const isStatic = useIsStaticRenderer()
    const looping = infinite && !isStatic

    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const stripRef = useRef<HTMLDivElement>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const slotProbeRef = useRef<HTMLDivElement>(null)
    const mediaEls = useRef<Array<HTMLElement | null>>([])
    const imgEls = useRef<Array<HTMLElement | null>>([])

    const [slotItems, setSlotItems] = useState<Item[]>([])
    const [copies, setCopies] = useState(2)
    const copiesRef = useRef(2)
    copiesRef.current = copies

    const currentXRef = useRef(0)
    const infXRef = useRef(0)
    const prevVelRef = useRef(0)
    const momentumRef = useRef(0)
    const draggingRef = useRef(false)
    const draggedRef = useRef(false)
    const dragLastRef = useRef(0)
    const dragMovedRef = useRef(0)
    const lastTimeRef = useRef(0)
    const rafRef = useRef<number | null>(null)

    // Stop the page from rubber-banding / scroll-chaining past this section.
    // Only in preview/live (never the canvas editor), restored on unmount.
    useEffect(() => {
        if (isStatic || !lockOverscroll) return
        if (typeof document === "undefined") return
        const el = document.documentElement
        const prev = el.style.overscrollBehavior
        el.style.overscrollBehavior = "none"
        return () => {
            el.style.overscrollBehavior = prev
        }
    }, [isStatic, lockOverscroll])

    useEffect(() => {
        if (resolvedSource !== "cms") {
            if (slotItems.length) setSlotItems([])
            return
        }
        const probe = slotProbeRef.current
        if (!probe) return

        const extract = () => {
            const elements = Array.from(
                probe.querySelectorAll("img, video")
            ) as Array<HTMLImageElement | HTMLVideoElement>
            const list: Item[] = []
            const seen = new Set<string>()
            for (const el of elements) {
                const link = findLink(el, probe)
                if (el.tagName === "IMG") {
                    const img = el as HTMLImageElement
                    const src = img.currentSrc || img.src
                    if (!src || src.startsWith("data:") || seen.has(src)) continue
                    seen.add(src)
                    list.push({
                        type: "image",
                        src,
                        link,
                        caption: img.getAttribute("alt") || undefined,
                    })
                } else {
                    const vid = el as HTMLVideoElement
                    const inner = vid.querySelector("source")
                    const src =
                        vid.currentSrc ||
                        vid.src ||
                        inner?.getAttribute("src") ||
                        ""
                    if (!src || seen.has(src)) continue
                    seen.add(src)
                    list.push({ type: "video", src, link })
                }
            }
            setSlotItems((prev) => {
                if (
                    prev.length === list.length &&
                    prev.every(
                        (p, i) =>
                            p.src === list[i].src &&
                            p.type === list[i].type &&
                            p.link === list[i].link &&
                            p.caption === list[i].caption
                    )
                ) {
                    return prev
                }
                return list
            })
        }

        extract()
        const obs = new MutationObserver(extract)
        obs.observe(probe, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: [
                "src",
                "srcset",
                "currentSrc",
                "href",
                "alt",
                "data-framer-link",
                "data-framer-link-target",
                "data-framer-navigation",
                "data-framer-page-link",
                "data-href",
                "data-link",
                "data-url",
            ],
        })
        return () => obs.disconnect()
    }, [resolvedSource, collectionSlot])

    const resolved = useMemo<Item[]>(() => {
        if (resolvedSource === "cms") {
            return slotItems.length ? slotItems : fallbackItems()
        }
        if (!items || items.length === 0) return fallbackItems()
        const list: Item[] = []
        for (const it of items) {
            if (!it) continue
            const type: MediaType = it.type === "video" ? "video" : "image"
            const src = type === "video" ? it.video : resolveSrc(it.image)
            if (src)
                list.push({
                    type,
                    src,
                    poster: resolveSrc(it.poster),
                    caption: it.caption,
                    link: it.link,
                })
        }
        return list.length ? list : fallbackItems()
    }, [resolvedSource, items, slotItems])

    const itemsPerSet = resolved.length

    const tiles = useMemo(() => {
        const out: Array<{ item: Item; i: number }> = []
        const sets = looping ? copies : 1
        for (let c = 0; c < sets; c++) {
            for (let j = 0; j < resolved.length; j++) {
                out.push({ item: resolved[j], i: c * resolved.length + j })
            }
        }
        return out
    }, [resolved, looping, copies])
    const tilesRef = useRef(tiles)
    tilesRef.current = tiles

    const cfgRef = useRef({
        ease,
        parallax,
        centerFocus,
        curve,
        velocitySkew,
        desaturate,
        infinite,
        autoSpeed,
        dirSign,
    })
    cfgRef.current = {
        ease,
        parallax,
        centerFocus,
        curve,
        velocitySkew,
        desaturate,
        infinite,
        autoSpeed,
        dirSign,
    }

    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        const stage = stageRef.current
        const strip = stripRef.current
        if (!root || !stage || !strip) return

        const perSet = itemsPerSet

        const frame = (now: number) => {
            const cfg = cfgRef.current
            let dt = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0
            if (dt > 0.05) dt = 0.05
            lastTimeRef.current = now

            const stageW = stage.clientWidth
            let tx = 0
            let velForSkew = 0

            if (cfg.infinite) {
                if (!draggingRef.current) {
                    let advance = cfg.autoSpeed * cfg.dirSign * dt
                    advance += momentumRef.current
                    momentumRef.current *= FRICTION
                    if (Math.abs(momentumRef.current) < 0.01) momentumRef.current = 0
                    infXRef.current += advance
                }
                velForSkew = infXRef.current - prevVelRef.current
                prevVelRef.current = infXRef.current

                const a = mediaEls.current[0]
                const b = mediaEls.current[perSet]
                let setSpan = 0
                if (a && b && a.isConnected && b.isConnected)
                    setSpan = b.offsetLeft - a.offsetLeft

                if (setSpan > 0) {
                    let m = infXRef.current % setSpan
                    if (m < 0) m += setSpan
                    tx = -m
                    const need = Math.min(
                        16,
                        Math.max(2, Math.ceil(stageW / setSpan) + 2)
                    )
                    if (need !== copiesRef.current) {
                        copiesRef.current = need
                        setCopies(need)
                    }
                } else {
                    tx = -infXRef.current
                }
            } else {
                const stageH = stage.clientHeight
                const runway = root.offsetHeight - stageH
                const rootTop = root.getBoundingClientRect().top
                const p = runway > 0 ? clamp(-rootTop / runway, 0, 1) : 0
                const maxTravel = Math.max(0, strip.scrollWidth - stageW)
                const targetX = -p * maxTravel
                currentXRef.current += (targetX - currentXRef.current) * cfg.ease
                tx = currentXRef.current
                velForSkew = tx - prevVelRef.current
                prevVelRef.current = tx
                if (barRef.current)
                    barRef.current.style.transform = "scaleX(" + p.toFixed(4) + ")"
            }

            const skewAngle =
                cfg.velocitySkew > 0
                    ? clamp(velForSkew * cfg.velocitySkew * 0.18, -8, 8)
                    : 0
            strip.style.transform =
                "translate3d(" +
                tx.toFixed(2) +
                "px, 0, 0) skewX(" +
                skewAngle.toFixed(2) +
                "deg)"

            const stageRect = stage.getBoundingClientRect()
            const centerX = stageRect.left + stageRect.width / 2
            const halfW = stageRect.width / 2 || 1
            for (let i = 0; i < mediaEls.current.length; i++) {
                const media = mediaEls.current[i]
                const img = imgEls.current[i]
                if (!media || !img || !media.isConnected) continue
                const r = media.getBoundingClientRect()
                const ec = r.left + r.width / 2
                const t = clamp((ec - centerX) / halfW, -1, 1)
                const at = t < 0 ? -t : t

                img.style.transform =
                    "translate3d(" + (-t * cfg.parallax).toFixed(2) + "%, 0, 0)"

                const scale = 1 + cfg.centerFocus * (1 - at)
                const curveY = cfg.curve * t * t
                media.style.transform =
                    "translateY(" +
                    curveY.toFixed(1) +
                    "px) scale(" +
                    scale.toFixed(3) +
                    ")"

                if (cfg.desaturate > 0) {
                    media.style.filter =
                        "saturate(" +
                        clamp(1 - cfg.desaturate * at, 0, 1).toFixed(2) +
                        ")"
                } else if (media.style.filter) {
                    media.style.filter = ""
                }
            }

            rafRef.current = requestAnimationFrame(frame)
        }
        rafRef.current = requestAnimationFrame(frame)

        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            lastTimeRef.current = 0
        }
    }, [isStatic, itemsPerSet, infinite])

    // Wheel / trackpad over the gallery scrolls it horizontally and loops it.
    // A native non-passive listener is required so we can preventDefault and
    // turn vertical wheel into horizontal travel. This captures page scrolling
    // while the pointer is over the gallery, the same trade-off as the Sphere's
    // Scroll To Spin — keep it for full-width sections.
    useEffect(() => {
        if (!looping || !wheelMove) return
        const stage = stageRef.current
        if (!stage) return
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const d =
                Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            infXRef.current += d
            momentumRef.current = d * 0.15
        }
        stage.addEventListener("wheel", onWheel, { passive: false })
        return () => stage.removeEventListener("wheel", onWheel)
    }, [looping, wheelMove])

    const clickSourceAnchor = (src: string) => {
        const probe = slotProbeRef.current
        if (!probe) return
        const anchor = findSourceAnchor(probe, src)
        if (anchor) anchor.click()
    }

    // Loop mode owns pointer capture for dragging, so a tile's own click never
    // fires. Hit-test the cursor against the tiles on pointer-up (when it was a
    // click, not a drag) and navigate from the matched tile's item.
    const hitTestTile = (x: number, y: number) => {
        let best = -1
        let bestDist = Infinity
        for (let i = 0; i < mediaEls.current.length; i++) {
            const el = mediaEls.current[i]
            if (!el || !el.isConnected) continue
            const r = el.getBoundingClientRect()
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                const cx = r.left + r.width / 2
                const cy = r.top + r.height / 2
                const dist = (x - cx) * (x - cx) + (y - cy) * (y - cy)
                if (dist < bestDist) {
                    bestDist = dist
                    best = i
                }
            }
        }
        return best
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        draggingRef.current = true
        draggedRef.current = false
        dragLastRef.current = e.clientX
        dragMovedRef.current = 0
        momentumRef.current = 0
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch (err) {}
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current) return
        const dx = e.clientX - dragLastRef.current
        dragLastRef.current = e.clientX
        dragMovedRef.current += Math.abs(dx)
        if (dragMovedRef.current > CLICK_MOVEMENT_THRESHOLD)
            draggedRef.current = true
        infXRef.current -= dx
        momentumRef.current = -dx
    }

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        const wasClick = !draggedRef.current
        draggingRef.current = false
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch (err) {}

        if (!wasClick) return
        const idx = hitTestTile(e.clientX, e.clientY)
        if (idx < 0) return
        const item = tilesRef.current[idx]?.item
        if (!item?.link) return
        if (resolvedSource === "cms") clickSourceAnchor(item.src)
        else navigateManual(item.link)
    }

    const runwayPx =
        typeof height === "number" && height > 0 ? height : RUNWAY_FALLBACK
    const loopPx =
        typeof height === "number" && height > 0 ? height : LOOP_HEIGHT_FALLBACK

    const rootStyle: React.CSSProperties = {
        position: "relative",
        width: width ?? "100%",
        height: infinite ? loopPx : runwayPx,
        minHeight: infinite ? stageHeight + "vh" : undefined,
        background,
    }

    // The stage is a one-screen sticky element in BOTH modes, so the strip is
    // vertically centered in the VIEWPORT regardless of the frame's height.
    // Pinned mode maps page scroll to horizontal travel over the frame's height;
    // loop mode auto-scrolls and the frame's height is just how long it pins.
    const stageStyle: React.CSSProperties = {
        position: isStatic ? "relative" : "sticky",
        top:
            stageHeight >= 100
                ? 0
                : ((100 - stageHeight) / 2).toFixed(2) + "vh",
        height: stageHeight + "vh",
        width: "100%",
        overflow: "hidden",
        background,
        touchAction: looping ? "pan-y" : undefined,
    }

    const padL = infinite ? 0 : paddingStart
    const padR = infinite ? 0 : paddingEnd

    const stripStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: gap,
        height: "100%",
        width: "max-content",
        boxSizing: "border-box",
        paddingTop: paddingTop,
        paddingBottom: paddingBottom,
        paddingLeft: padL,
        paddingRight: padR,
        willChange: "transform",
        transformOrigin: "center center",
        transform: "translate3d(0,0,0)",
    }

    const mediaSizing: React.CSSProperties =
        widthMode === "custom"
            ? { width: mediaWidth + "vw" }
            : { aspectRatio: String(aspect) }

    const mediaBase: React.CSSProperties = {
        position: "relative",
        height: mediaHeight + "%",
        ...mediaSizing,
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: mediaRadius,
        background: "#000",
        display: "block",
        textDecoration: "none",
        transformOrigin: "center center",
        willChange: "transform, filter",
    }

    const imgStyle: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: (-overscan / 2).toFixed(2) + "%",
        width: (100 + overscan).toFixed(2) + "%",
        height: "100%",
        objectFit: "cover",
        willChange: "transform",
        backfaceVisibility: "hidden",
        userSelect: "none",
        transform: "translate3d(0,0,0)",
        display: "block",
    }

    const captionStyle: React.CSSProperties = {
        position: "absolute",
        left: 16,
        bottom: 14,
        margin: 0,
        color: captionColor,
        fontSize: 14,
        lineHeight: 1.3,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        textShadow: "0 1px 8px rgba(0,0,0,0.45)",
        pointerEvents: "none",
        zIndex: 2,
    }

    const progressTrackStyle: React.CSSProperties = {
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: 3,
        background: "rgba(255,255,255,0.14)",
        zIndex: 3,
        display: showProgress && !infinite ? "block" : "none",
    }

    const progressFillStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        background: progressColor,
        transformOrigin: "left center",
        transform: "scaleX(0)",
        willChange: "transform",
    }

    const probeStyle: React.CSSProperties = {
        position: "absolute",
        left: -99999,
        top: 0,
        width: 1200,
        opacity: 0,
        pointerEvents: "none",
        overflow: "hidden",
    }

    return (
        <div ref={rootRef} style={rootStyle}>
            <div
                ref={stageRef}
                style={stageStyle}
                onPointerDown={looping ? onPointerDown : undefined}
                onPointerMove={looping ? onPointerMove : undefined}
                onPointerUp={looping ? endDrag : undefined}
                onPointerCancel={looping ? endDrag : undefined}
            >
                <div ref={stripRef} style={stripStyle}>
                    {tiles.map(({ item, i }) => {
                        const inner = (
                            <>
                                {item.type === "video" ? (
                                    <video
                                        ref={(el) => {
                                            imgEls.current[i] = el
                                        }}
                                        src={item.src}
                                        poster={item.poster}
                                        autoPlay={!isStatic}
                                        loop
                                        muted
                                        playsInline
                                        preload="metadata"
                                        style={imgStyle}
                                    />
                                ) : (
                                    <img
                                        ref={(el) => {
                                            imgEls.current[i] = el
                                        }}
                                        src={item.src}
                                        alt={item.caption || ""}
                                        draggable={false}
                                        style={imgStyle}
                                    />
                                )}
                                {showCaptions && item.caption ? (
                                    <p style={captionStyle}>{item.caption}</p>
                                ) : null}
                            </>
                        )
                        const setMediaRef = (el: HTMLElement | null) => {
                            mediaEls.current[i] = el
                        }
                        const linked = !!item.link
                        const clickable: React.CSSProperties = linked
                            ? { ...mediaBase, cursor: "pointer" }
                            : mediaBase

                        // Loop mode: clicks are handled by the stage's pointer-up
                        // hit-test (it owns pointer capture for dragging), so the
                        // tile is a plain div regardless of link.
                        if (looping) {
                            return (
                                <div key={i} ref={setMediaRef} style={clickable}>
                                    {inner}
                                </div>
                            )
                        }
                        if (linked && resolvedSource !== "cms") {
                            return (
                                <a
                                    key={i}
                                    ref={setMediaRef}
                                    href={item.link}
                                    style={clickable}
                                >
                                    {inner}
                                </a>
                            )
                        }
                        if (linked && resolvedSource === "cms") {
                            return (
                                <div
                                    key={i}
                                    ref={setMediaRef}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() => clickSourceAnchor(item.src)}
                                    style={clickable}
                                >
                                    {inner}
                                </div>
                            )
                        }
                        return (
                            <div key={i} ref={setMediaRef} style={mediaBase}>
                                {inner}
                            </div>
                        )
                    })}
                </div>
                <div style={progressTrackStyle}>
                    <div ref={barRef} style={progressFillStyle} />
                </div>
            </div>
            {resolvedSource === "cms" && collectionSlot ? (
                <div ref={slotProbeRef} style={probeStyle} aria-hidden>
                    {collectionSlot}
                </div>
            ) : null}
        </div>
    )
}

HorizontalParallaxGallery.displayName = "Horizontal Parallax Gallery"

addPropertyControls(HorizontalParallaxGallery, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        defaultValue: "manual",
        options: ["manual", "cms"],
        optionTitles: ["Manual", "CMS"],
        displaySegmentedControl: true,
        description:
            "Manual hand-picks images and videos. CMS reads every image and video from the layer you drop into the Collection slot — typically a Framer Collection List pointed at your collection. Each frame inherits the row's link, so clicking it follows the same href the source row would.",
    },
    items: {
        type: ControlType.Array,
        title: "Media",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    defaultValue: "image",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    description: "Whether this frame shows an image or a video.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "The image that fills the frame.",
                    hidden: (p: { type?: MediaType }) => p.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    description:
                        "An mp4, webm, or mov file. Plays muted, looped, and inline.",
                    hidden: (p: { type?: MediaType }) => p.type !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    description: "Optional still shown before the video plays.",
                    hidden: (p: { type?: MediaType }) => p.type !== "video",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    description: "Optional label shown at the bottom-left.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Optional URL the frame points to when clicked.",
                },
            },
        },
        description:
            "The images and videos that scroll horizontally. Each one parallaxes inside its frame as it crosses the screen.",
        hidden: (p: Partial<Props>) => p.source === "cms",
    },
    collectionSlot: {
        type: ControlType.ComponentInstance,
        title: "Collection",
        description:
            "Drop a Framer Collection List here, configured for your collection, with an Image inside the row template. The gallery reads every image rendered inside this slot and lays them out in one horizontal strip. If each row has a link, a click on the frame follows it.",
        hidden: (p: Partial<Props>) => p.source !== "cms",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description:
            "Frame size, spacing, padding, and the height of the stage. For full-screen frames, set Stage Height and Image Height to 100, Width to Custom, and Image Width to 100.",
        controls: {
            mediaHeight: {
                type: ControlType.Number,
                title: "Image Height",
                defaultValue: 60,
                min: 30,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "Each frame's height as a share of the stage height. Set to 100 for full-height frames.",
            },
            widthMode: {
                type: ControlType.Enum,
                title: "Width",
                defaultValue: "aspect",
                options: ["aspect", "custom"],
                optionTitles: ["From Aspect", "Custom"],
                displaySegmentedControl: true,
                description:
                    "From Aspect derives the width from the height and a ratio. Custom lets you set the width directly — push it to 100 for full-bleed, screen-filling frames.",
            },
            aspect: {
                type: ControlType.Enum,
                title: "Aspect",
                defaultValue: "3:2",
                options: ["3:2", "4:3", "16:9", "1:1", "3:4", "9:16"],
                optionTitles: [
                    "Landscape 3:2",
                    "Landscape 4:3",
                    "Wide 16:9",
                    "Square",
                    "Portrait 3:4",
                    "Tall 9:16",
                ],
                description: "The shape of every frame.",
                hidden: (p: { widthMode?: WidthMode }) =>
                    p.widthMode === "custom",
            },
            mediaWidth: {
                type: ControlType.Number,
                title: "Image Width",
                defaultValue: 40,
                min: 5,
                max: 100,
                step: 1,
                unit: "vw",
                description:
                    "Frame width as a share of the screen width. 100 makes each frame fill the screen.",
                hidden: (p: { widthMode?: WidthMode }) =>
                    p.widthMode !== "custom",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 32,
                min: 0,
                max: 160,
                step: 2,
                unit: "px",
                description: "Space between frames.",
            },
            paddingTop: {
                type: ControlType.Number,
                title: "Padding Top",
                defaultValue: 0,
                min: 0,
                max: 400,
                step: 2,
                unit: "px",
                description:
                    "Inset from the top of the stage. Visible when frames are shorter than the stage.",
            },
            paddingBottom: {
                type: ControlType.Number,
                title: "Padding Bottom",
                defaultValue: 0,
                min: 0,
                max: 400,
                step: 2,
                unit: "px",
                description:
                    "Inset from the bottom of the stage. Visible when frames are shorter than the stage.",
            },
            paddingStart: {
                type: ControlType.Number,
                title: "Padding Left",
                defaultValue: 0,
                min: 0,
                max: 400,
                step: 2,
                unit: "px",
                description:
                    "Space before the first frame. 0 sits it flush to the left edge. Ignored in Infinite Loop.",
            },
            paddingEnd: {
                type: ControlType.Number,
                title: "Padding Right",
                defaultValue: 0,
                min: 0,
                max: 400,
                step: 2,
                unit: "px",
                description:
                    "Space after the last frame. Ignored in Infinite Loop.",
            },
            stageHeight: {
                type: ControlType.Number,
                title: "Stage Height",
                defaultValue: 100,
                min: 40,
                max: 100,
                step: 1,
                unit: "vh",
                description:
                    "Height of the visible gallery, as a share of the screen. The strip is vertically centered inside it. 100 fills the screen; lower leaves room above and below.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description:
            "How the strip glides and how far each image drifts inside its frame. In the default pinned mode, the frame's Height sets scroll speed: a taller frame scrolls slower.",
        controls: {
            ease: {
                type: ControlType.Number,
                title: "Smoothing",
                defaultValue: 0.08,
                min: 0.01,
                max: 0.3,
                step: 0.01,
                description:
                    "How softly the strip follows the scroll in pinned mode. Lower trails further; higher is snappier.",
            },
            parallax: {
                type: ControlType.Number,
                title: "Parallax",
                defaultValue: 10,
                min: 0,
                max: 25,
                step: 1,
                unit: "%",
                description:
                    "How far each image shifts inside its frame. Capped at half the Overscan so frame edges never show.",
            },
            overscan: {
                type: ControlType.Number,
                title: "Overscan",
                defaultValue: 25,
                min: 6,
                max: 60,
                step: 1,
                unit: "%",
                description:
                    "Extra image width that creates room for the drift. The image renders wider than its frame and slides within it.",
            },
        },
    },
    loop: {
        type: ControlType.Object,
        title: "Infinite Loop",
        description:
            "Turns the gallery into a seamless, never-ending marquee instead of a pinned scroll section. Scroll, drag, or let it auto-drift. Set the frame's Height to about one screen when this is on.",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Infinite",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Loops the strip seamlessly with no start or end. Scroll over it, drag it, or let it auto-drift.",
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Scroll to Move",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "The mouse wheel and trackpad scroll the gallery sideways while the pointer is over it. This captures page scrolling while hovered, so it suits full-width sections. Pair with Speed 0 for a purely scroll-driven gallery.",
                hidden: (p: { enabled?: boolean }) => !p.enabled,
            },
            speed: {
                type: ControlType.Number,
                title: "Auto Speed",
                defaultValue: 40,
                min: 0,
                max: 400,
                step: 5,
                unit: "px/s",
                description:
                    "How fast the strip drifts on its own. Set to 0 to move only on scroll and drag.",
                hidden: (p: { enabled?: boolean }) => !p.enabled,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                defaultValue: "left",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                displaySegmentedControl: true,
                description: "Which way the strip auto-drifts.",
                hidden: (p: { enabled?: boolean }) => !p.enabled,
            },
        },
    },
    effect: {
        type: ControlType.Object,
        title: "Effect",
        description:
            "Scroll-driven flourishes that layer on top of the parallax. All four combine.",
        controls: {
            centerFocus: {
                type: ControlType.Number,
                title: "Center Focus",
                defaultValue: 0.2,
                min: 0,
                max: 0.6,
                step: 0.05,
                description:
                    "Frames swell as they reach the center of the screen. 0 keeps them flat.",
            },
            curve: {
                type: ControlType.Number,
                title: "Arc",
                defaultValue: 0,
                min: -160,
                max: 160,
                step: 4,
                unit: "px",
                description:
                    "Bows the row into an arc. Positive dips the ends downward, negative lifts them.",
            },
            velocitySkew: {
                type: ControlType.Number,
                title: "Velocity Skew",
                defaultValue: 0.5,
                min: 0,
                max: 2,
                step: 0.1,
                description:
                    "The whole row leans into the scroll and springs back when it stops. Higher leans more.",
            },
            desaturate: {
                type: ControlType.Number,
                title: "Desaturate",
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.05,
                description:
                    "Off-center frames lose color and bloom back to full color at the center.",
            },
        },
    },
    style: {
        type: ControlType.Object,
        title: "Style",
        description:
            "Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works/)",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0A0A0A",
                description: "The color behind the gallery.",
            },
            mediaRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 8,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                description: "Rounds the corners of each frame.",
            },
            showCaptions: {
                type: ControlType.Boolean,
                title: "Captions",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Shows each image's caption at the bottom-left. In CMS mode the image's alt text is used.",
            },
            captionColor: {
                type: ControlType.Color,
                title: "Caption Color",
                defaultValue: "#FFFFFF",
                description: "Color of the caption text.",
                hidden: (p: { showCaptions?: boolean }) => !p.showCaptions,
            },
            showProgress: {
                type: ControlType.Boolean,
                title: "Progress Bar",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "A thin bar that tracks scroll progress. Hidden in Infinite Loop, which has no start or end.",
            },
            progressColor: {
                type: ControlType.Color,
                title: "Progress Color",
                defaultValue: "#FFFFFF",
                description: "Color of the progress bar fill.",
                hidden: (p: { showProgress?: boolean }) => !p.showProgress,
            },
            lockOverscroll: {
                type: ControlType.Boolean,
                title: "No Overscroll",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Sets overscroll-behavior: none on the page so it won't rubber-band or scroll-chain past this section. Applies on the live site and in preview, not in the canvas editor.",
            },
        },
    },
})
