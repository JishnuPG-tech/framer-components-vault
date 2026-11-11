import type { ComponentType } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect } from "react"

interface Props {
    visible: boolean
}

/**
 * @framerDisableUnlink
 */
const BackTrigger: ComponentType<Props> = ({ visible = true }) => {
    useEffect(() => {
        if (!visible) return

        const handleBack = () => {
            if (window?.history?.length > 1) {
                window.history.back()
            } else {
                window.location.href = "/"
            }
        }

        const handleDocumentClick = (event: MouseEvent) => {
            const markerElements = document.querySelectorAll(
                '[data-back-hijacker="active"]'
            )
            if (markerElements.length === 0) return

            const clickTarget = event.target as Element

            for (const markerElement of markerElements) {
                let container = markerElement.parentElement

                if (container && container.contains(clickTarget)) {
                    event.preventDefault()
                    event.stopPropagation()
                    event.stopImmediatePropagation()
                    setTimeout(handleBack, 10)
                    return
                }

                if (container && container.parentElement) {
                    const upperContainer = container.parentElement
                    if (
                        upperContainer.contains(clickTarget) ||
                        clickTarget === upperContainer
                    ) {
                        event.preventDefault()
                        event.stopPropagation()
                        event.stopImmediatePropagation()
                        setTimeout(handleBack, 10)
                        return
                    }
                }
            }
        }

        document.addEventListener("click", handleDocumentClick, true)
        return () =>
            document.removeEventListener("click", handleDocumentClick, true)
    }, [visible])

    if (!visible) return null

    return (
        <div
            data-back-hijacker="active"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1px",
                height: "1px",
                backgroundColor: "transparent",
                zIndex: -1,
                pointerEvents: "none",
                opacity: 0,
            }}
        />
    )
}

addPropertyControls(BackTrigger, {
    visible: {
        type: ControlType.Boolean,
        title: "Visible",
        defaultValue: true,
    },
})

BackTrigger.defaultProps = {
    visible: true,
}

export default BackTrigger
