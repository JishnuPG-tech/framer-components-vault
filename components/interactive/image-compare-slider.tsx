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

import { useReducedMotion } from "framer-motion"

type ImageValue = { src?: string; srcSet?: string; alt?: string }
interface Props {
    beforeImage?: ImageValue
    afterImage?: ImageValue
    monochromeBefore: boolean
    beforeLabel: string
    afterLabel: string
    eyebrow: string
    headline: string
    description: string
    ctaLabel: string
    ctaLink: string
    initialPosition: number
    radius: number
    imageHeight: number
    handleSize: number
    motionSpeed: number
    background: string
    titleColor: string
    mutedColor: string
    accentColor: string
    lineColor: string
    headlineFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    style?: React.CSSProperties
}

const PHOTO = "https://images.unsplash.com/photo-1685222325359-f9ef6e8eb0ab?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600"
const DEFAULT_IMAGE: ImageValue = { src: PHOTO, alt: "Minimal interior with a sculptural armchair, warm plaster walls and orange wall art" }
const bound = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const Arrow = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <path d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 590
 */
export default function EditorialImageCompare(props: Props) {
    const {
        beforeImage = DEFAULT_IMAGE, afterImage = DEFAULT_IMAGE,
        monochromeBefore = true,
        beforeLabel = "Original", afterLabel = "Reimagined",
        eyebrow = "THE STUDIO EDIT / 001",
        headline = "See the difference.",
        description = "One frame. Two perspectives. Drag to explore the details.",
        ctaLabel = "Build your website", ctaLink = "",
        initialPosition = 53,
        radius = 20, imageHeight = 480, handleSize = 62, motionSpeed = 0.2,
        background = "#F5F5F0", titleColor = "#1C1C1A",
        mutedColor = "#757570", accentColor = "#DDFE83",
        lineColor = "#FFFFFF", headlineFont, labelFont, bodyFont, style
    } = props
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const rootId = React.useId().replace(/:/g, "")
    const viewport = React.useRef<HTMLDivElement>(null)
    const dragging = React.useRef(false)
    const [position, setPosition] = React.useState(bound(initialPosition, 0, 100))
    const [activeDrag, setActiveDrag] = React.useState(false)
    const [focused, setFocused] = React.useState(false)

    React.useEffect(() => {
        if (!dragging.current) setPosition(bound(initialPosition, 0, 100))
    }, [initialPosition])

    const setFromPointer = React.useCallback((x: number) => {
        if (!viewport.current) return
        const rect = viewport.current.getBoundingClientRect()
        if (!rect.width) return
        setPosition(bound(((x - rect.left) / rect.width) * 100, 0, 100))
    }, [])

    const press = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic) return
        event.preventDefault()
        event.stopPropagation()
        dragging.current = true
        setActiveDrag(true)
        event.currentTarget.setPointerCapture(event.pointerId)
        setFromPointer(event.clientX)
    }
    const move = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragging.current) setFromPointer(event.clientX)
    }
    const release = () => {
        dragging.current = false
        setActiveDrag(false)
    }
    const keyMove = (event: React.KeyboardEvent<HTMLDivElement>) => {
        let to: number | null = null
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = position - (event.shiftKey ? 10 : 2)
        if (event.key === "ArrowRight" || event.key === "ArrowUp") to = position + (event.shiftKey ? 10 : 2)
        if (event.key === "Home") to = 0
        if (event.key === "End") to = 100
        if (to !== null) { event.preventDefault(); setPosition(bound(to, 0, 100)) }
    }
    const labelCss: React.CSSProperties = {
        fontFamily: "Inter, Arial, sans-serif", fontSize: 11, lineHeight: 1.1,
        fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
        ...labelFont
    }
    const mediaStyle: React.CSSProperties = {
        display: "block", position: "absolute", inset: 0, width: "100%",
        height: "100%", objectFit: "cover", objectPosition: "center",
        userSelect: "none", pointerEvents: "none"
    }
    const hasLink = Boolean(ctaLink && ctaLink.trim())
    const labelPosition = { position: "absolute" as const, top: 22, zIndex: 3,
        display: "flex", alignItems: "center", gap: 7, padding: "10px 13px",
        borderRadius: 100, background: "rgba(255,255,255,.94)", color: "#20211E",
        pointerEvents: "none" as const, boxShadow: "0 4px 16px rgba(0,0,0,.08)" }

    return (
        <section
            aria-label="Before and after image comparison"
            style={{
                ...style,
                width: style?.width ?? "100%", height: style?.height ?? "auto",
                minWidth: 0, minHeight: 0, boxSizing: "border-box",
                background, padding: 12, borderRadius: Math.max(8, radius + 12),
                color: titleColor, overflow: "hidden", position: "relative",
                fontFamily: "Inter, Arial, sans-serif"
            }}
        >
            <div
                ref={viewport}
                aria-label="Image comparison canvas"
                onClick={(e) => { if (!isStatic && !dragging.current) setFromPointer(e.clientX) }}
                style={{
                    width: "100%", aspectRatio: "2.2 / 1", minHeight: 270, maxHeight: Math.max(270, imageHeight),
                    position: "relative", overflow: "hidden", borderRadius: Math.max(3, radius),
                    background: "#A7C6CF", isolation: "isolate", cursor: isStatic ? "default" : "ew-resize"
                }}
            >
                <img {...(afterImage?.src ? { src: afterImage.src, srcSet: afterImage.srcSet } : { src: PHOTO })} alt={afterImage?.alt || "Edited image"} draggable={false} style={mediaStyle} />
                <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                    clipPath: "inset(0 " + (100 - position) + "% 0 0)",
                    WebkitClipPath: "inset(0 " + (100 - position) + "% 0 0)", zIndex: 1, pointerEvents: "none" }}>
                    <img {...(beforeImage?.src ? { src: beforeImage.src, srcSet: beforeImage.srcSet } : { src: PHOTO })} alt={beforeImage?.alt || "Original image"} draggable={false}
                        style={{ ...mediaStyle, filter: monochromeBefore ? "grayscale(1) contrast(.86) brightness(1.08)" : "none" }}/>
                </div>

                <div style={{ ...labelPosition, left: 22, ...labelCss }}><span style={{ width: 7, height: 7, background: "#262722", borderRadius: "50%" }} />{beforeLabel}</div>
                <div style={{ ...labelPosition, right: 22, ...labelCss }}><span style={{ width: 7, height: 7, background: "#B6ED62", borderRadius: "50%" }} />{afterLabel}</div>

                <div
                    onPointerDown={press} onPointerMove={move}
                    onPointerUp={release} onPointerCancel={release}
                    onLostPointerCapture={release}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={keyMove}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    role="slider" tabIndex={isStatic ? -1 : 0}
                    aria-label="Drag to compare the before and after images"
                    aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={100}
                    aria-valuenow={Math.round(position)}
                    aria-valuetext={Math.round(position) + "% original image visible"}
                    style={{
                        position: "absolute", top: 0, bottom: 0, left: position + "%",
                        transform: "translateX(-50%)", width: Math.max(56, handleSize + 20),
                        zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center",
                        touchAction: "none", cursor: isStatic ? "default" : "ew-resize",
                        outline: "none", WebkitTapHighlightColor: "transparent"
                    }}
                    className={"editorial-compare-slider-" + rootId}
                >
                    <span aria-hidden="true" style={{ width: 2, background: lineColor, position: "absolute", top: 0, bottom: 0,
                        boxShadow: "0 0 8px rgba(0,0,0,.24)" }} />
                    <span aria-hidden="true" style={{
                        height: handleSize, width: handleSize, borderRadius: "50%",
                        background: accentColor, color: "#172015",
                        boxShadow: focused ? "0 0 0 3px #1C1C1A, 0 0 0 6px rgba(255,255,255,.95)" : activeDrag ? "0 8px 28px rgba(0,0,0,.22)" : "0 5px 19px rgba(0,0,0,.17)",
                        border: "4px solid rgba(255,255,255,.98)", display: "flex",
                        alignItems: "center", justifyContent: "center", gap: 8,
                        transform: activeDrag && !reducedMotion ? "scale(1.06)" : "scale(1)",
                        transition: reducedMotion ? "none" : "transform " + Math.max(0, motionSpeed) + "s ease, box-shadow " + Math.max(0, motionSpeed) + "s ease"
                    }}>
                        <svg width="22" height="17" viewBox="0 0 22 17" fill="none">
                            <path d="M8.5 3 3 8.5 8.5 14M3 8.5h16M13.5 3 19 8.5 13.5 14"
                                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                </div>
            </div>

            <div style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
                gap: "18px 28px", minHeight: 112, padding: "20px 14px 12px"
            }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "1 1 280px", minWidth: 0 }}>
                    <div style={{ ...labelCss, color: mutedColor }}>{eyebrow}</div>
                    <h2 style={{
                        fontFamily: "Inter, Arial, sans-serif", fontSize: "clamp(22px, 3.2vw, 35px)",
                        fontWeight: 550, letterSpacing: "-0.045em", lineHeight: 1.08, margin: 0, color: titleColor,
                        ...headlineFont
                    }}>{headline}</h2>
                    {description && <p style={{
                        fontSize: 13, lineHeight: 1.4, margin: 0, color: mutedColor,
                        ...bodyFont
                    }}>{description}</p>}
                </div>
                {hasLink ? (
                    <a href={ctaLink} target="_blank" rel="noopener noreferrer"
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28,
                            padding: "17px 17px 17px 21px", borderRadius: 12, minWidth: 190,
                            background: titleColor, color: "#FFFFFF", textDecoration: "none", alignSelf: "center",
                            fontWeight: 550, fontSize: 13, cursor: "pointer"
                        }}>
                        <span>{ctaLabel || "Learn More"}</span><Arrow/>
                    </a>
                ) : (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10, color: mutedColor,
                        fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase"
                    }}>
                        <span style={{ width: 22, height: 1, background: mutedColor, opacity: .65 }} />
                        Drag to compare
                    </div>
                )}
            </div>
        </section>
    )
}

addPropertyControls(EditorialImageCompare, {
    beforeImage: { type: ControlType.ResponsiveImage, title: "Before Image" },
    afterImage: { type: ControlType.ResponsiveImage, title: "After Image" },
    monochromeBefore: { type: ControlType.Boolean, title: "Mono Before", defaultValue: true },
    beforeLabel: { type: ControlType.String, title: "Before Label", defaultValue: "Original" },
    afterLabel: { type: ControlType.String, title: "After Label", defaultValue: "Reimagined" },
    eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "THE STUDIO EDIT / 001" },
    headline: { type: ControlType.String, title: "Headline", defaultValue: "See the difference." },
    description: { type: ControlType.String, title: "Description", defaultValue: "One frame. Two perspectives. Drag to explore the details." },
    ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "Build your website" },
    ctaLink: { type: ControlType.Link, title: "CTA Link", defaultValue: "" },
    initialPosition: { type: ControlType.Number, title: "Start Split", min: 0, max: 100, step: 1, defaultValue: 53, unit: "%" },
    radius: { type: ControlType.Number, title: "Image Radius", min: 0, max: 48, defaultValue: 20 },
    imageHeight: { type: ControlType.Number, title: "Image Height", min: 270, max: 800, defaultValue: 480 },
    handleSize: { type: ControlType.Number, title: "Handle Size", min: 40, max: 90, defaultValue: 62 },
    motionSpeed: { type: ControlType.Number, title: "Handle Motion", min: 0, max: 1, step: 0.05, defaultValue: 0.2, unit: "s" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#F5F5F0" },
    titleColor: { type: ControlType.Color, title: "Text", defaultValue: "#1C1C1A" },
    mutedColor: { type: ControlType.Color, title: "Secondary", defaultValue: "#757570" },
    accentColor: { type: ControlType.Color, title: "Handle", defaultValue: "#DDFE83" },
    lineColor: { type: ControlType.Color, title: "Divider", defaultValue: "#FFFFFF" },
    headlineFont: { type: ControlType.Font, title: "Title Font", controls: "extended" },
    labelFont: { type: ControlType.Font, title: "Label Font", controls: "extended" },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended" }
})