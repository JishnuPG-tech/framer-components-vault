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


/**
 * Responsive Portfolio Hero
 * - Desktop: hover/focus a project to crossfade its background. Click to visit.
 * - Tablet/phone: vertical scroll-snap slides with a stationary title and counter.
 * - The breakpoint is based on the COMPONENT width, not the browser width.
 * - A site menu/header is intentionally excluded; layer your own navigation over the hero.
 */

type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
}

type Project = {
    title: string
    year?: string
    category?: string
    image?: ResponsiveImage
    position?: string
    link?: string
}

type Props = {
    projects?: Project[]
    defaultImage?: ResponsiveImage
    defaultImagePosition?: string
    desktopBreakpoint?: number
    backgroundColor?: string
    // Tablet / phone (the original component's settings)
    titleSize?: number
    yearSize?: number
    bottomPadding?: number
    sidePadding?: number
    counterLineHeight?: number
    textColor?: string
    showCounter?: boolean
    titleFont?: React.CSSProperties
    yearFont?: React.CSSProperties
    counterFont?: React.CSSProperties
    mobileOverlayOpacity?: number
    // Desktop (desktopShowYear / desktopShowCategory also control tablet / phone)
    desktopTitleSize?: number
    desktopMetaSize?: number
    desktopSidePadding?: number
    desktopBottomPadding?: number
    desktopItemGap?: number
    desktopIdleOpacity?: number
    desktopShowYear?: boolean
    desktopShowCategory?: boolean
    desktopOverlayOpacity?: number
    desktopTransition?: number
    desktopTitleFont?: React.CSSProperties
    desktopMetaFont?: React.CSSProperties
    style?: React.CSSProperties
}

const defaultProjects: Project[] = [
    { title: "Giấc Ngủ Việt", year: "2026", category: "Branding" },
    { title: "Rubaby", year: "2026", category: "Branding / UI" },
    { title: "RemeDAO", year: "2026", category: "Digital Design" },
    { title: "bWorker", year: "2026", category: "Web Design" },
    { title: "Project Five", year: "2026", category: "Selected Work" },
]

const fallbackTitleFont: React.CSSProperties = {
    fontFamily: '"Overused Grotesk", Arial, sans-serif',
    fontWeight: 600,
}
const fallbackMetaFont: React.CSSProperties = {
    fontFamily: '"Overused Grotesk", Arial, sans-serif',
    fontWeight: 500,
}

function HeroImage({
    image,
    position,
    eager = false,
}: {
    image?: ResponsiveImage
    position?: string
    eager?: boolean
}) {
    if (!image?.src) return null

    return (
        <img
            src={image.src}
            srcSet={image.srcSet}
            alt=""
            aria-hidden="true"
            draggable={false}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            style={{
                position: "absolute",
                inset: 0,
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: position || "center center",
                pointerEvents: "none",
                userSelect: "none",
            }}
        />
    )
}

/** Use element width so this works inside Framer components of any size. */
function useElementWidth(ref: React.RefObject<HTMLDivElement>) {
    const [width, setWidth] = React.useState(0)

    React.useEffect(() => {
        const element = ref.current
        if (!element) return

        const measure = () => setWidth(element.getBoundingClientRect().width)
        measure()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) setWidth(entry.contentRect.width)
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [ref])

    return width
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 */
export default function ResponsivePortfolioHero(props: Props) {
    const projects = props.projects?.length ? props.projects : defaultProjects
    const rootRef = React.useRef<HTMLDivElement>(null)
    const width = useElementWidth(rootRef)
    const breakpoint = props.desktopBreakpoint ?? 900
    // On initial render, show the existing mobile layout until actual width is known.
    const isDesktop = width >= breakpoint
    const backgroundColor = props.backgroundColor ?? "#141414"
    const textColor = props.textColor ?? "#FFFFFF"

    const titleFont = props.titleFont ?? fallbackTitleFont
    const yearFont = props.yearFont ?? fallbackMetaFont
    const counterFont = props.counterFont ?? fallbackMetaFont
    const desktopTitleFont = props.desktopTitleFont ?? fallbackTitleFont
    const desktopMetaFont = props.desktopMetaFont ?? fallbackMetaFont

    // ---------------------------------------
    // Desktop background interaction
    // ---------------------------------------
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
    const defaultImage = props.defaultImage?.src
        ? props.defaultImage
        : projects.find((project) => project.image?.src)?.image
    const desktopTransition = Math.max(0, props.desktopTransition ?? 0.5)
    const fadeStyle = `opacity ${desktopTransition}s ease-in-out`

    // ---------------------------------------
    // Tablet/phone vertical scroller
    // ---------------------------------------
    const scrollerRef = React.useRef<HTMLDivElement>(null)
    const settleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const [activeIndex, setActiveIndex] = React.useState(0)
    const visibleIndex = Math.min(Math.max(activeIndex, 0), projects.length - 1)
    const currentProject = projects[visibleIndex]
    // Shared visibility settings across desktop and tablet/phone.
    // Reuse existing desktop keys so saved Framer instance settings carry over.
    const showYear = props.desktopShowYear ?? false
    const showCategory = props.desktopShowCategory ?? true
    const mobileMeta = [
        showYear ? currentProject?.year : undefined,
        showCategory ? currentProject?.category : undefined,
    ]
        .filter(Boolean)
        .join(" · ")

    const updateActiveFromScroll = React.useCallback(() => {
        const element = scrollerRef.current
        if (!element || element.clientHeight <= 0) return
        const index = Math.max(
            0,
            Math.min(
                projects.length - 1,
                Math.round(element.scrollTop / element.clientHeight)
            )
        )
        setActiveIndex(index)
    }, [projects.length])

    const handleScroll = React.useCallback(() => {
        if (settleTimer.current !== null) clearTimeout(settleTimer.current)
        settleTimer.current = setTimeout(updateActiveFromScroll, 120)
    }, [updateActiveFromScroll])

    React.useEffect(() => {
        const scroller = scrollerRef.current
        if (!scroller || isDesktop) return

        scroller.addEventListener("scrollend", updateActiveFromScroll)
        return () => {
            scroller.removeEventListener("scrollend", updateActiveFromScroll)
            if (settleTimer.current !== null) {
                clearTimeout(settleTimer.current)
                settleTimer.current = null
            }
        }
    }, [isDesktop, updateActiveFromScroll])

    // A fresh mobile scroller starts at the first slide after changing modes.
    React.useEffect(() => {
        if (!isDesktop) setActiveIndex(0)
    }, [isDesktop])

    const mobileTitleStyle: React.CSSProperties = {
        ...titleFont,
        fontSize: props.titleSize ?? 46,
        lineHeight: 1.06,
        letterSpacing: "-0.04em",
        textTransform: "none",
        overflowWrap: "break-word",
        margin: 0,
        display: "block",
        color: textColor,
    }

    const desktopRowStyle: React.CSSProperties = {
        position: "relative",
        display: "flex",
        alignItems: "baseline",
        flexWrap: "wrap",
        gap: "4px 20px",
        width: "fit-content",
        maxWidth: "100%",
        padding: "2px 0",
        color: textColor,
        background: "transparent",
        border: "none",
        borderRadius: 0,
        textDecoration: "none",
        textAlign: "left",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        outlineOffset: 5,
    }

    return (
        <div
            ref={rootRef}
            onMouseLeave={isDesktop ? () => setHoveredIndex(null) : undefined}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: backgroundColor,
                isolation: "isolate",
            }}
        >
            {isDesktop ? (
                <>
                    {/* Persistent default background when no project is hovered. */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                        }}
                    >
                        <HeroImage
                            image={defaultImage}
                            position={
                                props.defaultImagePosition ?? "center center"
                            }
                            eager
                        />
                    </div>

                    {/* Each image fades independently instead of jumping on hover. */}
                    {projects.map((project, index) => (
                        <div
                            key={`desktop-image-${index}`}
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity:
                                    hoveredIndex === index && project.image?.src
                                        ? 1
                                        : 0,
                                transition: fadeStyle,
                                pointerEvents: "none",
                            }}
                        >
                            <HeroImage
                                image={project.image}
                                position={project.position}
                                eager={index === 0}
                            />
                        </div>
                    ))}

                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(90deg, rgba(0,0,0,${props.desktopOverlayOpacity ?? 0.42}) 0%, transparent 80%)`,
                            pointerEvents: "none",
                        }}
                    />

                    {/* Text stays in place while the background changes. */}
                    <nav
                        aria-label="Selected projects"
                        onBlur={(event) => {
                            // Keep keyboard focus hover until it leaves the entire list.
                            if (
                                !event.currentTarget.contains(
                                    event.relatedTarget as Node
                                )
                            ) {
                                setHoveredIndex(null)
                            }
                        }}
                        style={{
                            position: "absolute",
                            left: props.desktopSidePadding ?? 32,
                            right: props.desktopSidePadding ?? 32,
                            bottom: props.desktopBottomPadding ?? 32,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: props.desktopItemGap ?? 8,
                            maxHeight: `calc(100% - ${(props.desktopBottomPadding ?? 32) + 24}px)`,
                            overflowY: "auto",
                            overflowX: "hidden",
                            scrollbarWidth: "none",
                        }}
                    >
                        {projects.map((project, index) => {
                            const opacity =
                                hoveredIndex === null
                                    ? (props.desktopIdleOpacity ?? 0.78)
                                    : hoveredIndex === index
                                      ? 1
                                      : (props.desktopIdleOpacity ?? 0.78) * 0.4
                            const commonProps = {
                                onMouseEnter: () => setHoveredIndex(index),
                                onMouseLeave: () => setHoveredIndex(null),
                                onFocus: () => setHoveredIndex(index),
                                style: {
                                    ...desktopRowStyle,
                                    opacity,
                                    transition: "opacity 180ms ease",
                                } as React.CSSProperties,
                            }
                            const content = (
                                <>
                                    <span
                                        style={{
                                            ...desktopTitleFont,
                                            fontSize:
                                                props.desktopTitleSize ?? 64,
                                            lineHeight: 1.08,
                                            letterSpacing: "-0.04em",
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {project.title}
                                    </span>
                                    {(showYear && project.year) ||
                                    (showCategory && project.category) ? (
                                        <span
                                            style={{
                                                ...desktopMetaFont,
                                                fontSize:
                                                    props.desktopMetaSize ?? 15,
                                                lineHeight: 1.3,
                                                letterSpacing: "-0.01em",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {showYear ? project.year : ""}
                                            {showCategory && project.category
                                                ? `${showYear && project.year ? " · " : ""}${project.category}`
                                                : ""}
                                        </span>
                                    ) : null}
                                </>
                            )

                            return project.link ? (
                                <a
                                    key={`desktop-project-${index}`}
                                    {...commonProps}
                                    href={project.link}
                                >
                                    {content}
                                </a>
                            ) : (
                                <button
                                    key={`desktop-project-${index}`}
                                    {...commonProps}
                                    type="button"
                                    onClick={() => setHoveredIndex(index)}
                                >
                                    {content}
                                </button>
                            )
                        })}
                    </nav>
                </>
            ) : (
                <>
                    {/* Slides are scrollable; the text overlay below never moves. */}
                    <div
                        ref={scrollerRef}
                        onScroll={handleScroll}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            overflowY: "auto",
                            overflowX: "hidden",
                            scrollSnapType: "y mandatory",
                            WebkitOverflowScrolling: "touch",
                            overscrollBehaviorY: "auto",
                            touchAction: "pan-y",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                        }}
                    >
                        {projects.map((project, index) => (
                            <section
                                key={`mobile-slide-${index}`}
                                aria-label={project.title}
                                style={{
                                    position: "relative",
                                    flex: "0 0 100%",
                                    width: "100%",
                                    height: "100%",
                                    minHeight: 0,
                                    overflow: "hidden",
                                    scrollSnapAlign: "start",
                                    scrollSnapStop: "always",
                                    background:
                                        "linear-gradient(145deg, #6a6661, #22242b)",
                                }}
                            >
                                <HeroImage
                                    image={
                                        project.image?.src
                                            ? project.image
                                            : defaultImage
                                    }
                                    position={project.position}
                                    eager={index === 0}
                                />
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: `linear-gradient(0deg, rgba(0,0,0,${props.mobileOverlayOpacity ?? 0.48}), transparent 65%)`,
                                        pointerEvents: "none",
                                    }}
                                />
                            </section>
                        ))}
                    </div>

                    {/* Stationary overlay: the mobile title changes after scroll settles. */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            pointerEvents: "none",
                            color: textColor,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: props.sidePadding ?? 18,
                                right: (props.sidePadding ?? 18) + 50,
                                bottom: `calc(${props.bottomPadding ?? 38}px + env(safe-area-inset-bottom, 0px))`,
                            }}
                        >
                            {currentProject?.link ? (
                                <a
                                    href={currentProject.link}
                                    style={{
                                        ...mobileTitleStyle,
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        pointerEvents: "auto",
                                    }}
                                >
                                    {currentProject.title}
                                </a>
                            ) : (
                                <div style={mobileTitleStyle}>
                                    {currentProject?.title}
                                </div>
                            )}

                            {mobileMeta && (
                                <div
                                    style={{
                                        ...yearFont,
                                        fontSize: props.yearSize ?? 18,
                                        lineHeight: 1.2,
                                        letterSpacing: "-0.01em",
                                        textTransform: "none",
                                        marginTop: 8,
                                    }}
                                >
                                    {mobileMeta}
                                </div>
                            )}
                        </div>

                        {(props.showCounter ?? true) && (
                            <div
                                aria-label={`Project ${visibleIndex + 1} of ${projects.length}`}
                                style={{
                                    position: "absolute",
                                    right: props.sidePadding ?? 18,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 15,
                                    ...counterFont,
                                    fontSize: 18,
                                    lineHeight: 1,
                                    fontVariantNumeric: "tabular-nums",
                                    textTransform: "none",
                                }}
                            >
                                <span>{visibleIndex + 1}</span>
                                <div
                                    aria-hidden="true"
                                    style={{
                                        width: 1,
                                        height: props.counterLineHeight ?? 100,
                                        flexShrink: 0,
                                        background: textColor,
                                        opacity: 0.9,
                                    }}
                                />
                                <span>{projects.length}</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

ResponsivePortfolioHero.defaultProps = {
    projects: defaultProjects,
    desktopBreakpoint: 900,
    backgroundColor: "#141414",
    textColor: "#FFFFFF",
    titleSize: 46,
    yearSize: 18,
    bottomPadding: 38,
    sidePadding: 18,
    counterLineHeight: 100,
    showCounter: true,
    titleFont: { fontFamily: "Overused Grotesk", fontWeight: 600 },
    yearFont: { fontFamily: "Overused Grotesk", fontWeight: 500 },
    counterFont: { fontFamily: "Overused Grotesk", fontWeight: 500 },
    mobileOverlayOpacity: 0.48,
    desktopTitleSize: 64,
    desktopMetaSize: 15,
    desktopSidePadding: 32,
    desktopBottomPadding: 32,
    desktopItemGap: 8,
    desktopIdleOpacity: 0.78,
    desktopShowYear: false,
    desktopShowCategory: true,
    desktopOverlayOpacity: 0.42,
    desktopTransition: 0.5,
    desktopTitleFont: { fontFamily: "Overused Grotesk", fontWeight: 600 },
    desktopMetaFont: { fontFamily: "Overused Grotesk", fontWeight: 500 },
}

addPropertyControls(ResponsivePortfolioHero, {
    projects: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                year: { type: ControlType.String, title: "Year" },
                category: { type: ControlType.String, title: "Category" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                position: {
                    type: ControlType.Enum,
                    title: "Image Crop",
                    options: [
                        "center center",
                        "center top",
                        "center bottom",
                        "left center",
                        "right center",
                    ],
                    optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],
                    defaultValue: "center center",
                },
                link: { type: ControlType.Link, title: "Case Study" },
            },
        },
        defaultValue: defaultProjects,
    },
    // Shared visibility toggles for desktop, tablet and phone.
    // Keep property identifiers for backward compatibility with existing Framer instances.
    desktopShowYear: {
        type: ControlType.Boolean,
        title: "Show Year",
        defaultValue: false,
    },
    desktopShowCategory: {
        type: ControlType.Boolean,
        title: "Show Category",
        defaultValue: true,
    },
    defaultImage: {
        type: ControlType.ResponsiveImage,
        title: "Default Image",
    },
    defaultImagePosition: {
        type: ControlType.Enum,
        title: "Default Crop",
        options: [
            "center center",
            "center top",
            "center bottom",
            "left center",
            "right center",
        ],
        optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],
        defaultValue: "center center",
    },
    desktopBreakpoint: {
        type: ControlType.Number,
        title: "Desktop From",
        defaultValue: 900,
        min: 600,
        max: 1440,
        step: 10,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#141414",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    // Desktop settings
    desktopTitleSize: {
        type: ControlType.Number,
        title: "Desktop Title",
        defaultValue: 64,
        min: 18,
        max: 160,
        step: 1,
    },
    desktopMetaSize: {
        type: ControlType.Number,
        title: "Desktop Meta",
        defaultValue: 15,
        min: 10,
        max: 40,
        step: 1,
    },
    desktopSidePadding: {
        type: ControlType.Number,
        title: "Desktop Sides",
        defaultValue: 32,
        min: 0,
        max: 240,
        step: 1,
    },
    desktopBottomPadding: {
        type: ControlType.Number,
        title: "Desktop Bottom",
        defaultValue: 32,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
    },
    desktopItemGap: {
        type: ControlType.Number,
        title: "Desktop Gap",
        defaultValue: 8,
        min: 0,
        max: 80,
        step: 1,
    },
    desktopIdleOpacity: {
        type: ControlType.Number,
        title: "Idle Text",
        defaultValue: 0.78,
        min: 0,
        max: 1,
        step: 0.05,
    },
    desktopOverlayOpacity: {
        type: ControlType.Number,
        title: "Desktop Overlay",
        defaultValue: 0.42,
        min: 0,
        max: 1,
        step: 0.05,
    },
    desktopTransition: {
        type: ControlType.Number,
        title: "Fade Duration",
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    desktopTitleFont: {
        type: ControlType.Font,
        title: "Desktop Font",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Overused Grotesk",
            fontWeight: 600,
            fontSize: 64,
        },
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
    },
    desktopMetaFont: {
        type: ControlType.Font,
        title: "Desktop Meta Font",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Overused Grotesk",
            fontWeight: 500,
            fontSize: 15,
        },
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
    },
    // Tablet / phone settings (kept backward-compatible with your original)
    titleSize: {
        type: ControlType.Number,
        title: "Mobile Title",
        defaultValue: 46,
        min: 18,
        max: 84,
        step: 1,
    },
    yearSize: {
        type: ControlType.Number,
        title: "Mobile Meta Size",
        defaultValue: 18,
        min: 10,
        max: 32,
        step: 1,
    },
    bottomPadding: {
        type: ControlType.Number,
        title: "Bottom Gap",
        defaultValue: 38,
        min: 0,
        max: 140,
        step: 1,
    },
    sidePadding: {
        type: ControlType.Number,
        title: "Mobile Sides",
        defaultValue: 18,
        min: 0,
        max: 80,
        step: 1,
    },
    counterLineHeight: {
        type: ControlType.Number,
        title: "Counter Line",
        defaultValue: 100,
        min: 20,
        max: 260,
        step: 1,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
    },
    mobileOverlayOpacity: {
        type: ControlType.Number,
        title: "Mobile Overlay",
        defaultValue: 0.48,
        min: 0,
        max: 1,
        step: 0.05,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Mobile Title Font",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Overused Grotesk",
            fontWeight: 600,
            fontSize: 46,
        },
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
    },
    yearFont: {
        type: ControlType.Font,
        title: "Mobile Meta Font",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Overused Grotesk",
            fontWeight: 500,
            fontSize: 18,
        },
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
    },
    counterFont: {
        type: ControlType.Font,
        title: "Counter Font",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Overused Grotesk",
            fontWeight: 500,
            fontSize: 18,
        },
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
    },
})
