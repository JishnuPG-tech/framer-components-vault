// TwitterPostCard — Framer Component
// Assets → Code → New File → paste → save → drag to canvas

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


const { useState } = React

// ─── Icons ────────────────────────────────────────────────────────────────────

function XLogo() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
}

function ReplyIcon() {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path
                d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function RepostIcon() {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13V19.5H7.75C5.68 19.5 4 17.82 4 15.75V8.38L2.353 9.91.647 8.09l4.103-4.3zM17 5.5h-5.25V3H17c2.07 0 3.75 1.68 3.75 3.75v7.37l1.647-1.53 1.706 1.82-4.103 4.3-4.603-4.3 1.706-1.82L17 14.12V6.75c0-.966-.784-1.75-1.75-1.75H17z" />
        </svg>
    )
}

function HeartOutline() {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
        </svg>
    )
}

function HeartFilled() {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="#f91880">
            <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
        </svg>
    )
}

function ShareIcon() {
    return (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" />
        </svg>
    )
}

function BlueCheckmark() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#1d9bf0">
            <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1-2.48-1.27-3.91-.81-.66-1.31-1.9-2.19-3.34-2.19-1.43 0-2.67.88-3.34 2.19-1.39-.46-2.9-.2-3.91.81-1 1.01-1.27 2.48-.81 3.91-1.31.67-2.19 1.91-2.19 3.34 0 1.43.88 2.67 2.19 3.34-.46 1.39-.2 2.9.81 3.91 1.01 1.01 2.48 1.27 3.91.81.66 1.31 1.9 2.19 3.34 2.19 1.44 0 2.67-.88 3.34-2.19 1.39.46 2.9.2 3.91-.81 1-1.01 1.27-2.48.81-3.91 1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
        </svg>
    )
}

function GoldCheckmark() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#ffd400">
            <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1-2.48-1.27-3.91-.81-.66-1.31-1.9-2.19-3.34-2.19-1.43 0-2.67.88-3.34 2.19-1.39-.46-2.9-.2-3.91.81-1 1.01-1.27 2.48-.81 3.91-1.31.67-2.19 1.91-2.19 3.34 0 1.43.88 2.67 2.19 3.34-.46 1.39-.2 2.9.81 3.91 1.01 1.01 2.48 1.27 3.91.81.66 1.31 1.9 2.19 3.34 2.19 1.44 0 2.67-.88 3.34-2.19 1.39.46 2.9.2 3.91-.81 1-1.01 1.27-2.48.81-3.91 1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
        </svg>
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K"
    return String(n)
}

function parseContent(text) {
    const parts = []
    const regex = /(https?:\/\/[^\s]+|#\w+)/g
    let last = 0
    let m
    while ((m = regex.exec(text)) !== null) {
        if (m.index > last)
            parts.push({ kind: "text", value: text.slice(last, m.index) })
        parts.push({ kind: m[0].startsWith("#") ? "tag" : "link", value: m[0] })
        last = m.index + m[0].length
    }
    if (last < text.length)
        parts.push({ kind: "text", value: text.slice(last) })
    return parts
}

function isDarkColor(hex) {
    const h = hex.replace("#", "")
    if (h.length < 6) return false
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 *
 * @framerIntrinsicWidth 1400
 * @framerIntrinsicHeight 1000
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TwitterPostCard(props) {
    const avatarImage = props.avatarImage || ""
    const displayName = props.displayName || "Jane Doe"
    const username = props.username || "@janedoe"
    const verified = props.verified !== undefined ? props.verified : true
    const verifiedType = props.verifiedType || "blue"
    const postContent =
        props.postContent ||
        "Just tried the new product and I'm honestly blown away. This is exactly what I've been looking for! Highly recommend to everyone. #MustHave"
    const timestamp = props.timestamp || "2:15 PM · Apr 27, 2026"
    const replyCount = props.replyCount !== undefined ? props.replyCount : 12
    const repostCount = props.repostCount !== undefined ? props.repostCount : 48
    const likeCount = props.likeCount !== undefined ? props.likeCount : 214
    const cardBackground = props.cardBackground || "#ffffff"
    const borderColor = props.borderColor || "#e2e8f0"
    const borderThickness =
        props.borderThickness !== undefined ? props.borderThickness : 1
    const borderRadius =
        props.borderRadius !== undefined ? props.borderRadius : 16
    const width = props.width !== undefined ? props.width : 540

    const [replies, setReplies] = useState(replyCount)
    const [reposts, setReposts] = useState(repostCount)
    const [likes, setLikes] = useState(likeCount)
    const [replied, setReplied] = useState(false)
    const [reposted, setReposted] = useState(false)
    const [liked, setLiked] = useState(false)
    const [hovered, setHovered] = useState(null)

    const dark = isDarkColor(cardBackground)
    const textColor = dark ? "#e7e9ea" : "#0f1419"
    const mutedColor = dark ? "#71767b" : "#536471"
    const divColor = dark ? "#2f3336" : "#cfd9de"
    const ff =
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

    function handleReply() {
        if (!replied) {
            setReplies(replies + 1)
            setReplied(true)
        } else {
            setReplies(replies - 1)
            setReplied(false)
        }
    }
    function handleRepost() {
        if (!reposted) {
            setReposts(reposts + 1)
            setReposted(true)
        } else {
            setReposts(reposts - 1)
            setReposted(false)
        }
    }
    function handleLike() {
        if (!liked) {
            setLikes(likes + 1)
            setLiked(true)
        } else {
            setLikes(likes - 1)
            setLiked(false)
        }
    }

    function btnColor(key, activeColor, isActive) {
        if (isActive) return activeColor
        if (hovered === key) return activeColor
        return mutedColor
    }
    function btnBg(key) {
        if (hovered !== key) return "transparent"
        if (key === "like") return "rgba(249,24,128,0.10)"
        if (key === "repost") return "rgba(0,186,124,0.10)"
        return "rgba(29,155,240,0.10)"
    }

    const handle = username.startsWith("@") ? username : "@" + username
    const parts = parseContent(postContent)

    return (
        <div
            style={{
                width: width,
                backgroundColor: cardBackground,
                border: borderThickness + "px solid " + borderColor,
                borderRadius: borderRadius,
                padding: "16px 20px 8px 20px",
                boxSizing: "border-box",
                fontFamily: ff,
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                    }}
                >
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            flexShrink: 0,
                            backgroundColor: "#1d9bf0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {avatarImage ? (
                            <img
                                src={avatarImage}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <span
                                style={{
                                    color: "#fff",
                                    fontSize: "20px",
                                    fontWeight: "700",
                                    fontFamily: ff,
                                }}
                            >
                                {displayName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                            }}
                        >
                            <span
                                style={{
                                    fontWeight: "700",
                                    fontSize: "15px",
                                    color: textColor,
                                    lineHeight: "1.3",
                                    fontFamily: ff,
                                }}
                            >
                                {displayName}
                            </span>
                            {verified && verifiedType === "blue" && (
                                <BlueCheckmark />
                            )}
                            {verified && verifiedType === "gold" && (
                                <GoldCheckmark />
                            )}
                        </div>
                        <span
                            style={{
                                fontSize: "14px",
                                color: mutedColor,
                                lineHeight: "1.3",
                                fontFamily: ff,
                            }}
                        >
                            {handle}
                        </span>
                    </div>
                </div>
                <div
                    style={{
                        color: textColor,
                        opacity: 0.85,
                        flexShrink: 0,
                        marginTop: "2px",
                    }}
                >
                    <XLogo />
                </div>
            </div>

            {/* Post body */}
            <div
                style={{
                    marginTop: "14px",
                    fontSize: "15px",
                    lineHeight: "1.65",
                    color: textColor,
                    wordBreak: "break-word",
                    fontFamily: ff,
                }}
            >
                {parts.map(function (part, i) {
                    if (part.kind === "text")
                        return <span key={i}>{part.value}</span>
                    return (
                        <span
                            key={i}
                            style={{ color: "#1d9bf0", cursor: "pointer" }}
                        >
                            {part.value}
                        </span>
                    )
                })}
            </div>

            {/* Timestamp */}
            <div
                style={{
                    marginTop: "14px",
                    fontSize: "14px",
                    color: mutedColor,
                    fontFamily: ff,
                }}
            >
                {timestamp}
            </div>

            {/* Stats row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid " + divColor,
                    fontFamily: ff,
                }}
            >
                <span style={{ fontSize: "14px" }}>
                    <span style={{ fontWeight: "700", color: textColor }}>
                        {formatCount(reposts)}
                    </span>{" "}
                    <span style={{ color: mutedColor }}>Retweets</span>
                </span>
                <span style={{ fontSize: "14px" }}>
                    <span style={{ fontWeight: "700", color: textColor }}>
                        {formatCount(likes)}
                    </span>{" "}
                    <span style={{ color: mutedColor }}>Likes</span>
                </span>
            </div>

            {/* Divider */}
            <div
                style={{
                    borderTop: "1px solid " + divColor,
                    marginTop: "12px",
                }}
            />

            {/* Action buttons */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    paddingTop: "2px",
                }}
            >
                {/* Reply */}
                <button
                    onClick={handleReply}
                    onMouseEnter={function () {
                        setHovered("reply")
                    }}
                    onMouseLeave={function () {
                        setHovered(null)
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "50%",
                        color: btnColor("reply", "#1d9bf0", replied),
                        backgroundColor: btnBg("reply"),
                        transition: "color 0.15s, background-color 0.15s",
                        lineHeight: "0",
                    }}
                >
                    <ReplyIcon />
                </button>

                {/* Repost */}
                <button
                    onClick={handleRepost}
                    onMouseEnter={function () {
                        setHovered("repost")
                    }}
                    onMouseLeave={function () {
                        setHovered(null)
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "50%",
                        color: btnColor("repost", "#00ba7c", reposted),
                        backgroundColor: btnBg("repost"),
                        transition: "color 0.15s, background-color 0.15s",
                        lineHeight: "0",
                    }}
                >
                    <RepostIcon />
                </button>

                {/* Like */}
                <button
                    onClick={handleLike}
                    onMouseEnter={function () {
                        setHovered("like")
                    }}
                    onMouseLeave={function () {
                        setHovered(null)
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "50%",
                        color: btnColor("like", "#f91880", liked),
                        backgroundColor: btnBg("like"),
                        transition: "color 0.15s, background-color 0.15s",
                        lineHeight: "0",
                    }}
                >
                    {liked ? <HeartFilled /> : <HeartOutline />}
                </button>

                {/* Share */}
                <button
                    onMouseEnter={function () {
                        setHovered("share")
                    }}
                    onMouseLeave={function () {
                        setHovered(null)
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: "50%",
                        color: btnColor("share", "#1d9bf0", false),
                        backgroundColor: btnBg("share"),
                        transition: "color 0.15s, background-color 0.15s",
                        lineHeight: "0",
                    }}
                >
                    <ShareIcon />
                </button>
            </div>
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(TwitterPostCard, {
    avatarImage: {
        type: ControlType.Image,
        title: "Avatar Image",
    },
    displayName: {
        type: ControlType.String,
        title: "Display Name",
        defaultValue: "Jane Doe",
    },
    username: {
        type: ControlType.String,
        title: "Username",
        defaultValue: "@janedoe",
    },
    verified: {
        type: ControlType.Boolean,
        title: "Verified Badge",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    verifiedType: {
        type: ControlType.Enum,
        title: "Badge Color",
        options: ["blue", "gold"],
        optionTitles: ["Blue (Individual)", "Gold (Organization)"],
        defaultValue: "blue",
        hidden: function (props) {
            return !props.verified
        },
    },
    postContent: {
        type: ControlType.String,
        title: "Post Content",
        defaultValue:
            "Just tried the new product and I'm honestly blown away. This is exactly what I've been looking for! Highly recommend to everyone. #MustHave",
        multiline: true,
        displayTextArea: true,
    },
    timestamp: {
        type: ControlType.String,
        title: "Timestamp",
        defaultValue: "2:15 PM · Apr 27, 2026",
    },
    replyCount: {
        type: ControlType.Number,
        title: "Reply Count",
        defaultValue: 12,
        min: 0,
    },
    repostCount: {
        type: ControlType.Number,
        title: "Repost Count",
        defaultValue: 48,
        min: 0,
    },
    likeCount: {
        type: ControlType.Number,
        title: "Like Count",
        defaultValue: 214,
        min: 0,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#ffffff",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#e2e8f0",
    },
    borderThickness: {
        type: ControlType.Number,
        title: "Border Thickness",
        defaultValue: 1,
        min: 0,
        max: 8,
        step: 0.5,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    width: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 540,
        min: 320,
        max: 800,
        step: 10,
        unit: "px",
    },
})
