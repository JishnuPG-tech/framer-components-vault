// ScratchCardPopup.tsx
import {
    useEffect,
    useRef,
    useState,
    useMemo,
    useId,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
    type TouchEvent as ReactTouchEvent,
    type KeyboardEvent as ReactKeyboardEvent,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageItem {
    src: string
    srcSet?: string
    alt?: string
}

const getImageSrc = (img: ImageItem | string): string =>
    typeof img === "string" ? img : img.src

const svgDataUri = (svg: string): string =>
    `data:image/svg+xml,${encodeURIComponent(svg)}`

const ICON_CROWN = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#D4AF37" d="M2 8l4 3 6-7 6 7 4-3-2 10H4L2 8zM4 20h16v2H4z"/></svg>`
)
const ICON_DIAMOND = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#60A5FA" d="M6 3h12l4 6-10 12L2 9z"/></svg>`
)
const ICON_GIFT = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" fill="#34D399"/><rect x="3" y="6" width="18" height="4" fill="#10B981"/><rect x="10.5" y="6" width="3" height="15" fill="#ffffff"/></svg>`
)
const ICON_STAR = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F472B6" d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l7.1-1.01z"/></svg>`
)
const ICON_HEXAGON = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="#A78BFA" stroke-width="2" d="M12 2l8 4.5v11L12 22l-8-4.5v-11z"/></svg>`
)
const ICON_COIN = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#FBBF24"/><circle cx="12" cy="12" r="9" fill="none" stroke="#D97706" stroke-width="1.5"/><text x="12" y="16" font-size="10" text-anchor="middle" fill="#92400E" font-family="Arial">$</text></svg>`
)
const ICON_HEART = svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F87171" d="M12 21s-8-5.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-8 11-8 11z"/></svg>`
)

interface Prize {
    title: string
    description: string
    code: string
}

interface ScratchThemeConfig {
    name: string
    title: string
    subtitle: string
    scratchHint: string
    triggerText: string
    primary: string
    accent: string
    cardBg: string
    text: string
    muted: string
    prizes: Prize[]
}

const THEMES: { [key: string]: ScratchThemeConfig } = {
    ecommerce: {
        name: "E-Commerce",
        title: "Unlock Your Reward",
        subtitle: "Scratch the foil and match three identical items",
        scratchHint: "Scratch the foil",
        triggerText: "Scratch & Win",
        primary: "linear-gradient(160deg, #dbeafe 0%, #bfdbfe 100%)",
        accent: "#0f172a",
        cardBg: "#ffffff",
        text: "#0f172a",
        muted: "rgba(15,23,42,0.55)",
        prizes: [
            {
                title: "Congratulations",
                description: "You unlocked 50% off",
                code: "GOLD50",
            },
            {
                title: "Nice!",
                description: "Free shipping unlocked",
                code: "SHIPFREE",
            },
            {
                title: "Lucky you",
                description: "Mystery gift added",
                code: "GIFT25",
            },
        ],
    },
    campaign: {
        name: "Campaign / Sale",
        title: "Scratch Before It's Gone",
        subtitle: "Limited-time drop — scratch now",
        scratchHint: "Scratch to reveal",
        triggerText: "Scratch for a Deal",
        primary: "linear-gradient(160deg, #fff1f0 0%, #fecdd3 100%)",
        accent: "#dc2626",
        cardBg: "#ffffff",
        text: "#0f172a",
        muted: "rgba(15,23,42,0.55)",
        prizes: [
            {
                title: "You got it!",
                description: "20% off your order",
                code: "SALE20",
            },
            {
                title: "Boom!",
                description: "30% off your order",
                code: "SALE30",
            },
            {
                title: "Jackpot",
                description: "40% off your order",
                code: "SALE40",
            },
        ],
    },
    restaurant: {
        name: "Restaurant / Cafe",
        title: "Today's Lucky Scratch",
        subtitle: "Scratch, reveal, treat yourself",
        scratchHint: "Scratch the card",
        triggerText: "Scratch for a Treat",
        primary: "linear-gradient(160deg, #fff7ed 0%, #fde8cf 100%)",
        accent: "#b45309",
        cardBg: "#ffffff",
        text: "#0f172a",
        muted: "rgba(15,23,42,0.55)",
        prizes: [
            {
                title: "Cheers!",
                description: "Free coffee on us",
                code: "CAFE-COFFEE",
            },
            {
                title: "Sweet!",
                description: "Free dessert with any meal",
                code: "CAFE-DESSERT",
            },
            {
                title: "Treat unlocked",
                description: "15% off your bill",
                code: "CAFE15",
            },
        ],
    },
    saas: {
        name: "SaaS / Freemium",
        title: "Scratch for a Plan Discount",
        subtitle: "One scratch per new account",
        scratchHint: "Scratch to reveal",
        triggerText: "Scratch & Save",
        primary: "linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)",
        accent: "#4f46e5",
        cardBg: "#ffffff",
        text: "#0f172a",
        muted: "rgba(15,23,42,0.55)",
        prizes: [
            {
                title: "Nice start",
                description: "10% off your first plan",
                code: "SAAS10",
            },
            {
                title: "Great pick",
                description: "1 month free",
                code: "SAAS-MONTH",
            },
            {
                title: "Top tier",
                description: "30% off your first plan",
                code: "SAAS30",
            },
        ],
    },
    event: {
        name: "Event / Tickets",
        title: "Scratch for an Early Bird Deal",
        subtitle: "Before you check out",
        scratchHint: "Scratch the card",
        triggerText: "Scratch for a Bonus",
        primary: "linear-gradient(160deg, #ecfeff 0%, #cffafe 100%)",
        accent: "#0891b2",
        cardBg: "#ffffff",
        text: "#0f172a",
        muted: "rgba(15,23,42,0.55)",
        prizes: [
            { title: "Nice!", description: "5% off your ticket", code: "EVT5" },
            {
                title: "Sweet",
                description: "Free drink ticket",
                code: "EVT-DRINK",
            },
            {
                title: "VIP",
                description: "VIP seating upgrade",
                code: "EVT-VIP",
            },
        ],
    },
}

const DEFAULT_IMAGES: ImageItem[] = [
    { src: ICON_CROWN },
    { src: ICON_CROWN },
    { src: ICON_CROWN },
    { src: ICON_DIAMOND },
    { src: ICON_GIFT },
    { src: ICON_STAR },
    { src: ICON_HEXAGON },
    { src: ICON_COIN },
    { src: ICON_HEART },
]

function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
}

function GiftIcon({ uid }: { uid: string }) {
    const gradientId = `${uid}-gift-ribbon`
    return (
        <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
            style={{ position: "relative" }}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
            </defs>
            <rect
                x="3.5"
                y="10"
                width="17"
                height="9.5"
                rx="1.5"
                fill="#ffffff"
            />
            <rect x="2.5" y="7" width="19" height="4" rx="1" fill="#ffffff" />
            <rect
                x="10.4"
                y="7"
                width="3.2"
                height="12.5"
                fill={`url(#${gradientId})`}
            />
            <path
                d="M12 7c-1.6 0-3-1-3.6-2.1C7.6 3.2 8.5 2 9.8 2c1.3 0 2.2 1.4 2.2 3 0-1.6.9-3 2.2-3 1.3 0 2.2 1.2 1.4 2.9C15 6 13.6 7 12 7z"
                fill={`url(#${gradientId})`}
            />
            <path
                d="M18.3 4.2l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5z"
                fill="#ffffff"
            />
        </svg>
    )
}

function DemoSwitch({
    checked,
    onChange,
}: {
    checked: boolean
    onChange: (value: boolean) => void
}) {
    const isStatic = useIsStaticRenderer()
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            style={{
                width: 42,
                height: 24,
                borderRadius: 20,
                border: "none",
                padding: 0,
                cursor: "pointer",
                background: checked ? "#ffffff" : "rgba(255,255,255,0.16)",
                position: "relative",
                flexShrink: 0,
                transition: isStatic ? "none" : "background 0.15s ease",
            }}
        >
            <span
                style={{
                    position: "absolute",
                    top: 3,
                    left: checked ? 21 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: checked ? "#0f172a" : "#ffffff",
                    transition: isStatic ? "none" : "left 0.15s ease",
                }}
            />
        </button>
    )
}

type ConfettiShape = "rect" | "square" | "circle" | "diamond" | "star"

function ScratchConfetti({
    colors,
    onDone,
}: {
    colors: string[]
    onDone: () => void
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return
        const canvas = canvasRef.current
        const parent = canvas?.parentElement
        if (!canvas || !parent) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = parent.clientWidth || 300
        const h = parent.clientHeight || 300
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = w + "px"
        canvas.style.height = h + "px"
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const shapes: ConfettiShape[] = [
            "rect",
            "square",
            "circle",
            "diamond",
            "star",
        ]

        interface P {
            x: number
            y: number
            vx: number
            vy: number
            rot: number
            vRot: number
            size: number
            color: string
            shape: ConfettiShape
            alpha: number
        }

        const count = w < 420 ? 70 : 110
        const particles: P[] = Array.from({ length: count }, () => {
            const angle = Math.random() * Math.PI * 2
            const speed = 3 + Math.random() * 7
            return {
                x: w / 2,
                y: h * 0.32,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.3,
                size: 5 + Math.random() * 7,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                alpha: 1,
            }
        })

        const drawParticle = (p: P) => {
            ctx.save()
            ctx.globalAlpha = Math.max(0, p.alpha)
            ctx.fillStyle = p.color
            ctx.translate(p.x, p.y)
            ctx.rotate(p.rot)
            switch (p.shape) {
                case "rect":
                    ctx.fillRect(
                        -p.size * 0.25,
                        -p.size * 0.6,
                        p.size * 0.5,
                        p.size * 1.2
                    )
                    break
                case "square":
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
                    break
                case "circle":
                    ctx.beginPath()
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
                    ctx.fill()
                    break
                case "diamond":
                    ctx.beginPath()
                    ctx.moveTo(0, -p.size * 0.6)
                    ctx.lineTo(p.size * 0.4, 0)
                    ctx.lineTo(0, p.size * 0.6)
                    ctx.lineTo(-p.size * 0.4, 0)
                    ctx.closePath()
                    ctx.fill()
                    break
                case "star": {
                    const outer = p.size * 0.5
                    const inner = p.size * 0.22
                    ctx.beginPath()
                    for (let i = 0; i < 10; i++) {
                        const a = (i * Math.PI) / 5 - Math.PI / 2
                        const r = i % 2 === 0 ? outer : inner
                        if (i === 0)
                            ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
                    }
                    ctx.closePath()
                    ctx.fill()
                    break
                }
            }
            ctx.restore()
        }

        const duration = 2400
        const start = performance.now()
        let rafId: number

        const animate = (t: number) => {
            const elapsed = t - start
            const cw = parent.clientWidth || w
            const ch = parent.clientHeight || h
            ctx.clearRect(0, 0, cw, ch)
            let anyAlive = false
            for (const p of particles) {
                p.vy += 0.14
                p.x += p.vx
                p.y += p.vy
                p.rot += p.vRot
                if (elapsed > duration * 0.55) p.alpha -= 0.025
                if (p.alpha > 0.01 && p.y < ch + 40) {
                    anyAlive = true
                    drawParticle(p)
                }
            }
            if (elapsed < duration && anyAlive)
                rafId = requestAnimationFrame(animate)
            else onDoneRef.current()
        }

        rafId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafId)
    }, [colors, isStatic])

    if (isStatic) return null

    return (
        <canvas
            ref={canvasRef}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />
    )
}

const BRUSH_SIZE = 60

type ScratchPointerEvent =
    | ReactMouseEvent<HTMLCanvasElement>
    | ReactTouchEvent<HTMLCanvasElement>

const isTouchEvent = (
    e: ScratchPointerEvent
): e is ReactTouchEvent<HTMLCanvasElement> => "touches" in e

interface FontControlValue {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    fontSize?: number
    letterSpacing?: number | string
}

interface ScratchCardPopupProps {
    width?: number
    height?: number
    theme?: string
    accentColor?: string
    demoMode?: boolean
    asPopup?: boolean
    trigger?: "manual" | "delay" | "scroll"
    delaySeconds?: number
    widgetPosition?: "bottom-right" | "bottom-left"
    widgetIcon?: ImageItem | string
    storageKey?: string
    customizeCopy?: boolean
    customTitle?: string
    customSubtitle?: string
    customScratchHint?: string
    customTriggerText?: string
    customPrize1Title?: string
    customPrize1Description?: string
    customPrize1Code?: string
    customPrize2Title?: string
    customPrize2Description?: string
    customPrize2Code?: string
    customPrize3Title?: string
    customPrize3Description?: string
    customPrize3Code?: string
    customBackground?: string
    images?: (ImageItem | string)[]
    enableConfetti?: boolean
    revealThreshold?: number
    borderRadius?: number
    freeAttempts?: number
    scratchWordFont?: FontControlValue
    andWordFont?: FontControlValue
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 380
 * @framerIntrinsicHeight 640
 */
export default function ScratchCardPopup(props: ScratchCardPopupProps) {
    const {
        width = 380,
        theme = "ecommerce",
        accentColor,
        demoMode = false,
        asPopup = false,
        trigger = "manual",
        delaySeconds = 4,
        widgetPosition = "bottom-right",
        widgetIcon,
        storageKey = "",
        customizeCopy = false,
        customTitle,
        customSubtitle,
        customScratchHint,
        customTriggerText,
        customPrize1Title,
        customPrize1Description,
        customPrize1Code,
        customPrize2Title,
        customPrize2Description,
        customPrize2Code,
        customPrize3Title,
        customPrize3Description,
        customPrize3Code,
        customBackground,
        images = DEFAULT_IMAGES,
        enableConfetti = true,
        revealThreshold = 42,
        borderRadius = 36,
        freeAttempts = 3,
        scratchWordFont = {
            fontFamily: "Manrope",
            fontWeight: 800,
            fontSize: 15,
        },
        andWordFont = {
            fontFamily: "Instrument Serif",
            fontStyle: "italic",
            fontSize: 20,
        },
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const demoBarRef = useRef<HTMLDivElement>(null)
    const popupCardRef = useRef<HTMLDivElement>(null)
    const widgetTriggerRef = useRef<HTMLButtonElement>(null)
    const widgetContainerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const lastPoint = useRef<{ x: number; y: number } | null>(null)
    const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined
    )
    const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined
    )

    const [popupOpen, setPopupOpen] = useState(!asPopup)
    const [scrollTriggered, setScrollTriggered] = useState(false)
    const [widgetHover, setWidgetHover] = useState(false)
    const [widgetVisible, setWidgetVisible] = useState(true)

    const [demoTheme, setDemoTheme] = useState(theme)
    const [demoAsPopup, setDemoAsPopup] = useState(asPopup)
    const [demoWidgetPosition, setDemoWidgetPosition] = useState(widgetPosition)
    const [demoAccentColor, setDemoAccentColor] = useState(
        accentColor || THEMES[theme]?.accent || "#0f172a"
    )
    const [demoBackground, setDemoBackground] = useState("")
    const [demoBarSize, setDemoBarSize] = useState(0)
    const [demoFreeAttempts, setDemoFreeAttempts] = useState(freeAttempts)

    const activeThemeKey = demoMode ? demoTheme : theme
    const baseTheme = THEMES[activeThemeKey] || THEMES.ecommerce

    const ov = (base: string, override?: string): string =>
        override && override.trim() !== "" ? override : base

    const customPrizeTitles = [
        customPrize1Title,
        customPrize2Title,
        customPrize3Title,
    ]
    const customPrizeDescriptions = [
        customPrize1Description,
        customPrize2Description,
        customPrize3Description,
    ]
    const customPrizeCodes = [
        customPrize1Code,
        customPrize2Code,
        customPrize3Code,
    ]

    const activeTheme: ScratchThemeConfig = !customizeCopy
        ? baseTheme
        : {
              ...baseTheme,
              title: ov(baseTheme.title, customTitle),
              subtitle: ov(baseTheme.subtitle, customSubtitle),
              scratchHint: ov(baseTheme.scratchHint, customScratchHint),
              triggerText: ov(baseTheme.triggerText, customTriggerText),
              primary: ov(baseTheme.primary, customBackground),
              prizes: baseTheme.prizes.map((tier, i) => ({
                  title: ov(tier.title, customPrizeTitles[i]),
                  description: ov(tier.description, customPrizeDescriptions[i]),
                  code: ov(tier.code, customPrizeCodes[i]),
              })),
          }

    const isPopupMode = demoMode ? demoAsPopup : asPopup
    const activeWidgetPosition = demoMode ? demoWidgetPosition : widgetPosition
    const rawAccent = demoMode ? demoAccentColor : accentColor
    const resolvedAccent =
        rawAccent && rawAccent.toLowerCase() !== "#ffffff"
            ? rawAccent
            : activeTheme.accent
    const activeBrushSize = BRUSH_SIZE
    const activeRevealThreshold = revealThreshold
    const activeBorderRadius = borderRadius

    const colors = {
        primary:
            demoMode && demoBackground ? demoBackground : activeTheme.primary,
        accent: resolvedAccent,
        cardBg: activeTheme.cardBg,
        text: activeTheme.text,
        muted: activeTheme.muted,
    }

    const effectiveWidth = isPopupMode
        ? 420
        : typeof width === "number" && width > 0
          ? width
          : 380
    const isMobile = effectiveWidth < 420
    const padding = isMobile ? 16 : 28
    const cardSize = Math.min(
        effectiveWidth - padding * 2,
        isMobile ? 270 : 300
    )
    const outerRadius = activeBorderRadius
    const cardRadius = Math.max(12, activeBorderRadius - 6)
    const itemRadius = Math.max(8, activeBorderRadius - 12)

    const suffix = storageKey.trim() ? `-${storageKey.trim()}` : ""
    const attemptsKey = `scratch-attempts${suffix}`
    const rewardsKey = `scratch-rewards${suffix}`

    const [roundId, setRoundId] = useState(0)
    const [isRevealed, setIsRevealed] = useState(false)
    const [scratchProgress, setScratchProgress] = useState(0)
    const [awardedPrize, setAwardedPrize] = useState<Prize | null>(null)
    const [attemptsLeft, setAttemptsLeft] = useState(freeAttempts)
    const [rewards, setRewards] = useState<Prize[]>([])
    const [copiedCode, setCopiedCode] = useState<string | null>(null)
    const [showConfetti, setShowConfetti] = useState(false)

    useEffect(() => {
        return () => {
            clearTimeout(copyTimerRef.current)
            clearTimeout(confettiTimerRef.current)
        }
    }, [])

    useEffect(() => {
        if (isStatic) return
        try {
            const storedAttempts = localStorage.getItem(attemptsKey)
            const storedRewards = localStorage.getItem(rewardsKey)
            if (storedAttempts !== null)
                setAttemptsLeft(parseInt(storedAttempts, 10))
            if (storedRewards) setRewards(JSON.parse(storedRewards))
        } catch {
            // ignore
        }
    }, [attemptsKey, rewardsKey, isStatic])

    const displayItems = useMemo(() => {
        const source: (ImageItem | string)[] = images.length
            ? images
            : DEFAULT_IMAGES
        const nine = Array.from({ length: 9 }).map(
            (_, i) => source[i] || DEFAULT_IMAGES[i]
        )
        return isStatic ? nine : shuffle(nine)
    }, [images, roundId, isStatic])

    const matchedIndices = useMemo(() => {
        const counts: Record<string, number> = {}
        const indices: Record<string, number[]> = {}
        displayItems.forEach((img, idx) => {
            const key = (img && getImageSrc(img)) || `fallback-${idx}`
            counts[key] = (counts[key] || 0) + 1
            ;(indices[key] ||= []).push(idx)
        })
        for (const [key, count] of Object.entries(counts)) {
            if (count >= 3) return indices[key]
        }
        return null
    }, [displayItems])

    const isWon = isRevealed && matchedIndices !== null

    useEffect(() => {
        setPopupOpen(!isPopupMode)
    }, [isPopupMode])

    useEffect(() => {
        if (!isPopupMode || trigger !== "delay" || isStatic) return
        const t = setTimeout(() => setPopupOpen(true), delaySeconds * 1000)
        return () => clearTimeout(t)
    }, [isPopupMode, trigger, delaySeconds, isStatic])

    useEffect(() => {
        if (
            !isPopupMode ||
            trigger !== "scroll" ||
            isStatic ||
            !rootRef.current
        )
            return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !scrollTriggered) {
                    setScrollTriggered(true)
                    setPopupOpen(true)
                }
            },
            { threshold: 0.4 }
        )
        observer.observe(rootRef.current)
        return () => observer.disconnect()
    }, [isPopupMode, trigger, isStatic, scrollTriggered])

    useEffect(() => {
        if (!demoMode || isStatic || !demoBarRef.current) return
        const el = demoBarRef.current
        const ro = new ResizeObserver(([entry]) =>
            setDemoBarSize(entry.contentRect.width)
        )
        ro.observe(el)
        return () => ro.disconnect()
    }, [demoMode, isStatic])

    useEffect(() => {
        if (isStatic || !isPopupMode || !widgetContainerRef.current) return
        const el = widgetContainerRef.current
        const observer = new IntersectionObserver(
            ([entry]) => setWidgetVisible(entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isPopupMode, isStatic])

    const wasPopupOpenRef = useRef(false)
    useEffect(() => {
        if (isStatic || !isPopupMode) return
        if (popupOpen) {
            popupCardRef.current?.focus({ preventScroll: true })
        } else if (wasPopupOpenRef.current) {
            widgetTriggerRef.current?.focus({ preventScroll: true })
        }
        wasPopupOpenRef.current = popupOpen
    }, [isPopupMode, popupOpen, isStatic])

    useEffect(() => {
        if (isStatic) return
        const canvas = canvasRef.current
        if (!canvas || isRevealed) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = cardSize
        canvas.height = cardSize

        const roundRectPath = (inset: number, radius: number) => {
            const x = inset,
                y = inset,
                w = cardSize - inset * 2,
                h = cardSize - inset * 2
            ctx.beginPath()
            ctx.moveTo(x + radius, y)
            ctx.arcTo(x + w, y, x + w, y + h, radius)
            ctx.arcTo(x + w, y + h, x, y + h, radius)
            ctx.arcTo(x, y + h, x, y, radius)
            ctx.arcTo(x, y, x + w, y, radius)
            ctx.closePath()
        }

        const gradient = ctx.createLinearGradient(0, 0, cardSize, cardSize)
        gradient.addColorStop(0, "#6b4409")
        gradient.addColorStop(0.18, "#a9761a")
        gradient.addColorStop(0.4, "#e7bb52")
        gradient.addColorStop(0.5, "#f2cd80")
        gradient.addColorStop(0.6, "#e2af42")
        gradient.addColorStop(0.82, "#9c6c14")
        gradient.addColorStop(1, "#5e3b07")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, cardSize, cardSize)

        ctx.save()
        ctx.globalCompositeOperation = "overlay"
        for (let i = 0; i < 340; i++) {
            const y = Math.random() * cardSize
            const len = cardSize * (0.3 + Math.random() * 0.7)
            const x = Math.random() * cardSize - len / 2
            ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.1})`
            ctx.lineWidth = Math.random() * 1.1
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + len, y + (Math.random() - 0.5) * 6)
            ctx.stroke()
        }
        ctx.restore()

        for (let i = 0; i < 1800; i++) {
            ctx.fillStyle = `rgba(70,44,6,${Math.random() * 0.05})`
            ctx.fillRect(
                Math.random() * cardSize,
                Math.random() * cardSize,
                1,
                1
            )
        }

        const vignette = ctx.createRadialGradient(
            cardSize / 2,
            cardSize / 2,
            cardSize * 0.32,
            cardSize / 2,
            cardSize / 2,
            cardSize * 0.72
        )
        vignette.addColorStop(0, "rgba(0,0,0,0)")
        vignette.addColorStop(1, "rgba(50,30,4,0.28)")
        ctx.fillStyle = vignette
        ctx.fillRect(0, 0, cardSize, cardSize)

        const glow = ctx.createRadialGradient(
            cardSize / 2,
            cardSize / 2,
            10,
            cardSize / 2,
            cardSize / 2,
            cardSize * 0.42
        )
        glow.addColorStop(0, "rgba(255,255,255,0.1)")
        glow.addColorStop(1, "transparent")
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, cardSize, cardSize)

        const outerInset = cardSize * 0.07
        roundRectPath(outerInset, 10)
        ctx.strokeStyle = "rgba(255,246,214,0.55)"
        ctx.lineWidth = 1.5
        ctx.stroke()
        roundRectPath(outerInset + 3.5, 8)
        ctx.strokeStyle = "rgba(90,56,8,0.45)"
        ctx.lineWidth = 1
        ctx.stroke()

        const corners = [
            [outerInset, outerInset],
            [cardSize - outerInset, outerInset],
            [outerInset, cardSize - outerInset],
            [cardSize - outerInset, cardSize - outerInset],
        ]
        corners.forEach(([cx, cy]) => {
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(Math.PI / 4)
            ctx.fillStyle = "rgba(255,246,214,0.5)"
            ctx.fillRect(-3, -3, 6, 6)
            ctx.restore()
        })

        const drawSpacedText = (
            text: string,
            cx: number,
            cy: number,
            font: string,
            trackingPx: number
        ) => {
            ctx.font = font
            const chars = text.split("")
            const widths = chars.map((c) => ctx.measureText(c).width)
            const totalWidth =
                widths.reduce((a, b) => a + b, 0) +
                trackingPx * (chars.length - 1)
            let x = cx - totalWidth / 2
            ctx.textAlign = "left"
            chars.forEach((c, i) => {
                ctx.fillText(c, x, cy)
                x += widths[i] + trackingPx
            })
        }

        const mobileScale = isMobile ? 0.9 : 1
        const scratchSize = (scratchWordFont.fontSize ?? 15) * mobileScale
        const andSize = (andWordFont.fontSize ?? 20) * mobileScale
        const scratchFont = `${scratchWordFont.fontWeight ?? 800} ${scratchSize}px "${scratchWordFont.fontFamily || "Manrope"}", sans-serif`
        const andFont = `${andWordFont.fontStyle || "italic"} ${andWordFont.fontWeight ?? 400} ${andSize}px "${andWordFont.fontFamily || "Instrument Serif"}", serif`
        const lineGap = isMobile ? 5 : 7
        const centerY = cardSize / 2
        const lines: {
            text: string
            y: number
            font: string
            tracking: number
        }[] = [
            {
                text: "SCRATCH",
                y: centerY - andSize / 2 - lineGap - scratchSize / 2,
                font: scratchFont,
                tracking: scratchSize * 0.1,
            },
            { text: "and", y: centerY, font: andFont, tracking: 0 },
            {
                text: "WIN!",
                y: centerY + andSize / 2 + lineGap + scratchSize / 2,
                font: scratchFont,
                tracking: scratchSize * 0.1,
            },
        ]

        ctx.textBaseline = "middle"

        const drawTextLines = () => {
            lines.forEach(({ text, y, font, tracking }) => {
                ctx.fillStyle = "rgba(40,25,2,0.35)"
                drawSpacedText(text, cardSize / 2 + 1, y + 1, font, tracking)
            })
            lines.forEach(({ text, y, font, tracking }) => {
                ctx.fillStyle = "rgba(255,250,230,0.92)"
                drawSpacedText(text, cardSize / 2, y, font, tracking)
            })
        }

        let cancelled = false
        const fontFaceSet = (document as Document & { fonts?: FontFaceSet })
            .fonts
        if (fontFaceSet) {
            Promise.all([
                fontFaceSet.load(scratchFont),
                fontFaceSet.load(andFont),
            ])
                .catch(() => {})
                .finally(() => {
                    if (!cancelled) drawTextLines()
                })
        } else {
            drawTextLines()
        }

        return () => {
            cancelled = true
        }
    }, [
        cardSize,
        isRevealed,
        activeTheme.accent,
        isMobile,
        roundId,
        isStatic,
        scratchWordFont,
        andWordFont,
    ])

    const getPos = (e: ScratchPointerEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        const clientX = isTouchEvent(e) ? e.touches[0].clientX : e.clientX
        const clientY = isTouchEvent(e) ? e.touches[0].clientY : e.clientY
        return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const getFilledPercentage = () => {
        const canvas = canvasRef.current
        if (!canvas) return 0
        const ctx = canvas.getContext("2d")
        if (!ctx) return 0
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        let transparent = 0
        const step = 32
        for (let i = 3; i < data.length; i += 4 * step) {
            if (data[i] < 40) transparent++
        }
        return Math.round((transparent / (data.length / 4 / step)) * 100)
    }

    const completeReveal = () => {
        if (isRevealed || attemptsLeft <= 0) return
        setIsRevealed(true)
        setScratchProgress(100)
        if (matchedIndices === null) return

        const lastCode = rewards[rewards.length - 1]?.code
        const pool =
            activeTheme.prizes.length > 1
                ? activeTheme.prizes.filter((p) => p.code !== lastCode)
                : activeTheme.prizes
        const prize = pool[Math.floor(Math.random() * pool.length)]
        const newRewards = [...rewards, prize]
        const newAttemptsLeft = attemptsLeft - 1

        setRewards(newRewards)
        setAttemptsLeft(newAttemptsLeft)
        setAwardedPrize(prize)

        try {
            localStorage.setItem(rewardsKey, JSON.stringify(newRewards))
            localStorage.setItem(attemptsKey, newAttemptsLeft.toString())
        } catch {
            // ignore
        }

        if (enableConfetti && !isStatic) setShowConfetti(true)
    }

    const scratchAgain = () => {
        if (attemptsLeft <= 0) return
        setIsRevealed(false)
        setScratchProgress(0)
        setAwardedPrize(null)
        setShowConfetti(false)
        setRoundId((id) => id + 1)
    }

    const handleStart = (e: ScratchPointerEvent) => {
        if (attemptsLeft <= 0 || isStatic) return
        e.preventDefault()
        isDrawing.current = true
        lastPoint.current = getPos(e)
    }

    const handleMove = (e: ScratchPointerEvent) => {
        if (
            !isDrawing.current ||
            !lastPoint.current ||
            attemptsLeft <= 0 ||
            isStatic
        )
            return
        e.preventDefault()
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return

        const current = getPos(e)
        const dist = Math.hypot(
            current.x - lastPoint.current.x,
            current.y - lastPoint.current.y
        )
        const angle = Math.atan2(
            current.x - lastPoint.current.x,
            current.y - lastPoint.current.y
        )

        ctx.globalCompositeOperation = "destination-out"
        const size = isMobile ? activeBrushSize * 0.85 : activeBrushSize

        for (let i = 0; i < dist; i += 2.5) {
            const x = lastPoint.current.x + Math.sin(angle) * i
            const y = lastPoint.current.y + Math.cos(angle) * i
            ctx.beginPath()
            ctx.arc(x, y, size / 2, 0, Math.PI * 2)
            ctx.fill()
        }

        lastPoint.current = current
        const percent = getFilledPercentage()
        setScratchProgress(percent)
        if (percent >= activeRevealThreshold) completeReveal()
    }

    const handleEnd = () => {
        isDrawing.current = false
        lastPoint.current = null
    }

    const handleDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") {
            setPopupOpen(false)
            return
        }
        if (e.key !== "Tab" || !popupCardRef.current) return

        const focusable = popupCardRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
        }
    }

    const revealNow = () => completeReveal()

    const copyRewardCode = (code: string) => {
        navigator.clipboard.writeText(code).catch(() => {})
        setCopiedCode(code)
        clearTimeout(copyTimerRef.current)
        copyTimerRef.current = setTimeout(
            () => setCopiedCode((c) => (c === code ? null : c)),
            1500
        )
    }

    const previewReveal = (tierIndex: number) => {
        setIsRevealed(true)
        setScratchProgress(100)
        setAwardedPrize(activeTheme.prizes[tierIndex])
        setShowConfetti(false)
        clearTimeout(confettiTimerRef.current)
        if (enableConfetti && !isStatic)
            confettiTimerRef.current = setTimeout(
                () => setShowConfetti(true),
                30
            )
    }

    const resetGame = (freshAttempts?: number) => {
        const n = freshAttempts ?? (demoMode ? demoFreeAttempts : freeAttempts)
        try {
            localStorage.setItem(rewardsKey, JSON.stringify([]))
            localStorage.setItem(attemptsKey, n.toString())
        } catch {
            // ignore
        }
        setIsRevealed(false)
        setScratchProgress(0)
        setAwardedPrize(null)
        setShowConfetti(false)
        setRewards([])
        setAttemptsLeft(n)
        setRoundId((id) => id + 1)
    }

    const confettiColors = [
        colors.accent,
        "#f59e0b",
        "#22c55e",
        "#0f172a",
        colors.accent,
    ]

    const wrapperStyle: CSSProperties = {
        width: "100%",
        minHeight: isPopupMode ? "auto" : "100%",
        height: isPopupMode ? "auto" : "auto",
        background: colors.primary,
        borderRadius: outerRadius,
        padding,
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: colors.text,
        position: "relative",
        overflow: "hidden",
        ...(isPopupMode
            ? demoMode
                ? {}
                : { maxHeight: "90vh", overflowY: "auto" }
            : {}),
    }

    const staticFoil = (
        <div
            style={{
                position: "relative",
                width: cardSize,
                height: cardSize,
                borderRadius: cardRadius,
                overflow: "hidden",
                background:
                    "linear-gradient(135deg, #6b4409 0%, #a9761a 18%, #e7bb52 40%, #f2cd80 50%, #e2af42 60%, #9c6c14 82%, #5e3b07 100%)",
                boxShadow: "0 18px 40px -12px rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: cardSize * 0.07 + 4,
                boxSizing: "border-box",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 8,
                    border: "1.5px solid rgba(255,246,214,0.55)",
                    boxShadow: "inset 0 0 0 3.5px rgba(90,56,8,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: isMobile ? 5 : 7,
                        color: "rgba(255,250,230,0.92)",
                        textShadow: "0 1px 1px rgba(40,25,2,0.35)",
                    }}
                >
                    <span
                        style={{
                            letterSpacing: "0.1em",
                            ...scratchWordFont,
                            fontSize:
                                (scratchWordFont.fontSize ?? 15) *
                                (isMobile ? 0.9 : 1),
                        }}
                    >
                        SCRATCH
                    </span>
                    <span
                        style={{
                            ...andWordFont,
                            fontSize:
                                (andWordFont.fontSize ?? 20) *
                                (isMobile ? 0.9 : 1),
                        }}
                    >
                        and
                    </span>
                    <span
                        style={{
                            letterSpacing: "0.1em",
                            ...scratchWordFont,
                            fontSize:
                                (scratchWordFont.fontSize ?? 15) *
                                (isMobile ? 0.9 : 1),
                        }}
                    >
                        WIN!
                    </span>
                </div>
            </div>
        </div>
    )

    if (isStatic) {
        return (
            <div ref={rootRef} style={wrapperStyle}>
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: isMobile ? 16 : 22,
                        width: "100%",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: isMobile ? 19 : 23,
                            fontWeight: 600,
                            letterSpacing: "-0.03em",
                        }}
                    >
                        {activeTheme.title}
                    </h2>
                    <p
                        style={{
                            margin: "6px 0 0",
                            fontSize: isMobile ? 12.5 : 14,
                            color: colors.muted,
                            lineHeight: 1.4,
                        }}
                    >
                        {activeTheme.subtitle}
                    </p>
                </div>
                {staticFoil}
            </div>
        )
    }

    const gameCard = (
        <div style={wrapperStyle}>
            <div
                style={{
                    position: "absolute",
                    top: -60,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: cardSize * 1.2,
                    height: cardSize * 1.2,
                    background: `radial-gradient(circle, ${colors.accent}18 0%, transparent 70%)`,
                    pointerEvents: "none",
                }}
            />

            {isWon && (
                <div
                    style={{
                        position: "absolute",
                        top: "26%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: cardSize * 0.9,
                        height: cardSize * 0.9,
                        background: `radial-gradient(circle, ${colors.accent}25 0%, transparent 70%)`,
                        filter: "blur(16px)",
                        pointerEvents: "none",
                    }}
                />
            )}

            {showConfetti && enableConfetti && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        overflow: "hidden",
                    }}
                >
                    <ScratchConfetti
                        colors={confettiColors}
                        onDone={() => setShowConfetti(false)}
                    />
                </div>
            )}

            <div
                style={{
                    textAlign: "center",
                    marginBottom: isMobile ? 16 : 22,
                    width: "100%",
                }}
            >
                <h2
                    id={`${uid}-title`}
                    style={{
                        margin: 0,
                        fontSize: isMobile ? 19 : 23,
                        fontWeight: 600,
                        letterSpacing: "-0.03em",
                    }}
                >
                    {activeTheme.title}
                </h2>
                <p
                    style={{
                        margin: "6px 0 0",
                        fontSize: isMobile ? 12.5 : 14,
                        color: colors.muted,
                        lineHeight: 1.4,
                    }}
                >
                    {activeTheme.subtitle}
                </p>
                <div
                    style={{
                        display: "inline-block",
                        marginTop: 10,
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        background: `${colors.accent}12`,
                        color: colors.accent,
                    }}
                >
                    {attemptsLeft > 0
                        ? `${attemptsLeft} scratch${attemptsLeft > 1 ? "es" : ""} left`
                        : "No scratches left"}
                </div>
            </div>

            <div
                style={{
                    position: "relative",
                    width: cardSize,
                    height: cardSize,
                    borderRadius: cardRadius,
                    overflow: "hidden",
                    background: colors.cardBg,
                    boxShadow: "0 18px 40px -12px rgba(0,0,0,0.55)",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: isMobile ? 5 : 7,
                        padding: isMobile ? 10 : 14,
                    }}
                >
                    {displayItems.map((img, i) => {
                        const isMatch =
                            isWon &&
                            matchedIndices !== null &&
                            matchedIndices.includes(i)
                        const src = img ? getImageSrc(img) : undefined
                        return (
                            <div
                                key={i}
                                style={{
                                    background: isMatch
                                        ? `${colors.accent}15`
                                        : "rgba(15,23,42,0.03)",
                                    borderRadius: itemRadius,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: isMatch
                                        ? `1.5px solid ${colors.accent}`
                                        : "1px solid rgba(15,23,42,0.06)",
                                    boxShadow: isMatch
                                        ? `0 0 16px ${colors.accent}30`
                                        : "none",
                                }}
                            >
                                {src && (
                                    <img
                                        src={src}
                                        alt=""
                                        style={{
                                            width: "58%",
                                            height: "58%",
                                            objectFit: "contain",
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {!isRevealed && (
                    <canvas
                        ref={canvasRef}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            cursor: "crosshair",
                            borderRadius: cardRadius,
                            touchAction: "none",
                        }}
                        onMouseDown={handleStart}
                        onMouseMove={handleMove}
                        onMouseUp={handleEnd}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchMove={handleMove}
                        onTouchEnd={handleEnd}
                    />
                )}
            </div>

            {!isRevealed && (
                <div style={{ width: cardSize, marginTop: isMobile ? 14 : 18 }}>
                    <div
                        role="progressbar"
                        aria-valuenow={scratchProgress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Scratch progress"
                        style={{
                            height: 3,
                            background: "rgba(15,23,42,0.1)",
                            borderRadius: 10,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${scratchProgress}%`,
                                background: colors.accent,
                                borderRadius: 10,
                            }}
                        />
                    </div>
                    <div
                        aria-hidden="true"
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 6,
                            fontSize: 11,
                            color: colors.muted,
                        }}
                    >
                        <span>Scratch progress</span>
                        <span>{scratchProgress}%</span>
                    </div>
                </div>
            )}

            {!isRevealed && attemptsLeft > 0 && (
                <button
                    onClick={revealNow}
                    style={{
                        marginTop: 12,
                        background: "none",
                        border: "none",
                        color: colors.muted,
                        fontSize: 12,
                        cursor: "pointer",
                        textDecoration: "underline",
                    }}
                >
                    Reveal instantly
                </button>
            )}

            {isRevealed && isWon && awardedPrize && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        marginTop: 18,
                        width: "100%",
                        maxWidth: cardSize + 10,
                        background: "#ffffff",
                        border: "1px solid rgba(15,23,42,0.08)",
                        boxShadow: "0 8px 24px -12px rgba(15,23,42,0.15)",
                        borderRadius: Math.max(12, activeBorderRadius - 8),
                        padding: isMobile ? "16px" : "20px",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: colors.accent,
                            marginBottom: 4,
                        }}
                    >
                        {awardedPrize.title}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: colors.muted,
                            marginBottom: 14,
                        }}
                    >
                        {awardedPrize.description}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <div
                            style={{
                                flex: 1,
                                background: `${colors.accent}12`,
                                border: `1px solid ${colors.accent}44`,
                                borderRadius: 10,
                                padding: "10px",
                                fontWeight: 600,
                                fontSize: 15,
                                color: colors.accent,
                            }}
                        >
                            {awardedPrize.code}
                        </div>
                        <button
                            onClick={() => copyRewardCode(awardedPrize.code)}
                            style={{
                                background: colors.accent,
                                color: "#ffffff",
                                border: "none",
                                borderRadius: 10,
                                padding: "0 14px",
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: "pointer",
                            }}
                        >
                            {copiedCode === awardedPrize.code
                                ? "Copied"
                                : "Copy"}
                        </button>
                    </div>
                    {attemptsLeft > 0 && (
                        <button
                            onClick={scratchAgain}
                            style={{
                                marginTop: 12,
                                width: "100%",
                                background: "none",
                                border: `1px solid ${colors.accent}33`,
                                borderRadius: 10,
                                padding: "10px",
                                color: colors.accent,
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: "pointer",
                            }}
                        >
                            Scratch Again ({attemptsLeft} left)
                        </button>
                    )}
                </div>
            )}

            {rewards.length > 0 && (
                <div
                    style={{
                        width: "100%",
                        maxWidth: cardSize + 10,
                        marginTop: 18,
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: colors.muted,
                            marginBottom: 10,
                            textAlign: "center",
                        }}
                    >
                        Your Rewards
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {rewards.map((r, i) => (
                            <div
                                key={i}
                                style={{
                                    background: "#ffffff",
                                    border: "1px solid rgba(15,23,42,0.08)",
                                    borderRadius: 12,
                                    padding: "10px 14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 10,
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: colors.text,
                                        }}
                                    >
                                        {r.description}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: colors.accent,
                                            fontWeight: 600,
                                            marginTop: 2,
                                        }}
                                    >
                                        {r.code}
                                    </div>
                                </div>
                                <button
                                    onClick={() => copyRewardCode(r.code)}
                                    style={{
                                        background: `${colors.accent}12`,
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "6px 10px",
                                        color: colors.accent,
                                        fontWeight: 600,
                                        fontSize: 11,
                                        cursor: "pointer",
                                        flexShrink: 0,
                                    }}
                                >
                                    {copiedCode === r.code ? "Copied" : "Copy"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    const widgetOnRight = activeWidgetPosition !== "bottom-left"

    const demoBar = demoMode ? (
        <div ref={demoBarRef} style={styles.demoBar}>
            <div style={styles.demoGroup}>
                <span style={styles.demoLabelDark}>Concept</span>
                <div style={styles.demoPillRow}>
                    {Object.keys(THEMES).map((key) => (
                        <button
                            key={key}
                            onClick={() => {
                                setDemoTheme(key)
                                resetGame()
                            }}
                            aria-pressed={demoTheme === key}
                            style={
                                demoTheme === key
                                    ? styles.demoPillOn
                                    : styles.demoPillOff
                            }
                        >
                            {THEMES[key].name}
                        </button>
                    ))}
                </div>
            </div>
            <div style={styles.demoDivider} />
            <div style={styles.demoGroup}>
                <span style={styles.demoLabelDark}>Popup</span>
                <DemoSwitch checked={demoAsPopup} onChange={setDemoAsPopup} />
            </div>
            {demoAsPopup && (
                <div style={styles.demoGroup}>
                    <span style={styles.demoLabelDark}>Corner</span>
                    <DemoSwitch
                        checked={demoWidgetPosition === "bottom-left"}
                        onChange={(v) =>
                            setDemoWidgetPosition(
                                v ? "bottom-left" : "bottom-right"
                            )
                        }
                    />
                </div>
            )}
            <div style={styles.demoDivider} />
            <div style={styles.demoGroup}>
                <span style={styles.demoLabelDark}>Accent</span>
                <input
                    type="color"
                    value={demoAccentColor}
                    onChange={(e) => setDemoAccentColor(e.target.value)}
                    aria-label="Accent color"
                    style={styles.demoColorInput}
                />
            </div>
            <div style={styles.demoGroup}>
                <span style={styles.demoLabelDark}>Background</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                        type="color"
                        value={demoBackground || "#dbeafe"}
                        onChange={(e) => setDemoBackground(e.target.value)}
                        aria-label="Background color"
                        style={styles.demoColorInput}
                    />
                    {demoBackground && (
                        <button
                            style={styles.demoPillOff}
                            onClick={() => setDemoBackground("")}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
            <div style={styles.demoDivider} />
            <div style={styles.demoGroup}>
                <span style={styles.demoLabelDark}>Free Attempts</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={demoFreeAttempts}
                        onChange={(e) => {
                            const n = Number(e.target.value)
                            setDemoFreeAttempts(n)
                            resetGame(n)
                        }}
                        aria-label="Free attempts"
                        style={{
                            width: 100,
                            accentColor: "#ffffff",
                            cursor: "pointer",
                        }}
                    />
                    <span style={styles.demoValue}>{demoFreeAttempts}</span>
                </div>
            </div>
            <div style={styles.demoDivider} />
            <div style={styles.demoGroup}>
                <span style={styles.demoLabelDark}>Preview Win</span>
                <div style={styles.demoPillRow}>
                    <button
                        style={styles.demoPillOff}
                        onClick={() => previewReveal(0)}
                    >
                        Tier 1
                    </button>
                    <button
                        style={styles.demoPillOff}
                        onClick={() => previewReveal(1)}
                    >
                        Tier 2
                    </button>
                    <button
                        style={styles.demoPillOff}
                        onClick={() => previewReveal(2)}
                    >
                        Tier 3
                    </button>
                </div>
            </div>
            <div style={styles.demoDivider} />
            <div style={styles.demoGroup}>
                <span style={styles.demoLabelDark}>Game</span>
                <button style={styles.demoPillOff} onClick={() => resetGame()}>
                    ↺ Reset
                </button>
            </div>
        </div>
    ) : null

    if (!isPopupMode) {
        return (
            <div ref={rootRef}>
                {demoMode ? (
                    <div
                        style={{
                            ...styles.inlineDemoStage,
                            paddingLeft: demoBarSize + 40,
                        }}
                    >
                        <div style={styles.inlineDemoCardWrap}>{gameCard}</div>
                    </div>
                ) : (
                    gameCard
                )}
                {demoBar}
            </div>
        )
    }

    const popupLayer = (
        <>
            <div
                ref={widgetContainerRef}
                style={{
                    ...styles.widgetContainer,
                    flexDirection: widgetOnRight ? "row-reverse" : "row",
                    ...(widgetOnRight ? { right: 24 } : { left: 24 }),
                }}
            >
                <button
                    ref={widgetTriggerRef}
                    onClick={() => setPopupOpen(true)}
                    onMouseEnter={() => setWidgetHover(true)}
                    onMouseLeave={() => setWidgetHover(false)}
                    aria-label={activeTheme.triggerText}
                    style={{
                        ...styles.widgetIconBtn,
                        backgroundColor: resolvedAccent,
                    }}
                >
                    {widgetVisible && <span style={styles.widgetPulse} />}
                    {widgetIcon ? (
                        <img
                            src={getImageSrc(widgetIcon)}
                            alt=""
                            style={styles.widgetIconImg}
                        />
                    ) : (
                        <GiftIcon uid={uid} />
                    )}
                </button>
                {widgetHover && (
                    <div style={styles.widgetLabel}>
                        {activeTheme.triggerText}
                    </div>
                )}
            </div>

            {popupOpen && (
                <div
                    onClick={(e: ReactMouseEvent<HTMLDivElement>) => {
                        if (e.target === e.currentTarget) setPopupOpen(false)
                    }}
                    style={{
                        ...styles.popupOverlayFixed,
                        ...(demoMode
                            ? {
                                  alignItems: "flex-start",
                                  overflowY: "auto",
                                  paddingTop: 20,
                                  paddingBottom: 20,
                                  paddingLeft: demoBarSize + 20,
                              }
                            : {}),
                    }}
                >
                    <div
                        ref={popupCardRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`${uid}-title`}
                        tabIndex={-1}
                        onKeyDown={handleDialogKeyDown}
                        style={{
                            ...styles.popupCardWrap,
                            ...(demoMode ? { maxHeight: "none" } : {}),
                        }}
                    >
                        {gameCard}
                        <button
                            onClick={() => setPopupOpen(false)}
                            aria-label="Close"
                            style={styles.popupClose}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {demoBar}
        </>
    )

    return <div ref={rootRef}>{popupLayer}</div>
}

const styles: { [key: string]: CSSProperties } = {
    widgetContainer: {
        position: "fixed",
        bottom: 24,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    widgetIconBtn: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        cursor: "pointer",
        boxShadow: "0 6px 20px rgba(0,0,0,0.28)",
        position: "relative",
        flexShrink: 0,
    },
    widgetPulse: {
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.9)",
        pointerEvents: "none",
        opacity: 0.35,
    },
    widgetIconImg: {
        position: "relative",
        width: 30,
        height: 30,
        objectFit: "cover",
        borderRadius: "50%",
    },
    widgetLabel: {
        padding: "10px 16px",
        borderRadius: 12,
        background: "#0f172a",
        color: "#ffffff",
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: "nowrap",
        boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
    },
    popupOverlayFixed: {
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
        boxSizing: "border-box",
    },
    popupCardWrap: {
        width: "100%",
        maxWidth: 420,
        maxHeight: "90vh",
        position: "relative",
    },
    popupClose: {
        position: "absolute",
        top: -14,
        right: -14,
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "none",
        background: "#ffffff",
        color: "#334155",
        fontSize: 18,
        lineHeight: "32px",
        textAlign: "center",
        cursor: "pointer",
        padding: 0,
        boxShadow: "0 4px 12px rgba(15,23,42,0.25)",
        zIndex: 100,
    },
    inlineDemoStage: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 40,
        paddingBottom: 140,
        paddingLeft: 20,
        paddingRight: 20,
        boxSizing: "border-box",
    },
    inlineDemoCardWrap: {
        width: "100%",
        maxWidth: 420,
    },
    demoBar: {
        position: "fixed",
        left: 20,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 10000,
        background: "rgba(15,23,42,0.94)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 26,
        padding: "20px 18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 16,
        width: 210,
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        boxSizing: "border-box",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#ffffff",
    },
    demoGroup: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 7,
        flexShrink: 0,
    },
    demoDivider: {
        width: "100%",
        height: 1,
        background: "rgba(255,255,255,0.1)",
        flexShrink: 0,
    },
    demoLabelDark: {
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)",
        whiteSpace: "nowrap",
    },
    demoValue: {
        fontSize: 12,
        fontWeight: 700,
        color: "#ffffff",
        minWidth: 14,
        textAlign: "center",
    },
    demoPillRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 5,
    },
    demoPillOn: {
        padding: "5px 11px",
        borderRadius: 20,
        border: "none",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 700,
        background: "#ffffff",
        color: "#0f172a",
        whiteSpace: "nowrap",
    },
    demoPillOff: {
        padding: "5px 11px",
        borderRadius: 20,
        border: "none",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 700,
        background: "rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.65)",
        whiteSpace: "nowrap",
    },
    demoColorInput: {
        width: 30,
        height: 24,
        border: "none",
        borderRadius: 8,
        padding: 0,
        cursor: "pointer",
        background: "none",
    },
}

addPropertyControls(ScratchCardPopup, {
    theme: {
        type: ControlType.Enum,
        title: "Concept",
        options: Object.keys(THEMES),
        optionTitles: Object.values(THEMES).map((t) => t.name),
        defaultValue: "ecommerce",
    },
    scratchWordFont: {
        type: ControlType.Font,
        title: "↳ 'Scratch/Win' Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Extra Bold", fontSize: 15 },
    },
    andWordFont: {
        type: ControlType.Font,
        title: "↳ 'and' Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: { fontSize: 20 },
    },
    customizeCopy: {
        type: ControlType.Boolean,
        title: "Customize Copy",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    customTitle: {
        type: ControlType.String,
        title: "↳ Title",
        placeholder: "Unlock Your Reward",
        hidden: (p) => !p.customizeCopy,
    },
    customSubtitle: {
        type: ControlType.String,
        title: "↳ Subtitle",
        placeholder: "Scratch the foil and match three identical items",
        hidden: (p) => !p.customizeCopy,
    },
    customScratchHint: {
        type: ControlType.String,
        title: "↳ Scratch Hint",
        placeholder: "Scratch the foil",
        hidden: (p) => !p.customizeCopy,
    },
    customTriggerText: {
        type: ControlType.String,
        title: "↳ Widget Label",
        placeholder: "Scratch & Win",
        hidden: (p) => !p.customizeCopy,
    },
    customPrize1Title: {
        type: ControlType.String,
        title: "↳ Tier 1 Title",
        placeholder: "Congratulations",
        hidden: (p) => !p.customizeCopy,
    },
    customPrize1Description: {
        type: ControlType.String,
        title: "↳ Tier 1 Description",
        placeholder: "You unlocked 50% off",
        hidden: (p) => !p.customizeCopy,
    },
    customPrize1Code: {
        type: ControlType.String,
        title: "↳ Tier 1 Code",
        placeholder: "GOLD50",
        hidden: (p) => !p.customizeCopy,
    },
    customPrize2Title: {
        type: ControlType.String,
        title: "↳ Tier 2 Title",
        placeholder: "Nice!",
        hidden: (p) => !p.customizeCopy,
    },
    customPrize2Description: {
        type: ControlType.String,
        title: "↳ Tier 2 Description",
        placeholder: "Free shipping unlocked",
        hidden: (p) => !p.customizeCopy,
    },
    customPrize2Code: {
        type: ControlType.String,
        title: "↳ Tier 2 Code",
        placeholder: "SHIPFREE",
        hidden: (p) => !p.customizeCopy,
    },
    customPrize3Title: {
        type: ControlType.String,
        title: "↳ Tier 3 Title",
        placeholder: "Lucky you",
        hidden: (p) => !p.customizeCopy,
    },
    customPrize3Description: {
        type: ControlType.String,
        title: "↳ Tier 3 Description",
        placeholder: "Mystery gift added",
        hidden: (p) => !p.customizeCopy,
    },
    customPrize3Code: {
        type: ControlType.String,
        title: "↳ Tier 3 Code",
        placeholder: "GIFT25",
        hidden: (p) => !p.customizeCopy,
    },
    customBackground: {
        type: ControlType.Color,
        title: "↳ Background",
        optional: true,
        hidden: (p) => !p.customizeCopy,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#0f172a",
        optional: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 36,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    enableConfetti: {
        type: ControlType.Boolean,
        title: "Confetti + Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    images: {
        type: ControlType.Array,
        title: "Images (9 items)",
        control: { type: ControlType.Image },
        maxCount: 9,
        defaultValue: DEFAULT_IMAGES,
    },
    revealThreshold: {
        type: ControlType.Number,
        title: "Reveal Threshold",
        defaultValue: 42,
        min: 25,
        max: 75,
        unit: "%",
    },
    freeAttempts: {
        type: ControlType.Number,
        title: "Free Attempts",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    asPopup: {
        type: ControlType.Boolean,
        title: "Popup Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    trigger: {
        type: ControlType.Enum,
        title: "↳ Trigger",
        options: ["manual", "delay", "scroll"],
        optionTitles: ["Button Click", "Auto (Delay)", "On Scroll Into View"],
        defaultValue: "manual",
        hidden: (p) => !p.asPopup,
    },
    delaySeconds: {
        type: ControlType.Number,
        title: "↳ Delay",
        defaultValue: 4,
        min: 1,
        max: 60,
        step: 1,
        unit: "s",
        hidden: (p) => !p.asPopup || p.trigger !== "delay",
    },
    widgetPosition: {
        type: ControlType.Enum,
        title: "↳ Widget Corner",
        options: ["bottom-right", "bottom-left"],
        optionTitles: ["Bottom Right", "Bottom Left"],
        defaultValue: "bottom-right",
        hidden: (p) => !p.asPopup,
    },
    widgetIcon: {
        type: ControlType.ResponsiveImage,
        title: "↳ Widget Icon",
        hidden: (p) => !p.asPopup,
    },
    storageKey: {
        type: ControlType.String,
        title: "Storage Key",
        placeholder: "leave empty unless using 2+ instances",
        defaultValue: "",
    },
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
