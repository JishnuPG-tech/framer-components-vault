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
    "https://picsum.photos/seed/vpg1/700/900",
    "https://picsum.photos/seed/vpg2/700/900",
    "https://picsum.photos/seed/vpg3/700/900",
    "https://picsum.photos/seed/vpg4/700/900",
    "https://picsum.photos/seed/vpg5/700/900",
    "https://picsum.photos/seed/vpg6/700/900",
    "https://picsum.photos/seed/vpg7/700/900",
    "https://picsum.photos/seed/vpg8/700/900",
]

type MediaType = "image" | "video"
type Source = "manual" | "cms"
type HeightMode = "aspect" | "custom"
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

// Click the real Framer-generated anchor for a CMS tile (not a synthesised one)
// so its router resolves the route correctly in canvas/popout preview and live.
// Same approach proven on the 3D Sphere Gallery and the horizontal gallery.
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
        mediaWidth?: number
        heightMode?: HeightMode
        aspect?: keyof typeof ASPECTS
        mediaHeight?: number
        gap?: number
        paddingTop?: number
        paddingBottom?: number
        paddingX?: number
        stageHeight?: number
    }
    motion?: {
        parallax?: number
        overscan?: number
    }
    loop?: {
        enabled?: boolean
        speed?: number
        direction?: "up" | "down"
        wheel?: boolean
    }
    effect?: {
        centerFocus?: number
        arc?: number
        velocitySkew?: number
        desaturate?: number
    }
    style?: {
        background?: string
        mediaRadius?: number
        showCaptions?: boolean
        captionColor?: string
        lockOverscroll?: boolean
    }
}

const LOOP_HEIGHT_FALLBACK = 800
const FRICTION = 0.92
const CLICK_MOVEMENT_THRESHOLD = 6

/**
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 1400
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
export default function VerticalParallaxGallery(props: Props) {
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

    const mediaWidth = clamp(layout?.mediaWidth ?? 70, 10, 100)
    const heightMode: HeightMode =
        layout?.heightMode === "custom" ? "custom" : "aspect"
    const aspectKey = layout?.aspect ?? "3:4"
    const mediaHeight = clamp(layout?.mediaHeight ?? 70, 10, 100)
    const gap = layout?.gap ?? 32
    const paddingTop = layout?.paddingTop ?? 0
    const paddingBottom = layout?.paddingBottom ?? 0
    const paddingX = layout?.paddingX ?? 0
    const stageHeight = clamp(layout?.stageHeight ?? 100, 40, 100)

    const overscan = clamp(motion?.overscan ?? 25, 6, 60)
    const parallax = clamp(motion?.parallax ?? 12, 0, overscan / 2)

    const infinite = loop?.enabled ?? false
    const autoSpeed = clamp(loop?.speed ?? 40, 0, 600)
    const direction = loop?.direction === "down" ? "down" : "up"
    const dirSign = direction === "up" ? 1 : -1
    const wheelMove = loop?.wheel ?? true

    const centerFocus = clamp(effect?.centerFocus ?? 0.15, 0, 0.6)
    const arc = clamp(effect?.arc ?? 0, -160, 160)
    const velocitySkew = clamp(effect?.velocitySkew ?? 0.4, 0, 2)
    const desaturate = clamp(effect?.desaturate ?? 0, 0, 1)

    const background = style?.background ?? "#0A0A0A"
    const mediaRadius = style?.mediaRadius ?? 8
    const showCaptions = style?.showCaptions ?? true
    const captionColor = style?.captionColor ?? "#FFFFFF"
    const lockOverscroll = style?.lockOverscroll ?? true

    const aspect = ASPECTS[aspectKey] ?? 3 / 4

    const isStatic = useIsStaticRenderer()
    const looping = infinite && !isStatic

    const rootRef = useRef<HTMLDivElement>(null)
    const columnRef = useRef<HTMLDivElement>(null)
    const slotProbeRef = useRef<HTMLDivElement>(null)
    const mediaEls = useRef<Array<HTMLElement | null>>([])
    const imgEls = useRef<Array<HTMLElement | null>>([])

    const [slotItems, setSlotItems] = useState<Item[]>([])
    const [copies, setCopies] = useState(2)
    const copiesRef = useRef(2)
    copiesRef.current = copies

    const infYRef = useRef(0)
    const prevVelRef = useRef(0)
    const prevScrollRef = useRef(0)
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
        parallax,
        centerFocus,
        arc,
        velocitySkew,
        desaturate,
        infinite,
        autoSpeed,
        dirSign,
    })
    cfgRef.current = {
        parallax,
        centerFocus,
        arc,
        velocitySkew,
        desaturate,
        infinite,
        autoSpeed,
        dirSign,
    }

    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        const column = columnRef.current
        if (!root || !column) return

        const perSet = itemsPerSet

        const frame = (now: number) => {
            const cfg = cfgRef.current
            let dt = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0
            if (dt > 0.05) dt = 0.05
            lastTimeRef.current = now

            let ty = 0
            let velForSkew = 0
            let centerY: number
            let halfH: number

            if (cfg.infinite) {
                const stageRect = root.getBoundingClientRect()
                centerY = stageRect.top + stageRect.height / 2
                halfH = stageRect.height / 2 || 1

                if (!draggingRef.current) {
                    let advance = cfg.autoSpeed * cfg.dirSign * dt
                    advance += momentumRef.current
                    momentumRef.current *= FRICTION
                    if (Math.abs(momentumRef.current) < 0.01) momentumRef.current = 0
                    infYRef.current += advance
                }
                velForSkew = infYRef.current - prevVelRef.current
                prevVelRef.current = infYRef.current

                const a = mediaEls.current[0]
                const b = mediaEls.current[perSet]
                let setSpan = 0
                if (a && b && a.isConnected && b.isConnected)
                    setSpan = b.offsetTop - a.offsetTop

                if (setSpan > 0) {
                    let m = infYRef.current % setSpan
                    if (m < 0) m += setSpan
                    ty = -m
                    const need = Math.min(
                        16,
                        Math.max(2, Math.ceil((halfH * 2) / setSpan) + 2)
                    )
                    if (need !== copiesRef.current) {
                        copiesRef.current = need
                        setCopies(need)
                    }
                } else {
                    ty = -infYRef.current
                }
            } else {
                const ih =
                    typeof window !== "undefined" ? window.innerHeight : 800
                centerY = ih / 2
                halfH = ih / 2 || 1
                const rootTop = root.getBoundingClientRect().top
                velForSkew = prevScrollRef.current - rootTop
                prevScrollRef.current = rootTop
            }

            const skewAngle =
                cfg.velocitySkew > 0
                    ? clamp(velForSkew * cfg.velocitySkew * 0.12, -8, 8)
                    : 0
            column.style.transform =
                "translate3d(0, " +
                ty.toFixed(2) +
                "px, 0) skewX(" +
                skewAngle.toFixed(2) +
                "deg)"

            for (let i = 0; i < mediaEls.current.length; i++) {
                const media = mediaEls.current[i]
                const img = imgEls.current[i]
                if (!media || !img || !media.isConnected) continue
                const r = media.getBoundingClientRect()
                const ec = r.top + r.height / 2
                const t = clamp((ec - centerY) / halfH, -1, 1)
                const at = t < 0 ? -t : t

                img.style.transform =
                    "translate3d(0, " + (-t * cfg.parallax).toFixed(2) + "%, 0)"

                const scale = 1 + cfg.centerFocus * (1 - at)
                const arcX = cfg.arc * t * t
                media.style.transform =
                    "translateX(" +
                    arcX.toFixed(1) +
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

    // Wheel / trackpad over the gallery scrolls the loop vertically. Native
    // non-passive listener so we can preventDefault. Captures page scrolling
    // while hovered, the same trade-off as the horizontal gallery.
    useEffect(() => {
        if (!looping || !wheelMove) return
        const root = rootRef.current
        if (!root) return
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const d =
                Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
            infYRef.current += d
            momentumRef.current = d * 0.15
        }
        root.addEventListener("wheel", onWheel, { passive: false })
        return () => root.removeEventListener("wheel", onWheel)
    }, [looping, wheelMove])

    const clickSourceAnchor = (src: string) => {
        const probe = slotProbeRef.current
        if (!probe) return
        const anchor = findSourceAnchor(probe, src)
        if (anchor) anchor.click()
    }

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
        dragLastRef.current = e.clientY
        dragMovedRef.current = 0
        momentumRef.current = 0
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch (err) {}
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current) return
        const dy = e.clientY - dragLastRef.current
        dragLastRef.current = e.clientY
        dragMovedRef.current += Math.abs(dy)
        if (dragMovedRef.current > CLICK_MOVEMENT_THRESHOLD)
            draggedRef.current = true
        infYRef.current -= dy
        momentumRef.current = -dy
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

    const loopPx =
        typeof height === "number" && height > 0 ? height : LOOP_HEIGHT_FALLBACK

    const rootStyle: React.CSSProperties = {
        position: "relative",
        width: width ?? "100%",
        height: infinite ? loopPx : "auto",
        minHeight: infinite ? stageHeight + "vh" : undefined,
        maxHeight: infinite ? stageHeight + "vh" : undefined,
        overflow: infinite ? "hidden" : "visible",
        background,
        touchAction: looping ? "none" : undefined,
    }

    const padY = infinite ? 0 : { top: paddingTop, bottom: paddingBottom }

    const columnStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: gap,
        width: "100%",
        boxSizing: "border-box",
        paddingTop: typeof padY === "object" ? padY.top : 0,
        paddingBottom: typeof padY === "object" ? padY.bottom : 0,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        willChange: "transform",
        transformOrigin: "center center",
        transform: "translate3d(0,0,0)",
    }

    const mediaSizing: React.CSSProperties =
        heightMode === "custom"
            ? { height: mediaHeight + "vh" }
            : { aspectRatio: String(aspect) }

    const mediaBase: React.CSSProperties = {
        position: "relative",
        width: mediaWidth + "%",
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
        left: 0,
        top: (-overscan / 2).toFixed(2) + "%",
        width: "100%",
        height: (100 + overscan).toFixed(2) + "%",
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
        <div
            ref={rootRef}
            style={rootStyle}
            onPointerDown={looping ? onPointerDown : undefined}
            onPointerMove={looping ? onPointerMove : undefined}
            onPointerUp={looping ? endDrag : undefined}
            onPointerCancel={looping ? endDrag : undefined}
        >
            <div ref={columnRef} style={columnStyle}>
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

                    // Loop mode owns pointer capture for dragging, so a tile's own
                    // click never fires — the root's pointer-up hit-test handles it.
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
            {resolvedSource === "cms" && collectionSlot ? (
                <div ref={slotProbeRef} style={probeStyle} aria-hidden>
                    {collectionSlot}
                </div>
            ) : null}
        </div>
    )
}

VerticalParallaxGallery.displayName = "Vertical Parallax Gallery"

addPropertyControls(VerticalParallaxGallery, {
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
            "The images and videos stacked in the column. Each one parallaxes inside its frame as it passes through the viewport.",
        hidden: (p: Partial<Props>) => p.source === "cms",
    },
    collectionSlot: {
        type: ControlType.ComponentInstance,
        title: "Collection",
        description:
            "Drop a Framer Collection List here, configured for your collection, with an Image inside the row template. The gallery reads every image rendered inside this slot and stacks them in one column. If each row has a link, a click on the frame follows it.",
        hidden: (p: Partial<Props>) => p.source !== "cms",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description:
            "Frame size, spacing, and padding. The column grows with its content; in Infinite Loop, Stage Height sets the window the column scrolls inside.",
        controls: {
            mediaWidth: {
                type: ControlType.Number,
                title: "Image Width",
                defaultValue: 70,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
                description:
                    "Each frame's width as a share of the column. 100 makes frames full-bleed.",
            },
            heightMode: {
                type: ControlType.Enum,
                title: "Height",
                defaultValue: "aspect",
                options: ["aspect", "custom"],
                optionTitles: ["From Aspect", "Custom"],
                displaySegmentedControl: true,
                description:
                    "From Aspect derives the height from the width and a ratio. Custom lets you set the height directly in screen heights.",
            },
            aspect: {
                type: ControlType.Enum,
                title: "Aspect",
                defaultValue: "3:4",
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
                hidden: (p: { heightMode?: HeightMode }) =>
                    p.heightMode === "custom",
            },
            mediaHeight: {
                type: ControlType.Number,
                title: "Image Height",
                defaultValue: 70,
                min: 10,
                max: 100,
                step: 1,
                unit: "vh",
                description:
                    "Frame height as a share of the screen height. 100 makes each frame fill the screen.",
                hidden: (p: { heightMode?: HeightMode }) =>
                    p.heightMode !== "custom",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 32,
                min: 0,
                max: 200,
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
                    "Space above the first frame. Ignored in Infinite Loop.",
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
                    "Space below the last frame. Ignored in Infinite Loop.",
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding Sides",
                defaultValue: 0,
                min: 0,
                max: 400,
                step: 2,
                unit: "px",
                description: "Left and right inset of the whole column.",
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
                    "Only in Infinite Loop: the height of the window the column scrolls inside, as a share of the screen.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description:
            "How far each image drifts inside its frame as it moves through the viewport.",
        controls: {
            parallax: {
                type: ControlType.Number,
                title: "Parallax",
                defaultValue: 12,
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
                    "Extra image height that creates room for the drift. The image renders taller than its frame and slides within it.",
            },
        },
    },
    loop: {
        type: ControlType.Object,
        title: "Infinite Loop",
        description:
            "Turns the column into a seamless, never-ending vertical marquee. Scroll, drag, or let it auto-drift. Stage Height sets the window it scrolls inside.",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Infinite",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Loops the column seamlessly with no start or end. Scroll over it, drag it, or let it auto-drift.",
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Scroll to Move",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "The mouse wheel and trackpad scroll the column while the pointer is over it. This captures page scrolling while hovered. Pair with Speed 0 for a purely scroll-driven column.",
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
                    "How fast the column drifts on its own. Set to 0 to move only on scroll and drag.",
                hidden: (p: { enabled?: boolean }) => !p.enabled,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                defaultValue: "up",
                options: ["up", "down"],
                optionTitles: ["Up", "Down"],
                displaySegmentedControl: true,
                description: "Which way the column auto-drifts.",
                hidden: (p: { enabled?: boolean }) => !p.enabled,
            },
        },
    },
    effect: {
        type: ControlType.Object,
        title: "Effect",
        description:
            "Flourishes that layer on top of the parallax as frames cross the viewport. All four combine.",
        controls: {
            centerFocus: {
                type: ControlType.Number,
                title: "Center Focus",
                defaultValue: 0.15,
                min: 0,
                max: 0.6,
                step: 0.05,
                description:
                    "Frames swell as they reach the center of the screen. 0 keeps them flat.",
            },
            arc: {
                type: ControlType.Number,
                title: "Arc",
                defaultValue: 0,
                min: -160,
                max: 160,
                step: 4,
                unit: "px",
                description:
                    "Bows the column sideways. Positive pushes the ends right, negative left.",
            },
            velocitySkew: {
                type: ControlType.Number,
                title: "Velocity Skew",
                defaultValue: 0.4,
                min: 0,
                max: 2,
                step: 0.1,
                description:
                    "The column leans as it scrolls and springs back when it stops. Higher leans more.",
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
