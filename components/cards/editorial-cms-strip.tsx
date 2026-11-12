import React, { useRef, useEffect, useState, useMemo, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---- types -------------------------------------------------------------

type ImgValue = { src?: string } | string | undefined

interface ManualItem {
    image?: ImgValue
    title?: string
    subtitle?: string
    link?: string
}

interface Cell {
    src: string
    title: string
    subtitle: string
    href: string
}

type TitlePos = "bottom" | "top" | "center" | "above" | "below" | "split"
type TitleFields = "both" | "title" | "subtitle"
type TitleAlign = "left" | "center" | "right"
type Orient = "horizontal" | "vertical"

interface Props {
    source?: "manual" | "cms"
    items?: ManualItem[]
    collectionSlot?: React.ReactNode
    layout?: {
        orientation?: Orient
        cardWidth?: number
        cardHeight?: number
        gap?: number
        radius?: number
    }
    motion?: {
        wheel?: boolean
        drag?: boolean
        autoSpeed?: number
        snap?: boolean
        glide?: number
    }
    effects?: {
        focus?: number
        dim?: number
        grayscale?: number
        colorCenter?: boolean
        parallax?: number
        edgeBlur?: number
        edgeFade?: number
    }
    title?: {
        display?: "hover" | "always" | "off"
        position?: TitlePos
        fields?: TitleFields
        align?: TitleAlign
        color?: string
        font?: React.CSSProperties
        subFont?: React.CSSProperties
        uppercaseSub?: boolean
    }
    style?: {
        background?: string
        newTab?: boolean
    }
    width?: number
    height?: number
}

// ---- constants ---------------------------------------------------------

const PLACEHOLDERS: Cell[] = [
    {
        src: "https://framerusercontent.com/images/YmKTXLk3mtmL6YEAAPWdemmW6g.jpg",
        title: "Northern Light",
        subtitle: "Field Notes",
        href: "",
    },
    {
        src: "https://framerusercontent.com/images/UHBTTjmNrTIVqr7zegW9l6geJSM.jpg",
        title: "Salt & Stone",
        subtitle: "Process",
        href: "",
    },
    {
        src: "https://framerusercontent.com/images/xZ5z4pdalV3XbzqLveOiXbiASCY.jpg",
        title: "Quiet Hours",
        subtitle: "Editorial",
        href: "",
    },
    {
        src: "https://framerusercontent.com/images/6zVhN2rRmVmDMgecSeyQAleShFg.jpg",
        title: "Paper Moon",
        subtitle: "Studio",
        href: "",
    },
    {
        src: "https://framerusercontent.com/images/gVJ5dWV0aBBebqEqxVDhXMv50.jpg",
        title: "Slow Tide",
        subtitle: "Series",
        href: "",
    },
    {
        src: "https://framerusercontent.com/images/Zv124GRvs0ZyN7ZEBChEYEe7UHM.jpg",
        title: "After Image",
        subtitle: "Archive",
        href: "",
    },
]

const TITLE_FALLBACK: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
}
const SUB_FALLBACK: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacing: "0.06em",
}

// The inner image is scaled past its frame so the parallax drift never exposes
// the frame background. The parallax shift is clamped to this overscan.
const IMG_SCALE = 1.16
const IMG_OVERSCAN = (IMG_SCALE - 1) / 2 // fraction the image bleeds past each edge

// ---- helpers -----------------------------------------------------------

function srcOf(value: ImgValue): string {
    if (!value) return ""
    return typeof value === "string" ? value : (value.src ?? "")
}

function clampN(n: number | string, a: number, b: number) {
    return Math.min(b, Math.max(a, Number(n) || 0))
}

function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

// Stable identity for an image URL, ignoring resize/query params. Framer renders
// one <img> per breakpoint for the SAME image (different resized URLs), so dedup
// must key on the filename, not the full src, or each item slips through 3x.
function imgKey(u: string): string {
    const base = u.split("?")[0].split("#")[0]
    const file = base.substring(base.lastIndexOf("/") + 1)
    return file || base
}

// ---- component ---------------------------------------------------------

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 640
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function EditorialStrip(props: Props) {
    const {
        source = "manual",
        items,
        collectionSlot,
        layout = {},
        motion = {},
        effects = {},
        title = {},
        style = {},
    } = props

    const vertical = (layout.orientation ?? "horizontal") === "vertical"
    const mainPx = clampN(layout.cardWidth ?? 320, 80, 1600)
    const crossPct = clampN(layout.cardHeight ?? 78, 20, 100)
    const gap = clampN(layout.gap ?? 24, 0, 200)
    const radius = clampN(layout.radius ?? 8, 0, 200)

    const wheel = motion.wheel ?? true
    const drag = motion.drag ?? true
    const autoSpeed = clampN(motion.autoSpeed ?? 0, 0, 600)
    const snap = motion.snap ?? true
    const glide = clampN(motion.glide ?? 14, 4, 30) // smoothness; higher = snappier

    const focus = clampN(effects.focus ?? 18, 0, 100)
    const dim = clampN(effects.dim ?? 30, 0, 100)
    const grayscale = clampN(effects.grayscale ?? 80, 0, 100)
    const colorCenter = effects.colorCenter ?? true
    const parallax = clampN(effects.parallax ?? 14, 0, 100)
    const edgeBlur = clampN(effects.edgeBlur ?? 6, 0, 40)
    const edgeFade = clampN(effects.edgeFade ?? 40, 0, 100)

    const titleDisplay = title.display ?? "hover"
    const titlePosition = (title.position ?? "bottom") as TitlePos
    const titleFields = (title.fields ?? "both") as TitleFields
    const titleAlign = (title.align ?? "left") as TitleAlign
    const titleColor = title.color ?? "#ffffff"
    const titleFont = title.font ?? TITLE_FALLBACK
    const subFont = title.subFont ?? SUB_FALLBACK
    const uppercaseSub = title.uppercaseSub ?? true

    const background = style.background ?? "#0b0b0d"
    const newTab = style.newTab ?? false

    const isStatic = useIsStaticRenderer()

    const alignItems =
        titleAlign === "center"
            ? "center"
            : titleAlign === "right"
              ? "flex-end"
              : "flex-start"
    // hidden offset the title slides in from (per position)
    const hiddenY =
        titlePosition === "above"
            ? -10
            : titlePosition === "below"
              ? 10
              : titlePosition === "top"
                ? -12
                : titlePosition === "center"
                  ? 0
                  : titlePosition === "split"
                    ? -12
                    : 12

    // ---- content -------------------------------------------------------
    const [cmsCells, setCmsCells] = useState<Cell[]>([])
    const manual = useMemo<Cell[]>(() => {
        const arr = (items && items.length ? items : []).map((it) => ({
            src: srcOf(it.image),
            title: it.title ?? "",
            subtitle: it.subtitle ?? "",
            href: it.link ?? "",
        }))
        const valid = arr.filter((c) => c.src)
        return valid.length ? valid : PLACEHOLDERS
    }, [items])
    const cells =
        source === "cms" ? (cmsCells.length ? cmsCells : PLACEHOLDERS) : manual
    const N = cells.length

    const pitch = mainPx + gap
    const setSpan = Math.max(N * pitch, 1)

    // measured main-axis size -> how many copies cover the viewport
    const [vmain, setVmain] = useState(1200)
    // On the static canvas/preview the rAF loop never runs, so the duplicate
    // loop copies would just stack at offset 0 and read as repeated cards.
    // Render a single set there; only the live site needs the seamless copies.
    const copies = isStatic ? 1 : Math.max(2, Math.ceil(vmain / setSpan) + 2)
    const M = N * copies

    // ---- refs ----------------------------------------------------------
    const rootRef = useRef<HTMLDivElement | null>(null)
    const trackRef = useRef<HTMLDivElement | null>(null)
    const probeRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]) // outer wrapper (transform/opacity)
    const frameRefs = useRef<(HTMLDivElement | null)[]>([]) // image frame (filter)
    const imgRefs = useRef<(HTMLImageElement | null)[]>([])
    const titleRefs = useRef<(HTMLDivElement | null)[]>([])
    const subRefs = useRef<(HTMLDivElement | null)[]>([]) // 2nd title element in Split
    const anchorsRef = useRef<Map<string, HTMLAnchorElement>>(new Map())

    const offRef = useRef(0)
    const rawRef = useRef(0)
    const lastFrameRef = useRef(0)
    const lastInputRef = useRef(0)
    const hoverRef = useRef<number>(-1)

    // snap state machine: "free" eases toward raw; "snap" tweens to a card
    const modeRef = useRef<"free" | "snap">("free")
    const snapStartRef = useRef(0)
    const snapTargetRef = useRef(0)
    const snapT0Ref = useRef(0)
    const snapDurRef = useRef(500) // ms, set per-snap from current speed

    const draggingRef = useRef(false)
    const movedRef = useRef(false)
    const startMainRef = useRef(0)
    const startRawRef = useRef(0)
    const lastPosRef = useRef(0)
    const lastPtRef = useRef(0)
    const velRef = useRef(0)

    // reusable scratch arrays for the per-frame dock layout
    const halfRef = useRef<number[]>([])
    const cumRef = useRef<number[]>([])
    const centerRef = useRef<number[]>([])
    const nearRef = useRef<number[]>([])
    const scaleRef = useRef<number[]>([])

    // ---- measure main-axis size ----------------------------------------
    useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const measure = () =>
            setVmain((vertical ? root.offsetHeight : root.offsetWidth) || 1200)
        measure()
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(measure)
                : null
        if (ro) ro.observe(root)
        return () => {
            if (ro) ro.disconnect()
        }
    }, [vertical])

    // ---- CMS slot probe ------------------------------------------------
    useEffect(() => {
        if (source !== "cms") return
        const probe = probeRef.current
        if (!probe) return
        const read = () => {
            const out: Cell[] = []
            const seen = new Set<string>()
            anchorsRef.current.clear()
            probe.querySelectorAll("img").forEach((img) => {
                const src =
                    (img as HTMLImageElement).currentSrc ||
                    img.getAttribute("src") ||
                    ""
                if (!src) return
                // dedup by the image's stable identity, NOT the resized src, so
                // Framer's per-breakpoint <img> variants count as one item.
                const key = imgKey(src)
                if (seen.has(key)) return
                seen.add(key)
                let row: HTMLElement | null = img.parentElement
                while (
                    row &&
                    row !== probe &&
                    !(row.textContent || "").trim()
                ) {
                    row = row.parentElement
                }
                const texts: string[] = []
                if (row) {
                    row.querySelectorAll("*").forEach((el) => {
                        if (el.children.length !== 0) return
                        const t = (el.textContent || "").trim()
                        if (t && !texts.includes(t)) texts.push(t)
                    })
                }
                let href = ""
                const a = img.closest("a") as HTMLAnchorElement | null
                if (a) {
                    href = a.getAttribute("href") || ""
                    anchorsRef.current.set(src, a)
                }
                out.push({
                    src,
                    title: texts[0] || img.getAttribute("alt") || "",
                    subtitle: texts[1] || "",
                    href,
                })
            })
            setCmsCells((prev) => {
                if (
                    prev.length === out.length &&
                    prev.every(
                        (p, i) =>
                            p.src === out[i].src &&
                            p.title === out[i].title &&
                            p.subtitle === out[i].subtitle
                    )
                )
                    return prev
                return out
            })
        }
        read()
        const obs = new MutationObserver(read)
        obs.observe(probe, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeFilter: ["src", "srcset", "currentSrc", "alt", "href"],
        })
        return () => obs.disconnect()
    }, [isStatic, source, collectionSlot])

    // ---- navigate ------------------------------------------------------
    const navigate = useCallback(
        (src: string, href: string) => {
            const a = anchorsRef.current.get(src)
            if (a) {
                a.click()
                return
            }
            if (!href) return
            if (newTab) window.open(href, "_blank", "noopener")
            else window.location.href = href
        },
        [newTab]
    )

    // ---- wheel ---------------------------------------------------------
    useEffect(() => {
        if (isStatic || !wheel) return
        const root = rootRef.current
        if (!root) return
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const d = vertical
                ? e.deltaY
                : Math.abs(e.deltaX) > Math.abs(e.deltaY)
                  ? e.deltaX
                  : e.deltaY
            rawRef.current += d
            lastInputRef.current = performance.now()
            modeRef.current = "free"
        }
        root.addEventListener("wheel", onWheel, { passive: false })
        return () => root.removeEventListener("wheel", onWheel)
    }, [isStatic, wheel, vertical])

    // ---- drag ----------------------------------------------------------
    useEffect(() => {
        if (isStatic || !drag) return
        const root = rootRef.current
        if (!root) return

        const mainOf = (e: PointerEvent) => (vertical ? e.clientY : e.clientX)

        const onDown = (e: PointerEvent) => {
            draggingRef.current = true
            movedRef.current = false
            startMainRef.current = mainOf(e)
            startRawRef.current = rawRef.current
            lastPosRef.current = mainOf(e)
            lastPtRef.current = performance.now()
            velRef.current = 0
            lastInputRef.current = performance.now()
            modeRef.current = "free"
        }
        const onMove = (e: PointerEvent) => {
            if (!draggingRef.current) return
            const m = mainOf(e)
            const d = m - startMainRef.current
            if (Math.abs(d) > 4) movedRef.current = true
            rawRef.current = startRawRef.current - d
            const now = performance.now()
            const dt = Math.max(now - lastPtRef.current, 1)
            velRef.current = ((m - lastPosRef.current) / dt) * -16 // px/frame, drag dir
            lastPosRef.current = m
            lastPtRef.current = now
            lastInputRef.current = now
            modeRef.current = "free"
        }
        const onUp = () => {
            if (!draggingRef.current) return
            draggingRef.current = false
            // project the flick a little, then let the snap tween settle it
            rawRef.current += clampN(velRef.current, -1600, 1600) * 8
            lastInputRef.current = performance.now()
            modeRef.current = "free"
        }

        root.addEventListener("pointerdown", onDown)
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        return () => {
            root.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
        }
    }, [isStatic, drag, vertical])

    // ---- main rAF ------------------------------------------------------
    useEffect(() => {
        if (isStatic) return
        let frame = 0
        lastFrameRef.current = performance.now()
        // snap tween duration bounds in MS, tied to Smoothness (snappier = shorter).
        // The actual per-snap duration also scales with travel distance so short
        // hops settle quickly and long glides take their time -> no lurch.
        const snapMin = clampN(280 - ((glide - 4) / 26) * 120, 160, 280) // ms
        const snapMax = clampN(620 - ((glide - 4) / 26) * 260, 360, 620) // ms

        const tick = () => {
            const now = performance.now()
            const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000)
            lastFrameRef.current = now

            const root = rootRef.current
            const track = trackRef.current
            if (!root || !track || N === 0) {
                frame = requestAnimationFrame(tick)
                return
            }
            const mainDim =
                (vertical ? root.offsetHeight : root.offsetWidth) || 1
            const half = mainDim / 2
            const phase = mainPx / 2 - half
            const k = 1 - Math.pow(1 - glide / 100, dt * 60)

            if (autoSpeed > 0) {
                // continuous marquee: no snap
                rawRef.current += autoSpeed * dt
                offRef.current += (rawRef.current - offRef.current) * k
                modeRef.current = "free"
            } else if (modeRef.current === "snap") {
                const tt = (now - snapT0Ref.current) / snapDurRef.current
                if (tt >= 1) {
                    offRef.current = snapTargetRef.current
                    rawRef.current = snapTargetRef.current
                    modeRef.current = "free"
                    lastInputRef.current = now
                } else {
                    offRef.current =
                        snapStartRef.current +
                        (snapTargetRef.current - snapStartRef.current) *
                            easeOutCubic(tt)
                }
            } else {
                // free: ease toward the raw target
                offRef.current += (rawRef.current - offRef.current) * k
                // once input settles, glide-tween onto the nearest card
                if (
                    snap &&
                    !draggingRef.current &&
                    now - lastInputRef.current > 90
                ) {
                    const target =
                        Math.round((rawRef.current - phase) / pitch) * pitch +
                        phase
                    const travel = Math.abs(target - offRef.current)
                    if (travel > 0.5) {
                        snapStartRef.current = offRef.current
                        snapTargetRef.current = target
                        snapT0Ref.current = now
                        // scale duration with how far we have to glide (one card
                        // pitch ~= max), so the eased tween always feels continuous
                        const f = clampN(travel / pitch, 0, 1)
                        snapDurRef.current = snapMin + (snapMax - snapMin) * f
                        modeRef.current = "snap"
                    } else {
                        offRef.current = target
                        rawRef.current = target
                    }
                }
            }

            const off = offRef.current
            const wrapped = ((off % setSpan) + setSpan) % setSpan
            track.style.transform = vertical
                ? `translate3d(0, ${(-wrapped).toFixed(2)}px, 0)`
                : `translate3d(${(-wrapped).toFixed(2)}px, 0, 0)`

            const focusRange = Math.max(mainDim * 0.34, pitch)
            const hovered = hoverRef.current

            const centerA = centerRef.current
            const nearA = nearRef.current
            const scaleA = scaleRef.current
            const halfA = halfRef.current
            const cum = cumRef.current

            // pass 1: geometry per card (centers strictly increase with j)
            for (let j = 0; j < M; j++) {
                const center = j * pitch + mainPx / 2 - wrapped
                const ad = Math.abs(center - half)
                const near = 1 - Math.min(ad / focusRange, 1)
                const s = 1 + (focus / 100) * near
                centerA[j] = center
                nearA[j] = near
                scaleA[j] = s
                halfA[j] = ((s - 1) * mainPx) / 2 // half of the extra main-axis size
            }

            // pass 2: cumulative spread so neighbours slide aside and every
            // gap stays exactly `gap` (dock spacing, no overlap)
            cum[0] = 0
            for (let j = 1; j < M; j++)
                cum[j] = cum[j - 1] + halfA[j - 1] + halfA[j]

            // anchor the spread to the CENTER LINE (continuous, no jump)
            const jc = (half - (mainPx / 2 - wrapped)) / pitch
            let a = Math.floor(jc)
            if (a < 0) a = 0
            if (a > M - 2) a = M - 2
            const t = clampN(jc - a, 0, 1)
            const R = cum[a] + t * (cum[a + 1] - cum[a])

            // pass 3: apply
            for (let j = 0; j < M; j++) {
                const wrap = cardRefs.current[j]
                if (!wrap) continue
                const center = centerA[j]
                if (center < -mainPx * 2 || center > mainDim + mainPx * 2) {
                    wrap.style.opacity = "0"
                    continue
                }
                const dist = center - half
                const nd = clampN(dist / half, -1, 1)
                const and = Math.abs(nd)
                const near = nearA[j]
                const s = scaleA[j]
                const spread = cum[j] - R

                let opacity = 1 - (dim / 100) * (1 - near)
                if (edgeFade > 0 && and > 0.6) {
                    opacity *= 1 - (edgeFade / 100) * ((and - 0.6) / 0.4)
                }

                const isHover = hovered === j
                const colorAmt = Math.max(
                    isHover ? 1 : 0,
                    colorCenter ? near : 0
                )
                const grayAmt = (grayscale / 100) * (1 - colorAmt)
                const blurPx = edgeBlur > 0 ? edgeBlur * and * and : 0

                wrap.style.transform = vertical
                    ? `translate3d(0, ${spread.toFixed(2)}px, 0) scale(${s.toFixed(4)})`
                    : `translate3d(${spread.toFixed(2)}px, 0, 0) scale(${s.toFixed(4)})`
                wrap.style.opacity = Math.max(opacity, 0).toFixed(3)
                wrap.style.zIndex = String(1000 - Math.round(Math.abs(dist)))

                const fr = frameRefs.current[j]
                if (fr) {
                    fr.style.filter =
                        (grayAmt > 0.001
                            ? `grayscale(${grayAmt.toFixed(3)}) `
                            : "") +
                        (blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : "")
                }

                const img = imgRefs.current[j]
                if (img) {
                    // drift the image for parallax, but clamp it to the overscan
                    // so the frame is always fully covered (no dark sliver at edges)
                    const maxShift = IMG_OVERSCAN * mainPx * 0.9
                    let shift =
                        parallax > 0 ? -(parallax / 100) * dist * 0.12 : 0
                    shift = clampN(shift, -maxShift, maxShift)
                    img.style.transform = vertical
                        ? `translate3d(0, ${shift.toFixed(1)}px, 0) scale(${IMG_SCALE})`
                        : `translate3d(${shift.toFixed(1)}px, 0, 0) scale(${IMG_SCALE})`
                }

                const show = titleDisplay === "always" || isHover
                const tl = titleRefs.current[j]
                if (tl) {
                    tl.style.opacity = show ? "1" : "0"
                    tl.style.transform = show
                        ? "translateY(0px)"
                        : `translateY(${hiddenY}px)`
                }
                const sb = subRefs.current[j]
                if (sb) {
                    sb.style.opacity = show ? "1" : "0"
                    sb.style.transform = show
                        ? "translateY(0px)"
                        : "translateY(12px)"
                }
            }
            frame = requestAnimationFrame(tick)
        }
        const start = () => {
            if (!frame) {
                lastFrameRef.current = performance.now()
                frame = requestAnimationFrame(tick)
            }
        }
        const stop = () => {
            if (frame) {
                cancelAnimationFrame(frame)
                frame = 0
            }
        }
        // Only animate while the strip is on-screen (saves CPU/GPU).
        const vis = rootRef.current
        let io: IntersectionObserver | null = null
        if (vis && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    if (entries.some((e) => e.isIntersecting)) start()
                    else stop()
                },
                { threshold: 0 }
            )
            io.observe(vis)
        } else {
            start()
        }
        return () => {
            stop()
            if (io) io.disconnect()
        }
    }, [
        isStatic,
        N,
        M,
        pitch,
        setSpan,
        mainPx,
        glide,
        snap,
        autoSpeed,
        focus,
        dim,
        grayscale,
        colorCenter,
        parallax,
        edgeBlur,
        edgeFade,
        titleDisplay,
        hiddenY,
        vertical,
    ])

    // ---- render --------------------------------------------------------
    const rootH =
        typeof props.height === "number" && props.height > 0
            ? props.height
            : undefined

    const onCardClick = (cell: Cell) => {
        if (isStatic) return
        if (movedRef.current) return // came from a drag
        navigate(cell.src, cell.href)
    }

    const animStyle = (hy: number): React.CSSProperties => ({
        color: titleColor,
        pointerEvents: "none",
        opacity: isStatic ? 1 : titleDisplay === "always" ? 1 : 0,
        transform:
            isStatic || titleDisplay === "always"
                ? "translateY(0px)"
                : `translateY(${hy}px)`,
        transition: "opacity 0.45s ease, transform 0.45s ease",
    })

    const topGrad: React.CSSProperties = {
        left: 0,
        right: 0,
        top: 0,
        padding: "18px 18px 48px",
        textAlign: titleAlign,
        background:
            "linear-gradient(to bottom, rgba(0,0,0,0.72), rgba(0,0,0,0))",
    }
    const bottomGrad: React.CSSProperties = {
        left: 0,
        right: 0,
        bottom: 0,
        padding: "48px 18px 18px",
        textAlign: titleAlign,
        background: "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))",
    }
    const centerStyle: React.CSSProperties = {
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems,
        textAlign: titleAlign,
        padding: 18,
        background: "rgba(0,0,0,0.28)",
    }
    const outsideStyle: React.CSSProperties = vertical
        ? {
              flex: "1 1 0",
              minWidth: 0,
              textAlign: titleAlign,
              padding: "0 10px",
          }
        : { width: "100%", textAlign: titleAlign, padding: "0 6px" }

    const titleNode = (cell: Cell) =>
        cell.title ? <div style={{ ...titleFont }}>{cell.title}</div> : null
    const subNode = (cell: Cell) =>
        cell.subtitle ? (
            <div
                style={{
                    ...subFont,
                    opacity: 0.78,
                    marginTop: 4,
                    textTransform: uppercaseSub ? "uppercase" : "none",
                }}
            >
                {cell.subtitle}
            </div>
        ) : null

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: rootH ?? "100%",
                minHeight: 320,
                overflow: "hidden",
                background,
                touchAction: vertical ? "pan-x" : "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: drag && !isStatic ? "grab" : "default",
            }}
        >
            <div
                ref={trackRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    ...(vertical ? { width: "100%" } : { height: "100%" }),
                    display: "flex",
                    flexDirection: vertical ? "column" : "row",
                    alignItems: "center",
                    gap,
                    willChange: "transform",
                }}
            >
                {Array.from({ length: M }).map((_, j) => {
                    const cell = cells[j % N]
                    const on = titleDisplay !== "off"
                    const showT =
                        on && titleFields !== "subtitle" && !!cell.title
                    const showS =
                        on && titleFields !== "title" && !!cell.subtitle

                    const isSplit = titlePosition === "split"
                    const isOutside =
                        titlePosition === "above" || titlePosition === "below"

                    let aboveEl: React.ReactNode = null
                    let belowEl: React.ReactNode = null
                    let insideEl: React.ReactNode = null
                    let splitTopEl: React.ReactNode = null
                    let splitBottomEl: React.ReactNode = null

                    if (isSplit) {
                        if (showT)
                            splitTopEl = (
                                <div
                                    ref={(el) => {
                                        titleRefs.current[j] = el
                                    }}
                                    style={{
                                        position: "absolute",
                                        ...topGrad,
                                        ...animStyle(-12),
                                    }}
                                >
                                    {titleNode(cell)}
                                </div>
                            )
                        if (showS)
                            splitBottomEl = (
                                <div
                                    ref={(el) => {
                                        subRefs.current[j] = el
                                    }}
                                    style={{
                                        position: "absolute",
                                        ...bottomGrad,
                                        ...animStyle(12),
                                    }}
                                >
                                    {subNode(cell)}
                                </div>
                            )
                    } else if (isOutside) {
                        if (showT || showS) {
                            const m = vertical
                                ? titlePosition === "above"
                                    ? { marginRight: 14 }
                                    : { marginLeft: 14 }
                                : titlePosition === "above"
                                  ? { marginBottom: 14 }
                                  : { marginTop: 14 }
                            const el = (
                                <div
                                    ref={(el2) => {
                                        titleRefs.current[j] = el2
                                    }}
                                    style={{
                                        ...animStyle(hiddenY),
                                        ...outsideStyle,
                                        ...m,
                                    }}
                                >
                                    {showT ? titleNode(cell) : null}
                                    {showS ? subNode(cell) : null}
                                </div>
                            )
                            if (titlePosition === "above") aboveEl = el
                            else belowEl = el
                        }
                    } else {
                        if (showT || showS) {
                            const posStyle =
                                titlePosition === "top"
                                    ? topGrad
                                    : titlePosition === "center"
                                      ? centerStyle
                                      : bottomGrad
                            insideEl = (
                                <div
                                    ref={(el) => {
                                        titleRefs.current[j] = el
                                    }}
                                    style={{
                                        position: "absolute",
                                        ...posStyle,
                                        ...animStyle(hiddenY),
                                    }}
                                >
                                    {showT ? titleNode(cell) : null}
                                    {showS ? subNode(cell) : null}
                                </div>
                            )
                        }
                    }

                    return (
                        <div
                            key={j}
                            ref={(el) => {
                                cardRefs.current[j] = el
                            }}
                            style={{
                                position: "relative",
                                flex: "0 0 auto",
                                ...(vertical
                                    ? { width: "100%", height: mainPx }
                                    : { width: mainPx, height: "100%" }),
                                display: "flex",
                                flexDirection: vertical ? "row" : "column",
                                alignItems: "center",
                                justifyContent: "center",
                                willChange: "transform, opacity",
                            }}
                        >
                            {aboveEl}

                            {/* the visual card (clipped) */}
                            <div
                                ref={(el) => {
                                    frameRefs.current[j] = el
                                }}
                                onPointerEnter={() => {
                                    hoverRef.current = j
                                }}
                                onPointerLeave={() => {
                                    if (hoverRef.current === j)
                                        hoverRef.current = -1
                                }}
                                onClick={() => onCardClick(cell)}
                                style={{
                                    position: "relative",
                                    flex: "0 0 auto",
                                    ...(vertical
                                        ? {
                                              width: `${crossPct}%`,
                                              height: "100%",
                                          }
                                        : {
                                              width: "100%",
                                              height: `${crossPct}%`,
                                          }),
                                    borderRadius: radius,
                                    overflow: "hidden",
                                    background: "#15151a",
                                    willChange: "filter",
                                    cursor: cell.href ? "pointer" : "inherit",
                                }}
                            >
                                <img
                                    ref={(el) => {
                                        imgRefs.current[j] = el
                                    }}
                                    src={cell.src}
                                    alt=""
                                    draggable={false}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        transform: `scale(${IMG_SCALE})`,
                                        willChange: "transform",
                                    }}
                                />
                                {insideEl}
                                {splitTopEl}
                                {splitBottomEl}
                            </div>

                            {belowEl}
                        </div>
                    )
                })}
            </div>

            {/* hidden CMS probe (rendered on canvas too so the design previews CMS) */}
            {source === "cms" && (
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
                        pointerEvents: "none",
                        overflow: "hidden",
                    }}
                >
                    {collectionSlot}
                </div>
            )}
        </div>
    )
}

EditorialStrip.displayName = "Editorial Strip"

// ---- property controls -------------------------------------------------

addPropertyControls(EditorialStrip, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["manual", "cms"],
        optionTitles: ["Manual", "CMS"],
        defaultValue: "manual",
        displaySegmentedControl: true,
        description:
            "Set the cards by hand, or pull image + title + link from a Collection List dropped in the slot below.",
    },
    items: {
        type: ControlType.Array,
        title: "Cards",
        hidden: (p: Partial<Props>) => p.source === "cms",
        description:
            "Each card is one image with a title. The row loops seamlessly.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "The card image.",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "",
                    description: "Shown on the card.",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "",
                    description: "Small line near the title.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Where the card goes when clicked.",
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
            "Drop a Collection List with an image and one or two text layers per row. Image → card, first text → title, second → subtitle. Link the row to make the card clickable.",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "Direction, size of the cards and the gaps between them.",
        controls: {
            orientation: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["horizontal", "vertical"],
                optionTitles: ["Horizontal", "Vertical"],
                defaultValue: "horizontal",
                displaySegmentedControl: true,
                description:
                    "Run the strip across or down. Vertical scrolls with the vertical wheel / drag.",
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Card Size",
                min: 80,
                max: 1600,
                step: 5,
                unit: "px",
                defaultValue: 320,
                description:
                    "Card size ALONG the scroll direction (width when horizontal, height when vertical).",
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Card Thickness",
                min: 20,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 78,
                description:
                    "Card size ACROSS the scroll direction, as a share of the section (height when horizontal, width when vertical). Leave room for outside captions.",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 200,
                step: 2,
                unit: "px",
                defaultValue: 24,
                description:
                    "Space between cards. Stays constant even as the centered card scales up.",
            },
            radius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 8,
                description: "Rounding on the card corners.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description:
            "Smooth scroll that loops forever and glides to a stop with a card centered.",
        controls: {
            wheel: {
                type: ControlType.Boolean,
                title: "Scroll to Move",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                description:
                    "Capture the wheel to move the strip. Traps page scroll while hovered.",
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                description: "Drag to scrub with a flick of momentum.",
            },
            autoSpeed: {
                type: ControlType.Number,
                title: "Auto Scroll",
                min: 0,
                max: 600,
                step: 10,
                unit: "px/s",
                defaultValue: 0,
                description:
                    "A slow continuous drift, like a marquee. Snap is ignored while this is on. 0 is off.",
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                description:
                    "After you stop, the strip glides smoothly onto the nearest card with an eased tween.",
            },
            glide: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 4,
                max: 30,
                step: 1,
                defaultValue: 14,
                description:
                    "How the scroll and snap ease. Lower is a heavier, slower glide; higher is snappier.",
            },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        description:
            "The editorial feel, tied to each card's distance from the center.",
        controls: {
            focus: {
                type: ControlType.Number,
                title: "Center Focus",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 18,
                description:
                    "How much the centered card scales up. Neighbours slide aside so the gap never closes. 0 is a flat strip.",
            },
            dim: {
                type: ControlType.Number,
                title: "Edge Dim",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 30,
                description: "How much off-center cards darken.",
            },
            grayscale: {
                type: ControlType.Number,
                title: "Grayscale",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 80,
                description:
                    "How desaturated the cards sit at rest. They go full color on hover.",
            },
            colorCenter: {
                type: ControlType.Boolean,
                title: "Color at Center",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                description:
                    "Also bring the centered card to full color, not just on hover.",
            },
            parallax: {
                type: ControlType.Number,
                title: "Inner Parallax",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 14,
                description:
                    "How far the image drifts inside its frame as the card moves across. Clamped so the frame always stays covered.",
            },
            edgeBlur: {
                type: ControlType.Number,
                title: "Edge Blur",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 6,
                description:
                    "Cards blur toward the leading/trailing edges of the section.",
            },
            edgeFade: {
                type: ControlType.Number,
                title: "Edge Fade",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 40,
                description:
                    "Cards fade out toward the edges so the strip melts into the background.",
            },
        },
    },
    title: {
        type: ControlType.Object,
        title: "Title",
        description:
            "The title/subtitle for each card. It can sit on the image or as a caption outside it.",
        controls: {
            display: {
                type: ControlType.Enum,
                title: "Show Title",
                options: ["hover", "always", "off"],
                optionTitles: ["On Hover", "Always", "Off"],
                defaultValue: "hover",
                description:
                    "Reveal the title only on hover, keep it on every card always, or hide it.",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom", "top", "center", "above", "below", "split"],
                optionTitles: [
                    "Bottom",
                    "Top",
                    "Center",
                    "Above (outside)",
                    "Below (outside)",
                    "Split: Title top / Sub bottom",
                ],
                defaultValue: "bottom",
                description:
                    "Bottom/Top/Center sit on the image. Above/Below are captions outside the card (left/right when vertical). Split puts the title at the top and the subtitle at the bottom.",
            },
            fields: {
                type: ControlType.Enum,
                title: "Show",
                options: ["both", "title", "subtitle"],
                optionTitles: [
                    "Title + Subtitle",
                    "Title Only",
                    "Subtitle Only",
                ],
                defaultValue: "both",
                description: "Which lines to show.",
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
                description: "Horizontal alignment of the text.",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#ffffff",
                description: "Text color for the title and subtitle.",
            },
            font: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 22,
                    variant: "Bold",
                    lineHeight: "1.1em",
                    letterSpacing: "-0.01em",
                },
                description:
                    "Typeface, weight, size and spacing for the title.",
            },
            subFont: {
                type: ControlType.Font,
                title: "Subtitle Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 12,
                    variant: "Medium",
                    lineHeight: "1.3em",
                    letterSpacing: "0.06em",
                },
                description: "Typeface for the subtitle line.",
            },
            uppercaseSub: {
                type: ControlType.Boolean,
                title: "Uppercase Sub",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                description: "Force the subtitle to uppercase.",
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
                defaultValue: "#0b0b0d",
                description: "Behind the strip the edge fade melts into this.",
            },
            newTab: {
                type: ControlType.Boolean,
                title: "Open in New Tab",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: false,
                description:
                    "Open links in a new tab (manual links and CMS rows without their own Framer link).",
            },
        },
    },
})
