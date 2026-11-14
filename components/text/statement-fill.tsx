// StatementFill — Framer code component.
// The statement sits as OUTLINE (hollow, stroked) text by default. As it scrolls
// up through the viewport, a solid fill descends top -> bottom, line by line,
// turning it solid. Scroll-LINKED, not scroll-jacked: the page never pins or
// stops — the fill just tracks natural scroll position (runs both ways).
//
// Type is set with the native Font control (family + weight + size + line height
// + letter spacing), since a code component can't reference Framer text styles.
//
// Italics: wrap a word in *asterisks* in the Text field to italicise it
// (e.g. "...pause, and *return*.").

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { useRef, type CSSProperties, type ReactNode } from "react"

// ControlType.Font hands back a style-ish object that also carries `variant`
// (Framer's name for weight). Spread it whole — never read keys off it.
type FontValue = CSSProperties & { variant?: string }

interface StatementFillProps {
    text: string
    font: FontValue
    strokeColor: string
    strokeWidth: number
    fillColor: string
    feather: number
    rangeStart: number
    rangeEnd: number
    indent: number
    style?: CSSProperties
}

// split "a b *c* d" -> ["a b ", <em>c</em>, " d"], italic runs from *...*
function renderText(str: string): ReactNode[] {
    const parts = String(str).split(/\*(.+?)\*/g)
    return parts.map((seg, i) =>
        i % 2 === 1 ? (
            <em key={i} style={{ fontStyle: "italic" }}>
                {seg}
            </em>
        ) : (
            seg
        )
    )
}

// a descending reveal edge; `feather` softens the line so it reads as a fill,
// not a hard bar. edge position = v (0 top -> 1 bottom).
function maskAt(v: number, feather: number): string {
    const a = Math.max(0, v * 100 - feather / 2)
    const b = Math.min(100, v * 100 + feather / 2)
    return `linear-gradient(to bottom, #000 ${a}%, rgba(0,0,0,0) ${b}%)`
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function StatementFill(props: StatementFillProps) {
    const {
        text,
        font,
        strokeColor,
        strokeWidth,
        fillColor,
        feather,
        rangeStart,
        rangeEnd,
        indent,
        style,
    } = props
    const ref = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"], // full travel through the viewport
    })
    // guard: an empty input range makes useTransform divide by zero
    const end = Math.max(rangeEnd, rangeStart + 0.01)
    const p = useTransform(scrollYProgress, [rangeStart, end], [0, 1], {
        clamp: true,
    })
    const scrollMask = useTransform(p, (v) => maskAt(v, feather))

    // In a static context (editor canvas, thumbnail, image export) nothing
    // scrolls, so scrollYProgress is pinned and the component would render as a
    // hollow outline or a fully solid block. Show a half-filled state instead:
    // it reads as the effect caught mid-run. Framer's own hook is used rather
    // than checking RenderTarget by hand — it covers every static target,
    // including export, which a manual check is easy to miss.
    const isStatic = useIsStaticRenderer()

    // prefers-reduced-motion: skip the reveal, render solid.
    const reduceMotion = useReducedMotion()

    // Hooks always run; only the value picked changes.
    // Static preview wins over reduced motion: a canvas/thumbnail render is a
    // still image, not motion, so it should always show the half-filled state.
    const mask = isStatic
        ? maskAt(0.5, feather)
        : reduceMotion
          ? undefined // unmasked = fully solid
          : scrollMask

    const type: CSSProperties = {
        margin: 0,
        ...font,
        textIndent: `${indent}px`, // first-line indent, e.g. to clear a pinned image
        gridArea: "1 / 1", // stack both layers in the same cell
    }

    return (
        <div ref={ref} style={{ display: "grid", width: "100%", ...style }}>
            {/* outline layer — hollow, always visible */}
            <p
                style={{
                    ...type,
                    color: "transparent",
                    WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
                }}
            >
                {renderText(text)}
            </p>
            {/* solid layer — revealed top->bottom by the scroll mask */}
            <motion.p
                aria-hidden
                style={{
                    ...type,
                    color: fillColor,
                    WebkitMaskImage: mask,
                    maskImage: mask,
                }}
            >
                {renderText(text)}
            </motion.p>
        </div>
    )
}

addPropertyControls(StatementFill, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        description: "Wrap a word in *asterisks* to italicise it.",
        defaultValue:
            "Every photograph is blank before it is anything. Then the silver finds the light and the picture decides to exist, from the top down, the way a memory comes back: edges first, and the face *last*.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        defaultValue: {
            // weight is `variant` here, not fontWeight — Framer resolves it
            variant: "Regular",
            fontSize: 48,
            lineHeight: 1.15,
            letterSpacing: "-0.04em",
            textAlign: "left",
        },
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Outline",
        defaultValue: "#B7B1A1",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Outline width",
        min: 0.5,
        max: 3,
        step: 0.5,
        unit: "px",
        defaultValue: 1,
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#121212",
    },
    feather: {
        type: ControlType.Number,
        title: "Feather",
        min: 0,
        max: 60,
        unit: "%",
        defaultValue: 4,
    },
    rangeStart: {
        type: ControlType.Number,
        title: "Start",
        description:
            "How far into the scroll pass the fill begins. 0 = the moment the text enters the viewport.",
        min: 0,
        max: 1,
        step: 0.02,
        defaultValue: 0.12,
    },
    rangeEnd: {
        type: ControlType.Number,
        title: "End",
        description:
            "Where the fill finishes. Lower values finish sooner, which is safer on short pages.",
        min: 0,
        max: 1,
        step: 0.02,
        defaultValue: 0.55,
    },
    indent: {
        type: ControlType.Number,
        title: "Indent",
        description:
            "First-line indent, e.g. to clear a floated portrait. Leading spaces in the text field will not work — HTML collapses them.",
        min: 0,
        max: 400,
        unit: "px",
        defaultValue: 0,
    },
})
