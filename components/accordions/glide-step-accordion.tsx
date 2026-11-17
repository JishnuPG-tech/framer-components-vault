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

import { motion, useReducedMotion } from "framer-motion"

type Picture = { src: string; srcSet?: string; alt?: string }
type Step = { title: string; description: string; label: string; image?: Picture; link?: string; newTab?: boolean }
type ButtonSettings = {
    font: React.CSSProperties; fill: string; text: string; visible: boolean
    border: React.CSSProperties; radius: string; padding: string; gap: string; shadow: string
    icon: boolean; iconSize: number; separator: boolean; spacing: number
}
type Props = {
    items: Step[]; text: string; muted: string; accent: string; activeFill: string; line: string
    titleFont: React.CSSProperties; bodyFont: React.CSSProperties; padding: string; radius: string
    imageRadius: string; gap: string; imageRatio: number; motion: any; style?: React.CSSProperties
    button: ButtonSettings; showNumbers: boolean; showHeaderArrow: boolean; previewStep: number
}

const ASSET_DISCOVER = "https://framerusercontent.com/images/hHkrervmsuIKszpNUvMmToFcBzw.png"
const ASSET_ENVISION = "https://framerusercontent.com/images/478p13hUkbd8anJonGkekU6oO8E.png"
const ASSET_SHAPE = "https://framerusercontent.com/images/PlO8sbWFvJdDr4JGIyRxoFqtH8.png"
const ASSET_REFINE = "https://framerusercontent.com/images/LWiZovHQUSfr0cXsCZy302u3O4.png"
const ASSET_REALIZE = "https://framerusercontent.com/images/1pl9uQfJ1gVRbZSpeFF89yb8jc.png"
const defaultItems: Step[] = [
    { title: "Discover", description: "A sense of place. A different perspective. Find the starting point for something extraordinary.", label: "Find your direction", image: { src: ASSET_DISCOVER, alt: "Dark timber and glass residence beside a misty forest lake at dusk" }, link: "", newTab: false },
    { title: "Envision", description: "Turn a first instinct into a clear vision, through thoughtful sketches, materials, and possibilities.", label: "Explore the concept", image: { src: ASSET_ENVISION, alt: "Charcoal architectural model with graphite drawings and metal samples in a dark atelier" }, link: "", newTab: false },
    { title: "Shape", description: "Give the idea its form. Consider every line, proportion, and the way light moves through a space.", label: "See the process", image: { src: ASSET_SHAPE, alt: "Monolithic dark stone staircase beside a tall window overlooking a forest" }, link: "", newTab: false },
    { title: "Refine", description: "The smallest decisions make the biggest difference. Bring texture, warmth, and intention to every detail.", label: "Look a little closer", image: { src: ASSET_REFINE, alt: "Blackened oak joinery, patinated bronze and dark leather upholstery in close detail" }, link: "", newTab: false },
    { title: "Realize", description: "Everything comes together. A considered space, ready to be lived in and made your own.", label: "Discover the result", image: { src: ASSET_REALIZE, alt: "Charcoal living room with a warm stone fireplace and panoramic blue-hour lake view" }, link: "", newTab: false },
]
const defaults = {
    items: defaultItems, text: "#F0F0E9", muted: "#9DA9AB", accent: "#C9D7D4", activeFill: "#1B2428", line: "#313B3F",
    titleFont: { fontFamily: "Manrope", fontStyle: "Medium", fontSize: 34, fontWeight: 500, lineHeight: "1.15em", letterSpacing: "-0.045em" },
    bodyFont: { fontFamily: "Manrope", fontStyle: "Regular", fontSize: 15, fontWeight: 400, lineHeight: "1.6em", letterSpacing: "-0.01em" },
    padding: "24px", radius: "10px", imageRadius: "14px", gap: "20px 64px", imageRatio: 1.45,
    button: {
        font: { fontFamily: "Manrope", fontStyle: "Medium", fontSize: 11, fontWeight: 500, lineHeight: "1.4em", letterSpacing: "0em" },
        fill: "rgba(201, 215, 212, 0.03)", text: "#C9D7D4", visible: true,
        border: { borderWidth: 1, borderStyle: "solid" as const, borderColor: "#354347" },
        radius: "6px", padding: "6px 10px 6px 10px", gap: "0px 8px", shadow: "none",
        icon: false, iconSize: 16, separator: false, spacing: 16,
    },
    showNumbers: true, showHeaderArrow: false, previewStep: 1,
    motion: { type: "tween" as const, duration: 0.68, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
}
const Arrow = ({ diagonal = false, size = 18 }: { diagonal?: boolean; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>

type WipeLayer = { id: number; index: number; direction: number }
// Keep unfinished wipes visible; each completed layer compacts the stack beneath it.
function ImageWipe({ items, index, transition, reduced, renderImage }: {
    items: Step[]; index: number; transition: any; reduced: boolean | null
    renderImage: (item: Step, className: string, decorative?: boolean) => React.ReactNode
}) {
    const [frames, setFrames] = React.useState<{ base: number; layers: WipeLayer[] }>({ base: index, layers: [] })
    const current = React.useRef(frames)
    const requested = React.useRef(index)
    const generation = React.useRef(0)
    const ready = React.useRef(new Map<string, Promise<boolean>>())
    const commit = (next: typeof frames) => { current.current = next; setFrames(next) }
    const preload = (item: Step): Promise<boolean> => {
        const src = item.image?.src
        if (!src) return Promise.resolve(true)
        if (!ready.current.has(src)) ready.current.set(src, new Promise(resolve => {
            const image = new Image()
            image.onload = () => {
                if (typeof image.decode === "function") image.decode().then(() => resolve(true), () => resolve(true))
                else resolve(true)
            }
            image.onerror = () => resolve(false)
            if (item.image?.srcSet) image.srcset = item.image.srcSet
            image.sizes = "(max-width: 719px) 100vw, 50vw"
            image.src = src
        }))
        return ready.current.get(src)!
    }
    // Decode ahead of interaction so the frame glide and the wipe start together.
    React.useEffect(() => { items.forEach(item => { void preload(item) }) }, [items.map(item => item.image?.src || "").join("|")])
    React.useEffect(() => {
        if (!items[index]) return
        const previous = requested.current
        requested.current = index
        if (previous === index && current.current.base === index && !current.current.layers.length) return
        const ticket = ++generation.current
        const direction = index >= previous ? 1 : -1
        const src = items[index]?.image?.src
        const reveal = () => {
            if (ticket !== generation.current) return
            if (reduced) { commit({ base: index, layers: [] }); return }
            commit({ base: current.current.base, layers: [...current.current.layers, { id: ticket, index, direction }] })
        }
        if (!src) { reveal(); return }
        preload(items[index]).then(loaded => { if (loaded) reveal() })
        return () => { if (ticket === generation.current) generation.current++ }
    }, [index, items[index]?.image?.src, reduced])
    const finish = (layer: WipeLayer) => {
        const position = current.current.layers.findIndex(frame => frame.id === layer.id)
        if (position < 0) return
        commit({ base: layer.index, layers: current.current.layers.slice(position + 1) })
    }
    const baseItem = items[Math.min(frames.base, items.length - 1)]
    return <>
        {baseItem && <div style={{ position: "absolute", inset: 0 }}>{renderImage(baseItem, "gsa-image", true)}</div>}
        {frames.layers.map(layer => items[layer.index] && <motion.div key={layer.id}
            initial={{ clipPath: layer.direction > 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }} transition={transition} onAnimationComplete={() => finish(layer)}
            style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            <motion.div initial={{ y: layer.direction * 10, scale: 1.04 }} animate={{ y: 0, scale: 1 }} transition={transition}
                style={{ position: "absolute", inset: 0 }}>{renderImage(items[layer.index], "gsa-image", true)}</motion.div>
        </motion.div>)}
    </>
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 620
 * @framerDisableUnlink
 */
export default function GlideStepAccordion(input: Partial<Props>) {
    const button = React.useMemo(() => ({ ...defaults.button, ...input.button }), [input.button])
    const p = { ...defaults, ...input, button } as Props
    const items = (p.items || []).filter(Boolean)
    const staticRenderer = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.thumbnail
    const root = React.useRef<HTMLDivElement>(null)
    const list = React.useRef<HTMLOListElement>(null)
    const rows = React.useRef<(HTMLLIElement | null)[]>([])
    const details = React.useRef<(HTMLDivElement | null)[]>([])
    const rail = React.useRef<HTMLDivElement>(null)
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const lastPointer = React.useRef<{ x: number; y: number } | null>(null)
    const [liveActive, setActive] = React.useState(-1)
    const [settledStep, setSettledStep] = React.useState(-1)
    const active = staticRenderer ? Math.min(Math.max(-1, Math.round(p.previewStep) - 1), items.length - 1) : liveActive
    const activeRef = React.useRef(active)
    activeRef.current = active
    const [lastSelected, setLastSelected] = React.useState(0)
    const [coarse, setCoarse] = React.useState(false)
    const [narrow, setNarrow] = React.useState(false)
    const [frame, setFrame] = React.useState({ y: 0, height: 300, reserve: 610, gapLeft: 0, gapWidth: 0 })
    const reduced = useReducedMotion() || staticRenderer
    const stacked = coarse || narrow
    const id = React.useId().replace(/:/g, "")
    const scope = `gsa-${id}`
    const rawDuration = p.motion?.duration
    const parsedDuration = typeof rawDuration === "number" ? rawDuration : typeof rawDuration === "string" ? parseFloat(rawDuration) / (rawDuration.trim().endsWith("ms") ? 1000 : 1) : 0.68
    const duration = reduced ? 0 : Number.isFinite(parsedDuration) ? Math.max(0, parsedDuration) : 0.68
    const rawDelay = p.motion?.delay
    const parsedDelay = typeof rawDelay === "number" ? rawDelay : typeof rawDelay === "string" ? parseFloat(rawDelay) / (rawDelay.trim().endsWith("ms") ? 1000 : 1) : 0
    const delay = Number.isFinite(parsedDelay) ? parsedDelay : 0
    const transition = reduced ? { duration: 0, delay: 0 } : { ...p.motion, ...(rawDuration !== undefined ? { duration } : {}), ...(rawDelay !== undefined ? { delay } : {}) }
    const selectedIndex = Math.min(Math.max(0, active >= 0 ? active : lastSelected), Math.max(0, items.length - 1))
    const selected = items[selectedIndex]
    const pillClip = "inset(36% 0% 36% 0% round 160px)"

    const cancelClose = React.useCallback(() => clearTimeout(closeTimer.current), [])
    const selectStep = (index: number) => { if (staticRenderer) return; if (index !== liveActive) setSettledStep(-1); setActive(index); if (index >= 0) setLastSelected(index) }
    const activate = (index: number, event: React.PointerEvent) => {
        if (event.pointerType !== "mouse" || stacked) return
        cancelClose()
        const next = { x: event.clientX, y: event.clientY }
        const old = lastPointer.current
        // A row moving under a stationary cursor must not start a hover loop.
        if (!old || old.x !== next.x || old.y !== next.y) selectStep(index)
        lastPointer.current = next
    }
    const scheduleClose = () => {
        cancelClose()
        closeTimer.current = setTimeout(() => {
            const focused = root.current?.querySelector<HTMLElement>(".gsa-link:focus-visible")
            selectStep(focused ? Number(focused.dataset.stepIndex) : -1)
        }, 140)
    }

    React.useEffect(() => {
        const media = window.matchMedia("(hover: none), (pointer: coarse)")
        const update = () => setCoarse(media.matches)
        update(); media.addEventListener("change", update)
        return () => { media.removeEventListener("change", update); clearTimeout(closeTimer.current) }
    }, [])
    React.useEffect(() => {
        if (!root.current || !list.current || !rail.current) return
        const measure = () => {
            const width = root.current?.clientWidth ?? 1040
            setNarrow(width < 720)
            // Measure unanimated layout boxes, never chase the opening row's offsetTop.
            const collapsed = rows.current.slice(0, items.length).map(row => {
                const link = row?.firstElementChild as HTMLElement | null
                const head = link?.querySelector<HTMLElement>(".gsa-head")
                if (!row || !link || !head) return 0
                const linkStyle = getComputedStyle(link), rowStyle = getComputedStyle(row)
                return head.offsetHeight + parseFloat(linkStyle.paddingTop) + parseFloat(linkStyle.paddingBottom) + parseFloat(rowStyle.borderTopWidth) + parseFloat(rowStyle.borderBottomWidth)
            })
            const baseline = collapsed.reduce((sum, height) => sum + height, 0)
            const extra = Math.max(0, ...details.current.slice(0, items.length).map(el => (el?.firstElementChild?.firstElementChild as HTMLElement | null)?.offsetHeight || 0))
            const height = (rail.current?.clientWidth || 440) / Math.max(0.6, p.imageRatio)
            const reserve = items.length ? Math.ceil(Math.max(baseline + extra, height)) : 0
            const targetTop = collapsed.slice(0, selectedIndex).reduce((sum, height) => sum + height, 0)
            // The resting image is always centered against the closed list.
            const y = active < 0 ? (baseline - height) / 2 : Math.max(0, Math.min(targetTop, reserve - height))
            const gapLeft = (list.current?.offsetLeft || 0) + (list.current?.offsetWidth || 0)
            const gapWidth = Math.max(0, (rail.current?.offsetLeft || 0) - gapLeft)
            setFrame(previous => Math.abs(previous.y - y) + Math.abs(previous.height - height) + Math.abs(previous.reserve - reserve) + Math.abs(previous.gapLeft - gapLeft) + Math.abs(previous.gapWidth - gapWidth) < 0.5 ? previous : { y, height, reserve, gapLeft, gapWidth })
        }
        const observer = new ResizeObserver(measure)
        observer.observe(root.current); observer.observe(list.current); observer.observe(rail.current)
        rows.current.forEach(row => row && observer.observe(row))
        details.current.forEach(detail => detail?.firstElementChild && observer.observe(detail.firstElementChild))
        measure()
        return () => observer.disconnect()
    }, [active, selectedIndex, items.length, p.imageRatio, p.padding, p.gap, p.titleFont, p.bodyFont, p.showNumbers, p.showHeaderArrow, p.button])
    React.useEffect(() => { if (active >= items.length) setActive(-1) }, [active, items.length])

    const picture = (item: Step, className: string, decorative = false) => item.image?.src ? <img className={className} src={item.image.src} srcSet={item.image.srcSet} sizes="(max-width: 719px) 100vw, 50vw" alt={decorative ? "" : (item.image.alt || item.title)} draggable={false} /> : <div className={`${className} gsa-empty-image`} aria-hidden="true" />
    return <div ref={root} className={scope} data-stacked={stacked || undefined}
        onPointerEnter={cancelClose}
        onPointerLeave={() => { lastPointer.current = null; scheduleClose() }}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) scheduleClose() }}
        style={{ color: p.text, position: "relative", minWidth: 0, ...p.style, "--gsa-accent": p.accent, "--gsa-line": p.line, "--gsa-radius": p.radius, "--gsa-image-radius": p.imageRadius } as React.CSSProperties}>
        <style>{`
            .${scope} * { box-sizing: border-box; }
            .${scope} .gsa-layout { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:${p.gap}; align-items:start; position:relative; }
            .${scope} .gsa-list { list-style:none; padding:0; margin:0; position:relative; min-width:0; }
            .${scope} .gsa-row { position:relative; border-bottom:1px solid var(--gsa-line); min-width:0; }
            .${scope} .gsa-row:focus-within { z-index:1; }
            .${scope} .gsa-link { display:block; color:inherit; text-decoration:none; border-radius:var(--gsa-radius); min-width:0; -webkit-tap-highlight-color:transparent; }
            .${scope} .gsa-link:focus-visible, .${scope} .gsa-image-link:focus-visible { outline:2px solid var(--gsa-accent); outline-offset:5px; }
            .${scope} .gsa-head { display:grid; grid-template-columns:${p.showNumbers ? "32px " : ""}minmax(0,1fr)${p.showHeaderArrow ? " 24px" : ""}; gap:20px; align-items:center; min-height:44px; }
            .${scope} .gsa-number { display:block; font:500 11px/1 Manrope,sans-serif; font-variant-numeric:tabular-nums; letter-spacing:.04em; }
            .${scope} .gsa-title { margin:0; overflow-wrap:anywhere; }
            .${scope} .gsa-arrow { display:flex; justify-content:center; }
            .${scope} .gsa-detail { display:grid; grid-template-rows:0fr; opacity:0; }
            .${scope} .gsa-detail-inner { min-height:0; overflow:hidden; }
            .${scope} .gsa-copy { padding:18px 0 3px ${p.showNumbers ? "52px" : "0px"}; }
            .${scope} .gsa-description { margin:0; max-width:34ch; overflow-wrap:anywhere; }
            .${scope} .gsa-cta { display:inline-flex; align-items:center; max-width:100%; min-width:0; vertical-align:top; pointer-events:none; }
            .${scope} .gsa-cta-label { min-width:0; overflow-wrap:anywhere; }
            .${scope} .gsa-cta-icon { display:flex; align-items:center; justify-content:center; align-self:stretch; flex:none; padding-left:12px; border-left:1px solid; }
            .${scope} .gsa-gap-link { position:absolute; top:0; bottom:0; cursor:pointer; -webkit-tap-highlight-color:transparent; }
            .${scope} .gsa-rail { min-width:0; position:relative; height:100%; }
            .${scope} .gsa-image-link { display:block; position:absolute; inset:0; border-radius:var(--gsa-image-radius); }
            .${scope} .gsa-image { display:block; width:100%; height:100%; object-fit:cover; }
            .${scope} .gsa-empty-image { background:linear-gradient(145deg,#12191c,#354347 50%,#1a2428); }
            .${scope} .gsa-inline-image { display:none; overflow:hidden; border-radius:var(--gsa-image-radius); aspect-ratio:${p.imageRatio}; margin-top:22px; }
            .${scope}[data-stacked] .gsa-layout { grid-template-columns:minmax(0,1fr); min-height:0 !important; }
            .${scope}[data-stacked] .gsa-rail { display:none; }
            .${scope}[data-stacked] .gsa-inline-image { display:block; }
            .${scope}[data-stacked] .gsa-copy { padding-left:0; }
            .${scope}[data-stacked] .gsa-row + .gsa-row { margin-top:12px; }
            @media(prefers-reduced-motion:reduce) { .${scope} *, .${scope} *::before { transition:none !important; animation:none !important; } }
        `}</style>
        <div className="gsa-layout" style={{ minHeight: stacked ? undefined : items.length ? frame.reserve : 0 }}>
            <ol ref={list} className="gsa-list">
                {items.map((item, index) => {
                    const open = active === index || stacked
                    return <motion.li key={index} ref={el => { rows.current[index] = el }} className="gsa-row" data-open={open || undefined}
                        initial={false} animate={{ borderBottomColor: open || active === index + 1 ? "rgba(0, 0, 0, 0)" : p.line }} transition={transition}
                        onPointerEnter={event => activate(index, event)} onPointerMove={event => activate(index, event)}>
                        <motion.a className="gsa-link" data-step-index={index} href={item.link || undefined} tabIndex={0} role={item.link ? undefined : "group"}
                            target={item.link && item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined}
                            aria-label={item.title} aria-describedby={open ? `${scope}-description-${index}` : undefined}
                            onFocus={event => { if (event.currentTarget.matches(":focus-visible")) { cancelClose(); selectStep(index) } }}
                            initial={false} animate={{ backgroundColor: open ? p.activeFill : "rgba(0, 0, 0, 0)" }} transition={transition}
                            style={{ padding: p.padding, cursor: item.link ? "pointer" : "default" }}>
                            <div className="gsa-head">
                                {p.showNumbers && <motion.span className="gsa-number" aria-hidden="true" initial={false} animate={{ color: open ? p.accent : p.muted }} transition={transition}>{String(index + 1).padStart(2, "0")}</motion.span>}
                                <h3 className="gsa-title" style={p.titleFont}>{item.title}</h3>
                                {p.showHeaderArrow && <motion.span className="gsa-arrow" initial={false} animate={{ rotate: open ? 45 : 0, opacity: open ? 1 : 0.55 }} transition={transition}><Arrow diagonal /></motion.span>}
                            </div>
                            <motion.div ref={el => { details.current[index] = el }} className="gsa-detail" aria-hidden={!open}
                                initial={false} animate={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }} transition={transition}
                                onAnimationComplete={() => { if (open && !stacked && activeRef.current === index) setSettledStep(index) }}>
                                <div className="gsa-detail-inner" style={{ overflow: open && (staticRenderer || stacked || settledStep === index) ? "visible" : "hidden" }}><motion.div className="gsa-copy" initial={false}
                                    animate={{ y: open || reduced ? 0 : 6, opacity: open ? 1 : 0 }}
                                    transition={{ ...transition, delay: reduced ? 0 : delay + (open ? Math.min(duration * 0.08, 0.055) : 0) }}>
                                    <p id={`${scope}-description-${index}`} className="gsa-description" style={{ ...p.bodyFont, color: p.muted }}>{item.description}</p>
                                    {p.button.visible && item.label && <span className="gsa-cta"
                                        style={{ ...p.button.font, ...p.button.border, backgroundColor: p.button.fill, color: p.button.text, padding: p.button.padding, borderRadius: p.button.radius, gap: p.button.gap, boxShadow: p.button.shadow, marginTop: p.button.spacing }}>
                                        <span className="gsa-cta-label">{item.label}</span>
                                        {p.button.icon && <span className="gsa-cta-icon" aria-hidden="true" style={{ borderLeftColor: p.button.border?.borderColor || p.line, borderLeftWidth: p.button.separator ? 1 : 0, paddingLeft: p.button.separator ? 8 : 0 }}>
                                            <Arrow size={p.button.iconSize} />
                                        </span>}
                                    </span>}
                                    <div className="gsa-inline-image">{picture(item, "gsa-image")}</div>
                                </motion.div></div>
                            </motion.div>
                        </motion.a>
                    </motion.li>
                })}
            </ol>
            {!stacked && active >= 0 && selected?.link && <a className="gsa-gap-link" href={selected.link}
                target={selected.newTab ? "_blank" : undefined} rel={selected.newTab ? "noopener noreferrer" : undefined}
                tabIndex={-1} aria-hidden="true" style={{ left: frame.gapLeft, width: frame.gapWidth }} />}
            <div ref={rail} className="gsa-rail" aria-hidden={stacked || active < 0}>
                <motion.div animate={{ y: frame.y, opacity: selected ? 1 : 0 }} initial={false}
                    transition={{ ...transition, delay: reduced ? 0 : delay + (active < 0 ? duration * 0.12 : 0) }}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, height: frame.height, pointerEvents: selected && active >= 0 ? "auto" : "none" }}>
                    <motion.div initial={false} animate={{ clipPath: active >= 0 ? `inset(0% 0% 0% 0% round ${p.imageRadius})` : pillClip }} transition={{ ...transition, delay: reduced ? 0 : delay + (active >= 0 ? duration * 0.08 : 0) }}
                        style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: p.imageRadius, background: p.activeFill }}>
                        {selected && <a className="gsa-image-link" href={selected.link || undefined} tabIndex={-1} aria-hidden="true"
                                target={selected.link && selected.newTab ? "_blank" : undefined} rel={selected.newTab ? "noopener noreferrer" : undefined}
                                style={{ cursor: selected.link ? "pointer" : "default" }}>
                            {staticRenderer ? picture(selected, "gsa-image", true) : <ImageWipe items={items} index={selectedIndex} transition={transition} reduced={reduced} renderImage={picture} />}
                        </a>}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    </div>
}

GlideStepAccordion.defaultProps = defaults
addPropertyControls(GlideStepAccordion, {
    items: { type: ControlType.Array, title: "Steps", maxCount: 12, defaultValue: defaultItems, control: { type: ControlType.Object, controls: {
        title: { type: ControlType.String, title: "Title", defaultValue: "New step" },
        description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "Add a short description of this step." },
        label: { type: ControlType.String, title: "Link Label", defaultValue: "Explore" },
        image: { type: ControlType.ResponsiveImage, title: "Image" },
        link: { type: ControlType.Link, title: "Destination", defaultValue: "" },
        newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
    } } },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: defaults.titleFont },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: defaults.bodyFont },
    button: { type: ControlType.Object, title: "Button", buttonTitle: "Appearance", icon: "color", controls: {
        visible: { type: ControlType.Boolean, title: "Visible", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
        font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: defaults.button.font },
        fill: { type: ControlType.Color, title: "Fill", defaultValue: defaults.button.fill },
        text: { type: ControlType.Color, title: "Text", defaultValue: defaults.button.text },
        border: { type: ControlType.Border, title: "Border", defaultValue: defaults.button.border },
        radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: defaults.button.radius },
        padding: { type: ControlType.Padding, title: "Padding", defaultValue: defaults.button.padding },
        gap: { type: ControlType.Gap, title: "Gap", defaultValue: defaults.button.gap },
        shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: defaults.button.shadow },
        icon: { type: ControlType.Boolean, title: "Arrow", defaultValue: false, enabledTitle: "Show", disabledTitle: "Hide" },
        iconSize: { type: ControlType.Number, title: "Arrow Size", defaultValue: 16, min: 12, max: 24, step: 1, unit: "px" },
        separator: { type: ControlType.Boolean, title: "Separator", defaultValue: false, enabledTitle: "Show", disabledTitle: "Hide" },
        spacing: { type: ControlType.Number, title: "Top Space", defaultValue: 16, min: 0, max: 80, step: 1, unit: "px" },
    } },
    text: { type: ControlType.Color, title: "Text", defaultValue: defaults.text },
    muted: { type: ControlType.Color, title: "Secondary", defaultValue: defaults.muted },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: defaults.accent },
    activeFill: { type: ControlType.Color, title: "Active Fill", defaultValue: defaults.activeFill },
    line: { type: ControlType.Color, title: "Dividers", defaultValue: defaults.line },
    padding: { type: ControlType.Padding, title: "Row Padding", defaultValue: defaults.padding },
    radius: { type: ControlType.BorderRadius, title: "Row Radius", defaultValue: defaults.radius },
    imageRadius: { type: ControlType.BorderRadius, title: "Image Radius", defaultValue: defaults.imageRadius },
    gap: { type: ControlType.Gap, title: "Gap", defaultValue: defaults.gap },
    imageRatio: { type: ControlType.Number, title: "Image Ratio", defaultValue: 1.45, min: 0.6, max: 2.5, step: 0.05 },
    showNumbers: { type: ControlType.Boolean, title: "Numbers", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showHeaderArrow: { type: ControlType.Boolean, title: "Header Arrow", defaultValue: false, enabledTitle: "Show", disabledTitle: "Hide" },
    previewStep: { type: ControlType.Number, title: "Editor Step", defaultValue: 1, min: 0, max: 12, step: 1, displayStepper: true, description: "Canvas, exports and thumbnails only. 0 closes all steps. Desktop previews and live sites start closed." },
    motion: { type: ControlType.Transition, title: "Motion", defaultValue: defaults.motion, description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)" },
})
