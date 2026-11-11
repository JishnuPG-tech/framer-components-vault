import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { createPortal } from "react-dom"
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GalleryImage {
  src: string
  alt?: string
  caption?: string
  link?: string
}

type AspectRatioOption = "auto" | "1:1" | "4:3" | "3:2" | "16:9" | "3:4" | "custom"
type ImageFit = "cover" | "contain"
type ThumbnailPosition = "bottom" | "left" | "right" | "hidden"
type NavigationStyle = "arrows" | "minimal" | "hidden"
type CounterPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right"
type CaptionPosition = "below" | "overlay"
type TransitionStyle = "fade" | "crossfade" | "slide" | "none"
type ImageClickAction = "lightbox" | "link" | "none"
type MobileThumbnailPosition = "bottom" | "hidden" | "same"
type MobileNavigation = "show" | "hide"

interface BorderValue {
  borderColor?: string
  borderStyle?: "solid" | "dashed" | "dotted" | "double"
  borderWidth?: number
}

interface LayoutSettings {
  aspectRatio: AspectRatioOption
  customWidthRatio: number
  customHeightRatio: number
  imageFit: ImageFit
}

interface ThumbnailSettings {
  show: boolean
  position: ThumbnailPosition
  size: number
  gap: number
  radius: number
  fit: ImageFit
  activeBorderColor: string
  inactiveOpacity: number
}

interface NavigationSettings {
  style: NavigationStyle
  arrowSize: number
  arrowBackground: string
  arrowColor: string
  arrowRadius: number
  arrowInset: number
  showOnHoverOnly: boolean
  loop: boolean
}

interface CounterSettings {
  show: boolean
  position: CounterPosition
  textColor: string
  background: string
  radius: number
}

interface CaptionSettings {
  show: boolean
  position: CaptionPosition
}

interface LightboxSettings {
  enable: boolean
  closeOnBackdrop: boolean
  enableZoom: boolean
  maxZoom: number
  imageClickAction: ImageClickAction
}

interface MotionSettings {
  transition: TransitionStyle
  duration: number
}

interface AppearanceSettings {
  radius: number
  background: string
  border?: BorderValue
}

interface MobileSettings {
  thumbnailPosition: MobileThumbnailPosition
  navigation: MobileNavigation
}

type PresetName = "custom" | "product" | "editorial" | "technical"

interface GalleryProProps {
  images?: GalleryImage[]
  preset: PresetName
  layout: LayoutSettings
  thumbnails: ThumbnailSettings
  navigation: NavigationSettings
  counter: CounterSettings
  captions: CaptionSettings
  lightbox: LightboxSettings
  motion: MotionSettings
  appearance: AppearanceSettings
  mobile: MobileSettings
  style?: CSSProperties
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_IMAGES: GalleryImage[] = [
  {
    src: "https://framerusercontent.com/images/ahV1Ikwmzkpv4GBKzyN5dimXstI.jpg",
    alt: "Sculptural chair in a daylight studio, three-quarter view",
    caption: "Studio Chair — Three-Quarter",
  },
  {
    src: "https://framerusercontent.com/images/KcTMyisSK5XdE0bPTffJQyOgQ.jpg",
    alt: "Sculptural chair centered in a bright room",
    caption: "Studio Chair — Front",
  },
  {
    src: "https://framerusercontent.com/images/JKCVRVQJkIhP7PwzLLJWg9DFw.jpg",
    alt: "Wooden armchair on a light tiled floor",
    caption: "Armchair — Side",
  },
  {
    src: "https://framerusercontent.com/images/lDDVXXX4HFzffewj94xf8f2tF8.jpg",
    alt: "Close view of a wooden chair on a white table",
    caption: "Material Detail",
  },
  {
    src: "https://framerusercontent.com/images/PFvUNHoKzzevJtFPkXgA3wIn4.jpg",
    alt: "Wooden framed chair with yellow padding in a warm room",
    caption: "Lifestyle Setting",
  },
]

const SWIPE_THRESHOLD = 48
// Hysteresis band (not a single threshold): the outer root width can differ
// from any single child's width, but even a stable measurement is safer
// with a gap between the enter/exit points than a single bare number.
const MOBILE_BREAKPOINT_ENTER = 460
const MOBILE_BREAKPOINT_EXIT = 500

// Quick-start presets. Each layers partial overrides on top of whatever the
// grouped controls already specify, so switching presets never discards a
// user's manual appearance choices outside the overridden fields.
const PRESETS: Record<
  Exclude<PresetName, "custom">,
  {
    layout?: Partial<LayoutSettings>
    thumbnails?: Partial<ThumbnailSettings>
    navigation?: Partial<NavigationSettings>
    counter?: Partial<CounterSettings>
    captions?: Partial<CaptionSettings>
    lightbox?: Partial<LightboxSettings>
    appearance?: Partial<AppearanceSettings>
  }
> = {
  product: {
    thumbnails: { show: true, position: "bottom" },
    navigation: { style: "minimal" },
    counter: { show: true },
    captions: { show: true, position: "below" },
  },
  editorial: {
    thumbnails: { show: false, position: "hidden" },
    navigation: { style: "hidden" },
    counter: { show: true, position: "bottom-right" },
    captions: { show: true, position: "overlay" },
  },
  technical: {
    layout: { imageFit: "contain" },
    thumbnails: { show: true, position: "left" },
    navigation: { style: "arrows" },
    appearance: { background: "#F6F6F6" },
  },
}

// Framer code components cannot write back into their own property control
// values — there is no supported API for a component to apply a preset and
// then hand control back to "Custom". So a preset stays active as a live
// override (via PRESETS + mergeGroup below) for exactly the fields it
// defines, and this helper hides only those specific fields in the panel
// while a preset is active, so nothing ever appears editable while being
// silently ignored. Every other field in the same group stays visible and
// fully effective. Selecting "Custom" clears every lock at once.
function presetOverrides(rootProps: any, group: string): Record<string, unknown> | undefined {
  const preset = rootProps?.preset as PresetName | undefined
  if (!preset || preset === "custom") return undefined
  const overrides = (PRESETS as Record<string, Record<string, object | undefined>>)[preset]?.[group]
  return typeof overrides === "object" && overrides !== null ? (overrides as Record<string, unknown>) : undefined
}

function isPresetLocked(rootProps: any, group: string, field: string): boolean {
  const overrides = presetOverrides(rootProps, group)
  return overrides !== undefined && field in overrides
}

// Resolves what a field's value actually is on canvas right now: the
// preset's forced value when locked, otherwise the stored/manual value.
// Used so a dependent control (e.g. thumbnail size, only relevant when
// thumbnails are shown) hides itself based on the true rendered state
// rather than a stored value a preset is currently overriding.
function effectiveValue<T>(rootProps: any, group: string, field: string, storedValue: T): T {
  const overrides = presetOverrides(rootProps, group)
  return overrides && field in overrides ? (overrides[field] as T) : storedValue
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveAspectRatio(
  option: AspectRatioOption,
  widthRatio: number,
  heightRatio: number,
  autoRatio: string | undefined
): string | undefined {
  switch (option) {
    case "auto":
      return autoRatio
    case "1:1":
      return "1 / 1"
    case "4:3":
      return "4 / 3"
    case "3:2":
      return "3 / 2"
    case "16:9":
      return "16 / 9"
    case "3:4":
      return "3 / 4"
    case "custom":
      return `${Math.max(widthRatio, 1)} / ${Math.max(heightRatio, 1)}`
    default:
      return "4 / 3"
  }
}

function wrapIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return ((index % count) + count) % count
}

function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return Math.max(0, Math.min(count - 1, index))
}

function borderToCss(border: BorderValue | undefined): string | undefined {
  if (!border || !border.borderWidth) return undefined
  return `${border.borderWidth}px ${border.borderStyle ?? "solid"} ${border.borderColor ?? "rgba(0,0,0,0.1)"}`
}

function mergeGroup<T extends object>(base: T, override?: Partial<T>): T {
  return override ? { ...base, ...override } : base
}

// ---------------------------------------------------------------------------
// Icons (inline, no dependency)
// ---------------------------------------------------------------------------

function IconChevronLeft({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconChevronRight({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClose({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconExpand({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 3H4v5M15 3h5v5M4 15v5h5M20 15v5h-5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBroken({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x={3} y={3} width={18} height={18} rx={2} stroke={color} strokeWidth={1.5} />
      <path d="M8 15l3-4 2.5 3L16 10l3 5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={8.5} cy={8.5} r={1.25} fill={color} />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Small subcomponents
// ---------------------------------------------------------------------------

function VisuallyHidden({ children }: { children: React.ReactNode }) {
  const style: CSSProperties = {
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
  return <span style={style}>{children}</span>
}

function ArrowButton({
  direction,
  onClick,
  size,
  background,
  color,
  radius,
  minimal,
  label,
}: {
  direction: "prev" | "next"
  onClick: () => void
  size: number
  background: string
  color: string
  radius: number
  minimal: boolean
  label: string
}) {
  const style: CSSProperties = minimal
    ? {
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }
    : {
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background,
        borderRadius: radius,
        border: "none",
        cursor: "pointer",
        padding: 0,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
      }
  const iconSize = Math.max(14, Math.round(size * 0.42))
  // "Minimal" style has no background plate, so the icon sits directly on
  // arbitrary product photography. A plain solid-color icon can disappear
  // against a same-tone photo; a soft light+dark double shadow keeps it
  // legible over both light and dark imagery without a visible pill.
  const iconStyle: CSSProperties | undefined = minimal
    ? { filter: "drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 1px 3px rgba(0,0,0,0.45))" }
    : undefined
  return (
    <button type="button" aria-label={label} onClick={onClick} style={style}>
      <span style={iconStyle}>
        {direction === "prev" ? (
          <IconChevronLeft size={iconSize} color={color} />
        ) : (
          <IconChevronRight size={iconSize} color={color} />
        )}
      </span>
    </button>
  )
}

function Thumbnail({
  image,
  active,
  onSelect,
  size,
  radius,
  fit,
  activeBorderColor,
  inactiveOpacity,
  tabIndex,
  onKeyNav,
  index,
  isStatic,
}: {
  image: GalleryImage
  active: boolean
  onSelect: () => void
  size: number
  radius: number
  fit: ImageFit
  activeBorderColor: string
  inactiveOpacity: number
  tabIndex: number
  onKeyNav: (e: ReactKeyboardEvent<HTMLButtonElement>) => void
  index: number
  isStatic: boolean
}) {
  // Canvas/export renders are a single static frame with no client-side
  // effects, so the load-gated fade-in must be skipped there or the
  // thumbnail would render permanently blank.
  const [loaded, setLoaded] = useState(isStatic)
  const [errored, setErrored] = useState(false)

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={`View image ${index + 1}${image.alt ? `: ${image.alt}` : ""}`}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyNav}
      style={{
        flex: "0 0 auto",
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        padding: 0,
        background: "#F5F5F5",
        border: active ? `2px solid ${activeBorderColor}` : "2px solid transparent",
        opacity: active ? 1 : inactiveOpacity,
        transition: "opacity 160ms ease, border-color 160ms ease, transform 160ms ease",
        outlineOffset: 2,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.opacity = "1"
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.opacity = String(inactiveOpacity)
      }}
    >
      {!errored ? (
        <img
          src={image.src}
          alt=""
          loading={isStatic ? "eager" : "lazy"}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: fit,
            display: "block",
            opacity: loaded ? 1 : 0,
            transition: isStatic ? "none" : "opacity 200ms ease",
          }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0F0F0" }}>
          <IconBroken size={Math.round(size * 0.35)} color="#B5B5B5" />
        </div>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------

function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
  loop,
  closeOnBackdrop,
  enableZoom,
  maxZoom,
  showCounter,
  showCaptions,
  reducedMotion,
}: {
  images: GalleryImage[]
  index: number
  onIndexChange: (next: number) => void
  onClose: () => void
  loop: boolean
  closeOnBackdrop: boolean
  enableZoom: boolean
  maxZoom: number
  showCounter: boolean
  showCaptions: boolean
  reducedMotion: boolean
}) {
  const count = images.length
  const current = images[index]
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragState = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number; dragging: boolean } | null>(null)
  const swipeState = useRef<{ startX: number; startY: number } | null>(null)
  const pinchState = useRef<{ startDistance: number; startScale: number } | null>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [index])

  useEffect(() => {
    if (typeof document === "undefined") return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (count > 1) onIndexChange(loop ? wrapIndex(index - 1, count) : clampIndex(index - 1, count))
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        if (count > 1) onIndexChange(loop ? wrapIndex(index + 1, count) : clampIndex(index + 1, count))
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [index, count, loop, onClose, onIndexChange])

  useEffect(() => {
    if (typeof document === "undefined") return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const goPrev = useCallback(() => {
    if (count <= 1) return
    onIndexChange(loop ? wrapIndex(index - 1, count) : clampIndex(index - 1, count))
  }, [index, count, loop, onIndexChange])

  const goNext = useCallback(() => {
    if (count <= 1) return
    onIndexChange(loop ? wrapIndex(index + 1, count) : clampIndex(index + 1, count))
  }, [index, count, loop, onIndexChange])

  const toggleZoom = useCallback(() => {
    if (!enableZoom) return
    setScale((prev) => (prev > 1 ? 1 : maxZoom))
    setPan({ x: 0, y: 0 })
  }, [enableZoom, maxZoom])

  const clampPan = useCallback(
    (x: number, y: number, currentScale: number) => {
      const el = imageRef.current
      if (!el) return { x, y }
      const rect = el.getBoundingClientRect()
      const maxX = (rect.width * (currentScale - 1)) / 2
      const maxY = (rect.height * (currentScale - 1)) / 2
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      }
    },
    []
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!enableZoom) return
      e.preventDefault()
      setScale((prev) => {
        const next = Math.max(1, Math.min(maxZoom, prev - e.deltaY * 0.0025 * maxZoom))
        if (next === 1) setPan({ x: 0, y: 0 })
        return next
      })
    },
    [enableZoom, maxZoom]
  )

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      swipeState.current = { startX: e.clientX, startY: e.clientY }
      if (scale > 1) {
        dragState.current = {
          startX: e.clientX,
          startY: e.clientY,
          startPanX: pan.x,
          startPanY: pan.y,
          dragging: true,
        }
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      }
    },
    [scale, pan]
  )

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragState.current?.dragging) {
        const dx = e.clientX - dragState.current.startX
        const dy = e.clientY - dragState.current.startY
        const next = clampPan(dragState.current.startPanX + dx, dragState.current.startPanY + dy, scale)
        setPan(next)
      }
    },
    [scale, clampPan]
  )

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragState.current?.dragging) {
        dragState.current = null
        return
      }
      const start = swipeState.current
      swipeState.current = null
      if (!start || scale > 1) return
      const dx = e.clientX - start.startX
      const dy = e.clientY - start.startY
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNext()
        else goPrev()
      }
    },
    [scale, goNext, goPrev]
  )

  const handleTouchStart = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]]
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      pinchState.current = { startDistance: distance, startScale: scale }
    }
  }, [scale])

  const handleTouchMove = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && pinchState.current && enableZoom) {
        const [a, b] = [e.touches[0], e.touches[1]]
        const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        const ratio = distance / (pinchState.current.startDistance || 1)
        const next = Math.max(1, Math.min(maxZoom, pinchState.current.startScale * ratio))
        setScale(next)
        if (next === 1) setPan({ x: 0, y: 0 })
      }
    },
    [enableZoom, maxZoom]
  )

  const handleTouchEnd = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) pinchState.current = null
  }, [])

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 2147483000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(12,12,12,0.92)",
    touchAction: "none",
  }

  if (!current) return null

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Image lightbox, ${current.alt || "product image"}`}
      style={overlayStyle}
      initial={reducedMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.22 }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div tabIndex={0} onFocus={() => closeButtonRef.current?.focus()} />

      <button
        ref={closeButtonRef}
        type="button"
        aria-label="Close lightbox"
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        <IconClose size={20} color="#fff" />
      </button>

      {showCounter && count > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            color: "rgba(255,255,255,0.85)",
            fontSize: 13,
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </div>
      )}

      {count > 1 && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={goPrev}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <IconChevronLeft size={22} color="#fff" />
        </button>
      )}

      <div
        ref={imageRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={toggleZoom}
        style={{
          maxWidth: "88vw",
          maxHeight: showCaptions && current.caption ? "72vh" : "84vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: enableZoom ? (scale > 1 ? "grab" : "zoom-in") : "default",
          touchAction: "none",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={index}
            src={current.src}
            alt={current.alt || ""}
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
            style={{
              maxWidth: "88vw",
              maxHeight: showCaptions && current.caption ? "72vh" : "84vh",
              objectFit: "contain",
              transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
              transition: dragState.current?.dragging ? "none" : "transform 120ms ease",
              userSelect: "none",
            }}
            draggable={false}
          />
        </AnimatePresence>
      </div>

      {showCaptions && current.caption && (
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 16, maxWidth: "80vw", textAlign: "center" }}>
          {current.caption}
        </div>
      )}

      {count > 1 && (
        <button
          type="button"
          aria-label="Next image"
          onClick={goNext}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <IconChevronRight size={22} color="#fff" />
        </button>
      )}

      <div tabIndex={0} onFocus={() => closeButtonRef.current?.focus()} />
    </motion.div>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Gallery Pro
 *
 * A production-ready product gallery for Framer with thumbnails, lightbox,
 * zoom, keyboard navigation, mobile swipe gestures, and CMS-friendly
 * architecture. Works immediately with demo content and stays functional
 * as a standalone component in any project.
 *
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 540
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GalleryPro(props: GalleryProProps) {
  const {
    images: imagesProp,
    preset = "custom",
    layout: layoutProp = {
      aspectRatio: "4:3",
      customWidthRatio: 4,
      customHeightRatio: 3,
      imageFit: "cover",
    },
    thumbnails: thumbnailsProp = {
      show: true,
      position: "bottom",
      size: 64,
      gap: 10,
      radius: 8,
      fit: "cover",
      activeBorderColor: "#111111",
      inactiveOpacity: 0.55,
    },
    navigation: navigationProp = {
      style: "minimal",
      arrowSize: 40,
      arrowBackground: "rgba(255,255,255,0.9)",
      arrowColor: "#111111",
      arrowRadius: 999,
      arrowInset: 14,
      showOnHoverOnly: false,
      loop: true,
    },
    counter: counterProp = {
      show: true,
      position: "bottom-right",
      textColor: "#ffffff",
      background: "rgba(17,17,17,0.55)",
      radius: 999,
    },
    captions: captionsProp = {
      show: true,
      position: "below",
    },
    lightbox: lightboxProp = {
      enable: true,
      closeOnBackdrop: true,
      enableZoom: true,
      maxZoom: 3,
      imageClickAction: "lightbox",
    },
    motion: motionSettings = {
      transition: "crossfade",
      duration: 0.32,
    },
    appearance: appearanceProp = {
      radius: 10,
      background: "#ffffff",
      border: undefined,
    },
    mobile = {
      thumbnailPosition: "bottom",
      navigation: "show",
    },
    style,
  } = props

  // A single flat "Preset" control offers quick-start configurations. It
  // stays scriptable (unlike the grouped Object controls below, which are
  // panel-only) and layers on top of manual settings when active.
  const activePreset = preset !== "custom" ? PRESETS[preset] : undefined
  const layout = mergeGroup(layoutProp, activePreset?.layout)
  const thumbnails = mergeGroup(thumbnailsProp, activePreset?.thumbnails)
  const navigation = mergeGroup(navigationProp, activePreset?.navigation)
  const counter = mergeGroup(counterProp, activePreset?.counter)
  const captions = mergeGroup(captionsProp, activePreset?.captions)
  const lightbox = mergeGroup(lightboxProp, activePreset?.lightbox)
  const appearance = mergeGroup(appearanceProp, activePreset?.appearance)

  // ControlType.ResponsiveImage cannot carry a defaultValue when nested in
  // an Array/Object control, so a freshly-dropped instance stores rows with
  // real alt/caption text but an empty src. Fall back to the bundled demo
  // photo per slot so the canvas never shows a broken image before the
  // author picks their own — this is purely a display fallback, the
  // author's own picture always wins once chosen. An explicitly emptied
  // array (imagesProp.length === 0) is a deliberate choice — it falls
  // through to the empty state below rather than masking it with demo
  // content. Only a genuinely missing prop (undefined, e.g. a bare
  // programmatic usage) falls back to the bundled demo set.
  const images = useMemo(() => {
    const source = imagesProp === undefined ? DEFAULT_IMAGES : imagesProp
    return source.map((image, i) => ({
      ...image,
      src: image.src || DEFAULT_IMAGES[i % DEFAULT_IMAGES.length].src,
    }))
  }, [imagesProp])

  const count = images.length
  const isStatic = useIsStaticRenderer()
  const containerRef = useRef<HTMLDivElement>(null)
  // Measured on the outer root, never on a child whose size depends on the
  // thumbnail-position decision this value drives (see isMobile below) —
  // observing a child there previously created a resize feedback loop.
  const rootRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [autoRatio, setAutoRatio] = useState<string | undefined>(undefined)
  const [loadedIndices, setLoadedIndices] = useState<Record<number, boolean>>({})
  const [erroredIndices, setErroredIndices] = useState<Record<number, boolean>>({})
  const [isHovering, setIsHovering] = useState(false)
  const lastFocusRef = useRef<HTMLElement | null>(null)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)

  const clampedIndex = clampIndex(activeIndex, count)

  useEffect(() => {
    if (activeIndex !== clampedIndex) setActiveIndex(clampedIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  // Track own width to determine mobile behavior independent of page breakpoint.
  // Measures the outer root (fixed by whatever width the parent/canvas
  // assigns) rather than any internal child, and only calls setState when
  // the boolean actually flips — both are required to stay stable, since
  // internal children redistribute the root's width but never change it.
  // A small enter/exit gap (hysteresis) is a second, independent safety net
  // against oscillation at the threshold itself.
  useEffect(() => {
    if (typeof window === "undefined" || !rootRef.current) return
    if (typeof ResizeObserver === "undefined") return
    const el = rootRef.current
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      startTransition(() => {
        setIsMobile((prev) => {
          if (!prev && width > 0 && width < MOBILE_BREAKPOINT_ENTER) return true
          if (prev && width >= MOBILE_BREAKPOINT_EXIT) return false
          return prev
        })
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => startTransition(() => setPrefersReducedMotion(query.matches))
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  const effectiveThumbnailPosition: ThumbnailPosition = !thumbnails.show
    ? "hidden"
    : isMobile
    ? mobile.thumbnailPosition === "same"
      ? thumbnails.position
      : mobile.thumbnailPosition
    : thumbnails.position

  const effectiveNavigationStyle: NavigationStyle =
    isMobile && mobile.navigation === "hide" ? "hidden" : navigation.style

  const goTo = useCallback(
    (index: number, dir: number) => {
      if (count === 0) return
      const next = navigation.loop ? wrapIndex(index, count) : clampIndex(index, count)
      setDirection(dir)
      startTransition(() => setActiveIndex(next))
    },
    [count, navigation.loop]
  )

  const goNext = useCallback(() => goTo(clampedIndex + 1, 1), [goTo, clampedIndex])
  const goPrev = useCallback(() => goTo(clampedIndex - 1, -1), [goTo, clampedIndex])

  // Preload immediate neighbors only.
  useEffect(() => {
    if (typeof window === "undefined" || count === 0 || isStatic) return
    const neighbors = [clampedIndex + 1, clampedIndex - 1]
      .map((i) => (navigation.loop ? wrapIndex(i, count) : i))
      .filter((i) => i >= 0 && i < count && i !== clampedIndex)
    for (const i of neighbors) {
      const src = images[i]?.src
      if (!src) continue
      const preloadImg = new window.Image()
      preloadImg.src = src
    }
  }, [clampedIndex, count, images, navigation.loop, isStatic])

  const current = images[clampedIndex]

  const openLightbox = useCallback(() => {
    if (typeof document !== "undefined") lastFocusRef.current = document.activeElement as HTMLElement
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
    if (lastFocusRef.current && typeof lastFocusRef.current.focus === "function") {
      lastFocusRef.current.focus()
    }
  }, [])

  const handleMainClick = useCallback(() => {
    if (lightbox.imageClickAction === "lightbox" && lightbox.enable) {
      openLightbox()
    } else if (lightbox.imageClickAction === "link" && current?.link && typeof window !== "undefined") {
      window.open(current.link, "_blank", "noopener,noreferrer")
    }
  }, [lightbox.imageClickAction, lightbox.enable, current, openLightbox])

  const handleContainerKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (lightboxOpen) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      }
    },
    [lightboxOpen, goPrev, goNext]
  )

  const handleThumbKeyNav = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (count === 0) return
      if (e.key === "ArrowRight") {
        e.preventDefault()
        goTo(clampedIndex + 1, 1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        goTo(clampedIndex - 1, -1)
      } else if (e.key === "Home") {
        e.preventDefault()
        goTo(0, -1)
      } else if (e.key === "End") {
        e.preventDefault()
        goTo(count - 1, 1)
      }
    },
    [count, clampedIndex, goTo]
  )

  const handleSwipeStart = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleSwipeEnd = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current
      swipeStartRef.current = null
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNext()
        else goPrev()
      }
    },
    [goNext, goPrev]
  )

  const resolvedAspectRatio = resolveAspectRatio(
    layout.aspectRatio,
    layout.customWidthRatio,
    layout.customHeightRatio,
    autoRatio
  )

  const rootBorder = borderToCss(appearance.border)

  const transitionDuration = prefersReducedMotion ? 0.08 : motionSettings.duration

  const thumbBarIsSide = effectiveThumbnailPosition === "left" || effectiveThumbnailPosition === "right"

  // Outer wrapper always stacks vertically so a "below" caption sits under
  // the whole gallery, independent of whether thumbnails sit left/right.
  const rootStyle: CSSProperties = {
    ...style,
    position: "relative",
    width: style?.width ?? "100%",
    height: style?.height,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: appearance.background,
    borderRadius: appearance.radius,
    border: rootBorder,
    boxSizing: "border-box",
    overflow: "visible",
  }

  // Inner row holds the main viewer + thumbnail strip and flips direction
  // based on thumbnail position. JSX always renders {mainViewer} before
  // {thumbnailStrip}, so "left" needs row-reverse to place thumbs first.
  const mediaRowStyle: CSSProperties = {
    display: "flex",
    width: "100%",
    flexDirection: effectiveThumbnailPosition === "left" ? "row-reverse" : effectiveThumbnailPosition === "right" ? "row" : "column",
    gap: thumbnails.show && effectiveThumbnailPosition !== "hidden" ? thumbnails.gap : 0,
  }

  if (count === 0) {
    return (
      <div
        ref={rootRef}
        style={{
          ...rootStyle,
          minHeight: 240,
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed #D8D8D8",
          background: "#FAFAFA",
        }}
      >
        <div style={{ textAlign: "center", color: "#8A8A8A", fontSize: 14, padding: 24 }}>
          Add images to Gallery Pro
        </div>
      </div>
    )
  }

  const mainViewer = (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-roledescription="image gallery"
      aria-label="Product gallery"
      onKeyDown={handleContainerKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onPointerDown={handleSwipeStart}
      onPointerUp={handleSwipeEnd}
      style={{
        position: "relative",
        flex: 1,
        minWidth: 0,
        width: "100%",
        aspectRatio: resolvedAspectRatio,
        borderRadius: appearance.radius,
        overflow: "hidden",
        background: "#F2F2F2",
        touchAction: "pan-y",
        outlineOffset: 2,
      }}
    >
      <VisuallyHidden>
        <span aria-live="polite">
          Image {clampedIndex + 1} of {count}
          {current?.alt ? `: ${current.alt}` : ""}
        </span>
      </VisuallyHidden>

      <AnimatePresence mode={motionSettings.transition === "fade" ? "wait" : "sync"} initial={false} custom={direction}>
        {motionSettings.transition !== "none" ? (
          <motion.div
            key={clampedIndex}
            custom={direction}
            initial={
              prefersReducedMotion
                ? undefined
                : motionSettings.transition === "slide"
                ? { x: direction > 0 ? "100%" : "-100%", opacity: 1 }
                : { opacity: 0 }
            }
            animate={{ x: 0, opacity: 1 }}
            exit={
              prefersReducedMotion
                ? undefined
                : motionSettings.transition === "slide"
                ? { x: direction > 0 ? "-100%" : "100%", opacity: 1 }
                : { opacity: 0 }
            }
            transition={{ duration: transitionDuration, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0 }}
          >
            <GalleryImageLayer
              image={current}
              fit={layout.imageFit}
              onLoad={() => {
                setLoadedIndices((prev) => ({ ...prev, [clampedIndex]: true }))
                if (layout.aspectRatio === "auto" && typeof window !== "undefined") {
                  const probe = new window.Image()
                  probe.onload = () => setAutoRatio(`${probe.naturalWidth} / ${probe.naturalHeight}`)
                  probe.src = current.src
                }
              }}
              onError={() => setErroredIndices((prev) => ({ ...prev, [clampedIndex]: true }))}
              errored={!!erroredIndices[clampedIndex]}
              loaded={isStatic || !!loadedIndices[clampedIndex]}
            />
          </motion.div>
        ) : (
          <div key={clampedIndex} style={{ position: "absolute", inset: 0 }}>
            <GalleryImageLayer
              image={current}
              fit={layout.imageFit}
              onLoad={() => setLoadedIndices((prev) => ({ ...prev, [clampedIndex]: true }))}
              onError={() => setErroredIndices((prev) => ({ ...prev, [clampedIndex]: true }))}
              errored={!!erroredIndices[clampedIndex]}
              loaded={isStatic || !!loadedIndices[clampedIndex]}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Click / link layer */}
      {lightbox.imageClickAction !== "none" && (
        <button
          type="button"
          aria-label={lightbox.imageClickAction === "lightbox" ? "Open image in lightbox" : current?.link ? "Open product link" : "Product image"}
          onClick={handleMainClick}
          style={{
            position: "absolute",
            inset: 0,
            background: "transparent",
            border: "none",
            cursor: lightbox.imageClickAction === "lightbox" ? "zoom-in" : current?.link ? "pointer" : "default",
            padding: 0,
          }}
        />
      )}

      {lightbox.enable && (
        <button
          type="button"
          aria-label="Expand image"
          onClick={(e) => {
            e.stopPropagation()
            openLightbox()
          }}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(255,255,255,0.85)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: navigation.showOnHoverOnly && !isMobile ? (isHovering ? 1 : 0) : 1,
            transition: "opacity 150ms ease",
            pointerEvents: navigation.showOnHoverOnly && !isMobile && !isHovering ? "none" : "auto",
          }}
        >
          <IconExpand size={15} color="#111" />
        </button>
      )}

      {effectiveNavigationStyle !== "hidden" && count > 1 && (
        <>
          <div
            style={{
              position: "absolute",
              left: navigation.arrowInset,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: navigation.showOnHoverOnly && !isMobile ? (isHovering ? 1 : 0) : 1,
              pointerEvents: navigation.showOnHoverOnly && !isMobile && !isHovering ? "none" : "auto",
              transition: "opacity 150ms ease",
            }}
          >
            <ArrowButton
              direction="prev"
              onClick={(navigation.loop || clampedIndex > 0) ? goPrev : () => {}}
              size={navigation.arrowSize}
              background={navigation.arrowBackground}
              color={navigation.arrowColor}
              radius={navigation.arrowRadius}
              minimal={effectiveNavigationStyle === "minimal"}
              label="Previous image"
            />
          </div>
          <div
            style={{
              position: "absolute",
              right: navigation.arrowInset,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: navigation.showOnHoverOnly && !isMobile ? (isHovering ? 1 : 0) : 1,
              pointerEvents: navigation.showOnHoverOnly && !isMobile && !isHovering ? "none" : "auto",
              transition: "opacity 150ms ease",
            }}
          >
            <ArrowButton
              direction="next"
              onClick={(navigation.loop || clampedIndex < count - 1) ? goNext : () => {}}
              size={navigation.arrowSize}
              background={navigation.arrowBackground}
              color={navigation.arrowColor}
              radius={navigation.arrowRadius}
              minimal={effectiveNavigationStyle === "minimal"}
              label="Next image"
            />
          </div>
        </>
      )}

      {counter.show && count > 1 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            ...(counter.position === "top-left" && { top: 12, left: 12 }),
            ...(counter.position === "top-right" && { top: 12, right: 12 }),
            ...(counter.position === "bottom-left" && { bottom: 12, left: 12 }),
            ...(counter.position === "bottom-right" && { bottom: 12, right: 12 }),
            background: counter.background,
            color: counter.textColor,
            borderRadius: counter.radius,
            padding: "4px 10px",
            fontSize: 12,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.01em",
          }}
        >
          {String(clampedIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </div>
      )}

      {captions.show && captions.position === "overlay" && current?.caption && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "20px 16px 14px",
            background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))",
            color: "#fff",
            fontSize: 13,
          }}
        >
          {current.link ? (
            <a href={current.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
              {current.caption}
            </a>
          ) : (
            current.caption
          )}
        </div>
      )}
    </div>
  )

  const thumbnailStrip =
    thumbnails.show && effectiveThumbnailPosition !== "hidden" && count > 1 ? (
      <div
        role="tablist"
        aria-label="Gallery thumbnails"
        style={{
          display: "flex",
          flexDirection: thumbBarIsSide ? "column" : "row",
          gap: thumbnails.gap,
          overflowX: thumbBarIsSide ? "visible" : "auto",
          overflowY: thumbBarIsSide ? "auto" : "visible",
          flex: thumbBarIsSide ? `0 0 ${thumbnails.size}px` : "0 0 auto",
          maxWidth: "100%",
          maxHeight: thumbBarIsSide ? "100%" : undefined,
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
          padding: 2,
        }}
      >
        {images.map((image, i) => (
          <Thumbnail
            key={i}
            image={image}
            active={i === clampedIndex}
            onSelect={() => goTo(i, i > clampedIndex ? 1 : -1)}
            size={thumbnails.size}
            radius={thumbnails.radius}
            fit={thumbnails.fit}
            activeBorderColor={thumbnails.activeBorderColor}
            inactiveOpacity={thumbnails.inactiveOpacity}
            tabIndex={i === clampedIndex ? 0 : -1}
            onKeyNav={handleThumbKeyNav}
            index={i}
            isStatic={isStatic}
          />
        ))}
      </div>
    ) : null

  return (
    <div ref={rootRef} style={rootStyle}>
      <div style={mediaRowStyle}>
        {mainViewer}
        {thumbnailStrip}
      </div>
      {captions.show && captions.position === "below" && current?.caption && (
        <div style={{ fontSize: 13, color: "#555", padding: "2px 2px 0" }}>
          {current.link ? (
            <a href={current.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
              {current.caption}
            </a>
          ) : (
            current.caption
          )}
        </div>
      )}
      {lightbox.enable && !isStatic && lightboxOpen && (
        <Lightbox
          images={images}
          index={clampedIndex}
          onIndexChange={(next) => goTo(next, next > clampedIndex ? 1 : -1)}
          onClose={closeLightbox}
          loop={navigation.loop}
          closeOnBackdrop={lightbox.closeOnBackdrop}
          enableZoom={lightbox.enableZoom}
          maxZoom={lightbox.maxZoom}
          showCounter={counter.show}
          showCaptions={captions.show}
          reducedMotion={prefersReducedMotion}
        />
      )}
    </div>
  )
}

function GalleryImageLayer({
  image,
  fit,
  onLoad,
  onError,
  errored,
  loaded,
}: {
  image: GalleryImage
  fit: ImageFit
  onLoad: () => void
  onError: () => void
  errored: boolean
  loaded: boolean
}) {
  if (!image) return null
  if (errored) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: "#F2F2F2",
          color: "#9A9A9A",
          fontSize: 12,
        }}
      >
        <IconBroken size={28} color="#B5B5B5" />
        Image unavailable
      </div>
    )
  }
  return (
    <img
      src={image.src}
      alt={image.alt || ""}
      onLoad={onLoad}
      onError={onError}
      draggable={false}
      style={{
        width: "100%",
        height: "100%",
        objectFit: fit,
        display: "block",
        background: "#F2F2F2",
        opacity: loaded ? 1 : 0,
        transition: "opacity 260ms ease",
        userSelect: "none",
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Property Controls
// ---------------------------------------------------------------------------

addPropertyControls(GalleryPro, {
  images: {
    type: ControlType.Array,
    title: "Images",
    control: {
      type: ControlType.Object,
      controls: {
        src: { type: ControlType.ResponsiveImage, title: "Image" },
        alt: { type: ControlType.String, title: "Alt Text", defaultValue: "" },
        caption: { type: ControlType.String, title: "Caption", defaultValue: "" },
        link: { type: ControlType.Link, title: "Link", defaultValue: "" },
      },
    },
    defaultValue: DEFAULT_IMAGES,
    maxCount: 60,
  },
  preset: {
    type: ControlType.Enum,
    title: "Preset",
    options: ["custom", "product", "editorial", "technical"],
    optionTitles: ["Custom", "Product", "Editorial", "Technical"],
    defaultValue: "custom",
    description:
      "A starting point, not a lock. The handful of settings each preset sets are hidden below while it's active — everything else stays manual and effective. Pick Custom to unlock and edit everything.",
  },
  layout: {
    type: ControlType.Object,
    title: "Layout",
    controls: {
      aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["auto", "1:1", "4:3", "3:2", "16:9", "3:4", "custom"],
        optionTitles: ["Auto", "1:1", "4:3", "3:2", "16:9", "3:4", "Custom"],
        defaultValue: "4:3",
      },
      customWidthRatio: {
        type: ControlType.Number,
        title: "Width Ratio",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        hidden: (p: LayoutSettings) => p.aspectRatio !== "custom",
      },
      customHeightRatio: {
        type: ControlType.Number,
        title: "Height Ratio",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        hidden: (p: LayoutSettings) => p.aspectRatio !== "custom",
      },
      imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
        hidden: (_p: LayoutSettings, rootProps: any) => isPresetLocked(rootProps, "layout", "imageFit"),
      },
    },
    defaultValue: {
      aspectRatio: "4:3",
      customWidthRatio: 4,
      customHeightRatio: 3,
      imageFit: "cover",
    },
  },
  thumbnails: {
    type: ControlType.Object,
    title: "Thumbnails",
    controls: {
      show: {
        type: ControlType.Boolean,
        title: "Show",
        defaultValue: true,
        hidden: (_p: ThumbnailSettings, rootProps: any) => isPresetLocked(rootProps, "thumbnails", "show"),
      },
      position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["bottom", "left", "right", "hidden"],
        optionTitles: ["Bottom", "Left", "Right", "Hidden"],
        defaultValue: "bottom",
        hidden: (p: ThumbnailSettings, rootProps: any) =>
          !effectiveValue(rootProps, "thumbnails", "show", p.show) || isPresetLocked(rootProps, "thumbnails", "position"),
      },
      size: { type: ControlType.Number, title: "Size", defaultValue: 64, min: 36, max: 120, step: 1, unit: "px", hidden: (p: ThumbnailSettings, rootProps: any) => !effectiveValue(rootProps, "thumbnails", "show", p.show) },
      gap: { type: ControlType.Number, title: "Gap", defaultValue: 10, min: 0, max: 32, step: 1, unit: "px", hidden: (p: ThumbnailSettings, rootProps: any) => !effectiveValue(rootProps, "thumbnails", "show", p.show) },
      radius: { type: ControlType.Number, title: "Radius", defaultValue: 8, min: 0, max: 40, step: 1, unit: "px", hidden: (p: ThumbnailSettings, rootProps: any) => !effectiveValue(rootProps, "thumbnails", "show", p.show) },
      fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        hidden: (p: ThumbnailSettings, rootProps: any) => !effectiveValue(rootProps, "thumbnails", "show", p.show),
      },
      activeBorderColor: { type: ControlType.Color, title: "Active Border Color", defaultValue: "#111111", hidden: (p: ThumbnailSettings, rootProps: any) => !effectiveValue(rootProps, "thumbnails", "show", p.show) },
      inactiveOpacity: { type: ControlType.Number, title: "Inactive Opacity", defaultValue: 0.55, min: 0.2, max: 1, step: 0.05, hidden: (p: ThumbnailSettings, rootProps: any) => !effectiveValue(rootProps, "thumbnails", "show", p.show) },
    },
    defaultValue: {
      show: true,
      position: "bottom",
      size: 64,
      gap: 10,
      radius: 8,
      fit: "cover",
      activeBorderColor: "#111111",
      inactiveOpacity: 0.55,
    },
  },
  navigation: {
    type: ControlType.Object,
    title: "Navigation",
    controls: {
      style: {
        type: ControlType.Enum,
        title: "Style",
        options: ["arrows", "minimal", "hidden"],
        optionTitles: ["Arrows", "Minimal", "Hidden"],
        defaultValue: "minimal",
        hidden: (_p: NavigationSettings, rootProps: any) => isPresetLocked(rootProps, "navigation", "style"),
      },
      loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true },
      arrowSize: { type: ControlType.Number, title: "Arrow Size", defaultValue: 40, min: 28, max: 64, step: 1, unit: "px", hidden: (p: NavigationSettings, rootProps: any) => effectiveValue(rootProps, "navigation", "style", p.style) === "hidden" },
      arrowBackground: { type: ControlType.Color, title: "Arrow Background", defaultValue: "rgba(255,255,255,0.9)", hidden: (p: NavigationSettings, rootProps: any) => effectiveValue(rootProps, "navigation", "style", p.style) !== "arrows" },
      arrowColor: { type: ControlType.Color, title: "Arrow Color", defaultValue: "#111111", hidden: (p: NavigationSettings, rootProps: any) => effectiveValue(rootProps, "navigation", "style", p.style) === "hidden" },
      arrowRadius: { type: ControlType.Number, title: "Arrow Radius", defaultValue: 999, min: 0, max: 999, step: 1, hidden: (p: NavigationSettings, rootProps: any) => effectiveValue(rootProps, "navigation", "style", p.style) !== "arrows" },
      arrowInset: { type: ControlType.Number, title: "Arrow Inset", defaultValue: 14, min: 0, max: 60, step: 1, unit: "px", hidden: (p: NavigationSettings, rootProps: any) => effectiveValue(rootProps, "navigation", "style", p.style) === "hidden" },
      showOnHoverOnly: { type: ControlType.Boolean, title: "Show on Hover Only", defaultValue: false, hidden: (p: NavigationSettings, rootProps: any) => effectiveValue(rootProps, "navigation", "style", p.style) === "hidden" },
    },
    defaultValue: {
      style: "minimal",
      arrowSize: 40,
      arrowBackground: "rgba(255,255,255,0.9)",
      arrowColor: "#111111",
      arrowRadius: 999,
      arrowInset: 14,
      showOnHoverOnly: false,
      loop: true,
    },
  },
  counter: {
    type: ControlType.Object,
    title: "Counter",
    controls: {
      show: {
        type: ControlType.Boolean,
        title: "Show",
        defaultValue: true,
        hidden: (_p: CounterSettings, rootProps: any) => isPresetLocked(rootProps, "counter", "show"),
      },
      position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["top-left", "top-right", "bottom-left", "bottom-right"],
        optionTitles: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"],
        defaultValue: "bottom-right",
        hidden: (p: CounterSettings, rootProps: any) =>
          !effectiveValue(rootProps, "counter", "show", p.show) || isPresetLocked(rootProps, "counter", "position"),
      },
      textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#ffffff", hidden: (p: CounterSettings, rootProps: any) => !effectiveValue(rootProps, "counter", "show", p.show) },
      background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(17,17,17,0.55)", hidden: (p: CounterSettings, rootProps: any) => !effectiveValue(rootProps, "counter", "show", p.show) },
      radius: { type: ControlType.Number, title: "Radius", defaultValue: 999, min: 0, max: 999, step: 1, hidden: (p: CounterSettings, rootProps: any) => !effectiveValue(rootProps, "counter", "show", p.show) },
    },
    defaultValue: {
      show: true,
      position: "bottom-right",
      textColor: "#ffffff",
      background: "rgba(17,17,17,0.55)",
      radius: 999,
    },
  },
  captions: {
    type: ControlType.Object,
    title: "Captions",
    controls: {
      show: {
        type: ControlType.Boolean,
        title: "Show",
        defaultValue: true,
        hidden: (_p: CaptionSettings, rootProps: any) => isPresetLocked(rootProps, "captions", "show"),
      },
      position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["below", "overlay"],
        optionTitles: ["Below Image", "Overlay Bottom"],
        defaultValue: "below",
        hidden: (p: CaptionSettings, rootProps: any) =>
          !effectiveValue(rootProps, "captions", "show", p.show) || isPresetLocked(rootProps, "captions", "position"),
      },
    },
    defaultValue: { show: true, position: "below" },
  },
  lightbox: {
    type: ControlType.Object,
    title: "Lightbox",
    controls: {
      enable: { type: ControlType.Boolean, title: "Enable", defaultValue: true },
      imageClickAction: {
        type: ControlType.Enum,
        title: "Image Click Action",
        options: ["lightbox", "link", "none"],
        optionTitles: ["Open Lightbox", "Open Link", "None"],
        defaultValue: "lightbox",
      },
      closeOnBackdrop: { type: ControlType.Boolean, title: "Close on Backdrop", defaultValue: true, hidden: (p: LightboxSettings) => !p.enable },
      enableZoom: { type: ControlType.Boolean, title: "Enable Zoom", defaultValue: true, hidden: (p: LightboxSettings) => !p.enable },
      maxZoom: { type: ControlType.Number, title: "Max Zoom", defaultValue: 3, min: 2, max: 5, step: 0.5, unit: "x", hidden: (p: LightboxSettings) => !p.enable || !p.enableZoom },
    },
    defaultValue: {
      enable: true,
      closeOnBackdrop: true,
      enableZoom: true,
      maxZoom: 3,
      imageClickAction: "lightbox",
    },
  },
  appearance: {
    type: ControlType.Object,
    title: "Appearance",
    controls: {
      background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
        hidden: (_p: AppearanceSettings, rootProps: any) => isPresetLocked(rootProps, "appearance", "background"),
      },
      radius: { type: ControlType.Number, title: "Radius", defaultValue: 10, min: 0, max: 48, step: 1, unit: "px" },
      border: { type: ControlType.Border, title: "Border", optional: true },
    },
    defaultValue: { radius: 10, background: "#ffffff" },
  },
  motion: {
    type: ControlType.Object,
    title: "Motion",
    controls: {
      transition: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["fade", "crossfade", "slide", "none"],
        optionTitles: ["Fade", "Crossfade", "Slide", "None"],
        defaultValue: "crossfade",
      },
      duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.32,
        min: 0.15,
        max: 0.8,
        step: 0.01,
        unit: "s",
        hidden: (p: MotionSettings) => p.transition === "none",
      },
    },
    defaultValue: { transition: "crossfade", duration: 0.32 },
  },
  mobile: {
    type: ControlType.Object,
    title: "Mobile",
    controls: {
      thumbnailPosition: {
        type: ControlType.Enum,
        title: "Thumbnail Position",
        options: ["bottom", "hidden", "same"],
        optionTitles: ["Bottom", "Hidden", "Same as Desktop"],
        defaultValue: "bottom",
      },
      navigation: {
        type: ControlType.Enum,
        title: "Navigation",
        options: ["show", "hide"],
        optionTitles: ["Show", "Hide"],
        defaultValue: "show",
      },
    },
    defaultValue: { thumbnailPosition: "bottom", navigation: "show" },
  },
})
