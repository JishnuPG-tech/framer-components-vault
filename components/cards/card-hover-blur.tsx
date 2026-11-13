// Grid Reveal (Grid on desktop, single column on mobile)
// -----------------------------------------------------------
// Made by Detailed (detailed.ch) with Framer Workshop
// V2.0
// Last updated: 01 February 2026
// -----------------------------------------------------------

import {
    motion,
    useInView,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "framer-motion"
import {
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    useEffect,
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


interface Project {
    image: { src: string; alt: string }
    logo: { src: string; alt: string }
    title: string
    text: string
    enableLink: boolean
    link: string
    openInNewTab: boolean
    useLogoColorFilter: boolean
    invertLogoColor: boolean
    titleColor: string
    textColor: string
    useBackground: boolean
    backgroundColorWithOpacity: string
    backgroundPadding: number
    backgroundRadius: number
}

interface ProjectShowcaseProps {
    projects: Project[]
    backgroundColor: string
    overlayColor: string
    titleFont: CSSProperties
    textFont: CSSProperties
    cardRadius: number
    cardGap: number
    cardAspectRatio: number
    cardSize: number
    animationDuration: number
    staggerDelay: number
    hoverScale: number
    hoverAnimationDuration: number
    logoSize: number
    logoPosition:
        | "bottom-left"
        | "bottom-right"
        | "top-left"
        | "top-right"
        | "center"
    logoVisibility: "always" | "hover"
    logoFadeDelay: number
    enableAppearAnimation: boolean
    sectionPadding: number
    contentAlignment: "left" | "center" | "right"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function GridReveal(props: ProjectShowcaseProps) {
    const {
        projects,
        backgroundColor,
        overlayColor,
        titleFont,
        textFont,
        cardRadius,
        cardGap,
        cardAspectRatio,
        cardSize,
        animationDuration,
        staggerDelay,
        hoverScale,
        hoverAnimationDuration,
        logoSize,
        logoPosition,
        logoVisibility,
        logoFadeDelay,
        enableAppearAnimation,
        sectionPadding,
        contentAlignment,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [activeIndexMobile, setActiveIndexMobile] = useState<number | null>(
        null
    )
    const [isMobile, setIsMobile] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })
    const isStatic = useIsStaticRenderer()

    // Helper function to normalize URLs
    const normalizeUrl = (url: string): string => {
        if (!url || url === "#") return "#"
        // Check if it's an internal path (starts with /)
        if (url.startsWith("/")) return url
        // Check if URL already has a protocol
        if (url.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
            return url
        }
        // Add https:// if missing
        return `https://${url}`
    }

    // Detect mobile viewport
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            startTransition(() => setIsMobile(window.innerWidth < 768))
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)

        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Track scroll position and determine active card on mobile
    useEffect(() => {
        if (!isMobile || isStatic || typeof window === "undefined") return

        const handleScroll = () => {
            const viewportCenter = window.innerHeight / 2
            let closestIndex = null
            let closestDistance = Infinity

            cardRefs.current.forEach((card, index) => {
                if (!card) return

                const rect = card.getBoundingClientRect()
                const cardCenter = rect.top + rect.height / 2
                const distance = Math.abs(cardCenter - viewportCenter)

                // Check if card is in viewport
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    if (distance < closestDistance) {
                        closestDistance = distance
                        closestIndex = index
                    }
                }
            })

            if (closestIndex !== activeIndexMobile) {
                startTransition(() => setActiveIndexMobile(closestIndex))
            }
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        handleScroll() // Initial check

        return () => window.removeEventListener("scroll", handleScroll)
    }, [isMobile, isStatic, activeIndexMobile])

    const isFixedWidth = props?.style?.width === "100%"
    const isFixedHeight = props?.style?.height === "100%"

    // Default values for image and logo
    const defaultImage = {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Default Project Image",
    }
    const defaultLogo = {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Default Logo",
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                minHeight: isFixedHeight ? "100%" : "auto",
                backgroundColor,
                padding: `${sectionPadding}px`,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${cardSize}px), 1fr))`,
                    gap: `${cardGap}px`,
                    maxWidth: 1400,
                    margin: "0 auto",
                }}
            >
                {projects.map((project, index) => {
                    const image = project.image || defaultImage
                    const logo = project.logo
                    const hasLogo = logo && logo.src && logo.src.trim() !== ""
                    const isActiveOnMobile =
                        isMobile && activeIndexMobile === index
                    const shouldShowHoverEffect = isMobile
                        ? isActiveOnMobile
                        : hoveredIndex === index

                    return (
                        <motion.a
                            key={index}
                            ref={(el) => {
                                cardRefs.current[index] = el
                            }}
                            href={
                                project.enableLink
                                    ? normalizeUrl(project.link || "#")
                                    : undefined
                            }
                            target={
                                project.enableLink && project.openInNewTab
                                    ? "_blank"
                                    : "_self"
                            }
                            rel={
                                project.enableLink && project.openInNewTab
                                    ? "noopener noreferrer"
                                    : undefined
                            }
                            initial={
                                isStatic || !enableAppearAnimation
                                    ? {
                                          opacity: 1,
                                          filter: "blur(0px)",
                                          scale: 1,
                                      }
                                    : {
                                          opacity: 0,
                                          filter: "blur(8px)",
                                          scale: 0.95,
                                      }
                            }
                            animate={
                                isStatic || !enableAppearAnimation
                                    ? {
                                          opacity: 1,
                                          filter: "blur(0px)",
                                          scale: 1,
                                      }
                                    : isInView
                                      ? {
                                            opacity: 1,
                                            filter: "blur(0px)",
                                            scale: 1,
                                        }
                                      : {
                                            opacity: 0,
                                            filter: "blur(8px)",
                                            scale: 0.95,
                                        }
                            }
                            transition={{
                                duration: animationDuration,
                                delay: enableAppearAnimation
                                    ? index * staggerDelay
                                    : 0,
                                ease: [0.25, 0.1, 0.25, 1],
                            }}
                            style={{
                                position: "relative",
                                aspectRatio: `${cardAspectRatio}`,
                                cursor: project.enableLink
                                    ? "pointer"
                                    : "default",
                                borderRadius: cardRadius,
                                overflow: "hidden",
                                textDecoration: "none",
                                display: "block",
                            }}
                            onMouseEnter={() =>
                                !isMobile &&
                                startTransition(() => setHoveredIndex(index))
                            }
                            onMouseLeave={() =>
                                !isMobile &&
                                startTransition(() => setHoveredIndex(null))
                            }
                            whileHover={
                                isStatic || isMobile
                                    ? {}
                                    : {
                                          scale: hoverScale,
                                          transition: {
                                              duration: hoverAnimationDuration,
                                              ease: [0.25, 0.1, 0.25, 1],
                                          },
                                      }
                            }
                            whileTap={
                                isStatic || isMobile
                                    ? {}
                                    : {
                                          scale: 0.98,
                                          transition: { duration: 0.15 },
                                      }
                            }
                        >
                            <motion.div
                                animate={
                                    isStatic
                                        ? {
                                              opacity: 1,
                                              filter: "blur(0px) saturate(100%)",
                                          }
                                        : isMobile
                                          ? {
                                                opacity:
                                                    activeIndexMobile ===
                                                        null ||
                                                    activeIndexMobile === index
                                                        ? 1
                                                        : 0.6,
                                                filter:
                                                    activeIndexMobile ===
                                                        null ||
                                                    activeIndexMobile === index
                                                        ? "blur(0px) saturate(100%)"
                                                        : "blur(5px) saturate(90%)",
                                            }
                                          : {
                                                opacity:
                                                    hoveredIndex === null ||
                                                    hoveredIndex === index
                                                        ? 1
                                                        : 0.6,
                                                filter:
                                                    hoveredIndex === null ||
                                                    hoveredIndex === index
                                                        ? "blur(0px) saturate(100%)"
                                                        : "blur(5px) saturate(90%)",
                                            }
                                }
                                transition={{
                                    type: "spring",
                                    stiffness: 80,
                                    damping: 25,
                                    mass: 1.2,
                                }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    position: "relative",
                                }}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />

                                <motion.div
                                    initial={
                                        isStatic
                                            ? { opacity: 1 }
                                            : { opacity: 0 }
                                    }
                                    animate={
                                        isStatic
                                            ? { opacity: 1 }
                                            : isInView
                                              ? logoVisibility === "hover"
                                                  ? {
                                                        opacity:
                                                            shouldShowHoverEffect
                                                                ? 1
                                                                : 0,
                                                    }
                                                  : { opacity: 1 }
                                              : { opacity: 0 }
                                    }
                                    transition={{
                                        duration:
                                            logoVisibility === "hover"
                                                ? 0.4
                                                : 0.5,
                                        delay:
                                            logoVisibility === "hover"
                                                ? logoFadeDelay
                                                : logoFadeDelay,
                                        ease: [0.25, 0.1, 0.25, 1],
                                    }}
                                    style={{
                                        position: "absolute",
                                        ...(logoPosition === "bottom-left" && {
                                            bottom: 24,
                                            left: 24,
                                        }),
                                        ...(logoPosition === "bottom-right" && {
                                            bottom: 24,
                                            right: 24,
                                        }),
                                        ...(logoPosition === "top-left" && {
                                            top: 24,
                                            left: 24,
                                        }),
                                        ...(logoPosition === "top-right" && {
                                            top: 24,
                                            right: 24,
                                        }),
                                        ...(logoPosition === "center" && {
                                            top: "50%",
                                            left: "50%",
                                            transform: "translate(-50%, -50%)",
                                        }),
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 12,
                                        alignItems:
                                            contentAlignment === "left"
                                                ? "flex-start"
                                                : contentAlignment === "center"
                                                  ? "center"
                                                  : "flex-end",
                                        textAlign: contentAlignment,
                                        ...(project.useBackground && {
                                            backgroundColor:
                                                project.backgroundColorWithOpacity ||
                                                "rgba(0, 0, 0, 0.5)",
                                            padding: `${project.backgroundPadding || 16}px`,
                                            borderRadius: `${project.backgroundRadius || 8}px`,
                                        }),
                                    }}
                                >
                                    {hasLogo && (
                                        <motion.img
                                            src={logo.src}
                                            alt={logo.alt}
                                            animate={
                                                isStatic
                                                    ? { opacity: 0.8 }
                                                    : {
                                                          opacity:
                                                              logoVisibility ===
                                                                  "always" &&
                                                              shouldShowHoverEffect
                                                                  ? 1
                                                                  : logoVisibility ===
                                                                      "always"
                                                                    ? 0.8
                                                                    : 1,
                                                      }
                                            }
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                width: "auto",
                                                height: logoSize,
                                                objectFit: "contain",
                                                filter: project.useLogoColorFilter
                                                    ? project.invertLogoColor
                                                        ? "brightness(0) invert(1)"
                                                        : "brightness(0)"
                                                    : "none",
                                            }}
                                        />
                                    )}
                                    <span
                                        style={{
                                            color:
                                                project.titleColor || "#FFFFFF",
                                            ...titleFont,
                                        }}
                                    >
                                        {project.title}
                                    </span>
                                    {project.text && (
                                        <span
                                            style={{
                                                color:
                                                    project.textColor ||
                                                    "#FFFFFF",
                                                ...textFont,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {project.text}
                                        </span>
                                    )}
                                </motion.div>

                                <motion.div
                                    animate={{
                                        opacity: shouldShowHoverEffect
                                            ? 0.08
                                            : 0,
                                    }}
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        boxShadow:
                                            "0 20px 60px rgba(0,0,0,0.3)",
                                        pointerEvents: "none",
                                    }}
                                />
                            </motion.div>
                        </motion.a>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(GridReveal, {
    projects: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                logo: {
                    type: ControlType.ResponsiveImage,
                    title: "Logo",
                },
                useLogoColorFilter: {
                    type: ControlType.Boolean,
                    title: "Logo Color Filter",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
                invertLogoColor: {
                    type: ControlType.Boolean,
                    title: "Invert Color",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    hidden: ({ useLogoColorFilter }) => !useLogoColorFilter,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                text: {
                    type: ControlType.String,
                    title: "Text Field",
                    defaultValue: "",
                },
                titleColor: {
                    type: ControlType.Color,
                    title: "Title Color",
                    defaultValue: "#FFFFFF",
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#FFFFFF",
                },
                useBackground: {
                    type: ControlType.Boolean,
                    title: "Use Background",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
                backgroundColorWithOpacity: {
                    type: ControlType.Color,
                    title: "Background Color",
                    defaultValue: "rgba(0, 0, 0, 0.5)",
                    hidden: ({ useBackground }) => !useBackground,
                },
                backgroundPadding: {
                    type: ControlType.Number,
                    title: "Background Padding",
                    defaultValue: 16,
                    min: 0,
                    max: 40,
                    step: 2,
                    unit: "px",
                    hidden: ({ useBackground }) => !useBackground,
                },
                backgroundRadius: {
                    type: ControlType.Number,
                    title: "Background Radius",
                    defaultValue: 8,
                    min: 0,
                    max: 32,
                    step: 1,
                    unit: "px",
                    hidden: ({ useBackground }) => !useBackground,
                },
                enableLink: {
                    type: ControlType.Boolean,
                    title: "Link",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    hidden: ({ enableLink }) => !enableLink,
                },
                openInNewTab: {
                    type: ControlType.Boolean,
                    title: "Open in New Tab",
                    defaultValue: true,
                    enabledTitle: "New Tab",
                    disabledTitle: "Same Tab",
                    hidden: ({ enableLink }) => !enableLink,
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Project 1",
                },
                logo: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Logo 1",
                },
                title: "Vision",
                text: "",
                useLogoColorFilter: true,
                invertLogoColor: true,
                titleColor: "#FFFFFF",
                textColor: "#FFFFFF",
                useBackground: false,
                backgroundColorWithOpacity: "rgba(0, 0, 0, 0.5)",
                backgroundPadding: 16,
                backgroundRadius: 8,
                enableLink: false,
                link: "",
                openInNewTab: true,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Project 2",
                },
                logo: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Logo 2",
                },
                title: "Craft",
                text: "",
                useLogoColorFilter: true,
                invertLogoColor: true,
                titleColor: "#FFFFFF",
                textColor: "#FFFFFF",
                useBackground: false,
                backgroundColorWithOpacity: "rgba(0, 0, 0, 0.5)",
                backgroundPadding: 16,
                backgroundRadius: 8,
                enableLink: false,
                link: "",
                openInNewTab: true,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Project 3",
                },
                logo: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Logo 3",
                },
                title: "Precision",
                text: "",
                useLogoColorFilter: true,
                invertLogoColor: true,
                titleColor: "#FFFFFF",
                textColor: "#FFFFFF",
                useBackground: false,
                backgroundColorWithOpacity: "rgba(0, 0, 0, 0.5)",
                backgroundPadding: 16,
                backgroundRadius: 8,
                enableLink: false,
                link: "",
                openInNewTab: true,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Project 4",
                },
                logo: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Logo 4",
                },
                title: "Detail",
                text: "",
                useLogoColorFilter: true,
                invertLogoColor: true,
                titleColor: "#FFFFFF",
                textColor: "#FFFFFF",
                useBackground: false,
                backgroundColorWithOpacity: "rgba(0, 0, 0, 0.5)",
                backgroundPadding: 16,
                backgroundRadius: 8,
                enableLink: false,
                link: "",
                openInNewTab: true,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Project 5",
                },
                logo: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Logo 5",
                },
                title: "Focus",
                text: "",
                useLogoColorFilter: true,
                invertLogoColor: true,
                titleColor: "#FFFFFF",
                textColor: "#FFFFFF",
                useBackground: false,
                backgroundColorWithOpacity: "rgba(0, 0, 0, 0.5)",
                backgroundPadding: 16,
                backgroundRadius: 8,
                enableLink: false,
                link: "",
                openInNewTab: true,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Project 6",
                },
                logo: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Logo 6",
                },
                title: "Clarity",
                text: "",
                useLogoColorFilter: true,
                invertLogoColor: true,
                titleColor: "#FFFFFF",
                textColor: "#FFFFFF",
                useBackground: false,
                backgroundColorWithOpacity: "rgba(0, 0, 0, 0.5)",
                backgroundPadding: 16,
                backgroundRadius: 8,
                enableLink: false,
                link: "",
                openInNewTab: true,
            },
        ],
    },
    logoVisibility: {
        type: ControlType.Enum,
        title: "Show Logo / Text",
        options: ["always", "hover"],
        optionTitles: ["Always", "Hover"],
        defaultValue: "always",
        displaySegmentedControl: true,
    },
    logoFadeDelay: {
        type: ControlType.Number,
        title: "Logo Fade Delay",
        defaultValue: 0.1,
        min: 0,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    enableAppearAnimation: {
        type: ControlType.Boolean,
        title: "Appear Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    contentAlignment: {
        type: ControlType.Enum,
        title: "Alignment Logo / Text",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    logoPosition: {
        type: ControlType.Enum,
        title: "Positioning Logo / Text",
        options: [
            "bottom-left",
            "bottom-right",
            "top-left",
            "top-right",
            "center",
        ],
        optionTitles: [
            "Bottom Left",
            "Bottom Right",
            "Top Left",
            "Top Right",
            "Center",
        ],
        defaultValue: "bottom-left",
        displaySegmentedControl: false,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 4,
        unit: "px",
    },
    cardAspectRatio: {
        type: ControlType.Number,
        title: "Card Aspect Ratio",
        defaultValue: 0.8,
        min: 0.5,
        max: 2,
        step: 0.1,
        displayStepper: true,
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size",
        defaultValue: 400,
        min: 200,
        max: 800,
        step: 20,
        unit: "px",
    },
    sectionPadding: {
        type: ControlType.Number,
        title: "Section Padding",
        defaultValue: 80,
        min: 0,
        max: 200,
        step: 8,
        unit: "px",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.12,
        min: 0,
        max: 0.5,
        step: 0.02,
        unit: "s",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.03,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    hoverAnimationDuration: {
        type: ControlType.Number,
        title: "Hover Animation Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 32,
        min: 16,
        max: 80,
        step: 4,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
