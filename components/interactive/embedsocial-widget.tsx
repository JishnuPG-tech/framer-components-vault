import React, { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const EMBED_ORIGIN = "https://embedsocial.com"
const RESIZER_PREFIX = "[iFrameSizer]"
const CHILD_READY_MESSAGE = "[iFrameResizerChild]Ready"
let instanceCounter = 0

interface WidgetMessage {
    action?: string
    src?: string
    link?: string
    albumRef?: string
    popupPosition?: string
    popupType?: string
    popupOnce?: boolean
    version?: string
    freeLinkHref?: string
    freeLinkTitle?: string
    freeLinkText?: string
    freeLinkClasses?: string
    removeBrandingArrow?: boolean
    url?: string
    index?: number
    activeMediaId?: string
    page?: number | string
}

interface ResizerHandle {
    sendMessage: (message: Record<string, unknown>) => void
    destroy: () => void
}

const buildInitMessage = (frameId: string): string => {
    const settings = [
        frameId, // id
        8, // bodyMarginV1
        false, // sizeWidth
        false, // log
        32, // interval
        true, // enablePublicMethods
        true, // autoResize
        null, // bodyMargin
        "bodyOffset", // heightCalculationMethod
        null, // bodyBackground
        null, // bodyPadding
        0, // tolerance
        false, // inPageLinks
        "child", // resizeFrom
        "scroll", // widthCalculationMethod
    ]
    return RESIZER_PREFIX + settings.map(String).join(":")
}

const attachIframeResizer = (
    iframe: HTMLIFrameElement,
    options: {
        id: string
        syncHeight: boolean
        onMessage?: (message: WidgetMessage) => void
    }
): ResizerHandle => {
    const { id, syncHeight, onMessage } = options
    iframe.id = id

    const initMessage = buildInitMessage(id)

    const postRaw = (data: string) => {
        iframe.contentWindow?.postMessage(data, EMBED_ORIGIN)
    }

    const handleMessage = (event: MessageEvent) => {
        if (
            event.origin !== EMBED_ORIGIN ||
            event.source !== iframe.contentWindow
        ) {
            return
        }
        const data = event.data
        if (typeof data !== "string") {
            return
        }

        if (data === CHILD_READY_MESSAGE) {
            postRaw(initMessage)
            return
        }
        if (data.indexOf(RESIZER_PREFIX) !== 0) {
            return
        }

        // Frame format: "[iFrameSizer]{id}:{height}:{width}:{type}:{optional JSON payload}".
        const body = data.slice(RESIZER_PREFIX.length)
        const fields = body.split(":")
        const height = fields[1]
        const type = fields[3]

        if (type === "message") {
            const payload = body.slice(fields.slice(0, 4).join(":").length + 1)
            try {
                onMessage?.(JSON.parse(payload) as WidgetMessage)
            } catch {
                // ignore malformed payloads
            }
            return
        }

        if (syncHeight && type !== "close" && height) {
            const parsedHeight = parseInt(height, 10)
            if (!Number.isNaN(parsedHeight)) {
                iframe.style.height = parsedHeight + "px"
            }
        }
    }

    const handleLoad = () => postRaw(initMessage)

    window.addEventListener("message", handleMessage)
    iframe.addEventListener("load", handleLoad)
    postRaw(initMessage)

    return {
        sendMessage: (message) =>
            postRaw(RESIZER_PREFIX + "message:" + JSON.stringify(message)),
        destroy: () => {
            window.removeEventListener("message", handleMessage)
            iframe.removeEventListener("load", handleLoad)
        },
    }
}

const isMobileDevice = (): boolean => {
    if (typeof navigator === "undefined") {
        return false
    }
    return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    )
}

const buildWidgetSrc = (ref: string, productId?: string): string => {
    const params: string[] = []
    if (isMobileDevice()) {
        params.push("isMobileRequest=true")
    }
    if (typeof window !== "undefined" && window.location?.href) {
        params.push("origin=" + encodeURIComponent(window.location.href))
    }
    const query = params.length ? "?" + params.join("&") : ""
    const path = productId
        ? `widget_preview_for_product/${ref}/${encodeURIComponent(productId)}/`
        : `pro_hashtag/${ref}/`
    return `${EMBED_ORIGIN}/api/${path}${query}`
}

const isSafeHttpUrl = (url: string): boolean => {
    try {
        const { protocol } = new URL(url)
        return protocol === "http:" || protocol === "https:"
    } catch {
        return false
    }
}

export default function EmbedSocial({
    widgetRef,
    minHeight,
    productId = "",
}: {
    widgetRef: string
    minHeight: number
    productId?: string
}) {
    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const widgetResizerRef = useRef<ResizerHandle | null>(null)

    const lightboxRef = useRef<HTMLDivElement | null>(null)
    const lightboxResizerRef = useRef<ResizerHandle | null>(null)
    const keyHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(null)
    const lightboxPrerenderedRef = useRef(false)

    const popupRef = useRef<HTMLIFrameElement | null>(null)
    const popupResizerRef = useRef<ResizerHandle | null>(null)

    const [banner, setBanner] = useState<WidgetMessage | null>(null)

    useEffect(() => {
        if (isStatic || !widgetRef) {
            return
        }
        const iframe = iframeRef.current
        if (!iframe || typeof window === "undefined") {
            return
        }

        const bindLightboxKeys = () => {
            if (keyHandlerRef.current) {
                return
            }

            const onKeyDown = (event: KeyboardEvent) => {
                if (event.keyCode === 27) {
                    closeLightbox()
                } else if (event.keyCode === 37 || event.keyCode === 39) {
                    lightboxResizerRef.current?.sendMessage({
                        navigationCode: event.keyCode,
                    })
                }
            }

            keyHandlerRef.current = onKeyDown
            window.addEventListener("keydown", onKeyDown, true)
        }

        const unbindLightboxKeys = () => {
            if (keyHandlerRef.current) {
                window.removeEventListener(
                    "keydown",
                    keyHandlerRef.current,
                    true
                )
                keyHandlerRef.current = null
            }
        }

        const destroyLightbox = () => {
            unbindLightboxKeys()
            lightboxResizerRef.current?.destroy()
            lightboxResizerRef.current = null

            const node = lightboxRef.current
            if (node && node.parentNode) {
                node.parentNode.removeChild(node)
            }

            lightboxRef.current = null
            lightboxPrerenderedRef.current = false
        }

        const closeLightbox = () => {
            if (lightboxPrerenderedRef.current && lightboxRef.current) {
                lightboxRef.current.style.display = "none"
                unbindLightboxKeys()
            } else {
                destroyLightbox()
            }
        }

        const buildLightbox = (src: string, hidden: boolean) => {
            if (!src || !src.startsWith(EMBED_ORIGIN)) {
                return
            }

            destroyLightbox()

            const uid = `${widgetRef}-${(instanceCounter += 1)}`
            const overlay = document.createElement("div")
            overlay.id = `es-lightbox-${uid}`
            Object.assign(overlay.style, lightboxOverlayStyle)
            if (hidden) {
                overlay.style.display = "none"
            }

            const lightboxIframe = document.createElement("iframe")
            lightboxIframe.setAttribute("src", src)
            lightboxIframe.setAttribute("title", "EmbedSocial Lightbox")
            lightboxIframe.setAttribute("scrolling", "no")
            lightboxIframe.setAttribute("allowfullscreen", "true")
            Object.assign(lightboxIframe.style, lightboxIframeStyle)

            overlay.addEventListener("click", (event) => {
                if (event.target === overlay) {
                    closeLightbox()
                }
            })

            overlay.appendChild(lightboxIframe)
            document.body.appendChild(overlay)
            lightboxRef.current = overlay

            lightboxResizerRef.current = attachIframeResizer(lightboxIframe, {
                id: `es-lightbox-iframe-${uid}`,
                syncHeight: false,
                onMessage: (message) => {
                    if (message?.action === "close") {
                        closeLightbox()
                    } else if (message?.action === "preLoadedLightboxReady") {
                        widgetResizerRef.current?.sendMessage({
                            isPreLoadedLightboxReady: true,
                        })
                    }
                },
            })

            if (!hidden) {
                bindLightboxKeys()
            }
        }

        const openLightbox = (src: string) => {
            buildLightbox(src, false)
            lightboxPrerenderedRef.current = false
        }

        // Preload the lightbox hidden so a later click reveals it instantly.
        const preRenderLightbox = (url: string) => {
            buildLightbox(url, true)
            lightboxPrerenderedRef.current = true
        }

        const showPrerendered = (message: WidgetMessage) => {
            const overlay = lightboxRef.current
            if (!overlay) {
                return
            }

            if (message.activeMediaId) {
                lightboxResizerRef.current?.sendMessage({
                    activeMediaId: message.activeMediaId,
                })
            } else if (message.index !== undefined) {
                lightboxResizerRef.current?.sendMessage({
                    activeIndex: message.index,
                })
            }

            overlay.style.display = "flex"
            bindLightboxKeys()
        }

        const closePopup = () => {
            popupResizerRef.current?.destroy()
            popupResizerRef.current = null
            const node = popupRef.current
            if (node && node.parentNode) {
                node.parentNode.removeChild(node)
            }
            popupRef.current = null
            iframe.style.display = ""
        }

        // Body-mounted corner popup; hides the inline widget, honors popupOnce (5-min throttle).
        const openPopup = (message: WidgetMessage) => {
            if (message.popupOnce === true) {
                const key = "es_popup_last_shown_" + widgetRef
                try {
                    const lastShown = Number(window.localStorage.getItem(key))
                    if (lastShown && Date.now() - lastShown < 300000) {
                        return
                    }
                    window.localStorage.setItem(key, String(Date.now()))
                } catch {
                    /* localStorage may be unavailable; show the popup anyway */
                }
            }
            closePopup()

            const uid = `${widgetRef}-${(instanceCounter += 1)}`
            const popupIframe = document.createElement("iframe")
            popupIframe.setAttribute(
                "src",
                `${EMBED_ORIGIN}/api/pro_hashtag/${widgetRef}/?showPopup=false`
            )
            popupIframe.setAttribute("title", "EmbedSocial Popup")
            popupIframe.setAttribute("scrolling", "no")
            popupIframe.setAttribute("allowfullscreen", "true")
            Object.assign(
                popupIframe.style,
                buildPopupStyle(message.popupPosition, message.popupType)
            )

            document.body.appendChild(popupIframe)
            popupRef.current = popupIframe

            popupResizerRef.current = attachIframeResizer(popupIframe, {
                id: `es-popup-iframe-${uid}`,
                syncHeight: true,
                onMessage: (popupMessage) => {
                    if (popupMessage?.action === "close_new_popup") {
                        closePopup()
                    } else if (popupMessage?.action === "create") {
                        openLightbox(popupMessage.src || "")
                    }
                },
            })

            iframe.style.display = "none"
        }

        const widgetResizer = attachIframeResizer(iframe, {
            id: `es-widget-${widgetRef}-${(instanceCounter += 1)}`,
            syncHeight: true,
            onMessage: (message) => {
                switch (message?.action) {
                    case "create":
                        openLightbox(message.src || "")
                        break
                    case "close":
                        closeLightbox()
                        break
                    case "scrollToTop":
                        if (containerRef.current) {
                            const rect =
                                containerRef.current.getBoundingClientRect()
                            window.scrollTo({ top: rect.top + window.scrollY })
                        }
                        break
                    case "openLinkInNewTab":
                        if (message.link && isSafeHttpUrl(message.link)) {
                            window.open(message.link)
                        }
                        break
                    case "openLinkInSameTab":
                        if (message.link && isSafeHttpUrl(message.link)) {
                            window.open(message.link, "_parent")
                        }
                        break
                    case "create_new_popup":
                        openPopup(message)
                        break
                    case "add_free_banner":
                        if (message.version === "free") {
                            setBanner(message)
                        }
                        break
                    case "remove_free_banner":
                        setBanner(null)
                        break
                    case "preRenderLightbox":
                        preRenderLightbox(message.url || "")
                        break
                    case "showPreRenderedLightbox":
                        showPrerendered(message)
                        break
                    case "widgetPageChange":
                        lightboxResizerRef.current?.sendMessage({
                            pageUpdate: message.page,
                        })
                        break
                    case "paginatorPageChange": {
                        const lightboxIframe =
                            lightboxRef.current?.querySelector("iframe")
                        if (
                            lightboxIframe &&
                            message.src &&
                            message.src.startsWith(EMBED_ORIGIN)
                        ) {
                            lightboxIframe.src = message.src
                        }
                        break
                    }
                    default:
                        break
                }
            },
        })
        widgetResizerRef.current = widgetResizer

        return () => {
            destroyLightbox()
            closePopup()
            widgetResizer.destroy()
            widgetResizerRef.current = null
        }
    }, [widgetRef, isStatic, productId])

    if (isStatic) {
        return (
            <div style={placeholderStyle}>
                EmbedSocial widget {widgetRef ? `(${widgetRef})` : ""}
            </div>
        )
    }

    if (!widgetRef) {
        return (
            <div style={placeholderStyle}>
                Paste your EmbedSocial widget ref →
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="embedsocial-hashtag"
            data-ref={widgetRef}
            data-productid={productId || undefined}
            style={{ width: "100%", position: "relative" }}
        >
            <iframe
                ref={iframeRef}
                key={`${widgetRef}-${productId}`}
                src={buildWidgetSrc(widgetRef, productId)}
                title="EmbedSocial Widget"
                scrolling="no"
                allowFullScreen
                style={{ width: "100%", minHeight, border: 0 }}
            />
            {banner && <FreeBanner message={banner} />}
        </div>
    )
}

const FreeBanner = ({ message }: { message: WidgetMessage }) => {
    const href =
        message.freeLinkHref && isSafeHttpUrl(message.freeLinkHref)
            ? message.freeLinkHref
            : "https://embedsocial.com/social-media-aggregator/"
    const className = message.freeLinkClasses || "feed-powered-by-es"
    const title = message.freeLinkTitle || "Instagram widget"
    const text = "Widget by EmbedSocial"

    return (
        <>
            <style>{BRANDING_STYLES}</style>
            <a
                className={className}
                href={href}
                target="_blank"
                rel="noopener"
                title={title}
            >
                <img
                    src="https://embedsocial.com/cdn/icon/embedsocial-logo.webp"
                    alt="EmbedSocial"
                ></img>
                <div className="es-widget-branding-text">
                    {text}
                    {!message.removeBrandingArrow && <span> →</span>}
                </div>
            </a>
        </>
    )
}

const BRANDING_STYLES = `
a.feed-powered-by-es {
    position: absolute;
    bottom: 40px;
    right: 38px;
    color: #9ca0ac;
    font-family: sans-serif;
    font-size: 14px;
    text-decoration: none;
}
a.feed-powered-by-es > span { margin-left: 2px; position: absolute; }
a.feed-powered-by-es.feed-powered-by-es-center { bottom: 0; left: 0; right: 0; text-align: center; }
a.feed-powered-by-es.es-widget-branding > span { display: none; }
a.feed-powered-by-es.es-widget-branding { right: 30px; }
.es-widget-branding {
    display: flex !important;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 30px;
    padding: 6px;
    background-color: #fff;
    border: 1px solid #cdd5df;
    border-radius: 12px;
    box-shadow: 0 2px 1px 0 rgba(0, 0, 0, 0.05), 0 0 1px 0 rgba(0, 0, 0, 0.25);
    overflow: hidden;
    text-decoration: none;
    transition: max-width 0.5s ease-in-out;
}
.es-widget-branding > img {
    width: 20px;
    height: 20px;
    filter: grayscale(1) contrast(1.5);
    transition: all 0.5s ease-in-out;
}
.es-widget-branding .es-widget-branding-text {
    margin: 0;
    max-width: 0;
    opacity: 0;
    color: #0d121c;
    font-size: 12px;
    white-space: nowrap;
    transition: max-width 0.5s ease-in-out, opacity 0.5s ease-in-out;
}
@media screen and (max-width: 768px) {
    a.feed-powered-by-es:not(.es-widget-branding) { bottom: 0; left: 0; right: 0; text-align: center; }
}
@media screen and (min-width: 769px) {
    .es-widget-branding:hover { max-width: 320px; }
    .es-widget-branding:hover > img { filter: none; margin-right: 4px; }
    .es-widget-branding:hover .es-widget-branding-text { max-width: 290px; opacity: 1; }
}
`

const buildPopupStyle = (
    position?: string,
    type?: string
): Partial<CSSStyleDeclaration> => {
    const style: Partial<CSSStyleDeclaration> = {
        position: "fixed",
        width: "100%",
        maxWidth: type === "badge" ? "240px" : "370px",
        border: "0",
        zIndex: "2147483647",
    }
    const pos = position || "bottom-right"
    const vertical: "top" | "bottom" =
        pos.indexOf("top") === 0 ? "top" : "bottom"
    const horizontal: "left" | "right" =
        pos.indexOf("left") !== -1 ? "left" : "right"
    style[vertical] = "0"
    style[horizontal] = "0"
    return style
}

const lightboxOverlayStyle: Partial<CSSStyleDeclaration> = {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    background: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

const lightboxIframeStyle: Partial<CSSStyleDeclaration> = {
    width: "100%",
    height: "100%",
    border: "0",
}

const placeholderStyle: React.CSSProperties = {
    minHeight: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f4f4",
    borderRadius: 8,
    fontFamily: "sans-serif",
    fontSize: 14,
    color: "#888",
    border: "1px dashed #ccc",
}

addPropertyControls(EmbedSocial, {
    widgetRef: {
        type: ControlType.String,
        title: "Widget Ref",
        placeholder: "Paste ref from EmbedSocial dashboard",
        defaultValue: "",
    },
    minHeight: {
        type: ControlType.Number,
        title: "Min Height",
        defaultValue: 300,
        min: 0,
        max: 5000,
        unit: "px",
    },
    productId: {
        type: ControlType.String,
        title: "Product ID",
        placeholder: "Optional — renders media tagged to this product",
        defaultValue: "",
    },
})

EmbedSocial.defaultProps = {
    widgetRef: "",
    minHeight: 300,
    productId: "",
}

EmbedSocial.displayName = "EmbedSocial widget"
