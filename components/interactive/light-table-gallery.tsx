import * as React from "react"
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Light Table
 * Photos laid out on film strips over a glowing light table. A stand loupe snaps to the frame
 * under the pointer and magnifies it through real lens distortion; tap a frame to lift it out
 * as a mounted slide. Vertical photos sit sideways, like real negatives.
 *
 * - Any number of photos, grouped into tabs with the Roll field
 * - Strips (paged), Scroll (one long reel) or Sheet layouts
 * - Desktop hover, keyboard and phone press-and-hold
 * - Every visible word editable (Text on Site) for any language
 *
 * Version 1.0
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 */

type Photo = { image?: { src?: string; srcSet?: string; alt?: string } | string; title?: string; roll?: string }

const DEF_IMAGES = [
    "https://images.unsplash.com/photo-1622957471942-bbabb184c325?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1722153023306-a0618a3340c6?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1683392969197-17547ac3e06e?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1634114581478-24f6ca21c18c?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1651637824891-9a5d241b83c7?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1661787726842-9f1e47734aca?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1722131073730-0b2bd13c9bff?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1677160353909-e301e4366810?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1629032449275-706895bc04cd?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1780421908801-21973aa3c4e3?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1780688376683-d7de93c82fd9?auto=format&fit=crop&q=80&w=1400",
    "https://images.unsplash.com/photo-1741738776266-fdbd30cdea1c?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1722131046277-444c94f4dc7b?auto=format&fit=crop&q=80&w=1400",
]
const DEF_PHOTOS: Photo[] = DEF_IMAGES.map((src, i) => ({ image: { src, alt: "Photograph " + (i + 1) }, title: "", roll: "Photographs" }))

const D = {
    layout: { mode: "strips", perStrip: 6, stripsPerPage: 3, columns: 2 },
    navigation: { rollTabs: true, layoutSwitch: false, keyboard: true, edgeAdvance: true, edgeZone: 18 },
    film: { stock: "negative", base: "#D88A4A", positiveBase: "#1E120A", holes: "#FBFCFC", edgeNumbers: true, edgeColor: "#E58A2A" },
    table: { color: "#F6F8F9", light: true, grid: true, radius: 18, padding: 44 },
    corners: { table: 18, strip: 3, photo: 1, slide: 26, window: 3 },
    loupe: { size: 270, fit: true, zoom: 1.33, ring: "#1B1B1B", engraving: "LIGHT TABLE  LOUPE  8×", engravingColor: "rgba(255,255,255,0.8)", reflection: "real", distortion: true, edgeWarp: true, fringe: true },
    rest: { enabled: true, position: "tr", scale: 0.72 },
    slide: { enabled: true, morph: true, mount: "#F2EEE4", name: "SLIDE", caption: "35MM · COLOUR", process: "E-6", stamp: "PROCESSED", backdrop: "rgba(248,248,245,0.84)" },
    atmosphere: { darkroom: false, eye: false, eyeDim: 100 },
    ui: { text: "#141414", muted: "#8A8A84", accent: "#141414", hint: "Hover to look · click to open · arrow keys to move", touchHint: "Hold to look · tap to open", showFooter: true },
    copy: { frame: "Frame {n} of {total}", open: "tap to open", back: "tap to put it back", page: "Page {n} of {total}", roll: "Roll", all: "All", ungrouped: "Photographs", layout: "Layout", strips: "Strips", scroll: "Scroll", sheet: "Sheet", empty: "No photos yet", label: "Photo light table with a loupe" },
}

interface Props {
    photos?: Photo[]
    copy?: Partial<typeof D.copy>
    layout?: Partial<typeof D.layout>
    navigation?: Partial<typeof D.navigation>
    film?: Partial<typeof D.film>
    table?: Partial<typeof D.table>
    loupe?: Partial<typeof D.loupe>
    rest?: Partial<typeof D.rest>
    slide?: Partial<typeof D.slide>
    atmosphere?: Partial<typeof D.atmosphere>
    ui?: Partial<typeof D.ui>
    lens?: any
    corners?: Partial<typeof D.corners>
    font?: any
    style?: React.CSSProperties
}

export default function LightTable(props: Props) {
    const rootRef = useRef<HTMLDivElement>(null)
    const stopRef = useRef<any>(null)
    useEffect(() => () => { stopRef.current && stopRef.current(); stopRef.current = null }, [])
    const cfg = {
        photos: pickPhotos(props.photos),
        copy: { ...D.copy, ...props.copy },
        layout: { ...D.layout, ...props.layout },
        navigation: { ...D.navigation, ...props.navigation },
        film: { ...D.film, ...props.film },
        table: { ...D.table, ...props.table },
        loupe: { ...D.loupe, ...props.loupe, ...(props as any).lens },
        rest: { ...D.rest, ...props.rest },
        slide: { ...D.slide, ...props.slide },
        atmosphere: { ...D.atmosphere, ...props.atmosphere },
        ui: { ...D.ui, ...props.ui },
        corners: { ...D.corners, ...props.corners },
    }
    const key = JSON.stringify(cfg)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas || RenderTarget.current() === RenderTarget.thumbnail

    useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const t = setTimeout(() => { stopRef.current && stopRef.current(); stopRef.current = mountLightTable(root, cfg, isCanvas) }, stopRef.current ? 280 : 0)
        return () => clearTimeout(t)
    }, [key, isCanvas])

    return (
        <div
            ref={rootRef}
            style={{ position: "relative", width: "100%", fontFamily: "Inter, system-ui, sans-serif", fontSize: 13, color: cfg.ui.text, ...props.font, ...props.style }}
            aria-label={cfg.copy.label}
        />
    )
}

function pickPhotos(list?: Photo[]) {
    const ok = (list || []).map(normPhoto).filter((p) => p.src)
    return ok.length ? ok : DEF_PHOTOS.map(normPhoto)
}

function normPhoto(p: Photo) {
    const img: any = p && p.image
    const src = typeof img === "string" ? img : img && img.src
    const alt = (typeof img === "object" && img && img.alt) || p.title || "Photograph"
    return { src: src || "", alt, title: (p && p.title) || "", roll: ((p && p.roll) || "").trim() }
}

/* Engine: builds the light table inside root and returns a cleanup function */
function mountLightTable(root: HTMLElement, cfg: any, isCanvas: boolean) {
    const W: any = window
    const uid = "ltl" + Math.random().toString(36).slice(2, 8)
    const RM = !isCanvas && W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
    const sm = (x: number) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x) }
    const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const cleanups: Array<() => void> = []
    const on = (t: any, ev: string, fn: any, opt?: any) => { t.addEventListener(ev, fn, opt); cleanups.push(() => t.removeEventListener(ev, fn, opt)) }
    const raf = (fn: FrameRequestCallback) => W.requestAnimationFrame(fn)
    let dead = false
    function spring(o: any) {
        let { from, to, v = 0, k = 170, c = 24, onUpdate, onDone } = o
        let x = from, vel = v, last = performance.now(), id = 0, stop = false
        if (RM) { onUpdate(to); onDone && onDone(); return { stop() {} } }
        const step = (t: number) => {
            if (stop || dead) return
            const dt = Math.min((t - last) / 1000, 1 / 30); last = t
            for (let i = 0; i < 4; i++) { const d = dt / 4; vel += (-k * (x - to) - c * vel) * d; x += vel * d }
            onUpdate(x)
            if (Math.abs(vel) < 0.01 && Math.abs(x - to) < 0.001) { onUpdate(to); onDone && onDone(); return }
            id = raf(step)
        }
        id = raf(step)
        return { stop() { stop = true; W.cancelAnimationFrame(id) } }
    }

    const L = cfg.layout, NAV = cfg.navigation, F = cfg.film, T = cfg.table, LP = cfg.loupe, R = cfg.rest, S = cfg.slide, A = cfg.atmosphere, U = cfg.ui, CR = cfg.corners, Cc = cfg.copy
    const tpl = (t: string, n: any, total: any, bold?: boolean) => esc(t).split("{n}").join(bold ? "<b>" + n + "</b>" : n).split("{total}").join(total)
    T.radius = CR.table
    const neg = F.stock === "negative"

    /* styles (scoped) */
    const P = `[data-ltl="${uid}"]`
    const LY = `.l-layer[data-ltl="${uid}"]`
    const css = `
${P}{--tbl:${T.color};--base:${neg ? F.base : F.positiveBase};--holes:${F.holes};--edge:${F.edgeColor};--txt:${U.text};--mut:${U.muted};--acc:${U.accent};--pad:${T.padding}px}
${P} *{box-sizing:border-box}
${P} .l-bar{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;margin-bottom:14px}
${P} .l-seg{display:flex;align-items:center;flex-wrap:wrap;gap:2px;background:#fff;border:1px solid rgba(0,0,0,.09);border-radius:999px;padding:3px 3px 3px 12px;font-size:12px;color:var(--mut)}
${P} .l-seg span{margin-right:6px}
${P} .l-seg button{all:unset;cursor:pointer;padding:4px 10px;border-radius:999px;color:var(--mut);transition:background .2s,color .2s}
${P} .l-seg button i{font-style:normal;opacity:.55;margin-left:4px;font-variant-numeric:tabular-nums}
${P} .l-seg button:hover{color:var(--txt)}${P} .l-seg button.on{background:var(--acc);color:#fff}
${P} .l-table{position:relative;border-radius:${T.radius}px;padding:${Math.round(T.padding * 1.7)}px var(--pad) ${Math.round(T.padding * 2)}px;cursor:zoom-in;touch-action:pan-y;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;
  background:radial-gradient(120% 130% at 50% 45%,#fff 0%,var(--tbl) 55%,color-mix(in srgb,var(--tbl) 88%,#000) 100%);
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.05),inset 0 0 70px rgba(170,195,210,.35),0 30px 60px rgba(0,0,0,.08);transition:background .6s,box-shadow .6s}
${P} .l-table.grid::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background-image:linear-gradient(rgba(0,0,0,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.035) 1px,transparent 1px);background-size:40px 40px;transition:opacity .6s}
${P} .l-table.off{background:radial-gradient(120% 130% at 50% 45%,#1b1d1e 0%,#121314 60%,#0c0d0d 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
${P} .l-table.off::before{opacity:.25}${P} .l-table.off .l-sheet{filter:brightness(.32) saturate(.7)}
${P} .l-sheet{position:relative;display:flex;flex-direction:column;gap:34px;transition:filter .6s}
${P} .l-sheet.contact{display:grid;grid-template-columns:repeat(${Math.max(1, L.columns)},1fr);gap:34px 22px}
${P} .l-sheet.advance{overflow:hidden;margin:0 calc(var(--pad)*-1)}
${P} .l-track{width:max-content;padding-left:var(--pad);will-change:transform}
${P} .l-strip{position:relative;display:flex;gap:12px;padding:30px 18px;border-radius:${CR.strip}px;
  background:${neg ? "linear-gradient(180deg,color-mix(in srgb,var(--base) 58%,transparent),color-mix(in srgb,var(--base) 52%,transparent))" : "var(--base)"};
  box-shadow:${neg ? "0 2px 6px rgba(80,40,10,.10),inset 0 0 0 1px color-mix(in srgb,var(--base) 70%,#000 30%)" : "0 6px 14px rgba(0,0,0,.22)"}}
${P} .l-strip::before,${P} .l-strip::after{content:"";position:absolute;left:6px;right:6px;height:8px;border-radius:2px;background:repeating-linear-gradient(90deg,transparent 0 7px,var(--holes) 7px 15px,transparent 15px 22px)}
${P} .l-strip::before{top:9px}${P} .l-strip::after{bottom:9px}
${P} .contact .l-strip{gap:6px;padding:24px 10px}${P} .contact .l-fw span{font-size:7px;bottom:-17px}
${P} .l-fw{position:relative;flex:1;min-width:0}${P} .advance .l-fw{flex:0 0 var(--fw,150px)}
${P} .l-fr{position:relative;aspect-ratio:3/2;border-radius:${CR.photo}px;overflow:hidden;background:${neg ? "transparent" : "#000"}}
${P} .l-fw.blank .l-fr{background:transparent}${P} .l-fr img{pointer-events:none;-webkit-user-drag:none}
${P} .l-fr img{display:block;width:100%;height:100%;object-fit:cover;transition:opacity .25s;
  filter:${neg ? "invert(1) sepia(.5) saturate(1.7) hue-rotate(-16deg) contrast(.86) brightness(1.04)" : "saturate(1.22) contrast(1.06)"}}
${neg ? P + ' .l-fr::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:color-mix(in srgb,var(--base) 45%,transparent);mix-blend-mode:multiply}' : ""}
${P} .l-fw.lift .l-fr img{opacity:0}
${P} .l-fw.vert .l-fr img{position:absolute;left:50%;top:50%;width:66.667%;height:150%;transform:translate(-50%,-50%) rotate(-90deg)}
${P} .l-fw span{position:absolute;left:0;bottom:-21px;font-size:9px;letter-spacing:.14em;white-space:nowrap;color:${neg ? "color-mix(in srgb,var(--base) 40%,#3a1503)" : "var(--edge)"};font-weight:500}
${P} .l-loupe{position:absolute;left:0;top:0;--lsz:${LP.size}px;width:var(--lsz);height:var(--lsz);margin:calc(var(--lsz)/-2) 0 0 calc(var(--lsz)/-2);pointer-events:none;z-index:5;will-change:transform;--rw:calc(var(--lsz)*0.0815)}
${P} .l-loupe .sh{position:absolute;inset:calc(var(--rw)*-1);border-radius:50%;transform:translate(22px,30px);background:radial-gradient(circle,rgba(20,24,26,.30) 56%,rgba(20,24,26,0) 72%);filter:blur(7px)}
${P} .l-table.off .l-loupe .sh{opacity:.15}
${P} .l-loupe .rim{position:absolute;inset:calc(var(--rw)*-1);border-radius:50%;background:conic-gradient(from 210deg,${LP.ring},color-mix(in srgb,${LP.ring} 91%,#fff) 12%,color-mix(in srgb,${LP.ring} 78%,#000) 28%,color-mix(in srgb,${LP.ring} 95%,#fff) 48%,color-mix(in srgb,${LP.ring} 56%,#000) 66%,color-mix(in srgb,${LP.ring} 93%,#fff) 84%,${LP.ring});
  box-shadow:inset 0 2px 1px rgba(255,255,255,.14),inset 0 -4px 8px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.55),0 16px 34px rgba(0,0,0,.30)}
${P} .l-loupe .rim::after{content:"";position:absolute;inset:calc(var(--rw) - 5px);border-radius:50%;background:color-mix(in srgb,${LP.ring} 41%,#000);box-shadow:inset 0 7px 12px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.07)}
${P} .l-loupe svg{position:absolute;inset:calc(var(--rw)*-1);width:calc(100% + var(--rw)*2);height:calc(100% + var(--rw)*2);overflow:visible}
${P} .l-loupe svg text{font:500 11px Inter,system-ui,sans-serif;letter-spacing:0;fill:${LP.engravingColor}}
${P} .l-lens{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:#f5f7f8}
${P} .l-lens canvas{position:absolute;inset:0;width:100%;height:100%;border-radius:50%}
${P} .l-lens::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.5),inset 0 0 30px rgba(0,0,0,.45)}
${P} .l-glare{position:absolute;inset:0;border-radius:50%;overflow:hidden;transition:opacity .4s}
${P} .l-glare canvas{position:absolute;left:-10%;top:-10%;width:120%;height:120%;mix-blend-mode:screen}
${P} .l-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;font-size:13px;color:var(--mut)}
${P} .l-foot b{color:var(--txt);font-weight:500;font-variant-numeric:tabular-nums}
${P} .l-pager{display:flex;align-items:center;gap:8px}${P} .l-pager[hidden]{display:none}
${P} .l-pager button{all:unset;cursor:pointer;width:24px;height:24px;border-radius:50%;border:1px solid rgba(0,0,0,.14);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--txt)}
${P} .l-pager button:disabled{opacity:.3;cursor:default}
${LY}{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:Inter,system-ui,sans-serif}
${LY}.on{pointer-events:auto;cursor:zoom-out}
${LY} .bd{position:absolute;inset:0;opacity:0;background:${S.backdrop};-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
${LY} .cap{position:absolute;left:0;right:0;bottom:5vh;text-align:center;font-size:13px;color:#6b6b66;opacity:0;transition:opacity .3s}
${LY}.held .cap{opacity:1}
${LY} .slide.vert .win img{inset:auto;left:50%;top:50%;width:66.667%;height:150%;transform:translate(-50%,-50%) rotate(-90deg)}
${LY} .slide{position:fixed;left:0;top:0;width:500px;height:500px;transform-origin:0 0;will-change:transform}
${LY} .mt{position:absolute;inset:0;transition:transform .25s ease-out}
${LY} .card{position:absolute;inset:0;border-radius:${CR.slide}px;background:${S.mount};background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1px);background-size:4px 4px;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.75),inset 0 -2px 0 rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.18),0 30px 60px rgba(0,0,0,.18);font-size:15px;color:#3b3a36;letter-spacing:.14em;font-weight:500}
${LY} .card::before{content:"";position:absolute;left:61px;top:121px;width:378px;height:258px;border-radius:${CR.window + 5}px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.09),0 1px 0 rgba(255,255,255,.85)}
${LY} .card span{position:absolute;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px}
${LY} .t1{left:36px;top:38px}${LY} .t2{right:36px;top:30px;font-size:30px;letter-spacing:0;font-weight:600}
${LY} .t3{left:36px;bottom:38px;color:#6d6a62}${LY} .t4{right:36px;bottom:38px;color:#6d6a62}
${LY} .t5{left:50%;top:80px;transform:translateX(-50%);font-size:12px;color:#8f8b80}
${LY} .win{position:absolute;left:70px;top:130px;width:360px;height:240px;overflow:hidden;border-radius:${CR.window}px;background:#111}
${LY} .win img,${LY} .win canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.32) contrast(1.1) brightness(1.03)}
${LY} .win::after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,rgba(40,120,205,.16),rgba(255,160,80,.08));mix-blend-mode:soft-light;box-shadow:inset 0 0 0 1px rgba(0,0,0,.35),inset 0 0 18px rgba(0,0,0,.25)}
${LY} .fv{position:fixed;left:0;top:0;transform-origin:center;pointer-events:none;will-change:transform}
.l-mask[data-ltl="${uid}"]{position:fixed;left:0;top:0;pointer-events:none;z-index:2147482990;opacity:0;transition:opacity .5s}
`
    const styleEl = document.createElement("style"); styleEl.textContent = css
    root.setAttribute("data-ltl", uid); root.innerHTML = ""; root.appendChild(styleEl)
    cleanups.push(() => { root.innerHTML = ""; root.removeAttribute("data-ltl") })

    /* data */
    const photos: any[] = cfg.photos
    const rollNames: string[] = []
    photos.forEach((p) => { const r = p.roll || Cc.ungrouped; if (!rollNames.includes(r)) rollNames.push(r) })
    let ROLL = rollNames.length > 1 ? "__all" : rollNames[0]
    let MODE: string = L.mode
    let PAGE = 0, PAGES = 1
    const list = () => (ROLL === "__all" ? photos : photos.filter((p) => (p.roll || Cc.ungrouped) === ROLL))

    /* DOM */
    const h = (tag: string, cls?: string, html?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e }
    const bar = h("div", "l-bar")
    const rollSeg = h("div", "l-seg"), laySeg = h("div", "l-seg")
    if (NAV.rollTabs && rollNames.length > 1) {
        rollSeg.innerHTML = "<span>" + esc(Cc.roll) + "</span>" + rollNames.map((r) => `<button data-r="${esc(r)}">${esc(r)}<i>${photos.filter((p) => (p.roll || Cc.ungrouped) === r).length}</i></button>`).join("") + `<button data-r="__all" class="on">${esc(Cc.all)}<i>${photos.length}</i></button>`
        bar.appendChild(rollSeg)
    }
    if (NAV.layoutSwitch) {
        laySeg.innerHTML = "<span>" + esc(Cc.layout) + "</span>" + [["strips", esc(Cc.strips)], ["advance", esc(Cc.scroll)], ["contact", esc(Cc.sheet)]].map(([k, t]) => `<button data-l="${k}"${k === MODE ? ' class="on"' : ""}>${t}</button>`).join("")
        bar.appendChild(laySeg)
    }
    if (bar.children.length) root.appendChild(bar)
    const table = h("div", "l-table" + (T.grid ? " grid" : "") + (T.light ? "" : " off")); root.appendChild(table)
    const sheet = h("div", "l-sheet"); table.appendChild(sheet)
    const loupe = h("div", "l-loupe"); table.appendChild(loupe)
    const engr = String(LP.engraving || "").trim().toUpperCase().split(" ").filter(Boolean).join(" ")
    const r0 = 157, arcR = 144, vb = 314
    const engrSVG = () => {
        const mc = document.createElement("canvas").getContext("2d")!; mc.font = "500 11px Inter, system-ui, sans-serif"
        const ch = Array.from(engr), ws = ch.map((c) => mc.measureText(c).width), adv = ws.map((w, i) => w + (i < ws.length - 1 ? 5 : 0)), tot = adv.reduce((p, q) => p + q, 0)
        let acc = -tot / 2, out = ""
        ch.forEach((c, i) => { const sx = acc + ws[i] / 2, an = sx / arcR - Math.PI / 2, x = (r0 + arcR * Math.cos(an)).toFixed(2), y = (r0 + arcR * Math.sin(an)).toFixed(2); acc += adv[i]; if (c.trim()) out += '<text x="' + x + '" y="' + y + '" text-anchor="middle" transform="rotate(' + ((an * 180) / Math.PI + 90).toFixed(2) + ' ' + x + ' ' + y + ')">' + esc(c) + '</text>' })
        return '<svg viewBox="0 0 ' + vb + ' ' + vb + '" aria-hidden="true">' + out + '</svg>'
    }
    loupe.innerHTML = '<i class="sh"></i><i class="rim"></i>' + (engr ? engrSVG() : "") + '<div class="l-lens"></div><div class="l-glare"></div>'
    const lensBox = loupe.querySelector(".l-lens") as HTMLElement, glareBox = loupe.querySelector(".l-glare") as HTMLElement
    const lensCv = document.createElement("canvas"); lensBox.appendChild(lensCv)
    const reflCv = document.createElement("canvas"); glareBox.appendChild(reflCv)
    const foot = h("div", "l-foot"); const cap = h("span"); const pager = h("span", "l-pager", '<button aria-label="Previous page">←</button><b></b><button aria-label="Next page">→</button>'); const hint = h("span", "", esc((W.matchMedia && W.matchMedia("(hover: none)").matches ? U.touchHint : U.hint) || ""))
    foot.append(cap, pager, hint); if (U.showFooter) root.appendChild(foot)
    const [pgPrev, pgTxt, pgNext] = [pager.children[0], pager.children[1], pager.children[2]] as any

    let layer: HTMLElement | null = null, dark: HTMLElement | null = null, eye: HTMLElement | null = null
    if (!isCanvas) {
        layer = h("div", "l-layer", '<div class="bd"></div><div class="cap"></div>'); layer.setAttribute("data-ltl", uid); document.body.appendChild(layer)
        dark = document.createElement("canvas"); dark.className = "l-mask";  dark.setAttribute("data-ltl", uid); document.body.appendChild(dark)
        eye = h("div", "l-mask"); eye.setAttribute("data-ltl", uid); document.body.appendChild(eye)
        const st2 = document.createElement("style"); st2.textContent = css; layer.appendChild(st2)
        cleanups.push(() => { layer && layer.remove(); dark && dark.remove(); eye && eye.remove() })
    }

    /* images (CORS-safe for the lens) */
    const imgCache = new Map<string, HTMLImageElement>()
    const getImg = (src: string) => { let im = imgCache.get(src); if (!im) { im = new Image(); im.crossOrigin = "anonymous"; im.decoding = "async"; im.src = src; im.onload = () => { dirty = true }; imgCache.set(src, im) } return im }

    /* sheet */
    let fws: HTMLElement[] = [], fcur = 0, perNow = 0, TX = 0, TXT = 0, nextAdv = 0, WMOV = false
    const per = () => (table.clientWidth < 640 ? Math.min(3, L.perStrip) : Math.max(1, Math.round(L.perStrip)))
    const frameHTML = (p: any, i: number) => `<div class="l-fw" data-n="${i}"><div class="l-fr"><img src="${p.src}" alt="${esc(p.alt)}" crossorigin="anonymous" loading="lazy" decoding="async"></div>${F.edgeNumbers ? `<span>▸ ${i + 1}A</span>` : ""}</div>`
    function renderSheet(focus = 0) {
        const items = list(), n = items.length, k = per(); perNow = k
        sheet.className = "l-sheet " + MODE
        let html = ""
        if (MODE === "advance") { TX = TXT = 0; html = `<div class="l-track"><div class="l-strip">${items.map(frameHTML).join("")}</div></div>` }
        else {
            const groups: number[][] = []; for (let i = 0; i < n; i += k) groups.push(Array.from({ length: Math.min(k, n - i) }, (_, j) => i + j))
            const spp = Math.max(1, Math.round(L.stripsPerPage))
            PAGES = MODE === "strips" ? Math.max(1, Math.ceil(groups.length / spp)) : 1; PAGE = clamp(PAGE, 0, PAGES - 1)
            const show = MODE === "strips" ? groups.slice(PAGE * spp, PAGE * spp + spp) : groups
            html = show.map((g) => `<div class="l-strip">${g.map((i) => frameHTML(items[i], i)).join("")}${'<div class="l-fw blank"><div class="l-fr"></div></div>'.repeat(k - g.length)}</div>`).join("")
        }
        sheet.innerHTML = html
        fws = Array.from(sheet.querySelectorAll(".l-fw:not(.blank)")) as HTMLElement[]
        fws.forEach((fw) => { const im = fw.querySelector("img") as HTMLImageElement, mark = () => fw.classList.toggle("vert", im.naturalHeight > im.naturalWidth * 1.02); if (im.complete && im.naturalWidth) mark(); im.addEventListener("load", () => { mark(); dirty = true }); getImg(im.src) })
        if (MODE === "advance") { const fw = (table.clientWidth - 2 * T.padding - 36 - (k - 1) * 12) / k; sheet.style.setProperty("--fw", Math.max(60, fw) + "px") }
        measure(); setFrame(focus < 0 ? fws.length - 1 : focus)
        pager.hidden = !(MODE === "strips" && PAGES > 1); pgTxt.innerHTML = tpl(Cc.page, PAGE + 1, PAGES); pgPrev.disabled = PAGE === 0; pgNext.disabled = PAGE >= PAGES - 1
        dirty = true
    }
    function goPage(p: number, focus = 0) {
        if (p === PAGE || p < 0 || p >= PAGES || held) return
        const dir = p > PAGE ? 1 : -1; PAGE = p
        const a = (sheet as any).animate ? (sheet as any).animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(" + (-dir * 24) + "px)" }], { duration: 160, easing: "ease-in" }) : null
        const done = () => { renderSheet(focus); (sheet as any).animate && (sheet as any).animate([{ opacity: 0, transform: "translateX(" + (dir * 24) + "px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" }) }
        a ? (a.onfinish = done) : done()
    }

    /* geometry */
    let G: any = { frames: [], strips: [], clip: null }, C: number[][] = [], K = 2, LR = LP.size / 2, curD = 0
    const tRect = () => table.getBoundingClientRect()
    function measure() {
        const tb = tRect(), rel = (el: Element) => { const a = el.getBoundingClientRect(); return { x: a.left - tb.left, y: a.top - tb.top, w: a.width, h: a.height } }
        G = {
            strips: Array.from(sheet.querySelectorAll(".l-strip")).map(rel),
            clip: MODE === "advance" ? rel(sheet) : null,
            frames: fws.map((fw) => { const fr = fw.querySelector(".l-fr")!, sp = fw.querySelector("span"); return { ...rel(fr), src: (fr.querySelector("img") as HTMLImageElement).src, t: sp ? sp.textContent : "", s: sp ? rel(sp) : null } }),
        }
        C = G.frames.map((f: any) => [f.x + f.w / 2, f.y + f.h / 2])
        const f0 = G.frames[0], dg = f0 && f0.w ? Math.hypot(f0.w, f0.h) : 0
        const D0 = LP.fit && dg ? clamp((dg * 1.33) / 0.9, 140, 560) : LP.size
        if (Math.abs(D0 - curD) > 0.5) { curD = D0; loupe.style.setProperty("--lsz", D0 + "px"); LR = D0 / 2; if (N) { sizeLens(); paintRefl() } } else LR = curD / 2
        K = LP.fit && dg ? Math.min(3, (D0 * 0.9) / dg) : Math.max(1, LP.zoom)
        dirty = true
    }
    const nearest = (x: number, y: number) => { let b = 0, bd = 1e9; C.forEach((c, i) => { const d = Math.hypot(c[0] - x, (c[1] - y) * 1.6); if (d < bd) { bd = d; b = i } }); return b }
    function setFrame(i: number) {
        fcur = clamp(i, 0, Math.max(0, fws.length - 1)); const fw = fws[fcur]
        cap.innerHTML = fws.length ? tpl(Cc.frame, pad2(+(fw.dataset.n || 0) + 1), pad2(list().length), true) + (S.enabled && Cc.open ? " · " + esc(Cc.open) : "") : esc(Cc.empty)
    }

    /* lens renderer: 2D scene to WebGL barrel distortion */
    const dpr = Math.min(2, W.devicePixelRatio || 1)
    const sc = document.createElement("canvas"), cx = sc.getContext("2d")!
    let N = 0, M = 0, off = 0
    let gl: WebGLRenderingContext | null = null, glOK = false, U_: any = {}
    const glCv = document.createElement("canvas")
    try {
        gl = glCv.getContext("webgl", { premultipliedAlpha: false, alpha: true, preserveDrawingBuffer: true }) as any
        if (gl) {
            const g = gl
            const sh = (t: number, src: string) => { const o = g.createShader(t)!; g.shaderSource(o, src); g.compileShader(o); return o }
            const pg = g.createProgram()!
            g.attachShader(pg, sh(g.VERTEX_SHADER, "attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}"))
            g.attachShader(pg, sh(g.FRAGMENT_SHADER, "precision mediump float;varying vec2 v;uniform sampler2D t;uniform float k,e,s,cb;void main(){vec2 p=v*2.-1.;float r2=dot(p,p);if(r2>1.){gl_FragColor=vec4(0.);return;}vec2 q=p*(1.-k*(1.-r2))*(1.+e*r2*r2);float ca=cb*r2;vec4 cg=texture2D(t,q*s*.5+.5),cr=texture2D(t,q*(1.+ca)*s*.5+.5),cl=texture2D(t,q*(1.-ca)*s*.5+.5);gl_FragColor=vec4(mix(cg.r,cr.r,cr.a),cg.g,mix(cg.b,cl.b,cl.a),cg.a);}"))
            g.linkProgram(pg); g.useProgram(pg)
            g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW)
            const al = g.getAttribLocation(pg, "a"); g.enableVertexAttribArray(al); g.vertexAttribPointer(al, 2, g.FLOAT, false, 0, 0)
            g.bindTexture(g.TEXTURE_2D, g.createTexture()); g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true)
            ;[g.TEXTURE_MIN_FILTER, g.TEXTURE_MAG_FILTER].forEach((p) => g.texParameteri(g.TEXTURE_2D, p, g.LINEAR))
            ;[g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T].forEach((p) => g.texParameteri(g.TEXTURE_2D, p, g.CLAMP_TO_EDGE))
            U_ = { k: g.getUniformLocation(pg, "k"), e: g.getUniformLocation(pg, "e"), s: g.getUniformLocation(pg, "s"), cb: g.getUniformLocation(pg, "cb") }
            glOK = true
            cleanups.push(() => { const x = g.getExtension("WEBGL_lose_context"); x && x.loseContext() })
        }
    } catch (e) { glOK = false }
    const lctx = lensCv.getContext("2d")!
    function sizeLens() {
        N = Math.max(2, Math.round(LR * 2 * dpr)); M = Math.round(N * 1.5); off = (M - N) / 2
        lensCv.width = lensCv.height = N; glCv.width = glCv.height = N; sc.width = sc.height = M
        if (gl) gl.viewport(0, 0, N, N)
    }
    const rr = (x: number, y: number, w: number, hh: number, r: number) => { cx.beginPath(); (cx as any).roundRect ? (cx as any).roundRect(x, y, w, hh, r) : cx.rect(x, y, w, hh); cx.fill() }
    const hidden = new Set<number>()
    /* Draws the magnified table around (px,py). only>=0 draws just that frame on a transparent background. */
    const isV = (im: any) => im.naturalHeight > im.naturalWidth * 1.02
    const rotCache = new Map<string, HTMLCanvasElement>()
    const rotSrc = (im: any) => { let c = rotCache.get(im.src); if (!c) { c = document.createElement("canvas"); c.width = im.naturalHeight; c.height = im.naturalWidth; const g = c.getContext("2d")!; g.translate(0, im.naturalWidth); g.rotate(-Math.PI / 2); g.drawImage(im, 0, 0); rotCache.set(im.src, c) } return c }
    /* vertical photos lie sideways on the film, like a negative shot with the camera turned */
    function drawPhoto(im: any, f: any) {
        if (!isV(im)) { const s = Math.max(f.w / im.naturalWidth, f.h / im.naturalHeight), sw = f.w / s, shh = f.h / s; cx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - shh) / 2, sw, shh, f.x, f.y, f.w, f.h); return }
        const bw = f.h, bh = f.w, s = Math.max(bw / im.naturalWidth, bh / im.naturalHeight), sw = bw / s, shh = bh / s
        cx.save(); cx.translate(f.x + f.w / 2, f.y + f.h / 2); cx.rotate(-Math.PI / 2); cx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - shh) / 2, sw, shh, -bw / 2, -bh / 2, bw, bh); cx.restore()
    }
    function drawScene(px: number, py: number, only = -1) {
        cx.setTransform(1, 0, 0, 1, 0, 0)
        if (only >= 0) cx.clearRect(0, 0, M, M); else { cx.fillStyle = T.light ? "#f5f7f8" : "#121314"; cx.fillRect(0, 0, M, M) }
        cx.setTransform(dpr * K, 0, 0, dpr * K, (LR - px * K) * dpr + off, (LR - py * K) * dpr + off)
        if (G.clip) { cx.save(); cx.beginPath(); cx.rect(G.clip.x, G.clip.y, G.clip.w, G.clip.h); cx.clip() }
        const vw = (LR / K) * 1.8, inV = (f: any) => f.x + f.w > px - vw && f.x < px + vw && f.y + f.h > py - vw && f.y < py + vw
        if (only < 0) G.strips.forEach((r: any) => {
            if (!inV(r)) return
            cx.fillStyle = "rgba(30,18,10,.95)"; rr(r.x, r.y, r.w, r.h, CR.strip)
            cx.fillStyle = F.holes
            const sx = Math.max(r.x + 13, r.x + 13 + Math.floor((px - vw - r.x - 13) / 22) * 22), ex = Math.min(r.x + r.w - 6, px + vw)
            for (let x = sx; x + 8 <= ex; x += 22) { rr(x, r.y + 9, 8, 8, 2); rr(x, r.y + r.h - 17, 8, 8, 2) }
        })
        G.frames.forEach((f: any, i: number) => {
            if (!inV(f)) return
            const show = only >= 0 ? i === only : !hidden.has(i)
            const im = getImg(f.src)
            if (show && im.complete && im.naturalWidth) {
                const s = Math.max(f.w / im.naturalWidth, f.h / im.naturalHeight), sw = f.w / s, shh = f.h / s
                cx.save(); if (CR.photo > 0) { cx.beginPath(); (cx as any).roundRect ? (cx as any).roundRect(f.x, f.y, f.w, f.h, CR.photo) : cx.rect(f.x, f.y, f.w, f.h); cx.clip() } cx.filter = "saturate(1.22) contrast(1.06)"; drawPhoto(im, f); cx.filter = "none"; cx.restore()
            }
            if (only < 0 && f.s && f.t) { cx.fillStyle = F.edgeColor; cx.font = "500 9px Inter,system-ui,sans-serif"; cx.textBaseline = "top"; if ("letterSpacing" in cx) (cx as any).letterSpacing = "1.3px"; cx.fillText(f.t, f.s.x, f.s.y + 1) }
        })
        if (G.clip) cx.restore()
    }
    const warpK = () => (LP.distortion ? 0.22 : 0), warpE = () => (LP.distortion && LP.edgeWarp ? 0.2 : 0), fringe = () => (LP.distortion && LP.fringe ? 0.006 + warpE() * 0.03 : 0)
    /* Renders the lens into target with distortion amount m (0..1) and extra RGB split cbx. */
    function renderLens(target: CanvasRenderingContext2D, px: number, py: number, m = 1, only = -1, cbx = 0) {
        drawScene(px, py, only)
        if (glOK && gl) {
            try {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sc)
                gl.uniform1f(U_.k, warpK() * m); gl.uniform1f(U_.e, warpE() * m); gl.uniform1f(U_.s, N / M); gl.uniform1f(U_.cb, fringe() * m + cbx)
                gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                target.clearRect(0, 0, N, N); target.drawImage(glCv, 0, 0); return
            } catch (e) { glOK = false /* tainted images: fall back to an undistorted lens */ }
        }
        target.clearRect(0, 0, N, N); target.drawImage(sc, off, off, N, N, 0, 0, N, N)
    }

    /* reflections (painted once per size) */
    const rx = reflCv.getContext("2d")!
    function paintRefl() {
        const mode = LP.reflection, Sz = Math.round(LR * 2 * 1.2 * dpr); reflCv.width = reflCv.height = Math.max(1, Sz)
        const C0 = Sz / 2, Rr = Sz / 2 / 1.2; rx.clearRect(0, 0, Sz, Sz); if (mode === "off" || !Sz) return
        const map = (u: number, v: number) => { const f = 1 / (1 + 0.42 * (u * u + v * v)); return [C0 + u * f * Rr, C0 + v * f * Rr] }
        const path = (pts: number[][]) => { rx.beginPath(); pts.forEach((p, i) => { const [a, b] = map(p[0], p[1]); i ? rx.lineTo(a, b) : rx.moveTo(a, b) }) }
        const rect = (u0: number, v0: number, u1: number, v1: number, n = 24) => { const p: number[][] = []; for (let i = 0; i <= n; i++) p.push([u0 + ((u1 - u0) * i) / n, v0]); for (let i = 0; i <= n; i++) p.push([u1, v0 + ((v1 - v0) * i) / n]); for (let i = n; i >= 0; i--) p.push([u0 + ((u1 - u0) * i) / n, v1]); for (let i = n; i >= 0; i--) p.push([u0, v0 + ((v1 - v0) * i) / n]); path(p); rx.closePath() }
        const ell = (cu: number, cv: number, ru: number, rv: number) => { const p: number[][] = []; for (let i = 0; i <= 90; i++) { const a = (i / 90) * Math.PI * 2; p.push([cu + Math.cos(a) * ru, cv + Math.sin(a) * rv]) } path(p); rx.closePath() }
        const glow = (u: number, v: number, r: number, a: number) => { const [c1, c2] = map(u, v), g = rx.createRadialGradient(c1, c2, 0, c1, c2, r * Rr); g.addColorStop(0, "rgba(255,255,255," + a + ")"); g.addColorStop(1, "rgba(255,255,255,0)"); rx.fillStyle = g; rx.fillRect(0, 0, Sz, Sz) }
        const d = dpr, bl = (px: number) => "blur(" + px * d + "px)"
        rx.save(); rx.beginPath(); rx.arc(C0, C0, Rr, 0, Math.PI * 2); rx.clip()
        let g = rx.createRadialGradient(C0, C0, Rr * 0.72, C0, C0, Rr); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,255,255,.16)"); rx.fillStyle = g; rx.fillRect(0, 0, Sz, Sz)
        if (mode === "real") { // overhead light reflected by both glass surfaces
            rx.filter = bl(7); rx.fillStyle = "rgba(255,255,255,.10)"; rect(-0.62, -0.58, 0.42, -0.4); rx.fill()
            rx.filter = bl(1.3); rx.fillStyle = "rgba(255,255,255,.45)"; rect(-0.56, -0.535, 0.36, -0.475); rx.fill()
            rx.filter = bl(1.1); rx.fillStyle = "rgba(255,255,255,.22)"; rect(-0.2, 0.235, 0.3, 0.265); rx.fill()
        }
        if (mode === "studio") { rx.lineCap = "round"; [[0.3, 3.4, 0.62], [0.4, 2.2, 0.38]].forEach(([v0, w, a]) => { for (let i = 0; i < 60; i++) { const t0 = -0.62 + (1.24 * i) / 60, t1 = -0.62 + (1.24 * (i + 1)) / 60; rx.strokeStyle = "rgba(255,255,255," + a * Math.sin((Math.PI * (i + 0.5)) / 60) + ")"; rx.lineWidth = w * d; path([[t0, v0 + 0.32 * t0 * t0 - 0.06 * t0], [t1, v0 + 0.32 * t1 * t1 - 0.06 * t1]]); rx.stroke() } }) }
        if (mode === "window") { rx.filter = bl(1.2); rx.fillStyle = "rgba(255,255,255,.6)"; rect(-0.78, -0.86, -0.12, -0.22); rx.fill(); rx.globalCompositeOperation = "destination-out"; rx.lineWidth = 6 * d; rx.strokeStyle = "#000"; path(Array.from({ length: 21 }, (_, i) => [-0.45, -0.86 + (0.64 * i) / 20])); rx.stroke(); path(Array.from({ length: 21 }, (_, i) => [-0.78 + (0.66 * i) / 20, -0.54])); rx.stroke(); rx.globalCompositeOperation = "source-over" }
        if (mode === "ring") { rx.filter = bl(5); rx.strokeStyle = "rgba(255,255,255,.28)"; rx.lineWidth = 16 * d; ell(0.08, -0.3, 0.42, 0.34); rx.stroke(); rx.filter = bl(0.7); rx.strokeStyle = "rgba(255,255,255,.78)"; rx.lineWidth = 6 * d; ell(0.08, -0.3, 0.42, 0.34); rx.stroke() }
        if (mode === "softbox") { rx.filter = bl(7); g = rx.createLinearGradient(0, map(0, -0.98)[1], 0, map(0, -0.35)[1]); g.addColorStop(0, "rgba(255,255,255,.85)"); g.addColorStop(1, "rgba(255,255,255,0)"); rx.fillStyle = g; rect(-0.85, -1, 0.85, -0.35); rx.fill(); rx.filter = bl(1); rx.fillStyle = "rgba(255,255,255,.75)"; rect(-0.7, -0.93, 0.7, -0.85); rx.fill() }
        if (mode === "lamp") { glow(-0.36, -0.44, 0.42, 0.38); glow(-0.36, -0.44, 0.12, 0.9); glow(-0.36, -0.44, 0.05, 1); glow(0.44, 0.4, 0.16, 0.3); glow(0.44, 0.4, 0.035, 0.95) }
        rx.filter = "none"; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
        for (let i = 0; i < 46; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * Rr; rx.fillStyle = "rgba(255,255,255," + (0.1 + rnd() * 0.25) + ")"; rx.beginPath(); rx.arc(C0 + Math.cos(a) * r, C0 + Math.sin(a) * r, (0.4 + rnd() * 1.1) * d, 0, Math.PI * 2); rx.fill() }
        rx.restore()
    }

    /* loupe motion */
    let lx = 0, ly = 0, vx = 0, vy = 0, ls = 1, lastT = 0, started = false, live = false, dirty = true, plx = -1, ply = -1
    let overT = false, PX = -1, PY = -1, kbT = -1e9, stay = false, stayArm = false
    let rOX = 0, rOY = 0, held: any = null, scT = 0, scTimer: any = 0, closing = false, darkA = 0, pageRGB = [255, 255, 255]
    const readBg = () => { let e: any = root.parentElement; while (e && e !== document.documentElement) { const c = getComputedStyle(e).backgroundColor || "", v = c.slice(c.indexOf("(") + 1, c.indexOf(")")).split(",").map(parseFloat); if (v.length >= 3 && (v.length < 4 || v[3] > 0.05)) { pageRGB = v.slice(0, 3); return } e = e.parentElement } pageRGB = [255, 255, 255] }
    readBg()
    const restPt = () => {
        const sb = sheet.getBoundingClientRect(), tb = tRect(), Ls = sb.left - tb.left, Ts = sb.top - tb.top, r = LR * R.scale
        const p = String(R.position || "br")
        const x = p[1] === "l" ? Ls + r * 0.55 : p[1] === "c" ? Ls + sb.width / 2 : Ls + sb.width - r * 0.55
        const y = p[0] === "t" ? Ts - r * 0.05 : p[0] === "m" ? Ts + sb.height / 2 : Ts + sb.height + r * 0.05
        return [x, y]
    }
    const resting = () => R.enabled && !overT && !held && !stay && performance.now() - kbT > 4000
    function advanceStep(now: number) {
        if (MODE !== "advance" || fws.length < 2) return
        const tr = sheet.querySelector(".l-track") as HTMLElement; if (!tr) return
        const tb = tRect(), vis = sheet.clientWidth, minTX = Math.min(0, vis - T.padding - tr.scrollWidth), FW = fws[1].offsetLeft - fws[0].offsetLeft
        let dir = 0, iv = 0
        if (NAV.edgeAdvance && overT && PX >= 0 && !held) { const rel = (PX - tb.left) / tb.width, Z = clamp(NAV.edgeZone, 5, 40) / 100, d = rel > 1 - Z ? (rel - (1 - Z)) / Z : rel < Z ? -(Z - rel) / Z : 0; if (d) { dir = Math.sign(d); iv = 760 - 560 * Math.abs(d) } }
        else if (now - kbT < 4000 && fws[fcur]) { const f = fws[fcur].querySelector(".l-fr")!.getBoundingClientRect(), rb = sheet.getBoundingClientRect(); if (f.right > rb.right - 4) dir = 1; else if (f.left < rb.left + 4) dir = -1 }
        if (dir && now >= nextAdv && Math.abs(TXT - TX) < FW * 0.35) { const n = clamp(TXT - dir * FW, minTX, 0); if (n !== TXT) { TXT = n; nextAdv = now + iv } }
        if (!dir) nextAdv = 0
        const nx = Math.abs(TXT - TX) < 0.15 ? TXT : TX + (TXT - TX) * 0.2
        if (nx === TX) { if (WMOV) { WMOV = false; measure(); if (overT && PX >= 0) setFrame(nearest(PX - tb.left, PY - tb.top)) } return }
        TX = nx; WMOV = true; tr.style.transform = "translateX(" + TX + "px)"; measure()
        if (overT && PX >= 0) setFrame(nearest(PX - tb.left, PY - tb.top))
    }
    function frame(t: number) {
        if (dead) return
        const dt = Math.min((t - (lastT || t)) / 1000, 1 / 30); lastT = t
        advanceStep(t)
        const rest = resting()
        let [tx, ty] = rest ? restPt() : C[fcur] || [0, 0]
        if (MODE === "advance" && WMOV && overT && PX >= 0 && C[fcur]) { const tb = tRect(); tx = clamp(PX - tb.left, LR * 0.6, tb.width - LR * 0.6); ty = C[fcur][1] }
        if (RM || !started) { lx = tx; ly = ty; started = true } else for (let k = 0; k < 4; k++) { const hh = dt / 4; vx += (-150 * (lx - tx) - 25 * vx) * hh; vy += (-150 * (ly - ty) - 25 * vy) * hh; lx += vx * hh; ly += vy * hh }
        ls += ((rest ? R.scale : 1) - ls) * (RM || isCanvas ? 1 : 0.12)
        loupe.style.transform = "translate(" + lx + "px," + ly + "px) scale(" + ls.toFixed(4) + ")"
        if (dirty || Math.abs(lx - plx) > 0.05 || Math.abs(ly - ply) > 0.05) { renderLens(lctx, lx, ly); plx = lx; ply = ly; dirty = false }
        const tb = tRect()
        rOX = (0.5 - (tb.left + lx) / innerWidth) * 16; rOY = (0.5 - (tb.top + ly) / innerHeight) * 12
        reflCv.style.transform = "translate(" + rOX + "px," + rOY + "px)"
        if (dark) {
            const act = A.darkroom && (overT || !!held || closing), tgt = act ? 1 : 0; darkA += (tgt - darkA) * (RM ? 1 : 0.12); if (Math.abs(tgt - darkA) < 0.003) darkA = tgt; dark.style.transition = "none"; dark.style.opacity = String(darkA); if (A.darkroom && darkA !== tgt) dirty = true
            if (A.darkroom && darkA > 0) {
                const dc = dark as HTMLCanvasElement, vw = innerWidth, vh = innerHeight
                const pw = Math.round(vw * dpr), ph = Math.round(vh * dpr)
                if (dc.width !== pw || dc.height !== ph) { dc.width = pw; dc.height = ph; dc.style.width = vw + "px"; dc.style.height = vh + "px" }
                const x = dc.getContext("2d")!; x.setTransform(dpr, 0, 0, dpr, 0, 0)
                x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, vw, vh); x.fillStyle = "rgba(8,8,8,.9)"; x.fillRect(0, 0, vw, vh)
                x.globalCompositeOperation = "destination-out"; x.fillStyle = "#000"; x.beginPath()
                if ((x as any).roundRect) (x as any).roundRect(tb.left, tb.top, tb.width, tb.height, T.radius); else x.rect(tb.left, tb.top, tb.width, tb.height)
                x.fill(); x.beginPath(); x.arc(tb.left + lx, tb.top + ly, LR * 1.163 * ls - 1, 0, Math.PI * 2); x.fill()
            }
        }
        if (eye) {
            const act = A.eye && overT && !held, r = LR * ls - 10, a = clamp(A.eyeDim, 10, 100) / 100
            eye.style.opacity = act ? "1" : "0"
            const ex = tb.left + lx, ey = tb.top + ly, R0 = LR * ls
            Object.assign(eye.style, { left: "0", top: "0", width: innerWidth + "px", height: innerHeight + "px", borderRadius: "0", boxShadow: "none", transition: "opacity .45s ease", background: "radial-gradient(circle at " + ex + "px " + ey + "px, transparent 0 " + (R0 - 10) + "px, rgba(0,0,0," + 0.75 * a + ") " + (R0 + 4) + "px, rgba(0,0,0," + a + ") " + (R0 + 34) + "px)" })
            glareBox.style.background = act ? "radial-gradient(circle at center, transparent 58%, rgba(0,0,0,.55) 100%)" : ""; reflCv.style.opacity = act ? "0" : "1"; reflCv.style.transition = "opacity .4s"
        }
        if (live) raf(frame)
    }

    /* slides */
    const WX = 70, WY = 130, WW = 360
    const loupeOnFrame = (i: number) => i === fcur && !resting() && glOK
    function place(el: any, st: any) { el._st = st; el.style.transform = "translate(" + st.x + "px," + st.y + "px) scale(" + st.s + ") translate(250px,250px) rotate(" + st.r + "deg) translate(-250px,-250px)"; el.querySelector(".card").style.opacity = st.m }
    function frameState(i: number, viaLoupe: boolean) {
        const r = fws[i].querySelector(".l-fr")!.getBoundingClientRect(); let w = r.width, x = r.left, y = r.top
        if (viaLoupe) { const tb = tRect(); w = r.width * K; const hh = r.height * K; x = tb.left + lx - w / 2; y = tb.top + ly - hh / 2 }
        const s0 = w / WW; return { x: x - WX * s0, y: y - WY * s0, s: s0, r: 0, m: 0 }
    }
    function centerState() { const Sz = Math.min(innerWidth * 0.82, innerHeight * 0.76, 560); return { x: (innerWidth - Sz) / 2, y: (innerHeight - Sz) / 2 - 12, s: Sz / 500, r: 0, m: 1 } }
    function lift(i: number, onn: boolean) { fws[i] && fws[i].classList.toggle("lift", onn); onn ? hidden.add(i) : hidden.delete(i); dirty = true }
    function makeMorph(el: HTMLElement, src: string) {
        const win = el.querySelector(".win") as HTMLElement, c = document.createElement("canvas"); c.width = Math.round(540 * dpr); c.height = Math.round(360 * dpr); win.appendChild(c)
        const g = c.getContext("webgl"); if (!g) { c.remove(); return null }
        try {
            const sh = (t: number, s: string) => { const o = g.createShader(t)!; g.shaderSource(o, s); g.compileShader(o); return o }, pg = g.createProgram()!
            g.attachShader(pg, sh(g.VERTEX_SHADER, "attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}"))
            g.attachShader(pg, sh(g.FRAGMENT_SHADER, "precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec2 h;uniform float k,e,m;void main(){vec2 p=(v*2.-1.)*h;float r2=dot(p,p);vec2 q=p*(1.-m*k*(1.-r2))*(1.+m*e*r2*r2);vec2 u=q/h*.5+.5;if(u.x<0.||u.x>1.||u.y<0.||u.y>1.){gl_FragColor=vec4(.118,.07,.04,1.);return;}gl_FragColor=texture2D(t,u);}"))
            g.linkProgram(pg); g.useProgram(pg); g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW)
            const al = g.getAttribLocation(pg, "a"); g.enableVertexAttribArray(al); g.vertexAttribPointer(al, 2, g.FLOAT, false, 0, 0)
            g.bindTexture(g.TEXTURE_2D, g.createTexture()); g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true)
            ;[g.TEXTURE_MIN_FILTER, g.TEXTURE_MAG_FILTER].forEach((p) => g.texParameteri(g.TEXTURE_2D, p, g.LINEAR)); [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T].forEach((p) => g.texParameteri(g.TEXTURE_2D, p, g.CLAMP_TO_EDGE))
            const im0 = getImg(src), im: any = isV(im0) ? rotSrc(im0) : im0, iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, cw = Math.min(iw, ih * 1.5), ch = cw / 1.5, oc = document.createElement("canvas")
            oc.width = Math.max(1, Math.round(cw)); oc.height = Math.max(1, Math.round(ch)); oc.getContext("2d")!.drawImage(im, (iw - cw) / 2, (ih - ch) / 2, cw, ch, 0, 0, oc.width, oc.height)
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, oc); g.viewport(0, 0, c.width, c.height)
            const f0 = G.frames[0]; g.uniform2f(g.getUniformLocation(pg, "h"), (f0.w * K) / 2 / LR, (f0.h * K) / 2 / LR)
            g.uniform1f(g.getUniformLocation(pg, "k"), warpK()); g.uniform1f(g.getUniformLocation(pg, "e"), warpE()); const um = g.getUniformLocation(pg, "m")
            const fn: any = (a: number) => { if (a < 0) { c.style.display = "none"; return } c.style.display = "block"; g.uniform1f(um, a); g.drawArrays(g.TRIANGLE_STRIP, 0, 4) }
            fn.clean = () => { const x = g.getExtension("WEBGL_lose_context"); x && x.loseContext(); c.remove() }
            return fn
        } catch (e) { c.remove(); return null }
    }
    function open(i: number) {
        if (held || !layer || !S.enabled || !fws[i]) return
        const n = +fws[i].dataset.n!, p = list()[n], via = loupeOnFrame(i)
        stay = true; stayArm = false
        const vert = isV(getImg(p.src)), el = h("div", "slide" + (vert ? " vert" : ""), `<div class="mt"><div class="card"><span class="t1">${esc(S.name)}</span><span class="t2">${pad2(n + 1)}</span><span class="t5">${esc(S.process)}</span><span class="t3">${esc(p.title || S.caption)}</span><span class="t4">${esc(S.stamp)}</span></div><div class="win"><img src="${p.src}" alt="${esc(p.alt)}" crossorigin="anonymous"></div></div>`)
        layer.appendChild(el)
        const from = frameState(i, via); place(el, from); lift(i, true)
        const bd = layer.querySelector(".bd") as HTMLElement, capEl = layer.querySelector(".cap") as HTMLElement
        capEl.textContent = (p.title ? p.title : tpl(Cc.frame, pad2(n + 1), pad2(list().length))) + (Cc.back ? " · " + Cc.back : "")
        held = { el, i, t: performance.now(), via }; layer.classList.add("on"); bd.style.background = A.darkroom ? "rgba(8,8,8,.86)" : ""
        const morph = via && S.morph && LP.distortion ? makeMorph(el, p.src) : null; (el as any)._m = morph; morph && morph(1)
        const to: any = centerState(); if (vert) to.r = 90
        held.sp = spring({ from: 0, to: 1, k: 140, c: 24, onUpdate: (q: number) => { const st: any = {}; for (const k in from) st[k] = (from as any)[k] + (to[k] - (from as any)[k]) * q; st.m = clamp(q * 1.8, 0, 1); st.r += Math.sin(clamp(q, 0, 1) * Math.PI) * -5; place(el, st); bd.style.opacity = String(clamp(q, 0, 1)); morph && morph(Math.pow(1 - clamp(q, 0, 1), 1.4)) },
            onDone: () => { morph && morph(-1); if (held && held.el === el) { el.classList.add("held"); layer!.classList.add("held") } } })
    }
    function close() {
        if (!held || performance.now() - held.t < 300 || !layer) return
        const { el, i } = held; held.sp && held.sp.stop(); held = null; closing = true; stay = true; stayArm = false; layer.classList.remove("held"); (el.querySelector(".mt") as HTMLElement).style.transform = ""
        const bd = layer.querySelector(".bd") as HTMLElement, a = el._st, via = loupeOnFrame(i)
        const finish = () => { closing = false; { const r = tRect(); overT = PX >= r.left && PX <= r.right && PY >= r.top && PY <= r.bottom } lift(i, false); el._m && el._m.clean && el._m.clean(); el.remove(); layer!.classList.remove("on"); setTimeout(() => (stayArm = true), 60) }
        const T0 = performance.now(), Tm = RM ? 1 : 1000
        if (via) { // only the photo travels; drawn by the lens code so it lands exactly on the loupe view
            el._m && el._m(-1)
            const Dm = LR * 2, c = document.createElement("canvas"); c.className = "fv"; c.width = c.height = N; c.style.width = c.style.height = Dm + "px"; layer.appendChild(c)
            const fx = c.getContext("2d")!; (el.querySelector(".win") as HTMLElement).style.visibility = "hidden"
            const fw = G.frames[i].w * K, grow = S.morph && LP.distortion, t2 = document.createElement("canvas"); t2.width = t2.height = N; const tx2 = t2.getContext("2d")!
            const upd = (pp: number) => {
                const st = el._st, ww = WW * st.s, ccx = st.x + (WX + WW / 2) * st.s, ccy = st.y + (WY + 120) * st.s, Sx = ww / fw, tb = tRect(), Lx = tb.left + lx, Ly = tb.top + ly
                const hw = ww / 2, hh2 = ww / 3, q = sm((pp - 0.25) / 0.6)
                const far = Math.max(Math.hypot(ccx - hw - Lx, ccy - hh2 - Ly), Math.hypot(ccx + hw - Lx, ccy - hh2 - Ly), Math.hypot(ccx - hw - Lx, ccy + hh2 - Ly), Math.hypot(ccx + hw - Lx, ccy + hh2 - Ly)) + 40
                const rS = far + (LR - far) * q
                const ra = (st.r * Math.PI) / 180, ddx = (Lx - ccx) / Sx, ddy = (Ly - ccy) / Sx, clx = ddx * Math.cos(ra) + ddy * Math.sin(ra), cly = -ddx * Math.sin(ra) + ddy * Math.cos(ra)
                c.style.transform = "translate(" + (ccx - LR) + "px," + (ccy - LR) + "px) rotate(" + st.r + "deg) scale(" + Sx + ")"
                c.style.clipPath = q <= 0 ? "none" : "circle(" + (rS / Sx).toFixed(2) + "px at " + (clx + LR).toFixed(2) + "px " + (cly + LR).toFixed(2) + "px)"
                renderLens(fx, lx, ly, grow ? sm(pp / 0.9) : 1, i, 0.035 * Math.sin(Math.PI * pp))
                const gA = sm((pp - 0.15) / 0.85), fr = N / Dm
                if (gA > 0) {
                    tx2.globalCompositeOperation = "copy"; tx2.drawImage(c, 0, 0); tx2.globalCompositeOperation = "source-atop"
                    const vg = tx2.createRadialGradient(N / 2, N / 2, N / 2 - 30 * fr, N / 2, N / 2, N / 2); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.45)"); tx2.fillStyle = vg; tx2.fillRect(0, 0, N, N)
                    fx.save(); fx.globalAlpha = gA; fx.drawImage(t2, 0, 0); fx.restore()
                    if (reflCv.width && LP.reflection !== "off") { tx2.globalCompositeOperation = "copy"; tx2.drawImage(c, 0, 0); tx2.globalCompositeOperation = "source-in"; tx2.drawImage(reflCv, (-0.1 * Dm + rOX) * fr, (-0.1 * Dm + rOY) * fr, 1.2 * Dm * fr, 1.2 * Dm * fr); fx.save(); fx.globalCompositeOperation = "screen"; fx.globalAlpha = gA; fx.drawImage(t2, 0, 0); fx.restore() }
                }
                const u = 1 - pp; c.style.filter = "saturate(" + (1 + 0.08 * u).toFixed(3) + ") contrast(" + (1 + 0.04 * u).toFixed(3) + ") brightness(" + (1 + 0.03 * u).toFixed(3) + ")"
                dirty = true
            }
            upd(0)
            const to: any = frameState(i, true)
            const step = (n: number) => { if (dead) return; const raw = clamp((n - T0) / Tm, 0, 1), pp = easeIO(raw), st: any = {}; for (const k in a) st[k] = a[k] + (to[k] - a[k]) * pp; st.m = a.m * (1 - sm((pp - 0.3) / 0.55)); place(el, st); bd.style.opacity = String(sm(1 - raw * 1.15)); upd(pp); if (raw < 1) raf(step); else { lift(i, false); renderLens(lctx, lx, ly); plx = lx; ply = ly; c.remove(); finish() } }
            raf(step)
        } else {
            const to: any = frameState(i, false)
            const step = (n: number) => { if (dead) return; const raw = clamp((n - T0) / Tm, 0, 1), pp = easeIO(raw), st: any = {}; for (const k in a) st[k] = a[k] + (to[k] - a[k]) * pp; st.m = a.m * (1 - sm((pp - 0.3) / 0.55)); place(el, st); bd.style.opacity = String(sm(1 - raw * 1.15)); if (raw > 0.7) lift(i, false); el.style.opacity = String(1 - sm((pp - 0.8) / 0.2)); if (raw < 1) raf(step); else finish() }
            raf(step)
        }
    }

    /* events */
    renderSheet(0); sizeLens(); paintRefl()
    if (!isCanvas) {
        /* Mouse: hovering the table is "looking". Touch: press and hold (or slide sideways) is "looking";
           while held the page doesn't scroll and darkroom / eye-to-loupe switch on, release puts the loupe down. Quick tap opens the slide. */
        let down: any = null, holdT: any = 0, holding = false, ptype = "mouse"
        const aim = (x: number, y: number) => { const tb = tRect(); PX = x; PY = y; setFrame(nearest(x - tb.left, y - tb.top)) }
        const startHold = (x: number, y: number) => { holding = true; overT = true; stay = false; aim(x, y); try { navigator.vibrate && navigator.vibrate(8) } catch (er) {} }
        const endHold = () => { clearTimeout(holdT); if (holding) { holding = false; overT = false } }
        on(table, "pointermove", (e: PointerEvent) => {
            ptype = e.pointerType
            if (held) return
            if (e.pointerType !== "mouse") {
                if (holding) { aim(e.clientX, e.clientY); return }
                if (down) { const dx = Math.abs(e.clientX - down.x), dy = Math.abs(e.clientY - down.y); if (dx > 10 && dx > dy) { clearTimeout(holdT); startHold(e.clientX, e.clientY) } else if (dy > 10) { clearTimeout(holdT); down = null } }
                return
            }
            if (performance.now() - scT < 160) return
            overT = true; aim(e.clientX, e.clientY)
        })
        on(table, "pointerleave", (e: PointerEvent) => { if (e.pointerType === "mouse") overT = false })
        on(table, "pointerdown", (e: PointerEvent) => {
            ptype = e.pointerType; down = { x: e.clientX, y: e.clientY }
            if (e.pointerType === "mouse") { overT = true; aim(e.clientX, e.clientY); return }
            clearTimeout(holdT); holdT = setTimeout(() => { if (down && !held) startHold(down.x, down.y) }, 220)
        })
        on(table, "pointerup", (e: PointerEvent) => {
            const d = down; down = null; clearTimeout(holdT)
            if (holding) { endHold(); return }
            if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) { if (e.pointerType !== "mouse") aim(e.clientX, e.clientY); open(fcur) }
        })
        on(table, "pointercancel", () => { down = null; endHold() })
        on(table, "touchmove", (e: TouchEvent) => { if (holding) e.preventDefault() }, { passive: false })
        on(table, "contextmenu", (e: Event) => { if (ptype !== "mouse") e.preventDefault() })
        on(W, "pointermove", (e: PointerEvent) => { PX = e.clientX; PY = e.clientY; if (stay && stayArm) stay = false }, { passive: true })
        scTimer = 0
        const settle = () => { if (PX < 0 || held || ptype !== "mouse") return; const r = tRect(), inside = PX >= r.left && PX <= r.right && PY >= r.top && PY <= r.bottom; overT = inside; if (inside) setFrame(nearest(PX - r.left, PY - r.top)) }
        on(W, "scroll", () => {
            if (held || PX < 0) return
            if (ptype !== "mouse") { if (!holding) overT = false; return }
            const r = tRect(), inside = PX >= r.left && PX <= r.right && PY >= r.top && PY <= r.bottom, was = overT
            scT = performance.now(); overT = inside
            if (inside && !was) setFrame(nearest(PX - r.left, PY - r.top))
            clearTimeout(scTimer); scTimer = setTimeout(settle, 160)
        }, { passive: true })
        cleanups.push(() => clearTimeout(scTimer))
        const block = (e: Event) => { if (held || closing) e.preventDefault() }
        on(W, "wheel", block, { passive: false }); on(W, "touchmove", block, { passive: false })
        on(W, "keydown", (e: KeyboardEvent) => {
            if ((held || closing) && [" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault()
            if (e.key === "Escape") { close(); return }
            if (held || !NAV.keyboard || !overT) return
            const k = e.key, pr = perNow
            if (k.startsWith("Arrow")) kbT = performance.now()
            if (k === "ArrowRight") { e.preventDefault(); if (fcur === fws.length - 1 && MODE === "strips" && PAGE < PAGES - 1) goPage(PAGE + 1, 0); else setFrame(fcur + 1) }
            if (k === "ArrowLeft") { e.preventDefault(); if (fcur === 0 && MODE === "strips" && PAGE > 0) goPage(PAGE - 1, -1); else setFrame(fcur - 1) }
            if (k === "ArrowDown" && MODE !== "advance") { e.preventDefault(); setFrame(fcur + pr) }
            if (k === "ArrowUp" && MODE !== "advance") { e.preventDefault(); setFrame(fcur - pr) }
            if (k === "Enter") open(fcur)
        })
        layer && on(layer, "click", close)
        layer && on(layer, "pointermove", (e: PointerEvent) => { if (!held || !held.el.classList.contains("held")) return; held.el.querySelector(".mt").style.transform = "perspective(1400px) rotateX(" + (e.clientY / innerHeight - 0.5) * -10 + "deg) rotateY(" + (e.clientX / innerWidth - 0.5) * 12 + "deg)" })
        on(rollSeg, "click", (e: any) => { const b = e.target.closest("button"); if (!b || held) return; ROLL = b.dataset.r; PAGE = 0; rollSeg.querySelectorAll("button").forEach((o) => o.classList.toggle("on", o === b)); renderSheet() })
        on(laySeg, "click", (e: any) => { const b = e.target.closest("button"); if (!b || held) return; MODE = b.dataset.l; PAGE = 0; laySeg.querySelectorAll("button").forEach((o) => o.classList.toggle("on", o === b)); renderSheet() })
        on(pgPrev, "click", () => goPage(PAGE - 1)); on(pgNext, "click", () => goPage(PAGE + 1))
        const io = new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !live) { live = true; lastT = 0; measure(); raf(frame) } else if (!v) live = false }); io.observe(table); cleanups.push(() => io.disconnect())
    }
    function staticDraw() { started = false; lastT = 0; live = false; measure(); frame(performance.now()) }
    const ro = new ResizeObserver(() => { if (per() !== perNow) renderSheet(fcur); else measure(); sizeLens(); paintRefl(); dirty = true; if (isCanvas) staticDraw() }); ro.observe(root); cleanups.push(() => ro.disconnect())
    if (isCanvas) { staticDraw(); const iv = setInterval(() => { if (dirty) staticDraw() }, 400); cleanups.push(() => clearInterval(iv)) }

    return () => { dead = true; live = false; cleanups.forEach((f) => { try { f() } catch (e) {} }) }
}

function esc(s: any) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]) }
function pad2(n: number) { return String(n).padStart(2, "0") }

/* Right panel */
/* Right panel, ordered the way a first-time user works:
   1 add photos → 2 arrange them → 3 shape the loupe → 4 lens feel → 5 what a tap does → 6 mood → 7 look & feel → 8 controls for visitors */
const only = (k: string, v: any) => (p: any) => p[k] !== v
addPropertyControls(LightTable, {
    photos: {
        type: ControlType.Array,
        title: "Photos",
        description: "Start here. Photos with the same Roll name share a tab.",
        maxCount: 500,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", placeholder: "Optional · shown on the slide" },
                roll: { type: ControlType.String, title: "Roll", placeholder: "Tab name, e.g. Streets" },
            },
        },
        defaultValue: DEF_PHOTOS,
    },
    layout: {
        type: ControlType.Object,
        title: "Arrange",
        controls: {
            mode: { type: ControlType.Enum, title: "Layout", options: ["strips", "advance", "contact"], optionTitles: ["Strips", "Scroll", "Sheet"], displaySegmentedControl: true, defaultValue: D.layout.mode,
                description: "Strips: film in pages. Scroll: one long reel. Sheet: all at once." },
            perStrip: { type: ControlType.Number, title: "Per Strip", min: 2, max: 12, step: 1, displayStepper: true, defaultValue: D.layout.perStrip },
            stripsPerPage: { type: ControlType.Number, title: "Per Page", min: 1, max: 8, step: 1, displayStepper: true, defaultValue: D.layout.stripsPerPage, hidden: only("mode", "strips") },
            columns: { type: ControlType.Number, title: "Columns", min: 1, max: 4, step: 1, displayStepper: true, defaultValue: D.layout.columns, hidden: only("mode", "contact") },
        },
    },
    loupe: {
        type: ControlType.Object,
        title: "Loupe",
        controls: {
            fit: { type: ControlType.Boolean, title: "Size", enabledTitle: "Auto", disabledTitle: "Custom", defaultValue: D.loupe.fit, description: "Auto fits a full frame in the lens." },
            size: { type: ControlType.Number, title: "Diameter", min: 120, max: 560, step: 2, unit: "px", defaultValue: D.loupe.size, hidden: (p: any) => p.fit },
            zoom: { type: ControlType.Number, title: "Magnify", min: 1, max: 6, step: 0.01, unit: "×", defaultValue: D.loupe.zoom, hidden: (p: any) => p.fit },
            engraving: { type: ControlType.String, title: "Engraving", placeholder: "Leave empty to hide", defaultValue: D.loupe.engraving },
            ring: { type: ControlType.Color, title: "Ring", defaultValue: D.loupe.ring },
            engravingColor: { type: ControlType.Color, title: "Engraving", defaultValue: D.loupe.engravingColor, hidden: (p: any) => !p.engraving },
        },
    },
    lens: {
        type: ControlType.Object,
        title: "Lens Effects",
        controls: {
            reflection: { type: ControlType.Enum, title: "Reflection", options: ["real", "studio", "window", "ring", "softbox", "lamp", "off"], optionTitles: ["Real", "Studio", "Window", "Ring Light", "Softbox", "Lamp", "None"], defaultValue: D.loupe.reflection },
            distortion: { type: ControlType.Boolean, title: "Distortion", enabledTitle: "On", disabledTitle: "Off", defaultValue: D.loupe.distortion, description: "Bends the view like real glass." },
            edgeWarp: { type: ControlType.Boolean, title: "Edge Warp", enabledTitle: "On", disabledTitle: "Off", defaultValue: D.loupe.edgeWarp, hidden: (p: any) => !p.distortion },
            fringe: { type: ControlType.Boolean, title: "Colour Fringe", enabledTitle: "On", disabledTitle: "Off", defaultValue: D.loupe.fringe, hidden: (p: any) => !p.distortion },
        },
    },
    rest: {
        type: ControlType.Object,
        title: "When Idle",
        controls: {
            enabled: { type: ControlType.Boolean, title: "Loupe", enabledTitle: "Rests", disabledTitle: "Stays", defaultValue: D.rest.enabled, description: "Where the loupe waits between looks." },
            position: { type: ControlType.Enum, title: "Rests At", options: ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"], optionTitles: ["Top Left", "Top Center", "Top Right", "Middle Left", "Center", "Middle Right", "Bottom Left", "Bottom Center", "Bottom Right"], defaultValue: D.rest.position, hidden: (p: any) => !p.enabled },
            scale: { type: ControlType.Number, title: "Shrinks To", min: 0.4, max: 1, step: 0.02, defaultValue: D.rest.scale, hidden: (p: any) => !p.enabled },
        },
    },
    slide: {
        type: ControlType.Object,
        title: "On Tap",
        controls: {
            enabled: { type: ControlType.Boolean, title: "Open Slide", enabledTitle: "Yes", disabledTitle: "No", defaultValue: D.slide.enabled, description: "Lifts the frame out as a mounted slide." },
            morph: { type: ControlType.Boolean, title: "Lens Morph", enabledTitle: "On", disabledTitle: "Off", defaultValue: D.slide.morph, hidden: (p: any) => !p.enabled },
            name: { type: ControlType.String, title: "Top Label", defaultValue: D.slide.name, hidden: (p: any) => !p.enabled },
            caption: { type: ControlType.String, title: "Caption", placeholder: "Used when a photo has no title", defaultValue: D.slide.caption, hidden: (p: any) => !p.enabled },
            process: { type: ControlType.String, title: "Small Label", defaultValue: D.slide.process, hidden: (p: any) => !p.enabled },
            stamp: { type: ControlType.String, title: "Stamp", defaultValue: D.slide.stamp, hidden: (p: any) => !p.enabled },
            mount: { type: ControlType.Color, title: "Mount", defaultValue: D.slide.mount, hidden: (p: any) => !p.enabled },
            backdrop: { type: ControlType.Color, title: "Backdrop", defaultValue: D.slide.backdrop, hidden: (p: any) => !p.enabled },
        },
    },
    atmosphere: {
        type: ControlType.Object,
        title: "Mood",
        description: "Set the scene while someone is looking through the loupe.",
        controls: {
            darkroom: { type: ControlType.Boolean, title: "Dim Page", enabledTitle: "On", disabledTitle: "Off", defaultValue: D.atmosphere.darkroom, description: "Darkens everything around the light table, like a darkroom." },
            eye: { type: ControlType.Boolean, title: "Lens Only", enabledTitle: "On", disabledTitle: "Off", defaultValue: D.atmosphere.eye, description: "Like pressing your eye to the glass. Only the lens stays visible." },
            eyeDim: { type: ControlType.Number, title: "How Dark", min: 10, max: 100, step: 5, unit: "%", defaultValue: D.atmosphere.eyeDim, hidden: (p: any) => !p.eye },
        },
    },
    film: {
        type: ControlType.Object,
        title: "Film",
        controls: {
            stock: { type: ControlType.Enum, title: "Stock", options: ["negative", "positive"], optionTitles: ["Negative", "Slide"], displaySegmentedControl: true, defaultValue: D.film.stock },
            base: { type: ControlType.Color, title: "Base", defaultValue: D.film.base, hidden: only("stock", "negative") },
            positiveBase: { type: ControlType.Color, title: "Base", defaultValue: D.film.positiveBase, hidden: (p: any) => p.stock === "negative" },
            holes: { type: ControlType.Color, title: "Sprockets", defaultValue: D.film.holes },
            edgeNumbers: { type: ControlType.Boolean, title: "Frame Numbers", enabledTitle: "Show", disabledTitle: "Hide", defaultValue: D.film.edgeNumbers },
            edgeColor: { type: ControlType.Color, title: "Number Ink", defaultValue: D.film.edgeColor, hidden: (p: any) => !p.edgeNumbers },
        },
    },
    table: {
        type: ControlType.Object,
        title: "Light Table",
        controls: {
            light: { type: ControlType.Boolean, title: "Backlight", enabledTitle: "On", disabledTitle: "Off", defaultValue: D.table.light },
            color: { type: ControlType.Color, title: "Surface", defaultValue: D.table.color },
            grid: { type: ControlType.Boolean, title: "Grid", enabledTitle: "Show", disabledTitle: "Hide", defaultValue: D.table.grid },
            padding: { type: ControlType.Number, title: "Padding", min: 12, max: 120, unit: "px", defaultValue: D.table.padding },
        },
    },
    corners: {
        type: ControlType.Object,
        title: "Corners",
        controls: {
            table: { type: ControlType.Number, title: "Table", min: 0, max: 60, step: 1, unit: "px", defaultValue: D.corners.table },
            strip: { type: ControlType.Number, title: "Film Strip", min: 0, max: 24, step: 1, unit: "px", defaultValue: D.corners.strip },
            photo: { type: ControlType.Number, title: "Photo", min: 0, max: 24, step: 1, unit: "px", defaultValue: D.corners.photo },
            slide: { type: ControlType.Number, title: "Slide Mount", min: 0, max: 60, step: 1, unit: "px", defaultValue: D.corners.slide },
            window: { type: ControlType.Number, title: "Slide Window", min: 0, max: 40, step: 1, unit: "px", defaultValue: D.corners.window },
        },
    },
    ui: {
        type: ControlType.Object,
        title: "Text & Colours",
        controls: {
            showFooter: { type: ControlType.Boolean, title: "Caption Bar", enabledTitle: "Show", disabledTitle: "Hide", defaultValue: D.ui.showFooter },
            hint: { type: ControlType.String, title: "Desktop Hint", defaultValue: D.ui.hint, hidden: (p: any) => !p.showFooter },
            touchHint: { type: ControlType.String, title: "Phone Hint", defaultValue: D.ui.touchHint, hidden: (p: any) => !p.showFooter },
            text: { type: ControlType.Color, title: "Text", defaultValue: D.ui.text },
            muted: { type: ControlType.Color, title: "Soft Text", defaultValue: D.ui.muted },
            accent: { type: ControlType.Color, title: "Active Tab", defaultValue: D.ui.accent },
        },
    },
    copy: {
        type: ControlType.Object,
        title: "Text on Site",
        description: "Words people see on your live site. {n} and {total} become numbers.",
        controls: {
            frame: { type: ControlType.String, title: "Frame Count", defaultValue: D.copy.frame },
            open: { type: ControlType.String, title: "Open Hint", defaultValue: D.copy.open, placeholder: "Leave empty to hide" },
            back: { type: ControlType.String, title: "Close Hint", defaultValue: D.copy.back, placeholder: "Leave empty to hide" },
            page: { type: ControlType.String, title: "Page Count", defaultValue: D.copy.page },
            roll: { type: ControlType.String, title: "Roll Label", defaultValue: D.copy.roll },
            all: { type: ControlType.String, title: "All Tab", defaultValue: D.copy.all },
            ungrouped: { type: ControlType.String, title: "No-Roll Tab", defaultValue: D.copy.ungrouped },
            layout: { type: ControlType.String, title: "Layout Label", defaultValue: D.copy.layout },
            strips: { type: ControlType.String, title: "Strips", defaultValue: D.copy.strips },
            scroll: { type: ControlType.String, title: "Scroll", defaultValue: D.copy.scroll },
            sheet: { type: ControlType.String, title: "Sheet", defaultValue: D.copy.sheet },
            empty: { type: ControlType.String, title: "Empty State", defaultValue: D.copy.empty },
            label: { type: ControlType.String, title: "Screen Reader", defaultValue: D.copy.label },
        },
    },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 13 } },
    navigation: {
        type: ControlType.Object,
        title: "Controls on Site",
        controls: {
            rollTabs: { type: ControlType.Boolean, title: "Roll Tabs", enabledTitle: "Show", disabledTitle: "Hide", defaultValue: D.navigation.rollTabs, description: "Appears when you use 2+ rolls." },
            layoutSwitch: { type: ControlType.Boolean, title: "Layout Picker", enabledTitle: "Show", disabledTitle: "Hide", defaultValue: D.navigation.layoutSwitch },
            keyboard: { type: ControlType.Boolean, title: "Arrow Keys", enabledTitle: "On", disabledTitle: "Off", defaultValue: D.navigation.keyboard },
            edgeAdvance: { type: ControlType.Boolean, title: "Edge Scroll", enabledTitle: "On", disabledTitle: "Off", defaultValue: D.navigation.edgeAdvance, description: "Scroll layout: hover an edge to wind the reel." },
            edgeZone: { type: ControlType.Number, title: "Edge Zone", min: 5, max: 40, unit: "%", defaultValue: D.navigation.edgeZone, hidden: (p: any) => !p.edgeAdvance },
        },
    },
})
