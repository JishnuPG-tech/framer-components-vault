// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId } from "react"

/**
 * @framerDisableUnlink
 */
export default function DragPreventer(props) {
    const {
        preventImages = true,
        preventLinks = true,
        preventTextDrag = false,
        preventTextSelect = false,
        preventAll = false,
    } = props

    // Generate a unique ID per instance so multiple components
    // on the same page don't conflict with each other
    const uid = useId().replace(/:/g, "")
    const styleId = `drag-preventer-${uid}`

    useEffect(() => {
        // Remove any previously injected style for this instance
        document.getElementById(styleId)?.remove()

        const rules = []
        // Scope all rules to :root so they act page-wide,
        // but are tied to this specific injected <style> tag
        // (removed on unmount), not a global unmanaged block.

        // ── Drag Prevention ───────────────────────────────────
        if (preventAll) {
            rules.push(`
                :root * {
                    -webkit-user-drag: none !important;
                    user-drag: none !important;
                }
            `)
        } else {
            if (preventImages) {
                rules.push(`
                    :root img {
                        -webkit-user-drag: none !important;
                        user-drag: none !important;
                    }
                `)
            }

            if (preventLinks) {
                rules.push(`
                    :root a,
                    :root button,
                    :root [role="link"],
                    :root [role="button"],
                    :root div[data-framer-link] {
                        -webkit-user-drag: none !important;
                        user-drag: none !important;
                    }
                `)
            }

            if (preventTextDrag) {
                rules.push(`
                    :root * {
                        -webkit-user-drag: none !important;
                        user-drag: none !important;
                    }
                `)
            }
        }

        // ── Text Selection Prevention ─────────────────────────
        if (preventTextSelect) {
            rules.push(`
                :root * {
                    user-select: none !important;
                    -webkit-user-select: none !important;
                }
                :root input,
                :root textarea,
                :root [contenteditable] {
                    user-select: text !important;
                    -webkit-user-select: text !important;
                }
            `)
        }

        if (rules.length === 0) return

        // Inject a uniquely-identified <style> tag into <head>
        // so it can be precisely removed on unmount or prop change
        const styleEl = document.createElement("style")
        styleEl.id = styleId
        styleEl.textContent = rules.join("\n")
        document.head.appendChild(styleEl)

        // ── Cleanup on unmount or prop change ─────────────────
        return () => {
            document.getElementById(styleId)?.remove()
        }
    }, [
        preventAll,
        preventImages,
        preventLinks,
        preventTextDrag,
        preventTextSelect,
    ])

    // Render nothing visible — this is a behavior-only component
    return (
        <div
            style={{
                position: "absolute",
                width: 0,
                height: 0,
                overflow: "hidden",
                pointerEvents: "none",
            }}
        />
    )
}

DragPreventer.displayName = "Drag Preventer"

addPropertyControls(DragPreventer, {
    preventAll: {
        title: "Block All Dragging",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Prevents dragging on every element on the page at once.",
    },
    preventImages: {
        title: "Block Image Drag",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.preventAll,
        description:
            "Stops visitors from dragging images off your site into another tab or folder.",
    },
    preventLinks: {
        title: "Block Link Drag",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.preventAll,
        description:
            "Stops visitors from dragging links and buttons into the browser bookmark bar or new tab.",
    },
    preventTextDrag: {
        title: "Block Text Drag",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.preventAll,
        description:
            "Stops visitors from dragging highlighted text. They can still select and copy text normally.",
    },
    preventTextSelect: {
        title: "Block Text Select",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Stops visitors from highlighting or selecting any text on your site. Works independently from all drag settings above.\n\nMade with ❤️ by [Soyeb](https://framer.link/project)\n*Version:* 1.0.0",
    },
})
