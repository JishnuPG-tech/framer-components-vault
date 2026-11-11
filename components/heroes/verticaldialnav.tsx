// Vertical scroll-linked dial menu with fading for distant items
// Links to scroll sections, highlights current, fades others by distance
import {
    useEffect,
    useRef,
    useState,
    useCallback,
    startTransition,
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


interface Section {
    id: string
    label: string
}

interface VerticalDialNavProps {
    sections: Section[]
    activeColor: string
    fadeDistance: number
    font: any
    dialWidth: number
    dialRadius: number
    itemSpacing: number
    alignment: "left" | "center" | "right"
    style?: React.CSSProperties
}

/**
 * VerticalDialNav
 *
 * Vertical text menu that links to scroll sections within a page. The subnav scrolls vertically to match the current selected scroll section and fades menu items further away from the current selected scroll section. Like a vertical dial to navigate to the specific section of the page.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VerticalDialNav(props: VerticalDialNavProps) {
    const {
        sections = [
            { id: "section-1", label: "Section 1" },
            { id: "section-2", label: "Section 2" },
            { id: "section-3", label: "Section 3" },
            { id: "section-4", label: "Section 4" },
            { id: "section-5", label: "Section 5" },
        ],
        activeColor,
        fadeDistance,
        font,
        dialWidth,
        dialRadius,
        itemSpacing,
        alignment,
        style,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const ticking = useRef(false)

    // Listen for scroll and update activeIndex
    useEffect(() => {
        function onScroll() {
            if (ticking.current) return
            ticking.current = true
            requestAnimationFrame(() => {
                let found = 0
                for (let i = 0; i < sections.length; i++) {
                    const el = document.getElementById(sections[i].id)
                    if (el) {
                        const rect = el.getBoundingClientRect()
                        if (rect.top <= window.innerHeight * 0.3) {
                            found = i
                        }
                    }
                }
                startTransition(() => setActiveIndex(found))
                ticking.current = false
            })
        }
        if (typeof window !== "undefined") {
            window.addEventListener("scroll", onScroll, { passive: true })
            onScroll()
            return () => window.removeEventListener("scroll", onScroll)
        }
    }, [sections])

    // Scroll to section
    const handleClick = useCallback(
        (id: string, idx: number) => (e: React.MouseEvent) => {
            e.preventDefault()
            const el = document.getElementById(id)
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" })
                if (idx !== activeIndex) {
                    startTransition(() => setActiveIndex(idx))
                }
            }
        },
        [activeIndex]
    )

    // Magnetic scroll: center the active item in the dial
    const dialRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
    useEffect(() => {
        if (!dialRef.current || !itemRefs.current[activeIndex]) return
        itemRefs.current[activeIndex].scrollIntoView({
            behavior: "smooth",
            block: "center",
        })
    }, [activeIndex, sections.length])

    // Fade function
    function getOpacity(idx: number) {
        const dist = Math.abs(idx - activeIndex)
        if (dist === 0) return 1
        if (dist > fadeDistance) return 0.2
        return 1 - (dist / (fadeDistance + 1)) * 0.8
    }

    return (
        <nav
            style={{
                ...style,
                width: dialWidth,
                height: "100%",
                minWidth: dialWidth,
                background: "none",
                borderRadius: dialRadius,
                display: "flex",
                flexDirection: "column",
                alignItems:
                    alignment === "left"
                        ? "flex-start"
                        : alignment === "right"
                          ? "flex-end"
                          : "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
                boxShadow: "none",
            }}
            aria-label="Section navigation"
        >
            <div
                ref={dialRef}
                style={{
                    width: "100%",
                    height: "100%",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems:
                        alignment === "left"
                            ? "flex-start"
                            : alignment === "right"
                              ? "flex-end"
                              : "center",
                    justifyContent: "center",
                    gap: Math.max(0, itemSpacing),
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    paddingRight: alignment === "right" ? 8 : 0,
                    paddingLeft: alignment === "left" ? 8 : 0,
                }}
                tabIndex={0}
            >
                {sections.map((section, idx) => (
                    <a
                        ref={(el) => (itemRefs.current[idx] = el)}
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={handleClick(section.id, idx)}
                        style={{
                            color:
                                idx === activeIndex ? activeColor : "#000000",
                            ...font,
                            opacity: getOpacity(idx),
                            transition:
                                "opacity 0.4s cubic-bezier(.4,0,.2,1), color 0.4s cubic-bezier(.4,0,.2,1), transform 0.4s cubic-bezier(.4,0,.2,1), font-variation-settings 0.4s cubic-bezier(.4,0,.2,1)",
                            padding: 0,
                            width: "100%",
                            textAlign: alignment,
                            cursor: "pointer",
                            userSelect: "none",
                            textDecoration: "none",
                            fontWeight: idx === activeIndex ? 500 : 400,
                            fontVariationSettings:
                                idx === activeIndex
                                    ? '"wght" 500'
                                    : '"wght" 400',
                            fontSize: font?.fontSize || 18,
                            borderRadius: 6,
                            background: "transparent",
                            outline: "none",
                            transform:
                                idx === activeIndex
                                    ? "scale(1.06)"
                                    : "scale(1)",
                            WebkitFontSmoothing: "antialiased",
                            MozOsxFontSmoothing: "grayscale",
                            willChange:
                                "opacity, color, transform, font-variation-settings",
                            minHeight: 0,
                            lineHeight: 1,
                            boxSizing: "border-box",
                            paddingRight: 0,
                            paddingLeft: 0,
                            margin: 0,
                        }}
                        aria-current={idx === activeIndex ? "true" : undefined}
                        tabIndex={0}
                        role="link"
                    >
                        {section.label}
                    </a>
                ))}
            </div>
        </nav>
    )
}

addPropertyControls(VerticalDialNav, {
    sections: {
        type: ControlType.Array,
        title: "Sections",
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    title: "Section ID",
                    defaultValue: "section-1",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Section 1",
                },
            },
        },
        defaultValue: [
            { id: "section-1", label: "Section 1" },
            { id: "section-2", label: "Section 2" },
            { id: "section-3", label: "Section 3" },
            { id: "section-4", label: "Section 4" },
            { id: "section-5", label: "Section 5" },
        ],
        maxCount: 50,
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#000000",
    },

    fadeDistance: {
        type: ControlType.Number,
        title: "Fade Distance",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    dialWidth: {
        type: ControlType.Number,
        title: "Dial Width",
        defaultValue: 80,
        min: 40,
        max: 200,
        step: 1,
        unit: "px",
    },
    dialRadius: {
        type: ControlType.Number,
        title: "Dial Radius",
        defaultValue: 24,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },

    itemSpacing: {
        type: ControlType.Number,
        title: "Item Spacing",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
})
