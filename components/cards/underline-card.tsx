import { useEffect, useLayoutEffect, useRef } from "react"
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


/*
 * Underline Card — the underline under a label stretches across the row,
 * then unfolds downward into a photo card. Stack several for a project list.
 * One 0..1 progress: stretch (line spans the row), unfold (line becomes the card).
 */

type Easing = "smooth" | "expo" | "linear"
type Trigger = "hover" | "tap" | "inView" | "appear"

interface ResponsiveImage {
    src: string
    srcSet?: string
    alt?: string
}

interface Props {
    index: string
    label: string
    meta: string
    labelFont: CSSProperties
    metaFont: CSSProperties
    labelColor: string
    image?: ResponsiveImage
    tint: number
    cardTitle: string
    cardBody: string
    cardFont: CSSProperties
    cardTextColor: string
    lineColor: string
    lineWeight: number
    cardHeight: number
    radius: number
    rowPadding: number
    trigger: Trigger
    duration: number
    easing: Easing
    delay: number
    link: string
    newTab: boolean
    preview: number
    style?: CSSProperties
}

const clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
const EASES: Record<Easing, (t: number) => number> = {
    smooth: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    expo: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    linear: (t) => t,
}
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/** Progress split into its phases, shared by the live and the static render. */
function phases(p: number, easing: Easing) {
    const ease = EASES[easing] || EASES.smooth
    return {
        stretch: ease(clamp(p / 0.35)),
        unfold: ease(clamp((p - 0.35) / 0.65)),
        text: clamp((p - 0.78) / 0.22),
    }
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 96
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function UnderlineCard(props: Props) {
    const {
        index,
        label,
        meta,
        labelFont,
        metaFont,
        labelColor,
        image,
        tint,
        cardTitle,
        cardBody,
        cardFont,
        cardTextColor,
        lineColor,
        lineWeight,
        cardHeight,
        radius,
        rowPadding,
        trigger,
        duration,
        easing,
        delay,
        link,
        newTab,
        preview,
        style,
    } = props

    // Canvas, export and other static renders get one still frame: no observers, no animation.
    const isStatic = useIsStaticRenderer()

    const rootRef = useRef<HTMLDivElement & HTMLAnchorElement>(null)
    const labelRef = useRef<HTMLHeadingElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const inkRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const arrowRef = useRef<HTMLSpanElement>(null)
    const progressRef = useRef<number>(0)

    // Latest layout props, read by apply() without re-subscribing observers.
    const layoutRef = useRef({ easing, lineWeight, cardHeight, radius, rowPadding })
    layoutRef.current = { easing, lineWeight, cardHeight, radius, rowPadding }

    const apply = (p: number): void => {
        progressRef.current = p
        const root = rootRef.current
        const lab = labelRef.current
        const card = cardRef.current
        if (!root || !lab || !card) return
        const L = layoutRef.current
        const W = root.clientWidth
        const lw = Math.min(W, lab.offsetWidth)
        const { stretch: a, unfold: b, text: k } = phases(p, L.easing)

        const ox = Math.max(0, lab.offsetLeft || 0)
        card.style.marginLeft = ox * (1 - a) + "px"
        card.style.width = lw + (W - lw) * a + "px"
        card.style.height = L.lineWeight + (L.cardHeight - L.lineWeight) * b + "px"
        card.style.marginBottom = b * L.rowPadding + "px"
        card.style.borderRadius = Math.min(L.radius, (L.cardHeight * b) / 2) + "px"

        if (inkRef.current) inkRef.current.style.opacity = String(1 - clamp(b / 0.4))
        if (imgRef.current) imgRef.current.style.transform = "scale(" + (1.18 - 0.18 * b) + ")"
        if (textRef.current) {
            textRef.current.style.opacity = String(k)
            textRef.current.style.transform = "translateY(" + (1 - k) * 12 + "px)"
        }
        if (arrowRef.current) arrowRef.current.style.transform = "rotate(" + 90 * a + "deg)"
    }

    // Re-measure when the layout changes (live only).
    useIsoLayoutEffect(() => {
        if (isStatic) return
        apply(progressRef.current)
    }, [isStatic, easing, lineWeight, cardHeight, radius, rowPadding, label, index])

    // Keep the measured geometry in sync with size and font loading (live only).
    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        if (!root) return
        let alive = true
        const ro = new ResizeObserver(() => apply(progressRef.current))
        ro.observe(root)
        if (labelRef.current) ro.observe(labelRef.current)
        document.fonts?.ready.then(() => alive && apply(progressRef.current))
        return () => {
            alive = false
            ro.disconnect()
        }
    }, [isStatic])

    // Triggers (live only).
    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        if (!root) return
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        const noHover = window.matchMedia?.("(hover: none)").matches
        const mode: Trigger = trigger === "hover" && noHover ? "tap" : trigger
        const full = Math.max(0.2, duration) * 1000

        let raf = 0
        let cancelled = false
        let target = 0
        const go = (to: number): void => {
            target = to
            cancelAnimationFrame(raf)
            const from = progressRef.current
            if (reduce) return apply(to)
            const len = full * Math.max(0.15, Math.abs(to - from)) * (to < from ? 0.7 : 1)
            const start = performance.now()
            const step = (now: number): void => {
                if (cancelled) return
                const k = Math.min(1, (now - start) / len)
                apply(from + (to - from) * k)
                if (k < 1) raf = requestAnimationFrame(step)
            }
            raf = requestAnimationFrame(step)
        }

        let timer: ReturnType<typeof setTimeout> | undefined
        let io: IntersectionObserver | null = null
        const enter = (): void => go(1)
        const leave = (): void => go(0)
        const toggle = (e: MouseEvent): void => {
            // First tap on a linked card opens it; a second tap follows the link.
            if (target !== 1 && link) e.preventDefault()
            go(target === 1 ? 0 : 1)
        }

        if (mode === "hover") {
            root.addEventListener("mouseenter", enter)
            root.addEventListener("mouseleave", leave)
            root.addEventListener("focusin", enter)
            root.addEventListener("focusout", leave)
        } else if (mode === "tap") {
            root.addEventListener("click", toggle)
        } else if (mode === "appear") {
            timer = setTimeout(enter, Math.max(0, delay) * 1000)
        } else {
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((en) => en.isIntersecting)) {
                        timer = setTimeout(enter, Math.max(0, delay) * 1000)
                        observer.disconnect()
                    }
                },
                { threshold: 0.6 }
            )
            observer.observe(root)
            io = observer
        }

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            if (timer) clearTimeout(timer)
            io?.disconnect()
            root.removeEventListener("mouseenter", enter)
            root.removeEventListener("mouseleave", leave)
            root.removeEventListener("focusin", enter)
            root.removeEventListener("focusout", leave)
            root.removeEventListener("click", toggle)
        }
    }, [isStatic, trigger, duration, easing, delay, link])

    // Still frame for static renders, scrubbed with Canvas Preview.
    const still = phases(isStatic ? preview : 0, easing)
    const stillStretched = still.stretch >= 0.5
    const stillHeight = lineWeight + (cardHeight - lineWeight) * still.unfold

    const src = image?.src
    const Tag = link ? "a" : "div"
    const linkProps = link ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener" : undefined } : {}
    const interactive = trigger === "tap" || trigger === "hover"

    const cardStyle: CSSProperties = isStatic
        ? {
              position: "relative",
              alignSelf: "flex-start",
              flexShrink: 0,
              overflow: "hidden",
              width: stillStretched ? "100%" : 0,
              height: stillStretched ? stillHeight : lineWeight,
              marginBottom: still.unfold * rowPadding,
              borderRadius: Math.min(radius, (cardHeight * still.unfold) / 2),
          }
        : { position: "relative", alignSelf: "flex-start", flexShrink: 0, overflow: "hidden", height: lineWeight }

    return (
        <Tag
            ref={rootRef}
            {...linkProps}
            tabIndex={!link && interactive ? 0 : undefined}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                textDecoration: "none",
                color: labelColor,
                cursor: interactive || link ? "pointer" : undefined,
                outline: "none",
            }}
        >
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, padding: rowPadding + "px 0 " + Math.round(rowPadding / 2) + "px 0" }}>
                {index ? <span style={{ flexShrink: 0, opacity: 0.5, ...metaFont }}>{index}</span> : null}
                <h3 ref={labelRef} style={{ position: "relative", display: "inline-block", margin: 0, whiteSpace: "nowrap", font: "inherit", ...labelFont }}>
                    {label}
                    {isStatic && !stillStretched ? (
                        <span
                            aria-hidden="true"
                            style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + " + Math.round(rowPadding / 2) + "px)", height: lineWeight, background: lineColor }}
                        />
                    ) : null}
                </h3>
                <span style={{ flex: 1 }} />
                {meta ? <span style={{ flexShrink: 0, opacity: 0.6, ...metaFont }}>{meta}</span> : null}
                <span
                    ref={arrowRef}
                    aria-hidden="true"
                    style={{ flexShrink: 0, display: "inline-block", transform: isStatic ? "rotate(" + 90 * still.stretch + "deg)" : undefined, ...metaFont }}
                >
                    ↗
                </span>
            </div>

            <div ref={cardRef} style={cardStyle}>
                <div
                    ref={imgRef}
                    role={src ? "img" : undefined}
                    aria-label={src ? image?.alt || label : undefined}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: cardHeight,
                        backgroundImage: src ? "url(" + JSON.stringify(src) + ")" : "linear-gradient(135deg, #8a8a8a, #2a2a2a)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        transformOrigin: "50% 0%",
                        transform: "scale(" + (1.18 - 0.18 * still.unfold) + ")",
                    }}
                />
                {tint > 0 ? (
                    <div
                        aria-hidden="true"
                        style={{ position: "absolute", left: 0, right: 0, top: 0, height: cardHeight, background: "linear-gradient(to top, rgba(0,0,0," + tint + "), rgba(0,0,0,0) 60%)" }}
                    />
                ) : null}
                {cardTitle || cardBody ? (
                    <div
                        ref={textRef}
                        style={{
                            position: "absolute",
                            left: 24,
                            right: 24,
                            top: cardHeight - 24,
                            transform: "translateY(" + (1 - still.text) * 12 + "px)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            color: cardTextColor,
                            opacity: still.text,
                        }}
                    >
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                            {cardTitle ? <p style={{ margin: 0, ...cardFont }}>{cardTitle}</p> : null}
                            {cardBody ? <p style={{ margin: 0, opacity: 0.8, ...metaFont }}>{cardBody}</p> : null}
                        </div>
                    </div>
                ) : null}
                <div ref={inkRef} aria-hidden="true" style={{ position: "absolute", inset: 0, background: lineColor, opacity: 1 - clamp(still.unfold / 0.4) }} />
            </div>
        </Tag>
    )
}

UnderlineCard.displayName = "Underline Card"

UnderlineCard.defaultProps = {
    index: "01",
    label: "Dune Studies",
    meta: "2026",
    labelFont: { fontFamily: "Inter", fontWeight: 500, fontSize: 40, letterSpacing: "-0.03em", lineHeight: "1.1em" },
    metaFont: { fontFamily: "Inter", fontWeight: 500, fontSize: 14, lineHeight: "1.3em" },
    labelColor: "#111111",
    image: undefined,
    tint: 0.55,
    cardTitle: "",
    cardBody: "",
    cardFont: { fontFamily: "Inter", fontWeight: 600, fontSize: 22, letterSpacing: "-0.01em", lineHeight: "1.2em" },
    cardTextColor: "#FFFFFF",
    lineColor: "#111111",
    lineWeight: 1,
    cardHeight: 360,
    radius: 6,
    rowPadding: 20,
    trigger: "hover",
    duration: 1.1,
    easing: "smooth",
    delay: 0.2,
    link: "",
    newTab: false,
    preview: 0,
}

addPropertyControls(UnderlineCard, {
    index: { type: ControlType.String, title: "Index", placeholder: "01" },
    label: { type: ControlType.String, title: "Label" },
    meta: { type: ControlType.String, title: "Meta", placeholder: "2026" },
    labelFont: { type: ControlType.Font, title: "Label Font", controls: "extended", defaultFontType: "sans-serif" },
    metaFont: { type: ControlType.Font, title: "Small Font", controls: "extended", defaultFontType: "sans-serif" },
    labelColor: { type: ControlType.Color, title: "Text" },

    image: { type: ControlType.ResponsiveImage, title: "Image" },
    cardHeight: { type: ControlType.Number, title: "Card Height", min: 80, max: 900, step: 10, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 40, step: 1, unit: "px" },
    tint: { type: ControlType.Number, title: "Shade", min: 0, max: 0.9, step: 0.05 },
    cardTitle: { type: ControlType.String, title: "Card Title", placeholder: "Optional" },
    cardBody: { type: ControlType.String, title: "Card Text", placeholder: "Optional", displayTextArea: true },
    cardFont: { type: ControlType.Font, title: "Card Font", controls: "extended", hidden: (p: Props) => !p.cardTitle },
    cardTextColor: { type: ControlType.Color, title: "Card Text Color", hidden: (p: Props) => !p.cardTitle && !p.cardBody },

    lineColor: { type: ControlType.Color, title: "Line" },
    lineWeight: { type: ControlType.Number, title: "Line Weight", min: 1, max: 10, step: 1, unit: "px" },
    rowPadding: { type: ControlType.Number, title: "Row Padding", min: 0, max: 60, step: 2, unit: "px" },

    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "tap", "inView", "appear"],
        optionTitles: ["Hover", "Tap", "In View", "Appear"],
        description: "Hover falls back to tap on touch screens.",
    },
    duration: { type: ControlType.Number, title: "Duration", min: 0.2, max: 5, step: 0.05, unit: "s" },
    delay: { type: ControlType.Number, title: "Delay", min: 0, max: 5, step: 0.1, unit: "s", hidden: (p: Props) => p.trigger === "hover" || p.trigger === "tap" },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["smooth", "expo", "linear"],
        optionTitles: ["Smooth", "Expo", "Linear"],
    },
    link: { type: ControlType.Link, title: "Link" },
    newTab: { type: ControlType.Boolean, title: "New Tab", hidden: (p: Props) => !p.link },
    preview: { type: ControlType.Number, title: "Canvas Preview", min: 0, max: 1, step: 0.01, description: "Scrub the effect on the canvas." },
})
