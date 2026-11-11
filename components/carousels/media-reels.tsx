// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import { useId, useEffect, useRef, useCallback, useMemo, useState } from "react"
import { gsap } from "gsap"
/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 540
 */
// ─── Types ────────────────────────────────────────────────────────────────────
interface MediaItem {
    mediaType: "Image" | "Video" | "Youtube"
    image?: string
    video?: string
    youtubeLink?: string
    title?: string
    description?: string
    fullscreen?: boolean
    link?: any
}
interface FontToken {
    fontFamily?: string
    fontSize?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
    fontWeight?: number | string
    textAlign?: string
}
interface CarouselProps {
    items: MediaItem[]
    autoplaySettings: {
        autoplay: boolean
        speed: number
        infiniteLoop: boolean
        mediaPauseDuration: number
        fabPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    }
    motion: {
        transitionEffect: "Standard" | "3D-Cards"
        smoothness: number
        dragPower: number
        activeDistance: number
        maxScale: number
        minScale: number
        inactiveOpacity: number
        parallaxEffect?: boolean
        parallaxIntensity?: number
        skewEffect?: boolean
        skewAmount?: number
        skewMode?: "hover" | "scroll"
        tiltEffect?: boolean
        tiltAmount?: number
        tiltPerspective?: number
    }
    cardLayout: {
        cardWidth: number
        cardHeight: number
        cardGap: number
        cardBorderRadius: number
        backgroundColor: string
        cardBackgroundColor?: string
        cardOverlayOpacity?: number
        infoPosition: "overlay" | "below" | "header"
        headerTitle?: string
        headerDescription?: string
        showHeading?: boolean
    }
    navigation: {
        showControls: boolean
        keyboardNav: boolean
        mouseWheel: boolean
        mouseWheelInvert: boolean
        mouseWheelSpeed: number
        hoverPause: boolean
        showNavText?: boolean
        showCounter?: boolean
        showReelLabel?: boolean
    }
    dragCursor: {
        showDragCursor: boolean
        dragCursorBg: string
        dragCursorText: string
    }
    closeCursor: {
        showCloseCursor: boolean
        closeCursorBg: string
        closeCursorText: string
    }
    infoPanelColors: {
        infoGradientStart: string
        infoGradientMid: string
        infoGradientEnd: string
        infoTitleColor: string
        infoDescColor: string
        overlayBg: string
        cardTitleColor: string
        cardDescColor: string
        cardInfoBgColor: string
    }
    titleTypography: {
        titleFont?: FontToken
        titleTextTransform?: string
    }
    descTypography: {
        descFont?: FontToken
        descTextTransform?: string
    }
    overlayTitleTypography: {
        overlayTitleFont?: FontToken
        overlayTitleTextTransform?: string
    }
    overlayDescTypography: {
        overlayDescFont?: FontToken
        overlayDescTextTransform?: string
    }
    headerTypography: {
        headerTitleFont?: FontToken
        headerTitleTextTransform?: string
        headerTitleColor?: string
        headerDescFont?: FontToken
        headerDescTextTransform?: string
        headerDescColor?: string
    }
    counterTypography: {
        counterFont?: FontToken
        counterTextTransform?: string
    }
    counterColors: {
        counterLabelColor: string
        counterCountColor: string
    }
    controlBarColors: {
        controlBarBg: string
        controlBarBorder: string
        controlBtnText: string
        controlBtnHoverBg: string
        controlBtnActiveBg: string
        controlBtnActiveText: string
    }
    autoplayButtonColors: {
        autoplayFabBg: string
        autoplayFabHoverBg: string
        autoplayFabBorder: string
        autoplayFabText: string
        autoplayFabActiveBg: string
        autoplayFabActiveText: string
    }
    actionButton: {
        showActionButton: boolean
        actionButtonBg: string
        actionButtonHoverBg: string
        actionButtonIconColor: string
        actionButtonHoverIconColor: string
        actionButtonSize: number
        actionButtonIconSize: number
        actionButtonBorderRadius: number
        actionButtonPosition:
            | "top-left"
            | "top-right"
            | "bottom-left"
            | "bottom-right"
    }
    onScrollPause?: () => void
    onScrollResume?: () => void
}
interface NormalizedItem {
    type: "image" | "mp4" | "youtube"
    src: string
    title: string
    desc: string
    fullscreen: boolean
    image?: string
    link?: any
}
interface OverlayState {
    open: boolean
    item: NormalizedItem | null
}
interface CardRefs {
    video: HTMLVideoElement | null
    iframe: HTMLIFrameElement | null
    infoPanel: HTMLElement | null
    infoWords: HTMLElement[]
    infoDesc: HTMLElement | null
    src?: string
}
// ─── SVG Icons (React) ────────────────────────────────────────────────────────
const IconPlay = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="currentColor"
        aria-hidden="true"
    >
        <path d="M3 2l9 5-9 5V2z" />
    </svg>
)
const IconClose = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
    >
        <line x1="2" y1="2" x2="12" y2="12" />
        <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
)
const IconPrev = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <polyline points="9 2 4 7 9 12" />
    </svg>
)
const IconNext = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <polyline points="5 2 10 7 5 12" />
    </svg>
)
// Diagonal arrow icon (↗) - premium "visit link" style
const IconArrowRight = () => (
    <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
            display: "block",
            flexShrink: 0,
            transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
    >
        <path
            d="M3.5 11.5L11.5 3.5M11.5 3.5H5.5M11.5 3.5V9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)
function createYtPlayIcon(): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "100")
    svg.setAttribute("height", "70")
    svg.setAttribute("viewBox", "0 0 68 48")
    svg.setAttribute("fill", "none")
    svg.style.maxWidth = "120px"
    svg.style.height = "auto"
    svg.style.width = "80%"
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "path")
    bg.setAttribute(
        "d",
        "M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.63-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
    )
    bg.setAttribute("fill", "#FF0000")
    const tri = document.createElementNS("http://www.w3.org/2000/svg", "path")
    tri.setAttribute("d", "M45 24 27 14v20")
    tri.setAttribute("fill", "#FFF")
    svg.appendChild(bg)
    svg.appendChild(tri)
    return svg
}
// ─── SVG Icons (DOM API) ──────────────────────────────────────────────────────
function createSVGIcon(
    type: "play" | "pause" | "mute" | "unmute" | "expand" | "arrow"
): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "14")
    svg.setAttribute("height", "14")
    svg.setAttribute("viewBox", "0 0 14 14")
    svg.setAttribute("aria-hidden", "true")
    if (type === "play") {
        svg.setAttribute("fill", "currentColor")
        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        )
        path.setAttribute("d", "M3 2l9 5-9 5V2z")
        svg.appendChild(path)
    } else if (type === "pause") {
        svg.setAttribute("fill", "currentColor")
        const r1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
        )
        r1.setAttribute("x", "2")
        r1.setAttribute("y", "2")
        r1.setAttribute("width", "4")
        r1.setAttribute("height", "10")
        r1.setAttribute("rx", "1")
        const r2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
        )
        r2.setAttribute("x", "8")
        r2.setAttribute("y", "2")
        r2.setAttribute("width", "4")
        r2.setAttribute("height", "10")
        r2.setAttribute("rx", "1")
        svg.appendChild(r1)
        svg.appendChild(r2)
    } else if (type === "mute") {
        svg.setAttribute("fill", "currentColor")
        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        )
        path.setAttribute("d", "M2 5h2l4-3v10L4 9H2V5z")
        svg.appendChild(path)
        const l1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        )
        l1.setAttribute("x1", "10")
        l1.setAttribute("y1", "5")
        l1.setAttribute("x2", "13")
        l1.setAttribute("y2", "9")
        l1.setAttribute("stroke", "currentColor")
        l1.setAttribute("stroke-width", "1.5")
        l1.setAttribute("stroke-linecap", "round")
        const l2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        )
        l2.setAttribute("x1", "13")
        l2.setAttribute("y1", "5")
        l2.setAttribute("x2", "10")
        l2.setAttribute("y2", "9")
        l2.setAttribute("stroke", "currentColor")
        l2.setAttribute("stroke-width", "1.5")
        l2.setAttribute("stroke-linecap", "round")
        svg.appendChild(l1)
        svg.appendChild(l2)
    } else if (type === "unmute") {
        svg.setAttribute("fill", "currentColor")
        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        )
        path.setAttribute("d", "M2 5h2l4-3v10L4 9H2V5z")
        svg.appendChild(path)
        const p2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        )
        p2.setAttribute("d", "M10 4.5a3 3 0 010 5")
        p2.setAttribute("stroke", "currentColor")
        p2.setAttribute("stroke-width", "1.5")
        p2.setAttribute("stroke-linecap", "round")
        p2.setAttribute("fill", "none")
        svg.appendChild(p2)
    } else if (type === "expand") {
        svg.setAttribute("fill", "none")
        svg.setAttribute("stroke", "currentColor")
        svg.setAttribute("stroke-width", "1.5")
        svg.setAttribute("stroke-linecap", "round")
        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        )
        path.setAttribute("d", "M9 2h3v3M5 12H2V9M2 2l4 4M12 12l-4-4")
        svg.appendChild(path)
    } else if (type === "arrow") {
        // Diagonal arrow (↗) - premium "visit link" style
        svg.setAttribute("width", "15")
        svg.setAttribute("height", "15")
        svg.setAttribute("viewBox", "0 0 15 15")
        svg.setAttribute("fill", "none")
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        svg.style.display = "block"
        svg.style.flexShrink = "0"
        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        )
        path.setAttribute("d", "M3.5 11.5L11.5 3.5M11.5 3.5H5.5M11.5 3.5V9.5")
        path.setAttribute("stroke", "currentColor")
        path.setAttribute("stroke-width", "1.5")
        path.setAttribute("stroke-linecap", "round")
        path.setAttribute("stroke-linejoin", "round")
        svg.appendChild(path)
    }
    return svg
}
// ─── Utilities ────────────────────────────────────────────────────────────────
function getYouTubeId(url: string | undefined): string | null {
    if (!url) return null
    const m = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    )
    return m ? m[1] : null
}
function resolveLink(
    link: any
): { href: string; target: string; rel?: string } | null {
    if (!link) return null
    let href = "#"
    if (typeof link === "string") {
        href = link
    } else if (link.url) {
        href = link.url
    } else if (link.pageId) {
        href = `#${link.pageId}`
    } else if (link.email) {
        href = `mailto:${link.email}`
    } else if (link.phone) {
        href = `tel:${link.phone}`
    } else {
        return null
    }
    return {
        href,
        target: link.target || "_self",
        rel: link.target === "_blank" ? "noopener noreferrer" : undefined,
    }
}
function normalizeItems(items: MediaItem[]): NormalizedItem[] {
    return (items || [])
        .map((item): NormalizedItem | null => {
            if (item.mediaType === "Image" && item.image)
                return {
                    type: "image",
                    src: item.image,
                    title: item.title || "",
                    desc: item.description || "",
                    fullscreen: item.fullscreen ?? false,
                    link: item.link,
                }
            if (item.mediaType === "Video" && item.video)
                return {
                    type: "mp4",
                    src: item.video,
                    title: item.title || "",
                    desc: item.description || "",
                    fullscreen: false,
                    image: item.image,
                    link: item.link,
                }
            if (item.mediaType === "Youtube" && item.youtubeLink)
                return {
                    type: "youtube",
                    src: item.youtubeLink,
                    title: item.title || "",
                    desc: item.description || "",
                    fullscreen: false,
                    image: item.image,
                    link: item.link,
                }
            return null
        })
        .filter((item): item is NormalizedItem => item !== null)
}
function fontFamilyValue(family: string | undefined): string {
    if (!family) return `"Inter",sans-serif`
    const cleaned = family.replace(/['"]/g, "").trim()
    if (cleaned.includes(",")) return cleaned
    return `"${cleaned}",sans-serif`
}
function pxValue(v: number | string | undefined, fallback: number): string {
    if (v === undefined || v === null || v === "") return `${fallback}px`
    if (typeof v === "number") return `${v}px`
    return v
}
function unitlessValue(
    v: number | string | undefined,
    fallback: number
): string {
    if (v === undefined || v === null || v === "") return `${fallback}`
    return `${v}`
}
function letterSpacingValue(
    v: number | string | undefined,
    fallback: number = 0
): string {
    if (v === undefined || v === null || v === "") return `${fallback}px`
    if (typeof v === "number") return `${v}px`
    return v
}
type VarGetter = (p: CarouselProps) => string | number
const CSS_VAR_MAP: Array<[string, VarGetter]> = [
    ["bg-color", (p) => p.cardLayout.backgroundColor],
    ["card-w", (p) => `${p.cardLayout.cardWidth}px`],
    ["card-h", (p) => `${p.cardLayout.cardHeight}px`],
    ["card-gap", (p) => `${p.cardLayout.cardGap}px`],
    ["card-radius", (p) => `${p.cardLayout.cardBorderRadius}px`],
    ["card-bg", (p) => p.cardLayout.cardBackgroundColor || "#000000"],
    ["card-overlay-op", (p) => p.cardLayout.cardOverlayOpacity ?? 0.22],
    ["parallax-shift", (p) => 12 * ((p.motion.parallaxIntensity || 50) / 50)],
    ["ig0", (p) => p.infoPanelColors.infoGradientStart],
    ["ig1", (p) => p.infoPanelColors.infoGradientMid],
    ["ig2", (p) => p.infoPanelColors.infoGradientEnd],
    ["itc", (p) => p.infoPanelColors.infoTitleColor],
    ["idc", (p) => p.infoPanelColors.infoDescColor],
    ["obg", (p) => p.infoPanelColors.overlayBg],
    ["ctc", (p) => p.infoPanelColors.cardTitleColor || "#ffffff"],
    ["cdc", (p) => p.infoPanelColors.cardDescColor || "rgba(255,255,255,0.82)"],
    ["cibg", (p) => p.infoPanelColors.cardInfoBgColor || "#111111"],
    ["tf", (p) => fontFamilyValue(p.titleTypography.titleFont?.fontFamily)],
    ["ts", (p) => pxValue(p.titleTypography.titleFont?.fontSize, 19)],
    ["tlh", (p) => unitlessValue(p.titleTypography.titleFont?.lineHeight, 1.3)],
    [
        "tls",
        (p) =>
            letterSpacingValue(p.titleTypography.titleFont?.letterSpacing, 0.2),
    ],
    ["tw", (p) => unitlessValue(p.titleTypography.titleFont?.fontWeight, 700)],
    ["tt", (p) => p.titleTypography.titleTextTransform ?? "none"],
    ["tta", (p) => p.titleTypography.titleFont?.textAlign || "left"],
    ["df", (p) => fontFamilyValue(p.descTypography.descFont?.fontFamily)],
    ["ds", (p) => pxValue(p.descTypography.descFont?.fontSize, 12.5)],
    ["dlh", (p) => unitlessValue(p.descTypography.descFont?.lineHeight, 1.5)],
    [
        "dls",
        (p) => letterSpacingValue(p.descTypography.descFont?.letterSpacing, 0),
    ],
    ["dw", (p) => unitlessValue(p.descTypography.descFont?.fontWeight, 400)],
    ["dt", (p) => p.descTypography.descTextTransform ?? "none"],
    ["dta", (p) => p.descTypography.descFont?.textAlign || "left"],
    [
        "otf",
        (p) =>
            fontFamilyValue(
                p.overlayTitleTypography?.overlayTitleFont?.fontFamily
            ),
    ],
    [
        "ots",
        (p) =>
            pxValue(p.overlayTitleTypography?.overlayTitleFont?.fontSize, 24),
    ],
    [
        "otlh",
        (p) =>
            unitlessValue(
                p.overlayTitleTypography?.overlayTitleFont?.lineHeight,
                1.3
            ),
    ],
    [
        "otls",
        (p) =>
            letterSpacingValue(
                p.overlayTitleTypography?.overlayTitleFont?.letterSpacing,
                0.2
            ),
    ],
    [
        "otw",
        (p) =>
            unitlessValue(
                p.overlayTitleTypography?.overlayTitleFont?.fontWeight,
                700
            ),
    ],
    [
        "ott",
        (p) => p.overlayTitleTypography?.overlayTitleTextTransform ?? "none",
    ],
    [
        "otta",
        (p) => p.overlayTitleTypography?.overlayTitleFont?.textAlign || "left",
    ],
    [
        "odf",
        (p) =>
            fontFamilyValue(
                p.overlayDescTypography?.overlayDescFont?.fontFamily
            ),
    ],
    [
        "ods",
        (p) => pxValue(p.overlayDescTypography?.overlayDescFont?.fontSize, 14),
    ],
    [
        "odlh",
        (p) =>
            unitlessValue(
                p.overlayDescTypography?.overlayDescFont?.lineHeight,
                1.5
            ),
    ],
    [
        "odls",
        (p) =>
            letterSpacingValue(
                p.overlayDescTypography?.overlayDescFont?.letterSpacing,
                0
            ),
    ],
    [
        "odw",
        (p) =>
            unitlessValue(
                p.overlayDescTypography?.overlayDescFont?.fontWeight,
                400
            ),
    ],
    ["odt", (p) => p.overlayDescTypography?.overlayDescTextTransform ?? "none"],
    [
        "odta",
        (p) => p.overlayDescTypography?.overlayDescFont?.textAlign || "left",
    ],
    [
        "htf",
        (p) => fontFamilyValue(p.headerTypography?.headerTitleFont?.fontFamily),
    ],
    ["hts", (p) => pxValue(p.headerTypography?.headerTitleFont?.fontSize, 36)],
    [
        "htw",
        (p) =>
            unitlessValue(p.headerTypography?.headerTitleFont?.fontWeight, 700),
    ],
    [
        "htlh",
        (p) =>
            unitlessValue(p.headerTypography?.headerTitleFont?.lineHeight, 1.1),
    ],
    [
        "htls",
        (p) =>
            letterSpacingValue(
                p.headerTypography?.headerTitleFont?.letterSpacing,
                -0.5
            ),
    ],
    ["htt", (p) => p.headerTypography?.headerTitleTextTransform ?? "none"],
    ["htta", (p) => p.headerTypography?.headerTitleFont?.textAlign || "left"],
    ["htc", (p) => p.headerTypography?.headerTitleColor || "#ffffff"],
    [
        "hdf",
        (p) => fontFamilyValue(p.headerTypography?.headerDescFont?.fontFamily),
    ],
    ["hds", (p) => pxValue(p.headerTypography?.headerDescFont?.fontSize, 15)],
    [
        "hdw",
        (p) =>
            unitlessValue(p.headerTypography?.headerDescFont?.fontWeight, 400),
    ],
    [
        "hdlh",
        (p) =>
            unitlessValue(p.headerTypography?.headerDescFont?.lineHeight, 1.6),
    ],
    [
        "hdls",
        (p) =>
            letterSpacingValue(
                p.headerTypography?.headerDescFont?.letterSpacing,
                0
            ),
    ],
    ["hdt", (p) => p.headerTypography?.headerDescTextTransform ?? "none"],
    ["hdta", (p) => p.headerTypography?.headerDescFont?.textAlign || "left"],
    [
        "hdc",
        (p) => p.headerTypography?.headerDescColor || "rgba(255,255,255,0.7)",
    ],
    [
        "clf",
        (p) => fontFamilyValue(p.counterTypography?.counterFont?.fontFamily),
    ],
    ["cls", (p) => pxValue(p.counterTypography?.counterFont?.fontSize, 11)],
    [
        "cllh",
        (p) => unitlessValue(p.counterTypography?.counterFont?.lineHeight, 1.3),
    ],
    [
        "clls",
        (p) => {
            const v = p.counterTypography?.counterFont?.letterSpacing
            if (v === undefined || v === null || v === "") return "0.22em"
            if (typeof v === "number") return `${v}px`
            return v
        },
    ],
    [
        "clw",
        (p) => unitlessValue(p.counterTypography?.counterFont?.fontWeight, 600),
    ],
    ["clt", (p) => p.counterTypography?.counterTextTransform ?? "uppercase"],
    ["cla", (p) => p.counterTypography?.counterFont?.textAlign || "left"],
    ["clc", (p) => p.counterColors?.counterLabelColor || ""],
    ["ccfc", (p) => p.counterColors?.counterCountColor || ""],
    ["cbbg", (p) => p.controlBarColors.controlBarBg],
    ["cbb", (p) => p.controlBarColors.controlBarBorder],
    ["cbbt", (p) => p.controlBarColors.controlBtnText],
    ["cbbh", (p) => p.controlBarColors.controlBtnHoverBg],
    ["cbba", (p) => p.controlBarColors.controlBtnActiveBg],
    ["cbbat", (p) => p.controlBarColors.controlBtnActiveText],
    ["afbg", (p) => p.autoplayButtonColors.autoplayFabBg],
    ["afbh", (p) => p.autoplayButtonColors.autoplayFabHoverBg],
    ["afbb", (p) => p.autoplayButtonColors.autoplayFabBorder],
    ["afbt", (p) => p.autoplayButtonColors.autoplayFabText],
    ["afba", (p) => p.autoplayButtonColors.autoplayFabActiveBg],
    ["afbat", (p) => p.autoplayButtonColors.autoplayFabActiveText],
    ["dcbg", (p) => p.dragCursor.dragCursorBg],
    ["dctxt", (p) => p.dragCursor.dragCursorText],
    ["ccbg", (p) => p.closeCursor.closeCursorBg],
    ["cctxt", (p) => p.closeCursor.closeCursorText],
    [
        "fab-top",
        (p) =>
            p.autoplaySettings.fabPosition.startsWith("top") ? "36px" : "auto",
    ],
    [
        "fab-bottom",
        (p) =>
            p.autoplaySettings.fabPosition.startsWith("bottom")
                ? "36px"
                : "auto",
    ],
    [
        "fab-left",
        (p) =>
            p.autoplaySettings.fabPosition.endsWith("left") ? "40px" : "auto",
    ],
    [
        "fab-right",
        (p) =>
            p.autoplaySettings.fabPosition.endsWith("right") ? "40px" : "auto",
    ],
    ["cab-bg", (p) => p.actionButton.actionButtonBg],
    ["cab-hbg", (p) => p.actionButton.actionButtonHoverBg],
    ["cab-ic", (p) => p.actionButton.actionButtonIconColor],
    ["cab-hic", (p) => p.actionButton.actionButtonHoverIconColor],
    ["cab-size", (p) => `${p.actionButton.actionButtonSize}px`],
    ["cab-icon-size", (p) => `${p.actionButton.actionButtonIconSize}%`],
    ["cab-radius", (p) => `${p.actionButton.actionButtonBorderRadius}px`],
    [
        "cab-top",
        (p) =>
            p.actionButton.actionButtonPosition.startsWith("top")
                ? "14px"
                : "auto",
    ],
    [
        "cab-bottom",
        (p) =>
            p.actionButton.actionButtonPosition.startsWith("bottom")
                ? "14px"
                : "auto",
    ],
    [
        "cab-left",
        (p) =>
            p.actionButton.actionButtonPosition.endsWith("left")
                ? "14px"
                : "auto",
    ],
    [
        "cab-right",
        (p) =>
            p.actionButton.actionButtonPosition.endsWith("right")
                ? "14px"
                : "auto",
    ],
]
function buildVars(props: CarouselProps): string {
    return CSS_VAR_MAP.map(([key, get]) => `--${key}:${get(props)}`).join(";")
}
const staticCSSCache = new Map<string, string>()
function buildStaticCSS(uid: string): string {
    const cached = staticCSSCache.get(uid)
    if (cached) return cached
    const s = `.mc-${uid}`
    const css = `
${s}{display:flex;flex-direction:column;width:100%;height:100%;position:relative;font-family:'Inter',sans-serif;background:var(--bg-color);color:var(--ctc);--carousel-h:calc(var(--card-h) + 60px)}
${s} .top-bar{display:flex;justify-content:space-between;align-items:flex-start;padding:36px 40px;z-index:500;pointer-events:none;transition:opacity .4s cubic-bezier(.16,1,.3,1),transform .4s cubic-bezier(.16,1,.3,1)}
${s} .top-bar > *{pointer-events:auto}
${s} .top-bar.heading-hidden{opacity:0;transform:translateY(-12px);pointer-events:none;max-height:0;padding-top:0;padding-bottom:0;overflow:hidden}
${s} .reel-meta{max-width:600px;transition:opacity 0.5s cubic-bezier(0.16,1,0.3,1),transform 0.5s cubic-bezier(0.16,1,0.3,1)}
${s} .reel-meta.hidden{opacity:0;transform:translateY(-10px);pointer-events:none;display:none}
${s} .reel-meta.animate-in{opacity:1;transform:translateY(0)}
${s} .reel-eyebrow{display:flex;align-items:baseline;gap:14px;margin-bottom:16px}
${s} .reel-eyebrow .label{font-family:var(--clf);font-size:var(--cls);font-weight:var(--clw);letter-spacing:var(--clls);line-height:var(--cllh);text-transform:var(--clt);text-align:var(--cla);color:var(--clc, var(--ctc))}
${s} .reel-eyebrow .count{font-family:var(--clf);font-size:var(--cls);font-weight:var(--clw);letter-spacing:var(--clls);line-height:var(--cllh);text-transform:var(--clt);text-align:var(--cla);color:var(--ccfc, var(--cdc))}
${s} .reel-eyebrow .label.hidden,${s} .reel-eyebrow .count.hidden{display:none}
${s} .reel-progress{width:140px;height:2px;background:var(--cbb);border-radius:2px;overflow:hidden;margin-bottom:26px}
${s} .reel-progress-fill{height:100%;width:0%;background:var(--ctc);border-radius:2px;transition:width 0.4s cubic-bezier(0.16,1,0.3,1)}
${s} .bg-title{font-family:var(--tf);font-weight:var(--tw);font-size:clamp(30px,4vw,54px);line-height:1.04;letter-spacing:-0.01em;margin-bottom:16px;overflow:hidden;color:var(--ctc)}
${s} .bg-title span{display:inline-block;margin-right:.2em;will-change:transform,opacity}
${s} .bg-desc{color:var(--cdc);font-family:var(--df);font-size:15px;line-height:1.6;font-weight:400;max-width:480px;transition:opacity 0.4s cubic-bezier(0.16,1,0.3,1)}
${s} .header-static{max-width:600px;transition:opacity 0.5s cubic-bezier(0.16,1,0.3,1),transform 0.5s cubic-bezier(0.16,1,0.3,1)}
${s} .header-static.hidden{opacity:0;transform:translateY(-10px);pointer-events:none;display:none}
${s} .header-static.animate-in{opacity:1;transform:translateY(0)}
${s} .header-static-eyebrow{display:flex;align-items:baseline;gap:14px;margin-bottom:16px}
${s} .header-static-eyebrow .label{font-family:var(--clf);font-size:var(--cls);font-weight:var(--clw);letter-spacing:var(--clls);line-height:var(--cllh);text-transform:var(--clt);text-align:var(--cla);color:var(--clc, var(--ctc))}
${s} .header-static-eyebrow .count{font-family:var(--clf);font-size:var(--cls);font-weight:var(--clw);letter-spacing:var(--clls);line-height:var(--cllh);text-transform:var(--clt);text-align:var(--cla);color:var(--ccfc, var(--cdc))}
${s} .header-static-eyebrow .label.hidden,${s} .header-static-eyebrow .count.hidden{display:none}
${s} .header-static-title{font-family:var(--htf);font-weight:var(--htw);font-size:var(--hts);line-height:var(--htlh);letter-spacing:var(--htls);text-transform:var(--htt);text-align:var(--htta);color:var(--htc);margin-bottom:16px;overflow:hidden}
${s} .header-static-title.animate-in{animation:headerSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards}
${s} .header-static-desc{color:var(--hdc);font-family:var(--hdf);font-size:var(--hds);font-weight:var(--hdw);line-height:var(--hdlh);letter-spacing:var(--hdls);text-transform:var(--hdt);text-align:var(--hdta);max-width:480px}
${s} .header-static-desc.animate-in{animation:headerSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards}
@keyframes headerSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
${s} .control-bar{position:absolute;display:flex;align-items:center;gap:8px;padding:8px;border-radius:999px;background:var(--afbg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--afbb);z-index:999;top:var(--fab-top);bottom:var(--fab-bottom);left:var(--fab-left);right:var(--fab-right);pointer-events:auto;width:fit-content;height:fit-content}
${s} .ctrl-btn{width:36px;height:36px;border-radius:50%;border:1px solid var(--cbb);background:var(--cbbg);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:var(--cbbt);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .25s cubic-bezier(.16,1,.3,1);flex-shrink:0;pointer-events:auto}
${s} .ctrl-btn:hover{background:var(--cbba);color:var(--cbbat);transform:scale(1.05)}
${s} .ctrl-btn:active{transform:scale(.95)}
${s} .autoplay-toggle{display:flex;align-items:center;gap:8px;padding:0 14px;height:36px;border-radius:999px;border:none;background:transparent;color:var(--afbt);font-size:12px;font-weight:600;letter-spacing:.03em;cursor:pointer;transition:all .2s cubic-bezier(.16,1,.3,1)}
${s} .autoplay-toggle:hover{background:var(--afbh);color:var(--afbt)}
${s} .autoplay-toggle.active{background:var(--afba);color:var(--afbat)}
${s} .autoplay-toggle .autoplay-icon{font-size:9px;opacity:.8}
${s} .autoplay-toggle.active .autoplay-icon{opacity:1}
${s} .nav-btn{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:var(--cbbg);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:var(--cbbt);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;z-index:50;transition:all .25s cubic-bezier(.16,1,.3,1);border:1px solid var(--cbb)}
${s} .nav-btn:hover{background:var(--cbba);color:var(--cbbat);transform:translateY(-50%) scale(1.08)}
${s} .nav-btn:active{transform:translateY(-50%) scale(.92)}
${s} .nav-btn.prev{left:32px}
${s} .nav-btn.next{right:32px}
${s} .nav-btn.with-text{width:auto;padding:0 18px 0 14px;border-radius:999px}
${s} .nav-btn.with-text.next{padding:0 14px 0 18px}
${s} .nav-btn .nav-btn-label{font-size:12px;font-weight:600;letter-spacing:.02em;white-space:nowrap}
${s} .carousel-wrap{position:relative;width:100%;height:var(--carousel-h);display:flex;align-items:center;overflow:hidden;cursor:none;z-index:10;outline:none;touch-action:none;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
${s} .carousel{display:flex;gap:var(--card-gap);will-change:transform;transform:translate3d(0,0,0)}
${s} .card{width:var(--card-w);height:var(--card-h);border-radius:var(--card-radius);overflow:hidden;flex-shrink:0;position:relative;background:var(--card-bg);cursor:pointer;transform-style:preserve-3d;will-change:transform;touch-action:none;backface-visibility:hidden;transform:translateZ(0)}
${s} .card img,${s} .card video{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;will-change:transform}
${s} .card.parallax-media img,${s} .card.parallax-media video,${s} .card.parallax-media .yt-wrap{width:calc(100% + 2 * var(--parallax-shift, 12) * 1%) !important;left:calc(-1 * var(--parallax-shift, 12) * 1%) !important;height:100% !important;top:0 !important;position:absolute !important;object-fit:cover !important;pointer-events:none;will-change:transform}
${s} .card.parallax-media.layout-below .media-container > img,${s} .card.parallax-media.layout-below .media-container > video,${s} .card.parallax-media.layout-below .media-container > .yt-wrap{width:calc(100% + 2 * var(--parallax-shift, 12) * 1%) !important;left:calc(-1 * var(--parallax-shift, 12) * 1%) !important}
${s} .yt-wrap{width:100%;height:100%;position:relative;pointer-events:none;overflow:hidden}
${s} .yt-wrap iframe{position:absolute;top:50%;left:50%;width:180%;height:180%;transform:translate(-50%,-50%);border:none;pointer-events:none}
${s} .card.active .yt-wrap{pointer-events:auto}
${s} .yt-play-icon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;z-index:10;transition:opacity 0.3s ease,transform 0.25s cubic-bezier(0.16,1,0.3,1)}
${s} .yt-play-icon:hover{transform:translate(-50%,-50%) scale(1.08)}
${s} .yt-play-icon:active{transform:translate(-50%,-50%) scale(0.95)}
${s} .info-panel{position:absolute;left:0;right:0;bottom:0;padding:26px 20px 20px;pointer-events:none;background:linear-gradient(to top,var(--ig0) 0%,var(--ig1) 45%,var(--ig2) 100%);opacity:1;transform:none;z-index:4}
${s} .info-panel .info-title{color:var(--itc);font-family:var(--tf);font-size:var(--ts);font-weight:var(--tw);letter-spacing:var(--tls);line-height:var(--tlh);text-transform:var(--tt);text-align:var(--tta);margin-bottom:6px;text-shadow:0 2px 10px rgba(0,0,0,.5);overflow:hidden}
${s} .info-panel .info-title span{display:inline-block;will-change:transform,opacity}
${s} .info-panel .info-desc{color:var(--idc);font-family:var(--df);font-size:var(--ds);font-weight:var(--dw);letter-spacing:var(--dls);line-height:var(--dlh);text-transform:var(--dt);text-align:var(--dta);max-width:92%;text-shadow:0 1px 6px rgba(0,0,0,.4)}
${s} .media-controls{position:absolute;bottom:16px;left:16px;display:none;gap:8px;align-items:center;pointer-events:auto;z-index:5}
${s} .card.has-audio .media-controls{display:flex}
${s} .card.has-audio .info-panel{padding-bottom:64px}
${s} .expand-btn{position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:50%;border:none;background:var(--cbbg);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:var(--cbbt);font-size:14px;cursor:pointer;display:none;align-items:center;justify-content:center;pointer-events:auto;transition:all .25s cubic-bezier(.16,1,.3,1);z-index:6;border:1px solid var(--cbb)}
${s} .expand-btn:hover{background:var(--cbba);color:var(--cbbat);transform:scale(1.08)}
${s} .expand-btn:active{transform:scale(.92)}
${s} .card.has-audio .expand-btn{display:flex}
${s} .card.has-expand .expand-btn{display:flex}
${s} .card-action-btn{position:absolute;z-index:15;width:var(--cab-size);height:var(--cab-size);border-radius:var(--cab-radius);background:var(--cab-bg);color:var(--cab-ic);border:none;cursor:pointer;display:none;align-items:center;justify-content:center;transition:all .25s cubic-bezier(.16,1,.3,1);pointer-events:auto;text-decoration:none;top:var(--cab-top);bottom:var(--cab-bottom);left:var(--cab-left);right:var(--cab-right)}
${s} .card-action-btn svg{width:var(--cab-icon-size);height:var(--cab-icon-size);transition:transform 0.4s cubic-bezier(0.16,1,0.3,1)}
${s} .card-action-btn svg path{stroke:currentColor;transition:stroke 0.25s cubic-bezier(0.16,1,0.3,1)}
${s} .card-action-btn:hover{background:var(--cab-hbg);color:var(--cab-hic);transform:scale(1.08)}
${s} .card-action-btn:hover svg{transform:translate(3px,-3px)}
${s} .card-action-btn:active{transform:scale(.95)}
${s} .card.has-action-btn .card-action-btn{display:flex}
${s} .card::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,var(--card-overlay-op));pointer-events:none;z-index:3}
${s} .card:not(.active)::after{background:rgba(0,0,0,var(--card-overlay-op))}
${s} .card.layout-below{display:flex;flex-direction:column;background:transparent !important;border-radius:0 !important;overflow:visible !important;height:var(--card-h) !important;align-self:stretch}
${s} .card.layout-below .media-container{position:relative;flex:1 1 0px;min-height:0;width:100%;overflow:hidden;border-radius:var(--card-radius)}
${s} .card.layout-below .media-container > img,${s} .card.layout-below .media-container > video,${s} .card.layout-below .media-container > .yt-wrap{position:absolute !important;top:0 !important;left:0 !important;width:100% !important;height:100% !important}
${s} .card.layout-below::after{display:none !important}
${s} .card.layout-below .media-container::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,var(--card-overlay-op));pointer-events:none;z-index:3;border-radius:var(--card-radius)}
${s} .card.layout-below.active .media-container::after{background:rgba(0,0,0,var(--card-overlay-op))}
${s} .card.layout-below:not(.active) .media-container::after{background:rgba(0,0,0,var(--card-overlay-op))}
${s} .overlay{position:fixed;inset:0;background:var(--obg);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s;cursor:none}
${s} .overlay.open{opacity:1;pointer-events:auto}
${s} .overlay-inner{position:relative;width:min(880px,92vw);aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000;cursor:auto}
${s} .overlay-inner video,${s} .overlay-inner iframe{width:100%;height:100%;border:none;display:block}
${s} .overlay-close{position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,255,255,.7);background:rgba(0,0,0,.7);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,transform .12s}
${s} .overlay-close:hover{background:#fff;color:#000;transform:scale(1.1)}
${s} .overlay-info{margin-top:24px;text-align:center;max-width:min(880px,92vw);cursor:auto;padding:0 20px}
${s} .overlay-title{color:var(--itc);font-family:var(--otf);font-size:var(--ots);font-weight:var(--otw);letter-spacing:var(--otls);line-height:var(--otlh);text-transform:var(--ott);text-align:var(--otta);margin-bottom:8px}
${s} .overlay-desc{color:var(--idc);font-family:var(--odf);font-size:var(--ods);font-weight:var(--odw);letter-spacing:var(--odls);line-height:var(--odlh);text-transform:var(--odt);text-align:var(--odta);margin-bottom:12px}
${s} .overlay-label{margin-top:8px;font-size:13px;color:rgba(255,255,255,.5);letter-spacing:.4px;cursor:auto}
${s} .drag-cursor{position:fixed;top:0;left:0;width:84px;height:84px;border-radius:50%;background:var(--dcbg);color:var(--dctxt);display:flex;align-items:center;justify-content:center;pointer-events:none;transform:translate(-50%,-50%) scale(0);z-index:9999;font-size:11px;font-weight:700;letter-spacing:.08em;opacity:0;transition:opacity 0s}
${s} .drag-cursor.dragging{width:110px;height:110px}
${s} .close-cursor{position:fixed;top:0;left:0;width:90px;height:90px;border-radius:50%;background:var(--ccbg);color:var(--cctxt);display:flex;align-items:center;justify-content:center;pointer-events:none;transform:translate(-50%,-50%) scale(0);z-index:1001;font-size:12px;font-weight:600;letter-spacing:.5px;opacity:0;text-align:center}
${s} .static-carousel-wrap{width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;background:var(--bg-color);position:relative}
${s} .static-top-bar{display:flex;justify-content:space-between;align-items:flex-start;padding:36px 40px;z-index:500;transition:opacity .4s cubic-bezier(.16,1,.3,1),transform .4s cubic-bezier(.16,1,.3,1)}
${s} .static-top-bar.heading-hidden{opacity:0;transform:translateY(-12px);pointer-events:none;max-height:0;padding-top:0;padding-bottom:0;overflow:hidden}
${s} .static-reel-meta{max-width:600px}
${s} .static-reel-meta.hidden{display:none}
${s} .static-reel-eyebrow{display:flex;align-items:baseline;gap:14px;margin-bottom:16px}
${s} .static-reel-eyebrow .label{font-family:var(--clf);font-size:var(--cls);font-weight:var(--clw);letter-spacing:var(--clls);line-height:var(--cllh);text-transform:var(--clt);text-align:var(--cla);color:var(--clc, var(--ctc))}
${s} .static-reel-eyebrow .count{font-family:var(--clf);font-size:var(--cls);font-weight:var(--clw);letter-spacing:var(--clls);line-height:var(--cllh);text-transform:var(--clt);text-align:var(--cla);color:var(--ccfc, var(--cdc))}
${s} .static-reel-eyebrow .label.hidden,${s} .static-reel-eyebrow .count.hidden{display:none}
${s} .static-reel-progress{width:140px;height:2px;background:var(--cbb);border-radius:2px;overflow:hidden;margin-bottom:26px}
${s} .static-reel-progress-fill{height:100%;background:var(--ctc);border-radius:2px}
${s} .static-bg-title{font-family:var(--tf);font-weight:var(--tw);font-size:clamp(30px,4vw,54px);line-height:1.04;letter-spacing:-0.01em;margin-bottom:16px;overflow:hidden;color:var(--ctc)}
${s} .static-bg-title span{display:inline-block;margin-right:.2em}
${s} .static-bg-desc{color:var(--cdc);font-family:var(--df);font-size:15px;line-height:1.6;font-weight:400;max-width:480px}
${s} .static-header-static{max-width:600px}
${s} .static-header-static.hidden{display:none}
${s} .static-header-static-eyebrow{display:flex;align-items:baseline;gap:14px;margin-bottom:16px}
${s} .static-header-static-eyebrow .label{font-family:var(--clf);font-size:var(--cls);font-weight:var(--clw);letter-spacing:var(--clls);line-height:var(--cllh);text-transform:var(--clt);text-align:var(--cla);color:var(--clc, var(--ctc))}
${s} .static-header-static-eyebrow .count{font-family:var(--clf);font-size:var(--cls);font-weight:var(--clw);letter-spacing:var(--clls);line-height:var(--cllh);text-transform:var(--clt);text-align:var(--cla);color:var(--ccfc, var(--cdc))}
${s} .static-header-static-eyebrow .label.hidden,${s} .static-header-static-eyebrow .count.hidden{display:none}
${s} .static-header-static-title{font-family:var(--htf);font-weight:var(--htw);font-size:var(--hts);line-height:var(--htlh);letter-spacing:var(--htls);text-transform:var(--htt);text-align:var(--htta);color:var(--htc);margin-bottom:16px;overflow:hidden}
${s} .static-header-static-desc{color:var(--hdc);font-family:var(--hdf);font-size:var(--hds);font-weight:var(--hdw);line-height:var(--hdlh);letter-spacing:var(--hdls);text-transform:var(--hdt);text-align:var(--hdta);max-width:480px}
${s} .static-control-bar{position:absolute;display:flex;align-items:center;gap:8px;padding:8px;border-radius:999px;background:var(--afbg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--afbb);z-index:999;top:var(--fab-top);bottom:var(--fab-bottom);left:var(--fab-left);right:var(--fab-right);pointer-events:auto;width:fit-content;height:fit-content}
${s} .static-ctrl-btn{width:36px;height:36px;border-radius:50%;border:none;background:transparent;color:var(--cbbt);font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
${s} .static-autoplay-toggle{display:flex;align-items:center;gap:8px;padding:0 14px;height:36px;border-radius:999px;border:none;background:transparent;color:var(--afbt);font-size:12px;font-weight:600;letter-spacing:.03em}
${s} .static-autoplay-toggle.active{background:var(--afba);color:var(--afbat)}
${s} .static-autoplay-toggle .autoplay-icon{font-size:9px;opacity:.8}
${s} .static-autoplay-toggle.active .autoplay-icon{opacity:1}
${s} .static-nav-btn{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;background:var(--cbbg);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:var(--cbbt);font-size:16px;display:flex;align-items:center;justify-content:center;gap:6px;z-index:50;border:1px solid var(--cbb)}
${s} .static-nav-btn.prev{left:32px}
${s} .static-nav-btn.next{right:32px}
${s} .static-nav-btn.with-text{width:auto;padding:0 18px 0 14px;border-radius:999px}
${s} .static-nav-btn.with-text.next{padding:0 14px 0 18px}
${s} .static-nav-btn .nav-btn-label{font-size:12px;font-weight:600;letter-spacing:.02em;white-space:nowrap}
${s} .static-action-btn{position:absolute;z-index:15;width:var(--cab-size);height:var(--cab-size);border-radius:var(--cab-radius);background:var(--cab-bg);color:var(--cab-ic);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;pointer-events:auto;text-decoration:none;top:var(--cab-top);bottom:var(--cab-bottom);left:var(--cab-left);right:var(--cab-right);transition:all .25s cubic-bezier(.16,1,.3,1)}
${s} .static-action-btn svg{width:var(--cab-icon-size);height:var(--cab-icon-size);transition:transform 0.4s cubic-bezier(0.16,1,0.3,1)}
${s} .static-action-btn svg path{stroke:currentColor;transition:stroke 0.25s cubic-bezier(0.16,1,0.3,1)}
${s} .static-action-btn:hover{background:var(--cab-hbg);color:var(--cab-hic);transform:scale(1.08)}
${s} .static-action-btn:hover svg{transform:translate(3px,-3px)}
${s} .static-carousel-container{position:relative;width:100%;height:var(--carousel-h);display:flex;align-items:center;justify-content:center;overflow:hidden}
${s} .static-carousel{display:flex;gap:var(--card-gap);align-items:center}
${s} .static-card{width:var(--card-w);height:var(--card-h);border-radius:var(--card-radius);overflow:hidden;flex-shrink:0;position:relative;background:var(--card-bg)}
${s} .static-card:first-child{transform:scale(1.08);z-index:2}
${s} .static-card:not(:first-child){transform:scale(0.88);opacity:0.7}
${s} .static-card img{width:100%;height:100%;object-fit:cover;display:block}
${s} .static-card-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(128,128,128,.15);color:rgba(128,128,128,.6);font-size:13px;font-family:Inter,sans-serif}
${s} .static-info-panel{position:absolute;left:0;right:0;bottom:0;padding:26px 20px 20px;background:linear-gradient(to top,var(--ig0) 0%,var(--ig1) 45%,var(--ig2) 100%);opacity:1;z-index:4}
${s} .static-info-title{color:var(--itc);font-family:var(--tf);font-size:var(--ts);font-weight:var(--tw);letter-spacing:var(--tls);line-height:var(--tlh);text-transform:var(--tt);text-align:var(--tta);margin-bottom:6px;text-shadow:0 2px 10px rgba(0,0,0,.5)}
${s} .static-info-desc{color:var(--idc);font-family:var(--df);font-size:var(--ds);font-weight:var(--dw);letter-spacing:var(--dls);line-height:var(--dlh);text-transform:var(--dt);text-align:var(--dta);max-width:92%;text-shadow:0 1px 6px rgba(0,0,0,.4)}
${s} .static-video-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;color:#555;font-size:13px;font-family:Inter,sans-serif;flex-direction:column;gap:8px}
${s} .static-play-icon{width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);font-size:18px}
${s} .static-card.layout-below{background:transparent !important;border-radius:0 !important;overflow:visible !important;display:flex;flex-direction:column;height:var(--card-h) !important;align-self:stretch}
${s} .static-card.layout-below .media-container{position:relative;flex:1 1 auto;min-height:0;width:100%;overflow:hidden;border-radius:var(--card-radius)}
${s} .static-card.layout-below .info-panel{border-radius:0 0 var(--card-radius) var(--card-radius);position:relative !important;bottom:auto !important;left:auto !important;right:auto !important;background:var(--cibg) !important;opacity:1 !important;transform:none !important;padding:16px 20px !important;flex-shrink:0}
${s} .static-card.layout-below .info-panel .info-title{color:var(--ctc) !important;text-shadow:none !important;text-align:var(--tta) !important}
${s} .static-card.layout-below .info-panel .info-desc{color:var(--cdc) !important;text-shadow:none !important;text-align:var(--dta) !important}
@media (prefers-reduced-motion: reduce){${s} .info-panel,${s} .overlay{transition:none!important}${s} .card{transition:none!important}${s} .header-static-title.animate-in,${s} .header-static-desc.animate-in{animation:none!important;opacity:1!important;transform:none!important}${s} .card-action-btn svg,${s} .static-action-btn svg{transition:none!important}}
@media (max-width: 768px) {
${s} .top-bar, ${s} .static-top-bar { padding: 24px 24px; flex-wrap: wrap; gap: 20px; }
${s} .reel-meta, ${s} .static-reel-meta, ${s} .header-static, ${s} .static-header-static { max-width: 100%; }
${s} .bg-title, ${s} .static-bg-title { font-size: clamp(24px, 5vw, 36px); line-height: 1.1; }
${s} .header-static-title, ${s} .static-header-static-title { font-size: clamp(24px, 5vw, 32px); }
${s} .bg-desc, ${s} .static-bg-desc, ${s} .header-static-desc, ${s} .static-header-static-desc { font-size: 13px; }
${s} .nav-btn.prev, ${s} .static-nav-btn.prev { left: 16px; }
${s} .nav-btn.next, ${s} .static-nav-btn.next { right: 16px; }
}
@media (max-width: 480px) {
${s} .top-bar, ${s} .static-top-bar { padding: 16px 20px; gap: 16px; }
${s} .control-bar, ${s} .static-control-bar { width: fit-content; left: 50%; right: auto; top: auto; bottom: var(--fab-bottom); transform: translateX(-50%); }
${s} .reel-progress, ${s} .static-reel-progress { width: 100px; }
${s} .nav-btn, ${s} .static-nav-btn { width: 36px; height: 36px; font-size: 14px; }
${s} .nav-btn.prev, ${s} .static-nav-btn.prev { left: 12px; }
${s} .nav-btn.next, ${s} .static-nav-btn.next { right: 12px; }
${s} .nav-btn.with-text, ${s} .static-nav-btn.with-text { width: 36px; padding: 0; }
${s} .nav-btn .nav-btn-label, ${s} .static-nav-btn .nav-btn-label { display: none; }
}
`
    staticCSSCache.set(uid, css)
    return css
}
// ─── Root component ───────────────────────────────────────────────────────────
/**
 * @framerDisableUnlink
 */
export default function MediaCarousel(props: CarouselProps) {
    const isStatic = useIsStaticRenderer()
    const rawId = useId()
    const uid = rawId.replace(/:/g, "")
    const staticCSS = useMemo(() => buildStaticCSS(uid), [uid])
    useEffect(() => {
        return () => {
            staticCSSCache.delete(uid)
        }
    }, [uid])
    const vars = buildVars(props)
    const css = `${staticCSS}
.mc-${uid}{${vars}}`
    return (
        <div className={`mc-${uid}`}>
            <style>{css}</style>
            {isStatic ? (
                <StaticCarousel {...props} />
            ) : (
                <CarouselCore uid={uid} {...props} />
            )}
        </div>
    )
}
MediaCarousel.defaultProps = {
    items: [
        {
            mediaType: "Youtube",
            youtubeLink: "https://www.youtube.com/watch?v=UzkN8c0eP4w",
            title: "Modern Architecture Concepts",
            description:
                "Exploring contemporary architectural design principles and innovative building concepts",
            link: { type: "url", url: "#project-1", target: "_self" },
        },
        {
            mediaType: "Youtube",
            youtubeLink: "https://www.youtube.com/watch?v=g1ibhRZE4uE",
            title: "Sustainable Architecture",
            description:
                "Green building design and eco-friendly architectural solutions for the future",
            link: { type: "url", url: "#project-2", target: "_self" },
        },
        {
            mediaType: "Youtube",
            youtubeLink: "https://www.youtube.com/watch?v=VvJlT8G0q7k",
            title: "Parametric Design",
            description:
                "Computational design and algorithmic architecture concepts",
            link: { type: "url", url: "#project-3", target: "_self" },
        },
        {
            mediaType: "Youtube",
            youtubeLink: "https://www.youtube.com/watch?v=QH2-TGUlwu4",
            title: "Minimalist Architecture",
            description:
                "Clean lines and simple forms in modern architectural design",
            link: { type: "url", url: "#project-4", target: "_self" },
        },
        {
            mediaType: "Youtube",
            youtubeLink: "https://www.youtube.com/watch?v=nxLbBMLu4uI",
            title: "Futuristic Architecture",
            description:
                "Visionary concepts and future trends in architectural design",
            link: { type: "url", url: "#project-5", target: "_self" },
        },
    ],
    autoplaySettings: {
        autoplay: false,
        speed: 1.5,
        infiniteLoop: true,
        mediaPauseDuration: 5,
        fabPosition: "bottom-right",
    },
    motion: {
        transitionEffect: "Standard",
        smoothness: 0.08,
        dragPower: 0.7,
        activeDistance: 120,
        maxScale: 1.12,
        minScale: 0.82,
        inactiveOpacity: 1,
        parallaxEffect: false,
        parallaxIntensity: 50,
        skewEffect: false,
        skewAmount: 15,
        skewMode: "hover",
        tiltEffect: false,
        tiltAmount: 15,
        tiltPerspective: 1000,
    },
    cardLayout: {
        cardWidth: 172,
        cardHeight: 264,
        cardGap: 24,
        cardBorderRadius: 14,
        backgroundColor: "#ffffff",
        cardBackgroundColor: "#000000",
        cardOverlayOpacity: 0.22,
        infoPosition: "overlay",
        headerTitle: "Recent Projects",
        headerDescription:
            "A curated collection of our latest architectural works, showcasing innovation and design excellence.",
        showHeading: true,
    },
    navigation: {
        showControls: false,
        keyboardNav: true,
        mouseWheel: true,
        mouseWheelInvert: false,
        mouseWheelSpeed: 1,
        hoverPause: true,
        showNavText: true,
        showCounter: true,
        showReelLabel: true,
    },
    dragCursor: {
        showDragCursor: true,
        dragCursorBg: "#000000",
        dragCursorText: "#ffffff",
    },
    closeCursor: {
        showCloseCursor: true,
        closeCursorBg: "#000000",
        closeCursorText: "#ffffff",
    },
    infoPanelColors: {
        infoGradientStart: "rgba(0,0,0,0.85)",
        infoGradientMid: "rgba(0,0,0,0.55)",
        infoGradientEnd: "rgba(0,0,0,0)",
        infoTitleColor: "#ffffff",
        infoDescColor: "rgba(255,255,255,0.82)",
        overlayBg: "rgba(0,0,0,0.88)",
        cardTitleColor: "#000000",
        cardDescColor: "rgba(0,0,0,0.82)",
        cardInfoBgColor: "#ffffff",
    },
    titleTypography: {
        titleFont: {
            fontFamily: "Fraunces",
            fontSize: 19,
            fontWeight: 500,
            textAlign: "left",
            lineHeight: 1.3,
            letterSpacing: 0.2,
        },
        titleTextTransform: "none",
    },
    descTypography: {
        descFont: {
            fontFamily: "Inter",
            fontSize: 12.5,
            textAlign: "left",
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
        },
        descTextTransform: "none",
    },
    overlayTitleTypography: {
        overlayTitleFont: {
            fontFamily: "Inter",
            fontSize: 24,
            textAlign: "left",
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: 0.2,
        },
        overlayTitleTextTransform: "none",
    },
    overlayDescTypography: {
        overlayDescFont: {
            fontFamily: "Inter",
            fontSize: 14,
            textAlign: "left",
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
        },
        overlayDescTextTransform: "none",
    },
    headerTypography: {
        headerTitleFont: {
            fontFamily: "Inter",
            fontSize: 36,
            fontWeight: 700,
            textAlign: "left",
            lineHeight: 1.1,
            letterSpacing: -0.5,
        },
        headerTitleTextTransform: "none",
        headerTitleColor: "#ffffff",
        headerDescFont: {
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 400,
            textAlign: "left",
            lineHeight: 1.6,
            letterSpacing: 0,
        },
        headerDescTextTransform: "none",
        headerDescColor: "rgba(255,255,255,0.7)",
    },
    counterTypography: {
        counterFont: {
            fontFamily: "Inter",
            fontSize: 11,
            fontWeight: 600,
            textAlign: "left",
            lineHeight: 1.3,
            letterSpacing: 0.22,
        },
        counterTextTransform: "uppercase",
    },
    counterColors: { counterLabelColor: "", counterCountColor: "" },
    controlBarColors: {
        controlBarBg: "rgba(255,255,255,0.95)",
        controlBarBorder: "rgba(0,0,0,0.1)",
        controlBtnText: "#000000",
        controlBtnHoverBg: "rgba(0,0,0,0.08)",
        controlBtnActiveBg: "#000000",
        controlBtnActiveText: "#ffffff",
    },
    autoplayButtonColors: {
        autoplayFabBg: "rgba(255,255,255,0.95)",
        autoplayFabHoverBg: "rgba(0,0,0,0.08)",
        autoplayFabBorder: "rgba(0,0,0,0.9)",
        autoplayFabText: "#000000",
        autoplayFabActiveBg: "#000000",
        autoplayFabActiveText: "#ffffff",
    },
    actionButton: {
        showActionButton: true,
        actionButtonBg: "#000000",
        actionButtonHoverBg: "#333333",
        actionButtonIconColor: "#ffffff",
        actionButtonHoverIconColor: "#ffffff",
        actionButtonSize: 44,
        actionButtonIconSize: 55,
        actionButtonBorderRadius: 50,
        actionButtonPosition: "bottom-right",
    },
}
// ─── Static preview ───────────────────────────────────────────────────────────
function StaticCarousel(props: CarouselProps) {
    const MEDIA = useMemo(
        () => normalizeItems(props.items).slice(0, 5),
        [props.items]
    )
    const {
        infoPosition,
        headerTitle,
        headerDescription,
        showHeading = true,
    } = props.cardLayout
    const { autoplay } = props.autoplaySettings
    const {
        showControls,
        showCounter = true,
        showReelLabel = true,
        showNavText = true,
    } = props.navigation
    const { showActionButton } = props.actionButton
    const renderStaticMedia = (item: NormalizedItem) => {
        if (item.type === "image") {
            return item.src ? (
                <img
                    src={item.src}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div className="static-card-placeholder">Preview</div>
            )
        }
        if (item.type === "youtube") {
            const ytId = getYouTubeId(item.src)
            const fallbackThumb = ytId
                ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
                : null
            const imgSrc = item.image || fallbackThumb
            return (
                <>
                    {imgSrc ? (
                        <img
                            src={imgSrc}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : (
                        <div className="static-video-placeholder">
                            <div className="static-play-icon">
                                <IconPlay />
                            </div>
                            <span>YouTube Video</span>
                        </div>
                    )}
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                            zIndex: 10,
                            width: "80%",
                            maxWidth: "120px",
                        }}
                    >
                        <svg
                            width="100"
                            height="70"
                            viewBox="0 0 68 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ width: "100%", height: "auto" }}
                        >
                            <path
                                d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.63-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
                                fill="#FF0000"
                            />
                            <path d="M45 24 27 14v20" fill="#FFF" />
                        </svg>
                    </div>
                </>
            )
        }
        if (item.type === "mp4") {
            return item.image ? (
                <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div className="static-video-placeholder">
                    <div className="static-play-icon">
                        <IconPlay />
                    </div>
                    <span>Video</span>
                </div>
            )
        }
        return (
            <div className="static-video-placeholder">
                <div className="static-play-icon">
                    <IconPlay />
                </div>
                <span>Video</span>
            </div>
        )
    }
    if (MEDIA.length === 0)
        return (
            <div className="static-carousel-wrap">
                <div
                    style={{
                        color: "#888",
                        fontSize: 13,
                        fontFamily: "Inter, sans-serif",
                        margin: "auto",
                    }}
                >
                    Add items in the property panel
                </div>
            </div>
        )
    const firstItem = MEDIA[0]
    const isHeaderMode = infoPosition === "header"
    const staticHTitle = headerTitle || "Recent Projects"
    const staticHDesc = headerDescription || ""
    return (
        <div className="static-carousel-wrap">
            <div
                className={`static-top-bar${!showHeading ? " heading-hidden" : ""}`}
            >
                <div
                    className={`static-header-static${isHeaderMode ? " hidden" : ""}`}
                >
                    {showCounter && (
                        <div className="static-header-static-eyebrow">
                            {showReelLabel && (
                                <span className="label">Reel</span>
                            )}
                            <span className="count">
                                {String(MEDIA.length).padStart(2, "0")}
                            </span>
                        </div>
                    )}
                    <div className="static-header-static-title">
                        {staticHTitle}
                    </div>
                    <div className="static-header-static-desc">
                        {staticHDesc}
                    </div>
                </div>
                <div
                    className={`static-reel-meta${!isHeaderMode ? " hidden" : ""}`}
                >
                    {showCounter && (
                        <div className="static-reel-eyebrow">
                            {showReelLabel && (
                                <span className="label">Reel</span>
                            )}
                            <span className="count">
                                01 / {String(MEDIA.length).padStart(2, "0")}
                            </span>
                        </div>
                    )}
                    <div className="static-reel-progress">
                        <div
                            className="static-reel-progress-fill"
                            style={{ width: `${(1 / MEDIA.length) * 100}%` }}
                        />
                    </div>
                    <div className="static-bg-title">
                        {firstItem?.title.split(" ").map((word, i) => (
                            <span key={i}>{word}</span>
                        ))}
                    </div>
                    <div className="static-bg-desc">{firstItem?.desc}</div>
                </div>
            </div>
            <div className="static-control-bar">
                <button
                    className={`static-autoplay-toggle ${autoplay ? "active" : ""}`}
                    aria-label={autoplay ? "Pause autoplay" : "Start autoplay"}
                >
                    <span className="autoplay-icon" aria-hidden="true">
                        {autoplay ? "⏸" : "▶"}
                    </span>
                    <span className="autoplay-label">
                        {autoplay ? "Pause" : "Autoplay"}
                    </span>
                </button>
            </div>
            <div className="static-carousel-container">
                <div className="static-carousel">
                    {MEDIA.map((item, i) => {
                        const isBelow = infoPosition === "below"
                        const showInfo = !isHeaderMode
                        const resolved = resolveLink(item.link)
                        return (
                            <div
                                className={`static-card${isBelow ? " layout-below" : ""}${i === 0 ? " active" : ""}`}
                                key={i}
                            >
                                {isBelow ? (
                                    <>
                                        <div className="media-container">
                                            {renderStaticMedia(item)}
                                            {showActionButton && resolved && (
                                                <a
                                                    className="static-action-btn"
                                                    href={resolved.href}
                                                    target={resolved.target}
                                                    rel={resolved.rel}
                                                    aria-label="View project"
                                                >
                                                    <IconArrowRight />
                                                </a>
                                            )}
                                        </div>
                                        {showInfo &&
                                            (item.title || item.desc) && (
                                                <div className="info-panel">
                                                    {item.title && (
                                                        <div className="info-title">
                                                            {item.title}
                                                        </div>
                                                    )}
                                                    {item.desc && (
                                                        <div className="info-desc">
                                                            {item.desc}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                    </>
                                ) : (
                                    <>
                                        {renderStaticMedia(item)}
                                        {showActionButton && resolved && (
                                            <a
                                                className="static-action-btn"
                                                href={resolved.href}
                                                target={resolved.target}
                                                rel={resolved.rel}
                                                aria-label="View project"
                                            >
                                                <IconArrowRight />
                                            </a>
                                        )}
                                        {showInfo &&
                                            (item.title || item.desc) && (
                                                <div className="static-info-panel">
                                                    {item.title && (
                                                        <div className="static-info-title">
                                                            {item.title}
                                                        </div>
                                                    )}
                                                    {item.desc && (
                                                        <div className="static-info-desc">
                                                            {item.desc}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
                {showControls && (
                    <>
                        <button
                            className={`static-nav-btn prev${showNavText ? " with-text" : ""}`}
                            title="Previous"
                            aria-label="Previous slide"
                        >
                            <IconPrev />
                            {showNavText && (
                                <span className="nav-btn-label">Prev</span>
                            )}
                        </button>
                        <button
                            className={`static-nav-btn next${showNavText ? " with-text" : ""}`}
                            title="Next"
                            aria-label="Next slide"
                        >
                            {showNavText && (
                                <span className="nav-btn-label">Next</span>
                            )}
                            <IconNext />
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
// ─── Overlay ──────────────────────────────────────────────────────────────────
function Overlay({
    state,
    onClose,
    showCloseCursor,
    closeCursorRef,
}: {
    state: OverlayState
    onClose: () => void
    showCloseCursor: boolean
    closeCursorRef: React.RefObject<HTMLDivElement>
}) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const prevFocusRef = useRef<HTMLElement | null>(null)
    const prefersReducedMotion = useMemo(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        []
    )
    useEffect(() => {
        if (state.open) {
            prevFocusRef.current = document.activeElement as HTMLElement
            requestAnimationFrame(() => closeButtonRef.current?.focus())
        } else {
            prevFocusRef.current?.focus()
        }
    }, [state.open])
    useEffect(() => {
        if (!state.open) return
        const overlay = overlayRef.current
        if (!overlay) return
        const handleFocusTrap = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
                return
            }
            if (e.key !== "Tab") return
            const focusable = overlay.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault()
                    last?.focus()
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault()
                    first?.focus()
                }
            }
        }
        window.addEventListener("keydown", handleFocusTrap)
        return () => window.removeEventListener("keydown", handleFocusTrap)
    }, [state.open, onClose])
    useEffect(() => {
        if (!state.open || !showCloseCursor || prefersReducedMotion) return
        const overlay = overlayRef.current
        const closeCursor = closeCursorRef.current
        if (!overlay || !closeCursor) return
        let mouseX = -500,
            mouseY = -500,
            cursorX = -500,
            cursorY = -500,
            revealed = false,
            visible = false
        const showCursor = () => {
            if (!visible) {
                visible = true
                gsap.to(closeCursor, {
                    scale: 1,
                    duration: prefersReducedMotion ? 0 : 0.2,
                })
            }
        }
        const hideCursor = () => {
            if (visible) {
                visible = false
                gsap.to(closeCursor, {
                    scale: 0,
                    duration: prefersReducedMotion ? 0 : 0.15,
                })
            }
        }
        const onMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY
            if (!revealed) {
                revealed = true
                gsap.set(closeCursor, { opacity: 1 })
            }
            if (e.target === overlay) showCursor()
            else hideCursor()
        }
        overlay.addEventListener("mousemove", onMove)
        overlay.addEventListener("mouseleave", hideCursor)
        const ticker = () => {
            cursorX += (mouseX - cursorX) * 0.2
            cursorY += (mouseY - cursorY) * 0.2
            gsap.set(closeCursor, { x: cursorX, y: cursorY })
        }
        gsap.ticker.add(ticker)
        return () => {
            overlay.removeEventListener("mousemove", onMove)
            overlay.removeEventListener("mouseleave", hideCursor)
            gsap.ticker.remove(ticker)
            hideCursor()
        }
    }, [state.open, showCloseCursor, prefersReducedMotion])
    const item = state.item
    const ytId = item?.type === "youtube" ? getYouTubeId(item.src) : null
    return (
        <div
            ref={overlayRef}
            className={`overlay${state.open ? " open" : ""}`}
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose()
            }}
            role="dialog"
            aria-modal="true"
            aria-label={item?.title || "Media lightbox"}
        >
            <div
                className="overlay-inner"
                style={
                    item?.type === "image"
                        ? {
                              aspectRatio: "unset",
                              maxWidth: "min(1200px,96vw)",
                              maxHeight: "90vh",
                              width: "auto",
                              height: "auto",
                          }
                        : {}
                }
            >
                <button
                    ref={closeButtonRef}
                    className="overlay-close"
                    onClick={onClose}
                    aria-label="Close lightbox"
                >
                    <IconClose />
                </button>
                {state.open && item && (
                    <>
                        {item.type === "image" && (
                            <img
                                src={item.src}
                                alt={item.title}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    background: "#000",
                                    display: "block",
                                }}
                            />
                        )}
                        {item.type === "mp4" && (
                            <video
                                src={item.src}
                                controls
                                autoPlay
                                loop
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    background: "#000",
                                }}
                            />
                        )}
                        {item.type === "youtube" && ytId && (
                            <iframe
                                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                                allow="autoplay; encrypted-media; fullscreen"
                                allowFullScreen
                                title={item.title || "YouTube video"}
                            />
                        )}
                    </>
                )}
            </div>
            <div className="overlay-info">
                {item?.title && (
                    <div className="overlay-title">{item.title}</div>
                )}
                {item?.desc && <div className="overlay-desc">{item.desc}</div>}
                <div className="overlay-label">
                    Press ESC or click outside to close
                </div>
            </div>
        </div>
    )
}
// ─── Live carousel ────────────────────────────────────────────────────────────
function CarouselCore({ uid, ...props }: CarouselProps & { uid: string }) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const carouselRef = useRef<HTMLDivElement>(null)
    const cursorRef = useRef<HTMLDivElement>(null)
    const closeCursorRef = useRef<HTMLDivElement>(null)
    const prevBtnRef = useRef<HTMLButtonElement>(null)
    const nextBtnRef = useRef<HTMLButtonElement>(null)
    const reelCountRef = useRef<HTMLSpanElement>(null)
    const reelLabelRef = useRef<HTMLSpanElement>(null)
    const reelProgressRef = useRef<HTMLDivElement>(null)
    const bgTitleRef = useRef<HTMLDivElement>(null)
    const bgDescRef = useRef<HTMLDivElement>(null)
    const autoplayToggleRef = useRef<HTMLButtonElement>(null)
    const headerStaticRef = useRef<HTMLDivElement>(null)
    const headerTitleRef = useRef<HTMLDivElement>(null)
    const headerDescRef = useRef<HTMLDivElement>(null)
    const headerCountRef = useRef<HTMLSpanElement>(null)
    const headerLabelRef = useRef<HTMLSpanElement>(null)
    const topBarRef = useRef<HTMLDivElement>(null)
    const reelMetaRef = useRef<HTMLDivElement>(null)
    const [overlayState, setOverlayState] = useState<OverlayState>({
        open: false,
        item: null,
    })
    const [autoplayActive, setAutoplayActive] = useState(
        props.autoplaySettings.autoplay
    )
    const autoplayActiveRef = useRef(autoplayActive)
    useEffect(() => {
        autoplayActiveRef.current = autoplayActive
    }, [autoplayActive])
    const prefersReducedMotion = useMemo(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        []
    )
    const { items } = props
    const { autoplay, speed, infiniteLoop, mediaPauseDuration, fabPosition } =
        props.autoplaySettings
    const {
        transitionEffect,
        smoothness,
        dragPower,
        activeDistance,
        maxScale,
        minScale,
        inactiveOpacity,
        parallaxEffect,
        parallaxIntensity,
        skewEffect,
        skewAmount,
        skewMode,
        tiltEffect,
        tiltAmount,
        tiltPerspective,
    } = props.motion
    const {
        cardWidth,
        cardHeight,
        cardGap,
        cardBorderRadius,
        infoPosition,
        headerTitle,
        headerDescription,
        showHeading = true,
    } = props.cardLayout
    const {
        showControls,
        keyboardNav,
        mouseWheel,
        mouseWheelInvert,
        mouseWheelSpeed,
        hoverPause,
        showCounter = true,
        showReelLabel = true,
        showNavText = true,
    } = props.navigation
    const { showDragCursor } = props.dragCursor
    const { showCloseCursor } = props.closeCursor
    const { showActionButton } = props.actionButton
    const { onScrollPause, onScrollResume } = props

    const onScrollPauseRef = useRef(onScrollPause)
    const onScrollResumeRef = useRef(onScrollResume)
    useEffect(() => {
        onScrollPauseRef.current = onScrollPause
    }, [onScrollPause])
    useEffect(() => {
        onScrollResumeRef.current = onScrollResume
    }, [onScrollResume])

    useEffect(() => {
        setAutoplayActive(autoplay)
    }, [autoplay])
    const itemsKey = (items || [])
        .map(
            (it) =>
                `${it.mediaType}|${it.image ?? ""}|${it.video ?? ""}|${it.youtubeLink ?? ""}|${it.title ?? ""}|${it.description ?? ""}|${it.fullscreen ? 1 : 0}|${JSON.stringify(it.link ?? "")}`
        )
        .join("\u0001")
    const stableItems = useMemo(() => items, [itemsKey])
    const MEDIA = useMemo(() => normalizeItems(stableItems), [stableItems])
    const openOverlay = useCallback(
        (item: NormalizedItem) => setOverlayState({ open: true, item }),
        []
    )
    const openOverlayRef = useRef(openOverlay)
    useEffect(() => {
        openOverlayRef.current = openOverlay
    }, [openOverlay])
    const closeOverlay = useCallback(
        () => setOverlayState({ open: false, item: null }),
        []
    )
    const handleAutoplayToggle = useCallback(
        () => setAutoplayActive((prev) => !prev),
        []
    )
    const isHeaderMode = infoPosition === "header"
    const staticHTitle = headerTitle || "Recent Projects"
    const staticHDesc = headerDescription || ""
    const prevMetaRef = useRef<{
        index: number
        title: string
        desc: string
        type: string
        fullscreen: boolean
    } | null>(null)
    useEffect(() => {
        if (topBarRef.current) {
            if (showHeading)
                topBarRef.current.classList.remove("heading-hidden")
            else topBarRef.current.classList.add("heading-hidden")
        }
        const toggleVisibility = (el: HTMLElement | null, visible: boolean) => {
            if (!el) return
            if (visible) el.classList.remove("hidden")
            else el.classList.add("hidden")
        }
        toggleVisibility(reelCountRef.current, showCounter)
        toggleVisibility(reelLabelRef.current, showReelLabel)
        toggleVisibility(headerCountRef.current, showCounter)
        toggleVisibility(headerLabelRef.current, showReelLabel)
    }, [showHeading, showCounter, showReelLabel])
    useEffect(() => {
        const carouselEl = carouselRef.current
        const wrap = wrapRef.current
        const cursor = cursorRef.current
        if (!carouselEl || !wrap || MEDIA.length === 0) return
        const SETTINGS = {
            transitionEffect,
            speed,
            smoothness,
            dragPower,
            activeDistance,
            maxScale,
            minScale,
            inactiveOpacity,
            parallaxEffect,
            parallaxIntensity,
            skewEffect,
            skewAmount,
            skewMode,
            tiltEffect,
            tiltAmount,
            tiltPerspective,
            autoplay: autoplayActive,
            infiniteLoop,
            mediaPauseDuration,
            infoPosition,
            cardWidth,
            cardHeight,
            cardBorderRadius,
            showActionButton,
        }
        function ytCommand(iframe: HTMLIFrameElement, func: string) {
            try {
                iframe.contentWindow?.postMessage(
                    JSON.stringify({ event: "command", func, args: [] }),
                    "*"
                )
            } catch (_) {}
        }
        interface CardState {
            muted: boolean
            playing: boolean
        }
        const stateMap = new Map<HTMLElement, CardState>()
        const cardRefsMap = new WeakMap<HTMLElement, CardRefs>()
        interface YtLoader {
            load: (onReady?: () => void) => void
            unload: () => void
        }
        const ytLoaderMap = new WeakMap<HTMLElement, YtLoader>()
        function getCardRefs(card: HTMLElement): CardRefs {
            if (!cardRefsMap.has(card)) {
                const panel = card.querySelector<HTMLElement>(".info-panel")
                const video = card.querySelector<HTMLVideoElement>("video")
                cardRefsMap.set(card, {
                    video,
                    iframe: card.querySelector<HTMLIFrameElement>("iframe"),
                    infoPanel: panel,
                    infoWords: panel
                        ? Array.from(
                              panel.querySelectorAll<HTMLElement>(
                                  ".info-title span"
                              )
                          )
                        : [],
                    infoDesc: panel
                        ? panel.querySelector<HTMLElement>(".info-desc")
                        : null,
                    src: video?.dataset.src || undefined,
                })
            }
            return cardRefsMap.get(card)!
        }
        let autoplayPaused = false,
            autoplayHoverPaused = false,
            autoplayWasActiveBeforeHover = false,
            autoplayResumeTimer: ReturnType<typeof setTimeout> | null = null,
            mediaPausedAutoplay = false
        function pauseAutoplayTemporarily() {
            autoplayPaused = true
            if (autoplayResumeTimer) clearTimeout(autoplayResumeTimer)
            autoplayResumeTimer = setTimeout(() => {
                autoplayPaused = false
                autoplayResumeTimer = null
            }, SETTINGS.mediaPauseDuration * 1000)
        }
        function makeInfoPanel(item: NormalizedItem): HTMLDivElement {
            const panel = document.createElement("div")
            panel.className = "info-panel"
            const titleEl = document.createElement("div")
            titleEl.className = "info-title"
            item.title
                .split(" ")
                .filter((w) => w.length > 0)
                .forEach((word) => {
                    const span = document.createElement("span")
                    span.textContent = `${word}\u00A0`
                    titleEl.appendChild(span)
                })
            const descEl = document.createElement("div")
            descEl.className = "info-desc"
            descEl.textContent = item.desc
            panel.appendChild(titleEl)
            panel.appendChild(descEl)
            return panel
        }
        function syncPlayUI(card: HTMLElement, playing: boolean) {
            const cardPlayBtn = card.querySelector(".play-btn")
            if (cardPlayBtn) {
                cardPlayBtn.replaceChildren(
                    createSVGIcon(playing ? "pause" : "play")
                )
                cardPlayBtn.setAttribute(
                    "aria-label",
                    playing ? "Pause" : "Play"
                )
            }
        }
        function toggleCardPlay(card: HTMLElement) {
            const state = stateMap.get(card)
            const refs = getCardRefs(card)
            if (!state || (!refs.video && !refs.iframe)) return
            state.playing = !state.playing
            const ytIconEl = card.querySelector(".yt-play-icon") as HTMLElement
            if (state.playing) {
                if (refs.video) {
                    refs.video.muted = state.muted
                    refs.video.play().catch(() => {})
                }
                if (refs.iframe) {
                    ytCommand(refs.iframe, "playVideo")
                    setTimeout(
                        () =>
                            ytCommand(
                                refs.iframe!,
                                state.muted ? "mute" : "unMute"
                            ),
                        600
                    )
                }
                if (autoplayActiveRef.current) mediaPausedAutoplay = true
                if (ytIconEl) ytIconEl.style.opacity = "0"
            } else {
                if (refs.video) refs.video.pause()
                if (refs.iframe) ytCommand(refs.iframe, "pauseVideo")
                mediaPausedAutoplay = false
                if (ytIconEl) ytIconEl.style.opacity = "1"
            }
            syncPlayUI(card, state.playing)
        }
        const bgState = { playing: false, muted: true }
        function buildCard(
            item: NormalizedItem,
            isClone: boolean = false
        ): HTMLDivElement {
            const card = document.createElement("div")
            card.className = "card"
            card.dataset.type = item.type
            if (SETTINGS.parallaxEffect && !prefersReducedMotion)
                card.classList.add("parallax-media")
            if (isClone) card.setAttribute("aria-hidden", "true")
            else {
                card.setAttribute("role", "group")
                card.setAttribute("aria-label", item.title || item.type)
            }
            let appendTarget = card
            if (SETTINGS.infoPosition === "below") {
                card.classList.add("layout-below")
                const mediaContainer = document.createElement("div")
                mediaContainer.className = "media-container"
                card.appendChild(mediaContainer)
                appendTarget = mediaContainer
            }

            if (hoverPause) {
                card.addEventListener("mouseenter", () => {
                    // Pause only when autoplay was actually enabled. Keeping this
                    // separate from autoplayActive preserves the user's setting.
                    autoplayWasActiveBeforeHover = autoplayActiveRef.current
                    autoplayHoverPaused = autoplayWasActiveBeforeHover
                    if (autoplayWasActiveBeforeHover) {
                        onScrollPauseRef.current?.()
                    }
                })
                card.addEventListener("mouseleave", () => {
                    const shouldResume =
                        autoplayWasActiveBeforeHover &&
                        autoplayActiveRef.current
                    autoplayHoverPaused = false
                    autoplayWasActiveBeforeHover = false
                    if (shouldResume) {
                        onScrollResumeRef.current?.()
                    }
                })
            }

            if (item.type === "image") {
                const img = document.createElement("img")
                img.src = item.src
                img.alt = item.title
                img.loading = "lazy"
                img.decoding = "async"
                appendTarget.appendChild(img)
                if (item.fullscreen) {
                    card.classList.add("has-expand")
                    const expBtn = document.createElement("button")
                    expBtn.className = "expand-btn"
                    expBtn.replaceChildren(createSVGIcon("expand"))
                    expBtn.title = "View fullscreen"
                    expBtn.setAttribute("aria-label", "Open fullscreen")
                    expBtn.addEventListener("click", (e) => {
                        e.stopPropagation()
                        if (autoplayActiveRef.current) setAutoplayActive(false)
                        openOverlayRef.current(item)
                    })
                    appendTarget.appendChild(expBtn)
                }
            } else if (item.type === "mp4") {
                const video = document.createElement("video")
                video.muted = true
                video.loop = true
                video.playsInline = true
                video.preload = "none"
                video.dataset.src = item.src
                if (item.image) video.poster = item.image
                const source = document.createElement("source")
                video.appendChild(source)
                appendTarget.appendChild(video)
                card.classList.add("has-audio")
                stateMap.set(card, { muted: true, playing: false })
                const mediaControls = document.createElement("div")
                mediaControls.className = "media-controls"
                const playBtn = document.createElement("button")
                playBtn.className = "ctrl-btn play-btn"
                playBtn.setAttribute("aria-label", "Play")
                playBtn.replaceChildren(createSVGIcon("play"))
                playBtn.addEventListener("click", (e) => {
                    e.stopPropagation()
                    toggleCardPlay(card)
                })
                mediaControls.appendChild(playBtn)
                const soundBtn = document.createElement("button")
                soundBtn.className = "ctrl-btn sound-btn"
                soundBtn.setAttribute("aria-label", "Unmute")
                soundBtn.replaceChildren(createSVGIcon("mute"))
                soundBtn.addEventListener("click", (e) => {
                    e.stopPropagation()
                    const state = stateMap.get(card)
                    if (state) {
                        state.muted = !state.muted
                        soundBtn.replaceChildren(
                            createSVGIcon(state.muted ? "mute" : "unmute")
                        )
                        soundBtn.setAttribute(
                            "aria-label",
                            state.muted ? "Unmute" : "Mute"
                        )
                        const refs = getCardRefs(card)
                        if (refs.video) refs.video.muted = state.muted
                        else if (refs.iframe)
                            ytCommand(
                                refs.iframe,
                                state.muted ? "mute" : "unMute"
                            )
                        if (card.classList.contains("active"))
                            bgState.muted = state.muted
                    }
                })
                mediaControls.appendChild(soundBtn)
                appendTarget.appendChild(mediaControls)
                const expBtn = document.createElement("button")
                expBtn.className = "expand-btn"
                expBtn.replaceChildren(createSVGIcon("expand"))
                expBtn.setAttribute("aria-label", "Open fullscreen video")
                expBtn.addEventListener("click", (e) => {
                    e.stopPropagation()
                    if (autoplayActiveRef.current) setAutoplayActive(false)
                    openOverlayRef.current(item)
                })
                appendTarget.appendChild(expBtn)
            } else if (item.type === "youtube") {
                const ytId = getYouTubeId(item.src)
                if (ytId) {
                    const ytWrap = document.createElement("div")
                    ytWrap.className = "yt-wrap"
                    ytWrap.style.cssText =
                        "position:relative;width:100%;height:100%"
                    const thumbSrc =
                        item.image ||
                        `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
                    const thumb = document.createElement("img")
                    thumb.src = thumbSrc
                    thumb.alt = item.title || "YouTube thumbnail"
                    thumb.style.cssText =
                        "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block"
                    thumb.loading = "lazy"
                    ytWrap.appendChild(thumb)
                    const ytIcon = document.createElement("div")
                    ytIcon.className = "yt-play-icon"
                    ytIcon.setAttribute("role", "button")
                    ytIcon.setAttribute(
                        "aria-label",
                        `Play video${item.title ? `: ${item.title}` : ""}`
                    )
                    ytIcon.tabIndex = 0
                    ytIcon.appendChild(createYtPlayIcon())
                    card.appendChild(ytIcon)
                    ytIcon.addEventListener("keydown", (e: KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            ytIcon.click()
                        }
                    })
                    let iframeLoaded = false
                    let iframeEl: HTMLIFrameElement | null = null
                    const pendingCallbacks: Array<() => void> = []
                    const loadIframe = (onReady?: () => void) => {
                        if (iframeLoaded) {
                            if (onReady) onReady()
                            return
                        }
                        iframeLoaded = true
                        if (onReady) pendingCallbacks.push(onReady)
                        const iframe = document.createElement("iframe")
                        iframeEl = iframe
                        iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=0&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`
                        iframe.allow = "autoplay; encrypted-media"
                        iframe.setAttribute("allowfullscreen", "")
                        iframe.setAttribute(
                            "title",
                            item.title || "YouTube video"
                        )
                        iframe.dataset.ytid = ytId
                        iframe.style.cssText =
                            "position:absolute;top:50%;left:50%;width:180%;height:180%;transform:translate(-50%,-50%);border:none"
                        iframe.onload = () => {
                            thumb.style.transition = "opacity 0.4s"
                            thumb.style.opacity = "0"
                            ytIcon.style.opacity = "0"
                            setTimeout(() => {
                                if (thumb.parentNode) thumb.remove()
                            }, 400)
                            setTimeout(() => {
                                pendingCallbacks.forEach((cb) => cb())
                                pendingCallbacks.length = 0
                            }, 300)
                            cardRefsMap.delete(card)
                        }
                        ytWrap.appendChild(iframe)
                    }
                    const unloadIframe = () => {
                        if (iframeEl?.parentNode) {
                            iframeEl.remove()
                            iframeEl = null
                            iframeLoaded = false
                            cardRefsMap.delete(card)
                            if (!thumb.parentNode) {
                                thumb.style.opacity = "1"
                                ytWrap.appendChild(thumb)
                            }
                            ytIcon.style.opacity = "1"
                        }
                    }
                    ytLoaderMap.set(card, {
                        load: loadIframe,
                        unload: unloadIframe,
                    })
                    appendTarget.appendChild(ytWrap)
                    card.classList.add("has-audio")
                    stateMap.set(card, { muted: true, playing: false })
                    ytIcon.addEventListener("click", (e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        if (!iframeLoaded) {
                            loadIframe(() => {
                                const state = stateMap.get(card)
                                if (state) {
                                    state.playing = true
                                    if (iframeEl) {
                                        ytCommand(iframeEl, "playVideo")
                                        setTimeout(
                                            () =>
                                                ytCommand(
                                                    iframeEl,
                                                    state.muted
                                                        ? "mute"
                                                        : "unMute"
                                                ),
                                            600
                                        )
                                    }
                                    ytIcon.style.opacity = "0"
                                }
                            })
                        } else {
                            toggleCardPlay(card)
                        }
                    })
                    const mediaControls = document.createElement("div")
                    mediaControls.className = "media-controls"
                    const playBtn = document.createElement("button")
                    playBtn.className = "ctrl-btn play-btn"
                    playBtn.setAttribute("aria-label", "Play")
                    playBtn.replaceChildren(createSVGIcon("play"))
                    playBtn.addEventListener("click", (e) => {
                        e.stopPropagation()
                        const state = stateMap.get(card)
                        if (!state) return
                        if (!iframeLoaded) {
                            loadIframe(() => {
                                state.playing = true
                                if (iframeEl) {
                                    ytCommand(iframeEl, "playVideo")
                                    setTimeout(
                                        () =>
                                            ytCommand(
                                                iframeEl,
                                                state.muted ? "mute" : "unMute"
                                            ),
                                        600
                                    )
                                }
                                syncPlayUI(card, true)
                                ytIcon.style.opacity = "0"
                            })
                        } else toggleCardPlay(card)
                    })
                    mediaControls.appendChild(playBtn)
                    const soundBtn = document.createElement("button")
                    soundBtn.className = "ctrl-btn sound-btn"
                    soundBtn.setAttribute("aria-label", "Unmute")
                    soundBtn.replaceChildren(createSVGIcon("mute"))
                    soundBtn.addEventListener("click", (e) => {
                        e.stopPropagation()
                        const state = stateMap.get(card)
                        if (state) {
                            state.muted = !state.muted
                            soundBtn.replaceChildren(
                                createSVGIcon(state.muted ? "mute" : "unmute")
                            )
                            soundBtn.setAttribute(
                                "aria-label",
                                state.muted ? "Unmute" : "Mute"
                            )
                            if (iframeEl)
                                ytCommand(
                                    iframeEl,
                                    state.muted ? "mute" : "unMute"
                                )
                            if (card.classList.contains("active"))
                                bgState.muted = state.muted
                        }
                    })
                    mediaControls.appendChild(soundBtn)
                    appendTarget.appendChild(mediaControls)
                    const expBtn = document.createElement("button")
                    expBtn.className = "expand-btn"
                    expBtn.replaceChildren(createSVGIcon("expand"))
                    expBtn.setAttribute("aria-label", "Open fullscreen video")
                    expBtn.addEventListener("click", (e) => {
                        e.stopPropagation()
                        if (autoplayActiveRef.current) setAutoplayActive(false)
                        openOverlayRef.current(item)
                    })
                    appendTarget.appendChild(expBtn)
                }
            }
            const showBtn = SETTINGS.showActionButton
            const resolved = resolveLink(item.link)
            if (showBtn && resolved) {
                card.classList.add("has-action-btn")
                const actionBtn = document.createElement("a")
                actionBtn.className = "card-action-btn"
                actionBtn.href = resolved.href
                actionBtn.target = resolved.target
                if (resolved.rel) actionBtn.setAttribute("rel", resolved.rel)
                actionBtn.setAttribute("aria-label", "View project")
                actionBtn.replaceChildren(createSVGIcon("arrow"))
                actionBtn.addEventListener("click", (e) => {
                    e.stopPropagation()
                    if (autoplayActiveRef.current) setAutoplayActive(false)
                })
                appendTarget.appendChild(actionBtn)
            }
            if (SETTINGS.infoPosition !== "header")
                card.appendChild(makeInfoPanel(item))
            if (isClone)
                card.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
                    "button, a"
                ).forEach((el) => {
                    if (
                        el instanceof HTMLAnchorElement &&
                        el.classList.contains("card-action-btn")
                    )
                        return
                    el.tabIndex = -1
                })
            return card
        }
        carouselEl.replaceChildren()
        const originalCards = MEDIA.map((item) => {
            const c = buildCard(item)
            carouselEl.appendChild(c)
            return c
        })
        if (SETTINGS.infiniteLoop) {
            for (let i = 0; i < 2; i++) {
                originalCards.forEach((_, origIdx) => {
                    const origItem = MEDIA[origIdx]
                    const origState = stateMap.get(originalCards[origIdx])
                    const clone = buildCard(origItem, true)
                    if (origState) {
                        stateMap.set(clone, origState)
                        const expBtn =
                            clone.querySelector<HTMLButtonElement>(
                                ".expand-btn"
                            )
                        if (expBtn)
                            expBtn.addEventListener("click", (e) => {
                                e.stopPropagation()
                                openOverlayRef.current(origItem)
                            })
                    }
                    carouselEl.appendChild(clone)
                })
            }
        }
        const cards = gsap.utils.toArray<HTMLElement>(".card", carouselEl)
        const step = cardWidth + cardGap
        const N = originalCards.length
        const singleSetWidth = N * step
        const wrapFn = gsap.utils.wrap(-singleSetWidth, 0)
        let wrapWidth = wrap.offsetWidth
        let vCenter = wrapWidth / 2
        const minX = -(N - 1) * step + vCenter - cardWidth / 2
        const maxX = vCenter - cardWidth / 2
        let currentX = 0,
            targetX = 0,
            isDragging = false,
            dragMoved = false,
            snapTimeout: ReturnType<typeof setTimeout> | null = null,
            carouselOriginX = 0,
            scrollVelocity = 0,
            lastTargetX = 0,
            targetSkew = 0,
            currentSkew = 0,
            lastWrappedX = 0
        const hoverSkewMap = new WeakMap<
            HTMLElement,
            { current: number; target: number }
        >()
        function getHoverSkew(card: HTMLElement) {
            if (!hoverSkewMap.has(card))
                hoverSkewMap.set(card, { current: 0, target: 0 })
            return hoverSkewMap.get(card)!
        }
        const tiltStateMap = new WeakMap<
            HTMLElement,
            {
                targetRotateX: number
                targetRotateY: number
                currentRotateX: number
                currentRotateY: number
                isHovered: boolean
            }
        >()
        function getTiltState(card: HTMLElement) {
            if (!tiltStateMap.has(card))
                tiltStateMap.set(card, {
                    targetRotateX: 0,
                    targetRotateY: 0,
                    currentRotateX: 0,
                    currentRotateY: 0,
                    isHovered: false,
                })
            return tiltStateMap.get(card)!
        }
        function getShortestDistance(cardIndex: number): number {
            const appliedX = SETTINGS.infiniteLoop ? wrapFn(currentX) : currentX
            const cardCenter = appliedX + cardIndex * step + cardWidth / 2
            const center = wrapWidth / 2
            return cardCenter - center
        }
        function clampX(x: number): number {
            return SETTINGS.infiniteLoop ? x : Math.max(minX, Math.min(maxX, x))
        }
        function centerOf(index: number): number {
            if (SETTINGS.infiniteLoop) {
                const base = -(index * step) + vCenter - cardWidth / 2
                return (
                    base +
                    Math.round((targetX - base) / singleSetWidth) *
                        singleSetWidth
                )
            }
            return -(index * step) + vCenter - cardWidth / 2
        }
        let currentIndex = 0
        targetX = centerOf(0)
        currentX = targetX
        lastTargetX = targetX
        lastWrappedX = wrapFn(currentX)
        function snapToNearest() {
            if (SETTINGS.infiniteLoop) {
                const raw = gsap.utils.wrap(
                    0,
                    singleSetWidth,
                    -targetX + vCenter - cardWidth / 2
                )
                currentIndex = ((Math.round(raw / step) % N) + N) % N
            } else {
                const clamped = clampX(targetX)
                currentIndex = Math.max(
                    0,
                    Math.min(
                        N - 1,
                        Math.round((-clamped + vCenter - cardWidth / 2) / step)
                    )
                )
            }
            targetX = centerOf(currentIndex)
        }
        function next() {
            currentIndex = SETTINGS.infiniteLoop
                ? (currentIndex + 1) % N
                : Math.min(currentIndex + 1, N - 1)
            targetX = centerOf(currentIndex)
        }
        function prev() {
            currentIndex = SETTINGS.infiniteLoop
                ? (currentIndex - 1 + N) % N
                : Math.max(currentIndex - 1, 0)
            targetX = centerOf(currentIndex)
        }
        const nextBtn = nextBtnRef.current
        const prevBtn = prevBtnRef.current
        if (nextBtn) nextBtn.addEventListener("click", next)
        if (prevBtn) prevBtn.addEventListener("click", prev)
        function scheduleSnap() {
            if (snapTimeout) clearTimeout(snapTimeout)
            snapTimeout = setTimeout(() => {
                if (!isDragging) snapToNearest()
            }, 150)
        }
        const handleKeyNav = (e: KeyboardEvent) => {
            if (!keyboardNav) return
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                pauseAutoplayTemporarily()
                next()
                scheduleSnap()
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                pauseAutoplayTemporarily()
                prev()
                scheduleSnap()
            }
        }
        wrap.addEventListener("keydown", handleKeyNav)
        wrap.addEventListener("pointerdown", () => {
            if (keyboardNav) wrap.focus()
        })
        let wheelAccum = 0
        const handleWheel = (e: WheelEvent) => {
            if (!mouseWheel) return
            if (e.cancelable) {
                e.preventDefault()
            }
            pauseAutoplayTemporarily()
            const delta =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            wheelAccum += mouseWheelInvert ? -delta : delta
            const T = 120 / mouseWheelSpeed
            if (wheelAccum >= T) {
                next()
                wheelAccum = 0
                scheduleSnap()
            } else if (wheelAccum <= -T) {
                prev()
                wheelAccum = 0
                scheduleSnap()
            }
        }
        wrap.addEventListener("wheel", handleWheel, { passive: false })
        const resizeObserver = new ResizeObserver(() => {
            wrapWidth = wrap.offsetWidth
            vCenter = wrapWidth / 2
            targetX = centerOf(currentIndex)
            currentX = targetX
            lastTargetX = targetX
            lastWrappedX = wrapFn(currentX)
        })
        resizeObserver.observe(wrap)
        function updateReelMeta(index: number, item: NormalizedItem) {
            const prev = prevMetaRef.current
            if (
                prev &&
                prev.index === index &&
                prev.title === item.title &&
                prev.desc === item.desc &&
                prev.type === item.type &&
                prev.fullscreen === item.fullscreen
            )
                return
            prevMetaRef.current = {
                index,
                title: item.title,
                desc: item.desc,
                type: item.type,
                fullscreen: item.fullscreen,
            }
            if (reelCountRef.current) {
                const newText = `${String(index + 1).padStart(2, "0")} / ${String(MEDIA.length).padStart(2, "0")}`
                if (reelCountRef.current.textContent !== newText)
                    reelCountRef.current.textContent = newText
            }
            if (reelProgressRef.current) {
                const newWidth = `${((index + 1) / MEDIA.length) * 100}%`
                if (reelProgressRef.current.style.width !== newWidth)
                    reelProgressRef.current.style.width = newWidth
            }
            if (bgTitleRef.current) {
                const titleEl = bgTitleRef.current
                if (titleEl.dataset.rawTitle !== item.title) {
                    titleEl.dataset.rawTitle = item.title
                    gsap.killTweensOf(titleEl.querySelectorAll("span"))
                    titleEl.replaceChildren()
                    const words = (item.title || "")
                        .split(" ")
                        .filter((w) => w.length > 0)
                    words.forEach((word) => {
                        const span = document.createElement("span")
                        span.textContent = word
                        titleEl.appendChild(span)
                    })
                    const spans = titleEl.querySelectorAll("span")
                    gsap.set(spans, { opacity: 1, y: 0, rotateX: 0 })
                    if (!prefersReducedMotion)
                        gsap.fromTo(
                            spans,
                            { opacity: 0, y: 20, rotateX: -40 },
                            {
                                opacity: 1,
                                y: 0,
                                rotateX: 0,
                                duration: 0.5,
                                stagger: 0.03,
                                ease: "power3.out",
                            }
                        )
                }
            }
            if (bgDescRef.current) {
                const newDesc = item.desc || ""
                if (bgDescRef.current.textContent !== newDesc) {
                    gsap.killTweensOf(bgDescRef.current)
                    bgDescRef.current.textContent = newDesc
                    if (!prefersReducedMotion)
                        gsap.fromTo(
                            bgDescRef.current,
                            { opacity: 0, y: 10 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.4,
                                ease: "power2.out",
                            }
                        )
                    else gsap.set(bgDescRef.current, { opacity: 1, y: 0 })
                }
            }
        }
        function updateCards() {
            scrollVelocity = targetX - lastTargetX
            lastTargetX = targetX
            const currentWrappedX = SETTINGS.infiniteLoop
                ? wrapFn(currentX)
                : currentX
            const wrapDelta = currentWrappedX - lastWrappedX
            lastWrappedX = currentWrappedX
            const cardData = cards.map((card, i) => {
                const dist = getShortestDistance(i)
                const absDist = Math.abs(dist)
                return { card, i, dist, absDist }
            })
            cardData.forEach(({ card, i, dist, absDist }) => {
                let skewX = 0
                if (SETTINGS.skewEffect && !prefersReducedMotion) {
                    if (SETTINGS.skewMode === "hover") {
                        const hs = getHoverSkew(card)
                        hs.current += (hs.target - hs.current) * 0.15
                        skewX = hs.current
                    } else {
                        const maxSkew = SETTINGS.skewAmount || 15
                        const velocity = targetX - currentX
                        targetSkew = gsap.utils.clamp(
                            -maxSkew,
                            maxSkew,
                            velocity * 0.15
                        )
                        currentSkew += (targetSkew - currentSkew) * 0.15
                        if (Math.abs(currentSkew) < 0.05) currentSkew = 0
                        skewX = currentSkew
                    }
                }
                let tiltRotateX = 0,
                    tiltRotateY = 0
                if (SETTINGS.tiltEffect && !prefersReducedMotion) {
                    const ts = getTiltState(card)
                    ts.currentRotateX +=
                        (ts.targetRotateX - ts.currentRotateX) * 0.15
                    ts.currentRotateY +=
                        (ts.targetRotateY - ts.currentRotateY) * 0.15
                    tiltRotateX = ts.currentRotateX
                    tiltRotateY = ts.currentRotateY
                }
                let isActiveCard = absDist < SETTINGS.activeDistance
                if (!prefersReducedMotion) {
                    const perspective = SETTINGS.tiltPerspective || 1000
                    if (SETTINGS.transitionEffect === "3D-Cards") {
                        const rotateY = gsap.utils.mapRange(
                            -600,
                            600,
                            -45,
                            45,
                            dist
                        )
                        const scale = gsap.utils.mapRange(
                            0,
                            600,
                            1.15,
                            0.75,
                            absDist
                        )
                        const z = gsap.utils.mapRange(0, 600, 0, -300, absDist)
                        const distanceOpacity = gsap.utils.mapRange(
                            0,
                            800,
                            1,
                            SETTINGS.inactiveOpacity,
                            absDist
                        )
                        const opacity = gsap.utils.clamp(
                            SETTINGS.inactiveOpacity,
                            1,
                            distanceOpacity
                        )
                        const finalRotateY = rotateY + tiltRotateY
                        gsap.set(card, {
                            transformPerspective: perspective,
                            z,
                            rotateY: finalRotateY,
                            rotateX: tiltRotateX,
                            skewX,
                            scale,
                            opacity,
                            zIndex: Math.round(
                                gsap.utils.mapRange(0, 600, 10, 0, absDist)
                            ),
                        })
                    } else {
                        const scale = gsap.utils.clamp(
                            SETTINGS.minScale,
                            SETTINGS.maxScale,
                            gsap.utils.mapRange(
                                0,
                                700,
                                SETTINGS.maxScale,
                                SETTINGS.minScale,
                                absDist
                            )
                        )
                        const opacity = isActiveCard
                            ? 1
                            : SETTINGS.inactiveOpacity
                        gsap.set(card, {
                            transformPerspective: perspective,
                            rotateX: tiltRotateX,
                            rotateY: tiltRotateY,
                            skewX,
                            scale,
                            opacity,
                            zIndex: isActiveCard ? 10 : 1,
                        })
                    }
                }
                const mediaEl =
                    card.querySelector(".yt-wrap") ||
                    card.querySelector("video") ||
                    card.querySelector("img")
                if (
                    SETTINGS.parallaxEffect &&
                    !prefersReducedMotion &&
                    mediaEl
                ) {
                    const appliedX = SETTINGS.infiniteLoop
                        ? wrapFn(currentX)
                        : currentX
                    const screenX =
                        appliedX + i * step + cardWidth / 2 - wrapWidth / 2
                    const maxScreenX = wrapWidth / 2 + cardWidth / 2
                    const normalizedScreenX =
                        maxScreenX > 0
                            ? Math.max(-1, Math.min(1, screenX / maxScreenX))
                            : 0
                    const intensityMultiplier =
                        (SETTINGS.parallaxIntensity || 50) / 50
                    const maxShiftPercent = 12 * intensityMultiplier
                    const maxShiftPx = (maxShiftPercent / 100) * cardWidth
                    const baseScaleMax = 1 + 0.2 * intensityMultiplier
                    const baseScaleMin = 1
                    const scale =
                        baseScaleMin +
                        (baseScaleMax - baseScaleMin) *
                            ((normalizedScreenX + 1) / 2)
                    gsap.set(mediaEl, {
                        x: -maxShiftPx * normalizedScreenX,
                        xPercent: 0,
                        scale: scale,
                    })
                } else if (mediaEl && !SETTINGS.parallaxEffect)
                    gsap.set(mediaEl, { x: 0, xPercent: 0, scale: 1 })
                const refs = getCardRefs(card)
                const state = stateMap.get(card)
                const isActive = card.classList.contains("active")
                const shouldBeActive = isActiveCard
                if (shouldBeActive) {
                    if (!isActive) {
                        card.classList.add("active")
                        card.setAttribute("aria-current", "true")
                        const idx = parseInt(card.dataset.index || "0")
                        const item = MEDIA[idx]
                        if (item) updateReelMeta(idx, item)
                        if (refs.video) {
                            const sourceEl = refs.video.querySelector("source")
                            if (sourceEl && !sourceEl.src && refs.src) {
                                sourceEl.src = refs.src
                                refs.video.preload = "auto"
                                refs.video.load()
                            }
                            refs.video.muted = state?.muted ?? bgState.muted
                        }
                        const cardState = stateMap.get(card)
                        syncPlayUI(card, cardState?.playing ?? false)
                        bgState.playing = cardState?.playing ?? false
                    }
                } else {
                    if (isActive) {
                        card.classList.remove("active")
                        card.setAttribute("aria-current", "false")
                        const cardState = stateMap.get(card)
                        if (cardState?.playing) {
                            cardState.playing = false
                            bgState.playing = false
                            mediaPausedAutoplay = false
                        }
                        if (refs.video) {
                            refs.video.pause()
                            if (absDist > SETTINGS.activeDistance * 3) {
                                const se = refs.video.querySelector("source")
                                if (se && se.src) {
                                    se.removeAttribute("src")
                                    refs.video.load()
                                    refs.video.preload = "none"
                                }
                            } else refs.video.muted = true
                        }
                        if (refs.iframe) {
                            ytCommand(refs.iframe, "mute")
                            ytCommand(refs.iframe, "pauseVideo")
                            const ytIconEl = card.querySelector(
                                ".yt-play-icon"
                            ) as HTMLElement
                            if (ytIconEl) ytIconEl.style.opacity = "1"
                        }
                        if (absDist > SETTINGS.activeDistance * 3)
                            ytLoaderMap.get(card)?.unload()
                    }
                }
            })
        }
        cards.forEach((card) => {
            if (SETTINGS.skewEffect && SETTINGS.skewMode === "hover") {
                card.addEventListener("mouseenter", () => {
                    if (!prefersReducedMotion)
                        getHoverSkew(card).target = SETTINGS.skewAmount || 15
                })
                card.addEventListener("mouseleave", () => {
                    getHoverSkew(card).target = 0
                })
            }
            if (SETTINGS.tiltEffect) {
                const maxTilt = SETTINGS.tiltAmount || 15
                card.addEventListener("mousemove", (e: MouseEvent) => {
                    const rect = card.getBoundingClientRect()
                    const normX =
                        (e.clientX - rect.left - rect.width / 2) /
                        (rect.width / 2)
                    const normY =
                        (e.clientY - rect.top - rect.height / 2) /
                        (rect.height / 2)
                    const ts = getTiltState(card)
                    ts.targetRotateY = normX * maxTilt
                    ts.targetRotateX = -normY * maxTilt
                    ts.isHovered = true
                })
                card.addEventListener("mouseleave", () => {
                    const ts = getTiltState(card)
                    ts.targetRotateX = 0
                    ts.targetRotateY = 0
                    ts.isHovered = false
                })
            }
        })
        cards.forEach((card, i) => {
            card.dataset.index = String(i % N)
            card.addEventListener("click", () => {
                if (dragMoved) return
                const isActive = card.classList.contains("active")
                if (
                    isActive &&
                    card.classList.contains("has-expand") &&
                    card.dataset.type === "image"
                ) {
                    openOverlayRef.current(
                        MEDIA[parseInt(card.dataset.index ?? "0")]
                    )
                    return
                }
                if (stateMap.get(card) && isActive) return
                const rect = card.getBoundingClientRect()
                targetX -= rect.left + rect.width / 2 - vCenter
                currentIndex = parseInt(card.dataset.index ?? "0")
                scheduleSnap()
            })
        })
        const headerStatic = headerStaticRef.current
        const headerTitleEl = headerTitleRef.current
        const headerDescEl = headerDescRef.current
        const reelMeta = reelMetaRef.current
        if (headerStatic && reelMeta) {
            if (isHeaderMode) {
                headerStatic.classList.add("hidden")
                headerStatic.classList.remove("animate-in")
                reelMeta.classList.remove("hidden")
                reelMeta.classList.add("animate-in")
                if (headerTitleEl) headerTitleEl.classList.remove("animate-in")
                if (headerDescEl) headerDescEl.classList.remove("animate-in")
            } else {
                reelMeta.classList.add("hidden")
                reelMeta.classList.remove("animate-in")
                headerStatic.classList.remove("hidden")
                headerStatic.classList.add("animate-in")
                if (headerTitleEl) {
                    headerTitleEl.classList.remove("animate-in")
                    void headerTitleEl.offsetWidth
                    headerTitleEl.classList.add("animate-in")
                }
                if (headerDescEl) {
                    headerDescEl.classList.remove("animate-in")
                    void headerDescEl.offsetWidth
                    headerDescEl.classList.add("animate-in")
                }
            }
        }
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const firstCard = cards[0]
                if (!firstCard || firstCard.classList.contains("active")) return
                firstCard.classList.add("active")
                firstCard.setAttribute("aria-current", "true")
                const idx = parseInt(firstCard.dataset.index || "0")
                const item = MEDIA[idx]
                if (item) updateReelMeta(idx, item)
                const refs = getCardRefs(firstCard)
                if (refs.video) {
                    const se = refs.video.querySelector("source")
                    if (se && !se.src && refs.src) {
                        se.src = refs.src
                        refs.video.preload = "auto"
                        refs.video.load()
                    }
                    refs.video.muted = bgState.muted
                }
                syncPlayUI(firstCard, false)
            })
        })
        const setCarouselX = gsap.quickSetter(carouselEl, "x", "px")
        const ticker = () => {
            SETTINGS.autoplay = autoplayActiveRef.current
            if (
                SETTINGS.autoplay &&
                !isDragging &&
                !autoplayPaused &&
                !autoplayHoverPaused &&
                !mediaPausedAutoplay
            ) {
                if (SETTINGS.infiniteLoop) targetX -= SETTINGS.speed
                else if (targetX > minX) targetX -= SETTINGS.speed
            }
            currentX += (targetX - currentX) * SETTINGS.smoothness
            setCarouselX(SETTINGS.infiniteLoop ? wrapFn(currentX) : currentX)
            updateCards()
        }
        gsap.ticker.add(ticker)
        let startX = 0,
            pointerStartX = 0,
            pointerStartY = 0,
            isVerticalDrag = false
        const onDown = (e: PointerEvent) => {
            if (!wrap.contains(e.target as Node)) return
            isDragging = true
            dragMoved = false
            isVerticalDrag = false
            startX = e.clientX
            pointerStartX = e.clientX
            pointerStartY = e.clientY
            if (showDragCursor && cursor) cursor.classList.add("dragging")
            pauseAutoplayTemporarily()
            onScrollPauseRef.current?.()
        }
        const onUp = () => {
            isDragging = false
            isVerticalDrag = false
            if (showDragCursor && cursor) cursor.classList.remove("dragging")
            scheduleSnap()
            onScrollResumeRef.current?.()
        }
        const onMove = (e: PointerEvent) => {
            if (!isDragging) return
            const dx = Math.abs(e.clientX - pointerStartX)
            const dy = Math.abs(e.clientY - pointerStartY)
            if (!isVerticalDrag && dy > dx && dy > 10) {
                isVerticalDrag = true
                isDragging = false
                if (showDragCursor && cursor)
                    cursor.classList.remove("dragging")
                return
            }
            if (isVerticalDrag) return
            if (dx > 5) dragMoved = true
            targetX += (e.clientX - startX) * SETTINGS.dragPower
            if (!SETTINGS.infiniteLoop) targetX = clampX(targetX)
            startX = e.clientX
        }
        const onCancel = () => {
            isDragging = false
            isVerticalDrag = false
            if (showDragCursor && cursor) cursor.classList.remove("dragging")
            scheduleSnap()
            onScrollResumeRef.current?.()
        }
        wrap.addEventListener("pointerdown", onDown)
        wrap.addEventListener("pointerup", onUp)
        wrap.addEventListener("pointermove", onMove)
        wrap.addEventListener("pointercancel", onCancel)
        let mouseX = -500,
            mouseY = -500,
            cursorX = -500,
            cursorY = -500,
            cursorRevealed = false
        const onEnter = () => {
            if (showDragCursor && cursor)
                gsap.to(cursor, {
                    scale: 1,
                    duration: prefersReducedMotion ? 0 : 0.25,
                })
        }
        const onLeave = () => {
            if (showDragCursor && cursor)
                gsap.to(cursor, {
                    scale: 0,
                    duration: prefersReducedMotion ? 0 : 0.25,
                })
        }
        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY
            if (!cursorRevealed && showDragCursor && cursor) {
                cursorRevealed = true
                gsap.set(cursor, { opacity: 1 })
            }
        }
        const cursorTicker = () => {
            if (!showDragCursor || !cursor) return
            cursorX += (mouseX - cursorX) * 0.18
            cursorY += (mouseY - cursorY) * 0.18
            gsap.set(cursor, { x: cursorX, y: cursorY })
        }
        wrap.querySelectorAll<HTMLElement>(
            ".ctrl-btn, .expand-btn, .card-action-btn"
        ).forEach((btn) => {
            btn.addEventListener("mouseenter", () => {
                if (showDragCursor && cursor)
                    gsap.to(cursor, {
                        scale: 0,
                        duration: prefersReducedMotion ? 0 : 0.15,
                    })
            })
            btn.addEventListener("mouseleave", () => {
                if (showDragCursor && cursor)
                    gsap.to(cursor, {
                        scale: 1,
                        duration: prefersReducedMotion ? 0 : 0.15,
                    })
            })
        })
        wrap.addEventListener("mouseenter", onEnter)
        wrap.addEventListener("mouseleave", onLeave)
        wrap.addEventListener("mousemove", onMouseMove)
        gsap.ticker.add(cursorTicker)
        let tickersRunning = true
        const visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                if (!entry) return
                if (entry.isIntersecting) {
                    if (!tickersRunning) {
                        tickersRunning = true
                        gsap.ticker.add(ticker)
                        gsap.ticker.add(cursorTicker)
                    }
                } else {
                    if (tickersRunning) {
                        tickersRunning = false
                        gsap.ticker.remove(ticker)
                        gsap.ticker.remove(cursorTicker)
                    }
                }
            },
            {
                threshold: 0,
                // Start shortly before entering the viewport and stop shortly
                // after leaving it, avoiding visible startup lag.
                rootMargin: "200px 0px",
            }
        )
        visibilityObserver.observe(wrap)
        return () => {
            gsap.ticker.remove(ticker)
            gsap.ticker.remove(cursorTicker)
            resizeObserver.disconnect()
            visibilityObserver.disconnect()
            wrap.removeEventListener("pointerdown", onDown)
            wrap.removeEventListener("pointerup", onUp)
            wrap.removeEventListener("pointermove", onMove)
            wrap.removeEventListener("pointercancel", onCancel)
            wrap.removeEventListener("mouseenter", onEnter)
            wrap.removeEventListener("mouseleave", onLeave)
            wrap.removeEventListener("mousemove", onMouseMove)
            wrap.removeEventListener("keydown", handleKeyNav)
            wrap.removeEventListener("wheel", handleWheel)
            if (nextBtn) nextBtn.removeEventListener("click", next)
            if (prevBtn) prevBtn.removeEventListener("click", prev)
            if (snapTimeout) clearTimeout(snapTimeout)
            if (autoplayResumeTimer) clearTimeout(autoplayResumeTimer)
            cards.forEach((card) => gsap.killTweensOf(card))
            stateMap.clear()
        }
    }, [
        MEDIA,
        speed,
        smoothness,
        dragPower,
        activeDistance,
        maxScale,
        minScale,
        infiniteLoop,
        mediaPauseDuration,
        keyboardNav,
        mouseWheel,
        mouseWheelInvert,
        hoverPause,
        showDragCursor,
        showCloseCursor,
        cardWidth,
        cardGap,
        prefersReducedMotion,
        transitionEffect,
        parallaxEffect,
        parallaxIntensity,
        skewEffect,
        skewAmount,
        skewMode,
        tiltEffect,
        tiltAmount,
        tiltPerspective,
        infoPosition,
        showActionButton,
    ])
    if (MEDIA.length === 0) return null
    return (
        <>
            <div
                ref={topBarRef}
                className={`top-bar${!showHeading ? " heading-hidden" : ""}`}
            >
                <div
                    ref={headerStaticRef}
                    className={`header-static${isHeaderMode ? " hidden" : ""}`}
                >
                    {showCounter && (
                        <div className="header-static-eyebrow">
                            {showReelLabel && (
                                <span ref={headerLabelRef} className="label">
                                    Reel
                                </span>
                            )}
                            <span ref={headerCountRef} className="count">
                                {String(MEDIA.length).padStart(2, "0")}
                            </span>
                        </div>
                    )}
                    <div ref={headerTitleRef} className="header-static-title">
                        {staticHTitle}
                    </div>
                    <div ref={headerDescRef} className="header-static-desc">
                        {staticHDesc}
                    </div>
                </div>
                <div
                    ref={reelMetaRef}
                    className={`reel-meta${!isHeaderMode ? " hidden" : ""}`}
                >
                    {showCounter && (
                        <div className="reel-eyebrow">
                            {showReelLabel && (
                                <span ref={reelLabelRef} className="label">
                                    Reel
                                </span>
                            )}
                            <span ref={reelCountRef} className="count">
                                01 / {String(MEDIA.length).padStart(2, "0")}
                            </span>
                        </div>
                    )}
                    <div className="reel-progress">
                        <div
                            className="reel-progress-fill"
                            ref={reelProgressRef}
                            style={{ width: `${(1 / MEDIA.length) * 100}%` }}
                        />
                    </div>
                    <div className="bg-title" ref={bgTitleRef}>
                        {MEDIA[0]?.title.split(" ").map((word, i) => (
                            <span key={i}>{word}</span>
                        ))}
                    </div>
                    <div className="bg-desc" ref={bgDescRef}>
                        {MEDIA[0]?.desc}
                    </div>
                </div>
            </div>
            <div className="control-bar">
                <button
                    ref={autoplayToggleRef}
                    className={`autoplay-toggle ${autoplayActive ? "active" : ""}`}
                    onClick={handleAutoplayToggle}
                    aria-label={
                        autoplayActive ? "Pause autoplay" : "Start autoplay"
                    }
                >
                    <span className="autoplay-icon" aria-hidden="true">
                        {autoplayActive ? "⏸" : "▶"}
                    </span>
                    <span className="autoplay-label">
                        {autoplayActive ? "Pause" : "Autoplay"}
                    </span>
                </button>
            </div>
            <div
                className="carousel-wrap"
                ref={wrapRef}
                tabIndex={keyboardNav ? 0 : -1}
                role="region"
                aria-label="Media carousel"
                aria-roledescription="carousel"
                data-lenis-prevent
            >
                <div className="carousel" ref={carouselRef} />
                {showControls && (
                    <>
                        <button
                            ref={prevBtnRef}
                            className={`nav-btn prev${showNavText ? " with-text" : ""}`}
                            title="Previous"
                            aria-label="Previous slide"
                        >
                            <IconPrev />
                            {showNavText && (
                                <span className="nav-btn-label">Prev</span>
                            )}
                        </button>
                        <button
                            ref={nextBtnRef}
                            className={`nav-btn next${showNavText ? " with-text" : ""}`}
                            title="Next"
                            aria-label="Next slide"
                        >
                            {showNavText && (
                                <span className="nav-btn-label">Next</span>
                            )}
                            <IconNext />
                        </button>
                    </>
                )}
            </div>
            <Overlay
                state={overlayState}
                onClose={closeOverlay}
                showCloseCursor={showCloseCursor}
                closeCursorRef={closeCursorRef}
            />
            <div
                className="drag-cursor"
                ref={cursorRef}
                style={{ display: showDragCursor ? "flex" : "none" }}
                aria-hidden="true"
            >
                DRAG
            </div>
            <div
                className="close-cursor"
                ref={closeCursorRef}
                style={{ display: showCloseCursor ? "flex" : "none" }}
                aria-hidden="true"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                >
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
            </div>
        </>
    )
}
// ─── Property Controls ────────────────────────────────────────────────────────
addPropertyControls(MediaCarousel, {
    items: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    options: ["Image", "Video", "Youtube"],
                    optionTitles: ["Image", "Video", "Youtube"],
                    defaultValue: "Image",
                },
                image: {
                    type: ControlType.Image,
                    title: "Poster / Thumbnail",
                    description:
                        "Fallback poster image for Video, or custom thumbnail for YouTube.",
                },
                fullscreen: {
                    type: ControlType.Boolean,
                    title: "Fullscreen on Click",
                    defaultValue: false,
                    description:
                        "Open this image in a fullscreen lightbox when the active card is clicked.",
                    hidden: (props) => props.mediaType !== "Image",
                },
                video: {
                    type: ControlType.File,
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    title: "Video File",
                    hidden: (props) => props.mediaType !== "Video",
                },
                youtubeLink: {
                    type: ControlType.String,
                    title: "Youtube URL",
                    placeholder: "https://youtube.com/watch?v=...",
                    hidden: (props) => props.mediaType !== "Youtube",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Media Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Media description goes here.",
                },
                link: {
                    type: ControlType.Link,
                    title: "Card Link",
                    description:
                        "Link for the action button on this card. Uses Framer's native link picker.",
                },
            },
        },
        defaultValue: [
            {
                mediaType: "Youtube",
                youtubeLink: "https://www.youtube.com/watch?v=UzkN8c0eP4w",
                title: "Modern Architecture Concepts",
                description:
                    "Exploring contemporary architectural design principles and innovative building concepts",
                link: { type: "url", url: "#project-1", target: "_self" },
            },
            {
                mediaType: "Youtube",
                youtubeLink: "https://www.youtube.com/watch?v=g1ibhRZE4uE",
                title: "Sustainable Architecture",
                description:
                    "Green building design and eco-friendly architectural solutions for the future",
                link: { type: "url", url: "#project-2", target: "_self" },
            },
            {
                mediaType: "Youtube",
                youtubeLink: "https://www.youtube.com/watch?v=VvJlT8G0q7k",
                title: "Parametric Design",
                description:
                    "Computational design and algorithmic architecture concepts",
                link: { type: "url", url: "#project-3", target: "_self" },
            },
            {
                mediaType: "Youtube",
                youtubeLink: "https://www.youtube.com/watch?v=QH2-TGUlwu4",
                title: "Minimalist Architecture",
                description:
                    "Clean lines and simple forms in modern architectural design",
                link: { type: "url", url: "#project-4", target: "_self" },
            },
            {
                mediaType: "Youtube",
                youtubeLink: "https://www.youtube.com/watch?v=nxLbBMLu4uI",
                title: "Futuristic Architecture",
                description:
                    "Visionary concepts and future trends in architectural design",
                link: { type: "url", url: "#project-5", target: "_self" },
            },
        ],
    },
    cardLayout: {
        type: ControlType.Object,
        title: "Card Layout",
        controls: {
            showHeading: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Show Heading Container",
                description:
                    "Toggle the entire heading section (title, description, counter) above the carousel.",
            },
            cardWidth: {
                type: ControlType.Number,
                defaultValue: 320,
                min: 100,
                max: 1000,
                step: 10,
                title: "Width",
            },
            cardHeight: {
                type: ControlType.Number,
                defaultValue: 540,
                min: 100,
                max: 1000,
                step: 10,
                title: "Height",
            },
            cardGap: {
                type: ControlType.Number,
                defaultValue: 24,
                min: 0,
                max: 100,
                step: 1,
                title: "Gap",
            },
            cardBorderRadius: {
                type: ControlType.Number,
                defaultValue: 24,
                min: 0,
                max: 100,
                step: 1,
                title: "Border Radius",
            },
            backgroundColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Background Color",
            },
            cardBackgroundColor: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Card Background",
            },
            cardOverlayOpacity: {
                type: ControlType.Number,
                defaultValue: 0.22,
                min: 0,
                max: 1,
                step: 0.01,
                title: "Card Overlay Opacity",
                description:
                    "Opacity of the dark overlay on non-active cards. Set to 0 to remove the overlay completely.",
            },
            infoPosition: {
                type: ControlType.Enum,
                options: ["overlay", "below", "header"],
                optionTitles: ["Overlay on Image", "Below Image", "In Header"],
                defaultValue: "overlay",
                title: "Info Position",
                description:
                    "'Overlay' and 'Below' show static header title/desc. 'In Header' shows each card's title/desc dynamically.",
            },
            headerTitle: {
                type: ControlType.String,
                title: "Header Title",
                defaultValue: "Recent Projects",
                description:
                    "Static title shown when Info Position is 'Overlay' or 'Below'.",
                hidden: (props) => props.infoPosition === "header",
            },
            headerDescription: {
                type: ControlType.String,
                title: "Header Description",
                displayTextArea: true,
                defaultValue:
                    "A curated collection of our latest architectural works, showcasing innovation and design excellence.",
                description:
                    "Static description shown when Info Position is 'Overlay' or 'Below'.",
                hidden: (props) => props.infoPosition === "header",
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        controls: {
            showCounter: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Show Reel Counter",
                description:
                    "Display the reel counter (e.g. '01 / 05') in the heading.",
            },
            showReelLabel: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Show 'Reel' Label",
                description:
                    "Display the 'Reel' label text next to the counter.",
                hidden: (props) => !props.showCounter,
            },
            showControls: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Show Prev/Next Buttons",
            },
            keyboardNav: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Keyboard Navigation",
            },
            mouseWheel: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Mousewheel Navigation",
            },
            mouseWheelSpeed: {
                type: ControlType.Number,
                title: "Wheel Speed",
                min: 0.1,
                max: 3,
                step: 0.1,
                defaultValue: 1,
                hidden: (props) => !props.mouseWheel,
            },
            mouseWheelInvert: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Invert Wheel Direction",
                hidden: (props) => !props.mouseWheel,
            },
            hoverPause: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Pause on Hover",
            },
            showNavText: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Show Button Text",
                description:
                    "Show a text label ('Prev' / 'Next') next to the icon on the navigation buttons.",
                hidden: (props) => !props.showControls,
            },
        },
    },
    autoplaySettings: {
        type: ControlType.Object,
        title: "Autoplay",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Autoplay",
            },
            speed: {
                type: ControlType.Number,
                defaultValue: 1.5,
                min: 0,
                max: 10,
                step: 0.1,
                title: "Speed",
            },
            infiniteLoop: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Infinite Loop",
            },
            mediaPauseDuration: {
                type: ControlType.Number,
                defaultValue: 5,
                min: 1,
                max: 60,
                step: 1,
                title: "Drag Pause (sec)",
                description:
                    "Seconds autoplay pauses after dragging or scrolling.",
            },
            fabPosition: {
                type: ControlType.Enum,
                options: [
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                ],
                optionTitles: [
                    "Top Left",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Right",
                ],
                defaultValue: "bottom-right",
                title: "Button Position",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            transitionEffect: {
                type: ControlType.Enum,
                options: ["Standard", "3D-Cards"],
                optionTitles: ["Standard", "3D-Cards"],
                defaultValue: "Standard",
                title: "Effect",
            },
            smoothness: {
                type: ControlType.Number,
                defaultValue: 0.08,
                min: 0.01,
                max: 1,
                step: 0.01,
                title: "Smoothness",
            },
            dragPower: {
                type: ControlType.Number,
                defaultValue: 0.7,
                min: 0.1,
                max: 2,
                step: 0.1,
                title: "Drag Power",
            },
            activeDistance: {
                type: ControlType.Number,
                defaultValue: 120,
                min: 0,
                max: 1000,
                step: 10,
                title: "Active Distance",
            },
            maxScale: {
                type: ControlType.Number,
                defaultValue: 1.12,
                min: 1,
                max: 2,
                step: 0.01,
                title: "Max Scale",
            },
            minScale: {
                type: ControlType.Number,
                defaultValue: 0.82,
                min: 0.1,
                max: 1,
                step: 0.01,
                title: "Min Scale",
            },
            inactiveOpacity: {
                type: ControlType.Number,
                defaultValue: 1,
                min: 0,
                max: 1,
                step: 0.01,
                title: "Inactive Opacity",
            },
            parallaxEffect: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Parallax Effect",
            },
            parallaxIntensity: {
                type: ControlType.Number,
                defaultValue: 50,
                min: 0,
                max: 200,
                step: 1,
                title: "Parallax Intensity",
                hidden: (props) => !props.parallaxEffect,
            },
            skewEffect: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Skew Effect",
            },
            skewAmount: {
                type: ControlType.Number,
                defaultValue: 15,
                min: 0,
                max: 45,
                step: 1,
                title: "Skew Amount",
                hidden: (props) => !props.skewEffect,
            },
            skewMode: {
                type: ControlType.Enum,
                options: ["hover", "scroll"],
                optionTitles: ["On Hover", "On Scroll"],
                defaultValue: "hover",
                title: "Skew Mode",
                hidden: (props) => !props.skewEffect,
            },
            tiltEffect: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "3D Tilt Effect",
            },
            tiltAmount: {
                type: ControlType.Number,
                defaultValue: 15,
                min: 0,
                max: 45,
                step: 1,
                title: "Tilt Amount",
                hidden: (props) => !props.tiltEffect,
            },
            tiltPerspective: {
                type: ControlType.Number,
                defaultValue: 1000,
                min: 300,
                max: 3000,
                step: 50,
                title: "Tilt Perspective",
                hidden: (props) => !props.tiltEffect,
            },
        },
    },
    dragCursor: {
        type: ControlType.Object,
        title: "Drag Cursor",
        controls: {
            showDragCursor: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Show Drag Cursor",
            },
            dragCursorBg: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Background",
            },
            dragCursorText: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Text",
            },
        },
    },
    closeCursor: {
        type: ControlType.Object,
        title: "Close Cursor",
        controls: {
            showCloseCursor: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Show Close Cursor",
            },
            closeCursorBg: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Background",
            },
            closeCursorText: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Text",
            },
        },
    },
    infoPanelColors: {
        type: ControlType.Object,
        title: "Info Panel Colors",
        controls: {
            infoGradientStart: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.85)",
                title: "Gradient Start",
            },
            infoGradientMid: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.55)",
                title: "Gradient Mid",
            },
            infoGradientEnd: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0)",
                title: "Gradient End",
            },
            infoTitleColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Overlay Title Color",
            },
            infoDescColor: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.82)",
                title: "Overlay Description Color",
            },
            overlayBg: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.88)",
                title: "Lightbox Overlay BG",
            },
            cardTitleColor: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Card Title Color",
            },
            cardDescColor: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.82)",
                title: "Card Description Color",
            },
            cardInfoBgColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Card Info Background",
            },
        },
    },
    headerTypography: {
        type: ControlType.Object,
        title: "Heading Typography & Colors",
        controls: {
            headerTitleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 36,
                    fontWeight: 700,
                    textAlign: "left",
                    lineHeight: 1.1,
                    letterSpacing: -0.5,
                },
            },
            headerTitleTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "none",
                title: "Title Transform",
            },
            headerTitleColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Title Color",
            },
            headerDescFont: {
                type: ControlType.Font,
                title: "Desc Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 15,
                    fontWeight: 400,
                    textAlign: "left",
                    lineHeight: 1.6,
                    letterSpacing: 0,
                },
            },
            headerDescTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "none",
                title: "Desc Transform",
            },
            headerDescColor: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.7)",
                title: "Desc Color",
            },
        },
    },
    titleTypography: {
        type: ControlType.Object,
        title: "Reel Title Typography",
        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 19,
                    fontWeight: 700,
                    textAlign: "left",
                    lineHeight: 1.3,
                    letterSpacing: 0.2,
                },
            },
            titleTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "none",
                title: "Transform",
            },
        },
    },
    descTypography: {
        type: ControlType.Object,
        title: "Reel Description Typography",
        controls: {
            descFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 12.5,
                    textAlign: "left",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    letterSpacing: 0,
                },
            },
            descTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "none",
                title: "Transform",
            },
        },
    },
    counterTypography: {
        type: ControlType.Object,
        title: "Counter Typography",
        controls: {
            counterFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 11,
                    fontWeight: 600,
                    textAlign: "left",
                    lineHeight: 1.3,
                    letterSpacing: 0.22,
                },
            },
            counterTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "uppercase",
                title: "Transform",
            },
        },
    },
    counterColors: {
        type: ControlType.Object,
        title: "Counter Colors",
        controls: {
            counterLabelColor: {
                type: ControlType.Color,
                defaultValue: "",
                title: "Label Color",
            },
            counterCountColor: {
                type: ControlType.Color,
                defaultValue: "",
                title: "Count Color",
            },
        },
    },
    overlayTitleTypography: {
        type: ControlType.Object,
        title: "Overlay Title Typography",
        controls: {
            overlayTitleFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 24,
                    textAlign: "left",
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: 0.2,
                },
            },
            overlayTitleTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "none",
                title: "Transform",
            },
        },
    },
    overlayDescTypography: {
        type: ControlType.Object,
        title: "Overlay Description Typography",
        controls: {
            overlayDescFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 14,
                    textAlign: "left",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    letterSpacing: 0,
                },
            },
            overlayDescTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "none",
                title: "Transform",
            },
        },
    },
    controlBarColors: {
        type: ControlType.Object,
        title: "Control Bar Colors",
        controls: {
            controlBarBg: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.95)",
                title: "Bar Background",
            },
            controlBarBorder: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.1)",
                title: "Bar Border",
            },
            controlBtnText: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Button Text",
            },
            controlBtnHoverBg: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.08)",
                title: "Button Hover BG",
            },
            controlBtnActiveBg: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Active Button BG",
            },
            controlBtnActiveText: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Active Button Text",
            },
        },
    },
    autoplayButtonColors: {
        type: ControlType.Object,
        title: "Autoplay Button Colors",
        controls: {
            autoplayFabBg: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.95)",
                title: "Background",
            },
            autoplayFabHoverBg: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.08)",
                title: "Hover Background",
            },
            autoplayFabBorder: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.9)",
                title: "Border",
            },
            autoplayFabText: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Icon Color",
            },
            autoplayFabActiveBg: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Active Background",
            },
            autoplayFabActiveText: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Active Icon Color",
            },
        },
    },
    actionButton: {
        type: ControlType.Object,
        title: "Card Action Button",
        controls: {
            showActionButton: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Show Action Button",
                description:
                    "Display the arrow action button on cards that have a link set.",
            },
            actionButtonBg: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Background Color",
                hidden: (props) => !props.showActionButton,
            },
            actionButtonHoverBg: {
                type: ControlType.Color,
                defaultValue: "#333333",
                title: "Hover Background",
                hidden: (props) => !props.showActionButton,
            },
            actionButtonIconColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Icon Color",
                hidden: (props) => !props.showActionButton,
            },
            actionButtonHoverIconColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Hover Icon Color",
                description: "Icon color when the button is hovered.",
                hidden: (props) => !props.showActionButton,
            },
            actionButtonSize: {
                type: ControlType.Number,
                defaultValue: 44,
                min: 24,
                max: 100,
                step: 2,
                title: "Button Size",
                hidden: (props) => !props.showActionButton,
            },
            actionButtonIconSize: {
                type: ControlType.Number,
                defaultValue: 55,
                min: 20,
                max: 90,
                step: 1,
                title: "Icon Size",
                description:
                    "Size of the icon inside the button as a percentage of the button size.",
                hidden: (props) => !props.showActionButton,
            },
            actionButtonBorderRadius: {
                type: ControlType.Number,
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                title: "Border Radius",
                hidden: (props) => !props.showActionButton,
            },
            actionButtonPosition: {
                type: ControlType.Enum,
                options: [
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                ],
                optionTitles: [
                    "Top Left",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Right",
                ],
                defaultValue: "bottom-right",
                title: "Position on Card",
                hidden: (props) => !props.showActionButton,
            },
        },
    },
})
