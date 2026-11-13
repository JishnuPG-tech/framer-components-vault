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

export function CopyCurrentUrl(props): Override {
    // التحقق مما إذا كان الكود يعمل في Canvas المحرر أو بيئة العرض الثابتة
    const isStatic = RenderTarget.current() === RenderTarget.canvas

    return {
        style: {
            cursor: "pointer",
        },
        async onClick(e: React.MouseEvent<HTMLElement>) {
            // منع الانتقال للصفحة أو فتح الرابط
            if (e) {
                e.preventDefault()
                e.stopPropagation()
            }

            // عدم تنفيذ الأنميشن أو النسخ داخل لوحة التحكم/المحرر لتفادي أخطاء الأداء
            if (isStatic) return

            // 1. التقاط العنصر والرابط بالسلوك الافتراضي المباشر من Framer
            const target = e.target as HTMLElement
            const anchor =
                target.closest("a") ||
                e.currentTarget.querySelector("a") ||
                (e.currentTarget.tagName === "A" ? e.currentTarget : null)

            const linkHref = anchor ? anchor.getAttribute("href") : null

            // 2. قراءة القيمة مباشرة
            const textToCopy =
                props.href ||
                linkHref ||
                props.link ||
                props.text ||
                window.location.href

            // 3. تنفيذ النسخ المباشر وإظهار Toast الإشعار
            try {
                if (navigator.clipboard && textToCopy) {
                    await navigator.clipboard.writeText(textToCopy)
                } else {
                    const textArea = document.createElement("textarea")
                    textArea.value = textToCopy
                    document.body.appendChild(textArea)
                    textArea.select()
                    document.execCommand("copy")
                    textArea.remove()
                }
                showCopyToast("Copied to clipboard!")
            } catch (err) {
                console.error("Failed to copy:", err)
                showCopyToast("Failed to copy!")
            }
        },
    }
}

function showCopyToast(message: string) {
    // التأكد من عدم تشغيل الأنميشن في بيئة الـ Static Render
    if (RenderTarget.current() === RenderTarget.canvas) return

    const existingToast = document.getElementById("framer-copy-toast")
    if (existingToast) {
        existingToast.remove()
    }

    const toast = document.createElement("div")
    toast.id = "framer-copy-toast"
    toast.innerText = message

    Object.assign(toast.style, {
        position: "fixed",
        bottom: "30px",
        left: "50%",
        backgroundColor: "#111111",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        zIndex: "9999",
        pointerEvents: "none",
        direction: "ltr",
        fontFamily: "sans-serif",
        whiteSpace: "nowrap",
        opacity: "0",
    })

    document.body.appendChild(toast)

    // تشغيل الأنميشن فقط في الموقع الحي (Live Site)
    animate(
        toast,
        {
            opacity: [0, 1],
            y: [10, 0],
            x: ["-50%", "-50%"],
        },
        { duration: 0.25 }
    )

    setTimeout(() => {
        animate(
            toast,
            {
                opacity: 0,
                y: 10,
                x: ["-50%", "-50%"],
            },
            { duration: 0.25 }
        ).then(() => {
            toast.remove()
        })
    }, 2500)
}
