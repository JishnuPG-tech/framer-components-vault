// @framerDisableUnlink
import {
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
    type ReactNode,
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

type Content = {
    folderLabel: string
    fileLine: string
    tabLabel: string
    warningTitle: string
    warningBody: string
    punchline: string
}

type Look = {
    accentColor: string
    folderColor: string
    cardColor: string
    inkColor: string
    stickers: boolean
    font?: CSSProperties
}

type Layout = {
    width: number
    height: number
    stickerGap?: number
    disabled: boolean
    startOpen: boolean
}

type Links = {
    lock?: unknown
    eye?: unknown
    secret?: unknown
    mark?: unknown
}

type StickerInput = {
    art?: string
    image?: string
    label?: string
    link?: unknown
}

type MotionProps = {
    tiltAmount: number
    stiffness: number
    damping: number
}

type Action = {
    onOpen?: () => void
    onClose?: () => void
}

const FONT = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif'

const GRAIN = svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.32 0 0 0 0 0.27 0 0 0 0 0.2 0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>"
)

const FIBER = svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='1' seed='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.3 0 0 0 0 0.22 0 0 0 0.85 0'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>"
)

function svgUrl(svg: string) {
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const defaults = {
    content: {
        folderLabel: "SKILLS",
        fileLine: "Skills",
        tabLabel: "OPEN",
        warningTitle: "Design",
        warningBody: "",
        punchline: "",
    },
    look: {
        accentColor: "#b91c1c",
        folderColor: "#45413e",
        cardColor: "#f7f4ee",
        inkColor: "#18181b",
        stickers: true,
    },
    layout: {
        width: 640,
        height: 720,
        stickerGap: 16,
        disabled: false,
        startOpen: false,
    },
    motion: {
        tiltAmount: 8,
        stiffness: 320,
        damping: 26,
    },
}

type Input = {
    content?: Partial<Content>
    look?: Partial<Look>
    layout?: Partial<Layout>
    links?: Partial<Links>
    stickers?: StickerInput[]
    motion?: Partial<MotionProps>
    action?: Partial<Action>
    onOpen?: () => void
    onClose?: () => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 720
 * @framerDisableUnlink
 */
export default function Kern_StickersFolder(props: Input) {
    const content = { ...defaults.content, ...props.content }
    content.fileLine = content.fileLine ?? defaults.content.fileLine
    const look = { ...defaults.look, ...props.look }
    const layout = { ...defaults.layout, ...props.layout }
    const motionProps = { ...defaults.motion, ...props.motion }
    const { style } = props
    const onOpen = props.action?.onOpen ?? props.onOpen
    const onClose = props.action?.onClose ?? props.onClose

    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion() === true
    const freeze = isStatic || reduced
    const disabled = layout.disabled

    const rootRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{ x: number; y: number; origin: number; moved: boolean } | null>(null)
    const openRef = useRef(layout.startOpen)
    const [open, setOpen] = useState(layout.startOpen)
    const widthRef = useRef(layout.width)
    const heightRef = useRef(layout.height)
    const flatRef = useRef(true)
    flatRef.current = true
    const labelId = useId()
    const stickerItems = resolveStickers(props.stickers, props.links)

    const progress = useMotionValue(layout.startOpen ? 1 : 0)
    const idleY = useMotionValue(0)
    const backLift = useTransform(idleY, (value) => value)
    const frontLift = useTransform(idleY, (value) => value * 0.82)
    const tiltX = useSpring(0, { stiffness: 180, damping: 20 })
    const tiltY = useSpring(0, { stiffness: 180, damping: 20 })

    const freezeRef = useRef(freeze)
    freezeRef.current = freeze

    const x = useTransform(progress, (value) => `${pose(value, flatRef.current).x}%`)
    const y = useTransform(progress, (value) => `${pose(value, flatRef.current).y}%`)
    const cardSpin = useTransform(progress, (value) => pose(value, flatRef.current).rotateZ)
    const lift = useTransform(progress, (value) => pose(value, flatRef.current).z)
    const textOpacity = useTransform(progress, (value) => pose(value, flatRef.current).textOpacity)
    const tabOpacity = useTransform(progress, (value) => 1 - smoothstep(0.62, 0.86, value))
    const labelOpacity = useTransform(progress, (value) =>
        flatRef.current ? 1 : 1 - smoothstep(0.55, 0.8, value)
    )
    const cardZ = useTransform(progress, (value) => (pose(value, flatRef.current).inFront ? 5 : 1))
    const rigX = useTransform([progress, tiltX], (values: number[]) => {
        const [p, tilt] = values
        return pose(p, flatRef.current).rigX + (freezeRef.current ? 0 : tilt)
    })
    const rigY = useTransform([progress, tiltY], (values: number[]) => {
        const [p, tilt] = values
        return pose(p, flatRef.current).rigY + (freezeRef.current ? 0 : tilt)
    })

    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const measure = () => {
            if (el.clientWidth > 0) widthRef.current = el.clientWidth
            if (el.clientHeight > 0) heightRef.current = el.clientHeight
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!freeze) return
        tiltX.jump(0)
        tiltY.jump(0)
        idleY.set(0)
        progress.set(openRef.current ? 1 : 0)
    }, [freeze, idleY, progress, tiltX, tiltY])

    useEffect(() => {
        if (freeze || disabled || open) {
            if (freeze) return
            const settle = animate(idleY, 0, { duration: 0.22, ease: "easeOut" })
            return () => settle.stop()
        }
        const cue = animate(idleY, [0, -8, 0], {
            duration: 1.6,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2.2,
        })
        return () => cue.stop()
    }, [disabled, freeze, idleY, open])

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
            stiffness: clamp(motionProps.stiffness, 260, 420),
            damping: clamp(motionProps.damping, 22, 40),
        })
    }

    useEffect(() => {
        if (dragRef.current) return
        const target = layout.startOpen ? 1 : 0
        if (openRef.current === (target === 1) && progress.get() === target) return
        commit(target)
    }, [layout.startOpen])

    function onRootPointerMove(event: PointerEvent<HTMLDivElement>) {
        if (freeze || disabled || dragRef.current) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const px = (event.clientX - rect.left) / rect.width - 0.5
        const py = (event.clientY - rect.top) / rect.height - 0.5
        const max = clamp(motionProps.tiltAmount, 0, 12)
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
        dragRef.current = { x: event.clientX, y: event.clientY, origin: progress.get(), moved: false }
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
        const along = flatRef.current ? drag.y - event.clientY : event.clientX - drag.x
        if (Math.abs(along) > 4) drag.moved = true
        const travel = flatRef.current
            ? Math.max(72, heightRef.current * 0.34)
            : Math.max(88, widthRef.current * 0.34)
        progress.set(clamp(drag.origin + along / travel, 0, 1))
    }

    function endDrag() {
        const drag = dragRef.current
        dragRef.current = null
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

    function onStageClick(event: MouseEvent<HTMLDivElement>) {
        if (disabled || isStatic) return
        if ((event.target as HTMLElement).closest("button, a")) return
        commit(openRef.current ? 0 : 1)
    }

    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        width: layout.width,
        height: layout.height,
        overflow: "visible",
        perspective: 1400,
        perspectiveOrigin: "50% 46%",
        userSelect: "none",
        WebkitUserSelect: "none",
        fontFamily: look.font?.fontFamily ?? FONT,
        fontVariantNumeric: "tabular-nums",
        WebkitFontSmoothing: "antialiased",
        color: look.inkColor,
        boxSizing: "border-box",
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
                    left: true ? "12%" : "22%",
                    right: true ? "12%" : "18%",
                    bottom: true ? "4%" : "7%",
                    height: "14%",
                    borderRadius: "50%",
                    background:
                        "radial-gradient(closest-side, rgba(28, 22, 16, 0.26), rgba(28, 22, 16, 0) 72%)",
                    filter: "blur(14px)",
                    pointerEvents: "none",
                }}
            />
            <motion.div
                onClick={onStageClick}
                style={{
                    position: "absolute",
                    left: true ? "6%" : "16%",
                    top: true ? "32%" : "10%",
                    cursor: disabled ? "default" : "pointer",
                    width: true ? "88%" : "58%",
                    height: true ? "60%" : "76%",
                    rotateX: freeze ? pose(open ? 1 : 0, true).rigX : rigX,
                    rotateY: freeze ? pose(open ? 1 : 0, true).rigY : rigY,
                    transformStyle: "preserve-3d",
                    transformOrigin: "50% 58%",
                }}
            >
                <BackCover folderColor={look.folderColor} />
                <motion.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: "0%",
                        top: "-10%",
                        width: "100%",
                        height: "100%",
                        borderRadius: 10,
                        background: `color-mix(in srgb, ${look.cardColor} 78%, #b7a48c)`,
                        boxShadow: "0 1px 2px rgba(28,22,16,0.2)",
                        z: -14,
                        rotate: 0,
                        y: backLift,
                        pointerEvents: "none",
                    }}
                />
                <motion.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: "0%",
                        top: "-5%",
                        width: "100%",
                        height: "100%",
                        borderRadius: 10,
                        background: `color-mix(in srgb, ${look.cardColor} 92%, #8a7a62)`,
                        z: -8,
                        rotate: 0,
                        y: frontLift,
                        pointerEvents: "none",
                    }}
                />
                <FolderSlab
                    folderColor={look.folderColor}
                    accentColor={look.accentColor}
                    label={content.folderLabel}
                    fileLine={content.fileLine}
                    labelId={labelId}
                    labelOpacity={freeze ? (open && !true ? 0 : 1) : labelOpacity}
                    tiltX={freeze ? 0 : tiltX}
                    tiltY={freeze ? 0 : tiltY}
                />
                <motion.div
                    style={{
                        position: "absolute",
                        left: "0%",
                        top: "0%",
                        width: "100%",
                        height: "100%",
                        x: freeze ? `${pose(open ? 1 : 0, true).x}%` : x,
                        y: freeze ? `${pose(open ? 1 : 0, true).y}%` : y,
                        z: freeze ? pose(open ? 1 : 0, true).z : lift,
                        rotateZ: freeze ? pose(open ? 1 : 0, true).rotateZ : cardSpin,
                        zIndex: freeze ? (open ? 5 : 1) : cardZ,
                        transformOrigin: "50% 100%",
                        borderRadius: 10,
                        background: `linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0) 22%), ${look.cardColor}`,
                        boxShadow: "0 18px 30px rgba(28, 22, 16, 0.16), inset 0 1px 0 rgba(255,255,255,0.85)",
                        overflow: "hidden",
                    }}
                >
                    <PaperTexture />
                    <motion.div
                        aria-hidden={open ? undefined : true}
                        style={{
                            position: "relative",
                            opacity: freeze ? (open ? 1 : 0) : textOpacity,
                            padding: "36px 32px 0",
                            height: "100%",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 500,
                                letterSpacing: "0.14em",
                                lineHeight: 1,
                                textTransform: "uppercase",
                                color: mute(look.inkColor, 58),
                            }}
                        >
                            {content.fileLine}
                        </p>
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: content.warningTitle.trim().length > 9 ? 21 : 28,
                                fontWeight: 600,
                                letterSpacing: "-0.04em",
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {content.warningTitle}
                        </p>
                    </motion.div>
                    <motion.button
                        type="button"
                        className="cf-tab"
                        aria-expanded={open}
                        disabled={disabled}
                        onPointerDown={onTabPointerDown}
                        onPointerMove={onTabPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onKeyDown={onTabKeyDown}
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            height: "100%",
                            margin: 0,
                            padding: "18px 0",
                            border: "none",
                            background: "transparent",
                            color: mute(look.inkColor, 64),
                            cursor: disabled ? "default" : "grab",
                            touchAction: "none",
                            fontFamily: "inherit",
                            width: 36,
                            opacity: freeze ? (open ? 0 : 1) : tabOpacity,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span
                            style={{
                                display: "block",
                                whiteSpace: "nowrap",
                                transform: "rotate(90deg)",
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.2em",
                            }}
                        >
                            {content.tabLabel}
                        </span>
                    </motion.button>
                </motion.div>
                {look.stickers !== false ? (
                    <Stickers
                        open={open}
                        freeze={freeze}
                        flat={true}
                        accent={look.accentColor}
                        ink={look.inkColor}
                        paper={look.cardColor}
                        items={stickerItems}
                        gap={layout.stickerGap ?? defaults.layout.stickerGap}
                        tiltX={freeze ? 0 : tiltX}
                        tiltY={freeze ? 0 : tiltY}
                    />
                ) : null}
            </motion.div>
        </div>
    )
}

Kern_StickersFolder.displayName = "Stickers Folder"

const CREDIT =
    "[Explore more components](https://www.framer.com/%40builtbykern/)\n[Made in Framer](https://www.framer.com/?via=builtbykern)"

addPropertyControls(Kern_StickersFolder, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            folderLabel: {
                type: ControlType.String,
                title: "Folder",
                defaultValue: defaults.content.folderLabel,
                description: "Text on the closed folder.",
            },
            fileLine: {
                type: ControlType.String,
                title: "Line",
                defaultValue: defaults.content.fileLine,
                description: "Small line on the sheet.",
            },
            warningTitle: {
                type: ControlType.String,
                title: "Title",
                defaultValue: defaults.content.warningTitle,
                description: "Large line on the sheet.",
            },
            tabLabel: {
                type: ControlType.String,
                title: "Tab",
                defaultValue: defaults.content.tabLabel,
                description: "Label on the draggable tab.",
            },
        },
    },
    stickers: {
        type: ControlType.Array,
        title: "Stickers",
        maxCount: 4,
        defaultValue: [
            { art: "figma", label: "Figma" },
            { art: "type", label: "Type" },
            { art: "layout", label: "Layout" },
        ],
        description:
            "Up to four. Order is the position. Upload an SVG or PNG, or start from a built-in. Name is the accessible name.",
        control: {
            type: ControlType.Object,
            controls: {
                art: {
                    type: ControlType.Enum,
                    title: "Art",
                    defaultValue: "figma",
                    options: ["figma", "framer", "cursor", "type", "layout", "code", "pen", "photo", "color", "motion", "layers", "align", "crop", "comment", "browser", "branch", "ruler", "export", "link", "mail", "pin", "gb", "in", "us", "es", "fr", "de", "it", "pt", "br", "jp", "kr", "nl", "ca", "pl", "se", "image"],
                    optionTitles: ["Figma", "Framer", "Cursor", "Type", "Layout", "Code", "Pen", "Photo", "Color", "Motion", "Layers", "Align", "Crop", "Comment", "Browser", "Branch", "Ruler", "Export", "Link", "Mail", "Pin", "UK", "India", "USA", "Spain", "France", "Germany", "Italy", "Portugal", "Brazil", "Japan", "Korea", "Netherlands", "Canada", "Poland", "Sweden", "Upload"],
                },
                image: {
                    type: ControlType.File,
                    title: "File",
                    allowedFileTypes: ["svg", "png", "webp", "jpg", "jpeg"],
                    hidden: (props: { art?: string }) => props.art !== "image",
                },
                label: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Sticker",
                    placeholder: "Name",
                    description: "Accessible name.",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        controls: {
            accentColor: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: defaults.look.accentColor,
                description: "Dot on the folder.",
            },
            folderColor: {
                type: ControlType.Color,
                title: "Folder",
                defaultValue: defaults.look.folderColor,
                description: "Cover color.",
            },
            cardColor: {
                type: ControlType.Color,
                title: "Card",
                defaultValue: defaults.look.cardColor,
                description: "Sheet color.",
            },
            inkColor: {
                type: ControlType.Color,
                title: "Ink",
                defaultValue: defaults.look.inkColor,
                description: "Text and icon ink.",
            },
            stickers: {
                type: ControlType.Boolean,
                title: "Stickers",
                defaultValue: defaults.look.stickers,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                description: "Icons that sit above the sheet when it rises.",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                defaultFontType: "sans-serif",
                description: "One family for every line. Sizes and weights stay set.",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: defaults.layout.width,
                min: 320,
                max: 760,
                step: 10,
                unit: "px",
                description: "Width of the folder. The frame follows this.",
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: defaults.layout.height,
                min: 400,
                max: 860,
                step: 10,
                unit: "px",
                description: "Height of the folder.",
            },
            stickerGap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: defaults.layout.stickerGap,
                min: 0,
                max: 64,
                step: 1,
                unit: "px",
                description: "Space between the cover and the stickers.",
                hidden: (_layout: { stickerGap?: number }, root: { look?: { stickers?: boolean } }) =>
                    root?.look?.stickers === false,
            },
            startOpen: {
                type: ControlType.Boolean,
                title: "Start",
                defaultValue: defaults.layout.startOpen,
                enabledTitle: "Open",
                disabledTitle: "Closed",
                description: "The folder is already open, on the canvas too.",
            },
            disabled: {
                type: ControlType.Boolean,
                title: "Disabled",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Turns off drag and tilt.",
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
                max: 12,
                step: 1,
                unit: "°",
                description: "How far the closed folder leans toward the pointer.",
            },
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                defaultValue: defaults.motion.stiffness,
                min: 260,
                max: 420,
                step: 10,
                description: "Spring when the sheet rises.",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                defaultValue: defaults.motion.damping,
                min: 22,
                max: 40,
                step: 1,
                description: "How fast the rise settles. Higher stops sooner.",
            },
        },
        description: CREDIT,
    },
    onOpen: { type: ControlType.EventHandler, title: "Open" },
    onClose: { type: ControlType.EventHandler, title: "Close" },
})

function FolderSlab(props: {
    folderColor: string
    accentColor: string
    label: string
    fileLine: string
    labelId: string
    labelOpacity: number | MotionValue<number>
    tiltX: number | MotionValue<number>
    tiltY: number | MotionValue<number>
}) {
    const { folderColor, accentColor, label, fileLine, labelId, labelOpacity, tiltX, tiltY } = props
    const sheenX = useTransform(() => `${-num(tiltY) * 2.2}%`)
    const sheenY = useTransform(() => `${num(tiltX) * 2.2}%`)
    return (
        <>
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 10,
                    background: `color-mix(in srgb, ${folderColor} 70%, #0c0a08)`,
                    transform: "translateZ(-3px)",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 10,
                    background: `linear-gradient(90deg, transparent 14px, rgba(0,0,0,0.3) 14px, rgba(0,0,0,0.3) 15px, rgba(255,255,255,0.07) 15px, rgba(255,255,255,0.07) 16px, transparent 16px), linear-gradient(172deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 46%, rgba(0,0,0,0.12)), ${folderColor}`,
                    boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.3), inset -1px 0 0 rgba(255,255,255,0.05)",
                    overflow: "hidden",
                    zIndex: 2,
                    pointerEvents: "none",
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
                    }}
                />
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
                        background:
                            "radial-gradient(34% 30% at 34% 30%, rgba(255,255,255,0.13), rgba(255,255,255,0) 100%)",
                    }}
                />
                <motion.div
                    style={{
                        position: "absolute",
                        inset: "18px 18px 16px 26px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        opacity: labelOpacity,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <p style={{ ...META, margin: 0, color: "rgba(255,255,255,0.5)" }}>{fileLine}</p>
                        <span
                            aria-hidden
                            style={{
                                width: 7,
                                height: 7,
                                flex: "none",
                                borderRadius: 4,
                                background: accentColor,
                                boxShadow: `0 0 0 3px color-mix(in srgb, ${accentColor} 22%, transparent)`,
                            }}
                        />
                    </div>
                    <p
                        id={labelId}
                        style={{
                            margin: 0,
                            fontSize: `max(8cqw, min(14cqw, calc((100cqw - 56px) / ${(Math.max(label.length, 6) * 0.84).toFixed(2)})))`,
                            fontWeight: 700,
                            letterSpacing: "-0.035em",
                            lineHeight: 0.92,
                            textTransform: "uppercase",
                            color: `color-mix(in srgb, ${folderColor} 82%, #000)`,
                            textShadow: "0 1px 0 rgba(255,255,255,0.12), 0 -1px 0 rgba(0,0,0,0.5)",
                        }}
                    >
                        {label}
                    </p>
                </motion.div>
            </div>
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
                    left: "8%",
                    top: -20,
                    width: "38%",
                    height: 28,
                    background: back,
                    borderRadius: "7px 7px 0 0",
                    clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "4px 10px 10px 10px",
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
    flat: { left: number; bottom: number; width: number; rotate: number; fromX: number; fromY: number }
    viewBox: string
    Art: (props: ArtProps) => JSX.Element
}

const CUT = { fill: "#fff", stroke: "#fff", strokeLinejoin: "round", strokeLinecap: "round" } as const

const STICKERS: StickerSpec[] = [
    {
        left: -20,
        top: 18,
        width: 22,
        name: "Lock",
        rotate: -14,
        spin: -40,
        z: 64,
        fromX: 357,
        fromY: 188,
        flat: { left: 1, bottom: 152, width: 15, rotate: -7, fromX: 10, fromY: 80 },
        viewBox: "0 0 100 100",
        Art: ({ accent, ink }) => (
            <>
                <g {...CUT} strokeWidth={10}>
                    <path d="M31 46V33a19 19 0 0 1 38 0v13" fill="none" strokeWidth={24} />
                    <rect x={18} y={44} width={64} height={46} rx={10} />
                </g>
                <path d="M31 46V33a19 19 0 0 1 38 0v13" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />
                <rect x={18} y={44} width={64} height={46} rx={10} fill={accent} stroke={ink} strokeWidth={3} />
                <rect x={25} y={50} width={6} height={16} rx={3} fill="#fff" opacity={0.35} />
                <circle cx={50} cy={63} r={6.5} fill={ink} />
                <rect x={47} y={64} width={6} height={13} rx={3} fill={ink} />
            </>
        ),
    },
    {
        left: 84,
        top: 2,
        width: 20,
        name: "Eye",
        rotate: 12,
        spin: 50,
        z: 78,
        fromX: 0,
        fromY: 170,
        flat: { left: 24, bottom: 152, width: 15, rotate: 6, fromX: 2, fromY: 90 },
        viewBox: "0 0 100 100",
        Art: EyeArt,
    },
    {
        left: 60,
        top: 92,
        width: 52,
        name: "Secret",
        rotate: -9,
        spin: 28,
        z: 70,
        fromX: 27,
        fromY: -350,
        flat: { left: 44, bottom: 152, width: 26, rotate: -2, fromX: 0, fromY: 70 },
        viewBox: "0 0 170 64",
        Art: ({ ink, paper, label }) => (
            <>
                <rect x={6} y={6} width={158} height={52} rx={9} {...CUT} strokeWidth={11} />
                <rect x={6} y={6} width={158} height={52} rx={8} fill={ink} />
                <rect x={13} y={13} width={144} height={38} rx={4} fill="none" stroke={paper} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7} />
                <text
                    x={85}
                    y={39.5}
                    textAnchor="middle"
                    fill={paper}
                    style={{ fontSize: bannerSize(label), fontWeight: 800, letterSpacing: "0.08em" }}
                >
                    {bannerLine(label)}
                </text>
            </>
        ),
    },
    {
        left: -14,
        top: 62,
        width: 26,
        name: "Warning",
        rotate: 10,
        spin: -36,
        z: 56,
        fromX: 388,
        fromY: -132,
        flat: { left: 78, bottom: 152, width: 15, rotate: 5, fromX: -6, fromY: 84 },
        viewBox: "0 0 100 100",
        Art: ({ accent, ink }) => (
            <>
                <path d="M50 14 L90 82 H10 Z" {...CUT} strokeWidth={16} />
                <path d="M50 14 L90 82 H10 Z" fill="#f4c542" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
                <rect x={45.5} y={36} width={9} height={27} rx={4.5} fill={accent} />
                <circle cx={50} cy={71.5} r={5} fill={accent} />
            </>
        ),
    },
]

function Stickers(props: {
    open: boolean
    freeze: boolean
    flat: boolean
    accent: string
    ink: string
    paper: string
    items: StickerItem[]
    gap: number
    tiltX: number | MotionValue<number>
    tiltY: number | MotionValue<number>
}) {
    const { open, freeze, flat, accent, ink, paper, items, gap, tiltX, tiltY } = props
    const count = items.length
    return (
        <>
            {items.map((item, index) => {
                const spec = STICKERS[index] ?? STICKERS[0]
                const spot = flat ? spec.flat : spec
                const turn = flat ? spec.flat.rotate : spec.rotate
                const mark = 16
                const row = 88
                const step = count <= 1 ? 0 : (row - mark) / (count - 1)
                const rowLeft = count <= 1 ? (100 - mark) / 2 : 6 + index * step
                const href = item.href
                const name = item.label.trim()
                const delay = 0.14 + index * 0.065
                const transition = freeze
                    ? { duration: 0 }
                    : open
                      ? {
                            type: "spring" as const,
                            stiffness: 480,
                            damping: 28,
                            mass: 0.85,
                            delay,
                            opacity: { duration: 0.1, delay },
                        }
                      : { duration: 0.2, ease: [0.2, 0, 0, 1] as const, delay: (count - 1 - index) * 0.02 }
                const art = stickerFace(item, { accent, ink, paper, open, freeze, tiltX, tiltY })
                const shared = {
                    className: href ? "cf-sticker" : undefined,
                    initial: false as const,
                    animate: open
                        ? { x: "0%", y: "0%", scale: 1, rotate: turn, opacity: 1, z: spec.z }
                        : {
                              x: `${spot.fromX}%`,
                              y: `${spot.fromY}%`,
                              scale: 0.35,
                              rotate: turn + spec.spin,
                              opacity: 0,
                              z: -12,
                          },
                    transition,
                    whileHover: href && !freeze ? { scale: 1.08 } : undefined,
                    whileTap: href && !freeze ? { scale: 0.94 } : undefined,
                    style: {
                        position: "absolute" as const,
                        left: flat ? `${rowLeft}%` : `${spot.left}%`,
                        top: "top" in spot ? `${spot.top}%` : "auto",
                        bottom: "bottom" in spot ? (flat ? `calc(124% + ${clamp(gap, 0, 64)}px)` : `${spot.bottom}%`) : "auto",
                        width: flat ? `${mark}%` : `${spot.width}%`,
                        transformOrigin: flat ? "50% 100%" : "50% 50%",
                        zIndex: 8,
                        pointerEvents: href && open ? ("auto" as const) : ("none" as const),
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
                        aria-label={name || undefined}
                        tabIndex={open ? 0 : -1}
                        {...shared}
                    />
                ) : (
                    <motion.div
                        key={`${index}-${item.art}`}
                        role={name ? "img" : undefined}
                        aria-label={name || undefined}
                        aria-hidden={name ? undefined : true}
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
                <path d={almond} strokeWidth={14} />
                <path d={lashes} fill="none" strokeWidth={14} />
            </g>
            <path d={lashes} fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
            <motion.g
                initial={false}
                animate={open && !freeze ? { scaleY: [1, 1, 0.08, 1] } : { scaleY: 1 }}
                transition={open && !freeze ? { duration: 0.42, times: [0, 0.55, 0.78, 1], delay: 0.9 } : { duration: 0 }}
                style={{ transformOrigin: "50px 52px" }}
            >
                <path d={almond} fill={paper} stroke={ink} strokeWidth={3.5} strokeLinejoin="round" />
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

function PaperTexture() {
    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                backgroundImage: FIBER,
                backgroundSize: "96px 96px",
                mixBlendMode: "soft-light",
                opacity: 0.35,
                pointerEvents: "none",
            }}
        />
    )
}

const META: CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.16em",
    lineHeight: 1.2,
    textTransform: "uppercase",
}

function mute(color: string, percent: number) {
    return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

function pose(progress: number, flat = false) {
    const p = clamp(progress, 0, 1)
    if (flat) {
        return {
            x: 0,
            y: mix(p, 0, 0.55, 1, 0, -10, -24),
            rotateZ: 0,
            z: -8,
            rigX: mix(p, 0, 0.5, 1, 12, 8, 6),
            rigY: mix(p, 0, 0.5, 1, -10, -6, -3),
            textOpacity: smoothstep(0.4, 0.78, p),
            inFront: false,
        }
    }
    return {
        x: mix(p, 0, 0.58, 1, 0, 24, -11),
        y: 0,
        rotateZ: mix(p, 0, 0.62, 1, 0, 1, -6),
        z: mix(p, 0, 0.58, 1, -6, -6, 36),
        rigX: mix(p, 0, 0.5, 1, 18, 13, 8),
        rigY: mix(p, 0, 0.5, 1, -28, -20, -11),
        textOpacity: smoothstep(0.72, 0.94, p),
        inFront: p > 0.7,
    }
}

type StickerKind =
    | "lock"
    | "eye"
    | "secret"
    | "warning"
    | "figma"
    | "framer"
    | "cursor"
    | "type"
    | "layout"
    | "code"
    | "pen"
    | "photo"
    | "color"
    | "motion"
    | "link"
    | "mail"
    | "pin"
    | "layers"
    | "align"
    | "crop"
    | "comment"
    | "browser"
    | "branch"
    | "ruler"
    | "export"
    | "es"
    | "gb"
    | "in"
    | "fr"
    | "de"
    | "it"
    | "pt"
    | "us"
    | "br"
    | "jp"
    | "kr"
    | "nl"
    | "ca"
    | "pl"
    | "se"
    | "image"

type StickerItem = {
    art: StickerKind
    image: string
    label: string
    href: string
    blank: boolean
}

const stickerDefaults: StickerInput[] = [
    { art: "figma", label: "Figma" },
    { art: "type", label: "Type" },
    { art: "layout", label: "Layout" },
]

function resolveStickers(items: StickerInput[] | undefined, links: Partial<Links> | undefined): StickerItem[] {
    const source = items && items.length > 0 ? items.slice(0, 4) : stickerDefaults
    const legacy = [links?.lock, links?.eye, links?.secret, links?.mark]
    const resolved: StickerItem[] = []
    source.forEach((item, index) => {
        const art = kindOf(item?.art)
        const image = fileOf(item?.image)
        if (art === "image" && image === "") return
        const link = hrefOf(item?.link ?? legacy[index])
        const label = (item?.label ?? "").trim() || defaultStickerLabel(art)
        resolved.push({ art, image, label, href: link.href, blank: link.blank })
    })
    return resolved
}

function kindOf(value: unknown): StickerKind {
    if (
        value === "lock" ||
        value === "eye" ||
        value === "secret" ||
        value === "warning" ||
        value === "figma" ||
        value === "framer" ||
        value === "cursor" ||
        value === "type" ||
        value === "layout" ||
        value === "code" ||
        value === "pen" ||
        value === "photo" ||
        value === "color" ||
        value === "motion" ||
        value === "link" ||
        value === "mail" ||
        value === "pin" ||
        value === "layers" ||
        value === "align" ||
        value === "crop" ||
        value === "comment" ||
        value === "browser" ||
        value === "branch" ||
        value === "ruler" ||
        value === "export" ||
        value === "es" ||
        value === "gb" ||
        value === "in" ||
        value === "fr" ||
        value === "de" ||
        value === "it" ||
        value === "pt" ||
        value === "us" ||
        value === "br" ||
        value === "jp" ||
        value === "kr" ||
        value === "nl" ||
        value === "ca" ||
        value === "pl" ||
        value === "se" ||
        value === "image"
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
        case "figma":
            return "Figma"
        case "framer":
            return "Framer"
        case "cursor":
            return "Cursor"
        case "type":
            return "Type"
        case "layout":
            return "Layout"
        case "code":
            return "Code"
        case "pen":
            return "Pen"
        case "photo":
            return "Photo"
        case "color":
            return "Color"
        case "motion":
            return "Motion"
        case "link":
            return "Link"
        case "mail":
            return "Mail"
        case "pin":
            return "Pin"
        case "layers":
            return "Layers"
        case "align":
            return "Align"
        case "crop":
            return "Crop"
        case "comment":
            return "Comment"
        case "browser":
            return "Browser"
        case "branch":
            return "Branch"
        case "ruler":
            return "Ruler"
        case "export":
            return "Export"
        case "es":
            return "Spanish"
        case "gb":
            return "English"
        case "in":
            return "India"
        case "fr":
            return "French"
        case "de":
            return "German"
        case "it":
            return "Italian"
        case "pt":
            return "Portuguese"
        case "us":
            return "USA"
        case "br":
            return "Brazil"
        case "jp":
            return "Japan"
        case "kr":
            return "Korea"
        case "nl":
            return "Dutch"
        case "ca":
            return "Canada"
        case "pl":
            return "Polish"
        case "se":
            return "Swedish"
        case "image":
            return "Sticker"
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

function artwork(art: Exclude<StickerKind, "image" | "figma" | "framer" | "cursor" | "type" | "layout" | "code" | "pen" | "photo" | "color" | "motion" | "link" | "mail" | "pin" | "layers" | "align" | "crop" | "comment" | "browser" | "branch" | "ruler" | "export" | "es" | "gb" | "in" | "fr" | "de" | "it" | "pt" | "us" | "br" | "jp" | "kr" | "nl" | "ca" | "pl" | "se">): StickerSpec {
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

function FramerArt() {
    return (
        <>
            <rect x={6} y={6} width={88} height={88} rx={20} {...CUT} strokeWidth={12} />
            <rect x={6} y={6} width={88} height={88} rx={18} fill="#0055FF" />
            <path fill="#fff" d="M4 0h16v8h-8z" transform="translate(21 19) scale(2.4)" />
            <path fill="#fff" d="M4 8h8l8 8H4z" transform="translate(21 19) scale(2.4)" />
            <path fill="#fff" d="M4 16h8v8z" transform="translate(21 19) scale(2.4)" />
        </>
    )
}

function FigmaArt() {
    return (
        <>
            <rect x={6} y={6} width={88} height={88} rx={20} {...CUT} strokeWidth={12} />
            <rect x={6} y={6} width={88} height={88} rx={18} fill="#fff" />
            <g transform="translate(30 16) scale(1.05)">
                <path fill="#F24E1E" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
                <path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
                <path fill="#1ABCFE" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
                <path fill="#0ACF83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
                <path fill="#A259FF" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
            </g>
        </>
    )
}

function CursorArt() {
    return (
        <>
            <rect x={6} y={6} width={88} height={88} rx={20} {...CUT} strokeWidth={12} />
            <rect x={6} y={6} width={88} height={88} rx={18} fill="#111" />
            <svg x={22} y={22} width={56} height={56} viewBox="0 0 24 24">
                <path
                    fill="#fff"
                    d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"
                />
            </svg>
        </>
    )
}

function TypeArt(props: { ink: string; paper: string; accent: string }) {
    return (
        <>
            <rect x={6} y={18} width={88} height={64} rx={16} {...CUT} strokeWidth={12} />
            <rect x={6} y={18} width={88} height={64} rx={14} fill={props.paper} stroke={props.ink} strokeWidth={2.5} />
            <text x={30} y={64} fill={props.ink} style={{ fontSize: 36, fontWeight: 600 }}>
                A
            </text>
            <line x1={24} y1={70} x2={76} y2={70} stroke={props.accent} strokeWidth={2} />
        </>
    )
}

function LayoutArt(props: { ink: string }) {
    return (
        <>
            <rect x={6} y={6} width={88} height={88} rx={20} {...CUT} strokeWidth={12} />
            <rect x={6} y={6} width={88} height={88} rx={18} fill="#fff" />
            <rect x={22} y={22} width={24} height={24} rx={4} fill={props.ink} />
            <rect x={54} y={22} width={24} height={16} rx={4} fill={props.ink} opacity={0.35} />
            <rect x={22} y={54} width={56} height={22} rx={4} fill={props.ink} opacity={0.18} />
        </>
    )
}

function CodeArt() {
    return (
        <>
            <rect x={6} y={6} width={88} height={88} rx={20} {...CUT} strokeWidth={12} />
            <rect x={6} y={6} width={88} height={88} rx={18} fill="#fff" />
            <path d="M38 34 L26 50 L38 66" fill="none" stroke="#18181b" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M62 34 L74 50 L62 66" fill="none" stroke="#18181b" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </>
    )
}

function FlagPlate(props: { children: ReactNode }) {
    const clip = useId().replace(/:/g, "")
    return (
        <>
            <rect x={6} y={6} width={88} height={88} rx={20} {...CUT} strokeWidth={12} />
            <clipPath id={clip}>
                <rect x={6} y={6} width={88} height={88} rx={18} />
            </clipPath>
            <g clipPath={`url(#${clip})`}>{props.children}</g>
        </>
    )
}

function SpainArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={88} height={88} fill="#AA151B" />
            <rect x={6} y={28} width={88} height={44} fill="#F1BF00" />
        </FlagPlate>
    )
}

function UkArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={88} height={88} fill="#012169" />
            <path d="M6 6 L94 94 M94 6 L6 94" stroke="#fff" strokeWidth={16} />
            <path d="M6 6 L94 94 M94 6 L6 94" stroke="#C8102E" strokeWidth={8} />
            <path d="M50 6 V94 M6 50 H94" stroke="#fff" strokeWidth={26} />
            <path d="M50 6 V94 M6 50 H94" stroke="#C8102E" strokeWidth={14} />
        </FlagPlate>
    )
}

function FranceArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={30} height={88} fill="#0055A4" />
            <rect x={36} y={6} width={28} height={88} fill="#fff" />
            <rect x={64} y={6} width={30} height={88} fill="#EF4135" />
        </FlagPlate>
    )
}

function ItalyArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={30} height={88} fill="#009246" />
            <rect x={36} y={6} width={28} height={88} fill="#fff" />
            <rect x={64} y={6} width={30} height={88} fill="#CE2B37" />
        </FlagPlate>
    )
}

function PortugalArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={36} height={88} fill="#006600" />
            <rect x={42} y={6} width={52} height={88} fill="#FF0000" />
            <circle cx={42} cy={50} r={14} fill="#FFCC00" />
            <circle cx={42} cy={50} r={7} fill="none" stroke="#fff" strokeWidth={2.5} />
        </FlagPlate>
    )
}

function IndiaArt() {
    const spokes = []
    for (let spoke = 0; spoke < 24; spoke++) {
        const angle = (spoke / 24) * Math.PI * 2
        spokes.push(
            <line
                key={spoke}
                x1={50}
                y1={50}
                x2={50 + Math.cos(angle) * 7.2}
                y2={50 + Math.sin(angle) * 7.2}
                stroke="#000080"
                strokeWidth={0.7}
            />
        )
    }
    return (
        <FlagPlate>
            <rect x={6} y={6} width={88} height={29} fill="#FF9933" />
            <rect x={6} y={35} width={88} height={29} fill="#fff" />
            <rect x={6} y={64} width={88} height={30} fill="#138808" />
            {spokes}
            <circle cx={50} cy={50} r={8} fill="none" stroke="#000080" strokeWidth={1.15} />
            <circle cx={50} cy={50} r={1.2} fill="#000080" />
        </FlagPlate>
    )
}

function IconPlate(props: { fill: string; children: ReactNode }) {
    return (
        <>
            <rect x={6} y={6} width={88} height={88} rx={20} {...CUT} strokeWidth={12} />
            <rect x={6} y={6} width={88} height={88} rx={18} fill={props.fill} />
            {props.children}
        </>
    )
}

function PenArt() {
    return (
        <IconPlate fill="#fff">
            <path d="M28 72 L62 28" fill="none" stroke="#18181b" strokeWidth={6} strokeLinecap="round" />
            <path d="M58 24 L70 22 L68 34 Z" fill="#18181b" />
            <path d="M24 76 L32 68" fill="none" stroke="#b91c1c" strokeWidth={4} strokeLinecap="round" />
        </IconPlate>
    )
}

function PhotoArt() {
    return (
        <IconPlate fill="#fff">
            <rect x={24} y={30} width={52} height={40} rx={6} fill="none" stroke="#18181b" strokeWidth={4} />
            <circle cx={50} cy={50} r={9} fill="none" stroke="#18181b" strokeWidth={4} />
            <rect x={36} y={24} width={14} height={8} rx={2} fill="#18181b" />
        </IconPlate>
    )
}

function ColorArt() {
    return (
        <IconPlate fill="#fff">
            <circle cx={36} cy={46} r={10} fill="#e24b4b" />
            <circle cx={54} cy={40} r={10} fill="#3b82f6" />
            <circle cx={58} cy={58} r={10} fill="#f5c542" />
        </IconPlate>
    )
}

function MotionArt() {
    return (
        <IconPlate fill="#161616">
            <path d="M40 32 L68 50 L40 68 Z" fill="#fff" />
        </IconPlate>
    )
}

function LinkArt() {
    return (
        <IconPlate fill="#fff">
            <path d="M38 44 H28 a12 12 0 0 0 0 24 h16" fill="none" stroke="#18181b" strokeWidth={5} strokeLinecap="round" />
            <path d="M62 56 H72 a12 12 0 0 0 0 -24 H56" fill="none" stroke="#18181b" strokeWidth={5} strokeLinecap="round" />
        </IconPlate>
    )
}

function MailArt() {
    return (
        <IconPlate fill="#fff">
            <rect x={22} y={32} width={56} height={38} rx={6} fill="none" stroke="#18181b" strokeWidth={4} />
            <path d="M24 36 L50 54 L76 36" fill="none" stroke="#18181b" strokeWidth={4} strokeLinejoin="round" />
        </IconPlate>
    )
}

function PinArt() {
    return (
        <IconPlate fill="#fff">
            <path d="M50 22 a16 16 0 0 1 16 16 c0 12 -16 30 -16 30 s-16 -18 -16 -30 a16 16 0 0 1 16 -16 z" fill="#18181b" />
            <circle cx={50} cy={38} r={5} fill="#fff" />
        </IconPlate>
    )
}

function LayersArt() {
    return (
        <IconPlate fill="#fff">
            <rect x={30} y={28} width={40} height={28} rx={3} fill="none" stroke="#18181b" strokeWidth={3} opacity={0.35} />
            <rect x={26} y={34} width={40} height={28} rx={3} fill="#fff" stroke="#18181b" strokeWidth={3} opacity={0.7} />
            <rect x={22} y={40} width={40} height={28} rx={3} fill="#fff" stroke="#18181b" strokeWidth={3.5} />
        </IconPlate>
    )
}

function AlignArt() {
    return (
        <IconPlate fill="#fff">
            <path d="M28 34 H72 M28 50 H58 M28 66 H68" fill="none" stroke="#18181b" strokeWidth={5} strokeLinecap="round" />
        </IconPlate>
    )
}

function CropArt() {
    return (
        <IconPlate fill="#fff">
            <path d="M32 28 V52 H68 M68 72 V48 H32" fill="none" stroke="#18181b" strokeWidth={4} strokeLinejoin="round" />
        </IconPlate>
    )
}

function CommentArt() {
    return (
        <IconPlate fill="#fff">
            <path d="M26 30 H70 a6 6 0 0 1 6 6 V58 a6 6 0 0 1 -6 6 H46 L34 74 V64 H26 a6 6 0 0 1 -6 -6 V36 a6 6 0 0 1 6 -6 z" fill="#18181b" />
        </IconPlate>
    )
}

function BrowserArt() {
    return (
        <IconPlate fill="#fff">
            <rect x={22} y={28} width={56} height={44} rx={6} fill="none" stroke="#18181b" strokeWidth={4} />
            <path d="M22 40 H78" stroke="#18181b" strokeWidth={4} />
            <circle cx={32} cy={34} r={2} fill="#18181b" />
            <circle cx={40} cy={34} r={2} fill="#18181b" />
        </IconPlate>
    )
}

function BranchArt() {
    return (
        <IconPlate fill="#fff">
            <circle cx={36} cy={32} r={6} fill="#18181b" />
            <circle cx={36} cy={68} r={6} fill="#18181b" />
            <circle cx={64} cy={48} r={6} fill="#18181b" />
            <path d="M36 38 V62 M36 48 H52 a12 12 0 0 0 12 -12" fill="none" stroke="#18181b" strokeWidth={4} />
        </IconPlate>
    )
}

function RulerArt() {
    return (
        <IconPlate fill="#fff">
            <rect x={24} y={38} width={52} height={24} rx={3} fill="none" stroke="#18181b" strokeWidth={4} />
            <path d="M32 38 V48 M42 38 V52 M52 38 V48 M62 38 V52" stroke="#18181b" strokeWidth={3} />
        </IconPlate>
    )
}

function ExportArt() {
    return (
        <IconPlate fill="#fff">
            <path d="M34 52 V70 H66 V52" fill="none" stroke="#18181b" strokeWidth={4} strokeLinejoin="round" />
            <path d="M50 28 V58 M40 48 L50 58 L60 48" fill="none" stroke="#18181b" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        </IconPlate>
    )
}

function BandFlag(props: { parts: { color: string; weight: number }[]; axis: "h" | "v" }) {
    const total = props.parts.reduce((sum, part) => sum + part.weight, 0)
    let cursor = 6
    return (
        <FlagPlate>
            {props.parts.map((part) => {
                const size = (88 * part.weight) / total
                const node =
                    props.axis === "h" ? (
                        <rect key={`${part.color}-${cursor}`} x={6} y={cursor} width={88} height={size + 0.4} fill={part.color} />
                    ) : (
                        <rect key={`${part.color}-${cursor}`} x={cursor} y={6} width={size + 0.4} height={88} fill={part.color} />
                    )
                cursor += size
                return node
            })}
        </FlagPlate>
    )
}

function JapanArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={88} height={88} fill="#fff" />
            <circle cx={50} cy={50} r={16} fill="#BC002D" />
        </FlagPlate>
    )
}

function KoreaArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={88} height={88} fill="#fff" />
            <circle cx={50} cy={50} r={16} fill="#CD2E3A" />
            <path d="M50 34 a8 8 0 0 1 0 16 a8 8 0 0 0 0 16 a16 16 0 0 1 0 -32 z" fill="#0047A0" />
        </FlagPlate>
    )
}

function BrazilArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={88} height={88} fill="#009B3A" />
            <polygon points="50,24 76,50 50,76 24,50" fill="#FEDD00" />
            <circle cx={50} cy={50} r={11} fill="#002776" />
        </FlagPlate>
    )
}

function SwedenArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={88} height={88} fill="#006AA7" />
            <rect x={6} y={40} width={88} height={16} fill="#FECC00" />
            <rect x={30} y={6} width={16} height={88} fill="#FECC00" />
        </FlagPlate>
    )
}

function CanadaArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={22} height={88} fill="#FF0000" />
            <rect x={28} y={6} width={44} height={88} fill="#fff" />
            <rect x={72} y={6} width={22} height={88} fill="#FF0000" />
            <path d="M50 30 L54 42 L66 40 L56 48 L60 60 L50 52 L40 60 L44 48 L34 40 L46 42 Z" fill="#FF0000" />
        </FlagPlate>
    )
}

function GermanyArt() {
    return (
        <FlagPlate>
            <rect x={6} y={6} width={88} height={30} fill="#000" />
            <rect x={6} y={36} width={88} height={29} fill="#DD0000" />
            <rect x={6} y={65} width={88} height={29} fill="#FFCE00" />
        </FlagPlate>
    )
}

function UsaArt() {
    const stripes = []
    for (let band = 0; band < 13; band++) {
        stripes.push(
            <rect
                key={band}
                x={6}
                y={6 + band * (88 / 13)}
                width={88}
                height={88 / 13 + 0.4}
                fill={band % 2 === 0 ? "#B22234" : "#fff"}
            />
        )
    }
    const stars = [
        [16, 16],
        [28, 16],
        [40, 16],
        [22, 26],
        [34, 26],
        [16, 36],
        [28, 36],
        [40, 36],
    ]
    return (
        <FlagPlate>
            {stripes}
            <rect x={6} y={6} width={40} height={38} fill="#3C3B6E" />
            {stars.map(([cx, cy]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.6} fill="#fff" />
            ))}
        </FlagPlate>
    )
}

function stickerSvg(node: ReactNode) {
    return (
        <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
            {node}
        </svg>
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
                    alt={item.label.trim()}
                    draggable={false}
                    style={{ display: "block", width: "100%", height: "auto" }}
                />
            )
        case "figma":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <FigmaArt />
                </svg>
            )
        case "framer":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <FramerArt />
                </svg>
            )
        case "cursor":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <CursorArt />
                </svg>
            )
        case "type":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <TypeArt ink={colors.ink} paper={colors.paper} accent={colors.accent} />
                </svg>
            )
        case "layout":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <LayoutArt ink={colors.ink} />
                </svg>
            )
        case "code":
            return stickerSvg(<CodeArt />)
        case "pen":
            return stickerSvg(<PenArt />)
        case "photo":
            return stickerSvg(<PhotoArt />)
        case "color":
            return stickerSvg(<ColorArt />)
        case "motion":
            return stickerSvg(<MotionArt />)
        case "link":
            return stickerSvg(<LinkArt />)
        case "mail":
            return stickerSvg(<MailArt />)
        case "pin":
            return stickerSvg(<PinArt />)
        case "layers":
            return stickerSvg(<LayersArt />)
        case "align":
            return stickerSvg(<AlignArt />)
        case "crop":
            return stickerSvg(<CropArt />)
        case "comment":
            return stickerSvg(<CommentArt />)
        case "browser":
            return stickerSvg(<BrowserArt />)
        case "branch":
            return stickerSvg(<BranchArt />)
        case "ruler":
            return stickerSvg(<RulerArt />)
        case "export":
            return stickerSvg(<ExportArt />)
        case "es":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <SpainArt />
                </svg>
            )
        case "gb":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <UkArt />
                </svg>
            )
        case "in":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <IndiaArt />
                </svg>
            )
        case "fr":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <FranceArt />
                </svg>
            )
        case "de":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <GermanyArt />
                </svg>
            )
        case "it":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <ItalyArt />
                </svg>
            )
        case "pt":
            return (
                <svg viewBox="0 0 100 100" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
                    <PortugalArt />
                </svg>
            )
        case "us":
            return stickerSvg(<UsaArt />)
        case "br":
            return stickerSvg(<BrazilArt />)
        case "jp":
            return stickerSvg(<JapanArt />)
        case "kr":
            return stickerSvg(<KoreaArt />)
        case "nl":
            return stickerSvg(
                <BandFlag
                    axis="h"
                    parts={[
                        { color: "#AE1C28", weight: 1 },
                        { color: "#fff", weight: 1 },
                        { color: "#21468B", weight: 1 },
                    ]}
                />
            )
        case "ca":
            return stickerSvg(<CanadaArt />)
        case "pl":
            return stickerSvg(
                <BandFlag
                    axis="h"
                    parts={[
                        { color: "#fff", weight: 1 },
                        { color: "#DC143C", weight: 1 },
                    ]}
                />
            )
        case "se":
            return stickerSvg(<SwedenArt />)
        case "lock":
        case "eye":
        case "secret":
        case "warning": {
            const drawn = artwork(item.art)
            const Drawn = drawn.Art
            return (
                <svg viewBox={drawn.viewBox} style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
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
    if (typeof value === "string") return { href: value.trim(), blank: false }
    if (value !== null && typeof value === "object") {
        const record = value as { href?: unknown; url?: unknown; target?: unknown }
        const href = typeof record.href === "string" ? record.href : typeof record.url === "string" ? record.url : ""
        return { href: href.trim(), blank: record.target === "_blank" }
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
