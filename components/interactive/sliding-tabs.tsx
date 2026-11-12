import * as React from "react"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const photo = (id: string) =>
    "https://images.unsplash.com/" +
    id +
    "?fm=jpg&q=80&w=2000&fit=max&auto=format"

interface TabImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface Tab {
    title?: string
    image?: TabImage
}

interface Props {
    tabs: Tab[]
    initialTab: number
    font: React.CSSProperties
    activeColor: string
    inactiveColor: string
    underlineColor: string
    underlineHeight: number
    background: string
    tabGap: number
    barMaxWidth: number
    barPadding: number
    mediaHeight: number
    mediaPadding: number
    mediaRadius: number
    transition: any
    style?: React.CSSProperties
}

const DEFAULT_TABS: Tab[] = [
    {
        title: "Photo editing",
        image: {
            src: photo("photo-1744948961024-66baaafbb5dc"),
            alt: "Photo editing software open on a laptop",
        },
    },
    {
        title: "Coding",
        image: {
            src: photo("photo-1754039984985-ef607d80113a"),
            alt: "Code on a monitor in a dark workspace",
        },
    },
    {
        title: "STEM",
        image: {
            src: photo("photo-1581091007718-0c50d599bfd0"),
            alt: "Petri dish under a laboratory microscope",
        },
    },
    {
        title: "Business",
        image: {
            src: photo("photo-1758518730083-4c12527b6742"),
            alt: "Colleagues in a business meeting",
        },
    },
    {
        title: "Graphic design",
        image: {
            src: photo("photo-1572044162444-ad60f128bdea"),
            alt: "Designer using a drawing tablet and color swatches",
        },
    },
    {
        title: "3D animation and design",
        image: {
            src: photo("photo-1757949673849-4f3c04bfd77d"),
            alt: "3D render of a sphere and scattered cubes",
        },
    },
    {
        title: "Music production",
        image: {
            src: photo("photo-1781865202629-c0ab5921973b"),
            alt: "Recording studio with a mixing console",
        },
    },
    {
        title: "Video editing",
        image: {
            src: photo("photo-1574717024757-c1ec4d86ae82"),
            alt: "Color grading tools in video editing software",
        },
    },
    {
        title: "Gaming",
        image: {
            src: photo("photo-1614179924047-e1ab49a0a0cf"),
            alt: "Gaming desk with a curved monitor and RGB lighting",
        },
    },
]

const CSS =
    ".fst-track{scrollbar-width:none;-ms-overflow-style:none}" +
    ".fst-track::-webkit-scrollbar{display:none}" +
    ".fst-tab{transition:color .25s ease}" +
    ".fst-tab:hover{color:var(--fst-active)!important}" +
    ".fst-tab:focus-visible,.fst-arrow:focus-visible{outline:2px solid var(--fst-active);outline-offset:2px;border-radius:4px}"

/**
 * Sliding Tabs
 * Image gallery with a scrollable tab bar. The active underline slides between
 * tabs and always matches the width of the tab title.
 *
 * @framerIntrinsicWidth 1257
 * @framerIntrinsicHeight 741
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function SlidingTabs(props: Props) {
    const {
        tabs,
        initialTab,
        font,
        activeColor,
        inactiveColor,
        underlineColor,
        underlineHeight,
        background,
        tabGap,
        barMaxWidth,
        barPadding,
        mediaHeight,
        mediaPadding,
        mediaRadius,
        transition,
        style,
    } = props

    const list = Array.isArray(tabs) ? tabs : []
    const count = list.length
    const last = Math.max(count - 1, 0)
    const reducedMotion = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    const reduce = Boolean(reducedMotion) || isStatic
    const uid = React.useId()

    const [selected, setSelected] = useState(() =>
        Math.min(Math.max((initialTab || 1) - 1, 0), last)
    )
    const current = Math.min(selected, last)
    const tab = list[current]

    useEffect(() => {
        setSelected(Math.min(Math.max((initialTab || 1) - 1, 0), last))
    }, [initialTab])

    const trackRef = useRef<HTMLDivElement | null>(null)
    const labelRefs = useRef<(HTMLSpanElement | null)[]>([])
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
    const firstScroll = useRef(true)

    const [line, setLine] = useState<{ x: number; w: number } | null>(null)
    const [edges, setEdges] = useState({ start: true, end: true })

    const titlesKey = list.map((t) => t.title || "").join("|")

    const measure = useCallback(() => {
        const label = labelRefs.current[current]
        if (label) {
            const x = label.offsetLeft
            const w = label.offsetWidth
            setLine((prev) =>
                prev && prev.x === x && prev.w === w ? prev : { x, w }
            )
        }
        const track = trackRef.current
        if (track) {
            const start = track.scrollLeft <= 1
            const end =
                track.scrollLeft + track.clientWidth >= track.scrollWidth - 1
            setEdges((prev) =>
                prev.start === start && prev.end === end ? prev : { start, end }
            )
        }
    }, [current])

    useIsoLayoutEffect(() => {
        measure()
    }, [measure, titlesKey, tabGap, font])

    useEffect(() => {
        const track = trackRef.current
        if (!track) return
        let observer: ResizeObserver | undefined
        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(() => measure())
            observer.observe(track)
            if (track.firstElementChild)
                observer.observe(track.firstElementChild)
        }
        let cancelled = false
        if (
            "fonts" in document &&
            document.fonts &&
            typeof document.fonts.ready.then === "function"
        ) {
            document.fonts.ready.then(() => {
                if (!cancelled) measure()
            })
        }
        window.addEventListener("resize", measure)
        return () => {
            cancelled = true
            if (observer) observer.disconnect()
            window.removeEventListener("resize", measure)
        }
    }, [measure])

    // Keep the active tab in view
    useEffect(() => {
        const track = trackRef.current
        const label = labelRefs.current[current]
        if (!track || !label) return
        const max = Math.max(track.scrollWidth - track.clientWidth, 0)
        const target = Math.min(
            Math.max(
                label.offsetLeft +
                    label.offsetWidth / 2 -
                    track.clientWidth / 2,
                0
            ),
            max
        )
        track.scrollTo({
            left: target,
            behavior: firstScroll.current || reduce ? "auto" : "smooth",
        })
        firstScroll.current = false
    }, [current, titlesKey, reduce])

    // Warm up the neighbouring images
    useEffect(() => {
        ;[current - 1, current + 1].forEach((i) => {
            const item = list[i]
            const src = item && item.image && item.image.src
            if (src) {
                const img = new Image()
                img.src = src
            }
        })
    }, [current])

    const go = (index: number) => {
        if (!count) return
        const next = (index + count) % count
        setSelected(next)
        const el = tabRefs.current[next]
        if (el) el.focus()
    }

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "ArrowRight") {
            event.preventDefault()
            go(current + 1)
        } else if (event.key === "ArrowLeft") {
            event.preventDefault()
            go(current - 1)
        } else if (event.key === "Home") {
            event.preventDefault()
            go(0)
        } else if (event.key === "End") {
            event.preventDefault()
            go(last)
        }
    }

    const scrollTabs = (direction: number) => {
        const track = trackRef.current
        if (!track) return
        track.scrollBy({
            left: direction * track.clientWidth * 0.7,
            behavior: reduce ? "auto" : "smooth",
        })
    }

    const fade = (side: "left" | "right", visible: boolean) => (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                [side]: 0,
                width: 102,
                display: "flex",
                alignItems: "center",
                justifyContent: side === "left" ? "flex-start" : "flex-end",
                pointerEvents: "none",
                background:
                    "linear-gradient(" +
                    (side === "left" ? "270deg" : "90deg") +
                    ", transparent 0%, " +
                    background +
                    " 100%)",
            }}
        >
            <button
                type="button"
                className="fst-arrow"
                aria-label={
                    side === "left" ? "Scroll tabs left" : "Scroll tabs right"
                }
                tabIndex={visible ? 0 : -1}
                aria-hidden={!visible}
                onClick={() => scrollTabs(side === "left" ? -1 : 1)}
                style={{
                    pointerEvents: visible ? "auto" : "none",
                    background: "none",
                    border: 0,
                    margin: 0,
                    padding: 8,
                    cursor: "pointer",
                    display: "flex",
                    color: activeColor,
                }}
            >
                <svg
                    width="10"
                    height="18"
                    viewBox="0 0 10 18"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d={
                            side === "left"
                                ? "M8.5 1.5L1.5 9L8.5 16.5"
                                : "M1.5 1.5L8.5 9L1.5 16.5"
                        }
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </motion.div>
    )

    const image = tab && tab.image

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                ...style,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                background,
                overflow: "hidden",
                boxSizing: "border-box",
                ["--fst-active" as any]: activeColor,
            }}
        >
            <style>{CSS}</style>

            <div
                id={uid + "-panel"}
                role="tabpanel"
                aria-labelledby={uid + "-tab-" + current}
                style={{
                    position: "relative",
                    flex: "1 1 auto",
                    minHeight: 0,
                    height: mediaHeight,
                    padding: mediaPadding,
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {count === 0 && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: inactiveColor,
                                ...font,
                            }}
                        >
                            Add tabs in the properties panel
                        </div>
                    )}
                    <AnimatePresence initial={false}>
                        {tab && (
                            <motion.div
                                key={current}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={
                                    reduce
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.4,
                                              ease: [0.44, 0, 0.56, 1],
                                          }
                                }
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: mediaRadius,
                                    overflow: "hidden",
                                    background: "rgba(255,255,255,0.06)",
                                }}
                            >
                                {image && image.src && (
                                    <img
                                        src={image.src}
                                        srcSet={image.srcSet}
                                        sizes="100vw"
                                        alt={image.alt || tab.title || ""}
                                        draggable={false}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div
                style={{
                    flex: "none",
                    width: "100%",
                    maxWidth: barMaxWidth,
                    margin: "0 auto",
                    padding: "0 " + barPadding + "px",
                    boxSizing: "border-box",
                }}
            >
                <div style={{ position: "relative" }}>
                    <div
                        ref={trackRef}
                        className="fst-track"
                        role="tablist"
                        onScroll={measure}
                        onKeyDown={onKeyDown}
                        style={{ overflowX: "auto", overflowY: "hidden" }}
                    >
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                gap: tabGap,
                                width: "max-content",
                                minWidth: "100%",
                            }}
                        >
                            {list.map((item, i) => {
                                const isActive = i === current
                                return (
                                    <button
                                        key={i}
                                        ref={(el) => {
                                            tabRefs.current[i] = el
                                        }}
                                        id={uid + "-tab-" + i}
                                        type="button"
                                        role="tab"
                                        className="fst-tab"
                                        aria-selected={isActive}
                                        aria-controls={uid + "-panel"}
                                        tabIndex={isActive ? 0 : -1}
                                        onClick={() => setSelected(i)}
                                        style={{
                                            background: "none",
                                            border: 0,
                                            margin: 0,
                                            padding: "16px 0",
                                            cursor: "pointer",
                                            color: isActive
                                                ? activeColor
                                                : inactiveColor,
                                            whiteSpace: "nowrap",
                                            ...font,
                                        }}
                                    >
                                        <span
                                            ref={(el) => {
                                                labelRefs.current[i] = el
                                            }}
                                            style={{ display: "block" }}
                                        >
                                            {item.title}
                                        </span>
                                    </button>
                                )
                            })}

                            {line && (
                                <motion.div
                                    aria-hidden="true"
                                    initial={{ x: line.x, width: line.w }}
                                    animate={{ x: line.x, width: line.w }}
                                    transition={
                                        reduce ? { duration: 0 } : transition
                                    }
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        bottom: 0,
                                        height: underlineHeight,
                                        background: underlineColor,
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>
                    </div>
                    {fade("left", !edges.start)}
                    {fade("right", !edges.end)}
                </div>
            </div>
        </div>
    )
}

SlidingTabs.defaultProps = {
    tabs: DEFAULT_TABS,
    initialTab: 1,
    font: {
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: "17px",
        letterSpacing: "-0.022em",
        lineHeight: "1.25em",
    },
    activeColor: "#FFFFFF",
    inactiveColor: "rgba(255, 255, 255, 0.8)",
    underlineColor: "#FFFFFF",
    underlineHeight: 2,
    background: "#000000",
    tabGap: 48,
    barMaxWidth: 1006,
    barPadding: 24,
    mediaHeight: 687,
    mediaPadding: 48,
    mediaRadius: 32,
    transition: { type: "spring", duration: 0.4, bounce: 0.2 },
}

addPropertyControls(SlidingTabs, {
    tabs: {
        type: ControlType.Array,
        title: "Tabs",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New tab",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
        defaultValue: DEFAULT_TABS as any,
    },
    initialTab: {
        type: ControlType.Number,
        title: "Initial Tab",
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
        defaultValue: 1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: "#FFFFFF",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive",
        defaultValue: "rgba(255, 255, 255, 0.8)",
    },
    underlineColor: {
        type: ControlType.Color,
        title: "Underline",
        defaultValue: "#FFFFFF",
    },
    underlineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 1,
        max: 8,
        step: 1,
        unit: "px",
        defaultValue: 2,
    },
    transition: {
        type: ControlType.Transition,
        title: "Slide",
        defaultValue: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
    tabGap: {
        type: ControlType.Number,
        title: "Tab Gap",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 48,
    },
    barMaxWidth: {
        type: ControlType.Number,
        title: "Bar Max Width",
        min: 280,
        max: 2000,
        step: 2,
        unit: "px",
        defaultValue: 1006,
    },
    barPadding: {
        type: ControlType.Number,
        title: "Bar Padding",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 24,
    },
    mediaHeight: {
        type: ControlType.Number,
        title: "Media Height",
        min: 120,
        max: 1600,
        step: 1,
        unit: "px",
        defaultValue: 687,
    },
    mediaPadding: {
        type: ControlType.Number,
        title: "Media Padding",
        min: 0,
        max: 160,
        step: 2,
        unit: "px",
        defaultValue: 48,
    },
    mediaRadius: {
        type: ControlType.Number,
        title: "Media Radius",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 32,
    },
})
