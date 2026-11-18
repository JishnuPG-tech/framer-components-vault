// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

type Pt = { x: number; y: number; t: number }
type Stroke = { pts: Pt[]; color: string; minW: number; maxW: number }

const MORPH = { type: "spring" as const, stiffness: 300, damping: 28, mass: 1 }

function widthForVelocity(prev: Pt, curr: Pt, minW: number, maxW: number) {
    const d = Math.hypot(curr.x - prev.x, curr.y - prev.y)
    const dt = Math.max(1, curr.t - prev.t)
    return Math.max(minW, maxW - (d / dt) * 0.55)
}

// ── Icons ──────────────────────────────────────────────────────────────────
const SignatureIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M232,200a8,8,0,0,1-8,8H32a8,8,0,0,1,0-16H224A8,8,0,0,1,232,200ZM56.52,145.56a40,40,0,0,0,54.06-17.18l8.58-17.17,15.73,47.18A16,16,0,0,0,150,168a16.4,16.4,0,0,0,5.21-.87,16,16,0,0,0,10.07-11.5l8.14-37,7.58,11.37a16,16,0,0,0,13.29,7H216a8,8,0,0,0,0-16H194.29l-12.94-19.41a16,16,0,0,0-28.46,5.35l-6.38,29-14.5-43.52a16,16,0,0,0-29.44-1.41l-11.8,23.6a24,24,0,0,1-32.44,10.31,8,8,0,0,0-7.06,14.32Z" />
    </svg>
)
const XIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
    </svg>
)
const EraserIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M225,56.77a24,24,0,0,0-34-2.1L62.47,155.35l38.18,38.18L225,90.77A24,24,0,0,0,225,56.77ZM88.44,181.42,74.58,167.56l115.48-99.83,13.86,13.86ZM40,200H168a8,8,0,0,1,0,16H40a8,8,0,0,1,0-16Z" />
    </svg>
)
const CheckIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
    </svg>
)
const DownloadIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,106.34a8,8,0,0,0-11.32,11.32Z" />
    </svg>
)
const CopyIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z" />
    </svg>
)
const ShareIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M229.66,109.66l-48,48a8,8,0,0,1-11.32-11.32L204.69,112H165a88.21,88.21,0,0,0-85.23,65.37,8,8,0,0,1-15.5-4C73.63,130.28,116.26,96,165,96h39.71L170.34,61.66a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,229.66,109.66ZM192,192H64V88a8,8,0,0,0-16,0V200a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16Z" />
    </svg>
)
const PasteIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M166,152a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,152Zm-6-38H96a6,6,0,0,0,0,12h64a6,6,0,0,0,0-12Zm58-72V224a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V42a8,8,0,0,1,8-8H76.45A36,36,0,0,1,112,8h32a36,36,0,0,1,35.55,26H208A8,8,0,0,1,218,42Zm-66,2a24,24,0,0,0-24-24H128a24,24,0,0,0-24,24v2h48ZM206,48H180v10a8,8,0,0,1-8,8H84a8,8,0,0,1-8-8V48H52V216H206Z" />
    </svg>
)
const LinkIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M137.54,186.36a8,8,0,0,1,0,11.31l-9.94,10A56,56,0,0,1,48.38,128.4L72.5,104.28A56,56,0,0,1,149.31,102a8,8,0,1,1-10.64,12,40,40,0,0,0-54.85,1.63L59.7,139.72a40,40,0,0,0,56.58,56.58l9.94-9.94A8,8,0,0,1,137.54,186.36Zm70.08-138a56.08,56.08,0,0,0-79.22,0l-9.94,9.95a8,8,0,0,0,11.32,11.31l9.94-9.94a40,40,0,0,1,56.58,56.58L172.18,140a40,40,0,0,1-54.85,1.63,8,8,0,1,0-10.64,12,56,56,0,0,0,76.81-2.26l24.12-24.12A56.08,56.08,0,0,0,207.62,48.38Z" />
    </svg>
)
const SunIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z" />
    </svg>
)
const MoonIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
        <path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z" />
    </svg>
)

// ── Theme palettes ─────────────────────────────────────────────────────────
function getTheme(dark: boolean) {
    return dark
        ? {
              pageBg: "#111110",
              pillBg: "#e8e8df",
              pillText: "#111110",
              surfaceBg: "#1c1c1a",
              cardBorder: "rgba(255,255,255,0.08)",
              canvasBg: "#252523",
              baselineColor: "rgba(255,255,255,0.10)",
              accentBg: "#e8e8df",
              accentText: "#111110",
              labelColor: "#8a8a84",
              titleColor: "#e8e8df",
              toggleBg: "#2a2a28",
              toggleActiveBg: "#e8e8df",
              toggleActiveText: "#111110",
              toggleInactiveText: "#6a6a64",
              swatchBorder: "rgba(255,255,255,0.14)",
              swatchSelectedRing: "#e8e8df",
          }
        : {
              pageBg: "#e8e8df",
              pillBg: "#1a1a18",
              pillText: "#f1f1f0",
              surfaceBg: "#f1f1f0",
              cardBorder: "rgba(0,0,0,0.06)",
              canvasBg: "#f8f8f8",
              baselineColor: "rgba(0,0,0,0.10)",
              accentBg: "#1a1a18",
              accentText: "#f2f1ec",
              labelColor: "#6c6c6c",
              titleColor: "#1a1a18",
              toggleBg: "#e0dfda",
              toggleActiveBg: "#1a1a18",
              toggleActiveText: "#f1f1f0",
              toggleInactiveText: "#9a9a94",
              swatchBorder: "rgba(0,0,0,0.12)",
              swatchSelectedRing: "#1a1a18",
          }
}

// ── Ink color presets ──────────────────────────────────────────────────────
const INK_PRESETS = [
    { label: "Ink Black",   color: "#1a1a18" },
    { label: "Graphite",    color: "#4a4a4a" },
    { label: "Cobalt",      color: "#1d4ed8" },
    { label: "Forest",      color: "#166534" },
    { label: "Crimson",     color: "#b91c1c" },
    { label: "Violet",      color: "#6d28d9" },
    { label: "Copper",      color: "#b45309" },
    { label: "Slate",       color: "#475569" },
]

// ── Color Swatch Picker ────────────────────────────────────────────────────
function ColorPicker({
    selectedColor,
    onChange,
    swatchBorder,
    swatchSelectedRing,
    labelColor,
    titleColor,
}: {
    selectedColor: string
    onChange: (c: string) => void
    swatchBorder: string
    swatchSelectedRing: string
    labelColor: string
    titleColor: string
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    return (
        <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 10px", fontFamily: "sans-serif", fontSize: 12, fontWeight: 600, color: labelColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Ink Color
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {INK_PRESETS.map((p) => {
                    const selected = selectedColor === p.color
                    return (
                        <motion.button
                            key={p.color}
                            title={p.label}
                            onClick={() => onChange(p.color)}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.92 }}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                backgroundColor: p.color,
                                border: selected ? `2.5px solid ${swatchSelectedRing}` : `1.5px solid ${swatchBorder}`,
                                cursor: "pointer",
                                boxShadow: selected ? `0 0 0 2px ${swatchSelectedRing}44` : "none",
                                outline: "none",
                                transition: "box-shadow 0.15s",
                            }}
                        />
                    )
                })}
                {/* Custom color swatch */}
                <motion.button
                    title="Custom color"
                    onClick={() => inputRef.current?.click()}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                        border: `1.5px solid ${swatchBorder}`,
                        cursor: "pointer",
                        outline: "none",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <input
                        ref={inputRef}
                        type="color"
                        value={selectedColor}
                        onChange={(e) => onChange(e.target.value)}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                    />
                </motion.button>
            </div>
        </div>
    )
}

// ── Dark / Light toggle ────────────────────────────────────────────────────
function ThemeToggle({
    dark,
    onToggle,
    t,
}: {
    dark: boolean
    onToggle: () => void
    t: ReturnType<typeof getTheme>
}) {
    return (
        <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px 6px 8px",
                borderRadius: 9999,
                backgroundColor: t.toggleBg,
                border: "none",
                cursor: "pointer",
                color: t.titleColor,
            }}
        >
            <motion.span
                animate={{ rotate: dark ? 0 : 180, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                style={{ display: "flex", color: t.titleColor }}
            >
                {dark ? <MoonIcon size={15} /> : <SunIcon size={15} />}
            </motion.span>
            <span style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, color: t.titleColor }}>
                {dark ? "Dark" : "Light"}
            </span>
        </motion.button>
    )
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    style={{
                        position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
                        zIndex: 200, backgroundColor: "#1a1a18", color: "#f1f1f0",
                        padding: "10px 20px", borderRadius: 9999, fontFamily: "sans-serif",
                        fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.28)", pointerEvents: "none",
                    }}
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// ── Action button ──────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, accentBg, accentText, secondary = false }: {
    icon: React.ReactNode; label: string; onClick: () => void
    accentBg: string; accentText: string; secondary?: boolean
}) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 16px", borderRadius: 9999,
                border: secondary ? `1.5px solid ${accentBg}44` : "none",
                backgroundColor: secondary ? "transparent" : accentBg,
                color: secondary ? accentBg : accentText,
                fontFamily: "sans-serif", fontSize: 14, fontWeight: 600,
                cursor: "pointer", flex: 1, justifyContent: "center", minWidth: 0,
            }}
        >
            {icon}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        </motion.button>
    )
}

// ── Signature Actions panel ────────────────────────────────────────────────
function SignatureActions({ dataUrl, onClose, onRedo, t, allowShare, allowDownload, allowCopyImage, allowCopyLink, allowPasteToCanvas }: {
    dataUrl: string; onClose: () => void; onRedo: () => void
    t: ReturnType<typeof getTheme>
    allowShare: boolean; allowDownload: boolean; allowCopyImage: boolean
    allowCopyLink: boolean; allowPasteToCanvas: boolean
}) {
    const [toast, setToast] = useState("")
    const [toastVisible, setToastVisible] = useState(false)
    const timer = useRef<any>(null)

    function showToast(msg: string) {
        clearTimeout(timer.current)
        setToast(msg); setToastVisible(true)
        timer.current = setTimeout(() => setToastVisible(false), 2400)
    }

    async function handleDownload() {
        const a = document.createElement("a")
        a.href = dataUrl; a.download = `signature-${Date.now()}.png`; a.click()
        showToast("✓ Downloaded!")
    }
    async function handleCopyImage() {
        try {
            const blob = await (await fetch(dataUrl)).blob()
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
            showToast("✓ Image copied!")
        } catch { await navigator.clipboard.writeText(dataUrl); showToast("✓ Copied as URL!") }
    }
    async function handleCopyLink() {
        await navigator.clipboard.writeText(dataUrl); showToast("✓ Link copied!")
    }
    async function handleShare() {
        try {
            const blob = await (await fetch(dataUrl)).blob()
            const file = new File([blob], "signature.png", { type: "image/png" })
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: "My Signature" })
            } else { await navigator.clipboard.writeText(dataUrl); showToast("✓ Copied (share unsupported)") }
        } catch { showToast("Share cancelled") }
    }
    async function handlePaste() {
        try {
            const blob = await (await fetch(dataUrl)).blob()
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
            showToast("✓ Ready — paste in your canvas (⌘V / Ctrl+V)")
        } catch { showToast("Could not copy") }
    }

    const actions = [
        allowShare        && { icon: <ShareIcon />,   label: "Share",         fn: handleShare,   secondary: false },
        allowDownload     && { icon: <DownloadIcon />, label: "Download",      fn: handleDownload, secondary: false },
        allowCopyImage    && { icon: <CopyIcon />,     label: "Copy image",    fn: handleCopyImage, secondary: true },
        allowCopyLink     && { icon: <LinkIcon />,     label: "Copy link",     fn: handleCopyLink,  secondary: true },
        allowPasteToCanvas && { icon: <PasteIcon />,  label: "Copy to paste", fn: handlePaste,    secondary: true },
    ].filter(Boolean) as { icon: React.ReactNode; label: string; fn: () => void; secondary: boolean }[]

    const rows: typeof actions[] = []
    for (let i = 0; i < actions.length; i += 2) rows.push(actions.slice(i, i + 2))

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={MORPH}
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: t.surfaceBg, borderRadius: 28, padding: 24,
                    width: "100%", maxWidth: 480,
                    boxShadow: "0 16px 56px rgba(0,0,0,0.28)",
                    border: `1px solid ${t.cardBorder}`,
                }}
            >
                <div style={{ borderRadius: 20, overflow: "hidden", backgroundColor: t.canvasBg, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, minHeight: 120 }}>
                    <img src={dataUrl} alt="Signature" style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain", display: "block" }} />
                </div>
                <p style={{ fontFamily: "sans-serif", fontSize: 13, color: t.labelColor, textAlign: "center", margin: "0 0 16px", fontWeight: 500 }}>
                    Signature saved — choose what to do next
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {rows.map((row, i) => (
                        <div key={i} style={{ display: "flex", gap: 8 }}>
                            {row.map((a) => <ActionBtn key={a.label} icon={a.icon} label={a.label} onClick={a.fn} accentBg={t.accentBg} accentText={t.accentText} secondary={a.secondary} />)}
                        </div>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <motion.button onClick={onRedo} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                        style={{ flex: 1, padding: "11px 0", borderRadius: 9999, border: "none", backgroundColor: `${t.accentBg}18`, color: t.accentBg, fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        Redo
                    </motion.button>
                    <motion.button onClick={onClose} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                        style={{ flex: 1, padding: "11px 0", borderRadius: 9999, border: "none", backgroundColor: t.accentBg, color: t.accentText, fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        Done
                    </motion.button>
                </div>
            </motion.div>
            <Toast message={toast} visible={toastVisible} />
        </>
    )
}

// ── Drawing Modal ──────────────────────────────────────────────────────────
function ModalCard({
    origin, onClose, onSaved,
    title, subtitle, saveLabel,
    dark, onThemeToggle,
    allowShare, allowDownload, allowCopyImage, allowCopyLink, allowPasteToCanvas,
    inkColorOverride,
}: {
    origin: { x: number; y: number; w: number; h: number }
    onClose: () => void
    onSaved: (url: string) => void
    title: string; subtitle: string; saveLabel: string
    dark: boolean; onThemeToggle: () => void
    allowShare: boolean; allowDownload: boolean; allowCopyImage: boolean
    allowCopyLink: boolean; allowPasteToCanvas: boolean
    inkColorOverride: string
}) {
    const t = getTheme(dark)
    const canvasContainerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const strokesRef = useRef<Stroke[]>([])
    const currentRef = useRef<Stroke | null>(null)
    const drawingRef = useRef(false)
    const sizeRef = useRef({ w: 0, h: 0 })

    const minW = 1.2
    const maxW = 3.2

    const [hasInk, setHasInk] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [savedUrl, setSavedUrl] = useState<string | null>(null)
    const [today, setToday] = useState("")
    const [inkColor, setInkColor] = useState(inkColorOverride)

    useEffect(() => { setInkColor(inkColorOverride) }, [inkColorOverride])
    useEffect(() => { setToday(new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })) }, [])

    const redrawAll = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const { w, h } = sizeRef.current
        ctx.clearRect(0, 0, w, h)
        for (const stroke of strokesRef.current) {
            ctx.lineCap = "round"; ctx.lineJoin = "round"
            ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color
            if (stroke.pts.length === 1) {
                ctx.beginPath(); ctx.arc(stroke.pts[0].x, stroke.pts[0].y, stroke.minW, 0, Math.PI * 2); ctx.fill(); continue
            }
            for (let i = 1; i < stroke.pts.length; i++) {
                const prev = stroke.pts[i - 1], curr = stroke.pts[i]
                const mid = { x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2 }
                ctx.lineWidth = widthForVelocity(prev, curr, stroke.minW, stroke.maxW)
                ctx.beginPath()
                if (i === 1) { ctx.moveTo(prev.x, prev.y) }
                else { const p2 = stroke.pts[i - 2]; ctx.moveTo((p2.x + prev.x) / 2, (p2.y + prev.y) / 2) }
                ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y); ctx.stroke()
            }
        }
    }, [])

    const drawSegment = useCallback((stroke: Stroke) => {
        const canvas = canvasRef.current
        if (!canvas || stroke.pts.length < 2) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const prev = stroke.pts[stroke.pts.length - 2]
        const curr = stroke.pts[stroke.pts.length - 1]
        const mid = { x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2 }
        ctx.lineCap = "round"; ctx.lineJoin = "round"
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = widthForVelocity(prev, curr, stroke.minW, stroke.maxW)
        ctx.beginPath()
        if (stroke.pts.length === 2) { ctx.moveTo(prev.x, prev.y) }
        else { const p2 = stroke.pts[stroke.pts.length - 3]; ctx.moveTo((p2.x + prev.x) / 2, (p2.y + prev.y) / 2) }
        ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y); ctx.stroke()
    }, [])

    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current; const container = canvasContainerRef.current
        if (!canvas || !container) return
        const dpr = window.devicePixelRatio || 1
        const w = container.clientWidth; const h = container.clientHeight
        if (!w || !h) return
        sizeRef.current = { w, h }
        canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr)
        canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
        const ctx = canvas.getContext("2d")
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        redrawAll()
    }, [redrawAll])

    useEffect(() => { setupCanvas(); const ro = new ResizeObserver(setupCanvas); if (canvasContainerRef.current) ro.observe(canvasContainerRef.current); return () => ro.disconnect() }, [setupCanvas])

    function getPoint(e: React.PointerEvent<HTMLCanvasElement>): Pt {
        const r = e.currentTarget.getBoundingClientRect()
        return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }
    }
    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
        if (confirming) return
        e.preventDefault()
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
        drawingRef.current = true
        const newStroke: Stroke = { pts: [getPoint(e)], color: inkColor, minW, maxW }
        strokesRef.current.push(newStroke)
        currentRef.current = newStroke
        if (!hasInk) setHasInk(true)
    }
    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        if (!drawingRef.current || !currentRef.current) return
        currentRef.current.pts.push(getPoint(e))
        drawSegment(currentRef.current)
    }
    function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
        if (!drawingRef.current) return
        drawingRef.current = false
        try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    }
    function clear() { strokesRef.current = []; currentRef.current = null; setHasInk(false); redrawAll() }
    function save() {
        if (!hasInk || confirming) return
        setConfirming(true)
        setTimeout(() => {
            const url = canvasRef.current?.toDataURL("image/png") ?? ""
            setSavedUrl(url); onSaved(url); setConfirming(false)
        }, 700)
    }
    function handleRedo() {
        setSavedUrl(null); strokesRef.current = []; currentRef.current = null; setHasInk(false)
        setTimeout(redrawAll, 50)
    }

    const vw = typeof window !== "undefined" ? window.innerWidth : 1024
    const vh = typeof window !== "undefined" ? window.innerHeight : 768
    const targetW = Math.min(480, vw - 32)
    const ox = origin.x + origin.w / 2 - vw / 2
    const oy = origin.y + origin.h / 2 - vh / 2
    const sx = origin.w / targetW

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
            <AnimatePresence mode="wait">
                {savedUrl ? (
                    <SignatureActions key="actions" dataUrl={savedUrl} onClose={onClose} onRedo={handleRedo} t={t}
                        allowShare={allowShare} allowDownload={allowDownload} allowCopyImage={allowCopyImage}
                        allowCopyLink={allowCopyLink} allowPasteToCanvas={allowPasteToCanvas} />
                ) : (
                    <motion.div
                        key="draw"
                        initial={{ x: ox, y: oy, scaleX: sx, scaleY: 0.18, borderRadius: 9999, opacity: 0.85 }}
                        animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 28, opacity: 1 }}
                        exit={{ x: ox, y: oy, scaleX: sx, scaleY: 0.18, borderRadius: 9999, opacity: 0 }}
                        transition={{ default: MORPH, borderRadius: { duration: 0.3 }, opacity: { duration: 0.18 } }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: t.surfaceBg, borderRadius: 28,
                            boxShadow: "0 16px 56px rgba(0,0,0,0.28)",
                            border: `1px solid ${t.cardBorder}`,
                            padding: 24, width: "100%", maxWidth: 480,
                        }}
                    >
                        <motion.div
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.16, staggerChildren: 0.05 } }, exit: { opacity: 0, transition: { duration: 0.08 } } }}
                            initial="hidden" animate="show" exit="exit"
                        >
                            {/* Header */}
                            <motion.div variants={{ hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0 } }}
                                style={{ marginBottom: 18, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: `${t.accentBg}1a`, color: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <SignatureIcon size={20} />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontFamily: "sans-serif", fontSize: 17, fontWeight: 700, color: t.titleColor, lineHeight: 1.2 }}>{title}</p>
                                        <p style={{ margin: "2px 0 0", fontFamily: "sans-serif", fontSize: 13, fontWeight: 500, color: t.labelColor }}>{subtitle}</p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    <ThemeToggle dark={dark} onToggle={onThemeToggle} t={t} />
                                    <motion.button onClick={onClose} whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.1 }}
                                        style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: `${t.accentBg}14`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: t.labelColor, flexShrink: 0 }}>
                                        <XIcon size={16} />
                                    </motion.button>
                                </div>
                            </motion.div>

                            {/* Color picker */}
                            <motion.div variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                                <ColorPicker
                                    selectedColor={inkColor}
                                    onChange={(c) => { setInkColor(c) }}
                                    swatchBorder={t.swatchBorder}
                                    swatchSelectedRing={t.swatchSelectedRing}
                                    labelColor={t.labelColor}
                                    titleColor={t.titleColor}
                                />
                            </motion.div>

                            {/* Canvas */}
                            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} style={{ marginBottom: 12 }}>
                                <div ref={canvasContainerRef} style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden", borderRadius: 20, backgroundColor: t.canvasBg }}>
                                    <canvas
                                        ref={canvasRef}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={handlePointerUp}
                                        onPointerLeave={handlePointerUp}
                                        style={{ position: "absolute", inset: 0, touchAction: "none", cursor: confirming ? "default" : "crosshair", width: "100%", height: "100%" }}
                                    />
                                    <div style={{ position: "absolute", left: 32, right: 32, bottom: "28%", height: 1, pointerEvents: "none", backgroundColor: t.baselineColor }} />
                                    <AnimatePresence>
                                        {!hasInk && (
                                            <motion.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                style={{ pointerEvents: "none", position: "absolute", bottom: "31%", left: "50%", transform: "translateX(-50%)", fontFamily: "sans-serif", fontSize: 13, fontWeight: 500, color: t.labelColor, whiteSpace: "nowrap" }}>
                                                Sign here
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div style={{ marginTop: 8, display: "flex", height: 28, alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontFamily: "sans-serif", fontSize: 12, fontWeight: 500, color: t.labelColor, opacity: 0.7 }}>{today}</span>
                                    <AnimatePresence>
                                        {hasInk && !confirming && (
                                            <motion.button key="clear" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} onClick={clear} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 9999, padding: "4px 8px", fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, color: t.labelColor, background: "none", border: "none", cursor: "pointer" }}>
                                                <EraserIcon size={14} />Clear
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                            {/* Footer */}
                            <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                <motion.button onClick={onClose} disabled={confirming} whileHover={confirming ? {} : { scale: 1.04 }} whileTap={confirming ? {} : { scale: 0.96 }}
                                    style={{ borderRadius: 9999, padding: "12px 20px", fontFamily: "sans-serif", fontSize: 15, fontWeight: 700, backgroundColor: `${t.accentBg}14`, color: t.titleColor, border: "none", cursor: confirming ? "default" : "pointer", opacity: confirming ? 0.5 : 1 }}>
                                    Cancel
                                </motion.button>
                                <motion.button
                                    onClick={save} disabled={!hasInk || confirming}
                                    animate={{ scale: confirming ? 0.96 : 1, opacity: hasInk || confirming ? 1 : 0.38 }}
                                    whileHover={hasInk && !confirming ? { scale: 1.05 } : {}}
                                    whileTap={hasInk && !confirming ? { scale: 0.96 } : {}}
                                    style={{ minWidth: 148, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9999, padding: "12px 28px", fontFamily: "sans-serif", fontSize: 15, fontWeight: 700, backgroundColor: t.accentBg, color: t.accentText, border: "none", cursor: hasInk && !confirming ? "pointer" : "not-allowed" }}>
                                    <AnimatePresence mode="wait" initial={false}>
                                        {confirming ? (
                                            <motion.span key="check" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center" }}>
                                                <CheckIcon size={16} />
                                            </motion.span>
                                        ) : (
                                            <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                {saveLabel}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function SignaturePad({
    triggerLabel = "Create your digital signature",
    modalTitle = "Create your digital signature",
    modalSubtitle = "Draw using your mouse or finger",
    saveLabel = "Save signature",
    defaultTheme = "light",
    defaultInkColor = "#1a1a18",
    allowShare = true,
    allowDownload = true,
    allowCopyImage = true,
    allowCopyLink = true,
    allowPasteToCanvas = true,
    onSave,
}: {
    triggerLabel?: string
    modalTitle?: string
    modalSubtitle?: string
    saveLabel?: string
    defaultTheme?: "light" | "dark"
    defaultInkColor?: string
    allowShare?: boolean
    allowDownload?: boolean
    allowCopyImage?: boolean
    allowCopyLink?: boolean
    allowPasteToCanvas?: boolean
    onSave?: (dataUrl: string) => void
}) {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [open, setOpen] = useState(false)
    const [dark, setDark] = useState(defaultTheme === "dark")
    const [origin, setOrigin] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

    useEffect(() => { setDark(defaultTheme === "dark") }, [defaultTheme])

    const t = getTheme(dark)

    function handleOpen() {
        if (buttonRef.current) {
            const r = buttonRef.current.getBoundingClientRect()
            setOrigin({ x: r.left, y: r.top, w: r.width, h: r.height })
        }
        setOpen(true)
    }
    function close() { setOpen(false) }

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", height: "100%",
        }}>
            <motion.button
                ref={buttonRef}
                onClick={handleOpen}
                animate={{ opacity: open ? 0 : 1, scale: open ? 0.88 : 1, backgroundColor: t.pillBg }}
                transition={open ? { duration: 0.16 } : { type: "spring", stiffness: 400, damping: 28 }}
                whileHover={open ? {} : { scale: 1.03 }}
                whileTap={open ? {} : { scale: 0.97 }}
                style={{
                    borderRadius: 9999, color: t.pillText,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
                    pointerEvents: open ? "none" : "auto",
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 20px 8px 8px",
                    fontFamily: "sans-serif",
                    fontSize: "clamp(13px, 3.5vw, 15px)",
                    fontWeight: 600, border: "none", cursor: "pointer", maxWidth: "90vw",
                }}
            >
                <span style={{ width: 36, height: 36, minWidth: 36, borderRadius: "50%", backgroundColor: t.pillText, color: t.pillBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SignatureIcon size={18} />
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{triggerLabel}</span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={close}
                        style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: dark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.32)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {open && origin && (
                    <ModalCard
                        key="modal"
                        origin={origin}
                        onClose={close}
                        onSaved={(url) => onSave?.(url)}
                        title={modalTitle}
                        subtitle={modalSubtitle}
                        saveLabel={saveLabel}
                        dark={dark}
                        onThemeToggle={() => setDark((d) => !d)}
                        allowShare={allowShare}
                        allowDownload={allowDownload}
                        allowCopyImage={allowCopyImage}
                        allowCopyLink={allowCopyLink}
                        allowPasteToCanvas={allowPasteToCanvas}
                        inkColorOverride={defaultInkColor}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(SignaturePad, {
    triggerLabel:    { type: ControlType.String,  title: "Button Label",       defaultValue: "Create your digital signature" },
    modalTitle:      { type: ControlType.String,  title: "Modal Title",        defaultValue: "Create your digital signature" },
    modalSubtitle:   { type: ControlType.String,  title: "Modal Subtitle",     defaultValue: "Draw using your mouse or finger" },
    saveLabel:       { type: ControlType.String,  title: "Save Button Label",  defaultValue: "Save signature" },
    defaultTheme:    { type: ControlType.Enum,    title: "Default Theme",      options: ["light", "dark"], optionTitles: ["☀️ Light", "🌙 Dark"], defaultValue: "light" },
    defaultInkColor: { type: ControlType.Color,   title: "Default Ink Color",  defaultValue: "#1a1a18" },
    allowDownload:       { type: ControlType.Boolean, title: "Show Download",      defaultValue: true },
    allowShare:          { type: ControlType.Boolean, title: "Show Share",         defaultValue: true },
    allowCopyImage:      { type: ControlType.Boolean, title: "Show Copy Image",    defaultValue: true },
    allowCopyLink:       { type: ControlType.Boolean, title: "Show Copy Link",     defaultValue: true },
    allowPasteToCanvas:  { type: ControlType.Boolean, title: "Show Copy-to-Paste", defaultValue: true },
})
