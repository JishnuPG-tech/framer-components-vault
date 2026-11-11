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

import { motion, useReducedMotion } from "framer-motion"

type Photo = { image?: { src?: string; srcSet?: string; alt?: string }; alt?: string }
interface Props {
    source?: "images" | "cards"
    cards?: React.ReactNode
    images?: Photo[]
    spread?: number
    radius?: number
    paper?: string
    accent?: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 480
 * @framerDisableUnlink
 */
export default function PhotoStack(props: Props) {
    const { source = "images", cards: connectedCards, images = [], spread = 8, radius = 14, paper = "#FFF9EC", accent = "#0944BA", style } = props
    const photos = React.useMemo(() => (Array.isArray(images) ? images : []).filter(p => !!p?.image?.src).map(p => ({ ...p.image, alt: p.alt || p.image?.alt })), [images])
    const connected = React.Children.toArray(connectedCards).filter(React.isValidElement)
    const items: { src?: string; srcSet?: string; alt?: string; node?: React.ReactElement<any> }[] = source === "cards"
        ? connected.map((node, i) => ({ node: node as React.ReactElement<any>, alt: `Card ${i + 1}` }))
        : photos
    const count = items.length
    const itemName = source === "cards" ? "Card" : "Photo"
    const [active, setActive] = React.useState(0)
    const [departure, setDeparture] = React.useState<{ index: number; direction: number; phase: "out" | "back" } | null>(null)
    const [offset, setOffset] = React.useState({ x: 0, y: 0 })
    const [dragging, setDragging] = React.useState(false)
    const prefersReducedMotion = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    const reduce = prefersReducedMotion || isStatic
    const rootId = React.useId().replace(/:/g, "")
    const index = count ? ((active % count) + count) % count : 0
    const busy = React.useRef(false)
    const skipClick = React.useRef(false)
    const gesture = React.useRef<{ id: number; x: number; y: number; time: number; lastX: number; lastTime: number; velocity: number; axis: "pending" | "x" | "y"; width: number } | null>(null)
    const root = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ width: 520, height: 480 })
    React.useEffect(() => {
        const el = root.current
        if (!el || isStatic) return
        const update = () => setSize(previous => previous.width === el.clientWidth && previous.height === el.clientHeight ? previous : { width: el.clientWidth, height: el.clientHeight })
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])
    const cards = React.useRef(new Map<number, HTMLDivElement>())
    const [contentHeight, setContentHeight] = React.useState(0)
    React.useEffect(() => {
        if (source !== "cards") return
        const update = () => {
            const height = Math.max(0, ...Array.from(cards.current.values()).map(el => el.scrollHeight))
            setContentHeight(previous => previous === height ? previous : height)
        }
        update()
        const observer = new ResizeObserver(update)
        cards.current.forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [source, count, isStatic])
    React.useEffect(() => {
        if (root.current?.contains(document.activeElement) && document.activeElement?.getAttribute("data-stack-card") === "true") cards.current.get(index)?.focus({ preventScroll: true })
    }, [index])

    React.useEffect(() => {
        busy.current = false
        gesture.current = null
        setDeparture(null)
        setOffset({ x: 0, y: 0 })
        setDragging(false)
        setActive(0)
    }, [count, source])

    const advance = (direction: number) => {
        if (isStatic || busy.current || count < 2) return
        if (reduce) {
            setActive(i => (i + direction + count) % count)
            setOffset({ x: 0, y: 0 })
            return
        }
        busy.current = true
        setDeparture({ index, direction, phase: "out" })
        setActive((index + direction + count) % count)
        setOffset({ x: 0, y: 0 })
        setDragging(false)
    }
    const completeDeparture = (i: number) => {
        if (!departure || departure.index !== i || !busy.current) return
        if (departure.phase === "out") {
            setDeparture({ ...departure, phase: "back" })
        } else {
            busy.current = false
            setDeparture(null)
        }
    }
    const release = (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
        const g = gesture.current
        if (!g || g.id !== e.pointerId) return
        gesture.current = null
        setDragging(false)
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
        const dx = e.clientX - g.x
        const dy = e.clientY - g.y
        const moved = Math.max(Math.abs(dx), Math.abs(dy)) > 8
        skipClick.current = cancelled || moved
        if (!cancelled && g.axis === "x" && (Math.abs(dx) > Math.max(38, g.width * .15) || (Math.abs(dx) > 18 && Math.abs(g.velocity) > .55))) {
            advance(dx < 0 ? 1 : -1)
        } else setOffset({ x: 0, y: 0 })
    }
    const isCardAction = (target: EventTarget, current: HTMLElement) => {
        if (source !== "cards" || !(target instanceof Element)) return false
        const action = target.closest("a,button,input,select,textarea,[role=button],[contenteditable=true]")
        return !!action && action !== current
    }
    const sr: React.CSSProperties = { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }
    return <div ref={root} className={`ps-${rootId}`} role="region" aria-label={source === "cards" ? "Card stack" : "Photo stack"} aria-roledescription="carousel" style={{ width: "100%", height: "100%", position: "relative", isolation: "isolate", ...style, ...(source === "cards" ? { height: "auto", minHeight: contentHeight || undefined, padding: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", alignItems: "start" } : {}) }}>
        <style>{`.ps-${rootId} [data-stack-card]:focus-visible{outline:3px solid ${accent};outline-offset:6px}`}</style>
        <span id={`${rootId}-instructions`} style={sr}>Click or press Enter or Space to see the next card. Drag left or right, or use the arrow keys to browse.</span>
        {count ? items.map((photo, i) => {
            const depth = (i - index + count) % count
            const front = depth === 0
            const leaving = departure?.index === i
            const slidingOut = leaving && departure.phase === "out"
            const tuckingBack = leaving && departure.phase === "back"
            const poses = [{ x: 0, y: 0, r: spread * .5 }, { x: -.045, y: .012, r: -spread * .55 }, { x: .047, y: -.008, r: spread * .9 }, { x: -.028, y: -.018, r: -spread }, { x: .022, y: .022, r: spread * .2 }]
            const pose = poses[Math.min(depth, 4)]
            const w = size.width
            const h = size.height
            const baseRotate = pose.r
            const exit = departure?.direction === 1 ? -1 : 1
            const x = slidingOut ? exit * w * .18 : front ? offset.x : pose.x * w
            const y = slidingOut ? -h * .025 : front ? offset.y : pose.y * h
            const rotation = slidingOut ? exit * 8 : baseRotate + (front ? offset.x / 34 : 0)
            return <motion.div key={source === "cards" ? `card-${photo.node?.key || i}` : `${photo.src}-${i}`} ref={el => { if (el) cards.current.set(i, el); else cards.current.delete(i) }} role={source === "cards" ? "group" : "button"} data-stack-card="true" tabIndex={front ? 0 : -1} aria-hidden={!front} aria-label={front ? `Next ${itemName.toLowerCase()}. ${photo.alt || `${itemName} ${index + 1}`}` : undefined} aria-describedby={front ? `${rootId}-instructions` : undefined}
                initial={false} animate={{ x, y, rotate: rotation, scale: slidingOut ? 1 : 1 - Math.min(depth, 4) * .006, opacity: 1 }}
                transition={reduce ? { duration: 0 } : dragging && front ? { duration: 0 } : slidingOut ? { duration: .32, ease: [.42, 0, .58, 1] } : tuckingBack ? { duration: .48, ease: [.42, 0, .58, 1] } : { duration: .65, ease: [.42, 0, .58, 1] }}
                onAnimationComplete={() => completeDeparture(i)}
                onPointerDown={front ? e => {
                    if (isCardAction(e.target, e.currentTarget)) return
                    if (count < 2 || busy.current || (e.pointerType === "mouse" && e.button !== 0)) return
                    skipClick.current = false
                    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, time: e.timeStamp, lastX: e.clientX, lastTime: e.timeStamp, velocity: 0, axis: "pending", width: e.currentTarget.clientWidth }
                    e.currentTarget.setPointerCapture(e.pointerId)
                } : undefined}
                onPointerMove={front ? e => {
                    const g = gesture.current
                    if (!g || g.id !== e.pointerId || busy.current) return
                    const dx = e.clientX - g.x, dy = e.clientY - g.y
                    if (g.axis === "pending" && Math.max(Math.abs(dx), Math.abs(dy)) > 8) g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
                    const dt = e.timeStamp - g.lastTime
                    if (dt > 0) g.velocity = (e.clientX - g.lastX) / dt
                    g.lastTime = e.timeStamp; g.lastX = e.clientX
                    if (g.axis === "x") { setDragging(true); setOffset({ x: size.width * .22 * Math.tanh(dx / (size.width * .22)), y: Math.max(-18, Math.min(18, dy * .15)) }) }
                } : undefined}
                onPointerUp={front ? e => release(e) : undefined}
                onPointerCancel={front ? e => release(e, true) : undefined}
                onLostPointerCapture={front ? () => { if (gesture.current) { gesture.current = null; setDragging(false); setOffset({ x: 0, y: 0 }) } } : undefined}
                onClick={front ? e => { if (isCardAction(e.target, e.currentTarget)) return; if (e.detail === 0) { advance(1); return } if (skipClick.current) { skipClick.current = false; return } advance(1) } : undefined}
                onKeyDown={front ? e => { if (e.target !== e.currentTarget) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(1) } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); advance(e.key === "ArrowLeft" ? -1 : 1) } } : undefined}
                style={{ minWidth: 0, gridArea: source === "cards" ? "1 / 1" : undefined, position: source === "cards" ? "relative" : "absolute", left: source === "cards" ? 0 : "14%", top: source === "cards" ? 0 : "11%", width: source === "cards" ? "100%" : "72%", height: source === "cards" ? "auto" : "78%", zIndex: slidingOut ? count + 1 : tuckingBack ? 0 : count - depth, padding: source === "cards" ? 0 : 5, margin: 0, border: 0, boxSizing: "border-box", borderRadius: source === "cards" ? 0 : radius, background: source === "cards" ? "transparent" : paper, boxShadow: source === "cards" ? "none" : "0 3px 10px rgba(16,42,86,.08)", pointerEvents: front ? "auto" : "none", overflow: source === "cards" ? "visible" : "hidden", cursor: count < 2 ? "default" : dragging ? "grabbing" : "grab", touchAction: "pan-y", userSelect: "none", WebkitTapHighlightColor: "transparent" }}>
                {source === "cards" && photo.node ? <div {...(!front ? { inert: "" } as any : {})} style={{ width: "100%", height: "auto", position: "relative", pointerEvents: front ? "auto" : "none" }}>
                    {React.cloneElement(photo.node, { width: "100%", height: photo.node.props.height ?? "auto", position: "relative", left: undefined, top: undefined, style: { ...photo.node.props.style, width: "100%", height: photo.node.props.style?.height ?? photo.node.props.height ?? "auto", position: "relative", left: 0, top: 0 } })}
                </div> : <img src={photo.src} srcSet={photo.srcSet} sizes="(max-width: 809px) 76vw, 440px" alt={front ? photo.alt || "Gallery photo" : ""} draggable={false} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: Math.max(0, radius - 5), pointerEvents: "none" }} />}
            </motion.div>
        }) : <div aria-label={source === "cards" ? "Connect frames or components using Cards" : "Upload photos using the Images property"} style={{ position: source === "cards" ? "relative" : "absolute", minHeight: source === "cards" ? 200 : undefined, inset: source === "cards" ? undefined : "9% 12%", borderRadius: radius, background: paper, border: `2px dashed ${accent}`, opacity: .5 }} />}
        <span style={sr} aria-live="polite" aria-atomic="true">{count ? `${itemName} ${index + 1} of ${count}` : `No ${itemName.toLowerCase()}s`}</span>
    </div>
}

addPropertyControls(PhotoStack, {
    source: { type: ControlType.Enum, title: "Source", options: ["images", "cards"], optionTitles: ["Images", "Cards"], defaultValue: "images", displaySegmentedControl: true },
    cards: { type: ControlType.Array, title: "Cards", control: { type: ControlType.ComponentInstance }, maxCount: 12, hidden: p => p.source !== "cards", description: "Connect frames or components from the canvas. Cards use the full width and their own content height. Click or drag a card to switch; links inside remain clickable." },
    images: { type: ControlType.Array, title: "Images", control: { type: ControlType.Object, controls: { image: { type: ControlType.ResponsiveImage, title: "Photo" }, alt: { type: ControlType.String, title: "Description" } } }, defaultValue: [], maxCount: 12, description: "Add up to 12 photos and a meaningful description for each. Give image instances an explicit height; Cards fit the tallest connected content.", hidden: p => p.source === "cards" },
    spread: { type: ControlType.Number, title: "Spread", min: 0, max: 24, step: 1, defaultValue: 8, unit: "°" },
    radius: { type: ControlType.Number, title: "Corners", min: 0, max: 40, defaultValue: 14, unit: "px", hidden: p => p.source === "cards" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#FFF9EC", hidden: p => p.source === "cards" },
    accent: { type: ControlType.Color, title: "Focus", defaultValue: "#0944BA", description: "[View Complete Template](https://framer.link/AVGjxxi)" },
})
