import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion } from "framer-motion"

function iconDataUri(paths) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#141414" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const ICON_IDENTITY = iconDataUri(
    `<circle cx='9' cy='12' r='6'/><circle cx='15' cy='12' r='6'/>`
)
const ICON_EDITORIAL = iconDataUri(
    `<rect x='5' y='3' width='14' height='18' rx='2'/><line x1='8' y1='8' x2='16' y2='8'/><line x1='8' y1='12' x2='16' y2='12'/><line x1='8' y1='16' x2='13' y2='16'/>`
)
const ICON_MOBILE = iconDataUri(
    `<rect x='7' y='2' width='10' height='20' rx='2'/><line x1='11' y1='18' x2='13' y2='18'/>`
)
const ICON_ART = iconDataUri(
    `<rect x='3' y='7' width='18' height='12' rx='2'/><rect x='9' y='4' width='6' height='3' rx='1'/><circle cx='12' cy='13' r='3.5'/>`
)
const ICON_ECOMMERCE = iconDataUri(
    `<rect x='5' y='8' width='14' height='12' rx='2'/><path d='M9 8V6a3 3 0 0 1 6 0v2'/>`
)
const ICON_CAMPAIGN = iconDataUri(
    `<path d='M3 10v4h3l6 4V6l-6 4H3z'/><path d='M15 9a3 3 0 0 1 0 6'/>`
)

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 500
 */
export default function ShowcaseFlow(props) {
    const {
        projects,
        showMetadata,
        showIcons,
        iconSize,
        contentWidth,
        rowHeight,
        rowGap,
        horizontalPadding,
        verticalPadding,
        imageWidth,
        imageHeight,
        imageOffsetX,
        imageOffsetY,
        imageRadius,
        imageScale,
        imageFit,
        imagePosition,
        imageShadow,
        imageBorder,
        revealSpeed,
        exitSpeed,
        cursorFollow,
        followStrength,
        rotationMax,
        hoverScale,
        enterBlur,
        exitBlur,
        imageTrail,
        reduceMotion,
        backgroundColor,
        textColor,
        secondaryTextColor,
        inactiveTextColor,
        dividerColor,
        activeTextColor,
        arrowColor,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef(null)
    const stackIdRef = useRef(0)
    const lastXRef = useRef(0)

    const [isCoarsePointer, setIsCoarsePointer] = useState(false)
    const [activeIndex, setActiveIndex] = useState(isStatic ? 0 : null)
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const [rotation, setRotation] = useState(0)
    const [stack, setStack] = useState(
        isStatic
            ? [{ id: 0, index: 0, live: true, x: 0, y: 0, rotation: 0 }]
            : []
    )

    const docked = isStatic || isCoarsePointer || reduceMotion
    const followEnabled = cursorFollow && !docked

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const mq = window.matchMedia("(pointer: coarse)")
        setIsCoarsePointer(mq.matches)
        function handler(e) {
            setIsCoarsePointer(e.matches)
        }
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [isStatic])

    function handleContainerMove(e) {
        if (docked) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        if (followEnabled && rotationMax > 0) {
            const dx = x - lastXRef.current
            const r = Math.max(-rotationMax, Math.min(rotationMax, dx * 0.8))
            setRotation(r)
        }
        lastXRef.current = x
        setPos({ x: x + imageOffsetX, y: y + imageOffsetY })
    }

    function activateProject(index) {
        setActiveIndex(index)

        if (docked) {
            setStack([
                {
                    id: stackIdRef.current++,
                    index,
                    live: true,
                    x: 0,
                    y: 0,
                    rotation: 0,
                },
            ])
            return
        }

        if (imageTrail) {
            setStack((prev) => {
                const frozen = prev.map((item) => ({ ...item, live: false }))
                const trimmed = frozen.slice(-2)
                return [
                    ...trimmed,
                    {
                        id: stackIdRef.current++,
                        index,
                        live: true,
                        x: pos.x,
                        y: pos.y,
                        rotation,
                    },
                ]
            })
        } else {
            setStack([
                {
                    id: stackIdRef.current++,
                    index,
                    live: true,
                    x: pos.x,
                    y: pos.y,
                    rotation,
                },
            ])
        }
    }

    function deactivate() {
        setActiveIndex(null)
        setStack((prev) => {
            const frozen = prev.map((item) => ({ ...item, live: false }))
            const id = frozen.length ? frozen[frozen.length - 1].id : null
            if (id !== null) {
                setTimeout(
                    () => {
                        setStack((s) => s.filter((item) => item.id !== id))
                    },
                    (exitSpeed || 0.25) * 1000 + 60
                )
            }
            return frozen
        })
    }

    function handleRowEnter(index) {
        if (isStatic || docked) return
        activateProject(index)
    }

    function handleRowLeave() {
        if (isStatic || docked) return
        deactivate()
    }

    function handleRowTap(index) {
        if (isStatic) return
        if (!docked) return
        if (activeIndex === index) {
            setActiveIndex(null)
            setStack([])
        } else {
            activateProject(index)
        }
    }

    const shadowValue =
        imageShadow === "strong"
            ? "0 30px 60px rgba(0,0,0,0.45)"
            : imageShadow === "subtle"
              ? "0 16px 40px rgba(0,0,0,0.3)"
              : "none"

    const borderValue = imageBorder ? "1px solid rgba(20,20,20,0.12)" : "none"

    return (
        <div
            ref={containerRef}
            onPointerMove={isStatic ? undefined : handleContainerMove}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 200,
                background: backgroundColor,
                boxSizing: "border-box",
                overflow: "hidden",
                ...style,
            }}
        >
            <div
                style={{
                    maxWidth: contentWidth,
                    margin: "0 auto",
                    paddingLeft: horizontalPadding,
                    paddingRight: horizontalPadding,
                    paddingTop: verticalPadding,
                    paddingBottom: verticalPadding,
                    boxSizing: "border-box",
                }}
            >
                {projects.map((project, index) => {
                    const isActive = activeIndex === index
                    const isLast = index === projects.length - 1
                    return (
                        <div key={index}>
                            <a
                                href={project.link || "#"}
                                onPointerEnter={() => handleRowEnter(index)}
                                onPointerLeave={handleRowLeave}
                                onClick={(e) => {
                                    if (docked && !isStatic) {
                                        e.preventDefault()
                                        handleRowTap(index)
                                    }
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 20,
                                    height: rowHeight,
                                    textDecoration: "none",
                                    cursor: isStatic ? "default" : "pointer",
                                    boxSizing: "border-box",
                                }}
                            >
                                <span
                                    style={{
                                        color: isActive
                                            ? activeTextColor
                                            : inactiveTextColor,
                                        fontSize: 13,
                                        fontWeight: 500,
                                        letterSpacing: 1,
                                        width: 32,
                                        flexShrink: 0,
                                        transition: "color 0.25s ease",
                                    }}
                                >
                                    {String(index + 1).padStart(2, "0")}
                                </span>

                                <motion.div
                                    animate={{
                                        x: isActive && followEnabled ? 8 : 0,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 26,
                                    }}
                                    style={{ flex: 1, minWidth: 0 }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                        }}
                                    >
                                        {showIcons && project.icon && (
                                            <img
                                                src={project.icon}
                                                alt=""
                                                style={{
                                                    width: iconSize,
                                                    height: iconSize,
                                                    objectFit: "contain",
                                                    opacity: isActive
                                                        ? 1
                                                        : 0.55,
                                                    transition:
                                                        "opacity 0.25s ease",
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                        <div
                                            style={{
                                                color: textColor,
                                                fontSize: 18,
                                                fontWeight: 600,
                                                letterSpacing: 0.5,
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {project.title}
                                        </div>
                                    </div>
                                    {showMetadata &&
                                        (project.subtitle || project.year) && (
                                            <div
                                                style={{
                                                    color: secondaryTextColor,
                                                    fontSize: 13,
                                                    marginTop: 4,
                                                }}
                                            >
                                                {[
                                                    project.subtitle,
                                                    project.year,
                                                ]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </div>
                                        )}
                                </motion.div>

                                <motion.span
                                    animate={{
                                        x: isActive && followEnabled ? 5 : 0,
                                        opacity: isActive ? 1 : 0,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 26,
                                    }}
                                    style={{
                                        color: arrowColor,
                                        fontSize: 20,
                                        flexShrink: 0,
                                    }}
                                >
                                    ↗
                                </motion.span>
                            </a>

                            {!isLast && (
                                <div
                                    style={{
                                        height: 1,
                                        background: dividerColor,
                                        marginTop: rowGap,
                                        marginBottom: rowGap,
                                    }}
                                />
                            )}

                            {docked && (
                                <AnimatePresence>
                                    {isActive && project.image && (
                                        <motion.div
                                            key="docked-image"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: imageHeight * 0.6,
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{
                                                duration: revealSpeed,
                                            }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <img
                                                src={project.image.src}
                                                alt=""
                                                style={{
                                                    width: "100%",
                                                    height: imageHeight * 0.6,
                                                    objectFit: imageFit,
                                                    objectPosition:
                                                        imagePosition,
                                                    borderRadius: imageRadius,
                                                    boxShadow: shadowValue,
                                                    border: borderValue,
                                                    marginTop: 12,
                                                    marginBottom: 12,
                                                    display: "block",
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>
                    )
                })}
            </div>

            {!docked && !isStatic && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                >
                    <AnimatePresence>
                        {stack.map((item) => {
                            const project = projects[item.index]
                            if (!project || !project.image) return null
                            const isLiveTracking = item.live && followEnabled
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{
                                        opacity: 0,
                                        scale: reduceMotion
                                            ? imageScale
                                            : imageScale * 0.85,
                                        rotate: 0,
                                        filter: `blur(${enterBlur}px)`,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: item.live
                                            ? imageScale * hoverScale
                                            : imageScale * hoverScale * 0.94,
                                        rotate: isLiveTracking
                                            ? (item.rotation ?? 0)
                                            : 0,
                                        filter: "blur(0px)",
                                        left: isLiveTracking ? pos.x : item.x,
                                        top: isLiveTracking ? pos.y : item.y,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: imageScale * 0.94,
                                        filter: `blur(${exitBlur}px)`,
                                    }}
                                    transition={{
                                        opacity: {
                                            duration: item.live
                                                ? revealSpeed
                                                : exitSpeed,
                                        },
                                        filter: {
                                            duration: item.live
                                                ? revealSpeed
                                                : exitSpeed,
                                        },
                                        scale: {
                                            duration: item.live
                                                ? revealSpeed
                                                : exitSpeed,
                                        },
                                        rotate: {
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 20,
                                        },
                                        left: isLiveTracking
                                            ? {
                                                  type: "spring",
                                                  stiffness:
                                                      40 + followStrength * 3,
                                                  damping: 18,
                                              }
                                            : { duration: 0 },
                                        top: isLiveTracking
                                            ? {
                                                  type: "spring",
                                                  stiffness:
                                                      40 + followStrength * 3,
                                                  damping: 18,
                                              }
                                            : { duration: 0 },
                                    }}
                                    style={{
                                        position: "absolute",
                                        width: imageWidth,
                                        height: imageHeight,
                                    }}
                                >
                                    <img
                                        src={project.image.src}
                                        alt=""
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: imageFit,
                                            objectPosition: imagePosition,
                                            borderRadius: imageRadius,
                                            boxShadow: shadowValue,
                                            border: borderValue,
                                            display: "block",
                                        }}
                                    />
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            {isStatic && projects[0]?.image && (
                <div
                    style={{
                        position: "absolute",
                        right: horizontalPadding,
                        bottom: verticalPadding,
                        width: imageWidth,
                        height: imageHeight,
                        pointerEvents: "none",
                    }}
                >
                    <img
                        src={projects[0].image.src}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: imageFit,
                            objectPosition: imagePosition,
                            borderRadius: imageRadius,
                            boxShadow: shadowValue,
                            border: borderValue,
                            display: "block",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

const defaultProjects = [
    {
        title: "Digital Identity",
        subtitle: "Aether Studio",
        year: "2026",
        link: "/projects/digital-identity",
        icon: ICON_IDENTITY,
    },
    {
        title: "Editorial Experience",
        subtitle: "Forme",
        year: "2026",
        link: "/projects/editorial-experience",
        icon: ICON_EDITORIAL,
    },
    {
        title: "Mobile Product",
        subtitle: "Northstar",
        year: "2025",
        link: "/projects/mobile-product",
        icon: ICON_MOBILE,
    },
    {
        title: "Art Direction",
        subtitle: "Mono Studio",
        year: "2025",
        link: "/projects/art-direction",
        icon: ICON_ART,
    },
    {
        title: "E-commerce Experience",
        subtitle: "Atelier",
        year: "2025",
        link: "/projects/ecommerce-experience",
        icon: ICON_ECOMMERCE,
    },
    {
        title: "Creative Campaign",
        subtitle: "Arc Objects",
        year: "2024",
        link: "/projects/creative-campaign",
        icon: ICON_CAMPAIGN,
    },
]

ShowcaseFlow.defaultProps = {
    projects: defaultProjects,
    showMetadata: true,
    showIcons: true,
    iconSize: 20,
    contentWidth: 1100,
    rowHeight: 100,
    rowGap: 0,
    horizontalPadding: 0,
    verticalPadding: 0,
    imageWidth: 360,
    imageHeight: 460,
    imageOffsetX: 24,
    imageOffsetY: -230,
    imageRadius: 12,
    imageScale: 1,
    imageFit: "cover",
    imagePosition: "center",
    imageShadow: "subtle",
    imageBorder: false,
    revealSpeed: 0.45,
    exitSpeed: 0.25,
    cursorFollow: true,
    followStrength: 70,
    rotationMax: 2,
    hoverScale: 1,
    enterBlur: 8,
    exitBlur: 5,
    imageTrail: false,
    reduceMotion: false,
    backgroundColor: "#FAF9F6",
    textColor: "#141414",
    secondaryTextColor: "rgba(20,20,20,0.55)",
    inactiveTextColor: "rgba(20,20,20,0.4)",
    dividerColor: "rgba(20,20,20,0.12)",
    activeTextColor: "#141414",
    arrowColor: "#141414",
}

addPropertyControls(ShowcaseFlow, {
    projects: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                subtitle: { type: ControlType.String, title: "Subtitle" },
                year: { type: ControlType.String, title: "Year" },
                image: { type: ControlType.Image, title: "Image" },
                icon: {
                    type: ControlType.String,
                    title: "Icon (URL)",
                    displayTextArea: true,
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: defaultProjects,
    },
    showMetadata: {
        type: ControlType.Boolean,
        title: "Show Metadata",
        defaultValue: true,
    },
    showIcons: {
        type: ControlType.Boolean,
        title: "Show Icons",
        defaultValue: true,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 10,
        max: 48,
        step: 1,
        defaultValue: 20,
        hidden: (p) => !p.showIcons,
    },

    contentWidth: {
        type: ControlType.Number,
        title: "Content Width",
        min: 400,
        max: 1800,
        step: 10,
        defaultValue: 1100,
    },
    rowHeight: {
        type: ControlType.Number,
        title: "Row Height",
        min: 60,
        max: 200,
        step: 5,
        defaultValue: 100,
    },
    rowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 0,
    },
    horizontalPadding: {
        type: ControlType.Number,
        title: "Horizontal Padding",
        min: 0,
        max: 160,
        step: 4,
        defaultValue: 0,
    },
    verticalPadding: {
        type: ControlType.Number,
        title: "Vertical Padding",
        min: 0,
        max: 160,
        step: 4,
        defaultValue: 0,
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",
        min: 120,
        max: 700,
        step: 10,
        defaultValue: 360,
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        min: 120,
        max: 800,
        step: 10,
        defaultValue: 460,
    },
    imageOffsetX: {
        type: ControlType.Number,
        title: "Image Offset X",
        min: -200,
        max: 200,
        step: 2,
        defaultValue: 24,
    },
    imageOffsetY: {
        type: ControlType.Number,
        title: "Image Offset Y",
        min: -500,
        max: 200,
        step: 2,
        defaultValue: -230,
    },

    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 12,
    },
    imageScale: {
        type: ControlType.Number,
        title: "Image Scale",
        min: 0.5,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
    },
    imagePosition: {
        type: ControlType.Enum,
        title: "Image Position",
        options: ["center", "top", "bottom", "left", "right"],
        optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],
        defaultValue: "center",
    },
    imageShadow: {
        type: ControlType.Enum,
        title: "Image Shadow",
        options: ["none", "subtle", "strong"],
        optionTitles: ["None", "Subtle", "Strong"],
        defaultValue: "subtle",
    },
    imageBorder: {
        type: ControlType.Boolean,
        title: "Image Border",
        defaultValue: false,
    },

    revealSpeed: {
        type: ControlType.Number,
        title: "Reveal Speed",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.45,
    },
    exitSpeed: {
        type: ControlType.Number,
        title: "Exit Speed",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.25,
    },
    cursorFollow: {
        type: ControlType.Boolean,
        title: "Cursor Follow",
        defaultValue: true,
    },
    followStrength: {
        type: ControlType.Number,
        title: "Follow Strength",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 70,
        hidden: (p) => !p.cursorFollow,
    },
    rotationMax: {
        type: ControlType.Number,
        title: "Image Rotation",
        min: 0,
        max: 5,
        step: 0.5,
        defaultValue: 2,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 0.8,
        max: 1.2,
        step: 0.01,
        defaultValue: 1,
    },
    enterBlur: {
        type: ControlType.Number,
        title: "Enter Blur",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 8,
    },
    exitBlur: {
        type: ControlType.Number,
        title: "Exit Blur",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 5,
    },
    imageTrail: {
        type: ControlType.Boolean,
        title: "Image Trail",
        defaultValue: false,
    },
    reduceMotion: {
        type: ControlType.Boolean,
        title: "Reduce Motion",
        defaultValue: false,
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FAF9F6",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#141414",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Secondary Text",
        defaultValue: "rgba(20,20,20,0.55)",
    },
    inactiveTextColor: {
        type: ControlType.Color,
        title: "Inactive Text",
        defaultValue: "rgba(20,20,20,0.4)",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "rgba(20,20,20,0.12)",
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Active Text",
        defaultValue: "#141414",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#141414",
    },
})
