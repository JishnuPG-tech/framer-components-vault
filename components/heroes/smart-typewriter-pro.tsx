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


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Preset = "Hero" | "Subheading" | "Terminal" | "Minimal" | "Custom"
type ContentMode = "lines" | "paragraph"
type TypeMode = "chars" | "words"
type LoopStyle = "delete" | "transition"
type Transition = "Fade" | "SlideUp" | "Blur" | "MaskWipe"
type CaretStyle = "bar" | "block" | "underscore" | "pill"
type WidthBehavior = "Stable" | "Shrink"
type Phase =
    | "idleDelay"
    | "typing"
    | "pauseAfterType"
    | "deleting"
    | "pauseAfterDelete"
    | "transitionOut"
    | "transitionIn"

type Props = {
    preset: Preset
    text: string
    contentMode: ContentMode
    typeMode: TypeMode

    widthBehavior: WidthBehavior

    timelineEnabled: boolean
    timelineJson: string

    enabled: boolean
    loop: boolean
    loopStyle: LoopStyle
    transition: Transition
    transitionDuration: number

    startDelay: number
    typeSpeed: number
    wordDelay: number
    pauseAfterType: number
    deleteSpeed: number
    pauseAfterDelete: number

    humanize: boolean
    humanizeAmount: number

    showCursor: boolean
    caretStyle: CaretStyle
    blinkCursor: boolean
    blinkSpeed: number
    caretGap: number
    caretWidth: number
    caretHeight: number
    caretColorMode: "Match Text" | "Accent" | "Gradient"
    accentColor: string
    caretGradientFrom: string
    caretGradientTo: string
    caretGradientAngle: number

    richText: boolean
    boldWeight: number
    underlineThickness: number

    sound: boolean
    volume: number
    soundEvery: number
    soundHz: number

    responsive: boolean
    breakpoint: number
    responsiveScale: number

    font: any
    color: string
}

type TimelineStep = {
    text: string
    contentMode?: ContentMode
    typeMode?: TypeMode
    pauseAfterType?: number
    loopStyle?: LoopStyle
    transition?: Transition
}

type Segment = {
    text: string
    bold?: boolean
    underline?: boolean
    accent?: boolean
}

type ParsedBlock = {
    raw: string
    plain: string
    segments: Segment[]
    wordTokens: string[]
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const isFiniteNum = (v: any) => typeof v === "number" && isFinite(v)
const canUseDOM =
    typeof window !== "undefined" && typeof document !== "undefined"

function safeJsonParse<T>(value: string): T | null {
    try {
        return JSON.parse(value) as T
    } catch {
        return null
    }
}

function normalizeTextBlocks(text: string, contentMode: ContentMode) {
    const raw = (text || "").replace(/\r\n/g, "\n")
    if (contentMode === "paragraph") return [raw.length ? raw : ""]
    const arr = raw
        .split("\n")
        .map((s) => s.trimEnd())
        .filter((s) => s.length > 0)
    return arr.length ? arr : [""]
}

function fontToCSS(font: any) {
    const f = font || {}
    const align = (f.textAlign || "left") as "left" | "center" | "right"
    const justify =
        align === "left"
            ? "flex-start"
            : align === "right"
              ? "flex-end"
              : "center"

    const fontCss: any = { ...f }
    if (!fontCss.fontFamily && f.family) fontCss.fontFamily = f.family
    delete fontCss.family

    const fs = fontCss.fontSize
    const fontSizePx =
        typeof fs === "number"
            ? fs
            : typeof fs === "string"
              ? parseFloat(fs) || 16
              : 16

    const lh = fontCss.lineHeight
    const lineHeightNum =
        typeof lh === "number"
            ? lh
            : typeof lh === "string"
              ? parseFloat(lh) || undefined
              : undefined

    return { fontCss, align, justify, fontSizePx, lineHeightNum }
}

function presetDefaults(preset: Preset): Partial<Props> {
    if (preset === "Hero")
        return {
            contentMode: "lines",
            typeMode: "chars",
            loopStyle: "transition",
            transition: "MaskWipe",
            transitionDuration: 420,
            typeSpeed: 38,
            wordDelay: 150,
            pauseAfterType: 1100,
            deleteSpeed: 26,
            pauseAfterDelete: 260,
            showCursor: true,
            caretStyle: "bar",
            blinkCursor: true,
            blinkSpeed: 520,
            caretGap: 2,
            humanize: true,
            humanizeAmount: 0.35,
        }

    if (preset === "Subheading")
        return {
            contentMode: "paragraph",
            typeMode: "words",
            loopStyle: "transition",
            transition: "Fade",
            transitionDuration: 320,
            typeSpeed: 55,
            wordDelay: 165,
            pauseAfterType: 900,
            deleteSpeed: 32,
            pauseAfterDelete: 220,
            showCursor: true,
            caretStyle: "underscore",
            blinkCursor: true,
            blinkSpeed: 560,
            caretGap: 2,
            humanize: true,
            humanizeAmount: 0.25,
        }

    if (preset === "Terminal")
        return {
            contentMode: "paragraph",
            typeMode: "chars",
            loopStyle: "delete",
            typeSpeed: 22,
            wordDelay: 120,
            pauseAfterType: 650,
            deleteSpeed: 16,
            pauseAfterDelete: 220,
            showCursor: true,
            caretStyle: "block",
            blinkCursor: true,
            blinkSpeed: 420,
            caretGap: 2,
            humanize: false,
            sound: true,
            soundEvery: 1,
            volume: 0.12,
        }

    if (preset === "Minimal")
        return {
            contentMode: "lines",
            typeMode: "chars",
            loopStyle: "transition",
            transition: "Fade",
            transitionDuration: 260,
            typeSpeed: 45,
            pauseAfterType: 900,
            showCursor: true,
            caretStyle: "bar",
            blinkCursor: true,
            blinkSpeed: 520,
            humanize: false,
            sound: false,
        }

    return {}
}

function parseRich(raw: string, enabled: boolean): ParsedBlock {
    const s = (raw || "").replace(/\r\n/g, "\n")
    if (!enabled) {
        const plain = s
        return {
            raw: s,
            plain,
            segments: [{ text: plain }],
            wordTokens: plain.match(/\S+\s*/g) || [],
        }
    }

    let bold = false
    let underline = false
    let accent = false

    const segments: Segment[] = []
    let plain = ""

    const push = (ch: string) => {
        plain += ch
        const last = segments[segments.length - 1]
        const same =
            last &&
            !!last.bold === bold &&
            !!last.underline === underline &&
            !!last.accent === accent
        if (same) last.text += ch
        else segments.push({ text: ch, bold, underline, accent })
    }

    let i = 0
    while (i < s.length) {
        const ch = s[i]
        if (ch === "<") {
            const end = s.indexOf(">", i)
            if (end === -1) {
                push(ch)
                i++
                continue
            }
            const tag = s
                .slice(i + 1, end)
                .trim()
                .toLowerCase()
            i = end + 1
            if (tag === "b") bold = true
            else if (tag === "/b") bold = false
            else if (tag === "u") underline = true
            else if (tag === "/u") underline = false
            else if (tag === "c") accent = true
            else if (tag === "/c") accent = false
            continue
        }
        push(ch)
        i++
    }

    return {
        raw: s,
        plain,
        segments: segments.length ? segments : [{ text: "" }],
        wordTokens: plain.match(/\S+\s*/g) || [],
    }
}

function sliceSegments(segments: Segment[], takeChars: number) {
    let remaining = Math.max(0, takeChars)
    const out: Segment[] = []
    for (const seg of segments) {
        if (remaining <= 0) break
        const part = seg.text.slice(0, remaining)
        if (part.length) out.push({ ...seg, text: part })
        remaining -= part.length
    }
    return out
}

function charTarget(typeMode: TypeMode, parsed: ParsedBlock) {
    return typeMode === "chars" ? parsed.plain.length : parsed.wordTokens.length
}

function typedCharsFromCount(
    typeMode: TypeMode,
    parsed: ParsedBlock,
    count: number
) {
    if (typeMode === "chars") return clamp(count, 0, parsed.plain.length)
    const n = clamp(count, 0, parsed.wordTokens.length)
    let len = 0
    for (let i = 0; i < n; i++) len += parsed.wordTokens[i].length
    return len
}

function humanizeDelay(ms: number, enabled: boolean, amount: number) {
    if (!enabled) return ms
    const a = clamp(amount, 0, 1)
    const jitter = (Math.random() * 2 - 1) * a
    const mult = 1 + jitter * 0.35
    const microPauseChance = a * 0.06
    const microPause =
        Math.random() < microPauseChance
            ? ms * (0.75 + Math.random() * 0.75)
            : 0
    return Math.max(0, Math.round(ms * mult + microPause))
}

function useTickSound(enabled: boolean, volume: number, hz: number) {
    const ctxRef = React.useRef<AudioContext | null>(null)
    const lastPlayRef = React.useRef(0)

    const play = React.useCallback(
        (throttleMs = 18) => {
            if (!enabled || !canUseDOM) return
            const now = performance.now()
            if (now - lastPlayRef.current < throttleMs) return
            lastPlayRef.current = now
            try {
                const AudioCtx =
                    (window as any).AudioContext ||
                    (window as any).webkitAudioContext
                if (!AudioCtx) return
                if (!ctxRef.current) ctxRef.current = new AudioCtx()
                const ctx = ctxRef.current
                if (!ctx) return

                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = "square"
                osc.frequency.value = clamp(hz, 80, 1400)
                gain.gain.value = clamp(volume, 0, 1) * 0.22

                osc.connect(gain)
                gain.connect(ctx.destination)

                const t = ctx.currentTime
                gain.gain.setValueAtTime(gain.gain.value, t)
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)

                osc.start(t)
                osc.stop(t + 0.032)
            } catch {}
        },
        [enabled, volume, hz]
    )

    React.useEffect(() => {
        return () => {
            try {
                ctxRef.current?.close()
            } catch {}
            ctxRef.current = null
        }
    }, [])

    return play
}

function CaretShape(props: {
    visible: boolean
    styleType: CaretStyle
    gap: number
    thicknessPx: number
    heightEm: number
    contentMode: ContentMode
    fillMode: "solid" | "gradient"
    color: string
    gradientCSS?: string
}) {
    const {
        visible,
        styleType,
        gap,
        thicknessPx,
        heightEm,
        contentMode,
        fillMode,
        color,
        gradientCSS,
    } = props

    const t = clamp(thicknessPx, 1, 24)
    const hEm = clamp(heightEm, 0.45, 1.35)
    const bg = fillMode === "gradient" ? gradientCSS : color
    const caretY = "translateY(0.10em)"

    const base: React.CSSProperties = {
        display: "inline-block",
        marginLeft: contentMode === "paragraph" ? 0 : Math.max(0, gap),
        paddingLeft: contentMode === "paragraph" ? Math.max(0, gap) : 0,
        opacity: visible ? 1 : 0,
        transition: "opacity 120ms linear",
        verticalAlign: "baseline",
        background: bg,
    }

    if (styleType === "bar") {
        return (
            <span
                aria-hidden
                style={{
                    ...base,
                    width: Math.max(1, Math.round(t * 0.55)),
                    height: `${hEm}em`,
                    borderRadius: 0,
                    transform: caretY,
                }}
            />
        )
    }

    if (styleType === "pill") {
        return (
            <span
                aria-hidden
                style={{
                    ...base,
                    width: Math.max(8, Math.round(t * 2.0)),
                    height: `${hEm}em`,
                    borderRadius: 999,
                    transform: caretY,
                }}
            />
        )
    }

    if (styleType === "block") {
        return (
            <span
                aria-hidden
                style={{
                    ...base,
                    width: "0.78em",
                    height: `${Math.min(hEm, 1.05)}em`,
                    borderRadius: 2,
                    transform: caretY,
                }}
            />
        )
    }

    const lineH = Math.max(2, Math.round(t))
    return (
        <span
            aria-hidden
            style={{
                display: "inline-block",
                marginLeft: contentMode === "paragraph" ? 0 : Math.max(0, gap),
                paddingLeft: contentMode === "paragraph" ? Math.max(0, gap) : 0,
                width: "0.95em",
                height: "1em",
                position: "relative",
                verticalAlign: "baseline",
                opacity: visible ? 1 : 0,
                transition: "opacity 120ms linear",
            }}
        >
            <span
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "-0.10em",
                    height: lineH,
                    background: bg,
                    borderRadius: 0,
                }}
            />
        </span>
    )
}

export default function TextTypePro(props: Partial<Props> & FrameProps) {
    const preset = (props.preset ?? "Hero") as Preset
    const merged = { ...presetDefaults(preset), ...props } as Partial<Props> &
        FrameProps

    const {
        text = "Build <c>faster</c> with <b>Framer</b>.\nMake it feel premium.",
        contentMode = "lines",
        typeMode = "chars",

        widthBehavior = "Stable",

        timelineEnabled = false,
        timelineJson = "",

        enabled = true,
        loop = true,
        loopStyle = "transition",
        transition = "MaskWipe",
        transitionDuration = 420,

        startDelay = 400,
        typeSpeed = 38,
        wordDelay = 150,
        pauseAfterType = 1100,
        deleteSpeed = 26,
        pauseAfterDelete = 260,

        humanize = true,
        humanizeAmount = 0.35,

        showCursor = true,
        caretStyle = "bar",
        blinkCursor = true,
        blinkSpeed = 520,
        caretGap = 2,
        caretWidth = 3,
        caretHeight = 1.05,
        caretColorMode = "Match Text",
        accentColor = "#7C3AED",
        caretGradientFrom = "#7C3AED",
        caretGradientTo = "#06B6D4",
        caretGradientAngle = 90,

        richText = true,
        boldWeight = 700,
        underlineThickness = 2,

        sound = false,
        volume = 0.12,
        soundEvery = 2,
        soundHz = 680,

        responsive = false,
        breakpoint = 520,
        responsiveScale = 0.88,

        font,
        color = "#111",
        style,
    } = merged as Props

    const steps = React.useMemo(() => {
        if (!timelineEnabled) return null
        const parsed = safeJsonParse<any>(timelineJson)
        if (!parsed) return null
        const arr = Array.isArray(parsed) ? parsed : parsed?.steps
        if (!Array.isArray(arr)) return null

        const clean: TimelineStep[] = arr
            .map((s: any) => ({
                text: typeof s?.text === "string" ? s.text : "",
                contentMode:
                    s?.contentMode === "paragraph" || s?.contentMode === "lines"
                        ? s.contentMode
                        : undefined,
                typeMode:
                    s?.typeMode === "words" || s?.typeMode === "chars"
                        ? s.typeMode
                        : undefined,
                pauseAfterType: isFiniteNum(s?.pauseAfterType)
                    ? clamp(s.pauseAfterType, 0, 60000)
                    : undefined,
                loopStyle:
                    s?.loopStyle === "delete" || s?.loopStyle === "transition"
                        ? s.loopStyle
                        : undefined,
                transition:
                    s?.transition === "Fade" ||
                    s?.transition === "SlideUp" ||
                    s?.transition === "Blur" ||
                    s?.transition === "MaskWipe"
                        ? s.transition
                        : undefined,
            }))
            .filter((s) => s.text.length > 0)

        return clean.length ? clean : null
    }, [timelineEnabled, timelineJson])

    const rawBlocks = React.useMemo(() => {
        if (steps && steps.length)
            return steps.map((s) => s.text.replace(/\r\n/g, "\n"))
        return normalizeTextBlocks(text, contentMode)
    }, [text, contentMode, steps])

    const parsedBlocks = React.useMemo(
        () => rawBlocks.map((b) => parseRich(b, !!richText)),
        [rawBlocks.join("\n"), richText]
    )

    const maxPlainForSizer = React.useMemo(() => {
        let best = ""
        for (const p of parsedBlocks) {
            if ((p.plain || "").length > best.length) best = p.plain || ""
        }
        return best
    }, [parsedBlocks])

    const [index, setIndex] = React.useState(0)
    const [phase, setPhase] = React.useState<Phase>(
        startDelay > 0 ? "idleDelay" : "typing"
    )
    const [cursorVisible, setCursorVisible] = React.useState(true)
    const [opacity, setOpacity] = React.useState(1)
    const [transitionOffset, setTransitionOffset] = React.useState(0)
    const [clipVisible, setClipVisible] = React.useState(true)
    const [typedCount, setTypedCount] = React.useState(0)

    const wrapRef = React.useRef<HTMLDivElement | null>(null)
    const playTick = useTickSound(sound, volume, soundHz)
    const typeCountRef = React.useRef(0)

    const currentParsed = parsedBlocks[index] || parseRich("", !!richText)
    const isLast = index === parsedBlocks.length - 1

    const effectiveTransition =
        (steps?.[index]?.transition as Transition) || transition
    const effectivePauseAfterType =
        (steps?.[index]?.pauseAfterType as number) || pauseAfterType
    const effectiveTypeMode = (steps?.[index]?.typeMode as TypeMode) || typeMode
    const effectiveContentMode =
        (steps?.[index]?.contentMode as ContentMode) || contentMode

    React.useEffect(() => {
        setIndex(0)
        setTypedCount(0)
        setOpacity(1)
        setTransitionOffset(0)
        setClipVisible(true)
        setPhase(startDelay > 0 ? "idleDelay" : "typing")
        typeCountRef.current = 0
    }, [
        parsedBlocks.map((p) => p.raw).join("\n"),
        startDelay,
        typeMode,
        loopStyle,
        transition,
        transitionDuration,
        timelineEnabled,
        timelineJson,
        richText,
        widthBehavior,
    ])

    React.useEffect(() => {
        if (!showCursor) {
            setCursorVisible(false)
            return
        }
        if (!blinkCursor) {
            setCursorVisible(true)
            return
        }
        if (!canUseDOM) return
        const i = window.setInterval(
            () => setCursorVisible((v) => !v),
            Math.max(120, blinkSpeed)
        )
        return () => window.clearInterval(i)
    }, [showCursor, blinkCursor, blinkSpeed])

    const { fontCss, align, justify, fontSizePx, lineHeightNum } =
        fontToCSS(font)
    const safeLineHeight = Math.max(1.2, lineHeightNum || 1.2)

    const padTop = Math.max(12, Math.round(fontSizePx * 0.44))
    const padBottom = padTop + Math.max(10, Math.round(fontSizePx * 0.22))

    const inTransition = phase === "transitionOut" || phase === "transitionIn"
    const clipEnabled =
        loopStyle === "transition" &&
        effectiveTransition === "MaskWipe" &&
        inTransition
    const clipPath = clipEnabled
        ? clipVisible
            ? "inset(0 0% 0 0)"
            : "inset(0 100% 0 0)"
        : "inset(0 0% 0 0)"

    const [wrapWidth, setWrapWidth] = React.useState<number | null>(null)
    React.useEffect(() => {
        if (!responsive || !canUseDOM) return
        const el = wrapRef.current
        if (!el) return
        const RO = (window as any).ResizeObserver
        if (!RO) return
        const ro = new RO((entries: any[]) => {
            const w = entries?.[0]?.contentRect?.width
            if (isFiniteNum(w)) setWrapWidth(w)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [responsive])

    const responsiveMult =
        responsive && wrapWidth !== null && wrapWidth < breakpoint
            ? clamp(responsiveScale, 0.6, 1)
            : 1

    React.useEffect(() => {
        if (!enabled) {
            setTypedCount(charTarget(effectiveTypeMode, currentParsed))
            setOpacity(1)
            setPhase("typing")
            return
        }
        if (!canUseDOM) return

        const schedule = (fn: () => void, ms: number) => {
            const t = window.setTimeout(fn, Math.max(0, ms))
            return () => window.clearTimeout(t)
        }

        const nextTypeDelayBase =
            effectiveTypeMode === "words" ? wordDelay : typeSpeed
        const nextTypeDelay = humanizeDelay(
            nextTypeDelayBase,
            humanize,
            humanizeAmount
        )
        const nextDeleteDelay = humanizeDelay(
            deleteSpeed,
            humanize,
            humanizeAmount * 0.7
        )
        const target = charTarget(effectiveTypeMode, currentParsed)

        if (phase === "idleDelay")
            return schedule(() => setPhase("typing"), startDelay)

        if (phase === "typing") {
            return schedule(() => {
                if (typedCount >= target) {
                    setPhase("pauseAfterType")
                    return
                }
                setTypedCount((c) => c + 1)
                if (sound) {
                    typeCountRef.current += 1
                    const every = Math.max(1, Math.round(soundEvery))
                    if (typeCountRef.current % every === 0) playTick()
                }
            }, nextTypeDelay)
        }

        if (phase === "pauseAfterType") {
            return schedule(() => {
                if (!loop && isLast) return
                if (loopStyle === "transition") {
                    setPhase("transitionOut")
                    return
                }
                setPhase("deleting")
            }, effectivePauseAfterType)
        }

        if (phase === "deleting") {
            return schedule(() => {
                if (typedCount > 0) {
                    setTypedCount((c) => c - 1)
                    return
                }
                setPhase("pauseAfterDelete")
            }, nextDeleteDelay)
        }

        if (phase === "pauseAfterDelete") {
            return schedule(() => {
                setIndex((i) => (i + 1) % parsedBlocks.length)
                setTypedCount(0)
                typeCountRef.current = 0
                setPhase("typing")
            }, pauseAfterDelete)
        }

        if (phase === "transitionOut") {
            return schedule(() => {
                if (effectiveTransition === "MaskWipe") setClipVisible(false)
                if (effectiveTransition === "SlideUp") setTransitionOffset(-12)
                setOpacity(effectiveTransition === "MaskWipe" ? 1 : 0)
                setPhase("transitionIn")
            }, 10)
        }

        if (phase === "transitionIn") {
            return schedule(
                () => {
                    setIndex((i) => (i + 1) % parsedBlocks.length)
                    setTypedCount(0)
                    typeCountRef.current = 0

                    setTransitionOffset(12)
                    setOpacity(effectiveTransition === "MaskWipe" ? 1 : 0)
                    if (effectiveTransition === "MaskWipe")
                        setClipVisible(false)

                    requestAnimationFrame(() => {
                        setTransitionOffset(0)
                        setOpacity(1)
                        if (effectiveTransition === "MaskWipe")
                            setClipVisible(true)
                        setPhase("typing")
                    })
                },
                Math.max(60, transitionDuration)
            )
        }
    }, [
        enabled,
        phase,
        startDelay,
        effectiveTypeMode,
        wordDelay,
        typeSpeed,
        humanize,
        humanizeAmount,
        typedCount,
        currentParsed,
        effectivePauseAfterType,
        loop,
        isLast,
        loopStyle,
        effectiveTransition,
        transitionDuration,
        deleteSpeed,
        pauseAfterDelete,
        parsedBlocks.length,
        sound,
        soundEvery,
        playTick,
    ])

    const typedChars = typedCharsFromCount(
        effectiveTypeMode,
        currentParsed,
        typedCount
    )
    const visibleSegments = sliceSegments(currentParsed.segments, typedChars)

    const contentNode = (
        <>
            {visibleSegments.map((seg, i) => (
                <span
                    key={i}
                    style={{
                        fontWeight: seg.bold ? boldWeight : undefined,
                        textDecoration: seg.underline ? "underline" : undefined,
                        textDecorationThickness: seg.underline
                            ? underlineThickness
                            : undefined,
                        textUnderlineOffset: seg.underline
                            ? "0.12em"
                            : undefined,
                        color: seg.accent ? accentColor : undefined,
                    }}
                >
                    {seg.text}
                </span>
            ))}
        </>
    )

    const fillMode = caretColorMode === "Gradient" ? "gradient" : "solid"
    const caretSolidColor =
        caretColorMode === "Match Text" ? color : accentColor
    const caretGradientCSS = `linear-gradient(${caretGradientAngle}deg, ${caretGradientFrom}, ${caretGradientTo})`
    const caretVisible = showCursor && (blinkCursor ? cursorVisible : true)

    const animatedLineStyle: React.CSSProperties = {
        ...fontCss,
        textAlign: align,
        lineHeight: safeLineHeight,
        whiteSpace: effectiveContentMode === "paragraph" ? "pre-wrap" : "pre",
        wordBreak:
            effectiveContentMode === "paragraph" ? "break-word" : "normal",
        color,
        transform: `translateY(${transitionOffset}px)${responsiveMult !== 1 ? ` scale(${responsiveMult})` : ""}`,
        transformOrigin:
            align === "center"
                ? "center center"
                : align === "right"
                  ? "right center"
                  : "left center",
        filter:
            effectiveTransition === "Blur" && inTransition
                ? "blur(6px)"
                : "none",
        transition: `opacity ${transitionDuration}ms ease, transform ${transitionDuration}ms ease, filter ${transitionDuration}ms ease, clip-path ${transitionDuration}ms ease`,
        opacity,
        clipPath,
    }

    const wrapperStyle: React.CSSProperties = {
        ...style,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        boxSizing: "border-box",
        paddingTop: padTop,
        paddingBottom: padBottom,
        overflow: "hidden",
        position: "relative",
    }

    const stable = widthBehavior === "Stable"

    const sizerStyle: React.CSSProperties = {
        ...animatedLineStyle,
        opacity: 0,
        filter: "none",
        transform: undefined as any,
        transition: "none",
        clipPath: "inset(0 0 0 0)",
        pointerEvents: "none",
        userSelect: "none",
        visibility: "hidden",
        display: "block",
        width: "100%",
    }

    const shrinkLineWrap: React.CSSProperties = {
        display: "inline-block",
        maxWidth: "100%",
    }

    const shrinkTextStyle: React.CSSProperties = {
        ...animatedLineStyle,
        display: "inline-block",
        width: "auto",
    }

    return (
        <div style={wrapperStyle} ref={wrapRef}>
            <div style={{ width: "100%", position: "relative" }}>
                {stable ? (
                    <>
                        <div style={sizerStyle}>
                            {maxPlainForSizer}
                            <CaretShape
                                visible={true}
                                styleType={caretStyle}
                                gap={caretGap}
                                thicknessPx={caretWidth}
                                heightEm={caretHeight}
                                contentMode={effectiveContentMode}
                                fillMode={fillMode}
                                color={caretSolidColor}
                                gradientCSS={caretGradientCSS}
                            />
                        </div>

                        <div style={{ position: "absolute", inset: 0 }}>
                            <div
                                style={{
                                    ...animatedLineStyle,
                                    display: "block",
                                    width: "100%",
                                }}
                            >
                                {richText
                                    ? contentNode
                                    : currentParsed.plain.slice(0, typedChars)}
                                <CaretShape
                                    visible={caretVisible}
                                    styleType={caretStyle}
                                    gap={caretGap}
                                    thicknessPx={caretWidth}
                                    heightEm={caretHeight}
                                    contentMode={effectiveContentMode}
                                    fillMode={fillMode}
                                    color={caretSolidColor}
                                    gradientCSS={caretGradientCSS}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={shrinkLineWrap}>
                        <div style={shrinkTextStyle}>
                            {richText
                                ? contentNode
                                : currentParsed.plain.slice(0, typedChars)}
                            <CaretShape
                                visible={caretVisible}
                                styleType={caretStyle}
                                gap={caretGap}
                                thicknessPx={caretWidth}
                                heightEm={caretHeight}
                                contentMode={effectiveContentMode}
                                fillMode={fillMode}
                                color={caretSolidColor}
                                gradientCSS={caretGradientCSS}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

TextTypePro.defaultProps = { width: 560, height: 220 }
;(TextTypePro as any).disableImageRendering = true
;(TextTypePro as any).supportsLayout = true

addPropertyControls(TextTypePro as any, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["Hero", "Subheading", "Terminal", "Minimal", "Custom"],
        defaultValue: "Hero",
    },

    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue:
            "Build <c>faster</c> with <b>Framer</b>.\nMake it feel premium.",
    },

    richText: {
        type: ControlType.Boolean,
        title: "Rich Tags",
        defaultValue: true,
    },

    widthBehavior: {
        type: ControlType.Enum,
        title: "Width",
        options: ["Stable", "Shrink"],
        optionTitles: ["Stable", "Shrink on delete"],
        defaultValue: "Stable",
        description:
            "Stable keeps layout fixed. Shrink lets width change while deleting.",
    },

    contentMode: {
        type: ControlType.Enum,
        title: "Content",
        options: ["lines", "paragraph"],
        optionTitles: ["Lines", "Paragraph"],
        defaultValue: "lines",
    },

    typeMode: {
        type: ControlType.Enum,
        title: "Type",
        options: ["chars", "words"],
        optionTitles: ["Chars", "Words"],
        defaultValue: "chars",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            textAlign: "left",
            fontSize: 52,
            letterSpacing: -0.02,
            lineHeight: 1.15,
            variant: "Bold",
        },
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true,
        controls: "extended",
    },

    color: { type: ControlType.Color, title: "Text", defaultValue: "#111" },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#7C3AED",
    },

    showCursor: {
        type: ControlType.Boolean,
        title: "Cursor",
        defaultValue: true,
    },

    caretStyle: {
        type: ControlType.Enum,
        title: "Caret",
        options: ["bar", "block", "underscore", "pill"],
        optionTitles: ["Bar", "Block", "Underscore", "Pill"],
        defaultValue: "bar",
        hidden: (p) => !(p as any).showCursor,
    },

    caretHeight: {
        type: ControlType.Number,
        title: "Caret H",
        min: 0.45,
        max: 1.35,
        step: 0.05,
        defaultValue: 1.05,
        hidden: (p) => !(p as any).showCursor,
    },

    blinkCursor: {
        type: ControlType.Boolean,
        title: "Blink",
        defaultValue: true,
        hidden: (p) => !(p as any).showCursor,
    },

    blinkSpeed: {
        type: ControlType.Number,
        title: "Blink",
        unit: "ms",
        min: 120,
        max: 5000,
        step: 10,
        defaultValue: 520,
        hidden: (p) => !(p as any).showCursor || !(p as any).blinkCursor,
    },

    caretWidth: {
        type: ControlType.Number,
        title: "Thickness",
        min: 1,
        max: 24,
        step: 1,
        defaultValue: 3,
        hidden: (p) => !(p as any).showCursor,
    },

    caretGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 2,
        hidden: (p) => !(p as any).showCursor,
    },

    caretColorMode: {
        type: ControlType.Enum,
        title: "Caret Color",
        options: ["Match Text", "Accent", "Gradient"],
        defaultValue: "Match Text",
        hidden: (p) => !(p as any).showCursor,
    },

    caretGradientFrom: {
        type: ControlType.Color,
        title: "Grad From",
        defaultValue: "#7C3AED",
        hidden: (p) =>
            !(p as any).showCursor || (p as any).caretColorMode !== "Gradient",
    },

    caretGradientTo: {
        type: ControlType.Color,
        title: "Grad To",
        defaultValue: "#06B6D4",
        hidden: (p) =>
            !(p as any).showCursor || (p as any).caretColorMode !== "Gradient",
    },

    caretGradientAngle: {
        type: ControlType.Number,
        title: "Grad Angle",
        min: 0,
        max: 360,
        step: 1,
        defaultValue: 90,
        hidden: (p) =>
            !(p as any).showCursor || (p as any).caretColorMode !== "Gradient",
    },

    enabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        defaultValue: true,
    },

    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        hidden: (p) => !(p as any).enabled,
    },

    loopStyle: {
        type: ControlType.Enum,
        title: "Loop Style",
        options: ["delete", "transition"],
        optionTitles: ["Delete", "Transition"],
        defaultValue: "transition",
        hidden: (p) => !(p as any).enabled,
    },

    transition: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["Fade", "SlideUp", "Blur", "MaskWipe"],
        defaultValue: "MaskWipe",
        hidden: (p) =>
            !(p as any).enabled || (p as any).loopStyle !== "transition",
    },

    transitionDuration: {
        type: ControlType.Number,
        title: "Trans Dur",
        unit: "ms",
        min: 80,
        max: 4000,
        step: 10,
        defaultValue: 420,
        hidden: (p) =>
            !(p as any).enabled || (p as any).loopStyle !== "transition",
    },

    startDelay: {
        type: ControlType.Number,
        title: "Start",
        unit: "ms",
        min: 0,
        max: 60000,
        step: 10,
        defaultValue: 400,
        hidden: (p) => !(p as any).enabled,
    },

    typeSpeed: {
        type: ControlType.Number,
        title: "Type",
        unit: "ms",
        min: 10,
        max: 2000,
        step: 1,
        defaultValue: 38,
        hidden: (p) => !(p as any).enabled || (p as any).typeMode !== "chars",
    },

    wordDelay: {
        type: ControlType.Number,
        title: "Word",
        unit: "ms",
        min: 10,
        max: 4000,
        step: 1,
        defaultValue: 150,
        hidden: (p) => !(p as any).enabled || (p as any).typeMode !== "words",
    },

    pauseAfterType: {
        type: ControlType.Number,
        title: "Pause",
        unit: "ms",
        min: 0,
        max: 60000,
        step: 10,
        defaultValue: 1100,
        hidden: (p) => !(p as any).enabled,
    },

    deleteSpeed: {
        type: ControlType.Number,
        title: "Delete",
        unit: "ms",
        min: 10,
        max: 2000,
        step: 1,
        defaultValue: 26,
        hidden: (p) => !(p as any).enabled || (p as any).loopStyle !== "delete",
    },

    pauseAfterDelete: {
        type: ControlType.Number,
        title: "Pause 2",
        unit: "ms",
        min: 0,
        max: 60000,
        step: 10,
        defaultValue: 260,
        hidden: (p) => !(p as any).enabled || (p as any).loopStyle !== "delete",
    },

    humanize: {
        type: ControlType.Boolean,
        title: "Humanize",
        defaultValue: true,
        hidden: (p) => !(p as any).enabled,
    },

    humanizeAmount: {
        type: ControlType.Number,
        title: "Human Amt",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
        hidden: (p) => !(p as any).enabled || !(p as any).humanize,
    },

    sound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: false,
        hidden: (p) => !(p as any).enabled,
    },

    volume: {
        type: ControlType.Number,
        title: "Volume",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.12,
        hidden: (p) => !(p as any).enabled || !(p as any).sound,
    },

    soundEvery: {
        type: ControlType.Number,
        title: "Every",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 2,
        hidden: (p) => !(p as any).enabled || !(p as any).sound,
    },

    soundHz: {
        type: ControlType.Number,
        title: "Pitch",
        min: 80,
        max: 1400,
        step: 10,
        defaultValue: 680,
        hidden: (p) => !(p as any).enabled || !(p as any).sound,
    },

    responsive: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: false,
    },

    breakpoint: {
        type: ControlType.Number,
        title: "Break",
        min: 200,
        max: 2000,
        step: 10,
        defaultValue: 520,
        hidden: (p) => !(p as any).responsive,
    },

    responsiveScale: {
        type: ControlType.Number,
        title: "Scale",
        min: 0.6,
        max: 1,
        step: 0.01,
        defaultValue: 0.88,
        hidden: (p) => !(p as any).responsive,
    },

    timelineEnabled: {
        type: ControlType.Boolean,
        title: "Timeline",
        defaultValue: false,
    },

    timelineJson: {
        type: ControlType.String,
        title: "Timeline JSON",
        displayTextArea: true,
        defaultValue:
            '[\n  {"text":"Hello\\nHow are you?","contentMode":"paragraph","typeMode":"chars","pauseAfterType":900,"loopStyle":"transition","transition":"MaskWipe"},\n  {"text":"Build <c>faster</c> with <b>Framer</b>.","contentMode":"lines","typeMode":"chars","pauseAfterType":1100}\n]',
        hidden: (p) => !(p as any).timelineEnabled,
    },
})
