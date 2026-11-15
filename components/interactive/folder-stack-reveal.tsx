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


// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any
// @framerIntrinsicWidth 1000
// @framerIntrinsicHeight 520
// @framerDisableUnlink

type Item = {
    type?: "image" | "chip"
    label?: string
    image?: { src: string; srcSet?: string; alt?: string } | string
    color?: string
    size?: number
    textSize?: number
    rotation?: number
    manual?: boolean
    x?: number
    y?: number
    rise?: number
}

type Props = {
    items: Item[]
    folderColor: string
    folderRadius: number
    folderWidth: number
    tabWidth: number
    tabHeight: number
    title: string
    titleFont: React.CSSProperties
    titleColor: string
    description: string
    descriptionFont: React.CSSProperties
    descriptionColor: string
    padX: number
    padBottom: number
    tileRadius: number
    tileBackground: string
    itemShadow: string
    chipFont: React.CSSProperties
    chipTextColor: string
    trigger: "hover" | "click"
    spreadHeight: number
    spreadWidth: number
    tileLayout: "pile" | "around"
    arcAngle: number
    scatter: number
    hoverTilt: number
    stagger: number
    autoScale: boolean
    tabletScale: number
    phoneScale: number
    tabletMaxWidth: number
    phoneMaxWidth: number
    canvasDevice: "desktop" | "tablet" | "phone"
    previewOpen: boolean
    ariaLabel: string
    style?: React.CSSProperties
}

const PALETTE = [
    "#D9F5D6",
    "#FFF2C9",
    "#E9E2FB",
    "#FDEBDD",
    "#D9E7FD",
    "#FBE0F4",
    "#DFF6FD",
]

// The folder outline: a raised tab on the left that steps down to the body.
// Drawn from the real pixel size, so the corners stay perfectly round at any width.
function folderPath(
    w: number,
    h: number,
    tabW: number,
    tabH: number,
    r: number
) {
    const rr = Math.max(0, Math.min(r, tabH, h / 2, w / 4))
    const tw = Math.max(rr * 2 + 20, Math.min(tabW, w - rr * 2 - 20))
    const c = Math.max(8, Math.min(tabH * 0.9, (w - tw) / 2))
    const yb = tabH
    return [
        `M 0 ${rr}`,
        `A ${rr} ${rr} 0 0 1 ${rr} 0`,
        `L ${tw - c} 0`,
        `C ${tw} 0 ${tw} ${yb} ${tw + c} ${yb}`,
        `L ${w - rr} ${yb}`,
        `A ${rr} ${rr} 0 0 1 ${w} ${yb + rr}`,
        `L ${w} ${h - rr}`,
        `A ${rr} ${rr} 0 0 1 ${w - rr} ${h}`,
        `L ${rr} ${h}`,
        `A ${rr} ${rr} 0 0 1 0 ${h - rr}`,
        "Z",
    ].join(" ")
}

const px = (v: any, fallback: number) => {
    const n = parseFloat(String(v))
    return isNaN(n) ? fallback : n
}

/**
 * Folder Stack
 * A folder with a title and description. Items peek out of it, and on hover or click
 * they spread out all around it (except underneath).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function FolderStack(props: Props) {
    const {
        items,
        folderColor,
        folderRadius,
        folderWidth,
        tabWidth,
        tabHeight,
        title,
        titleFont,
        titleColor,
        description,
        descriptionFont,
        descriptionColor,
        padX,
        padBottom,
        tileRadius,
        tileBackground,
        itemShadow,
        chipFont,
        chipTextColor,
        trigger,
        spreadHeight,
        spreadWidth,
        tileLayout,
        arcAngle,
        scatter,
        hoverTilt,
        stagger,
        autoScale,
        tabletScale,
        phoneScale,
        tabletMaxWidth,
        phoneMaxWidth,
        canvasDevice,
        previewOpen,
        ariaLabel,
        style,
    } = props

    const list = items || []
    const n = list.length

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const reduced =
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const animate = !isCanvas && !isStatic && !reduced

    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const cls = "fs" + uid

    const rootRef = React.useRef<HTMLDivElement>(null)
    const folderRef = React.useRef<HTMLDivElement>(null)
    const [dims, setDims] = React.useState({
        rw: 1000,
        rh: 520,
        fw: 414,
        fh: 170,
    })
    const [open, setOpen] = React.useState(false)

    // Real chip sizes (text width varies a lot, so guessing causes overlaps)
    const chipRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const [chipSizes, setChipSizes] = React.useState<
        Record<number, { w: number; h: number }>
    >({})
    const typeKey = list.map((t) => t.type || "image").join(",")

    // Measure the frame and the folder: the outline and the item positions use real pixels
    React.useLayoutEffect(() => {
        const root = rootRef.current
        const folder = folderRef.current
        if (!root || !folder) return
        const update = () => {
            const next = {
                rw: Math.round(root.clientWidth) || 1000,
                rh: Math.round(root.clientHeight) || 520,
                fw: Math.round(folder.clientWidth) || 414,
                fh: Math.round(folder.clientHeight) || 170,
            }
            setDims((d) =>
                d.rw === next.rw &&
                d.rh === next.rh &&
                d.fw === next.fw &&
                d.fh === next.fh
                    ? d
                    : next
            )
            const sizes: Record<number, { w: number; h: number }> = {}
            chipRefs.current.forEach((el, i) => {
                if (el) sizes[i] = { w: el.offsetWidth, h: el.offsetHeight }
            })
            setChipSizes((prev) =>
                JSON.stringify(prev) === JSON.stringify(sizes) ? prev : sizes
            )
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(root)
        ro.observe(folder)
        chipRefs.current.forEach((el) => el && ro.observe(el))
        return () => ro.disconnect()
    }, [n, typeKey])

    // Screen size (tablet / phone) and touch-only devices
    const [narrow, setNarrow] = React.useState(false)
    const [phone, setPhone] = React.useState(false)
    const [noHover, setNoHover] = React.useState(false)
    React.useEffect(() => {
        if (!window.matchMedia) return
        const a = window.matchMedia(`(max-width: ${tabletMaxWidth}px)`)
        const p = window.matchMedia(`(max-width: ${phoneMaxWidth}px)`)
        const b = window.matchMedia("(hover: none)")
        const update = () => {
            setNarrow(a.matches)
            setPhone(p.matches)
            setNoHover(b.matches)
        }
        update()
        a.addEventListener("change", update)
        p.addEventListener("change", update)
        b.addEventListener("change", update)
        return () => {
            a.removeEventListener("change", update)
            p.removeEventListener("change", update)
            b.removeEventListener("change", update)
        }
    }, [tabletMaxWidth, phoneMaxWidth])

    // Tablet, phone and touch devices always use tap; on desktop it is the Trigger setting
    const clickMode = !isCanvas && (trigger === "click" || narrow || noHover)

    // Tap outside / Escape closes
    React.useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        const onDown = (e: PointerEvent) => {
            if (!clickMode) return
            if (rootRef.current && !rootRef.current.contains(e.target as Node))
                setOpen(false)
        }
        document.addEventListener("keydown", onKey)
        document.addEventListener("pointerdown", onDown)
        return () => {
            document.removeEventListener("keydown", onKey)
            document.removeEventListener("pointerdown", onDown)
        }
    }, [open, clickMode])

    const show = isCanvas ? previewOpen : open

    // Items scale on tablet / phone (the folder text keeps your font sizes)
    const k = !autoScale
        ? 1
        : isCanvas
          ? canvasDevice === "tablet"
              ? tabletScale
              : canvasDevice === "phone"
                ? phoneScale
                : 1
          : phone
            ? phoneScale
            : narrow
              ? tabletScale
              : 1

    const css = `.${cls}:focus-visible,.${cls} [data-fs-folder]:focus-visible{outline:2px solid #0A84FF;outline-offset:4px;border-radius:16px}`

    const { rw, rh, fw, fh } = dims
    const tabPct = Math.max(10, Math.min(90, tabWidth))
    const path = folderPath(
        fw,
        fh,
        (fw * tabPct) / 100,
        tabHeight,
        folderRadius
    )

    // Geometry (all in pixels, from the frame's top-left)
    const cx = rw / 2
    const folderTop = rh - fh
    const folderLeft = cx - fw / 2
    const cy = rh - fh / 2 // folder centre
    // How wide items may spread, centred on the folder. Never wider than the frame.
    const sw = Math.min(rw, Math.max(60, (spreadWidth ?? 620) * k))

    const isChipItem = (t: Item) => (t.type || "image") === "chip"
    const hasManualOpen = (t: Item) =>
        !!t.manual && typeof t.x === "number" && typeof t.y === "number"
    const chipFs = (t: Item) =>
        (chipFont && chipFont.fontSize
            ? px(chipFont.fontSize, 18)
            : t.textSize || 18) * k
    const chipSize = (t: Item, i: number) => {
        const m = chipSizes[i]
        if (m && m.w > 0) return m
        const fs = chipFs(t)
        return {
            w: (t.label || "").length * fs * 0.55 + 32 * k,
            h: fs * 1.35 + 16 * k,
        }
    }

    // Text chips: stacked in centred rows above the folder (widest row at the
    // bottom, narrowing upwards), using their real widths so they never overlap.
    const chipOpen: Record<number, { x: number; y: number }> = {}
    {
        const chips = list
            .map((t, i) => ({ t, i }))
            .filter(({ t }) => isChipItem(t) && !hasManualOpen(t))
            .map(({ t, i }) => ({ i, ...chipSize(t, i) }))
        if (chips.length) {
            const gapX = 14 * k
            const widest = Math.max(...chips.map((c) => c.w))
            const rowH = Math.max(...chips.map((c) => c.h))
            const maxW = Math.max(widest, rw - 32)
            const avail = folderTop - 16
            const build = (base: number) => {
                const rows: (typeof chips)[] = []
                let cur: typeof chips = []
                let curW = 0
                for (const c of chips) {
                    const cap = Math.max(
                        widest,
                        base * Math.pow(0.8, rows.length)
                    )
                    const need = cur.length ? curW + gapX + c.w : c.w
                    if (cur.length && need > cap) {
                        rows.push(cur)
                        cur = [c]
                        curW = c.w
                    } else {
                        cur.push(c)
                        curW = need
                    }
                }
                rows.push(cur)
                return rows
            }
            let base = Math.min(maxW, Math.max(sw, widest))
            let rows = build(base)
            // Not enough height: use wider rows (fewer of them)
            while (rows.length * (rowH + 8) > avail && base < maxW) {
                base = Math.min(maxW, base * 1.15)
                rows = build(base)
            }
            let pitch = Math.min(
                rowH + 26 * k,
                Math.max(rowH + 4, avail / rows.length)
            )
            // Spare height: rows open up a little and the chips lift off the folder
            const spare = Math.max(0, avail - 20 * k - rows.length * pitch)
            const gain =
                rows.length > 1
                    ? Math.min(14 * k * (rows.length - 1), spare * 0.6)
                    : 0
            if (rows.length > 1) pitch += gain / (rows.length - 1)
            const lift = (spare - gain) * 0.4
            rows.forEach((row, r) => {
                const rowW =
                    row.reduce((a, c) => a + c.w, 0) + gapX * (row.length - 1)
                let x = cx - rowW / 2
                row.forEach((c) => {
                    const jitter = (((c.i * 53) % 3) - 1) * 4 * k
                    const y =
                        folderTop -
                        20 * k -
                        lift -
                        rowH / 2 -
                        r * pitch +
                        jitter
                    chipOpen[c.i] = {
                        x: x + c.w / 2,
                        y: Math.max(c.h / 2 + 8, y),
                    }
                    x += c.w + gapX
                })
            })
        }
    }

    // Image tiles keep the arc layout, spaced among themselves
    const imageIdx = list
        .map((t, i) => (isChipItem(t) || hasManualOpen(t) ? -1 : i))
        .filter((i) => i >= 0)

    // Image tiles: either a messy pile on top of the folder (default), or spread
    // around the folder ("around": an arch, scattered a little, never touching).
    const imageOpen: Record<number, { x: number; y: number }> = {}
    {
        const imgs = imageIdx.map((i) => ({
            i,
            s: Math.max(24, list[i].size || 100) * k,
        }))
        const ni = imgs.length
        if (ni && tileLayout !== "around") {
            // PILE: a loose, slightly overlapping cluster sitting on top of the
            // folder. Staggered rows, widest in the middle, each tile nudged by a
            // fixed pseudo-random amount.
            const sMax = Math.max(...imgs.map((c) => c.s))
            const sc = Math.max(0, Math.min(1, scatter ?? 0.6))
            const pitchX = sMax * 1.08
            let pitchY = sMax * 0.92
            const maxCols = Math.max(
                1,
                Math.floor((rw - 16 - sMax) / pitchX) + 1
            )
            const avail = folderTop - 8 + sMax * 0.08
            // as many columns as fit in the spread width
            let cols = Math.min(
                maxCols,
                Math.max(1, Math.floor((sw - sMax) / pitchX) + 1)
            )
            let R = Math.ceil(ni / cols)
            const pileH = (rows: number) => (rows - 1) * pitchY + sMax
            // not enough height: fewer, wider rows; then squeeze the rows together
            while (pileH(R) > avail && cols < maxCols) {
                cols++
                R = Math.ceil(ni / cols)
            }
            if (R > 1 && pileH(R) > avail)
                pitchY = Math.max(sMax * 0.45, (avail - sMax) / (R - 1))
            // Spare height above the folder (Spread height / a taller frame):
            // the rows open up a little and the whole pile lifts off the folder.
            const spare = Math.max(0, folderTop - 8 - pileH(R))
            const gain = R > 1 ? Math.min(0.4 * sMax * (R - 1), spare * 0.6) : 0
            if (R > 1) pitchY += gain / (R - 1)
            const lift = (spare - gain) * 0.4

            const counts: number[] = new Array(R).fill(Math.floor(ni / R))
            const mid = Math.floor(R / 2)
            const fillOrder = [mid]
            for (let d = 1; fillOrder.length < R; d++) {
                if (mid + d < R) fillOrder.push(mid + d)
                if (mid - d >= 0) fillOrder.push(mid - d)
            }
            const extra = ni % R
            fillOrder.slice(0, extra).forEach((r) => counts[r]++)
            if (
                extra === 0 &&
                R >= 3 &&
                counts[0] >= 2 &&
                counts[mid] < maxCols
            ) {
                counts[0]--
                counts[mid]++
            }

            const rnd = (i: number, salt: number) => {
                const v =
                    Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453
                return v - Math.floor(v)
            }
            const bottomY = folderTop - sMax * 0.42 - lift
            const halfSpan = Math.max(
                pitchX / 2,
                ((Math.max(...counts) - 1) / 2) * pitchX
            )
            let j = 0
            counts.forEach((cnt, r) => {
                const sameParity =
                    (r > 0 && (counts[r - 1] - cnt) % 2 === 0) ||
                    (r < R - 1 && (counts[r + 1] - cnt) % 2 === 0)
                const shift = sameParity ? (r % 2 ? 0.25 : -0.25) * pitchX : 0
                for (let c = 0; c < cnt; c++, j++) {
                    const z = imgs[j].s
                    const x0 = cx + (c - (cnt - 1) / 2) * pitchX + shift
                    // 0 in the middle of the pile, 1 at its outer edges
                    const edge = Math.min(1, Math.abs(x0 - cx) / halfSpan)
                    let x = x0 + (rnd(j, 1) * 2 - 1) * sc * 0.2 * sMax
                    let y =
                        bottomY -
                        (R - 1 - r) * pitchY +
                        // outer tiles droop down towards the folder's sides
                        edge * edge * 0.45 * sMax +
                        // neighbours alternate up / down by an uneven amount
                        (c % 2 ? -1 : 1) *
                            (0.5 + 0.5 * rnd(j, 2)) *
                            sc *
                            0.25 *
                            sMax
                    // the middle of the top row pokes up
                    if (r === 0 && R > 1) y -= 0.18 * sMax * (1 - edge * edge)

                    const loX = z / 2 + 8
                    const hiX = Math.max(loX, rw - z / 2 - 8)
                    // Dropped low enough to hide behind the folder: slide it out
                    // beside the folder if that is close, otherwise keep it above.
                    if (y + z / 2 > folderTop + 0.25 * z) {
                        const clear = fw / 2 + z / 2 + 6
                        const dx = clear - Math.abs(x - cx)
                        if (dx > 0) {
                            if (dx <= 0.6 * z && cx + clear <= hiX)
                                x = cx + (x < cx ? -1 : 1) * clear
                            else y = folderTop + 0.25 * z - z / 2
                        }
                    }
                    imageOpen[imgs[j].i] = {
                        x: Math.min(Math.max(x, loX), hiX),
                        y: Math.min(Math.max(y, z / 2 + 8), rh - z / 2 - 8),
                    }
                }
            })
        } else if (ni) {
            const arc = Math.max(40, Math.min(100, arcAngle || 88))
            const toRad = Math.PI / 180
            const margin = 16
            const radii = (sz: number, f: number) => {
                // The frame always wins: on narrow screens there is no room beside
                // the folder, so the arch shrinks and tiles move above it instead.
                const rxMax = Math.max(sz / 2, sw / 2 - sz / 2 - margin)
                const ryMax = Math.max(sz / 2, cy - sz / 2 - margin)
                const rxMin = Math.min(fw / 2 + sz / 2 + 14, rxMax)
                const ryMin = Math.min(fh / 2 + sz / 2 + 14, ryMax)
                return {
                    rx: rxMin + f * (rxMax - rxMin),
                    ry: ryMin + f * (ryMax - ryMin),
                }
            }
            // Keep a tile inside the frame and off the folder. Beside the folder is
            // only allowed when it fits in the frame; otherwise the tile goes above.
            const clampPt = (pt: { x: number; y: number }, z: number) => {
                const loX = Math.min(cx, cx - sw / 2 + z / 2 + 8)
                const hiX = Math.max(cx, cx + sw / 2 - z / 2 - 8)
                pt.x = Math.min(Math.max(pt.x, loX), hiX)
                pt.y = Math.min(Math.max(pt.y, z / 2 + 8), rh - z / 2 - 8)
                const halfW = fw / 2 + z / 2 + 14
                if (
                    Math.abs(pt.y - cy) < fh / 2 + z / 2 + 10 &&
                    Math.abs(pt.x - cx) < halfW
                ) {
                    const up = pt.y - (cy - fh / 2 - z / 2 - 10)
                    const sideX = cx + (pt.x < cx ? -1 : 1) * halfW
                    const sideFits = sideX >= loX && sideX <= hiX
                    if (sideFits && halfW - Math.abs(pt.x - cx) <= up)
                        pt.x = sideX
                    else pt.y -= up
                }
            }
            const finish = (pts: { x: number; y: number }[]) => {
                pts.forEach((pt, j) => clampPt(pt, imgs[j].s))
                let gap = Infinity
                for (let a = 0; a < ni; a++)
                    for (let b = 0; b < a; b++)
                        gap = Math.min(
                            gap,
                            Math.hypot(
                                pts[a].x - pts[b].x,
                                pts[a].y - pts[b].y
                            ) -
                                (imgs[a].s + imgs[b].s) / 2
                        )
                return { pts, gap }
            }
            const sMax = Math.max(...imgs.map((c) => c.s))
            const single = (f: number) => {
                const { rx, ry } = radii(sMax, f)
                const N = 240
                const P: { x: number; y: number }[] = []
                const L: number[] = [0]
                for (let j = 0; j <= N; j++) {
                    const a = (-arc + (2 * arc * j) / N) * toRad
                    P.push({
                        x: cx + Math.sin(a) * rx,
                        y: cy - Math.cos(a) * ry,
                    })
                    if (j)
                        L.push(
                            L[j - 1] +
                                Math.hypot(
                                    P[j].x - P[j - 1].x,
                                    P[j].y - P[j - 1].y
                                )
                        )
                }
                return finish(
                    imgs.map((_, ii) => {
                        const target = (L[N] * (ii + 0.5)) / ni
                        let j = 0
                        while (j < N && L[j] < target) j++
                        return { x: P[j].x, y: P[j].y }
                    })
                )
            }
            // 1. Start from the tightest arch where tiles do not touch
            const need = 12 * k
            let base = single(1)
            for (const f of [0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
                base = single(f)
                if (base.gap >= need) break
            }
            const pts = base.pts

            // 2. Scatter: nudge tiles in and out of the arch (alternating, by a
            //    fixed pseudo-random amount, so the layout is the same every time),
            //    then push apart anything that touches.
            const sc = Math.max(0, Math.min(1, scatter ?? 0.6))
            if (sc > 0 && ni > 1) {
                const rnd = (i: number, salt: number) => {
                    const v =
                        Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453
                    return v - Math.floor(v)
                }
                pts.forEach((pt, j) => {
                    const dx = pt.x - cx
                    const dy = pt.y - cy
                    const d = Math.hypot(dx, dy) || 1
                    const ux = dx / d
                    const uy = dy / d
                    const r =
                        (j % 2 ? 1 : -1) *
                        (0.45 + 0.55 * rnd(j, 1)) *
                        sc *
                        0.55 *
                        sMax
                    const t = (rnd(j, 2) * 2 - 1) * sc * 0.25 * sMax
                    pt.x += ux * r - uy * t
                    pt.y += uy * r + ux * t
                })
            }
            if (ni > 1) {
                const clamp = () =>
                    pts.forEach((pt, j) => clampPt(pt, imgs[j].s))
                // neighbours never end up on one line: each tile sits clearly
                // higher than the one before it, on both sides
                const step = (a: number, b: number) => {
                    const lim = pts[a].y - 0.3 * sMax
                    if (pts[b].y > lim) pts[b].y = lim
                }
                for (let it = 0; it < 60; it++) {
                    clamp()
                    if (sc > 0) {
                        for (let j = 1; j < Math.ceil(ni / 2); j++)
                            step(j - 1, j)
                        for (let j = ni - 2; j >= Math.floor(ni / 2); j--)
                            step(j + 1, j)
                    }
                    for (let a = 0; a < ni; a++)
                        for (let b = 0; b < a; b++) {
                            const dx = pts[a].x - pts[b].x
                            const dy = pts[a].y - pts[b].y
                            const d = Math.hypot(dx, dy) || 1
                            const min = (imgs[a].s + imgs[b].s) / 2 + need
                            if (d < min) {
                                const m = (min - d) / 2
                                pts[a].x += (dx / d) * m
                                pts[a].y += (dy / d) * m
                                pts[b].x -= (dx / d) * m
                                pts[b].y -= (dy / d) * m
                            }
                        }
                }
                clamp()
            }
            pts.forEach((pt, j) => {
                imageOpen[imgs[j].i] = pt
            })
        }
    }

    const resolved = list.map((t, i) => {
        const isChip = isChipItem(t)
        const size = Math.max(24, t.size || 100) * k
        const fs = chipFs(t)
        const cs = isChip ? chipSize(t, i) : null
        const w = cs ? cs.w : size
        const h = cs ? cs.h : size
        const manual = !!t.manual
        const rot0 =
            manual && typeof t.rotation === "number"
                ? t.rotation
                : (((i * 37) % 9) - 4) * 4

        // Closed: sitting behind the folder, peeking out of its top edge
        const xPct =
            manual && typeof t.x === "number"
                ? t.x
                : 9 + (82 * (i + 0.5)) / Math.max(1, n)
        const frac = 0.35 + ((i * 47) % 5) * 0.1
        const peek =
            manual && typeof t.rise === "number"
                ? Math.min(t.rise * k, h)
                : frac * h
        const edge = xPct > tabPct ? tabHeight : 0
        const closedX = folderLeft + (xPct / 100) * fw
        const closedY = folderTop + edge - peek + h / 2

        // Open: fanned out around the folder, never underneath it
        let openX: number
        let openY: number
        if (manual && typeof t.x === "number" && typeof t.y === "number") {
            openX = (t.x / 100) * rw
            openY = (t.y / 100) * rh
        } else if (isChip && chipOpen[i]) {
            openX = chipOpen[i].x
            openY = chipOpen[i].y
        } else {
            const o = imageOpen[i] || { x: cx, y: cy - fh }
            openX = o.x
            openY = o.y
        }

        return { t, i, isChip, size, fs, closedX, closedY, openX, openY, rot0 }
    })

    return (
        <div
            ref={rootRef}
            className={cls}
            role="group"
            aria-label={ariaLabel || title}
            style={{
                ...style,
                position: "relative",
                overflow: "visible",
                minHeight: `${Math.round(fh + spreadHeight * k)}px`,
            }}
        >
            <style>{css}</style>

            {/* Items sit behind the folder and spread out around it */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            >
                {resolved.map(
                    ({
                        t,
                        i,
                        isChip,
                        size,
                        fs,
                        closedX,
                        closedY,
                        openX,
                        openY,
                        rot0,
                    }) => {
                        const color = t.color || PALETTE[i % PALETTE.length]
                        const label = t.label || ""
                        const src =
                            typeof t.image === "string" ? t.image : t.image?.src
                        const srcSet =
                            typeof t.image === "string"
                                ? undefined
                                : t.image?.srcSet
                        const x = show ? openX : closedX
                        const y = show ? openY : closedY
                        const rot = show ? rot0 * hoverTilt : rot0
                        const delay = animate ? i * stagger : 0

                        const common: React.CSSProperties = {
                            position: "absolute",
                            left: 0,
                            top: 0,
                            transform: `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -50%) rotate(${rot}deg)`,
                            transition: animate
                                ? `transform 650ms cubic-bezier(0.34, 1.25, 0.5, 1) ${delay}ms`
                                : "none",
                            willChange: "transform",
                            boxShadow: itemShadow,
                        }

                        if (isChip) {
                            return (
                                <div
                                    key={i}
                                    ref={(el) => {
                                        chipRefs.current[i] = el
                                    }}
                                    style={{
                                        ...common,
                                        padding: `${8 * k}px ${16 * k}px`,
                                        borderRadius: 999,
                                        background: color,
                                        color: chipTextColor,
                                        whiteSpace: "nowrap",
                                        ...(chipFont || {}),
                                        fontSize: fs,
                                    }}
                                >
                                    {label}
                                </div>
                            )
                        }
                        return (
                            <div
                                key={i}
                                style={{
                                    ...common,
                                    width: size,
                                    height: size,
                                    borderRadius: `${tileRadius}%`,
                                    background: tileBackground,
                                    overflow: "hidden",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#999",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: 12,
                                }}
                            >
                                {src ? (
                                    <img
                                        src={src}
                                        srcSet={srcSet}
                                        alt={label}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : (
                                    label || "Image"
                                )}
                            </div>
                        )
                    }
                )}
            </div>

            {/* The folder, centred at the bottom of the frame */}
            <div
                ref={folderRef}
                data-fs-folder=""
                tabIndex={0}
                aria-expanded={show}
                onClick={() => {
                    if (clickMode) setOpen((o) => !o)
                }}
                onPointerEnter={(e) => {
                    if (!clickMode && e.pointerType !== "touch") setOpen(true)
                }}
                onPointerLeave={(e) => {
                    if (!clickMode && e.pointerType !== "touch") setOpen(false)
                }}
                onFocus={() => {
                    if (!clickMode) setOpen(true)
                }}
                onBlur={() => {
                    if (!clickMode) setOpen(false)
                }}
                onKeyDown={(e) => {
                    if (clickMode && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault()
                        setOpen((o) => !o)
                    }
                }}
                style={{
                    position: "absolute",
                    left: "50%",
                    bottom: 0,
                    transform: "translateX(-50%)",
                    zIndex: 2,
                    width: `min(${folderWidth}px, 100%)`,
                    boxSizing: "border-box",
                    paddingLeft: padX,
                    paddingRight: padX,
                    paddingBottom: padBottom,
                    cursor: "pointer",
                    outline: "none",
                }}
            >
                <svg
                    width={fw}
                    height={fh}
                    viewBox={`0 0 ${fw} ${fh}`}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        display: "block",
                        pointerEvents: "none",
                    }}
                >
                    <path d={path} fill={folderColor} />
                </svg>

                {/* Title (inside the raised tab) and description */}
                <div style={{ position: "relative" }}>
                    <div
                        style={{
                            height: tabHeight,
                            maxWidth: `calc(${tabPct}% - ${padX}px)`,
                            display: "flex",
                            alignItems: "center",
                            overflow: "hidden",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: titleColor,
                                ...(titleFont || {}),
                            }}
                        >
                            {title}
                        </p>
                    </div>
                    <p
                        style={{
                            margin: 0,
                            marginTop: 24,
                            color: descriptionColor,
                            ...(descriptionFont || {}),
                        }}
                    >
                        {description}
                    </p>
                </div>
            </div>
        </div>
    )
}

FolderStack.defaultProps = {
    items: [
        { type: "chip", label: "Research" },
        { type: "chip", label: "Wireframes" },
        { type: "chip", label: "Prototypes" },
        { type: "chip", label: "Strategy" },
        { type: "chip", label: "Testing" },
        { type: "chip", label: "Systems" },
        { type: "chip", label: "Flows" },
    ],
    folderColor: "#FDDAC4",
    folderRadius: 24,
    folderWidth: 414,
    tabWidth: 52,
    tabHeight: 48,
    title: "Folder title",
    titleColor: "#1A1A1A",
    description: "A short description of what is inside this folder.",
    descriptionColor: "#555555",
    padX: 24,
    padBottom: 28,
    tileRadius: 27,
    tileBackground: "#FFFFFF",
    itemShadow: "none",
    chipTextColor: "#1A1A1A",
    trigger: "hover",
    spreadHeight: 380,
    spreadWidth: 620,
    tileLayout: "pile",
    arcAngle: 88,
    scatter: 0.6,
    hoverTilt: 1,
    stagger: 35,
    autoScale: true,
    tabletScale: 0.8,
    phoneScale: 0.6,
    tabletMaxWidth: 1199,
    phoneMaxWidth: 809,
    canvasDevice: "desktop",
    previewOpen: false,
    ariaLabel: "",
}

addPropertyControls(FolderStack, {
    title: { type: ControlType.String, title: "Title" },
    titleFont: {
        type: ControlType.Font,
        title: "Title font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "30px",
        defaultFontWeight: 700,
    },
    titleColor: { type: ControlType.Color, title: "Title color" },
    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Text font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "17px",
    },
    descriptionColor: { type: ControlType.Color, title: "Text color" },
    folderColor: { type: ControlType.Color, title: "Folder color" },
    folderWidth: {
        type: ControlType.Number,
        title: "Folder width",
        min: 160,
        max: 900,
        step: 2,
        unit: "px",
        description:
            "The folder is centered at the bottom; the rest of the frame is where items spread.",
    },
    folderRadius: {
        type: ControlType.Number,
        title: "Corner radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    tabWidth: {
        type: ControlType.Number,
        title: "Tab width",
        min: 20,
        max: 80,
        step: 1,
        unit: "%",
    },
    tabHeight: {
        type: ControlType.Number,
        title: "Tab height",
        min: 24,
        max: 100,
        step: 1,
        unit: "px",
        description:
            "The title row. The tab rises by this much above the body.",
    },
    padX: {
        type: ControlType.Number,
        title: "Side padding",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    padBottom: {
        type: ControlType.Number,
        title: "Bottom padding",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 16,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "chip"],
                    optionTitles: ["Image tile", "Text chip"],
                    displaySegmentedControl: true,
                    defaultValue: "chip",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    description:
                        "Chip text, or the image's description for screen readers.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) => p.type === "chip",
                },
                size: {
                    type: ControlType.Number,
                    title: "Size",
                    defaultValue: 100,
                    min: 24,
                    max: 300,
                    step: 2,
                    unit: "px",
                    hidden: (p: any) => p.type === "chip",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    hidden: (p: any) => p.type !== "chip",
                },
                textSize: {
                    type: ControlType.Number,
                    title: "Text size",
                    defaultValue: 18,
                    min: 10,
                    max: 48,
                    step: 1,
                    unit: "px",
                    hidden: (p: any) => p.type !== "chip",
                },
                manual: {
                    type: ControlType.Boolean,
                    title: "Position",
                    enabledTitle: "Manual",
                    disabledTitle: "Auto",
                    defaultValue: false,
                },
                x: {
                    type: ControlType.Number,
                    title: "X",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    description:
                        "Where it ends up when open, as a % of the frame width.",
                    hidden: (p: any) => !p.manual,
                },
                y: {
                    type: ControlType.Number,
                    title: "Y",
                    defaultValue: 30,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    description:
                        "Where it ends up when open, as a % of the frame height.",
                    hidden: (p: any) => !p.manual,
                },
                rise: {
                    type: ControlType.Number,
                    title: "Peek height",
                    defaultValue: 30,
                    min: 0,
                    max: 300,
                    step: 2,
                    unit: "px",
                    description: "How much shows above the folder when closed.",
                    hidden: (p: any) => !p.manual,
                },
                rotation: {
                    type: ControlType.Number,
                    title: "Tilt",
                    defaultValue: 0,
                    min: -45,
                    max: 45,
                    step: 1,
                    unit: "°",
                    hidden: (p: any) => !p.manual,
                },
            },
        },
    },
    tileRadius: {
        type: ControlType.Number,
        title: "Tile roundness",
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
        description: "50 = circles.",
    },
    tileBackground: { type: ControlType.Color, title: "Tile fill" },
    chipFont: {
        type: ControlType.Font,
        title: "Chip font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    chipTextColor: { type: ControlType.Color, title: "Chip text" },
    itemShadow: { type: ControlType.BoxShadow, title: "Item shadow" },
    trigger: {
        type: ControlType.Enum,
        title: "Open on",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        displaySegmentedControl: true,
        description: "Tablet, phone and touch screens always use tap.",
    },
    spreadHeight: {
        type: ControlType.Number,
        title: "Spread height",
        min: 120,
        max: 1000,
        step: 10,
        unit: "px",
        description:
            "Space above the folder. More height lifts the items further off the folder.",
    },
    spreadWidth: {
        type: ControlType.Number,
        title: "Spread width",
        min: 100,
        max: 2000,
        step: 10,
        unit: "px",
        description:
            "How wide items spread, centered on the folder. Narrower = taller stack. Never wider than the frame.",
    },
    tileLayout: {
        type: ControlType.Enum,
        title: "Tile layout",
        options: ["pile", "around"],
        optionTitles: ["Pile", "Around"],
        displaySegmentedControl: true,
        description:
            "Image tiles only. Pile = a messy stack on top of the folder. Around = spread around the folder.",
    },
    arcAngle: {
        type: ControlType.Number,
        title: "Arc",
        hidden: (p: any) => p.tileLayout !== "around",
        min: 40,
        max: 100,
        step: 1,
        unit: "°",
        description:
            "Image tiles only. Lower = the side tiles sit higher. 100 = level with the folder.",
    },
    scatter: {
        type: ControlType.Number,
        title: "Scatter",
        min: 0,
        max: 1,
        step: 0.05,
        description: "Image tiles only. 0 = tidy, 1 = most irregular.",
    },
    hoverTilt: {
        type: ControlType.Number,
        title: "Tilt when open",
        min: 0,
        max: 2,
        step: 0.1,
        description: "1 = keeps its tilt, 0 = straightens up.",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 200,
        step: 5,
        unit: "ms",
    },
    autoScale: {
        type: ControlType.Boolean,
        title: "Shrink items",
        defaultValue: true,
    },
    tabletScale: {
        type: ControlType.Number,
        title: "Tablet scale",
        min: 0.2,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !p.autoScale,
    },
    phoneScale: {
        type: ControlType.Number,
        title: "Phone scale",
        min: 0.2,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !p.autoScale,
    },
    tabletMaxWidth: {
        type: ControlType.Number,
        title: "Tablet max W",
        min: 400,
        max: 2000,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.autoScale,
    },
    phoneMaxWidth: {
        type: ControlType.Number,
        title: "Phone max W",
        min: 300,
        max: 1200,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.autoScale,
    },
    canvasDevice: {
        type: ControlType.Enum,
        title: "Canvas preview",
        options: ["desktop", "tablet", "phone"],
        optionTitles: ["Desktop", "Tablet", "Phone"],
        displaySegmentedControl: true,
        description: "Shows the scaled size on the canvas only.",
        hidden: (p: any) => !p.autoScale,
    },
    previewOpen: {
        type: ControlType.Boolean,
        title: "Show open on canvas",
        defaultValue: false,
        description:
            "Previews the spread-out state on the canvas. No effect on the live site.",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Accessible label",
        description: "Optional. Defaults to the title.",
    },
})
