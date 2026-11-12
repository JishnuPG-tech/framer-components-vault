// Rolling Text by Plainware
// A label whose letters roll up to a copy of themselves on hover, one after another in a wave.
// Works on its own, as a link, or inside any button/frame (Hover Target: Parent).

import { useEffect, useRef, type CSSProperties } from "react"
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

interface RollingTextProps {
    text: string
    font: CSSProperties
    color: string
    hoverColor?: string
    direction: "up" | "down"
    stagger: number
    duration: number
    hoverTarget: "self" | "parent"
    link?: string
    newTab: boolean
    style?: CSSProperties
}

// Space between a letter and its copy, and the extra clip room for ascenders/descenders at tight line heights.
const GAP = "0.45em"
const BLEED_Y = "0.12em"
const BLEED_X = "0.08em"

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

// Parent = the link or button around the component, else the frame that holds it.
function findHoverTarget(root: HTMLElement, mode: "self" | "parent"): HTMLElement {
    if (mode === "self") return root
    const container = root.parentElement
    if (!container) return root
    const clickable = container.closest("a, button") as HTMLElement | null
    if (clickable) return clickable
    const frame = /-container\b/.test(String(container.className)) ? container.parentElement : container
    return (frame as HTMLElement) || root
}

/**
 * Rolling Text
 *
 * Letters roll up to a copy of themselves on hover, in a wave.
 * Use it for buttons, navigation and links.
 *
 * @framerIntrinsicWidth 120
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LetterRoll(props: RollingTextProps) {
    const {
        text = "Rolling Text",
        font,
        color = "#111111",
        hoverColor,
        direction = "up",
        stagger = 0.8,
        duration = 0.4,
        hoverTarget = "self",
        link,
        newTab = false,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        if (!root || prefersReducedMotion()) return
        const inners = Array.from(root.querySelectorAll<HTMLElement>("[data-pw-roll]"))
        const n = inners.length
        if (!n) return
        const target = findHoverTarget(root, hoverTarget)
        let running: { stop: () => void }[] = []
        let on = false

        const roll = (next: boolean) => {
            if (next === on) return
            on = next
            running.forEach((c) => c.stop())
            running = inners.map((inner, i) => {
                const copy = inner.lastElementChild as HTMLElement | null
                const distance = copy ? copy.offsetTop : 0
                return animate(
                    inner,
                    { y: next ? -distance : 0 },
                    { type: "spring", duration, bounce: 0, delay: (duration / n) * i * stagger }
                )
            })
        }

        const enter = (e: PointerEvent) => {
            if (e.pointerType !== "touch") roll(true)
        }
        const leave = (e: PointerEvent) => {
            if (e.pointerType !== "touch") roll(false)
        }
        const focusIn = () => roll(true)
        const focusOut = () => roll(false)

        target.addEventListener("pointerenter", enter)
        target.addEventListener("pointerleave", leave)
        target.addEventListener("focusin", focusIn)
        target.addEventListener("focusout", focusOut)

        return () => {
            target.removeEventListener("pointerenter", enter)
            target.removeEventListener("pointerleave", leave)
            target.removeEventListener("focusin", focusIn)
            target.removeEventListener("focusout", focusOut)
            running.forEach((c) => c.stop())
            inners.forEach((inner) => (inner.style.transform = ""))
        }
    }, [isStatic, text, direction, stagger, duration, hoverTarget])

    const autoWidth = !(style && style.width === "100%")
    const words = text.split(/(\s+)/).filter((w) => w.length > 0)
    const column: CSSProperties = {
        display: "inline-block",
        verticalAlign: "top",
        overflow: "hidden",
        padding: `${BLEED_Y} ${BLEED_X}`,
        margin: `-${BLEED_Y} -${BLEED_X}`,
    }
    const inner: CSSProperties = { display: "block", position: "relative" }
    const letter: CSSProperties = { display: "block", whiteSpace: "pre" }
    const copy: CSSProperties = {
        position: "absolute",
        left: 0,
        top: direction === "down" ? `calc(-100% - ${GAP})` : `calc(100% + ${GAP})`,
        display: "block",
        whiteSpace: "pre",
        color: hoverColor || "inherit",
    }

    const Root: any = link ? "a" : "span"
    const linkProps = link
        ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined, "aria-label": text }
        : {}

    return (
        <Root
            ref={rootRef}
            {...linkProps}
            style={{
                ...style,
                position: "relative",
                display: "block",
                margin: 0,
                color,
                textDecoration: "none",
                cursor: link ? "pointer" : undefined,
                ...font,
                whiteSpace: autoWidth ? "nowrap" : "normal",
                width: autoWidth ? "max-content" : style?.width,
            }}
        >
            <span style={srOnly}>{text}</span>
            <span aria-hidden="true" style={{ display: "block", userSelect: "none" }}>
                {words.map((word, wi) =>
                    /^\s+$/.test(word) ? (
                        <span key={wi}>{word}</span>
                    ) : (
                        <span key={wi} style={{ whiteSpace: "nowrap" }}>
                            {Array.from(word).map((ch, ci) => (
                                <span key={ci} style={column}>
                                    <span data-pw-roll="" style={inner}>
                                        <span style={letter}>{ch}</span>
                                        <span style={copy}>{ch}</span>
                                    </span>
                                </span>
                            ))}
                        </span>
                    )
                )}
            </span>
        </Root>
    )
}

LetterRoll.displayName = "Letter Roll"

addPropertyControls(LetterRoll, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Rolling Text",
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
        description: "Color of the letters that roll in. Off keeps the text color.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        defaultValue: "up",
        displaySegmentedControl: true,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        description: "0 rolls all letters together, 1 is a full wave.",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.4,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    hoverTarget: {
        type: ControlType.Enum,
        title: "Hover Target",
        options: ["self", "parent"],
        optionTitles: ["Self", "Parent"],
        defaultValue: "self",
        displaySegmentedControl: true,
        description: "Parent rolls the text when the button or frame around it is hovered.",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (props: Partial<RollingTextProps>) => !props.link,
    },
})
