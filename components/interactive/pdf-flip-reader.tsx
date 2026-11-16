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

/* pdf.js and its worker are imported as pinned package dependencies so they
   are bundled with the component. Nothing executable is fetched at runtime. */
import * as pdfjsLib from "pdfjs-dist"
// @ts-ignore
import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs"

/* ------------------------------------------------------------------ data */

const HALF = Math.PI / 2
const CMS_SLOTS = 10

const TONES: [string, string][] = [
    ["#E9E3D6", "#1E1C19"],
    ["#20303B", "#E9E3D6"],
    ["#C9573C", "#FFF4E6"],
    ["#D9E0D6", "#22302A"],
    ["#EFD9A5", "#3A2A12"],
    ["#2D463C", "#EADFCB"],
]

const DEMO_LABELS = [
    "Cover",
    "Contents",
    "Opening",
    "Feature",
    "Gallery",
    "Notes",
    "Index",
    "Back Cover",
]

const SKINS = {
    light: {
        bg: "#F2F0EB",
        surface: "#FFFFFF",
        ink: "#1B1A18",
        accent: "#D2452D",
    },
    dark: {
        bg: "#131312",
        surface: "#201F1D",
        ink: "#ECE9E2",
        accent: "#F0714F",
    },
}

const RATIOS: Record<string, number> = {
    a4: 1 / 1.4142,
    letter: 8.5 / 11,
    square: 1,
    landscape: 4 / 3,
}

const GLYPH: Record<string, string> = {
    pages: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
    mark: "M7 4h10v16l-5-4-5 4z",
    back: "M15 5l-7 7 7 7",
    fwd: "M9 5l7 7-7 7",
    less: "M5 12h14",
    more: "M5 12h14M12 5v14",
    save: "M12 4v11M7 11l5 5 5-5M5 20h14",
    grow: "M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5",
    shrink: "M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5",
    close: "M6 6l12 12M18 6L6 18",
    lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z",
}

type Leaf = { f: number; b: number }

function solid(c: any, fallback: string): string {
    if (typeof c !== "string" || !c) return fallback
    if (c.startsWith("var(")) {
        const cut = c.indexOf(",")
        return cut > 0 ? c.slice(cut + 1, c.lastIndexOf(")")).trim() : fallback
    }
    return c
}

function gather(p: any): { src: string; label: string }[] {
    const out: { src: string; label: string }[] = []
    if (p.source === "images") {
        for (const it of Array.isArray(p.pages) ? p.pages : []) {
            if (!it) continue
            const url =
                typeof it.imageUrl === "string" ? it.imageUrl.trim() : ""
            out.push({ src: url || it.image?.src || "", label: it.label || "" })
        }
    } else if (p.source === "cms") {
        for (let i = 1; i <= CMS_SLOTS; i++) {
            const url =
                typeof p["cmsUrl" + i] === "string"
                    ? p["cmsUrl" + i].trim()
                    : ""
            const src = url || p["cmsImage" + i]?.src || ""
            if (src) out.push({ src, label: p["cmsImage" + i]?.alt || "" })
        }
    }
    return out
}

function shape(p: any) {
    const read = p.reading || {}
    const turn = p.turn || {}
    const look = p.look || {}
    const tools = p.tools || {}
    const extra = p.behaviour || {}
    const skin =
        look.mode === "custom"
            ? {
                  bg: look.background || SKINS.light.bg,
                  surface: look.surface || SKINS.light.surface,
                  ink: look.text || SKINS.light.ink,
                  accent: look.accent || SKINS.light.accent,
              }
            : SKINS[look.mode === "dark" ? "dark" : "light"]
    const file = (typeof p.pdfFile === "string" && p.pdfFile) || ""
    const link = typeof p.pdfUrl === "string" ? p.pdfUrl.trim() : ""
    const pdf = p.source === "pdf" || !p.source ? file || link : ""
    let items = gather(p)
    if (!pdf && !items.length)
        items = DEMO_LABELS.map((label) => ({ src: "", label }))
    const style = turn.style || "book"
    const curl = (turn.curl ?? 70) / 100
    const kind = read.proportions || "auto"
    return {
        pdf,
        items,
        view: read.view || "auto",
        breakpoint: read.breakpoint ?? 600,
        dir: read.direction === "rtl" ? -1 : 1,
        start: Math.max(1, Math.round(read.startPage ?? 1)),
        covers: read.covers ?? true,
        ratio:
            kind === "custom"
                ? Math.max(0.3, read.customRatio ?? 0.75)
                : RATIOS[kind] || 0,
        fit: read.fit || "cover",
        style,
        bend:
            curl *
            (style === "magazine" ? 0.95 : style === "book" ? 0.6 : 0.42),
        gloss: style === "magazine" ? curl : 0,
        dur: Math.max(0.2, turn.speed ?? 0.8) * 1000,
        shade: (turn.shadows ?? 60) / 100,
        paper: solid(turn.paper, "#FBFAF7"),
        board: solid(turn.board, "#2A2521"),
        skin,
        accentInk: solid(skin.accent, SKINS.light.accent),
        font: look.font || {},
        pad: look.padding ?? 20,
        radius: look.radius ?? 20,
        tools: {
            pages: tools.thumbnails ?? true,
            search: tools.search ?? true,
            marks: tools.bookmarks ?? true,
            zoom: tools.zoom ?? true,
            save: tools.download ?? true,
            full: tools.fullscreen ?? true,
            count: tools.pageNumber ?? true,
            arrows: tools.arrows ?? true,
        },
        barTop: tools.position === "top",
        barSize: Math.min(64, Math.max(22, tools.size ?? 34)),
        remember: extra.remember ?? false,
        keys: extra.keyboard ?? true,
        tap: extra.clickToTurn ?? true,
        maxZoom: Math.max(1.5, extra.maxZoom ?? 3),
        calm: false,
    }
}

type Shape = ReturnType<typeof shape>

/* Leaves are sheets of paper: a front page and a back page (-1 = blank). */
function gatherLeaves(count: number, spread: boolean, covers: boolean) {
    const leaves: Leaf[] = []
    if (!spread) {
        for (let i = 0; i < count; i++) leaves.push({ f: i, b: -1 })
        return { leaves, lo: 0, hi: Math.max(0, count - 1) }
    }
    const slots: number[] = covers ? [] : [-1]
    for (let i = 0; i < count; i++) slots.push(i)
    for (let i = 0; i < slots.length; i += 2)
        leaves.push({ f: slots[i], b: slots[i + 1] ?? -1 })
    const n = leaves.length
    const lo = covers ? 0 : Math.min(1, n)
    const hi = n && leaves[n - 1].b >= 0 ? n : Math.max(lo, n - 1)
    return { leaves, lo, hi }
}

function turnsFor(page: number, spread: boolean, covers: boolean) {
    if (!spread) return page
    const slot = covers ? page : page + 1
    return (slot + 1) >> 1
}

function hashOf(text: string) {
    let h = 5381
    for (let i = 0; i < text.length; i++)
        h = ((h * 33) ^ text.charCodeAt(i)) >>> 0
    return h.toString(36)
}

/* -------------------------------------------------------- canvas helpers */

function daub(
    g: CanvasRenderingContext2D,
    w: number,
    h: number,
    i: number,
    label: string,
    total: number
) {
    const [bg, ink] = TONES[i % TONES.length]
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    const m = w * 0.09
    g.fillStyle = ink
    g.fillRect(m, m, w - 2 * m, Math.max(1, w * 0.004))
    g.textBaseline = "top"
    g.font = `500 ${w * 0.036}px ui-sans-serif, system-ui, sans-serif`
    g.textAlign = "left"
    g.fillText((label || "Page").toUpperCase(), m, m + w * 0.04)
    g.textAlign = "right"
    g.fillText(`${i + 1} / ${total}`, w - m, m + w * 0.04)
    g.textAlign = "left"
    g.textBaseline = "alphabetic"
    g.font = `italic 400 ${w * 0.46}px Georgia, "Times New Roman", serif`
    g.fillText(String(i + 1).padStart(2, "0"), m * 0.7, h - m * 1.5)
    g.globalAlpha = 0.18
    for (let r = 0; r < 4; r++)
        g.fillRect(
            m,
            h * 0.3 + r * w * 0.05,
            (w - 2 * m) * (r === 3 ? 0.45 : 0.8),
            w * 0.018
        )
    g.globalAlpha = 1
}

function fitInto(
    g: CanvasRenderingContext2D,
    img: HTMLImageElement,
    w: number,
    h: number,
    fit: string
) {
    const iw = img.naturalWidth || 1
    const ih = img.naturalHeight || 1
    if (fit === "fill") return g.drawImage(img, 0, 0, w, h)
    const k =
        fit === "contain" ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)
    g.drawImage(img, (w - iw * k) / 2, (h - ih * k) / 2, iw * k, ih * k)
}

/* pdf.js ships with the component (see the imports at the top of the file).
   The worker code is bundled too: it is registered on globalThis so pdf.js
   runs it in-process instead of fetching a worker script from a CDN. */
let pdfOnce: Promise<any> | null = null
function pdfKit() {
    if (!pdfOnce) {
        try {
            const root: any = globalThis
            if (!root.pdfjsWorker?.WorkerMessageHandler)
                root.pdfjsWorker = pdfjsWorker
            /* placeholder only: with the bundled handler registered, pdf.js
               never loads a worker script from this path */
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc)
                pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.mjs"
            pdfOnce = Promise.resolve(pdfjsLib)
        } catch (err) {
            pdfOnce = Promise.reject(err)
            pdfOnce.catch(() => (pdfOnce = null))
        }
    }
    return pdfOnce as Promise<any>
}

type Grab = {
    done: Promise<ArrayBuffer | null>
    got: number
    total: number
    hear: Set<() => void>
}
const fileCache = new Map<string, Grab>()
function pdfBytes(url: string): Grab {
    let hit = fileCache.get(url)
    if (!hit) {
        const grab: Grab = {
            done: null as any,
            got: 0,
            total: 0,
            hear: new Set(),
        }
        const ping = () => grab.hear.forEach((f) => f())
        grab.done = fetch(url, { mode: "cors" })
            .then(async (r) => {
                if (!r.ok) return null
                grab.total = Number(r.headers.get("content-length")) || 0
                const reader =
                    r.body && r.body.getReader ? r.body.getReader() : null
                if (!reader) return r.arrayBuffer()
                const parts: Uint8Array[] = []
                for (;;) {
                    const { done, value } = await reader.read()
                    if (done) break
                    parts.push(value)
                    grab.got += value.length
                    ping()
                }
                const out = new Uint8Array(grab.got)
                let at = 0
                for (const p of parts) {
                    out.set(p, at)
                    at += p.length
                }
                return out.buffer
            })
            .catch(() => null)
        fileCache.set(url, grab)
        grab.done.then((b) => {
            if (!b) fileCache.delete(url)
            else {
                grab.got = grab.total = Math.max(grab.got, 1)
                ping()
            }
        })
        hit = grab
    }
    return hit
}

/* ---------------------------------------------------------------- engine */

function createEngine(read: () => Shape, tell: (patch: any) => void) {
    let cv: HTMLCanvasElement | null = null
    let pad: HTMLElement | null = null
    let B = 0
    let g: CanvasRenderingContext2D | null = null
    let W = 0
    let H = 0
    let hostW = 0
    let dpr = 1
    let permit = false
    let raf = 0
    let stamp = 0
    let epoch = 0

    let count = 0
    let spread = false
    let leaves: Leaf[] = []
    let lo = 0
    let hi = 0
    let turned = 0
    let flips: any[] = []
    let hop: any = null
    let slide = 0
    let zoom = 1
    let zoomGoal = 1
    let panX = 0
    let panY = 0
    let autoRatio = 0
    let revealed = false

    let book: any = null
    let doc: any = null
    let task: any = null
    let unlock: ((pw: string) => void) | null = null
    const sheets = new Map<number, { cv: HTMLCanvasElement; w: number }>()
    const brewing = new Map<number, number>()
    const pics = new Map<number, HTMLImageElement | null>()
    const boxes = new Map<number, number[]>()
    const texts = new Map<number, any>()
    const links = new Map<number, any[]>()
    let hits = new Map<number, number[][]>()
    let hot: number[][] = []
    let hotPage = -1

    const fingers = new Map<number, { x: number; y: number }>()
    let grip: any = null
    let pinch: any = null

    /* ---- geometry ---- */

    function frame() {
        const c = read()
        const r = c.ratio || autoRatio || 0.72
        const cols = spread ? 2 : 1
        const room = Math.max(8, Math.min(W, H) * 0.035)
        let ph = Math.max(10, H - room * 2)
        let pw = ph * r
        if (pw * cols > W - room * 2) {
            pw = Math.max(10, (W - room * 2) / cols)
            ph = pw / r
        }
        const cx = W / 2
        const cy = H / 2
        const spine = spread
            ? cx + c.dir * slide * (pw / 2)
            : cx - c.dir * (pw / 2)
        return {
            pw,
            ph,
            cx,
            cy,
            spine,
            top: cy - ph / 2,
            dir: c.dir,
            depth: pw * 8,
        }
    }

    function slideGoal() {
        if (!spread) return 0
        const minus = leaves[turned - 1]?.b ?? -1
        const plus = leaves[turned]?.f ?? -1
        return (minus < 0 ? -1 : 0) + (plus < 0 ? 1 : 0)
    }

    function showing(t = turned): number[] {
        const out: number[] = []
        if (spread && (leaves[t - 1]?.b ?? -1) >= 0) out.push(leaves[t - 1].b)
        if ((leaves[t]?.f ?? -1) >= 0) out.push(leaves[t].f)
        return out
    }

    function report() {
        const span = showing()
        tell({ page: span[0] ?? 0, span })
        for (const p of span) loadLinks(p)
    }

    function bind(keep?: number) {
        const c = read()
        const here = keep ?? showing()[0] ?? 0
        spread =
            c.view === "spread" || (c.view === "auto" && hostW >= c.breakpoint)
        const made = gatherLeaves(count, spread, c.covers)
        leaves = made.leaves
        lo = made.lo
        hi = made.hi
        flips = []
        hop = null
        turned = Math.min(hi, Math.max(lo, turnsFor(here, spread, c.covers)))
        slide = slideGoal()
        report()
        if (!revealed) {
            const want = wanted()
            for (const p of showing())
                if (!sheets.has(p) && !brewing.has(p))
                    brew(
                        p,
                        Math.max(8, Math.round(want.w * 0.55)),
                        Math.max(8, Math.round(want.h * 0.55))
                    )
        } else for (const p of showing()) sheetOf(p)
        draw()
    }

    /* ---- page bitmaps ---- */

    function wanted() {
        const { pw, ph } = frame()
        const boost = zoomGoal > 1.3 ? Math.min(zoomGoal, 2.5) : 1
        let w = pw * dpr * boost
        let h = ph * dpr * boost
        const cap = 2800 / Math.max(w, h)
        if (cap < 1) {
            w *= cap
            h *= cap
        }
        return { w: Math.max(8, Math.round(w)), h: Math.max(8, Math.round(h)) }
    }

    function sheetOf(i: number) {
        if (i < 0 || i >= count) return null
        const have = sheets.get(i)
        const want = wanted()
        if (
            (!have || have.w < want.w * 0.92) &&
            (brewing.get(i) ?? 0) < want.w * 0.92
        )
            brew(i, want.w, want.h)
        return have || null
    }

    let unhear: (() => void) | null = null

    function reveal() {
        if (revealed) return
        revealed = true
        tell({ shown: true, progress: 1 })
    }

    function keepSheet(i: number, canvas: HTMLCanvasElement, at: number) {
        if (at !== epoch) return
        sheets.set(i, { cv: canvas, w: canvas.width })
        if (!revealed && showing().every((p) => sheets.has(p))) reveal()
        if (sheets.size > 16) {
            const here = showing()[0] ?? 0
            let far = -1
            let gap = -1
            sheets.forEach((_, k) => {
                if (Math.abs(k - here) > gap) {
                    gap = Math.abs(k - here)
                    far = k
                }
            })
            if (far >= 0 && far !== i) {
                sheets.delete(far)
                pics.delete(far)
            }
        }
        draw()
    }

    function brew(i: number, w: number, h: number) {
        const at = epoch
        const c = read()
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ink = canvas.getContext("2d")
        if (!ink) return
        ink.fillStyle = c.paper
        ink.fillRect(0, 0, w, h)
        if (book?.kind === "set") {
            const item = book.items[i]
            if (!item?.src) {
                daub(ink, w, h, i, item?.label || "", count)
                return keepSheet(i, canvas, at)
            }
            const pic = pics.get(i)
            if (pic === undefined) {
                brewing.set(i, w)
                const img = new Image()
                img.decoding = "async"
                const done = (ok: boolean) => {
                    if (at !== epoch) return
                    pics.set(i, ok ? img : null)
                    brewing.delete(i)
                    if (ok && i === 0 && !autoRatio && img.naturalHeight) {
                        autoRatio = img.naturalWidth / img.naturalHeight
                        tell({ ratio: autoRatio })
                        sheets.clear()
                    }
                    draw()
                }
                img.onload = () => done(true)
                img.onerror = () => done(false)
                img.src = item.src
                return
            }
            if (pic) fitInto(ink, pic, w, h, c.fit)
            else daub(ink, w, h, i, item.label || "", count)
            return keepSheet(i, canvas, at)
        }
        if (!doc) return
        brewing.set(i, w)
        doc.getPage(i + 1)
            .then(async (page: any) => {
                const base = page.getViewport({ scale: 1 })
                const k = Math.min(w / base.width, h / base.height)
                const view = page.getViewport({ scale: k })
                const tmp = document.createElement("canvas")
                tmp.width = Math.max(1, Math.round(view.width))
                tmp.height = Math.max(1, Math.round(view.height))
                await page.render({
                    canvasContext: tmp.getContext("2d"),
                    viewport: view,
                }).promise
                const ox = (w - tmp.width) / 2
                const oy = (h - tmp.height) / 2
                ink.drawImage(tmp, ox, oy)
                boxes.set(i, [ox / w, oy / h, tmp.width / w, tmp.height / h])
                keepSheet(i, canvas, at)
            })
            .catch(() => at === epoch && reveal())
            .then(() => {
                if (at === epoch && brewing.get(i) === w) brewing.delete(i)
            })
    }

    function thumb(i: number, target: HTMLCanvasElement) {
        const at = epoch
        const ink = target.getContext("2d")
        if (!ink) return
        const w = target.width
        const h = target.height
        ink.fillStyle = read().paper
        ink.fillRect(0, 0, w, h)
        if (book?.kind === "set")
            return daub(ink, w, h, i, book.items[i]?.label || "", count)
        if (!doc) return
        doc.getPage(i + 1)
            .then((page: any) => {
                if (at !== epoch) return
                const base = page.getViewport({ scale: 1 })
                const k = Math.min(w / base.width, h / base.height)
                const view = page.getViewport({ scale: k })
                return page.render({
                    canvasContext: ink,
                    viewport: view,
                    transform: [
                        1,
                        0,
                        0,
                        1,
                        (w - view.width) / 2,
                        (h - view.height) / 2,
                    ],
                }).promise
            })
            .catch(() => {})
    }

    /* ---- drawing ---- */

    function edgeAt(a: number, bend: number, pw: number, depth: number) {
        const c = bend * Math.sin(a)
        let x = 0
        let z = 0
        for (let i = 0; i < 14; i++) {
            const phi = Math.min(
                Math.PI,
                Math.max(0, a + c * ((2 * (i + 0.5)) / 14 - 1))
            )
            x += Math.cos(phi) * (pw / 14)
            z += Math.sin(phi) * (pw / 14)
        }
        return (x * depth) / (depth - z)
    }

    function angleFor(edge: number, bend: number, pw: number, depth: number) {
        let a0 = 0
        let a1 = Math.PI
        for (let i = 0; i < 13; i++) {
            const mid = (a0 + a1) / 2
            if (edgeAt(mid, bend, pw, depth) > edge) a0 = mid
            else a1 = mid
        }
        return (a0 + a1) / 2
    }

    function bendOf(k: number) {
        const c = read()
        if (c.style !== "hardcover" || !c.covers) return c.bend
        return k === 0 || (spread && k === leaves.length - 1) ? 0 : c.bend
    }

    function paintLeaf(
        F: any,
        front: number,
        back: number,
        a: number,
        bend: number,
        floor: boolean[]
    ) {
        if (!g) return
        const c = read()
        const { pw, ph, cy, spine, dir, depth } = F
        const N = Math.max(24, Math.min(150, Math.round(pw / 2.6)))
        const ds = pw / N
        const curl = bend * Math.sin(a)
        const xs = new Float32Array(N + 1)
        const zs = new Float32Array(N + 1)
        const tilt = new Float32Array(N)
        let x = 0
        let z = 0
        for (let i = 0; i < N; i++) {
            const phi = Math.min(
                Math.PI,
                Math.max(0, a + curl * ((2 * (i + 0.5)) / N - 1))
            )
            x += Math.cos(phi) * ds
            z += Math.sin(phi) * ds
            xs[i + 1] = x
            zs[i + 1] = z
            tilt[i] = phi
        }
        const lift = Math.sin(a)
        /* the spine crease a flat page carries, faded in as the sheet settles
           so there is no pop when it lands */
        const flat = spread && c.shade > 0 ? Math.pow(Math.cos(a), 2) : 0
        /* page-wide shading eases out as the sheet lies down, so the landed page
           already matches the flat one underneath */
        const settle = 1 - Math.pow(Math.cos(a), 4)
        const crease = (u: number) =>
            u < 0.056
                ? 0.26 - (0.19 * u) / 0.056
                : u < 0.16
                  ? 0.07 * (1 - (u - 0.056) / 0.104)
                  : 0
        const fade = spread ? 1 : 1 - Math.min(1, Math.max(0, (a - 1.75) / 1.2))
        const A = front >= 0 ? sheetOf(front) : null
        const B = back >= 0 ? sheetOf(back) : null

        /* soft shadow thrown past the free edge */
        const tip = spine + (dir * xs[N] * depth) / (depth - zs[N])
        const away = dir * (xs[N] >= 0 ? 1 : -1)
        const reach = Math.min(
            pw * 0.3 * lift,
            Math.abs(spine + away * pw - tip)
        )
        if (reach > 1 && c.shade > 0 && floor[xs[N] >= 0 ? 1 : 0]) {
            const fall = g.createLinearGradient(tip, 0, tip + away * reach, 0)
            fall.addColorStop(0, `rgba(0,0,0,${0.3 * lift * c.shade})`)
            fall.addColorStop(1, "rgba(0,0,0,0)")
            g.fillStyle = fall
            g.fillRect(Math.min(tip, tip + away * reach), F.top, reach, ph)
        }

        const PX = new Float32Array(N + 1)
        const PK = new Float32Array(N + 1)
        for (let i = 0; i <= N; i++) {
            PK[i] = depth / (depth - zs[i])
            PX[i] = spine + dir * xs[i] * PK[i]
        }
        /* split the sheet where it turns its back, then paint the far part first */
        const runs: number[][] = []
        let open = 0
        for (let i = 1; i <= N; i++)
            if (i === N || tilt[i] <= HALF !== tilt[open] <= HALF) {
                runs.push([open, i])
                open = i
            }
        runs.sort((p, q) => zs[p[0]] + zs[p[1]] - (zs[q[0]] + zs[q[1]]))
        g.globalAlpha = fade
        for (const [from, to] of runs) {
            const facing = tilt[from] <= HALF
            const sheet = facing ? A : B
            const mirrored = facing ? dir < 0 : dir > 0
            const lead = PX[to] >= PX[from] ? 1 : -1
            g.save()
            g.beginPath()
            for (let i = from; i <= to; i++)
                g.lineTo(PX[i] + (i === to ? lead : 0), cy - (ph * PK[i]) / 2)
            for (let i = to; i >= from; i--)
                g.lineTo(PX[i] + (i === to ? lead : 0), cy + (ph * PK[i]) / 2)
            g.closePath()
            g.clip()
            for (let i = from; i < to; i++) {
                const wide = Math.abs(PX[i + 1] - PX[i])
                if (wide < 0.04) continue
                const tall = ph * Math.max(PK[i], PK[i + 1]) + 1
                const left = Math.min(PX[i], PX[i + 1])
                if (sheet) {
                    const u = mirrored ? 1 - (i + 1) / N : i / N
                    g.drawImage(
                        sheet.cv,
                        u * sheet.cv.width,
                        0,
                        sheet.cv.width / N,
                        sheet.cv.height,
                        left,
                        cy - tall / 2,
                        wide + 0.7,
                        tall
                    )
                } else {
                    g.fillStyle = c.paper
                    g.fillRect(left, cy - tall / 2, wide + 0.7, tall)
                }
            }
            g.restore()
            g.globalAlpha = fade
            const span = PX[to] - PX[from]
            if (Math.abs(span) < 0.6) continue
            const dark = g.createLinearGradient(PX[from], 0, PX[to], 0)
            const shine =
                c.gloss > 0
                    ? g.createLinearGradient(PX[from], 0, PX[to], 0)
                    : null
            const peak = facing ? 0.75 : Math.PI - 0.75
            let last = 0
            for (let i = from; i < to; i++) {
                const at = Math.min(
                    1,
                    Math.max(last, ((PX[i] + PX[i + 1]) / 2 - PX[from]) / span)
                )
                last = at
                const dim =
                    (Math.sin(tilt[i]) * 0.34 * c.shade +
                        (facing ? 0 : 0.05 * lift)) *
                        settle +
                    crease(i / N) * flat * c.shade
                dark.addColorStop(at, `rgba(0,0,0,${dim.toFixed(3)})`)
                if (shine) {
                    const sheen = Math.max(
                        0,
                        1 - Math.abs(tilt[i] - peak) / 0.42
                    )
                    shine.addColorStop(
                        at,
                        `rgba(255,255,255,${(sheen * sheen * 0.26 * c.gloss * lift).toFixed(3)})`
                    )
                }
            }
            g.beginPath()
            for (let i = from; i <= to; i++)
                g.lineTo(PX[i], cy - (ph * PK[i]) / 2)
            for (let i = to; i >= from; i--)
                g.lineTo(PX[i], cy + (ph * PK[i]) / 2)
            g.closePath()
            g.fillStyle = dark
            g.fill()
            if (shine) {
                g.fillStyle = shine
                g.fill()
            }
        }
        g.globalAlpha = 1
    }

    function paintFlat(F: any, i: number, side: number, pile: number) {
        if (!g || i < 0) return
        const c = read()
        const { pw, ph, top, spine, dir } = F
        const way = dir * side
        const x = way > 0 ? spine : spine - pw
        const outer = way > 0 ? x + pw : x
        const r = Math.min(6, pw * 0.012)
        if (c.style === "hardcover" && c.covers) {
            const e = Math.max(3, pw * 0.016)
            g.fillStyle = c.board
            g.beginPath()
            const bx = way > 0 ? x : x - e
            if (g.roundRect)
                g.roundRect(bx, top - e, pw + e, ph + e * 2, r + e * 0.5)
            else g.rect(bx, top - e, pw + e, ph + e * 2)
            g.fill()
        }
        if (c.style !== "magazine") {
            const n = Math.min(4, pile)
            for (let j = n; j >= 1; j--) {
                g.fillStyle = c.paper
                g.fillRect(
                    outer + way * (j * 1.5 - 1.5),
                    top + j,
                    way * 1.5,
                    ph - j * 2
                )
                g.fillStyle = `rgba(0,0,0,${0.08 + j * 0.035})`
                g.fillRect(
                    outer + way * (j * 1.5 - 1.5),
                    top + j,
                    way * 1.5,
                    ph - j * 2
                )
            }
        }
        g.save()
        g.beginPath()
        if (g.roundRect) {
            const round = spread
                ? way > 0
                    ? [0, r, r, 0]
                    : [r, 0, 0, r]
                : [r, r, r, r]
            g.roundRect(x, top, pw, ph, round)
        } else g.rect(x, top, pw, ph)
        g.clip()
        const sheet = sheetOf(i)
        if (sheet) g.drawImage(sheet.cv, x, top, pw, ph)
        else {
            g.fillStyle = c.paper
            g.fillRect(x, top, pw, ph)
        }
        const marks = hits.get(i)
        if (marks) {
            const box = boxes.get(i) || [0, 0, 1, 1]
            g.globalCompositeOperation = "multiply"
            for (const m of marks) {
                const live = i === hotPage && hot.includes(m)
                g.fillStyle = c.accentInk
                g.globalAlpha = live ? 0.62 : 0.3
                g.fillRect(
                    x + (box[0] + m[0] * box[2]) * pw - 1,
                    top + (box[1] + m[1] * box[3]) * ph - 1,
                    m[2] * box[2] * pw + 2,
                    m[3] * box[3] * ph + 2
                )
            }
            g.globalAlpha = 1
            g.globalCompositeOperation = "source-over"
        }
        if (spread && c.shade > 0) {
            const fold = g.createLinearGradient(
                spine,
                0,
                spine + way * pw * 0.16,
                0
            )
            fold.addColorStop(0, `rgba(0,0,0,${0.26 * c.shade})`)
            fold.addColorStop(0.35, `rgba(0,0,0,${0.07 * c.shade})`)
            fold.addColorStop(1, "rgba(0,0,0,0)")
            g.fillStyle = fold
            g.fillRect(x, top, pw, ph)
        }
        g.restore()
    }

    function paint() {
        if (!g || !cv) return
        const c = read()
        g.setTransform(1, 0, 0, 1, 0, 0)
        g.clearRect(0, 0, cv.width, cv.height)
        if (!count) return
        g.setTransform(dpr, 0, 0, dpr, B * dpr, B * dpr)
        if (zoom > 1.001) {
            g.beginPath()
            g.rect(0, 0, W, H)
            g.clip()
        }
        g.translate(W / 2 + panX, H / 2 + panY)
        g.scale(zoom, zoom)
        g.translate(-W / 2, -H / 2)
        g.imageSmoothingQuality = "high"
        const F = frame()
        let mi = -1
        let pi = -1
        if (hop) {
            mi = hop.mi
            pi = hop.pi
        } else if (flips.length) {
            let a = Infinity
            let b = -Infinity
            for (const f of flips) {
                a = Math.min(a, f.k)
                b = Math.max(b, f.k)
            }
            mi = leaves[a - 1]?.b ?? -1
            pi = leaves[b + 1]?.f ?? -1
        } else {
            mi = leaves[turned - 1]?.b ?? -1
            pi = leaves[turned]?.f ?? -1
        }
        if (!spread) mi = -1

        /* ground shadow under whatever is lying flat */
        if (c.shade > 0 && (mi >= 0 || pi >= 0)) {
            const x0 =
                F.spine +
                (F.dir > 0 ? (mi >= 0 ? -F.pw : 0) : pi >= 0 ? -F.pw : 0)
            const span = (mi >= 0 ? F.pw : 0) + (pi >= 0 ? F.pw : 0)
            g.save()
            g.shadowColor = `rgba(0,0,0,${0.3 * c.shade})`
            g.shadowBlur = F.pw * 0.1 * dpr * zoom
            g.shadowOffsetY = F.pw * 0.035 * dpr * zoom
            g.fillStyle = c.paper
            g.fillRect(x0 + 2, F.top + 2, span - 4, F.ph - 4)
            g.restore()
        }
        paintFlat(F, mi, -1, turned)
        paintFlat(F, pi, 1, leaves.length - turned)
        const floor = [mi >= 0, pi >= 0]
        if (hop) paintLeaf(F, hop.f, hop.b, hop.a, c.bend, floor)
        else if (flips.length) {
            const near = flips
                .filter((f) => f.a <= HALF)
                .sort((p, q) => q.k - p.k)
            const far = flips
                .filter((f) => f.a > HALF)
                .sort((p, q) => p.k - q.k)
            for (const f of near.concat(far))
                paintLeaf(
                    F,
                    leaves[f.k]?.f ?? -1,
                    leaves[f.k]?.b ?? -1,
                    f.a,
                    bendOf(f.k),
                    floor
                )
        }
    }

    function ease(p: number) {
        return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
    }

    function advance(now: number, dt: number) {
        let busy = false
        const pull = 1 - Math.exp(-dt / 70)
        for (const f of flips) {
            if (f.held) {
                f.a += (f.aim - f.a) * (1 - Math.exp(-dt / 45))
                busy = true
            } else {
                const p = Math.min(1, Math.max(0, (now - f.t0) / f.dur))
                f.a = f.from + (f.to - f.from) * ease(p)
                if (p >= 1) f.done = true
                else busy = true
            }
        }
        if (flips.some((f) => f.done)) flips = flips.filter((f) => !f.done)
        if (hop) {
            const p = Math.min(1, (now - hop.t0) / hop.dur)
            hop.a = hop.from + (hop.to - hop.from) * ease(p)
            if (p >= 1) hop = null
            else busy = true
        }
        const goal = slideGoal()
        if (Math.abs(goal - slide) > 0.002) {
            slide += (goal - slide) * (1 - Math.exp(-dt / 160))
            busy = true
        } else slide = goal
        if (Math.abs(zoomGoal - zoom) > 0.002) {
            zoom += (zoomGoal - zoom) * pull
            busy = true
        } else zoom = zoomGoal
        if (!grip && !pinch) {
            const lim = bounds()
            const tx = Math.min(lim.x, Math.max(-lim.x, panX))
            const ty = Math.min(lim.y, Math.max(-lim.y, panY))
            if (Math.abs(tx - panX) + Math.abs(ty - panY) > 0.3) {
                panX += (tx - panX) * pull
                panY += (ty - panY) * pull
                busy = true
            } else {
                panX = tx
                panY = ty
            }
        }
        return busy
    }

    function tick(now: number) {
        raf = 0
        if (!permit) return
        const dt = stamp ? Math.min(48, now - stamp) : 16
        stamp = now
        const busy = advance(now, dt)
        paint()
        if (busy) raf = requestAnimationFrame(tick)
        else stamp = 0
    }

    function draw() {
        if (!raf && permit && cv) raf = requestAnimationFrame(tick)
    }

    function settle() {
        flips = []
        hop = null
        slide = slideGoal()
        zoom = zoomGoal
        grip = null
        pinch = null
        fingers.clear()
    }

    /* ---- turning ---- */

    function clock() {
        return typeof performance !== "undefined"
            ? performance.now()
            : Date.now()
    }

    function send(k: number, to: number, wait = 0) {
        const c = read()
        let f = flips.find((it) => it.k === k)
        if (!f) {
            f = { k, a: to > 0 ? 0 : Math.PI }
            flips.push(f)
        }
        f.held = false
        f.done = false
        f.from = f.a
        f.to = to
        f.t0 = clock() + wait
        f.dur = c.dur * (0.3 + (0.7 * Math.abs(to - f.a)) / Math.PI)
    }

    function step(way: number, wait = 0) {
        if (!count) return false
        if (hop) hop = null
        if (way > 0 && turned >= hi) return false
        if (way < 0 && turned <= lo) return false
        const k = way > 0 ? turned : turned - 1
        turned += way
        if (read().calm) flips = []
        else if (flips.length < 4 || flips.some((f) => f.k === k))
            send(k, way > 0 ? Math.PI : 0, wait)
        report()
        draw()
        return true
    }

    function goTo(page: number, instant = false) {
        if (!count) return
        const c = read()
        page = Math.min(count - 1, Math.max(0, Math.round(page)))
        const dest = Math.min(
            hi,
            Math.max(lo, turnsFor(page, spread, c.covers))
        )
        const gap = dest - turned
        if (!gap) return
        if (instant || c.calm) {
            flips = []
            hop = null
            turned = dest
            slide = slideGoal()
        } else if (Math.abs(gap) <= 2) {
            for (let i = 0; i < Math.abs(gap); i++)
                step(Math.sign(gap), i * 120)
            return
        } else {
            const from = turned
            flips = []
            hop =
                gap > 0
                    ? {
                          f: leaves[from]?.f ?? -1,
                          b: leaves[dest - 1]?.b ?? -1,
                          mi: leaves[from - 1]?.b ?? -1,
                          pi: leaves[dest]?.f ?? -1,
                          from: 0,
                          to: Math.PI,
                      }
                    : {
                          f: leaves[dest]?.f ?? -1,
                          b: leaves[from - 1]?.b ?? -1,
                          mi: leaves[dest - 1]?.b ?? -1,
                          pi: leaves[from]?.f ?? -1,
                          from: Math.PI,
                          to: 0,
                      }
            hop.a = hop.from
            hop.t0 = clock()
            hop.dur = c.dur * 1.05
            turned = dest
        }
        report()
        draw()
    }

    /* ---- zoom + pointer ---- */

    function bounds() {
        const F = frame()
        const wide = F.pw * (spread ? 2 : 1) * zoom
        return {
            x: Math.max(0, (wide - W) / 2 + (zoom > 1.01 ? 24 : 0)),
            y: Math.max(0, (F.ph * zoom - H) / 2 + (zoom > 1.01 ? 24 : 0)),
        }
    }

    function setZoom(z: number, snap = false) {
        const c = read()
        zoomGoal = Math.min(c.maxZoom, Math.max(1, z))
        if (zoomGoal < 1.01) zoomGoal = 1
        if (snap || c.calm) zoom = zoomGoal
        if (pad) pad.style.touchAction = zoomGoal > 1 ? "none" : "pan-y"
        tell({ zoom: zoomGoal })
        draw()
    }

    function local(e: any) {
        const box = pad!.getBoundingClientRect()
        const x = e.clientX - box.left
        const y = e.clientY - box.top
        return {
            x: (x - W / 2 - panX) / zoom + W / 2,
            y: (y - H / 2 - panY) / zoom + H / 2,
            rx: x,
            ry: y,
        }
    }

    function pageUnder(x: number, y: number) {
        const F = frame()
        if (y < F.top || y > F.top + F.ph) return null
        const xl = F.dir * (x - F.spine)
        if (Math.abs(xl) > F.pw) return null
        if (xl < 0 && !spread) return null
        const t = turned
        const page = xl >= 0 ? (leaves[t]?.f ?? -1) : (leaves[t - 1]?.b ?? -1)
        if (page < 0) return null
        const left = F.dir * (xl >= 0 ? 1 : -1) > 0 ? F.spine : F.spine - F.pw
        return { page, xl, u: (x - left) / F.pw, v: (y - F.top) / F.ph, F }
    }

    function linkUnder(x: number, y: number) {
        const at = pageUnder(x, y)
        if (!at) return null
        const list = links.get(at.page)
        if (!list) return null
        const box = boxes.get(at.page) || [0, 0, 1, 1]
        const u = (at.u - box[0]) / box[2]
        const v = (at.v - box[1]) / box[3]
        return list.find(
            (l) =>
                u >= l.r[0] &&
                u <= l.r[0] + l.r[2] &&
                v >= l.r[1] &&
                v <= l.r[1] + l.r[3]
        )
    }

    function loadLinks(i: number) {
        if (!doc || links.has(i) || i < 0) return
        links.set(i, [])
        const at = epoch
        doc.getPage(i + 1)
            .then(async (page: any) => {
                const view = page.getViewport({ scale: 1 })
                const notes = await page.getAnnotations()
                if (at !== epoch) return
                const list: any[] = []
                for (const n of notes) {
                    if (n.subtype !== "Link" || !(n.url || n.dest)) continue
                    const q = view.convertToViewportRectangle(n.rect)
                    list.push({
                        r: [
                            Math.min(q[0], q[2]) / view.width,
                            Math.min(q[1], q[3]) / view.height,
                            Math.abs(q[2] - q[0]) / view.width,
                            Math.abs(q[3] - q[1]) / view.height,
                        ],
                        url: n.url,
                        dest: n.dest,
                    })
                }
                links.set(i, list)
            })
            .catch(() => {})
    }

    async function pageOfDest(dest: any) {
        if (!doc || dest == null) return -1
        try {
            const d =
                typeof dest === "string" ? await doc.getDestination(dest) : dest
            if (!Array.isArray(d)) return -1
            return typeof d[0] === "object"
                ? await doc.getPageIndex(d[0])
                : Number(d[0])
        } catch {
            return -1
        }
    }

    function follow(link: any) {
        if (link.url) {
            if (/^(https?:|mailto:|tel:)/i.test(link.url))
                window.open(link.url, "_blank", "noopener,noreferrer")
        } else pageOfDest(link.dest).then((p) => p >= 0 && goTo(p))
    }

    function down(e: any) {
        if (!pad || !count) return
        const p = local(e)
        fingers.set(e.pointerId, { x: p.rx, y: p.ry })
        if (fingers.size === 2) {
            if (grip?.flip) release(0)
            grip = null
            const [a, b] = Array.from(fingers.values())
            pinch = {
                span: Math.hypot(a.x - b.x, a.y - b.y) || 1,
                zoom: zoomGoal,
            }
            return
        }
        grip = {
            id: e.pointerId,
            x0: p.x,
            y0: p.y,
            rx: p.rx,
            ry: p.ry,
            mode: "idle",
            vx: 0,
            lx: p.rx,
            lt: clock(),
        }
    }

    function move(e: any) {
        if (!pad || !count) return
        const p = local(e)
        if (fingers.has(e.pointerId))
            fingers.set(e.pointerId, { x: p.rx, y: p.ry })
        if (pinch && fingers.size === 2) {
            const [a, b] = Array.from(fingers.values())
            setZoom(
                (pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.span,
                true
            )
            return
        }
        if (!grip || grip.id !== e.pointerId) {
            if (e.pointerType === "mouse")
                pad.style.cursor = linkUnder(p.x, p.y)
                    ? "pointer"
                    : zoomGoal > 1
                      ? "grab"
                      : pageUnder(p.x, p.y)
                        ? "grab"
                        : "default"
            return
        }
        const c = read()
        const dx = p.rx - grip.rx
        const dy = p.ry - grip.ry
        const now = clock()
        if (now > grip.lt)
            grip.vx = 0.6 * grip.vx + (0.4 * (p.rx - grip.lx)) / (now - grip.lt)
        grip.lx = p.rx
        grip.lt = now
        if (grip.mode === "idle") {
            if (Math.hypot(dx, dy) < 5) return
            if (zoomGoal > 1.01) {
                grip.mode = "pan"
                grip.px = panX
                grip.py = panY
            } else if (Math.abs(dx) > Math.abs(dy) && !c.calm) {
                const F = frame()
                const forward = F.dir * dx < 0
                if (hop) hop = null
                if (forward ? turned >= hi : turned <= lo) {
                    grip.mode = "dead"
                    return
                }
                const k = forward ? turned : turned - 1
                let f = flips.find((it) => it.k === k)
                if (!f) {
                    f = { k, a: forward ? 0 : Math.PI }
                    flips.push(f)
                }
                f.held = true
                f.done = false
                f.aim = f.a
                const xl0 = F.dir * (grip.x0 - F.spine)
                const hold = Math.max(Math.abs(xl0), F.pw * 0.34)
                grip.gain =
                    !spread && !forward
                        ? 2
                        : Math.min(3, Math.max(1, F.pw / hold))
                grip.base = forward ? F.pw : -F.pw
                grip.flip = f
                grip.forward = forward
                grip.mode = "turn"
            } else grip.mode = "dead"
            if (grip.mode !== "dead")
                try {
                    pad.setPointerCapture(e.pointerId)
                } catch {}
            pad.style.cursor = "grabbing"
        }
        if (grip.mode === "pan") {
            panX = grip.px + dx
            panY = grip.py + dy
            const lim = bounds()
            panX = Math.min(lim.x, Math.max(-lim.x, panX))
            panY = Math.min(lim.y, Math.max(-lim.y, panY))
            draw()
        } else if (grip.mode === "turn") {
            const F = frame()
            const edge = grip.base + F.dir * (dx / zoom) * grip.gain
            grip.flip.aim = angleFor(edge, bendOf(grip.flip.k), F.pw, F.depth)
            draw()
        }
    }

    function release(v: number) {
        const f = grip?.flip
        if (!f) return
        const dir = read().dir
        const swing = dir * v
        const over = Math.abs(swing) > 0.35 ? swing < 0 : f.aim > HALF
        send(f.k, over ? Math.PI : 0)
        const next = over ? f.k + 1 : f.k
        if (next !== turned) {
            turned = Math.min(hi, Math.max(lo, next))
            report()
        }
        draw()
    }

    function up(e: any, cancelled = false) {
        fingers.delete(e.pointerId)
        if (pinch) {
            if (fingers.size < 2) pinch = null
            draw()
            return
        }
        if (!grip || grip.id !== e.pointerId || !pad) return
        const held = grip
        if (held.mode === "turn") release(cancelled ? 0 : held.vx)
        grip = null
        pad.style.cursor = "default"
        if (held.mode !== "idle" || cancelled) return draw()
        const hit = linkUnder(held.x0, held.y0)
        if (hit) return follow(hit)
        if (!read().tap || zoomGoal > 1.01) return
        const at = pageUnder(held.x0, held.y0)
        if (!at) return
        if (spread) step(at.xl >= 0 ? 1 : -1)
        else step(at.xl < at.F.pw * 0.3 ? -1 : 1)
    }

    /* ---- text ---- */

    async function textOf(i: number) {
        if (texts.has(i)) return texts.get(i)
        if (!doc) return null
        const page = await doc.getPage(i + 1)
        const view = page.getViewport({ scale: 1 })
        const m = view.transform
        const content = await page.getTextContent()
        let flat = ""
        const runs: any[] = []
        for (const it of content.items as any[]) {
            if (typeof it.str !== "string") continue
            if (it.str) {
                const t = it.transform
                const c2 = m[0] * t[2] + m[2] * t[3]
                const d2 = m[1] * t[2] + m[3] * t[3]
                const ex = m[0] * t[4] + m[2] * t[5] + m[4]
                const ey = m[1] * t[4] + m[3] * t[5] + m[5]
                const tall = Math.hypot(c2, d2) || it.height || 10
                runs.push({
                    at: flat.length,
                    len: it.str.length,
                    r: [
                        ex / view.width,
                        (ey - tall * 0.86) / view.height,
                        it.width / view.width,
                        (tall * 1.08) / view.height,
                    ],
                })
                flat += it.str
            }
            if (it.hasEOL && !flat.endsWith(" ")) flat += " "
        }
        const made = { flat, low: flat.toLowerCase(), runs }
        texts.set(i, made)
        return made
    }

    async function seek(i: number, needle: string) {
        const found: {
            pre: string
            hit: string
            post: string
            rects: number[][]
        }[] = []
        const low = needle.toLowerCase()
        if (book?.kind === "set") {
            const label = book.items[i]?.label || ""
            const at = label.toLowerCase().indexOf(low)
            if (at >= 0)
                found.push({
                    pre: label.slice(0, at),
                    hit: label.slice(at, at + low.length),
                    post: label.slice(at + low.length),
                    rects: [],
                })
            return found
        }
        const text = await textOf(i)
        if (!text) return found
        let from = 0
        while (found.length < 40) {
            const at = text.low.indexOf(low, from)
            if (at < 0) break
            const end = at + low.length
            const rects: number[][] = []
            for (const run of text.runs) {
                const a = Math.max(at, run.at)
                const b = Math.min(end, run.at + run.len)
                if (b <= a) continue
                rects.push([
                    run.r[0] + (run.r[2] * (a - run.at)) / run.len,
                    run.r[1],
                    (run.r[2] * (b - a)) / run.len,
                    run.r[3],
                ])
            }
            found.push({
                pre: text.flat.slice(Math.max(0, at - 32), at),
                hit: text.flat.slice(at, end),
                post: text.flat.slice(end, end + 48),
                rects,
            })
            from = end
        }
        return found
    }

    /* ---- book lifecycle ---- */

    function shut() {
        epoch++
        unhear?.()
        unhear = null
        try {
            task?.destroy()
        } catch {}
        task = null
        doc = null
        unlock = null
        sheets.clear()
        brewing.clear()
        pics.clear()
        boxes.clear()
        texts.clear()
        links.clear()
        hits = new Map()
        hot = []
        hotPage = -1
        count = 0
        autoRatio = 0
        revealed = false
        flips = []
        hop = null
        zoom = zoomGoal = 1
        panX = panY = 0
    }

    function open(next: any) {
        shut()
        book = next
        const at = epoch
        const begin = read().start - 1
        if (next.kind === "set") {
            tell({ shown: false })
            count = next.items.length
            bind(begin)
            tell({ status: "ready", count, outline: [], ratio: 0, zoom: 1 })
            if (!count) reveal()
            return
        }
        tell({
            status: "loading",
            progress: 0,
            count: 0,
            outline: [],
            zoom: 1,
            shown: false,
        })
        /* progress budget: renderer 12%, file 68%, parse 10%, first pages 10% */
        const grab = pdfBytes(next.url)
        let kitIn = false
        const share = () => {
            const file = grab.total
                ? Math.min(1, grab.got / grab.total)
                : 1 - Math.exp(-grab.got / 1.5e6)
            tell({ progress: (kitIn ? 0.12 : 0) + 0.68 * file })
        }
        grab.hear.add(share)
        unhear = () => grab.hear.delete(share)
        share()
        pdfKit().then(
            () => {
                kitIn = true
                if (at === epoch) share()
            },
            () => {}
        )
        Promise.all([pdfKit(), grab.done])
            .then(([kit, bytes]: any[]) => {
                if (at !== epoch) return
                unhear?.()
                unhear = null
                if (bytes) tell({ progress: 0.82 })
                /* No remote cMap or standard-font URLs: everything pdf.js
                   needs at runtime is either bundled or the user's own PDF. */
                task = kit.getDocument({
                    ...(bytes
                        ? { data: new Uint8Array(bytes.slice(0)) }
                        : { url: next.url }),
                    useSystemFonts: true,
                })
                task.onPassword = (resume: any, reason: number) => {
                    unlock = resume
                    tell({ status: "locked", wrong: reason === 2 })
                }
                if (!bytes)
                    task.onProgress = (p: any) =>
                        p?.total &&
                        tell({
                            progress:
                                0.12 + 0.68 * Math.min(1, p.loaded / p.total),
                        })
                return task.promise.then(async (opened: any) => {
                    if (at !== epoch) return
                    doc = opened
                    count = doc.numPages
                    const first = await doc.getPage(1)
                    const view = first.getViewport({ scale: 1 })
                    autoRatio = view.width / view.height
                    if (at !== epoch) return
                    tell({ progress: 0.9 })
                    bind(begin)
                    tell({
                        status: "ready",
                        count,
                        outline: [],
                        ratio: autoRatio,
                    })
                    const outline: any[] = []
                    const walk = (list: any[], depth: number) => {
                        for (const it of list || []) {
                            if (outline.length > 200) return
                            outline.push({
                                title: it.title,
                                dest: it.dest,
                                depth,
                            })
                            if (depth < 2) walk(it.items, depth + 1)
                        }
                    }
                    try {
                        walk(await doc.getOutline(), 0)
                    } catch {}
                    if (at !== epoch) return
                    if (outline.length) tell({ outline })
                })
            })
            .catch(() => {
                if (at !== epoch) return
                reveal()
                tell({ status: "error" })
            })
    }

    return {
        open,
        shut,
        bind,
        thumb,
        seek,
        goTo,
        setZoom,
        down,
        move,
        up,
        pageOfDest,
        next: () => step(1),
        prev: () => step(-1),
        zoomBy: (f: number) => setZoom(zoomGoal * f),
        canBack: () => turned > lo,
        canNext: () => turned < hi,
        answer(pw: string) {
            if (!unlock) return
            tell({ status: "loading", progress: 1 })
            unlock(pw)
        },
        async bytes() {
            return doc ? await doc.getData() : null
        },
        attach(canvas: HTMLCanvasElement | null, hit: HTMLElement | null) {
            cv = canvas
            pad = hit
            g = canvas ? canvas.getContext("2d") : null
        },
        size(w: number, h: number, host: number, ratio: number) {
            if (!cv) return
            const was = spread
            const c = read()
            W = w
            H = h
            hostW = host
            dpr = Math.min(2.5, ratio || 1)
            /* the canvas bleeds past the stage so drop shadows and lifted page
               corners are never cut off at the stage edge */
            B = Math.round(Math.min(160, Math.max(48, Math.min(w, h) * 0.2)))
            cv.style.left = cv.style.top = -B + "px"
            cv.style.width = w + B * 2 + "px"
            cv.style.height = h + B * 2 + "px"
            cv.width = Math.max(1, Math.round((w + B * 2) * dpr))
            cv.height = Math.max(1, Math.round((h + B * 2) * dpr))
            const now =
                c.view === "spread" ||
                (c.view === "auto" && hostW >= c.breakpoint)
            if (now !== was && count) bind()
            else slide = slideGoal()
            draw()
        },
        restyle() {
            epoch++
            sheets.clear()
            brewing.clear()
            if (count) bind()
        },
        allow(ok: boolean) {
            if (ok === permit) return
            permit = ok
            if (ok) draw()
            else {
                if (raf) cancelAnimationFrame(raf)
                raf = 0
                stamp = 0
                settle()
            }
        },
        mark(map: Map<number, number[][]>, page: number, active: number[][]) {
            hits = map
            hotPage = page
            hot = active
            draw()
        },
        refresh: draw,
        end() {
            permit = false
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            shut()
            cv = null
            g = null
        },
    }
}

/* ----------------------------------------------------------- live hooks */

function useCalm() {
    const [calm, setCalm] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(q.matches)
        sync()
        q.addEventListener?.("change", sync)
        return () => q.removeEventListener?.("change", sync)
    }, [])
    return calm
}

function useOnScreen(ref: React.RefObject<HTMLElement>) {
    const [seen, setSeen] = React.useState(false)
    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        let inView = typeof IntersectionObserver === "undefined"
        const sync = () =>
            setSeen(inView && document.visibilityState !== "hidden")
        let io: IntersectionObserver | null = null
        if (!inView) {
            io = new IntersectionObserver(
                (list) => {
                    inView = list[list.length - 1].isIntersecting
                    sync()
                },
                { rootMargin: "80px" }
            )
            io.observe(el)
        }
        document.addEventListener("visibilitychange", sync)
        sync()
        return () => {
            io?.disconnect()
            document.removeEventListener("visibilitychange", sync)
        }
    }, [])
    return seen
}

/* ----------------------------------------------------------- live reader */

function Mini(props: any) {
    const { engine, index, src, root, stamp, ratio } = props
    const ref = React.useRef<HTMLCanvasElement>(null)
    React.useEffect(() => {
        const el = ref.current
        if (src || !el) return
        if (typeof IntersectionObserver === "undefined") {
            if (index < 24) engine.thumb(index, el)
            return
        }
        const io = new IntersectionObserver(
            (list) => {
                if (!list.some((it) => it.isIntersecting)) return
                io.disconnect()
                engine.thumb(index, el)
            },
            { root: root.current, rootMargin: "240px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [src, index, stamp, ratio])
    const fill: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
    }
    if (src)
        return (
            <img
                src={src}
                alt=""
                loading="lazy"
                draggable={false}
                style={fill}
            />
        )
    return (
        <canvas
            ref={ref}
            width={220}
            height={Math.round(220 / (ratio || 0.72))}
            style={fill}
        />
    )
}

function Reader(props: any) {
    const calm = useCalm()
    const s = shape(props)
    s.calm = calm
    const live = React.useRef(s)
    live.current = s
    const key = "q" + React.useId().replace(/[^a-zA-Z0-9]/g, "")

    const [ui, patch] = React.useReducer((a: any, b: any) => ({ ...a, ...b }), {
        status: "idle",
        shown: false,
        progress: 0,
        wrong: false,
        count: 0,
        page: 0,
        span: [] as number[],
        ratio: 0,
        zoom: 1,
        outline: [] as any[],
    })
    const [panel, setPanel] = React.useState<string | null>(null)
    const [query, setQuery] = React.useState("")
    const [finds, setFinds] = React.useState<any[]>([])
    const [pick, setPick] = React.useState(-1)
    const [looking, setLooking] = React.useState(false)
    const [marks, setMarks] = React.useState<number[]>([])
    const [draft, setDraft] = React.useState<string | null>(null)
    const [secret, setSecret] = React.useState("")
    const [full, setFull] = React.useState(false)
    const [pinned, setPinned] = React.useState(false)
    const [narrow, setNarrow] = React.useState(false)
    const [hostW, setHostW] = React.useState(700)
    const [armed] = React.useState(true)

    const root = React.useRef<HTMLDivElement>(null)
    const stage = React.useRef<HTMLDivElement>(null)
    const canvas = React.useRef<HTMLCanvasElement>(null)
    const hit = React.useRef<HTMLDivElement>(null)
    const scroller = React.useRef<HTMLDivElement>(null)
    const box = React.useRef<any>(null)
    if (!box.current) box.current = createEngine(() => live.current, patch)
    const engine = box.current

    const seen = useOnScreen(root)

    const bookKey = s.pdf
        ? "pdf|" + s.pdf
        : "set|" + s.items.map((it) => it.src + "~" + it.label).join("|")
    const memo = "recto:" + hashOf(bookKey)
    const hasText = !!s.pdf || s.items.some((it) => it.label)

    React.useEffect(() => {
        engine.attach(canvas.current, hit.current)
        const el = stage.current
        if (!el) return
        const measure = () => {
            const r = el.getBoundingClientRect()
            const host = root.current?.getBoundingClientRect().width || r.width
            setNarrow(host < 430)
            setHostW(host)
            engine.size(r.width, r.height, host, window.devicePixelRatio || 1)
        }
        measure()
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            ro.observe(el)
        }
        return () => {
            ro?.disconnect()
            engine.end()
        }
    }, [])

    React.useEffect(() => {
        engine.allow(seen)
    }, [seen])

    React.useEffect(() => {
        if (!armed) return
        engine.attach(canvas.current, hit.current)
        setFinds([])
        setQuery("")
        setPick(-1)
        engine.open(
            s.pdf
                ? { kind: "pdf", url: s.pdf }
                : { kind: "set", items: s.items }
        )
        let saved: any = null
        if (s.remember)
            try {
                saved = JSON.parse(window.localStorage.getItem(memo) || "null")
            } catch {}
        setMarks(
            Array.isArray(saved?.m)
                ? saved.m.filter((n: any) => Number.isFinite(n))
                : []
        )
        box.current.resume = Number.isFinite(saved?.p) ? saved.p : -1
        return () => engine.shut()
    }, [armed, bookKey, s.start, s.remember])

    React.useEffect(() => {
        if (ui.status !== "ready") return
        if (box.current.resume > 0) engine.goTo(box.current.resume, true)
        box.current.resume = -1
    }, [ui.status])

    React.useEffect(() => {
        if (ui.status === "ready") engine.restyle()
    }, [s.view, s.breakpoint, s.covers, s.dir, s.ratio, s.fit, s.paper])

    React.useEffect(() => {
        engine.refresh()
    })

    React.useEffect(() => {
        if (!s.remember || ui.status !== "ready") return
        try {
            window.localStorage.setItem(
                memo,
                JSON.stringify({ p: ui.page, m: marks })
            )
        } catch {}
    }, [ui.page, marks, s.remember, ui.status])

    React.useEffect(() => {
        const el = hit.current
        if (!el || !s.tools.zoom) return
        const wheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return
            e.preventDefault()
            engine.zoomBy(Math.exp(-e.deltaY * 0.012))
        }
        el.addEventListener("wheel", wheel, { passive: false })
        return () => el.removeEventListener("wheel", wheel)
    }, [s.tools.zoom])

    React.useEffect(() => {
        const sync = () => setFull(document.fullscreenElement === root.current)
        document.addEventListener("fullscreenchange", sync)
        return () => document.removeEventListener("fullscreenchange", sync)
    }, [])

    /* search runs page by page so long documents stay responsive */
    React.useEffect(() => {
        const needle = query.trim()
        if (needle.length < 2 || ui.status !== "ready") {
            setFinds([])
            setPick(-1)
            setLooking(false)
            return
        }
        let live = true
        setLooking(true)
        const timer = setTimeout(async () => {
            const all: any[] = []
            for (let i = 0; i < ui.count && live && all.length < 400; i++) {
                let got: any[] = []
                try {
                    got = await engine.seek(i, needle)
                } catch {}
                for (const it of got) all.push({ ...it, page: i })
                if (live && (i % 12 === 11 || i === ui.count - 1))
                    setFinds(all.slice())
            }
            if (live) {
                setFinds(all.slice())
                setLooking(false)
            }
        }, 260)
        return () => {
            live = false
            clearTimeout(timer)
        }
    }, [query, ui.status, ui.count, bookKey])

    React.useEffect(() => {
        const map = new Map<number, number[][]>()
        for (const f of finds) {
            if (!f.rects.length) continue
            const list = map.get(f.page) || []
            for (const r of f.rects) list.push(r)
            map.set(f.page, list)
        }
        const active = finds[pick]
        engine.mark(map, active ? active.page : -1, active ? active.rects : [])
    }, [finds, pick])

    const ready = ui.status === "ready" && ui.count > 0
    const label = ui.span.length
        ? ui.span.map((n: number) => n + 1).join("–")
        : "–"
    const marked = ui.span.some((n: number) => marks.includes(n))
    const flipKeys =
        s.dir > 0 ? ["ArrowRight", "ArrowLeft"] : ["ArrowLeft", "ArrowRight"]

    const toggleMark = () => {
        const here = ui.span[0] ?? 0
        setMarks((list) =>
            ui.span.some((n: number) => list.includes(n))
                ? list.filter((n) => !ui.span.includes(n))
                : list.concat(here).sort((a, b) => a - b)
        )
    }

    const toggleFull = () => {
        const el: any = root.current
        if (!el) return
        if (document.fullscreenElement) document.exitFullscreen?.()
        else if (pinned) setPinned(false)
        else if (el.requestFullscreen)
            el.requestFullscreen().catch(() => setPinned(true))
        else setPinned(true)
    }

    const download = async () => {
        let href = s.pdf
        let blobbed = ""
        try {
            const data = await engine.bytes()
            if (data)
                href = blobbed = URL.createObjectURL(
                    new Blob([data], { type: "application/pdf" })
                )
        } catch {}
        const name =
            decodeURIComponent(
                (s.pdf.split(/[?#]/)[0].split("/").pop() || "document").replace(
                    /\.pdf$/i,
                    ""
                )
            ) + ".pdf"
        const a = document.createElement("a")
        a.href = href
        a.download = name
        a.target = "_blank"
        a.rel = "noopener"
        document.body.appendChild(a)
        a.click()
        a.remove()
        if (blobbed) setTimeout(() => URL.revokeObjectURL(blobbed), 4000)
    }

    const onKey = (e: React.KeyboardEvent) => {
        if (!s.keys || !ready) return
        const tag = (e.target as HTMLElement).tagName
        if (e.key === "Escape") {
            if (panel) setPanel(null)
            else if (pinned) setPinned(false)
            return
        }
        if (tag === "INPUT" || tag === "TEXTAREA") return
        let used = true
        if (e.key === flipKeys[0] || e.key === "PageDown") engine.next()
        else if (e.key === flipKeys[1] || e.key === "PageUp") engine.prev()
        else if (e.key === "Home") engine.goTo(0)
        else if (e.key === "End") engine.goTo(ui.count - 1)
        else if ((e.key === "+" || e.key === "=") && s.tools.zoom)
            engine.zoomBy(1.4)
        else if (e.key === "-" && s.tools.zoom) engine.zoomBy(1 / 1.4)
        else if (e.key === "0" && s.tools.zoom) engine.setZoom(1)
        else if (e.key.toLowerCase() === "f" && s.tools.full) toggleFull()
        else used = false
        if (used) e.preventDefault()
    }

    const soft = `color-mix(in srgb, ${s.skin.ink} 9%, transparent)`
    const line = `color-mix(in srgb, ${s.skin.ink} 13%, transparent)`
    const quiet = `color-mix(in srgb, ${s.skin.ink} 58%, transparent)`
    const ease = calm
        ? "none"
        : "transform .34s cubic-bezier(.2,.8,.2,1), opacity .24s ease"
    const tabs = [
        s.tools.pages && ["pages", "Pages"],
        s.tools.search && hasText && ["search", "Search"],
        s.tools.marks && ["marks", "Bookmarks"],
    ].filter(Boolean) as string[][]
    const shown = panel && tabs.some((t) => t[0] === panel) ? panel : null
    const dock = Math.round(
        Math.min(280, Math.max(150, (hostW - s.pad * 2) * 0.38))
    )

    const icon = (name: string, filled = false) => (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={GLYPH[name]} />
        </svg>
    )
    const tool = (
        name: string,
        title: string,
        act: () => void,
        opts: any = {}
    ) => (
        <button
            key={title}
            type="button"
            className={key + "b"}
            title={title}
            aria-label={title}
            aria-pressed={opts.on}
            data-on={opts.on ? 1 : 0}
            disabled={opts.off || !ready}
            onClick={act}
        >
            {icon(name, opts.filled)}
        </button>
    )

    const left: any[] = []
    if (s.tools.pages)
        left.push(
            tool(
                "pages",
                "Pages",
                () => setPanel(shown === "pages" ? null : "pages"),
                { on: shown === "pages" }
            )
        )
    if (s.tools.search && hasText)
        left.push(
            tool(
                "search",
                "Search",
                () => setPanel(shown === "search" ? null : "search"),
                { on: shown === "search" }
            )
        )
    if (s.tools.marks)
        left.push(
            tool(
                "mark",
                marked ? "Remove bookmark" : "Bookmark this page",
                toggleMark,
                { on: marked, filled: marked }
            )
        )
    const right: any[] = []
    if (s.tools.zoom && !narrow) {
        right.push(
            tool("less", "Zoom out", () => engine.zoomBy(1 / 1.4), {
                off: ui.zoom <= 1,
            })
        )
        right.push(
            tool("more", "Zoom in", () => engine.zoomBy(1.4), {
                off: ui.zoom >= s.maxZoom - 0.01,
            })
        )
    }
    if (s.tools.save && s.pdf)
        right.push(tool("save", "Download PDF", download))
    if (s.tools.full)
        right.push(
            tool(
                full || pinned ? "shrink" : "grow",
                full || pinned ? "Exit fullscreen" : "Fullscreen",
                toggleFull,
                { on: full || pinned }
            )
        )
    const middle: any[] = []
    if (s.tools.arrows)
        middle.push(
            tool(
                s.dir > 0 ? "back" : "fwd",
                "Previous page",
                () => engine.prev(),
                { off: !ready || !engine.canBack() }
            )
        )
    if (s.tools.count)
        middle.push(
            <label
                key="count"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "0 2px",
                    flex: "none",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                <input
                    className={key + "n"}
                    aria-label="Go to page"
                    inputMode="numeric"
                    disabled={!ready}
                    value={draft ?? label}
                    size={Math.max(2, String(draft ?? label).length)}
                    style={{
                        width: `${Math.max(2, String(draft ?? label).length) + 0.6}ch`,
                    }}
                    onFocus={(e) => {
                        setDraft("")
                        e.currentTarget.select()
                    }}
                    onBlur={() => setDraft(null)}
                    onChange={(e) =>
                        setDraft(
                            e.target.value.replace(/[^0-9]/g, "").slice(0, 5)
                        )
                    }
                    onKeyDown={(e) => {
                        if (e.key !== "Enter") return
                        const n = parseInt(draft || "", 10)
                        if (n >= 1) engine.goTo(n - 1)
                        e.currentTarget.blur()
                    }}
                />
                <span style={{ color: quiet }}>/ {ui.count || "–"}</span>
            </label>
        )
    if (s.tools.arrows)
        middle.push(
            tool(s.dir > 0 ? "fwd" : "back", "Next page", () => engine.next(), {
                off: !ready || !engine.canNext(),
            })
        )
    const groups = [
        s.dir > 0 ? middle : middle.slice().reverse(),
        right,
    ].filter((grp) => grp.length)
    if (left.length) groups.unshift(left)
    const bar: any[] = []
    groups.forEach((grp, i) => {
        if (i)
            bar.push(
                <span
                    key={"rule" + i}
                    style={{
                        width: 1,
                        height: Math.round(s.barSize * 0.53),
                        background: line,
                        margin: "0 3px",
                        flex: "none",
                    }}
                />
            )
        bar.push(...grp)
    })

    const css = `
.${key}b{all:unset;box-sizing:border-box;width:auto;height:34px;flex:0 1 34px;min-width:22px;display:grid;place-items:center;border-radius:10px;cursor:pointer;color:inherit;transition:background .16s ease,color .16s ease,opacity .16s ease}
.${key}b:hover{background:${soft}}
.${key}b:focus-visible,.${key}t:focus-visible,.${key}row:focus-visible{outline:2px solid ${s.skin.accent};outline-offset:1px}
.${key}b[disabled]{opacity:.3;cursor:default;background:none}
.${key}b[data-on="1"]{color:${s.skin.accent};background:${soft}}
.${key}n{all:unset;box-sizing:content-box;min-width:34px;text-align:center;padding:5px 4px;border-radius:8px;font:inherit;color:inherit;cursor:text}
.${key}n:hover,.${key}n:focus{background:${soft}}
.${key}t{all:unset;cursor:pointer;padding:7px 10px;border-radius:9px;color:${quiet};transition:color .16s ease,background .16s ease}
.${key}t[data-on="1"]{color:${s.skin.ink};background:${soft}}
.${key}row{all:unset;box-sizing:border-box;display:block;width:100%;cursor:pointer;padding:9px 10px;border-radius:10px}
.${key}row:hover{background:${soft}}
.${key}f{all:unset;box-sizing:border-box;width:100%;padding:10px 12px;border-radius:10px;background:${soft};font:inherit;color:inherit}
.${key}f::placeholder{color:${quiet}}
.${key}bar .${key}b{height:${s.barSize}px;flex-basis:${s.barSize}px;min-width:${Math.round(s.barSize * 0.65)}px;border-radius:${Math.round(s.barSize * 0.3)}px}
.${key}bar .${key}b svg{width:${Math.round(s.barSize * 0.53)}px;height:${Math.round(s.barSize * 0.53)}px}
.${key}bar .${key}n{min-width:${s.barSize}px;padding:${Math.round(s.barSize * 0.15)}px 4px;border-radius:${Math.round(s.barSize * 0.24)}px}
.${key}s{scrollbar-width:thin;scrollbar-color:${line} transparent}
@keyframes ${key}spin{to{transform:rotate(360deg)}}

`

    const sheet: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: 24,
    }
    const card: React.CSSProperties = {
        maxWidth: 300,
        display: "grid",
        gap: 10,
        justifyItems: "center",
    }

    return (
        <div
            ref={root}
            role="region"
            aria-label="Flipbook reader"
            tabIndex={s.keys ? 0 : undefined}
            onKeyDown={onKey}
            style={{
                position: pinned ? "fixed" : "relative",
                inset: pinned ? 0 : undefined,
                zIndex: pinned ? 2147483000 : undefined,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: s.barTop ? "column-reverse" : "column",
                gap: 12,
                padding: s.pad,
                borderRadius: full || pinned ? 0 : s.radius,
                background: s.skin.bg,
                color: s.skin.ink,
                overflow: "visible",
                outline: "none",
                fontSize: 13,
                lineHeight: 1.4,
                ...s.font,
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <style>{css}</style>
            <div
                style={{
                    position: "relative",
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: s.dir > 0 ? "row" : "row-reverse",
                }}
            >
                {tabs.length > 0 && (
                    <div
                        style={{
                            position: "relative",
                            zIndex: 2,
                            flex: "none",
                            alignSelf: "stretch",
                            width: shown ? dock + 12 : 0,
                            overflow: "hidden",
                            transition: calm
                                ? "none"
                                : "width .36s cubic-bezier(.2,.8,.2,1)",
                        }}
                    >
                        <div
                            aria-hidden={!shown}
                            style={
                                {
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    [s.dir > 0 ? "left" : "right"]: 0,
                                    width: dock,
                                    display: "flex",
                                    flexDirection: "column",
                                    background: s.skin.surface,
                                    border: `1px solid ${line}`,
                                    borderRadius: Math.min(
                                        18,
                                        Math.max(10, s.radius * 0.8)
                                    ),
                                    transform: shown
                                        ? "none"
                                        : `translateX(${s.dir > 0 ? -24 : 24}px)`,
                                    opacity: shown ? 1 : 0,
                                    visibility: shown ? "visible" : "hidden",
                                    transition: calm
                                        ? "none"
                                        : `${ease}, visibility 0s linear ${shown ? "0s" : ".36s"}`,
                                    overflow: "hidden",
                                } as React.CSSProperties
                            }
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    padding: 8,
                                    borderBottom: `1px solid ${line}`,
                                }}
                            >
                                {tabs.map((t) => (
                                    <button
                                        key={t[0]}
                                        type="button"
                                        className={key + "t"}
                                        data-on={shown === t[0] ? 1 : 0}
                                        onClick={() => setPanel(t[0])}
                                        style={
                                            dock < 200
                                                ? { padding: "6px 6px" }
                                                : undefined
                                        }
                                    >
                                        {dock < 200
                                            ? (
                                                  {
                                                      pages: "Pages",
                                                      search: "Find",
                                                      marks: "Saved",
                                                  } as any
                                              )[t[0]]
                                            : t[1]}
                                    </button>
                                ))}
                                <span style={{ flex: 1 }} />
                                {dock >= 200 && (
                                    <button
                                        type="button"
                                        className={key + "b"}
                                        aria-label="Close panel"
                                        onClick={() => setPanel(null)}
                                    >
                                        {icon("close")}
                                    </button>
                                )}
                            </div>
                            {shown === "search" && (
                                <div style={{ padding: "10px 10px 0" }}>
                                    <input
                                        className={key + "f"}
                                        type="search"
                                        aria-label="Search this document"
                                        placeholder="Search this document"
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                    />
                                    <div
                                        style={{
                                            color: quiet,
                                            padding: "8px 4px 6px",
                                            fontSize: "0.92em",
                                        }}
                                    >
                                        {query.trim().length < 2
                                            ? "Type at least two letters"
                                            : looking && !finds.length
                                              ? "Searching…"
                                              : `${finds.length}${finds.length >= 400 ? "+" : ""} ${finds.length === 1 ? "match" : "matches"}${looking ? "…" : ""}`}
                                    </div>
                                </div>
                            )}
                            <div
                                ref={scroller}
                                className={key + "s"}
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflowY: "auto",
                                    overscrollBehavior: "contain",
                                    padding: 10,
                                }}
                            >
                                {shown === "pages" && (
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                dock < 200 ? "1fr" : "1fr 1fr",
                                            gap: 10,
                                        }}
                                    >
                                        {Array.from(
                                            { length: ui.count },
                                            (_, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className={key + "row"}
                                                    aria-label={`Go to page ${i + 1}`}
                                                    aria-current={
                                                        ui.span.includes(i)
                                                            ? "page"
                                                            : undefined
                                                    }
                                                    onClick={() =>
                                                        engine.goTo(i)
                                                    }
                                                    style={{ padding: 5 }}
                                                >
                                                    <div
                                                        style={{
                                                            aspectRatio: String(
                                                                s.ratio ||
                                                                    ui.ratio ||
                                                                    0.72
                                                            ),
                                                            borderRadius: 5,
                                                            overflow: "hidden",
                                                            background: s.paper,
                                                            boxShadow:
                                                                ui.span.includes(
                                                                    i
                                                                )
                                                                    ? `0 0 0 2px ${s.skin.accent}`
                                                                    : `0 0 0 1px ${line}`,
                                                        }}
                                                    >
                                                        <Mini
                                                            engine={engine}
                                                            index={i}
                                                            src={
                                                                s.pdf
                                                                    ? ""
                                                                    : s.items[i]
                                                                          ?.src
                                                            }
                                                            root={scroller}
                                                            stamp={bookKey}
                                                            ratio={
                                                                s.ratio ||
                                                                ui.ratio
                                                            }
                                                        />
                                                    </div>
                                                    <div
                                                        style={{
                                                            textAlign: "center",
                                                            paddingTop: 6,
                                                            color: ui.span.includes(
                                                                i
                                                            )
                                                                ? s.skin.ink
                                                                : quiet,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {i + 1}
                                                    </div>
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}
                                {shown === "search" &&
                                    finds.map((f, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            className={key + "row"}
                                            style={{
                                                background:
                                                    i === pick
                                                        ? soft
                                                        : undefined,
                                            }}
                                            onClick={() => {
                                                setPick(i)
                                                engine.goTo(f.page)
                                            }}
                                        >
                                            <div
                                                style={{
                                                    color: quiet,
                                                    fontSize: "0.88em",
                                                    paddingBottom: 2,
                                                }}
                                            >
                                                Page {f.page + 1}
                                            </div>
                                            <div
                                                style={{
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {f.pre}
                                                <mark
                                                    style={{
                                                        background: `color-mix(in srgb, ${s.skin.accent} 26%, transparent)`,
                                                        color: "inherit",
                                                        borderRadius: 3,
                                                        padding: "0 1px",
                                                    }}
                                                >
                                                    {f.hit}
                                                </mark>
                                                {f.post}
                                            </div>
                                        </button>
                                    ))}
                                {shown === "marks" && (
                                    <div style={{ display: "grid", gap: 2 }}>
                                        <button
                                            type="button"
                                            className={key + "row"}
                                            onClick={toggleMark}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                color: s.skin.accent,
                                            }}
                                        >
                                            {icon("mark", marked)}
                                            <span>
                                                {marked
                                                    ? "Remove bookmark"
                                                    : `Bookmark page ${label}`}
                                            </span>
                                        </button>
                                        {!marks.length && (
                                            <div
                                                style={{
                                                    color: quiet,
                                                    padding: "6px 10px 10px",
                                                }}
                                            >
                                                Saved pages will appear here.
                                            </div>
                                        )}
                                        {marks.map((n) => (
                                            <div
                                                key={n}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    className={key + "row"}
                                                    onClick={() =>
                                                        engine.goTo(n)
                                                    }
                                                >
                                                    Page {n + 1}
                                                    {!s.pdf &&
                                                    s.items[n]?.label ? (
                                                        <span
                                                            style={{
                                                                color: quiet,
                                                            }}
                                                        >
                                                            {" "}
                                                            · {s.items[n].label}
                                                        </span>
                                                    ) : null}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={key + "b"}
                                                    aria-label={`Remove bookmark for page ${n + 1}`}
                                                    onClick={() =>
                                                        setMarks((list) =>
                                                            list.filter(
                                                                (m) => m !== n
                                                            )
                                                        )
                                                    }
                                                >
                                                    {icon("close")}
                                                </button>
                                            </div>
                                        ))}
                                        {ui.outline.length > 0 && (
                                            <div
                                                style={{
                                                    color: quiet,
                                                    padding: "14px 10px 4px",
                                                    fontSize: "0.86em",
                                                    letterSpacing: "0.08em",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                Contents
                                            </div>
                                        )}
                                        {ui.outline.map((o: any, i: number) => (
                                            <button
                                                key={i}
                                                type="button"
                                                className={key + "row"}
                                                style={{
                                                    paddingLeft:
                                                        10 + o.depth * 14,
                                                }}
                                                onClick={() =>
                                                    engine
                                                        .pageOfDest(o.dest)
                                                        .then(
                                                            (p: number) =>
                                                                p >= 0 &&
                                                                engine.goTo(p)
                                                        )
                                                }
                                            >
                                                {o.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div
                    ref={stage}
                    style={{
                        position: "relative",
                        flex: 1,
                        minHeight: 0,
                        minWidth: 0,
                    }}
                >
                    <canvas
                        ref={canvas}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: "100%",
                            display: "block",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        ref={hit}
                        role="img"
                        aria-label={
                            ready ? `Page ${label} of ${ui.count}` : "Book"
                        }
                        onPointerDown={engine.down}
                        onPointerMove={engine.move}
                        onPointerUp={(e) => engine.up(e)}
                        onPointerCancel={(e) => engine.up(e, true)}
                        onPointerLeave={(e) =>
                            e.pointerType === "mouse" &&
                            !e.buttons &&
                            (e.currentTarget.style.cursor = "default")
                        }
                        style={{
                            position: "absolute",
                            inset: 0,
                            touchAction: "pan-y",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                        }}
                    />
                    <span
                        aria-live="polite"
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            overflow: "hidden",
                            clipPath: "inset(50%)",
                        }}
                    >
                        {ready ? `Page ${label} of ${ui.count}` : ""}
                    </span>

                    {ui.status === "loading" && (
                        <div style={sheet}>
                            <div style={card}>
                                <span
                                    style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: "50%",
                                        border: `2px solid ${line}`,
                                        borderTopColor: s.skin.accent,
                                        animation: calm
                                            ? "none"
                                            : `${key}spin .9s linear infinite`,
                                        animationPlayState: seen
                                            ? "running"
                                            : "paused",
                                    }}
                                />
                                <span style={{ color: quiet }}>
                                    {ui.progress > 0 && ui.progress < 1
                                        ? `Loading ${Math.round(ui.progress * 100)}%`
                                        : "Opening document"}
                                </span>
                            </div>
                        </div>
                    )}
                    {ui.status === "error" && (
                        <div style={sheet}>
                            <div style={card}>
                                <strong style={{ fontSize: "1.15em" }}>
                                    This document could not be opened
                                </strong>
                                <span style={{ color: quiet }}>
                                    Check that the PDF link is public and allows
                                    cross-origin requests.
                                </span>
                            </div>
                        </div>
                    )}
                    {ui.status === "locked" && (
                        <div style={sheet}>
                            <form
                                style={{
                                    ...card,
                                    width: "100%",
                                    padding: 22,
                                    borderRadius: 16,
                                    background: s.skin.surface,
                                    border: `1px solid ${line}`,
                                    boxShadow: "0 18px 50px rgba(0,0,0,.16)",
                                }}
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    if (secret) engine.answer(secret)
                                    setSecret("")
                                }}
                            >
                                <span style={{ color: s.skin.accent }}>
                                    {icon("lock")}
                                </span>
                                <strong style={{ fontSize: "1.1em" }}>
                                    Password required
                                </strong>
                                <span
                                    style={{
                                        color: ui.wrong ? s.skin.accent : quiet,
                                    }}
                                >
                                    {ui.wrong
                                        ? "That password did not work. Try again."
                                        : "Enter the password to read this document."}
                                </span>
                                <input
                                    className={key + "f"}
                                    type="password"
                                    autoComplete="off"
                                    aria-label="Document password"
                                    placeholder="Password"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        all: "unset",
                                        boxSizing: "border-box",
                                        width: "100%",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        padding: "10px 12px",
                                        borderRadius: 10,
                                        background: s.skin.accent,
                                        color: "#fff",
                                        fontWeight: 600,
                                    }}
                                >
                                    Unlock
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {bar.length > 0 && (
                <div
                    style={{
                        position: "relative",
                        zIndex: 3,
                        display: "flex",
                        justifyContent: "center",
                        flex: "none",
                        minWidth: 0,
                    }}
                >
                    <div
                        role="toolbar"
                        aria-label="Reader tools"
                        className={key + "bar"}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: Math.max(1, Math.round(s.barSize * 0.06)),
                            padding: Math.round(s.barSize * 0.15),
                            maxWidth: "100%",
                            fontSize: `${(s.barSize / 34).toFixed(3)}em`,
                            borderRadius: Math.round(
                                s.barSize * 0.3 + s.barSize * 0.15
                            ),
                            background: s.skin.surface,
                            border: `1px solid ${line}`,
                            boxShadow: "0 6px 24px rgba(0,0,0,.07)",
                        }}
                    >
                        {bar}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ---------------------------------------------------- static (canvas) view */

function StillBook(props: any) {
    const s = shape(props)
    const spread = s.view !== "single"
    const total = s.pdf ? 0 : s.items.length
    const { leaves, lo, hi } = gatherLeaves(s.pdf ? 2 : total, spread, s.covers)
    const at = Math.min(
        hi,
        Math.max(
            lo,
            turnsFor(
                s.pdf ? 0 : Math.min(total - 1, s.start - 1),
                spread,
                s.covers
            )
        )
    )
    const minus = spread ? (leaves[at - 1]?.b ?? -1) : -1
    const plus = leaves[at]?.f ?? -1
    const order = s.dir > 0 ? [minus, plus] : [plus, minus]
    const sides = order.filter((n) => n >= 0)
    const ratio = s.ratio || 0.72
    const line = `color-mix(in srgb, ${s.skin.ink} 13%, transparent)`
    const quiet = `color-mix(in srgb, ${s.skin.ink} 58%, transparent)`
    const names = [
        s.tools.pages && "pages",
        s.tools.search && "search",
        s.tools.marks && "mark",
        s.tools.arrows && "back",
        s.tools.count && "#",
        s.tools.arrows && "fwd",
        s.tools.zoom && "less",
        s.tools.zoom && "more",
        s.tools.save && s.pdf && "save",
        s.tools.full && "grow",
    ].filter(Boolean) as string[]

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: s.barTop ? "column-reverse" : "column",
                gap: 12,
                padding: s.pad,
                borderRadius: s.radius,
                background: s.skin.bg,
                color: s.skin.ink,
                overflow: "visible",
                fontSize: 13,
                lineHeight: 1.4,
                ...s.font,
            }}
        >
            <div
                style={
                    {
                        flex: 1,
                        minHeight: 0,
                        minWidth: 0,
                        containerType: "size",
                        display: "grid",
                        placeItems: "center",
                    } as React.CSSProperties
                }
            >
                <div
                    style={{
                        display: "flex",
                        width: `min(${92 * (sides.length > 1 ? 1 : 0.5)}cqw, ${92 * ratio * sides.length}cqh)`,
                        aspectRatio: String(ratio * sides.length),
                        boxShadow: `0 ${10 + s.shade * 14}px ${30 + s.shade * 30}px rgba(0,0,0,${0.24 * s.shade})`,
                        borderRadius: 4,
                        overflow: "hidden",
                    }}
                >
                    {sides.map((n, slot) => {
                        const item = s.pdf ? null : s.items[n]
                        const tone = TONES[n % TONES.length]
                        const inner =
                            sides.length > 1
                                ? slot === 0
                                    ? "to left"
                                    : "to right"
                                : ""
                        return (
                            <div
                                key={n}
                                style={
                                    {
                                        position: "relative",
                                        flex: 1,
                                        minWidth: 0,
                                        background: s.paper,
                                        containerType: "inline-size",
                                        overflow: "hidden",
                                    } as React.CSSProperties
                                }
                            >
                                {s.pdf ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            padding: "12cqw",
                                            boxSizing: "border-box",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "3.4cqw",
                                            color: "#1B1A18",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "4cqw",
                                                letterSpacing: "0.14em",
                                                opacity: 0.55,
                                            }}
                                        >
                                            PDF
                                        </div>
                                        <div
                                            style={{
                                                height: "7cqw",
                                                width: "70%",
                                                background: "currentColor",
                                                opacity: 0.16,
                                                borderRadius: 2,
                                            }}
                                        />
                                        {[92, 100, 84, 96, 60].map((w, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    height: "2.2cqw",
                                                    width: w + "%",
                                                    background: "currentColor",
                                                    opacity: 0.1,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        ))}
                                        <div
                                            style={{
                                                marginTop: "auto",
                                                fontSize: "3.6cqw",
                                                opacity: 0.55,
                                            }}
                                        >
                                            Pages render in preview and on the
                                            published site.
                                        </div>
                                    </div>
                                ) : item?.src ? (
                                    <img
                                        src={item.src}
                                        alt={item.label || ""}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            objectFit: s.fit as any,
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: tone[0],
                                            color: tone[1],
                                            padding: "9cqw",
                                            boxSizing: "border-box",
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "0.5cqw",
                                                background: "currentColor",
                                            }}
                                        />
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                paddingTop: "3.4cqw",
                                                fontSize: "3.6cqw",
                                                fontWeight: 500,
                                                fontFamily:
                                                    "ui-sans-serif, system-ui, sans-serif",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            <span>{item?.label || "Page"}</span>
                                            <span>
                                                {n + 1} / {total}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: "grid",
                                                gap: "3.2cqw",
                                                paddingTop: "18cqw",
                                                opacity: 0.18,
                                            }}
                                        >
                                            {[80, 80, 80, 45].map((w, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        height: "1.8cqw",
                                                        width: w + "%",
                                                        background:
                                                            "currentColor",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div
                                            style={{
                                                marginTop: "auto",
                                                fontFamily:
                                                    'Georgia, "Times New Roman", serif',
                                                fontStyle: "italic",
                                                fontSize: "46cqw",
                                                lineHeight: 0.8,
                                            }}
                                        >
                                            {String(n + 1).padStart(2, "0")}
                                        </div>
                                    </div>
                                )}
                                {inner && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: `linear-gradient(${inner}, rgba(0,0,0,${0.24 * s.shade}), rgba(0,0,0,0) 16%)`,
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            {names.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        flex: "none",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: Math.max(1, Math.round(s.barSize * 0.06)),
                            padding: Math.round(s.barSize * 0.15),
                            fontSize: `${(s.barSize / 34).toFixed(3)}em`,
                            borderRadius: Math.round(s.barSize * 0.45),
                            background: s.skin.surface,
                            border: `1px solid ${line}`,
                        }}
                    >
                        {names.map((name) =>
                            name === "#" ? (
                                <span
                                    key={name}
                                    style={{
                                        padding: "0 10px",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {sides.map((n) => n + 1).join("–")}{" "}
                                    <span style={{ color: quiet }}>
                                        / {s.pdf ? "–" : total}
                                    </span>
                                </span>
                            ) : (
                                <span
                                    key={name}
                                    style={{
                                        width: s.barSize,
                                        height: s.barSize,
                                        display: "grid",
                                        placeItems: "center",
                                    }}
                                >
                                    <svg
                                        width={Math.round(s.barSize * 0.53)}
                                        height={Math.round(s.barSize * 0.53)}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d={GLYPH[name]} />
                                    </svg>
                                </span>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Recto(props: any) {
    const frozen = useIsStaticRenderer()
    if (frozen) return <StillBook {...props} />
    return <Reader {...props} />
}

/* -------------------------------------------------------------- controls */

const cmsControls: Record<string, any> = {}
for (let i = 1; i <= CMS_SLOTS; i++) {
    cmsControls["cmsImage" + i] = {
        type: ControlType.ResponsiveImage,
        title: "Page " + i,
        hidden: (p: any) => p.source !== "cms",
    }
    cmsControls["cmsUrl" + i] = {
        type: ControlType.String,
        title: "Page " + i + " URL",
        placeholder: "https://…",
        hidden: (p: any) => p.source !== "cms",
    }
}

addPropertyControls(Recto, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["pdf", "images", "cms"],
        optionTitles: ["PDF", "Images", "CMS Images"],
        defaultValue: "pdf",
    },
    pdfFile: {
        type: ControlType.File,
        title: "PDF File",
        allowedFileTypes: ["pdf"],
        hidden: (p: any) => p.source !== "pdf",
    },
    pdfUrl: {
        type: ControlType.String,
        title: "PDF URL",
        placeholder: "https://…/file.pdf",
        description: "Used when no file is uploaded. Bind this to a CMS field.",
        hidden: (p: any) => p.source !== "pdf",
    },
    pages: {
        type: ControlType.Array,
        title: "Pages",
        maxCount: 200,
        hidden: (p: any) => p.source !== "images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    placeholder: "Searchable page name",
                },
            },
        },
        defaultValue: [
            { label: "Cover" },
            { label: "Contents" },
            { label: "Opening" },
            { label: "Feature" },
            { label: "Gallery" },
            { label: "Back Cover" },
        ],
    },
    ...cmsControls,
    reading: {
        type: ControlType.Object,
        title: "Reading",
        controls: {
            view: {
                type: ControlType.Enum,
                title: "View",
                options: ["auto", "single", "spread"],
                optionTitles: ["Auto", "Single Page", "Spread"],
                defaultValue: "auto",
            },
            breakpoint: {
                type: ControlType.Number,
                title: "Breakpoint",
                min: 240,
                max: 1600,
                step: 10,
                unit: "px",
                defaultValue: 600,
                description: "Narrower than this, Auto shows one page.",
                hidden: (p: any) => p.view !== "auto",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["ltr", "rtl"],
                optionTitles: ["Left to Right", "Right to Left"],
                defaultValue: "ltr",
            },
            startPage: {
                type: ControlType.Number,
                title: "Start Page",
                min: 1,
                max: 999,
                step: 1,
                displayStepper: true,
                defaultValue: 1,
            },
            covers: {
                type: ControlType.Boolean,
                title: "Covers",
                defaultValue: true,
                description: "First and last pages stand alone as covers.",
            },
            proportions: {
                type: ControlType.Enum,
                title: "Proportions",
                options: [
                    "auto",
                    "a4",
                    "letter",
                    "square",
                    "landscape",
                    "custom",
                ],
                optionTitles: [
                    "Auto",
                    "A4",
                    "Letter",
                    "Square",
                    "Landscape",
                    "Custom",
                ],
                defaultValue: "auto",
            },
            customRatio: {
                type: ControlType.Number,
                title: "Width ÷ Height",
                min: 0.3,
                max: 2.5,
                step: 0.01,
                defaultValue: 0.75,
                hidden: (p: any) => p.proportions !== "custom",
            },
            fit: {
                type: ControlType.Enum,
                title: "Image Fit",
                options: ["cover", "contain", "fill"],
                optionTitles: ["Cover", "Contain", "Stretch"],
                defaultValue: "cover",
            },
        },
    },
    turn: {
        type: ControlType.Object,
        title: "Page Turn",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Motion",
                options: ["magazine", "book", "hardcover"],
                optionTitles: ["Magazine", "Book", "Hardcover"],
                defaultValue: "book",
            },
            curl: {
                type: ControlType.Number,
                title: "Curl",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 70,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.2,
                max: 2.5,
                step: 0.05,
                unit: "s",
                defaultValue: 0.8,
            },
            shadows: {
                type: ControlType.Number,
                title: "Shadows",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 60,
            },
            paper: {
                type: ControlType.Color,
                title: "Paper",
                defaultValue: "#FBFAF7",
            },
            board: {
                type: ControlType.Color,
                title: "Cover Board",
                defaultValue: "#2A2521",
                hidden: (p: any) => p.style !== "hardcover",
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Reader",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Theme",
                options: ["light", "dark", "custom"],
                optionTitles: ["Light", "Dark", "Custom"],
                defaultValue: "light",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#F2F0EB",
                hidden: (p: any) => p.mode !== "custom",
            },
            surface: {
                type: ControlType.Color,
                title: "Surface",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => p.mode !== "custom",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#1B1A18",
                hidden: (p: any) => p.mode !== "custom",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#D2452D",
                hidden: (p: any) => p.mode !== "custom",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 13, lineHeight: 1.4 },
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 20,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 20,
            },
        },
    },
    tools: {
        type: ControlType.Object,
        title: "Tools",
        controls: {
            position: {
                type: ControlType.Enum,
                title: "Toolbar",
                options: ["bottom", "top"],
                optionTitles: ["Bottom", "Top"],
                displaySegmentedControl: true,
                defaultValue: "bottom",
            },
            size: {
                type: ControlType.Number,
                title: "Toolbar Size",
                min: 22,
                max: 64,
                step: 1,
                unit: "px",
                defaultValue: 34,
                description:
                    "Height of each toolbar button; icons and page number scale with it.",
            },
            arrows: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: true,
            },
            pageNumber: {
                type: ControlType.Boolean,
                title: "Page Number",
                defaultValue: true,
            },
            thumbnails: {
                type: ControlType.Boolean,
                title: "Thumbnails",
                defaultValue: true,
            },
            search: {
                type: ControlType.Boolean,
                title: "Search",
                defaultValue: true,
            },
            bookmarks: {
                type: ControlType.Boolean,
                title: "Bookmarks",
                defaultValue: true,
            },
            zoom: {
                type: ControlType.Boolean,
                title: "Zoom",
                defaultValue: true,
            },
            download: {
                type: ControlType.Boolean,
                title: "Download",
                defaultValue: true,
            },
            fullscreen: {
                type: ControlType.Boolean,
                title: "Fullscreen",
                defaultValue: true,
            },
        },
    },
    behaviour: {
        type: ControlType.Object,
        title: "Behaviour",
        controls: {
            clickToTurn: {
                type: ControlType.Boolean,
                title: "Click to Turn",
                defaultValue: true,
            },
            keyboard: {
                type: ControlType.Boolean,
                title: "Keyboard",
                defaultValue: true,
            },
            remember: {
                type: ControlType.Boolean,
                title: "Remember",
                defaultValue: false,
                description:
                    "Keeps the last page and bookmarks in the visitor's browser.",
            },
            maxZoom: {
                type: ControlType.Number,
                title: "Max Zoom",
                min: 1.5,
                max: 5,
                step: 0.5,
                unit: "×",
                defaultValue: 3,
            },
        },
    },
})
