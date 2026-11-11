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


import gsap from "gsap"

// Request: Framer HoverLines component with GSAP-driven hover + section scrolling behavior.
interface MyComponentProps {
    items: Array<{
        text: string
        link?: string
    }>
    baseLength: number
    maxLength: number
    lineThickness: number
    lineGap: number
    influenceRadius: number
    neighborFalloff: number
    duration: number
    easing: "linear" | "easeIn" | "easeOut" | "easeInOut"
    lineColor: string
    labelColor: string
    labelSize: number
    labelGap: number
    labelFont: string
    scrollDuration: number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function HoverLines(props: MyComponentProps) {
    const {
        items = [
            { text: "LANGUAGES" },
            { text: "PRODUCT" },
            { text: "BRANDING" },
            { text: "INTERACTION" },
            { text: "MOTION" },
            { text: "SYSTEMS" },
            { text: "RESEARCH" },
        ],
        baseLength = 36,
        maxLength = 95,
        lineThickness = 2,
        lineGap = 20,
        influenceRadius = 3,
        neighborFalloff = 1.5,
        duration = 0.25,
        easing = "easeOut",
        lineColor = "#D8D5CD",
        labelColor = "#D8D5CD",
        labelSize = 14,
        labelGap = 12,
        labelFont = "inter",
        scrollDuration = 0.8,
        style,
    } = props

    // Framer uses the static renderer for the canvas/export rendering.
    // GSAP animations must not run in this mode.
    const isStaticRenderer = useIsStaticRenderer()

    const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
    const scrollTweenRef = React.useRef<gsap.core.Tween | null>(null)
    const lineRefs = React.useRef<Array<HTMLDivElement | null>>([])
    const labelRefs = React.useRef<Array<HTMLDivElement | null>>([])

    const normalizedItems = React.useMemo(() => {
        const cleaned = (items || []).filter(
            (item) => item && typeof item.text === "string"
        )

        return cleaned.length > 0 ? cleaned : [{ text: "LANGUAGES", link: "" }]
    }, [items])

    const gsapEase = React.useMemo(() => {
        if (easing === "easeIn") return "power2.in"
        if (easing === "easeOut") return "power2.out"
        if (easing === "easeInOut") return "power2.inOut"
        return "none"
    }, [easing])

    const updateHash = React.useCallback((id: string) => {
        if (typeof window === "undefined") return

        if (window.location.hash !== `#${id}`) {
            window.history.pushState(null, "", `#${id}`)
        }
    }, [])

    const getLineWidth = React.useCallback(
        (index: number) => {
            if (activeIndex === null) return baseLength

            const radius = Math.max(influenceRadius, 0.0001)
            const distance = Math.abs(index - activeIndex)

            if (distance > radius) return baseLength

            const normalized = Math.max(0, 1 - distance / radius)

            const influence = Math.pow(
                normalized,
                Math.max(neighborFalloff, 0.0001)
            )

            return baseLength + (maxLength - baseLength) * influence
        },
        [activeIndex, baseLength, maxLength, influenceRadius, neighborFalloff]
    )

    const handleRowEnter = React.useCallback((index: number) => {
        setActiveIndex(index)
    }, [])

    const handleGroupLeave = React.useCallback(() => {
        setActiveIndex(null)
    }, [])

    React.useEffect(() => {
        lineRefs.current = lineRefs.current.slice(0, normalizedItems.length)
        labelRefs.current = labelRefs.current.slice(0, normalizedItems.length)
    }, [normalizedItems.length])

    // GSAP line animation.
    // Disabled when Framer is rendering statically.
    React.useEffect(() => {
        if (isStaticRenderer) return

        lineRefs.current.forEach((line, index) => {
            if (!line) return

            gsap.to(line, {
                width: getLineWidth(index),
                duration,
                ease: gsapEase,
                overwrite: "auto",
            })
        })
    }, [
        isStaticRenderer,
        getLineWidth,
        duration,
        gsapEase,
        normalizedItems.length,
    ])

    // GSAP label animation.
    // Disabled when Framer is rendering statically.
    React.useEffect(() => {
        if (isStaticRenderer) return

        if (activeIndex === null) return

        const activeLabel = labelRefs.current[activeIndex]

        if (!activeLabel) return

        gsap.killTweensOf(activeLabel)

        gsap.fromTo(
            activeLabel,
            { opacity: 0, x: -8 },
            {
                opacity: 1,
                x: 0,
                duration,
                ease: gsapEase,
                overwrite: "auto",
            }
        )
    }, [isStaticRenderer, activeIndex, duration, gsapEase])

    React.useEffect(() => {
        return () => {
            if (scrollTweenRef.current) {
                scrollTweenRef.current.kill()
                scrollTweenRef.current = null
            }

            gsap.killTweensOf(lineRefs.current)
            gsap.killTweensOf(labelRefs.current)
        }
    }, [])

    const handleOverlayClick = React.useCallback(
        (event: React.MouseEvent<HTMLElement>, link?: string) => {
            if (
                typeof window === "undefined" ||
                typeof document === "undefined"
            ) {
                return
            }

            if (typeof link !== "string") return

            try {
                const resolved = new URL(link, window.location.href)
                const hashValue = resolved.hash

                if (!hashValue) return

                const id = decodeURIComponent(hashValue.slice(1))

                if (!id) return

                const target = document.getElementById(id)

                if (!target) return

                event.preventDefault()
                event.stopPropagation()

                if (
                    "stopImmediatePropagation" in event.nativeEvent &&
                    typeof event.nativeEvent.stopImmediatePropagation ===
                        "function"
                ) {
                    event.nativeEvent.stopImmediatePropagation()
                }

                if (scrollTweenRef.current) {
                    scrollTweenRef.current.kill()
                    scrollTweenRef.current = null
                }

                const startY = window.scrollY

                const targetY =
                    target.getBoundingClientRect().top + window.scrollY

                // Static renderer must never start a GSAP animation.
                // In that context, use an immediate scroll instead.
                if (
                    isStaticRenderer ||
                    scrollDuration <= 0 ||
                    Math.abs(targetY - startY) < 0.5
                ) {
                    window.scrollTo(0, targetY)
                    updateHash(id)
                    return
                }

                const proxy = { y: startY }

                scrollTweenRef.current = gsap.to(proxy, {
                    y: targetY,
                    duration: scrollDuration,
                    ease: "power2.inOut",
                    overwrite: true,
                    onUpdate: () => {
                        window.scrollTo(0, proxy.y)
                    },
                    onComplete: () => {
                        scrollTweenRef.current = null
                        updateHash(id)
                    },
                })
            } catch {}
        },
        [scrollDuration, updateHash, isStaticRenderer]
    )

    const hasStyleWidth = style?.width !== undefined
    const hasStyleHeight = style?.height !== undefined

    const hasAnyLink = React.useMemo(() => {
        return normalizedItems.some(
            (item) =>
                !!item.link &&
                (typeof item.link === "string"
                    ? item.link.trim().length > 0
                    : true)
        )
    }, [normalizedItems])

    const LinkElement = Link as any

    return (
        <div
            style={{
                width: hasStyleWidth ? undefined : 320,
                height: hasStyleHeight ? undefined : 280,
                minWidth: 120,
                minHeight: 120,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                userSelect: "none",
                touchAction: "none",
                ...style,
            }}
        >
            <div
                onPointerLeave={handleGroupLeave}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: lineGap,
                    padding: 16,
                    boxSizing: "border-box",
                    cursor: hasAnyLink ? "pointer" : "default",
                }}
            >
                {normalizedItems.map((item, index) => {
                    const showLabel = activeIndex === index

                    const hasLink =
                        !!item.link &&
                        (typeof item.link === "string"
                            ? item.link.trim().length > 0
                            : true)

                    const rowStyle: React.CSSProperties = {
                        display: "flex",
                        alignItems: "center",
                        height: Math.max(lineThickness + 12, 16),
                        paddingTop: 6,
                        paddingBottom: 6,
                        boxSizing: "border-box",
                        overflow: "visible",
                        position: "relative",
                        cursor: hasLink ? "pointer" : "default",
                        textDecoration: "none",
                        color: "inherit",
                    }

                    const rowContent = (
                        <>
                            <div
                                ref={(element) => {
                                    lineRefs.current[index] = element
                                }}
                                style={{
                                    width: baseLength,
                                    height: Math.max(lineThickness, 1),
                                    background: lineColor,
                                    flexShrink: 0,
                                }}
                            />

                            {showLabel && (
                                <div
                                    ref={(element) => {
                                        labelRefs.current[index] = element
                                    }}
                                    style={{
                                        marginLeft: labelGap,
                                        color: labelColor,
                                        fontSize: labelSize,
                                        lineHeight: 1,
                                        whiteSpace: "nowrap",
                                        cursor: hasLink ? "pointer" : "default",
                                    }}
                                >
                                    {item.text}
                                </div>
                            )}
                        </>
                    )

                    return hasLink ? (
                        <div
                            key={index}
                            onPointerEnter={() => handleRowEnter(index)}
                            onClickCapture={(event) =>
                                handleOverlayClick(event, item.link)
                            }
                            style={rowStyle}
                        >
                            {rowContent}

                            <LinkElement href={item.link}>
                                <a
                                    aria-label={item.text}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        right: 0,
                                        bottom: 0,
                                        left: 0,
                                        display: "block",
                                        zIndex: 2,
                                        cursor: "pointer",
                                        background: "transparent",
                                        textDecoration: "none",
                                        color: "inherit",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    />
                                </a>
                            </LinkElement>
                        </div>
                    ) : (
                        <div
                            key={index}
                            onPointerEnter={() => handleRowEnter(index)}
                            style={rowStyle}
                        >
                            {rowContent}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(HoverLines, {
    items: {
        type: ControlType.Array,
        title: "Lines",
        defaultValue: [
            { text: "LANGUAGES" },
            { text: "PRODUCT" },
            { text: "BRANDING" },
            { text: "INTERACTION" },
            { text: "MOTION" },
            { text: "SYSTEMS" },
            { text: "RESEARCH" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "Item",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "",
                },
            },
        },
    },

    baseLength: {
        type: ControlType.Number,
        title: "Base",
        defaultValue: 36,
        min: 8,
        max: 240,
        unit: "px",
    },

    maxLength: {
        type: ControlType.Number,
        title: "Max",
        defaultValue: 95,
        min: 12,
        max: 320,
        unit: "px",
    },

    lineThickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 2,
        min: 1,
        max: 12,
        unit: "px",
        step: 1,
    },

    lineGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: 4,
        max: 64,
        unit: "px",
    },

    influenceRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
    },

    neighborFalloff: {
        type: ControlType.Number,
        title: "Falloff",
        defaultValue: 1.5,
        min: 0.2,
        max: 4,
        step: 0.1,
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.25,
        min: 0.05,
        max: 1,
        step: 0.05,
        unit: "s",
    },

    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "easeOut",
        options: ["linear", "easeIn", "easeOut", "easeInOut"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out"],
    },

    lineColor: {
        type: ControlType.Color,
        title: "Line",
        defaultValue: "#D8D5CD",
    },

    labelColor: {
        type: ControlType.Color,
        title: "Label",
        defaultValue: "#D8D5CD",
    },

    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: 14,
        min: 8,
        max: 48,
        unit: "px",
    },

    labelGap: {
        type: ControlType.Number,
        title: "Label Gap",
        defaultValue: 12,
        min: 4,
        max: 40,
        unit: "px",
    },

    labelFont: {
        type: ControlType.Font,
        title: "label Font",
        defaultFontType: "sans-serif",
    },

    scrollDuration: {
        type: ControlType.Number,
        title: "Scroll Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
    },
})
