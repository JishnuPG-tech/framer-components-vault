import { useEffect, useState, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate } from "framer-motion"
/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fit
 */
export default function CMS_COUNTER({ mode, font, color, duration }) {
    const ref = useRef()
    const [count, setCount] = useState(0)
    const [display, setDisplay] = useState(0)

    useEffect(() => {
        const controls = animate(display, count, {
            duration,
            onUpdate: (v) => setDisplay(Math.round(v)),
        })
        return () => controls.stop()
    }, [count, duration])

    useEffect(() => {
        if (mode === "anchor") {
            if (ref.current) {
                ref.current.setAttribute("data-count-anchor", "true")
            }
            return
        }

        const updateCount = () => {
            const anchors = document.querySelectorAll(
                '[data-count-anchor="true"]'
            )
            const visible = Array.from(anchors).filter((el) => {
                let parent = el.parentElement
                while (parent) {
                    if (window.getComputedStyle(parent).display === "none")
                        return false
                    parent = parent.parentElement
                }
                return true
            })
            setCount(visible.length)
        }

        updateCount()

        const observer = new MutationObserver(updateCount)
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style", "class"],
        })

        return () => observer.disconnect()
    }, [mode])

    if (mode === "anchor") {
        return (
            <div
                ref={ref}
                data-count-anchor="true"
                style={{ display: "contents" }}
            />
        )
    }

    return (
        <span
            style={{
                ...font,
                color,
                fontVariantNumeric: "tabular-nums",
            }}
        >
            {display}
        </span>
    )
}

CMS_COUNTER.defaultProps = {
    mode: "counter",
    color: "#000",
    duration: 0.5,
}

addPropertyControls(CMS_COUNTER, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["anchor", "counter"],
        optionTitles: ["Anchor", "Counter"],
        defaultValue: "counter",
        displaySegmentedControl: true,
        segmentedControlDirection: "horizontal",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        hidden: (props) => props.mode === "anchor",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000",
        hidden: (props) => props.mode === "anchor",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        displayStepper: true,
        hidden: (props) => props.mode === "anchor",
        description: "Made by [OtVos Studio](https://x.com/OtVosStudio)",
    },
})
