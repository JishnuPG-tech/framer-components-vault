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
import { v4 as uuidv4 } from "uuid"

/**
 * @framerSupportedLayoutWidth auto
 * @framerDisableUnlink
 * @framerSupportedLayoutHeight auto
 */
export default function Gated_Content(props) {
    const { formId, contentId, expireHours, visibleContentId } = props

    useEffect(() => {
        if (typeof window !== "undefined") {
            const form = document.getElementById(formId)
            const content = document.getElementById(contentId)
            const visibleContent = document.getElementById(visibleContentId)
            const cookieName = `${window.location.pathname}Cookie`

            if (content) content.style.display = "none"

            // Check if cookie exists
            const cookies = document.cookie.split(";").map((c) => c.trim())
            const cookieExists = cookies.some((c) =>
                c.startsWith(`${cookieName}=`)
            )

            if (cookieExists) {
                // Show content, hide form
                if (content) content.style.display = "block"
                if (form) {
                    form.style.display = "none"
                    visibleContent.style.display = "none"
                }
            }

            // Handle form submission
            if (form) {
                form.addEventListener("submit", (e) => {
                    e.preventDefault()

                    const expireDate = new Date()
                    expireDate.setTime(
                        expireDate.getTime() + expireHours * 60 * 60 * 1000
                    )

                    document.cookie = `${cookieName}=${uuidv4()}; expires=${expireDate.toUTCString()}; path=/; SameSite=Strict`

                    // Delay visibility change by 2 seconds
                    setTimeout(() => {
                        if (content) content.style.display = "block"
                        form.style.display = "none"
                        visibleContent.style.display = "none"
                    }, 2000)
                })
            }
        }
    }, [])

    return <></>
}

Gated_Content.displayName = "Gated Content"

addPropertyControls(Gated_Content, {
    visibleContentId: {
        type: ControlType.String,
        title: "Initial Visible Content ID",
        description:
            "The ID of the content section that should be shown before the user completes the form.",
    },
    formId: {
        type: ControlType.String,
        title: "Form ID",
        description:
            "The ID of the form the user must submit to unlock the hidden content.",
    },
    contentId: {
        type: ControlType.String,
        title: "Hidden Content ID",
        description:
            "The ID of the content section that becomes accessible after the form is submitted.",
    },
    expireHours: {
        type: ControlType.Number,
        title: "Expire (hours)",
        defaultValue: 72,
        min: 1,
        max: 2000,
        step: 1,
        description:
            "How long (in hours) the unlocked content should remain accessible before requiring the user to submit the form again.",
    },
})
