// @framerDisableUnlink
import {
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
    useEffect,
    useId,
    useRef,
    useState,
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

import {
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion"

type WorkLine = {
    when?: string
    role?: string
    place?: string
}

type Content = {
    folderLabel: string
    fileLine: string
    tabLabel: string
    warningTitle: string
    warningBody: string
    punchline: string
    signature?: string
    workLabel?: string
    portrait?: string
    portraitImage?: unknown
    work?: WorkLine[]
}

type PortraitKind = "noa" | "kai" | "ren" | "ivy" | "image" | "none"

type CoverTexture = "plain" | "leather" | "cloth" | "suede"
type CoverMark = "ink" | "stamp"

type Look = {
    texture?: CoverTexture
    margin?: number
    accentColor?: string
    folderColor?: string
    cardColor?: string
    inkColor?: string
    stickers?: boolean
    font?: CSSProperties
}

type Cover = {
    folderLabel?: string
    mark?: CoverMark
    texture?: CoverTexture
    margin?: number
}

type ColorSet = {
    folderColor?: string
    cardColor?: string
    inkColor?: string
    accentColor?: string
}

type StickerBag = {
    show?: boolean
    size?: number
    items?: StickerInput[]
}

type Layout = {
    disabled: boolean
    startOpen: boolean
}

type StickerInput = {
    art?: string
    image?: string
    label?: string
    link?: unknown
    size?: number
}

type MotionProps = {
    tiltAmount: number
    incline: number
    light: number
    stiffness: number
    damping: number
}

type FontFace = CSSProperties

type Props = {
    content: Content
    cover?: Cover
    type?: {
        title?: FontFace
        subtitle?: FontFace
        body?: FontFace
        tag?: FontFace
    }
    color?: ColorSet
    look?: Look
    layout: Layout
    stickers?: StickerInput[] | StickerBag
    motion: MotionProps
    onOpen?: () => void
    onClose?: () => void
    style?: CSSProperties
}

const FONT = 'ui-sans-serif, system-ui, "Segoe UI", sans-serif'
const SERIF = 'ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
const SCRIPT = '"Segoe Script", "Snell Roundhand", "Bradley Hand", cursive'

function fontPx(font: FontFace | undefined, fallback: number) {
    const raw = font?.fontSize
    const parsed =
        typeof raw === "number"
            ? raw
            : typeof raw === "string"
              ? parseFloat(raw)
              : fallback
    return Number.isFinite(parsed) ? parsed : fallback
}

const FONT_WEIGHT: Record<string, number> = {
    thin: 100,
    extralight: 200,
    "extra light": 200,
    ultralight: 200,
    light: 300,
    regular: 400,
    book: 400,
    medium: 500,
    semibold: 600,
    "semi bold": 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    "extra bold": 800,
    black: 900,
    heavy: 900,
}

function fontVariant(font: FontFace | undefined) {
    if (!font || !("variant" in font)) return ""
    const value = (font as { variant?: unknown }).variant
    return typeof value === "string" ? value : ""
}

function controlWeight(
    font: FontFace | undefined
): CSSProperties["fontWeight"] | undefined {
    if (!font) return undefined
    const key = fontVariant(font)
        .toLowerCase()
        .replace(/italic/g, "")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    if (key && FONT_WEIGHT[key]) return FONT_WEIGHT[key]
    const raw = font.fontWeight
    if (typeof raw === "number" && raw > 0) return raw
    if (typeof raw === "string" && raw.trim() !== "") {
        const parsed = parseInt(raw, 10)
        if (Number.isFinite(parsed) && parsed > 0) return parsed
        const named = FONT_WEIGHT[raw.toLowerCase()]
        if (named) return named
    }
    return undefined
}

function mergedFont(base: FontFace, control: FontFace | undefined): FontFace {
    const next: FontFace = { ...base, ...control }
    const weight = controlWeight(control)
    if (weight !== undefined) next.fontWeight = weight
    if (control?.fontStyle === "italic" || control?.fontStyle === "normal")
        next.fontStyle = control.fontStyle
    else if (/italic/i.test(fontVariant(control))) next.fontStyle = "italic"
    return next
}

function frameLength(
    value: CSSProperties["width"] | undefined,
    intrinsic: number
): CSSProperties["width"] {
    if (typeof value === "number" && value > 0) return value
    if (typeof value === "string" && value.endsWith("px")) {
        const parsed = parseFloat(value)
        if (parsed > 0) return parsed
    }
    if (value === "100%") return "100%"
    return intrinsic
}

function coverMarkOf(value: string | undefined): CoverMark {
    return value === "stamp" ? "stamp" : "ink"
}

function coverLetter(
    mark: CoverMark,
    folder: string,
    quiet: boolean
): CSSProperties {
    if (mark === "stamp") {
        return {
            color: `color-mix(in srgb, ${folder} ${quiet ? 86 : 78}%, #241816)`,
            textShadow: quiet
                ? "0.4px 0.5px 0 rgba(255,248,230,0.14), -0.4px -0.4px 0 rgba(0,0,0,0.18)"
                : "0.55px 0.6px 0 rgba(255,248,230,0.18), -0.45px -0.45px 0.4px rgba(0,0,0,0.22)",
        }
    }
    if (quiet) return { color: "rgba(239,228,208,0.6)" }
    return {
        color: FOIL,
        textShadow:
            "0 1px 0 rgba(255,248,230,0.28), 0 1px 1px rgba(40,12,12,0.4)",
    }
}

function readStickers(
    value: Props["stickers"],
    legacyShow: boolean | undefined
) {
    if (Array.isArray(value))
        return { items: value, show: legacyShow !== false, size: 100 }
    const size =
        typeof value?.size === "number"
            ? Math.min(150, Math.max(60, value.size))
            : 100
    return {
        items: value?.items,
        show: value?.show !== false && legacyShow !== false,
        size,
    }
}

function stickerScale(value: number | undefined, fallback: number) {
    const raw =
        typeof value === "number" && Number.isFinite(value) ? value : fallback
    return Math.min(150, Math.max(60, raw)) / 100
}

function scaledFont(
    font: FontFace | undefined,
    fallback: number,
    fit: number
): CSSProperties {
    return {
        fontFamily: font?.fontFamily,
        fontWeight: font?.fontWeight,
        fontStyle: font?.fontStyle,
        letterSpacing: font?.letterSpacing,
        lineHeight: font?.lineHeight,
        fontSize: Math.round(fontPx(font, fallback) * fit),
    }
}

const STAGE =
    "radial-gradient(ellipse at 50% 42%, #f6f1e8 0%, #eadcc8 48%, #d2bea4 100%)"
const FOIL = "#efe4d0"

function svgUrl(svg: string) {
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const GRAIN = svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.32 0 0 0 0 0.27 0 0 0 0 0.2 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>"
)

const LEATHER = svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='l'><feTurbulence type='fractalNoise' baseFrequency='0.22' numOctaves='2' seed='5' result='n'/><feDiffuseLighting in='n' lighting-color='white' surfaceScale='1.05' diffuseConstant='0.55'><feDistantLight azimuth='40' elevation='70'/></feDiffuseLighting></filter><rect width='100%' height='100%' filter='url(#l)'/></svg>"
)

const HIDE = svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='h'><feTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='2' seed='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.2 0 0 0 0 0.16 0 0 0 0 0.12 0 0 0 0.35 -0.08'/></filter><rect width='100%' height='100%' filter='url(#h)'/></svg>"
)

const SUEDE = svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='s'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='9' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.36 0 0 0 0 0.3 0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(#s)'/></svg>"
)

const CLOTH =
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(0,0,0,0.055) 0 1px, transparent 1px 4px)"

const MOTTLE = svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='m'><feTurbulence type='fractalNoise' baseFrequency='0.014' numOctaves='3' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.35 0 0 0 0 0.26 0 0 0 1.6 -0.55'/></filter><rect width='100%' height='100%' filter='url(#m)'/></svg>"
)

function coverTexture(value: string | undefined): CoverTexture {
    switch (value) {
        case "leather":
        case "cloth":
        case "suede":
        case "plain":
            return value
        default:
            return "plain"
    }
}

function coverGrain(texture: CoverTexture): CSSProperties {
    switch (texture) {
        case "plain":
            return {
                backgroundImage: GRAIN,
                backgroundSize: "180px 180px",
                mixBlendMode: "soft-light",
                opacity: 0.6,
            }
        case "leather":
            return {
                backgroundImage: `${LEATHER}, ${HIDE}`,
                backgroundSize: "220px 220px, 360px 360px",
                mixBlendMode: "soft-light",
                opacity: 0.42,
            }
        case "cloth":
            return {
                backgroundImage: CLOTH,
                backgroundSize: "4px 4px, 4px 4px",
                mixBlendMode: "soft-light",
                opacity: 0.32,
            }
        case "suede":
            return {
                backgroundImage: SUEDE,
                backgroundSize: "140px 140px",
                mixBlendMode: "soft-light",
                opacity: 0.32,
            }
        default: {
            const exhaustive: never = texture
            return exhaustive
        }
    }
}

const defaults = {
    content: {
        folderLabel: "NOTEBOOK",
        fileLine: "Type designer",
        tabLabel: "OPEN",
        warningTitle: "BuiltByKern",
        warningBody:
            "Text faces for reading sizes,\nand the interfaces around them.\nPrint first. Screens when the type holds.",
        punchline: "Basis, for small sizes.",
        signature: "BuiltByKern",
        workLabel: "Experience",
        portrait: "noa",
        work: [
            { when: "Now", role: "Independent", place: "Porto" },
            { when: "2022–24", role: "Type lead", place: "Atelier Norte" },
            { when: "2019–22", role: "Type designer", place: "Cast Type" },
            { when: "2016–19", role: "Product designer", place: "Harbor" },
        ],
    },
    look: {
        texture: "cloth" as CoverTexture,
        margin: 24,
        accentColor: "#b91c1c",
        folderColor: "#6b1a1c",
        cardColor: "#f7f4ee",
        inkColor: "#18181b",
        stickers: true,
    },
    layout: {
        disabled: false,
        startOpen: false,
    },
    motion: {
        tiltAmount: 6,
        incline: -28,
        light: 40,
        stiffness: 340,
        damping: 34,
    },
    type: {
        title: {
            fontFamily: SERIF,
            fontSize: 32,
            fontWeight: 400,
            fontStyle: "normal" as const,
            letterSpacing: "-0.03em",
            lineHeight: "0.92em",
        },
        subtitle: {
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 500,
            fontStyle: "normal" as const,
            letterSpacing: "-0.011em",
            lineHeight: "1em",
        },
        body: {
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 400,
            fontStyle: "normal" as const,
            letterSpacing: "-0.012em",
            lineHeight: "1em",
        },
        tag: {
            fontFamily: SERIF,
            fontSize: 15,
            fontWeight: 400,
            fontStyle: "italic" as const,
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    cover: {
        folderLabel: "NOTEBOOK",
        mark: "ink" as CoverMark,
        texture: "cloth" as CoverTexture,
        margin: 24,
    },
    color: {
        accentColor: "#b91c1c",
        folderColor: "#6b1a1c",
        cardColor: "#f7f4ee",
        inkColor: "#18181b",
    },
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 480
 * @framerDisableUnlink
 */
export default function Kern_Notebook(props: Partial<Props>) {
    const content = { ...defaults.content, ...props.content }
    content.fileLine = content.fileLine ?? defaults.content.fileLine
    content.warningTitle = content.warningTitle ?? defaults.content.warningTitle
    content.warningBody = content.warningBody ?? defaults.content.warningBody
    content.punchline = content.punchline ?? defaults.content.punchline
    const cover = {
        folderLabel:
            props.cover?.folderLabel ??
            content.folderLabel ??
            defaults.cover.folderLabel,
        mark: coverMarkOf(props.cover?.mark),
        texture: coverTexture(props.cover?.texture ?? props.look?.texture),
        margin: Math.min(
            64,
            Math.max(
                8,
                props.cover?.margin ??
                    props.look?.margin ??
                    defaults.cover.margin
            )
        ),
    }
    const color = {
        folderColor:
            props.color?.folderColor ??
            props.look?.folderColor ??
            defaults.color.folderColor,
        cardColor:
            props.color?.cardColor ??
            props.look?.cardColor ??
            defaults.color.cardColor,
        inkColor:
            props.color?.inkColor ??
            props.look?.inkColor ??
            defaults.color.inkColor,
        accentColor:
            props.color?.accentColor ??
            props.look?.accentColor ??
            defaults.color.accentColor,
    }
    const sticker = readStickers(props.stickers, props.look?.stickers)
    const look = {
        texture: cover.texture,
        margin: cover.margin,
        accentColor: color.accentColor,
        folderColor: color.folderColor,
        cardColor: color.cardColor,
        inkColor: color.inkColor,
        stickers: sticker.show,
    }
    const layout = { ...defaults.layout, ...props.layout }
    const motionProps = { ...defaults.motion, ...props.motion }
    const titleFont = mergedFont(defaults.type.title, props.type?.title)
    const subtitleFont = mergedFont(
        defaults.type.subtitle,
        props.type?.subtitle
    )
    const bodyFont = mergedFont(defaults.type.body, props.type?.body)
    const tagFont = mergedFont(defaults.type.tag, props.type?.tag)
    const { style, onOpen, onClose } = props

    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion() === true
    const thumb = RenderTarget.current() === RenderTarget.thumbnail
    const freeze = isStatic || reduced || thumb
    const disabled = layout.disabled
    const startsOpen = thumb || layout.startOpen

    const rootRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{
        x: number
        y: number
        origin: number
        moved: boolean
    } | null>(null)
    const openRef = useRef(startsOpen)
    const [open, setOpen] = useState(startsOpen)
    const [box, setBox] = useState({ width: 0, height: 0 })
    const frameW = box.width > 0 ? box.width : 520
    const frameH = box.height > 0 ? box.height : 480
    const fit = clamp(Math.min(frameW / 520, frameH / 480), 0.58, 1.65)
    const px = (size: number) => Math.round(size * fit)
    const row = Math.max(12, px(18))
    const titleStyle = scaledFont(titleFont, 32, fit)
    const subtitleStyle = scaledFont(subtitleFont, 12, fit)
    const bodyStyle = scaledFont(bodyFont, 12, fit)
    const tagStyle = scaledFont(tagFont, 15, fit)
    const widthRef = useRef(520)
    const boxWidth = useMotionValue(520)
    const labelId = useId()
    const stickerItems = resolveStickers(sticker.items, sticker.size)

    const progress = useMotionValue(startsOpen ? 1 : 0)
    const idleX = useMotionValue(0)
    const tiltX = useSpring(0, { stiffness: 260, damping: 28 })
    const tiltY = useSpring(0, { stiffness: 260, damping: 28 })
    const pageSkew = useMotionValue(0)
    const dragLift = useMotionValue(0)
    const coverTurn = useTransform(progress, (value) => pose(value).coverY)

    const freezeRef = useRef(freeze)
    freezeRef.current = freeze
    const inclineRef = useRef(motionProps.incline)
    inclineRef.current = motionProps.incline

    const x = useTransform(progress, (value) => `${pose(value).x}%`)
    const y = useTransform(progress, (value) => `${pose(value).y}%`)
    const cardSpin = useTransform(progress, (value) => pose(value).rotateZ)
    const lift = useTransform(progress, (value) => pose(value).z)
    const textOpacity = useTransform(
        progress,
        (value) => pose(value).textOpacity
    )
    const tabOpacity = useTransform(
        progress,
        (value) => 1 - smoothstep(0.62, 0.86, value)
    )
    const rigScale = useTransform(progress, (value) => 1 - value * 0.28)
    const cardZ = useTransform(progress, (value) =>
        pose(value).inFront ? 5 : 1
    )
    const peekOpacity = useTransform(progress, [0.08, 0.2], [1, 0])
    const rigShift = useTransform(
        [progress, boxWidth],
        (values: number[]) => -values[1] * 0.096 * values[0]
    )
    const rigX = useTransform([progress, tiltX], (values: number[]) => {
        const [p, tilt] = values
        return (
            pose(p).rigX * turnOf(inclineRef.current) +
            (freezeRef.current ? 0 : tilt)
        )
    })
    const rigY = useTransform([progress, tiltY], (values: number[]) => {
        const [p, tilt] = values
        return (
            pose(p).rigY * turnOf(inclineRef.current) +
            (freezeRef.current ? 0 : tilt)
        )
    })

    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const measure = () => {
            const width = el.clientWidth
            const height = el.clientHeight
            if (width > 0) {
                widthRef.current = width
                boxWidth.set(width)
                setBox((prev) =>
                    prev.width === width && prev.height === height
                        ? prev
                        : { width, height }
                )
            }
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [boxWidth])

    useEffect(() => {
        if (!freeze) return
        tiltX.jump(0)
        tiltY.jump(0)
        pageSkew.jump(0)
        dragLift.jump(0)
        idleX.set(0)
        progress.set(thumb || openRef.current ? 1 : 0)
    }, [dragLift, freeze, idleX, pageSkew, progress, thumb, tiltX, tiltY])

    useEffect(() => {
        if (freeze || disabled || open) {
            if (freeze) return
            const settle = animate(idleX, 0, {
                duration: 0.22,
                ease: "easeOut",
            })
            return () => settle.stop()
        }
        const cue = animate(idleX, [0, px(8), px(8), 0], {
            duration: 1.5,
            times: [0, 0.34, 0.52, 1],
            ease: ["easeOut", "linear", "easeInOut"],
            repeat: Infinity,
            repeatDelay: 2.4,
        })
        return () => cue.stop()
    }, [disabled, fit, freeze, idleX, open])

    function commit(target: 0 | 1) {
        const wasOpen = openRef.current
        const nextOpen = target === 1
        openRef.current = nextOpen
        setOpen(nextOpen)
        if (nextOpen !== wasOpen) {
            if (nextOpen) onOpen?.()
            else onClose?.()
        }
        if (freeze) {
            progress.set(target)
            return
        }
        animate(progress, target, {
            type: "spring",
            stiffness: clamp(motionProps.stiffness, 300, 380),
            damping: clamp(motionProps.damping, 30, 38),
        })
    }

    useEffect(() => {
        if (thumb || dragRef.current) return
        const target = layout.startOpen ? 1 : 0
        if (openRef.current === (target === 1) && progress.get() === target)
            return
        commit(target)
    }, [layout.startOpen, thumb])

    function onRootPointerMove(event: PointerEvent<HTMLDivElement>) {
        if (freeze || disabled || dragRef.current) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const px = (event.clientX - rect.left) / rect.width - 0.5
        const py = (event.clientY - rect.top) / rect.height - 0.5
        const max = clamp(motionProps.tiltAmount, 0, 20)
        tiltY.set(clamp(px * 2 * max, -max, max))
        tiltX.set(clamp(-py * 2 * max, -max, max))
    }

    function onRootPointerLeave() {
        if (freeze || disabled) return
        tiltX.set(0)
        tiltY.set(0)
    }

    function onTabPointerDown(event: PointerEvent<HTMLButtonElement>) {
        if (disabled || isStatic) return
        dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            origin: progress.get(),
            moved: false,
        }
        try {
            event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
            // Untrusted pointers have nothing to capture. Move and up still bubble.
        }
        tiltX.set(0)
        tiltY.set(0)
    }

    function onTabPointerMove(event: PointerEvent<HTMLButtonElement>) {
        const drag = dragRef.current
        if (!drag || disabled || isStatic) return
        const along = event.clientX - drag.x
        if (Math.abs(along) > 4) drag.moved = true
        const travel = Math.max(88, widthRef.current * 0.34)
        progress.set(clamp(drag.origin + along / travel, 0, 1))
        pageSkew.set(clamp(event.movementX * 0.35, -6, 6))
        dragLift.set(clamp(-Math.abs(event.movementX) * 0.45, -14, 0))
    }

    function endDrag() {
        const drag = dragRef.current
        dragRef.current = null
        if (!freeze) {
            animate(pageSkew, 0, {
                type: "spring",
                stiffness: 280,
                damping: 22,
            })
            animate(dragLift, 0, {
                type: "spring",
                stiffness: 280,
                damping: 22,
            })
        } else {
            pageSkew.set(0)
            dragLift.set(0)
        }
        if (!drag || disabled || isStatic) return
        if (!drag.moved) {
            commit(openRef.current ? 0 : 1)
            return
        }
        commit(progress.get() >= 0.5 ? 1 : 0)
    }

    function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (disabled || isStatic) return
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        commit(openRef.current ? 0 : 1)
    }

    function onCardClick(event: MouseEvent<HTMLDivElement>) {
        if (disabled || isStatic || !openRef.current) return
        if ((event.target as HTMLElement).closest("button")) return
        commit(0)
    }

    const sheetKicker =
        content.fileLine.trim().toLowerCase() ===
        content.warningTitle.trim().toLowerCase()
            ? ""
            : content.fileLine
    const resume = workOf(content)
    const signOff = (
        content.signature ??
        defaults.content.signature ??
        ""
    ).trim()
    const workLabel = (
        content.workLabel ??
        defaults.content.workLabel ??
        ""
    ).trim()
    const portraitKind = portraitOf(content.portrait)
    const portraitImage = fileOf(content.portraitImage)
    const showPortrait =
        portraitKind !== "none" &&
        (portraitKind !== "image" || portraitImage !== "")
    const bodyLines = (content.warningBody ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    const introGap = bodyLines.length > 0 ? 1 : 0
    const pageRows = Math.floor((frameH * 0.86 - px(18)) / row)
    const sectionRows = workLabel && resume.length > 0 ? 1 : 0
    const gapRows = sectionRows
    const afterSection = sectionRows
    const focusGap = content.punchline.trim() ? 1 : 0
    const signGap = signOff ? 1 : 0
    let free = Math.max(
        0,
        pageRows -
            (3 +
                introGap +
                (signOff ? 2 : 0) +
                sectionRows +
                gapRows +
                afterSection +
                focusGap +
                signGap +
                2)
    )
    const summaryShown = bodyLines.slice(0, Math.min(3, bodyLines.length, free))
    free -= summaryShown.length
    const workShown = resume.slice(0, Math.min(5, resume.length, free))
    free -= workShown.length
    const showFocus = content.punchline.trim() !== "" && free >= 1
    const showSection = workLabel !== "" && workShown.length > 0

    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        width: frameLength(style?.width, 520),
        height: frameLength(style?.height, 480),
        overflow: thumb ? "hidden" : "visible",
        perspective: 1400,
        perspectiveOrigin: "50% 46%",
        userSelect: "none",
        WebkitUserSelect: "none",
        fontFamily: bodyFont.fontFamily ?? FONT,
        fontVariantNumeric: "tabular-nums",
        WebkitFontSmoothing: "antialiased",
        color: look.inkColor,
        boxSizing: "border-box",
        ...(thumb ? { background: STAGE } : null),
    }

    return (
        <div
            ref={rootRef}
            role="group"
            aria-labelledby={labelId}
            data-open={open ? "true" : "false"}
            style={rootStyle}
            onPointerMove={onRootPointerMove}
            onPointerLeave={onRootPointerLeave}
        >
            <style>{`
                .cf-tab:focus-visible, .cf-sticker:focus-visible {
                    outline: 2px solid ${look.accentColor};
                    outline-offset: 3px;
                }
            `}</style>
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left: "10%",
                    right: "6%",
                    bottom: "0%",
                    height: "28%",
                    borderRadius: "50%",
                    background:
                        "radial-gradient(closest-side, rgba(72, 36, 18, 0.22), rgba(72, 36, 18, 0) 72%)",
                    filter: "blur(28px)",
                    pointerEvents: "none",
                }}
            />
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left: "24%",
                    right: "16%",
                    bottom: "8%",
                    height: "8%",
                    borderRadius: "50%",
                    background:
                        "radial-gradient(closest-side, rgba(28, 16, 12, 0.38), rgba(28, 16, 12, 0) 74%)",
                    filter: "blur(6px)",
                    pointerEvents: "none",
                }}
            />
            <motion.div
                style={{
                    position: "absolute",
                    left: thumb ? "18%" : "10%",
                    top: thumb ? "17%" : "5%",
                    width: thumb ? "42%" : "66%",
                    height: thumb ? "60%" : "86%",
                    x: thumb ? 0 : rigShift,
                    scale: thumb ? 0.68 : freeze ? (open ? 0.72 : 1) : rigScale,
                    rotateX: freeze
                        ? pose(open ? 1 : 0).rigX * turnOf(motionProps.incline)
                        : rigX,
                    rotateY: freeze
                        ? pose(open ? 1 : 0).rigY * turnOf(motionProps.incline)
                        : rigY,
                    transformStyle: "preserve-3d",
                    transformOrigin: "50% 58%",
                }}
            >
                <BackCover folderColor={look.folderColor} />
                <PageBlock
                    card={look.cardColor}
                    ink={look.inkColor}
                    slide={idleX}
                    fit={fit}
                    opacity={freeze ? (open ? 0 : 1) : peekOpacity}
                />
                <FolderSlab
                    folderColor={look.folderColor}
                    accentColor={look.accentColor}
                    texture={look.texture}
                    margin={look.margin}
                    label={cover.folderLabel}
                    fileLine={content.fileLine}
                    mark={cover.mark}
                    titleFont={titleFont}
                    roleFont={subtitleFont}
                    labelId={labelId}
                    labelOpacity={1}
                    tiltX={freeze ? 0 : tiltX}
                    tiltY={freeze ? 0 : tiltY}
                    light={motionProps.light}
                    fit={fit}
                    hit={!disabled && !freeze}
                    onPress={() => {
                        if (disabled || isStatic) return
                        commit(open ? 0 : 1)
                    }}
                    coverY={freeze ? pose(open ? 1 : 0).coverY : coverTurn}
                />
                <motion.button
                    type="button"
                    className="cf-tab"
                    aria-label={content.tabLabel}
                    aria-expanded={open}
                    disabled={disabled}
                    onPointerDown={onTabPointerDown}
                    onPointerMove={onTabPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onKeyDown={onTabKeyDown}
                    style={{
                        position: "absolute",
                        top: 8,
                        bottom: 8,
                        right: -20,
                        width: 48,
                        margin: 0,
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        cursor: disabled ? "default" : "grab",
                        touchAction: "none",
                        x: idleX,
                        opacity: freeze ? (open ? 0 : 1) : tabOpacity,
                        pointerEvents: open ? "none" : "auto",
                        zIndex: 5,
                    }}
                />
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        x: freeze ? `${pose(open ? 1 : 0).x}%` : x,
                        y: freeze ? `${pose(open ? 1 : 0).y}%` : y,
                        z: freeze ? pose(open ? 1 : 0).z : lift,
                        rotateZ: freeze ? pose(open ? 1 : 0).rotateZ : cardSpin,
                        zIndex: freeze ? (open ? 5 : 1) : cardZ,
                        skewX: freeze ? 0 : pageSkew,
                        transformOrigin: "22% 70%",
                        pointerEvents: "none",
                    }}
                >
                    <motion.div
                        onClick={onCardClick}
                        style={{
                            position: "absolute",
                            left: "13%",
                            top: "0%",
                            width: "100%",
                            height: "100%",
                            borderRadius: 8,
                            background: `linear-gradient(162deg, rgba(255,255,255,0.6), rgba(255,255,255,0) 34%), radial-gradient(130% 90% at 100% 100%, rgba(128,104,72,0.1), rgba(128,104,72,0) 62%), ${look.cardColor}`,
                            boxShadow:
                                "0 18px 30px rgba(28, 22, 16, 0.16), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 0 1px rgba(72,56,36,0.07)",
                            overflow: "hidden",
                            pointerEvents: "auto",
                            y: freeze ? 0 : dragLift,
                        }}
                    >
                        <PaperTexture />
                        <NotebookLines
                            ink={look.inkColor}
                            accent={look.accentColor}
                            fit={fit}
                        />
                        <motion.div
                            aria-hidden={open ? undefined : true}
                            style={{
                                position: "relative",
                                opacity: freeze ? (open ? 1 : 0) : textOpacity,
                                padding: `${px(18)}px ${px(22)}px 0 ${px(46)}px`,
                                height: "100%",
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    flex: "none",
                                    height: row * 3,
                                }}
                            >
                                <SheetRow
                                    row={row * 2}
                                    pad={Math.round(row * 0.16)}
                                >
                                    <span
                                        style={{
                                            ...titleStyle,
                                            paddingRight: showPortrait
                                                ? px(84)
                                                : 0,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {content.warningTitle}
                                    </span>
                                </SheetRow>
                                {sheetKicker ? (
                                    <SheetRow row={row}>
                                        <span
                                            style={{
                                                ...subtitleStyle,
                                                textTransform: "none",
                                                color: mute(look.inkColor, 70),
                                            }}
                                        >
                                            {sheetKicker}
                                        </span>
                                    </SheetRow>
                                ) : null}
                                {showPortrait ? (
                                    <Portrait
                                        kind={portraitKind}
                                        image={portraitImage}
                                        ink={look.inkColor}
                                        paper={look.cardColor}
                                        live={open && !freeze}
                                        width={px(64)}
                                        height={row * 2 + px(8)}
                                        top={px(4)}
                                        right={px(16)}
                                    />
                                ) : null}
                            </div>
                            {summaryShown.length > 0 ? (
                                <div style={{ height: row, flex: "none" }} />
                            ) : null}
                            {summaryShown.map((line) => (
                                <SheetRow key={line} row={row}>
                                    <span
                                        style={{
                                            ...bodyStyle,
                                            color: mute(look.inkColor, 78),
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {line}
                                    </span>
                                </SheetRow>
                            ))}
                            {showSection ? (
                                <div style={{ height: row, flex: "none" }} />
                            ) : null}
                            {showSection ? (
                                <SheetRow row={row}>
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: px(10),
                                            width: "100%",
                                            minWidth: 0,
                                        }}
                                    >
                                        <span
                                            style={{
                                                flex: "none",
                                                ...tagStyle,
                                            }}
                                        >
                                            {workLabel}
                                        </span>
                                        <span
                                            style={{
                                                flex: 1,
                                                height: 1,
                                                background: mute(
                                                    look.inkColor,
                                                    18
                                                ),
                                            }}
                                        />
                                    </span>
                                </SheetRow>
                            ) : null}
                            {showSection ? (
                                <div style={{ height: row, flex: "none" }} />
                            ) : null}
                            {workShown.map((line) => (
                                <SheetRow
                                    key={`${line.when}-${line.role}-${line.place}`}
                                    row={row}
                                >
                                    <span
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: `${px(58)}px ${px(136)}px ${px(118)}px`,
                                            columnGap: px(8),
                                            width: "100%",
                                            alignItems: "baseline",
                                        }}
                                    >
                                        <span
                                            style={{
                                                ...bodyStyle,
                                                fontSize: Math.round(
                                                    fontPx(bodyFont, 12) *
                                                        (11 / 12) *
                                                        fit
                                                ),
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                                color: mute(look.inkColor, 48),
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {line.when}
                                        </span>
                                        <span
                                            style={{
                                                ...bodyStyle,
                                                minWidth: 0,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {line.role}
                                        </span>
                                        <span
                                            style={{
                                                ...bodyStyle,
                                                minWidth: 0,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                color: mute(look.inkColor, 46),
                                            }}
                                        >
                                            {line.place}
                                        </span>
                                    </span>
                                </SheetRow>
                            ))}
                            {showFocus ? (
                                <div style={{ height: row, flex: "none" }} />
                            ) : null}
                            {showFocus ? (
                                <SheetRow row={row}>
                                    <span
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: `${px(58)}px ${px(136)}px ${px(118)}px`,
                                            columnGap: px(8),
                                            width: "100%",
                                            alignItems: "baseline",
                                        }}
                                    >
                                        <span />
                                        <span style={tagStyle}>
                                            {content.punchline}
                                        </span>
                                    </span>
                                </SheetRow>
                            ) : null}
                            {signOff ? (
                                <div
                                    style={{ height: row * 2, flex: "none" }}
                                />
                            ) : null}
                            {signOff ? (
                                <div style={{ flex: "none" }}>
                                    <div
                                        style={{
                                            position: "relative",
                                            height: row * 2,
                                            display: "flex",
                                            alignItems: "flex-end",
                                            paddingBottom: px(5),
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: SCRIPT,
                                                fontSize: px(22),
                                                fontWeight: 600,
                                                lineHeight: 1,
                                                color: look.accentColor,
                                            }}
                                        >
                                            {signOff}
                                        </span>
                                        <span
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                bottom: 0,
                                                width: px(108),
                                                height: 1,
                                                background: mute(
                                                    look.inkColor,
                                                    28
                                                ),
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : null}
                            <div style={{ height: row * 2, flex: "none" }} />
                        </motion.div>
                    </motion.div>
                    {look.stickers !== false ? (
                        <div
                            style={{
                                position: "absolute",
                                left: "13%",
                                top: 0,
                                width: "100%",
                                height: "100%",
                                pointerEvents: "none",
                                zIndex: 8,
                            }}
                        >
                            <Stickers
                                open={open}
                                freeze={freeze}
                                accent={look.accentColor}
                                ink={look.inkColor}
                                paper={look.cardColor}
                                items={stickerItems}
                                tiltX={freeze ? 0 : tiltX}
                                tiltY={freeze ? 0 : tiltY}
                            />
                        </div>
                    ) : null}
                </motion.div>
            </motion.div>
        </div>
    )
}

Kern_Notebook.displayName = "Notebook"

const CREDIT =
    "[Explore more components](https://www.framer.com/%40builtbykern/)\n[Made in Framer](https://www.framer.com/?via=builtbykern)"

const demoStickers: StickerInput[] = [
    {
        art: "site",
        label: "Website",
        link: "https://www.framer.com/@builtbykern/",
    },
    {
        art: "contra",
        label: "Contra",
        link: "https://www.framer.com/marketplace/templates/rail-folio/",
    },
    {
        art: "framer",
        label: "Framer",
        link: "https://www.framer.com/@builtbykern/?tab=component",
    },
    {
        art: "figma",
        label: "Figma",
        link: "https://www.framer.com/marketplace/components/pill-lens/",
    },
]

addPropertyControls(Kern_Notebook, {
    content: {
        type: ControlType.Object,
        title: "Content",
        description: "Words on the page.",
        controls: {
            warningTitle: {
                type: ControlType.String,
                title: "Name",
                defaultValue: defaults.content.warningTitle,
                description: "Name at the top of the page.",
            },
            fileLine: {
                type: ControlType.String,
                title: "Role",
                defaultValue: defaults.content.fileLine,
                description:
                    "Role under the name, and the small line on the cover.",
            },
            warningBody: {
                type: ControlType.String,
                title: "Summary",
                defaultValue: defaults.content.warningBody,
                displayTextArea: true,
                description:
                    "Short lines under the name. Up to three. One line break makes a new line.",
            },
            workLabel: {
                type: ControlType.String,
                title: "Section",
                defaultValue: defaults.content.workLabel,
                description: "Label above the work lines. Set in Tag.",
            },
            work: {
                type: ControlType.Array,
                title: "Work",
                maxCount: 5,
                defaultValue: defaults.content.work,
                description:
                    "Up to five. The page keeps the ones that fit, newest first.",
                control: {
                    type: ControlType.Object,
                    controls: {
                        when: {
                            type: ControlType.String,
                            title: "When",
                            defaultValue: "Now",
                            description: "Date on this line.",
                        },
                        role: {
                            type: ControlType.String,
                            title: "Role",
                            defaultValue: "Independent",
                            description: "Role on this line.",
                        },
                        place: {
                            type: ControlType.String,
                            title: "Place",
                            defaultValue: "Porto",
                            description: "Place on this line.",
                        },
                    },
                },
            },
            punchline: {
                type: ControlType.String,
                title: "Focus",
                defaultValue: defaults.content.punchline,
                displayTextArea: true,
                description:
                    "A last line, such as a typeface. Set in Tag. Leave empty to hide it.",
            },
            signature: {
                type: ControlType.String,
                title: "Signature",
                defaultValue: defaults.content.signature,
                description:
                    "Script at the bottom of the page. Leave empty to hide it.",
            },
            portrait: {
                type: ControlType.Enum,
                title: "Portrait",
                defaultValue: defaults.content.portrait,
                options: ["noa", "kai", "ren", "ivy", "image", "none"],
                optionTitles: ["Noa", "Kai", "Ren", "Ivy", "Upload", "None"],
                description:
                    "Ink portrait beside the name. It draws itself when the page opens.",
            },
            portraitImage: {
                type: ControlType.File,
                title: "Photo",
                allowedFileTypes: ["jpg", "jpeg", "png", "webp", "svg"],
                hidden: (props: { portrait?: string }) =>
                    props.portrait !== "image",
                description:
                    "Photo in the portrait frame. Used when Portrait is Upload.",
            },
            tabLabel: {
                type: ControlType.String,
                title: "Handle",
                defaultValue: defaults.content.tabLabel,
                description:
                    "Read by a screen reader on the drag handle. It does not print.",
            },
        },
    },
    cover: {
        type: ControlType.Object,
        title: "Cover",
        description: "The closed notebook.",
        controls: {
            folderLabel: {
                type: ControlType.String,
                title: "Word",
                defaultValue: defaults.cover.folderLabel,
                description: "Word on the closed cover.",
            },
            mark: {
                type: ControlType.Enum,
                title: "Mark",
                defaultValue: defaults.cover.mark,
                options: ["ink", "stamp"],
                optionTitles: ["Ink", "Stamp"],
                displaySegmentedControl: true,
                description:
                    "Ink sits on the cover. Stamp presses the word and the line above into it.",
            },
            texture: {
                type: ControlType.Enum,
                title: "Texture",
                defaultValue: defaults.cover.texture,
                options: ["plain", "leather", "cloth", "suede"],
                optionTitles: ["Plain", "Leather", "Cloth", "Suede"],
                description:
                    "Cover material. The Folder color stays underneath.",
            },
            margin: {
                type: ControlType.Number,
                title: "Margin",
                defaultValue: defaults.cover.margin,
                min: 8,
                max: 64,
                step: 1,
                unit: "px",
                description:
                    "Space between the cover type and the left binding.",
            },
        },
    },
    type: {
        type: ControlType.Object,
        title: "Type",
        description:
            "One font for each role on the page. Size scales with the frame.",
        controls: {
            title: {
                type: ControlType.Font,
                title: "Title",
                controls: "extended",
                defaultFontType: "serif",
                displayTextAlignment: false,
                defaultValue: {
                    fontSize: "32px",
                    letterSpacing: "-0.03em",
                    lineHeight: "0.92em",
                },
                description:
                    "The name on the page. The cover word uses this family.",
            },
            subtitle: {
                type: ControlType.Font,
                title: "Subtitle",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayTextAlignment: false,
                defaultValue: {
                    fontSize: "12px",
                    variant: "Medium",
                    letterSpacing: "-0.011em",
                    lineHeight: "1em",
                },
                description:
                    "The role under the name. The cover line uses this family.",
            },
            body: {
                type: ControlType.Font,
                title: "Body",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayTextAlignment: false,
                defaultValue: {
                    fontSize: "12px",
                    variant: "Regular",
                    letterSpacing: "-0.012em",
                    lineHeight: "1em",
                },
                description: "Summary, dates, roles, and places.",
            },
            tag: {
                type: ControlType.Font,
                title: "Tag",
                controls: "extended",
                defaultFontType: "serif",
                displayTextAlignment: false,
                defaultValue: {
                    fontSize: "15px",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
                description: "Section label and the focus line.",
            },
        },
    },
    stickers: {
        type: ControlType.Object,
        title: "Stickers",
        description: "Marks around the open page.",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Shows or hides every sticker.",
            },
            items: {
                type: ControlType.Array,
                title: "List",
                maxCount: 4,
                defaultValue: demoStickers,
                description:
                    "Up to four. Art is the platform. Order is the corner. Each sticker has its own size.",
                control: {
                    type: ControlType.Object,
                    controls: {
                        art: {
                            type: ControlType.Enum,
                            title: "Art",
                            defaultValue: "framer",
                            options: [
                                "site",
                                "contra",
                                "framer",
                                "figma",
                                "arena",
                                "cursor",
                                "grok",
                                "chatgpt",
                                "claude",
                                "gemini",
                                "linkedin",
                                "type",
                                "css",
                                "lock",
                                "eye",
                                "secret",
                                "warning",
                                "mark",
                                "tag",
                                "image",
                            ],
                            optionTitles: [
                                "Website",
                                "Contra",
                                "Framer",
                                "Figma",
                                "Are.na",
                                "Cursor",
                                "Grok",
                                "ChatGPT",
                                "Claude",
                                "Gemini",
                                "LinkedIn",
                                "Type",
                                "CSS",
                                "Lock",
                                "Eye",
                                "Secret",
                                "Warning",
                                "Monogram",
                                "Tag",
                                "Upload",
                            ],
                            description:
                                "Drawing on this sticker. Upload uses File.",
                        },
                        image: {
                            type: ControlType.File,
                            title: "File",
                            allowedFileTypes: [
                                "svg",
                                "png",
                                "webp",
                                "jpg",
                                "jpeg",
                            ],
                            hidden: (props: { art?: string }) =>
                                props.art !== "image",
                            description:
                                "Image for this sticker. Used when Art is Upload.",
                        },
                        size: {
                            type: ControlType.Number,
                            title: "Size",
                            defaultValue: 100,
                            min: 60,
                            max: 150,
                            step: 1,
                            unit: "%",
                            description:
                                "Size of this sticker relative to the page.",
                        },
                        label: {
                            type: ControlType.String,
                            title: "Name",
                            defaultValue: "Sticker",
                            placeholder: "TOP SECRET",
                            description:
                                "Accessible name. Prints on Secret, Monogram, and Tag.",
                        },
                        link: {
                            type: ControlType.Link,
                            title: "Link",
                            description:
                                "Where this sticker opens. Leave empty and it stays still.",
                        },
                    },
                },
            },
        },
    },
    color: {
        type: ControlType.Object,
        title: "Color",
        description: "Cover, page, text, and the accent.",
        controls: {
            folderColor: {
                type: ControlType.Color,
                title: "Folder",
                defaultValue: defaults.color.folderColor,
                description: "Cover color.",
            },
            cardColor: {
                type: ControlType.Color,
                title: "Page",
                defaultValue: defaults.color.cardColor,
                description: "Page color.",
            },
            inkColor: {
                type: ControlType.Color,
                title: "Ink",
                defaultValue: defaults.color.inkColor,
                description: "Text on the page.",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: defaults.color.accentColor,
                description:
                    "Signature, the vertical rule, and details on the stickers.",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "How the notebook starts, and whether it can be opened.",
        controls: {
            startOpen: {
                type: ControlType.Boolean,
                title: "Start",
                defaultValue: defaults.layout.startOpen,
                enabledTitle: "Open",
                disabledTitle: "Closed",
                description: "The notebook is already open, on the canvas too.",
            },
            disabled: {
                type: ControlType.Boolean,
                title: "Disabled",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Turns off opening, dragging, and tilt.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            tiltAmount: {
                type: ControlType.Number,
                title: "Tilt",
                defaultValue: defaults.motion.tiltAmount,
                min: 0,
                max: 8,
                step: 1,
                unit: "°",
                description:
                    "A slight lean toward the pointer. Eight degrees is the limit.",
            },
            incline: {
                type: ControlType.Number,
                title: "Incline",
                defaultValue: defaults.motion.incline,
                min: -34,
                max: -20,
                step: 1,
                unit: "°",
                description: "A few degrees around the designed turn.",
            },
            light: {
                type: ControlType.Number,
                title: "Light",
                defaultValue: defaults.motion.light,
                min: 20,
                max: 60,
                step: 1,
                unit: "%",
                description: "A small highlight on the cover.",
            },
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                defaultValue: defaults.motion.stiffness,
                min: 300,
                max: 380,
                step: 10,
                description:
                    "A small change in how quickly the page opens and closes.",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                defaultValue: defaults.motion.damping,
                min: 30,
                max: 38,
                step: 1,
                description:
                    "How little the page bounces. The whole range stays close.",
            },
        },
        description: CREDIT,
    },
    onOpen: {
        type: ControlType.EventHandler,
        title: "Open",
        description: "Fires when the notebook opens.",
    },
    onClose: {
        type: ControlType.EventHandler,
        title: "Close",
        description: "Fires when the notebook closes.",
    },
})

function PageBlock(props: {
    card: string
    ink: string
    slide: MotionValue<number>
    fit: number
    opacity: number | MotionValue<number>
}) {
    const row = Math.max(12, Math.round(18 * props.fit))
    const lead = Math.round(14 * props.fit)
    return (
        <motion.div
            aria-hidden
            style={{
                position: "absolute",
                top: Math.round(4 * props.fit),
                bottom: Math.round(4 * props.fit),
                right: Math.round(-16 * props.fit),
                width: Math.round(84 * props.fit),
                x: props.slide,
                opacity: props.opacity,
                pointerEvents: "none",
                zIndex: 1,
                borderRadius: "0 2px 2px 0",
                backgroundColor: props.card,
                backgroundImage: `linear-gradient(90deg, rgba(40, 24, 16, 0.16), transparent 30%), repeating-linear-gradient(to bottom, transparent 0 ${row - 1}px, ${mute(props.ink, 18)} ${row - 1}px ${row}px)`,
                backgroundSize: `100% 100%, 100% ${row}px`,
                backgroundPosition: `0 0, 0 ${lead}px`,
                boxShadow: "2px 1px 2px rgba(40, 24, 16, 0.12)",
            }}
        />
    )
}

function FolderSlab(props: {
    folderColor: string
    accentColor: string
    texture: CoverTexture
    margin: number
    label: string
    fileLine: string
    mark: CoverMark
    titleFont?: FontFace
    roleFont?: FontFace
    labelId: string
    labelOpacity: number | MotionValue<number>
    tiltX: number | MotionValue<number>
    tiltY: number | MotionValue<number>
    coverY: number | MotionValue<number>
    light: number
    fit: number
    hit: boolean
    onPress: () => void
}) {
    const {
        folderColor,
        texture,
        margin,
        label,
        fileLine,
        mark,
        titleFont,
        roleFont,
        labelId,
        labelOpacity,
        tiltX,
        tiltY,
        coverY,
        light,
        fit,
        hit,
        onPress,
    } = props
    const sheenX = useTransform(() => `${-num(tiltY) * 2.2}%`)
    const sheenY = useTransform(() => `${num(tiltX) * 2.2}%`)
    const baseSheen =
        texture === "leather"
            ? 0.1
            : texture === "suede"
              ? 0.04
              : texture === "cloth"
                ? 0.06
                : 0.13
    const sheen = Math.min(0.45, baseSheen * (clamp(light, 0, 100) / 40))
    return (
        <>
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "3px 11px 11px 3px",
                    background: `color-mix(in srgb, ${folderColor} 70%, #0c0a08)`,
                    transform: "translateZ(-3px)",
                }}
            />
            <motion.div
                onClick={() => {
                    if (!hit) return
                    onPress()
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "3px 11px 11px 3px",
                    background: `linear-gradient(90deg, transparent 18px, rgba(0,0,0,0.34) 18px, rgba(0,0,0,0.34) 19px, transparent 20px), linear-gradient(172deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 46%, rgba(0,0,0,0.16)), ${folderColor}`,
                    boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.32), inset -1px 0 0 rgba(255,255,255,0.05)",
                    overflow: "hidden",
                    zIndex: 2,
                    pointerEvents: hit ? "auto" : "none",
                    cursor: hit ? "pointer" : undefined,
                    transformOrigin: "0% 50%",
                    rotateY: coverY,
                    ...({ containerType: "inline-size" } as CSSProperties),
                }}
            >
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: GRAIN,
                        backgroundSize: "180px 180px",
                        mixBlendMode: "soft-light",
                        opacity: 0.6,
                        ...coverGrain(texture),
                    }}
                />
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: 22,
                        background: `linear-gradient(90deg, color-mix(in srgb, ${folderColor} 55%, #1a0909) 0 16px, rgba(0,0,0,0.45) 16px 17px, color-mix(in srgb, ${folderColor} 78%, #000) 17px)`,
                        boxShadow:
                            "inset -1px 0 0 rgba(255,255,255,0.08), 1px 0 0 rgba(0,0,0,0.28)",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            top: 2,
                            left: 3,
                            right: 3,
                            height: 3,
                            background: FOIL,
                        }}
                    />
                    <span
                        style={{
                            position: "absolute",
                            bottom: 2,
                            left: 3,
                            right: 3,
                            height: 3,
                            background: FOIL,
                        }}
                    />
                </div>
                <motion.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: "-50%",
                        top: "-50%",
                        width: "200%",
                        height: "200%",
                        x: sheenX,
                        y: sheenY,
                        background: `radial-gradient(34% 30% at 34% 30%, rgba(255,255,255,${sheen}), rgba(255,255,255,0) 100%)`,
                    }}
                />
                <motion.div
                    style={{
                        position: "absolute",
                        inset: `${Math.round(22 * fit)}px ${Math.round(14 * fit)}px ${Math.round(22 * fit)}px ${Math.round((18 + margin) * fit)}px`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        opacity: labelOpacity,
                    }}
                >
                    <p
                        style={{
                            ...META,
                            margin: 0,
                            fontFamily: roleFont?.fontFamily,
                            fontWeight: roleFont?.fontWeight ?? META.fontWeight,
                            fontStyle: roleFont?.fontStyle,
                            fontSize: "clamp(8px, 3.2cqw, 11px)",
                            letterSpacing: "-0.01em",
                            textTransform: "none",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            ...coverLetter(mark, folderColor, true),
                        }}
                    >
                        {fileLine}
                    </p>
                    <p
                        id={labelId}
                        style={{
                            margin: 0,
                            maxWidth: "100%",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            fontFamily: titleFont?.fontFamily,
                            fontStyle: titleFont?.fontStyle,
                            fontSize: `min(${fit < 0.85 ? "6.4cqw" : "8.4cqw"}, calc(100cqw / ${(Math.max(label.length, 6) * 0.78).toFixed(2)}))`,
                            fontWeight: 700,
                            letterSpacing: "-0.03em",
                            lineHeight: 0.92,
                            textTransform: "uppercase",
                            ...coverLetter(mark, folderColor, false),
                        }}
                    >
                        {label}
                    </p>
                </motion.div>
            </motion.div>
        </>
    )
}

function BackCover(props: { folderColor: string }) {
    const back = `color-mix(in srgb, ${props.folderColor} 76%, #0c0a08)`
    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                transform: "translate3d(7px, 0, -16px)",
                transformStyle: "preserve-3d",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "3px 11px 11px 3px",
                    background: back,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
            />
        </div>
    )
}

type ArtProps = {
    accent: string
    ink: string
    paper: string
    open: boolean
    freeze: boolean
    tiltX: number | MotionValue<number>
    tiltY: number | MotionValue<number>
    label: string
}

type StickerSpec = {
    left: number
    top: number
    width: number
    name: string
    rotate: number
    spin: number
    z: number
    fromX: number
    fromY: number
    viewBox: string
    Art: (props: ArtProps) => JSX.Element
}

const STAMP = 18

const CORNERS = [
    { x: 0, y: 0, hangX: -22, hangY: -40 },
    { x: 1, y: 0, hangX: -56, hangY: -24 },
    { x: 1, y: 1, hangX: -80, hangY: -82 },
    { x: 0, y: 1, hangX: -32, hangY: -54 },
]

function markWidth(art: string) {
    switch (art) {
        case "site":
            return 16
        case "tag":
        case "secret":
            return 22
        case "type":
        case "css":
            return 18
        default:
            return STAMP
    }
}

const CUT = {
    fill: "#fff",
    stroke: "#fff",
    strokeLinejoin: "round",
    strokeLinecap: "round",
} as const

const STICKERS: StickerSpec[] = [
    {
        left: -18,
        top: -6,
        width: 18,
        name: "Lock",
        rotate: -14,
        spin: -40,
        z: 64,
        fromX: 357,
        fromY: 188,
        viewBox: "0 0 100 100",
        Art: ({ accent, ink }) => (
            <>
                <g {...CUT} strokeWidth={12}>
                    <path
                        d="M31 46V33a19 19 0 0 1 38 0v13"
                        fill="none"
                        strokeWidth={12}
                    />
                    <rect x={18} y={44} width={64} height={46} rx={10} />
                </g>
                <path
                    d="M31 46V33a19 19 0 0 1 38 0v13"
                    fill="none"
                    stroke={ink}
                    strokeWidth={8}
                    strokeLinecap="round"
                />
                <rect
                    x={18}
                    y={44}
                    width={64}
                    height={46}
                    rx={10}
                    fill={accent}
                    stroke={ink}
                    strokeWidth={3}
                />
                <circle cx={50} cy={63} r={6.5} fill={ink} />
                <rect x={47} y={64} width={6} height={13} rx={3} fill={ink} />
            </>
        ),
    },
    {
        left: 84,
        top: -8,
        width: 16,
        name: "Eye",
        rotate: 12,
        spin: 50,
        z: 78,
        fromX: 0,
        fromY: 170,
        viewBox: "0 0 100 100",
        Art: EyeArt,
    },
    {
        left: 84,
        top: 82,
        width: 18,
        name: "Secret",
        rotate: -9,
        spin: 28,
        z: 70,
        fromX: 27,
        fromY: -350,
        viewBox: "0 0 170 64",
        Art: ({ ink, paper, label }) => (
            <>
                <rect
                    x={6}
                    y={6}
                    width={158}
                    height={52}
                    rx={9}
                    {...CUT}
                    strokeWidth={12}
                />
                <rect x={6} y={6} width={158} height={52} rx={8} fill={ink} />
                <rect
                    x={13}
                    y={13}
                    width={144}
                    height={38}
                    rx={4}
                    fill="none"
                    stroke={paper}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    opacity={0.7}
                />
                <text
                    x={85}
                    y={39.5}
                    textAnchor="middle"
                    fill={paper}
                    style={{
                        fontSize: bannerSize(label),
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                    }}
                >
                    {bannerLine(label)}
                </text>
            </>
        ),
    },
    {
        left: -52,
        top: 58,
        width: 16,
        name: "Warning",
        rotate: 10,
        spin: -36,
        z: 56,
        fromX: 388,
        fromY: -132,
        viewBox: "0 0 100 100",
        Art: ({ accent, ink }) => (
            <>
                <path d="M50 14 L90 82 H10 Z" {...CUT} strokeWidth={12} />
                <path
                    d="M50 14 L90 82 H10 Z"
                    fill="#f4c542"
                    stroke={ink}
                    strokeWidth={4}
                    strokeLinejoin="round"
                />
                <rect
                    x={45.5}
                    y={36}
                    width={9}
                    height={27}
                    rx={4.5}
                    fill={accent}
                />
                <circle cx={50} cy={71.5} r={5} fill={accent} />
            </>
        ),
    },
]

function Stickers(props: {
    open: boolean
    freeze: boolean
    accent: string
    ink: string
    paper: string
    items: StickerItem[]
    tiltX: number | MotionValue<number>
    tiltY: number | MotionValue<number>
}) {
    const { open, freeze, accent, ink, paper, items, tiltX, tiltY } = props
    const count = items.length
    return (
        <>
            {items.map((item, index) => {
                const spec = STICKERS[index] ?? STICKERS[0]
                const corner = CORNERS[index] ?? CORNERS[0]
                const href = item.href
                const delay = 0.14 + index * 0.065
                const transition = freeze
                    ? { duration: 0 }
                    : open
                      ? {
                            type: "spring" as const,
                            stiffness: 460,
                            damping: 34,
                            mass: 0.9,
                            delay: 0.06 + index * 0.04,
                            opacity: { duration: 0.1, delay },
                        }
                      : {
                            duration: 0.2,
                            ease: [0.2, 0, 0, 1] as const,
                            delay: (count - 1 - index) * 0.02,
                        }
                const art = stickerFace(item, {
                    accent,
                    ink,
                    paper,
                    open,
                    freeze,
                    tiltX,
                    tiltY,
                })
                const shared = {
                    className: href ? "cf-sticker" : undefined,
                    initial: false as const,
                    animate: open
                        ? {
                              x: `${corner.hangX}%`,
                              y: `${corner.hangY}%`,
                              scale: 1,
                              rotate: spec.rotate,
                              opacity: 1,
                              z: spec.z,
                          }
                        : {
                              x: `${spec.fromX}%`,
                              y: `${spec.fromY}%`,
                              scale: 0.35,
                              rotate: spec.rotate + spec.spin,
                              opacity: 0,
                              z: -12,
                          },
                    transition,
                    whileHover: href && !freeze ? { scale: 1.08 } : undefined,
                    whileTap: href && !freeze ? { scale: 0.94 } : undefined,
                    style: {
                        position: "absolute" as const,
                        left: `${corner.x * 100}%`,
                        top: `${corner.y * 100}%`,
                        width: `${markWidth(item.art) * item.size}%`,
                        transformOrigin: "50% 50%",
                        zIndex: 8,
                        pointerEvents:
                            href && open
                                ? ("auto" as const)
                                : ("none" as const),
                        cursor: href ? "pointer" : undefined,
                        textDecoration: "none",
                        color: ink,
                        filter: "drop-shadow(0 3px 4px rgba(28,22,16,0.22)) drop-shadow(0 1px 1px rgba(28,22,16,0.18))",
                    },
                    children: art,
                }
                return href ? (
                    <motion.a
                        key={`${index}-${item.art}`}
                        href={href}
                        target={item.blank ? "_blank" : undefined}
                        rel={item.blank ? "noreferrer" : undefined}
                        aria-label={item.label}
                        tabIndex={open ? 0 : -1}
                        {...shared}
                    />
                ) : (
                    <motion.div
                        key={`${index}-${item.art}`}
                        aria-hidden={open ? undefined : true}
                        role={open ? "img" : undefined}
                        aria-label={open ? item.label : undefined}
                        {...shared}
                    />
                )
            })}
        </>
    )
}

function EyeArt(props: ArtProps) {
    const { ink, paper, open, freeze, tiltX, tiltY } = props
    const lookX = useTransform(() => num(tiltY) * 0.9)
    const lookY = useTransform(() => -num(tiltX) * 0.7)
    const almond = "M8 52 Q50 14 92 52 Q50 90 8 52Z"
    const lashes = "M29 29 L24 20 M50 22 V11 M71 29 L76 20"
    return (
        <>
            <g {...CUT}>
                <path d={almond} strokeWidth={12} />
                <path d={lashes} fill="none" strokeWidth={12} />
            </g>
            <path
                d={lashes}
                fill="none"
                stroke={ink}
                strokeWidth={4}
                strokeLinecap="round"
            />
            <motion.g
                initial={false}
                animate={
                    open && !freeze
                        ? { scaleY: [1, 1, 0.08, 1] }
                        : { scaleY: 1 }
                }
                transition={
                    open && !freeze
                        ? {
                              duration: 0.42,
                              times: [0, 0.55, 0.78, 1],
                              delay: 0.9,
                          }
                        : { duration: 0 }
                }
                style={{ transformOrigin: "50px 52px" }}
            >
                <path
                    d={almond}
                    fill={paper}
                    stroke={ink}
                    strokeWidth={3.5}
                    strokeLinejoin="round"
                />
                <motion.g style={{ x: lookX, y: lookY }}>
                    <circle cx={50} cy={52} r={17} fill={ink} />
                    <circle cx={56} cy={46} r={4.5} fill="#fff" />
                </motion.g>
            </motion.g>
        </>
    )
}

function num(value: number | MotionValue<number>) {
    return typeof value === "number" ? value : value.get()
}

function NotebookLines(props: { ink: string; accent: string; fit: number }) {
    const row = Math.max(12, Math.round(18 * props.fit))
    const lead = Math.round(18 * props.fit)
    const margin = Math.round(34 * props.fit)
    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${row - 1}px, ${mute(props.ink, 18)} ${row - 1}px ${row}px), linear-gradient(${props.accent}, ${props.accent})`,
                backgroundSize: `100% ${row}px, 1px 100%`,
                backgroundPosition: `0 ${lead}px, ${margin}px 0`,
                backgroundRepeat: "repeat, no-repeat",
                pointerEvents: "none",
            }}
        />
    )
}

function MarkArt(props: { ink: string; paper: string; label: string }) {
    const letter = (props.label.trim()[0] || "N").toUpperCase()
    return (
        <>
            <circle cx={50} cy={50} r={34} {...CUT} strokeWidth={12} />
            <circle
                cx={50}
                cy={50}
                r={34}
                fill={props.paper}
                stroke={props.ink}
                strokeWidth={3}
            />
            <text
                x={50}
                y={58}
                textAnchor="middle"
                fill={props.ink}
                style={{ fontSize: 34, fontWeight: 700 }}
            >
                {letter}
            </text>
        </>
    )
}

function TagArt(props: {
    ink: string
    paper: string
    accent: string
    label: string
}) {
    const word = (props.label.trim() || "PORTO").slice(0, 8).toUpperCase()
    return (
        <>
            <rect
                x={6}
                y={8}
                width={116}
                height={48}
                rx={8}
                {...CUT}
                strokeWidth={12}
            />
            <rect
                x={6}
                y={8}
                width={116}
                height={48}
                rx={8}
                fill={props.paper}
                stroke={props.ink}
                strokeWidth={2.5}
            />
            <circle cx={24} cy={32} r={4} fill={props.accent} />
            <text
                x={72}
                y={37}
                textAnchor="middle"
                fill={props.ink}
                style={{
                    fontSize: word.length > 5 ? 12 : 15,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                }}
            >
                {word}
            </text>
        </>
    )
}

function PaperTexture() {
    return (
        <>
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: MOTTLE,
                    backgroundSize: "360px 360px",
                    mixBlendMode: "multiply",
                    opacity: 0.14,
                    pointerEvents: "none",
                }}
            />
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: GRAIN,
                    backgroundSize: "180px 180px",
                    mixBlendMode: "multiply",
                    opacity: 0.16,
                    pointerEvents: "none",
                }}
            />
        </>
    )
}

function SheetRow(props: { children: JSX.Element; row: number; pad?: number }) {
    return (
        <div
            style={{
                height: props.row,
                display: "flex",
                alignItems: "flex-end",
                paddingBottom:
                    props.pad ?? Math.max(2, Math.round(props.row * 0.16)),
                boxSizing: "border-box",
                flex: "none",
                minWidth: 0,
            }}
        >
            {props.children}
        </div>
    )
}

const FACES: Record<
    Exclude<PortraitKind, "image" | "none">,
    { draw: string[]; eyes: string }
> = {
    noa: {
        draw: [
            "M40 16 C52 16 58 30 56 44 C58 58 50 68 40 70 C30 68 22 58 24 44 C22 30 28 16 40 16",
            "M26 40 C24 22 32 10 40 10 C48 10 56 22 54 40",
            "M40 46 V53",
            "M35 59 Q40 63 45 59",
            "M34 70 V86 M46 70 V86",
            "M24 94 Q40 86 56 94",
        ],
        eyes: "M33.2 42.4 a1.35 1.35 0 1 0 2.7 0 a1.35 1.35 0 1 0 -2.7 0 M43.2 42.4 a1.35 1.35 0 1 0 2.7 0 a1.35 1.35 0 1 0 -2.7 0",
    },
    kai: {
        draw: [
            "M28 36 C26 24 33 16 40 16 C47 16 54 24 52 36 L54 50 C54 64 48 72 40 74 C32 72 26 64 26 50 Z",
            "M24 32 C30 16 50 16 56 32",
            "M29 40 H39 M41 40 H51 M39 40 H41",
            "M30 38 V44 M38 38 V44 M42 38 V44 M50 38 V44",
            "M40 46 V55",
            "M35 63 H45",
            "M33 74 V90 M47 74 V90",
            "M18 96 Q40 88 62 96",
        ],
        eyes: "M32.2 42.2 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0 M44.2 42.2 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0",
    },
    ren: {
        draw: [
            "M32 38 C30 26 35 18 40 18 C48 18 54 28 52 40 C54 56 47 68 40 70 C32 68 28 54 30 40",
            "M20 46 C16 24 32 8 46 14 C58 20 64 40 56 56 C60 72 48 82 38 76",
            "M40 44 V54",
            "M34 62 Q40 66 46 61",
            "M34 70 V88 M46 70 V88",
            "M22 96 Q40 88 58 96",
        ],
        eyes: "M32.2 42.2 a1.25 1.25 0 1 0 2.5 0 a1.25 1.25 0 1 0 -2.5 0 M44.2 41.4 a1.25 1.25 0 1 0 2.5 0 a1.25 1.25 0 1 0 -2.5 0",
    },
    ivy: {
        draw: [
            "M30 40 C28 28 34 20 40 20 C48 20 54 30 52 42 C54 56 47 66 40 68 C32 66 28 54 30 40",
            "M32 28 H50",
            "M54 14 C60 12 64 20 58 24 C52 28 48 18 54 14",
            "M48 22 C52 16 56 18 54 26",
            "M40 46 V54",
            "M35 60 Q40 63 45 60",
            "M35 68 V86 M45 68 V86",
            "M22 96 Q40 88 58 96",
        ],
        eyes: "M33.2 42.2 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0 M43.2 42.2 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0",
    },
}

function portraitOf(value: unknown): PortraitKind {
    if (
        value === "noa" ||
        value === "kai" ||
        value === "ren" ||
        value === "ivy" ||
        value === "image" ||
        value === "none"
    )
        return value
    return "noa"
}

function Portrait(props: {
    kind: PortraitKind
    image: string
    ink: string
    paper: string
    live: boolean
    width: number
    height: number
    top: number
    right: number
}) {
    const { kind, image, ink, paper, live, width, height, top, right } = props
    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                right,
                top,
                width,
                height,
                transform: "rotate(2deg)",
            }}
        >
            <svg
                viewBox="0 0 80 100"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
            >
                <path
                    d="M6 16 C8 12 70 8 74 14 L76 90 C74 94 10 96 8 90 Z"
                    fill={paper}
                    stroke={ink}
                    strokeWidth={0.7}
                />
                <path
                    d="M32 2 C32 -2 48 -2 48 4 L46 18"
                    fill="none"
                    stroke={ink}
                    strokeWidth={1.3}
                    strokeLinecap="round"
                />
            </svg>
            <div
                style={{
                    position: "absolute",
                    left: "8%",
                    right: "8%",
                    top: "14%",
                    bottom: "8%",
                    overflow: "hidden",
                }}
            >
                {kind === "image" ? (
                    <img
                        src={image}
                        alt=""
                        draggable={false}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: "grayscale(1)",
                            mixBlendMode: "multiply",
                        }}
                    />
                ) : kind === "none" ? null : (
                    <InkPortrait kind={kind} ink={ink} live={live} />
                )}
            </div>
        </div>
    )
}

function InkPortrait(props: {
    kind: Exclude<PortraitKind, "image" | "none">
    ink: string
    live: boolean
}) {
    const { kind, ink, live } = props
    const face = FACES[kind]
    return (
        <svg
            viewBox="0 0 80 96"
            style={{ display: "block", width: "100%", height: "100%" }}
        >
            {face.draw.map((d, index) => (
                <motion.path
                    key={`${kind}-${index}-${live ? "draw" : "still"}`}
                    d={d}
                    fill={index === 0 ? ink : "none"}
                    fillOpacity={index === 0 ? 0.07 : 0}
                    stroke={ink}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: live ? 0 : 1 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                        duration: live ? 0.7 : 0,
                        ease: "easeOut",
                        delay: live ? 0.2 + index * 0.12 : 0,
                    }}
                />
            ))}
            <motion.g
                animate={live ? { scaleY: [1, 1, 0.12, 1] } : { scaleY: 1 }}
                transition={
                    live
                        ? {
                              duration: 0.4,
                              times: [0, 0.45, 0.7, 1],
                              delay: 1.8,
                              repeat: Infinity,
                              repeatDelay: 4.8,
                          }
                        : { duration: 0 }
                }
                style={{ transformBox: "fill-box", transformOrigin: "50% 42%" }}
            >
                <path
                    d={face.eyes}
                    fill="none"
                    stroke={ink}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                />
            </motion.g>
        </svg>
    )
}

function workOf(content: Content) {
    const source = content.work ?? defaults.content.work
    return (source ?? [])
        .map((line) => ({
            when: (line?.when ?? "").trim(),
            role: (line?.role ?? "").trim(),
            place: (line?.place ?? "").trim(),
        }))
        .filter((line) => line.when || line.role || line.place)
        .slice(0, 5)
}

const META: CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.12em",
    lineHeight: 1.2,
    textTransform: "uppercase",
}

function mute(color: string, percent: number) {
    return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

function turnOf(incline: number) {
    return clamp(incline, -34, -20) / -28
}

function pose(progress: number) {
    const p = clamp(progress, 0, 1)
    return {
        x: mix(p, 0, 0.55, 1, -10, 36, 62),
        y: 0,
        rotateZ: mix(p, 0, 0.6, 1, 0, 0.4, -5),
        z: p < 0.84 ? -8 : mix(p, 0.84, 0.94, 1, -8, 32, 32),
        rigX: mix(p, 0, 0.5, 1, 18, 13, 8),
        rigY: mix(p, 0, 0.5, 1, -28, -20, -11),
        textOpacity: smoothstep(0.72, 0.94, p),
        inFront: p > 0.84,
        coverY: mix(p, 0, 0.35, 1, 0, -8, -2),
    }
}

type StickerKind =
    | "lock"
    | "eye"
    | "secret"
    | "warning"
    | "mark"
    | "tag"
    | "image"
    | "site"
    | "contra"
    | "framer"
    | "figma"
    | "arena"
    | "cursor"
    | "grok"
    | "chatgpt"
    | "claude"
    | "gemini"
    | "linkedin"
    | "type"
    | "css"

type StickerItem = {
    art: StickerKind
    image: string
    label: string
    href: string
    blank: boolean
    size: number
}

const stickerDefaults = demoStickers

function resolveStickers(
    items: StickerInput[] | undefined,
    fallbackSize: number
): StickerItem[] {
    const source =
        items && items.length > 0 ? items.slice(0, 4) : stickerDefaults
    const resolved: StickerItem[] = []
    source.forEach((item) => {
        const art = kindOf(item?.art)
        const image = fileOf(item?.image)
        if (art === "image" && image === "") return
        const link = hrefOf(item?.link)
        const label = (item?.label ?? "").trim() || defaultStickerLabel(art)
        resolved.push({
            art,
            image,
            label,
            href: link.href,
            blank: link.blank,
            size: stickerScale(item?.size, fallbackSize),
        })
    })
    return resolved
}

function kindOf(value: unknown): StickerKind {
    if (
        value === "lock" ||
        value === "eye" ||
        value === "secret" ||
        value === "warning" ||
        value === "mark" ||
        value === "tag" ||
        value === "image" ||
        value === "site" ||
        value === "contra" ||
        value === "framer" ||
        value === "figma" ||
        value === "arena" ||
        value === "cursor" ||
        value === "grok" ||
        value === "chatgpt" ||
        value === "claude" ||
        value === "gemini" ||
        value === "linkedin" ||
        value === "type" ||
        value === "css"
    )
        return value
    return "lock"
}

function defaultStickerLabel(art: StickerKind): string {
    switch (art) {
        case "lock":
            return "Lock"
        case "eye":
            return "Eye"
        case "secret":
            return "TOP SECRET"
        case "warning":
            return "Warning"
        case "mark":
            return "N"
        case "tag":
            return "PORTO"
        case "image":
            return "Sticker"
        case "site":
            return "Website"
        case "contra":
            return "Contra"
        case "arena":
            return "Are.na"
        case "cursor":
            return "Cursor"
        case "grok":
            return "Grok"
        case "chatgpt":
            return "ChatGPT"
        case "claude":
            return "Claude"
        case "gemini":
            return "Gemini"
        case "linkedin":
            return "LinkedIn"
        case "framer":
            return "Framer"
        case "figma":
            return "Figma"
        case "type":
            return "Type"
        case "css":
            return "CSS"
        default: {
            const neverArt: never = art
            return neverArt
        }
    }
}

function fileOf(value: unknown) {
    if (typeof value === "string") return value.trim()
    if (value !== null && typeof value === "object" && "src" in value) {
        const src = (value as { src?: unknown }).src
        return typeof src === "string" ? src.trim() : ""
    }
    return ""
}

function bannerLine(label: string) {
    const line = label.trim() || "TOP SECRET"
    return line.slice(0, 14)
}

function bannerSize(label: string) {
    const line = bannerLine(label)
    if (line.length > 11) return 12
    if (line.length > 8) return 14
    return 17
}

function artwork(
    art: Exclude<
        StickerKind,
        | "image"
        | "mark"
        | "tag"
        | "site"
        | "contra"
        | "framer"
        | "figma"
        | "arena"
        | "cursor"
        | "grok"
        | "chatgpt"
        | "claude"
        | "gemini"
        | "linkedin"
        | "type"
        | "css"
    >
): StickerSpec {
    switch (art) {
        case "lock":
            return STICKERS[0]
        case "eye":
            return STICKERS[1]
        case "secret":
            return STICKERS[2]
        case "warning":
            return STICKERS[3]
        default: {
            const neverArt: never = art
            return neverArt
        }
    }
}

function toolLoop(live: boolean, delay: number) {
    return live
        ? {
              duration: 1.6,
              ease: "easeInOut" as const,
              repeat: Infinity,
              repeatDelay: 2.4,
              delay,
          }
        : { duration: 0 }
}

function FramerMark(props: { open: boolean; freeze: boolean }) {
    const live = props.open && !props.freeze
    return (
        <>
            <rect
                x={6}
                y={6}
                width={88}
                height={88}
                rx={20}
                {...CUT}
                strokeWidth={12}
            />
            <rect x={6} y={6} width={88} height={88} rx={18} fill="#0055FF" />
            <motion.g
                animate={live ? { y: [0, -2.2, 0] } : { y: 0 }}
                transition={toolLoop(live, 0.1)}
            >
                <path
                    fill="#fff"
                    d="M4 0h16v8h-8z"
                    transform="translate(21 19) scale(2.4)"
                />
                <path
                    fill="#fff"
                    d="M4 8h8l8 8H4z"
                    transform="translate(21 19) scale(2.4)"
                />
                <path
                    fill="#fff"
                    d="M4 16h8v8z"
                    transform="translate(21 19) scale(2.4)"
                />
            </motion.g>
        </>
    )
}

function FigmaMark(props: { open: boolean; freeze: boolean }) {
    const live = props.open && !props.freeze
    return (
        <>
            <rect
                x={6}
                y={6}
                width={88}
                height={88}
                rx={20}
                {...CUT}
                strokeWidth={12}
            />
            <rect x={6} y={6} width={88} height={88} rx={18} fill="#fff" />
            <g transform="translate(30 16) scale(1.05)">
                <path
                    fill="#F24E1E"
                    d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"
                />
                <path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
                <path
                    fill="#1ABCFE"
                    d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"
                />
                <path
                    fill="#0ACF83"
                    d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"
                />
                <motion.path
                    fill="#A259FF"
                    d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"
                    animate={live ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={toolLoop(live, 0.45)}
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "50% 50%",
                    }}
                />
            </g>
        </>
    )
}

function TypeMark(props: {
    open: boolean
    freeze: boolean
    ink: string
    paper: string
    accent: string
}) {
    const live = props.open && !props.freeze
    return (
        <>
            <rect
                x={4}
                y={8}
                width={132}
                height={70}
                rx={16}
                {...CUT}
                strokeWidth={12}
            />
            <rect
                x={4}
                y={8}
                width={132}
                height={70}
                rx={14}
                fill={props.paper}
                stroke={props.ink}
                strokeWidth={2.5}
            />
            <text
                x={22}
                y={58}
                fill={props.ink}
                style={{ fontSize: 40, fontWeight: 600 }}
            >
                A
            </text>
            <motion.text
                x={64}
                y={58}
                fill={props.ink}
                animate={live ? { skewX: [0, -18, 0] } : { skewX: 0 }}
                transition={toolLoop(live, 0.8)}
                style={{
                    fontSize: 40,
                    fontWeight: 500,
                    transformBox: "fill-box",
                    transformOrigin: "50% 100%",
                }}
            >
                a
            </motion.text>
            <line
                x1={18}
                y1={66}
                x2={122}
                y2={66}
                stroke={props.accent}
                strokeWidth={1.75}
            />
        </>
    )
}

function CssMark(props: {
    open: boolean
    freeze: boolean
    ink: string
    paper: string
}) {
    const live = props.open && !props.freeze
    return (
        <>
            <rect
                x={4}
                y={8}
                width={112}
                height={64}
                rx={16}
                {...CUT}
                strokeWidth={12}
            />
            <rect
                x={4}
                y={8}
                width={112}
                height={64}
                rx={14}
                fill={props.paper}
                stroke={props.ink}
                strokeWidth={2.5}
            />
            <motion.text
                x={18}
                y={50}
                fill={props.ink}
                animate={live ? { x: [0, -5, 0] } : { x: 0 }}
                transition={toolLoop(live, 0.2)}
                style={{ fontSize: 34, fontWeight: 500 }}
            >
                {"{"}
            </motion.text>
            <motion.text
                x={74}
                y={50}
                fill={props.ink}
                animate={live ? { x: [0, 5, 0] } : { x: 0 }}
                transition={toolLoop(live, 0.2)}
                style={{ fontSize: 34, fontWeight: 500 }}
            >
                {"}"}
            </motion.text>
        </>
    )
}

function ToolPlate(props: { fill: string; children: JSX.Element }) {
    return (
        <>
            <rect
                x={6}
                y={6}
                width={88}
                height={88}
                rx={20}
                {...CUT}
                strokeWidth={12}
            />
            <rect
                x={6}
                y={6}
                width={88}
                height={88}
                rx={18}
                fill={props.fill}
            />
            {props.children}
        </>
    )
}

function SiteMark(props: { open: boolean; freeze: boolean; ink: string }) {
    const live = props.open && !props.freeze
    return (
        <>
            <rect
                x={6}
                y={8}
                width={148}
                height={74}
                rx={16}
                {...CUT}
                strokeWidth={12}
            />
            <rect
                x={6}
                y={8}
                width={148}
                height={74}
                rx={14}
                fill="#fff"
                stroke={props.ink}
                strokeWidth={2}
            />
            <rect
                x={16}
                y={18}
                width={128}
                height={12}
                rx={3}
                fill={props.ink}
            />
            <circle cx={24} cy={24} r={2} fill="#fff" />
            <circle cx={32} cy={24} r={2} fill="#fff" />
            <motion.rect
                x={18}
                y={40}
                width={78}
                height={6}
                rx={3}
                fill={props.ink}
                opacity={0.35}
                animate={live ? { scaleX: [0.45, 1, 0.45] } : { scaleX: 1 }}
                transition={toolLoop(live, 0.15)}
                style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
            />
            <motion.rect
                x={18}
                y={54}
                width={48}
                height={6}
                rx={3}
                fill={props.ink}
                opacity={0.2}
                animate={live ? { scaleX: [0.4, 1, 0.4] } : { scaleX: 1 }}
                transition={toolLoop(live, 0.4)}
                style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
            />
        </>
    )
}

function ContraMark(props: { open: boolean; freeze: boolean }) {
    const live = props.open && !props.freeze
    return (
        <>
            <circle cx={50} cy={50} r={40} {...CUT} strokeWidth={12} />
            <circle cx={50} cy={50} r={36} fill="#141414" />
            <motion.path
                fill="#fff"
                d="M50 20C57 36 64 43 80 50C64 57 57 64 50 80C43 64 36 57 20 50C36 43 43 36 50 20Z"
                animate={live ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={toolLoop(live, 0.25)}
                style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
            />
        </>
    )
}

function ArenaMark(props: { open: boolean; freeze: boolean; ink: string }) {
    const live = props.open && !props.freeze
    return (
        <ToolPlate fill="#fff">
            <g>
                <text
                    x={36}
                    y={64}
                    fill={props.ink}
                    style={{ fontSize: 40, fontWeight: 600 }}
                >
                    A
                </text>
                <motion.circle
                    cx={68}
                    cy={58}
                    r={3.4}
                    fill={props.ink}
                    animate={live ? { scale: [1, 0.4, 1] } : { scale: 1 }}
                    transition={toolLoop(live, 0.7)}
                    style={{
                        transformBox: "fill-box",
                        transformOrigin: "50% 50%",
                    }}
                />
            </g>
        </ToolPlate>
    )
}

function BrandMark(props: {
    plate: string
    fill: string
    box: string
    d: string
}) {
    return (
        <ToolPlate fill={props.plate}>
            <svg x={20} y={20} width={60} height={60} viewBox={props.box}>
                <path fill={props.fill} d={props.d} />
            </svg>
        </ToolPlate>
    )
}

function CursorMark() {
    return (
        <BrandMark
            plate="#111"
            fill="#fff"
            box="0 0 24 24"
            d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"
        />
    )
}

function GrokMark() {
    return (
        <BrandMark
            plate="#111"
            fill="#fff"
            box="0 0 512 509.641"
            d="M213.235 306.019l178.976-180.002v.169l51.695-51.763c-.924 1.32-1.86 2.605-2.785 3.89-39.281 54.164-58.46 80.649-43.07 146.922l-.09-.101c10.61 45.11-.744 95.137-37.398 131.836-46.216 46.306-120.167 56.611-181.063 14.928l42.462-19.675c38.863 15.278 81.392 8.57 111.947-22.03 30.566-30.6 37.432-75.159 22.065-112.252-2.92-7.025-11.67-8.795-17.792-4.263l-124.947 92.341zm-25.786 22.437l-.033.034L68.094 435.217c7.565-10.429 16.957-20.294 26.327-30.149 26.428-27.803 52.653-55.359 36.654-94.302-21.422-52.112-8.952-113.177 30.724-152.898 41.243-41.254 101.98-51.661 152.706-30.758 11.23 4.172 21.016 10.114 28.638 15.639l-42.359 19.584c-39.44-16.563-84.629-5.299-112.207 22.313-37.298 37.308-44.84 102.003-1.128 143.81z"
        />
    )
}

function ChatMark() {
    return (
        <BrandMark
            plate="#fff"
            fill="#111"
            box="0 0 24 24"
            d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
        />
    )
}

function ClaudeMark() {
    return (
        <BrandMark
            plate="#fff"
            fill="#D97757"
            box="0 0 24 24"
            d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
        />
    )
}

function GeminiMark() {
    const id = useId().replace(/:/g, "")
    return (
        <ToolPlate fill="#fff">
            <svg x={20} y={20} width={60} height={60} viewBox="0 0 24 24">
                <defs>
                    <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0" stopColor="#4B90FF" />
                        <stop offset="0.55" stopColor="#9B72CB" />
                        <stop offset="1" stopColor="#D96570" />
                    </linearGradient>
                </defs>
                <path
                    fill={`url(#${id})`}
                    d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"
                />
            </svg>
        </ToolPlate>
    )
}

function LinkedMark() {
    return (
        <ToolPlate fill="#0A66C2">
            <text
                x={50}
                y={62}
                textAnchor="middle"
                fill="#fff"
                style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "-0.06em",
                }}
            >
                in
            </text>
        </ToolPlate>
    )
}

function stickerFace(
    item: StickerItem,
    colors: {
        accent: string
        ink: string
        paper: string
        open: boolean
        freeze: boolean
        tiltX: number | MotionValue<number>
        tiltY: number | MotionValue<number>
    }
) {
    switch (item.art) {
        case "image":
            return (
                <img
                    src={item.image}
                    alt=""
                    draggable={false}
                    style={{ display: "block", width: "100%", height: "auto" }}
                />
            )
        case "mark":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <MarkArt
                        ink={colors.ink}
                        paper={colors.paper}
                        label={item.label}
                    />
                </svg>
            )
        case "tag":
            return (
                <svg
                    viewBox="0 0 128 64"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <TagArt
                        ink={colors.ink}
                        paper={colors.paper}
                        accent={colors.accent}
                        label={item.label}
                    />
                </svg>
            )
        case "site":
            return (
                <svg
                    viewBox="0 0 160 90"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <SiteMark
                        open={colors.open}
                        freeze={colors.freeze}
                        ink={colors.ink}
                    />
                </svg>
            )
        case "contra":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <ContraMark open={colors.open} freeze={colors.freeze} />
                </svg>
            )
        case "arena":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <ArenaMark
                        open={colors.open}
                        freeze={colors.freeze}
                        ink={colors.ink}
                    />
                </svg>
            )
        case "cursor":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <CursorMark />
                </svg>
            )
        case "grok":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <GrokMark />
                </svg>
            )
        case "chatgpt":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <ChatMark />
                </svg>
            )
        case "claude":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <ClaudeMark />
                </svg>
            )
        case "gemini":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <GeminiMark />
                </svg>
            )
        case "linkedin":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <LinkedMark />
                </svg>
            )
        case "framer":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <FramerMark open={colors.open} freeze={colors.freeze} />
                </svg>
            )
        case "figma":
            return (
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <FigmaMark open={colors.open} freeze={colors.freeze} />
                </svg>
            )
        case "type":
            return (
                <svg
                    viewBox="0 0 140 86"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <TypeMark
                        open={colors.open}
                        freeze={colors.freeze}
                        ink={colors.ink}
                        paper={colors.paper}
                        accent={colors.accent}
                    />
                </svg>
            )
        case "css":
            return (
                <svg
                    viewBox="0 0 120 80"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <CssMark
                        open={colors.open}
                        freeze={colors.freeze}
                        ink={colors.ink}
                        paper={colors.paper}
                    />
                </svg>
            )
        case "lock":
        case "eye":
        case "secret":
        case "warning": {
            const drawn = artwork(item.art)
            const Drawn = drawn.Art
            return (
                <svg
                    viewBox={drawn.viewBox}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        overflow: "visible",
                    }}
                >
                    <Drawn
                        accent={colors.accent}
                        ink={colors.ink}
                        paper={colors.paper}
                        open={colors.open}
                        freeze={colors.freeze}
                        tiltX={colors.tiltX}
                        tiltY={colors.tiltY}
                        label={item.label}
                    />
                </svg>
            )
        }
        default: {
            const neverArt: never = item.art
            return neverArt
        }
    }
}

function hrefOf(value: unknown): { href: string; blank: boolean } {
    if (typeof value === "string") {
        const href = value.trim()
        return { href, blank: /^https?:\/\//i.test(href) }
    }
    if (value !== null && typeof value === "object") {
        const record = value as {
            href?: unknown
            url?: unknown
            target?: unknown
        }
        const href =
            typeof record.href === "string"
                ? record.href
                : typeof record.url === "string"
                  ? record.url
                  : ""
        const trimmed = href.trim()
        const blank =
            record.target === "_self"
                ? false
                : record.target === "_blank" || /^https?:\/\//i.test(trimmed)
        return { href: trimmed, blank }
    }
    return { href: "", blank: false }
}

function mix(
    p: number,
    a: number,
    b: number,
    c: number,
    va: number,
    vb: number,
    vc: number
) {
    if (p <= b) {
        const t = b === a ? 1 : (p - a) / (b - a)
        return va + (vb - va) * clamp(t, 0, 1)
    }
    const t = c === b ? 1 : (p - b) / (c - b)
    return vb + (vc - vb) * clamp(t, 0, 1)
}

function smoothstep(edge0: number, edge1: number, x: number) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}
