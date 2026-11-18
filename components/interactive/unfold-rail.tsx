import * as React from "react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, useMotionValue, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Img = { src?: string; srcSet?: string; alt?: string }
type Item = { image?: Img; title?: string; text?: string }
type Rect = { top: number; left: number; width: number; height: number }
type Font = React.CSSProperties

interface HeaderProps {
    show: boolean
    title: string
    hint: string
    font: Font
    hintFont: Font
    color: string
    hintColor: string
}
interface LayoutProps {
    cardWidth: number
    gap: number
    paddingX: number
    mobileBreakpoint: number
    mobileCardWidth: number
    background: string
}
interface CardProps {
    radius: number
    captionPadding: number
    captionColor: string
    titleColor: string
    font: Font
    hoverZoom: boolean
}
interface DetailProps {
    overlay: string
    duration: number
    titleFont: Font
    textFont: Font
    textColor: string
    maxWidth: number
}
interface Props {
    items: Item[]
    header: Partial<HeaderProps>
    layout: Partial<LayoutProps>
    card: Partial<CardProps>
    detail: Partial<DetailProps>
    style?: React.CSSProperties
}

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const LOREM = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus, posuere velit aliquet. Donec ullamcorper nulla non metus auctor fringilla.",
    "Cras mattis consectetur purus sit amet fermentum. Aenean lacinia bibendum nulla sed consectetur. Maecenas faucibus mollis interdum. Nullam quis risus eget urna mollis ornare vel eu leo.",
    "Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Etiam porta sem malesuada magna mollis euismod. Curabitur blandit tempus porttitor.",
    "Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.",
].join("\n\n")

const u = (id: string) =>
    `https://images.unsplash.com/${id}?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400`

const DEFAULT_ITEMS: Item[] = [
    { title: "Branding", text: LOREM, image: { src: u("photo-1791474582148-bb1101815ad0"), alt: "Two ceramic vases against a warm orange wall" } },
    { title: "Web Design", text: LOREM, image: { src: u("photo-1579724175242-0204ecac28cb"), alt: "Concrete steps with branch shadows" } },
    { title: "Product Photography", text: LOREM, image: { src: u("photo-1617238749996-ab4c0f9fba57"), alt: "Folded deep blue fabric" } },
    { title: "Motion", text: LOREM, image: { src: u("photo-1697981313183-8d309d26698c"), alt: "Wire sculpture against a pale sky" } },
    { title: "3D Art Direction", text: LOREM, image: { src: u("photo-1794757158869-ab851a7870f2"), alt: "Wooden loops with silver spheres" } },
    { title: "Interiors", text: LOREM, image: { src: u("photo-1638193399915-e22226710f2b"), alt: "Room with a desk and a lamp by the window" } },
]

const DEF_HEADER: HeaderProps = {
    show: true,
    title: "Services",
    hint: "Scroll to explore →",
    font: { fontSize: 48, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: "1em" },
    hintFont: { fontSize: 15, fontWeight: 400, lineHeight: "1.4em" },
    color: "#111111",
    hintColor: "#6E6C68",
}
const DEF_LAYOUT: LayoutProps = {
    cardWidth: 340,
    gap: 24,
    paddingX: 64,
    mobileBreakpoint: 810,
    mobileCardWidth: 280,
    background: "rgba(0,0,0,0)",
}
const DEF_CARD: CardProps = {
    radius: 16,
    captionPadding: 20,
    captionColor: "#FFFFFF",
    titleColor: "#111111",
    font: { fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: "1.2em" },
    hoverZoom: true,
}
const DEF_DETAIL: DetailProps = {
    overlay: "rgba(28, 28, 28, 0.6)",
    duration: 0.7,
    titleFont: { fontSize: 72, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: "0.95em" },
    textFont: { fontSize: 18, fontWeight: 400, lineHeight: "1.65em" },
    textColor: "rgba(255,255,255,0.86)",
    maxWidth: 720,
}

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1]
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const fluid = (fs: React.CSSProperties["fontSize"]) =>
    fs === undefined ? undefined : `min(${typeof fs === "number" ? fs + "px" : fs}, 13vw)`

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * Unfold Rail
 * Horizontal card rail pinned while the page scrolls. Click a card and its
 * image grows to full screen with the details; close reverses the animation.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function UnfoldRail(props: Props) {
    // Framer drops remote default images from array controls, so default items fall back to the sample photos
    const items = (props.items && props.items.length ? props.items : DEFAULT_ITEMS).map((it) =>
        it.image?.src ? it : { ...it, image: DEFAULT_ITEMS.find((d) => d.title === it.title)?.image ?? it.image }
    )
    const header = { ...DEF_HEADER, ...props.header }
    const layout = { ...DEF_LAYOUT, ...props.layout }
    const card = { ...DEF_CARD, ...props.card }
    const detail = { ...DEF_DETAIL, ...props.detail }

    const uid = "ss" + useId().replace(/[^a-zA-Z0-9]/g, "")
    // Static contexts (canvas, exports, thumbnails): no motion, no pinning, no detail view
    const isStaticRenderer = useIsStaticRenderer()
    const isStatic = isStaticRenderer || RenderTarget.current() === RenderTarget.canvas
    const reduceMotion = useReducedMotion()

    const rootRef = useRef<HTMLDivElement>(null)
    const stickyRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const thumbRefs = useRef<(HTMLDivElement | null)[]>([])
    const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
    const closeRef = useRef<HTMLButtonElement>(null)

    const x = useMotionValue(0)
    const [mobile, setMobile] = useState(false)
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(null)
    const [mounted, setMounted] = useState(false)

    const [active, setActive] = useState<number | null>(null)
    const [phase, setPhase] = useState<"idle" | "open" | "closing">("idle")
    const [from, setFrom] = useState<Rect | null>(null)

    useEffect(() => setMounted(true), [])

    /* ---- mobile switch (CSS handles the visuals, JS skips the scroll logic) */
    useEffect(() => {
        if (isStatic) return
        const mq = window.matchMedia(`(max-width: ${layout.mobileBreakpoint - 1}px)`)
        const on = () => setMobile(mq.matches)
        on()
        mq.addEventListener("change", on)
        return () => mq.removeEventListener("change", on)
    }, [layout.mobileBreakpoint, isStatic])

    /* ---- pinned horizontal scroll */
    useEffect(() => {
        if (isStatic || mobile) {
            x.set(0)
            setMeasuredHeight(null)
            return
        }
        const root = rootRef.current
        const sticky = stickyRef.current
        const track = trackRef.current
        if (!root || !sticky || !track) return
        let raf = 0
        const distance = () => Math.max(0, track.scrollWidth - sticky.clientWidth)
        const update = () => {
            const total = root.offsetHeight - window.innerHeight
            const p = total > 0 ? clamp01(-root.getBoundingClientRect().top / total) : 0
            x.set(-distance() * p)
        }
        const measure = () => {
            setMeasuredHeight(window.innerHeight + distance())
            update()
        }
        const onScroll = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(update)
        }
        const onResize = () => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(measure)
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onResize)
        const ro = new ResizeObserver(onResize)
        ro.observe(track)
        ro.observe(sticky)
        measure()
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
            ro.disconnect()
        }
    }, [mobile, isStatic, items.length])

    /* ---- open / close */
    const measureThumb = (i: number): Rect | null => {
        const el = thumbRefs.current[i]
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { top: r.top, left: r.left, width: r.width, height: r.height }
    }
    const open = (i: number) => {
        if (isStatic || phase !== "idle") return
        const r = measureThumb(i)
        if (!r) return
        setActive(i)
        setFrom(r)
        setPhase("open")
    }
    const close = useCallback(() => {
        if (phase !== "open" || active === null) return
        const r = measureThumb(active)
        if (r) setFrom(r)
        setPhase("closing")
    }, [phase, active])
    const finishClose = () => {
        const i = active
        setPhase("idle")
        setFrom(null)
        setActive(null)
        if (i !== null) cardRefs.current[i]?.focus({ preventScroll: true })
    }

    useEffect(() => {
        if (phase === "idle") return
        const html = document.documentElement
        const prevHtml = html.style.overflow
        html.style.overflow = "hidden"
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
        }
        window.addEventListener("keydown", onKey)
        return () => {
            html.style.overflow = prevHtml
            window.removeEventListener("keydown", onKey)
        }
    }, [phase, close])

    useEffect(() => {
        if (phase !== "open") return
        const id = setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 60)
        return () => clearTimeout(id)
    }, [phase])

    /* ---- sizes */
    const n = items.length
    const trackWidth = n * layout.cardWidth + Math.max(0, n - 1) * layout.gap + layout.paddingX * 2
    const pinned = !isStatic
    const rootHeight = !pinned
        ? "auto"
        : measuredHeight !== null
          ? `${measuredHeight}px`
          : `calc(100vh + max(0px, ${trackWidth}px - 100vw))`

    const css = `
.${uid}-track::-webkit-scrollbar{display:none}
@media (max-width:${layout.mobileBreakpoint - 1}px){
  .${uid}-root{height:auto!important}
  .${uid}-sticky{position:relative!important;height:auto!important;padding:48px 0!important}
  .${uid}-track{transform:none!important;overflow-x:auto!important;scroll-snap-type:x mandatory;scroll-padding-left:${layout.paddingX}px;-webkit-overflow-scrolling:touch;scrollbar-width:none;width:100%!important}
  .${uid}-root{--ss-card:${layout.mobileCardWidth}px!important}
}`

    const imgEl = (item: Item, extra: React.CSSProperties = {}) =>
        item.image?.src ? (
            <img
                src={item.image.src}
                srcSet={item.image.srcSet}
                alt={item.image.alt || item.title || ""}
                draggable={false}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...extra }}
            />
        ) : (
            <div style={{ width: "100%", height: "100%", background: "#D9D9D6", ...extra }} />
        )

    /* ---- detail layer (portaled to body so no transformed parent can trap it) */
    const activeItem = active !== null ? items[active] : null
    const isOpen = phase === "open"
    const d = detail.duration
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200
    const vh = typeof window !== "undefined" ? window.innerHeight : 800
    const paragraphs = (activeItem?.text || "")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)

    const morphClosed = from
        ? { top: from.top, left: from.left, width: from.width, height: from.height, borderRadius: card.radius, opacity: 1 }
        : {}
    const morphOpen = { top: 0, left: 0, width: vw, height: vh, borderRadius: 0, opacity: 1 }
    const fadeClosed = { top: 0, left: 0, width: vw, height: vh, borderRadius: 0, opacity: 0 }

    const detailLayer =
        activeItem && from && phase !== "idle" ? (
            <div
                role="dialog"
                aria-modal="true"
                aria-label={activeItem.title}
                style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: isOpen ? "auto" : "none" }}
            >
                <motion.div
                    initial={reduceMotion ? fadeClosed : morphClosed}
                    animate={isOpen ? morphOpen : reduceMotion ? fadeClosed : morphClosed}
                    transition={{ duration: reduceMotion ? d * 0.5 : d, ease: EASE }}
                    onAnimationComplete={() => {
                        if (phase === "closing") finishClose()
                    }}
                    style={{ position: "fixed", overflow: "hidden", willChange: "top,left,width,height" }}
                >
                    <motion.div
                        initial={{ scale: card.hoverZoom ? 1.04 : 1 }}
                        animate={{ scale: isOpen ? 1 : card.hoverZoom ? 1.04 : 1 }}
                        transition={{ duration: d, ease: EASE }}
                        style={{ width: "100%", height: "100%" }}
                    >
                        {imgEl(activeItem)}
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isOpen ? 1 : 0 }}
                        transition={{ duration: d * 0.8, ease: EASE, delay: isOpen && !reduceMotion ? d * 0.25 : 0 }}
                        style={{ position: "absolute", inset: 0, background: detail.overlay }}
                    />
                </motion.div>

                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        overflowY: isOpen ? "auto" : "hidden",
                        overscrollBehavior: "contain",
                    }}
                >
                    <div
                        style={{
                            maxWidth: detail.maxWidth,
                            margin: "0 auto",
                            padding: "clamp(96px, 18vh, 200px) 24px 120px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 28,
                        }}
                    >
                        <motion.h2
                            initial={{ opacity: 0, y: reduceMotion ? 0 : 48 }}
                            animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: reduceMotion ? 0 : 48 }}
                            transition={{ duration: isOpen ? d * 0.9 : d * 0.35, ease: EASE, delay: isOpen ? d * 0.55 : 0 }}
                            style={{ margin: 0, color: "#fff", ...detail.titleFont, fontSize: fluid(detail.titleFont.fontSize) }}
                        >
                            {activeItem.title}
                        </motion.h2>
                        <motion.div
                            initial={{ opacity: 0, y: reduceMotion ? 0 : 32 }}
                            animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: reduceMotion ? 0 : 24 }}
                            transition={{ duration: isOpen ? d * 0.9 : d * 0.3, ease: EASE, delay: isOpen ? d * 0.7 : 0 }}
                            style={{ display: "flex", flexDirection: "column", gap: "1.1em" }}
                        >
                            {paragraphs.map((p, i) => (
                                <p key={i} style={{ margin: 0, color: detail.textColor, ...detail.textFont }}>
                                    {p}
                                </p>
                            ))}
                        </motion.div>
                    </div>
                </div>

                <motion.button
                    ref={closeRef}
                    type="button"
                    aria-label="Close"
                    onClick={close}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: d * 0.6, ease: EASE, delay: isOpen ? d * 0.6 : 0 }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    style={{
                        position: "fixed",
                        top: 24,
                        right: 24,
                        width: 48,
                        height: 48,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.28)",
                        background: "rgba(255,255,255,0.12)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        padding: 0,
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                </motion.button>
            </div>
        ) : null

    /* ---- render */
    return (
        <div
            ref={rootRef}
            className={`${uid}-root`}
            style={
                {
                    ...props.style,
                    position: "relative",
                    width: "100%",
                    height: rootHeight,
                    background: layout.background,
                    ["--ss-card" as any]: `${layout.cardWidth}px`,
                } as React.CSSProperties
            }
        >
            <style>{css}</style>
            <div
                ref={stickyRef}
                className={`${uid}-sticky`}
                style={{
                    position: pinned ? "sticky" : "relative",
                    top: 0,
                    height: pinned ? "100vh" : "auto",
                    padding: pinned ? 0 : "48px 0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 40,
                    overflow: "hidden",
                }}
            >
                {header.show ? (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            gap: "8px 24px",
                            padding: `0 ${layout.paddingX}px`,
                        }}
                    >
                        <h2 style={{ margin: 0, color: header.color, ...header.font }}>{header.title}</h2>
                        {header.hint ? (
                            <p style={{ margin: 0, color: header.hintColor, ...header.hintFont }}>{header.hint}</p>
                        ) : null}
                    </div>
                ) : null}

                <motion.div
                    ref={trackRef}
                    className={`${uid}-track`}
                    style={{
                        ...(isStatic ? {} : { x }),
                        display: "flex",
                        gap: layout.gap,
                        padding: `0 ${layout.paddingX}px`,
                        width: "max-content",
                        willChange: isStatic ? "auto" : "transform",
                    }}
                >
                    {items.map((item, i) => {
                        const hidden = active === i && phase !== "idle"
                        return (
                            <motion.button
                                key={i}
                                ref={(el) => {
                                    cardRefs.current[i] = el
                                }}
                                type="button"
                                onClick={() => open(i)}
                                aria-haspopup="dialog"
                                aria-label={item.title}
                                initial="rest"
                                whileHover={card.hoverZoom && !isStatic ? "hover" : undefined}
                                style={{
                                    all: "unset",
                                    boxSizing: "border-box",
                                    flex: "0 0 auto",
                                    width: "var(--ss-card)",
                                    display: "flex",
                                    flexDirection: "column",
                                    borderRadius: card.radius,
                                    overflow: "hidden",
                                    background: card.captionColor,
                                    cursor: isStatic ? "default" : "pointer",
                                    scrollSnapAlign: "start",
                                    WebkitTapHighlightColor: "transparent",
                                    outlineOffset: 4,
                                }}
                            >
                                <div
                                    ref={(el) => {
                                        thumbRefs.current[i] = el
                                    }}
                                    style={{
                                        width: "100%",
                                        aspectRatio: "4 / 5",
                                        overflow: "hidden",
                                        visibility: hidden ? "hidden" : "visible",
                                    }}
                                >
                                    <motion.div
                                        variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
                                        transition={{ duration: 0.6, ease: EASE }}
                                        style={{ width: "100%", height: "100%" }}
                                    >
                                        {imgEl(item)}
                                    </motion.div>
                                </div>
                                <div style={{ padding: card.captionPadding, background: card.captionColor }}>
                                    <p style={{ margin: 0, color: card.titleColor, ...card.font }}>{item.title}</p>
                                </div>
                            </motion.button>
                        )
                    })}
                </motion.div>
            </div>
            {mounted && detailLayer ? createPortal(detailLayer, document.body) : null}
        </div>
    )
}

UnfoldRail.displayName = "Unfold Rail"

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(UnfoldRail, {
    items: {
        type: ControlType.Array,
        title: "Services",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Service" },
                text: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: LOREM },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    header: {
        type: ControlType.Object,
        title: "Header",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEF_HEADER.show },
            title: { type: ControlType.String, title: "Title", defaultValue: DEF_HEADER.title },
            hint: { type: ControlType.String, title: "Hint", defaultValue: DEF_HEADER.hint },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 48, variant: "Medium", letterSpacing: "-0.03em", lineHeight: "1em" },
            },
            color: { type: ControlType.Color, title: "Color", defaultValue: DEF_HEADER.color },
            hintFont: {
                type: ControlType.Font,
                title: "Hint Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 15, variant: "Regular", lineHeight: "1.4em" },
            },
            hintColor: { type: ControlType.Color, title: "Hint Color", defaultValue: DEF_HEADER.hintColor },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: { type: ControlType.Number, title: "Card Width", min: 160, max: 720, step: 1, unit: "px", defaultValue: DEF_LAYOUT.cardWidth },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 120, unit: "px", defaultValue: DEF_LAYOUT.gap },
            paddingX: { type: ControlType.Number, title: "Side Padding", min: 0, max: 240, unit: "px", defaultValue: DEF_LAYOUT.paddingX },
            mobileBreakpoint: { type: ControlType.Number, title: "Swipe Below", min: 0, max: 1600, step: 1, unit: "px", defaultValue: DEF_LAYOUT.mobileBreakpoint, description: "Below this width the rail becomes a native swipe." },
            mobileCardWidth: { type: ControlType.Number, title: "Mobile Card", min: 160, max: 600, unit: "px", defaultValue: DEF_LAYOUT.mobileCardWidth },
            background: { type: ControlType.Color, title: "Background", defaultValue: DEF_LAYOUT.background },
        },
    },
    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 64, unit: "px", defaultValue: DEF_CARD.radius },
            captionPadding: { type: ControlType.Number, title: "Caption Pad", min: 0, max: 64, unit: "px", defaultValue: DEF_CARD.captionPadding },
            captionColor: { type: ControlType.Color, title: "Caption BG", defaultValue: DEF_CARD.captionColor },
            titleColor: { type: ControlType.Color, title: "Title Color", defaultValue: DEF_CARD.titleColor },
            font: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 20, variant: "Medium", letterSpacing: "-0.02em", lineHeight: "1.2em" },
            },
            hoverZoom: { type: ControlType.Boolean, title: "Hover Zoom", defaultValue: DEF_CARD.hoverZoom },
        },
    },
    detail: {
        type: ControlType.Object,
        title: "Detail",
        controls: {
            overlay: { type: ControlType.Color, title: "Overlay", defaultValue: DEF_DETAIL.overlay },
            duration: { type: ControlType.Number, title: "Duration", min: 0.2, max: 2, step: 0.05, unit: "s", defaultValue: DEF_DETAIL.duration },
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 72, variant: "Medium", letterSpacing: "-0.04em", lineHeight: "0.95em" },
            },
            textFont: {
                type: ControlType.Font,
                title: "Text Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 18, variant: "Regular", lineHeight: "1.65em" },
            },
            textColor: { type: ControlType.Color, title: "Text Color", defaultValue: DEF_DETAIL.textColor },
            maxWidth: { type: ControlType.Number, title: "Text Width", min: 320, max: 1200, unit: "px", defaultValue: DEF_DETAIL.maxWidth },
        },
    },
})
