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

import { motion, useReducedMotion } from "framer-motion"

type ImageValue = { src?: string; srcSet?: string; alt?: string }
type Member = {
    name: string
    role: string
    note: string
    image?: ImageValue
    accent: string
    ink: string
    cta: string
    link: string
}

type Props = {
    members: Member[]
    minCardWidth: number
    gap: number
    aspectRatio: number
    radius: number
    defaultOpen: number
    duration: number
    imageScale: number
    surface: string
    labelColor: string
    showIndex: boolean
    showHint: boolean
    titleFont?: React.CSSProperties
    roleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    ctaFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_MEMBERS: Member[] = [
    {
        name: "Avery Carter",
        role: "CREATIVE DIRECTOR",
        note: "Making space for the unexpected, one thoughtful detail at a time.",
        image: {
            src: "https://framerusercontent.com/images/IT85szqNpMMfkTmc7eBNTTg3M.webp",
            alt: "Black female creative in a cobalt-blue coat with golden earrings, lit by magenta and violet",
        },
        accent: "#D9F76D",
        ink: "#171813",
        cta: "Explore profile",
        link: "",
    },
    {
        name: "Noah Rivera",
        role: "DESIGN DIRECTOR",
        note: "I believe the best ideas are the ones you can feel before you explain.",
        image: {
            src: "https://framerusercontent.com/images/JfeJyRxe1bubKVffu5elQogsG8.webp",
            alt: "Curly-haired male creative in teal and pink rim light with a dark sleeveless top",
        },
        accent: "#F6B6CF",
        ink: "#211621",
        cta: "Explore profile",
        link: "",
    },
    {
        name: "Maya Brooks",
        role: "DIGITAL DESIGNER",
        note: "Turning ideas into things people love to explore and remember.",
        image: {
            src: "https://framerusercontent.com/images/bYzosusvJLba6I1tDtT8INymnYA.webp",
            alt: "Fashion editorial portrait of a woman in golden saffron scarf against soft apricot",
        },
        accent: "#AFB9FF",
        ink: "#16182D",
        cta: "Explore profile",
        link: "",
    },
    {
        name: "Luca Bennett",
        role: "STRATEGY LEAD",
        note: "I turn ambitious ideas into clear digital experiences, from the first sketch to launch.",
        image: { src: "https://framerusercontent.com/images/bnBXubjYaogT8f08EhJJltcwuQo.webp", alt: "Creative in a translucent gray outer layer and futuristic metal visor with green smoke" },
        accent: "#F4C8A7",
        ink: "#251A18",
        cta: "Explore profile",
        link: "",
    },
    {
        name: "Jules Moreno",
        role: "BRAND DESIGNER",
        note: "From brand identity to interactive details, I love making ideas feel alive in Framer.",
        image: { src: "https://framerusercontent.com/images/sh8L4t8Ujbp4NHmM60yHsJKAk.webp", alt: "Female creative with braided hair, chrome jewelry and black-white couture on turquoise" },
        accent: "#E6C8F2",
        ink: "#292036",
        cta: "Explore profile",
        link: "",
    },
    {
        name: "Tess Ellis",
        role: "MOTION DESIGNER",
        note: "I make the details move with purpose, giving every interaction its own personality.",
        image: { src: "https://framerusercontent.com/images/obqdvLCDr5p5pSpRF4YYgk41mo8.webp", alt: "Shaved-headed creative in sculptural ivory collar against emerald green" },
        accent: "#BEE4DE",
        ink: "#16352D",
        cta: "Explore profile",
        link: "",
    },
]

const DEFAULT_TITLE_FONT: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 31,
    fontWeight: 600,
    lineHeight: "1.02em",
    letterSpacing: "-0.055em",
}
const DEFAULT_ROLE_FONT: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 10,
    fontWeight: 600,
    lineHeight: "1.3em",
    letterSpacing: "0.09em",
}
const DEFAULT_BODY_FONT: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 15,
    fontWeight: 400,
    lineHeight: "1.45em",
    letterSpacing: "-0.025em",
}
const DEFAULT_CTA_FONT: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 600,
    lineHeight: "1.2em",
    letterSpacing: "-0.015em",
}

function Arrow({ size = 19 }: { size?: number }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            style={{ flexShrink: 0, display: "block" }}
        >
            <path
                d="M5 12H19M12.5 5.5L19 12L12.5 18.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 900
 */
export default function PortraitPeelCards(props: Props) {
    const {
        members = DEFAULT_MEMBERS,
        minCardWidth = 310,
        gap = 14,
        aspectRatio = 0.78,
        radius = 12,
        defaultOpen = 1,
        duration = 0.65,
        imageScale = 1.05,
        surface = "#F5F4F0",
        labelColor = "#FFFFFF",
        showIndex = true,
        showHint = true,
        titleFont,
        roleFont,
        bodyFont,
        ctaFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const items = Array.isArray(members) && members.length ? members : DEFAULT_MEMBERS
    const clampOpen = (n: number) =>
        Number.isFinite(n) ? Math.max(-1, Math.min(items.length - 1, Math.round(n))) : -1
    const baseOpen = clampOpen(defaultOpen)
    const [open, setOpen] = React.useState(baseOpen)
    const [focused, setFocused] = React.useState(-1)
    const instanceId = React.useId()
    const canAnimate = !isStatic && !reducedMotion
    const time = canAnimate ? Math.max(0.15, duration) : 0

    React.useEffect(() => {
        setOpen(baseOpen)
    }, [baseOpen, items.length])

    const title = { ...DEFAULT_TITLE_FONT, ...titleFont }
    const role = { ...DEFAULT_ROLE_FONT, ...roleFont }
    const body = { ...DEFAULT_BODY_FONT, ...bodyFont }
    const action = { ...DEFAULT_CTA_FONT, ...ctaFont }

    return (
        <div
            style={{
                width: "100%",
                height: "auto",
                minWidth: 0,
                boxSizing: "border-box",
                background: surface,
                ...style,
            }}
        >
            <div
                role="group"
                aria-label="Meet the team"
                onKeyDown={(event) => {
                    if (event.key === "Escape" && !isStatic) setOpen(-1)
                }}
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, max(" +
                        Math.max(205, minCardWidth) +
                        "px, calc((100% - " +
                        Math.max(0, gap) * 2 +
                        "px) / 3))), 1fr))",
                    gap: Math.max(0, gap),
                    alignItems: "stretch",
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                {items.map((item, i) => {
                    const active = i === open
                    const link = (item.link || "").trim()
                    const hasLink = Boolean(link)
                    const number = String(i + 1).padStart(2, "0")
                    const descriptionId = instanceId + "-ppc-detail-" + i
                    const backContent = (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    alignItems: "center",
                                    color: item.ink,
                                    opacity: 0.72,
                                    ...role,
                                }}
                            >
                                <span>{item.role || "CREATIVE"}</span>
                                {showIndex && <span>{number}</span>}
                            </div>
                            <div style={{ flex: 1, minHeight: 8 }} />
                            <div
                                style={{
                                    color: item.ink,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 15,
                                }}
                            >
                                <div
                                    style={{
                                        ...title,
                                        fontSize: "clamp(24px, 2.85vw, 38px)",
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {item.name || "Your name"}
                                </div>
                                <div
                                    id={descriptionId}
                                    style={{
                                        ...body,
                                        maxWidth: 310,
                                        opacity: 0.78,
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {item.note}
                                </div>
                            </div>
                            {hasLink && <div
                                style={{
                                    marginTop: 24,
                                    paddingTop: 15,
                                    borderTop: "1px solid currentColor",
                                    color: item.ink,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12,
                                    ...action,
                                }}
                            >
                                <span>{item.cta || "Explore profile"}</span>
                                <Arrow size={20} />
                            </div>}
                        </>
                    )

                    return (
                        <div
                            key={i + "-" + item.name}
                            onPointerEnter={
                                isStatic ? undefined : (event) => {
                                    if (event.pointerType === "mouse") setOpen(i)
                                }
                            }
                            onPointerLeave={
                                isStatic ? undefined : (event) => {
                                    if (event.pointerType === "mouse") setOpen(baseOpen)
                                }
                            }
                            onClick={
                                !isStatic && active && !hasLink
                                    ? () => setOpen(-1)
                                    : undefined
                            }
                            style={{
                                position: "relative",
                                width: "100%",
                                minWidth: 0,
                                aspectRatio: String(Math.max(0.58, Math.min(1.25, aspectRatio))),
                                overflow: "hidden",

                                borderRadius: Math.max(0, radius),
                                backgroundColor: item.accent || "#D9F76D",
                                isolation: "isolate",
                                outline:
                                    focused === i ? "2px solid #161616" : "none",
                                outlineOffset: 3,
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            {hasLink ? (
                                <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={(item.cta || "Explore profile") + ": " + item.name}
                                    aria-describedby={descriptionId}
                                    tabIndex={active ? 0 : -1}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        textDecoration: "none",
                                        padding: "clamp(18px, 2.2vw, 28px)",
                                        boxSizing: "border-box",
                                        opacity: active ? 1 : 0,
                                        pointerEvents: active ? "auto" : "none",
                                        overflow: "hidden",
                                    }}
                                    onFocus={() => setFocused(i)}
                                    onBlur={() => setFocused(-1)}
                                >
                                    {backContent}
                                </a>
                            ) : (
                                <div
                                    aria-hidden={!active}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        padding: "clamp(18px, 2.2vw, 28px)",
                                        boxSizing: "border-box",
                                        opacity: active ? 1 : 0,
                                        pointerEvents: "none",
                                        overflow: "hidden",
                                    }}
                                >
                                    {backContent}
                                </div>
                            )}

                            <motion.button
                                type="button"
                                aria-label={"Reveal " + item.name + " – " + item.role}
                                aria-expanded={active}
                                aria-controls={descriptionId}
                                tabIndex={active ? -1 : 0}
                                onClick={
                                    isStatic
                                        ? undefined
                                        : () => setOpen(i)
                                }
                                onFocus={() => setFocused(i)}
                                onBlur={() => setFocused(-1)}
                                initial={false}
                                animate={{
                                    x: active ? "-102%" : "0%",
                                }}
                                transition={{
                                    duration: time,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{
                                    all: "unset",
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 3,
                                    width: "100%",
                                    height: "100%",
                                    display: "block",
                                    cursor: active ? "default" : "pointer",
                                    pointerEvents: active ? "none" : "auto",
                                    boxShadow: "none",
                                    willChange: canAnimate ? "transform" : "auto",
                                    overflow: "hidden",
                                }}
                            >
                                {item.image?.src ? (
                                    <motion.img
                                        src={item.image.src}
                                        srcSet={item.image.srcSet}
                                        alt={item.image.alt || item.name}
                                        draggable={false}
                                        animate={{ scale: active ? imageScale : 1 }}
                                        transition={{ duration: time }}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center",
                                            display: "block",
                                            userSelect: "none",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: item.accent,
                                        }}
                                    />
                                )}
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                            "linear-gradient(to bottom, rgba(0,0,0,.12) 0%, transparent 38%, rgba(0,0,0,.05) 60%, rgba(0,0,0,.7) 100%)",
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        padding: "clamp(18px, 2.2vw, 28px)",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        boxSizing: "border-box",
                                        color: labelColor,
                                        textAlign: "left",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 8,
                                            ...role,
                                            color: labelColor,
                                        }}
                                    >
                                        {showIndex ? <span>{number} / TEAM</span> : <span>TEAM</span>}
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                width: 31,
                                                height: 31,
                                                borderRadius: "50%",
                                                border: "1px solid rgba(255,255,255,.8)",
                                                display: "grid",
                                                placeItems: "center",
                                                fontSize: 17,
                                                fontWeight: 400,
                                                lineHeight: 1,
                                            }}
                                        >
                                            ↗
                                        </span>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                ...title,
                                                fontSize: "clamp(23px, 2.65vw, 36px)",
                                                color: labelColor,
                                                marginBottom: 9,
                                                overflowWrap: "anywhere",
                                            }}
                                        >
                                            {item.name || "Your name"}
                                        </div>
                                        <div
                                            style={{
                                                ...role,
                                                color: labelColor,
                                                opacity: 0.9,
                                            }}
                                        >
                                            {item.role}
                                        </div>
                                        {showHint && (
                                            <div
                                                style={{
                                                    marginTop: 18,
                                                    fontFamily: "Inter, Arial, sans-serif",
                                                    fontSize: 10,
                                                    fontWeight: 500,
                                                    letterSpacing: "0.04em",
                                                    opacity: 0.78,
                                                }}
                                            >
                                                HOVER OR TAP TO MEET →
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(PortraitPeelCards, {
    members: {
        type: ControlType.Array,
        title: "Team",
        maxCount: 12,
        defaultValue: DEFAULT_MEMBERS,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Alex" },
                role: { type: ControlType.String, title: "Role", defaultValue: "DESIGNER" },
                note: { type: ControlType.String, title: "Bio", displayTextArea: true, defaultValue: "" },
                image: { type: ControlType.ResponsiveImage, title: "Portrait" },
                accent: { type: ControlType.Color, title: "Reveal", defaultValue: "#D9F76D" },
                ink: { type: ControlType.Color, title: "Ink", defaultValue: "#171813" },
                cta: { type: ControlType.String, title: "CTA Label", defaultValue: "Explore profile" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
    },
    minCardWidth: { type: ControlType.Number, title: "Min Card", min: 205, max: 450, step: 5, defaultValue: 310, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 40, step: 1, defaultValue: 14, unit: "px" },
    aspectRatio: { type: ControlType.Number, title: "Card Ratio", min: 0.58, max: 1.25, step: 0.01, defaultValue: 0.78 },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 36, step: 1, defaultValue: 12, unit: "px" },
    defaultOpen: { type: ControlType.Number, title: "Open Card", min: -1, max: 11, step: 1, defaultValue: 1 },
    duration: { type: ControlType.Number, title: "Slide Speed", min: 0.15, max: 1.4, step: 0.05, defaultValue: 0.65, unit: "s" },
    imageScale: { type: ControlType.Number, title: "Image Zoom", min: 1, max: 1.2, step: 0.01, defaultValue: 1.05 },
    surface: { type: ControlType.Color, title: "Background", defaultValue: "#F5F4F0" },
    labelColor: { type: ControlType.Color, title: "Photo Text", defaultValue: "#FFFFFF" },
    showIndex: { type: ControlType.Boolean, title: "Numbers", defaultValue: true },
    showHint: { type: ControlType.Boolean, title: "Interaction Hint", defaultValue: true },
    titleFont: { type: ControlType.Font, title: "Name Font", controls: "extended" },
    roleFont: { type: ControlType.Font, title: "Role Font", controls: "extended" },
    bodyFont: { type: ControlType.Font, title: "Bio Font", controls: "extended" },
    ctaFont: { type: ControlType.Font, title: "CTA Font", controls: "extended" },
})
