/**
 * Split-Flap Announcement
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component at the top of your page and set its width to Fill.
 * 3. Edit messages, timing and colors in the property panel.
 * 4. Fonts: pick any font in the Font control. A monospace font looks most like a real board.
 *
 * A bold announcement bar (ink bar, yellow flap tiles) that cycles through messages. Every character flips like an airport
 * split-flap board, staggered left to right. Pauses while hovered or focused.
 * Static render shows the first message; reduced motion swaps messages without the flip.
 */
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


type Message = { text: string; link: string }

interface SplitFlapAnnouncementProps {
    messages: Message[]
    interval: number
    flipSpeed: number
    stagger: number
    showClose: boolean
    uppercase: boolean
    fontSize: number
    weight: number
    background: string
    cell: string
    textColor: string
    muted: string
    border: string
    accent: string
    font?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_MESSAGES: Message[] = [
    { text: "New: dark mode", link: "#" },
    { text: "Free shipping", link: "#" },
    { text: "V2 is live", link: "#" },
]

const CELL_W = 0.86 // em
const CELL_GAP = 0.14 // em
const CELL_H = 1.6 // em

/** Centre a string inside `len` cells so every message uses the same board. */
function padCenter(chars: string[], len: number): string[] {
    const left = Math.floor((len - chars.length) / 2)
    const right = len - chars.length - left
    return [...new Array(left).fill(" "), ...chars, ...new Array(right).fill(" ")]
}

function Half(props: { char: string; top: boolean; color: string; className?: string; style?: React.CSSProperties }) {
    const { char, top, color, className, style } = props
    return (
        <span
            className={className}
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: top ? 0 : "50%",
                height: "50%",
                overflow: "hidden",
                background: color,
                borderRadius: top ? "0.18em 0.18em 0 0" : "0 0 0.18em 0.18em",
                transformOrigin: top ? "50% 100%" : "50% 0%",
                backfaceVisibility: "hidden",
                ...style,
            }}
        >
            <span
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: top ? 0 : "-100%",
                    height: "200%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {char === " " ? " " : char}
            </span>
        </span>
    )
}

function Cell(props: { char: string; prev: string; tick: number; delay: number; half: number; animate: boolean; color: string; seam: string }) {
    const { char, prev, tick, delay, half, animate, color, seam } = props
    const flipping = animate && char !== prev
    return (
        <span style={{ position: "relative", display: "inline-block", width: `${CELL_W}em`, height: `${CELL_H}em`, perspective: "4em", flexShrink: 0 }}>
            <Half char={char} top color={color} />
            <Half char={flipping ? prev : char} top={false} color={color} />
            {flipping ? (
                <React.Fragment key={tick}>
                    <Half
                        char={prev}
                        top
                        color={color}
                        className="sfa-flap"
                        style={{ zIndex: 2, animation: `sfa-top ${half}s ease-in ${delay}s both` }}
                    />
                    <Half
                        char={char}
                        top={false}
                        color={color}
                        className="sfa-flap"
                        style={{ zIndex: 2, animation: `sfa-bottom ${half}s ease-out ${delay + half}s both` }}
                    />
                </React.Fragment>
            ) : null}
            <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, marginTop: -0.5, background: seam, zIndex: 3 }} />
        </span>
    )
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function SplitFlapAnnouncement(props: SplitFlapAnnouncementProps) {
    const {
        messages: rawMessages = DEFAULT_MESSAGES,
        interval = 4,
        flipSpeed = 0.5,
        stagger = 0.03,
        showClose = true,
        uppercase = true,
        fontSize = 22,
        weight = 800,
        background = "#0E0E0E",
        cell = "#FFD35C",
        textColor = "#0E0E0E",
        muted = "#F4F4F2",
        border = "rgba(14, 14, 14, 0.12)",
        accent = "#FFD35C",
        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const messages = rawMessages.filter((m) => m && m.text).length ? rawMessages.filter((m) => m && m.text) : DEFAULT_MESSAGES
    const boards = messages.map((m) => Array.from(uppercase ? m.text.toUpperCase() : m.text))
    const len = Math.max(...boards.map((b) => b.length))

    const [state, setState] = React.useState({ index: 0, prev: 0, tick: 0 })
    const [paused, setPaused] = React.useState(false)
    const [dismissed, setDismissed] = React.useState(false)
    const [reduced, setReduced] = React.useState(false)

    React.useEffect(() => {
        if (isStatic) return
        setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    }, [isStatic])

    React.useEffect(() => {
        if (isStatic || paused || dismissed) return
        if (messages.length < 2) return
        const id = window.setInterval(() => {
            setState((s) => ({ index: (s.index + 1) % messages.length, prev: s.index, tick: s.tick + 1 }))
        }, Math.max(1, interval) * 1000)
        return () => window.clearInterval(id)
    }, [isStatic, paused, dismissed, messages.length, interval])

    if (dismissed) return null

    const index = state.index < messages.length ? state.index : 0
    const prevIndex = state.prev < messages.length ? state.prev : index
    const current = padCenter(boards[index], len)
    const previous = padCenter(boards[prevIndex], len)
    const animate = !isStatic && !reduced && state.tick > 0
    const half = Math.max(0.05, flipSpeed / 2)
    const link = messages[index].link
    // Keep an arrow slot on every message when any message links, so the board never jumps sideways.
    const anyLink = messages.some((m) => m.link)
    const slots = len + (anyLink ? 2.1 : 0)
    // Horizontal padding: the close button sits in the right padding, so the board centres in the space left of it.
    const padRight = showClose ? 56 : 16
    const reserve = 16 + padRight
    const cellSize = `min(${fontSize}px, calc((100cqw - ${reserve}px) / ${(slots * (CELL_W + CELL_GAP)).toFixed(2)}))`

    const board = (
        <span aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: `${CELL_GAP}em`, fontSize: cellSize, lineHeight: 1, fontWeight: weight, color: textColor }}>
            {current.map((ch, i) => (
                <Cell
                    key={i}
                    char={ch}
                    prev={previous[i]}
                    tick={state.tick}
                    delay={i * stagger}
                    half={half}
                    animate={animate}
                    color={cell}
                    seam={`color-mix(in srgb, ${background} 30%, transparent)`}
                />
            ))}
            {anyLink ? (
                <span
                    style={{
                        visibility: link ? "visible" : "hidden",
                        width: `${CELL_H}em`,
                        height: `${CELL_H}em`,
                        marginLeft: "0.4em",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 999,
                        background: cell,
                        color: textColor,
                    }}
                >
                    <svg width="50%" height="50%" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            ) : null}
        </span>
    )

    return (
        <div
            role="region"
            aria-label="Announcement"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            style={{
                ...style,
                ...font,
                position: "relative",
                width: "100%",
                ...({ containerType: "inline-size" } as any),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: `12px ${padRight}px 12px 16px`,
                minHeight: 56,
                background,
                borderBottom: `1px solid ${border}`,
                boxSizing: "border-box",
                fontVariantNumeric: "tabular-nums",
            }}
        >
            <style>{`
                @keyframes sfa-top { from { transform: rotateX(0deg); } to { transform: rotateX(-90deg); } }
                @keyframes sfa-bottom { from { transform: rotateX(90deg); } to { transform: rotateX(0deg); } }
                .sfa-link { display: flex; border-radius: 4px; text-decoration: none; }
                .sfa-link:hover { opacity: 0.85; }
                .sfa-link:focus-visible, .sfa-close:focus-visible { outline: 2px solid ${accent}; outline-offset: 3px; }
                .sfa-close:hover { background: ${accent} !important; }
            `}</style>

            <span aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                {messages[index].text}
            </span>

            {link ? (
                <a className="sfa-link" href={link} aria-label={messages[index].text}>
                    {board}
                </a>
            ) : (
                board
            )}

            {showClose ? (
                <button
                    type="button"
                    className="sfa-close"
                    aria-label="Close announcement"
                    onClick={() => setDismissed(true)}
                    style={{
                        position: "absolute",
                        right: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        transition: isStatic ? "none" : "background-color 0.2s ease",
                        width: 30,
                        height: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        border: "none",
                        borderRadius: 999,
                        background: muted,
                        color: background,
                        cursor: "pointer",
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            ) : null}
        </div>
    )
}

addPropertyControls(SplitFlapAnnouncement, {
    messages: {
        type: ControlType.Array,
        title: "Messages",
        control: {
            type: ControlType.Object,
            controls: {
                text: { type: ControlType.String, title: "Text", defaultValue: "New message" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_MESSAGES,
        description: "Short messages fit best on phones (about 18 characters).",
    },
    interval: { type: ControlType.Number, title: "Interval", defaultValue: 4, min: 1, max: 20, step: 0.5, unit: "s", description: "Time each message stays up." },
    flipSpeed: { type: ControlType.Number, title: "Flip Speed", defaultValue: 0.5, min: 0.1, max: 2, step: 0.05, unit: "s", description: "Time for one character to flip." },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.03, min: 0, max: 0.2, step: 0.01, unit: "s", description: "Delay between characters, left to right." },
    showClose: { type: ControlType.Boolean, title: "Close Button", defaultValue: true },
    uppercase: { type: ControlType.Boolean, title: "Uppercase", defaultValue: true },
    fontSize: { type: ControlType.Number, title: "Size", defaultValue: 22, min: 8, max: 40, step: 1, description: "Maximum size. Shrinks to fit narrow screens." },
    weight: { type: ControlType.Number, title: "Weight", defaultValue: 800, min: 100, max: 900, step: 100, description: "Applied on top of the Font." },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#0E0E0E" },
    cell: { type: ControlType.Color, title: "Tile", defaultValue: "#FFD35C", description: "Flap tiles and the link arrow circle." },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#0E0E0E" },
    muted: { type: ControlType.Color, title: "Close Button", defaultValue: "#F4F4F2" },
    border: { type: ControlType.Color, title: "Border", defaultValue: "rgba(14, 14, 14, 0.12)" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#FFD35C", description: "Focus ring." },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "monospace" },
})
