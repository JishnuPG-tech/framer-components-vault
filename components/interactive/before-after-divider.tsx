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


// Parapet BeforeAfter: two images of the same size, one divider. Drag, click or use the keys to move it.
// Self-contained on purpose: no project tokens, only the props below, so it can also ship as a free component.

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

type Orientation = "horizontal" | "vertical"
type HandleStyle = "lineCircle" | "line"
type AspectMode = "image" | "4:3" | "16:9"

interface BeforeAfterProps {
    beforeImage?: ImageValue
    afterImage?: ImageValue
    beforeLabel: string
    afterLabel: string
    startPosition: number
    orientation: Orientation
    handleStyle: HandleStyle
    aspect: AspectMode
    handleColor: string
    inkColor: string
    accentColor: string
    placeholderColor: string
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

/* ---------- content ---------- */

// Harness pictures: two gradients and a big word. In Framer the Before / After image controls replace them.
function placeholderSrc(word: string, from: string, to: string): string {
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
        `<rect width="1600" height="1000" fill="url(#g)"/>` +
        `<text x="800" y="500" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="260" letter-spacing="8" fill="#F4F3F0">${word}</text>` +
        `</svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const PLACEHOLDER_BEFORE = placeholderSrc("BEFORE", "#8D897F", "#3A3935")
const PLACEHOLDER_AFTER = placeholderSrc("AFTER", "#E3A07C", "#B4532A")

const DEFAULT_RATIO = 1.6 // 16:10, the render size of the Parapet images; used until the real ratio is known

/* ---------- skin: every style value lives here (Parapet) ---------- */

const MONO_STACK = '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'

function familyOf(font: React.CSSProperties | undefined, fallback: string): string {
    const family = font && typeof font.fontFamily === "string" ? font.fontFamily.trim() : ""
    return family ? `${family}, ${fallback}` : fallback
}

function sizeOf(font: React.CSSProperties | undefined): string {
    const size = font ? font.fontSize : undefined
    if (typeof size === "number" && size > 0) return `${size}px`
    if (typeof size === "string" && size.trim()) return size.trim()
    return "11px"
}

// The divider is a 2px Handle line with a 1px dark edge so it reads on pale and dark pictures alike (no shadow blur).
// :where() keeps the reset at zero specificity so the class rules below always win.
const CSS = `
.ba,.ba *,.ba *::before,.ba *::after{box-sizing:border-box}
.ba{position:relative;display:block;width:100%;aspect-ratio:var(--ba-ratio);overflow:hidden;isolation:isolate;background:var(--ba-placeholder);color:var(--ba-ink);font-family:var(--ba-font);font-weight:var(--ba-weight);font-style:var(--ba-fstyle);font-size:var(--ba-fs);line-height:1.4;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:pan-y;cursor:ew-resize}
.ba[data-o="vertical"]{touch-action:auto;cursor:ns-resize}
.ba[data-static="true"]{cursor:default}
.ba-img{position:absolute;inset:0;display:block;width:100%;height:100%;max-width:none;object-fit:cover;pointer-events:none;user-select:none;-webkit-user-drag:none}
.ba-top{position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--ba-pos)) 0 0)}
.ba[data-o="vertical"] .ba-top{clip-path:inset(0 0 calc(100% - var(--ba-pos)) 0)}

.ba-lab{position:absolute;z-index:2;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis;padding:4px 8px;background:var(--ba-handle);color:var(--ba-ink);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;pointer-events:none;transition:opacity 120ms ease-out}
.ba-lab:empty{display:none}
.ba-lb{top:12px;left:12px}
.ba-la{top:12px;right:12px}
.ba[data-o="vertical"] .ba-la{top:auto;right:auto;bottom:12px;left:12px}
.ba[data-hb="true"] .ba-lb,.ba[data-ha="true"] .ba-la{opacity:0}

.ba-h{position:absolute;z-index:3;top:0;bottom:0;left:var(--ba-pos);width:44px;margin-left:-22px;display:flex;align-items:center;justify-content:center;outline:0;touch-action:pan-y;cursor:ew-resize}
.ba-line{position:absolute;top:0;bottom:0;left:50%;width:2px;margin-left:-1px;background:var(--ba-handle);box-shadow:0 0 0 1px var(--ba-edge)}
.ba-k{position:relative;display:grid;place-items:center;width:44px;height:44px;border:1px solid var(--ba-edge);border-radius:50%;background:var(--ba-handle);color:var(--ba-ink)}
.ba-k svg{display:block;width:20px;height:20px}
.ba[data-hs="line"] .ba-k{border-color:transparent;background:transparent}
.ba[data-hs="line"] .ba-k svg{display:none}
.ba[data-o="vertical"] .ba-h{top:var(--ba-pos);bottom:auto;left:0;right:0;width:auto;height:44px;margin:-22px 0 0;touch-action:auto;cursor:ns-resize}
.ba[data-o="vertical"] .ba-line{top:50%;bottom:auto;left:0;right:0;width:auto;height:2px;margin:-1px 0 0}
.ba[data-o="vertical"] .ba-k{touch-action:none}
.ba[data-o="vertical"] .ba-k svg{transform:rotate(90deg)}
.ba[data-static="true"] .ba-h{cursor:default}
.ba-h:focus-visible .ba-k{outline:2px solid var(--ba-accent);outline-offset:2px}
.ba[data-hs="line"] .ba-h:focus-visible .ba-k{outline:0}
.ba[data-hs="line"] .ba-h:focus-visible .ba-line{box-shadow:0 0 0 1px var(--ba-edge),0 0 0 4px var(--ba-accent)}

@media (prefers-reduced-motion: reduce){
  .ba *{transition:none !important}
}
`

/* ---------- helpers ---------- */

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

// one decimal keeps drags smooth (0.1% is ~1px at 1200) and keeps aria-valuenow readable
function tidy(value: number): number {
    return Math.round(clamp(value, 0, 100) * 10) / 10
}

// Framer image URLs carry the original size (…jpg?width=1600&height=1000), so the box can be sized before the file loads
function ratioFromSrc(src: string | undefined): number | null {
    if (!src || src.startsWith("data:")) return null
    const w = /[?&]width=(\d+)/.exec(src)
    const h = /[?&]height=(\d+)/.exec(src)
    if (!w || !h) return null
    const ratio = Number(w[1]) / Number(h[1])
    return Number.isFinite(ratio) && ratio > 0 ? ratio : null
}

interface Resolved {
    src: string
    srcSet?: string
    alt?: string
}

function resolveImage(image: ImageValue | undefined, fallback: string): Resolved {
    if (image && typeof image.src === "string" && image.src) return { src: image.src, srcSet: image.srcSet, alt: image.alt }
    return { src: fallback }
}

function Chevrons() {
    return (
        <svg viewBox="0 0 20 20" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" focusable="false">
            <path d="M8 5 3 10l5 5" />
            <path d="m12 5 5 5-5 5" />
        </svg>
    )
}

const EDGE = "rgba(29,29,27,0.22)"
const TAP_SLOP = 8 // px a touch may move and still count as a tap
const DRAG_SLOP = 6 // px along the slide axis before a touch turns into a drag

interface DragState {
    id: number
    mode: "pending" | "drag"
    x: number
    y: number
    offset: number
}

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function BeforeAfter(props: BeforeAfterProps) {
    const {
        beforeImage,
        afterImage,
        beforeLabel = "Before",
        afterLabel = "After",
        startPosition = 50,
        orientation = "horizontal",
        handleStyle = "lineCircle",
        aspect = "image",
        handleColor = "#F4F3F0",
        inkColor = "#1D1D1B",
        accentColor = "#B4532A",
        placeholderColor = "#EAE8E3",
        labelFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const vertical = orientation === "vertical"
    const start = tidy(toNumber(startPosition, 50))

    const [pos, setPos] = React.useState(start)
    React.useEffect(() => setPos(start), [start])
    const shown = isStatic ? start : pos

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const handleRef = React.useRef<HTMLDivElement | null>(null)
    const beforeRef = React.useRef<HTMLImageElement | null>(null)
    const drag = React.useRef<DragState | null>(null)

    const before = resolveImage(beforeImage, PLACEHOLDER_BEFORE)
    const after = resolveImage(afterImage, PLACEHOLDER_AFTER)

    // "Match image" takes the ratio from the Before picture; until it is known the box keeps the URL size or 16:10
    const [natural, setNatural] = React.useState<{ src: string; ratio: number } | null>(null)
    const readNatural = React.useCallback((img: HTMLImageElement | null, src: string) => {
        if (img && img.naturalWidth > 0 && img.naturalHeight > 0) setNatural({ src, ratio: img.naturalWidth / img.naturalHeight })
    }, [])
    React.useEffect(() => {
        if (beforeRef.current?.complete) readNatural(beforeRef.current, before.src)
    }, [before.src, readNatural])

    let ratio = DEFAULT_RATIO
    if (aspect === "4:3") ratio = 4 / 3
    else if (aspect === "16:9") ratio = 16 / 9
    else if (natural && natural.src === before.src) ratio = natural.ratio
    else ratio = ratioFromSrc(before.src) ?? DEFAULT_RATIO

    const pointOf = (event: React.PointerEvent): number => {
        const rect = rootRef.current?.getBoundingClientRect()
        if (!rect) return shown
        const length = vertical ? rect.height : rect.width
        if (length <= 0) return shown
        return ((vertical ? event.clientY - rect.top : event.clientX - rect.left) / length) * 100
    }

    const capture = (event: React.PointerEvent) => {
        try {
            rootRef.current?.setPointerCapture(event.pointerId)
        } catch {
            // the pointer is already gone (synthetic or cancelled); nothing to capture
        }
    }

    // grabbing the handle keeps the distance between finger and divider, so it never jumps; pressing elsewhere moves the divider there
    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || drag.current) return
        if (event.pointerType === "mouse" && event.button !== 0) return
        // vertical mode leaves the page scroll to the touch, so only the grip is a touch handle there
        const onHandle = !!(event.target as Element).closest(vertical && event.pointerType === "touch" ? ".ba-k" : ".ba-h")
        const point = pointOf(event)
        if (onHandle) {
            drag.current = { id: event.pointerId, mode: "drag", x: event.clientX, y: event.clientY, offset: point - shown }
            capture(event)
        } else if (event.pointerType === "touch") {
            // a touch may become a page scroll: wait to see which way it goes before moving anything
            drag.current = { id: event.pointerId, mode: "pending", x: event.clientX, y: event.clientY, offset: 0 }
        } else {
            drag.current = { id: event.pointerId, mode: "drag", x: event.clientX, y: event.clientY, offset: 0 }
            setPos(tidy(point))
            capture(event)
        }
        handleRef.current?.focus({ preventScroll: true })
    }

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!d || d.id !== event.pointerId) return
        if (d.mode === "pending") {
            // vertical mode leaves the picture to the page scroll: a touch there is a tap, or a drag by the grip
            if (vertical) return
            const dx = event.clientX - d.x
            const dy = event.clientY - d.y
            if (Math.abs(dx) > DRAG_SLOP && Math.abs(dx) > Math.abs(dy)) {
                d.mode = "drag"
                capture(event)
                setPos(tidy(pointOf(event)))
            }
            return
        }
        setPos(tidy(pointOf(event) - d.offset))
    }

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!d || d.id !== event.pointerId) return
        drag.current = null
        if (d.mode === "pending" && Math.hypot(event.clientX - d.x, event.clientY - d.y) < TAP_SLOP) setPos(tidy(pointOf(event)))
    }

    const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
        if (drag.current?.id === event.pointerId) drag.current = null
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const step = event.shiftKey ? 20 : 5
        let next = shown
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next -= step
        else if (event.key === "ArrowRight" || event.key === "ArrowDown") next += step
        else if (event.key === "Home") next = 0
        else if (event.key === "End") next = 100
        else return
        event.preventDefault()
        setPos(tidy(next))
    }

    const beforeName = beforeLabel.trim() || "Before"
    const afterName = afterLabel.trim() || "After"
    const vars = {
        "--ba-pos": `${shown}%`,
        "--ba-ratio": ratio,
        "--ba-handle": handleColor,
        "--ba-ink": inkColor,
        "--ba-accent": accentColor,
        "--ba-placeholder": placeholderColor,
        "--ba-edge": EDGE,
        "--ba-font": familyOf(labelFont, MONO_STACK),
        "--ba-weight": (labelFont && labelFont.fontWeight) || 400,
        "--ba-fstyle": (labelFont && labelFont.fontStyle) || "normal",
        "--ba-fs": sizeOf(labelFont),
    } as React.CSSProperties

    return (
        <div
            ref={rootRef}
            className="ba"
            style={{ ...style, ...vars }}
            data-o={vertical ? "vertical" : "horizontal"}
            data-hs={handleStyle === "line" ? "line" : "lineCircle"}
            data-static={isStatic}
            data-pos={shown}
            data-hb={shown <= 6}
            data-ha={shown >= 94}
            onPointerDown={isStatic ? undefined : onPointerDown}
            onPointerMove={isStatic ? undefined : onPointerMove}
            onPointerUp={isStatic ? undefined : onPointerUp}
            onPointerCancel={isStatic ? undefined : onPointerCancel}
        >
            <style>{CSS}</style>
            <img className="ba-img ba-after" src={after.src} srcSet={after.srcSet} sizes={after.srcSet ? "100vw" : undefined} alt={after.alt || afterName} draggable={false} decoding="async" />
            <div className="ba-top">
                <img
                    ref={beforeRef}
                    className="ba-img ba-before"
                    src={before.src}
                    srcSet={before.srcSet}
                    sizes={before.srcSet ? "100vw" : undefined}
                    alt={before.alt || beforeName}
                    draggable={false}
                    decoding="async"
                    onLoad={(event) => readNatural(event.currentTarget, before.src)}
                />
            </div>
            <span className="ba-lab ba-lb">{beforeLabel}</span>
            <span className="ba-lab ba-la">{afterLabel}</span>
            <div
                ref={handleRef}
                className="ba-h"
                role="slider"
                tabIndex={isStatic ? -1 : 0}
                aria-label={`Compare ${beforeName} and ${afterName}`}
                aria-orientation={vertical ? "vertical" : "horizontal"}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={shown}
                aria-valuetext={`${beforeName} ${shown}%, ${afterName} ${tidy(100 - shown)}%`}
                onKeyDown={isStatic ? undefined : onKeyDown}
            >
                <span className="ba-line" />
                <span className="ba-k">
                    <Chevrons />
                </span>
            </div>
        </div>
    )
}

BeforeAfter.displayName = "Parapet BeforeAfter"

// Font controls take no fontFamily in defaultValue; without a picked font the labels use JetBrains Mono by name (MONO_STACK).
addPropertyControls(BeforeAfter, {
    beforeImage: { type: ControlType.ResponsiveImage, title: "Before image" },
    afterImage: { type: ControlType.ResponsiveImage, title: "After image" },
    beforeLabel: { type: ControlType.String, title: "Before label", defaultValue: "Before" },
    afterLabel: { type: ControlType.String, title: "After label", defaultValue: "After" },
    startPosition: {
        type: ControlType.Number,
        title: "Start",
        description: "Where the divider sits at first, in %. Static renders show this position.",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    orientation: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        displaySegmentedControl: true,
        defaultValue: "horizontal",
    },
    handleStyle: {
        type: ControlType.Enum,
        title: "Handle",
        options: ["lineCircle", "line"],
        optionTitles: ["Line + circle", "Line only"],
        displaySegmentedControl: true,
        defaultValue: "lineCircle",
    },
    aspect: {
        type: ControlType.Enum,
        title: "Ratio",
        description: "Match image uses the Before picture's ratio.",
        options: ["image", "4:3", "16:9"],
        optionTitles: ["Match image", "4:3", "16:9"],
        defaultValue: "image",
    },
    handleColor: { type: ControlType.Color, title: "Handle color", defaultValue: "#F4F3F0" },
    inkColor: { type: ControlType.Color, title: "Ink", defaultValue: "#1D1D1B" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#B4532A" },
    placeholderColor: { type: ControlType.Color, title: "Placeholder", defaultValue: "#EAE8E3" },
    labelFont: {
        type: ControlType.Font,
        title: "Label font",
        controls: "basic",
        defaultFontType: "monospace",
    },
})
