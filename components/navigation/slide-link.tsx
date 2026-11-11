// Slide Link by Plainware
// On hover (or keyboard focus) the link text slides out one side while a copy slides in from the other.
// Pure CSS transitions: works before hydration, interrupts smoothly, nothing to clean up.
// The clip is exactly as wide as the text, so the copy never shows next to it and the layout never moves.

import { useId, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Direction = "ltr" | "rtl" | "up" | "down"

interface SlideLinkProps {
    text: string
    font: CSSProperties
    color: string
    hoverColor?: string
    direction: Direction
    duration: number
    underline: boolean
    link?: string
    newTab: boolean
    style?: CSSProperties
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"
// Vertical clip room for descenders/underline, and the distance a vertical copy waits beyond it.
const BLEED = "0.18em"
const GAP = "0.3em"

const MOVES: Record<Direction, { out: string; from: string; origin: string }> = {
    ltr: { out: "translateX(100%)", from: "translateX(-100%)", origin: "left" },
    rtl: { out: "translateX(-100%)", from: "translateX(100%)", origin: "right" },
    up: { out: `translateY(calc(-100% - ${GAP}))`, from: `translateY(calc(100% + ${GAP}))`, origin: "left" },
    down: { out: `translateY(calc(100% + ${GAP}))`, from: `translateY(calc(-100% - ${GAP}))`, origin: "left" },
}

/**
 * Slide Link
 *
 * Link text slides out while a copy slides in from the other side.
 * Exact text-width clip, keyboard focus, reduced motion.
 *
 * @framerIntrinsicWidth 100
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function PlainwareSlideLink(props: SlideLinkProps) {
    const {
        text = "Slide Link",
        font,
        color = "#111111",
        hoverColor,
        direction = "ltr",
        duration = 0.6,
        underline = false,
        link,
        newTab = false,
        style,
    } = props

    // CSS-safe id (React escapes quotes in <style> text during SSR, so the selector must not need quotes).
    const id = "pw" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const m = MOVES[direction] || MOVES.ltr
    const hover = hoverColor || color
    const s = `[data-pw-slide=${id}]`
    const moving = `${s} [data-pw-src],${s} [data-pw-copy],${s} [data-pw-line]`
    const on = (state: string) =>
        `${s}${state} [data-pw-src]{transform:${m.out}}${s}${state} [data-pw-copy]{transform:none}${s}${state} [data-pw-line]{transform:scaleX(1)}`
    const css =
        `${moving}{transition:transform ${Math.max(0, duration)}s ${EASE}}` +
        `${s} [data-pw-copy]{transform:${m.from}}` +
        `${s} [data-pw-line]{transform:scaleX(0);transform-origin:${m.origin}}` +
        `@media (hover:hover){${on(":hover")}}` +
        on(":focus-visible") +
        `@media (prefers-reduced-motion:reduce){${moving}{transition:none}` +
        `${s}:hover [data-pw-src],${s}:focus-visible [data-pw-src]{transform:none;color:${hover}}` +
        `${s}:hover [data-pw-copy],${s}:focus-visible [data-pw-copy]{transform:${m.from}}}`

    const Root: any = link ? "a" : "span"
    const linkProps = link
        ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined }
        : {}

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <Root
                {...linkProps}
                data-pw-slide={id}
                style={{
                    ...style,
                    position: "relative",
                    display: "flow-root",
                    width: "max-content",
                    margin: 0,
                    color,
                    textDecoration: "none",
                    cursor: link ? "pointer" : undefined,
                    whiteSpace: "pre",
                    ...font,
                }}
            >
                <span
                    style={{
                        position: "relative",
                        display: "block",
                        overflow: "hidden",
                        padding: `${BLEED} 0`,
                        margin: `-${BLEED} 0`,
                    }}
                >
                    <span data-pw-src="" style={{ display: "block" }}>
                        {text}
                    </span>
                    <span
                        data-pw-copy=""
                        aria-hidden="true"
                        style={{ position: "absolute", left: 0, top: BLEED, display: "block", color: hover }}
                    >
                        {text}
                    </span>
                    {underline ? (
                        <span
                            data-pw-line=""
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: `calc(${BLEED} - 0.04em)`,
                                height: "max(1px, 0.07em)",
                                background: hover,
                                pointerEvents: "none",
                            }}
                        />
                    ) : null}
                </span>
            </Root>
        </>
    )
}

PlainwareSlideLink.displayName = "Slide Link"

addPropertyControls(PlainwareSlideLink, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Slide Link",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (props: Partial<SlideLinkProps>) => !props.link,
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
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        optional: true,
        description: "Color of the copy that slides in. Off keeps the text color.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["ltr", "rtl", "up", "down"],
        optionTitles: ["Left → Right", "Right → Left", "Up", "Down"],
        defaultValue: "ltr",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    underline: {
        type: ControlType.Boolean,
        title: "Underline",
        description: "Draws an underline in on hover.",
        defaultValue: false,
    },
})
