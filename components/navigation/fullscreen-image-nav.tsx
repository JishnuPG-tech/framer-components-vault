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
    useReducedMotion,
    useSpring,
} from "framer-motion"

type Picture = { src?: string; srcSet?: string; alt?: string }
type Item = { label: string; image?: Picture; link?: string; newTab?: boolean }
type Props = {
    logoType?: "text" | "image"
    logo?: Picture
    logoWidth?: number
    logoHeight?: number
    logoFont?: React.CSSProperties
    logoLink?: string
    logoNewTab?: boolean
    headerHeight?: number
    mobilePadding?: number
    contentWidth?: number
    imageShare?: number
    imageRadius?: string | number
    linkGap?: number
    hoverOffset?: number
    brand?: string
    menuLabel?: string
    closeLabel?: string
    items?: Item[]
    background?: string
    foreground?: string
    muted?: string
    accent?: string
    border?: string
    font?: React.CSSProperties
    linkFont?: React.CSSProperties
    hoverFont?: React.CSSProperties
    padding?: string | number
    radius?: string | number
    canvasOpen?: boolean
    imageHeight?: number
    imageMotion?: number
    imageZoom?: number
    speed?: number
    style?: React.CSSProperties
}
const pictures = [
    "https://framerusercontent.com/images/0Ca16ZEePD1Tih9tV6JJ7bWwjQk.png",
    "https://framerusercontent.com/images/ljZ2hDCsAPLUPONFASSruOgMsM.png",
    "https://framerusercontent.com/images/ABGaEhB5bomm3za59rj4ZtfY.png",
    "https://framerusercontent.com/images/YJTVmT3hIuxGYyxY7HsjtNilYzQ.png",
]
const defaults: Item[] = [
    {
        label: "Work",
        image: {
            src: pictures[0],
            alt: "Vermilion ribbon sculpture in a cobalt courtyard",
        },
        link: "",
        newTab: false,
    },
    {
        label: "Studio",
        image: {
            src: pictures[1],
            alt: "Saffron passage through burgundy architecture",
        },
        link: "",
        newTab: false,
    },
    {
        label: "Journal",
        image: {
            src: pictures[3],
            alt: "Rose staircase curving around a cobalt wall in warm sunlight",
        },
        link: "",
        newTab: false,
    },
    {
        label: "Contact",
        image: {
            src: pictures[2],
            alt: "Emerald architectural wall beneath a lavender sky",
        },
        link: "",
        newTab: false,
    },
]
const serif: React.CSSProperties = {
    fontFamily: '"Instrument Serif", Georgia, serif',
    fontWeight: 400,
    fontSize: "128px",
    lineHeight: "1.08em",
    letterSpacing: "-.03em",
}
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]
const curtain: [number, number, number, number] = [0.76, 0, 0.24, 1]

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function FullscreenImageNav(props: Props) {
    const {
        logoType = "text",
        logo,
        logoWidth = 140,
        logoHeight = 32,
        logoFont = {},
        logoLink = "",
        logoNewTab = false,
        headerHeight = 80,
        mobilePadding = 24,
        contentWidth = 1600,
        imageShare = 50,
        imageRadius = "0px",
        linkGap = 4,
        hoverOffset = 14,
        brand = "Aperture",
        menuLabel = "Menu",
        closeLabel = "Close",
        items = defaults,
        background = "#F2EFE8",
        foreground = "#302925",
        muted = "#766C65",
        accent = "#622C36",
        border = "rgba(48,41,37,.18)",
        font = {},
        linkFont = serif,
        hoverFont = {},
        padding = "48px",
        radius = "0px",
        canvasOpen = true,
        imageHeight = 480,
        imageMotion = 20,
        imageZoom = 1.08,
        speed = 1.05,
        style,
    } = props
    const root = React.useRef<HTMLDivElement>(null),
        toggle = React.useRef<HTMLButtonElement>(null)
    const [opened, setOpened] = React.useState(false),
        [active, setActive] = React.useState(0)
    const [hovered, setHovered] = React.useState<number | null>(null)
    const [overImage, setOverImage] = React.useState(false),
        [width, setWidth] = React.useState(1200)
    const reduced = useReducedMotion(),
        staticRender = useIsStaticRenderer()
    const open = staticRender ? canvasOpen : opened,
        mobile = width < 640
    const still = reduced || staticRender,
        rate = Math.max(0.4, speed) / 1.05
    const shown = (items || []).filter(Boolean),
        index = Math.min(active, Math.max(0, shown.length - 1)),
        current = shown[index]
    const scope = "aperture-" + React.useId().replace(/:/g, ""),
        panelId = scope + "-panel"
    const targetX = useMotionValue(0),
        targetY = useMotionValue(0)
    const driftX = useSpring(targetX, { stiffness: 90, damping: 24, mass: 0.8 })
    const driftY = useSpring(targetY, { stiffness: 90, damping: 24, mass: 0.8 })
    const insets = String(padding).trim().split(/\s+/)
    const px = (value: string) =>
        /^\d+(\.\d+)?$/.test(value) ? value + "px" : value
    const left = mobile
        ? mobilePadding + "px"
        : px(insets[3] || insets[1] || insets[0])
    const right = mobile ? mobilePadding + "px" : px(insets[1] || insets[0])
    const size =
        "min(" +
        Math.min(
            parseFloat(String(linkFont.fontSize || 128)) || 128,
            width * (mobile ? 0.17 : 0.11)
        ) +
        "px, max(44px, calc((100dvh - " +
        (mobile ? 390 : 210) +
        "px) / " +
        Math.max(1, shown.length) * 1.26 +
        ")))"
    const time = (seconds: number) => (still ? 0 : seconds * rate)
    const enter = (delay: number, seconds = 0.85) => ({
        duration: time(open ? seconds : 0.24),
        delay: still ? 0 : open ? delay * rate : 0,
        ease,
    })
    const resetDrift = () => {
        targetX.set(0)
        targetY.set(0)
    }
    const close = React.useCallback(
        (restore = false) => {
            setOpened(false)
            if (restore) toggle.current?.focus({ preventScroll: true })
        },
        [targetX, targetY]
    )
    React.useEffect(() => {
        const el = root.current
        if (!el) return
        const update = () => setWidth(el.clientWidth)
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])
    React.useEffect(() => {
        if (!opened || staticRender) return
        const pointer = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) close()
        }
        const key = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()
                close(true)
            }
        }
        document.addEventListener("pointerdown", pointer)
        document.addEventListener("keydown", key)
        return () => {
            document.removeEventListener("pointerdown", pointer)
            document.removeEventListener("keydown", key)
        }
    }, [opened, staticRender, close])
    // Preload custom previews before a hover can reveal them.
    React.useEffect(() => {
        if (staticRender) return
        const preload = shown.map((item, i) => {
            const image = new Image()
            image.src =
                item.image?.src ||
                defaults.find((entry) => entry.label === item.label)?.image
                    ?.src ||
                pictures[i % pictures.length]
            if (item.image?.srcSet) image.srcset = item.image.srcSet
            return image
        })
        return () => {
            preload.length = 0
        }
    }, [items, staticRender])
    const follow = (i: number) => {
        setHovered(i)
        setActive(i)
    }
    const pointer = (event: React.PointerEvent<HTMLElement>) => {
        if (still || event.pointerType === "touch") return
        const bounds = event.currentTarget.getBoundingClientRect()
        const x =
            (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5
        const y =
            (event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5
        targetX.set(Math.max(-0.5, Math.min(0.5, x)) * imageMotion * 2)
        targetY.set(Math.max(-0.5, Math.min(0.5, y)) * imageMotion * 1.4)
    }
    const leave = () => {
        setHovered(null)
        resetDrift()
    }
    const engaged = hovered !== null || overImage

    return (
        <div
            ref={root}
            className={scope}
            data-aperture=""
            data-open={open ? "true" : "false"}
            style={{
                position: "relative",
                minWidth: 0,
                width: "100%",
                ...style,
            }}
            onBlur={(event) => {
                if (
                    event.relatedTarget &&
                    !event.currentTarget.contains(event.relatedTarget as Node)
                )
                    close()
            }}
        >
            <style>
                {[
                    "." + scope + " *{box-sizing:border-box}",
                    "." +
                        scope +
                        " a,." +
                        scope +
                        " button{-webkit-tap-highlight-color:transparent}",
                    "." +
                        scope +
                        " a:focus:not(:focus-visible),." +
                        scope +
                        " button:focus:not(:focus-visible){outline:none}",
                    "." +
                        scope +
                        " a:focus-visible,." +
                        scope +
                        " button:focus-visible{outline:2px solid " +
                        accent +
                        ";outline-offset:5px}",
                    "." + scope + " .ap-trigger{transition:color .45s cubic-bezier(.22,1,.36,1),opacity .45s cubic-bezier(.22,1,.36,1)}",
                    "." +
                        scope +
                        " .ap-trigger:is(:hover,:focus-visible){opacity:.72;color:" +
                        accent +
                        "!important}",
                    "@media(prefers-reduced-motion:reduce){." +
                        scope +
                        " *{transition:none!important}}",
                ].join("\n")}
            </style>
            <nav
                aria-label="Main navigation"
                style={{
                    color: foreground,
                    background,
                    borderRadius: radius,
                    overflow: "hidden",
                    fontFamily: "Manrope, Arial, sans-serif",
                    ...font,
                }}
            >
                <div
                    style={{
                        height: headerHeight,
                        maxWidth: contentWidth,
                        margin: "auto",
                        paddingLeft: left,
                        paddingRight: right,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 24,
                    }}
                >
                    <a
                        href={logoLink || undefined}
                        aria-label={brand || logo?.alt || "Home"}
                        target={logoNewTab ? "_blank" : undefined}
                        rel={logoNewTab ? "noopener noreferrer" : undefined}
                        onClick={() => {
                            if (open) close()
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            minWidth: 0,
                            maxWidth: "70%",
                            color: "inherit",
                            textDecoration: "none",
                            cursor: logoLink ? "pointer" : "default",
                        }}
                    >
                        {logoType === "image" && logo?.src ? (
                            <img
                                src={logo.src}
                                srcSet={logo.srcSet}
                                alt={logo.alt || brand}
                                draggable={false}
                                style={{
                                    width: logoWidth,
                                    height: Math.min(
                                        logoHeight,
                                        headerHeight - 16
                                    ),
                                    maxWidth: "100%",
                                    objectFit: "contain",
                                    objectPosition: "left center",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <span
                                style={{
                                    fontSize: 22,
                                    fontWeight: 500,
                                    letterSpacing: "-.055em",
                                    lineHeight: 1,
                                    ...logoFont,
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {brand}
                            </span>
                        )}
                    </a>
                    <button
                        ref={toggle}
                        className="ap-trigger"
                        type="button"
                        aria-label={
                            open ? "Close navigation" : "Open navigation"
                        }
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => {
                            if (opened) close()
                            else {
                                setHovered(null)
                                setOverImage(false)
                                resetDrift()
                                setOpened(true)
                            }
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 20,
                            minHeight: 44,
                            padding: 0,
                            border: 0,
                            background: "transparent",
                            font: "inherit",
                            color: "inherit",
                            cursor: "pointer",
                        }}
                    >
                        <span
                            aria-hidden
                            style={{
                                display: "grid",
                                overflow: "hidden",
                                fontSize: 12,
                                lineHeight: "18px",
                                textAlign: "right",
                            }}
                        >
                            <motion.span
                                initial={false}
                                animate={{
                                    y: open ? "-110%" : "0%",
                                    opacity: open ? 0 : 1,
                                }}
                                transition={{ duration: time(0.6), ease }}
                                style={{ gridArea: "1/1" }}
                            >
                                {menuLabel}
                            </motion.span>
                            <motion.span
                                initial={false}
                                animate={{
                                    y: open ? "0%" : "110%",
                                    opacity: open ? 1 : 0,
                                }}
                                transition={{ duration: time(0.6), ease }}
                                style={{ gridArea: "1/1" }}
                            >
                                {closeLabel}
                            </motion.span>
                        </span>
                        <span
                            aria-hidden
                            style={{
                                position: "relative",
                                width: 26,
                                height: 26,
                                display: "block",
                            }}
                        >
                            <motion.span
                                initial={false}
                                animate={{
                                    y: open ? 0 : -3,
                                    rotate: open ? 45 : 0,
                                }}
                                transition={{ duration: time(0.65), ease }}
                                style={{
                                    position: "absolute",
                                    top: 12,
                                    left: 2,
                                    width: 22,
                                    height: 1,
                                    background: "currentColor",
                                }}
                            />
                            <motion.span
                                initial={false}
                                animate={{
                                    y: open ? 0 : 3,
                                    rotate: open ? -45 : 0,
                                }}
                                transition={{ duration: time(0.65), ease }}
                                style={{
                                    position: "absolute",
                                    top: 12,
                                    left: 2,
                                    width: 22,
                                    height: 1,
                                    background: "currentColor",
                                }}
                            />
                        </span>
                    </button>
                </div>
                <motion.div
                    id={panelId}
                    aria-hidden={!open}
                    initial={false}
                    animate={{ height: open ? "auto" : 0 }}
                    transition={{
                        duration: time(1.05),
                        delay: 0,
                        ease: curtain,
                    }}
                    style={{
                        overflow: "hidden",
                        pointerEvents: open ? "auto" : "none",
                    }}
                >
                    <div
                        style={{
                            maxWidth: contentWidth,
                            margin: "auto",
                            paddingLeft: left,
                            paddingRight: right,
                            paddingBottom: mobile ? 24 : 48,
                            height: "calc(100dvh - " + headerHeight + "px)",
                            minHeight: 480,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <motion.div
                            initial={false}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={enter(0.08, 0.7)}
                            style={{
                                height: 1,
                                background: border,
                                transformOrigin: "left",
                            }}
                        />
                        <div
                            onPointerLeave={() => {
                                if (open) {
                                    leave()
                                    setOverImage(false)
                                }
                            }}
                            style={{
                                display: "grid",
                                gridTemplateColumns: mobile
                                    ? "minmax(0,1fr)"
                                    : "minmax(0," +
                                      (100 - imageShare) +
                                      "fr) minmax(0," +
                                      imageShare +
                                      "fr)",
                                gap: mobile ? 26 : Math.min(80, width * 0.055),
                                gridTemplateRows: mobile
                                    ? "auto minmax(120px, 1fr)"
                                    : "minmax(0, 1fr)",
                                minHeight: 0,
                                alignItems: "center",
                                flex: 1,
                                paddingTop: mobile ? 24 : 30,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: mobile ? 0 : linkGap,
                                    minWidth: 0,
                                    padding: "6px 0",
                                }}
                            >
                                {shown.map((item, i) => {
                                    const hot = hovered === i,
                                        chars = Array.from(item.label || "")
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                padding: "5px 8px",
                                                margin: "0 -8px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <motion.div
                                                initial={false}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={enter(
                                                    0.36 + i * 0.09,
                                                    0.82
                                                )}
                                            >
                                                <motion.a
                                                    aria-label={item.label}
                                                    href={
                                                        item.link || undefined
                                                    }
                                                    role={
                                                        item.link
                                                            ? undefined
                                                            : "link"
                                                    }
                                                    tabIndex={open ? 0 : -1}
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
                                                    onPointerEnter={(event) => {
                                                        if (
                                                            event.pointerType !==
                                                            "touch"
                                                        )
                                                            follow(i)
                                                    }}
                                                    onPointerMove={pointer}
                                                    onFocus={() => follow(i)}
                                                    onClick={(event) => {
                                                        if (!item.link) {
                                                            event.preventDefault()
                                                            setActive(i)
                                                        } else close()
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (
                                                            !item.link &&
                                                            event.key ===
                                                                "Enter"
                                                        ) {
                                                            event.preventDefault()
                                                            setActive(i)
                                                        }
                                                    }}
                                                    initial={false}
                                                    animate={{
                                                        x: hot
                                                            ? mobile
                                                                ? hoverOffset /
                                                                  2
                                                                : hoverOffset
                                                            : 0,
                                                        color: hot
                                                            ? accent
                                                            : hovered !== null
                                                              ? muted
                                                              : foreground,
                                                    }}
                                                    transition={{
                                                        duration: time(0.7),
                                                        ease,
                                                    }}
                                                    style={{
                                                        ...serif,
                                                        ...linkFont,
                                                        fontSize: size,
                                                        lineHeight: 1.08,
                                                        display: "block",
                                                        width: "100%",
                                                        maxWidth: "100%",
                                                        textDecoration: "none",
                                                        cursor: "pointer",
                                                        paddingRight: 18,
                                                    }}
                                                >
                                                    <span
                                                        aria-hidden
                                                        style={{
                                                            display: "grid",
                                                            overflow: "hidden",
                                                            padding:
                                                                "2px 12px 6px 0",
                                                            marginRight: -12,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                gridArea: "1/1",
                                                                whiteSpace:
                                                                    "pre",
                                                            }}
                                                        >
                                                            {chars.map(
                                                                (char, j) => (
                                                                    <motion.span
                                                                        key={j}
                                                                        initial={
                                                                            false
                                                                        }
                                                                        animate={{
                                                                            y: hot
                                                                                ? "-112%"
                                                                                : "0%",
                                                                            opacity:
                                                                                hot
                                                                                    ? 0
                                                                                    : 1,
                                                                        }}
                                                                        transition={{
                                                                            duration:
                                                                                time(
                                                                                    0.62
                                                                                ),
                                                                            delay: time(
                                                                                Math.min(
                                                                                    j,
                                                                                    14
                                                                                ) *
                                                                                    0.014
                                                                            ),
                                                                            ease,
                                                                        }}
                                                                        style={{
                                                                            display:
                                                                                "inline-block",
                                                                            whiteSpace:
                                                                                "pre",
                                                                        }}
                                                                    >
                                                                        {char}
                                                                    </motion.span>
                                                                )
                                                            )}
                                                        </span>
                                                        <span
                                                            style={{
                                                                gridArea: "1/1",
                                                                whiteSpace:
                                                                    "pre",
                                                                fontStyle:
                                                                    "italic",
                                                                ...hoverFont,
                                                                fontSize:
                                                                    "inherit",
                                                                lineHeight:
                                                                    "inherit",
                                                            }}
                                                        >
                                                            {chars.map(
                                                                (char, j) => (
                                                                    <motion.span
                                                                        key={j}
                                                                        initial={
                                                                            false
                                                                        }
                                                                        animate={{
                                                                            y: hot
                                                                                ? "0%"
                                                                                : "112%",
                                                                            opacity:
                                                                                hot
                                                                                    ? 1
                                                                                    : 0,
                                                                        }}
                                                                        transition={{
                                                                            duration:
                                                                                time(
                                                                                    0.72
                                                                                ),
                                                                            delay: time(
                                                                                Math.min(
                                                                                    j,
                                                                                    14
                                                                                ) *
                                                                                    0.014
                                                                            ),
                                                                            ease,
                                                                        }}
                                                                        style={{
                                                                            display:
                                                                                "inline-block",
                                                                            whiteSpace:
                                                                                "pre",
                                                                        }}
                                                                    >
                                                                        {char}
                                                                    </motion.span>
                                                                )
                                                            )}
                                                        </span>
                                                    </span>
                                                </motion.a>
                                            </motion.div>
                                        </div>
                                    )
                                })}
                            </div>
                            {current && (
                                <motion.a
                                    data-image-stage=""
                                    initial={false}
                                    aria-label={current.label + " — image"}
                                    href={current.link || undefined}
                                    role={current.link ? undefined : "link"}
                                    tabIndex={open ? 0 : -1}
                                    target={
                                        current.newTab ? "_blank" : undefined
                                    }
                                    rel={
                                        current.newTab
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    onFocus={() => follow(index)}
                                    onClick={(event) => {
                                        if (!current.link)
                                            event.preventDefault()
                                        else close()
                                    }}
                                    animate={{
                                        clipPath: "inset(0% 0% 0% 0%)",
                                        y: 0,
                                    }}
                                    transition={enter(0.32, 1)}
                                    onPointerEnter={(event) => {
                                        if (event.pointerType !== "touch") {
                                            setOverImage(true)
                                            setHovered(index)
                                        }
                                    }}
                                    onPointerMove={pointer}
                                    onPointerLeave={() => {
                                        setOverImage(false)
                                    }}
                                    style={{
                                        position: "relative",
                                        display: "block",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        width: "100%",
                                        height: "100%",
                                        minHeight: mobile ? 120 : 200,
                                        background: "#DCD6CB",
                                        borderRadius: imageRadius,
                                        isolation: "isolate",
                                    }}
                                >
                                    <motion.div
                                        style={{
                                            position: "absolute",
                                            inset: -Math.max(
                                                24,
                                                imageMotion + 4
                                            ),
                                            x: still ? 0 : driftX,
                                            y: still ? 0 : driftY,
                                        }}
                                    >
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: engaged ? imageZoom : 1,
                                            }}
                                            transition={{
                                                duration: time(1.1),
                                                ease,
                                            }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                            }}
                                        >
                                            {/* Persistent layers preserve their current opacity and velocity on reversal. */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    isolation: "isolate",
                                                    background: "#000",
                                                }}
                                            >
                                                {shown.map((item, i) =>
                                                    still &&
                                                    i !== index ? null : (
                                                        <motion.div
                                                            key={i}
                                                            aria-hidden={
                                                                i !== index
                                                            }
                                                            initial={false}
                                                            animate={{
                                                                opacity:
                                                                    i === index
                                                                        ? 1
                                                                        : 0,
                                                            }}
                                                            transition={
                                                                still
                                                                    ? {
                                                                          duration: 0,
                                                                      }
                                                                    : {
                                                                          type: "spring",
                                                                          stiffness:
                                                                              75 /
                                                                              (rate *
                                                                                  rate),
                                                                          damping:
                                                                              22 /
                                                                              rate,
                                                                          mass: 1,
                                                                          restDelta: 0.001,
                                                                          restSpeed: 0.001,
                                                                      }
                                                            }
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                inset: 0,
                                                                overflow:
                                                                    "hidden",
                                                                mixBlendMode:
                                                                    still
                                                                        ? "normal"
                                                                        : "plus-lighter",
                                                                pointerEvents:
                                                                    "none",
                                                                willChange:
                                                                    "opacity",
                                                            }}
                                                        >
                                                            <motion.img
                                                                src={
                                                                    item.image
                                                                        ?.src ||
                                                                    defaults.find(
                                                                        (
                                                                            entry
                                                                        ) =>
                                                                            entry.label ===
                                                                            item.label
                                                                    )?.image
                                                                        ?.src ||
                                                                    pictures[
                                                                        i %
                                                                            pictures.length
                                                                    ]
                                                                }
                                                                srcSet={
                                                                    item.image
                                                                        ?.srcSet
                                                                }
                                                                alt={
                                                                    i === index
                                                                        ? item
                                                                              .image
                                                                              ?.alt ||
                                                                          defaults.find(
                                                                              (
                                                                                  entry
                                                                              ) =>
                                                                                  entry.label ===
                                                                                  item.label
                                                                          )
                                                                              ?.image
                                                                              ?.alt ||
                                                                          ""
                                                                        : ""
                                                                }
                                                                draggable={
                                                                    false
                                                                }
                                                                sizes="(max-width: 639px) 100vw, 50vw"
                                                                initial={false}
                                                                animate={{
                                                                    y:
                                                                        i ===
                                                                            index ||
                                                                        still
                                                                            ? 0
                                                                            : 12,
                                                                    scale:
                                                                        i ===
                                                                            index ||
                                                                        still
                                                                            ? 1
                                                                            : 1.045,
                                                                }}
                                                                transition={
                                                                    still
                                                                        ? {
                                                                              duration: 0,
                                                                          }
                                                                        : {
                                                                              type: "spring",
                                                                              stiffness:
                                                                                  55 /
                                                                                  (rate *
                                                                                      rate),
                                                                              damping:
                                                                                  20 /
                                                                                  rate,
                                                                              mass: 1,
                                                                          }
                                                                }
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    display:
                                                                        "block",
                                                                    objectFit:
                                                                        "cover",
                                                                    willChange:
                                                                        "transform",
                                                                }}
                                                            />
                                                        </motion.div>
                                                    )
                                                )}
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                </motion.a>
                            )}
                        </div>
                    </div>
                </motion.div>
            </nav>
        </div>
    )
}

addPropertyControls(FullscreenImageNav, {
    logoType: {
        type: ControlType.Enum,
        title: "Logo Type",
        options: ["text", "image"],
        optionTitles: ["Text", "Image"],
        defaultValue: "text",
        displaySegmentedControl: true,
    },
    brand: {
        type: ControlType.String,
        title: "Brand",
        defaultValue: "Aperture",
    },
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
        hidden: (p) => p.logoType !== "image",
    },
    logoWidth: {
        type: ControlType.Number,
        title: "Logo Width",
        defaultValue: 140,
        min: 24,
        max: 400,
        unit: "px",
        hidden: (p) => p.logoType !== "image",
    },
    logoHeight: {
        type: ControlType.Number,
        title: "Logo Height",
        defaultValue: 32,
        min: 12,
        max: 100,
        unit: "px",
        hidden: (p) => p.logoType !== "image",
    },
    logoFont: {
        type: ControlType.Font,
        title: "Logo Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: (p) => p.logoType === "image",
    },
    logoLink: { type: ControlType.Link, title: "Logo Link", defaultValue: "" },
    logoNewTab: {
        type: ControlType.Boolean,
        title: "Logo New Tab",
        defaultValue: false,
    },
    menuLabel: {
        type: ControlType.String,
        title: "Menu Label",
        defaultValue: "Menu",
    },
    closeLabel: {
        type: ControlType.String,
        title: "Close Label",
        defaultValue: "Close",
    },
    items: {
        type: ControlType.Array,
        title: "Links",
        defaultValue: defaults,
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "New page",
                },
                image: { type: ControlType.ResponsiveImage, title: "Preview" },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Surface",
        defaultValue: "#F2EFE8",
    },
    foreground: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#302925",
    },
    muted: {
        type: ControlType.Color,
        title: "Inactive",
        defaultValue: "#766C65",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#622C36",
    },
    border: {
        type: ControlType.Color,
        title: "Rule",
        defaultValue: "rgba(48,41,37,.18)",
    },
    font: {
        type: ControlType.Font,
        title: "UI Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Regular" },
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "128px",
            lineHeight: "1.08em",
            letterSpacing: "-.03em",
        },
    },
    hoverFont: {
        type: ControlType.Font,
        title: "Hover Font",
        controls: "extended",
        defaultFontType: "serif",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "48px",
    },
    mobilePadding: {
        type: ControlType.Number,
        title: "Phone Padding",
        defaultValue: 24,
        min: 12,
        max: 48,
        unit: "px",
    },
    headerHeight: {
        type: ControlType.Number,
        title: "Header Height",
        defaultValue: 80,
        min: 64,
        max: 120,
        unit: "px",
    },
    contentWidth: {
        type: ControlType.Number,
        title: "Content Width",
        defaultValue: 1600,
        min: 800,
        max: 2400,
        unit: "px",
    },
    imageShare: {
        type: ControlType.Number,
        title: "Image Share",
        defaultValue: 50,
        min: 35,
        max: 60,
        unit: "%",
    },
    imageRadius: {
        type: ControlType.BorderRadius,
        title: "Image Radius",
        defaultValue: "0px",
    },
    linkGap: {
        type: ControlType.Number,
        title: "Link Gap",
        defaultValue: 4,
        min: 0,
        max: 24,
        unit: "px",
    },
    hoverOffset: {
        type: ControlType.Number,
        title: "Hover Shift",
        defaultValue: 14,
        min: 0,
        max: 32,
        unit: "px",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "0px",
    },
    imageMotion: {
        type: ControlType.Number,
        title: "Image Drift",
        defaultValue: 20,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    imageZoom: {
        type: ControlType.Number,
        title: "Image Zoom",
        defaultValue: 1.08,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    canvasOpen: {
        type: ControlType.Boolean,
        title: "Canvas Open",
        defaultValue: true,
        description:
            "Shows the open state in the editor. Preview starts closed.",
    },
    speed: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.05,
        min: 0.4,
        max: 1.8,
        step: 0.05,
        unit: "s",
        description:
            "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
