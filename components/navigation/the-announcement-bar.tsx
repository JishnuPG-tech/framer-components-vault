/**
 * Announcement Bar — Framer code component.
 * Ported from Arc (https://uiarc.dev/components/announcement-bar) by Elia Kuratli, MIT License.
 *
 * A slim bar for the top of a page. It can rotate several messages, each rising in from below while the bar springs to
 * the new height; rotation pauses on hover, focus, or a hidden tab, and Controls adds previous, next, and a pause ring.
 * Messages can carry a call to action and a live countdown. Dismissing collapses the height smoothly so the page below
 * eases up, and with a Remember ID the dismissal is kept in localStorage.
 */
import * as React from "react"
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
import type { CSSProperties } from "react"
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
    animate,
    motion,
    useIsPresent,
    useMotionValue,
    useReducedMotion,
    useTransform,
} from "framer-motion"
import type { Transition, Variants } from "framer-motion"

/** useLayoutEffect on the client, useEffect during server rendering (silences SSR warnings). */
const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

/* ------------------------------------------------------------------ Motion tokens (inlined from Arc) */

const motionTokens = {
    duration: {
        instant: 0.12,
        fast: 0.16,
        exit: 0.18,
        standard: 0.24,
        considered: 0.48,
    },
    ease: { enter: [0.16, 1, 0.3, 1], standard: [0.22, 1, 0.36, 1] },
    blur: { subtle: 2, soft: 4, text: 8 },
} as const

type Bezier = [number, number, number, number]
const enter = [...motionTokens.ease.enter] as Bezier
const standard = [...motionTokens.ease.standard] as Bezier
const physical = (visualDuration: number, bounce: number): Transition => {
    const root = (2 * Math.PI) / (visualDuration * 1.2)
    return {
        type: "spring",
        stiffness: root * root,
        damping: 2 * (1 - bounce) * root,
        mass: 1,
    }
}
const RISE = physical(0.46, 0),
    HEIGHT = physical(0.42, 0),
    COLLAPSE = physical(0.44, 0)

/** Next rises from below and leaves upward; previous runs the other way. */
const faceVariants: Variants = {
    hidden: (direction: number) => ({
        opacity: 0,
        y: `${direction * 70}%`,
        filter: `blur(${motionTokens.blur.soft}px)`,
    }),
    shown: {
        opacity: 1,
        y: "0%",
        filter: "blur(0px)",
        transition: {
            y: RISE,
            opacity: { duration: motionTokens.duration.standard, ease: enter },
            filter: { duration: motionTokens.duration.standard, ease: enter },
        },
    },
    gone: (direction: number) => ({
        opacity: 0,
        y: `${direction * -60}%`,
        filter: `blur(${motionTokens.blur.soft}px)`,
        transition: {
            y: RISE,
            opacity: { duration: motionTokens.duration.fast, ease: standard },
            filter: { duration: motionTokens.duration.fast, ease: standard },
        },
    }),
}
const fadeVariants: Variants = {
    hidden: { opacity: 0 },
    shown: {
        opacity: 1,
        transition: {
            duration: motionTokens.duration.standard,
            ease: standard,
        },
    },
    gone: {
        opacity: 0,
        transition: { duration: motionTokens.duration.instant, ease: standard },
    },
}

/* ------------------------------------------------------------------ Theme (resolved from Arc foundation.css) */

const LIGHT = {
    "--background": "oklch(100% 0 0)",
    "--surface-muted": "oklch(97.8% 0 0)",
    "--foreground": "oklch(15% 0 0)",
    "--text-secondary": "oklch(46% 0 0)",
    "--border": "oklch(93.5% 0 0)",
    "--accent-strong": "oklch(24% 0 0)",
}
const DARK = {
    "--background": "oklch(19% 0 0)",
    "--surface-muted": "oklch(26% 0 0)",
    "--foreground": "oklch(96% 0 0)",
    "--text-secondary": "oklch(77% 0 0)",
    "--border": "oklch(29% 0 0)",
    "--accent-strong": "oklch(91% 0 0)",
}
const SHARED = {
    "--space-2": ".5rem",
    "--space-3": ".75rem",
    "--duration-fast": "160ms",
    "--ease-standard": "cubic-bezier(.22,1,.36,1)",
}

/* ------------------------------------------------------------------ Styles */

const P = "arc-announcement-bar"
const CSS = `
.${P}-wrap { width: 100%; }
/* The outer section animates its height to zero on dismiss, so whatever sits below eases up with it. */
.${P}-collapse { overflow: hidden; container-type: inline-size; width: 100%; }
.${P}-collapse *, .${P}-collapse *::before, .${P}-collapse *::after { box-sizing: border-box; }

/* The side column mirrors the controls, so the message stays centered on the page rather than in the leftover space. */
.${P}-bar { --icon: 32px; --control-gap: 2px; --muted: var(--text-secondary); display: grid; grid-template-columns: calc(var(--controls, 0) * var(--icon) + max(var(--controls, 0) - 1, 0) * var(--control-gap)) minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); padding: 6px 8px 6px 16px; border-bottom: 1px solid var(--border); background: var(--_bg, var(--surface-muted)); color: var(--_fg, var(--foreground)); }
.${P}-bar[data-tone="inverted"] { --muted: color-mix(in oklab, var(--_fg, var(--background)) 66%, transparent); border-bottom-color: transparent; background: var(--_bg, var(--foreground)); color: var(--_fg, var(--background)); }
.${P}-bar[data-border="false"] { border-bottom-color: transparent; }

.${P}-side { min-width: 0; }
.${P}-viewport { position: relative; min-height: 32px; overflow: hidden; }

/* Faces overlap in place; the entering one reports its height and the viewport springs to it. */
.${P}-face { position: absolute; top: 0; right: 0; left: 0; display: flex; min-height: 32px; align-items: center; justify-content: center; }
.${P}-face[inert] { pointer-events: none; }
.${P}-message { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 2px 12px; margin: 0; padding: 6px 0; font-size: 1em; line-height: 1.4; text-align: center; text-wrap: balance; }
.${P}-text { min-width: 0; }

/* The countdown is one run of text: every cell shares the line box, so digits, colons, and the day mark sit on the message baseline. */
.${P}-countdown { display: inline-flex; align-items: baseline; gap: 6px; color: var(--muted); white-space: nowrap; }
.${P}-time { display: inline-flex; align-items: baseline; color: var(--_fg, var(--foreground)); font-variant-numeric: tabular-nums; font-weight: 500; line-height: inherit; }
.${P}-time[data-pending] { opacity: 0; }
.${P}-bar[data-tone="inverted"] .${P}-time { color: var(--_fg, var(--background)); }
.${P}-digit { position: relative; display: inline-block; overflow: hidden; overflow: clip; text-align: center; }
.${P}-digit-sizer { visibility: hidden; }
.${P}-digit-face { position: absolute; inset: 0; display: block; }
.${P}-unit { display: inline-flex; align-items: baseline; }
.${P}-unit-mark { margin-left: 1px; color: var(--muted); font-weight: 400; }
/* "case" lifts the colon to the middle of the figures, which it loses once the digits are split into cells. */
.${P}-sep { display: inline-block; padding-inline: 1px; color: var(--muted); font-feature-settings: "case"; font-weight: 400; }
.${P}-gap { display: inline-block; width: .4em; }

.${P}-cta { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; font: inherit; font-weight: 500; text-decoration: none; white-space: nowrap; -webkit-tap-highlight-color: transparent; }
.${P}-cta svg { transition: transform var(--duration-fast) var(--ease-standard); }

.${P}-controls { display: flex; align-items: center; gap: var(--control-gap); }
.${P}-icon, .${P}-ring { position: relative; display: grid; width: var(--icon); height: var(--icon); flex: none; place-items: center; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--muted); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.${P}-icon:active, .${P}-ring:active { background: color-mix(in oklab, currentColor 12%, transparent); color: inherit; }
.${P}-ring svg { width: 20px; height: 20px; overflow: visible; transform: rotate(-90deg); }
.${P}-ring-track { fill: none; stroke: currentColor; stroke-opacity: .22; stroke-width: 1.75; }
.${P}-ring-fill { fill: none; stroke: currentColor; stroke-linecap: round; stroke-width: 1.75; }
.${P}-ring-icon { position: absolute; inset: 0; display: grid; place-items: center; }
.${P}-ring-icon svg { width: 9px; height: 9px; transform: none; fill: currentColor; }
.${P}-collapse :is(button, a):focus:not(:focus-visible) { outline: none; }
.${P}-collapse :is(button, a):focus-visible { outline: 2px solid color-mix(in oklab, currentColor 60%, transparent); outline-offset: 2px; }

@media (hover: hover) and (pointer: fine) {
  .${P}-icon:hover, .${P}-ring:hover { background: color-mix(in oklab, currentColor 10%, transparent); }
  .${P}-bar .${P}-icon:hover, .${P}-bar .${P}-ring:hover { color: var(--_fg, var(--foreground)); }
  .${P}-bar[data-tone="inverted"] .${P}-icon:hover, .${P}-bar[data-tone="inverted"] .${P}-ring:hover { color: var(--_fg, var(--background)); }
  .${P}-cta:hover svg { transform: translateX(2px); }
}

/* Narrow bars drop the mirror column and read from the start edge. */
@container (max-width: 560px) {
  .${P}-bar { grid-template-columns: 0 minmax(0, 1fr) auto; gap: 0 var(--space-2); padding-left: 14px; }
  .${P}-face { justify-content: flex-start; }
  .${P}-message { justify-content: flex-start; column-gap: 10px; text-align: left; }
}

@media (prefers-reduced-motion: reduce) {
  .${P}-icon, .${P}-ring, .${P}-cta svg { transition: none; }
}
`

/* ------------------------------------------------------------------ Icons (inlined, lucide-style) */

function Svg({
    size,
    strokeWidth = 1.75,
    children,
}: {
    size: number
    strokeWidth?: number
    children: React.ReactNode
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    )
}
const ArrowRight = () => (
    <Svg size={14}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </Svg>
)
const ChevronUp = () => (
    <Svg size={16}>
        <path d="m18 15-6-6-6 6" />
    </Svg>
)
const ChevronDown = () => (
    <Svg size={16}>
        <path d="m6 9 6 6 6-6" />
    </Svg>
)
const XIcon = () => (
    <Svg size={16}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </Svg>
)
const Play = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5z" />
    </svg>
)
const Pause = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="3" width="5" height="18" rx="1" />
        <rect x="14" y="3" width="5" height="18" rx="1" />
    </svg>
)

/* ------------------------------------------------------------------ Countdown */

function parts(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000))
    return {
        d: Math.floor(total / 86400),
        h: Math.floor((total % 86400) / 3600),
        m: Math.floor((total % 3600) / 60),
        s: total % 60,
    }
}
const pad = (value: number) => String(value).padStart(2, "0")

/** Without a set date the countdown runs to the next local midnight, so the demo always ticks. */
function resolveTarget(to: string | undefined): number {
    if (to) {
        const t = new Date(to).getTime()
        if (Number.isFinite(t)) return t
    }
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    return midnight.getTime()
}

/**
 * One character cell. A changed digit drops in from above while the old one falls away, like a counter winding down.
 * The invisible sizer keeps the cell in the text flow, so it shares the baseline of the words around it.
 */
function Digit({ char, reduced }: { char: string; reduced: boolean }) {
    return (
        <span className={`${P}-digit`}>
            <span className={`${P}-digit-sizer`} aria-hidden="true">
                0
            </span>
            <AnimatePresence initial={false}>
                <motion.span
                    key={char}
                    className={`${P}-digit-face`}
                    initial={
                        reduced ? { opacity: 0 } : { y: "-70%", opacity: 0 }
                    }
                    animate={{ y: "0%", opacity: 1 }}
                    exit={reduced ? { opacity: 0 } : { y: "70%", opacity: 0 }}
                    transition={
                        reduced
                            ? { duration: motionTokens.duration.instant }
                            : {
                                  y: physical(0.32, 0),
                                  opacity: {
                                      duration: motionTokens.duration.fast,
                                      ease: standard,
                                  },
                              }
                    }
                >
                    {char}
                </motion.span>
            </AnimatePresence>
        </span>
    )
}

function Countdown({
    to,
    label,
    reduced,
    onEnd,
}: {
    to?: string
    label?: string
    reduced: boolean
    onEnd?: () => void
}) {
    const [target, setTarget] = useState<number | null>(null)
    const [now, setNow] = useState<number | null>(null)
    const ended = useRef(false)
    const endRef = useRef(onEnd)
    useEffect(() => {
        endRef.current = onEnd
    }, [onEnd])
    // The target is resolved on the client only, so a midnight fallback never mismatches between server and browser.
    useEffect(() => {
        ended.current = false
        setTarget(resolveTarget(to))
    }, [to])
    useEffect(() => {
        if (target === null) return
        let timer = 0
        const tick = () => {
            const current = Date.now()
            setNow(current)
            if (current >= target) {
                if (!ended.current) {
                    ended.current = true
                    endRef.current?.()
                }
                return
            }
            // Wake just after each whole second so digits change on the beat.
            timer = window.setTimeout(tick, 1000 - (current % 1000) + 8)
        }
        timer = window.setTimeout(tick, 0)
        return () => window.clearTimeout(timer)
    }, [target])
    const pending = now === null || target === null
    const { d, h, m, s } = parts(
        pending ? 0 : (target as number) - (now as number)
    )
    const spoken = pending
        ? ""
        : `${d ? `${d} days ` : ""}${h} hours ${m} minutes`
    const digits = (value: string, key: string) =>
        value
            .split("")
            .map((char, index) => (
                <Digit
                    key={`${key}${value.length - index}`}
                    char={pending ? "0" : char}
                    reduced={reduced}
                />
            ))
    return (
        <span className={`${P}-countdown`}>
            {label ? <span>{label}</span> : null}
            <span
                role="timer"
                aria-live="off"
                aria-label={spoken}
                className={`${P}-time`}
                data-pending={pending || undefined}
            >
                {d ? (
                    <>
                        <span className={`${P}-unit`}>
                            {digits(String(d), "d")}
                            <span
                                className={`${P}-unit-mark`}
                                aria-hidden="true"
                            >
                                d
                            </span>
                        </span>
                        <span className={`${P}-gap`} aria-hidden="true" />
                    </>
                ) : null}
                {digits(pad(h), "h")}
                <span className={`${P}-sep`} aria-hidden="true">
                    :
                </span>
                {digits(pad(m), "m")}
                <span className={`${P}-sep`} aria-hidden="true">
                    :
                </span>
                {digits(pad(s), "s")}
            </span>
        </span>
    )
}

/* ------------------------------------------------------------------ Face */

interface Message {
    message: string
    actionLabel?: string
    link?: string
    newTab?: boolean
    countdown?: boolean
    countdownLabel?: string
    countdownTo?: string
}

function Face({
    announcement,
    direction,
    reduced,
    position,
    total,
    onSize,
    onAction,
    onCountdownEnd,
}: {
    announcement: Message
    direction: number
    reduced: boolean
    position: number
    total: number
    onSize: (height: number) => void
    onAction?: () => void
    onCountdownEnd?: () => void
}) {
    const ref = useRef<HTMLDivElement>(null)
    const present = useIsPresent()
    useIsoLayoutEffect(() => {
        const node = ref.current
        if (!node || !present) return
        const report = () => onSize(node.offsetHeight)
        report()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(report)
        observer.observe(node)
        return () => observer.disconnect()
    }, [onSize, present])
    // React 18 has no `inert` prop, so it is set on the element directly.
    useIsoLayoutEffect(() => {
        const node = ref.current as
            | (HTMLDivElement & { inert?: boolean })
            | null
        if (node) node.inert = !present
    }, [present])
    const { actionLabel, link, newTab } = announcement
    const cta = actionLabel ? (
        link ? (
            <a
                className={`${P}-cta`}
                href={link}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
                onClick={() => onAction?.()}
            >
                {actionLabel}
                <ArrowRight />
            </a>
        ) : (
            <button
                type="button"
                className={`${P}-cta`}
                onClick={() => onAction?.()}
            >
                {actionLabel}
                <ArrowRight />
            </button>
        )
    ) : null
    return (
        <motion.div
            ref={ref}
            className={`${P}-face`}
            custom={direction}
            variants={reduced ? fadeVariants : faceVariants}
            initial="hidden"
            animate="shown"
            exit="gone"
            role={total > 1 ? "group" : undefined}
            aria-roledescription={total > 1 ? "slide" : undefined}
            aria-label={total > 1 ? `${position} of ${total}` : undefined}
        >
            <p className={`${P}-message`}>
                <span className={`${P}-text`}>{announcement.message}</span>
                {announcement.countdown ? (
                    <Countdown
                        to={announcement.countdownTo}
                        label={announcement.countdownLabel}
                        reduced={reduced}
                        onEnd={onCountdownEnd}
                    />
                ) : null}
                {cta}
            </p>
        </motion.div>
    )
}

const RING = 2 * Math.PI * 8
const storageKey = (id: string) => `arc-announcement:${id}`

/* ------------------------------------------------------------------ Component */

interface Props {
    messages: Message[]
    interval: number
    autoPlay: boolean
    controls: boolean
    dismissible: boolean
    tone: "neutral" | "inverted"
    theme: "Light" | "Dark"
    background?: string
    textColor?: string
    border: boolean
    rememberId: string
    label: string
    font: CSSProperties
    onDismiss?: () => void
    onAction?: () => void
    onCountdownEnd?: () => void
    onIndexChange?: () => void
    style?: CSSProperties
}

const DEFAULT_MESSAGES: Message[] = [
    {
        message: "Spring sale: 30% off every annual plan.",
        actionLabel: "Shop the sale",
        link: "",
        newTab: false,
        countdown: true,
        countdownLabel: "Ends in",
        countdownTo: "",
    },
    {
        message: "New: the component library now works in Framer.",
        actionLabel: "See what's new",
        link: "",
        newTab: false,
        countdown: false,
        countdownLabel: "",
        countdownTo: "",
    },
    {
        message: "Free shipping on orders over $50, worldwide.",
        actionLabel: "",
        link: "",
        newTab: false,
        countdown: false,
        countdownLabel: "",
        countdownTo: "",
    },
]

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function AnnouncementBar(props: Props) {
    const {
        messages: rawMessages = DEFAULT_MESSAGES,
        interval = 6,
        autoPlay = true,
        controls = true,
        dismissible = true,
        tone = "neutral",
        theme = "Light",
        background,
        textColor,
        border = true,
        rememberId = "",
        label = "Announcements",
        font,
        onDismiss,
        onAction,
        onCountdownEnd,
        onIndexChange,
        style,
    } = props
    const messages =
        rawMessages && rawMessages.length ? rawMessages : DEFAULT_MESSAGES
    const reduced = !!useReducedMotion()
    const uid = useId()
    const total = messages.length
    const intervalMs = Math.max(1, interval || 6) * 1000

    /* Open state: internal, and hidden at once when this id was dismissed before. */
    const [openInternal, setOpenInternal] = useState(true)
    const [remembered, setRemembered] = useState(false)
    useIsoLayoutEffect(() => {
        if (!rememberId) {
            setRemembered(false)
            return
        }
        let stored = false
        try {
            stored =
                window.localStorage.getItem(storageKey(rememberId)) ===
                "dismissed"
        } catch {
            /* Storage can be blocked. */
        }
        // Storage is only readable on the client; hide before paint so a dismissed bar never flashes.
        setRemembered(stored)
    }, [rememberId])
    const open = openInternal && !remembered

    const dismiss = () => {
        if (rememberId) {
            try {
                window.localStorage.setItem(storageKey(rememberId), "dismissed")
            } catch {
                /* Storage can be blocked. */
            }
        }
        setOpenInternal(false)
        onDismiss?.()
    }

    /* Rotation. */
    const [indexInternal, setIndexInternal] = useState(0)
    const current = total ? ((indexInternal % total) + total) % total : 0
    const [direction, setDirection] = useState(1)
    const go = useCallback(
        (step: number) => {
            if (total < 2) return
            const next = (((current + step) % total) + total) % total
            setDirection(step > 0 ? 1 : -1)
            setIndexInternal(next)
            onIndexChange?.()
        },
        [current, onIndexChange, total]
    )

    const [userPaused, setUserPaused] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    const [hidden, setHidden] = useState(false)
    useEffect(() => {
        const read = () => setHidden(document.visibilityState === "hidden")
        document.addEventListener("visibilitychange", read)
        return () => document.removeEventListener("visibilitychange", read)
    }, [])
    const rotating = autoPlay && !reduced && total > 1
    const running =
        rotating && open && !userPaused && !hovered && !focused && !hidden

    /* The ring is the clock: its progress runs to one, then advances. Pausing stops it where it is; resuming finishes the rest. */
    const progress = useMotionValue(0)
    const dash = useTransform(progress, (value: number) => RING * (1 - value))
    const goRef = useRef(go)
    useEffect(() => {
        goRef.current = go
    }, [go])
    useEffect(() => {
        progress.jump(0)
    }, [current, progress])
    useEffect(() => {
        if (!running) return
        let controls: { stop: () => void } | null = animate(progress, 1, {
            duration: (intervalMs / 1000) * (1 - progress.get()),
            ease: "linear",
            onComplete: () => {
                controls = null
                goRef.current(1)
            },
        })
        return () => controls?.stop()
    }, [running, current, intervalMs, progress])

    /* The viewport springs to the height of the current message, which can wrap on narrow screens. */
    const height = useMotionValue<number | "auto">("auto")
    const measured = useRef(0)
    const onSize = useCallback(
        (next: number) => {
            if (Math.abs(next - measured.current) < 0.5) return
            const first = measured.current === 0
            measured.current = next
            if (first || reduced) height.jump(next)
            else animate(height, next, HEIGHT as any)
        },
        [height, reduced]
    )

    const announcement = messages[current]
    const navigable = controls && total > 1
    const controlCount =
        (navigable ? 2 + (rotating ? 1 : 0) : 0) + (dismissible ? 1 : 0)

    const vars = {
        ...SHARED,
        ...(theme === "Dark" ? DARK : LIGHT),
        ...(background ? { "--_bg": background } : {}),
        ...(textColor
            ? {
                  "--_fg": textColor,
                  "--text-secondary": `color-mix(in oklab, ${textColor} 66%, transparent)`,
              }
            : {}),
    } as CSSProperties

    return (
        <div
            className={`${P}-wrap`}
            style={{
                fontSize: 14,
                letterSpacing: "-0.01em",
                ...font,
                ...vars,
                ...style,
            }}
        >
            <style>{CSS}</style>
            <AnimatePresence initial={false}>
                {open && announcement ? (
                    <motion.section
                        key="bar"
                        className={`${P}-collapse`}
                        aria-label={label}
                        aria-roledescription={
                            total > 1 ? "carousel" : undefined
                        }
                        initial={
                            reduced ? { opacity: 0 } : { height: 0, opacity: 0 }
                        }
                        animate={{ height: "auto", opacity: 1 }}
                        exit={
                            reduced
                                ? {
                                      opacity: 0,
                                      transition: {
                                          duration: motionTokens.duration.fast,
                                      },
                                  }
                                : {
                                      height: 0,
                                      opacity: 0,
                                      transition: {
                                          height: COLLAPSE,
                                          opacity: {
                                              duration:
                                                  motionTokens.duration.exit,
                                              ease: standard,
                                          },
                                      },
                                  }
                        }
                        transition={
                            reduced
                                ? { duration: motionTokens.duration.fast }
                                : {
                                      height: COLLAPSE,
                                      opacity: {
                                          duration:
                                              motionTokens.duration.standard,
                                          ease: enter,
                                      },
                                  }
                        }
                        onPointerEnter={(event) => {
                            if (event.pointerType === "mouse") setHovered(true)
                        }}
                        onPointerLeave={() => setHovered(false)}
                        onFocus={() => setFocused(true)}
                        onBlur={(event) => {
                            if (
                                !event.currentTarget.contains(
                                    event.relatedTarget as Node | null
                                )
                            )
                                setFocused(false)
                        }}
                    >
                        <div
                            className={`${P}-bar`}
                            data-tone={tone}
                            data-border={border ? "true" : "false"}
                            style={
                                { "--controls": controlCount } as CSSProperties
                            }
                        >
                            <div className={`${P}-side`} aria-hidden="true" />
                            <motion.div
                                className={`${P}-viewport`}
                                style={{ height }}
                                id={`${uid}-slides`}
                                aria-live={running ? "off" : "polite"}
                                aria-atomic="false"
                            >
                                <AnimatePresence
                                    initial={false}
                                    custom={direction}
                                >
                                    <Face
                                        key={current}
                                        announcement={announcement}
                                        direction={direction}
                                        reduced={reduced}
                                        position={current + 1}
                                        total={total}
                                        onSize={onSize}
                                        onAction={onAction}
                                        onCountdownEnd={onCountdownEnd}
                                    />
                                </AnimatePresence>
                            </motion.div>
                            <div className={`${P}-controls`}>
                                {navigable ? (
                                    <>
                                        <button
                                            type="button"
                                            className={`${P}-icon`}
                                            aria-label="Previous announcement"
                                            aria-controls={`${uid}-slides`}
                                            onClick={() => go(-1)}
                                        >
                                            <ChevronUp />
                                        </button>
                                        {rotating ? (
                                            <button
                                                type="button"
                                                className={`${P}-ring`}
                                                aria-label={
                                                    userPaused
                                                        ? "Resume announcements"
                                                        : "Pause announcements"
                                                }
                                                aria-pressed={userPaused}
                                                onClick={() =>
                                                    setUserPaused(
                                                        (paused) => !paused
                                                    )
                                                }
                                            >
                                                <svg
                                                    viewBox="0 0 20 20"
                                                    aria-hidden="true"
                                                >
                                                    <circle
                                                        cx="10"
                                                        cy="10"
                                                        r="8"
                                                        className={`${P}-ring-track`}
                                                    />
                                                    <motion.circle
                                                        cx="10"
                                                        cy="10"
                                                        r="8"
                                                        className={`${P}-ring-fill`}
                                                        strokeDasharray={RING}
                                                        style={{
                                                            strokeDashoffset:
                                                                dash,
                                                        }}
                                                    />
                                                </svg>
                                                <span
                                                    className={`${P}-ring-icon`}
                                                >
                                                    {userPaused ? (
                                                        <Play />
                                                    ) : (
                                                        <Pause />
                                                    )}
                                                </span>
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            className={`${P}-icon`}
                                            aria-label="Next announcement"
                                            aria-controls={`${uid}-slides`}
                                            onClick={() => go(1)}
                                        >
                                            <ChevronDown />
                                        </button>
                                    </>
                                ) : null}
                                {dismissible ? (
                                    <button
                                        type="button"
                                        className={`${P}-icon`}
                                        aria-label="Dismiss"
                                        onClick={dismiss}
                                    >
                                        <XIcon />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </motion.section>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

AnnouncementBar.displayName = "Announcement Bar"

addPropertyControls(AnnouncementBar, {
    messages: {
        type: ControlType.Array,
        title: "Messages",
        maxCount: 10,
        defaultValue: DEFAULT_MESSAGES,
        control: {
            type: ControlType.Object,
            controls: {
                message: {
                    type: ControlType.String,
                    title: "Message",
                    defaultValue: "Free shipping on orders over $50.",
                    displayTextArea: true,
                },
                actionLabel: {
                    type: ControlType.String,
                    title: "Action",
                    defaultValue: "",
                    placeholder: "Shop now",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
                countdown: {
                    type: ControlType.Boolean,
                    title: "Countdown",
                    defaultValue: false,
                },
                countdownLabel: {
                    type: ControlType.String,
                    title: "Count Label",
                    defaultValue: "Ends in",
                    hidden: (p: Message) => !p.countdown,
                },
                countdownTo: {
                    type: ControlType.Date,
                    title: "Ends At",
                    description:
                        "Leave empty to count down to the next local midnight.",
                    hidden: (p: Message) => !p.countdown,
                },
            },
        },
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 6,
        min: 1,
        max: 60,
        step: 0.5,
        unit: "s",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
    },
    controls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dismissible: {
        type: ControlType.Boolean,
        title: "Dismissible",
        defaultValue: true,
    },
    tone: {
        type: ControlType.Enum,
        title: "Tone",
        options: ["neutral", "inverted"],
        optionTitles: ["Neutral", "Inverted"],
        defaultValue: "neutral",
        displaySegmentedControl: true,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Light", "Dark"],
        defaultValue: "Light",
        displaySegmentedControl: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        optional: true,
    },
    textColor: { type: ControlType.Color, title: "Text Color", optional: true },
    border: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    rememberId: {
        type: ControlType.String,
        title: "Remember ID",
        defaultValue: "",
        placeholder: "spring-sale",
        description:
            "Remembers dismissal in localStorage. Change it to show a new campaign again.",
    },
    label: {
        type: ControlType.String,
        title: "A11y Label",
        defaultValue: "Announcements",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
    },
    onDismiss: { type: ControlType.EventHandler },
    onAction: { type: ControlType.EventHandler },
    onCountdownEnd: { type: ControlType.EventHandler },
    onIndexChange: { type: ControlType.EventHandler },
})
