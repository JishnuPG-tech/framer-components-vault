import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * AllyToolbar - A production-ready accessibility toolbar for Framer.
 * WCAG 2.2 focused with robust keyboard support, motion control, and persistence.
 */

interface FeatureButtonProps {
    icon: React.ReactElement
    label: string
    active: boolean
    onClick: () => void
    accent: string
    surfaceTone: "light" | "dark"
    level?: number
}

interface PanelSectionProps {
    title: string
    children: React.ReactNode
    surface: string
    border: string
    titleColor: string
}

interface Position {
    x: number
    y: number
}

const STORAGE_KEYS = {
    position: "ally-toolbar-pos",
    moved: "ally-toolbar-moved",
    features: "ally-toolbar-features-v2",
}

const ANNOUNCE_DURATION_MS = 1400

const TRIGGER_ICON_OPTIONS = [
    "Universal",
    "Person",
    "Wheelchair",
    "Text Aa",
    "Settings",
] as const
type TriggerIconOption = (typeof TRIGGER_ICON_OPTIONS)[number]

const FEATURE_NAMES: Record<string, string> = {
    contrast: "Contrast",
    grayscale: "Grayscale",
    invertColors: "Invert Colors",
    readableFont: "Dyslexic Font",
    lineHeight: "Text Spacing",
    textAlign: "Left Align",
    hideImages: "Hide Images",
    pauseAnimations: "Pause Animations",
    highlightLinks: "Highlight Links",
    readingMask: "Reading Mask",
    outlineFocus: "Focus Outline",
    pageStructure: "Page Structure",
    readingWidth: "Reading Width",
    largeCursor: "Large Cursor",
    muteAudio: "Mute Audio",
}

const Icons = {
    Access: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle
                cx="12"
                cy="4.8"
                r="1.55"
                fill="currentColor"
                stroke="none"
            />
            <path d="M7.1 9.6h9.8" />
            <path d="M12 9.1v5.8" />
            <path d="m8.8 19.1 3.2-4.5 3.2 4.5" />
        </svg>
    ),
    AccessPerson: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
            <path d="M12 8.1v8.6" />
            <path d="m8.5 11 3.5-2.1 3.5 2.1" />
            <path d="m9.3 19.1 2.7-4.1 2.7 4.1" />
        </svg>
    ),
    AccessWheelchair: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle
                cx="11.8"
                cy="5.3"
                r="1.3"
                fill="currentColor"
                stroke="none"
            />
            <path d="M10.9 9.2h3.2l1.6 3.5" />
            <path d="M11 13.2h4.4" />
            <circle cx="11.2" cy="15.7" r="3.1" />
            <path d="M14.3 15.7H18" />
        </svg>
    ),
    AccessAa: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6.8 18.6 9.1 10h1.4l2.3 8.6" />
            <path d="M7.4 15.4h4" />
            <circle cx="16.8" cy="14.2" r="2.2" />
            <path d="M14.5 18h4.6" />
        </svg>
    ),
    AccessSettings: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="2.1" />
            <path d="M12 7.5v1.1" />
            <path d="M12 15.4v1.1" />
            <path d="m15.1 8.9-.8.8" />
            <path d="m9.7 14.3-.8.8" />
            <path d="M16.5 12h-1.1" />
            <path d="M8.6 12H7.5" />
            <path d="m15.1 15.1-.8-.8" />
            <path d="m9.7 9.7-.8-.8" />
        </svg>
    ),
    BiggerText: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 7V5h14v2" />
            <path d="M10 5v14" />
            <path d="M21 11v-2h-8v2" />
            <path d="M17 11v8" />
        </svg>
    ),
    LineHeight: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 6h13" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M3 6v12" />
            <path d="M3 12h2" />
        </svg>
    ),
    ReadableFont: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
        </svg>
    ),
    Contrast: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 18a6 6 0 0 0 0-12v12z" />
        </svg>
    ),
    InvertColors: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v18" />
        </svg>
    ),
    Grayscale: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 16h6" />
            <path d="M12 16a4 4 0 0 1 0 8a4 4 0 0 1 0-8z" />
        </svg>
    ),
    HideImages: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    ),
    PauseAnimations: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
        </svg>
    ),
    HighlightLinks: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    ReadingMask: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12h20" />
            <path d="M12 2v20" />
        </svg>
    ),
    OutlineFocus: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7h10v10H7z" />
        </svg>
    ),
    PageStructure: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="3" x2="21" y1="9" y2="9" />
            <line x1="9" x2="9" y1="21" y2="9" />
        </svg>
    ),
    ReadPage: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            <path d="M12 7v10" />
        </svg>
    ),
    ReadingWidth: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <line x1="8" y1="8" x2="16" y2="8" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="8" y1="16" x2="14" y2="16" />
        </svg>
    ),
    TextAlign: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="17" y1="10" x2="3" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="17" y1="18" x2="3" y2="18" />
        </svg>
    ),
    LargeCursor: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 4 6.5 15.4 2.3-5.4 5.4-2.3L5 4z" />
            <circle cx="16.7" cy="16.7" r="2.2" />
        </svg>
    ),
    MuteAudio: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
        </svg>
    ),
    Reset: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
        </svg>
    ),
    Close: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
}

const LARGE_CURSOR_DATA =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='8.5' fill='none' stroke='black' stroke-width='3'/%3E%3Ccircle cx='18' cy='18' r='12.2' fill='none' stroke='white' stroke-width='1.6'/%3E%3C/svg%3E\") 18 18, auto"

export default function AllyToolbar(props: {
    buttonColor: string
    triggerIcon: TriggerIconOption
    panelAppearance: "Auto" | "Light" | "Dark"
    buttonSize: number
    startPosition: "Bottom Right" | "Bottom Left"
}) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [activeFeatures, setActiveFeatures] = React.useState<Set<string>>(
        new Set()
    )
    const [mouseY, setMouseY] = React.useState(0)
    const [isSpeaking, setIsSpeaking] = React.useState(false)
    const [announcementText, setAnnouncementText] = React.useState("")

    const [speechSupported] = React.useState(
        () => typeof window !== "undefined" && "speechSynthesis" in window
    )
    const [prefersReducedMotion] = React.useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
    const [cssZoomSupported] = React.useState(
        () =>
            typeof window !== "undefined" &&
            typeof CSS !== "undefined" &&
            typeof CSS.supports === "function" &&
            CSS.supports("zoom", "1")
    )
    const [surfaceTone, setSurfaceTone] = React.useState<"light" | "dark">(() =>
        detectPageTone()
    )

    const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [hasMoved, setHasMoved] = React.useState(false)

    const dragOffset = React.useRef({ x: 0, y: 0 })
    const startDragPos = React.useRef({ x: 0, y: 0 })
    const isPointerDown = React.useRef(false)
    const isDraggingRef = React.useRef(false)
    const panelRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const announceTimeoutRef = React.useRef<number | null>(null)
    const mediaStateRef = React.useRef(
        new Map<HTMLMediaElement, { muted: boolean; volume: number }>()
    )
    const mediaObserverRef = React.useRef<MutationObserver | null>(null)
    const invertSnapshotRef = React.useRef<{
        htmlFilter: { value: string; priority: string }
        htmlBackground: { value: string; priority: string }
        bodyBackground: { value: string; priority: string }
    } | null>(null)
    const invertEnabled = activeFeatures.has("invertColors")

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const updateTone = () => {
            setSurfaceTone(detectPageTone())
        }

        updateTone()
        window.addEventListener("resize", updateTone)
        window.addEventListener("orientationchange", updateTone)
        return () => {
            window.removeEventListener("resize", updateTone)
            window.removeEventListener("orientationchange", updateTone)
        }
    }, [])

    const resetPositionToProp = React.useCallback(() => {
        if (typeof window === "undefined") return
        const { innerWidth, innerHeight } = window
        const padding = 20
        if (props.startPosition === "Bottom Left") {
            setPosition({
                x: padding,
                y: innerHeight - (props.buttonSize + padding),
            })
            return
        }
        setPosition({
            x: innerWidth - (props.buttonSize + padding),
            y: innerHeight - (props.buttonSize + padding),
        })
    }, [props.startPosition, props.buttonSize])

    const announce = React.useCallback((message: string) => {
        if (typeof window === "undefined") return
        setAnnouncementText(message)
        if (announceTimeoutRef.current !== null) {
            window.clearTimeout(announceTimeoutRef.current)
        }
        announceTimeoutRef.current = window.setTimeout(() => {
            setAnnouncementText("")
        }, ANNOUNCE_DURATION_MS)
    }, [])

    React.useEffect(() => {
        return () => {
            if (announceTimeoutRef.current !== null) {
                window.clearTimeout(announceTimeoutRef.current)
            }
        }
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        try {
            const savedPos = localStorage.getItem(STORAGE_KEYS.position)
            const userHasDragged =
                localStorage.getItem(STORAGE_KEYS.moved) === "true"
            const savedFeatures = localStorage.getItem(STORAGE_KEYS.features)

            if (savedFeatures) {
                const parsed = JSON.parse(savedFeatures)
                if (Array.isArray(parsed)) {
                    const migrated = parsed
                        .filter((value) => typeof value === "string")
                        .map((value) =>
                            value === "skipLink" ? "textAlign" : value
                        )
                        .filter((value) => value !== "highlightHeadings")
                    setActiveFeatures(new Set(migrated))
                }
            }

            if (savedPos && userHasDragged) {
                const parsed = JSON.parse(savedPos)
                if (parsed.x !== undefined && parsed.y !== undefined) {
                    setPosition(parsed)
                    setHasMoved(true)
                    return
                }
            }
            resetPositionToProp()
        } catch (error) {
            resetPositionToProp()
        }
    }, [resetPositionToProp])

    React.useEffect(() => {
        if (typeof window !== "undefined" && hasMoved) {
            try {
                localStorage.setItem(
                    STORAGE_KEYS.position,
                    JSON.stringify(position)
                )
                localStorage.setItem(STORAGE_KEYS.moved, "true")
            } catch (error) {
                console.warn("Could not save toolbar position")
            }
        }
    }, [position, hasMoved])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        try {
            localStorage.setItem(
                STORAGE_KEYS.features,
                JSON.stringify(Array.from(activeFeatures))
            )
        } catch (error) {
            console.warn("Could not save accessibility preferences")
        }
    }, [activeFeatures])

    React.useEffect(() => {
        if (!hasMoved) {
            resetPositionToProp()
        }
    }, [props.startPosition, props.buttonSize, hasMoved, resetPositionToProp])

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        buttonRef.current?.focus()
        isPointerDown.current = true
        startDragPos.current = { x: e.clientX, y: e.clientY }
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        }
        isDraggingRef.current = false
        window.addEventListener("mousemove", handleWindowMouseMove)
        window.addEventListener("mouseup", handleWindowMouseUp)
    }

    const handleWindowMouseMove = (e: MouseEvent) => {
        if (!isPointerDown.current) return
        const dx = e.clientX - startDragPos.current.x
        const dy = e.clientY - startDragPos.current.y

        if (!isDraggingRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isDraggingRef.current = true
            setIsDragging(true)
        }

        if (isDraggingRef.current) {
            e.preventDefault()
            const newX = e.clientX - dragOffset.current.x
            const newY = e.clientY - dragOffset.current.y

            const maxX = window.innerWidth - props.buttonSize
            const maxY = window.innerHeight - props.buttonSize

            setPosition({
                x: Math.min(Math.max(0, newX), maxX),
                y: Math.min(Math.max(0, newY), maxY),
            })
            setHasMoved(true)
        }
    }

    const handleWindowMouseUp = () => {
        isPointerDown.current = false
        window.removeEventListener("mousemove", handleWindowMouseMove)
        window.removeEventListener("mouseup", handleWindowMouseUp)

        if (isDraggingRef.current) {
            isDraggingRef.current = false
            setIsDragging(false)
        } else {
            setIsOpen((prev) => !prev)
        }
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0]
        isPointerDown.current = true
        startDragPos.current = { x: touch.clientX, y: touch.clientY }
        dragOffset.current = {
            x: touch.clientX - position.x,
            y: touch.clientY - position.y,
        }
        isDraggingRef.current = false
        window.addEventListener("touchmove", handleWindowTouchMove, {
            passive: false,
        })
        window.addEventListener("touchend", handleWindowTouchEnd)
    }

    const handleWindowTouchMove = (e: TouchEvent) => {
        if (!isPointerDown.current) return
        const touch = e.touches[0]
        const dx = touch.clientX - startDragPos.current.x
        const dy = touch.clientY - startDragPos.current.y

        if (!isDraggingRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isDraggingRef.current = true
            setIsDragging(true)
        }

        if (isDraggingRef.current) {
            e.preventDefault()
            const newX = touch.clientX - dragOffset.current.x
            const newY = touch.clientY - dragOffset.current.y

            const maxX = window.innerWidth - props.buttonSize
            const maxY = window.innerHeight - props.buttonSize

            setPosition({
                x: Math.min(Math.max(0, newX), maxX),
                y: Math.min(Math.max(0, newY), maxY),
            })
            setHasMoved(true)
        }
    }

    const handleWindowTouchEnd = () => {
        isPointerDown.current = false
        window.removeEventListener("touchmove", handleWindowTouchMove)
        window.removeEventListener("touchend", handleWindowTouchEnd)

        if (isDraggingRef.current) {
            isDraggingRef.current = false
            setIsDragging(false)
        } else {
            setIsOpen((prev) => !prev)
        }
    }

    const handleTriggerKeyDown = (
        e: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setIsOpen((prev) => !prev)
        }
    }

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const handleArrowKeys = (e: KeyboardEvent) => {
            if (
                !buttonRef.current ||
                document.activeElement !== buttonRef.current
            )
                return
            if (
                !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
                    e.key
                )
            )
                return

            e.preventDefault()
            const step = e.shiftKey ? 50 : 10

            setPosition((prev) => {
                const newPos = {
                    x:
                        prev.x +
                        (e.key === "ArrowRight"
                            ? step
                            : e.key === "ArrowLeft"
                              ? -step
                              : 0),
                    y:
                        prev.y +
                        (e.key === "ArrowDown"
                            ? step
                            : e.key === "ArrowUp"
                              ? -step
                              : 0),
                }

                return {
                    x: Math.min(
                        Math.max(0, newPos.x),
                        window.innerWidth - props.buttonSize
                    ),
                    y: Math.min(
                        Math.max(0, newPos.y),
                        window.innerHeight - props.buttonSize
                    ),
                }
            })
            setHasMoved(true)
        }

        window.addEventListener("keydown", handleArrowKeys)
        return () => window.removeEventListener("keydown", handleArrowKeys)
    }, [props.buttonSize])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const handleResize = () => {
            setPosition((prev) => {
                const maxX = window.innerWidth - props.buttonSize
                const maxY = window.innerHeight - props.buttonSize
                return {
                    x: Math.min(Math.max(0, prev.x), Math.max(0, maxX)),
                    y: Math.min(Math.max(0, prev.y), Math.max(0, maxY)),
                }
            })
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [props.buttonSize])

    React.useEffect(() => {
        if (!isOpen || !panelRef.current) return

        const focusableElements = Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return

            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus()
                e.preventDefault()
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus()
                e.preventDefault()
            }
        }

        const timer = window.setTimeout(() => firstElement.focus(), 40)

        document.addEventListener("keydown", handleTabKey)
        return () => {
            window.clearTimeout(timer)
            document.removeEventListener("keydown", handleTabKey)
        }
    }, [isOpen])

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false)
                buttonRef.current?.focus()
            }
        }

        const handleClickOutside = (e: PointerEvent) => {
            if (!isOpen || !panelRef.current || !buttonRef.current) return
            const target = e.target as Node
            if (
                !panelRef.current.contains(target) &&
                !buttonRef.current.contains(target)
            ) {
                setIsOpen(false)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("pointerdown", handleClickOutside)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("pointerdown", handleClickOutside)
        }
    }, [isOpen])

    React.useEffect(() => {
        if (typeof window === "undefined" || !activeFeatures.has("readingMask"))
            return

        setMouseY(window.innerHeight / 2)
        const handleMouseMove = (e: MouseEvent) => setMouseY(e.clientY)
        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [activeFeatures])

    const toggleSpeech = () => {
        if (!speechSupported) {
            announce("Speech is not supported on this browser")
            return
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
            announce("Speech stopped")
            return
        }

        const selectedText = window.getSelection()?.toString().trim() || ""
        const pageText = document.body.innerText || ""
        const textToRead = (selectedText || pageText).trim().slice(0, 12000)

        if (!textToRead) {
            announce("No readable text found")
            return
        }

        const utterance = new SpeechSynthesisUtterance(textToRead)
        utterance.rate = 1
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => {
            setIsSpeaking(false)
            announce("Speech failed")
        }

        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
        announce(selectedText ? "Reading selected text" : "Reading page")
    }

    React.useEffect(() => {
        return () => {
            if (speechSupported) {
                window.speechSynthesis.cancel()
            }
        }
    }, [speechSupported])

    const muteAudioEnabled = activeFeatures.has("muteAudio")
    React.useEffect(() => {
        if (typeof window === "undefined") return

        const muteMedia = (media: HTMLMediaElement) => {
            if (!mediaStateRef.current.has(media)) {
                mediaStateRef.current.set(media, {
                    muted: media.muted,
                    volume: media.volume,
                })
            }
            media.muted = true
            media.pause()
        }

        const processNode = (node: Node) => {
            if (node instanceof HTMLMediaElement) {
                muteMedia(node)
                return
            }
            if (node instanceof Element) {
                node.querySelectorAll("audio, video").forEach((media) => {
                    muteMedia(media as HTMLMediaElement)
                })
            }
        }

        if (muteAudioEnabled) {
            document.querySelectorAll("audio, video").forEach((media) => {
                muteMedia(media as HTMLMediaElement)
            })

            if (document.body) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            processNode(node)
                        })
                    })
                })
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                })
                mediaObserverRef.current = observer
            }
            return () => {
                mediaObserverRef.current?.disconnect()
                mediaObserverRef.current = null
            }
        }

        mediaObserverRef.current?.disconnect()
        mediaObserverRef.current = null
        mediaStateRef.current.forEach((state, media) => {
            if (!media.isConnected) return
            media.muted = state.muted
            media.volume = state.volume
        })
        mediaStateRef.current.clear()
    }, [muteAudioEnabled])

    React.useEffect(() => {
        return () => {
            mediaObserverRef.current?.disconnect()
            mediaStateRef.current.forEach((state, media) => {
                if (!media.isConnected) return
                media.muted = state.muted
                media.volume = state.volume
            })
            mediaStateRef.current.clear()
        }
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const html = document.documentElement
        const body = document.body
        if (!html || !body) return

        const capture = (element: HTMLElement, property: string) => ({
            value: element.style.getPropertyValue(property),
            priority: element.style.getPropertyPriority(property),
        })

        const restore = (
            element: HTMLElement,
            property: string,
            snapshot: { value: string; priority: string }
        ) => {
            if (snapshot.value) {
                element.style.setProperty(
                    property,
                    snapshot.value,
                    snapshot.priority
                )
                return
            }
            element.style.removeProperty(property)
        }

        const restoreSnapshot = () => {
            if (!invertSnapshotRef.current) return
            restore(html, "filter", invertSnapshotRef.current.htmlFilter)
            restore(
                html,
                "background",
                invertSnapshotRef.current.htmlBackground
            )
            restore(
                body,
                "background",
                invertSnapshotRef.current.bodyBackground
            )
            invertSnapshotRef.current = null
        }

        if (invertEnabled) {
            if (!invertSnapshotRef.current) {
                invertSnapshotRef.current = {
                    htmlFilter: capture(html, "filter"),
                    htmlBackground: capture(html, "background"),
                    bodyBackground: capture(body, "background"),
                }
            }
            html.style.setProperty(
                "filter",
                "invert(1) hue-rotate(180deg)",
                "important"
            )
            html.style.setProperty("background", "#ffffff", "important")
            body.style.setProperty("background", "transparent", "important")

            return () => {
                restoreSnapshot()
            }
        }

        restoreSnapshot()
    }, [invertEnabled])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        let style = document.getElementById("ally-toolbar-styles")
        if (!style) {
            style = document.createElement("style")
            style.id = "ally-toolbar-styles"
            document.head.appendChild(style)
        }

        const genCSS = () => {
            const cssRules: string[] = []

            if (activeFeatures.has("readableFont")) {
                cssRules.push(`
                    *:not(#ally-toolbar-root *):not(code):not(pre):not(kbd):not(samp) {
                        font-family: "OpenDyslexic", "Atkinson Hyperlegible", "Trebuchet MS", sans-serif !important;
                    }
                `)
            }

            if (cssZoomSupported) {
                if (activeFeatures.has("biggerText_1")) {
                    cssRules.push(
                        `html { zoom: 1.1 !important; transform-origin: 0 0 !important; }`
                    )
                }
                if (activeFeatures.has("biggerText_2")) {
                    cssRules.push(
                        `html { zoom: 1.2 !important; transform-origin: 0 0 !important; }`
                    )
                }
                if (activeFeatures.has("biggerText_3")) {
                    cssRules.push(
                        `html { zoom: 1.3 !important; transform-origin: 0 0 !important; }`
                    )
                }
            } else {
                if (activeFeatures.has("biggerText_1")) {
                    cssRules.push(`html { font-size: 110% !important; }`)
                }
                if (activeFeatures.has("biggerText_2")) {
                    cssRules.push(`html { font-size: 120% !important; }`)
                }
                if (activeFeatures.has("biggerText_3")) {
                    cssRules.push(`html { font-size: 130% !important; }`)
                }
            }

            if (activeFeatures.has("lineHeight")) {
                cssRules.push(`
                    *:not(#ally-toolbar-root *) {
                        line-height: 1.8 !important;
                        letter-spacing: 0.05em !important;
                        word-spacing: 0.1em !important;
                    }
                `)
            }

            if (activeFeatures.has("textAlign")) {
                cssRules.push(`
                    p:not(#ally-toolbar-root p),
                    li:not(#ally-toolbar-root li),
                    h1:not(#ally-toolbar-root h1),
                    h2:not(#ally-toolbar-root h2),
                    h3:not(#ally-toolbar-root h3),
                    h4:not(#ally-toolbar-root h4),
                    h5:not(#ally-toolbar-root h5),
                    h6:not(#ally-toolbar-root h6),
                    blockquote:not(#ally-toolbar-root blockquote),
                    figcaption:not(#ally-toolbar-root figcaption) {
                        text-align: left !important;
                    }
                `)
            }

            if (activeFeatures.has("hideImages")) {
                cssRules.push(`
                    img:not(#ally-toolbar-root img),
                    video:not(#ally-toolbar-root video),
                    canvas:not(#ally-toolbar-root canvas),
                    [role="img"]:not(#ally-toolbar-root [role="img"]) {
                        opacity: 0 !important;
                        visibility: hidden !important;
                    }
                `)
            }

            if (activeFeatures.has("pauseAnimations")) {
                cssRules.push(`
                    *:not(#ally-toolbar-root):not(#ally-toolbar-root *),
                    *:not(#ally-toolbar-root):not(#ally-toolbar-root *)::before,
                    *:not(#ally-toolbar-root):not(#ally-toolbar-root *)::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                        transition-delay: 0s !important;
                        scroll-behavior: auto !important;
                        background-attachment: scroll !important;
                    }
                `)
            }

            if (activeFeatures.has("largeCursor")) {
                cssRules.push(`
                    *:not(#ally-toolbar-root *) {
                        cursor: ${LARGE_CURSOR_DATA} !important;
                    }
                `)
            }

            if (activeFeatures.has("highlightLinks")) {
                cssRules.push(`
                    a:not(#ally-toolbar-root a),
                    button:not(#ally-toolbar-root button) {
                        text-decoration: underline !important;
                        background: #FFEB3B !important;
                        color: #000 !important;
                        outline: 2px solid #000 !important;
                    }
                `)
            }

            if (activeFeatures.has("outlineFocus")) {
                cssRules.push(`
                    *:not(#ally-toolbar-root *):focus,
                    *:not(#ally-toolbar-root *):focus-visible {
                        outline: 4px solid #FF5722 !important;
                        outline-offset: 2px !important;
                        box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 6px rgba(255, 87, 34, 0.45) !important;
                    }
                `)
            }

            if (activeFeatures.has("pageStructure")) {
                cssRules.push(`
                    header, nav, main, article, aside, section, footer, h1, h2, h3, h4, h5, h6 {
                        outline: 2px dashed #2196F3 !important;
                        position: relative !important;
                    }
                    header::before { content: '<header>'; }
                    nav::before { content: '<nav>'; }
                    main::before { content: '<main>'; }
                    article::before { content: '<article>'; }
                    aside::before { content: '<aside>'; }
                    section::before { content: '<section>'; }
                    footer::before { content: '<footer>'; }
                    h1::before { content: '<h1>'; }
                    h2::before { content: '<h2>'; }
                    h3::before { content: '<h3>'; }
                    h4::before { content: '<h4>'; }
                    h5::before { content: '<h5>'; }
                    h6::before { content: '<h6>'; }
                    header::before, nav::before, main::before, article::before, aside::before,
                    section::before, footer::before, h1::before, h2::before, h3::before,
                    h4::before, h5::before, h6::before {
                        position: absolute;
                        top: -20px;
                        left: 0;
                        background: #2196F3;
                        color: white;
                        font-size: 10px;
                        padding: 2px 4px;
                        z-index: 1000;
                        font-family: monospace;
                    }
                `)
            }

            if (activeFeatures.has("readingWidth")) {
                cssRules.push(`
                    main:not(#ally-toolbar-root main),
                    article:not(#ally-toolbar-root article),
                    section:not(#ally-toolbar-root section),
                    [role="main"]:not(#ally-toolbar-root [role="main"]) {
                        max-width: 75ch !important;
                        margin-left: auto !important;
                        margin-right: auto !important;
                        padding-left: 1rem !important;
                        padding-right: 1rem !important;
                    }

                    p:not(#ally-toolbar-root p),
                    li:not(#ally-toolbar-root li),
                    blockquote:not(#ally-toolbar-root blockquote) {
                        max-width: 72ch !important;
                    }
                `)
            }

            return cssRules.join(" ")
        }

        style.textContent = genCSS()
    }, [activeFeatures, cssZoomSupported])

    const currentZoom = activeFeatures.has("biggerText_3")
        ? 1.3
        : activeFeatures.has("biggerText_2")
          ? 1.2
          : activeFeatures.has("biggerText_1")
            ? 1.1
            : 1
    const toolbarCompensationZoom = cssZoomSupported ? 1 / currentZoom : 1

    const getBackdropFilters = () => {
        const filters = []
        if (activeFeatures.has("contrast")) {
            filters.push("contrast(125%) brightness(110%) saturate(110%)")
        }
        if (activeFeatures.has("grayscale")) {
            filters.push("grayscale(100%)")
        }
        return filters.join(" ")
    }
    const backdropFilterValue = getBackdropFilters()

    const toggleFeature = (feature: string) => {
        setActiveFeatures((prev) => {
            const next = new Set(prev)
            if (feature === "biggerText") {
                if (next.has("biggerText_1")) {
                    next.delete("biggerText_1")
                    next.add("biggerText_2")
                    announce("Text size 120%")
                    return next
                }
                if (next.has("biggerText_2")) {
                    next.delete("biggerText_2")
                    next.add("biggerText_3")
                    announce("Text size 130%")
                    return next
                }
                if (next.has("biggerText_3")) {
                    next.delete("biggerText_3")
                    announce("Text size reset")
                    return next
                }
                next.add("biggerText_1")
                announce("Text size 110%")
                return next
            }

            const label = FEATURE_NAMES[feature] || feature
            if (next.has(feature)) {
                next.delete(feature)
                announce(`${label} disabled`)
            } else {
                next.add(feature)
                announce(`${label} enabled`)
            }
            return next
        })
    }

    const resetAll = () => {
        if (speechSupported) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
        }
        setActiveFeatures(new Set())
        announce("All features reset")
    }

    const isRightSide =
        position.x >
        (typeof window !== "undefined" ? window.innerWidth / 2 : 500)
    const isBottomHalf =
        position.y >
        (typeof window !== "undefined" ? window.innerHeight / 2 : 500)
    const isDarkSurface =
        props.panelAppearance === "Auto"
            ? surfaceTone === "dark"
            : props.panelAppearance === "Dark"
    const panelTone: "light" | "dark" = isDarkSurface ? "dark" : "light"
    const panelSurface = isDarkSurface
        ? "rgba(21, 26, 33, 0.9)"
        : "rgba(231, 234, 238, 0.92)"
    const sectionSurface = isDarkSurface
        ? "rgba(255, 255, 255, 0.048)"
        : "rgba(248, 249, 251, 0.86)"
    const panelBorder = isDarkSurface
        ? "rgba(255,255,255,0.14)"
        : "rgba(17,24,39,0.12)"
    const sectionBorder = isDarkSurface
        ? "rgba(255,255,255,0.12)"
        : "rgba(17,24,39,0.08)"
    const buttonContrastText = getAccessibleTextColor(props.buttonColor)
    const triggerText = buttonContrastText
    const triggerIcon = getTriggerIcon(props.triggerIcon)
    const triggerEdge =
        buttonContrastText === "#FFFFFF"
            ? "rgba(255,255,255,0.3)"
            : "rgba(15,23,42,0.2)"
    const triggerCore =
        buttonContrastText === "#FFFFFF"
            ? "rgba(255,255,255,0.16)"
            : "rgba(255,255,255,0.52)"
    const panelShadow = isDarkSurface
        ? "0 38px 68px rgba(0,0,0,0.54), 0 14px 26px rgba(0,0,0,0.34)"
        : "0 34px 62px rgba(15,23,42,0.26), 0 12px 22px rgba(15,23,42,0.14)"
    const panelText = isDarkSurface ? "#f7f9ff" : "#0f172a"
    const panelMutedText = isDarkSurface ? "rgba(222,229,240,0.84)" : "#3f4854"
    const tileSurface = isDarkSurface
        ? "rgba(255,255,255,0.058)"
        : "rgba(239,241,244,0.94)"
    const tileBorder = isDarkSurface
        ? "rgba(255,255,255,0.13)"
        : "rgba(15,23,42,0.08)"
    const tileIconSurface = isDarkSurface
        ? "rgba(255,255,255,0.11)"
        : "rgba(255,255,255,0.84)"
    const tileIconBorder = isDarkSurface
        ? "rgba(255,255,255,0.2)"
        : "rgba(15,23,42,0.1)"
    const accentActionSurface =
        buttonContrastText === "#FFFFFF"
            ? "rgba(255,255,255,0.14)"
            : "rgba(15,23,42,0.12)"
    const accentActionBorder =
        buttonContrastText === "#FFFFFF"
            ? "rgba(255,255,255,0.28)"
            : "rgba(15,23,42,0.18)"
    const accentActionColor = buttonContrastText
    const focusRingColor = isDarkSurface ? "#f8fafc" : "#111827"
    const rootVars = {
        "--ally-focus-ring": focusRingColor,
        "--ally-focus-backdrop": isDarkSurface ? "#0b0f16" : "#ffffff",
        "--ally-scroll-thumb": isDarkSurface
            ? "rgba(255,255,255,0.24)"
            : "rgba(15,23,42,0.2)",
        "--ally-tile-bg": tileSurface,
        "--ally-tile-border": tileBorder,
        "--ally-tile-icon-bg": tileIconSurface,
        "--ally-tile-icon-border": tileIconBorder,
        "--ally-tile-shadow": isDarkSurface
            ? "0 10px 18px rgba(0,0,0,0.28)"
            : "0 8px 14px rgba(15,23,42,0.08)",
    } as React.CSSProperties
    // Important: never apply invert compensation to the toolbar root wrapper.
    // Filtering that parent can cause fixed-position children (trigger/panel) to disappear.
    const invertCompensationFilter = invertEnabled
        ? "invert(1) hue-rotate(180deg)"
        : undefined
    const biggerTextActive =
        activeFeatures.has("biggerText_1") ||
        activeFeatures.has("biggerText_2") ||
        activeFeatures.has("biggerText_3")
    const biggerTextLevel = activeFeatures.has("biggerText_3")
        ? 3
        : activeFeatures.has("biggerText_2")
          ? 2
          : activeFeatures.has("biggerText_1")
            ? 1
            : 0
    const activeControlCount =
        Array.from(activeFeatures).filter(
            (feature) => !feature.startsWith("biggerText_")
        ).length +
        (biggerTextActive ? 1 : 0) +
        (isSpeaking ? 1 : 0)

    return (
        <div id="ally-toolbar-root" style={rootVars}>
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    overflow: "hidden",
                }}
            >
                {announcementText}
            </div>

            {activeFeatures.has("readingMask") && (
                <div style={{ filter: invertCompensationFilter }}>
                    <ReadingMask mouseY={mouseY} />
                </div>
            )}

            {backdropFilterValue && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        zIndex: 2147483646,
                        pointerEvents: "none",
                        backdropFilter: backdropFilterValue,
                        WebkitBackdropFilter: backdropFilterValue,
                        backgroundColor: activeFeatures.has("grayscale")
                            ? "rgba(128, 128, 128, 0.1)"
                            : "transparent",
                        filter: invertCompensationFilter,
                    }}
                />
            )}

            <div
                style={{
                    position: "fixed",
                    left: position.x,
                    top: position.y,
                    zIndex: 2147483647,
                    fontFamily:
                        '"Avenir Next", "SF Pro Display", "Manrope", "Segoe UI Variable", sans-serif',
                    zoom: toolbarCompensationZoom,
                    filter: invertCompensationFilter,
                }}
            >
                <button
                    ref={buttonRef}
                    type="button"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onKeyDown={handleTriggerKeyDown}
                    className="ally-trigger"
                    aria-label="Accessibility menu. Use arrow keys to reposition."
                    aria-expanded={isOpen}
                    aria-controls="ally-toolbar-panel"
                    aria-haspopup="dialog"
                    aria-describedby="ally-drag-hint"
                    style={{
                        width: props.buttonSize,
                        height: props.buttonSize,
                        borderRadius: "50%",
                        background: props.buttonColor,
                        border: `1px solid ${triggerEdge}`,
                        boxShadow: isDragging
                            ? `0 16px 34px ${hexToRgba(props.buttonColor, 0.44)}`
                            : `0 12px 28px rgba(15,23,42,0.28), 0 2px 8px ${hexToRgba(props.buttonColor, 0.3)}`,
                        cursor: isDragging ? "grabbing" : "grab",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: triggerText,
                        transition: prefersReducedMotion
                            ? "none"
                            : isDragging
                              ? "none"
                              : "transform 0.22s, box-shadow 0.22s",
                        transform: isOpen ? "scale(1.035)" : "scale(1)",
                        opacity: isDragging ? 0.8 : 1,
                        position: "relative",
                        zIndex: 2,
                    }}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            width: props.buttonSize * 0.62,
                            height: props.buttonSize * 0.62,
                            borderRadius: "50%",
                            background: triggerCore,
                            boxShadow:
                                buttonContrastText === "#FFFFFF"
                                    ? "inset 0 1px 0 rgba(255,255,255,0.35)"
                                    : "inset 0 1px 0 rgba(255,255,255,0.65)",
                            pointerEvents: "none",
                        }}
                    />
                    {React.cloneElement(triggerIcon, {
                        width: props.buttonSize * 0.4,
                        height: props.buttonSize * 0.4,
                        strokeWidth: 2.05,
                    })}
                </button>

                <span
                    id="ally-drag-hint"
                    style={{ position: "absolute", left: "-9999px" }}
                >
                    Press arrow keys to reposition, or drag with mouse. Shift
                    plus arrow keys for larger movement.
                </span>

                {isOpen && (
                    <div
                        id="ally-toolbar-panel"
                        ref={panelRef}
                        role="dialog"
                        aria-label="Accessibility Tools"
                        aria-modal="true"
                        className="ally-toolbar-panel"
                        style={{
                            position: "absolute",
                            bottom: isBottomHalf
                                ? props.buttonSize + 16
                                : "auto",
                            top: isBottomHalf ? "auto" : props.buttonSize + 16,
                            right: isRightSide ? 0 : "auto",
                            left: isRightSide ? "auto" : 0,
                            background: panelSurface,
                            backdropFilter: "blur(18px) saturate(124%)",
                            WebkitBackdropFilter: "blur(18px) saturate(124%)",
                            borderRadius: 30,
                            border: `1px solid ${panelBorder}`,
                            boxShadow: panelShadow,
                            width: 472,
                            maxWidth: "calc(100vw - 40px)",
                            animation: prefersReducedMotion
                                ? "none"
                                : "fadeIn 0.2s ease-out",
                            color: panelText,
                            display: "flex",
                            flexDirection: "column",
                            zIndex: 1,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            className="ally-panel-topbar"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 14,
                                position: "relative",
                                zIndex: 2,
                                background: props.buttonColor,
                                color: buttonContrastText,
                                padding: "16px 16px 18px",
                                borderBottom: `1px solid ${hexToRgba(props.buttonColor, 0.35)}`,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 11,
                                    minWidth: 0,
                                }}
                            >
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: "50%",
                                        background:
                                            buttonContrastText === "#FFFFFF"
                                                ? "rgba(255,255,255,0.88)"
                                                : "rgba(255,255,255,0.76)",
                                        color:
                                            buttonContrastText === "#FFFFFF"
                                                ? "rgba(17,24,39,0.92)"
                                                : "rgba(15,23,42,0.95)",
                                        border:
                                            buttonContrastText === "#FFFFFF"
                                                ? "1px solid rgba(255,255,255,0.56)"
                                                : "1px solid rgba(15,23,42,0.12)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {React.cloneElement(triggerIcon, {
                                        width: 18,
                                        height: 18,
                                        strokeWidth: 2.05,
                                    })}
                                </span>
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 20,
                                        fontWeight: 700,
                                        letterSpacing: "-0.02em",
                                        fontFamily:
                                            '"Avenir Next", "SF Pro Display", "Manrope", "Segoe UI Variable", sans-serif',
                                        lineHeight: 1,
                                        color: buttonContrastText,
                                    }}
                                >
                                    Accessibility
                                </h2>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleFeature("invertColors")
                                    }
                                    aria-label={
                                        activeFeatures.has("invertColors")
                                            ? "Disable invert colors"
                                            : "Enable invert colors"
                                    }
                                    aria-pressed={activeFeatures.has(
                                        "invertColors"
                                    )}
                                    className="ally-panel-action"
                                    style={{
                                        background: accentActionSurface,
                                        border: `1px solid ${accentActionBorder}`,
                                        color: accentActionColor,
                                        cursor: "pointer",
                                        minHeight: 36,
                                        minWidth: 36,
                                        padding: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: 11,
                                        opacity: activeFeatures.has(
                                            "invertColors"
                                        )
                                            ? 1
                                            : 0.92,
                                    }}
                                >
                                    {React.cloneElement(Icons.InvertColors, {
                                        width: 18,
                                        height: 18,
                                        strokeWidth: 2,
                                    })}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetAll}
                                    aria-label="Reset all accessibility features"
                                    className="ally-panel-action"
                                    style={{
                                        background: accentActionSurface,
                                        border: `1px solid ${accentActionBorder}`,
                                        color: accentActionColor,
                                        cursor: "pointer",
                                        minHeight: 36,
                                        minWidth: 36,
                                        padding: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: 11,
                                    }}
                                >
                                    {Icons.Reset}
                                </button>
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: 1,
                                        alignSelf: "stretch",
                                        background:
                                            buttonContrastText === "#FFFFFF"
                                                ? "rgba(255,255,255,0.42)"
                                                : "rgba(15,23,42,0.24)",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpen(false)
                                        buttonRef.current?.focus()
                                    }}
                                    aria-label="Close accessibility menu"
                                    className="ally-panel-action"
                                    style={{
                                        background: accentActionSurface,
                                        border: `1px solid ${accentActionBorder}`,
                                        color: accentActionColor,
                                        cursor: "pointer",
                                        minHeight: 36,
                                        minWidth: 36,
                                        padding: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: 11,
                                    }}
                                >
                                    {Icons.Close}
                                </button>
                            </div>
                            <span
                                aria-hidden="true"
                                className="ally-panel-notch ally-panel-notch-top"
                                style={{ background: props.buttonColor }}
                            />
                        </div>

                        <div
                            className="ally-panel-body"
                            style={{
                                margin: 12,
                                borderRadius: 22,
                                background: sectionSurface,
                                border: `1px solid ${sectionBorder}`,
                                padding: "9px 12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 12,
                                    color: panelMutedText,
                                    lineHeight: 1.28,
                                    fontWeight: 550,
                                }}
                            >
                                WCAG-focused controls
                            </p>
                            <div
                                style={{
                                    borderRadius: 999,
                                    padding: "5px 11px",
                                    fontSize: 11,
                                    fontWeight: 650,
                                    letterSpacing: "0.01em",
                                    color: panelText,
                                    background: isDarkSurface
                                        ? "rgba(255,255,255,0.1)"
                                        : "rgba(255,255,255,0.74)",
                                    border: `1px solid ${sectionBorder}`,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {activeControlCount} active
                            </div>
                        </div>

                        <div
                            className="ally-panel-scroll"
                            style={{ padding: "0 12px 12px" }}
                        >
                            <PanelSection
                                title="Text"
                                surface={sectionSurface}
                                border={sectionBorder}
                                titleColor={panelText}
                            >
                                <FeatureButton
                                    icon={Icons.BiggerText}
                                    label="Bigger Text"
                                    active={
                                        activeFeatures.has("biggerText_1") ||
                                        activeFeatures.has("biggerText_2") ||
                                        activeFeatures.has("biggerText_3")
                                    }
                                    onClick={() => toggleFeature("biggerText")}
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                    level={biggerTextLevel}
                                />
                                <FeatureButton
                                    icon={Icons.LineHeight}
                                    label="Line Height"
                                    active={activeFeatures.has("lineHeight")}
                                    onClick={() => toggleFeature("lineHeight")}
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.TextAlign}
                                    label="Text Align"
                                    active={activeFeatures.has("textAlign")}
                                    onClick={() => toggleFeature("textAlign")}
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.ReadableFont}
                                    label="Readable Font"
                                    active={activeFeatures.has("readableFont")}
                                    onClick={() =>
                                        toggleFeature("readableFont")
                                    }
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.ReadingWidth}
                                    label="Reading Width"
                                    active={activeFeatures.has("readingWidth")}
                                    onClick={() =>
                                        toggleFeature("readingWidth")
                                    }
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                {speechSupported && (
                                    <FeatureButton
                                        icon={Icons.ReadPage}
                                        label={
                                            isSpeaking
                                                ? "Stop Reading"
                                                : "Read Page"
                                        }
                                        active={isSpeaking}
                                        onClick={toggleSpeech}
                                        accent={props.buttonColor}
                                        surfaceTone={panelTone}
                                    />
                                )}
                            </PanelSection>

                            <PanelSection
                                title="Visual"
                                surface={sectionSurface}
                                border={sectionBorder}
                                titleColor={panelText}
                            >
                                <FeatureButton
                                    icon={Icons.Contrast}
                                    label="Contrast"
                                    active={activeFeatures.has("contrast")}
                                    onClick={() => toggleFeature("contrast")}
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.Grayscale}
                                    label="Grayscale"
                                    active={activeFeatures.has("grayscale")}
                                    onClick={() => toggleFeature("grayscale")}
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.InvertColors}
                                    label="Invert"
                                    active={activeFeatures.has("invertColors")}
                                    onClick={() =>
                                        toggleFeature("invertColors")
                                    }
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.HideImages}
                                    label="Hide Img"
                                    active={activeFeatures.has("hideImages")}
                                    onClick={() => toggleFeature("hideImages")}
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.PauseAnimations}
                                    label="Pause Motion"
                                    active={activeFeatures.has(
                                        "pauseAnimations"
                                    )}
                                    onClick={() =>
                                        toggleFeature("pauseAnimations")
                                    }
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                            </PanelSection>

                            <PanelSection
                                title="Orientation"
                                surface={sectionSurface}
                                border={sectionBorder}
                                titleColor={panelText}
                            >
                                <FeatureButton
                                    icon={Icons.HighlightLinks}
                                    label="Highlight Links"
                                    active={activeFeatures.has(
                                        "highlightLinks"
                                    )}
                                    onClick={() =>
                                        toggleFeature("highlightLinks")
                                    }
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.ReadingMask}
                                    label="Reading Mask"
                                    active={activeFeatures.has("readingMask")}
                                    onClick={() => toggleFeature("readingMask")}
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.OutlineFocus}
                                    label="Outline Focus"
                                    active={activeFeatures.has("outlineFocus")}
                                    onClick={() =>
                                        toggleFeature("outlineFocus")
                                    }
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.PageStructure}
                                    label="Page Structure"
                                    active={activeFeatures.has("pageStructure")}
                                    onClick={() =>
                                        toggleFeature("pageStructure")
                                    }
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.LargeCursor}
                                    label="Large Cursor"
                                    active={activeFeatures.has("largeCursor")}
                                    onClick={() => toggleFeature("largeCursor")}
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                                <FeatureButton
                                    icon={Icons.MuteAudio}
                                    label="Mute Audio"
                                    active={activeFeatures.has("muteAudio")}
                                    onClick={() => toggleFeature("muteAudio")}
                                    accent={props.buttonColor}
                                    surfaceTone={panelTone}
                                />
                            </PanelSection>
                        </div>
                        <div
                            className="ally-panel-footer"
                            style={{
                                position: "relative",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px 16px 14px",
                                background: props.buttonColor,
                                color: buttonContrastText,
                                borderTop: `1px solid ${hexToRgba(props.buttonColor, 0.35)}`,
                            }}
                        >
                            <span
                                aria-hidden="true"
                                className="ally-panel-notch ally-panel-notch-bottom"
                                style={{ background: props.buttonColor }}
                            />
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 11.5,
                                    fontWeight: 580,
                                    letterSpacing: "0.004em",
                                }}
                            >
                                Accessibility statement
                            </p>
                            <span
                                style={{
                                    margin: 0,
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    letterSpacing: "0.01em",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {activeControlCount} active
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                #ally-toolbar-root .ally-trigger {
                    isolation: isolate;
                    touch-action: none;
                    line-height: 0;
                }

                #ally-toolbar-root .ally-toolbar-panel {
                    transform-origin: top right;
                }

                #ally-toolbar-root .ally-panel-notch {
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 120px;
                    height: 14px;
                    border-radius: 999px;
                    pointer-events: none;
                }

                #ally-toolbar-root .ally-panel-notch-top {
                    bottom: -7px;
                }

                #ally-toolbar-root .ally-panel-notch-bottom {
                    top: -7px;
                }

                #ally-toolbar-root .ally-panel-scroll {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-height: min(58vh, 560px);
                    overflow-y: auto;
                    padding-right: 3px;
                    scrollbar-width: thin;
                    scrollbar-color: var(--ally-scroll-thumb) transparent;
                }

                #ally-toolbar-root .ally-panel-scroll::-webkit-scrollbar {
                    width: 7px;
                }

                #ally-toolbar-root .ally-panel-scroll::-webkit-scrollbar-thumb {
                    background: var(--ally-scroll-thumb);
                    border-radius: 8px;
                }

                #ally-toolbar-root .ally-feature-section-head {
                    margin-bottom: 12px;
                }

                #ally-toolbar-root .ally-feature-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }

                #ally-toolbar-root .ally-feature-button:hover {
                    transform: translateY(-1px);
                    box-shadow: var(--ally-tile-shadow);
                }

                #ally-toolbar-root .ally-feature-button:focus-visible,
                #ally-toolbar-root .ally-panel-action:focus-visible,
                #ally-toolbar-root .ally-trigger:focus-visible {
                    outline: 3px solid var(--ally-focus-ring);
                    outline-offset: 2px;
                    box-shadow: 0 0 0 2px var(--ally-focus-backdrop);
                }

                #ally-toolbar-root .ally-panel-action {
                    transition: transform 0.18s ease, box-shadow 0.18s ease;
                }

                #ally-toolbar-root .ally-panel-action:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
                }

                #ally-toolbar-root .ally-feature-bars {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 4px;
                    width: 100%;
                    max-width: 116px;
                    margin-top: 2px;
                }

                #ally-toolbar-root .ally-feature-bars span {
                    display: block;
                    height: 7px;
                    border-radius: 999px;
                    background: rgba(148, 163, 184, 0.4);
                }

                #ally-toolbar-root .ally-feature-bars span[data-active="true"] {
                    background: currentColor;
                    opacity: 0.9;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(6px) scale(0.99);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @media (max-width: 860px) {
                    #ally-toolbar-root .ally-toolbar-panel {
                        width: calc(100vw - 20px) !important;
                        max-width: calc(100vw - 20px) !important;
                        border-radius: 22px !important;
                    }
                }

                @media (max-width: 620px) {
                    #ally-toolbar-root .ally-panel-topbar {
                        padding: 13px 12px 15px !important;
                    }

                    #ally-toolbar-root .ally-panel-body {
                        margin: 10px !important;
                    }

                    #ally-toolbar-root .ally-panel-scroll {
                        padding: 0 10px 10px !important;
                        max-height: min(60vh, 520px);
                    }

                    #ally-toolbar-root .ally-panel-footer {
                        padding: 10px 12px 12px !important;
                    }

                    #ally-toolbar-root .ally-feature-grid {
                        gap: 9px;
                    }
                }

                @media (max-width: 520px) {
                    #ally-toolbar-root .ally-feature-grid {
                        grid-template-columns: minmax(0, 1fr);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    #ally-toolbar-root .ally-feature-button,
                    #ally-toolbar-root .ally-panel-action,
                    #ally-toolbar-root .ally-trigger {
                        animation: none !important;
                        transition: none !important;
                        transform: none !important;
                    }
                }

                @media (prefers-contrast: more) {
                    #ally-toolbar-root .ally-feature-button,
                    #ally-toolbar-root .ally-panel-action,
                    #ally-toolbar-root .ally-toolbar-panel {
                        border-width: 2px !important;
                    }

                    #ally-toolbar-root .ally-feature-button span,
                    #ally-toolbar-root .ally-panel-action {
                        font-weight: 700 !important;
                    }
                }

                @media (forced-colors: active) {
                    #ally-toolbar-root .ally-trigger,
                    #ally-toolbar-root .ally-toolbar-panel,
                    #ally-toolbar-root .ally-feature-button,
                    #ally-toolbar-root .ally-panel-action {
                        forced-color-adjust: auto;
                    }
                }
            `}</style>
        </div>
    )
}

function ReadingMask({ mouseY }: { mouseY: number }) {
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 2147483640,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: Math.max(0, mouseY - 50),
                    backgroundColor: "rgba(0,0,0,0.7)",
                    transition: "height 0.1s ease-out",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: mouseY + 50,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    transition: "top 0.1s ease-out",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: mouseY,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: "red",
                    opacity: 0.5,
                }}
            />
        </div>
    )
}

function PanelSection({
    title,
    children,
    surface,
    border,
    titleColor,
}: PanelSectionProps) {
    return (
        <section
            aria-label={title}
            style={{
                borderRadius: 22,
                padding: 14,
                background: surface,
                border: `1px solid ${border}`,
            }}
        >
            <div className="ally-feature-section-head">
                <h3
                    style={{
                        margin: 0,
                        fontSize: 17,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        color: titleColor,
                    }}
                >
                    {title}
                </h3>
            </div>
            <div className="ally-feature-grid">{children}</div>
        </section>
    )
}

function FeatureButton({
    icon,
    label,
    active,
    onClick,
    accent,
    surfaceTone,
    level,
}: FeatureButtonProps) {
    const isDarkSurface = surfaceTone === "dark"
    const accentRgb = hexToRgb(accent)
    const activeText = isDarkSurface ? "#f8fbff" : "#111827"
    const inactiveText = isDarkSurface ? "rgba(232, 239, 250, 0.96)" : "#111827"
    const inactiveBackground = "var(--ally-tile-bg, rgba(255,255,255,0.96))"
    const inactiveBorder = "var(--ally-tile-border, rgba(15,23,42,0.16))"
    const activeBackground = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${isDarkSurface ? 0.3 : 0.16})`
    const activeBorder = hexToRgba(accent, isDarkSurface ? 0.56 : 0.35)
    const activeLevels = Math.min(4, level ? level + 1 : 0)

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            aria-label={`${label}: ${active ? "enabled" : "disabled"}`}
            className="ally-feature-button"
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 12,
                padding: "14px 14px",
                background: active ? activeBackground : inactiveBackground,
                color: active ? activeText : inactiveText,
                border: active
                    ? `1px solid ${activeBorder}`
                    : `1px solid ${inactiveBorder}`,
                borderRadius: 18,
                cursor: "pointer",
                transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                minHeight: 92,
                boxShadow: active
                    ? `0 10px 18px ${hexToRgba(accent, isDarkSurface ? 0.3 : 0.16)}`
                    : isDarkSurface
                      ? "0 4px 12px rgba(0,0,0,0.28)"
                      : "0 2px 8px rgba(15,23,42,0.08)",
                position: "relative",
                overflow: "hidden",
                fontFamily:
                    '"Avenir Next", "SF Pro Display", "Manrope", "Segoe UI Variable", sans-serif',
                textAlign: "left",
            }}
        >
            <div
                style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active
                        ? `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${isDarkSurface ? 0.4 : 0.2})`
                        : "var(--ally-tile-icon-bg, rgba(255,255,255,0.92))",
                    border: active
                        ? `1px solid ${hexToRgba(accent, isDarkSurface ? 0.54 : 0.26)}`
                        : "1px solid var(--ally-tile-icon-border, rgba(15,23,42,0.12))",
                    flexShrink: 0,
                }}
            >
                {React.cloneElement(icon, {
                    width: 24,
                    height: 24,
                    strokeWidth: 1.95,
                })}
            </div>
            <div
                style={{
                    minWidth: 0,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                }}
            >
                <span
                    style={{
                        fontSize: 14,
                        fontWeight: 600,
                        letterSpacing: "-0.005em",
                        lineHeight: 1.2,
                        whiteSpace: "normal",
                    }}
                >
                    {label}
                </span>
                {typeof level === "number" && (
                    <span
                        className="ally-feature-bars"
                        style={{
                            color: active
                                ? accent
                                : isDarkSurface
                                  ? "#dbe4f2"
                                  : "#6b7280",
                        }}
                    >
                        {Array.from({ length: 4 }).map((_, index) => (
                            <span
                                key={index}
                                data-active={index < activeLevels}
                            />
                        ))}
                    </span>
                )}
            </div>
        </button>
    )
}

function getTriggerIcon(icon: TriggerIconOption) {
    if (icon === "Person") return Icons.AccessPerson
    if (icon === "Wheelchair") return Icons.AccessWheelchair
    if (icon === "Text Aa") return Icons.AccessAa
    if (icon === "Settings") return Icons.AccessSettings
    return Icons.Access
}

function hexToRgba(hex: string, alpha: number) {
    const { r, g, b } = hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function hexToRgb(hex: string) {
    const normalized = hex.replace("#", "").trim()
    if (!/^[0-9a-fA-F]{3,8}$/.test(normalized)) {
        return { r: 0, g: 117, b: 255 }
    }

    const fullHex =
        normalized.length === 3
            ? normalized
                  .split("")
                  .map((char) => char + char)
                  .join("")
            : normalized.slice(0, 6)

    return {
        r: parseInt(fullHex.slice(0, 2), 16),
        g: parseInt(fullHex.slice(2, 4), 16),
        b: parseInt(fullHex.slice(4, 6), 16),
    }
}

function getAccessibleTextColor(hex: string) {
    const { r, g, b } = hexToRgb(hex)
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    return luminance > 0.62 ? "#0f172a" : "#FFFFFF"
}

function detectPageTone(): "light" | "dark" {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return "light"
    }
    if (!document.body) {
        return typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
    }

    const bodyBg = parseCssColor(
        window.getComputedStyle(document.body).backgroundColor
    )
    const htmlBg = parseCssColor(
        window.getComputedStyle(document.documentElement).backgroundColor
    )
    const preferredDark =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches

    const color = bodyBg?.alpha && bodyBg.alpha > 0.02 ? bodyBg : htmlBg
    if (!color) {
        return preferredDark ? "dark" : "light"
    }

    const luminance =
        (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255
    return luminance < 0.46 ? "dark" : "light"
}

function parseCssColor(input: string) {
    const value = input.trim()
    const rgbMatch = value.match(/rgba?\(([^)]+)\)/i)
    if (rgbMatch) {
        const parts = rgbMatch[1]
            .replace(/\//g, " ")
            .split(/[,\s]+/)
            .map((part) => part.trim())
            .filter(Boolean)
        if (parts.length >= 3) {
            const r = clampColor(parts[0])
            const g = clampColor(parts[1])
            const b = clampColor(parts[2])
            const alpha = parts[3] !== undefined ? clampAlpha(parts[3]) : 1
            return { r, g, b, alpha }
        }
    }

    const hexMatch = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    if (hexMatch) {
        const raw = hexMatch[1]
        const fullHex =
            raw.length === 3
                ? raw
                      .split("")
                      .map((char) => char + char)
                      .join("")
                : raw
        return {
            r: parseInt(fullHex.slice(0, 2), 16),
            g: parseInt(fullHex.slice(2, 4), 16),
            b: parseInt(fullHex.slice(4, 6), 16),
            alpha: 1,
        }
    }

    return null
}

function clampColor(value: string) {
    const numeric = Number.parseFloat(value)
    if (Number.isNaN(numeric)) return 0
    return Math.min(255, Math.max(0, numeric))
}

function clampAlpha(value: string) {
    const numeric = Number.parseFloat(value)
    if (Number.isNaN(numeric)) return 1
    return Math.min(1, Math.max(0, numeric))
}

addPropertyControls(AllyToolbar, {
    buttonColor: {
        type: ControlType.Color,
        defaultValue: "#0075FF",
        title: "Button",
    },
    triggerIcon: {
        type: ControlType.Enum,
        options: [...TRIGGER_ICON_OPTIONS],
        optionTitles: [
            "Universal",
            "Person",
            "Wheelchair",
            "Text Aa",
            "Settings",
        ],
        defaultValue: "Universal",
        title: "Icon",
    },
    panelAppearance: {
        type: ControlType.Enum,
        options: ["Auto", "Light", "Dark"],
        defaultValue: "Auto",
        title: "Panel Look",
    },
    buttonSize: {
        type: ControlType.Number,
        defaultValue: 56,
        min: 44,
        max: 100,
        title: "Button Size",
    },
    startPosition: {
        type: ControlType.Enum,
        options: ["Bottom Right", "Bottom Left"],
        defaultValue: "Bottom Right",
        title: "Start Pos",
    },
})
