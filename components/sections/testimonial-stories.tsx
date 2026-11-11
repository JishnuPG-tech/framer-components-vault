import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useCallback,
    useId,
    memo,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"
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


let gsapPluginsRegistered = false
function registerGSAPPlugins() {
    if (typeof window === "undefined") return
    if (gsapPluginsRegistered) return
    gsap.registerPlugin(ScrollTrigger)
    gsapPluginsRegistered = true
}

// ─────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────
const wrapX = (x: number, oneSetWidth: number) => {
    if (oneSetWidth <= 0) return x
    let mod = x % oneSetWidth
    if (mod > 0) return mod - oneSetWidth
    if (mod < 0) return mod
    return 0
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

// ✅ FIX: Replaced `any[]` with `unknown[]` for safer generic typing
function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    ms: number
): T {
    let id: ReturnType<typeof setTimeout>
    return ((...args: unknown[]) => {
        clearTimeout(id)
        id = setTimeout(() => fn(...args), ms)
    }) as T
}

// ─────────────────────────────────────────────────────────────────────────
// STATIC STYLES
// ─────────────────────────────────────────────────────────────────────────
const cardStaticStyles = {
    padding: 32,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    boxSizing: "border-box",
    overflow: "hidden",
} as const

const avatarContainerStyles = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(0, 0, 0, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
} as const

const avatarImageStyles = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
} as const

const playIconContainerStyles = {
    position: "absolute",
    top: 24,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    pointerEvents: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
} as const

const backdropStyles = {
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
} as const

const videoWrapStyles = {
    position: "relative",
    width: "100%",
    maxWidth: 900,
    aspectRatio: "16 / 9",
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
    cursor: "default",
} as const

const closeButtonStyles = {
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
} as const

// ─────────────────────────────────────────────────────────────────────────
// TYPES & THEME CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────
export interface Testimonial {
    id?: string
    quote: string
    name: string
    role: string
    avatar: string | { src?: string; srcSet?: string; alt?: string }
    companyLogo?: string | { src?: string; srcSet?: string; alt?: string }
    rating?: number
    avatarAsBackground?: boolean
    video?: string
    videoFile?: string
    videoDisplay?: "popup" | "background"
    theme:
        | "light-blue"
        | "light-gray"
        | "green"
        | "dark"
        | "mint"
        | "lavender"
        | "peach"
        | "coral"
        | "sky"
        | "rose"
        | "yellow"
        | "slate"
        | "indigo"
        | "emerald"
        | "amber"
        | "fuchsia"
        | "cyan"
        | "violet"
        | "teal"
        | "orange"
        | "zinc"
        | "ruby"
        | "glamourprism"
        | "neo-brutalism"
}

interface MyComponentProps {
    testimonials: Testimonial[]
    fadeColor?: string
    backgroundColor: string
    direction: "left" | "right"
    mode: "marquee" | "onscroll" | "stacking" | "grid"
    stackingFullWidth: boolean
    gridColumns: number
    gridGap: number
    onScrollSectionTitle?: string
    onScrollSectionSubtitle?: string
    onScrollTitleColor?: string
    onScrollSubtitleColor?: string
    cardWidth?: number
    cardHeight?: number
    style?: CSSProperties
    quoteFont?: Partial<CSSProperties>
    nameFont?: Partial<CSSProperties>
    roleFont?: Partial<CSSProperties>
    titleFont?: Partial<CSSProperties>
    subtitleFont?: Partial<CSSProperties>
}

function getImageSrc(
    image?: string | { src?: string; srcSet?: string; alt?: string }
): string {
    if (!image) return ""
    if (typeof image === "string") return image
    return image.src || ""
}

// ✅ FIX: Defined a strict Theme interface instead of using `Record<string, any>`
interface Theme {
    bg: string
    text: string
    border?: string
    backdropFilter?: string
    boxShadow?: string
    borderRadius?: string
    borderTop?: string
    starColor?: string
    starFilter?: string
    nameColor?: string
    roleColor?: string
    nameUppercase?: boolean
}

const themes: Record<string, Theme> = {
    "light-blue": { bg: "#c5efff", text: "#0a2a3a" },
    "light-gray": { bg: "#e8e8e8", text: "#1a1a1a" },
    green: { bg: "#b8f06d", text: "#1a2e0a" },
    dark: { bg: "#2a2a2a", text: "#e0e0e0" },
    mint: { bg: "#d4f5dc", text: "#0a3a1a" },
    lavender: { bg: "#d8d4f5", text: "#2a1a3a" },
    peach: { bg: "#ffdfc4", text: "#3a1a0a" },
    coral: { bg: "#ff9e9e", text: "#3a0a0a" },
    sky: { bg: "#b3d4ff", text: "#0a1a3a" },
    rose: { bg: "#f5d4e1", text: "#3a0a2a" },
    yellow: { bg: "#fff0b3", text: "#3a2a0a" },
    slate: { bg: "#4a5568", text: "#f7fafc" },
    indigo: { bg: "#e0e7ff", text: "#1e1b4b" },
    emerald: { bg: "#d1fae5", text: "#064e3b" },
    amber: { bg: "#fef3c7", text: "#78350f" },
    fuchsia: { bg: "#fae8ff", text: "#4a044e" },
    cyan: { bg: "#cffafe", text: "#164e63" },
    violet: { bg: "#ede9fe", text: "#2e1065" },
    teal: { bg: "#ccfbf1", text: "#134e4a" },
    orange: { bg: "#ffedd5", text: "#7c2d12" },
    zinc: { bg: "#f4f4f5", text: "#27272a" },
    ruby: { bg: "#ffe4e6", text: "#4c0519" },
    glamourprism: {
        bg: "radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.08) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.08) 0, transparent 50%), rgba(17, 24, 39, 0.65)",
        text: "#f3f4f6",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(16px)",
        boxShadow:
            "0 4px 30px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(255, 255, 255, 0.05) inset",
        borderRadius: "20px",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        starColor: "#f59e0b",
        starFilter: "drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2))",
        nameColor: "#ffffff",
        roleColor: "#9ca3af",
        nameUppercase: false,
    },
    "neo-brutalism": {
        bg: "#FFDE59",
        text: "#000000",
        border: "3px solid #000000",
        boxShadow: "8px 8px 0px 0px #000000",
        borderRadius: "0px",
        borderTop: "3px solid #000000",
        starColor: "#f59e0b",
        nameColor: "#000000",
        roleColor: "#000000",
        nameUppercase: true,
    },
}

export const defaultTestimonials: Testimonial[] = [
    {
        id: "1",
        quote: "Finally, a toolkit that doesn't sacrifice performance for polish. Our LCP dropped by 40% after switching, and the dev experience is just chef's kiss.",
        name: "Alex Chen",
        role: "Staff Engineer — Vercel",
        avatar: "https://i.pravatar.cc/150?img=11",
        rating: 5,
        theme: "glamourprism",
        video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoDisplay: "popup",
    },
    {
        id: "2",
        quote: "I shipped a complex animated dashboard in half the time. The API is intuitive, the docs are thorough, and it just works. No more fighting CSS.",
        name: "Priya Sharma",
        role: "Frontend Lead — Stripe",
        avatar: "https://i.pravatar.cc/150?img=5",
        rating: 5,
        theme: "emerald",
        videoDisplay: "background",
        video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
        id: "3",
        quote: "As a designer who codes, this is the bridge I've been waiting for. I can prototype interactions visually and hand off production-ready code.",
        name: "Jordan Lee",
        role: "Design Engineer — Figma",
        avatar: "https://i.pravatar.cc/150?img=3",
        rating: 4,
        theme: "amber",
    },
    {
        id: "4",
        quote: "Zero config, zero bloat, zero compromises. We replaced three legacy libraries with this one and our bundle size thanked us.",
        name: "Mateo Rossi",
        role: "CTO — Startup Labs",
        avatar: "https://i.pravatar.cc/150?img=12",
        rating: 5,
        theme: "dark",
    },
]

// ─────────────────────────────────────────────────────────────────────────
// SCRAMBLE TEXT
// ─────────────────────────────────────────────────────────────────────────
const ScrambleText = memo(function ScrambleText({
    text,
    trigger,
    isStatic,
    isInView = true,
}: {
    text: string
    trigger: number
    isStatic?: boolean
    isInView?: boolean
}) {
    const [display, setDisplay] = useState(text)
    const timerRef = useRef<number | null>(null)

    // ✅ FIX: Added `isInView` to dependencies and properly clear interval when offscreen
    useEffect(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current)
            timerRef.current = null
        }

        if (isStatic || trigger === 0 || !isInView) return

        const glyphs = "XØ█▓▒░*+=%#@$"
        const durationMs = 450
        const start = Date.now()

        timerRef.current = window.setInterval(() => {
            const progress = Math.min(1, (Date.now() - start) / durationMs)
            const reveal = Math.floor(progress * text.length)
            const scrambled =
                text.slice(0, reveal) +
                text
                    .slice(reveal)
                    .split("")
                    .map((char) =>
                        char === " "
                            ? " "
                            : glyphs[Math.floor(Math.random() * glyphs.length)]
                    )
                    .join("")
            setDisplay(scrambled)
            if (progress >= 1) {
                if (timerRef.current) {
                    window.clearInterval(timerRef.current)
                    timerRef.current = null
                }
                setDisplay(text)
            }
        }, 33)

        return () => {
            if (timerRef.current) {
                window.clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [trigger, text, isStatic, isInView])

    return <>{display}</>
})
ScrambleText.displayName = "ScrambleText"

// ─────────────────────────────────────────────────────────────────────────
// FOCUS TRAP HOOK
// ─────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────
// VIDEO MODAL
// ─────────────────────────────────────────────────────────────────────────
export function VideoModal({
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
        }, backdropRef)
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", handleKey)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            ctx.revert()
            window.removeEventListener("keydown", handleKey)
            document.body.style.overflow = prevOverflow
        }
    }, [onClose, isStatic])
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
                Testimonial video
            </span>
            <div
                className="modal-video-wrap"
                style={videoWrapStyles}
                onClick={(e) => e.stopPropagation()}
            >
                {isYouTube && youtubeId ? (
                    <iframe
                        title="Testimonial video"
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
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
// STAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────
const Star = memo(function Star({
    filled,
    color,
    starColor,
    filter,
}: {
    filled: boolean
    color: string
    starColor?: string
    filter?: string
}) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={filled ? starColor || "#f5a623" : color}
            fillOpacity={filled ? 1 : 0.25}
            style={{ filter: filter }}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
    )
})
Star.displayName = "Star"

// ─────────────────────────────────────────────────────────────────────────
// TESTIMONIAL CARD
// ─────────────────────────────────────────────────────────────────────────
export const TestimonialCard = memo(function TestimonialCard({
    testimonial,
    index,
    isDuplicate,
    disableHover = false,
    isStacking = false,
    isGrid = false,
    isScattered = false,
    isStatic = false,
    onVideoPlay,
    scrambleTrigger = 0,
    cardWidth,
    cardHeight,
    isInView = true,
    quoteFont,
    nameFont,
    roleFont,
}: {
    testimonial: Testimonial
    index: number
    isDuplicate: boolean
    disableHover?: boolean
    isStacking?: boolean
    isGrid?: boolean
    isScattered?: boolean
    isStatic?: boolean
    onVideoPlay?: (url: string) => void
    scrambleTrigger?: number
    cardWidth?: number
    cardHeight?: number
    isInView?: boolean
    quoteFont?: Partial<CSSProperties>
    nameFont?: Partial<CSSProperties>
    roleFont?: Partial<CSSProperties>
}) {
    const cardRef = useRef<HTMLDivElement>(null)
    const pointerStart = useRef({ x: 0, y: 0 })
    const videoUrl = testimonial.videoFile || testimonial.video
    const { videoDisplay = "popup" } = testimonial
    const theme = themes[testimonial.theme] || themes["indigo"]
    const rating = testimonial.rating ?? 5
    const [isInlinePlaying, setIsInlinePlaying] = useState(false)
    const isAvatarBg = testimonial.avatarAsBackground && !!testimonial.avatar
    const isNeoBrutalism = testimonial.theme === "neo-brutalism"
    const cardBackground = isAvatarBg
        ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url(${getImageSrc(testimonial.avatar)}) center/cover no-repeat`
        : theme.bg
    const cardTextColor = isAvatarBg ? "#ffffff" : theme.text
    const starColor = isAvatarBg ? "#ffffff" : theme.text
    const finalNameColor =
        isAvatarBg && isNeoBrutalism
            ? "#ffffff"
            : theme.nameColor || cardTextColor
    const finalRoleColor =
        isAvatarBg && isNeoBrutalism
            ? "#ffffff"
            : theme.roleColor || cardTextColor
    const finalBorderColor =
        isAvatarBg && isNeoBrutalism
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : theme.borderTop
    const finalStarColor = theme.starColor
    const finalCardWidth =
        isStacking || isGrid || isScattered ? "100%" : (cardWidth ?? 300)
    const finalCardMinWidth =
        isStacking || isGrid || isScattered ? 0 : (cardWidth ?? 300)
    const finalCardHeight = isStacking
        ? "100%"
        : isGrid
          ? "auto"
          : isScattered
            ? "100%"
            : (cardHeight ?? 380)
    useEffect(() => {
        if (isStatic) return
        const ctx = gsap.context(() => {
            if (
                !isDuplicate &&
                cardRef.current &&
                !isStacking &&
                !isScattered
            ) {
                gsap.fromTo(
                    cardRef.current,
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        ease: "power3.out",
                        delay: index * 0.08,
                    }
                )
            }
        }, cardRef)
        return () => ctx.revert()
    }, [isDuplicate, index, isStacking, isScattered, isStatic])
    useEffect(() => {
        if (isStatic) return
        if (disableHover && cardRef.current) {
            gsap.to(cardRef.current, {
                y: 0,
                scale: 1,
                duration: 0.2,
                ease: "power2.out",
            })
        }
    }, [disableHover, isStatic])
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        pointerStart.current = { x: e.clientX, y: e.clientY }
    }, [])
    const playVideo = useCallback(() => {
        if (!videoUrl || isStatic) return
        if (videoDisplay === "popup") {
            onVideoPlay?.(videoUrl)
        } else {
            setIsInlinePlaying(true)
        }
    }, [videoUrl, videoDisplay, onVideoPlay, isStatic])
    const handleCardClick = useCallback(
        (e: React.MouseEvent) => {
            const dx = Math.abs(e.clientX - pointerStart.current.x)
            const dy = Math.abs(e.clientY - pointerStart.current.y)
            if (dx > 5 || dy > 5) return
            playVideo()
        },
        [playVideo]
    )
    const handleCardKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!videoUrl) return
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                playVideo()
            }
        },
        [videoUrl, playVideo]
    )
    const closeInlineVideo = useCallback((e?: React.SyntheticEvent) => {
        e?.stopPropagation()
        setIsInlinePlaying(false)
    }, [])
    const onHoverEnter = useCallback(() => {
        if (
            isStatic ||
            disableHover ||
            isStacking ||
            isInlinePlaying ||
            (isScattered && !isInView)
        )
            return
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                y: -6,
                scale: 1.02,
                duration: 0.2,
                ease: "power2.out",
            })
        }
    }, [
        isStatic,
        disableHover,
        isStacking,
        isInlinePlaying,
        isScattered,
        isInView,
    ])
    const onHoverLeave = useCallback(() => {
        if (isStatic || disableHover || (isScattered && !isInView)) return
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                y: 0,
                scale: 1,
                duration: 0.2,
                ease: "power2.out",
            })
        }
    }, [isStatic, disableHover, isScattered, isInView])
    const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false
    const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null
    return (
        <div
            ref={cardRef}
            className="testimonial-card"
            aria-hidden={isDuplicate ? true : undefined}
            role={videoUrl && !isStatic ? "button" : undefined}
            tabIndex={videoUrl && !isDuplicate && !isStatic ? 0 : undefined}
            aria-label={
                videoUrl && !isStatic
                    ? `Play testimonial video from ${testimonial.name}`
                    : undefined
            }
            style={{
                ...cardStaticStyles,
                width: finalCardWidth,
                minWidth: finalCardMinWidth,
                height: finalCardHeight,
                borderRadius: theme.borderRadius || 24,
                background: cardBackground,
                color: cardTextColor,
                border: theme.border,
                backdropFilter: theme.backdropFilter,
                WebkitBackdropFilter: theme.backdropFilter,
                boxShadow: theme.boxShadow,
                opacity: isStatic
                    ? 1
                    : isDuplicate && !isStacking
                      ? 1
                      : isStacking || isScattered
                        ? 1
                        : 0,
                cursor: videoUrl && !isStatic ? "pointer" : "default",
            }}
            onMouseEnter={isStatic ? undefined : onHoverEnter}
            onMouseLeave={isStatic ? undefined : onHoverLeave}
            onPointerDown={isStatic ? undefined : handlePointerDown}
            onClick={isStatic ? undefined : handleCardClick}
            onKeyDown={isStatic ? undefined : handleCardKeyDown}
        >
            {videoUrl && videoDisplay === "background" && isInlinePlaying && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 10,
                        background: "#000",
                        borderRadius: 24,
                        overflow: "hidden",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {isYouTube && youtubeId ? (
                        <iframe
                            title={`${testimonial.name} testimonial video`}
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
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
                                objectFit: "cover",
                            }}
                            poster={getImageSrc(testimonial.avatar)}
                            onEnded={closeInlineVideo}
                        />
                    )}
                    <button
                        onClick={closeInlineVideo}
                        style={{ ...closeButtonStyles, width: 32, height: 32 }}
                        aria-label="Close video"
                    >
                        ✕
                    </button>
                </div>
            )}
            <div
                style={{
                    opacity:
                        videoDisplay === "background" && isInlinePlaying
                            ? 0
                            : 1,
                    transition: "opacity 0.3s",
                    pointerEvents:
                        videoDisplay === "background" && isInlinePlaying
                            ? "none"
                            : "auto",
                    height: isGrid ? "auto" : "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                }}
            >
                <div>
                    {rating > 0 && (
                        <div
                            className="testimonial-stars"
                            style={{
                                display: "flex",
                                gap: 3,
                                marginBottom: 20,
                            }}
                            role="img"
                            aria-label={`${rating} out of 5 stars`}
                        >
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    filled={star <= rating}
                                    color={starColor}
                                    starColor={finalStarColor}
                                    filter={theme.starFilter}
                                />
                            ))}
                        </div>
                    )}
                    <p
                        className="testimonial-text"
                        style={{
                            fontSize: 16,
                            lineHeight: 1.6,
                            fontWeight: 500,
                            letterSpacing: "-0.01em",
                            margin: 0,
                            color: cardTextColor,
                            ...quoteFont,
                        }}
                    >
                        {isScattered ? (
                            <ScrambleText
                                text={testimonial.quote}
                                trigger={scrambleTrigger}
                                isStatic={isStatic}
                                isInView={isInView}
                            />
                        ) : (
                            testimonial.quote
                        )}
                    </p>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        paddingTop: 20,
                        borderTop: finalBorderColor,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        {!isAvatarBg && testimonial.avatar && (
                            <div style={avatarContainerStyles}>
                                <img
                                    src={getImageSrc(testimonial.avatar)}
                                    alt={testimonial.name}
                                    loading="lazy"
                                    style={avatarImageStyles}
                                />
                            </div>
                        )}
                        <div
                            style={{ display: "flex", flexDirection: "column" }}
                        >
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    textTransform:
                                        theme.nameUppercase === false
                                            ? "none"
                                            : "uppercase",
                                    letterSpacing:
                                        theme.nameUppercase === false
                                            ? "normal"
                                            : "0.05em",
                                    color: finalNameColor,
                                    ...nameFont,
                                }}
                            >
                                {testimonial.name}
                            </span>
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: finalRoleColor,
                                    opacity: finalRoleColor ? 1 : 0.65,
                                    ...roleFont,
                                }}
                            >
                                {testimonial.role}
                            </span>
                        </div>
                    </div>
                    {testimonial.companyLogo && (
                        <div
                            style={{
                                height: 32,
                                maxWidth: 120,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                flexShrink: 0,
                                overflow: "hidden",
                            }}
                        >
                            <img
                                src={getImageSrc(testimonial.companyLogo)}
                                alt=""
                                loading="lazy"
                                style={{
                                    height: "100%",
                                    width: "auto",
                                    maxWidth: "100%",
                                    objectFit: "contain",
                                }}
                            />
                        </div>
                    )}
                </div>
                {videoUrl && (
                    <div
                        style={playIconContainerStyles}
                        aria-hidden="true"
                        title={
                            videoDisplay === "popup"
                                ? "Open video popup"
                                : "Play video background"
                        }
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="white"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    )
})
TestimonialCard.displayName = "TestimonialCard"

// ─────────────────────────────────────────────────────────────────────────
// STACKING CARDS LOGIC
// ─────────────────────────────────────────────────────────────────────────
function StackingTrack({
    testimonials,
    fullWidth = false,
    isStatic = false,
    onVideoPlay,
    cardWidth,
    cardHeight,
    quoteFont,
    nameFont,
    roleFont,
}: {
    testimonials: Testimonial[]
    fullWidth?: boolean
    isStatic?: boolean
    onVideoPlay?: (url: string) => void
    cardWidth?: number
    cardHeight?: number
    quoteFont?: Partial<CSSProperties>
    nameFont?: Partial<CSSProperties>
    roleFont?: Partial<CSSProperties>
}) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    useEffect(() => {
        if (isStatic) return
        const ctx = gsap.context(() => {
            const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[]
            if (cards.length === 0) return
            gsap.set(cards, {
                scale: 1,
                y: 0,
                opacity: 1,
                zIndex: (i: number) => i,
            })
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: wrapperRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1,
                    invalidateOnRefresh: true,
                },
            })
            cards.forEach((card, i) => {
                if (i === 0) return
                const prevCard = cards[i - 1]
                tl.fromTo(
                    card,
                    { y: "100vh", scale: 0.85, opacity: 0 },
                    {
                        y: "0vh",
                        scale: 1,
                        opacity: 1,
                        duration: 1,
                        ease: "power2.out",
                    },
                    i - 1
                )
                tl.to(
                    prevCard,
                    {
                        scale: 0.92,
                        y: -30,
                        opacity: 0.5,
                        duration: 1,
                        ease: "power2.out",
                    },
                    i - 1
                )
            })
            tl.to({}, { duration: 1 })
        }, wrapperRef)
        return () => ctx.revert()
    }, [testimonials, isStatic])
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    maxWidth: fullWidth ? "100%" : 1200,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: fullWidth ? "0 24px" : 0,
                    boxSizing: "border-box",
                    minHeight: 380,
                }}
            >
                <div
                    style={{
                        width: fullWidth ? "100%" : (cardWidth ?? 300),
                        height: cardHeight ?? 380,
                    }}
                >
                    <TestimonialCard
                        testimonial={testimonials[0]}
                        index={0}
                        isDuplicate={false}
                        isStacking={true}
                        isStatic={true}
                        onVideoPlay={onVideoPlay}
                        cardWidth={cardWidth}
                        cardHeight={cardHeight}
                        quoteFont={quoteFont}
                        nameFont={nameFont}
                        roleFont={roleFont}
                    />
                </div>
            </div>
        )
    }
    return (
        <div
            ref={wrapperRef}
            style={{
                width: "100%",
                height: `${(testimonials.length + 1) * 100}vh`,
                position: "relative",
            }}
        >
            <div
                ref={containerRef}
                style={{
                    position: "sticky",
                    top: 0,
                    height: "100vh",
                    width: "100%",
                    maxWidth: 1200,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: 1000,
                    padding: fullWidth ? "0 24px" : 0,
                    boxSizing: "border-box",
                    overflow: "hidden",
                }}
            >
                {testimonials.map((t, i) => (
                    <div
                        key={t.id || i}
                        ref={(el) => {
                            cardRefs.current[i] = el
                        }}
                        style={{
                            position: "absolute",
                            width: fullWidth ? "100%" : (cardWidth ?? 300),
                            height: cardHeight ?? 380,
                        }}
                    >
                        <TestimonialCard
                            testimonial={t}
                            index={i}
                            isDuplicate={false}
                            isStacking={true}
                            isStatic={isStatic}
                            onVideoPlay={onVideoPlay}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            quoteFont={quoteFont}
                            nameFont={nameFont}
                            roleFont={roleFont}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────
// INFINITE TRACK LOGIC
// ─────────────────────────────────────────────────────────────────────────
function InfiniteTrack({
    testimonials,
    originalCount,
    oneSetWidth,
    isHovered,
    trackRef,
    direction,
    isPaused = false,
    isStatic = false,
    onVideoPlay,
    cardWidth,
    cardHeight,
    quoteFont,
    nameFont,
    roleFont,
}: {
    testimonials: Testimonial[]
    originalCount: number
    oneSetWidth: number
    isHovered: boolean
    trackRef: React.RefObject<HTMLDivElement | null>
    direction: "left" | "right"
    isPaused?: boolean
    isStatic?: boolean
    onVideoPlay?: (url: string) => void
    cardWidth?: number
    cardHeight?: number
    quoteFont?: Partial<CSSProperties>
    nameFont?: Partial<CSSProperties>
    roleFont?: Partial<CSSProperties>
}) {
    const [isDragging, setIsDragging] = useState(false)
    const state = useRef({
        x: direction === "right" ? -oneSetWidth : 0,
        isDragging: false,
        decayVelocity: 0,
        baseSpeed: oneSetWidth / 30000,
        lastTime: 0,
        isHovered: false,
        isPaused: false,
        startX: 0,
        startY: 0,
    })
    useLayoutEffect(() => {
        if (isStatic) return
        state.current.x = wrapX(
            direction === "right" ? -oneSetWidth : 0,
            oneSetWidth
        )
        state.current.baseSpeed = oneSetWidth / 30000
        if (trackRef.current) {
            gsap.set(trackRef.current, { x: state.current.x })
        }
    }, [oneSetWidth, direction, isStatic])
    useEffect(() => {
        if (isStatic) return
        state.current.isHovered = isHovered
    }, [isHovered, isStatic])
    useEffect(() => {
        if (isStatic) return
        state.current.isPaused = isPaused
    }, [isPaused, isStatic])
    useEffect(() => {
        if (isStatic) return
        const track = trackRef.current
        if (!track || oneSetWidth <= 0) return
        const s = state.current
        s.lastTime = performance.now()
        const onTick = () => {
            const time = performance.now()
            const dt = time - s.lastTime
            s.lastTime = time
            if (dt > 0 && dt <= 100) {
                const speedMultiplier = s.isHovered ? 0.3 : 1
                const finalMultiplier = s.isPaused ? 0 : speedMultiplier
                const baseVelocity =
                    direction === "right"
                        ? s.baseSpeed * finalMultiplier
                        : -s.baseSpeed * finalMultiplier
                s.x += baseVelocity * dt
                if (!s.isDragging) {
                    s.x += s.decayVelocity * dt
                    s.decayVelocity *= Math.pow(0.9, dt / 16.67)
                    if (Math.abs(s.decayVelocity) < 0.01) s.decayVelocity = 0
                }
                s.x = wrapX(s.x, oneSetWidth)
                gsap.set(track, { x: s.x })
            }
        }
        gsap.ticker.add(onTick)
        let lastPointerX = 0,
            lastPointerTime = 0,
            pointerId: number | null = null
        const onPointerDown = (e: PointerEvent) => {
            if (e.pointerType === "mouse" && e.button !== 0) return
            s.startX = e.clientX
            s.startY = e.clientY
            lastPointerX = e.clientX
            lastPointerTime = performance.now()
            s.decayVelocity = 0
            pointerId = e.pointerId
        }
        const onPointerMove = (e: PointerEvent) => {
            if (pointerId === null) return
            const dx = e.clientX - s.startX
            const dy = e.clientY - s.startY
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (!s.isDragging && distance > 5) {
                s.isDragging = true
                setIsDragging(true)
                track.setPointerCapture(pointerId)
                track.style.cursor = "grabbing"
                track.style.userSelect = "none"
            }
            if (s.isDragging) {
                const moveDx = e.clientX - lastPointerX
                s.x = wrapX(s.x + moveDx, oneSetWidth)
                const now = performance.now()
                const dt = now - lastPointerTime
                if (dt > 0) {
                    s.decayVelocity = moveDx / dt
                    lastPointerX = e.clientX
                    lastPointerTime = now
                }
            }
        }
        const onPointerUp = (e: PointerEvent) => {
            if (pointerId === null) return
            if (s.isDragging) {
                s.isDragging = false
                setIsDragging(false)
                track.releasePointerCapture(pointerId)
                track.style.cursor = "grab"
                track.style.userSelect = ""
            }
            pointerId = null
        }
        track.addEventListener("pointerdown", onPointerDown)
        track.addEventListener("pointermove", onPointerMove)
        track.addEventListener("pointerup", onPointerUp)
        track.addEventListener("pointercancel", onPointerUp)
        return () => {
            gsap.ticker.remove(onTick)
            track.removeEventListener("pointerdown", onPointerDown)
            track.removeEventListener("pointermove", onPointerMove)
            track.removeEventListener("pointerup", onPointerUp)
            track.removeEventListener("pointercancel", onPointerUp)
        }
    }, [oneSetWidth, direction, isStatic])
    return (
        <div
            ref={trackRef}
            style={{
                display: "flex",
                gap: 24,
                padding: "40px 0",
                width: "max-content",
                perspective: 1000,
                willChange: "transform",
                touchAction: "pan-y",
                cursor: isStatic ? "default" : "grab",
            }}
        >
            {testimonials.map((t, i) => {
                const shouldSkipAppear =
                    direction === "left"
                        ? i >= originalCount
                        : i < originalCount
                let visualIndex = i
                if (direction === "right" && i >= originalCount)
                    visualIndex = i - originalCount
                else if (direction === "left" && i < originalCount)
                    visualIndex = i
                else visualIndex = 0
                return (
                    <TestimonialCard
                        key={t.id || i}
                        testimonial={t}
                        index={visualIndex}
                        isDuplicate={shouldSkipAppear}
                        disableHover={isDragging}
                        isStatic={isStatic}
                        onVideoPlay={onVideoPlay}
                        cardWidth={cardWidth}
                        cardHeight={cardHeight}
                        quoteFont={quoteFont}
                        nameFont={nameFont}
                        roleFont={roleFont}
                    />
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────
// ONSCROLL TRACK — TeamScroller-style pinned horizontal scroll
// ─────────────────────────────────────────────────────────────────────────
function OnScrollTrack({
    testimonials,
    sectionTitle,
    sectionSubtitle,
    titleColor,
    subtitleColor,
    backgroundColor,
    isStatic = false,
    onVideoPlay,
    cardWidth,
    cardHeight,
    quoteFont,
    nameFont,
    roleFont,
    titleFont,
    subtitleFont,
}: {
    testimonials: Testimonial[]
    sectionTitle: string
    sectionSubtitle: string
    titleColor: string
    subtitleColor: string
    backgroundColor: string
    isStatic?: boolean
    onVideoPlay?: (url: string) => void
    cardWidth?: number
    cardHeight?: number
    quoteFont?: Partial<CSSProperties>
    nameFont?: Partial<CSSProperties>
    roleFont?: Partial<CSSProperties>
    titleFont?: Partial<CSSProperties>
    subtitleFont?: Partial<CSSProperties>
}) {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const accentColor = subtitleColor || "#d4af37"
    useEffect(() => {
        const el = document.createElement("style")
        el.setAttribute("data-onscroll-testimonials", "1")
        el.textContent = `
.ts-onscroll-wrapper {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
}
.ts-onscroll-container {
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 10vw;
  padding-right: 20vw;
  width: max-content;
  will-change: transform;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}
.ts-onscroll-container:active { cursor: grabbing; }
.ts-onscroll-intro {
  width: 340px;
  margin-right: 7vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;
}
.ts-onscroll-intro-eyebrow {
  font-size: clamp(0.7rem, 2vw, 0.8rem);
  text-transform: uppercase;
  letter-spacing: 0.3em;
  margin-bottom: 1.25rem;
  display: block;
  font-weight: 500;
}
.ts-onscroll-intro-title {
  font-size: clamp(1.75rem, 4.5vw, 3rem);
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0;
}
.ts-onscroll-track {
  display: flex;
  gap: 24px;
  align-items: center;
}
.ts-onscroll-card-wrap {
  flex-shrink: 0;
}
/* static variant */
.ts-onscroll-static-outer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 480px;
  overflow-x: auto;
  overflow-y: hidden;
}
.ts-onscroll-static-inner {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 40px 6vw;
  width: max-content;
  gap: 0;
}
.ts-onscroll-static-intro {
  width: 280px;
  margin-right: 5vw;
  flex-shrink: 0;
}
.ts-onscroll-static-track {
  display: flex;
  gap: 24px;
}
@media (prefers-reduced-motion: reduce) {
  .ts-onscroll-container .testimonial-card { transform: none !important; }
}
`
        document.head.appendChild(el)
        return () => {
            el.remove()
        }
    }, [])
    useEffect(() => {
        if (isStatic) return
        if (!wrapperRef.current || !containerRef.current || !trackRef.current)
            return
        const wrapper = wrapperRef.current
        const container = containerRef.current
        const getViewWidth = () => wrapper.clientWidth || window.innerWidth
        let st: ScrollTrigger | null = null
        const cards =
            container.querySelectorAll<HTMLElement>(".testimonial-card")
        const skewSetter = gsap.quickSetter(cards, "skewX", "deg")
        const clampSkew = gsap.utils.clamp(-10, 10)
        let currentSkew = 0
        let skewRafId = 0
        const decaySkew = () => {
            currentSkew *= 0.86
            skewSetter(currentSkew)
            if (Math.abs(currentSkew) > 0.05) {
                skewRafId = requestAnimationFrame(decaySkew)
            } else {
                currentSkew = 0
                skewSetter(0)
            }
        }
        const tl = gsap.timeline({ ease: "none" })
        tl.to(
            container,
            {
                x: () => -(container.scrollWidth - getViewWidth()),
                ease: "none",
            },
            0
        )
        st = ScrollTrigger.create({
            trigger: wrapper,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${container.scrollWidth - getViewWidth()}`,
            invalidateOnRefresh: true,
            animation: tl,
            onUpdate(self) {
                const targetSkew = clampSkew(self.getVelocity() / -300)
                if (targetSkew !== 0) {
                    currentSkew = targetSkew
                    cancelAnimationFrame(skewRafId)
                    skewRafId = requestAnimationFrame(decaySkew)
                }
            },
        })
        let isDragging = false
        let wasDragged = false
        let startX = 0
        let lastX = 0
        let lastY = 0
        let axisLock: "horizontal" | "vertical" | null = null
        let dragScrollY = 0
        let clickedCard: HTMLElement | null = null
        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0 && e.pointerType === "mouse") return
            clickedCard = (e.target as HTMLElement).closest<HTMLElement>(
                ".testimonial-card"
            )
            isDragging = true
            wasDragged = false
            axisLock = null
            startX = e.clientX
            lastX = e.clientX
            lastY = e.clientY
            dragScrollY = window.scrollY
            gsap.killTweensOf(window)
        }
        const onPointerMove = (e: PointerEvent) => {
            if (!isDragging || !st) return
            const dxTotal = e.clientX - startX
            const dyTotal = e.clientY - lastY
            const dx = e.clientX - lastX
            lastX = e.clientX
            lastY = e.clientY
            if (e.pointerType === "touch") {
                if (!axisLock) {
                    if (Math.abs(dxTotal) < 6 && Math.abs(dyTotal) < 6) return
                    axisLock =
                        Math.abs(dxTotal) > Math.abs(dyTotal)
                            ? "horizontal"
                            : "vertical"
                    if (axisLock === "horizontal")
                        container.setPointerCapture(e.pointerId)
                    else {
                        isDragging = false
                        return
                    }
                }
            } else {
                if (Math.abs(dxTotal) < 6 && Math.abs(dyTotal) < 6) return
                if (!container.hasPointerCapture(e.pointerId))
                    container.setPointerCapture(e.pointerId)
            }
            if (Math.abs(dxTotal) > 10) wasDragged = true
            dragScrollY = Math.min(Math.max(dragScrollY - dx, st.start), st.end)
            window.scrollTo(0, dragScrollY)
            if (st.animation) st.animation.progress(st.progress)
        }
        const onPointerUp = (e: PointerEvent) => {
            if (!isDragging) {
                clickedCard = null
                return
            }
            if (!wasDragged && clickedCard) {
                clickedCard.click()
            }
            isDragging = false
            clickedCard = null
            axisLock = null
            if (container.hasPointerCapture(e.pointerId))
                container.releasePointerCapture(e.pointerId)
        }
        const onPointerCancel = (e: PointerEvent) => {
            isDragging = false
            clickedCard = null
            axisLock = null
            if (container.hasPointerCapture(e.pointerId))
                container.releasePointerCapture(e.pointerId)
        }
        container.addEventListener("pointerdown", onPointerDown)
        container.addEventListener("pointermove", onPointerMove)
        container.addEventListener("pointerup", onPointerUp)
        container.addEventListener("pointercancel", onPointerCancel)
        const onResize = debounce(() => ScrollTrigger.refresh(), 150)
        window.addEventListener("resize", onResize)
        return () => {
            st?.kill()
            cancelAnimationFrame(skewRafId)
            container.removeEventListener("pointerdown", onPointerDown)
            container.removeEventListener("pointermove", onPointerMove)
            container.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointercancel", onPointerCancel)
            window.removeEventListener("resize", onResize)
        }
    }, [testimonials, isStatic])
    if (isStatic) {
        return (
            <div
                className="ts-onscroll-static-outer"
                style={{ backgroundColor }}
            >
                <div className="ts-onscroll-static-inner">
                    <div className="ts-onscroll-static-intro">
                        {sectionSubtitle && (
                            <span
                                className="ts-onscroll-intro-eyebrow"
                                style={{ color: accentColor, ...subtitleFont }}
                            >
                                {sectionSubtitle}
                            </span>
                        )}
                        {sectionTitle && (
                            <h2
                                className="ts-onscroll-intro-title"
                                style={{ color: titleColor, ...titleFont }}
                            >
                                {sectionTitle}
                            </h2>
                        )}
                    </div>
                    <div className="ts-onscroll-static-track">
                        {testimonials.map((t, i) => (
                            <div
                                key={t.id || i}
                                className="ts-onscroll-card-wrap"
                            >
                                <TestimonialCard
                                    testimonial={t}
                                    index={i}
                                    isDuplicate={false}
                                    isStatic={true}
                                    onVideoPlay={onVideoPlay}
                                    cardWidth={cardWidth}
                                    cardHeight={cardHeight}
                                    quoteFont={quoteFont}
                                    nameFont={nameFont}
                                    roleFont={roleFont}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div
            ref={wrapperRef}
            className="ts-onscroll-wrapper"
            style={{ backgroundColor }}
        >
            <div ref={containerRef} className="ts-onscroll-container">
                <div className="ts-onscroll-intro">
                    {sectionSubtitle && (
                        <span
                            className="ts-onscroll-intro-eyebrow"
                            style={{ color: accentColor, ...subtitleFont }}
                        >
                            {sectionSubtitle}
                        </span>
                    )}
                    {sectionTitle && (
                        <h2
                            className="ts-onscroll-intro-title"
                            style={{ color: titleColor, ...titleFont }}
                        >
                            {sectionTitle}
                        </h2>
                    )}
                </div>
                <div ref={trackRef} className="ts-onscroll-track">
                    {testimonials.map((t, i) => (
                        <div key={t.id || i} className="ts-onscroll-card-wrap">
                            <TestimonialCard
                                testimonial={t}
                                index={i}
                                isDuplicate={false}
                                isStatic={false}
                                onVideoPlay={onVideoPlay}
                                cardWidth={cardWidth}
                                cardHeight={cardHeight}
                                quoteFont={quoteFont}
                                nameFont={nameFont}
                                roleFont={roleFont}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────
// RESPONSIVE GRID LOGIC
// ─────────────────────────────────────────────────────────────────────────
function GridTrack({
    testimonials,
    columns = 0,
    gap = 24,
    isStatic = false,
    onVideoPlay,
    cardWidth,
    cardHeight,
    quoteFont,
    nameFont,
    roleFont,
}: {
    testimonials: Testimonial[]
    columns?: number
    gap?: number
    isStatic?: boolean
    onVideoPlay?: (url: string) => void
    cardWidth?: number
    cardHeight?: number
    quoteFont?: Partial<CSSProperties>
    nameFont?: Partial<CSSProperties>
    roleFont?: Partial<CSSProperties>
}) {
    const isAuto = !columns || columns <= 0
    const gridTemplateColumns = isAuto
        ? "repeat(auto-fit, minmax(min(100%, 300px), 1fr))"
        : `repeat(${Math.round(columns)}, 1fr)`
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflowY: "auto",
                padding: 24,
                boxSizing: "border-box",
            }}
        >
            <style>{`.testimonial-grid-responsive::-webkit-scrollbar { display: none; } .testimonial-grid-responsive { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            <div
                className="testimonial-grid-responsive"
                style={{ display: "grid", gap: gap, gridTemplateColumns }}
            >
                {testimonials.map((t, i) => (
                    <TestimonialCard
                        key={t.id || i}
                        testimonial={t}
                        index={i}
                        isDuplicate={false}
                        isGrid={true}
                        isStatic={isStatic}
                        onVideoPlay={onVideoPlay}
                        cardWidth={cardWidth}
                        cardHeight={cardHeight}
                        quoteFont={quoteFont}
                        nameFont={nameFont}
                        roleFont={roleFont}
                    />
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
/**
 * @framerDisableUnlink
 */
export default function InteractiveTestimonials(props: MyComponentProps) {
    const {
        testimonials = defaultTestimonials,
        fadeColor,
        backgroundColor = "#0a0a0a",
        direction = "left",
        mode = "marquee",
        stackingFullWidth = false,
        gridColumns = 0,
        gridGap = 24,
        onScrollSectionTitle = "What people are saying.",
        onScrollSectionSubtitle = "Testimonials",
        onScrollTitleColor = "#ffffff",
        onScrollSubtitleColor = "#d4af37",
        cardWidth,
        cardHeight,
        quoteFont,
        nameFont,
        roleFont,
        titleFont,
        subtitleFont,
    } = props
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const [measuredCardWidthState, setMeasuredCardWidthState] = useState<
        number | null
    >(null)
    const [isHovered, setIsHovered] = useState(false)
    const [isVideoPlaying, setIsVideoPlaying] = useState(false)
    const [activeVideo, setActiveVideo] = useState<string | null>(null)
    const gap = 24
    useEffect(() => {
        if (isStatic) return
        registerGSAPPlugins()
    }, [isStatic])
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        const el = rootRef.current
        if (!el) return
        if (typeof ResizeObserver === "undefined") {
            const onResize = () => ScrollTrigger.refresh()
            window.addEventListener("resize", onResize)
            return () => window.removeEventListener("resize", onResize)
        }
        const observer = new ResizeObserver(() => {
            ScrollTrigger.refresh()
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])
    const openVideo = useCallback((url: string) => {
        startTransition(() => {
            setActiveVideo(url)
            setIsVideoPlaying(true)
        })
    }, [])
    const closeVideo = useCallback(() => {
        startTransition(() => {
            setActiveVideo(null)
            setIsVideoPlaying(false)
        })
    }, [])
    useLayoutEffect(() => {
        if (isStatic) return
        if (trackRef.current) {
            const firstCard = trackRef.current.querySelector(
                ".testimonial-card"
            ) as HTMLElement
            if (firstCard) {
                startTransition(() =>
                    setMeasuredCardWidthState(firstCard.clientWidth)
                )
            }
        }
    }, [testimonials, mode, isStatic])
    const measuredCardWidthValue = cardWidth ?? measuredCardWidthState ?? 300
    const oneSetWidth = useMemo(
        () => testimonials.length * (measuredCardWidthValue + gap),
        [testimonials.length, measuredCardWidthValue, gap]
    )
    const duplicatedTestimonials = useMemo(
        () => [...testimonials, ...testimonials],
        [testimonials]
    )
    if (mode === "onscroll") {
        return (
            <>
                <OnScrollTrack
                    testimonials={testimonials}
                    sectionTitle={onScrollSectionTitle}
                    sectionSubtitle={onScrollSectionSubtitle}
                    titleColor={onScrollTitleColor}
                    subtitleColor={onScrollSubtitleColor}
                    backgroundColor={backgroundColor}
                    isStatic={isStatic}
                    onVideoPlay={openVideo}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    quoteFont={quoteFont}
                    nameFont={nameFont}
                    roleFont={roleFont}
                    titleFont={titleFont}
                    subtitleFont={subtitleFont}
                />
                {!isStatic && activeVideo && (
                    <VideoModal videoUrl={activeVideo} onClose={closeVideo} />
                )}
            </>
        )
    }
    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: backgroundColor,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                overflow: mode === "stacking" ? "visible" : "hidden",
                position: "relative",
                ...props.style,
                visibility:
                    !isStatic &&
                    mode === "marquee" &&
                    measuredCardWidthState == null
                        ? "hidden"
                        : "visible",
            }}
        >
            {mode === "marquee" && (
                <div
                    style={{
                        width: "100%",
                        overflow: "hidden",
                        position: "relative",
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                    }}
                    onMouseEnter={
                        isStatic ? undefined : () => setIsHovered(true)
                    }
                    onMouseLeave={
                        isStatic ? undefined : () => setIsHovered(false)
                    }
                    aria-label="Interactive testimonial marquee"
                >
                    {fadeColor && (
                        <>
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    width: 120,
                                    background: `linear-gradient(to right, ${fadeColor}, transparent)`,
                                    zIndex: 2,
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    right: 0,
                                    width: 120,
                                    background: `linear-gradient(to left, ${fadeColor}, transparent)`,
                                    zIndex: 2,
                                    pointerEvents: "none",
                                }}
                            />
                        </>
                    )}
                    {isStatic ? (
                        <div
                            style={{
                                display: "flex",
                                gap,
                                padding: "40px 0",
                                width: "max-content",
                            }}
                            aria-label="Testimonial preview"
                        >
                            {testimonials
                                .slice(0, 3)
                                .map((testimonial, index) => (
                                    <TestimonialCard
                                        key={testimonial.id || index}
                                        testimonial={testimonial}
                                        index={index}
                                        isDuplicate={false}
                                        isStatic={true}
                                        cardWidth={cardWidth}
                                        cardHeight={cardHeight}
                                        quoteFont={quoteFont}
                                        nameFont={nameFont}
                                        roleFont={roleFont}
                                    />
                                ))}
                        </div>
                    ) : (
                        <InfiniteTrack
                            testimonials={duplicatedTestimonials}
                            originalCount={testimonials.length}
                            oneSetWidth={oneSetWidth}
                            isHovered={isHovered}
                            trackRef={trackRef}
                            direction={direction}
                            isPaused={isVideoPlaying}
                            isStatic={false}
                            onVideoPlay={openVideo}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            quoteFont={quoteFont}
                            nameFont={nameFont}
                            roleFont={roleFont}
                        />
                    )}
                </div>
            )}
            {mode === "stacking" && (
                <StackingTrack
                    testimonials={testimonials}
                    fullWidth={stackingFullWidth}
                    isStatic={isStatic}
                    onVideoPlay={openVideo}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    quoteFont={quoteFont}
                    nameFont={nameFont}
                    roleFont={roleFont}
                />
            )}
            {mode === "grid" && (
                <GridTrack
                    testimonials={testimonials}
                    columns={gridColumns}
                    gap={gridGap}
                    isStatic={isStatic}
                    onVideoPlay={openVideo}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    quoteFont={quoteFont}
                    nameFont={nameFont}
                    roleFont={roleFont}
                />
            )}
            {!isStatic && activeVideo && (
                <VideoModal videoUrl={activeVideo} onClose={closeVideo} />
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────
// FRAMER PROPERTY CONTROLS
// ─────────────────────────────────────────────────────────────────────────
addPropertyControls(InteractiveTestimonials, {
    mode: {
        type: ControlType.Enum,
        options: ["marquee", "onscroll", "stacking", "grid"],
        optionTitles: [
            "Marquee",
            "Onscroll Trigger",
            "Stacking Cards",
            "Responsive Grid",
        ],
        defaultValue: "marquee",
        title: "Mode",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 300,
        min: 150,
        max: 800,
        step: 1,
        unit: "px",
        hidden: ({ mode }) => mode === "onscroll" || mode === "grid",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 380,
        min: 150,
        max: 1000,
        step: 1,
        unit: "px",
        hidden: ({ mode }) => mode === "onscroll" || mode === "grid",
    },
    stackingFullWidth: {
        type: ControlType.Boolean,
        title: "Full Width (Stacking)",
        defaultValue: false,
        description:
            "Makes the stacking cards take 100% width of the container.",
        hidden: ({ mode }) => mode !== "stacking",
    },
    gridColumns: {
        type: ControlType.Number,
        title: "Grid Columns",
        defaultValue: 0,
        min: 0,
        max: 6,
        step: 1,
        displayStepper: true,
        description: "0 = Auto (adjusts based on container width).",
        hidden: ({ mode }) => mode !== "grid",
    },
    gridGap: {
        type: ControlType.Number,
        title: "Grid Gap",
        defaultValue: 24,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        hidden: ({ mode }) => mode !== "grid",
    },
    onScrollSectionTitle: {
        type: ControlType.String,
        title: "Section Title",
        defaultValue: "What people are saying.",
        displayTextArea: false,
        hidden: ({ mode }) => mode !== "onscroll",
    },
    onScrollSectionSubtitle: {
        type: ControlType.String,
        title: "Eyebrow Label",
        defaultValue: "Testimonials",
        hidden: ({ mode }) => mode !== "onscroll",
    },
    onScrollTitleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#ffffff",
        hidden: ({ mode }) => mode !== "onscroll",
    },
    onScrollSubtitleColor: {
        type: ControlType.Color,
        title: "Eyebrow Color",
        defaultValue: "#d4af37",
        hidden: ({ mode }) => mode !== "onscroll",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0a",
    },
    direction: {
        type: ControlType.Enum,
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        title: "Direction",
        description: "Only applies when Mode is set to Marquee.",
        hidden: ({ mode }) => mode !== "marquee",
    },
    fadeColor: {
        type: ControlType.Color,
        title: "Fade Color",
        defaultValue: "#FFFFFF",
        hidden: ({ mode }) => mode !== "marquee",
    },
    quoteFont: {
        type: ControlType.Font,
        controls: "extended",
        title: "Quote Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 16,
            lineHeight: 1.6,
            letterSpacing: "-0.01em",
        },
    },
    nameFont: {
        type: ControlType.Font,
        controls: "extended",
        title: "Name Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
        },
    },
    roleFont: {
        type: ControlType.Font,
        controls: "extended",
        title: "Role Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 12,
        },
    },
    titleFont: {
        type: ControlType.Font,
        controls: "extended",
        title: "Section Title Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 300,
            fontSize: 48,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
        },
        hidden: ({ mode }) => mode !== "onscroll",
    },
    subtitleFont: {
        type: ControlType.Font,
        controls: "extended",
        title: "Section Subtitle Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "0.3em",
        },
        hidden: ({ mode }) => mode !== "onscroll",
    },
    testimonials: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    displayTextArea: true,
                    title: "Quote",
                    defaultValue: "Share a concise testimonial quote.",
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Jane Doe",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Product Designer",
                },
                avatar: {
                    type: ControlType.ResponsiveImage,
                    title: "Avatar Image",
                },
                companyLogo: {
                    type: ControlType.ResponsiveImage,
                    title: "Company Logo",
                },
                avatarAsBackground: {
                    type: ControlType.Boolean,
                    title: "Avatar as Background",
                    defaultValue: false,
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Video File",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                video: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://youtube.com/watch?v=xxx or .mp4",
                    description:
                        "Supports YouTube URLs or direct video files (.mp4, .webm).",
                },
                videoDisplay: {
                    type: ControlType.Enum,
                    options: ["popup", "background"],
                    optionTitles: ["Popup", "Background"],
                    title: "Video Display",
                    defaultValue: "popup",
                    description:
                        "Choose if video opens in a popup overlay or plays inline as card background.",
                },
                rating: {
                    type: ControlType.Number,
                    title: "Rating",
                    defaultValue: 5,
                    min: 0,
                    max: 5,
                    step: 1,
                },
                theme: {
                    type: ControlType.Enum,
                    options: [
                        "light-blue",
                        "light-gray",
                        "green",
                        "dark",
                        "mint",
                        "lavender",
                        "peach",
                        "coral",
                        "sky",
                        "rose",
                        "yellow",
                        "slate",
                        "indigo",
                        "emerald",
                        "amber",
                        "fuchsia",
                        "cyan",
                        "violet",
                        "teal",
                        "orange",
                        "zinc",
                        "ruby",
                        "glamourprism",
                        "neo-brutalism",
                    ],
                    optionTitles: [
                        "Light Blue",
                        "Light Gray",
                        "Green",
                        "Dark",
                        "Mint",
                        "Lavender",
                        "Peach",
                        "Coral",
                        "Sky",
                        "Rose",
                        "Yellow",
                        "Slate",
                        "Indigo",
                        "Emerald",
                        "Amber",
                        "Fuchsia",
                        "Cyan",
                        "Violet",
                        "Teal",
                        "Orange",
                        "Zinc",
                        "Ruby",
                        "Glamourprism",
                        "Neo Brutalism",
                    ],
                    title: "Theme",
                },
            },
        },
        defaultValue: defaultTestimonials,
    },
})
