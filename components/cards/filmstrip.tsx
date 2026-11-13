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


const { useRef, useEffect, useState, useMemo, useCallback, useLayoutEffect } =
    React

// ---------- types ----------

interface MediaItem {
    type?: "image" | "video"
    image?: any
    video?: string
    poster?: string
    title?: string
    description?: string
    link?: string
}

interface LayoutProps {
    cardWidth?: number
    heightMode?: "aspect" | "custom"
    aspect?: "3:2" | "4:3" | "1:1" | "3:4" | "9:16"
    cardHeight?: number
    gap?: number
    loop?: boolean
}

interface AccordionProps {
    spread?: number
    collapsed?: number
    dim?: number
}

interface EffectsProps {
    depthBlur?: number
    parallax?: number
    desaturate?: number
}

interface MotionProps {
    dragSpeed?: number
    momentum?: number
    snap?: boolean
    ease?: number
    wheel?: boolean
    autoSpeed?: number
}

interface TextProps {
    show?: boolean
    font?: any
    titleSize?: number
    titleColor?: string
    descriptionSize?: number
    descriptionColor?: string
}

interface LabelProps {
    show?: boolean
    left?: string
    right?: string
    font?: any
    size?: number
    color?: string
    paddingX?: number
}

interface StyleProps {
    background?: string
    cornerRadius?: number
    shadow?: boolean
    shadowColor?: string
    lockOverscroll?: boolean
}

interface Props {
    source?: "manual" | "cms"
    items?: MediaItem[]
    collectionSlot?: React.ReactNode
    layout?: LayoutProps
    accordion?: AccordionProps
    effects?: EffectsProps
    motion?: MotionProps
    text?: TextProps
    labels?: LabelProps
    style?: StyleProps
    width?: number
    height?: number
}

interface Resolved {
    src: string
    type: "image" | "video"
    poster?: string
    title?: string
    description?: string
    link?: string
}

interface Geom {
    step: number
    cardWidth: number
    fullH: number
    collapsedH: number
    gap: number
    stageW: number
    stageH: number
    n: number
    span: number
    K: number
    loop: boolean
    poolLen: number
}

interface Cfg {
    spread: number
    dim: number
    momentum: number
    snap: boolean
    ease: number
    autoSpeed: number
    dragSpeed: number
}

interface Eff {
    depthBlur: number
    parallax: number
    desaturate: number
}

interface TileFrame {
    topY: number
    h: number
    weight: number
    op: number
    vis: boolean
    dist: number
}

// ---------- helpers ----------

const clamp = (v: number, lo: number, hi: number) =>
    v < lo ? lo : v > hi ? hi : v

const mod = (n: number, m: number) => ((n % m) + m) % m

const ASPECTS: Record<string, number> = {
    "3:2": 3 / 2,
    "4:3": 4 / 3,
    "1:1": 1,
    "3:4": 3 / 4,
    "9:16": 9 / 16,
}

const resolveImg = (v: any): string =>
    typeof v === "string" ? v : v && v.src ? v.src : ""

// Vertical position of the media band inside a tile, with depth parallax.
function mediaTop(a: TileFrame, g: Geom, eff: Eff): number {
    const base = (a.h - g.fullH) / 2
    const maxOff = (g.fullH - a.h) / 2
    const df = clamp(a.dist / 2, -1, 1)
    const pOff = eff.parallax * df * maxOff
    return clamp(base + pOff, a.h - g.fullH, 0)
}

// Depth-of-field blur + desaturation, strongest on the collapsed slices.
function mediaFilter(a: TileFrame, eff: Eff): string {
    const w = a.weight
    const blur = eff.depthBlur * (1 - w)
    const sat = 1 - eff.desaturate * (1 - w)
    if (blur < 0.05 && sat > 0.995) return "none"
    return `blur(${blur.toFixed(2)}px) saturate(${sat.toFixed(3)})`
}

const DEFAULTS: Resolved[] = [
    {
        src: "https://framerusercontent.com/images/KVPAUAHYWjEOtr2WWanO7euowxM.jpg",
        title: "Riverbed",
        description: "Field study",
    },
    {
        src: "https://framerusercontent.com/images/UQwc7wNniYYyFmupHcFhfeKBgc4.jpg",
        title: "Overpass",
        description: "Concrete & light",
    },
    {
        src: "https://framerusercontent.com/images/qAo7KeRD3ln2VaYClV3ObeeGrIc.jpg",
        title: "Companion",
        description: "Portrait series",
    },
    {
        src: "https://framerusercontent.com/images/D20QfgLE0jrXfuCefHpyNNdIjU.jpg",
        title: "Kitchen",
        description: "Still life",
    },
    {
        src: "https://framerusercontent.com/images/DtTXV2gsLaU7x2s048R0YyLlC2Y.jpg",
        title: "Headland",
        description: "Coastal survey",
    },
    {
        src: "https://framerusercontent.com/images/PPuTcdg051jF5PjBI15bUwtPBrc.jpg",
        title: "Reserve",
        description: "Wildlife, dusk",
    },
].map((d) => ({ ...d, type: "image" as const }))

function findSourceAnchor(
    probe: HTMLElement | null,
    src: string
): HTMLAnchorElement | null {
    if (!probe || !src) return null
    const medias = probe.querySelectorAll("img, video")
    for (let i = 0; i < medias.length; i++) {
        const m = medias[i] as HTMLImageElement | HTMLVideoElement
        const ms =
            (m as HTMLImageElement).currentSrc ||
            (m as any).src ||
            m.getAttribute("src") ||
            ""
        if (ms === src || ms.split("?")[0] === src.split("?")[0]) {
            const a = m.closest("a") as HTMLAnchorElement | null
            if (a) return a
        }
    }
    return null
}

const rowAnchor = (el: HTMLElement): HTMLAnchorElement | null =>
    (el.tagName === "A"
        ? el
        : el.querySelector("a")) as HTMLAnchorElement | null

function repeatingRows(probe: HTMLElement): HTMLElement[] {
    let best: HTMLElement[] = []
    let bestScore = 0
    const all = probe.querySelectorAll("*")
    for (let i = 0; i < all.length; i++) {
        const el = all[i] as HTMLElement
        const kids = Array.from(el.children) as HTMLElement[]
        if (kids.length < 2) continue
        const groups: Record<string, HTMLElement[]> = {}
        for (const k of kids) {
            const cls =
                (k.getAttribute("class") || "").trim().split(/\s+/)[0] || ""
            const sig = k.tagName + "." + cls
            ;(groups[sig] = groups[sig] || []).push(k)
        }
        for (const sig in groups) {
            const grp = groups[sig]
            if (grp.length < 2) continue
            let descendants = 0
            for (const g of grp) descendants += g.querySelectorAll("*").length
            if (descendants > bestScore) {
                bestScore = descendants
                best = grp
            }
        }
    }
    return best
}

// Pure layout solver — the vertical accordion. Card WIDTH is constant; only the
// HEIGHT expands toward the focus (center) and collapses to a thin slice away
// from it. Cards pack vertically by their current height; the focus is centered.
function computeLayout(off: number, g: Geom, c: Cfg): TileFrame[] {
    const P = g.poolLen
    const res: TileFrame[] = new Array(P)
    if (!P || g.n === 0) return res

    const f = g.loop
        ? mod(off, g.span) / g.step
        : clamp(off, 0, (g.n - 1) * g.step) / g.step

    const hs = new Array<number>(P)
    const wts = new Array<number>(P)
    const vis = new Array<boolean>(P)
    const ops = new Array<number>(P)
    const ds = new Array<number>(P)
    const range = fullRange(g)

    for (let j = 0; j < P; j++) {
        const vi = g.loop ? j - g.n : j
        const d = vi - f
        const ad = Math.abs(d)
        const within = g.loop ? ad <= g.K : true
        if (!within) {
            vis[j] = false
            hs[j] = g.collapsedH
            wts[j] = 0
            ops[j] = 0
            ds[j] = 0
            continue
        }
        const w = Math.exp(-(d * d) / (2 * c.spread * c.spread))
        wts[j] = w
        hs[j] = g.collapsedH + range * w
        vis[j] = true
        ds[j] = d
        const loopOp = g.loop ? clamp(g.K - ad, 0, 1) : 1
        ops[j] = loopOp * (1 - c.dim * (1 - w))
    }

    // pack card centers vertically with gap, focus centered at stageH/2
    const centers = new Array<number>(P)
    let prevC = 0
    let prevHalf = 0
    let started = false
    for (let j = 0; j < P; j++) {
        if (!vis[j]) {
            centers[j] = prevC
            continue
        }
        const half = hs[j] / 2
        if (!started) {
            centers[j] = half
            started = true
        } else {
            centers[j] = prevC + prevHalf + g.gap + half
        }
        prevC = centers[j]
        prevHalf = half
    }

    const fi = Math.floor(f)
    const jf = g.loop ? fi + g.n : clamp(fi, 0, g.n - 1)
    const jfc = clamp(jf, 0, P - 1)
    const jf2 = Math.min(jfc + 1, P - 1)
    const fr = f - fi
    const Cf = centers[jfc] + fr * (centers[jf2] - centers[jfc])

    const midY = g.stageH / 2

    for (let j = 0; j < P; j++) {
        if (!vis[j]) {
            res[j] = {
                topY: 0,
                h: g.collapsedH,
                weight: 0,
                op: 0,
                vis: false,
                dist: 0,
            }
            continue
        }
        const cy = midY + (centers[j] - Cf)
        res[j] = {
            topY: cy - hs[j] / 2,
            h: hs[j],
            weight: wts[j],
            op: ops[j],
            vis: true,
            dist: ds[j],
        }
    }
    return res
}

const fullRange = (g: Geom) => Math.max(0, g.fullH - g.collapsedH)

// ---------- component ----------

/**
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 760
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Filmstrip(props: Props) {
    const {
        source = "manual",
        items,
        collectionSlot,
        layout = {},
        accordion = {},
        effects = {},
        motion = {},
        text = {},
        labels = {},
        style = {},
        width,
        height,
    } = props

    const isStatic = useIsStaticRenderer()

    // ----- layout -----
    const cardWidth = layout.cardWidth ?? 320
    const gap = layout.gap ?? 12
    const aspect = ASPECTS[layout.aspect ?? "3:4"] ?? 0.75
    const fullH =
        (layout.heightMode ?? "aspect") === "custom"
            ? layout.cardHeight ?? 440
            : Math.round(cardWidth / aspect)
    const loop = layout.loop ?? true

    // ----- accordion shape -----
    const spread = Math.max(0.3, accordion.spread ?? 0.85)
    const collapsedH = clamp(accordion.collapsed ?? 46, 8, fullH)
    const dim = clamp(accordion.dim ?? 0.35, 0, 1)

    // ----- style -----
    const background = style.background ?? "#0b0b0c"
    const cornerRadius = style.cornerRadius ?? 10
    const shadow = style.shadow ?? true
    const shadowColor = style.shadowColor ?? "rgba(0,0,0,0.5)"
    const lockOverscroll = style.lockOverscroll ?? true

    // ----- effects -----
    const depthBlur = clamp(effects.depthBlur ?? 6, 0, 30)
    const parallax = clamp(effects.parallax ?? 0.4, 0, 1)
    const desaturate = clamp(effects.desaturate ?? 0.55, 0, 1)

    // ----- motion -----
    const dragSpeed = motion.dragSpeed ?? 1
    const momentum = clamp(motion.momentum ?? 0.9, 0, 0.985)
    const snap = motion.snap ?? true
    const ease = clamp(motion.ease ?? 0.16, 0.02, 0.6)
    const wheelOn = motion.wheel ?? false
    const autoSpeed = motion.autoSpeed ?? 0

    // ----- per-card text -----
    const textShow = text.show ?? true
    const textFont = text.font
    const titleSize = text.titleSize ?? 18
    const titleColor = text.titleColor ?? "#ffffff"
    const descSize = text.descriptionSize ?? 13
    const descColor = text.descriptionColor ?? "rgba(255,255,255,0.75)"

    // ----- side labels -----
    const labelsShow = labels.show ?? true
    const labelLeft = labels.left ?? "Featured Projects"
    const labelRight = labels.right ?? "2022 → 2026"
    const labelFont = labels.font
    const labelSize = labels.size ?? 15
    const labelColor = labels.color ?? "rgba(255,255,255,0.9)"
    const labelPadX = labels.paddingX ?? 40

    // ----- refs -----
    const stageRef = useRef<HTMLDivElement | null>(null)
    const probeRef = useRef<HTMLDivElement | null>(null)
    const liveRowsRef = useRef<HTMLElement[]>([])
    const tilesDom = useRef<
        Array<{
            frame: HTMLDivElement
            media: HTMLElement | null
            caption: HTMLElement | null
        } | null>
    >([])
    const offRef = useRef(0)
    const velRef = useRef(0)
    const draggingRef = useRef(false)
    const movedRef = useRef(0)
    const lastYRef = useRef(0)
    const rafRef = useRef<number | null>(null)
    const lastTRef = useRef(0)
    const seededRef = useRef(false)

    const [probeItems, setProbeItems] = useState<Resolved[]>([])

    const seedW = typeof width === "number" && width > 0 ? width : 640
    const seedH = typeof height === "number" && height > 0 ? height : 760
    const [stage, setStage] = useState({ w: seedW, h: seedH })
    // Hide the reel until it has been measured and positioned once, so the
    // first paint is never shown at the fallback size (which would appear
    // off-center, then snap). Forced visible on the static canvas.
    const [ready, setReady] = useState(false)

    // ----- resolve items -----
    const manualResolved = useMemo<Resolved[]>(() => {
        const list = (items ?? []).map((it) => {
            const type = it.type === "video" ? "video" : "image"
            const src =
                type === "video" ? resolveImg(it.video) : resolveImg(it.image)
            return {
                src,
                type: type as "image" | "video",
                poster: resolveImg(it.poster) || undefined,
                title: it.title,
                description: it.description,
                link: it.link,
            }
        })
        const filtered = list.filter((r) => r.src)
        return filtered.length ? filtered : DEFAULTS
    }, [items])

    const resolved: Resolved[] = useMemo(() => {
        if (source === "cms") return probeItems.length ? probeItems : DEFAULTS
        return manualResolved
    }, [source, probeItems, manualResolved])

    const n = resolved.length
    const step = fullH + gap
    const span = n * step

    const K = loop
        ? Math.min(n, Math.ceil(stage.h / 2 / (collapsedH + gap)) + 3)
        : n
    const poolLen = loop ? 3 * n : n

    // ----- live mirrors -----
    const cfg: Cfg = {
        spread,
        dim,
        momentum,
        snap,
        ease,
        autoSpeed,
        dragSpeed,
    }
    const cfgRef = useRef(cfg)
    cfgRef.current = cfg

    const eff: Eff = {
        depthBlur,
        parallax,
        desaturate,
    }
    const effRef = useRef(eff)
    effRef.current = eff

    const geom: Geom = {
        step,
        cardWidth,
        fullH,
        collapsedH,
        gap,
        stageW: stage.w,
        stageH: stage.h,
        n,
        span,
        K,
        loop,
        poolLen,
    }
    const geomRef = useRef(geom)
    geomRef.current = geom

    // ----- imperative painter -----
    const paint = useCallback(() => {
        const g = geomRef.current
        const c = cfgRef.current
        const e = effRef.current
        const tiles = tilesDom.current
        const arr = computeLayout(offRef.current, g, c)
        const centerX = g.stageW / 2 - g.cardWidth / 2
        for (let j = 0; j < tiles.length; j++) {
            const t = tiles[j]
            const a = arr[j]
            if (!t) continue
            if (!a || !a.vis) {
                if (t.frame.style.opacity !== "0") t.frame.style.opacity = "0"
                t.frame.style.pointerEvents = "none"
                continue
            }
            t.frame.style.height = a.h + "px"
            t.frame.style.transform = `translate3d(${centerX}px, ${a.topY}px, 0)`
            t.frame.style.opacity = String(a.op)
            t.frame.style.zIndex = String(1000 + Math.round(a.weight * 1000))
            t.frame.style.pointerEvents = a.op > 0.4 ? "auto" : "none"
            if (t.media) {
                t.media.style.top = mediaTop(a, g, e) + "px"
                t.media.style.filter = mediaFilter(a, e)
            }
            if (t.caption) {
                const cw = clamp((a.weight - 0.55) / 0.45, 0, 1)
                t.caption.style.opacity = String(cw)
            }
        }
    }, [])

    const snapTarget = useCallback((off: number) => {
        const g = geomRef.current
        return Math.round(off / g.step) * g.step
    }, [])

    // ----- rAF (paused when off-viewport via IntersectionObserver) -----
    useEffect(() => {
        if (isStatic) return
        let running = false
        const tick = (now: number) => {
            const c = cfgRef.current
            const g = geomRef.current
            const last = lastTRef.current || now
            const dt = Math.min(0.05, (now - last) / 1000)
            lastTRef.current = now
            if (!draggingRef.current) {
                if (c.autoSpeed && Math.abs(velRef.current) < 0.3) {
                    offRef.current += c.autoSpeed * dt
                } else {
                    offRef.current += velRef.current
                    velRef.current *= c.momentum
                    if (Math.abs(velRef.current) < 0.4) {
                        velRef.current = 0
                        if (c.snap && !c.autoSpeed) {
                            const target = snapTarget(offRef.current)
                            offRef.current += (target - offRef.current) * c.ease
                        }
                    }
                }
                if (!g.loop) {
                    const maxOff = (g.n - 1) * g.step
                    if (offRef.current < 0) {
                        offRef.current += (0 - offRef.current) * 0.2
                        velRef.current = 0
                    } else if (offRef.current > maxOff) {
                        offRef.current += (maxOff - offRef.current) * 0.2
                        velRef.current = 0
                    }
                }
            }
            paint()
            rafRef.current = requestAnimationFrame(tick)
        }
        const start = () => {
            if (running) return
            running = true
            lastTRef.current = 0
            rafRef.current = requestAnimationFrame(tick)
        }
        const stop = () => {
            running = false
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        const el = stageRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            start()
            return () => stop()
        }
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) start()
                    else stop()
                }
            },
            { threshold: 0.01 }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            stop()
        }
    }, [isStatic, paint, snapTarget])

    // ----- seed once -----
    useLayoutEffect(() => {
        if (!seededRef.current) {
            offRef.current = Math.floor(n / 2) * step
            seededRef.current = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ----- reassert layout after every render -----
    useLayoutEffect(() => {
        paint()
    })

    // ----- measure stage -----
    // useLayoutEffect (not useEffect) so the first real measurement and the
    // re-layout it triggers are flushed BEFORE the browser paints. Otherwise
    // the reel paints once at the fallback height (off-center) and visibly
    // jumps to center after the post-paint measure.
    useLayoutEffect(() => {
        const el = stageRef.current
        if (!el) return
        const measure = () =>
            setStage({
                w: el.clientWidth || seedW,
                h: el.clientHeight || seedH,
            })
        measure()
        // Reveal only after the first real measurement is committed.
        setReady(true)
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [seedW, seedH])

    // ----- CMS slot probe -----
    useEffect(() => {
        if (source !== "cms") return
        const probe = probeRef.current
        if (!probe) return
        const extract = () => {
            const rows = repeatingRows(probe)
            if (rows.length >= 2) {
                liveRowsRef.current = rows
                const out: Resolved[] = rows.map((row) => {
                    const media = row.querySelector("img, video") as any
                    const isVideo =
                        media && media.tagName.toLowerCase() === "video"
                    const src = media
                        ? media.currentSrc ||
                          media.src ||
                          media.getAttribute("src") ||
                          ""
                        : ""
                    const a = rowAnchor(row)
                    const lines = (row.innerText || "")
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    return {
                        src,
                        type: isVideo ? "video" : "image",
                        title: lines[0],
                        description: lines.slice(1).join("  ·  ") || undefined,
                        link: a
                            ? a.getAttribute("href") || undefined
                            : undefined,
                    }
                })
                const usable = out.filter((r) => r.src || r.title)
                if (usable.length) {
                    setProbeItems(usable)
                    return
                }
            }
            liveRowsRef.current = []
            const out: Resolved[] = []
            const seen = new Set<string>()
            probe.querySelectorAll("img, video").forEach((m) => {
                const isVideo = m.tagName.toLowerCase() === "video"
                const src =
                    (m as HTMLImageElement).currentSrc ||
                    (m as any).src ||
                    m.getAttribute("src") ||
                    ""
                if (!src || seen.has(src)) return
                seen.add(src)
                const a = m.closest("a") as HTMLAnchorElement | null
                out.push({
                    src,
                    type: isVideo ? "video" : "image",
                    title: (m as HTMLImageElement).alt || undefined,
                    link: a ? a.getAttribute("href") || undefined : undefined,
                })
            })
            setProbeItems(out)
        }
        extract()
        const obs = new MutationObserver(extract)
        obs.observe(probe, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "srcset", "currentSrc", "href", "alt"],
        })
        return () => obs.disconnect()
    }, [source, collectionSlot])

    // ----- no overscroll (scoped to the component, never the page root) -----
    useEffect(() => {
        if (isStatic || !lockOverscroll) return
        const el = stageRef.current
        if (!el) return
        const prev = el.style.overscrollBehavior
        el.style.overscrollBehavior = "none"
        return () => {
            el.style.overscrollBehavior = prev
        }
    }, [isStatic, lockOverscroll])

    // ----- wheel -----
    useEffect(() => {
        if (isStatic || !wheelOn) return
        const el = stageRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            offRef.current += e.deltaY
            velRef.current = 0
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [isStatic, wheelOn])

    // ----- click-through -----
    const handleClick = useCallback(
        (targetEl: HTMLElement | null) => {
            const probe = probeRef.current
            // Resolve the clicked tile from the event's OWN target (scoped to
            // this component's subtree) instead of hit-testing the global
            // document. closest() walks up from the target and returns null if
            // the release was not on one of our tiles.
            const frame = targetEl
                ? (targetEl.closest("[data-tile]") as HTMLElement)
                : null
            if (!frame) return
            const idx = Number(frame.getAttribute("data-index"))
            const item = resolved[idx]
            if (!item || !item.link) return
            if (source === "cms") {
                const rowEl = liveRowsRef.current[idx]
                const a = rowEl ? rowAnchor(rowEl) : null
                if (a) {
                    a.click()
                    return
                }
                const a2 = findSourceAnchor(probe, item.src)
                if (a2) {
                    a2.click()
                    return
                }
            }
            const link = item.link
            if (typeof link !== "string") return
            const a = document.createElement("a")
            a.href = link
            a.style.display = "none"
            // keep the temp anchor scoped to the component's own container
            const host = stageRef.current
            if (host) {
                host.appendChild(a)
                a.click()
                host.removeChild(a)
            } else {
                a.click()
            }
        },
        [resolved, source]
    )

    // ----- drag (vertical) -----
    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (isStatic) return
            draggingRef.current = true
            movedRef.current = 0
            lastYRef.current = e.clientY
            velRef.current = 0
            // Resolve the tapped tile from the pointerDOWN target. Once
            // setPointerCapture is active, later pointer events (incl.
            // pointerup) are retargeted to the captured element, so ev.target
            // on release is the stage, not the tile, which breaks click-through
            // and CMS links. The down target is always the real pressed node.
            const downTarget = e.target as HTMLElement | null
            // Capture the pointer so a touch or pen drag keeps delivering
            // events even if the finger drifts off this element.
            try {
                ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            } catch {}
            const onMove = (ev: PointerEvent) => {
                const dy = ev.clientY - lastYRef.current
                lastYRef.current = ev.clientY
                movedRef.current += Math.abs(dy)
                const c = cfgRef.current
                offRef.current -= dy * c.dragSpeed
                velRef.current = -dy * c.dragSpeed
            }
            const onUp = () => {
                draggingRef.current = false
                window.removeEventListener("pointermove", onMove)
                window.removeEventListener("pointerup", onUp)
                window.removeEventListener("pointercancel", onCancel)
                if (movedRef.current < 6) handleClick(downTarget)
            }
            // pointercancel fires when the OS interrupts a touch (a call, a
            // system gesture). Reset cleanly so the reel never sticks mid-drag.
            const onCancel = () => {
                draggingRef.current = false
                window.removeEventListener("pointermove", onMove)
                window.removeEventListener("pointerup", onUp)
                window.removeEventListener("pointercancel", onCancel)
            }
            window.addEventListener("pointermove", onMove)
            window.addEventListener("pointerup", onUp)
            window.addEventListener("pointercancel", onCancel)
        },
        [isStatic, handleClick]
    )

    // ----- render -----
    const renderOff = seededRef.current
        ? offRef.current
        : Math.floor(n / 2) * step
    const initLayout = computeLayout(renderOff, geom, cfg)
    const centerX = stage.w / 2 - cardWidth / 2

    const titleStyle: React.CSSProperties = {
        ...(textFont || {}),
        fontSize: titleSize,
        lineHeight: 1.2,
        color: titleColor,
        fontWeight: (textFont && textFont.fontWeight) || 600,
        margin: 0,
    }
    const descStyle: React.CSSProperties = {
        ...(textFont || {}),
        fontSize: descSize,
        lineHeight: 1.35,
        color: descColor,
        fontWeight: 400,
        margin: "4px 0 0 0",
    }
    const labelStyle: React.CSSProperties = {
        ...(labelFont || {}),
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: labelSize,
        color: labelColor,
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        zIndex: 5000,
    }

    const tileNodes: React.ReactNode[] = []
    for (let j = 0; j < poolLen; j++) {
        const itemIndex = loop ? mod(j, n) : j
        const item = resolved[itemIndex]
        if (!item) continue
        const a = initLayout[j]
        const live = a && a.vis ? a : null
        const hasText = textShow && (item.title || item.description)
        const mTop = live
            ? mediaTop(live, geom, eff)
            : (collapsedH - fullH) / 2
        const mFilter = live ? mediaFilter(live, eff) : "none"
        tileNodes.push(
            <div
                key={j}
                data-tile=""
                data-index={itemIndex}
                ref={(el) => {
                    if (el)
                        tilesDom.current[j] = {
                            frame: el,
                            media: el.querySelector(
                                "[data-media]"
                            ) as HTMLElement | null,
                            caption: el.querySelector(
                                "[data-caption]"
                            ) as HTMLElement | null,
                        }
                    else tilesDom.current[j] = null
                }}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: cardWidth,
                    height: a ? a.h : collapsedH,
                    borderRadius: cornerRadius,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.04)",
                    boxShadow: shadow
                        ? `0 30px 60px -24px ${shadowColor}`
                        : "none",
                    transform: a
                        ? `translate3d(${centerX}px, ${a.topY}px, 0)`
                        : `translate3d(${centerX}px, 0px, 0)`,
                    opacity: a ? a.op : 1,
                    zIndex: a ? 1000 + Math.round(a.weight * 1000) : 1000,
                    pointerEvents: "auto",
                    cursor: item.link ? "pointer" : undefined,
                    willChange: "transform, height, opacity",
                }}
            >
                {item.src ? (
                    item.type === "video" ? (
                        <video
                            data-media=""
                            src={item.src}
                            poster={item.poster}
                            muted
                            loop
                            playsInline
                            autoPlay={!isStatic}
                            draggable={false}
                            crossOrigin="anonymous"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: mTop,
                                width: cardWidth,
                                height: fullH,
                                objectFit: "cover",
                                filter: mFilter,
                                transform: "scale(1.06)",
                                pointerEvents: "none",
                                userSelect: "none",
                                willChange: "top, filter",
                            }}
                        />
                    ) : (
                        <img
                            data-media=""
                            src={item.src}
                            alt={item.title || ""}
                            draggable={false}
                            crossOrigin="anonymous"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: mTop,
                                width: cardWidth,
                                height: fullH,
                                objectFit: "cover",
                                filter: mFilter,
                                transform: "scale(1.06)",
                                pointerEvents: "none",
                                userSelect: "none",
                                willChange: "top, filter",
                            }}
                        />
                    )
                ) : null}

                {hasText ? (
                    <div
                        data-caption=""
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: "20px 22px",
                            background:
                                "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))",
                            pointerEvents: "none",
                            userSelect: "none",
                            opacity: a ? clamp((a.weight - 0.55) / 0.45, 0, 1) : 0,
                        }}
                    >
                        {item.title ? <p style={titleStyle}>{item.title}</p> : null}
                        {item.description ? (
                            <p style={descStyle}>{item.description}</p>
                        ) : null}
                    </div>
                ) : null}
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 420,
                overflow: "hidden",
                background,
            }}
        >
            <div
                ref={stageRef}
                onPointerDown={onPointerDown}
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    touchAction: "pan-x",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    opacity: isStatic || ready ? 1 : 0,
                    transition: "opacity 0.2s ease",
                }}
            >
                {tileNodes}
            </div>

            {labelsShow && labelLeft ? (
                <div style={{ ...labelStyle, left: labelPadX }}>{labelLeft}</div>
            ) : null}
            {labelsShow && labelRight ? (
                <div
                    style={{ ...labelStyle, right: labelPadX, textAlign: "right" }}
                >
                    {labelRight}
                </div>
            ) : null}

            {source === "cms" ? (
                <div
                    ref={probeRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: -99999,
                        top: 0,
                        width: 1200,
                        height: 1,
                        opacity: 0,
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {collectionSlot}
                </div>
            ) : null}
        </div>
    )
}

Filmstrip.displayName = "Filmstrip"

addPropertyControls(Filmstrip, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["manual", "cms"],
        optionTitles: ["Manual", "CMS"],
        defaultValue: "manual",
        displaySegmentedControl: true,
        description:
            "Manual adds media by hand. CMS reads every row of a Collection List dropped into the slot.",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        description:
            "The cards in the reel — each a media (image or video) with an optional title and description shown when it expands.",
        hidden: (p: Partial<Props>) => p.source === "cms",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                    description: "Image or video for this card.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "The picture for this card.",
                    hidden: (p: any) => p.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm"],
                    description: "The video file for this card.",
                    hidden: (p: any) => p.type !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    description: "Still shown before the video plays.",
                    hidden: (p: any) => p.type !== "video",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    description: "Shown over the card when it expands.",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    description: "Smaller line under the title.",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Where a click on this card goes.",
                },
            },
        },
        defaultValue: [],
    },
    collectionSlot: {
        type: ControlType.ComponentInstance,
        title: "Collection",
        hidden: (p: Partial<Props>) => p.source !== "cms",
        description:
            "Drop a Framer Collection List here with an Image (and optional Title / Description and link) in its row. Line 1 of the row's text is the title, the rest the description.",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description:
            "Card width and the FULL (expanded) height. All cards share the same width; only the height accordions toward the center. Loop makes the reel endless.",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 120,
                max: 800,
                step: 10,
                unit: "px",
                defaultValue: 320,
                description: "Width of every card (constant).",
            },
            heightMode: {
                type: ControlType.Enum,
                title: "Height",
                options: ["aspect", "custom"],
                optionTitles: ["Aspect", "Custom"],
                defaultValue: "aspect",
                displaySegmentedControl: true,
                description:
                    "Derive the expanded height from a ratio, or set it.",
            },
            aspect: {
                type: ControlType.Enum,
                title: "Ratio",
                options: ["3:2", "4:3", "1:1", "3:4", "9:16"],
                defaultValue: "3:4",
                description: "Aspect ratio of the expanded card.",
                hidden: (p: any) => p.heightMode === "custom",
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Full Height",
                min: 120,
                max: 1200,
                step: 10,
                unit: "px",
                defaultValue: 440,
                description: "Height of the expanded (focused) card.",
                hidden: (p: any) => p.heightMode !== "custom",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 12,
                description: "Space between cards.",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Infinite Loop",
                defaultValue: true,
                description: "Endless wrap-around vs a bounded reel.",
            },
        },
    },
    accordion: {
        type: ControlType.Object,
        title: "Expand",
        description:
            "How the cards expand and collapse around the center. The focused card reaches Full Height; the others shrink toward the Collapsed Height.",
        controls: {
            spread: {
                type: ControlType.Number,
                title: "Focus Spread",
                min: 0.3,
                max: 3,
                step: 0.05,
                defaultValue: 0.85,
                description:
                    "How many cards stay open around the center. Higher keeps more neighbours expanded.",
            },
            collapsed: {
                type: ControlType.Number,
                title: "Collapsed Height",
                min: 8,
                max: 200,
                step: 2,
                unit: "px",
                defaultValue: 46,
                description:
                    "Height of the thin slices away from the center.",
            },
            dim: {
                type: ControlType.Number,
                title: "Collapsed Dim",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.35,
                description: "How much the collapsed cards fade.",
            },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        description:
            "Depth-of-field as cards move off center: the collapsed slices blur and desaturate, and the media drifts for parallax.",
        controls: {
            depthBlur: {
                type: ControlType.Number,
                title: "Depth Blur",
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                defaultValue: 6,
                description:
                    "Blur on the collapsed slices, sharpening to 0 at center. 0 turns it off.",
            },
            parallax: {
                type: ControlType.Number,
                title: "Parallax",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.4,
                description:
                    "How far the image drifts inside each card with distance from center. 0 keeps the band centered.",
            },
            desaturate: {
                type: ControlType.Number,
                title: "Desaturate",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.55,
                description:
                    "How far the collapsed slices fade toward grayscale. 0 keeps full colour.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description:
            "How the reel moves. Drag (vertical) is always on; Snap settles a card to center on release. Auto Speed drifts on its own; Scroll to Move adds wheel control and traps page scroll while hovered.",
        controls: {
            dragSpeed: {
                type: ControlType.Number,
                title: "Drag Speed",
                min: 0.2,
                max: 3,
                step: 0.1,
                defaultValue: 1,
                description: "How far the reel moves per pixel dragged.",
            },
            momentum: {
                type: ControlType.Number,
                title: "Momentum",
                min: 0,
                max: 0.98,
                step: 0.01,
                defaultValue: 0.9,
                description: "How long the reel coasts after release.",
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap",
                defaultValue: true,
                description: "Settle the nearest card open at center on rest.",
            },
            ease: {
                type: ControlType.Number,
                title: "Snap Ease",
                min: 0.02,
                max: 0.6,
                step: 0.02,
                defaultValue: 0.16,
                description: "How quickly the snap glides into place.",
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Scroll to Move",
                defaultValue: false,
                description:
                    "Let the mouse wheel move the reel (traps page scroll while hovered).",
            },
            autoSpeed: {
                type: ControlType.Number,
                title: "Auto Speed",
                min: -300,
                max: 300,
                step: 10,
                unit: "px/s",
                defaultValue: 0,
                description: "Idle drift speed. 0 means drag/scroll only.",
            },
        },
    },
    text: {
        type: ControlType.Object,
        title: "Card Text",
        description:
            "Title and description that fade in on the expanded card. They never affect the card size.",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show Text",
                defaultValue: true,
                description: "Show the title / description on the open card.",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                description: "Typeface for the title and description.",
            },
            titleSize: {
                type: ControlType.Number,
                title: "Title Size",
                min: 8,
                max: 48,
                step: 1,
                unit: "px",
                defaultValue: 18,
                description: "Title font size.",
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#ffffff",
                description: "Title text colour.",
            },
            descriptionSize: {
                type: ControlType.Number,
                title: "Desc Size",
                min: 8,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 13,
                description: "Description font size.",
            },
            descriptionColor: {
                type: ControlType.Color,
                title: "Desc Color",
                defaultValue: "rgba(255,255,255,0.75)",
                description: "Description text colour.",
            },
        },
    },
    labels: {
        type: ControlType.Object,
        title: "Side Labels",
        description:
            "The two editorial labels pinned to the left and right edges, centered on the focus line.",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show Labels",
                defaultValue: true,
                description: "Show the side labels.",
            },
            left: {
                type: ControlType.String,
                title: "Left",
                defaultValue: "Featured Projects",
                description: "Left-edge label.",
            },
            right: {
                type: ControlType.String,
                title: "Right",
                defaultValue: "2022 → 2026",
                description: "Right-edge label.",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                description: "Typeface for the labels.",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 8,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 15,
                description: "Label font size.",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(255,255,255,0.9)",
                description: "Label colour.",
            },
            paddingX: {
                type: ControlType.Number,
                title: "Edge Inset",
                min: 0,
                max: 200,
                step: 4,
                unit: "px",
                defaultValue: 40,
                description: "Distance from the left / right edges.",
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
                defaultValue: "#0b0b0c",
                description: "Stage background colour.",
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 10,
                description: "Rounding of the cards.",
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: true,
                description: "Soft drop shadow under the cards.",
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow Color",
                defaultValue: "rgba(0,0,0,0.5)",
                description: "Colour of the card shadow.",
                hidden: (p: any) => p.shadow === false,
            },
            lockOverscroll: {
                type: ControlType.Boolean,
                title: "No Overscroll",
                defaultValue: true,
                description:
                    "Stop the page from rubber-banding past this section.",
            },
        },
    },
})
