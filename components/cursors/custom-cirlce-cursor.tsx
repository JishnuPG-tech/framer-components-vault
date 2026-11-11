import { useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CursorProps {
    // Main cursor dot properties
    dotSize: number
    dotColor: string

    // Ring cursor properties
    ringSize: number
    ringColor: string
    ringBorderWidth: number

    // Animation properties
    hoverScale: number
    clickScale: number
    animationDuration: number

    // Behavior
    blendMode: string
    hideOnMobile: boolean
    opacity: number
}

export default function CustomCursor(props: CursorProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [hidden, setHidden] = useState(true)
    const [linkHovered, setLinkHovered] = useState(false)
    const [clicked, setClicked] = useState(false)

    useEffect(() => {
        // Only show on desktop devices if hideOnMobile is enabled
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        if (isMobile && props.hideOnMobile) return

        // Hide default cursor
        document.body.style.cursor = "none"
        // Apply to all elements
        const styleElement = document.createElement("style")
        styleElement.innerHTML = `* { cursor: none !important; }`
        document.head.appendChild(styleElement)

        const addEventListeners = () => {
            document.addEventListener("mousemove", onMouseMove)
            document.addEventListener("mouseenter", onMouseEnter)
            document.addEventListener("mouseleave", onMouseLeave)
            document.addEventListener("mousedown", onMouseDown)
            document.addEventListener("mouseup", onMouseUp)
        }

        const removeEventListeners = () => {
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseenter", onMouseEnter)
            document.removeEventListener("mouseleave", onMouseLeave)
            document.removeEventListener("mousedown", onMouseDown)
            document.removeEventListener("mouseup", onMouseUp)
        }

        const onMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY })
            setHidden(false)
        }

        const onMouseEnter = () => {
            setHidden(false)
        }

        const onMouseLeave = () => {
            setHidden(true)
        }

        const onMouseDown = () => {
            setClicked(true)
        }

        const onMouseUp = () => {
            setClicked(false)
        }

        // Check for link hover - updated to handle Framer's dynamic content
        const handleLinkHoverEvents = () => {
            const updateLinkHover = () => {
                document
                    .querySelectorAll(
                        'a, button, [data-framer-name*="button"], [role="button"]'
                    )
                    .forEach((el) => {
                        el.addEventListener("mouseenter", () =>
                            setLinkHovered(true)
                        )
                        el.addEventListener("mouseleave", () =>
                            setLinkHovered(false)
                        )
                    })
            }

            updateLinkHover()

            // Re-run when DOM changes (for dynamic Framer content)
            const observer = new MutationObserver(updateLinkHover)
            observer.observe(document.body, { childList: true, subtree: true })

            return () => observer.disconnect()
        }

        addEventListeners()
        const cleanupLinkEvents = handleLinkHoverEvents()

        return () => {
            removeEventListeners()
            cleanupLinkEvents?.()
            // Restore default cursor on cleanup
            document.body.style.cursor = "auto"
            styleElement.remove()
        }
    }, [props.hideOnMobile])

    // Only show on desktop devices if hideOnMobile is enabled
    if (typeof window === "undefined") return null
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile && props.hideOnMobile) return null

    const currentScale = linkHovered
        ? props.hoverScale
        : clicked
          ? props.clickScale
          : 1
    const transitionSpeed = `${props.animationDuration}ms`

    return (
        <>
            {/* Main cursor dot */}
            <div
                style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    width: `${props.dotSize}px`,
                    height: `${props.dotSize}px`,
                    backgroundColor: props.dotColor,
                    borderRadius: "50%",
                    transform: `translate(${position.x - props.dotSize / 2}px, ${position.y - props.dotSize / 2}px)`,
                    pointerEvents: "none",
                    zIndex: 10000,
                    mixBlendMode: props.blendMode as any,
                    opacity: hidden ? 0 : props.opacity,
                    transition: `opacity ${transitionSpeed} ease`,
                }}
            />

            {/* Secondary cursor ring */}
            <div
                style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    width: `${props.ringSize}px`,
                    height: `${props.ringSize}px`,
                    border: `${props.ringBorderWidth}px solid ${props.ringColor}`,
                    borderRadius: "50%",
                    transform: `translate(${position.x - props.ringSize / 2}px, ${position.y - props.ringSize / 2}px) scale(${currentScale})`,
                    pointerEvents: "none",
                    zIndex: 9999,
                    mixBlendMode: props.blendMode as any,
                    opacity: hidden ? 0 : props.opacity,
                    transition: `all ${transitionSpeed} ease`,
                    backgroundColor: "transparent",
                }}
            />
        </>
    )
}

// Framer property controls
addPropertyControls(CustomCursor, {
    dotSize: {
        type: ControlType.Number,
        defaultValue: 6,
        min: 2,
        max: 20,
        step: 1,
        displayStepper: true,
        title: "Dot Size",
    },
    dotColor: {
        type: ControlType.Color,
        defaultValue: "#ffffff",
        title: "Dot Color",
    },
    ringSize: {
        type: ControlType.Number,
        defaultValue: 32,
        min: 10,
        max: 100,
        step: 2,
        displayStepper: true,
        title: "Ring Size",
    },
    ringColor: {
        type: ControlType.Color,
        defaultValue: "#ffffff",
        title: "Ring Color",
    },
    ringBorderWidth: {
        type: ControlType.Number,
        defaultValue: 1,
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
        title: "Ring Border Width",
    },
    hoverScale: {
        type: ControlType.Number,
        defaultValue: 1.5,
        min: 0.5,
        max: 3,
        step: 0.1,
        displayStepper: true,
        title: "Hover Scale",
    },
    clickScale: {
        type: ControlType.Number,
        defaultValue: 0.75,
        min: 0.2,
        max: 2,
        step: 0.05,
        displayStepper: true,
        title: "Click Scale",
    },
    animationDuration: {
        type: ControlType.Number,
        defaultValue: 200,
        min: 50,
        max: 1000,
        step: 50,
        displayStepper: true,
        title: "Animation Duration (ms)",
    },
    blendMode: {
        type: ControlType.Enum,
        defaultValue: "difference",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
        ],
        optionTitles: [
            "Normal",
            "Multiply",
            "Screen",
            "Overlay",
            "Darken",
            "Lighten",
            "Color Dodge",
            "Color Burn",
            "Hard Light",
            "Soft Light",
            "Difference",
            "Exclusion",
        ],
        title: "Blend Mode",
    },
    opacity: {
        type: ControlType.Number,
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.1,
        displayStepper: true,
        title: "Opacity",
    },
    hideOnMobile: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Hide on Mobile",
    },
})
