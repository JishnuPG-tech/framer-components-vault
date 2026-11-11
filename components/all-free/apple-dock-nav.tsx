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

import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    AnimatePresence,
    useReducedMotion,
} from "framer-motion"
import { useRef, useMemo, memo } from "react"

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

// ------------------------------------------
// Squircle helper
// ------------------------------------------
// CSS corner-shape: squircle is supported in Chrome 133+ (2025).
// `border-radius` is kept as the fallback for all other browsers.
// Cast via `as any` because cornerShape isn't in React's CSSProperties yet.
function squircleRadius(r: number | string): React.CSSProperties {
    return {
        borderRadius: r,
        // @ts-ignore — future CSS property, progressive enhancement
        cornerShape: "squircle",
    } as any
}

// ------------------------------------------
// Types & Interfaces
// ------------------------------------------
interface HoverTextConfig {
    bgColor: string
    textColor: string
    size: number
    padding: number
}

interface DockItem {
    title: string
    image?: any // ResponsiveImage object or string URL
    link: string
}

interface Props {
    items: DockItem[]
    baseSize: number
    magnification: number
    distance: number
    gap: number
    borderRadius: number | string
    backgroundColor: string
    hoverText: HoverTextConfig
    trayPaddingX: number
    trayPaddingY: number
    trayBorderRadius: number
    onTap?: (event: any, item: DockItem) => void
    style?: React.CSSProperties
}

// ------------------------------------------
// Default Data
// ------------------------------------------
const DEFAULT_ITEMS: DockItem[] = [
    {
        title: "Affinity",
        image: "https://framerusercontent.com/assets/V5BKLcbfzRlTkbAdA5GRKt0qf0.svg",
        link: "https://framer.link/daniyalweb",
    },
    {
        title: "Figma",
        image: "https://framerusercontent.com/assets/hpC9jcWNkUqJrxvk42hUicZhblc.svg",
        link: "https://framer.link/daniyalweb",
    },
    {
        title: "Spotify",
        image: "https://framerusercontent.com/assets/npxAXuymNHQUSYbSpzQbQnVzlI.svg",
        link: "https://framer.link/daniyalweb",
    },
    {
        title: "Framer",
        image: "https://framerusercontent.com/assets/jk2OJ9MJkDjXWJM6suliwX3r0.svg",
        link: "https://framer.link/daniyalweb",
    },
    {
        title: "Arc",
        image: "https://framerusercontent.com/assets/xMEkzH0RJZexp6k6UFYviCTbKw.svg",
        link: "https://framer.link/daniyalweb",
    },
    {
        title: "Behance",
        image: "https://framerusercontent.com/images/lmRjG2ibwypt4SeDpLBOBS6hpc.svg?width=206&height=206",
        link: "https://framer.link/daniyalweb",
    },
    {
        title: "Notion",
        image: "https://framerusercontent.com/assets/Wi7yTG1s4w7tJxPhqGEt8sHIw.svg",
        link: "https://framer.link/daniyalweb",
    },
]

export default function AppleDock({
    items = DEFAULT_ITEMS,
    baseSize = 90,
    magnification = 1.6,
    distance = 250,
    gap = 15,
    borderRadius = 20,
    backgroundColor = "transparent",
    hoverText = {
        bgColor: "rgba(0, 0, 0, 0.7)",
        textColor: "rgba(255, 255, 255, 0.8)",
        size: 16,
        padding: 8,
    },
    trayPaddingX = 16,
    trayPaddingY = 12,
    trayBorderRadius = 24,
    onTap,
    style,
}: Props) {
    const mouseX = useMotionValue(Infinity)
    const isStatic = useIsStaticRenderer()

    const finalItems = useMemo(() => {
        return (items || []).map((item, index) => {
            if (
                !item.image &&
                DEFAULT_ITEMS[index] &&
                item.title === DEFAULT_ITEMS[index].title
            ) {
                return { ...item, image: DEFAULT_ITEMS[index].image }
            }
            return item
        })
    }, [items])

    // Fixed tray height — never grows on hover, only width expands
    const trayHeight = baseSize + trayPaddingY * 2

    return (
        <motion.nav
            aria-label="Application Dock"
            role="menubar"
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            style={{
                ...style,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                // Extra vertical room for magnification + tooltip
                height: baseSize * magnification + 20 + trayPaddingY * 2 + 30,
                paddingBottom: 10,
                width: "fit-content",
                margin: "0 auto",
            }}
        >
            {/*
             * Liquid-Glass Tray Wrapper
             * ─────────────────────────
             * Uses framer-motion `layout` so it smoothly resizes
             * as icons magnify/shrink via spring physics.
             * The backdrop-filter and glass background live on an
             * isolated absolute layer so CSS scale transforms from
             * framer-motion layout projection never break the rounded
             * clip of backdrop-filter in Chromium/WebKit.
             */}
            <motion.div
                layout
                transition={{
                    layout: {
                        type: "spring",
                        mass: 0.1,
                        stiffness: 150,
                        damping: 12,
                    },
                }}
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    height: trayHeight,
                    paddingLeft: trayPaddingX,
                    paddingRight: trayPaddingX,
                    paddingBottom: trayPaddingY,
                    ...squircleRadius(trayBorderRadius),
                    position: "relative",
                    overflow: "visible",
                }}
            >
                {/* Isolated Glass Surface (prevents rectangular backdrop-filter bleed) */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        ...squircleRadius(trayBorderRadius),
                        overflow: "hidden",
                        pointerEvents: "none",
                        zIndex: 0,
                        // ── Core glass fill ──────────────────────────────────────
                        background:
                            "linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)",
                        backdropFilter:
                            "blur(28px) saturate(190%) brightness(1.06)",
                        WebkitBackdropFilter:
                            "blur(28px) saturate(190%) brightness(1.06)",
                        // ── Border: top highlight + subtle outer ring ─────────────
                        border: "1px solid rgba(255, 255, 255, 0.28)",
                        // ── Shadows: outer depth + inner top specular ────────────
                        boxShadow: [
                            "0 0 0 0.5px rgba(0, 0, 0, 0.08)",
                            "0 12px 36px rgba(0, 0, 0, 0.22)",
                            "0 2px 8px rgba(0, 0, 0, 0.12)",
                            "inset 0 1.5px 0 rgba(255, 255, 255, 0.55)",
                            "inset 0 -1px 0 rgba(0, 0, 0, 0.08)",
                            "inset 0 0 24px rgba(255, 255, 255, 0.12)",
                        ].join(", "),
                        // Force clean GPU compositing & rounded clipping for backdrop-filter
                        transform: "translateZ(0)",
                        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                    }}
                >
                    {/* Subtle Top Specular Sheen (no mixBlendMode to avoid root backdrop rectangle bleed) */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            ...squircleRadius(trayBorderRadius),
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.00) 60%)",
                            boxShadow:
                                "inset 1.5px 1.5px 1px -1px rgba(255,255,255,0.7), inset -1.5px -1.5px 1px -1px rgba(255,255,255,0.18)",
                            pointerEvents: "none",
                        }}
                    />
                </div>

                <ul
                    style={{
                        display: "flex",
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                        gap: gap,
                        alignItems: "flex-end",
                        zIndex: 1,
                        position: "relative",
                    }}
                >
                    {finalItems.map((item, index) => (
                        <DockIcon
                            key={index}
                            mouseX={mouseX}
                            item={item}
                            baseSize={baseSize}
                            magnification={magnification}
                            distance={distance}
                            borderRadius={borderRadius}
                            backgroundColor={backgroundColor}
                            hoverText={hoverText}
                            isStatic={isStatic}
                            onTap={onTap}
                        />
                    ))}
                </ul>
            </motion.div>
        </motion.nav>
    )
}

const DockIcon = memo(function DockIcon({
    mouseX,
    item,
    baseSize,
    magnification,
    distance,
    borderRadius,
    backgroundColor,
    hoverText,
    isStatic,
    onTap,
}: {
    mouseX: any
    item: DockItem
    baseSize: number
    magnification: number
    distance: number
    borderRadius: number | string
    backgroundColor: string
    hoverText: HoverTextConfig
    isStatic: boolean
    onTap?: (event: any, item: DockItem) => void
}) {
    const ref = useRef<HTMLAnchorElement>(null)
    const shouldReduceMotion = useReducedMotion()

    const distanceCalc = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? {
            x: 0,
            width: 0,
        }
        return val - bounds.x - bounds.width / 2
    })

    const widthSync = useTransform(
        distanceCalc,
        [-distance, 0, distance],
        [baseSize, baseSize * magnification, baseSize]
    )

    const width = useSpring(widthSync, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    })

    const [isHovered, setHovered] = React.useState(false)
    const [isFocused, setFocused] = React.useState(false)

    const imageProp = item.image
    const imgSrc =
        typeof imageProp === "string" ? imageProp : imageProp?.src || null
    const imgSrcSet =
        typeof imageProp === "object" ? imageProp?.srcSet : undefined

    const finalWidth = isStatic || shouldReduceMotion ? baseSize : width

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            window.open(item.link, "_blank")
        }
    }

    return (
        <li role="none" style={{ display: "flex", alignItems: "flex-end" }}>
            <motion.a
                ref={ref}
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                aria-label={item.title}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onClick={(e) => onTap && onTap(e, item)}
                whileTap={{ scale: 0.85 }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: finalWidth,
                    height: finalWidth,
                    ...squircleRadius(borderRadius),
                    backgroundColor: backgroundColor,
                    cursor: "pointer",
                    display: "block",
                    position: "relative",
                    outline: isFocused ? "2px solid #0099ff" : "none",
                    outlineOffset: 4,
                    overflow: "visible",
                    willChange: "transform",
                    transform: "translateZ(0)",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <AnimatePresence>
                        {(isHovered || isFocused) && (
                            <motion.div
                                role="tooltip"
                                initial={{ opacity: 0, y: 0, x: "-50%" }}
                                animate={{ opacity: 1, y: -15, x: "-50%" }}
                                exit={{ opacity: 0, y: 0, x: "-50%" }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: "absolute",
                                    top: -(
                                        hoverText.size +
                                        hoverText.padding * 2
                                    ),
                                    left: "50%",
                                    background: hoverText.bgColor,
                                    color: hoverText.textColor,
                                    padding: hoverText.padding,
                                    borderRadius: "6px",
                                    fontSize: hoverText.size,
                                    whiteSpace: "nowrap",
                                    pointerEvents: "none",
                                    zIndex: 10,
                                    fontFamily: "sans-serif",
                                    backdropFilter: "blur(5px)",
                                    boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                                }}
                            >
                                {item.title}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            ...squircleRadius(borderRadius),
                            overflow: "hidden",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 2,
                        }}
                    >
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                srcSet={imgSrcSet}
                                alt={item.title}
                                style={{
                                    width: "101%",
                                    height: "101%",
                                    objectFit: "cover",
                                    display: "block",
                                    pointerEvents: "none",
                                    ...squircleRadius(borderRadius),
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    ...squircleRadius(borderRadius),
                                    backgroundColor: "rgba(0,0,0,0.05)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "24px",
                                    color: "#888",
                                    fontWeight: "600",
                                }}
                            >
                                {item.title?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                        )}
                    </div>
                </div>
            </motion.a>
        </li>
    )
})

addPropertyControls(AppleDock, {
    items: {
        type: ControlType.Array,
        title: "Dock Items",
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                },
                link: { type: ControlType.String, title: "Link" },
            },
        },
    },
    baseSize: {
        type: ControlType.Number,
        title: "Base Size",
        defaultValue: 90,
        min: 20,
        max: 200,
        unit: "px",
    },
    magnification: {
        type: ControlType.Number,
        title: "Scale",
        description: "Controls the magnification level when hovering.",
        defaultValue: 1.6,
        min: 1.1,
        max: 3,
        step: 0.1,
    },
    distance: {
        type: ControlType.Number,
        title: "Influence",
        defaultValue: 250,
        min: 50,
        max: 500,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 15,
        min: 0,
        max: 50,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: 20,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Icon Bg",
        description: "Visible behind transparent images.",
        defaultValue: "rgba(255, 255, 255, 0)",
    },
    trayPaddingX: {
        type: ControlType.Number,
        title: "Tray Padding X",
        defaultValue: 16,
        min: 0,
        max: 60,
        unit: "px",
    },
    trayPaddingY: {
        type: ControlType.Number,
        title: "Tray Padding Y",
        defaultValue: 12,
        min: 0,
        max: 40,
        unit: "px",
    },
    trayBorderRadius: {
        type: ControlType.Number,
        title: "Tray Radius",
        defaultValue: 24,
        min: 0,
        max: 100,
        unit: "px",
    },
    hoverText: {
        type: ControlType.Object,
        title: "Hover Text",
        controls: {
            bgColor: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "rgba(0, 0, 0, 0.7)",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "rgba(255, 255, 255, 0.8)",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 16,
                min: 8,
                max: 30,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 8,
                min: 0,
                max: 20,
            },
        },
    },
    onTap: {
        type: ControlType.EventHandler,
        description:
            "Explore [more components](https://dub.sh/daniyal-framer)\nMade by [Daniyal](https://dub.sh/daniyal-threads)",
    },
})
