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

import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"

if (typeof window !== "undefined") {
    gsap.registerPlugin(SplitText, ScrollTrigger)
}

/**
 * Gooey Text Reveal
 * Scroll-driven, line-by-line gooey blur reveal. Drop it anywhere.
 * The scroll behaviour is built in and adapts to the text size.
 *
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */

/* ------------------------------------------------------------------ */
/* Built-in scroll behaviour (not exposed as controls on purpose)      */
/* ------------------------------------------------------------------ */

// The reveal starts when the top of the text enters the lower part of the
// screen, and the text is fully sharp when it sits in the middle of the
// screen (or, for very tall text, when its bottom reaches 80% down).
const START_AT = 0.92 // viewport fraction where the reveal starts
const CENTER_AT = 0.5 // viewport fraction where the text should be sharp
const TALL_END_AT = 0.8 // used when the text is taller than 60% of the screen
const SCRUB = 0.6 // seconds the animation trails the scroll (smoothing)

// Timeline units (only ratios matter; the whole timeline maps to scroll).
// Lines fade in, rest melted for a moment, then sharpen one after another.
// The stagger is smaller than SHARPEN_DUR, so lines overlap and the gooey
// hands off from one line to the next like a wave.
const APPEAR_DUR = 1.5
const HOLD = 1.5
const SHARPEN_DUR = 3

const ALIGNS = ["left", "center", "right"] as const
type Align = (typeof ALIGNS)[number]

/* ------------------------------------------------------------------ */
/* Optional shared smooth scroll (one Lenis per page, ref-counted)     */
/* ------------------------------------------------------------------ */
// Lenis (and its GSAP ticker hook) only exists while at least one component
// is near the viewport. When every instance is offscreen it is destroyed, so
// nothing runs every frame for the rest of the page.

let lenis: Lenis | null = null
let lenisUsers = 0
let lenisTick: ((time: number) => void) | null = null

function acquireLenis() {
    if (!lenis) {
        lenis = new Lenis({ autoRaf: false })
        lenis.on("scroll", ScrollTrigger.update)
        lenisTick = (time: number) => lenis && lenis.raf(time * 1000)
        gsap.ticker.add(lenisTick)
        gsap.ticker.lagSmoothing(0)
    }
    lenisUsers++
}

function releaseLenis() {
    lenisUsers = Math.max(0, lenisUsers - 1)
    if (lenisUsers === 0 && lenis) {
        if (lenisTick) gsap.ticker.remove(lenisTick)
        lenis.destroy()
        lenis = null
        lenisTick = null
    }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Numeric values are clamped before they reach any SVG attribute or style.
const num = (v: unknown, min: number, max: number, fallback: number) =>
    typeof v === "number" && isFinite(v)
        ? Math.min(max, Math.max(min, v))
        : fallback

interface Props {
    text: string
    paragraphGap: number
    font: any
    color: string
    align: Align
    blur: number
    gooey: { enabled: boolean; strength: number; threshold: number }
    perLine: { enabled: boolean; stagger: number }
    repeat: boolean
    smooth: boolean
    style?: React.CSSProperties
}

export default function GooeyTextReveal(props: Props) {
    const {
        text,
        paragraphGap = 0.8,
        font,
        color = "#171717",
        align = "right",
        blur = 0.8,
        gooey = { enabled: true, strength: 255, threshold: -65 },
        perLine = { enabled: true, stagger: 1.5 },
        repeat = true,
        smooth = true,
        style,
    } = props

    // Framer canvas / static export: no animation, no effects, no loops.
    const isStatic = useIsStaticRenderer()
    const wrapRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const defsRef = useRef<SVGDefsElement>(null)
    const filterId = "gooey-" + useId().replace(/[^a-zA-Z0-9]/g, "")

    // Constrained values (nothing unvalidated reaches CSS or SVG)
    const blurEm = num(blur, 0, 1.5, 0.8)
    const gooeyOn = gooey?.enabled !== false
    const strength = num(gooey?.strength, 1, 255, 255)
    const threshold = num(gooey?.threshold, -254, 0, -65)
    const perLineOn = perLine?.enabled !== false
    const stagger = num(perLine?.stagger, 0, 3, 1.5)
    const gapEm = num(paragraphGap, 0, 5, 0.8)
    const repeatOn = repeat !== false
    const smoothOn = smooth !== false
    const alignSafe: Align = ALIGNS.includes(align as Align)
        ? (align as Align)
        : "right"
    const colorSafe = typeof color === "string" ? color : "#171717"
    const fontStyle: React.CSSProperties =
        font && typeof font === "object" ? font : {}

    // Content: a blank line starts a new paragraph. Works with any string
    // (typed, CMS field, variable, fetched data).
    const blocks = String(text ?? "")
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)
    const blocksKey = JSON.stringify(blocks)
    const fontKey = JSON.stringify(font ?? null)

    // Smooth scroll: only active while this component is near the viewport.
    useEffect(() => {
        if (isStatic || !smoothOn) return
        const wrap = wrapRef.current
        if (!wrap) return
        if (
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            return
        }

        let held = false
        const setActive = (on: boolean) => {
            if (on && !held) {
                acquireLenis()
                held = true
            } else if (!on && held) {
                releaseLenis()
                held = false
            }
        }

        if (typeof IntersectionObserver === "undefined") {
            setActive(true)
            return () => setActive(false)
        }

        const io = new IntersectionObserver(
            (entries) => {
                const e = entries[entries.length - 1]
                if (e) setActive(e.isIntersecting)
            },
            { rootMargin: "100% 0px 100% 0px" }
        )
        io.observe(wrap)
        return () => {
            io.disconnect()
            setActive(false)
        }
    }, [isStatic, smoothOn])

    useEffect(() => {
        if (isStatic) return
        const el = textRef.current
        const defs = defsRef.current
        if (!el || !defs || blocks.length === 0) return

        // Reduced motion: leave the text plain and readable.
        if (
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            return
        }

        const NS = "http://www.w3.org/2000/svg"
        // The filters live in the component's own hidden <svg> (rendered
        // below), one per line: blur -> gooey matrix -> edge blur. The blur
        // is inside the SVG filter so the gooey threshold always acts on the
        // blurred text and is never clipped.

        let locked = false // repeat off: stays revealed once complete
        let furthest = 0 // repeat off: furthest scroll progress reached
        let triggers: ScrollTrigger[] = []
        let activeAnim: gsap.core.Timeline | null = null

        const killTriggers = () => {
            triggers.forEach((t) => t.kill())
            triggers = []
        }

        const clearDefs = () => {
            while (defs.firstChild) defs.removeChild(defs.firstChild)
        }

        // Scroll length adapts to the text: short text gets a short, calm
        // reveal; tall text gets a longer one. Always ends with the text
        // in view.
        const scrollLength = () => {
            const vh = window.innerHeight
            const h = el.offsetHeight
            const len =
                h <= vh * 0.6
                    ? vh * (START_AT - CENTER_AT) + h / 2
                    : vh * (START_AT - TALL_END_AT) + h
            return Math.max(len, vh * 0.35)
        }

        const split = SplitText.create(Array.from(el.children), {
            type: "lines",
            linesClass: "line",
            autoSplit: true, // re-splits on resize / font load
            onSplit(self: any) {
                killTriggers()
                const lines: HTMLElement[] = self.lines
                clearDefs()
                lines.forEach((l) => {
                    l.style.display = "block"
                    l.style.willChange = "filter"
                })

                if (locked) {
                    lines.forEach((l) => (l.style.filter = "none"))
                    return
                }

                const fontPx = parseFloat(getComputedStyle(el).fontSize) || 16
                const maxStd = blurEm * fontPx

                const blurs: SVGElement[] = []
                const mats: SVGElement[] = []
                const edges: SVGElement[] = []
                lines.forEach((_, i) => {
                    const f = document.createElementNS(NS, "filter")
                    f.setAttribute("id", `${filterId}-${i}`)
                    f.setAttribute("x", "-30%")
                    f.setAttribute("y", "-200%")
                    f.setAttribute("width", "160%")
                    f.setAttribute("height", "500%")
                    f.setAttribute("color-interpolation-filters", "sRGB")
                    const b = document.createElementNS(NS, "feGaussianBlur")
                    b.setAttribute("in", "SourceGraphic")
                    b.setAttribute("stdDeviation", String(maxStd))
                    f.appendChild(b)
                    blurs.push(b)
                    if (gooeyOn) {
                        const m = document.createElementNS(NS, "feColorMatrix")
                        m.setAttribute("type", "matrix")
                        m.setAttribute(
                            "values",
                            `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${strength} ${threshold}`
                        )
                        f.appendChild(m)
                        const e = document.createElementNS(NS, "feGaussianBlur")
                        e.setAttribute("stdDeviation", "0.4")
                        f.appendChild(e)
                        mats.push(m)
                        edges.push(e)
                    }
                    defs.appendChild(f)
                })

                // v: gooey/blur amount (1 = full gooey, 0 = normal), o: opacity
                const states = lines.map(() => ({ v: 1, o: 0 }))
                const apply = () => {
                    states.forEach((s, i) => {
                        const l = lines[i]
                        l.style.opacity = s.o >= 0.999 ? "" : String(s.o)
                        if (s.v <= 0.001) {
                            l.style.filter = "none"
                        } else {
                            blurs[i].setAttribute(
                                "stdDeviation",
                                String(Math.max(0.01, s.v * maxStd))
                            )
                            if (gooeyOn) {
                                // The gooey matrix eases toward identity
                                // (strength 1, threshold 0) as the line
                                // sharpens, so the blob edges dissolve
                                // instead of snapping off at the end.
                                const g = s.v * s.v
                                mats[i].setAttribute(
                                    "values",
                                    `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${
                                        1 + (strength - 1) * g
                                    } ${threshold * g}`
                                )
                                edges[i].setAttribute(
                                    "stdDeviation",
                                    String(Math.max(0.01, 0.4 * g))
                                )
                            }
                            l.style.filter = `url(#${filterId}-${i})`
                        }
                    })
                }
                apply()

                const n = lines.length
                const appearStagger = perLineOn ? stagger * 0.5 : 0
                const appearTotal = APPEAR_DUR + (n - 1) * appearStagger

                const anim = gsap.timeline({ paused: true, onUpdate: apply })
                activeAnim = anim
                anim.to(
                    states,
                    {
                        o: 1,
                        duration: APPEAR_DUR,
                        ease: "sine.inOut",
                        stagger: appearStagger,
                    },
                    0
                )
                anim.to(
                    states,
                    {
                        v: 0,
                        duration: SHARPEN_DUR,
                        ease: "sine.inOut",
                        stagger: perLineOn ? stagger : 0,
                    },
                    appearTotal + HOLD
                )

                // Scroll position -> animation progress (1:1, reversible).
                const drive = (p: number) => {
                    if (!repeatOn) {
                        // Play once: never go backwards.
                        furthest = Math.max(furthest, p)
                        p = furthest
                    }
                    if (!repeatOn && p >= 1) {
                        locked = true
                        gsap.killTweensOf(anim)
                        anim.progress(1)
                        apply()
                        killTriggers()
                        return
                    }
                    gsap.to(anim, {
                        progress: p,
                        duration: SCRUB,
                        ease: "power2.out",
                        overwrite: true,
                    })
                }

                triggers.push(
                    ScrollTrigger.create({
                        trigger: el,
                        start: `top ${START_AT * 100}%`,
                        end: () => "+=" + scrollLength(),
                        invalidateOnRefresh: true,
                        onUpdate: (st) => drive(st.progress),
                        onRefresh: (st) => drive(st.progress),
                    })
                )

                return anim
            },
        })

        return () => {
            killTriggers()
            if (activeAnim) gsap.killTweensOf(activeAnim)
            split.revert()
            clearDefs()
        }
    }, [
        isStatic,
        blocksKey,
        fontKey,
        alignSafe,
        gapEm,
        blurEm,
        gooeyOn,
        strength,
        threshold,
        perLineOn,
        stagger,
        repeatOn,
        filterId,
    ])

    const textStyle: React.CSSProperties = {
        ...fontStyle,
        color: colorSafe,
        textAlign: alignSafe,
        margin: 0,
        width: "100%",
        whiteSpace: "pre-line",
        display: "flex",
        flexDirection: "column",
        gap: `${gapEm}em`,
    }

    return (
        <div
            ref={wrapRef}
            style={{ width: "100%", position: "relative", ...style }}
        >
            {/* Hidden SVG that holds the gooey filters. It is part of this
                component's own output; the effect only fills its <defs>. */}
            <svg
                aria-hidden="true"
                focusable="false"
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                <defs ref={defsRef} />
            </svg>
            {/* key forces fresh nodes when text/font change so React never
                fights SplitText's DOM edits. In the static renderer this is
                just plain, fully styled text. */}
            <div key={blocksKey + fontKey} ref={textRef} style={textStyle}>
                {blocks.map((b, i) => (
                    <div key={i} style={{ margin: 0 }}>
                        {b}
                    </div>
                ))}
            </div>
        </div>
    )
}

GooeyTextReveal.displayName = "Gooey Text Reveal"

addPropertyControls(GooeyTextReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue:
            "We collect the paintings that hold their breath. The wine that never spills from a tilted cup, the note that never finishes leaving the reed.\n\nThis is a room of Spanish shadow: gods caught mid-argument, men caught mid-breath.",
        description:
            "Type text here, or use the link icon beside this field to bind it to a **CMS field** or a **variable**. Leave a blank line to start a new paragraph.",
    },
    paragraphGap: {
        type: ControlType.Number,
        title: "Paragraph Gap",
        defaultValue: 0.8,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "em",
        displayStepper: true,
        hidden: (p: any) => !/\n\s*\n/.test(String(p.text ?? "")),
        description: "Space between paragraphs. Scales with font size.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "56px",
        defaultValue: {
            fontSize: "56px",
            lineHeight: "1.1em",
            fontWeight: 600,
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#171717",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "right",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 0.8,
        min: 0,
        max: 1.5,
        step: 0.01,
        unit: "em",
        description:
            "How melted the text starts. Higher = bigger, more separated blobs. Scales with font size.",
    },
    gooey: {
        type: ControlType.Object,
        title: "Gooey",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                description:
                    "On: blurred text snaps into hard-edged liquid blobs. Off: plain soft blur.",
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                defaultValue: 255,
                min: 1,
                max: 255,
                step: 1,
                hidden: (p: any) => !p.enabled,
                description: "How sharp the blob edges are.",
            },
            threshold: {
                type: ControlType.Number,
                title: "Threshold",
                defaultValue: -65,
                min: -254,
                max: 0,
                step: 1,
                hidden: (p: any) => !p.enabled,
                description:
                    "Closer to 0 = blobs shrink and break apart. More negative = blobs grow and merge.",
            },
        },
    },
    perLine: {
        type: ControlType.Object,
        title: "Per Line",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                description:
                    "On: lines reveal one after another. Off: all lines reveal together.",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 1.5,
                min: 0,
                max: 3,
                step: 0.1,
                hidden: (p: any) => !p.enabled,
                description:
                    "Gap between one line and the next. Below 3, neighbouring lines overlap for a smooth hand-off.",
            },
        },
    },
    repeat: {
        type: ControlType.Boolean,
        title: "Repeat",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description:
            "Yes: scrolling back up melts the text again. No: it reveals once and stays sharp.",
    },
    smooth: {
        type: ControlType.Boolean,
        title: "Smooth Scroll",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description:
            "Adds inertia to the page's scrolling (Lenis) while this component is near the screen. Turn off if your site already has smooth scrolling.",
    },
})
