// Create a project list with cursor-following images on hover
import { useState, useRef, type CSSProperties } from "react"
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

interface Project {
    title: string
    description: string
    image: {
        src: string
        srcSet?: string
        alt?: string
    }
    video: string
    mediaType: "image" | "video"
    link?: string
    linkType?: "page" | "external"
    mediaHeight: number
    mediaRadius: number
}

interface ProjectListProps {
    projects: Project[]
    backgroundColor: string
    defaultTextColor: string
    hoverTextColor: string
    titleFont: CSSProperties
    descriptionFont: CSSProperties
    borderColor: string
    hoverShift: number
    animationDuration: number
    animationBounce: number
    mediaScale: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ProjectList(props: ProjectListProps) {
    const {
        projects = [
            {
                title: "Chrysanthemum",
                description: "blue",
                link: "",
                linkType: "external",
                image: {
                    src: "https://framerusercontent.com/images/P3DqTZwtrTPuDTttJ9NqB96nB0.png",
                    alt: "Chrysanthemum",
                },
                video: "",
                mediaType: "image",
                mediaHeight: 300,
                mediaRadius: 8,
            },
            {
                title: "Cherry Blossom",
                description: "pink",
                link: "",
                linkType: "external",
                image: {
                    src: "https://framerusercontent.com/images/HHN9x7PHgtwDHFtoY7xdNEDZ8s.png",
                    alt: "Cherry Blossom",
                },
                video: "",
                mediaType: "image",
                mediaHeight: 300,
                mediaRadius: 8,
            },
        ],
        backgroundColor = "#FFFFFF",
        defaultTextColor = "#CCCCCC",
        hoverTextColor = "#000000",
        titleFont,
        descriptionFont,
        borderColor = "#EEEEEE",
        hoverShift = 20,
        animationDuration = 0.2,
        animationBounce = 0.3,
        mediaScale = 1,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "visible",
                position: "relative",
            }}
        >
            {projects.map((project, index) => {
                const isHovered = hoveredIndex === index

                return (
                    <div
                        key={index}
                        style={{
                            position: "relative",
                            borderBottom: `1px solid ${borderColor}`,
                            cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                            setHoveredIndex(index)
                            setMousePos({ x: e.clientX, y: e.clientY })
                        }}
                        onMouseMove={(e) => {
                            if (isHovered) {
                                setMousePos({ x: e.clientX, y: e.clientY })
                            }
                        }}
                        onMouseLeave={() => {
                            setHoveredIndex(null)
                        }}
                        onClick={() => {
                            if (project.link) {
                                if (project.linkType === "page") {
                                    window.location.href = project.link
                                } else {
                                    window.open(project.link, "_blank", "noopener,noreferrer")
                                }
                            }
                        }}
                    >
                        <motion.div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "60px 40px",
                                position: "relative",
                            }}
                            animate={{
                                x: isHovered ? hoverShift : 0,
                            }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    ...titleFont,
                                    color: isHovered ? hoverTextColor : defaultTextColor,
                                    transition: "color 0.3s ease",
                                }}
                            >
                                {project.title}
                            </h2>
                            <p
                                style={{
                                    margin: 0,
                                    ...descriptionFont,
                                    color: isHovered ? hoverTextColor : defaultTextColor,
                                    transition: "color 0.3s ease",
                                }}
                            >
                                {project.description}
                            </p>
                        </motion.div>
                    </div>
                )
            })}

            {hoveredIndex !== null && (
                <div
                    style={{
                        position: "fixed",
                        left: mousePos.x,
                        top: mousePos.y,
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        zIndex: 9999,
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: mediaScale }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                            duration: animationDuration,
                            type: "spring",
                            bounce: animationBounce,
                        }}
                        style={{
                            width: "auto",
                            height: projects[hoveredIndex].mediaHeight,
                        }}
                    >
                        {projects[hoveredIndex].mediaType === "video" ? (
                            <video
                                src={projects[hoveredIndex].video}
                                style={{
                                    width: "auto",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: projects[hoveredIndex].mediaRadius,
                                    display: "block",
                                }}
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                        ) : (
                            projects[hoveredIndex].image && (
                                <img
                                    src={projects[hoveredIndex].image.src}
                                    srcSet={projects[hoveredIndex].image.srcSet}
                                    alt={projects[hoveredIndex].image.alt}
                                    style={{
                                        width: "auto",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: projects[hoveredIndex].mediaRadius,
                                        display: "block",
                                    }}
                                />
                            )
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(ProjectList, {
    projects: {
        type: ControlType.Array,
        title: "Projects",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project Name",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Design & Development",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                linkType: {
                    type: ControlType.Enum,
                    title: "Link Type",
                    options: ["page", "external"],
                    optionTitles: ["Framer Page", "External"],
                    defaultValue: "external",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: ({ mediaType }) => mediaType === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "mov", "webm"],
                    hidden: ({ mediaType }) => mediaType === "image",
                },
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                mediaHeight: {
                    type: ControlType.Number,
                    title: "Media Height",
                    defaultValue: 300,
                    min: 150,
                    max: 600,
                    step: 10,
                    unit: "px",
                },
                mediaRadius: {
                    type: ControlType.Number,
                    title: "Corner Radius",
                    defaultValue: 8,
                    min: 0,
                    max: 50,
                    step: 1,
                    unit: "px",
                },
            },
        },
        defaultValue: [
            {
                title: "Chrysanthemum",
                description: "blue",
                link: "",
                linkType: "external",
                image: {
                    src: "https://framerusercontent.com/images/P3DqTZwtrTPuDTttJ9NqB96nB0.png",
                    alt: "Chrysanthemum",
                },
                video: "",
                mediaType: "image",
                mediaHeight: 300,
                mediaRadius: 8,
            },
            {
                title: "Cherry Blossom",
                description: "pink",
                link: "",
                linkType: "external",
                image: {
                    src: "https://framerusercontent.com/images/HHN9x7PHgtwDHFtoY7xdNEDZ8s.png",
                    alt: "Cherry Blossom",
                },
                video: "",
                mediaType: "image",
                mediaHeight: 300,
                mediaRadius: 8,
            },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    defaultTextColor: {
        type: ControlType.Color,
        title: "Default Text",
        defaultValue: "#CCCCCC",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#000000",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#EEEEEE",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "80px",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.4em",
        },
    },
    hoverShift: {
        type: ControlType.Number,
        title: "Hover Shift",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.2,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    animationBounce: {
        type: ControlType.Number,
        title: "Animation Bounce",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },
    mediaScale: {
        type: ControlType.Number,
        title: "Media Scale",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.1,
    },
})