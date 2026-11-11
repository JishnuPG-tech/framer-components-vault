// Smart Sticky Reveal Footer component that slides up when scrolling near bottom
import { useState, useEffect, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

interface StickyRevealFooterProps {
    content: string
    revealThreshold: number
    animationSpeed: number
    backgroundColor: string
    textColor: string
    padding: number
    borderRadius: number
    shadow: boolean
    font: any
    buttonText: string
    buttonColor: string
    buttonTextColor: string
    showButton: boolean
    buttonFont: any
    linkDestination: string
    style?: CSSProperties
}

/**
 * Smart Sticky Reveal Footer
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 80
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function StickyRevealFooter(props: StickyRevealFooterProps) {
    const {
        content,
        revealThreshold,
        animationSpeed,
        backgroundColor,
        textColor,
        padding,
        borderRadius,
        shadow,
        font,
        buttonText,
        buttonColor,
        buttonTextColor,
        showButton,
        buttonFont,
        linkDestination,
    } = props

    const [isVisible, setIsVisible] = useState(false)
    const [lastScrollY, setLastScrollY] = useState(0)
    const isStatic = useIsStaticRenderer()

    function normalizeLink(raw: any): string {
        let v = "";
        if (!raw) return v;
        if (typeof raw === "string") v = raw.trim();
        else v = (raw.href || raw.url || "").trim();

        if (!v) return "";
        if (/^(https?:|mailto:|tel:|data:)/i.test(v)) return v;
        if (/^\/\//.test(v)) return `https:${v}`; // protocol-relative
        if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(v)) return `https://${v}`; // bare domain
        return v; // probably internal route; we'll still handle it
    }

    const url = normalizeLink(linkDestination);

    // One-shot guard to prevent double-opens (StrictMode / multiple events)
    const openOnceRef = useRef(false);

    function openExternal(url: string) {
        if (!url || openOnceRef.current) return;
        openOnceRef.current = true;

        const isHttp = /^https?:\/\//i.test(url);

        try {
            // Prefer Framer's opener inside editor/preview if present
            // @ts-ignore
            const framer = (window as any).framer;
            if (isHttp && framer?.openExternalURL) {
                framer.openExternalURL(url);
                return;
            }

            // Break out of iframe and open in new tab
            const topWin = window.top ?? window;
            if (isHttp) {
                topWin.open(url, "_blank", "noopener,noreferrer");
            } else {
                topWin.location.href = url;
            }
        } finally {
            // allow future clicks after a short cooldown
            setTimeout(() => (openOnceRef.current = false), 600);
        }
    }

    useEffect(() => {
        if (isStatic || typeof window === "undefined") {
            startTransition(() => setIsVisible(true))
            return
        }

        const handleScroll = () => {
            const currentScrollY = window.scrollY
            const documentHeight = document.documentElement.scrollHeight
            const windowHeight = window.innerHeight
            const scrollPercentage = (currentScrollY + windowHeight) / documentHeight * 100

            // Show footer when scrolling down and near bottom
            if (scrollPercentage >= revealThreshold && currentScrollY > lastScrollY) {
                startTransition(() => setIsVisible(true))
            }
            // Hide footer when scrolling up
            else if (currentScrollY < lastScrollY && scrollPercentage < revealThreshold + 10) {
                startTransition(() => setIsVisible(false))
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [lastScrollY, revealThreshold, isStatic])

    return (
        <AnimatePresence>
            {(isVisible || isStatic) && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ 
                        duration: animationSpeed,
                        ease: "easeOut"
                    }}
                    style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor,
                        color: textColor,
                        padding: `${padding}px`,
                        borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
                        boxShadow: shadow ? "0 -4px 20px rgba(0, 0, 0, 0.1)" : "none",
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "20px",
                        ...font,
                    }}
                >
                    <div style={{ flex: 1 }}>
                        {content}
                    </div>
                    
                    {showButton && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();         // stop router hijack
                                openExternal(url);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openExternal(url);
                                }
                            }}
                            style={{
                                backgroundColor: buttonColor,
                                color: buttonTextColor,
                                border: "none",
                                borderRadius: 6,
                                padding: "12px 24px",
                                cursor: url ? "pointer" : "default",
                                textDecoration: "none",
                                display: "inline-block",
                                // ensure it sits above any overlays
                                position: "relative",
                                zIndex: 9999,
                                ...buttonFont,
                            }}
                            aria-label={`Open link ${url || ""}`}
                            disabled={!url}
                        >
                            {buttonText}
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

addPropertyControls(StickyRevealFooter, {
    content: {
        type: ControlType.String,
        title: "Content",
        defaultValue: "🎉 Special offer! Get 20% off your first order. Limited time only!",
        displayTextArea: true,
    },
    revealThreshold: {
        type: ControlType.Number,
        title: "Reveal Threshold",
        defaultValue: 80,
        min: 50,
        max: 95,
        step: 5,
        unit: "%",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 0.3,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        unit: "s",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 20,
        min: 10,
        max: 40,
        step: 2,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 24,
        step: 2,
        unit: "px",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    showButton: {
        type: ControlType.Boolean,
        title: "Show Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Get Offer",
        hidden: ({ showButton }) => !showButton,
    },
    linkDestination: {
        type: ControlType.String,
        title: "Link Destination",
        defaultValue: "https://google.com",
        placeholder: "https://example.com",
        hidden: ({ showButton }) => !showButton,
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showButton }) => !showButton,
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text Color",
        defaultValue: "#000000",
        hidden: ({ showButton }) => !showButton,
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showButton }) => !showButton,
    },
})