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


type Testimonial = {
    quote: string

    name: string

    role: string

    image: string
}

type Props = {
    testimonials: Testimonial[]

    accentColor: string

    backgroundColor: string

    reelColor: string

    cardColor: string

    textColor: string

    mutedColor: string

    borderColor: string

    shadowColor: string

    quoteFont: any

    detailsFont: any

    cardWidth: number

    cardHeight: number

    autoHeight: boolean

    cardPadding: number

    cardRadius: number

    reelSize: number

    photoSize: number

    autoRotate: boolean

    interval: number

    animationSpeed: number
}

export default function RetroTestimonialReel(props: Props) {
    const {
        testimonials,

        accentColor,

        backgroundColor,

        reelColor,

        cardColor,

        textColor,

        mutedColor,

        borderColor,

        shadowColor,

        quoteFont,

        detailsFont,

        cardWidth,

        cardHeight,

        autoHeight,

        cardPadding,

        cardRadius,

        reelSize,

        photoSize,

        autoRotate,

        interval,

        animationSpeed,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const [active, setActive] = React.useState(0)

    const [isHovering, setIsHovering] = React.useState(false)

    // Exactly 6 testimonials

    const items = testimonials.slice(0, 6)

    const count = items.length

    React.useEffect(() => {
        if (isStaticRenderer || !autoRotate || isHovering || count < 2) return

        const timer = setInterval(() => {
            setActive((current) => (current + 1) % count)
        }, interval)

        return () => clearInterval(timer)
    }, [isStaticRenderer, autoRotate, isHovering, interval, count])

    React.useEffect(() => {
        if (active >= count) {
            setActive(0)
        }
    }, [active, count])

    if (count === 0) {
        return (
            <div
                style={{
                    width: "100%",

                    height: "100%",

                    minHeight: 400,

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    fontFamily: "Inter, sans-serif",

                    color: mutedColor,

                    background: backgroundColor,
                }}
            >
                Add testimonials to get started.
            </div>
        )
    }

    const current = items[active]

    const next = () => {
        setActive((value) => (value + 1) % count)
    }

    const previous = () => {
        setActive((value) => (value - 1 + count) % count)
    }

    const reelRotation = active * -(360 / count)

    const safeCardWidth = Math.max(300, Math.min(cardWidth, 600))

    const safeCardHeight = Math.max(300, Math.min(cardHeight, 700))

    const safePadding = Math.max(20, Math.min(cardPadding, 64))

    const safeRadius = Math.max(0, Math.min(cardRadius, 48))

    const safeReelSize = Math.max(420, Math.min(reelSize, 760))

    const safePhotoSize = Math.max(70, Math.min(photoSize, 190))

    return (
        <div
            style={{
                width: "100%",

                height: "100%",

                minHeight: 620,

                position: "relative",

                overflow: "hidden",

                background: backgroundColor,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                boxSizing: "border-box",

                padding: 24,

                fontFamily:
                    "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Paper texture */}

            <div
                style={{
                    position: "absolute",

                    inset: 0,

                    opacity: 0.035,

                    pointerEvents: "none",

                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, #000 0.65px, transparent 0.65px)",

                    backgroundSize: "6px 6px",
                }}
            />

            {/* Top label */}

            <div
                style={{
                    position: "absolute",

                    top: 24,

                    left: 28,

                    fontSize: 10,

                    letterSpacing: "0.15em",

                    textTransform: "uppercase",

                    color: mutedColor,

                    fontWeight: 600,

                    zIndex: 20,
                }}
            >
                STORIES / 06
            </div>

            {/* Top right */}

            <div
                style={{
                    position: "absolute",

                    top: 25,

                    right: 28,

                    width: 28,

                    height: 28,

                    borderRadius: "50%",

                    border: `1px solid ${borderColor}`,

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    color: mutedColor,

                    fontSize: 10,

                    zIndex: 20,
                }}
            >
                06
            </div>

            {/* ROTATING REEL */}

            <div
                style={{
                    position: "absolute",

                    width: `min(${safeReelSize}px, 88vw)`,

                    height: `min(${safeReelSize}px, 88vw)`,

                    maxWidth: "88vw",

                    maxHeight: "88vw",

                    borderRadius: "50%",

                    background: reelColor,

                    border: `1px solid ${borderColor}`,

                    boxShadow: `

                        0 35px 90px ${shadowColor},

                        inset 0 0 0 12px rgba(0,0,0,0.025)

                    `,

                    transform: `rotate(${reelRotation}deg)`,

                    transition: `

                        transform ${animationSpeed}s

                        cubic-bezier(.16,1,.3,1)

                    `,

                    boxSizing: "border-box",
                }}
            >
                {/* Outer ring */}

                <div
                    style={{
                        position: "absolute",

                        inset: "5%",

                        borderRadius: "50%",

                        border: `1px solid ${borderColor}`,

                        opacity: 0.65,
                    }}
                />

                {/* Dashed ring */}

                <div
                    style={{
                        position: "absolute",

                        inset: "10%",

                        borderRadius: "50%",

                        border: `1px dashed ${borderColor}`,

                        opacity: 0.7,
                    }}
                />

                {/* Inner ring */}

                <div
                    style={{
                        position: "absolute",

                        inset: "18%",

                        borderRadius: "50%",

                        border: `1px solid ${borderColor}`,

                        opacity: 0.35,
                    }}
                />

                {/* Center hole */}

                <div
                    style={{
                        position: "absolute",

                        top: "50%",

                        left: "50%",

                        width: 88,

                        height: 88,

                        borderRadius: "50%",

                        transform: "translate(-50%, -50%)",

                        background: backgroundColor,

                        border: `1px solid ${borderColor}`,

                        boxShadow: "inset 0 4px 12px rgba(0,0,0,0.07)",
                    }}
                />

                {/* Center hub */}

                <div
                    style={{
                        position: "absolute",

                        top: "50%",

                        left: "50%",

                        width: 22,

                        height: 22,

                        borderRadius: "50%",

                        transform: "translate(-50%, -50%)",

                        background: accentColor,

                        boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                    }}
                />

                {/* SIX PHOTO WINDOWS */}

                {items.map((item, index) => {
                    const angle = (360 / count) * index - 90

                    const radius = 38

                    const x = 50 + Math.cos((angle * Math.PI) / 180) * radius

                    const y = 50 + Math.sin((angle * Math.PI) / 180) * radius

                    const isActive = index === active

                    const activeSize = isActive
                        ? safePhotoSize + 16
                        : safePhotoSize

                    return (
                        <button
                            key={index}
                            onClick={() => setActive(index)}
                            aria-label={`View testimonial ${index + 1}`}
                            style={{
                                position: "absolute",

                                left: `${x}%`,

                                top: `${y}%`,

                                width: activeSize,

                                height: activeSize,

                                transform: `

                                    translate(-50%, -50%)

                                    rotate(${-reelRotation}deg)

                                `,

                                padding: 7,

                                borderRadius: 18,

                                background: cardColor,

                                border: isActive
                                    ? `2px solid ${accentColor}`
                                    : `1px solid ${borderColor}`,

                                boxShadow: isActive
                                    ? `0 16px 38px ${shadowColor}`
                                    : "0 7px 18px rgba(0,0,0,0.06)",

                                cursor: "pointer",

                                transition: `

                                    width ${animationSpeed}s

                                        cubic-bezier(.16,1,.3,1),

                                    height ${animationSpeed}s

                                        cubic-bezier(.16,1,.3,1),

                                    border ${animationSpeed}s ease

                                `,

                                boxSizing: "border-box",

                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",

                                    height: "100%",

                                    borderRadius: 12,

                                    overflow: "hidden",

                                    background: "rgba(0,0,0,0.05)",
                                }}
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        style={{
                                            width: "100%",

                                            height: "100%",

                                            display: "block",

                                            objectFit: "cover",
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

                                            color: textColor,

                                            fontSize: 28,

                                            fontWeight: 600,
                                        }}
                                    >
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* TESTIMONIAL CARD */}

            <div
                style={{
                    position: "relative",

                    zIndex: 10,

                    width: `min(${safeCardWidth}px, 88vw)`,

                    height: autoHeight ? "auto" : safeCardHeight,

                    minHeight: autoHeight ? 360 : undefined,

                    padding: safePadding,

                    background: cardColor,

                    border: `1px solid ${borderColor}`,

                    borderRadius: safeRadius,

                    boxShadow: `0 25px 70px ${shadowColor}`,

                    boxSizing: "border-box",

                    display: "flex",

                    flexDirection: "column",

                    justifyContent: "space-between",
                }}
            >
                {/* Card top */}

                <div>
                    <div
                        style={{
                            display: "flex",

                            alignItems: "center",

                            justifyContent: "space-between",

                            marginBottom: 24,
                        }}
                    >
                        <span
                            style={{
                                ...detailsFont,

                                fontSize: 10,

                                fontWeight: 700,

                                letterSpacing: "0.15em",

                                textTransform: "uppercase",

                                color: mutedColor,
                            }}
                        >
                            VIEW / {String(active + 1).padStart(2, "0")}
                        </span>

                        <span
                            style={{
                                width: 7,

                                height: 7,

                                borderRadius: "50%",

                                background: accentColor,

                                flexShrink: 0,
                            }}
                        />
                    </div>

                    {/* Quote */}

                    <div
                        style={{
                            ...quoteFont,

                            color: textColor,

                            overflowWrap: "break-word",

                            wordBreak: "normal",

                            maxWidth: "100%",
                        }}
                    >
                        “{current.quote}”
                    </div>

                    {/* Person */}

                    <div
                        style={{
                            display: "flex",

                            alignItems: "center",

                            gap: 12,

                            marginTop: 28,
                        }}
                    >
                        {current.image ? (
                            <img
                                src={current.image}
                                alt={current.name}
                                style={{
                                    width: 48,

                                    height: 48,

                                    flexShrink: 0,

                                    borderRadius: "50%",

                                    objectFit: "cover",

                                    border: `1px solid ${borderColor}`,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 48,

                                    height: 48,

                                    flexShrink: 0,

                                    borderRadius: "50%",

                                    background: reelColor,

                                    display: "flex",

                                    alignItems: "center",

                                    justifyContent: "center",

                                    color: textColor,

                                    fontWeight: 700,
                                }}
                            >
                                {current.name.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    ...detailsFont,

                                    fontSize: 14,

                                    fontWeight: 700,

                                    color: textColor,
                                }}
                            >
                                {current.name}
                            </div>

                            <div
                                style={{
                                    ...detailsFont,

                                    marginTop: 4,

                                    fontSize: 12,

                                    color: mutedColor,
                                }}
                            >
                                {current.role}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card bottom */}

                <div
                    style={{
                        display: "flex",

                        alignItems: "center",

                        justifyContent: "space-between",

                        gap: 16,

                        marginTop: 30,

                        paddingTop: 18,

                        borderTop: `1px solid ${borderColor}`,
                    }}
                >
                    {/* Progress */}

                    <div
                        style={{
                            display: "flex",

                            alignItems: "center",

                            gap: 5,
                        }}
                    >
                        {items.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActive(index)}
                                aria-label={`View testimonial ${index + 1}`}
                                style={{
                                    width: index === active ? 24 : 6,

                                    height: 5,

                                    padding: 0,

                                    border: 0,

                                    borderRadius: 99,

                                    background:
                                        index === active
                                            ? accentColor
                                            : borderColor,

                                    cursor: "pointer",

                                    transition: "all 0.3s ease",
                                }}
                            />
                        ))}
                    </div>

                    {/* Navigation */}

                    <div
                        style={{
                            display: "flex",

                            gap: 6,
                        }}
                    >
                        <button
                            onClick={previous}
                            aria-label="Previous testimonial"
                            style={controlButton(
                                borderColor,

                                textColor,

                                cardColor
                            )}
                        >
                            ←
                        </button>

                        <button
                            onClick={next}
                            aria-label="Next testimonial"
                            style={controlButton(
                                borderColor,

                                textColor,

                                cardColor
                            )}
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom labels */}

            <div
                style={{
                    position: "absolute",

                    bottom: 24,

                    left: 28,

                    right: 28,

                    display: "flex",

                    justifyContent: "space-between",

                    color: mutedColor,

                    fontSize: 10,

                    letterSpacing: "0.1em",

                    textTransform: "uppercase",

                    fontWeight: 600,

                    zIndex: 20,
                }}
            >
                <span>Customer stories</span>

                <span>Turn the reel →</span>
            </div>
        </div>
    )
}

function controlButton(
    borderColor: string,

    textColor: string,

    background: string
): React.CSSProperties {
    return {
        width: 34,

        height: 34,

        borderRadius: "50%",

        border: `1px solid ${borderColor}`,

        background,

        color: textColor,

        cursor: "pointer",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: 0,

        fontSize: 14,

        flexShrink: 0,
    }
}

RetroTestimonialReel.defaultProps = {
    testimonials: [
        {
            quote: "The experience feels thoughtful, memorable, and incredibly easy to use.",

            name: "Alex Morgan",

            role: "Founder",

            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        },

        {
            quote: "It gives our customer stories a personality that a traditional testimonial section never had.",

            name: "Jordan Lee",

            role: "Product Designer",

            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        },

        {
            quote: "A small interaction that makes the entire website feel more human.",

            name: "Taylor Smith",

            role: "Creative Director",

            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        },

        {
            quote: "The motion is playful without distracting from what customers actually have to say.",

            name: "Sam Rivera",

            role: "Brand Strategist",

            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        },

        {
            quote: "It feels like discovering a collection of real stories rather than scrolling through reviews.",

            name: "Morgan Chen",

            role: "Marketing Lead",

            image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80",
        },

        {
            quote: "Being part of this community makes everyday life feel a little easier and a lot more connected.",

            name: "Jamie Wilson",

            role: "Community Member",

            image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
        },
    ],

    accentColor: "#D85C45",

    backgroundColor: "#F4F0E8",

    reelColor: "#E9E1D2",

    cardColor: "#FFFDF8",

    textColor: "#20201E",

    mutedColor: "#77736B",

    borderColor: "rgba(32,32,30,0.14)",

    shadowColor: "rgba(32,32,30,0.10)",

    quoteFont: {
        fontFamily: "Georgia",

        fontSize: "28px",

        lineHeight: 1.25,

        letterSpacing: "-0.025em",

        fontWeight: 400,
    },

    detailsFont: {
        fontFamily: "Inter",

        fontSize: "14px",

        lineHeight: 1.3,

        letterSpacing: "0em",

        fontWeight: 500,
    },

    cardWidth: 455,

    cardHeight: 460,

    autoHeight: true,

    cardPadding: 38,

    cardRadius: 20,

    reelSize: 600,

    photoSize: 124,

    autoRotate: true,

    interval: 5000,

    animationSpeed: 0.75,
}

addPropertyControls(RetroTestimonialReel, {
    testimonials: {
        type: ControlType.Array,

        title: "Testimonials",

        control: {
            type: ControlType.Object,

            controls: {
                quote: {
                    type: ControlType.String,

                    title: "Quote",

                    displayTextArea: true,
                },

                name: {
                    type: ControlType.String,

                    title: "Name",
                },

                role: {
                    type: ControlType.String,

                    title: "Role",
                },

                image: {
                    type: ControlType.Image,

                    title: "Photo",
                },
            },
        },

        maxCount: 6,
    },

    accentColor: {
        type: ControlType.Color,

        title: "Accent",

        defaultValue: "#D85C45",
    },

    backgroundColor: {
        type: ControlType.Color,

        title: "Background",

        defaultValue: "#F4F0E8",
    },

    reelColor: {
        type: ControlType.Color,

        title: "Reel",

        defaultValue: "#E9E1D2",
    },

    cardColor: {
        type: ControlType.Color,

        title: "Card",

        defaultValue: "#FFFDF8",
    },

    textColor: {
        type: ControlType.Color,

        title: "Text",

        defaultValue: "#20201E",
    },

    mutedColor: {
        type: ControlType.Color,

        title: "Secondary Text",

        defaultValue: "#77736B",
    },

    borderColor: {
        type: ControlType.Color,

        title: "Border",

        defaultValue: "rgba(32,32,30,0.14)",
    },

    shadowColor: {
        type: ControlType.Color,

        title: "Shadow",

        defaultValue: "rgba(32,32,30,0.10)",
    },

    quoteFont: {
        type: ControlType.Font,

        title: "Quote Font",

        defaultValue: {
            fontFamily: "Georgia",

            fontSize: "28px",

            lineHeight: 1.25,

            letterSpacing: "-0.025em",

            fontWeight: 400,
        },

        defaultFontType: "serif",

        defaultFontSize: "28px",

        displayFontSize: true,

        displayTextAlignment: false,

        controls: "extended",
    },

    detailsFont: {
        type: ControlType.Font,

        title: "Details Font",

        defaultValue: {
            fontFamily: "Inter",

            fontSize: "14px",

            lineHeight: 1.3,

            letterSpacing: "0em",

            fontWeight: 500,
        },

        defaultFontType: "sans-serif",

        defaultFontSize: "14px",

        displayFontSize: true,

        displayTextAlignment: false,

        controls: "extended",
    },

    cardWidth: {
        type: ControlType.Number,

        title: "Card Width",

        min: 300,

        max: 600,

        step: 5,

        unit: "px",

        defaultValue: 455,
    },

    autoHeight: {
        type: ControlType.Boolean,

        title: "Auto Height",

        defaultValue: true,
    },

    cardHeight: {
        type: ControlType.Number,

        title: "Card Height",

        min: 300,

        max: 700,

        step: 5,

        unit: "px",

        defaultValue: 460,

        hidden: (props) => props.autoHeight,
    },

    cardPadding: {
        type: ControlType.Number,

        title: "Card Padding",

        min: 20,

        max: 64,

        step: 2,

        unit: "px",

        defaultValue: 38,
    },

    cardRadius: {
        type: ControlType.Number,

        title: "Card Radius",

        min: 0,

        max: 48,

        step: 1,

        unit: "px",

        defaultValue: 20,
    },

    reelSize: {
        type: ControlType.Number,

        title: "Reel Size",

        min: 420,

        max: 760,

        step: 10,

        unit: "px",

        defaultValue: 600,
    },

    photoSize: {
        type: ControlType.Number,

        title: "Photo Size",

        min: 80,

        max: 190,

        step: 2,

        unit: "px",

        defaultValue: 124,
    },

    autoRotate: {
        type: ControlType.Boolean,

        title: "Auto Rotate",

        defaultValue: true,
    },

    interval: {
        type: ControlType.Number,

        title: "Rotation Delay",

        min: 2500,

        max: 10000,

        step: 500,

        unit: "ms",

        defaultValue: 5000,

        hidden: (props) => !props.autoRotate,
    },

    animationSpeed: {
        type: ControlType.Number,

        title: "Animation",

        min: 0.3,

        max: 1.2,

        step: 0.05,

        unit: "s",

        defaultValue: 0.75,
    },
})
