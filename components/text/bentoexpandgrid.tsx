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

import { motion } from "framer-motion"

type ResponsiveImageLike = { src?: string; srcSet?: string; alt?: string }

type Tile = {
    title: string
    body: string
    background: string
    image: ResponsiveImageLike
}

type Props = {
    tiles: Tile[]
    minTileWidth: number
    rowHeight: number
    gap: number
    radius: string
    border: boolean
    borderColor: string

    expandedColSpan: number
    expandedRowSpan: number
    collapseOnSecondClick: boolean

    titleColor: string
    bodyColor: string
    overlayStrength: number

    titleFont: any
    bodyFont: any
    style?: React.CSSProperties
}

/**
 * Instructions:
 * Create a responsive bento grid where tiles expand on click. Use layout transitions to animate the size change of the selected tile and the movement of surrounding tiles.
 */

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BentoExpandGrid(props: Props) {
    const {
        tiles,
        minTileWidth,
        rowHeight,
        gap,
        radius,
        border,
        borderColor,
        expandedColSpan,
        expandedRowSpan,
        collapseOnSecondClick,
        titleColor,
        bodyColor,
        overlayStrength,
        titleFont,
        bodyFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [selected, setSelected] = React.useState<number | null>(null)

    const fallbackImages = React.useMemo<ResponsiveImageLike[]>(
        () => [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
                srcSet: undefined,
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4 - Yellow",
                srcSet: undefined,
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3 - Orange",
                srcSet: undefined,
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2 - Purple",
                srcSet: undefined,
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
                srcSet: undefined,
            },
        ],
        []
    )

    const safeTiles = React.useMemo(() => {
        const base: Tile[] = Array.isArray(tiles) ? tiles : []
        if (base.length > 0) return base
        return [
            { title: "Analytics", body: "Realtime insights", background: "#FFFFFF", image: {} },
            { title: "Automations", body: "Workflows that scale", background: "#F5F5F5", image: {} },
            { title: "Design System", body: "Tokens + components", background: "#FFFFFF", image: {} },
            { title: "Security", body: "SSO and policies", background: "#F5F5F5", image: {} },
            { title: "Integrations", body: "Connect your stack", background: "#FFFFFF", image: {} },
            { title: "Performance", body: "Fast by default", background: "#F5F5F5", image: {} },
        ]
    }, [tiles])

    const handleActivate = React.useCallback(
        (index: number) => {
            React.startTransition(() => {
                setSelected((prev) => {
                    if (prev === index) return collapseOnSecondClick ? null : prev
                    return index
                })
            })
        },
        [collapseOnSecondClick]
    )

    const gridStyle = React.useMemo<React.CSSProperties>(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${Math.max(120, minTileWidth)}px, 1fr))`,
            gridAutoRows: `${Math.max(60, rowHeight)}px`,
            gap: Math.max(0, gap),
            alignContent: "stretch",
            justifyContent: "stretch",
            overflow: "hidden",
            ...style,
        }),
        [gap, minTileWidth, rowHeight, style]
    )

    const TileEl: any = isStatic ? "div" : motion.div

    return (
        <section style={gridStyle} aria-label="Expandable bento grid">
            {safeTiles.map((t, i) => {
                const isSelected = selected === i
                const colSpan = isSelected ? Math.max(1, expandedColSpan) : 1
                const rowSpan = isSelected ? Math.max(1, expandedRowSpan) : 1

                const fallback = fallbackImages[i % fallbackImages.length]
                const img: ResponsiveImageLike = t?.image && t.image.src ? t.image : fallback

                const tileBaseStyle: React.CSSProperties = {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: radius,
                    overflow: "hidden",
                    background: t?.background || "#FFFFFF",
                    border: border ? `1px solid ${borderColor}` : "none",
                    cursor: "pointer",
                    userSelect: "none",
                    outline: "none",
                    gridColumn: `span ${colSpan}`,
                    gridRow: `span ${rowSpan}`,
                    minWidth: 0,
                    transform: "translateZ(0)",
                }

                const contentStyle: React.CSSProperties = {
                    position: "absolute",
                    inset: 0,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    gap: 6,
                    zIndex: 2,
                }

                const overlayStyle: React.CSSProperties = {
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    background:
                        overlayStrength <= 0
                            ? "transparent"
                            : `linear-gradient(to top, rgba(0,0,0,${Math.min(
                                  0.85,
                                  Math.max(0, overlayStrength)
                              )}) 0%, rgba(0,0,0,0) 65%)`,
                    pointerEvents: "none",
                }

                const imageStyle: React.CSSProperties = {
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: 0,
                    pointerEvents: "none",
                }

                const motionProps = isStatic
                    ? {}
                    : {
                          layout: true,
                          transition: { type: "spring", stiffness: 420, damping: 38, mass: 0.9 },
                      }

                return (
                    <TileEl
                        key={i}
                        {...motionProps}
                        style={tileBaseStyle}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`${t?.title || "Tile"}${isSelected ? ", expanded" : ""}`}
                        onClick={() => handleActivate(i)}
                        onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                handleActivate(i)
                            }
                        }}
                    >
                        {img?.src ? (
                            <img
                                src={img.src}
                                srcSet={img.srcSet}
                                alt={img.alt || ""}
                                style={imageStyle}
                                draggable={false}
                            />
                        ) : null}

                        <div style={overlayStyle} />

                        <div style={contentStyle}>
                            <div
                                style={{
                                    color: titleColor,
                                    ...titleFont,
                                    lineHeight: titleFont?.lineHeight ?? "1.1em",
                                    letterSpacing: titleFont?.letterSpacing ?? "-0.02em",
                                }}
                            >
                                {t?.title || "Untitled"}
                            </div>
                            <div
                                style={{
                                    color: bodyColor,
                                    ...bodyFont,
                                    lineHeight: bodyFont?.lineHeight ?? "1.3em",
                                    letterSpacing: bodyFont?.letterSpacing ?? "-0.01em",
                                    opacity: 0.92,
                                }}
                            >
                                {t?.body || ""}
                            </div>
                        </div>
                    </TileEl>
                )
            })}
        </section>
    )
}

addPropertyControls(BentoExpandGrid, {
    tiles: {
        type: ControlType.Array,
        title: "Tiles",
        maxCount: 12,
        defaultValue: [
            { title: "Analytics", body: "Realtime insights", background: "#FFFFFF" },
            { title: "Automations", body: "Workflows that scale", background: "#F5F5F5" },
            { title: "Design System", body: "Tokens + components", background: "#FFFFFF" },
            { title: "Security", body: "SSO and policies", background: "#F5F5F5" },
            { title: "Integrations", body: "Connect your stack", background: "#FFFFFF" },
            { title: "Performance", body: "Fast by default", background: "#F5F5F5" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Tile title" },
                body: { type: ControlType.String, title: "Body", defaultValue: "Short description" },
                background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
    },

    minTileWidth: {
        type: ControlType.Number,
        title: "Min Tile W",
        defaultValue: 220,
        min: 120,
        max: 520,
        step: 10,
        unit: "px",
    },
    rowHeight: {
        type: ControlType.Number,
        title: "Row Height",
        defaultValue: 160,
        min: 80,
        max: 360,
        step: 10,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    border: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#EEEEEE",
        hidden: ({ border }) => !border,
    },

    expandedColSpan: {
        type: ControlType.Number,
        title: "Expand Cols",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
    },
    expandedRowSpan: {
        type: ControlType.Number,
        title: "Expand Rows",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
    },
    collapseOnSecondClick: {
        type: ControlType.Boolean,
        title: "Toggle Close",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "#FFFFFF",
    },
    overlayStrength: {
        type: ControlType.Number,
        title: "Overlay",
        defaultValue: 0.55,
        min: 0,
        max: 0.9,
        step: 0.05,
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})