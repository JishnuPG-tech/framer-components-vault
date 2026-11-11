// Slack-style message component with user avatar, display name, timestamp, message text, and up to 4 customizable emoji reactions with real-time counts. Supports light and dark mode themes.

import { useState, startTransition, useEffect, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SlackMessageProps {
    avatar: { src: string; alt: string }
    displayName: string
    timestamp: string
    messageText: string
    darkMode: boolean
    emojiCount: number
    emoji1: string
    emoji2: string
    emoji3: string
    emoji4: string
    emoji1Base: number
    emoji2Base: number
    emoji3Base: number
    emoji4Base: number
    nameFont: any
    timestampFont: any
    messageFont: any
    emojiFont: any
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SlackMessage(props: SlackMessageProps) {
    const {
        avatar = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "User avatar" },
        displayName = "John Doe",
        timestamp = "12:34 PM",
        messageText = "Hey team! Just wanted to share some exciting news about our latest project update. Looking forward to hearing your thoughts!",
        darkMode = false,
        emojiCount = 4,
        emoji1 = "👍",
        emoji2 = "❤️",
        emoji3 = "😄",
        emoji4 = "🎉",
        emoji1Base = 3,
        emoji2Base = 1,
        emoji3Base = 2,
        emoji4Base = 0,
        nameFont,
        timestampFont,
        messageFont,
        emojiFont
    } = props

    const [reactions, setReactions] = useState({
        emoji1: emoji1Base,
        emoji2: emoji2Base,
        emoji3: emoji3Base,
        emoji4: emoji4Base
    })

    const [emojiStates, setEmojiStates] = useState({
        emoji1: false,
        emoji2: false,
        emoji3: false,
        emoji4: false
    })

    // Sync reactions with base counts when props change
    useEffect(() => {
        setReactions({
            emoji1: emoji1Base,
            emoji2: emoji2Base,
            emoji3: emoji3Base,
            emoji4: emoji4Base
        })
    }, [emoji1Base, emoji2Base, emoji3Base, emoji4Base])

    const handleReactionClick = (emojiKey: keyof typeof reactions) => {
        startTransition(() => {
            setEmojiStates(prev => {
                const newState = !prev[emojiKey]
                
                // Update count based on state change
                setReactions(prevReactions => ({
                    ...prevReactions,
                    [emojiKey]: newState 
                        ? prevReactions[emojiKey] + 1 
                        : Math.max(0, prevReactions[emojiKey] - 1)
                }))
                
                return {
                    ...prev,
                    [emojiKey]: newState
                }
            })
        })
    }

    const theme = {
        background: darkMode ? "#1a1d21" : "#ffffff",
        messageBackground: darkMode ? "#1a1d21" : "#ffffff",
        nameColor: darkMode ? "#ffffff" : "#1d1c1d",
        timestampColor: darkMode ? "#b9b9b9" : "#616061",
        messageColor: darkMode ? "#d1d2d3" : "#1d1c1d",
        reactionBackground: darkMode ? "#2c2d30" : "#f8f8f8",
        reactionBorder: darkMode ? "#3f4146" : "#e1e1e1",
        reactionHoverBackground: darkMode ? "#3f4146" : "#e8e8e8",
        reactionCountColor: darkMode ? "#d1d2d3" : "#1d1c1d"
    }

    const isFixedWidth = props?.style && props.style.width === "100%"

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                backgroundColor: theme.background,
                padding: "8px 20px",
                borderRadius: "8px",
                display: "flex",
                gap: "8px",
                ...(isFixedWidth ? { ...props?.style } : { minWidth: "max-content" }),
            }}
        >
            {/* Avatar */}
            <div
                style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    flexShrink: 0,
                    marginTop: "2px"
                }}
            >
                <img
                    {...avatar}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                    }}
                />
            </div>

            {/* Message Content */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px"
                }}
            >
                {/* Header with name and timestamp */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "8px"
                    }}
                >
                    <span
                        style={{
                            color: theme.nameColor,
                            fontWeight: "900",
                            ...nameFont
                        }}
                    >
                        {displayName}
                    </span>
                    <span
                        style={{
                            color: theme.timestampColor,
                            fontSize: "12px",
                            ...timestampFont
                        }}
                    >
                        {timestamp}
                    </span>
                </div>

                {/* Message text */}
                <div
                    style={{
                        color: theme.messageColor,
                        lineHeight: "1.46668",
                        wordBreak: "break-word",
                        ...messageFont
                    }}
                >
                    {messageText}
                </div>

                {/* Reactions */}
                <div
                    style={{
                        display: "flex",
                        gap: "4px",
                        marginTop: "4px",
                        flexWrap: "wrap"
                    }}
                >
                    {[
                        { emoji: emoji1, key: "emoji1" as const },
                        { emoji: emoji2, key: "emoji2" as const },
                        { emoji: emoji3, key: "emoji3" as const },
                        { emoji: emoji4, key: "emoji4" as const }
                    ].slice(0, emojiCount).map(({ emoji, key }) => {
                        const isActive = emojiStates[key]
                        return (
                            <button
                                key={key}
                                onClick={() => handleReactionClick(key)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "8px 12px",
                                    backgroundColor: isActive ? "#E7F7FE" : theme.reactionBackground,
                                    border: `1px solid ${isActive ? "#2E629E" : theme.reactionBorder}`,
                                    borderRadius: "99px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    transition: "background-color 0.1s ease, border-color 0.1s ease",
                                    ...emojiFont
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = theme.reactionHoverBackground
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isActive ? "#E7F7FE" : theme.reactionBackground
                                }}
                            >
                                <span style={{ fontSize: "12px" }}>{emoji}</span>
                                <span
                                    style={{
                                        color: isActive ? "#2E629E" : theme.reactionCountColor,
                                        fontSize: "11px",
                                        fontWeight: "400"
                                    }}
                                >
                                    {reactions[key]}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(SlackMessage, {
    avatar: {
        type: ControlType.ResponsiveImage,
        title: "Avatar"
    },
    displayName: {
        type: ControlType.String,
        title: "Display Name",
        defaultValue: "John Doe"
    },
    timestamp: {
        type: ControlType.String,
        title: "Timestamp",
        defaultValue: "12:34 PM"
    },
    messageText: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "Hey team! Just wanted to share some exciting news about our latest project update. Looking forward to hearing your thoughts!",
        displayTextArea: true
    },
    darkMode: {
        type: ControlType.Boolean,
        title: "Dark Mode",
        defaultValue: false,
        enabledTitle: "Dark",
        disabledTitle: "Light"
    },
    emojiCount: {
        type: ControlType.Enum,
        title: "Number of Emojis",
        options: [1, 2, 3, 4],
        optionTitles: ["1", "2", "3", "4"],
        defaultValue: 4,
        displaySegmentedControl: true
    },
    emoji1: {
        type: ControlType.String,
        title: "Emoji 1",
        defaultValue: "👍"
    },
    emoji2: {
        type: ControlType.String,
        title: "Emoji 2",
        defaultValue: "❤️",
        hidden: ({ emojiCount }) => emojiCount < 2
    },
    emoji3: {
        type: ControlType.String,
        title: "Emoji 3",
        defaultValue: "😄",
        hidden: ({ emojiCount }) => emojiCount < 3
    },
    emoji4: {
        type: ControlType.String,
        title: "Emoji 4",
        defaultValue: "🎉",
        hidden: ({ emojiCount }) => emojiCount < 4
    },
    emoji1Base: {
        type: ControlType.Number,
        title: "Emoji 1 Base Count",
        defaultValue: 3,
        min: 0,
        step: 1
    },
    emoji2Base: {
        type: ControlType.Number,
        title: "Emoji 2 Base Count",
        defaultValue: 1,
        min: 0,
        step: 1,
        hidden: ({ emojiCount }) => emojiCount < 2
    },
    emoji3Base: {
        type: ControlType.Number,
        title: "Emoji 3 Base Count",
        defaultValue: 2,
        min: 0,
        step: 1,
        hidden: ({ emojiCount }) => emojiCount < 3
    },
    emoji4Base: {
        type: ControlType.Number,
        title: "Emoji 4 Base Count",
        defaultValue: 0,
        min: 0,
        step: 1,
        hidden: ({ emojiCount }) => emojiCount < 4
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    timestampFont: {
        type: ControlType.Font,
        title: "Timestamp Font",
        defaultValue: {
            fontSize: "12px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    messageFont: {
        type: ControlType.Font,
        title: "Message Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.46em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    emojiFont: {
        type: ControlType.Font,
        title: "Reaction Font",
        defaultValue: {
            fontSize: "11px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    }
})