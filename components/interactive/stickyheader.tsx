// Minimalist sticky section header with scroll-linked progress indicator
import { useEffect, useState, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useScroll, useTransform } from "framer-motion"

interface StickyHeaderProps {
    title: string
    titleFont: any
    titleColor: string
    backgroundColor: string
    trackColor: string
    progressColor: string
    strokeColor: string
    lineWidth: number
    leftPadding: number
    rightPadding: number
    speed: number
    style?: CSSProperties
}

/**
 * Sticky Section Header with Scroll Progress
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 80
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function StickyHeader(props: StickyHeaderProps) {
    const {
        title = "About Us",
        titleFont,
        titleColor = "#1A1A1A",
        backgroundColor = "#FFFFFF",
        trackColor = "#E5E5E5",
        progressColor = "#1A1A1A",
        strokeColor = "#E5E5E5",
        lineWidth = 2,
        leftPadding = 32,
        rightPadding = 32,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollProgress, setScrollProgress] = useState(0)
    const isStatic = useIsStaticRenderer()

    // Track scroll progress within the section
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const handleScroll = () => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const windowHeight = window.innerHeight
            
            // Calculate progress based on the element's position relative to viewport
            // Progress should be 0 when element top is at bottom of viewport
            // Progress should be 1 when element bottom is at top of viewport
            const elementTop = rect.top
            const elementBottom = rect.bottom
            const elementHeight = rect.height
            
            let progress = 0
            
            if (elementBottom <= 0) {
                // Element has completely passed through viewport
                progress = 1
            } else if (elementTop >= windowHeight) {
                // Element hasn't entered viewport yet
                progress = 0
            } else {
                // Element is partially or fully in viewport
                // Calculate how much of the total scrollable distance has been covered
                const totalScrollableDistance = elementHeight + windowHeight
                const scrolledDistance = windowHeight - elementTop
                progress = Math.max(0, Math.min(1, scrolledDistance / totalScrollableDistance))
            }

            startTransition(() => setScrollProgress(progress))
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        handleScroll() // Initial calculation

        return () => window.removeEventListener("scroll", handleScroll)
    }, [isStatic])

    // For static renderer, show 30% progress
    const displayProgress = isStatic ? 0.3 : scrollProgress

    return (
        <div
            ref={containerRef}
            style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                width: "100%",
                backgroundColor,
                borderBottom: `1px solid ${strokeColor}`,
                ...props.style,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingLeft: leftPadding,
                    paddingRight: rightPadding,
                    maxWidth: "100%",
                    position: "relative",
                }}
            >
                {/* Progress Line Container */}
                <div
                    style={{
                        flex: 1,
                        height: `${lineWidth}px`,
                        backgroundColor: trackColor,
                        marginRight: rightPadding,
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: `${lineWidth / 2}px`,
                    }}
                >
                    {/* Progress Fill */}
                    <motion.div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            backgroundColor: progressColor,
                            borderRadius: `${lineWidth / 2}px`,
                            width: `${displayProgress * 100}%`,
                        }}
                        animate={{
                            width: `${displayProgress * 100}%`,
                        }}
                        transition={{
                            duration: props.speed,
                            ease: "easeOut",
                        }}
                    />
                </div>

                {/* Title */}
                <h2
                    style={{
                        margin: 0,
                        color: titleColor,
                        whiteSpace: "nowrap",
                        ...titleFont,
                    }}
                >
                    {title}
                </h2>
            </div>
        </div>
    )
}

addPropertyControls(StickyHeader, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "About Us",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            fontSize: "24px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#1A1A1A",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track Color",
        defaultValue: "#E5E5E5",
    },
    progressColor: {
        type: ControlType.Color,
        title: "Progress Color",
        defaultValue: "#1A1A1A",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 1,
        unit: "px",
    },
    leftPadding: {
        type: ControlType.Number,
        title: "Left Padding",
        defaultValue: 32,
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
    },
    rightPadding: {
        type: ControlType.Number,
        title: "Right Padding",
        defaultValue: 32,
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
    },
    speed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#E5E5E5",
    },
})