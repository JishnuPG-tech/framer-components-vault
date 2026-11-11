// Scroll Text Fade — Premium Framer Code Component
// Fixed-size sticky panel. Page scroll cycles through items.
// Center item bright + accented, others fade. Optional images per item.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useState, useEffect, useRef, CSSProperties } from "react"

// ─── Types ──────────────────────────────────────────────────────────────────────

type AccentEffect = "none" | "underlineDraw" | "glowHalo"
type TextAlign = "center" | "left"

interface ItemData {
    title: string
    subtitle: string
    image?: string
}

interface ColorsConfig {
    titleColor: string
    subtitleColor: string
    accent: string
}

interface Props {
    items: ItemData[]
    accentEffect: AccentEffect
    textAlign: TextAlign
    itemGap: number
    scrollPerItem: number
    showImages: boolean
    imageSize: number
    imageRadius: number
    titleLineHeight: number
    subtitleLineHeight: number
    colors: ColorsConfig
    fontFamily?: {
        fontFamily?: string
        fontWeight?: number | string
    }
    style?: CSSProperties
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_FONT =
    "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"

const UNSPLASH_IMAGES = [
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=400&fit=crop&q=80",
]

const DEFAULT_ITEMS: ItemData[] = [
    {
        title: "Built for Speed",
        subtitle:
            "Every millisecond matters. Our infrastructure is optimized from the ground up for blazing performance.",
        image: UNSPLASH_IMAGES[0],
    },
    {
        title: "Designed with Care",
        subtitle:
            "Pixel-perfect attention to detail. Every component is crafted to feel intuitive and beautiful.",
        image: UNSPLASH_IMAGES[1],
    },
    {
        title: "Scales Effortlessly",
        subtitle:
            "From startup to enterprise, the architecture grows with you — no rewrites, no compromises.",
        image: UNSPLASH_IMAGES[2],
    },
    {
        title: "Secure by Default",
        subtitle:
            "Security isn't an afterthought. End-to-end encryption and zero-trust architecture are built in.",
        image: UNSPLASH_IMAGES[3],
    },
    {
        title: "Open & Extensible",
        subtitle:
            "First-class API support. Integrate with anything, extend everything, own your data.",
        image: UNSPLASH_IMAGES[4],
    },
]

// ─── Accent Title Rendering ──────────────────────────────────────────────────────

function renderAccentTitle({
    title,
    accentEffect,
    accentProgress,
    titleColor,
    accent,
    fontFamily,
    fontWeight,
    fontSize,
    textAlign,
    lineHeight,
}: {
    title: string
    accentEffect: AccentEffect
    accentProgress: number
    titleColor: string
    accent: string
    fontFamily: string
    fontWeight: number | string
    fontSize: number
    textAlign: TextAlign
    lineHeight: number
}) {
    const baseStyle: CSSProperties = {
        position: "relative",
        zIndex: 1,
        fontFamily,
        fontWeight: fontWeight || 700,
        fontSize,
        lineHeight,
        textAlign,
        margin: 0,
        padding: 0,
        color: titleColor,
    }

    // ── Glow Halo ────────────────────────────────────────────────────────
    const glowEl =
        accentEffect === "glowHalo" ? (
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: textAlign === "center" ? "50%" : "20%",
                    transform: "translate(-50%, -50%)",
                    width: "clamp(150px, 50%, 400px)",
                    height: "clamp(50px, 80%, 140px)",
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse, ${accent}, transparent 70%)`,
                    opacity: accentProgress * 0.22,
                    filter: `blur(${30 + accentProgress * 15}px)`,
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />
        ) : null

    // ── Underline Draw ───────────────────────────────────────────────────
    const underlineEl =
        accentEffect === "underlineDraw" ? (
            <div
                style={{
                    height: 3,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 60%, white))`,
                    width: `${accentProgress * (textAlign === "center" ? 40 : 30)}%`,
                    marginTop: 12,
                    marginLeft: textAlign === "center" ? "auto" : 0,
                    marginRight: textAlign === "center" ? "auto" : undefined,
                }}
            />
        ) : null

    return (
        <div style={{ position: "relative" }}>
            {glowEl}
            <div style={baseStyle}>{title}</div>
            {underlineEl}
        </div>
    )
}

// ─── Image Component ─────────────────────────────────────────────────────────────

function ItemImage({
    src,
    accentProgress,
    imageSize,
    imageRadius,
}: {
    src: string
    accentProgress: number
    imageSize: number
    imageRadius: number
}) {
    return (
        <div
            style={{
                width: imageSize,
                height: imageSize * 0.65,
                borderRadius: imageRadius,
                overflow: "hidden",
                flexShrink: 0,
                opacity: 0.3 + accentProgress * 0.7,
                transform: `scale(${0.92 + accentProgress * 0.08})`,
                transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
        >
            <img
                src={src}
                alt=""
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
            />
        </div>
    )
}

// ─── Resolve image src ───────────────────────────────────────────────────────────
// ControlType.ResponsiveImage returns either a string URL or an object with src.
function resolveImageSrc(image: any): string | null {
    if (!image) return null
    if (typeof image === "string") return image
    if (typeof image === "object" && image.src) return image.src
    return null
}

// ─── Canvas Preview ──────────────────────────────────────────────────────────────

function CanvasPreview({
    items,
    accentEffect,
    textAlign,
    itemGap,
    showImages,
    imageSize,
    imageRadius,
    titleColor,
    subtitleColor,
    accent,
    fontFamily,
    fontWeight,
    titleLineHeight,
    subtitleLineHeight,
    style,
}: {
    items: ItemData[]
    accentEffect: AccentEffect
    textAlign: TextAlign
    itemGap: number
    showImages: boolean
    imageSize: number
    imageRadius: number
    titleColor: string
    subtitleColor: string
    accent: string
    fontFamily: string
    fontWeight: number | string
    titleLineHeight: number
    subtitleLineHeight: number
    style?: CSSProperties
}) {
    const mid = Math.floor(items.length / 2)
    const titleSize = 32

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: itemGap,
                padding: "40px 32px",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            {items.map((item, i) => {
                const distFromMid = Math.abs(i - mid)
                const itemOpacity =
                    distFromMid === 0 ? 1 : distFromMid === 1 ? 0.3 : 0.1
                const accentProg = distFromMid === 0 ? 1 : 0
                const imgSrc = resolveImageSrc(item.image)

                return (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems:
                                textAlign === "center"
                                    ? "center"
                                    : "flex-start",
                            gap: 8,
                            opacity: itemOpacity,
                        }}
                    >
                        {showImages && imgSrc && i === mid && (
                            <ItemImage
                                src={imgSrc}
                                accentProgress={accentProg}
                                imageSize={Math.min(imageSize, 280)}
                                imageRadius={imageRadius}
                            />
                        )}

                        {renderAccentTitle({
                            title: item.title,
                            accentEffect,
                            accentProgress: accentProg,
                            titleColor,
                            accent,
                            fontFamily,
                            fontWeight,
                            fontSize: titleSize,
                            textAlign,
                            lineHeight: titleLineHeight,
                        })}

                        {item.subtitle && item.subtitle.trim() !== "" && (
                            <div
                                style={{
                                    fontFamily,
                                    fontWeight: 400,
                                    fontSize: 14,
                                    lineHeight: subtitleLineHeight,
                                    color: subtitleColor,
                                    textAlign,
                                    maxWidth: "50ch",
                                }}
                            >
                                {item.subtitle}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────────

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScrollTextFade(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        accentEffect = "underlineDraw",
        textAlign = "center",
        itemGap = 48,
        scrollPerItem = 200,
        showImages = false,
        imageSize = 320,
        imageRadius = 16,
        titleLineHeight = 1.15,
        subtitleLineHeight = 1.55,
        colors = {} as ColorsConfig,
        fontFamily: fontFamilyProp,
        style,
    } = props

    const titleColor = colors.titleColor ?? "#111827"
    const subtitleColor = colors.subtitleColor ?? "rgba(0,0,0,0.55)"
    const accent = colors.accent ?? "#6366f1"

    const fontFamily = fontFamilyProp?.fontFamily
        ? `${fontFamilyProp.fontFamily}, ${DEFAULT_FONT}`
        : DEFAULT_FONT
    const fontWeight = fontFamilyProp?.fontWeight || 400

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    if (isCanvas) {
        return (
            <CanvasPreview
                items={items}
                accentEffect={accentEffect}
                textAlign={textAlign}
                itemGap={itemGap}
                showImages={showImages}
                imageSize={imageSize}
                imageRadius={imageRadius}
                titleColor={titleColor}
                subtitleColor={subtitleColor}
                accent={accent}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                titleLineHeight={titleLineHeight}
                subtitleLineHeight={subtitleLineHeight}
                style={style}
            />
        )
    }

    return (
        <LiveScrollPanel
            items={items}
            accentEffect={accentEffect}
            textAlign={textAlign}
            itemGap={itemGap}
            scrollPerItem={scrollPerItem}
            showImages={showImages}
            imageSize={imageSize}
            imageRadius={imageRadius}
            titleColor={titleColor}
            subtitleColor={subtitleColor}
            accent={accent}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            titleLineHeight={titleLineHeight}
            subtitleLineHeight={subtitleLineHeight}
            style={style}
        />
    )
}

// ─── Live Scroll Panel ───────────────────────────────────────────────────────────

function LiveScrollPanel({
    items,
    accentEffect,
    textAlign,
    itemGap,
    scrollPerItem,
    showImages,
    imageSize,
    imageRadius,
    titleColor,
    subtitleColor,
    accent,
    fontFamily,
    fontWeight,
    titleLineHeight,
    subtitleLineHeight,
    style,
}: {
    items: ItemData[]
    accentEffect: AccentEffect
    textAlign: TextAlign
    itemGap: number
    scrollPerItem: number
    showImages: boolean
    imageSize: number
    imageRadius: number
    titleColor: string
    subtitleColor: string
    accent: string
    fontFamily: string
    fontWeight: number | string
    titleLineHeight: number
    subtitleLineHeight: number
    style?: CSSProperties
}) {
    const outerRef = useRef<HTMLDivElement>(null)
    const rafId = useRef<number | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)

    const [viewportH, setViewportH] = useState(800)
    useEffect(() => {
        const update = () => setViewportH(window.innerHeight)
        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [])

    const totalScrollRange = (items.length - 1) * scrollPerItem
    const outerHeight = viewportH + totalScrollRange

    useEffect(() => {
        const tick = () => {
            const outer = outerRef.current
            if (outer) {
                const rect = outer.getBoundingClientRect()
                const scrolled = -rect.top
                const fraction = Math.max(
                    0,
                    Math.min(items.length - 1, scrolled / scrollPerItem)
                )
                setActiveIndex(fraction)
            }
            rafId.current = requestAnimationFrame(tick)
        }
        rafId.current = requestAnimationFrame(tick)
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current)
        }
    }, [scrollPerItem, items.length])

    const titleSize = 42

    // Measure actual item positions from the DOM so centering is exact,
    // even when items have varying heights (image vs text-only).
    const innerRef = useRef<HTMLDivElement>(null)
    const [itemPositions, setItemPositions] = useState<
        { top: number; height: number }[]
    >([])

    const measureItems = () => {
        const container = innerRef.current
        if (!container) return
        const children = Array.from(container.children) as HTMLElement[]
        const positions = children.map((child) => ({
            top: child.offsetTop,
            height: child.offsetHeight,
        }))
        setItemPositions(positions)
    }

    useEffect(() => {
        measureItems()
        // Re-measure when images load or layout changes
        const container = innerRef.current
        if (!container) return
        const obs = new ResizeObserver(measureItems)
        obs.observe(container)
        return () => obs.disconnect()
    }, [items.length, showImages, imageSize, itemGap])

    // Compute centerOffset from measured positions (fallback to estimate)
    let centerOffset = viewportH / 2
    if (itemPositions.length === items.length && items.length > 0) {
        const floorIdx = Math.min(Math.floor(activeIndex), items.length - 1)
        const ceilIdx = Math.min(floorIdx + 1, items.length - 1)
        const frac = activeIndex - floorIdx

        const floorPos = itemPositions[floorIdx]
        const ceilPos = itemPositions[ceilIdx]
        const activeTop = floorPos.top + (ceilPos.top - floorPos.top) * frac
        const activeH =
            floorPos.height + (ceilPos.height - floorPos.height) * frac
        centerOffset = viewportH / 2 - activeTop - activeH / 2
    }

    return (
        <div
            ref={outerRef}
            style={{
                width: "100%",
                height: outerHeight,
                position: "relative",
            }}
        >
            <div
                style={{
                    ...style,
                    position: "sticky",
                    top: 0,
                    height: viewportH,
                    width: "100%",
                    overflow: "hidden",
                    boxSizing: "border-box",
                }}
            >
                <div
                    ref={innerRef}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: itemGap,
                        width: "100%",
                        padding: "0 clamp(24px, 6vw, 80px)",
                        boxSizing: "border-box",
                        transform: `translateY(${centerOffset}px)`,
                        willChange: "transform",
                        transition:
                            "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                >
                    {items.map((item, i) => {
                        const dist = Math.abs(i - activeIndex)
                        const opacity = Math.max(0.03, 1 - dist * 0.9)
                        const scale = Math.max(0.95, 1 - dist * 0.025)
                        const accentProg = Math.max(0, 1 - dist * 1.5)
                        const imgSrc = resolveImageSrc(item.image)

                        return (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems:
                                        textAlign === "center"
                                            ? "center"
                                            : "flex-start",
                                    gap: 12,
                                    opacity,
                                    transform: `scale(${scale})`,
                                    willChange: "transform, opacity",
                                    transition:
                                        "opacity 0.2s ease, transform 0.2s ease",
                                }}
                            >
                                {showImages && imgSrc && (
                                    <ItemImage
                                        src={imgSrc}
                                        accentProgress={accentProg}
                                        imageSize={imageSize}
                                        imageRadius={imageRadius}
                                    />
                                )}

                                {renderAccentTitle({
                                    title: item.title,
                                    accentEffect,
                                    accentProgress: accentProg,
                                    titleColor,
                                    accent,
                                    fontFamily,
                                    fontWeight,
                                    fontSize: titleSize,
                                    textAlign,
                                    lineHeight: titleLineHeight,
                                })}

                                {item.subtitle &&
                                    item.subtitle.trim() !== "" && (
                                        <div
                                            style={{
                                                fontFamily,
                                                fontWeight: 400,
                                                fontSize: 17,
                                                lineHeight: subtitleLineHeight,
                                                color: subtitleColor,
                                                textAlign,
                                                maxWidth: "54ch",
                                            }}
                                        >
                                            {item.subtitle}
                                        </div>
                                    )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── Default Props ───────────────────────────────────────────────────────────────

ScrollTextFade.defaultProps = {
    items: DEFAULT_ITEMS,
    accentEffect: "underlineDraw",
    textAlign: "center",
    itemGap: 48,
    scrollPerItem: 200,
    showImages: false,
    imageSize: 320,
    imageRadius: 16,
    titleLineHeight: 1.15,
    subtitleLineHeight: 1.55,
    colors: {
        titleColor: "#111827",
        subtitleColor: "rgba(0,0,0,0.55)",
        accent: "#6366f1",
    },
}

// ─── Property Controls ───────────────────────────────────────────────────────────

addPropertyControls(ScrollTextFade, {
    // ── Content ──────────────────────────────────────────────────────────
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Section Title",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    displayTextArea: true,
                    defaultValue: "A short description for this section.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "Optional. Only shown when Show Images is on.",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
        maxCount: 12,
    },

    // ── Layout ───────────────────────────────────────────────────────────
    accentEffect: {
        type: ControlType.Enum,
        title: "Accent",
        options: ["none", "underlineDraw", "glowHalo"],
        optionTitles: ["None", "Underline Draw", "Glow Halo"],
        defaultValue: "underlineDraw",
    },

    textAlign: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["center", "left"],
        optionTitles: ["Center", "Left"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },

    itemGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 20,
        max: 80,
        step: 4,
        defaultValue: 48,
        unit: "px",
    },

    scrollPerItem: {
        type: ControlType.Number,
        title: "Scroll Speed",
        min: 100,
        max: 500,
        step: 10,
        defaultValue: 200,
        unit: "px",
        description: "Scroll distance per item",
    },

    // ── Images ───────────────────────────────────────────────────────────
    showImages: {
        type: ControlType.Boolean,
        title: "Images",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    imageSize: {
        type: ControlType.Number,
        title: "↳ Width",
        min: 120,
        max: 600,
        step: 10,
        defaultValue: 320,
        unit: "px",
        hidden: (props: any) => !props.showImages,
    },

    imageRadius: {
        type: ControlType.Number,
        title: "↳ Radius",
        min: 0,
        max: 32,
        step: 2,
        defaultValue: 16,
        unit: "px",
        hidden: (props: any) => !props.showImages,
    },

    // ── Colors ───────────────────────────────────────────────────────────
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            titleColor: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: "#111827",
            },
            subtitleColor: {
                type: ControlType.Color,
                title: "Subtitle",
                defaultValue: "rgba(0,0,0,0.55)",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#6366f1",
            },
        },
    },

    // ── Typography ───────────────────────────────────────────────────────
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },

    titleLineHeight: {
        type: ControlType.Number,
        title: "Title Line Height",
        defaultValue: 1.15,
        min: 0.8,
        max: 2.5,
        step: 0.05,
    },

    subtitleLineHeight: {
        type: ControlType.Number,
        title: "Subtitle Line Height",
        defaultValue: 1.55,
        min: 0.8,
        max: 2.5,
        step: 0.05,
    },
})
