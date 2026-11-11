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


/**
 * Reveal Gallery Stack for Framer
 * Interactive image stack that spreads on hover and focuses selected cards on click.
 *
 * How to use:
 * 1. Add 2–6 images from the Framer property panel.
 * 2. Place the component inside a section or project card.
 * 3. Adjust spread, rotation, radius, shadow, and captions.
 */

interface RevealGalleryStackProps {
    image1?: string
    image2?: string
    image3?: string
    image4?: string
    image5?: string
    image6?: string
    caption1: string
    caption2: string
    caption3: string
    caption4: string
    caption5: string
    caption6: string
    layout: "stack" | "fan" | "row"
    imageFit: "cover" | "contain"
    cardRadius: number
    cardShadow: number
    cardBorder: boolean
    borderColor: string
    backgroundColor: string
    stackOffset: number
    spreadAmount: number
    rotationAmount: number
    hoverScale: number
    focusScale: number
    animationSpeed: number
    showCaptions: boolean
    captionStyle: "pill" | "bottom" | "minimal"
    captionColor: string
    captionTextColor: string
    captionBlur: number
    clickToFocus: boolean
    dimInactive: boolean
    inactiveOpacity: number
    tiltOnHover: boolean
    heightMode: "fill" | "square" | "portrait" | "landscape"
}

const placeholderGradients = [
    "linear-gradient(135deg, #EEE7DD 0%, #C9D8CF 100%)",
    "linear-gradient(135deg, #DFE7F4 0%, #B8C2DA 100%)",
    "linear-gradient(135deg, #F4E1D2 0%, #D7A98E 100%)",
    "linear-gradient(135deg, #ECECEC 0%, #B8B8B8 100%)",
    "linear-gradient(135deg, #E7E1F4 0%, #BFA9DD 100%)",
    "linear-gradient(135deg, #EAF1E2 0%, #AFC49C 100%)",
]
//@framerDisableUnlink
export default function RevealGalleryStack(props: RevealGalleryStackProps) {
    const {
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        caption1,
        caption2,
        caption3,
        caption4,
        caption5,
        caption6,
        layout,
        imageFit,
        cardRadius,
        cardShadow,
        cardBorder,
        borderColor,
        backgroundColor,
        stackOffset,
        spreadAmount,
        rotationAmount,
        hoverScale,
        focusScale,
        animationSpeed,
        showCaptions,
        captionStyle,
        captionColor,
        captionTextColor,
        captionBlur,
        clickToFocus,
        dimInactive,
        inactiveOpacity,
        tiltOnHover,
        heightMode,
    } = props

    const [isHovering, setIsHovering] = React.useState(false)
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)
    const [pointer, setPointer] = React.useState({ x: 0, y: 0 })
    const wrapperRef = React.useRef<HTMLDivElement | null>(null)

    const images = [image1, image2, image3, image4, image5, image6]
    const captions = [
        caption1,
        caption2,
        caption3,
        caption4,
        caption5,
        caption6,
    ]

    const cards = images
        .map((src, index) => ({ src, caption: captions[index], index }))
        .filter((item) => item.src || item.index < 4)

    const total = cards.length
    const activeFocus = clickToFocus ? focusedIndex : null

    function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
        if (!wrapperRef.current) return
        const rect = wrapperRef.current.getBoundingClientRect()
        setPointer({
            x: (event.clientX - rect.left) / rect.width - 0.5,
            y: (event.clientY - rect.top) / rect.height - 0.5,
        })
    }

    function handleCardClick(index: number) {
        if (!clickToFocus) return
        setFocusedIndex((current) => (current === index ? null : index))
    }

    function getCardTransform(index: number) {
        const center = (total - 1) / 2
        const relative = index - center
        const isFocused = activeFocus === index
        const hasFocus = activeFocus !== null
        const spread = isHovering || hasFocus || layout === "row"
        const baseScale = isFocused ? focusScale : isHovering ? hoverScale : 1
        const tiltX = tiltOnHover && isHovering ? -pointer.y * 5 : 0
        const tiltY = tiltOnHover && isHovering ? pointer.x * 5 : 0

        if (layout === "row") {
            const x = relative * spreadAmount
            const y = isFocused ? -18 : 0
            const r = isHovering ? relative * rotationAmount * 0.25 : 0
            return `translate(-50%, -50%) translate(${x}px, ${y}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${r}deg) scale(${baseScale})`
        }

        if (layout === "fan") {
            const x = spread ? relative * spreadAmount : relative * stackOffset
            const y = spread
                ? Math.abs(relative) * 8
                : relative * stackOffset * 0.45
            const r =
                relative * (spread ? rotationAmount : rotationAmount * 0.55)
            const focusLift = isFocused ? -28 : 0
            return `translate(-50%, -50%) translate(${x}px, ${y + focusLift}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${r}deg) scale(${baseScale})`
        }

        const x = spread ? relative * spreadAmount : relative * stackOffset
        const y = spread ? 0 : relative * stackOffset * 0.72
        const r = spread
            ? relative * rotationAmount * 0.28
            : relative * rotationAmount
        const focusLift = isFocused ? -24 : 0
        return `translate(-50%, -50%) translate(${x}px, ${y + focusLift}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(${r}deg) scale(${baseScale})`
    }

    function getAspectRatio() {
        if (heightMode === "square") return "1 / 1"
        if (heightMode === "portrait") return "4 / 5"
        if (heightMode === "landscape") return "4 / 3"
        return undefined
    }

    const aspectRatio = getAspectRatio()

    return (
        <div
            ref={wrapperRef}
            onPointerEnter={() => setIsHovering(true)}
            onPointerLeave={() => {
                setIsHovering(false)
                setPointer({ x: 0, y: 0 })
            }}
            onPointerMove={handlePointerMove}
            style={{
                width: "100%",
                height: "100%",
                minHeight: 280,
                position: "relative",
                overflow: "hidden",
                background: backgroundColor,
                borderRadius: cardRadius + 10,
                perspective: 1200,
                transformStyle: "preserve-3d",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at 50% 45%, rgba(255,255,255,.42), rgba(255,255,255,0) 58%)",
                    pointerEvents: "none",
                    opacity: isHovering ? 1 : 0.72,
                    transition: `opacity ${animationSpeed}ms ease`,
                }}
            />

            {cards.map((card, visualIndex) => {
                const isFocused = activeFocus === visualIndex
                const hasFocus = activeFocus !== null
                const opacity =
                    dimInactive && hasFocus && !isFocused ? inactiveOpacity : 1
                const zIndex = isFocused ? 100 : 20 + visualIndex
                const width = layout === "row" ? "30%" : "48%"
                const maxWidth = layout === "row" ? 260 : 380

                return (
                    <div
                        key={card.index}
                        onClick={() => handleCardClick(visualIndex)}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width,
                            maxWidth,
                            aspectRatio,
                            height: aspectRatio ? undefined : "62%",
                            borderRadius: cardRadius,
                            overflow: "hidden",
                            cursor: clickToFocus ? "pointer" : "default",
                            transform: getCardTransform(visualIndex),
                            transition: `transform ${animationSpeed}ms cubic-bezier(.2,.8,.2,1), opacity ${animationSpeed}ms ease, filter ${animationSpeed}ms ease`,
                            zIndex,
                            opacity,
                            boxShadow: `0 ${18 + cardShadow * 40}px ${30 + cardShadow * 80}px rgba(0,0,0,${0.1 + cardShadow * 0.22})`,
                            border: cardBorder
                                ? `1px solid ${borderColor}`
                                : "none",
                            background:
                                placeholderGradients[
                                    visualIndex % placeholderGradients.length
                                ],
                            willChange: "transform, opacity",
                        }}
                    >
                        {card.src ? (
                            <img
                                src={card.src}
                                alt={
                                    card.caption ||
                                    `Gallery image ${visualIndex + 1}`
                                }
                                draggable={false}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: imageFit,
                                    display: "block",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                    transform:
                                        isHovering || isFocused
                                            ? "scale(1.035)"
                                            : "scale(1)",
                                    transition: `transform ${animationSpeed + 120}ms cubic-bezier(.2,.8,.2,1)`,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "rgba(255,255,255,.78)",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    letterSpacing: "0.02em",
                                }}
                            >
                                Image {visualIndex + 1}
                            </div>
                        )}

                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background:
                                    "linear-gradient(180deg, rgba(0,0,0,0) 46%, rgba(0,0,0,.28) 100%)",
                                opacity:
                                    showCaptions && captionStyle === "bottom"
                                        ? 1
                                        : 0,
                                pointerEvents: "none",
                            }}
                        />

                        {showCaptions && card.caption && (
                            <Caption
                                text={card.caption}
                                styleMode={captionStyle}
                                color={captionColor}
                                textColor={captionTextColor}
                                blur={captionBlur}
                                visible={
                                    isHovering ||
                                    isFocused ||
                                    captionStyle !== "minimal"
                                }
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function Caption({
    text,
    styleMode,
    color,
    textColor,
    blur,
    visible,
}: {
    text: string
    styleMode: "pill" | "bottom" | "minimal"
    color: string
    textColor: string
    blur: number
    visible: boolean
}) {
    const isBottom = styleMode === "bottom"
    const isPill = styleMode === "pill"

    return (
        <div
            style={{
                position: "absolute",
                left: isBottom ? 14 : isPill ? 12 : 14,
                right: isBottom ? 14 : undefined,
                bottom: isBottom ? 14 : isPill ? 12 : 14,
                padding: isPill || isBottom ? "8px 11px" : 0,
                borderRadius: isPill || isBottom ? 999 : 0,
                background: isPill || isBottom ? color : "transparent",
                color: textColor,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.01em",
                lineHeight: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                backdropFilter: isPill || isBottom ? `blur(${blur}px)` : "none",
                WebkitBackdropFilter:
                    isPill || isBottom ? `blur(${blur}px)` : "none",
                border:
                    isPill || isBottom
                        ? "1px solid rgba(255,255,255,.22)"
                        : "none",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 260ms ease, transform 260ms ease",
                pointerEvents: "none",
                maxWidth: "calc(100% - 28px)",
            }}
        >
            {text}
        </div>
    )
}

RevealGalleryStack.defaultProps = {
    image1: "",
    image2: "",
    image3: "",
    image4: "",
    image5: "",
    image6: "",
    caption1: "Concept 01",
    caption2: "Concept 02",
    caption3: "Concept 03",
    caption4: "Concept 04",
    caption5: "Concept 05",
    caption6: "Concept 06",
    layout: "stack",
    imageFit: "cover",
    cardRadius: 24,
    cardShadow: 0.42,
    cardBorder: true,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "#F4F0EA",
    stackOffset: 18,
    spreadAmount: 130,
    rotationAmount: 7,
    hoverScale: 1.02,
    focusScale: 1.08,
    animationSpeed: 520,
    showCaptions: true,
    captionStyle: "pill",
    captionColor: "rgba(255,255,255,0.26)",
    captionTextColor: "#FFFFFF",
    captionBlur: 16,
    clickToFocus: true,
    dimInactive: true,
    inactiveOpacity: 0.46,
    tiltOnHover: true,
    heightMode: "portrait",
}

addPropertyControls(RevealGalleryStack, {
    image1: { type: ControlType.Image, title: "Image 1" },
    image2: { type: ControlType.Image, title: "Image 2" },
    image3: { type: ControlType.Image, title: "Image 3" },
    image4: { type: ControlType.Image, title: "Image 4" },
    image5: { type: ControlType.Image, title: "Image 5" },
    image6: { type: ControlType.Image, title: "Image 6" },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        defaultValue: "stack",
        options: ["stack", "fan", "row"],
        optionTitles: ["Stack", "Fan", "Row"],
    },
    heightMode: {
        type: ControlType.Enum,
        title: "Ratio",
        defaultValue: "portrait",
        options: ["fill", "square", "portrait", "landscape"],
        optionTitles: ["Fill", "Square", "Portrait", "Landscape"],
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        defaultValue: "cover",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F4F0EA",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    cardShadow: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 0.42,
        min: 0,
        max: 1,
        step: 0.01,
    },
    cardBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255,255,255,0.45)",
        hidden: ({ cardBorder }) => !cardBorder,
    },
    stackOffset: {
        type: ControlType.Number,
        title: "Stack Offset",
        defaultValue: 18,
        min: -80,
        max: 80,
        step: 1,
        unit: "px",
    },
    spreadAmount: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 130,
        min: 20,
        max: 280,
        step: 1,
        unit: "px",
    },
    rotationAmount: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 7,
        min: -24,
        max: 24,
        step: 0.5,
        unit: "°",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.02,
        min: 0.8,
        max: 1.3,
        step: 0.01,
    },
    clickToFocus: {
        type: ControlType.Boolean,
        title: "Click Focus",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    focusScale: {
        type: ControlType.Number,
        title: "Focus Scale",
        defaultValue: 1.08,
        min: 0.8,
        max: 1.5,
        step: 0.01,
        hidden: ({ clickToFocus }) => !clickToFocus,
    },
    dimInactive: {
        type: ControlType.Boolean,
        title: "Dim Others",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ clickToFocus }) => !clickToFocus,
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Dim Opacity",
        defaultValue: 0.46,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ clickToFocus, dimInactive }) =>
            !clickToFocus || !dimInactive,
    },
    tiltOnHover: {
        type: ControlType.Boolean,
        title: "Mouse Tilt",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 520,
        min: 120,
        max: 1600,
        step: 20,
        unit: "ms",
    },
    showCaptions: {
        type: ControlType.Boolean,
        title: "Captions",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    captionStyle: {
        type: ControlType.Enum,
        title: "Caption Style",
        defaultValue: "pill",
        options: ["pill", "bottom", "minimal"],
        optionTitles: ["Pill", "Bottom", "Minimal"],
        hidden: ({ showCaptions }) => !showCaptions,
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Fill",
        defaultValue: "rgba(255,255,255,0.26)",
        hidden: ({ showCaptions, captionStyle }) =>
            !showCaptions || captionStyle === "minimal",
    },
    captionTextColor: {
        type: ControlType.Color,
        title: "Caption Text",
        defaultValue: "#FFFFFF",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    captionBlur: {
        type: ControlType.Number,
        title: "Caption Blur",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden: ({ showCaptions, captionStyle }) =>
            !showCaptions || captionStyle === "minimal",
    },
    caption1: {
        type: ControlType.String,
        title: "Caption 1",
        defaultValue: "Concept 01",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    caption2: {
        type: ControlType.String,
        title: "Caption 2",
        defaultValue: "Concept 02",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    caption3: {
        type: ControlType.String,
        title: "Caption 3",
        defaultValue: "Concept 03",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    caption4: {
        type: ControlType.String,
        title: "Caption 4",
        defaultValue: "Concept 04",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    caption5: {
        type: ControlType.String,
        title: "Caption 5",
        defaultValue: "Concept 05",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    caption6: {
        type: ControlType.String,
        title: "Caption 6",
        defaultValue: "Concept 06",
        hidden: ({ showCaptions }) => !showCaptions,
    },
})
