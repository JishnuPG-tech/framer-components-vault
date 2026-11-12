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

import { ArrowUpRight } from "lucide-react"

// Validate markup before displaying it as an image. The icon is decorative;
// any extra meaning belongs in the corresponding link's accessible label.
function MenuIcon({
    svg,
    size,
    label,
}: {
    svg: string
    size: number
    label: string
}) {
    const [failedSvg, setFailedSvg] = React.useState("")
    const source = (svg || "").trim()
    const result = React.useMemo(() => {
        if (!source) return { url: "", error: "" }
        if (typeof DOMParser === "undefined")
            return {
                url: "",
                error: "SVG validation is unavailable in this rendering context.",
            }
        try {
            const doc = new DOMParser().parseFromString(source, "image/svg+xml")
            if (
                doc.querySelector("parsererror") ||
                doc.documentElement.localName.toLowerCase() !== "svg" ||
                doc.documentElement.namespaceURI !==
                    "http://www.w3.org/2000/svg"
            ) {
                return {
                    url: "",
                    error: "Invalid SVG markup. Paste a complete <svg> element including its xmlns attribute.",
                }
            }
            return {
                url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`,
                error: "",
            }
        } catch {
            return { url: "", error: "Could not parse SVG markup." }
        }
    }, [source])
    const error =
        result.error ||
        (source && failedSvg === source
            ? "SVG image could not be rendered."
            : "")
    React.useEffect(() => {
        if (error) console.warn(`Pull Menu — ${label} icon: ${error}`)
    }, [error, label])
    if (!result.url || error) {
        return (
            <span
                title={error || undefined}
                style={{ display: "grid", placeItems: "center" }}
            >
                <ArrowUpRight
                    size={size}
                    strokeWidth={2.25}
                    aria-hidden="true"
                />
            </span>
        )
    }
    return (
        <img
            src={result.url}
            alt=""
            width={size}
            height={size}
            style={{ display: "block", objectFit: "contain" }}
            onError={() => setFailedSvg(source)}
        />
    )
}

/**
 * PullMenu — paste into a new Framer Code Component.
 * The menu folds in 3D; the pull-tab silhouette is an SVG.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 480
 * @framerDisableUnlink
 */
export default function PullMenu(props: Props) {
    const {
        background = "#F4F3EF",
        ink = "#003B0B",
        accent = "#ADFF00",
        aboutLink = "/about",
        familyLink = "/our-family",
        newsLink = "/news",
        contactLink = "/contact",
        startOpen = false,
        duration = 0.6,
        aboutIcon = "",
        familyIcon = "",
        newsIcon = "",
        contactIcon = "",
        menuFont = {
            fontFamily: "Impact",
            fontSize: 48,
            fontWeight: 400,
            lineHeight: "1.16em",
            letterSpacing: "-0.02em",
        },
        tabFont = {
            fontFamily: "Impact",
            fontSize: 16,
            fontWeight: 400,
            lineHeight: "1em",
        },
        stagger = 0.08,
        iconSize = 15,
        iconCircleSize = 23,
        aboutIconMeaning = "",
        familyIconMeaning = "",
        newsIconMeaning = "",
        contactIconMeaning = "",
    } = props
    const isStatic = useIsStaticRenderer()
    const [openState, setOpen] = React.useState(startOpen)
    const open = isStatic ? startOpen : openState
    const motionDuration = isStatic ? 0 : duration
    const rootRef = React.useRef<HTMLDivElement>(null)
    const [frameHeight, setFrameHeight] = React.useState(480)
    React.useEffect(() => {
        const element = rootRef.current
        if (!element) return
        const observer = new ResizeObserver(([entry]) =>
            setFrameHeight(entry.contentRect.height)
        )
        observer.observe(element)
        return () => observer.disconnect()
    }, [])
    const rowHeight = Math.max(35, (frameHeight - 96) / 4)
    const links = [
        {
            label: "ABOUT",
            href: aboutLink,
            icon: aboutIcon,
            meaning: aboutIconMeaning,
        },
        {
            label: "OUR FAMILY",
            href: familyLink,
            icon: familyIcon,
            meaning: familyIconMeaning,
        },
        {
            label: "NEWS",
            href: newsLink,
            icon: newsIcon,
            meaning: newsIconMeaning,
        },
        {
            label: "CONTACT",
            href: contactLink,
            icon: contactIcon,
            meaning: contactIconMeaning,
        },
    ]
    const timing = `${motionDuration}s cubic-bezier(.22, 1, .36, 1)`

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                pointerEvents: "none",
                perspective: 1100,
            }}
        >
            <style>{`
                ${isStatic ? "" : ".pull-menu-link:hover .pull-menu-arrow { transform: rotate(45deg); }"}
                .pull-menu-link:focus-visible, .pull-menu-tab:focus-visible { outline: 3px solid ${accent}; outline-offset: 3px; }
                @media (prefers-reduced-motion: reduce) {
                    .pull-menu-grid, .pull-menu-paper, .pull-menu-arrow, .pull-menu-text { transition-duration: 0.01ms !important; transition-delay: 0ms !important; }
                }
            `}</style>
            <div
                style={{
                    width: "100%",
                    position: "absolute",
                    top: 0,
                    right: 0,
                    pointerEvents: "auto",
                }}
            >
                <div
                    className="pull-menu-grid"
                    aria-hidden={!open}
                    style={{
                        display: "grid",
                        gridTemplateRows: open ? "1fr" : "0fr",
                        transition: isStatic
                            ? "none"
                            : `grid-template-rows ${timing}`,
                    }}
                >
                    <div style={{ overflow: "hidden", minHeight: 0 }}>
                        <nav
                            className="pull-menu-paper"
                            aria-label="Main navigation"
                            style={{
                                background,
                                color: ink,
                                padding: "14px 14px 0",
                                borderRadius: "0 0 0 8px",
                                transformOrigin: "50% 0%",
                                transform: open
                                    ? "rotateX(0deg)"
                                    : "rotateX(-75deg)",
                                opacity: open ? 1 : 0,
                                transition: isStatic
                                    ? "none"
                                    : `transform ${timing}, opacity ${motionDuration * 0.65}s ease`,
                                backfaceVisibility: "hidden",
                            }}
                        >
                            {links.map((item, index) => (
                                <a
                                    key={item.label}
                                    className="pull-menu-link"
                                    href={item.href || "#"}
                                    aria-label={
                                        item.meaning.trim()
                                            ? `${item.label}: ${item.meaning.trim()}`
                                            : undefined
                                    }
                                    tabIndex={open ? 0 : -1}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        boxSizing: "border-box",
                                        height: rowHeight,
                                        borderTop: `3px dotted ${ink}`,
                                        paddingTop: 4,
                                        color: ink,
                                        textDecoration: "none",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <span
                                        style={{
                                            overflow: "hidden",
                                            display: "block",
                                            perspective: 600,
                                            minWidth: 0,
                                        }}
                                    >
                                        <span
                                            className="pull-menu-text"
                                            style={{
                                                display: "block",
                                                ...menuFont,
                                                transformOrigin: "50% 100%",
                                                transform: open
                                                    ? "translateY(0) rotateX(0deg)"
                                                    : "translateY(110%) rotateX(-55deg)",
                                                opacity: open ? 1 : 0,
                                                transition: isStatic
                                                    ? "none"
                                                    : `transform ${timing}, opacity ${motionDuration * 0.7}s ease`,
                                                transitionDelay:
                                                    !isStatic && open
                                                        ? `${0.08 + index * stagger}s`
                                                        : "0s",
                                                willChange:
                                                    "transform, opacity",
                                            }}
                                        >
                                            {item.label}
                                        </span>
                                    </span>
                                    <span
                                        className="pull-menu-arrow"
                                        aria-hidden="true"
                                        style={{
                                            marginTop: 10,
                                            flex: `0 0 ${iconCircleSize}px`,
                                            width: iconCircleSize,
                                            height: iconCircleSize,
                                            borderRadius: "50%",
                                            display: "grid",
                                            placeItems: "center",
                                            background: accent,
                                            color: ink,
                                            font: "bold 15px/1 Arial, sans-serif",
                                            opacity: open ? 1 : 0,
                                            transition: isStatic
                                                ? "none"
                                                : `transform 0.25s ease, opacity ${motionDuration * 0.6}s ease`,
                                            transitionDelay:
                                                !isStatic && open
                                                    ? `${0.1 + index * stagger}s`
                                                    : "0s",
                                        }}
                                    >
                                        <MenuIcon
                                            svg={item.icon}
                                            size={iconSize}
                                            label={item.label}
                                        />
                                    </span>
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>
                <button
                    className="pull-menu-tab"
                    type="button"
                    aria-expanded={open}
                    aria-label={open ? "Close menu" : "Open menu"}
                    onClick={() => {
                        if (!isStatic) setOpen(!open)
                    }}
                    style={{
                        display: "block",
                        position: "relative",
                        width: 128,
                        height: 82,
                        marginLeft: "auto",
                        padding: 0,
                        border: 0,
                        background: "transparent",
                        color: ink,
                        cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 128 82"
                        width="128"
                        height="82"
                        style={{
                            display: "block",
                            position: "absolute",
                            inset: 0,
                        }}
                    >
                        <path
                            fill={background}
                            d="M0 0H128V79C128 83 125 82 121 80L101 67C96 64 91 64 86 67L69 78C65 81 62 81 58 78L40 67C35 64 31 64 26 67L7 79C3 82 0 82 0 78Z"
                        />
                    </svg>
                    <span
                        style={{
                            position: "absolute",
                            top: 23,
                            left: 8,
                            right: 8,
                            borderTop: `2px dotted ${ink}`,
                        }}
                    />
                    <span
                        style={{
                            position: "absolute",
                            top: 34,
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            ...tabFont,
                        }}
                    >
                        PULL ME
                    </span>
                </button>
            </div>
        </div>
    )
}

type Props = {
    background: string
    ink: string
    accent: string
    aboutLink: string
    familyLink: string
    newsLink: string
    contactLink: string
    startOpen: boolean
    duration: number
    aboutIcon: string
    familyIcon: string
    newsIcon: string
    contactIcon: string
    menuFont: React.CSSProperties
    tabFont: React.CSSProperties
    stagger: number
    iconSize: number
    iconCircleSize: number
    aboutIconMeaning: string
    familyIconMeaning: string
    newsIconMeaning: string
    contactIconMeaning: string
}

addPropertyControls(PullMenu, {
    background: {
        type: ControlType.Color,
        title: "Paper",
        defaultValue: "#F4F3EF",
    },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#003B0B" },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#ADFF00",
    },
    aboutLink: {
        type: ControlType.String,
        title: "About URL",
        defaultValue: "/about",
    },
    familyLink: {
        type: ControlType.String,
        title: "Family URL",
        defaultValue: "/our-family",
    },
    newsLink: {
        type: ControlType.String,
        title: "News URL",
        defaultValue: "/news",
    },
    contactLink: {
        type: ControlType.String,
        title: "Contact URL",
        defaultValue: "/contact",
    },
    aboutIcon: {
        type: ControlType.String,
        title: "About SVG",
        defaultValue: "",
        displayTextArea: true,
        description: "Optional: paste complete SVG markup.",
    },
    familyIcon: {
        type: ControlType.String,
        title: "Family SVG",
        defaultValue: "",
        displayTextArea: true,
        description: "Optional: paste complete SVG markup.",
    },
    newsIcon: {
        type: ControlType.String,
        title: "News SVG",
        defaultValue: "",
        displayTextArea: true,
        description: "Optional: paste complete SVG markup.",
    },
    contactIcon: {
        type: ControlType.String,
        title: "Contact SVG",
        defaultValue: "",
        displayTextArea: true,
        description: "Optional: paste complete SVG markup.",
    },
    aboutIconMeaning: {
        type: ControlType.String,
        title: "About Icon Meaning",
        defaultValue: "",
        description:
            "Optional extra meaning for screen readers; the visible link text is included automatically.",
    },
    familyIconMeaning: {
        type: ControlType.String,
        title: "Family Icon Meaning",
        defaultValue: "",
        description: "Optional extra meaning for screen readers.",
    },
    newsIconMeaning: {
        type: ControlType.String,
        title: "News Icon Meaning",
        defaultValue: "",
        description: "Optional extra meaning for screen readers.",
    },
    contactIconMeaning: {
        type: ControlType.String,
        title: "Contact Icon Meaning",
        defaultValue: "",
        description: "Optional extra meaning for screen readers.",
    },
    menuFont: {
        type: ControlType.Font,
        title: "Menu Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Impact",
            fontSize: 48,
            fontWeight: 400,
            lineHeight: "1.16em",
            letterSpacing: "-0.02em",
        },
    },
    tabFont: {
        type: ControlType.Font,
        title: "Tab Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Impact",
            fontSize: 16,
            fontWeight: 400,
            lineHeight: "1em",
        },
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 15,
        min: 6,
        max: 80,
        step: 1,
        unit: "px",
    },
    iconCircleSize: {
        type: ControlType.Number,
        title: "Icon Circle",
        defaultValue: 23,
        min: 10,
        max: 100,
        step: 1,
        unit: "px",
    },
    stagger: {
        type: ControlType.Number,
        title: "Text Stagger",
        defaultValue: 0.08,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    startOpen: {
        type: ControlType.Boolean,
        title: "Start Open",
        defaultValue: false,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },
})
