import { useState, useCallback, startTransition, type CSSProperties, type ReactNode, useMemo, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useInView } from "framer-motion"

interface LinkObject {
    href?: string
    url?: string
    webUrl?: string
    target?: string
    pathname?: string
    search?: string
    hash?: string
    type?: "external" | "page"
}

interface FAQEntry {
    title: string
    keywords: string
    answer: string
    ctaText?: string
    ctaLink?: LinkObject | string
}

interface SmartFAQProProps {
    title: string
    placeholder: string
    faqEntries: FAQEntry[]
    backgroundColor: string
    textColor: string
    accentColor: string
    inputBackground: string
    borderColor: string
    ctaTextColor: string
    topicTitleColor: string
    borderRadius: number
    titleFont: {
        fontFamily?: string
        fontSize?: string | number
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string | number
        lineHeight?: string | number
        textAlign?: "left" | "right" | "center" | "justify" | "start" | "end"
    }
    bodyFont: {
        fontFamily?: string
        fontSize?: string | number
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string | number
        lineHeight?: string | number
        textAlign?: "left" | "right" | "center" | "justify" | "start" | "end"
    }
    inputFont: {
        fontFamily?: string
        fontSize?: string | number
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string | number
        lineHeight?: string | number
        textAlign?: "left" | "right" | "center" | "justify" | "start" | "end"
    }
    showConfidence: boolean
    reloadIcon?: ReactNode
    enableDarkMode: boolean
    darkModeBackground: string
    darkModeTextColor: string
    darkModeAccentColor: string
    darkModeInputBackground: string
    darkModeBorderColor: string
    darkModeCTATextColor: string
    darkModeTopicTitleColor: string
    showShadows: boolean
    style?: CSSProperties
}

interface GridCirclesProps {
    isDark: boolean
    isTyping: boolean
    isStopped: boolean
}

function GridCircles({ isDark, isTyping, isStopped }: GridCirclesProps) {
    const isStatic = useIsStaticRenderer()
    
    // Add useInView to detect when component is in viewport
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.1 })
    
    const rows = 6
    const cols = 20
    
    // Memoize circles array to prevent recreation
    const circles = useMemo(() => {
        const arr = []
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                arr.push({ id: `${row}-${col}`, row, col })
            }
        }
        return arr
    }, [])

    // In static renderer, just render static circles without animations
    if (isStatic) {
        return (
            <div
                style={{
                    height: "100px",
                    overflow: "hidden",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    flexShrink: 0,
                    margin: "5px",
                    marginTop: "auto",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gridTemplateRows: `repeat(${rows}, 1fr)`,
                        gap: "4px",
                        width: "100%",
                        height: "100%",
                        padding: "10px",
                        boxSizing: "border-box",
                    }}
                >
                    {circles.map((circle) => (
                        <div
                            key={circle.id}
                            style={{
                                width: "4px",
                                height: "4px",
                                backgroundColor: isDark ? "#FFFFFF" : "#000000",
                                borderRadius: "50%",
                                justifySelf: "center",
                                alignSelf: "center",
                                opacity: 1,
                            }}
                        />
                    ))}
                </div>
            </div>
        )
    }

    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
    
    // Track active circles with state for rendering
    const [activeCircles, setActiveCircles] = useState<Set<string>>(new Set())
    
    // Track typing animation frame
    const animationFrameRef = useRef<number>()
    const timeoutRef = useRef<number>()
    const lastUpdateRef = useRef<number>(0)
    const isActiveRef = useRef<boolean>(false)
    const isTypingRef = useRef<boolean>(isTyping)
    const animationIterationRef = useRef<number>(0)

    // Keep ref in sync with prop
    useEffect(() => {
        isTypingRef.current = isTyping
    }, [isTyping])

    // Optimized typing animation using requestAnimationFrame
    useEffect(() => {
        // Increment animation iteration to ensure fresh start
        animationIterationRef.current++
        const currentIteration = animationIterationRef.current
        
        // Clear any existing animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        
        // Reset active circles when stopped or not typing or not in view
        if (isStopped || !isTyping || !isInView) {
            setActiveCircles(new Set())
            isActiveRef.current = false
            return
        }

        // Start fresh animation
        isActiveRef.current = true
        lastUpdateRef.current = 0

        const animate = (timestamp: number) => {
            // Check if this animation iteration is still valid
            if (currentIteration !== animationIterationRef.current) {
                return
            }
            
            // Check current typing state from ref and viewport visibility
            if (!isTypingRef.current || !isActiveRef.current || !isInView) {
                setActiveCircles(new Set())
                return
            }
            
            // Update every 150ms
            if (timestamp - lastUpdateRef.current > 150) {
                lastUpdateRef.current = timestamp
                
                // Pick 1-3 random circles to animate
                const numCircles = 1 + Math.floor(Math.random() * 3)
                const newActive = new Set<string>()
                
                for (let i = 0; i < numCircles; i++) {
                    const randomIdx = Math.floor(Math.random() * circles.length)
                    newActive.add(circles[randomIdx].id)
                }
                
                setActiveCircles(newActive)

                // Clear after 1 second
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
                timeoutRef.current = window.setTimeout(() => {
                    if (currentIteration === animationIterationRef.current && isTypingRef.current && isActiveRef.current && isInView) {
                        setActiveCircles(new Set())
                    }
                }, 1000)
            }
            
            // Continue animation loop
            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            isActiveRef.current = false
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [isTyping, isStopped, circles, isInView])

    // Throttle mouse move to improve performance
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }, [])

    const handleMouseLeave = useCallback(() => {
        setMousePos(null)
    }, [])

    // Memoize circle animation calculation with stable dependencies
    const getCircleStyle = useCallback((circleId: string, row: number, col: number) => {
        let mouseX = 0
        let mouseY = 0
        
        if (mousePos && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const cellWidth = rect.width / cols
            const cellHeight = rect.height / rows
            
            const circleCenterX = col * cellWidth + cellWidth / 2
            const circleCenterY = row * cellHeight + cellHeight / 2
            
            const deltaX = mousePos.x - circleCenterX
            const deltaY = mousePos.y - circleCenterY
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            const maxDistance = 100
            
            if (distance < maxDistance && distance > 0) {
                const force = (maxDistance - distance) / maxDistance
                mouseX = -(deltaX / distance) * force * 10
                mouseY = -(deltaY / distance) * force * 10
            }
        }
        
        const isActive = activeCircles.has(circleId)
        
        // Opacity logic: during typing animation, active circles are 100%, others 30%
        // When not typing or stopped, all circles are 100%
        let opacity = 1
        if (!isStopped && isTyping && isInView) {
            opacity = isActive ? 1 : 0.3
        }
        
        return {
            transform: `translate(${mouseX}px, ${mouseY}px) scale(${isActive ? 1.6 : 1})`,
            opacity,
            transition: isActive ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'transform 0.2s ease-out, opacity 0.3s ease-out',
        }
    }, [mousePos, activeCircles, isTyping, isStopped, isInView])

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                height: "100px",
                pointerEvents: "auto",
                overflow: "hidden",
                zIndex: 1,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                flexShrink: 0,
                margin: "5px",
                marginTop: "auto",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gap: "4px",
                    width: "100%",
                    height: "100%",
                    padding: "10px",
                    boxSizing: "border-box",
                }}
            >
                {circles.map((circle) => (
                    <div
                        key={circle.id}
                        style={{
                            width: "4px",
                            height: "4px",
                            backgroundColor: isDark ? "#FFFFFF" : "#000000",
                            borderRadius: "50%",
                            justifySelf: "center",
                            alignSelf: "center",
                            ...getCircleStyle(circle.id, circle.row, circle.col),
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

interface TypewriterTextProps {
    text: string
    textColor: string
    bodyFont: {
        fontFamily?: string
        fontSize?: string | number
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string | number
        lineHeight?: string | number
        textAlign?: "left" | "right" | "center" | "justify" | "start" | "end"
    }
    onProgress: (progress: number, isTyping: boolean, isPaused: boolean) => void
}

function TypewriterText({ text, textColor, bodyFont, onProgress }: TypewriterTextProps) {
    const isStatic = useIsStaticRenderer()
    const [displayText, setDisplayText] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [caretKey, setCaretKey] = useState(0)
    
    // Track all timeout IDs for cleanup
    const timeoutsRef = useRef<number[]>([])

    // In static renderer, show full text immediately without animation
    if (isStatic) {
        return (
            <p
                style={{
                    margin: "0 0 12px 0",
                    color: textColor,
                    ...bodyFont,
                    minHeight: "1.5em",
                }}
            >
                {text}
            </p>
        )
    }

    // Generate 1-3 random pause positions
    const pausePositions = useMemo(() => {
        const positions: number[] = []
        const numPauses = Math.min(3, Math.max(1, Math.floor(text.length / 15)))
        for (let i = 0; i < numPauses; i++) {
            const minPos = Math.floor(text.length * 0.15)
            const maxPos = Math.floor(text.length * 0.85)
            const pos = Math.floor(Math.random() * (maxPos - minPos) + minPos)
            if (!positions.includes(pos)) {
                positions.push(pos)
            }
        }
        return positions.sort((a, b) => a - b)
    }, [text])

    useEffect(() => {
        // Clear any existing timeouts before starting
        timeoutsRef.current.forEach(id => clearTimeout(id))
        timeoutsRef.current = []
        
        setDisplayText("")
        setIsTyping(true)
        setIsPaused(false)
        onProgress(0, true, false)
        setCaretKey(0)
        let currentIndex = 0
        let isCancelled = false
        
        const typeNextChar = () => {
            if (isCancelled) return
            if (currentIndex < text.length) {
                // Check if we should pause at this position
                if (pausePositions.includes(currentIndex)) {
                    startTransition(() => setIsPaused(true))
                    onProgress(currentIndex / text.length, true, true)
                    const pauseDuration = 300 + Math.random() * 1200 // 0.3-1.5 seconds
                    const pauseTimeout = window.setTimeout(() => {
                        if (isCancelled) return
                        startTransition(() => setIsPaused(false))
                        setDisplayText(text.slice(0, currentIndex + 1))
                        setCaretKey(prev => prev + 1)
                        currentIndex++
                        onProgress(currentIndex / text.length, true, false)
                        // Smoother typing with slight randomness
                        const nextDelay = 25 + Math.random() * 20 // 25-45ms
                        const nextTimeout = window.setTimeout(typeNextChar, nextDelay)
                        timeoutsRef.current.push(nextTimeout)
                    }, pauseDuration)
                    timeoutsRef.current.push(pauseTimeout)
                } else {
                    setDisplayText(text.slice(0, currentIndex + 1))
                    setCaretKey(prev => prev + 1)
                    currentIndex++
                    onProgress(currentIndex / text.length, true, false)
                    // Smoother typing with slight randomness
                    const nextDelay = 25 + Math.random() * 20 // 25-45ms
                    const nextTimeout = window.setTimeout(typeNextChar, nextDelay)
                    timeoutsRef.current.push(nextTimeout)
                }
            } else {
                if (!isCancelled) {
                    setIsTyping(false)
                    setIsPaused(false)
                    onProgress(1, false, false)
                }
            }
        }
        
        const initialTimeout = window.setTimeout(typeNextChar, 100)
        timeoutsRef.current.push(initialTimeout)
        
        return () => {
            isCancelled = true
            // Clear all tracked timeouts
            timeoutsRef.current.forEach(id => clearTimeout(id))
            timeoutsRef.current = []
        }
    }, [text, pausePositions, onProgress])

    return (
        <p
            style={{
                margin: "0 0 12px 0",
                color: textColor,
                ...bodyFont,
                minHeight: "1.5em",
            }}
        >
            {displayText}
            {isTyping && (
                <span
                    key={caretKey}
                    style={{
                        display: "inline-block",
                        width: "8px",
                        height: "2px",
                        backgroundColor: textColor,
                        marginLeft: "2px",
                        verticalAlign: "baseline",
                        animation: "blink 0.6s infinite",
                        animationDelay: "0.2s",
                    }}
                />
            )}
            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </p>
    )
}

const defaultFaqEntries = [
    { title: "Contact Us", keywords: "contact, phone, call, reach", answer: "You can contact us at 07 48 36 73 94 from Monday to Friday, 9 AM to 6 PM.", ctaText: "Call Now", ctaLink: { href: "tel:0748367394" } },
    { title: "Refund Policy", keywords: "refund, return, money back", answer: "We offer a 7-day refund policy for all unused items in original packaging.", ctaText: "Start Return", ctaLink: { href: "#refunds" } },
    { title: "Shipping Info", keywords: "shipping, delivery, order", answer: "Free shipping on orders over $50. Standard delivery takes 3-5 business days.", ctaText: "Track Order", ctaLink: { href: "#shipping" } },
    { title: "Pricing", keywords: "price, cost, pricing, plan", answer: "We offer three pricing tiers: Basic ($9/mo), Pro ($29/mo), and Enterprise ($99/mo). All plans include a 14-day free trial.", ctaText: "View Pricing", ctaLink: { href: "#pricing" } },
    { title: "Warranty Coverage", keywords: "warranty, guarantee, defect", answer: "All products come with a one-year warranty covering manufacturing defects.", ctaText: "File Claim" },
    { title: "Payment Methods", keywords: "payment, card, pay", answer: "We accept Visa, Mastercard, PayPal, and Apple Pay for secure payments.", ctaText: "View Payment Options" },
    { title: "Store Hours", keywords: "hours, open, time", answer: "Our store is open Monday through Friday from 9 AM to 6 PM EST.", ctaText: "Get Directions" },
    { title: "Our Location", keywords: "address, location, where", answer: "Visit us at 123 Main Street, Downtown Business District.", ctaText: "Open Map" },
    { title: "Customer Support", keywords: "support, help, assistance", answer: "Email us at support@example.com or use our live chat for immediate help.", ctaText: "Get Support" },
    { title: "Special Offers", keywords: "discount, promo, coupon", answer: "Sign up for our newsletter to receive 15% off your first order.", ctaText: "Subscribe" },
    { title: "Order Cancellation", keywords: "cancel, order, stop", answer: "Orders can be cancelled within 2 hours of purchase by contacting support.", ctaText: "Contact Support" },
    { title: "Account Management", keywords: "account, login, sign in, register", answer: "You can manage your account easily, including login and settings.", ctaText: "Manage Account" },
    { title: "Checkout Options", keywords: "payment, card, paypal, checkout", answer: "We support multiple payment methods for a seamless checkout experience.", ctaText: "View Payment Options" },
    { title: "User Guide", keywords: "how, usage, guide, tutorial", answer: "The component is simple to use with intuitive controls.", ctaText: "Read Guide" },
    { title: "Technical Issues", keywords: "bug, error, not working, broken", answer: "If something isn't working, try checking your setup or contact support.", ctaText: "Report an Issue" },
    { title: "Licensing", keywords: "license, commercial, personal use, rights", answer: "The component can be used for personal and commercial projects depending on your license.", ctaText: "View License" },
    { title: "Instant Access", keywords: "access, download, receive, delivery", answer: "You get instant access after purchase so you can start right away.", ctaText: "Access Now" },
    { title: "Quick Results", keywords: "how long, time, results, delay", answer: "You can start seeing results immediately after setup.", ctaText: "Get Started" },
    { title: "General Questions", keywords: "other, question, anything, info", answer: "I'm not sure I understand. Try rephrasing your question or contact support.", ctaText: "Ask Another Question" },
]

interface CTAButtonProps {
    ctaText: string
    link?: LinkObject | string
    currentAccentColor: string
    borderRadius: number
    bodyFont: {
        fontFamily?: string
        fontSize?: string | number
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string | number
        lineHeight?: string | number
        textAlign?: "left" | "right" | "center" | "justify" | "start" | "end"
    }
    ctaTextColor: string
}

// Helper function to extract URL from LinkObject or string
function extractUrl(link: LinkObject | string | undefined): string | null {
    if (!link) return null
    if (typeof link === "string") {
        const trimmed = link.trim()
        return trimmed && trimmed !== "" ? trimmed : null
    }
    // Handle LinkObject - Framer Link control returns { href: "/path" }
    if (link.href && link.href.trim() && link.href !== "") {
        return link.href
    }
    // Fallback to other properties
    const possibleUrls = [link.url, link.webUrl, link.pathname, link.hash].filter(Boolean)
    for (const url of possibleUrls) {
        if (typeof url === "string" && url.trim() && url !== "") {
            return url
        }
    }
    return null
}

function CTAButton({
    ctaText,
    link,
    currentAccentColor,
    borderRadius,
    bodyFont,
    ctaTextColor,
}: CTAButtonProps) {
    const url = extractUrl(link)
    const hasValidLink = !!url
    const [showError, setShowError] = useState(false)
    const errorTimeoutRef = useRef<number | null>(null)

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current)
            }
        }
    }, [])

    const handleClick = (e: React.MouseEvent) => {
        if (!hasValidLink) {
            e.preventDefault()
            setShowError(true)
            // Clear any existing timeout
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current)
            }
            // Reset after 2 seconds
            errorTimeoutRef.current = window.setTimeout(() => {
                startTransition(() => {
                    setShowError(false)
                })
            }, 2000)
        }
    }

    const buttonStyle = useMemo((): CSSProperties => ({
        padding: "12px 32px",
        backgroundColor: currentAccentColor,
        color: ctaTextColor,
        border: "none",
        borderRadius: borderRadius / 2,
        fontFamily: bodyFont.fontFamily,
        fontSize: bodyFont.fontSize,
        fontWeight: 600,
        fontStyle: bodyFont.fontStyle,
        letterSpacing: bodyFont.letterSpacing,
        lineHeight: bodyFont.lineHeight,
        cursor: hasValidLink ? "pointer" : "default",
        transition: "all 0.2s ease",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 1,
        overflow: "visible",
        position: "relative",
        minWidth: "180px",
        width: "96%",
        flexShrink: 0,
    }), [currentAccentColor, borderRadius, bodyFont, hasValidLink, ctaTextColor])

    const textContainerStyle = useMemo((): CSSProperties => ({
        position: "relative",
        height: "2em",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "180px",
        width: "100%",
    }), [])

    // Ensure ctaText is always a string
    const displayText = ctaText || "Learn More"

    if (!hasValidLink) {
        return (
            <button type="button" style={buttonStyle} onClick={handleClick}>
                <div style={textContainerStyle}>
                    <AnimatePresence mode="wait" initial={false}>
                        {showError ? (
                            <motion.span
                                key="error"
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -30, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                style={{ 
                                    display: "block", 
                                    whiteSpace: "nowrap",
                                    position: "absolute",
                                    width: "100%",
                                    textAlign: "center",
                                }}
                            >
                                Connect to a link or page
                            </motion.span>
                        ) : (
                            <motion.span
                                key="normal"
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -30, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                style={{ 
                                    display: "block", 
                                    whiteSpace: "nowrap",
                                    position: "absolute",
                                    width: "100%",
                                    textAlign: "center",
                                }}
                            >
                                {displayText}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </button>
        )
    }

    // Check if external
    const isExternal = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")
    
    return (
        <a
            href={url}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            style={buttonStyle}
        >
            <span style={{ whiteSpace: "nowrap" }}>{displayText}</span>
        </a>
    )
}

/**
 * SmartFAQPro
 *
 * An intelligent FAQ component that matches user questions to pre-defined answers.
 * Uses keyword matching and similarity scoring to find the most relevant responses.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SmartFAQPro(props: SmartFAQProProps) {
    const {
        title = "Ask a Question",
        placeholder = "Type your question here...",
        faqEntries = defaultFaqEntries,
        backgroundColor = "#FFFFFF",
        textColor = "#1A1A1A",
        accentColor = "#0066FF",
        inputBackground = "#F5F5F5",
        borderColor = "#E0E0E0",
        ctaTextColor = "#FFFFFF",
        topicTitleColor = "#FFFFFF",
        borderRadius = 12,
        titleFont = {
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        bodyFont = {
            fontSize: "15px",
            fontWeight: 400,
            letterSpacing: "0em",
            lineHeight: "1.5em",
        },
        inputFont = {
            fontSize: "15px",
            fontWeight: 400,
            letterSpacing: "0em",
            lineHeight: "1.3em",
        },
        showConfidence = false,
        reloadIcon,
        enableDarkMode = false,
        darkModeBackground = "#0D0D0D",
        darkModeTextColor = "#F5F5F5",
        darkModeAccentColor = "#4D9FFF",
        darkModeInputBackground = "#1A1A1A",
        darkModeBorderColor = "#444444",
        darkModeCTATextColor = "#FFFFFF",
        darkModeTopicTitleColor = "#FFFFFF",
        showShadows = true,
        style,
    } = props

    // Define containerRef for the main container
    const containerRef = useRef<HTMLDivElement>(null)

    // Determine colors based on dark mode
    const isDark = enableDarkMode
    const currentBackgroundColor = isDark ? darkModeBackground : backgroundColor
    const currentTextColor = isDark ? darkModeTextColor : textColor
    const currentAccentColor = isDark ? darkModeAccentColor : accentColor
    const currentInputBackground = isDark ? darkModeInputBackground : inputBackground
    const currentSubtleTextColor = isDark ? "#AAAAAA" : "#666666"
    const currentBorderColor = isDark ? darkModeBorderColor : borderColor
    const currentCTATextColor = isDark ? darkModeCTATextColor : ctaTextColor
    const currentTopicTitleColor = isDark ? darkModeTopicTitleColor : topicTitleColor

    const [query, setQuery] = useState("")
    const [result, setResult] = useState<FAQEntry | null>(null)
    const [hasSearched, setHasSearched] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [gridAnimationStopped, setGridAnimationStopped] = useState(false)

    // Handler for typing progress from TypewriterText
    const handleTypingProgress = useCallback((progress: number, typing: boolean, _isPaused: boolean) => {
        setIsTyping(typing)
    }, [])

    // Find best matching FAQ entry based on keyword overlap
    const findBestMatch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return null

        const queryLower = searchQuery.toLowerCase().trim()
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)
        
        let bestMatch: FAQEntry | null = null
        let highestScore = 0

        for (const entry of faqEntries) {
            const entryKeywords = entry.keywords.toLowerCase().split(/,\s*/)
            let score = 0

            // Check for exact keyword matches
            for (const keyword of entryKeywords) {
                const keywordTrimmed = keyword.trim()
                if (!keywordTrimmed) continue

                // Exact match in query
                if (queryLower.includes(keywordTrimmed)) {
                    score += 100
                }

                // Check each query word against keyword
                for (const queryWord of queryWords) {
                    if (keywordTrimmed.includes(queryWord) || queryWord.includes(keywordTrimmed)) {
                        score += 50
                    }
                }
            }

            // Check if answer contains query words (secondary match)
            const answerLower = entry.answer.toLowerCase()
            for (const queryWord of queryWords) {
                if (answerLower.includes(queryWord)) {
                    score += 10
                }
            }

            if (score > highestScore) {
                highestScore = score
                bestMatch = entry
            }
        }

        return highestScore > 0 ? { entry: bestMatch!, score: highestScore } : null
    }, [faqEntries])

    // Generate contextual CTA text based on keywords
    const getContextualCTA = useCallback((keywords: string) => {
        const keywordLower = keywords.toLowerCase()
        if (keywordLower.includes("contact") || keywordLower.includes("call") || keywordLower.includes("phone")) {
            return "Contact Us"
        }
        if (keywordLower.includes("refund") || keywordLower.includes("return")) {
            return "Start Return"
        }
        if (keywordLower.includes("shipping") || keywordLower.includes("delivery") || keywordLower.includes("track")) {
            return "Track Order"
        }
        if (keywordLower.includes("warranty") || keywordLower.includes("claim")) {
            return "File Claim"
        }
        if (keywordLower.includes("payment") || keywordLower.includes("pay")) {
            return "View Payment Options"
        }
        if (keywordLower.includes("hours") || keywordLower.includes("open") || keywordLower.includes("time")) {
            return "Get Directions"
        }
        if (keywordLower.includes("address") || keywordLower.includes("location")) {
            return "Open Map"
        }
        if (keywordLower.includes("support") || keywordLower.includes("help")) {
            return "Get Support"
        }
        if (keywordLower.includes("discount") || keywordLower.includes("promo") || keywordLower.includes("coupon")) {
            return "Get Discount"
        }
        if (keywordLower.includes("cancel")) {
            return "Cancel Order"
        }
        return "Learn More"
    }, [])

    const handleSearch = useCallback(() => {
        const match = findBestMatch(query)
        startTransition(() => {
            setResult(match?.entry || null)
            setHasSearched(true)
            setGridAnimationStopped(false)
        })
    }, [query, findBestMatch])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch()
        }
    }

    const handleClear = () => {
        startTransition(() => {
            setQuery("")
            setResult(null)
            setHasSearched(false)
            setGridAnimationStopped(true)
        })
        // Note: Grid animation stays stopped until next search starts
    }

    const containerStyle: CSSProperties = {
        width: "100%",
        minHeight: "100%",
        backgroundColor: currentBackgroundColor,
        borderRadius,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: showShadows ? (isDark ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "0 4px 20px rgba(0, 0, 0, 0.08)") : "none",
        position: "relative",
    }

    // Title
    const titleStyle: CSSProperties = {
        margin: 0,
        marginTop: "10px",
        color: currentTextColor,
        fontFamily: titleFont.fontFamily,
        fontSize: titleFont.fontSize,
        fontWeight: titleFont.fontWeight,
        fontStyle: titleFont.fontStyle,
        letterSpacing: titleFont.letterSpacing,
        lineHeight: titleFont.lineHeight,
        textAlign: titleFont.textAlign as any,
        zIndex: 2,
    }

    // Body text style helper
    const getBodyStyle = (additionalStyles?: CSSProperties): CSSProperties => ({
        fontFamily: bodyFont.fontFamily,
        fontSize: bodyFont.fontSize,
        fontWeight: bodyFont.fontWeight,
        fontStyle: bodyFont.fontStyle,
        letterSpacing: bodyFont.letterSpacing,
        lineHeight: bodyFont.lineHeight,
        textAlign: bodyFont.textAlign as any,
        ...additionalStyles,
    })

    // Input style helper
    const getInputStyle = (additionalStyles?: CSSProperties): CSSProperties => ({
        fontFamily: inputFont.fontFamily,
        fontSize: inputFont.fontSize,
        fontWeight: inputFont.fontWeight,
        fontStyle: inputFont.fontStyle,
        letterSpacing: inputFont.letterSpacing,
        lineHeight: inputFont.lineHeight,
        textAlign: inputFont.textAlign as any,
        ...additionalStyles,
    })

    return (
        <div ref={containerRef} style={containerStyle}>
            {/* Remove OceanWithBoat usage */}

            {/* Title */}
            <h2 style={titleStyle}>
                {title}
            </h2>

            {/* Search Input */}
            <div style={{ position: "relative", display: "flex", gap: "8px", zIndex: 2, marginTop: "20px" }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={hasSearched}
                    style={getInputStyle({
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: borderRadius / 2,
                        border: `2px solid ${query ? currentAccentColor : isDark ? "#444444" : "transparent"}`,
                        backgroundColor: currentInputBackground,
                        color: currentTextColor,
                        outline: "none",
                        opacity: hasSearched ? 0.6 : 1,
                        cursor: hasSearched ? "not-allowed" : "text",
                    })}
                    aria-label="Search questions"
                />
                <button
                    onClick={hasSearched ? handleClear : handleSearch}
                    style={getInputStyle({
                        padding: "12px 20px",
                        borderRadius: borderRadius / 2,
                        border: "none",
                        backgroundColor: currentAccentColor,
                        color: "#FFFFFF",
                        cursor: "pointer",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "60px",
                    })}
                    aria-label={hasSearched ? "Reset" : "Search"}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={hasSearched ? "reload" : "ask"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            {hasSearched ? (
                                reloadIcon || (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
                                        <path d="M3 3v9h9" />
                                    </svg>
                                )
                            ) : (
                                "Ask"
                            )}
                        </motion.span>
                    </AnimatePresence>
                </button>
            </div>

            {/* Results */}
            <div style={{ position: "relative", zIndex: 2, pointerEvents: "auto", height: "auto", flexShrink: 0 }}>
                {!hasSearched && (
                    <div
                        style={getBodyStyle({
                            color: currentSubtleTextColor,
                            textAlign: "center",
                            padding: "40px 20px",
                        })}
                    >
                        <p style={{ margin: 0, opacity: 0.7 }}>
                            Type a question above and press Enter or click Ask
                        </p>
                    </div>
                )}

                {hasSearched && !result && (
                    <div
                        style={getBodyStyle({
                            color: currentTextColor,
                            padding: "12px",
                            backgroundColor: currentInputBackground,
                            borderRadius: borderRadius / 2,
                        })}
                    >
                        <p style={{ margin: "0 0 12px 0", fontWeight: 600 }}>
                            We couldn't find an answer for that
                        </p>
                        <p style={{ margin: "0 0 8px 0", opacity: 0.8 }}>
                            Try asking about one of these topics instead:
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {faqEntries.slice(0, 6).map((entry, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        const firstKeyword = entry.keywords.split(',')[0].trim()
                                        startTransition(() => {
                                            setQuery(firstKeyword)
                                        })
                                        // Trigger search after a brief delay to allow state update
                                        setTimeout(() => {
                                            const match = findBestMatch(firstKeyword)
                                            startTransition(() => {
                                                setResult(match?.entry || null)
                                                setHasSearched(true)
                                            })
                                        }, 0)
                                    }}
                                    style={{
                                        padding: "6px 12px",
                                        backgroundColor: currentBackgroundColor,
                                        color: currentAccentColor,
                                        border: `1px solid ${currentAccentColor}40`,
                                        borderRadius: borderRadius / 2,
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        boxShadow: showShadows ? `0 4px 12px ${currentAccentColor}40` : "none",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = currentAccentColor
                                        e.currentTarget.style.color = "#FFFFFF"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = currentBackgroundColor
                                        e.currentTarget.style.color = currentAccentColor
                                    }}
                                >
                                    {entry.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {result && (
                    <motion.div
                        key={result.answer}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            padding: "20px",
                            backgroundColor: currentInputBackground,
                            borderRadius: borderRadius / 2,
                            borderLeft: `4px solid ${currentAccentColor}`,
                        }}
                    >
                        {result.title && (
                            <h3 style={{
                                margin: "0 0 12px 0",
                                color: currentTopicTitleColor,
                                textShadow: isDark ? "0 1px 2px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)" : "0 1px 2px rgba(0,0,0,0.3), 0 0 10px rgba(0,0,0,0.2)",
                                fontFamily: titleFont.fontFamily,
                                fontSize: typeof titleFont.fontSize === 'string' ? `calc(${titleFont.fontSize} * 0.85)` : (titleFont.fontSize || 24) * 0.85,
                                fontWeight: 600,
                                fontStyle: titleFont.fontStyle,
                                letterSpacing: titleFont.letterSpacing,
                                lineHeight: titleFont.lineHeight,
                            }}>
                                {result.title}
                            </h3>
                        )}
                        <TypewriterText 
                            text={result.answer} 
                            textColor={currentTextColor} 
                            bodyFont={bodyFont}
                            onProgress={handleTypingProgress}
                        />
                        {showConfidence && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginTop: "12px",
                                    padding: "6px 10px",
                                    backgroundColor: `${currentAccentColor}30`,
                                    borderRadius: borderRadius / 2,
                                    width: "fit-content",
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill={currentAccentColor}>
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </svg>
                                <span
                                    style={{
                                        color: currentAccentColor,
                                        fontSize: "12px",
                                        fontWeight: 600,
                                    }}
                                >
                                    Answer found
                                </span>
                            </div>
                        )}

                        {/* CTA integrated inside answer container */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                paddingTop: "16px",
                                borderTop: `1px solid ${currentBorderColor}`,
                                marginTop: "16px",
                                width: "100%",
                            }}
                        >
                            <CTAButton
                                ctaText={result.ctaText || getContextualCTA(result.keywords)}
                                link={result.ctaLink}
                                currentAccentColor={currentAccentColor}
                                borderRadius={borderRadius}
                                bodyFont={bodyFont}
                                ctaTextColor={currentCTATextColor}
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Grid of black circles at bottom - outside of scroll area */}
            {!(hasSearched && !result) && (
                <GridCircles isDark={isDark} isTyping={isTyping} isStopped={gridAnimationStopped} />
            )}
        </div>
    )
}

addPropertyControls(SmartFAQPro, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Ask a Question",
    },
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Type your question here...",
    },
    faqEntries: {
        type: ControlType.Array,
        title: "FAQ Entries",
        maxCount: 18,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    placeholder: "e.g., Contact Us",
                    defaultValue: "FAQ Topic",
                },
                keywords: {
                    type: ControlType.String,
                    title: "Keywords",
                    placeholder: "contact, phone, call",
                    defaultValue: "contact, phone",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    placeholder: "Enter the answer...",
                    defaultValue: "Contact us at 07 48 36 73 94",
                    displayTextArea: true,
                },
                ctaText: {
                    type: ControlType.String,
                    title: "CTA Text",
                    placeholder: "e.g., Call Now",
                    defaultValue: "Learn More",
                },
                ctaLink: {
                    type: ControlType.Link,
                    title: "CTA Link",
                },
            },
        },
        defaultValue: [
            { title: "Contact Us", keywords: "contact, phone, call, reach", answer: "You can contact us at 07 48 36 73 94 from Monday to Friday, 9 AM to 6 PM.", ctaText: "Call Now", ctaLink: { href: "tel:0748367394" } },
            { title: "Refund Policy", keywords: "refund, return, money back", answer: "We offer a 7-day refund policy for all unused items in original packaging.", ctaText: "Start Return", ctaLink: { href: "#refunds" } },
            { title: "Shipping Info", keywords: "shipping, delivery, order", answer: "Free shipping on orders over $50. Standard delivery takes 3-5 business days.", ctaText: "Track Order", ctaLink: { href: "#shipping" } },
            { title: "Pricing", keywords: "price, cost, pricing, plan", answer: "We offer three pricing tiers: Basic ($9/mo), Pro ($29/mo), and Enterprise ($99/mo). All plans include a 14-day free trial.", ctaText: "View Pricing", ctaLink: { href: "#pricing" } },
            { title: "Warranty Coverage", keywords: "warranty, guarantee, defect", answer: "All products come with a one-year warranty covering manufacturing defects.", ctaText: "File Claim" },
            { title: "Payment Methods", keywords: "payment, card, pay", answer: "We accept Visa, Mastercard, PayPal, and Apple Pay for secure payments.", ctaText: "View Payment Options" },
            { title: "Store Hours", keywords: "hours, open, time", answer: "Our store is open Monday through Friday from 9 AM to 6 PM EST.", ctaText: "Get Directions" },
            { title: "Our Location", keywords: "address, location, where", answer: "Visit us at 123 Main Street, Downtown Business District.", ctaText: "Open Map" },
            { title: "Customer Support", keywords: "support, help, assistance", answer: "Email us at support@example.com or use our live chat for immediate help.", ctaText: "Get Support" },
            { title: "Special Offers", keywords: "discount, promo, coupon", answer: "Sign up for our newsletter to receive 15% off your first order.", ctaText: "Subscribe" },
            { title: "Order Cancellation", keywords: "cancel, order, stop", answer: "Orders can be cancelled within 2 hours of purchase by contacting support.", ctaText: "Contact Support" },
            { title: "Account Management", keywords: "account, login, sign in, register", answer: "You can manage your account easily, including login and settings.", ctaText: "Manage Account" },
            { title: "Checkout Options", keywords: "payment, card, paypal, checkout", answer: "We support multiple payment methods for a seamless checkout experience.", ctaText: "View Payment Options" },
            { title: "User Guide", keywords: "how, usage, guide, tutorial", answer: "The component is simple to use with intuitive controls.", ctaText: "Read Guide" },
            { title: "Technical Issues", keywords: "bug, error, not working, broken", answer: "If something isn't working, try checking your setup or contact support.", ctaText: "Report an Issue" },
            { title: "Licensing", keywords: "license, commercial, personal use, rights", answer: "The component can be used for personal and commercial projects depending on your license.", ctaText: "View License" },
            { title: "Instant Access", keywords: "access, download, receive, delivery", answer: "You get instant access after purchase so you can start right away.", ctaText: "Access Now" },
            { title: "Quick Results", keywords: "how long, time, results, delay", answer: "You can start seeing results immediately after setup.", ctaText: "Get Started" },
            { title: "General Questions", keywords: "other, question, anything, info", answer: "I'm not sure I understand. Try rephrasing your question or contact support.", ctaText: "Ask Another Question" },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#1A1A1A",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#0066FF",
    },
    inputBackground: {
        type: ControlType.Color,
        title: "Input Background",
        defaultValue: "#F5F5F5",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#E0E0E0",
    },
    ctaTextColor: {
        type: ControlType.Color,
        title: "CTA Text Color",
        defaultValue: "#FFFFFF",
    },
    topicTitleColor: {
        type: ControlType.Color,
        title: "Topic Title Color",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.5em",
        },
    },
    inputFont: {
        type: ControlType.Font,
        title: "Input Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.3em",
        },
    },
    showConfidence: {
        type: ControlType.Boolean,
        title: "Show Match Indicator",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    reloadIcon: {
        type: ControlType.Slot,
        title: "Reload Icon",
        maxCount: 1,
    },
    enableDarkMode: {
        type: ControlType.Boolean,
        title: "Dark Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    darkModeBackground: {
        type: ControlType.Color,
        title: "Dark Background",
        defaultValue: "#0D0D0D",
        hidden: ({ enableDarkMode }) => !enableDarkMode,
    },
    darkModeTextColor: {
        type: ControlType.Color,
        title: "Dark Text Color",
        defaultValue: "#F5F5F5",
        hidden: ({ enableDarkMode }) => !enableDarkMode,
    },
    darkModeAccentColor: {
        type: ControlType.Color,
        title: "Dark Accent",
        defaultValue: "#4D9FFF",
        hidden: ({ enableDarkMode }) => !enableDarkMode,
    },
    darkModeInputBackground: {
        type: ControlType.Color,
        title: "Dark Input BG",
        defaultValue: "#1A1A1A",
        hidden: ({ enableDarkMode }) => !enableDarkMode,
    },
    darkModeBorderColor: {
        type: ControlType.Color,
        title: "Dark Border Color",
        defaultValue: "#444444",
        hidden: ({ enableDarkMode }) => !enableDarkMode,
    },
    darkModeCTATextColor: {
        type: ControlType.Color,
        title: "Dark CTA Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({ enableDarkMode }) => !enableDarkMode,
    },
    darkModeTopicTitleColor: {
        type: ControlType.Color,
        title: "Dark Topic Title Color",
        defaultValue: "#FFFFFF",
        hidden: ({ enableDarkMode }) => !enableDarkMode,
    },
    showShadows: {
        type: ControlType.Boolean,
        title: "Shadows",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})