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


// Copyright AL Webdesign Studio · https://alwebdesignstudio.com/
interface ImageValue { src?: string; url?: string; srcSet?: string; alt?: string }
interface Photograph { image?: ImageValue; portrait?: ImageValue; alt?: string; portraitAlt?: string; focusX?: number; focusY?: number; portraitX?: number; portraitY?: number }
interface Props {
    photographs?: Photograph[]; wordmark?: string; wordFont?: React.CSSProperties; textColor?: string; lineColor?: string; background?: string
    lineWidth?: number; lineGap?: number; rise?: number; introSpeed?: number; fadeDuration?: number; holdDuration?: number; loop?: boolean
    reducedMotion?: boolean; fullViewport?: boolean; showReload?: boolean; reloadLabel?: string; showLibrary?: boolean; libraryLink?: string; price?: string; style?: React.CSSProperties
}
const DEMO: Photograph[] = [
    {
        "image": {
            "src": "https://framerusercontent.com/images/ytOErIu91DR7nKr1B3FvbwyUCE.webp"
        },
        "portrait": {
            "src": "https://framerusercontent.com/images/NTcxq85mZuKJTs5HYlFONahGC9s.webp"
        },
        "alt": "Sleeping newborn in a dark green wrap in a wooden basket",
        "portraitAlt": "Sleeping newborn in a circular floral hanging basket",
        "focusX": 50,
        "focusY": 50,
        "portraitX": 50,
        "portraitY": 50
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/uRNJe6FKWcoaAqjpVLcAIUoNP00.webp"
        },
        "portrait": {
            "src": "https://framerusercontent.com/images/MbrB1JkH6YRsxyQATSS7Q2JlZo.webp"
        },
        "alt": "Sleeping newborn in grey fabric surrounded by leaves",
        "portraitAlt": "Sleeping baby with hands beside the face in a knitted wrap",
        "focusX": 50,
        "focusY": 50,
        "portraitX": 50,
        "portraitY": 50
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/Lps6kIe2Yk3Wa8KbjxNeu6A4c.webp"
        },
        "portrait": {
            "src": "https://framerusercontent.com/images/PazX3KV5AgAFFfGOkPUNP0S8.webp"
        },
        "alt": "Sleeping newborn in a cream hood supported by an adult hand",
        "portraitAlt": "Sleeping newborn in a striped outfit and pompom hat",
        "focusX": 50,
        "focusY": 50,
        "portraitX": 100,
        "portraitY": 50
    },
    {
        "image": {
            "src": "https://framerusercontent.com/images/MzxDZv5DbLFaB3VoRowP4pxd89Q.webp"
        },
        "portrait": {
            "src": "https://framerusercontent.com/images/8DHNW0O3XrahiIx8pKYBgF1CP0A.webp"
        },
        "alt": "Smiling baby nestled in a blue fabric swing",
        "portraitAlt": "Sleeping baby sitting on a small wooden swing",
        "focusX": 50,
        "focusY": 50,
        "portraitX": 50,
        "portraitY": 50
    }
]
const src = (image?: ImageValue) => image?.src || image?.url || ""
const clamp = (x: number) => Math.max(0, Math.min(1, x))
const expo = (t: number) => t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t))
const smooth = (t: number) => { const p = clamp(t); return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2 }
const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.92)", border: "1px solid rgba(0,0,0,.13)", borderRadius: 24, boxShadow: "0 2px 8px rgba(0,0,0,.04)", color: "#62615E" }
const css = `
[data-al-hairline] *{box-sizing:border-box}
[data-al-hairline]:focus{outline:none}
[data-al-hairline][data-keyboard=true]:has(.al-hl-next:focus-visible) .al-hl-focus{opacity:1}
[data-al-hairline] a:focus-visible,[data-al-hairline] button:focus-visible{outline:2px solid #62615e;outline-offset:4px}
[data-al-hairline] .al-hl-next:focus-visible{outline:none}
[data-al-hairline] .al-hl-mark{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:76px 24px 90px;text-align:center}
[data-al-hairline] h1{font-size:clamp(20px,2.1cqw,var(--hl-font-size));font-weight:400;line-height:1.5;letter-spacing:.25em;text-indent:.25em;text-transform:uppercase;max-width:100%;overflow-wrap:anywhere;margin:0}
[data-al-hairline] .al-hl-line{height:1px;max-width:80%;transform-origin:center}
[data-al-hairline] .al-hl-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;user-select:none;-webkit-user-drag:none;pointer-events:none}
[data-al-hairline] .al-hl-portrait{display:none}
[data-al-hairline][data-portrait=true] .al-hl-landscape{display:none}
[data-al-hairline][data-portrait=true] .al-hl-portrait{display:block}
[data-al-hairline] .al-hl-focus{position:absolute;bottom:84px;left:50%;transform:translateX(-50%);width:72px;height:2px;background:rgba(255,255,255,.9);box-shadow:0 1px 3px rgba(0,0,0,.4);opacity:0;pointer-events:none;z-index:3}
`
/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ALHairlineLoader(props: Props) {
    const { photographs = DEMO, wordmark = "SWEET DREAMS", wordFont, textColor = "#8A847B", lineColor = "#B8B1A8", background = "#FBFAF7", lineWidth = 160, lineGap = 18, rise = 8, introSpeed = 1, fadeDuration = 1.3, holdDuration = 2.5, loop = false, reducedMotion = false, fullViewport = true, showReload = true, reloadLabel = "Restart animation", showLibrary = false, libraryLink = "/", price = "Free", style } = props
    const photoKey = JSON.stringify(photographs)
    const photos = React.useMemo(() => (photographs.length ? photographs : DEMO).slice(0, 20).map((p, i) => ({ image: src(p.image) ? p.image! : DEMO[i % DEMO.length].image!, portrait: src(p.portrait) ? p.portrait! : src(p.image) ? p.image! : DEMO[i % DEMO.length].portrait!, alt: p.alt ?? p.image?.alt ?? DEMO[i % DEMO.length].alt ?? "", portraitAlt: p.portraitAlt ?? p.portrait?.alt ?? p.alt ?? DEMO[i % DEMO.length].portraitAlt ?? "", focusX: p.focusX ?? 50, focusY: p.focusY ?? 50, portraitX: p.portraitX ?? DEMO[i % DEMO.length].portraitX ?? 50, portraitY: p.portraitY ?? 50 })), [photoKey])
    const [run, setRun] = React.useState({ index: 0, id: 0 })
    const current = photos[run.index % photos.length], isStatic = useIsStaticRenderer(), uid = React.useId().replace(/:/g, "")
    const hostRef = React.useRef<HTMLElement>(null), markRef = React.useRef<HTMLDivElement>(null), wordRef = React.useRef<HTMLHeadingElement>(null), lineRef = React.useRef<HTMLDivElement>(null), photoRef = React.useRef<HTMLDivElement>(null)
    const landscapeRef = React.useRef<HTMLImageElement>(null), portraitRef = React.useRef<HTMLImageElement>(null), finishRef = React.useRef<() => void>(() => {})
    const replayRef = React.useRef<() => void>(() => {})
    const play = React.useCallback((direction = 1) => setRun(previous => ({ index: (previous.index + direction + photos.length) % photos.length, id: previous.id + 1 })), [photos.length])
    replayRef.current = () => play(1)
    React.useEffect(() => {
        const host = hostRef.current, mark = markRef.current, word = wordRef.current, line = lineRef.current, photo = photoRef.current
        if (!host || !mark || !word || !line || !photo) return
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        let systemReduced = media.matches
        let frame = 0, last = 0, elapsed = 0, revealAt: number | null = null, disposed = false, visible = true, fontReady = false, finished = false, skip = false
        let fontTimer = 0, assetTimer = 0, assetTimedOut = false
        const imageReady = [false, false], imageFailed = [false, false], listeners: Array<() => void> = []
        const reduced = () => reducedMotion || systemReduced
        const speed = Math.max(.25, introSpeed), introEnd = 2.25 / speed
        const selected = () => host.dataset.portrait === "true" ? 1 : 0
        const phase = (value: string) => { host.dataset.phase = value }
        const paint = (dt: number) => {
            if (isStatic) { word.style.opacity = "1"; word.style.transform = "none"; line.style.transform = "none"; photo.style.opacity = "1"; mark.style.visibility = "hidden"; phase("still"); finished = true; return }
            elapsed += dt
            const index = selected(), ready = imageReady[index] || assetTimedOut
            const quiet = reduced()
            const wordP = quiet || skip ? 1 : expo((elapsed - .15 / speed) / (1.5 / speed))
            const lineP = quiet || skip ? 1 : expo((elapsed - .35 / speed) / (1.9 / speed))
            word.style.opacity = String(wordP); word.style.transform = `translateY(${rise * (1 - wordP)}px)`
            line.style.transform = `scaleX(${lineP})`
            if (revealAt === null && ready && (skip || elapsed >= (quiet ? 0 : introEnd))) revealAt = elapsed + (skip ? 0 : quiet ? 1 : .2)
            if (imageFailed[index] || assetTimedOut && !imageReady[index]) {
                phase("unavailable"); photo.style.opacity = "0"; mark.style.visibility = "visible"; word.style.opacity = "1"; word.style.transform = "none"; line.style.transform = "scaleX(1)"; finished = true; return
            }
            const progress = revealAt === null ? 0 : skip ? 1 : quiet ? clamp((elapsed - revealAt) / .4) : smooth((elapsed - revealAt) / Math.max(.1, fadeDuration))
            photo.style.opacity = String(progress)
            mark.style.visibility = progress >= 1 ? "hidden" : "visible"
            phase(progress >= 1 ? "complete" : progress > 0 ? "reveal" : "intro")
            if (progress >= 1) {
                if (!loop || quiet || skip) finished = true
                else if (revealAt !== null && elapsed >= revealAt + fadeDuration + holdDuration) { finished = true; play(1) }
            }
        }
        const cancel = () => { cancelAnimationFrame(frame); frame = 0; host.dataset.running = "false" }
        const tick = (now: number) => {
            frame = 0
            if (disposed || !visible || document.hidden || !fontReady || finished) { cancel(); return }
            paint(Math.min(.1, Math.max(0, (now - last) / 1000))); last = now
            if (!finished) { host.dataset.running = "true"; frame = requestAnimationFrame(tick) } else cancel()
        }
        const wake = () => {
            if (disposed) return
            if (!visible || document.hidden || !fontReady || finished) { cancel(); return }
            if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); host.dataset.running = "true" }
        }
        const resize = () => {
            const old = host.dataset.portrait
            host.dataset.portrait = String(host.clientWidth / Math.max(1, host.clientHeight) < .9)
            if (old !== host.dataset.portrait && finished && !imageFailed[selected()]) { photo.style.opacity = "1"; mark.style.visibility = "hidden" }
        }
        const motion = (event: MediaQueryListEvent) => { systemReduced = event.matches; if (reduced()) { skip = true; finished = false; paint(0); wake() } }
        const observer = new IntersectionObserver(entries => { visible = !!entries[0]?.isIntersecting; wake() }), sizeObserver = new ResizeObserver(resize)
        observer.observe(host); sizeObserver.observe(host); resize()
        phase(isStatic ? "still" : "intro"); mark.style.visibility = isStatic ? "hidden" : "visible"; photo.style.opacity = isStatic ? "1" : "0"; word.style.opacity = "0"; line.style.transform = "scaleX(0)"
        const keyboardEntry = (event: KeyboardEvent) => { if (event.key === "Tab") host.dataset.keyboard = "true" }
        document.addEventListener("keydown", keyboardEntry, true); document.addEventListener("visibilitychange", wake); media.addEventListener("change", motion)
        finishRef.current = () => { skip = true; finished = false; paint(0); wake() }
        ;[landscapeRef.current, portraitRef.current].forEach((image, i) => {
            if (!image) { imageFailed[i] = true; return }
            const loaded = () => { image.decode().catch(() => {}).then(() => { if (disposed) return; imageReady[i] = true; imageFailed[i] = false; wake() }) }
            const failed = () => { imageReady[i] = true; imageFailed[i] = true; wake() }
            if (image.complete) { image.naturalWidth ? loaded() : failed(); return }
            image.addEventListener("load", loaded); image.addEventListener("error", failed)
            listeners.push(() => { image.removeEventListener("load", loaded); image.removeEventListener("error", failed) })
        })
        assetTimer = window.setTimeout(() => { assetTimedOut = true; wake() }, 15000)
        Promise.race([document.fonts.ready, new Promise<void>(resolve => { fontTimer = window.setTimeout(resolve, 1500) })]).then(() => {
            clearTimeout(fontTimer)
            if (!disposed) { fontReady = true; paint(0); wake() }
        })
        if (isStatic) paint(0)
        return () => { disposed = true; cancel(); clearTimeout(fontTimer); clearTimeout(assetTimer); listeners.forEach(remove => remove()); observer.disconnect(); sizeObserver.disconnect(); document.removeEventListener("keydown", keyboardEntry, true); document.removeEventListener("visibilitychange", wake); media.removeEventListener("change", motion); finishRef.current = () => {} }
    }, [run.id, current, isStatic, reducedMotion, introSpeed, fadeDuration, holdDuration, loop, rise, play])
    return <section ref={hostRef} data-al-hairline="" data-al-demo-viewport={fullViewport && showLibrary && !isStatic ? "true" : undefined} data-keyboard="false" data-phase="still" data-running="false" data-photo={run.index % photos.length} role="region" aria-label="Hairline Loader" onPointerDown={e => { e.currentTarget.dataset.keyboard = "false" }} onKeyDownCapture={e => { e.currentTarget.dataset.keyboard = "true" }} style={{ ...style, position: "relative", width: style?.width || "100%", height: fullViewport ? isStatic ? 900 : "100dvh" : style?.height || "100%", minHeight: fullViewport ? undefined : 240, overflow: "hidden", outline: "none", WebkitTapHighlightColor: "transparent", touchAction: fullViewport ? "pinch-zoom" : "auto", overscrollBehavior: "none", background, color: textColor, fontFamily: "Arial, sans-serif", cursor: "pointer", containerType: "inline-size", "--hl-font-size": wordFont?.fontSize || "32px" } as React.CSSProperties}>
        <style>{css}</style>
        <div ref={markRef} className="al-hl-mark"><h1 ref={wordRef} style={{ ...wordFont, fontSize: undefined }}>{wordmark || "SWEET DREAMS"}</h1><div ref={lineRef} className="al-hl-line" aria-hidden="true" style={{ width: lineWidth, marginTop: lineGap, background: lineColor }}/></div>
        <div ref={photoRef} style={{ position: "absolute", inset: 0, opacity: 1 }}><img ref={landscapeRef} className="al-hl-photo al-hl-landscape" src={src(current.image)} srcSet={current.image.srcSet} sizes="100vw" alt={current.alt} style={{ objectPosition: `${current.focusX}% ${current.focusY}%` }} draggable={false} decoding="async"/><img ref={portraitRef} className="al-hl-photo al-hl-portrait" src={src(current.portrait)} srcSet={current.portrait.srcSet} sizes="100vw" alt={current.portraitAlt} style={{ objectPosition: `${current.portraitX}% ${current.portraitY}%` }} draggable={false} decoding="async"/></div>
        <button className="al-hl-next" type="button" aria-label="Reveal next photograph" aria-describedby={`${uid}-help`} onClick={() => play(1)} onKeyDown={e => { if (["ArrowRight", "ArrowLeft", "Escape"].includes(e.key)) e.preventDefault(); if (e.key === "ArrowRight") play(1); else if (e.key === "ArrowLeft") play(-1); else if (e.key === "Escape") finishRef.current() }} style={{ position: "absolute", inset: 0, zIndex: 2, width: "100%", height: "100%", margin: 0, padding: 0, border: 0, background: "transparent", cursor: "pointer" }}/>
        <span className="al-hl-focus" aria-hidden="true"/>
        <span id={`${uid}-help`} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>Click or press Enter to reveal the next photograph. Left arrow returns to the previous photograph. Escape finishes the reveal.</span>
        {showReload && <button type="button" aria-label={reloadLabel} title={reloadLabel} onClick={() => replayRef.current()} style={{ ...pill, position: "absolute", right: 16, top: "max(16px,env(safe-area-inset-top))", width: 68, height: 44, padding: 0, cursor: "pointer", zIndex: 5 }}><svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id={`${uid}-reload-top`} x1="24" y1="8" x2="24" y2="37" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor"/><stop offset=".38" stopColor="currentColor" stopOpacity=".94"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient><linearGradient id={`${uid}-reload-bottom`} x1="24" y1="40" x2="24" y2="11" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor"/><stop offset=".38" stopColor="currentColor" stopOpacity=".94"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path d="M27 8.3A16 16 0 0 1 35.3 35.3" stroke={`url(#${uid}-reload-top)`} strokeWidth="4.5"/><path d="M21 39.7A16 16 0 0 1 12.7 12.7" stroke={`url(#${uid}-reload-bottom)`} strokeWidth="4.5"/><path d="M18 8.3 28 2.3v12Z M30 39.7 20 45.7v-12Z" fill="currentColor"/></svg></button>}
        {showLibrary && <nav aria-label="Library" style={{ ...pill, position: "absolute", left: 20, bottom: "max(20px,env(safe-area-inset-bottom))", height: 38, padding: "0 16px", gap: 14, border: 0, zIndex: 5, fontSize: 14 }}><a href={libraryLink || "/"} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "inherit", textDecoration: "none" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>Library</a><span style={{ fontWeight: 600 }}>{price}</span></nav>}

    </section>
}
addPropertyControls(ALHairlineLoader, {
    photographs: { type: ControlType.Array, title: "Photographs", maxCount: 20, defaultValue: DEMO.map(p => ({ alt: p.alt, portraitAlt: p.portraitAlt, focusX: 50, focusY: 50, portraitX: p.portraitX ?? 50, portraitY: 50 })), control: { type: ControlType.Object, controls: { image: { type: ControlType.ResponsiveImage, title: "Landscape" }, portrait: { type: ControlType.ResponsiveImage, title: "Portrait" }, alt: { type: ControlType.String, title: "Landscape Alt" }, portraitAlt: { type: ControlType.String, title: "Portrait Alt" }, focusX: { type: ControlType.Number, title: "Landscape X", defaultValue: 50, min: 0, max: 100, unit: "%" }, focusY: { type: ControlType.Number, title: "Landscape Y", defaultValue: 50, min: 0, max: 100, unit: "%" }, portraitX: { type: ControlType.Number, title: "Portrait X", defaultValue: 50, min: 0, max: 100, unit: "%" }, portraitY: { type: ControlType.Number, title: "Portrait Y", defaultValue: 50, min: 0, max: 100, unit: "%" } } } },
    wordmark: { type: ControlType.String, title: "Wordmark", defaultValue: "SWEET DREAMS" }, wordFont: { type: ControlType.Font, title: "Wordmark Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "32px", lineHeight: "1.5em", letterSpacing: ".25em" } }, textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#8A847B" }, lineColor: { type: ControlType.Color, title: "Line Color", defaultValue: "#B8B1A8" }, background: { type: ControlType.Color, title: "Background", defaultValue: "#FBFAF7" },
    lineWidth: { type: ControlType.Number, title: "Line Width", defaultValue: 160, min: 40, max: 500, unit: "px" }, lineGap: { type: ControlType.Number, title: "Line Gap", defaultValue: 18, min: 4, max: 80, unit: "px" }, rise: { type: ControlType.Number, title: "Rise", defaultValue: 8, min: 0, max: 40, unit: "px" }, introSpeed: { type: ControlType.Number, title: "Intro Speed", defaultValue: 1, min: .25, max: 3, step: .05 }, fadeDuration: { type: ControlType.Number, title: "Photo Fade", defaultValue: 1.3, min: .1, max: 4, step: .1, unit: "s" }, holdDuration: { type: ControlType.Number, title: "Hold", defaultValue: 2.5, min: 1, max: 20, step: .5, unit: "s", hidden: p => !p.loop }, loop: { type: ControlType.Boolean, title: "Loop", defaultValue: false },
    reducedMotion: { type: ControlType.Boolean, title: "Reduce Motion", defaultValue: false }, fullViewport: { type: ControlType.Boolean, title: "Full Viewport", defaultValue: true }, showReload: { type: ControlType.Boolean, title: "Reload", defaultValue: true }, reloadLabel: { type: ControlType.String, title: "Reload Label", defaultValue: "Restart animation" }, showLibrary: { type: ControlType.Boolean, title: "Demo Navigation", defaultValue: false }, libraryLink: { type: ControlType.Link, title: "Library Link", hidden: p => !p.showLibrary }, price: { type: ControlType.String, title: "Demo Price", defaultValue: "Free", hidden: p => !p.showLibrary },
})
