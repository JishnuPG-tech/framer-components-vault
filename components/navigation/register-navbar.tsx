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


type Page = { label: string; href?: string; newTab?: boolean }
type Brand = { name?: string; logo?: { src: string; srcSet?: string } }
type Palette = { ink?: string; paper?: string; tab?: string; tabInk?: string }
interface Props {
    brand?: Brand
    homeLink?: string
    homeNewTab?: boolean
    pages?: Page[]
    indexLabel?: string
    currentPage?: number
    start?: "closed" | "open"
    layoutMode?: "flow" | "overlay"
    colors?: Palette
    linkFont?: React.CSSProperties
    rowPadding?: string
    radius?: string
    style?: React.CSSProperties
}
const samplePages: Page[] = ["Overview", "Selected work", "Studio", "Contact"].map(label => ({ label, href: "", newTab: false }))
const colorsDefault = { ink: "#242620", paper: "#FBFAF6", tab: "#DFEB91", tabInk: "#26291B" }
const mono = "ui-monospace, SFMono-Regular, Consolas, monospace"
const ease = "cubic-bezier(.2,.78,.2,1)"

const sheet = `
.rgn-nav, .rgn-nav * { box-sizing: border-box; }
.rgn-nav { container: registerNav / inline-size; contain-intrinsic-inline-size: 500px; min-width: 0; isolation: isolate; text-align: left; font-family: Inter, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
.rgn-nav a, .rgn-nav button { -webkit-tap-highlight-color: transparent; color: inherit; text-decoration: none; }
.rgn-nav button { font: inherit; border: 0; padding: 0; background: transparent; cursor: pointer; }
.rgn-nav :is(a,button):focus-visible { outline: 2px solid currentColor; outline-offset: -4px; }
.rgn-shell {
    --rn-shadow: 0 1px 2px #271d101c, 2px 5px 7px -4px #30271b55, 6px 18px 26px -12px #372e2252, 16px 36px 64px -25px #372f202e;
    position: relative; background: var(--rn-ink); border-radius: var(--rn-radius);
    box-shadow: var(--rn-shadow);
}
.rgn-shell::before,.rgn-shell::after { content: ""; position: absolute; inset: 50% 3px -2px; z-index: -1; pointer-events: none; border-radius: var(--rn-radius); background: color-mix(in srgb, var(--rn-paper) 91%, var(--rn-ink)); box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--rn-ink) 23%, transparent); }
.rgn-shell::before { inset: 50% 7px -4px; background: color-mix(in srgb, var(--rn-paper) 78%, var(--rn-ink)); }
.rgn-head {
    position: relative; min-height: 62px; display: flex; align-items: center; gap: 14px; padding: 7px 8px 7px 21px; color: var(--rn-paper);
    border-radius: inherit; background: linear-gradient(113deg, #ffffff0c, transparent 52%, #00000016);
    box-shadow: inset 0 1px 0 #ffffff29, inset 1px 0 0 #ffffff0e;
}
.rgn-brand { display: inline-flex; align-items: center; min-width: 0; gap: 9px; min-height: 44px; font-weight: 640; font-size: 21px; letter-spacing: -.052em; line-height: 1; }
.rgn-brand > svg, .rgn-brand > img { flex: none; width: 25px; height: 25px; object-fit: contain; }
.rgn-cut { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rgn-context { min-width: 0; flex: 1; display: flex; align-items: center; gap: 12px; font-size: 13px; letter-spacing: -.02em; color: color-mix(in srgb, var(--rn-paper) 78%, var(--rn-ink)); }
.rgn-slash { margin: 0 1px; width: 1px; height: 13px; background: currentColor; opacity: .4; transform: skew(-20deg); flex-shrink: 0; }
.rgn-nav button.rgn-toggle { position: relative; flex: none; margin-left: auto; padding: 0 15px 0 19px; min-height: 46px; max-width: 44%; display: inline-flex; gap: 22px; align-items: center; justify-content: center; color: var(--rn-tab-ink); font-weight: 600; font-size: 14px; letter-spacing: -.025em; line-height: 1; user-select: none; isolation: isolate; transition: transform .16s; }
.rgn-toggle::before { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(122deg,#ffffff24,transparent 66%,#00000009), var(--rn-tab); clip-path: polygon(8px 0,100% 0,100% 100%,0 100%,0 8px); border-radius: 4px; box-shadow: inset 0 1px 0 #ffffff7a, inset 0 -1px 0 #00000028; transition: filter .18s; }
.rgn-toggle:active { transform: translateY(1px); }
.rgn-grip::before { content: ""; position: absolute; top: 1px; bottom: 1px; left: -10px; width: 1px; background: currentColor; opacity: .18; }
.rgn-grip { position: relative; display: flex; align-items: center; justify-content: center; width: 14px; height: 16px; gap: 2px; flex: none; }
.rgn-grip i { width: 2px; height: 11px; display: block; background: currentColor; transition: transform .25s ${ease}; }
.rgn-grip i:nth-child(2) { height: 15px; }
.rgn-nav[data-open=true] .rgn-grip i:first-child { transform: translateX(4px) rotate(45deg); height: 15px; }
.rgn-nav[data-open=true] .rgn-grip i:nth-child(2) { transform: scaleY(0); }
.rgn-nav[data-open=true] .rgn-grip i:last-child { transform: translateX(-4px) rotate(-45deg); height: 15px; }
.rgn-drawer { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .32s ${ease}; }
.rgn-nav[data-open=true] .rgn-drawer { grid-template-rows: 1fr; }
.rgn-nav[data-layout=overlay] .rgn-drawer { position: absolute; z-index: 2; inset: 100% 0 auto; }
.rgn-nav[data-layout=overlay][data-open=true] .rgn-drawer { filter: drop-shadow(3px 12px 13px #30271b25); }
.rgn-mask { min-height: 0; overflow: hidden; border-radius: var(--rn-radius); border-top-left-radius: 2px; border-top-right-radius: 2px; }
.rgn-surface { background: linear-gradient(116deg,#ffffff28,transparent 60%,#87775506), var(--rn-paper); color: var(--rn-ink); padding: 7px 7px 8px; border-radius: inherit; border: 1px solid color-mix(in srgb, var(--rn-ink) 13%, var(--rn-paper)); box-shadow: inset 0 1px 0 #ffffffbf; }
.rgn-scroll { max-height: 60vh; max-height: min(60svh,560px); overflow-y: auto; scrollbar-width: thin; overscroll-behavior: contain; }
.rgn-list { position: relative; isolation: isolate; list-style: none; margin: 0; padding: 0; }
.rgn-mark { z-index: -1; position: absolute; inset: 0 0 auto; background: linear-gradient(90deg,color-mix(in srgb,var(--rn-tab) 19%,var(--rn-paper)),color-mix(in srgb,var(--rn-ink) 3.5%,var(--rn-paper)) 70%); pointer-events: none; border-radius: 3px; transition: transform .22s ${ease}, height .22s, opacity .18s; }
.rgn-mark::before { content: ""; position: absolute; left: 0; inset-block: 33%; width: 2px; background: var(--rn-ink); border-radius: 1px; }
.rgn-item { position: relative; }
.rgn-item + .rgn-item::before { content: ""; position: absolute; inset: 0 11px auto; height: 1px; background: color-mix(in srgb, var(--rn-ink) 12%, transparent); pointer-events: none; }
.rgn-nav .rgn-row { position: relative; display: grid; grid-template-columns: 29px minmax(0,1fr) 18px; align-items: center; gap: 17px; width: 100%; text-align: left; min-height: 64px; padding: var(--rn-padding); color: var(--rn-ink); border-radius: 3px; }
.rgn-row::after { content: ""; position: absolute; grid-column: 1 / 2; inset-block: 0; right: 0; width: 1px; background: color-mix(in srgb, var(--rn-ink) 12%, transparent); pointer-events: none; }
.rgn-number { font: 11px/1 ${mono}; letter-spacing: .015em; opacity: .65; font-variant-numeric: tabular-nums; }
.rgn-page { font-size: 26px; font-weight: 500; letter-spacing: -.042em; line-height: 1.1; overflow-wrap: anywhere; transition: transform .24s ${ease}; }
.rgn-end { width: 18px; height: 18px; display: grid; place-items: center; justify-self: end; }
.rgn-end svg { width: 15px; height: 15px; opacity: .66; transition: transform .2s; }
.rgn-bookmark { display: block; width: 11px; height: 16px; background: linear-gradient(90deg,transparent 44%,#ffffff26 47%,transparent 52%), var(--rn-ink); clip-path: polygon(0 0,100% 0,100% 100%,50% 76%,0 100%); }
@media (hover: hover) { .rgn-toggle:hover::before { filter: brightness(1.045); } .rgn-row:hover .rgn-end svg { transform: translateX(2px); } .rgn-row:hover .rgn-page { transform: translateX(2px); } }
@container registerNav (max-width: 380px) {
    .rgn-head { padding-left: 14px; gap: 9px; min-height: 58px; }
    .rgn-brand { font-size: 19px; gap: 7px; }
    .rgn-brand > svg,.rgn-brand > img { width: 21px; height: 21px; }
    .rgn-context { gap: 8px; font-size: 12px; }
    .rgn-nav button.rgn-toggle { min-height: 44px; padding-inline: 13px 11px; gap: 13px; }
    .rgn-grip::before { left: -6px; }
    .rgn-nav .rgn-row { min-height: 56px; grid-template-columns: 23px minmax(0,1fr) 16px; gap: 12px; }
}
@container registerNav (max-width: 265px) { .rgn-context { display: none; } }
@media (prefers-reduced-motion: reduce) {
    .rgn-nav *, .rgn-nav *::before, .rgn-nav *::after { transition-duration: 0s !important; }
}
`

function OffsetMark() {
    return <svg aria-hidden="true" viewBox="0 0 28 28" fill="currentColor">
        <path d="M8 3h17l-5 6H3zM8 11h17l-5 6H3zM8 19h17l-5 6H3z" />
    </svg>
}

function pageMatch(pages: Page[]) {
    if (typeof window === "undefined") return -1
    const here = new URL(window.location.href)
    const clean = (s: string) => s.replace(/\/+$/, "") || "/"
    let samePath = -1
    for (const [i, page] of pages.entries()) {
        if (!page.href) continue
        try {
            const target = new URL(page.href, here)
            if (target.origin !== here.origin || clean(target.pathname) !== clean(here.pathname)) continue
            if (target.hash && target.hash === here.hash) return i
            if (!target.hash && samePath < 0) samePath = i
        } catch { /* An unfinished destination in the editor is ignored. */ }
    }
    return samePath
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 62
 * @framerDisableUnlink
 */
export default function RegisterNavbar({
    brand = {}, homeLink, homeNewTab = false, pages = samplePages, indexLabel = "Index", currentPage = 1,
    start = "closed", layoutMode = "flow", colors = {}, linkFont,
    rowPadding = "14px 16px", radius = "8px", style,
}: Props) {
    const links = React.useMemo(() => (pages || []).filter(p => p?.label?.trim()), [pages])
    const [open, setOpen] = React.useState(start === "open")
    const [matched, setMatched] = React.useState(-1)
    const [localPage, setLocalPage] = React.useState<number | null>(null)
    const [highlight, setHighlight] = React.useState<{ y: number; h: number } | null>(null)
    const root = React.useRef<HTMLElement>(null)
    const toggle = React.useRef<HTMLButtonElement>(null)
    const menuId = React.useId()
    const canvas = RenderTarget.current() === RenderTarget.canvas
    const expanded = (canvas ? start === "open" : open) && links.length > 0
    const active = matched >= 0 ? matched : localPage ?? Math.min(Math.max(currentPage - 1, -1), links.length - 1)
    const palette = { ...colorsDefault, ...colors }
    React.useEffect(() => { setOpen(start === "open") }, [start])
    React.useEffect(() => {
        if (canvas) return
        function sync() { setMatched(pageMatch(links)) }
        sync()
        window.addEventListener("popstate", sync)
        window.addEventListener("hashchange", sync)
        window.addEventListener("pageshow", sync)
        return () => {
            window.removeEventListener("popstate", sync)
            window.removeEventListener("hashchange", sync)
            window.removeEventListener("pageshow", sync)
        }
    }, [links, canvas])
    React.useEffect(() => {
        if (!expanded || canvas) return
        function outside(event: PointerEvent) {
            if (!root.current?.contains(event.target as Node)) setOpen(false)
        }
        function keydown(event: KeyboardEvent) {
            if (event.key !== "Escape" || (document.activeElement !== document.body && !root.current?.contains(document.activeElement))) return
            setOpen(false)
            toggle.current?.focus({ preventScroll: true })
        }
        document.addEventListener("pointerdown", outside)
        document.addEventListener("keydown", keydown)
        return () => {
            document.removeEventListener("pointerdown", outside)
            document.removeEventListener("keydown", keydown)
        }
    }, [expanded, canvas])
    React.useEffect(() => { if (!expanded) setHighlight(null) }, [expanded])
    function mark(element: HTMLElement) {
        const item = element.parentElement
        if (item) setHighlight({ y: item.offsetTop, h: item.offsetHeight })
    }
    function choose(i: number) {
        if (!links[i].href) setLocalPage(i)
        setOpen(false)
        toggle.current?.focus({ preventScroll: true })
    }
    const name = brand.name?.trim() || "Offset"
    const brandFace = <>{brand.logo?.src ? <img alt="" src={brand.logo.src} srcSet={brand.logo.srcSet} /> : <OffsetMark />}<span className="rgn-cut">{name}</span></>
    const vars = {
        "--rn-ink": palette.ink, "--rn-paper": palette.paper, "--rn-tab": palette.tab, "--rn-tab-ink": palette.tabInk,
        "--rn-padding": rowPadding, "--rn-radius": radius,
    } as React.CSSProperties
    return <nav ref={root} className="rgn-nav" data-open={expanded} data-layout={layoutMode}
        aria-label={name + " navigation"} style={{ ...vars, ...style }}
        onBlur={e => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false) }}>
        <style>{sheet}</style>
        <div className="rgn-shell">
            <div className="rgn-head">
                {homeLink ? <a className="rgn-brand" href={homeLink} target={homeNewTab ? "_blank" : undefined} rel={homeNewTab ? "noopener noreferrer" : undefined}>{brandFace}</a> : <span className="rgn-brand">{brandFace}</span>}
                {links[active] && <span className="rgn-context"><i className="rgn-slash" aria-hidden="true" /><span className="rgn-cut">{links[active].label}</span></span>}
                {links.length > 0 && <button type="button" className="rgn-toggle" ref={toggle} aria-expanded={expanded} aria-controls={menuId} onClick={() => setOpen(v => !v)}>
                    <span className="rgn-cut">{indexLabel?.trim() || "Index"}</span>
                    <span className="rgn-grip" aria-hidden="true"><i/><i/><i/></span>
                </button>}
            </div>
            <div className="rgn-drawer" id={menuId} aria-hidden={!expanded}>
                <div className="rgn-mask" style={{ visibility: expanded ? "visible" : undefined }}>
                    <div className="rgn-surface">
                        <div className="rgn-scroll" onPointerLeave={() => setHighlight(null)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHighlight(null) }}>
                            <ol className="rgn-list">
                                {links.map((page, i) => {
                                    const content = <><span aria-hidden="true" className="rgn-number">{String(i + 1).padStart(2, "0")}</span>
                                        <span className="rgn-page" style={linkFont}>{page.label}</span>
                                        <span className="rgn-end" aria-hidden="true">{active === i ? <i className="rgn-bookmark"/> :
                                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ rotate: page.newTab ? "-45deg" : undefined }}><path d="M2.5 8h10M8 3.5l4.5 4.5L8 12.5"/></svg>}</span></>
                                    const props = {
                                        className: "rgn-row", tabIndex: expanded ? 0 : -1,
                                        "aria-current": active === i ? "page" as const : undefined,
                                        onPointerEnter: (e: React.PointerEvent<HTMLElement>) => { if (e.pointerType !== "touch") mark(e.currentTarget) },
                                        onFocus: (e: React.FocusEvent<HTMLElement>) => mark(e.currentTarget), onClick: () => choose(i),
                                    }
                                    return <li key={i} className="rgn-item">
                                        {i === 0 && <span className="rgn-mark" aria-hidden="true" style={{ height: highlight?.h || 0, transform: "translateY(" + (highlight?.y || 0) + "px)", opacity: highlight ? 1 : 0 }}/>}
                                        {page.href ? <a {...props} href={page.href} target={page.newTab ? "_blank" : undefined} rel={page.newTab ? "noopener noreferrer" : undefined}>{content}</a>
                                            : <button {...props} type="button">{content}</button>}
                                    </li>
                                })}
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>
}

RegisterNavbar.displayName = "Register Navbar"

addPropertyControls(RegisterNavbar, {
    brand: { type: ControlType.Object, title: "Brand", controls: {
        name: { type: ControlType.String, title: "Name", defaultValue: "Offset" },
        logo: { type: ControlType.ResponsiveImage, title: "Logo" },
    } },
    homeLink: { type: ControlType.Link, title: "Brand Link" },
    homeNewTab: { type: ControlType.Boolean, title: "Open in New Tab", defaultValue: false, hidden: p => !p.homeLink },
    pages: { type: ControlType.Array, title: "Pages", maxCount: 24, defaultValue: samplePages, control: { type: ControlType.Object, controls: {
        label: { type: ControlType.String, title: "Label", defaultValue: "Page" },
        href: { type: ControlType.Link, title: "Destination" },
        newTab: { type: ControlType.Boolean, title: "Open in New Tab", defaultValue: false },
    } } },
    indexLabel: { type: ControlType.String, title: "Menu Label", defaultValue: "Index" },
    currentPage: { type: ControlType.Number, title: "Current Page", min: 0, max: 24, step: 1, displayStepper: true, defaultValue: 1, description: "Fallback page number. A matching URL takes priority. Use 0 to hide." },
    start: { type: ControlType.Enum, title: "Start State", displaySegmentedControl: true, options: ["closed", "open"], optionTitles: ["Closed", "Open"], defaultValue: "closed" },
    layoutMode: { type: ControlType.Enum, title: "Menu Layout", displaySegmentedControl: true, options: ["flow", "overlay"], optionTitles: ["In Flow", "Overlay"], defaultValue: "flow" },
    colors: { type: ControlType.Object, title: "Palette", controls: {
        ink: { type: ControlType.Color, title: "Ink", defaultValue: colorsDefault.ink },
        paper: { type: ControlType.Color, title: "Paper", defaultValue: colorsDefault.paper },
        tab: { type: ControlType.Color, title: "Tab", defaultValue: colorsDefault.tab },
        tabInk: { type: ControlType.Color, title: "Tab Text", defaultValue: colorsDefault.tabInk },
    } },
    linkFont: { type: ControlType.Font, title: "Page Type", defaultFontType: "sans-serif", controls: "extended", defaultValue: { fontSize: "26px", letterSpacing: "-0.042em", lineHeight: "1.1em", variant: "Medium" } },
    rowPadding: { type: ControlType.Padding, title: "Row Padding", defaultValue: "14px 16px 14px 16px" },
    radius: { type: ControlType.BorderRadius, title: "Corner Radius", defaultValue: "8px",
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)" },
})

