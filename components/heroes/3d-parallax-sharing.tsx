// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
    useSpring,
} from "framer-motion"
import { useState, useEffect, useCallback, useRef } from "react"

// ─── FAB icon set (Lucide-Formen, fest eingebaut, keine Abhängigkeit) ────────

const FAB_ICONS: Record<string, any> = {
    Plus: (
        <>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </>
    ),
    Share: (
        <>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
        </>
    ),
    Send: (
        <>
            <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
            <path d="m21.854 2.147-10.94 10.939" />
        </>
    ),
    Link: (
        <>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
    ),
    ExternalLink: (
        <>
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </>
    ),
    Copy: (
        <>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </>
    ),
    Heart: (
        <>
            <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
        </>
    ),
    Star: (
        <>
            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </>
    ),
    Bookmark: (
        <>
            <path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" />
        </>
    ),
    ThumbsUp: (
        <>
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
            <path d="M7 10v12" />
        </>
    ),
    Smile: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" x2="9.01" y1="9" y2="9" />
            <line x1="15" x2="15.01" y1="9" y2="9" />
        </>
    ),
    Gift: (
        <>
            <path d="M12 7v14" />
            <path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
            <path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" />
            <rect x="3" y="7" width="18" height="4" rx="1" />
        </>
    ),
    Message: (
        <>
            <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
        </>
    ),
    Mail: (
        <>
            <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
            <rect x="2" y="4" width="20" height="16" rx="2" />
        </>
    ),
    AtSign: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
        </>
    ),
    Hash: (
        <>
            <line x1="4" x2="20" y1="9" y2="9" />
            <line x1="4" x2="20" y1="15" y2="15" />
            <line x1="10" x2="8" y1="3" y2="21" />
            <line x1="16" x2="14" y1="3" y2="21" />
        </>
    ),
    Megaphone: (
        <>
            <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
            <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
            <path d="M8 6v8" />
        </>
    ),
    Bell: (
        <>
            <path d="M10.268 21a2 2 0 0 0 3.464 0" />
            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
        </>
    ),
    Rss: (
        <>
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
        </>
    ),
    Users: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <path d="M16 3.128a4 4 0 0 1 0 7.744" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <circle cx="9" cy="7" r="4" />
        </>
    ),
    Globe: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
        </>
    ),
    Sparkles: (
        <>
            <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
            <path d="M20 2v4" />
            <path d="M22 4h-4" />
            <circle cx="4" cy="20" r="2" />
        </>
    ),
    Zap: (
        <>
            <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
        </>
    ),
    Menu: (
        <>
            <path d="M4 5h16" />
            <path d="M4 12h16" />
            <path d="M4 19h16" />
        </>
    ),
    Dots: (
        <>
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
        </>
    ),
}
const FAB_ICON_KEYS = Object.keys(FAB_ICONS)

function FabGlyph({
    name,
    size,
    weight,
}: {
    name: string
    size: number
    weight: number
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth={weight}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {FAB_ICONS[name] || FAB_ICONS.Plus}
        </svg>
    )
}

const FAB_ICON_LAYER: any = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

//  Social platform config
const PLATFORMS = {
    twitter: {
        label: "X / Twitter",
        icon: (size: number) => (
            <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                fill="currentColor"
            >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        color: "#000000",
        getUrl: (url: string, text: string) =>
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    linkedin: {
        label: "LinkedIn",
        icon: (size: number) => (
            <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                fill="currentColor"
            >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
        color: "#0A66C2",
        getUrl: (url: string) =>
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    facebook: {
        label: "Facebook",
        icon: (size: number) => (
            <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                fill="currentColor"
            >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
        color: "#1877F2",
        getUrl: (url: string) =>
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    whatsapp: {
        label: "WhatsApp",
        icon: (size: number) => (
            <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                fill="currentColor"
            >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
            </svg>
        ),
        color: "#25D366",
        getUrl: (url: string, text: string) =>
            `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
    },
    email: {
        label: "Email",
        icon: (size: number) => (
            <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
        ),
        color: "#6366F1",
        getUrl: (url: string, text: string, emailSubject: string) =>
            `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(text + "\n\n" + url)}`,
    },
    copy: {
        label: "Copy Link",
        icon: (size: number, copied: boolean) =>
            copied ? (
                <svg
                    viewBox="0 0 24 24"
                    width={size}
                    height={size}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            ) : (
                <svg
                    viewBox="0 0 24 24"
                    width={size}
                    height={size}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
            ),
        color: "#64748B",
        getUrl: () => "",
    },
}

type PlatformKey = keyof typeof PLATFORMS

// NavItem sub-component
interface NavItemProps {
    platformKey: PlatformKey
    index: number
    total: number
    isOpen: boolean
    spread: number
    itemSize: number
    iconSize: number
    startAngle: number
    useCustomColors: boolean
    customColor: string
    iconColor: string
    depth: number
    parallaxStrength: number
    springX: any
    springY: any
    shareUrl: string
    shareText: string
    emailSubject: string
    tooltipEnabled: boolean
    tooltipFontSize: number
    tooltipColor: string
    tooltipBg: string
    glowEnabled: boolean
    glowIntensity: number
    copied: boolean
    onCopy: () => void
    isOtherHovered: boolean
    onHover: () => void
    onHoverEnd: () => void
    isStatic: boolean
}

function NavItem({
    platformKey,
    index,
    total,
    isOpen,
    spread,
    itemSize,
    iconSize,
    startAngle,
    useCustomColors,
    customColor,
    iconColor,
    depth,
    parallaxStrength,
    springX,
    springY,
    shareUrl,
    shareText,
    emailSubject,
    tooltipEnabled,
    tooltipFontSize,
    tooltipColor,
    tooltipBg,
    glowEnabled,
    glowIntensity,
    copied,
    onCopy,
    isOtherHovered,
    onHover,
    onHoverEnd,
    isStatic,
}: NavItemProps) {
    const platform = PLATFORMS[platformKey]
    const color = useCustomColors ? customColor : platform.color

    // Orbit position — semicircle: icons spread over 180°
    const angleStep = total > 1 ? 180 / (total - 1) : 0
    const angle = startAngle + angleStep * index
    const rad = (angle * Math.PI) / 180
    const targetX = Math.cos(rad) * spread
    const targetY = Math.sin(rad) * spread

    // Attraction parallax: icon moves TOWARD the mouse from its orbit position.
    // When mouse is at (mx, my) relative to FAB center, each icon is pulled by
    // (mouse − ownPosition) × depth × strength × factor.
    // At mouse = own position → offset 0. Further away → stronger pull toward cursor.
    const parallaxX = useTransform(
        springX,
        (mx: number) => (mx - targetX) * depth * parallaxStrength * 0.12
    )
    const parallaxY = useTransform(
        springY,
        (my: number) => (my - targetY) * depth * parallaxStrength * 0.12
    )

    // Perspective scale: depth=1 = full size, depth=0.1 = slightly smaller
    const perspectiveScale = 0.88 + depth * 0.12

    // Depth-based shadow
    const shadowBlur = 8 + depth * 20
    const shadowOpacity = 0.15 + depth * 0.25
    const shadow = `0 ${Math.round(depth * 12)}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity})`

    // Glow
    const glowShadow = glowEnabled
        ? `, 0 0 ${Math.round(glowIntensity * depth * 20)}px ${color}60`
        : ""

    const handleClick = () => {
        if (platformKey === "copy") {
            onCopy()
        } else {
            const url = platform.getUrl(shareUrl, shareText, emailSubject)
            if (url) window.open(url, "_blank", "noopener,noreferrer")
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key={platformKey}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        marginLeft: -(itemSize / 2),
                        marginTop: -(itemSize / 2),
                        zIndex: Math.round(depth * 10) + 1,
                        pointerEvents: "auto",
                    }}
                    initial={
                        isStatic
                            ? false
                            : { x: 0, y: 0, scale: 0, opacity: 0 }
                    }
                    animate={{
                        x: targetX,
                        y: targetY,
                        scale: perspectiveScale,
                        opacity: 1,
                    }}
                    exit={{
                        x: 0,
                        y: 0,
                        scale: 0,
                        opacity: 0,
                        transition: {
                            type: "spring",
                            stiffness: 350,
                            damping: 24,
                            delay: (total - 1 - index) * 0.04,
                        },
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 24,
                        delay: index * 0.07,
                    }}
                >
                    {/* Parallax layer — also handles blur/dim when sibling is hovered */}
                    <motion.div
                        style={{ x: parallaxX, y: parallaxY }}
                        animate={{
                            filter: isOtherHovered
                                ? "blur(1.5px) brightness(0.55)"
                                : "blur(0px) brightness(1)",
                            opacity: isOtherHovered ? 0.65 : 1,
                        }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                    >
                        {/* Tooltip */}
                        {tooltipEnabled && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                whileHover={{ opacity: 1, y: 0 }}
                                style={{
                                    position: "absolute",
                                    bottom: "calc(100% + 8px)",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    background: tooltipBg,
                                    color: tooltipColor,
                                    padding: "4px 10px",
                                    borderRadius: 6,
                                    fontSize: tooltipFontSize,
                                    whiteSpace: "nowrap",
                                    pointerEvents: "none",
                                    userSelect: "none",
                                    fontFamily: "sans-serif",
                                    fontWeight: 500,
                                    lineHeight: 1.4,
                                }}
                            >
                                {platformKey === "copy" && copied
                                    ? "Copied!"
                                    : platform.label}
                            </motion.div>
                        )}

                        {/* Icon button */}
                        <motion.button
                            onClick={handleClick}
                            onMouseEnter={onHover}
                            onMouseLeave={onHoverEnd}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                width: itemSize,
                                height: itemSize,
                                borderRadius: "50%",
                                background:
                                    platformKey === "copy" && copied
                                        ? "#22C55E"
                                        : color,
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: iconColor,
                                boxShadow: shadow + glowShadow,
                                transition: "background 0.3s ease",
                                flexShrink: 0,
                            }}
                        >
                            {platform.icon(
                                iconSize,
                                platformKey === "copy" ? copied : false
                            )}
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// Main compo
/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 420
 * @framerDisableUnlink
 */
export default function ParallaxSocialFAB(props: any) {
    const {
        style,
        shareUrl,
        shareText,
        emailSubject,
        showTwitter,
        showLinkedin,
        showFacebook,
        showWhatsapp,
        showEmail,
        showCopy,
        depthTwitter,
        depthLinkedin,
        depthFacebook,
        depthWhatsapp,
        depthEmail,
        depthCopy,
        fabSize,
        fabColor,
        fabIconColor,
        fabIcon,
        fabIconWeight,
        fabShadow,
        fabOpenOnHover,
        itemSize,
        iconSizeRatio,
        spread,
        startAngle,
        useCustomColors,
        customItemColor,
        iconColor,
        parallaxStrength,
        parallaxSmoothing,
        tooltipEnabled,
        tooltipFontSize,
        tooltipColor,
        tooltipBg,
        glowEnabled,
        glowIntensity,
        pulseEnabled,
    } = props

    // isCanvas: nur Framer-Canvas -> Menue offen zeigen, keine Maus-Listener.
    // isStatic: Canvas UND statischer Export -> alle Dauer- und Einflug-
    // Animationen aus (Marketplace-Anforderung).
    const isCanvas = RenderTarget.hasRestrictions()
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [hoveredKey, setHoveredKey] = useState<string | null>(null)

    const rawMouseX = useMotionValue(0)
    const rawMouseY = useMotionValue(0)
    const springStiffness = 30 + (1 - parallaxSmoothing) * 120
    const springDamping = 15 + parallaxSmoothing * 25

    const springX = useSpring(rawMouseX, {
        stiffness: springStiffness,
        damping: springDamping,
    })
    const springY = useSpring(rawMouseY, {
        stiffness: springStiffness,
        damping: springDamping,
    })

    // Track mouse
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        rawMouseX.set(e.clientX - cx)
        rawMouseY.set(e.clientY - cy)
    }, [])

    const handleMouseLeave = useCallback(() => {
        rawMouseX.set(0)
        rawMouseY.set(0)
    }, [])

    useEffect(() => {
        if (isCanvas) return
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseleave", handleMouseLeave)
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [])

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(
                shareUrl || window.location.href
            )
        } catch {
            const el = document.createElement("textarea")
            el.value = shareUrl || window.location.href
            document.body.appendChild(el)
            el.select()
            document.execCommand("copy")
            document.body.removeChild(el)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [shareUrl])

    // Build platform list
    const platformEntries: { key: PlatformKey; depth: number }[] = []
    if (showTwitter)
        platformEntries.push({ key: "twitter", depth: depthTwitter })
    if (showLinkedin)
        platformEntries.push({ key: "linkedin", depth: depthLinkedin })
    if (showFacebook)
        platformEntries.push({ key: "facebook", depth: depthFacebook })
    if (showWhatsapp)
        platformEntries.push({ key: "whatsapp", depth: depthWhatsapp })
    if (showEmail) platformEntries.push({ key: "email", depth: depthEmail })
    if (showCopy) platformEntries.push({ key: "copy", depth: depthCopy })

    const iconSize = Math.round(itemSize * iconSizeRatio)

    const fabIconPx = fabSize * 0.45
    const isDefaultPlus = fabIcon === "Plus"

    const fabGlow = glowEnabled
        ? `, 0 0 ${Math.round(glowIntensity * 24)}px ${fabColor}80`
        : ""

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
            onMouseLeave={
                !isCanvas
                    ? () => {
                          setIsOpen(false)
                          setHoveredKey(null)
                      }
                    : undefined
            }
        >
            {platformEntries.map(({ key, depth }, i) => (
                <NavItem
                    key={key}
                    platformKey={key}
                    index={i}
                    total={platformEntries.length}
                    isOpen={isOpen || (isCanvas && true)}
                    spread={spread}
                    itemSize={itemSize}
                    iconSize={iconSize}
                    startAngle={startAngle}
                    useCustomColors={useCustomColors}
                    customColor={customItemColor}
                    iconColor={iconColor}
                    depth={depth}
                    parallaxStrength={parallaxStrength}
                    springX={springX}
                    springY={springY}
                    shareUrl={
                        shareUrl ||
                        (typeof window !== "undefined"
                            ? window.location.href
                            : "")
                    }
                    shareText={shareText}
                    emailSubject={emailSubject}
                    tooltipEnabled={tooltipEnabled}
                    tooltipFontSize={tooltipFontSize}
                    tooltipColor={tooltipColor}
                    tooltipBg={tooltipBg}
                    glowEnabled={glowEnabled}
                    glowIntensity={glowIntensity}
                    copied={copied}
                    onCopy={handleCopy}
                    isOtherHovered={hoveredKey !== null && hoveredKey !== key}
                    onHover={() => setHoveredKey(key)}
                    onHoverEnd={() => setHoveredKey(null)}
                    isStatic={isStatic}
                />
            ))}

            {/* FAB */}
            <motion.button
                onClick={() => setIsOpen((v) => !v)}
                onMouseEnter={
                    fabOpenOnHover && !isCanvas
                        ? () => setIsOpen(true)
                        : undefined
                }
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                style={{
                    position: "absolute",
                    width: fabSize,
                    height: fabSize,
                    borderRadius: "50%",
                    background: fabColor,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: fabIconColor,
                    zIndex: 20,
                    boxShadow: fabShadow + fabGlow,
                    outline: "none",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: fabIconPx,
                        height: fabIconPx,
                    }}
                >
                    {!isDefaultPlus && (
                        <motion.div
                            animate={{
                                rotate: isOpen ? 45 : 0,
                                opacity: isOpen ? 0 : 1,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 22,
                            }}
                            style={FAB_ICON_LAYER}
                        >
                            <FabGlyph
                                name={fabIcon}
                                size={fabIconPx}
                                weight={fabIconWeight}
                            />
                        </motion.div>
                    )}

                    <motion.div
                        animate={{
                            rotate: isOpen ? 45 : 0,
                            opacity: isDefaultPlus ? 1 : isOpen ? 1 : 0,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 22,
                        }}
                        style={FAB_ICON_LAYER}
                    >
                        <FabGlyph
                            name="Plus"
                            size={fabIconPx}
                            weight={fabIconWeight}
                        />
                    </motion.div>
                </div>
            </motion.button>

            {/* Pulse ring */}
            {pulseEnabled && !isOpen && !isStatic && (
                <motion.div
                    animate={{ scale: [1, 1.5, 1.9], opacity: [0.55, 0.25, 0] }}
                    transition={{
                        repeat: Infinity,
                        duration: 4.0,
                        ease: "easeOut",
                        times: [0, 0.25, 1],
                    }}
                    style={{
                        position: "absolute",
                        width: fabSize,
                        height: fabSize,
                        borderRadius: "50%",
                        background: "transparent",
                        border: `1px solid ${fabColor}`,
                        zIndex: 10,
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

// Default Properts
ParallaxSocialFAB.defaultProps = {
    shareUrl: "",
    shareText: "Check this out:",
    emailSubject: "Interesting Link",
    showTwitter: true,
    showLinkedin: true,
    showFacebook: false,
    showWhatsapp: true,
    showEmail: false,
    showCopy: true,
    depthTwitter: 1.0,
    depthLinkedin: 0.75,
    depthFacebook: 0.55,
    depthWhatsapp: 0.9,
    depthEmail: 0.65,
    depthCopy: 0.8,
    fabSize: 56,
    fabColor: "#111111",
    fabIconColor: "#ffffff",
    fabIcon: "Plus",
    fabIconWeight: 2.5,
    fabShadow: "0 8px 24px rgba(0,0,0,0.3)",
    fabOpenOnHover: false,
    itemSize: 48,
    iconSizeRatio: 0.45,
    spread: 130,
    startAngle: -180,
    useCustomColors: false,
    customItemColor: "#333333",
    iconColor: "#ffffff",
    parallaxStrength: 1.0,
    parallaxSmoothing: 0.6,
    tooltipEnabled: true,
    tooltipFontSize: 12,
    tooltipColor: "#ffffff",
    tooltipBg: "rgba(0,0,0,0.75)",
    glowEnabled: false,
    glowIntensity: 0.5,
    pulseEnabled: true,
}

// Property Controlz
addPropertyControls(ParallaxSocialFAB, {
    shareUrl: {
        type: ControlType.String,
        title: "Share URL",
        placeholder: "https://… (empty = current page)",
        defaultValue: "",
    },
    shareText: {
        type: ControlType.String,
        title: "Share Text",
        defaultValue: "Check this out:",
    },
    emailSubject: {
        type: ControlType.String,
        title: "Email Subject",
        defaultValue: "Interesting Link",
    },

    // Platformz
    showTwitter: {
        type: ControlType.Boolean,
        title: "X / Twitter",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showLinkedin: {
        type: ControlType.Boolean,
        title: "LinkedIn",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showFacebook: {
        type: ControlType.Boolean,
        title: "Facebook",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showWhatsapp: {
        type: ControlType.Boolean,
        title: "WhatsApp",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showEmail: {
        type: ControlType.Boolean,
        title: "Email",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showCopy: {
        type: ControlType.Boolean,
        title: "Copy Link",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // Parallax
    depthTwitter: {
        type: ControlType.Number,
        title: "Depth: X",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: 1.0,
        displayStepper: false,
        hidden: (props: any) => !props.showTwitter,
        description: "1.0 = near (moves a lot), 0.1 = far (barely moves)",
    },
    depthLinkedin: {
        type: ControlType.Number,
        title: "Depth: LinkedIn",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.75,
        displayStepper: false,
        hidden: (props: any) => !props.showLinkedin,
    },
    depthFacebook: {
        type: ControlType.Number,
        title: "Depth: Facebook",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.55,
        displayStepper: false,
        hidden: (props: any) => !props.showFacebook,
    },
    depthWhatsapp: {
        type: ControlType.Number,
        title: "Depth: WhatsApp",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.9,
        displayStepper: false,
        hidden: (props: any) => !props.showWhatsapp,
    },
    depthEmail: {
        type: ControlType.Number,
        title: "Depth: Email",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.65,
        displayStepper: false,
        hidden: (props: any) => !props.showEmail,
    },
    depthCopy: {
        type: ControlType.Number,
        title: "Depth: Copy",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.8,
        displayStepper: false,
        hidden: (props: any) => !props.showCopy,
    },

    // Main Button "+"
    fabSize: {
        type: ControlType.Number,
        title: "FAB Size",
        min: 36,
        max: 96,
        step: 2,
        defaultValue: 56,
        unit: "px",
        displayStepper: true,
    },
    fabColor: {
        type: ControlType.Color,
        title: "FAB Color",
        defaultValue: "#111111",
    },
    fabIconColor: {
        type: ControlType.Color,
        title: "FAB Icon Color",
        defaultValue: "#ffffff",
    },
    fabIcon: {
        type: ControlType.Enum,
        title: "FAB Icon",
        options: FAB_ICON_KEYS,
        optionTitles: FAB_ICON_KEYS,
        defaultValue: "Plus",
        description:
            "Icon shown when closed. On open it rotates away while the X rotates in.",
    },
    fabIconWeight: {
        type: ControlType.Number,
        title: "Icon Stroke",
        min: 1,
        max: 4,
        step: 0.1,
        defaultValue: 2.5,
    },
    fabShadow: {
        type: ControlType.BoxShadow,
        title: "FAB Shadow",
        defaultValue: "0 8px 24px rgba(0,0,0,0.3)",
    },
    fabOpenOnHover: {
        type: ControlType.Boolean,
        title: "Open on Hover",
        defaultValue: false,
        enabledTitle: "Hover",
        disabledTitle: "Click",
        description: "Opens the menu on hover instead of click",
    },

    // Itemz
    itemSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 32,
        max: 80,
        step: 2,
        defaultValue: 48,
        unit: "px",
        displayStepper: true,
    },
    iconSizeRatio: {
        type: ControlType.Number,
        title: "Icon SVG Ratio",
        min: 0.3,
        max: 0.7,
        step: 0.05,
        defaultValue: 0.45,
        description: "SVG size relative to button (0.45 = 45%)",
    },
    spread: {
        type: ControlType.Number,
        title: "Orbit Radius",
        min: 60,
        max: 240,
        step: 4,
        defaultValue: 130,
        unit: "px",
    },
    startAngle: {
        type: ControlType.Number,
        title: "Start Angle",
        min: -180,
        max: 180,
        step: 15,
        defaultValue: -90,
        unit: "°",
        description: "-90° = first icon top, 0° = right, 90° = bottom",
    },
    useCustomColors: {
        type: ControlType.Boolean,
        title: "Custom Colors",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Brand",
    },
    customItemColor: {
        type: ControlType.Color,
        title: "Item Background",
        defaultValue: "#333333",
        hidden: (props: any) => !props.useCustomColors,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#ffffff",
        hidden: (props: any) => !props.useCustomColors,
    },

    // Parallaxxx
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax Strength",
        min: 0,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.0,
        description: "0 = no parallax, 2+ = very strong",
    },
    parallaxSmoothing: {
        type: ControlType.Number,
        title: "Parallax Smoothing",
        min: 0,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.6,
        description: "0 = direct/crisp, 1.0 = very smooth/slow",
    },

    //  Glow
    glowEnabled: {
        type: ControlType.Boolean,
        title: "Glow Effect",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.5,
        hidden: (props: any) => !props.glowEnabled,
    },

    //  Pulse lowkey i dont understand them
    pulseEnabled: {
        type: ControlType.Boolean,
        title: "Pulse Ring",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Animated ring when the menu is closed",
    },
})
