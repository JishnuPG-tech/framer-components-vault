import * as React from "react"
import { useEffect, useId, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useInView,
    useReducedMotion,
    useScroll,
    useMotionValueEvent,
} from "framer-motion"

/**
 * Morph Text
 * One word melts into the next. Loop it, drive it with scroll,
 * or play it once when it comes into view.
 *
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight any-prefer-auto
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 80
 */

type Trigger = "loop" | "scroll" | "once"

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))

export default function MorphText(props) {
    const {
        words: rawWords,
        trigger,
        morphTime,
        holdTime,
        startDelay,
        strength,
        font,
        color,
        align,
        previewWord,
        style,
    } = props

    const words: string[] =
        rawWords && rawWords.filter((w) => w && w.trim()).length
            ? rawWords.filter((w) => w && w.trim())
            : ["Raghav", "Designer"]
    const n = words.length

    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion()

    const rootRef = useRef<HTMLDivElement>(null)
    const aRef = useRef<HTMLSpanElement>(null)
    const bRef = useRef<HTMLSpanElement>(null)
    const layerRef = useRef<HTMLDivElement>(null)

    const rawId = useId()
    const filterId = "morph-" + rawId.replace(/[^a-zA-Z0-9_-]/g, "")

    // Paint one frame: word i morphing into word i+1 by fraction f (0..1)
    const paint = (i: number, f: number, wrap: boolean) => {
        const a = aRef.current
        const b = bRef.current
        const layer = layerRef.current
        if (!a || !b || !layer) return
        const from = words[((i % n) + n) % n]
        const toIndex = wrap ? (i + 1) % n : Math.min(i + 1, n - 1)
        const to = words[toIndex]
        if (a.textContent !== from) a.textContent = from
        if (b.textContent !== to) b.textContent = to

        f = clamp(f)
        if (reduced) {
            // Plain crossfade, no blur
            layer.style.filter = "none"
            a.style.filter = b.style.filter = "none"
            a.style.opacity = String(1 - f)
            b.style.opacity = String(f)
            return
        }

        const s = strength
        const morphing = f > 0.001 && f < 0.999
        // Threshold only while morphing, so resting text stays crisp
        layer.style.filter = morphing ? `url(#${filterId})` : "none"

        const blurIn = f <= 0 ? 100 : Math.min(s / f - s, 100)
        const blurOut = f >= 1 ? 100 : Math.min(s / (1 - f) - s, 100)
        b.style.filter = `blur(${blurIn}px)`
        b.style.opacity = String(Math.pow(f, 0.4))
        a.style.filter = `blur(${blurOut}px)`
        a.style.opacity = String(Math.pow(1 - f, 0.4))
    }

    // ---- Static (canvas, export, thumbnails): show a chosen frame ----
    useEffect(() => {
        if (!isStatic) return
        const pos = clamp(previewWord, 0, n - 1)
        const i = Math.floor(pos)
        paint(i, pos - i, false)
    })

    // ---- Loop / Once ----
    const inView = useInView(rootRef, { once: true, amount: 0.6 })
    // Viewport gating: pause the animation loop while off-screen
    const visible = useInView(rootRef, { margin: "100px 0px 100px 0px" })

    useEffect(() => {
        if (isStatic || trigger === "scroll") return
        if (!visible) return
        if (trigger === "once" && !inView) {
            paint(0, 0, false)
            return
        }
        const hold = Math.max(0, holdTime) * 1000
        const morph = Math.max(0.05, morphTime) * 1000
        const delay = Math.max(0, startDelay) * 1000
        const cycle = hold + morph
        const wrap = trigger === "loop"
        let raf = 0
        let start = 0

        const tick = (now: number) => {
            if (!start) start = now
            const t = now - start - delay
            if (t < 0) {
                paint(0, 0, wrap)
            } else {
                let i = Math.floor(t / cycle)
                const local = t - i * cycle
                if (!wrap && i >= n - 1) {
                    paint(n - 1, 0, false)
                    return // finished, stop the loop
                }
                const f = local < hold ? 0 : (local - hold) / morph
                paint(wrap ? i % n : i, f, wrap)
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [
        isStatic,
        trigger,
        inView,
        visible,
        morphTime,
        holdTime,
        startDelay,
        strength,
        reduced,
        words.join("|"),
    ])

    // ---- Scroll ----
    const { scrollYProgress } = useScroll({
        target: rootRef,
        offset: ["start 0.9", "start 0.15"],
    })

    const paintScroll = (p: number) => {
        if (n < 2) return paint(0, 0, false)
        const pos = clamp(p) * (n - 1)
        let i = Math.floor(pos)
        let f = pos - i
        if (i >= n - 1) {
            i = n - 1
            f = 0
        }
        // Hold each word a little before it starts morphing
        const h = 0.35
        f = clamp((f - h / 2) / (1 - h))
        paint(i, f, false)
    }

    useMotionValueEvent(scrollYProgress, "change", (p) => {
        if (isStatic || trigger !== "scroll" || !visible) return
        paintScroll(p)
    })

    useEffect(() => {
        if (isStatic || trigger !== "scroll" || !visible) return
        paintScroll(scrollYProgress.get())
    }, [isStatic, trigger, visible, reduced, words.join("|")])

    const justify =
        align === "left" ? "start" : align === "right" ? "end" : "center"

    const cell: React.CSSProperties = {
        gridArea: "1 / 1",
        justifySelf: justify,
        whiteSpace: "nowrap",
        userSelect: "none",
        willChange: "filter, opacity",
    }

    return (
        <div
            ref={rootRef}
            role="text"
            aria-label={words.join(", ")}
            style={{
                ...style,
                position: "relative",
                display: "grid",
                alignItems: "center",
                color,
                textAlign: align,
                lineHeight: 1.1,
                ...font,
            }}
        >
            {/* Sizers: every word, invisible, so the box fits the longest one */}
            {words.map((w, k) => (
                <span
                    key={k}
                    aria-hidden="true"
                    style={{
                        ...cell,
                        visibility: "hidden",
                        willChange: "auto",
                    }}
                >
                    {w}
                </span>
            ))}

            <div
                ref={layerRef}
                aria-hidden="true"
                style={{
                    gridArea: "1 / 1",
                    display: "grid",
                    justifySelf: "stretch",
                    alignSelf: "stretch",
                    alignItems: "center",
                }}
            >
                <span ref={aRef} style={cell}>
                    {words[0]}
                </span>
                <span ref={bRef} style={{ ...cell, opacity: 0 }}>
                    {words[1 % n]}
                </span>
            </div>

            <svg
                aria-hidden="true"
                width="0"
                height="0"
                style={{ position: "absolute", width: 0, height: 0 }}
            >
                <defs>
                    <filter id={filterId}>
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"
                        />
                    </filter>
                </defs>
            </svg>
        </div>
    )
}

MorphText.displayName = "Morph Text"

MorphText.defaultProps = {
    words: ["Raghav", "Designer", "Developer"],
    trigger: "loop",
    morphTime: 1,
    holdTime: 1.6,
    startDelay: 0.3,
    strength: 8,
    color: "#FFFFFF",
    align: "center",
    previewWord: 0,
}

addPropertyControls(MorphText, {
    words: {
        type: ControlType.Array,
        title: "Words",
        control: { type: ControlType.String, placeholder: "Word" },
        defaultValue: ["Raghav", "Designer", "Developer"],
        maxCount: 10,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["loop", "scroll", "once"],
        optionTitles: ["Loop", "Scroll", "Once in View"],
        defaultValue: "loop",
        displaySegmentedControl: true,
    },
    morphTime: {
        type: ControlType.Number,
        title: "Morph",
        min: 0.2,
        max: 4,
        step: 0.1,
        unit: "s",
        defaultValue: 1,
        hidden: (p) => p.trigger === "scroll",
    },
    holdTime: {
        type: ControlType.Number,
        title: "Hold",
        min: 0,
        max: 6,
        step: 0.1,
        unit: "s",
        defaultValue: 1.6,
        hidden: (p) => p.trigger === "scroll",
    },
    startDelay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        defaultValue: 0.3,
        hidden: (p) => p.trigger === "scroll",
    },
    strength: {
        type: ControlType.Number,
        title: "Melt",
        min: 2,
        max: 20,
        step: 1,
        defaultValue: 8,
        description: "Higher = gooier blend between words.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 72,
            fontWeight: 600,
            letterSpacing: "-0.02em",
        },
    },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#FFFFFF" },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    previewWord: {
        type: ControlType.Number,
        title: "Preview",
        min: 0,
        max: 9,
        step: 0.05,
        defaultValue: 0,
        description: "Canvas only. Scrub between words (1 = second word).",
    },
})
