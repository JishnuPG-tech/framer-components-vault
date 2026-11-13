import React, { useRef, useState, useEffect } from "react"
import { motion, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 56
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

// Helper to unwrap Framer color tokens
const tok = (v: any) =>
    v && typeof v === "object" && "value" in v ? v.value : v

// Icon rendering helper
function renderIcon(type: string, size: number, isHovered: boolean) {
    const getTransform = () => {
        if (!isHovered) return "none"
        switch (type) {
            case "arrow-up-right":
                return "translateX(2px) translateY(-2px)"
            case "arrow-right":
            case "chevron-right":
                return "translateX(3px)"
            case "sparkle":
            case "star":
                return "rotate(15deg) scale(1.15)"
            case "plus":
                return "rotate(90deg)"
            case "download":
                return "translateY(2px)"
            default:
                return "scale(1.12)"
        }
    }

    const svgStyle: React.CSSProperties = {
        transform: getTransform(),
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        flexShrink: 0,
        display: "block",
    }

    switch (type) {
        case "arrow-right":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={svgStyle}
                >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                </svg>
            )
        case "chevron-right":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={svgStyle}
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            )
        case "sparkle":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={svgStyle}
                >
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
            )
        case "plus":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={svgStyle}
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            )
        case "download":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={svgStyle}
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            )
        case "mail":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={svgStyle}
                >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
            )
        case "search":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={svgStyle}
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            )
        case "star":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={svgStyle}
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            )
        case "check":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={svgStyle}
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )
        case "arrow-up-right":
        default:
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={svgStyle}
                >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                </svg>
            )
    }
}

export default function MagneticButton(props) {
    const {
        text,
        link,
        openInNewTab,
        font,
        textColor,
        buttonBg,
        hoverBg,
        borderRadius,
        paddingHorizontal,
        paddingVertical,
        magneticStrength,
        textMagneticMultiplier,
        proximityRadius,
        stiffness,
        damping,
        mass,
        showIcon,
        iconType,
        iconPosition,
        iconSize,
        iconGap,
        style,
    } = props

    const buttonRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [isClient, setIsClient] = useState(false)
    const [canHover, setCanHover] = useState(true)

    // Framer 정적 렌더러(캔버스/내보내기/썸네일 생성기 등) 감지
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        setIsClient(true)
        // 모바일/터치 디바이스 감지 (터치 환경에서는 자석 인력이 스크롤을 방해하지 않도록 방어)
        const mediaQuery = window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        )
        setCanHover(mediaQuery.matches)

        const handleMediaChange = (e: MediaQueryListEvent) => {
            setCanHover(e.matches)
        }

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleMediaChange)
            return () =>
                mediaQuery.removeEventListener("change", handleMediaChange)
        }
    }, [])

    // 스프링 물리 엔진 설정
    const springConfig = {
        stiffness: stiffness ?? 280,
        damping: damping ?? 20,
        mass: mass ?? 0.4,
    }

    const btnX = useSpring(0, springConfig)
    const btnY = useSpring(0, springConfig)
    const textX = useSpring(0, springConfig)
    const textY = useSpring(0, springConfig)

    // 마우스 포인터 이동 시 자석 효과 계산
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        // 정적 렌더링, 모바일 터치, hover 불가 환경에서는 자석 계산 및 애니메이션 비활성화
        if (
            isStatic ||
            !canHover ||
            e.pointerType === "touch" ||
            !buttonRef.current
        )
            return

        const rect = buttonRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const deltaX = e.clientX - centerX
        const deltaY = e.clientY - centerY

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const effectiveRadius =
            proximityRadius > 0
                ? proximityRadius
                : Math.max(rect.width, rect.height)

        if (distance <= effectiveRadius) {
            const moveX = deltaX * magneticStrength
            const moveY = deltaY * magneticStrength

            btnX.set(moveX)
            btnY.set(moveY)

            // 텍스트/아이콘 시차(Parallax) 이동
            textX.set(moveX * textMagneticMultiplier)
            textY.set(moveY * textMagneticMultiplier)
        }
    }

    const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isStatic && canHover && e.pointerType !== "touch") {
            setIsHovered(true)
        }
    }

    const handlePointerLeave = () => {
        setIsHovered(false)
        btnX.set(0)
        btnY.set(0)
        textX.set(0)
        textY.set(0)
    }

    const handleClick = (e: React.MouseEvent) => {
        if (!link || isStatic || RenderTarget.current() === RenderTarget.canvas)
            return

        if (openInNewTab) {
            window.open(link, "_blank", "noopener,noreferrer")
        } else {
            window.location.href = link
        }
    }

    const iconElement = showIcon
        ? renderIcon(iconType, iconSize, isHovered)
        : null

    // SSR 및 정적 렌더러(Framer Canvas 정적 렌더링 / Export / Thumbnail)에서는 애니메이션 없는 정적 엘리먼트 렌더링
    if (!isClient || isStatic) {
        return (
            <div
                style={{
                    ...style,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: `${paddingVertical}px ${paddingHorizontal}px`,
                    backgroundColor: tok(buttonBg),
                    borderRadius: `${borderRadius}px`,
                    color: tok(textColor),
                    ...font,
                }}
            >
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: `${iconGap}px`,
                    }}
                >
                    {iconPosition === "left" && iconElement}
                    <span>{text}</span>
                    {iconPosition === "right" && iconElement}
                </span>
            </div>
        )
    }

    return (
        <div
            ref={buttonRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerLeave}
            style={{
                ...style,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
                padding: canHover
                    ? `${Math.max(0, proximityRadius - 20)}px`
                    : "0px",
                margin: canHover
                    ? `-${Math.max(0, proximityRadius - 20)}px`
                    : "0px",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
            }}
            onClick={handleClick}
        >
            <motion.div
                style={{
                    x: btnX,
                    y: btnY,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: `${paddingVertical}px ${paddingHorizontal}px`,
                    backgroundColor: isHovered ? tok(hoverBg) : tok(buttonBg),
                    borderRadius: `${borderRadius}px`,
                    color: tok(textColor),
                    willChange: "transform, background-color",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                    transition:
                        "background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    ...font,
                }}
                whileHover={canHover ? { scale: 1.02 } : undefined}
                whileTap={{ scale: 0.96 }}
            >
                <motion.span
                    style={{
                        x: textX,
                        y: textY,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: `${iconGap}px`,
                        willChange: "transform",
                        transform: "translateZ(0)",
                    }}
                >
                    {iconPosition === "left" && iconElement}
                    <span>{text}</span>
                    {iconPosition === "right" && iconElement}
                </motion.span>
            </motion.div>
        </div>
    )
}

MagneticButton.defaultProps = {
    text: "Get Started",
    link: "",
    openInNewTab: false,
    textColor: "#ffffff",
    buttonBg: "#111111",
    hoverBg: "#1e1e1e",
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 14,
    magneticStrength: 0.35,
    textMagneticMultiplier: 1.35,
    proximityRadius: 85,
    stiffness: 280,
    damping: 20,
    mass: 0.4,
    showIcon: true,
    iconType: "arrow-up-right",
    iconPosition: "right",
    iconSize: 14,
    iconGap: 8,
    font: {
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: 15,
    },
}

addPropertyControls(MagneticButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Get Started",
    },
    link: {
        type: ControlType.String,
        title: "Link",
        defaultValue: "",
        placeholder: "https://...",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 15,
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    buttonBg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },
    hoverBg: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#1e1e1e",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 100,
        min: 0,
        max: 100,
        unit: "px",
    },
    paddingHorizontal: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 28,
        min: 0,
        max: 100,
        unit: "px",
    },
    paddingVertical: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 14,
        min: 0,
        max: 60,
        unit: "px",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon",
        defaultValue: "arrow-up-right",
        options: [
            "arrow-up-right",
            "arrow-right",
            "chevron-right",
            "sparkle",
            "star",
            "plus",
            "download",
            "mail",
            "search",
            "check",
        ],
        optionTitles: [
            "Arrow Up Right",
            "Arrow Right",
            "Chevron Right",
            "Sparkle",
            "Star",
            "Plus",
            "Download",
            "Mail",
            "Search",
            "Check",
        ],
        hidden: (props) => !props.showIcon,
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Position",
        defaultValue: "right",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        hidden: (props) => !props.showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 14,
        min: 8,
        max: 36,
        unit: "px",
        hidden: (props) => !props.showIcon,
    },
    iconGap: {
        type: ControlType.Number,
        title: "Icon Gap",
        defaultValue: 8,
        min: 2,
        max: 30,
        unit: "px",
        hidden: (props) => !props.showIcon,
    },
    magneticStrength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 0.35,
        min: 0.05,
        max: 0.8,
        step: 0.05,
        description:
            "Button pull strength towards cursor (0.3 - 0.4 recommended)",
    },
    textMagneticMultiplier: {
        type: ControlType.Number,
        title: "Text Pull",
        defaultValue: 1.35,
        min: 1.0,
        max: 2.5,
        step: 0.05,
        description: "Text and icon parallax factor",
    },
    proximityRadius: {
        type: ControlType.Number,
        title: "Range",
        defaultValue: 85,
        min: 30,
        max: 250,
        unit: "px",
        description: "Proximity activation radius in pixels",
    },
})
