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


interface ImageAsset {
    src?: string
    alt?: string
}

interface Props {
    before?: ImageAsset | string | null
    after?: ImageAsset | string | null
    initial?: number
    paper?: string
    handleColor?: string
    gripColor?: string
    handleBorderColor?: string
    ink?: string
    style?: React.CSSProperties
}

const BEFORE: ImageAsset = {
    src: "https://framerusercontent.com/images/DtvGbqfUVJt71Hr5EIJ29YdCwA.png",
    alt: "The same ice formations with a pixelated texture",
}
const AFTER: ImageAsset = {
    src: "https://framerusercontent.com/images/7qRVVcOaD4XumPepcBqIcCiUw.png",
    alt: "Ice formations in sharp detail",
}
const DEFAULTS = {
    before: BEFORE,
    after: AFTER,
    initial: 32,
    paper: "rgb(255, 255, 255)",
    handleColor: "#ffffff",
    gripColor: "rgb(189, 212, 255)",
    handleBorderColor: "rgba(191, 212, 255, 0.5)",
    ink: "#262626",
}
const REVEAL = "--before-after-slider-reveal"
const clamp = (value: number) =>
    Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : DEFAULTS.initial

// Literal assets and defaults remain available when copied to another project.
function resolveImage(value: Props["before"], fallback: ImageAsset): ImageAsset {
    if (typeof value === "string") {
        return { src: value.trim() || fallback.src, alt: fallback.alt }
    }
    return {
        src: value?.src?.trim() || fallback.src,
        alt: value?.alt || fallback.alt,
    }
}

function resolveColor(value: string | undefined, fallback: string): string {
    const color = typeof value === "string" ? value.trim() : ""
    if (!color) return fallback
    return color.replace(/^var\(\s*(--[^,()\s]+)\s*\)$/, (_, token) =>
        `var(${token}, ${fallback})`
    )
}

const IMAGE_STYLE: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "block",
    width: "100%",
    height: "100%",
    minWidth: 0,
    minHeight: 0,
    maxWidth: "none",
    maxHeight: "none",
    margin: 0,
    padding: 0,
    border: 0,
    borderRadius: 0,
    boxSizing: "border-box",
    objectFit: "cover",
    objectPosition: "50% 50%",
    pointerEvents: "none",
    userSelect: "none",
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 360
 */
export default function BeforeAfterSlider({
    before = BEFORE,
    after = AFTER,
    initial = DEFAULTS.initial,
    paper: suppliedPaper,
    handleColor: suppliedHandle,
    gripColor: suppliedGrip,
    handleBorderColor: suppliedBorder,
    ink: suppliedInk,
    style,
}: Props) {
    const beforeImage = resolveImage(before, BEFORE)
    const afterImage = resolveImage(after, AFTER)
    const paper = resolveColor(suppliedPaper, DEFAULTS.paper)
    const handleColor = resolveColor(suppliedHandle, DEFAULTS.handleColor)
    const gripColor = resolveColor(suppliedGrip, DEFAULTS.gripColor)
    const handleBorderColor = resolveColor(suppliedBorder, DEFAULTS.handleBorderColor)
    const ink = resolveColor(suppliedInk, DEFAULTS.ink)
    const start = clamp(initial)
    const surface = React.useRef<HTMLDivElement>(null)
    const reveal = React.useRef(start)
    const pendingX = React.useRef<number | null>(null)
    const frame = React.useRef<number | null>(null)
    const [hasFocus, setHasFocus] = React.useState(false)

    const paint = (value: number) => {
        const next = clamp(value)
        reveal.current = next
        const element = surface.current
        if (!element) return
        const rounded = Math.round(next)
        element.style.setProperty(REVEAL, next + "%")
        element.setAttribute("aria-valuenow", String(rounded))
        element.setAttribute("aria-valuetext", rounded + "% " + beforeImage.alt)
    }

    // Only the divider and clipping boundary update while dragging.
    // No image rerenders, global listeners, shared state, or layout observers.
    const flushPointer = () => {
        frame.current = null
        const x = pendingX.current
        pendingX.current = null
        if (x === null) return
        const bounds = surface.current?.getBoundingClientRect()
        if (bounds && bounds.width > 0) {
            paint(((x - bounds.left) / bounds.width) * 100)
        }
    }

    const cancelFrame = () => {
        if (frame.current !== null) {
            cancelAnimationFrame(frame.current)
            frame.current = null
        }
    }

    React.useEffect(() => {
        reveal.current = start
        const element = surface.current
        if (!element) return
        const rounded = Math.round(start)
        element.style.setProperty(REVEAL, start + "%")
        element.setAttribute("aria-valuenow", String(rounded))
        element.setAttribute("aria-valuetext", rounded + "% " + beforeImage.alt)
    }, [start, beforeImage.alt])

    React.useEffect(() => () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current)
    }, [])

    const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
        cancelFrame()
        flushPointer()
        event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const increment = event.shiftKey ? 10 : 1
        let next: number
        switch (event.key) {
            case "ArrowLeft":
            case "ArrowDown":
                next = reveal.current - increment
                break
            case "ArrowRight":
            case "ArrowUp":
                next = reveal.current + increment
                break
            case "Home":
                next = 0
                break
            case "End":
                next = 100
                break
            default:
                return
        }
        event.preventDefault()
        cancelFrame()
        pendingX.current = null
        paint(next)
    }

    const rootStyle = {
        width: 640,
        height: 360,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        minWidth: 0,
        minHeight: 0,
        margin: 0,
        padding: 0,
        border: 0,
        isolation: "isolate",
        borderRadius: 16,
        overflow: "hidden",
        ...style,
        [REVEAL]: start + "%",
    } as React.CSSProperties

    return (
        <div style={rootStyle}>
            <div
                ref={surface}
                role="slider"
                tabIndex={0}
                aria-label="Before - After Slider"
                aria-orientation="horizontal"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(reveal.current)}
                aria-valuetext={Math.round(reveal.current) + "% " + beforeImage.alt}
                onFocus={() => setHasFocus(true)}
                onBlur={() => setHasFocus(false)}
                onKeyDown={onKeyDown}
                onPointerDown={(event) => {
                    if (!event.isPrimary || event.button !== 0) return
                    event.currentTarget.focus({ preventScroll: true })
                    event.currentTarget.setPointerCapture(event.pointerId)
                    cancelFrame()
                    pendingX.current = event.clientX
                    flushPointer()
                }}
                onPointerMove={(event) => {
                    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
                    pendingX.current = event.clientX
                    if (frame.current === null) {
                        frame.current = requestAnimationFrame(flushPointer)
                    }
                }}
                onPointerUp={endPointer}
                onPointerCancel={endPointer}
                onLostPointerCapture={() => {
                    cancelFrame()
                    pendingX.current = null
                }}
                style={{
                    position: "relative",
                    flex: "1 1 auto",
                    width: "100%",
                    minWidth: 0,
                    minHeight: 0,
                    boxSizing: "border-box",
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: "ew-resize",
                    touchAction: "pan-y",
                    outline: hasFocus ? "2px solid " + paper : "none",
                    outlineOffset: -3,
                    background: ink,
                }}
            >
                <img src={afterImage.src} alt={afterImage.alt} draggable={false} style={IMAGE_STYLE} />
                <div style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: "inset(0 calc(100% - var(" + REVEAL + ")) 0 0)",
                }}>
                    <img src={beforeImage.src} alt={beforeImage.alt} draggable={false} style={IMAGE_STYLE} />
                </div>
                <div aria-hidden={true} style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "var(" + REVEAL + ")",
                    width: 2,
                    background: paper,
                    transform: "translateX(-50%)",
                    pointerEvents: "none",
                }}>
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 24,
                        height: 83,
                        boxSizing: "border-box",
                        borderRadius: 12,
                        background: handleColor,
                        border: "1px solid " + handleBorderColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }}>
                        <div style={{ width: 6, height: 35, borderRadius: 255, background: gripColor }} />
                    </div>
                </div>
            </div>
        </div>
    )
}

BeforeAfterSlider.displayName = "Before - After Slider"
BeforeAfterSlider.defaultProps = DEFAULTS

addPropertyControls(BeforeAfterSlider, {
    before: { type: ControlType.ResponsiveImage, title: "Before" },
    after: { type: ControlType.ResponsiveImage, title: "After" },
    initial: {
        type: ControlType.Number,
        title: "Reveal",
        defaultValue: DEFAULTS.initial,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    paper: { type: ControlType.Color, title: "Divider", defaultValue: DEFAULTS.paper },
    handleColor: { type: ControlType.Color, title: "Handle", defaultValue: DEFAULTS.handleColor },
    gripColor: { type: ControlType.Color, title: "Grip", defaultValue: DEFAULTS.gripColor },
    handleBorderColor: { type: ControlType.Color, title: "Handle Border", defaultValue: DEFAULTS.handleBorderColor },
    ink: { type: ControlType.Color, title: "Background", defaultValue: DEFAULTS.ink },
})
