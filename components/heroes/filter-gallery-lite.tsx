/**
 * Webzost Gallery Lite — free, filterable bento image gallery for Framer
 * Developed by Webzost
 *
 * Add images, titles, text and categories in the property panel.
 * Visitors can filter by category and open any image in a fullscreen lightbox.
 *
 * Lite = manual content + Bento layout.
 * Need CMS Collection List support, Masonry / Grid / List layouts, a live layout switcher,
 * search, sorting, pagination and advanced hover effects? Get Dynamic CMS Gallery Pro.
 */
import * as React from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, LayoutGroup } from "framer-motion"

/* ───────────────────────── constants ───────────────────────── */

const ALL = "__all__"
const EASE = "cubic-bezier(.22,1,.36,1)"
const SOFT = "cubic-bezier(.16,1,.3,1)"
// Link to your paid component. Change it here if the listing URL ever changes.
const PRO_URL =
    "https://www.framer.com/marketplace/components/webzost-cms-gallery/"
const useIso =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/* Bento packing: tiles come in "bands" that each fill a full rectangle, so the grid never has holes,
   whatever the number of items, columns or active filter. Cell = [column, row, colSpan, rowSpan]. */
type Cell = [number, number, number, number]
type Band = { h: number; cells: Cell[] }
const BANDS_2: Band[] = [
    {
        h: 2,
        cells: [
            [1, 1, 1, 2],
            [2, 1, 1, 1],
            [2, 2, 1, 1],
        ],
    },
    {
        h: 1,
        cells: [
            [1, 1, 1, 1],
            [2, 1, 1, 1],
        ],
    },
    {
        h: 2,
        cells: [
            [1, 1, 1, 1],
            [1, 2, 1, 1],
            [2, 1, 1, 2],
        ],
    },
    {
        h: 1,
        cells: [
            [1, 1, 1, 1],
            [2, 1, 1, 1],
        ],
    },
]
const BANDS_3: Band[] = [
    {
        h: 2,
        cells: [
            [1, 1, 2, 2],
            [3, 1, 1, 1],
            [3, 2, 1, 1],
        ],
    },
    {
        h: 2,
        cells: [
            [1, 1, 1, 2],
            [2, 1, 1, 1],
            [2, 2, 1, 1],
            [3, 1, 1, 2],
        ],
    },
    {
        h: 2,
        cells: [
            [1, 1, 1, 1],
            [1, 2, 1, 1],
            [2, 1, 2, 2],
        ],
    },
]
const BANDS_4: Band[] = [
    {
        h: 2,
        cells: [
            [1, 1, 2, 2],
            [3, 1, 1, 1],
            [4, 1, 1, 1],
            [3, 2, 1, 1],
            [4, 2, 1, 1],
        ],
    },
    {
        h: 2,
        cells: [
            [1, 1, 1, 2],
            [2, 1, 1, 1],
            [3, 1, 1, 2],
            [4, 1, 1, 1],
            [2, 2, 1, 1],
            [4, 2, 1, 1],
        ],
    },
    {
        h: 2,
        cells: [
            [1, 1, 1, 1],
            [2, 1, 1, 1],
            [1, 2, 1, 1],
            [2, 2, 1, 1],
            [3, 1, 2, 2],
        ],
    },
]
/** Last few items: widths spread evenly, and wide tiles get more rows so nothing turns into a thin strip. */
function tailBand(k: number, cols: number): Band {
    const base = Math.floor(cols / k)
    const extra = cols % k
    const maxW = base + (extra ? 1 : 0)
    const h = maxW <= 1 ? 1 : maxW <= 3 ? 2 : 3
    let c = 1
    const cells: Cell[] = []
    for (let i = 0; i < k; i++) {
        const w = base + (i < extra ? 1 : 0)
        cells.push([c, 1, w, h])
        c += w
    }
    return { h, cells }
}
function bentoLayout(
    n: number,
    cols: number
): { c: number; r: number; w: number; h: number }[] {
    const out: { c: number; r: number; w: number; h: number }[] = []
    if (cols <= 1) {
        for (let i = 0; i < n; i++) out.push({ c: 1, r: i + 1, w: 1, h: 1 })
        return out
    }
    const rot =
        cols === 2
            ? BANDS_2
            : cols === 3
              ? BANDS_3
              : cols === 4
                ? BANDS_4
                : null
    let row = 0
    let bi = 0
    let rem = n
    while (rem > 0) {
        let band: Band
        if (rot) {
            const next = rot[bi % rot.length]
            if (next.cells.length <= rem) {
                band = next
                bi++
            } else band = tailBand(rem, cols)
        } else {
            const counts = [cols, Math.max(2, cols - 2), Math.max(2, cols - 1)]
            band = tailBand(Math.min(rem, counts[bi++ % 3]), cols)
        }
        band.cells.forEach(([c, r, w, h]) => out.push({ c, r: row + r, w, h }))
        row += band.h
        rem -= band.cells.length
    }
    return out
}

type Theme = {
    text: string
    muted: string
    pill: string
    active: string
    activeText: string
    line: string
    ovl: string
}

const THEMES: Record<string, Theme> = {
    ink: {
        text: "#111111",
        muted: "#6b6b6b",
        pill: "rgba(17,17,17,.06)",
        active: "#111111",
        activeText: "#ffffff",
        line: "rgba(17,17,17,.12)",
        ovl: "rgba(8,8,8,.82)",
    },
    night: {
        text: "#f2f2ef",
        muted: "rgba(242,242,239,.6)",
        pill: "rgba(255,255,255,.08)",
        active: "#f2f2ef",
        activeText: "#0c0c0c",
        line: "rgba(255,255,255,.14)",
        ovl: "rgba(0,0,0,.86)",
    },
}

const U = (id: string) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=80`
const DEMO: [string, string, string, string][] = [
    [
        "photo-1486406146926-c627a92ad1ab",
        "Glass Pavilion",
        "A facade study in steel and daylight.",
        "Architecture",
    ],
    [
        "photo-1618221195710-dd6b41faaea6",
        "Colour Room",
        "A living space built around one bold wall.",
        "Interior",
    ],
    [
        "photo-1469854523086-cc02fe5d8800",
        "Coast Road",
        "Eleven days, one long highway.",
        "Travel",
    ],
    [
        "photo-1523275335684-37898b6baf30",
        "Field Watch",
        "Everyday timepiece, machined steel.",
        "Product",
    ],
    [
        "photo-1512917774080-9991f1c4c750",
        "Pool House",
        "Low volumes opening onto water.",
        "Architecture",
    ],
    [
        "photo-1493663284031-b7e3aefcae8e",
        "Quiet Lounge",
        "Soft light, oak and linen.",
        "Interior",
    ],
    [
        "photo-1506905925346-21bda4d32df4",
        "Ridge Line",
        "First light above the cloud.",
        "Travel",
    ],
    [
        "photo-1505740420928-5e560c06d30e",
        "Studio Headphones",
        "Tuned for long listening sessions.",
        "Product",
    ],
    [
        "photo-1600210492486-724fe5c67fb0",
        "Open Kitchen",
        "Stone, brass and a long island.",
        "Interior",
    ],
    [
        "photo-1441974231531-c6227db76b6e",
        "Fern Trail",
        "A morning walk under the canopy.",
        "Travel",
    ],
    [
        "photo-1542291026-7eec264c27ff",
        "Red Runner",
        "Lightweight trainer, bold colourway.",
        "Product",
    ],
    [
        "photo-1511818966892-d7d671e672a2",
        "White House",
        "Clean lines on a quiet street.",
        "Architecture",
    ],
]
const DEFAULT_ITEMS = DEMO.map(([id, title, description, category]) => ({
    image: { src: U(id), alt: title },
    title,
    description,
    category,
    link: "",
}))

const D = {
    layout: {
        cols: 3,
        colsTablet: 2,
        colsMobile: 1,
        gap: 14,
        radius: 16,
    },
    cards: {
        info: "hover",
        arrow: true,
        click: "lightbox",
        titleSize: 22,
        imgPos: "center",
    },
    filter: {
        show: true,
        align: "left",
        allLabel: "All",
        counts: true,
    },
    motion: { reveal: "curtain", morph: 800 },
    theme: {
        preset: "ink",
        background: "rgba(0,0,0,0)",
        text: "#111111",
        muted: "#6b6b6b",
        accent: "#111111",
        accentText: "#ffffff",
        line: "rgba(17,17,17,.14)",
    },
}

/* ───────────────────────── helpers ───────────────────────── */

const clean = (o: any) => {
    const r: any = {}
    if (o) Object.keys(o).forEach((k) => o[k] !== undefined && (r[k] = o[k]))
    return r
}
const splitCats = (s?: string) =>
    (s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)

const itemInfo = (k: HTMLElement) => {
    const img = k.querySelector("img") as HTMLImageElement | null
    return {
        el: k,
        // Use the full-size source, not the small responsive variant the browser picked for the tile.
        src:
            k.getAttribute("data-bgl-full") ||
            (img ? img.currentSrc || img.src : ""),
        title: k.getAttribute("data-bgl-title") || "",
        desc: k.getAttribute("data-bgl-desc") || "",
        cat:
            (k.getAttribute("data-bgl-cats") || "")
                .split("|")
                .filter(Boolean)[0] || "",
    }
}

/* ───────────────────────── styles ───────────────────────── */

const CSS = `
.bgl-root{position:relative;width:100%;color:var(--bgl-text);background:var(--bgl-bg)}
.bgl-root *,.bgl-root *::before,.bgl-root *::after{box-sizing:border-box}

/* bento grid */
.bgl-list{display:grid;gap:var(--bgl-gap);width:100%;grid-template-columns:repeat(var(--bgl-cols),minmax(0,1fr));grid-auto-rows:var(--bgl-row);grid-auto-flow:dense}
.bgl-list>*{position:relative;width:100%;height:100%;min-width:0;overflow:hidden;border-radius:var(--bgl-radius);transition:opacity .6s ease}
.bgl-list>[data-bgl-r="0"]{opacity:0}

/* hover: cinematic zoom */
.bgl-list img{transition:transform 1.4s ${SOFT},filter .9s ease}
@media (hover:hover){
.bgl-card:hover img{transform:scale(1.08);filter:saturate(1.08) contrast(1.02)}
}

/* cards */
.bgl-card{display:flex;flex-direction:column;color:inherit;text-decoration:none;cursor:var(--bgl-cursor);outline:none;-webkit-tap-highlight-color:transparent}
.bgl-card:focus-visible{outline:2px solid var(--bgl-active);outline-offset:3px}
.bgl-media{position:relative;flex:1 1 0;min-height:0;overflow:hidden;background:var(--bgl-pill)}
.bgl-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:var(--bgl-pos,50% 50%);display:block}

.bgl-chip{max-width:calc(100% - 76px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;position:absolute;z-index:3;top:14px;left:14px;padding:8px 13px;border-radius:999px;font-size:12px;line-height:1;color:#fff;background:rgba(14,14,16,.36);border:1px solid rgba(255,255,255,.24);backdrop-filter:blur(14px) saturate(1.5);-webkit-backdrop-filter:blur(14px) saturate(1.5);transition:background .5s ease,translate .6s ${EASE}}
.bgl-card:hover .bgl-chip{background:rgba(14,14,16,.55);translate:0 2px}
.bgl-go{position:absolute;z-index:3;top:12px;right:12px;width:44px;height:44px;border-radius:999px;display:grid;place-items:center;background:#fff;color:#111;opacity:0;scale:.4;rotate:-45deg;transition:opacity .4s ease,scale .7s ${EASE},rotate .7s ${EASE}}
.bgl-card:hover .bgl-go,.bgl-card:focus-visible .bgl-go{opacity:1;scale:1;rotate:0deg}
.bgl-card .bgl-go:hover{scale:1.1}

.bgl-ov{min-width:0;overflow-wrap:anywhere;position:absolute;z-index:3;left:0;right:0;bottom:0;padding:90px 22px 20px;color:#fff;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.bgl-ov::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,var(--bgl-ovl) 0%,rgba(0,0,0,0) 100%);opacity:0;transition:opacity .7s ease}
.bgl-card:hover .bgl-ov::before,.bgl-card:focus-visible .bgl-ov::before,.bgl-root[data-info="always"] .bgl-ov::before{opacity:1}
.bgl-l{display:block;overflow:hidden;padding-bottom:.1em}
.bgl-l>span{display:block;translate:0 118%;transition:translate .85s ${EASE} var(--dl,0ms)}
.bgl-card:hover .bgl-l>span,.bgl-card:focus-visible .bgl-l>span,.bgl-root[data-info="always"] .bgl-l>span{translate:0 0}
.bgl-t{font-size:var(--bgl-ts);font-weight:600;line-height:1.15;letter-spacing:-.015em;overflow-wrap:anywhere;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bgl-l>.bgl-t{display:-webkit-box}
.bgl-d{font-size:13.5px;line-height:1.5;opacity:.82;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;word-break:break-word}
@media (hover:none){
.bgl-ov::before{opacity:1}.bgl-l>span{translate:0 0}.bgl-go{opacity:1;scale:1;rotate:0deg}
}

/* filter bar */
.bgl-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;margin:0 0 30px}
.bgl-tabs{display:flex;flex-wrap:wrap;gap:8px;flex:1 1 auto;justify-content:var(--bgl-just)}
.bgl-btn{min-width:0;max-width:min(100%,240px);position:relative;isolation:isolate;appearance:none;border:1px solid transparent;background:var(--bgl-pill);color:var(--bgl-muted);font:inherit;font-size:14px;line-height:1;padding:12px 19px;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:color .35s ease}
.bgl-btn:hover{color:var(--bgl-text)}
.bgl-btn:focus-visible{outline:2px solid var(--bgl-active);outline-offset:2px}
.bgl-btn[aria-pressed="true"]{color:var(--bgl-activeText)}
.bgl-roll{display:inline-grid;grid-template-columns:minmax(0,1fr);min-width:0;max-width:170px;overflow:hidden;height:1.25em;line-height:1.25em}
.bgl-roll>span{grid-area:1/1;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:translate .55s ${EASE}}
.bgl-roll>span:last-child{translate:0 115%}
@media (hover:hover){
.bgl-btn[aria-pressed="false"]:hover .bgl-roll>span:first-child{translate:0 -115%}
.bgl-btn[aria-pressed="false"]:hover .bgl-roll>span:last-child{translate:0 0}
}
.bgl-ind{position:absolute;inset:-1px;border-radius:inherit;background:var(--bgl-active);z-index:-1}
.bgl-n{font-size:11px;opacity:.6;font-variant-numeric:tabular-nums}

.bgl-root{scroll-margin-top:90px}
.bgl-hint{margin-top:18px;padding:10px 14px;border:1px dashed var(--bgl-line);border-radius:12px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 14px;text-align:center;font-size:12.5px;line-height:1.5;color:var(--bgl-muted)}
.bgl-buy{display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;background:var(--bgl-active);color:var(--bgl-activeText);font-size:12.5px;font-weight:500;line-height:1;text-decoration:none;white-space:nowrap;cursor:pointer;transition:opacity .25s ease}
.bgl-proRow{display:flex;justify-content:center;margin-top:22px}
.bgl-buy:hover{opacity:.88}
.bgl-buy:focus-visible{outline:2px solid var(--bgl-active);outline-offset:2px}
.bgl-ph{padding:56px 24px;text-align:center;color:var(--bgl-muted);font-size:15px;line-height:1.5;border:1.5px dashed var(--bgl-line);border-radius:var(--bgl-radius)}

@media (prefers-reduced-motion:reduce){.bgl-root *{transition-duration:.01ms!important}}
`

/* ───────────────────────── small UI pieces ───────────────────────── */

function Bar(p: any) {
    const {
        uid,
        cats,
        counts,
        allCount,
        active,
        onPick,
        showCounts,
        allLabel,
    } = p
    const tabs = [
        { key: ALL, label: allLabel, n: allCount },
        ...cats.map((c: string) => ({ key: c, label: c, n: counts[c] || 0 })),
    ]
    return (
        <div className="bgl-bar">
            <LayoutGroup id={uid}>
                <div
                    className="bgl-tabs"
                    role="group"
                    aria-label="Filter gallery"
                >
                    {tabs.map((t: any) => (
                        <button
                            key={t.key}
                            type="button"
                            className="bgl-btn"
                            aria-pressed={active === t.key}
                            onClick={() => onPick(t.key)}
                        >
                            {active === t.key && (
                                <motion.span
                                    layoutId="bgl-ind"
                                    className="bgl-ind"
                                    transition={{
                                        type: "spring",
                                        stiffness: 520,
                                        damping: 40,
                                    }}
                                />
                            )}
                            <span className="bgl-roll">
                                <span>{t.label}</span>
                                <span aria-hidden="true">{t.label}</span>
                            </span>
                            {showCounts && <span className="bgl-n">{t.n}</span>}
                        </button>
                    ))}
                </div>
            </LayoutGroup>
        </div>
    )
}

/** Full-screen viewer: opens from the clicked card, closes back into it. */
function Lightbox({ items, index, onIndex, onClose, fontStyle }: any) {
    const n = items.length
    const imgRef = React.useRef<HTMLImageElement>(null)
    const bgRef = React.useRef<HTMLDivElement>(null)
    const closing = React.useRef(false)
    const dir = React.useRef(1)
    const opened = React.useRef(false)
    const touchX = React.useRef(0)
    const it = items[index]

    const next = () => {
        dir.current = 1
        onIndex((index + 1) % n)
    }
    const prev = () => {
        dir.current = -1
        onIndex((index - 1 + n) % n)
    }
    const shift = (el: HTMLElement | null, img: HTMLImageElement) => {
        if (!el || !el.isConnected) return null
        const r = el.getBoundingClientRect()
        const f = img.getBoundingClientRect()
        if (!r.width || !f.width || r.bottom < 0 || r.top > window.innerHeight)
            return null
        return `translate(${r.left + r.width / 2 - (f.left + f.width / 2)}px,${r.top + r.height / 2 - (f.top + f.height / 2)}px) scale(${r.width / f.width})`
    }
    const close = () => {
        if (closing.current) return
        closing.current = true
        const img = imgRef.current
        bgRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 420,
            easing: "ease",
            fill: "forwards",
        })
        const t = img ? shift(it.el, img) : null
        if (img) {
            img.animate(
                t
                    ? [
                          { transform: "none", opacity: 1 },
                          { transform: t, opacity: 0 },
                      ]
                    : [{ opacity: 1 }, { opacity: 0 }],
                { duration: 460, easing: EASE, fill: "forwards" }
            )
        }
        setTimeout(onClose, 470)
    }
    const onLoad = () => {
        const img = imgRef.current
        if (!img) return
        if (!opened.current) {
            opened.current = true
            img.style.opacity = "1"
            const t = shift(it.el, img)
            if (t)
                img.animate(
                    [
                        { transform: t, opacity: 0.2 },
                        { transform: "none", opacity: 1 },
                    ],
                    { duration: 700, easing: EASE }
                )
            else
                img.animate(
                    [
                        { opacity: 0, transform: "scale(.96)" },
                        { opacity: 1, transform: "none" },
                    ],
                    { duration: 500, easing: EASE }
                )
        }
    }

    // Lock the page once per lightbox session, not again on every next/prev.
    // Compensate for the disappearing page scrollbar so centered galleries do not
    // jump sideways when the lightbox opens or closes.
    useIso(() => {
        const body = document.body
        const doc = document.documentElement
        const oldOverflow = body.style.overflow
        const oldPaddingRight = body.style.paddingRight
        const computedPadding =
            parseFloat(window.getComputedStyle(body).paddingRight) || 0
        const widthBeforeLock = doc.clientWidth

        body.style.overflow = "hidden"
        const gainedWidth = Math.max(0, doc.clientWidth - widthBeforeLock)
        if (gainedWidth > 0) {
            body.style.paddingRight = `${computedPadding + gainedWidth}px`
        }

        return () => {
            body.style.overflow = oldOverflow
            body.style.paddingRight = oldPaddingRight
        }
    }, [])

    React.useEffect(() => {
        const key = (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
            if (e.key === "ArrowRight") next()
            if (e.key === "ArrowLeft") prev()
        }
        window.addEventListener("keydown", key)
        return () => window.removeEventListener("keydown", key)
    }, [index, n])

    if (!it) return null
    const first = !opened.current
    const nav: React.CSSProperties = {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        width: 52,
        height: 52,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,.22)",
        background: "rgba(255,255,255,.08)",
        backdropFilter: "blur(12px)",
        color: "#fff",
        fontSize: 18,
        cursor: "pointer",
    }
    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={it.title || "Image viewer"}
            onClick={close}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - touchX.current
                if (Math.abs(dx) > 50 && n > 1) (dx < 0 ? next : prev)()
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 22,
                padding: "70px clamp(14px,7vw,100px) 44px",
                color: "#fff",
                ...fontStyle,
            }}
        >
            <style>{`@keyframes bglBg{from{opacity:0}to{opacity:1}}@keyframes bglR{from{opacity:0;transform:translateX(48px) scale(.98)}to{opacity:1;transform:none}}@keyframes bglL{from{opacity:0;transform:translateX(-48px) scale(.98)}to{opacity:1;transform:none}}@keyframes bglUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
            <div
                ref={bgRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(8,8,10,.86)",
                    backdropFilter: "blur(26px) saturate(1.2)",
                    WebkitBackdropFilter: "blur(26px) saturate(1.2)",
                    animation: "bglBg .5s ease",
                }}
            />
            <img
                key={index}
                ref={imgRef}
                src={it.src}
                alt={it.title}
                onLoad={onLoad}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    maxWidth: "100%",
                    maxHeight: "68vh",
                    objectFit: "contain",
                    borderRadius: 10,
                    boxShadow: "0 40px 90px rgba(0,0,0,.55)",
                    opacity: first ? 0 : 1,
                    animation: first
                        ? undefined
                        : `${dir.current > 0 ? "bglR" : "bglL"} .65s ${EASE}`,
                }}
            />
            <div
                key={"c" + index}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    textAlign: "center",
                    width: "100%",
                    maxWidth: 580,
                    maxHeight: "min(30vh, 280px)",
                    overflowY: "auto",
                    overflowX: "hidden",
                    overflowWrap: "anywhere",
                    overscrollBehavior: "contain",
                    animation: `bglUp .7s ${EASE} .1s backwards`,
                }}
            >
                {it.cat && (
                    <span
                        style={{
                            display: "inline-block",
                            fontSize: 12,
                            padding: "7px 13px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,.12)",
                            border: "1px solid rgba(255,255,255,.2)",
                            marginBottom: 12,
                            maxWidth: "100%",
                            overflowWrap: "anywhere",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {it.cat}
                    </span>
                )}
                {it.title && (
                    <div
                        style={{
                            fontSize: 28,
                            fontWeight: 600,
                            letterSpacing: "-.02em",
                            lineHeight: 1.15,
                            overflowWrap: "anywhere",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {it.title}
                    </div>
                )}
                {it.desc && (
                    <div
                        style={{
                            fontSize: 15,
                            opacity: 0.68,
                            marginTop: 8,
                            lineHeight: 1.55,
                            overflowWrap: "anywhere",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {it.desc}
                    </div>
                )}
            </div>
            <div
                style={{
                    position: "absolute",
                    top: 24,
                    left: 28,
                    fontSize: 13,
                    opacity: 0.6,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {index + 1} / {n}
            </div>
            <button
                type="button"
                aria-label="Close"
                onClick={(e) => {
                    e.stopPropagation()
                    close()
                }}
                style={{
                    position: "absolute",
                    top: 16,
                    right: 20,
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    border: 0,
                    background: "transparent",
                    color: "#fff",
                    fontSize: 24,
                    cursor: "pointer",
                }}
            >
                ✕
            </button>
            {n > 1 && (
                <button
                    type="button"
                    aria-label="Previous"
                    onClick={(e) => {
                        e.stopPropagation()
                        prev()
                    }}
                    style={{ ...nav, left: 18 }}
                >
                    ←
                </button>
            )}
            {n > 1 && (
                <button
                    type="button"
                    aria-label="Next"
                    onClick={(e) => {
                        e.stopPropagation()
                        next()
                    }}
                    style={{ ...nav, right: 18 }}
                >
                    →
                </button>
            )}
        </div>,
        document.body
    )
}

/* ───────────────────────── component ───────────────────────── */

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 */
export default function WebzostGalleryLite(props: any) {
    const { items, font, showPro = true } = props
    const L = { ...D.layout, ...clean(props.layout) }
    const C = { ...D.cards, ...clean(props.cards) }
    const F = { ...D.filter, ...clean(props.filter) }
    const M = { ...D.motion, ...clean(props.motion) }
    const TH = { ...D.theme, ...clean(props.theme) }

    const T: Theme =
        TH.preset === "custom"
            ? {
                  text: TH.text,
                  muted: TH.muted,
                  pill: "rgba(127,127,127,.12)",
                  active: TH.accent,
                  activeText: TH.accentText,
                  line: TH.line,
                  ovl: "rgba(0,0,0,.82)",
              }
            : THEMES[TH.preset] || THEMES.ink

    const uid = React.useId().replace(/:/g, "")
    // Framer's static-render flag: no animation work during Canvas / export rendering.
    const isStaticRenderer = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const reduced =
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const animate = !isStaticRenderer && !isCanvas && !reduced

    const rootRef = React.useRef<HTMLDivElement>(null)
    const listRef = React.useRef<HTMLDivElement>(null)
    const prevRects = React.useRef<Map<Element, DOMRect> | null>(null)

    const [w, setW] = React.useState(1000)
    const [active, setActive] = React.useState(ALL)
    const [lb, setLb] = React.useState<{ items: any[]; index: number } | null>(
        null
    )

    /* width → responsive columns */
    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        setW(el.clientWidth || 1000)
        if (isStaticRenderer || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((es) => {
            const cw = Math.round(es[0].contentRect.width)
            if (cw) setW((prev) => (prev === cw ? prev : cw))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStaticRenderer])

    const cols = Math.max(
        1,
        w < 600 ? L.colsMobile : w < 960 ? L.colsTablet : L.cols
    )
    const gap = L.gap
    const colW = Math.max(40, (w - gap * (cols - 1)) / cols)
    const rowH = Math.round(colW * 0.78)

    const list: any[] = React.useMemo(
        () => (Array.isArray(items) ? items : []),
        [items]
    )

    /* categories, in the order they first appear */
    const { cats, counts } = React.useMemo(() => {
        const counts: Record<string, number> = {}
        const cats: string[] = []
        list.forEach((it) =>
            splitCats(it.category).forEach((c) => {
                if (!counts[c]) {
                    counts[c] = 0
                    cats.push(c)
                }
                counts[c]++
            })
        )
        return { cats, counts }
    }, [list])

    // If the active category disappears (item edited or removed), fall back to "All".
    React.useEffect(() => {
        if (active !== ALL && !cats.includes(active)) setActive(ALL)
    }, [cats, active])

    const records = React.useMemo(
        () =>
            list
                .map((it, i) => ({ it, i }))
                .filter(
                    ({ it }) =>
                        active === ALL ||
                        splitCats(it.category).includes(active)
                ),
        [list, active]
    )
    const bento = React.useMemo(
        () => bentoLayout(records.length, cols),
        [records.length, cols]
    )

    /* snapshot positions BEFORE a filter change so cards can morph (FLIP) after it */
    const pickCat = (c: string) => {
        if (c === active) return
        if (animate) {
            const el = listRef.current
            if (el) {
                const m = new Map<Element, DOMRect>()
                Array.from(el.children).forEach((k) =>
                    m.set(k, k.getBoundingClientRect())
                )
                prevRects.current = m
            }
        }
        setActive(c)
    }

    useIso(() => {
        const el = listRef.current
        if (!el) return
        const prev = prevRects.current
        prevRects.current = null
        if (!prev || !animate) return
        const kids = Array.from(el.children) as HTMLElement[]
        const dur = Math.max(150, M.morph)
        kids.forEach((k, i) => {
            k.setAttribute("data-bgl-r", "1")
            const last = k.getBoundingClientRect()
            const first = prev.get(k)
            if (first && last.width && last.height) {
                const dx = first.left - last.left
                const dy = first.top - last.top
                const sx = first.width / last.width
                const sy = first.height / last.height
                const resized =
                    Math.abs(sx - 1) > 0.02 || Math.abs(sy - 1) > 0.02
                if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && !resized) return
                k.animate(
                    [
                        {
                            transformOrigin: "top left",
                            transform: `translate(${dx}px,${dy}px)${resized ? ` scale(${sx},${sy})` : ""}`,
                        },
                        { transformOrigin: "top left", transform: "none" },
                    ],
                    { duration: dur, easing: EASE, fill: "backwards" }
                )
            } else {
                k.animate(
                    [
                        {
                            opacity: 0,
                            transform: "translateY(26px) scale(.94)",
                        },
                        { opacity: 1, transform: "none" },
                    ],
                    {
                        duration: dur,
                        delay: Math.min(i, 12) * 30,
                        easing: EASE,
                        fill: "backwards",
                    }
                )
            }
        })
    }, [records, cols])

    /* first reveal as cards scroll into view — one orchestrated moment */
    React.useEffect(() => {
        const el = listRef.current
        if (!el) return
        const kids = Array.from(el.children) as HTMLElement[]
        if (
            M.reveal === "none" ||
            !animate ||
            typeof IntersectionObserver === "undefined"
        ) {
            kids.forEach((k) => k.setAttribute("data-bgl-r", "1"))
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                let n = 0
                entries.forEach((e) => {
                    if (!e.isIntersecting) return
                    const k = e.target as HTMLElement
                    const delay = n++ * 90
                    k.setAttribute("data-bgl-r", "1")
                    const r = `${L.radius}px`
                    k.animate(
                        [
                            { clipPath: `inset(100% 0 0 0 round ${r})` },
                            { clipPath: `inset(0% 0 0 0 round ${r})` },
                        ],
                        {
                            duration: 1150,
                            delay,
                            easing: EASE,
                            fill: "backwards",
                        }
                    )
                    k.querySelector("img")?.animate(
                        [{ scale: 1.3 }, { scale: 1 }],
                        {
                            duration: 1600,
                            delay,
                            easing: EASE,
                            fill: "backwards",
                        }
                    )
                    io.unobserve(k)
                })
            },
            { threshold: 0.01, rootMargin: "160px 0px 160px 0px" }
        )
        kids.forEach((k) => {
            if (!k.hasAttribute("data-bgl-r")) k.setAttribute("data-bgl-r", "0")
            if (k.getAttribute("data-bgl-r") === "0") io.observe(k)
        })
        return () => io.disconnect()
        // Only still-unrevealed cards are observed, so earlier cards never re-animate.
    }, [records, M.reveal, animate, L.radius])

    /* click → lightbox */
    const onRootClick = (e: React.MouseEvent) => {
        if (C.click !== "lightbox") return
        const el = listRef.current
        let t = e.target as HTMLElement | null
        if (!el || !t || !el.contains(t)) return
        while (t && t.parentElement !== el) t = t.parentElement
        if (!t) return
        const infos = (Array.from(el.children) as HTMLElement[])
            .map(itemInfo)
            .filter((x) => x.src)
        const idx = infos.findIndex((x) => x.el === t)
        if (idx < 0) return
        e.preventDefault()
        e.stopPropagation()
        setLb({ items: infos, index: idx })
    }
    const onRootKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && C.click === "lightbox") {
            const t = e.target as HTMLElement
            if (t.classList.contains("bgl-card")) t.click()
        }
    }

    /* ───────── render ───────── */
    const revealInit =
        M.reveal === "none" || isStaticRenderer || isCanvas ? "1" : "0"
    const fontStyle = font ? { ...font } : {}
    const rootStyle: any = {
        "--bgl-text": T.text,
        "--bgl-muted": T.muted,
        "--bgl-pill": T.pill,
        "--bgl-active": T.active,
        "--bgl-activeText": T.activeText,
        "--bgl-line": T.line,
        "--bgl-ovl": T.ovl,
        "--bgl-bg": TH.background,
        "--bgl-cols": cols,
        "--bgl-gap": `${gap}px`,
        "--bgl-row": `${rowH}px`,
        "--bgl-radius": `${L.radius}px`,
        "--bgl-ts": `${C.titleSize}px`,
        "--bgl-pos":
            C.imgPos === "top"
                ? "50% 0%"
                : C.imgPos === "bottom"
                  ? "50% 100%"
                  : "50% 50%",
        "--bgl-just":
            F.align === "left"
                ? "flex-start"
                : F.align === "right"
                  ? "flex-end"
                  : "center",
        "--bgl-cursor": C.click === "none" ? "default" : "pointer",
        ...fontStyle,
    }

    const buyLink = (
        <a
            className="bgl-buy"
            href={PRO_URL}
            target="_blank"
            rel="noopener noreferrer"
        >
            Buy Pro version with CMS gallery integration
        </a>
    )

    return (
        <div
            ref={rootRef}
            className="bgl-root"
            data-info={C.info}
            style={rootStyle}
            onClick={onRootClick}
            onKeyDown={onRootKey}
        >
            <style>{CSS}</style>
            {F.show && (
                <Bar
                    uid={uid}
                    cats={cats}
                    counts={counts}
                    allCount={list.length}
                    active={active}
                    onPick={pickCat}
                    showCounts={F.counts}
                    allLabel={F.allLabel}
                />
            )}

            <div ref={listRef} className="bgl-list">
                {records.map(({ it, i }, n) => {
                    const src =
                        it.image && typeof it.image === "object"
                            ? it.image.src
                            : it.image
                    const href =
                        C.click === "link" && it.link ? it.link : undefined
                    const Tag: any = href ? "a" : "div"
                    const cs = splitCats(it.category)
                    const lightbox = C.click === "lightbox"
                    const overlay = C.info === "hover" || C.info === "always"
                    const t = bento[n]
                    return (
                        <Tag
                            key={i}
                            className="bgl-card"
                            href={href}
                            data-bgl-cats={cs.join("|")}
                            data-bgl-title={it.title || ""}
                            data-bgl-desc={it.description || ""}
                            data-bgl-full={src || ""}
                            data-bgl-r={revealInit}
                            tabIndex={lightbox ? 0 : undefined}
                            role={lightbox ? "button" : undefined}
                            aria-label={
                                lightbox
                                    ? `Open ${it.title || "image"}`
                                    : undefined
                            }
                            style={
                                t
                                    ? {
                                          gridColumn: `${t.c} / span ${t.w}`,
                                          gridRow: `${t.r} / span ${t.h}`,
                                      }
                                    : undefined
                            }
                        >
                            <div className="bgl-media">
                                {src && (
                                    <img
                                        src={src}
                                        srcSet={it.image?.srcSet}
                                        sizes={
                                            it.image?.srcSet
                                                ? "(max-width: 600px) 100vw, (max-width: 960px) 75vw, 55vw"
                                                : undefined
                                        }
                                        alt={it.image?.alt || it.title || ""}
                                        loading="lazy"
                                        decoding="async"
                                        draggable={false}
                                    />
                                )}
                            </div>
                            {overlay && cs[0] && (
                                <span className="bgl-chip">{cs[0]}</span>
                            )}
                            {overlay && C.arrow && C.click !== "none" && (
                                <span className="bgl-go" aria-hidden="true">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M4 12 12 4M5.5 4H12v6.5" />
                                    </svg>
                                </span>
                            )}
                            {overlay && (
                                <div className="bgl-ov">
                                    <span className="bgl-l">
                                        <span className="bgl-t">
                                            {it.title}
                                        </span>
                                    </span>
                                    {it.description && (
                                        <span
                                            className="bgl-l"
                                            style={{
                                                ["--dl" as any]: "70ms",
                                            }}
                                        >
                                            <span>
                                                <span className="bgl-d">
                                                    {it.description}
                                                </span>
                                            </span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </Tag>
                    )
                })}
            </div>

            {list.length === 0 && (
                <div className="bgl-ph">
                    Add images to this gallery in the property panel: select the
                    component, then use Items → Add.
                </div>
            )}
            {showPro &&
                (isCanvas ? (
                    <div className="bgl-hint">
                        <span>Webzost Gallery Lite is the free version.</span>
                        {buyLink}
                    </div>
                ) : (
                    <div className="bgl-proRow">{buyLink}</div>
                ))}
            {lb && (
                <Lightbox
                    items={lb.items}
                    index={lb.index}
                    onIndex={(i: number) => setLb({ ...lb, index: i })}
                    onClose={() => setLb(null)}
                    fontStyle={fontStyle}
                />
            )}
        </div>
    )
}

/* ───────────────────────── property controls ───────────────────────── */

const num = (
    title: string,
    min: number,
    max: number,
    step = 1,
    defaultValue = 0,
    extra: any = {}
) => ({
    type: ControlType.Number,
    title,
    min,
    max,
    step,
    defaultValue,
    displayStepper: step === 1,
    ...extra,
})

WebzostGalleryLite.displayName = "Webzost Gallery Lite"

addPropertyControls(WebzostGalleryLite, {
    items: {
        type: ControlType.Array,
        title: "Items",
        description: `**Webzost Gallery Lite** by Webzost\n[Buy Pro version with CMS gallery integration](${PRO_URL})`,
        defaultValue: DEFAULT_ITEMS as any,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project title",
                },
                description: {
                    type: ControlType.String,
                    title: "Text",
                    displayTextArea: true,
                    defaultValue: "",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Category",
                    description: "Separate with commas to use several",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },

    showPro: {
        type: ControlType.Boolean,
        title: "Pro button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Small link to the Pro version with CMS gallery integration.",
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cols: num("Desktop", 1, 6, 1, 3),
            colsTablet: num("Tablet", 1, 4, 1, 2),
            colsMobile: num("Mobile", 1, 3, 1, 1),
            gap: num("Gap", 0, 60, 1, 14, { unit: "px" }),
            radius: num("Radius", 0, 60, 1, 16, { unit: "px" }),
        },
    },
    cards: {
        type: ControlType.Object,
        title: "Cards & Hover",
        controls: {
            info: {
                type: ControlType.Enum,
                title: "Info",
                defaultValue: "hover",
                options: ["hover", "always", "none"],
                optionTitles: ["Reveal on hover", "Always on image", "Hidden"],
            },
            arrow: {
                type: ControlType.Boolean,
                title: "Corner arrow",
                defaultValue: true,
            },
            click: {
                type: ControlType.Enum,
                title: "On click",
                defaultValue: "lightbox",
                options: ["lightbox", "link", "none"],
                optionTitles: ["Open lightbox", "Follow link", "Nothing"],
            },
            imgPos: {
                type: ControlType.Enum,
                title: "Image focus",
                defaultValue: "center",
                options: ["center", "top", "bottom"],
                optionTitles: ["Center", "Top", "Bottom"],
                displaySegmentedControl: true,
                description:
                    "Which part of a photo stays visible when it is cropped",
            },
            titleSize: num("Title size", 12, 44, 1, 22, { unit: "px" }),
        },
    },
    filter: {
        type: ControlType.Object,
        title: "Filter",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                defaultValue: "left",
                options: ["left", "center", "right"],
                displaySegmentedControl: true,
                optionTitles: ["Left", "Center", "Right"],
                hidden: (p: any) => !p.show,
            },
            allLabel: {
                type: ControlType.String,
                title: "“All” text",
                defaultValue: "All",
                hidden: (p: any) => !p.show,
            },
            counts: {
                type: ControlType.Boolean,
                title: "Counts",
                defaultValue: true,
                hidden: (p: any) => !p.show,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            reveal: {
                type: ControlType.Enum,
                title: "Reveal",
                defaultValue: "curtain",
                options: ["curtain", "none"],
                optionTitles: ["Curtain", "None"],
                displaySegmentedControl: true,
            },
            morph: num("Morph time", 200, 1600, 50, 800, { unit: "ms" }),
        },
    },
    theme: {
        type: ControlType.Object,
        title: "Theme",
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Preset",
                defaultValue: "ink",
                options: ["ink", "night", "custom"],
                optionTitles: ["Ink (light)", "Night (dark)", "Custom"],
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0,0,0,0)",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#111111",
                hidden: (p: any) => p.preset !== "custom",
            },
            muted: {
                type: ControlType.Color,
                title: "Muted text",
                defaultValue: "#6b6b6b",
                hidden: (p: any) => p.preset !== "custom",
            },
            accent: {
                type: ControlType.Color,
                title: "Active fill",
                defaultValue: "#111111",
                hidden: (p: any) => p.preset !== "custom",
            },
            accentText: {
                type: ControlType.Color,
                title: "Active text",
                defaultValue: "#ffffff",
                hidden: (p: any) => p.preset !== "custom",
            },
            line: {
                type: ControlType.Color,
                title: "Lines",
                defaultValue: "rgba(17,17,17,.14)",
                hidden: (p: any) => p.preset !== "custom",
            },
        },
    },
    font: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            letterSpacing: "0em",
            lineHeight: "1.4em",
        },
    },
})
