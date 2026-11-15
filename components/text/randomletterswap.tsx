/**
 * Random Letter Swap
 * —————————————————————————————————————————
 * Two hover variants for kinetic typography.
 * · Forward   — letters fly out, silently reset
 * · Ping Pong — letters hold on hover, return on leave
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 60
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useEffect } from "react"
import { motion, useAnimate } from "framer-motion"

function debounce(fn, wait, opts = {}) {
    let timer = null,
        lastArgs
    return function (...args) {
        lastArgs = args
        if (opts.leading && !timer) fn.apply(this, args)
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
            timer = null
            if (opts.trailing) fn.apply(this, lastArgs)
        }, wait)
    }
}

const PRESETS = {
    gentle: { type: "spring", stiffness: 100, damping: 20 },
    snappy: { type: "spring", stiffness: 260, damping: 28 },
    bouncy: { type: "spring", stiffness: 300, damping: 12 },
    custom: { type: "spring", stiffness: 180, damping: 22 },
}

function mergeDelay(t, delay) {
    return { ...t, delay }
}

export default function RandomLetterSwap({
    label,
    tag,
    variant,
    direction,
    trigger,
    stagger,
    springPreset,
    stiffness,
    damping,
    fontSize,
    fontWeight,
    fontFamily,
    letterSpacing,
    lineHeight,
    textTransform,
    primaryColor,
    hoverColor,
    style,
    href,
    openInNewTab,
    onClick,
}) {
    const [scope, animate] = useAnimate()
    const [blocked, setBlocked] = useState(false)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const spring =
        springPreset === "custom"
            ? { type: "spring", stiffness, damping }
            : PRESETS[springPreset]

    const shuffled = useRef([])
    useEffect(() => {
        shuffled.current = Array.from(
            { length: label.length },
            (_, i) => i
        ).sort(() => Math.random() - 0.5)
    }, [label])

    const outY = direction === "up" ? "-100%" : "100%"
    const inY = direction === "up" ? "100%" : "-100%"

    const runForward = debounce(
        () => {
            if (blocked || isCanvas) return
            setBlocked(true)
            const indices = shuffled.current
            for (let i = 0; i < label.length; i++) {
                const ri = indices[i],
                    delay = i * stagger
                animate(
                    `.lm-${ri}`,
                    { y: outY },
                    mergeDelay(spring, delay)
                ).then(() => animate(`.lm-${ri}`, { y: 0 }, { duration: 0 }))
                animate(`.ls-${ri}`, { top: "0%" }, mergeDelay(spring, delay))
                    .then(() =>
                        animate(`.ls-${ri}`, { top: inY }, { duration: 0 })
                    )
                    .then(() => {
                        if (i === label.length - 1) setBlocked(false)
                    })
            }
        },
        100,
        { leading: true, trailing: true }
    )

    const runPingPongEnter = debounce(
        () => {
            if (blocked || isCanvas) return
            setBlocked(true)
            const indices = shuffled.current
            for (let i = 0; i < label.length; i++) {
                const ri = indices[i],
                    delay = i * stagger
                animate(`.lm-${ri}`, { y: outY }, mergeDelay(spring, delay))
                animate(`.ls-${ri}`, { top: "0%" }, mergeDelay(spring, delay))
            }
        },
        100,
        { leading: true, trailing: true }
    )

    const runPingPongLeave = debounce(
        () => {
            setBlocked(false)
            const indices = shuffled.current
            for (let i = 0; i < label.length; i++) {
                const ri = indices[i],
                    delay = i * stagger
                animate(`.lm-${ri}`, { y: 0 }, mergeDelay(spring, delay))
                animate(`.ls-${ri}`, { top: inY }, mergeDelay(spring, delay))
            }
        },
        100,
        { leading: true, trailing: true }
    )

    const hoverEvents =
        trigger === "hover"
            ? {
                  onHoverStart:
                      variant === "forward" ? runForward : runPingPongEnter,
                  onHoverEnd:
                      variant === "pingpong" ? runPingPongLeave : undefined,
              }
            : {}

    const clickEvent =
        trigger === "click"
            ? { onClick: variant === "forward" ? runForward : runPingPongEnter }
            : { onClick }

    const baseStyle = {
        display: "inline-flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        cursor: trigger === "hover" ? "default" : "pointer",
        fontSize,
        fontWeight,
        fontFamily,
        letterSpacing: `${letterSpacing}em`,
        lineHeight,
        textTransform,
        whiteSpace: "nowrap",
        ...style,
    }

    const Wrapper = motion[tag]

    const content = (
        <Wrapper ref={scope} {...hoverEvents} {...clickEvent} style={baseStyle}>
            <span
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                }}
            >
                {label}
            </span>
            {label.split("").map((char, i) => (
                <span
                    key={i}
                    style={{ position: "relative", display: "inline-flex" }}
                    aria-hidden
                >
                    <motion.span
                        className={`lm-${i}`}
                        style={{
                            position: "relative",
                            color: primaryColor,
                            paddingBottom: "0.08em",
                            display: "inline-block",
                        }}
                    >
                        {char === " " ? "\u00a0" : char}
                    </motion.span>
                    <motion.span
                        className={`ls-${i}`}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: inY,
                            color: hoverColor,
                            display: "inline-block",
                        }}
                    >
                        {char === " " ? "\u00a0" : char}
                    </motion.span>
                </span>
            ))}
        </Wrapper>
    )

    if (href) {
        return (
            <a
                href={href}
                target={openInNewTab ? "_blank" : "_self"}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
                style={{ textDecoration: "none", display: "inline-flex" }}
            >
                {content}
            </a>
        )
    }

    return content
}

RandomLetterSwap.defaultProps = {
    label: "Hover over me",
    tag: "span",
    variant: "pingpong",
    direction: "up",
    trigger: "hover",
    stagger: 0.022,
    springPreset: "snappy",
    stiffness: 180,
    damping: 22,
    fontSize: 32,
    fontWeight: 400,
    fontFamily: "Inter, sans-serif",
    letterSpacing: 0.02,
    lineHeight: 1,
    textTransform: "none",
    primaryColor: "#0f0f0f",
    hoverColor: "#0f0f0f",
}

addPropertyControls(RandomLetterSwap, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Hover over me",
    },
    tag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        defaultValue: "span",
        options: ["span", "p", "h1", "h2", "h3", "div"],
    },
    href: { type: ControlType.String, title: "Link URL", defaultValue: "" },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (p) => !p.href,
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        defaultValue: "pingpong",
        options: ["forward", "pingpong"],
        optionTitles: ["Forward", "Ping Pong"],
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "up",
        options: ["up", "down"],
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        defaultValue: "hover",
        options: ["hover", "click"],
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.022,
        min: 0,
        max: 0.2,
        step: 0.002,
        displayStepper: true,
    },
    springPreset: {
        type: ControlType.Enum,
        title: "Spring",
        defaultValue: "snappy",
        options: ["gentle", "snappy", "bouncy", "custom"],
        optionTitles: ["Gentle", "Snappy", "Bouncy", "Custom"],
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 180,
        min: 10,
        max: 800,
        step: 10,
        displayStepper: true,
        hidden: (p) => p.springPreset !== "custom",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 22,
        min: 1,
        max: 80,
        step: 1,
        displayStepper: true,
        hidden: (p) => p.springPreset !== "custom",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 32,
        min: 8,
        max: 200,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        defaultValue: 400,
        options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        optionTitles: [
            "Thin",
            "Extra Light",
            "Light",
            "Regular",
            "Medium",
            "Semi Bold",
            "Bold",
            "Extra Bold",
            "Black",
        ],
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Inter, sans-serif",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: 0.02,
        min: -0.1,
        max: 0.5,
        step: 0.01,
        displayStepper: true,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1,
        min: 0.8,
        max: 3,
        step: 0.05,
        displayStepper: true,
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Transform",
        defaultValue: "none",
        options: ["none", "uppercase", "lowercase", "capitalize"],
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0f0f0f",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#0f0f0f",
    },
})
