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

import { motion, useScroll, useTransform, useReducedMotion, useMotionValueEvent } from "framer-motion"

interface Card {
    image?: { src: string; srcSet?: string; alt?: string }
    title?: string
    imageAlt?: string
    description?: string
}
interface Props {
    stage?: { mode?: "viewport" | "fixed"; viewportHeight?: number; fixedHeight?: number }
    headingAppear?: { enabled?: boolean; distance?: number; duration?: number; delay?: number }
    headingSettings?: Partial<Props>
    cardStyle?: Partial<Props>
    typography?: Partial<Props>
    animation?: Partial<Props>
    showHeading?: boolean
    heading?: string
    headingColor?: string
    headingFont?: React.CSSProperties
    cards?: Card[]
    cardWidth?: number
    ratio?: number
    radius?: number
    padding?: number
    rotation?: number
    depth?: number
    distance?: number
    surface?: string
    textColor?: string
    overlay?: number
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    style?: React.CSSProperties
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const titleDefault = { fontFamily: "Inter, sans-serif", fontSize: "30px", fontWeight: 500, lineHeight: "1.1em", letterSpacing: "-0.04em" }
const headingDefault = { fontFamily: "Instrument Serif", fontStyle: "italic", fontWeight: 400, fontSize: "180px", lineHeight: "1em", letterSpacing: "-0.24px" }
const bodyDefault = { fontFamily: "Inter, sans-serif", fontSize: "15px", fontWeight: 400, lineHeight: "1.5em" }

function CardImage({ image, alt }: { image: NonNullable<Card["image"]>; alt: string }) {
    const [failed, setFailed] = React.useState(false)
    if (failed) return null
    return <img src={image.src} srcSet={image.srcSet} alt={alt} draggable={false}
        onError={() => setFailed(true)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
}

function CardFace({ card, p, interactive = true }: { card: Card; p: Props; interactive?: boolean }) {
    const content = React.useRef<HTMLDivElement>(null)
    const [overflows, setOverflows] = React.useState(false)
    React.useEffect(() => {
        const node = content.current
        if (!node) return
        const measure = () => setOverflows(node.scrollHeight > node.clientHeight + 1)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(node)
        return () => observer.disconnect()
    }, [card.title, card.description, p.titleFont, p.bodyFont])
    return <>
        {card.image?.src && <CardImage key={card.image.src} image={card.image} alt={card.imageAlt || card.image.alt || ""} />}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 18%, rgba(0,0,0,${p.overlay}) 100%)`, pointerEvents: "none" }} />
        <div ref={content} tabIndex={overflows && interactive ? 0 : undefined}
            role={overflows ? "region" : undefined} aria-label={overflows ? (card.title || "Card details") : undefined}
            style={{ position: "relative", zIndex: 1, padding: p.padding, color: p.textColor, width: "100%", textAlign: "left", maxHeight: "100%", overflowY: "auto", boxSizing: "border-box", overflowWrap: "anywhere", outlineOffset: -3 }}>
            {card.title && <h3 style={{ ...titleDefault, ...p.titleFont, textAlign: "left", margin: 0 }}>{card.title}</h3>}
            {card.description && <p style={{ ...bodyDefault, ...p.bodyFont, textAlign: "left", margin: card.title ? "12px 0 0" : 0 }}>{card.description}</p>}
        </div>
    </>
}

function MovingCard({ card, index, count, progress, p }: any) {
    const intro = p.showHeading && p.heading?.trim() ? 1.25 : 0
    const step = useTransform(progress, (v: number) => v * (Math.max(0, count - 1) + intro) - intro)
    const [interactive, setInteractive] = React.useState(!intro && index === 0)
    useMotionValueEvent(step, "change", s => setInteractive(s >= index - 0.01 && s < index + 0.99))
    const y = useTransform(step, (s: number) => index > s ? `${clamp(index - s, 0, 1) * 155}%` : `${-Math.min(s - index, 3) * p.depth}%`)
    const scale = useTransform(step, (s: number) => 1 - Math.min(Math.max(s - index, 0), 3) * 0.035)
    const rotate = useTransform(step, (s: number) => (index % 2 ? -1 : 1) * p.rotation * clamp(index - s, -1, 1))
    const opacity = useTransform(step, (s: number) => clamp((1 - (index - s)) * 4, 0, 1))
    return <motion.article aria-label={card.title || `Card ${index + 1}`} style={{
        gridArea: "1 / 1", position: "relative", width: "100%", height: "100%",
        borderRadius: p.radius, background: p.surface, overflow: "hidden",
        display: "flex", alignItems: "flex-end", boxShadow: "0 16px 48px rgba(31,24,16,0.16)",
        zIndex: index + 1, y, scale, rotate, opacity,
    }}><CardFace card={card} p={p} interactive={interactive} /></motion.article>
}

function AnimatedCards({ cards, track, p }: { cards: Card[]; track: React.RefObject<HTMLDivElement>; p: Props }) {
    const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] })
    return <>{cards.map((card, index) => <MovingCard key={index} card={card} index={index} count={cards.length} progress={scrollYProgress} p={p} />)}</>
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function ScrollCardStack(props: Props) {
    const p = {
        cardWidth: 380, ratio: 0.76, radius: 20, padding: 28, rotation: 5,
        depth: 3, distance: 700, textColor: "#FFFFFF",
        overlay: 0.85, showHeading: true, heading: "", headingColor: "#23330F", ...props, ...props.headingSettings, ...props.cardStyle, ...props.typography, ...props.animation, surface: "#000000",
    }
    // Keep existing flat controls compatible with the grouped controls.
    const number = (value: unknown, fallback: number, min: number, max: number) =>
        typeof value === "number" && Number.isFinite(value) ? clamp(value, min, max) : fallback
    p.cardWidth = number(p.cardWidth, 380, 1, 2000)
    p.ratio = number(p.ratio, 0.76, 0.2, 3)
    p.radius = number(p.radius, 20, 0, 200)
    p.padding = number(p.padding, 28, 0, 200)
    p.rotation = number(p.rotation, 5, 0, 30)
    p.depth = number(p.depth, 3, 0, 20)
    p.distance = number(p.distance, 700, 1, 5000)
    p.overlay = number(p.overlay, 0.85, 0, 1)
    const cards = Array.isArray(p.cards) ? p.cards.filter(card => card && typeof card === "object") : []
    const root = React.useRef<HTMLDivElement>(null)
    const track = React.useRef<HTMLDivElement>(null)
    const stageNode = React.useRef<HTMLDivElement>(null)
    const stageMode = p.stage?.mode === "fixed" ? "fixed" : "viewport"
    const stageCSS = stageMode === "fixed" ? `${number(p.stage?.fixedHeight, 800, 120, 2400)}px` : `${number(p.stage?.viewportHeight, 100, 20, 200)}vh`
    const [stageHeight, setStageHeight] = React.useState(800)
    const staticRenderer = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const readable = !!reduced && !staticRenderer
    const intro = p.showHeading && p.heading?.trim() ? 1.25 : 0
    const runway = !staticRenderer && !readable ? (Math.max(0, cards.length - 1) + intro) * p.distance : 0
    React.useEffect(() => {
        const node = stageNode.current
        if (!node || readable) return
        const measure = () => setStageHeight(Math.max(1, node.clientHeight))
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(node)
        return () => observer.disconnect()
    }, [readable, cards.length, stageCSS])
    const cardSize: React.CSSProperties = {
        width: `min(${p.cardWidth}px, calc(100% - 56px), calc(${Math.max(48, stageHeight - 120)}px * ${p.ratio}))`,
        aspectRatio: p.ratio,
    }
    p.padding = Math.min(p.padding, Math.max(8, stageHeight / 10))
    const appear = p.headingAppear || {}
    const animateHeading = !staticRenderer && !readable && appear.enabled !== false
    const appearDistance = number(appear.distance, 24, 0, 120)
    const appearDuration = number(appear.duration, 0.7, 0.1, 3)
    const appearDelay = number(appear.delay, 0, 0, 2)
    const heading = p.showHeading && p.heading ? <motion.h2 initial={animateHeading ? { opacity: 0, y: appearDistance } : false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: animateHeading ? appearDuration : 0, delay: animateHeading ? appearDelay : 0, ease: [0.22, 1, 0.36, 1] }} style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic", fontWeight: 400, lineHeight: "1em", letterSpacing: "-0.24px", ...p.headingFont, fontSize: `min(${typeof p.headingFont?.fontSize === "number" ? `${p.headingFont.fontSize}px` : p.headingFont?.fontSize || "180px"}, max(90px, 14cqw))`, color: p.headingColor, margin: 0, paddingInline: 24, boxSizing: "border-box", textAlign: "center", whiteSpace: "normal", overflowWrap: "anywhere", width: "100%", maxWidth: 1440, flexShrink: 1, ...({ textWrap: "balance" } as React.CSSProperties) }}>{p.heading}</motion.h2> : null
    if (!cards.length) return <div ref={root} style={{ width: "100%", ...p.style, height: 1, marginBottom: 0 }} />
    if (readable) return <div ref={root} style={{ width: "100%", ...p.style, height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 32, paddingBlock: 48, ...({ containerType: "inline-size" } as React.CSSProperties) }}>
        {heading}
        {cards.map((card, i) => <article key={i} style={{ ...cardSize, position: "relative", overflow: "hidden", borderRadius: p.radius, background: p.surface, display: "flex", alignItems: "flex-end" }}><CardFace card={card} p={p} /></article>)}
    </div>
    return <div ref={root} style={{ width: "100%", ...p.style, height: "auto", position: "relative", overflow: "visible", marginBottom: 0, flexShrink: 0 }}>
        <div ref={track} style={{ position: "relative", width: "100%", height: `calc(${stageCSS} + ${runway}px)`, overflow: "visible" }}>
        <div ref={stageNode} style={{ position: "sticky", top: 0, height: stageCSS, width: "100%", display: "grid", placeItems: "center", overflow: "clip", isolation: "isolate", ...({ containerType: "inline-size" } as React.CSSProperties) }}>
            {heading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0, pointerEvents: "none" }}>{heading}</div>}
            <div style={{ ...cardSize, display: "grid", position: "relative", isolation: "isolate", zIndex: 1 }}>
                {staticRenderer
                    ? cards.slice(0, 3).reverse().map((card, reverseIndex, shown) => {
                        const i = shown.length - reverseIndex - 1
                        return <article key={i} style={{ gridArea: "1 / 1", position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: p.radius, background: p.surface, display: "flex", alignItems: "flex-end", transform: `translateY(${-i * p.depth}%) rotate(${i === 0 ? 0 : (i % 2 ? -1 : 1) * p.rotation}deg) scale(${1 - i * .035})`, boxShadow: "0 16px 48px rgba(31,24,16,0.16)" }}><CardFace card={card} p={p} /></article>
                    })
                    : <AnimatedCards cards={cards} track={track} p={p} />}
            </div>
        </div>
        </div>
    </div>
}

const legacyControls: Record<string, any> = {
    showHeading: { type: ControlType.Boolean, title: "Show Heading", defaultValue: true },
    heading: { type: ControlType.String, title: "Heading", defaultValue: "", hidden: p => !p.showHeading },
    headingColor: { type: ControlType.Color, title: "Heading Color", defaultValue: "#23330F", hidden: p => !p.showHeading },
    headingFont: { type: ControlType.Font, title: "Heading Font", controls: "extended", defaultValue: headingDefault, hidden: p => !p.showHeading, description: "Scales down automatically to fit smaller widths." },
    cards: { type: ControlType.Array, title: "Cards", defaultValue: [], control: {
        type: ControlType.Object, controls: {
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            imageAlt: { type: ControlType.String, title: "Image Alt", description: "Describe informative images. Leave blank only for decorative photos.", defaultValue: "" },
            title: { type: ControlType.String, title: "Title", defaultValue: "" },
            description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "" },
        },
    }},
    cardWidth: { type: ControlType.Number, title: "Card Width", defaultValue: 380, min: 200, max: 800, step: 10, unit: "px" },
    ratio: { type: ControlType.Number, title: "Aspect Ratio", defaultValue: .76, min: .5, max: 1.5, step: .01 },
    distance: { type: ControlType.Number, title: "Scroll / Card", defaultValue: 700, min: 250, max: 1500, step: 50, unit: "px", description: "Extra scroll distance per reveal is reserved automatically. Set visible height under Stage. Parent must use Fit height and visible vertical overflow." },
    rotation: { type: ControlType.Number, title: "Rotation", defaultValue: 5, min: 0, max: 12, step: 1, unit: "°" },
    depth: { type: ControlType.Number, title: "Stack Depth", defaultValue: 3, min: 0, max: 8, step: .5, unit: "%" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 80, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 28, min: 12, max: 60, unit: "px" },
    surface: { type: ControlType.Color, title: "Card Fill", defaultValue: "#000000" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    overlay: { type: ControlType.Number, title: "Shade", description: "Darkens the image behind white text. Check contrast after changing images or text colors.", defaultValue: .85, min: 0, max: 1, step: .05 },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultValue: titleDefault },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended", defaultValue: bodyDefault },
}

const controlsFor = (keys: string[]) => Object.fromEntries(keys.map(key => { const { hidden, ...control } = legacyControls[key]; return [key, control] }))
addPropertyControls(ScrollCardStack, {
    stage: { type: ControlType.Object, title: "Stage", description: "Controls the visible area. The component uses Fit height and automatically reserves the full reveal distance. Keep vertical overflow visible on parent frames.", controls: {
        mode: { type: ControlType.Enum, title: "Height", options: ["viewport", "fixed"], optionTitles: ["Viewport", "Fixed"], defaultValue: "viewport" },
        viewportHeight: { type: ControlType.Number, title: "Viewport", defaultValue: 100, min: 20, max: 200, step: 1, unit: "vh", hidden: p => p.mode === "fixed" },
        fixedHeight: { type: ControlType.Number, title: "Fixed", defaultValue: 800, min: 120, max: 2400, step: 10, unit: "px", hidden: p => p.mode !== "fixed" },
    }},
    cards: legacyControls.cards,
    showHeading: legacyControls.showHeading,
    headingSettings: { type: ControlType.Object, title: "Heading", controls: { ...controlsFor(["heading", "headingColor", "headingFont"]),
        headingAppear: { type: ControlType.Object, title: "Appear", controls: {
            enabled: { type: ControlType.Boolean, title: "Enabled", defaultValue: true },
            distance: { type: ControlType.Number, title: "Move Up", defaultValue: 24, min: 0, max: 120, step: 1, unit: "px", hidden: p => p.enabled === false },
            duration: { type: ControlType.Number, title: "Duration", defaultValue: 0.7, min: 0.1, max: 3, step: 0.1, unit: "s", hidden: p => p.enabled === false },
            delay: { type: ControlType.Number, title: "Delay", defaultValue: 0, min: 0, max: 2, step: 0.1, unit: "s", hidden: p => p.enabled === false },
        }, description: "Fades the heading in once when it enters view. Set Move Up to 0 for fade only. Respects reduced motion." },
    }, hidden: p => !p.showHeading },
    cardStyle: { type: ControlType.Object, title: "Card Style", controls: controlsFor(["cardWidth", "ratio", "radius", "padding", "overlay"]) },
    typography: { type: ControlType.Object, title: "Typography", controls: controlsFor(["titleFont", "bodyFont", "textColor"]) },
    animation: { type: ControlType.Object, title: "Animation", controls: controlsFor(["distance", "rotation", "depth"]), description: "[View Complete Project](https://framer.link/GFuMmo6)" },
    ...Object.fromEntries(Object.entries(legacyControls).filter(([key]) => !["cards", "showHeading"].includes(key)).map(([key, control]) => [key, { ...control, hidden: () => true }])),
})
