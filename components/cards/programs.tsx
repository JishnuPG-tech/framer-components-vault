/* Created by Nur Mohammad From Rayso Studio */
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

/* =========================================================
   TYPES
========================================================= */

type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
}

type Program = {
    title: string
    description: string
    /* Shown in the panel as "Number / Label" (e.g. "01" or "4 weeks").
       The key stays "duration" so existing instances keep their content. */
    duration: string

    iconMode: "emoji" | "image" | "none"
    icon: string
    iconImage?: ResponsiveImage
}

type Props = {
    programs: Program[]
    layout: {
        maxWidth: number
        desktopColumns: number
        tabletColumns: number
        mobileColumns: number
        gap: number
    }
    spacing: {
        sectionPadding: string
        cardPadding: string
        cardRadius: string
        cardMinHeight: number
    }
    colors: {
        backgroundColor: string
        cardBackground: string
        cardTitleColor: string
        descriptionColor: string
        accentColor: string
    }
    border: {
        borderWidth: number
        borderStyle: "solid" | "dashed" | "dotted" | "double"
        borderColor: string
    }
    hoverBorderColor: string
    cardTitleFont: React.CSSProperties
    descriptionFont: React.CSSProperties
    durationFont: React.CSSProperties
    iconStyle: {
        showIcons: boolean
        iconSize: number
        iconRadius: number
        iconBackground: string
    }
    content: {
        showDuration: boolean
    }
    hover: {
        enableHover: boolean
        enableShimmer: boolean
        hoverLift: number
        hoverGlow: number
        hoverCardBackground: string
        hoverGlowColor: string
        hoverShimmerGradient: string
    }
    entrance: {
        enableEntrance: boolean
        entranceDistance: number
        entranceDuration: number
        entranceStagger: number
    }
    accessibility: {
        reducedMotion: boolean
    }
}

/* =========================================================
   DEFAULT CONTENT
========================================================= */

const defaultPrograms: Program[] = [
    {
        title: "Smart Automation",
        description:
            "Automate repetitive tasks and keep your workflow running smoothly.",
        duration: "01",
        iconMode: "emoji",
        icon: "⚙️",
        iconImage: {},
    },

    {
        title: "Fast Performance",
        description:
            "Build fast, responsive experiences that feel smooth across every device.",
        duration: "02",
        iconMode: "emoji",
        icon: "⚡",
        iconImage: {},
    },

    {
        title: "Easy Integration",
        description:
            "Connect your favorite tools and bring your entire workflow together.",
        duration: "03",
        iconMode: "emoji",
        icon: "🔗",
        iconImage: {},
    },

    {
        title: "Real-time Analytics",
        description:
            "Track important metrics and understand how your product is performing.",
        duration: "04",
        iconMode: "emoji",
        icon: "📈",
        iconImage: {},
    },

    {
        title: "Team Collaboration",
        description:
            "Work together, share ideas, and keep projects moving forward.",
        duration: "05",
        iconMode: "emoji",
        icon: "👥",
        iconImage: {},
    },

    {
        title: "Reliable Workflow",
        description:
            "Create consistent processes that help your team work more efficiently.",
        duration: "06",
        iconMode: "emoji",
        icon: "🛡️",
        iconImage: {},
    },
]

/* =========================================================
   HELPERS
========================================================= */

function getColumns(
    width: number,
    desktop: number,
    tablet: number,
    mobile: number
) {
    if (width >= 900) return Math.max(1, desktop)

    if (width >= 600) return Math.max(1, tablet)

    return Math.max(1, mobile)
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Programs(props: Props) {
    const {
        programs = defaultPrograms,
        layout,
        spacing,
        colors,
        border,
        hoverBorderColor,
        cardTitleFont,
        descriptionFont,
        durationFont,
        iconStyle,
        content,
        hover,
        entrance,
        accessibility,
    } = props

    const { maxWidth, desktopColumns, tabletColumns, mobileColumns, gap } =
        layout

    const { sectionPadding, cardPadding, cardRadius, cardMinHeight } = spacing

    const {
        backgroundColor,
        cardBackground,
        cardTitleColor,
        descriptionColor,
        accentColor,
    } = colors

    const cardBorder = border
    const { showIcons, iconSize, iconRadius, iconBackground } = iconStyle
    const { showDuration } = content
    const {
        enableHover,
        enableShimmer,
        hoverLift,
        hoverGlow,
        hoverCardBackground,
        hoverGlowColor,
        hoverShimmerGradient,
    } = hover
    const {
        enableEntrance,
        entranceDistance,
        entranceDuration,
        entranceStagger,
    } = entrance
    const { reducedMotion } = accessibility

    /* True on the Framer canvas and during static export */
    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)

    const [containerWidth, setContainerWidth] = React.useState(1200)

    const [prefersReducedMotion, setPrefersReducedMotion] =
        React.useState(false)

    /* -----------------------------------------------------
       Container resize detection
    ----------------------------------------------------- */

    React.useEffect(() => {
        const element = containerRef.current

        if (!element) return

        const updateSize = () => {
            setContainerWidth(element.getBoundingClientRect().width)
        }

        updateSize()

        const observer = new ResizeObserver(updateSize)

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    /* -----------------------------------------------------
       System reduced-motion detection
    ----------------------------------------------------- */

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

        const update = () => {
            setPrefersReducedMotion(mediaQuery.matches)
        }

        update()

        mediaQuery.addEventListener?.("change", update)

        return () => {
            mediaQuery.removeEventListener?.("change", update)
        }
    }, [])

    /* Static renderer: no animations or effects, plain styled cards only */
    const motionDisabled = isStatic || reducedMotion || prefersReducedMotion

    const columns = getColumns(
        containerWidth,
        desktopColumns,
        tabletColumns,
        mobileColumns
    )

    return (
        <section
            style={{
                ...styles.section,

                backgroundColor,

                padding: sectionPadding,
            }}
        >
            <div
                ref={containerRef}
                style={{
                    ...styles.container,

                    maxWidth,
                }}
            >
                {/* =================================================
                    GRID
                ================================================= */}

                <div
                    style={{
                        ...styles.grid,

                        gap,

                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    }}
                >
                    {programs.map((program, index) => (
                        <ProgramCard
                            key={`${program.title}-${index}`}
                            program={program}
                            index={index}
                            cardPadding={cardPadding}
                            cardRadius={cardRadius}
                            cardMinHeight={cardMinHeight}
                            cardBackground={cardBackground}
                            cardBorder={cardBorder}
                            cardTitleColor={cardTitleColor}
                            descriptionColor={descriptionColor}
                            accentColor={accentColor}
                            cardTitleFont={cardTitleFont}
                            descriptionFont={descriptionFont}
                            durationFont={durationFont}
                            showIcons={showIcons}
                            showDuration={showDuration}
                            iconSize={iconSize}
                            iconRadius={iconRadius}
                            iconBackground={iconBackground}
                            enableHover={enableHover}
                            enableShimmer={enableShimmer}
                            hoverLift={hoverLift}
                            hoverGlow={hoverGlow}
                            hoverCardBackground={hoverCardBackground}
                            hoverGlowColor={hoverGlowColor}
                            hoverShimmerGradient={hoverShimmerGradient}
                            hoverBorderColor={hoverBorderColor}
                            enableEntrance={enableEntrance}
                            entranceDistance={entranceDistance}
                            entranceDuration={entranceDuration}
                            entranceStagger={entranceStagger}
                            motionDisabled={motionDisabled}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

/* =========================================================
   PROGRAM CARD
========================================================= */

function ProgramCard({
    program,
    index,

    cardPadding,
    cardRadius,
    cardMinHeight,

    cardBackground,
    cardBorder,

    cardTitleColor,
    descriptionColor,
    accentColor,

    cardTitleFont,
    descriptionFont,
    durationFont,

    showIcons,
    showDuration,

    iconSize,
    iconRadius,
    iconBackground,

    enableHover,
    enableShimmer,

    hoverLift,
    hoverGlow,

    hoverCardBackground,
    hoverGlowColor,
    hoverShimmerGradient,
    hoverBorderColor,

    enableEntrance,
    entranceDistance,
    entranceDuration,
    entranceStagger,

    motionDisabled,
}: {
    program: Program
    index: number

    cardPadding: string
    cardRadius: string
    cardMinHeight: number

    cardBackground: string
    cardBorder: {
        borderWidth: number
        borderStyle: "solid" | "dashed" | "dotted" | "double"
        borderColor: string
    }

    cardTitleColor: string
    descriptionColor: string
    accentColor: string

    cardTitleFont: React.CSSProperties
    descriptionFont: React.CSSProperties
    durationFont: React.CSSProperties

    showIcons: boolean
    showDuration: boolean

    iconSize: number
    iconRadius: number
    iconBackground: string

    enableHover: boolean
    enableShimmer: boolean

    hoverLift: number
    hoverGlow: number

    hoverCardBackground: string
    hoverGlowColor: string
    hoverShimmerGradient: string
    hoverBorderColor: string

    enableEntrance: boolean
    entranceDistance: number
    entranceDuration: number
    entranceStagger: number

    motionDisabled: boolean
}) {
    const [hovered, setHovered] = React.useState(false)

    const [entered, setEntered] = React.useState(!enableEntrance)

    React.useEffect(() => {
        if (!enableEntrance || motionDisabled) {
            setEntered(true)
            return
        }

        const frame = requestAnimationFrame(() => setEntered(true))
        return () => cancelAnimationFrame(frame)
    }, [enableEntrance, motionDisabled])

    const canAnimate = !motionDisabled

    const interactive = enableHover && canAnimate

    const shouldLift = interactive && hovered

    const entranceDelay = index * entranceStagger

    const cardStyle: React.CSSProperties = {
        ...styles.card,

        padding: cardPadding,

        borderRadius: cardRadius,

        minHeight: cardMinHeight > 0 ? cardMinHeight : undefined,

        background: shouldLift ? hoverCardBackground : cardBackground,

        borderWidth: cardBorder.borderWidth,

        borderStyle: cardBorder.borderStyle,

        borderColor: shouldLift ? hoverBorderColor : cardBorder.borderColor,

        transform: shouldLift
            ? `translateY(-${hoverLift}px)`
            : enableEntrance && canAnimate && !entered
              ? `translateY(${entranceDistance}px)`
              : "translateY(0)",

        boxShadow: shouldLift
            ? `0 0 ${hoverGlow}px ${hoverGlowColor}`
            : "0 0 0 rgba(0,0,0,0)",

        transition: canAnimate
            ? `
                transform ${entranceDuration}s cubic-bezier(0.22,1,0.36,1),
                box-shadow 400ms ease,
                background 400ms ease,
                border-color 400ms ease
            `
            : "none",

        transitionDelay:
            enableEntrance && canAnimate ? `${entranceDelay}s` : "0s",

        cursor: "default",
    }

    const cardContent = (
        <>
            {/* -------------------------------------------------
                SHIMMER
            ------------------------------------------------- */}

            {enableShimmer && canAnimate && (
                <span
                    aria-hidden="true"
                    style={{
                        ...styles.shimmer,

                        background: hoverShimmerGradient,

                        opacity: hovered ? 1 : 0,

                        transform: hovered
                            ? "translateX(220%) skewX(-18deg)"
                            : "translateX(-120%) skewX(-18deg)",
                    }}
                />
            )}

            <div style={styles.cardContent}>
                {/* -------------------------------------------------
                    ICON
                ------------------------------------------------- */}

                {showIcons && program.iconMode !== "none" && (
                    <div
                        aria-hidden="true"
                        style={{
                            ...styles.icon,

                            width: iconSize,

                            height: iconSize,

                            borderRadius: iconRadius,

                            background: iconBackground,

                            color: accentColor,
                        }}
                    >
                        {program.iconMode === "image" &&
                        program.iconImage?.src ? (
                            <img
                                src={program.iconImage.src}
                                srcSet={program.iconImage.srcSet}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "inherit",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <span
                                style={{
                                    fontSize: Math.max(18, iconSize * 0.48),

                                    lineHeight: 1,
                                }}
                            >
                                {program.icon}
                            </span>
                        )}
                    </div>
                )}

                {/* -------------------------------------------------
                    TITLE
                ------------------------------------------------- */}

                {program.title && (
                    <h3
                        style={{
                            ...styles.cardTitle,

                            ...cardTitleFont,

                            color: cardTitleColor,
                        }}
                    >
                        {program.title}
                    </h3>
                )}

                {/* -------------------------------------------------
                    DESCRIPTION
                ------------------------------------------------- */}

                {program.description && (
                    <p
                        style={{
                            ...styles.cardDescription,

                            ...descriptionFont,

                            color: descriptionColor,
                        }}
                    >
                        {program.description}
                    </p>
                )}

                {/* -------------------------------------------------
                    NUMBER / LABEL
                ------------------------------------------------- */}

                {showDuration && program.duration && (
                    <span
                        style={{
                            ...styles.duration,

                            ...durationFont,

                            color: accentColor,
                        }}
                    >
                        {program.duration}
                    </span>
                )}
            </div>
        </>
    )

    /* ---------------------------------------------------------
       NON-LINKED CARD
    --------------------------------------------------------- */

    return (
        <article
            style={cardStyle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {cardContent}
        </article>
    )
}

/* =========================================================
   STYLES
========================================================= */

const styles: Record<string, React.CSSProperties> = {
    section: {
        width: "100%",

        minWidth: 0,

        boxSizing: "border-box",

        overflow: "hidden",

        color: "#FFFFFF",
    },

    container: {
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
    },

    grid: {
        width: "100%",

        display: "grid",

        alignItems: "stretch",

        boxSizing: "border-box",
    },

    card: {
        position: "relative",

        width: "100%",

        minWidth: 0,

        boxSizing: "border-box",

        overflow: "hidden",

        isolation: "isolate",
    },

    cardContent: {
        position: "relative",

        zIndex: 2,

        height: "100%",

        display: "flex",

        flexDirection: "column",

        alignItems: "flex-start",
    },

    icon: {
        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        flexShrink: 0,

        marginBottom: 22,

        overflow: "hidden",

        boxSizing: "border-box",
    },

    cardTitle: {
        width: "100%",

        margin: 0,

        letterSpacing: "-0.025em",
    },

    cardDescription: {
        width: "100%",

        margin: "12px 0 20px",
    },

    duration: {
        display: "inline-block",

        marginTop: "auto",

        fontWeight: 600,
    },

    shimmer: {
        position: "absolute",

        top: "-20%",

        left: "-20%",

        width: "45%",

        height: "140%",

        zIndex: 1,

        pointerEvents: "none",

        transform: "translateX(-120%) skewX(-18deg)",

        transition:
            "transform 900ms cubic-bezier(0.22,1,0.36,1), opacity 250ms ease",
    },
}

/* =========================================================
   DEFAULT PROPS
========================================================= */

Programs.defaultProps = {
    programs: defaultPrograms,

    layout: {
        maxWidth: 1200,
        desktopColumns: 3,
        tabletColumns: 2,
        mobileColumns: 1,
        gap: 24,
    },

    spacing: {
        /* Matches the property control default below */
        sectionPadding: "80px 20px",
        cardPadding: "30px",
        cardRadius: "16px",
        cardMinHeight: 0,
    },

    colors: {
        backgroundColor: "transparent",
        cardBackground: "linear-gradient(145deg, #1A1A1A 0%, #111111 100%)",
        cardTitleColor: "#FFFFFF",
        descriptionColor: "#CCCCCC",
        accentColor: "#FF3C3C",
    },

    border: {
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(255,255,255,0.06)",
    },

    hoverBorderColor: "rgba(255,60,60,0.28)",

    cardTitleFont: {
        fontSize: "21px",
        fontWeight: 600,
        lineHeight: 1.25,
        letterSpacing: "-0.025em",
    },

    descriptionFont: {
        fontSize: "15px",
        fontWeight: 400,
        lineHeight: 1.7,
    },

    durationFont: {
        fontSize: "14px",
        fontWeight: 600,
        lineHeight: 1.4,
    },

    iconStyle: {
        showIcons: true,
        iconSize: 52,
        iconRadius: 14,
        iconBackground: "rgba(255,60,60,0.08)",
    },

    content: {
        showDuration: true,
    },

    hover: {
        enableHover: true,
        enableShimmer: true,
        hoverLift: 8,
        hoverGlow: 20,
        hoverCardBackground:
            "linear-gradient(145deg, #202020 0%, #121212 100%)",
        hoverGlowColor: "rgba(59,130,246,0.18)",
        hoverShimmerGradient:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 30%, rgba(255,60,60,0.16) 50%, rgba(255,255,255,0.02) 70%, transparent 100%)",
    },

    entrance: {
        enableEntrance: false,
        entranceDistance: 12,
        entranceDuration: 0.6,
        entranceStagger: 0.06,
    },

    accessibility: {
        reducedMotion: false,
    },
}

/* =========================================================
   PROPERTY CONTROLS
========================================================= */

addPropertyControls(Programs, {
    /* -------------------------------------------------------
       CONTENT
    ------------------------------------------------------- */

    programs: {
        type: ControlType.Array,

        title: "Cards",

        maxCount: 12,

        control: {
            type: ControlType.Object,

            controls: {
                title: {
                    type: ControlType.String,

                    title: "Title",

                    defaultValue: "Program",

                    maxLength: 60,
                },

                description: {
                    type: ControlType.String,

                    title: "Description",

                    displayTextArea: true,

                    defaultValue: "Program description",

                    maxLength: 200,
                },

                duration: {
                    type: ControlType.String,

                    title: "Number / Label",

                    defaultValue: "01",

                    maxLength: 30,
                },

                iconMode: {
                    type: ControlType.Enum,

                    title: "Icon",

                    options: ["emoji", "image", "none"],

                    optionTitles: ["Emoji", "Image", "None"],

                    defaultValue: "emoji",
                },

                icon: {
                    type: ControlType.String,

                    title: "Emoji",

                    defaultValue: "⚙️",

                    maxLength: 4,

                    hidden(props) {
                        return props.iconMode !== "emoji"
                    },
                },

                iconImage: {
                    type: ControlType.ResponsiveImage,

                    title: "Image",

                    hidden(props) {
                        return props.iconMode !== "image"
                    },
                },
            },
        },

        defaultValue: defaultPrograms,
    },

    /* -------------------------------------------------------
       LAYOUT
    ------------------------------------------------------- */

    layout: {
        type: ControlType.Object,

        title: "Layout",

        buttonTitle: "Layout",

        icon: "layout",

        controls: {
            maxWidth: {
                type: ControlType.Number,

                title: "Max Width",

                min: 600,

                max: 1600,

                step: 10,

                unit: "px",

                defaultValue: 1200,
            },

            desktopColumns: {
                type: ControlType.Number,

                title: "Desktop",

                min: 1,

                max: 4,

                step: 1,

                displayStepper: true,

                defaultValue: 3,
            },

            tabletColumns: {
                type: ControlType.Number,

                title: "Tablet",

                min: 1,

                max: 3,

                step: 1,

                displayStepper: true,

                defaultValue: 2,
            },

            mobileColumns: {
                type: ControlType.Number,

                title: "Mobile",

                min: 1,

                max: 2,

                step: 1,

                displayStepper: true,

                defaultValue: 1,
            },

            gap: {
                type: ControlType.Number,

                title: "Gap",

                min: 0,

                max: 80,

                step: 1,

                unit: "px",

                defaultValue: 24,
            },
        },
    },

    /* -------------------------------------------------------
       SPACING
    ------------------------------------------------------- */

    spacing: {
        type: ControlType.Object,

        title: "Spacing",

        buttonTitle: "Spacing",

        icon: "object",

        controls: {
            sectionPadding: {
                type: ControlType.Padding,

                title: "Section",

                defaultValue: "80px 20px",
            },

            cardPadding: {
                type: ControlType.Padding,

                title: "Card",

                defaultValue: "30px",
            },

            cardRadius: {
                type: ControlType.BorderRadius,

                title: "Radius",

                defaultValue: "16px",
            },

            cardMinHeight: {
                type: ControlType.Number,

                title: "Min Height",

                min: 0,

                max: 500,

                step: 5,

                unit: "px",

                defaultValue: 0,
            },
        },
    },

    /* -------------------------------------------------------
       COLORS
    ------------------------------------------------------- */

    colors: {
        type: ControlType.Object,

        title: "Colors",

        buttonTitle: "Colors",

        icon: "color",

        controls: {
            backgroundColor: {
                type: ControlType.Color,

                title: "Background",

                defaultValue: "transparent",
            },

            cardBackground: {
                type: ControlType.String,

                title: "Card",

                defaultValue:
                    "linear-gradient(145deg, #1A1A1A 0%, #111111 100%)",
            },

            cardTitleColor: {
                type: ControlType.Color,

                title: "Card Title",

                defaultValue: "#FFFFFF",
            },

            descriptionColor: {
                type: ControlType.Color,

                title: "Description",

                defaultValue: "#CCCCCC",
            },

            accentColor: {
                type: ControlType.Color,

                title: "Accent",

                defaultValue: "#FF3C3C",
            },
        },
    },

    /* -------------------------------------------------------
       CARD BORDER
    ------------------------------------------------------- */

    border: {
        type: ControlType.Border,

        title: "Card Border",

        defaultValue: {
            borderWidth: 1,

            borderStyle: "solid",

            borderColor: "rgba(255,255,255,0.06)",
        },
    },

    hoverBorderColor: {
        type: ControlType.Color,

        title: "Hover Border",

        defaultValue: "rgba(255,60,60,0.28)",
    },

    /* -------------------------------------------------------
       TYPOGRAPHY
    ------------------------------------------------------- */

    cardTitleFont: {
        type: ControlType.Font,

        title: "Card Title Font",

        defaultValue: {
            fontSize: "21px",

            fontWeight: 600,

            lineHeight: 1.25,

            letterSpacing: "-0.025em",
        },

        defaultFontType: "sans-serif",

        defaultFontSize: "21px",

        displayFontSize: true,

        controls: "extended",
    },

    descriptionFont: {
        type: ControlType.Font,

        title: "Description Font",

        defaultValue: {
            fontSize: "15px",

            fontWeight: 400,

            lineHeight: 1.7,
        },

        defaultFontType: "sans-serif",

        defaultFontSize: "15px",

        displayFontSize: true,

        controls: "basic",
    },

    durationFont: {
        type: ControlType.Font,

        title: "Label Font",

        defaultValue: {
            fontSize: "14px",

            fontWeight: 600,

            lineHeight: 1.4,
        },

        defaultFontType: "sans-serif",

        defaultFontSize: "14px",

        displayFontSize: true,

        controls: "basic",
    },

    /* -------------------------------------------------------
       ICONS
    ------------------------------------------------------- */

    iconStyle: {
        type: ControlType.Object,

        title: "Icon Style",

        buttonTitle: "Icon Style",

        icon: "object",

        controls: {
            showIcons: {
                type: ControlType.Boolean,

                title: "Show",

                enabledTitle: "Yes",

                disabledTitle: "No",

                defaultValue: true,
            },

            iconSize: {
                type: ControlType.Number,

                title: "Size",

                min: 24,

                max: 100,

                step: 1,

                unit: "px",

                defaultValue: 52,
            },

            iconRadius: {
                type: ControlType.Number,

                title: "Radius",

                min: 0,

                max: 50,

                step: 1,

                unit: "px",

                defaultValue: 14,
            },

            iconBackground: {
                type: ControlType.Color,

                title: "Background",

                defaultValue: "rgba(255,60,60,0.08)",
            },
        },
    },

    /* -------------------------------------------------------
       CONTENT
    ------------------------------------------------------- */

    content: {
        type: ControlType.Object,

        title: "Content",

        buttonTitle: "Content",

        icon: "object",

        controls: {
            showDuration: {
                type: ControlType.Boolean,

                title: "Number / Label",

                enabledTitle: "Show",

                disabledTitle: "Hide",

                defaultValue: true,
            },
        },
    },

    /* -------------------------------------------------------
       HOVER
    ------------------------------------------------------- */

    hover: {
        type: ControlType.Object,

        title: "Hover",

        buttonTitle: "Hover",

        icon: "interact",

        controls: {
            enableHover: {
                type: ControlType.Boolean,

                title: "Effect",

                enabledTitle: "On",

                disabledTitle: "Off",

                defaultValue: true,
            },

            enableShimmer: {
                type: ControlType.Boolean,

                title: "Shimmer",

                enabledTitle: "On",

                disabledTitle: "Off",

                defaultValue: true,
            },

            hoverLift: {
                type: ControlType.Number,

                title: "Lift",

                min: 0,

                max: 24,

                step: 1,

                unit: "px",

                defaultValue: 8,
            },

            hoverGlow: {
                type: ControlType.Number,

                title: "Glow",

                min: 0,

                max: 60,

                step: 1,

                unit: "px",

                defaultValue: 20,
            },

            hoverCardBackground: {
                type: ControlType.String,

                title: "Hover Gradient",

                defaultValue:
                    "linear-gradient(145deg, #202020 0%, #121212 100%)",
            },

            hoverGlowColor: {
                type: ControlType.Color,

                title: "Hover Glow",

                defaultValue: "rgba(59,130,246,0.18)",
            },

            hoverShimmerGradient: {
                type: ControlType.String,

                title: "Hover Shimmer",

                defaultValue:
                    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 30%, rgba(255,60,60,0.16) 50%, rgba(255,255,255,0.02) 70%, transparent 100%)",
            },
        },
    },

    /* -------------------------------------------------------
       ENTRANCE
    ------------------------------------------------------- */

    entrance: {
        type: ControlType.Object,

        title: "Entrance",

        buttonTitle: "Entrance",

        icon: "interact",

        controls: {
            enableEntrance: {
                type: ControlType.Boolean,

                title: "Animation",

                enabledTitle: "On",

                disabledTitle: "Off",

                defaultValue: false,
            },

            entranceDistance: {
                type: ControlType.Number,

                title: "Distance",

                min: 0,

                max: 80,

                step: 1,

                unit: "px",

                defaultValue: 12,

                hidden(props) {
                    return props.enableEntrance === false
                },
            },

            entranceDuration: {
                type: ControlType.Number,

                title: "Duration",

                min: 0.1,

                max: 2,

                step: 0.05,

                unit: "s",

                defaultValue: 0.6,

                hidden(props) {
                    return props.enableEntrance === false
                },
            },

            entranceStagger: {
                type: ControlType.Number,

                title: "Stagger",

                min: 0,

                max: 0.3,

                step: 0.01,

                unit: "s",

                defaultValue: 0.06,

                hidden(props) {
                    return props.enableEntrance === false
                },
            },
        },
    },

    /* -------------------------------------------------------
       ACCESSIBILITY
    ------------------------------------------------------- */

    accessibility: {
        type: ControlType.Object,

        title: "Accessibility",

        buttonTitle: "Accessibility",

        icon: "object",

        controls: {
            reducedMotion: {
                type: ControlType.Boolean,

                title: "Reduce Motion",

                enabledTitle: "On",

                disabledTitle: "Off",

                defaultValue: false,
            },
        },
    },
})
