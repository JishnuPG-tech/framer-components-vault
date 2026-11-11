// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect } from "react"

/**
 * Expanding Panels
 *
 * A row or column of panels where one panel stays open and the rest collapse.
 * Opens on hover or click, cycles on its own, and links out per panel.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 520
 */
export default function ExpandingPanels({
    slides = defaultSlides,
    layout = "horizontal",
    trigger = "hover",
    height = 520,
    collapsedHeight = 120,
    imageFit = "cover",
    gap = 12,
    radius = 16,
    expandDuration = 0.6,
    autoplay = true,
    interval = 3,
    activeFlex = 6,
    inactiveFlex = 1,
    grayscale = 80,
    dim = 0.6,
    placeholderColor = "#1F2937",
    overlayColor = "rgba(0,0,0,0.75)",
    overlayHeight = 240,
    textPaddingLeft = 28,
    textPaddingRight = 24,
    textPaddingBottom = 32,
    fontFamily = "Inter, sans-serif",
    titleSize = 38,
    titleWeight = "700",
    titleColor = "#FFFFFF",
    titleSpacing = -0.5,
    descSize = 16,
    descWeight = "400",
    descColor = "rgba(255,255,255,0.85)",
    descMaxWidth = 400,
    style = {},
}) {
    const list = Array.isArray(slides) && slides.length ? slides : defaultSlides
    const count = list.length
    const isVertical = layout === "vertical"
    const openOnHover = trigger === "hover"

    const isStatic = useIsStaticRenderer()
    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)
    const [reducedMotion, setReducedMotion] = useState(false)

    // Keep the active index inside range when panels are added or removed
    useEffect(() => {
        if (active > count - 1) setActive(0)
    }, [count, active])

    // Respect the visitor's reduced motion setting (SSR safe)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReducedMotion(query.matches)
        sync()
        query.addEventListener?.("change", sync)
        return () => query.removeEventListener?.("change", sync)
    }, [])

    // Auto cycling, paused on canvas and while the visitor is interacting
    useEffect(() => {
        if (isStatic || paused || reducedMotion) return
        if (!autoplay || count <= 1) return
        const id = setInterval(
            () => setActive((a) => (a + 1) % count),
            Math.max(1, interval) * 1000
        )
        return () => clearInterval(id)
    }, [isStatic, paused, reducedMotion, autoplay, interval, count])

    const ease = "cubic-bezier(0.25, 1, 0.5, 1)"
    const dur = reducedMotion || isStatic ? "0s" : `${expandDuration}s`

    return (
        <div
            role="tablist"
            aria-orientation={isVertical ? "vertical" : "horizontal"}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{
                display: "flex",
                flexDirection: isVertical ? "column" : "row",
                gap,
                width: "100%",
                height,
                overflow: "hidden",
                ...style,
            }}
        >
            {list.map((slide, i) => {
                const open = i === active
                const link = slide?.link
                const Tag = link ? "a" : "div"

                // Accepts Framer responsive images and plain URL strings
                const source = slide?.image
                const imageSrc = source
                    ? typeof source === "string"
                        ? source
                        : source.src || ""
                    : ""
                const imageSrcSet =
                    source && typeof source !== "string"
                        ? source.srcSet
                        : undefined
                const imageAlt =
                    (source && typeof source !== "string" && source.alt) ||
                    slide?.title ||
                    ""

                const openPanel = () => {
                    setPaused(true)
                    setActive(i)
                }

                return (
                    <Tag
                        key={i}
                        href={link || undefined}
                        target={link ? "_blank" : undefined}
                        rel={link ? "noopener noreferrer" : undefined}
                        role={link ? undefined : "tab"}
                        tabIndex={0}
                        aria-selected={open}
                        aria-label={slide?.title || `Panel ${i + 1}`}
                        onMouseEnter={() => {
                            if (openOnHover) setActive(i)
                        }}
                        onFocus={() => {
                            setPaused(true)
                            setActive(i)
                        }}
                        onBlur={() => setPaused(false)}
                        onClick={(event) => {
                            // First tap opens the panel, second tap follows the link
                            if (!open) {
                                if (link) event.preventDefault()
                                openPanel()
                            }
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                if (!open) {
                                    event.preventDefault()
                                    openPanel()
                                }
                            }
                        }}
                        style={{
                            position: "relative",
                            display: "block",
                            flexGrow: open ? activeFlex : inactiveFlex,
                            flexBasis: 0,
                            flexShrink: 1,
                            width: isVertical ? "100%" : "auto",
                            height: isVertical ? "auto" : "100%",
                            minWidth: 0,
                            minHeight: isVertical ? collapsedHeight : 0,
                            backgroundColor: placeholderColor,
                            borderRadius: radius,
                            overflow: "hidden",
                            cursor: link || !open ? "pointer" : "default",
                            textDecoration: "none",
                            transition: `flex-grow ${dur} ${ease}`,
                            willChange: "flex-grow",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        {/* Background image */}
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                srcSet={imageSrcSet}
                                alt={imageAlt}
                                loading={i === 0 ? "eager" : "lazy"}
                                decoding="async"
                                draggable={false}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: imageFit,
                                    filter: open
                                        ? "grayscale(0%) brightness(1)"
                                        : `grayscale(${grayscale}%) brightness(${dim})`,
                                    transition: `filter ${dur} ${ease}`,
                                    userSelect: "none",
                                    pointerEvents: "none",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily,
                                    fontSize: 14,
                                    color: "rgba(255,255,255,0.5)",
                                    pointerEvents: "none",
                                }}
                            >
                                Add an image
                            </div>
                        )}

                        {/* Gradient scrim */}
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: overlayHeight,
                                background: `linear-gradient(to top, ${overlayColor} 0%, transparent 100%)`,
                                opacity: open ? 1 : 0,
                                transition: `opacity ${dur} ${ease}`,
                                pointerEvents: "none",
                            }}
                        />

                        {/* Title and description */}
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                paddingLeft: textPaddingLeft,
                                paddingRight: textPaddingRight,
                                paddingBottom: textPaddingBottom,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                                opacity: open ? 1 : 0,
                                transform: open
                                    ? "translateY(0)"
                                    : "translateY(12px)",
                                transition: `opacity ${dur} ${ease}, transform ${dur} ${ease}`,
                                pointerEvents: "none",
                            }}
                        >
                            {slide?.title ? (
                                <div
                                    style={{
                                        fontFamily,
                                        fontSize: titleSize,
                                        fontWeight: titleWeight,
                                        letterSpacing: `${titleSpacing}px`,
                                        lineHeight: 1.15,
                                        color: titleColor,
                                        margin: 0,
                                    }}
                                >
                                    {slide.title}
                                </div>
                            ) : null}
                            {slide?.description ? (
                                <div
                                    style={{
                                        fontFamily,
                                        fontSize: descSize,
                                        fontWeight: descWeight,
                                        lineHeight: 1.45,
                                        color: descColor,
                                        maxWidth: descMaxWidth,
                                        margin: 0,
                                    }}
                                >
                                    {slide.description}
                                </div>
                            ) : null}
                        </div>
                    </Tag>
                )
            })}
        </div>
    )
}

// Self contained gradient placeholders so the component never depends on an external host
const placeholder = (from, to) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="1000" fill="url(#g)"/></svg>`
    )}`

const defaultSlides = [
    {
        image: { src: placeholder("#3B4252", "#8FA1B3") },
        title: "First Panel",
        description:
            "Swap this image, title and description in the panel list.",
        link: "",
    },
    {
        image: { src: placeholder("#4C3B4D", "#B48EAD") },
        title: "Second Panel",
        description: "Add as many panels as you need, each with its own link.",
        link: "",
    },
    {
        image: { src: placeholder("#3B4A43", "#8FBCA6") },
        title: "Third Panel",
        description:
            "Set the layout to horizontal or vertical to suit the section.",
        link: "",
    },
]

addPropertyControls(ExpandingPanels, {
    slides: {
        type: ControlType.Array,
        title: "Panels",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Short description.",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: defaultSlides,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        displaySegmentedControl: true,
        defaultValue: "horizontal",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Opens On",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        displaySegmentedControl: true,
        defaultValue: "hover",
        description: "Use Click for touch friendly sections.",
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        min: 100,
        max: 1400,
        unit: "px",
        defaultValue: 520,
        description: "Used when the layer height is set to Auto.",
    },
    collapsedHeight: {
        type: ControlType.Number,
        title: "Closed Height",
        min: 40,
        max: 600,
        unit: "px",
        defaultValue: 120,
        hidden: (p) => p.layout !== "vertical",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Stretch"],
        defaultValue: "cover",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 64,
        unit: "px",
        defaultValue: 12,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        unit: "px",
        defaultValue: 16,
    },
    expandDuration: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: 0.6,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        min: 1,
        max: 12,
        unit: "s",
        defaultValue: 3,
        hidden: (p) => !p.autoplay,
    },
    activeFlex: {
        type: ControlType.Number,
        title: "Open Size",
        min: 2,
        max: 12,
        step: 0.5,
        defaultValue: 6,
    },
    inactiveFlex: {
        type: ControlType.Number,
        title: "Closed Size",
        min: 0.5,
        max: 4,
        step: 0.5,
        defaultValue: 1,
    },
    grayscale: {
        type: ControlType.Number,
        title: "Grayscale",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 80,
    },
    dim: {
        type: ControlType.Number,
        title: "Dim",
        min: 0.2,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Panel BG",
        defaultValue: "#1F2937",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "rgba(0,0,0,0.75)",
    },
    overlayHeight: {
        type: ControlType.Number,
        title: "Overlay H",
        min: 60,
        max: 500,
        unit: "px",
        defaultValue: 240,
    },
    textPaddingLeft: {
        type: ControlType.Number,
        title: "Pad Left",
        min: 0,
        max: 120,
        unit: "px",
        defaultValue: 28,
    },
    textPaddingRight: {
        type: ControlType.Number,
        title: "Pad Right",
        min: 0,
        max: 120,
        unit: "px",
        defaultValue: 24,
    },
    textPaddingBottom: {
        type: ControlType.Number,
        title: "Pad Bottom",
        min: 0,
        max: 120,
        unit: "px",
        defaultValue: 32,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Inter, sans-serif",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 14,
        max: 96,
        unit: "px",
        defaultValue: 38,
    },
    titleWeight: {
        type: ControlType.Enum,
        title: "Title Weight",
        options: ["300", "400", "500", "600", "700", "800", "900"],
        defaultValue: "700",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    titleSpacing: {
        type: ControlType.Number,
        title: "Title Spacing",
        min: -5,
        max: 10,
        step: 0.1,
        unit: "px",
        defaultValue: -0.5,
    },
    descSize: {
        type: ControlType.Number,
        title: "Desc Size",
        min: 10,
        max: 40,
        unit: "px",
        defaultValue: 16,
    },
    descWeight: {
        type: ControlType.Enum,
        title: "Desc Weight",
        options: ["300", "400", "500", "600", "700"],
        defaultValue: "400",
    },
    descColor: {
        type: ControlType.Color,
        title: "Desc Color",
        defaultValue: "rgba(255,255,255,0.85)",
    },
    descMaxWidth: {
        type: ControlType.Number,
        title: "Desc Width",
        min: 120,
        max: 800,
        unit: "px",
        defaultValue: 400,
    },
})
