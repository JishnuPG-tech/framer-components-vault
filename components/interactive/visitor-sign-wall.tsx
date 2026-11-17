/**
 * SignWall v3.2 – Framer Code Component
 *
 * ✦ Handwritten signature canvas (Pointer Events API, DPR-aware, auto-cropped)
 * ✦ Dot-grid wall background
 * ✦ Signature cards showing the actual drawn signature
 * ✦ Smooth modal with form → success flow
 * ✦ Floating "Let Me Sign" pill button
 * ✦ Per-project isolation — key derived from window.location (hostname + path)
 * ✦ SEPARATE ControlType.Font per text element (Framer marketplace requirement)
 *   → titleFont, subtitleFont, cardFont, buttonFont, uiFont
 * ✦ Canvas: always empty (clean slate per Framer best practice)
 * ✦ Fully customisable via Property Controls
 *
 * ── v3.2 changes (marketplace feedback) ────────────────────────────────────
 * [1] INCREMENTAL STROKE BOUNDS: minX/minY/maxX/maxY are now tracked in real
 *     time during onDown/onMove. exportCroppedSignature() uses these values
 *     directly — no full-pixel scan needed.
 * [2] NO RUNTIME @import: removed the Google Fonts @import from injected
 *     styles. Typography is now driven entirely by the five ControlType.Font
 *     controls (titleFont, subtitleFont, cardFont, buttonFont, uiFont) which
 *     Framer resolves from its own font pipeline. Fallback stacks use only
 *     safe system fonts.
 */

import {
    useState,
    useEffect,
    useRef,
    useCallback,
    forwardRef,
    CSSProperties,
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


// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Signer {
    id: string
    name: string
    note?: string
    sigData?: string // base64 PNG of the drawn signature (cropped)
    timestamp: number
    rotation: number
    isNew?: boolean
}

// Shape returned by Framer's ControlType.Font
interface FramerFont {
    fontFamily?: string
    fontWeight?: string | number
    fontStyle?: string
    fontSize?: string | number
    letterSpacing?: string | number
    lineHeight?: string | number
    textAlign?: string
    [key: string]: unknown
}

// Stroke bounding box tracked incrementally while drawing
interface StrokeBounds {
    minX: number
    minY: number
    maxX: number
    maxY: number
    isEmpty: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// FONT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a FramerFont object into valid React CSSProperties */
function fontStyles(f?: FramerFont): CSSProperties {
    if (!f) return {}
    const p: CSSProperties = {}
    if (f.fontFamily) p.fontFamily = f.fontFamily as string
    if (f.fontWeight) p.fontWeight = f.fontWeight as CSSProperties["fontWeight"]
    if (f.fontStyle) p.fontStyle = f.fontStyle as CSSProperties["fontStyle"]
    if (f.fontSize) p.fontSize = f.fontSize as CSSProperties["fontSize"]
    if (f.letterSpacing)
        p.letterSpacing = f.letterSpacing as CSSProperties["letterSpacing"]
    if (f.lineHeight) p.lineHeight = f.lineHeight as CSSProperties["lineHeight"]
    if (f.textAlign) p.textAlign = f.textAlign as CSSProperties["textAlign"]
    return p
}

/**
 * Pull just the fontFamily string.
 * Fallback uses only safe system fonts — no external URL required.
 */
function fontFamily(f?: FramerFont): string {
    return (
        (f?.fontFamily as string | undefined) ??
        "Georgia, 'Times New Roman', serif" // sensible serif fallback for title
    )
}

function sansFamily(f?: FramerFont): string {
    return (
        (f?.fontFamily as string | undefined) ??
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    )
}

/** Merge fontStyles but pin specific overrides that must not be clobbered */
function mergedFont(
    f: FramerFont | undefined,
    overrides: CSSProperties
): CSSProperties {
    return { ...fontStyles(f), ...overrides }
}

// ─────────────────────────────────────────────────────────────────────────────
// PER-PROJECT PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

function buildProjectKey(): string {
    try {
        const host = window.location.hostname.replace(/\./g, "-")
        const path =
            window.location.pathname.replace(/\/+$/, "").replace(/\//g, "_") ||
            "_root"
        return `signwall_v3__${host}__${path}`
    } catch {
        return "signwall_v3__default"
    }
}

function loadSigners(key: string): Signer[] {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return []
        return (JSON.parse(raw) as Signer[]).map((s) => ({
            ...s,
            isNew: false,
        }))
    } catch {
        return []
    }
}

function saveSigners(key: string, signers: Signer[]): void {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(signers.map(({ isNew: _i, ...s }) => s))
        )
    } catch {}
}

function useProjectKey(): string {
    const [key, setKey] = useState("signwall_v3__default")
    useEffect(() => {
        setKey(buildProjectKey())
    }, [])
    return key
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS UTILITY
//
// v3.2 change [1]: bounding box is now passed in directly from the incremental
// tracker maintained by DrawingCanvas. No pixel scan required.
// ─────────────────────────────────────────────────────────────────────────────

function exportCroppedSignature(
    canvas: HTMLCanvasElement,
    bounds: StrokeBounds
): string {
    if (bounds.isEmpty) return ""

    const dpr = window.devicePixelRatio || 1
    const pad = 10

    // bounds are in CSS (logical) pixels — convert to physical canvas pixels
    const cx = Math.max(0, Math.round((bounds.minX - pad) * dpr))
    const cy = Math.max(0, Math.round((bounds.minY - pad) * dpr))
    const cRight = Math.min(canvas.width, Math.round((bounds.maxX + pad) * dpr))
    const cBottom = Math.min(
        canvas.height,
        Math.round((bounds.maxY + pad) * dpr)
    )
    const cw = cRight - cx
    const ch = cBottom - cy

    if (cw <= 0 || ch <= 0) return ""

    const logicalW = cw / dpr
    const logicalH = ch / dpr
    const scale = Math.min(1, 280 / logicalW)
    const ow = Math.round(logicalW * scale)
    const oh = Math.round(logicalH * scale)

    const out = document.createElement("canvas")
    out.width = ow
    out.height = oh
    out.getContext("2d")!.drawImage(canvas, cx, cy, cw, ch, 0, 0, ow, oh)
    return out.toDataURL("image/png")
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES (injected once into <head>)
//
// v3.2 change [2]: @import of Google Fonts URL removed entirely.
// Typography is controlled by the five ControlType.Font Framer controls;
// only animation keyframes and utility transitions are injected here.
// ─────────────────────────────────────────────────────────────────────────────

function useGlobalStyles() {
    useEffect(() => {
        const id = "sw3-global"
        if (document.getElementById(id)) return
        const el = document.createElement("style")
        el.id = id
        el.textContent = `
      @keyframes sw3-card-in {
        from { opacity:0; transform:scale(0.86) translateY(14px) rotate(var(--sw3-rot,0deg)); }
        to   { opacity:1; transform:scale(1)    translateY(0)     rotate(var(--sw3-rot,0deg)); }
      }
      @keyframes sw3-modal-in {
        from { opacity:0; transform:translateY(28px) scale(0.95); }
        to   { opacity:1; transform:translateY(0)    scale(1); }
      }
      @keyframes sw3-pop {
        0%   { transform:scale(0.6); opacity:0; }
        70%  { transform:scale(1.12); }
        100% { transform:scale(1);   opacity:1; }
      }
      @keyframes sw3-fade-up {
        from { opacity:0; transform:translateY(10px); }
        to   { opacity:1; transform:translateY(0); }
      }

      .sw3-input { transition: border-color .2s ease, box-shadow .2s ease; }
      .sw3-input::placeholder { color: #adb5bd; }
      .sw3-input:focus { outline: none; }

      .sw3-card {
        transition: transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s ease;
      }
      .sw3-card:hover { z-index: 10; }

      .sw3-cta { transition: transform .2s ease, box-shadow .2s ease; }
      .sw3-cta:hover {
        transform: translateX(-50%) translateY(-3px) !important;
        box-shadow: 0 10px 32px rgba(0,0,0,.3) !important;
      }
      .sw3-cta:active { transform: translateX(-50%) translateY(0) !important; }

      .sw3-icon { transition: opacity .15s; }
      .sw3-icon:hover { opacity: .65; }

      .sw3-submit { transition: filter .15s, transform .15s; }
      .sw3-submit:hover  { filter: brightness(1.08); }
      .sw3-submit:active { transform: scale(.98); }
    `
        document.head.appendChild(el)
    }, [])
}

// ─────────────────────────────────────────────────────────────────────────────
// DOT-GRID BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────

function DotGrid({ color = "#dee2e6" }: { color?: string }) {
    const uid = `sw3d${color.replace(/[^a-z0-9]/gi, "")}`
    return (
        <svg
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
            }}
        >
            <defs>
                <pattern
                    id={uid}
                    x="0"
                    y="0"
                    width="28"
                    height="28"
                    patternUnits="userSpaceOnUse"
                >
                    <circle cx="1.4" cy="1.4" r="1.4" fill={color} />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${uid})`} />
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAWING CANVAS
//
// v3.2 change [1]: StrokeBounds ref tracks the bounding box of all drawn
// strokes incrementally (updated per pointer event). Passed to
// exportCroppedSignature so no per-export pixel scan is needed.
// ─────────────────────────────────────────────────────────────────────────────

function DrawingCanvas({
    canvasRef,
    boundsRef,
    penColor = "#1a1a2e",
    penSize = 2.8,
    onContentChange,
}: {
    canvasRef: React.RefObject<HTMLCanvasElement>
    /** Mutable ref shared with the parent — updated on every stroke point */
    boundsRef: React.MutableRefObject<StrokeBounds>
    penColor?: string
    penSize?: number
    onContentChange?: (has: boolean) => void
}) {
    const [hasContent, setHasContent] = useState(false)
    const drawing = useRef(false)
    const lastPt = useRef<{ x: number; y: number } | null>(null)
    const pres = useRef(0.5)

    /** Expand the shared bounds box to include point (x, y) with radius r */
    const expandBounds = (x: number, y: number, r: number) => {
        const b = boundsRef.current
        if (x - r < b.minX) b.minX = x - r
        if (y - r < b.minY) b.minY = y - r
        if (x + r > b.maxX) b.maxX = x + r
        if (y + r > b.maxY) b.maxY = y + r
        b.isEmpty = false
    }

    const init = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        const w = canvas.parentElement?.clientWidth ?? 400
        const h = canvas.parentElement?.clientHeight ?? 220
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        canvas.style.width = w + "px"
        canvas.style.height = h + "px"
        const ctx = canvas.getContext("2d")
        if (ctx) {
            ctx.scale(dpr, dpr)
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
        }
    }, [canvasRef])

    useEffect(() => {
        init()
    }, [init])

    const getXY = (e: React.PointerEvent) => {
        const r = canvasRef.current!.getBoundingClientRect()
        return { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    const onDown = (e: React.PointerEvent) => {
        canvasRef.current?.setPointerCapture(e.pointerId)
        drawing.current = true
        pres.current = e.pressure || 0.5
        const pt = getXY(e)
        lastPt.current = pt

        const radius = (penSize * (0.6 + pres.current * 0.8)) / 2
        expandBounds(pt.x, pt.y, radius)

        const ctx = canvasRef.current?.getContext("2d")
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = penColor
        ctx.fill()

        if (!hasContent) {
            setHasContent(true)
            onContentChange?.(true)
        }
    }

    const onMove = (e: React.PointerEvent) => {
        if (!drawing.current || !lastPt.current) return
        const ctx = canvasRef.current?.getContext("2d")
        if (!ctx) return
        const pt = getXY(e)
        pres.current = e.pressure > 0 ? e.pressure : pres.current

        const lineWidth = penSize * (0.5 + pres.current * 0.9)
        const halfLine = lineWidth / 2
        // Expand bounds for this segment (approximate with half-width radius)
        expandBounds(pt.x, pt.y, halfLine)

        ctx.beginPath()
        ctx.moveTo(lastPt.current.x, lastPt.current.y)
        ctx.lineTo(pt.x, pt.y)
        ctx.strokeStyle = penColor
        ctx.lineWidth = lineWidth
        ctx.stroke()
        lastPt.current = pt
    }

    const onUp = () => {
        drawing.current = false
        lastPt.current = null
    }

    const clear = (e: React.MouseEvent) => {
        e.stopPropagation()
        const c = canvasRef.current
        if (!c) return
        c.getContext("2d")?.clearRect(0, 0, c.width, c.height)
        // Reset the shared bounds
        boundsRef.current = {
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity,
            maxY: -Infinity,
            isEmpty: true,
        }
        setHasContent(false)
        onContentChange?.(false)
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: 220,
                background: "#ffffff",
                borderRadius: 14,
                border: "1.5px solid #e9ecef",
                overflow: "hidden",
                boxShadow: "inset 0 1px 6px rgba(0,0,0,.03)",
                userSelect: "none",
            }}
        >
            {/* Baseline guide */}
            <div
                style={{
                    position: "absolute",
                    bottom: 52,
                    left: 28,
                    right: 28,
                    height: 1,
                    background: "#f1f3f5",
                    pointerEvents: "none",
                }}
            />

            {/* Placeholder */}
            {!hasContent && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                    }}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ opacity: 0.18 }}
                    >
                        <path
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            stroke="#343a40"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span
                        style={{
                            fontSize: 12,
                            color: "#adb5bd",
                            fontFamily:
                                "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Draw your signature here
                    </span>
                </div>
            )}

            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    cursor: "crosshair",
                    touchAction: "none",
                }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerLeave={onUp}
                onPointerCancel={onUp}
            />

            {/* Clear */}
            {hasContent && (
                <button
                    onClick={clear}
                    className="sw3-icon"
                    style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid #dee2e6",
                        borderRadius: 8,
                        padding: "5px 12px 5px 10px",
                        fontSize: 11,
                        color: "#6c757d",
                        cursor: "pointer",
                        fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        boxShadow: "0 1px 4px rgba(0,0,0,.07)",
                    }}
                >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"
                            stroke="#6c757d"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Clear
                </button>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOCUS-TRACKED TEXT INPUT
// Uses uiFont for labels and input text
// ─────────────────────────────────────────────────────────────────────────────

const FocusInput = forwardRef<
    HTMLInputElement,
    {
        value: string
        onChange: (v: string) => void
        placeholder?: string
        label?: string
        error?: boolean
        accentColor: string
        uiFont?: FramerFont
    }
>(
    (
        { value, onChange, placeholder, label, error, accentColor, uiFont },
        ref
    ) => {
        const [focused, setFocused] = useState(false)
        const fam = sansFamily(uiFont)

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {label && (
                    <label
                        style={mergedFont(uiFont, {
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#6c757d",
                            fontFamily: fam,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                        })}
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="sw3-input"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={mergedFont(uiFont, {
                        width: "100%",
                        padding: "11px 14px",
                        boxSizing: "border-box",
                        background: "#ffffff",
                        border: `1.5px solid ${error ? "#ff6b6b" : focused ? accentColor : "#dee2e6"}`,
                        borderRadius: 10,
                        fontSize: 14,
                        color: "#212529",
                        fontFamily: fam,
                        boxShadow: focused
                            ? `0 0 0 3px ${accentColor}18`
                            : "none",
                    })}
                />
            </div>
        )
    }
)
FocusInput.displayName = "FocusInput"

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE CARD
// Uses cardFont for name + note text
// ─────────────────────────────────────────────────────────────────────────────

function SignatureCard({
    signer,
    accentColor,
    cardFont,
}: {
    signer: Signer
    accentColor: string
    cardFont?: FramerFont
}) {
    const [hovered, setHovered] = useState(false)
    const fam = sansFamily(cardFont)
    const rot = signer.rotation

    const timeLabel = (() => {
        const d = Date.now() - signer.timestamp
        if (d < 60_000) return "just now"
        if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
        if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
        return new Date(signer.timestamp).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
        })
    })()

    return (
        <div
            className="sw3-card"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: "#ffffff",
                borderRadius: 18,
                border: "1px solid #f1f3f5",
                padding: "14px 15px 12px",
                boxShadow: hovered
                    ? `0 16px 40px rgba(0,0,0,.13), 0 0 0 1.5px ${accentColor}22`
                    : "0 2px 10px rgba(0,0,0,.055), 0 0 0 1px rgba(0,0,0,.025)",
                transform: `rotate(${rot}deg) translateY(${hovered ? -4 : 0}px)`,
                animation: signer.isNew
                    ? "sw3-card-in .55s cubic-bezier(.34,1.56,.64,1) both"
                    : "none",
                ["--sw3-rot" as string]: `${rot}deg`,
                cursor: "default",
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Hover shimmer */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: hovered
                        ? `linear-gradient(90deg, transparent, ${accentColor}55, transparent)`
                        : "transparent",
                    transition: "background .4s ease",
                    borderRadius: "18px 18px 0 0",
                }}
            />

            {/* Drawn signature OR stylised name */}
            {signer.sigData ? (
                <div
                    style={{
                        height: 66,
                        borderRadius: 10,
                        background: "#f8f9fa",
                        border: "1px solid #f1f3f5",
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        padding: "4px 6px",
                    }}
                >
                    <img
                        src={signer.sigData}
                        alt=""
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                        }}
                    />
                </div>
            ) : (
                <div
                    style={{
                        height: 54,
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f8f9fa",
                        borderRadius: 10,
                        border: "1px solid #f1f3f5",
                    }}
                >
                    <span
                        style={mergedFont(cardFont, {
                            fontFamily: fam,
                            fontStyle: "italic",
                            fontSize: 21,
                            color: "#212529",
                            letterSpacing: "0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "90%",
                        })}
                    >
                        {signer.name}
                    </span>
                </div>
            )}

            {/* Name */}
            <div
                style={mergedFont(cardFont, {
                    fontFamily: fam,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#212529",
                    letterSpacing: "-0.01em",
                    marginBottom: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                })}
            >
                {signer.name}
            </div>

            {/* Note */}
            {signer.note && (
                <div
                    style={mergedFont(cardFont, {
                        fontFamily: fam,
                        fontSize: 11,
                        color: "#868e96",
                        lineHeight: 1.45,
                        marginBottom: 5,
                        fontStyle: "italic",
                        display: "-webkit-box",
                        overflow: "hidden",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient:
                            "vertical" as CSSProperties["WebkitBoxOrient"],
                    })}
                >
                    "{signer.note}"
                </div>
            )}

            {/* Timestamp */}
            <div
                style={mergedFont(cardFont, {
                    fontFamily: fam,
                    fontSize: 9.5,
                    color: "#ced4da",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                })}
            >
                {timeLabel}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN MODAL
// ─────────────────────────────────────────────────────────────────────────────

type ModalStep = "form" | "success"

function SignModal({
    open,
    onClose,
    onSign,
    accentColor,
    penColor,
    penSize,
    modalTitle,
    namePlaceholder,
    notePlaceholder,
    buttonText,
    modalTitleFont,
    uiFont,
    buttonFont,
}: {
    open: boolean
    onClose: () => void
    onSign: (d: { name: string; note: string; sigData: string }) => void
    accentColor: string
    penColor: string
    penSize: number
    modalTitle: string
    namePlaceholder: string
    notePlaceholder: string
    buttonText: string
    modalTitleFont?: FramerFont
    uiFont?: FramerFont
    buttonFont?: FramerFont
}) {
    const [step, setStep] = useState<ModalStep>("form")
    const [name, setName] = useState("")
    const [note, setNote] = useState("")
    const [nameError, setNameError] = useState(false)
    const [canvasHasContent, setCanvasHasContent] = useState(false)
    const [visible, setVisible] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const nameRef = useRef<HTMLInputElement>(null)

    // Shared mutable bounds ref — updated by DrawingCanvas, read on submit
    const boundsRef = useRef<StrokeBounds>({
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        isEmpty: true,
    })

    const modalTitleFam = sansFamily(modalTitleFont)
    const uiFam = sansFamily(uiFont)
    const btnFam = sansFamily(buttonFont)

    useEffect(() => {
        if (open) {
            setStep("form")
            setName("")
            setNote("")
            setNameError(false)
            setCanvasHasContent(false)
            boundsRef.current = {
                minX: Infinity,
                minY: Infinity,
                maxX: -Infinity,
                maxY: -Infinity,
                isEmpty: true,
            }
            const t1 = setTimeout(() => setVisible(true), 16)
            const t2 = setTimeout(() => nameRef.current?.focus(), 400)
            return () => {
                clearTimeout(t1)
                clearTimeout(t2)
            }
        } else {
            setVisible(false)
        }
    }, [open])

    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) onClose()
        }
        window.addEventListener("keydown", fn)
        return () => window.removeEventListener("keydown", fn)
    }, [open, onClose])

    const clearCanvas = () => {
        const c = canvasRef.current
        if (!c) return
        c.getContext("2d")?.clearRect(0, 0, c.width, c.height)
        boundsRef.current = {
            minX: Infinity,
            minY: Infinity,
            maxX: -Infinity,
            maxY: -Infinity,
            isEmpty: true,
        }
        setCanvasHasContent(false)
    }

    const submit = () => {
        if (!name.trim()) {
            setNameError(true)
            nameRef.current?.focus()
            return
        }
        // v3.2: use incremental bounds — no pixel scan
        const sigData =
            canvasRef.current && canvasHasContent
                ? exportCroppedSignature(canvasRef.current, boundsRef.current)
                : ""
        onSign({ name: name.trim(), note: note.trim(), sigData })
        setStep("success")
        const t = setTimeout(() => {
            setVisible(false)
            setTimeout(onClose, 320)
        }, 2200)
        return () => clearTimeout(t)
    }

    if (!open) return null

    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,15,20,.42)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                opacity: visible ? 1 : 0,
                transition: "opacity .25s ease",
            }}
        >
            <div
                style={{
                    background: "#f4f5f7",
                    borderRadius: 26,
                    width: "100%",
                    maxWidth: 484,
                    overflow: "hidden",
                    boxShadow:
                        "0 32px 80px rgba(0,0,0,.22), 0 0 0 1px rgba(255,255,255,.35) inset",
                    animation: visible
                        ? "sw3-modal-in .45s cubic-bezier(.34,1.56,.64,1)"
                        : "none",
                }}
            >
                {/* ── Header ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                    }}
                >
                    <button
                        onClick={clearCanvas}
                        className="sw3-icon"
                        title="Clear signature"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "rgba(255,255,255,.72)",
                            backdropFilter: "blur(6px)",
                            border: "1px solid rgba(0,0,0,.07)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#6c757d",
                            flexShrink: 0,
                            boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                        }}
                    >
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    {/* Modal title */}
                    <span
                        style={mergedFont(modalTitleFont, {
                            fontFamily: modalTitleFam,
                            fontSize: 14.5,
                            fontWeight: 600,
                            color: "#212529",
                            letterSpacing: "-0.01em",
                        })}
                    >
                        {modalTitle}
                    </span>

                    <button
                        onClick={onClose}
                        className="sw3-icon"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "rgba(255,255,255,.72)",
                            backdropFilter: "blur(6px)",
                            border: "1px solid rgba(0,0,0,.07)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#6c757d",
                            fontSize: 18,
                            lineHeight: 1,
                            flexShrink: 0,
                            boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* ── Form ── */}
                {step === "form" ? (
                    <div style={{ padding: "0 14px 20px" }}>
                        <DrawingCanvas
                            canvasRef={canvasRef}
                            boundsRef={boundsRef}
                            penColor={penColor}
                            penSize={penSize}
                            onContentChange={setCanvasHasContent}
                        />

                        <div
                            style={{
                                marginTop: 14,
                                display: "flex",
                                flexDirection: "column",
                                gap: 11,
                            }}
                        >
                            <FocusInput
                                value={note}
                                onChange={setNote}
                                placeholder={notePlaceholder}
                                label="Got anything to say?"
                                accentColor={accentColor}
                                uiFont={uiFont}
                            />
                            <FocusInput
                                ref={nameRef}
                                value={name}
                                onChange={(v) => {
                                    setName(v)
                                    setNameError(false)
                                }}
                                placeholder={namePlaceholder}
                                label="Name / Nickname"
                                error={nameError}
                                accentColor={accentColor}
                                uiFont={uiFont}
                            />
                            {nameError && (
                                <p
                                    style={mergedFont(uiFont, {
                                        margin: 0,
                                        fontSize: 11,
                                        color: "#ff6b6b",
                                        fontFamily: uiFam,
                                        animation: "sw3-fade-up .2s ease",
                                    })}
                                >
                                    Please enter your name to sign.
                                </p>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={submit}
                            className="sw3-submit"
                            style={mergedFont(buttonFont, {
                                marginTop: 16,
                                width: "100%",
                                padding: "13px",
                                background: accentColor,
                                border: "none",
                                borderRadius: 13,
                                color: "#ffffff",
                                fontSize: 14,
                                fontWeight: 600,
                                fontFamily: btnFam,
                                letterSpacing: "0.02em",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                boxShadow: `0 4px 14px ${accentColor}44, 0 1px 3px ${accentColor}33`,
                            })}
                        >
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    stroke="white"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            {buttonText}
                        </button>
                    </div>
                ) : (
                    /* ── Success ── */
                    <div
                        style={{
                            padding: "32px 20px 28px",
                            textAlign: "center",
                            animation:
                                "sw3-fade-up .4s cubic-bezier(.34,1.56,.64,1)",
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                background: "#d3f9d8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px",
                                animation:
                                    "sw3-pop .5s cubic-bezier(.34,1.56,.64,1)",
                            }}
                        >
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M20 6L9 17l-5-5"
                                    stroke="#37b24d"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div
                            style={mergedFont(modalTitleFont, {
                                fontFamily: modalTitleFam,
                                fontSize: 20,
                                fontWeight: 700,
                                color: "#212529",
                                marginBottom: 8,
                                letterSpacing: "-0.02em",
                            })}
                        >
                            You're on the wall!
                        </div>
                        <div
                            style={mergedFont(uiFont, {
                                fontFamily: uiFam,
                                fontSize: 13,
                                color: "#868e96",
                                lineHeight: 1.55,
                            })}
                        >
                            Your signature has been added.
                            <br />
                            <span
                                style={{ color: accentColor, fontWeight: 500 }}
                            >
                                Thanks for signing.
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTER BADGE
// ─────────────────────────────────────────────────────────────────────────────

function CounterBadge({
    count,
    accentColor,
    uiFont,
}: {
    count: number
    accentColor: string
    uiFont?: FramerFont
}) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 12px 5px 8px",
                background: accentColor + "12",
                border: `1px solid ${accentColor}22`,
                borderRadius: 50,
                marginBottom: 20,
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: accentColor,
                    display: "block",
                    flexShrink: 0,
                }}
            />
            <span
                style={mergedFont(uiFont, {
                    fontFamily: sansFamily(uiFont),
                    fontSize: 11,
                    fontWeight: 600,
                    color: accentColor,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                })}
            >
                {count.toLocaleString()}{" "}
                {count === 1 ? "signature" : "signatures"}
            </span>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface SignWallProps {
    title?: string
    subtitle?: string
    ctaLabel?: string
    modalTitle?: string
    namePlaceholder?: string
    notePlaceholder?: string
    submitLabel?: string
    backgroundColor?: string
    dotColor?: string
    accentColor?: string
    penColor?: string
    penSize?: number
    cardColumns?: number
    titleFont?: FramerFont
    subtitleFont?: FramerFont
    cardFont?: FramerFont
    buttonFont?: FramerFont
    uiFont?: FramerFont
}

export default function SignWall({
    title = "Visitors' Wall",
    subtitle = "Leave your mark. Sign the wall.",
    ctaLabel = "Let Me Sign",
    modalTitle = "Visitors' Book",
    namePlaceholder = "Let us know who you are!",
    notePlaceholder = "Add an optional note.",
    submitLabel = "Finish Signing",
    backgroundColor = "#f8f9fa",
    dotColor = "#dee2e6",
    accentColor = "#212529",
    penColor = "#1a1a2e",
    penSize = 2.8,
    cardColumns = 4,
    titleFont,
    subtitleFont,
    cardFont,
    buttonFont,
    uiFont,
}: SignWallProps) {
    useGlobalStyles()

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const projectKey = useProjectKey()

    const [signers, setSigners] = useState<Signer[]>([])
    useEffect(() => {
        if (!isCanvas) setSigners(loadSigners(projectKey))
    }, [projectKey, isCanvas])

    useEffect(() => {
        if (!isCanvas) saveSigners(projectKey, signers)
    }, [signers, projectKey, isCanvas])

    const [modalOpen, setModalOpen] = useState(false)

    const handleSign = useCallback(
        ({
            name,
            note,
            sigData,
        }: {
            name: string
            note: string
            sigData: string
        }) => {
            const signer: Signer = {
                id: `sw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name,
                note: note || undefined,
                sigData: sigData || undefined,
                timestamp: Date.now(),
                rotation: Math.random() * 5 - 2.5,
                isNew: true,
            }
            setSigners((prev) => [signer, ...prev])
            setTimeout(() => {
                setSigners((prev) =>
                    prev.map((s) =>
                        s.id === signer.id ? { ...s, isNew: false } : s
                    )
                )
            }, 700)
        },
        []
    )

    const cols = Math.max(1, Math.min(6, cardColumns))
    const titleFam = fontFamily(titleFont)
    const subtitleFam = sansFamily(subtitleFont)
    const btnFam = sansFamily(buttonFont)

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100%",
                background: backgroundColor,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxSizing: "border-box",
            }}
        >
            <DotGrid color={dotColor} />

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    maxWidth: 1160,
                    padding: "72px 28px 128px",
                    boxSizing: "border-box",
                }}
            >
                {/* ── Header ── */}
                {(title || subtitle) && (
                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: signers.length > 0 ? 40 : 0,
                            animation: "sw3-fade-up .5s ease .1s both",
                        }}
                    >
                        {signers.length > 0 && (
                            <CounterBadge
                                count={signers.length}
                                accentColor={accentColor}
                                uiFont={uiFont}
                            />
                        )}

                        {title && (
                            <h1
                                style={mergedFont(titleFont, {
                                    fontFamily: titleFam,
                                    fontSize: "clamp(32px, 5vw, 56px)",
                                    fontWeight: 400,
                                    color: "#212529",
                                    margin: "0 0 12px",
                                    lineHeight: 1.1,
                                    letterSpacing: "-0.02em",
                                    textAlign:
                                        (fontStyles(titleFont)
                                            .textAlign as CSSProperties["textAlign"]) ??
                                        "center",
                                })}
                            >
                                {title}
                            </h1>
                        )}

                        {subtitle && (
                            <p
                                style={mergedFont(subtitleFont, {
                                    fontFamily: subtitleFam,
                                    fontSize: 15,
                                    color: "#868e96",
                                    margin: 0,
                                    letterSpacing: "0.02em",
                                    lineHeight: 1.6,
                                    textAlign:
                                        (fontStyles(subtitleFont)
                                            .textAlign as CSSProperties["textAlign"]) ??
                                        "center",
                                })}
                            >
                                {subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* ── Wall / empty state ── */}
                {signers.length === 0 ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: 360,
                            gap: 14,
                            textAlign: "center",
                            animation: "sw3-fade-up .5s ease .2s both",
                        }}
                    >
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ opacity: 0.12 }}
                        >
                            <path
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                stroke="#212529"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div
                            style={mergedFont(subtitleFont, {
                                fontFamily: subtitleFam,
                                fontSize: 22,
                                color: "#212529",
                                opacity: 0.35,
                                letterSpacing: "-0.01em",
                            })}
                        >
                            No signatures yet
                        </div>
                        <div
                            style={mergedFont(uiFont, {
                                fontFamily: sansFamily(uiFont),
                                fontSize: 13,
                                color: "#adb5bd",
                            })}
                        >
                            Be the first to leave your mark
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${cols}, 1fr)`,
                            gap: "14px 12px",
                            alignItems: "start",
                        }}
                    >
                        {signers.map((signer) => (
                            <SignatureCard
                                key={signer.id}
                                signer={signer}
                                accentColor={accentColor}
                                cardFont={cardFont}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Floating CTA ── */}
            <button
                onClick={() => setModalOpen(true)}
                className="sw3-cta"
                style={mergedFont(buttonFont, {
                    position: "fixed",
                    bottom: 28,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 200,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "13px 26px",
                    background: accentColor,
                    border: "none",
                    borderRadius: 50,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: btnFam,
                    letterSpacing: "0.01em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: `0 4px 18px ${accentColor}40, 0 1px 4px ${accentColor}30`,
                })}
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                {ctaLabel}
            </button>

            {/* ── Modal ── */}
            <SignModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSign={handleSign}
                accentColor={accentColor}
                penColor={penColor}
                penSize={penSize}
                modalTitle={modalTitle}
                namePlaceholder={namePlaceholder}
                notePlaceholder={notePlaceholder}
                buttonText={submitLabel}
                modalTitleFont={uiFont}
                uiFont={uiFont}
                buttonFont={buttonFont}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY CONTROLS
// ─────────────────────────────────────────────────────────────────────────────

const FONT_DEFAULTS = {
    textAlign: "center",
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 1.5,
    variant: "Regular",
} as const

addPropertyControls(SignWall, {
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            ...FONT_DEFAULTS,
            textAlign: "center",
            fontSize: 48,
            variant: "Regular",
        },
        defaultFontType: "serif",
        defaultFontSize: "48px",
        displayTextAlignment: true,
        displayFontSize: true,
        controls: "extended",
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        defaultValue: {
            ...FONT_DEFAULTS,
            textAlign: "center",
            fontSize: 15,
            variant: "Regular",
        },
        defaultFontType: "sans-serif",
        defaultFontSize: "15px",
        displayTextAlignment: true,
        displayFontSize: true,
        controls: "basic",
    },
    cardFont: {
        type: ControlType.Font,
        title: "Card Font",
        defaultValue: {
            ...FONT_DEFAULTS,
            textAlign: "left",
            fontSize: 13,
            variant: "Regular",
        },
        defaultFontType: "sans-serif",
        defaultFontSize: "13px",
        displayTextAlignment: false,
        displayFontSize: true,
        controls: "basic",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        defaultValue: {
            ...FONT_DEFAULTS,
            textAlign: "center",
            fontSize: 14,
            variant: "Semibold",
        },
        defaultFontType: "sans-serif",
        defaultFontSize: "14px",
        displayTextAlignment: false,
        displayFontSize: true,
        controls: "basic",
    },
    uiFont: {
        type: ControlType.Font,
        title: "UI / Labels Font",
        defaultValue: {
            ...FONT_DEFAULTS,
            textAlign: "left",
            fontSize: 13,
            variant: "Regular",
        },
        defaultFontType: "sans-serif",
        defaultFontSize: "13px",
        displayTextAlignment: false,
        displayFontSize: true,
        controls: "basic",
    },

    // Content
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Visitors' Wall",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Leave your mark. Sign the wall.",
    },
    ctaLabel: {
        type: ControlType.String,
        title: "CTA Button",
        defaultValue: "Let Me Sign",
    },
    modalTitle: {
        type: ControlType.String,
        title: "Modal Title",
        defaultValue: "Visitors' Book",
    },
    namePlaceholder: {
        type: ControlType.String,
        title: "Name Placeholder",
        defaultValue: "Let us know who you are!",
    },
    notePlaceholder: {
        type: ControlType.String,
        title: "Note Placeholder",
        defaultValue: "Add an optional note.",
    },
    submitLabel: {
        type: ControlType.String,
        title: "Submit Label",
        defaultValue: "Finish Signing",
    },

    // Colors
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#f8f9fa",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#dee2e6",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#212529",
    },

    // Drawing
    penColor: {
        type: ControlType.Color,
        title: "Pen Color",
        defaultValue: "#1a1a2e",
    },
    penSize: {
        type: ControlType.Number,
        title: "Pen Size",
        defaultValue: 2.8,
        min: 1,
        max: 10,
        step: 0.5,
        displayStepper: true,
        unit: "px",
    },

    // Layout
    cardColumns: {
        type: ControlType.Number,
        title: "Card Columns",
        defaultValue: 4,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
})
