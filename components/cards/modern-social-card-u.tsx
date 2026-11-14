// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, startTransition, type CSSProperties } from "react"

interface SocialCardProps {
    variant: "compact" | "detailed" | "minimal" | "highlighted" | "empty"

    title: string
    subtitle: string
    description: string

    showAvatar: boolean
    showRating: boolean
    showActions: boolean
    showTimestamp: boolean

    rating: number
    userName: string
    timestamp: string
    userAvatar: { src: string; alt: string }
    initialLikes: number
    commentCount: number

    backgroundColor: string
    textColor: string
    mutedColor: string
    accentColor: string

    borderRadius: number
    padding: number
    spacing: number

    showShadow: boolean
    enableHoverEffect: boolean
    enableGradient: boolean
    gradientStart: string
    gradientEnd: string

    titleFont: any
    bodyFont: any
    metaFont: any

    showSkeletonAnimation: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
//@framerDisableUnlink
export default function SocialCard(props: SocialCardProps) {
    const {
        variant,
        title,
        subtitle,
        description,
        showAvatar,
        showRating,
        showActions,
        showTimestamp,
        rating,
        userName,
        timestamp,
        userAvatar = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "User avatar",
        },
        initialLikes,
        commentCount,
        backgroundColor,
        textColor,
        mutedColor,
        accentColor,
        borderRadius,
        padding,
        spacing,
        showShadow,
        enableHoverEffect,
        enableGradient,
        gradientStart,
        gradientEnd,
        titleFont,
        bodyFont,
        metaFont,
        showSkeletonAnimation,
        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const [likes, setLikes] = useState(initialLikes)
    const [isLiked, setIsLiked] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const handleLike = () => {
        startTransition(() => {
            setIsLiked(!isLiked)
            setLikes(isLiked ? likes - 1 : likes + 1)
        })
    }
    const isCompact = variant === "compact"
    const isDetailed = variant === "detailed"
    const isMinimal = variant === "minimal"
    const isHighlighted = variant === "highlighted"
    const isEmpty = variant === "empty"

    const avatarSize = isCompact ? 32 : isHighlighted ? 52 : 40
    const contentGap = isCompact ? Math.max(8, spacing - 6) : spacing

    const cardPadding = isCompact
        ? Math.max(12, padding - 4)
        : isHighlighted
          ? padding + 4
          : padding

    const getBackgroundStyle = () => {
        if (enableGradient && !isEmpty) {
            return {
                background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
            }
        }

        return { backgroundColor }
    }

    const getShadowStyle = () => {
        if (!showShadow) return "none"

        if (isStaticRenderer || !enableHoverEffect) {
            return "0 2px 8px rgba(0,0,0,0.06)"
        }

        return isHovered
            ? "0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.05)"
            : "0 2px 8px rgba(0,0,0,0.06)"
    }

    const skeletonAnimation =
        showSkeletonAnimation && !isStaticRenderer
            ? "pulse 1.8s ease-in-out infinite"
            : "none"

    const titleSize = isHighlighted
        ? `calc(${titleFont?.fontSize || "20px"} * 1.1)`
        : titleFont?.fontSize

    const bodySize = isHighlighted
        ? `calc(${bodyFont?.fontSize || "15px"} * 1.03)`
        : bodyFont?.fontSize

    const metaSize = isHighlighted
        ? `calc(${metaFont?.fontSize || "14px"} * 1.05)`
        : metaFont?.fontSize

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "auto",
                ...getBackgroundStyle(),
                borderRadius,
                padding: cardPadding,
                display: "flex",
                flexDirection: "column",
                gap: contentGap,
                transition: isStaticRenderer
                    ? "none"
                    : "transform 0.25s ease, box-shadow 0.25s ease, outline 0.25s ease",
                transform:
                    !isStaticRenderer && enableHoverEffect && isHovered
                        ? "translateY(-3px)"
                        : "translateY(0)",
                boxShadow: getShadowStyle(),
                border: isHighlighted
                    ? `1.5px solid ${accentColor}`
                    : isEmpty
                      ? "1px dashed #EAEAEA"
                      : "none",
                outline:
                    isHighlighted && isHovered && !isStaticRenderer
                        ? `3px solid ${accentColor}20`
                        : "none",
                opacity: isEmpty ? 0.72 : 1,
                overflow: "hidden",
            }}
            onMouseEnter={() => {
                if (!isStaticRenderer) {
                    startTransition(() => setIsHovered(true))
                }
            }}
            onMouseLeave={() => {
                if (!isStaticRenderer) {
                    startTransition(() => setIsHovered(false))
                }
            }}
        >
            {isEmpty ? (
                <>
                    {!isStaticRenderer && (
                        <style>
                            {`
                                @keyframes pulse {
                                    0%, 100% { opacity: 1; }
                                    50% { opacity: 0.5; }
                                }
                            `}
                        </style>
                    )}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: "50%",
                                backgroundColor: "#F3F3F3",
                                animation: skeletonAnimation,
                                flexShrink: 0,
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <div
                                style={{
                                    width: "42%",
                                    height: 12,
                                    borderRadius: 4,
                                    backgroundColor: "#F3F3F3",
                                    animation: skeletonAnimation,
                                }}
                            />
                            <div
                                style={{
                                    width: "28%",
                                    height: 10,
                                    borderRadius: 4,
                                    backgroundColor: "#F6F6F6",
                                    animation: skeletonAnimation,
                                }}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginTop: 4,
                        }}
                    >
                        <div
                            style={{
                                width: "58%",
                                height: 16,
                                borderRadius: 4,
                                backgroundColor: "#F3F3F3",
                                animation: skeletonAnimation,
                            }}
                        />
                        <div
                            style={{
                                width: "100%",
                                height: 12,
                                borderRadius: 4,
                                backgroundColor: "#F6F6F6",
                                animation: skeletonAnimation,
                            }}
                        />
                        <div
                            style={{
                                width: "84%",
                                height: 12,
                                borderRadius: 4,
                                backgroundColor: "#F6F6F6",
                                animation: skeletonAnimation,
                            }}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 20,
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: "1px solid #EEEEEE",
                        }}
                    >
                        <div
                            style={{
                                width: 52,
                                height: 10,
                                borderRadius: 4,
                                backgroundColor: "#F3F3F3",
                                animation: skeletonAnimation,
                            }}
                        />
                        <div
                            style={{
                                width: 52,
                                height: 10,
                                borderRadius: 4,
                                backgroundColor: "#F3F3F3",
                                animation: skeletonAnimation,
                            }}
                        />
                    </div>
                </>
            ) : (
                <>
                    {showAvatar && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: isCompact ? 10 : 12,
                            }}
                        >
                            <img
                                src={userAvatar.src}
                                alt={userAvatar.alt}
                                style={{
                                    width: avatarSize,
                                    height: avatarSize,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    flexShrink: 0,
                                    transition: isStaticRenderer
                                        ? "none"
                                        : "transform 0.25s ease",
                                    transform:
                                        !isStaticRenderer &&
                                        enableHoverEffect &&
                                        isHovered
                                            ? "scale(1.04)"
                                            : "scale(1)",
                                    boxShadow: isHighlighted
                                        ? `0 4px 12px ${accentColor}30`
                                        : "0 2px 8px rgba(0,0,0,0.08)",
                                }}
                            />

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                    minWidth: 0,
                                }}
                            >
                                <span
                                    style={{
                                        color: textColor,
                                        ...metaFont,
                                        fontSize: metaSize,
                                    }}
                                >
                                    {userName}
                                </span>

                                {showTimestamp && (
                                    <span
                                        style={{
                                            color: mutedColor,
                                            ...metaFont,
                                            fontSize: metaFont?.fontSize,
                                            opacity: 0.9,
                                        }}
                                    >
                                        {timestamp}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: isCompact ? 6 : 8,
                            minWidth: 0,
                        }}
                    >
                        {!isMinimal && (
                            <h2
                                style={{
                                    margin: 0,
                                    color: textColor,
                                    ...titleFont,
                                    fontSize: titleSize,
                                    lineHeight:
                                        titleFont?.lineHeight || "1.2em",
                                }}
                            >
                                {title}
                            </h2>
                        )}

                        {(isDetailed || isHighlighted) && subtitle && (
                            <h3
                                style={{
                                    margin: 0,
                                    color: mutedColor,
                                    ...metaFont,
                                    fontSize: metaFont?.fontSize || "14px",
                                    opacity: 0.95,
                                }}
                            >
                                {subtitle}
                            </h3>
                        )}

                        {showRating && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    marginTop: 2,
                                }}
                            >
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            color:
                                                i < rating
                                                    ? accentColor
                                                    : "#D0D0D0",
                                            fontSize: isCompact ? 14 : 16,
                                            transition: isStaticRenderer
                                                ? "none"
                                                : "color 0.2s ease",
                                        }}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        )}

                        {!isCompact && (
                            <p
                                style={{
                                    margin: 0,
                                    color: textColor,
                                    ...bodyFont,
                                    fontSize: bodySize,
                                    lineHeight: bodyFont?.lineHeight || "1.5em",
                                    opacity: 0.92,
                                    display: "-webkit-box",
                                    WebkitLineClamp:
                                        isMinimal || isStaticRenderer ? 2 : 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    wordBreak: "break-word",
                                }}
                            >
                                {description}
                            </p>
                        )}
                    </div>

                    {showActions && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: isCompact ? 14 : 18,
                                marginTop: isCompact ? 2 : 6,
                                paddingTop: isCompact ? 0 : 8,
                                borderTop: isCompact
                                    ? "none"
                                    : "1px solid rgba(0,0,0,0.06)",
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                onClick={handleLike}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: 0,
                                    color: isLiked ? accentColor : mutedColor,
                                    ...metaFont,
                                    fontSize: metaSize,
                                    transition: isStaticRenderer
                                        ? "none"
                                        : "transform 0.2s ease, color 0.2s ease",
                                    transform: isLiked
                                        ? "scale(1.06)"
                                        : "scale(1)",
                                }}
                                aria-label={isLiked ? "Unlike" : "Like"}
                            >
                                <svg
                                    width={18}
                                    height={18}
                                    viewBox="0 0 24 24"
                                    fill={isLiked ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                <span>{likes}</span>
                            </button>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    color: mutedColor,
                                    ...metaFont,
                                    fontSize: metaSize,
                                }}
                            >
                                <svg
                                    width={18}
                                    height={18}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <span>{commentCount}</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

addPropertyControls(SocialCard, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["compact", "detailed", "minimal", "highlighted", "empty"],
        optionTitles: [
            "Compact",
            "Detailed",
            "Minimal",
            "Highlighted",
            "Empty",
        ],
        defaultValue: "detailed",
        displaySegmentedControl: true,
    },

    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Amazing Product Review",
        hidden: (props) => props.variant === "empty",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Best purchase this year",
        hidden: (props) =>
            props.variant === "empty" ||
            (props.variant !== "detailed" && props.variant !== "highlighted"),
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue:
            "This product exceeded all my expectations. The quality is outstanding and it works perfectly for my needs.",
        displayTextArea: true,
        hidden: (props) => props.variant === "empty",
    },

    showAvatar: {
        type: ControlType.Boolean,
        title: "Avatar",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => props.variant === "empty",
    },
    userAvatar: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: (props) => props.variant === "empty" || !props.showAvatar,
    },
    userName: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "Sarah Johnson",
        hidden: (props) => props.variant === "empty" || !props.showAvatar,
    },
    showTimestamp: {
        type: ControlType.Boolean,
        title: "Timestamp",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => props.variant === "empty" || !props.showAvatar,
    },
    timestamp: {
        type: ControlType.String,
        title: "Time",
        defaultValue: "2 hours ago",
        hidden: (props) =>
            props.variant === "empty" ||
            !props.showAvatar ||
            !props.showTimestamp,
    },

    showRating: {
        type: ControlType.Boolean,
        title: "Rating",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => props.variant === "empty",
    },
    rating: {
        type: ControlType.Number,
        title: "Stars",
        defaultValue: 5,
        min: 0,
        max: 5,
        step: 1,
        hidden: (props) => props.variant === "empty" || !props.showRating,
    },

    showActions: {
        type: ControlType.Boolean,
        title: "Actions",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => props.variant === "empty",
    },
    initialLikes: {
        type: ControlType.Number,
        title: "Likes",
        defaultValue: 42,
        min: 0,
        step: 1,
        hidden: (props) => props.variant === "empty" || !props.showActions,
    },
    commentCount: {
        type: ControlType.Number,
        title: "Comments",
        defaultValue: 8,
        min: 0,
        step: 1,
        hidden: (props) => props.variant === "empty" || !props.showActions,
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#111111",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "#7A7A7A",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0099FF",
    },

    enableGradient: {
        type: ControlType.Boolean,
        title: "Gradient",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    gradientStart: {
        type: ControlType.Color,
        title: "Start",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.enableGradient,
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "End",
        defaultValue: "#F5F5F5",
        hidden: (props) => !props.enableGradient,
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 20,
        min: 8,
        max: 40,
        step: 2,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 14,
        min: 6,
        max: 24,
        step: 2,
        unit: "px",
    },

    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enableHoverEffect: {
        type: ControlType.Boolean,
        title: "Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: (props) =>
            props.variant === "empty" || props.variant === "minimal",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.45em",
        },
        hidden: (props) =>
            props.variant === "empty" || props.variant === "compact",
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },

    showSkeletonAnimation: {
        type: ControlType.Boolean,
        title: "Skeleton",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.variant !== "empty",
    },
})
