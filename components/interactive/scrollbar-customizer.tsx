import React, { useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ScrollbarCustomizerProps {
    className: string
    visibilityScrollbar: boolean
    functionalVerticalScroll: boolean
    functionalHorizontalScroll: boolean
    widthScrollbar: number
    backgroundScrollbar: string
    trackBackground: string
    thumbBackground: string
    thumbHoverBackground: string
    thumbBorderRadius: number
}

export default function ScrollbarCustomizer({
    className,
    visibilityScrollbar,
    functionalHorizontalScroll,
    functionalVerticalScroll,
    widthScrollbar,
    backgroundScrollbar,
    trackBackground,
    thumbBackground,
    thumbHoverBackground,
    thumbBorderRadius,
}: ScrollbarCustomizerProps): JSX.Element {
    useEffect(() => {
        const safeClassName =
            String(className ?? "").replace(/[^a-zA-Z0-9_-]/g, "") ||
            "custom-scrollbar"

        const styles: HTMLStyleElement[] = []

        function injectStyle(css: string) {
            const style = document.createElement("style")
            style.textContent = css
            document.head.appendChild(style)
            styles.push(style)
        }

        function hideScrollbar(selector: string) {
            injectStyle(`
        ${selector}::-webkit-scrollbar{
            width:0px;
            height:0px;
        }

        ${selector}{
            scrollbar-width:none !important;
            -ms-overflow-style:none !important;
        }
        `)
        }

        function disableVerticalScroll(selector: string) {
            injectStyle(`
        ${selector}{
            overflow-y:hidden !important;
        }
        `)
        }

        function disableHorizontalScroll(selector: string) {
            injectStyle(`
        ${selector}{
            overflow-x:hidden !important;
        }
        `)
        }

        function customScrollbar(
            selector: string,
            width: number,
            scrollbarBackground: string,
            track: string,
            thumb: string,
            thumbHover: string,
            radius: number
        ) {
            injectStyle(`
        ${selector}::-webkit-scrollbar{
            width:${width}px !important;
            height:${width}px !important;
            background:${scrollbarBackground};
        }

        ${selector}::-webkit-scrollbar-track{
            background:${track};
        }

        ${selector}::-webkit-scrollbar-thumb{
            background:${thumb};
            border-radius:${radius}px;
        }

        ${selector}::-webkit-scrollbar-thumb:hover{
            background:${thumbHover};
        }
        `)
        }

        //
        // Container Scrollbar
        //

        const containerSelector = `.${safeClassName}`

        if (!visibilityScrollbar) {
            hideScrollbar(containerSelector)
        } else {
            customScrollbar(
                containerSelector,
                widthScrollbar,
                backgroundScrollbar,
                trackBackground,
                thumbBackground,
                thumbHoverBackground,
                thumbBorderRadius
            )
        }

        if (!functionalVerticalScroll) {
            disableVerticalScroll(containerSelector)
        }

        if (!functionalHorizontalScroll) {
            disableHorizontalScroll(containerSelector)
        }

        return () => {
            styles.forEach((style) => style.remove())
        }
    }, [
        className,
        visibilityScrollbar,
        functionalHorizontalScroll,
        functionalVerticalScroll,
        widthScrollbar,
        backgroundScrollbar,
        trackBackground,
        thumbBackground,
        thumbHoverBackground,
        thumbBorderRadius,
    ])

    return <div />
}

ScrollbarCustomizer.defaultProps = {
    className: "custom-scrollbar",

    visibilityScrollbar: true,
    functionalHorizontalScroll: true,
    functionalVerticalScroll: true,

    widthScrollbar: 16,

    backgroundScrollbar: "rgba(255,255,255,1)",
    trackBackground: "rgba(55,0,255,0.1)",
    thumbBackground: "rgba(55,0,255,0.2)",
    thumbHoverBackground: "rgba(55,0,255,0.3)",

    thumbBorderRadius: 0,
}
addPropertyControls(ScrollbarCustomizer, {
    className: {
        type: ControlType.String,
        title: "Custom Class Name",
        description:
            "Need the code override? Remix the Scrollbar Customizer Demo Project. It also includes a Page Scrollbar Customizer component as an additional example. The remix link is in the Marketplace component description, or visit: framer.link/KP0XH17",
        defaultValue: "custom-scrollbar",
    },

    visibilityScrollbar: {
        type: ControlType.Boolean,
        title: "Scrollbar Visibility",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    functionalHorizontalScroll: {
        type: ControlType.Boolean,
        title: "Horizontal Scroll",
        defaultValue: true,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },

    functionalVerticalScroll: {
        type: ControlType.Boolean,
        title: "Vertical Scroll",
        defaultValue: true,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },

    widthScrollbar: {
        type: ControlType.Number,
        title: "Scrollbar Width",
        defaultValue: 16,
        min: 1,
        max: 200,
        step: 1,
        displayStepper: true,
    },

    backgroundScrollbar: {
        type: ControlType.Color,
        title: "Scrollbar Background",
        defaultValue: "rgba(255,255,255,1)",
    },

    trackBackground: {
        type: ControlType.Color,
        title: "Track Background",
        defaultValue: "rgba(55,0,255,0.1)",
    },

    thumbBackground: {
        type: ControlType.Color,
        title: "Thumb Background",
        defaultValue: "rgba(55,0,255,0.2)",
    },
    thumbHoverBackground: {
        type: ControlType.Color,
        title: "Thumb Hover Background",
        defaultValue: "rgba(55,0,255,0.3)",
    },

    thumbBorderRadius: {
        type: ControlType.Number,
        title: "Thumb Border Radius",
        defaultValue: 0,
        min: 0,
        max: 999,
        step: 1,
        displayStepper: true,
    },
})
