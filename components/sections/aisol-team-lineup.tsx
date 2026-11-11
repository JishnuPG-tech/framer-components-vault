// build: NEW-1110-teamlineup (2026-11-10) — Aisol Team Lineup, a team section with department chips
// @framerDisableUnlink
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import type { CSSProperties, ReactNode, RefObject } from "react"

/*
 * Aisol Team Lineup
 * A team section. People stand shoulder to shoulder in one line of tall
 * cards; one person has stepped forward (wider, lifted, full colour) and
 * their name, role, bio and links show underneath.
 *
 * Department chips sit above the line ("All 9 · Design 3 · Engineering 4"),
 * counted from the list. A chip is a filter: everyone outside that
 * department steps back out of the line (the card folds to zero width) and
 * the rest close up; the first person left steps forward. The same chip
 * again, or "All", brings everyone back.
 *
 * Every move is a CSS transition (width, transform, filter, opacity).
 * No requestAnimationFrame, no timers, no observers, nothing at rest.
 * Arrow keys, Home and End on the section move the person in front. On
 * narrow frames the line is a native sideways scroll strip. The static
 * renderer draws the same first frame.
 */

type ImageValue = { src?: string; srcSet?: string; alt?: string }
type Member = {
    name?: string
    role?: string
    team?: string
    bio?: string
    photo?: ImageValue
    tint?: string
    link1?: string
    url1?: string
    link2?: string
    url2?: string
    link3?: string
    url3?: string
}
type Content = { heading?: string; subheading?: string }
type FilterGroup = { chips?: boolean; counts?: boolean; all?: string; start?: string }
type Layout = { cardWidth?: number; frontWidth?: number; overlap?: number; height?: number; lift?: number; duration?: number }
type Look = { background?: string; surface?: string; text?: string; muted?: string; accent?: string; line?: string; radius?: number; dim?: number }
type TypeGroup = { font?: Record<string, unknown>; textSize?: number }
type Hiring = { show?: boolean; title?: string; text?: string; link?: string }
type Labels = {
    section?: string
    filters?: string
    chip?: string
    chipOne?: string
    all?: string
    position?: string
    showing?: string
    lineup?: string
    links?: string
    empty?: string
}
type Props = {
    members?: Member[]
    content?: Content
    filter?: FilterGroup
    layout?: Layout
    look?: Look
    type?: TypeGroup
    hiring?: Hiring
    labels?: Labels
    style?: CSSProperties
}

const DEMO: Member[] = [
    { name: "Mira Halvorsen", role: "Design lead", team: "Design", tint: "#F2C6A0", bio: "Keeps every project tied to one clear goal and runs the weekly critique. Sketches on paper first, always.", link1: "Portfolio", url1: "", link2: "Contact", url2: "" },
    { name: "Ravi Castellan", role: "Engineering lead", team: "Engineering", tint: "#A9C8E8", bio: "Plans the build, reviews every release and keeps the test suite honest. Happiest when a page loads before you blink.", link1: "Notes", url1: "", link2: "Contact", url2: "" },
    { name: "Dara Whitcombe", role: "Head of operations", team: "Operations", tint: "#C4D69B", bio: "Turns client calls into schedules people can actually keep. Owns contracts, invoices and the studio calendar.", link1: "Contact", url1: "" },
    { name: "Hana Petrovic", role: "Frontend engineer", team: "Engineering", tint: "#C9C3E6", bio: "Builds the interfaces our designers draw, down to the focus rings. Cares about keyboards and small screens.", link1: "Notes", url1: "", link2: "Contact", url2: "" },
    { name: "Jun Arata", role: "Product designer", team: "Design", tint: "#F0D98C", bio: "Designs the flows between screens and tests them with real visitors before anything ships. Collects tiny UI details.", link1: "Portfolio", url1: "", link2: "Notes", url2: "", link3: "Contact", url3: "" },
    { name: "Oskar Velde", role: "Backend engineer", team: "Engineering", tint: "#9FD4D0", bio: "Looks after data, sign-in and everything that has to keep running at night. Writes the runbooks nobody else wants to.", link1: "Notes", url1: "" },
    { name: "Nils Abara", role: "Studio manager", team: "Operations", tint: "#D9C2A7", bio: "Keeps the studio stocked, booked and quiet enough to think. First stop for new joiners and visiting clients.", link1: "Contact", url1: "" },
    { name: "Elodie Brandt", role: "Brand designer", team: "Design", tint: "#E8B4B8", bio: "Shapes logos, type and colour so each client looks like themselves. Prints every palette before saying yes.", link1: "Portfolio", url1: "", link2: "Contact", url2: "" },
    { name: "Lucia Ferrand", role: "Mobile engineer", team: "Engineering", tint: "#B9D3C2", bio: "Builds the phone versions of our client apps and tests them on old devices first. Measures everything twice.", link1: "Notes", url1: "" },
]
const PALETTE = ["#F2C6A0", "#A9C8E8", "#C4D69B", "#C9C3E6", "#F0D98C", "#9FD4D0", "#D9C2A7", "#E8B4B8", "#B9D3C2"]

// ------------------------------------------------------------------ helpers
const num = (v: unknown, lo: number, hi: number, fb: number): number => {
    const n = typeof v === "number" ? v : Number(v)
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fb
}
const str = (v: unknown, fb = ""): string => (typeof v === "string" && v.trim() ? v.trim() : fb)
const fill = (tpl: string, vals: Record<string, string | number>): string => tpl.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m))
// R7: images only from https, data:image, blob or this site.
const safeImageUrl = (u: string | undefined): string => {
    const s = (u || "").trim()
    if (!s) return ""
    if (/^https:\/\//i.test(s)) return s
    if (/^http:\/\//i.test(s)) return "https://" + s.slice(7)
    if (/^(blob:|data:image\/)/i.test(s)) return s
    if (/^\/(?!\/)/.test(s) || /^\.\//.test(s)) return s
    return ""
}
const safeSrcSet = (s: string | undefined): string | undefined => {
    if (!s) return undefined
    const parts = s.split(",").map((part) => {
        const bits = part.trim().split(/\s+/)
        const url = safeImageUrl(bits[0])
        const size = bits[1] && /^\d+(\.\d+)?[wx]$/.test(bits[1]) ? " " + bits[1] : ""
        return url ? url + size : ""
    })
    return parts.length > 0 && parts.every((x) => x !== "") ? parts.join(", ") : undefined
}
// R57: an empty link goes to the home page; schemes we do not allow fall back to "#".
function safeHref(url: string | undefined): string {
    const s = (url || "").trim()
    if (!s || s === "#") return "/"
    if (/^(https?:|mailto:|tel:)/i.test(s)) return s
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return "#"
    return s
}
// Colours from the panel go into a CSS variable; keep only characters a colour can contain.
const safeColor = (v: unknown, fb: string): string => {
    const s = typeof v === "string" ? v.trim() : ""
    return s && /^[#(),.%\w\s-]+$/.test(s) ? s : fb
}
const initials = (name: string): string =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("") || "?"
const fontCss = (font?: Record<string, unknown>): CSSProperties => {
    if (!font) return {}
    const o: Record<string, unknown> = { ...font }
    delete o.fontSize
    delete o.lineHeight
    return o as CSSProperties
}
// QUALITY-10 A1: every size is Text Size (base 14) times a 1.125 step.
const SCALE = 1.125
const size = (base: number, n: number) => `${(base * Math.pow(SCALE, n)).toFixed(2)}px`
const teamKey = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase()

type Link = { label: string; href: string }
type Item = { key: string; name: string; first: string; role: string; team: string; tkey: string; bio: string; photo: ImageValue | null; tint: string; links: Link[] }
type Team = { key: string; label: string; count: number }

function normalize(list: Member[] | undefined): Item[] {
    const src = Array.isArray(list) ? list : DEMO
    return src.filter(Boolean).map((m, i) => {
        const name = str(m.name, `Person ${i + 1}`)
        const team = str(m.team)
        const photoSrc = safeImageUrl(m.photo?.src)
        const links: Link[] = []
        ;[
            [m.link1, m.url1],
            [m.link2, m.url2],
            [m.link3, m.url3],
        ].forEach(([label, url]) => {
            // raw value here; safeHref() runs once, on the <a> itself
            if (str(label)) links.push({ label: str(label), href: str(url) })
        })
        return {
            key: "m" + i,
            name,
            first: name.split(/\s+/)[0] || name,
            role: str(m.role),
            team,
            tkey: team ? teamKey(team) : "",
            bio: str(m.bio),
            photo: photoSrc ? { src: photoSrc, srcSet: safeSrcSet(m.photo?.srcSet), alt: str(m.photo?.alt) } : null,
            tint: safeColor(m.tint, PALETTE[i % PALETTE.length]),
            links,
        }
    })
}
// Departments in order of first appearance; the label keeps the first spelling.
function teamsOf(items: Item[]): Team[] {
    const out: Team[] = []
    items.forEach((it) => {
        if (!it.tkey) return
        const t = out.find((x) => x.key === it.tkey)
        if (t) t.count += 1
        else out.push({ key: it.tkey, label: it.team, count: 1 })
    })
    return out
}
const startKey = (start: string | undefined, teams: Team[]): string => {
    const k = teamKey(start || "")
    return k && teams.some((t) => t.key === k) ? k : ""
}
const visibleOf = (items: Item[], filter: string): number[] => {
    const out: number[] = []
    items.forEach((it, i) => {
        if (!filter || it.tkey === filter) out.push(i)
    })
    return out
}
const middle = (n: number) => Math.max(0, Math.floor((n - 1) / 2))

// ------------------------------------------------------------------ constant sheet (no interpolation; values come in as --tl-* variables)
const SHEET = `
.tl-root{position:relative;box-sizing:border-box;width:100%;display:flex;flex-direction:column;background:var(--tl-bg);color:var(--tl-text);container-type:inline-size;contain-intrinsic-inline-size:1200px;font-size:var(--tl-s0);line-height:1.5;-webkit-tap-highlight-color:transparent}
.tl-root *{box-sizing:border-box}
.tl-wrap{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:16px;padding:32px 0 32px}
@container (min-width:760px){.tl-wrap{gap:24px;padding:48px 0 40px}}
.tl-head{display:flex;flex-direction:column;align-items:center;gap:16px;padding:0 16px;text-align:center}
.tl-h{margin:0;font-size:var(--tl-s5);line-height:1.15;font-weight:700;letter-spacing:-.02em;overflow-wrap:break-word;text-wrap:balance}
@container (min-width:760px){.tl-h{font-size:var(--tl-s7)}}
.tl-sub{margin:-8px 0 0;max-width:36em;color:var(--tl-muted);overflow-wrap:break-word;text-wrap:balance}
.tl-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:0;padding:0}
.tl-chip{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 16px;border:1px solid var(--tl-line);border-radius:999px;background:var(--tl-surface);color:var(--tl-text);font:inherit;font-size:var(--tl-s0);font-weight:600;line-height:1.2;cursor:pointer;white-space:nowrap;transition:background-color .2s cubic-bezier(.2,.7,.2,1),color .2s cubic-bezier(.2,.7,.2,1),border-color .2s cubic-bezier(.2,.7,.2,1)}
.tl-n{color:var(--tl-muted);font-weight:500;font-variant-numeric:tabular-nums}
.tl-chip[aria-pressed=true]{background:var(--tl-text);border-color:var(--tl-text);color:var(--tl-bg)}
.tl-chip[aria-pressed=true]::before{content:"";width:6px;height:6px;border-radius:999px;background:currentColor;flex:none}
.tl-chip[aria-pressed=true] .tl-n{color:inherit;opacity:.72}
@media (hover:hover) and (pointer:fine){.tl-chip[aria-pressed=false]:hover{border-color:var(--tl-muted)}}
.tl-strip{--tl-cw:var(--tl-cw-s);--tl-fw:var(--tl-fw-s);--tl-ov:var(--tl-ov-s);--tl-hw:var(--tl-hw-s);--tl-ch:var(--tl-ch-s);--tl-hg:12px;position:relative;flex:1 1 calc(var(--tl-ch) + var(--tl-lift) + 56px);min-height:168px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;scroll-padding:0 16px;overscroll-behavior-x:contain;touch-action:pan-x pan-y;scrollbar-width:thin;padding:calc(var(--tl-lift) + 16px) 0 40px}
@container (min-width:760px){.tl-strip{--tl-cw:var(--tl-cw-l);--tl-fw:var(--tl-fw-l);--tl-ov:var(--tl-ov-l);--tl-hw:var(--tl-hw-l);--tl-ch:var(--tl-ch-l);--tl-hg:16px}}
.tl-row{position:relative;display:flex;align-items:stretch;width:max-content;height:100%;margin:0 auto;padding:0 16px 0 calc(16px + var(--tl-ov))}
@container (min-width:760px){.tl-row{padding:0 32px 0 calc(32px + var(--tl-ov))}}
.tl-card{position:relative;flex:0 0 auto;width:var(--tl-cw);min-width:0;height:100%;margin:0 0 0 calc(-1 * var(--tl-ov));padding:0;border:0;border-radius:var(--tl-r);overflow:hidden;background:var(--tl-tint);color:var(--tl-text);font:inherit;text-align:center;cursor:pointer;scroll-snap-align:center;box-shadow:0 0 0 3px var(--tl-bg),0 16px 24px -16px rgba(0,0,0,.38);transform-origin:50% 100%;transform:translateY(0) scale(.95);filter:saturate(var(--tl-dim));opacity:1;visibility:visible;transition:width var(--tl-dur) cubic-bezier(.2,.7,.2,1),margin var(--tl-dur) cubic-bezier(.2,.7,.2,1),transform var(--tl-dur) cubic-bezier(.2,.7,.2,1),filter var(--tl-dur) cubic-bezier(.2,.7,.2,1),opacity var(--tl-dur) cubic-bezier(.2,.7,.2,1),box-shadow var(--tl-dur) cubic-bezier(.2,.7,.2,1),visibility 0s linear 0s}
.tl-card[data-on=f]{width:var(--tl-fw);transform:translateY(calc(-1 * var(--tl-lift))) scale(1);filter:saturate(1);box-shadow:0 0 0 3px var(--tl-bg),0 24px 32px -18px rgba(0,0,0,.42)}
.tl-card[data-on=o]{width:0px;margin-left:0;transform:translateY(12px) scale(.9);opacity:0;visibility:hidden;pointer-events:none;transition:width var(--tl-dur) cubic-bezier(.4,0,.6,1),margin var(--tl-dur) cubic-bezier(.4,0,.6,1),transform var(--tl-dur) cubic-bezier(.4,0,.6,1),filter var(--tl-dur) cubic-bezier(.4,0,.6,1),opacity var(--tl-dur) cubic-bezier(.4,0,.6,1),box-shadow var(--tl-dur) cubic-bezier(.4,0,.6,1),visibility 0s linear var(--tl-dur)}
@media (hover:hover) and (pointer:fine){.tl-card[data-on=b]:hover{transform:translateY(-4px) scale(.95);filter:saturate(1)}}
.tl-art{position:absolute;inset:0;pointer-events:none}
.tl-fig{position:absolute;left:50%;bottom:0;height:80%;width:auto;aspect-ratio:2/3;transform:translateX(-50%);color:color-mix(in srgb,var(--tl-tint) 42%,#1E1B18)}
.tl-ini{position:absolute;left:0;right:0;top:14px;font-size:var(--tl-s1);font-weight:700;letter-spacing:.04em;color:color-mix(in srgb,var(--tl-tint) 35%,#1E1B18)}
.tl-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%;display:block;-webkit-user-drag:none}
.tl-tag{position:absolute;left:8px;right:8px;bottom:10px;padding:4px 8px;border-radius:999px;background:color-mix(in srgb,var(--tl-surface) 90%,transparent);color:var(--tl-text);font-size:var(--tl-sm);font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tl-hire{position:relative;flex:0 0 auto;width:var(--tl-hw);height:100%;margin-left:var(--tl-hg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px 8px;border:2px dashed color-mix(in srgb,var(--tl-accent) 55%,var(--tl-line));border-radius:var(--tl-r);background:color-mix(in srgb,var(--tl-surface) 55%,transparent);color:var(--tl-text);text-decoration:none;text-align:center;scroll-snap-align:center;transform-origin:50% 100%;transform:scale(.95);transition:background-color .2s cubic-bezier(.2,.7,.2,1),border-color .2s cubic-bezier(.2,.7,.2,1)}
.tl-plus{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;background:var(--tl-accent);color:var(--tl-surface);flex:none}
.tl-plus svg{width:16px;height:16px}
.tl-ht{font-weight:700;line-height:1.25;overflow-wrap:break-word;text-wrap:balance}
.tl-hx{color:var(--tl-muted);font-size:var(--tl-sm);line-height:1.35;overflow-wrap:break-word;text-wrap:balance}
@media (hover:hover) and (pointer:fine){.tl-hire:hover{background:var(--tl-surface);border-color:var(--tl-accent)}}
.tl-detail{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;max-width:640px;margin:-16px auto 0;padding:0 16px;text-align:center;animation:tl-in var(--tl-dur) cubic-bezier(.2,.7,.2,1) both}
@keyframes tl-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.tl-nm{margin:0;font-size:var(--tl-s3);line-height:1.25;font-weight:700;letter-spacing:-.01em;overflow-wrap:break-word;text-wrap:balance}
.tl-rl{margin:0;color:var(--tl-muted);overflow-wrap:break-word;text-wrap:balance}
.tl-bio{margin:4px 0 0;min-height:calc(1.55em * 3);line-height:1.55;overflow-wrap:break-word;text-wrap:pretty;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
.tl-lw{min-height:40px;display:flex;align-items:center;justify-content:center;margin-top:4px}
.tl-links{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:0;padding:0;list-style:none}
.tl-link{display:inline-flex;align-items:center;min-height:36px;padding:0 16px;border-radius:999px;border:1px solid var(--tl-line);background:var(--tl-surface);color:var(--tl-accent);font-size:var(--tl-sm);font-weight:600;text-decoration:none;transition:border-color .2s cubic-bezier(.2,.7,.2,1)}
@media (hover:hover) and (pointer:fine){.tl-link:hover{border-color:var(--tl-accent)}}
.tl-empty{display:flex;align-items:center;justify-content:center;min-height:200px;padding:24px;text-align:center;color:var(--tl-muted)}
.tl-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.tl-root :focus-visible{outline:2px solid var(--tl-text);outline-offset:3px}
.tl-still .tl-card,.tl-still .tl-chip,.tl-still .tl-hire,.tl-still .tl-link{transition:none}
.tl-still .tl-detail{animation:none}
@media (prefers-reduced-motion:reduce){.tl-card,.tl-chip,.tl-hire,.tl-link{transition:none}.tl-detail{animation:none}}
@media (forced-colors:active){.tl-card{border:1px solid CanvasText}.tl-card[data-on=f]{outline:3px solid Highlight}.tl-chip[aria-pressed=true]{outline:2px solid Highlight}}
`

// ------------------------------------------------------------------ pieces
const Figure = () => (
    <svg className="tl-fig" viewBox="0 0 200 300" aria-hidden="true" focusable="false">
        <circle cx="100" cy="104" r="44" fill="currentColor" />
        <path d="M14 300C14 222 52 172 100 172C148 172 186 222 186 300Z" fill="currentColor" />
    </svg>
)
const Plus = () => (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M8 2.5v11M2.5 8h11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

// ------------------------------------------------------------------ one view for the static and the live renderer
type View = { still: boolean; filter: string; active: number; announce?: string }
type Actions = {
    rootRef: RefObject<HTMLElement>
    stripRef: RefObject<HTMLDivElement>
    onFilter: (key: string) => void
    onPick: (rank: number) => void
}

function draw(p: Props, items: Item[], teams: Team[], v: View, uid: string, on?: Actions): ReactNode {
    const c = p.content || {}
    const F = p.filter || {}
    const Lay = p.layout || {}
    const look = p.look || {}
    const H = p.hiring || {}
    const L = p.labels || {}
    const ts = num(p.type?.textSize, 10, 28, 14)
    const cw = num(Lay.cardWidth, 80, 200, 112)
    const fw = Math.max(cw, num(Lay.frontWidth, 160, 440, 264))
    const ov = Math.min(num(Lay.overlap, 0, 48, 24), Math.floor(cw / 2))
    const ch = num(Lay.height, 240, 560, 320)
    const vis = visibleOf(items, v.filter)
    const n = vis.length
    const active = Math.min(Math.max(0, v.active), Math.max(0, n - 1))
    const rankOf = new Map<number, number>()
    vis.forEach((full, r) => rankOf.set(full, r))
    const cwS = Math.max(56, Math.round(cw * 0.64))
    const vars = {
        "--tl-bg": safeColor(look.background, "#F4F1EC"),
        "--tl-surface": safeColor(look.surface, "#FFFFFF"),
        "--tl-text": safeColor(look.text, "#1C1B19"),
        "--tl-muted": safeColor(look.muted, "#5E5A54"),
        "--tl-accent": safeColor(look.accent, "#A94E27"),
        "--tl-line": safeColor(look.line, "#DDD6CC"),
        "--tl-r": `${num(look.radius, 0, 40, 20)}px`,
        "--tl-dim": String(num(look.dim, 0, 100, 45) / 100),
        "--tl-cw-l": `${cw}px`,
        "--tl-fw-l": `${fw}px`,
        "--tl-ov-l": `${ov}px`,
        "--tl-hw-l": `${Math.max(cw, 128)}px`,
        "--tl-ch-l": `${ch}px`,
        "--tl-cw-s": `${cwS}px`,
        "--tl-fw-s": `${Math.max(cwS, Math.round(fw * 0.8))}px`,
        "--tl-ov-s": `${Math.min(Math.round(ov * 0.75), Math.floor(cwS / 2))}px`,
        "--tl-hw-s": `${Math.max(cwS, 112)}px`,
        "--tl-ch-s": `${Math.round(ch * 0.85)}px`,
        "--tl-lift": `${num(Lay.lift, 0, 40, 16)}px`,
        "--tl-dur": `${num(Lay.duration, 150, 800, 400)}ms`,
        "--tl-sm": size(ts, -1),
        "--tl-s0": size(ts, 0),
        "--tl-s1": size(ts, 1),
        "--tl-s3": size(ts, 3),
        "--tl-s5": size(ts, 5),
        "--tl-s7": size(ts, 7),
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        ...fontCss(p.type?.font),
    } as CSSProperties

    // R21: the same defaults as the controls; an empty string from the panel hides the line.
    const heading = str(c.heading ?? "Meet the team")
    const subheading = str(c.subheading ?? "Pick a team or a person to see who does what.")
    const chipsOn = F.chips !== false && teams.length > 0
    const counts = F.counts !== false
    const tPos = str(L.position, "{i} of {n}")
    const detailId = uid + "-detail"
    const front = n > 0 ? items[vis[active]] : null

    const cards = items.map((it, full) => {
        const r = rankOf.get(full)
        const shown = r !== undefined
        const state = !shown ? "o" : r === active ? "f" : "b"
        const label = shown ? `${it.name}${it.role ? ", " + it.role : ""}, ${fill(tPos, { i: (r as number) + 1, n })}` : undefined
        const style = { "--tl-tint": it.tint, zIndex: shown ? 60 - Math.abs((r as number) - active) : 0 } as CSSProperties
        return (
            <button
                key={it.key}
                type="button"
                className="tl-card"
                data-on={state}
                style={style}
                tabIndex={state === "f" ? 0 : -1}
                aria-pressed={shown ? state === "f" : undefined}
                aria-label={label}
                aria-controls={shown ? detailId : undefined}
                aria-hidden={shown ? undefined : "true"}
                {...(shown ? {} : ({ inert: "" } as Record<string, string>))}
                onClick={on && shown ? () => on.onPick(r as number) : undefined}
            >
                <span className="tl-art" aria-hidden="true">
                    <Figure />
                    <span className="tl-ini">{initials(it.name)}</span>
                    {it.photo ? <img className="tl-photo" src={safeImageUrl(it.photo.src)} srcSet={safeSrcSet(it.photo.srcSet)} sizes="(max-width: 760px) 240px, 440px" alt="" loading="lazy" decoding="async" draggable={false} /> : null}
                    <span className="tl-tag">{it.first}</span>
                </span>
            </button>
        )
    })

    const chips = chipsOn ? (
        <div className="tl-chips" role="group" aria-label={str(L.filters, "Filter by team")}>
            <button type="button" className="tl-chip" aria-pressed={v.filter === ""} aria-label={fill(str(L.all, "Show everyone, {n} people"), { n: items.length })} onClick={on ? () => on.onFilter("") : undefined}>
                <span>{str(F.all, "All")}</span>
                {counts ? <span className="tl-n">{items.length}</span> : null}
            </button>
            {teams.map((t) => {
                const pressed = v.filter === t.key
                const tpl = t.count === 1 ? str(L.chipOne, "Show {team}, 1 person") : str(L.chip, "Show {team}, {n} people")
                return (
                    <button key={t.key} type="button" className="tl-chip" aria-pressed={pressed} aria-label={fill(tpl, { team: t.label, n: t.count })} onClick={on ? () => on.onFilter(pressed ? "" : t.key) : undefined}>
                        <span>{t.label}</span>
                        {counts ? <span className="tl-n">{t.count}</span> : null}
                    </button>
                )
            })}
        </div>
    ) : null

    const hireOn = H.show !== false && items.length > 0
    return (
        <section ref={on ? on.rootRef : undefined} className={"tl-root" + (v.still ? " tl-still" : "")} style={{ ...p.style, ...vars }} aria-label={str(L.section, "Team")}>
            <style dangerouslySetInnerHTML={{ __html: SHEET }} />
            <div className="tl-wrap">
                {heading || subheading || chips ? (
                    <div className="tl-head">
                        {heading ? <h2 className="tl-h">{heading}</h2> : null}
                        {subheading ? <p className="tl-sub">{subheading}</p> : null}
                        {chips}
                    </div>
                ) : null}
                {items.length === 0 ? (
                    <div className="tl-empty">{str(L.empty, "Add people in the properties panel.")}</div>
                ) : (
                    <div ref={on ? on.stripRef : undefined} className="tl-strip" role="group" aria-label={str(L.lineup, "Team lineup")}>
                        <div className="tl-row">
                            {cards}
                            {hireOn ? (
                                <a className="tl-hire" href={safeHref(H.link)}>
                                    <span className="tl-plus" aria-hidden="true">
                                        <Plus />
                                    </span>
                                    <span className="tl-ht">{str(H.title, "We're hiring")}</span>{" "}
                                    {str(H.text ?? "See open roles") ? <span className="tl-hx">{str(H.text ?? "See open roles")}</span> : null}
                                </a>
                            ) : null}
                        </div>
                    </div>
                )}
                {front ? (
                    <div key={front.key} id={detailId} className="tl-detail">
                        <h3 className="tl-nm">{front.name}</h3>
                        {front.role || front.team ? <p className="tl-rl">{[front.role, front.team].filter(Boolean).join(" · ")}</p> : null}
                        <p className="tl-bio">{front.bio}</p>
                        <div className="tl-lw">
                            {front.links.length ? (
                                <ul className="tl-links" aria-label={fill(str(L.links, "Links for {name}"), { name: front.name })}>
                                    {front.links.map((l, i) => (
                                        <li key={i}>
                                            <a className="tl-link" href={safeHref(l.href)}>
                                                {l.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    </div>
                ) : null}
                <p className="tl-sr" aria-live="polite">
                    {v.announce || ""}
                </p>
            </div>
        </section>
    )
}

// ------------------------------------------------------------------ renderers
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 808
 */
export default function AisolTeamLineup(props: Props) {
    const isStatic = useIsStaticRenderer()
    return isStatic ? <StillLineup {...props} /> : <LiveLineup {...props} />
}

function startOf(props: Props, teams: Team[]): string {
    return props.filter?.chips !== false ? startKey(props.filter?.start, teams) : ""
}

// Canvas, export and thumbnails: the real first frame, no listeners, no transitions.
function StillLineup(props: Props) {
    const uid = "tl" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const items = normalize(props.members)
    const teams = teamsOf(items)
    const filter = startOf(props, teams)
    return <>{draw(props, items, teams, { still: true, filter, active: middle(visibleOf(items, filter).length) }, uid)}</>
}

function useReduced(): boolean {
    const [reduce, setReduce] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduce(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])
    return reduce
}

function LiveLineup(props: Props) {
    const uid = "tl" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const items = React.useMemo(() => normalize(props.members), [props.members])
    const teams = React.useMemo(() => teamsOf(items), [items])
    const L = props.labels || {}
    const reduce = useReduced()
    const rootRef = React.useRef<HTMLElement>(null)
    const stripRef = React.useRef<HTMLDivElement>(null)
    const start = startOf(props, teams)
    const [filter, setFilter] = React.useState(start)
    const [active, setActive] = React.useState(() => middle(visibleOf(items, start).length))
    const [announce, setAnnounce] = React.useState("")

    // R43: a new start department or a new list resets the view.
    React.useEffect(() => {
        setFilter(start)
        setActive(middle(visibleOf(items, start).length))
    }, [start, items])

    const n = visibleOf(items, filter).length
    const hire = props.hiring?.show !== false && items.length > 0
    const onFilter = React.useCallback(
        (key: string) => {
            const next = visibleOf(items, key)
            setFilter(key)
            setActive(0)
            setAnnounce(fill(str(L.showing, "Showing {n} of {total} people"), { n: next.length, total: items.length }))
        },
        [items, L.showing]
    )
    const onPick = React.useCallback((rank: number) => setActive(rank), [])

    const stateRef = React.useRef({ active, n, hire, reduce })
    stateRef.current = { active, n, hire, reduce }
    const focusFront = React.useRef(false)
    const mounted = React.useRef(false)

    // Keys: native listener on our own root (published sites do not deliver React key events reliably).
    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const onKey = (e: KeyboardEvent) => {
            if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
            const t = e.target as HTMLElement | null
            const tag = t?.tagName || ""
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
            const { active: a, n: count } = stateRef.current
            if (count === 0) return
            let to = -1
            if (e.key === "ArrowLeft") to = a - 1
            else if (e.key === "ArrowRight") to = a + 1
            else if (e.key === "Home") to = 0
            else if (e.key === "End") to = count - 1
            else return
            e.preventDefault()
            // only cards carry data-on; keep focus on the line when the key came from a card
            focusFront.current = !!t && t.tagName === "BUTTON" && t.getAttribute("data-on") !== null
            setActive(Math.max(0, Math.min(count - 1, to)))
        }
        root.addEventListener("keydown", onKey)
        return () => root.removeEventListener("keydown", onKey)
    }, [])

    // Bring the person in front into view in the scroll strip, from the final geometry of our own CSS variables.
    const centre = React.useCallback((smooth: boolean) => {
        const strip = stripRef.current
        const row = strip ? (strip.firstElementChild as HTMLElement | null) : null
        if (!strip || !row) return
        const cs = getComputedStyle(row)
        const px = (name: string) => parseFloat(cs.getPropertyValue(name)) || 0
        const cw = px("--tl-cw")
        const fw = px("--tl-fw")
        const ov = px("--tl-ov")
        const padL = parseFloat(cs.paddingLeft) || 0
        const padR = parseFloat(cs.paddingRight) || 0
        const { active: a, n: count, hire: h } = stateRef.current
        const total = padL + padR + (count > 0 ? (count - 1) * cw + fw - count * ov : 0) + (h ? px("--tl-hw") + px("--tl-hg") : 0)
        const room = strip.clientWidth
        let left = 0
        if (total > room + 1) {
            const mid = padL - ov + a * (cw - ov) + fw / 2
            left = Math.max(0, Math.min(total - room, mid - room / 2))
        }
        if (Math.abs(strip.scrollLeft - left) > 1) strip.scrollTo({ left, behavior: smooth ? "smooth" : "auto" })
    }, [])

    // After the person in front changes: keep keyboard focus on them and centre them.
    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const smooth = mounted.current && !stateRef.current.reduce
        mounted.current = true
        if (focusFront.current) {
            focusFront.current = false
            const card = root.querySelector('.tl-card[data-on="f"]') as HTMLElement | null
            if (card) card.focus({ preventScroll: true })
        }
        centre(smooth)
    }, [active, filter, n, centre])

    // While widths animate the strip can re-snap; centre once more when the front card has finished widening.
    React.useEffect(() => {
        const strip = stripRef.current
        if (!strip) return
        const onEnd = (e: TransitionEvent) => {
            const t = e.target as HTMLElement | null
            if (e.propertyName === "width" && t && t.getAttribute("data-on") === "f") centre(!stateRef.current.reduce)
        }
        strip.addEventListener("transitionend", onEnd)
        return () => strip.removeEventListener("transitionend", onEnd)
    }, [centre, items.length])

    return <>{draw(props, items, teams, { still: false, filter, active, announce }, uid, { rootRef, stripRef, onFilter, onPick })}</>
}

// ------------------------------------------------------------------ controls (8 top level)
addPropertyControls(AisolTeamLineup, {
    members: {
        type: ControlType.Array,
        title: "People",
        maxCount: 24,
        defaultValue: DEMO,
        description: "Chip counts are worked out from this list. At default sizes about 9 people fit a 1200px line; more scroll sideways.",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String as const, title: "Name", defaultValue: "New person", description: "Full name. The card shows the first word." },
                role: { type: ControlType.String as const, title: "Role", defaultValue: "", description: "Job title, optional." },
                team: { type: ControlType.String as const, title: "Team", defaultValue: "", description: "Department. People with the same text share a chip (case ignored)." },
                bio: { type: ControlType.String as const, title: "Bio", defaultValue: "", displayTextArea: true, description: "Two or three lines. Longer text is cut after three lines." },
                photo: { type: ControlType.ResponsiveImage as const, title: "Photo", description: "Optional. Empty shows a coloured panel with a figure and initials." },
                tint: { type: ControlType.Color as const, title: "Card Colour", optional: true, description: "Panel colour behind the figure. Empty picks one from a soft palette." },
                link1: { type: ControlType.String as const, title: "Link 1", defaultValue: "", description: "Button text. Empty hides the link." },
                url1: { type: ControlType.Link as const, title: "Link 1 URL", description: "Empty goes to the home page." },
                link2: { type: ControlType.String as const, title: "Link 2", defaultValue: "", description: "Button text. Empty hides the link." },
                url2: { type: ControlType.Link as const, title: "Link 2 URL", description: "Empty goes to the home page." },
                link3: { type: ControlType.String as const, title: "Link 3", defaultValue: "", description: "Button text. Empty hides the link." },
                url3: { type: ControlType.Link as const, title: "Link 3 URL", description: "Empty goes to the home page." },
            },
        },
    },
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            heading: { type: ControlType.String, title: "Heading", defaultValue: "Meet the team", description: "Section title (h2). Empty hides it." },
            subheading: { type: ControlType.String, title: "Subheading", defaultValue: "Pick a team or a person to see who does what.", description: "One line under the title. Empty hides it." },
        },
    },
    filter: {
        type: ControlType.Object,
        title: "Filter",
        controls: {
            chips: { type: ControlType.Boolean, title: "Chips", defaultValue: true, description: "Department chips above the line. Each chip filters the line." },
            counts: { type: ControlType.Boolean, title: "Counts", defaultValue: true, description: "Head count next to each chip.", hidden: (f: Partial<FilterGroup>) => f.chips === false },
            all: { type: ControlType.String, title: "All Chip", defaultValue: "All", description: "Text of the chip that shows everyone.", hidden: (f: Partial<FilterGroup>) => f.chips === false },
            start: { type: ControlType.String, title: "Start On", defaultValue: "", placeholder: "All", description: "Department already picked when the page opens, e.g. Design. Empty or unknown = All.", hidden: (f: Partial<FilterGroup>) => f.chips === false },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: { type: ControlType.Number, title: "Card Width", defaultValue: 112, min: 80, max: 200, step: 4, unit: "px", description: "People waiting in the line. About 64% of this on narrow frames." },
            frontWidth: { type: ControlType.Number, title: "Front Width", defaultValue: 264, min: 160, max: 440, step: 8, unit: "px", description: "The person in front. About 80% of this on narrow frames." },
            overlap: { type: ControlType.Number, title: "Overlap", defaultValue: 24, min: 0, max: 48, step: 4, unit: "px", description: "How far neighbours stand behind each other's shoulders." },
            height: { type: ControlType.Number, title: "Height", defaultValue: 320, min: 240, max: 560, step: 8, unit: "px", description: "Card height. Shrinks to fit when the frame has a fixed height." },
            lift: { type: ControlType.Number, title: "Step Forward", defaultValue: 16, min: 0, max: 40, step: 4, unit: "px", description: "How far the person in front rises." },
            duration: { type: ControlType.Number, title: "Duration", defaultValue: 400, min: 150, max: 800, step: 10, unit: "ms", description: "Length of every step, fold and slide. Reduced motion = instant." },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#F4F1EC", description: "Section background and the gap ring between cards." },
            surface: { type: ControlType.Color, title: "Surface", defaultValue: "#FFFFFF", description: "Chips, name tags and link buttons." },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#1C1B19", description: "Main text, the pressed chip and the focus ring." },
            muted: { type: ControlType.Color, title: "Muted", defaultValue: "#5E5A54", description: "Subheading, role line and counts." },
            accent: { type: ControlType.Color, title: "Accent", defaultValue: "#A94E27", description: "Link text and the hiring card." },
            line: { type: ControlType.Color, title: "Line", defaultValue: "#DDD6CC", description: "Chip and link borders." },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 40, step: 2, unit: "px", description: "Corner radius of the cards." },
            dim: { type: ControlType.Number, title: "Back Row Colour", defaultValue: 45, min: 0, max: 100, step: 5, unit: "%", description: "Colour left in people who are not in front. 100 = full colour." },
        },
    },
    type: {
        type: ControlType.Object,
        title: "Type",
        controls: {
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", displayFontSize: false, displayTextAlignment: false, description: "Family and weight. Sizes follow Text Size." },
            textSize: { type: ControlType.Number, title: "Text Size", defaultValue: 14, min: 10, max: 28, step: 1, unit: "px", description: "Base size; every other size is a 1.125 step from it." },
        },
    },
    hiring: {
        type: ControlType.Object,
        title: "Hiring Card",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true, description: "A card at the end of the line. Not counted as a person." },
            title: { type: ControlType.String, title: "Title", defaultValue: "We're hiring", description: "Bold line on the card.", hidden: (h: Partial<Hiring>) => h.show === false },
            text: { type: ControlType.String, title: "Text", defaultValue: "See open roles", description: "Small line under the title. Empty hides it.", hidden: (h: Partial<Hiring>) => h.show === false },
            link: { type: ControlType.Link, title: "Link", description: "Where the card goes. Empty goes to the home page.", hidden: (h: Partial<Hiring>) => h.show === false },
        },
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        description: "Words read by screen readers and used as button names.",
        controls: {
            section: { type: ControlType.String, title: "Section", defaultValue: "Team", description: "Name of the whole section." },
            filters: { type: ControlType.String, title: "Filters", defaultValue: "Filter by team", description: "Name of the chip group." },
            chip: { type: ControlType.String, title: "Chip", defaultValue: "Show {team}, {n} people", description: "Name of each chip. {team} and {n} are filled in." },
            chipOne: { type: ControlType.String, title: "Chip (1)", defaultValue: "Show {team}, 1 person", description: "Name of a chip with one person." },
            all: { type: ControlType.String, title: "All Chip", defaultValue: "Show everyone, {n} people", description: "Name of the All chip." },
            position: { type: ControlType.String, title: "Position", defaultValue: "{i} of {n}", description: "Added to each card name. {i} = place, {n} = people showing." },
            showing: { type: ControlType.String, title: "Showing", defaultValue: "Showing {n} of {total} people", description: "Announced after a chip is pressed." },
            lineup: { type: ControlType.String, title: "Lineup", defaultValue: "Team lineup", description: "Name of the line of cards." },
            links: { type: ControlType.String, title: "Links", defaultValue: "Links for {name}", description: "Name of the link list under the person in front." },
            empty: { type: ControlType.String, title: "Empty", defaultValue: "Add people in the properties panel.", description: "Shown when the list is empty." },
        },
    },
})
