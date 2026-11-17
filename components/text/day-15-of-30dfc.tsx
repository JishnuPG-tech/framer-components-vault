// Scroll Text Reveal for Framer
// Ported from Magic UI "Text Reveal" (MIT License, Copyright (c) Magic UI)
// https://github.com/magicuidesign/magicui
// Framer port: no Tailwind, no motion dependency. The paragraph pins while you scroll and
// lights up word by word (or letter by letter), with an optional highlight colour and blur.

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


type Props = {
    text: string
    highlight: string
    split: "words" | "letters"
    font: any
    fontSize: number
    color: string
    dimOpacity: number
    highlightColor: string
    blur: number
    softness: number
    align: "left" | "center" | "right"
    maxWidth: number
    background: string
    length: number
    canvasProgress: number
    respectReducedMotion: boolean
    style?: React.CSSProperties
}

const DEFAULTS: Omit<Props, "style"> = {
    text: "Great design is not decoration. It is the quiet decision that makes the right thing feel obvious, and the wrong thing feel impossible.",
    highlight: "quiet decision, obvious",
    split: "words",
    font: { fontFamily: "Inter", fontWeight: 600 },
    fontSize: 56,
    color: "#141413",
    dimOpacity: 15,
    highlightColor: "#2B4BFF",
    blur: 4,
    softness: 3,
    align: "left",
    maxWidth: 1000,
    background: "transparent",
    length: 2.5,
    canvasProgress: 45,
    respectReducedMotion: true,
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function scrollParent(node: HTMLElement | null): HTMLElement | null {
    let el = node?.parentElement ?? null
    while (el && el !== document.body && el !== document.documentElement) {
        const o = getComputedStyle(el).overflowY
        if (o === "auto" || o === "scroll") return el
        el = el.parentElement
    }
    return null
}

/**
 * @framerSupportedLayoutWidth stretch
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function TextReveal(props: Props) {
    const p = { ...DEFAULTS, ...props }
    const isStaticRenderer = useIsStaticRenderer()
    const frozen =
        RenderTarget.current() === RenderTarget.canvas || isStaticRenderer
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)

    const words = (p.text || "").split(/\s+/).filter(Boolean)
    const marks = (p.highlight || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    const isMarked = (w: string) => {
        const clean = w.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, "")
        return marks.some((m) => m.split(/\s+/).includes(clean))
    }
    const units: { t: string; mark: boolean; space: boolean }[] = []
    words.forEach((w, wi) => {
        const mark = isMarked(w)
        if (p.split === "letters") {
            Array.from(w).forEach((ch) =>
                units.push({ t: ch, mark, space: false })
            )
        } else units.push({ t: w, mark, space: false })
        if (wi < words.length - 1)
            units.push({ t: " ", mark: false, space: true })
    })
    const n = units.filter((u) => !u.space).length

    useEffect(() => {
        const root = rootRef.current
        const stage = stageRef.current
        if (!root || !stage) return
        const set = (q: number) => stage.style.setProperty("--q", String(q))
        if (frozen) {
            set(clamp01(p.canvasProgress / 100))
            return
        }
        if (
            p.respectReducedMotion &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ) {
            set(1)
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
            // Finish a little before the end so the full line holds on screen.
            set(clamp01(-top / range / 0.85))
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
    }, [frozen, p.canvasProgress, p.respectReducedMotion])

    const soft = Math.max(1, p.softness)
    const dim = clamp01(p.dimOpacity / 100)
    const css = `
.trv__u{--w:clamp(0,(var(--q)*(${n} + ${soft}) - var(--i))/${soft},1);opacity:calc(${dim} + ${1 - dim}*var(--w));filter:blur(calc((1 - var(--w))*${p.blur}px));transition:color .2s}
.trv__u[data-mark]{color:color-mix(in srgb, ${p.highlightColor} calc(var(--w)*100%), currentColor)}
`
    let i = -1
    const justify =
        p.align === "center"
            ? "center"
            : p.align === "right"
              ? "flex-end"
              : "flex-start"

    return (
        <div
            ref={rootRef}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: frozen ? "auto" : `${Math.max(1.2, p.length) * 100}vh`,
                background: p.background,
            }}
        >
            <style>{css}</style>
            <div
                ref={stageRef}
                style={{
                    position: frozen ? "relative" : "sticky",
                    top: 0,
                    height: frozen ? "auto" : "100vh",
                    minHeight: frozen ? 400 : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: justify,
                    padding: "64px clamp(20px, 5vw, 64px)",
                    boxSizing: "border-box",
                    ["--q" as any]: 0,
                }}
            >
                <p
                    style={{
                        margin: 0,
                        maxWidth: p.maxWidth,
                        textAlign: p.align,
                        color: p.color,
                        fontSize: `clamp(${Math.round(p.fontSize * 0.5)}px, ${(p.fontSize / 14).toFixed(2)}vw, ${p.fontSize}px)`,
                        lineHeight: 1.12,
                        letterSpacing: "-0.03em",
                        textWrap: "pretty" as any,
                        ...p.font,
                    }}
                >
                    <span style={hidden}>{p.text}</span>
                    <span aria-hidden="true">
                        {units.map((u, k) => {
                            if (u.space) return <span key={k}> </span>
                            i++
                            return (
                                <span
                                    key={k}
                                    className="trv__u"
                                    data-mark={u.mark ? "" : undefined}
                                    style={{
                                        ["--i" as any]: i,
                                        display: "inline-block",
                                        whiteSpace: "pre",
                                    }}
                                >
                                    {u.t}
                                </span>
                            )
                        })}
                    </span>
                </p>
            </div>
        </div>
    )
}

const hidden: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
    border: 0,
}

TextReveal.displayName = "Scroll Text Reveal"

addPropertyControls(TextReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: DEFAULTS.text,
    },
    highlight: {
        type: ControlType.String,
        title: "Highlight",
        defaultValue: DEFAULTS.highlight,
        description: "Words to colour, separated by commas.",
    },
    split: {
        type: ControlType.Enum,
        title: "Reveal By",
        options: ["words", "letters"],
        optionTitles: ["Words", "Letters"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.split,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: DEFAULTS.font as any,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Max Size",
        min: 16,
        max: 160,
        step: 1,
        unit: "px",
        defaultValue: DEFAULTS.fontSize,
    },
    color: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: DEFAULTS.color,
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: DEFAULTS.highlightColor,
    },
    dimOpacity: {
        type: ControlType.Number,
        title: "Unread",
        min: 0,
        max: 90,
        step: 1,
        unit: "%",
        defaultValue: DEFAULTS.dimOpacity,
        description: "Opacity of text not yet revealed.",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        defaultValue: DEFAULTS.blur,
    },
    softness: {
        type: ControlType.Number,
        title: "Softness",
        min: 1,
        max: 12,
        step: 1,
        defaultValue: DEFAULTS.softness,
        description: "How many words fade at once.",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.align,
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        min: 300,
        max: 2000,
        step: 10,
        unit: "px",
        defaultValue: DEFAULTS.maxWidth,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: DEFAULTS.background,
    },
    length: {
        type: ControlType.Number,
        title: "Scroll Length",
        min: 1.2,
        max: 6,
        step: 0.1,
        unit: "×",
        defaultValue: DEFAULTS.length,
        description: "Scroll distance in screen heights.",
    },
    canvasProgress: {
        type: ControlType.Number,
        title: "Canvas Preview",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: DEFAULTS.canvasProgress,
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: DEFAULTS.respectReducedMotion,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },
})
