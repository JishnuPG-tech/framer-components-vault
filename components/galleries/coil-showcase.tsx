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

import type { PropertyControls } from "framer"

/**
 * Coil Showcase
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

/*
 HOW TO USE
 1. Drop it on the page, set Width to Fill. In "Scroll" drive the section becomes
    (Scroll Length x screen height) tall and the coil turns while the visitor scrolls.
    Keep its parents free of "overflow: hidden" so the sticky stage can work.
 2. Add products in "Products" (Image, Title, Price, Link), or drop a Collection List into the
    "CMS" slot (per item: one image, then a title text, then a price text, and a link).
 3. On the Framer canvas you see one still pose; press Preview to see it move.
*/

const CREDIT_NAME = "Alpha Studio"
const CREDIT_URL = "https://www.framer.com/@alphastudio/"
const CREDIT_MD = `License by [${CREDIT_NAME}](${CREDIT_URL})`

/* ------------------------------ types ------------------------------ */

interface ImageAsset {
    src?: string
    srcSet?: string
    alt?: string
}

/** One product on the coil: from the manual list, the CMS slot or a bound "CMS Item". */
interface Product {
    image?: ImageAsset
    title?: string
    price?: string
    link?: string
}

type Mode = "coil" | "item"
type Source = "auto" | "cms" | "manual"
type Drive = "scroll" | "auto"
type Labels = "hover" | "always" | "off"
type FontStyle = React.CSSProperties

type CSSVars = React.CSSProperties & {
    [key: string]: string | number | undefined
}

interface Props {
    mode: Mode
    cms?: React.ReactNode
    source: Source
    items: Product[]
    drive: Drive
    scrollLength: number
    // coil
    perTurn: number
    itemScale: number
    ratio: number
    gap: number
    pitch: number
    tilt: number
    roll: number
    perspective: number
    turns: number
    rise: number
    idle: boolean
    idleSpeed: number
    parallax: number
    // look
    radius: number
    frameWidth: number
    frameColor: string
    bgFrom: string
    bgTo: string
    blobs: boolean
    blobA: string
    blobB: string
    textColor: string
    labels: Labels
    newTab: boolean
    headline: string
    subline: string
    hint: string
    calm: boolean
    font?: FontStyle
    style?: React.CSSProperties
    // "CMS Item" mode
    itemImage?: ImageAsset
    itemTitle?: string
    itemPrice?: string
    itemLink?: string
}

interface Motion {
    ps: number
    idle: number
    mx: number
    my: number
    tmx: number
    tmy: number
    raf: number
    last: number
    visible: boolean
    hover: boolean
    W: number
    H: number
}

interface RegisteredItem {
    el: HTMLElement
    data: Product
}

/* ----------------------------- helpers ----------------------------- */

const TAU = Math.PI * 2
const useIso =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function best(srcSet?: string, src?: string): string {
    if (!srcSet) return src || ""
    let b = src || ""
    let w = 0
    srcSet.split(",").forEach((part) => {
        const [u, d] = part.trim().split(/\s+/)
        const n = parseFloat(d || "0")
        if (u && n >= w) {
            w = n
            b = u
        }
    })
    return b
}

// Bound "CMS Item" instances register here (module level, filtered by DOM containment)
const store = {
    map: new Map<number, RegisteredItem>(),
    subs: new Set<() => void>(),
}
let uid = 0
const emit = () => store.subs.forEach((f) => f())

/** Reads image, title, price and link from a Collection List rendered in the CMS slot. */
function readSlot(root: HTMLElement): Product[] {
    const found: Product[] = []
    root.querySelectorAll("img").forEach((img) => {
        const srcsetAttr =
            img.getAttribute("srcset") || img.getAttribute("data-srcset") || ""
        const direct = [
            img.getAttribute("src"),
            img.currentSrc,
            img.getAttribute("data-src"),
        ].find((u): u is string => !!u && !u.startsWith("data:"))
        const src = direct || best(srcsetAttr, "")
        if (!src) return
        let node: HTMLElement = img
        while (
            node.parentElement &&
            node.parentElement !== root &&
            node.parentElement.querySelectorAll("img").length === 1
        )
            node = node.parentElement
        const texts = Array.from(node.querySelectorAll("p,h1,h2,h3,h4,h5,h6"))
            .map((t) => (t.textContent || "").trim())
            .filter(Boolean)
        const a = node.querySelector("a[href]") || node.closest("a")
        found.push({
            image: {
                src,
                srcSet: srcsetAttr || undefined,
                alt: img.getAttribute("alt") || texts[0] || "",
            },
            title: texts[0] || "",
            price: texts[1] || "",
            link: a ? a.getAttribute("href") || "" : "",
        })
    })
    return found
}

/* ---- built-in sample products (vector art, no photos, no licensing) ---- */

const TILE_BG = [
    ["#e6ebff", "#c9d4ff"],
    ["#ffe9ef", "#ffcfdd"],
    ["#e1f7ef", "#bfeadb"],
    ["#fff2dc", "#ffdfb5"],
    ["#ece6ff", "#d3c6ff"],
    ["#e0f3ff", "#bfe3ff"],
    ["#ffe9de", "#ffd0ba"],
    ["#e9f6e1", "#cde9bd"],
]

function product(i: number): string {
    const [a, b] = TILE_BG[i % 8]
    const ground =
        '<ellipse cx="300" cy="448" rx="150" ry="16" fill="rgba(40,50,120,.14)"/>'
    let body = ""
    switch (i % 8) {
        case 0: // bottle
            body =
                '<rect x="232" y="150" width="136" height="300" rx="52" fill="#97a4ee"/><rect x="232" y="150" width="136" height="300" rx="52" fill="url(#s)"/>' +
                '<rect x="262" y="96" width="76" height="70" rx="18" fill="#4a4f77"/><rect x="226" y="262" width="148" height="66" fill="rgba(255,255,255,.22)"/>' +
                '<rect x="248" y="178" width="14" height="230" rx="7" fill="rgba(255,255,255,.45)"/>'
            break
        case 1: // mug
            body =
                '<rect x="206" y="190" width="188" height="230" rx="40" fill="#f08aa8"/><rect x="206" y="190" width="188" height="230" rx="40" fill="url(#s)"/>' +
                '<path d="M394 232c58 0 58 126 0 126" fill="none" stroke="#f08aa8" stroke-width="30" stroke-linecap="round"/>' +
                '<path d="M262 150c-14-22 14-30 0-52M318 150c-14-22 14-30 0-52" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="10" stroke-linecap="round"/>'
            break
        case 2: // lamp
            body =
                '<ellipse cx="300" cy="432" rx="100" ry="14" fill="#6f75a8"/><path d="M300 430L300 300L360 190" fill="none" stroke="#6f75a8" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<path d="M312 150L430 190L396 258L282 214Z" fill="#7fb9e8"/><path d="M312 150L430 190L396 258L282 214Z" fill="url(#s)"/>' +
                '<circle cx="360" cy="222" r="18" fill="#fff6c8"/>'
            break
        case 3: // speaker
            body =
                '<rect x="190" y="130" width="220" height="310" rx="60" fill="#e0a65a"/><rect x="190" y="130" width="220" height="310" rx="60" fill="url(#s)"/>' +
                '<circle cx="300" cy="350" r="64" fill="#3f4268"/><circle cx="300" cy="350" r="26" fill="#6f75a8"/><circle cx="300" cy="212" r="30" fill="#3f4268"/><circle cx="300" cy="212" r="11" fill="#6f75a8"/>'
            break
        case 4: // plant pot
            body =
                '<path d="M222 330h156l-18 112H240z" fill="#a98cf0"/><path d="M222 330h156l-18 112H240z" fill="url(#s)"/><rect x="212" y="312" width="176" height="34" rx="14" fill="#8c6fe0"/>' +
                '<ellipse cx="256" cy="250" rx="30" ry="76" transform="rotate(-24 256 250)" fill="#5fbf8a"/><ellipse cx="344" cy="250" rx="30" ry="76" transform="rotate(24 344 250)" fill="#4fae7a"/><ellipse cx="300" cy="226" rx="30" ry="86" fill="#74d2a0"/>'
            break
        case 5: // watch
            body =
                '<rect x="262" y="90" width="76" height="350" rx="30" fill="#5da6e0"/><circle cx="300" cy="266" r="104" fill="#f4f6ff"/><circle cx="300" cy="266" r="104" fill="none" stroke="#3d4170" stroke-width="16"/>' +
                '<path d="M300 266V204M300 266L344 290" stroke="#3d4170" stroke-width="10" stroke-linecap="round"/><circle cx="300" cy="266" r="9" fill="#f08aa8"/>'
            break
        case 6: // sunglasses
            body =
                '<rect x="150" y="226" width="140" height="110" rx="44" fill="#3d4170"/><rect x="310" y="226" width="140" height="110" rx="44" fill="#3d4170"/>' +
                '<rect x="150" y="226" width="140" height="110" rx="44" fill="url(#s)"/><rect x="310" y="226" width="140" height="110" rx="44" fill="url(#s)"/>' +
                '<path d="M290 262q10-16 20 0" fill="none" stroke="#3d4170" stroke-width="12" stroke-linecap="round"/><path d="M150 252L110 232M450 252L490 232" stroke="#3d4170" stroke-width="12" stroke-linecap="round"/>'
            break
        default: // backpack
            body =
                '<rect x="200" y="160" width="200" height="280" rx="70" fill="#8ccf6a"/><rect x="200" y="160" width="200" height="280" rx="70" fill="url(#s)"/>' +
                '<rect x="232" y="330" width="136" height="80" rx="24" fill="#6fb552"/><path d="M262 160c0-44 76-44 76 0" fill="none" stroke="#6fb552" stroke-width="16" stroke-linecap="round"/>' +
                '<rect x="262" y="360" width="76" height="12" rx="6" fill="rgba(255,255,255,.7)"/>'
    }
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="520" viewBox="0 0 600 520"><defs>` +
        `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>` +
        `<linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="rgba(255,255,255,.35)"/><stop offset=".5" stop-color="rgba(255,255,255,0)"/><stop offset="1" stop-color="rgba(0,0,0,.14)"/></linearGradient></defs>` +
        `<rect width="600" height="520" fill="url(#g)"/><circle cx="470" cy="110" r="120" fill="rgba(255,255,255,.35)"/><circle cx="110" cy="440" r="90" fill="rgba(255,255,255,.28)"/>${ground}${body}</svg>`
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg)
}

const SAMPLE_NAMES = [
    "Aero Bottle",
    "Cloud Mug",
    "Halo Lamp",
    "Pulse Speaker",
    "Fern Pot",
    "Tide Watch",
    "Mist Shades",
    "Roam Pack",
]
const SAMPLE_PRICES = ["$38", "$24", "$64", "$89", "$32", "$120", "$58", "$76"]
const SAMPLES: Product[] = SAMPLE_NAMES.map((title, i) => ({
    title,
    price: SAMPLE_PRICES[i],
    image: { src: product(i), alt: title },
}))

const CSS = `
.cs-root{position:relative;width:100%;color:var(--txt)}
.cs-stage{position:relative;width:100%;overflow:hidden;background:linear-gradient(160deg,var(--bg1),var(--bg2));perspective:var(--persp);perspective-origin:50% 45%}
.cs-stage[data-sticky="1"]{position:sticky;top:0;height:100vh}
@supports (height:100svh){.cs-stage[data-sticky="1"]{height:100svh}}
.cs-blob{position:absolute;border-radius:50%;opacity:.85;pointer-events:none;will-change:transform;animation:csDrift 16s ease-in-out infinite alternate}
.cs-blob.a{width:80vmin;height:80vmin;left:-18%;top:-26%;background:radial-gradient(closest-side,var(--ba),transparent)}
.cs-blob.b{width:92vmin;height:92vmin;right:-22%;bottom:-36%;background:radial-gradient(closest-side,var(--bb),transparent);animation-delay:-6s}
.cs-text{position:absolute;left:0;right:0;top:9%;z-index:6;text-align:center;pointer-events:none;padding:0 24px;will-change:opacity,transform}
.cs-head{margin:0;font-size:clamp(34px,6.4vmin,76px);line-height:1.02;font-weight:700;letter-spacing:-.035em}
.cs-sub{margin:14px auto 0;max-width:34ch;font-size:clamp(14px,2.2vmin,20px);line-height:1.5;opacity:.62}
.cs-hint{display:inline-flex;align-items:center;gap:10px;margin-top:22px;padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;background:rgba(255,255,255,.7);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 8px 22px rgba(50,60,140,.1)}
.cs-mouse{position:relative;width:14px;height:22px;border-radius:8px;border:1.6px solid currentColor}
.cs-mouse::after{content:"";position:absolute;left:50%;top:4px;width:2px;height:5px;margin-left:-1px;border-radius:2px;background:currentColor;animation:csWheel 1.6s ease-in-out infinite}
.cs-scene{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;will-change:transform}
.cs-item{position:absolute;left:0;top:0;transform-style:preserve-3d;backface-visibility:hidden;-webkit-backface-visibility:hidden;will-change:transform,opacity}
.cs-card{position:relative;display:block;width:100%;height:100%;box-sizing:border-box;overflow:hidden;border:var(--fw) solid var(--frame);border-radius:var(--rad);background:var(--frame);box-shadow:0 26px 44px -14px rgba(50,60,140,.32),0 2px 6px rgba(50,60,140,.08);color:inherit;text-decoration:none;transform:translateZ(0) scale(1);transition:transform .5s cubic-bezier(.22,1,.36,1),box-shadow .5s ease;-webkit-tap-highlight-color:transparent}
.cs-card:hover,.cs-card:focus-visible{transform:translateZ(40px) scale(1.07);box-shadow:0 40px 64px -16px rgba(50,60,140,.42),0 2px 8px rgba(50,60,140,.1);outline:none}
.cs-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;user-select:none;pointer-events:none}
.cs-shade{position:absolute;inset:0;pointer-events:none;background:rgba(24,28,80,.38);opacity:0;will-change:opacity}
.cs-ph{position:absolute;inset:0;display:grid;place-items:center;background:linear-gradient(135deg,#eef0ff,#dfe4ff);color:rgba(60,70,140,.3)}
.cs-label{position:absolute;left:10px;right:10px;bottom:10px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 14px;border-radius:999px;font-size:13px;font-weight:600;line-height:1.2;color:#1b1f3a;background:rgba(255,255,255,.8);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 8px 20px rgba(30,40,100,.14);opacity:0;transform:translateY(10px);transition:opacity .35s ease,transform .45s cubic-bezier(.22,1,.36,1)}
.cs-label span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cs-label b{flex:none;font-weight:700}
.cs-label svg{flex:none;width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.cs-card:hover .cs-label,.cs-card:focus-visible .cs-label,.cs-root[data-labels="always"] .cs-label{opacity:1;transform:none}
.cs-root[data-labels="off"] .cs-label{display:none}
@media (hover:none){.cs-root[data-labels="hover"] .cs-label{opacity:1;transform:none}}
@keyframes csDrift{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(6%,8%,0) scale(1.12)}}
@keyframes csWheel{0%{opacity:0;transform:translateY(0)}30%{opacity:1}100%{opacity:0;transform:translateY(8px)}}
.cs-root[data-calm="1"] .cs-blob,.cs-root[data-calm="1"] .cs-mouse::after{animation:none}
.cs-root[data-static="1"] *,.cs-root[data-static="1"] *::after{animation:none!important;transition:none!important}
@media (prefers-reduced-motion:reduce){.cs-blob,.cs-mouse::after{animation:none}.cs-card,.cs-label{transition:none}}
`

/* --------------------------- the component --------------------------- */

function Coil(props: Props) {
    const P = React.useRef(props)
    P.current = props

    const {
        cms,
        source,
        items: manual,
        drive,
        scrollLength,
        radius,
        frameWidth,
        frameColor,
        bgFrom,
        bgTo,
        blobs,
        blobA,
        blobB,
        textColor,
        labels,
        newTab,
        headline,
        subline,
        hint,
        calm,
        perspective,
        font,
        style,
    } = props

    // canvas, thumbnails and exports: one still pose, no loop, no listeners
    const isStatic = useIsStaticRenderer()
    const scrollMode = drive === "scroll" && !isStatic

    const rootRef = React.useRef<HTMLElement>(null)
    const stageRef = React.useRef<HTMLDivElement>(null)
    const sceneRef = React.useRef<HTMLDivElement>(null)
    const textRef = React.useRef<HTMLDivElement>(null)
    const slotRef = React.useRef<HTMLDivElement>(null)
    const itemRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const shadeRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const cache = React.useRef<
        { w: number; h: number; op: number; pe: number; sh: number }[]
    >([])
    const sceneCache = React.useRef("")
    const sigRef = React.useRef("")
    const reduce = React.useRef(false)

    const [scraped, setScraped] = React.useState<Product[]>([])
    const [regVer, setRegVer] = React.useState(0)

    /* ---- bound "CMS Item" instances inside this coil's slot ---- */
    React.useEffect(() => {
        const f = () => setRegVer((v) => v + 1)
        store.subs.add(f)
        f()
        return () => {
            store.subs.delete(f)
        }
    }, [])
    const bound = React.useMemo<Product[]>(() => {
        const root = rootRef.current
        if (!root) return []
        return Array.from(store.map.values())
            .filter((e) => root.contains(e.el))
            .sort((a, b) =>
                a.el.compareDocumentPosition(b.el) &
                Node.DOCUMENT_POSITION_FOLLOWING
                    ? -1
                    : 1
            )
            .map((e) => e.data)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [regVer])
    const cmsItems = bound.length ? bound : scraped
    const manualList = React.useMemo<Product[]>(
        () => (Array.isArray(manual) ? manual : []),
        [manual]
    )
    const base = React.useMemo<Product[]>(() => {
        if (source === "manual") return manualList
        if (source === "cms") return cmsItems
        return cmsItems.length ? cmsItems : manualList
    }, [source, cmsItems, manualList])

    // a coil needs at least ~1.6 turns of products to look full, so short lists repeat
    const list = React.useMemo<Product[]>(() => {
        if (!base.length) return []
        const want = Math.ceil(clamp(props.perTurn, 3, 16) * 1.6)
        const out: Product[] = []
        while (out.length < Math.max(want, base.length))
            out.push(base[out.length % base.length])
        return out
    }, [base, props.perTurn])
    const n = list.length
    const listRef = React.useRef(list)
    listRef.current = list

    const M = React.useRef<Motion>({
        ps: 0,
        idle: 0,
        mx: 0,
        my: 0,
        tmx: 0,
        tmy: 0,
        raf: 0,
        last: 0,
        visible: true,
        hover: false,
        W: 1100,
        H: typeof style?.height === "number" ? style.height : 700,
    })

    /* ---- put every product on the coil for the current pose ---- */
    const render = React.useCallback(() => {
        const nn = listRef.current.length
        const scene = sceneRef.current
        if (!nn || !scene) return
        const pr = P.current
        const m = M.current
        const K = clamp(pr.perTurn, 3, 16)
        const ih = Math.max(
            60,
            Math.min(
                m.H * clamp(pr.itemScale, 0.12, 0.7),
                (m.W * 0.5) / Math.max(0.4, pr.ratio)
            )
        )
        const iw = ih * clamp(pr.ratio, 0.4, 2.2)
        const R = (K * (iw + pr.gap)) / TAU
        const stepY = (ih * clamp(pr.pitch, 0.3, 3)) / K
        const dTheta = TAU / K
        const c = (nn - 1) / 2

        const staticPose = isStaticRef.current
        const rot =
            (staticPose ? 0.3 : m.ps) * pr.turns * TAU +
            (m.idle * Math.PI) / 180
        const ty = scrollModeRef.current
            ? lerp(pr.rise * 0.55 * m.H, -pr.rise * 0.75 * m.H, m.ps)
            : staticPose
              ? 0
              : 0

        const sceneT =
            `translate3d(0,${ty.toFixed(1)}px,0) rotateY(${m.mx.toFixed(2)}deg) rotateX(${(-pr.tilt + m.my).toFixed(2)}deg) ` +
            `rotateZ(${pr.roll}deg) translateZ(${(-R).toFixed(1)}px)`
        if (sceneT !== sceneCache.current) {
            sceneCache.current = sceneT
            scene.style.transform = sceneT
        }

        for (let i = 0; i < nn; i++) {
            const el = itemRefs.current[i]
            if (!el) continue
            let k = cache.current[i]
            if (!k)
                k = cache.current[i] = { w: 0, h: 0, op: -1, pe: -1, sh: -1 }
            const th = (i - c) * dTheta + rot
            const f = Math.cos(th)
            // size only changes on resize, so it is not touched on every frame (no layout work)
            if (k.w !== iw || k.h !== ih) {
                k.w = iw
                k.h = ih
                el.style.width = `${iw.toFixed(1)}px`
                el.style.height = `${ih.toFixed(1)}px`
                el.style.marginLeft = `${(-iw / 2).toFixed(1)}px`
                el.style.marginTop = `${(-ih / 2).toFixed(1)}px`
            }
            el.style.transform = `translate3d(0,${((i - c) * -stepY).toFixed(1)}px,0) rotateY(${th.toFixed(4)}rad) translateZ(${R.toFixed(1)}px)`
            const op = f > 0.1 ? clamp((f - 0.1) / 0.35, 0, 1) : 0
            if (Math.abs(op - k.op) > 0.01 || (op === 0) !== (k.op === 0)) {
                k.op = op
                el.style.opacity = op.toFixed(2)
            }
            const pe = f > 0.3 ? 1 : 0
            if (pe !== k.pe) {
                k.pe = pe
                el.style.pointerEvents = pe ? "auto" : "none"
            }
            // depth shading: only an opacity change on its own layer, no repaint
            const sh = clamp((1 - f) * 0.9, 0, 1)
            const shade = shadeRefs.current[i]
            if (shade && Math.abs(sh - k.sh) > 0.02) {
                k.sh = sh
                shade.style.opacity = sh.toFixed(2)
            }
        }

        const tx = textRef.current
        if (tx) {
            const fade = scrollModeRef.current
                ? 1 - clamp(m.ps / 0.12, 0, 1)
                : 1
            tx.style.opacity = String(fade)
            tx.style.transform = `translate3d(0,${((1 - fade) * -30).toFixed(1)}px,0)`
        }
    }, [])
    const isStaticRef = React.useRef(isStatic)
    isStaticRef.current = isStatic
    const scrollModeRef = React.useRef(scrollMode)
    scrollModeRef.current = scrollMode

    /* ---- frame loop: scroll progress, idle spin, mouse parallax ---- */
    const tick = React.useCallback((t: number) => {
        const m = M.current
        const pr = P.current
        const dt = clamp((t - (m.last || t)) / 1000, 0.001, 1 / 20)
        m.last = t
        const root = rootRef.current
        const stage = stageRef.current
        if (!root || !stage || isStaticRef.current) {
            m.raf = 0
            return
        }
        m.W = stage.offsetWidth || m.W
        m.H = stage.offsetHeight || m.H

        let target = 0.35
        if (scrollModeRef.current) {
            const r = root.getBoundingClientRect()
            const total = Math.max(1, r.height - stage.offsetHeight)
            target = clamp(-r.top / total, 0, 1)
        }
        m.ps += (target - m.ps) * (reduce.current ? 1 : Math.min(1, dt * 6))
        const calmNow = pr.calm || reduce.current
        if (pr.idle && !calmNow)
            m.idle += pr.idleSpeed * dt * (m.hover ? 0.2 : 1)
        const k = Math.min(1, dt * 5)
        m.mx += (m.tmx - m.mx) * k
        m.my += (m.tmy - m.my) * k
        render()

        const settling =
            Math.abs(target - m.ps) > 0.0005 ||
            Math.abs(m.tmx - m.mx) > 0.02 ||
            Math.abs(m.tmy - m.my) > 0.02
        const spinning = pr.idle && !calmNow && pr.idleSpeed !== 0
        const watchScroll = scrollModeRef.current
        if (
            m.visible &&
            !document.hidden &&
            (settling || spinning || watchScroll)
        )
            m.raf = requestAnimationFrame(tick)
        else {
            m.raf = 0
            m.last = 0
        }
    }, [])
    const kick = React.useCallback(() => {
        const m = M.current
        if (m.raf || isStaticRef.current) return
        m.last = 0
        m.raf = requestAnimationFrame(tick)
    }, [])

    /* ---- measure, then draw one frame (static) or start the loop ---- */
    useIso(() => {
        const stage = stageRef.current
        if (!stage) return
        const m = M.current
        m.W = stage.offsetWidth || m.W
        m.H = stage.offsetHeight || m.H
        render()
        if (!isStatic) kick()
    })

    React.useEffect(() => {
        reduce.current = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        return () => cancelAnimationFrame(M.current.raf)
    }, [])

    React.useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        const stage = stageRef.current
        if (!root || !stage) return
        let raf = 0
        const ro = new ResizeObserver(() => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                M.current.W = stage.offsetWidth || M.current.W
                M.current.H = stage.offsetHeight || M.current.H
                render()
                kick()
            })
        })
        ro.observe(stage)
        let io: IntersectionObserver | undefined
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(([e]) => {
                M.current.visible = e.isIntersecting
                if (e.isIntersecting) kick()
            })
            io.observe(root)
        }
        const onVis = () => {
            if (!document.hidden) kick()
        }
        document.addEventListener("visibilitychange", onVis)
        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
        }
    }, [isStatic])

    /* ---- CMS slot: live while running, one read when static ---- */
    React.useEffect(() => {
        const root = slotRef.current
        if (!root) return
        root.setAttribute("inert", "")
        const scrape = () => {
            const found = readSlot(root)
            const sig = JSON.stringify(
                found.map((f) => [f.image?.src, f.title, f.price, f.link])
            )
            if (sig !== sigRef.current) {
                sigRef.current = sig
                setScraped(found)
            }
        }
        scrape()
        const t1 = setTimeout(scrape, 400)
        if (isStatic) return () => clearTimeout(t1)
        const t2 = setTimeout(scrape, 1500)
        let raf = 0
        const mo = new MutationObserver(() => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(scrape)
        })
        mo.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "srcset"],
            characterData: true,
        })
        return () => {
            mo.disconnect()
            cancelAnimationFrame(raf)
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [isStatic])

    /* ---- mouse parallax ---- */
    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || calm || reduce.current || e.pointerType !== "mouse")
            return
        const r = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        const pa = P.current.parallax
        M.current.tmx = x * pa * 2
        M.current.tmy = -y * pa * 1.4
        kick()
    }
    const onLeave = () => {
        M.current.tmx = 0
        M.current.tmy = 0
        M.current.hover = false
        kick()
    }

    const rootStyle: CSSVars = {
        ...style,
        "--txt": textColor,
        "--bg1": bgFrom,
        "--bg2": bgTo,
        "--ba": blobA,
        "--bb": blobB,
        "--frame": frameColor,
        "--fw": `${frameWidth}px`,
        "--rad": `${radius}px`,
        "--persp": `${clamp(perspective, 400, 4000)}px`,
        ...font,
    }
    if (scrollMode) rootStyle.height = `${clamp(scrollLength, 1, 12) * 100}vh`

    return (
        <section
            ref={rootRef}
            className="cs-root"
            data-static={isStatic ? "1" : "0"}
            data-calm={calm ? "1" : "0"}
            data-labels={labels}
            aria-label={headline || "Product showcase"}
            style={rootStyle}
        >
            <style>{CSS}</style>

            {/* CMS slot: rendered invisibly, read by the coil */}
            <div
                ref={slotRef}
                aria-hidden="true"
                style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    width: "100vw",
                    transform: "scale(0.0001)",
                    transformOrigin: "0 0",
                    opacity: 0,
                    pointerEvents: "none",
                    zIndex: -1,
                }}
            >
                {cms}
            </div>

            <div
                ref={stageRef}
                className="cs-stage"
                data-sticky={scrollMode ? "1" : "0"}
                onPointerMove={onMove}
                onPointerLeave={onLeave}
                style={
                    scrollMode
                        ? undefined
                        : { height: style?.height ? "100%" : 700 }
                }
            >
                {blobs && (
                    <>
                        <div className="cs-blob a" />
                        <div className="cs-blob b" />
                    </>
                )}

                {(headline || subline || (hint && scrollMode)) && (
                    <div ref={textRef} className="cs-text">
                        {headline && <h2 className="cs-head">{headline}</h2>}
                        {subline && <p className="cs-sub">{subline}</p>}
                        {hint && scrollMode && (
                            <span className="cs-hint">
                                <i className="cs-mouse" />
                                {hint}
                            </span>
                        )}
                    </div>
                )}

                <div ref={sceneRef} className="cs-scene">
                    {list.map((it, i) => {
                        const Tag = it.link ? "a" : "div"
                        const linkProps = it.link
                            ? {
                                  href: it.link,
                                  ...(newTab
                                      ? {
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                        }
                                      : {}),
                              }
                            : {}
                        return (
                            <div
                                key={i}
                                ref={(el) => {
                                    itemRefs.current[i] = el
                                }}
                                className="cs-item"
                            >
                                <Tag
                                    className="cs-card"
                                    {...linkProps}
                                    aria-label={
                                        it.title
                                            ? `${it.title}${it.price ? `, ${it.price}` : ""}`
                                            : undefined
                                    }
                                    onPointerEnter={() =>
                                        (M.current.hover = true)
                                    }
                                    onPointerLeave={() =>
                                        (M.current.hover = false)
                                    }
                                >
                                    {it.image?.src ? (
                                        <img
                                            src={it.image.src}
                                            srcSet={it.image.srcSet}
                                            alt={it.image.alt || it.title || ""}
                                            draggable={false}
                                            decoding="async"
                                            loading={i < 8 ? "eager" : "lazy"}
                                        />
                                    ) : (
                                        <div
                                            className="cs-ph"
                                            aria-hidden="true"
                                        >
                                            <svg
                                                width="46"
                                                height="46"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
                                                <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm3.5 3.2a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM5 17h14l-4.4-6-3.3 4.3-2.2-2.6z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div
                                        className="cs-shade"
                                        ref={(el) => {
                                            shadeRefs.current[i] = el
                                        }}
                                    />
                                    {(it.title || it.price) && (
                                        <div className="cs-label">
                                            <span>{it.title}</span>
                                            {it.price && <b>{it.price}</b>}
                                            {it.link && (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M7 17L17 7M9 7h8v8" />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                </Tag>
                            </div>
                        )
                    })}
                </div>

                {n === 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            border: "1px dashed currentColor",
                            borderRadius: 16,
                            fontSize: 14,
                            opacity: isStatic ? 0.6 : 0,
                        }}
                    >
                        {source === "cms"
                            ? 'No CMS items found yet. Put a Collection List in the CMS slot (1 image + title and price text per item), or put a Coil Showcase set to "CMS Item" inside each item and bind its fields.'
                            : "Add products in the properties panel."}
                    </div>
                )}
            </div>
        </section>
    )
}

/* ------------------- "CMS Item" role (draws nothing) ------------------- */

// Same component, second role: put one inside each Collection List item (inside the
// coil's CMS slot) and bind its fields to the CMS.
function CoilItem(props: Props) {
    const ref = React.useRef<HTMLSpanElement>(null)
    const id = React.useRef(0)
    if (!id.current) id.current = ++uid
    const isStatic = useIsStaticRenderer()

    const img = props.itemImage
    const data: Product = {
        image:
            img && img.src
                ? {
                      src: img.src,
                      srcSet: img.srcSet,
                      alt: img.alt || props.itemTitle || "",
                  }
                : undefined,
        title: props.itemTitle || "",
        price: props.itemPrice || "",
        link: props.itemLink || "",
    }
    const key = JSON.stringify(data)
    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        store.map.set(id.current, { el, data })
        emit()
        return () => {
            store.map.delete(id.current)
            emit()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])

    return (
        <span
            ref={ref}
            style={
                isStatic
                    ? {
                          display: "inline-block",
                          padding: "6px 10px",
                          border: "1px dashed #8b8fa3",
                          borderRadius: 8,
                          font: "12px system-ui, sans-serif",
                          color: "#8b8fa3",
                      }
                    : { display: "none" }
            }
        >
            {isStatic
                ? `Coil Showcase item: ${props.itemTitle || "(bind title)"}`
                : null}
        </span>
    )
}

export default function CoilShowcase(props: Props) {
    return props.mode === "item" ? <CoilItem {...props} /> : <Coil {...props} />
}

CoilShowcase.defaultProps = {
    width: 1100,
    height: 700,
    mode: "coil",
    source: "auto",
    items: SAMPLES,
    drive: "scroll",
    scrollLength: 4,
    perTurn: 14,
    itemScale: 0.34,
    ratio: 1.2,
    gap: 10,
    pitch: 1.15,
    tilt: 14,
    roll: 7,
    perspective: 1700,
    turns: 1.3,
    rise: 1.1,
    idle: true,
    idleSpeed: 5,
    parallax: 6,
    radius: 22,
    frameWidth: 6,
    frameColor: "#ffffff",
    bgFrom: "#f4f6ff",
    bgTo: "#e8edff",
    blobs: true,
    blobA: "#cdd6ff",
    blobB: "#ffd3e2",
    textColor: "#1b1f3a",
    labels: "hover",
    newTab: false,
    headline: "New Season",
    subline: "Soft essentials, made to be noticed.",
    hint: "Scroll",
    calm: false,
}

/* ------------------------- property controls ------------------------- */

type Controls = PropertyControls<Props>

const COIL_CONTROLS: Controls = {
    cms: {
        type: ControlType.ComponentInstance,
        title: "CMS",
        description:
            "Drop a Collection List here. Per item: 1 image, then a title text, then a price text, and a link on the item. Or put a Coil Showcase set to CMS Item inside each item and bind its fields.",
    },
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["auto", "cms", "manual"],
        optionTitles: ["Auto (CMS first)", "CMS only", "Manual only"],
        defaultValue: "auto",
    },
    items: {
        type: ControlType.Array,
        title: "Products",
        description: "Used when the CMS slot is empty (or Source = Manual).",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title" },
                price: { type: ControlType.String, title: "Price" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    drive: {
        type: ControlType.Enum,
        title: "Moves With",
        options: ["scroll", "auto"],
        optionTitles: ["Page scroll", "Time (fixed size)"],
        defaultValue: "scroll",
        description:
            "Scroll: the section grows tall and the coil turns as the visitor scrolls. Time: it keeps the size you give it.",
    },
    scrollLength: {
        type: ControlType.Number,
        title: "Scroll Length",
        description: "Section height in screens.",
        min: 1.5,
        max: 10,
        step: 0.5,
        hidden: (p) => p.drive !== "scroll",
    },
    headline: { type: ControlType.String, title: "Headline" },
    subline: { type: ControlType.String, title: "Text", displayTextArea: true },
    hint: {
        type: ControlType.String,
        title: "Scroll Hint",
        hidden: (p) => p.drive !== "scroll",
    },
    perTurn: {
        type: ControlType.Number,
        title: "Per Turn",
        description:
            "Products in one full turn of the coil. Fewer = bigger gaps.",
        min: 4,
        max: 14,
        step: 1,
    },
    itemScale: {
        type: ControlType.Number,
        title: "Product Size",
        description: "Height as a share of the section height.",
        min: 0.15,
        max: 0.6,
        step: 0.01,
    },
    ratio: {
        type: ControlType.Number,
        title: "Shape",
        description:
            "Width / height. 1 square, 1.15 slightly wide, 0.8 portrait.",
        min: 0.6,
        max: 1.8,
        step: 0.01,
    },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 80, step: 1 },
    pitch: {
        type: ControlType.Number,
        title: "Coil Spacing",
        description:
            "Vertical distance between two turns. Higher spreads the coil out.",
        min: 0.5,
        max: 2.5,
        step: 0.05,
    },
    tilt: {
        type: ControlType.Number,
        title: "Camera Tilt",
        description: "Leans the top of the coil toward the visitor (degrees).",
        min: 0,
        max: 50,
        step: 1,
    },
    roll: {
        type: ControlType.Number,
        title: "Roll",
        description: "Slope of the ribbon. Positive tilts right side down.",
        min: -30,
        max: 30,
        step: 1,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        description: "Lower = stronger 3D, higher = flatter.",
        min: 600,
        max: 3000,
        step: 50,
    },
    turns: {
        type: ControlType.Number,
        title: "Turns on Scroll",
        description:
            "How many full turns the coil makes over the whole scroll.",
        min: 0,
        max: 4,
        step: 0.05,
    },
    rise: {
        type: ControlType.Number,
        title: "Rise",
        description:
            "How far the coil travels up the screen while scrolling. 0 keeps it in place.",
        min: 0,
        max: 2.5,
        step: 0.05,
        hidden: (p) => p.drive !== "scroll",
    },
    idle: {
        type: ControlType.Boolean,
        title: "Slow Spin",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    idleSpeed: {
        type: ControlType.Number,
        title: "Spin Speed",
        description: "Degrees per second. Negative spins the other way.",
        min: -30,
        max: 30,
        step: 0.5,
        hidden: (p) => !p.idle,
    },
    parallax: {
        type: ControlType.Number,
        title: "Mouse Parallax",
        description:
            "How far the coil leans with the mouse (degrees). 0 = off.",
        min: 0,
        max: 14,
        step: 0.5,
    },
    labels: {
        type: ControlType.Enum,
        title: "Labels",
        options: ["hover", "always", "off"],
        optionTitles: ["On hover", "Always", "Off"],
        defaultValue: "hover",
        description: "Title and price pill on each product.",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "Links",
        enabledTitle: "New tab",
        disabledTitle: "Same tab",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
    },
    frameWidth: {
        type: ControlType.Number,
        title: "Frame",
        min: 0,
        max: 20,
        step: 1,
    },
    frameColor: { type: ControlType.Color, title: "Frame Color" },
    bgFrom: { type: ControlType.Color, title: "Background" },
    bgTo: { type: ControlType.Color, title: "Background 2" },
    blobs: {
        type: ControlType.Boolean,
        title: "Soft Glow",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    blobA: {
        type: ControlType.Color,
        title: "Glow 1",
        hidden: (p) => !p.blobs,
    },
    blobB: {
        type: ControlType.Color,
        title: "Glow 2",
        hidden: (p) => !p.blobs,
    },
    textColor: { type: ControlType.Color, title: "Text" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontWeight: 500,
    },
    // Last control in the panel. Framer shows a control's description just above it and
    // renders Markdown links, so "Alpha Studio" itself is the clickable link.
    calm: {
        type: ControlType.Boolean,
        title: "Calm Mode",
        description: `Turns off the slow spin, mouse parallax and glow drift.\n\n${CREDIT_MD}`,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
}

const ITEM_CONTROLS: Controls = {
    itemImage: { type: ControlType.ResponsiveImage, title: "Image" },
    itemTitle: { type: ControlType.String, title: "Title" },
    itemPrice: { type: ControlType.String, title: "Price" },
    itemLink: { type: ControlType.Link, title: "Link" },
}

/** Hides every control in a group when `test` is true (on top of its own `hidden`). */
function hideWhen(group: Controls, test: (p: Props) => boolean): Controls {
    const out: Record<string, unknown> = {}
    Object.keys(group).forEach((k) => {
        const ctl = group[k as keyof Props] as
            | { hidden?: (p: Props) => boolean }
            | undefined
        if (!ctl) return
        const prev = ctl.hidden
        out[k] = {
            ...ctl,
            hidden: (p: Props) => test(p) || (prev ? prev(p) : false),
        }
    })
    return out as Controls
}

addPropertyControls(CoilShowcase, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["coil", "item"],
        optionTitles: ["Coil", "CMS Item"],
        defaultValue: "coil",
        description:
            "Coil = the showcase. CMS Item = put inside a Collection List item and bind its fields.",
    },
    ...hideWhen(COIL_CONTROLS, (p) => p.mode === "item"),
    ...hideWhen(ITEM_CONTROLS, (p) => p.mode !== "item"),
})
