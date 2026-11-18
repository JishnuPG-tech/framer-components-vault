import { useEffect, useState, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

interface BeforeYouLeaveProps {
    enabled: boolean
    content?: any
    overlayColor: string
    showOnce: boolean
    style?: CSSProperties
}

/**
 * Before you leave...
 *
 * Triggers a customizable popup when the user's mouse leaves the viewport (e.g. to close the tab).
 * Connect any Frame to the "Content" property to display it as the popup.
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 50
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function BeforeYouLeave(props: BeforeYouLeaveProps) {
    const {
        enabled,
        content,
        overlayColor,
        showOnce,
    } = props
    const [isVisible, setIsVisible] = useState(false)
    const hasTriggered = useRef(false)

    useEffect(() => {
        if (!enabled) return
        // In canvas, we don't trigger
        if (RenderTarget.current() === RenderTarget.canvas) return

        const handleMouseLeave = (e) => {
            // Check if mouse left from the top
            if (e.clientY <= 0) {
                if (showOnce && hasTriggered.current) return

                setIsVisible(true)
                hasTriggered.current = true
            }
        }

        document.addEventListener("mouseleave", handleMouseLeave)
        return () => {
            document.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [enabled, showOnce])

    const handleClose = () => {
        setIsVisible(false)
    }

    // Canvas view
    if (RenderTarget.current() === RenderTarget.canvas) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f0f0f0",
                    color: "#888",
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px dashed #ccc",
                    padding: 8,
                    textAlign: "center",
                }}
            >
                Before you leave... Trigger
                <br />
                (Connect Content)
            </div>
        )
    }

    if (typeof document === "undefined") return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: overlayColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        pointerEvents: "auto",
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "relative" }}
                    >
                        {content}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

addPropertyControls(BeforeYouLeave, {
    enabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    content: {
        type: ControlType.Slot,
        title: "Content",
        description: "Connect a Frame to show as the popup",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "rgba(0, 0, 0, 0.5)",
    },
    showOnce: {
        type: ControlType.Boolean,
        title: "Show Once",
        defaultValue: true,
        description: "Only show once per session",
    },
})