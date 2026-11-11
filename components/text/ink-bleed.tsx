import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Ink Bleed Text
 * Each word (or letter) soaks into the page like ink on paper:
 * it spreads out from soft, fibrous edges and dries into crisp type.
 *
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 160
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const EASE: Record<string, (x: number) => number> = {
    soak: (x) => 1 - Math.pow(1 - x, 3),
    slow: (x) => 1 - Math.pow(1 - x, 5),
    smooth: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    linear: (x) => x,
}

const FONT_DEFAULT = {
    fontFamily: "'Libre Caslon Text', Georgia, serif",
    fontSize: 96,
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: "1.05em",
}

type Unit = {
    el: HTMLSpanElement
    turb: SVGElement
    disp: SVGElement
    blur: SVGElement
    ink: SVGElement
    halo: SVGElement
    fid: string
    done: boolean
}

export default function InkBleedText(props: any) {
    const {
        text,
        tag,
        font,
        color,
        align,
        sizing,
        split,
        spread,
        roughness,
        grain,
        halo,
        trigger,
        replay,
        duration,
        delay,
        stagger,
        easing,
        order,
        hoverBleed,
        hoverStrength,
        loop,
        loopPause,
        style,
    } = { ...InkBleedText.defaultProps, ...props }
    const sz = { ...InkBleedText.defaultProps.sizing, ...(sizing || {}) }

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const rootRef = useRef<HTMLElement>(null)
    const uid = ((React as any).useId ? (React as any).useId() : "ib").replace(
        /[^a-zA-Z0-9]/g,
        ""
    )
    const units = useRef<Unit[]>([])
    const hovers = useRef<Record<number, number>>({})
    const t0 = useRef<number | null>(null)
    const [width, setWidth] = useState(0)
    const reduced = useMemo(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        []
    )
    const animate = !isCanvas && !reduced

    // ----- split text -----
    const words = useMemo(
        () =>
            String(text || "")
                .split(/\s+/)
                .filter(Boolean),
        [text]
    )
    let count = 0
    const layout = words.map((w) => {
        const u = split === "word" ? count++ : -1
        return {
            w,
            u,
            letters: Array.from(w).map((ch) => ({
                ch,
                u: split === "letter" ? count++ : -1,
            })),
        }
    })
    const total = count
    const orderIndex = useMemo(() => {
        const idx = Array.from({ length: total }, (_, i) => i)
        if (order === "reverse") idx.reverse()
        if (order === "center") {
            const mid = (total - 1) / 2
            idx.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))
        }
        if (order === "random") {
            let s = total * 9301 + 49297
            for (let i = idx.length - 1; i > 0; i--) {
                s = (s * 9301 + 49297) % 233280
                const j = Math.floor((s / 233280) * (i + 1))
                ;[idx[i], idx[j]] = [idx[j], idx[i]]
            }
        }
        const rank: number[] = []
        idx.forEach((u, r) => (rank[u] = r))
        return rank
    }, [total, order])

    // ----- responsive width -----
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        setWidth(el.getBoundingClientRect().width)
        const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const baseSize = parseFloat(font?.fontSize) || FONT_DEFAULT.fontSize
    const fontSize =
        sz.mode === "fluid" && width > 0
            ? clamp((width * sz.scale) / 100, sz.min, sz.max)
            : sz.mode === "fluid"
              ? clamp(baseSize, sz.min, sz.max)
              : baseSize

    // ----- collect units -----
    const live = useRef({
        spread,
        roughness,
        grain,
        halo,
        duration,
        delay,
        stagger,
        easing,
        hoverStrength,
        loop,
        loopPause,
        fontSize,
        orderIndex,
    })
    live.current = {
        spread,
        roughness,
        grain,
        halo,
        duration,
        delay,
        stagger,
        easing,
        hoverStrength,
        loop,
        loopPause,
        fontSize,
        orderIndex,
    }

    const restart = () => {
        t0.current = performance.now()
        hovers.current = {}
        units.current.forEach((u) => {
            u.done = false
            u.el.style.opacity = "0"
            u.el.style.filter = `url(#${u.fid})`
        })
    }

    useEffect(() => {
        const root = rootRef.current
        if (!root) return
        units.current = Array.from(
            root.querySelectorAll<HTMLSpanElement>("[data-u]")
        )
            .filter((el) => +el.dataset.u! >= 0)
            .map((el) => {
                const fid = `${uid}-ink-${el.dataset.u}`
                const f = root.querySelector(`#${CSS.escape(fid)}`)!
                return {
                    el,
                    fid,
                    done: !animate,
                    turb: f.querySelector("feTurbulence")!,
                    disp: f.querySelector("feDisplacementMap")!,
                    blur: f.querySelector("feGaussianBlur")!,
                    ink: f.querySelector("[data-k=ink]")!,
                    halo: f.querySelector("[data-k=halo]")!,
                } as Unit
            })
        if (!animate) {
            units.current.forEach((u) => {
                u.el.style.opacity = "1"
                u.el.style.filter = "none"
            })
            return
        }
        t0.current = null
        units.current.forEach((u) => {
            u.el.style.opacity = "0"
            u.el.style.filter = `url(#${u.fid})`
        })
        if (trigger === "load") restart()
    }, [text, split, animate, uid])

    // ----- in-view trigger -----
    useEffect(() => {
        if (!animate || trigger !== "inView") return
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            restart()
            return
        }
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    if (t0.current === null || replay) restart()
                } else if (replay) {
                    t0.current = null
                    units.current.forEach((u) => {
                        u.done = false
                        u.el.style.opacity = "0"
                    })
                }
            },
            { threshold: 0.35 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [animate, trigger, replay, text, split])

    // ----- animation loop -----
    useEffect(() => {
        if (!animate) return
        let raf = 0
        const step = () => {
            raf = requestAnimationFrame(step)
            if (t0.current === null) return
            const c = live.current
            const now = performance.now()
            const ease = EASE[c.easing] || EASE.soak
            const fsz = c.fontSize
            const n = units.current.length
            const cycle = c.delay + c.duration + Math.max(0, n - 1) * c.stagger
            let elapsed = (now - t0.current) / 1000
            if (c.loop && elapsed > cycle + c.loopPause) {
                restart()
                elapsed = 0
            }
            units.current.forEach((u, k) => {
                const local =
                    elapsed - c.delay - (c.orderIndex[k] ?? k) * c.stagger
                let e = ease(clamp(local / c.duration))
                const hs = hovers.current[k]
                if (hs !== undefined) {
                    const h = (now - hs) / 1100
                    if (h >= 1) delete hovers.current[k]
                    else {
                        const wet =
                            c.hoverStrength *
                            (h < 0.18
                                ? EASE.soak(h / 0.18)
                                : 1 - EASE.soak((h - 0.18) / 0.82))
                        e = Math.min(e, 1 - wet)
                    }
                }
                if (e >= 1 && local > 0) {
                    if (!u.done) {
                        u.done = true
                        u.el.style.filter = "none"
                        u.el.style.opacity = "1"
                    }
                    return
                }
                if (u.done) {
                    u.done = false
                    u.el.style.filter = `url(#${u.fid})`
                }
                const q = 1 - e
                u.el.style.opacity = String(
                    clamp(local / Math.max(0.05, c.duration * 0.12))
                )
                u.turb.setAttribute(
                    "baseFrequency",
                    ((9 * c.grain) / fsz).toFixed(4)
                )
                u.disp.setAttribute(
                    "scale",
                    ((q * c.roughness * fsz) / 60).toFixed(2)
                )
                u.blur.setAttribute(
                    "stdDeviation",
                    ((q * c.spread * fsz) / 100).toFixed(2)
                )
                u.ink.setAttribute("slope", (1 + q * 16).toFixed(3))
                u.ink.setAttribute("intercept", (-q * 6).toFixed(3))
                u.halo.setAttribute("slope", (q * c.halo * 1.1).toFixed(3))
            })
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [animate])

    const onEnter = (e: React.PointerEvent<HTMLSpanElement>) => {
        if (!hoverBleed || !animate) return
        const idx = units.current.findIndex((u) => u.el === e.currentTarget)
        if (
            idx >= 0 &&
            units.current[idx].done &&
            hovers.current[idx] === undefined
        )
            hovers.current[idx] = performance.now()
    }
    const onRootEnter = () => {
        if (animate && trigger === "hover") restart()
    }

    const Tag: any = tag || "h1"
    const justify =
        align === "left"
            ? "flex-start"
            : align === "right"
              ? "flex-end"
              : "center"

    return (
        <Tag
            ref={rootRef}
            aria-label={text}
            onPointerEnter={onRootEnter}
            style={{
                ...style,
                position: "relative",
                margin: 0,
                width: "100%",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: justify,
                columnGap: "0.24em",
                rowGap: 0,
                color,
                textAlign: align,
                ...FONT_DEFAULT,
                ...font,
                fontSize,
            }}
        >
            <svg
                width={0}
                height={0}
                aria-hidden
                style={{ position: "absolute" }}
            >
                <defs>
                    {Array.from({ length: total }, (_, i) => (
                        <filter
                            key={i}
                            id={`${uid}-ink-${i}`}
                            x="-40%"
                            y="-60%"
                            width="180%"
                            height="220%"
                            colorInterpolationFilters="sRGB"
                        >
                            <feTurbulence
                                type="fractalNoise"
                                baseFrequency="0.08"
                                numOctaves={2}
                                seed={i * 7 + 3}
                                result="noise"
                            />
                            <feDisplacementMap
                                in="SourceGraphic"
                                in2="noise"
                                scale={0}
                                xChannelSelector="R"
                                yChannelSelector="G"
                                result="d"
                            />
                            <feGaussianBlur
                                in="d"
                                stdDeviation={0}
                                result="b"
                            />
                            <feComponentTransfer in="b" result="halo">
                                <feFuncA
                                    data-k="halo"
                                    type="linear"
                                    slope={0}
                                    intercept={0}
                                />
                            </feComponentTransfer>
                            <feComponentTransfer in="b" result="ink">
                                <feFuncA
                                    data-k="ink"
                                    type="linear"
                                    slope={1}
                                    intercept={0}
                                />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode in="halo" />
                                <feMergeNode in="ink" />
                            </feMerge>
                        </filter>
                    ))}
                </defs>
            </svg>
            {layout.map((w, wi) => (
                <span
                    key={wi}
                    aria-hidden
                    data-u={w.u}
                    onPointerEnter={split === "word" ? onEnter : undefined}
                    style={{
                        display: "inline-flex",
                        whiteSpace: "nowrap",
                        opacity: animate && split === "word" ? 0 : 1,
                    }}
                >
                    {w.letters.map((l, li) => (
                        <span
                            key={li}
                            data-u={l.u}
                            onPointerEnter={
                                split === "letter" ? onEnter : undefined
                            }
                            style={{
                                display: "inline-block",
                                padding: "0.06em 0",
                                opacity: animate && split === "letter" ? 0 : 1,
                            }}
                        >
                            {l.ch}
                        </span>
                    ))}
                </span>
            ))}
        </Tag>
    )
}

InkBleedText.defaultProps = {
    text: "Every word leaves a mark.",
    tag: "h1",
    font: FONT_DEFAULT,
    color: "#1B1A17",
    align: "center",
    sizing: { mode: "fluid", min: 36, max: 120, scale: 9 },
    split: "word",
    spread: 12,
    roughness: 10,
    grain: 1,
    halo: 0.5,
    trigger: "inView",
    replay: false,
    duration: 1.6,
    delay: 0.2,
    stagger: 0.14,
    easing: "soak",
    order: "forward",
    hoverBleed: true,
    hoverStrength: 0.55,
    loop: false,
    loopPause: 2,
}

addPropertyControls(InkBleedText, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: "Every word leaves a mark.",
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["h1", "h2", "h3", "h4", "p", "span"],
        optionTitles: ["H1", "H2", "H3", "H4", "Paragraph", "Span"],
        defaultValue: "h1",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: 96,
            letterSpacing: "-0.03em",
            lineHeight: "1.05em",
        },
    },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#1B1A17" },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "center",
    },
    sizing: {
        type: ControlType.Object,
        title: "Responsive",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Size",
                options: ["fluid", "fixed"],
                optionTitles: ["Fluid", "Fixed"],
                displaySegmentedControl: true,
                defaultValue: "fluid",
                description:
                    "Fluid scales with the component's width. Fixed uses the font size.",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 1,
                max: 40,
                step: 0.5,
                unit: "%",
                defaultValue: 9,
                hidden: (p: any) => p.mode === "fixed",
            },
            min: {
                type: ControlType.Number,
                title: "Min",
                min: 8,
                max: 400,
                unit: "px",
                defaultValue: 36,
                hidden: (p: any) => p.mode === "fixed",
            },
            max: {
                type: ControlType.Number,
                title: "Max",
                min: 8,
                max: 600,
                unit: "px",
                defaultValue: 120,
                hidden: (p: any) => p.mode === "fixed",
            },
        },
    },
    split: {
        type: ControlType.Enum,
        title: "Split",
        options: ["word", "letter"],
        optionTitles: ["Words", "Letters"],
        displaySegmentedControl: true,
        defaultValue: "word",
    },
    spread: {
        type: ControlType.Number,
        title: "Bleed",
        min: 0,
        max: 30,
        step: 0.5,
        defaultValue: 12,
    },
    roughness: {
        type: ControlType.Number,
        title: "Roughness",
        min: 0,
        max: 30,
        step: 0.5,
        defaultValue: 10,
    },
    grain: {
        type: ControlType.Number,
        title: "Fiber Size",
        min: 0.2,
        max: 4,
        step: 0.1,
        defaultValue: 1,
        description: "Higher = finer paper fibers",
    },
    halo: {
        type: ControlType.Number,
        title: "Wet Edge",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["inView", "load", "hover"],
        optionTitles: ["In View", "On Load", "On Hover"],
        defaultValue: "inView",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: false,
        description: "Bleed again every time it scrolls into view",
        hidden: (p: any) => p.trigger !== "inView",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "s",
        defaultValue: 1.6,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 5,
        step: 0.05,
        unit: "s",
        defaultValue: 0.2,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 1,
        step: 0.01,
        unit: "s",
        defaultValue: 0.14,
    },
    order: {
        type: ControlType.Enum,
        title: "Order",
        options: ["forward", "reverse", "center", "random"],
        optionTitles: ["Forward", "Reverse", "From Center", "Random"],
        defaultValue: "forward",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["soak", "slow", "smooth", "linear"],
        optionTitles: ["Soak", "Slow Dry", "Smooth", "Linear"],
        defaultValue: "soak",
    },
    hoverBleed: {
        type: ControlType.Boolean,
        title: "Hover Wet",
        defaultValue: true,
        description: "Words bleed again under the cursor",
    },
    hoverStrength: {
        type: ControlType.Number,
        title: "Wetness",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
        hidden: (p: any) => !p.hoverBleed,
    },
    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: false },
    loopPause: {
        type: ControlType.Number,
        title: "Pause",
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        defaultValue: 2,
        hidden: (p: any) => !p.loop,
    },
})
