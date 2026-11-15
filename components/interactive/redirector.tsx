import { useEffect, useRef, useCallback, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AutoRedirectProps {
    autoRedirect: boolean
    url: string
    fallbackUrl: string
    delay: number
    inView?: boolean
    style?: CSSProperties
}

const invisibleStyle: CSSProperties = {
    opacity: 0,
    pointerEvents: "none",
    display: "block",
    position: "absolute", // Добавлено, чтобы не влиять на поток
    width: 0,
    height: 0,
    overflow: "hidden",
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 0
 * @framerIntrinsicHeight 0
 * @framerSupportedLayoutWidth relative
 * @framerSupportedLayoutHeight relative
 */
export default function AutoRedirect({
    autoRedirect,
    url,
    fallbackUrl,
    delay,
    inView = true,
}: AutoRedirectProps) {
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const linkRef = useRef<HTMLAnchorElement>(null)
    const fallbackLinkRef = useRef<HTMLAnchorElement>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const redirectedRef = useRef(false)

    /** Stop redirect timer */
    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    /** Perform redirect */
    const performRedirect = useCallback(() => {
        if (redirectedRef.current || typeof window === "undefined") return
        redirectedRef.current = true

        // Метод 1: Пробуем кликнуть по скрытой ссылке (SPA переход для Framer)
        if (linkRef.current && url) {
            try {
                linkRef.current.click()
                return // Если клик прошел успешно, выходим
            } catch (e) {
                console.warn("Primary link click failed, trying fallback", e)
            }
        }

        // Метод 2: Если основной URL не сработал, пробуем fallback
        if (fallbackUrl) {
            if (fallbackLinkRef.current) {
                fallbackLinkRef.current.click()
            } else {
                window.location.assign(fallbackUrl)
            }
        } else if (!url) {
            console.error("Redirect failed: No URL provided")
        }
    }, [url, fallbackUrl])

    /** Start redirect timer */
    const startTimer = useCallback(() => {
        stopTimer()
        timerRef.current = setTimeout(performRedirect, delay * 1000)
    }, [delay, performRedirect, stopTimer])

    /** Setup IntersectionObserver for inView behavior */
    useEffect(() => {
        if (
            typeof window === "undefined" ||
            !containerRef.current ||
            !autoRedirect
        )
            return

        redirectedRef.current = false

        if (!inView) {
            startTimer()
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    startTimer()
                } else {
                    stopTimer()
                }
            },
            { threshold: 0.1 }
        )

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
            stopTimer()
        }
    }, [autoRedirect, inView, startTimer, stopTimer])

    if (isStatic) return <div style={invisibleStyle} aria-hidden="true" />

    return (
        <div ref={containerRef} style={invisibleStyle} aria-hidden="true">
            {/* Скрытая ссылка для основного URL */}
            {url && <a ref={linkRef} href={url} style={{ display: "none" }} />}
            {/* Скрытая ссылка для Fallback URL */}
            {fallbackUrl && (
                <a
                    ref={fallbackLinkRef}
                    href={fallbackUrl}
                    style={{ display: "none" }}
                />
            )}
        </div>
    )
}

AutoRedirect.displayName = "Redirector"

addPropertyControls(AutoRedirect, {
    autoRedirect: {
        type: ControlType.Boolean,
        title: "Auto Redirect",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    url: {
        type: ControlType.Link,
        title: "├ URL",
        defaultValue: "",
        hidden: ({ autoRedirect }) => !autoRedirect,
    },
    fallbackUrl: {
        type: ControlType.Link,
        title: "├ Fallback URL",
        defaultValue: "",
        hidden: ({ autoRedirect }) => !autoRedirect,
    },
    delay: {
        type: ControlType.Number,
        title: "├ Delay",
        defaultValue: 5,
        min: 0,
        step: 1,
        unit: "sec",
        displayStepper: true,
        hidden: ({ autoRedirect }) => !autoRedirect,
    },
    inView: {
        type: ControlType.Boolean,
        title: "├ In View",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ autoRedirect }) => !autoRedirect,
        description:
            "Trigger delay only when visible.\n———\nMade by *[arkuš.design](https://framer.link/S5pisEA)*",
    },
})
