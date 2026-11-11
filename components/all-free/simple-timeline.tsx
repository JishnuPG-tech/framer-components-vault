// Timeline component for Sofia Crypto Week with horizontal desktop layout and vertical mobile layout
// Desktop: horizontal timeline with hover interactions
// Mobile: vertical scrollable timeline
// Events: Sept 19 (Workshop), Sept 20-22 (Hackathon), Sept 23 (Conference), Sept 24 (Interoperability)

import { useState, startTransition, useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TimelineEvent {
    date: string
    title: string
    description: string
}

interface SimpleTimelineProps {
    backgroundColor: string
    lineColor: string
    dotColor: string
    activeDotColor: string
    textColor: string
    activeTextColor: string
    cardBackground: string
    dateFont: any
    titleFont: any
    descriptionFont: any
    mobileBreakpoint: number
    tabletBreakpoint: number
    events: TimelineEvent[]
    style?: CSSProperties
}

/**
 * Sofia Crypto Week Timeline
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SimpleTimeline(props: SimpleTimelineProps) {
    const {
        backgroundColor,
        lineColor,
        dotColor,
        activeDotColor,
        textColor,
        activeTextColor,
        cardBackground,
        dateFont,
        titleFont,
        descriptionFont,
        mobileBreakpoint,
        tabletBreakpoint,
    } = props

    const events: TimelineEvent[] = props.events?.length ? props.events : [
        {
            date: "Date 1",
            title: "Title 1",
            description: "Description 1",
        },
        {
            date: "Date 2",
            title: "Title 2",
            description: "Description 2",
        },
        {
            date: "Date 3",
            title: "Title 3",
            description: "Description 3",
        },
        {
            date: "Date 4",
            title: "Title 4",
            description: "Description 4",
        },
        {
            date: "Date 5",
            title: "Title 5",
            description: "Description 5",
        },
    ]

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)
    const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set())
    const eventRefs = useRef<(HTMLDivElement | null)[]>([])

    // Detect mobile on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkMobile = () => {
                const width = window.innerWidth
                startTransition(() => {
                    setIsMobile(width < mobileBreakpoint)
                    setIsTablet(width >= mobileBreakpoint && width < tabletBreakpoint)
                })
            }
            checkMobile()
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        } else {
            // Framer Canvas/Editor: always show desktop version
            startTransition(() => {
                setIsMobile(false)
                setIsTablet(false)
            })
        }
    }, [mobileBreakpoint, tabletBreakpoint])

    // Intersection Observer for scroll-based reveal
    useEffect(() => {
        if (!isMobile && !isTablet) return

        if (typeof window === "undefined") return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const index = Number(entry.target.getAttribute("data-index"))
                    if (entry.isIntersecting) {
                        startTransition(() => {
                            setVisibleIndices((prev) => new Set(prev).add(index))
                        })
                    }
                })
            },
            {
                threshold: 0.5,
                rootMargin: "-20% 0px -20% 0px",
            }
        )

        eventRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref)
        })

        return () => observer.disconnect()
    }, [isMobile, isTablet])

    const handleMouseEnter = (index: number) => {
        if (!isMobile) {
            startTransition(() => setHoveredIndex(index))
        }
    }

    const handleMouseLeave = () => {
        if (!isMobile) {
            startTransition(() => setHoveredIndex(null))
        }
    }

    if (isMobile || isTablet) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    padding: "40px 20px",
                    display: "flex",
                    justifyContent: "center",
                    overflow: "auto",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "60px",
                        maxWidth: isTablet ? "600px" : "100%",
                        width: "100%",
                    }}
                >
                    {/* Vertical line */}
                    <div
                        style={{
                            position: "absolute",
                            left: "20px",
                            top: "0",
                            bottom: "0",
                            width: "4px",
                            backgroundColor: lineColor,
                            background: `linear-gradient(180deg, ${lineColor}00 0%, ${lineColor} 10%, ${lineColor} 90%, ${lineColor}00 100%)`,
                            boxShadow: `0 0 10px ${activeDotColor}40`,
                        }}
                    />

                    {events.map((event, index) => {
                        const isVisible = visibleIndices.has(index)
                        return (
                            <div
                                key={index}
                                ref={(el) => (eventRefs.current[index] = el)}
                                data-index={index}
                                style={{
                                    position: "relative",
                                    paddingLeft: "60px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                    transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                                    opacity: isVisible ? 1 : 0.3,
                                    transform: isVisible ? "translateX(0)" : "translateX(-20px)",
                                }}
                            >
                                {/* Dot */}
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "8px",
                                        top: "4px",
                                        width: isVisible ? "28px" : "20px",
                                        height: isVisible ? "28px" : "20px",
                                        borderRadius: "50%",
                                        backgroundColor: isVisible ? activeDotColor : dotColor,
                                        border: `4px solid ${backgroundColor}`,
                                        boxShadow: isVisible
                                            ? `0 0 0 3px ${lineColor}, 0 0 30px ${activeDotColor}80, 0 0 60px ${activeDotColor}40`
                                            : `0 0 0 3px ${lineColor}`,
                                        transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                                        animation: isVisible ? "pulse 2s ease-in-out infinite" : "none",
                                    }}
                                />

                                {/* Content */}
                                <div
                                    style={{
                                        ...dateFont,
                                        color: isVisible ? activeTextColor : textColor,
                                        transition: "color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                                        textShadow: isVisible ? `0 0 10px ${activeDotColor}40` : "none",
                                    }}
                                >
                                    {event.date}
                                </div>
                                <div
                                    style={{
                                        ...titleFont,
                                        color: isVisible ? activeTextColor : textColor,
                                        transition: "color 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                                        textShadow: isVisible ? `0 0 10px ${activeDotColor}30` : "none",
                                    }}
                                >
                                    {event.title}
                                </div>
                                <div
                                    style={{
                                        ...descriptionFont,
                                        color: textColor,
                                        opacity: isVisible ? 0.8 : 0,
                                        maxHeight: isVisible ? "200px" : "0",
                                        overflow: "hidden",
                                        transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                >
                                    {event.description}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.1); opacity: 0.8; }
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 40px",
                position: "relative",
            }}
        >
            {/* Animated background gradient */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at 50% 50%, ${activeDotColor}05 0%, transparent 70%)`,
                    animation: "breathe 4s ease-in-out infinite",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "1200px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* Horizontal line with gradient */}
                <div
                    style={{
                        position: "absolute",
                        left: `${(1 / events.length) * 50}%`,
                        right: `${(1 / events.length) * 50}%`,
                        top: "50%",
                        height: "3px",
                        background: `linear-gradient(90deg, ${lineColor} 0%, ${lineColor} 100%)`,
                        transform: "translateY(-50%)",
                        boxShadow: `0 0 10px ${activeDotColor}30`,
                    }}
                />

                {/* Animated progress line */}
                <div
                    style={{
                        position: "absolute",
                        left: `${(1 / events.length) * 50}%`,
                        top: "50%",
                        height: "3px",
                        width: hoveredIndex !== null ? `${((hoveredIndex) / (events.length - 1)) * (100 - (100 / events.length))}%` : "0%",
                        background: `linear-gradient(90deg, ${activeDotColor}, ${activeDotColor}80)`,
                        transform: "translateY(-50%)",
                        transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: `0 0 15px ${activeDotColor}60`,
                    }}
                />

                {events.map((event, index) => {
                    const isHovered = hoveredIndex === index
                    return (
                        <div
                            key={index}
                            style={{
                                position: "relative",
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "pointer",
                                zIndex: isHovered ? 10 : 1,
                            }}
                            onMouseEnter={() => handleMouseEnter(index)}
                            onMouseLeave={handleMouseLeave}
                        >
                            {/* Dot with glow */}
                            <div
                                style={{
                                    width: isHovered ? "36px" : "24px",
                                    height: isHovered ? "36px" : "24px",
                                    borderRadius: "50%",
                                    backgroundColor: isHovered ? activeDotColor : dotColor,
                                    border: `4px solid ${backgroundColor}`,
                                    boxShadow: isHovered
                                        ? `0 0 0 4px ${lineColor}, 0 0 35px ${activeDotColor}, 0 0 70px ${activeDotColor}60`
                                        : `0 0 0 3px ${lineColor}, 0 0 15px ${dotColor}40`,
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    marginBottom: "20px",
                                    animation: isHovered ? "pulse 1.5s ease-in-out infinite" : "none",
                                }}
                            />

                            {/* Date - positioned lower */}
                            <div
                                style={{
                                    ...dateFont,
                                    color: isHovered ? activeTextColor : textColor,
                                    marginBottom: "12px",
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    textAlign: "center",
                                    textShadow: isHovered ? `0 0 15px ${activeDotColor}50` : "none",
                                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                                }}
                            >
                                {event.date}
                            </div>

                            {/* Title - always visible */}
                            <div
                                style={{
                                    ...titleFont,
                                    color: isHovered ? activeTextColor : textColor,
                                    marginBottom: isHovered ? "12px" : "0",
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    textAlign: "center",
                                    opacity: isHovered ? 1 : 0.7,
                                    textShadow: isHovered ? `0 0 12px ${activeDotColor}40` : "none",
                                    transform: isHovered ? "translateY(-5px) scale(1.05)" : "translateY(0) scale(1)",
                                }}
                            >
                                {event.title}
                            </div>

                            {/* Description card - shown on hover with futuristic styling */}
                            <div
                                style={{
                                    marginTop: "8px",
                                    ...descriptionFont,
                                    color: textColor,
                                    textAlign: "center",
                                    opacity: isHovered ? 0.8 : 0.5,
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    maxWidth: "280px",
                                }}
                            >
                                {event.description}
                            </div>
                        </div>
                    )
                })}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.15); opacity: 0.85; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0; 
                        transform: translateX(-50%) translateY(10px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(-50%) translateY(0); 
                    }
                }
                @keyframes breathe {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    )
}

addPropertyControls(SimpleTimeline, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#EEEEEE",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#CCCCCC",
    },
    activeDotColor: {
        type: ControlType.Color,
        title: "Active Dot",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Active Text",
        defaultValue: "#000000",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    dateFont: {
        type: ControlType.Font,
        title: "Date Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    events: {
        type: ControlType.Array,
        title: "Events",
        control: {
            type: ControlType.Object,
            controls: {
                date: { type: ControlType.String, title: "Date", defaultValue: "Date" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Title" },
                description: { type: ControlType.String, title: "Description", defaultValue: "Description" },
            },
        },
        maxCount: 8,
        defaultValue: [
            { date: "Date 1", title: "Title 1", description: "Description 1" },
            { date: "Date 2", title: "Title 2", description: "Description 2" },
            { date: "Date 3", title: "Title 3", description: "Description 3" },
            { date: "Date 4", title: "Title 4", description: "Description 4" },
            { date: "Date 5", title: "Title 5", description: "Description 5" },
        ],
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 768,
        min: 320,
        max: 1024,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Breakpoint",
        defaultValue: 1024,
        min: 768,
        max: 1920,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
})