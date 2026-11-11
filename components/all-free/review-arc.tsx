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

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"

interface Item {
    name: string
    company: string
    role: string
    rating: number
    review: string
    avatar?: { src: string; srcSet?: string; alt?: string }
}
interface Behavior { autoplay: boolean; pauseOnHover: boolean; read: number; speed: number }
interface Display { average: boolean; controls: boolean; timer: boolean; shadow: boolean; border: boolean }
interface Colors { accent: string; onAccent: string; star: string; surface: string; chip: string; text: string; muted: string; line: string }
interface Labels { outOf: string; reviews: string; view: string; previous: string; next: string; pause: string; play: string; group: string; empty: string }
interface Props {
    items: Item[]
    behavior: Behavior
    display: Display
    colors: Colors
    labels: Labels
    font?: { fontFamily?: string }
    radius: number
    style?: React.CSSProperties
}

const SAMPLE: Item[] = [
    { name: "Maya Chen", company: "Northwind Labs", role: "Head of Growth, Northwind Labs", rating: 5, review: "The process was clear from day one, and we always knew exactly where the project stood." },
    { name: "Daniel Ortega", company: "Lumen Studio", role: "Founder, Lumen Studio", rating: 5, review: "It saved us weeks of work. What we valued most was how quickly every question got an answer." },
    { name: "Priya Nair", company: "Fieldnote", role: "Product Lead, Fieldnote", rating: 4, review: "A great experience. We started small and kept growing without ever having to switch tools." },
    { name: "Tom Becker", company: "Red Harbor", role: "Operations Manager, Red Harbor", rating: 5, review: "Our team was up and running within days, with no need for long training sessions." },
    { name: "Lucia Reyes", company: "Casa Brio", role: "Co-founder, Casa Brio", rating: 5, review: "You can feel the care in every detail. We would choose them again without a second thought." },
]
const BEHAVIOR: Behavior = { autoplay: true, pauseOnHover: false, read: 6.5, speed: 1 }
const DISPLAY: Display = { average: true, controls: true, timer: true, shadow: true, border: false }
const COLORS: Colors = { accent: "#3D4EE0", onAccent: "#FFFFFF", star: "#E8930C", surface: "#FFFFFF", chip: "#ECEEF6", text: "#15172B", muted: "#636780", line: "#DFE1EC" }
const LABELS: Labels = { outOf: "out of 5", reviews: "reviews", view: "View review from", previous: "Previous review", next: "Next review", pause: "Pause", play: "Play", group: "Customer reviews", empty: "Add a review in the Items list." }

const STACK_BREAKPOINT = 760
const ANGLE = 18
const RADIUS = 340
const CENTER_X = -245
const FACE = 60
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
const EASE_ARRAY = [0.22, 1, 0.36, 1] as const
const SMALL_SCALE = 44 / 72
/** Text motion, with every duration divided by the Speed control. */
function makeMotion(speed: number) {
    return {
        quote: {
            hidden: {},
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { staggerChildren: 0.024 / speed, delayChildren: 0.08 / speed } },
            exit: { opacity: 0, y: -14, filter: "blur(4px)", transition: { duration: 0.3 / speed, ease: EASE_ARRAY } },
        },
        word: {
            hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6 / speed, ease: EASE_ARRAY } },
        },
        line: {
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5 / speed, delay: 0.35 / speed, ease: EASE_ARRAY } },
            exit: { opacity: 0, y: -6, transition: { duration: 0.25 / speed, ease: EASE_ARRAY } },
        },
    }
}

function initialsOf(name: string): string {
    const words = (name ?? "").trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return "?"
    const last = words.length > 1 ? words[words.length - 1][0] : ""
    return (words[0][0] + last).toUpperCase()
}

function Glyph({ d, fill = false, size = 16 }: { d: string; fill?: boolean; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={fill ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
            <path d={d} />
        </svg>
    )
}
const STAR = "M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"
const UP = "m18 15-6-6-6 6"
const DOWN = "m6 9 6 6 6-6"
const PAUSE = "M7 5h4v14H7zM13 5h4v14h-4z"
const PLAY = "M7 4.5v15l12-7.5z"

/**
 * Review Arc
 * Customer reviews on a rotating arc. The ring around the active customer shows the time left before the next review, and it loops.
 * The Pause button stops it, and it honours reduced motion.
 *
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 460
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ReviewArc(props: Props) {
    const items = props.items?.length ? props.items : []
    const behavior = { ...BEHAVIOR, ...props.behavior }
    const display = { ...DISPLAY, ...props.display }
    const colors = { ...COLORS, ...props.colors }
    const labels = { ...LABELS, ...props.labels }
    const { radius = 28, font, style } = props

    const speed = Math.max(0.25, Number(behavior.speed) || 1)
    const motions = React.useMemo(() => makeMotion(speed), [speed])
    const isStatic = useIsStaticRenderer()
    const reduce = useReducedMotion()
    const root = React.useRef<HTMLDivElement>(null)
    const inView = useInView(root, { once: true, margin: "-80px" })
    const hovering = React.useRef(false)
    const elapsed = React.useRef(0)
    const ring = React.useRef<SVGCircleElement | null>(null)
    const previous = React.useRef<number[]>([])

    const [width, setWidth] = React.useState(1040)
    const [activeRaw, setActive] = React.useState(0)
    const [stopped, setStopped] = React.useState(false)
    const [announce, setAnnounce] = React.useState(false)

    const total = items.length
    const active = total ? Math.min(activeRaw, total - 1) : 0
    const item = items[active]
    const stacked = width < STACK_BREAKPOINT
    const animated = !isStatic && !reduce
    const dialHeight = stacked ? 300 : 460
    const dialWidth = stacked ? width : 400
    const centerY = dialHeight / 2

    React.useEffect(() => {
        const node = root.current
        if (!node || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) setWidth(Math.round(entry.contentRect.width))
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    const go = (index: number, manual: boolean) => {
        elapsed.current = 0
        setAnnounce(manual)
        setActive(index)
    }

    React.useEffect(() => {
        if (!animated || !inView || !behavior.autoplay || stopped || total < 2) return
        let frame = 0
        let last = 0
        const readMs = behavior.read * 1000
        const tick = (now: number) => {
            const delta = last ? now - last : 0
            last = now
            if (!(behavior.pauseOnHover && hovering.current)) elapsed.current += delta
            const node = ring.current
            if (node) node.style.strokeDashoffset = String(100 - Math.min(elapsed.current / readMs, 1) * 100)
            if (elapsed.current >= readMs) {
                go((active + 1) % total, false)
                return
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [active, animated, inView, stopped, total, behavior.autoplay, behavior.pauseOnHover, behavior.read])

    const offsets = items.map((_, index) => {
        let offset = (((index - active) % total) + total) % total
        if (offset > total / 2) offset -= total
        return offset
    })
    React.useEffect(() => {
        previous.current = offsets
    })

    const fontFamily = font?.fontFamily ? font.fontFamily + ", system-ui, sans-serif" : "Inter, system-ui, sans-serif"
    const shell: React.CSSProperties = {
        width: "100%", ...style, boxSizing: "border-box", display: "flex", flexDirection: stacked ? "column" : "row", alignItems: stacked ? "stretch" : "center", overflow: "hidden", fontFamily, color: colors.text, background: colors.surface,
        border: display.border ? "1px solid " + colors.line : "none", borderRadius: radius, boxShadow: display.shadow ? "0 1px 2px rgba(20, 19, 43, 0.04), 0 12px 32px -8px rgba(20, 19, 43, 0.1)" : undefined,
    }

    if (!item) {
        return (
            <div ref={root} style={{ ...shell, justifyContent: "center", alignItems: "center", padding: 48, color: colors.muted, fontSize: 15, textAlign: "center" }}>
                {labels.empty}
            </div>
        )
    }

    const average = items.reduce((sum, entry) => sum + (Number(entry.rating) || 0), 0) / total
    const showTimer = display.timer && behavior.autoplay && animated && total > 1
    const roundButton: React.CSSProperties = { width: 40, height: 40, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid " + colors.line, borderRadius: "50%", background: "transparent", color: colors.text, cursor: "pointer" }

    return (
        <div
            ref={root}
            role="group"
            aria-label={labels.group}
            onPointerEnter={() => (hovering.current = true)}
            onPointerLeave={() => (hovering.current = false)}
            style={shell}
        >
            <div style={{ position: "relative", width: stacked ? "100%" : 400, height: dialHeight, flexShrink: 0, overflow: "hidden", borderBottom: stacked ? "1px solid " + colors.line : undefined }}>
                <svg width={dialWidth} height={dialHeight} viewBox={"0 0 " + dialWidth + " " + dialHeight} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0 }}>
                    <circle cx={CENTER_X} cy={centerY} r={RADIUS} fill="none" stroke={colors.muted} strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" strokeDasharray="0.5 8" />
                </svg>
                {items.map((entry, index) => {
                    const offset = offsets[index]
                    const distance = Math.abs(offset)
                    const current = offset === 0
                    const hidden = distance > (stacked ? 1 : 2)
                    const prior = previous.current[index]
                    const jump = prior === undefined || Math.abs(offset - prior) > 2
                    const angle = offset * ANGLE
                    return (
                        <div
                            key={index}
                            style={{
                                position: "absolute", left: CENTER_X, top: centerY, width: 0, height: 0,
                                opacity: hidden ? 0 : 1, pointerEvents: hidden ? "none" : undefined,
                                transform: "rotate(" + angle + "deg) translateX(" + RADIUS + "px) rotate(" + -angle + "deg)",
                                transition: isStatic ? undefined : (jump || reduce ? "" : "transform " + 800 / speed + "ms " + EASE + ", ") + "opacity 300ms ease",
                            }}
                        >
                            <button
                                type="button"
                                aria-label={labels.view + " " + entry.name}
                                aria-current={current ? "true" : undefined}
                                tabIndex={hidden ? -1 : undefined}
                                onClick={() => go(index, true)}
                                style={{ position: "absolute", left: 0, top: 0, transform: "translate(-" + FACE / 2 + "px, -50%)", display: "flex", alignItems: "center", gap: 14, width: Math.max(dialWidth - 115, 170), padding: 0, border: 0, background: "none", color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer" }}
                            >
                                <span style={{ position: "relative", flexShrink: 0, width: FACE, height: FACE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {current && showTimer ? (
                                        <svg viewBox="0 0 36 36" aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", width: 88, height: 88, margin: -44, transform: "rotate(-90deg)" }}>
                                            <circle ref={ring} cx={18} cy={18} r={17} pathLength={100} fill="none" stroke={colors.accent} strokeWidth={1} strokeLinecap="round" strokeDasharray={100} strokeDashoffset={isStatic ? 40 : 100 - Math.min(elapsed.current / (behavior.read * 1000), 1) * 100} />
                                        </svg>
                                    ) : null}
                                    <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", width: 72, height: 72, margin: -36, borderRadius: "50%", background: colors.surface, transform: "scale(" + (current ? 1 : SMALL_SCALE) + ")", transition: reduce ? undefined : "transform " + 600 / speed + "ms " + EASE }} />
                                    <span style={{ position: "relative", opacity: distance === 2 ? 0.45 : 1, width: 72, height: 72, flexShrink: 0, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: current ? colors.accent : colors.chip, color: current ? colors.onAccent : colors.text, fontSize: 23, fontWeight: 600, transform: "scale(" + (current ? 1 : SMALL_SCALE) + ")", transition: reduce ? undefined : "transform " + 600 / speed + "ms " + EASE + ", background-color 300ms ease, color 300ms ease, opacity 300ms ease" }}>
                                        {entry.avatar?.src ? <img src={entry.avatar.src} srcSet={entry.avatar.srcSet} alt={entry.avatar.alt ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : initialsOf(entry.name)}
                                    </span>
                                </span>
                                <span style={{ minWidth: 0, display: "grid", opacity: distance === 2 ? 0.45 : 1, transform: current ? "translateX(20px)" : "none", transition: reduce ? undefined : "transform " + 600 / speed + "ms " + EASE + ", opacity 300ms ease" }}>
                                    <span style={{ fontSize: current ? 20 : 15, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: reduce ? undefined : "font-size 300ms ease" }}>{entry.name}</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: colors.muted, whiteSpace: "nowrap", overflow: "hidden" }}>
                                        <span style={{ color: colors.star, display: "flex" }}><Glyph d={STAR} fill size={13} /></span>
                                        {(Number(entry.rating) || 0).toFixed(1)}
                                        {entry.company ? " · " + entry.company : ""}
                                    </span>
                                </span>
                            </button>
                        </div>
                    )
                })}
            </div>

            <div style={{ minWidth: 0, flex: 1, boxSizing: "border-box", display: "grid", gap: 24, padding: stacked ? 24 : "40px 56px 40px 32px" }}>
                {display.average ? (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 14, color: colors.muted }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{average.toFixed(1)} {labels.outOf}</span>
                        <span>· {total} {labels.reviews}</span>
                    </div>
                ) : null}
                <div aria-live={announce ? "polite" : "off"}>
                    <div style={{ minHeight: "5.2em", fontSize: stacked ? 24 : 32, lineHeight: 1.26 }}>
                        {animated ? (
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.blockquote key={active} variants={motions.quote} initial="hidden" animate="show" exit="exit" style={{ margin: 0, letterSpacing: "-0.025em", fontWeight: 500 }}>
                                    <span style={{ position: "absolute", width: 1, height: 1, margin: -1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>{item.review}</span>
                                    <span aria-hidden="true">
                                        {("“" + item.review + "”").split(/\s+/).map((word, index) => (
                                            <React.Fragment key={index}>
                                                <motion.span variants={motions.word} style={{ display: "inline-block" }}>{word}</motion.span>{" "}
                                            </React.Fragment>
                                        ))}
                                    </span>
                                </motion.blockquote>
                            </AnimatePresence>
                        ) : (
                            <blockquote style={{ margin: 0, letterSpacing: "-0.025em", fontWeight: 500 }}>“{item.review}”</blockquote>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    {animated ? (
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span key={active} variants={motions.line} initial="hidden" animate="show" exit="exit" style={{ fontSize: 14, color: colors.muted }}>{item.role}</motion.span>
                        </AnimatePresence>
                    ) : (
                        <span style={{ fontSize: 14, color: colors.muted }}>{item.role}</span>
                    )}
                    {display.controls && total > 1 ? (
                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" aria-label={labels.previous} onClick={() => go((active - 1 + total) % total, true)} style={roundButton}><Glyph d={UP} /></button>
                            <button type="button" aria-label={labels.next} onClick={() => go((active + 1) % total, true)} style={roundButton}><Glyph d={DOWN} /></button>
                            {behavior.autoplay && !reduce ? (
                                <button type="button" aria-label={stopped ? labels.play : labels.pause} onClick={() => setStopped((value) => !value)} style={roundButton}><Glyph d={stopped ? PLAY : PAUSE} fill /></button>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

ReviewArc.defaultProps = { items: SAMPLE, behavior: BEHAVIOR, display: DISPLAY, colors: COLORS, labels: LABELS, radius: 28 }
ReviewArc.displayName = "Review Arc"

const color = (title: string, defaultValue: string) => ({ type: ControlType.Color as const, title, defaultValue })
const text = (title: string, defaultValue: string) => ({ type: ControlType.String as const, title, defaultValue })
const toggle = (title: string, defaultValue: boolean) => ({ type: ControlType.Boolean as const, title, defaultValue })

addPropertyControls(ReviewArc, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 12,
        defaultValue: SAMPLE,
        control: {
            type: ControlType.Object,
            controls: {
                name: text("Name", "Customer name"),
                company: text("Company", "Company"),
                role: text("Role", "Role, Company"),
                rating: { type: ControlType.Number, title: "Rating", defaultValue: 5, min: 0, max: 5, step: 0.5, description: "The average is calculated from these ratings." },
                review: { type: ControlType.String, title: "Review", defaultValue: "Write what this customer said.", displayTextArea: true },
                avatar: { type: ControlType.ResponsiveImage, title: "Photo" },
            },
        },
    },
    font: { type: ControlType.Font, title: "Font", controls: "basic", defaultFontType: "sans-serif" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 28, min: 0, max: 48, step: 1, unit: "px" },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            autoplay: toggle("Autoplay", BEHAVIOR.autoplay),
            pauseOnHover: { ...toggle("Hover Pause", BEHAVIOR.pauseOnHover), hidden: (value: Behavior) => !value.autoplay },
            speed: { type: ControlType.Number, title: "Speed", defaultValue: BEHAVIOR.speed, min: 0.5, max: 2, step: 0.1, unit: "x", description: "How fast the arc and text move. 1x is the default." },
            read: { type: ControlType.Number, title: "Read Time", defaultValue: BEHAVIOR.read, min: 2, max: 20, step: 0.5, unit: "s", hidden: (value: Behavior) => !value.autoplay },
        },
    },
    display: {
        type: ControlType.Object,
        title: "Show",
        controls: {
            average: toggle("Average", DISPLAY.average),
            controls: toggle("Buttons", DISPLAY.controls),
            timer: toggle("Timer", DISPLAY.timer),
            shadow: toggle("Shadow", DISPLAY.shadow),
            border: toggle("Border", DISPLAY.border),
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            accent: color("Accent", COLORS.accent),
            onAccent: color("On Accent", COLORS.onAccent),
            star: color("Star", COLORS.star),
            surface: color("Surface", COLORS.surface),
            chip: color("Avatar", COLORS.chip),
            text: color("Text", COLORS.text),
            muted: color("Muted", COLORS.muted),
            line: color("Line", COLORS.line),
        },
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            outOf: text("Out Of", LABELS.outOf),
            reviews: text("Reviews", LABELS.reviews),
            view: text("View", LABELS.view),
            previous: text("Previous", LABELS.previous),
            next: text("Next", LABELS.next),
            pause: text("Pause", LABELS.pause),
            play: text("Play", LABELS.play),
            group: text("Group", LABELS.group),
            empty: text("Empty", LABELS.empty),
        },
    },
})
