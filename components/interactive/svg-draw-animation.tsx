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
    createElement,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react"
import type { CSSProperties, ReactElement, ReactNode } from "react"

interface SVGDrawProps {
    svg: string
    mode: "draw" | "wipe"
    fit: "contain" | "cover" | "stretch"
    fillAfter: boolean
    strokeColor: string
    useOwnColor: boolean
    strokeWidth: number
    reverse: boolean
    animateColor: boolean
    colorFrom: string
    duration: number
    stagger: number
    delay: number
    easing: string
    startAt: number
    order: "longest" | "source" | "reverse"
    wipeFrom: "right" | "left" | "down" | "up"
    replay: boolean
    style?: CSSProperties
}

const EASES: Record<string, string> = {
    "power1.out": "cubic-bezier(0.26, 0.46, 0.45, 0.94)",
    "power2.out": "cubic-bezier(0.22, 0.61, 0.36, 1)",
    "power3.out": "cubic-bezier(0.16, 1, 0.3, 1)",
    "expo.out": "cubic-bezier(0.19, 1, 0.22, 1)",
    linear: "linear",
}

const WIPE_CLOSED: Record<string, string> = {
    right: "inset(0% 100% 0% 0%)",
    left: "inset(0% 0% 0% 100%)",
    down: "inset(0% 0% 100% 0%)",
    up: "inset(100% 0% 0% 0%)",
}

const FIT: Record<string, string> = {
    contain: "xMidYMid meet",
    cover: "xMidYMid slice",
    stretch: "none",
}

// Shapes in here are references (clips, masks, gradients, symbols), not art
const NOT_ART = "defs, clipPath, mask, symbol, pattern, marker"

const DEFAULT_SVG = `<svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 80 C 60 10, 140 10, 190 80" stroke="currentColor" stroke-width="3"/></svg>`

// ─── Sanitizing ─────────────────────────────────────────────────────────────
// Pasted markup is never inserted as HTML. It is parsed with DOMParser (which
// runs nothing), walked, and rebuilt as React elements from an allowlist:
// anything not named below — script, foreignObject, image, iframe, event
// handlers, external links — simply never makes it into the output.

const ELEMENTS = [
    "svg",
    "g",
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "text",
    "tspan",
    "textPath",
    "title",
    "desc",
    "defs",
    "use",
    "symbol",
    "linearGradient",
    "radialGradient",
    "stop",
    "clipPath",
    "mask",
    "pattern",
    "marker",
    "filter",
    "feGaussianBlur",
    "feOffset",
    "feBlend",
    "feColorMatrix",
    "feFlood",
    "feComposite",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feDropShadow",
]
const ELEMENT_NAMES: Record<string, string> = {}
ELEMENTS.forEach((n) => (ELEMENT_NAMES[n.toLowerCase()] = n))

// Links are kept for their children only
const UNWRAP = new Set(["a", "switch"])

// Only these carry text content
const TEXT_PARENTS = new Set(["text", "tspan", "textPath", "title", "desc"])

// SVG attribute name → React prop. id, href, class and style are handled
// separately below.
const ATTRS: Record<string, string> = {}
;[
    "d",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "fx",
    "fy",
    "fr",
    "width",
    "height",
    "points",
    "viewBox",
    "preserveAspectRatio",
    "transform",
    "fill",
    "stroke",
    "opacity",
    "color",
    "display",
    "visibility",
    "mask",
    "filter",
    "offset",
    "overflow",
    "gradientUnits",
    "gradientTransform",
    "spreadMethod",
    "patternUnits",
    "patternContentUnits",
    "patternTransform",
    "clipPathUnits",
    "maskUnits",
    "maskContentUnits",
    "markerWidth",
    "markerHeight",
    "markerUnits",
    "refX",
    "refY",
    "orient",
    "filterUnits",
    "primitiveUnits",
    "in",
    "in2",
    "result",
    "stdDeviation",
    "dx",
    "dy",
    "mode",
    "operator",
    "k1",
    "k2",
    "k3",
    "k4",
    "values",
    "type",
    "role",
    "textLength",
    "lengthAdjust",
    "startOffset",
    "rotate",
    "aria-hidden",
    "aria-label",
].forEach((n) => (ATTRS[n.toLowerCase()] = n))
;[
    "fill-opacity",
    "fill-rule",
    "clip-rule",
    "clip-path",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-opacity",
    "stop-color",
    "stop-opacity",
    "vector-effect",
    "flood-color",
    "flood-opacity",
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "text-anchor",
    "dominant-baseline",
    "letter-spacing",
    "paint-order",
    "shape-rendering",
    "color-interpolation-filters",
].forEach((n) => (ATTRS[n] = camel(n)))

// CSS properties allowed through style="" and Illustrator-style classes
const STYLE_PROPS = new Set([
    "fill",
    "fill-opacity",
    "fill-rule",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-opacity",
    "opacity",
    "color",
    "display",
    "visibility",
    "clip-path",
    "clip-rule",
    "mask",
    "filter",
    "stop-color",
    "stop-opacity",
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "letter-spacing",
    "text-anchor",
    "dominant-baseline",
    "mix-blend-mode",
    "isolation",
    "transform",
    "transform-origin",
    "transform-box",
    "paint-order",
    "vector-effect",
    "overflow",
    "flood-color",
    "flood-opacity",
    "shape-rendering",
])

function camel(name: string): string {
    return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

// A value survives only if every url(...) in it points inside the document
// and it carries nothing that could run or load anything
function safeValue(value: string, rename: (id: string) => string) {
    const v = value.trim()
    if (/javascript:|vbscript:|data:|expression\s*\(|@import|[<>]/i.test(v)) {
        return null
    }
    let external = false
    const out = v.replace(
        /url\(\s*(["']?)(.*?)\1\s*\)/gi,
        (_, q: string, ref: string) => {
            if (!ref.startsWith("#")) external = true
            return `url(#${rename(ref.slice(1))})`
        }
    )
    if (external || /url\(/i.test(out.replace(/url\(#[^)]*\)/g, ""))) {
        return null
    }
    return out
}

function parseDecls(
    css: string,
    rename: (id: string) => string
): Record<string, string> {
    const out: Record<string, string> = {}
    css.split(";").forEach((decl) => {
        const i = decl.indexOf(":")
        if (i < 0) return
        const prop = decl.slice(0, i).trim().toLowerCase()
        if (!STYLE_PROPS.has(prop)) return
        const value = safeValue(decl.slice(i + 1), rename)
        if (value) out[prop] = value
    })
    return out
}

interface Rules {
    // Kept in stylesheet order: with class="a b", CSS lets whichever rule
    // comes later in the sheet win, not whichever class is listed last
    byClass: Array<{ name: string; decls: Record<string, string> }>
    byTag: Record<string, Record<string, string>>
}

// Illustrator exports colour through <style> classes. Rather than put that
// stylesheet on the page (where it would restyle other SVGs), simple class
// and tag rules are applied to their elements and the <style> is dropped.
function readRules(root: Element, rename: (id: string) => string): Rules {
    const rules: Rules = { byClass: [], byTag: {} }
    root.querySelectorAll("style").forEach((el) => {
        const css = (el.textContent || "").replace(/\/\*[\s\S]*?\*\//g, "")
        const re = /([^{}]+)\{([^{}]*)\}/g
        let m: RegExpExecArray | null
        while ((m = re.exec(css))) {
            const decls = parseDecls(m[2], rename)
            m[1].split(",").forEach((raw) => {
                const sel = raw.trim()
                const cls = sel.match(/^\.([\w-]+)$/)
                if (cls) {
                    rules.byClass.push({ name: cls[1], decls })
                } else if (/^[a-zA-Z]+$/.test(sel)) {
                    const tag = sel.toLowerCase()
                    rules.byTag[tag] = { ...rules.byTag[tag], ...decls }
                }
            })
        }
    })
    return rules
}

function toStyle(decls: Record<string, string>): CSSProperties {
    const style: Record<string, string> = {}
    Object.keys(decls).forEach((k) => (style[camel(k)] = decls[k]))
    return style as CSSProperties
}

interface Ctx {
    rename: (id: string) => string
    rules: Rules
}

function convert(node: Element, key: number, ctx: Ctx): ReactElement | null {
    const lower = node.localName.toLowerCase()
    const unwrap = UNWRAP.has(lower)
    const name = unwrap ? "g" : ELEMENT_NAMES[lower]
    if (!name) return null

    const props: Record<string, unknown> = { key }
    let decls: Record<string, string> = { ...ctx.rules.byTag[lower] }
    let inline: Record<string, string> = {}

    if (!unwrap) {
        Array.from(node.attributes).forEach((attr) => {
            const an = attr.name.toLowerCase()
            const value = attr.value
            if (an === "id") {
                props.id = ctx.rename(value)
            } else if (an === "href" || an === "xlink:href") {
                // In-document references only (#id); anything else would load
                // or navigate somewhere
                if (/^\s*#/.test(value)) {
                    props.href = `#${ctx.rename(value.trim().slice(1))}`
                }
            } else if (an === "class") {
                const classes = new Set(value.split(/\s+/).filter(Boolean))
                ctx.rules.byClass.forEach((rule) => {
                    if (classes.has(rule.name)) {
                        decls = { ...decls, ...rule.decls }
                    }
                })
            } else if (an === "style") {
                inline = parseDecls(value, ctx.rename)
            } else if (ATTRS[an]) {
                const safe = safeValue(value, ctx.rename)
                if (safe !== null) props[ATTRS[an]] = safe
            }
        })
        const style = { ...decls, ...inline }
        if (Object.keys(style).length) props.style = toStyle(style)
    }

    const children: ReactNode[] = []
    node.childNodes.forEach((child, i) => {
        if (child.nodeType === 1) {
            const el = convert(child as Element, i, ctx)
            if (el) children.push(el)
        } else if (child.nodeType === 3 && TEXT_PARENTS.has(name)) {
            children.push(child.textContent)
        }
    })

    return createElement(name, props, ...children)
}

// JSX copied from an icon library or a React codebase uses camelCase
// attributes that the browser ignores in plain SVG
const JSX_ATTRS: Record<string, string> = {
    className: "class",
    strokeWidth: "stroke-width",
    strokeLinecap: "stroke-linecap",
    strokeLinejoin: "stroke-linejoin",
    strokeMiterlimit: "stroke-miterlimit",
    strokeDasharray: "stroke-dasharray",
    strokeDashoffset: "stroke-dashoffset",
    strokeOpacity: "stroke-opacity",
    fillOpacity: "fill-opacity",
    fillRule: "fill-rule",
    clipRule: "clip-rule",
    clipPath: "clip-path",
    stopColor: "stop-color",
    stopOpacity: "stop-opacity",
    vectorEffect: "vector-effect",
    xlinkHref: "xlink:href",
}

// Unwraps whatever gets pasted — an export with an XML header, JSX,
// HTML-escaped markup or a data URI — down to plain SVG text. This is only
// tidying: the output still goes through the parser and allowlist below.
function extract(input: string): string {
    let s = (input || "").trim()
    if (/^data:image\/svg\+xml/i.test(s)) {
        const comma = s.indexOf(",")
        const body = s.slice(comma + 1)
        try {
            s = /;base64/i.test(s.slice(0, comma))
                ? atob(body)
                : decodeURIComponent(body)
        } catch {
            return ""
        }
    }
    if (!/<svg[\s>]/i.test(s) && /&lt;svg/i.test(s)) {
        s = s
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&")
    }
    const start = s.search(/<svg[\s>]/i)
    const end = s.toLowerCase().lastIndexOf("</svg>")
    if (start < 0 || end < start) return ""
    s = s.slice(start, end + 6)

    return s
        .replace(/\sstyle=\{\{[\s\S]*?\}\}/g, "")
        .replace(/=\{\s*(["'])([\s\S]*?)\1\s*\}/g, '="$2"')
        .replace(/=\{\s*([^{}]*?)\s*\}/g, '="$1"')
        .replace(/\s\{\.\.\.[^}]*\}/g, "")
        .replace(/\s([a-zA-Z]+)=/g, (m, name: string) =>
            JSX_ATTRS[name] ? ` ${JSX_ATTRS[name]}=` : m
        )
}

function size(v: string | null): number {
    if (!v || /%/.test(v)) return 0
    const n = parseFloat(v)
    return isFinite(n) && n > 0 ? n : 0
}

function parseSvg(source: string): Element | null {
    if (typeof DOMParser === "undefined") return null
    const doc = new DOMParser().parseFromString(source, "text/html")
    return doc.querySelector("svg")
}

// Builds the safe React tree for the pasted SVG, sized the way Framer lays
// the component out
function build(
    source: string,
    fillsWidth: boolean,
    fillsHeight: boolean,
    fit: string,
    prefix: string
): ReactElement | null {
    const root = parseSvg(extract(source)) || parseSvg(DEFAULT_SVG)
    if (!root) return null

    // Figma names things clip0_1_2 in every export. Two copies on one page —
    // or the hidden copy on another breakpoint — then fight over the same
    // gradient or clip, so every id is made unique to this instance.
    const ids = new Set<string>()
    root.querySelectorAll("[id]").forEach((el) => ids.add(el.id))
    const rename = (id: string) => (ids.has(id) ? `${prefix}-${id}` : id)

    const tree = convert(root, 0, { rename, rules: readRules(root, rename) })
    if (!tree) return null

    const w = size(root.getAttribute("width"))
    const h = size(root.getAttribute("height"))
    let box = root.getAttribute("viewBox")
    if (!box && w && h) box = `0 0 ${w} ${h}`
    const nums = (box || "").split(/[\s,]+/).map(Number)
    const boxW = nums.length === 4 && nums[2] > 0 ? nums[2] : 0
    const boxH = nums.length === 4 && nums[3] > 0 ? nums[3] : 0

    const props = tree.props as Record<string, unknown>
    return createElement(
        "svg",
        {
            ...props,
            key: 0,
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: box || undefined,
            // A layer Framer sizes (fixed or fill) gets filled; an auto-sized
            // one keeps the artwork's own dimensions
            width: fillsWidth ? "100%" : String(w || boxW || 300),
            height: fillsHeight ? "100%" : String(h || boxH || 150),
            preserveAspectRatio:
                box && (fillsWidth || fillsHeight)
                    ? FIT[fit] || FIT.contain
                    : props.preserveAspectRatio,
            style: {
                ...(props.style as CSSProperties),
                display: "block",
                overflow: "visible",
            },
        },
        props.children as ReactNode
    )
}

// The artwork's own size, read as plain numbers, so an auto-sized layer holds
// its space before the SVG is built in the browser
function intrinsic(source: string) {
    const open = extract(source).match(/<svg\b[^>]*>/i)
    const tag = open ? open[0] : ""
    const num = (name: string) => {
        const m = tag.match(
            new RegExp(`\\s${name}\\s*=\\s*["']?([\\d.]+)`, "i")
        )
        return m ? parseFloat(m[1]) : 0
    }
    const box = (tag.match(/viewBox\s*=\s*["']([^"']+)/i)?.[1] || "")
        .split(/[\s,]+/)
        .map(Number)
    return {
        width: num("width") || (box[2] > 0 ? box[2] : 300),
        height: num("height") || (box[3] > 0 ? box[3] : 150),
    }
}

/**
 * SVG DRAW
 *
 * Paste any SVG — from Figma, Illustrator, an icon set or JSX — and it draws
 * itself into view: each path traced with stroke-dashoffset, or the whole
 * thing wiped in from one side.
 *
 * Shapes exported as fills rather than strokes have no line to trace, so
 * "Fill After" hands the fill back once the outline is drawn.
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SVGDraw(props: SVGDrawProps) {
    const {
        svg,
        mode,
        fit = "contain",
        fillAfter,
        strokeColor,
        useOwnColor,
        strokeWidth,
        reverse,
        animateColor,
        colorFrom,
        duration,
        stagger,
        delay,
        easing,
        startAt,
        order,
        wipeFrom,
        replay,
        style,
    } = props

    const ref = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const prefix = "sd" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const fillsWidth = style?.width === "100%"
    const fillsHeight = style?.height === "100%"

    // DOMParser only exists in the browser, so the server renders an empty
    // box and the SVG is built once mounted. The canvas can build straight
    // away. Rendering the same thing on both sides first keeps hydration clean.
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    const canBuild = isStatic || mounted

    const art = useMemo(
        () =>
            canBuild ? build(svg, fillsWidth, fillsHeight, fit, prefix) : null,
        [canBuild, svg, fillsWidth, fillsHeight, fit, prefix]
    )
    const box = useMemo(() => intrinsic(svg), [svg])
    const route = useRouteKey(isStatic)

    // Starts hidden, like Framer's own appear effects, so the finished art
    // never flashes up before the draw hides it again
    const [ready, setReady] = useState(false)

    const ease = EASES[easing] || EASES["power1.out"]
    const ms = Math.max(0.01, duration) * 1000
    const delayMs = Math.max(0, delay) * 1000
    const staggerMs = Math.max(0, stagger) * 1000

    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !art) return
        const root = ref.current
        if (!root) return
        const show = () => setReady(true)

        const node = root.querySelector("svg")
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        if (!node || reduced) {
            show()
            return
        }

        let cleanupFns: Array<() => void> = []

        if (mode === "wipe") {
            root.style.transition = "none"
            root.style.clipPath = WIPE_CLOSED[wipeFrom]
            void root.offsetWidth
            const run = () => {
                root.style.willChange = "clip-path"
                root.style.transition = `clip-path ${ms}ms ${ease} ${delayMs}ms`
                root.style.clipPath = "inset(0% 0% 0% 0%)"
            }
            const reset = () => {
                root.style.transition = `clip-path ${ms}ms ${ease}`
                root.style.clipPath = WIPE_CLOSED[wipeFrom]
            }
            cleanupFns.push(watch(root, startAt, replay, run, reset))
            cleanupFns.push(() => {
                root.style.clipPath = ""
                root.style.willChange = ""
            })
        } else {
            const shapes = Array.from(
                node.querySelectorAll<SVGGeometryElement>(
                    "path, line, polyline, polygon, circle, ellipse, rect"
                )
            )
                .filter((el) => !el.closest(NOT_ART))
                .map((el) => {
                    let len = 0
                    try {
                        len =
                            typeof el.getTotalLength === "function"
                                ? el.getTotalLength()
                                : 0
                    } catch {
                        len = 0
                    }
                    return { el, len }
                })
                .filter((s) => s.len > 0)

            // Nothing measurable means nothing to draw; leave the art alone
            if (shapes.length === 0) {
                show()
                return
            }

            if (order === "longest") shapes.sort((a, b) => b.len - a.len)
            else if (order === "reverse") shapes.reverse()

            // Put back exactly what was rendered once the effect is torn down
            const inline = shapes.map(({ el }) => el.getAttribute("style"))

            const fills = shapes.map(({ el }) => getComputedStyle(el).fill)
            const strokes = shapes.map(({ el }) => getComputedStyle(el).stroke)

            // fill-opacity and stroke-opacity are separate attributes from the
            // colour itself. Tracing a 42%-opacity shape with a 100%-opacity
            // line gives the same hue at more than twice the strength, which on
            // a dark background reads as white.
            const alphas = shapes.map(({ el }) => {
                const cs = getComputedStyle(el)
                const hasStroke = cs.stroke && cs.stroke !== "none"
                const a = hasStroke ? cs.strokeOpacity : cs.fillOpacity
                return a === "" || a == null ? "1" : a
            })

            // What the markup literally declares, ignoring currentColor — that
            // one resolves to whatever text colour surrounds the component,
            // which is how a trace ends up mysteriously white
            const declared = (el: SVGGeometryElement, name: string) => {
                const v = el.getAttribute(name)
                if (!v || v === "none" || v === "currentColor") return ""
                return v
            }
            const inherits = (el: SVGGeometryElement) =>
                el.getAttribute("stroke") === "currentColor" ||
                el.getAttribute("fill") === "currentColor"

            // The colour each line ends on. A shape that states its own colour
            // keeps it; one that only inherits falls back to the Stroke
            // control, so the result is never a surprise.
            const targets = shapes.map(({ el }, i) => {
                if (!useOwnColor) return strokeColor
                const own = declared(el, "stroke") || declared(el, "fill")
                if (own) return own
                if (inherits(el)) return strokeColor
                const s = strokes[i] && strokes[i] !== "none" ? strokes[i] : ""
                const f = fills[i] && fills[i] !== "none" ? fills[i] : ""
                return s || f || strokeColor
            })

            // Where the fill lands once the trace is done. Overriding the
            // stroke colour but restoring the original fill would put the
            // artwork right back to the colour you were overriding.
            const blank = (v: string) =>
                !v || v === "none" || v === "rgba(0, 0, 0, 0)"
            const fillTargets = shapes.map(({ el }, i) =>
                // Art that was never filled stays unfilled
                blank(fills[i]) ? "none" : useOwnColor ? fills[i] : strokeColor
            )

            // Line art has nothing to hand back to, so its stroke stays; a
            // filled shape keeps a stroke only if it was designed with one
            const strokeTargets = shapes.map((_, i) =>
                fillTargets[i] === "none" || !blank(strokes[i])
                    ? targets[i]
                    : "transparent"
            )

            // A dash exactly as long as the path leaves the round cap of the
            // hidden dash poking in as a dot. Padding the gap by more than
            // half the stroke width on both sides keeps it out of sight.
            const pad = Math.max(1, strokeWidth) + 1

            const prime = () => {
                shapes.forEach(({ el, len }, i) => {
                    el.style.transition = "none"
                    if (fillAfter) el.style.fill = "transparent"
                    // Colour animation starts somewhere else and arrives at the
                    // target as the line completes
                    el.style.stroke = animateColor ? colorFrom : targets[i]
                    // Trace at the artwork's own strength, not full force
                    el.style.strokeOpacity = alphas[i]
                    el.style.strokeWidth = String(strokeWidth)
                    el.style.strokeLinecap = "round"
                    el.style.strokeLinejoin = "round"
                    el.style.strokeDasharray = `${len} ${len + pad * 2}`
                    // A negative offset grows the line from the other end, so
                    // the same path can draw either way round
                    el.style.strokeDashoffset = `${reverse ? -(len + pad) : len + pad}`
                })
                void root.offsetWidth
            }

            const timers: number[] = []
            const run = () => {
                shapes.forEach(({ el }, i) => {
                    const offset = delayMs + i * staggerMs
                    el.style.willChange = "stroke-dashoffset"
                    el.style.transition =
                        `stroke-dashoffset ${ms}ms ${ease} ${offset}ms` +
                        (animateColor
                            ? `, stroke ${ms}ms ${ease} ${offset}ms`
                            : "")
                    el.style.strokeDashoffset = "0"
                    if (animateColor) el.style.stroke = targets[i]
                    timers.push(
                        window.setTimeout(() => {
                            el.style.willChange = ""
                            if (!fillAfter) return
                            // The fill returns as the tracing stroke fades,
                            // so the shape settles at its designed weight
                            el.style.transition = `fill 400ms ease, stroke 400ms ease`
                            el.style.fill = fillTargets[i]
                            el.style.stroke = strokeTargets[i]
                        }, ms + offset)
                    )
                })
            }

            prime()
            cleanupFns.push(
                watch(root, startAt, replay, run, () => {
                    timers.forEach((t) => window.clearTimeout(t))
                    timers.length = 0
                    prime()
                })
            )
            cleanupFns.push(() => {
                timers.forEach((t) => window.clearTimeout(t))
                shapes.forEach(({ el }, i) => {
                    if (inline[i] === null) el.removeAttribute("style")
                    else el.setAttribute("style", inline[i] as string)
                })
            })
        }

        show()
        return () => cleanupFns.forEach((fn) => fn())
    }, [
        isStatic,
        art,
        mode,
        fillAfter,
        strokeColor,
        useOwnColor,
        strokeWidth,
        reverse,
        animateColor,
        colorFrom,
        ms,
        staggerMs,
        delayMs,
        ease,
        startAt,
        order,
        wipeFrom,
        replay,
        route,
    ])

    return (
        <div
            ref={ref}
            style={{
                // An auto-sized layer holds the artwork's size until it is built
                ...(fillsWidth ? null : { minWidth: box.width }),
                ...(fillsHeight ? null : { minHeight: box.height }),
                ...style,
                position: "relative",
                // Any currentColor in the pasted markup resolves to this rather
                // than to whatever text colour happens to surround the component
                color: strokeColor,
                visibility: isStatic || ready ? undefined : "hidden",
            }}
        >
            {art}
        </div>
    )
}

// Changes whenever the site navigates to another page. Art inside a layout
// template (like the footer) stays mounted across pages, so this re-arms the
// draw for each page instead of playing it only on the first one.
function useRouteKey(isStatic: boolean) {
    const [path, setPath] = useState(() =>
        typeof window === "undefined" ? "" : window.location.pathname
    )
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const check = () => {
            if (window.location.pathname !== path)
                setPath(window.location.pathname)
        }
        window.addEventListener("popstate", check)
        // Framer's router uses pushState, which fires no event, so a light
        // interval catches in-site navigation
        const timer = window.setInterval(check, 250)
        return () => {
            window.removeEventListener("popstate", check)
            window.clearInterval(timer)
        }
    }, [isStatic, path])
    return path
}

// Fires on the way in, and on the way out too when replay is on. A watchdog
// opens the art anyway if the observer never reports it.
function watch(
    el: HTMLElement,
    startAt: number,
    replay: boolean,
    onEnter: () => void,
    onLeave: () => void
) {
    let entered = false
    const io = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entered = true
                    onEnter()
                    if (!replay) io.disconnect()
                } else if (replay && entered) {
                    onLeave()
                }
            }
        },
        {
            threshold: 0,
            rootMargin: `0px 0px -${Math.round((1 - startAt) * 100)}% 0px`,
        }
    )
    io.observe(el)

    const watchdog = window.setTimeout(() => {
        if (entered) return
        const r = el.getBoundingClientRect()
        if (r.bottom > 0 && r.top < window.innerHeight) {
            entered = true
            onEnter()
        }
    }, 4000)

    return () => {
        io.disconnect()
        window.clearTimeout(watchdog)
    }
}

SVGDraw.displayName = "SVG Draw"

addPropertyControls(SVGDraw, {
    svg: {
        type: ControlType.String,
        title: "SVG",
        displayTextArea: true,
        defaultValue: DEFAULT_SVG,
        description:
            "Paste any SVG code — from Figma, Illustrator, an icon set or JSX.",
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["draw", "wipe"],
        optionTitles: ["Draw", "Wipe"],
        displaySegmentedControl: true,
        defaultValue: "draw",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["contain", "cover", "stretch"],
        optionTitles: ["Contain", "Cover", "Stretch"],
        displaySegmentedControl: true,
        defaultValue: "contain",
    },
    fillAfter: {
        type: ControlType.Boolean,
        title: "Fill After",
        defaultValue: true,
        description: "For filled art: trace the outline, then bring fill back.",
        hidden: (props) => props.mode !== "draw",
    },
    useOwnColor: {
        type: ControlType.Boolean,
        title: "Own Colors",
        defaultValue: false,
        description:
            "Keep the colors the SVG declares. Off means Stroke wins, which is what you want for single-color art.",
        hidden: (props) => props.mode !== "draw",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke",
        defaultValue: "#F1E6D8",
        description:
            "Also used for any currentColor in the SVG, and for shapes that declare no color.",
        hidden: (props) => props.mode !== "draw",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 2,
        min: 0.1,
        max: 40,
        step: 0.1,
        hidden: (props) => props.mode !== "draw",
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Direction",
        enabledTitle: "Reverse",
        disabledTitle: "Normal",
        defaultValue: false,
        description: "Flips which end each line grows from.",
        hidden: (props) => props.mode !== "draw",
    },
    animateColor: {
        type: ControlType.Boolean,
        title: "Animate Color",
        defaultValue: false,
        description: "Fade from a starting color as the line draws.",
        hidden: (props) => props.mode !== "draw",
    },
    colorFrom: {
        type: ControlType.Color,
        title: "Color From",
        defaultValue: "rgba(241, 230, 216, 0.24)",
        hidden: (props) =>
            props.mode !== "draw" || !Boolean(props.animateColor),
    },
    order: {
        type: ControlType.Enum,
        title: "Order",
        options: ["longest", "source", "reverse"],
        optionTitles: ["Longest First", "As Drawn", "Reverse"],
        defaultValue: "longest",
        hidden: (props) => props.mode !== "draw",
    },
    wipeFrom: {
        type: ControlType.Enum,
        title: "From",
        options: ["right", "left", "down", "up"],
        optionTitles: ["Left Edge", "Right Edge", "Top Edge", "Bottom Edge"],
        defaultValue: "right",
        hidden: (props) => props.mode !== "wipe",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.6,
        min: 0.1,
        max: 8,
        step: 0.1,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.18,
        min: 0,
        max: 2,
        step: 0.01,
        unit: "s",
        hidden: (props) => props.mode !== "draw",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "power1.out",
            "power2.out",
            "power3.out",
            "expo.out",
            "linear",
        ],
        optionTitles: ["Soft", "Medium", "Snappy", "Dramatic", "Linear"],
        defaultValue: "power1.out",
    },
    startAt: {
        type: ControlType.Number,
        title: "Start At",
        defaultValue: 0.85,
        min: 0,
        max: 1,
        step: 0.05,
        description:
            "How far down the screen it must reach before drawing. 1 is the bottom edge.",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: false,
        description: "Redraw each time it comes back into view.",
    },
})
