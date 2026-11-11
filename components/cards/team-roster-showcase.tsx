import { useEffect, useRef, useState, useCallback, useId } from "react"
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

// ─────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────
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
function resolveLink(link: any): {
    href: string
    target?: string
    rel?: string
} {
    if (!link) return { href: "#" }
    if (typeof link === "string")
        return { href: link, target: "_blank", rel: "noopener noreferrer" }
    if (link.type === "url")
        return {
            href: link.url || "#",
            target: "_blank",
            rel: "noopener noreferrer",
        }
    if (link.type === "email") return { href: `mailto:${link.email || ""}` }
    if (link.type === "page") return { href: link.page?.url || "#" }
    if (link.type === "tel") return { href: `tel:${link.tel || ""}` }
    return { href: "#" }
}
// ─────────────────────────────────────────────────────────────────────────
// ADVANCED BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────────────────
const BUTTON_ARROW_SVG = (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
    >
        <path
            d="M7 17L17 7M17 7H7M17 7V17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)
type ButtonStyle = "filled" | "outline" | "ghost"
type TextTransform = "none" | "capitalize" | "uppercase" | "lowercase"
interface CardButtonProps {
    text: string
    href: string
    target?: string
    rel?: string
    isStatic?: boolean
    buttonStyle?: ButtonStyle
    bgColor?: string
    fontColor?: string
    hoverBgColor?: string
    hoverFontColor?: string
    borderColor?: string
    hoverBorderColor?: string
    borderRadius?: number
    paddingX?: number
    paddingY?: number
    textTransform?: TextTransform
    arrowColor?: string
}
function CardButton(props: CardButtonProps) {
    const {
        text,
        href,
        target,
        rel,
        isStatic = false,
        buttonStyle = "filled",
        bgColor = "#ffffff",
        fontColor = "#000000",
        hoverBgColor = "rgba(255, 255, 255, 0.85)",
        hoverFontColor = "#000000",
        borderColor = "#ffffff",
        hoverBorderColor = "#ffffff",
        borderRadius = 100,
        paddingX = 28,
        paddingY = 14,
        textTransform = "uppercase",
        arrowColor,
    } = props
    const ArrowIcon = ({ color }: { color?: string }) => (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M7 17L17 7M17 7H7M17 7V17"
                stroke={color || "currentColor"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
    if (!href) return null
    const hasText = !!text?.trim()
    const isFilled = buttonStyle === "filled"
    const isOutline = buttonStyle === "outline"
    const isGhost = buttonStyle === "ghost"
    const baseStyle: React.CSSProperties = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingTop: isGhost && hasText ? 0 : paddingY,
        paddingRight: !hasText ? paddingY : isGhost ? 6 : paddingX,
        paddingBottom: isGhost && hasText ? 15 : paddingY,
        paddingLeft: !hasText ? paddingY : isGhost ? 6 : paddingX,
        background: isFilled ? bgColor : "transparent",
        border: isOutline ? `1px solid ${borderColor}` : "none",
        borderRadius: borderRadius + "px",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 600,
        letterSpacing: "0.15em",
        lineHeight: "1em",
        textTransform: textTransform,
        color: fontColor,
        cursor: "pointer",
        overflow: "hidden",
        pointerEvents: "auto",
        fontFamily: "inherit",
        userSelect: "none",
        WebkitUserSelect: "none",
    }
    const linkProps = { href, target, rel }
    if (isStatic) {
        return (
            <a {...linkProps} style={baseStyle}>
                <span
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                    {hasText && <span>{text}</span>}
                    <ArrowIcon color={arrowColor} />
                </span>
            </a>
        )
    }
    if (isFilled) {
        return (
            <motion.a
                {...linkProps}
                whileHover="hover"
                initial="rest"
                animate="rest"
                style={{ ...baseStyle, isolation: "isolate" }}
            >
                <motion.div
                    variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: hoverBgColor,
                        borderRadius: borderRadius + "px",
                        originX: 0,
                        zIndex: -1,
                    }}
                    aria-hidden="true"
                />
                <motion.span
                    variants={{
                        rest: { color: fontColor },
                        hover: { color: hoverFontColor },
                    }}
                    transition={{ duration: 0.22 }}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    {hasText && <span>{text}</span>}
                    <motion.div
                        variants={{
                            rest: { x: 0, y: 0, rotate: 0 },
                            hover: { x: 4, y: -4, rotate: -45 },
                        }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ display: "flex", alignItems: "center" }}
                        aria-hidden="true"
                    >
                        <ArrowIcon color={arrowColor} />
                    </motion.div>
                </motion.span>
            </motion.a>
        )
    }
    if (isOutline) {
        return (
            <motion.a
                {...linkProps}
                whileHover="hover"
                initial="rest"
                animate="rest"
                variants={{
                    rest: { borderColor: borderColor },
                    hover: { borderColor: hoverBorderColor },
                }}
                transition={{ duration: 0.25 }}
                style={{ ...baseStyle, isolation: "isolate" }}
            >
                <motion.div
                    variants={{ rest: { opacity: 0 }, hover: { opacity: 0.1 } }}
                    transition={{ duration: 0.25 }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: hoverBgColor,
                        borderRadius: borderRadius + "px",
                        zIndex: -1,
                    }}
                    aria-hidden="true"
                />
                <motion.span
                    variants={{
                        rest: { x: 0, color: fontColor },
                        hover: { x: 3, color: hoverFontColor },
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    {hasText && <span>{text}</span>}
                    <motion.div
                        variants={{
                            rest: { x: 0, y: 0, rotate: 0 },
                            hover: { x: 4, y: -4, rotate: -45 },
                        }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ display: "flex", alignItems: "center" }}
                        aria-hidden="true"
                    >
                        <ArrowIcon color={arrowColor} />
                    </motion.div>
                </motion.span>
            </motion.a>
        )
    }
    return (
        <motion.a
            {...linkProps}
            whileHover="hover"
            initial="rest"
            animate="rest"
            style={{ ...baseStyle, gap: 6, border: "none" }}
        >
            <motion.span
                style={{ position: "relative" }}
                variants={{
                    rest: { color: fontColor },
                    hover: { color: hoverFontColor },
                }}
            >
                {hasText && text}
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        bottom: -2,
                        left: 0,
                        height: 1.5,
                        background: "currentColor",
                        borderRadius: 2,
                        originX: 0,
                        width: "100%",
                    }}
                    variants={{
                        rest: { scaleX: 0, opacity: 0.6 },
                        hover: { scaleX: 1, opacity: 1 },
                    }}
                    transition={{
                        type: "tween",
                        ease: [0.22, 1, 0.36, 1],
                        duration: 0.32,
                    }}
                />
            </motion.span>
            <motion.div
                aria-hidden="true"
                style={{
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    width: 16,
                    height: 16,
                    position: "relative",
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        display: "flex",
                        color: fontColor,
                    }}
                    variants={{
                        rest: { x: 0, y: 0, opacity: 1 },
                        hover: { x: 10, y: -10, opacity: 0 },
                    }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                    <ArrowIcon color={arrowColor} />
                </motion.div>
                <motion.div
                    style={{
                        position: "absolute",
                        display: "flex",
                        color: hoverFontColor,
                    }}
                    variants={{
                        rest: { x: -10, y: 10, opacity: 0 },
                        hover: { x: 0, y: 0, opacity: 1 },
                    }}
                    transition={{
                        duration: 0.26,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.05,
                    }}
                >
                    <ArrowIcon color={arrowColor} />
                </motion.div>
            </motion.div>
        </motion.a>
    )
}
// ─────────────────────────────────────────────────────────────────────────
// VIDEO MODAL
// ─────────────────────────────────────────────────────────────────────────
const backdropStyles: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: 24,
    cursor: "pointer",
    overflow: "auto",
    overscrollBehavior: "contain",
}
const videoWrapStyles: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: 900,
    aspectRatio: "16 / 9",
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
    cursor: "default",
}
const closeButtonStyles: React.CSSProperties = {
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
}
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
            const first = items[0]
            const last = items[items.length - 1]
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
}: {
    videoUrl: string
    onClose: () => void
}) {
    const isStatic = useIsStaticRenderer()
    const backdropRef = useRef<HTMLDivElement>(null)
    const isYouTube = isYouTubeUrl(videoUrl)
    const youtubeId = extractYouTubeId(videoUrl)
    const titleId = useId()
    useFocusTrap(backdropRef, !isStatic)

    useEffect(() => {
        if (isStatic) return
        const ctx = gsap.context(() => {
            if (backdropRef.current) {
                gsap.fromTo(
                    backdropRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.25, ease: "power2.out" }
                )
                const videoEl =
                    backdropRef.current.querySelector(".modal-video-wrap")
                if (videoEl) {
                    gsap.fromTo(
                        videoEl,
                        { scale: 0.9, opacity: 0 },
                        {
                            scale: 1,
                            opacity: 1,
                            duration: 0.3,
                            ease: "back.out(1.4)",
                        }
                    )
                }
            }
        }, backdropRef.current)
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", handleKey)
        const backdropEl = backdropRef.current
        const shouldBlockScroll = (e: Event) => {
            const target = e.target as Node | null
            if (backdropEl && target && backdropEl.contains(target)) {
                return false
            }
            return true
        }
        const onWheel = (e: WheelEvent) => {
            if (shouldBlockScroll(e)) e.preventDefault()
        }
        const onTouchMove = (e: TouchEvent) => {
            if (shouldBlockScroll(e)) e.preventDefault()
        }
        window.addEventListener("wheel", onWheel, { passive: false })
        window.addEventListener("touchmove", onTouchMove, { passive: false })
        return () => {
            ctx.revert()
            window.removeEventListener("keydown", handleKey)
            window.removeEventListener("wheel", onWheel)
            window.removeEventListener("touchmove", onTouchMove)
        }
    }, [onClose, isStatic])
    if (isStatic) {
        return (
            <div style={backdropStyles} aria-hidden="true">
                <div
                    style={{
                        ...videoWrapStyles,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        background: "#111",
                        color: "#777",
                    }}
                >
                    <svg
                        width="56"
                        height="56"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        opacity={0.45}
                        aria-hidden="true"
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                        Video Preview
                    </span>
                </div>
            </div>
        )
    }
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current) onClose()
    }
    return (
        <div
            ref={backdropRef}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            style={backdropStyles}
        >
            <span
                id={titleId}
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                }}
            >
                Speaker video
            </span>
            <div
                className="modal-video-wrap"
                style={videoWrapStyles}
                onClick={(e) => e.stopPropagation()}
            >
                {isYouTube && youtubeId ? (
                    <iframe
                        title="Speaker video"
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
                    style={closeButtonStyles}
                    aria-label="Close video"
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
                        aria-hidden="true"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
// ─────────────────────────────────────────────────────────────────────────
// MEDIA PLAY BUTTON
// ─────────────────────────────────────────────────────────────────────────
function MediaPlayButton({
    onClick,
    size = 52,
    bgColor = "rgba(255,255,255,0.92)",
    iconColor = "#0a0a0a",
    speakerName = "speaker",
}: {
    onClick: (e: React.MouseEvent) => void
    size?: number
    bgColor?: string
    iconColor?: string
    speakerName?: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Play video for ${speakerName}`}
            title={`Play video for ${speakerName}`}
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: size,
                height: size,
                borderRadius: "50%",
                background: bgColor,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 5,
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
                width={size * 0.36}
                height={size * 0.36}
                viewBox="0 0 24 24"
                fill={iconColor}
                style={{ marginLeft: size * 0.04 }}
                aria-hidden="true"
            >
                <path d="M8 5v14l11-7z" />
            </svg>
        </button>
    )
}
const injectStyles = (
    componentId: string,
    bg: string,
    colorImage: boolean,
    borderRadius: number,
    nameHoverBg: string,
    cardBg: string,
    cardBorderColor: string,
    imagePosition: string,
    parallaxEffect: string,
    cardShadow: boolean,
    cardShadowColor: string,
    cardShadowBlur: number,
    cardShadowX: number,
    cardShadowY: number,
    cardShadowSpread: number
) => {
    if (typeof document === "undefined") return
    const id = `speakers-roster-styles-${componentId}`
    let style = document.getElementById(id) as HTMLStyleElement
    if (!style) {
        style = document.createElement("style")
        style.id = id
        document.head.appendChild(style)
    }
    const isRight = imagePosition === "right"
    const rosterFlexDir = isRight ? "row-reverse" : "row"
    const isFade = parallaxEffect === "fade"
    const isZoom = parallaxEffect === "zoom"
    const isBlur = parallaxEffect === "blur"
    const isSlide = parallaxEffect === "slide"
    const isCircle = parallaxEffect === "circle"
    const isDiagonal = parallaxEffect === "diagonal"
    const isCustomEffect =
        isFade || isZoom || isBlur || isSlide || isCircle || isDiagonal
    const cardShadowValue = cardShadow
        ? `${cardShadowX}px ${cardShadowY}px ${cardShadowBlur}px ${cardShadowSpread}px ${cardShadowColor}`
        : "none"
    const scope = `.roster-${componentId}`
    style.textContent = `
${scope}{
--bg: ${bg};
background: var(--bg);
--card-bg: ${cardBg};
--card-border: ${cardBorderColor};
--card-radius: ${borderRadius}px;
--name-hover-bg: ${nameHoverBg};
position:relative;
width:100%;
margin:auto;
padding:140px 20px;
display:flex;
justify-content:space-between;
gap:60px;
font-family:'Inter', Arial, sans-serif;
-webkit-font-smoothing:antialiased;
flex-direction: ${rosterFlexDir};
}
${scope} * { box-sizing: border-box; }
${scope}.is-mobile{
flex-direction: column !important;
width: 100%;
padding: 60px 0;
gap: 40px;
align-items: center;
}
${scope} .showcase-panel{
width:32%;
scroll-margin-top: 100px;
}
${scope}.is-mobile .showcase-panel{
width: 100%;
max-width: 420px;
scroll-margin-top: 20px;
}
${scope}.is-mobile .list-panel{
width: 100%;
}
${scope} .profile-card{
position:sticky;
top:80px;
background:var(--card-bg);
border:1px solid var(--card-border);
border-radius: var(--card-radius);
padding:14px;
box-shadow: ${cardShadowValue};
}
${scope}.is-mobile .profile-card{
position: relative;
top: auto;
padding: 12px;
}
${scope} .profile-card .media-frame{
position:relative;
overflow:hidden;
border-radius: calc(var(--card-radius) - 4px);
aspect-ratio:4/5;
background:var(--bg);
}
${scope} .parallax-track{
position:absolute;
left:0;
right:0;
top:-7%;
height:114%;
overflow:hidden;
}
${scope} .slide-layer{
position:absolute;
inset:0;
${isCustomEffect ? "" : "clip-path:inset(0% 0% 0% 0%);"}
opacity: 0;
z-index: 1;
}
${scope} .slide-layer .media-wrapper{
position:absolute;
left:0;
top:-25%;
width:100%;
height:150%;
}
${scope} .slide-layer img,
${scope} .slide-layer video,
${scope} .slide-layer iframe{
width:100% !important;
height:100% !important;
object-fit:cover !important;
object-position:center !important;
display:block;
position:absolute !important;
top:0 !important;
left:0 !important;
filter: ${colorImage ? "none" : "grayscale(100%)"};
}
${scope} .profile-meta{
margin-top:22px;
padding:0 6px 4px;
display: flex;
flex-direction: column;
gap: 2px;
}
${scope} .profile-meta h3{
margin:0;
line-height:1.3;
}
${scope} .profile-meta p{
margin:0;
line-height:1.4;
}
${scope} .profile-meta .meta-social{
display:flex;
align-items:center;
gap:14px;
margin-top:12px;
}
${scope} .profile-meta-extra{
margin-top:18px;
padding-top:18px;
border-top:1px solid var(--card-border);
display: flex;
flex-direction: column;
gap: 14px;
}
${scope}.is-mobile .profile-meta{
margin-top: 18px;
padding: 0 4px 6px;
}
${scope}.is-mobile .profile-meta-extra{
margin-top: 16px;
padding-top: 16px;
}
${scope} .profile-card.overlay .media-frame::after {
content: "";
position: absolute;
bottom: 0;
left: 0;
right: 0;
height: 60%;
background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
pointer-events: none;
z-index: 1;
}
${scope} .profile-card.overlay .profile-meta {
position: absolute;
bottom: 22px;
left: 22px;
right: 22px;
margin-top: 0;
padding: 0;
z-index: 2;
gap: 2px;
}
${scope} .profile-card.overlay .profile-meta .meta-social{
margin-top: 10px;
}
${scope} .profile-card.overlay .profile-meta-extra{
margin-top: 14px;
padding-top: 12px;
border-top: 1px solid rgba(255,255,255,0.2);
}
${scope}.is-mobile .profile-card.overlay .profile-meta{
bottom: 18px;
left: 18px;
right: 18px;
}
${scope} .profile-card.overlay .profile-meta h3,
${scope} .profile-card.overlay .profile-meta p {
text-shadow: 0 2px 8px rgba(0,0,0,0.4);
color: #fff !important;
}
${scope} .profile-card.overlay .profile-meta .meta-social a{
color: #fff !important;
}
${scope} .list-panel{ width:56%; position:relative; }
${scope} .cursor-indicator{
position:absolute;
left:${isRight ? "auto" : "-44px"};
right:${isRight ? "-44px" : "auto"};
top:0;
width:32px; height:32px;
opacity:0;
pointer-events:none;
}
${scope}.is-mobile .cursor-indicator{ display:none; }
${scope} .cursor-indicator svg{ width:100%; height:100%; display:block; }
${scope} .cursor-indicator path{ stroke: currentColor; }
${scope} .entry-item{
display:flex;
flex-wrap:wrap;
align-items:baseline;
gap:22px;
padding:34px 6px;
margin-bottom:14px;
border-radius:8px;
cursor:pointer;
user-select:none;
transition:background .25s ease;
}
${scope}.is-mobile .entry-item{
padding: 20px 8px;
gap: 16px;
margin-bottom: 8px;
}
${scope} .entry-item:hover{ background: var(--name-hover-bg); }
${scope} .entry-item:focus-visible{
outline:2px solid var(--accent, #0a0a0a);
outline-offset:4px;
}
${scope} .entry-header{
display:flex;
align-items:baseline;
gap:22px;
width:100%;
}
${scope}.is-mobile .entry-header{ gap: 16px; }
${scope} .entry-name{
word-break: break-word;
overflow-wrap: break-word;
line-height: 1.1;
}
${scope} .entry-desc{
width:100%;
padding-left:48px;
margin-top:14px;
max-height:0;
opacity:0;
overflow:hidden;
transform:translateY(-8px);
will-change:transform, opacity, max-height;
}
${scope}.is-mobile .entry-desc{
padding-left: 36px;
margin-top: 12px;
}
${scope} .entry-desc .desc-accent{
display:inline-block;
width:24px; height:1px;
vertical-align:middle;
margin-right:10px;
transform-origin:left center;
}
${scope} .status-badge{
position:absolute;
top:16px;
right:16px;
z-index:10;
display:flex;
align-items:center;
gap:8px;
padding:6px 12px;
border-radius:20px;
background:rgba(255,255,255,0.95);
backdrop-filter:blur(8px);
font-size:12px;
font-weight:500;
box-shadow:0 2px 8px rgba(0,0,0,0.1);
}
${scope}.is-mobile .status-badge{
top: 12px;
right: 12px;
padding: 5px 10px;
font-size: 11px;
}
${scope} .status-dot{
width:8px;
height:8px;
border-radius:50%;
position:relative;
}
${scope} .status-dot.pulse::before{
content:"";
position:absolute;
inset:-4px;
border-radius:50%;
background:inherit;
opacity:0.4;
animation:statusPulse 2s ease-in-out infinite;
}
@keyframes statusPulse{
0%,100%{transform:scale(1);opacity:0.4;}
50%{transform:scale(1.5);opacity:0;}
}
${scope} .skill-tags{
display:flex;
flex-wrap:wrap;
gap:8px;
}
${scope} .skill-tag{
padding:5px 12px;
border-radius:16px;
font-size:12px;
font-weight:500;
transition:all 0.2s ease;
}
${scope} .skeleton{
background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
background-size:200% 100%;
animation:skeletonLoading 1.5s ease-in-out infinite;
border-radius:8px;
}
@keyframes skeletonLoading{
0%{background-position:200% 0;}
100%{background-position:-200% 0;}
}
${scope} .skeleton-image{
width:100%;
aspect-ratio:4/5;
}
${scope} .skeleton-text{
height:16px;
margin-bottom:8px;
}
${scope} .skeleton-text.short{
width:60%;
}
${scope} .sr-only{
position:absolute;
width:1px;
height:1px;
padding:0;
margin:-1px;
overflow:hidden;
clip:rect(0,0,0,0);
white-space:nowrap;
border:0;
}
${scope} .roster-live-region{
position:absolute;
width:1px;
height:1px;
padding:0;
margin:-1px;
overflow:hidden;
clip:rect(0,0,0,0);
white-space:nowrap;
border:0;
}
@media(max-width:900px){
${scope}:not(.is-desktop){
padding:60px 20px;
gap:40px;
flex-direction: column !important;
align-items: center;
}
${scope}:not(.is-desktop) .showcase-panel{
width: 100%;
max-width: 420px;
scroll-margin-top: 20px;
}
${scope}:not(.is-desktop) .list-panel{
width: 100%;
}
${scope}:not(.is-desktop) .profile-card{
position: relative;
top: auto;
padding: 12px;
}
${scope}:not(.is-desktop) .profile-card.overlay .profile-meta { bottom: 18px; left: 18px; right: 18px; }
${scope}:not(.is-desktop) .profile-meta{ margin-top:18px; padding:0 4px 6px; }
${scope}:not(.is-desktop) .profile-meta-extra{ margin-top:16px; padding-top:16px; }
${scope}:not(.is-desktop) .entry-item{ padding:20px 8px; gap:16px; margin-bottom:8px; }
${scope}:not(.is-desktop) .entry-header { gap: 16px; }
${scope}:not(.is-desktop) .entry-desc{ padding-left:36px; margin-top:12px; }
${scope}:not(.is-desktop) .cursor-indicator{ display:none; }
${scope}:not(.is-desktop) .status-badge{ top:12px; right:12px; padding:5px 10px; font-size:11px; }
}
@media(max-width:560px){
${scope}:not(.is-desktop){ gap:24px; padding:40px 20px;  }
${scope}:not(.is-desktop) .showcase-panel{ max-width: 100%; }
${scope}:not(.is-desktop) .profile-card{ padding:10px; }
${scope}:not(.is-desktop) .profile-card.overlay .profile-meta { bottom: 14px; left: 14px; right: 14px; }
${scope}:not(.is-desktop) .profile-meta{ margin-top:16px; padding:0 2px 4px; }
${scope}:not(.is-desktop) .profile-meta-extra{ margin-top:14px; padding-top:14px; }
${scope}:not(.is-desktop) .entry-item{ padding:16px 4px; gap:12px; margin-bottom:4px; }
${scope}:not(.is-desktop) .entry-header { gap: 12px; }
${scope}:not(.is-desktop) .entry-desc{ padding-left:0px; margin-top:10px; }
${scope}:not(.is-desktop) .status-badge{ top:10px; right:10px; padding:4px 8px; font-size:10px; }
}
${scope}.is-static *,
${scope}.is-static *::before,
${scope}.is-static *::after{
animation:none !important;
transition:none !important;
scroll-behavior:auto !important;
}
${scope}.is-static .status-dot.pulse::before,
${scope}.is-static .skeleton{
animation:none !important;
}
@media (prefers-reduced-motion: reduce){
${scope} *,
${scope} *::before,
${scope} *::after{
animation-duration: 0.01ms !important;
animation-iteration-count: 1 !important;
transition-duration: 0.01ms !important;
scroll-behavior: auto !important;
}
${scope} .entry-item{ transition:none; }
${scope} .entry-desc{ transition:none; }
${scope} .status-dot.pulse::before{ animation:none; }
${scope} .skill-tag{ transition:none; }
${scope} .profile-card .media-frame img,
${scope} .profile-card .media-frame video{
transition: none !important;
}
}
`
}
// ─────────────────────────────────────────────────────────────────────────
// SOCIAL ICON COMPONENT
// ─────────────────────────────────────────────────────────────────────────
const SocialIcon = ({
    platform,
    url,
    color,
}: {
    platform: "linkedin" | "facebook" | "x"
    url: string
    color: string
}) => {
    const getIconPath = () => {
        switch (platform) {
            case "linkedin":
                return (
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                )
            case "facebook":
                return (
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                )
            case "x":
                return (
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                )
            default:
                return null
        }
    }
    const platformLabels: Record<string, string> = {
        linkedin: "LinkedIn",
        facebook: "Facebook",
        x: "X (Twitter)",
    }
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${platformLabels[platform]} profile`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                color: color,
                textDecoration: "none",
                opacity: 0.75,
                transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1"
                e.currentTarget.style.transform = "translateY(-1px)"
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.75"
                e.currentTarget.style.transform = "translateY(0)"
            }}
        >
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ width: "100%", height: "100%" }}
                aria-hidden="true"
                focusable="false"
            >
                {getIconPath()}
            </svg>
        </a>
    )
}
// ─────────────────────────────────────────────────────────────────────────
// STATUS BADGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────
const StatusBadge = ({
    status,
}: {
    status: { label: string; color: string; pulse?: boolean }
}) => {
    return (
        <div
            className="status-badge"
            role="status"
            aria-label={`Status: ${status.label}`}
        >
            <div
                className={`status-dot ${status.pulse ? "pulse" : ""}`}
                style={{ background: status.color }}
                aria-hidden="true"
            />
            <span>{status.label}</span>
        </div>
    )
}
// ─────────────────────────────────────────────────────────────────────────
// SKELETON LOADING COMPONENT
// ─────────────────────────────────────────────────────────────────────────
const SkeletonLoader = () => {
    return (
        <div className="profile-card" aria-hidden="true">
            <div className="media-frame">
                <div className="skeleton skeleton-image" />
            </div>
            <div className="profile-meta">
                <div
                    className="skeleton skeleton-text"
                    style={{ width: "70%" }}
                />
                <div className="skeleton skeleton-text short" />
            </div>
            <div className="profile-meta-extra">
                <div
                    className="skeleton skeleton-text"
                    style={{ width: "90%" }}
                />
            </div>
        </div>
    )
}
// ─────────────────────────────────────────────────────────────────────────
// TYPES & DEFAULT DATA
// ─────────────────────────────────────────────────────────────────────────
interface SocialLinks {
    linkedin?: string
    facebook?: string
    x?: string
}
interface StatusIndicator {
    label: string
    color: string
    pulse?: boolean
}
interface CTAButtonData {
    label: string
    link: any
}

export interface TeamMember {
    id?: string
    name: string
    image: string | { src?: string; srcSet?: string; alt?: string }
    video?: string | { src?: string }
    videoFile?: string
    videoDisplay?: "popup" | "background"
    role: string
    company: string
    desc: string
    social?: SocialLinks
    status?: StatusIndicator
    tags?: string[]
    cta?: CTAButtonData
    showStatus?: boolean
    showTags?: boolean
    showCTA?: boolean
}
interface FontConfig {
    fontFamily?: string
    fontWeight?: number | string
    fontSize?: number
    textTransform?: string
    letterSpacing?: string
    lineHeight?: number
    color?: string
}
const defaultTeam: TeamMember[] = [
    {
        id: "1",
        name: "Naledi Mokoena",
        image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&q=80",
        role: "Chief Data Scientist",
        company: "Meridian Health",
        desc: "Exploring how predictive analytics is reshaping patient outcomes across African healthcare systems.",
        social: {
            linkedin: "https://linkedin.com/in/naledimokoena",
            x: "https://x.com/naledimokoena",
        },
        status: { label: "Keynote Speaker", color: "#10b981", pulse: true },
        tags: ["AI", "Healthcare", "Analytics"],
        cta: {
            label: "View Research",
            link: { type: "url", url: "https://example.com/naledi" },
        },
        showStatus: true,
        showTags: true,
        showCTA: true,
        video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoDisplay: "popup",
    },
    {
        id: "2",
        name: "Tomás Rivera",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
        role: "VP of Design",
        company: "Figma",
        desc: "A deep dive into designing collaborative tools that feel invisible yet indispensable.",
        social: {
            linkedin: "https://linkedin.com/in/tomasrivera",
            facebook: "https://facebook.com/tomasrivera",
        },
        status: { label: "Available", color: "#3b82f6", pulse: false },
        tags: ["UX Design", "Product", "Collaboration"],
        cta: {
            label: "Read Bio",
            link: { type: "url", url: "https://example.com/tomas" },
        },
        showStatus: true,
        showTags: true,
        showCTA: true,
        video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoDisplay: "background",
    },
    {
        id: "3",
        name: "Yuki Sato",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80",
        role: "Robotics Lead",
        company: "Toyota Research",
        desc: "Bridging the gap between simulation and reality in next-generation autonomous systems.",
        social: { x: "https://x.com/yukisato" },
        status: { label: "Live Demo", color: "#ef4444", pulse: true },
        tags: ["Robotics", "Autonomous Systems", "Engineering"],
        showStatus: true,
        showTags: true,
        showCTA: false,
    },
    {
        id: "4",
        name: "Amara Chukwu",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80",
        role: "Founder and CEO",
        company: "Fenwick Energy",
        desc: "Scaling decentralized energy grids to power the next billion connected homes.",
        social: {
            linkedin: "https://linkedin.com/in/amarachukwu",
            facebook: "https://facebook.com/amarachukwu",
            x: "https://x.com/amarachukwu",
        },
        status: { label: "For Hire", color: "#f59e0b", pulse: true },
        tags: ["Energy", "Startups", "Leadership"],
        cta: {
            label: "Contact",
            link: { type: "email", email: "amara@example.com" },
        },
        showStatus: true,
        showTags: true,
        showCTA: true,
    },
    {
        id: "5",
        name: "Elena Petrova",
        image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=600&q=80",
        role: "Distinguished Engineer",
        company: "AWS",
        desc: "Architecting resilient cloud infrastructure for mission-critical global workloads.",
        tags: ["Cloud", "Infrastructure", "DevOps"],
        showStatus: false,
        showTags: true,
        showCTA: false,
    },
]
// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT (SpeakersRoster)
// ─────────────────────────────────────────────────────────────────────────
/**
 * @framerDisableUnlink
 */
export default function SpeakersRoster(props: any) {
    const { team = defaultTeam, style = {}, typography = {} } = props
    const {
        backgroundColor = "#ffffff",
        colorImage = false,
        overlayContent = false,
        borderRadius = 16,
        nameHoverBg = "rgba(0,0,0,0.02)",
        cardBackgroundColor = "#ffffff",
        cardBorderColor = "#e8e8e8",
        showDescription = true,
        imagePosition = "left",
        parallaxEffect = "parallax",
        cardShadow = false,
        cardShadowColor = "rgba(0,0,0,0.1)",
        cardShadowBlur = 20,
        cardShadowX = 0,
        cardShadowY = 10,
        cardShadowSpread = 0,
        ctaButtonStyle = "filled",
        ctaButtonBg = "#0a0a0a",
        ctaButtonColor = "#ffffff",
        ctaButtonHoverBg = "#333333",
        ctaButtonHoverColor = "#ffffff",
        ctaButtonBorderColor = "#0a0a0a",
        ctaButtonHoverBorderColor = "#333333",
        ctaButtonRadius = 100,
        ctaButtonPaddingX = 28,
        ctaButtonPaddingY = 14,
        ctaButtonTextTransform = "uppercase",
        ctaButtonArrowColor = "#ffffff",
        playIconSize = 52,
        playIconBgColor = "rgba(255,255,255,0.92)",
        playIconColor = "#0a0a0a",
    } = style as any
    const {
        nameFont = {},
        nameTextTransform = "none",
        nameColor = "#0a0a0a",
        nameColorInactive = "#d0d0d0",
        numFont = {},
        numColor = "#e8e8e8",
        numColorActive = "#0a0a0a",
        descFont = {},
        descColor = "#0a0a0a",
        descColorInactive = "#888888",
        roleFont = {},
        roleTextTransform = "none",
        roleColor = "#0a0a0a",
        companyFont = {},
        companyColor = "#888888",
        socialIconColor = "#0a0a0a",
        skillTagBgColor = "rgba(0,0,0,0.05)",
        skillTagTextColor = "#666666",
    } = typography
    const isStatic = useIsStaticRenderer()
    const rawId = useId()
    const componentId = rawId.replace(/[^a-zA-Z0-9]/g, "")
    const showcaseId = `${componentId}-showcase`
    const listId = `${componentId}-list`
    const liveRegionId = `${componentId}-live`
    const driftSTId = `driftST-${componentId}`
    // REFS
    const showcaseRef = useRef<HTMLDivElement>(null)
    const componentRootRef = useRef<HTMLDivElement>(null)
    const driftRef = useRef<HTMLDivElement>(null)
    const slideARef = useRef<HTMLDivElement>(null)
    const slideBRef = useRef<HTMLDivElement>(null)
    const innerARef = useRef<HTMLDivElement>(null)
    const innerBRef = useRef<HTMLDivElement>(null)
    const imgARef = useRef<HTMLImageElement>(null)
    const imgBRef = useRef<HTMLImageElement>(null)
    const videoARef = useRef<HTMLVideoElement>(null)
    const videoBRef = useRef<HTMLVideoElement>(null)
    const iframeARef = useRef<HTMLIFrameElement>(null)
    const iframeBRef = useRef<HTMLIFrameElement>(null)
    const roleRef = useRef<HTMLHeadingElement>(null)
    const companyRef = useRef<HTMLParagraphElement>(null)
    const pointerRef = useRef<HTMLDivElement>(null)
    const rightColRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const rowsRef = useRef<(HTMLDivElement | null)[]>([])
    const [activeIndex, setActiveIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(() => !isStatic)
    const [isMobile, setIsMobile] = useState(false)
    const [activeVideo, setActiveVideo] = useState<string | null>(null)
    const [announcement, setAnnouncement] = useState("")
    const isMobileRef = useRef(false)
    const openVideo = useCallback(
        (url: string) => {
            if (!isStatic && url) setActiveVideo(url)
        },
        [isStatic]
    )
    const closeVideo = useCallback(() => {
        setActiveVideo(null)
    }, [])
    useEffect(() => {
        injectStyles(
            componentId,
            backgroundColor,
            colorImage,
            borderRadius,
            nameHoverBg,
            cardBackgroundColor,
            cardBorderColor,
            imagePosition,
            parallaxEffect,
            cardShadow,
            cardShadowColor,
            cardShadowBlur,
            cardShadowX,
            cardShadowY,
            cardShadowSpread
        )
    }, [
        componentId,
        backgroundColor,
        colorImage,
        borderRadius,
        nameHoverBg,
        cardBackgroundColor,
        cardBorderColor,
        imagePosition,
        parallaxEffect,
        cardShadow,
        cardShadowColor,
        cardShadowBlur,
        cardShadowX,
        cardShadowY,
        cardShadowSpread,
    ])
    useEffect(() => {
        if (isStatic) return
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [isStatic])
    useEffect(() => {
        if (isStatic) return
        const person = team[activeIndex]
        if (!person) return
        const msg = `Now showing ${person.name}, ${person.role} at ${person.company}. ${activeIndex + 1} of ${team.length}.`
        setAnnouncement(msg)
    }, [activeIndex, team, isStatic])
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const MOBILE_BREAKPOINT = 900
        const measure = () => {
            const viewportWidth = window.innerWidth
            const parentWidth =
                componentRootRef.current?.parentElement?.offsetWidth ??
                viewportWidth
            const width = Math.min(viewportWidth, parentWidth)
            const mobile = width > 0 && width <= MOBILE_BREAKPOINT
            if (isMobileRef.current !== mobile) {
                isMobileRef.current = mobile
                setIsMobile(mobile)
            }
        }
        measure()
        let resizeObserver: ResizeObserver | null = null
        const parentEl = componentRootRef.current?.parentElement
        if (parentEl && typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => measure())
            resizeObserver.observe(parentEl)
        }
        window.addEventListener("resize", measure)
        return () => {
            window.removeEventListener("resize", measure)
            if (resizeObserver) resizeObserver.disconnect()
        }
    }, [isLoading, isStatic])
    const buildFontStyle = (
        font: FontConfig,
        fallbackColor?: string
    ): React.CSSProperties => {
        const style: React.CSSProperties = {}
        if (font.fontFamily) style.fontFamily = font.fontFamily
        if (font.fontWeight) style.fontWeight = font.fontWeight as any
        if (font.fontSize !== undefined && font.fontSize !== null)
            style.fontSize = `${font.fontSize}`
        if (font.textTransform) style.textTransform = font.textTransform as any
        if (font.letterSpacing) style.letterSpacing = font.letterSpacing
        if (font.lineHeight) style.lineHeight = font.lineHeight
        if (font.color) style.color = font.color
        else if (fallbackColor) style.color = fallbackColor
        return style
    }
    const getNameStyle = (isActive: boolean): React.CSSProperties => ({
        ...buildFontStyle(nameFont),
        textTransform: nameTextTransform as any,
        color: isActive ? nameColor : nameColorInactive,
    })
    const getNumStyle = (isActive: boolean): React.CSSProperties => ({
        ...buildFontStyle(numFont),
        color: isActive ? numColorActive : numColor,
    })
    const getDescStyle = (isActive: boolean): React.CSSProperties => ({
        ...buildFontStyle(descFont),
        color: isActive ? descColor : descColorInactive,
    })
    const getRoleStyle = (): React.CSSProperties => ({
        ...buildFontStyle(roleFont),
        textTransform: roleTextTransform as any,
        color: roleColor,
    })
    const getCompanyStyle = (): React.CSSProperties => ({
        ...buildFontStyle(companyFont),
        color: companyColor,
    })
    const renderProfileMeta = (person: TeamMember, isOverlay: boolean) => {
        const hasSocial =
            person.social && Object.values(person.social).some(Boolean)
        return (
            <>
                <h3 style={getRoleStyle()}>{person.role}</h3>
                <p style={getCompanyStyle()}>{person.company}</p>
                {hasSocial && (
                    <div
                        className="meta-social"
                        role="list"
                        aria-label="Social links"
                    >
                        {person.social!.linkedin && (
                            <div role="listitem">
                                <SocialIcon
                                    platform="linkedin"
                                    url={person.social!.linkedin!}
                                    color={socialIconColor}
                                />
                            </div>
                        )}
                        {person.social!.facebook && (
                            <div role="listitem">
                                <SocialIcon
                                    platform="facebook"
                                    url={person.social!.facebook!}
                                    color={socialIconColor}
                                />
                            </div>
                        )}
                        {person.social!.x && (
                            <div role="listitem">
                                <SocialIcon
                                    platform="x"
                                    url={person.social!.x!}
                                    color={socialIconColor}
                                />
                            </div>
                        )}
                    </div>
                )}
            </>
        )
    }
    const renderProfileExtra = (person: TeamMember) => {
        const hasTags =
            person.showTags !== false && person.tags && person.tags.length > 0
        const hasCTA = person.showCTA !== false && person.cta && person.cta.link
        if (!hasTags && !hasCTA) return null
        return (
            <div className="profile-meta-extra">
                {hasTags && (
                    <div className="skill-tags" aria-label="Skills">
                        {person.tags!.map((tag, i) => (
                            <span
                                key={i}
                                className="skill-tag"
                                style={{
                                    background: skillTagBgColor,
                                    color: skillTagTextColor,
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                {hasCTA && (
                    <CardButton
                        text={person.cta!.label}
                        href={resolveLink(person.cta!.link).href}
                        target={resolveLink(person.cta!.link).target}
                        rel={resolveLink(person.cta!.link).rel}
                        isStatic={isStatic}
                        buttonStyle={ctaButtonStyle as ButtonStyle}
                        bgColor={ctaButtonBg}
                        fontColor={ctaButtonColor}
                        hoverBgColor={ctaButtonHoverBg}
                        hoverFontColor={ctaButtonHoverColor}
                        borderColor={ctaButtonBorderColor}
                        hoverBorderColor={ctaButtonHoverBorderColor}
                        borderRadius={ctaButtonRadius}
                        paddingX={ctaButtonPaddingX}
                        paddingY={ctaButtonPaddingY}
                        textTransform={ctaButtonTextTransform as TextTransform}
                        arrowColor={ctaButtonArrowColor}
                    />
                )}
            </div>
        )
    }
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        if (isLoading) return
        gsap.registerPlugin(ScrollTrigger)
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const isFade = parallaxEffect === "fade"
        const isZoom = parallaxEffect === "zoom"
        const isBlur = parallaxEffect === "blur"
        const isSlide = parallaxEffect === "slide"
        const isCircle = parallaxEffect === "circle"
        const isDiagonal = parallaxEffect === "diagonal"
        const isCustomEffect =
            isFade || isZoom || isBlur || isSlide || isCircle || isDiagonal
        const rows = rowsRef.current.filter(
            (r) => r !== null
        ) as HTMLDivElement[]
        let activeLayer: "A" | "B" = "A"
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

        let isVisible = true
        let observer: IntersectionObserver | null = null

        const syncMediaPlayback = (forceStop = false) => {
            const shouldPlay = !forceStop && isVisible && !document.hidden

            ;[videoARef.current, videoBRef.current].forEach((video) => {
                if (!video) return
                if (shouldPlay) {
                    video.play().catch(() => {})
                } else {
                    video.pause()
                }
            })
            ;[iframeARef.current, iframeBRef.current].forEach((frame) => {
                if (!frame?.contentWindow) return
                frame.contentWindow.postMessage(
                    JSON.stringify({
                        event: "command",
                        func: shouldPlay ? "playVideo" : "pauseVideo",
                        args: "",
                    }),
                    "*"
                )
            })
        }

        if (
            typeof window !== "undefined" &&
            "IntersectionObserver" in window &&
            componentRootRef.current
        ) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    isVisible = entry.isIntersecting
                    syncMediaPlayback()
                },
                { threshold: 0.25 }
            )
            observer.observe(componentRootRef.current)
        }

        const handleVisibility = () => {
            syncMediaPlayback()
        }
        document.addEventListener("visibilitychange", handleVisibility)

        const beginProgrammaticScroll = () => {
            programmaticScroll = true
            if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer)
            programmaticScrollTimer = setTimeout(() => {
                programmaticScroll = false
            }, 900)
        }
        const handleScrollEnd = () => {
            programmaticScroll = false
            if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer)
        }
        window.addEventListener("scrollend", handleScrollEnd)
        const positionPointer = (index: number, animate: boolean) => {
            const row = rows[index]
            if (!row || !pointerRef.current) return
            const targetTop = row.offsetTop + row.offsetHeight / 2 - 16
            const shouldAnimate = animate && !reduced
            if (shouldAnimate) {
                gsap.to(pointerRef.current, {
                    top: targetTop,
                    duration: 0.55,
                    ease: "power3.out",
                    overwrite: true,
                })
            } else {
                gsap.set(pointerRef.current, { top: targetTop })
            }
        }
        const animateDescription = (
            prevIndex: number | null,
            nextIndex: number
        ) => {
            if (!showDescription) return
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
                    if (prevDesc) {
                        gsap.to(prevDesc, {
                            opacity: 0,
                            y: -8,
                            duration: 0.35,
                            ease: "power2.in",
                            onComplete: () => {
                                gsap.set(prevDesc, { maxHeight: 0 })
                            },
                        })
                    }
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
            setActiveIndex(index)
            rows.forEach((r) => r.classList.remove("active"))
            if (rows[index]) rows[index].classList.add("active")
            positionPointer(index, true)
            animateDescription(prevIndex, index)
            const person = team[index]
            if (!person) return
            const seq = ++transitionSeq
            const outgoing =
                activeLayer === "A"
                    ? {
                          slide: slideARef.current,
                          inner: innerARef.current,
                          img: imgARef.current,
                          video: videoARef.current,
                          iframe: iframeARef.current,
                      }
                    : {
                          slide: slideBRef.current,
                          inner: innerBRef.current,
                          img: imgBRef.current,
                          video: videoBRef.current,
                          iframe: iframeBRef.current,
                      }
            const incoming =
                activeLayer === "A"
                    ? {
                          slide: slideBRef.current,
                          inner: innerBRef.current,
                          img: imgBRef.current,
                          video: videoBRef.current,
                          iframe: iframeBRef.current,
                      }
                    : {
                          slide: slideARef.current,
                          inner: innerARef.current,
                          img: imgARef.current,
                          video: videoARef.current,
                          iframe: iframeARef.current,
                      }
            if (
                !incoming.img ||
                !outgoing.slide ||
                !incoming.slide ||
                !outgoing.inner ||
                !incoming.inner
            )
                return
            const videoSrc =
                getVideoSrc(person.videoFile) || getVideoSrc(person.video)
            const videoDisplay = person.videoDisplay || "popup"
            const playAsBackground = !!videoSrc && videoDisplay === "background"
            const isBgYouTube = playAsBackground && isYouTubeUrl(videoSrc)
            const isBgFile = playAsBackground && !isBgYouTube
            if (isBgFile && incoming.video) {
                incoming.video.src = videoSrc
                incoming.video.style.cssText = `
display: block;
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
object-fit: cover;
object-position: center;
`
                incoming.img.style.display = "none"
                if (incoming.iframe) {
                    incoming.iframe.src = ""
                    incoming.iframe.style.display = "none"
                }
                requestAnimationFrame(() => syncMediaPlayback())
            } else if (isBgYouTube && incoming.iframe) {
                const ytId = extractYouTubeId(videoSrc)
                const autoplay = isVisible ? 1 : 0
                incoming.iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&autoplay=${autoplay}&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&playsinline=1&rel=0`
                incoming.iframe.style.display = "block"
                incoming.img.style.display = "none"
                if (incoming.video) incoming.video.style.display = "none"
                requestAnimationFrame(() => syncMediaPlayback())
            } else {
                incoming.img.src = getImageSrc(person.image)
                incoming.img.style.display = "block"
                if (incoming.video) incoming.video.style.display = "none"
                if (incoming.iframe) {
                    incoming.iframe.src = ""
                    incoming.iframe.style.display = "none"
                }
            }
            if (outgoing.video) outgoing.video.pause()
            if (outgoing.iframe) outgoing.iframe.src = ""
            activeLayer = activeLayer === "A" ? "B" : "A"
            if (reduced) {
                gsap.set(outgoing.slide, { opacity: 0, zIndex: 1 })
                gsap.set(incoming.slide, {
                    opacity: 1,
                    zIndex: 2,
                })
                if (!isCustomEffect) {
                    gsap.set(outgoing.slide, { clipPath: "inset(0% 0% 0% 0%)" })
                    gsap.set(incoming.slide, { clipPath: "inset(0% 0% 0% 0%)" })
                }
                gsap.set([outgoing.inner, incoming.inner], { yPercent: 0 })
                if (roleRef.current) roleRef.current.textContent = person.role
                if (companyRef.current)
                    companyRef.current.textContent = person.company
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
                if (isFade) {
                    gsap.set(outgoing.slide, { zIndex: 1, opacity: 1 })
                    gsap.set(incoming.slide, { zIndex: 2, opacity: 0 })
                    wipeTl = gsap.timeline({
                        onComplete: () => {
                            if (seq !== transitionSeq) return
                            gsap.set(outgoing.slide, { opacity: 0 })
                        },
                    })
                    wipeTl.to(
                        outgoing.slide,
                        { opacity: 0, duration: 0.6, ease: "power2.inOut" },
                        0
                    )
                    wipeTl.to(
                        incoming.slide,
                        { opacity: 1, duration: 0.6, ease: "power2.inOut" },
                        0
                    )
                } else if (isZoom) {
                    gsap.set(outgoing.slide, {
                        zIndex: 1,
                        opacity: 1,
                        scale: 1,
                    })
                    gsap.set(incoming.slide, {
                        zIndex: 2,
                        opacity: 1,
                        scale: 1.1,
                    })
                    wipeTl = gsap.timeline({
                        onComplete: () => {
                            if (seq !== transitionSeq) return
                            gsap.set(outgoing.slide, { opacity: 0, scale: 1 })
                        },
                    })
                    wipeTl.to(
                        outgoing.slide,
                        {
                            scale: 1.2,
                            opacity: 0,
                            duration: 0.7,
                            ease: "power2.inOut",
                        },
                        0
                    )
                    wipeTl.to(
                        incoming.slide,
                        { scale: 1, duration: 0.7, ease: "power2.inOut" },
                        0
                    )
                } else if (isBlur) {
                    gsap.set(outgoing.slide, {
                        zIndex: 1,
                        opacity: 1,
                        filter: "blur(0px)",
                    })
                    gsap.set(incoming.slide, {
                        zIndex: 2,
                        opacity: 0,
                        filter: "blur(10px)",
                    })
                    wipeTl = gsap.timeline({
                        onComplete: () => {
                            if (seq !== transitionSeq) return
                            gsap.set(outgoing.slide, {
                                opacity: 0,
                                filter: "blur(0px)",
                            })
                        },
                    })
                    wipeTl.to(
                        outgoing.slide,
                        {
                            filter: "blur(10px)",
                            opacity: 0,
                            duration: 0.6,
                            ease: "power2.inOut",
                        },
                        0
                    )
                    wipeTl.to(
                        incoming.slide,
                        {
                            filter: "blur(0px)",
                            opacity: 1,
                            duration: 0.6,
                            ease: "power2.inOut",
                        },
                        0
                    )
                } else if (isSlide) {
                    const startX = dir > 0 ? "100%" : "-100%"
                    const endX = dir > 0 ? "-100%" : "100%"
                    gsap.set(outgoing.slide, { zIndex: 1, opacity: 1, x: "0%" })
                    gsap.set(incoming.slide, {
                        zIndex: 2,
                        opacity: 1,
                        x: startX,
                    })
                    wipeTl = gsap.timeline({
                        onComplete: () => {
                            if (seq !== transitionSeq) return
                            gsap.set(outgoing.slide, { opacity: 0, x: "0%" })
                        },
                    })
                    wipeTl.to(
                        outgoing.slide,
                        { x: endX, duration: 0.7, ease: "power2.inOut" },
                        0
                    )
                    wipeTl.to(
                        incoming.slide,
                        { x: "0%", duration: 0.7, ease: "power2.inOut" },
                        0
                    )
                } else if (isCircle) {
                    gsap.set(outgoing.slide, {
                        zIndex: 1,
                        opacity: 1,
                        clipPath: "circle(150% at 50% 50%)",
                    })
                    gsap.set(incoming.slide, {
                        zIndex: 2,
                        opacity: 1,
                        clipPath: "circle(0% at 50% 50%)",
                    })
                    wipeTl = gsap.timeline({
                        onComplete: () => {
                            if (seq !== transitionSeq) return
                            gsap.set(outgoing.slide, { opacity: 0 })
                        },
                    })
                    wipeTl.to(
                        outgoing.slide,
                        {
                            clipPath: "circle(0% at 50% 50%)",
                            duration: 0.8,
                            ease: "power2.inOut",
                        },
                        0
                    )
                    wipeTl.to(
                        incoming.slide,
                        {
                            clipPath: "circle(150% at 50% 50%)",
                            duration: 0.8,
                            ease: "power2.inOut",
                        },
                        0
                    )
                } else if (isDiagonal) {
                    gsap.set(outgoing.slide, {
                        zIndex: 1,
                        opacity: 1,
                        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                    })
                    gsap.set(incoming.slide, {
                        zIndex: 2,
                        opacity: 1,
                        clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
                    })
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
                                "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
                            duration: 0.8,
                            ease: "power2.inOut",
                        },
                        0
                    )
                    wipeTl.to(
                        incoming.slide,
                        {
                            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                            duration: 0.8,
                            ease: "power2.inOut",
                        },
                        0
                    )
                } else {
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
                }
                wipeTl.add(() => {
                    if (seq !== transitionSeq) return
                    if (roleRef.current)
                        roleRef.current.textContent = person.role
                    if (companyRef.current)
                        companyRef.current.textContent = person.company
                }, 0.1)
            }
            if (isBgFile || !playAsBackground) {
                if (incoming.img.complete) runWipe()
                else {
                    incoming.img.onload = runWipe
                    incoming.img.onerror = runWipe
                }
            } else {
                runWipe()
            }
            if (contentRef.current) {
                gsap.fromTo(
                    contentRef.current,
                    { y: 16, opacity: 0.4 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.6,
                        delay: 0.1,
                        ease: "power3.out",
                        overwrite: true,
                    }
                )
            }
            if (
                !isCustomEffect &&
                !fromScroll &&
                !reduced &&
                driftRef.current
            ) {
                const st = ScrollTrigger.getById(driftSTId)
                if (st) {
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
        if (slideARef.current)
            gsap.set(slideARef.current, {
                opacity: 1,
                zIndex: 2,
                ...(isCustomEffect ? {} : { clipPath: "inset(0% 0% 0% 0%)" }),
            })
        if (slideBRef.current)
            gsap.set(slideBRef.current, { opacity: 0, zIndex: 1 })
        if (pointerRef.current) gsap.set(pointerRef.current, { opacity: 1 })
        {
            const first = team[0]
            if (first) {
                const videoSrc0 =
                    getVideoSrc(first.videoFile) || getVideoSrc(first.video)
                const videoDisplay0 = first.videoDisplay || "popup"
                const playBg0 = !!videoSrc0 && videoDisplay0 === "background"
                const isYt0 = playBg0 && isYouTubeUrl(videoSrc0)
                if (playBg0 && !isYt0 && videoARef.current) {
                    videoARef.current.src = videoSrc0
                    videoARef.current.style.cssText = `
display: block;
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
object-fit: cover;
object-position: center;
`
                    if (imgARef.current) imgARef.current.style.display = "none"
                    requestAnimationFrame(() => syncMediaPlayback())
                } else if (isYt0 && iframeARef.current) {
                    const ytId0 = extractYouTubeId(videoSrc0)
                    const autoplay0 = isVisible ? 1 : 0
                    iframeARef.current.src = `https://www.youtube-nocookie.com/embed/${ytId0}?enablejsapi=1&autoplay=${autoplay0}&mute=1&loop=1&playlist=${ytId0}&controls=0&modestbranding=1&playsinline=1&rel=0`
                    iframeARef.current.style.display = "block"
                    if (imgARef.current) imgARef.current.style.display = "none"
                    requestAnimationFrame(() => syncMediaPlayback())
                }
            }
        }
        rows.forEach((row, i) => {
            const desc = row.querySelector(".entry-desc") as HTMLElement
            const accent = desc?.querySelector(".desc-accent") as HTMLElement
            if (i === 0) {
                row.classList.add("active")
                if (showDescription) {
                    if (desc)
                        gsap.set(desc, { maxHeight: "200px", opacity: 1, y: 0 })
                    if (accent) gsap.set(accent, { scaleX: 1 })
                } else {
                    if (desc)
                        gsap.set(desc, { maxHeight: 0, opacity: 0, y: -8 })
                    if (accent) gsap.set(accent, { scaleX: 0 })
                }
            } else {
                if (desc) gsap.set(desc, { maxHeight: 0, opacity: 0, y: -8 })
                if (accent) gsap.set(accent, { scaleX: 0 })
            }
        })
        if (
            !isCustomEffect &&
            !reduced &&
            !isMobileRef.current &&
            driftRef.current &&
            rightColRef.current
        ) {
            const st = ScrollTrigger.create({
                id: driftSTId,
                trigger: rightColRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
                onUpdate: (self) => {
                    if (
                        !isMobileRef.current &&
                        (!driftTween || !driftTween.isActive())
                    ) {
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
            if (!isMobileRef.current) {
                const st = ScrollTrigger.create({
                    trigger: row,
                    start: "top center",
                    end: "bottom center",
                    onEnter: () => {
                        if (!programmaticScroll && !isMobileRef.current)
                            changeCard(index, true)
                    },
                    onEnterBack: () => {
                        if (!programmaticScroll && !isMobileRef.current)
                            changeCard(index, true)
                    },
                    invalidateOnRefresh: true,
                })
                scrollTriggers.push(st)
            }
            const handleClick = () => {
                changeCard(index, false)
                beginProgrammaticScroll()
                if (isMobileRef.current) {
                    if (showcaseRef.current) {
                        showcaseRef.current.scrollIntoView({
                            behavior: reduced ? "auto" : "smooth",
                            block: "start",
                        })
                    }
                } else {
                    const isFirst = index === 0
                    const isLast = index === team.length - 1
                    if (!isFirst && !isLast) {
                        row.scrollIntoView({
                            behavior: reduced ? "auto" : "smooth",
                            block: "center",
                        })
                    } else {
                        const rect = row.getBoundingClientRect()
                        const isVisible =
                            rect.top >= 0 &&
                            rect.bottom <=
                                (window.innerHeight ||
                                    document.documentElement.clientHeight)
                        if (!isVisible) {
                            row.scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: isFirst ? "start" : "end",
                                inline: "nearest",
                            })
                        }
                    }
                }
            }
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    changeCard(index, false)
                    beginProgrammaticScroll()
                    if (isMobileRef.current) {
                        if (showcaseRef.current)
                            showcaseRef.current.scrollIntoView({
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
                if (e.key === "ArrowDown") {
                    e.preventDefault()
                    const nextIndex = Math.min(index + 1, team.length - 1)
                    if (nextIndex !== index) {
                        changeCard(nextIndex, false)
                        beginProgrammaticScroll()
                        if (isMobileRef.current) {
                            if (showcaseRef.current)
                                showcaseRef.current.scrollIntoView({
                                    behavior: reduced ? "auto" : "smooth",
                                    block: "start",
                                })
                        } else {
                            rows[nextIndex]?.scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "center",
                            })
                        }
                        rows[nextIndex]?.focus()
                    }
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault()
                    const prevIndex = Math.max(index - 1, 0)
                    if (prevIndex !== index) {
                        changeCard(prevIndex, false)
                        beginProgrammaticScroll()
                        if (isMobileRef.current) {
                            if (showcaseRef.current)
                                showcaseRef.current.scrollIntoView({
                                    behavior: reduced ? "auto" : "smooth",
                                    block: "start",
                                })
                        } else {
                            rows[prevIndex]?.scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "center",
                            })
                        }
                        rows[prevIndex]?.focus()
                    }
                }
                if (e.key === "Home") {
                    e.preventDefault()
                    if (index !== 0) {
                        changeCard(0, false)
                        beginProgrammaticScroll()
                        rows[0]?.focus()
                        if (isMobileRef.current && showcaseRef.current) {
                            showcaseRef.current.scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "start",
                            })
                        } else if (rows[0]) {
                            rows[0].scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "start",
                            })
                        }
                    }
                }
                if (e.key === "End") {
                    e.preventDefault()
                    const lastIndex = team.length - 1
                    if (index !== lastIndex) {
                        changeCard(lastIndex, false)
                        beginProgrammaticScroll()
                        rows[lastIndex]?.focus()
                        if (isMobileRef.current && showcaseRef.current) {
                            showcaseRef.current.scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "start",
                            })
                        } else if (rows[lastIndex]) {
                            rows[lastIndex].scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "end",
                            })
                        }
                    }
                }
                if (e.key === "PageUp") {
                    e.preventDefault()
                    const target = Math.max(0, index - 3)
                    if (target !== index) {
                        changeCard(target, false)
                        beginProgrammaticScroll()
                        rows[target]?.focus()
                        if (rows[target]) {
                            rows[target].scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "center",
                            })
                        }
                    }
                }
                if (e.key === "PageDown") {
                    e.preventDefault()
                    const target = Math.min(team.length - 1, index + 3)
                    if (target !== index) {
                        changeCard(target, false)
                        beginProgrammaticScroll()
                        rows[target]?.focus()
                        if (rows[target]) {
                            rows[target].scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "center",
                            })
                        }
                    }
                }
                if (/^[1-9]$/.test(e.key)) {
                    const numIndex = parseInt(e.key, 10) - 1
                    if (numIndex < team.length && numIndex !== index) {
                        e.preventDefault()
                        changeCard(numIndex, false)
                        beginProgrammaticScroll()
                        rows[numIndex]?.focus()
                        if (rows[numIndex]) {
                            rows[numIndex].scrollIntoView({
                                behavior: reduced ? "auto" : "smooth",
                                block: "center",
                            })
                        }
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
            ScrollTrigger.refresh()
            positionPointer(currentIndex, false)
        }
        refreshAll()
        if (!reduced && !isMobileRef.current && pointerRef.current) {
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
            document.removeEventListener("visibilitychange", handleVisibility)

            eventListeners.forEach((h) => {
                h.el.removeEventListener("click", h.click)
                h.el.removeEventListener("keydown", h.keydown)
            })
            scrollTriggers.forEach((st) => st.kill())

            if (wipeTl) wipeTl.kill()
            if (driftTween) driftTween.kill()
            if (pointerBounce) pointerBounce.kill()

            if (observer) observer.disconnect()

            // Force stop all media on unmount
            syncMediaPlayback(true)
        }
    }, [
        isStatic,
        team,
        showDescription,
        isLoading,
        isMobile,
        parallaxEffect,
        driftSTId,
    ])
    if (isLoading) {
        return (
            <div
                ref={componentRootRef}
                className={`roster roster-${componentId} ${isMobile ? "is-mobile" : "is-desktop"}`}
                role="region"
                aria-label="Speaker roster"
                aria-busy="true"
            >
                <div className="showcase-panel">
                    <SkeletonLoader />
                </div>
                <div className="list-panel">
                    {team.map((_, i) => (
                        <div key={i} className="entry-item">
                            <div className="entry-header">
                                <div
                                    className="skeleton"
                                    style={{ width: "24px", height: "16px" }}
                                />
                                <div
                                    className="skeleton"
                                    style={{ width: "200px", height: "48px" }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    if (isStatic) {
        const person = team[0]
        const videoSrc =
            getVideoSrc(person.videoFile) || getVideoSrc(person.video)
        const hasVideoStatic = !!videoSrc
        const playBadge = hasVideoStatic && (
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.92)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
                    zIndex: 5,
                }}
            >
                <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="#0a0a0a"
                    aria-hidden="true"
                >
                    <path d="M8 5v14l11-7z" />
                </svg>
            </div>
        )
        if (isMobile) {
            return (
                <div
                    ref={componentRootRef}
                    className={`roster roster-${componentId} is-mobile is-static`}
                    style={{ padding: "20px 0" }}
                    role="region"
                    aria-label="Speaker roster"
                >
                    <div className="showcase-panel">
                        <div
                            className={`profile-card ${overlayContent ? "overlay" : ""}`}
                        >
                            <div className="media-frame">
                                {person.showStatus !== false &&
                                    person.status && (
                                        <StatusBadge status={person.status} />
                                    )}
                                <img
                                    src={getImageSrc(person.image)}
                                    alt={`Portrait of ${person.name}`}
                                    loading="eager"
                                    decoding="async"
                                    fetchPriority="high"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        filter: colorImage
                                            ? "none"
                                            : "grayscale(100%)",
                                    }}
                                />
                                {playBadge}
                                {overlayContent && (
                                    <div className="profile-meta">
                                        {renderProfileMeta(person, true)}
                                    </div>
                                )}
                            </div>
                            {!overlayContent && (
                                <div className="profile-meta">
                                    {renderProfileMeta(person, false)}
                                </div>
                            )}
                            {renderProfileExtra(person)}
                        </div>
                    </div>
                    <div className="list-panel">
                        {team.map((s, i) => (
                            <div
                                key={i}
                                className={`entry-item ${i === 0 ? "active" : ""}`}
                            >
                                <div className="entry-header">
                                    <span
                                        className="entry-num"
                                        style={getNumStyle(i === 0)}
                                        aria-hidden="true"
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <h2
                                        className="entry-name"
                                        style={getNameStyle(i === 0)}
                                    >
                                        {s.name}
                                    </h2>
                                </div>
                                {showDescription && (
                                    <p
                                        className="entry-desc"
                                        style={{
                                            ...getDescStyle(i === 0),
                                            maxHeight: "200px",
                                            opacity: 1,
                                            transform: "none",
                                        }}
                                    >
                                        <span
                                            className="desc-accent"
                                            style={{
                                                background: descColor,
                                                transform: "scaleX(1)",
                                            }}
                                            aria-hidden="true"
                                        ></span>
                                        {s.desc}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return (
            <div
                ref={componentRootRef}
                className={`roster roster-${componentId} is-desktop is-static`}
                style={{ padding: "40px 0" }}
                role="region"
                aria-label="Speaker roster"
            >
                <div className="showcase-panel" ref={showcaseRef}>
                    <div
                        className={`profile-card ${overlayContent ? "overlay" : ""}`}
                    >
                        <div className="media-frame">
                            {person.showStatus !== false && person.status && (
                                <StatusBadge status={person.status} />
                            )}
                            <img
                                src={getImageSrc(person.image)}
                                alt={`Portrait of ${person.name}`}
                                loading="eager"
                                decoding="async"
                                fetchPriority="high"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    filter: colorImage
                                        ? "none"
                                        : "grayscale(100%)",
                                }}
                            />
                            {playBadge}
                            {overlayContent && (
                                <div className="profile-meta">
                                    {renderProfileMeta(person, true)}
                                </div>
                            )}
                        </div>
                        {!overlayContent && (
                            <div className="profile-meta">
                                {renderProfileMeta(person, false)}
                            </div>
                        )}
                        {renderProfileExtra(person)}
                    </div>
                </div>
                <div className="list-panel">
                    {team.map((s, i) => (
                        <div
                            key={i}
                            className={`entry-item ${i === 0 ? "active" : ""}`}
                        >
                            <div className="entry-header">
                                <span
                                    className="entry-num"
                                    style={getNumStyle(i === 0)}
                                    aria-hidden="true"
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <h2
                                    className="entry-name"
                                    style={getNameStyle(i === 0)}
                                >
                                    {s.name}
                                </h2>
                            </div>
                            {showDescription && (
                                <p
                                    className="entry-desc"
                                    style={{
                                        ...getDescStyle(i === 0),
                                        maxHeight: "200px",
                                        opacity: 1,
                                        transform: "none",
                                    }}
                                >
                                    <span
                                        className="desc-accent"
                                        style={{
                                            background: descColor,
                                            transform: "scaleX(1)",
                                        }}
                                        aria-hidden="true"
                                    ></span>
                                    {s.desc}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    const activePerson = team[activeIndex]
    const activeVideoSrc =
        (activePerson &&
            (getVideoSrc(activePerson.videoFile) ||
                getVideoSrc(activePerson.video))) ||
        ""
    const playButton = activeVideoSrc && (
        <MediaPlayButton
            size={playIconSize}
            bgColor={playIconBgColor}
            iconColor={playIconColor}
            speakerName={activePerson?.name || "speaker"}
            onClick={(e) => {
                e.stopPropagation()
                openVideo(activeVideoSrc)
            }}
        />
    )
    if (isMobile) {
        return (
            <section
                className={`roster roster-${componentId} is-mobile`}
                ref={componentRootRef}
                role="region"
                aria-label="Speaker roster"
            >
                <div
                    id={liveRegionId}
                    className="roster-live-region"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {announcement}
                </div>
                <div
                    className="showcase-panel"
                    ref={showcaseRef}
                    id={showcaseId}
                    aria-label="Speaker profile"
                >
                    <div
                        className={`profile-card ${overlayContent ? "overlay" : ""}`}
                    >
                        <div className="media-frame">
                            {activePerson.showStatus !== false &&
                                activePerson.status && (
                                    <StatusBadge status={activePerson.status} />
                                )}
                            <div className="parallax-track" ref={driftRef}>
                                <div className="slide-layer" ref={slideARef}>
                                    <div
                                        className="media-wrapper"
                                        ref={innerARef}
                                    >
                                        <img
                                            ref={imgARef}
                                            src={getImageSrc(team[0]?.image)}
                                            alt=""
                                            role="presentation"
                                            loading="eager"
                                            decoding="async"
                                            fetchPriority="high"
                                        />
                                        <video
                                            ref={videoARef}
                                            loop
                                            muted
                                            playsInline
                                            preload="none"
                                            style={{
                                                display: "none",
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                            aria-hidden="true"
                                        />
                                        <iframe
                                            ref={iframeARef}
                                            style={{
                                                display: "none",
                                                position: "absolute",
                                                inset: 0,
                                                width: "100%",
                                                height: "100%",
                                                border: "none",
                                            }}
                                            allow="autoplay; encrypted-media; picture-in-picture"
                                            title="background video"
                                        />
                                    </div>
                                </div>
                                <div className="slide-layer" ref={slideBRef}>
                                    <div
                                        className="media-wrapper"
                                        ref={innerBRef}
                                    >
                                        <img
                                            ref={imgBRef}
                                            src=""
                                            alt=""
                                            role="presentation"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <video
                                            ref={videoBRef}
                                            loop
                                            muted
                                            playsInline
                                            preload="none"
                                            style={{ display: "none" }}
                                            aria-hidden="true"
                                        />
                                        <iframe
                                            ref={iframeBRef}
                                            style={{
                                                display: "none",
                                                position: "absolute",
                                                inset: 0,
                                                width: "100%",
                                                height: "100%",
                                                border: "none",
                                            }}
                                            allow="autoplay; encrypted-media; picture-in-picture"
                                            title="background video"
                                        />
                                    </div>
                                </div>
                            </div>
                            {playButton}
                            {overlayContent && (
                                <div className="profile-meta" ref={contentRef}>
                                    <h3 ref={roleRef} style={getRoleStyle()}>
                                        {activePerson?.role}
                                    </h3>
                                    <p
                                        ref={companyRef}
                                        style={getCompanyStyle()}
                                    >
                                        {activePerson?.company}
                                    </p>
                                    {activePerson?.social &&
                                        Object.values(activePerson.social).some(
                                            Boolean
                                        ) && (
                                            <div
                                                className="meta-social"
                                                role="list"
                                                aria-label="Social links"
                                            >
                                                {activePerson.social!
                                                    .linkedin && (
                                                    <div role="listitem">
                                                        <SocialIcon
                                                            platform="linkedin"
                                                            url={
                                                                activePerson
                                                                    .social!
                                                                    .linkedin!
                                                            }
                                                            color={
                                                                socialIconColor
                                                            }
                                                        />
                                                    </div>
                                                )}
                                                {activePerson.social!
                                                    .facebook && (
                                                    <div role="listitem">
                                                        <SocialIcon
                                                            platform="facebook"
                                                            url={
                                                                activePerson
                                                                    .social!
                                                                    .facebook!
                                                            }
                                                            color={
                                                                socialIconColor
                                                            }
                                                        />
                                                    </div>
                                                )}
                                                {activePerson.social!.x && (
                                                    <div role="listitem">
                                                        <SocialIcon
                                                            platform="x"
                                                            url={
                                                                activePerson
                                                                    .social!.x!
                                                            }
                                                            color={
                                                                socialIconColor
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                        {!overlayContent && (
                            <div className="profile-meta" ref={contentRef}>
                                <h3 ref={roleRef} style={getRoleStyle()}>
                                    {activePerson?.role}
                                </h3>
                                <p ref={companyRef} style={getCompanyStyle()}>
                                    {activePerson?.company}
                                </p>
                                {activePerson?.social &&
                                    Object.values(activePerson.social).some(
                                        Boolean
                                    ) && (
                                        <div
                                            className="meta-social"
                                            role="list"
                                            aria-label="Social links"
                                        >
                                            {activePerson.social!.linkedin && (
                                                <div role="listitem">
                                                    <SocialIcon
                                                        platform="linkedin"
                                                        url={
                                                            activePerson.social!
                                                                .linkedin!
                                                        }
                                                        color={socialIconColor}
                                                    />
                                                </div>
                                            )}
                                            {activePerson.social!.facebook && (
                                                <div role="listitem">
                                                    <SocialIcon
                                                        platform="facebook"
                                                        url={
                                                            activePerson.social!
                                                                .facebook!
                                                        }
                                                        color={socialIconColor}
                                                    />
                                                </div>
                                            )}
                                            {activePerson.social!.x && (
                                                <div role="listitem">
                                                    <SocialIcon
                                                        platform="x"
                                                        url={
                                                            activePerson.social!
                                                                .x!
                                                        }
                                                        color={socialIconColor}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}
                        {activePerson && renderProfileExtra(activePerson)}
                    </div>
                </div>
                <div
                    className="list-panel"
                    id={listId}
                    role="list"
                    aria-label="Speakers"
                >
                    {team.map((person, index) => {
                        const isActive = index === activeIndex
                        return (
                            <div
                                key={person.id || index}
                                className={`entry-item ${isActive ? "active" : ""}`}
                                tabIndex={0}
                                role="listitem"
                                data-index={index}
                                aria-current={isActive ? "true" : undefined}
                                aria-label={`${person.name}, ${person.role} at ${person.company}. ${index + 1} of ${team.length}. Press Enter to view details.`}
                                aria-controls={showcaseId}
                                ref={(el) => {
                                    rowsRef.current[index] = el
                                }}
                            >
                                <div className="entry-header">
                                    <span
                                        className="entry-num"
                                        style={getNumStyle(isActive)}
                                        aria-hidden="true"
                                    >
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <h2
                                        className="entry-name"
                                        style={getNameStyle(isActive)}
                                    >
                                        {person.name}
                                    </h2>
                                </div>
                                {showDescription && (
                                    <p
                                        className="entry-desc"
                                        style={getDescStyle(isActive)}
                                        id={`${componentId}-desc-${index}`}
                                    >
                                        <span
                                            className="desc-accent"
                                            style={{
                                                background: isActive
                                                    ? descColor
                                                    : descColorInactive,
                                            }}
                                            aria-hidden="true"
                                        ></span>
                                        {person.desc}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
                {activeVideo && (
                    <VideoModal videoUrl={activeVideo} onClose={closeVideo} />
                )}
            </section>
        )
    }
    return (
        <section
            className={`roster roster-${componentId} is-desktop`}
            ref={componentRootRef}
            role="region"
            aria-label="Speaker roster"
        >
            <div
                id={liveRegionId}
                className="roster-live-region"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                {announcement}
            </div>
            <div
                className="showcase-panel"
                ref={showcaseRef}
                id={showcaseId}
                aria-label="Speaker profile"
            >
                <div
                    className={`profile-card ${overlayContent ? "overlay" : ""}`}
                >
                    <div className="media-frame">
                        {activePerson.showStatus !== false &&
                            activePerson.status && (
                                <StatusBadge status={activePerson.status} />
                            )}
                        <div className="parallax-track" ref={driftRef}>
                            <div className="slide-layer" ref={slideARef}>
                                <div className="media-wrapper" ref={innerARef}>
                                    <img
                                        ref={imgARef}
                                        src={getImageSrc(team[0]?.image)}
                                        alt=""
                                        role="presentation"
                                        loading="eager"
                                        decoding="async"
                                        fetchPriority="high"
                                    />
                                    <video
                                        ref={videoARef}
                                        loop
                                        muted
                                        playsInline
                                        preload="none"
                                        style={{
                                            display: "none",
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                        aria-hidden="true"
                                    />
                                    <iframe
                                        ref={iframeARef}
                                        style={{
                                            display: "none",
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            border: "none",
                                        }}
                                        allow="autoplay; encrypted-media; picture-in-picture"
                                        title="background video"
                                    />
                                </div>
                            </div>
                            <div className="slide-layer" ref={slideBRef}>
                                <div className="media-wrapper" ref={innerBRef}>
                                    <img
                                        ref={imgBRef}
                                        src=""
                                        alt=""
                                        role="presentation"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <video
                                        ref={videoBRef}
                                        loop
                                        muted
                                        playsInline
                                        preload="none"
                                        style={{ display: "none" }}
                                        aria-hidden="true"
                                    />
                                    <iframe
                                        ref={iframeBRef}
                                        style={{
                                            display: "none",
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            border: "none",
                                        }}
                                        allow="autoplay; encrypted-media; picture-in-picture"
                                        title="background video"
                                    />
                                </div>
                            </div>
                        </div>
                        {playButton}
                        {overlayContent && (
                            <div className="profile-meta" ref={contentRef}>
                                <h3 ref={roleRef} style={getRoleStyle()}>
                                    {activePerson?.role}
                                </h3>
                                <p ref={companyRef} style={getCompanyStyle()}>
                                    {activePerson?.company}
                                </p>
                                {activePerson?.social &&
                                    Object.values(activePerson.social).some(
                                        Boolean
                                    ) && (
                                        <div
                                            className="meta-social"
                                            role="list"
                                            aria-label="Social links"
                                        >
                                            {activePerson.social!.linkedin && (
                                                <div role="listitem">
                                                    <SocialIcon
                                                        platform="linkedin"
                                                        url={
                                                            activePerson.social!
                                                                .linkedin!
                                                        }
                                                        color={socialIconColor}
                                                    />
                                                </div>
                                            )}
                                            {activePerson.social!.facebook && (
                                                <div role="listitem">
                                                    <SocialIcon
                                                        platform="facebook"
                                                        url={
                                                            activePerson.social!
                                                                .facebook!
                                                        }
                                                        color={socialIconColor}
                                                    />
                                                </div>
                                            )}
                                            {activePerson.social!.x && (
                                                <div role="listitem">
                                                    <SocialIcon
                                                        platform="x"
                                                        url={
                                                            activePerson.social!
                                                                .x!
                                                        }
                                                        color={socialIconColor}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                    {!overlayContent && (
                        <div className="profile-meta" ref={contentRef}>
                            <h3 ref={roleRef} style={getRoleStyle()}>
                                {activePerson?.role}
                            </h3>
                            <p ref={companyRef} style={getCompanyStyle()}>
                                {activePerson?.company}
                            </p>
                            {activePerson?.social &&
                                Object.values(activePerson.social).some(
                                    Boolean
                                ) && (
                                    <div
                                        className="meta-social"
                                        role="list"
                                        aria-label="Social links"
                                    >
                                        {activePerson.social!.linkedin && (
                                            <div role="listitem">
                                                <SocialIcon
                                                    platform="linkedin"
                                                    url={
                                                        activePerson.social!
                                                            .linkedin!
                                                    }
                                                    color={socialIconColor}
                                                />
                                            </div>
                                        )}
                                        {activePerson.social!.facebook && (
                                            <div role="listitem">
                                                <SocialIcon
                                                    platform="facebook"
                                                    url={
                                                        activePerson.social!
                                                            .facebook!
                                                    }
                                                    color={socialIconColor}
                                                />
                                            </div>
                                        )}
                                        {activePerson.social!.x && (
                                            <div role="listitem">
                                                <SocialIcon
                                                    platform="x"
                                                    url={
                                                        activePerson.social!.x!
                                                    }
                                                    color={socialIconColor}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    )}
                    {activePerson && renderProfileExtra(activePerson)}
                </div>
            </div>
            <div
                className="list-panel"
                ref={rightColRef}
                id={listId}
                role="list"
                aria-label="Speakers"
            >
                <div
                    className="cursor-indicator"
                    ref={pointerRef}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 40 40"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path
                            d={
                                imagePosition === "right"
                                    ? "M8 20 L34 20 M34 20 L26 12 M34 20 L26 28"
                                    : "M34 20 L8 20 M8 20 L16 12 M8 20 L16 28"
                            }
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                {team.map((person, index) => {
                    const isActive = index === activeIndex
                    return (
                        <div
                            key={person.id || index}
                            className={`entry-item ${isActive ? "active" : ""}`}
                            tabIndex={0}
                            role="listitem"
                            data-index={index}
                            aria-current={isActive ? "true" : undefined}
                            aria-label={`${person.name}, ${person.role} at ${person.company}. ${index + 1} of ${team.length}. Press Enter to view details.`}
                            aria-controls={showcaseId}
                            ref={(el) => {
                                rowsRef.current[index] = el
                            }}
                        >
                            <div className="entry-header">
                                <span
                                    className="entry-num"
                                    style={getNumStyle(isActive)}
                                    aria-hidden="true"
                                >
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <h2
                                    className="entry-name"
                                    style={getNameStyle(isActive)}
                                >
                                    {person.name}
                                </h2>
                            </div>
                            {showDescription && (
                                <p
                                    className="entry-desc"
                                    style={getDescStyle(isActive)}
                                    id={`${componentId}-desc-${index}`}
                                >
                                    <span
                                        className="desc-accent"
                                        style={{
                                            background: isActive
                                                ? descColor
                                                : descColorInactive,
                                        }}
                                        aria-hidden="true"
                                    ></span>
                                    {person.desc}
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>
            {activeVideo && (
                <VideoModal videoUrl={activeVideo} onClose={closeVideo} />
            )}
        </section>
    )
}
addPropertyControls(SpeakersRoster, {
    team: {
        type: ControlType.Array,
        title: "Team Members",
        control: {
            type: ControlType.Object,
            title: "Member",
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Jane Doe",
                },
                image: { type: ControlType.Image, title: "Image" },
                video: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://youtube.com/watch?v=... or .mp4",
                    description:
                        "Supports YouTube URLs or direct video file URLs (.mp4, .webm).",
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Video File",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                videoDisplay: {
                    type: ControlType.Enum,
                    title: "Video Display",
                    options: ["popup", "background"],
                    optionTitles: [
                        "Fullscreen Popup",
                        "Background (autoplay, muted, loop)",
                    ],
                    defaultValue: "popup",
                    description:
                        "Popup: shows a play button that opens a fullscreen player. Background: video (including YouTube) autoplays muted on loop inside the showcase card; a play button still opens it fullscreen.",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Product Designer",
                },
                company: {
                    type: ControlType.String,
                    title: "Company",
                    defaultValue: "Figma",
                },
                desc: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue:
                        "A short bio or description about the team member.",
                },
                social: {
                    type: ControlType.Object,
                    title: "Social Links",
                    controls: {
                        linkedin: {
                            type: ControlType.String,
                            title: "LinkedIn URL",
                            placeholder: "https://linkedin.com/in/...",
                        },
                        facebook: {
                            type: ControlType.String,
                            title: "Facebook URL",
                            placeholder: "https://facebook.com/...",
                        },
                        x: {
                            type: ControlType.String,
                            title: "X (Twitter) URL",
                            placeholder: "https://x.com/...",
                        },
                    },
                },
                status: {
                    type: ControlType.Object,
                    title: "Status Badge",
                    controls: {
                        label: {
                            type: ControlType.String,
                            title: "Label",
                            defaultValue: "Available",
                        },
                        color: {
                            type: ControlType.Color,
                            title: "Color",
                            defaultValue: "#10b981",
                        },
                        pulse: {
                            type: ControlType.Boolean,
                            title: "Pulse Animation",
                            defaultValue: false,
                        },
                    },
                },
                tags: {
                    type: ControlType.Array,
                    title: "Skill Tags",
                    control: {
                        type: ControlType.String,
                        title: "Tag",
                        defaultValue: "Design",
                    },
                    defaultValue: ["Design", "Product"],
                },
                cta: {
                    type: ControlType.Object,
                    title: "CTA Button",
                    controls: {
                        label: {
                            type: ControlType.String,
                            title: "Button Label",
                            defaultValue: "View Profile",
                        },
                        link: { type: ControlType.Link, title: "Button Link" },
                    },
                },
                showStatus: {
                    type: ControlType.Boolean,
                    title: "Show Status Badge",
                    defaultValue: true,
                },
                showTags: {
                    type: ControlType.Boolean,
                    title: "Show Skill Tags",
                    defaultValue: true,
                },
                showCTA: {
                    type: ControlType.Boolean,
                    title: "Show CTA Button",
                    defaultValue: true,
                },
            },
        },
        defaultValue: defaultTeam,
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            nameFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Name Font",
                defaultValue: {
                    fontFamily: "Fraunces",
                    fontWeight: 400,
                    fontSize: 64,
                    lineHeight: 1,
                    textTransform: "none",
                    letterSpacing: "0em",
                },
            },
            nameTextTransform: {
                type: ControlType.Enum,
                title: "Name Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            nameColor: {
                type: ControlType.Color,
                title: "Name Color (Active)",
                defaultValue: "#0a0a0a",
            },
            nameColorInactive: {
                type: ControlType.Color,
                title: "Name Color (Inactive)",
                defaultValue: "#d0d0d0",
            },
            numFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Number Font",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: 12,
                    textTransform: "none",
                    letterSpacing: "0.05em",
                },
            },
            numColor: {
                type: ControlType.Color,
                title: "Number Color (Inactive)",
                defaultValue: "#e8e8e8",
            },
            numColorActive: {
                type: ControlType.Color,
                title: "Number Color (Active)",
                defaultValue: "#0a0a0a",
            },
            descFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Description Font",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 300,
                    fontSize: 14,
                    lineHeight: 1.6,
                    textTransform: "none",
                    letterSpacing: "0.01em",
                },
            },
            descColor: {
                type: ControlType.Color,
                title: "Description Color (Active)",
                defaultValue: "#0a0a0a",
            },
            descColorInactive: {
                type: ControlType.Color,
                title: "Description Color (Inactive)",
                defaultValue: "#888888",
            },
            roleFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Role Font",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: 14,
                    textTransform: "none",
                    letterSpacing: "0.02em",
                },
            },
            roleTextTransform: {
                type: ControlType.Enum,
                title: "Role Transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: ["None", "UPPERCASE", "lowercase", "Capitalize"],
                defaultValue: "none",
            },
            roleColor: {
                type: ControlType.Color,
                title: "Role Color",
                defaultValue: "#0a0a0a",
            },
            companyFont: {
                type: ControlType.Font,
                controls: "extended",
                title: "Company Font",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 300,
                    fontSize: 13,
                    textTransform: "none",
                    letterSpacing: "0em",
                },
            },
            companyColor: {
                type: ControlType.Color,
                title: "Company Color",
                defaultValue: "#888888",
            },
            socialIconColor: {
                type: ControlType.Color,
                title: "Social Icon Color",
                defaultValue: "#0a0a0a",
            },
            skillTagBgColor: {
                type: ControlType.Color,
                title: "Skill Tag Background",
                defaultValue: "rgba(0,0,0,0.05)",
            },
            skillTagTextColor: {
                type: ControlType.Color,
                title: "Skill Tag Text Color",
                defaultValue: "#666666",
            },
        },
    },
    style: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#ffffff",
            },
            cardBackgroundColor: {
                type: ControlType.Color,
                title: "Card Background",
                defaultValue: "#ffffff",
            },
            cardBorderColor: {
                type: ControlType.Color,
                title: "Card Border",
                defaultValue: "#e8e8e8",
            },
            colorImage: {
                type: ControlType.Boolean,
                title: "Color Image",
                defaultValue: false,
            },
            overlayContent: {
                type: ControlType.Boolean,
                title: "Overlay Content",
                defaultValue: false,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Card Border Radius",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 16,
                unit: "px",
            },
            nameHoverBg: {
                type: ControlType.Color,
                title: "Name Hover Background",
                defaultValue: "rgba(0,0,0,0.02)",
            },
            showDescription: {
                type: ControlType.Boolean,
                title: "Show Description",
                defaultValue: true,
            },
            imagePosition: {
                type: ControlType.Enum,
                title: "Image Position",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "left",
            },
            parallaxEffect: {
                type: ControlType.Enum,
                title: "Transition Effect",
                options: [
                    "parallax",
                    "fade",
                    "zoom",
                    "blur",
                    "slide",
                    "circle",
                    "diagonal",
                ],
                optionTitles: [
                    "Parallax",
                    "Fade",
                    "Zoom",
                    "Blur",
                    "Slide",
                    "Circle Reveal",
                    "Diagonal Wipe",
                ],
                defaultValue: "parallax",
                description:
                    "Choose the transition effect when switching between speakers.",
            },
            cardShadow: {
                type: ControlType.Boolean,
                title: "Card Shadow",
                defaultValue: false,
            },
            cardShadowColor: {
                type: ControlType.Color,
                title: "Shadow Color",
                defaultValue: "rgba(0,0,0,0.1)",
            },
            cardShadowBlur: {
                type: ControlType.Number,
                title: "Shadow Blur",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 20,
                unit: "px",
            },
            cardShadowX: {
                type: ControlType.Number,
                title: "Shadow Offset X",
                min: -50,
                max: 50,
                step: 1,
                defaultValue: 0,
                unit: "px",
            },
            cardShadowY: {
                type: ControlType.Number,
                title: "Shadow Offset Y",
                min: -50,
                max: 50,
                step: 1,
                defaultValue: 10,
                unit: "px",
            },
            cardShadowSpread: {
                type: ControlType.Number,
                title: "Shadow Spread",
                min: -50,
                max: 50,
                step: 1,
                defaultValue: 0,
                unit: "px",
            },
            ctaButtonStyle: {
                type: ControlType.Enum,
                title: "CTA Button Style",
                options: ["filled", "outline", "ghost"],
                optionTitles: ["Filled", "Outline", "Ghost"],
                defaultValue: "filled",
            },
            ctaButtonBg: {
                type: ControlType.Color,
                title: "CTA Button Background",
                defaultValue: "#0a0a0a",
            },
            ctaButtonColor: {
                type: ControlType.Color,
                title: "CTA Button Text Color",
                defaultValue: "#ffffff",
            },
            ctaButtonHoverBg: {
                type: ControlType.Color,
                title: "CTA Button Hover Background",
                defaultValue: "#333333",
            },
            ctaButtonHoverColor: {
                type: ControlType.Color,
                title: "CTA Button Hover Text Color",
                defaultValue: "#ffffff",
            },
            ctaButtonBorderColor: {
                type: ControlType.Color,
                title: "CTA Button Border Color",
                defaultValue: "#0a0a0a",
            },
            ctaButtonHoverBorderColor: {
                type: ControlType.Color,
                title: "CTA Button Hover Border Color",
                defaultValue: "#333333",
            },
            ctaButtonRadius: {
                type: ControlType.Number,
                title: "CTA Button Radius",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 100,
                unit: "px",
            },
            ctaButtonPaddingX: {
                type: ControlType.Number,
                title: "CTA Button Pad X",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 28,
            },
            ctaButtonPaddingY: {
                type: ControlType.Number,
                title: "CTA Button Pad Y",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 14,
            },
            ctaButtonTextTransform: {
                type: ControlType.Enum,
                title: "CTA Button Transform",
                options: ["none", "capitalize", "uppercase", "lowercase"],
                optionTitles: ["None", "Capitalize", "Uppercase", "Lowercase"],
                defaultValue: "uppercase",
            },
            ctaButtonArrowColor: {
                type: ControlType.Color,
                title: "CTA Button Arrow Color",
                defaultValue: "#ffffff",
                description:
                    "Color of the arrow icon inside the CTA button. Leave empty to inherit text color.",
            },
            playIconSize: {
                type: ControlType.Number,
                title: "Play Icon Size",
                min: 32,
                max: 96,
                step: 2,
                defaultValue: 52,
                unit: "px",
            },
            playIconBgColor: {
                type: ControlType.Color,
                title: "Play Icon Background",
                defaultValue: "rgba(255,255,255,0.92)",
            },
            playIconColor: {
                type: ControlType.Color,
                title: "Play Icon Color",
                defaultValue: "#0a0a0a",
            },
        },
    },
})
