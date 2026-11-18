/**
 * Photography Filter Lite (Free Edition) — by Webzost
 * A sleek, minimal photography filter gallery for Framer (capped at 10 manual photos).
 *
 * ⚡ Need CMS support, unlimited photos, per-image focal point crop, Justified & Bento
 *    layouts, Before/After retouch slider, EXIF metadata, Watermark protection &
 *    Client Proofing (♥ Shortlist)?
 *    → Upgrade to **Photography CMS Filter Pro** by Webzost.
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


const ALL = "__all__"
const MAX_LITE = 10
const EASE = "cubic-bezier(.22,1,.36,1)"
const MONO =
    'ui-monospace,"SF Mono","JetBrains Mono","Roboto Mono",Menlo,Consolas,monospace'
const SERIF =
    '"Instrument Serif","Cormorant Garamond","Playfair Display","Iowan Old Style",Georgia,serif'

const U = (id: string, w = 1200, h = 1500) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=82`

const DEMO_LITE = [
    [
        "photo-1534528741775-53994a69daeb",
        "Vogue Close-Up",
        "Portraits",
        1200,
        1500,
    ],
    [
        "photo-1506905925346-21bda4d32df4",
        "Alpine First Light",
        "Landscapes",
        1600,
        1100,
    ],
    [
        "photo-1517838277536-f5f99be501cd",
        "Power & Form",
        "Editorial",
        1200,
        1600,
    ],
    [
        "photo-1519741497674-611481863552",
        "The First Look",
        "Weddings",
        1300,
        1300,
    ],
    [
        "photo-1507003211169-0a1dd7228f2d",
        "Character Study",
        "Portraits",
        1200,
        1500,
    ],
    [
        "photo-1509631179647-0177331693ae",
        "Monolith Silhouette",
        "Editorial",
        1200,
        1600,
    ],
    [
        "photo-1494790108377-be9c29b29330",
        "Golden Hour",
        "Portraits",
        1200,
        1500,
    ],
    [
        "photo-1465495976277-4387d4b0b4c6",
        "Vows at Dusk",
        "Weddings",
        1600,
        1100,
    ],
    [
        "photo-1501785888041-af3ef285b470",
        "Emerald Mirror",
        "Landscapes",
        1600,
        1100,
    ],
    [
        "photo-1531746020798-e6953c6e8e04",
        "Luminous Portrait",
        "Portraits",
        1200,
        1500,
    ],
].map(([id, title, category, w, h]) => ({
    image: { src: U(String(id), Number(w), Number(h)), alt: String(title) },
    title: String(title),
    category: String(category),
}))

const pad2 = (n: number) => String(n).padStart(2, "0")
const splitCats = (s?: string) =>
    (s || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)

function richTitle(s: string): React.ReactNode {
    return String(s || "")
        .split(/(\*[^*]+\*)/g)
        .filter(Boolean)
        .map((part, i) =>
            part.startsWith("*") && part.endsWith("*") ? (
                <em key={i}>{part.slice(1, -1)}</em>
            ) : (
                <React.Fragment key={i}>{part}</React.Fragment>
            )
        )
}

const CSS = `
.mgl-root{position:relative;width:100%;color:var(--mgl-text);background:var(--mgl-bg);padding:var(--mgl-pad,28px);font-feature-settings:"kern" 1,"liga" 1;-webkit-font-smoothing:antialiased}
.mgl-root *,.mgl-root *::before,.mgl-root *::after{box-sizing:border-box}

/* Studio Header */
.mgl-hdr{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px 20px;padding-bottom:20px;margin-bottom:22px;border-bottom:1px solid var(--mgl-line)}
.mgl-eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:${MONO};font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--mgl-muted);margin-bottom:6px}
.mgl-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--mgl-text)}
.mgl-htitle{margin:0;font-size:clamp(28px,4.6vw,52px);font-weight:400;line-height:1.04;letter-spacing:-.03em}
.mgl-htitle em{font-family:${SERIF};font-style:italic;font-weight:400}
.mgl-hmeta{display:flex;align-items:baseline;gap:7px;font-family:${MONO};color:var(--mgl-muted)}
.mgl-hnum{font-size:clamp(22px,3vw,34px);font-weight:300;color:var(--mgl-text);line-height:1}
.mgl-hlbl{font-size:10px;letter-spacing:.15em;text-transform:uppercase}

/* Filter Bar */
.mgl-bar{display:flex;flex-wrap:nowrap;align-items:center;gap:6px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;padding-bottom:10px;margin-bottom:22px;border-bottom:1px solid var(--mgl-line)}
.mgl-bar::-webkit-scrollbar{display:none;width:0;height:0}
.mgl-tab{position:relative;flex:0 0 auto;appearance:none;border:0;background:transparent;color:var(--mgl-muted);font:inherit;font-size:13.5px;padding:8px 4px;margin-right:18px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:color .25s ease}
.mgl-tab:hover,.mgl-tab[aria-pressed="true"]{color:var(--mgl-text)}
.mgl-tab[aria-pressed="true"]::after{content:"";position:absolute;left:0;right:0;bottom:-11px;height:2px;background:var(--mgl-text);border-radius:2px}
.mgl-cnt{font-family:${MONO};font-size:10px;opacity:.6}

/* Grid & Masonry */
.mgl-list[data-view="grid"]{display:grid;grid-template-columns:repeat(var(--mgl-cols,3),minmax(0,1fr));gap:var(--mgl-gap,12px)}
.mgl-list[data-view="masonry"]{display:block;column-count:var(--mgl-cols,3);column-gap:var(--mgl-gap,12px)}
.mgl-card{position:relative;overflow:hidden;border-radius:6px;background:var(--mgl-pill);cursor:pointer}
.mgl-list[data-view="grid"] .mgl-card{aspect-ratio:4 / 5}
.mgl-list[data-view="masonry"] .mgl-card{margin:0 0 var(--mgl-gap,12px);break-inside:avoid;aspect-ratio:var(--mgl-ar,4 / 5)}
.mgl-card img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 1.1s ${EASE}}
@media(hover:hover){.mgl-card:hover img{transform:scale(1.055)}}

/* Viewfinder Corner Brackets (┌ top-left & ┘ bottom-right) */
.mgl-vf{position:absolute;inset:10px;z-index:3;pointer-events:none}
.mgl-vf-tl,.mgl-vf-br{position:absolute;width:18px;height:18px;border-color:rgba(255,255,255,.86);border-style:solid;border-width:0;filter:drop-shadow(0 1px 4px rgba(0,0,0,.45));opacity:.78;transition:opacity .3s ease,width .35s ${EASE},height .35s ${EASE}}
.mgl-vf-tl{top:0;left:0;border-top-width:1.8px;border-left-width:1.8px;border-top-left-radius:2px}
.mgl-vf-br{bottom:0;right:0;border-bottom-width:1.8px;border-right-width:1.8px;border-bottom-right-radius:2px}
.mgl-card:hover .mgl-vf-tl,.mgl-card:hover .mgl-vf-br{opacity:1;width:23px;height:23px}

/* Top Badges & Bottom Title Overlay */
.mgl-top{position:absolute;z-index:3;top:15px;left:15px;display:flex;align-items:center;gap:6px;pointer-events:none}
.mgl-idx{padding:4px 7px;border-radius:5px;font-family:${MONO};font-size:10px;color:#fff;background:rgba(10,10,12,.48);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(10px)}
.mgl-chip{padding:5px 10px;border-radius:999px;font-family:${MONO};font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:rgba(10,10,12,.48);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(10px)}
.mgl-ov{position:absolute;inset:auto 0 0 0;z-index:2;padding:54px 16px 14px;background:linear-gradient(to top,rgba(0,0,0,.78) 0%,transparent 100%);color:#fff;opacity:0;transition:opacity .35s ease;pointer-events:none}
.mgl-card:hover .mgl-ov{opacity:1}
.mgl-title{font-size:16px;font-weight:500;letter-spacing:-.01em}
@media(hover:none){.mgl-ov{opacity:1}}

/* Canvas-only Pro Upgrade Banner when > 10 items are added */
.mgl-pro-note{margin-top:16px;padding:12px 16px;border-radius:10px;border:1px dashed var(--mgl-line);font-family:${MONO};font-size:11.5px;line-height:1.5;color:var(--mgl-muted);text-align:center}
.mgl-pro-note strong{color:var(--mgl-text)}

/* Floating Pro Upgrade Button (Right-Bottom, above "Made in Framer" badge) */
@keyframes mglDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.85)}}
.mgl-pro-fab{position:fixed;right:20px;bottom:72px;z-index:9990;display:flex;align-items:center;gap:14px;max-width:calc(100vw - 32px);padding:8px 8px 8px 16px;border-radius:999px;background:rgba(18,18,22,.88);border:1px solid rgba(255,255,255,.18);box-shadow:0 20px 50px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.14);color:#ffffff;text-decoration:none;backdrop-filter:blur(22px) saturate(1.6);-webkit-backdrop-filter:blur(22px) saturate(1.6);transition:transform .28s ${EASE},border-color .28s ease,box-shadow .28s ease}
.mgl-pro-fab:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.36);box-shadow:0 26px 60px rgba(0,0,0,.75),0 0 28px rgba(255,255,255,.1)}
.mgl-pro-body{display:flex;flex-direction:column;gap:2px;min-width:0}
.mgl-pro-head{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;letter-spacing:-.015em;color:#ffffff;white-space:nowrap}
.mgl-pro-dot{width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 10px #10b981;animation:mglDot 2.2s ease-in-out infinite;flex:0 0 auto}
.mgl-pro-sub{font-family:${MONO};font-size:10px;letter-spacing:.03em;color:rgba(255,255,255,.64);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mgl-pro-cta{flex:0 0 auto;display:inline-flex;align-items:center;gap:5px;height:36px;padding:0 15px;border-radius:999px;background:#ffffff;color:#0c0c0d;font-size:12.5px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;transition:background .25s ease,transform .25s ${EASE}}
.mgl-pro-fab[data-btn="blue"] .mgl-pro-cta{background:#0099ff;color:#ffffff;box-shadow:0 6px 20px rgba(0,153,255,.4)}
.mgl-pro-fab[data-btn="light"]{background:rgba(255,255,255,.95);border-color:rgba(0,0,0,.1);color:#111111;box-shadow:0 20px 50px rgba(0,0,0,.28)}
.mgl-pro-fab[data-btn="light"] .mgl-pro-head{color:#111111}
.mgl-pro-fab[data-btn="light"] .mgl-pro-sub{color:rgba(17,17,17,.62)}
.mgl-pro-fab[data-btn="light"] .mgl-pro-cta{background:#111111;color:#ffffff}
.mgl-pro-arr{display:inline-block;font-size:13px;transition:transform .25s ${EASE}}
.mgl-pro-fab:hover .mgl-pro-arr{transform:translate(2px,-2px)}
@media(max-width:599px){
.mgl-pro-fab{right:12px;bottom:64px;padding:7px 7px 7px 13px;gap:10px}
.mgl-pro-head{font-size:12px}
.mgl-pro-sub{font-size:9px;max-width:185px}
.mgl-pro-cta{height:32px;padding:0 12px;font-size:11.5px}
}
`

const PRO_URL =
    "https://www.framer.com/marketplace/components/photo-cms-filter/"
const AR_CYCLE = ["4 / 5", "1 / 1", "3 / 4", "4 / 3", "3 / 2", "4 / 5"]

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 820
 */
export default function WebzostPhotoGalleryLite(props: any) {
    const {
        items = DEMO_LITE,
        heading = "Selected *Works*",
        view = "masonry",
        cols = 3,
        gap = 12,
        brackets = true,
        theme = "noir",
        proBtn = "white",
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)
    const [w, setW] = React.useState(1000)
    const [active, setActive] = React.useState<string>(ALL)
    const [lbIdx, setLbIdx] = React.useState<number | null>(null)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    React.useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const measure = () => setW(el.clientWidth || 1000)
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Hard 10-photo cap for Lite edition (defaults to 10 curated Unsplash photos)
    const rawItems =
        Array.isArray(items) && items.length > 0 ? items : DEMO_LITE
    const capped = React.useMemo(() => rawItems.slice(0, MAX_LITE), [rawItems])

    const { cats, counts } = React.useMemo(() => {
        const cMap: Record<string, number> = {}
        const ord: string[] = []
        capped.forEach((it: any) => {
            splitCats(it?.category).forEach((c) => {
                if (!cMap[c]) {
                    cMap[c] = 0
                    ord.push(c)
                }
                cMap[c]++
            })
        })
        return { cats: ord, counts: cMap }
    }, [capped])

    const safeActive = active === ALL || cats.includes(active) ? active : ALL

    const filtered = React.useMemo(
        () =>
            capped
                .map((it: any, i: number) => ({ it, i }))
                .filter(({ it }) =>
                    safeActive === ALL
                        ? true
                        : splitCats(it?.category).includes(safeActive)
                ),
        [capped, safeActive]
    )

    React.useEffect(() => {
        if (lbIdx === null) return
        const key = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLbIdx(null)
            else if (e.key === "ArrowRight")
                setLbIdx((i) => (i === null ? null : (i + 1) % filtered.length))
            else if (e.key === "ArrowLeft")
                setLbIdx((i) =>
                    i === null
                        ? null
                        : (i - 1 + filtered.length) % filtered.length
                )
        }
        window.addEventListener("keydown", key)
        return () => window.removeEventListener("keydown", key)
    }, [lbIdx, filtered.length])

    const effCols = w < 600 ? 1 : w < 900 ? Math.min(2, cols) : cols
    const effPad = w < 600 ? 16 : w < 900 ? 24 : 36
    const isLight = theme === "ivory"

    const styleVars: any = {
        "--mgl-bg": isLight ? "#f5f2ec" : "#0c0c0d",
        "--mgl-text": isLight ? "#171614" : "#f3efe7",
        "--mgl-muted": isLight ? "#7d776d" : "rgba(243,239,231,.52)",
        "--mgl-line": isLight ? "rgba(23,22,20,.12)" : "rgba(243,239,231,.12)",
        "--mgl-pill": isLight ? "rgba(23,22,20,.05)" : "rgba(255,255,255,.06)",
        "--mgl-cols": effCols,
        "--mgl-gap": `${gap}px`,
        "--mgl-pad": `${effPad}px`,
    }

    const activeLb = lbIdx !== null ? filtered[lbIdx] : null

    return (
        <div
            ref={rootRef}
            className="mgl-root"
            style={styleVars}
            onClick={(e) => e.stopPropagation()}
        >
            <style>{CSS}</style>

            {heading && (
                <header className="mgl-hdr">
                    <div>
                        <div className="mgl-eyebrow">Portfolio</div>
                        <h2 className="mgl-htitle">{richTitle(heading)}</h2>
                    </div>
                    <div className="mgl-hmeta">
                        <span className="mgl-hnum">
                            {pad2(filtered.length)}
                        </span>
                        <span className="mgl-hlbl">Frames</span>
                    </div>
                </header>
            )}

            {cats.length > 0 && (
                <div
                    className="mgl-bar"
                    role="group"
                    aria-label="Filter photos"
                >
                    <button
                        type="button"
                        className="mgl-tab"
                        aria-pressed={safeActive === ALL}
                        onClick={() => setActive(ALL)}
                    >
                        <span>All</span>
                        <span className="mgl-cnt">{pad2(capped.length)}</span>
                    </button>
                    {cats.map((c) => (
                        <button
                            key={c}
                            type="button"
                            className="mgl-tab"
                            aria-pressed={safeActive === c}
                            onClick={() => setActive(c)}
                        >
                            <span>{c}</span>
                            <span className="mgl-cnt">
                                {pad2(counts[c] || 0)}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="mgl-list" data-view={view}>
                {filtered.map(({ it, i }, ri) => {
                    const fallback = DEMO_LITE[i % DEMO_LITE.length]
                    const src =
                        (it?.image && typeof it.image === "object"
                            ? it.image.src
                            : it?.image) ||
                        fallback?.image?.src ||
                        ""
                    const cat = splitCats(it?.category)[0] || ""
                    return (
                        <div
                            key={i}
                            className="mgl-card"
                            style={
                                {
                                    ["--mgl-ar" as any]:
                                        AR_CYCLE[i % AR_CYCLE.length],
                                } as any
                            }
                            onClick={() => setLbIdx(ri)}
                        >
                            {src && (
                                <img
                                    src={src}
                                    alt={it?.title || ""}
                                    loading="lazy"
                                    draggable={false}
                                />
                            )}
                            {brackets && (
                                <div className="mgl-vf" aria-hidden="true">
                                    <span className="mgl-vf-tl" />
                                    <span className="mgl-vf-br" />
                                </div>
                            )}
                            <div className="mgl-top">
                                <span className="mgl-idx">{pad2(i + 1)}</span>
                                {cat && <span className="mgl-chip">{cat}</span>}
                            </div>
                            {it?.title && (
                                <div className="mgl-ov">
                                    <div className="mgl-title">{it.title}</div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Floating Pro Upgrade CTA Button (Right-Bottom, above "Made in Framer" button) */}
            <a
                className="mgl-pro-fab"
                data-btn={proBtn}
                href={PRO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Get Photo CMS Filter Pro on Framer Marketplace"
            >
                <span className="mgl-pro-body">
                    <span className="mgl-pro-head">
                        <span className="mgl-pro-dot" aria-hidden="true" />
                        Photo CMS Filter Pro
                    </span>
                    <span className="mgl-pro-sub">
                        CMS Gallery · Focal Crop · 5 Views · Proofing &amp; EXIF
                    </span>
                </span>
                <span className="mgl-pro-cta">
                    Unlock Pro <span className="mgl-pro-arr">↗</span>
                </span>
            </a>

            {isCanvas && rawItems.length > MAX_LITE && (
                <div className="mgl-pro-note">
                    <strong>Photography Filter Lite</strong> displays up to{" "}
                    <strong>10 photos</strong> ({rawItems.length} added).
                    Upgrade to <strong>Photography CMS Filter Pro</strong> for
                    unlimited CMS collections, per-photo focal point crop, 5
                    layouts, Before/After retouch slider, EXIF metadata &amp;
                    Client Proofing.
                </div>
            )}

            {activeLb &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        role="dialog"
                        aria-modal="true"
                        onClick={() => setLbIdx(null)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 99999,
                            background: "rgba(8,8,10,.92)",
                            backdropFilter: "blur(20px)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 24,
                            color: "#fff",
                        }}
                    >
                        <img
                            src={
                                activeLb.it?.image?.src ||
                                activeLb.it?.image ||
                                DEMO_LITE[activeLb.i % DEMO_LITE.length]?.image
                                    ?.src ||
                                ""
                            }
                            alt={activeLb.it?.title || ""}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: "90vw",
                                maxHeight: "78vh",
                                objectFit: "contain",
                                borderRadius: 8,
                                boxShadow: "0 30px 80px rgba(0,0,0,.6)",
                            }}
                        />
                        {activeLb.it?.title && (
                            <div
                                style={{
                                    marginTop: 14,
                                    fontSize: 18,
                                    fontWeight: 500,
                                }}
                            >
                                {activeLb.it.title}
                            </div>
                        )}
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={() => setLbIdx(null)}
                            style={{
                                position: "absolute",
                                top: 18,
                                right: 22,
                                width: 40,
                                height: 40,
                                borderRadius: 999,
                                border: "1px solid rgba(255,255,255,.2)",
                                background: "rgba(255,255,255,.08)",
                                color: "#fff",
                                fontSize: 16,
                                cursor: "pointer",
                            }}
                        >
                            ✕
                        </button>
                    </div>,
                    document.body
                )}
        </div>
    )
}

WebzostPhotoGalleryLite.displayName = "Photography Filter Lite"

addPropertyControls(WebzostPhotoGalleryLite, {
    items: {
        type: ControlType.Array,
        title: "Photos (Max 10)",
        description:
            "Lite Edition supports up to 10 manual photos.\n⚡ Upgrade to **Photography CMS Filter Pro** for unlimited CMS collections, focal point crop, 5 layouts, EXIF, Before/After & Client Proofing.",
        maxCount: 10,
        defaultValue: DEMO_LITE as any,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Photo" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Photo title",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Portraits",
                },
            },
        },
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Selected *Works*",
    },
    view: {
        type: ControlType.Enum,
        title: "Layout",
        defaultValue: "masonry",
        options: ["masonry", "grid"],
        optionTitles: ["Masonry", "Grid"],
        displaySegmentedControl: true,
    },
    cols: {
        type: ControlType.Number,
        title: "Columns",
        min: 1,
        max: 4,
        step: 1,
        defaultValue: 3,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 4,
        max: 32,
        step: 2,
        defaultValue: 12,
        unit: "px",
    },
    brackets: {
        type: ControlType.Boolean,
        title: "Corner ┌ ┘",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        defaultValue: "noir",
        options: ["noir", "ivory"],
        optionTitles: ["Noir (Dark)", "Ivory (Light)"],
        displaySegmentedControl: true,
    },
    proBtn: {
        type: ControlType.Enum,
        title: "Pro CTA style",
        defaultValue: "white",
        options: ["white", "blue", "light"],
        optionTitles: ["White Pill", "Framer Blue", "Solid White"],
    },
})
