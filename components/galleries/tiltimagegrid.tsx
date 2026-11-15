// A grid of images where each item has a 3D tilt effect. The tilt direction should follow the mouse movement relative to the center of the individual tile.
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

import { motion, useInView, useMotionValue, useSpring } from "framer-motion"

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

type ImageItem = {
    image: ResponsiveImageLike
    link?: string
}

type ShadowPreset = "None" | "Soft" | "Medium" | "Strong"

const defaultImages: ImageItem[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/SOmhjGqh62lk4stfK1wO8I2mxs.png",
            alt: "Flower Man",
        },
        link: "",
    },
]

type Props = {
    images: ImageItem[]
    openInNewTab: boolean
    onTileClick?: () => void
    columns: number
    gap: number
    containerPadding: string
    itemPadding: string
    maxTilt: number
    perspective: number
    radius: string
    backgroundColor: string
    shadow: ShadowPreset
    scaleOnHover: number
    imageFit: "cover" | "contain"

    hoverLabelText: string
    hoverLabelFont: any
    hoverLabelTextColor: string
    hoverLabelBackground: string
    hoverLabelOffset: number
    hoverLabelRadius: string

    style?: React.CSSProperties
}

/**
 * Tilt Image Grid
 * @framerIntrinsicWidth 460
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TiltImageGrid(props: Props) {
    const {
        images = defaultImages,
        openInNewTab = false,
        onTileClick,
        columns = 1,
        gap = 12,
        containerPadding = "0px",
        itemPadding = "0px",
        maxTilt = 12,
        perspective = 900,
        radius = "16px",
        backgroundColor = "#FFFFFF",
        shadow = "Soft",
        scaleOnHover = 1.02,
        imageFit = "cover",
        hoverLabelText = "Click here",
        hoverLabelFont,
        hoverLabelTextColor = "#000000",
        hoverLabelBackground = "#FFFFFF",
        hoverLabelOffset = 14,
        hoverLabelRadius = "999px",
        style,
    } = props

    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail
    const hasImages = images && images.length > 0
    const effectiveImages = hasImages ? images : defaultImages
    const imagesToRender = isThumbnail ? effectiveImages.slice(0, 1) : effectiveImages
    const columnsToUse = isThumbnail ? 1 : columns
    const gapToUse = isThumbnail ? 0 : gap
    const containerPaddingToUse = isThumbnail ? "0px" : containerPadding

    const gridStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(1, Math.floor(columnsToUse))}, minmax(0, 1fr))`,
            gap: gapToUse,
            padding: containerPaddingToUse,
            margin: 0,
            backgroundColor,
            overflow: "visible",
            ...style,
        }),
        [backgroundColor, columnsToUse, containerPaddingToUse, gapToUse, style]
    )

    return (
        <div style={gridStyle} aria-label="Tilt image grid" role="grid">
            {imagesToRender.map((item, i) => (
                <Tile
                    key={`${item?.image?.src || "img"}-${i}`}
                    image={item?.image}
                    link={item?.link}
                    openInNewTab={openInNewTab}
                    onTileClick={onTileClick}
                    itemPadding={itemPadding}
                    maxTilt={maxTilt}
                    perspective={perspective}
                    radius={radius}
                    shadow={shadow}
                    scaleOnHover={scaleOnHover}
                    imageFit={imageFit}
                    hoverLabelText={isThumbnail ? "" : hoverLabelText}
                    hoverLabelFont={hoverLabelFont}
                    hoverLabelTextColor={hoverLabelTextColor}
                    hoverLabelBackground={hoverLabelBackground}
                    hoverLabelOffset={hoverLabelOffset}
                    hoverLabelRadius={hoverLabelRadius}
                />
            ))}
        </div>
    )
}

function Tile(props: {
    image: ResponsiveImageLike
    link?: string
    openInNewTab: boolean
    onTileClick?: () => void
    itemPadding: string
    maxTilt: number
    perspective: number
    radius: string
    shadow: ShadowPreset
    scaleOnHover: number
    imageFit: "cover" | "contain"

    hoverLabelText: string
    hoverLabelFont: any
    hoverLabelTextColor: string
    hoverLabelBackground: string
    hoverLabelOffset: number
    hoverLabelRadius: string
}) {
    const {
        image,
        link,
        openInNewTab,
        onTileClick,
        itemPadding,
        maxTilt,
        perspective,
        radius,
        shadow,
        scaleOnHover,
        imageFit,
        hoverLabelText,
        hoverLabelFont,
        hoverLabelTextColor,
        hoverLabelBackground,
        hoverLabelOffset,
        hoverLabelRadius,
    } = props
    const isStatic = useIsStaticRenderer()

    const rootRef = React.useRef<HTMLDivElement>(null)
    const isInView = useInView(rootRef, { margin: "150px 0px 150px 0px", amount: 0.15 })

    const rotateX = useMotionValue(0)
    const rotateY = useMotionValue(0)
    const scale = useMotionValue(1)

    const rotateXSpring = useSpring(rotateX, { stiffness: 260, damping: 26, mass: 0.6 })
    const rotateYSpring = useSpring(rotateY, { stiffness: 260, damping: 26, mass: 0.6 })
    const scaleSpring = useSpring(scale, { stiffness: 300, damping: 22, mass: 0.6 })

    const rafIdRef = React.useRef<number | null>(null)
    const lastEventRef = React.useRef<PointerEvent | null>(null)

    const labelX = useMotionValue(0)
    const labelY = useMotionValue(0)
    const [isHovering, setIsHovering] = React.useState(false)

    const shadowValue = React.useMemo(() => {
        switch (shadow) {
            case "None":
                return "none"
            case "Soft":
                return "0 8px 24px rgba(0,0,0,0.10)"
            case "Medium":
                return "0 12px 34px rgba(0,0,0,0.16)"
            case "Strong":
                return "0 18px 48px rgba(0,0,0,0.22)"
            default:
                return "0 8px 24px rgba(0,0,0,0.10)"
        }
    }, [shadow])

    const updateFromEvent = React.useCallback(() => {
        rafIdRef.current = null
        if (isStatic || !isInView) return
        if (!rootRef.current) return
        const e = lastEventRef.current
        if (!e) return

        const rect = rootRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2

        const dx = e.clientX - cx
        const dy = e.clientY - cy

        const nx = rect.width > 0 ? dx / (rect.width / 2) : 0
        const ny = rect.height > 0 ? dy / (rect.height / 2) : 0

        const clampedX = Math.max(-1, Math.min(1, nx))
        const clampedY = Math.max(-1, Math.min(1, ny))

        const newRotateY = clampedX * maxTilt
        const newRotateX = -clampedY * maxTilt

        rotateX.set(newRotateX)
        rotateY.set(newRotateY)

        const lx = e.clientX - rect.left + hoverLabelOffset
        const ly = e.clientY - rect.top + hoverLabelOffset
        labelX.set(lx)
        labelY.set(ly)
    }, [isInView, isStatic, maxTilt, rotateX, rotateY, hoverLabelOffset, labelX, labelY])

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic || !isInView) return
            if (typeof window === "undefined") return

            lastEventRef.current = e.nativeEvent

            if (rafIdRef.current != null) return
            rafIdRef.current = window.requestAnimationFrame(updateFromEvent)
        },
        [isInView, isStatic, updateFromEvent]
    )

    const reset = React.useCallback(() => {
        rotateX.set(0)
        rotateY.set(0)
    }, [rotateX, rotateY])

    const onPointerEnter = React.useCallback(() => {
        if (isStatic || !isInView) return
        scale.set(scaleOnHover)
        React.startTransition(() => setIsHovering(true))
    }, [isInView, isStatic, scale, scaleOnHover])

    const onPointerLeave = React.useCallback(() => {
        if (isStatic) return
        if (typeof window !== "undefined" && rafIdRef.current != null) {
            window.cancelAnimationFrame(rafIdRef.current)
        }
        rafIdRef.current = null
        lastEventRef.current = null
        scale.set(1)
        reset()
        React.startTransition(() => setIsHovering(false))
    }, [isStatic, reset, scale])

    React.useEffect(() => {
        return () => {
            if (typeof window !== "undefined" && rafIdRef.current != null) {
                window.cancelAnimationFrame(rafIdRef.current)
            }
            rafIdRef.current = null
        }
    }, [])

    const alt = image?.alt ?? ""
    const src = image?.src ?? ""
    const srcSet = image?.srcSet

    const isClickable = Boolean((link && link.length > 0) || onTileClick)
    const showCursorLabel = !isStatic && isHovering && (hoverLabelText || "").trim().length > 0

    const onClick = React.useCallback(() => {
        if (!isClickable) return
        onTileClick?.()

        const href = (link || "").trim()
        if (!href) return
        if (typeof window === "undefined") return

        if (openInNewTab) {
            window.open(href, "_blank", "noopener,noreferrer")
        } else {
            window.location.href = href
        }
    }, [isClickable, link, onTileClick, openInNewTab])

    const onKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (!isClickable) return
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
            }
        },
        [isClickable, onClick]
    )

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: radius,
                perspective: `${Math.max(1, perspective)}px`,
                overflow: "visible",
                cursor: isClickable ? "pointer" : "default",
            }}
            role="gridcell"
            aria-label={alt || "Image tile"}
            tabIndex={isClickable ? 0 : -1}
            onClick={isStatic ? undefined : onClick}
            onKeyDown={isStatic ? undefined : onKeyDown}
            onPointerMove={isStatic ? undefined : onPointerMove}
            onPointerEnter={isStatic ? undefined : onPointerEnter}
            onPointerLeave={isStatic ? undefined : onPointerLeave}
        >
            <motion.div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: radius,
                    overflow: "hidden",
                    boxShadow: shadowValue,
                    transformStyle: "preserve-3d",
                    rotateX: isStatic ? 0 : rotateXSpring,
                    rotateY: isStatic ? 0 : rotateYSpring,
                    scale: isStatic ? 1 : scaleSpring,
                    willChange: isStatic ? undefined : "transform",
                    background: "#F5F5F5",
                    padding: itemPadding,
                    boxSizing: "border-box",
                }}
            >
                {src ? (
                    <img
                        src={src}
                        srcSet={srcSet}
                        alt={alt}
                        draggable={false}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: imageFit,
                            userSelect: "none",
                            pointerEvents: "none",
                            transform: "translateZ(1px)",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            background: "#EEEEEE",
                        }}
                        aria-hidden="true"
                    />
                )}
            </motion.div>

            {showCursorLabel && (
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        x: labelX,
                        y: labelY,
                        translateZ: 2,
                        pointerEvents: "none",
                        zIndex: 10,
                        background: hoverLabelBackground,
                        color: hoverLabelTextColor,
                        borderRadius: hoverLabelRadius,
                        padding: "6px 10px",
                        whiteSpace: "nowrap",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        ...hoverLabelFont,
                    }}
                >
                    <span style={{ minWidth: "max-content" }}>{hoverLabelText}</span>
                </motion.div>
            )}
        </div>
    )
}

addPropertyControls(TiltImageGrid, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 24,
        defaultValue: defaultImages,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    onTileClick: {
        type: ControlType.EventHandler,
        title: "On Click",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 1,
        min: 1,
        max: 8,
        step: 1,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    containerPadding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px",
    },
    itemPadding: {
        type: ControlType.Padding,
        title: "Item Padding",
        defaultValue: "0px",
    },
    maxTilt: {
        type: ControlType.Number,
        title: "Max Tilt",
        defaultValue: 12,
        min: 0,
        max: 35,
        step: 1,
        unit: "deg",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 900,
        min: 200,
        max: 2000,
        step: 25,
        unit: "px",
    },
    scaleOnHover: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.02,
        min: 1,
        max: 1.15,
        step: 0.01,
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    shadow: {
        type: ControlType.Enum,
        title: "Shadow",
        options: ["None", "Soft", "Medium", "Strong"],
        defaultValue: "Soft",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    hoverLabelText: {
        type: ControlType.String,
        title: "Hover Label",
        defaultValue: "Click here",
    },
    hoverLabelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Semibold",
            fontSize: "12px",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    hoverLabelTextColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#000000",
    },
    hoverLabelBackground: {
        type: ControlType.Color,
        title: "Label BG",
        defaultValue: "#FFFFFF",
    },
    hoverLabelOffset: {
        type: ControlType.Number,
        title: "Label Offset",
        defaultValue: 14,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    hoverLabelRadius: {
        type: ControlType.BorderRadius,
        title: "Label Radius",
        defaultValue: "999px",
    },
})

TiltImageGrid.displayName = "TiltImageGrid"