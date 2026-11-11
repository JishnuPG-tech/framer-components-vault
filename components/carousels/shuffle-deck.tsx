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

import {
    motion,
    AnimatePresence,
    useMotionValue,
    useTransform,
    useReducedMotion,
    animate,
    type PanInfo,
} from "framer-motion"

type Project = {
    image?: {
        src?: string
        srcSet?: string
        alt?: string
    }
    title: string
    category: string
    year: string
    link: string
    newTab: boolean
    color: string
}

type Props = {
    projects: Project[]
    startSlide: number
    cardWidth: number
    maxCardWidth: number
    cardHeight: number
    mobileCardWidth: number
    radius: number
    spread: number
    rotation: number
    imagePadding: number
    shadow: number
    duration: number
    gradientBackground: boolean
    background: string
    backgroundEnd: string
    glowColorA: string
    glowColorB: string
    cardBackground: string
    textColor: string
    mutedColor: string
    accent: string
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    showThumbnails: boolean
    style?: React.CSSProperties
}

const DEFAULT_PROJECTS: Project[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Selected visual design project",
        },
        title: "Another Perspective",
        category: "Art Direction",
        year: "2026",
        link: "",
        newTab: false,
        color: "#DDD7FA",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Brand identity project",
        },
        title: "Outside the Ordinary",
        category: "Brand Identity",
        year: "2026",
        link: "",
        newTab: false,
        color: "#DFE8BC",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Digital experience project",
        },
        title: "A Different Feeling",
        category: "Digital Experience",
        year: "2025",
        link: "",
        newTab: false,
        color: "#F3D3BE",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Photography and editorial project",
        },
        title: "Between Places",
        category: "Photography",
        year: "2025",
        link: "",
        newTab: false,
        color: "#CADFE9",
    },
]

const useSafeLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function wrap(value: number, length: number) {
    return ((value % length) + length) % length
}

function frameNumber(value: unknown, fallback: number) {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.max(1, value)
        : fallback
}

function Arrow({ left = false }: { left?: boolean }) {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{
                display: "block",
                transform: left ? "rotate(180deg)" : undefined,
            }}
        >
            <path
                d="M4 12h15M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

type DeckCardProps = {
    project: Project
    rank: number
    width: number
    height: number
    mobile: boolean
    radius: number
    spread: number
    rotation: number
    imagePadding: number
    shadow: number
    duration: number
    cardBackground: string
    textColor: string
    mutedColor: string
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    instant: boolean
    isStatic: boolean
    canDrag: boolean
    onNext: () => void
    onPrevious: () => void
    onSelect: () => void
    onDragState: (dragging: boolean) => void
}

function DeckCard({
    project,
    rank,
    width,
    height,
    mobile,
    radius,
    spread,
    rotation,
    imagePadding,
    shadow,
    duration,
    cardBackground,
    textColor,
    mutedColor,
    titleFont,
    bodyFont,
    instant,
    isStatic,
    canDrag,
    onNext,
    onPrevious,
    onSelect,
    onDragState,
}: DeckCardProps) {
    const active = rank === 0
    const dragX = useMotionValue(0)

    const dragRotation = useTransform(
        dragX,
        [-width, 0, width],
        instant ? [0, 0, 0] : [-14, 0, 14]
    )

    React.useEffect(() => {
        if (active) return
        dragX.stop()
        dragX.set(0)
    }, [active, dragX])

    React.useEffect(() => {
        return () => dragX.stop()
    }, [dragX])

    const side = rank === 1 ? -1 : 1
    const offsetX = active ? 0 : side * spread
    const offsetY = active ? 10 : rank === 1 ? -9 : -23
    const cardRotation = active ? 0 : side * rotation
    const scale = active ? 1 : rank === 1 ? 0.955 : 0.91

    const footerHeight = mobile ? 88 : 104
    const innerRadius = Math.max(0, radius - imagePadding)
    const hasLink = !!project.link?.trim()

    const transition = {
        duration: instant ? 0 : duration,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    }

    const settle = () => {
        dragX.stop()

        if (instant) {
            dragX.set(0)
            return
        }

        animate(dragX, 0, {
            type: "spring",
            stiffness: 360,
            damping: 32,
        })
    }

    const handleDragEnd = (
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        onDragState(false)

        const threshold = Math.min(100, width * 0.22)
        const shouldChange =
            Math.abs(info.offset.x) > threshold ||
            (Math.abs(info.offset.x) > 20 && Math.abs(info.velocity.x) > 650)

        if (!shouldChange) {
            settle()
            return
        }

        if (info.offset.x < 0) {
            onNext()
        } else {
            onPrevious()
        }

        settle()
    }

    return (
        <motion.div
            initial={
                instant
                    ? false
                    : {
                          x: offsetX,
                          y: offsetY + 8,
                          rotate: cardRotation,
                          scale: scale * 0.98,
                          opacity: 0,
                      }
            }
            animate={{
                x: offsetX,
                y: offsetY,
                rotate: cardRotation,
                scale,
                opacity: 1,
            }}
            exit={{
                opacity: 0,
                pointerEvents: "none",
                transition: {
                    duration: instant ? 0 : Math.min(0.18, duration * 0.3),
                    ease: "easeOut",
                },
            }}
            transition={transition}
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width,
                height,
                marginLeft: -width / 2,
                marginTop: -height / 2,
                zIndex: 30 - rank,
                transformOrigin: "50% 80%",
                pointerEvents: isStatic ? "none" : "auto",
            }}
        >
            <motion.div
                drag={active && canDrag && !isStatic ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.85}
                dragMomentum={false}
                onDragStart={() => {
                    dragX.stop()
                    onDragState(true)
                }}
                onDragEnd={handleDragEnd}
                onPointerCancel={() => {
                    onDragState(false)
                    settle()
                }}
                style={{
                    x: dragX,
                    rotate: dragRotation,
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    borderRadius: radius,
                    background: cardBackground,
                    boxShadow: `
                        0 24px 65px -30px rgba(0,0,0,${shadow}),
                        0 3px 12px rgba(0,0,0,${shadow * 0.12})
                    `,
                    overflow: "hidden",
                    touchAction: "pan-y",
                    cursor: active ? (canDrag ? "grab" : "default") : "pointer",
                }}
            >
                {/* Project image */}
                <div
                    style={{
                        position: "absolute",
                        left: imagePadding,
                        right: imagePadding,
                        top: imagePadding,
                        bottom: footerHeight,
                        borderRadius: innerRadius,
                        overflow: "hidden",
                        background: project.color || "#DCDDD6",
                    }}
                >
                    <img
                        src={
                            project.image?.src || DEFAULT_PROJECTS[0].image?.src
                        }
                        srcSet={project.image?.srcSet}
                        sizes={`${Math.round(width)}px`}
                        alt={active ? project.image?.alt || project.title : ""}
                        draggable={false}
                        loading="eager"
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: "cover",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                    />

                    {project.category && (
                        <span
                            style={{
                                position: "absolute",
                                top: mobile ? 14 : 20,
                                left: mobile ? 14 : 20,
                                maxWidth: "calc(100% - 40px)",
                                padding: "8px 12px",
                                boxSizing: "border-box",
                                borderRadius: 999,
                                background: project.color || "#E5E8DF",
                                color: "#20221F",
                                ...bodyFont,
                                fontSize: 11,
                                lineHeight: 1.2,
                                fontWeight: 500,
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                pointerEvents: "none",
                            }}
                        >
                            {project.category}
                        </span>
                    )}

                    {!active && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: cardBackground,
                                opacity: rank === 1 ? 0.1 : 0.2,
                                pointerEvents: "none",
                            }}
                        />
                    )}
                </div>

                {/* Project caption */}
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: footerHeight,
                        padding: mobile ? "16px 20px" : "20px 28px",
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        color: textColor,
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        {project.year && (
                            <div
                                style={{
                                    ...bodyFont,
                                    fontSize: 10,
                                    lineHeight: 1.2,
                                    letterSpacing: "0.08em",
                                    color: mutedColor,
                                    marginBottom: 7,
                                }}
                            >
                                {project.year}
                            </div>
                        )}

                        <h3
                            style={{
                                margin: 0,
                                fontSize: mobile ? 20 : 27,
                                fontWeight: 500,
                                lineHeight: 1.12,
                                letterSpacing: "-0.045em",
                                ...titleFont,
                                ...(mobile ? { fontSize: 20 } : {}),
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {project.title}
                        </h3>
                    </div>

                    {hasLink && (
                        <span
                            style={{
                                width: mobile ? 36 : 42,
                                height: mobile ? 36 : 42,
                                borderRadius: "50%",
                                flexShrink: 0,
                                display: "grid",
                                placeItems: "center",
                                background: project.color || "#E5E8DF",
                                color: "#20221F",
                            }}
                        >
                            <Arrow />
                        </span>
                    )}
                </div>

                {/* Complete active card is a native link */}
                {active && hasLink && (
                    <a
                        href={project.link}
                        target={project.newTab ? "_blank" : undefined}
                        rel={project.newTab ? "noopener noreferrer" : undefined}
                        aria-label={`View ${project.title}`}
                        draggable={false}
                        tabIndex={isStatic ? -1 : 0}
                        onDragStart={(event) => event.preventDefault()}
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: radius,
                            zIndex: 3,
                            cursor: canDrag ? "grab" : "pointer",
                        }}
                    />
                )}

                {/* Select a card behind the active card */}
                {!active && (
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label={`Show ${project.title}`}
                        onClick={onSelect}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            border: 0,
                            borderRadius: radius,
                            background: "transparent",
                            cursor: "pointer",
                            padding: 0,
                            zIndex: 3,
                        }}
                    />
                )}
            </motion.div>
        </motion.div>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 760
 */
export default function ShuffleDeck(props: Props) {
    const {
        projects = DEFAULT_PROJECTS,
        startSlide = 1,

        cardWidth = 0.64,
        maxCardWidth = 880,
        cardHeight = 530,
        mobileCardWidth = 0.84,

        radius = 22,
        spread = 42,
        rotation = 7,
        imagePadding = 8,
        shadow = 0.34,
        duration = 0.65,

        gradientBackground = true,
        background = "#EDEEE8",
        backgroundEnd = "#E7EDE5",
        glowColorA = "rgba(186, 164, 242, 0.6)",
        glowColorB = "rgba(247, 194, 166, 0.55)",

        cardBackground = "#FFFFFF",
        textColor = "#242620",
        mutedColor = "#82857B",
        accent = "#313B26",

        titleFont,
        bodyFont,
        showThumbnails = true,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const instant = isStatic || !!reducedMotion

    const items = projects?.length ? projects : DEFAULT_PROJECTS

    const count = items.length

    const rootRef = React.useRef<HTMLDivElement>(null)
    const railRef = React.useRef<HTMLDivElement>(null)
    const dragging = React.useRef(false)
    const blockClickUntil = React.useRef(0)

    const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const scope = `shuffle-${id}`

    const [size, setSize] = React.useState({
        width: frameNumber(style?.width, 1100),
        height: frameNumber(style?.height, 760),
    })

    const [cursor, setCursor] = React.useState(() =>
        clamp(Math.round(startSlide) - 1, 0, count - 1)
    )

    React.useEffect(() => {
        setCursor(clamp(Math.round(startSlide) - 1, 0, count - 1))
    }, [startSlide, count])

    useSafeLayoutEffect(() => {
        const element = rootRef.current
        if (!element) return

        const measure = () => {
            const nextWidth = element.clientWidth || 1100
            const nextHeight = element.clientHeight || 760

            setSize((current) =>
                current.width === nextWidth && current.height === nextHeight
                    ? current
                    : {
                          width: nextWidth,
                          height: nextHeight,
                      }
            )
        }

        measure()

        if (typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(measure)
        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const currentCursor = isStatic
        ? clamp(Math.round(startSlide) - 1, 0, count - 1)
        : cursor

    const activeIndex = wrap(currentCursor, count)
    const activeProject = items[activeIndex]
    const mobile = size.width < 640

    const footerHeight = showThumbnails ? 104 : 76
    const stageHeight = Math.max(1, size.height - footerHeight)

    const availableWidth = Math.max(1, size.width - (mobile ? 36 : 80))

    const width = Math.max(
        1,
        Math.min(
            maxCardWidth,
            availableWidth,
            size.width *
                (mobile
                    ? clamp(mobileCardWidth, 0.55, 0.92)
                    : clamp(cardWidth, 0.35, 0.88))
        )
    )

    const availableHeight = Math.max(1, stageHeight - (mobile ? 92 : 116))

    const height = Math.max(1, Math.min(cardHeight, availableHeight))

    const actualSpread = mobile ? Math.min(spread, 17) : spread

    const actualRotation = mobile ? Math.min(rotation, 6) : rotation

    const go = (direction: number) => {
        if (isStatic || count <= 1) return
        setCursor((current) => current + direction)
    }

    const goTo = (target: number) => {
        if (isStatic) return

        setCursor((current) => {
            const currentIndex = wrap(current, count)
            let difference = target - currentIndex

            if (difference > count / 2) difference -= count
            if (difference < -count / 2) difference += count

            return current + difference
        })
    }

    const handleDragState = (value: boolean) => {
        dragging.current = value

        if (!value) {
            blockClickUntil.current = Date.now() + 350
        }
    }

    React.useEffect(() => {
        const rail = railRef.current
        const selected = rail?.children[activeIndex] as HTMLElement | undefined

        if (!rail || !selected) return

        rail.scrollLeft =
            selected.offsetLeft -
            rail.clientWidth / 2 +
            selected.offsetWidth / 2
    }, [activeIndex, size.width, showThumbnails])

    const buttonStyle: React.CSSProperties = {
        appearance: "none",
        border: 0,
        padding: 0,
        width: mobile ? 42 : 48,
        height: mobile ? 42 : 48,
        flexShrink: 0,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: cardBackground,
        color: textColor,
        cursor: isStatic || count <= 1 ? "default" : "pointer",
        opacity: count > 1 ? 1 : 0.35,
        WebkitTapHighlightColor: "transparent",
    }

    const backgroundStyle = gradientBackground
        ? `
            radial-gradient(
                ellipse at 12% 18%,
                ${glowColorA} 0%,
                transparent 62%
            ),
            radial-gradient(
                ellipse at 90% 82%,
                ${glowColorB} 0%,
                transparent 60%
            ),
            linear-gradient(
                135deg,
                ${background} 0%,
                ${backgroundEnd} 100%
            )
        `
        : background

    return (
        <div
            ref={rootRef}
            className={scope}
            role="region"
            aria-roledescription="carousel"
            aria-label="Selected projects"
            tabIndex={isStatic ? -1 : 0}
            onKeyDown={(event) => {
                if (
                    isStatic ||
                    event.altKey ||
                    event.ctrlKey ||
                    event.metaKey
                ) {
                    return
                }

                const target = event.target as HTMLElement

                if (
                    target.closest(
                        "input, textarea, select, [contenteditable='true']"
                    )
                ) {
                    return
                }

                if (event.key === "ArrowRight") {
                    event.preventDefault()
                    go(1)
                }

                if (event.key === "ArrowLeft") {
                    event.preventDefault()
                    go(-1)
                }

                if (event.key === "Home") {
                    event.preventDefault()
                    goTo(0)
                }

                if (event.key === "End") {
                    event.preventDefault()
                    goTo(count - 1)
                }
            }}
            style={{
                ...style,
                width: style?.width ?? "100%",
                height: style?.height ?? 760,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                background: backgroundStyle,
                color: textColor,
                fontFamily: "Inter, sans-serif",
                isolation: "isolate",
                boxSizing: "border-box",
            }}
        >
            <style>{`
                .${scope} button:focus-visible,
                .${scope} a:focus-visible {
                    outline: 3px solid ${accent};
                    outline-offset: -5px;
                }

                .${scope}:focus-visible {
                    outline: 2px solid ${accent};
                    outline-offset: -3px;
                }

                .${scope} .shuffle-rail {
                    scrollbar-width: none;
                }

                .${scope} .shuffle-rail::-webkit-scrollbar {
                    display: none;
                }

                .${scope} button {
                    font-family: inherit;
                }
            `}</style>

            {/* Card stack */}
            <div
                onClickCapture={(event) => {
                    if (
                        isStatic ||
                        dragging.current ||
                        Date.now() < blockClickUntil.current
                    ) {
                        event.preventDefault()
                        event.stopPropagation()
                    }
                }}
                style={{
                    flex: "1 1 0",
                    minHeight: 0,
                    position: "relative",
                }}
            >
                <AnimatePresence initial={false}>
                    {Array.from({ length: Math.min(3, count) }, (_, rank) => {
                        const position = currentCursor + rank
                        const projectIndex = wrap(position, count)

                        return (
                            <DeckCard
                                key={position}
                                project={items[projectIndex]}
                                rank={rank}
                                width={width}
                                height={height}
                                mobile={mobile}
                                radius={radius}
                                spread={actualSpread}
                                rotation={actualRotation}
                                imagePadding={imagePadding}
                                shadow={shadow}
                                duration={duration}
                                cardBackground={cardBackground}
                                textColor={textColor}
                                mutedColor={mutedColor}
                                titleFont={titleFont}
                                bodyFont={bodyFont}
                                instant={instant}
                                isStatic={isStatic}
                                canDrag={count > 1}
                                onNext={() => go(1)}
                                onPrevious={() => go(-1)}
                                onSelect={() => goTo(projectIndex)}
                                onDragState={handleDragState}
                            />
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div
                style={{
                    flex: `0 0 ${footerHeight}px`,
                    boxSizing: "border-box",
                    position: "relative",
                    zIndex: 50,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 13,
                    padding: "4px 20px 16px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: mobile ? 16 : 24,
                        width: "100%",
                    }}
                >
                    <motion.button
                        type="button"
                        aria-label="Previous project"
                        disabled={isStatic || count <= 1}
                        onClick={() => go(-1)}
                        whileHover={instant ? undefined : { scale: 1.08 }}
                        whileTap={instant ? undefined : { scale: 0.94 }}
                        style={buttonStyle}
                    >
                        <Arrow left />
                    </motion.button>

                    {showThumbnails ? (
                        <div
                            ref={railRef}
                            className="shuffle-rail"
                            role="group"
                            aria-label="Choose project"
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: mobile ? 7 : 9,
                                maxWidth: mobile
                                    ? Math.max(60, size.width - 180)
                                    : 340,
                                minWidth: 0,
                                overflowX: "auto",
                                padding: "7px 5px",
                            }}
                        >
                            {items.map((project, projectIndex) => {
                                const selected = projectIndex === activeIndex

                                return (
                                    <motion.button
                                        key={projectIndex}
                                        type="button"
                                        aria-label={`Show ${project.title}`}
                                        aria-pressed={selected}
                                        disabled={isStatic}
                                        onClick={() => goTo(projectIndex)}
                                        initial={false}
                                        animate={{
                                            y: selected ? -3 : 0,
                                            rotate: selected
                                                ? -5
                                                : projectIndex % 2
                                                  ? 4
                                                  : -3,
                                            opacity: selected ? 1 : 0.5,
                                        }}
                                        transition={{
                                            duration: instant ? 0 : 0.25,
                                        }}
                                        style={{
                                            width: mobile ? 32 : 40,
                                            height: mobile ? 38 : 46,
                                            flexShrink: 0,
                                            padding: 3,
                                            border: 0,
                                            borderRadius: 5,
                                            background: cardBackground,
                                            cursor: isStatic
                                                ? "default"
                                                : "pointer",
                                            outline: selected
                                                ? `2px solid ${accent}`
                                                : undefined,
                                            outlineOffset: 2,
                                        }}
                                    >
                                        <img
                                            src={
                                                project.image?.src ||
                                                DEFAULT_PROJECTS[0].image?.src
                                            }
                                            srcSet={project.image?.srcSet}
                                            sizes="40px"
                                            alt=""
                                            draggable={false}
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                height: "100%",
                                                borderRadius: 3,
                                                objectFit: "cover",
                                            }}
                                        />
                                    </motion.button>
                                )
                            })}
                        </div>
                    ) : (
                        <span
                            style={{
                                ...bodyFont,
                                minWidth: 74,
                                textAlign: "center",
                                fontSize: 12,
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {String(activeIndex + 1).padStart(2, "0")}
                            {" / "}
                            {String(count).padStart(2, "0")}
                        </span>
                    )}

                    <motion.button
                        type="button"
                        aria-label="Next project"
                        disabled={isStatic || count <= 1}
                        onClick={() => go(1)}
                        whileHover={instant ? undefined : { scale: 1.08 }}
                        whileTap={instant ? undefined : { scale: 0.94 }}
                        style={buttonStyle}
                    >
                        <Arrow />
                    </motion.button>
                </div>

                {showThumbnails && (
                    <div
                        style={{
                            ...bodyFont,
                            fontSize: 10,
                            lineHeight: 1.2,
                            letterSpacing: "0.1em",
                            color: mutedColor,
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {String(activeIndex + 1).padStart(2, "0")}
                        <span style={{ opacity: 0.5 }}> / </span>
                        {String(count).padStart(2, "0")}
                    </div>
                )}
            </div>

            <span
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clipPath: "inset(50%)",
                    whiteSpace: "nowrap",
                }}
            >
                {activeProject.title}. Project {activeIndex + 1} of {count}.
            </span>
        </div>
    )
}

addPropertyControls(ShuffleDeck, {
    projects: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 20,
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
                    defaultValue: "Another Perspective",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Art Direction",
                },
                year: {
                    type: ControlType.String,
                    title: "Year",
                    defaultValue: "2026",
                },
                color: {
                    type: ControlType.Color,
                    title: "Accent",
                    defaultValue: "#DDD7FA",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
            },
        },
        defaultValue: DEFAULT_PROJECTS,
    },

    startSlide: {
        type: ControlType.Number,
        title: "Start Slide",
        defaultValue: 1,
        min: 1,
        max: 20,
        step: 1,
        displayStepper: true,
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Desktop Width",
        defaultValue: 0.64,
        min: 0.35,
        max: 0.88,
        step: 0.01,
        description: "Card width relative to the component.",
    },

    maxCardWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 880,
        min: 240,
        max: 1400,
        step: 10,
        unit: "px",
    },

    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 530,
        min: 240,
        max: 900,
        step: 10,
        unit: "px",
        description: "Automatically fits smaller component frames.",
    },

    mobileCardWidth: {
        type: ControlType.Number,
        title: "Mobile Width",
        defaultValue: 0.84,
        min: 0.55,
        max: 0.92,
        step: 0.01,
    },

    spread: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 42,
        min: 0,
        max: 90,
        step: 2,
        unit: "px",
    },

    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 7,
        min: 0,
        max: 12,
        step: 0.5,
        unit: "°",
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 22,
        min: 0,
        max: 48,
        step: 2,
        unit: "px",
    },

    imagePadding: {
        type: ControlType.Number,
        title: "Image Inset",
        defaultValue: 8,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },

    shadow: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 0.34,
        min: 0,
        max: 0.8,
        step: 0.02,
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.65,
        min: 0.2,
        max: 1.2,
        step: 0.05,
        unit: "s",
    },

    showThumbnails: {
        type: ControlType.Boolean,
        title: "Thumbnails",
        defaultValue: true,
    },

    gradientBackground: {
        type: ControlType.Boolean,
        title: "Gradient BG",
        defaultValue: true,
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#EDEEE8",
    },

    backgroundEnd: {
        type: ControlType.Color,
        title: "BG End",
        defaultValue: "#E7EDE5",
        hidden: (props) => !props.gradientBackground,
    },

    glowColorA: {
        type: ControlType.Color,
        title: "Glow A",
        defaultValue: "rgba(186, 164, 242, 0.6)",
        hidden: (props) => !props.gradientBackground,
    },

    glowColorB: {
        type: ControlType.Color,
        title: "Glow B",
        defaultValue: "rgba(247, 194, 166, 0.55)",
        hidden: (props) => !props.gradientBackground,
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Card",
        defaultValue: "#FFFFFF",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#242620",
    },

    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "#82857B",
    },

    accent: {
        type: ControlType.Color,
        title: "Navigation",
        defaultValue: "#313B26",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "27px",
            variant: "Medium",
            letterSpacing: "-0.045em",
            lineHeight: "1.12em",
        },
    },

    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.3em",
        },
    },
})
