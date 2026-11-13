import React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const DEFAULT_MESSAGES = [
    {
        text: "Hey — your tool completely changed how our team ships 🙌",
        direction: "incoming",
        showStars: false,
    },
    {
        text: "We went from weekly releases to daily. Zero friction.",
        direction: "incoming",
        showStars: false,
    },
    {
        text: "That's amazing to hear!",
        direction: "outgoing",
        showStars: false,
    },
    {
        text: "Honestly 10/10 — recommended it to 4 other teams already.",
        direction: "incoming",
        showStars: true,
    },
]

function Avatar({ initials, bg, color, image, size = 36 }) {
    if (image) {
        const src = typeof image === "string" ? image : image?.src
        const alt = typeof image === "object" ? (image?.alt ?? "") : ""
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    flexShrink: 0,
                    overflow: "hidden",
                }}
            >
                <img
                    src={src}
                    alt={alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>
        )
    }
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: bg,
                color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size * 0.36,
                fontWeight: 500,
                flexShrink: 0,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                userSelect: "none",
            }}
        >
            {initials}
        </div>
    )
}

export default function TextimonialThread({
    // Identity
    name = "Sarah R.",
    role = "Head of Design",
    company = "Notion",

    // Colors
    nameColor = "#ffffff",
    metaColor = "#8E8E93",
    timestampColor = "#8E8E93",
    outgoingColor = "#2196F3",
    incomingColor = "#3a3a3c",
    bubbleTextColor = "#ffffff",
    cardBackground = "#000000",

    // Avatar
    avatarImage = "",
    avatarColor = "#B5D4F4",
    avatarTextColor = "#0C447C",

    // Misc
    timestamp = "Yesterday 2:41 PM",
    rating = 5,

    // Fonts — ControlType.Font returns a style object, NOT a CSS shorthand string.
    // Spread it directly into the style prop alongside other properties.
    nameFont,
    metaFont,
    timestampFont,
    bubbleFont,

    // Messages
    messages,
}) {
    const msgs =
        Array.isArray(messages) && messages.length > 0
            ? messages
            : DEFAULT_MESSAGES

    const initials = name
        .split(" ")
        .map((n) => n[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return (
        <div
            style={{
                width: "100%",
                background: cardBackground,
                borderRadius: 20,
                padding: 16,
                boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                }}
            >
                <Avatar
                    initials={initials}
                    bg={avatarColor}
                    color={avatarTextColor}
                    image={avatarImage}
                    size={36}
                />
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 1 }}
                >
                    <span
                        style={{
                            ...(nameFont || {
                                fontFamily:
                                    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                                fontSize: 13,
                                fontWeight: 500,
                                lineHeight: 1.2,
                            }),
                            color: nameColor,
                        }}
                    >
                        {name}
                    </span>
                    <span
                        style={{
                            ...(metaFont || {
                                fontFamily:
                                    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                                fontSize: 11,
                                fontWeight: 400,
                                lineHeight: 1.2,
                            }),
                            color: metaColor,
                        }}
                    >
                        {role} · {company}
                    </span>
                </div>
            </div>

            {/* Timestamp */}
            <div
                style={{
                    ...(timestampFont || {
                        fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                        fontSize: 12,
                        fontWeight: 400,
                        lineHeight: 1.2,
                    }),
                    color: timestampColor,
                    textAlign: "center",
                    marginBottom: 10,
                }}
            >
                {timestamp}
            </div>

            {/* Bubbles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {msgs.map((msg, i) => {
                    const isOut = msg.direction === "outgoing"
                    const nextMsg = msgs[i + 1]
                    const prevMsg = i > 0 ? msgs[i - 1] : null
                    const isLastInRun =
                        !nextMsg || nextMsg.direction !== msg.direction
                    const bgColor = isOut ? outgoingColor : incomingColor
                    const gapTop =
                        prevMsg && prevMsg.direction !== msg.direction ? 14 : 0

                    const bubble = (
                        <div
                            style={{
                                background: bgColor,
                                color: bubbleTextColor,
                                ...(bubbleFont || {
                                    fontFamily:
                                        "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                                    fontSize: 17,
                                    fontWeight: 400,
                                    lineHeight: 1.4,
                                }),
                                padding: "8px 14px",
                                maxWidth: "75%",
                                wordBreak: "break-word",
                                borderRadius: 22,
                            }}
                        >
                            {msg.text}
                            {msg.showStars && !isOut && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 2,
                                        marginTop: 5,
                                    }}
                                >
                                    {Array.from({ length: 5 }).map((_, si) => (
                                        <svg
                                            key={si}
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill={
                                                si < rating
                                                    ? "#FFD60A"
                                                    : "rgba(255,255,255,0.4)"
                                            }
                                        >
                                            <path d="M6 1l1.236 2.618 2.764.43-2 2.028.472 2.924L6 7.618 3.528 9l.472-2.924-2-2.028 2.764-.43z" />
                                        </svg>
                                    ))}
                                </div>
                            )}
                        </div>
                    )

                    return (
                        <div key={i} style={{ marginTop: gapTop }}>
                            {isOut ? (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-end",
                                        justifyContent: "flex-end",
                                        gap: 2,
                                    }}
                                >
                                    {bubble}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-end",
                                        gap: 2,
                                    }}
                                >
                                    <div style={{ width: 30, flexShrink: 0 }}>
                                        {isLastInRun && (
                                            <Avatar
                                                initials={initials}
                                                bg={avatarColor}
                                                color={avatarTextColor}
                                                image={avatarImage}
                                                size={24}
                                            />
                                        )}
                                    </div>
                                    {bubble}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(TextimonialThread, {
    // ─── Identity ────────────────────────────────────────────────
    name: { type: ControlType.String, title: "Name", defaultValue: "Sarah R." },
    role: {
        type: ControlType.String,
        title: "Role",
        defaultValue: "Head of Design",
    },
    company: {
        type: ControlType.String,
        title: "Company",
        defaultValue: "Notion",
    },

    // ─── Avatar ──────────────────────────────────────────────────
    avatarImage: { type: ControlType.ResponsiveImage, title: "Avatar image" },
    avatarColor: {
        type: ControlType.Color,
        title: "Avatar bg",
        defaultValue: "#B5D4F4",
        hidden: (props) => !!props.avatarImage,
    },
    avatarTextColor: {
        type: ControlType.Color,
        title: "Avatar text",
        defaultValue: "#0C447C",
        hidden: (props) => !!props.avatarImage,
    },

    // ─── Colors ──────────────────────────────────────────────────
    cardBackground: {
        type: ControlType.Color,
        title: "Card bg",
        defaultValue: "#000000",
    },
    nameColor: {
        type: ControlType.Color,
        title: "Name color",
        defaultValue: "#ffffff",
    },
    metaColor: {
        type: ControlType.Color,
        title: "Role & company color",
        defaultValue: "#8E8E93",
    },
    timestampColor: {
        type: ControlType.Color,
        title: "Timestamp color",
        defaultValue: "#8E8E93",
    },
    outgoingColor: {
        type: ControlType.Color,
        title: "Outgoing bubble color",
        defaultValue: "#2196F3",
    },
    incomingColor: {
        type: ControlType.Color,
        title: "Incoming bubble color",
        defaultValue: "#3a3a3c",
    },
    bubbleTextColor: {
        type: ControlType.Color,
        title: "Bubble text color",
        defaultValue: "#ffffff",
    },

    // ─── Misc ────────────────────────────────────────────────────
    timestamp: {
        type: ControlType.String,
        title: "Timestamp",
        defaultValue: "Yesterday 2:41 PM",
    },
    rating: {
        type: ControlType.Number,
        title: "Stars (1–5)",
        defaultValue: 5,
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
    },

    // ─── Fonts ───────────────────────────────────────────────────
    nameFont: {
        type: ControlType.Font,
        title: "Name font",
        controls: "extended",
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta font",
        controls: "extended",
    },
    timestampFont: {
        type: ControlType.Font,
        title: "Timestamp font",
        controls: "extended",
    },
    bubbleFont: {
        type: ControlType.Font,
        title: "Bubble font",
        controls: "extended",
    },

    // ─── Messages ────────────────────────────────────────────────
    messages: {
        type: ControlType.Array,
        title: "Messages",
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "Type your message here...",
                    displayTextArea: true,
                },
                direction: {
                    type: ControlType.Enum,
                    title: "Direction",
                    defaultValue: "incoming",
                    options: ["incoming", "outgoing"],
                    optionTitles: ["Incoming ←", "Outgoing →"],
                },
                showStars: {
                    hidden: (props) => props.direction === "outgoing",
                    type: ControlType.Boolean,
                    title: "⭐ Star rating",
                    defaultValue: false,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },
            },
        },
        defaultValue: DEFAULT_MESSAGES,
        description:
            "Get more Framer stuff at [Framerbitz](https://contra.com/AndrewNorman/products?r=AndrewNorman/)",
    },
})
