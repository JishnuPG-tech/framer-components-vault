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


// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any
// @framerIntrinsicWidth 160
// @framerIntrinsicHeight 56
// @framerDisableUnlink

type Project = {
    mediaType?: "image" | "video"
    video?: string
    image?: { src: string; srcSet?: string; alt?: string }
    url?: string
    title?: string
    link?: string
}

// Bare domains like "mysite.com/case-study" are treated by the browser as relative
// paths (-> 404), so give them a protocol. Everything else is left untouched.
function normalizeLink(raw?: string): string | undefined {
    if (!raw) return undefined
    const s = String(raw).trim()
    if (!s) return undefined
    if (/^(https?:|mailto:|tel:|#|\/|\.{1,2}\/)/i.test(s)) return s
    if (/^[^\s\/]+\.[a-z]{2,}(\/|$|\?|#)/i.test(s)) return "https://" + s
    return s
}

type Props = {
    chip?: React.ReactNode
    label: string
    chipBackground: string
    chipColor: string
    chipRadius: number
    chipShadow: string
    hoverFill: boolean
    chipHoverBackground: string
    chipHoverOpacity: number
    padY: number
    padYTablet: number
    padYMobile: number
    font: React.CSSProperties
    projects: Project[]
    size: number
    distance: number
    stretch: number
    startAngle: number
    endAngle: number
    radius: number
    shadow: string
    showTitle: boolean
    captionColor: string
    stagger: number
    closeDelay: number
    openNewTab: boolean
    previewOpen: boolean
    autoScale: boolean
    tabletScale: number
    mobileScale: number
    tabletMaxWidth: number
    mobileMaxWidth: number
    canvasDevice: "desktop" | "tablet" | "mobile"
    style?: React.CSSProperties
}

function CircleVideo({
    src,
    playing,
    title,
}: {
    src: string
    playing: boolean
    title?: string
}) {
    // "#t=0.001" makes the browser show the first frame while paused (static fallback)
    const frameSrc = src.includes("#") ? src : src + "#t=0.001"
    const ref = React.useRef<HTMLVideoElement>(null)
    React.useEffect(() => {
        const v = ref.current
        if (!v) return
        if (playing) {
            const r = v.play()
            if (r && r.catch) r.catch(() => {})
        } else {
            v.pause()
        }
    }, [playing])
    return (
        <video
            ref={ref}
            src={frameSrc}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={title}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
            }}
        />
    )
}

/**
 * Chip Projects
 * Hover (or tap) a chip to fan out image-links to the projects in that category.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ChipProjects(props: Props) {
    const {
        chip,
        label,
        chipBackground,
        chipColor,
        chipRadius,
        chipShadow,
        hoverFill,
        chipHoverBackground,
        chipHoverOpacity,
        padY,
        padYTablet,
        padYMobile,
        font,
        projects,
        size,
        distance,
        stretch,
        startAngle,
        endAngle,
        radius,
        shadow,
        showTitle,
        captionColor,
        stagger,
        closeDelay,
        openNewTab,
        previewOpen,
        autoScale,
        tabletScale,
        mobileScale,
        tabletMaxWidth,
        mobileMaxWidth,
        canvasDevice,
        style,
    } = props

    const wrapRef = React.useRef<HTMLDivElement>(null)
    const timer = React.useRef<number | undefined>(undefined)
    const [open, setOpen] = React.useState(false)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const show = isCanvas ? previewOpen : open

    const reduced =
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // No animated transitions when statically rendered or when the visitor prefers reduced motion
    const noMotion = reduced || isStatic

    // Unique class so the responsive scale can be done in CSS (no flash on load)
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const cls = "cp" + uid

    // Tablet / phone widths and touch-only devices use tap instead of hover
    const [narrow, setNarrow] = React.useState(false)
    const [noHover, setNoHover] = React.useState(false)
    React.useEffect(() => {
        if (!window.matchMedia) return
        const a = window.matchMedia(`(max-width: ${tabletMaxWidth}px)`)
        const b = window.matchMedia("(hover: none)")
        const update = () => {
            setNarrow(a.matches)
            setNoHover(b.matches)
        }
        update()
        a.addEventListener("change", update)
        b.addEventListener("change", update)
        return () => {
            a.removeEventListener("change", update)
            b.removeEventListener("change", update)
        }
    }, [tabletMaxWidth])
    const tapMode = !isCanvas && (narrow || noHover)

    const canvasScale = !autoScale
        ? 1
        : canvasDevice === "tablet"
          ? tabletScale
          : canvasDevice === "mobile"
            ? mobileScale
            : 1
    // Padding is entered as the on-screen size, so compensate for the scale
    const comp = (v: number, k: number) =>
        Math.round((v / (autoScale ? k : 1)) * 100) / 100
    const padRule = (v: number, k: number) =>
        `padding-top:${comp(v, k)}px;padding-bottom:${comp(v, k)}px`
    const padCls = cls + "p"
    const canvasPad =
        canvasDevice === "tablet"
            ? comp(padYTablet, tabletScale)
            : canvasDevice === "mobile"
              ? comp(padYMobile, mobileScale)
              : comp(padY, 1)

    const scaleCss = !isCanvas
        ? `.${cls}b:focus-visible,.${cls} a:focus-visible{outline:2px solid #0A84FF;outline-offset:3px}` +
          `.${padCls}{${padRule(padY, 1)}}` +
          `@media (max-width:${tabletMaxWidth}px){` +
          `.${padCls}{${padRule(padYTablet, tabletScale)}}` +
          (autoScale ? `.${cls}{transform:scale(${tabletScale})}` : "") +
          `}` +
          `@media (max-width:${mobileMaxWidth}px){` +
          `.${padCls}{${padRule(padYMobile, mobileScale)}}` +
          (autoScale ? `.${cls}{transform:scale(${mobileScale})}` : "") +
          `}`
        : ""

    const openNow = () => {
        window.clearTimeout(timer.current)
        setOpen(true)
    }
    // Small delay so the pointer can cross the gap between chip and circles
    const closeSoon = () => {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setOpen(false), closeDelay)
    }

    React.useEffect(() => () => window.clearTimeout(timer.current), [])

    // Touch devices: tap the chip to toggle, tap anywhere else to close
    React.useEffect(() => {
        if (!open) return
        const onDown = (e: PointerEvent) => {
            if (!tapMode && e.pointerType === "mouse") return
            if (
                wrapRef.current &&
                !wrapRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener("pointerdown", onDown)
        return () => document.removeEventListener("pointerdown", onDown)
    }, [open, tapMode])

    // Tap/click toggles in tap mode; a keyboard "click" (Enter / Space, detail 0) always toggles
    const onChipClick = (e: React.MouseEvent) => {
        if (tapMode || e.detail === 0) setOpen((o) => !o)
    }
    const onRootKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false)
    }

    // Make a dropped-in chip fill this component's frame
    const chipNode =
        chip && React.Children.count(chip) > 0 ? (
            React.Children.map(chip, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(child as React.ReactElement<any>, {
                          style: {
                              ...(child.props as any).style,
                              width: "100%",
                              height: "100%",
                          },
                      })
                    : child
            )
        ) : (
            <div
                className={padCls}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingLeft: 24,
                    paddingRight: 24,
                    ...(isCanvas
                        ? { paddingTop: canvasPad, paddingBottom: canvasPad }
                        : {}),
                    boxSizing: "border-box",
                    background:
                        show && hoverFill
                            ? chipHoverBackground
                            : chipBackground,
                    boxShadow: chipShadow,
                    transition: noMotion ? "none" : "background 200ms ease",
                    color: chipColor,
                    borderRadius: chipRadius,
                    whiteSpace: "nowrap",
                    ...font,
                }}
            >
                {label}
            </div>
        )

    const n = projects.length

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                position: "relative",
                overflow: "visible",
                zIndex: show ? 50 : 1,
            }}
        >
            {scaleCss ? <style>{scaleCss}</style> : null}
            <div
                className={cls}
                onPointerEnter={(e) => {
                    if (!tapMode && e.pointerType !== "touch") openNow()
                }}
                onPointerLeave={(e) => {
                    if (!tapMode && e.pointerType !== "touch") closeSoon()
                }}
                onFocus={() => {
                    if (!tapMode) openNow()
                }}
                onBlur={() => {
                    if (!tapMode) closeSoon()
                }}
                onKeyDown={onRootKeyDown}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformOrigin: "50% 50%",
                    transform:
                        isCanvas && canvasScale !== 1
                            ? `scale(${canvasScale})`
                            : undefined,
                }}
            >
                <button
                    type="button"
                    className={cls + "b"}
                    aria-expanded={show}
                    onClick={onChipClick}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        cursor: "pointer",
                        margin: 0,
                        padding: 0,
                        border: "none",
                        background: "none",
                        font: "inherit",
                        color: "inherit",
                        textAlign: "inherit",
                        appearance: "none",
                        WebkitAppearance: "none",
                        opacity: show ? chipHoverOpacity : 1,
                        transition: noMotion ? "none" : "opacity 200ms ease",
                    }}
                >
                    {chipNode}
                </button>

                {/* Anchor at the chip's center; circles are positioned from here */}
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 0,
                        height: 0,
                        pointerEvents: "none",
                    }}
                    aria-hidden={!show}
                >
                    {projects.map((p, i) => {
                        const angle =
                            n === 1
                                ? (startAngle + endAngle) / 2
                                : startAngle +
                                  ((endAngle - startAngle) * i) / (n - 1)
                        const rad = (angle * Math.PI) / 180
                        const x = Math.sin(rad) * distance * stretch
                        const y = -Math.cos(rad) * distance

                        const imageSrc =
                            typeof p.image === "string"
                                ? (p.image as string)
                                : p.image?.src
                        const isVideo = p.mediaType === "video"
                        const src = p.url || (isVideo ? p.video : imageSrc)

                        const circleStyle: React.CSSProperties = {
                            position: "absolute",
                            left: -size / 2,
                            top: -size / 2,
                            width: size,
                            height: size,
                            borderRadius: radius,
                            display: "block",
                            background: "#DADADA",
                            boxShadow: shadow,
                            transform: show
                                ? `translate(${x}px, ${y}px) scale(1)`
                                : "translate(0px, 0px) scale(0.2)",
                            opacity: show ? 1 : 0,
                            pointerEvents: show ? "auto" : "none",
                            transition: noMotion
                                ? "none"
                                : `transform 420ms cubic-bezier(0.34, 1.4, 0.64, 1) ${
                                      show ? i * stagger : 0
                                  }ms, opacity 220ms ease ${show ? i * stagger : 0}ms`,
                            willChange: "transform, opacity",
                            textDecoration: "none",
                        }

                        const inner = (
                            <>
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: radius,
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#111",
                                        ...font,
                                    }}
                                >
                                    {src && isVideo ? (
                                        <CircleVideo
                                            src={src}
                                            playing={
                                                show && !isCanvas && !isStatic
                                            }
                                            title={p.title}
                                        />
                                    ) : src ? (
                                        <img
                                            src={src}
                                            srcSet={
                                                p.url
                                                    ? undefined
                                                    : p.image?.srcSet
                                            }
                                            alt={p.title || p.image?.alt || ""}
                                            draggable={false}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    ) : (
                                        p.title || "Project"
                                    )}
                                </div>
                                {showTitle && src && p.title ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            marginTop: 8,
                                            whiteSpace: "nowrap",
                                            color: captionColor,
                                            ...font,
                                        }}
                                    >
                                        {p.title}
                                    </div>
                                ) : null}
                            </>
                        )

                        const href = normalizeLink(p.link)

                        return href ? (
                            <a
                                key={i}
                                href={href}
                                target={openNewTab ? "_blank" : undefined}
                                rel={
                                    openNewTab
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                aria-label={p.title || "Project"}
                                tabIndex={show ? 0 : -1}
                                style={circleStyle}
                            >
                                {inner}
                            </a>
                        ) : (
                            <div key={i} style={circleStyle}>
                                {inner}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

ChipProjects.defaultProps = {
    label: "Startups",
    chipBackground: "#AEF0F7",
    chipColor: "#2B2B2B",
    chipRadius: 999,
    chipShadow: "0px 8px 20px rgba(0,0,0,0.12)",
    hoverFill: false,
    chipHoverBackground: "#8BE3EE",
    chipHoverOpacity: 1,
    padY: 8,
    padYTablet: 6,
    padYMobile: 4,
    projects: [{ title: "Project" }, { title: "Project" }],
    size: 96,
    distance: 120,
    stretch: 1.2,
    startAngle: -40,
    endAngle: 40,
    radius: 999,
    shadow: "0px 10px 24px rgba(0,0,0,0.12)",
    showTitle: true,
    captionColor: "#2B2B2B",
    stagger: 60,
    closeDelay: 180,
    openNewTab: false,
    previewOpen: true,
    autoScale: true,
    tabletScale: 0.6,
    mobileScale: 0.4,
    tabletMaxWidth: 1199,
    mobileMaxWidth: 809,
    canvasDevice: "desktop",
}

addPropertyControls(ChipProjects, {
    chip: {
        type: ControlType.ComponentInstance,
        title: "Chip",
        description:
            "Drop your existing chip here, or leave empty to use the built-in one.",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        hidden: (p: any) => !!p.chip,
    },
    chipBackground: {
        type: ControlType.Color,
        title: "Chip fill",
        hidden: (p: any) => !!p.chip,
    },
    chipColor: {
        type: ControlType.Color,
        title: "Chip text",
        hidden: (p: any) => !!p.chip,
    },
    chipRadius: {
        type: ControlType.Number,
        title: "Chip radius",
        min: 0,
        max: 999,
        hidden: (p: any) => !!p.chip,
    },
    chipShadow: {
        type: ControlType.BoxShadow,
        title: "Chip shadow",
        hidden: (p: any) => !!p.chip,
    },
    hoverFill: {
        type: ControlType.Boolean,
        title: "Hover fill",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p: any) => !!p.chip,
    },
    chipHoverBackground: {
        type: ControlType.Color,
        title: "Hover color",
        hidden: (p: any) => !!p.chip || !p.hoverFill,
    },
    chipHoverOpacity: {
        type: ControlType.Number,
        title: "Hover opacity",
        min: 0,
        max: 1,
        step: 0.05,
        description: "Chip opacity while the circles are open. 1 = no change.",
    },
    padY: {
        type: ControlType.Number,
        title: "Pad Y desktop",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        description:
            "Top and bottom space inside the built-in chip. Set the chip's height to Fit for it to take effect.",
        hidden: (p: any) => !!p.chip,
    },
    padYTablet: {
        type: ControlType.Number,
        title: "Pad Y tablet",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p: any) => !!p.chip,
    },
    padYMobile: {
        type: ControlType.Number,
        title: "Pad Y phone",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p: any) => !!p.chip,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "16px",
    },
    projects: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image / GIF", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) => p.mediaType === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.mediaType !== "video",
                },
                url: {
                    type: ControlType.String,
                    title: "Or URL",
                    placeholder: "https://… (image or video)",
                },
                title: { type: ControlType.String, title: "Title" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    size: {
        type: ControlType.Number,
        title: "Circle size",
        min: 40,
        max: 300,
        step: 2,
    },
    radius: {
        type: ControlType.Number,
        title: "Circle radius",
        min: 0,
        max: 999,
        step: 1,
    },
    distance: {
        type: ControlType.Number,
        title: "Distance",
        min: 20,
        max: 400,
        step: 2,
        description: "How far the circles sit from the chip's center.",
    },
    stretch: {
        type: ControlType.Number,
        title: "Horizontal stretch",
        min: 0.5,
        max: 3,
        step: 0.05,
    },
    startAngle: {
        type: ControlType.Number,
        title: "Start angle",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
        description: "0° = straight up, 90° = right, 180° = down.",
    },
    endAngle: {
        type: ControlType.Number,
        title: "End angle",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    shadow: { type: ControlType.BoxShadow, title: "Shadow" },
    showTitle: {
        type: ControlType.Boolean,
        title: "Show titles",
        defaultValue: true,
    },
    captionColor: {
        type: ControlType.Color,
        title: "Title color",
        hidden: (p: any) => !p.showTitle,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 300,
        step: 10,
        unit: "ms",
    },
    closeDelay: {
        type: ControlType.Number,
        title: "Close delay",
        min: 0,
        max: 800,
        step: 20,
        unit: "ms",
    },
    openNewTab: {
        type: ControlType.Boolean,
        title: "New tab",
        defaultValue: false,
    },
    autoScale: {
        type: ControlType.Boolean,
        title: "Auto scale",
        defaultValue: true,
        description:
            "Scales the chip and circles down on tablet and phone widths.",
    },
    tabletScale: {
        type: ControlType.Number,
        title: "Tablet scale",
        min: 0.2,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !p.autoScale,
    },
    mobileScale: {
        type: ControlType.Number,
        title: "Phone scale",
        min: 0.2,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !p.autoScale,
    },
    tabletMaxWidth: {
        type: ControlType.Number,
        title: "Tablet max W",
        min: 400,
        max: 2000,
        step: 1,
        unit: "px",
        description:
            "Screens this wide or narrower use tablet scale and tap. Framer default: 1199.",
        hidden: (p: any) => !p.autoScale,
    },
    mobileMaxWidth: {
        type: ControlType.Number,
        title: "Phone max W",
        min: 300,
        max: 1200,
        step: 1,
        unit: "px",
        description:
            "Screens this wide or narrower use phone scale. Framer default: 809.",
        hidden: (p: any) => !p.autoScale,
    },
    canvasDevice: {
        type: ControlType.Enum,
        title: "Canvas preview",
        options: ["desktop", "tablet", "mobile"],
        optionTitles: ["Desktop", "Tablet", "Phone"],
        displaySegmentedControl: true,
        defaultValue: "desktop",
        description:
            "Only changes how it looks on the canvas. The live site uses the screen width.",
        hidden: (p: any) => !p.autoScale,
    },
    previewOpen: {
        type: ControlType.Boolean,
        title: "Show on canvas",
        defaultValue: true,
        description:
            "Keeps the circles visible on the canvas so you can design them. Has no effect on the live site.",
    },
})
