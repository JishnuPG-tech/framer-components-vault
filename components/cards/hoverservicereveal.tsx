import { useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring } from "framer-motion"

interface ServiceImage {
    src: string
    srcSet?: string
    alt?: string
}

interface ServiceItem {
    label: string
    description: string
    link?: string
    image?: ServiceImage
}

type CardPosition = "center" | "follow" | "pinnedRight"

interface HoverServiceRevealProps {
    items: ServiceItem[]
    labelFont: CSSProperties
    descriptionFont: CSSProperties
    textColor: string
    dividerColor: string
    dividerWidth: number
    rowPaddingY: number
    gap: number
    stackBelow: number
    rowLineHeight: number
    rollGap: number
    dimInactive: boolean
    dimColor: string
    cardPosition: CardPosition
    cardWidth: number
    cardHeight: number
    cardRadius: number
    cardOffsetX: number
    cardOffsetY: number
    cardRightInset: number
    smoothing: number
    style?: CSSProperties
}

const defaultItems: ServiceItem[] = [
    {
        label: "Brand & Identity",
        description: "Strategy, Story Telling, Visual Systems & Campaigns",
        link: "",
        image: {
            src: "https://framerusercontent.com/images/9MTfLOTBn3rqNGFoKPeHQFeCoI.webp",
            alt: "Brand & Identity",
        },
    },
    {
        label: "Product & Experience",
        description: "UX/UI, Design Systems & Prototyping",
        link: "",
        image: {
            src: "https://framerusercontent.com/images/z3lQivGB0LI2udiC1H6F5ptDIs.webp",
            alt: "Product & Experience",
        },
    },
    {
        label: "Motion & Visual",
        description: "Animation, 3D & Brand Films",
        link: "",
        image: {
            src: "https://framerusercontent.com/images/zZYuXTFEUMNrGH7lOaOwGlNM.webp",
            alt: "Motion & Visual",
        },
    },
    {
        label: "Technology",
        description: "Design-to-code, Framer, Webflow & React",
        link: "",
        image: {
            src: "https://framerusercontent.com/images/CqjmEN2YZ79b7DWDp42Pmn5YsQo.webp",
            alt: "Technology",
        },
    },
    {
        label: "Research & Strategy",
        description: "Discovery, Testing & Validation",
        link: "",
        image: {
            src: "https://framerusercontent.com/images/XeKab4A4XQGcFbFcAe9efKvG5Aw.webp",
            alt: "Research & Strategy",
        },
    },
    {
        label: "Leadership",
        description: "Fractional Leadership, Team Building & Mentorship",
        link: "",
        image: {
            src: "https://framerusercontent.com/images/sS3dI1rG5cXEVlQN4xt87609fw.webp",
            alt: "Leadership",
        },
    },
]

const fallbackImages: string[] = defaultItems.map((item) => item.image!.src)

// Exact fonts from the original design.
const LABEL_FAMILY = '"Basement Grotesque", sans-serif'
const LABEL_FEATURES = '"blwf" 1, "cv09" 1, "cv03" 1, "cv04" 1, "cv11" 1'
const DESCRIPTION_FAMILY = '"Inter", "Inter Placeholder", sans-serif'
const BASEMENT_FONT_FACE = `@font-face{font-family:"Basement Grotesque";src:url("https://framerusercontent.com/assets/tptF1MIxUNxd9hxldXrA4Jhd7g.woff2") format("woff2");font-weight:900;font-style:normal;font-display:swap;}`

/**
 * Hover Service Reveal
 *
 * A vertical list of services. Hovering a row reveals an image card that
 * follows the cursor. Fully editable — add, remove and restyle rows.
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 480
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function HoverServiceReveal(props: HoverServiceRevealProps) {
    const {
        items = defaultItems,
        labelFont,
        descriptionFont,
        textColor = "#000000",
        dividerColor = "#232325",
        dividerWidth = 1,
        rowPaddingY = 24,
        gap = 24,
        stackBelow = 640,
        rowLineHeight = 34,
        rollGap = 29,
        dimInactive = false,
        dimColor = "#eeeeee",
        cardPosition = "center",
        cardWidth = 230,
        cardHeight = 320,
        cardRadius = 4,
        cardOffsetX = 24,
        cardOffsetY = 0,
        cardRightInset = 40,
        smoothing = 60,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState<number>(-1)
    const [containerWidth, setContainerWidth] = useState<number>(0)

    useEffect(() => {
        if (typeof window === "undefined") return
        const node = containerRef.current
        if (!node) return
        const update = () => setContainerWidth(node.clientWidth)
        update()
        const observer = new ResizeObserver(update)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    const isNarrow = containerWidth > 0 && containerWidth <= stackBelow
    const rowHeight = rowLineHeight + rowPaddingY * 2

    const rawX = useMotionValue(0)
    const rawY = useMotionValue(0)
    const clamped = Math.max(0, Math.min(100, smoothing))
    const springConfig = {
        stiffness: 700 - clamped * 6,
        damping: 40,
        mass: 1,
    }
    const springX = useSpring(rawX, springConfig)
    const springY = useSpring(rawY, springConfig)

    const list = items && items.length > 0 ? items : defaultItems
    const active = hovered >= 0 && hovered < list.length
    // ResponsiveImage controls ignore defaultValue inside arrays, so fall back
    // to the built-in images by index when an item has no image set.
    const imageFor = (item: ServiceItem, index: number) =>
        item.image?.src || fallbackImages[index % fallbackImages.length]

    function handleMove(event: React.MouseEvent<HTMLDivElement>) {
        const node = containerRef.current
        if (!node) return
        const rect = node.getBoundingClientRect()
        rawX.set(event.clientX - rect.left)
        rawY.set(event.clientY - rect.top)
    }

    // Card placement: centered/held by default; optional cursor-following modes.
    let cardPositionStyle: Record<string, unknown>
    if (cardPosition === "follow") {
        cardPositionStyle = {
            top: 0,
            left: 0,
            marginTop: -cardHeight / 2 + cardOffsetY,
            marginLeft: cardOffsetX,
            ...(isStatic
                ? { left: "50%", marginLeft: -cardWidth / 2 }
                : { x: springX, y: springY }),
        }
    } else if (cardPosition === "pinnedRight") {
        cardPositionStyle = {
            right: cardRightInset,
            top: isStatic ? "50%" : 0,
            marginTop: -cardHeight / 2 + cardOffsetY,
            ...(isStatic ? {} : { y: springY }),
        }
    } else {
        // center horizontally, follow the cursor vertically
        cardPositionStyle = {
            left: "50%",
            marginLeft: -cardWidth / 2 + cardOffsetX,
            marginTop: -cardHeight / 2 + cardOffsetY,
            ...(isStatic ? { top: "50%" } : { top: 0, y: springY }),
        }
    }

    // One line of the row: title (left) + description (right). Family falls
    // back to the brand fonts unless a different family is picked in the panel.
    const renderLine = (item: ServiceItem, color: string) => {
        const lf = labelFont ?? {}
        const df = descriptionFont ?? {}
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: isNarrow ? "column" : "row",
                    alignItems: "center",
                    justifyContent: isNarrow ? "center" : "space-between",
                    gap: isNarrow ? Math.min(gap, 8) : gap,
                    width: "100%",
                    height: isNarrow ? "auto" : rowLineHeight,
                }}
            >
                <span
                    style={{
                        ...lf,
                        fontFamily:
                            (lf as CSSProperties).fontFamily || LABEL_FAMILY,
                        fontFeatureSettings: LABEL_FEATURES,
                        color,
                        transition: "color 0.3s ease",
                        textAlign: isNarrow ? "center" : "left",
                    }}
                >
                    {item.label}
                </span>
                <span
                    style={{
                        ...df,
                        fontFamily:
                            (df as CSSProperties).fontFamily ||
                            DESCRIPTION_FAMILY,
                        color,
                        transition: "color 0.3s ease",
                        textAlign: isNarrow ? "center" : "right",
                    }}
                >
                    {item.description}
                </span>
            </div>
        )
    }

    // "Dim Others" fades every divider line uniformly (top line + all rows),
    // not just the row content, so no line stays full-strength on hover.
    const linesDimmed = dimInactive && active
    const dividerLine = (dim: boolean) => (
        <div
            style={{
                height: dividerWidth,
                width: "100%",
                backgroundColor: dim ? dimColor : dividerColor,
                transition: "background-color 0.3s ease",
            }}
        />
    )

    return (
        <div
            ref={containerRef}
            onMouseMove={isStatic ? undefined : handleMove}
            onMouseLeave={isStatic ? undefined : () => setHovered(-1)}
            style={{
                position: "relative",
                width: "100%",
                ...style,
            }}
        >
            <style>{BASEMENT_FONT_FACE}</style>
            {dividerLine(linesDimmed)}
            {list.map((item, index) => {
                const dimmed = dimInactive && active && hovered !== index
                const rowColor = dimmed ? dimColor : textColor
                const isHovered = !isStatic && hovered === index
                const Row = item.link ? "a" : "div"
                return (
                    <div key={index}>
                    <Row
                        {...(item.link ? { href: item.link } : {})}
                        onMouseEnter={isStatic ? undefined : () => setHovered(index)}
                        style={{
                            display: "block",
                            position: "relative",
                            height: isNarrow ? "auto" : rowHeight,
                            paddingTop: isNarrow ? rowPaddingY : 0,
                            paddingBottom: isNarrow ? rowPaddingY : 0,
                            // Clip the whole row so the title hides behind the divider line.
                            overflow: isNarrow ? "visible" : "hidden",
                            textDecoration: "none",
                            color: rowColor,
                        }}
                    >
                        {isNarrow ? (
                            renderLine(item, rowColor)
                        ) : (
                            /* Two identical copies; on hover the stack rolls up so the
                               top copy slides behind the row's top border line. */
                            <div
                                style={{
                                    position: "absolute",
                                    top: rowPaddingY,
                                    left: 0,
                                    right: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: rollGap,
                                    transform: isHovered
                                        ? `translateY(-${rowLineHeight + rollGap}px)`
                                        : "translateY(0px)",
                                    transition:
                                        "transform 0.5s cubic-bezier(0.33, 1.15, 0.68, 1)",
                                    willChange: "transform",
                                }}
                            >
                                {renderLine(item, rowColor)}
                                {renderLine(item, rowColor)}
                            </div>
                        )}
                    </Row>
                    {dividerLine(linesDimmed)}
                    </div>
                )
            })}

            {!isNarrow && (
            <motion.div
                aria-hidden
                initial={false}
                animate={{
                    opacity: isStatic || active ? 1 : 0,
                    scale: isStatic || active ? 1 : 0.85,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 60,
                    mass: 1,
                }}
                style={{
                    position: "absolute",
                    width: cardWidth,
                    height: cardHeight,
                    borderRadius: cardRadius,
                    overflow: "hidden",
                    pointerEvents: "none",
                    zIndex: 2,
                    ...cardPositionStyle,
                }}
            >
                {list.map((item, index) => (
                    <img
                        key={index}
                        src={imageFor(item, index)}
                        srcSet={item.image?.srcSet}
                        alt={item.image?.alt ?? item.label}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: (isStatic ? index === 0 : hovered === index)
                                ? 1
                                : 0,
                            transition: "opacity 0.25s ease",
                        }}
                    />
                ))}
            </motion.div>
            )}
        </div>
    )
}

addPropertyControls(HoverServiceReveal, {
    items: {
        type: ControlType.Array,
        title: "Services",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Service",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Short description",
                    displayTextArea: true,
                },
                link: { type: ControlType.Link, title: "Link" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
        defaultValue: defaultItems,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Black",
            letterSpacing: "0em",
            lineHeight: "1.4em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Regular",
            letterSpacing: "-0.03em",
            lineHeight: "1.4em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider",
        defaultValue: "#232325",
    },
    dividerWidth: {
        type: ControlType.Number,
        title: "Divider Width",
        defaultValue: 1,
        min: 0,
        max: 8,
        unit: "px",
    },
    rowPaddingY: {
        type: ControlType.Number,
        title: "Row Padding",
        defaultValue: 24,
        min: 0,
        max: 120,
        unit: "px",
    },
    rowLineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 34,
        min: 16,
        max: 120,
        unit: "px",
        description: "Height of the visible text line (the roll window).",
    },
    rollGap: {
        type: ControlType.Number,
        title: "Roll Gap",
        defaultValue: 29,
        min: 0,
        max: 120,
        unit: "px",
        description: "Gap the label travels through on the hover roll.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 24,
        min: 0,
        max: 120,
        unit: "px",
    },
    stackBelow: {
        type: ControlType.Number,
        title: "Stack Below",
        defaultValue: 640,
        min: 0,
        max: 1200,
        unit: "px",
        description: "Rows stack vertically when the component is narrower than this width.",
    },
    dimInactive: {
        type: ControlType.Boolean,
        title: "Dim Others",
        defaultValue: false,
    },
    dimColor: {
        type: ControlType.Color,
        title: "Dim Color",
        defaultValue: "#eeeeee",
        hidden: (props) => !props.dimInactive,
    },
    cardPosition: {
        type: ControlType.Enum,
        title: "Card Position",
        options: ["center", "follow", "pinnedRight"],
        optionTitles: ["Center", "Follow Cursor", "Pin Right"],
        defaultValue: "center",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 230,
        min: 80,
        max: 600,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 320,
        min: 80,
        max: 800,
        unit: "px",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 4,
        min: 0,
        max: 80,
        unit: "px",
    },
    cardOffsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 24,
        min: -400,
        max: 400,
        unit: "px",
        hidden: (props) => props.cardPosition === "pinnedRight",
    },
    cardOffsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 0,
        min: -400,
        max: 400,
        unit: "px",
    },
    cardRightInset: {
        type: ControlType.Number,
        title: "Right Inset",
        defaultValue: 40,
        min: 0,
        max: 600,
        unit: "px",
        hidden: (props) => props.cardPosition !== "pinnedRight",
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 60,
        min: 0,
        max: 100,
    },
})
