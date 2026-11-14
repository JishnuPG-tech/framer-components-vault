// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useEffect, useState, useRef, useId } from "react"
import React from "react"

/**
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight auto
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */

export default function GitHubRepoStats(props: any) {
    const {
        cardType,
        username,
        repoPath,

        // Custom Mode Props
        customAvatar,
        customName,
        customBio,
        customStat1,
        customStat2,
        customStat3,
        customStat4,
        customLabel1,
        customLabel2,
        customLabel3,
        customLabel4,
        customUserType,

        // Aesthetics
        layoutVariant,
        colorTheme,
        customBgColor,
        customTextColor,
        cardRadius,
        cardPadding,

        // Visibility
        showAvatar,
        showDescription,
        showDates,
        showUserType,

        // Effects
        enableTilt,
        enableEdgeGlow,
        glowColor,
        hoverEffect,

        style,
    } = props

    const id = useId().replace(/:/g, "")
    const instanceClass = `gh-stats-${id}`

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [width, setWidth] = useState(360)

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)

    // Resize Observer for mobile responsiveness
    useEffect(() => {
        const node = containerRef.current
        if (!node) return
        const observer = new ResizeObserver((entries) => {
            if (entries[0] && entries[0].contentRect.width > 0) {
                setWidth(entries[0].contentRect.width)
            }
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    const isMobile = width < 320

    // API Fetcher logic
    useEffect(() => {
        let mounted = true
        const delayDebounceFn = setTimeout(async () => {
            if (!mounted) return
            setLoading(true)
            setLoading(true)
            let targetUser = username ? username.trim() : "sebmarkbage"
            let targetRepo = repoPath ? repoPath.trim() : "facebook/react"

            try {
                const url =
                    cardType === "user"
                        ? `https://api.github.com/users/${targetUser}`
                        : `https://api.github.com/repos/${targetRepo}`
                const res = await fetch(url)
                if (!res.ok) throw new Error("Target not found")
                const result = await res.json()
                if (mounted) setData(result)
            } catch (err: any) {
                // Error handled gracefully by loading state/fallback
            } finally {
                if (mounted) setLoading(false)
            }
        }, 800)

        return () => {
            mounted = false
            clearTimeout(delayDebounceFn)
        }
    }, [username, repoPath, cardType])

    // Physics for 3D Tilt
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"])

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        x.set(mouseX / rect.width - 0.5)
        y.set(mouseY / rect.height - 0.5)
        setMousePosition({ x: mouseX, y: mouseY })
    }

    // Dynamic Color & Theme System
    let finalBgColor = customBgColor,
        finalTextColor = customTextColor
    let primaryBg = "#ea580c",
        primaryText = "#ffffff",
        primaryShadow = "0 8px 16px rgba(0,0,0,0.1)"

    if (colorTheme === "orange") {
        finalBgColor = "#FFF8F1"
        finalTextColor = "#6B4F3F"
        primaryBg = "linear-gradient(135deg, #FF9D42, #FF6B00)"
        primaryShadow = "0 10px 25px rgba(255, 107, 0, 0.2)"
    } else if (colorTheme === "purple") {
        finalBgColor = "#f3f0ff"
        finalTextColor = "#4c1d95"
        primaryBg = "#8162f1"
        primaryShadow = "0 10px 25px rgba(129, 98, 241, 0.2)"
    } else if (colorTheme === "dark") {
        finalBgColor = "#0A0C10" // Premium Midnight
        finalTextColor = "#ffffff"
        primaryBg = "#ffffff"
        primaryText = "#0d1117"
        primaryShadow = "0 8px 32px rgba(0,0,0,0.4)"
    } else if (colorTheme === "custom") {
        finalBgColor = customBgColor
        finalTextColor = customTextColor
        primaryBg = finalTextColor
        primaryText = finalBgColor
    }

    const isCentered = layoutVariant === "centered",
        isBeam = layoutVariant === "beam",
        isDashed = layoutVariant === "dashed"

    const beamColor =
        colorTheme === "orange"
            ? "#FF9D42"
            : colorTheme === "purple"
              ? "#8162f1"
              : colorTheme === "dark"
                ? "#3B82F6" // Electric Blue for Dark Mode
                : finalTextColor

    const componentStyles = `
        .${instanceClass} { position: relative; z-index: 1; overflow: hidden; transform: translateZ(0); border-radius: ${cardRadius}px; }
        .${instanceClass}::before {
            content: ''; 
            position: absolute; 
            left: -100%; 
            top: -100%; 
            width: 300%; 
            height: 300%;
            background: conic-gradient(
                from 0deg, 
                transparent 50%, 
                ${beamColor}00 60%, 
                ${beamColor}22 70%, 
                ${beamColor}66 85%, 
                ${beamColor} 95%, 
                #ffffff 100%
            );
            animation: gh-beam-rotate-${id} 4s linear infinite; 
            z-index: -2;
            filter: blur(1.5px);
        }
        .${instanceClass}::after {
            content: ''; 
            position: absolute; 
            inset: 2px; 
            background: ${finalBgColor};
            border-radius: ${Math.max(0, cardRadius - 2)}px; 
            z-index: -1;
        }
        @keyframes gh-beam-rotate-${id} { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        .gh-stats-card-${id} {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .gh-stats-card-${id}::-webkit-scrollbar {
            display: none;
        }
    `

    // Data selection
    const avatarFallback =
        "https://framerusercontent.com/images/9S9I6vHjYvofvXpS6K9vN206hP8nQ.png" // High-quality character portrait
    const displayAvatar =
        customAvatar ||
        (cardType === "user" ? data?.avatar_url : data?.owner?.avatar_url) ||
        avatarFallback
    const displayName =
        customName || data?.name || data?.login || (loading ? "..." : "Target")
    const displayBio =
        customBio || (cardType === "user" ? data?.bio : data?.description)
    const displayUserType = customUserType || data?.type || "User"
    const displayLocation = data?.location
    const displayCompany = data?.company

    const profileUrl =
        cardType === "user"
            ? `https://github.com/${data?.login || (username ? username.trim() : "fonts4u")}`
            : `https://github.com/${data?.full_name || (repoPath ? repoPath.trim() : "facebook/react")}`

    const stats = (
        cardType === "user"
            ? [
                  {
                      value: formatNumber(data?.followers),
                      label: "FOLLOWERS",
                      color: "#3B82F6",
                      icon: <EyeIcon />,
                  },
                  {
                      value: formatNumber(data?.following),
                      label: "FOLLOWING",
                      color: "#10B981",
                      icon: <ForkIcon />,
                  },
                  {
                      value: formatNumber(data?.public_repos),
                      label: "REPOS",
                      color: "#F59E0B",
                      icon: <StarIcon />,
                  },
                  {
                      value: formatNumber(data?.public_gists),
                      label: "GISTS",
                      color: "#EF4444",
                      icon: <IssueIcon />,
                  },
              ]
            : [
                  {
                      value: formatNumber(data?.stargazers_count),
                      label: "STARS",
                      color: "#F59E0B",
                      icon: <StarIcon />,
                  },
                  {
                      value: formatNumber(data?.forks_count),
                      label: "FORKS",
                      color: "#10B981",
                      icon: <ForkIcon />,
                  },
                  {
                      value: formatNumber(data?.watchers_count),
                      label: "WATCHERS",
                      color: "#3B82F6",
                      icon: <EyeIcon />,
                  },
                  {
                      value: formatNumber(data?.open_issues_count),
                      label: "ISSUES",
                      color: "#EF4444",
                      icon: <IssueIcon />,
                  },
              ]
    ).map((s, i) => {
        const customVals = [
            { val: customStat1, lbl: customLabel1 },
            { val: customStat2, lbl: customLabel2 },
            { val: customStat3, lbl: customLabel3 },
            { val: customStat4, lbl: customLabel4 },
        ]
        // Only override if the custom value is NOT the default from API results when we have data
        // Or simply allow them to override if they are set.
        // To keep it clean, if user types something, we use it.
        return {
            ...s,
            value: customVals[i].val || s.value,
            label: customVals[i].lbl || s.label,
            bgOpacity: colorTheme === "dark" ? "20" : "12",
        }
    })

    function formatNumber(num: any) {
        if (num === undefined || num === null) return "0"
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "m"
        if (num >= 1000) return (num / 1000).toFixed(1) + "k"
        return num.toString()
    }

    return (
        <motion.div
            style={{
                ...style,
                perspective: 1200,
                padding: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                willChange: "transform",
                overflow: "hidden",
            }}
            whileHover={hoverEffect && !isBeam ? { y: -8 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <style>{componentStyles}</style>
            <motion.div
                ref={containerRef}
                className={`gh-stats-card-${id} ${isBeam ? instanceClass : ""}`}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => {
                    setIsHovered(false)
                    if (enableTilt) {
                        x.set(0)
                        y.set(0)
                    }
                }}
                style={{
                    backgroundColor: isBeam ? "transparent" : finalBgColor,
                    borderRadius: cardRadius,
                    padding: isMobile ? cardPadding * 0.75 : cardPadding,
                    color: finalTextColor,
                    display: "flex",
                    flexDirection: "column",
                    gap: 24,
                    height: "auto",
                    width: "100%",
                    maxWidth: "1200",
                    overflow: "hidden",
                    rotateX: enableTilt ? rotateX : 0,
                    rotateY: enableTilt ? rotateY : 0,
                    border: isDashed
                        ? `2px dashed ${finalTextColor}44`
                        : isBeam
                          ? "none"
                          : `1px solid ${finalTextColor}15`,
                    alignItems: isCentered ? "center" : "flex-start",
                    textAlign: isCentered ? "center" : "left",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    textRendering: "optimizeLegibility",
                    transformStyle: "flat",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "translateZ(0) scale(1.0)",
                    perspective: "1000px",
                    willChange: "transform",
                    boxShadow:
                        colorTheme === "orange"
                            ? "0 20px 40px rgba(107, 79, 63, 0.08)"
                            : !isBeam && !isDashed
                              ? "0 10px 30px rgba(0,0,0,0.08)"
                              : "none",
                }}
            >
                {enableEdgeGlow && (
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: "-1px",
                            borderRadius: cardRadius,
                            padding: "2px",
                            pointerEvents: "none",
                            zIndex: 10,
                            opacity: isHovered ? 1 : 0,
                            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 40%)`,
                            WebkitMask:
                                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            transform: "translateZ(1px)",
                        }}
                    />
                )}

                <div
                    style={{
                        position: "relative",
                        zIndex: 5,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                        height: "100%",
                        transform: "translateZ(10px)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: isCentered ? "column" : "row",
                            gap: 16,
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        {showAvatar && (
                            <div
                                style={{
                                    position: "relative",
                                    width: isCentered ? 80 : 72,
                                    height: isCentered ? 80 : 72,
                                    borderRadius: 999,
                                    overflow: "visible",
                                    flexShrink: 0,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: 999,
                                        overflow: "hidden",
                                        border: `4px solid ${finalTextColor}12`,
                                        boxShadow: `inset 0 2px 4px rgba(0,0,0,0.1)`,
                                        position: "relative",
                                    }}
                                >
                                    <img
                                        src={displayAvatar}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                </div>
                                {data && !customAvatar && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 4,
                                            right: 4,
                                            width: 14,
                                            height: 14,
                                            borderRadius: 999,
                                            backgroundColor: "#238636",
                                            border: `2px solid ${finalBgColor}`,
                                            zIndex: 2,
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 24,
                                    fontWeight: 900,
                                    color: finalTextColor,
                                }}
                            >
                                {displayName}
                            </h2>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                    opacity: 0.5,
                                    fontSize: 14,
                                    fontWeight: 600,
                                }}
                            >
                                <span>
                                    {data?.login
                                        ? `@${data.login}`
                                        : "@github.com"}
                                </span>
                                {showUserType && (
                                    <span
                                        style={{
                                            padding: "2px 6px",
                                            background: `${finalTextColor}15`,
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 800,
                                        }}
                                    >
                                        {displayUserType.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {showDescription && displayBio && (
                        <p
                            style={{
                                margin: 0,
                                fontSize: 14,
                                opacity: 0.95,
                                lineHeight: 1.6,
                                fontWeight: 600,
                            }}
                        >
                            {displayBio}
                        </p>
                    )}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                width < 420
                                    ? "repeat(2, 1fr)"
                                    : "repeat(4, 1fr)",
                            gap: 10,
                            width: "100%",
                        }}
                    >
                        {stats.map((s: any, i) => (
                            <div
                                key={i}
                                style={{
                                    backgroundColor: `${s.color}${s.bgOpacity}`,
                                    borderRadius: 20,
                                    padding: "16px 8px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    alignItems: "center",
                                    border: `1px solid ${s.color}10`,
                                }}
                            >
                                <div style={{ color: s.color }}>{s.icon}</div>
                                <div
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 900,
                                        color: finalTextColor,
                                    }}
                                >
                                    {s.value}
                                </div>
                                <div
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 900,
                                        opacity: 0.65,
                                        color: finalTextColor,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {data && (displayLocation || displayCompany) && (
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            {displayLocation && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "6px 12px",
                                        background: `${finalTextColor}12`,
                                        borderRadius: 100,
                                        fontSize: 13,
                                        fontWeight: 800,
                                        opacity: 1,
                                    }}
                                >
                                    <LocationIcon /> {displayLocation}
                                </div>
                            )}
                            {displayCompany && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "6px 12px",
                                        background: `${finalTextColor}12`,
                                        borderRadius: 100,
                                        fontSize: 13,
                                        fontWeight: 800,
                                        opacity: 1,
                                    }}
                                >
                                    <CompanyIcon /> {displayCompany}
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                            gap: 20,
                        }}
                    >
                        <hr
                            style={{
                                border: "none",
                                height: "1px",
                                background: `${finalTextColor}08`,
                                width: "100%",
                                margin: 0,
                            }}
                        />

                        {showDates && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    width: "100%",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            opacity: 0.5,
                                            fontWeight: 900,
                                            letterSpacing: "0.5px",
                                        }}
                                    >
                                        CREATED
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 800,
                                            color: finalTextColor,
                                        }}
                                    >
                                        {data?.created_at
                                            ? new Date(
                                                  data.created_at
                                              ).toLocaleDateString(undefined, {
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                              })
                                            : "Mar 15, 2009"}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            opacity: 0.5,
                                            fontWeight: 900,
                                            letterSpacing: "0.5px",
                                        }}
                                    >
                                        UPDATED
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 800,
                                            color: finalTextColor,
                                        }}
                                    >
                                        {data?.updated_at
                                            ? new Date(
                                                  data.updated_at
                                              ).toLocaleDateString(undefined, {
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                              })
                                            : "Feb 21, 2026"}
                                    </div>
                                </div>
                            </div>
                        )}

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.open(profileUrl, "_blank")}
                            style={{
                                background: primaryBg,
                                color: primaryText,
                                borderRadius: 100,
                                padding: "16px",
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                fontSize: 16,
                                fontWeight: 800,
                                cursor: "pointer",
                                boxShadow: primaryShadow,
                            }}
                        >
                            <GithubLogo />{" "}
                            {cardType === "user"
                                ? "View Profile"
                                : "View Repository"}
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

// SVGs
const StarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
)
const ForkIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <path d="M18 9v2c0 .6-.4 1-1 1h-4" />
        <path d="M6 9v2c0 .6.4 1 1 1h4" />
        <path d="M12 12v3" />
    </svg>
)
const EyeIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)
const IssueIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
)
const LocationIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
)
const CompanyIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="9" y1="22" x2="9" y2="22" />
        <line x1="15" y1="22" x2="15" y2="22" />
        <line x1="12" y1="2" x2="12" y2="2" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M8 10h.01" />
        <path d="M16 10h.01" />
        <path d="M8 14h.01" />
        <path d="M16 14h.01" />
        <path d="M8 18h.01" />
        <path d="M16 18h.01" />
    </svg>
)
const GithubLogo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
)

addPropertyControls(GitHubRepoStats, {
    cardType: {
        type: ControlType.Enum,
        title: "Data Source",
        options: ["user", "repository"],
        optionTitles: ["GitHub User", "GitHub Repository"],
        defaultValue: "user",
    },
    customAvatar: {
        type: ControlType.Image,
        title: "Image",
    },
    customName: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "fonts4u",
    },
    customBio: {
        type: ControlType.String,
        title: "Bio",
        defaultValue: "Creative Designer & Component Maker.",
    },
    customUserType: {
        type: ControlType.String,
        title: "Tag",
        defaultValue: "PRO",
    },

    customStat1: {
        type: ControlType.String,
        title: "Stat 1 Val",
        defaultValue: "9.3k",
    },
    customLabel1: {
        type: ControlType.String,
        title: "Stat 1 Lbl",
        defaultValue: "FOLLOWERS",
    },
    customStat2: {
        type: ControlType.String,
        title: "Stat 2 Val",
        defaultValue: "37",
    },
    customLabel2: {
        type: ControlType.String,
        title: "Stat 2 Lbl",
        defaultValue: "FOLLOWING",
    },
    customStat3: {
        type: ControlType.String,
        title: "Stat 3 Val",
        defaultValue: "76",
    },
    customLabel3: {
        type: ControlType.String,
        title: "Stat 3 Lbl",
        defaultValue: "REPOS",
    },
    customStat4: {
        type: ControlType.String,
        title: "Stat 4 Val",
        defaultValue: "67",
    },
    customLabel4: {
        type: ControlType.String,
        title: "Stat 4 Lbl",
        defaultValue: "GISTS",
    },

    username: {
        type: ControlType.String,
        title: "Username",
        defaultValue: "fonts4u",
        hidden: (p: any) => p.cardType !== "user",
    },
    repoPath: {
        type: ControlType.String,
        title: "Repo Path",
        defaultValue: "facebook/react",
        hidden: (p: any) => p.cardType !== "repository",
    },

    layoutVariant: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["standard", "centered", "dashed", "beam"],
        defaultValue: "standard",
    },
    colorTheme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["custom", "dark", "orange", "purple"],
        defaultValue: "orange",
    },

    customBgColor: {
        type: ControlType.Color,
        title: "Custom Bg",
        defaultValue: "#ffffff",
        hidden: (p: any) => p.colorTheme !== "custom",
    },
    customTextColor: {
        type: ControlType.Color,
        title: "Custom Text",
        defaultValue: "#111827",
        hidden: (p: any) => p.colorTheme !== "custom",
    },

    cardRadius: { type: ControlType.Number, title: "Radius", defaultValue: 32 },
    cardPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 32,
    },

    showAvatar: {
        type: ControlType.Boolean,
        title: "Show Image",
        defaultValue: true,
    },
    showDescription: {
        type: ControlType.Boolean,
        title: "Show Bio",
        defaultValue: true,
    },
    showUserType: {
        type: ControlType.Boolean,
        title: "Show Tag",
        defaultValue: true,
    },
    showDates: {
        type: ControlType.Boolean,
        title: "Show Dates",
        defaultValue: true,
    },

    enableTilt: {
        type: ControlType.Boolean,
        title: "3D Tilt",
        defaultValue: true,
    },
    enableEdgeGlow: {
        type: ControlType.Boolean,
        title: "Edge Glow",
        defaultValue: true,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "rgba(255, 107, 0, 0.3)",
    },
})
