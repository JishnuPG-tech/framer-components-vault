import React, { useRef } from "react"
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useInView,
    type MotionValue,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ResponsiveImageObject {
    src?: string
    srcSet?: string
    alt?: string
}

type ResponsiveImageValue = string | ResponsiveImageObject

interface Project {
    title: string
    industry: string
    date: string
    imgSrc: ResponsiveImageValue
    link: string
    hoverBg: string
}

interface FramerBorder {
    borderColor?: string
    borderStyle?: "solid" | "dashed" | "dotted" | "double"
    borderWidth?: number
    borderTopWidth?: number
    borderLeftWidth?: number
    borderRightWidth?: number
    borderBottomWidth?: number
}

interface ProjectRevealProps {
    layoutVariant: "Desktop" | "Mobile"
    projects: Project[]
    headerCol1: string
    headerCol2: string
    headerCol3: string
    backgroundColor: string
    textColor: string
    border: FramerBorder
    hoverBorderColor: string
    showHoverShadow: boolean
    hoverShadow: string
    headerFont: React.CSSProperties
    projectFont: React.CSSProperties
    style?: React.CSSProperties
}

function isResponsiveImageObject(
    value: ResponsiveImageValue
): value is ResponsiveImageObject {
    return typeof value === "object" && value !== null
}

const defaultImg =
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"

const defaultProjects: Project[] = [
    {
        title: "EON_OS",
        industry: "SPATIAL INTERFACE",
        date: "2023.Q4",
        imgSrc: { src: defaultImg, alt: "EON_OS Preview" },
        link: "",
        hoverBg: "#CCFF00",
    },
    {
        title: "CINDER // ASH",
        industry: "INDUSTRIAL DESIGN",
        date: "2025.Q1",
        imgSrc: { src: defaultImg, alt: "Cinder Ash Preview" },
        link: "",
        hoverBg: "#00F0FF",
    },
    {
        title: "VERRA.AI",
        industry: "NEURAL NETWORK UI",
        date: "2024.Q2",
        imgSrc: { src: defaultImg, alt: "Verra AI Preview" },
        link: "",
        hoverBg: "#FF66B2",
    },
    {
        title: "ATLAS_BLOOM",
        industry: "BRAND IDENTITY",
        date: "2025.Q3",
        imgSrc: { src: defaultImg, alt: "Atlas Bloom Preview" },
        link: "",
        hoverBg: "#FF6600",
    },
    {
        title: "FORM-THEORY",
        industry: "GROWTH ALGORITHMS",
        date: "2022.Q1",
        imgSrc: { src: defaultImg, alt: "Form Theory Preview" },
        link: "",
        hoverBg: "#D4BFFF",
    },
    {
        title: "KINDRED/HAUS",
        industry: "OBJECT FABRICATION",
        date: "2020.Q4",
        imgSrc: { src: defaultImg, alt: "Kindred Haus Preview" },
        link: "",
        hoverBg: "#FFE600",
    },
]

const MAX_PROJECTS = 30

const DEFAULT_FONT_SETTINGS = {
    variant: "Regular",
    fontSize: "14px",
    letterSpacing: "-0.025em",
    lineHeight: "1.375em",
} as const

// --- TYPES FOR HOOK ISOLATION COMPONENTS ---

interface RevealContentProps extends ProjectRevealProps {
    safeProjects: Project[]
    projectCount: number
    total: number
    scrollTrackHeight: string
    isDesktop: boolean
    isStatic: boolean
    containerRef: React.RefObject<HTMLDivElement>
}

interface HeaderRowProps {
    headerCol1: string
    headerCol2: string
    headerCol3: string
    border: FramerBorder
    headerFont: React.CSSProperties
    isDesktop: boolean
}

interface ImgMotionStyle {
    width: string | MotionValue<string>
    x: string | MotionValue<string>
}

interface ProjectListItemUIProps {
    project: Project
    isDesktop: boolean
    border: FramerBorder
    hoverBorderColor: string
    showHoverShadow: boolean
    hoverShadow: string
    textColor: string
    projectFont: React.CSSProperties
    isStatic: boolean
    imgMotionStyle: ImgMotionStyle
}

interface AnimatedProjectListItemProps extends RevealContentProps {
    project: Project
    index: number
    scrollYProgress: MotionValue<number>
}

interface StaticProjectListItemProps extends RevealContentProps {
    project: Project
}

// --- REUSABLE UI COMPONENTS ---

const HeaderRow = ({
    headerCol1,
    headerCol2,
    headerCol3,
    border,
    headerFont,
    isDesktop,
}: HeaderRowProps) => {
    const gridStyle: React.CSSProperties = {
        display: "grid",
        width: "100%",
        gap: "1rem",
        padding: isDesktop ? "0.5rem 2rem" : "0.5rem 1rem",
        gridTemplateColumns: isDesktop ? "1fr 1fr 1fr 1fr 1fr" : "1fr 1fr auto",
        boxSizing: "border-box",
    }
    const textItemStyle: React.CSSProperties = { textTransform: "uppercase" }
    const headerBorderWidth =
        border?.borderBottomWidth ?? border?.borderWidth ?? 2
    const headerBorderStyle = border?.borderStyle ?? "solid"
    const headerBorderColor = border?.borderColor ?? "#111111"

    return (
        <header
            style={{
                ...gridStyle,
                borderBottomWidth: headerBorderWidth,
                borderBottomStyle: headerBorderStyle,
                borderBottomColor: headerBorderColor,
                ...headerFont,
            }}
        >
            <div style={textItemStyle}>{headerCol1}</div>
            {isDesktop && <div style={{ width: "100%", height: "100%" }}></div>}
            {isDesktop && <div style={{ width: "100%", height: "100%" }}></div>}
            <div style={textItemStyle}>{headerCol2}</div>
            <div style={{ ...textItemStyle, textAlign: "right" }}>
                {headerCol3}
            </div>
        </header>
    )
}

const ProjectListItemUI = ({
    project,
    isDesktop,
    border,
    hoverBorderColor,
    showHoverShadow,
    hoverShadow,
    textColor,
    projectFont,
    isStatic,
    imgMotionStyle,
}: ProjectListItemUIProps) => {
    let resolvedSrc = defaultImg
    let resolvedSrcSet: string | undefined = undefined
    let resolvedAlt = project.title || ""

    if (isResponsiveImageObject(project.imgSrc)) {
        resolvedSrc = project.imgSrc.src ?? defaultImg
        resolvedSrcSet = project.imgSrc.srcSet
        resolvedAlt = project.imgSrc.alt ?? project.title ?? ""
    } else {
        resolvedSrc = project.imgSrc ?? defaultImg
    }

    const finalSrc = resolvedSrc || defaultImg
    const isValidLink =
        project.link && project.link.trim() !== "" && project.link !== "#"

    const gridStyle: React.CSSProperties = {
        display: "grid",
        width: "100%",
        gap: "1rem",
        padding: isDesktop ? "0.5rem 2rem" : "0.5rem 1rem",
        gridTemplateColumns: isDesktop ? "1fr 1fr 1fr 1fr 1fr" : "1fr 1fr auto",
        boxSizing: "border-box",
    }
    const textItemStyle: React.CSSProperties = { textTransform: "uppercase" }

    const rowBorderWidth = border?.borderBottomWidth ?? border?.borderWidth ?? 2
    const rowBorderStyle = border?.borderStyle ?? "solid"
    const normalBorderColor = border?.borderColor ?? "#111111"
    const resolvedHoverBorderColor = hoverBorderColor ?? "#111111"
    const activeShadow =
        showHoverShadow && hoverShadow
            ? hoverShadow
            : "0px 0px 0px 0px rgba(0,0,0,0)"
    const hoverShift = showHoverShadow && hoverShadow ? -4 : 0

    return (
        <li style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <motion.a
                href={isValidLink ? project.link : undefined}
                onClick={(e) => {
                    if (isStatic || !isValidLink) {
                        e.preventDefault()
                    }
                }}
                initial="rest"
                whileHover="hover"
                animate="rest"
                variants={{
                    rest: {
                        backgroundColor: "transparent",
                        borderBottomColor: normalBorderColor,
                    },
                    hover: {
                        backgroundColor: project.hoverBg,
                        borderBottomColor: resolvedHoverBorderColor,
                    },
                }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={
                    {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        textDecoration: "none",
                        overflow: "hidden",
                        borderBottomWidth: rowBorderWidth,
                        borderBottomStyle: rowBorderStyle,
                        color: textColor,
                        boxSizing: "border-box",
                        cursor: isValidLink ? "pointer" : "default",
                        ...projectFont,
                    } as React.CSSProperties
                }
            >
                <div style={gridStyle}>
                    <div style={textItemStyle}>{project.title}</div>
                    {isDesktop && (
                        <div style={{ width: "100%", height: "100%" }}></div>
                    )}
                    {isDesktop && (
                        <div style={{ width: "100%", height: "100%" }}></div>
                    )}
                    <div style={textItemStyle}>{project.industry}</div>
                    <div style={{ ...textItemStyle, textAlign: "right" }}>
                        {project.date}
                    </div>
                </div>

                <motion.img
                    src={finalSrc}
                    srcSet={resolvedSrcSet}
                    loading="lazy"
                    decoding="async"
                    style={{
                        ...imgMotionStyle,
                        objectFit: "cover",
                        aspectRatio: isDesktop ? "2.39 / 1.1" : "2.39 / 2.5",
                        borderRadius: 0,
                        position: "relative",
                        boxSizing: "border-box",
                        ...border,
                    }}
                    variants={{
                        rest: {
                            boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
                            top: 0,
                            left: 0,
                            borderColor: normalBorderColor,
                        },
                        hover: {
                            boxShadow: activeShadow,
                            top: hoverShift,
                            left: hoverShift,
                            borderColor: resolvedHoverBorderColor,
                        },
                    }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    alt={resolvedAlt}
                />
            </motion.a>
        </li>
    )
}

// --- HOOK ISOLATION COMPONENTS ---

// 1. Fully destroys useTransform hooks when offscreen
const AnimatedProjectListItem = (props: AnimatedProjectListItemProps) => {
    const { project, index, scrollYProgress, total } = props

    const startExpand = index * 0.6
    const endExpand = startExpand + 0.5
    const startShrink = 0.61 + index * 0.6
    const endShrink = startShrink + 0.5

    const width = useTransform(scrollYProgress, (v: number) => {
        const t = v * total
        if (t < startExpand) return "0%"
        if (t >= startExpand && t <= endExpand) {
            const p = (t - startExpand) / 0.5
            return `${p * 100}%`
        }
        if (t > endExpand && t < startShrink) return "100%"
        if (t >= startShrink && t <= endShrink) {
            const p = (t - startShrink) / 0.5
            return `${100 - p * 100}%`
        }
        return "0%"
    })

    const x = useTransform(scrollYProgress, (v: number) => {
        const t = v * total
        if (t < startShrink) return "0vw"
        if (t >= startShrink && t <= endShrink) {
            const p = (t - startShrink) / 0.5
            return `${p * 100}vw`
        }
        return "100vw"
    })

    return (
        <ProjectListItemUI
            project={project}
            isDesktop={props.isDesktop}
            border={props.border}
            hoverBorderColor={props.hoverBorderColor}
            showHoverShadow={props.showHoverShadow}
            hoverShadow={props.hoverShadow}
            textColor={props.textColor}
            projectFont={props.projectFont}
            isStatic={props.isStatic}
            imgMotionStyle={{ width, x }}
        />
    )
}

// 2. Returns flat static variables when offscreen
const StaticProjectListItem = (props: StaticProjectListItemProps) => {
    return (
        <ProjectListItemUI
            project={props.project}
            isDesktop={props.isDesktop}
            border={props.border}
            hoverBorderColor={props.hoverBorderColor}
            showHoverShadow={props.showHoverShadow}
            hoverShadow={props.hoverShadow}
            textColor={props.textColor}
            projectFont={props.projectFont}
            isStatic={props.isStatic}
            imgMotionStyle={{ width: "100%", x: "0vw" }}
        />
    )
}

// 3. Encapsulates and destroys useScroll and useSpring when offscreen
const AnimatedRevealContent = (props: RevealContentProps) => {
    const { scrollYProgress } = useScroll({
        target: props.containerRef,
        offset: ["start end", "end start"],
    })

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    })

    const N = Math.max(1, props.safeProjects.length)
    const yOffset = useTransform(smoothProgress, (v) => {
        const t = v * props.total
        if (t < 1.75 || N <= 2) return "0rem"

        let currentY = 0
        for (let i = 2; i < N; i++) {
            const startT = 1.75 + (i - 2) * 0.65
            const endT = startT + 0.25
            const shiftAmount = i === 2 ? 3 : 2.35

            if (t >= startT && t < endT) {
                const p = (t - startT) / 0.25
                return `${currentY + p * -shiftAmount}rem`
            }
            currentY -= shiftAmount

            const nextStartT = 1.75 + (i - 1) * 0.65
            if (t >= endT && (i === N - 1 || t < nextStartT)) {
                return `${currentY}rem`
            }
        }
        return `${currentY}rem`
    })

    return (
        <div
            style={{
                height: props.scrollTrackHeight,
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                <motion.div
                    style={{
                        padding: "0 2vw",
                        width: "100%",
                        boxSizing: "border-box",
                        y: yOffset,
                    }}
                >
                    <HeaderRow
                        headerCol1={props.headerCol1}
                        headerCol2={props.headerCol2}
                        headerCol3={props.headerCol3}
                        border={props.border}
                        headerFont={props.headerFont}
                        isDesktop={props.isDesktop}
                    />
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {props.safeProjects.map(
                            (project: Project, i: number) => (
                                <AnimatedProjectListItem
                                    key={project.title + i}
                                    project={project}
                                    index={i}
                                    scrollYProgress={smoothProgress}
                                    {...props}
                                />
                            )
                        )}
                    </ul>
                </motion.div>
            </div>
        </div>
    )
}

// 4. Maintains original height boundary so Framer layouts don't shift when hooks are destroyed
const StaticRevealContent = (props: RevealContentProps) => {
    return (
        <div
            style={{
                height: props.isStatic ? "auto" : props.scrollTrackHeight,
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    position: props.isStatic ? "relative" : "sticky",
                    top: 0,
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        padding: props.isStatic ? "2rem 2vw" : "0 2vw",
                        width: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    <HeaderRow
                        headerCol1={props.headerCol1}
                        headerCol2={props.headerCol2}
                        headerCol3={props.headerCol3}
                        border={props.border}
                        headerFont={props.headerFont}
                        isDesktop={props.isDesktop}
                    />
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {props.safeProjects.map(
                            (project: Project, i: number) => (
                                <StaticProjectListItem
                                    key={project.title + i}
                                    project={project}
                                    {...props}
                                />
                            )
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ProjectReveal(props: ProjectRevealProps) {
    const {
        layoutVariant = "Desktop",
        projects = defaultProjects,
        backgroundColor = "#E2DFD8",
        textColor = "#111111",
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    // Start animations when the component is within roughly half a desktop viewport
    // to avoid visible startup while still minimizing offscreen work.
    const isInView = useInView(containerRef, { margin: "540px" })
    const shouldAnimate = !isStatic && isInView

    const safeProjects = Array.isArray(projects)
        ? projects.slice(0, MAX_PROJECTS)
        : defaultProjects.slice(0, MAX_PROJECTS)

    const projectCount = safeProjects.length
    const N = Math.max(1, projectCount)
    const total = Math.max(1.11, 1.11 + (N - 1) * 0.6)
    const scrollTrackHeight =
        projectCount > 0 ? `${Math.max(100, projectCount * 150)}vh` : "1px"
    const isDesktop = layoutVariant === "Desktop"

    const sharedProps: RevealContentProps = {
        ...props,
        safeProjects,
        projectCount,
        total,
        scrollTrackHeight,
        isDesktop,
        isStatic,
        containerRef,
    }

    return (
        <section
            aria-label="Projects Showcase"
            ref={containerRef}
            style={
                {
                    ...props.style,
                    position: "relative",
                    backgroundColor: backgroundColor,
                    color: textColor,
                    minHeight: "100vh",
                    width: "100%",
                    overflowX: "visible",
                    boxSizing: "border-box",
                } as React.CSSProperties
            }
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                }}
            >
                {shouldAnimate ? (
                    <AnimatedRevealContent {...sharedProps} />
                ) : (
                    <StaticRevealContent {...sharedProps} />
                )}
            </div>
        </section>
    )
}

addPropertyControls(ProjectReveal, {
    layoutVariant: {
        type: ControlType.Enum,
        title: "Layout Variant",
        options: ["Desktop", "Mobile"],
        defaultValue: "Desktop",
        displaySegmentedControl: true,
    },
    headerCol1: {
        type: ControlType.String,
        title: "Header Col 1",
        defaultValue: "ENTITY",
    },
    headerCol2: {
        type: ControlType.String,
        title: "Header Col 2",
        defaultValue: "OUTPUT",
    },
    headerCol3: {
        type: ControlType.String,
        title: "Header Col 3",
        defaultValue: "DEPLOYED",
    },
    projects: {
        type: ControlType.Array,
        title: "Projects",
        description:
            "Supports up to 30 projects for optimal performance. Additional projects will be ignored.",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, defaultValue: "Project" },
                industry: {
                    type: ControlType.String,
                    defaultValue: "INDUSTRY",
                },
                date: { type: ControlType.String, defaultValue: "202X.QX" },
                imgSrc: { type: ControlType.ResponsiveImage },
                link: { type: ControlType.Link, defaultValue: "" },
                hoverBg: { type: ControlType.Color, defaultValue: "#CCFF00" },
            },
        },
        defaultValue: defaultProjects,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#E2DFD8",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111111",
    },
    border: {
        type: ControlType.Border,
        title: "Border Normal",
        defaultValue: {
            borderWidth: 2,
            borderStyle: "solid",
            borderColor: "#111111",
        },
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover Border",
        defaultValue: "#111111",
    },
    showHoverShadow: {
        type: ControlType.Boolean,
        title: "Hover Shadow",
        defaultValue: true,
    },
    hoverShadow: {
        type: ControlType.BoxShadow,
        title: "Shadow Style",
        defaultValue: "8px 8px 0px 0px #111111",
        hidden: (props) => !props.showHoverShadow,
    },
    headerFont: {
        type: ControlType.Font,
        title: "Header Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: DEFAULT_FONT_SETTINGS,
    },
    projectFont: {
        type: ControlType.Font,
        title: "Project Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: DEFAULT_FONT_SETTINGS,
    },
})
