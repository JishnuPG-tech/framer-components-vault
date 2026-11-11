import * as React from "react"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
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
    AnimatePresence,
    motion,
    useInView,
    useReducedMotion,
} from "framer-motion"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 80
 */

type Effect =
    | "blur"
    | "fade"
    | "mask"
    | "slide"
    | "zoom"
    | "flip"
    | "drop"
    | "wave"
    | "typewriter"
    | "scramble"
type Ease = "easeOut" | "easeInOut" | "easeIn" | "linear" | "backOut" | "spring"
type Order = "start" | "end" | "center" | "random"
type Align = "left" | "center" | "right"
type Direction = "up" | "down" | "left" | "right"

type Props = {
    words: string[]
    size: number
    fitToFrame: boolean
    font: React.CSSProperties
    color: string
    align: Align
    effect: Effect
    direction: Direction
    distance: number
    scaleFrom: number
    flipAxis: "x" | "y"
    addBlur: boolean
    blur: number
    exitStyle: "continue" | "reverse"
    ease: Ease
    bounce: number
    duration: number
    exitDuration: number
    stagger: number
    order: Order
    hold: number
    caret: boolean
    splitBy: "auto" | "character" | "word"
    loop: boolean
    pauseOnHover: boolean
    startInView: boolean
    style?: React.CSSProperties
}

const ARABIC_SCRIPT =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
const RTL_SCRIPT = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/
const DEVANAGARI = /[\u0900-\u097F]/

const POOLS = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digits: "0123456789",
    arabic: "ابتثجحخدذرزسشصضطظعغفقكلمنهوي",
    devanagari: "अआइईउऊएओकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह",
}

const DIR: Record<Direction, [number, number]> = {
    up: [0, 1],
    down: [0, -1],
    left: [1, 0],
    right: [-1, 0],
}

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

function split(text: string, by: Props["splitBy"]): string[] {
    const mode =
        by === "auto" ? (ARABIC_SCRIPT.test(text) ? "word" : "character") : by
    if (mode === "word") return text.split(/(\s+)/).filter(Boolean)
    const Seg = (Intl as any).Segmenter
    if (Seg) {
        return Array.from(
            new Seg(undefined, { granularity: "grapheme" }).segment(text),
            (s: any) => s.segment as string
        )
    }
    return Array.from(text)
}

function getRanks(n: number, order: Order, seed: number): number[] {
    const idx = Array.from({ length: n }, (_, i) => i)
    if (order === "start") return idx
    if (order === "end") return idx.map((i) => n - 1 - i)
    if (order === "center") {
        const c = (n - 1) / 2
        return idx.map((i) => Math.abs(i - c))
    }
    let s = seed + 7
    const rnd = () => {
        s = (s * 16807) % 2147483647
        return s / 2147483647
    }
    const shuffled = [...idx]
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const rank = new Array(n)
    shuffled.forEach((original, position) => (rank[original] = position))
    return rank
}

const pick = (s: string | string[]) =>
    Array.isArray(s)
        ? s[Math.floor(Math.random() * s.length)]
        : s.charAt(Math.floor(Math.random() * s.length))

function randomLike(ch: string, extra: string[]): string {
    if (!ch || !ch.trim()) return ch
    if (/[,.!?;:،؛؟\-–—'"“”]/.test(ch)) return ch
    if (/[A-Z]/.test(ch)) return pick(POOLS.upper)
    if (/[a-z]/.test(ch)) return pick(POOLS.lower)
    if (/[0-9]/.test(ch)) return pick(POOLS.digits)
    if (ARABIC_SCRIPT.test(ch)) return pick(POOLS.arabic)
    if (DEVANAGARI.test(ch)) return pick(POOLS.devanagari)
    return extra.length ? pick(extra) : ch
}

export default function AnimatedTextRotatorVF(props: Props) {
    const {
        words,
        size,
        fitToFrame,
        font,
        color,
        align,
        effect,
        direction,
        distance,
        scaleFrom,
        flipAxis,
        addBlur,
        blur,
        exitStyle,
        ease,
        bounce,
        duration,
        exitDuration,
        stagger,
        order,
        hold,
        caret,
        splitBy,
        loop,
        pauseOnHover,
        startInView,
    } = props

    const list = words.length ? words : [""]
    const listKey = list.join("|")
    const rootRef = useRef<HTMLDivElement>(null)
    const measureRefs = useRef<(HTMLSpanElement | null)[]>([])
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const [fit, setFit] = useState({ rootW: 0, maxW: 0 })
    const [shown, setShown] = useState("")

    const reduceMotion = useReducedMotion()
    const inView = useInView(rootRef, { amount: 0.2 })
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const eff: Effect = reduceMotion ? "fade" : effect
    const isText = eff === "typewriter" || eff === "scramble"

    const word = list[index % list.length]
    const pieces = useMemo(() => split(word, splitBy), [word, splitBy])
    const ranks = useMemo(
        () => getRanks(pieces.length, order, index),
        [pieces.length, order, index]
    )
    const maxRank = Math.max(0, ...ranks)
    const dir = RTL_SCRIPT.test(word) ? "rtl" : "ltr"

    const measured = fit.maxW > 0 && fit.rootW > 0
    const fontSize =
        fitToFrame && measured
            ? Math.round(size * (fit.rootW / fit.maxW) * 10) / 10
            : size

    const measure = useCallback(() => {
        const root = rootRef.current
        if (!root) return
        let max = 0
        measureRefs.current.forEach((el) => {
            if (el) max = Math.max(max, el.offsetWidth)
        })
        setFit((prev) =>
            prev.rootW === root.clientWidth && prev.maxW === max
                ? prev
                : { rootW: root.clientWidth, maxW: max }
        )
    }, [])

    const fontKey = JSON.stringify(font)
    useIsoLayoutEffect(() => {
        if (!fitToFrame) return
        measure()
        const root = rootRef.current
        if (!root || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(root)
        ;(document as any).fonts?.ready?.then(measure)
        return () => ro.disconnect()
    }, [fitToFrame, measure, fontKey, listKey])

    const canRun = !paused && (!startInView || inView)
    const gateRef = useRef(true)
    gateRef.current = canRun

    const springOK = (ease === "spring" || eff === "drop") && eff !== "wave"
    const enterTotal = maxRank * stagger + duration + (springOK ? 0.3 : 0)

    const running =
        !isCanvas &&
        !isText &&
        list.length > 1 &&
        canRun &&
        (loop || index < list.length - 1)

    useEffect(() => {
        if (!running) return
        const id = window.setTimeout(
            () => setIndex((i) => (i + 1) % list.length),
            (enterTotal + hold) * 1000
        )
        return () => window.clearTimeout(id)
    }, [running, index, enterTotal, hold, list.length])

    useEffect(() => {
        if (!isText || isCanvas) return
        let dead = false
        const timers = new Set<number>()
        const sleep = (s: number) =>
            new Promise<void>((res) => {
                const id = window.setTimeout(
                    () => {
                        timers.delete(id)
                        res()
                    },
                    Math.max(0, s) * 1000
                )
                timers.add(id)
            })
        const gate = async () => {
            while (!dead && !gateRef.current) await sleep(0.1)
        }
        const extra = Array.from(
            new Set(split(list.join(""), "character"))
        ).filter((c) => c.trim())

        const run = async () => {
            let i = 0
            let prev = ""
            setShown("")
            while (!dead) {
                const w = list[i % list.length]
                const isLast = i % list.length === list.length - 1
                setIndex(i % list.length)
                await gate()
                if (dead) return
                const target = split(w, "character")

                if (eff === "typewriter") {
                    for (let k = 1; k <= target.length; k++) {
                        await gate()
                        if (dead) return
                        setShown(target.slice(0, k).join(""))
                        await sleep(Math.max(0.015, stagger))
                    }
                    if (!loop && isLast) return
                    await sleep(hold)
                    for (let k = target.length - 1; k >= 0; k--) {
                        await gate()
                        if (dead) return
                        setShown(target.slice(0, k).join(""))
                        await sleep(Math.max(0.01, stagger * 0.5))
                    }
                    await sleep(0.15)
                } else {
                    const old = split(prev, "character")
                    const total = Math.max(target.length, old.length)
                    const rk = getRanks(total, order, i)
                    const t0 = performance.now()
                    while (!dead) {
                        const el = (performance.now() - t0) / 1000
                        let out = ""
                        let done = true
                        for (let j = 0; j < total; j++) {
                            const start = rk[j] * stagger * 0.4
                            const settle = duration * 0.5 + rk[j] * stagger
                            if (el >= settle) {
                                out += target[j] ?? ""
                            } else {
                                done = false
                                out +=
                                    el < start
                                        ? (old[j] ?? "")
                                        : randomLike(
                                              target[j] ?? old[j] ?? "a",
                                              extra
                                          )
                            }
                        }
                        setShown(out)
                        if (done) break
                        await sleep(0.04)
                    }
                    prev = w
                    if (!loop && isLast) return
                    await sleep(hold)
                }
                i++
            }
        }
        run()
        return () => {
            dead = true
            timers.forEach((id) => window.clearTimeout(id))
        }
    }, [isText, eff, isCanvas, listKey, stagger, hold, loop, duration, order])

    const blurPx = eff === "blur" || (addBlur && eff !== "fade") ? blur : 0
    const fadesOpacity = eff !== "mask"
    const cont = exitStyle === "continue"

    const hiddenBase: Record<string, any> = {}
    if (fadesOpacity) hiddenBase.opacity = 0
    if (blurPx > 0) hiddenBase.filter = `blur(${blurPx}px)`
    const shownBase: Record<string, any> = {}
    if (fadesOpacity) shownBase.opacity = 1
    if (blurPx > 0) shownBase.filter = "blur(0px)"

    let enterFrom: Record<string, any> = {}
    let exitTo: Record<string, any> = {}
    let rest: Record<string, any> = {}

    switch (eff) {
        case "slide":
        case "mask": {
            const [sx, sy] = DIR[direction]
            const unit = eff === "mask" ? "%" : "em"
            const mag = eff === "mask" ? 110 : distance
            const at = (k: number) => ({
                ...(sx ? { x: `${sx * mag * k}${unit}` } : {}),
                ...(sy ? { y: `${sy * mag * k}${unit}` } : {}),
            })
            enterFrom = at(1)
            exitTo = at(cont ? -1 : 1)
            rest = {
                ...(sx ? { x: `0${unit}` } : {}),
                ...(sy ? { y: `0${unit}` } : {}),
            }
            break
        }
        case "zoom":
            enterFrom = { scale: scaleFrom }
            exitTo = { scale: cont ? 1 + (1 - scaleFrom) : scaleFrom }
            rest = { scale: 1 }
            break
        case "flip": {
            const key = flipAxis === "x" ? "rotateX" : "rotateY"
            enterFrom = { [key]: 90 }
            exitTo = { [key]: cont ? -90 : 90 }
            rest = { [key]: 0 }
            break
        }
        case "drop":
            enterFrom = { y: `${-distance}em` }
            exitTo = { y: `${cont ? distance : -distance}em` }
            rest = { y: "0em" }
            break
        case "wave":
            enterFrom = { y: `${distance}em`, rotate: 8 }
            exitTo = {
                y: ["0em", `${-distance * 0.5}em`, `${distance}em`],
                rotate: [0, -4, 8],
            }
            rest = {
                y: [`${distance}em`, `${-distance * 0.5}em`, "0em"],
                rotate: [8, -4, 0],
            }
            break
        default:
            break
    }

    const easeName: Ease = eff === "drop" ? "spring" : ease
    const exitEase =
        easeName === "easeOut" ||
        easeName === "backOut" ||
        easeName === "spring"
            ? "easeIn"
            : easeName === "easeIn"
              ? "easeOut"
              : easeName

    const enterTransition = (i: number) => {
        const delay = ranks[i] * stagger
        const tween: any = {
            duration,
            delay,
            ease: springOK ? "easeOut" : easeName,
        }
        const main: any = springOK
            ? { type: "spring", duration, bounce, delay }
            : eff === "wave"
              ? { ...tween, times: [0, 0.55, 1] }
              : tween
        return { default: main, opacity: tween, filter: tween }
    }

    const exitTransition = (i: number) => {
        const tween: any = {
            duration: exitDuration,
            delay: ranks[i] * stagger * 0.6,
            ease: exitEase,
        }
        if (eff !== "wave") return tween
        return {
            default: { ...tween, times: [0, 0.45, 1] },
            opacity: tween,
            filter: tween,
        }
    }

    const justify =
        align === "left"
            ? "flex-start"
            : align === "right"
              ? "flex-end"
              : "center"

    const root: React.CSSProperties = {
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        width: "100%",
        height: "100%",
        ...props.style,
    }

    const text: React.CSSProperties = {
        ...font,
        color,
        fontSize,
        whiteSpace: "pre",
        minHeight: "1.2em",
        display: "inline-flex",
        alignItems: "center",
        opacity: fitToFrame && !measured && !isCanvas ? 0 : 1,
    }

    const srOnly: React.CSSProperties = {
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
    }

    const maskStyle: React.CSSProperties = {
        display: "inline-block",
        overflow: "hidden",
        whiteSpace: "pre",
        verticalAlign: "top",
        padding: "0.12em 0.04em",
        margin: "-0.12em -0.04em",
    }

    const renderPiece = (piece: string, i: number) => {
        const inner = (
            <motion.span
                key={eff === "mask" ? undefined : i}
                initial={{ ...hiddenBase, ...enterFrom } as any}
                animate={
                    {
                        ...shownBase,
                        ...rest,
                        transition: enterTransition(i),
                    } as any
                }
                exit={
                    {
                        ...hiddenBase,
                        ...exitTo,
                        transition: exitTransition(i),
                    } as any
                }
                style={{ display: "inline-block", whiteSpace: "pre" }}
            >
                {piece}
            </motion.span>
        )
        return eff === "mask" ? (
            <span key={i} style={maskStyle}>
                {inner}
            </span>
        ) : (
            inner
        )
    }

    return (
        <div
            ref={rootRef}
            style={root}
            onMouseEnter={() => pauseOnHover && setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {fitToFrame && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        visibility: "hidden",
                        pointerEvents: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        whiteSpace: "pre",
                        ...font,
                        fontSize: size,
                    }}
                >
                    {list.map((w, i) => (
                        <span
                            key={i}
                            ref={(el) => {
                                measureRefs.current[i] = el
                            }}
                            dir={RTL_SCRIPT.test(w) ? "rtl" : "ltr"}
                            style={{ display: "inline-block" }}
                        >
                            {w}
                        </span>
                    ))}
                </div>
            )}

            {isCanvas ? (
                <div
                    style={text}
                    dir={RTL_SCRIPT.test(list[0]) ? "rtl" : "ltr"}
                >
                    {list[0]}
                </div>
            ) : (
                <div style={text}>
                    <span aria-live="polite" style={srOnly}>
                        {word}
                    </span>
                    {isText ? (
                        <>
                            <span
                                aria-hidden="true"
                                dir={dir}
                                style={{ whiteSpace: "pre" }}
                            >
                                {shown}
                            </span>
                            {eff === "typewriter" && caret && (
                                <motion.span
                                    aria-hidden="true"
                                    animate={{ opacity: [1, 1, 0, 0] }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        times: [0, 0.5, 0.5, 1],
                                    }}
                                    style={{
                                        display: "inline-block",
                                        width: "0.06em",
                                        height: "0.9em",
                                        background: "currentColor",
                                        marginInlineStart: "0.08em",
                                    }}
                                />
                            )}
                        </>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={`${index}-${word}`}
                                aria-hidden="true"
                                dir={dir}
                                style={{
                                    display: "inline-flex",
                                    whiteSpace: "pre",
                                    perspective: 800,
                                }}
                            >
                                {pieces.map(renderPiece)}
                            </motion.span>
                        </AnimatePresence>
                    )}
                </div>
            )}
        </div>
    )
}

AnimatedTextRotatorVF.defaultProps = {
    words: ["你好,", "नमस्ते,", "Hola,", "Hello,"],
    size: 48,
    fitToFrame: false,
    color: "#ffffff",
    align: "left",
    effect: "blur",
    direction: "up",
    distance: 0.6,
    scaleFrom: 0.6,
    flipAxis: "x",
    addBlur: false,
    blur: 8,
    exitStyle: "continue",
    ease: "easeOut",
    bounce: 0.45,
    duration: 0.45,
    exitDuration: 0.35,
    stagger: 0.06,
    order: "start",
    hold: 1.6,
    caret: true,
    splitBy: "auto",
    loop: true,
    pauseOnHover: false,
    startInView: false,
}

const isText = (p: Props) =>
    p.effect === "typewriter" || p.effect === "scramble"

addPropertyControls(AnimatedTextRotatorVF, {
    words: {
        type: ControlType.Array,
        title: "Words",
        control: { type: ControlType.String },
        defaultValue: ["你好,", "नमस्ते,", "Hola,", "Hello,"],
    },

    size: {
        type: ControlType.Number,
        title: "Size",
        min: 8,
        max: 600,
        step: 1,
        unit: "px",
        defaultValue: 48,
        hidden: (p: Props) => p.fitToFrame,
        description:
            "Set the text size in pixels. This replaces the size in the font menu.",
    },
    fitToFrame: {
        type: ControlType.Boolean,
        title: "Fit to frame",
        defaultValue: false,
        description:
            "On: the text scales with the frame's width, so you can drag the edges to resize it.",
    },
    font: {
        // @ts-ignore Framer font control
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#ffffff",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },

    effect: {
        type: ControlType.Enum,
        title: "Transition",
        options: [
            "blur",
            "fade",
            "mask",
            "slide",
            "zoom",
            "flip",
            "drop",
            "wave",
            "typewriter",
            "scramble",
        ],
        optionTitles: [
            "Blur",
            "Fade",
            "Mask reveal",
            "Slide",
            "Zoom",
            "Flip 3D",
            "Drop & bounce",
            "Wave",
            "Typewriter",
            "Scramble",
        ],
        defaultValue: "blur",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down", "left", "right"],
        optionTitles: ["Up", "Down", "Left", "Right"],
        defaultValue: "up",
        hidden: (p: Props) => p.effect !== "slide" && p.effect !== "mask",
    },
    distance: {
        type: ControlType.Number,
        title: "Distance",
        min: 0.1,
        max: 3,
        step: 0.05,
        unit: "em",
        defaultValue: 0.6,
        hidden: (p: Props) =>
            p.effect !== "slide" && p.effect !== "drop" && p.effect !== "wave",
    },
    scaleFrom: {
        type: ControlType.Number,
        title: "Scale from",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.6,
        hidden: (p: Props) => p.effect !== "zoom",
    },
    flipAxis: {
        type: ControlType.Enum,
        title: "Flip axis",
        options: ["x", "y"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "x",
        displaySegmentedControl: true,
        hidden: (p: Props) => p.effect !== "flip",
    },
    addBlur: {
        type: ControlType.Boolean,
        title: "Add blur",
        defaultValue: false,
        hidden: (p: Props) =>
            p.effect === "blur" || p.effect === "fade" || isText(p),
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        defaultValue: 8,
        hidden: (p: Props) =>
            isText(p) ||
            p.effect === "fade" ||
            (p.effect !== "blur" && !p.addBlur),
    },
    exitStyle: {
        type: ControlType.Enum,
        title: "Exit",
        options: ["continue", "reverse"],
        optionTitles: ["Continue", "Reverse"],
        defaultValue: "continue",
        displaySegmentedControl: true,
        hidden: (p: Props) =>
            !["slide", "mask", "zoom", "flip", "drop"].includes(p.effect),
    },
    ease: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "easeOut",
            "easeInOut",
            "easeIn",
            "linear",
            "backOut",
            "spring",
        ],
        optionTitles: [
            "Ease Out",
            "Ease In Out",
            "Ease In",
            "Linear",
            "Back Out",
            "Spring",
        ],
        defaultValue: "easeOut",
        hidden: (p: Props) => isText(p) || p.effect === "drop",
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        min: 0,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.45,
        hidden: (p: Props) =>
            isText(p) ||
            p.effect === "wave" ||
            (p.effect !== "drop" && p.ease !== "spring"),
    },
    duration: {
        type: ControlType.Number,
        title: "Enter time",
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: 0.45,
        hidden: (p: Props) => p.effect === "typewriter",
    },
    exitDuration: {
        type: ControlType.Number,
        title: "Exit time",
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: 0.35,
        hidden: (p: Props) => isText(p),
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 0.3,
        step: 0.01,
        unit: "s",
        defaultValue: 0.06,
        description:
            "Delay between letters. For Typewriter, this is the time per letter.",
    },
    order: {
        type: ControlType.Enum,
        title: "Order",
        options: ["start", "end", "center", "random"],
        optionTitles: ["Start", "End", "Center out", "Random"],
        defaultValue: "start",
        hidden: (p: Props) => p.effect === "typewriter",
    },
    caret: {
        type: ControlType.Boolean,
        title: "Caret",
        defaultValue: true,
        hidden: (p: Props) => p.effect !== "typewriter",
    },
    hold: {
        type: ControlType.Number,
        title: "Hold",
        min: 0,
        max: 6,
        step: 0.1,
        unit: "s",
        defaultValue: 1.6,
    },

    splitBy: {
        type: ControlType.Enum,
        title: "Split by",
        options: ["auto", "character", "word"],
        optionTitles: ["Auto", "Character", "Word"],
        defaultValue: "auto",
        hidden: (p: Props) => isText(p),
        description:
            "Auto keeps Persian and Arabic words joined so their letters stay connected.",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on hover",
        defaultValue: false,
    },
    startInView: {
        type: ControlType.Boolean,
        title: "Start in view",
        defaultValue: false,
    },
})
