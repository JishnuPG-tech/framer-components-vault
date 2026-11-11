import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMotionValue, useMotionValueEvent, animate } from "framer-motion"

/**
 * Scroll-based timeline: drop this whole file in as a Framer
 * Code Component (Insert -> Code -> New Code File -> paste over
 * everything). Drag it onto the canvas and set its height to
 * "500vh" (or whatever N * 100vh matches your section count).
 *
 * Controls are grouped in the right panel:
 * - Items: the timeline content
 * - Typography: all fonts + label opacity
 * - Layout: frame, corner radius, inset, padding, header width
 * - Scroll: total scroll height + scroll transition
 */

type TimelineItem = {
    bg: string
    fg: string
    eyebrow: string
    desc: string
    year: string
}

type Typography = {
    labelFont: any
    labelOpacity: number
    descFont: any
    yearFont: any
}

type Layout = {
    frameBackground: string
    cornerRadius: number
    frameInset: number
    panelPadding: string
    headerMaxWidth: number
}

type Scroll = {
    totalScrollHeight: string
    scrollTransition: any
}

type Props = {
    items: TimelineItem[]
    typography: Typography
    layout: Layout
    scroll: Scroll
}

export default function ScrollTimeline(props: Props) {
    const { items, typography, layout, scroll } = props

    const { labelFont, labelOpacity, descFont, yearFont } = typography
    const {
        frameBackground,
        cornerRadius,
        frameInset,
        panelPadding,
        headerMaxWidth,
    } = layout
    const { totalScrollHeight, scrollTransition } = scroll

    const wrapRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    // Motion value that gets animated toward the raw scroll progress
    // using the chosen scrollTransition (spring by default).
    const progress = useMotionValue(0)

    useEffect(() => {
        if (isStatic) return

        const wrap = wrapRef.current
        if (!wrap) return

        const panels = Array.from(wrap.querySelectorAll<HTMLElement>(".panel"))
        const n = panels.length

        function applyAt(raw: number) {
            const scaled = Math.min(n - 1, Math.max(0, raw))
            const idx = Math.min(n - 2, Math.floor(scaled))
            const t = scaled - idx

            panels.forEach((panel, i) => {
                const year = panel.querySelector<HTMLElement>(".year")
                if (!year) return

                if (i < idx) {
                    panel.style.clipPath = "inset(0 0 0 100%)"
                    year.style.transform = "rotate(-90deg)"
                } else if (i === idx) {
                    const visible = 1 - t
                    panel.style.clipPath = `inset(0 ${(1 - visible) * 100}% 0 0)`
                    year.style.transform = `rotate(${-90 * t}deg)`
                } else if (i === idx + 1) {
                    const visible = t
                    panel.style.clipPath = `inset(0 0 0 ${(1 - visible) * 100}%)`
                    year.style.transform = "rotate(0deg)"
                } else {
                    panel.style.clipPath = "inset(0 0 0 100%)"
                    year.style.transform = "rotate(0deg)"
                }
                panel.style.zIndex = String(i)
            })
        }

        function update() {
            const rect = wrap!.getBoundingClientRect()
            const total = wrap!.offsetHeight - window.innerHeight
            let raw = total > 0 ? -rect.top / total : 0
            raw = Math.min(1, Math.max(0, raw))
            const scaled = raw * (n - 1)

            animate(progress, scaled, scrollTransition)
        }

        window.addEventListener("scroll", update, { passive: true })
        window.addEventListener("resize", update)
        applyAt(0)
        update()

        const unsubscribe = progress.on
            ? progress.on("change", applyAt)
            : undefined

        return () => {
            window.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)
            if (unsubscribe) unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, scrollTransition])

    // Fallback subscription hook (kept separate so it works even if
    // progress.on above isn't available in a given runtime).
    useMotionValueEvent(progress, "change", (v) => {
        if (isStatic) return
        const wrap = wrapRef.current
        if (!wrap) return
        const panels = Array.from(wrap.querySelectorAll<HTMLElement>(".panel"))
        const n = panels.length
        if (!n) return
        const scaled = Math.min(n - 1, Math.max(0, v))
        const idx = Math.min(n - 2, Math.floor(scaled))
        const t = scaled - idx
        panels.forEach((panel, i) => {
            const year = panel.querySelector<HTMLElement>(".year")
            if (!year) return
            if (i < idx) {
                panel.style.clipPath = "inset(0 0 0 100%)"
                year.style.transform = "rotate(-90deg)"
            } else if (i === idx) {
                const visible = 1 - t
                panel.style.clipPath = `inset(0 ${(1 - visible) * 100}% 0 0)`
                year.style.transform = `rotate(${-90 * t}deg)`
            } else if (i === idx + 1) {
                const visible = t
                panel.style.clipPath = `inset(0 0 0 ${(1 - visible) * 100}%)`
                year.style.transform = "rotate(0deg)"
            } else {
                panel.style.clipPath = "inset(0 0 0 100%)"
                year.style.transform = "rotate(0deg)"
            }
            panel.style.zIndex = String(i)
        })
    })

    const sections = items

    const sharedStyle = `
        .frame{
            position: sticky;
            top: ${frameInset}px;
            height: calc(100vh - ${frameInset * 2}px);
            margin: 0 ${frameInset}px;
            border-radius: ${cornerRadius}px;
            overflow: hidden;
            background:${frameBackground};
        }
        .panel{
            position:absolute;
            inset:0;
            clip-path: inset(0 0 0 100%);
        }
        .panel-inner{
            position:relative;
            height:100%;
            padding: ${panelPadding};
            display:flex;
            flex-direction:column;
            justify-content:space-between;
            box-sizing:border-box;
        }
        .panel-header{
            align-self:flex-end;
            max-width: ${headerMaxWidth}px;
            text-align:left;
        }
        .eyebrow{
            display:block;
            text-transform:uppercase;
            opacity:${labelOpacity};
            margin-bottom:10px;
        }
        .desc{
            margin:0;
        }
        .year{
            margin:0;
            transform-origin: left bottom;
            will-change: transform;
        }
    `

    // Static (canvas/export) fallback: no listeners, no animation,
    // just the first panel shown as a plain styled element.
    if (isStatic) {
        const first = sections[0]
        return (
            <div
                ref={wrapRef}
                className="timeline"
                style={{ height: totalScrollHeight }}
            >
                <style>{sharedStyle}</style>
                <div className="frame">
                    <section
                        className="panel"
                        style={{
                            background: first?.bg,
                            color: first?.fg,
                            clipPath: "inset(0 0 0 0)",
                        }}
                    >
                        <div className="panel-inner">
                            <div className="panel-header">
                                <span className="eyebrow" style={labelFont}>
                                    {first?.eyebrow}
                                </span>
                                <p className="desc" style={descFont}>
                                    {first?.desc}
                                </p>
                            </div>
                            <h2 className="year" style={yearFont}>
                                {first?.year}
                            </h2>
                        </div>
                    </section>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={wrapRef}
            className="timeline"
            style={{ height: totalScrollHeight }}
        >
            <style>{sharedStyle}</style>

            <div className="frame">
                {sections.map((s, i) => (
                    <section
                        key={i}
                        className="panel"
                        style={{ background: s.bg, color: s.fg }}
                    >
                        <div className="panel-inner">
                            <div className="panel-header">
                                <span className="eyebrow" style={labelFont}>
                                    {s.eyebrow}
                                </span>
                                <p className="desc" style={descFont}>
                                    {s.desc}
                                </p>
                            </div>
                            <h2 className="year" style={yearFont}>
                                {s.year}
                            </h2>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}

ScrollTimeline.defaultProps = {
    items: [
        {
            bg: "#151515",
            fg: "#f2f2f2",
            eyebrow: "01/ Origins of the web",
            desc: "A network of static, text-first pages connected by hyperlinks. No design system existed yet — just documents, linked together.",
            year: "1991",
        },
        {
            bg: "#ff4433",
            fg: "#151515",
            eyebrow: "02/ First graphical browser",
            desc: "The release of Mosaic, the first widely-used graphical web browser, made the internet accessible to non-technical users. Websites became visual and interactive.",
            year: "1993",
        },
        {
            bg: "#aeeaf6",
            fg: "#151515",
            eyebrow: "03/ Social media rise",
            desc: "The rise of social media platforms redefined online interaction and content sharing. The internet evolved into a social space, connecting people worldwide.",
            year: "2004",
        },
        {
            bg: "#0b0b0b",
            fg: "#beeaf6",
            eyebrow: "04/ Smartphones & mobile web",
            desc: "The launch of smartphones revolutionized how people access the internet, putting powerful web browsing and apps in everyone's pocket.",
            year: "2007",
        },
        {
            bg: "#7c5cff",
            fg: "#101014",
            eyebrow: "05/ AI-powered web",
            desc: "Generative interfaces and AI copilots began shaping how pages are built and browsed, turning static sites into responsive, conversational experiences.",
            year: "2023",
        },
    ],
    typography: {
        labelFont: {
            fontFamily: "JetBrains Mono",
            fontWeight: 400,
            fontSize: 18,
            letterSpacing: "0.14em",
            lineHeight: "1.2em",
        },
        labelOpacity: 0.65,
        descFont: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 24,
            lineHeight: "1.55em",
        },
        yearFont: {
            fontFamily: "Archivo Black",
            fontWeight: 900,
            fontSize: 250,
            lineHeight: "0.78em",
        },
    },
    layout: {
        frameBackground: "#000000",
        cornerRadius: 12,
        frameInset: 26,
        // top right bottom left
        panelPadding: "48px 48px 24px 24px",
        headerMaxWidth: 420,
    },
    scroll: {
        totalScrollHeight: "500vh",
        scrollTransition: {
            type: "spring",
            stiffness: 450,
            damping: 50,
            mass: 1,
            delay: 0,
        },
    },
}

addPropertyControls(ScrollTimeline, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                eyebrow: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "01/ Section label",
                },
                desc: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Description text goes here.",
                    displayTextArea: true,
                },
                year: {
                    type: ControlType.String,
                    title: "Big Text",
                    defaultValue: "2024",
                },
                bg: {
                    type: ControlType.Color,
                    title: "Background",
                    defaultValue: "#151515",
                },
                fg: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#f2f2f2",
                },
            },
        },
        minCount: 2,
    },

    // ---- Typography (all fonts in one group) ----
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            labelFont: {
                type: ControlType.Font,
                title: "Label Font",
                controls: "extended",
            },
            labelOpacity: {
                type: ControlType.Number,
                title: "Label Opacity",
                min: 0,
                max: 1,
                step: 0.05,
            },
            descFont: {
                type: ControlType.Font,
                title: "Desc Font",
                controls: "extended",
            },
            yearFont: {
                type: ControlType.Font,
                title: "Big Text Font",
                controls: "extended",
            },
        },
    },

    // ---- Layout ----
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            frameBackground: {
                type: ControlType.Color,
                title: "Frame Background",
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            frameInset: {
                type: ControlType.Number,
                title: "Frame Inset",
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            panelPadding: {
                type: ControlType.Padding,
                title: "Panel Padding",
            },
            headerMaxWidth: {
                type: ControlType.Number,
                title: "Header Max Width",
                min: 100,
                max: 900,
                step: 10,
                unit: "px",
            },
        },
    },

    // ---- Scroll (length + feel) ----
    scroll: {
        type: ControlType.Object,
        title: "Scroll",
        controls: {
            totalScrollHeight: {
                type: ControlType.String,
                title: "Total Scroll Height",
                description:
                    "Should roughly equal (item count × 100vh) for even pacing.",
            },
            scrollTransition: {
                type: ControlType.Transition,
                title: "Scroll Transition",
                description:
                    "Spring by default. Set duration to 0 with a tween for an instant, 1:1 scroll-linked reveal.",
            },
        },
    },
})
