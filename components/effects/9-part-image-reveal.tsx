// ProjectShowcase showcase with hover effects and image blending
import { useState, startTransition, useEffect, type CSSProperties, useRef } from "react"
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
    name: string
    image: {
        src: string
        alt: string
    }
    link?: string
}

interface ProjectShowcaseProps {
    title: string
    titleColor: string
    backgroundColor: string
    projectColor: string
    hoverColor: string
    projects: Project[]
    titleFont: CSSProperties
    projectFont: CSSProperties
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
    maxWidth: number
    projectSpacing: number
    mobileThumbnailSize: number
    mobileProjectColor: string
    projectAlignment: "flex-start" | "center" | "flex-end"
    mobileVerticalAlignment: "flex-start" | "center" | "flex-end"
    mobileTitleSize: number
    mobileProjectFont: CSSProperties
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ProjectShowcase(props: ProjectShowcaseProps) {
    const {
        title,
        titleColor,
        backgroundColor,
        projectColor,
        hoverColor,
        projects,
        titleFont,
        projectFont,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        maxWidth,
        projectSpacing,
        mobileThumbnailSize,
        mobileProjectColor,
        projectAlignment,
        mobileVerticalAlignment,
        mobileTitleSize,
        mobileProjectFont,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [animationStage, setAnimationStage] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const [mobileAnimatingIndex, setMobileAnimatingIndex] = useState<number | null>(null)
    const [mobileAnimationStage, setMobileAnimationStage] = useState<{ [key: number]: number }>({})
    const projectRefs = useRef<(HTMLDivElement | null)[]>([])
    const timeoutRefs = useRef<{ [key: number]: number[] }>({})

    // Check if device is mobile using Framer's native approach
    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkMobile = () => {
                setIsMobile(window.innerWidth < 810)
            }
            
            checkMobile()
            window.addEventListener('resize', checkMobile)
            
            return () => window.removeEventListener('resize', checkMobile)
        }
    }, [])

    // Mobile scroll animation observer
    useEffect(() => {
        if (!isMobile || typeof window === "undefined") return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-index') || '0')
                        
                        // Clear any existing timeouts for this project
                        if (timeoutRefs.current[index]) {
                            timeoutRefs.current[index].forEach(timeout => clearTimeout(timeout))
                        }
                        
                        // Start animation for this project
                        setMobileAnimatingIndex(index)
                        setMobileAnimationStage(prev => ({ ...prev, [index]: 0 }))
                        
                        const timeouts: number[] = []
                        
                        // Animate each section with delay
                        for (let i = 0; i < 9; i++) {
                            const timeout = window.setTimeout(() => {
                                setMobileAnimationStage(prev => ({ ...prev, [index]: i + 1 }))
                            }, i * 70)
                            timeouts.push(timeout)
                        }
                        
                        // Show full image after all sections are revealed
                        const finalTimeout = window.setTimeout(() => {
                            setMobileAnimationStage(prev => ({ ...prev, [index]: 10 }))
                        }, 9 * 70 + 70)
                        timeouts.push(finalTimeout)
                        
                        // Store timeouts for cleanup
                        timeoutRefs.current[index] = timeouts
                    }
                })
            },
            {
                threshold: 0.5,
                rootMargin: '0px'
            }
        )

        projectRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref)
        })

        return () => {
            observer.disconnect()
            // Clear all timeouts on cleanup
            Object.values(timeoutRefs.current).forEach(timeouts => {
                timeouts.forEach(timeout => clearTimeout(timeout))
            })
            timeoutRefs.current = {}
        }
    }, [isMobile, projects.length])

    const hoveredProject = hoveredIndex !== null ? projects[hoveredIndex] : null
    const backgroundImageSrc = hoveredProject?.image?.src
    const showBackground = hoveredIndex !== null && backgroundImageSrc && !isMobile
    const isAnyProjectHovered = hoveredIndex !== null && !isMobile

    // Check if component has fixed height
    const isFixedHeight = props.style?.height === "100%" || props.style?.height === "100vh"

    // Animation sequence for 9 sections
    useEffect(() => {
        if (hoveredIndex !== null && !isMobile) {
            setAnimationStage(0)
            const timeouts: number[] = []
            
            // Animate each section with delay
            for (let i = 0; i < 9; i++) {
                const timeout = setTimeout(() => {
                    setAnimationStage(i + 1)
                }, i * 70)
                timeouts.push(timeout)
            }
            
            // Show full image after all sections are revealed
            const finalTimeout = setTimeout(() => {
                setAnimationStage(10)
            }, 9 * 70 + 70)
            timeouts.push(finalTimeout)
            
            return () => {
                timeouts.forEach(timeout => clearTimeout(timeout))
            }
        } else {
            setAnimationStage(0)
        }
    }, [hoveredIndex, isMobile])

    // Generate clip-path for each section
    const getClipPath = (sectionIndex: number, isVisible: boolean) => {
        const row = Math.floor(sectionIndex / 3)
        const col = sectionIndex % 3
        
        const x1 = (col * 100) / 3
        const y1 = (row * 100) / 3
        const x2 = ((col + 1) * 100) / 3
        const y2 = ((row + 1) * 100) / 3
        
        if (!isVisible) {
            const centerX = (x1 + x2) / 2
            const centerY = (y1 + y2) / 2
            return `polygon(${centerX}% ${centerY}%, ${centerX}% ${centerY}%, ${centerX}% ${centerY}%, ${centerX}% ${centerY}%)`
        }
        
        return `polygon(${x1}% ${y1}%, ${x2}% ${y1}%, ${x2}% ${y2}%, ${x1}% ${y2}%)`
    }

    // Mobile layout
    if (isMobile) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100vh",
                    backgroundColor,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {/* Title - Fixed at top */}
                <div
                    style={{
                        padding: `16px ${paddingRight}px 12px ${paddingLeft}px`,
                        backgroundColor,
                        zIndex: 10,
                        flexShrink: 0,
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            color: titleColor,
                            ...titleFont,
                            fontSize: `${mobileTitleSize}px`,
                        }}
                    >
                        {title}
                    </h1>
                </div>

                {/* Project Cards - Scrollable */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        overflowX: "hidden",
                        scrollSnapType: "y mandatory",
                    }}
                >
                    {projects && projects.map((project, index) => {
                        const currentStage = mobileAnimationStage[index] || 0
                        const showBackground = currentStage > 0
                        
                        return (
                            <div
                                key={index}
                                ref={(el) => (projectRefs.current[index] = el)}
                                data-index={index}
                                style={{
                                    backgroundColor: "#333333",
                                    padding: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "20px",
                                    position: "relative",
                                    overflow: "hidden",
                                    width: "100vw",
                                    height: "100vh",
                                    scrollSnapAlign: "start",
                                    cursor: project.link ? "pointer" : "default",
                                }}
                                onClick={() => {
                                    if (project.link) {
                                        window.open(project.link, "_blank")
                                    }
                                }}
                            >
                                {/* Background Image with 9 sections animation */}
                                {showBackground && (
                                    <>
                                        {currentStage < 10 ? (
                                            // Show 9 sections during animation
                                            Array.from({ length: 9 }, (_, sectionIndex) => {
                                                const isVisible = currentStage > sectionIndex
                                                return (
                                                    <div
                                                        key={sectionIndex}
                                                        style={{
                                                            position: "absolute",
                                                            top: 0,
                                                            left: 0,
                                                            width: "100%",
                                                            height: "100%",
                                                            backgroundImage: `url(${project.image?.src})`,
                                                            backgroundSize: "cover",
                                                            backgroundPosition: "center",
                                                            clipPath: getClipPath(sectionIndex, isVisible),
                                                            transition: "clip-path 0.3s ease",
                                                            pointerEvents: "none",
                                                            zIndex: 0,
                                                        }}
                                                    />
                                                )
                                            })
                                        ) : (
                                            // Show full image after animation
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    backgroundImage: `url(${project.image?.src})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                    pointerEvents: "none",
                                                    zIndex: 0,
                                                }}
                                            />
                                        )}
                                        
                                        {/* White overlay */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                                pointerEvents: "none",
                                                zIndex: 1,
                                            }}
                                        />
                                        
                                        {/* Dark overlay for better text readability */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                                pointerEvents: "none",
                                                zIndex: 1,
                                            }}
                                        />
                                    </>
                                )}
                                
                                {/* Content overlay */}
                                <div
                                    style={{
                                        position: "relative",
                                        zIndex: 2,
                                        display: "flex",
                                        alignItems: mobileVerticalAlignment,
                                        justifyContent: "center",
                                        gap: "20px",
                                        width: "100%",
                                        height: "100%",
                                    }}
                                >
                                    {/* Project Image Thumbnail */}
                                    <div
                                        style={{
                                            width: `${mobileThumbnailSize}px`,
                                            height: `${mobileThumbnailSize}px`,
                                            borderRadius: "8px",
                                            backgroundImage: `url(${project.image?.src})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            flexShrink: 0,
                                        }}
                                    />
                                    
                                    {/* Project Name and Arrow */}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flex: 1,
                                        }}
                                    >
                                        {/* Project Name */}
                                        <span
                                            style={{
                                                color: mobileProjectColor,
                                                flex: 1,
                                                ...mobileProjectFont,
                                            }}
                                        >
                                            {project.name}
                                        </span>
                                        
                                        {/* Arrow */}
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            style={{
                                                flexShrink: 0,
                                            }}
                                        >
                                            <path
                                                d="M5 12h14m-7-7l7 7-7 7"
                                                stroke={mobileProjectColor}
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Desktop layout
    return (
        <div
            style={{
                width: "100%",
                height: isFixedHeight ? "100%" : "auto",
                minHeight: isFixedHeight ? "100%" : "500px",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
            }}
        >
            {/* Background Image with 9 sections */}
            {showBackground && (
                <>
                    {animationStage < 10 ? (
                        // Show 9 sections during animation
                        Array.from({ length: 9 }, (_, index) => {
                            const isVisible = animationStage > index
                            return (
                                <div
                                    key={index}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        backgroundImage: `url(${backgroundImageSrc})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        clipPath: getClipPath(index, isVisible),
                                        transition: "clip-path 0.3s ease",
                                        pointerEvents: "none",
                                        zIndex: 0,
                                    }}
                                />
                            )
                        })
                    ) : (
                        // Show full image after animation
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundImage: `url(${backgroundImageSrc})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                pointerEvents: "none",
                                zIndex: 0,
                            }}
                        />
                    )}
                </>
            )}

            {/* Overlay for better text readability */}
            {showBackground && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        transition: "opacity 0.3s ease",
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                />
            )}

            {/* Content wrapper with max-width */}
            <div
                style={{
                    width: "100%",
                    maxWidth: `${maxWidth}px`,
                    height: "100%",
                    padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    zIndex: 2,
                }}
            >
                {/* Title */}
                <h1
                    style={{
                        margin: 0,
                        color: titleColor,
                        opacity: isAnyProjectHovered ? 0 : 1,
                        transition: "opacity 0.3s ease",
                        ...titleFont,
                    }}
                >
                    {title}
                </h1>

                {/* Content wrapper for better spacing control */}
                <div
                    style={{
                        flex: isFixedHeight ? 1 : "none",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: projectAlignment,
                        position: "relative",
                        minHeight: isFixedHeight ? "auto" : "300px",
                    }}
                >
                    {/* Project List */}
                    <div
                        style={{
                            position: isFixedHeight ? "relative" : "relative",
                            bottom: isFixedHeight ? "auto" : "auto",
                            right: isFixedHeight ? "0" : "0",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: `${projectSpacing}px`,
                            marginTop: isFixedHeight ? "0" : projectAlignment === "flex-start" ? "60px" : "0",
                            alignSelf: "flex-end",
                        }}
                    >
                        {projects && projects.map((project, index) => {
                            const isHovered = hoveredIndex === index
                            const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index

                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        opacity: isOtherHovered ? 0.6 : 1,
                                    }}
                                    onMouseEnter={() => startTransition(() => setHoveredIndex(index))}
                                    onMouseLeave={() => startTransition(() => setHoveredIndex(null))}
                                    onClick={() => {
                                        if (project.link) {
                                            window.open(project.link, "_blank")
                                        }
                                    }}
                                >
                                    <span
                                        style={{
                                            color: isHovered ? hoverColor : (isOtherHovered ? "#FFFFFF" : projectColor),
                                            transition: "color 0.3s ease",
                                            textShadow: isOtherHovered ? "2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.5)" : "none",
                                            fontWeight: isOtherHovered ? "600" : "normal",
                                            ...projectFont,
                                        }}
                                    >
                                        {project.name}
                                    </span>
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        style={{
                                            opacity: isHovered ? 1 : 0,
                                            transform: isHovered ? "translateX(0)" : "translateX(-8px)",
                                            transition: "all 0.3s ease",
                                        }}
                                    >
                                        <path
                                            d="M5 12h14m-7-7l7 7-7 7"
                                            stroke={hoverColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ProjectShowcase, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Projects",
    },
    projects: {
        type: ControlType.Array,
        title: "Projects",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Project Name",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                    placeholder: "https://example.com",
                },
            },
        },
        defaultValue: [
            {
                name: "Spring Photography",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Spring Photography",
                },
            },
            {
                name: "Summer Photography",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Summer Photography",
                },
            },
            {
                name: "Autumn Photography",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Autumn Photography",
                },
            },
            {
                name: "Winter Photography",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Winter Photography",
                },
            },
        ],
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FF5733",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    projectColor: {
        type: ControlType.Color,
        title: "Project Text Color",
        defaultValue: "#000000",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Project Hover Color",
        defaultValue: "#FF5733",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    projectFont: {
        type: ControlType.Font,
        title: "Project Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1200,
        min: 300,
        max: 2000,
        step: 10,
        unit: "px",
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    paddingRight: {
        type: ControlType.Number,
        title: "Padding Right",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Padding Left",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    projectAlignment: {
        type: ControlType.Enum,
        title: "Project Alignment",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "flex-end",
        displaySegmentedControl: true,
    },
    projectSpacing: {
        type: ControlType.Number,
        title: "Project Spacing",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    mobileThumbnailSize: {
        type: ControlType.Number,
        title: "Mobile Thumbnail",
        defaultValue: 80,
        min: 40,
        max: 200,
        step: 5,
        unit: "px",
    },
    mobileVerticalAlignment: {
        type: ControlType.Enum,
        title: "Mobile Project Alignment",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    mobileProjectColor: {
        type: ControlType.Color,
        title: "Mobile Project Text",
        defaultValue: "#FFFFFF",
    },
    mobileTitleSize: {
        type: ControlType.Number,
        title: "Mobile Title Size",
        defaultValue: 32,
        min: 16,
        max: 80,
        step: 1,
        unit: "px",
    },
    mobileProjectFont: {
        type: ControlType.Font,
        title: "Mobile Project Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
})