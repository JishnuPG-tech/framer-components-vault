// Odometer Counter by Republic Marketing, https://www.republicmarketing.co.uk
// MIT licence. Source: https://github.com/rm-sjent/republic-ui
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

import { motion, useInView, useReducedMotion } from "framer-motion"

/* One digit column. Rolls to `digit`, never overlapping its neighbours. */
function Reel({
    digit,
    lh,
    duration,
    delay,
}: {
    digit: number
    lh: number
    duration: number
    delay: number
}) {
    return (
        <span
            style={{
                display: "inline-block",
                overflow: "hidden",
                verticalAlign: "top",
                height: lh,
            }}
        >
            <motion.span
                style={{ display: "flex", flexDirection: "column" }}
                initial={false}
                animate={{ y: -digit * lh }}
                transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
            >
                {Array.from({ length: 10 }).map((_, d) => (
                    <span
                        key={d}
                        style={{
                            display: "block",
                            textAlign: "center",
                            height: lh,
                            lineHeight: `${lh}px`,
                        }}
                    >
                        {d}
                    </span>
                ))}
            </motion.span>
        </span>
    )
}

interface OdometerCounterProps {
    value: number
    prefix?: string
    suffix?: string
    /** digits after the decimal point */
    decimals?: number
    /** add thousands separators, e.g. 12,400 */
    separator?: boolean
    /** font size in px, used to size each digit reel */
    size?: number
    /** roll from zero when the counter scrolls into view */
    startOnView?: boolean
    duration?: number
    /** extra delay per digit, right to left, in seconds */
    stagger?: number
    style?: React.CSSProperties
    className?: string
}

function OdometerCounter({
    value,
    prefix,
    suffix,
    decimals = 0,
    separator = true,
    size = 64,
    startOnView = true,
    duration = 1.2,
    stagger = 0.06,
    style,
    className,
}: OdometerCounterProps) {
    const ref = React.useRef<HTMLSpanElement>(null)
    const inView = useInView(ref, { once: true, amount: 0.6 })
    const reduce = useReducedMotion()
    const live = !startOnView || inView || reduce

    const text = React.useMemo(() => {
        const fixed = Math.abs(value).toFixed(Math.max(0, decimals))
        const [int, dec] = fixed.split(".")
        const grouped = separator
            ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            : int
        return (value < 0 ? "-" : "") + grouped + (dec ? "." + dec : "")
    }, [value, decimals, separator])

    const lh = Math.round(size * 1.1)
    const chars = text.split("")
    const digitCount = chars.filter((c) => /\d/.test(c)).length
    let seen = 0

    return (
        <span
            ref={ref}
            className={className}
            role="img"
            aria-label={`${prefix ?? ""}${text}${suffix ?? ""}`}
            style={{
                display: "inline-flex",
                alignItems: "flex-start",
                fontVariantNumeric: "tabular-nums",
                fontSize: size,
                height: lh,
                lineHeight: `${lh}px`,
                whiteSpace: "nowrap",
                ...style,
            }}
        >
            <span
                aria-hidden
                style={{ display: "inline-flex", userSelect: "none" }}
            >
                {prefix && <span>{prefix}</span>}
                {chars.map((c, i) => {
                    if (!/\d/.test(c))
                        return <span key={`c${chars.length - i}`}>{c}</span>
                    const fromRight = digitCount - 1 - seen++
                    return (
                        <Reel
                            key={chars.length - i}
                            digit={live ? Number(c) : 0}
                            lh={lh}
                            duration={reduce ? 0 : duration}
                            delay={reduce ? 0 : fromRight * stagger}
                        />
                    )
                })}
                {suffix && <span>{suffix}</span>}
            </span>
        </span>
    )
}

const RM_FONTS =
    "https://fonts.googleapis.com/css2?family=Geist:wght@300..600&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..400&display=swap"

function RMRoot({
    children,
    style,
}: {
    children: React.ReactNode
    style?: React.CSSProperties
}) {
    return (
        <div
            className="rmui"
            style={{
                width: "100%",
                fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
                color: "#0b0b0c",
                WebkitFontSmoothing: "antialiased",
                ...style,
            }}
        >
            <link rel="stylesheet" href={RM_FONTS} />
            <style>{RM_CSS}</style>
            {children}
        </div>
    )
}

const pickImage = (img: any, fallback: string): string =>
    (typeof img === "string" ? img : img?.src) || fallback

// Fill any prop Framer has not passed (code preview, older instances) from the control defaults.
function withDefaults(props: any, controls: Record<string, any>) {
    const out: any = { ...props }
    for (const key in controls) {
        if (out[key] === undefined && controls[key]?.defaultValue !== undefined)
            out[key] = controls[key].defaultValue
    }
    return out
}

// @title Odometer Counter

/**
 * Odometer Counter by Republic Marketing
 * A number that rolls into place digit by digit, like a mechanical counter.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function OdometerCounterFramer(props: any) {
    props = withDefaults(props, CONTROLS)
    const {
        value,
        prefix,
        suffix,
        decimals,
        separator,
        startOnView,
        duration,
        stagger,
        color,
        font,
        style,
    } = props
    const size = parseFloat(String(font?.fontSize ?? 64)) || 64
    const { fontSize, lineHeight, ...fontRest } = font || {}
    return (
        <OdometerCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            separator={separator}
            size={size}
            startOnView={startOnView}
            duration={duration}
            stagger={stagger}
            style={{
                color,
                fontWeight: 500,
                letterSpacing: "-0.04em",
                ...fontRest,
                ...style,
            }}
        />
    )
}

const CONTROLS: Record<string, any> = {
    value: {
        type: ControlType.Number,
        title: "Value",
        defaultValue: 12400,
        displayStepper: true,
        step: 1,
    },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "+" },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 0,
        min: 0,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    separator: {
        type: ControlType.Boolean,
        title: "Separator",
        defaultValue: true,
        enabledTitle: "1,000",
        disabledTitle: "1000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 64 },
    },
    color: {
        type: ControlType.Color,
        title: "Colour",
        defaultValue: "#0B0B0C",
    },
    startOnView: {
        type: ControlType.Boolean,
        title: "Start",
        defaultValue: true,
        enabledTitle: "In view",
        disabledTitle: "On load",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.2,
        min: 0.2,
        max: 4,
        step: 0.1,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.06,
        min: 0,
        max: 0.4,
        step: 0.01,
        unit: "s",
    },
}

addPropertyControls(OdometerCounterFramer, CONTROLS)

OdometerCounterFramer.displayName = "Odometer Counter"

const RM_CSS =
    ':where(.rmui) *,:where(.rmui) ::before,:where(.rmui) ::after{box-sizing:border-box;border:0 solid;margin:0;padding:0}\n:where(.rmui) button{background:transparent;color:inherit;font:inherit;letter-spacing:inherit;cursor:pointer;-webkit-appearance:none;appearance:none}\n:where(.rmui) img,:where(.rmui) svg,:where(.rmui) video{display:block;max-width:100%}\n:where(.rmui) img,:where(.rmui) video{height:auto}\n:where(.rmui) h1,:where(.rmui) h2,:where(.rmui) h3,:where(.rmui) h4,:where(.rmui) p{font-size:inherit;font-weight:inherit}\n:where(.rmui) ol,:where(.rmui) ul{list-style:none}\n@layer properties;\n:root, :host {\n  --default-transition-duration: 150ms;\n  --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n}\n.fixed {\n  position: fixed;\n}\n.block {\n  display: block;\n}\n.flex {\n  display: flex;\n}\n.hidden {\n  display: none;\n}\n.inline-block {\n  display: inline-block;\n}\n.inline-flex {\n  display: inline-flex;\n}\n.tabular-nums {\n  --tw-numeric-spacing: tabular-nums;\n  font-variant-numeric: var(--tw-ordinal, ) var(--tw-slashed-zero, ) var(--tw-numeric-figure, ) var(--tw-numeric-spacing, ) var(--tw-numeric-fraction, );\n}\n.antialiased {\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n.transition {\n  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events;\n  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n  transition-duration: var(--tw-duration, var(--default-transition-duration));\n}\n@property --tw-ordinal {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-slashed-zero {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-numeric-figure {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-numeric-spacing {\n  syntax: "*";\n  inherits: false;\n}\n@property --tw-numeric-fraction {\n  syntax: "*";\n  inherits: false;\n}\n@layer properties {\n  @supports ((-webkit-hyphens: none) and (not (margin-trim: block))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {\n    *, ::before, ::after, ::backdrop {\n      --tw-ordinal: initial;\n      --tw-slashed-zero: initial;\n      --tw-numeric-figure: initial;\n      --tw-numeric-spacing: initial;\n      --tw-numeric-fraction: initial;\n    }\n  }\n}\n'
