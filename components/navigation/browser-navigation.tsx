/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIcon "arrow-left"
 */

import * as React from "react"
import { useCallback, useMemo, useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function NavigationWrapper(props) {
    const { children, direction, enableFallback, fallbackLink, style } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [canNavigate, setCanNavigate] = useState(false)

    // Robust navigation state detection
    useEffect(() => {
        if (typeof window === "undefined" || isCanvas) return

        const updateState = () => {
            // Check for the modern Navigation API (Chrome/Edge/Opera)
            if ("navigation" in window) {
                const nav = (window as any).navigation
                setCanNavigate(
                    direction === "back" ? nav.canGoBack : nav.canGoForward
                )
            } else {
                // Fallback for Safari/Firefox
                // Back is enabled if history > 1, Forward is always false (privacy limitation)
                setCanNavigate(
                    direction === "back" ? window.history.length > 1 : false
                )
            }
        }

        updateState()

        // Listen for navigation changes
        window.addEventListener("popstate", updateState)

        // Listen to modern navigation API for instant state updates without remounting
        if ("navigation" in window) {
            const nav = (window as any).navigation
            nav.addEventListener("currententrychange", updateState)
        }

        return () => {
            window.removeEventListener("popstate", updateState)
            if ("navigation" in window) {
                const nav = (window as any).navigation
                nav.removeEventListener("currententrychange", updateState)
            }
        }
    }, [direction, isCanvas])

    // Determine if we should treat the button as disabled
    const isDisabled = useMemo(() => {
        if (isCanvas) return false

        // If the browser says we can't navigate, check if a Fallback URL exists for Back button
        if (!canNavigate) {
            if (direction === "back" && enableFallback && fallbackLink) {
                return false // Keep enabled because fallback is available
            }
            return true // Truly disabled
        }

        return false
    }, [canNavigate, direction, enableFallback, fallbackLink, isCanvas])

    const handleNavigation = useCallback(
        (e: React.MouseEvent) => {
            if (isCanvas || isDisabled) return

            e.preventDefault()
            e.stopPropagation()

            // BUG FIX: Using setTimeout(..., 0) pushes the navigation command to the next tick
            // of the event loop. This prevents race conditions between React's synthetic
            // event system and Framer's internal SPA router when returning to the initial page.
            setTimeout(() => {
                if (direction === "back") {
                    if (canNavigate) {
                        window.history.back()
                    } else if (enableFallback && fallbackLink) {
                        window.location.href = fallbackLink
                    }
                } else {
                    if (canNavigate) {
                        window.history.forward()
                    }
                }
            }, 0)
        },
        [
            direction,
            enableFallback,
            fallbackLink,
            isCanvas,
            isDisabled,
            canNavigate,
        ]
    )

    const content = useMemo(() => {
        const childArray = React.Children.toArray(children)

        if (childArray.length === 0) {
            return (
                <div style={placeholderStyle}>
                    Connect to a component or select it from the properties
                    panel
                </div>
            )
        }

        return React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                    onClick: isDisabled ? undefined : handleNavigation,
                    role: "button",
                    "aria-label": `${direction} navigation`,
                    "aria-disabled": isDisabled,
                    style: {
                        ...child.props.style,
                        width: "100%",
                        height: "100%",
                        cursor: isDisabled || isCanvas ? "default" : "pointer",
                        opacity: isDisabled ? 0.4 : 1,
                        filter: isDisabled ? "grayscale(1)" : "none",
                        pointerEvents: isDisabled || isCanvas ? "none" : "auto",
                        transition: "opacity 0.3s ease, filter 0.3s ease",
                    },
                })
            }
            return child
        })
    }, [children, handleNavigation, isCanvas, direction, isDisabled])

    return (
        <div style={{ ...style, display: "flex", overflow: "visible" }}>
            {content}
        </div>
    )
}

/* =====================
   This Component was created by Anwash
===================== */

const placeholderStyle: React.CSSProperties = {
    display: "flex",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(136, 85, 255, 0.1)",
    border: "1px dashed rgba(136, 85, 255, 0.5)",
    color: "#85F",
    fontSize: "11px",
    fontWeight: 600,
    padding: "20px",
    textAlign: "center",
    borderRadius: 8,
}

/* =====================
   Property Controls
===================== */

addPropertyControls(NavigationWrapper, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Instance",
        description: "Attach the design you want to use for navigation.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Type",
        options: ["back", "forward"],
        optionTitles: ["Back", "Forward"],
        defaultValue: "back",
        displaySegmentedControl: true,
    },
    enableFallback: {
        type: ControlType.Boolean,
        title: "Fallback",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: false,
        hidden: (props) => props.direction === "forward",
        description: "Go to a specific link if browser history is empty.",
    },
    fallbackLink: {
        type: ControlType.String,
        title: "Link",
        placeholder: "https://mysite.com/home",
        hidden: (props) =>
            props.direction === "forward" || !props.enableFallback,
    },
})
