import { useRef } from "react"
import React, { useEffect, useState } from "react"
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
 * These annotations control how your component sizes
 * Learn more: https://www.framer.com/developers/#code-components-auto-sizing
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */

export default function Negative_Gap(props) {
    const qrRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted || !qrRef.current) return

        qrRef.current.parentElement!.style.marginLeft = props.gap + props.unit

        qrRef.current.parentElement!.style.marginTop = props.gap + props.unit
    }, [mounted, props.gap, props.unit])

    if (!mounted) return null

    return <div ref={qrRef} />
}

Negative_Gap.displayName = "Negative Gap"

addPropertyControls(Negative_Gap, {
    unit: {
        type: ControlType.Enum,
        defaultValue: "px",
        displaySegmentedControl: true,
        segmentedControlDirection: "horizontal",
        options: ["px", "%"],
        optionTitles: ["Pixel", "Percent"],
    },
    gap: {
        type: ControlType.Number,
        max: 0,
        min: -1000,
        defaultValue: -3,
        displayStepper: true,
    },
})
