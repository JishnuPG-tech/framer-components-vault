import { useEffect, useId, useRef, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface QuoteItem {
    quote: string
    name: string
    role: string
}

interface QuoteDeckProps {
    items: QuoteItem[]
    paper: string
    fog: string
    cobalt: string
    ink: string
    muted: string
    line: string
    onCobalt: string
    onCobaltMuted: string
    quoteFont?: CSSProperties
    nameFont?: CSSProperties
    label: string
    cursorLabel: string
    showCursor: boolean
    drift: number
    wheel: boolean
    radius: number
    style?: CSSProperties
}

/**
 * Quote Deck: an endless, draggable row of testimonial cards. Cards overlap, sit on a zig-zag and are
 * slightly tilted; the row drifts on its own, follows the wheel while in view, can be dragged (or moved
 * with the arrow keys) and snaps to the nearest card on release. The faster it moves, the more the cards lean.
 *
 * Self-contained: it only reads and writes its own elements. Window listeners and the animation loop run
 * only while the deck is in or near the viewport; pointer-up listeners only during a drag.
 * Card size follows the component's own width (container queries), not the window.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 620
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function QuoteDeck(props: QuoteDeckProps) {
    const {
        items = DEFAULT_ITEMS,
        paper = "#FFFFFF",
        fog = "#F6F6F6",
        cobalt = "#0C388D",
        ink = "#252320",
        muted = "#77736D",
        line = "#E4E2DE",
        onCobalt = "#FFFFFF",
        onCobaltMuted = "rgba(255,255,255,0.68)",
        quoteFont,
        nameFont,
        label = "Client testimonials",
        cursorLabel = "Drag",
        showCursor = true,
        drift = 0.5,
        wheel = true,
        radius = 0,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const cursorRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const nudge = useRef<(dir: number) => void>(() => {})
    // per-instance class prefix, so two decks on one page never share styles
    const uid = "qd" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const source = items && items.length ? items : DEFAULT_ITEMS
    // repeat until there are enough cards to cover any screen with room to wrap
    const cards: QuoteItem[] = []
    while (cards.length < 10) cards.push(...source)

    const C = {
        paper: color(paper, "#FFFFFF"),
        fog: color(fog, "#F6F6F6"),
        cobalt: color(cobalt, "#0C388D"),
        ink: color(ink, "#252320"),
        muted: color(muted, "#77736D"),
        line: color(line, "#E4E2DE"),
        onCobalt: color(onCobalt, "#FFFFFF"),
        onCobaltMuted: color(onCobaltMuted, "rgba(255,255,255,0.68)"),
    }

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const root = rootRef.current
        if (!root) return
        const els = cardRefs.current.filter((e): e is HTMLDivElement => !!e)
        if (!els.length) return
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches
        const n = els.length
        const rots = els.map((_, i) => baseRot(i))

        let step = 0 // distance between card origins
        let total = 0 // loop length
        let cardW = 0
        let startX = 0
        const layout = () => {
            cardW = els[0].offsetWidth
            step = cardW * 0.75 // 25% overlap
            total = step * n
            startX = (root.offsetWidth - cardW) / 2 - step * 2
        }

        let pos = 0 // target position (px)
        const lag = [0, 0, 0] // three slightly different followers → cards move a touch out of sync
        const rates = [0.09, 0.1, 0.11]
        let inView = false
        let raf = 0
        let last = 0
        let dragging = false
        let downX = 0
        let downY = 0
        let downPos = 0
        let axis: "" | "x" | "y" = ""

        // wrap a card's offset into [-2 steps, loop - 2 steps) so cards re-enter seamlessly
        const wrap = (v: number) => {
            const min = -step * 2
            return ((((v - min) % total) + total) % total) + min
        }
        const paint = () => {
            const tilt0 = (lag[0] - pos) * 0.03
            const tilt = Math.sign(tilt0) * 10 * (1 - Math.exp(-Math.abs(tilt0) / 10))
            for (let i = 0; i < n; i++) {
                const x = startX + wrap(i * step - lag[i % 3])
                els[i].style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) rotate(${(rots[i] + tilt).toFixed(3)}deg)`
            }
        }
        const moving = () => !reduce && drift > 0
        const tick = (t: number) => {
            raf = 0
            if (!inView) return
            const ratio = last ? Math.min(3, (t - last) / 16.667) : 1
            last = t
            if (!dragging && moving()) pos += drift * ratio
            let settled = true
            for (let g = 0; g < 3; g++) {
                lag[g] += (pos - lag[g]) * Math.min(1, rates[g] * ratio)
                if (Math.abs(pos - lag[g]) > 0.05) settled = false
            }
            paint()
            // keep running while drifting / dragging / catching up; sleep once everything has settled
            if (dragging || moving() || !settled) raf = requestAnimationFrame(tick)
            else last = 0
        }
        const kick = () => {
            if (inView && !raf) raf = requestAnimationFrame(tick)
        }
        const snap = () => {
            pos = Math.round(pos / step) * step
            kick()
        }
        nudge.current = (dir: number) => {
            pos = (Math.round(pos / step) + dir) * step
            kick()
        }

        // ---- input (window listeners only while in view; pointer-up only during a drag)
        const onWheel = (e: WheelEvent) => {
            pos += e.deltaY * 0.5
            kick()
        }
        const onMove = (e: PointerEvent) => {
            if (cursorRef.current && fine) {
                const r = root.getBoundingClientRect()
                cursorRef.current.style.transform = `translate3d(${(e.clientX - r.left).toFixed(1)}px, ${(e.clientY - r.top).toFixed(1)}px, 0) translate(-50%, -50%) scale(${dragging ? 0.8 : 1})`
            }
            if (!dragging) return
            const dx = e.clientX - downX
            const dy = e.clientY - downY
            if (!axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
            if (axis === "y" && e.pointerType !== "mouse") {
                endDrag(false)
                return
            }
            if (axis === "x") {
                pos = downPos - dx * (e.pointerType === "mouse" ? 2 : 1.6)
                kick()
            }
        }
        const onUp = () => endDrag(true)
        const endDrag = (doSnap: boolean) => {
            if (!dragging) return
            dragging = false
            delete root.dataset.dragging
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
            if (doSnap) snap()
        }
        const onDown = (e: PointerEvent) => {
            if (e.button !== 0) return
            dragging = true
            axis = ""
            downX = e.clientX
            downY = e.clientY
            downPos = pos
            root.dataset.dragging = "1"
            window.addEventListener("pointerup", onUp)
            window.addEventListener("pointercancel", onUp)
            kick()
        }
        const onEnter = () => (root.dataset.hover = "1")
        const onLeave = () => {
            delete root.dataset.hover
            endDrag(true)
        }

        let listening = false
        const listen = (on: boolean) => {
            if (on === listening) return
            listening = on
            const m = on ? "addEventListener" : "removeEventListener"
            if (wheel) window[m]("wheel", onWheel as EventListener, { passive: true } as AddEventListenerOptions)
            window[m]("pointermove", onMove as EventListener, { passive: true } as AddEventListenerOptions)
        }

        layout()
        lag[0] = lag[1] = lag[2] = pos
        paint()
        root.dataset.ready = "1"

        const io = new IntersectionObserver(
            ([entry]) => {
                if (!entry) return
                inView = entry.isIntersecting
                listen(inView)
                if (inView) {
                    root.dataset.seen = "1"
                    kick()
                } else {
                    endDrag(false)
                    cancelAnimationFrame(raf)
                    raf = 0
                    last = 0
                }
            },
            { rootMargin: "100px 0px" }
        )
        io.observe(root)
        // own size only: re-layout when the component itself resizes
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => {
                      layout()
                      paint()
                  })
                : null
        ro?.observe(root)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointerenter", onEnter)
        root.addEventListener("pointerleave", onLeave)
        return () => {
            cancelAnimationFrame(raf)
            io.disconnect()
            ro?.disconnect()
            listen(false)
            endDrag(false)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointerenter", onEnter)
            root.removeEventListener("pointerleave", onLeave)
            nudge.current = () => {}
        }
    }, [isStatic, cards.length, drift, wheel])

    const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            nudge.current(1)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            nudge.current(-1)
        }
    }

    // no quotes or ">" in this CSS: React escapes them inside <style> when the page is pre-rendered
    const r = `.${uid}`
    const css = `
${r}{container-type:inline-size;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none;outline:none}
${r}[data-dragging]{cursor:grabbing}
${r}:focus-visible{box-shadow:inset 0 0 0 2px ${C.cobalt}}
${showCursor ? `@media (hover:hover) and (pointer:fine){${r}{cursor:none}${r}[data-dragging]{cursor:none}}` : ""}
${r} .qd-stage{position:absolute;inset:0;--qd-w:420px;--qd-zig:110px;--qd-pad:76px 48px 76px;--qd-q:22px;--qd-mark:24px;--qd-mt:28px}
@container (max-width:1099px){${r} .qd-stage{--qd-w:360px;--qd-zig:80px;--qd-pad:64px 38px 64px;--qd-q:19px;--qd-mark:20px;--qd-mt:24px}}
@container (max-width:699px){${r} .qd-stage{--qd-w:280px;--qd-zig:56px;--qd-pad:52px 26px 52px;--qd-q:16px;--qd-mark:16px;--qd-mt:20px}}
${r} .qd-card{position:absolute;left:0;top:50%;width:var(--qd-w);will-change:transform}
${r} .qd-inner{position:relative;padding:var(--qd-pad);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:28px;text-align:center;border-radius:${Math.max(0, radius)}px;transition:opacity .9s cubic-bezier(.16,1,.3,1),transform 1.2s cubic-bezier(.16,1,.3,1)}
${r}[data-ready]:not([data-seen]) .qd-inner{opacity:0;transform:translate3d(0,64px,0)}
${r} .qd-quote{margin:0;font-size:var(--qd-q);line-height:1.38;letter-spacing:-0.012em;font-weight:400;text-wrap:pretty}
${r} .qd-by{display:flex;flex-direction:column;align-items:center;gap:4px}
${r} .qd-name{font-size:15px;line-height:1.3;font-weight:600;letter-spacing:-0.005em}
${r} .qd-role{font-size:13px;line-height:1.3;letter-spacing:0.01em}
${r} .qd-mark{position:absolute;height:var(--qd-mark);width:auto}
${r} .qd-cursor{position:absolute;left:0;top:0;width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;transition:opacity .3s ease,transform .18s cubic-bezier(.16,1,.3,1);z-index:50;font-size:13px;letter-spacing:0.02em}
${r}[data-hover] .qd-cursor{opacity:1}
@media not all and (hover:hover){${r} .qd-cursor{display:none}}
@media (prefers-reduced-motion:reduce){${r} .qd-inner{transition:none}}
`
    // fonts: family / weight / style come from the controls; sizes stay responsive (set in the CSS above)
    const qf = fontFace(quoteFont)
    const nf = fontFace(nameFont)

    return (
        <div
            ref={rootRef}
            className={uid}
            tabIndex={isStatic ? undefined : 0}
            onKeyDown={isStatic ? undefined : onKey}
            role="region"
            aria-roledescription="carousel"
            aria-label={label || "Client testimonials"}
            style={{ ...style, position: "relative", width: "100%", height: "100%", overflow: "hidden", isolation: "isolate", fontFamily: "system-ui, sans-serif", ...qf }}
        >
            <style>{css}</style>
            <div className="qd-stage">
                {cards.map((c, i) => {
                    const kind = i % 3 // 0 fog, 1 paper, 2 accent
                    const bg = kind === 0 ? C.fog : kind === 1 ? C.paper : C.cobalt
                    const fg = kind === 2 ? C.onCobalt : C.ink
                    const sub = kind === 2 ? C.onCobaltMuted : C.muted
                    const mark = kind === 2 ? C.onCobalt : C.cobalt
                    const zig = i % 2 === 0 ? "calc(var(--qd-zig) * -1)" : "var(--qd-zig)"
                    const copy = i >= source.length
                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                cardRefs.current[i] = el
                            }}
                            className="qd-card"
                            aria-hidden={copy ? true : undefined}
                            style={{
                                marginTop: zig,
                                zIndex: i,
                                // server/canvas layout matches the live start: third card centred, 25% overlap
                                left: "calc(50% - var(--qd-w) * 2)",
                                transform: `translate3d(calc(var(--qd-w) * ${0.75 * i}),0,0) rotate(${baseRot(i)}deg)`,
                                translate: "0 -50%",
                            }}
                        >
                            <figure
                                className="qd-inner"
                                style={{
                                    margin: 0,
                                    background: bg,
                                    // every light card gets the hairline, so cards stay readable on any background
                                    boxShadow: kind !== 2 ? `inset 0 0 0 1px ${C.line}` : "none",
                                    transitionDelay: `${(i % 5) * 0.08}s`,
                                }}
                            >
                                <QuoteMark color={mark} style={{ top: "var(--qd-mt)", left: "var(--qd-mt)" }} />
                                <QuoteMark color={mark} flip style={{ bottom: "var(--qd-mt)", right: "var(--qd-mt)" }} />
                                <blockquote className="qd-quote" style={{ color: fg, ...qf }}>
                                    {c.quote}
                                </blockquote>
                                <figcaption className="qd-by">
                                    <span className="qd-name" style={{ color: fg, ...nf }}>
                                        {c.name}
                                    </span>
                                    <span className="qd-role" style={{ color: sub }}>
                                        {c.role}
                                    </span>
                                </figcaption>
                            </figure>
                        </div>
                    )
                })}
            </div>
            {showCursor && !isStatic ? (
                <div ref={cursorRef} className="qd-cursor" style={{ background: C.cobalt, color: C.onCobalt }} aria-hidden="true">
                    {cursorLabel}
                </div>
            ) : null}
        </div>
    )
}

// a colour style can be missing after copying between projects: give bare var(--token-…) values a fallback
function color(v: string | undefined, fallback: string) {
    if (!v) return fallback
    const m = /^var\((--[\w-]+)\)$/.exec(v.trim())
    return m ? `var(${m[1]}, ${fallback})` : v
}

// keep only the face of a Font control value (family, weight, style); sizes are responsive in the CSS
function fontFace(f?: CSSProperties): CSSProperties {
    if (!f) return {}
    const out: CSSProperties = {}
    if (f.fontFamily) out.fontFamily = f.fontFamily
    if (f.fontWeight) out.fontWeight = f.fontWeight
    if (f.fontStyle) out.fontStyle = f.fontStyle
    return out
}

// deterministic tilt (same on server and client): alternate sides, 2°–5°
function baseRot(i: number) {
    const mag = 2 + ((i * 37) % 31) / 10
    return i % 2 === 0 ? -mag : mag
}

function QuoteMark({ color, flip, style }: { color: string; flip?: boolean; style?: CSSProperties }) {
    return (
        <svg className="qd-mark" viewBox="0 0 28 24" aria-hidden="true" style={{ ...style, transform: flip ? "rotate(180deg)" : undefined }}>
            <path
                fill={color}
                d="M0 24V14.4C0 6.6 3.9 1.8 11.4 0l1.3 3C8.6 4.5 6.6 7.4 6.4 11.4H12V24H0Zm16 0V14.4C16 6.6 19.9 1.8 27.4 0l1.3 3c-4.1 1.5-6.1 4.4-6.3 8.4H28V24H16Z"
            />
        </svg>
    )
}

const DEFAULT_ITEMS: QuoteItem[] = [
    { quote: "Studiox understood our business faster than agencies we had worked with for years. The new brand finally sounds like us.", name: "Priya Nair", role: "Marketing Director, Halyard" },
    { quote: "Our new website doubled enquiries in the first quarter — and our team actually enjoys updating it.", name: "Daniel Brooks", role: "Founder, Assay" },
    { quote: "Calm, senior and refreshingly honest. They pushed back when it mattered, and the work is better for it.", name: "Sofia Marín", role: "Head of Brand, Lumen" },
    { quote: "Six weeks from first call to launch, without a single late night on our side. That never happens.", name: "Tomás Reyes", role: "COO, Northfold" },
    { quote: "They gave us a system, not just a logo. Two years on, every new page still feels like it belongs.", name: "Hannah Okafor", role: "Creative Lead, Verra" },
    { quote: "The campaign landed in a crowded market and still got people talking. Clear thinking, beautifully made.", name: "Jonas Lindqvist", role: "CMO, Fieldnote" },
]

addPropertyControls(QuoteDeck, {
    items: {
        type: ControlType.Array,
        title: "Quotes",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                quote: { type: ControlType.String, title: "Quote", displayTextArea: true, defaultValue: "A short, honest sentence about working together." },
                name: { type: ControlType.String, title: "Name", defaultValue: "Client Name" },
                role: { type: ControlType.String, title: "Role", defaultValue: "Role, Company" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    fog: { type: ControlType.Color, title: "Card 1", defaultValue: "#F6F6F6" },
    paper: { type: ControlType.Color, title: "Card 2", defaultValue: "#FFFFFF" },
    cobalt: { type: ControlType.Color, title: "Accent", defaultValue: "#0C388D" },
    ink: { type: ControlType.Color, title: "Text", defaultValue: "#252320" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#77736D" },
    line: { type: ControlType.Color, title: "Hairline", defaultValue: "#E4E2DE" },
    onCobalt: { type: ControlType.Color, title: "On Accent", defaultValue: "#FFFFFF" },
    onCobaltMuted: { type: ControlType.Color, title: "On Accent Muted", defaultValue: "rgba(255,255,255,0.68)" },
    quoteFont: { type: ControlType.Font, title: "Quote Font", controls: "basic", defaultFontType: "sans-serif" },
    nameFont: { type: ControlType.Font, title: "Name Font", controls: "basic", defaultFontType: "sans-serif" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 0, min: 0, max: 64, step: 1, unit: "px" },
    drift: { type: ControlType.Number, title: "Drift", description: "Auto-scroll speed (0 = still).", defaultValue: 0.5, min: 0, max: 3, step: 0.1 },
    wheel: { type: ControlType.Boolean, title: "Wheel", description: "The deck follows the mouse wheel while in view.", defaultValue: true },
    showCursor: { type: ControlType.Boolean, title: "Own Cursor", defaultValue: true },
    cursorLabel: { type: ControlType.String, title: "Cursor", defaultValue: "Drag", hidden: (p: Partial<QuoteDeckProps>) => !p.showCursor },
    label: { type: ControlType.String, title: "Label", description: "Screen-reader name of the deck.", defaultValue: "Client testimonials" },
})
