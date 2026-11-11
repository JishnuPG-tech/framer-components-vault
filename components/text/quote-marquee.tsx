import React, { useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Constants ─────────────────────────────────────────────────────────────────
const ANIM_NAME = "isaac-testimonial-ticker"

const AVATAR_PALETTE = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#EF4444",
    "#14B8A6",
    "#F97316",
    "#A855F7",
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface TestimonialItem {
    name: string
    company: string
    quote: string
    initials?: string
}

interface Props {
    testimonials?: TestimonialItem[]
    speed?: number
    containerWidth?: number
    cardWidth?: number
    gap?: number
    direction?: "left" | "right"
    pauseOnHover?: boolean
    cardBg?: string
    borderColor?: string
    textColor?: string
    mutedColor?: string
    accentColor?: string
}

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
    {
        name: "Sarah Chen",
        company: "Vercel",
        quote: "Incredible component. Saved us weeks of design work on our landing page.",
        initials: "SC",
    },
    {
        name: "Marcus Lee",
        company: "Linear",
        quote: "Clean, fast, zero dependencies. Exactly what our SaaS site needed.",
        initials: "ML",
    },
    {
        name: "Priya Sharma",
        company: "Notion",
        quote: "Conversion rate jumped 18% after adding this to our pricing section.",
        initials: "PS",
    },
    {
        name: "Jake Torres",
        company: "Loom",
        quote: "Best Framer component I've purchased. Worth every penny.",
        initials: "JT",
    },
    {
        name: "Emma Walsh",
        company: "Figma",
        quote: "Set up in under 5 minutes. The property panel is perfectly designed.",
        initials: "EW",
    },
    {
        name: "David Kim",
        company: "Stripe",
        quote: "Our landing page finally looks enterprise-ready. Highly recommend.",
        initials: "DK",
    },
]

// ── Helper ────────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .map((w) => w[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IsaacTestimonialTicker({
    testimonials,
    speed = 30,
    containerWidth = 800,
    cardWidth = 280,
    gap = 16,
    direction = "left",
    pauseOnHover = true,
    cardBg = "#FFFFFF",
    borderColor = "#E5E7EB",
    textColor = "#111827",
    mutedColor = "#6B7280",
    accentColor = "#6366F1",
}: Props) {
    const isStatic = useIsStaticRenderer()
    const [isPaused, setIsPaused] = useState(false)

    const items: TestimonialItem[] =
        testimonials && testimonials.length > 0
            ? testimonials
            : DEFAULT_TESTIMONIALS

    // Duplicate for seamless infinite loop — track moves -50% (= 1x items width)
    const doubled = [...items, ...items]

    return (
        <div
            style={{
                width: containerWidth,
                overflow: "hidden",
                boxSizing: "border-box",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            {/* Keyframe injected inline — safe in React, applied globally by browser */}
            {!isStatic && (
                <style>{`
                    @keyframes ${ANIM_NAME} {
                        from { transform: translateX(0); }
                        to   { transform: translateX(-50%); }
                    }
                `}</style>
            )}

            {/* Scrolling track */}
            <div
                onMouseEnter={
                    isStatic || !pauseOnHover
                        ? undefined
                        : () => setIsPaused(true)
                }
                onMouseLeave={
                    isStatic || !pauseOnHover
                        ? undefined
                        : () => setIsPaused(false)
                }
                style={{
                    display: "flex",
                    gap: gap,
                    width: "max-content",
                    animation: isStatic
                        ? "none"
                        : `${ANIM_NAME} ${speed}s linear infinite`,
                    animationDirection:
                        direction === "right" ? "reverse" : "normal",
                    animationPlayState:
                        !isStatic && isPaused ? "paused" : "running",
                    willChange: isStatic ? "auto" : "transform",
                }}
            >
                {doubled.map((item, i) => {
                    // Use source-item index so duplicates share the same avatar color
                    const srcIdx = i % items.length
                    const avatarBg =
                        AVATAR_PALETTE[srcIdx % AVATAR_PALETTE.length]
                    const initials =
                        item.initials && item.initials.trim()
                            ? item.initials.trim().slice(0, 2).toUpperCase()
                            : getInitials(item.name)

                    return (
                        <div
                            key={i}
                            style={{
                                width: cardWidth,
                                minWidth: cardWidth,
                                height: 168,
                                background: cardBg,
                                border: `1px solid ${borderColor}`,
                                borderRadius: "12px",
                                padding: "16px 18px",
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                flexShrink: 0,
                            }}
                        >
                            {/* Quote section */}
                            <div>
                                <div
                                    style={{
                                        fontSize: "28px",
                                        lineHeight: 1,
                                        color: accentColor,
                                        opacity: 0.35,
                                        marginBottom: "4px",
                                        fontFamily: "Georgia, serif",
                                        userSelect: "none",
                                    }}
                                >
                                    &ldquo;
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "13px",
                                        lineHeight: 1.55,
                                        color: textColor,
                                        display: "-webkit-box" as any,
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical" as any,
                                        overflow: "hidden",
                                    }}
                                >
                                    {item.quote}
                                </p>
                            </div>

                            {/* Author row */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        background: avatarBg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            color: "#FFFFFF",
                                            letterSpacing: "0.03em",
                                        }}
                                    >
                                        {initials}
                                    </span>
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: textColor,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {item.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            color: mutedColor,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {item.company}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Property Controls ─────────────────────────────────────────────────────────
addPropertyControls(IsaacTestimonialTicker, {
    containerWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 800,
        min: 400,
        max: 1400,
        step: 10,
        unit: "px",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 280,
        min: 200,
        max: 400,
        step: 10,
        unit: "px",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed (s)",
        defaultValue: 30,
        min: 10,
        max: 120,
        step: 5,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 8,
        max: 40,
        step: 4,
        unit: "px",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#6366F1",
    },
    cardBg: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E5E7EB",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111827",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Color",
        defaultValue: "#6B7280",
    },
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        defaultValue: [],
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Jane Smith",
                },
                company: {
                    type: ControlType.String,
                    title: "Company",
                    defaultValue: "Acme Inc",
                },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    defaultValue: "This component is amazing.",
                    displayTextArea: true,
                },
                initials: {
                    type: ControlType.String,
                    title: "Initials",
                    defaultValue: "",
                    placeholder: "Auto",
                },
            },
        },
    },
})
