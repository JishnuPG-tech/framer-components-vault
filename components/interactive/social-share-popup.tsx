import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ============================================================================
// SVG ICONS
// ============================================================================
const SVG = {
    Share: (props: React.SVGProps<SVGSVGElement>) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
    ),
    Close: (props: React.SVGProps<SVGSVGElement>) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Copy: (props: React.SVGProps<SVGSVGElement>) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    Check: (props: React.SVGProps<SVGSVGElement>) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    NativeShare: (props: React.SVGProps<SVGSVGElement>) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
    ),
    Twitter: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    ),
    LinkedIn: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
    ),
    Facebook: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.73 5.6c1.07 0 2.19.19 2.19.19v2.41h-1.23c-1.23 0-1.62.77-1.62 1.56V12h2.72l-.43 3h-2.29v6.8c4.56-.93 8-4.96 8-9.8z" />
        </svg>
    ),
    WhatsApp: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.55 0 8.24 3.69 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.188 8.188 0 0 1-5.82 2.42c-1.38 0-2.73-.35-3.93-1.02l-.28-.16-3.11.82.83-3.03-.18-.29a8.182 8.182 0 0 1-1.26-4.38c0-4.54 3.69-8.24 8.23-8.24zm4.52 10.23c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.66.81-.81.98-.15.17-.3.19-.55.07-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45s-.56-1.35-.77-1.85c-.2-.48-.41-.42-.56-.43-.14-.01-.3-.01-.46-.01s-.42.06-.64.3c-.22.24-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.72 2.63 4.17 3.68.58.25 1.04.4 1.39.51.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.47-.28z" />
        </svg>
    ),
    Instagram: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
    ),
    Pinterest: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
    ),
    Email: (props: React.SVGProps<SVGSVGElement>) => (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    ),
}

// ============================================================================
// SHARE URL GENERATOR
// ============================================================================
function getShareUrl(platform: string, rawUrl: string, rawText: string) {
    const u = encodeURIComponent(rawUrl)
    const t = encodeURIComponent(rawText)

    switch (platform) {
        case "twitter":
            return `https://twitter.com/intent/tweet?url=${u}&text=${t}`
        case "linkedin":
            return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
        case "facebook":
            return `https://www.facebook.com/sharer/sharer.php?u=${u}`
        case "whatsapp":
            return `https://api.whatsapp.com/send?text=${t}%20${u}`
        case "instagram":
            return `https://www.instagram.com/`
        case "pinterest":
            return `https://pinterest.com/pin/create/button/?url=${u}&description=${t}`
        case "email":
            return `mailto:?subject=${t}&body=${encodeURIComponent("Check this out: ")}${u}`
        default:
            return rawUrl
    }
}

// ============================================================================
// MAIN COMPONENT (Social Share Popup)
// ============================================================================
export default function SocialSharePopup(props: any) {
    const isStaticRenderer = useIsStaticRenderer()
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Only run effects when not in static renderer
    useEffect(() => {
        if (isStaticRenderer) return
        setMounted(true)
    }, [isStaticRenderer])

    // Lock Scroll when Overlay is active
    useEffect(() => {
        if (isStaticRenderer) return
        if (typeof document === "undefined") return
        if (isOpen) {
            const originalOverflow = document.body.style.overflow
            document.body.style.overflow = "hidden"
            return () => {
                document.body.style.overflow = originalOverflow
            }
        }
    }, [isOpen, isStaticRenderer])

    // ESC Key Listener
    useEffect(() => {
        if (isStaticRenderer) return
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false)
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, isStaticRenderer])

    // Copy to Clipboard logic
    const handleCopyLink = async () => {
        if (isStaticRenderer) return // Don't run in static mode
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(props.shareUrl)
            } else {
                const textArea = document.createElement("textarea")
                textArea.value = props.shareUrl
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand("copy")
                document.body.removeChild(textArea)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy URL:", err)
        }
    }

    // Native Web Share API logic (More Options)
    const handleNativeShare = async () => {
        if (isStaticRenderer) return // Don't run in static mode
        const shareData = {
            title: props.heading,
            url: props.shareUrl,
        }

        if (
            typeof navigator !== "undefined" &&
            navigator.share &&
            navigator.canShare &&
            navigator.canShare(shareData)
        ) {
            try {
                await navigator.share(shareData)
            } catch (e) {
                // User closed share sheet
            }
        } else {
            handleCopyLink()
        }
    }

    // Active Platforms Filter
    const platforms = [
        {
            id: "twitter",
            name: "X",
            icon: SVG.Twitter,
            enabled: props.showTwitter,
        },
        {
            id: "linkedin",
            name: "LinkedIn",
            icon: SVG.LinkedIn,
            enabled: props.showLinkedIn,
        },
        {
            id: "facebook",
            name: "Facebook",
            icon: SVG.Facebook,
            enabled: props.showFacebook,
        },
        {
            id: "whatsapp",
            name: "WhatsApp",
            icon: SVG.WhatsApp,
            enabled: props.showWhatsApp,
        },
        {
            id: "instagram",
            name: "Instagram",
            icon: SVG.Instagram,
            enabled: props.showInstagram,
        },
        {
            id: "pinterest",
            name: "Pinterest",
            icon: SVG.Pinterest,
            enabled: props.showPinterest,
        },
        {
            id: "email",
            name: "Email",
            icon: SVG.Email,
            enabled: props.showEmail,
        },
    ].filter((p) => p.enabled)

    // Dynamic Theme Mapping
    const isDark = props.themeMode === "dark"
    const isCustom = props.themeMode === "custom"

    const theme = {
        popupBg: isCustom
            ? props.customPopupBg
            : isDark
              ? "#0B0E14"
              : "#FFFFFF",
        popupBorder: isCustom
            ? props.customPopupBorder
            : isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.08)",
        headingColor: isCustom
            ? props.customHeadingColor
            : isDark
              ? "#FFFFFF"
              : "#111827",
        descColor: isCustom
            ? props.customDescColor
            : isDark
              ? "#9CA3AF"
              : "#6B7280",
        cardBg: isCustom
            ? props.customCardBg
            : isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
        cardBorder: isCustom
            ? props.customCardBorder
            : isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.06)",
        cardUrl: isCustom
            ? props.customHeadingColor
            : isDark
              ? "#FFFFFF"
              : "#111827",
        iconBoxBg: isCustom
            ? props.customIconBoxBg
            : isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.04)",
        iconBoxHoverBg: isCustom
            ? props.customIconBoxHoverBg
            : isDark
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(0, 0, 0, 0.08)",
        iconColor: isCustom
            ? props.customIconColor
            : isDark
              ? "#FFFFFF"
              : "#111827",
        iconLabel: isCustom
            ? props.customDescColor
            : isDark
              ? "#9CA3AF"
              : "#4B5563",
        closeBg: isCustom
            ? props.customIconBoxBg
            : isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.05)",
        closeColor: isCustom
            ? props.customDescColor
            : isDark
              ? "#9CA3AF"
              : "#6B7280",
        btnBg: isCustom
            ? props.customBtnBg
            : isDark
              ? "rgba(99, 102, 241, 0.2)"
              : "#4F46E5",
        btnText: isCustom
            ? props.customBtnText
            : isDark
              ? "#A5B4FC"
              : "#FFFFFF",
        btnBorder: isCustom
            ? props.customBtnBorder
            : isDark
              ? "rgba(99, 102, 241, 0.3)"
              : "#4F46E5",
    }

    // Dynamic Width Calculation
    const triggerWidthStyle = props.isAutoWidth
        ? "auto"
        : `${props.triggerWidth}px`

    // ============================================================
    // STATIC RENDERER FALLBACK - No animations, no effects
    // ============================================================
    if (isStaticRenderer) {
        return (
            <div
                style={{
                    display: "inline-block",
                    width: props.isAutoWidth ? "auto" : "100%",
                }}
            >
                <button
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        width: triggerWidthStyle,
                        height: `${props.triggerHeight}px`,
                        padding: props.isAutoWidth ? "0 18px" : "0",
                        borderRadius: `${props.triggerRadius}px`,
                        backgroundColor: props.triggerBg,
                        color: props.triggerTextColor,
                        border: `${props.triggerBorderWidth}px solid ${props.triggerBorderColor}`,
                        fontSize: "14px",
                        fontWeight: 500,
                        cursor: "default",
                        outline: "none",
                        fontFamily:
                            props.fontFamily ||
                            '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                    }}
                >
                    {(props.triggerStyle === "icon" ||
                        props.triggerStyle === "both") && (
                        <SVG.Share style={{ width: "16px", height: "16px" }} />
                    )}
                    {(props.triggerStyle === "text" ||
                        props.triggerStyle === "both") && (
                        <span>{props.triggerText}</span>
                    )}
                </button>
            </div>
        )
    }

    // ============================================================
    // INTERACTIVE RENDERER - Full functionality
    // ============================================================

    const triggerStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: triggerWidthStyle,
        height: `${props.triggerHeight}px`,
        padding: props.isAutoWidth ? "0 18px" : "0",
        borderRadius: `${props.triggerRadius}px`,
        backgroundColor: props.triggerBg,
        color: props.triggerTextColor,
        border: `${props.triggerBorderWidth}px solid ${props.triggerBorderColor}`,
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        outline: "none",
        transition: "all 0.2s ease",
        fontFamily:
            props.fontFamily ||
            '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
    }

    // Render Modal Portal
    const renderOverlay = () => {
        if (!isOpen || !mounted) return null

        return ReactDOM.createPortal(
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 999999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(3, 7, 18, 0.65)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    padding: "16px",
                    boxSizing: "border-box",
                    fontFamily:
                        props.fontFamily ||
                        '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) setIsOpen(false)
                }}
                role="dialog"
                aria-modal="true"
            >
                <style>{`
                    @keyframes cleanPopupScaleIn {
                        from { opacity: 0; transform: scale(0.95) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .clean-social-item {
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .clean-social-item:hover .clean-icon-box {
                        background-color: ${theme.iconBoxHoverBg} !important;
                        transform: translateY(-2px);
                    }
                `}</style>

                {/* MODAL CONTAINER */}
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: "460px",
                        backgroundColor: theme.popupBg,
                        border: `1px solid ${theme.popupBorder}`,
                        borderRadius: "24px",
                        padding: "28px",
                        boxSizing: "border-box",
                        color: theme.headingColor,
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
                        animation:
                            "cleanPopupScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    }}
                >
                    {/* CLOSE BUTTON */}
                    <button
                        onClick={() => setIsOpen(false)}
                        aria-label="Close dialog"
                        style={{
                            position: "absolute",
                            top: "20px",
                            right: "20px",
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: theme.closeBg,
                            color: theme.closeColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            outline: "none",
                        }}
                    >
                        <SVG.Close style={{ width: "16px", height: "16px" }} />
                    </button>

                    {/* HEADER */}
                    <h2
                        style={{
                            margin: "0 0 6px 0",
                            fontSize: "22px",
                            fontWeight: 700,
                            color: theme.headingColor,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        {props.heading}
                    </h2>
                    <p
                        style={{
                            margin: "0 0 20px 0",
                            fontSize: "14px",
                            color: theme.descColor,
                            lineHeight: 1.4,
                        }}
                    >
                        {props.description}
                    </p>

                    {/* LINK PREVIEW CARD */}
                    <div
                        style={{
                            backgroundColor: theme.cardBg,
                            border: `1px solid ${theme.cardBorder}`,
                            borderRadius: "14px",
                            padding: "14px 16px",
                            marginBottom: "24px",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "13px",
                                fontWeight: 500,
                                color: theme.cardUrl,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {props.shareUrl}
                        </div>
                    </div>

                    {/* SOCIAL GRID */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "16px 12px",
                            marginBottom: "24px",
                            justifyItems: "center",
                        }}
                    >
                        {platforms.map((p) => {
                            const IconComponent = p.icon
                            const href = getShareUrl(
                                p.id,
                                props.shareUrl,
                                props.heading
                            )

                            return (
                                <a
                                    key={p.id}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="clean-social-item"
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "8px",
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        width: "100%",
                                    }}
                                >
                                    <div
                                        className="clean-icon-box"
                                        style={{
                                            width: "56px",
                                            height: "56px",
                                            borderRadius: "16px",
                                            backgroundColor: theme.iconBoxBg,
                                            border: `1px solid ${theme.cardBorder}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: theme.iconColor,
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <IconComponent
                                            style={{
                                                width: "22px",
                                                height: "22px",
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: "12px",
                                            color: theme.iconLabel,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {p.name}
                                    </span>
                                </a>
                            )
                        })}

                        {/* MORE OPTIONS BUTTON */}
                        {props.showNativeShare && (
                            <button
                                onClick={handleNativeShare}
                                className="clean-social-item"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "8px",
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    width: "100%",
                                    outline: "none",
                                }}
                            >
                                <div
                                    className="clean-icon-box"
                                    style={{
                                        width: "56px",
                                        height: "56px",
                                        borderRadius: "16px",
                                        backgroundColor: theme.iconBoxBg,
                                        border: `1px solid ${theme.cardBorder}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: theme.iconColor,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <SVG.NativeShare
                                        style={{
                                            width: "22px",
                                            height: "22px",
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: "12px",
                                        color: theme.iconLabel,
                                        fontWeight: 500,
                                        textAlign: "center",
                                    }}
                                >
                                    More Options
                                </span>
                            </button>
                        )}
                    </div>

                    {/* COPY LINK BUTTON */}
                    <button
                        onClick={handleCopyLink}
                        style={{
                            width: "100%",
                            height: "48px",
                            borderRadius: "14px",
                            backgroundColor: copied ? "#10B981" : theme.btnBg,
                            color: copied ? "#FFFFFF" : theme.btnText,
                            border: `1px solid ${copied ? "#10B981" : theme.btnBorder}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            fontSize: "15px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            outline: "none",
                        }}
                    >
                        {copied ? (
                            <>
                                <SVG.Check
                                    style={{ width: "18px", height: "18px" }}
                                />
                                <span>Link Copied</span>
                            </>
                        ) : (
                            <>
                                <SVG.Copy
                                    style={{ width: "18px", height: "18px" }}
                                />
                                <span>Copy Link</span>
                            </>
                        )}
                    </button>
                </div>
            </div>,
            document.body
        )
    }

    return (
        <div
            style={{
                display: "inline-block",
                width: props.isAutoWidth ? "auto" : "100%",
            }}
        >
            <button
                style={triggerStyle}
                onClick={() => setIsOpen(true)}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
                {(props.triggerStyle === "icon" ||
                    props.triggerStyle === "both") && (
                    <SVG.Share style={{ width: "16px", height: "16px" }} />
                )}
                {(props.triggerStyle === "text" ||
                    props.triggerStyle === "both") && (
                    <span>{props.triggerText}</span>
                )}
            </button>

            {renderOverlay()}
        </div>
    )
}

// ============================================================================
// PROPERTY CONTROLS
// ============================================================================
SocialSharePopup.defaultProps = {
    // Trigger Dimensions
    triggerStyle: "both",
    triggerText: "Share",
    isAutoWidth: true,
    triggerWidth: 140,
    triggerHeight: 40,
    triggerRadius: 10,
    triggerBg: "#1F2937",
    triggerTextColor: "#FFFFFF",
    triggerBorderColor: "rgba(255, 255, 255, 0.1)",
    triggerBorderWidth: 1,

    // Content & URL Controls
    heading: "Share Page",
    description: "Share this link with your team or post to social media.",
    shareUrl: "https://mywebsite.com/page",

    // Platforms
    showTwitter: true,
    showLinkedIn: true,
    showFacebook: true,
    showWhatsApp: true,
    showInstagram: true,
    showPinterest: true,
    showEmail: true,
    showNativeShare: true,

    // Theme
    themeMode: "dark",
    customPopupBg: "#0B0E14",
    customPopupBorder: "rgba(255, 255, 255, 0.08)",
    customHeadingColor: "#FFFFFF",
    customDescColor: "#9CA3AF",
    customCardBg: "rgba(255, 255, 255, 0.03)",
    customCardBorder: "rgba(255, 255, 255, 0.06)",
    customIconBoxBg: "rgba(255, 255, 255, 0.05)",
    customIconBoxHoverBg: "rgba(255, 255, 255, 0.12)",
    customIconColor: "#FFFFFF",
    customBtnBg: "rgba(99, 102, 241, 0.2)",
    customBtnText: "#A5B4FC",
    customBtnBorder: "rgba(99, 102, 241, 0.3)",
}

addPropertyControls(SocialSharePopup, {
    // 1. TRIGGER CONTROLS
    triggerStyle: {
        type: ControlType.Enum,
        title: "Trigger Style",
        options: ["text", "icon", "both"],
        optionTitles: ["Text Only", "Icon Only", "Icon + Text"],
    },
    triggerText: {
        type: ControlType.String,
        title: "Trigger Text",
        hidden: (props) => props.triggerStyle === "icon",
    },
    isAutoWidth: {
        type: ControlType.Boolean,
        title: "Auto Width",
        enabledTitle: "Auto",
        disabledTitle: "Custom",
    },
    triggerWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 5,
        max: 400,
        unit: "px",
        hidden: (props) => props.isAutoWidth,
    },
    triggerHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 5,
        max: 80,
        unit: "px",
    },
    triggerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        unit: "px",
    },
    triggerBg: { type: ControlType.Color, title: "Trigger Bg" },
    triggerTextColor: { type: ControlType.Color, title: "Text Color" },

    // 2. CONTENT & URL CONTROLS
    heading: { type: ControlType.String, title: "Heading" },
    description: { type: ControlType.String, title: "Description" },
    shareUrl: { type: ControlType.String, title: "Share URL" },

    // 3. PLATFORM TOGGLES
    showTwitter: { type: ControlType.Boolean, title: "X / Twitter" },
    showLinkedIn: { type: ControlType.Boolean, title: "LinkedIn" },
    showFacebook: { type: ControlType.Boolean, title: "Facebook" },
    showWhatsApp: { type: ControlType.Boolean, title: "WhatsApp" },
    showInstagram: { type: ControlType.Boolean, title: "Instagram" },
    showPinterest: { type: ControlType.Boolean, title: "Pinterest" },
    showEmail: { type: ControlType.Boolean, title: "Email" },
    showNativeShare: { type: ControlType.Boolean, title: "More Options" },

    // 4. THEME CONTROLS
    themeMode: {
        type: ControlType.Enum,
        title: "Theme Mode",
        options: ["dark", "light", "custom"],
        optionTitles: ["Dark", "Light", "Custom Colors"],
    },

    // 5. CUSTOM COLOR CONTROLS
    customPopupBg: {
        type: ControlType.Color,
        title: "Popup Bg",
        hidden: (props) => props.themeMode !== "custom",
    },
    customPopupBorder: {
        type: ControlType.Color,
        title: "Popup Border",
        hidden: (props) => props.themeMode !== "custom",
    },
    customHeadingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        hidden: (props) => props.themeMode !== "custom",
    },
    customDescColor: {
        type: ControlType.Color,
        title: "Text/Desc Color",
        hidden: (props) => props.themeMode !== "custom",
    },
    customIconBoxBg: {
        type: ControlType.Color,
        title: "Icon Box Bg",
        hidden: (props) => props.themeMode !== "custom",
    },
    customIconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        hidden: (props) => props.themeMode !== "custom",
    },
    customBtnBg: {
        type: ControlType.Color,
        title: "Copy Btn Bg",
        hidden: (props) => props.themeMode !== "custom",
    },
    customBtnText: {
        type: ControlType.Color,
        title: "Copy Btn Text",
        hidden: (props) => props.themeMode !== "custom",
    },
})
