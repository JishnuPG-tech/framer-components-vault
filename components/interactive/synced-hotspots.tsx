import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

type Kind = "image" | "list"

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface Item {
    x?: number
    y?: number
    title?: string
    text?: string
    link?: string
}

interface MarkerProps {
    look: "number" | "dot" | "plus"
    size: number
    fill: string
    color: string
    activeFill: string
    activeColor: string
    pulse: boolean
}

interface CardProps {
    width: number
    fill: string
    title: string
    text: string
    link: string
    radius: number
    padding: number
    shadow: boolean
}

interface ListProps {
    showText: "active" | "always" | "never"
    title: string
    text: string
    activeFill: string
    radius: number
    padding: number
    gap: number
}

interface Props {
    kind: Kind
    group: string
    image: ImageValue
    ratio: string
    radius: number
    items: Item[]
    mode: "click" | "hover"
    startOpen: number
    marker: Partial<MarkerProps>
    card: Partial<CardProps>
    list: Partial<ListProps>
    titleFont: CSSProperties
    font: CSSProperties
    linkLabel: string
    newTab: boolean
    style?: CSSProperties
}

interface GroupState {
    active: number
    items: { title: string; text: string }[]
}

// 같은 페이지의 이미지와 목록이 함께 보는 값. 그룹 이름별로 지금 고른 점과 점들의 글을 담는다
const shared = ((globalThis as any).__joviseoHotspots ??= {
    groups: new Map(),
    listeners: new Set(),
}) as {
    groups: Map<string, GroupState>
    listeners: Set<() => void>
}

function update(group: string, change: Partial<GroupState>) {
    const current = shared.groups.get(group) ?? { active: -1, items: [] }
    shared.groups.set(group, { ...current, ...change })
    shared.listeners.forEach((listener) => listener())
}

function useGroup(group: string) {
    const [state, setState] = useState<GroupState | undefined>(() =>
        shared.groups.get(group)
    )

    useEffect(() => {
        const sync = () => setState(shared.groups.get(group))
        sync()
        shared.listeners.add(sync)
        return () => {
            shared.listeners.delete(sync)
        }
    }, [group])

    return state
}

const DEFAULT_ITEMS: Item[] = [
    {
        x: 28,
        y: 34,
        title: "Aluminium frame",
        text: "Machined from a single block, so there are no seams to work loose.",
    },
    {
        x: 62,
        y: 26,
        title: "All-day battery",
        text: "Up to 18 hours on one charge, and half full again in 30 minutes.",
    },
    {
        x: 74,
        y: 68,
        title: "Replaceable parts",
        text: "The band, the cushions and the battery can all be swapped at home.",
    },
]

const RATIOS: Record<string, number> = {
    "16:9": 16 / 9,
    "3:2": 3 / 2,
    "4:3": 4 / 3,
    "1:1": 1,
    "3:4": 3 / 4,
}

const EDGE = 8
const PULSE = "joviseo-hotspot-pulse"

function Badge(props: {
    index: number
    marker: MarkerProps
    active: boolean
    size: number
    outlined?: boolean
}) {
    const { marker, active, size } = props
    return (
        <span
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                width: size,
                height: size,
                borderRadius: 999,
                background: active ? marker.activeFill : marker.fill,
                color: active ? marker.activeColor : marker.color,
                fontSize: Math.round(size * 0.46),
                fontWeight: 600,
                lineHeight: 1,
                // 목록에서는 흰 배경 위에서도 보이도록 옅은 테두리를 둔다
                boxShadow:
                    props.outlined && !active
                        ? "inset 0px 0px 0px 1.5px rgba(0, 0, 0, 0.14)"
                        : "none",
                transition: "background 0.2s ease, color 0.2s ease",
            }}
        >
            {marker.look === "number" && props.index + 1}
            {marker.look === "plus" && (
                <svg
                    aria-hidden="true"
                    width={size * 0.5}
                    height={size * 0.5}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    style={{
                        display: "block",
                        // 열려 있을 때는 +가 돌아서 ×가 된다
                        transform: active ? "rotate(45deg)" : "none",
                        transition: "transform 0.2s ease",
                    }}
                >
                    <path d="M12 5v14M5 12h14" />
                </svg>
            )}
            {marker.look === "dot" && (
                <span
                    style={{
                        width: size * 0.3,
                        height: size * 0.3,
                        borderRadius: 999,
                        background: "currentColor",
                    }}
                />
            )}
        </span>
    )
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 720
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SyncedImageHotspots(props: Props) {
    const {
        kind = "image",
        group = "hotspots",
        image,
        ratio = "auto",
        radius = 16,
        mode = "click",
        startOpen = 0,
        titleFont,
        font,
        linkLabel = "Learn more",
        newTab = false,
        style,
    } = props
    const items = props.items?.length ? props.items : DEFAULT_ITEMS
    const marker: MarkerProps = {
        look: "number",
        size: 32,
        fill: "#FFFFFF",
        color: "#111114",
        activeFill: "#7C5CFF",
        activeColor: "#FFFFFF",
        pulse: true,
        ...props.marker,
    }
    const card: CardProps = {
        width: 260,
        fill: "#FFFFFF",
        title: "#111114",
        text: "#55555F",
        link: "#7C5CFF",
        radius: 14,
        padding: 16,
        shadow: true,
        ...props.card,
    }
    const list: ListProps = {
        showText: "active",
        title: "#111114",
        text: "#55555F",
        activeFill: "#F5F2FF",
        radius: 12,
        padding: 12,
        gap: 4,
        ...props.list,
    }

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const linked = useGroup(group)
    const rootRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement | null>(null)
    const [box, setBox] = useState({ width: 0, height: 0 })
    const [cardHeight, setCardHeight] = useState(0)

    const isImage = kind === "image"
    const first = Math.round(startOpen) - 1
    // 캔버스(편집 화면)에서는 클릭할 수 없으므로 Open First 설정대로만 보여준다
    const active = isStatic
        ? Math.min(first, items.length - 1)
        : (linked?.active ?? -1)

    // 이미지가 목록에 점들의 글과 처음 열어 둘 점을 알려준다
    useEffect(() => {
        if (!isImage) return
        update(group, {
            items: items.map((item) => ({
                title: item.title ?? "",
                text: item.text ?? "",
            })),
        })
    }, [
        isImage,
        group,
        JSON.stringify(items.map((item) => [item.title, item.text])),
    ])

    useEffect(() => {
        if (!isImage) return
        update(group, { active: Math.min(first, items.length - 1) })
    }, [isImage, group, first])

    useEffect(() => {
        if (!isImage) return
        const root = rootRef.current
        if (!root) return
        const measure = () =>
            setBox({ width: root.clientWidth, height: root.clientHeight })
        measure()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measure)
        observer.observe(root)
        return () => observer.disconnect()
    }, [isImage])

    // 카드의 실제 높이를 알아야 점의 위에 둘지 아래에 둘지 정할 수 있다
    useLayoutEffect(() => {
        if (!isImage || active < 0) return
        const element = cardRef.current
        if (element) setCardHeight(element.offsetHeight)
    }, [isImage, active, box.width, JSON.stringify(items[active] ?? null)])

    useEffect(() => {
        if (!isImage || isStatic || active < 0) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") update(group, { active: -1 })
        }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [isImage, isStatic, active, group])

    const base: CSSProperties = {
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.45,
        ...font,
    }
    const heading: CSSProperties = {
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.3,
        ...titleFont,
    }

    if (kind === "list") {
        const entries = linked?.items ?? []
        return (
            <div
                style={{
                    width: 320,
                    ...style,
                    ...base,
                    display: "grid",
                    gap: list.gap,
                    // 이미지가 먼저 그려져야 목록의 글을 알 수 있다
                    visibility:
                        entries.length || isStatic ? "visible" : "hidden",
                }}
            >
                {(entries.length
                    ? entries
                    : DEFAULT_ITEMS.map((item) => ({
                          title: item.title ?? "",
                          text: item.text ?? "",
                      }))
                ).map((entry, index) => {
                    const on = index === active
                    const showText =
                        entry.text &&
                        (list.showText === "always" ||
                            (list.showText === "active" && on))
                    return (
                        <button
                            key={index}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                                update(group, { active: on ? -1 : index })
                            }
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                                width: "100%",
                                margin: 0,
                                padding: list.padding,
                                border: "none",
                                borderRadius: list.radius,
                                background: on
                                    ? list.activeFill
                                    : "transparent",
                                font: "inherit",
                                textAlign: "left",
                                cursor: "pointer",
                                transition: "background 0.2s ease",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            <Badge
                                index={index}
                                marker={marker}
                                active={on}
                                size={Math.min(marker.size, 28)}
                                outlined
                            />
                            <span style={{ minWidth: 0, paddingTop: 3 }}>
                                <span
                                    style={{
                                        ...heading,
                                        display: "block",
                                        color: list.title,
                                    }}
                                >
                                    {entry.title}
                                </span>
                                {showText && (
                                    <span
                                        style={{
                                            display: "block",
                                            marginTop: 4,
                                            color: list.text,
                                            whiteSpace: "pre-line",
                                        }}
                                    >
                                        {entry.text}
                                    </span>
                                )}
                            </span>
                        </button>
                    )
                })}
            </div>
        )
    }

    const fixed = RATIOS[ratio]
    const current = active >= 0 ? items[active] : undefined

    // 카드는 점의 위쪽에 두고, 위에 자리가 없으면 아래쪽에 둔다. 좌우로는 이미지 밖으로 나가지 않게 민다
    const cardWidth = box.width
        ? Math.min(card.width, box.width - EDGE * 2)
        : card.width
    let cardLeft = 0
    let cardTop = 0
    let below = false
    if (current) {
        const pointX = ((current.x ?? 50) / 100) * box.width
        const pointY = ((current.y ?? 50) / 100) * box.height
        const reach = marker.size / 2 + 10
        cardLeft = Math.min(
            Math.max(pointX - cardWidth / 2, EDGE),
            Math.max(box.width - cardWidth - EDGE, EDGE)
        )
        const above = pointY - reach - cardHeight
        const under = pointY + reach
        below = above < EDGE && box.height - under > pointY - reach
        cardTop = below ? under : above
    }
    const ready = box.width > 0 && cardHeight > 0

    const cardBody = current && (
        <>
            {current.title && (
                <div style={{ ...heading, color: card.title }}>
                    {current.title}
                </div>
            )}
            {current.text && (
                <div
                    style={{
                        marginTop: current.title ? 6 : 0,
                        color: card.text,
                        whiteSpace: "pre-line",
                    }}
                >
                    {current.text}
                </div>
            )}
            {current.link && (
                <a
                    href={current.link}
                    target={newTab ? "_blank" : undefined}
                    rel={newTab ? "noopener noreferrer" : undefined}
                    style={{
                        display: "inline-block",
                        marginTop: 10,
                        color: card.link,
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    {linkLabel}
                </a>
            )}
        </>
    )
    const cardStyle: CSSProperties = {
        ...base,
        position: "absolute",
        left: cardLeft,
        top: cardTop,
        zIndex: 3,
        boxSizing: "border-box",
        width: cardWidth,
        padding: card.padding,
        borderRadius: card.radius,
        background: card.fill,
        boxShadow: card.shadow
            ? "0px 10px 30px 0px rgba(0, 0, 0, 0.2)"
            : "none",
        textAlign: "left",
        overflowWrap: "anywhere",
        // 자리를 정하기 전의 한 번은 보이지 않게 그려서 높이만 잰다
        visibility: ready ? "visible" : "hidden",
    }

    return (
        <div
            ref={rootRef}
            onPointerLeave={(event) => {
                if (mode === "hover" && event.pointerType === "mouse")
                    update(group, { active: -1 })
            }}
            style={{
                width: 720,
                ...style,
                position: "relative",
                aspectRatio: fixed
                    ? `${fixed}`
                    : image?.src
                      ? undefined
                      : "16 / 9",
            }}
        >
            {marker.pulse && !isStatic && !reducedMotion && (
                <style>{`@keyframes ${PULSE} { 0% { transform: scale(1); opacity: 0.55 } 100% { transform: scale(2.1); opacity: 0 } }`}</style>
            )}
            {image?.src ? (
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes={box.width ? `${Math.round(box.width)}px` : undefined}
                    alt={image.alt ?? ""}
                    draggable={false}
                    onClick={() =>
                        mode === "click" && update(group, { active: -1 })
                    }
                    style={{
                        display: "block",
                        width: "100%",
                        height: fixed ? "100%" : "auto",
                        objectFit: "cover",
                        borderRadius: radius,
                    }}
                />
            ) : (
                <div
                    onClick={() =>
                        mode === "click" && update(group, { active: -1 })
                    }
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: radius,
                        // 이미지를 넣지 않았을 때 보여주는 배경
                        background:
                            "linear-gradient(135deg, #2B2B33 0%, #43358A 55%, #7C5CFF 100%)",
                    }}
                />
            )}

            {items.map((item, index) => {
                const on = index === active
                return (
                    <button
                        key={index}
                        type="button"
                        aria-expanded={on}
                        aria-label={`${index + 1}. ${item.title ?? ""}`}
                        onClick={() =>
                            update(group, { active: on ? -1 : index })
                        }
                        onPointerEnter={(event) => {
                            if (
                                mode === "hover" &&
                                event.pointerType === "mouse"
                            )
                                update(group, { active: index })
                        }}
                        style={{
                            position: "absolute",
                            left: `${item.x ?? 50}%`,
                            top: `${item.y ?? 50}%`,
                            zIndex: on ? 2 : 1,
                            width: marker.size,
                            height: marker.size,
                            margin: `${-marker.size / 2}px 0 0 ${-marker.size / 2}px`,
                            padding: 0,
                            border: "none",
                            borderRadius: 999,
                            background: "none",
                            boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.25)",
                            cursor: "pointer",
                            transform: on ? "scale(1.12)" : "none",
                            transition: "transform 0.2s ease",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        {marker.pulse && !on && !isStatic && !reducedMotion && (
                            <span
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: 999,
                                    background: marker.fill,
                                    animation: `${PULSE} 2s ease-out infinite`,
                                    animationDelay: `${index * 0.35}s`,
                                }}
                            />
                        )}
                        <span
                            style={{ position: "relative", display: "block" }}
                        >
                            <Badge
                                index={index}
                                marker={marker}
                                active={on}
                                size={marker.size}
                            />
                        </span>
                    </button>
                )
            })}

            {isStatic ? (
                current && (
                    <div ref={cardRef} style={cardStyle}>
                        {cardBody}
                    </div>
                )
            ) : (
                <AnimatePresence>
                    {current && (
                        <motion.div
                            key={active}
                            // 사라지는 중인 앞 카드가 뒤늦게 비우지 못하도록, 새 카드가 생길 때만 기억한다
                            ref={(element) => {
                                if (element) cardRef.current = element
                            }}
                            role="group"
                            aria-live="polite"
                            aria-label={current.title}
                            initial={{
                                opacity: 0,
                                scale: reducedMotion ? 1 : 0.96,
                            }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                            transition={{ duration: 0.16 }}
                            style={{
                                ...cardStyle,
                                transformOrigin: below
                                    ? "center top"
                                    : "center bottom",
                            }}
                        >
                            {cardBody}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}

const isList = (props: Props) => props.kind === "list"
const isImageKind = (props: Props) => (props.kind ?? "image") === "image"

addPropertyControls(SyncedImageHotspots, {
    kind: {
        type: ControlType.Enum,
        title: "Type",
        options: ["image", "list"],
        optionTitles: ["Image", "List"],
        displaySegmentedControl: true,
        defaultValue: "image",
    },
    group: {
        type: ControlType.String,
        title: "Group",
        defaultValue: "hotspots",
        description:
            "A List follows the Image with the same group name.\n\nCreated by [Joviseo](https://joviseo.vercel.app)",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: isList,
    },
    ratio: {
        type: ControlType.Enum,
        title: "Ratio",
        options: ["auto", "16:9", "3:2", "4:3", "1:1", "3:4"],
        optionTitles: ["Auto", "16:9", "3:2", "4:3", "1:1", "3:4"],
        defaultValue: "auto",
        hidden: isList,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 16,
        hidden: isList,
    },
    items: {
        type: ControlType.Array,
        title: "Hotspots",
        maxCount: 20,
        hidden: isList,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                x: {
                    type: ControlType.Number,
                    title: "X",
                    min: 0,
                    max: 100,
                    step: 0.5,
                    unit: "%",
                    defaultValue: 50,
                },
                y: {
                    type: ControlType.Number,
                    title: "Y",
                    min: 0,
                    max: 100,
                    step: 0.5,
                    unit: "%",
                    defaultValue: 50,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    displayTextArea: true,
                    defaultValue: "",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
    },
    mode: {
        type: ControlType.Enum,
        title: "Open On",
        options: ["click", "hover"],
        optionTitles: ["Click", "Hover"],
        displaySegmentedControl: true,
        defaultValue: "click",
        hidden: isList,
    },
    startOpen: {
        type: ControlType.Number,
        title: "Open First",
        min: 0,
        max: 20,
        step: 1,
        displayStepper: true,
        defaultValue: 0,
        description: "The hotspot that starts open. 0 means none.",
        hidden: isList,
    },
    marker: {
        type: ControlType.Object,
        title: "Markers",
        controls: {
            look: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["number", "dot", "plus"],
                optionTitles: ["Number", "Dot", "Plus"],
                defaultValue: "number",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 16,
                max: 64,
                step: 1,
                defaultValue: 32,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",
            },
            color: {
                type: ControlType.Color,
                title: "Icon",
                defaultValue: "#111114",
            },
            activeFill: {
                type: ControlType.Color,
                title: "Active Fill",
                defaultValue: "#7C5CFF",
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active Icon",
                defaultValue: "#FFFFFF",
            },
            pulse: {
                type: ControlType.Boolean,
                title: "Pulse",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
            },
        },
    },
    card: {
        type: ControlType.Object,
        title: "Card",
        hidden: isList,
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                min: 140,
                max: 480,
                step: 10,
                defaultValue: 260,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",
            },
            title: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: "#111114",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#55555F",
            },
            link: {
                type: ControlType.Color,
                title: "Link",
                defaultValue: "#7C5CFF",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 14,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 6,
                max: 40,
                step: 1,
                defaultValue: 16,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                enabledTitle: "Show",
                disabledTitle: "Hide",
                defaultValue: true,
            },
        },
    },
    list: {
        type: ControlType.Object,
        title: "List",
        hidden: isImageKind,
        controls: {
            showText: {
                type: ControlType.Enum,
                title: "Text",
                options: ["active", "always", "never"],
                optionTitles: ["Active Only", "Always", "Never"],
                defaultValue: "active",
            },
            title: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: "#111114",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#55555F",
            },
            activeFill: {
                type: ControlType.Color,
                title: "Active Fill",
                defaultValue: "#F5F2FF",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 12,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 12,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 4,
            },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            variant: "Semibold",
            lineHeight: "1.3em",
        },
    },
    font: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Regular",
            lineHeight: "1.45em",
        },
    },
    linkLabel: {
        type: ControlType.String,
        title: "Link Label",
        defaultValue: "Learn more",
        hidden: isList,
    },
    newTab: {
        type: ControlType.Boolean,
        title: "Links",
        enabledTitle: "New Tab",
        disabledTitle: "Same Tab",
        defaultValue: false,
        hidden: isList,
    },
})
