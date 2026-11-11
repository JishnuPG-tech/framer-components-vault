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

import { AnimatePresence, motion } from "framer-motion"

type FramerResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
    intrinsicWidth?: number
    intrinsicHeight?: number
    pixelWidth?: number
    pixelHeight?: number
}

type Project = {
    title: string

    category: string
    statement: string
    mediaType: "image" | "video"
    image: string
    video: string
    fallbackImage: string
    projectLink: string
    openInNewTab: boolean
}

type Props = {
    source?: "Manual" | "CMS"
    content?: React.ReactNode
    projects: Project[]
    selectedProjectsLabel: string
    buttonText: string

    autoPlay: boolean

    interval: number

    panelWidth: number
    panelColor: string
    accentColor: string

    showLeftContentBackground: boolean
    leftContentBackground: string

    contentPadding: number

    categoryFont: any
    titleFont: any
    statementFont: any
    buttonFont: any
    thumbnailFont: any

    showThumbnails: boolean
    thumbnailLimit: number

    style?: React.CSSProperties
}

function fontCSS(
    font: any,
    defaults: {
        fontFamily: string
        fontSize: number | string
        fontWeight: number | string
        letterSpacing: number | string
        lineHeight: number | string
        textTransform: string
    }
): React.CSSProperties {
    return {
        fontFamily: font?.fontFamily ?? defaults.fontFamily,

        fontSize: font?.fontSize ?? defaults.fontSize,

        fontWeight: font?.fontWeight ?? defaults.fontWeight,

        letterSpacing: font?.letterSpacing ?? defaults.letterSpacing,

        lineHeight: font?.lineHeight ?? defaults.lineHeight,

        textTransform: font?.textTransform ?? defaults.textTransform,

        fontStyle: font?.fontStyle,
        textAlign: font?.textAlign,
    }
}

const DEFAULT_PROJECTS: Project[] = [
    {
        title: "Haven Residences",

        category: "Residential / 2026",
        statement:
            "A garden-oriented residence where filtered daylight turns a private arrival into a daily ritual.",
        image: "/manus-storage/haven-atrium-hero_3edef755.jpg",
        mediaType: "image",
        video: "",
        fallbackImage: "",
        projectLink: "",
        openInNewTab: true,
    },
    {
        title: "Oceanfront Towers",

        category: "Hospitality / 2025",
        statement:
            "Layered terraces fold toward the Pacific, bringing the horizon into every shared room.",
        image: "/manus-storage/haven-coastline_3c0c0392.jpg",
        mediaType: "image",
        video: "",
        fallbackImage: "",
        projectLink: "",
        openInNewTab: true,
    },
    {
        title: "Casa Verde",

        category: "Residential / 2024",
        statement:
            "Rammed earth, water, and planting compose a cool interior climate around a quiet central court.",
        image: "/manus-storage/haven-verdant-house_793ac990.jpg",
        mediaType: "image",
        video: "",
        fallbackImage: "",
        projectLink: "",
        openInNewTab: true,
    },
    {
        title: "Vertex Tower",

        category: "Multi-family / 2026",
        statement:
            "A compact urban tower whose deep fins tune privacy, light, and the rhythm of the street.",
        image: "/manus-storage/haven-urban-tower_12dd862b.jpg",
        mediaType: "image",
        video: "",
        fallbackImage: "",
        projectLink: "",
        openInNewTab: true,
    },
]

function Arrow({ direction = "right" }: { direction?: "left" | "right" }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <g
                transform={
                    direction === "left" ? "rotate(180 12 12)" : undefined
                }
            >
                <path d="M5 12h13M13 5l7 7-7 7" />
            </g>
        </svg>
    )
}

function PauseIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14M16 5v14" />
        </svg>
    )
}

function PlayIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5l10 7-10 7z" />
        </svg>
    )
}

/* -------------------------------------------------------------------------- */
/* Framer CMS Connect bridge                                                  */
/* -------------------------------------------------------------------------- */
/**
 * Add ApertureRelayCMSMain and ApertureRelayCMSDetails inside the same
 * repeated Framer Collection Item. The bridge is the preferred CMS path;
 * the DOM reader below keeps compatibility with ordinary named CMS layers.
 */
type ApertureCMSMainProps = {
    title?: string

    category?: string
    statement?: string
    mediaType?: Project["mediaType"]
    image?: string | FramerResponsiveImage
    video?: string
    fallbackImage?: string | FramerResponsiveImage
}

type ApertureCMSDetailsProps = {
    projectLink?: string
    openInNewTab?: boolean
}

function serializeApertureCMSBridge(value: Record<string, unknown>): string {
    try {
        return encodeURIComponent(JSON.stringify(value))
    } catch {
        return ""
    }
}

function parseApertureCMSBridge(value?: string): Record<string, unknown> {
    if (!value) return {}
    try {
        return JSON.parse(decodeURIComponent(value)) as Record<string, unknown>
    } catch {
        return {}
    }
}

export function ApertureRelayCMSMain(props: ApertureCMSMainProps) {
    const data = {
        title: props.title || "",

        category: props.category || "",
        statement: props.statement || "",
        mediaType: props.mediaType || "image",
        image: props.image || "",
        video: props.video || "",
        fallbackImage: props.fallbackImage || "",
    }

    return (
        <div
            data-aperture-relay-main={serializeApertureCMSBridge(data)}
            aria-hidden="true"
            style={{
                position: "absolute",
                width: 1,
                height: 1,
                overflow: "hidden",
                opacity: 0,
                pointerEvents: "none",
            }}
        />
    )
}

export function ApertureRelayCMSDetails(props: ApertureCMSDetailsProps) {
    const data = {
        projectLink: props.projectLink || "",
        openInNewTab: props.openInNewTab ?? true,
    }

    return (
        <div
            data-aperture-relay-details={serializeApertureCMSBridge(data)}
            aria-hidden="true"
            style={{
                position: "absolute",
                width: 1,
                height: 1,
                overflow: "hidden",
                opacity: 0,
                pointerEvents: "none",
            }}
        />
    )
}

addPropertyControls(ApertureRelayCMSMain, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "",
    },

    category: {
        type: ControlType.String,
        title: "Category",
        defaultValue: "",
    },

    statement: {
        type: ControlType.String,
        title: "Statement",
        displayTextArea: true,
        defaultValue: "",
    },

    mediaType: {
        type: ControlType.Enum,
        title: "Media",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
    },

    image: {
        type: ControlType.Image,
        title: "Image",
        hidden: (props) => props.mediaType === "video",
    },

    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: (props) => props.mediaType !== "video",
    },

    fallbackImage: {
        type: ControlType.Image,
        title: "Fallback image",
        hidden: (props) => props.mediaType !== "video",
    },
})

addPropertyControls(ApertureRelayCMSDetails, {
    projectLink: {
        type: ControlType.Link,
        title: "Project link",
    },

    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in new tab",
        defaultValue: true,
        hidden: (props) => !props.projectLink,
    },
})

function cleanCMSValue(value: unknown): string {
    return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim()
}

function imageSource(value: unknown): string {
    if (typeof value === "string") return value
    if (value && typeof value === "object") {
        return cleanCMSValue((value as FramerResponsiveImage).src)
    }
    return ""
}

function findApertureDetailsBridge(mainNode: HTMLElement): HTMLElement | null {
    let scope: HTMLElement | null = mainNode.parentElement

    for (let depth = 0; scope && depth < 8; depth += 1) {
        const mains = Array.from(
            scope.querySelectorAll<HTMLElement>("[data-aperture-relay-main]")
        )

        // Never associate details from a neighboring repeated collection item.
        if (mains.length > 1) return null

        const details = scope.querySelector<HTMLElement>(
            "[data-aperture-relay-details]"
        )
        if (details) return details

        scope = scope.parentElement
    }

    return null
}

function projectsFromApertureBridgeDOM(host: HTMLElement): Project[] {
    return Array.from(
        host.querySelectorAll<HTMLElement>("[data-aperture-relay-main]")
    )
        .map((mainNode): Project | null => {
            const main = parseApertureCMSBridge(
                mainNode.dataset.apertureRelayMain
            )
            const detailsNode = findApertureDetailsBridge(mainNode)
            const details = parseApertureCMSBridge(
                detailsNode?.dataset.apertureRelayDetails
            )

            const image = imageSource(main.image)
            const video = cleanCMSValue(main.video)
            if (!image && !video) return null

            return {
                title: cleanCMSValue(main.title) || "Untitled project",

                category: cleanCMSValue(main.category),
                statement: cleanCMSValue(main.statement),
                mediaType:
                    cleanCMSValue(main.mediaType).toLowerCase() === "video" ||
                    video
                        ? "video"
                        : "image",
                image,
                video,
                fallbackImage: imageSource(main.fallbackImage),
                projectLink: cleanCMSValue(details.projectLink),
                openInNewTab:
                    typeof details.openInNewTab === "boolean"
                        ? details.openInNewTab
                        : cleanCMSValue(details.openInNewTab).toLowerCase() !==
                          "false",
            }
        })
        .filter((project): project is Project => Boolean(project))
}

function findNamedCMSNode(
    root: HTMLElement,
    names: string[]
): HTMLElement | null {
    for (const name of names) {
        const exact = root.querySelector<HTMLElement>(
            `[data-framer-name="${name}" i]`
        )
        if (exact) return exact
    }

    for (const name of names) {
        const partial = root.querySelector<HTMLElement>(
            `[data-framer-name*="${name}" i]`
        )
        if (partial) return partial
    }

    return null
}

function readCMSField(root: HTMLElement, names: string[]): string {
    const node = findNamedCMSNode(root, names)
    if (!node) return ""

    const link = node.matches("a[href]")
        ? (node as HTMLAnchorElement)
        : node.querySelector<HTMLAnchorElement>("a[href]")

    const direct = cleanCMSValue(
        node.getAttribute("data-value") ||
            node.getAttribute("data-text") ||
            node.getAttribute("aria-label")
    )
    if (direct) return direct

    const textNodes = Array.from(
        node.querySelectorAll<HTMLElement>(
            '[data-framer-component-type="RichTextContainer"], [data-framer-component-type="Text"], [data-framer-text], h1, h2, h3, h4, h5, h6, p, span'
        )
    )
    const nestedText = textNodes
        .map((element) => cleanCMSValue(element.textContent))
        .find(Boolean)

    return cleanCMSValue(
        nestedText ||
            node.textContent ||
            link?.getAttribute("href") ||
            link?.href
    )
}

function readCMSImage(root: HTMLElement): string {
    const named = findNamedCMSNode(root, [
        "Image",
        "Project Image",
        "Media Image",
        "Media",
    ])
    const image =
        (named?.matches("img") ? named : named?.querySelector("img")) ||
        root.querySelector("img")
    if (!image) return ""

    const img = image as HTMLImageElement
    return img.currentSrc || img.src || img.getAttribute("src") || ""
}

function readCMSVideo(root: HTMLElement): string {
    const named = findNamedCMSNode(root, [
        "Video",
        "Project Video",
        "Media Video",
        "Video URL",
    ])
    const video =
        (named?.matches("video") ? named : named?.querySelector("video")) ||
        root.querySelector("video")
    const source = video?.querySelector("source")

    return cleanCMSValue(
        (video as HTMLVideoElement | null)?.currentSrc ||
            (video as HTMLVideoElement | null)?.src ||
            (source as HTMLSourceElement | null)?.src ||
            named?.getAttribute("data-video-url") ||
            named?.textContent
    )
}

function getCMSRecordRoots(host: HTMLElement): HTMLElement[] {
    const selector =
        '[data-framer-component-type="Collection Item"], [data-framer-name*="collection item" i], [data-framer-name*="cms item" i], li, article'
    const explicit = Array.from(host.querySelectorAll<HTMLElement>(selector))

    if (explicit.length) {
        return explicit.filter(
            (root) =>
                root.querySelector("img, video") ||
                readCMSField(root, ["Title", "Project Title"])
        )
    }

    const seen = new Set<HTMLElement>()
    const roots: HTMLElement[] = []

    for (const image of Array.from(
        host.querySelectorAll<HTMLImageElement>("img")
    )) {
        let candidate: HTMLElement | null = image.parentElement
        let selected: HTMLElement | null = null

        while (candidate && candidate !== host) {
            const imageCount = candidate.querySelectorAll("img").length
            if (imageCount > 1) break
            if (imageCount === 1) selected = candidate
            candidate = candidate.parentElement
        }

        selected =
            selected ||
            image.closest<HTMLElement>("a")?.parentElement ||
            image.parentElement

        if (selected && !seen.has(selected)) {
            seen.add(selected)
            roots.push(selected)
        }
    }

    return roots
}

function parseCMSProject(root: HTMLElement): Project | null {
    const image = readCMSImage(root)
    const video = readCMSVideo(root)
    if (!image && !video) return null

    const firstLink = root.querySelector<HTMLAnchorElement>("a[href]")
    const linkNode = findNamedCMSNode(root, [
        "Project Link",
        "ProjectLink",
        "Link",
    ])
    const link = linkNode?.matches("a[href]")
        ? (linkNode as HTMLAnchorElement)
        : linkNode?.querySelector<HTMLAnchorElement>("a[href]")

    const mediaType = cleanCMSValue(
        readCMSField(root, ["Media Type", "MediaType", "Type"])
    ).toLowerCase()

    const openInNewTab = readCMSField(root, [
        "Open in New Tab",
        "OpenInNewTab",
        "New Tab",
    ])

    return {
        title:
            readCMSField(root, ["Title", "Project Title", "Name"]) ||
            "Untitled project",

        category: readCMSField(root, ["Category", "Eyebrow", "Label"]),
        statement: readCMSField(root, [
            "Statement",
            "Description",
            "Caption",
            "Summary",
        ]),
        mediaType: mediaType === "video" || video ? "video" : "image",
        image,
        video,
        fallbackImage: readCMSImage(
            findNamedCMSNode(root, ["Fallback Image", "Image Fallback"]) || root
        ),
        projectLink: cleanCMSValue(
            link?.href ||
                link?.getAttribute("href") ||
                linkNode?.getAttribute("href") ||
                firstLink?.href ||
                firstLink?.getAttribute("href")
        ),
        openInNewTab: openInNewTab
            ? openInNewTab.toLowerCase() !== "false"
            : true,
    }
}

export default function ApertureSlider(props: Props) {
    const {
        source = "Manual",
        content,
        projects,
        selectedProjectsLabel,
        buttonText,
        autoPlay,

        interval,

        panelWidth,
        panelColor,
        accentColor,

        showLeftContentBackground,
        leftContentBackground,

        contentPadding,

        categoryFont,
        titleFont,
        statementFont,
        buttonFont,
        thumbnailFont,

        showThumbnails,
        thumbnailLimit,

        style,
    } = props

    /**
     * Framer static renderer.
     *
     * Prevents autoplay and visual animation
     * while rendering on the Framer Canvas/export.
     */
    const isStaticRenderer = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const activeVideoRef = React.useRef<HTMLVideoElement | null>(null)
    const [isInViewport, setIsInViewport] = React.useState(false)
    const cmsHostRef = React.useRef<HTMLDivElement>(null)
    const cmsSignatureRef = React.useRef("")
    const [cmsProjects, setCmsProjects] = React.useState<Project[]>([])

    React.useEffect(() => {
        if (isStaticRenderer) return

        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") {
            // Keep autoplay working in environments without IntersectionObserver.
            setIsInViewport(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInViewport(entry.isIntersecting)
            },
            { threshold: 0.01 }
        )

        observer.observe(root)

        return () => observer.disconnect()
    }, [isStaticRenderer])

    React.useLayoutEffect(() => {
        if (source !== "CMS") {
            cmsSignatureRef.current = ""
            if (cmsProjects.length > 0) setCmsProjects([])
            return
        }

        const host = cmsHostRef.current
        if (!host) return

        const read = () => {
            // The explicit bridge is authoritative. The named-layer reader is
            // retained as a fallback for existing Framer Collection layouts.
            const bridged = projectsFromApertureBridgeDOM(host)
            const next =
                bridged.length > 0
                    ? bridged
                    : getCMSRecordRoots(host)
                          .map(parseCMSProject)
                          .filter((project): project is Project =>
                              Boolean(project)
                          )

            if (!next.length) return

            const signature = next
                .map((project) =>
                    [
                        project.title,

                        project.category,
                        project.statement,
                        project.mediaType,
                        project.image,
                        project.video,
                        project.fallbackImage,
                        project.projectLink,
                        project.openInNewTab,
                    ].join("|")
                )
                .join("::")

            if (signature === cmsSignatureRef.current) return
            cmsSignatureRef.current = signature
            setCmsProjects(next)
        }

        // Read immediately, then once more after Framer hydrates collection
        // images and text. MutationObserver handles later CMS updates.
        read()

        if (
            isStaticRenderer ||
            typeof window === "undefined" ||
            typeof MutationObserver === "undefined"
        ) {
            return
        }

        let pendingReadFrame = 0
        const scheduleRead = () => {
            if (pendingReadFrame) return
            pendingReadFrame = window.requestAnimationFrame(() => {
                pendingReadFrame = 0
                read()
            })
        }

        const frame = window.requestAnimationFrame(read)
        const timers = [120, 700].map((delay) =>
            window.setTimeout(scheduleRead, delay)
        )
        const observer = new MutationObserver(scheduleRead)
        observer.observe(host, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: [
                "src",
                "srcset",
                "href",
                "class",
                "style",
                "aria-label",
                "data-framer-name",
                "data-framer-component-type",
                "data-value",
                "data-text",
                "data-video-url",
            ],
        })

        return () => {
            window.cancelAnimationFrame(frame)
            if (pendingReadFrame) {
                window.cancelAnimationFrame(pendingReadFrame)
            }
            timers.forEach((timer) => window.clearTimeout(timer))
            observer.disconnect()
        }
    }, [source, content, isStaticRenderer, cmsProjects.length])

    React.useEffect(() => {
        setIndex(0)
    }, [source, cmsProjects.length])

    const slides =
        source === "CMS"
            ? cmsProjects.length > 0
                ? cmsProjects
                : DEFAULT_PROJECTS
            : projects?.length > 0
              ? projects
              : DEFAULT_PROJECTS

    const cmsIsLoading =
        source === "CMS" && !isStaticRenderer && cmsProjects.length === 0

    const [index, setIndex] = React.useState(0)

    const [direction, setDirection] = React.useState(1)

    const [paused, setPaused] = React.useState(false)

    const [hovered, setHovered] = React.useState(false)

    const pointerStart = React.useRef<number | null>(null)

    const total = slides.length

    const safeIndex = total > 0 ? Math.min(index, total - 1) : 0

    const active = slides[safeIndex]

    const activeMediaType = active?.mediaType === "video" ? "video" : "image"
    const activeVideo = active?.video || ""
    const activeImage = active?.image || active?.fallbackImage || ""
    const activeFallbackImage = active?.fallbackImage || active?.image || ""

    React.useEffect(() => {
        const video = activeVideoRef.current
        if (!video || activeMediaType !== "video" || !activeVideo) return

        if (!isInViewport) {
            video.pause()
            return
        }

        const playPromise = video.play()
        playPromise?.catch(() => {
            // Autoplay can still be rejected by the browser; muted playback is
            // requested above, so no user-facing error is needed here.
        })

        return () => video.pause()
    }, [activeMediaType, activeVideo, isInViewport, safeIndex])

    const hasProjectLink = Boolean(active?.projectLink?.trim())
    const projectLinkTarget = active?.openInNewTab ? "_blank" : "_self"
    const projectLinkRel = active?.openInNewTab
        ? "noopener noreferrer"
        : undefined

    const visibleThumbnailCount = Math.min(
        Math.max(1, Math.floor(thumbnailLimit)),
        total
    )

    const visibleProjects = Array.from(
        {
            length: visibleThumbnailCount,
        },
        (_, position) => {
            const projectIndex = (safeIndex + position) % total

            return {
                project: slides[projectIndex],
                projectIndex,
            }
        }
    )

    const goTo = React.useCallback(
        (target: number, requestedDirection?: number) => {
            if (total < 2) return

            const next = ((target % total) + total) % total

            if (next === safeIndex) return

            const motionDirection =
                requestedDirection ??
                (safeIndex === total - 1 && next === 0
                    ? 1
                    : safeIndex === 0 && next === total - 1
                      ? -1
                      : next > safeIndex
                        ? 1
                        : -1)

            setDirection(motionDirection)

            setIndex(next)
        },
        [safeIndex, total]
    )

    /**
     * AUTOPLAY
     *
     * Disabled completely in static
     * renderer mode.
     */
    React.useEffect(() => {
        if (isStaticRenderer) return

        if (!autoPlay || paused || hovered || total < 2) {
            return
        }

        const id = window.setTimeout(
            () => goTo(safeIndex + 1, 1),
            Math.max(2, interval) * 1000
        )

        return () => window.clearTimeout(id)
    }, [
        isStaticRenderer,
        autoPlay,
        paused,
        hovered,
        total,
        interval,
        safeIndex,
        goTo,
    ])

    /**
     * TOUCH / DRAG
     */
    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return

        pointerStart.current = event.clientX
    }

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return

        if (pointerStart.current === null) {
            return
        }

        const distance = event.clientX - pointerStart.current

        pointerStart.current = null

        if (Math.abs(distance) < 48) {
            return
        }

        goTo(
            distance < 0 ? safeIndex + 1 : safeIndex - 1,

            distance < 0 ? 1 : -1
        )
    }

    const titleParts = active.title.split(" ")

    const apertureVariants = {
        initial: (entryDirection: number) => ({
            clipPath:
                entryDirection > 0
                    ? "circle(18% at 82% 50%)"
                    : "circle(18% at 18% 50%)",
            scale: 1.34,
            opacity: 0.96,
        }),
        animate: {
            clipPath: "circle(150% at 50% 50%)",
            scale: 1,
            opacity: 1,
        },
        exit: {
            clipPath: "circle(150% at 50% 50%)",
            opacity: 0,
            scale: 1.08,
        },
    }

    const componentStyle = {
        ...style,

        "--ar-spine": panelColor,

        "--ar-accent": accentColor,

        "--ar-spine-width": `${panelWidth}%`,

        "--ar-left-bg": showLeftContentBackground
            ? leftContentBackground
            : "transparent",

        "--ar-content-padding": `${contentPadding}px`,

        "--ar-thumb-count": visibleThumbnailCount,
    } as React.CSSProperties

    const cmsContentHost =
        source === "CMS" ? (
            <div
                ref={cmsHostRef}
                aria-hidden="true"
                style={{
                    // Keep a real-width host so Framer resolves responsive CMS
                    // variants and does not hide text fields on narrow layouts.
                    position: "fixed",
                    width: 1440,
                    minWidth: 1440,
                    height: 1200,
                    left: -10000,
                    top: 0,
                    overflow: "visible",
                    opacity: 0.001,
                    visibility: "visible",
                    pointerEvents: "none",
                    zIndex: -1,
                }}
            >
                {content}
            </div>
        ) : null

    /**
     * STATIC RENDERER
     *
     * Simple non-animated preview.
     */
    if (isStaticRenderer) {
        return (
            <div
                className="aperture-relay is-static"
                style={componentStyle}
                aria-busy={cmsIsLoading}
            >
                <style>{componentStyles}</style>

                <div className="ar-stage">
                    {activeMediaType === "video" ? (
                        <div
                            className="ar-image ar-static-media"
                            style={{
                                backgroundImage: `url(${activeFallbackImage || activeImage})`,
                            }}
                            role="img"
                            aria-label={active.title}
                        />
                    ) : (
                        <div
                            className="ar-image ar-static-media"
                            style={{
                                backgroundImage: `url(${activeImage || activeFallbackImage})`,
                            }}
                            role="img"
                            aria-label={active.title}
                        />
                    )}

                    <div className="ar-wash" />
                </div>

                <aside
                    className="ar-spine"
                    aria-label="Current project details"
                >
                    <div className="ar-copy">
                        <p
                            style={fontCSS(categoryFont, {
                                fontFamily: "DM Sans, Arial, sans-serif",
                                fontSize: 9,
                                fontWeight: 500,
                                letterSpacing: 0.13,
                                lineHeight: 1.2,
                                textTransform: "uppercase",
                            })}
                        >
                            {active.category}
                        </p>

                        <h1
                            style={fontCSS(titleFont, {
                                fontFamily: "Manrope, Arial, sans-serif",
                                fontSize: 72,
                                fontWeight: 400,
                                letterSpacing: -0.098,
                                lineHeight: 0.84,
                                textTransform: "none",
                            })}
                        >
                            {hasProjectLink ? (
                                <a
                                    href={active.projectLink}
                                    target={projectLinkTarget}
                                    rel={projectLinkRel}
                                    className="ar-title-link"
                                >
                                    {titleParts[0]}
                                    {titleParts.length > 1 && (
                                        <span>
                                            {titleParts.slice(1).join(" ")}
                                        </span>
                                    )}
                                </a>
                            ) : (
                                <>
                                    {titleParts[0]}
                                    {titleParts.length > 1 && (
                                        <span>
                                            {titleParts.slice(1).join(" ")}
                                        </span>
                                    )}
                                </>
                            )}
                        </h1>

                        {hasProjectLink && (
                            <a
                                href={active.projectLink}
                                target={projectLinkTarget}
                                rel={projectLinkRel}
                                className="ar-project-button"
                                style={fontCSS(buttonFont, {
                                    fontFamily: "DM Sans, Arial, sans-serif",
                                    fontSize: 11,
                                    fontWeight: 500,
                                    letterSpacing: 0,
                                    lineHeight: 1.2,
                                    textTransform: "none",
                                })}
                            >
                                {buttonText}
                                <Arrow />
                            </a>
                        )}
                    </div>

                    <div className="ar-note">
                        <p
                            style={fontCSS(statementFont, {
                                fontFamily: "DM Sans, Arial, sans-serif",
                                fontSize: 12,
                                fontWeight: 400,
                                letterSpacing: 0,
                                lineHeight: 1.55,
                                textTransform: "none",
                            })}
                        >
                            {active.statement}
                        </p>
                    </div>

                    <div className="ar-spine-controls">
                        <button
                            type="button"
                            aria-label="Previous project"
                            disabled
                        >
                            <Arrow direction="left" />
                        </button>

                        <button
                            type="button"
                            aria-label="Pause autoplay"
                            disabled
                        >
                            <PauseIcon />
                        </button>

                        <button
                            type="button"
                            aria-label="Next project"
                            disabled
                        >
                            <Arrow />
                        </button>
                    </div>
                </aside>

                {showThumbnails && (
                    <section className="ar-dock" aria-label="Select a project">
                        <div className="ar-dock-head">
                            <span
                                style={fontCSS(thumbnailFont, {
                                    fontFamily: "DM Sans, Arial, sans-serif",
                                    fontSize: 10,
                                    fontWeight: 500,
                                    letterSpacing: 0,
                                    lineHeight: 1.2,
                                    textTransform: "none",
                                })}
                            >
                                {selectedProjectsLabel}
                            </span>
                        </div>

                        <div className="ar-cells">
                            {visibleProjects.map(
                                ({ project, projectIndex }) => (
                                    <button
                                        className={
                                            projectIndex === safeIndex
                                                ? "is-active"
                                                : ""
                                        }
                                        key={`${project.title}-${projectIndex}`}
                                        type="button"
                                        disabled
                                    >
                                        <span
                                            className="ar-cell-image"
                                            style={{
                                                backgroundImage: `url(${project.image})`,
                                            }}
                                        />

                                        <b
                                            style={fontCSS(thumbnailFont, {
                                                fontFamily:
                                                    "DM Sans, Arial, sans-serif",
                                                fontSize: 10,
                                                fontWeight: 500,
                                                letterSpacing: 0,
                                                lineHeight: 1.2,
                                                textTransform: "none",
                                            })}
                                        >
                                            {project.title}
                                        </b>
                                    </button>
                                )
                            )}
                        </div>
                    </section>
                )}

                {cmsContentHost}
            </div>
        )
    }

    /**
     * LIVE RENDERER
     */
    return (
        <div
            ref={rootRef}
            className="aperture-relay"
            style={componentStyle}
            aria-busy={cmsIsLoading}
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                    goTo(safeIndex + 1, 1)
                }

                if (event.key === "ArrowLeft") {
                    goTo(safeIndex - 1, -1)
                }
            }}
        >
            <style>{componentStyles}</style>

            {/* FULL-BLEED IMAGE */}
            <section
                className="ar-stage"
                aria-label="Architecture project image"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
            >
                <AnimatePresence mode="sync" initial={false} custom={direction}>
                    {activeMediaType === "video" && activeVideo ? (
                        <motion.video
                            ref={activeVideoRef}
                            key={`video-${safeIndex}`}
                            className="ar-media-video ar-live-video"
                            src={activeVideo}
                            poster={activeFallbackImage || undefined}
                            autoPlay={isInViewport}
                            muted
                            loop
                            playsInline
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35 }}
                            aria-label={active.title}
                        />
                    ) : (
                        <motion.div
                            key={`image-${safeIndex}`}
                            className="ar-image"
                            variants={apertureVariants}
                            custom={direction}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{
                                duration: 1.04,
                                ease: [0.77, 0, 0.175, 1],
                            }}
                            style={{
                                backgroundImage: `url(${activeImage})`,
                            }}
                            role="img"
                            aria-label={active.title}
                        />
                    )}
                </AnimatePresence>

                <div className="ar-wash" />
            </section>

            {/* LEFT CONTENT */}
            <aside className="ar-spine" aria-label="Current project details">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        className="ar-copy"
                        key={`copy-${safeIndex}`}
                        initial={{
                            y: 24,
                            opacity: 0,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                        }}
                        exit={{
                            y: -16,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.48,
                            ease: [0.23, 1, 0.32, 1],
                        }}
                    >
                        <p
                            style={fontCSS(categoryFont, {
                                fontFamily: "DM Sans, Arial, sans-serif",
                                fontSize: 9,
                                fontWeight: 500,
                                letterSpacing: 0.13,
                                lineHeight: 1.2,
                                textTransform: "uppercase",
                            })}
                        >
                            {active.category}
                        </p>

                        <h1
                            style={fontCSS(titleFont, {
                                fontFamily: "Manrope, Arial, sans-serif",
                                fontSize: 72,
                                fontWeight: 400,
                                letterSpacing: -0.098,
                                lineHeight: 0.84,
                                textTransform: "none",
                            })}
                        >
                            {hasProjectLink ? (
                                <a
                                    href={active.projectLink}
                                    target={projectLinkTarget}
                                    rel={projectLinkRel}
                                    className="ar-title-link"
                                >
                                    {titleParts[0]}
                                    {titleParts.length > 1 && (
                                        <span>
                                            {titleParts.slice(1).join(" ")}
                                        </span>
                                    )}
                                </a>
                            ) : (
                                <>
                                    {titleParts[0]}
                                    {titleParts.length > 1 && (
                                        <span>
                                            {titleParts.slice(1).join(" ")}
                                        </span>
                                    )}
                                </>
                            )}
                        </h1>

                        {hasProjectLink ? (
                            <a
                                href={active.projectLink}
                                target={projectLinkTarget}
                                rel={projectLinkRel}
                                className="ar-project-button"
                                style={fontCSS(buttonFont, {
                                    fontFamily: "DM Sans, Arial, sans-serif",
                                    fontSize: 11,
                                    fontWeight: 500,
                                    letterSpacing: 0,
                                    lineHeight: 1.2,
                                    textTransform: "none",
                                })}
                            >
                                {buttonText}
                                <Arrow />
                            </a>
                        ) : null}
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        className="ar-note"
                        key={`note-${safeIndex}`}
                        initial={{
                            y: 12,
                            opacity: 0,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                        }}
                        exit={{
                            y: -8,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.34,
                            ease: [0.23, 1, 0.32, 1],
                        }}
                    >
                        <p
                            style={fontCSS(statementFont, {
                                fontFamily: "DM Sans, Arial, sans-serif",
                                fontSize: 12,
                                fontWeight: 400,
                                letterSpacing: 0,
                                lineHeight: 1.55,
                                textTransform: "none",
                            })}
                        >
                            {active.statement}
                        </p>
                    </motion.div>
                </AnimatePresence>

                <div className="ar-spine-controls">
                    <button
                        type="button"
                        onClick={() => goTo(safeIndex - 1, -1)}
                        aria-label="Previous project"
                    >
                        <Arrow direction="left" />
                    </button>

                    <button
                        type="button"
                        onClick={() => setPaused((state) => !state)}
                        aria-label={
                            paused ? "Resume autoplay" : "Pause autoplay"
                        }
                        aria-pressed={paused}
                    >
                        {paused ? <PlayIcon /> : <PauseIcon />}
                    </button>

                    <button
                        type="button"
                        onClick={() => goTo(safeIndex + 1, 1)}
                        aria-label="Next project"
                    >
                        <Arrow />
                    </button>
                </div>
            </aside>

            {/* THUMBNAILS */}
            {showThumbnails && (
                <section className="ar-dock" aria-label="Select a project">
                    <div className="ar-dock-head">
                        <span
                            style={fontCSS(thumbnailFont, {
                                fontFamily: "DM Sans, Arial, sans-serif",
                                fontSize: 10,
                                fontWeight: 500,
                                letterSpacing: 0,
                                lineHeight: 1.2,
                                textTransform: "none",
                            })}
                        >
                            {selectedProjectsLabel}
                        </span>
                    </div>

                    <div className="ar-cells">
                        {visibleProjects.map(({ project, projectIndex }) => (
                            <button
                                className={
                                    projectIndex === safeIndex
                                        ? "is-active"
                                        : ""
                                }
                                key={`${project.title}-${projectIndex}`}
                                type="button"
                                onClick={() => goTo(projectIndex)}
                                aria-label={`Show ${project.title}`}
                            >
                                <span
                                    className="ar-cell-image"
                                    style={{
                                        backgroundImage: `url(${project.image})`,
                                    }}
                                />

                                <b
                                    style={fontCSS(thumbnailFont, {
                                        fontFamily:
                                            "DM Sans, Arial, sans-serif",
                                        fontSize: 10,
                                        fontWeight: 500,
                                        letterSpacing: 0,
                                        lineHeight: 1.2,
                                        textTransform: "none",
                                    })}
                                >
                                    {project.title}
                                </b>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {cmsContentHost}
        </div>
    )
}

ApertureSlider.defaultProps = {
    source: "Manual",
    content: null,
    projects: DEFAULT_PROJECTS,
    selectedProjectsLabel: "Selected projects",
    buttonText: "Follow the threshold",

    autoPlay: true,

    interval: 7.2,

    panelWidth: 28,

    panelColor: "#29180f",

    accentColor: "#d6b978",

    showLeftContentBackground: true,

    leftContentBackground: "#29180f",

    /*
     * ONE PADDING CONTROL
     */
    contentPadding: 52,

    categoryFont: {
        fontFamily: "DM Sans",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: 0.13,
        lineHeight: 1.2,
        textTransform: "uppercase",
    },

    titleFont: {
        fontFamily: "Manrope",
        fontSize: 72,
        fontWeight: 400,
        letterSpacing: -0.098,
        lineHeight: 0.84,
        textTransform: "none",
    },

    statementFont: {
        fontFamily: "DM Sans",
        fontSize: 12,
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 1.55,
        textTransform: "none",
    },

    buttonFont: {
        fontFamily: "DM Sans",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0,
        lineHeight: 1.2,
        textTransform: "none",
    },

    thumbnailFont: {
        fontFamily: "DM Sans",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: 0,
        lineHeight: 1.2,
        textTransform: "none",
    },

    showThumbnails: true,

    thumbnailLimit: 3,
}

addPropertyControls(ApertureSlider, {
    source: {
        type: ControlType.Enum,
        title: "Data source",
        options: ["Manual", "CMS"],
        optionTitles: ["Manual projects", "Framer CMS"],
        defaultValue: "Manual",
    },

    content: {
        type: ControlType.ComponentInstance,
        title: "CMS collection",
        hidden: (props) => props.source !== "CMS",
    },

    selectedProjectsLabel: {
        type: ControlType.String,
        title: "Selected projects text",
        defaultValue: "Selected projects",
    },

    buttonText: {
        type: ControlType.String,
        title: "Button text",
        defaultValue: "Follow the threshold",
    },

    projects: {
        type: ControlType.Array,

        title: "Projects",
        hidden: (props) => props.source === "CMS",

        control: {
            type: ControlType.Object,

            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                },

                category: {
                    type: ControlType.String,
                    title: "Category",
                },

                statement: {
                    type: ControlType.String,
                    title: "Statement",
                    displayTextArea: true,
                },

                mediaType: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (props) => props.mediaType === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.mediaType !== "video",
                },
                fallbackImage: {
                    type: ControlType.Image,
                    title: "Image fallback",
                    hidden: (props) => props.mediaType !== "video",
                },
                projectLink: {
                    type: ControlType.Link,
                    title: "Project link",
                },
                openInNewTab: {
                    type: ControlType.Boolean,
                    title: "Open in new tab",
                    defaultValue: true,
                    hidden: (props) => !props.projectLink,
                },
            },
        },
    },

    autoPlay: {
        type: ControlType.Boolean,

        title: "Autoplay",

        defaultValue: true,
    },

    interval: {
        type: ControlType.Number,

        title: "Interval",

        defaultValue: 7.2,

        min: 2,
        max: 20,
        step: 0.5,

        unit: "s",
    },

    panelWidth: {
        type: ControlType.Number,

        title: "Spine width",

        defaultValue: 28,

        min: 22,
        max: 48,
        step: 1,

        unit: "%",
    },

    panelColor: {
        type: ControlType.Color,

        title: "Spine",

        defaultValue: "#29180f",
    },

    accentColor: {
        type: ControlType.Color,

        title: "Accent",

        defaultValue: "#d6b978",
    },

    showLeftContentBackground: {
        type: ControlType.Boolean,

        title: "Content background",

        defaultValue: true,
    },

    leftContentBackground: {
        type: ControlType.Color,

        title: "Background color",

        defaultValue: "#29180f",

        hidden: (props) => !props.showLeftContentBackground,
    },

    /**
     * ONLY PADDING CONTROL
     */
    contentPadding: {
        type: ControlType.Number,

        title: "Content padding",

        defaultValue: 52,

        min: 0,
        max: 120,
        step: 1,

        unit: "px",
    },

    categoryFont: {
        type: ControlType.Font,

        title: "Category typography",

        controls: "extended",

        defaultValue: {
            fontFamily: "DM Sans",

            fontSize: 9,

            letterSpacing: 0.13,

            lineHeight: 1.2,

            textTransform: "uppercase",
        },
    },

    titleFont: {
        type: ControlType.Font,

        title: "Title typography",

        controls: "extended",

        defaultValue: {
            fontFamily: "Manrope",

            fontSize: 72,

            letterSpacing: -0.098,

            lineHeight: 0.84,

            textTransform: "none",
        },
    },

    statementFont: {
        type: ControlType.Font,

        title: "Statement typography",

        controls: "extended",

        defaultValue: {
            fontFamily: "DM Sans",

            fontSize: 12,

            letterSpacing: 0,

            lineHeight: 1.55,

            textTransform: "none",
        },
    },

    buttonFont: {
        type: ControlType.Font,

        title: "Button typography",

        controls: "extended",

        defaultValue: {
            fontFamily: "DM Sans",

            fontSize: 11,

            letterSpacing: 0,

            lineHeight: 1.2,

            textTransform: "none",
        },
    },

    thumbnailFont: {
        type: ControlType.Font,

        title: "Thumbnail typography",

        controls: "extended",

        defaultValue: {
            fontFamily: "DM Sans",

            fontSize: 10,

            letterSpacing: 0,

            lineHeight: 1.2,

            textTransform: "none",
        },
    },

    showThumbnails: {
        type: ControlType.Boolean,

        title: "Project dock",

        defaultValue: true,
    },

    thumbnailLimit: {
        type: ControlType.Number,

        title: "Thumbnail limit",

        defaultValue: 3,

        min: 1,
        max: 8,
        step: 1,
    },
})

const componentStyles = `
.aperture-relay {
    --ar-ink: #f0ebdf;
    --ar-muted: rgba(240,235,223,.64);

    background: #120d09;

    color: var(--ar-ink);

    display: block;

    width: 100%;
    height: 100%;

    min-width: 320px;
    min-height: 580px;

    overflow: hidden;

    position: relative;

    font-family:
        DM Sans,
        Arial,
        sans-serif;

    pointer-events: auto;
}

.aperture-relay * {
    box-sizing: border-box;
}

/* =================================================
   FULL-BLEED IMAGE
================================================= */

.ar-stage {
    position: absolute;

    inset: 0;

    width: 100%;
    height: 100%;

    min-width: 0;
    min-height: 0;

    overflow: hidden;

    z-index: 0;
}

.ar-media-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    pointer-events: none;
}

.ar-live-video {
    background: #120d09;
}

.ar-title-link,
.ar-project-button {
    color: inherit;
    text-decoration: none;
}

.ar-title-link span {
    display: block;
}

.ar-project-button {
    align-items: center;
    background: transparent;
    border: 0;
    cursor: pointer;
    display: inline-flex;
    gap: 14px;
    margin-top: 28px;
    padding: 0;
    position: relative;
    transition: transform .35s cubic-bezier(.22,1,.36,1), opacity .25s ease;
}

.ar-project-button::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -7px;
    width: calc(100% - 34px);
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform .4s cubic-bezier(.22,1,.36,1);
}

.ar-project-button:hover { transform: translateX(5px); opacity: 1; }
.ar-project-button:hover::after { transform: scaleX(1); }
.ar-project-button svg { transition: transform .4s cubic-bezier(.22,1,.36,1); }
.ar-project-button:hover svg { transform: translateX(6px); }

.ar-image {
    position: absolute;

    inset: 0;

    width: 100%;
    height: 100%;

    min-width: 100%;
    min-height: 100%;

    background-position:
        center center;

    background-repeat:
        no-repeat;

    background-size:
        cover;

    transform-origin:
        center center;

    z-index: 0;

    pointer-events: none;
}

.ar-wash {
    position: absolute;

    inset: 0;

    width: 100%;
    height: 100%;

    background:
        rgba(9,5,2,.18);

    pointer-events: none;

    z-index: 1;
}

/* =================================================
   LEFT SPINE
================================================= */

.ar-spine {
    position: absolute;

    top: 0;
    left: 0;

    width:
        max(
            300px,
            var(--ar-spine-width)
        );

    height: 100%;

    padding:
        var(--ar-content-padding);

    background:
        var(--ar-left-bg);

    display: flex;

    flex-direction: column;

    overflow: hidden;

    z-index: 4;
}

.ar-copy {
    margin:
        auto 0 0;

    position: relative;

    z-index: 1;
}

.ar-copy > p,
.ar-dock-head {
    color:
        var(--ar-muted);

    margin: 0;
}

.ar-copy h1 {
    margin:
        18px 0 0;

    text-wrap:
        balance;
}

.ar-copy h1 span {
    display: block;
}

.ar-copy button {
    align-items: center;

    background:
        transparent;

    border: 0;

    color:
        var(--ar-ink);

    cursor:
        pointer;

    display:
        inline-flex;

    gap: 14px;

    margin-top:
        28px;

    padding: 0;

    position: relative;

    transition:
        transform .35s
        cubic-bezier(
            .22,
            1,
            .36,
            1
        ),

        opacity .25s ease;
}

.ar-copy button::after {
    content: "";

    position: absolute;

    left: 0;

    bottom: -7px;

    width:
        calc(
            100% - 34px
        );

    height: 1px;

    background:
        currentColor;

    transform:
        scaleX(0);

    transform-origin:
        left center;

    transition:
        transform .4s
        cubic-bezier(
            .22,
            1,
            .36,
            1
        );
}

.ar-copy button svg {
    transition:
        transform .4s
        cubic-bezier(
            .22,
            1,
            .36,
            1
        );
}

.ar-copy button:hover {
    opacity: 1;

    transform:
        translateX(5px);
}

.ar-copy button:hover::after {
    transform:
        scaleX(1);
}

.ar-copy button:hover svg {
    transform:
        translateX(6px);
}

.ar-copy button:focus-visible {
    outline:
        1px solid currentColor;

    outline-offset:
        6px;
}

/* =================================================
   ICONS
================================================= */

.ar-copy svg,
.ar-spine-controls svg {
    fill: none;

    width: 20px;
    height: 20px;

    stroke:
        currentColor;

    stroke-linecap:
        round;

    stroke-linejoin:
        round;

    stroke-width:
        1.35;
}

.ar-spine-controls
button:nth-child(2)
svg {
    width: 18px;
    height: 18px;
}

/* =================================================
   DESCRIPTION
================================================= */

.ar-note {
    margin:
        clamp(
            38px,
            7vh,
            88px
        )
        0
        0;

    max-width:
        320px;

    padding: 0;

    position:
        relative;

    z-index: 1;
}

.ar-note p {
    margin:
        0 0 15px;
}

/* =================================================
   CONTROLS
================================================= */

.ar-spine-controls {
    align-items:
        center;

    display:
        flex;

    gap:
        16px;

    margin-top:
        24px;

    position:
        relative;

    z-index:
        10;

    pointer-events:
        auto;
}

.ar-spine-controls button {
    align-items:
        center;

    justify-content:
        center;

    background:
        transparent;

    border:
        0;

    color:
        var(--ar-ink);

    cursor:
        pointer;

    display:
        inline-flex;

    opacity:
        .8;

    padding:
        0;

    position:
        relative;

    z-index:
        11;

    pointer-events:
        auto;

    transition:
        opacity .18s ease,
        transform .18s ease;
}

.ar-spine-controls
button:hover {
    opacity:
        1;

    transform:
        translateX(3px);
}

.ar-spine-controls
button:first-child:hover {
    transform:
        translateX(-3px);
}

/* =================================================
   THUMBNAIL DOCK
================================================= */

.ar-dock {
    position:
        absolute;

    bottom:
        var(--ar-content-padding);

    left:
        max(
            330px,
            calc(
                var(--ar-spine-width) +
                var(--ar-content-padding)
            )
        );

    right:
        var(--ar-content-padding);

    padding:
        0;

    z-index:
        3;
}

.ar-dock-head {
    margin-bottom:
        11px;
}

.ar-cells {
    display:
        grid;

    gap:
        10px;

    grid-template-columns:
        repeat(
            var(--ar-thumb-count),
            minmax(
                0,
                1fr
            )
        );
}

.ar-cells button {
    background:
        transparent;

    border:
        0;

    color:
        var(--ar-ink);

    cursor:
        pointer;

    min-width:
        0;

    padding:
        0;

    text-align:
        left;
}

.ar-cell-image {
    display:
        block;

    width:
        100%;

    height:
        clamp(
            68px,
            8.5vh,
            100px
        );

    background-position:
        center;

    background-size:
        cover;

    filter:
        saturate(.64)
        brightness(.67);

    transition:
        filter .28s ease,
        transform .28s ease;
}

.ar-cells button b {
    display:
        block;

    margin-top:
        8px;

    opacity:
        .58;

    overflow:
        hidden;

    text-overflow:
        ellipsis;

    white-space:
        nowrap;
}

.ar-cells
button:hover
.ar-cell-image,

.ar-cells
button.is-active
.ar-cell-image {
    filter:
        saturate(1)
        brightness(1);

    transform:
        translateY(-4px);
}

.ar-cells
button:hover b,

.ar-cells
button.is-active b {
    opacity:
        1;
}

/* =================================================
   STATIC RENDERER
================================================= */

.aperture-relay.is-static .ar-static-media {
    opacity: 1;
    clip-path: inset(0);
    transform: none;
}

.aperture-relay.is-static .ar-media-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    pointer-events: none;
}

.ar-live-video {
    background: #120d09;
}

.ar-title-link,
.ar-project-button {
    color: inherit;
    text-decoration: none;
}

.ar-title-link span {
    display: block;
}

.ar-project-button {
    align-items: center;
    background: transparent;
    border: 0;
    cursor: pointer;
    display: inline-flex;
    gap: 14px;
    margin-top: 28px;
    padding: 0;
    position: relative;
    transition: transform .35s cubic-bezier(.22,1,.36,1), opacity .25s ease;
}

.ar-project-button::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -7px;
    width: calc(100% - 34px);
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform .4s cubic-bezier(.22,1,.36,1);
}

.ar-project-button:hover { transform: translateX(5px); opacity: 1; }
.ar-project-button:hover::after { transform: scaleX(1); }
.ar-project-button svg { transition: transform .4s cubic-bezier(.22,1,.36,1); }
.ar-project-button:hover svg { transform: translateX(6px); }

.aperture-relay.is-static
.ar-image {
    transform:
        none !important;

    opacity:
        1 !important;

    clip-path:
        inset(0) !important;
}

/* =================================================
   MOBILE
================================================= */

@media(max-width:760px) {

    .aperture-relay {
        width:
            100%;

        min-width:
            0;

        min-height:
            620px;

        overflow:
            hidden;
    }

    /*
     * Image remains completely
     * full-bleed on mobile.
     */
    .ar-stage {
        position:
            absolute;

        inset:
            0;

        width:
            100%;

        height:
            100%;

        min-width:
            0;

        min-height:
            0;
    }

    .ar-media-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    pointer-events: none;
}

.ar-live-video {
    background: #120d09;
}

.ar-title-link,
.ar-project-button {
    color: inherit;
    text-decoration: none;
}

.ar-title-link span {
    display: block;
}

.ar-project-button {
    align-items: center;
    background: transparent;
    border: 0;
    cursor: pointer;
    display: inline-flex;
    gap: 14px;
    margin-top: 28px;
    padding: 0;
    position: relative;
    transition: transform .35s cubic-bezier(.22,1,.36,1), opacity .25s ease;
}

.ar-project-button::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -7px;
    width: calc(100% - 34px);
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform .4s cubic-bezier(.22,1,.36,1);
}

.ar-project-button:hover { transform: translateX(5px); opacity: 1; }
.ar-project-button:hover::after { transform: scaleX(1); }
.ar-project-button svg { transition: transform .4s cubic-bezier(.22,1,.36,1); }
.ar-project-button:hover svg { transform: translateX(6px); }

.ar-image {
        position:
            absolute;

        inset:
            0;

        width:
            100%;

        height:
            100%;

        min-width:
            100%;

        min-height:
            100%;

        background-size:
            cover;

        background-position:
            center center;
    }

    /*
     * Mobile content overlays
     * the full-bleed image.
     */
    .ar-spine {
        top:
            0;

        left:
            0;

        width:
            100%;

        height:
            100%;

        padding:
            var(--ar-content-padding);

        background:
            var(--ar-left-bg);

        z-index:
            20;

        pointer-events:
            none;
    }

    .ar-copy {
        margin:
            0;

        padding-top:
            19vh;
    }

    .ar-copy button {
        pointer-events:
            auto;
    }

    .ar-note {
        position:
            absolute;

        left:
            var(--ar-content-padding);

        bottom:
            calc(
                var(--ar-content-padding) +
                178px
            );

        margin:
            0;

        max-width:
            calc(
                100% -
                (
                    var(--ar-content-padding) *
                    2
                )
            );
    }

    .ar-spine-controls {
        position:
            absolute;

        right:
            var(--ar-content-padding);

        bottom:
            var(--ar-content-padding);

        margin:
            0;

        z-index:
            30;

        pointer-events:
            auto;
    }

    .ar-spine-controls button {
        width:
            32px;

        height:
            32px;

        min-width:
            32px;

        min-height:
            32px;

        touch-action:
            manipulation;

        pointer-events:
            auto;
    }

    /*
     * Thumbnail dock overlays
     * the full image.
     */
    .ar-dock {
        position:
            absolute;

        left:
            var(--ar-content-padding);

        right:
            0;

        bottom:
            calc(
                var(--ar-content-padding) +
                47px
            );

        z-index:
            25;
    }

    .ar-dock-head {
        margin-right:
            var(--ar-content-padding);
    }

    .ar-cells {
        display:
            flex;

        gap:
            10px;

        overflow-x:
            auto;

        padding-right:
            var(--ar-content-padding);

        padding-bottom:
            7px;

        scrollbar-width:
            none;
    }

    .ar-cells::-webkit-scrollbar {
        display:
            none;
    }

    .ar-cells button {
        flex:
            0 0 142px;
    }

    .ar-cell-image {
        width:
            100%;

        height:
            82px;
    }
}

/* =================================================
   VERY SMALL SCREENS
================================================= */

@media(max-width:420px) {

    .ar-copy {
        padding-top:
            15vh;
    }

    .ar-copy h1 {
        font-size:
            min(
                18vw,
                62px
            );
    }

    .ar-note {
        bottom:
            calc(
                var(--ar-content-padding) +
                165px
            );
    }

    .ar-cells button {
        flex:
            0 0 125px;
    }

    .ar-cell-image {
        height:
            72px;
    }
}
`
