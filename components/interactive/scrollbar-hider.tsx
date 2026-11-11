// Scrollbar Hider - Hides all scrollbars on the page when enabled
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


interface ScrollbarHiderProps {
    forceHide: boolean
}

/**
 * @framerSupportedLayoutWidth 0
 * @framerSupportedLayoutHeight 0
 * @framerDisableUnlink
 */
export default function ScrollbarHider({ forceHide }: ScrollbarHiderProps) {
    React.useLayoutEffect(() => {
        if (typeof window === "undefined" || !forceHide) return

        const styleId = "scrollbar-hider-style"
        if (document.getElementById(styleId)) return

        const style = document.createElement("style")
        style.id = styleId
        style.innerHTML = `
            .lenis {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }

            .lenis::-webkit-scrollbar {
                display: none;
                width: 0 !important;
                height: 0 !important;
                background: transparent;
            }

            * {
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
            }

            *::-webkit-scrollbar {
                display: none !important;
                width: 0px !important;
                height: 0px !important;
                background: transparent !important;
            }
        `
        document.head.appendChild(style)

        return () => {
            const existing = document.getElementById(styleId)
            if (existing) document.head.removeChild(existing)
        }
    }, [forceHide])

    // When forceHide is false, truly render nothing — no DOM, no effects
    if (!forceHide) return null

    // When active, render minimal hidden node for Framer Canvas
    return <div style={{ display: "none" }} />
}

ScrollbarHider.displayName = "Scrollbar Hider"

addPropertyControls(ScrollbarHider, {
    forceHide: {
        type: ControlType.Boolean,
        title: "Hide",
        defaultValue: true,
        description:
            "Hides all scrollbars on the page when enabled.\n———\nMade by *[arkuš.design](https://framer.link/S5pisEA)*",
    },
})
