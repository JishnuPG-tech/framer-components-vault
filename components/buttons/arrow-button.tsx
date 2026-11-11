// Arrow Button by Plainware
// A complete pill CTA: on hover the label rolls letter by letter to a copy of itself
// and the arrow slides out while a fresh one slides in behind it.

import { useEffect, useId, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate } from "framer-motion"

type ArrowStyle = "arrow" | "diagonal" | "chevron"

interface ArrowButtonProps {
    label: string
    link?: string
    newTab: boolean
    font: CSSProperties
    textColor: string
    background: string
    hoverBackground?: string
    borderColor: string
    borderWidth: number
    radius: number
    padding: string
    gap: number
    arrowStyle: ArrowStyle
    arrowPosition: "right" | "left"
    arrowSize: number
    arrowWeight: number
    arrowColor?: string
    arrowCircle: boolean
    circleColor: string
    circleSize: number
    stagger: number
    style?: CSSProperties
}

const PATHS: Record<ArrowStyle, string> = {
    arrow: "M4 12h16M13 5l7 7-7 7",
    diagonal: "M7 17 17 7M8 7h9v9",
    chevron: "M9 5l7 7-7 7",
}

// Where the arrow leaves to (x, y as % of its box); the copy enters from the opposite side.
const EXIT: Record<ArrowStyle, [number, number]> = {
    arrow: [100, 0],
    diagonal: [100, -100],
    chevron: [100, 0],
}

const GAP_EM = "0.45em"
const BLEED_Y = "0.12em"

const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

function prefersReducedMotion(): boolean {
    return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
}

function Arrow(props: { path: string; size: number; weight: number; style?: CSSProperties; data: string }) {
    return (
        <span data-pw-arrow={props.data} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...props.style }}>
            <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
                <path d={props.path} stroke="currentColor" strokeWidth={props.weight} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    )
}

/**
 * Arrow Button
 *
 * Pill button whose label rolls and whose arrow swaps on hover.
 * Link or button semantics, keyboard focus, reduced motion.
 *
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 52
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function PlainwareArrowButton(props: ArrowButtonProps) {
    const {
        label = "Get started",
        link,
        newTab = false,
        font,
        textColor = "#0E0F12",
        background = "#D7FF3A",
        hoverBackground,
        borderColor = "rgba(0, 0, 0, 0)",
        borderWidth = 0,
        radius = 999,
        padding = "16px 24px",
        gap = 10,
        arrowStyle = "arrow",
        arrowPosition = "right",
        arrowSize = 18,
        arrowWeight = 2,
        arrowColor,
        arrowCircle = false,
        circleColor = "#0E0F12",
        circleSize = 36,
        stagger = 0.8,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const id = "pw" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const rootRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        if (!root || prefersReducedMotion()) return
        const inners = Array.from(root.querySelectorAll<HTMLElement>("[data-pw-roll]"))
        const main = root.querySelector<HTMLElement>('[data-pw-arrow="main"]')
        const next = root.querySelector<HTMLElement>('[data-pw-arrow="next"]')
        const n = inners.length
        const [ex, ey] = EXIT[arrowStyle] || EXIT.arrow
        const box = main ? main.parentElement : null
        const dx = box ? (box.offsetWidth * ex) / 100 : 0
        const dy = box ? (box.offsetHeight * ey) / 100 : 0
        // hand the copy's parked position to motion in px (the SSR style parks it with the same offset in %)
        if (next) animate(next, { x: -dx, y: -dy }, { duration: 0 })
        let running: { stop: () => void }[] = []
        let on = false

        const set = (hovered: boolean) => {
            if (hovered === on) return
            on = hovered
            running.forEach((c) => c.stop())
            running = inners.map((inner, i) => {
                const copy = inner.lastElementChild as HTMLElement | null
                const distance = copy ? copy.offsetTop : 0
                return animate(
                    inner,
                    { y: hovered ? -distance : 0 },
                    { type: "spring", duration: 0.4, bounce: 0, delay: n ? (0.4 / n) * i * stagger : 0 }
                )
            })
            if (main && next) {
                const t = { type: "spring", duration: 0.6, bounce: 0 } as const
                running.push(animate(main, hovered ? { x: dx, y: dy } : { x: 0, y: 0 }, t))
                running.push(animate(next, hovered ? { x: 0, y: 0 } : { x: -dx, y: -dy }, t))
            }
        }

        const enter = (e: PointerEvent) => {
            if (e.pointerType !== "touch") set(true)
        }
        const leave = (e: PointerEvent) => {
            if (e.pointerType !== "touch") set(false)
        }
        const focus = () => {
            let visible = true
            try {
                visible = root.matches(":focus-visible")
            } catch (err) {}
            if (visible) set(true)
        }
        const blur = () => set(false)

        root.addEventListener("pointerenter", enter)
        root.addEventListener("pointerleave", leave)
        root.addEventListener("focus", focus)
        root.addEventListener("blur", blur)
        return () => {
            root.removeEventListener("pointerenter", enter)
            root.removeEventListener("pointerleave", leave)
            root.removeEventListener("focus", focus)
            root.removeEventListener("blur", blur)
            running.forEach((c) => c.stop())
            inners.forEach((el) => (el.style.transform = ""))
            if (main) main.style.transform = ""
            if (next) next.style.transform = `translateX(${-ex}%) translateY(${-ey}%)`
        }
    }, [isStatic, label, arrowStyle, stagger])

    const [ex, ey] = EXIT[arrowStyle] || EXIT.arrow
    const fixedWidth = !!style && style.width === "100%"
    const hoverBg = hoverBackground || background
    const css =
        `[data-pw-button=${id}]{background-color:${background};transition:background-color .45s cubic-bezier(0.16,1,0.3,1),transform .2s ease-out}` +
        `@media (hover:hover){[data-pw-button=${id}]:hover{background-color:${hoverBg}}}` +
        `[data-pw-button=${id}]:focus-visible{background-color:${hoverBg};outline:2px solid ${background === "transparent" ? textColor : background};outline-offset:3px}` +
        `[data-pw-button=${id}]:active{transform:scale(0.97)}` +
        `@media (prefers-reduced-motion:reduce){[data-pw-button=${id}]{transition:none}[data-pw-button=${id}]:active{transform:none}}`

    const words = label.split(/(\s+)/).filter((w) => w.length > 0)
    const column: CSSProperties = {
        display: "inline-block",
        verticalAlign: "top",
        overflow: "hidden",
        padding: `${BLEED_Y} 0.08em`,
        margin: `-${BLEED_Y} -0.08em`,
    }
    const box = arrowCircle ? circleSize : arrowSize
    const arrowBox = (
        <span
            aria-hidden="true"
            style={{
                position: "relative",
                flex: "none",
                width: box,
                height: box,
                overflow: "hidden",
                borderRadius: arrowCircle ? "50%" : 0,
                background: arrowCircle ? circleColor : "transparent",
                color: arrowColor || textColor,
            }}
        >
            <Arrow data="main" path={PATHS[arrowStyle] || PATHS.arrow} size={arrowSize} weight={arrowWeight} />
            <Arrow
                data="next"
                path={PATHS[arrowStyle] || PATHS.arrow}
                size={arrowSize}
                weight={arrowWeight}
                style={{ transform: `translateX(${-ex}%) translateY(${-ey}%)` }}
            />
        </span>
    )
    const labelNode = (
        <span aria-hidden="true" style={{ display: "block", whiteSpace: "pre", userSelect: "none" }}>
            {words.map((word, wi) =>
                /^\s+$/.test(word) ? (
                    <span key={wi}>{word}</span>
                ) : (
                    <span key={wi} style={{ whiteSpace: "nowrap" }}>
                        {Array.from(word).map((ch, ci) => (
                            <span key={ci} style={column}>
                                <span data-pw-roll="" style={{ display: "block", position: "relative" }}>
                                    <span style={{ display: "block" }}>{ch}</span>
                                    <span style={{ position: "absolute", left: 0, top: `calc(100% + ${GAP_EM})`, display: "block" }}>{ch}</span>
                                </span>
                            </span>
                        ))}
                    </span>
                )
            )}
        </span>
    )

    const Root: any = link ? "a" : "button"
    const semantic = link
        ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined }
        : { type: "button" }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <Root
                ref={rootRef}
                {...semantic}
                data-pw-button={id}
                style={{
                    ...style,
                    position: "relative",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: arrowPosition === "left" ? "row-reverse" : "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap,
                    width: fixedWidth ? "100%" : "max-content",
                    margin: 0,
                    padding,
                    border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
                    borderRadius: radius,
                    color: textColor,
                    textDecoration: "none",
                    cursor: "pointer",
                    appearance: "none",
                    WebkitTapHighlightColor: "transparent",
                    whiteSpace: "nowrap",
                    ...font,
                }}
            >
                <span style={srOnly}>{label}</span>
                {labelNode}
                {arrowBox}
            </Root>
        </>
    )
}

PlainwareArrowButton.displayName = "Arrow Button"

addPropertyControls(PlainwareArrowButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get started",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (props: Partial<ArrowButtonProps>) => !props.link,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#0E0F12",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#D7FF3A",
    },
    hoverBackground: {
        type: ControlType.Color,
        title: "Hover Fill",
        optional: true,
        defaultValue: "#EDEAE3",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 0,
        min: 0,
        max: 8,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255, 255, 255, 0.16)",
        hidden: (props: Partial<ArrowButtonProps>) => !props.borderWidth,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "16px 24px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    arrowStyle: {
        type: ControlType.Enum,
        title: "Arrow",
        options: ["arrow", "diagonal", "chevron"],
        optionTitles: ["→", "↗", "Chevron"],
        defaultValue: "arrow",
        displaySegmentedControl: true,
    },
    arrowPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 18,
        min: 8,
        max: 64,
        step: 1,
        unit: "px",
    },
    arrowWeight: {
        type: ControlType.Number,
        title: "Arrow Weight",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 0.25,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        optional: true,
        description: "Off uses the text color.",
    },
    arrowCircle: {
        type: ControlType.Boolean,
        title: "Circle",
        description: "Puts the arrow in its own filled circle.",
        defaultValue: false,
    },
    circleColor: {
        type: ControlType.Color,
        title: "Circle Color",
        defaultValue: "#0E0F12",
        hidden: (props: Partial<ArrowButtonProps>) => !props.arrowCircle,
    },
    circleSize: {
        type: ControlType.Number,
        title: "Circle Size",
        defaultValue: 36,
        min: 16,
        max: 120,
        step: 1,
        unit: "px",
        hidden: (props: Partial<ArrowButtonProps>) => !props.arrowCircle,
    },
    stagger: {
        type: ControlType.Number,
        title: "Label Stagger",
        description: "0 rolls all letters together, 1 is a full wave.",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
