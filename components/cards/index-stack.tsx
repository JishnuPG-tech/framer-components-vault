// Index Stack — sticky cards that pile up like index cards, keeping every title visible.
//
// Brief: generic, brand-free scroll-stacking cards for the Framer Marketplace.
// As the page scrolls, each card sticks a little lower than the previous one, so the next
// card slides over it and leaves only its tab (number + title) showing. The finished pile
// reads like an index: every title still visible. An optional depth effect shrinks and
// dims the cards underneath as they get covered.
//
// HOW IT WORKS
// • Card N is `position: sticky` with `top = topOffset + N × tabHeight`. The tab strip is
//   exactly `tabHeight` tall, so it is the part that stays exposed in the pile.
// • Cards are opaque on purpose: their fill is what hides the card underneath.
// • Depth: a scroll listener on the component's own scroll container, active only while the
//   component is near the viewport (IntersectionObserver) and throttled to one animation
//   frame, measures how far each card is covered and writes `transform` / overlay opacity
//   straight to the DOM. A ResizeObserver handles size changes. Nothing goes through React
//   state, so scrolling never re-renders the cards.
// • `prefers-reduced-motion: reduce` turns the pile into a plain list and switches depth off.
// • On the Framer canvas (static renderer) the depth effect is off; sticky works in Preview
//   and on the published site.
//
// CAUTION: `sticky` stops working if any parent layer clips overflow with Hidden/Scroll/Auto.
// Leave parents on Visible (Clip is fine).

import * as React from "react"
import { startTransition, useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Item = { title: string; text: string }

interface Colors {
    card: string
    title: string
    text: string
    number: string
    border: string
    shade: string
}

interface IndexStackProps {
    items: Item[]
    showNumbers: boolean
    topOffset: number
    tabHeight: number
    cardHeight: number
    spacing: number
    radius: number
    padding: number
    shadow: boolean
    depth: boolean
    depthScale: number
    depthDim: number
    font: React.CSSProperties
    titleSize: number
    textSize: number
    colors: Colors
    maxWidth: number
    style?: React.CSSProperties
}

function usePrefersReducedMotion(): boolean {
    const [reduce, setReduce] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const apply = () => startTransition(() => setReduce(mq.matches))
        apply()
        mq.addEventListener?.("change", apply)
        return () => mq.removeEventListener?.("change", apply)
    }, [])
    return reduce
}

const pad2 = (n: number) => String(n).padStart(2, "0")

/**
 * Index Stack
 * Sticky cards that pile up on scroll, keeping every title visible.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function IndexStack(props: IndexStackProps) {
    const {
        items,
        showNumbers,
        topOffset,
        tabHeight,
        cardHeight,
        spacing,
        radius,
        padding,
        shadow,
        depth,
        depthScale,
        depthDim,
        font,
        titleSize,
        textSize,
        colors,
        maxWidth,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduce = usePrefersReducedMotion()
    const stacking = !reduce
    const depthOn = depth && stacking && !isStatic

    const rootRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<Array<HTMLDivElement | null>>([])
    const shadeRefs = useRef<Array<HTMLDivElement | null>>([])
    const list = items ?? []
    const fontFamily = font?.fontFamily ?? "Inter, system-ui, sans-serif"

    // Depth effect — measured from the real positions, one frame at a time.
    // Performance: the scroll listener is attached only to the component's own scroll
    // container, and only while the component is near or inside the viewport
    // (IntersectionObserver). Size changes are picked up with a ResizeObserver on the
    // component itself, so there are no global document/window listeners.
    useEffect(() => {
        if (typeof window === "undefined") return
        const root = rootRef.current
        const reset = () => {
            cardRefs.current.forEach((el) => el && (el.style.transform = ""))
            shadeRefs.current.forEach((el) => el && (el.style.opacity = "0"))
        }
        if (!depthOn || !root) {
            reset()
            return
        }
        // Sticky positions are relative to the nearest scrolling ancestor (usually the page).
        const findScroller = (el: HTMLElement): HTMLElement | null => {
            let node = el.parentElement
            while (node && node !== document.body && node !== document.documentElement) {
                const oy = getComputedStyle(node).overflowY
                if (oy === "auto" || oy === "scroll") return node
                node = node.parentElement
            }
            return null
        }
        const scroller = findScroller(root)
        const scrollTarget: HTMLElement | Window = scroller ?? window

        let frame = 0
        let active = false
        const measure = () => {
            frame = 0
            if (!active) return
            const n = list.length
            const base = scroller ? scroller.getBoundingClientRect().top : 0
            // How much card j (j ≥ 1) has slid over the card before it: 0 → 1.
            const cover: number[] = new Array(n).fill(0)
            for (let j = 1; j < n; j++) {
                const el = cardRefs.current[j]
                if (!el) continue
                const stuckAt = base + topOffset + j * tabHeight
                const distance = el.getBoundingClientRect().top - stuckAt
                const travel = Math.max(1, cardHeight - tabHeight)
                cover[j] = Math.min(1, Math.max(0, 1 - distance / travel))
            }
            for (let i = 0; i < n; i++) {
                let level = 0
                for (let j = i + 1; j < n; j++) level += cover[j]
                const card = cardRefs.current[i]
                const shade = shadeRefs.current[i]
                const scale = Math.max(0.7, 1 - level * depthScale)
                if (card) card.style.transform = level > 0 ? `scale(${scale})` : ""
                if (shade) shade.style.opacity = String(Math.min(0.6, level * depthDim))
            }
        }
        const schedule = () => {
            if (active && !frame) frame = window.requestAnimationFrame(measure)
        }

        // Only while visible: listen to the scroll container and watch the component's size.
        const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null
        const start = () => {
            if (active) return
            active = true
            scrollTarget.addEventListener("scroll", schedule, { passive: true })
            resizeObserver?.observe(root)
            if (scroller) resizeObserver?.observe(scroller)
            schedule()
        }
        const stop = () => {
            if (!active) return
            active = false
            scrollTarget.removeEventListener("scroll", schedule)
            resizeObserver?.disconnect()
            if (frame) window.cancelAnimationFrame(frame)
            frame = 0
        }

        let intersectionObserver: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    const visible = entries.some((entry) => entry.isIntersecting)
                    if (visible) start()
                    else stop()
                },
                { root: scroller, rootMargin: "200px 0px" }
            )
            intersectionObserver.observe(root)
        } else {
            start()
        }

        return () => {
            intersectionObserver?.disconnect()
            stop()
            resizeObserver?.disconnect()
            reset()
        }
    }, [depthOn, list.length, topOffset, tabHeight, cardHeight, depthScale, depthDim])

    if (!list.length) {
        return (
            <div style={{ ...style, padding: 24, fontFamily, color: colors.text, fontSize: 14 }}>
                Add cards in the properties panel.
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            role="list"
            style={{
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: spacing,
                fontFamily,
                ...style,
                maxWidth,
                marginLeft: "auto",
                marginRight: "auto",
            }}
        >
            {list.map((item, i) => (
                <div
                    key={i}
                    role="listitem"
                    ref={(el) => {
                        cardRefs.current[i] = el
                    }}
                    style={{
                        position: stacking ? "sticky" : "relative",
                        top: stacking ? topOffset + i * tabHeight : undefined,
                        zIndex: i + 1,
                        minHeight: cardHeight,
                        boxSizing: "border-box",
                        backgroundColor: colors.card, // opaque: hides the card underneath
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius,
                        overflow: "hidden",
                        boxShadow: shadow ? "0 -10px 30px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" : "none",
                        transformOrigin: "50% 0%",
                        willChange: depthOn ? "transform" : undefined,
                        // keeps keyboard focus clear of the pile
                        scrollMarginTop: topOffset + list.length * tabHeight,
                        // Equal "runways": sticky stops a card when its margin box reaches the end
                        // of the list. Giving card i an extra (n-1-i) tabs of bottom margin — and
                        // pulling the next card back up by the same amount — makes every card
                        // release at the same moment, so the finished pile leaves intact instead
                        // of collapsing. Flow layout is unchanged.
                        marginBottom: stacking ? (list.length - 1 - i) * tabHeight : 0,
                        marginTop: stacking && i > 0 ? -(list.length - i) * tabHeight : 0,
                    }}
                >
                    {/* The tab: exactly tabHeight tall — the part that stays visible in the pile. */}
                    <div
                        style={{
                            height: tabHeight,
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: `0 ${padding}px`,
                            boxSizing: "border-box",
                            borderBottom: `1px solid ${colors.border}`,
                        }}
                    >
                        {showNumbers ? (
                            <span
                                aria-hidden="true"
                                style={{
                                    fontSize: Math.max(11, titleSize - 5),
                                    fontWeight: 600,
                                    letterSpacing: "0.08em",
                                    color: colors.number,
                                    fontVariantNumeric: "tabular-nums",
                                    flexShrink: 0,
                                }}
                            >
                                {pad2(i + 1)}
                            </span>
                        ) : null}
                        <h3
                            style={{
                                margin: 0,
                                fontSize: titleSize,
                                lineHeight: 1.2,
                                fontWeight: 600,
                                letterSpacing: "-0.01em",
                                color: colors.title,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {item.title}
                        </h3>
                    </div>
                    <p
                        style={{
                            margin: 0,
                            padding: `${padding}px`,
                            fontSize: textSize,
                            lineHeight: 1.6,
                            color: colors.text,
                            whiteSpace: "pre-line",
                        }}
                    >
                        {item.text}
                    </p>
                    {/* Depth shade: darkens the card as it gets covered. */}
                    <div
                        aria-hidden="true"
                        ref={(el) => {
                            shadeRefs.current[i] = el
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: colors.shade,
                            opacity: 0,
                            pointerEvents: "none",
                        }}
                    />
                </div>
            ))}
        </div>
    )
}

IndexStack.defaultProps = {
    items: [
        { title: "Discover", text: "Workshops and interviews to understand the business, the audience and what success looks like." },
        { title: "Define", text: "A clear brief: goals, priorities and the few metrics the project will be measured by." },
        { title: "Design", text: "Structure, visual direction and prototypes, reviewed together at every step." },
        { title: "Build", text: "A fast, responsive site, built in Framer and ready to edit without code." },
        { title: "Launch", text: "Final checks, publishing and a hand-off session so your team owns it from day one." },
    ],
    showNumbers: true,
    topOffset: 24,
    tabHeight: 64,
    cardHeight: 300,
    spacing: 24,
    radius: 20,
    padding: 24,
    shadow: true,
    depth: true,
    depthScale: 0.04,
    depthDim: 0.08,
    titleSize: 20,
    textSize: 16,
    colors: {
        card: "#FFFFFF",
        title: "#111111",
        text: "#5C5C58",
        number: "#7B2FF7",
        border: "#E4E3DE",
        shade: "#111111",
    },
    maxWidth: 720,
}

addPropertyControls(IndexStack, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Card title" },
                text: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: "Card text." },
            },
        },
        defaultValue: IndexStack.defaultProps.items,
    },
    showNumbers: {
        type: ControlType.Boolean,
        title: "Numbers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    topOffset: {
        type: ControlType.Number,
        title: "Top Offset",
        defaultValue: 24,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
        description: "Where the pile starts. Add your navbar height here.",
    },
    tabHeight: {
        type: ControlType.Number,
        title: "Tab Height",
        defaultValue: 64,
        min: 40,
        max: 120,
        step: 1,
        unit: "px",
        description: "The strip of each card that stays visible in the pile.",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 300,
        min: 160,
        max: 800,
        step: 10,
        unit: "px",
        description: "Minimum height. Cards grow with their text.",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 24,
        min: 0,
        max: 160,
        step: 4,
        unit: "px",
        description: "Space between cards before they stack.",
    },
    depth: {
        type: ControlType.Boolean,
        title: "Depth",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Covered cards shrink and dim. Visible in Preview and on the live site.",
    },
    depthScale: {
        type: ControlType.Number,
        title: "Shrink",
        defaultValue: 0.04,
        min: 0,
        max: 0.1,
        step: 0.01,
        description: "How much each covering card shrinks the one below.",
        hidden: (p: Partial<IndexStackProps>) => !p.depth,
    },
    depthDim: {
        type: ControlType.Number,
        title: "Dim",
        defaultValue: 0.08,
        min: 0,
        max: 0.3,
        step: 0.01,
        description: "How much each covering card darkens the one below.",
        hidden: (p: Partial<IndexStackProps>) => !p.depth,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 20,
        min: 14,
        max: 40,
        step: 1,
        unit: "px",
    },
    textSize: {
        type: ControlType.Number,
        title: "Text Size",
        defaultValue: 16,
        min: 12,
        max: 24,
        step: 1,
        unit: "px",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            card: { type: ControlType.Color, title: "Card", defaultValue: "#FFFFFF" },
            title: { type: ControlType.Color, title: "Title", defaultValue: "#111111" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#5C5C58" },
            number: { type: ControlType.Color, title: "Number", defaultValue: "#7B2FF7" },
            border: { type: ControlType.Color, title: "Border", defaultValue: "#E4E3DE" },
            shade: { type: ControlType.Color, title: "Depth Shade", defaultValue: "#111111" },
        },
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 24,
        min: 12,
        max: 64,
        step: 2,
        unit: "px",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 720,
        min: 320,
        max: 1600,
        step: 20,
        unit: "px",
    },
})
