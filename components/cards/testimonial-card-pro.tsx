import * as React from "react"
import {
    type CSSProperties,
    useEffect,
    useMemo,
    useState,
    startTransition,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

type AvatarImage = { src: string; srcSet?: string; alt?: string }

type TestimonialItem = {
    quote: string
    author: string
    role: string
    avatar?: AvatarImage
    color: string
    rotation: number
}

type Props = {
    testimonials: TestimonialItem[]

    quoteColor: string
    metaColor: string
    roleColor: string

    quoteFont: any
    authorFont: any
    roleFont: any

    cardWidth: number
    cardHeight: number
    cardRadius: number
    cardPadding: number
    overlap: number

    lift: number
    hoverScale: number

    sectionPadding: number

    showAvatar: boolean
    avatarSize: number
    avatarRadius: number

    appear: boolean
    appearStagger: number
    appearFromY: number
    appearFromOpacity: number
    appearFromScale: number

    style?: CSSProperties
}

/**
 * Testimonial Fan Deck
 *
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 700
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TestimonialFanDeck(props: Props) {
    const {
        testimonials,

        quoteColor,
        metaColor,
        roleColor,

        quoteFont,
        authorFont,
        roleFont,

        cardWidth,
        cardHeight,
        cardRadius,
        cardPadding,
        overlap,

        lift,
        hoverScale,

        sectionPadding,

        showAvatar,
        avatarSize,
        avatarRadius,

        appear,
        appearStagger,
        appearFromY,
        appearFromOpacity,
        appearFromScale,

        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)

    const [containerWidth, setContainerWidth] = useState(0)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return
        const el = rootRef.current
        if (!el) return

        const update = () => {
            const next = el.getBoundingClientRect().width
            startTransition(() => setContainerWidth(next))
        }

        update()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", update)
            return () => window.removeEventListener("resize", update)
        }

        const ro = new ResizeObserver(() => update())
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const isMobile = containerWidth > 0 ? containerWidth <= 520 : false

    const headerSpring = useMemo(
        () =>
            ({
                type: "spring" as const,
                stiffness: 260,
                damping: 26,
            }) as const,
        []
    )

    const hoverSpring = useMemo(
        () =>
            ({
                type: "spring" as const,
                stiffness: 400,
                damping: 28,
            }) as const,
        []
    )

    const defaultAvatars = useMemo(
        (): AvatarImage[] => [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Avatar 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Avatar 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Avatar 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Avatar 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Avatar 5",
            },
        ],
        []
    )

    const safeTestimonials = useMemo(() => {
        const base = Array.isArray(testimonials) ? testimonials : []
        return base.filter(Boolean).map((t, i) => ({
            quote: t.quote ?? "",
            author: t.author ?? "",
            role: t.role ?? "",
            avatar: (t.avatar ??
                defaultAvatars[i % defaultAvatars.length]) as AvatarImage,
            color: t.color ?? "#F5F5F5",
            rotation: Number.isFinite(t.rotation) ? t.rotation : 0,
        }))
    }, [testimonials, defaultAvatars])

    const desktopStackWidth = useMemo(() => {
        const count = safeTestimonials.length
        if (count <= 0) return 0
        return cardWidth * count - Math.abs(overlap) * (count - 1)
    }, [safeTestimonials.length, cardWidth, overlap])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflowX: "visible",
                overflowY: "visible",
                ...style,
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: sectionPadding,
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: 1100,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            paddingTop: Math.max(
                                12,
                                Math.round(sectionPadding * 0.2)
                            ),
                            paddingBottom: Math.max(
                                12,
                                Math.round(sectionPadding * 0.2)
                            ),
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "stretch",
                                justifyContent: isMobile
                                    ? "flex-start"
                                    : "center",
                                flexDirection: "row",
                                gap: isMobile ? 16 : 0,
                                width: isMobile
                                    ? "100%"
                                    : desktopStackWidth || undefined,
                                overflowX: isMobile ? "auto" : "visible",
                                // Note: when overflow-x is not "visible", many browsers treat overflow-y: "visible" as "auto" and clip shadows.
                                overflowY: isMobile ? "hidden" : "visible",
                                paddingTop: isMobile ? 40 : undefined,
                                paddingBottom: isMobile ? 40 : undefined,
                                WebkitOverflowScrolling: isMobile
                                    ? "touch"
                                    : undefined,
                                scrollSnapType: isMobile
                                    ? "x mandatory"
                                    : undefined,
                                paddingRight: isMobile ? 8 : undefined,
                                marginLeft: isMobile ? 0 : "auto",
                                marginRight: isMobile ? 0 : "auto",
                            }}
                            aria-label="Testimonials"
                            role="list"
                        >
                            {safeTestimonials.map((t, idx) => {
                                const marginLeft = isMobile
                                    ? 0
                                    : idx === 0
                                      ? 0
                                      : -Math.abs(overlap)
                                const baseRotate = t.rotation
                                const isHovered = hoveredIndex === idx

                                const interactiveProps = isStatic
                                    ? {}
                                    : {
                                          onHoverStart: () =>
                                              startTransition(() =>
                                                  setHoveredIndex(idx)
                                              ),
                                          onHoverEnd: () =>
                                              startTransition(() =>
                                                  setHoveredIndex(null)
                                              ),
                                          whileHover: {
                                              rotate: 0,
                                              y: -Math.abs(lift),
                                              scale: Math.max(0.5, hoverScale),
                                              transition: hoverSpring,
                                          },
                                          whileFocus: {
                                              rotate: 0,
                                              y: -Math.abs(lift),
                                              scale: Math.max(0.5, hoverScale),
                                              transition: hoverSpring,
                                          },
                                      }

                                return (
                                    <motion.div
                                        key={`${idx}-${t.author}-${t.quote}`}
                                        initial={
                                            isStatic || !appear
                                                ? false
                                                : {
                                                      opacity:
                                                          appearFromOpacity,
                                                      y: appearFromY,
                                                      rotate: baseRotate,
                                                      scale: appearFromScale,
                                                  }
                                        }
                                        animate={{
                                            opacity: 1,
                                            rotate: baseRotate,
                                            y: 0,
                                            scale: 1,
                                        }}
                                        transition={
                                            isStatic || !appear
                                                ? undefined
                                                : {
                                                      type: "spring" as const,
                                                      stiffness: 280,
                                                      damping: 26,
                                                      delay:
                                                          idx *
                                                          Math.max(
                                                              0,
                                                              appearStagger
                                                          ),
                                                  }
                                        }
                                        style={{
                                            position: "relative",
                                            width: cardWidth,
                                            height: cardHeight,
                                            marginLeft,
                                            padding: cardPadding,
                                            boxSizing: "border-box",
                                            borderRadius: cardRadius,
                                            background: t.color,
                                            cursor: isStatic
                                                ? "default"
                                                : "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                            outline: "none",
                                            zIndex: isHovered ? 100 : idx + 1,
                                            userSelect: "none",
                                            scrollSnapAlign: isMobile
                                                ? "center"
                                                : undefined,
                                            willChange: isStatic
                                                ? undefined
                                                : "transform, z-index",
                                            transform: "translateZ(0)",
                                            pointerEvents: "auto",
                                        }}
                                        tabIndex={isStatic ? -1 : 0}
                                        role="listitem"
                                        aria-label={`Testimonial from ${t.author}`}
                                        {...interactiveProps}
                                        onKeyDown={
                                            isStatic
                                                ? undefined
                                                : (e) => {
                                                      if (e.key === "Escape") {
                                                          ;(
                                                              e.currentTarget as HTMLDivElement
                                                          ).blur()
                                                      }
                                                  }
                                        }
                                    >
                                        <div
                                            style={{
                                                position: "relative",
                                                color: quoteColor,
                                                ...quoteFont,
                                            }}
                                        >
                                            {`"${t.quote}"`}
                                        </div>

                                        <div
                                            style={{
                                                position: "relative",
                                                marginTop: 16,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                            }}
                                        >
                                            {showAvatar && (
                                                <img
                                                    src={t.avatar?.src}
                                                    srcSet={t.avatar?.srcSet}
                                                    alt={t.avatar?.alt ?? ""}
                                                    style={{
                                                        width: avatarSize,
                                                        height: avatarSize,
                                                        borderRadius:
                                                            avatarRadius,
                                                        objectFit: "cover",
                                                        flex: "0 0 auto",
                                                    }}
                                                />
                                            )}
                                            <div
                                                style={{
                                                    position: "relative",
                                                    minWidth: 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        color: metaColor,
                                                        ...authorFont,
                                                    }}
                                                >
                                                    {t.author}
                                                </div>
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        color: roleColor,
                                                        marginTop: 4,
                                                        ...roleFont,
                                                    }}
                                                >
                                                    {t.role}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(TestimonialFanDeck, {
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    defaultValue:
                        "Driftwave turned our scattered launch checklists into one calm, living plan.",
                    displayTextArea: true,
                },
                author: {
                    type: ControlType.String,
                    title: "Author",
                    defaultValue: "Marisol Vega",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Product Lead, Halcyon",
                },
                avatar: {
                    type: ControlType.ResponsiveImage,
                    title: "Avatar",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#F5F5F5",
                },
                rotation: {
                    type: ControlType.Number,
                    title: "Rotation",
                    defaultValue: -5,
                    min: -20,
                    max: 20,
                    step: 1,
                    unit: "deg",
                },
            },
        },
        defaultValue: [
            {
                quote: "Driftwave turned our scattered launch checklists into one calm, living plan.",
                author: "Marisol Vega",
                role: "Product Lead, Halcyon",
                color: "#F3F3F3",
                rotation: -5,
            },
            {
                quote: "I stopped chasing updates in chat. Driftwave just shows me where everything stands.",
                author: "Idris Okafor",
                role: "Studio Manager, Northbound",
                color: "#E67E5E",
                rotation: 3,
            },
            {
                quote: "Our design reviews went from messy threads to a single clear timeline.",
                author: "Chloe Brennan",
                role: "Design Lead, Fernweh",
                color: "#99D1B7",
                rotation: -2,
            },
            {
                quote: "Setup took ten minutes. My whole team was using it by lunch.",
                author: "Kenji Mori",
                role: "Head of Operations, Bluepine",
                color: "#CDB4DB",
                rotation: 4,
            },
            {
                quote: "Finally, a planning tool that feels like it was built by people who ship.",
                author: "Anika Rao",
                role: "Engineering Manager, Quillon",
                color: "#F4B183",
                rotation: -3,
            },
            {
                quote: "We cut our weekly status meeting in half and nobody missed it.",
                author: "Tobias Lindqvist",
                role: "COO, Ember & Oak",
                color: "#F0D36D",
                rotation: 6,
            },
        ],
    },

    quoteColor: {
        type: ControlType.Color,
        title: "Quote Color",
        defaultValue: "#000000",
    },
    metaColor: {
        type: ControlType.Color,
        title: "Author Color",
        defaultValue: "#000000",
    },
    roleColor: {
        type: ControlType.Color,
        title: "Role Color",
        defaultValue: "#000000",
    },

    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Medium",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
            textAlign: "left",
        },
    },
    authorFont: {
        type: ControlType.Font,
        title: "Author Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            textAlign: "left",
        },
    },
    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            textAlign: "left",
        },
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 256,
        min: 160,
        max: 420,
        step: 1,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 320,
        min: 220,
        max: 520,
        step: 1,
        unit: "px",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 28,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        defaultValue: 28,
        min: 10,
        max: 64,
        step: 1,
        unit: "px",
    },
    overlap: {
        type: ControlType.Number,
        title: "Overlap",
        defaultValue: 48,
        min: 0,
        max: 140,
        step: 1,
        unit: "px",
    },

    lift: {
        type: ControlType.Number,
        title: "Hover Lift",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.25,
        step: 0.01,
    },

    sectionPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 48,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
    },

    showAvatar: {
        type: ControlType.Boolean,
        title: "Avatar",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    avatarSize: {
        type: ControlType.Number,
        title: "Avatar Size",
        defaultValue: 40,
        min: 20,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ showAvatar }) => !showAvatar,
    },
    avatarRadius: {
        type: ControlType.Number,
        title: "Avatar Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
        hidden: ({ showAvatar }) => !showAvatar,
    },

    appear: {
        type: ControlType.Boolean,
        title: "Appear",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    appearStagger: {
        type: ControlType.Number,
        title: "Appear Stagger",
        defaultValue: 0.06,
        min: 0,
        max: 0.5,
        step: 0.01,
        hidden: ({ appear }) => !appear,
    },
    appearFromY: {
        type: ControlType.Number,
        title: "Appear From Y",
        defaultValue: 18,
        min: -200,
        max: 200,
        step: 1,
        unit: "px",
        hidden: ({ appear }) => !appear,
    },
    appearFromOpacity: {
        type: ControlType.Number,
        title: "Appear Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ appear }) => !appear,
    },
    appearFromScale: {
        type: ControlType.Number,
        title: "Appear Scale",
        defaultValue: 0.98,
        min: 0.5,
        max: 1,
        step: 0.01,
        hidden: ({ appear }) => !appear,
    },
})
