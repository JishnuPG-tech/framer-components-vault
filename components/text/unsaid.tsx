import { startTransition, useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion } from "framer-motion"

type Align = "left" | "center" | "right"
type Caret = "bar" | "block" | "underscore"
type StreamBy = "word" | "char"
type ClearStyle = "select" | "backspace"
type EndingTone = "ghost" | "ink" | "accent" | "held" | "leaving"
type Trigger = "view" | "hover" | "scroll"
type Phase = "stem" | "think" | "ghost" | "wait" | "sweep" | "hold" | "clear" | "done"

type Timing = {
    typeSpeed: number
    streamSpeed: number
    thinkDelay: number
    acceptDelay: number
    holdDelay: number
    streamBy: StreamBy
    clearStyle: ClearStyle
    caretBlink: boolean
    hint: boolean
    sweep: boolean
    loop: boolean
    startOnView: boolean
    pauseOnHover: boolean
    clickToAccept: boolean
}

type Behavior = Pick<Timing, "sweep" | "loop" | "startOnView" | "pauseOnHover" | "clickToAccept">

type Props = {
    text: string
    completions: string[]
    hint?: { show?: boolean; label?: string }
    caretOptions?: { style?: Caret; blink?: boolean }
    behavior?: Partial<Behavior>
    look?: {
        font?: CSSProperties
        textColor?: unknown
        ghostColor?: unknown
        accentColor?: unknown
        align?: Align
    }
    timing?: Partial<Timing>
    trigger?: Trigger
    scrollStep?: number
    style?: CSSProperties
}

type View = {
    stem: string
    ending: string
    tone: EndingTone
    showHint: boolean
    hintPressed: boolean
    caretIdle: boolean
}

const STEM = "It holds"
const ENDINGS = [
    " the line.",
    " still.",
    " again.",
]

const TIMING: Timing = {
    typeSpeed: 45,
    streamSpeed: 70,
    thinkDelay: 600,
    acceptDelay: 1200,
    holdDelay: 1800,
    streamBy: "word",
    clearStyle: "select",
    caretBlink: true,
    hint: true,
    sweep: true,
    loop: true,
    startOnView: true,
    pauseOnHover: true,
    clickToAccept: true,
}

const MOTION_CSS = [
    "@keyframes unsaid-caret { 0%, 45% { opacity: 1 } 55%, 100% { opacity: 0 } }",
    "@keyframes unsaid-sweep { from { background-position: 100% 0, 100% 0.12em } to { background-position: 0 0, 0 0.12em } }",
    "@keyframes unsaid-leave { from { clip-path: inset(0 0 0 0); -webkit-clip-path: inset(0 0 0 0) } to { clip-path: inset(0 0 0 100%); -webkit-clip-path: inset(0 0 0 100%) } }",
].join("\n")

function colorOf(value: unknown, fallback: string): string {
    if (typeof value === "string" && value.trim() !== "") return value
    if (value && typeof value === "object" && "value" in value) {
        const inner = (value as { value: unknown }).value
        if (typeof inner === "string" && inner.trim() !== "") return inner
    }
    return fallback
}

function cssColor(value: string): string {
    if (/^[#(),.%/a-zA-Z0-9 -]+$/.test(value)) return value
    return "#5227FF"
}

function focusRule(scope: string, accent: string): string {
    return (
        String.fromCharCode(10) +
        "[data-unsaid='" +
        scope +
        "']:focus-visible{outline:2px solid " +
        accent +
        ";outline-offset:6px}"
    )
}

function piecesOf(completion: string, by: StreamBy): string[] {
    if (by === "char") return Array.from(completion)
    const parts = completion.split(/(\s+)/)
    const words: string[] = []
    let buffer = ""
    for (const part of parts) {
        if (part.trim() === "") {
            buffer += part
        } else {
            words.push(buffer + part)
            buffer = ""
        }
    }
    if (buffer) {
        if (words.length === 0) words.push(buffer)
        else words[words.length - 1] += buffer
    }
    return words.filter((word) => word.length > 0)
}

function poster(stem: string, ending: string): View {
    return {
        stem,
        ending,
        tone: "ghost",
        showHint: false,
        hintPressed: false,
        caretIdle: true,
    }
}

function luminance(color: string): number {
    const hex = color.trim()
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return 0
    const lin = (pair: string) => {
        const channel = parseInt(pair, 16) / 255
        return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * lin(hex.slice(1, 3)) + 0.7152 * lin(hex.slice(3, 5)) + 0.0722 * lin(hex.slice(5, 7))
}

function knockOut(ground: string, ink: string): string {
    const paper = "#FFFFFF"
    if (!/^#[0-9a-fA-F]{6}$/.test(ground.trim())) return paper
    const ratio = (color: string) => {
        const hi = Math.max(luminance(color), luminance(ground))
        const lo = Math.min(luminance(color), luminance(ground))
        return (hi + 0.05) / (lo + 0.05)
    }
    return ratio(paper) >= ratio(ink) ? paper : ink
}
function mixBlack(hex: string, keep: number): string {
    const channel = (pair: string) => Math.round((parseInt(pair, 16) * keep) / 100)
    const byte = (n: number) => n.toString(16).padStart(2, "0")
    return "#" + byte(channel(hex.slice(1, 3))) + byte(channel(hex.slice(3, 5))) + byte(channel(hex.slice(5, 7)))
}

function mixWhite(hex: string, keep: number): string {
    const channel = (pair: string) => Math.round((parseInt(pair, 16) * keep + 255 * (100 - keep)) / 100)
    const byte = (n: number) => n.toString(16).padStart(2, "0")
    return "#" + byte(channel(hex.slice(1, 3))) + byte(channel(hex.slice(3, 5))) + byte(channel(hex.slice(5, 7)))
}
function pairContrast(a: string, b: string): number {
    const hi = Math.max(luminance(a), luminance(b))
    const lo = Math.min(luminance(a), luminance(b))
    return (hi + 0.05) / (lo + 0.05)
}
function caretMark(accent: string, ground: string): string {
    const mark = accent.trim()
    const paper = ground.trim()
    if (!/^#[0-9a-fA-F]{6}$/.test(mark) || !/^#[0-9a-fA-F]{6}$/.test(paper)) return accent
    if (pairContrast(mark, paper) >= 3) return mark
    const dark = luminance(paper) < 0.18
    for (let keep = 96; keep >= 0; keep -= 4) {
        const mixed = dark ? mixWhite(mark, keep) : mixBlack(mark, keep)
        if (pairContrast(mixed, paper) >= 3) return mixed
    }
    return dark ? "#FFFFFF" : "#000000"
}
function hexOf(value: string): string {
    const raw = value.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw
    const match = raw.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
    if (!match) return raw
    const byte = (channel: string) =>
        Math.max(0, Math.min(255, Math.round(Number(channel)))).toString(16).padStart(2, "0")
    return "#" + byte(match[1]) + byte(match[2]) + byte(match[3])
}
function whiteRatio(hex: string): number {
    return 1.05 / (luminance(hex) + 0.05)
}

function slabPaint(ground: string, ink: string): string {
    const hex = ground.trim()
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "color-mix(in srgb, " + ground + " 96%, black)"
    const paper = 1.05 / (Math.min(luminance("#FFFFFF"), luminance(hex)) + 0.05)
    const onInk = (Math.max(luminance(ink), luminance(hex)) + 0.05) / (Math.min(luminance(ink), luminance(hex)) + 0.05)
    if (paper < onInk || paper >= 4.5) return hex
    for (let keep = 99; keep >= 60; keep--) {
        const mixed = mixBlack(hex, keep)
        if (whiteRatio(mixed) >= 4.5) return mixed
    }
    return mixBlack(hex, 60)
}
function sweepFilm(ink: string, ghost: string, accent: string): CSSProperties {
    const paint = slabPaint(ghost, ink)
    const face = knockOut(ghost, ink)
    const band =
        "linear-gradient(90deg, " + ink + " 0%, " + ink + " 31.25%, " + accent + " 36%, " + face + " 42%, " + face + " 100%)"
    const block =
        "linear-gradient(90deg, transparent 0%, transparent 31.25%, " + paint + " 42%, " + paint + " 100%)"
    return {
        color: "transparent",
        backgroundImage: band + ", " + block,
        backgroundSize: "320% 100%, 320% 1.15em",
        backgroundPosition: "0 0, 0 0.12em",
        backgroundRepeat: "no-repeat, no-repeat",
        WebkitBackgroundClip: "text, border-box",
        backgroundClip: "text, border-box",
    }
}

function endingStyle(
    tone: EndingTone,
    ink: string,
    ghost: string,
    accent: string,
    sweep: boolean
): CSSProperties {
    const seat: CSSProperties = {
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
        padding: "0 0.08em",
        marginLeft: "-0.08em",
        verticalAlign: "baseline",
    }
    const curve = "cubic-bezier(0.23, 1, 0.32, 1)"
    switch (tone) {
        case "ghost":
            return {
                ...seat,
                color: knockOut(ghost, ink),
                backgroundColor: "transparent",
                backgroundImage: "linear-gradient(" + slabPaint(ghost, ink) + ", " + slabPaint(ghost, ink) + ")",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 1.15em",
                backgroundPosition: "0 0.12em",
            }
        case "ink":
            return { ...seat, color: ink }
        case "accent": {
            if (!sweep) return { ...seat, color: ink }
            return {
                ...seat,
                ...sweepFilm(ink, ghost, accent),
                backgroundPosition: "100% 0, 100% 0.12em",
                animation: "unsaid-sweep 640ms " + curve + " forwards",
            }
        }
        case "held":
            return sweep ? { ...seat, ...sweepFilm(ink, ghost, accent) } : { ...seat, color: ink }
        case "leaving":
            return {
                ...(sweep ? { ...seat, ...sweepFilm(ink, ghost, accent) } : { ...seat, color: ink }),
                animation: "unsaid-leave 280ms " + curve + " forwards",
            }
        default: {
            const neverTone: never = tone
            return neverTone
        }
    }
}

function resolveColor(value: string, host: HTMLElement | null): string {
    let current = value.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(current)) return current
    if (!host || typeof window === "undefined" || typeof document === "undefined") return value
    for (let depth = 0; depth < 4; depth++) {
        const variable = current.match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*(.+))?\)$/)
        if (!variable) break
        const declared = window.getComputedStyle(host).getPropertyValue(variable[1]).trim()
        current = declared || (variable[2] ?? "").trim()
        if (!current) return value
    }
    const context = document.createElement("canvas").getContext("2d")
    if (!context) return value
    const sentinel = "#010203"
    context.fillStyle = sentinel
    context.fillStyle = current
    const parsed = String(context.fillStyle)
    if (parsed === sentinel && current.toLowerCase() !== sentinel) return value
    if (/^#[0-9a-fA-F]{6}$/.test(parsed)) return parsed
    const channels = parsed.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
    if (!channels) return value
    const byte = (channel: string) =>
        Math.max(0, Math.min(255, Math.round(Number(channel)))).toString(16).padStart(2, "0")
    return "#" + byte(channels[1]) + byte(channels[2]) + byte(channels[3])
}

function usePaintColor(value: string, hostRef: RefObject<HTMLElement | null>): string {
    const [paint, setPaint] = useState(value)
    useEffect(() => {
        const update = () => {
            const next = resolveColor(value, hostRef.current)
            startTransition(() => setPaint((prev) => (prev === next ? prev : next)))
        }
        update()
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
        const scheme = window.matchMedia("(prefers-color-scheme: dark)")
        scheme.addEventListener("change", update)
        return () => scheme.removeEventListener("change", update)
    }, [value, hostRef])
    return paint
}

function caretBox(kind: Caret, accent: string, blink: boolean): CSSProperties {
    const shared: CSSProperties = {
        display: "inline-block",
        background: accent,
        marginLeft: 2,
        animation: blink ? "unsaid-caret 1.05s step-end infinite" : undefined,
    }
    switch (kind) {
        case "bar":
            return { ...shared, width: 2, height: "0.72em", verticalAlign: "baseline" }
        case "block":
            return { ...shared, width: "0.5em", height: "0.72em", verticalAlign: "baseline" }
        case "underscore":
            return { ...shared, width: "0.55em", height: 2, verticalAlign: "baseline" }
        default: {
            const neverCaret: never = kind
            return neverCaret
        }
    }
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 880
 * @framerIntrinsicHeight 160
 */
export default function Unsaid(props: Props) {
    const {
        text = STEM,
        completions = ENDINGS,
        hint,
        caretOptions,
        behavior,
        look,
        timing,
        trigger = "view",
        scrollStep = 240,
        style,
    } = props
    const font = look?.font
    const textColor = look?.textColor
    const ghostColor = look?.ghostColor
    const accentColor = look?.accentColor
    const align: Align = look?.align ?? "center"
    const pace: Timing = {
        ...TIMING,
        ...(timing ?? {}),
        ...(behavior ?? {}),
        hint: hint?.show ?? TIMING.hint,
        caretBlink: caretOptions?.blink ?? TIMING.caretBlink,
    }
    const hintLabel = hint?.label ?? "Enter"
    const caret: Caret = caretOptions?.style ?? "bar"
    const endings = (Array.isArray(completions) ? completions : ENDINGS).filter(
        (item) => typeof item === "string" && item.trim() !== ""
    )
    const ink = colorOf(textColor, "#141413")
    const ghost = colorOf(ghostColor, "#7A7A74")
    const accent = colorOf(accentColor, "#5227FF")
    const reduce = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    const target = RenderTarget.current()
    const freeze = reduce === true || isStatic || target === RenderTarget.thumbnail
    const rootRef = useRef<HTMLDivElement>(null)
    const pausedRef = useRef(false)
    const offscreenRef = useRef(false)
    const skipRef = useRef(false)
    const scope = useId().replace(/[^A-Za-z0-9_-]/g, "") || "unsaid"
    const phaseRef = useRef<Phase>("done")
    const gateRef = useRef(false)
    const hoverModeRef = useRef(false)
    const targetRef = useRef(0)
    const shownRef = useRef(0)
    const startRef = useRef<(() => void) | null>(null)
    const [view, setView] = useState<View>(() =>
        freeze || trigger !== "view"
            ? poster(text, endings[0] ?? "")
            : { stem: "", ending: "", tone: "ghost", showHint: false, hintPressed: false, caretIdle: true }
    )
    const [alive, setAlive] = useState(false)
    const [scale, setScale] = useState(1)
    const [fitted, setFitted] = useState(false)
    const paintInk = usePaintColor(ink, rootRef)
    const paintGhost = usePaintColor(ghost, rootRef)
    const paintAccent = usePaintColor(accent, rootRef)
    const probeRef = useRef<HTMLSpanElement>(null)
    const boxRef = useRef<HTMLElement | null>(null)
    const [linePx, setLinePx] = useState(0)
    const endingKey = endings.join("\n")

    useEffect(() => {
        if (freeze) {
            phaseRef.current = "done"
            startTransition(() => {
                setAlive(false)
                setView(poster(text, endings[0] ?? ""))
            })
            return
        }
        if (typeof window === "undefined") return
        const node = rootRef.current
        const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches
        const mode: Trigger = trigger === "hover" && !canHover ? "view" : trigger
        let stop = false
        let timer = 0
        let frameId = 0
        let scrollFrame = 0
        let origin: number | null = null
        let wake: (() => void) | null = null
        let observer: IntersectionObserver | null = null
        hoverModeRef.current = mode === "hover"
        gateRef.current = mode === "hover"
        skipRef.current = false
        targetRef.current = 0
        shownRef.current = 0
        const wait = (ms: number) =>
            new Promise<void>((resolve) => {
                let left = ms
                const tick = () => {
                    if (stop || skipRef.current) {
                        resolve()
                        return
                    }
                    if (mode === "scroll" && targetRef.current !== shownRef.current) {
                        resolve()
                        return
                    }
                    const held =
                        mode === "scroll"
                            ? offscreenRef.current
                            : pausedRef.current || offscreenRef.current || gateRef.current
                    if (held) {
                        timer = window.setTimeout(tick, 60)
                        return
                    }
                    if (left <= 0) {
                        resolve()
                        return
                    }
                    const slice = Math.min(60, left)
                    left -= slice
                    timer = window.setTimeout(tick, slice)
                }
                tick()
            })
        const until = (ready: () => boolean) =>
            new Promise<void>((resolve) => {
                const check = () => {
                    if (stop || ready()) {
                        wake = null
                        resolve()
                    }
                }
                wake = check
                check()
            })
        const show = (next: View) => {
            if (!stop) startTransition(() => setView(next))
        }
        const stream = async (ending: string) => {
            phaseRef.current = "think"
            show({ stem: text, ending: "", tone: "ghost", showHint: false, hintPressed: false, caretIdle: true })
            await wait(pace.thinkDelay)
            if (stop) return false
            const pieces = piecesOf(ending, pace.streamBy)
            const pieceDelay = pace.streamBy === "char" ? pace.streamSpeed / 3 : pace.streamSpeed
            let shown = ""
            let jumped = false
            phaseRef.current = "ghost"
            for (const piece of pieces) {
                if (stop) return false
                if (skipRef.current) {
                    jumped = true
                    break
                }
                shown += piece
                show({ stem: text, ending: shown, tone: "ghost", showHint: false, hintPressed: false, caretIdle: false })
                await wait(pieceDelay)
                if (stop) return false
            }
            skipRef.current = false
            return jumped
        }
        const accept = async (ending: string) => {
            show({
                stem: text,
                ending,
                tone: pace.sweep ? "accent" : "ink",
                showHint: pace.hint,
                hintPressed: true,
                caretIdle: true,
            })
            phaseRef.current = "sweep"
            await wait(pace.sweep ? 640 : 80)
            if (stop) return
            skipRef.current = false
            show({ stem: text, ending, tone: pace.sweep ? "held" : "ink", showHint: false, hintPressed: false, caretIdle: true })
        }
        const clear = async (ending: string) => {
            phaseRef.current = "clear"
            if (pace.clearStyle === "select") {
                show({ stem: text, ending, tone: "leaving", showHint: false, hintPressed: false, caretIdle: true })
                await wait(280)
                if (stop) return
                show({ stem: text, ending: "", tone: "ghost", showHint: false, hintPressed: false, caretIdle: true })
                await wait(160)
                return
            }
            let left = ending
            while (left.length > 0) {
                if (stop) return
                left = left.slice(0, -1)
                show({ stem: text, ending: left, tone: "ink", showHint: false, hintPressed: false, caretIdle: false })
                await wait(Math.max(16, pace.typeSpeed * 0.6))
            }
        }
        const play = async () => {
            startTransition(() => setAlive(true))
            if (mode === "view") {
                let built = ""
                phaseRef.current = "stem"
                for (const char of Array.from(text)) {
                    if (stop) return
                    built += char
                    show({ stem: built, ending: "", tone: "ghost", showHint: false, hintPressed: false, caretIdle: false })
                    await wait(pace.typeSpeed)
                    if (stop) return
                }
            }
            if (endings.length === 0) {
                show(poster(text, ""))
                startTransition(() => setAlive(false))
                phaseRef.current = "done"
                return
            }
            if (mode === "scroll") {
                let index = targetRef.current
                shownRef.current = index
                while (!stop) {
                    const ending = endings[index] ?? ""
                    await stream(ending)
                    if (stop) return
                    await accept(ending)
                    if (stop) return
                    phaseRef.current = "hold"
                    const current = index
                    await until(() => targetRef.current !== current)
                    if (stop) return
                    index = targetRef.current
                    shownRef.current = index
                    await clear(ending)
                    if (stop) return
                }
                return
            }
            let index = 0
            while (!stop) {
                const ending = endings[index] ?? ""
                const jumped = await stream(ending)
                if (stop) return
                phaseRef.current = "wait"
                if (!jumped) {
                    show({ stem: text, ending, tone: "ghost", showHint: pace.hint, hintPressed: false, caretIdle: true })
                    await wait(pace.acceptDelay)
                    if (stop) return
                    skipRef.current = false
                }
                await accept(ending)
                if (stop) return
                const last = index >= endings.length - 1
                if (last && !pace.loop) {
                    show(poster(text, ending))
                    startTransition(() => setAlive(false))
                    phaseRef.current = "done"
                    return
                }
                phaseRef.current = "hold"
                await wait(pace.holdDelay)
                if (stop) return
                skipRef.current = false
                await clear(ending)
                if (stop) return
                index = (index + 1) % endings.length
            }
        }
        let started = false
        const begin = () => {
            if (started || stop) return
            started = true
            void play()
        }
        startRef.current = mode === "hover" ? begin : null
        const onScroll = () => {
            window.cancelAnimationFrame(scrollFrame)
            scrollFrame = window.requestAnimationFrame(() => {
                if (origin === null) return
                const step = Math.max(20, scrollStep)
                const next = Math.max(0, Math.min(endings.length - 1, Math.floor((window.scrollY - origin) / step)))
                if (next === targetRef.current) return
                targetRef.current = next
                wake?.()
            })
        }
        const startsOnEntry = mode === "scroll" || (mode === "view" && pace.startOnView)
        if (node) {
            observer = new IntersectionObserver(
                (entries) => {
                    const visible = entries.some((entry) => entry.isIntersecting)
                    offscreenRef.current = !visible
                    if (visible && origin === null) origin = window.scrollY
                    if (visible && startsOnEntry) begin()
                },
                { threshold: 0.4 }
            )
            observer.observe(node)
            if (startsOnEntry) {
                frameId = window.requestAnimationFrame(() => {
                    if (started || stop) return
                    const rect = node.getBoundingClientRect()
                    const viewH = window.innerHeight || 0
                    if (rect.height > 0 && rect.top < viewH && rect.bottom > 0) {
                        if (origin === null) origin = window.scrollY
                        begin()
                    }
                })
            }
        }
        if (mode === "scroll") window.addEventListener("scroll", onScroll, { passive: true })
        if (!node || (mode === "view" && !pace.startOnView)) begin()
        return () => {
            stop = true
            wake?.()
            startRef.current = null
            hoverModeRef.current = false
            window.clearTimeout(timer)
            window.cancelAnimationFrame(frameId)
            window.cancelAnimationFrame(scrollFrame)
            window.removeEventListener("scroll", onScroll)
            observer?.disconnect()
            startTransition(() => setAlive(false))
        }
    }, [
        freeze,
        trigger,
        scrollStep,
        text,
        endingKey,
        pace.typeSpeed,
        pace.streamSpeed,
        pace.thinkDelay,
        pace.acceptDelay,
        pace.holdDelay,
        pace.streamBy,
        pace.clearStyle,
        pace.hint,
        pace.sweep,
        pace.loop,
        pace.startOnView,
        pace.clickToAccept,
    ])

    const longest = endings.reduce((best, item) => (item.length > best.length ? item : best), "")
    const measure = longest.trim()
    const place = align === "left" ? "left" : align === "right" ? "right" : "center"
    const rawSize = font?.fontSize
    const candidate = typeof rawSize === "number" ? rawSize + "px" : typeof rawSize === "string" ? rawSize.trim() : ""
    const cap = /^[0-9.]+(px|rem|em)$/.test(candidate) ? candidate : "56px"
    useEffect(() => {
        if (typeof ResizeObserver === "undefined") return
        const box = boxRef.current
        const probe = probeRef.current
        if (!box || !probe) return
        let frame = 0
        const fit = () => {
            const slot = rootRef.current
            const available = slot && slot.clientWidth > 0 ? slot.clientWidth : box.clientWidth
            const needed = probe.scrollWidth
            if (available <= 0 || needed <= 0) return
            const next = Math.min(1, (available - 8) / needed)
            const rendered = needed * next
            startTransition(() => {
                setScale((prev) => (Math.abs(prev - next) < 0.01 ? prev : next))
                setFitted(true)
                setLinePx((prev) => (Math.abs(prev - rendered) < 1 ? prev : Math.ceil(rendered)))
            })
        }
        const observer = new ResizeObserver(() => {
            window.cancelAnimationFrame(frame)
            frame = window.requestAnimationFrame(fit)
        })
        observer.observe(box)
        if (rootRef.current) observer.observe(rootRef.current)
        fit()
        return () => {
            window.cancelAnimationFrame(frame)
            observer.disconnect()
        }
    }, [text, measure, hintLabel, cap, pace.hint, pace.clickToAccept, freeze])
    const typeface: CSSProperties = {
        ...(font ?? { fontSize: "56px", lineHeight: "1.08em", letterSpacing: "0em", fontWeight: 600 }),
        textAlign: "left",
        lineHeight: font?.lineHeight ?? "1.08em",
        fontSize: fitted ? "calc(" + cap + " * " + String(scale) + ")" : "min(" + cap + ", 9cqi)",
    }
    const frame: CSSProperties = {
        position: "relative",
        width: "100%",
        outline: "none",
        outlineOffset: 6,
        boxSizing: "border-box",
        ...style,
    }
    Object.assign(frame, { containerType: "inline-size", display: "grid", alignItems: "center", height: "auto", textAlign: place, WebkitFontSmoothing: "antialiased", minWidth: 0 })
    const heading: CSSProperties = {
        ...typeface,
        margin: 0,
        width: "100%",
        maxWidth: "100%",
        color: ink,
        userSelect: "none",
        textAlign: place,
    }
    const measureBox: CSSProperties = {
        position: "relative",
        textAlign: "left",
        maxWidth: "100%",
        verticalAlign: "top",
    }
    const justify = align === "left" ? "start" : align === "right" ? "end" : "center"
    Object.assign(heading, { display: "grid", height: "auto", alignItems: "center", justifyItems: justify, padding: "0.12em clamp(8px, 2cqi, 20px)", minWidth: 0 })
    Object.assign(measureBox, { width: linePx > 0 ? linePx + "px" : "100%", justifySelf: justify, minWidth: 0, cursor: pace.clickToAccept && !freeze ? "pointer" : "default", display: "block", margin: 0, padding: 0, border: 0, background: "transparent", font: "inherit", color: "inherit", letterSpacing: "inherit", lineHeight: "inherit", textTransform: "inherit", appearance: "none", WebkitAppearance: "none", WebkitTapHighlightColor: "transparent" })
    const blink = alive && pace.caretBlink && view.caretIdle && !freeze
    const mark = caretMark(paintAccent, luminance(hexOf(paintInk)) > 0.5 ? "#262626" : "#FFFFFF")
    const interactive = pace.clickToAccept && !freeze
    const Line = interactive ? "button" : "span"
    const accept = () => {
        if (!interactive) return
        const phase = phaseRef.current
        if (phase === "ghost" || phase === "wait" || phase === "sweep" || phase === "hold") skipRef.current = true
    }
    return (
        <div
            ref={rootRef}
            onMouseEnter={() => {
                if (hoverModeRef.current) {
                    gateRef.current = false
                    startRef.current?.()
                    return
                }
                if (trigger !== "view" || !pace.pauseOnHover || typeof window === "undefined") return
                if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
                pausedRef.current = true
            }}
            onMouseLeave={() => {
                pausedRef.current = false
                if (hoverModeRef.current) gateRef.current = true
            }}
            onFocus={() => {
                if (!hoverModeRef.current) return
                gateRef.current = false
                startRef.current?.()
            }}
            onBlur={() => {
                if (hoverModeRef.current) gateRef.current = true
            }}
            style={frame}
        >
            {freeze ? null : (
                <style dangerouslySetInnerHTML={{ __html: MOTION_CSS + focusRule(scope, cssColor(accent)) }} />
            )}
            <h2 aria-labelledby={scope + "-said"} style={heading}>
                <span id={scope + "-said"} style={{ position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}>
                    {text + (endings[0] ?? "")}
                </span>
                <Line
                ref={(node: HTMLElement | null) => {
                    boxRef.current = node
                }}
                data-unsaid={scope}
                type={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-label={interactive ? "Accept the suggestion" : undefined}
                aria-hidden={interactive ? undefined : true}
                onClick={interactive ? accept : undefined}
                style={measureBox}
            >
                <span ref={probeRef} aria-hidden style={{ position: "absolute", visibility: "hidden", whiteSpace: "nowrap", fontSize: cap, pointerEvents: "none" }}>
                    {text || " "} <span style={{ marginLeft: "-0.08em", padding: "0 0.08em" }}>{longest.trim() || " "}</span><span style={{ display: "inline-block", width: 4, marginLeft: 2 }} />{pace.hint ? <span style={{ fontSize: "0.28em", lineHeight: 1, marginLeft: "0.45em", padding: "0.02em 0.35em" }}>{hintLabel}</span> : null}
                </span>
                <span aria-hidden style={{ visibility: "hidden", whiteSpace: "nowrap" }}>
                    {text || " "} <span style={{ marginLeft: "-0.08em", padding: "0 0.08em" }}>{longest.trim() || " "}</span><span style={{ display: "inline-block", width: 4, marginLeft: 2 }} />{pace.hint ? <span style={{ fontSize: "0.28em", lineHeight: 1, marginLeft: "0.45em", padding: "0.02em 0.35em" }}>{hintLabel}</span> : null}
                </span>
                <span aria-hidden style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}>
                    {view.stem}
                    {view.tone === "leaving" ? <span style={caretBox(caret, mark, blink)} /> : null}
                    {view.ending ? (
                        <>
                        {" "}
                        <span style={endingStyle(view.tone, paintInk, paintGhost, accent, pace.sweep && !freeze)}>
                            {view.ending.trimStart()}
                        </span>
                        </>
                    ) : null}
                    {view.tone === "leaving" ? null : <span style={caretBox(caret, mark, blink)} />}
                    <span
                        aria-hidden={!view.showHint}
                        style={{
                            display: "inline-block",
                            marginLeft: "0.45em",
                            padding: "0.02em 0.35em",
                            border: "1px solid transparent",
                            borderColor: view.showHint ? (view.hintPressed ? accent : ink) : "transparent",
                            borderRadius: 0,
                            fontSize: "0.28em",
                            lineHeight: 1,
                            letterSpacing: 0,
                            verticalAlign: "1.05em",
                            visibility: view.showHint ? "visible" : "hidden",
                            color: view.hintPressed ? knockOut(paintAccent, paintInk) : ink,
                            background: view.hintPressed ? accent : "transparent",
                            
                        }}
                    >
                        {hintLabel}
                    </span>
                </span>
            </Line>
            </h2>
        </div>
    )
}

Unsaid.displayName = "Unsaid"

addPropertyControls(Unsaid, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: STEM,
        description: "The part that types first and stays.",
    },
    completions: {
        type: ControlType.Array,
        title: "Completions",
        control: { type: ControlType.String, defaultValue: " the line." },
        defaultValue: ENDINGS,
        maxCount: 8,
        description: "Endings, one after another. Start with a space when the ending follows a word. The sentence stays on one line and shrinks to fit, so keep endings short.",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["view", "hover", "scroll"],
        optionTitles: ["In view", "Hover", "Scroll"],
        defaultValue: "view",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        description: "In view plays the cycle on its own. Hover plays while the pointer or focus is on it (in view on touch screens). Scroll moves to the next ending every Scroll step.",
    },
    scrollStep: {
        type: ControlType.Number,
        title: "Scroll step",
        defaultValue: 240,
        min: 60,
        max: 1200,
        step: 10,
        unit: "px",
        description: "Scroll distance per ending, counted from where the line comes into view. Scrolling back goes back.",
        hidden: (props: Partial<Props>) => props.trigger !== "scroll",
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        buttonTitle: "Style",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                description: "Size is the largest the line gets. It shrinks to fit narrower frames.",
                defaultFontType: "sans-serif",
                controls: "extended",
                displayTextAlignment: false,
                defaultValue: {
                    fontSize: "56px",
                    lineHeight: "1.08em",
                    letterSpacing: "0em",
                    textAlign: "left",
                    variant: "Semibold",
                },
            },
            textColor: { type: ControlType.Color, title: "Text color", defaultValue: "#141413" },
            ghostColor: {
                type: ControlType.Color,
                title: "Ghost color",
                defaultValue: "#7A7A74",
                description: "Colors the ending block. The paint darkens slightly so the words stay readable.",
            },
            accentColor: { type: ControlType.Color, title: "Accent color", defaultValue: "#5227FF" },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "center",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
        },
    },
    caretOptions: {
        type: ControlType.Object,
        title: "Caret",
        buttonTitle: "Caret",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["bar", "block", "underscore"],
                optionTitles: ["Bar", "Block", "Underscore"],
                defaultValue: "bar",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            blink: { type: ControlType.Boolean, title: "Blink", defaultValue: true },
        },
    },
    hint: {
        type: ControlType.Object,
        title: "Hint",
        buttonTitle: "Hint",
        description: "The key chip shown while an ending waits to be accepted.",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Enter",
                hidden: (props: { show?: boolean }) => props.show === false,
            },
        },
    },
    timing: {
        type: ControlType.Object,
        title: "Timing",
        buttonTitle: "Timing",
        description: "Speeds and pauses of the cycle.",
        controls: {
            typeSpeed: { type: ControlType.Number, title: "Type speed", defaultValue: 45, min: 10, max: 200, step: 1, unit: "ms" },
            streamSpeed: { type: ControlType.Number, title: "Stream speed", defaultValue: 70, min: 10, max: 300, step: 1, unit: "ms" },
            streamBy: {
                type: ControlType.Enum,
                title: "Stream by",
                options: ["word", "char"],
                optionTitles: ["Word", "Character"],
                defaultValue: "word",
                displaySegmentedControl: true,
            },
            thinkDelay: { type: ControlType.Number, title: "Think delay", defaultValue: 600, min: 0, max: 4000, step: 10, unit: "ms" },
            acceptDelay: { type: ControlType.Number, title: "Accept delay", defaultValue: 1200, min: 0, max: 6000, step: 10, unit: "ms", hidden: (_: unknown, root: Partial<Props>) => root?.trigger === "scroll" },
            holdDelay: { type: ControlType.Number, title: "Hold delay", defaultValue: 1800, min: 0, max: 8000, step: 10, unit: "ms", hidden: (_: unknown, root: Partial<Props>) => root?.trigger === "scroll" },
            clearStyle: {
                type: ControlType.Enum,
                title: "Clear style",
                options: ["select", "backspace"],
                optionTitles: ["Select", "Backspace"],
                defaultValue: "select",
                displaySegmentedControl: true,
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        buttonTitle: "Behavior",
        controls: {
            sweep: {
                type: ControlType.Boolean,
                title: "Sweep",
                defaultValue: true,
                description: "The accent passes over the ending when it is accepted.",
            },
            loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true, hidden: (_: unknown, root: Partial<Props>) => root?.trigger === "scroll" },
            startOnView: { type: ControlType.Boolean, title: "Start on view", defaultValue: true, hidden: (_: unknown, root: Partial<Props>) => (root?.trigger ?? "view") !== "view" },
            pauseOnHover: { type: ControlType.Boolean, title: "Pause on hover", defaultValue: true, hidden: (_: unknown, root: Partial<Props>) => (root?.trigger ?? "view") !== "view" },
            clickToAccept: {
                type: ControlType.Boolean,
                title: "Click to accept",
                defaultValue: true,
                description: "Click, Enter or Space skips to the accepted ending. Tab only moves focus.",
            },
        },
    },
})
