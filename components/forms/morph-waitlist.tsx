/**
 * MorphWaitlist — Framer Code Component
 *
 * Starts as a single "Join waitlist" button (set the layer to Fit Content
 * in Framer). On click it measures the parent box and expands to fill it,
 * revealing the email input. It stays open. After a successful submit it
 * morphs into a confirmation and fires a short, blue confetti burst drawn
 * on an inline canvas (no packages). Below the mobile breakpoint the whole
 * control renders smaller.
 *
 * BACKEND
 * The only place that talks to a server is `submitWaitlist()` below.
 * Set "Endpoint URL" in the Framer property panel and the component POSTs
 *   { "email": "person@example.com" }   (+ "source" if you set one)
 * as JSON to that URL ("email" is the Field Name control, so it also fits
 * Formspree, Mailchimp-style forms, Make/n8n/Zapier webhooks, Supabase).
 * While "Preview Mode" is on, nothing is sent.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 480
 */

import * as React from "react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion } from "framer-motion"

/* ------------------------------------------------------------------ */
/* Types & defaults                                                    */
/* ------------------------------------------------------------------ */

type Status = "idle" | "loading" | "success" | "already" | "error"

const DEFAULTS = {
    content: {
        placeholder: "Email address",
        buttonText: "Join waitlist",
        loadingText: "Joining...",
        successText: "You're on the waitlist",
        alreadyText: "You're already on the waitlist",
        errorText: "Something went wrong. Try again.",
        invalidText: "Enter a valid email address",
        showArrow: true,
    },
    backend: {
        endpoint: "",
        apiKey: "",
        fieldName: "email",
        source: "",
        previewMode: true,
    },
    behavior: {
        startOpen: false,
        align: "center" as "left" | "center" | "right",
        confetti: true,
        resetAfter: 0,
    },
    sizing: {
        height: 56,
        radius: 12,
        buttonRadius: 20,
        openWidth: 0,
        mobileBreakpoint: 809,
        mobileHeight: 48,
        mobileButtonFontSize: 15,
        mobileFontSize: 14,
    },
    colors: {
        background: "#FFFFFF",
        text: "#111111",
        placeholder: "#8A8F98",
        border: "#E1E1E1",
        accent: "#002BBA",
        buttonText: "#FFFFFF",
        success: "#002BBA",
        error: "#D92D20",
    },
    typography: {
        fontSize: 15,
        buttonFontSize: 17,
        fontWeight: 500,
    },
}

type Defaults = typeof DEFAULTS

interface Props {
    content?: Partial<Defaults["content"]>
    backend?: Partial<Defaults["backend"]>
    behavior?: Partial<Defaults["behavior"]>
    sizing?: Partial<Defaults["sizing"]>
    colors?: Partial<Defaults["colors"]>
    typography?: Partial<Defaults["typography"]>
    font?: { fontFamily?: string }
    style?: React.CSSProperties
}

const FONT_FALLBACK =
    '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const INSTANT = { duration: 0 } as const

function withDefaults<T extends object>(defaults: T, value?: Partial<T>): T {
    const out = { ...defaults }
    if (value) {
        for (const key of Object.keys(value) as (keyof T)[]) {
            const v = value[key]
            if (v !== undefined && v !== null) out[key] = v as T[keyof T]
        }
    }
    return out
}

/* ------------------------------------------------------------------ */
/* Email validation                                                    */
/* ------------------------------------------------------------------ */

/** Trims, lowercases and checks basic structure. Returns null if invalid. */
export function normalizeEmail(raw: string): string | null {
    const email = String(raw || "")
        .trim()
        .toLowerCase()
    if (!email || email.length > 254) return null
    // Intentionally permissive: something@something.tld
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    return ok ? email : null
}

/* ------------------------------------------------------------------ */
/* Backend — the ONLY place that sends a request                       */
/* ------------------------------------------------------------------ */

export type SubmitResult = "success" | "already" | "error"

interface SubmitOptions {
    endpoint: string
    apiKey?: string
    fieldName?: string
    source?: string
    previewMode: boolean
}

export async function submitWaitlist(
    email: string,
    options: SubmitOptions
): Promise<SubmitResult> {
    const endpoint = String(options.endpoint || "").trim()

    // PREVIEW MODE: simulate a request so the success animation can be
    // demonstrated on the Framer canvas / in Preview. No network request.
    // Turn "Preview Mode" off in the property panel before launch.
    if (options.previewMode || !endpoint) {
        await new Promise((r) => setTimeout(r, 900))
        return "success"
    }

    const field = String(options.fieldName || "email").trim() || "email"
    const body: Record<string, string> = { [field]: email }
    if (options.source) body.source = options.source

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    }
    // Optional key — sent in the two headers most services expect.
    // Works for Supabase REST (anon key with an insert-only RLS policy),
    // for edge functions, and for any endpoint that reads a Bearer token.
    if (options.apiKey) {
        headers["apikey"] = options.apiKey
        headers["Authorization"] = `Bearer ${options.apiKey}`
        headers["Prefer"] = "return=minimal"
    }

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        })

        if (res.ok) return "success"

        // 409 (or a Postgres unique-violation) means the email already exists.
        if (res.status === 409) return "already"
        const text = await res.text().catch(() => "")
        if (/23505|already|duplicate|exists/i.test(text)) return "already"
        return "error"
    } catch {
        return "error"
    }
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function ArrowIcon() {
    return (
        <svg
            className="lbw-arrow"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M3 8h9.5M8.5 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function Spinner() {
    return (
        <svg
            className="lbw-spinner"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="1.8"
            />
            <path
                d="M14 8a6 6 0 0 0-6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    )
}

function CheckIcon({ isStatic }: { isStatic?: boolean }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="10" cy="10" r="10" fill="currentColor" />
            <motion.path
                d="M6 10.3l2.7 2.7L14.2 7.5"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={isStatic ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={
                    isStatic
                        ? INSTANT
                        : { duration: 0.35, delay: 0.15, ease: EASE }
                }
            />
        </svg>
    )
}

/* ------------------------------------------------------------------ */
/* Confetti (inline canvas, no dependencies)                           */
/* ------------------------------------------------------------------ */

const CONFETTI_PAD = 160

function mixHex(hex: string, amount: number, target = "#ffffff"): string {
    const h = (s: string) => {
        const m = s.replace("#", "")
        const v =
            m.length === 3
                ? m
                      .split("")
                      .map((c) => c + c)
                      .join("")
                : m
        return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) || 0)
    }
    const a = h(hex)
    const b = h(target)
    const c = a.map((x, i) => Math.round(x + (b[i] - x) * amount))
    return `rgb(${c[0]},${c[1]},${c[2]})`
}

function fireConfetti(
    canvas: HTMLCanvasElement,
    origin: { x: number; y: number; w: number },
    accent: string
) {
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const palette = [
        accent,
        accent,
        mixHex(accent, 0.35),
        mixHex(accent, 0.6),
        mixHex(accent, 0.25, "#000000"),
        "#FFFFFF",
    ]
    const count = 90
    const parts = Array.from({ length: count }, (_, i) => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5
        const speed = 5 + Math.random() * 7
        return {
            x: origin.x + (Math.random() - 0.5) * origin.w * 0.9,
            y: origin.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            w: 5 + Math.random() * 5,
            h: 3 + Math.random() * 4,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.3,
            color: palette[i % palette.length],
            life: 1,
            decay: 0.008 + Math.random() * 0.008,
            circle: Math.random() < 0.25,
        }
    })

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
        const dt = Math.min(2, (now - last) / 16.67)
        last = now
        ctx.clearRect(0, 0, rect.width, rect.height)
        let alive = 0
        for (const p of parts) {
            if (p.life <= 0) continue
            alive++
            p.vy += 0.28 * dt
            p.vx *= 0.985
            p.vy *= 0.985
            p.x += p.vx * dt
            p.y += p.vy * dt
            p.rot += p.vr * dt
            p.life -= p.decay * dt
            ctx.save()
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4))
            ctx.translate(p.x, p.y)
            ctx.rotate(p.rot)
            ctx.fillStyle = p.color
            if (p.circle) {
                ctx.beginPath()
                ctx.arc(0, 0, p.h / 1.6, 0, Math.PI * 2)
                ctx.fill()
            } else {
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
            }
            ctx.restore()
        }
        if (alive > 0) raf = requestAnimationFrame(tick)
        else ctx.clearRect(0, 0, rect.width, rect.height)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function MorphWaitlist(props: Props) {
    const content = withDefaults(DEFAULTS.content, props.content)
    const backend = withDefaults(DEFAULTS.backend, props.backend)
    const behavior = withDefaults(DEFAULTS.behavior, props.behavior)
    const sizing = withDefaults(DEFAULTS.sizing, props.sizing)
    const colors = withDefaults(DEFAULTS.colors, props.colors)
    const typography = withDefaults(DEFAULTS.typography, props.typography)

    // Framer canvas / static export: no springs, no confetti, no transitions
    const isStatic = useIsStaticRenderer()
    const tr = <T,>(t: T): T | typeof INSTANT => (isStatic ? INSTANT : t)

    const [open, setOpen] = useState(behavior.startOpen)
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState<Status>("idle")
    const [message, setMessage] = useState("")
    const [focused, setFocused] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const fieldRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [collapsedWidth, setCollapsedWidth] = useState<number | null>(null)
    const mounted = useRef(true)
    const id = useId()

    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
        }
    }, [])

    useEffect(() => {
        setOpen(behavior.startOpen)
    }, [behavior.startOpen])

    // Disabling a focused input does not fire blur in Chrome, so clear it here
    useEffect(() => {
        if (!open) setFocused(false)
    }, [open])

    const busy = status === "loading"
    const done = status === "success" || status === "already"

    // Measure the button so the collapsed field is exactly as wide as it.
    // (Animating to "auto" is unreliable inside Framer's layout engine.)
    useEffect(() => {
        const el = buttonRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const measure = () => {
            const w = Math.ceil(el.getBoundingClientRect().width) + 2
            setCollapsedWidth((prev) => (prev === w ? prev : w))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [content.buttonText, content.showArrow, busy])

    // Focus the input once the field has opened
    useEffect(() => {
        if (!open || done) return
        const t = setTimeout(() => inputRef.current?.focus(), 180)
        return () => clearTimeout(t)
    }, [open, done])

    // Width the control expands to: the parent box of the Framer layer
    // (works with both Fit Content and Fill), capped by "Open Width".
    const [openWidth, setOpenWidth] = useState<number | null>(null)
    useEffect(() => {
        if (typeof window === "undefined") return
        const measure = () => {
            const root = rootRef.current
            if (!root) return
            const frame = root.parentElement
            const box = frame?.parentElement || frame
            let available = Infinity
            if (box) {
                const cs = getComputedStyle(box)
                available =
                    box.clientWidth -
                    (parseFloat(cs.paddingLeft) || 0) -
                    (parseFloat(cs.paddingRight) || 0)
            }
            const vw = document.documentElement.clientWidth - 32
            const cap =
                Number(sizing.openWidth) > 0
                    ? Number(sizing.openWidth)
                    : Infinity
            const w = Math.max(240, Math.floor(Math.min(available, vw, cap)))
            setOpenWidth((prev) => (prev === w ? prev : w))
        }
        measure()
        window.addEventListener("resize", measure)
        let ro: ResizeObserver | null = null
        const box = rootRef.current?.parentElement?.parentElement
        if (box && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            ro.observe(box)
        }
        return () => {
            window.removeEventListener("resize", measure)
            ro?.disconnect()
        }
    }, [sizing.openWidth])

    // Optional: return to the empty form after a few seconds
    useEffect(() => {
        const secs = Number(behavior.resetAfter) || 0
        if (!done || secs <= 0) return
        const t = setTimeout(() => {
            if (!mounted.current) return
            setStatus("idle")
            setMessage("")
            setEmail("")
            if (!behavior.startOpen) setOpen(false)
        }, secs * 1000)
        return () => clearTimeout(t)
    }, [done, behavior.resetAfter, behavior.startOpen])

    // Confetti on success
    useEffect(() => {
        if (status !== "success" || !behavior.confetti || isStatic) return
        if (typeof window === "undefined") return
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
            return
        const canvas = canvasRef.current
        const field = fieldRef.current
        if (!canvas || !field) return
        const fr = field.getBoundingClientRect()
        const cr = canvas.getBoundingClientRect()
        const t = setTimeout(() => {
            fireConfetti(
                canvas,
                {
                    x: fr.left - cr.left + fr.width / 2,
                    y: fr.top - cr.top + fr.height / 2,
                    w: fr.width,
                },
                colors.accent
            )
        }, 120)
        return () => clearTimeout(t)
    }, [status, behavior.confetti, colors.accent, isStatic])

    const submit = async () => {
        if (busy || done) return
        const clean = normalizeEmail(email)
        if (!clean) {
            setStatus("error")
            setMessage(content.invalidText)
            inputRef.current?.focus()
            return
        }
        setStatus("loading")
        setMessage("")

        const result = await submitWaitlist(clean, {
            endpoint: backend.endpoint,
            apiKey: backend.apiKey,
            fieldName: backend.fieldName,
            source: backend.source,
            previewMode: backend.previewMode,
        })
        if (!mounted.current) return

        if (result === "success") setStatus("success")
        else if (result === "already") setStatus("already")
        else {
            setStatus("error")
            setMessage(content.errorText)
        }
    }

    const onButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!open) {
            e.preventDefault()
            setOpen(true)
        }
        // when open, the form's onSubmit handles it
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            submit()
        }
    }

    const height = Math.max(40, Number(sizing.height) || 54)
    const radius = Math.max(0, Number(sizing.radius) || 0)
    const fontFamily = props.font?.fontFamily
        ? `${props.font.fontFamily}, ${FONT_FALLBACK}`
        : FONT_FALLBACK
    const isError = status === "error"
    const borderColor = isError
        ? colors.error
        : done
          ? colors.success
          : focused
            ? colors.accent
            : open
              ? colors.border
              : colors.accent

    const cssVars = {
        "--lbw-h-base": `${height}px`,
        "--lbw-r": `${radius}px`,
        "--lbw-btn-r": `${Math.max(0, Number(sizing.buttonRadius) || 0)}px`,
        "--lbw-btn-fs-base": `${typography.buttonFontSize}px`,
        "--lbw-bg": colors.background,
        "--lbw-text": colors.text,
        "--lbw-ph": colors.placeholder,
        "--lbw-border": colors.border,
        "--lbw-accent": colors.accent,
        "--lbw-btn-text": colors.buttonText,
        "--lbw-success": colors.success,
        "--lbw-error": colors.error,
        "--lbw-fs": `${typography.fontSize}px`,
        "--lbw-fw": typography.fontWeight,
        "--lbw-font": fontFamily,
        "--lbw-pad": `${CONFETTI_PAD}px`,
        "--lbw-h-m": `${Math.max(36, Number(sizing.mobileHeight) || 48)}px`,
        "--lbw-btn-fs-m": `${sizing.mobileButtonFontSize}px`,
        "--lbw-fs-m": `${sizing.mobileFontSize}px`,
        marginLeft: behavior.align === "left" ? 0 : "auto",
        marginRight: behavior.align === "right" ? 0 : "auto",
    } as React.CSSProperties

    const rootWidth: number | string = open
        ? (openWidth ?? "100%")
        : (collapsedWidth ?? "fit-content")
    const css = useMemo(
        () => buildCSS(Math.max(0, Number(sizing.mobileBreakpoint) || 0)),
        [sizing.mobileBreakpoint]
    )

    const successLabel =
        status === "already" ? content.alreadyText : content.successText

    return (
        <motion.div
            ref={rootRef}
            className={`lbw-root${open ? " is-open" : ""}`}
            style={{ ...cssVars, ...props.style }}
            initial={false}
            animate={{ width: rootWidth }}
            transition={tr({
                type: "spring",
                stiffness: 240,
                damping: 30,
                mass: 0.9,
            })}
        >
            <style>{css}</style>

            <canvas
                ref={canvasRef}
                className="lbw-confetti"
                aria-hidden="true"
            />

            <motion.div
                ref={fieldRef}
                className={`lbw-field${open ? " is-open" : " is-collapsed"}${done ? " is-done" : ""}${focused ? " is-focused" : ""}${isError ? " is-error" : ""}`}
                initial={false}
                animate={{
                    borderColor: open ? borderColor : "rgba(0,0,0,0)",
                    backgroundColor: done
                        ? `color-mix(in srgb, ${colors.success} 5%, ${colors.background})`
                        : open
                          ? colors.background
                          : "rgba(255,255,255,0)",
                }}
                transition={tr({ duration: 0.28, ease: EASE })}
                role={done ? "status" : undefined}
                aria-live="polite"
            >
                <AnimatePresence initial={false} mode="popLayout">
                    {!done ? (
                        <motion.form
                            key="form"
                            className="lbw-form"
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{
                                opacity: 0,
                                scale: 0.985,
                                filter: "blur(4px)",
                            }}
                            transition={tr({ duration: 0.26, ease: EASE })}
                            onSubmit={(e) => {
                                e.preventDefault()
                                if (open) submit()
                            }}
                            noValidate
                        >
                            <label className="lbw-sr" htmlFor={id}>
                                {content.placeholder}
                            </label>
                            <motion.input
                                ref={inputRef}
                                id={id}
                                className="lbw-input"
                                type="email"
                                name="email"
                                inputMode="email"
                                autoComplete="email"
                                autoCapitalize="off"
                                autoCorrect="off"
                                spellCheck={false}
                                placeholder={content.placeholder}
                                value={email}
                                disabled={busy || !open}
                                tabIndex={open ? 0 : -1}
                                aria-hidden={!open}
                                initial={false}
                                animate={{ opacity: open ? 1 : 0 }}
                                transition={tr({
                                    duration: 0.22,
                                    delay: open ? 0.12 : 0,
                                    ease: EASE,
                                })}
                                aria-invalid={isError || undefined}
                                aria-describedby={
                                    isError && message ? `${id}-msg` : undefined
                                }
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    if (isError) {
                                        setStatus("idle")
                                        setMessage("")
                                    }
                                }}
                                onKeyDown={onKeyDown}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                            />
                            <button
                                ref={buttonRef}
                                type={open ? "submit" : "button"}
                                className="lbw-button"
                                disabled={busy}
                                aria-busy={busy || undefined}
                                aria-expanded={open}
                                onClick={onButtonClick}
                            >
                                <span className="lbw-button-inner">
                                    <AnimatePresence
                                        initial={false}
                                        mode="popLayout"
                                    >
                                        <motion.span
                                            key={busy ? "loading" : "idle"}
                                            className="lbw-button-label"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={tr({
                                                duration: 0.18,
                                                ease: EASE,
                                            })}
                                        >
                                            {busy ? (
                                                <>
                                                    <Spinner />
                                                    {content.loadingText}
                                                </>
                                            ) : (
                                                <>
                                                    {content.buttonText}
                                                    {content.showArrow ? (
                                                        <ArrowIcon />
                                                    ) : null}
                                                </>
                                            )}
                                        </motion.span>
                                    </AnimatePresence>
                                </span>
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="success"
                            className="lbw-success"
                            initial={{
                                opacity: 0,
                                scale: 0.97,
                                filter: "blur(4px)",
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                filter: "blur(0px)",
                            }}
                            exit={{ opacity: 0, filter: "blur(4px)" }}
                            transition={tr({
                                duration: 0.32,
                                ease: EASE,
                                delay: 0.05,
                            })}
                        >
                            <motion.span
                                className="lbw-check"
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={tr({
                                    type: "spring",
                                    stiffness: 420,
                                    damping: 26,
                                    delay: 0.08,
                                })}
                            >
                                <CheckIcon isStatic={isStatic} />
                            </motion.span>
                            <span className="lbw-success-text">
                                {successLabel}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Inline message. Absolutely positioned so the field never shifts. */}
            <AnimatePresence>
                {isError && message ? (
                    <motion.p
                        key="msg"
                        id={`${id}-msg`}
                        className="lbw-message"
                        role="alert"
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={tr({ duration: 0.18, ease: EASE })}
                    >
                        {message}
                    </motion.p>
                ) : null}
            </AnimatePresence>
        </motion.div>
    )
}

MorphWaitlist.displayName = "Morph Waitlist"

/* ------------------------------------------------------------------ */
/* Styles (scoped via lbw- prefix)                                     */
/* ------------------------------------------------------------------ */

const buildCSS = (mobileBreakpoint: number) => `
.lbw-root {
  --lbw-h: var(--lbw-h-base); --lbw-btn-fs: var(--lbw-btn-fs-base);
  position: relative; display: flex; max-width: 100%; box-sizing: border-box;
  font-family: var(--lbw-font); font-size: var(--lbw-fs); font-weight: var(--lbw-fw);
  color: var(--lbw-text); container-type: inline-size; overflow: visible;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}
.lbw-root *, .lbw-root *::before, .lbw-root *::after { box-sizing: border-box; }
.lbw-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.lbw-confetti {
  position: absolute; left: calc(-1 * var(--lbw-pad)); top: calc(-1 * var(--lbw-pad));
  width: calc(100% + 2 * var(--lbw-pad)); height: calc(100% + 2 * var(--lbw-pad));
  pointer-events: none; z-index: 5;
}

.lbw-field {
  position: relative; width: 100%; height: var(--lbw-h); overflow: hidden;
  border: 1px solid var(--lbw-border); border-radius: var(--lbw-r);
  background-color: var(--lbw-bg); z-index: 1;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 6px 20px -14px rgba(16, 24, 40, 0.16);
  transition: box-shadow 0.2s ease;
}
.lbw-field:hover:not(.is-done) {
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05), 0 10px 26px -14px rgba(16, 24, 40, 0.22);
}
.lbw-field.is-collapsed {
  border-color: transparent; background: transparent; box-shadow: none;
  border-radius: var(--lbw-btn-r); overflow: visible;
}
.lbw-field.is-collapsed:hover, .lbw-field.is-collapsed.is-focused,
.lbw-field.is-collapsed.is-error.is-focused { box-shadow: none; }
.lbw-field.is-focused {
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04),
    0 0 0 4px color-mix(in srgb, var(--lbw-accent) 12%, transparent);
}
.lbw-field.is-error.is-focused {
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04),
    0 0 0 4px color-mix(in srgb, var(--lbw-error) 12%, transparent);
}

.lbw-form {
  display: flex; align-items: center; height: 100%; width: 100%;
  padding: 5px; gap: 6px; margin: 0;
}
.lbw-field.is-collapsed .lbw-form { padding: 0; gap: 0; justify-content: center; }
.lbw-input {
  flex: 1 1 auto; min-width: 0; height: 100%; margin: 0; padding: 0 12px 0 13px;
  border: 0; outline: none; background: transparent; appearance: none;
  font: inherit; color: var(--lbw-text); font-weight: 400; letter-spacing: -0.005em;
}
.lbw-field.is-collapsed .lbw-input { flex: 0 0 0; width: 0; padding: 0; pointer-events: none; }
.lbw-input::placeholder { color: var(--lbw-ph); opacity: 1; }
.lbw-input:disabled { color: var(--lbw-ph); }

.lbw-button {
  flex: none; display: inline-flex; align-items: center; justify-content: center;
  height: 100%; margin: 0; padding: 0 16px 0 18px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: max(2px, calc(var(--lbw-r) - 5px));
  background-color: var(--lbw-accent);
  background-image: linear-gradient(180deg, color-mix(in srgb, var(--lbw-accent) 62%, #fff) 0%, var(--lbw-accent) 72%);
  color: var(--lbw-btn-text); font: inherit; font-weight: 500; white-space: nowrap;
  cursor: pointer; appearance: none; -webkit-appearance: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.26), 0 1px 2px rgba(16,24,40,0.08);
  transition: filter 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease,
    border-radius 0.3s ease, padding 0.3s ease, font-size 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}
.lbw-field.is-collapsed .lbw-button {
  border-radius: var(--lbw-btn-r); padding: 0 26px 0 30px; font-size: var(--lbw-btn-fs);
  border-color: rgba(0, 0, 0, 0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 1px 2px rgba(16,24,40,0.1),
    0 8px 20px -10px color-mix(in srgb, var(--lbw-accent) 55%, transparent);
}
.lbw-button:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.26), 0 1px 2px rgba(16,24,40,0.08),
    0 6px 14px -8px color-mix(in srgb, var(--lbw-accent) 70%, transparent);
}
.lbw-field.is-collapsed .lbw-button:hover:not(:disabled) {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 2px 4px rgba(16,24,40,0.1),
    0 12px 24px -10px color-mix(in srgb, var(--lbw-accent) 65%, transparent);
  transform: translateY(-1px);
}
.lbw-button:hover:not(:disabled) .lbw-arrow { transform: translateX(2px); }
.lbw-button:active:not(:disabled) { filter: brightness(0.97); transform: scale(0.99); }
.lbw-button:disabled { cursor: default; opacity: 0.9; }
.lbw-button:focus-visible { outline: 2px solid var(--lbw-accent); outline-offset: 2px; }
.lbw-button-inner { display: inline-grid; place-items: center; }
.lbw-button-label {
  display: inline-flex; align-items: center; gap: 8px; line-height: 1;
}
.lbw-arrow { transition: transform 0.18s ease; }
.lbw-spinner { animation: lbw-spin 0.8s linear infinite; }
@keyframes lbw-spin { to { transform: rotate(360deg); } }

.lbw-success {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 0 16px; color: var(--lbw-success); font-weight: 500;
}
.lbw-check { display: inline-flex; line-height: 0; color: var(--lbw-success); }
.lbw-success-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.lbw-message {
  position: absolute; top: calc(100% + 8px); left: 14px; right: 0; margin: 0;
  font-size: 13px; font-weight: 500; line-height: 1.3; color: var(--lbw-error);
  pointer-events: none;
}

/* Compact widths: tighter padding, smaller text */
@container (max-width: 400px) {
  .lbw-root { font-size: max(13px, calc(var(--lbw-fs) - 1px)); }
  .lbw-form { padding: 4px; gap: 4px; }
  .lbw-input { padding: 0 8px 0 11px; }
  .lbw-field.is-open .lbw-button { padding: 0 12px 0 14px; }
}
@container (max-width: 320px) {
  .lbw-field.is-open .lbw-button { padding: 0 12px; }
  .lbw-button-label { gap: 6px; }
}

/* Mobile breakpoint: smaller control */
@media (max-width: ${mobileBreakpoint}px) {
  .lbw-root { --lbw-h: var(--lbw-h-m); --lbw-btn-fs: var(--lbw-btn-fs-m); font-size: var(--lbw-fs-m); }
  .lbw-field.is-collapsed .lbw-button { padding: 0 20px 0 24px; }
  .lbw-field.is-open .lbw-button { padding: 0 12px 0 14px; }
  .lbw-form { padding: 4px; gap: 4px; }
  .lbw-input { padding: 0 8px 0 11px; }
  .lbw-success { gap: 8px; }
  .lbw-message { font-size: 12px; left: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .lbw-root * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
`

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(MorphWaitlist, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            placeholder: {
                type: ControlType.String,
                title: "Placeholder",
                defaultValue: DEFAULTS.content.placeholder,
            },
            buttonText: {
                type: ControlType.String,
                title: "Button",
                defaultValue: DEFAULTS.content.buttonText,
            },
            showArrow: {
                type: ControlType.Boolean,
                title: "Arrow",
                defaultValue: DEFAULTS.content.showArrow,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            loadingText: {
                type: ControlType.String,
                title: "Loading",
                defaultValue: DEFAULTS.content.loadingText,
            },
            successText: {
                type: ControlType.String,
                title: "Success",
                defaultValue: DEFAULTS.content.successText,
            },
            alreadyText: {
                type: ControlType.String,
                title: "Already Joined",
                defaultValue: DEFAULTS.content.alreadyText,
            },
            errorText: {
                type: ControlType.String,
                title: "Error",
                defaultValue: DEFAULTS.content.errorText,
            },
            invalidText: {
                type: ControlType.String,
                title: "Invalid Email",
                defaultValue: DEFAULTS.content.invalidText,
            },
        },
    },
    backend: {
        type: ControlType.Object,
        title: "Backend",
        controls: {
            previewMode: {
                type: ControlType.Boolean,
                title: "Preview Mode",
                defaultValue: DEFAULTS.backend.previewMode,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "On: simulates success, sends nothing. Turn off before launch.",
            },
            endpoint: {
                type: ControlType.String,
                title: "Endpoint URL",
                defaultValue: DEFAULTS.backend.endpoint,
                placeholder: "https://…/waitlist",
                description: "Receives POST { email } as JSON.",
            },
            apiKey: {
                type: ControlType.String,
                title: "API Key",
                defaultValue: DEFAULTS.backend.apiKey,
                placeholder: "optional",
                description:
                    "Optional. Sent as apikey + Bearer header (e.g. Supabase anon key).",
            },
            fieldName: {
                type: ControlType.String,
                title: "Field Name",
                defaultValue: DEFAULTS.backend.fieldName,
                description: "JSON key for the address (default: email).",
            },
            source: {
                type: ControlType.String,
                title: "Source Tag",
                defaultValue: DEFAULTS.backend.source,
                placeholder: "optional, e.g. hero",
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            startOpen: {
                type: ControlType.Boolean,
                title: "Start",
                defaultValue: DEFAULTS.behavior.startOpen,
                enabledTitle: "Open",
                disabledTitle: "Button",
                description:
                    "Button: only the button shows, click expands the field.",
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: DEFAULTS.behavior.align,
                displaySegmentedControl: true,
                description: "Position of the closed button inside its box.",
            },
            confetti: {
                type: ControlType.Boolean,
                title: "Confetti",
                defaultValue: DEFAULTS.behavior.confetti,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            resetAfter: {
                type: ControlType.Number,
                title: "Reset After",
                defaultValue: DEFAULTS.behavior.resetAfter,
                min: 0,
                max: 60,
                step: 1,
                unit: "s",
                description: "0 = stay on the success state.",
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            fontSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: DEFAULTS.typography.fontSize,
                min: 12,
                max: 20,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            buttonFontSize: {
                type: ControlType.Number,
                title: "Button Size",
                defaultValue: DEFAULTS.typography.buttonFontSize,
                min: 12,
                max: 24,
                step: 1,
                unit: "px",
                displayStepper: true,
                description: "Text size of the closed button.",
            },
            fontWeight: {
                type: ControlType.Enum,
                title: "Weight",
                options: [400, 500, 600],
                optionTitles: ["Regular", "Medium", "Semibold"],
                defaultValue: DEFAULTS.typography.fontWeight,
            },
        },
    },
    sizing: {
        type: ControlType.Object,
        title: "Sizing",
        controls: {
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: DEFAULTS.sizing.height,
                min: 40,
                max: 72,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Field Radius",
                defaultValue: DEFAULTS.sizing.radius,
                min: 0,
                max: 36,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            buttonRadius: {
                type: ControlType.Number,
                title: "Button Radius",
                defaultValue: DEFAULTS.sizing.buttonRadius,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                displayStepper: true,
                description: "Radius of the closed button.",
            },
            openWidth: {
                type: ControlType.Number,
                title: "Open Width",
                defaultValue: DEFAULTS.sizing.openWidth,
                min: 0,
                max: 1200,
                step: 10,
                unit: "px",
                description: "0 = fill the parent box when opened.",
            },
            mobileBreakpoint: {
                type: ControlType.Number,
                title: "Mobile Below",
                defaultValue: DEFAULTS.sizing.mobileBreakpoint,
                min: 320,
                max: 1200,
                step: 1,
                unit: "px",
                description:
                    "Viewport width under which the mobile size applies.",
            },
            mobileHeight: {
                type: ControlType.Number,
                title: "Mobile Height",
                defaultValue: DEFAULTS.sizing.mobileHeight,
                min: 36,
                max: 64,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            mobileButtonFontSize: {
                type: ControlType.Number,
                title: "Mobile Button",
                defaultValue: DEFAULTS.sizing.mobileButtonFontSize,
                min: 12,
                max: 20,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            mobileFontSize: {
                type: ControlType.Number,
                title: "Mobile Text",
                defaultValue: DEFAULTS.sizing.mobileFontSize,
                min: 12,
                max: 18,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULTS.colors.background,
            },
            text: {
                type: ControlType.Color,
                title: "Input Text",
                defaultValue: DEFAULTS.colors.text,
            },
            placeholder: {
                type: ControlType.Color,
                title: "Placeholder",
                defaultValue: DEFAULTS.colors.placeholder,
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: DEFAULTS.colors.border,
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: DEFAULTS.colors.accent,
            },
            buttonText: {
                type: ControlType.Color,
                title: "Button Text",
                defaultValue: DEFAULTS.colors.buttonText,
            },
            success: {
                type: ControlType.Color,
                title: "Success",
                defaultValue: DEFAULTS.colors.success,
            },
            error: {
                type: ControlType.Color,
                title: "Error",
                defaultValue: DEFAULTS.colors.error,
            },
        },
    },
})
