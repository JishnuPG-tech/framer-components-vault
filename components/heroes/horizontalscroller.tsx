// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useLayoutEffect, useRef, useState } from "react"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 *
 * @framerDisableUnlink
 */

export default function HorizontalScroller(props) {
    const stickyTop = props.top
    const containerOverflow = props.overflow

    const containerRef = useRef(null)
    const scrollRef = useRef(null)
    const sizerRef = useRef(null)
    const [scrollRange, setScrollRange] = useState(0)
    const [contentWidth, setContentWidth] = useState(0)

    useLayoutEffect(() => {
        setScrollRange(scrollRef.current.scrollWidth)

        const onResize = (entries) => {
            for (let entry of entries) {
                setContentWidth(entry.contentRect.width)
                setScrollRange(scrollRef.current.scrollWidth)
            }
        }

        const onStyleChange = (entries) => {
            for (let entry of entries) {
                setScrollRange(scrollRef.current.scrollWidth)
            }
        }

        const resizeObserver = new ResizeObserver(onResize)
        resizeObserver.observe(sizerRef.current)

        const mutationObserver = new MutationObserver(onStyleChange)
        mutationObserver.observe(scrollRef.current, {
            attributes: true,
            attributeFilter: ["style"],
        })

        return () => {
            resizeObserver.disconnect()
            mutationObserver.disconnect()
        }
    }, [])

    const { scrollYProgress } = useScroll({
        target: containerRef,
    })

    const transform = useTransform(
        scrollYProgress,
        [0, 1],
        [0, -scrollRange + contentWidth]
    )

    const physics = { damping: 60, mass: 1, stiffness: 500 }
    const spring = useSpring(transform, physics)

    return (
        <div ref={containerRef} {...props}>
            <div style={{ position: "sticky", top: stickyTop }}>
                <div style={{ overflow: containerOverflow }}>
                    <motion.div ref={scrollRef} style={{ x: spring }}>
                        {props.children}
                    </motion.div>
                </div>
            </div>
            <div
                ref={sizerRef}
                aria-hidden="true"
                style={{ width: "100%", height: scrollRange }}
            />
        </div>
    )
}

HorizontalScroller.displayName = "Horizontal Scroller"

addPropertyControls(HorizontalScroller, {
    branding: {
        type: ControlType.Enum,
        title: "Developed By",
        options: ["artech"],
        optionTitles: ["artech"],
        displaySegmentedControl: true,
        description: "Live [demo](https://horizontalscroller.framer.website).",
    },
    children: {
        type: ControlType.ComponentInstance,
        title: "Frame",
        description: "Long, overflowing frame.",
    },
    top: {
        type: ControlType.Number,
        title: "Top",
        description:
            "Auto sticky.\n\n*Note*: Parent containers require their overflows set to clip for sticky to work.",
        defaultValue: 0,
        min: 0,
        step: 1,
        displayStepper: true,
    },
    overflow: {
        type: ControlType.Enum,
        defaultValue: "hidden",
        displaySegmentedControl: true,
        segmentedControlDirection: "horizontal",
        options: ["hidden", "visible"],
        optionTitles: ["Hidden", "Visible"],
    },
})
