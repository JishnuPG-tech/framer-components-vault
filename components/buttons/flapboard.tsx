import * as React from "react"
import { useEffect, useMemo, useRef } from "react"
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
 * Split-Flap Button
 * An airport-departure-board button. Each letter flips through mechanical
 * flaps to land on the hover text; idle messages can rotate on a timer.
 *
 * @framerIntrinsicWidth 460
 * @framerIntrinsicHeight 62
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

const CHARSETS: Record<string, string> = {
    letters: " ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    alphanumeric: " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    full: " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:!?'&-→",
}

type Props = {
    messages: string[]
    hoverText: string
    uppercase: boolean
    link: string
    newTab: boolean
    cycle: boolean
    cycleSeconds: number
    charSet: "letters" | "alphanumeric" | "full" | "custom"
    customCharSet: string
    flipSpeed: number
    stagger: number
    maxFlips: number
    font: React.CSSProperties
    inkColor: string
    flapColor: string
    flapTopColor: string
    hingeColor: string
    housingColor: string
    cellWidth: number
    cellHeight: number
    cellGap: number
    cellRadius: number
    padding: number
    radius: number
    shadow: boolean
    hoverLift: boolean
    sound: boolean
    volume: number
    onClick?: () => void
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    style?: React.CSSProperties
}

type Cell = {
    top: HTMLSpanElement
    bot: HTMLSpanElement
    ft: HTMLDivElement
    fb: HTMLDivElement
    ftText: HTMLSpanElement
    fbText: HTMLSpanElement
    cur: string
    seq: string[]
    running: boolean
    timer?: ReturnType<typeof setTimeout>
}

function pad(s: string, n: number) {
    const left = Math.floor((n - s.length) / 2)
    return (" ".repeat(Math.max(0, left)) + s).padEnd(n, " ").slice(0, n)
}

export default function SplitFlapButton(props: Props) {
    const {
        messages,
        hoverText,
        uppercase,
        link,
        newTab,
        cycle,
        cycleSeconds,
        charSet,
        customCharSet,
        flipSpeed,
        stagger,
        maxFlips,
        font,
        inkColor,
        flapColor,
        flapTopColor,
        hingeColor,
        housingColor,
        cellWidth,
        cellHeight,
        cellGap,
        cellRadius,
        padding,
        radius,
        shadow,
        hoverLift,
        sound,
        volume,
        onClick,
        onMouseEnter,
        onMouseLeave,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const msgs = useMemo(() => {
        const list = (messages && messages.length ? messages : ["BOOK A DEMO"])
            .map((m) => (uppercase ? m.toUpperCase() : m))
            .filter((m) => m.length > 0)
        return list.length ? list : [" "]
    }, [messages, uppercase])
    const hover = uppercase ? hoverText.toUpperCase() : hoverText
    const N = Math.max(hover.length, ...msgs.map((m) => m.length), 1)
    const set =
        charSet === "custom"
            ? " " + (customCharSet || "").replace(/ /g, "")
            : CHARSETS[charSet] || CHARSETS.full

    // Live values read inside timers without re-subscribing
    const live = useRef({ flipSpeed, stagger, maxFlips, set, sound, volume })
    live.current = { flipSpeed, stagger, maxFlips, set, sound, volume }

    const cells = useRef<Cell[]>([])
    const cellEls = useRef<(HTMLDivElement | null)[]>([])
    const hovering = useRef(false)
    const msgIdx = useRef(0)
    const audio = useRef<AudioContext | null>(null)
    const lastTick = useRef(0)

    const tick = () => {
        const { sound, volume } = live.current
        const ac = audio.current
        if (!sound || !ac || ac.state !== "running") return
        const now = performance.now()
        if (now - lastTick.current < 14) return
        lastTick.current = now
        const len = Math.floor(ac.sampleRate * 0.012)
        const buf = ac.createBuffer(1, len, ac.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < len; i++)
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
        const src = ac.createBufferSource()
        src.buffer = buf
        const bp = ac.createBiquadFilter()
        bp.type = "bandpass"
        bp.frequency.value = 2600 + Math.random() * 1200
        bp.Q.value = 1.2
        const g = ac.createGain()
        g.gain.value = volume
        src.connect(bp).connect(g).connect(ac.destination)
        src.start(ac.currentTime)
    }

    const unlockAudio = () => {
        if (!audio.current) {
            const AC =
                (window as any).AudioContext ||
                (window as any).webkitAudioContext
            if (AC) audio.current = new AC()
        }
        if (audio.current && audio.current.state === "suspended")
            audio.current.resume()
    }

    const flip = (c: Cell) => {
        const next = c.seq.shift()
        if (next === undefined) {
            c.running = false
            return
        }
        const d = live.current.flipSpeed
        const a = c.cur
        c.top.textContent = next
        c.bot.textContent = a
        c.ftText.textContent = a
        c.fbText.textContent = next
        c.ft.style.visibility = "visible"
        c.fb.style.visibility = "visible"
        c.ft.animate(
            [
                { transform: "rotateX(0deg)", filter: "brightness(1)" },
                { transform: "rotateX(-90deg)", filter: "brightness(0.55)" },
            ],
            { duration: d / 2, easing: "ease-in", fill: "forwards" }
        )
        c.fb.animate(
            [
                { transform: "rotateX(90deg)", filter: "brightness(1.35)" },
                { transform: "rotateX(0deg)", filter: "brightness(1)" },
            ],
            {
                duration: d / 2,
                delay: d / 2,
                easing: "cubic-bezier(.2,1.4,.4,1)",
                fill: "both",
            }
        )
        tick()
        c.cur = next
        c.timer = setTimeout(() => {
            c.bot.textContent = next
            c.ft.style.visibility = "hidden"
            c.fb.style.visibility = "hidden"
            c.ft.getAnimations().forEach((x) => x.cancel())
            c.fb.getAnimations().forEach((x) => x.cancel())
            flip(c)
        }, d + 4)
    }

    const target = (c: Cell, ch: string, delay: number) => {
        let seq = live.current.set
        if (!seq.includes(ch)) seq += ch
        if (!seq.includes(c.cur)) seq = c.cur + seq
        const from = seq.indexOf(c.cur)
        const to = seq.indexOf(ch)
        const dist = (to - from + seq.length) % seq.length
        const cap = live.current.maxFlips
        const steps = Math.min(
            dist,
            cap + Math.floor(Math.random() * Math.max(1, cap * 0.6))
        )
        const path: string[] = []
        for (let k = steps - 1; k >= 0; k--)
            path.push(seq[(to - k + seq.length) % seq.length])
        c.seq = path
        if (!c.running && path.length) {
            c.running = true
            clearTimeout(c.timer)
            c.timer = setTimeout(() => flip(c), delay)
        }
    }

    const show = () => {
        const text = pad(
            hovering.current ? hover : msgs[msgIdx.current % msgs.length],
            N
        )
        cells.current.forEach((c, i) =>
            target(c, text[i] || " ", i * live.current.stagger)
        )
    }

    // Build cell controllers whenever the board size or copy changes
    useEffect(() => {
        if (isCanvas) return
        cells.current.forEach((c) => clearTimeout(c.timer))
        cells.current = cellEls.current.slice(0, N).map((el) => {
            const [top, bot, ft, fb] = Array.from(
                el!.children
            ) as HTMLDivElement[]
            const c: Cell = {
                top: top.firstChild as HTMLSpanElement,
                bot: bot.firstChild as HTMLSpanElement,
                ft,
                fb,
                ftText: ft.firstChild as HTMLSpanElement,
                fbText: fb.firstChild as HTMLSpanElement,
                cur: " ",
                seq: [],
                running: false,
            }
            c.top.textContent = c.bot.textContent = " "
            return c
        })
        msgIdx.current = 0
        show()
        return () => cells.current.forEach((c) => clearTimeout(c.timer))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCanvas, N, msgs.join("|"), hover])

    useEffect(() => {
        if (isCanvas || !cycle || msgs.length < 2) return
        const id = setInterval(() => {
            if (hovering.current) return
            msgIdx.current = (msgIdx.current + 1) % msgs.length
            show()
        }, cycleSeconds * 1000)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCanvas, cycle, cycleSeconds, msgs.join("|"), hover, N])

    const enter = () => {
        unlockAudio()
        onMouseEnter?.()
        if (!hovering.current) {
            hovering.current = true
            show()
        }
    }
    const leave = () => {
        onMouseLeave?.()
        if (hovering.current) {
            hovering.current = false
            show()
        }
    }

    const [lifted, setLifted] = React.useState(false)
    const half = cellHeight / 2
    const staticText = pad(msgs[0], N)

    const halfBase: React.CSSProperties = {
        position: "absolute",
        left: 0,
        right: 0,
        height: half,
        overflow: "hidden",
    }
    const glyph = (offset: number): React.CSSProperties => ({
        position: "absolute",
        left: 0,
        right: 0,
        top: offset,
        height: cellHeight,
        lineHeight: `${cellHeight}px`,
        textAlign: "center",
        whiteSpace: "pre",
    })
    const topHalf: React.CSSProperties = {
        ...halfBase,
        top: 0,
        borderRadius: `${cellRadius}px ${cellRadius}px 0 0`,
        background: flapTopColor,
    }
    const botHalf: React.CSSProperties = {
        ...halfBase,
        top: half,
        borderRadius: `0 0 ${cellRadius}px ${cellRadius}px`,
        background: flapColor,
    }

    const Tag: any = link ? "a" : "button"
    const linkProps = link
        ? {
              href: link,
              target: newTab ? "_blank" : undefined,
              rel: newTab ? "noopener noreferrer" : undefined,
          }
        : { type: "button" }

    return (
        <Tag
            {...linkProps}
            aria-label={hover.replace("→", "").trim() || msgs[0]}
            onClick={onClick}
            onPointerDown={unlockAudio}
            onPointerEnter={(e: any) => {
                setLifted(true)
                enter()
            }}
            onPointerLeave={() => {
                setLifted(false)
                leave()
            }}
            onFocus={enter}
            onBlur={leave}
            style={{
                ...style,
                display: "inline-flex",
                gap: cellGap,
                padding,
                border: "none",
                borderRadius: radius,
                background: housingColor,
                cursor: "pointer",
                textDecoration: "none",
                boxSizing: "border-box",
                boxShadow: shadow
                    ? lifted && hoverLift
                        ? "0 2px 3px rgba(29,27,23,0.22), 0 14px 28px rgba(29,27,23,0.18)"
                        : "0 1px 2px rgba(29,27,23,0.2), 0 8px 20px rgba(29,27,23,0.14)"
                    : "none",
                transform: lifted && hoverLift ? "translateY(-1px)" : "none",
                transition: "transform 160ms ease, box-shadow 160ms ease",
            }}
        >
            {Array.from({ length: N }).map((_, i) => (
                <div
                    key={i}
                    aria-hidden
                    ref={(el) => (cellEls.current[i] = el)}
                    style={{
                        position: "relative",
                        width: cellWidth,
                        height: cellHeight,
                        perspective: cellHeight * 4,
                        color: inkColor,
                        fontSize: cellHeight * 0.54,
                        fontWeight: 600,
                        ...font,
                    }}
                >
                    <div style={topHalf}>
                        <span style={glyph(0)}>
                            {isCanvas ? staticText[i] : null}
                        </span>
                    </div>
                    <div style={botHalf}>
                        <span style={glyph(-half)}>
                            {isCanvas ? staticText[i] : null}
                        </span>
                    </div>
                    <div
                        style={{
                            ...topHalf,
                            transformOrigin: "50% 100%",
                            backfaceVisibility: "hidden",
                            visibility: "hidden",
                        }}
                    >
                        <span style={glyph(0)} />
                    </div>
                    <div
                        style={{
                            ...botHalf,
                            transformOrigin: "50% 0%",
                            backfaceVisibility: "hidden",
                            visibility: "hidden",
                        }}
                    >
                        <span style={glyph(-half)} />
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: half - 0.5,
                            height: 1,
                            background: hingeColor,
                        }}
                    />
                </div>
            ))}
        </Tag>
    )
}

SplitFlapButton.defaultProps = {
    messages: ["BOOK A DEMO", "TALK TO SALES", "START FREE"],
    hoverText: "LET'S GO →",
    uppercase: true,
    link: "",
    newTab: false,
    cycle: true,
    cycleSeconds: 3,
    charSet: "full",
    customCharSet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    flipSpeed: 70,
    stagger: 28,
    maxFlips: 6,
    inkColor: "#F4F2F0",
    flapColor: "#1D1B17",
    flapTopColor: "#26231E",
    hingeColor: "rgba(0,0,0,0.6)",
    housingColor: "#0B0A09",
    cellWidth: 30,
    cellHeight: 46,
    cellGap: 3,
    cellRadius: 4,
    padding: 8,
    radius: 12,
    shadow: true,
    hoverLift: true,
    sound: true,
    volume: 0.12,
}

addPropertyControls(SplitFlapButton, {
    messages: {
        type: ControlType.Array,
        title: "Messages",
        control: { type: ControlType.String },
        defaultValue: ["BOOK A DEMO", "TALK TO SALES", "START FREE"],
    },
    hoverText: {
        type: ControlType.String,
        title: "Hover Text",
        defaultValue: "LET'S GO →",
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
    },
    link: { type: ControlType.Link, title: "Link" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (p: Props) => !p.link,
    },
    cycle: { type: ControlType.Boolean, title: "Cycle", defaultValue: true },
    cycleSeconds: {
        type: ControlType.Number,
        title: "Interval",
        min: 1,
        max: 20,
        step: 0.5,
        unit: "s",
        defaultValue: 3,
        hidden: (p: Props) => !p.cycle,
    },
    charSet: {
        type: ControlType.Enum,
        title: "Characters",
        options: ["letters", "alphanumeric", "full", "custom"],
        optionTitles: ["Letters", "Alphanumeric", "Full", "Custom"],
        defaultValue: "full",
    },
    customCharSet: {
        type: ControlType.String,
        title: "Custom Set",
        defaultValue: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        hidden: (p: Props) => p.charSet !== "custom",
    },
    flipSpeed: {
        type: ControlType.Number,
        title: "Flip Speed",
        min: 20,
        max: 400,
        step: 5,
        unit: "ms",
        defaultValue: 70,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 200,
        step: 2,
        unit: "ms",
        defaultValue: 28,
    },
    maxFlips: {
        type: ControlType.Number,
        title: "Max Flips",
        min: 1,
        max: 40,
        step: 1,
        defaultValue: 6,
        displayStepper: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontWeight: 600 },
    },
    inkColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#F4F2F0",
    },
    flapColor: {
        type: ControlType.Color,
        title: "Flap",
        defaultValue: "#1D1B17",
    },
    flapTopColor: {
        type: ControlType.Color,
        title: "Flap Top",
        defaultValue: "#26231E",
    },
    hingeColor: {
        type: ControlType.Color,
        title: "Hinge",
        defaultValue: "rgba(0,0,0,0.6)",
    },
    housingColor: {
        type: ControlType.Color,
        title: "Housing",
        defaultValue: "#0B0A09",
    },
    cellWidth: {
        type: ControlType.Number,
        title: "Cell Width",
        min: 12,
        max: 120,
        unit: "px",
        defaultValue: 30,
    },
    cellHeight: {
        type: ControlType.Number,
        title: "Cell Height",
        min: 16,
        max: 200,
        unit: "px",
        defaultValue: 46,
    },
    cellGap: {
        type: ControlType.Number,
        title: "Cell Gap",
        min: 0,
        max: 20,
        unit: "px",
        defaultValue: 3,
    },
    cellRadius: {
        type: ControlType.Number,
        title: "Cell Radius",
        min: 0,
        max: 30,
        unit: "px",
        defaultValue: 4,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 40,
        unit: "px",
        defaultValue: 8,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        unit: "px",
        defaultValue: 12,
    },
    shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true },
    hoverLift: {
        type: ControlType.Boolean,
        title: "Hover Lift",
        defaultValue: true,
    },
    sound: { type: ControlType.Boolean, title: "Sound", defaultValue: true },
    volume: {
        type: ControlType.Number,
        title: "Volume",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.12,
        hidden: (p: Props) => !p.sound,
    },
    onClick: { type: ControlType.EventHandler },
    onMouseEnter: { type: ControlType.EventHandler },
    onMouseLeave: { type: ControlType.EventHandler },
})
