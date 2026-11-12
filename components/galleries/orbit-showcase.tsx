// Responsive elliptical orbit component with project images around centered text
// Images arranged in orbit, clickable to switch projects, scroll rotates orbit
import {
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
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


interface ProjectImage {
    image: {
        src: string
        alt: string
    }
    title: string
    link?: string
}

interface EllipticalOrbitProps {
    projects: ProjectImage[]
    centerText: string
    centerLogo?: {
        src: string
        alt: string
    }
    useLogo: boolean
    imageSize: number
    ellipseWidth: number
    ellipseHeight: number
    ellipseTilt: number
    ellipseRotation: number
    rotationSpeed: number
    snapAngle: number
    backgroundColor: string
    textColor: string
    imageBackgroundColor: string
    centerFont: any
    selectedIndex: number
    showShadow: boolean
    shadowColor: string
    shadowBlur: number
    shadowOffsetX: number
    shadowOffsetY: number
    style?: CSSProperties
}

/**
 * Elliptical Orbit Component
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
function EllipticalOrbit(props: EllipticalOrbitProps) {
    const {
        projects = [],
        centerText = "AI-native studio building brands and web experiences for high-growth startups",
        centerLogo = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Logo",
        },
        useLogo = false,
        imageSize = 140,
        ellipseWidth = 350,
        ellipseHeight = 280,
        ellipseTilt = 60,
        ellipseRotation = 0,
        rotationSpeed = 0.5,
        snapAngle = 180,
        backgroundColor = "#FFFFFF",
        textColor = "#000000",
        imageBackgroundColor = "#FFFFFF",
        centerFont,
        selectedIndex = 0,
        showShadow = true,
        shadowColor = "rgba(0,0,0,0.1)",
        shadowBlur = 12,
        shadowOffsetX = 0,
        shadowOffsetY = 4,
    } = props

    const [rotation, setRotation] = useState(0)
    const [activeIndex, setActiveIndex] = useState(selectedIndex)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [snappedIndex, setSnappedIndex] = useState<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isScrolling = useRef(false)

    const totalProjects = projects.length

    // Handle wheel event for orbit rotation
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            e.stopPropagation()

            const delta = e.deltaY * rotationSpeed * 0.5
            startTransition(() => {
                setRotation((prev) => prev + delta)
            })

            isScrolling.current = true
            const timeoutId = setTimeout(() => {
                isScrolling.current = false
            }, 150)

            return () => clearTimeout(timeoutId)
        }

        container.addEventListener("wheel", handleWheel, { passive: false })

        return () => {
            container.removeEventListener("wheel", handleWheel)
        }
    }, [rotationSpeed])

    // Calculate which image is at the snap position (left side, ~180 degrees)
    useEffect(() => {
        if (totalProjects === 0) return

        const snapAngleRad = (snapAngle * Math.PI) / 180
        let closestIndex = 0
        let minDiff = Infinity

        for (let i = 0; i < totalProjects; i++) {
            const angle =
                (i / totalProjects) * Math.PI * 2 + (rotation * Math.PI) / 180
            const normalizedAngle =
                ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
            const diff = Math.abs(normalizedAngle - snapAngleRad)
            const altDiff = Math.abs(
                normalizedAngle - snapAngleRad - Math.PI * 2
            )
            const minAngleDiff = Math.min(diff, altDiff)

            if (minAngleDiff < minDiff) {
                minDiff = minAngleDiff
                closestIndex = i
            }
        }

        // Snap threshold: if within ~20 degrees, consider it snapped
        const snapThreshold = 0.35 // radians (~20 degrees)
        if (minDiff < snapThreshold) {
            startTransition(() => {
                setSnappedIndex(closestIndex)
            })
        } else {
            startTransition(() => {
                setSnappedIndex(null)
            })
        }
    }, [rotation, totalProjects, snapAngle])

    // Handle image click
    const handleImageClick = (index: number) => {
        if (!isScrolling.current) {
            startTransition(() => {
                setActiveIndex(index)
            })
        }
    }

    // Calculate positions for images on ellipse
    const getImagePosition = (index: number, total: number) => {
        const angle = (index / total) * Math.PI * 2 + (rotation * Math.PI) / 180
        const x = Math.cos(angle) * ellipseWidth
        const y = Math.sin(angle) * ellipseHeight
        return { x, y }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
            }}
        >
            {/* Center content */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                    maxWidth: "400px",
                    textAlign: "center",
                    padding: "20px",
                }}
            >
                {useLogo && centerLogo ? (
                    <img
                        src={centerLogo.src}
                        alt={centerLogo.alt}
                        style={{
                            maxWidth: "200px",
                            maxHeight: "200px",
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    <p
                        style={{
                            margin: 0,
                            color: textColor,
                            ...centerFont,
                        }}
                    >
                        {centerText}
                    </p>
                )}
            </div>

            {/* Orbiting images */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "100%",
                    height: "100%",
                    transform: `translate(-50%, -50%) rotateX(${ellipseTilt}deg) rotateZ(${ellipseRotation}deg)`,
                    transformStyle: "preserve-3d",
                }}
            >
                {projects.map((project, index) => {
                    const { x, y } = getImagePosition(index, totalProjects)
                    const isActive = index === activeIndex
                    const isHovered = index === hoveredIndex
                    const isSnapped = index === snappedIndex

                    // Provide default image if project.image is undefined
                    const projectImage = project.image || {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Default project image",
                    }

                    const imageContent = (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                overflow: "hidden",
                                backgroundColor: imageBackgroundColor,
                                boxShadow: showShadow
                                    ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`
                                    : "none",
                                transform: isSnapped
                                    ? "scale(1.25)"
                                    : isHovered
                                      ? "scale(1.1)"
                                      : "scale(1)",
                                transition: "transform 0.3s ease",
                            }}
                        >
                            <img
                                src={projectImage.src}
                                alt={projectImage.alt || project.title}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                    )

                    const containerElement = project.link ? (
                        <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: `${imageSize}px`,
                                height: `${imageSize}px`,
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotateZ(-${ellipseRotation}deg) rotateX(-${ellipseTilt}deg)`,
                                cursor: "pointer",
                                zIndex: isActive ? 5 : 1,
                                textDecoration: "none",
                            }}
                            onClick={(e) => {
                                if (!project.link) {
                                    e.preventDefault()
                                    handleImageClick(index)
                                }
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {imageContent}
                        </a>
                    ) : (
                        <div
                            onClick={() => handleImageClick(index)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: `${imageSize}px`,
                                height: `${imageSize}px`,
                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotateZ(-${ellipseRotation}deg) rotateX(-${ellipseTilt}deg)`,
                                cursor: "pointer",
                                zIndex: isActive ? 5 : 1,
                            }}
                        >
                            {imageContent}
                        </div>
                    )

                    return <div key={index}>{containerElement}</div>
                })}
            </div>
        </div>
    )
}

addPropertyControls(EllipticalOrbit, {
    projects: {
        type: ControlType.Array,
        title: "Projects",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Project 1",
                },
                title: "Project 1",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Project 2",
                },
                title: "Project 2",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Project 3",
                },
                title: "Project 3",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Project 4",
                },
                title: "Project 4",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Project 5",
                },
                title: "Project 5",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Project 6",
                },
                title: "Project 6",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Project 7",
                },
                title: "Project 7",
            },
        ],
    },
    useLogo: {
        type: ControlType.Boolean,
        title: "Center Type",
        defaultValue: false,
        enabledTitle: "Logo",
        disabledTitle: "Text",
    },
    centerText: {
        type: ControlType.String,
        title: "Center Text",
        defaultValue: "Objects for everyday rituals",
        displayTextArea: true,
        hidden: ({ useLogo }) => useLogo,
    },
    centerLogo: {
        type: ControlType.ResponsiveImage,
        title: "Center Logo",
        hidden: ({ useLogo }) => !useLogo,
    },
    centerFont: {
        type: ControlType.Font,
        title: "Center Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        hidden: ({ useLogo }) => useLogo,
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 140,
        min: 10,
        max: 300,
        step: 10,
        unit: "px",
    },
    ellipseWidth: {
        type: ControlType.Number,
        title: "Orbit Width",
        defaultValue: 360,
        min: 10,
        max: 600,
        step: 10,
        unit: "px",
    },
    ellipseHeight: {
        type: ControlType.Number,
        title: "Orbit Height",
        defaultValue: 270,
        min: 10,
        max: 500,
        step: 10,
        unit: "px",
    },
    ellipseTilt: {
        type: ControlType.Number,
        title: "Orbit Tilt",
        defaultValue: 0,
        min: 0,
        max: 90,
        step: 5,
        unit: "deg",
    },
    ellipseRotation: {
        type: ControlType.Number,
        title: "Orbit Rotation",
        defaultValue: 30,
        min: 0,
        max: 360,
        step: 5,
        unit: "deg",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    snapAngle: {
        type: ControlType.Number,
        title: "Scale Position",
        defaultValue: 180,
        min: 0,
        max: 360,
        step: 5,
        unit: "deg",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    imageBackgroundColor: {
        type: ControlType.Color,
        title: "Image BG",
        defaultValue: "#FFFFFF",
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.1)",
        hidden: ({ showShadow }) => !showShadow,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ showShadow }) => !showShadow,
    },
    shadowOffsetX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ showShadow }) => !showShadow,
    },
    shadowOffsetY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 4,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ showShadow }) => !showShadow,
    },
    selectedIndex: {
        type: ControlType.Number,
        title: "Selected",
        defaultValue: 0,
        min: 0,
        step: 1,
        displayStepper: true,
    },
})

export default EllipticalOrbit