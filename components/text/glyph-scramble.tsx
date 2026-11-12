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


type Trigger = "view" | "hover" | "loop"

interface ScrambleTextProps {
    text: string
    font: React.CSSProperties
    color: string
    trigger: Trigger
    duration: number
    stagger: number
    characters: string
    speed: number
    loopDelay: number
    replay: boolean
    noWrap: boolean
}

/**
 * Scramble Text - characters churn through random glyphs and resolve into the
 * real string, left to right.
 *
 * The real text is rendered as a hidden copy that reserves the exact box, so
 * scrambling never reflows the layout, and it is what screen readers and
 * crawlers see. Only textContent changes while running, so React never
 * re-renders mid-animation.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ScrambleText(props: ScrambleTextProps) {
    const {
        text,
        font,
        color,
        trigger,
        duration,
        stagger,
        characters,
        speed,
        loopDelay,
        replay,
        noWrap,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLSpanElement>(null)
    const outRef = useRef<HTMLSpanElement>(null)
    const frame = useRef<number | null>(null)
    const timer = useRef<number | null>(null)

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const out = outRef.current
        const root = rootRef.current
        if (!out || !root) return

        const pool = characters && characters.length > 0 ? characters : "#$%&*+"
        const chars = Array.from(text || "")
        const spread = Math.min(Math.max(stagger, 0), 1)
        const ms = Math.max(duration, 0.05) * 1000
        const tick = 1000 / Math.max(speed, 1)

        // Each character resolves at its own moment across the stagger window.
        const revealAt = chars.map((_, i) =>
            chars.length > 1 ? (i / (chars.length - 1)) * spread * ms : 0
        )

        let start = 0
        let lastRoll = 0
        let rolled = chars.map(() => "")

        const stop = () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current)
            frame.current = null
        }

        const settle = () => {
            out.textContent = text || ""
        }

        const step = (now: number) => {
            if (!start) start = now
            const elapsed = now - start
            const reroll = now - lastRoll >= tick
            if (reroll) lastRoll = now

            let done = true
            let output = ""
            for (let i = 0; i < chars.length; i++) {
                const ch = chars[i]
                // Whitespace stays put, otherwise the line visibly breathes.
                if (ch === " " || ch === "\n") {
                    output += ch
                    continue
                }
                if (elapsed >= revealAt[i] + ms * (1 - spread)) {
                    output += ch
                    continue
                }
                done = false
                if (reroll || !rolled[i]) {
                    rolled[i] = pool[Math.floor(Math.random() * pool.length)]
                }
                output += rolled[i]
            }

            out.textContent = output

            if (done) {
                stop()
                if (trigger === "loop") {
                    timer.current = window.setTimeout(
                        run,
                        Math.max(loopDelay, 0) * 1000
                    )
                }
                return
            }
            frame.current = requestAnimationFrame(step)
        }

        const run = () => {
            stop()
            start = 0
            lastRoll = 0
            rolled = chars.map(() => "")
            frame.current = requestAnimationFrame(step)
        }

        let observer: IntersectionObserver | null = null
        const onEnter = () => run()

        if (trigger === "hover") {
            root.addEventListener("pointerenter", onEnter)
        } else if (trigger === "loop") {
            run()
        } else if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting) {
                            run()
                            if (!replay && observer) observer.disconnect()
                        } else if (replay) {
                            stop()
                            settle()
                        }
                    }
                },
                { threshold: 0.25 }
            )
            observer.observe(root)
        } else {
            run()
        }

        return () => {
            stop()
            if (timer.current !== null) clearTimeout(timer.current)
            if (observer) observer.disconnect()
            root.removeEventListener("pointerenter", onEnter)
            settle()
        }
    }, [
        isStatic,
        text,
        trigger,
        duration,
        stagger,
        characters,
        speed,
        loopDelay,
        replay,
    ])

    // A random glyph is often wider than the character it stands in for, so at
    // pre-wrap the scrambled copy overflows the box the real text reserved and
    // drops a line while the sizer stays put. "pre" never wraps on its own but
    // still honours typed line breaks. It goes on both layers, so the reserved
    // box and the visible copy always agree on how many lines there are.
    const shared: React.CSSProperties = {
        ...font,
        color,
        whiteSpace: noWrap ? "pre" : "pre-wrap",
    }

    return (
        <span
            ref={rootRef}
            style={{
                position: "relative",
                display: "inline-block",
                ...shared,
            }}
        >
            {/* Reserves the exact box and is what assistive tech reads. */}
            <span style={{ visibility: "hidden" }}>{text}</span>
            <span
                ref={outRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    ...shared,
                }}
            >
                {text}
            </span>
        </span>
    )
}

ScrambleText.displayName = "Glyph Scramble"

addPropertyControls(ScrambleText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Scramble into place",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 44 },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        defaultValue: "view",
        options: ["view", "hover", "loop"],
        optionTitles: ["On View", "On Hover", "Loop"],
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.2,
        min: 0.1,
        max: 6,
        step: 0.05,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        description:
            "0 resolves every character at once. 1 sweeps across the line.",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
    },
    speed: {
        type: ControlType.Number,
        title: "Churn",
        description: "How many times a second unresolved characters change.",
        defaultValue: 22,
        min: 2,
        max: 60,
        step: 1,
    },
    characters: {
        type: ControlType.String,
        title: "Glyphs",
        description:
            "Pool the scramble draws from. Similar-width glyphs read best.",
        defaultValue: "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+",
    },
    loopDelay: {
        type: ControlType.Number,
        title: "Loop Delay",
        defaultValue: 1.5,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: (props: Partial<ScrambleTextProps>) =>
            props.trigger !== "loop",
    },
    noWrap: {
        type: ControlType.Boolean,
        title: "No Wrap",
        description:
            "Keeps the scramble on the line it started on. Turn off only for text meant to wrap over several lines.",
        defaultValue: true,
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        description: "Run again each time it scrolls back into view.",
        defaultValue: false,
        hidden: (props: Partial<ScrambleTextProps>) =>
            props.trigger !== "view",
    },
})
