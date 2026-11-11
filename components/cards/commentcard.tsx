// Clean and modern Comment Card component with avatar, user info, comment text, and actions
// Includes variants: Default, Compact, Highlighted, Empty, and Reply (nested comment)
// Fully customizable with props for name, time, comment, likes, and avatar

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

interface CommentCardProps {
    name: string
    time: string
    comment: string
    likes: number
    replies: number
    avatar: {
        src: string
        alt: string
    }
    variant: "default" | "compact" | "highlighted" | "empty" | "reply"
    backgroundColor: string
    highlightColor: string
    textColor: string
    mutedColor: string
    accentColor: string
    nameFont: CSSProperties
    timeFont: CSSProperties
    commentFont: CSSProperties
    actionFont: CSSProperties
    showVerified: boolean
    showAuthor: boolean
    badgeColor: string
    truncateText: boolean
    maxLines: number
    link?: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
//@framerDisableUnlink
export default function CommentCard(props: CommentCardProps) {
    const {
        name,
        time,
        comment,
        likes,
        avatar = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "User avatar",
        },
        variant,
        backgroundColor,
        highlightColor,
        textColor,
        mutedColor,
        accentColor,
        nameFont,
        timeFont,
        commentFont,
        actionFont,
        truncateText,
        maxLines,
        link,
        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const [isHovered, setIsHovered] = useState(false)
    const [isLiked, setIsLiked] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

    const isCompact = variant === "compact"
    const isHighlighted = variant === "highlighted"
    const isEmpty = variant === "empty"
    const isReply = variant === "reply"

    const padding = isCompact ? 12 : 16
    const avatarSize = isCompact ? 32 : isReply ? 32 : 40
    const gap = isCompact ? 8 : 12
    const borderRadius = isCompact ? 12 : 16

    const cardBackground = isHighlighted ? highlightColor : backgroundColor

    const handleLikeClick = () => {
        startTransition(() => {
            setIsLiked(!isLiked)
        })
    }

    const skeletonAnimated = {
        background:
            "linear-gradient(90deg, #EEEEEE 25%, #F5F5F5 50%, #EEEEEE 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite ease-in-out",
    }

    const skeletonAnimatedSoft = {
        background:
            "linear-gradient(90deg, #F5F5F5 25%, #FAFAFA 50%, #F5F5F5 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite ease-in-out",
    }

    const skeletonStatic = {
        background: "#EEEEEE",
        animation: "none",
    }

    const skeletonStaticSoft = {
        background: "#F5F5F5",
        animation: "none",
    }

    const primarySkeletonStyle = isStaticRenderer
        ? skeletonStatic
        : skeletonAnimated

    const softSkeletonStyle = isStaticRenderer
        ? skeletonStaticSoft
        : skeletonAnimatedSoft

    if (isEmpty) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    backgroundColor: cardBackground,
                    borderRadius,
                    padding,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    display: "flex",
                    gap,
                    overflow: "hidden",
                }}
            >
                {!isStaticRenderer && (
                    <style>
                        {`
                            @keyframes shimmer {
                                0% {
                                    background-position: -200% 0;
                                }
                                100% {
                                    background-position: 200% 0;
                                }
                            }
                        `}
                    </style>
                )}

                <div
                    style={{
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: "50%",
                        flexShrink: 0,
                        ...primarySkeletonStyle,
                    }}
                />

                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                width: 80,
                                height: 12,
                                borderRadius: 4,
                                ...primarySkeletonStyle,
                            }}
                        />
                        <div
                            style={{
                                width: 40,
                                height: 10,
                                borderRadius: 4,
                                ...softSkeletonStyle,
                            }}
                        />
                    </div>

                    <div
                        style={{
                            width: "100%",
                            height: isCompact ? 32 : 48,
                            borderRadius: 4,
                            ...softSkeletonStyle,
                        }}
                    />

                    <div
                        style={{
                            width: 60,
                            height: 10,
                            borderRadius: 4,
                            ...primarySkeletonStyle,
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                backgroundColor: cardBackground,
                borderRadius,
                padding,
                paddingLeft: isReply ? padding + 24 : padding,
                boxShadow: isStaticRenderer
                    ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                    : isHovered
                      ? "0 4px 16px rgba(0, 0, 0, 0.12)"
                      : "0 2px 8px rgba(0, 0, 0, 0.08)",
                display: "flex",
                gap,
                transform: isStaticRenderer
                    ? "none"
                    : isHovered
                      ? "scale(1.02)"
                      : "scale(1)",
                transition: isStaticRenderer
                    ? "none"
                    : "box-shadow 0.2s ease, transform 0.2s ease",
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
            {isReply && (
                <div
                    style={{
                        position: "absolute",
                        left: 12,
                        top: padding,
                        bottom: padding,
                        width: 2,
                        backgroundColor: mutedColor,
                        borderRadius: 1,
                    }}
                />
            )}

            <img
                src={avatar.src}
                alt={avatar.alt}
                style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                }}
            />

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: isCompact ? 6 : 8,
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                    }}
                >
                    {link ? (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                ...nameFont,
                                color: textColor,
                                textDecoration: "none",
                            }}
                        >
                            {name}
                        </a>
                    ) : (
                        <span
                            style={{
                                ...nameFont,
                                color: textColor,
                            }}
                        >
                            {name}
                        </span>
                    )}

                    <span
                        style={{
                            ...timeFont,
                            color: mutedColor,
                        }}
                    >
                        {time}
                    </span>
                </div>

                <p
                    style={{
                        ...commentFont,
                        color: textColor,
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        ...(truncateText && !isExpanded
                            ? {
                                  display: "-webkit-box",
                                  WebkitLineClamp: maxLines,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                              }
                            : {}),
                        transition: isStaticRenderer ? "none" : "all 0.2s ease",
                    }}
                >
                    {comment}
                </p>

                {truncateText && (
                    <button
                        style={{
                            ...actionFont,
                            background: "none",
                            border: "none",
                            padding: 0,
                            color: accentColor,
                            cursor: "pointer",
                            transition: isStaticRenderer
                                ? "none"
                                : "all 0.2s ease",
                            marginTop: 4,
                            alignSelf: "flex-start",
                        }}
                        onClick={() =>
                            startTransition(() => setIsExpanded(!isExpanded))
                        }
                    >
                        {isExpanded ? "Show less" : "Read more"}
                    </button>
                )}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginTop: isCompact ? 2 : 4,
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        style={{
                            ...actionFont,
                            background: "none",
                            border: "none",
                            padding: 0,
                            color: accentColor,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            transition: isStaticRenderer
                                ? "none"
                                : "all 0.2s ease",
                        }}
                        onClick={handleLikeClick}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M8 14C8 14 2 10 2 5.5C2 3.5 3.5 2 5.5 2C6.5 2 7.5 2.5 8 3.5C8.5 2.5 9.5 2 10.5 2C12.5 2 14 3.5 14 5.5C14 10 8 14 8 14Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill={isLiked ? "currentColor" : "none"}
                                style={{
                                    transition: isStaticRenderer
                                        ? "none"
                                        : "fill 0.2s ease",
                                }}
                            />
                        </svg>
                        <span>{isLiked ? likes + 1 : likes}</span>
                    </button>

                    <button
                        style={{
                            ...actionFont,
                            background: "none",
                            border: "none",
                            padding: 0,
                            color: accentColor,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            transition: isStaticRenderer
                                ? "none"
                                : "all 0.2s ease",
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M14 10C14 10.5304 13.7893 11.0391 13.4142 11.4142C13.0391 11.7893 12.5304 12 12 12H5L2 15V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H12C12.5304 2 13.0391 2.21071 13.4142 2.58579C13.7893 2.96086 14 3.46957 14 4V10Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span>Reply</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(CommentCard, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["default", "compact", "highlighted", "empty", "reply"],
        optionTitles: ["Default", "Compact", "Highlighted", "Empty", "Reply"],
        defaultValue: "default",
        displaySegmentedControl: false,
    },
    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "Sarah Johnson",
        hidden: ({ variant }) => variant === "empty",
    },
    time: {
        type: ControlType.String,
        title: "Time",
        defaultValue: "2 hours ago",
        hidden: ({ variant }) => variant === "empty",
    },
    comment: {
        type: ControlType.String,
        title: "Comment",
        defaultValue:
            "This is a really insightful post! I appreciate the detailed explanation and examples you provided. Looking forward to more content like this.",
        displayTextArea: true,
        hidden: ({ variant }) => variant === "empty",
    },
    truncateText: {
        type: ControlType.Boolean,
        title: "Truncate Text",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ variant }) => variant === "empty",
    },
    maxLines: {
        type: ControlType.Number,
        title: "Max Lines",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
        hidden: ({ variant, truncateText }) =>
            variant === "empty" || !truncateText,
    },
    likes: {
        type: ControlType.Number,
        title: "Likes",
        defaultValue: 24,
        min: 0,
        step: 1,
        displayStepper: true,
        hidden: ({ variant }) => variant === "empty",
    },
    avatar: {
        type: ControlType.ResponsiveImage,
        title: "Avatar",
        hidden: ({ variant }) => variant === "empty",
    },
    link: {
        type: ControlType.String,
        title: "Link",
        placeholder: "https://example.com",
        hidden: ({ variant }) => variant === "empty",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight BG",
        defaultValue: "#F5F5F5",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Color",
        defaultValue: "#CCCCCC",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#000000",
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    timeFont: {
        type: ControlType.Font,
        title: "Time Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    commentFont: {
        type: ControlType.Font,
        title: "Comment Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
    },
    actionFont: {
        type: ControlType.Font,
        title: "Action Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
