import { useEffect, useRef, useState } from "react"
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
 * De_Crypt.exe — text decrypt effect for Framer. By SIX BILLION HERSELF XX.
 * Timeline: Delay → Scramble (all glyphs shuffle) → Reveal (glyphs settle one by one).
 * Match Delay + Scramble to your frame animation so the text resolves when the frame is built.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function DeCryptExe(props) {
    const {
        text,
        trigger,
        delay,
        scrambleTime,
        revealTime,
        order,
        glyphs,
        changeRate,
        loopPause,
        replayOnHover,
        color,
        scrambleColor,
        font,
        style,
    } = props

    const final = text || ""
    // Framer's untouched Font default is Fragment Mono 400; use Geist Mono Medium instead until another font is picked
    const isDefaultFont =
        !font?.fontFamily || /Fragment Mono/.test(font.fontFamily)
    const fontStyle = isDefaultFont
        ? { ...font, fontFamily: GEIST, fontWeight: 500 }
        : font
    const [out, setOut] = useState<{ ch: string; done: boolean }[]>(() =>
        Array.from(final).map((ch) => ({ ch, done: true }))
    )
    const ref = useRef<HTMLSpanElement>(null)
    const run = useRef<() => void>(() => {})
    const timers = useRef<number[]>([])
    const raf = useRef(0)

    useEffect(() => {
        const chars = Array.from(final)
        const pool = Array.from(glyphs || "!<>-_\\/[]{}=+*^?#")
        const isStatic =
            RenderTarget.current() === RenderTarget.canvas ||
            RenderTarget.current() === RenderTarget.thumbnail ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const showFinal = () => setOut(chars.map((ch) => ({ ch, done: true })))
        if (isStatic) {
            showFinal()
            return
        }

        // the moment each glyph settles, as a share of the reveal phase
        const settleAt = () => {
            const n = chars.length || 1
            const base = chars.map((_, i) =>
                order === "reverse" ? (n - 1 - i) / n : i / n
            )
            return order === "random"
                ? base.slice().sort(() => Math.random() - 0.5)
                : base
        }

        const clear = () => {
            cancelAnimationFrame(raf.current)
            timers.current.forEach((t) => window.clearTimeout(t))
            timers.current = []
        }

        // one animation for every case; replays (hover) skip the delay and shorten the scramble
        const animate = (replay: boolean) => {
            clear()
            const settle = settleAt()
            const start = performance.now() + (replay ? 0 : delay * 1000)
            const revealStart =
                start +
                (replay ? Math.min(scrambleTime, 0.4) : scrambleTime) * 1000
            const end = revealStart + revealTime * 1000
            let lastSwap = 0
            const current = chars.map((ch) =>
                ch === " " ? " " : pool[(Math.random() * pool.length) | 0]
            )

            const frame = (now: number) => {
                if (now < start) {
                    // during the delay the text is hidden; blank glyphs keep the width
                    setOut(
                        chars.map((ch) => ({
                            ch: ch === " " ? " " : "\u00A0",
                            done: false,
                        }))
                    )
                    raf.current = requestAnimationFrame(frame)
                    return
                }
                const swap = now - lastSwap > 1000 / changeRate
                if (swap) lastSwap = now
                const p =
                    revealTime > 0
                        ? (now - revealStart) / (revealTime * 1000)
                        : now >= revealStart
                          ? 1
                          : 0
                const step = 1 / Math.max(1, chars.length)
                setOut(
                    chars.map((ch, i) => {
                        if (ch === " ") return { ch: " ", done: true }
                        if (p >= settle[i] + step || now >= end)
                            return { ch, done: true }
                        if (swap)
                            current[i] = pool[(Math.random() * pool.length) | 0]
                        return { ch: current[i], done: false }
                    })
                )
                if (now < end) {
                    raf.current = requestAnimationFrame(frame)
                } else {
                    showFinal()
                    if (!replay && trigger === "loop") {
                        timers.current.push(
                            window.setTimeout(
                                () => animate(false),
                                loopPause * 1000
                            )
                        )
                    }
                }
            }
            raf.current = requestAnimationFrame(frame)
        }
        const play = () => animate(false)
        run.current = () => animate(true)

        if (trigger === "inView") {
            const el = ref.current
            if (!el) return
            setOut(
                chars.map((ch) => ({ ch: ch === " " ? " " : " ", done: false }))
            )
            const io = new IntersectionObserver(
                (entries) => {
                    if (entries.some((e) => e.isIntersecting)) {
                        io.disconnect()
                        play()
                    }
                },
                { threshold: 0.3 }
            )
            io.observe(el)
            return () => {
                io.disconnect()
                clear()
            }
        }

        play()
        return clear
    }, [
        final,
        trigger,
        delay,
        scrambleTime,
        revealTime,
        order,
        glyphs,
        changeRate,
        loopPause,
    ])

    return (
        <span
            ref={ref}
            aria-label={final}
            onMouseEnter={replayOnHover ? () => run.current() : undefined}
            style={{
                ...style,
                ...fontStyle,
                display: "inline-block",
                whiteSpace: "pre",
                color,
                margin: 0,
            }}
        >
            {isDefaultFont && <style>{GEIST_IMPORT}</style>}
            <span aria-hidden="true">
                {out.map((g, i) => (
                    <span
                        key={i}
                        style={g.done ? undefined : { color: scrambleColor }}
                    >
                        {g.ch}
                    </span>
                ))}
            </span>
        </span>
    )
}

const GEIST = '"Geist Mono", ui-monospace, Menlo, Consolas, monospace'
const GEIST_IMPORT =
    '@import url("https://fonts.googleapis.com/css2?family=Geist+Mono:wght@500&display=swap");'

DeCryptExe.defaultProps = {
    text: "SIX BILLION HERSELF XX",
    trigger: "appear",
    delay: 0,
    scrambleTime: 3,
    revealTime: 1.2,
    order: "left",
    glyphs: "!<>-_\\/[]{}=+*^?#&%$@01",
    changeRate: 18,
    loopPause: 4,
    replayOnHover: false,
    color: "#FFFFFF",
    scrambleColor: "#8A8F98",
}

addPropertyControls(DeCryptExe, {
    text: { type: ControlType.String, title: "Text" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: { fontSize: 24, lineHeight: "1.2em" },
    },
    color: { type: ControlType.Color, title: "Color" },
    scrambleColor: { type: ControlType.Color, title: "Scramble Color" },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["appear", "inView", "loop"],
        optionTitles: ["Appear", "In View", "Loop"],
        displaySegmentedControl: true,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 20,
        step: 0.1,
        unit: "s",
        description: "Text stays hidden, then starts scrambling.",
    },
    scrambleTime: {
        type: ControlType.Number,
        title: "Scramble",
        min: 0,
        max: 20,
        step: 0.1,
        unit: "s",
        description: "All glyphs shuffle before any settle.",
    },
    revealTime: {
        type: ControlType.Number,
        title: "Reveal",
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        description: "Glyphs settle one by one.",
    },
    order: {
        type: ControlType.Enum,
        title: "Order",
        options: ["left", "reverse", "random"],
        optionTitles: ["Left → Right", "Right → Left", "Random"],
    },
    changeRate: {
        type: ControlType.Number,
        title: "Shuffle Speed",
        min: 2,
        max: 60,
        step: 1,
        unit: "/s",
    },
    glyphs: { type: ControlType.String, title: "Glyphs" },
    loopPause: {
        type: ControlType.Number,
        title: "Loop Pause",
        min: 0,
        max: 30,
        step: 0.5,
        unit: "s",
        hidden: (p) => p.trigger !== "loop",
    },
    replayOnHover: { type: ControlType.Boolean, title: "Replay on Hover" },
})
