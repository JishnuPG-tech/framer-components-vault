import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
} from "react"
import { createPortal } from "react-dom"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger)
}

// ─── UTILITIES ───────────────────────────────────────────────────────
function getImageSrc(
    image?: string | { src?: string; srcSet?: string; alt?: string }
): string {
    if (!image) return ""
    if (typeof image === "string") return image
    return image.src || ""
}

function getVideoSrc(video?: string | { src?: string }): string {
    if (!video) return ""
    if (typeof video === "string") return video
    return video.src || ""
}

function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([^&?#]+)/,
        /youtube\.com\/shorts\/([^&?#]+)/,
    ]
    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) return match[1]
    }
    return null
}

function isYouTubeUrl(url: string): boolean {
    return extractYouTubeId(url) !== null
}

// Returns true when the given URL points to a different origin than the
// current page. Relative URLs, hash links, and same-origin absolute URLs
// are treated as internal.
function isExternalUrl(url?: string): boolean {
    if (!url) return false
    if (typeof window === "undefined") return false
    try {
        const parsed = new URL(url, window.location.href)
        return parsed.origin !== window.location.origin
    } catch {
        return false
    }
}

// ─── GALLERY SLIDES HELPER ───────────────────────────────────────────
const getSlides = (dish: MenuItem) => {
    const slides: { type: "image" | "video" | "youtube"; src: string }[] = []
    if (!dish) return slides

    const videoSrc = getVideoSrc(dish.videoFile) || getVideoSrc(dish.video)
    const isBgVideo = !!videoSrc && dish.videoDisplay === "background"

    if (isBgVideo) {
        slides.push({
            type: isYouTubeUrl(videoSrc) ? "youtube" : "video",
            src: videoSrc,
        })
    }

    if (dish.galleryImages?.length) {
        dish.galleryImages.forEach((src) => {
            slides.push({
                type: "image",
                src: typeof src === "string" ? src : getImageSrc(src),
            })
        })
    } else {
        slides.push({ type: "image", src: getImageSrc(dish.image) })
    }

    return slides
}

interface FontConfig {
    fontFamily?: string
    fontWeight?: number | string
    fontSize?: number | string
    textTransform?: React.CSSProperties["textTransform"]
    letterSpacing?: number | string
    lineHeight?: number | string
    textAlign?: React.CSSProperties["textAlign"]
}

function buildFontStyle(font: FontConfig = {}): React.CSSProperties {
    const s: React.CSSProperties = {}
    if (font.fontFamily) s.fontFamily = font.fontFamily
    if (font.fontWeight !== undefined && font.fontWeight !== null)
        s.fontWeight = font.fontWeight as React.CSSProperties["fontWeight"]
    if (font.fontSize !== undefined && font.fontSize !== null)
        s.fontSize = font.fontSize
    if (font.textTransform) s.textTransform = font.textTransform
    if (font.letterSpacing !== undefined && font.letterSpacing !== null)
        s.letterSpacing = font.letterSpacing
    if (font.lineHeight !== undefined && font.lineHeight !== null)
        s.lineHeight = font.lineHeight
    if (font.textAlign) s.textAlign = font.textAlign
    return s
}

const alignmentToFlex = (
    alignment: React.CSSProperties["textAlign"] = "left"
): React.CSSProperties["justifyContent"] => {
    if (alignment === "center") return "center"
    if (alignment === "right" || alignment === "end") return "flex-end"
    return "flex-start"
}

const COMPONENT_CSS = `
    .menu-container{
        position:relative;
        font-family:var(--ui-font-family, 'Inter', Arial, sans-serif);
        background:var(--page-bg);
        color:var(--primary-text);
        -webkit-font-smoothing:antialiased;
        min-height:100vh;
    }
    .roster{
        position:relative;
        width:90%;
        margin:auto;
        padding:100px 0 160px;
        display:flex;
        justify-content:space-between;
        gap:60px;
    }
    .showcase-panel{ width:32%; align-self:stretch; position:relative; }
    .profile-card{
        position:sticky;
        top:80px;
        background:var(--image-card-bg);
        border:1px solid var(--divider);
        padding:14px;
        overflow:hidden;
        display: flex;
        z-index:16;
        flex-direction: column;
    }
    .profile-card .media-frame{
        position:relative;
        overflow:hidden;
        aspect-ratio:4/5;
        background:var(--page-bg);
    }
    .parallax-track{
        position:absolute;
        left:0; right:0;
        top:-7%;
        height:114%;
        z-index:1;
        pointer-events:none;
    }
    .slide-layer{
        position:absolute;
        inset:0;
        clip-path:inset(0% 0% 0% 0%);
        opacity:0;
        z-index:1;
        pointer-events:none;
    }
    #slideA{ opacity:1; z-index:2; }
    .slide-layer .media-wrapper{
        position:absolute;
        left:0; top:-25%;
        width:100%; height:150%;
        pointer-events:none;
    }
    .gallery-img, .gallery-video, .gallery-iframe{
        position:absolute;
        inset:0;
        width:100%; height:100%;
        object-fit:cover;
        display:block;
        filter:saturate(1.05) contrast(1.02);
        opacity:0;
        transition: opacity 1.2s ease-in-out;
        pointer-events:none;
    }
    .gallery-img.active, .gallery-video.active, .gallery-iframe.active{ opacity:1; }

    .gallery-pagination {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 100;
        pointer-events: auto;
        background: var(--pager-bg, rgba(0, 0, 0, 0.35));
        padding: 8px 14px;
        border-radius: 30px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .gallery-pagination.top { bottom: auto; top: 20px; }
    .gallery-dot {
        position: relative;
        width: 8px;
        height: 8px;
        border-radius: 10px;
        background: var(--pager-dot, rgba(255, 255, 255, 0.3));
        cursor: pointer;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
        overflow: hidden;
        pointer-events: auto;
    }
    .gallery-dot.active {
        width: 32px;
        background: var(--pager-active, rgba(255, 255, 255, 0.15));
    }
    .gallery-dot-progress {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 0%;
        background: var(--pager-progress, var(--highlight));
        border-radius: 10px;
        pointer-events: none;
        animation: dotProgress 3s linear forwards;
    }
    @keyframes dotProgress { from { width: 0%; } to { width: 100%; } }

    .profile-meta{
        margin-top:20px;
        padding:0 4px 6px;
        overflow:hidden;
        display:flex;
        align-items:baseline;
        justify-content:space-between;
        gap:12px;
    }
    .profile-meta h3{
        font-family:var(--ui-font-family, 'Inter', sans-serif);
        font-weight:500;
        font-size:19px;
        letter-spacing:.01em;
        margin-bottom:4px;
        color:var(--primary-text);
    }
    .profile-meta p{
        color:var(--secondary-text);
        font-size:13px;
        font-weight:300;
    }
    .profile-meta .price-tag{
        font-family:var(--ui-font-family, 'Inter', sans-serif);
        font-size:19px;
        color:var(--highlight);
        white-space:nowrap;
    }
    .cta-button{
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        margin-top: 20px;
        padding: 16px;
        background: var(--highlight);
        color: var(--page-bg);
        font-family: var(--ui-font-family, 'Inter', sans-serif);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        text-decoration: none;
        transition: transform 0.3s ease, background 0.3s ease, color 0.3s ease, border-color 0.3s ease, filter 0.3s ease;
        border: none;
        cursor: pointer;
    }
    .cta-button:hover{
        transform: translateY(-2px);
        background: var(--primary-text);
        color: var(--page-bg);
    }
    .cta-button.cta-custom {
        background: var(--cta-bg);
        color: var(--cta-color);
        border-width: var(--cta-border-width);
        border-style: solid;
        border-color: var(--cta-border-color);
        border-radius: var(--cta-border-radius);
    }
    .cta-button.cta-custom:hover {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }
    .cta-button svg{ width: 14px; height: 14px; transition: transform 0.3s ease; }
    .cta-button:hover svg{ transform: translateX(4px); }

    .list-panel{ width:56%; position:relative; }
    .search-container { position: relative; margin-bottom: 20px; z-index: 15; }
    .search-input-wrapper { position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 16px; color: var(--secondary-text); width: 16px; height: 16px; pointer-events: none; }
    .search-input {
        width: 100%;
        background: var(--image-card-bg);
        border: 1px solid var(--divider);
        color: var(--primary-text);
        padding: 12px 16px 12px 44px;
        font-family: var(--ui-font-family, 'Inter', sans-serif);
        font-size: 13px;
        outline: none;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .search-input:focus { border-color: var(--highlight); box-shadow: 0 0 0 2px rgba(193, 104, 63, 0.15); }
    .search-input::placeholder { color: var(--secondary-text); opacity: 0.7; }
    .visually-hidden { position:absolute !important; width:1px !important; height:1px !important; padding:0 !important; margin:-1px !important; overflow:hidden !important; clip:rect(0,0,0,0) !important; clip-path:inset(50%) !important; white-space:nowrap !important; border:0 !important; }
    .autocomplete-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: var(--image-card-bg);
        border: 1px solid var(--divider);
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transform: translateY(-10px);
        transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, transform 0.3s ease;
        z-index: 20;
        box-shadow: 0 15px 40px rgba(0,0,0,0.4);
    }
    .autocomplete-dropdown.open { max-height: 320px; opacity: 1; transform: translateY(0); overflow-y: auto; }
    
    .autocomplete-item {
        appearance: none;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.2s ease;
        border-bottom: 1px solid var(--divider);
        font-family: inherit;
        font-size: inherit;
        color: inherit;
    }
    .autocomplete-item:last-child { border-bottom: none; }
    .autocomplete-item:hover { background: rgba(255,255,255,0.05); }
    .autocomplete-item:focus-visible {
        outline: 2px solid var(--highlight);
        outline-offset: -2px;
    }
    
    .autocomplete-thumb { width: 40px; height: 40px; object-fit: cover; flex-shrink: 0; background: var(--page-bg); }
    .autocomplete-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .autocomplete-name { font-family: var(--ui-font-family, 'Inter', sans-serif); font-size: 15px; color: var(--primary-text); line-height: 1.2; }
    .autocomplete-meta { font-family: var(--ui-font-family, 'Inter', sans-serif); font-size: 11px; color: var(--secondary-text); display: flex; gap: 8px; }
    .autocomplete-price { color: var(--highlight); font-weight: 500; }

    .filter-bar-container { position: sticky; top: 0; z-index: 1; background: var(--page-bg); padding: 15px 0; border-bottom: 1px solid var(--divider); }
    .filter-bar { display: flex; gap: 10px; flex-wrap: wrap; }
    .filter-bar-label { font-family: var(--ui-font-family, 'Inter', sans-serif); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--secondary-text); margin-right: 8px; align-self: center; }
    .filter-btn { background: transparent; border: 1px solid var(--divider); color: var(--secondary-text); padding: 8px 18px; font-family: var(--ui-font-family, 'Inter', sans-serif); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.3s ease; }
    .filter-btn:hover { border-color: var(--primary-text); color: var(--primary-text); }
    .filter-btn.active { background: var(--highlight); border-color: var(--highlight); color: var(--page-bg); }

    .category-section { margin-bottom: 40px; }
    .category-header { position: sticky; top: var(--filter-bar-height, 120px); z-index: 5; background: var(--page-bg); padding: 25px 0 15px; margin: 0; color: var(--primary-text); border-bottom: 1px solid var(--divider); display: flex; align-items: center; gap: 15px; }
    .category-header::before { content: "—"; color: var(--highlight); font-size: 24px; }

    .cursor-indicator{ position:absolute; left:-44px; top:0; width:32px; height:32px; opacity:0; pointer-events:none; color:var(--cursor-color, var(--primary-text)); will-change:transform; }
    .cursor-indicator svg{ width:100%; height:100%; display:block; }

    .entry-item{
        display:flex;
        flex-wrap:wrap;
        align-items:flex-start;
        gap:0;
        padding:24px 22px;
        margin-bottom:12px;
        border:var(--menu-card-border-width) solid var(--menu-card-border-color);
        background:var(--menu-card-background);
        cursor:pointer;
        user-select:none;
        position:relative;
        transition:background .25s ease, border-color .25s ease, transform .25s ease, box-shadow .25s ease, opacity .4s ease, max-height .5s cubic-bezier(0.4, 0, 0.2, 1), margin .5s cubic-bezier(0.4, 0, 0.2, 1), padding .5s cubic-bezier(0.4, 0, 0.2, 1), border-width .5s cubic-bezier(0.4, 0, 0.2, 1);
        overflow:hidden;
        scroll-margin-top:var(--sticky-offset, 200px);
    }
    .entry-item::before{
        content:"";
        position:absolute;
        left:0;
        top:18px;
        bottom:18px;
        width:var(--menu-card-accent-width);
        background:var(--menu-card-accent-color);
        transform:scaleY(0);
        transform-origin:center;
        transition:transform .25s ease;
    }
    .entry-item:hover{
        background:var(--menu-card-hover-background);
        border-color:var(--menu-card-hover-border-color);
        transform:translateY(-2px);
        box-shadow:0 14px 34px rgba(0,0,0,.12);
    }
    .entry-item:hover::before{
        transform:scaleY(1);
        background:var(--menu-card-hover-accent-color);
        width:var(--menu-card-hover-accent-width);
    }
    .entry-item.active::before{
        transform:scaleY(1);
        background:var(--menu-card-active-accent-color);
        width:var(--menu-card-active-accent-width);
    }
    .entry-item.active{
        background:var(--menu-card-active-background);
        border-color:var(--menu-card-active-border-color);
        box-shadow:var(--menu-card-active-shadow);
        transform:translateY(var(--menu-card-active-lift));
    }
    .entry-item:focus-visible{ outline:2px solid var(--highlight); outline-offset:3px; }
    .entry-item.is-hidden{ max-height:0 !important; opacity:0 !important; margin-top:0 !important; margin-bottom:0 !important; padding-top:0 !important; padding-bottom:0 !important; border-width:0 !important; pointer-events:none; }

    .entry-header{
        display:grid;
        grid-template-columns:max-content minmax(0,1fr) max-content;
        grid-template-areas:"number content price";
        align-items:start;
        column-gap:16px;
        width:100%;
        min-width:0;
        position:relative;
    }
    .entry-header.no-counter{
        grid-template-columns:minmax(0,1fr) max-content;
        grid-template-areas:"content price";
    }
    .entry-item.no-counter .entry-desc{ padding-left:0; }
    .entry-num{
        grid-area:number;
        align-self:start;
        margin-top:.08em;
        font-family:var(--ui-font-family, 'Inter', sans-serif);
        font-size:11px;
        font-weight:600;
        color:var(--counter-text-color);
        letter-spacing:.08em;
        min-width:var(--counter-min-width);
        min-height:var(--counter-min-height);
        display:inline-flex;
        align-items:center;
        justify-content:center;
        box-sizing:border-box;
        width:var(--counter-width);
        height:var(--counter-height);
        background:var(--counter-bg);
        border:var(--counter-border-width) solid var(--counter-border-color);
        border-radius:var(--counter-border-radius);
        padding:var(--counter-padding);
        line-height:1;
        transition:color .25s ease, background .25s ease, border-color .25s ease;
    }
    .entry-title-region{
        grid-area:content;
        min-width:0;
        display:flex;
        flex-direction:column;
        align-items:flex-start;
    }
    .entry-name{
        width:100%;
        min-width:0;
        margin:0;
        overflow-wrap:anywhere;
        font-family:var(--ui-font-family, 'Inter', sans-serif);
        font-weight:500;
        font-size:clamp(28px,3.2vw,46px);
        line-height:1.08;
        letter-spacing:-.025em;
        color:var(--entry-name-color);
        transition:color .25s ease, transform .25s ease;
        display:flex;
        align-items:baseline;
        gap:10px;
        flex-wrap:wrap;
    }
    .entry-price{
        grid-area:price;
        align-self:start;
        justify-self:end;
        max-width:100%;
        white-space:nowrap;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        box-sizing:border-box;
        font-family:var(--ui-font-family, 'Inter', sans-serif);
        font-weight:600;
        font-size:14px;
        line-height:1;
        letter-spacing:.01em;
        color:var(--entry-price-color);
        background:var(--price-bg);
        border:var(--price-border-width) solid var(--price-border-color);
        border-radius:var(--price-border-radius);
        padding:var(--price-padding-y) var(--price-padding-x);
        transition:color .25s ease, background .25s ease, border-color .25s ease, transform .25s ease;
    }
    .entry-item:hover .entry-price{ transform:translateY(-1px); }
    .dietary-tags{ display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; max-width:100%; }
    .entry-select-button{ appearance:none; border:0; background:transparent; color:var(--secondary-text); padding:0; margin-top:12px; font:inherit; font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; }
    .entry-select-button:hover{ color:var(--primary-text); }
    .entry-select-button:focus-visible{ outline:2px solid var(--highlight); outline-offset:3px; }
    .entry-desc{ width:100%; padding-left:calc(16px + var(--counter-min-width)); margin-top:14px; font-family:var(--ui-font-family, 'Inter', sans-serif); font-weight:400; font-size:13px; line-height:1.65; color:var(--secondary-text); letter-spacing:.005em; max-height:0; opacity:0; overflow:hidden; transform:translateY(-6px); transition:color .25s ease; will-change:transform, opacity, max-height; }
    .entry-desc .desc-accent{ display:inline-block; width:18px; height:1px; background:var(--highlight); vertical-align:middle; margin-right:9px; transform-origin:left center; }

    .entry-item.active .entry-name{ color:var(--menu-card-active-title-color); }
    .entry-item.active .entry-desc{ color:var(--menu-card-active-description-color); }
    .entry-item.active .entry-price{
        color:var(--menu-card-active-price-color);
        background:var(--menu-card-active-price-background);
        border-color:var(--menu-card-active-price-border-color);
    }

    .dietary-tag{ appearance:none; display:inline-flex; align-items:center; justify-content:center; font-family:var(--ui-font-family, 'Inter', sans-serif); font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:5px 8px; line-height:1; border:1px solid; cursor:pointer; transition:transform .2s ease, background .2s ease, border-color .2s ease; box-sizing:border-box; min-width:26px; min-height:24px; }
    .dietary-tag:hover{ transform:translateY(-1px); }
    .dietary-tag:focus-visible{ outline:2px solid var(--highlight); outline-offset:3px; }
    .dietary-tag.gf{ color:var(--gf-tag); border-color:rgba(111,185,138,.3); background:rgba(111,185,138,.08); }
    .dietary-tag.v{ color:var(--v-tag); border-color:rgba(122,168,214,.3); background:rgba(122,168,214,.08); }
    .dietary-tag.spicy{ color:var(--spicy-tag); border-color:rgba(217,122,108,.3); background:rgba(217,122,108,.08); }
    .dietary-tag.df{ color:#c9a86a; border-color:rgba(201,168,106,.3); background:rgba(201,168,106,.08); }

    .chefs-pick{ position:static; display:inline-flex; align-items:center; align-self:flex-start; margin-bottom:10px; background:var(--chef-pick); color:var(--page-bg); font-family:var(--ui-font-family, 'Inter', sans-serif); font-size:9px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; padding:6px 10px; line-height:1; z-index:2; }

    .entry-item.sold-out{ cursor:default; }
    .entry-item.sold-out:hover{ transform:none; box-shadow:none; }
    .entry-item.sold-out .entry-price{ font-style:italic; }


    .allergen-note{ width:90%; max-width:700px; margin:0 auto 60px; text-align:center; padding:24px 20px; border-top:1px solid var(--divider); }
    .allergen-note p{ font-size:12px; color:var(--secondary-text); line-height:1.7; font-weight:300; }
    .allergen-note .allergen-icon{ display:inline-block; margin-right:6px; color:var(--chef-pick); }

    .skeleton{ background:linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%); background-size:200% 100%; animation:skeletonLoading 1.5s ease-in-out infinite; }
    @keyframes skeletonLoading{ 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
    .skeleton-image{ width:100%; aspect-ratio:4/5; }
    .skeleton-text{ height:16px; margin-bottom:8px; }
    .skeleton-text.short{ width:60%; }

    .profile-card{ border-radius:var(--card-radius); }
    .profile-card .media-frame{ border-radius:max(0px, calc(var(--card-radius) - 4px)); }
    .entry-item{ border-radius:var(--list-radius); }
    .dietary-tag{ border-radius:max(0px, calc(var(--list-radius) - 1px)); }
    .chefs-pick{ border-radius:max(0px, calc(var(--list-radius) - 2px)); }
    .skeleton{ border-radius:max(0px, calc(var(--list-radius) - 1px)); }
    .skeleton-image{ border-radius:max(0px, calc(var(--card-radius) - 4px)); }
    .cta-button{ border-radius:var(--list-radius); }
    .filter-btn{ border-radius:calc(var(--list-radius) + 10px); }
    .search-input{ border-radius:var(--list-radius); }
    .autocomplete-dropdown{ border-radius:var(--list-radius); }
    .autocomplete-thumb{ border-radius:max(0px, calc(var(--list-radius) - 2px)); }

    @media(max-width:900px){
        .roster{ width:94%; padding:60px 0 100px; gap:24px; }
        .profile-card{ top:20px; padding:10px; }
        .profile-meta{ margin-top:14px; padding:0 2px 4px; }
        .profile-meta h3{ font-size:15px; }
        .profile-meta p{ font-size:12px; }
        .profile-meta .price-tag{ font-size:15px; }
        .showcase-panel{ width:40%; }
        .list-panel{ width:56%; }
        .entry-item{ padding:20px 18px; margin-bottom:10px; }
        .entry-num{ font-size:11px; min-width:18px; }
        .entry-name{ font-size:28px; }
        .entry-price{ font-size:14px; }
        .entry-desc{ padding-left:calc(14px + var(--counter-min-width)); font-size:12px; margin-top:12px; }
        .cursor-indicator{ width:20px; height:20px; left:-26px; }
        .category-header { top: var(--filter-bar-height, 110px); }
        .chefs-pick{ font-size:8px; padding:3px 6px; top:8px; }
        .search-input { font-size: 14px; padding: 14px 16px 14px 44px; }
        .autocomplete-name { font-size: 14px; }
    }
    @media(max-width:480px){
        .roster{ width:90%; padding:10px 0 40px; gap:20px; }
        .profile-card{ padding:8px; top:5px; }
        .profile-meta h3{ font-size:16px; }
        .profile-meta p{ font-size:12px; }
        .profile-meta .price-tag{ font-size:16px; }
        .entry-name{ font-size:18px; }
        .entry-price{ font-size:14px; }
        .entry-num{ font-size:11px; min-width:20px; }
        .entry-desc{ font-size:12px; padding-left:32px; }
        .entry-item{ padding:18px 16px; }
        .category-header { top: var(--filter-bar-height, 100px); }
        .chefs-pick{ display:inline-flex; }
    }
    @media(prefers-reduced-motion:reduce){ .entry-item,.entry-name,.entry-num,.entry-price,.entry-desc{ transition:none; } }

    .menu-container.is-mobile .roster{ flex-direction:column; gap:30px; width:92%; padding:20px 0 60px; }
.menu-container.is-mobile .showcase-panel{
    width:100%;
    max-width:400px;
    margin:0 auto;
    align-self:center;
    position:static;
    top:auto;
    z-index:auto;
}
    .menu-container.is-mobile .list-panel{ width:100%; }
.menu-container.is-mobile .profile-card{
    position:static;
    top:auto;
    padding:12px;
}
    .menu-container.is-mobile .media-frame, .menu-container.is-mobile .skeleton-image{ aspect-ratio:16/10; }
    .menu-container.is-mobile .entry-item{ padding:18px 16px; margin-bottom:10px; }
    .menu-container.is-mobile .entry-header{
        grid-template-columns:max-content minmax(0, 1fr) max-content;
        grid-template-areas:"number content price";
        align-items:start;
        column-gap:12px;
        row-gap:8px;
        width:100%;
        min-width:0;
    }
    .menu-container.is-mobile .entry-header.no-counter{
        grid-template-columns:minmax(0, 1fr) max-content;
        grid-template-areas:"content price";
    }
    .menu-container.is-mobile .entry-num{ font-size:12px; min-width:0; margin-top:.12em; }
    .menu-container.is-mobile .entry-name{
        font-size:24px;
        min-width:0;
        overflow-wrap:anywhere;
    }
    .menu-container.is-mobile .entry-price{
        font-size:16px;
        flex-shrink:0;
        justify-self:end;
        max-width:100%;
    }
    .menu-container.is-mobile .entry-desc{ padding-left:calc(12px + var(--counter-min-width)); font-size:13px; margin-top:12px; line-height:1.55; }
    .menu-container.is-mobile .cursor-indicator{ display:none; }
    .menu-container.is-mobile .category-header { position: relative; top: 0; }
    .menu-container.is-mobile .filter-bar-container { position: relative; top: 0; }
    .menu-container.is-mobile .chefs-pick{ font-size:8px; padding:4px 8px; }
    .menu-container.is-mobile .dietary-tag{ font-size:9px; padding:2px 5px; }
    .menu-container.is-mobile .allergen-note p{ font-size:13px; line-height:1.6; }
    @media(max-width:420px){
        .menu-container.is-mobile .entry-header{
            grid-template-columns:max-content minmax(0, 1fr);
            grid-template-areas:
                "number content"
                ". price";
            column-gap:10px;
            row-gap:10px;
        }
        .menu-container.is-mobile .entry-header.no-counter{
            grid-template-columns:minmax(0, 1fr);
            grid-template-areas:
                "content"
                "price";
        }
        .menu-container.is-mobile .entry-price{
            justify-self:start;
        }
        .menu-container.is-mobile .entry-desc{
            padding-left:0;
        }
    }
    @media(max-width:360px){
        .menu-container.is-mobile .entry-header{ column-gap:8px; }
        .menu-container.is-mobile .entry-name{ font-size:20px; }
        .menu-container.is-mobile .entry-price{ font-size:14px; }
    }

    .lightbox-open-button {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255,255,255,0.28);
        border-radius: 50%;
        background: rgba(0,0,0,0.48);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 120;
        padding: 0;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.24);
        transition: transform .2s ease, background .2s ease, border-color .2s ease;
    }
    .lightbox-open-button:hover { transform: scale(1.08); background: rgba(0,0,0,0.7); border-color: rgba(255,255,255,0.55); }
    .lightbox-open-button:focus-visible { outline: 2px solid var(--highlight); outline-offset: 3px; }

    .sold-out-badge { position: absolute; top: 15px; left: 15px; background: rgba(0, 0, 0, 0.75); color: var(--primary-text); font-family: var(--ui-font-family, 'Inter', sans-serif); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 12px; z-index: 5; border: 1px solid var(--divider); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border-radius: 2px; pointer-events: none; }
    .custom-tooltip { position: absolute; transform: translate(-50%, -100%); font-family: var(--ui-font-family, 'Inter', sans-serif); font-size: 11px; font-weight: 500; letter-spacing: 0.02em; padding: 6px 12px; border-radius: 4px; white-space: nowrap; z-index: 9999; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }

    /* Framer Canvas/export: preserve the full layout but freeze every effect. */
    .menu-container.is-static-renderer *,
    .menu-container.is-static-renderer *::before,
    .menu-container.is-static-renderer *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
    }
    .menu-container.is-static-renderer .parallax-track {
        top: 0 !important;
        height: 100% !important;
        transform: none !important;
    }
    .menu-container.is-static-renderer .slide-layer,
    .menu-container.is-static-renderer .slide-layer .media-wrapper {
        transform: none !important;
        clip-path: none !important;
    }
    .menu-container.is-static-renderer .gallery-dot-progress { width: 100% !important; }
`

// ─── FOCUS TRAP & VIDEO MODAL ──────────────────────────────────────
function useFocusTrap(
    containerRef: React.RefObject<HTMLDivElement | null>,
    enabled = true
) {
    useEffect(() => {
        if (!enabled || !containerRef.current) return
        const container = containerRef.current
        const previouslyFocused = document.activeElement as HTMLElement | null
        const getFocusable = () =>
            Array.from(
                container.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])'
                )
            )
        const focusables = getFocusable()
        ;(focusables[0] || container).focus()
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return
            const items = getFocusable()
            if (items.length === 0) return
            const first = items[0],
                last = items[items.length - 1]
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        }
        container.addEventListener("keydown", handleKeyDown)
        return () => {
            container.removeEventListener("keydown", handleKeyDown)
            previouslyFocused?.focus?.()
        }
    }, [containerRef, enabled])
}

function VideoModal({
    videoUrl,
    onClose,
    fontFamily = "Inter",
}: {
    videoUrl: string
    onClose: () => void
    fontFamily?: string
}) {
    const backdropRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isYouTube = isYouTubeUrl(videoUrl)
    const youtubeId = extractYouTubeId(videoUrl)
    useFocusTrap(backdropRef, !isStatic)
    useEffect(() => {
        if (isStatic) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [isStatic, onClose])

    if (isStatic) {
        return (
            <div
                aria-label="Static video preview"
                style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    background: "#000",
                    borderRadius: 16,
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontFamily,
                    fontSize: 13,
                }}
            >
                Video preview
            </div>
        )
    }

    return (
        <div
            ref={backdropRef}
            onClick={(e) => {
                if (e.target === backdropRef.current) onClose()
            }}
            role="dialog"
            aria-modal="true"
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 99999,
                padding: 24,
                cursor: "pointer",
                fontFamily,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 900,
                    aspectRatio: "16 / 9",
                    backgroundColor: "#000",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                    cursor: "default",
                }}
            >
                {isYouTube && youtubeId ? (
                    <iframe
                        title="Video player"
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            display: "block",
                        }}
                    />
                ) : (
                    <video
                        src={videoUrl}
                        controls
                        autoPlay
                        playsInline
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                )}
                <button
                    onClick={onClose}
                    aria-label="Close video"
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: "rgba(0, 0, 0, 0.6)",
                        border: "none",
                        borderRadius: "50%",
                        width: 40,
                        height: 40,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        zIndex: 10,
                    }}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

function LightboxGallery({
    slides,
    initialIndex,
    title,
    onClose,
    showThumbnails = true,
    animationDuration = 0.42,
    overlayColor = "rgba(0,0,0,0.9)",
    cursorSize = 58,
    closeOnBackdropClick = true,
    fontFamily = "Inter",
}: {
    slides: { type: "image" | "video" | "youtube"; src: string }[]
    initialIndex: number
    title?: string
    onClose: () => void
    showThumbnails?: boolean
    animationDuration?: number
    overlayColor?: string
    cursorSize?: number
    closeOnBackdropClick?: boolean
    fontFamily?: string
}) {
    const backdropRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const panelRef = useRef<HTMLDivElement>(null)
    const mediaRef = useRef<HTMLDivElement>(null)
    const imageStageRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const thumbnailsRef = useRef<HTMLDivElement>(null)
    const closeCursorRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const pointersRef = useRef(new Map<number, { x: number; y: number }>())
    const gestureStartRef = useRef<{
        x: number
        y: number
        time: number
    } | null>(null)
    const dragStartRef = useRef<{
        x: number
        y: number
        panX: number
        panY: number
    } | null>(null)
    const pinchRef = useRef<{ distance: number; zoom: number } | null>(null)
    const zoomRef = useRef(1)
    const panRef = useRef({ x: 0, y: 0 })
    const isClosingRef = useRef(false)
    const [showCloseCursor, setShowCloseCursor] = useState(false)
    const [mediaStatus, setMediaStatus] = useState<
        "loading" | "loaded" | "error"
    >("loading")
    const [zoomDisplay, setZoomDisplay] = useState(1)
    const [index, setIndex] = useState(() =>
        Math.min(Math.max(initialIndex, 0), Math.max(slides.length - 1, 0))
    )
    const slide = slides[index]
    useFocusTrap(backdropRef, !isStatic)

    const prefersReducedMotion = () =>
        isStatic ||
        (typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches)

    const stopActiveMedia = useCallback(() => {
        const video = videoRef.current
        if (video) video.pause()
        mediaRef.current
            ?.querySelectorAll("video")
            .forEach((item) => item.pause())
        mediaRef.current?.querySelectorAll("iframe").forEach((frame) => {
            const current = frame.src
            frame.src = "about:blank"
            requestAnimationFrame(() => {
                if (frame.isConnected) frame.src = current
            })
        })
    }, [])

    const clampPan = useCallback((x: number, y: number, zoom: number) => {
        const stage = imageStageRef.current
        if (!stage || zoom <= 1) return { x: 0, y: 0 }
        const maxX = (stage.clientWidth * (zoom - 1)) / 2
        const maxY = (stage.clientHeight * (zoom - 1)) / 2
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
        }
    }, [])

    const applyImageTransform = useCallback(
        (
            zoom = zoomRef.current,
            x = panRef.current.x,
            y = panRef.current.y,
            animate = false
        ) => {
            const image = imageRef.current
            if (!image) return
            const nextZoom = Math.max(1, Math.min(4, zoom))
            const nextPan = clampPan(x, y, nextZoom)
            zoomRef.current = nextZoom
            panRef.current = nextPan
            setZoomDisplay(Number(nextZoom.toFixed(2)))
            gsap.to(image, {
                scale: nextZoom,
                x: nextPan.x,
                y: nextPan.y,
                duration: animate && !prefersReducedMotion() ? 0.42 : 0,
                ease: animate ? "back.out(1.45)" : "none",
                overwrite: true,
                transformOrigin: "50% 50%",
            })
        },
        [clampPan]
    )

    const resetZoom = useCallback((animate = false) => {
        panRef.current = { x: 0, y: 0 }
        zoomRef.current = 1
        setZoomDisplay(1)
        if (imageRef.current) {
            gsap.to(imageRef.current, {
                scale: 1,
                x: 0,
                y: 0,
                duration: animate && !prefersReducedMotion() ? 0.35 : 0,
                ease: "power3.out",
                overwrite: true,
            })
        }
    }, [])

    const goTo = useCallback(
        (nextIndex: number) => {
            if (!slides.length) return
            stopActiveMedia()
            resetZoom(false)
            setMediaStatus("loading")
            setIndex((nextIndex + slides.length) % slides.length)
        },
        [slides.length, stopActiveMedia, resetZoom]
    )

    const previous = useCallback(() => goTo(index - 1), [goTo, index])
    const next = useCallback(() => goTo(index + 1), [goTo, index])

    const requestClose = useCallback(() => {
        if (isClosingRef.current) return
        isClosingRef.current = true
        stopActiveMedia()
        if (
            prefersReducedMotion() ||
            !backdropRef.current ||
            !panelRef.current
        ) {
            onClose()
            return
        }
        gsap.timeline({ onComplete: onClose })
            .to(panelRef.current, {
                opacity: 0,
                scale: 0.82,
                y: 44,
                filter: "blur(18px)",
                duration: Math.min(animationDuration * 0.8, 0.38),
                ease: "power3.in",
            })
            .to(
                backdropRef.current,
                {
                    opacity: 0,
                    backdropFilter: "blur(0px)",
                    duration: Math.min(animationDuration * 0.72, 0.32),
                    ease: "power2.inOut",
                },
                0.04
            )
    }, [animationDuration, onClose, stopActiveMedia])

    const handleOverlayPointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (
                event.pointerType === "touch" ||
                window.matchMedia("(pointer: coarse)").matches
            )
                return
            const direct = event.target === backdropRef.current
            setShowCloseCursor(direct)
            if (direct && closeCursorRef.current) {
                gsap.to(closeCursorRef.current, {
                    x: event.clientX,
                    y: event.clientY,
                    duration: 0.16,
                    ease: "power2.out",
                    overwrite: true,
                })
            }
        },
        []
    )

    useEffect(() => {
        if (isStatic) return
        const candidates = [
            slides[(index - 1 + slides.length) % slides.length],
            slides[(index + 1) % slides.length],
        ]
        candidates.forEach((item) => {
            if (!item?.src) return
            if (item.type === "image") {
                const image = new Image()
                image.decoding = "async"
                image.src = item.src
                image.decode?.().catch(() => undefined)
            } else if (item.type === "youtube") {
                const id = extractYouTubeId(item.src)
                if (id)
                    new Image().src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
            } else {
                const video = document.createElement("video")
                video.preload = "metadata"
                video.src = item.src
            }
        })
    }, [index, isStatic, slides])

    useEffect(() => {
        if (
            isStatic ||
            prefersReducedMotion() ||
            !backdropRef.current ||
            !panelRef.current
        )
            return
        gsap.set(backdropRef.current, {
            opacity: 0,
            backdropFilter: "blur(0px)",
        })
        gsap.set(panelRef.current, {
            opacity: 0,
            scale: 0.8,
            y: 52,
            filter: "blur(22px)",
        })
        const timeline = gsap
            .timeline()
            .to(backdropRef.current, {
                opacity: 1,
                backdropFilter: "blur(14px)",
                duration: animationDuration * 0.8,
                ease: "power2.out",
            })
            .to(
                panelRef.current,
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    filter: "blur(0px)",
                    duration: animationDuration * 1.35,
                    ease: "back.out(1.5)",
                    clearProps: "filter",
                },
                0.04
            )
        if (showThumbnails && thumbnailsRef.current) {
            timeline.fromTo(
                thumbnailsRef.current.children,
                { opacity: 0, y: 16, scale: 0.92 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: animationDuration * 0.75,
                    stagger: 0.035,
                    ease: "back.out(1.7)",
                },
                animationDuration * 0.48
            )
        }
        return () => timeline.kill()
    }, [animationDuration, isStatic, showThumbnails])

    useEffect(() => {
        if (isStatic) return
        resetZoom(false)
        pointersRef.current.clear()
        pinchRef.current = null
        const media = mediaRef.current
        if (prefersReducedMotion() || !media) return
        const animation = gsap.fromTo(
            media,
            {
                opacity: 0,
                scale: 0.9,
                filter: "blur(16px)",
                x: 28,
            },
            {
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
                x: 0,
                duration: animationDuration * 1.05,
                ease: "back.out(1.35)",
                clearProps: "filter,transform",
            }
        )
        return () => animation.kill()
    }, [animationDuration, index, isStatic, resetZoom])

    useEffect(() => {
        if (isStatic) return
        const activeThumbnail = thumbnailsRef.current?.querySelector(
            `[data-thumbnail-index="${index}"]`
        ) as HTMLElement | null
        activeThumbnail?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        })
    }, [index, isStatic])

    useEffect(() => {
        if (isStatic) return
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") requestClose()
            if (event.key === "ArrowLeft" && zoomRef.current === 1) previous()
            if (event.key === "ArrowRight" && zoomRef.current === 1) next()
            if (event.key === "0") resetZoom(true)
            if (
                (event.key === "+" || event.key === "=") &&
                slide?.type === "image"
            )
                applyImageTransform(
                    zoomRef.current + 0.5,
                    panRef.current.x,
                    panRef.current.y,
                    true
                )
            if (event.key === "-" && slide?.type === "image")
                applyImageTransform(
                    zoomRef.current - 0.5,
                    panRef.current.x,
                    panRef.current.y,
                    true
                )
        }
        window.addEventListener("keydown", handleKey)
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            stopActiveMedia()
            window.removeEventListener("keydown", handleKey)
            document.body.style.overflow = previousOverflow
        }
    }, [
        applyImageTransform,
        isStatic,
        next,
        previous,
        requestClose,
        resetZoom,
        slide?.type,
        stopActiveMedia,
    ])

    if (!slide || typeof document === "undefined") return null
    if (isStatic) {
        const previewSrc =
            slide.type === "image"
                ? slide.src
                : slide.type === "youtube"
                  ? (() => {
                        const id = extractYouTubeId(slide.src)
                        return id
                            ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                            : ""
                    })()
                  : ""
        return (
            <div
                aria-label={`${title || "Gallery"} static preview`}
                style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    overflow: "hidden",
                    borderRadius: 16,
                    background: "#090909",
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontFamily,
                    fontSize: 13,
                }}
            >
                {previewSrc ? (
                    <img
                        src={previewSrc}
                        alt={title || "Gallery preview"}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    "Media preview"
                )}
            </div>
        )
    }
    const youtubeId =
        slide.type === "youtube" ? extractYouTubeId(slide.src) : null
    const mediaLabel =
        slide.type === "image"
            ? "Image"
            : slide.type === "youtube"
              ? "YouTube video"
              : "Video"

    const renderThumbnail = (
        item: { type: "image" | "video" | "youtube"; src: string },
        thumbnailIndex: number
    ) => {
        const itemYoutubeId =
            item.type === "youtube" ? extractYouTubeId(item.src) : null
        const active = thumbnailIndex === index
        return (
            <button
                key={`${item.type}-${item.src}-${thumbnailIndex}`}
                type="button"
                data-thumbnail-index={thumbnailIndex}
                onClick={() => goTo(thumbnailIndex)}
                aria-label={`Open ${item.type} ${thumbnailIndex + 1}`}
                aria-current={active ? "true" : undefined}
                style={{
                    position: "relative",
                    width: "clamp(48px, 13vw, 76px)",
                    height: "clamp(38px, 9vw, 58px)",
                    flex: "0 0 auto",
                    padding: 0,
                    overflow: "hidden",
                    borderRadius: 8,
                    border: active
                        ? "2px solid #fff"
                        : "1px solid rgba(255,255,255,.24)",
                    background: "rgba(255,255,255,.08)",
                    cursor: "pointer",
                    opacity: active ? 1 : 0.64,
                    transform: active ? "scale(1)" : "scale(.94)",
                    transition:
                        "opacity .22s ease, transform .28s cubic-bezier(.2,.8,.2,1), border-color .22s ease",
                    scrollSnapAlign: "center",
                }}
            >
                {item.type === "image" ? (
                    <img
                        src={item.src}
                        alt=""
                        loading="lazy"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : item.type === "youtube" && itemYoutubeId ? (
                    <img
                        src={`https://i.ytimg.com/vi/${itemYoutubeId}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontSize: 10,
                            background:
                                "linear-gradient(135deg,#292929,#0b0b0b)",
                        }}
                    >
                        VIDEO
                    </span>
                )}
                {item.type !== "image" && (
                    <span
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(0,0,0,.2)",
                        }}
                    >
                        <span
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(0,0,0,.68)",
                                color: "#fff",
                            }}
                        >
                            <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                style={{ marginLeft: 2 }}
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </span>
                    </span>
                )}
            </button>
        )
    }

    const pointerDistance = () => {
        const values = Array.from(pointersRef.current.values())
        if (values.length < 2) return 0
        return Math.hypot(values[1].x - values[0].x, values[1].y - values[0].y)
    }

    const isInteractiveTarget = (target: EventTarget | null) =>
        target instanceof Element &&
        Boolean(
            target.closest(
                "button, a, input, select, textarea, video, iframe, [role='button']"
            )
        )

    const stopControlPointer = (
        event: React.PointerEvent<HTMLButtonElement>
    ) => {
        event.stopPropagation()
    }

    const handleMediaPointerDown = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (isInteractiveTarget(event.target)) return

        event.currentTarget.setPointerCapture?.(event.pointerId)
        pointersRef.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        })
        if (pointersRef.current.size === 2 && slide.type === "image") {
            pinchRef.current = {
                distance: pointerDistance(),
                zoom: zoomRef.current,
            }
            gestureStartRef.current = null
            return
        }
        gestureStartRef.current = {
            x: event.clientX,
            y: event.clientY,
            time: Date.now(),
        }
        if (slide.type === "image" && zoomRef.current > 1) {
            dragStartRef.current = {
                x: event.clientX,
                y: event.clientY,
                panX: panRef.current.x,
                panY: panRef.current.y,
            }
        }
    }

    const handleMediaPointerMove = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (isInteractiveTarget(event.target)) return
        if (!pointersRef.current.has(event.pointerId)) return
        pointersRef.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        })
        if (slide.type !== "image") return
        if (pointersRef.current.size >= 2 && pinchRef.current) {
            event.preventDefault()
            const distance = pointerDistance()
            if (distance > 0)
                applyImageTransform(
                    pinchRef.current.zoom *
                        (distance / Math.max(1, pinchRef.current.distance)),
                    panRef.current.x,
                    panRef.current.y,
                    false
                )
            return
        }
        if (zoomRef.current > 1 && dragStartRef.current) {
            event.preventDefault()
            applyImageTransform(
                zoomRef.current,
                dragStartRef.current.panX +
                    event.clientX -
                    dragStartRef.current.x,
                dragStartRef.current.panY +
                    event.clientY -
                    dragStartRef.current.y,
                false
            )
        }
    }

    const handleMediaPointerUp = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        if (isInteractiveTarget(event.target)) {
            pointersRef.current.delete(event.pointerId)
            if (pointersRef.current.size < 2) pinchRef.current = null
            gestureStartRef.current = null
            dragStartRef.current = null
            return
        }

        const start = gestureStartRef.current
        pointersRef.current.delete(event.pointerId)
        if (pointersRef.current.size < 2) pinchRef.current = null
        dragStartRef.current = null
        if (!start || zoomRef.current > 1.01) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        const elapsed = Date.now() - start.time
        gestureStartRef.current = null
        if (elapsed > 750) return
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.15)
            dx < 0 ? next() : previous()
        else if (dy > 85 && Math.abs(dy) > Math.abs(dx) * 1.15) requestClose()
    }

    return createPortal(
        <div
            ref={backdropRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${title || "Gallery"} lightbox`}
            onPointerMove={handleOverlayPointerMove}
            onPointerLeave={() => setShowCloseCursor(false)}
            onClick={(event) => {
                if (
                    closeOnBackdropClick &&
                    event.target === backdropRef.current
                )
                    requestClose()
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100000,
                background: overlayColor,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(10px, 3vw, 30px)",
                cursor: showCloseCursor ? "none" : "default",
                overflow: "hidden",
                fontFamily,
            }}
        >
            <div
                ref={panelRef}
                onPointerMove={(event) => event.stopPropagation()}
                style={{
                    width: "min(1120px, 100%)",
                    maxHeight: "calc(100dvh - 20px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    position: "relative",
                    willChange: "transform, opacity, filter",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        color: "#fff",
                        padding: "0 52px 0 4px",
                        minHeight: 36,
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: "clamp(14px, 2vw, 18px)",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {title || "Gallery"}
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                opacity: 0.68,
                                marginTop: 2,
                            }}
                        >
                            {mediaLabel} · {index + 1} of {slides.length}
                            {slide.type === "image" && zoomDisplay > 1
                                ? ` · ${Math.round(zoomDisplay * 100)}%`
                                : ""}
                        </div>
                    </div>
                    {slide.type === "image" && zoomDisplay > 1 && (
                        <button
                            type="button"
                            onClick={() => resetZoom(true)}
                            aria-label="Reset image zoom"
                            style={{
                                border: "1px solid rgba(255,255,255,.25)",
                                background: "rgba(255,255,255,.08)",
                                color: "#fff",
                                borderRadius: 999,
                                padding: "7px 11px",
                                cursor: "pointer",
                                fontSize: 11,
                            }}
                        >
                            Reset zoom
                        </button>
                    )}
                </div>
                <div
                    ref={imageStageRef}
                    onPointerDown={handleMediaPointerDown}
                    onPointerMove={handleMediaPointerMove}
                    onPointerUp={handleMediaPointerUp}
                    onPointerCancel={handleMediaPointerUp}
                    onDoubleClick={(event) => {
                        if (slide.type !== "image") return
                        event.preventDefault()
                        zoomRef.current > 1
                            ? resetZoom(true)
                            : applyImageTransform(2.5, 0, 0, true)
                    }}
                    onWheel={(event) => {
                        if (slide.type !== "image") return
                        event.preventDefault()
                        const amount = event.deltaY > 0 ? -0.28 : 0.28
                        applyImageTransform(
                            zoomRef.current + amount,
                            panRef.current.x,
                            panRef.current.y,
                            true
                        )
                    }}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "min(72vh, 760px)",
                        minHeight: 240,
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "#090909",
                        boxShadow: "0 32px 110px rgba(0,0,0,.62)",
                        touchAction: slide.type === "image" ? "none" : "pan-y",
                        cursor:
                            slide.type === "image"
                                ? zoomDisplay > 1
                                    ? "grab"
                                    : "zoom-in"
                                : "default",
                    }}
                >
                    {mediaStatus === "loading" && (
                        <div
                            aria-label="Loading media"
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "grid",
                                placeItems: "center",
                                zIndex: 2,
                                color: "#fff",
                            }}
                        >
                            <span
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "50%",
                                    border: "3px solid rgba(255,255,255,.2)",
                                    borderTopColor: "#fff",
                                    animation:
                                        "lightboxSpin .8s linear infinite",
                                }}
                            />
                        </div>
                    )}
                    {mediaStatus === "error" ? (
                        <div
                            role="alert"
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                textAlign: "center",
                                padding: 24,
                            }}
                        >
                            <div style={{ fontSize: 34 }}>⚠</div>
                            <strong>Media could not be loaded</strong>
                            <span style={{ opacity: 0.68, fontSize: 13 }}>
                                Choose another item or try again.
                            </span>
                            <button
                                type="button"
                                onClick={() => setMediaStatus("loading")}
                                style={{
                                    marginTop: 4,
                                    padding: "10px 14px",
                                    borderRadius: 999,
                                    border: "1px solid rgba(255,255,255,.3)",
                                    background: "rgba(255,255,255,.1)",
                                    color: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div
                            key={`${index}-${slide.src}`}
                            ref={mediaRef}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                willChange: "transform, opacity, filter",
                            }}
                        >
                            {slide.type === "image" ? (
                                <img
                                    ref={imageRef}
                                    src={slide.src}
                                    alt={`${title || "Gallery item"} ${index + 1}`}
                                    draggable={false}
                                    onLoad={() => setMediaStatus("loaded")}
                                    onError={() => setMediaStatus("error")}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                        opacity:
                                            mediaStatus === "loaded" ? 1 : 0,
                                        userSelect: "none",
                                        WebkitUserDrag: "none",
                                        willChange: "transform",
                                        transformOrigin: "50% 50%",
                                    }}
                                />
                            ) : slide.type === "youtube" && youtubeId ? (
                                <iframe
                                    title={`${title || "Video"} ${index + 1}`}
                                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                                    onLoad={() => setMediaStatus("loaded")}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: 0,
                                        background: "#000",
                                        opacity:
                                            mediaStatus === "loaded" ? 1 : 0,
                                    }}
                                />
                            ) : (
                                <video
                                    ref={videoRef}
                                    src={slide.src}
                                    controls
                                    autoPlay
                                    playsInline
                                    preload="auto"
                                    onCanPlay={() => setMediaStatus("loaded")}
                                    onError={() => setMediaStatus("error")}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                        opacity:
                                            mediaStatus === "loaded" ? 1 : 0,
                                    }}
                                />
                            )}
                        </div>
                    )}
                    <button
                        type="button"
                        onPointerDown={stopControlPointer}
                        onPointerMove={stopControlPointer}
                        onPointerUp={stopControlPointer}
                        onPointerCancel={stopControlPointer}
                        onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            requestClose()
                        }}
                        aria-label="Close lightbox"
                        style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,.3)",
                            background: "rgba(0,0,0,.64)",
                            color: "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            touchAction: "manipulation",
                            pointerEvents: "auto",
                        }}
                    >
                        <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            aria-hidden="true"
                            pointerEvents="none"
                        >
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                    {slides.length > 1 && zoomDisplay <= 1.01 && (
                        <>
                            <button
                                type="button"
                                onPointerDown={stopControlPointer}
                                onPointerMove={stopControlPointer}
                                onPointerUp={stopControlPointer}
                                onPointerCancel={stopControlPointer}
                                onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    previous()
                                }}
                                aria-label="Previous media"
                                style={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    border: "1px solid rgba(255,255,255,.28)",
                                    background: "rgba(0,0,0,.58)",
                                    color: "#fff",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 10,
                                    touchAction: "manipulation",
                                    pointerEvents: "auto",
                                }}
                            >
                                <svg
                                    width="21"
                                    height="21"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    aria-hidden="true"
                                    pointerEvents="none"
                                >
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onPointerDown={stopControlPointer}
                                onPointerMove={stopControlPointer}
                                onPointerUp={stopControlPointer}
                                onPointerCancel={stopControlPointer}
                                onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    next()
                                }}
                                aria-label="Next media"
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    border: "1px solid rgba(255,255,255,.28)",
                                    background: "rgba(0,0,0,.58)",
                                    color: "#fff",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 10,
                                    touchAction: "manipulation",
                                    pointerEvents: "auto",
                                }}
                            >
                                <svg
                                    width="21"
                                    height="21"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    aria-hidden="true"
                                    pointerEvents="none"
                                >
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </button>
                        </>
                    )}
                    {slide.type === "image" &&
                        mediaStatus === "loaded" &&
                        zoomDisplay === 1 && (
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    bottom: 12,
                                    transform: "translateX(-50%)",
                                    padding: "7px 11px",
                                    borderRadius: 999,
                                    background: "rgba(0,0,0,.48)",
                                    color: "rgba(255,255,255,.78)",
                                    fontSize: 10,
                                    pointerEvents: "none",
                                    backdropFilter: "blur(8px)",
                                }}
                            >
                                Double-click, wheel, or pinch to zoom
                            </div>
                        )}
                </div>
                {showThumbnails && slides.length > 1 && (
                    <div
                        ref={thumbnailsRef}
                        role="list"
                        aria-label="Gallery thumbnails"
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            gap: "clamp(6px, 1.5vw, 10px)",
                            overflowX: "auto",
                            overflowY: "hidden",
                            maxWidth: "100%",
                            padding: "6px 4px",
                            margin: "0 auto",
                            scrollbarWidth: "thin",
                            WebkitOverflowScrolling: "touch",
                            scrollSnapType: "x proximity",
                        }}
                    >
                        {slides.map(renderThumbnail)}
                    </div>
                )}
            </div>
            <div
                ref={closeCursorRef}
                aria-hidden="true"
                style={{
                    position: "fixed",
                    left: 0,
                    top: 0,
                    width: cursorSize,
                    height: cursorSize,
                    marginLeft: -cursorSize / 2,
                    marginTop: -cursorSize / 2,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,.32)",
                    background: "rgba(18,18,18,.5)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 100002,
                    opacity: showCloseCursor ? 1 : 0,
                    scale: showCloseCursor ? "1" : ".72",
                    transition: "opacity .18s ease, scale .18s ease",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    boxShadow: "0 10px 32px rgba(0,0,0,.32)",
                }}
            >
                <svg
                    width={Math.max(17, cursorSize * 0.36)}
                    height={Math.max(17, cursorSize * 0.36)}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </div>
            <style>{`@keyframes lightboxSpin{to{transform:rotate(360deg)}} @media(max-width:480px){button[aria-label="Previous media"],button[aria-label="Next media"]{width:38px!important;height:38px!important}} @media(pointer:coarse){div[aria-hidden="true"]{pointer-events:none}}`}</style>
        </div>,
        document.body
    )
}

function MediaPlayButton({
    onClick,
    dishName = "dish",
}: {
    onClick: (e: React.MouseEvent) => void
    dishName?: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Play video for ${dishName}`}
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.95)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 1,
                padding: 0,
                boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
                transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                    "translate(-50%, -50%) scale(1.08)"
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                    "translate(-50%, -50%) scale(1)"
            }}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="#0a0a0a"
                style={{ marginLeft: 3 }}
            >
                <path d="M8 5v14l11-7z" />
            </svg>
        </button>
    )
}

const SkeletonLoader = () => (
    <div className="profile-card">
        <div className="media-frame">
            <div className="skeleton skeleton-image" />
        </div>
        <div className="profile-meta">
            <div className="skeleton skeleton-text" style={{ width: "70%" }} />
            <div className="skeleton skeleton-text short" />
            <div className="skeleton skeleton-text" style={{ width: "90%" }} />
        </div>
    </div>
)

interface DietaryTag {
    type: "gf" | "v" | "spicy" | "df"
    label: string
}

interface MenuItem {
    id?: string
    name: string
    image: string | { src?: string; srcSet?: string; alt?: string }
    galleryImages?: string[]
    video?: string | { src?: string }
    videoFile?: string
    videoDisplay?: "popup" | "background"
    category: string
    course: string
    price: string
    priceNum: number
    description: string
    dietaryTags: DietaryTag[]
    chefsPick: boolean
    soldOut: boolean
    soldOutMessage?: string
}

const defaultMenu: MenuItem[] = [
    {
        id: "1",
        name: "Burrata & Heirloom Tomato",
        image: "https://images.unsplash.com/photo-1529312266912-b33cf6227e24?w=800&q=80",
        galleryImages: [
            "https://images.unsplash.com/photo-1529312266912-b33cf6227e24?w=800&q=80",
            "https://images.unsplash.com/photo-1541544744-37d8c2e6cfb1?w=800&q=80",
            "https://images.unsplash.com/photo-1608037521228-8f89530fb23e?w=800&q=80",
        ],
        category: "Starters",
        course: "Appetizers",
        price: "$16",
        priceNum: 16,
        description:
            "Creamy burrata cheese, heirloom tomatoes, basil pesto, aged balsamic reduction, toasted pine nuts, extra virgin olive oil.",
        dietaryTags: [
            { type: "v", label: "V" },
            { type: "gf", label: "GF" },
        ],
        chefsPick: true,
        soldOut: false,
    },
    {
        id: "2",
        name: "Tuna Tartare",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
        galleryImages: [
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
            "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800&q=80",
        ],
        category: "Starters",
        course: "Appetizers",
        price: "$22",
        priceNum: 22,
        description:
            "Fresh yellowfin tuna, avocado mousse, sesame crisps, soy-ginger dressing, micro cilantro, wasabi aioli.",
        dietaryTags: [
            { type: "gf", label: "GF" },
            { type: "df", label: "DF" },
        ],
        chefsPick: false,
        soldOut: false,
    },
    {
        id: "3",
        name: "Crispy Calamari",
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
        galleryImages: [
            "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
            "https://images.unsplash.com/photo-1534352956036-cd81e27fed21?w=800&q=80",
        ],
        category: "Starters",
        course: "Appetizers",
        price: "$14",
        priceNum: 14,
        description:
            "Lightly battered calamari, lemon aioli, marinara sauce, pickled peppers, fresh parsley, sea salt.",
        dietaryTags: [],
        chefsPick: false,
        soldOut: false,
    },
]

const defaultAllergenText =
    "Please inform your server of any allergies or dietary requirements. Our kitchen handles nuts, dairy, shellfish, gluten, and soy. While we take every precaution, cross-contact cannot be fully eliminated. [GF] = Gluten Free  [V] = Vegetarian  [DF] = Dairy Free  [SPICY] = Contains Chili"

interface MenuStyleValues {
    pageBackgroundColor: string
    imageCardBackgroundColor: string
    dividerColor: string
    primaryTextColor: string
    secondaryTextColor: string
    highlightColor: string
    entryNameColor: string
    entryNameActiveColor: string
    entryPriceColor: string
    menuCardBackground: string
    menuCardBorderColor: string
    menuCardBorderWidth: number
    menuCardHoverBackground: string
    menuCardHoverBorderColor: string
    menuCardAccentColor: string
    menuCardAccentWidth: number
    menuCardHoverAccentColor: string
    menuCardHoverAccentWidth: number
    menuCardActiveBackground: string
    menuCardActiveBorderColor: string
    menuCardActiveShadow: string
    menuCardActiveLift: number
    menuCardActiveAccentColor: string
    menuCardActiveAccentWidth: number
    menuCardActiveTitleColor: string
    menuCardActiveDescriptionColor: string
    menuCardActivePriceColor: string
    menuCardActivePriceBackground: string
    menuCardActivePriceBorderColor: string
    counterBadgeEnabled: boolean
    counterBackgroundColor: string
    counterTextColor: string
    counterFontSize: number
    counterBorderColor: string
    counterBorderWidth: number
    counterPerfectCircle: boolean
    counterSize: number
    counterBorderRadius: number
    counterPaddingX: number
    counterPaddingY: number
    priceBadgeEnabled: boolean
    priceBackgroundColor: string
    priceBorderColor: string
    priceBorderWidth: number
    priceBorderRadius: number
    pricePaddingX: number
    pricePaddingY: number
    chefPickBadgeColor: string
    glutenFreeTagColor: string
    vegetarianTagColor: string
    spicyTagColor: string
    tooltipBackgroundColor: string
    tooltipTextColor: string
    cursorColor: string
    scrollbarTrackColor: string
    scrollbarThumbColor: string
    scrollbarThumbHoverColor: string
    scrollbarWidth: number
    cardBorderRadius: number
    listItemBorderRadius: number
    pagerBackgroundColor: string
    pagerDotColor: string
    pagerActiveDotColor: string
    pagerProgressColor: string
    pagerPosition: "top" | "bottom"
    ctaUseCustomStyle: boolean
    ctaBackgroundColor: string
    ctaTextColor: string
    ctaBorderColor: string
    ctaBorderWidth: number
    ctaBorderRadius: number
}

type MenuStyleSection = Partial<MenuStyleValues>

type MenuStyleConfig = MenuStyleSection & {
    colors?: MenuStyleSection
    entryName?: MenuStyleSection
    menuCards?: MenuStyleSection
    counter?: MenuStyleSection
    price?: MenuStyleSection
    badgesAndTags?: MenuStyleSection
    scrollbarAndTooltip?: MenuStyleSection
    shape?: MenuStyleSection
    galleryPager?: MenuStyleSection
    ctaButton?: MenuStyleSection
}

interface MenuTypography {
    globalUiFont?: FontConfig
    dishNameFont?: FontConfig
    dishNameTextTransform?: React.CSSProperties["textTransform"]
    courseFont?: FontConfig
    courseTextTransform?: React.CSSProperties["textTransform"]
    priceTagFont?: FontConfig
    priceTagTextTransform?: React.CSSProperties["textTransform"]
    entryNumFont?: FontConfig
    entryNumTextTransform?: React.CSSProperties["textTransform"]
    entryNameFont?: FontConfig
    entryNameTextTransform?: React.CSSProperties["textTransform"]
    entryPriceFont?: FontConfig
    entryPriceTextTransform?: React.CSSProperties["textTransform"]
    entryDescFont?: FontConfig
    entryDescTextTransform?: React.CSSProperties["textTransform"]
    categoryTitleFont?: FontConfig
    categoryTitleTextTransform?: React.CSSProperties["textTransform"]
    ctaFont?: FontConfig
    ctaTextTransform?: React.CSSProperties["textTransform"]
}

interface RestaurantMenuFlowProps {
    menu?: MenuItem[]
    style?: MenuStyleConfig
    typography?: MenuTypography
    width?: number
    height?: number
    showAllergenNote?: boolean
    allergenNoteText?: string
    ctaText?: string
    ctaLink?: string
    ctaOpenInNewTab?: boolean
    showPager?: boolean
    ctaButtonOverride?: React.ReactNode | React.ReactNode[]
    useCustomCtaButton?: boolean
    lightboxShowThumbnails?: boolean
    lightboxAnimationDuration?: number
    lightboxOverlayColor?: string
    lightboxCursorSize?: number
    lightboxCloseOnBackdropClick?: boolean
}
/**
 * @framerDisableUnlink
 */
export default function RestaurantMenuFlow(props: RestaurantMenuFlowProps) {
    const {
        menu = defaultMenu,
        style = {},
        typography = {},
        showAllergenNote = true,
        allergenNoteText = defaultAllergenText,
        ctaText = "Reserve a Table",
        ctaLink,
        ctaOpenInNewTab = false,
        showPager = true,
        ctaButtonOverride,
        useCustomCtaButton = false,
        lightboxShowThumbnails = true,
        lightboxAnimationDuration = 0.42,
        lightboxOverlayColor = "rgba(0,0,0,0.9)",
        lightboxCursorSize = 58,
        lightboxCloseOnBackdropClick = true,
    } = props

    const {
        pageBackgroundColor = "#171310",
        imageCardBackgroundColor = "#1e1a16",
        dividerColor = "#3a332c",
        primaryTextColor = "#f3ede2",
        secondaryTextColor = "#9c9186",
        highlightColor = "#c1683f",
        entryNameColor = "#f3ede2",
        entryNameActiveColor = "#ffffff",
        entryPriceColor = "#c1683f",
        menuCardBackground = "rgba(30, 26, 22, 0.72)",
        menuCardBorderColor = "#3a332c",
        menuCardBorderWidth = 1,
        menuCardHoverBackground = "rgba(49, 38, 31, 0.92)",
        menuCardHoverBorderColor = "#80523c",
        menuCardAccentColor = "#c1683f",
        menuCardAccentWidth = 2,
        menuCardHoverAccentColor = "#c1683f",
        menuCardHoverAccentWidth = 2,
        menuCardActiveBackground = "rgba(43, 34, 28, 0.96)",
        menuCardActiveBorderColor = "#9b5d40",
        menuCardActiveShadow = "0 16px 38px rgba(0,0,0,0.16)",
        menuCardActiveLift = -2,
        menuCardActiveAccentColor = "#c1683f",
        menuCardActiveAccentWidth = 3,
        menuCardActiveTitleColor = "#ffffff",
        menuCardActiveDescriptionColor = "#f3ede2",
        menuCardActivePriceColor = "#c1683f",
        menuCardActivePriceBackground = "rgba(193, 104, 63, 0.12)",
        menuCardActivePriceBorderColor = "rgba(193, 104, 63, 0.45)",
        counterBadgeEnabled = false,
        counterBackgroundColor = "rgba(193, 104, 63, 0.12)",
        counterTextColor = "#c1683f",
        counterFontSize = 12,
        counterBorderColor = "rgba(193, 104, 63, 0.45)",
        counterBorderWidth = 1,
        counterPerfectCircle = true,
        counterSize = 34,
        counterBorderRadius = 999,
        counterPaddingX = 9,
        counterPaddingY = 5,
        priceBadgeEnabled = false,
        priceBackgroundColor = "rgba(193, 104, 63, 0.12)",
        priceBorderColor = "rgba(193, 104, 63, 0.45)",
        priceBorderWidth = 1,
        priceBorderRadius = 999,
        pricePaddingX = 12,
        pricePaddingY = 6,
        chefPickBadgeColor = "#b8945f",
        glutenFreeTagColor = "#6fb98a",
        vegetarianTagColor = "#7aa8d6",
        spicyTagColor = "#d97a6c",
        tooltipBackgroundColor = "#ffffff",
        tooltipTextColor = "#111111",
        cursorColor = "#f3ede2",
        scrollbarTrackColor = "rgba(255, 255, 255, 0.03)",
        scrollbarThumbColor = "#c1683f",
        scrollbarThumbHoverColor = "#d9804f",
        scrollbarWidth = 8,
        cardBorderRadius = 4,
        listItemBorderRadius = 4,
        pagerBackgroundColor = "rgba(0, 0, 0, 0.35)",
        pagerDotColor = "rgba(255, 255, 255, 0.3)",
        pagerActiveDotColor = "rgba(255, 255, 255, 0.15)",
        pagerProgressColor = "#c1683f",
        pagerPosition = "bottom",
        ctaUseCustomStyle = false,
        ctaBackgroundColor = "#c1683f",
        ctaTextColor = "#171310",
        ctaBorderColor = "transparent",
        ctaBorderWidth = 0,
        ctaBorderRadius = 0,
    } = {
        ...style,
        ...(style.colors || {}),
        ...(style.entryName || {}),
        ...(style.menuCards || {}),
        ...(style.counter || {}),
        ...(style.price || {}),
        ...(style.badgesAndTags || {}),
        ...(style.scrollbarAndTooltip || {}),
        ...(style.shape || {}),
        ...(style.galleryPager || {}),
        ...(style.ctaButton || {}),
    }

    const {
        globalUiFont = { fontFamily: "Inter" },
        dishNameFont = {},
        dishNameTextTransform = "none",
        courseFont = {},
        courseTextTransform = "none",
        priceTagFont = {},
        priceTagTextTransform = "none",
        entryNumFont = {},
        entryNumTextTransform = "none",
        entryNameFont = {},
        entryNameTextTransform = "none",
        entryPriceFont = {},
        entryPriceTextTransform = "none",
        entryDescFont = {},
        entryDescTextTransform = "none",
        categoryTitleFont = {},
        categoryTitleTextTransform = "none",
        ctaFont = {},
        ctaTextTransform = "uppercase",
    } = typography

    const globalUiFontFamily = globalUiFont.fontFamily || "Inter"

    const cRadius = Number(cardBorderRadius) || 0
    const lRadius = Number(listItemBorderRadius) || 0

    const dishNameStyle: React.CSSProperties = {
        ...buildFontStyle(dishNameFont),
        textTransform: dishNameTextTransform,
    }
    const courseStyle: React.CSSProperties = {
        ...buildFontStyle(courseFont),
        textTransform: courseTextTransform,
    }
    const priceTagStyle: React.CSSProperties = {
        ...buildFontStyle(priceTagFont),
        textTransform: priceTagTextTransform,
    }
    const entryNumStyle: React.CSSProperties = {
        ...buildFontStyle(entryNumFont),
        // Dedicated Counter Badge control. This intentionally overrides the
        // font size from Typography > List Item Number.
        fontSize: Math.max(1, Number(counterFontSize) || 12),
        textTransform: entryNumTextTransform,
    }
    const entryNameStyle: React.CSSProperties = {
        ...buildFontStyle(entryNameFont),
        textTransform: entryNameTextTransform,
        justifyContent: alignmentToFlex(entryNameFont.textAlign),
    }
    const entryPriceStyle: React.CSSProperties = {
        ...buildFontStyle(entryPriceFont),
        textTransform: entryPriceTextTransform,
    }
    const entryDescStyle: React.CSSProperties = {
        ...buildFontStyle(entryDescFont),
        textTransform: entryDescTextTransform,
    }
    const categoryTitleStyle: React.CSSProperties = {
        ...buildFontStyle(categoryTitleFont),
        textTransform: categoryTitleTextTransform,
        justifyContent: alignmentToFlex(categoryTitleFont.textAlign),
    }
    const ctaButtonStyle: React.CSSProperties = {
        ...buildFontStyle(ctaFont),
        textTransform: ctaTextTransform,
        justifyContent: alignmentToFlex(ctaFont.textAlign),
    }

    const isStatic = useIsStaticRenderer()
    // Show only five sample items on the Framer Canvas/static renderer.
    // The published/live site continues to use the complete menu.
    const displayMenu: MenuItem[] = useMemo(
        () => (isStatic ? menu.slice(0, 5) : menu),
        [menu, isStatic]
    )
    const rootRef = useRef<HTMLDivElement>(null)
    const filterBarRef = useRef<HTMLDivElement>(null)

    const getInitialMobileLayout = () => {
        if (typeof props.width === "number") return props.width <= 768
        return false
    }

    const [isMobileLayout, setIsMobileLayout] = useState(getInitialMobileLayout)
    const isMobileLayoutRef = useRef(isMobileLayout)
    const refreshAllRef = useRef<() => void>(() => {})

    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        isMobileLayoutRef.current = isMobileLayout
    }, [isMobileLayout])

    // Framer can change a component instance from desktop to phone width while
    // keeping the same React instance alive. Sync the explicit canvas width so
    // the mobile class updates immediately, including in the static renderer.
    useEffect(() => {
        if (typeof props.width !== "number") return
        const nextMobile = props.width <= 768
        setIsMobileLayout((prev) => (prev !== nextMobile ? nextMobile : prev))
    }, [props.width])

    // Measure the actual component frame on both Canvas and Preview. The old
    // implementation skipped this in the static renderer, which left phone
    // previews using the desktop layout when Framer resized the canvas frame.
    useEffect(() => {
        if (typeof window === "undefined" || !rootRef.current) return
        if (typeof ResizeObserver === "undefined") return

        let resizeRaf: number | null = null
        const updateFromWidth = (width: number) => {
            const nextMobile = width <= 768
            setIsMobileLayout((prev) =>
                prev !== nextMobile ? nextMobile : prev
            )
        }

        updateFromWidth(rootRef.current.getBoundingClientRect().width)

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            updateFromWidth(entry.contentRect.width)

            if (!isStatic) {
                if (resizeRaf) cancelAnimationFrame(resizeRaf)
                resizeRaf = requestAnimationFrame(() => refreshAllRef.current())
            }
        })

        observer.observe(rootRef.current)
        return () => {
            observer.disconnect()
            if (resizeRaf) cancelAnimationFrame(resizeRaf)
        }
    }, [isStatic])

    useEffect(() => {
        if (
            isStatic ||
            typeof window === "undefined" ||
            typeof IntersectionObserver === "undefined"
        )
            return
        const element = rootRef.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0 }
        )
        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    const driftRef = useRef<HTMLDivElement>(null)
    const slideARef = useRef<HTMLDivElement>(null)
    const slideBRef = useRef<HTMLDivElement>(null)
    const innerARef = useRef<HTMLDivElement>(null)
    const innerBRef = useRef<HTMLDivElement>(null)
    const roleRef = useRef<HTMLHeadingElement>(null)
    const companyRef = useRef<HTMLParagraphElement>(null)
    const priceTagRef = useRef<HTMLDivElement>(null)
    const pointerRef = useRef<HTMLDivElement>(null)
    const rightColRef = useRef<HTMLDivElement>(null)
    const showcasePanelRef = useRef<HTMLDivElement>(null)
    const rowsRef = useRef<(HTMLDivElement | null)[]>([])

    const [activeIndex, setActiveIndex] = useState(0)
    const [prevDishIndex, setPrevDishIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [activeVideo, setActiveVideo] = useState<string | null>(null)
    const [lightboxState, setLightboxState] = useState<{
        slides: { type: "image" | "video" | "youtube"; src: string }[]
        index: number
        title: string
    } | null>(null)

    const openVideo = useCallback(
        (url: string) => {
            if (isStatic) return
            if (url) setActiveVideo(url)
        },
        [isStatic]
    )
    const closeVideo = useCallback(() => {
        setActiveVideo(null)
    }, [])
    const openLightbox = useCallback(
        (dish: MenuItem, index: number) => {
            if (isStatic || !dish) return
            const slides = getSlides(dish).filter((slide) => !!slide.src)
            if (!slides.length) return
            setLightboxState({
                slides,
                index: Math.min(Math.max(index, 0), slides.length - 1),
                title: dish.name,
            })
        },
        [isStatic]
    )
    const closeLightbox = useCallback(() => setLightboxState(null), [])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined" || !rootRef.current) return
        const updateStickyOffsets = () => {
            if (isMobileLayoutRef.current) {
                rootRef.current?.style.setProperty("--filter-bar-height", "0px")
                rootRef.current?.style.setProperty("--sticky-offset", "20px")
                return
            }
            const filterBar = filterBarRef.current
            const categoryHeader = rootRef.current?.querySelector(
                ".category-header"
            ) as HTMLElement | null
            const filterBarHeight = filterBar?.offsetHeight ?? 120
            const categoryHeaderHeight = categoryHeader?.offsetHeight ?? 76
            rootRef.current?.style.setProperty(
                "--filter-bar-height",
                `${filterBarHeight}px`
            )
            rootRef.current?.style.setProperty(
                "--sticky-offset",
                `${filterBarHeight + categoryHeaderHeight + 24}px`
            )
        }
        updateStickyOffsets()
        const ro = new ResizeObserver(updateStickyOffsets)
        if (filterBarRef.current) ro.observe(filterBarRef.current)
        const categoryHeader = rootRef.current.querySelector(".category-header")
        if (categoryHeader) ro.observe(categoryHeader)
        window.addEventListener("resize", updateStickyOffsets)
        return () => {
            ro.disconnect()
            window.removeEventListener("resize", updateStickyOffsets)
        }
    }, [isStatic, isLoading, isMobileLayout, displayMenu])

    const [activeFilter, setActiveFilter] = useState<string | null>(null)
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const [galleryKey, setGalleryKey] = useState(0)
    const [renderLayer, setRenderLayer] = useState<"A" | "B">("A")
    const activeLayerRef = useRef<"A" | "B">("A")

    const [searchQuery, setSearchQuery] = useState("")
    const [showAutocomplete, setShowAutocomplete] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const changeCardRef = useRef<(index: number, fromScroll: boolean) => void>(
        () => {}
    )
    const beginProgrammaticScrollRef = useRef<() => void>(() => {})

    const cssVars = {
        "--ui-font-family": globalUiFontFamily,
        "--page-bg": pageBackgroundColor,
        "--image-card-bg": imageCardBackgroundColor,
        "--divider": dividerColor,
        "--primary-text": primaryTextColor,
        "--secondary-text": secondaryTextColor,
        "--highlight": highlightColor,
        "--entry-name-color": entryNameColor,
        "--entry-name-active-color": entryNameActiveColor,
        "--entry-price-color": entryPriceColor,
        "--menu-card-background": menuCardBackground,
        "--menu-card-border-color": menuCardBorderColor,
        "--menu-card-border-width": `${Math.max(0, Number(menuCardBorderWidth) || 0)}px`,
        "--menu-card-hover-background": menuCardHoverBackground,
        "--menu-card-hover-border-color": menuCardHoverBorderColor,
        "--menu-card-accent-color": menuCardAccentColor,
        "--menu-card-accent-width": `${Math.max(0, Number(menuCardAccentWidth) || 0)}px`,
        "--menu-card-hover-accent-color": menuCardHoverAccentColor,
        "--menu-card-hover-accent-width": `${Math.max(0, Number(menuCardHoverAccentWidth) || 0)}px`,
        "--menu-card-active-background": menuCardActiveBackground,
        "--menu-card-active-border-color": menuCardActiveBorderColor,
        "--menu-card-active-shadow": menuCardActiveShadow || "none",
        "--menu-card-active-lift": `${Number(menuCardActiveLift) || 0}px`,
        "--menu-card-active-accent-color": menuCardActiveAccentColor,
        "--menu-card-active-accent-width": `${Math.max(0, Number(menuCardActiveAccentWidth) || 0)}px`,
        "--menu-card-active-title-color": menuCardActiveTitleColor,
        "--menu-card-active-description-color": menuCardActiveDescriptionColor,
        "--menu-card-active-price-color": menuCardActivePriceColor,
        "--menu-card-active-price-background": menuCardActivePriceBackground,
        "--menu-card-active-price-border-color": menuCardActivePriceBorderColor,
        "--counter-bg": counterBadgeEnabled
            ? counterBackgroundColor
            : "transparent",
        "--counter-text-color": counterTextColor,
        "--counter-border-color": counterBadgeEnabled
            ? counterBorderColor
            : "transparent",
        "--counter-border-width": `${counterBadgeEnabled ? Math.max(0, Number(counterBorderWidth) || 0) : 0}px`,
        "--counter-border-radius":
            counterBadgeEnabled && counterPerfectCircle
                ? "50%"
                : `${Math.max(0, Number(counterBorderRadius) || 0)}px`,
        "--counter-width":
            counterBadgeEnabled && counterPerfectCircle
                ? `${Math.max(20, Number(counterSize) || 34)}px`
                : "max-content",
        "--counter-height":
            counterBadgeEnabled && counterPerfectCircle
                ? `${Math.max(20, Number(counterSize) || 34)}px`
                : "auto",
        "--counter-min-width":
            counterBadgeEnabled && counterPerfectCircle
                ? `${Math.max(20, Number(counterSize) || 34)}px`
                : "26px",
        "--counter-min-height":
            counterBadgeEnabled && counterPerfectCircle
                ? `${Math.max(20, Number(counterSize) || 34)}px`
                : "0px",
        "--counter-padding":
            counterBadgeEnabled && counterPerfectCircle
                ? "0px"
                : `${counterBadgeEnabled ? Math.max(0, Number(counterPaddingY) || 0) : 0}px ${counterBadgeEnabled ? Math.max(0, Number(counterPaddingX) || 0) : 0}px`,
        "--price-bg": priceBadgeEnabled ? priceBackgroundColor : "transparent",
        "--price-border-color": priceBadgeEnabled
            ? priceBorderColor
            : "transparent",
        "--price-border-width": `${priceBadgeEnabled ? Math.max(0, Number(priceBorderWidth) || 0) : 0}px`,
        "--price-border-radius": `${Math.max(0, Number(priceBorderRadius) || 0)}px`,
        "--price-padding-x": `${priceBadgeEnabled ? Math.max(0, Number(pricePaddingX) || 0) : 0}px`,
        "--price-padding-y": `${priceBadgeEnabled ? Math.max(0, Number(pricePaddingY) || 0) : 0}px`,
        "--chef-pick": chefPickBadgeColor,
        "--gf-tag": glutenFreeTagColor,
        "--v-tag": vegetarianTagColor,
        "--spicy-tag": spicyTagColor,
        "--cursor-color": cursorColor,
        "--scrollbar-track": scrollbarTrackColor,
        "--scrollbar-thumb": scrollbarThumbColor,
        "--scrollbar-thumb-hover": scrollbarThumbHoverColor,
        "--scrollbar-width": `${scrollbarWidth}px`,
        "--pager-bg": pagerBackgroundColor,
        "--pager-dot": pagerDotColor,
        "--pager-active": pagerActiveDotColor,
        "--pager-progress": pagerProgressColor,
        "--card-radius": `${cRadius}px`,
        "--list-radius": `${lRadius}px`,
        "--cta-bg": ctaBackgroundColor,
        "--cta-color": ctaTextColor,
        "--cta-border-color": ctaBorderColor,
        "--cta-border-width": `${ctaBorderWidth}px`,
        "--cta-border-radius": `${ctaBorderRadius}px`,
    } as React.CSSProperties

    useEffect(() => {
        if (isStatic) {
            setIsLoading(false)
            return
        }
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [isStatic])

    useEffect(() => {
        setGalleryIndex(0)
    }, [activeIndex, displayMenu])

    // Auto-advance the gallery. Disabled entirely on the static canvas / during
    // export so the component never animates or triggers re-renders there.
    // Pauses when the component is offscreen using IntersectionObserver.
    useEffect(() => {
        if (isStatic || !isVisible || lightboxState) return
        const slides = getSlides(displayMenu[activeIndex])
        if (slides.length > 1) {
            const interval = setInterval(() => {
                setGalleryIndex((prev) => (prev + 1) % slides.length)
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [activeIndex, displayMenu, isStatic, isVisible, lightboxState])

    useLayoutEffect(() => {
        if (isStatic) return

        const frameId = requestAnimationFrame(() => {
            refreshAllRef.current()
        })

        return () => cancelAnimationFrame(frameId)
    }, [isStatic, activeFilter, activeCategory, displayMenu])

    useEffect(() => {
        if (isStatic) return
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            )
                setShowAutocomplete(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () =>
            document.removeEventListener("mousedown", handleClickOutside)
    }, [isStatic])

    const filteredSearchItems = searchQuery.trim()
        ? displayMenu
              .map((item, index) => ({ ...item, originalIndex: index }))
              .filter(
                  (item) =>
                      item.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      item.description
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
              )
              .slice(0, 5)
        : []

    const handleSearchItemClick = (targetIndex: number) => {
        if (isStatic) return
        setActiveCategory(null)
        setActiveFilter(null)
        beginProgrammaticScrollRef.current()
        changeCardRef.current(targetIndex, false)
        setTimeout(() => {
            requestAnimationFrame(() => {
                const el = rowsRef.current[targetIndex]
                if (el) {
                    if (typeof ScrollTrigger !== "undefined")
                        ScrollTrigger.refresh()
                    el.scrollIntoView({ behavior: "smooth", block: "start" })
                }
            })
        }, 600)
        setSearchQuery("")
        setShowAutocomplete(false)
    }

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        if (isLoading) return

        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const rows = rowsRef.current.filter(
            (r) => r !== null
        ) as HTMLDivElement[]

        let currentIndex = 0
        let transitionSeq = 0
        let programmaticScroll = false
        let programmaticScrollTimer: any = null
        let wipeTl: gsap.core.Timeline | null = null
        let driftTween: gsap.core.Tween | null = null
        let pointerBounce: gsap.core.Tween | null = null

        const scrollTriggers: ScrollTrigger[] = []
        const eventListeners: {
            el: HTMLDivElement
            click: () => void
            keydown: (e: KeyboardEvent) => void
        }[] = []

        const beginProgrammaticScroll = () => {
            programmaticScroll = true
            if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer)
            programmaticScrollTimer = setTimeout(() => {
                programmaticScroll = false
            }, 2500)
        }
        beginProgrammaticScrollRef.current = beginProgrammaticScroll

        const handleScrollEnd = () => {
            if (!programmaticScrollTimer) programmaticScroll = false
        }
        window.addEventListener("scrollend", handleScrollEnd)

        const getPointerY = (index: number) => {
            const row = rows[index]
            if (!row) return 0
            return row.offsetTop + row.offsetHeight / 2 - 16
        }

        const getNextVisibleIndex = (index: number) => {
            for (let i = index + 1; i < rows.length; i++) {
                if (!rows[i].classList.contains("is-hidden")) return i
            }
            return index
        }

        const positionPointer = (index: number, animate: boolean) => {
            if (!pointerRef.current) return
            const targetY = getPointerY(index)

            if (reduced || !animate) {
                gsap.set(pointerRef.current, { y: targetY })
                return
            }

            gsap.to(pointerRef.current, {
                y: targetY,
                duration: 0.4,
                ease: "power2.out",
                overwrite: "auto",
            })
        }

        const animateDescription = (
            prevIndex: number | null,
            nextIndex: number
        ) => {
            if (reduced) {
                rows.forEach((r, i) => {
                    const desc = r.querySelector(".entry-desc") as HTMLElement
                    const accent = desc?.querySelector(
                        ".desc-accent"
                    ) as HTMLElement
                    if (i === nextIndex) {
                        if (desc)
                            gsap.set(desc, {
                                maxHeight: "200px",
                                opacity: 1,
                                y: 0,
                            })
                        if (accent) gsap.set(accent, { scaleX: 1 })
                    } else {
                        if (desc)
                            gsap.set(desc, { maxHeight: 0, opacity: 0, y: -8 })
                        if (accent) gsap.set(accent, { scaleX: 0 })
                    }
                })
                return
            }
            if (prevIndex !== null && prevIndex !== nextIndex) {
                const prevRow = rows[prevIndex]
                if (prevRow) {
                    const prevDesc = prevRow.querySelector(
                        ".entry-desc"
                    ) as HTMLElement
                    const prevAccent = prevDesc?.querySelector(
                        ".desc-accent"
                    ) as HTMLElement
                    if (prevAccent)
                        gsap.to(prevAccent, {
                            scaleX: 0,
                            duration: 0.3,
                            ease: "power2.in",
                        })
                    if (prevDesc)
                        gsap.to(prevDesc, {
                            opacity: 0,
                            y: -8,
                            duration: 0.35,
                            ease: "power2.in",
                            onComplete: () =>
                                gsap.set(prevDesc, { maxHeight: 0 }),
                        })
                }
            }
            const nextRow = rows[nextIndex]
            if (nextRow) {
                const nextDesc = nextRow.querySelector(
                    ".entry-desc"
                ) as HTMLElement
                const nextAccent = nextDesc?.querySelector(
                    ".desc-accent"
                ) as HTMLElement
                if (nextDesc) gsap.set(nextDesc, { maxHeight: "200px" })
                const tl = gsap.timeline()
                if (nextAccent)
                    tl.fromTo(
                        nextAccent,
                        { scaleX: 0 },
                        { scaleX: 1, duration: 0.5, ease: "power3.out" },
                        0
                    )
                if (nextDesc)
                    tl.fromTo(
                        nextDesc,
                        { opacity: 0, y: 12 },
                        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
                        0.08
                    )
            }
        }

        const changeCard = (index: number, fromScroll: boolean) => {
            if (index === currentIndex) return
            const dir = index > currentIndex ? 1 : -1
            const prevIndex = currentIndex
            currentIndex = index
            setPrevDishIndex(prevIndex)
            setActiveIndex(index)
            rows.forEach((r) => r.classList.remove("active"))
            if (rows[index]) rows[index].classList.add("active")
            if (!fromScroll) positionPointer(index, true)
            animateDescription(prevIndex, index)

            const dish = displayMenu[index]
            if (!dish) return
            const seq = ++transitionSeq

            const currentLayer = activeLayerRef.current
            const outgoing =
                currentLayer === "A"
                    ? { slide: slideARef.current, inner: innerARef.current }
                    : { slide: slideBRef.current, inner: innerBRef.current }
            const incoming =
                currentLayer === "A"
                    ? { slide: slideBRef.current, inner: innerBRef.current }
                    : { slide: slideARef.current, inner: innerARef.current }

            if (
                !outgoing.slide ||
                !incoming.slide ||
                !outgoing.inner ||
                !incoming.inner
            )
                return

            activeLayerRef.current = currentLayer === "A" ? "B" : "A"
            setRenderLayer(activeLayerRef.current)

            if (reduced) {
                gsap.set(outgoing.slide, { opacity: 0, zIndex: 1 })
                gsap.set(incoming.slide, {
                    opacity: 1,
                    zIndex: 2,
                    clipPath: "inset(0% 0% 0% 0%)",
                })
                gsap.set([outgoing.inner, incoming.inner], { yPercent: 0 })
                if (roleRef.current) roleRef.current.textContent = dish.name
                if (companyRef.current)
                    companyRef.current.textContent = dish.course
                if (priceTagRef.current)
                    priceTagRef.current.textContent = dish.price
                return
            }

            if (wipeTl) wipeTl.kill()

            const runWipe = () => {
                if (seq !== transitionSeq) return
                gsap.killTweensOf([
                    outgoing.slide,
                    incoming.slide,
                    outgoing.inner,
                    incoming.inner,
                ])
                gsap.set([outgoing.inner, incoming.inner], { yPercent: 0 })
                gsap.set(outgoing.slide, {
                    zIndex: 1,
                    opacity: 1,
                    clipPath: "inset(0% 0% 0% 0%)",
                })
                gsap.set(incoming.slide, {
                    zIndex: 2,
                    opacity: 1,
                    clipPath:
                        dir > 0
                            ? "inset(100% 0% 0% 0%)"
                            : "inset(0% 0% 100% 0%)",
                })
                gsap.set(incoming.inner, { yPercent: dir > 0 ? 10 : -10 })

                wipeTl = gsap.timeline({
                    onComplete: () => {
                        if (seq !== transitionSeq) return
                        gsap.set(outgoing.slide, { opacity: 0 })
                    },
                })
                wipeTl.to(
                    outgoing.slide,
                    {
                        clipPath:
                            dir > 0
                                ? "inset(0% 0% 100% 0%)"
                                : "inset(100% 0% 0% 0%)",
                        duration: 0.8,
                        ease: "power2.inOut",
                    },
                    0
                )
                wipeTl.to(
                    outgoing.inner,
                    {
                        yPercent: dir > 0 ? -10 : 10,
                        duration: 1.0,
                        ease: "power2.inOut",
                    },
                    0
                )
                wipeTl.to(
                    incoming.slide,
                    {
                        clipPath: "inset(0% 0% 0% 0%)",
                        duration: 0.8,
                        ease: "power2.inOut",
                    },
                    0
                )
                wipeTl.to(
                    incoming.inner,
                    { yPercent: 0, duration: 1.0, ease: "power2.inOut" },
                    0
                )
                wipeTl.add(() => {
                    if (seq !== transitionSeq) return
                    if (roleRef.current) roleRef.current.textContent = dish.name
                    if (companyRef.current)
                        companyRef.current.textContent = dish.course
                    if (priceTagRef.current)
                        priceTagRef.current.textContent = dish.price
                }, 0.1)
            }

            const incomingMedia = incoming.inner?.querySelector(
                ".gallery-img.active, .gallery-video.active, .gallery-iframe.active"
            ) as HTMLImageElement | HTMLVideoElement | HTMLIFrameElement
            if (
                incomingMedia &&
                (incomingMedia as HTMLImageElement).tagName === "IMG"
            ) {
                const img = incomingMedia as HTMLImageElement
                if (img.complete) runWipe()
                else {
                    img.onload = runWipe
                    img.onerror = runWipe
                }
            } else {
                runWipe()
            }

            if (!fromScroll && !reduced && driftRef.current) {
                const st = ScrollTrigger.getById("driftST")
                if (st) {
                    if (isMobileLayoutRef.current) {
                        if (driftTween) driftTween.kill()
                        driftTween = gsap.to(driftRef.current, {
                            yPercent: 0,
                            duration: 0.8,
                            ease: "power2.out",
                            overwrite: true,
                        })
                    } else {
                        const targetY = st.progress * -7
                        if (driftTween) driftTween.kill()
                        driftTween = gsap.to(driftRef.current, {
                            yPercent: targetY,
                            duration: 0.8,
                            ease: "power2.out",
                            overwrite: true,
                        })
                    }
                }
            }
        }
        changeCardRef.current = changeCard

        if (slideARef.current)
            gsap.set(slideARef.current, {
                opacity: 1,
                zIndex: 2,
                clipPath: "inset(0% 0% 0% 0%)",
            })
        if (slideBRef.current)
            gsap.set(slideBRef.current, { opacity: 0, zIndex: 1 })
        if (pointerRef.current) gsap.set(pointerRef.current, { opacity: 1 })

        rows.forEach((row, i) => {
            const desc = row.querySelector(".entry-desc") as HTMLElement
            const accent = desc?.querySelector(".desc-accent") as HTMLElement
            if (i === 0) {
                row.classList.add("active")
                if (desc)
                    gsap.set(desc, { maxHeight: "200px", opacity: 1, y: 0 })
                if (accent) gsap.set(accent, { scaleX: 1 })
            } else {
                if (desc) gsap.set(desc, { maxHeight: 0, opacity: 0, y: -8 })
                if (accent) gsap.set(accent, { scaleX: 0 })
            }
        })

        if (!reduced && driftRef.current && rightColRef.current) {
            const st = ScrollTrigger.create({
                id: "driftST",
                trigger: rightColRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
                onUpdate: (self) => {
                    if (isMobileLayoutRef.current) {
                        if (driftRef.current)
                            gsap.set(driftRef.current, { yPercent: 0 })
                        return
                    }
                    if (!driftTween || !driftTween.isActive()) {
                        if (driftRef.current)
                            gsap.set(driftRef.current, {
                                yPercent: self.progress * -7,
                            })
                    }
                },
            })
            scrollTriggers.push(st)
        }

        rows.forEach((row, index) => {
            const st = ScrollTrigger.create({
                trigger: row,
                start: "top center",
                end: "bottom center",
                invalidateOnRefresh: true,
                onEnter: () => {
                    if (
                        !programmaticScroll &&
                        !isMobileLayoutRef.current &&
                        !row.classList.contains("is-hidden")
                    )
                        changeCard(index, true)
                },
                onEnterBack: () => {
                    if (
                        !programmaticScroll &&
                        !isMobileLayoutRef.current &&
                        !row.classList.contains("is-hidden")
                    )
                        changeCard(index, true)
                },
                onUpdate: (self) => {
                    if (
                        reduced ||
                        programmaticScroll ||
                        isMobileLayoutRef.current ||
                        row.classList.contains("is-hidden") ||
                        !pointerRef.current
                    )
                        return

                    const nextIndex = getNextVisibleIndex(index)
                    const currentY = getPointerY(index)
                    const nextY = getPointerY(nextIndex)
                    const y = gsap.utils.interpolate(
                        currentY,
                        nextY,
                        self.progress
                    )

                    gsap.set(pointerRef.current, { y })
                },
            })
            scrollTriggers.push(st)

            const handleClick = () => {
                changeCard(index, false)
                beginProgrammaticScroll()
                if (isMobileLayoutRef.current) {
                    if (showcasePanelRef.current)
                        showcasePanelRef.current.scrollIntoView({
                            behavior: reduced ? "auto" : "smooth",
                            block: "start",
                        })
                } else {
                    row.scrollIntoView({
                        behavior: reduced ? "auto" : "smooth",
                        block: "center",
                    })
                }
            }
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    changeCard(index, false)
                    beginProgrammaticScroll()
                    if (isMobileLayoutRef.current) {
                        if (showcasePanelRef.current)
                            showcasePanelRef.current.scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "start",
                            })
                    } else {
                        row.scrollIntoView({
                            behavior: reduced ? "auto" : "smooth",
                            block: "center",
                        })
                    }
                }
            }
            row.addEventListener("click", handleClick)
            row.addEventListener("keydown", handleKeyDown)
            eventListeners.push({
                el: row,
                click: handleClick,
                keydown: handleKeyDown,
            })
        })

        const refreshAll = () => {
            if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh()
            positionPointer(currentIndex, false)
        }
        refreshAllRef.current = refreshAll
        refreshAll()

        if (!reduced && pointerRef.current) {
            pointerBounce = gsap.to(pointerRef.current, {
                x: -8,
                duration: 0.7,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
            })
        }

        window.addEventListener("load", refreshAll)
        window.addEventListener("resize", refreshAll)
        if (document.fonts && document.fonts.ready)
            document.fonts.ready.then(refreshAll)

        return () => {
            window.removeEventListener("scrollend", handleScrollEnd)
            window.removeEventListener("load", refreshAll)
            window.removeEventListener("resize", refreshAll)
            eventListeners.forEach((h) => {
                h.el.removeEventListener("click", h.click)
                h.el.removeEventListener("keydown", h.keydown)
            })
            scrollTriggers.forEach((st) => st.kill())
            if (wipeTl) wipeTl.kill()
            if (driftTween) driftTween.kill()
            if (pointerBounce) pointerBounce.kill()
            if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer)
        }
    }, [isStatic, displayMenu, isLoading])

    const containerClass = `menu-container${isMobileLayout ? " is-mobile" : ""}${isStatic ? " is-static-renderer" : ""}`
    const activeDish = displayMenu[activeIndex]
    const prevDish = displayMenu[prevDishIndex]

    const groupedMenu = displayMenu.reduce(
        (acc, item, index) => {
            const cat = item.category || "Menu"
            if (!acc[cat]) acc[cat] = []
            acc[cat].push({ ...item, originalIndex: index })
            return acc
        },
        {} as Record<string, (MenuItem & { originalIndex: number })[]>
    )

    const uniqueCategories = Array.from(
        new Set(displayMenu.map((item) => item.category || "Menu"))
    )

    // On the static canvas / during export we never want to mount playing
    // <video> or autoplaying YouTube <iframe> elements — they cause visible
    // flashes and performance hits in an environment with no real playback
    // lifecycle. Render a single still image instead.
    const renderGallery = (dish: MenuItem, isActiveLayer: boolean) => {
        const slides = getSlides(dish)

        if (isStatic) {
            const firstImage = slides.find((s) => s.type === "image")
            const fallbackSrc = firstImage?.src || getImageSrc(dish?.image)
            if (!fallbackSrc) return null
            return (
                <img
                    key="static-img"
                    src={fallbackSrc}
                    className="gallery-img active"
                    alt=""
                />
            )
        }

        return slides.map((slide, i) => {
            const isActive = isActiveLayer && i === galleryIndex
            if (slide.type === "youtube") {
                const ytId = extractYouTubeId(slide.src)
                return (
                    <iframe
                        key={`yt-${i}`}
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&playsinline=1&rel=0`}
                        className={`gallery-iframe ${isActive ? "active" : ""}`}
                        style={{ border: "none" }}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        title="background video"
                    />
                )
            }
            if (slide.type === "video") {
                return (
                    <video
                        key={`vid-${i}`}
                        src={slide.src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`gallery-video ${isActive ? "active" : ""}`}
                    />
                )
            }
            return (
                <img
                    key={`img-${i}`}
                    src={slide.src}
                    className={`gallery-img ${isActive ? "active" : ""}`}
                    alt=""
                    loading="lazy"
                />
            )
        })
    }

    const getTooltipText = (type: string) => {
        switch (type) {
            case "gf":
                return "Gluten Free"
            case "v":
                return "Vegetarian"
            case "spicy":
                return "Spicy"
            case "df":
                return "Dairy Free"
            default:
                return ""
        }
    }

    const [tooltipState, setTooltipState] = useState<{
        text: string
        x: number
        y: number
    } | null>(null)

    // Tooltip coordinates are computed relative to the component's own root
    // element (rootRef) rather than the viewport, and rendered with
    // position:absolute inside that root. This keeps the tooltip in the
    // component's own DOM subtree instead of relying on document-level
    // positioning, which avoids clipping/stacking issues when this
    // component is embedded inside a host page with its own layout.
    const handleTagMouseEnter = (e: React.MouseEvent, text: string) => {
        if (!rootRef.current) return
        const rootRect = rootRef.current.getBoundingClientRect()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setTooltipState({
            text,
            x: rect.left - rootRect.left + rect.width / 2,
            y: rect.top - rootRect.top - 8,
        })
    }
    const handleTagMouseLeave = () => setTooltipState(null)

    const renderAllergenText = (text: string) => {
        if (!text) return null
        const parts = text.split(/(\[GF\]|\[V\]|\[DF\]|\[SPICY\])/)
        return parts.map((part, i) => {
            if (part === "[GF]")
                return (
                    <span
                        key={i}
                        className="dietary-tag gf"
                        style={{ fontSize: 9 }}
                        onMouseEnter={(e) =>
                            handleTagMouseEnter(e, "Gluten Free")
                        }
                        onMouseLeave={handleTagMouseLeave}
                    >
                        GF
                    </span>
                )
            if (part === "[V]")
                return (
                    <span
                        key={i}
                        className="dietary-tag v"
                        style={{ fontSize: 9 }}
                        onMouseEnter={(e) =>
                            handleTagMouseEnter(e, "Vegetarian")
                        }
                        onMouseLeave={handleTagMouseLeave}
                    >
                        V
                    </span>
                )
            if (part === "[DF]")
                return (
                    <span
                        key={i}
                        className="dietary-tag df"
                        style={{ fontSize: 9 }}
                        onMouseEnter={(e) =>
                            handleTagMouseEnter(e, "Dairy Free")
                        }
                        onMouseLeave={handleTagMouseLeave}
                    >
                        DF
                    </span>
                )
            if (part === "[SPICY]")
                return (
                    <span
                        key={i}
                        className="dietary-tag spicy"
                        style={{ fontSize: 9 }}
                        onMouseEnter={(e) => handleTagMouseEnter(e, "Spicy")}
                        onMouseLeave={handleTagMouseLeave}
                    >
                        Spicy
                    </span>
                )
            return part
        })
    }

    // Open in a new tab when the author explicitly asked for it, or when the
    // link points off-site. Same-origin / relative links (e.g. an in-page
    // anchor or another page on the same site) navigate normally so the CTA
    // doesn't unexpectedly break in-app navigation.

    const hasCustomButton =
        useCustomCtaButton &&
        Boolean(
            Array.isArray(ctaButtonOverride)
                ? ctaButtonOverride.length
                : ctaButtonOverride
        )

    const ctaTargetsNewTab = ctaOpenInNewTab || isExternalUrl(ctaLink)

    // In the static renderer we now use the same complete layout as Preview,
    // while all motion, timers, autoplay media, portals, and continuous effects
    // remain disabled by the isStatic guards above.

    // Show the loading state only in live/preview rendering.
    if (isLoading && !isStatic) {
        return (
            <>
                <style>{COMPONENT_CSS}</style>
                <div ref={rootRef} className={containerClass} style={cssVars}>
                    <section className="roster">
                        <div className="showcase-panel" ref={showcasePanelRef}>
                            <SkeletonLoader />
                        </div>

                        <div className="list-panel">
                            {displayMenu.map((_, i) => (
                                <div
                                    key={i}
                                    className={`entry-item ${!counterBadgeEnabled ? "no-counter" : ""}`}
                                >
                                    <div
                                        className={`entry-header ${!counterBadgeEnabled ? "no-counter" : ""}`}
                                    >
                                        {counterBadgeEnabled && (
                                            <div
                                                className="skeleton"
                                                style={{
                                                    width: 24,
                                                    height: 16,
                                                }}
                                            />
                                        )}
                                        <div
                                            className="skeleton"
                                            style={{ width: 200, height: 48 }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </>
        )
    }

    return (
        <>
            <style>{COMPONENT_CSS}</style>
            <div ref={rootRef} className={containerClass} style={cssVars}>
                <section className="roster">
                    <div className="showcase-panel" ref={showcasePanelRef}>
                        <div className="profile-card">
                            <div className="media-frame">
                                {isStatic ? (
                                    <>{renderGallery(activeDish, true)}</>
                                ) : (
                                    <>
                                        {activeDish?.soldOut && (
                                            <div className="sold-out-badge">
                                                {activeDish.soldOutMessage ||
                                                    "Currently Unavailable"}
                                            </div>
                                        )}
                                        <div
                                            className="parallax-track"
                                            ref={driftRef}
                                        >
                                            <div
                                                className="slide-layer"
                                                ref={slideARef}
                                                id="slideA"
                                            >
                                                <div
                                                    className="media-wrapper"
                                                    ref={innerARef}
                                                >
                                                    {renderGallery(
                                                        renderLayer === "A"
                                                            ? activeDish
                                                            : prevDish,
                                                        renderLayer === "A"
                                                    )}
                                                </div>
                                            </div>
                                            <div
                                                className="slide-layer"
                                                ref={slideBRef}
                                            >
                                                <div
                                                    className="media-wrapper"
                                                    ref={innerBRef}
                                                >
                                                    {renderGallery(
                                                        renderLayer === "B"
                                                            ? activeDish
                                                            : prevDish,
                                                        renderLayer === "B"
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="lightbox-open-button"
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                openLightbox(
                                                    activeDish,
                                                    galleryIndex
                                                )
                                            }}
                                            aria-label={`Open ${activeDish?.name || "media"} gallery`}
                                            title="Open gallery"
                                        >
                                            <svg
                                                width="19"
                                                height="19"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
                                                <rect
                                                    x="7"
                                                    y="7"
                                                    width="10"
                                                    height="10"
                                                    rx="1"
                                                />
                                            </svg>
                                        </button>

                                        {/* Popup Play Button Overlay - Now shows for BOTH popup and background modes */}
                                        {(() => {
                                            const vSrc =
                                                getVideoSrc(
                                                    activeDish?.videoFile
                                                ) ||
                                                getVideoSrc(activeDish?.video)
                                            if (vSrc) {
                                                return (
                                                    <MediaPlayButton
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openVideo(vSrc)
                                                        }}
                                                        dishName={
                                                            activeDish?.name
                                                        }
                                                    />
                                                )
                                            }
                                            return null
                                        })()}

                                        {/* Unified Pager */}
                                        {showPager &&
                                            (() => {
                                                const slides =
                                                    getSlides(activeDish)
                                                if (slides.length <= 1)
                                                    return null
                                                return (
                                                    <div
                                                        className={`gallery-pagination ${pagerPosition === "top" ? "top" : ""}`}
                                                    >
                                                        {slides.map((_, i) => (
                                                            <span
                                                                key={i}
                                                                className={`gallery-dot ${i === galleryIndex ? "active" : ""}`}
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation()
                                                                    setGalleryIndex(
                                                                        i
                                                                    )
                                                                    setGalleryKey(
                                                                        (
                                                                            prev
                                                                        ) =>
                                                                            prev +
                                                                            1
                                                                    )
                                                                }}
                                                            >
                                                                {i ===
                                                                    galleryIndex && (
                                                                    <span
                                                                        key={
                                                                            galleryKey
                                                                        }
                                                                        className="gallery-dot-progress"
                                                                    />
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )
                                            })()}
                                    </>
                                )}
                            </div>
                            <div className="profile-meta">
                                <div>
                                    <h3 ref={roleRef} style={dishNameStyle}>
                                        {activeDish?.name}
                                    </h3>
                                    <p ref={companyRef} style={courseStyle}>
                                        {activeDish?.course}
                                    </p>
                                </div>
                                <div
                                    className="price-tag"
                                    ref={priceTagRef}
                                    style={priceTagStyle}
                                >
                                    {activeDish?.price}
                                </div>
                            </div>
                            {hasCustomButton ? (
                                ctaLink ? (
                                    <a
                                        href={ctaLink}
                                        target={
                                            ctaTargetsNewTab
                                                ? "_blank"
                                                : undefined
                                        }
                                        rel={
                                            ctaTargetsNewTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        style={{
                                            display: "block",
                                            textDecoration: "none",
                                            width: "100%",
                                            marginTop: 20,
                                        }}
                                    >
                                        {Array.isArray(ctaButtonOverride)
                                            ? ctaButtonOverride[0]
                                            : ctaButtonOverride}
                                    </a>
                                ) : (
                                    <div style={{ marginTop: 20 }}>
                                        {Array.isArray(ctaButtonOverride)
                                            ? ctaButtonOverride[0]
                                            : ctaButtonOverride}
                                    </div>
                                )
                            ) : ctaText && ctaLink ? (
                                <a
                                    href={ctaLink}
                                    className={`cta-button ${ctaUseCustomStyle ? "cta-custom" : ""}`}
                                    style={ctaButtonStyle}
                                    target={
                                        ctaTargetsNewTab ? "_blank" : undefined
                                    }
                                    rel={
                                        ctaTargetsNewTab
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                >
                                    {ctaText}
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line
                                            x1="5"
                                            y1="12"
                                            x2="19"
                                            y2="12"
                                        ></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </a>
                            ) : null}
                        </div>
                    </div>

                    <div className="list-panel" ref={rightColRef}>
                        <div className="search-container" ref={searchRef}>
                            <div className="search-input-wrapper">
                                <svg
                                    className="search-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line
                                        x1="21"
                                        y1="21"
                                        x2="16.65"
                                        y2="16.65"
                                    ></line>
                                </svg>
                                <label
                                    htmlFor="menu-search"
                                    className="visually-hidden"
                                >
                                    Search menu items
                                </label>
                                <input
                                    id="menu-search"
                                    type="search"
                                    className="search-input"
                                    placeholder="Search menu items..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setShowAutocomplete(true)
                                    }}
                                    onFocus={() => {
                                        if (searchQuery.trim())
                                            setShowAutocomplete(true)
                                    }}
                                />
                            </div>
                            {filteredSearchItems.length > 0 && (
                                <div
                                    className={`autocomplete-dropdown ${showAutocomplete ? "open" : ""}`}
                                >
                                    {filteredSearchItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className="autocomplete-item"
                                            onClick={() =>
                                                handleSearchItemClick(
                                                    item.originalIndex
                                                )
                                            }
                                        >
                                            <img
                                                src={getImageSrc(item.image)}
                                                alt={item.name}
                                                className="autocomplete-thumb"
                                                loading="lazy"
                                            />
                                            <div className="autocomplete-info">
                                                <div className="autocomplete-name">
                                                    {item.name}
                                                </div>
                                                <div className="autocomplete-meta">
                                                    <span>{item.category}</span>
                                                    <span className="autocomplete-price">
                                                        {item.price}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div
                            className="filter-bar-container"
                            ref={filterBarRef}
                        >
                            <div
                                className="filter-bar"
                                style={{ marginBottom: "12px" }}
                            >
                                <span className="filter-bar-label">
                                    Category:
                                </span>
                                <button
                                    className={`filter-btn ${!activeCategory ? "active" : ""}`}
                                    onClick={() => setActiveCategory(null)}
                                >
                                    All
                                </button>
                                {uniqueCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        className={`filter-btn ${activeCategory === cat ? "active" : ""}`}
                                        onClick={() => setActiveCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="filter-bar">
                                <span className="filter-bar-label">
                                    Dietary:
                                </span>
                                <button
                                    className={`filter-btn ${!activeFilter ? "active" : ""}`}
                                    onClick={() => setActiveFilter(null)}
                                >
                                    All
                                </button>
                                <button
                                    className={`filter-btn ${activeFilter === "gf" ? "active" : ""}`}
                                    onClick={() => setActiveFilter("gf")}
                                >
                                    Gluten Free
                                </button>
                                <button
                                    className={`filter-btn ${activeFilter === "v" ? "active" : ""}`}
                                    onClick={() => setActiveFilter("v")}
                                >
                                    Vegetarian
                                </button>
                                <button
                                    className={`filter-btn ${activeFilter === "spicy" ? "active" : ""}`}
                                    onClick={() => setActiveFilter("spicy")}
                                >
                                    Spicy
                                </button>
                                <button
                                    className={`filter-btn ${activeFilter === "df" ? "active" : ""}`}
                                    onClick={() => setActiveFilter("df")}
                                >
                                    Dairy Free
                                </button>
                            </div>
                        </div>

                        <div className="cursor-indicator" ref={pointerRef}>
                            <svg viewBox="0 0 40 40">
                                <path
                                    d="M34 20 L8 20 M8 20 L16 12 M8 20 L16 28"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>

                        {Object.entries(groupedMenu).map(
                            ([category, items]) => (
                                <div
                                    key={category}
                                    className="category-section"
                                >
                                    <h2
                                        className="category-header"
                                        style={categoryTitleStyle}
                                    >
                                        {category}
                                    </h2>
                                    {items.map((dish) => {
                                        const index = dish.originalIndex
                                        const isActive = index === activeIndex
                                        const isVisible =
                                            (!activeCategory ||
                                                dish.category ===
                                                    activeCategory) &&
                                            (!activeFilter ||
                                                dish.dietaryTags.some(
                                                    (t) =>
                                                        t.type === activeFilter
                                                ))
                                        return (
                                            <div
                                                key={dish.id || index}
                                                id={`menu-item-${dish.id ?? index}`}
                                                className={`entry-item ${isActive ? "active" : ""} ${dish.soldOut ? "sold-out" : ""} ${!isVisible ? "is-hidden" : ""} ${!counterBadgeEnabled ? "no-counter" : ""}`}
                                                data-index={index}
                                                aria-labelledby={`dish-name-${dish.id ?? index}`}
                                                ref={(el) => {
                                                    rowsRef.current[index] = el
                                                }}
                                            >
                                                {dish.chefsPick &&
                                                    !dish.soldOut && (
                                                        <span className="chefs-pick">
                                                            Chef&apos;s Pick
                                                        </span>
                                                    )}
                                                <div
                                                    className={`entry-header ${!counterBadgeEnabled ? "no-counter" : ""}`}
                                                >
                                                    {counterBadgeEnabled && (
                                                        <span
                                                            className="entry-num"
                                                            style={
                                                                entryNumStyle
                                                            }
                                                            aria-hidden="true"
                                                        >
                                                            {String(
                                                                index + 1
                                                            ).padStart(2, "0")}
                                                        </span>
                                                    )}
                                                    <div className="entry-title-region">
                                                        <h2
                                                            id={`dish-name-${dish.id ?? index}`}
                                                            className="entry-name"
                                                            style={
                                                                entryNameStyle
                                                            }
                                                        >
                                                            {dish.name}
                                                        </h2>
                                                        {dish.dietaryTags
                                                            .length > 0 && (
                                                            <div
                                                                className="dietary-tags"
                                                                role="group"
                                                                aria-label={`Dietary filters for ${dish.name}`}
                                                            >
                                                                {dish.dietaryTags.map(
                                                                    (
                                                                        tag,
                                                                        tagIndex
                                                                    ) => (
                                                                        <button
                                                                            key={`${tag.type}-${tagIndex}`}
                                                                            type="button"
                                                                            className={`dietary-tag ${tag.type}`}
                                                                            aria-pressed={
                                                                                activeFilter ===
                                                                                tag.type
                                                                            }
                                                                            aria-label={`Filter by ${getTooltipText(tag.type)}`}
                                                                            onMouseEnter={(
                                                                                e
                                                                            ) =>
                                                                                handleTagMouseEnter(
                                                                                    e,
                                                                                    getTooltipText(
                                                                                        tag.type
                                                                                    )
                                                                                )
                                                                            }
                                                                            onMouseLeave={
                                                                                handleTagMouseLeave
                                                                            }
                                                                            onClick={(
                                                                                e
                                                                            ) => {
                                                                                e.stopPropagation()
                                                                                setActiveFilter(
                                                                                    (
                                                                                        prev
                                                                                    ) =>
                                                                                        prev ===
                                                                                        tag.type
                                                                                            ? null
                                                                                            : tag.type
                                                                                )
                                                                            }}
                                                                        >
                                                                            {
                                                                                tag.label
                                                                            }
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="entry-select-button"
                                                            aria-label={`Show ${dish.name} in the preview panel`}
                                                        >
                                                            View item
                                                        </button>
                                                    </div>
                                                    <span
                                                        className="entry-price"
                                                        style={entryPriceStyle}
                                                    >
                                                        {dish.soldOut
                                                            ? dish.soldOutMessage ||
                                                              "Sold Out"
                                                            : dish.price}
                                                    </span>
                                                </div>
                                                <p
                                                    className="entry-desc"
                                                    style={entryDescStyle}
                                                >
                                                    <span className="desc-accent" />
                                                    {dish.description}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        )}
                    </div>
                </section>
                {showAllergenNote && (
                    <footer className="allergen-note">
                        <p>
                            <span className="allergen-icon">✦</span>
                            {renderAllergenText(allergenNoteText)}
                        </p>
                    </footer>
                )}
                {tooltipState && (
                    <div
                        className="custom-tooltip"
                        style={{
                            left: tooltipState.x,
                            top: tooltipState.y,
                            background: tooltipBackgroundColor,
                            color: tooltipTextColor,
                        }}
                    >
                        {tooltipState.text}
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: 0,
                                height: 0,
                                borderLeft: "5px solid transparent",
                                borderRight: "5px solid transparent",
                                borderTop: `5px solid ${tooltipBackgroundColor}`,
                            }}
                        />
                    </div>
                )}
            </div>
            {!isStatic && lightboxState && (
                <LightboxGallery
                    slides={lightboxState.slides}
                    initialIndex={lightboxState.index}
                    title={lightboxState.title}
                    showThumbnails={lightboxShowThumbnails}
                    animationDuration={Math.max(
                        0.1,
                        Number(lightboxAnimationDuration) || 0.42
                    )}
                    overlayColor={lightboxOverlayColor}
                    cursorSize={Math.max(36, Number(lightboxCursorSize) || 58)}
                    closeOnBackdropClick={lightboxCloseOnBackdropClick}
                    onClose={closeLightbox}
                    fontFamily={globalUiFontFamily}
                />
            )}
            {!isStatic && activeVideo && (
                <VideoModal
                    videoUrl={activeVideo}
                    onClose={closeVideo}
                    fontFamily={globalUiFontFamily}
                />
            )}
        </>
    )
}

addPropertyControls(RestaurantMenuFlow, {
    menu: {
        type: ControlType.Array,
        title: "Menu Items",
        control: {
            type: ControlType.Object,
            title: "Item",
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Dish Name",
                    defaultValue: "Dish Name",
                },
                image: { type: ControlType.Image, title: "Fallback Image" },
                galleryImages: {
                    type: ControlType.Array,
                    title: "Gallery Images",
                    control: { type: ControlType.Image, title: "Image" },
                    defaultValue: [],
                },
                video: {
                    type: ControlType.String,
                    title: "Video URL (MP4 or YouTube)",
                    placeholder: "https://youtube.com/watch?v=... or .mp4",
                    description:
                        "Supports YouTube URLs or direct video file URLs.",
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Video File (MP4)",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                videoDisplay: {
                    type: ControlType.Enum,
                    title: "Video Display Mode",
                    options: ["popup", "background"],
                    optionTitles: [
                        "Popup (Click to play)",
                        "Background (First Slide Autoplay)",
                    ],
                    defaultValue: "popup",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Starters",
                },
                course: {
                    type: ControlType.String,
                    title: "Course",
                    defaultValue: "Course",
                },
                price: {
                    type: ControlType.String,
                    title: "Price",
                    defaultValue: "$0",
                },
                priceNum: {
                    type: ControlType.Number,
                    title: "Price Number",
                    defaultValue: 0,
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Description",
                },
                dietaryTags: {
                    type: ControlType.Array,
                    title: "Dietary Tags",
                    control: {
                        type: ControlType.Object,
                        title: "Tag",
                        controls: {
                            type: {
                                type: ControlType.Enum,
                                title: "Type",
                                options: ["gf", "v", "spicy", "df"],
                                optionTitles: [
                                    "Gluten Free",
                                    "Vegetarian",
                                    "Spicy",
                                    "Dairy Free",
                                ],
                                defaultValue: "gf",
                            },
                            label: {
                                type: ControlType.String,
                                title: "Label",
                                defaultValue: "GF",
                            },
                        },
                    },
                    defaultValue: [],
                },
                chefsPick: {
                    type: ControlType.Boolean,
                    title: "Chef's Pick",
                    defaultValue: false,
                },
                soldOut: {
                    type: ControlType.Boolean,
                    title: "Sold Out",
                    defaultValue: false,
                },
                soldOutMessage: {
                    type: ControlType.String,
                    title: "Sold Out Message",
                    defaultValue: "Currently unavailable",
                },
            },
        },
        defaultValue: defaultMenu,
    },
    lightboxShowThumbnails: {
        type: ControlType.Boolean,
        title: "LB Thumbnails",
        defaultValue: true,
    },
    lightboxAnimationDuration: {
        type: ControlType.Number,
        title: "LB Animation",
        defaultValue: 0.42,
        min: 0.1,
        max: 1.2,
        step: 0.02,
        unit: "s",
    },
    lightboxOverlayColor: {
        type: ControlType.Color,
        title: "LB Overlay",
        defaultValue: "rgba(0,0,0,0.9)",
    },
    lightboxCursorSize: {
        type: ControlType.Number,
        title: "LB Cursor Size",
        defaultValue: 58,
        min: 36,
        max: 100,
        step: 1,
        unit: "px",
    },
    lightboxCloseOnBackdropClick: {
        type: ControlType.Boolean,
        title: "LB Backdrop Close",
        defaultValue: true,
    },
    style: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            colors: {
                type: ControlType.Object,
                title: "Core Colors",
                controls: {
                    pageBackgroundColor: {
                        type: ControlType.Color,
                        title: "Page Background",
                        defaultValue: "#171310",
                    },
                    imageCardBackgroundColor: {
                        type: ControlType.Color,
                        title: "Image Card Background",
                        defaultValue: "#1e1a16",
                    },
                    dividerColor: {
                        type: ControlType.Color,
                        title: "Dividers & Borders",
                        defaultValue: "#3a332c",
                    },
                    primaryTextColor: {
                        type: ControlType.Color,
                        title: "Primary Text",
                        defaultValue: "#f3ede2",
                    },
                    secondaryTextColor: {
                        type: ControlType.Color,
                        title: "Secondary / Muted Text",
                        defaultValue: "#9c9186",
                    },
                    highlightColor: {
                        type: ControlType.Color,
                        title: "Highlights & Active States",
                        defaultValue: "#c1683f",
                    },
                },
            },
            entryName: {
                type: ControlType.Object,
                title: "Entry Name",
                controls: {
                    entryNameColor: {
                        type: ControlType.Color,
                        title: "Entry Name",
                        defaultValue: "#f3ede2",
                    },
                    entryNameActiveColor: {
                        type: ControlType.Color,
                        title: "Entry Name Active",
                        defaultValue: "#ffffff",
                    },
                },
            },
            menuCards: {
                type: ControlType.Object,
                title: "Menu Item Cards",
                controls: {
                    menuCardBackground: {
                        type: ControlType.Color,
                        title: "Background",
                        defaultValue: "rgba(30, 26, 22, 0.72)",
                    },
                    menuCardBorderColor: {
                        type: ControlType.Color,
                        title: "Border",
                        defaultValue: "#3a332c",
                    },
                    menuCardBorderWidth: {
                        type: ControlType.Number,
                        title: "Border Width",
                        defaultValue: 1,
                        min: 0,
                        max: 10,
                        step: 1,
                        unit: "px",
                    },
                    menuCardHoverBackground: {
                        type: ControlType.Color,
                        title: "Hover Background",
                        defaultValue: "rgba(49, 38, 31, 0.92)",
                    },
                    menuCardHoverBorderColor: {
                        type: ControlType.Color,
                        title: "Hover Border",
                        defaultValue: "#80523c",
                    },
                    menuCardAccentColor: {
                        type: ControlType.Color,
                        title: "Accent",
                        defaultValue: "#c1683f",
                    },
                    menuCardAccentWidth: {
                        type: ControlType.Number,
                        title: "Accent Width",
                        defaultValue: 2,
                        min: 0,
                        max: 12,
                        step: 1,
                        unit: "px",
                    },
                    menuCardHoverAccentColor: {
                        type: ControlType.Color,
                        title: "Hover Accent",
                        defaultValue: "#c1683f",
                    },
                    menuCardHoverAccentWidth: {
                        type: ControlType.Number,
                        title: "Hover Accent Width",
                        defaultValue: 2,
                        min: 0,
                        max: 12,
                        step: 1,
                        unit: "px",
                    },
                    menuCardActiveBackground: {
                        type: ControlType.Color,
                        title: "Active Background",
                        defaultValue: "rgba(43, 34, 28, 0.96)",
                    },
                    menuCardActiveBorderColor: {
                        type: ControlType.Color,
                        title: "Active Border",
                        defaultValue: "#9b5d40",
                    },
                    menuCardActiveShadow: {
                        type: ControlType.String,
                        title: "Active Shadow",
                        defaultValue: "0 16px 38px rgba(0,0,0,0.16)",
                    },
                    menuCardActiveLift: {
                        type: ControlType.Number,
                        title: "Active Lift",
                        defaultValue: -2,
                        min: -20,
                        max: 20,
                        step: 1,
                        unit: "px",
                    },
                    menuCardActiveAccentColor: {
                        type: ControlType.Color,
                        title: "Active Accent",
                        defaultValue: "#c1683f",
                    },
                    menuCardActiveAccentWidth: {
                        type: ControlType.Number,
                        title: "Active Accent Width",
                        defaultValue: 3,
                        min: 0,
                        max: 12,
                        step: 1,
                        unit: "px",
                    },
                    menuCardActiveTitleColor: {
                        type: ControlType.Color,
                        title: "Active Title",
                        defaultValue: "#ffffff",
                    },
                    menuCardActiveDescriptionColor: {
                        type: ControlType.Color,
                        title: "Active Description",
                        defaultValue: "#f3ede2",
                    },
                    menuCardActivePriceColor: {
                        type: ControlType.Color,
                        title: "Active Price Text",
                        defaultValue: "#c1683f",
                    },
                    menuCardActivePriceBackground: {
                        type: ControlType.Color,
                        title: "Active Price Background",
                        defaultValue: "rgba(193, 104, 63, 0.12)",
                    },
                    menuCardActivePriceBorderColor: {
                        type: ControlType.Color,
                        title: "Active Price Border",
                        defaultValue: "rgba(193, 104, 63, 0.45)",
                    },
                },
            },
            counter: {
                type: ControlType.Object,
                title: "Counter Badge",
                controls: {
                    counterBadgeEnabled: {
                        type: ControlType.Boolean,
                        title: "Counter Badge",
                        defaultValue: false,
                    },
                    counterBackgroundColor: {
                        type: ControlType.Color,
                        title: "Counter Background",
                        defaultValue: "rgba(193, 104, 63, 0.12)",
                    },
                    counterTextColor: {
                        type: ControlType.Color,
                        title: "Counter Font Color",
                        defaultValue: "#c1683f",
                    },
                    counterFontSize: {
                        type: ControlType.Number,
                        title: "Counter Font Size",
                        defaultValue: 12,
                        min: 8,
                        max: 48,
                        step: 1,
                        unit: "px",
                    },
                    counterBorderColor: {
                        type: ControlType.Color,
                        title: "Counter Border",
                        defaultValue: "rgba(193, 104, 63, 0.45)",
                    },
                    counterBorderWidth: {
                        type: ControlType.Number,
                        title: "Counter Border Width",
                        defaultValue: 1,
                        min: 0,
                        max: 10,
                        step: 1,
                        unit: "px",
                    },
                    counterPerfectCircle: {
                        type: ControlType.Boolean,
                        title: "Perfect Circle",
                        defaultValue: true,
                        enabledTitle: "On",
                        disabledTitle: "Off",
                    },
                    counterSize: {
                        type: ControlType.Number,
                        title: "Circle Size",
                        defaultValue: 34,
                        min: 20,
                        max: 120,
                        step: 1,
                        unit: "px",
                        hidden: (props: any) => !props.counterPerfectCircle,
                    },
                    counterBorderRadius: {
                        type: ControlType.Number,
                        title: "Counter Radius",
                        defaultValue: 999,
                        min: 0,
                        max: 999,
                        step: 1,
                        unit: "px",
                        hidden: (props: any) => props.counterPerfectCircle,
                    },
                    counterPaddingX: {
                        type: ControlType.Number,
                        title: "Counter Padding X",
                        defaultValue: 9,
                        min: 0,
                        max: 40,
                        step: 1,
                        unit: "px",
                        hidden: (props: any) => props.counterPerfectCircle,
                    },
                    counterPaddingY: {
                        type: ControlType.Number,
                        title: "Counter Padding Y",
                        defaultValue: 5,
                        min: 0,
                        max: 30,
                        step: 1,
                        unit: "px",
                        hidden: (props: any) => props.counterPerfectCircle,
                    },
                },
            },
            price: {
                type: ControlType.Object,
                title: "Price Badge",
                controls: {
                    entryPriceColor: {
                        type: ControlType.Color,
                        title: "Entry Price",
                        defaultValue: "#c1683f",
                    },
                    priceBadgeEnabled: {
                        type: ControlType.Boolean,
                        title: "Price Badge",
                        defaultValue: false,
                    },
                    priceBackgroundColor: {
                        type: ControlType.Color,
                        title: "Price Background",
                        defaultValue: "rgba(193, 104, 63, 0.12)",
                    },
                    priceBorderColor: {
                        type: ControlType.Color,
                        title: "Price Border",
                        defaultValue: "rgba(193, 104, 63, 0.45)",
                    },
                    priceBorderWidth: {
                        type: ControlType.Number,
                        title: "Price Border Width",
                        defaultValue: 1,
                        min: 0,
                        max: 10,
                        step: 1,
                        unit: "px",
                    },
                    priceBorderRadius: {
                        type: ControlType.Number,
                        title: "Price Radius",
                        defaultValue: 999,
                        min: 0,
                        max: 999,
                        step: 1,
                        unit: "px",
                    },
                    pricePaddingX: {
                        type: ControlType.Number,
                        title: "Price Padding X",
                        defaultValue: 12,
                        min: 0,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                    pricePaddingY: {
                        type: ControlType.Number,
                        title: "Price Padding Y",
                        defaultValue: 6,
                        min: 0,
                        max: 30,
                        step: 1,
                        unit: "px",
                    },
                },
            },
            badgesAndTags: {
                type: ControlType.Object,
                title: "Badges & Tags",
                controls: {
                    chefPickBadgeColor: {
                        type: ControlType.Color,
                        title: "Chef's Pick Badge",
                        defaultValue: "#b8945f",
                    },
                    glutenFreeTagColor: {
                        type: ControlType.Color,
                        title: "Gluten Free (GF) Tag",
                        defaultValue: "#6fb98a",
                    },
                    vegetarianTagColor: {
                        type: ControlType.Color,
                        title: "Vegetarian (V) Tag",
                        defaultValue: "#7aa8d6",
                    },
                    spicyTagColor: {
                        type: ControlType.Color,
                        title: "Spicy Tag",
                        defaultValue: "#d97a6c",
                    },
                },
            },
            scrollbarAndTooltip: {
                type: ControlType.Object,
                title: "Scrollbar & Tooltip",
                controls: {
                    cursorColor: {
                        type: ControlType.Color,
                        title: "Cursor Indicator Color",
                        defaultValue: "#f3ede2",
                    },
                    scrollbarTrackColor: {
                        type: ControlType.Color,
                        title: "Scrollbar Track Color",
                        defaultValue: "rgba(255, 255, 255, 0.03)",
                    },
                    scrollbarThumbColor: {
                        type: ControlType.Color,
                        title: "Scrollbar Thumb Color",
                        defaultValue: "#c1683f",
                    },
                    scrollbarThumbHoverColor: {
                        type: ControlType.Color,
                        title: "Scrollbar Thumb Hover Color",
                        defaultValue: "#d9804f",
                    },
                    scrollbarWidth: {
                        type: ControlType.Number,
                        title: "Scrollbar Width",
                        min: 2,
                        max: 20,
                        step: 1,
                        defaultValue: 8,
                        unit: "px",
                    },
                    tooltipBackgroundColor: {
                        type: ControlType.Color,
                        title: "Tooltip Background",
                        defaultValue: "#ffffff",
                    },
                    tooltipTextColor: {
                        type: ControlType.Color,
                        title: "Tooltip Text",
                        defaultValue: "#111111",
                    },
                },
            },
            shape: {
                type: ControlType.Object,
                title: "Corners & Shape",
                controls: {
                    cardBorderRadius: {
                        type: ControlType.Number,
                        title: "Card Border Radius",
                        min: 0,
                        max: 40,
                        step: 1,
                        defaultValue: 4,
                        unit: "px",
                    },
                    listItemBorderRadius: {
                        type: ControlType.Number,
                        title: "List Item Border Radius",
                        min: 0,
                        max: 40,
                        step: 1,
                        defaultValue: 4,
                        unit: "px",
                    },
                },
            },
            galleryPager: {
                type: ControlType.Object,
                title: "Gallery Pager",
                controls: {
                    pagerBackgroundColor: {
                        type: ControlType.Color,
                        title: "Pager Background",
                        defaultValue: "rgba(0, 0, 0, 0.35)",
                    },
                    pagerDotColor: {
                        type: ControlType.Color,
                        title: "Pager Dot (Inactive)",
                        defaultValue: "rgba(255, 255, 255, 0.3)",
                    },
                    pagerActiveDotColor: {
                        type: ControlType.Color,
                        title: "Pager Dot (Active)",
                        defaultValue: "rgba(255, 255, 255, 0.15)",
                    },
                    pagerProgressColor: {
                        type: ControlType.Color,
                        title: "Pager Progress Bar",
                        defaultValue: "#c1683f",
                    },
                    pagerPosition: {
                        type: ControlType.Enum,
                        title: "Pager Position",
                        options: ["bottom", "top"],
                        optionTitles: ["Bottom", "Top"],
                        defaultValue: "bottom",
                    },
                },
            },
            ctaButton: {
                type: ControlType.Object,
                title: "CTA Button",
                controls: {
                    ctaUseCustomStyle: {
                        type: ControlType.Boolean,
                        title: "Customize CTA Button",
                        defaultValue: false,
                    },
                    ctaBackgroundColor: {
                        type: ControlType.Color,
                        title: "CTA Background",
                        defaultValue: "#c1683f",
                    },
                    ctaTextColor: {
                        type: ControlType.Color,
                        title: "CTA Text Color",
                        defaultValue: "#171310",
                    },
                    ctaBorderColor: {
                        type: ControlType.Color,
                        title: "CTA Frame Color",
                        defaultValue: "transparent",
                    },
                    ctaBorderWidth: {
                        type: ControlType.Number,
                        title: "CTA Frame Width",
                        min: 0,
                        max: 20,
                        step: 1,
                        defaultValue: 0,
                        unit: "px",
                    },
                    ctaBorderRadius: {
                        type: ControlType.Number,
                        title: "CTA Frame Corner Radius",
                        min: 0,
                        max: 50,
                        step: 1,
                        defaultValue: 0,
                        unit: "px",
                    },
                },
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            globalUiFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Global UI Font",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: 1.4,
                    textAlign: "left",
                },
                description:
                    "Fallback font family for search, filters, tags, badges, tooltips, lightbox controls, and other UI text.",
            },
            dishNameFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Dish Name (Card)",
                defaultValue: {
                    fontFamily: "Fraunces",
                    fontWeight: 500,
                    fontSize: 19,
                    letterSpacing: "0.01em",
                    textAlign: "left",
                },
            },
            dishNameTextTransform: {
                type: ControlType.Enum,
                title: "Dish Name (Card) Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            courseTextTransform: {
                type: ControlType.Enum,
                title: "Course (Card) Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            courseFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Course (Card)",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 300,
                    fontSize: 13,
                    textAlign: "left",
                },
            },
            priceTagTextTransform: {
                type: ControlType.Enum,
                title: "Price (Card) Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            priceTagFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Price (Card)",
                defaultValue: {
                    fontFamily: "Fraunces",
                    fontWeight: 400,
                    fontSize: 19,
                    textAlign: "right",
                },
            },
            entryNumTextTransform: {
                type: ControlType.Enum,
                title: "List Item Number Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            entryNumFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "List Item Number",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: 12,
                    letterSpacing: "0.05em",
                    textAlign: "center",
                },
            },
            entryNameFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "List Item Dish Name",
                defaultValue: {
                    fontFamily: "Fraunces",
                    fontWeight: 400,
                    fontSize: 58,
                    lineHeight: 1,
                    textAlign: "left",
                },
            },
            entryNameTextTransform: {
                type: ControlType.Enum,
                title: "List Item Dish Name Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            entryPriceFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "List Item Price",
                defaultValue: {
                    fontFamily: "Fraunces",
                    fontWeight: 400,
                    fontSize: 22,
                    textAlign: "center",
                },
            },
            entryPriceTextTransform: {
                type: ControlType.Enum,
                title: "List Item Price Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            entryDescFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "List Item Description",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 300,
                    fontSize: 14,
                    lineHeight: 1.6,
                    letterSpacing: "0.01em",
                    textAlign: "left",
                },
            },
            entryDescTextTransform: {
                type: ControlType.Enum,
                title: "List Item Description Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            categoryTitleFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Category Title",
                defaultValue: {
                    fontFamily: "Fraunces",
                    fontWeight: 400,
                    fontSize: 28,
                    letterSpacing: "0.05em",
                    textAlign: "left",
                },
            },
            categoryTitleTextTransform: {
                type: ControlType.Enum,
                title: "Category Title Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            ctaFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "CTA Button Font",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: 13,
                    letterSpacing: "0.08em",
                    textAlign: "center",
                },
            },
            ctaTextTransform: {
                type: ControlType.Enum,
                title: "CTA Button Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "uppercase",
            },
        },
    },
    useCustomCtaButton: {
        type: ControlType.Boolean,
        title: "Use Custom Button",
        defaultValue: false,
    },
    ctaButtonOverride: {
        type: ControlType.ComponentInstance,
        title: "Custom Button",
        hidden(props) {
            return !props.useCustomCtaButton
        },
    },
    ctaText: {
        type: ControlType.String,
        title: "CTA Button Text",
        defaultValue: "Reserve a Table",
    },
    ctaLink: { type: ControlType.Link, title: "CTA Button Link" },
    ctaOpenInNewTab: {
        type: ControlType.Boolean,
        title: "Open CTA in New Tab",
        defaultValue: false,
    },
    showPager: {
        type: ControlType.Boolean,
        title: "Show Pager",
        defaultValue: true,
    },
    showAllergenNote: {
        type: ControlType.Boolean,
        title: "Show Allergen Note",
        defaultValue: true,
    },
    allergenNoteText: {
        type: ControlType.String,
        title: "Allergen Note Text",
        displayTextArea: true,
        defaultValue: defaultAllergenText,
    },
})
