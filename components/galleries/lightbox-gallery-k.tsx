// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId, useRef, useState } from "react"
import PhotoSwipeLightbox from "photoswipe/lightbox"

const PSWP_STYLE_ID = "framer-photoswipe-styles"

//this CSS will only be added once, even after duplicating the component.
const PSWP_CSS = `.pswp__icn-shadow{display:none} .pswp{--pswp-bg:#000;--pswp-placeholder-bg:#222;--pswp-root-z-index:100000;--pswp-preloader-color:rgba(79,79,79,0.4);--pswp-preloader-color-secondary:rgba(255,255,255,0.9);--pswp-icon-color:#fff;--pswp-icon-color-secondary:#4f4f4f;--pswp-icon-stroke-color:#4f4f4f;--pswp-icon-stroke-width:2px;--pswp-error-text-color:var(--pswp-icon-color)}.pswp{position:fixed;top:0;left:0;width:100%;height:100%;z-index:var(--pswp-root-z-index);display:none;touch-action:none;outline:0;opacity:0.003;contain:layout style size;-webkit-tap-highlight-color:rgba(0,0,0,0)}.pswp:focus{outline:0}.pswp *{box-sizing:border-box}.pswp img{max-width:none}.pswp--open{display:block}.pswp,.pswp__bg{transform:translateZ(0);will-change:opacity}.pswp__bg{opacity:0.005;background:var(--pswp-bg)}.pswp,.pswp__scroll-wrap{overflow:hidden}.pswp__scroll-wrap,.pswp__bg,.pswp__container,.pswp__item,.pswp__content,.pswp__img,.pswp__zoom-wrap{position:absolute;top:0;left:0;width:100%;height:100%}.pswp__img,.pswp__zoom-wrap{width:auto;height:auto}.pswp--click-to-zoom.pswp--zoom-allowed .pswp__img{cursor:-webkit-zoom-in;cursor:-moz-zoom-in;cursor:zoom-in}.pswp--click-to-zoom.pswp--zoomed-in .pswp__img{cursor:move;cursor:-webkit-grab;cursor:-moz-grab;cursor:grab}.pswp--click-to-zoom.pswp--zoomed-in .pswp__img:active{cursor:-webkit-grabbing;cursor:-moz-grabbing;cursor:grabbing}.pswp--no-mouse-drag.pswp--zoomed-in .pswp__img,.pswp--no-mouse-drag.pswp--zoomed-in .pswp__img:active,.pswp__img{cursor:-webkit-zoom-out;cursor:-moz-zoom-out;cursor:zoom-out}.pswp__container,.pswp__img,.pswp__button,.pswp__counter{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.pswp__item{z-index:1;overflow:hidden}.pswp__hidden{display:none!important}.pswp__content{pointer-events:none}.pswp__content>*{pointer-events:auto}.pswp__error-msg-container{display:grid}.pswp__error-msg{margin:auto;font-size:1em;line-height:1;color:var(--pswp-error-text-color)}.pswp .pswp__hide-on-close{opacity:0.005;will-change:opacity;transition:opacity var(--pswp-transition-duration) cubic-bezier(0.4,0,0.22,1);z-index:10;pointer-events:none}.pswp--ui-visible .pswp__hide-on-close{opacity:1;pointer-events:auto}.pswp__button{position:relative;display:block;width:50px;height:60px;padding:0;margin:0;overflow:hidden;cursor:pointer;background:none;border:0;box-shadow:none;opacity:0.85;-webkit-appearance:none;-webkit-touch-callout:none}.pswp__button:hover,.pswp__button:active,.pswp__button:focus{transition:none;padding:0;background:none;border:0;box-shadow:none;opacity:1}.pswp__button:disabled{opacity:0.3;cursor:auto}.pswp__icn{fill:var(--pswp-icon-color);color:var(--pswp-icon-color-secondary)}.pswp__icn{position:absolute;top:14px;left:9px;width:32px;height:32px;overflow:hidden;pointer-events:none}.pswp__icn-shadow{stroke:var(--pswp-icon-stroke-color);stroke-width:var(--pswp-icon-stroke-width);fill:none}.pswp__icn:focus{outline:0}div.pswp__img--placeholder,.pswp__img--with-bg{background:var(--pswp-placeholder-bg)}.pswp__top-bar{position:absolute;left:0;top:0;width:100%;height:60px;display:flex;flex-direction:row;justify-content:flex-end;z-index:10;pointer-events:none!important}.pswp__top-bar>*{pointer-events:auto;will-change:opacity}.pswp__button--close{margin-right:6px}.pswp__button--arrow{position:absolute;top:0;width:75px;height:100px;top:50%;margin-top:-50px}.pswp__button--arrow:disabled{display:none;cursor:default}.pswp__button--arrow .pswp__icn{top:50%;margin-top:-30px;width:60px;height:60px;background:none;border-radius:0}.pswp--one-slide .pswp__button--arrow{display:none}.pswp--touch .pswp__button--arrow{visibility:hidden}.pswp--has_mouse .pswp__button--arrow{visibility:visible}.pswp__button--arrow--prev{right:auto;left:0px}.pswp__button--arrow--next{right:0px}.pswp__button--arrow--next .pswp__icn{left:auto;right:14px;transform:scale(-1,1)}.pswp__button--zoom{display:none}.pswp--zoom-allowed .pswp__button--zoom{display:block}.pswp--zoomed-in .pswp__zoom-icn-bar-v{display:none}.pswp__preloader{position:relative;overflow:hidden;width:50px;height:60px;margin-right:auto}.pswp__preloader .pswp__icn{opacity:0;transition:opacity 0.2s linear;animation:pswp-clockwise 600ms linear infinite}.pswp__preloader--active .pswp__icn{opacity:0.85}@keyframes pswp-clockwise{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.pswp__counter{height:30px;margin-top:15px;margin-inline-start:20px;font-size:14px;line-height:30px;color:var(--pswp-icon-color);text-shadow:1px 1px 3px var(--pswp-icon-color-secondary);opacity:0.85}.pswp--one-slide .pswp__counter{display:none}`

// Trusted built-in icon markup only — never interpolate external URLs into SVG/HTML.
const DEFAULT_CLOSE_SVG = `<svg aria-hidden="true" class="pswp__icn" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.9999 4.00007L4 21M3.99993 4L20.9999 20.9999" stroke="white" stroke-width="2"/></svg>`
const DEFAULT_ZOOM_SVG = `<svg aria-hidden="true" class="pswp__icn" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11.3947" cy="11.3947" r="9.39474" stroke="white" stroke-width="2"/><path d="M18.5789 18.5789L23 23" stroke="white" stroke-width="2"/><path d="M11.35 7.53027C11.35 9.92583 11.35 14.8196 11.35 15.2303" stroke="white" stroke-width="2"/><path d="M7.50029 11.3801C9.89585 11.3801 14.7896 11.3801 15.2003 11.3801" stroke="white" stroke-width="2"/></svg>`
const DEFAULT_LEFT_SVG = `<svg aria-hidden="true" class="pswp__icn" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#232323"/><path d="M23.67 27.2858L21.9853 28.9705L13 19.9853L21.9853 11L23.67 12.6847L16.3695 19.9853L23.67 27.2858Z" fill="white"/></svg>`
const DEFAULT_RIGHT_SVG = `<svg aria-hidden="true" class="pswp__icn" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="20" fill="#232323"/><path d="M16.33 12.7142L18.0147 11.0295L27 20.0147L18.0147 29L16.33 27.3153L23.6305 20.0147L16.33 12.7142Z" fill="white"/></svg>`

type GalleryItem = {
    id: string
    src: string
    width: number
    height: number
    element: HTMLAnchorElement | null
}

type LightboxEntry = {
    lightbox: PhotoSwipeLightbox
    refCount: number
    optionsKey: string
}

// Only items registered by this component — no global DOM queries.
const galleryItems = new Map<string, Map<string, GalleryItem>>()
const galleryLightboxes = new Map<string, LightboxEntry>()

function ensurePswpStyles() {
    if (typeof document === "undefined") return
    if (document.getElementById(PSWP_STYLE_ID)) return

    const style = document.createElement("style")
    style.id = PSWP_STYLE_ID
    style.textContent = PSWP_CSS
    document.head.appendChild(style)
}

function resolveUrl(value: unknown) {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object" && value !== null && "src" in value) {
        return String((value as { src?: string }).src || "")
    }
    return ""
}

function sanitizeGalleryId(id: string) {
    const cleaned = String(id || "image-group")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "-")
    return cleaned || "image-group"
}

/** Only allow http(s) image URLs for CSS backgrounds — never inject into HTML/SVG. */
function isSafeImageUrl(url: string) {
    if (!url || /[\s'"()\\\n\r]/.test(url)) return false
    try {
        const parsed = new URL(
            url,
            typeof window !== "undefined"
                ? window.location.href
                : "https://localhost"
        )
        return parsed.protocol === "https:" || parsed.protocol === "http:"
    } catch {
        return false
    }
}

function iconButtonCss(
    scope: string,
    button: string,
    url: string,
    size: string
) {
    if (!isSafeImageUrl(url)) return ""
    return (
        `${scope} .pswp__button--${button}{background:url("${url}") center/${size} no-repeat}` +
        `${scope} .pswp__button--${button} .pswp__icn{opacity:0!important}`
    )
}

function buildThemeCss(
    scope: string,
    overlayColor: string,
    overlayBlur: number,
    icons: {
        zoomUrl: string
        closeUrl: string
        leftUrl: string
        rightUrl: string
    }
) {
    return [
        `.${scope}{--pswp-bg:${overlayColor}}`,
        `.${scope} .pswp__bg{-webkit-backdrop-filter:blur(${overlayBlur}px);backdrop-filter:blur(${overlayBlur}px)}`,
        `.${scope} .pswp__button--arrow--next .pswp__icn{transform:none}`,
        iconButtonCss(scope, "zoom", icons.zoomUrl, "20px"),
        iconButtonCss(scope, "close", icons.closeUrl, "20px"),
        iconButtonCss(scope, "arrow--prev", icons.leftUrl, "40px"),
        iconButtonCss(scope, "arrow--next", icons.rightUrl, "40px"),
    ].join("")
}

function getGalleryEntries(galleryId: string) {
    const items = galleryItems.get(galleryId)
    if (!items) return []
    return Array.from(items.values())
}

const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
}

export default function LightboxImage({
    image,
    zoomIcon,
    closeIcon,
    leftIcon,
    rightIcon,
    overlayColor = "#000000",
    overlayOpacity = 0.8,
    overlayBlur = 0,
    galleryId = "image-group",
    scaleMultiplier = 2,
    style,
}) {
    const isStatic = useIsStaticRenderer()
    const galleryRef = useRef<HTMLDivElement>(null)
    const anchorRef = useRef<HTMLAnchorElement>(null)
    const instanceId = useId().replace(/:/g, "")
    const safeGalleryId = sanitizeGalleryId(galleryId)
    const themeScope = `pswp--framer-theme-${safeGalleryId}`
    const themeStyleId = `framer-photoswipe-theme-${safeGalleryId}`
    const src = resolveUrl(image)

    const zoomUrl = resolveUrl(zoomIcon)
    const closeUrl = resolveUrl(closeIcon)
    const leftUrl = resolveUrl(leftIcon)
    const rightUrl = resolveUrl(rightIcon)

    const safeZoomUrl = isSafeImageUrl(zoomUrl) ? zoomUrl : ""
    const safeCloseUrl = isSafeImageUrl(closeUrl) ? closeUrl : ""
    const safeLeftUrl = isSafeImageUrl(leftUrl) ? leftUrl : ""
    const safeRightUrl = isSafeImageUrl(rightUrl) ? rightUrl : ""

    const [componentSize, setComponentSize] = useState({ width: 0, height: 0 })

    const pswpWidth = Math.max(
        1,
        Math.round(componentSize.width * scaleMultiplier)
    )
    const pswpHeight = Math.max(
        1,
        Math.round(componentSize.height * scaleMultiplier)
    )

    useEffect(() => {
        const el = galleryRef.current
        if (!el) return

        const updateSize = () => {
            const rect = el.getBoundingClientRect()
            setComponentSize({
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            })
        }

        updateSize()

        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(updateSize)
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        ensurePswpStyles()
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        if (typeof document === "undefined") return

        let styleEl = document.getElementById(
            themeStyleId
        ) as HTMLStyleElement | null
        if (!styleEl) {
            styleEl = document.createElement("style")
            styleEl.id = themeStyleId
            document.head.appendChild(styleEl)
        }
        styleEl.textContent = buildThemeCss(
            themeScope,
            overlayColor,
            overlayBlur,
            {
                zoomUrl: safeZoomUrl,
                closeUrl: safeCloseUrl,
                leftUrl: safeLeftUrl,
                rightUrl: safeRightUrl,
            }
        )
    }, [
        isStatic,
        themeScope,
        themeStyleId,
        overlayColor,
        overlayBlur,
        safeZoomUrl,
        safeCloseUrl,
        safeLeftUrl,
        safeRightUrl,
    ])

    // Register this instance's slide in the shared gallery (component-owned registry only).
    useEffect(() => {
        if (isStatic) return
        if (!src) return

        let group = galleryItems.get(safeGalleryId)
        if (!group) {
            group = new Map()
            galleryItems.set(safeGalleryId, group)
        }

        group.set(instanceId, {
            id: instanceId,
            src,
            width: pswpWidth,
            height: pswpHeight,
            element: anchorRef.current,
        })

        return () => {
            const current = galleryItems.get(safeGalleryId)
            if (!current) return
            current.delete(instanceId)
            if (current.size === 0) galleryItems.delete(safeGalleryId)
        }
    }, [isStatic, safeGalleryId, instanceId, src, pswpWidth, pswpHeight])

    useEffect(() => {
        if (isStatic) return

        const optionsKey = [
            themeScope,
            overlayOpacity,
            safeZoomUrl,
            safeCloseUrl,
            safeLeftUrl,
            safeRightUrl,
        ].join("|")

        let entry = galleryLightboxes.get(safeGalleryId)

        const createLightbox = () =>
            new PhotoSwipeLightbox({
                pswpModule: () => import("photoswipe"),
                mainClass: themeScope,
                bgOpacity: overlayOpacity,
                // Empty SVG when using CSS image icons; otherwise trusted defaults only.
                zoomSVG: safeZoomUrl ? "" : DEFAULT_ZOOM_SVG,
                closeSVG: safeCloseUrl ? "" : DEFAULT_CLOSE_SVG,
                arrowPrevSVG: safeLeftUrl ? "" : DEFAULT_LEFT_SVG,
                arrowNextSVG: safeRightUrl ? "" : DEFAULT_RIGHT_SVG,
            })

        if (!entry) {
            const lightbox = createLightbox()
            lightbox.init()
            entry = { lightbox, refCount: 1, optionsKey }
            galleryLightboxes.set(safeGalleryId, entry)
        } else {
            entry.refCount += 1
            if (entry.optionsKey !== optionsKey) {
                entry.lightbox.destroy()
                const lightbox = createLightbox()
                lightbox.init()
                entry.lightbox = lightbox
                entry.optionsKey = optionsKey
            }
        }

        return () => {
            const current = galleryLightboxes.get(safeGalleryId)
            if (!current) return
            current.refCount -= 1
            if (current.refCount <= 0) {
                current.lightbox.destroy()
                galleryLightboxes.delete(safeGalleryId)
            }
        }
    }, [
        isStatic,
        safeGalleryId,
        themeScope,
        overlayOpacity,
        safeZoomUrl,
        safeCloseUrl,
        safeLeftUrl,
        safeRightUrl,
    ])

    const openLightbox = (event: { preventDefault: () => void }) => {
        event.preventDefault()
        if (isStatic || !src) return

        const group = galleryItems.get(safeGalleryId)
        const item = group?.get(instanceId)
        if (item) item.element = anchorRef.current

        const entries = getGalleryEntries(safeGalleryId)
        const index = entries.findIndex((entry) => entry.id === instanceId)
        const openIndex = index >= 0 ? index : 0
        const dataSource = entries.map((entry) => ({
            src: entry.src,
            width: entry.width,
            height: entry.height,
            element: entry.element || undefined,
        }))

        const lightboxEntry = galleryLightboxes.get(safeGalleryId)
        if (!lightboxEntry || dataSource.length === 0) return

        lightboxEntry.lightbox.loadAndOpen(openIndex, dataSource)
    }

    if (isStatic) {
        return (
            <div
                ref={galleryRef}
                style={{
                    width: "100%",
                    height: "100%",
                    ...style,
                }}
            >
                <img src={src} alt="" style={imageStyle} />
            </div>
        )
    }

    return (
        <div
            ref={galleryRef}
            style={{
                width: "100%",
                height: "100%",
                ...style,
            }}
        >
            <a
                ref={anchorRef}
                href={src}
                onClick={openLightbox}
                data-pswp-width={pswpWidth}
                data-pswp-height={pswpHeight}
            >
                <img
                    src={src}
                    alt=""
                    style={{ ...imageStyle, cursor: "zoom-in" }}
                />
            </a>
        </div>
    )
}

addPropertyControls(LightboxImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    scaleMultiplier: {
        type: ControlType.Number,
        title: "Scale Multiplier",
        defaultValue: 2,
        min: 0.5,
        max: 8,
        step: 0.1,
        displayStepper: true,
    },
    galleryId: {
        type: ControlType.String,
        title: "Gallery ID",
        defaultValue: "image-group",
    },
    zoomIcon: {
        type: ControlType.Image,
        title: "Zoom Icon [SVG]",
    },
    closeIcon: {
        type: ControlType.Image,
        title: "Close Icon [SVG]",
    },
    leftIcon: {
        type: ControlType.Image,
        title: "Left Icon [SVG]",
    },
    rightIcon: {
        type: ControlType.Image,
        title: "Right Icon [SVG]",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    overlayBlur: {
        type: ControlType.Number,
        title: "Overlay Blur",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
})
