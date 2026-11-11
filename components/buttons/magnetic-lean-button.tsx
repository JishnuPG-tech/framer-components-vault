import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
    type MotionStyle,
} from "framer-motion"

// QilinMoon Motion Kit: Magnetic Button
// A button that leans toward the pointer on a spring, with the label travelling a little further
// than the body, a fill that rises on hover and an arrow that swaps out.

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const DEFAULTS = {
    label: "Start a project",
    link: "",
    newTab: false,
    variant: "solid",
    background: "#0E0F14",
    color: "#F4EDE0",
    border: "rgba(14,15,20,0.9)",
    hoverFill: "#E2492F",
    hoverColor: "#F4EDE0",
    radius: 999,
    paddingX: 28,
    paddingY: 18,
    strength: 0.35,
    reach: 80,
    arrow: true,
    font: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        lineHeight: "1em",
    } as React.CSSProperties,
}

type Props = Partial<typeof DEFAULTS>

// True while the element is on screen or within `margin` px of it. Global pointer listeners run only then, so an
// instance that is scrolled away does no tracking work.
function useOnScreen(
    ref: React.RefObject<Element>,
    active: boolean,
    margin: number,
    watch?: unknown
) {
    const [on, setOn] = useState(false)
    useEffect(() => {
        if (!active) return
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setOn(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => setOn(entries[entries.length - 1].isIntersecting),
            { rootMargin: `${margin}px` }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [active, margin, watch])
    return on
}

function merge<T extends object>(base: T, props: Partial<T>): T {
    const out: T = { ...base }
    for (const k in props) {
        const v = props[k]
        if (v !== undefined) out[k] = v as T[typeof k]
    }
    return out
}

function Arrow({
    color,
    hover,
    still,
}: {
    color: string
    hover: boolean
    still: boolean
}) {
    const t = still ? { duration: 0 } : { duration: 0.45, ease: EASE }
    const path = (
        <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ display: "block" }}
        >
            <path
                d="M2.5 9.5L9.5 2.5M9.5 2.5H3.75M9.5 2.5V8.25"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
    return (
        <span
            aria-hidden
            style={{
                position: "relative",
                width: 12,
                height: 12,
                overflow: "hidden",
                display: "inline-block",
                flex: "none",
            }}
        >
            <motion.span
                style={{ position: "absolute", inset: 0 }}
                animate={hover && !still ? { x: 14, y: -14 } : { x: 0, y: 0 }}
                transition={t}
            >
                {path}
            </motion.span>
            <motion.span
                style={{ position: "absolute", inset: 0 }}
                initial={{ x: -14, y: 14 }}
                animate={hover && !still ? { x: 0, y: 0 } : { x: -14, y: 14 }}
                transition={t}
            >
                {path}
            </motion.span>
        </span>
    )
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MagneticButton(
    props: Partial<typeof DEFAULTS> & {
        style?: React.CSSProperties
        onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>
    }
) {
    const p = merge(DEFAULTS, props)
    const reduce = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    const still = isStatic || !!reduce

    // One ref for either element: a link renders an anchor, anything else a button.
    const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null)
    const setRef = useCallback(
        (el: HTMLAnchorElement | HTMLButtonElement | null) => {
            ref.current = el
        },
        []
    )
    const [hover, setHover] = useState(false)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const sx = useSpring(x, { stiffness: 210, damping: 16, mass: 0.6 })
    const sy = useSpring(y, { stiffness: 210, damping: 16, mass: 0.6 })
    const lx = useTransform(sx, (v) => v * 0.45)
    const ly = useTransform(sy, (v) => v * 0.45)

    const onScreen = useOnScreen(ref, !still, p.reach, p.link)

    useEffect(() => {
        if (still || !onScreen || typeof window === "undefined") return
        if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
            return
        const move = (e: PointerEvent) => {
            const el = ref.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            const outX = Math.max(0, Math.abs(e.clientX - cx) - r.width / 2)
            const outY = Math.max(0, Math.abs(e.clientY - cy) - r.height / 2)
            if (Math.hypot(outX, outY) < p.reach) {
                x.set((e.clientX - cx) * p.strength)
                y.set((e.clientY - cy) * p.strength)
            } else if (x.get() !== 0 || y.get() !== 0) {
                x.set(0)
                y.set(0)
            }
        }
        window.addEventListener("pointermove", move, { passive: true })
        return () => {
            window.removeEventListener("pointermove", move)
            x.set(0)
            y.set(0)
        }
    }, [still, onScreen, p.reach, p.strength])

    const outline = p.variant === "outline"
    const bg = outline ? "transparent" : p.background
    const fg = hover ? p.hoverColor : p.color
    const style: MotionStyle = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: `${p.paddingY}px ${p.paddingX}px`,
        borderRadius: p.radius,
        // Once the hover fill has risen, the button's own fill switches to it as well: the rising fill is
        // clipped inside the 1 px border, so without this a hairline of the rest fill stays visible around
        // the hovered pill.
        backgroundColor: hover ? p.hoverFill : bg,
        color: fg,
        border: `1px solid ${outline ? p.border : "transparent"}`,
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        whiteSpace: "nowrap",
        isolation: "isolate",
        WebkitTapHighlightColor: "transparent",
        x: still ? 0 : sx,
        y: still ? 0 : sy,
        transition: `color 450ms cubic-bezier(.22,1,.36,1), border-color 450ms, background-color 0s linear ${hover && !still ? "450ms" : "0ms"}`,
        boxSizing: "border-box",
        ...p.font,
        ...props.style,
    }
    const shared = {
        onPointerEnter: () => setHover(true),
        onPointerLeave: () => setHover(false),
        onFocus: () => setHover(true),
        onBlur: () => setHover(false),
        whileTap: still ? undefined : { scale: 0.97 },
        style,
    }
    const inner = (
        <>
            <motion.span
                aria-hidden
                style={{
                    position: "absolute",
                    left: "-10%",
                    width: "120%",
                    aspectRatio: "1 / 1",
                    top: "100%",
                    borderRadius: "50%",
                    background: p.hoverFill,
                    zIndex: -1,
                    pointerEvents: "none",
                }}
                initial={false}
                animate={
                    hover ? { y: "-62%", scale: 1 } : { y: "0%", scale: 0.6 }
                }
                transition={
                    still ? { duration: 0.2 } : { duration: 0.6, ease: EASE }
                }
            />
            <motion.span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    x: still ? 0 : lx,
                    y: still ? 0 : ly,
                }}
            >
                <span>{p.label}</span>
                {p.arrow ? (
                    <Arrow color={fg} hover={hover} still={still} />
                ) : null}
            </motion.span>
        </>
    )

    return p.link ? (
        <motion.a
            ref={setRef}
            href={p.link}
            target={p.newTab ? "_blank" : undefined}
            rel={p.newTab ? "noopener noreferrer" : undefined}
            onClick={props.onClick}
            {...shared}
        >
            {inner}
        </motion.a>
    ) : (
        <motion.button
            ref={setRef}
            type="button"
            onClick={props.onClick}
            {...shared}
        >
            {inner}
        </motion.button>
    )
}

addPropertyControls(MagneticButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: DEFAULTS.label,
    },
    link: { type: ControlType.Link, title: "Link" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: DEFAULTS.newTab,
    },
    variant: {
        type: ControlType.Enum,
        title: "Style",
        options: ["solid", "outline"],
        optionTitles: ["Solid", "Outline"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.variant,
    },
    background: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: DEFAULTS.background,
        hidden: (p: Props) => p.variant === "outline",
    },
    border: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: DEFAULTS.border,
        hidden: (p: Props) => p.variant !== "outline",
    },
    color: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: DEFAULTS.color,
    },
    hoverFill: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: DEFAULTS.hoverFill,
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: DEFAULTS.hoverColor,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    arrow: {
        type: ControlType.Boolean,
        title: "Arrow",
        defaultValue: DEFAULTS.arrow,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 999,
        unit: "px",
        defaultValue: DEFAULTS.radius,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 80,
        unit: "px",
        defaultValue: DEFAULTS.paddingX,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 60,
        unit: "px",
        defaultValue: DEFAULTS.paddingY,
    },
    strength: {
        type: ControlType.Number,
        title: "Pull",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: DEFAULTS.strength,
    },
    reach: {
        type: ControlType.Number,
        title: "Reach",
        min: 0,
        max: 300,
        unit: "px",
        defaultValue: DEFAULTS.reach,
        description: "How far outside the button the pull starts.",
    },
})
