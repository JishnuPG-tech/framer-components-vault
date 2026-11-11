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


type FitMode = "square" | "original"
type Item = { image?: string | { src?: string }; href?: string }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function normalizeImage(v: any): string | null {
    if (!v) return null
    if (typeof v === "string") return v
    if (typeof v?.src === "string") return v.src
    return null
}
function normalizeHref(h: any): string | null {
    if (!h || typeof h !== "string") return null
    const s = h.trim()
    if (!s) return null
    if (s.startsWith("http://") || s.startsWith("https://")) return s
    return s.startsWith("/") ? s : `/${s}`
}

const isSafari = () => {
    if (typeof navigator === "undefined") return false
    const ua = navigator.userAgent
    return /^((?!chrome|android).)*safari/i.test(ua)
}
const roundToDpr = (v: number) => {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    return Math.round(v * dpr) / dpr
}

function hiDpiSrc(src: string, itemSize: number, magnify: number) {
    if (!src) return src
    if (!isSafari()) return src
    if (src.startsWith("data:") || src.startsWith("blob:")) return src

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    const maxScale = clamp(1 + magnify, 1, 2.2)
    const targetW = Math.round(itemSize * maxScale * dpr * 2) // extra x2 for Safari
    const quality = 90

    try {
        const base =
            typeof window !== "undefined"
                ? window.location.href
                : "https://example.com"
        const url = new URL(src, base)
        url.searchParams.set("w", String(targetW))
        url.searchParams.set("width", String(targetW))
        url.searchParams.set("dpr", String(Math.min(3, Math.ceil(dpr))))
        url.searchParams.set("q", String(quality))
        url.searchParams.set("quality", String(quality))
        return url.toString()
    } catch {
        const sep = src.includes("?") ? "&" : "?"
        return `${src}${sep}w=${targetW}&dpr=${Math.min(3, Math.ceil(dpr))}&q=${quality}`
    }
}

function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
function mod(n: number, m: number) {
    return ((n % m) + m) % m
}

// Stable string hash for seeding based on loaded images
function hashString(s: string) {
    let h = 2166136261 >>> 0
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

/**
 * Build a repeating tile that tries to avoid immediate neighbor repeats inside the tile.
 */
function buildTile(
    images: Array<{ src: string; href?: string }>,
    tileW: number,
    tileH: number,
    seed: number
): Int32Array {
    const n = images.length
    const tile = new Int32Array(tileW * tileH)
    tile.fill(0)
    if (n <= 0) return tile

    const rnd = mulberry32(seed)
    const bag = Array.from({ length: n }, (_, i) => i)
    const shuffle = () => {
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1))
            ;[bag[i], bag[j]] = [bag[j], bag[i]]
        }
    }
    shuffle()

    let ptr = 0
    const next = () => {
        const v = bag[ptr++ % bag.length]
        if (ptr % bag.length === 0) shuffle()
        return v
    }

    const MAX_TRIES = 80
    for (let y = 0; y < tileH; y++) {
        for (let x = 0; x < tileW; x++) {
            let di = next()
            let tries = 0

            const left = x > 0 ? tile[y * tileW + (x - 1)] : -1
            const up = y > 0 ? tile[(y - 1) * tileW + x] : -1
            const ul = x > 0 && y > 0 ? tile[(y - 1) * tileW + (x - 1)] : -1
            const ur =
                x < tileW - 1 && y > 0 ? tile[(y - 1) * tileW + (x + 1)] : -1

            while (
                tries < MAX_TRIES &&
                n > 1 &&
                (di === left || di === up || di === ul || di === ur)
            ) {
                di = next()
                tries++
            }

            tile[y * tileW + x] = di
        }
    }
    return tile
}

type CellRec = {
    a: HTMLAnchorElement
    img: HTMLImageElement
    r: number
    c: number
    px: number
    py: number

    gx: number
    gy: number
    di: number
    src: string
    href?: string
}

type Props = {
    items: Item[]
    itemSize: number
    gap: number
    maxSpeed: number
    damping: number
    magnify: number
    radius: number
    fitMode: FitMode
}

// Default size when dropped on canvas / when in Hug contexts with no images
const EMPTY_W = 900
const EMPTY_H = 600

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 */
export default function InfinitGrid(props: Props) {
    const {
        items,
        itemSize,
        gap,
        maxSpeed,
        damping,
        magnify,
        radius,
        fitMode,
    } = props

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const worldRef = React.useRef<HTMLDivElement | null>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })

    // pointer capture (works even when overlays are above)
    const inside = React.useRef(false)
    const target = React.useRef({ x: 0, y: 0 })
    const smooth = React.useRef({ x: 0, y: 0 })
    const pointerPx = React.useRef({ x: 0, y: 0, has: false })

    // motion
    const offset = React.useRef({ x: 0, y: 0 })
    const vel = React.useRef({ x: 0, y: 0 })
    const baseCell = React.useRef({ bx: 0, by: 0 })

    // cells
    const cellsRef = React.useRef<CellRec[]>([])

    // Normalize items
    const data = React.useMemo(() => {
        const out: Array<{ src: string; href?: string }> = []
        for (const it of items || []) {
            const src = normalizeImage((it as any).image)
            if (!src) continue
            const href = normalizeHref((it as any).href)
            out.push({ src, href: href ?? undefined })
        }
        return out
    }, [items])

    // Resize observer
    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (!r) return
            if (r.width > 10 && r.height > 10)
                setSize({ w: r.width, h: r.height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Global pointer capture
    React.useEffect(() => {
        const onMove = (e: PointerEvent) => {
            const el = rootRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()

            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const isIn = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height
            inside.current = isIn

            if (!isIn) {
                target.current = { x: 0, y: 0 }
                pointerPx.current = { x: 0, y: 0, has: false }
                return
            }

            pointerPx.current = { x, y, has: true }
            const nx = x / rect.width - 0.5
            const ny = y / rect.height - 0.5
            target.current = {
                x: clamp(nx, -0.5, 0.5),
                y: clamp(ny, -0.5, 0.5),
            }
        }

        const onBlur = () => {
            inside.current = false
            target.current = { x: 0, y: 0 }
            pointerPx.current = { x: 0, y: 0, has: false }
        }

        window.addEventListener("pointermove", onMove, { capture: true })
        window.addEventListener("blur", onBlur)
        return () => {
            window.removeEventListener(
                "pointermove",
                onMove as any,
                true as any
            )
            window.removeEventListener("blur", onBlur)
        }
    }, [])

    const step = Math.max(1, itemSize + gap)
    const overscan = 2 // internal buffer

    const cols = Math.max(1, Math.ceil(size.w / step) + 2 * overscan)
    const rows = Math.max(1, Math.ceil(size.h / step) + 2 * overscan)

    // Choose tile size (bigger tile = fewer visible repeats)
    const tileSize = React.useMemo(() => {
        const n = data.length
        const targetCells = clamp(
            Math.max(81, Math.min(256, n * 3 || 81)),
            81,
            256
        )
        const s = Math.ceil(Math.sqrt(targetCells))
        return clamp(s, 9, 18)
    }, [data.length])

    const tileW = tileSize
    const tileH = tileSize

    // Tile is stable unless data changes
    const tile = React.useMemo(() => {
        const seedBase =
            (data.length * 1315423911 +
                tileW * 374761393 +
                tileH * 668265263 +
                Math.floor(itemSize * 7) +
                Math.floor(gap * 3)) >>>
            0

        // add a hash of src list to seed to keep pattern stable per set
        let srcHash = 0
        for (let i = 0; i < data.length; i++) srcHash ^= hashString(data[i].src)
        const seed = (seedBase ^ srcHash) >>> 0

        return buildTile(data, tileW, tileH, seed)
    }, [data, tileW, tileH, itemSize, gap])

    const objectFit: React.CSSProperties["objectFit"] =
        fitMode === "original" ? "contain" : "cover"
    const safari = isSafari()
    const loadingAttr = safari ? "eager" : "lazy"

    // Imperatively assign correct src/href to stable cells (NO remount)
    const applyAssignment = React.useCallback(() => {
        if (!data.length) return

        const bx = baseCell.current.bx
        const by = baseCell.current.by

        for (const cell of cellsRef.current) {
            const gx = bx + (cell.c - overscan)
            const gy = by + (cell.r - overscan)

            if (gx === cell.gx && gy === cell.gy) continue
            cell.gx = gx
            cell.gy = gy

            const tx = mod(gx, tileW)
            const ty = mod(gy, tileH)
            const di = tile[ty * tileW + tx] % data.length
            const item = data[di]
            if (!item) continue

            const src = hiDpiSrc(item.src, itemSize, magnify)
            const href = item.href

            // update src only if changed -> prevents blink/decode churn
            if (cell.src !== src) {
                cell.src = src
                cell.img.src = src
            }

            // update link only if changed
            if (href) {
                if (cell.href !== href) {
                    cell.href = href
                    cell.a.href = href
                }
                cell.a.target = "_blank"
                cell.a.rel = "noopener noreferrer"
                cell.a.style.pointerEvents = "auto"
                cell.a.style.cursor = "pointer"
            } else {
                cell.href = undefined
                cell.a.removeAttribute("href")
                cell.a.style.pointerEvents = "none"
                cell.a.style.cursor = "default"
            }
        }
    }, [data, tile, tileW, tileH, itemSize, magnify])

    // When layout or data changes, reset motion + reassign once
    React.useEffect(() => {
        offset.current = { x: 0, y: 0 }
        vel.current = { x: 0, y: 0 }
        baseCell.current = { bx: 0, by: 0 }

        requestAnimationFrame(() => applyAssignment())
    }, [
        cols,
        rows,
        data.length,
        tileW,
        tileH,
        fitMode,
        itemSize,
        gap,
        magnify,
        applyAssignment,
    ])

    // RAF loop: smooth drift + translate + magnify + assignment changes only when entering a new cell
    React.useEffect(() => {
        if (!rootRef.current || !worldRef.current) return
        if (!data.length) return

        let raf = 0
        let last = performance.now()

        const sigma = Math.max(1, radius) * 0.55
        const sigma2 = 2 * sigma * sigma
        const mag = Math.max(0, magnify)

        const tick = () => {
            const now = performance.now()
            const dt = Math.min(0.033, (now - last) / 1000)
            last = now

            // smooth pointer
            const k = clamp(1 - damping, 0.03, 0.35)
            smooth.current.x = lerp(smooth.current.x, target.current.x, k)
            smooth.current.y = lerp(smooth.current.y, target.current.y, k)

            const cx = inside.current ? smooth.current.x / 0.5 : 0
            const cy = inside.current ? smooth.current.y / 0.5 : 0

            vel.current.x = lerp(vel.current.x, cx * maxSpeed, k)
            vel.current.y = lerp(vel.current.y, cy * maxSpeed, k)

            offset.current.x += vel.current.x * dt
            offset.current.y += vel.current.y * dt

            const bx = Math.floor(offset.current.x / step)
            const by = Math.floor(offset.current.y / step)
            const lx = offset.current.x - bx * step
            const ly = offset.current.y - by * step

            // if we entered a new cell -> update assignments (cheap, no remount)
            if (bx !== baseCell.current.bx || by !== baseCell.current.by) {
                baseCell.current = { bx, by }
                applyAssignment()
            }

            worldRef.current!.style.transform = `translate3d(${roundToDpr(-lx)}px, ${roundToDpr(
                -ly
            )}px, 0)`

            // magnify (imperative, no React state)
            const hasFocus =
                inside.current && pointerPx.current.has && mag > 0 && radius > 0
            if (!hasFocus) {
                for (const cell of cellsRef.current)
                    cell.a.style.setProperty("--s", "1")
            } else {
                const px = pointerPx.current.x
                const py = pointerPx.current.y
                for (const cell of cellsRef.current) {
                    const cxv = cell.px - lx + itemSize / 2
                    const cyv = cell.py - ly + itemSize / 2
                    const dx = cxv - px
                    const dy = cyv - py
                    const d2 = dx * dx + dy * dy
                    const g = Math.exp(-d2 / sigma2)
                    let s = 1 + mag * g
                    s = Math.round(s * 800) / 800
                    cell.a.style.setProperty("--s", String(s))
                }
            }

            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [
        data.length,
        step,
        itemSize,
        maxSpeed,
        damping,
        magnify,
        radius,
        applyAssignment,
    ])

    // Empty state: still has a default size (no 0x0)
    if (!data.length) {
        return (
            <div
                ref={rootRef}
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: EMPTY_W,
                    minHeight: EMPTY_H,
                    background: "transparent",
                }}
            />
        )
    }

    // Build a stable pool: keys are fixed r:c, never tied to gx/gy -> no remount flicker
    cellsRef.current = []
    const nodes: React.ReactNode[] = []

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const px = c * step
            const py = r * step

            nodes.push(
                <a
                    key={`cell-${r}-${c}`}
                    ref={(el) => {
                        if (!el) return
                        const img = el.querySelector(
                            "img"
                        ) as HTMLImageElement | null
                        if (!img) return

                        el.style.setProperty("--s", "1")
                        el.style.pointerEvents = "none"
                        el.style.cursor = "default"

                        cellsRef.current.push({
                            a: el,
                            img,
                            r,
                            c,
                            px,
                            py,
                            gx: Number.NaN,
                            gy: Number.NaN,
                            di: -1,
                            src: "",
                            href: undefined,
                        })
                    }}
                    style={{
                        position: "absolute",
                        left: px,
                        top: py,
                        width: itemSize,
                        height: itemSize,
                        display: "block",
                        overflow: "hidden",
                        background: "transparent",
                        transform: "scale(var(--s, 1))",
                        transformOrigin: "center center",
                        willChange: "transform",
                        textDecoration: "none",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transformStyle: "preserve-3d",
                        WebkitTransformStyle: "preserve-3d",
                    }}
                >
                    <img
                        src={hiDpiSrc(data[0].src, itemSize, magnify)}
                        alt=""
                        draggable={false}
                        loading={loadingAttr as any}
                        decoding="async"
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit,
                            objectPosition: "center",
                            imageRendering: "auto",
                            transform: "translateZ(0)",
                            WebkitTransform: "translateZ(0)",
                            willChange: "transform",
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            pointerEvents: "none",
                        }}
                    />
                </a>
            )
        }
    }

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: EMPTY_W,
                minHeight: EMPTY_H,
                position: "relative",
                overflow: "hidden",
                background: "transparent",
                userSelect: "none",
                touchAction: "none",
            }}
        >
            <div
                ref={worldRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: cols * step,
                    height: rows * step,
                    transform: "translate3d(0px, 0px, 0px)",
                    willChange: "transform",
                }}
            >
                {nodes}
            </div>
        </div>
    )
}

InfinitGrid.defaultProps = {
    items: [],
    itemSize: 220,
    gap: 40,
    maxSpeed: 260,
    damping: 0.7,
    magnify: 0.45,
    radius: 220,
    fitMode: "square" as FitMode,
}

addPropertyControls(InfinitGrid, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                href: { type: ControlType.String, title: "Link" },
            },
        },
    },
    fitMode: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["square", "original"],
        optionTitles: ["Square", "Original ratio"],
        defaultValue: "square",
    },
    itemSize: {
        type: ControlType.Number,
        title: "Item Size",
        min: 80,
        max: 520,
        step: 10,
        defaultValue: 220,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 260,
        step: 5,
        defaultValue: 40,
    },
    maxSpeed: {
        type: ControlType.Number,
        title: "Max Speed",
        min: 0,
        max: 1200,
        step: 20,
        defaultValue: 260,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 0,
        max: 0.9,
        step: 0.05,
        defaultValue: 0.7,
    },
    magnify: {
        type: ControlType.Number,
        title: "Magnify",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.45,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 60,
        max: 700,
        step: 10,
        defaultValue: 220,
    },
})
