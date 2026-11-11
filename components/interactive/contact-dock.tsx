// @framerDisableUnlink
/**
 * Contact Dock — BuiltByKern Marketplace
 * Glass orb → hello sheet with up to 3 custom channels. Accent #6FD3FF.
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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
    type Ref,
} from "react"

const DEFAULT_ACCENT = "#6FD3FF"
const DEFAULT_GLASS = "rgba(12, 12, 14, 0.78)"
const DEFAULT_AVATAR =
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"

const DEFAULT_CONTENT = {
    greeting: "Hi there",
    name: "Alex Kern",
    role: "BuiltByKern",
    avatar: undefined as ResponsiveImage | undefined,
}

const DEFAULT_CHANNELS = [
    { label: "Book a call", href: "https://cal.com/", enabled: true, icon: undefined as ResponsiveImage | undefined },
    { label: "hello@builtbykern.com", href: "hello@builtbykern.com", enabled: true, icon: undefined as ResponsiveImage | undefined },
    { label: "Message", href: "", enabled: false, icon: undefined as ResponsiveImage | undefined },
]

type DockCorner = "bottom-right" | "bottom-left"

const DEFAULT_APPEARANCE: {
    accent: string
    glassTint: string
    blur: number
    position: DockCorner
    radius: number
    orbSize: number
    fixedDock: boolean
} = {
    accent: DEFAULT_ACCENT,
    glassTint: DEFAULT_GLASS,
    blur: 14,
    position: "bottom-right",
    radius: 50,
    orbSize: 60,
    fixedDock: true,
}

const DEFAULT_ICONS = {
    orb: undefined as ResponsiveImage | undefined,
    close: undefined as ResponsiveImage | undefined,
}

const DEFAULT_FONT: CSSProperties = {
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: "0",
    lineHeight: "20px",
}

/** Fluid Functionalism type roles (default ladder), inline for Framer. */
const TYPE = {
    greeting: { fontSize: 12, lineHeight: "16px", fontWeight: 400 as const }, // caption
    name: { fontSize: 16, lineHeight: "22px", fontWeight: 550 as const }, // title
    role: { fontSize: 11, lineHeight: "14px", fontWeight: 400 as const }, // micro
    row: { fontSize: 14, lineHeight: "20px", fontWeight: 550 as const }, // subtitle
    hint: { fontSize: 11, lineHeight: "14px", fontWeight: 400 as const }, // micro
}

const SHEET_MS = 0.18
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

/** Visually hidden; used only as aria-describedby target (avoids double-announce with the visible hint). */
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

type ResponsiveImage = { src?: string; srcSet?: string; alt?: string }

interface ChannelInput {
    label?: string
    href?: string
    enabled?: boolean
    icon?: ResponsiveImage
}

interface ContactDockProps {
    defaultOpen?: boolean
    content?: Partial<typeof DEFAULT_CONTENT> & { avatar?: ResponsiveImage }
    channels?: ChannelInput[]
    appearance?: Partial<typeof DEFAULT_APPEARANCE>
    /** Legacy: motion.startOpen still accepted for older instances. */
    motion?: { pulse?: boolean; startOpen?: boolean }
    icons?: Partial<typeof DEFAULT_ICONS>
    font?: CSSProperties
    style?: CSSProperties
}

/**
 * Resolve buyer input → navigable href.
 * Allowed only: https/http, mailto, tel, site-relative `/…`, `#…`,
 * bare email → mailto, bare phone → tel. Everything else is dropped.
 */
function resolveHref(raw: string): string | null {
    const v = raw.trim()
    if (!v) return null
    const lower = v.toLowerCase()
    if (/^(javascript|data|vbscript|file|sms|blob):/i.test(lower)) return null
    if (lower.startsWith("https://") || lower.startsWith("http://")) return v
    if (lower.startsWith("mailto:") || lower.startsWith("tel:")) return v
    if (lower.startsWith("/") || lower.startsWith("#")) return v
    // Protocol-relative //… rejected (ambiguous host)
    if (v.includes("@") && !/\s/.test(v) && !lower.includes("://")) return `mailto:${v}`
    const digits = v.replace(/[\s().-]/g, "")
    if (/^\+?\d{6,}$/.test(digits)) return `tel:${digits}`
    return null
}

function isExternalHref(href: string) {
    const lower = href.toLowerCase()
    return lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("//")
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n))
}

function initialsFromName(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const DOCK_CSS = `
.cd-channel {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  transition: background 160ms ease, border-color 160ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .cd-channel:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.16);
  }
}
.cd-channel:focus {
  outline: none;
}
.cd-channel:focus-visible {
  outline: 2px solid var(--cd-accent, #6FD3FF);
  outline-offset: 2px;
}
.cd-orb:focus {
  outline: none;
}
.cd-orb:focus-visible {
  outline: 2px solid var(--cd-accent, #6FD3FF);
  outline-offset: 3px;
}
.cd-orb {
  transition: box-shadow 160ms ease, border-color 160ms ease;
}
@media (hover: hover) and (pointer: fine) {
  .cd-orb:hover:not(:focus-visible) {
    border-color: color-mix(in srgb, var(--cd-accent, #6FD3FF) 70%, transparent);
    box-shadow:
      0 10px 28px rgba(0,0,0,0.4),
      0 0 28px color-mix(in srgb, var(--cd-accent, #6FD3FF) 40%, transparent),
      inset 0 1px 0 rgba(255,255,255,0.12);
  }
}
.cd-hint-ring {
  position: absolute;
  inset: -5px;
  border-radius: var(--cd-radius, 9999px);
  border: 1.5px solid color-mix(in srgb, var(--cd-accent, #6FD3FF) 55%, transparent);
  pointer-events: none;
  opacity: 0.7;
}
.cd-hint-label {
  position: absolute;
  right: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(12, 12, 14, 0.88);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.88);
  pointer-events: none;
}
`

function ChatIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M7 4.75h10A3.25 3.25 0 0 1 20.25 8v5.5A3.25 3.25 0 0 1 17 16.75h-3.15L9.6 19.6a.6.6 0 0 1-.97-.48v-2.37H7A3.25 3.25 0 0 1 3.75 13.5V8A3.25 3.25 0 0 1 7 4.75Z"
                stroke={color}
                strokeWidth="1.4"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            <path
                d="M8.35 9.35h7.3M8.35 12.45h4.85"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

function CloseIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

function CalendarIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M4.75 5.5v13A1.5 1.5 0 0 0 6.25 20H12V5.5H6.25A1.5 1.5 0 0 0 4.75 7Z"
                stroke={color}
                strokeWidth="1.4"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            <path
                d="M19.25 5.5v13A1.5 1.5 0 0 1 17.75 20H12V5.5h5.75A1.5 1.5 0 0 1 19.25 7Z"
                stroke={color}
                strokeWidth="1.4"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            <path d="M12 5.5v14.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <circle cx="16.15" cy="12.15" r="1.35" fill={color} />
        </svg>
    )
}

function MailIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="M4.6 7.25h14.8A1.4 1.4 0 0 1 20.8 8.65v7.7a1.4 1.4 0 0 1-1.4 1.4H4.6a1.4 1.4 0 0 1-1.4-1.4v-7.7a1.4 1.4 0 0 1 1.4-1.4Z"
                stroke={color}
                strokeWidth="1.4"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            <path
                d="M4.35 8.1 12 13.55 19.65 8.1"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            <circle cx="17.35" cy="14.85" r="1.15" fill={color} />
        </svg>
    )
}

function LinkIcon({ color, size }: { color: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9.6 14.4 14.4 9.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path
                d="M11.15 16.2a3.35 3.35 0 0 1-4.74-4.74l1.9-1.9a3.35 3.35 0 0 1 4.5-.2"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            <path
                d="M12.85 7.8a3.35 3.35 0 0 1 4.74 4.74l-1.9 1.9a3.35 3.35 0 0 1-4.5.2"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

function ChevronIcon({ color }: { color: string }) {
    return (
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
                d="m9.1 5.4 6.8 6.6-6.8 6.6"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

function SlotIcon({
    image,
    size,
    fallback,
}: {
    image?: ResponsiveImage
    size: number
    fallback: ReactNode
}) {
    if (image?.src) {
        return (
            <img
                src={image.src}
                srcSet={image.srcSet}
                alt=""
                width={size}
                height={size}
                draggable={false}
                style={{ width: size, height: size, objectFit: "contain", display: "block", pointerEvents: "none" }}
            />
        )
    }
    return <>{fallback}</>
}

function Avatar({
    src,
    alt,
    name,
    accent,
}: {
    src: string
    alt: string
    name: string
    accent: string
}) {
    const [loaded, setLoaded] = useState(false)
    const [failed, setFailed] = useState(false)
    const initials = initialsFromName(name)
    const showFallback = !loaded || failed

    return (
        <div
            style={{
                position: "relative",
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: 999,
                overflow: "hidden",
                border: `1px solid ${accent}44`,
                boxShadow: `0 0 22px ${accent}28`,
                background: `color-mix(in srgb, ${accent} 28%, #1a1a1e)`,
            }}
        >
            {showFallback ? (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        color: "rgba(255,255,255,0.92)",
                        fontSize: 14,
                        fontWeight: 550,
                        lineHeight: "20px",
                        letterSpacing: 0,
                    }}
                >
                    {initials}
                </div>
            ) : null}
            {!failed ? (
                <img
                    src={src}
                    alt={alt}
                    width={48}
                    height={48}
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    style={{
                        position: "relative",
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        display: "block",
                        opacity: loaded ? 1 : 0,
                    }}
                />
            ) : null}
        </div>
    )
}

function ChannelRow({
    href,
    label,
    icon,
    accent,
    font,
    rowRef,
}: {
    href: string
    label: string
    icon: ReactNode
    accent: string
    font: CSSProperties
    rowRef?: Ref<HTMLAnchorElement>
}) {
    return (
        <a
            ref={rowRef}
            href={href}
            target={isExternalHref(href) ? "_blank" : undefined}
            rel={isExternalHref(href) ? "noopener noreferrer" : undefined}
            className="cd-channel"
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 12px",
                borderRadius: 12,
                textDecoration: "none",
                color: "rgba(255,255,255,0.92)",
            }}
        >
            <span
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    display: "grid",
                    placeItems: "center",
                    background: `${accent}14`,
                    border: `1px solid ${accent}33`,
                    boxShadow: `inset 0 1px 0 ${accent}18`,
                    flexShrink: 0,
                }}
            >
                {icon}
            </span>
            <span
                style={{
                    ...font,
                    flex: 1,
                    ...TYPE.row,
                    color: "rgba(255,255,255,0.92)",
                }}
            >
                {label}
            </span>
            <ChevronIcon color={`${accent}99`} />
        </a>
    )
}

function SheetHeader({
    content,
    avatarSrc,
    avatarAlt,
    accent,
    font,
}: {
    content: { greeting: string; name: string; role?: string }
    avatarSrc: string
    avatarAlt: string
    accent: string
    font: CSSProperties
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar src={avatarSrc} alt={avatarAlt} name={content.name} accent={accent} />
            <div style={{ minWidth: 0 }}>
                <div
                    style={{
                        ...font,
                        ...TYPE.greeting,
                        color: "rgba(255,255,255,0.72)",
                        marginBottom: 2,
                    }}
                >
                    {content.greeting}
                </div>
                <div
                    style={{
                        ...font,
                        ...TYPE.name,
                        color: "rgba(255,255,255,0.96)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {content.name}
                </div>
                {content.role ? (
                    <div
                        style={{
                            ...font,
                            ...TYPE.role,
                            color: "rgba(255,255,255,0.62)",
                            marginTop: 2,
                        }}
                    >
                        {content.role}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function ContactDock(props: ContactDockProps) {
    const content = { ...DEFAULT_CONTENT, ...props.content }
    const appearance = { ...DEFAULT_APPEARANCE, ...props.appearance }
    const legacyMotion = props.motion ?? {}
    const icons = { ...DEFAULT_ICONS, ...props.icons }
    const font = { ...DEFAULT_FONT, ...props.font }

    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const reduced = Boolean(prefersReduced) || isStatic

    // Buyer default false; preview sets true. Legacy motion.startOpen still wins if defaultOpen unset.
    const defaultOpen =
        props.defaultOpen === true ||
        (props.defaultOpen !== false && legacyMotion.startOpen === true)

    const [open, setOpen] = useState(defaultOpen)
    const rootRef = useRef<HTMLDivElement>(null)
    const orbRef = useRef<HTMLButtonElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)
    const firstRowRef = useRef<HTMLAnchorElement>(null)
    const wasOpenRef = useRef(defaultOpen)
    const skipFocusOnOpenRef = useRef(defaultOpen)
    const sheetId = useId()
    const hintId = useId()

    const orbSize = clamp(Number(appearance.orbSize) || 60, 48, 72)
    const accent = appearance.accent || DEFAULT_ACCENT
    const glass = appearance.glassTint || DEFAULT_GLASS
    const blurPx = clamp(
        Number(
            appearance.blur === undefined || appearance.blur === null
                ? DEFAULT_APPEARANCE.blur
                : appearance.blur
        ),
        0,
        24
    )
    const orbBackdrop = blurPx > 0 ? `blur(${blurPx}px) saturate(1.15)` : "none"
    const isRight = appearance.position !== "bottom-left"
    const radiusPct = clamp(Number(appearance.radius) || 50, 0, 50)
    const triggerW = orbSize
    const triggerH = orbSize
    const triggerR = Math.round((orbSize * radiusPct) / 100)
    const avatarSrc = content.avatar?.src || DEFAULT_AVATAR
    const avatarAlt = content.avatar?.alt || content.name || "Avatar"
    const orbIconSize = Math.round(orbSize * 0.34)
    const closeIconSize = Math.round(orbSize * 0.32)
    const channelIconSize = 15

    // Fixed docking is independent of open state (preview killer fix).
    const pinFixed = !isStatic && appearance.fixedDock !== false

    const channelList = (
        Array.isArray(props.channels) && props.channels.length > 0
            ? props.channels
            : DEFAULT_CHANNELS
    )
        .map((ch, index) => {
            const href = resolveHref(ch?.href ?? "")
            const enabled = ch?.enabled !== false
            if (!enabled || !href) return null
            const fallback =
                index === 0 ? (
                    <CalendarIcon color={accent} size={channelIconSize} />
                ) : index === 1 ? (
                    <MailIcon color={accent} size={channelIconSize} />
                ) : (
                    <LinkIcon color={accent} size={channelIconSize} />
                )
            return {
                key: `${index}-${href}`,
                href,
                label: (ch?.label || "").trim() || href,
                icon: <SlotIcon image={ch?.icon} size={channelIconSize} fallback={fallback} />,
            }
        })
        .filter(Boolean) as { key: string; href: string; label: string; icon: ReactNode }[]

    const hasChannels = channelList.length > 0

    const sheetCornerStyle: CSSProperties = isRight ? { right: 0 } : { left: 0 }
    const transformOrigin = isRight ? "bottom right" : "bottom left"

    const sheetTransition = reduced
        ? { duration: 0.01 }
        : { duration: SHEET_MS, ease: EASE_OUT }

    useEffect(() => {
        if (!open || isStatic) return
        if (typeof window === "undefined") return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, isStatic])

    useEffect(() => {
        if (!open || isStatic) return
        if (typeof document === "undefined") return
        const onPointer = (e: PointerEvent) => {
            const t = e.target as Node | null
            if (!t) return
            if (rootRef.current?.contains(t)) return
            setOpen(false)
        }
        document.addEventListener("pointerdown", onPointer)
        return () => document.removeEventListener("pointerdown", onPointer)
    }, [open, isStatic])

    useEffect(() => {
        if (isStatic) return
        if (open) {
            wasOpenRef.current = true
            if (skipFocusOnOpenRef.current) {
                skipFocusOnOpenRef.current = false
                return
            }
            const target = firstRowRef.current ?? sheetRef.current
            target?.focus({ preventScroll: true })
            return
        }
        if (wasOpenRef.current) {
            wasOpenRef.current = false
            orbRef.current?.focus({ preventScroll: true })
        }
    }, [open, isStatic])

    const toggle = useCallback(() => {
        if (isStatic) return
        setOpen((v) => !v)
    }, [isStatic])

    const sheetBody = (
        <>
            <SheetHeader
                content={content}
                avatarSrc={avatarSrc}
                avatarAlt={avatarAlt}
                accent={accent}
                font={font}
            />
            {hasChannels ? (
                <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "2px 0" }} />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {channelList.map((ch, i) => (
                    <ChannelRow
                        key={ch.key}
                        href={ch.href}
                        label={ch.label}
                        icon={ch.icon}
                        accent={accent}
                        font={font}
                        rowRef={i === 0 ? firstRowRef : undefined}
                    />
                ))}
            </div>
        </>
    )

    const orbFace = open ? (
        <SlotIcon
            image={icons.close}
            size={closeIconSize}
            fallback={<CloseIcon color={accent} size={closeIconSize} />}
        />
    ) : (
        <SlotIcon
            image={icons.orb}
            size={orbIconSize}
            fallback={<ChatIcon color={accent} size={orbIconSize} />}
        />
    )

    // Static renderer: mirror defaultOpen, corner-aligned — no centered flash.
    if (isStatic) {
        return (
            <div
                data-static="true"
                data-framer-name="Contact Dock"
                style={{
                    position: "relative",
                    width: triggerW,
                    height: triggerH,
                    overflow: "visible",
                    ...props.style,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        width: triggerW,
                        height: triggerH,
                        overflow: "visible",
                        pointerEvents: "none",
                        ["--cd-accent" as string]: accent,
                        ["--cd-radius" as string]: `${triggerR}px`,
                    }}
                >
                    {defaultOpen ? (
                        <div
                            role="dialog"
                            aria-label="Contact"
                            style={{
                                position: "absolute",
                                bottom: triggerH + 14,
                                ...sheetCornerStyle,
                                width: 300,
                                padding: 18,
                                borderRadius: 20,
                                background: glass,
                                backdropFilter: "blur(20px) saturate(1.25)",
                                WebkitBackdropFilter: "blur(20px) saturate(1.25)",
                                border: "1px solid rgba(255,255,255,0.09)",
                                boxShadow: `0 22px 56px rgba(0,0,0,0.5), 0 0 0 1px ${accent}14, 0 0 48px ${accent}12`,
                                display: "flex",
                                flexDirection: "column",
                                gap: 14,
                                transformOrigin,
                            }}
                        >
                            {sheetBody}
                        </div>
                    ) : (
                        <span
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: -5,
                                borderRadius: triggerR + 5,
                                border: `1.5px solid color-mix(in srgb, ${accent} 55%, transparent)`,
                                pointerEvents: "none",
                                opacity: 0.7,
                            }}
                        />
                    )}
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label={defaultOpen ? "Close contact" : "Open contact"}
                        aria-describedby={!defaultOpen ? hintId : undefined}
                        disabled
                        style={{
                            position: "relative",
                            width: triggerW,
                            height: triggerH,
                            borderRadius: triggerR,
                            border: `1px solid ${accent}55`,
                            background: glass,
                            backdropFilter: orbBackdrop,
                            WebkitBackdropFilter: orbBackdrop,
                            boxShadow: `0 10px 28px rgba(0,0,0,0.4), 0 0 28px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.12)`,
                            display: "grid",
                            placeItems: "center",
                            cursor: "default",
                            padding: 0,
                            outline: "none",
                        }}
                    >
                        {defaultOpen ? (
                            <SlotIcon
                                image={icons.close}
                                size={closeIconSize}
                                fallback={<CloseIcon color={accent} size={closeIconSize} />}
                            />
                        ) : (
                            <SlotIcon
                                image={icons.orb}
                                size={orbIconSize}
                                fallback={<ChatIcon color={accent} size={orbIconSize} />}
                            />
                        )}
                    </button>
                    {!defaultOpen ? (
                        <>
                            <span
                                aria-hidden
                                className="cd-hint-label"
                                style={{
                                    ...font,
                                    ...TYPE.hint,
                                    right: "calc(100% + 10px)",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    position: "absolute",
                                    whiteSpace: "nowrap",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    background: "rgba(12, 12, 14, 0.88)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "rgba(255,255,255,0.88)",
                                }}
                            >
                                Contact
                            </span>
                            <span id={hintId} style={SR_ONLY}>
                                Contact panel
                            </span>
                        </>
                    ) : null}
                </div>
            </div>
        )
    }

    const dock = (
        <div
            ref={rootRef}
            data-framer-name="Contact Dock"
            style={{
                position: pinFixed ? "fixed" : "relative",
                ...(pinFixed
                    ? {
                          zIndex: 9999,
                          bottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
                          ...(isRight
                              ? { right: "calc(20px + env(safe-area-inset-right, 0px))" }
                              : { left: "calc(20px + env(safe-area-inset-left, 0px))" }),
                      }
                    : { zIndex: 1 }),
                width: triggerW,
                height: triggerH,
                overflow: "visible",
                pointerEvents: "auto",
                ["--cd-accent" as string]: accent,
                ["--cd-radius" as string]: `${triggerR}px`,
            }}
        >
            <style>{DOCK_CSS}</style>

            <AnimatePresence initial={false}>
                {open ? (
                    <motion.div
                        ref={sheetRef}
                        id={sheetId}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Contact"
                        tabIndex={-1}
                        initial={reduced ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        transition={sheetTransition}
                        style={{
                            position: "absolute",
                            bottom: triggerH + 14,
                            ...sheetCornerStyle,
                            width: 300,
                            padding: 18,
                            borderRadius: 20,
                            background: glass,
                            backdropFilter: "blur(20px) saturate(1.25)",
                            WebkitBackdropFilter: "blur(20px) saturate(1.25)",
                            border: "1px solid rgba(255,255,255,0.09)",
                            boxShadow: `0 22px 56px rgba(0,0,0,0.5), 0 0 0 1px ${accent}14, 0 0 48px ${accent}12`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            transformOrigin,
                        }}
                    >
                        {sheetBody}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {!open ? (
                <>
                    <span aria-hidden className="cd-hint-ring" />
                    <span aria-hidden className="cd-hint-label" style={{ ...font, ...TYPE.hint }}>
                        Contact
                    </span>
                    <span id={hintId} style={SR_ONLY}>
                        Contact panel
                    </span>
                </>
            ) : null}

            <button
                ref={orbRef}
                type="button"
                className="cd-orb"
                aria-label={open ? "Close contact" : "Open contact"}
                aria-expanded={open}
                aria-controls={open ? sheetId : undefined}
                aria-describedby={!open ? hintId : undefined}
                onClick={toggle}
                style={{
                    position: "relative",
                    width: triggerW,
                    height: triggerH,
                    borderRadius: triggerR,
                    border: `1px solid ${accent}55`,
                    background: glass,
                    backdropFilter: orbBackdrop,
                    WebkitBackdropFilter: orbBackdrop,
                    boxShadow: `0 10px 28px rgba(0,0,0,0.4), 0 0 28px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.12)`,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    padding: 0,
                    outline: "none",
                }}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={open ? "close" : "chat"}
                        initial={reduced ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={reduced ? { duration: 0.01 } : { duration: 0.14, ease: EASE_OUT }}
                        style={{ display: "grid", placeItems: "center", gridArea: "1 / 1" }}
                    >
                        {orbFace}
                    </motion.span>
                </AnimatePresence>
            </button>
        </div>
    )

    return (
        <div
            style={{
                position: "relative",
                width: triggerW,
                height: triggerH,
                overflow: "visible",
                ...props.style,
            }}
        >
            {dock}
        </div>
    )
}

ContactDock.displayName = "Contact Dock"

ContactDock.defaultProps = {
    defaultOpen: false,
}

addPropertyControls(ContactDock, {
    defaultOpen: {
        type: ControlType.Boolean,
        title: "Default Open",
        defaultValue: false,
        enabledTitle: "Open",
        disabledTitle: "Closed",
        description: "Preview: on. Buyers: off. No Auto Demo.",
    },
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            greeting: {
                type: ControlType.String,
                title: "Greeting",
                defaultValue: DEFAULT_CONTENT.greeting,
            },
            name: {
                type: ControlType.String,
                title: "Name",
                defaultValue: DEFAULT_CONTENT.name,
            },
            role: {
                type: ControlType.String,
                title: "Role",
                defaultValue: DEFAULT_CONTENT.role,
            },
            avatar: {
                type: ControlType.ResponsiveImage,
                title: "Avatar",
            },
        },
    },
    channels: {
        type: ControlType.Array,
        title: "Channels",
        description:
            "Up to 3 actions. Allowed links: https://, http://, mailto:, tel:, bare email/phone, or /path. Other schemes (sms, javascript, …) are ignored. Empty + Off hides the row.",
        maxCount: 3,
        defaultValue: DEFAULT_CHANNELS.map(({ label, href, enabled }) => ({
            label,
            href,
            enabled,
        })),
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Action",
                },
                href: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                    description:
                        "Allowed: https://…, http://…, mailto:…, tel:+…, email, phone, or /path. sms/javascript/data and other schemes are blocked.",
                },
                enabled: {
                    type: ControlType.Boolean,
                    title: "Show",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
                icon: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                    description: "Optional PNG/SVG. Empty = built-in.",
                },
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: DEFAULT_ACCENT,
            },
            glassTint: {
                type: ControlType.Color,
                title: "Tint",
                defaultValue: DEFAULT_GLASS,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 14,
                min: 0,
                max: 24,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            position: {
                type: ControlType.Enum,
                title: "Corner",
                options: ["bottom-right", "bottom-left"],
                optionTitles: ["Bottom Right", "Bottom Left"],
                defaultValue: "bottom-right",
                displaySegmentedControl: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 50,
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                displayStepper: true,
            },
            orbSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 60,
                min: 48,
                max: 72,
                step: 1,
                displayStepper: true,
            },
            fixedDock: {
                type: ControlType.Boolean,
                title: "Fixed Dock",
                defaultValue: true,
                enabledTitle: "Fixed",
                disabledTitle: "Inline",
                hidden: () => true,
            },
        },
    },
    icons: {
        type: ControlType.Object,
        title: "Icons",
        description: "Orb icons. Channel icons live under Channels.",
        controls: {
            orb: {
                type: ControlType.ResponsiveImage,
                title: "Orb",
                description: "Closed orb. Empty = built-in.",
            },
            close: {
                type: ControlType.ResponsiveImage,
                title: "Close",
                description: "Open orb. Empty = built-in ×.",
            },
        },
        defaultValue: {},
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.3em",
        },
        description:
            "BuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
    },
})
