/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 240
 */
import React, { useRef, useState, useEffect } from "react"
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
    useMotionValue,
    useSpring,
    useTransform,
    useMotionTemplate,
    useReducedMotion,
    type MotionStyle,
} from "framer-motion"

export interface SleekTiltCardContentProps {
    title?: string
    subtitle?: string
    buttonText?: string
    showArrow?: boolean
    showTag?: boolean
    tagText?: string
}

export interface SleekTiltCardNavigationProps {
    link?: string
    openInNewTab?: boolean
}

export interface SleekTiltCardStyleProps {
    themeMode?: "Dark" | "Light" | "Custom"
    borderRadius?: number
    cardBgProp?: string
    borderColorProp?: string
    accentColorProp?: string
    textColorProp?: string
    spotlightColorProp?: string
}

export interface SleekTiltCardMotionProps {
    tiltAmount?: number
    shadowIntensity?: number
}

export interface SleekTiltCardProps {
    content?: SleekTiltCardContentProps
    navigation?: SleekTiltCardNavigationProps
    style?: SleekTiltCardStyleProps
    motion?: SleekTiltCardMotionProps

    // 플랫 레거시 호환 프로퍼티
    title?: string
    subtitle?: string
    buttonText?: string
    showArrow?: boolean
    showTag?: boolean
    tagText?: string
    link?: string
    openInNewTab?: boolean
    themeMode?: "Dark" | "Light" | "Custom"
    borderRadius?: number
    cardBgProp?: string
    borderColorProp?: string
    accentColorProp?: string
    textColorProp?: string
    spotlightColorProp?: string
    tiltAmount?: number
    shadowIntensity?: number
}

const DEFAULT_CONTENT: Required<SleekTiltCardContentProps> = {
    title: "Accelerate your workflow",
    subtitle:
        "Built with micro-interactions and precision layout designed for modern digital products.",
    buttonText: "Explore features",
    showArrow: true,
    showTag: true,
    tagText: "System Component",
}

const DEFAULT_NAVIGATION: Required<SleekTiltCardNavigationProps> = {
    link: "",
    openInNewTab: false,
}

const DEFAULT_STYLE: Required<SleekTiltCardStyleProps> = {
    themeMode: "Dark",
    borderRadius: 20,
    cardBgProp: "#0d0d0d",
    borderColorProp: "rgba(255, 255, 255, 0.08)",
    accentColorProp: "#f5f5f5",
    textColorProp: "#ffffff",
    spotlightColorProp: "rgba(255, 255, 255, 0.06)",
}

const DEFAULT_MOTION: Required<SleekTiltCardMotionProps> = {
    tiltAmount: 8,
    shadowIntensity: 100,
}

/**
 * 선택한 텍스트 색상(Hex 3/4/6/8자리, RGB/RGBA, CSS 변수)에서 보조 텍스트용 반투명 색상을 안전하게 유도합니다.
 */
function deriveSubtitleColor(color: string, alpha = 0.6): string {
    const trimmed = color.trim()
    if (trimmed.startsWith("#")) {
        const hex = trimmed.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            const r = parseInt(hex[0] + hex[0], 16)
            const g = parseInt(hex[1] + hex[1], 16)
            const b = parseInt(hex[2] + hex[2], 16)
            if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
                return `rgba(${r}, ${g}, ${b}, ${alpha})`
            }
        } else if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
                return `rgba(${r}, ${g}, ${b}, ${alpha})`
            }
        }
    }
    const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
    if (rgbMatch) {
        return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`
    }
    return `color-mix(in srgb, ${trimmed} ${Math.round(alpha * 100)}%, transparent)`
}

/**
 * 색상의 상대 밝기(0: 완전 검정 ~ 1: 완전 흰색)를 계산합니다.
 */
function isLightColor(color: string): boolean {
    const c = color.trim().toLowerCase()
    if (c === "white" || c === "#fff" || c === "#ffffff") return true
    if (c === "black" || c === "#000" || c === "#000000") return false
    if (c.startsWith("#")) {
        const hex = c.slice(1)
        let r = 0,
            g = 0,
            b = 0
        if (hex.length === 3 || hex.length === 4) {
            r = parseInt(hex[0] + hex[0], 16)
            g = parseInt(hex[1] + hex[1], 16)
            b = parseInt(hex[2] + hex[2], 16)
        } else if (hex.length >= 6) {
            r = parseInt(hex.slice(0, 2), 16)
            g = parseInt(hex.slice(2, 4), 16)
            b = parseInt(hex.slice(4, 6), 16)
        }
        return (r * 299 + g * 587 + b * 114) / 1000 >= 140
    }
    const match = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (match) {
        return (
            (parseInt(match[1], 10) * 299 +
                parseInt(match[2], 10) * 587 +
                parseInt(match[3], 10) * 114) /
                1000 >=
            140
        )
    }
    return false
}

export default function SleekTiltCard(props: SleekTiltCardProps = {}) {
    const isStatic = useIsStaticRenderer()
    return isStatic ? (
        <StaticTiltCard {...props} />
    ) : (
        <InteractiveTiltCard {...props} />
    )
}

function pickProp<T>(
    grouped: T | undefined,
    flat: T | undefined,
    fallback: T
): T {
    if (grouped !== undefined && grouped !== fallback) return grouped
    return flat ?? grouped ?? fallback
}

function resolveCardProps(props: SleekTiltCardProps = {}) {
    const title = pickProp(
        props.content?.title,
        props.title,
        DEFAULT_CONTENT.title
    )
    const subtitle = pickProp(
        props.content?.subtitle,
        props.subtitle,
        DEFAULT_CONTENT.subtitle
    )
    const buttonText = pickProp(
        props.content?.buttonText,
        props.buttonText,
        DEFAULT_CONTENT.buttonText
    )
    const showArrow = Boolean(
        pickProp(
            props.content?.showArrow,
            props.showArrow,
            DEFAULT_CONTENT.showArrow
        )
    )
    const showTag = Boolean(
        pickProp(props.content?.showTag, props.showTag, DEFAULT_CONTENT.showTag)
    )
    const tagText = pickProp(
        props.content?.tagText,
        props.tagText,
        DEFAULT_CONTENT.tagText
    )

    const link = pickProp(
        props.navigation?.link,
        props.link,
        DEFAULT_NAVIGATION.link
    )
    const openInNewTab = Boolean(
        pickProp(
            props.navigation?.openInNewTab,
            props.openInNewTab,
            DEFAULT_NAVIGATION.openInNewTab
        )
    )

    const themeMode = pickProp(
        props.style?.themeMode,
        props.themeMode,
        DEFAULT_STYLE.themeMode
    )
    const isLight = themeMode === "Light"
    const isCustom = themeMode === "Custom"

    const cardBgProp = pickProp(
        props.style?.cardBgProp,
        props.cardBgProp,
        DEFAULT_STYLE.cardBgProp
    )
    const borderColorProp = pickProp(
        props.style?.borderColorProp,
        props.borderColorProp,
        DEFAULT_STYLE.borderColorProp
    )
    const accentColorProp = pickProp(
        props.style?.accentColorProp,
        props.accentColorProp,
        DEFAULT_STYLE.accentColorProp
    )
    const textColorProp = pickProp(
        props.style?.textColorProp,
        props.textColorProp,
        DEFAULT_STYLE.textColorProp
    )
    const spotlightColorProp = pickProp(
        props.style?.spotlightColorProp,
        props.spotlightColorProp,
        DEFAULT_STYLE.spotlightColorProp
    )
    const borderRadius = Number(
        pickProp(
            props.style?.borderRadius,
            props.borderRadius,
            DEFAULT_STYLE.borderRadius
        )
    )

    const cardBg = isCustom ? cardBgProp : isLight ? "#ffffff" : "#0d0d0d"
    const isBrightBackground = isCustom ? isLightColor(cardBg) : isLight
    const borderColor = isCustom
        ? borderColorProp
        : isLight
          ? "rgba(0, 0, 0, 0.08)"
          : "rgba(255, 255, 255, 0.08)"
    const accentColor = isCustom
        ? accentColorProp
        : isLight
          ? "#0f172a"
          : "#f5f5f5"
    const textColor = isCustom ? textColorProp : isLight ? "#0f172a" : "#ffffff"
    const subtitleColor = isCustom
        ? deriveSubtitleColor(textColorProp, 0.6)
        : isLight
          ? "rgba(15, 23, 42, 0.6)"
          : "rgba(255, 255, 255, 0.5)"
    const spotlightColor = isCustom
        ? spotlightColorProp
        : isLight
          ? "rgba(0, 0, 0, 0.04)"
          : "rgba(255, 255, 255, 0.06)"

    const tiltAmount = Number(
        pickProp(
            props.motion?.tiltAmount,
            props.tiltAmount,
            DEFAULT_MOTION.tiltAmount
        )
    )
    const shadowIntensity = Number(
        pickProp(
            props.motion?.shadowIntensity,
            props.shadowIntensity,
            DEFAULT_MOTION.shadowIntensity
        )
    )

    const factor = shadowIntensity / 100
    const hasLink = Boolean(link && link.trim() !== "")
    const hasButtonText = Boolean(buttonText && buttonText.trim() !== "")
    const showCta = hasButtonText || showArrow

    return {
        title,
        subtitle,
        buttonText,
        hasButtonText,
        showArrow,
        showCta,
        showTag,
        tagText,
        link,
        openInNewTab,
        hasLink,
        cardBg,
        borderColor,
        accentColor,
        textColor,
        subtitleColor,
        spotlightColor,
        borderRadius,
        tiltAmount,
        factor,
        isLight,
        isBrightBackground,
    }
}

interface CardContentBodyProps {
    title: string
    subtitle: string
    buttonText: string
    hasButtonText: boolean
    showArrow: boolean
    showCta: boolean
    showTag: boolean
    tagText: string
    accentColor: string
    textColor: string
    subtitleColor: string
    nudgeArrow: boolean
    titleId?: string
    subtitleId?: string
}

function CardContentBody({
    title,
    subtitle,
    buttonText,
    hasButtonText,
    showArrow,
    showCta,
    showTag,
    tagText,
    accentColor,
    textColor,
    subtitleColor,
    nudgeArrow,
    titleId,
    subtitleId,
}: CardContentBodyProps) {
    return (
        <>
            {showTag && (
                <div
                    style={{
                        alignSelf: "flex-start",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: accentColor,
                            boxShadow: `0 0 8px ${accentColor}`,
                        }}
                    />
                    <span
                        style={{
                            color: subtitleColor,
                            fontSize: 13,
                            fontWeight: 500,
                            letterSpacing: "0.02em",
                            fontFamily: "Inter, -apple-system, sans-serif",
                        }}
                    >
                        {tagText}
                    </span>
                </div>
            )}

            <div
                style={{
                    marginTop: showTag ? 40 : 0,
                }}
            >
                <h3
                    id={titleId}
                    style={{
                        color: textColor,
                        fontSize: 22,
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        margin: "0 0 12px 0",
                        lineHeight: 1.3,
                        fontFamily: "Inter, -apple-system, sans-serif",
                    }}
                >
                    {title}
                </h3>
                <p
                    id={subtitleId}
                    style={{
                        color: subtitleColor,
                        fontSize: 14,
                        margin: showCta ? "0 0 28px 0" : 0,
                        lineHeight: 1.6,
                        fontWeight: 400,
                        fontFamily: "Inter, -apple-system, sans-serif",
                    }}
                >
                    {subtitle}
                </p>

                {showCta && (
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            color: accentColor,
                            fontSize: 14,
                            fontWeight: 500,
                            fontFamily: "Inter, -apple-system, sans-serif",
                        }}
                    >
                        {hasButtonText && <span>{buttonText}</span>}
                        {showArrow && (
                            <svg
                                aria-hidden="true"
                                width="14"
                                height="14"
                                viewBox="0 0 16 16"
                                fill="none"
                                style={{
                                    transform: nudgeArrow
                                        ? "translateX(4px)"
                                        : "none",
                                    transition: "transform 0.2s ease-out",
                                }}
                            >
                                <path
                                    d="M6 12L10 8L6 4"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

function InteractiveTiltCard(props: SleekTiltCardProps) {
    const resolved = resolveCardProps(props)
    const {
        title,
        subtitle,
        link,
        openInNewTab,
        hasLink,
        cardBg,
        borderColor,
        accentColor,
        spotlightColor,
        borderRadius,
        tiltAmount,
        factor,
        isBrightBackground,
    } = resolved

    const cardRef = useRef<HTMLDivElement>(null)
    const rectRef = useRef<DOMRect | null>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    // OS prefers-reduced-motion 설정 감지
    const prefersReducedMotion = Boolean(useReducedMotion())
    const effectiveTilt = prefersReducedMotion ? 0 : tiltAmount

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const spotlightX = useMotionValue(0)
    const spotlightY = useMotionValue(0)

    // 물리 스프링 설정 (damping 25, stiffness 180: 과도한 출렁임 없이 마우스를 따라오는 카드 틸트 감쇠값)
    const springConfig = { damping: 25, stiffness: 180, mass: 0.8 }

    const rotateX = useSpring(
        useTransform(mouseY, [-0.5, 0.5], [effectiveTilt, -effectiveTilt]),
        springConfig
    )
    const rotateY = useSpring(
        useTransform(mouseX, [-0.5, 0.5], [-effectiveTilt, effectiveTilt]),
        springConfig
    )

    const spotlightBackground = useMotionTemplate`radial-gradient(600px circle at ${spotlightX}px ${spotlightY}px, ${spotlightColor}, transparent 40%)`

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === "touch" || !cardRef.current) return
        const rect = rectRef.current ?? cardRef.current.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return

        const xPos = e.clientX - rect.left
        const yPos = e.clientY - rect.top

        spotlightX.set(xPos)
        spotlightY.set(yPos)

        if (!prefersReducedMotion) {
            mouseX.set(xPos / rect.width - 0.5)
            mouseY.set(yPos / rect.height - 0.5)
        }
    }

    useEffect(() => {
        return () => {
            rectRef.current = null
            mouseX.set(0)
            mouseY.set(0)
        }
    }, [mouseX, mouseY])

    // Keep the depth shadow stable while the card rotates to prevent compositor trails.
    const currentShadow =
        factor === 0
            ? "none"
            : isBrightBackground
              ? `0 16px 32px -16px rgba(0, 0, 0, ${(0.14 * factor).toFixed(3)}), inset 0 1px 0 rgba(255, 255, 255, 0.9)`
              : `0 16px 32px -16px rgba(0, 0, 0, ${(0.48 * factor).toFixed(3)}), inset 0 1px 0 rgba(255, 255, 255, 0.1)`

    const cardMotionStyle: MotionStyle = {
        width: "100%",
        height: "100%",
        minHeight: 260,
        borderRadius,
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`,
        boxShadow: currentShadow,
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        position: "relative",
        overflow: "hidden",
        cursor: hasLink ? "pointer" : "default",
        padding: "36px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        textDecoration: "none",
        color: "inherit",
        boxSizing: "border-box",
        outline: isFocused ? `2px solid ${accentColor}` : "none",
        outlineOffset: isFocused ? 2 : 0,
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        willChange: "transform",
        transition: "background-color 0.25s ease-out, border-color 0.25s ease-out",
    }

    const reactId = React.useId()
    const uniqueId = reactId.replace(/[^a-zA-Z0-9_-]/g, "")
    const titleId = `tilt-title-${uniqueId}`
    const subtitleId = `tilt-desc-${uniqueId}`

    const innerContent = (
        <>
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.3s ease-out",
                    background: spotlightBackground,
                    borderRadius: "inherit",
                    pointerEvents: "none",
                }}
            />
            <CardContentBody
                {...resolved}
                titleId={titleId}
                subtitleId={subtitle ? subtitleId : undefined}
                nudgeArrow={hasLink && isHovered && !prefersReducedMotion}
            />
        </>
    )

    return (
        <motion.div
            ref={cardRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={(e) => {
                if (e.pointerType !== "touch") {
                    if (cardRef.current) {
                        rectRef.current =
                            cardRef.current.getBoundingClientRect()
                    }
                    setIsHovered(true)
                }
            }}
            onPointerLeave={() => {
                rectRef.current = null
                setIsHovered(false)
                mouseX.set(0)
                mouseY.set(0)
            }}
            style={{
                width: "100%",
                height: "100%",
                perspective: 1200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {hasLink ? (
                <motion.a
                    href={link}
                    target={openInNewTab ? "_blank" : undefined}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                    aria-labelledby={titleId}
                    aria-describedby={subtitle ? subtitleId : undefined}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={cardMotionStyle}
                >
                    {innerContent}
                </motion.a>
            ) : (
                <motion.div role="region" aria-labelledby={titleId} aria-describedby={subtitle ? subtitleId : undefined} style={cardMotionStyle}>{innerContent}</motion.div>
            )}
        </motion.div>
    )
}

function StaticTiltCard(props: SleekTiltCardProps) {
    const resolved = resolveCardProps(props)
    const {
        title,
        subtitle,
        link,
        openInNewTab,
        hasLink,
        cardBg,
        borderColor,
        borderRadius,
        factor,
        isBrightBackground,
    } = resolved

    const reactId = React.useId()
    const uniqueId = reactId.replace(/[^a-zA-Z0-9_-]/g, "")
    const titleId = `static-tilt-title-${uniqueId}`
    const subtitleId = `static-tilt-sub-${uniqueId}`

    const staticShadow =
        factor === 0
            ? "none"
            : isBrightBackground
              ? `0 14px 30px -10px rgba(0, 0, 0, ${(0.12 * factor).toFixed(3)}), 0 4px 10px -4px rgba(0, 0, 0, ${(0.06 * factor).toFixed(3)}), inset 0 1px 0 rgba(255, 255, 255, 0.9)`
              : `0 10px 25px -10px rgba(0, 0, 0, ${(0.4 * factor).toFixed(3)})`

    const staticCardStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        minHeight: 260,
        borderRadius,
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`,
        boxShadow: staticShadow,
        position: "relative",
        overflow: "hidden",
        cursor: hasLink ? "pointer" : "default",
        padding: "36px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        textDecoration: "none",
        color: "inherit",
        boxSizing: "border-box",
    }

    const body = (
        <CardContentBody
            {...resolved}
            titleId={titleId}
            subtitleId={subtitle ? subtitleId : undefined}
            nudgeArrow={false}
        />
    )

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                perspective: 1200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {hasLink ? (
                <a
                    href={link}
                    target={openInNewTab ? "_blank" : undefined}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                    aria-labelledby={titleId}
                    aria-describedby={subtitle ? subtitleId : undefined}
                    style={staticCardStyle}
                >
                    {body}
                </a>
            ) : (
                <div role="region" aria-labelledby={titleId} aria-describedby={subtitle ? subtitleId : undefined} style={staticCardStyle}>{body}</div>
            )}
        </div>
    )
}

SleekTiltCard.defaultProps = {
    content: DEFAULT_CONTENT,
    navigation: DEFAULT_NAVIGATION,
    style: DEFAULT_STYLE,
    motion: DEFAULT_MOTION,
}

const isNotCustomTheme = (
    props: SleekTiltCardProps & SleekTiltCardStyleProps
) =>
    (props?.style?.themeMode ?? props?.themeMode ?? DEFAULT_STYLE.themeMode) !==
    "Custom"

addPropertyControls(SleekTiltCard, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: DEFAULT_CONTENT.title,
            },
            subtitle: {
                type: ControlType.String,
                title: "Subtitle",
                defaultValue: DEFAULT_CONTENT.subtitle,
            },
            buttonText: {
                type: ControlType.String,
                title: "Button Text",
                defaultValue: DEFAULT_CONTENT.buttonText,
            },
            showArrow: {
                type: ControlType.Boolean,
                title: "Show Arrow",
                defaultValue: DEFAULT_CONTENT.showArrow,
            },
            showTag: {
                type: ControlType.Boolean,
                title: "Show Tag",
                defaultValue: DEFAULT_CONTENT.showTag,
            },
            tagText: {
                type: ControlType.String,
                title: "Tag Line",
                defaultValue: DEFAULT_CONTENT.tagText,
                hidden(props: SleekTiltCardProps & SleekTiltCardContentProps) {
                    const isShown =
                        props?.content?.showTag ??
                        props?.showTag ??
                        DEFAULT_CONTENT.showTag
                    return !isShown
                },
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        controls: {
            link: {
                type: ControlType.Link,
                title: "Link",
                defaultValue: DEFAULT_NAVIGATION.link,
            },
            openInNewTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: DEFAULT_NAVIGATION.openInNewTab,
                hidden(
                    props: SleekTiltCardProps & SleekTiltCardNavigationProps
                ) {
                    const linkVal =
                        props?.navigation?.link ??
                        props?.link ??
                        DEFAULT_NAVIGATION.link
                    return !linkVal || linkVal.trim() === ""
                },
            },
        },
    },
    style: {
        type: ControlType.Object,
        title: "Style & Theme",
        controls: {
            themeMode: {
                type: ControlType.Enum,
                title: "Theme",
                options: ["Dark", "Light", "Custom"],
                optionTitles: ["Dark Mode", "Light Mode", "Custom Pick"],
                defaultValue: DEFAULT_STYLE.themeMode,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 2,
                defaultValue: DEFAULT_STYLE.borderRadius,
            },
            cardBgProp: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULT_STYLE.cardBgProp,
                hidden: isNotCustomTheme,
            },
            borderColorProp: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: DEFAULT_STYLE.borderColorProp,
                hidden: isNotCustomTheme,
            },
            accentColorProp: {
                type: ControlType.Color,
                title: "Accent / Arrow",
                defaultValue: DEFAULT_STYLE.accentColorProp,
                hidden: isNotCustomTheme,
            },
            textColorProp: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: DEFAULT_STYLE.textColorProp,
                hidden: isNotCustomTheme,
            },
            spotlightColorProp: {
                type: ControlType.Color,
                title: "Spotlight Glow",
                defaultValue: DEFAULT_STYLE.spotlightColorProp,
                hidden: isNotCustomTheme,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion & Physics",
        controls: {
            tiltAmount: {
                type: ControlType.Number,
                title: "Tilt Power",
                min: 0,
                max: 20,
                step: 1,
                defaultValue: DEFAULT_MOTION.tiltAmount,
            },
            shadowIntensity: {
                type: ControlType.Number,
                title: "Shadow",
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
                defaultValue: DEFAULT_MOTION.shadowIntensity,
                displayStepper: true,
            },
        },
    },
})
