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

import { motion } from "framer-motion"

export interface RatingProps {
    activeColor: string
    inactiveColor: string
    ratingValue: number
    amount: number
    size: number
    icon: "Default" | "Feather"
    featherIcon: string
    style?: React.CSSProperties
}

/**
 * A star rating component with customizable properties
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function Rating(props: RatingProps) {
    const {
        activeColor,
        inactiveColor,
        ratingValue,
        amount,
        size,
        icon,
        featherIcon,
        style,
    } = props

    // Generate the stars based on the 'amount' prop
    const stars = Array.from({ length: amount }, (_, i) => i + 1)

    // Create gradient IDs safely for server-side rendering
    const getHalfStarGradientId = (starValue: number, isFeather: boolean) => {
        return `halfStar${isFeather ? "Feather" : ""}${starValue}`
    }

    // Function to render the appropriate Feather icon path
    const renderFeatherIcon = (iconName: string) => {
        // Map of Feather icon names to their SVG path data
        const featherIcons: Record<string, React.ReactNode> = {
            star: (
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            ),
            heart: (
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            ),
            circle: <circle cx="12" cy="12" r="10" />,
            square: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
            "thumbs-up": (
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            ),
            "alert-circle": (
                <>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </>
            ),
            award: (
                <>
                    <circle cx="12" cy="8" r="7"></circle>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </>
            ),
            bell: (
                <>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </>
            ),
            bookmark: (
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            ),
            check: <polyline points="20 6 9 17 4 12"></polyline>,
            "check-circle": (
                <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </>
            ),
            coffee: (
                <>
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                </>
            ),
            flag: (
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            ),
            gift: (
                <>
                    <polyline points="20 12 20 22 4 22 4 12"></polyline>
                    <rect x="2" y="7" width="20" height="5"></rect>
                    <line x1="12" y1="22" x2="12" y2="7"></line>
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                </>
            ),
            home: (
                <>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </>
            ),
            music: (
                <>
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                </>
            ),
            smile: (
                <>
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </>
            ),
            sun: (
                <>
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </>
            ),
            "thumbs-down": (
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
            ),
            trophy: (
                <>
                    <path d="M2.5 2v8h3.5a4.5 4.5 0 0 0 4.5-4.5V2"></path>
                    <path d="M21.5 2v8h-3.5a4.5 4.5 0 0 1-4.5-4.5V2"></path>
                    <line x1="12" y1="2" x2="12" y2="16"></line>
                    <path d="M8 16l4 6 4-6"></path>
                </>
            ),
            zap: (
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            ),
        }

        // Return the icon if it exists, or default to star
        return featherIcons[iconName] || featherIcons["star"]
    }

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                padding: "10px",
                borderRadius: "8px",
                ...style,
            }}
        >
            <div style={{ display: "flex", alignItems: "center" }}>
                {stars.map((starValue) => {
                    const isActive = starValue <= ratingValue
                    const isHalfStar =
                        !Number.isInteger(ratingValue) &&
                        starValue === Math.ceil(ratingValue)

                    const gradientId = getHalfStarGradientId(
                        starValue,
                        icon === "Feather"
                    )

                    return (
                        <div
                            key={starValue}
                            style={{
                                position: "relative",
                                width: size,
                                height: size,
                                margin: "0 2px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            {icon === "Default" ? (
                                <svg
                                    width={size}
                                    height={size}
                                    viewBox="0 0 24 24"
                                    fill={
                                        isActive ? activeColor : inactiveColor
                                    }
                                    style={{
                                        transform: isActive
                                            ? "scale(1.1)"
                                            : "scale(1)",
                                    }}
                                >
                                    {isHalfStar ? (
                                        <>
                                            <defs>
                                                <linearGradient
                                                    id={gradientId}
                                                    x1="0%"
                                                    y1="0%"
                                                    x2="100%"
                                                    y2="0%"
                                                >
                                                    {typeof window !==
                                                        "undefined" && (
                                                        <>
                                                            <stop
                                                                offset="50%"
                                                                stopColor={
                                                                    activeColor
                                                                }
                                                            />
                                                            <stop
                                                                offset="50%"
                                                                stopColor={
                                                                    inactiveColor
                                                                }
                                                            />
                                                        </>
                                                    )}
                                                </linearGradient>
                                            </defs>
                                            <path
                                                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                                                fill={
                                                    typeof window !==
                                                    "undefined"
                                                        ? `url(#${gradientId})`
                                                        : inactiveColor
                                                }
                                            />
                                        </>
                                    ) : (
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    )}
                                </svg>
                            ) : (
                                <svg
                                    width={size}
                                    height={size}
                                    viewBox="0 0 24 24"
                                    stroke={
                                        isActive ? activeColor : inactiveColor
                                    }
                                    fill={isActive ? activeColor : "none"}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        transform: isActive
                                            ? "scale(1.1)"
                                            : "scale(1)",
                                    }}
                                >
                                    {isHalfStar ? (
                                        <>
                                            <defs>
                                                <linearGradient
                                                    id={gradientId}
                                                    x1="0%"
                                                    y1="0%"
                                                    x2="100%"
                                                    y2="0%"
                                                >
                                                    {typeof window !==
                                                        "undefined" && (
                                                        <>
                                                            <stop
                                                                offset="50%"
                                                                stopColor={
                                                                    activeColor
                                                                }
                                                            />
                                                            <stop
                                                                offset="50%"
                                                                stopColor="transparent"
                                                            />
                                                        </>
                                                    )}
                                                </linearGradient>
                                            </defs>
                                            <g
                                                fill={
                                                    typeof window !==
                                                    "undefined"
                                                        ? `url(#${gradientId})`
                                                        : "none"
                                                }
                                            >
                                                {renderFeatherIcon(featherIcon)}
                                            </g>
                                        </>
                                    ) : (
                                        renderFeatherIcon(featherIcon)
                                    )}
                                </svg>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(Rating, {
    activeColor: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: "#F1C21B",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive",
        defaultValue: "#E5E5E5",
    },
    ratingValue: {
        type: ControlType.Number,
        title: "Rating",
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 0.5,
    },
    amount: {
        type: ControlType.Number,
        title: "Amount",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 1,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 24,
        min: 10,
        max: 100,
        step: 1,
    },
    icon: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["Default", "Feather"],
        defaultValue: "Default",
        displaySegmentedControl: true,
    },
    featherIcon: {
        type: ControlType.Enum,
        title: "Feather Icon",
        options: [
            "star",
            "heart",
            "circle",
            "square",
            "thumbs-up",
            "alert-circle",
            "award",
            "bell",
            "bookmark",
            "check",
            "check-circle",
            "coffee",
            "flag",
            "gift",
            "home",
            "music",
            "smile",
            "sun",
            "thumbs-down",
            "trophy",
            "zap",
        ],
        defaultValue: "star",
        hidden: ({ icon }) => icon !== "Feather",
    },
})
