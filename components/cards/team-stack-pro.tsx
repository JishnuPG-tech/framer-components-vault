import React, { useState } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MemberItem {
    name: string
    bio: string
    tag: string
    mediaType: "color" | "image" | "video"
    bgColor: string
    image: string
    videoUrl: string
    profileUrl?: string
}

interface TeamCarouselProps {
    members: MemberItem[]
    cardWidth: number
    cardHeight: number
    gap: number
    cardRadius: number
    cardBgType: "color" | "image"
    cardBgColor: string
    cardBgImage: string
    cardOpacity: number
    cardGlassEffect: boolean
    cardBlurAmount: number
    infoBgType: "color" | "image"
    infoBgColor: string
    infoBgImage: string
    infoTitleColor: string
    infoBioColor: string
    infoOpacity: number
    infoGlassEffect: boolean
    infoBlurAmount: number
    accentColor: string
    showNav: boolean
    navBgColor: string
    navArrowColor: string
    navOpacity: number
    navRadius: number
    navGlassEffect: boolean
    navBlurAmount: number
}

export default function TeamCarousel({
    members = [],
    cardWidth = 324,
    cardHeight = 478,
    gap = 34,
    cardRadius = 1,
    cardBgType = "color",
    cardBgColor = "#FFFFFF",
    cardBgImage = "",
    cardOpacity = 1,
    cardGlassEffect = false,
    cardBlurAmount = 10,
    infoBgType = "color",
    infoBgColor = "#FFFFFF",
    infoBgImage = "",
    infoTitleColor = "#000000",
    infoBioColor = "rgba(0, 0, 0, 0.8)",
    infoOpacity = 1,
    infoGlassEffect = false,
    infoBlurAmount = 10,
    accentColor = "#111111",
    showNav = true,
    navBgColor = "rgba(255, 255, 255, 0.75)",
    navArrowColor = "#000000",
    navOpacity = 1,
    navRadius = 999,
    navGlassEffect = true,
    navBlurAmount = 10,
}: TeamCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const isStatic = RenderTarget.current() === RenderTarget.canvas

    const safeMembers =
        members && members.length > 0
            ? members
            : TeamCarousel.defaultProps.members

    const handleNext = () => {
        if (safeMembers.length === 0) return
        setCurrentIndex((prev) => (prev + 1) % safeMembers.length)
    }

    const handlePrev = () => {
        if (safeMembers.length === 0) return
        setCurrentIndex(
            (prev) => (prev - 1 + safeMembers.length) % safeMembers.length
        )
    }

    const translateX = -(currentIndex * (cardWidth + gap))

    const getCardBackgroundStyle = () => {
        if (cardBgType === "image" && cardBgImage) {
            return {
                backgroundImage: `url(${cardBgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }
        }
        return { backgroundColor: cardBgColor }
    }

    const getInfoBackgroundStyle = () => {
        if (infoBgType === "image" && infoBgImage) {
            return {
                backgroundImage: `url(${infoBgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }
        }
        return { backgroundColor: infoBgColor }
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                background: "transparent",
            }}
        >
            {showNav && (
                <>
                    <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Previous"
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: navRadius,
                            border: "1px solid rgba(0,0,0,0.06)",
                            background: navBgColor,
                            opacity: navOpacity,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                            backdropFilter: navGlassEffect
                                ? `blur(${navBlurAmount}px)`
                                : "none",
                            WebkitBackdropFilter: navGlassEffect
                                ? `blur(${navBlurAmount}px)`
                                : "none",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                            position: "absolute",
                            left: 18,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                            transition: "all 0.2s ease",
                        }}
                    >
                        <svg
                            width="21"
                            height="21"
                            viewBox="0 0 24 24"
                            style={{ transform: "rotate(180deg)" }}
                        >
                            <path
                                d="M9 18l6-6-6-6"
                                fill="none"
                                stroke={navArrowColor}
                                strokeWidth="2.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Next"
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: navRadius,
                            border: "1px solid rgba(0,0,0,0.06)",
                            background: navBgColor,
                            opacity: navOpacity,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                            backdropFilter: navGlassEffect
                                ? `blur(${navBlurAmount}px)`
                                : "none",
                            WebkitBackdropFilter: navGlassEffect
                                ? `blur(${navBlurAmount}px)`
                                : "none",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                            position: "absolute",
                            right: 18,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                            transition: "all 0.2s ease",
                        }}
                    >
                        <svg width="21" height="21" viewBox="0 0 24 24">
                            <path
                                d="M9 18l6-6-6-6"
                                fill="none"
                                stroke={navArrowColor}
                                strokeWidth="2.25"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </>
            )}

            <div
                style={{
                    width: "100%",
                    height: "100%",
                    padding: "48px 0",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <motion.div
                    animate={{ x: translateX }}
                    transition={
                        isStatic
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 300, damping: 30 }
                    }
                    style={{
                        display: "flex",
                        gap: gap,
                        paddingLeft: `calc(50% - ${cardWidth / 2}px)`,
                    }}
                >
                    {safeMembers.map((member, idx) => {
                        const isActive = idx === currentIndex
                        const isHovered = hoveredIndex === idx
                        const showDetails = isActive || isHovered

                        return (
                            <motion.article
                                key={idx}
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                onClick={() => setCurrentIndex(idx)}
                                animate={{
                                    scale: showDetails ? 1.02 : 0.97,
                                    y: showDetails ? -4 : 0,
                                }}
                                transition={
                                    isStatic
                                        ? { duration: 0 }
                                        : { duration: 0.3 }
                                }
                                style={{
                                    position: "relative",
                                    width: cardWidth,
                                    height: cardHeight,
                                    flex: "0 0 auto",
                                    borderRadius: cardRadius,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    opacity: cardOpacity,
                                    boxShadow:
                                        "0px 10px 30px rgba(0, 0, 0, 0.06)",
                                    backdropFilter: cardGlassEffect
                                        ? `blur(${cardBlurAmount}px)`
                                        : "none",
                                    WebkitBackdropFilter: cardGlassEffect
                                        ? `blur(${cardBlurAmount}px)`
                                        : "none",
                                    ...getCardBackgroundStyle(),
                                }}
                            >
                                <motion.div
                                    animate={{
                                        height: showDetails
                                            ? "calc(56% - 10px)"
                                            : "calc(100% - 20px)",
                                    }}
                                    transition={
                                        isStatic
                                            ? { duration: 0 }
                                            : {
                                                  duration: 0.35,
                                                  ease: [0.16, 1, 0.3, 1],
                                              }
                                    }
                                    style={{
                                        position: "absolute",
                                        top: 10,
                                        left: 10,
                                        right: 10,
                                        overflow: "hidden",
                                        borderRadius: Math.max(
                                            0,
                                            cardRadius - 10
                                        ),
                                        zIndex: 2,
                                        backgroundColor:
                                            member.bgColor || "#222222",
                                    }}
                                >
                                    {member.mediaType === "image" &&
                                        member.image && (
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    objectPosition: "center",
                                                }}
                                            />
                                        )}

                                    {member.mediaType === "video" &&
                                        member.videoUrl && (
                                            <video
                                                src={member.videoUrl}
                                                autoPlay={!isStatic}
                                                loop
                                                muted
                                                playsInline
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        )}
                                </motion.div>

                                <motion.div
                                    animate={{
                                        opacity: showDetails ? infoOpacity : 0,
                                        y: showDetails ? 0 : 18,
                                    }}
                                    transition={
                                        isStatic
                                            ? { duration: 0 }
                                            : { duration: 0.3, ease: "easeOut" }
                                    }
                                    style={{
                                        position: "absolute",
                                        inset: "56% 0px 0px",
                                        borderRadius: `0 0 ${cardRadius}px ${cardRadius}px`,
                                        padding: "20px 22px 22px",
                                        zIndex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                        backdropFilter: infoGlassEffect
                                            ? `blur(${infoBlurAmount}px)`
                                            : "none",
                                        WebkitBackdropFilter: infoGlassEffect
                                            ? `blur(${infoBlurAmount}px)`
                                            : "none",
                                        ...getInfoBackgroundStyle(),
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: 22,
                                            fontWeight: 600,
                                            margin: 0,
                                            color: infoTitleColor,
                                        }}
                                    >
                                        {member.name}
                                    </h3>
                                    <p
                                        style={{
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: infoBioColor,
                                            marginTop: 6,
                                            marginBottom: 0,
                                            lineHeight: 1.35,
                                        }}
                                    >
                                        {member.bio}
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            marginTop: 14,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 500,
                                                padding: "6px 10px",
                                                borderRadius: 999,
                                                background: "#F5F5F5",
                                                color: "#000000",
                                            }}
                                        >
                                            {member.tag}
                                        </span>
                                        <a
                                            href={
                                                typeof member.profileUrl ===
                                                "string"
                                                    ? member.profileUrl
                                                    : "#"
                                            }
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                padding: "8px 12px",
                                                borderRadius: 999,
                                                background: accentColor,
                                                color: "#FFF",
                                                textDecoration: "none",
                                            }}
                                        >
                                            View Profile
                                        </a>
                                    </div>
                                </motion.div>
                            </motion.article>
                        )
                    })}
                </motion.div>
            </div>
        </div>
    )
}

TeamCarousel.defaultProps = {
    cardWidth: 324,
    cardHeight: 478,
    gap: 34,
    cardRadius: 1,
    cardBgType: "color",
    cardBgColor: "#FFFFFF",
    cardOpacity: 1,
    cardGlassEffect: false,
    cardBlurAmount: 10,
    infoBgType: "color",
    infoBgColor: "#FFFFFF",
    infoTitleColor: "#000000",
    infoBioColor: "rgba(0, 0, 0, 0.8)",
    infoOpacity: 1,
    infoGlassEffect: false,
    infoBlurAmount: 10,
    accentColor: "#111111",
    showNav: true,
    navBgColor: "rgba(255, 255, 255, 0.75)",
    navArrowColor: "#000000",
    navOpacity: 1,
    navRadius: 999,
    navGlassEffect: true,
    navBlurAmount: 10,
    members: [
        {
            name: "Name One",
            bio: "Type your bio or short description here...",
            tag: "Add a Tag",
            mediaType: "color",
            bgColor: "#1A1A1A",
            image: "",
            videoUrl: "",
        },
        {
            name: "Name Two",
            bio: "Type your bio or short description here...",
            tag: "Add a Tag",
            mediaType: "color",
            bgColor: "#0A192F",
            image: "",
            videoUrl: "",
        },
        {
            name: "Name Three",
            bio: "Type your bio or short description here...",
            tag: "Add a Tag",
            mediaType: "color",
            bgColor: "#2C1D11",
            image: "",
            videoUrl: "",
        },
    ],
}

addPropertyControls(TeamCarousel, {
    members: {
        type: ControlType.Array,
        title: "Members",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Name Item",
                },
                bio: {
                    type: ControlType.String,
                    title: "Bio",
                    defaultValue: "Type your bio or short description here...",
                },
                tag: {
                    type: ControlType.String,
                    title: "Tag",
                    defaultValue: "Add a Tag",
                },
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media Type",
                    options: ["color", "image", "video"],
                    optionTitles: ["Solid Color", "Image", "Video"],
                    defaultValue: "color",
                },
                bgColor: {
                    type: ControlType.Color,
                    title: "Bg Color",
                    defaultValue: "#1A1A1A",
                    hidden(props) {
                        return props.mediaType !== "color"
                    },
                },
                image: {
                    type: ControlType.Image,
                    title: "Photo",
                    hidden(props) {
                        return props.mediaType !== "image"
                    },
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://example.com/video.mp4",
                    hidden(props) {
                        return props.mediaType !== "video"
                    },
                },
                profileUrl: { type: ControlType.Link, title: "Profile Link" },
            },
        },
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 200,
        max: 600,
        step: 10,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 300,
        max: 800,
        step: 10,
    },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 100, step: 2 },
    accentColor: { type: ControlType.Color, title: "Button Color" },

    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 1,
        min: 0,
        max: 60,
        step: 1,
    },
    cardBgType: {
        type: ControlType.Enum,
        title: "Card Bg Type",
        options: ["color", "image"],
        optionTitles: ["Color", "Image"],
        defaultValue: "color",
    },
    cardBgColor: {
        type: ControlType.Color,
        title: "Card Bg Color",
        defaultValue: "#FFFFFF",
        hidden(props) {
            return props.cardBgType !== "color"
        },
    },
    cardBgImage: {
        type: ControlType.Image,
        title: "Card Bg Image",
        hidden(props) {
            return props.cardBgType !== "image"
        },
    },
    cardOpacity: {
        type: ControlType.Number,
        title: "Card Opacity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 1,
    },
    cardGlassEffect: {
        type: ControlType.Boolean,
        title: "Card Glass",
        defaultValue: false,
    },
    cardBlurAmount: {
        type: ControlType.Number,
        title: "Card Blur",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 10,
        hidden(props) {
            return !props.cardGlassEffect
        },
    },
    infoBgType: {
        type: ControlType.Enum,
        title: "Info Bg Type",
        options: ["color", "image"],
        optionTitles: ["Color", "Image"],
        defaultValue: "color",
    },
    infoBgColor: {
        type: ControlType.Color,
        title: "Info Bg Color",
        defaultValue: "#FFFFFF",
        hidden(props) {
            return props.infoBgType !== "color"
        },
    },
    infoBgImage: {
        type: ControlType.Image,
        title: "Info Bg Image",
        hidden(props) {
            return props.infoBgType !== "image"
        },
    },
    infoTitleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
    },
    infoBioColor: {
        type: ControlType.Color,
        title: "Bio Color",
        defaultValue: "rgba(0, 0, 0, 0.8)",
    },
    infoOpacity: {
        type: ControlType.Number,
        title: "Info Opacity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 1,
    },
    infoGlassEffect: {
        type: ControlType.Boolean,
        title: "Info Glass",
        defaultValue: false,
    },
    infoBlurAmount: {
        type: ControlType.Number,
        title: "Info Blur",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 10,
        hidden(props) {
            return !props.infoGlassEffect
        },
    },
    showNav: {
        type: ControlType.Boolean,
        title: "Show Nav",
        defaultValue: true,
    },
    navBgColor: {
        type: ControlType.Color,
        title: "Nav Bg",
        defaultValue: "rgba(255, 255, 255, 0.75)",
        hidden(props) {
            return !props.showNav
        },
    },
    navArrowColor: {
        type: ControlType.Color,
        title: "Nav Arrow",
        defaultValue: "#000000",
        hidden(props) {
            return !props.showNav
        },
    },
    navOpacity: {
        type: ControlType.Number,
        title: "Nav Opacity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 1,
        hidden(props) {
            return !props.showNav
        },
    },
    navRadius: {
        type: ControlType.Number,
        title: "Nav Radius",
        min: 0,
        max: 999,
        step: 1,
        defaultValue: 999,
        hidden(props) {
            return !props.showNav
        },
    },
    navGlassEffect: {
        type: ControlType.Boolean,
        title: "Nav Glass",
        defaultValue: true,
        hidden(props) {
            return !props.showNav
        },
    },
    navBlurAmount: {
        type: ControlType.Number,
        title: "Nav Blur",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 10,
        hidden(props) {
            return !props.showNav || !props.navGlassEffect
        },
    },
})
