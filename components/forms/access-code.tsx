// @framerDisableUnlink
/**
 * Access Code — BuiltByKern
 * Segmented invite / OTP field. Soft unlock, Remember, Action.
 */
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    AnimatePresence,
    motion,
    useReducedMotion,
} from "framer-motion"
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type ChangeEvent,
    type ClipboardEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type FormEvent,
} from "react"

type CodeMode = "alphanumeric" | "numeric"
type PeekMode = "idle" | "focused" | "filled" | "error" | "success"

interface ContentCtrl {
    length: number
    groupSize: number
    mode: CodeMode
    mask: boolean
    expectedCode: string
    remember: boolean
    storageKey: string
    clearOnFail: boolean
    label: string
    helper: string
    errorLabel: string
    successLabel: string
}

interface LayoutCtrl {
    radius: number
    gap: number
    slotWidth: number
    slotHeight: number
}

interface LookCtrl {
    background: string
    slotFill: string
    slotBorder: string
    accent: string
    text: string
    shadow: boolean
    font: CSSProperties
}

interface PreviewCtrl {
    mode: PeekMode
}

interface ActionCtrl {
    link: string
    section: string
    newTab: boolean
}

interface AccessCodeProps {
    content: ContentCtrl
    layout: LayoutCtrl
    look: LookCtrl
    action: ActionCtrl
    preview: PreviewCtrl
    onComplete?: () => void
    onChange?: () => void
    onError?: () => void
    style?: CSSProperties
}

/** Soft iris — product accent. */
const DEFAULT_ACCENT = "#9B8CFF"

const DEFAULT_FONT: CSSProperties = {
    fontSize: "22px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    lineHeight: "1em",
}

const DEFAULT_CONTENT: ContentCtrl = {
    length: 6,
    groupSize: 3,
    mode: "alphanumeric",
    mask: false,
    expectedCode: "",
    remember: false,
    storageKey: "access",
    clearOnFail: true,
    label: "Access code",
    helper: "Enter your invite code",
    errorLabel: "Invalid code",
    successLabel: "Unlocked",
}

const DEFAULT_LAYOUT: LayoutCtrl = {
    radius: 12,
    gap: 10,
    slotWidth: 48,
    slotHeight: 56,
}

const DEFAULT_LOOK: LookCtrl = {
    background: "transparent",
    slotFill: "#121214",
    slotBorder: "rgba(255,248,240,0.12)",
    accent: DEFAULT_ACCENT,
    text: "#FFF8F0",
    shadow: true,
    font: DEFAULT_FONT,
}

const DEFAULT_PREVIEW: PreviewCtrl = {
    mode: "focused",
}

const DEFAULT_ACTION: ActionCtrl = {
    link: "",
    section: "",
    newTab: false,
}

const NAV_DELAY_MS = 280
const NAV_RM_MS = 0
/** Digit / ring / shake / success — fixed craft (not buyer controls). */
const DIGIT_POP = 1.12
const RING_MS = 220
const SHAKE_MS = 280
const SUCCESS_MS = 480
const EASE_OUT_BEZIER = [0.23, 1, 0.32, 1] as const
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)"
const DIGIT_MS = 0.14

const CARET_CSS = `
@keyframes ac-caret-blink {
  0%, 45% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.ac-caret {
  width: 1.5px;
  height: 1.15em;
  border-radius: 1px;
  background: var(--ac-accent, #9B8CFF);
  animation: ac-caret-blink 1.05s steps(1) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .ac-caret { animation: none; opacity: 1; }
}
`

const SR_ONLY: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
}

function mergeContent(c?: Partial<ContentCtrl>): ContentCtrl {
    return { ...DEFAULT_CONTENT, ...c }
}

function mergeLayout(l?: Partial<LayoutCtrl>): LayoutCtrl {
    return { ...DEFAULT_LAYOUT, ...l }
}

function mergeLook(l?: Partial<LookCtrl>): LookCtrl {
    return {
        ...DEFAULT_LOOK,
        ...l,
        font: { ...DEFAULT_FONT, ...(l?.font || {}) },
    }
}

function mergePreview(p?: Partial<PreviewCtrl>): PreviewCtrl {
    return { ...DEFAULT_PREVIEW, ...p }
}

function mergeAction(a?: Partial<ActionCtrl>): ActionCtrl {
    return { ...DEFAULT_ACTION, ...a }
}

function resolveHref(raw: string): string | null {
    const v = (raw || "").trim()
    if (!v) return null
    return v
}

function isExternalHref(href: string): boolean {
    const lower = href.toLowerCase()
    return (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("//")
    )
}

function openConfirmLink(href: string, forceNewTab: boolean) {
    if (typeof window === "undefined" || !href) return
    if (forceNewTab || isExternalHref(href)) {
        window.open(href, "_blank", "noopener,noreferrer")
        return
    }
    window.location.assign(href)
}

function findSectionElement(name: string): Element | null {
    if (typeof document === "undefined" || !name) return null
    const byId = document.getElementById(name)
    if (byId) return byId
    const escaped =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
            ? CSS.escape(name)
            : name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    const byName = document.querySelector(`[data-framer-name="${escaped}"]`)
    if (byName) return byName
    try {
        const byHash = document.querySelector(`#${escaped}`)
        if (byHash) return byHash
    } catch {
        /* invalid selector */
    }
    return null
}

function scrollToSection(name: string, smooth: boolean) {
    if (typeof window === "undefined" || !name) return
    const el = findSectionElement(name)
    if (!el) return
    el.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
    })
}

function clampLength(n: number): number {
    return Math.max(4, Math.min(8, Math.round(n || 6)))
}

function clampGroupSize(n: number, length: number): number {
    const g = Math.round(n || 0)
    if (g <= 0) return 0
    return Math.max(2, Math.min(length - 1, g))
}

function sanitizeChar(ch: string, mode: CodeMode): string {
    if (!ch) return ""
    const c = ch[0]
    if (mode === "numeric") {
        return /\d/.test(c) ? c : ""
    }
    return /[a-zA-Z0-9]/.test(c) ? c.toUpperCase() : ""
}

function sanitizeCode(raw: string, mode: CodeMode, max: number): string {
    const stripped = (raw || "").replace(/[\s\-_.]/g, "")
    let out = ""
    for (let i = 0; i < stripped.length && out.length < max; i++) {
        const c = sanitizeChar(stripped[i], mode)
        if (c) out += c
    }
    return out
}

/** Comma / newline / semicolon list → unique full-length codes. */
function parseExpectedCodes(
    raw: string,
    mode: CodeMode,
    max: number
): string[] {
    const parts = (raw || "").split(/[\n,;]+/)
    const out: string[] = []
    for (const part of parts) {
        const code = sanitizeCode(part, mode, max)
        if (code.length === max) out.push(code)
    }
    return [...new Set(out)]
}

function storageKeyFor(key: string): string {
    const safe = (key || "access")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48)
    return `kern-access-code-v2:${safe || "access"}`
}

function readRemembered(key: string): string | null {
    if (typeof window === "undefined") return null
    try {
        const raw = window.localStorage.getItem(storageKeyFor(key))
        if (!raw) return null
        const parsed = JSON.parse(raw) as { code?: string }
        return typeof parsed?.code === "string" ? parsed.code : null
    } catch {
        return null
    }
}

function writeRemembered(key: string, code: string) {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(
            storageKeyFor(key),
            JSON.stringify({ code, at: Date.now() })
        )
    } catch {
        /* private mode / quota */
    }
}

function clearRemembered(key: string) {
    if (typeof window === "undefined") return
    try {
        window.localStorage.removeItem(storageKeyFor(key))
    } catch {
        /* ignore */
    }
}

function slotShadow(on: boolean, accent: string, softBloom: boolean): string {
    if (!on && !softBloom) return "none"
    const base = on
        ? [
              "0 1px 0 rgba(255,255,255,0.04) inset",
              "0 8px 20px rgba(0,0,0,0.35)",
              "0 1px 3px rgba(0,0,0,0.25)",
          ]
        : []
    // Soft bloom only on rare success — not on every focus step (paint cost).
    if (softBloom) {
        base.push(`0 0 0 1px color-mix(in srgb, ${accent} 55%, transparent)`)
        base.push(`0 0 22px color-mix(in srgb, ${accent} 28%, transparent)`)
    }
    return base.length ? base.join(", ") : "none"
}

/** Left offset of slot i inside the flex row (includes group separators + gaps). */
function slotOffsetX(
    index: number,
    slotW: number,
    gap: number,
    groupSize: number
): number {
    const sepW = Math.max(6, gap * 0.55)
    let x = 0
    for (let i = 0; i < index; i++) {
        const hasSep = groupSize > 0 && i > 0 && i % groupSize === 0
        x += (hasSep ? sepW + gap : 0) + slotW + gap
    }
    const hasSep = groupSize > 0 && index > 0 && index % groupSize === 0
    if (hasSep) x += sepW + gap
    return x
}

function previewValue(mode: PeekMode, length: number): string {
    if (mode === "idle") return ""
    if (mode === "focused") return length >= 2 ? "A".repeat(1) : ""
    const fill = "KERN01AB"
    return fill.slice(0, length).padEnd(length, "0").slice(0, length)
}

/**
 * Access Code
 *
 * Segmented invite / OTP input with soft unlock and Action.
 *
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AccessCode(props: AccessCodeProps) {
    const content = mergeContent(props.content)
    const layout = mergeLayout(props.layout)
    const look = mergeLook(props.look)
    const action = mergeAction(props.action)
    const preview = mergePreview(props.preview)
    const { style, onComplete, onChange, onError } = props
    const isStatic = useIsStaticRenderer()
    const reducedMotionPref = useReducedMotion()
    const reducedMotion = !!reducedMotionPref

    const length = clampLength(content.length)
    const groupSize = clampGroupSize(content.groupSize, length)
    const mode: CodeMode =
        content.mode === "numeric" ? "numeric" : "alphanumeric"
    const mask = content.mask === true
    const remember = content.remember === true
    const storageKey = (content.storageKey || "access").trim() || "access"
    const clearOnFail = content.clearOnFail !== false
    const expectedList = parseExpectedCodes(
        content.expectedCode || "",
        mode,
        length
    )
    const label =
        (content.label || DEFAULT_CONTENT.label).trim() || "Access code"
    // Allow empty helper (buyer may rely on external caption)
    const helper = String(content.helper ?? DEFAULT_CONTENT.helper).trim()
    const errorLabel =
        (content.errorLabel || DEFAULT_CONTENT.errorLabel).trim() ||
        "Invalid code"
    const successLabel =
        (content.successLabel || DEFAULT_CONTENT.successLabel).trim() ||
        "Unlocked"

    const accent = look.accent || DEFAULT_ACCENT
    const slotFill = look.slotFill || DEFAULT_LOOK.slotFill
    const slotBorder = look.slotBorder || DEFAULT_LOOK.slotBorder
    const textColor = look.text || DEFAULT_LOOK.text
    const bg = look.background || DEFAULT_LOOK.background
    const shadowOn = look.shadow !== false
    const font = look.font || DEFAULT_FONT
    const radius = Math.max(0, Math.min(28, layout.radius ?? 12))
    const gap = Math.max(4, Math.min(24, layout.gap ?? 10))
    const slotW = Math.max(32, Math.min(72, layout.slotWidth ?? 48))
    const slotH = Math.max(40, Math.min(80, layout.slotHeight ?? 56))
    const digitPop = DIGIT_POP
    const ringMs = RING_MS
    const shakeMs = SHAKE_MS
    const successGlow = SUCCESS_MS / 1000

    const actionLink = resolveHref(action.link || "")
    const actionSection = (action.section || "").trim()
    const openInNewTab = action.newTab === true

    const uid = useId()
    const inputId = `${uid}-input`
    const helperId = `${uid}-helper`
    const statusId = `${uid}-status`

    const [value, setValue] = useState("")
    const [focused, setFocused] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const [error, setError] = useState(false)
    const [success, setSuccess] = useState(false)
    const [shaking, setShaking] = useState(false)
    const [announce, setAnnounce] = useState("")
    const [entered, setEntered] = useState(false)
    /** Multi-char insert (paste/autofill) — stagger digit enter once; never on typing. */
    const [digitStagger, setDigitStagger] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const valueRef = useRef(value)
    valueRef.current = value
    const successRef = useRef(false)
    const navTimerRef = useRef(0)
    const shakeTimerRef = useRef(0)
    const onCompleteRef = useRef(onComplete)
    onCompleteRef.current = onComplete
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const onErrorRef = useRef(onError)
    onErrorRef.current = onError
    const actionLinkRef = useRef(actionLink)
    actionLinkRef.current = actionLink
    const actionSectionRef = useRef(actionSection)
    actionSectionRef.current = actionSection
    const openInNewTabRef = useRef(openInNewTab)
    openInNewTabRef.current = openInNewTab
    const reducedMotionRef = useRef(reducedMotion)
    reducedMotionRef.current = reducedMotion
    const expectedListRef = useRef(expectedList)
    expectedListRef.current = expectedList
    const clearOnFailRef = useRef(clearOnFail)
    clearOnFailRef.current = clearOnFail
    const rememberRef = useRef(remember)
    rememberRef.current = remember
    const storageKeyRef = useRef(storageKey)
    storageKeyRef.current = storageKey
    const lengthRef = useRef(length)
    lengthRef.current = length
    const restoredRef = useRef(false)

    // Canvas preview overrides live value/state
    const peekMode = isStatic ? preview.mode : null
    const displayValue = peekMode
        ? peekMode === "focused"
            ? previewValue("focused", length)
            : peekMode === "idle"
              ? ""
              : previewValue(peekMode, length)
        : value
    const displayFocused =
        peekMode === "focused" || peekMode === "filled"
            ? true
            : peekMode
              ? false
              : focused
    const displayError = peekMode === "error" ? true : peekMode ? false : error
    const displaySuccess =
        peekMode === "success" ? true : peekMode ? false : success
    const displayActive = peekMode
        ? peekMode === "focused"
            ? Math.min(1, length - 1)
            : peekMode === "filled" || peekMode === "error" || peekMode === "success"
              ? length - 1
              : 0
        : Math.min(activeIndex, length - 1)

    useEffect(() => {
        if (isStatic || reducedMotion) {
            setEntered(true)
            return
        }
        const t = window.setTimeout(() => setEntered(true), 16)
        return () => window.clearTimeout(t)
    }, [isStatic, reducedMotion])

    // Restore remembered unlock (skip Link/Section to avoid redirect loops)
    useEffect(() => {
        if (isStatic || !remember || restoredRef.current) return
        restoredRef.current = true
        const saved = readRemembered(storageKey)
        if (!saved) return
        const clean = sanitizeCode(saved, mode, length)
        if (clean.length !== length) {
            clearRemembered(storageKey)
            return
        }
        const list = parseExpectedCodes(content.expectedCode || "", mode, length)
        if (list.length > 0 && !list.includes(clean)) {
            clearRemembered(storageKey)
            return
        }
        startTransition(() => {
            setValue(clean)
            setActiveIndex(length - 1)
            setSuccess(true)
            setError(false)
            successRef.current = true
            setAnnounce(successLabel)
        })
        // Do not fire onComplete / nav on restore — that made demos look "already done"
    }, [isStatic, remember, storageKey, mode, length, successLabel])

    useEffect(() => {
        // Reset when length/mode change
        startTransition(() => {
            setValue((v) => sanitizeCode(v, mode, length))
            setError(false)
            if (!restoredRef.current || !successRef.current) {
                setSuccess(false)
                successRef.current = false
            }
            setActiveIndex(0)
        })
    }, [length, mode])

    useEffect(() => {
        return () => {
            if (navTimerRef.current) window.clearTimeout(navTimerRef.current)
            if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current)
        }
    }, [])

    const fireNav = useCallback(() => {
        const href = actionLinkRef.current
        const section = actionSectionRef.current
        const delay = reducedMotionRef.current ? NAV_RM_MS : NAV_DELAY_MS
        if (navTimerRef.current) window.clearTimeout(navTimerRef.current)
        navTimerRef.current = window.setTimeout(() => {
            if (href) {
                openConfirmLink(href, openInNewTabRef.current)
                return
            }
            if (section) {
                scrollToSection(section, !reducedMotionRef.current)
            }
        }, delay)
    }, [])

    const triggerError = useCallback(() => {
        setError(true)
        setSuccess(false)
        successRef.current = false
        setAnnounce(errorLabel)
        try {
            onErrorRef.current?.()
        } catch {
            /* buyer handler */
        }
        if (clearOnFailRef.current) {
            setValue("")
            setActiveIndex(0)
            valueRef.current = ""
            if (typeof window !== "undefined") {
                window.setTimeout(() => {
                    inputRef.current?.focus()
                }, 0)
            }
        }
        if (reducedMotionRef.current) {
            setShaking(false)
            return
        }
        setShaking(true)
        if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current)
        shakeTimerRef.current = window.setTimeout(() => {
            setShaking(false)
        }, shakeMs)
    }, [errorLabel, shakeMs])

    const triggerSuccess = useCallback(
        (code: string, opts?: { skipNav?: boolean }) => {
            if (successRef.current) return
            successRef.current = true
            setSuccess(true)
            setError(false)
            setShaking(false)
            setAnnounce(successLabel)
            if (rememberRef.current) {
                writeRemembered(storageKeyRef.current, code)
            }
            try {
                onCompleteRef.current?.()
            } catch {
                /* buyer handler */
            }
            if (!opts?.skipNav) fireNav()
        },
        [fireNav, successLabel]
    )

    const commitValue = useCallback(
        (next: string) => {
            const clean = sanitizeCode(next, mode, length)
            const prevLen = valueRef.current.length
            const multiInsert = clean.length - prevLen > 1
            startTransition(() => {
                setDigitStagger(multiInsert && !reducedMotionRef.current)
                setValue(clean)
                setActiveIndex(Math.min(clean.length, length - 1))
                setError(false)
                if (successRef.current && clean.length < length) {
                    successRef.current = false
                    setSuccess(false)
                    if (rememberRef.current) {
                        clearRemembered(storageKeyRef.current)
                    }
                }
            })
            valueRef.current = clean
            try {
                onChangeRef.current?.()
            } catch {
                /* buyer handler */
            }

            if (clean.length < length) return

            const list = expectedListRef.current
            if (list.length > 0 && !list.includes(clean)) {
                triggerError()
                return
            }
            triggerSuccess(clean)
        },
        [length, mode, triggerError, triggerSuccess]
    )

    const focusInput = useCallback(() => {
        if (isStatic) return
        inputRef.current?.focus()
        // Programmatic focus does not always fire React onFocus — set state explicitly
        setFocused(true)
        setActiveIndex((i) =>
            Math.min(valueRef.current.length, Math.max(0, length - 1))
        )
    }, [isStatic, length])

    // Preview / live: land focused so caret + ring show (idle empty looked "finished")
    useEffect(() => {
        if (isStatic) return
        const id = window.requestAnimationFrame(() => focusInput())
        return () => window.cancelAnimationFrame(id)
    }, [isStatic, focusInput])

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (isStatic) return
        commitValue(e.target.value)
    }

    const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
        if (isStatic) return
        e.preventDefault()
        const text = e.clipboardData.getData("text") || ""
        commitValue(text)
    }

    const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (isStatic) return
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            setActiveIndex((i) => Math.max(0, i - 1))
            return
        }
        if (e.key === "ArrowRight") {
            e.preventDefault()
            setActiveIndex((i) => Math.min(length - 1, Math.max(valueRef.current.length, i + 1)))
            return
        }
        if (e.key === "Backspace" && !valueRef.current) {
            setActiveIndex(0)
        }
        if (successRef.current && (e.key === "Backspace" || e.key.length === 1)) {
            // Allow edit after success — clear seal
            successRef.current = false
            setSuccess(false)
        }
    }

    const onRootClick = () => {
        focusInput()
    }

    const onFormSubmit = (e: FormEvent) => {
        e.preventDefault()
    }

    const chars = useMemo(() => {
        const arr: string[] = []
        for (let i = 0; i < length; i++) {
            arr.push(displayValue[i] || "")
        }
        return arr
    }, [displayValue, length])

    const focusRingX = useMemo(
        () => slotOffsetX(displayActive, slotW, gap, groupSize),
        [displayActive, slotW, gap, groupSize]
    )

    const showFocusRing = displayFocused && !displaySuccess

    const statusText = displaySuccess
        ? successLabel
        : displayError
          ? errorLabel
          : helper

    const digitTransition = reducedMotion
        ? { duration: 0.1, ease: EASE_OUT_BEZIER }
        : { duration: DIGIT_MS, ease: EASE_OUT_BEZIER }

    const focusMoveTransition = reducedMotion
        ? { duration: 0 }
        : { duration: DIGIT_MS, ease: EASE_OUT_BEZIER }

    const ringTravelTransition = reducedMotion
        ? { duration: 0 }
        : { duration: ringMs / 1000, ease: EASE_OUT_BEZIER }

    const shakeX = shaking && !reducedMotion && !isStatic
        ? [0, -7, 6, -5, 3, -2, 0]
        : 0

    const freezeMotion = isStatic || reducedMotion

    // Marketplace static renderer: plain DOM only (no motion / AnimatePresence).
    if (isStatic) {
        const rootStyle: CSSProperties = {
            position: "relative",
            width: "100%",
            height: "auto",
            boxSizing: "border-box",
            background: bg,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            ...style,
            ["--ac-accent" as string]: accent,
        }
        return (
            <div
                data-framer-name="Access Code"
                data-static="true"
                data-state={
                    displaySuccess
                        ? "success"
                        : displayError
                          ? "error"
                          : displayFocused
                            ? "focused"
                            : "idle"
                }
                style={rootStyle}
            >
                <label htmlFor={inputId} style={SR_ONLY}>
                    {label}
                </label>
                <div
                    role="presentation"
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap,
                        position: "relative",
                        zIndex: 1,
                        width: "max-content",
                        maxWidth: "100%",
                    }}
                >
                    {showFocusRing ? (
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                left: -1 + focusRingX,
                                top: -1,
                                width: slotW + 2,
                                height: slotH + 2,
                                borderRadius: radius + 1,
                                border: `1.5px solid ${accent}`,
                                boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 22%, transparent)`,
                                pointerEvents: "none",
                                zIndex: 3,
                            }}
                        />
                    ) : null}
                    {chars.map((ch, i) => {
                        const showSep =
                            groupSize > 0 && i > 0 && i % groupSize === 0
                        const isActive =
                            !displaySuccess &&
                            displayActive === i &&
                            displayFocused
                        const filled = !!ch
                        const showCaret =
                            isActive && !filled && !displayError
                        return (
                            <div
                                key={`wrap-${i}`}
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap,
                                }}
                            >
                                {showSep ? (
                                    <span
                                        aria-hidden
                                        style={{
                                            width: Math.max(6, gap * 0.55),
                                            height: 2,
                                            borderRadius: 1,
                                            background: "rgba(255,248,240,0.22)",
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : null}
                                <div
                                    style={{
                                        position: "relative",
                                        width: slotW,
                                        height: slotH,
                                        borderRadius: radius,
                                        background: slotFill,
                                        boxSizing: "border-box",
                                        border: `1px solid ${
                                            displayError
                                                ? "color-mix(in srgb, #FF6B6B 75%, transparent)"
                                                : displaySuccess
                                                  ? `color-mix(in srgb, ${accent} 70%, transparent)`
                                                  : isActive
                                                    ? "transparent"
                                                    : slotBorder
                                        }`,
                                        boxShadow: slotShadow(
                                            shadowOn,
                                            accent,
                                            displaySuccess
                                        ),
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        color: textColor,
                                        fontVariantNumeric: "tabular-nums",
                                        ...font,
                                    }}
                                >
                                    {displaySuccess ? (
                                        <div
                                            aria-hidden
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                borderRadius: radius,
                                                background: `radial-gradient(circle at 50% 38%, color-mix(in srgb, ${accent} 28%, transparent) 0%, transparent 68%)`,
                                                pointerEvents: "none",
                                                zIndex: 0,
                                            }}
                                        />
                                    ) : null}
                                    {filled ? (
                                        <span
                                            style={{
                                                position: "relative",
                                                zIndex: 2,
                                                userSelect: "none",
                                            }}
                                        >
                                            {mask ? "•" : ch}
                                        </span>
                                    ) : showCaret ? (
                                        <span
                                            aria-hidden
                                            style={{
                                                position: "relative",
                                                zIndex: 2,
                                                width: 1.5,
                                                height: "1.15em",
                                                borderRadius: 1,
                                                background:
                                                    "var(--ac-accent, #9B8CFF)",
                                                opacity: 1,
                                            }}
                                        />
                                    ) : null}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div
                    id={helperId}
                    style={{
                        fontSize: 13,
                        fontWeight: 500,
                        letterSpacing: "0.01em",
                        lineHeight: 1.35,
                        textAlign: "center",
                        minHeight: "1.35em",
                        maxWidth: 320,
                        position: "relative",
                        color: displayError
                            ? "color-mix(in srgb, #FF8A8A 90%, #FFF8F0)"
                            : displaySuccess
                              ? `color-mix(in srgb, ${accent} 85%, #FFF8F0)`
                              : "rgba(255,248,240,0.42)",
                    }}
                >
                    {statusText}
                </div>
                <div
                    id={statusId}
                    role="status"
                    aria-live="polite"
                    style={SR_ONLY}
                >
                    {statusText}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            data-framer-name="Access Code"
            data-static={isStatic ? "true" : "false"}
            data-state={
                displaySuccess
                    ? "success"
                    : displayError
                      ? "error"
                      : displayFocused
                        ? "focused"
                        : "idle"
            }
            style={{
                position: "relative",
                width: "100%",
                height: "auto",
                boxSizing: "border-box",
                background: bg,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                ...style,
                ["--ac-accent" as string]: accent,
            }}
            onClick={onRootClick}
        >
            {!isStatic ? <style>{CARET_CSS}</style> : null}

            <label htmlFor={inputId} style={SR_ONLY}>
                {label}
            </label>

            <form
                onSubmit={onFormSubmit}
                style={{
                    position: "relative",
                    margin: 0,
                    padding: 0,
                    width: "max-content",
                    maxWidth: "100%",
                }}
            >
                <input
                    ref={inputRef}
                    id={inputId}
                    type="text"
                    inputMode={mode === "numeric" ? "numeric" : "text"}
                    autoComplete="off"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={length}
                    value={isStatic ? displayValue : value}
                    disabled={isStatic}
                    aria-label={label}
                    aria-describedby={`${helperId} ${statusId}`}
                    aria-invalid={displayError || undefined}
                    aria-busy={displaySuccess || undefined}
                    onChange={onInputChange}
                    onPaste={onPaste}
                    onKeyDown={onKeyDown}
                    onFocus={() => {
                        setFocused(true)
                        setActiveIndex(Math.min(valueRef.current.length, length - 1))
                    }}
                    onBlur={() => setFocused(false)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        border: 0,
                        padding: 0,
                        margin: 0,
                        caretColor: "transparent",
                        color: "transparent",
                        background: "transparent",
                        outline: "none",
                        zIndex: 2,
                        cursor: "text",
                    }}
                />

                <motion.div
                    role="presentation"
                    animate={{
                        x: shakeX,
                        scale:
                            displaySuccess && !freezeMotion
                                ? 1.02
                                : 1,
                        y:
                            displaySuccess && !freezeMotion
                                ? -2
                                : 0,
                    }}
                    transition={
                        freezeMotion
                            ? { duration: 0 }
                            : shaking
                              ? {
                                    duration: shakeMs / 1000,
                                    ease: "easeInOut",
                                }
                              : displaySuccess
                                ? {
                                      type: "spring",
                                      stiffness: 420,
                                      damping: 26,
                                      mass: 0.85,
                                  }
                                : {
                                      duration: DIGIT_MS,
                                      ease: EASE_OUT_BEZIER,
                                  }
                    }
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap,
                        position: "relative",
                        zIndex: 1,
                        pointerEvents: "none",
                        transformOrigin: "50% 50%",
                    }}
                >
                    {showFocusRing ? (
                        <motion.div
                            aria-hidden
                            initial={false}
                            animate={{
                                x: focusRingX,
                                y: reducedMotion ? 0 : -2,
                                scale: reducedMotion ? 1 : 1.02,
                            }}
                            transition={ringTravelTransition}
                            style={{
                                position: "absolute",
                                left: -1,
                                top: -1,
                                width: slotW + 2,
                                height: slotH + 2,
                                borderRadius: radius + 1,
                                border: `1.5px solid ${accent}`,
                                boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 22%, transparent)`,
                                pointerEvents: "none",
                                zIndex: 3,
                            }}
                        />
                    ) : null}
                    {chars.map((ch, i) => {
                        const showSep =
                            groupSize > 0 && i > 0 && i % groupSize === 0
                        const isActive =
                            !displaySuccess &&
                            displayActive === i &&
                            (displayFocused || isStatic)
                        const filled = !!ch
                        // Caret on focused/static typing slot (idle empty used to look "done")
                        const showCaret =
                            isActive &&
                            !filled &&
                            !displayError &&
                            (isStatic || displayFocused)

                        return (
                            <div
                                key={`wrap-${i}`}
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap,
                                }}
                            >
                                {showSep ? (
                                    <span
                                        aria-hidden
                                        style={{
                                            width: Math.max(6, gap * 0.55),
                                            height: 2,
                                            borderRadius: 1,
                                            background:
                                                "rgba(255,248,240,0.22)",
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : null}
                                <motion.div
                                    initial={
                                        freezeMotion
                                            ? false
                                            : { opacity: 0, y: 10 }
                                    }
                                    animate={{
                                        opacity: entered || isStatic ? 1 : 0,
                                        y:
                                            entered || isStatic
                                                ? isActive
                                                    ? freezeMotion
                                                        ? 0
                                                        : -2
                                                    : 0
                                                : 10,
                                        scale:
                                            isActive && !freezeMotion
                                                ? 1.02
                                                : 1,
                                    }}
                                    transition={
                                        freezeMotion
                                            ? { duration: 0 }
                                            : !entered
                                              ? {
                                                    delay: i * 0.04,
                                                    type: "spring",
                                                    stiffness: 380,
                                                    damping: 28,
                                                }
                                              : focusMoveTransition
                                    }
                                    style={{
                                        position: "relative",
                                        width: slotW,
                                        height: slotH,
                                        borderRadius: radius,
                                        background: slotFill,
                                        boxSizing: "border-box",
                                        border: `1px solid ${
                                            displayError
                                                ? "color-mix(in srgb, #FF6B6B 75%, transparent)"
                                                : displaySuccess
                                                  ? `color-mix(in srgb, ${accent} 70%, transparent)`
                                                  : isActive
                                                    ? "transparent"
                                                    : slotBorder
                                        }`,
                                        boxShadow: slotShadow(
                                            shadowOn,
                                            accent,
                                            displaySuccess
                                        ),
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        color: textColor,
                                        fontVariantNumeric: "tabular-nums",
                                        ...font,
                                    }}
                                >
                                    {displaySuccess ? (
                                        <motion.div
                                            initial={
                                                freezeMotion
                                                    ? false
                                                    : { opacity: 0 }
                                            }
                                            animate={{ opacity: 1 }}
                                            transition={{
                                                duration: freezeMotion
                                                    ? 0
                                                    : Math.min(
                                                          0.36,
                                                          successGlow * 0.75
                                                      ),
                                                ease: EASE_OUT_BEZIER,
                                            }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                borderRadius: radius,
                                                background: `radial-gradient(circle at 50% 38%, color-mix(in srgb, ${accent} 28%, transparent) 0%, transparent 68%)`,
                                                pointerEvents: "none",
                                                zIndex: 0,
                                            }}
                                        />
                                    ) : null}

                                    <AnimatePresence mode="popLayout">
                                        {filled ? (
                                            <motion.span
                                                key={`ch-${i}-${ch}`}
                                                initial={
                                                    freezeMotion
                                                        ? false
                                                        : {
                                                              opacity: 0,
                                                              y: 6,
                                                              scale: digitPop,
                                                          }
                                                }
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                exit={
                                                    freezeMotion
                                                        ? { opacity: 0 }
                                                        : {
                                                              opacity: 0,
                                                              y: -4,
                                                              scale: 0.94,
                                                          }
                                                }
                                                transition={{
                                                    ...(freezeMotion
                                                        ? { duration: 0 }
                                                        : digitTransition),
                                                    delay:
                                                        digitStagger &&
                                                        !freezeMotion
                                                            ? i * 0.03
                                                            : 0,
                                                }}
                                                style={{
                                                    position: "relative",
                                                    zIndex: 2,
                                                    userSelect: "none",
                                                }}
                                            >
                                                {mask ? "•" : ch}
                                            </motion.span>
                                        ) : showCaret ? (
                                            isStatic ? (
                                                <span
                                                    key={`caret-${i}`}
                                                    aria-hidden
                                                    style={{
                                                        position: "relative",
                                                        zIndex: 2,
                                                        width: 1.5,
                                                        height: "1.15em",
                                                        borderRadius: 1,
                                                        background:
                                                            "var(--ac-accent, #9B8CFF)",
                                                        opacity: 1,
                                                    }}
                                                />
                                            ) : (
                                                <motion.span
                                                    key={`caret-${i}`}
                                                    className="ac-caret"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{
                                                        duration: 0.1,
                                                        ease: EASE_OUT_BEZIER,
                                                    }}
                                                    style={{
                                                        position: "relative",
                                                        zIndex: 2,
                                                    }}
                                                />
                                            )
                                        ) : null}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        )
                    })}
                </motion.div>
            </form>

            <div
                id={helperId}
                style={{
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                    lineHeight: 1.35,
                    textAlign: "center",
                    minHeight: "1.35em",
                    maxWidth: 320,
                    position: "relative",
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={statusText}
                        initial={freezeMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={freezeMotion ? undefined : { opacity: 0 }}
                        transition={{
                            duration: freezeMotion ? 0 : 0.16,
                            ease: EASE_OUT_BEZIER,
                        }}
                        style={{
                            display: "block",
                            color: displayError
                                ? "color-mix(in srgb, #FF8A8A 90%, #FFF8F0)"
                                : displaySuccess
                                  ? `color-mix(in srgb, ${accent} 85%, #FFF8F0)`
                                  : "rgba(255,248,240,0.42)",
                        }}
                    >
                        {statusText}
                    </motion.span>
                </AnimatePresence>
            </div>

            <div id={statusId} role="status" aria-live="polite" style={SR_ONLY}>
                {announce}
            </div>
        </div>
    )
}

AccessCode.displayName = "Access Code"

addPropertyControls(AccessCode, {
    content: {
        type: ControlType.Object,
        title: "Content",
        optional: false,
        icon: "object",
        controls: {
            length: {
                type: ControlType.Number,
                title: "Length",
                defaultValue: 6,
                min: 4,
                max: 8,
                step: 1,
                displayStepper: true,
                description: "Number of slots",
            },
            groupSize: {
                type: ControlType.Number,
                title: "Group",
                defaultValue: 3,
                min: 0,
                max: 4,
                step: 1,
                displayStepper: true,
                description: "Separator every N slots · 0 = none",
            },
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                defaultValue: "alphanumeric",
                options: ["alphanumeric", "numeric"],
                optionTitles: ["A–Z 0–9", "Digits"],
                displaySegmentedControl: true,
                description: "Accepted characters",
            },
            mask: {
                type: ControlType.Boolean,
                title: "Mask",
                defaultValue: false,
                enabledTitle: "Dots",
                disabledTitle: "Show",
                description: "Hide digits as dots",
            },
            expectedCode: {
                type: ControlType.String,
                title: "Expected",
                placeholder: "KERN42, ATELIER",
                displayTextArea: true,
                description:
                    "Valid codes (comma or newline). Empty = any full code unlocks",
            },
            remember: {
                type: ControlType.Boolean,
                title: "Remember",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Keep unlocked in this browser (opt-in)",
            },
            storageKey: {
                type: ControlType.String,
                title: "Storage Key",
                defaultValue: "access",
                placeholder: "access",
                description: "Unique key if several gates share a site",
                hidden: (p) => p.remember === false,
            },
            clearOnFail: {
                type: ControlType.Boolean,
                title: "Clear Fail",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Empty slots after a wrong code",
            },
            helper: {
                type: ControlType.String,
                title: "Helper",
                defaultValue: "Enter your invite code",
                description: "Idle status under the slots · blank to hide",
            },
            errorLabel: {
                type: ControlType.String,
                title: "Error",
                defaultValue: "Invalid code",
                description: "Shown on mismatch",
            },
            successLabel: {
                type: ControlType.String,
                title: "Success",
                defaultValue: "Unlocked",
                description: "Shown after unlock",
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Access code",
                description: "Screen reader name only",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        optional: false,
        icon: "effect",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 28,
                step: 1,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 10,
                min: 4,
                max: 24,
                step: 1,
                unit: "px",
                description: "Space between slots",
            },
            slotWidth: {
                type: ControlType.Number,
                title: "Slot W",
                defaultValue: 48,
                min: 32,
                max: 72,
                step: 1,
                unit: "px",
            },
            slotHeight: {
                type: ControlType.Number,
                title: "Slot H",
                defaultValue: 56,
                min: 40,
                max: 80,
                step: 1,
                unit: "px",
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        optional: false,
        icon: "color",
        controls: {
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: DEFAULT_ACCENT,
                description: "BuiltByKern — focus ring + success glow",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFF8F0",
            },
            slotFill: {
                type: ControlType.Color,
                title: "Slot Fill",
                defaultValue: "#121214",
            },
            slotBorder: {
                type: ControlType.Color,
                title: "Slot Border",
                defaultValue: "rgba(255,248,240,0.12)",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "transparent",
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Semibold",
                    fontSize: "22px",
                    letterSpacing: "0.06em",
                    lineHeight: "1em",
                    textAlign: "center",
                },
            },
        },
    },
    action: {
        type: ControlType.Object,
        title: "Action",
        optional: false,
        icon: "object",
        controls: {
            link: {
                type: ControlType.Link,
                title: "Link",
                description: "Page or URL after unlock · wins over Section",
            },
            section: {
                type: ControlType.String,
                title: "Section",
                placeholder: "Pricing",
                description: "Layer name or HTML id · when Link is empty",
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Open Link in a new tab",
                hidden: (p) => !p.link,
            },
        },
    },
    onComplete: {
        type: ControlType.EventHandler,
        title: "On Complete",
        description: "Fires on unlock · before Link / Section",
    },
    onError: {
        type: ControlType.EventHandler,
        title: "On Error",
        description: "Fires when Expected is set and the code mismatches",
    },
    onChange: {
        type: ControlType.EventHandler,
        title: "On Change",
        description: "Fires whenever the code value changes",
    },
    preview: {
        description:
            "BuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
        type: ControlType.Object,
        title: "Preview",
        optional: false,
        icon: "interaction",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                defaultValue: "focused",
                options: ["idle", "focused", "filled", "error", "success"],
                optionTitles: [
                    "Idle",
                    "Focused",
                    "Filled",
                    "Error",
                    "Success",
                ],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                description: "Canvas only · Preview uses live input",
            },
        },
    },
})
