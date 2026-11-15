// Aperture Reveal for Framer
// Ported from Animata "Aperture Reveal" (MIT License, Copyright (c) Animata)
// https://github.com/codse/animata
// Framer port: no Tailwind, no motion dependency. A headline parts around a pill-shaped
// opening, the image grows out of the opening to fill the screen, then a caption reads in
// word by word. Driven by scroll position; reduced-motion aware; static on the canvas.

import * as React from "react"
import { useEffect, useLayoutEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Props = {
    lead: string
    trail: string
    caption: string
    showButton: boolean
    buttonLabel: string
    buttonLink: string
    hint: string
    showHint: boolean
    image?: { src: string; alt?: string }
    length: number
    background: string
    ink: string
    opening: string
    accent: string
    accentInk: string
    headlineFont: any
    captionFont: any
    canvasProgress: number
    respectReducedMotion: boolean
    style?: React.CSSProperties
}

const DEFAULTS: Omit<Props, "style" | "image"> = {
    lead: "Design that",
    trail: "opens up",
    caption:
        "Every pixel is placed with intent, so your brand reads clearly at every size and on every screen.",
    showButton: true,
    buttonLabel: "Start a project",
    buttonLink: "",
    hint: "Scroll",
    showHint: true,
    length: 3,
    background: "#EBE9E4",
    ink: "#141413",
    opening: "#D6D3CC",
    accent: "#FFCC00",
    accentInk: "#141413",
    headlineFont: { fontFamily: "Inter", fontWeight: 600 },
    captionFont: { fontFamily: "Inter", fontWeight: 500 },
    canvasProgress: 0,
    respectReducedMotion: true,
}

const EXPAND_END = 0.55
const CAPTION_START = 0.6
const CAPTION_END = 0.92
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

function scrollParent(node: HTMLElement | null): HTMLElement | null {
    let el = node?.parentElement ?? null
    while (el && el !== document.body && el !== document.documentElement) {
        const o = getComputedStyle(el).overflowY
        if (o === "auto" || o === "scroll") return el
        el = el.parentElement
    }
    return null
}

const CSS = `
.apr{position:relative;width:100%;container-type:inline-size}
.apr__stage{--e:0;--q:0;--t:50%;--r:50%;--b:50%;--l:50%;--rad:0px;position:sticky;top:0;height:100vh;overflow:hidden;container:stage/size}
.apr__media{position:absolute;inset:0;z-index:1;overflow:hidden;
 clip-path:inset(calc(var(--t)*(1 - var(--e))) calc(var(--r)*(1 - var(--e))) calc(var(--b)*(1 - var(--e))) calc(var(--l)*(1 - var(--e))) round calc(var(--rad)*(1 - var(--e))));will-change:clip-path}
.apr__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transform:scale(calc(1.32 - 0.32*var(--e)));will-change:transform}
.apr__wash{position:absolute;inset:0;opacity:var(--q);background:linear-gradient(to top,rgba(10,10,11,.82),rgba(10,10,11,.35) 55%,rgba(10,10,11,.1))}
.apr__h{pointer-events:none;position:absolute;inset:0;z-index:2;margin:0;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;column-gap:.22em;padding:0 clamp(16px,4cqw,56px);font-size:clamp(2.25rem,6.4cqw,6.25rem);line-height:.95;letter-spacing:-.04em;text-wrap:balance}
.apr__lead,.apr__trail{min-width:0;opacity:calc(1 - var(--e)*1.6);will-change:transform,opacity}
.apr__lead{justify-self:end;text-align:right;transform:translateX(calc(var(--e)*-42cqw))}
.apr__trail{justify-self:start;text-align:left;transform:translateX(calc(var(--e)*42cqw))}
.apr__open{display:block;height:.86em;width:2.1em;border-radius:999px}
.apr__cap{position:absolute;left:0;right:0;bottom:0;z-index:3;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px 48px;padding:clamp(20px,5cqw,64px);color:#F4F2ED;opacity:clamp(0,var(--q)*12,1)}
.apr__text{margin:0;max-width:30em;font-size:clamp(1.125rem,2.7cqw,2.25rem);line-height:1.2;letter-spacing:-.02em;text-wrap:pretty}
.apr__w{--w:clamp(0,(var(--q)*(var(--n) + 4) - var(--i))/4,1);opacity:calc(.16 + .84*var(--w))}
.apr__act{opacity:clamp(0,(var(--q) - .8)*5,1);transform:translateY(calc((1 - clamp(0,(var(--q) - .8)*5,1))*12px))}
.apr__btn{display:inline-flex;align-items:center;min-height:48px;padding:0 24px;border-radius:999px;font-weight:600;font-size:15px;text-decoration:none;white-space:nowrap;cursor:pointer;border:0}
.apr__btn:focus-visible{outline:2px solid #F4F2ED;outline-offset:3px}
.apr__hint{pointer-events:none;position:absolute;bottom:clamp(16px,4cqh,32px);left:50%;z-index:2;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;font:11px/1 ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;opacity:calc(.6 - var(--e)*4)}
.apr__hint::after{content:"";width:1px;height:28px;background:currentColor;animation:apr-hint 1.8s cubic-bezier(.65,0,.35,1) infinite}
@keyframes apr-hint{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}
@container stage (width < 640px){
 .apr__h{grid-template-columns:1fr;grid-template-rows:auto auto auto;align-content:center;justify-items:center;row-gap:.14em;text-align:center;font-size:clamp(2.25rem,12cqw,4.5rem)}
 .apr__lead,.apr__trail{justify-self:center;text-align:center}
 .apr__lead{transform:translateY(calc(var(--e)*-44cqh))}
 .apr__trail{transform:translateY(calc(var(--e)*44cqh))}
 .apr__open{height:1.1em;width:2.6em}
 .apr__cap{flex-direction:column;align-items:flex-start}
}
@media (prefers-reduced-motion: reduce){.apr__hint::after{animation:none}}
`

/**
 * @framerSupportedLayoutWidth stretch
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function ApertureReveal(props: Props) {
    const p = { ...DEFAULTS, ...props }
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStaticRenderer = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const openRef = useRef<HTMLSpanElement>(null)
    const words = (p.caption || "").split(/\s+/).filter(Boolean)
    const frozen = isCanvas || isStaticRenderer
    const length = Math.max(1.5, p.length)

    // Measure the opening so the image starts clipped to it.
    useLayoutEffect(() => {
        const stage = stageRef.current
        const open = openRef.current
        if (!stage || !open) return
        let alive = true
        const measure = () => {
            if (!alive) return
            const s = stage.getBoundingClientRect()
            const w = open.getBoundingClientRect()
            const k = stage.offsetWidth ? s.width / stage.offsetWidth : 1
            const px = (v: number) => `${v / k}px`
            stage.style.setProperty("--t", px(w.top - s.top))
            stage.style.setProperty("--r", px(s.right - w.right))
            stage.style.setProperty("--b", px(s.bottom - w.bottom))
            stage.style.setProperty("--l", px(w.left - s.left))
            stage.style.setProperty("--rad", px(w.height / 2))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(stage)
        for (const sib of Array.from(open.parentElement?.children ?? []))
            ro.observe(sib)
        ;(document as any).fonts?.ready?.then(measure)
        return () => {
            alive = false
            ro.disconnect()
        }
    }, [p.lead, p.trail, p.headlineFont])

    // Scroll drives two CSS variables; scrolling never re-renders React.
    useEffect(() => {
        const root = rootRef.current
        const stage = stageRef.current
        if (!root || !stage) return
        const apply = (progress: number) => {
            stage.style.setProperty(
                "--e",
                String(ease(clamp01(progress / EXPAND_END)))
            )
            stage.style.setProperty(
                "--q",
                String(
                    clamp01(
                        (progress - CAPTION_START) /
                            (CAPTION_END - CAPTION_START)
                    )
                )
            )
        }
        const reduced =
            p.respectReducedMotion &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        if (frozen) {
            apply(clamp01(p.canvasProgress / 100))
            return
        }
        if (reduced) {
            apply(1)
            return
        }
        const scroller = scrollParent(root)
        let raf = 0
        const update = () => {
            raf = 0
            const top =
                root.getBoundingClientRect().top -
                (scroller ? scroller.getBoundingClientRect().top : 0)
            const vh = scroller ? scroller.clientHeight : window.innerHeight
            const range = Math.max(1, root.offsetHeight - vh)
            apply(clamp01(-top / range))
        }
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update)
        }
        update()
        const target: any = scroller ?? window
        target.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        return () => {
            target.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            if (raf) cancelAnimationFrame(raf)
        }
    }, [frozen, p.canvasProgress, p.respectReducedMotion, length])

    const stageHeight = frozen ? "min(100vh, 800px)" : "100vh"
    const hasLink = !!p.buttonLink

    return (
        <section
            ref={rootRef}
            className="apr"
            aria-label={`${p.lead} ${p.trail}`}
            style={{
                ...p.style,
                height: frozen ? stageHeight : `${length * 100}vh`,
                background: p.background,
                color: p.ink,
            }}
        >
            <style>{CSS}</style>
            <div
                ref={stageRef}
                className="apr__stage"
                style={{ height: stageHeight }}
            >
                <div className="apr__media" style={{ background: p.opening }}>
                    {p.image?.src ? (
                        <img
                            className="apr__img"
                            src={p.image.src}
                            alt={p.image.alt || ""}
                        />
                    ) : (
                        <div
                            className="apr__img"
                            style={{
                                background:
                                    "radial-gradient(120% 90% at 20% 15%, #FFD84D 0%, transparent 55%), radial-gradient(90% 80% at 85% 80%, #FF6A3D 0%, transparent 60%), linear-gradient(135deg, #1E1B4B, #0F172A)",
                            }}
                        />
                    )}
                    <div className="apr__wash" aria-hidden="true" />
                </div>
                <h2 className="apr__h" style={{ ...p.headlineFont }}>
                    <span className="apr__lead">{p.lead} </span>
                    <span
                        ref={openRef}
                        className="apr__open"
                        aria-hidden="true"
                    />
                    <span className="apr__trail">{p.trail}</span>
                </h2>
                {(words.length > 0 || p.showButton) && (
                    <div className="apr__cap">
                        {words.length > 0 && (
                            <p
                                className="apr__text"
                                style={{ ...p.captionFont }}
                            >
                                <span style={visuallyHidden}>{p.caption}</span>
                                <span
                                    aria-hidden="true"
                                    style={{ ["--n" as any]: words.length }}
                                >
                                    {words.map((w, i) => (
                                        <span
                                            key={i}
                                            className="apr__w"
                                            style={{ ["--i" as any]: i }}
                                        >
                                            {w}{" "}
                                        </span>
                                    ))}
                                </span>
                            </p>
                        )}
                        {p.showButton && (
                            <div className="apr__act">
                                {hasLink ? (
                                    <a
                                        className="apr__btn"
                                        href={p.buttonLink}
                                        style={{
                                            background: p.accent,
                                            color: p.accentInk,
                                        }}
                                    >
                                        {p.buttonLabel}
                                    </a>
                                ) : (
                                    <span
                                        className="apr__btn"
                                        style={{
                                            background: p.accent,
                                            color: p.accentInk,
                                        }}
                                    >
                                        {p.buttonLabel}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {p.showHint && p.hint && (
                    <span className="apr__hint" aria-hidden="true">
                        {p.hint}
                    </span>
                )}
            </div>
        </section>
    )
}

const visuallyHidden: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
}

ApertureReveal.displayName = "Aperture Reveal"

addPropertyControls(ApertureReveal, {
    lead: {
        type: ControlType.String,
        title: "Lead",
        defaultValue: DEFAULTS.lead,
    },
    trail: {
        type: ControlType.String,
        title: "Trail",
        defaultValue: DEFAULTS.trail,
    },
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    caption: {
        type: ControlType.String,
        title: "Caption",
        displayTextArea: true,
        defaultValue: DEFAULTS.caption,
    },
    showButton: {
        type: ControlType.Boolean,
        title: "Button",
        defaultValue: DEFAULTS.showButton,
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: DEFAULTS.buttonLabel,
        hidden: (p: any) => !p.showButton,
    },
    buttonLink: {
        type: ControlType.Link,
        title: "Link",
        hidden: (p: any) => !p.showButton,
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Hint",
        defaultValue: DEFAULTS.showHint,
    },
    hint: {
        type: ControlType.String,
        title: "Hint Text",
        defaultValue: DEFAULTS.hint,
        hidden: (p: any) => !p.showHint,
    },
    length: {
        type: ControlType.Number,
        title: "Scroll Length",
        min: 1.5,
        max: 6,
        step: 0.5,
        unit: "×",
        defaultValue: DEFAULTS.length,
        description: "Scroll distance in screen heights.",
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",
        defaultValue: DEFAULTS.headlineFont as any,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultValue: DEFAULTS.captionFont as any,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: DEFAULTS.background,
    },
    ink: { type: ControlType.Color, title: "Text", defaultValue: DEFAULTS.ink },
    opening: {
        type: ControlType.Color,
        title: "Opening",
        defaultValue: DEFAULTS.opening,
    },
    accent: {
        type: ControlType.Color,
        title: "Button",
        defaultValue: DEFAULTS.accent,
    },
    accentInk: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: DEFAULTS.accentInk,
    },
    canvasProgress: {
        type: ControlType.Number,
        title: "Canvas Preview",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: DEFAULTS.canvasProgress,
        description: "Which moment of the animation the canvas shows.",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: DEFAULTS.respectReducedMotion,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },
})
