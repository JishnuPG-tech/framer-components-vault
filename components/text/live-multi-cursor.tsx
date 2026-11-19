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


const { useRef, useMemo, useEffect, useLayoutEffect, useState } = React

type Mark = "select" | "highlight" | "underline" | "ring" | "strike" | "note"
type Reaction = "none" | "pop" | "tint" | "tilt"
type RevealStyle = "rise" | "flip" | "stroke" | "type"
type Aim = "auto" | "percent" | "word" | "char"
type Lane = "auto" | "top" | "bottom" | "right"
type Trigger = "scroll" | "mount" | "hover"

interface Collaborator {
    name: string
    color: string
    badge: string
    label: string
    mark: Mark
    reaction: Reaction
    note: string
    at: number
    span: number
}

interface Resolved {
    text: string
    color: string
    background: string
    padding: number
    font: any
    aim: Aim
    cursors: Collaborator[]
    reveal: {
        on: boolean
        style: RevealStyle
        duration: number
        stagger: number
        bounce: number
        delay: number
        outline: number
        outlineColor: string
    }
    motion: {
        trigger: Trigger
        delay: number
        gap: number
        flight: number
        act: number
        hold: number
        loop: boolean
        rest: number
        lane: Lane
    }
    selection: { tilt: number; stroke: number; handle: number; fill: number }
    badge: { smart: boolean; scale: number; radius: number }
    ambience: {
        trail: boolean
        ripple: boolean
        float: number
        parallax: number
    }
    interaction: { replay: boolean; link: string; newTab: boolean }
    style?: React.CSSProperties
}

interface Pt {
    x: number
    y: number
}
interface Box {
    x: number
    y: number
    w: number
    h: number
}
interface Glyph {
    ch: string
    space: boolean
    br: boolean
}
interface Parsed {
    glyphs: Glyph[]
    words: { start: number; end: number }[]
    ord: number[]
    tokens: (
        | { kind: "word"; idx: number[] }
        | { kind: "space" }
        | { kind: "br" }
    )[]
}
interface Geo {
    W: number
    H: number
    glyph: (Box | null)[]
}
interface Lead {
    range: [number, number]
    segs: Box[]
    box: Box
    c: Pt
    total: number
    ring: Pt[]
    ringD: string
    pin: Pt
    flip: boolean
    down: boolean
    drop: number
    park: Pt
}

/* --------------------------------------------------------------- defaults */

const SEED: Collaborator[] = [
    {
        name: "Odalys",
        color: "#FF5A36",
        badge: "#FF5A36",
        label: "#FFFFFF",
        mark: "select",
        reaction: "tilt",
        note: "Love this angle",
        at: 1,
        span: 1,
    },
    {
        name: "Bram",
        color: "#3D6BFF",
        badge: "#3D6BFF",
        label: "#FFFFFF",
        mark: "underline",
        reaction: "pop",
        note: "Bolder?",
        at: 4,
        span: 1,
    },
    {
        name: "Noor",
        color: "#12B886",
        badge: "#12B886",
        label: "#FFFFFF",
        mark: "highlight",
        reaction: "pop",
        note: "Keep this",
        at: 9,
        span: 1,
    },
    {
        name: "Teodor",
        color: "#A24DFF",
        badge: "#A24DFF",
        label: "#FFFFFF",
        mark: "ring",
        reaction: "tint",
        note: "Ship it",
        at: 10,
        span: 1,
    },
    {
        name: "Caspian",
        color: "#F0447A",
        badge: "#F0447A",
        label: "#FFFFFF",
        mark: "note",
        reaction: "pop",
        note: "Love this!",
        at: 14,
        span: 1,
    },
]

const BASE: Resolved = {
    text: "Every great idea starts as a rough draft shaped together on one live canvas where designers, writers and builders refine every word until the story feels sharper, ready to share",
    color: "#16161A",
    background: "#F4F2EE",
    padding: 56,
    font: {},
    aim: "auto",
    cursors: SEED,
    reveal: {
        on: true,
        style: "rise",
        duration: 0.9,
        stagger: 0.03,
        bounce: 0.45,
        delay: 0.1,
        outline: 1.2,
        outlineColor: "#16161A",
    },
    motion: {
        trigger: "scroll",
        delay: 0.7,
        gap: 0.35,
        flight: 1.1,
        act: 0.8,
        hold: 2.4,
        loop: true,
        rest: 0.8,
        lane: "auto",
    },
    selection: { tilt: -5, stroke: 1.5, handle: 8, fill: 10 },
    badge: { smart: true, scale: 1, radius: 6 },
    ambience: { trail: true, ripple: true, float: 4, parallax: 10 },
    interaction: { replay: true, link: "", newTab: false },
}

function resolve(p: any): Resolved {
    const pick = (k: keyof Resolved) => ({
        ...(BASE as any)[k],
        ...(p?.[k] || {}),
    })
    const list: any[] = Array.isArray(p?.cursors) ? p.cursors : BASE.cursors
    return {
        text: typeof p?.text === "string" ? p.text : BASE.text,
        color: p?.color ?? BASE.color,
        background: p?.background ?? BASE.background,
        padding: typeof p?.padding === "number" ? p.padding : BASE.padding,
        font: p?.font || {},
        aim: p?.aim ?? BASE.aim,
        cursors: list.map((c, i) => ({
            ...SEED[i % SEED.length],
            ...(c || {}),
        })),
        reveal: pick("reveal") as any,
        motion: pick("motion") as any,
        selection: pick("selection") as any,
        badge: pick("badge") as any,
        ambience: pick("ambience") as any,
        interaction: pick("interaction") as any,
        style: p?.style,
    }
}

/* ------------------------------------------------------------------- math */

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const easeIO = (x: number) => {
    x = clamp(x)
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3)
function springy(x: number, bounce: number) {
    if (x <= 0) return 0
    if (x >= 1) return 1
    const d = 7 - bounce * 4.2
    const f = 4 + bounce * 10
    const raw = 1 - Math.exp(-d * x) * Math.cos(f * x)
    const end = 1 - Math.exp(-d) * Math.cos(f)
    return raw + (1 - end) * x
}
function bez(c: Pt[], u: number): Pt {
    const v = 1 - u
    const a = v * v * v,
        b = 3 * v * v * u,
        d = 3 * v * u * u,
        e = u * u * u
    return {
        x: a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x,
        y: a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y,
    }
}
function arcCurve(from: Pt, to: Pt, sign: number): Pt[] {
    const dx = to.x - from.x,
        dy = to.y - from.y
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len,
        ny = dx / len
    const bend = len * 0.26 * (sign % 2 ? 1 : -1)
    return [
        from,
        {
            x: from.x + dx * 0.25 + nx * bend,
            y: from.y + dy * 0.25 + ny * bend,
        },
        {
            x: from.x + dx * 0.72 + nx * bend * 0.45,
            y: from.y + dy * 0.72 + ny * bend * 0.45,
        },
        to,
    ]
}
function spin(p: Pt, c: Pt, deg: number): Pt {
    const r = (deg * Math.PI) / 180,
        cs = Math.cos(r),
        sn = Math.sin(r)
    const x = p.x - c.x,
        y = p.y - c.y
    return { x: c.x + x * cs - y * sn, y: c.y + x * sn + y * cs }
}
const tint = (c: string, pct: number) =>
    `color-mix(in srgb, ${c} ${pct}%, transparent)`
const badgeScale = (p: Resolved, W: number) =>
    (p.badge.smart ? clamp(W / 700, 0.72, 1.3) : 1) *
    Math.max(0.3, p.badge.scale)
const badgeWidth = (name: string, bs: number) => (36 + name.length * 7.2) * bs

/* ---------------------------------------------------------------- parsing */

function parseText(text: string): Parsed {
    const glyphs: Glyph[] = [],
        words: { start: number; end: number }[] = [],
        ord: number[] = []
    let cur = -1,
        k = 0
    for (const ch of Array.from(text || "")) {
        if (ch === "\n") {
            glyphs.push({ ch, space: true, br: true })
            ord.push(-1)
            cur = -1
            continue
        }
        if (/\s/.test(ch)) {
            glyphs.push({ ch: " ", space: true, br: false })
            ord.push(-1)
            cur = -1
            continue
        }
        if (cur === -1) {
            words.push({ start: glyphs.length, end: glyphs.length })
            cur = words.length - 1
        }
        glyphs.push({ ch, space: false, br: false })
        ord.push(k++)
        words[cur].end = glyphs.length
    }
    const tokens: Parsed["tokens"] = []
    let w = 0
    for (let g = 0; g < glyphs.length; ) {
        if (glyphs[g].br) {
            tokens.push({ kind: "br" })
            g++
            continue
        }
        if (glyphs[g].space) {
            tokens.push({ kind: "space" })
            g++
            continue
        }
        const word = words[w++]
        const idx: number[] = []
        for (let i = word.start; i < word.end; i++) idx.push(i)
        tokens.push({ kind: "word", idx })
        g = word.end
    }
    return { glyphs, words, ord, tokens }
}

/* -------------------------------------------------------------- targeting */

function aimRanges(
    P: Parsed,
    cursors: Collaborator[],
    aim: Aim,
    rot: number
): [number, number][] {
    const n = cursors.length,
        words = P.words,
        G = P.glyphs.length,
        W = words.length
    if (!W) return cursors.map(() => [0, 0] as [number, number])
    const trim = (a: number, b: number): [number, number] => {
        a = Math.max(0, Math.min(G, a))
        b = Math.max(a, Math.min(G, b))
        while (a < b && P.glyphs[a].space) a++
        while (b > a && P.glyphs[b - 1].space) b--
        return a < b ? [a, b] : [words[0].start, words[0].end]
    }
    const out: [number, number][] = []
    if (aim === "auto") {
        const base: [number, number][] = []
        if (W < n) {
            const owners: number[][] = words.map(() => [])
            for (let i = 0; i < n; i++) owners[i % W].push(i)
            owners.forEach((list, wi) => {
                const { start, end } = words[wi],
                    len = end - start,
                    m = list.length
                list.forEach((ci, j) => {
                    let a = start + Math.floor((j * len) / m),
                        b = start + Math.floor(((j + 1) * len) / m)
                    if (a >= end) a = end - 1
                    if (b <= a) b = Math.min(end, a + 1)
                    base[ci] = [a, b]
                })
            })
        } else {
            for (let i = 0; i < n; i++) {
                const lo = Math.floor((i * W) / n),
                    hi = Math.max(lo + 1, Math.floor(((i + 1) * W) / n))
                let best = lo
                for (let wi = lo; wi < hi; wi++)
                    if (
                        words[wi].end - words[wi].start >
                        words[best].end - words[best].start
                    )
                        best = wi
                let a = words[best].start,
                    b = words[best].end
                if (b - a < 4 && best + 1 < hi) b = words[best + 1].end
                else if (b - a < 4 && best - 1 >= lo) a = words[best - 1].start
                base[i] = [a, b]
            }
        }
        for (let i = 0; i < n; i++) out.push(trim(...base[(i + rot) % n]))
        return out
    }
    for (const c of cursors) {
        const at = Number(c.at) || 0,
            sp = Math.max(1, Number(c.span) || 1)
        if (aim === "percent") {
            const a = Math.round(clamp(at / 100) * G)
            out.push(trim(a, a + Math.max(1, Math.round(clamp(sp / 100) * G))))
        } else if (aim === "word") {
            const wi = Math.min(W - 1, Math.max(0, Math.round(at) - 1))
            const we = Math.min(W - 1, wi + Math.round(sp) - 1)
            out.push(trim(words[wi].start, words[we].end))
        } else {
            const a = Math.max(0, Math.round(at) - 1)
            out.push(trim(a, a + Math.round(sp)))
        }
    }
    return out
}

/* auto-balance on measured layout: pick words that sit far apart so cursors never pile up */
function spreadRanges(
    P: Parsed,
    geo: Geo,
    n: number,
    rot: number
): [number, number][] | null {
    if (!n) return []
    type Cand = { a: number; b: number; x: number; y: number }
    const all: Cand[] = []
    for (const w of P.words) {
        let a = w.start,
            b = w.end
        while (b > a && /[.,;:!?"')\]]/.test(P.glyphs[b - 1].ch)) b--
        while (a < b && /["'(\[]/.test(P.glyphs[a].ch)) a++
        if (b <= a) continue
        const f = geo.glyph[a],
            l = geo.glyph[b - 1]
        if (!f || !l || Math.abs(f.y - l.y) > f.h * 0.5) continue
        all.push({ a, b, x: (f.x + l.x + l.w) / 2, y: f.y + f.h / 2 })
    }
    if (all.length < n) return null
    const long = all.filter((c) => c.b - c.a >= 4)
    const pool = long.length >= n * 2 ? long : all
    const lineH = geo.glyph[pool[0].a]?.h || 40
    const dist = (p: Cand, q: Cand) => Math.hypot(p.x - q.x, (p.y - q.y) * 2.2)
    const picks: Cand[] = [
        pool[Math.floor((rot * pool.length) / Math.max(1, n)) % pool.length],
    ]
    while (picks.length < n) {
        let best: Cand | null = null,
            score = -1
        for (const c of pool) {
            if (picks.includes(c)) continue
            let m = Infinity
            for (const q of picks) m = Math.min(m, dist(c, q))
            if (m > score) {
                score = m
                best = c
            }
        }
        if (!best) break
        picks.push(best)
    }
    picks.sort((p, q) =>
        Math.abs(p.y - q.y) > lineH * 0.5 ? p.y - q.y : p.x - q.x
    )
    return picks.map((c) => [c.a, c.b] as [number, number])
}

/* ---------------------------------------------------------------- geometry */

function measureGlyphs(
    stage: HTMLElement,
    cells: (HTMLElement | null)[],
    count: number
): Geo {
    const sr = stage.getBoundingClientRect()
    const kx = stage.offsetWidth > 0 ? sr.width / stage.offsetWidth : 1
    const ky = stage.offsetHeight > 0 ? sr.height / stage.offsetHeight : 1
    const glyph: (Box | null)[] = []
    for (let i = 0; i < count; i++) {
        const el = cells[i]
        if (!el) {
            glyph.push(null)
            continue
        }
        const r = el.getBoundingClientRect()
        glyph.push({
            x: (r.left - sr.left) / (kx || 1),
            y: (r.top - sr.top) / (ky || 1),
            w: r.width / (kx || 1),
            h: r.height / (ky || 1),
        })
    }
    return { W: stage.offsetWidth, H: stage.offsetHeight, glyph }
}

function lineGeom(mark: Mark, s: Box, th: number): Box {
    if (mark === "highlight")
        return { x: s.x - 3, y: s.y + s.h * 0.18, w: s.w + 6, h: s.h * 0.68 }
    if (mark === "underline")
        return { x: s.x, y: s.y + s.h * 0.92 - th / 2, w: s.w, h: th }
    return { x: s.x - 2, y: s.y + s.h * 0.54 - th / 2, w: s.w + 4, h: th }
}

function actPoint(L: Lead, mark: Mark, e: number): Pt {
    const B = L.box
    if (mark === "select") return { x: B.x + B.w * e, y: B.y + B.h * e }
    if (mark === "note") return L.pin
    if (mark === "ring") {
        const f = clamp(e) * (L.ring.length - 1),
            i = Math.floor(f),
            t = f - i
        const a = L.ring[i],
            b = L.ring[Math.min(L.ring.length - 1, i + 1)]
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    }
    const k = mark === "highlight" ? 0.86 : mark === "underline" ? 0.92 : 0.54
    let dist = clamp(e) * L.total
    for (let j = 0; j < L.segs.length; j++) {
        const s = L.segs[j]
        if (dist <= s.w || j === L.segs.length - 1)
            return { x: s.x + Math.min(dist, s.w), y: s.y + s.h * k }
        dist -= s.w
    }
    return L.c
}

function restPoint(L: Lead, mark: Mark, deg: number): Pt {
    const p = actPoint(L, mark, 1)
    return mark === "select" ? spin(p, L.c, deg) : p
}

function buildLeads(
    geo: Geo,
    P: Parsed,
    p: Resolved,
    rot: number,
    bs: number
): Lead[] {
    const { W, H } = geo
    const ranges =
        p.aim === "auto"
            ? spreadRanges(P, geo, p.cursors.length, rot) ||
              aimRanges(P, p.cursors, p.aim, rot)
            : aimRanges(P, p.cursors, p.aim, rot)
    const leads: Lead[] = ranges.map((range) => {
        const segs: Box[] = []
        for (let g = range[0]; g < range[1]; g++) {
            const b = geo.glyph[g]
            if (!b) continue
            const last = segs[segs.length - 1]
            if (last && Math.abs(b.y - last.y) < b.h * 0.5) {
                const r = Math.max(last.x + last.w, b.x + b.w)
                last.x = Math.min(last.x, b.x)
                last.w = r - last.x
                last.h = Math.max(last.h, b.h)
            } else segs.push({ ...b })
        }
        if (!segs.length)
            segs.push({ x: W / 2 - 40, y: H / 2 - 20, w: 80, h: 40 })
        const use = segs.slice(0, 4)
        let x0 = Infinity,
            y0 = Infinity,
            x1 = -Infinity,
            y1 = -Infinity,
            lineH = 0,
            total = 0
        for (const s of use) {
            x0 = Math.min(x0, s.x)
            y0 = Math.min(y0, s.y)
            x1 = Math.max(x1, s.x + s.w)
            y1 = Math.max(y1, s.y + s.h)
            lineH = Math.max(lineH, s.h)
            total += s.w
        }
        const pd = Math.max(4, lineH * 0.1)
        const box = {
            x: x0 - pd,
            y: y0 - pd,
            w: x1 - x0 + pd * 2,
            h: y1 - y0 + pd * 2,
        }
        const c = { x: box.x + box.w / 2, y: box.y + box.h / 2 }
        const rx = box.w / 2 + pd * 1.4,
            ry = box.h / 2 + pd * 1.2
        const ring: Pt[] = []
        const th0 = 0.45,
            sweep = Math.PI * 2 * 1.1
        for (let i = 0; i <= 72; i++) {
            const th = th0 + (sweep * i) / 72
            ring.push({
                x:
                    c.x +
                    rx * Math.cos(th) * (1 + 0.035 * Math.sin(3 * th + 0.6)),
                y:
                    c.y +
                    ry * Math.sin(th) * (1 + 0.05 * Math.cos(2 * th + 0.3)),
            })
        }
        const ringD = ring
            .map(
                (q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`
            )
            .join(" ")
        const down = box.y + box.h + 70 + 44 * bs < H
        const pin = { x: box.x + box.w, y: down ? box.y + box.h : box.y }
        return {
            range,
            segs: use,
            box,
            c,
            total: total || 1,
            ring,
            ringD,
            pin,
            flip: pin.x + 200 > W,
            down,
            drop: down ? 12 + 44 * bs : -10,
            park: { x: 0, y: 0 },
        }
    })
    // park lanes
    const edgeOf = (L: Lead, i: number): "top" | "bottom" | "right" => {
        const lane = p.motion.lane
        if (lane !== "auto") return lane
        const dT = L.c.y,
            dB = H - L.c.y,
            dR = (W - L.c.x) * 1.25
        const m = Math.min(dT, dB, dR)
        return m === dR ? "right" : m === dT ? "top" : "bottom"
    }
    const edges = leads.map(edgeOf)
    const edge = Math.max(8, p.padding * 0.3)
    ;(["top", "bottom", "right"] as const).forEach((side) => {
        const members = leads.map((_, i) => i).filter((i) => edges[i] === side)
        members.sort((a, b) =>
            side === "right"
                ? leads[a].c.y - leads[b].c.y
                : leads[a].c.x - leads[b].c.x
        )
        members.forEach((i, k) => {
            const frac = (k + 1) / (members.length + 1)
            const bw = badgeWidth(p.cursors[i].name || "", bs)
            if (side === "right") {
                leads[i].park = {
                    x: W - bw - 10,
                    y: clamp(H * 0.1 + frac * H * 0.8, 8, H - 40 * bs),
                }
            } else {
                const x = clamp(
                    W * 0.08 + frac * W * 0.84 - bw / 2,
                    8,
                    Math.max(8, W - bw - 8)
                )
                leads[i].park = {
                    x,
                    y: side === "top" ? edge : H - edge - 36 * bs,
                }
            }
        })
    })
    return leads
}

function timing(p: Resolved) {
    const n = p.cursors.length
    const F = Math.max(0.2, p.motion.flight),
        E = Math.max(0.2, p.motion.act),
        Hd = Math.max(0, p.motion.hold)
    const X = F * 0.85
    const core = Math.max(0, n - 1) * Math.max(0, p.motion.gap) + F + E + Hd
    return { F, E, Hd, X, core, period: core + X + Math.max(0, p.motion.rest) }
}

const ARROW = "M1.5 1.5 L1.5 18 L6 13.9 L9 20.5 L11.8 19.3 L8.9 12.8 L15 12.6 Z"
const UI_FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif"

/* ================================================================ export */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Conclave(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <ConclaveStill {...props} />
    return <ConclaveLive {...props} />
}

/* ============================================================ static view */

function ConclaveStill(raw: any) {
    const p = resolve(raw)
    const P = useMemo(() => parseText(p.text), [p.text])
    const stageRef = useRef<HTMLDivElement>(null)
    const cells = useRef<(HTMLSpanElement | null)[]>([])
    const [plan, setPlan] = useState<{
        geo: Geo
        leads: Lead[]
        bs: number
    } | null>(null)
    const key = JSON.stringify([
        p.text,
        p.font,
        p.padding,
        p.cursors,
        p.aim,
        p.motion.lane,
        p.badge,
    ])

    useLayoutEffect(() => {
        const st = stageRef.current
        if (!st) return
        const geo = measureGlyphs(st, cells.current, P.glyphs.length)
        const bs = badgeScale(p, geo.W)
        setPlan({ geo, leads: buildLeads(geo, P, p, 0, bs), bs })
    }, [key])

    const T = p.selection.tilt
    const th = Math.max(2, p.selection.stroke * 1.6)
    const glyphTf: string[] = []
    const glyphTint: (string | null)[] = []
    if (plan) {
        p.cursors.forEach((c, i) => {
            const L = plan.leads[i]
            if (!L) return
            for (let g = L.range[0]; g < L.range[1]; g++) {
                const b = plan.geo.glyph[g]
                if (!b || P.glyphs[g].space) continue
                if (c.reaction === "tint") glyphTint[g] = c.color
                if (c.reaction === "tilt" && T) {
                    const cc = { x: b.x + b.w / 2, y: b.y + b.h * 0.55 }
                    const q = spin(cc, L.c, T)
                    glyphTf[g] =
                        `translate(${q.x - cc.x}px, ${q.y - cc.y}px) rotate(${T}deg)`
                }
            }
        })
    }
    const stroke = p.reveal.on && p.reveal.style === "stroke"
    const content = (
        <div
            ref={stageRef}
            aria-label={p.text}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: p.background,
                padding: p.padding,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...p.style,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            >
                {plan &&
                    p.cursors.map((c, i) =>
                        c.mark === "highlight" && plan.leads[i]
                            ? plan.leads[i].segs.map((s, j) => {
                                  const g = lineGeom("highlight", s, th)
                                  return (
                                      <div
                                          key={`${i}-${j}`}
                                          style={{
                                              position: "absolute",
                                              left: g.x,
                                              top: g.y,
                                              width: g.w,
                                              height: g.h,
                                              borderRadius: 3,
                                              background: tint(c.color, 30),
                                          }}
                                      />
                                  )
                              })
                            : null
                    )}
            </div>
            <div
                aria-hidden
                style={{
                    position: "relative",
                    width: "100%",
                    color: p.color,
                    textAlign: "center",
                    fontSize: 34,
                    lineHeight: 1.3,
                    letterSpacing: "-0.02em",
                    fontWeight: 600,
                    fontFamily: "Inter, system-ui, sans-serif",
                    ...p.font,
                    overflowWrap: "normal",
                    wordBreak: "normal",
                }}
            >
                {P.tokens.map((tk, ti) =>
                    tk.kind === "br" ? (
                        <br key={ti} />
                    ) : tk.kind === "space" ? (
                        <React.Fragment key={ti}> </React.Fragment>
                    ) : (
                        <span
                            key={ti}
                            style={{
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {tk.idx.map((g) => (
                                <span
                                    key={g}
                                    ref={(el) => (cells.current[g] = el)}
                                    style={{
                                        display: "inline-block",
                                        position: "relative",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            position: "relative",
                                            transform: glyphTf[g],
                                            transformOrigin: "50% 55%",
                                            color: glyphTint[g] || undefined,
                                        }}
                                    >
                                        {P.glyphs[g].ch}
                                        {stroke && p.reveal.outline > 0 && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    top: 0,
                                                    color: "transparent",
                                                    WebkitTextStroke: `${p.reveal.outline}px ${p.reveal.outlineColor}`,
                                                }}
                                            >
                                                {P.glyphs[g].ch}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            ))}
                        </span>
                    )
                )}
            </div>
            {plan && (
                <svg
                    width="100%"
                    height="100%"
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "visible",
                        pointerEvents: "none",
                    }}
                >
                    {p.cursors.map((c, i) =>
                        c.mark === "ring" && plan.leads[i] ? (
                            <path
                                key={i}
                                d={plan.leads[i].ringD}
                                fill="none"
                                stroke={c.color}
                                strokeWidth={Math.max(
                                    1.5,
                                    p.selection.stroke * 1.4
                                )}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ) : null
                    )}
                </svg>
            )}
            {plan && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                >
                    {p.cursors.map((c, i) => {
                        const L = plan.leads[i]
                        if (!L) return null
                        const hs = p.selection.handle
                        const parts: React.ReactNode[] = []
                        if (c.mark === "select") {
                            parts.push(
                                <div
                                    key="b"
                                    style={{
                                        position: "absolute",
                                        left: L.box.x,
                                        top: L.box.y,
                                        width: L.box.w,
                                        height: L.box.h,
                                        boxSizing: "border-box",
                                        border: `${p.selection.stroke}px solid ${c.color}`,
                                        background: tint(
                                            c.color,
                                            p.selection.fill
                                        ),
                                        transform: `rotate(${T}deg)`,
                                        transformOrigin: "50% 50%",
                                    }}
                                >
                                    {hs > 0 &&
                                        [
                                            { left: -hs / 2, top: -hs / 2 },
                                            { right: -hs / 2, top: -hs / 2 },
                                            { left: -hs / 2, bottom: -hs / 2 },
                                            { right: -hs / 2, bottom: -hs / 2 },
                                        ].map((pos, k) => (
                                            <div
                                                key={k}
                                                style={{
                                                    position: "absolute",
                                                    width: hs,
                                                    height: hs,
                                                    background: "#FFFFFF",
                                                    border: `1.5px solid ${c.color}`,
                                                    boxSizing: "border-box",
                                                    ...pos,
                                                }}
                                            />
                                        ))}
                                </div>
                            )
                        } else if (
                            c.mark === "underline" ||
                            c.mark === "strike"
                        ) {
                            L.segs.forEach((s, j) => {
                                const g = lineGeom(c.mark, s, th)
                                parts.push(
                                    <div
                                        key={j}
                                        style={{
                                            position: "absolute",
                                            left: g.x,
                                            top: g.y,
                                            width: g.w,
                                            height: g.h,
                                            borderRadius: th,
                                            background: c.color,
                                        }}
                                    />
                                )
                            })
                        } else if (c.mark === "note") {
                            parts.push(
                                <div
                                    key="pin"
                                    style={{
                                        position: "absolute",
                                        left: L.pin.x - 6,
                                        top: L.pin.y - 6,
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        background: c.color,
                                        border: "2px solid #FFFFFF",
                                        boxSizing: "border-box",
                                    }}
                                />
                            )
                            parts.push(
                                <div
                                    key="bubble"
                                    style={{
                                        position: "absolute",
                                        left: L.pin.x + (L.flip ? -10 : 10),
                                        top: L.pin.y + L.drop,
                                        transform: `translate(${L.flip ? -100 : 0}%, ${L.down ? 0 : -100}%) scale(${plan.bs})`,
                                        transformOrigin: `${L.flip ? 100 : 0}% ${L.down ? 0 : 100}%`,
                                        background: c.color,
                                        color: c.label,
                                        fontFamily: UI_FONT,
                                        fontSize: 13,
                                        fontWeight: 500,
                                        lineHeight: 1.3,
                                        padding: "7px 11px",
                                        borderRadius: 12,
                                        maxWidth: 200,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {c.note}
                                </div>
                            )
                        }
                        const rest = restPoint(
                            L,
                            c.mark,
                            c.mark === "select" ? T : 0
                        )
                        parts.push(
                            <div
                                key="cur"
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    transform: `translate(${rest.x}px, ${rest.y}px) scale(${plan.bs})`,
                                    transformOrigin: "0 0",
                                }}
                            >
                                <svg
                                    width={18}
                                    height={22}
                                    viewBox="0 0 18 22"
                                    style={{
                                        display: "block",
                                        overflow: "visible",
                                    }}
                                >
                                    <path
                                        d={ARROW}
                                        fill={c.color}
                                        stroke="#FFFFFF"
                                        strokeWidth={1.4}
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 14,
                                        top: 19,
                                        background: c.badge,
                                        color: c.label,
                                        fontFamily: UI_FONT,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        lineHeight: 1,
                                        padding: "5px 8px",
                                        borderRadius: p.badge.radius,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {c.name}
                                </div>
                            </div>
                        )
                        return <React.Fragment key={i}>{parts}</React.Fragment>
                    })}
                </div>
            )}
        </div>
    )
    return p.interaction.link ? (
        <a
            href={p.interaction.link}
            target={p.interaction.newTab ? "_blank" : undefined}
            rel="noopener"
            style={{
                display: "block",
                width: "100%",
                height: "100%",
                textDecoration: "none",
                color: "inherit",
            }}
        >
            {content}
        </a>
    ) : (
        content
    )
}

/* ============================================================== live view */

interface MarkRefs {
    cursor: HTMLDivElement | null
    ripple: HTMLDivElement | null
    trail: SVGPathElement | null
    ring: SVGPathElement | null
    box: HTMLDivElement | null
    segs: (HTMLDivElement | null)[]
    pin: HTMLDivElement | null
    bubble: HTMLDivElement | null
}

function ConclaveLive(raw: any) {
    const p = resolve(raw)
    const P = useMemo(() => parseText(p.text), [p.text])
    const stageRef = useRef<HTMLDivElement>(null)
    const cells = useRef<(HTMLSpanElement | null)[]>([])
    const inners = useRef<(HTMLSpanElement | null)[]>([])
    const fills = useRef<(HTMLSpanElement | null)[]>([])
    const outlines = useRef<(HTMLSpanElement | null)[]>([])
    const marks = useRef<MarkRefs[]>([])
    const propsRef = useRef(p)
    propsRef.current = p
    const parsedRef = useRef(P)
    parsedRef.current = P
    const model = useRef<{
        geo: Geo | null
        leads: Lead[][]
        bs: number
        ver: number
    }>({ geo: null, leads: [], bs: 1, ver: 0 })
    const S = useRef({
        started: false,
        revealT0: null as number | null,
        cursorT0: null as number | null,
        px: 0,
        py: 0,
        tx: 0,
        ty: 0,
        reduced: false,
        tf: [] as string[],
        ringKey: [] as string[],
    })
    const wakeRef = useRef<() => void>(() => {})
    const paintRef = useRef<(now: number) => boolean>(() => false)
    const rebuildRef = useRef<() => void>(() => {})

    const slot = (i: number): MarkRefs =>
        marks.current[i] ||
        (marks.current[i] = {
            cursor: null,
            ripple: null,
            trail: null,
            ring: null,
            box: null,
            segs: [],
            pin: null,
            bubble: null,
        })

    rebuildRef.current = () => {
        const st = stageRef.current
        if (!st) return
        const pp = propsRef.current,
            PP = parsedRef.current
        const geo = measureGlyphs(st, cells.current, PP.glyphs.length)
        if (!geo.W || !geo.H) return
        const bs = badgeScale(pp, geo.W)
        const rots = pp.aim === "auto" ? Math.max(1, pp.cursors.length) : 1
        const leads: Lead[][] = []
        for (let r = 0; r < rots; r++)
            leads.push(buildLeads(geo, PP, pp, r, bs))
        model.current = { geo, leads, bs, ver: model.current.ver + 1 }
    }

    paintRef.current = (now: number): boolean => {
        const pp = propsRef.current,
            PP = parsedRef.current,
            M = model.current,
            s = S.current
        const geo = M.geo
        if (!geo) return false
        const final = s.reduced
        const hoverMode = pp.motion.trigger === "hover"
        let busy = false

        // pointer parallax smoothing
        s.px += (s.tx - s.px) * 0.12
        s.py += (s.ty - s.py) * 0.12
        if (Math.abs(s.tx - s.px) + Math.abs(s.ty - s.py) > 0.002) busy = true
        else {
            s.px = s.tx
            s.py = s.ty
        }

        // reveal
        const G = PP.glyphs.length
        const rv = pp.reveal
        const rt =
            final || hoverMode || !rv.on
                ? 1e9
                : s.revealT0 == null
                  ? -1
                  : now - s.revealT0
        const op: number[] = new Array(G).fill(1)
        const fop: number[] = new Array(G).fill(1)
        const base: string[] = new Array(G).fill("")
        const clip: string[] = new Array(G).fill("none")
        const rdx: number[] = new Array(G).fill(0)
        const rdy: number[] = new Array(G).fill(0)
        const rrot: number[] = new Array(G).fill(0)
        const rsc: number[] = new Array(G).fill(1)
        const tints: (string | null)[] = new Array(G).fill(null)
        const dur = Math.max(0.05, rv.duration)
        for (let g = 0; g < G; g++) {
            if (PP.glyphs[g].space) continue
            const h = geo.glyph[g]?.h || 40
            const x =
                rt < 0 ? -1 : (rt - rv.delay - PP.ord[g] * rv.stagger) / dur
            if (rt >= 0 && x < 1.05) busy = true
            if (rv.style === "rise") {
                const sp = springy(x, rv.bounce)
                op[g] = x <= 0 ? 0 : clamp(x * 2.5)
                base[g] = `translateY(${((1 - sp) * 0.55 * h).toFixed(2)}px)`
            } else if (rv.style === "flip") {
                const sp = springy(x, rv.bounce)
                op[g] = x <= 0 ? 0 : clamp(x * 3)
                base[g] =
                    `perspective(600px) rotateX(${((1 - sp) * -92).toFixed(2)}deg)`
            } else if (rv.style === "stroke") {
                const a = easeOut(x / 0.55)
                op[g] = x <= 0 ? 0 : 1
                clip[g] = `inset(-25% ${((1 - a) * 105).toFixed(2)}% -25% -10%)`
                fop[g] = easeIO((x - 0.45) / 0.55)
            } else {
                op[g] = x > 0 ? 1 : 0
                base[g] =
                    `scale(${(1 + 0.35 * Math.max(0, 1 - x * 2.5)).toFixed(3)})`
            }
        }

        // cursors
        const tm = timing(pp)
        const { F, E, X, core, period } = tm
        const n = pp.cursors.length
        let c = final ? core : s.cursorT0 == null ? -1 : now - s.cursorT0
        let cyc = 0,
            cc = c
        if (!final && c >= 0 && pp.motion.loop) {
            cyc = Math.floor(c / period)
            cc = c - cyc * period
        }
        if (!final) {
            if (c < 0) {
                if (s.cursorT0 != null) busy = true
            } else if (pp.motion.loop || cc < core + 1) busy = true
        }
        const rot =
            pp.aim === "auto" && n > 0 ? cyc % Math.max(1, M.leads.length) : 0
        const leads = M.leads[rot] || M.leads[0] || []
        const shown = final || hoverMode || s.revealT0 != null
        const cOp =
            final || hoverMode
                ? 1
                : s.revealT0 == null
                  ? 0
                  : clamp((now - s.revealT0) / 0.5)
        if (shown && !final && pp.ambience.float > 0) busy = true
        const T = pp.selection.tilt
        const th = Math.max(2, pp.selection.stroke * 1.6)
        const exiting = !final && pp.motion.loop && c >= 0 && cc >= core
        const xT = exiting ? (cc - core) / X : 0

        for (let i = 0; i < n; i++) {
            const cur = pp.cursors[i],
                L = leads[i],
                R = marks.current[i]
            if (!L || !R) continue
            const mark = cur.mark
            const tc = final ? F + E + 99 : cc - i * Math.max(0, pp.motion.gap)
            const a0 = actPoint(L, mark, 0)
            const fl = arcCurve(L.park, a0, i)
            let pos: Pt = L.park,
                e = 0,
                tiltP = 0,
                fx = 1,
                floatW = 1,
                since = -1
            let trailC: Pt[] | null = null,
                trailU = 0,
                trailOp = 0
            if (final) {
                e = 1
                tiltP = 1
                floatW = 0
                pos = restPoint(L, mark, mark === "select" ? T : 0)
            } else if (c < 0 || tc < 0) {
                pos = L.park
            } else if (tc < F) {
                const u = easeIO(tc / F)
                pos = bez(fl, u)
                trailC = fl
                trailU = u
                trailOp = 1
                floatW = Math.max(0, 1 - (tc / F) * 3)
            } else if (tc < F + E) {
                e = easeIO((tc - F) / E)
                pos = actPoint(L, mark, e)
                trailC = fl
                trailU = 1
                trailOp = 1 - (tc - F) / 0.7
                floatW = 0
            } else {
                e = 1
                since = tc - F - E
                tiltP = springy(since / 0.9, 0.5)
                pos = restPoint(L, mark, mark === "select" ? T * tiltP : 0)
                floatW = clamp(since / 0.5)
                trailC = fl
                trailU = 1
                trailOp = 1 - (tc - F) / 0.7
            }
            if (exiting) {
                const hp = restPoint(L, mark, mark === "select" ? T : 0)
                const ex = easeIO(xT)
                const ec = arcCurve(hp, L.park, i + 1)
                pos = xT < 1 ? bez(ec, ex) : L.park
                fx = 1 - clamp(xT * 1.6)
                tiltP = fx
                since = -1
                floatW =
                    xT < 1
                        ? Math.max(0, 1 - xT * 3)
                        : clamp(((xT - 1) * X) / 0.5)
                trailC = ec
                trailU = ex
                trailOp = xT < 1 ? 1 : 1 - ((xT - 1) * X) / 0.7
            }
            const ang = T * tiltP

            // text reactions
            const live = final || (c >= 0 && tc >= 0)
            if (live && cur.reaction !== "none") {
                const tinted =
                    cur.reaction === "tint" &&
                    (final || tc >= F + E * 0.5) &&
                    !(exiting && xT > 0.4)
                for (let g = L.range[0], k = 0; g < L.range[1]; g++) {
                    if (PP.glyphs[g].space) continue
                    const b = geo.glyph[g]
                    if (!b) continue
                    if (tinted) tints[g] = cur.color
                    if (cur.reaction === "tilt" && ang) {
                        const cc2 = { x: b.x + b.w / 2, y: b.y + b.h * 0.55 }
                        const q = spin(cc2, L.c, ang)
                        rdx[g] += q.x - cc2.x
                        rdy[g] += q.y - cc2.y
                        rrot[g] += ang
                    }
                    if (cur.reaction === "pop" && since >= 0) {
                        const r = since - k * 0.04
                        if (r > 0 && r < 1.2) {
                            const amp =
                                Math.exp(-3.5 * r) * Math.sin(r * Math.PI * 3.2)
                            rsc[g] *= 1 + 0.32 * amp
                            rdy[g] -= b.h * 0.12 * amp
                        }
                    }
                    k++
                }
            }

            // marks
            const on = e > 0.001 ? fx : 0
            if (mark === "select" && R.box) {
                const B = L.box
                R.box.style.opacity = String(on)
                R.box.style.width = `${Math.max(0, B.w * e)}px`
                R.box.style.height = `${Math.max(0, B.h * e)}px`
                R.box.style.transformOrigin = `${B.w / 2}px ${B.h / 2}px`
                R.box.style.transform = `translate(${B.x}px, ${B.y}px) rotate(${ang}deg)`
            } else if (
                mark === "highlight" ||
                mark === "underline" ||
                mark === "strike"
            ) {
                let before = 0
                const dist = e * L.total
                for (let j = 0; j < 4; j++) {
                    const el = R.segs[j],
                        sg = L.segs[j]
                    if (!el) continue
                    if (!sg) {
                        el.style.opacity = "0"
                        continue
                    }
                    const gm = lineGeom(mark, sg, th)
                    const f = clamp((dist - before) / sg.w)
                    before += sg.w
                    el.style.width = `${gm.w}px`
                    el.style.height = `${gm.h}px`
                    el.style.transform = `translate(${gm.x}px, ${gm.y}px) scaleX(${f})`
                    el.style.opacity = f > 0 ? String(fx) : "0"
                }
            } else if (mark === "ring" && R.ring) {
                const key = `${M.ver}:${rot}`
                if (s.ringKey[i] !== key) {
                    R.ring.setAttribute("d", L.ringD)
                    s.ringKey[i] = key
                }
                R.ring.style.strokeDashoffset = String(1 - e)
                R.ring.style.opacity = String(on)
            } else if (mark === "note" && R.pin && R.bubble) {
                const sc = springy(e, 0.55)
                R.pin.style.opacity = String(on)
                R.pin.style.transform = `translate(${L.pin.x - 6}px, ${L.pin.y - 6}px) scale(${e > 0 ? 1 : 0})`
                R.bubble.style.opacity = String(on)
                R.bubble.style.transformOrigin = `${L.flip ? 100 : 0}% ${L.down ? 0 : 100}%`
                R.bubble.style.transform = `translate(${L.pin.x + (L.flip ? -10 : 10)}px, ${L.pin.y + L.drop}px) translate(${L.flip ? -100 : 0}%, ${L.down ? 0 : -100}%) scale(${(sc * M.bs).toFixed(3)})`
            }

            // ripple
            if (R.ripple) {
                let r = -1,
                    at: Pt = a0
                if (pp.ambience.ripple && !final && !exiting && c >= 0) {
                    const r2 = tc - F - E,
                        r1 = tc - F
                    if (r2 >= 0 && r2 < 0.6) {
                        r = r2
                        at = actPoint(L, mark, 1)
                    } else if (r1 >= 0 && r1 < 0.6) r = r1
                }
                if (r >= 0) {
                    const k = r / 0.6
                    R.ripple.style.opacity = String(0.6 * (1 - k))
                    R.ripple.style.transform = `translate(${at.x}px, ${at.y}px) scale(${(0.3 + 1.4 * easeOut(k)) * M.bs})`
                } else R.ripple.style.opacity = "0"
            }

            // trail
            if (R.trail) {
                if (
                    pp.ambience.trail &&
                    trailC &&
                    trailOp > 0 &&
                    trailU > 0.001
                ) {
                    let d = ""
                    for (let k = 0; k <= 20; k++) {
                        const q = bez(trailC, (trailU * k) / 20)
                        d += `${k ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`
                    }
                    R.trail.setAttribute("d", d)
                    R.trail.style.opacity = String(0.65 * clamp(trailOp))
                } else R.trail.style.opacity = "0"
            }

            // cursor
            if (R.cursor) {
                const fo = pp.ambience.float * floatW * (final ? 0 : 1)
                const depth = 0.6 + (i % 4) * 0.25
                const x =
                    pos.x +
                    Math.sin(now * 1.3 + i * 1.9) * fo +
                    s.px * pp.ambience.parallax * depth
                const y =
                    pos.y +
                    Math.cos(now * 1.05 + i * 2.6) * fo * 0.8 +
                    s.py * pp.ambience.parallax * depth
                R.cursor.style.opacity = String(shown ? cOp : 0)
                R.cursor.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${M.bs})`
            }
        }

        // write glyphs
        for (let g = 0; g < G; g++) {
            if (PP.glyphs[g].space) continue
            const inner = inners.current[g]
            if (!inner) continue
            const lead =
                rdx[g] || rdy[g] || rrot[g]
                    ? `translate(${rdx[g].toFixed(2)}px, ${rdy[g].toFixed(2)}px) rotate(${rrot[g].toFixed(2)}deg) `
                    : ""
            const tf =
                lead +
                (rsc[g] !== 1 ? `scale(${rsc[g].toFixed(3)}) ` : "") +
                base[g]
            if (s.tf[g] !== tf) {
                inner.style.transform = tf
                s.tf[g] = tf
            }
            inner.style.opacity = String(op[g])
            const fill = fills.current[g]
            if (fill) {
                fill.style.opacity = String(fop[g])
                const col = tints[g] || ""
                if (fill.style.color !== col) fill.style.color = col
            }
            const ol = outlines.current[g]
            if (ol) ol.style.clipPath = clip[g]
        }
        return busy
    }

    const layoutKey = JSON.stringify([
        p.text,
        p.font,
        p.padding,
        p.cursors,
        p.aim,
        p.motion.lane,
        p.badge,
        p.reveal.style,
    ])
    useLayoutEffect(() => {
        S.current.tf = []
        S.current.ringKey = []
        rebuildRef.current()
    }, [layoutKey])

    // paint the current frame synchronously after every render (no loop here)
    useLayoutEffect(() => {
        paintRef.current(performance.now() / 1000)
        wakeRef.current()
    })

    useEffect(() => {
        const stage = stageRef.current
        if (!stage) return
        const s = S.current
        let raf = 0
        let alive = true
        let inView = false
        let tabOn = typeof document === "undefined" ? true : !document.hidden
        const mq =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        s.reduced = !!(mq && mq.matches)

        const permit = () => alive && inView && tabOn && !s.reduced
        const frame = () => {
            raf = 0
            if (!permit()) return
            const busy = paintRef.current(performance.now() / 1000)
            if (busy && permit()) raf = requestAnimationFrame(frame)
        }
        const wake = () => {
            if (!raf && permit()) raf = requestAnimationFrame(frame)
        }
        const park = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            s.tx = s.ty = s.px = s.py = 0
        }
        wakeRef.current = wake

        const begin = () => {
            if (s.started) return
            s.started = true
            const pp = propsRef.current
            if (pp.motion.trigger === "hover") return
            const now = performance.now() / 1000
            s.revealT0 = now
            s.cursorT0 = now + Math.max(0, pp.motion.delay)
        }
        if (propsRef.current.motion.trigger === "mount") begin()

        const onVis = () => {
            tabOn = !document.hidden
            if (tabOn) wake()
            else park()
        }
        document.addEventListener("visibilitychange", onVis)

        const onMq = () => {
            s.reduced = !!(mq && mq.matches)
            paintRef.current(performance.now() / 1000)
            if (s.reduced) park()
            else wake()
        }
        if (mq) {
            if (mq.addEventListener) mq.addEventListener("change", onMq)
            else if ((mq as any).addListener) (mq as any).addListener(onMq)
        }

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined") {
            inView = true
            if (propsRef.current.motion.trigger === "scroll") begin()
            wake()
        } else {
            io = new IntersectionObserver(
                (entries) => {
                    for (const en of entries) inView = en.isIntersecting
                    if (inView) {
                        if (propsRef.current.motion.trigger === "scroll")
                            begin()
                        paintRef.current(performance.now() / 1000)
                        wake()
                    } else park()
                },
                { threshold: 0.15 }
            )
            io.observe(stage)
        }

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                S.current.ringKey = []
                rebuildRef.current()
                paintRef.current(performance.now() / 1000)
                wake()
            })
            ro.observe(stage)
        }
        const fonts: any =
            typeof document !== "undefined" ? (document as any).fonts : null
        if (fonts && fonts.ready) {
            fonts.ready.then(() => {
                if (!alive) return
                S.current.ringKey = []
                rebuildRef.current()
                paintRef.current(performance.now() / 1000)
                wake()
            })
        }

        return () => {
            alive = false
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            document.removeEventListener("visibilitychange", onVis)
            if (mq) {
                if (mq.removeEventListener)
                    mq.removeEventListener("change", onMq)
                else if ((mq as any).removeListener)
                    (mq as any).removeListener(onMq)
            }
            if (io) io.disconnect()
            if (ro) ro.disconnect()
            wakeRef.current = () => {}
        }
    }, [])

    const onEnter = () => {
        const pp = propsRef.current,
            s = S.current
        if (pp.motion.trigger !== "hover") return
        const now = performance.now() / 1000
        const tm = timing(pp)
        if (
            s.cursorT0 == null ||
            (!pp.motion.loop && now - s.cursorT0 > tm.core + 0.2)
        )
            s.cursorT0 = now
        s.started = true
        wakeRef.current()
    }
    const onMove = (ev: React.PointerEvent) => {
        const st = stageRef.current
        if (!st || !propsRef.current.ambience.parallax) return
        const r = st.getBoundingClientRect()
        S.current.tx = clamp(
            ((ev.clientX - r.left) / (r.width || 1) - 0.5) * 2,
            -1,
            1
        )
        S.current.ty = clamp(
            ((ev.clientY - r.top) / (r.height || 1) - 0.5) * 2,
            -1,
            1
        )
        wakeRef.current()
    }
    const onLeave = () => {
        S.current.tx = 0
        S.current.ty = 0
        wakeRef.current()
    }
    const onClick = () => {
        const pp = propsRef.current,
            s = S.current
        if (!pp.interaction.replay || pp.interaction.link) return
        const now = performance.now() / 1000
        s.started = true
        if (pp.motion.trigger === "hover") s.cursorT0 = now
        else {
            s.revealT0 = now
            s.cursorT0 = now + Math.max(0, pp.motion.delay)
        }
        wakeRef.current()
    }

    const stroke = p.reveal.on && p.reveal.style === "stroke"
    const origin = p.reveal.style === "flip" ? "50% 100%" : "50% 55%"
    const th = Math.max(2, p.selection.stroke * 1.6)
    const hs = p.selection.handle

    const content = (
        <div
            ref={stageRef}
            aria-label={p.text}
            onPointerEnter={onEnter}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            onClick={onClick}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: p.background,
                padding: p.padding,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor:
                    p.interaction.link || p.interaction.replay
                        ? "pointer"
                        : "default",
                ...p.style,
            }}
        >
            {/* under layer — highlights sit behind the type */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            >
                {p.cursors.map((c, i) =>
                    c.mark === "highlight"
                        ? [0, 1, 2, 3].map((j) => (
                              <div
                                  key={`${i}-${j}`}
                                  ref={(el) => (slot(i).segs[j] = el)}
                                  style={{
                                      position: "absolute",
                                      left: 0,
                                      top: 0,
                                      opacity: 0,
                                      borderRadius: 3,
                                      background: tint(c.color, 30),
                                      transformOrigin: "0 50%",
                                      willChange: "transform",
                                  }}
                              />
                          ))
                        : null
                )}
            </div>

            <div
                aria-hidden
                style={{
                    position: "relative",
                    width: "100%",
                    color: p.color,
                    textAlign: "center",
                    fontSize: 34,
                    lineHeight: 1.3,
                    letterSpacing: "-0.02em",
                    fontWeight: 600,
                    fontFamily: "Inter, system-ui, sans-serif",
                    ...p.font,
                    overflowWrap: "normal",
                    wordBreak: "normal",
                    userSelect: "none",
                }}
            >
                {P.tokens.map((tk, ti) =>
                    tk.kind === "br" ? (
                        <br key={ti} />
                    ) : tk.kind === "space" ? (
                        <React.Fragment key={ti}> </React.Fragment>
                    ) : (
                        <span
                            key={ti}
                            style={{
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {tk.idx.map((g) => (
                                <span
                                    key={g}
                                    ref={(el) => (cells.current[g] = el)}
                                    style={{
                                        display: "inline-block",
                                        position: "relative",
                                    }}
                                >
                                    <span
                                        ref={(el) => (inners.current[g] = el)}
                                        style={{
                                            display: "inline-block",
                                            position: "relative",
                                            transformOrigin: origin,
                                            willChange: "transform, opacity",
                                        }}
                                    >
                                        <span
                                            ref={(el) =>
                                                (fills.current[g] = el)
                                            }
                                            style={{
                                                transition: "color 0.45s ease",
                                            }}
                                        >
                                            {P.glyphs[g].ch}
                                        </span>
                                        {stroke && (
                                            <span
                                                ref={(el) =>
                                                    (outlines.current[g] = el)
                                                }
                                                style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    top: 0,
                                                    color: "transparent",
                                                    WebkitTextStroke: `${p.reveal.outline}px ${p.reveal.outlineColor}`,
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                {P.glyphs[g].ch}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            ))}
                        </span>
                    )
                )}
            </div>

            {/* vector layer — trails and rings */}
            <svg
                width="100%"
                height="100%"
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                    pointerEvents: "none",
                }}
            >
                {p.cursors.map((c, i) => (
                    <g key={i}>
                        {c.mark === "ring" && (
                            <path
                                ref={(el) => (slot(i).ring = el)}
                                fill="none"
                                stroke={c.color}
                                strokeWidth={Math.max(
                                    1.5,
                                    p.selection.stroke * 1.4
                                )}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                pathLength={1}
                                strokeDasharray="1 1"
                                style={{ opacity: 0 }}
                            />
                        )}
                        <path
                            ref={(el) => (slot(i).trail = el)}
                            fill="none"
                            stroke={c.color}
                            strokeWidth={1.5}
                            strokeDasharray="3 6"
                            strokeLinecap="round"
                            style={{ opacity: 0 }}
                        />
                    </g>
                ))}
            </svg>

            {/* over layer — marks, ripples, cursors */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            >
                {p.cursors.map((c, i) => (
                    <React.Fragment key={i}>
                        {c.mark === "select" && (
                            <div
                                ref={(el) => (slot(i).box = el)}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    opacity: 0,
                                    boxSizing: "border-box",
                                    border: `${p.selection.stroke}px solid ${c.color}`,
                                    background: tint(c.color, p.selection.fill),
                                    willChange: "transform, width, height",
                                }}
                            >
                                {hs > 0 &&
                                    [
                                        { left: -hs / 2, top: -hs / 2 },
                                        { right: -hs / 2, top: -hs / 2 },
                                        { left: -hs / 2, bottom: -hs / 2 },
                                        { right: -hs / 2, bottom: -hs / 2 },
                                    ].map((pos, k) => (
                                        <div
                                            key={k}
                                            style={{
                                                position: "absolute",
                                                width: hs,
                                                height: hs,
                                                background: "#FFFFFF",
                                                border: `1.5px solid ${c.color}`,
                                                boxSizing: "border-box",
                                                ...pos,
                                            }}
                                        />
                                    ))}
                            </div>
                        )}
                        {(c.mark === "underline" || c.mark === "strike") &&
                            [0, 1, 2, 3].map((j) => (
                                <div
                                    key={j}
                                    ref={(el) => (slot(i).segs[j] = el)}
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        opacity: 0,
                                        borderRadius: th,
                                        background: c.color,
                                        transformOrigin: "0 50%",
                                        willChange: "transform",
                                    }}
                                />
                            ))}
                        {c.mark === "note" && (
                            <>
                                <div
                                    ref={(el) => (slot(i).pin = el)}
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        width: 12,
                                        height: 12,
                                        opacity: 0,
                                        borderRadius: "50%",
                                        background: c.color,
                                        border: "2px solid #FFFFFF",
                                        boxSizing: "border-box",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                    }}
                                />
                                <div
                                    ref={(el) => (slot(i).bubble = el)}
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        opacity: 0,
                                        background: c.color,
                                        color: c.label,
                                        fontFamily: UI_FONT,
                                        fontSize: 13,
                                        fontWeight: 500,
                                        lineHeight: 1.3,
                                        padding: "7px 11px",
                                        borderRadius: 12,
                                        maxWidth: 200,
                                        whiteSpace: "nowrap",
                                        boxShadow:
                                            "0 6px 18px rgba(0,0,0,0.14)",
                                        willChange: "transform",
                                    }}
                                >
                                    {c.note}
                                </div>
                            </>
                        )}
                        <div
                            ref={(el) => (slot(i).ripple = el)}
                            style={{
                                position: "absolute",
                                left: -18,
                                top: -18,
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                border: `2px solid ${c.color}`,
                                boxSizing: "border-box",
                                opacity: 0,
                                transformOrigin: "50% 50%",
                            }}
                        />
                        <div
                            ref={(el) => (slot(i).cursor = el)}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                opacity: 0,
                                transformOrigin: "0 0",
                                willChange: "transform, opacity",
                            }}
                        >
                            <svg
                                width={18}
                                height={22}
                                viewBox="0 0 18 22"
                                style={{
                                    display: "block",
                                    overflow: "visible",
                                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
                                }}
                            >
                                <path
                                    d={ARROW}
                                    fill={c.color}
                                    stroke="#FFFFFF"
                                    strokeWidth={1.4}
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <div
                                style={{
                                    position: "absolute",
                                    left: 14,
                                    top: 19,
                                    background: c.badge,
                                    color: c.label,
                                    fontFamily: UI_FONT,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    lineHeight: 1,
                                    padding: "5px 8px",
                                    borderRadius: p.badge.radius,
                                    whiteSpace: "nowrap",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                            >
                                {c.name}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
            <span
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                }}
            >
                {p.text}
            </span>
        </div>
    )

    return p.interaction.link ? (
        <a
            href={p.interaction.link}
            target={p.interaction.newTab ? "_blank" : undefined}
            rel="noopener"
            style={{
                display: "block",
                width: "100%",
                height: "100%",
                textDecoration: "none",
                color: "inherit",
            }}
        >
            {content}
        </a>
    ) : (
        content
    )
}

/* ======================================================= property controls */

addPropertyControls(Conclave, {
    text: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: BASE.text,
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 34,
            lineHeight: "1.3em",
            letterSpacing: "-0.02em",
            textAlign: "center",
        },
    },
    color: { type: ControlType.Color, title: "Text", defaultValue: BASE.color },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: BASE.background,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: BASE.padding,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    aim: {
        type: ControlType.Enum,
        title: "Targeting",
        options: ["auto", "percent", "word", "char"],
        optionTitles: [
            "Auto Balance",
            "Percentage",
            "Word Index",
            "Character Index",
        ],
        defaultValue: "auto",
        description:
            "Auto spreads cursors across the line. Other modes read each cursor's At and Span.",
    },
    cursors: {
        type: ControlType.Array,
        title: "Cursors",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Guest",
                },
                color: {
                    type: ControlType.Color,
                    title: "Cursor",
                    defaultValue: "#FF5A36",
                },
                badge: {
                    type: ControlType.Color,
                    title: "Badge",
                    defaultValue: "#FF5A36",
                },
                label: {
                    type: ControlType.Color,
                    title: "Label",
                    defaultValue: "#FFFFFF",
                },
                mark: {
                    type: ControlType.Enum,
                    title: "Effect",
                    options: [
                        "select",
                        "highlight",
                        "underline",
                        "ring",
                        "strike",
                        "note",
                    ],
                    optionTitles: [
                        "Selection Box",
                        "Highlight",
                        "Underline",
                        "Ring",
                        "Strike",
                        "Comment",
                    ],
                    defaultValue: "select",
                },
                reaction: {
                    type: ControlType.Enum,
                    title: "Reaction",
                    options: ["none", "pop", "tint", "tilt"],
                    optionTitles: [
                        "None",
                        "Elastic Pop",
                        "Color Tint",
                        "Box Tilt",
                    ],
                    defaultValue: "pop",
                },
                note: {
                    type: ControlType.String,
                    title: "Comment",
                    defaultValue: "Looks great",
                    hidden: (o: any) => o.mark !== "note",
                },
                at: {
                    type: ControlType.Number,
                    title: "At",
                    defaultValue: 1,
                    min: 0,
                    max: 500,
                    step: 1,
                    description:
                        "% in Percentage, 1-based index in Word / Character.",
                },
                span: {
                    type: ControlType.Number,
                    title: "Span",
                    defaultValue: 1,
                    min: 1,
                    max: 500,
                    step: 1,
                },
            },
        },
        defaultValue: SEED,
    },
    reveal: {
        type: ControlType.Object,
        title: "Reveal",
        controls: {
            on: {
                type: ControlType.Boolean,
                title: "Text Reveal",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                hidden: (o: any) => o.on === false,
                options: ["rise", "flip", "stroke", "type"],
                optionTitles: [
                    "Spring Rise",
                    "Flip Up",
                    "Stroke Draw",
                    "Typewriter",
                ],
                defaultValue: BASE.reveal.style,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                hidden: (o: any) => o.on === false,
                defaultValue: BASE.reveal.duration,
                min: 0.1,
                max: 4,
                step: 0.05,
                unit: "s",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                hidden: (o: any) => o.on === false,
                defaultValue: BASE.reveal.stagger,
                min: 0,
                max: 0.3,
                step: 0.005,
                unit: "s",
            },
            bounce: {
                type: ControlType.Number,
                title: "Bounce",
                defaultValue: BASE.reveal.bounce,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (o: any) =>
                    o.on === false ||
                    (o.style !== "rise" && o.style !== "flip"),
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                hidden: (o: any) => o.on === false,
                defaultValue: BASE.reveal.delay,
                min: 0,
                max: 5,
                step: 0.05,
                unit: "s",
            },
            outline: {
                type: ControlType.Number,
                title: "Stroke",
                defaultValue: BASE.reveal.outline,
                min: 0,
                max: 6,
                step: 0.1,
                unit: "px",
                hidden: (o: any) => o.on === false || o.style !== "stroke",
            },
            outlineColor: {
                type: ControlType.Color,
                title: "Stroke Color",
                defaultValue: BASE.reveal.outlineColor,
                hidden: (o: any) => o.on === false || o.style !== "stroke",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            trigger: {
                type: ControlType.Enum,
                title: "Trigger",
                options: ["scroll", "mount", "hover"],
                optionTitles: ["In View", "On Load", "On Hover"],
                defaultValue: BASE.motion.trigger,
            },
            delay: {
                type: ControlType.Number,
                title: "Cursor Delay",
                defaultValue: BASE.motion.delay,
                min: 0,
                max: 6,
                step: 0.05,
                unit: "s",
            },
            gap: {
                type: ControlType.Number,
                title: "Cursor Stagger",
                defaultValue: BASE.motion.gap,
                min: 0,
                max: 3,
                step: 0.05,
                unit: "s",
            },
            flight: {
                type: ControlType.Number,
                title: "Flight",
                defaultValue: BASE.motion.flight,
                min: 0.2,
                max: 4,
                step: 0.05,
                unit: "s",
            },
            act: {
                type: ControlType.Number,
                title: "Effect",
                defaultValue: BASE.motion.act,
                min: 0.2,
                max: 4,
                step: 0.05,
                unit: "s",
            },
            hold: {
                type: ControlType.Number,
                title: "Hold",
                defaultValue: BASE.motion.hold,
                min: 0,
                max: 10,
                step: 0.1,
                unit: "s",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: BASE.motion.loop,
            },
            rest: {
                type: ControlType.Number,
                title: "Loop Delay",
                defaultValue: BASE.motion.rest,
                min: 0,
                max: 10,
                step: 0.1,
                unit: "s",
                hidden: (o: any) => !o.loop,
            },
            lane: {
                type: ControlType.Enum,
                title: "Park Lane",
                options: ["auto", "top", "bottom", "right"],
                optionTitles: ["Auto", "Top", "Bottom", "Right"],
                defaultValue: BASE.motion.lane,
            },
        },
    },
    selection: {
        type: ControlType.Object,
        title: "Selection",
        controls: {
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                defaultValue: BASE.selection.tilt,
                min: -30,
                max: 30,
                step: 0.5,
                unit: "°",
            },
            stroke: {
                type: ControlType.Number,
                title: "Stroke",
                defaultValue: BASE.selection.stroke,
                min: 0.5,
                max: 6,
                step: 0.25,
                unit: "px",
            },
            handle: {
                type: ControlType.Number,
                title: "Handles",
                defaultValue: BASE.selection.handle,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
            },
            fill: {
                type: ControlType.Number,
                title: "Fill",
                defaultValue: BASE.selection.fill,
                min: 0,
                max: 60,
                step: 1,
                unit: "%",
            },
        },
    },
    badge: {
        type: ControlType.Object,
        title: "Badges",
        controls: {
            smart: {
                type: ControlType.Boolean,
                title: "Smart Scale",
                defaultValue: BASE.badge.smart,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: BASE.badge.scale,
                min: 0.4,
                max: 2.5,
                step: 0.05,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: BASE.badge.radius,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
            },
        },
    },
    ambience: {
        type: ControlType.Object,
        title: "Ambience",
        controls: {
            trail: {
                type: ControlType.Boolean,
                title: "Trails",
                defaultValue: BASE.ambience.trail,
            },
            ripple: {
                type: ControlType.Boolean,
                title: "Click Ripple",
                defaultValue: BASE.ambience.ripple,
            },
            float: {
                type: ControlType.Number,
                title: "Idle Float",
                defaultValue: BASE.ambience.float,
                min: 0,
                max: 20,
                step: 0.5,
                unit: "px",
            },
            parallax: {
                type: ControlType.Number,
                title: "Parallax",
                defaultValue: BASE.ambience.parallax,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            replay: {
                type: ControlType.Boolean,
                title: "Click Replay",
                defaultValue: BASE.interaction.replay,
            },
            link: { type: ControlType.Link, title: "Link" },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: BASE.interaction.newTab,
                hidden: (o: any) => !o.link,
            },
        },
    },
})
