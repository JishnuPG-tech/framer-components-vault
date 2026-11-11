import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"
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
 * Typewriter Effect
 * -----------------
 * Two modes in one component:
 *
 *  1. AUTO TYPE      – types your text (one or many lines) by itself, like the
 *                      reference video. Edit the text right in the properties
 *                      panel. Starts when scrolled into view.
 *
 *  2. VISITOR TYPES  – your visitors type on the live website and see the same
 *                      typewriter effect with the same caret. Works with a
 *                      physical keyboard, on-screen mobile keyboards, IME
 *                      (Chinese / Japanese / Korean …), emoji and paste.
 *                      Fires "On Submit" when they press Enter.
 *
 * Also listens on `window` for the DOM event "framer-typewriter-submit"
 * (detail: { text }) so you can use the typed text in your own code overrides.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 360
 * @framerDisableUnlink
 */

/* ───────────────────────────── types & defaults ───────────────────────────── */

type Mode = "auto" | "visitor"

interface Props {
    mode: Mode
    text: string[]
    placeholder: string
    look: {
        font: CSSProperties & Record<string, any>
        text: string
        caret: string
        hint: string
    }
    typing: {
        speed: number
        startDelay: number
        loop: boolean
        hold: number
        eraseSpeed: number
        caretWidth: number
        blink: boolean
    }
    visitor: {
        capture: "click" | "anywhere" | "auto"
        maxLength: number
        multiline: boolean
        clearOnSubmit: boolean
    }
    onSubmit?: () => void
    style?: CSSProperties
}

const D = {
    text: [
        "Design faster.",
        "Ship sooner.",
        "Build something people remember.",
    ],
    placeholder: "Type your idea here…",
    look: {
        font: {} as Record<string, any>,
        text: "#FFFFFF",
        caret: "#FB460D",
        hint: "rgba(255, 255, 255, 0.4)",
    },
    typing: {
        speed: 20,
        startDelay: 0.3,
        loop: false,
        hold: 1.3,
        eraseSpeed: 40,
        caretWidth: 3,
        blink: true,
    },
    visitor: {
        capture: "click" as const,
        maxLength: 80,
        multiline: true, // Enter = new line (⌘/Ctrl+Enter submits)
        clearOnSubmit: false, // keep the text after submit
    },
}

/* ──────────────────────────────── helpers ─────────────────────────────────── */

let segmenter: any = null
/** Splits into user-perceived characters so emoji / accents never get cut in half. */
function graphemes(s: string): string[] {
    if (!s) return []
    if (segmenter === null) {
        const Seg = typeof Intl !== "undefined" && (Intl as any).Segmenter
        segmenter = Seg
            ? new Seg(undefined, { granularity: "grapheme" })
            : false
    }
    if (segmenter) {
        return Array.from(segmenter.segment(s), (x: any) => x.segment as string)
    }
    return Array.from(s)
}

/** Strips control characters, normalises line breaks, enforces max length. */
function clean(s: string, multiline: boolean, max: number): string {
    let out = s
        .replace(/\r\n?/g, "\n")
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    if (!multiline) out = out.replace(/\n+/g, " ")
    if (max > 0) {
        const g = graphemes(out)
        if (g.length > max) out = g.slice(0, max).join("")
    }
    return out
}

/** Merge that ignores undefined / null / "" so a missing control never wipes a default. */
function withDefaults<T extends Record<string, any>>(d: T, p?: Partial<T>): T {
    const out: any = { ...d }
    if (p && typeof p === "object") {
        for (const k in p) {
            const v = (p as any)[k]
            if (v !== undefined && v !== null && v !== "") out[k] = v
        }
    }
    return out
}

const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

/* ───────────────────────────── typing engine ──────────────────────────────── */
/**
 * One small engine drives BOTH modes. It keeps `shown` chasing `target`:
 *  - target grows   → reveals characters one by one (with a human rhythm)
 *  - target shrinks → erases (instantly for visitors, animated for auto mode)
 *  - paste / big jumps are revealed in quick chunks so it never lags behind
 */
interface TyperOpts {
    speed: number
    erase: number
    humanize: boolean
    live: boolean
}

function useTyper(opts: TyperOpts) {
    const optRef = useRef(opts)
    optRef.current = opts

    const [shown, setShown] = useState("")
    const [active, setActive] = useState(false)

    const api = useMemo(() => {
        let cur: string[] = []
        let tgt: string[] = []
        let timer: ReturnType<typeof setTimeout> | null = null
        let activeTimer: ReturnType<typeof setTimeout> | null = null
        let idleCb: (() => void) | null = null
        let dead = false

        const wake = () => {
            setActive(true)
            if (activeTimer) clearTimeout(activeTimer)
            // caret stays solid while typing, starts blinking ~0.6s after the last change
            activeTimer = setTimeout(() => !dead && setActive(false), 600)
        }

        const commit = (next: string[]) => {
            cur = next
            setShown(next.join(""))
        }

        const delayFor = (ch: string) => {
            const { speed, humanize } = optRef.current
            let d = 1000 / Math.max(1, speed)
            if (humanize) {
                d *= 0.55 + Math.random() * 0.9
                if (/[.,!?;:]/.test(ch)) d *= 3
                else if (ch === " ") d *= 1.15
            }
            return d
        }

        const schedule = (ms: number) => {
            if (timer || dead) return
            timer = setTimeout(step, ms)
        }

        const step = () => {
            timer = null
            if (dead) return
            const { live, erase } = optRef.current

            let c = 0
            const m = Math.min(cur.length, tgt.length)
            while (c < m && cur[c] === tgt[c]) c++

            if (cur.length > c) {
                // erase
                const excess = cur.length - c
                const n = live ? excess : Math.max(1, Math.ceil(excess / 14))
                commit(cur.slice(0, cur.length - n))
                wake()
                schedule(live ? 0 : 1000 / Math.max(1, erase))
                return
            }
            if (cur.length < tgt.length) {
                // type
                const pending = tgt.length - cur.length
                const n = live && pending > 3 ? Math.ceil(pending / 4) : 1
                const next = tgt.slice(0, cur.length + n)
                commit(next)
                wake()
                schedule(delayFor(next[next.length - 1] || ""))
                return
            }
            // settled
            const cb = idleCb
            idleCb = null
            cb && cb()
        }

        return {
            setTarget(text: string) {
                tgt = graphemes(text)
                schedule(0)
            },
            /** Runs `fn` once, the next time shown === target. */
            onceIdle(fn: (() => void) | null) {
                idleCb = fn
                if (fn) schedule(0)
            },
            destroy() {
                dead = true
                if (timer) clearTimeout(timer)
                if (activeTimer) clearTimeout(activeTimer)
            },
            revive() {
                dead = false
            },
        }
    }, [])

    useEffect(() => {
        api.revive()
        return () => api.destroy()
    }, [api])

    return { shown, active, ...api }
}

/* ───────────────────────────────── component ──────────────────────────────── */

export default function TypewriterEffect(props: Partial<Props>) {
    const mode: Mode = props.mode || "auto"
    const isVisitor = mode === "visitor"
    const text = props.text ?? D.text
    const placeholder = props.placeholder ?? D.placeholder
    const look = withDefaults(D.look, props.look)
    const typing = withDefaults(D.typing, props.typing)
    const visitor = withDefaults(D.visitor, props.visitor)
    const font = look.font || {}

    const textKey = JSON.stringify(text)
    const list = useMemo(
        () =>
            (Array.isArray(text) ? text : [String(text ?? "")])
                .map((s) => String(s ?? ""))
                .filter((s) => s.length > 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [textKey]
    )
    const listKey = JSON.stringify(list)

    /* environment */
    // true on the Framer canvas, thumbnails and static exports → no animation
    const isCanvas = useIsStaticRenderer()
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => setReduced(mq.matches)
        on()
        mq.addEventListener
            ? mq.addEventListener("change", on)
            : mq.addListener(on)
        return () =>
            mq.removeEventListener
                ? mq.removeEventListener("change", on)
                : mq.removeListener(on)
    }, [])
    /** Static = no animation: Framer canvas, or visitors who prefer reduced motion. */
    const direct = isCanvas || reduced

    /* visibility (start when scrolled into view; only capture keys while visible) */
    const rootRef = useRef<HTMLDivElement>(null)
    const taRef = useRef<HTMLTextAreaElement>(null)
    const [inView, setInView] = useState(false)
    const [seen, setSeen] = useState(false)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            ([e]) => setInView(e.isIntersecting),
            { threshold: 0.2 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])
    useEffect(() => {
        if (inView) setSeen(true)
    }, [inView])
    const go = seen // always starts once scrolled into view

    /* engine */
    const typer = useTyper({
        speed: typing.speed,
        erase: typing.eraseSpeed,
        humanize: true, // always on: natural, uneven rhythm
        live: isVisitor,
    })

    /* ── AUTO MODE: sequence through the lines ── */
    // when looping, pause the sequence while offscreen (no endless work for unseen text)
    const runAuto = go && (!typing.loop || inView)
    useEffect(() => {
        if (isVisitor || direct || !runAuto) return
        let dead = false
        const timers: ReturnType<typeof setTimeout>[] = []
        const later = (fn: () => void, ms: number) => {
            timers.push(
                setTimeout(() => {
                    if (!dead) fn()
                }, ms)
            )
        }
        const play = (i: number) => {
            typer.setTarget(list[i])
            typer.onceIdle(() => {
                const last = i === list.length - 1
                if (last && !typing.loop) return
                later(() => {
                    typer.setTarget("")
                    typer.onceIdle(() =>
                        later(() => play((i + 1) % list.length), 280)
                    )
                }, typing.hold * 1000)
            })
        }
        if (list.length) later(() => play(0), typing.startDelay * 1000)
        else typer.setTarget("")
        return () => {
            dead = true
            timers.forEach(clearTimeout)
            typer.onceIdle(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isVisitor,
        direct,
        runAuto,
        listKey,
        typing.loop,
        typing.hold,
        typing.startDelay,
    ])

    /* ── VISITOR MODE ── */
    const [value, setValue] = useState("")
    const [phAllowed, setPhAllowed] = useState(true) // placeholder may (re)appear
    const [phReady, setPhReady] = useState(false)

    const latest = useRef({ visitor, onSubmit: props.onSubmit, value })
    latest.current = { visitor, onSubmit: props.onSubmit, value }

    useEffect(() => {
        if (value !== "") setPhAllowed(false)
    }, [value])

    useEffect(() => {
        if (!isVisitor || !go) return
        const id = setTimeout(() => setPhReady(true), typing.startDelay * 1000)
        return () => clearTimeout(id)
    }, [isVisitor, go, typing.startDelay])

    const phOn = phReady && phAllowed && placeholder.length > 0
    const visitorTarget = value !== "" ? value : phOn ? placeholder : ""

    useEffect(() => {
        if (!isVisitor || direct) return
        typer.setTarget(visitorTarget)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisitor, direct, visitorTarget])

    // if the visitor-limits change, re-clean what is there
    useEffect(() => {
        setValue((v) => clean(v, visitor.multiline, visitor.maxLength))
    }, [visitor.multiline, visitor.maxLength])

    const update = (fn: (v: string) => string) =>
        setValue((v) => {
            const { multiline, maxLength } = latest.current.visitor
            return clean(fn(v), multiline, maxLength)
        })

    const submit = () => {
        const v = latest.current.value
        if (!v.trim()) return
        try {
            latest.current.onSubmit && latest.current.onSubmit()
            window.dispatchEvent(
                new CustomEvent("framer-typewriter-submit", {
                    detail: { text: v },
                })
            )
        } catch (e) {
            /* never let a user handler break typing */
        }
        if (latest.current.visitor.clearOnSubmit) {
            setValue("")
            setPhAllowed(true)
        }
    }

    // "Type anywhere": capture keys on the page while the component is on screen
    useEffect(() => {
        if (!isVisitor || direct || visitor.capture !== "anywhere" || !inView)
            return
        const onKey = (e: KeyboardEvent) => {
            if (
                e.defaultPrevented ||
                e.isComposing ||
                e.ctrlKey ||
                e.metaKey ||
                e.altKey
            )
                return
            const t = e.target as HTMLElement | null
            if (
                t &&
                (t.isContentEditable ||
                    /^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY)$/.test(
                        t.tagName
                    ) ||
                    t.getAttribute?.("role") === "button")
            )
                return
            if (e.key === "Backspace") {
                e.preventDefault()
                update((v) => graphemes(v).slice(0, -1).join(""))
            } else if (e.key === "Enter") {
                e.preventDefault()
                if (latest.current.visitor.multiline) update((v) => v + "\n")
                else submit()
            } else if (graphemes(e.key).length === 1 && e.key !== "Dead") {
                e.preventDefault()
                update((v) => v + e.key)
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisitor, direct, visitor.capture, inView])

    // "Auto-focus"
    useEffect(() => {
        if (!isVisitor || direct || visitor.capture !== "auto" || !go) return
        taRef.current && taRef.current.focus({ preventScroll: true })
    }, [isVisitor, direct, visitor.capture, go])

    /* ── what to draw ── */
    const directText = isVisitor
        ? value || (phAllowed ? placeholder : "")
        : list[0] || ""
    const shownText = direct ? directText : typer.shown
    const showingPlaceholder = isVisitor && value === ""
    const busy = direct ? true : typer.active
    const barW = Math.max(1, Number(typing.caretWidth) || D.typing.caretWidth)
    // Blink is driven from code (no injected CSS): solid while typing, blinks when idle
    const blinking = typing.blink && !busy && inView && !direct
    const [blinkOn, setBlinkOn] = useState(true)
    useEffect(() => {
        setBlinkOn(true)
        if (!blinking) return
        const id = setInterval(() => setBlinkOn((v) => !v), 500)
        return () => clearInterval(id)
    }, [blinking])

    const textColor = showingPlaceholder ? look.hint : look.text
    const caretColor =
        (showingPlaceholder ? look.hint : look.caret) || D.look.caret

    const ta = (font.textAlign as string) || "center"
    const justify =
        ta === "left" || ta === "start"
            ? "flex-start"
            : ta === "right" || ta === "end"
              ? "flex-end"
              : "center"

    const rootStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        ...props.style,
        position: "relative",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        overflow: "hidden",
    }

    const textStyle: CSSProperties = {
        fontFamily:
            '"Inter", "Inter Display", system-ui, -apple-system, sans-serif',
        fontSize: 48,
        fontWeight: 400,
        lineHeight: "1.2em",
        letterSpacing: "-0.04em",
        ...font,
        margin: 0,
        minWidth: barW + 6, // never collapse to nothing when the text is empty
        maxWidth: "100%",
        overflow: "visible",
        color: textColor,
        textAlign: ta as CSSProperties["textAlign"],
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        userSelect: "none",
        WebkitUserSelect: "none",
        transition: "color .2s ease",
    } as CSSProperties

    return (
        <div ref={rootRef} style={rootStyle}>
            {/* Real text for search engines & screen readers (auto mode) */}
            {!isVisitor && <span style={srOnly}>{list.join("\n")}</span>}

            {/* Visible, animated text */}
            <div aria-hidden="true" style={textStyle}>
                {shownText}
                {"\u200b"}
                <span
                    aria-hidden="true"
                    style={{
                        display: "inline-block",
                        width: barW,
                        height: "0.86em",
                        marginLeft: "0.04em",
                        flexShrink: 0,
                        verticalAlign: "-0.1em",
                        backgroundColor: caretColor,
                        opacity: blinking && !blinkOn ? 0 : 1,
                        pointerEvents: "none",
                    }}
                />
            </div>

            {/* Invisible input: opens the mobile keyboard, handles IME, paste, a11y */}
            {isVisitor && !isCanvas && (
                <textarea
                    ref={taRef}
                    value={value}
                    aria-label={placeholder || "Type here"}
                    rows={1}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint={visitor.multiline ? "enter" : "send"}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    onChange={(e) => update(() => e.target.value)}
                    onKeyDown={(e) => {
                        const composing = (e.nativeEvent as KeyboardEvent)
                            .isComposing
                        if (e.key === "Enter" && !composing) {
                            if (!visitor.multiline || e.metaKey || e.ctrlKey) {
                                e.preventDefault()
                                submit()
                            }
                        } else if (e.key === "Escape") {
                            e.currentTarget.blur()
                        } else if (
                            ["ArrowLeft", "ArrowUp", "Home", "PageUp"].includes(
                                e.key
                            )
                        ) {
                            e.preventDefault() // typing always happens at the end
                        }
                    }}
                    onSelect={(e) => {
                        const el = e.currentTarget
                        const n = el.value.length
                        if (el.selectionStart !== n || el.selectionEnd !== n) {
                            el.setSelectionRange(n, n)
                        }
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        margin: 0,
                        padding: 0,
                        border: 0,
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        opacity: 0,
                        background: "transparent",
                        color: "transparent",
                        caretColor: "transparent",
                        fontSize: 16, // ≥16px stops iOS Safari zooming in on focus
                        cursor: "text",
                        zIndex: 1,
                        WebkitTapHighlightColor: "transparent",
                    }}
                />
            )}
        </div>
    )
}

TypewriterEffect.defaultProps = {
    width: 640,
    height: 360,
}

/* ───────────────────────────── property controls ──────────────────────────── */

addPropertyControls(TypewriterEffect, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["auto", "visitor"],
        optionTitles: ["Auto Type", "Visitor Types"],
        displaySegmentedControl: true,
        segmentedControlDirection: "horizontal",
        defaultValue: "auto",
    },

    text: {
        type: ControlType.Array,
        title: "Text",
        description:
            "Type your text here. Add more lines to cycle through them (turn on Loop to repeat).",
        control: {
            type: ControlType.String,
            displayTextArea: true,
            placeholder: "Type something…",
            defaultValue: "Type something…",
        },
        defaultValue: D.text,
        maxCount: 12,
        hidden: (p) => p.mode === "visitor",
    },

    placeholder: {
        type: ControlType.String,
        title: "Hint",
        description:
            "Typed out until your visitor starts writing. Leave empty for no hint.",
        defaultValue: D.placeholder,
        placeholder: "Type your idea here…",
        hidden: (p) => p.mode !== "visitor",
    },

    look: {
        type: ControlType.Object,
        title: "Font",
        defaultValue: {
            text: D.look.text,
            caret: D.look.caret,
            hint: D.look.hint,
        },
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "48px",
                    fontWeight: 400,
                    lineHeight: "1.2em",
                    letterSpacing: "-0.04em",
                    textAlign: "center",
                },
                displayTextAlignment: true,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: D.look.text,
            },
            caret: {
                type: ControlType.Color,
                title: "Caret",
                defaultValue: D.look.caret,
            },
            hint: {
                type: ControlType.Color,
                title: "Hint",
                defaultValue: D.look.hint,
            },
        },
    },

    typing: {
        type: ControlType.Object,
        title: "Typing",
        defaultValue: D.typing,
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 1,
                max: 40,
                step: 1,
                unit: "ch/s",
                defaultValue: D.typing.speed,
            },
            startDelay: {
                type: ControlType.Number,
                title: "Delay",
                min: 0,
                max: 5,
                step: 0.1,
                unit: "s",
                defaultValue: D.typing.startDelay,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: D.typing.loop,
            },
            hold: {
                type: ControlType.Number,
                title: "Pause",
                description: "Wait before erasing (multiple lines / loop).",
                min: 0,
                max: 10,
                step: 0.1,
                unit: "s",
                defaultValue: D.typing.hold,
            },
            eraseSpeed: {
                type: ControlType.Number,
                title: "Erase",
                min: 5,
                max: 120,
                step: 1,
                unit: "ch/s",
                defaultValue: D.typing.eraseSpeed,
            },
            caretWidth: {
                type: ControlType.Number,
                title: "Thickness",
                min: 1,
                max: 12,
                step: 1,
                unit: "px",
                defaultValue: D.typing.caretWidth,
            },
            blink: {
                type: ControlType.Boolean,
                title: "Blink",
                enabledTitle: "Yes",
                disabledTitle: "No",
                defaultValue: D.typing.blink,
            },
        },
    },

    visitor: {
        type: ControlType.Object,
        title: "Visitor Input",
        defaultValue: D.visitor,
        hidden: (p) => p.mode !== "visitor",
        controls: {
            capture: {
                type: ControlType.Enum,
                title: "Typing starts",
                options: ["click", "anywhere", "auto"],
                optionTitles: [
                    "On click / tap",
                    "Anywhere on page",
                    "Auto-focus",
                ],
                defaultValue: D.visitor.capture,
            },
            maxLength: {
                type: ControlType.Number,
                title: "Max chars",
                description: "0 = unlimited",
                min: 0,
                max: 500,
                step: 1,
                defaultValue: D.visitor.maxLength,
            },
            multiline: {
                type: ControlType.Boolean,
                title: "Enter key",
                description:
                    "Multi-line: Enter adds a line, ⌘/Ctrl+Enter submits.",
                enabledTitle: "New line",
                disabledTitle: "Submit",
                defaultValue: D.visitor.multiline,
            },
            clearOnSubmit: {
                type: ControlType.Boolean,
                title: "After submit",
                enabledTitle: "Clear",
                disabledTitle: "Keep",
                defaultValue: D.visitor.clearOnSubmit,
            },
        },
    },

    onSubmit: {
        type: ControlType.EventHandler,
        title: "On Submit",
        hidden: (p) => p.mode !== "visitor",
    } as any,
})
