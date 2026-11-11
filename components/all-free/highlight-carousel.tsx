import { useState, useRef, useLayoutEffect } from "react"
import { motion } from "framer-motion"
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
 * LINEUP GALLERY
 * Light, restrained, Apple-style. Full-bleed cards with a circular "+" that
 * rotates into an "×". Opening a card slides a white info panel up from the
 * bottom while the neighbours quietly make room.
 *
 * Motion uses Apple's own web easing curve, cubic-bezier(0.32, 0.72, 0, 1):
 * fast off the mark, long settle, no bounce.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 620
 * @framerDisableUnlink
 */
export default function LineupGallery(props) {
    const {
        items = [],
        canvas = "#F5F5F7",
        ink = "#1D1D1F",
        muted = "#6E6E73",
        link = "#0071E3",
        padding = 28,
        gap = 18,
        radius = 28,
        focusRatio = 3.2,
        duration = 0.62,
        panelHeight = 38,
        panelColor = "#FFFFFF",
        panelOpacity = 92,
        panelBlur = 0,
        style,
    } = props

    const [open, setOpen] = useState(0)
    const [hovered, setHovered] = useState(-1)
    const [failed, setFailed] = useState({})
    const ref = useRef(null)
    const [width, setWidth] = useState(1100)

    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
        ro.observe(el)
        setWidth(el.getBoundingClientRect().width)
        return () => ro.disconnect()
    }, [])

    // Apple's curve. One transition object for every property, so the whole
    // card moves as a single object rather than a pile of parts.
    const ease = { duration, ease: [0.32, 0.72, 0, 1] }

    // Width an open card settles at. The panel text is pinned to this, so its
    // line breaks are decided once instead of being recalculated every frame
    // while the card grows. Re-wrapping text is the usual source of jitter in
    // an expanding card.
    const count = Math.max(items.length, 1)
    const track = Math.max(width - padding * 2 - gap * (count - 1), 0)
    const openWidth = (track * focusRatio) / (focusRatio + count - 1)

    const font =
        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Inter, system-ui, sans-serif'

    return (
        <div
            ref={ref}
            style={{
                ...style,
                width: style?.width ?? "100%",
                height: style?.height ?? "100%",
                minWidth: 360,
                minHeight: 340,
                background: canvas,
                borderRadius: radius + padding / 2,
                padding,
                boxSizing: "border-box",
                fontFamily: font,
                overflow: "hidden",
            }}
        >
            <div
                style={{ display: "flex", gap, width: "100%", height: "100%" }}
            >
                {items.map((item, i) => {
                    const isOpen = i === open
                    const isHovered = i === hovered && !isOpen

                    return (
                        <motion.div
                            key={i}
                            onClick={() => setOpen(i)}
                            onHoverStart={() => setHovered(i)}
                            onHoverEnd={() => setHovered(-1)}
                            initial={false}
                            animate={{ flexGrow: isOpen ? focusRatio : 1 }}
                            transition={ease}
                            style={{
                                position: "relative",
                                flexBasis: 0,
                                minWidth: 0,
                                height: "100%",
                                borderRadius: radius,
                                overflow: "hidden",
                                // Chrome drops the rounded clip for children
                                // that get their own compositing layer. A mask
                                // forces the corners to clip properly, so the
                                // sliding panel stays inside the card.
                                maskImage:
                                    "-webkit-radial-gradient(white, black)",
                                WebkitMaskImage:
                                    "-webkit-radial-gradient(white, black)",
                                isolation: "isolate",
                                cursor: isOpen ? "default" : "pointer",
                                background: item.tint ?? "#E8E8ED",
                                willChange: "flex-grow",
                                transform: "translateZ(0)",
                            }}
                        >
                            {/* Photo. Fixed width and centred, so a narrowing
                                card crops the image instead of squashing it. */}
                            <motion.img
                                src={
                                    typeof item.image === "string"
                                        ? item.image
                                        : item.image?.src
                                }
                                alt={item.title ?? ""}
                                draggable={false}
                                referrerPolicy="no-referrer"
                                onError={() =>
                                    setFailed((f) => ({ ...f, [i]: true }))
                                }
                                initial={false}
                                animate={{
                                    scale: isOpen ? 1 : isHovered ? 1.03 : 1.06,
                                }}
                                transition={ease}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "50%",
                                    x: "-50%",
                                    height: "100%",
                                    width: width,
                                    objectFit: "cover",
                                    userSelect: "none",
                                    opacity: failed[i] ? 0 : 1,
                                    willChange: "transform",
                                }}
                            />

                            {/* Legibility scrim for the closed label. Fades out
                                once the white panel takes over. */}
                            <motion.div
                                initial={false}
                                animate={{ opacity: isOpen ? 0 : 1 }}
                                transition={ease}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.08) 34%, rgba(0,0,0,0) 58%)",
                                    pointerEvents: "none",
                                }}
                            />

                            {/* CLOSED — vertical label, reads at any width */}
                            <motion.div
                                initial={false}
                                animate={{ opacity: isOpen ? 0 : 1 }}
                                transition={ease}
                                style={{
                                    position: "absolute",
                                    left: 22,
                                    bottom: 76,
                                    color: "#fff",
                                    pointerEvents: "none",
                                    writingMode: "vertical-rl",
                                    transform: "rotate(180deg)",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    letterSpacing: "-0.01em",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.title}
                            </motion.div>

                            {/* OPEN — white panel slides up from the bottom */}
                            <motion.div
                                initial={false}
                                animate={{ y: isOpen ? "0%" : "101%" }}
                                transition={ease}
                                style={{
                                    position: "absolute",
                                    // Overscanned by 1px on the three outer
                                    // edges. The card clips it back off, and
                                    // it kills the hairline of photo that
                                    // subpixel rounding leaves along the seam.
                                    left: -1,
                                    right: -1,
                                    bottom: -1,
                                    height: `calc(${panelHeight}% + 1px)`,
                                    borderBottomLeftRadius: radius + 1,
                                    borderBottomRightRadius: radius + 1,
                                    padding: "27px 31px 27px 31px",
                                    boxSizing: "border-box",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    // In a narrow closed card the subtitle
                                    // wraps to many lines and centred flex
                                    // content spills out of the panel box,
                                    // reappearing inside the card even though
                                    // the panel itself is parked below it.
                                    overflow: "hidden",
                                    pointerEvents: isOpen ? "auto" : "none",
                                    willChange: "transform",
                                }}
                            >
                                {/* Fill sits on its own layer so lowering its
                                    opacity reveals the photo underneath while
                                    the text above stays fully opaque. */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: panelColor,
                                        opacity: panelOpacity / 100,
                                        backdropFilter: panelBlur
                                            ? `blur(${panelBlur}px) saturate(1.6)`
                                            : undefined,
                                        WebkitBackdropFilter: panelBlur
                                            ? `blur(${panelBlur}px) saturate(1.6)`
                                            : undefined,
                                        borderBottomLeftRadius: radius + 1,
                                        borderBottomRightRadius: radius + 1,
                                    }}
                                />

                                <div
                                    style={{
                                        position: "relative",
                                        width: openWidth
                                            ? openWidth - 60
                                            : "100%",
                                        flexShrink: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            letterSpacing: "0.06em",
                                            textTransform: "uppercase",
                                            color: muted,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {item.kicker}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: 30,
                                            lineHeight: 1.1,
                                            fontWeight: 600,
                                            letterSpacing: "-0.028em",
                                            color: ink,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {item.title}
                                    </div>
                                    {item.subtitle ? (
                                        <div
                                            style={{
                                                marginTop: 8,
                                                fontSize: 15,
                                                lineHeight: 1.42,
                                                color: muted,
                                                maxWidth: 520,
                                            }}
                                        >
                                            {item.subtitle}
                                        </div>
                                    ) : null}
                                    {item.action ? (
                                        <a
                                            href={item.href || undefined}
                                            target={
                                                item.newTab
                                                    ? "_blank"
                                                    : undefined
                                            }
                                            rel={
                                                item.newTab
                                                    ? "noopener noreferrer"
                                                    : undefined
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                marginTop: 14,
                                                fontSize: 15,
                                                color: link,
                                                whiteSpace: "nowrap",
                                                textDecoration: "none",
                                                cursor: item.href
                                                    ? "pointer"
                                                    : "default",
                                                alignSelf: "flex-start",
                                            }}
                                        >
                                            {item.action}
                                            <span style={{ marginLeft: 4 }}>
                                                &rsaquo;
                                            </span>
                                        </a>
                                    ) : null}
                                </div>
                            </motion.div>

                            {/* The "+" that turns into an "×" */}
                            <motion.div
                                onClick={(e) => {
                                    if (!isOpen) return
                                    e.stopPropagation()
                                    setOpen(-1)
                                }}
                                initial={false}
                                animate={{ rotate: isOpen ? 45 : 0 }}
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                transition={ease}
                                style={{
                                    position: "absolute",
                                    right: 20,
                                    bottom: 20,
                                    width: 36,
                                    height: 36,
                                    borderRadius: 999,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: isOpen
                                        ? "rgba(0,0,0,0.06)"
                                        : "rgba(255,255,255,0.92)",
                                    boxShadow: isOpen
                                        ? "none"
                                        : "0 2px 10px rgba(0,0,0,0.16)",
                                    cursor: "pointer",
                                    zIndex: 2,
                                    willChange: "transform",
                                }}
                            >
                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={isOpen ? ink : "#1D1D1F"}
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                >
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * Preview artwork, generated as inline SVG data URIs.
 *
 * Remote image hosts are blocked by the Framer canvas CSP and are unreliable
 * in preview, which is why the defaults render as empty tints. Data URIs need
 * no network at all, so the demo always looks right. Replace these with real
 * uploaded photos through the Image control before publishing.
 */
const art = (base: string, top: string, glowA: string, glowB: string): string =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='1000' viewBox='0 0 1600 1000'>
<defs>
<linearGradient id='b' x1='0' y1='0' x2='0.3' y2='1'>
<stop offset='0' stop-color='${top}'/><stop offset='1' stop-color='${base}'/>
</linearGradient>
<radialGradient id='a' cx='0.24' cy='0.18' r='0.75'>
<stop offset='0' stop-color='${glowA}' stop-opacity='0.95'/>
<stop offset='1' stop-color='${glowA}' stop-opacity='0'/>
</radialGradient>
<radialGradient id='c' cx='0.82' cy='0.86' r='0.7'>
<stop offset='0' stop-color='${glowB}' stop-opacity='0.85'/>
<stop offset='1' stop-color='${glowB}' stop-opacity='0'/>
</radialGradient>
<filter id='n'>
<feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/>
<feColorMatrix type='saturate' values='0'/>
</filter>
</defs>
<rect width='1600' height='1000' fill='url(#b)'/>
<rect width='1600' height='1000' fill='url(#a)'/>
<rect width='1600' height='1000' fill='url(#c)'/>
<rect width='1600' height='1000' filter='url(#n)' opacity='0.07'/>
</svg>`
    )

// Copy and colours are matched to the five photos in ./images, so swapping
// the artwork for the real files is a straight drop-in.
const DEFAULT_ITEMS = [
    {
        image: art("#5E4A52", "#E4C3B0", "#FFD5B4", "#2E2A38"),
        tint: "#BFA9A2",
        kicker: "Zermatt",
        title: "First Light",
        subtitle:
            "The valley stays under cloud until noon. Up here it never does.",
        action: "Learn more",
    },
    {
        image: art("#2F4526", "#B9CE96", "#E8F0C8", "#16210F"),
        tint: "#9FB183",
        kicker: "Old Growth",
        title: "Tall Timber",
        subtitle: "Thirty metres of trunk before the first branch.",
        action: "Learn more",
    },
    {
        image: art("#43563C", "#BDD0DE", "#EAF2F6", "#232E20"),
        tint: "#9FB2A4",
        kicker: "Isle of Skye",
        title: "The Spill",
        subtitle: "Cloud pours over the ridge at dawn and burns off by ten.",
        action: "Learn more",
    },
    {
        image: art("#8A6A3E", "#F0C79A", "#FFE0B0", "#4A3A55"),
        tint: "#D2A47A",
        kicker: "Val d'Orcia",
        title: "Long Road",
        subtitle: "Cypress, gravel, and a sky that turns over in minutes.",
        action: "Learn more",
    },
    {
        image: art("#1B2440", "#6E7FA8", "#C9B4E0", "#0C1020"),
        tint: "#4A5A78",
        kicker: "After Dark",
        title: "Night Pass",
        subtitle: "The galaxy sits low over the ridge from August on.",
        action: "Learn more",
    },
]

LineupGallery.defaultProps = { items: DEFAULT_ITEMS }

addPropertyControls(LineupGallery, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        // Framer reads the control's defaultValue, not defaultProps, for arrays.
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                tint: {
                    type: ControlType.Color,
                    title: "Tint",
                    defaultValue: "#E8E8ED",
                },
                kicker: { type: ControlType.String, title: "Kicker" },
                title: { type: ControlType.String, title: "Title" },
                subtitle: { type: ControlType.String, title: "Subtitle" },
                action: { type: ControlType.String, title: "Link label" },
                href: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New tab",
                    defaultValue: true,
                    hidden: (p) => !p.href,
                },
            },
        },
    },
    canvas: {
        type: ControlType.Color,
        title: "Canvas",
        defaultValue: "#F5F5F7",
    },
    ink: { type: ControlType.Color, title: "Text", defaultValue: "#1D1D1F" },
    muted: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "#6E6E73",
    },
    link: { type: ControlType.Color, title: "Link", defaultValue: "#0071E3" },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 80,
        defaultValue: 28,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 48,
        defaultValue: 18,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        defaultValue: 28,
    },
    focusRatio: {
        type: ControlType.Number,
        title: "Focus",
        min: 1.5,
        max: 8,
        step: 0.1,
        defaultValue: 3.2,
        description: "How much wider the open card is",
    },
    panelHeight: {
        type: ControlType.Number,
        title: "Panel",
        min: 20,
        max: 70,
        step: 1,
        defaultValue: 38,
        unit: "%",
    },
    panelColor: {
        type: ControlType.Color,
        title: "Panel fill",
        defaultValue: "#FFFFFF",
    },
    panelOpacity: {
        type: ControlType.Number,
        title: "Panel opacity",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 92,
        unit: "%",
        description: "Drop it to let the photo read through the panel",
    },
    panelBlur: {
        type: ControlType.Number,
        title: "Panel blur",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 0,
        unit: "px",
        description: "Frosted glass over the photo. Pair with a lower opacity",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 1.6,
        step: 0.02,
        defaultValue: 0.62,
        unit: "s",
    },
})
