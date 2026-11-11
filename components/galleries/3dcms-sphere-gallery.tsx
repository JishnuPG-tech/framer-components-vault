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
    "https://picsum.photos/seed/sphere1/300/300",
    "https://picsum.photos/seed/sphere2/300/300",
    "https://picsum.photos/seed/sphere3/300/300",
    "https://picsum.photos/seed/sphere4/300/300",
    "https://picsum.photos/seed/sphere5/300/300",
    "https://picsum.photos/seed/sphere6/300/300",
    "https://picsum.photos/seed/sphere7/300/300",
    "https://picsum.photos/seed/sphere8/300/300",
]

type MediaType = "image" | "video"
type Source = "manual" | "cms"
type ImgValue = { src?: string } | string | undefined
type RawItem = {
    type?: MediaType
    image?: ImgValue
    video?: string
    poster?: ImgValue
    link?: string
}
type Item = {
    type: MediaType
    src: string
    poster?: string
    link?: string
}

function resolveSrc(value: ImgValue): string | undefined {
    if (!value) return undefined
    return typeof value === "string" ? value : value.src
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
// we can click Framer's OWN anchor instead of synthesising one. Framer's router
// is wired to its own anchors, so clicking them resolves the route correctly in
// every environment — canvas preview, popout preview, and the published site.
// A synthesised relative link, by contrast, resolves against the editor's base
// path in preview and 404s on dynamic CMS routes like /blog/:slug.
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

// Synthesise a real anchor click so Framer's router intercepts same-origin
// links the same way it would for any other link on the page. When newTab is
// true, we open in _blank — handy inside Framer canvas, where the editor's
// router 404s on dynamic CMS routes a published site resolves fine.
function navigateTo(href: string, newTab: boolean) {
    if (!href || typeof document === "undefined") return
    try {
        const a = document.createElement("a")
        a.href = href
        if (newTab) {
            a.target = "_blank"
            a.rel = "noopener noreferrer"
        }
        a.style.position = "absolute"
        a.style.left = "-9999px"
        a.style.opacity = "0"
        a.style.pointerEvents = "none"
        document.body.appendChild(a)
        a.click()
        a.remove()
    } catch (err) {
        try {
            if (newTab && typeof window !== "undefined") {
                window.open(href, "_blank", "noopener,noreferrer")
            } else {
                window.location.assign(href)
            }
        } catch (err2) {}
    }
}

interface Props {
    width?: number
    height?: number
    source?: Source
    items?: RawItem[]
    collectionSlot?: React.ReactNode
    openInNewTab?: boolean
    layout?: {
        count?: number
        sphereSize?: number
        tileSize?: number
        tileAspect?: "square" | "portrait" | "landscape"
        gap?: number
        depthFade?: number
    }
    motion?: {
        autoRotate?: boolean
        autoSpeed?: number
        dragSpeed?: number
        hoverStrength?: number
        initialTilt?: number
        wheelSpin?: boolean
    }
    effect?: {
        mode?: "none" | "breathe" | "wave" | "magnetic" | "parallax"
        intensity?: number
        speed?: number
    }
    style?: {
        tileRadius?: number
        tileShadow?: boolean
        shadowColor?: string
        backgroundColor?: string
        vignette?: boolean
        vignetteColor?: string
    }
}

const FRICTION = 0.94
const CLICK_MOVEMENT_THRESHOLD = 8

/**
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 560
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SphereGallery(props: Props) {
    const {
        width,
        height,
        source,
        items,
        collectionSlot,
        openInNewTab,
        layout,
        motion,
        effect,
        style,
    } = props

    const resolvedSource: Source = source === "cms" ? "cms" : "manual"

    const count = layout?.count ?? 40
    const sphereSize = layout?.sphereSize ?? 0.85
    const tileSize = layout?.tileSize ?? 90
    const tileAspect = layout?.tileAspect ?? "square"
    const gap = layout?.gap ?? 0.1
    const depthFade = layout?.depthFade ?? 0.55

    const autoRotate = motion?.autoRotate ?? true
    const autoSpeed = motion?.autoSpeed ?? 8
    const dragSpeed = motion?.dragSpeed ?? 1
    const hoverStrength = motion?.hoverStrength ?? 1
    const initialTilt = motion?.initialTilt ?? 20
    const wheelSpin = motion?.wheelSpin ?? false

    const effectMode = effect?.mode ?? "breathe"
    const effectIntensity = effect?.intensity ?? 1
    const effectSpeed = effect?.speed ?? 1

    const tileRadius = style?.tileRadius ?? 8
    const tileShadow = style?.tileShadow ?? true
    const shadowColor = style?.shadowColor ?? "rgba(0,0,0,0.35)"
    const backgroundColor = style?.backgroundColor ?? "#0A0A0A"
    const vignette = style?.vignette ?? true
    const vignetteColor = style?.vignetteColor ?? "rgba(0,0,0,0.55)"

    const isStatic = useIsStaticRenderer()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const tileEls = useRef<Array<HTMLDivElement | null>>([])
    const slotProbeRef = useRef<HTMLDivElement>(null)

    const [slotItems, setSlotItems] = useState<Item[]>([])

    const rotXRef = useRef((initialTilt * Math.PI) / 180)
    const rotYRef = useRef(0.6)
    const velXRef = useRef(0)
    const velYRef = useRef(0)
    const draggingRef = useRef(false)
    const hoveringRef = useRef(false)
    const hoverNxRef = useRef(0)
    const hoverNyRef = useRef(0)
    const lastRef = useRef<{ x: number; y: number } | null>(null)
    const movementRef = useRef(0)
    const parallaxXRef = useRef(0)
    const parallaxYRef = useRef(0)
    const rafRef = useRef<number | null>(null)
    const lastTimeRef = useRef(0)

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
                    list.push({ type: "image", src, link })
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
                            p.link === list[i].link
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

    const resolved = useMemo(() => {
        if (resolvedSource === "cms") {
            return slotItems.length ? slotItems : fallbackItems()
        }
        if (!items || items.length === 0) return fallbackItems()
        const list: Item[] = []
        for (const it of items) {
            if (!it) continue
            const type: MediaType = it.type === "video" ? "video" : "image"
            if (type === "video") {
                if (it.video)
                    list.push({
                        type,
                        src: it.video,
                        poster: resolveSrc(it.poster),
                        link: it.link,
                    })
            } else {
                const src = resolveSrc(it.image)
                if (src) list.push({ type, src, link: it.link })
            }
        }
        return list.length ? list : fallbackItems()
    }, [resolvedSource, items, slotItems])

    const points = useMemo(() => {
        const n = Math.max(1, Math.floor(count))
        const ga = Math.PI * (3 - Math.sqrt(5))
        const pts: Array<[number, number, number]> = []
        for (let i = 0; i < n; i++) {
            const y = 1 - ((i + 0.5) / n) * 2
            const r = Math.sqrt(Math.max(0, 1 - y * y))
            const theta = i * ga
            pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r])
        }
        return pts
    }, [count])

    const tileW = tileSize
    const tileH =
        tileAspect === "portrait"
            ? Math.round(tileSize * 1.35)
            : tileAspect === "landscape"
            ? Math.round(tileSize * 0.7)
            : tileSize

    const cfgRef = useRef({
        sphereSize,
        autoRotate,
        autoSpeed,
        depthFade,
        hoverStrength,
        gap,
        effectMode,
        effectIntensity,
        effectSpeed,
    })
    cfgRef.current = {
        sphereSize,
        autoRotate,
        autoSpeed,
        depthFade,
        hoverStrength,
        gap,
        effectMode,
        effectIntensity,
        effectSpeed,
    }

    useEffect(() => {
        if (isStatic) return
        const wrapper = wrapperRef.current
        if (!wrapper) return

        const frame = (now: number) => {
            const cfg = cfgRef.current
            let dt = lastTimeRef.current === 0 ? 0 : (now - lastTimeRef.current) / 1000
            if (dt > 0.05) dt = 0.05
            lastTimeRef.current = now

            const W = wrapper.clientWidth
            const H = wrapper.clientHeight
            const baseR = (Math.min(W, H) / 2) * cfg.sphereSize * (1 + cfg.gap * 0.45)
            wrapper.style.perspective = (baseR * 2.4).toFixed(0) + "px"

            if (!draggingRef.current) {
                const steerable =
                    cfg.hoverStrength > 0 &&
                    cfg.effectMode !== "magnetic" &&
                    cfg.effectMode !== "parallax"
                if (hoveringRef.current && steerable) {
                    const maxV = cfg.hoverStrength * 0.03
                    const targetVY = hoverNxRef.current * maxV
                    const targetVX = -hoverNyRef.current * maxV
                    velYRef.current += (targetVY - velYRef.current) * 0.08
                    velXRef.current += (targetVX - velXRef.current) * 0.08
                    rotYRef.current += velYRef.current
                    rotXRef.current += velXRef.current
                } else {
                    rotXRef.current += velXRef.current
                    rotYRef.current += velYRef.current
                    velXRef.current *= FRICTION
                    velYRef.current *= FRICTION
                    if (cfg.autoRotate)
                        rotYRef.current += ((cfg.autoSpeed * Math.PI) / 180) * dt
                }
            }

            const rx = rotXRef.current
            const ry = rotYRef.current
            const t = now / 1000

            let globalMul = 1
            if (cfg.effectMode === "breathe") {
                globalMul =
                    1 + Math.sin(t * cfg.effectSpeed * 1.2) * 0.045 * cfg.effectIntensity
            }

            if (stageRef.current) {
                if (cfg.effectMode === "parallax") {
                    const targetX = hoveringRef.current
                        ? hoverNxRef.current * 22 * cfg.effectIntensity
                        : 0
                    const targetY = hoveringRef.current
                        ? hoverNyRef.current * 22 * cfg.effectIntensity
                        : 0
                    parallaxXRef.current += (targetX - parallaxXRef.current) * 0.1
                    parallaxYRef.current += (targetY - parallaxYRef.current) * 0.1
                    stageRef.current.style.transform =
                        "translate3d(" +
                        parallaxXRef.current.toFixed(1) +
                        "px, " +
                        parallaxYRef.current.toFixed(1) +
                        "px, 0)"
                } else if (parallaxXRef.current !== 0 || parallaxYRef.current !== 0) {
                    parallaxXRef.current *= 0.85
                    parallaxYRef.current *= 0.85
                    if (Math.abs(parallaxXRef.current) < 0.05) parallaxXRef.current = 0
                    if (Math.abs(parallaxYRef.current) < 0.05) parallaxYRef.current = 0
                    stageRef.current.style.transform =
                        "translate3d(" +
                        parallaxXRef.current.toFixed(1) +
                        "px, " +
                        parallaxYRef.current.toFixed(1) +
                        "px, 0)"
                }
            }

            const cosY = Math.cos(ry)
            const sinY = Math.sin(ry)
            const cosX = Math.cos(rx)
            const sinX = Math.sin(rx)

            for (let i = 0; i < points.length; i++) {
                const el = tileEls.current[i]
                if (!el) continue
                const [bx, by, bz] = points[i]

                let tileMul = globalMul
                if (cfg.effectMode === "wave") {
                    const phase = t * cfg.effectSpeed * 1.8 - by * 3.2
                    tileMul *= 1 + Math.sin(phase) * 0.07 * cfg.effectIntensity
                }

                const R = baseR * tileMul

                const x1 = bx * cosY + bz * sinY
                const z1 = -bx * sinY + bz * cosY
                const y2 = by * cosX - z1 * sinX
                const z2 = by * sinX + z1 * cosX

                const px = x1 * R
                const py = -y2 * R
                const pz = z2 * R

                let scale = 1
                if (cfg.effectMode === "magnetic" && hoveringRef.current) {
                    const dx = px / baseR - hoverNxRef.current
                    const dy = py / baseR + hoverNyRef.current
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const influence = Math.max(0, 1 - dist * 1.4)
                    scale = 1 + influence * 0.5 * cfg.effectIntensity
                }

                const opacity = Math.max(
                    0,
                    Math.min(1, 1 - cfg.depthFade * ((1 - z2) / 2))
                )

                el.style.transform =
                    "translate(-50%, -50%) translate3d(" +
                    px.toFixed(2) +
                    "px, " +
                    py.toFixed(2) +
                    "px, " +
                    pz.toFixed(2) +
                    "px) scale(" +
                    scale.toFixed(3) +
                    ")"
                el.style.opacity = String(opacity)
                el.style.zIndex = String(Math.round((z2 + 1) * 1000))
            }

            rafRef.current = requestAnimationFrame(frame)
        }
        rafRef.current = requestAnimationFrame(frame)

        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            lastTimeRef.current = 0
        }
    }, [isStatic, points])

    useEffect(() => {
        if (isStatic || !wheelSpin) return
        const wrapper = wrapperRef.current
        if (!wrapper) return
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const k = 0.002 * dragSpeed
            rotYRef.current += e.deltaY * k
            velYRef.current = e.deltaY * k * 0.4
        }
        wrapper.addEventListener("wheel", onWheel, { passive: false })
        return () => wrapper.removeEventListener("wheel", onWheel)
    }, [isStatic, wheelSpin, dragSpeed])

    const hitTestTile = (x: number, y: number) => {
        let best = -1
        let bestZ = -Infinity
        for (let i = 0; i < tileEls.current.length; i++) {
            const el = tileEls.current[i]
            if (!el) continue
            const r = el.getBoundingClientRect()
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                const z = parseInt(el.style.zIndex || "0", 10)
                if (z > bestZ) {
                    bestZ = z
                    best = i
                }
            }
        }
        return best
    }

    // CMS tiles: click the real Framer anchor the source row rendered, so its
    // router resolves the route correctly inside Framer's preview (where our own
    // synthesised relative link 404s against the editor base path). Returns false
    // when no matching anchor exists, so the caller can fall back to navigateTo.
    const clickSourceAnchor = (src: string, newTab: boolean): boolean => {
        const probe = slotProbeRef.current
        if (!probe) return false
        const anchor = findSourceAnchor(probe, src)
        if (!anchor) return false
        let prevTarget: string | null = null
        let hadTarget = false
        if (newTab) {
            hadTarget = anchor.hasAttribute("target")
            prevTarget = anchor.getAttribute("target")
            anchor.setAttribute("target", "_blank")
        }
        anchor.click()
        if (newTab) {
            if (hadTarget && prevTarget != null)
                anchor.setAttribute("target", prevTarget)
            else anchor.removeAttribute("target")
        }
        return true
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        draggingRef.current = true
        hoveringRef.current = false
        lastRef.current = { x: e.clientX, y: e.clientY }
        movementRef.current = 0
        velXRef.current = 0
        velYRef.current = 0
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
        hoverNxRef.current = Math.max(-1, Math.min(1, nx))
        hoverNyRef.current = Math.max(-1, Math.min(1, ny))

        if (draggingRef.current && lastRef.current) {
            const dx = e.clientX - lastRef.current.x
            const dy = e.clientY - lastRef.current.y
            movementRef.current += Math.sqrt(dx * dx + dy * dy)
            const k = 0.005 * dragSpeed
            rotYRef.current += dx * k
            rotXRef.current -= dy * k
            velYRef.current = dx * k
            velXRef.current = -dy * k
            lastRef.current = { x: e.clientX, y: e.clientY }
            return
        }
        hoveringRef.current = true
    }

    const onPointerLeave = () => {
        hoveringRef.current = false
    }

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        const wasClick = movementRef.current < CLICK_MOVEMENT_THRESHOLD
        draggingRef.current = false
        lastRef.current = null
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch (err) {}

        if (!wasClick) return

        const idx = hitTestTile(e.clientX, e.clientY)
        if (idx < 0) return
        const item = resolved[idx % resolved.length]
        if (!item?.link) return
        // In CMS mode, prefer clicking the real Framer anchor the row rendered:
        // its router resolves the route correctly inside Framer's preview, where
        // a synthesised relative link 404s against the editor's base path. Manual
        // links have no Framer anchor to borrow, so they fall through to navigateTo.
        const usedAnchor =
            resolvedSource === "cms" && clickSourceAnchor(item.src, !!openInNewTab)
        if (!usedAnchor) navigateTo(item.link, !!openInNewTab)
    }

    const w = typeof width === "number" ? width : 560
    const h = typeof height === "number" ? height : 560
    const staticBaseR = (Math.min(w, h) / 2) * sphereSize * (1 + gap * 0.45)
    const staticRx = (initialTilt * Math.PI) / 180
    const staticRy = 0.6

    const wrapperStyle: React.CSSProperties = {
        position: "relative",
        overflow: "hidden",
        width: width ?? "100%",
        height: height ?? "100%",
        background: backgroundColor,
        perspective: (staticBaseR * 2.4).toFixed(0) + "px",
        perspectiveOrigin: "50% 50%",
        touchAction: "none",
    }

    const stageStyle: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        willChange: "transform",
    }

    const tileBase: React.CSSProperties = {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: tileW,
        height: tileH,
        borderRadius: tileRadius,
        pointerEvents: "none",
        userSelect: "none",
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
        overflow: "hidden",
        boxShadow: tileShadow ? "0 10px 28px " + shadowColor : undefined,
        background: "#000",
    }

    const mediaStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    }

    const vignetteStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background:
            "radial-gradient(circle at 50% 50%, transparent 55%, " +
            vignetteColor +
            " 100%)",
        zIndex: 9999,
        display: vignette ? "block" : "none",
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
            ref={wrapperRef}
            style={wrapperStyle}
            onPointerDown={isStatic ? undefined : onPointerDown}
            onPointerMove={isStatic ? undefined : onPointerMove}
            onPointerUp={isStatic ? undefined : endDrag}
            onPointerCancel={isStatic ? undefined : endDrag}
            onPointerLeave={isStatic ? undefined : onPointerLeave}
        >
            <div ref={stageRef} style={stageStyle}>
                {points.map((p, i) => {
                    const item = resolved[i % resolved.length]
                    let staticTransform: string | undefined
                    let staticOpacity = 1
                    let staticZ = 0
                    if (isStatic) {
                        const cosY = Math.cos(staticRy)
                        const sinY = Math.sin(staticRy)
                        const x1 = p[0] * cosY + p[2] * sinY
                        const z1 = -p[0] * sinY + p[2] * cosY
                        const cosX = Math.cos(staticRx)
                        const sinX = Math.sin(staticRx)
                        const y2 = p[1] * cosX - z1 * sinX
                        const z2 = p[1] * sinX + z1 * cosX
                        const px = (x1 * staticBaseR).toFixed(2)
                        const py = (-y2 * staticBaseR).toFixed(2)
                        const pz = (z2 * staticBaseR).toFixed(2)
                        staticTransform =
                            "translate(-50%, -50%) translate3d(" +
                            px +
                            "px, " +
                            py +
                            "px, " +
                            pz +
                            "px)"
                        staticOpacity = Math.max(
                            0,
                            Math.min(1, 1 - depthFade * ((1 - z2) / 2))
                        )
                        staticZ = Math.round((z2 + 1) * 1000)
                    }
                    const linkAffordance: React.CSSProperties = item.link
                        ? { pointerEvents: "auto", cursor: "pointer" }
                        : {}
                    const tileStyleFinal: React.CSSProperties = isStatic
                        ? {
                              ...tileBase,
                              ...linkAffordance,
                              transform: staticTransform,
                              opacity: staticOpacity,
                              zIndex: staticZ,
                          }
                        : { ...tileBase, ...linkAffordance }

                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                tileEls.current[i] = el
                            }}
                            style={tileStyleFinal}
                            data-sphere-link={item.link || undefined}
                        >
                            {item.type === "video" ? (
                                <video
                                    src={item.src}
                                    poster={item.poster}
                                    autoPlay={!isStatic}
                                    loop
                                    muted
                                    playsInline
                                    preload="metadata"
                                    style={mediaStyle}
                                />
                            ) : (
                                <img
                                    src={item.src}
                                    alt=""
                                    draggable={false}
                                    style={mediaStyle}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
            <div style={vignetteStyle} />
            {resolvedSource === "cms" && collectionSlot ? (
                <div ref={slotProbeRef} style={probeStyle} aria-hidden>
                    {collectionSlot}
                </div>
            ) : null}
        </div>
    )
}

SphereGallery.displayName = "3D Sphere Gallery"

addPropertyControls(SphereGallery, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        defaultValue: "manual",
        options: ["manual", "cms"],
        optionTitles: ["Manual", "CMS"],
        displaySegmentedControl: true,
        description:
            "Manual hand-picks images and videos. CMS reads every image and video from the layer you drop into the Collection slot — typically a Framer Collection List pointed at your collection. Each tile inherits the row's link, so clicking a tile follows the same href the source row would.",
    },
    items: {
        type: ControlType.Array,
        title: "Media",
        maxCount: 80,
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
                    description: "Whether this tile shows an image or a video.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "The image that fills the tile.",
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
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description:
                        "Optional URL the tile points to when clicked.",
                },
            },
        },
        description: "Mix images and videos around the globe.",
        hidden: (p: Partial<Props>) => p.source === "cms",
    },
    collectionSlot: {
        type: ControlType.ComponentInstance,
        title: "Collection",
        description:
            "Drop a Framer Collection List here, configured for your collection, with an Image inside the row template. The sphere reads every image rendered inside this slot and tiles them across one globe. If each row has a link, the sphere picks it up and a click on the tile follows it.",
        hidden: (p: Partial<Props>) => p.source !== "cms",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Opens tile links in a new tab. In CMS mode the sphere clicks the row's real Framer link so navigation works in preview and live; turn this on only if you want each post to open in its own tab.",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "Sphere size, tile count, and the breathing space between tiles.",
        controls: {
            count: {
                type: ControlType.Number,
                title: "Tiles",
                defaultValue: 40,
                min: 6,
                max: 200,
                step: 1,
                description:
                    "How many tiles sit on the sphere. In CMS mode set this to your collection size, or higher to repeat rows.",
            },
            sphereSize: {
                type: ControlType.Number,
                title: "Sphere",
                defaultValue: 0.85,
                min: 0.3,
                max: 1.4,
                step: 0.05,
                description: "Scales the globe to fit its frame.",
            },
            tileSize: {
                type: ControlType.Number,
                title: "Tile",
                defaultValue: 90,
                min: 30,
                max: 240,
                step: 1,
                unit: "px",
                description: "Base tile width. Aspect adjusts the height.",
            },
            tileAspect: {
                type: ControlType.Enum,
                title: "Aspect",
                defaultValue: "square",
                options: ["square", "portrait", "landscape"],
                optionTitles: ["Square", "Portrait", "Landscape"],
                description: "Tile aspect ratio.",
            },
            gap: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 0.1,
                min: 0,
                max: 1,
                step: 0.05,
                description:
                    "Pushes tiles further apart by expanding the sphere radius without changing tile size.",
            },
            depthFade: {
                type: ControlType.Number,
                title: "Depth Fade",
                defaultValue: 0.55,
                min: 0,
                max: 1,
                step: 0.05,
                description: "How much tiles dim as they rotate to the back.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description: "Drag, hover steering, idle spin, and scroll-to-spin.",
        controls: {
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Slowly spins the globe while idle.",
            },
            autoSpeed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 8,
                min: 0,
                max: 60,
                step: 1,
                unit: "°/s",
                description: "Idle spin speed.",
                hidden: (p: { autoRotate?: boolean }) => !p.autoRotate,
            },
            dragSpeed: {
                type: ControlType.Number,
                title: "Drag",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.1,
                description: "How fast drag spins the globe.",
            },
            hoverStrength: {
                type: ControlType.Number,
                title: "Hover",
                defaultValue: 1,
                min: 0,
                max: 2,
                step: 0.1,
                description:
                    "How strongly the cursor steers the globe. 0 to require dragging. Ignored while Magnetic or Parallax effects are on.",
            },
            initialTilt: {
                type: ControlType.Number,
                title: "Tilt",
                defaultValue: 20,
                min: -45,
                max: 45,
                step: 1,
                unit: "°",
                description: "The forward tilt the sphere starts at.",
            },
            wheelSpin: {
                type: ControlType.Boolean,
                title: "Scroll To Spin",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Lets the scroll wheel rotate the globe. Captures page scrolling while hovered.",
            },
        },
    },
    effect: {
        type: ControlType.Object,
        title: "Effect",
        description: "A living motion layer that sits on top of rotation.",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                defaultValue: "breathe",
                options: ["none", "breathe", "wave", "magnetic", "parallax"],
                optionTitles: ["None", "Breathe", "Wave", "Magnetic", "Parallax"],
                description:
                    "Breathe pulses the globe. Wave ripples tiles outward. Magnetic scales tiles near the cursor. Parallax drifts the globe with the cursor.",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 1,
                min: 0,
                max: 2,
                step: 0.1,
                description: "How strong the effect is.",
                hidden: (p: { mode?: string }) => !p.mode || p.mode === "none",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1,
                min: 0.1,
                max: 3,
                step: 0.1,
                description: "How fast the effect cycles.",
                hidden: (p: { mode?: string }) =>
                    !p.mode ||
                    p.mode === "none" ||
                    p.mode === "magnetic" ||
                    p.mode === "parallax",
            },
        },
    },
    style: {
        type: ControlType.Object,
        title: "Style",
        description:
            "Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works/)",
        controls: {
            tileRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 8,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                description: "Rounds the corners of each tile.",
            },
            tileShadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Drops a soft shadow under each tile.",
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow Color",
                defaultValue: "rgba(0,0,0,0.35)",
                description: "Color of the tile shadow.",
                hidden: (p: { tileShadow?: boolean }) => !p.tileShadow,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0A0A0A",
                description: "The background color behind the globe.",
            },
            vignette: {
                type: ControlType.Boolean,
                title: "Vignette",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Soft radial fade at the edges for a more dimensional feel.",
            },
            vignetteColor: {
                type: ControlType.Color,
                title: "Vignette Color",
                defaultValue: "rgba(0,0,0,0.55)",
                description: "Color of the edge fade.",
                hidden: (p: { vignette?: boolean }) => !p.vignette,
            },
        },
    },
})
