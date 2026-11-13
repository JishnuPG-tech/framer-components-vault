import * as React from "react"
import { useState, useRef, useLayoutEffect, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Text Swap on Hover
 *
 *
 *
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 30
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TextSwapOnHover(props) {
    const {
        textA,
        textB,
        font,
        colorA,
        colorB,
        direction,
        duration,
        stagger,
        easing,
        link,
        openInNewTab,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const [hovered, setHovered] = useState(false)
    const [width, setWidth] = useState<number | undefined>(undefined)
    const [reduceMotion, setReduceMotion] = useState(false)
    const [inView, setInView] = useState(false)

    const wrapperRef = useRef<HTMLElement>(null)
    const rowA = useRef<HTMLSpanElement>(null)
    const rowB = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (isStatic) return
        const el = wrapperRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduceMotion(mq.matches)
        const onChange = () => setReduceMotion(mq.matches)
        mq.addEventListener?.("change", onChange)
        return () => mq.removeEventListener?.("change", onChange)
    }, [isStatic])

    useLayoutEffect(() => {
        if (isStatic || !inView) return
        const measure = () => {
            const a = rowA.current?.offsetWidth ?? 0
            const b = rowB.current?.offsetWidth ?? 0
            const next = hovered ? b : a
            if (next) setWidth(next)
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        if (rowA.current) ro.observe(rowA.current)
        if (rowB.current) ro.observe(rowB.current)
        return () => ro.disconnect()
    }, [isStatic, inView, hovered, textA, textB, font])

    const dir = direction === "up" ? 1 : -1
    const offset = 115

    const dur = reduceMotion || isStatic ? 0 : duration
    const step = reduceMotion || isStatic ? 0 : stagger

    const justify =
        font?.textAlign === "center"
            ? "center"
            : font?.textAlign === "right"
              ? "flex-end"
              : "flex-start"

    const renderRow = (
        text: string,
        isHoverRow: boolean,
        ref: React.RefObject<HTMLSpanElement>,
        color: string
    ) => {
        const chars = Array.from(text || "")

        const active = isHoverRow ? hovered : !hovered
        const hiddenY = isHoverRow ? dir * offset : -dir * offset
        return (
            <span
                ref={ref}
                aria-hidden="true"
                style={{
                    gridArea: "1 / 1",
                    display: "flex",
                    width: "max-content",
                    justifySelf: justify,
                    color,
                    whiteSpace: "pre",
                }}
            >
                {chars.map((ch, i) => (
                    <span
                        key={i}
                        style={{
                            display: "inline-block",
                            transform: `translateY(${active ? 0 : hiddenY}%)`,
                            transition: `transform ${dur}s ${easing} ${i * step}s`,
                            willChange:
                                inView && !isStatic ? "transform" : "auto",
                        }}
                    >
                        {ch === " " ? "\u00A0" : ch}
                    </span>
                ))}
            </span>
        )
    }

    const Wrapper: any = link ? "a" : "span"
    const wrapperProps = link
        ? {
              href: link,
              target: openInNewTab ? "_blank" : undefined,
              rel: openInNewTab ? "noopener noreferrer" : undefined,
          }
        : {}

    if (isStatic) {
        return (
            <Wrapper
                {...wrapperProps}
                aria-label={textA}
                style={{
                    ...style,
                    lineHeight: 1.2,
                    ...font,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: justify,
                    width: "100%",
                    height: "100%",
                    textDecoration: "none",
                    color: colorA,
                    whiteSpace: "pre",
                    userSelect: "none",
                }}
            >
                {textA}
            </Wrapper>
        )
    }

    return (
        <Wrapper
            ref={wrapperRef}
            {...wrapperProps}
            aria-label={textA}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setHovered(true)}
            onBlur={() => setHovered(false)}
            style={{
                ...style,
                lineHeight: 1.2,
                ...font,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: justify,
                width: "100%",
                height: "100%",
                textDecoration: "none",
                outline: "none",
                cursor: link ? "pointer" : "default",
                userSelect: "none",
            }}
        >
            <span
                style={{
                    display: "grid",
                    overflow: "hidden",

                    padding: "0.12em 0",
                    margin: "-0.12em 0",
                    width: width,
                    transition: `width ${dur + 0.1}s ${easing}`,
                    justifyItems: justify,
                }}
            >
                {renderRow(textA, false, rowA, colorA)}
                {renderRow(textB, true, rowB, colorB)}
            </span>
        </Wrapper>
    )
}

TextSwapOnHover.defaultProps = {
    textA: "Contact",
    textB: "Let’s talk",
    colorA: "#111111",
    colorB: "#111111",
    direction: "up",
    duration: 0.55,
    stagger: 0.025,
    easing: "cubic-bezier(0.65, 0, 0.35, 1)",
    openInNewTab: false,
}

addPropertyControls(TextSwapOnHover, {
    // — Text —
    textA: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Contact",
    },
    textB: {
        type: ControlType.String,
        title: "Hover Text",
        defaultValue: "Let’s talk",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            fontWeight: 500,
        },
    },

    // — Color —
    colorA: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
    },
    colorB: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#111111",
    },

    // — Animation —
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        defaultValue: "up",
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.55,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 0.12,
        step: 0.005,
        defaultValue: 0.025,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "cubic-bezier(0.65, 0, 0.35, 1)",
            "cubic-bezier(0.22, 1, 0.36, 1)",
            "cubic-bezier(0.34, 1.56, 0.64, 1)",
            "ease-in-out",
            "linear",
        ],
        optionTitles: [
            "Smooth",
            "Fast then slow",
            "Bouncy",
            "Ease in-out",
            "Linear",
        ],
        defaultValue: "cubic-bezier(0.65, 0, 0.35, 1)",
    },

    // — Link —
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (props) => !props.link,
    },
})
