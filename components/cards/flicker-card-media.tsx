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
}

interface FontToken {
    fontFamily?: string
    fontSize?: number
    lineHeight?: number
    letterSpacing?: number
    fontWeight?: number
}

interface CarouselProps {
    items: MediaItem[]
    autoplaySettings: {
        autoplay: boolean
        speed: number
        mediaPauseDuration: number
        fabPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    }
    cardLayout: {
        cardWidth: number
        cardHeight: number
        cardGap: number
        cardBorderRadius: number
        backgroundColor: string
        shadowIntensity: number
        visibleCards?: 1 | 3 | 5 | 7 | 9
        infoBelowImage: boolean
    }
    navigation: {
        showControls: boolean
        keyboardNav: boolean
        mouseWheel: boolean
        mouseWheelInvert: boolean
        mouseWheelSpeed: number
        hoverPause: boolean
        navPosition:
            | "bottom-center"
            | "bottom-left"
            | "bottom-right"
            | "top-center"
            | "top-left"
            | "top-right"
        showNavText: boolean
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
    }
    titleTypography: {
        titleFont?: FontToken
        titleTextTransform?: string
        titleTextAlign?: "left" | "center" | "right"
    }
    descTypography: {
        descFont?: FontToken
        descTextTransform?: string
        descTextAlign?: "left" | "center" | "right"
    }
    overlayTypography: {
        overlayTitleFont?: FontToken
        overlayTitleTextTransform?: string
        overlayDescFont?: FontToken
        overlayDescTextTransform?: string
    }
    overlayTextColors: {
        overlayTitleColor: string
        overlayDescColor: string
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
}

interface NormalizedItem {
    type: "image" | "mp4" | "youtube"
    src: string
    title: string
    desc: string
    fullscreen: boolean
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
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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
const IconPause = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="currentColor"
        aria-hidden="true"
    >
        <rect x="2" y="2" width="4" height="10" rx="1" />
        <rect x="8" y="2" width="4" height="10" rx="1" />
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

// ─── Utilities ────────────────────────────────────────────────────────────────

function getYouTubeId(url: string | undefined): string | null {
    if (!url) return null
    const m = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    )
    return m ? m[1] : null
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
                }
            if (item.mediaType === "Video" && item.video)
                return {
                    type: "mp4",
                    src: item.video,
                    title: item.title || "",
                    desc: item.description || "",
                    fullscreen: false,
                }
            if (item.mediaType === "Youtube" && item.youtubeLink)
                return {
                    type: "youtube",
                    src: item.youtubeLink,
                    title: item.title || "",
                    desc: item.description || "",
                    fullscreen: false,
                }
            return null
        })
        .filter((item): item is NormalizedItem => item !== null)
}

function px(v: number | string | undefined, fallback = 0): string {
    if (typeof v === "number") return `${v}px`
    if (typeof v === "string") return v
    return `${fallback}px`
}

// ─── CSS Builder ──────────────────────────────────────────────────────────────

function buildCSS(uid: string, props: CarouselProps): string {
    const {
        cardWidth,
        cardHeight,
        cardGap,
        cardBorderRadius,
        backgroundColor,
        shadowIntensity,
    } = props.cardLayout
    const {
        infoGradientStart,
        infoGradientMid,
        infoGradientEnd,
        infoTitleColor,
        infoDescColor,
        overlayBg,
    } = props.infoPanelColors
    const { titleFont, titleTextTransform, titleTextAlign } =
        props.titleTypography
    const { descFont, descTextTransform, descTextAlign } = props.descTypography
    const {
        overlayTitleFont,
        overlayTitleTextTransform,
        overlayDescFont,
        overlayDescTextTransform,
    } = props.overlayTypography
    const { overlayTitleColor, overlayDescColor } = props.overlayTextColors
    const {
        controlBarBg,
        controlBarBorder,
        controlBtnText,
        controlBtnHoverBg,
        controlBtnActiveBg,
        controlBtnActiveText,
    } = props.controlBarColors
    const {
        autoplayFabBg,
        autoplayFabHoverBg,
        autoplayFabBorder,
        autoplayFabText,
        autoplayFabActiveBg,
        autoplayFabActiveText,
    } = props.autoplayButtonColors
    const { dragCursorBg, dragCursorText } = props.dragCursor
    const { closeCursorBg, closeCursorText } = props.closeCursor

    const titleFamily = titleFont?.fontFamily ?? "Inter"
    const titleSize = `${titleFont?.fontSize ?? 22}`
    const titleLH = titleFont?.lineHeight ?? 1.2
    const titleLS = px(titleFont?.letterSpacing, 1)
    const titleWeight = titleFont?.fontWeight ?? 700
    const titleTT = titleTextTransform ?? "uppercase"
    const titleTA = titleTextAlign ?? "center"

    const descFamily = descFont?.fontFamily ?? "Inter"
    const descSize = `${descFont?.fontSize ?? 12}`
    const descLH = descFont?.lineHeight ?? 1.5
    const descLS = px(descFont?.letterSpacing, 2)
    const descWeight = descFont?.fontWeight ?? 400
    const descTT = descTextTransform ?? "uppercase"
    const descTA = descTextAlign ?? "center"

    const overlayTitleFamily = overlayTitleFont?.fontFamily ?? "Inter"
    const overlayTitleSize = `${overlayTitleFont?.fontSize ?? 24}`
    const overlayTitleLH = overlayTitleFont?.lineHeight ?? 1.3
    const overlayTitleLS = px(overlayTitleFont?.letterSpacing, 0)
    const overlayTitleWeight = overlayTitleFont?.fontWeight ?? 700
    const overlayTitleTT = overlayTitleTextTransform ?? "none"

    const overlayDescFamily = overlayDescFont?.fontFamily ?? "Inter"
    const overlayDescSize = `${overlayDescFont?.fontSize ?? 14}`
    const overlayDescLH = overlayDescFont?.lineHeight ?? 1.6
    const overlayDescLS = px(overlayDescFont?.letterSpacing, 0)
    const overlayDescWeight = overlayDescFont?.fontWeight ?? 400
    const overlayDescTT = overlayDescTextTransform ?? "none"

    const s = `.mc-${uid}`

    const vars = [
        `--card-w:${cardWidth}px`,
        `--card-h:${cardHeight}px`,
        `--card-gap:${cardGap}px`,
        `--card-r:${cardBorderRadius}px`,
        `--bg:${backgroundColor}`,
        `--shadow-op:${shadowIntensity}`,
        `--ig0:${infoGradientStart}`,
        `--ig1:${infoGradientMid}`,
        `--ig2:${infoGradientEnd}`,
        `--itc:${infoTitleColor}`,
        `--idc:${infoDescColor}`,
        `--obg:${overlayBg}`,
        `--otc:${overlayTitleColor}`,
        `--odc:${overlayDescColor}`,
        `--cbbg:${controlBarBg}`,
        `--cbb:${controlBarBorder}`,
        `--cbbt:${controlBtnText}`,
        `--cbbh:${controlBtnHoverBg}`,
        `--cbba:${controlBtnActiveBg}`,
        `--cbbat:${controlBtnActiveText}`,
        `--afbg:${autoplayFabBg}`,
        `--afbh:${autoplayFabHoverBg}`,
        `--afbb:${autoplayFabBorder}`,
        `--afbt:${autoplayFabText}`,
        `--afba:${autoplayFabActiveBg}`,
        `--afbat:${autoplayFabActiveText}`,
        `--dcbg:${dragCursorBg}`,
        `--dctxt:${dragCursorText}`,
        `--ccbg:${closeCursorBg}`,
        `--cctxt:${closeCursorText}`,
    ].join(";")

    return `
${s}{${vars};display:block;width:100%;height:100%;position:relative;font-family:Inter,sans-serif;background:var(--bg)}

${s} .carousel-wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:visible;position:relative;background:transparent;outline:none;touch-action:pan-y;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.carousel-wrap:focus-visible{outline:none}
${s} .flick-container{position:relative;width:var(--card-w);height:var(--card-h)}
${s} .card{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:var(--card-r);overflow:hidden;background:transparent;transform-origin:center center;will-change:transform,opacity;box-shadow:0 30px 70px rgba(0,0,0,var(--shadow-op))}
${s} .card-image-wrapper{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;background:#111}
${s} .card img,${s} .card video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;border:none}
${s} .card iframe{width:100%;height:100%;display:block;pointer-events:none;border:none}
${s} .yt-wrap{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none}
${s} .yt-wrap iframe{position:absolute;top:50%;left:50%;width:177.78%;height:177.78%;min-width:100%;min-height:100%;transform:translate(-50%,-50%);pointer-events:none;border:none}
${s} .card::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,0);transition:background .35s ease;pointer-events:none;z-index:3}
${s} .card:not(.active)::after{background:rgba(0,0,0,.35)}
${s} .card.active{cursor:pointer}

${s} .info-below-mode .card{display:flex;flex-direction:column;background:transparent;border-radius:0;overflow:visible;box-shadow:none}
${s} .info-below-mode .card::after{display:none}
${s} .info-below-mode .card-image-wrapper{position:relative;width:100%;flex:1 1 auto;min-height:0;overflow:hidden;border-radius:var(--card-r);box-shadow:0 30px 70px rgba(0,0,0,var(--shadow-op));background:#111}
${s} .info-below-mode .card img,${s} .info-below-mode .card video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover}
${s} .info-below-mode .yt-wrap{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden}
${s} .info-below-mode .yt-wrap iframe{position:absolute;top:50%;left:50%;width:177.78%;height:177.78%;min-width:100%;min-height:100%;transform:translate(-50%,-50%)}
${s} .info-below-mode .info-panel{position:relative;left:auto;right:auto;bottom:auto;padding:20px 24px 24px;background:transparent;opacity:0;transform:translateY(14px);z-index:4;flex-shrink:0;text-align:${titleTA}}
${s} .info-below-mode .info-panel .info-title{color:${infoTitleColor};font-family:${titleFamily},sans-serif;font-size:${titleSize};font-weight:${titleWeight};letter-spacing:${titleLS};line-height:${titleLH};text-transform:${titleTT};margin:0 0 6px 0;text-shadow:none;text-align:${titleTA}}
${s} .info-below-mode .info-panel .info-desc{color:${infoDescColor};font-family:${descFamily},sans-serif;font-size:${descSize};font-weight:${descWeight};letter-spacing:${descLS};line-height:${descLH};text-transform:${descTT};margin:0;text-shadow:none;text-align:${descTA}}

${s} .info-panel{position:absolute;left:0;right:0;bottom:0;padding:40px 24px 24px;background:linear-gradient(to top,var(--ig0) 0%,var(--ig1) 50%,var(--ig2) 100%);z-index:4;pointer-events:none}
${s} .info-title{color:var(--itc);font-family:${titleFamily},sans-serif;font-size:${titleSize};font-weight:${titleWeight};letter-spacing:${titleLS};line-height:${titleLH};text-transform:${titleTT};margin:0 0 4px 0;text-shadow:0 2px 10px rgba(0,0,0,0.3);text-align:${titleTA}}
${s} .info-desc{color:var(--idc);font-family:${descFamily},sans-serif;width:100%;font-size:${descSize};font-weight:${descWeight};letter-spacing:${descLS};line-height:${descLH};text-transform:${descTT};margin:0;text-shadow:0 1px 5px rgba(0,0,0,0.3);text-align:${descTA}}
${s} .info-title span,${s} .info-desc{display:inline-block;will-change:transform,opacity}
${s} .info-title span {
    display: inline-block;
    margin-right: 0.3em;
}

${s} .info-title span:last-child {
    margin-right: 0;
}
${s} .controls{position:absolute;z-index:10;display:flex;gap:8px;padding:8px;background:var(--cbbg);border:1px solid var(--cbb);border-radius:100px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
${s} .controls button{background:transparent;border:none;color:var(--cbbt);padding:8px 16px;border-radius:100px;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;transition:all .2s ease;white-space:nowrap}
${s} .controls button:hover{background:var(--cbbh)}
${s} .controls button.active{background:var(--cbba);color:var(--cbbat)}
${s} .pos-bottom-center{bottom:30px;left:50%;transform:translateX(-50%)}
${s} .pos-bottom-left{bottom:30px;left:30px}
${s} .pos-bottom-right{bottom:30px;right:30px}
${s} .pos-top-center{top:30px;left:50%;transform:translateX(-50%)}
${s} .pos-top-left{top:30px;left:30px}
${s} .pos-top-right{top:30px;right:30px}
${s} .autoplay-fab{position:absolute;z-index:10;width:44px;height:44px;border-radius:50%;background:var(--afbg);border:1px solid var(--afbb);color:var(--afbt);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
${s} .autoplay-fab:hover{background:var(--afbh);transform:scale(1.05)}
${s} .autoplay-fab.active{background:var(--afba);color:var(--afbat)}

/* ── Custom cursors
   Key fix: position:fixed, top/left both -35px (half of 70px) so the
   circle is centred on the pointer from the very first frame.
   NO CSS transform or opacity — GSAP owns those entirely.        ── */
${s} .drag-cursor,${s} .close-cursor{
    position:fixed;
    top:-35px;
    left:-35px;
    width:70px;
    height:70px;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:10px;
    font-weight:800;
    letter-spacing:1px;
    pointer-events:none;
    z-index:9999;
    text-align:center;
    /* GSAP controls transform & opacity — no CSS defaults here */
}
${s} .drag-cursor{background:var(--dcbg);color:var(--dctxt)}
${s} .close-cursor{background:var(--ccbg);color:var(--cctxt)}

${s} .overlay{position:fixed;inset:0;background:var(--obg);z-index:1000;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
${s} .overlay-content{width:100%;height:100%;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px}
${s} .overlay-media{max-width:90%;max-height:70%;border-radius:12px;overflow:hidden;box-shadow:0 50px 100px rgba(0,0,0,0.5);background:#000}
${s} .overlay-media img{width:100%;height:100%;object-fit:contain;display:block}
${s} .overlay-info{margin-top:40px;text-align:center;max-width:600px}
${s} .overlay-title{color:var(--otc);font-family:${overlayTitleFamily},sans-serif;font-size:${overlayTitleSize};font-weight:${overlayTitleWeight};line-height:${overlayTitleLH};letter-spacing:${overlayTitleLS};text-transform:${overlayTitleTT};margin:0 0 12px 0}
${s} .overlay-desc{color:var(--odc);font-family:${overlayDescFamily},sans-serif;font-size:${overlayDescSize};font-weight:${overlayDescWeight};line-height:${overlayDescLH};letter-spacing:${overlayDescLS};text-transform:${overlayDescTT};margin:0}
${s} .overlay-close{position:absolute;top:30px;right:30px;background:rgba(255,255,255,0.1);border:none;color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease;z-index:1001}
${s} .overlay-close:hover{background:rgba(255,255,255,0.2);transform:rotate(90deg)}

${s} .static-carousel-wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
${s} .static-carousel{display:flex;align-items:center;justify-content:center;gap:var(--card-gap);position:relative;width:100%;height:100%}
${s} .static-card{position:relative;width:var(--card-w);height:var(--card-h);border-radius:var(--card-r);overflow:hidden;background:#111;flex-shrink:0;box-shadow:0 30px 70px rgba(0,0,0,var(--shadow-op))}
${s} .static-card img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block}
${s} .static-card-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1a1a;color:#555;font-size:13px;font-family:Inter,sans-serif}
${s} .static-video-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#111;color:#666;gap:8px;font-size:12px;font-family:Inter,sans-serif}
${s} .static-play-icon{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;color:#fff}
${s} .static-info-panel{position:absolute;left:0;right:0;bottom:0;padding:40px 24px 24px;background:linear-gradient(to top,var(--ig0) 0%,var(--ig1) 50%,var(--ig2) 100%);z-index:4}
${s} .static-info-title{color:var(--itc);font-family:${titleFamily},sans-serif;font-size:${titleSize};font-weight:${titleWeight};letter-spacing:${titleLS};line-height:${titleLH};text-transform:${titleTT};margin:0 0 4px 0;text-align:${titleTA}}
${s} .static-info-desc{color:var(--idc);font-family:${descFamily},sans-serif;font-size:${descSize};font-weight:${descWeight};letter-spacing:${descLS};line-height:${descLH};text-transform:${descTT};margin:0;text-align:${descTA}}

${s} .static-info-below-mode .static-card{display:flex;flex-direction:column;background:transparent;overflow:visible;box-shadow:none;height:auto}
${s} .static-info-below-mode .static-card-image-wrapper{position:relative;width:100%;height:var(--card-h);overflow:hidden;border-radius:var(--card-r);flex-shrink:0;box-shadow:0 30px 70px rgba(0,0,0,var(--shadow-op));background:#111}
${s} .static-info-below-mode .static-card-image-wrapper img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover}
${s} .static-info-below-mode .static-info-panel{position:relative;background:transparent;padding:16px 4px 0;z-index:auto}
${s} .static-info-below-mode .static-info-title{color:${infoTitleColor};text-shadow:none}
${s} .static-info-below-mode .static-info-desc{color:${infoDescColor};text-shadow:none}
`
}

// ─── FlickerCardMedia Component ───────────────────────────────────────────────
/**
 * @framerDisableUnlink
 */
export default function FlickerCardMedia(props: CarouselProps) {
    const isStatic = useIsStaticRenderer()
    const uid = useId().replace(/:/g, "")
    const cssProps = useMemo(
        () => ({ ...props }),
        [
            props.cardLayout.cardWidth,
            props.cardLayout.cardHeight,
            props.cardLayout.cardGap,
            props.cardLayout.cardBorderRadius,
            props.cardLayout.backgroundColor,
            props.cardLayout.shadowIntensity,
            props.cardLayout.infoBelowImage,
            props.infoPanelColors.infoGradientStart,
            props.infoPanelColors.infoGradientMid,
            props.infoPanelColors.infoGradientEnd,
            props.infoPanelColors.infoTitleColor,
            props.infoPanelColors.infoDescColor,
            props.infoPanelColors.overlayBg,
            props.titleTypography.titleFont?.fontFamily,
            props.titleTypography.titleFont?.fontSize,
            props.titleTypography.titleFont?.fontWeight,
            props.titleTypography.titleFont?.lineHeight,
            props.titleTypography.titleFont?.letterSpacing,
            props.titleTypography.titleTextTransform,
            props.titleTypography.titleTextAlign,
            props.descTypography.descFont?.fontFamily,
            props.descTypography.descFont?.fontSize,
            props.descTypography.descFont?.fontWeight,
            props.descTypography.descFont?.lineHeight,
            props.descTypography.descFont?.letterSpacing,
            props.descTypography.descTextTransform,
            props.descTypography.descTextAlign,
            props.overlayTypography.overlayTitleFont?.fontFamily,
            props.overlayTypography.overlayTitleFont?.fontSize,
            props.overlayTypography.overlayTitleFont?.fontWeight,
            props.overlayTypography.overlayTitleTextTransform,
            props.overlayTypography.overlayDescFont?.fontFamily,
            props.overlayTypography.overlayDescFont?.fontSize,
            props.overlayTypography.overlayDescFont?.fontWeight,
            props.overlayTypography.overlayDescTextTransform,
            props.overlayTextColors.overlayTitleColor,
            props.overlayTextColors.overlayDescColor,
            props.controlBarColors.controlBarBg,
            props.controlBarColors.controlBarBorder,
            props.controlBarColors.controlBtnText,
            props.controlBarColors.controlBtnHoverBg,
            props.controlBarColors.controlBtnActiveBg,
            props.controlBarColors.controlBtnActiveText,
            props.autoplayButtonColors.autoplayFabBg,
            props.autoplayButtonColors.autoplayFabHoverBg,
            props.autoplayButtonColors.autoplayFabBorder,
            props.autoplayButtonColors.autoplayFabText,
            props.autoplayButtonColors.autoplayFabActiveBg,
            props.autoplayButtonColors.autoplayFabActiveText,
            props.dragCursor.dragCursorBg,
            props.dragCursor.dragCursorText,
            props.closeCursor.closeCursorBg,
            props.closeCursor.closeCursorText,
        ]
    )
    const css = useMemo(() => buildCSS(uid, cssProps), [uid, cssProps])

    return (
        <div className={`mc-${uid}`}>
            <style>{css}</style>
            {isStatic ? (
                <StaticCarousel uid={uid} {...props} />
            ) : (
                <CarouselCore uid={uid} {...props} />
            )}
        </div>
    )
}

FlickerCardMedia.defaultProps = {
    items: [
        {
            mediaType: "Image",
            image: "",
            title: "Hana Sato",
            description: "Project Manager",
        },
        {
            mediaType: "Video",
            video: "",
            title: "Item 2",
            description: "Description 2",
        },
        {
            mediaType: "Youtube",
            youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            title: "Item 3",
            description: "Description 3",
        },
    ],
    autoplaySettings: {
        autoplay: false,
        speed: 1.5,
        mediaPauseDuration: 5,
        fabPosition: "bottom-right",
    },
    cardLayout: {
        cardWidth: 320,
        cardHeight: 540,
        cardGap: 24,
        cardBorderRadius: 24,
        backgroundColor: "transparent",
        shadowIntensity: 0.25,
        visibleCards: 3,
        infoBelowImage: false,
    },
    navigation: {
        showControls: false,
        keyboardNav: true,
        mouseWheel: true,
        mouseWheelInvert: false,
        mouseWheelSpeed: 1,
        hoverPause: true,
        navPosition: "bottom-center",
        showNavText: true,
    },
    dragCursor: {
        showDragCursor: true,
        dragCursorBg: "rgba(0,0,0,0.9)",
        dragCursorText: "#ffffff",
    },
    closeCursor: {
        showCloseCursor: true,
        closeCursorBg: "rgba(0,0,0,0.9)",
        closeCursorText: "#ffffff",
    },
    infoPanelColors: {
        infoGradientStart: "rgba(0,0,0,0.85)",
        infoGradientMid: "rgba(0,0,0,0.55)",
        infoGradientEnd: "rgba(0,0,0,0)",
        infoTitleColor: "#ffffff",
        infoDescColor: "rgba(255,255,255,0.75)",
        overlayBg: "rgba(0,0,0,0.88)",
    },
    titleTypography: {
        titleFont: {
            fontFamily: "Inter",
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: 1,
        },
        titleTextTransform: "uppercase",
        titleTextAlign: "center",
    },
    descTypography: {
        descFont: {
            fontFamily: "Inter",
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 2,
        },
        descTextTransform: "uppercase",
        descTextAlign: "center",
    },
    overlayTypography: {
        overlayTitleFont: {
            fontFamily: "Inter",
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: 0.3,
        },
        overlayTitleTextTransform: "none",
        overlayDescFont: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.6,
            letterSpacing: 0,
        },
        overlayDescTextTransform: "none",
    },
    overlayTextColors: {
        overlayTitleColor: "#ffffff",
        overlayDescColor: "rgba(255,255,255,0.85)",
    },
    controlBarColors: {
        controlBarBg: "rgba(0,0,0,0.8)",
        controlBarBorder: "rgba(255,255,255,0.1)",
        controlBtnText: "#ffffff",
        controlBtnHoverBg: "rgba(255,255,255,0.15)",
        controlBtnActiveBg: "#ffffff",
        controlBtnActiveText: "#000000",
    },
    autoplayButtonColors: {
        autoplayFabBg: "rgba(0,0,0,0.8)",
        autoplayFabHoverBg: "rgba(255,255,255,0.15)",
        autoplayFabBorder: "rgba(255,255,255,0.9)",
        autoplayFabText: "#ffffff",
        autoplayFabActiveBg: "#ffffff",
        autoplayFabActiveText: "#000000",
    },
}

// ─── Static canvas preview ────────────────────────────────────────────────────

function StaticCarousel(props: CarouselProps & { uid: string }) {
    const visibleCount = props.cardLayout?.visibleCards ?? 3
    const infoBelow = props.cardLayout?.infoBelowImage ?? false
    const MEDIA = useMemo(
        () => normalizeItems(props.items).slice(0, visibleCount),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(props.items), visibleCount]
    )
    return (
        <div
            className={`static-carousel-wrap${infoBelow ? " static-info-below-mode" : ""}`}
        >
            <div className="static-carousel">
                {MEDIA.length === 0 ? (
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
                ) : (
                    MEDIA.map((item, i) => (
                        <div className="static-card" key={i}>
                            {infoBelow ? (
                                <>
                                    <div className="static-card-image-wrapper">
                                        {item.type === "image" ? (
                                            item.src ? (
                                                <img
                                                    src={item.src}
                                                    alt={item.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="static-card-placeholder">
                                                    Preview
                                                </div>
                                            )
                                        ) : (
                                            <div className="static-video-placeholder">
                                                <div className="static-play-icon">
                                                    <IconPlay />
                                                </div>
                                                <span>
                                                    {item.type === "youtube"
                                                        ? "YouTube Video"
                                                        : "Video"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {i === 0 && (item.title || item.desc) && (
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
                            ) : (
                                <>
                                    {item.type === "image" ? (
                                        item.src ? (
                                            <img
                                                src={item.src}
                                                alt={item.title}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <div className="static-card-placeholder">
                                                Preview
                                            </div>
                                        )
                                    ) : (
                                        <div className="static-video-placeholder">
                                            <div className="static-play-icon">
                                                <IconPlay />
                                            </div>
                                            <span>
                                                {item.type === "youtube"
                                                    ? "YouTube Video"
                                                    : "Video"}
                                            </span>
                                        </div>
                                    )}
                                    {i === 0 && (item.title || item.desc) && (
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
                    ))
                )}
            </div>
        </div>
    )
}

// ─── Overlay ─────────────────────────────────────────────────────────────────

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
                'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
            )
            const first = focusable[0],
                last = focusable[focusable.length - 1]
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last?.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first?.focus()
            }
        }
        window.addEventListener("keydown", handleFocusTrap)
        return () => window.removeEventListener("keydown", handleFocusTrap)
    }, [state.open, onClose])

    useEffect(() => {
        const overlay = overlayRef.current
        const closeCursor = closeCursorRef.current
        if (!overlay) return
        if (state.open) {
            gsap.to(overlay, {
                autoAlpha: 1,
                duration: 0.4,
                ease: "power2.out",
            })
            if (showCloseCursor && closeCursor)
                gsap.to(closeCursor, { scale: 1, opacity: 1, duration: 0.2 })
        } else {
            gsap.to(overlay, { autoAlpha: 0, duration: 0.3, ease: "power2.in" })
            if (showCloseCursor && closeCursor)
                gsap.to(closeCursor, { scale: 0, opacity: 0, duration: 0.15 })
        }
    }, [state.open, showCloseCursor, closeCursorRef])

    return (
        <div
            className="overlay"
            ref={overlayRef}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
            aria-hidden={!state.open}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="overlay-content"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    ref={closeButtonRef}
                    className="overlay-close"
                    onClick={(event) => {
                        event.stopPropagation()
                        onClose()
                    }}
                    aria-label="Close lightbox"
                >
                    <IconClose />
                </button>
                {state.item && (
                    <>
                        <div className="overlay-media">
                            <img src={state.item.src} alt={state.item.title} />
                        </div>
                        <div className="overlay-info">
                            <h2 className="overlay-title">
                                {state.item.title}
                            </h2>
                            <p className="overlay-desc">{state.item.desc}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// ─── CarouselCore ─────────────────────────────────────────────────────────────

function CarouselCore(props: CarouselProps & { uid: string }) {
    const {
        items,
        autoplaySettings,
        cardLayout,
        navigation,
        dragCursor,
        closeCursor,
    } = props
    const { autoplay, speed, mediaPauseDuration, fabPosition } =
        autoplaySettings
    const { visibleCards, infoBelowImage } = cardLayout
    const {
        showControls,
        keyboardNav,
        mouseWheel,
        mouseWheelInvert,
        mouseWheelSpeed,
        hoverPause,
        navPosition,
        showNavText,
    } = navigation
    const { showDragCursor } = dragCursor
    const { showCloseCursor } = closeCursor

    const wrapRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const carouselRef = useRef<HTMLDivElement>(null)
    const cursorRef = useRef<HTMLDivElement>(null)
    const closeCursorRef = useRef<HTMLDivElement>(null)
    const prevBtnRef = useRef<HTMLButtonElement>(null)
    const nextBtnRef = useRef<HTMLButtonElement>(null)

    const [autoplayActive, setAutoplayActive] = useState(autoplay)
    const [overlayState, setOverlayState] = useState<OverlayState>({
        open: false,
        item: null,
    })
    const [isIntersecting, setIsIntersecting] = useState(false)

    const openOverlayRef = useRef((item: NormalizedItem) => {
        setOverlayState({ open: true, item })
    })
    const closeOverlay = useCallback(() => {
        setOverlayState({ open: false, item: null })
    }, [])
    const MEDIA = useMemo(() => normalizeItems(items), [items])
    const prefersReducedMotion = useMemo(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        []
    )
    const cardRefsMap = useMemo(() => new Map<HTMLElement, CardRefs>(), [])
    const stateMap = useMemo(
        () => new Map<HTMLElement, { playing: boolean; muted: boolean }>(),
        []
    )

    const getCardRefs = (el: HTMLElement): CardRefs => {
        if (cardRefsMap.has(el)) return cardRefsMap.get(el)!
        const refs: CardRefs = {
            video: el.querySelector("video"),
            iframe: el.querySelector("iframe"),
            infoPanel: el.querySelector(".info-panel"),
            infoWords: Array.from(el.querySelectorAll(".info-title span")),
            infoDesc: el.querySelector(".info-desc"),
        }
        cardRefsMap.set(el, refs)
        return refs
    }

    const ytCommand = (iframe: HTMLIFrameElement, cmd: string) => {
        iframe.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: cmd, args: [] }),
            "*"
        )
    }

    useEffect(() => {
        const wrap = wrapRef.current
        const container = containerRef.current
        const carouselEl = carouselRef.current
        if (!wrap || !container || !carouselEl || MEDIA.length === 0) return

        // ── initialise cursor: hidden, positioned off-screen ──────────────
        const cursor = cursorRef.current
        const closeCurEl = closeCursorRef.current
        if (cursor) {
            gsap.set(cursor, { scale: 0, opacity: 0, x: -1000, y: -1000 })
        }
        if (closeCurEl) {
            gsap.set(closeCurEl, { scale: 0, opacity: 0, x: -1000, y: -1000 })
        }

        const buildCard = (item: NormalizedItem) => {
            const card = document.createElement("div")
            card.className = "card"
            card.dataset.type = item.type
            if (item.fullscreen) card.classList.add("has-expand")

            const mediaWrap = document.createElement("div")
            mediaWrap.className = "card-image-wrapper"

            if (item.type === "image") {
                const img = document.createElement("img")
                img.src = item.src
                img.alt = item.title
                img.loading = "lazy"
                mediaWrap.appendChild(img)
            } else if (item.type === "mp4") {
                const v = document.createElement("video")
                v.src = item.src
                v.muted = true
                v.loop = true
                v.playsInline = true
                v.setAttribute("webkit-playsinline", "true")
                mediaWrap.appendChild(v)
                stateMap.set(card, { playing: true, muted: true })
            } else if (item.type === "youtube") {
                const ytId = getYouTubeId(item.src)
                const ytWrap = document.createElement("div")
                ytWrap.className = "yt-wrap"
                mediaWrap.appendChild(ytWrap)
                stateMap.set(card, { playing: true, muted: true })
                setupYoutube(card, ytWrap, ytId)
            }
            card.appendChild(mediaWrap)

            const info = document.createElement("div")
            info.className = "info-panel"
            const title = document.createElement("h3")
            title.className = "info-title"
            item.title.split(" ").forEach((word) => {
                const sp = document.createElement("span")
                sp.textContent = word
                title.appendChild(sp)
            })
            const desc = document.createElement("p")
            desc.className = "info-desc"
            desc.textContent = item.desc
            info.appendChild(title)
            info.appendChild(desc)
            card.appendChild(info)
            return card
        }

        const setupYoutube = (
            card: HTMLElement,
            container: HTMLElement,
            id: string | null
        ) => {
            if (!id) return
            let iframeLoaded = false
            let iframeEl: HTMLIFrameElement | null = null

            const loadIframe = (cb?: () => void) => {
                if (iframeLoaded) {
                    cb?.()
                    return
                }
                iframeEl = document.createElement("iframe")
                iframeEl.src = `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3`
                iframeEl.allow = "autoplay; encrypted-media"
                container.appendChild(iframeEl)
                iframeLoaded = true
                iframeEl.onload = () => cb?.()
            }
            const unloadIframe = () => {
                if (iframeEl?.parentNode) {
                    iframeEl.remove()
                    iframeEl = null
                    iframeLoaded = false
                    cardRefsMap.delete(card)
                }
            }
            ;(card as any)._loadYtIframe = loadIframe
            ;(card as any)._unloadYtIframe = unloadIframe
        }

        carouselEl.replaceChildren()
        const cards = MEDIA.map((item) => {
            const c = buildCard(item)
            carouselEl.appendChild(c)
            return c
        })

        const total = cards.length
        let activeIdx = 0
        let wrapWidth = wrap.offsetWidth
        const getMod = (n: number, m: number) => ((n % m) + m) % m
        const maxVisible = Math.floor((visibleCards ?? 3) / 2)

        function getCfg(i: number, ci: number) {
            let diff = i - ci
            if (diff > total / 2) diff -= total
            if (diff < -total / 2) diff += total
            const abs = Math.abs(diff)
            if (abs === 0) return { x: 0, y: 0, rot: 0, s: 1, o: 1, zIdx: 5 }
            if (abs <= maxVisible)
                return {
                    x: diff * 30,
                    y: 1,
                    rot: diff * 10,
                    s: Math.max(0.6, 1 - abs * 0.1),
                    o: 1,
                    zIdx: 5 - abs,
                }
            return { x: 0, y: 0, rot: 0, s: 0.6, o: 0, zIdx: 2 }
        }

        const quickProps = cards.map((card) => ({
            x: gsap.quickTo(card, "xPercent", { ease: "none" }),
            y: gsap.quickTo(card, "yPercent", { ease: "none" }),
            rot: gsap.quickTo(card, "rotation", { ease: "none" }),
            s: gsap.quickTo(card, "scale", { ease: "none" }),
            o: gsap.quickTo(card, "opacity", { ease: "none" }),
        }))

        function revealInfoPanel(card: HTMLElement) {
            const refs = getCardRefs(card)
            if (!refs.infoPanel) return
            gsap.killTweensOf([
                refs.infoPanel,
                refs.infoDesc,
                ...refs.infoWords,
            ])
            if (infoBelowImage) {
                gsap.to(refs.infoPanel, {
                    opacity: 1,
                    y: 0,
                    duration: 0.45,
                    ease: "power2.out",
                })
            } else {
                gsap.set(refs.infoPanel, { opacity: 1 })
                if (refs.infoWords.length > 0)
                    gsap.fromTo(
                        refs.infoWords,
                        { y: 20, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.5,
                            stagger: 0.04,
                            ease: "back.out(1.7)",
                        }
                    )
                if (refs.infoDesc)
                    gsap.fromTo(
                        refs.infoDesc,
                        { y: 10, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.45,
                            delay: 0.15,
                            ease: "power3.out",
                        }
                    )
            }
        }

        function hideInfoPanel(card: HTMLElement) {
            const refs = getCardRefs(card)
            if (!refs.infoPanel) return
            gsap.killTweensOf([
                refs.infoPanel,
                refs.infoDesc,
                ...refs.infoWords,
            ])
            if (infoBelowImage) {
                gsap.to(refs.infoPanel, {
                    opacity: 0,
                    y: 14,
                    duration: 0.25,
                    ease: "power2.in",
                })
            } else {
                gsap.set(refs.infoPanel, { opacity: 0 })
            }
        }

        function renderDiscrete(
            ci: number,
            duration = 0.8,
            ease = "elastic.out(1, 0.5)"
        ) {
            cards.forEach((card, i) => {
                const cfg = getCfg(i, ci)
                card.style.zIndex = String(cfg.zIdx)
                const isActive = cfg.x === 0
                card.classList.toggle("active", isActive)
                card.setAttribute("aria-current", String(isActive))
                if (isActive) revealInfoPanel(card)
                else hideInfoPanel(card)

                if (!prefersReducedMotion) {
                    quickProps[i].x(cfg.x, duration, ease)
                    quickProps[i].y(cfg.y, duration, ease)
                    quickProps[i].rot(cfg.rot, duration, ease)
                    quickProps[i].s(cfg.s, duration, ease)
                    quickProps[i].o(cfg.o, duration, ease)
                } else {
                    gsap.set(card, {
                        xPercent: cfg.x,
                        yPercent: cfg.y,
                        rotation: cfg.rot,
                        scale: cfg.s,
                        opacity: cfg.o,
                    })
                }

                const refs = getCardRefs(card)
                const state = stateMap.get(card)
                if (isActive) {
                    if (refs.video && state?.playing) {
                        refs.video.muted = true
                        refs.video
                            .play()
                            .then(() => {
                                if (refs.video) refs.video.muted = state.muted
                            })
                            .catch(() => {})
                    }
                    ;(card as any)._loadYtIframe?.(() => {
                        cardRefsMap.delete(card)
                        const freshRefs = getCardRefs(card)
                        if (freshRefs.iframe && state?.playing) {
                            ytCommand(freshRefs.iframe, "playVideo")
                            setTimeout(() => {
                                if (freshRefs.iframe)
                                    ytCommand(
                                        freshRefs.iframe,
                                        state.muted ? "mute" : "unMute"
                                    )
                            }, 600)
                        }
                    })
                } else {
                    if (refs.video) {
                        refs.video.muted = true
                        refs.video.pause()
                    }
                    if (refs.iframe) {
                        ytCommand(refs.iframe, "pauseVideo")
                        ytCommand(refs.iframe, "mute")
                    }
                    if (cfg.s < 0.7) (card as any)._unloadYtIframe?.()
                }
            })
        }

        renderDiscrete(0, 0)

        function next() {
            activeIdx = getMod(activeIdx + 1, total)
            renderDiscrete(activeIdx)
        }
        function prev() {
            activeIdx = getMod(activeIdx - 1, total)
            renderDiscrete(activeIdx)
        }

        const nextBtn = nextBtnRef.current
        const prevBtn = prevBtnRef.current
        if (nextBtn) nextBtn.addEventListener("click", next)
        if (prevBtn) prevBtn.addEventListener("click", prev)

        const handleKeyNav = (e: KeyboardEvent) => {
            if (!keyboardNav) return
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                pauseAutoplayTemporarily()
                next()
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                pauseAutoplayTemporarily()
                prev()
            }
        }
        wrap.addEventListener("keydown", handleKeyNav)
        const onWrapPointerDown = () => {
            if (keyboardNav) wrap.focus()
        }
        wrap.addEventListener("pointerdown", onWrapPointerDown)

        let wheelAccum = 0
        const handleWheel = (e: WheelEvent) => {
            if (!mouseWheel) return
            e.preventDefault()
            pauseAutoplayTemporarily()
            const delta =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            wheelAccum += mouseWheelInvert
                ? -(delta * (mouseWheelSpeed || 1))
                : delta * (mouseWheelSpeed || 1)
            if (wheelAccum >= 50) {
                next()
                wheelAccum = 0
            }
            if (wheelAccum <= -50) {
                prev()
                wheelAccum = 0
            }
        }
        wrap.addEventListener("wheel", handleWheel, { passive: false })

        const resizeObserver = new ResizeObserver(() => {
            wrapWidth = wrap.offsetWidth
        })
        resizeObserver.observe(wrap)

        let dragMoved = false
        cards.forEach((card, i) => {
            card.dataset.index = String(i)
            card.addEventListener("click", () => {
                if (dragMoved) return
                let diff = i - activeIdx
                if (diff > total / 2) diff -= total
                if (diff < -total / 2) diff += total
                const abs = Math.abs(diff)
                if (diff === 0) {
                    if (
                        card.classList.contains("has-expand") &&
                        card.dataset.type === "image"
                    )
                        openOverlayRef.current(MEDIA[i])
                } else if (abs <= maxVisible) {
                    if (diff > 0) next()
                    else prev()
                }
            })
        })

        let isDragging = false,
            startX = 0,
            startY = 0,
            dragX = 0,
            dragY = 0
        const swipeThreshold = 0.15

        // ── cursor tracking — all owned by GSAP, no CSS transitions ──────
        let cursorX = -1000,
            cursorY = -1000
        let targetX = -1000,
            targetY = -1000
        let cursorVisible = false

        const setCursorPos = (x: number, y: number) => {
            // x/y are clientX/Y; the element is top:-35px left:-35px so
            // translating by clientX/Y centres the circle on the pointer.
            gsap.set(cursor, { x, y })
            cursorX = x
            cursorY = y
            targetX = x
            targetY = y
        }

        const onDown = (e: PointerEvent) => {
            if (!wrap.contains(e.target as Node)) return
            isDragging = true
            dragMoved = false
            startX = e.clientX
            startY = e.clientY
            dragX = 0
            dragY = 0

            // Snap cursor to pointer BEFORE showing it
            if (showDragCursor && cursor) {
                setCursorPos(e.clientX, e.clientY)
                if (!cursorVisible) {
                    gsap.set(cursor, { opacity: 1 })
                    cursorVisible = true
                }
                gsap.to(cursor, {
                    scale: 1.2,
                    duration: 0.15,
                    ease: "power2.out",
                    overwrite: true,
                })
            }
            pauseAutoplayTemporarily()
        }

        const onMove = (e: PointerEvent) => {
            // Always keep target in sync during drag (pointermove fires reliably)
            targetX = e.clientX
            targetY = e.clientY

            if (!isDragging) return
            dragX = e.clientX - startX
            dragY = e.clientY - startY
            if (Math.abs(dragY) > Math.abs(dragX) && Math.abs(dragY) > 10) {
                isDragging = false
                if (showDragCursor && cursor)
                    gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.2 })
                return
            }
            if (Math.abs(dragX) > 5) dragMoved = true
            const raw = dragX / wrapWidth
            const prog = Math.min(1, Math.abs(raw))
            const dir = raw > 0 ? -1 : 1
            const nextCi = getMod(activeIdx + dir, total)
            cards.forEach((card, i) => {
                const a = getCfg(i, activeIdx),
                    b = getCfg(i, nextCi)
                const mix = (k: keyof typeof a) =>
                    Number(a[k]) + (Number(b[k]) - Number(a[k])) * prog
                quickProps[i].x(mix("x"), 0)
                quickProps[i].y(mix("y"), 0)
                quickProps[i].rot(mix("rot"), 0)
                quickProps[i].s(mix("s"), 0)
                quickProps[i].o(mix("o"), 0)
            })
        }

        const onUp = () => {
            if (!isDragging) return
            isDragging = false
            if (showDragCursor && cursor)
                gsap.to(cursor, { scale: 1, duration: 0.15, overwrite: true })
            const raw = dragX / wrapWidth
            let shift = 0
            if (raw > swipeThreshold) shift = -1
            if (raw < -swipeThreshold) shift = 1
            activeIdx = getMod(activeIdx + shift, total)
            renderDiscrete(activeIdx)
        }

        wrap.addEventListener("pointerdown", onDown)
        wrap.addEventListener("pointerup", onUp)
        wrap.addEventListener("pointermove", onMove)
        wrap.addEventListener("pointercancel", onUp)

        const onEnter = () => {
            if (showDragCursor && cursor) {
                if (!cursorVisible) {
                    gsap.set(cursor, { opacity: 1 })
                    cursorVisible = true
                }
                gsap.to(cursor, { scale: 1, duration: 0.25, overwrite: true })
            }
        }
        const onLeave = () => {
            if (showDragCursor && cursor)
                gsap.to(cursor, { scale: 0, duration: 0.25, overwrite: true })
        }

        // mousemove handles the smooth follow when NOT dragging
        const onMouseMove = (e: MouseEvent) => {
            targetX = e.clientX
            targetY = e.clientY
        }

        // Lerp ticker — only runs when not dragging (during drag we snap via onMove)
        const cursorTicker = () => {
            if (!showDragCursor || !cursor) return
            if (isDragging) {
                // During drag: snap directly to pointer, no lerp
                cursorX = targetX
                cursorY = targetY
            } else {
                // Hover: smooth follow
                cursorX += (targetX - cursorX) * 0.18
                cursorY += (targetY - cursorY) * 0.18
            }
            gsap.set(cursor, { x: cursorX, y: cursorY })
        }

        wrap.addEventListener("mouseenter", onEnter)
        wrap.addEventListener("mouseleave", onLeave)
        window.addEventListener("mousemove", onMouseMove)
        gsap.ticker.add(cursorTicker)

        let autoplayTimer: any = null,
            pauseTimer: any = null

        function startAutoplay() {
            stopAutoplay()
            autoplayTimer = setInterval(next, speed * 1000)
        }
        function stopAutoplay() {
            if (autoplayTimer) clearInterval(autoplayTimer)
            autoplayTimer = null
        }
        function pauseAutoplayTemporarily() {
            if (!autoplayActive) return
            stopAutoplay()
            if (pauseTimer) clearTimeout(pauseTimer)
            pauseTimer = setTimeout(() => {
                if (autoplayActive && (wrap as any)._isIntersecting !== false)
                    startAutoplay()
            }, mediaPauseDuration * 1000)
        }

        ;(wrap as any)._startAutoplay = startAutoplay
        ;(wrap as any)._stopAutoplay = stopAutoplay
        ;(wrap as any)._pauseAutoplayTemporarily = pauseAutoplayTemporarily
        ;(wrap as any)._isIntersecting = isIntersecting

        if (autoplayActive && isIntersecting) startAutoplay()

        const onHoverEnter = () => stopAutoplay()
        const onHoverLeave = () => {
            if (autoplayActive && (wrap as any)._isIntersecting !== false)
                startAutoplay()
        }

        if (hoverPause) {
            wrap.addEventListener("mouseenter", onHoverEnter)
            wrap.addEventListener("mouseleave", onHoverLeave)
        }

        return () => {
            stopAutoplay()
            if (pauseTimer) clearTimeout(pauseTimer)
            wrap.removeEventListener("keydown", handleKeyNav)
            wrap.removeEventListener("pointerdown", onWrapPointerDown)
            wrap.removeEventListener("wheel", handleWheel)
            wrap.removeEventListener("pointerdown", onDown)
            wrap.removeEventListener("pointerup", onUp)
            wrap.removeEventListener("pointermove", onMove)
            wrap.removeEventListener("pointercancel", onUp)
            wrap.removeEventListener("mouseenter", onEnter)
            wrap.removeEventListener("mouseleave", onLeave)
            if (hoverPause) {
                wrap.removeEventListener("mouseenter", onHoverEnter)
                wrap.removeEventListener("mouseleave", onHoverLeave)
            }
            window.removeEventListener("mousemove", onMouseMove)
            gsap.ticker.remove(cursorTicker)
            resizeObserver.disconnect()
            cards.forEach((card) => {
                const refs = getCardRefs(card)
                gsap.killTweensOf(card)
                gsap.killTweensOf(card.querySelectorAll("*"))
                if (refs.infoPanel) gsap.killTweensOf(refs.infoPanel)
                if (refs.infoDesc) gsap.killTweensOf(refs.infoDesc)
                if (refs.infoWords.length > 0) gsap.killTweensOf(refs.infoWords)
                ;(card as any)._unloadYtIframe?.()
            })
            if (cursor) gsap.killTweensOf(cursor)
            gsap.killTweensOf(carouselEl)
            gsap.killTweensOf(container)
            gsap.killTweensOf(wrap)
            cardRefsMap.clear()
            stateMap.clear()
        }
    }, [
        MEDIA,
        speed,
        mediaPauseDuration,
        visibleCards,
        infoBelowImage,
        autoplayActive,
        keyboardNav,
        mouseWheel,
        mouseWheelInvert,
        mouseWheelSpeed,
        hoverPause,
        showDragCursor,
    ])

    useEffect(() => {
        if (typeof IntersectionObserver === "undefined") return
        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting
                setIsIntersecting(visible)

                const wrap = wrapRef.current as any
                if (!wrap) return
                wrap._isIntersecting = visible

                if (visible) {
                    if (autoplayActive) wrap._startAutoplay?.()
                } else {
                    wrap._stopAutoplay?.()
                }
            },
            { threshold: 0.1 }
        )
        if (wrapRef.current) observer.observe(wrapRef.current)
        return () => observer.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleAutoplayToggle = () => {
        setAutoplayActive((prev) => !prev)
    }
    const pauseAutoplayTemporarily = () => {
        ;(wrapRef.current as any)?._pauseAutoplayTemporarily?.()
    }

    return (
        <>
            <div
                className={`carousel-wrap${infoBelowImage ? " info-below-mode" : ""}`}
                ref={wrapRef}
                tabIndex={0}
                role="region"
                aria-label="Media Carousel"
            >
                <div className="flick-container" ref={containerRef}>
                    <div className="carousel-core" ref={carouselRef} />
                </div>
            </div>

            {showControls && (
                <div
                    className={`controls pos-${navPosition}`}
                    role="group"
                    aria-label="Carousel controls"
                >
                    <button ref={prevBtnRef} aria-label="Previous slide">
                        <IconPrev />
                        {showNavText ? " Prev" : ""}
                    </button>
                    <button
                        className={autoplayActive ? "active" : ""}
                        aria-pressed={autoplayActive}
                        onClick={handleAutoplayToggle}
                    >
                        {autoplayActive ? <IconPause /> : <IconPlay />}
                        {showNavText && (
                            <span>
                                {autoplayActive
                                    ? " Autoplay: ON"
                                    : " Autoplay: OFF"}
                            </span>
                        )}
                    </button>
                    <button ref={nextBtnRef} aria-label="Next slide">
                        {showNavText ? "Next " : ""}
                        <IconNext />
                    </button>
                </div>
            )}

            {!showControls && (
                <button
                    className={`autoplay-fab pos-${fabPosition}${autoplayActive ? " active" : ""}`}
                    type="button"
                    aria-label={
                        autoplayActive ? "Pause autoplay" : "Play autoplay"
                    }
                    aria-pressed={autoplayActive}
                    onClick={handleAutoplayToggle}
                >
                    {autoplayActive ? <IconPause /> : <IconPlay />}
                </button>
            )}

            <Overlay
                state={overlayState}
                onClose={closeOverlay}
                showCloseCursor={showCloseCursor}
                closeCursorRef={closeCursorRef}
            />

            {/* Cursor elements: visibility/position owned 100% by GSAP */}
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
                CLOSE
            </div>
        </>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(FlickerCardMedia, {
    items: {
        type: ControlType.Array,
        title: "Items",
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
                    title: "Image File",
                    hidden: (p) => p.mediaType !== "Image",
                },
                fullscreen: {
                    type: ControlType.Boolean,
                    title: "Fullscreen on Click",
                    defaultValue: false,
                    description:
                        "Open this image in a lightbox when the active card is clicked.",
                    hidden: (p) => p.mediaType !== "Image",
                },
                video: {
                    type: ControlType.File,
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    title: "Video File",
                    hidden: (p) => p.mediaType !== "Video",
                },
                youtubeLink: {
                    type: ControlType.String,
                    title: "YouTube URL",
                    placeholder: "https://youtube.com/watch?v=...",
                    hidden: (p) => p.mediaType !== "Youtube",
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
            },
        },
        defaultValue: [
            {
                mediaType: "Image",
                image: "",
                title: "Hana Sato",
                description: "Project Manager",
            },
            {
                mediaType: "Video",
                video: "",
                title: "Item 2",
                description: "Description 2",
            },
            {
                mediaType: "Youtube",
                youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                title: "Item 3",
                description: "Description 3",
            },
        ],
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
                title: "Speed (sec)",
            },
            mediaPauseDuration: {
                type: ControlType.Number,
                defaultValue: 5,
                min: 1,
                max: 60,
                step: 1,
                title: "Drag Pause (sec)",
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
    cardLayout: {
        type: ControlType.Object,
        title: "Card Layout",
        controls: {
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
                defaultValue: "transparent",
                title: "Background Color",
            },
            shadowIntensity: {
                type: ControlType.Number,
                defaultValue: 0.25,
                min: 0,
                max: 1,
                step: 0.01,
                title: "Shadow",
            },
            visibleCards: {
                type: ControlType.Enum,
                options: [1, 3, 5, 7, 9],
                optionTitles: ["1", "3", "5", "7", "9"],
                defaultValue: 3,
                title: "Visible Cards",
            },
            infoBelowImage: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Info Below Image",
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        controls: {
            showControls: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Show Prev/Next Buttons",
            },
            navPosition: {
                type: ControlType.Enum,
                options: [
                    "bottom-center",
                    "bottom-left",
                    "bottom-right",
                    "top-center",
                    "top-left",
                    "top-right",
                ],
                optionTitles: [
                    "Bottom Center",
                    "Bottom Left",
                    "Bottom Right",
                    "Top Center",
                    "Top Left",
                    "Top Right",
                ],
                defaultValue: "bottom-center",
                title: "Position",
            },
            showNavText: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Show Button Text",
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
                defaultValue: 1,
                min: 0.1,
                max: 5,
                step: 0.1,
                title: "Mousewheel Speed",
                hidden: (p) => !p.mouseWheel,
            },
            mouseWheelInvert: {
                type: ControlType.Boolean,
                defaultValue: false,
                title: "Invert Wheel Direction",
                hidden: (p) => !p.mouseWheel,
            },
            hoverPause: {
                type: ControlType.Boolean,
                defaultValue: true,
                title: "Pause on Hover",
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
                defaultValue: "rgba(0,0,0,0.9)",
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
                defaultValue: "rgba(0,0,0,0.9)",
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
                title: "Title Color",
            },
            infoDescColor: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.75)",
                title: "Description Color",
            },
            overlayBg: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.88)",
                title: "Lightbox Overlay BG",
            },
        },
    },
    titleTypography: {
        type: ControlType.Object,
        title: "Title Typography",
        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: 1,
                },
            },
            titleTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "uppercase",
                title: "Transform",
            },
            titleTextAlign: {
                type: ControlType.Enum,
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "center",
                title: "Text Align",
            },
        },
    },
    descTypography: {
        type: ControlType.Object,
        title: "Description Typography",
        controls: {
            descFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 12,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    letterSpacing: 2,
                },
            },
            descTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "uppercase",
                title: "Transform",
            },
            descTextAlign: {
                type: ControlType.Enum,
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "center",
                title: "Text Align",
            },
        },
    },
    overlayTypography: {
        type: ControlType.Object,
        title: "Overlay Typography",
        controls: {
            overlayTitleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 24,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: 0.3,
                },
            },
            overlayTitleTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "none",
                title: "Title Transform",
            },
            overlayDescFont: {
                type: ControlType.Font,
                title: "Description Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: 1.6,
                    letterSpacing: 0,
                },
            },
            overlayDescTextTransform: {
                type: ControlType.Enum,
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
                defaultValue: "none",
                title: "Description Transform",
            },
        },
    },
    overlayTextColors: {
        type: ControlType.Object,
        title: "Overlay Text Colors",
        controls: {
            overlayTitleColor: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Title Color",
            },
            overlayDescColor: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.85)",
                title: "Description Color",
            },
        },
    },
    controlBarColors: {
        type: ControlType.Object,
        title: "Control Bar Colors",
        controls: {
            controlBarBg: {
                type: ControlType.Color,
                defaultValue: "rgba(0,0,0,0.8)",
                title: "Bar Background",
            },
            controlBarBorder: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.1)",
                title: "Bar Border",
            },
            controlBtnText: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Button Text",
            },
            controlBtnHoverBg: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.15)",
                title: "Button Hover BG",
            },
            controlBtnActiveBg: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Active Button BG",
            },
            controlBtnActiveText: {
                type: ControlType.Color,
                defaultValue: "#000000",
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
                defaultValue: "rgba(0,0,0,0.8)",
                title: "Background",
            },
            autoplayFabHoverBg: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.15)",
                title: "Hover Background",
            },
            autoplayFabBorder: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.9)",
                title: "Border",
            },
            autoplayFabText: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Icon Color",
            },
            autoplayFabActiveBg: {
                type: ControlType.Color,
                defaultValue: "#ffffff",
                title: "Active Background",
            },
            autoplayFabActiveText: {
                type: ControlType.Color,
                defaultValue: "#000000",
                title: "Active Icon Color",
            },
        },
    },
})
