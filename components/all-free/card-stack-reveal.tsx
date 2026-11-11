import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface WrapState {
    index: number
    entering: boolean
}

interface CardImage {
    src: string
    srcSet?: string
    alt?: string
}

interface StackCard {
    image?: CardImage
    title: string
    subtitle: string
}

interface AppearanceProps {
    cardBackground: string
    shadow: string
    cardRadius: string
    padding: string
    avatarSize: number
    avatarRadius: string
    avatarRatio: number
    overlapPercent: number
}

interface TypographyProps {
    titleFont: CSSProperties
    titleColor: string
    subtitleFont: CSSProperties
    subtitleColor: string
}

interface DepthProps {
    perspective: number
    depthOffset: number
    scaleFalloff: number
    blurAmount: number
    opacityFalloff: number
}

interface HoverProps {
    enabled: boolean
    reveal: "hover" | "click"
    expandedGap: number
    duration: number
    staggerDelay: number
}

interface AutoPlayProps {
    enabled: boolean
    interval: number
    speed: number
}

interface CardStackProps {
    cards: StackCard[]
    appearance: AppearanceProps
    typography: TypographyProps
    depth: DepthProps
    hover: HoverProps
    autoplay: AutoPlayProps
    style?: CSSProperties
}

const WRAP_NUDGE = 0.35

function parseVerticalPadding(padding: string): { top: number; bottom: number } {
    const values = padding
        .split(/\s+/)
        .map((token) => parseFloat(token))
        .filter((value) => !Number.isNaN(value))

    if (values.length === 0) return { top: 16, bottom: 16 }
    if (values.length === 1) return { top: values[0], bottom: values[0] }
    if (values.length === 2) return { top: values[0], bottom: values[0] }
    return { top: values[0], bottom: values[2] ?? values[0] }
}

const DEFAULT_AVATARS = [
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
    "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
    "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
]

/**
 * Card Stack Reveal
 *
 * A deck of profile cards that fans out into a list on hover.
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 260
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CardStack(props: CardStackProps) {
    const { cards, appearance, typography, depth, hover, autoplay, style } = props

    const {
        cardBackground,
        shadow,
        cardRadius = "10px",
        padding = "16px",
        avatarSize,
        avatarRadius = "8px",
        avatarRatio = 1,
        overlapPercent,
    } = appearance
    const { titleFont, titleColor, subtitleFont, subtitleColor } = typography
    const { perspective, depthOffset, scaleFalloff, blurAmount, opacityFalloff } =
        depth
    const {
        enabled: hoverEnabled,
        reveal = "hover",
        expandedGap,
        duration = 0.5,
        staggerDelay = 0.05,
    } = hover
    const durationMs = duration * 1000
    const staggerDelayMs = staggerDelay * 1000
    const revealOnHover = hoverEnabled && reveal === "hover"
    const revealOnClick = hoverEnabled && reveal === "click"
    const {
        enabled: autoPlay,
        interval: autoPlayInterval,
        speed: autoPlaySpeed = 0.5,
    } = autoplay

    const [hovered, setHovered] = useState(false)
    const [rotation, setRotation] = useState(0)
    const [wrap, setWrap] = useState<WrapState | null>(null)
    const [snapIndex, setSnapIndex] = useState<number | null>(null)
    const [tabVisible, setTabVisible] = useState(
        typeof document === "undefined" ? true : !document.hidden
    )
    const isStatic = useIsStaticRenderer()
    const rotationRef = useRef(rotation)
    const timeoutsRef = useRef<number[]>([])
    const rafRef = useRef<number[]>([])
    const count = cards.length
    const { top: paddingTop, bottom: paddingBottom } = parseVerticalPadding(padding)
    const cardHeight = avatarSize + paddingTop + paddingBottom
    const peek = Math.max(cardHeight * (1 - overlapPercent / 100), 12)
    const autoPlaySpeedMs = Math.max(autoPlaySpeed * 1000, 50)

    const collapsedHeight = (count - 1) * peek + cardHeight
    const expandedHeight = count * cardHeight + (count - 1) * expandedGap
    const containerHeight = hovered ? expandedHeight : collapsedHeight

    useEffect(() => {
        rotationRef.current = rotation
    }, [rotation])

    useEffect(() => {
        if (typeof document === "undefined") return
        const handleVisibilityChange = () => setTabVisible(!document.hidden)
        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () =>
            document.removeEventListener("visibilitychange", handleVisibilityChange)
    }, [])

    useEffect(() => {
        if (isStatic || !autoPlay || hovered || !tabVisible || count < 2) return
        const id = window.setInterval(() => {
            const current = rotationRef.current
            const frontIndex = ((count - 1 - current) % count + count) % count

            // The departing card (fading out beyond the front) and the
            // arriving ghost (fading in just behind the back) both start
            // at the same moment. The ghost mounts invisible first so it
            // has a starting frame to transition from, then flips to its
            // real target on the next paint.
            setWrap({ index: frontIndex, entering: false })
            setRotation((value) => (value + 1) % count)

            const raf1 = window.requestAnimationFrame(() => {
                const raf2 = window.requestAnimationFrame(() => {
                    setWrap({ index: frontIndex, entering: true })

                    // Once the ghost has fully faded in, hand off to the
                    // permanent element with an instant (0ms) snap to the
                    // exact same spot, in the same commit the ghost is
                    // removed — no transition plays, so there's nothing to
                    // pop or flash.
                    const settleTimeout = window.setTimeout(() => {
                        setSnapIndex(frontIndex)
                        setWrap(null)
                        const raf3 = window.requestAnimationFrame(() => {
                            const raf4 = window.requestAnimationFrame(() => {
                                setSnapIndex(null)
                            })
                            rafRef.current.push(raf4)
                        })
                        rafRef.current.push(raf3)
                    }, autoPlaySpeedMs)
                    timeoutsRef.current.push(settleTimeout)
                })
                rafRef.current.push(raf2)
            })
            rafRef.current.push(raf1)
        }, Math.max(autoPlayInterval, 0.2) * 1000)
        return () => {
            window.clearInterval(id)
            timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
            timeoutsRef.current = []
            rafRef.current.forEach((rafId) => window.cancelAnimationFrame(rafId))
            rafRef.current = []
            setWrap(null)
            setSnapIndex(null)
        }
    }, [
        isStatic,
        autoPlay,
        autoPlayInterval,
        hovered,
        tabVisible,
        count,
        autoPlaySpeedMs,
    ])

    const renderCard = (
        reactKey: string | number,
        cardIndex: number,
        card: StackCard,
        vSlot: number,
        opacityOverride: number | null,
        transitionDurationMs: number,
        transitionDelayMs: number
    ) => {
        const frontDepth = count - 1 - vSlot
        const top = hovered ? vSlot * (cardHeight + expandedGap) : vSlot * peek
        const depthPx = hovered ? 0 : -frontDepth * depthOffset
        const scale = 1 - frontDepth * scaleFalloff
        const blur = hovered ? 0 : Math.max(frontDepth * blurAmount, 0)
        const opacity =
            opacityOverride ??
            (hovered ? 1 : Math.max(0.35, 1 - frontDepth * opacityFalloff))
        const zIndex = vSlot + 1

        return (
            <div
                key={reactKey}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    boxSizing: "border-box",
                    padding,
                    background: cardBackground,
                    borderRadius: cardRadius,
                    boxShadow: shadow,
                    zIndex,
                    cursor: hoverEnabled ? "pointer" : undefined,
                    transform: `translateY(${top}px) translateZ(${depthPx}px)`,
                    scale,
                    filter: `blur(${blur}px)`,
                    opacity,
                    transitionProperty: "transform, filter, opacity, scale",
                    transitionDuration: `${transitionDurationMs}ms`,
                    transitionTimingFunction: "ease",
                    transitionDelay: `${transitionDelayMs}ms`,
                    willChange: "transform, filter, opacity, scale",
                }}
            >
                <img
                    src={
                        card.image?.src ??
                        DEFAULT_AVATARS[cardIndex % DEFAULT_AVATARS.length]
                    }
                    srcSet={card.image?.srcSet}
                    alt={card.image?.alt ?? card.title}
                    style={{
                        width: avatarSize * avatarRatio,
                        height: avatarSize,
                        minWidth: avatarSize * avatarRatio,
                        borderRadius: avatarRadius,
                        objectFit: "cover",
                        display: "block",
                    }}
                />
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            ...titleFont,
                            color: titleColor,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {card.title}
                    </span>
                    <span
                        style={{
                            ...subtitleFont,
                            color: subtitleColor,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {card.subtitle}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: containerHeight,
                perspective,
                transformStyle: "preserve-3d",
                transition: `height ${durationMs}ms ease`,
                cursor: hoverEnabled ? "pointer" : undefined,
                outlineOffset: 4,
            }}
            role="button"
            aria-expanded={hoverEnabled ? hovered : undefined}
            aria-label={hovered ? "Collapse card list" : "Expand card list"}
            tabIndex={hoverEnabled ? 0 : undefined}
            onMouseEnter={() => revealOnHover && setHovered(true)}
            onMouseLeave={() => revealOnHover && setHovered(false)}
            onClick={() => revealOnClick && setHovered((value) => !value)}
            onBlur={() => revealOnHover && setHovered(false)}
            onKeyDown={(event) => {
                if (!hoverEnabled) return
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setHovered((value) => !value)
                }
            }}
        >
            {cards.map((card, index) => {
                const slot = (index + rotation) % count
                const isAutoPlayTick = !hovered && wrap !== null
                const isWrapping = isAutoPlayTick && wrap!.index === index

                if (isWrapping && wrap) {
                    // The departing card keeps animating on its existing
                    // element (no remount), while a separate ghost fades in
                    // just behind the back at the exact same time.
                    const enterVSlot = wrap.entering ? 0 : -WRAP_NUDGE
                    return (
                        <Fragment key={index}>
                            {renderCard(
                                index,
                                index,
                                card,
                                count - 1 + WRAP_NUDGE,
                                0,
                                autoPlaySpeedMs,
                                0
                            )}
                            {renderCard(
                                `${index}-ghost`,
                                index,
                                card,
                                enterVSlot,
                                wrap.entering ? null : 0,
                                wrap.entering ? autoPlaySpeedMs : 0,
                                0
                            )}
                        </Fragment>
                    )
                }

                const isSnapping = index === snapIndex
                const transitionDurationMs = isSnapping
                    ? 0
                    : isAutoPlayTick
                      ? autoPlaySpeedMs
                      : durationMs
                const transitionDelayMs =
                    isSnapping || isAutoPlayTick ? 0 : slot * staggerDelayMs

                return (
                    <Fragment key={index}>
                        {renderCard(
                            index,
                            index,
                            card,
                            slot,
                            null,
                            transitionDurationMs,
                            transitionDelayMs
                        )}
                    </Fragment>
                )
            })}
        </div>
    )
}

addPropertyControls(CardStack, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Subtitle",
                },
            },
        },
        maxCount: 8,
        defaultValue: [
            { title: "Denny Davis", subtitle: "Chicago, IL" },
            { title: "Elira Eloise", subtitle: "Oakland, CA" },
            { title: "Fabio Franklin", subtitle: "Jacksonville, FL" },
            { title: "Gillian Gardner", subtitle: "New York City, NY" },
        ],
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        icon: "color",
        controls: {
            cardBackground: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: "0px 2px 8px 0px rgba(0, 0, 0, 0.12)",
            },
            cardRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "10px",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "16px",
            },
            avatarSize: {
                type: ControlType.Number,
                title: "Avatar",
                defaultValue: 64,
                min: 24,
                max: 160,
            },
            avatarRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "8px",
            },
            avatarRatio: {
                type: ControlType.Number,
                title: "Ratio",
                description: "Width-to-height ratio of the avatar image.",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
            overlapPercent: {
                type: ControlType.Number,
                title: "Overlap",
                description:
                    "How much of each stacked card's height is hidden behind the one in front.",
                defaultValue: 40,
                min: 0,
                max: 90,
                unit: "%",
            },
        },
        defaultValue: {
            cardBackground: "#FFFFFF",
            shadow: "0px 2px 8px 0px rgba(0, 0, 0, 0.12)",
            cardRadius: "10px",
            padding: "16px",
            avatarSize: 64,
            avatarRadius: "8px",
            avatarRatio: 1,
            overlapPercent: 40,
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Title",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.1em",
                },
            },
            titleColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#111111",
            },
            subtitleFont: {
                type: ControlType.Font,
                title: "Subtitle",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
            },
            subtitleColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(0, 0, 0, 0.6)",
            },
        },
        defaultValue: {
            titleFont: {
                fontSize: "16px",
                variant: "Semibold",
                letterSpacing: "-0.01em",
                lineHeight: "1.1em",
            },
            titleColor: "#111111",
            subtitleFont: {
                fontSize: "14px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
            },
            subtitleColor: "rgba(0, 0, 0, 0.6)",
        },
    },
    depth: {
        type: ControlType.Object,
        title: "Depth",
        icon: "effect",
        controls: {
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: 500,
                min: 100,
                max: 2000,
            },
            depthOffset: {
                type: ControlType.Number,
                title: "Depth Offset",
                description: "How far back each card sits, in pixels per step.",
                defaultValue: 45,
                min: 0,
                max: 150,
            },
            scaleFalloff: {
                type: ControlType.Number,
                title: "Scale Falloff",
                defaultValue: 0.02,
                min: 0,
                max: 0.2,
                step: 0.005,
            },
            blurAmount: {
                type: ControlType.Number,
                title: "Blur Step",
                defaultValue: 1.5,
                min: 0,
                max: 10,
                step: 0.1,
                unit: "px",
            },
            opacityFalloff: {
                type: ControlType.Number,
                title: "Opacity Step",
                defaultValue: 0.12,
                min: 0,
                max: 0.5,
                step: 0.01,
            },
        },
        defaultValue: {
            perspective: 500,
            depthOffset: 45,
            scaleFalloff: 0.02,
            blurAmount: 1.5,
            opacityFalloff: 0.12,
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Expand",
        icon: "interaction",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Expand",
                defaultValue: true,
            },
            reveal: {
                type: ControlType.Enum,
                title: "Reveal",
                description:
                    "Hover: opens on mouse-over, closes on mouse-out. Click: toggles open/closed on click, tap, or keyboard.",
                options: ["hover", "click"],
                optionTitles: ["Hover", "Click"],
                defaultValue: "hover",
                displaySegmentedControl: true,
                hidden: (props) => !props.enabled,
            },
            expandedGap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 10,
                min: 0,
                max: 80,
                hidden: (props) => !props.enabled,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.5,
                min: 0.1,
                max: 1.5,
                step: 0.05,
                unit: "s",
                hidden: (props) => !props.enabled,
            },
            staggerDelay: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 0.05,
                min: 0,
                max: 0.2,
                step: 0.01,
                unit: "s",
                hidden: (props) => !props.enabled,
            },
        },
        defaultValue: {
            enabled: true,
            reveal: "hover",
            expandedGap: 10,
            duration: 0.5,
            staggerDelay: 0.05,
        },
    },
    autoplay: {
        type: ControlType.Object,
        title: "Auto Play",
        icon: "interaction",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Auto Play",
                description:
                    "Automatically cycles the stack, advancing one card at a time. Pauses while hovered.",
                defaultValue: true,
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 3,
                min: 0.5,
                max: 15,
                step: 0.5,
                unit: "s",
                hidden: (props) => !props.enabled,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                description: "How long each card takes to advance forward and back.",
                defaultValue: 0.5,
                min: 0.1,
                max: 2,
                step: 0.05,
                unit: "s",
                hidden: (props) => !props.enabled,
            },
        },
        defaultValue: {
            enabled: true,
            interval: 3,
            speed: 0.5,
        },
    },
})

CardStack.displayName = "Card Stack Reveal"
