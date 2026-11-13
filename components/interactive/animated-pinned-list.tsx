/**
 * Pinned List — Framer Code Component
 * Adapted from the Unlumen UI Pinned List concept:
 * https://ui.unlumen.com/components/pinned-list
 * Original demo credits @alisamadi__ for the interaction concept.
 *
 * No Tailwind, Next.js aliases, external icon packages, or browser globals.
 */

import * as React from "react"
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
    LayoutGroup,
    motion,
    useReducedMotion,
} from "framer-motion"

type ImageValue = {
    src: string
    srcSet?: string
    alt?: string
}

type ListItem = {
    icon?: string
    customIcon?: ImageValue
    heading?: string
    description?: string
}

type ListEntry = ListItem & { id: string }

type PinnedListProps = {
    items?: ListItem[]
    pinnedTitle?: string
    allTitle?: string
    theme?: "light" | "dark"
    accent?: string
    cardBackground?: string
    pinnedBackground?: string
    headingColor?: string
    descriptionColor?: string
    iconBackground?: string
    radius?: number
    padding?: number
    itemGap?: number
    sectionGap?: number
    iconBoxSize?: number
    wrapText?: boolean
    headingFont?: React.CSSProperties
    descriptionFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const ICON_CHOICES = [
    "store",
    "bag",
    "coffee",
    "briefcase",
    "music",
    "book",
    "folder",
    "gamepad",
    "laptop",
    "phone",
    "globe",
    "calendar",
    "camera",
    "map-pin",
    "gift",
    "home",
    "heart",
    "star",
    "cart",
    "bell",
    "rocket",
    "zap",
    "check",
    "pin",
    "custom",
]

const ICON_LABELS = [
    "Store",
    "Shopping Bag",
    "Coffee",
    "Briefcase",
    "Music",
    "Book",
    "Folder",
    "Gamepad",
    "Laptop",
    "Phone",
    "Globe",
    "Calendar",
    "Camera",
    "Location",
    "Gift",
    "Home",
    "Heart",
    "Star",
    "Shopping Cart",
    "Bell",
    "Rocket",
    "Lightning",
    "Check",
    "Pin",
    "Custom Image",
]

// Local SVG icon paths keep this component portable and Marketplace-friendly.
const ICON_ART: Record<string, React.ReactNode> = {
    store: (
        <>
            <path d="m3 9 2-5h14l2 5" />
            <path d="M3 9v11h18V9M9 20v-7h6v7" />
            <path d="M3 9c0 3 4.5 3 4.5 0 0 3 4.5 3 4.5 0 0 3 4.5 3 4.5 0 0 3 4.5 3 4.5 0" />
        </>
    ),
    bag: (
        <>
            <path d="M4 8h16l-1 13H5L4 8Z" />
            <path d="M9 9V6a3 3 0 0 1 6 0v3" />
        </>
    ),
    coffee: (
        <>
            <path d="M4 8h14v7a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V8Z" />
            <path d="M18 9h2a2 2 0 0 1 0 5h-2M7 3v2m5-2v2" />
        </>
    ),
    briefcase: (
        <>
            <rect x="3" y="7" width="18" height="14" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18M10 13v2h4v-2" />
        </>
    ),
    music: (
        <>
            <path d="M9 18V5l12-2v13" />
            <ellipse cx="6" cy="18" rx="3" ry="2" />
            <ellipse cx="18" cy="16" rx="3" ry="2" />
        </>
    ),
    book: (
        <>
            <path d="M12 7c-3-2-6-2-10-1v13c4-1 7-1 10 1 3-2 6-2 10-1V6c-4-1-7-1-10 1ZM12 7v13" />
        </>
    ),
    folder: (
        <path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" />
    ),
    gamepad: (
        <>
            <path d="M7 8h10a5 5 0 0 1 4.8 4l1 5a3 3 0 0 1-5 3l-2.5-2H8.7l-2.5 2a3 3 0 0 1-5-3l1-5A5 5 0 0 1 7 8Z" />
            <path d="M6 13h6m-3-3v6m8-3h.01M19 11h.01" />
        </>
    ),
    laptop: (
        <>
            <rect x="4" y="4" width="16" height="13" rx="1" />
            <path d="M2 20h20l-2-3H4l-2 3Z" />
        </>
    ),
    phone: (
        <>
            <rect x="6" y="2" width="12" height="20" rx="2" />
            <path d="M11 18h2" />
        </>
    ),
    globe: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18" />
        </>
    ),
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M7 3v4m10-4v4M3 10h18m-13 4h3m3 0h3" />
        </>
    ),
    camera: (
        <>
            <path d="M3 7h4l2-3h6l2 3h4v13H3V7Z" />
            <circle cx="12" cy="13" r="4" />
        </>
    ),
    "map-pin": (
        <>
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
        </>
    ),
    gift: (
        <>
            <rect x="3" y="9" width="18" height="12" rx="1" />
            <path d="M2 6h20v4H2zM12 6v15M12 6C4 6 5 1 8 2c2 0 4 4 4 4Zm0 0c8 0 7-5 4-4-2 0-4 4-4 4Z" />
        </>
    ),
    home: (
        <>
            <path d="m2 11 10-8 10 8M5 10v11h14V10M9 21v-7h6v7" />
        </>
    ),
    heart: (
        <path d="M20.5 5.5a5.5 5.5 0 0 0-7.8 0L12 6.2l-.7-.7a5.5 5.5 0 0 0-7.8 7.8L12 22l8.5-8.7a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    star: <path d="m12 2 3.1 6.3 7 1-5 5 .9 7-6-3.3-6 3.3.9-7-5-5 7-1L12 2Z" />,
    cart: (
        <>
            <circle cx="9" cy="20" r="1" />
            <circle cx="19" cy="20" r="1" />
            <path d="M2 3h2l3 13h13l2-9H5" />
        </>
    ),
    bell: (
        <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
        </>
    ),
    rocket: (
        <>
            <path d="M14 3c4-1 6-1 7-1 0 3 0 5-1 8-2 5-8 8-11 9l-4-4c1-3 4-9 9-12Z" />
            <path d="m9 19-4 3v-5M5 15l-3 4v-5l4-4M13 12l-1 1M16 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
        </>
    ),
    zap: <path d="m13 2-10 12h8l-1 8 11-13h-8V2Z" />,
    check: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="m7 12 3 3 7-7" />
        </>
    ),
    pin: (
        <>
            <path d="m16 3 5 5-4 1-3 5-1 3-3-3-5-1 6-6 1-4 4 0ZM9 15l-6 6" />
        </>
    ),
}

function SmallIcon({ item, color }: { item: ListItem; color: string }) {
    if (item.icon === "custom" && item.customIcon?.src) {
        return (
            <img
                src={item.customIcon.src}
                srcSet={item.customIcon.srcSet}
                alt=""
                draggable={false}
                style={{ width: 22, height: 22, objectFit: "contain" }}
            />
        )
    }
    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ display: "block", flexShrink: 0 }}
        >
            {ICON_ART[item.icon || "store"] || ICON_ART.store}
        </svg>
    )
}

// Phosphor Icons PushPin (regular), MIT license.
// Embedded official artwork keeps the component free of external runtime dependencies.
function PinIcon({ pinned }: { pinned: boolean }) {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 256 256"
            fill="currentColor"
            aria-hidden="true"
            style={{
                display: "block",
                transform: pinned ? "rotate(-45deg)" : "none",
                transition: "transform 180ms ease",
            }}
        >
            <path d="M235.32,81.37,174.63,20.69a16,16,0,0,0-22.63,0L98.37,74.49c-10.66-3.34-35-7.37-60.4,13.14a16,16,0,0,0-1.29,23.78L85,159.71,42.34,202.34a8,8,0,0,0,11.32,11.32L96.29,171l48.29,48.29A16,16,0,0,0,155.9,224c.38,0,.75,0,1.13,0a15.93,15.93,0,0,0,11.64-6.33c19.64-26.1,17.75-47.32,13.19-60L235.33,104A16,16,0,0,0,235.32,81.37ZM224,92.69h0l-57.27,57.46a8,8,0,0,0-1.49,9.22c9.46,18.93-1.8,38.59-9.34,48.62L48,100.08c12.08-9.74,23.64-12.31,32.48-12.31A40.13,40.13,0,0,1,96.81,91a8,8,0,0,0,9.25-1.51L163.32,32,224,92.68Z" />
        </svg>
    )
}

// IDs survive item reordering without requiring an extra ID field in the editor.
// Duplicate entries are assigned distinct occurrence suffixes.
function hashText(input: string) {
    let h = 2166136261
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return (h >>> 0).toString(36)
}

function toEntries(items: ListItem[]): ListEntry[] {
    const counts = new Map<string, number>()
    return items.map((item) => {
        const fingerprint = JSON.stringify([
            item.heading || "",
            item.description || "",
            item.icon || "store",
            item.customIcon?.src || "",
        ])
        const count = counts.get(fingerprint) || 0
        counts.set(fingerprint, count + 1)
        return { ...item, id: `${hashText(fingerprint)}-${count}` }
    })
}

type Palette = {
    surface: string
    text: string
    secondary: string
    iconSurface: string
    iconColor: string
    pinSurface: string
    pinColor: string
    label: string
}

const PALETTES: Record<"light" | "dark", Palette> = {
    light: {
        surface: "#F4F4F5",
        text: "#18181B",
        secondary: "#71717A",
        iconSurface: "#FFFFFF",
        iconColor: "#52525B",
        pinSurface: "#E4E4E7",
        pinColor: "#71717A",
        label: "#71717A",
    },
    dark: {
        surface: "#252529",
        text: "#FAFAFA",
        secondary: "#A1A1AA",
        iconSurface: "#151519",
        iconColor: "#D4D4D8",
        pinSurface: "#3F3F46",
        pinColor: "#D4D4D8",
        label: "#A1A1AA",
    },
}

type RowProps = {
    item: ListEntry
    pinned: boolean
    onToggle: () => void
    palette: Palette
    props: PinnedListProps
    staticMode: boolean
    animationsOff: boolean
}

const Row = React.forwardRef<HTMLDivElement, RowProps>(function Row(
    { item, pinned, onToggle, palette, props, staticMode, animationsOff },
    ref
) {
    const activeColor = props.accent || "#3B82F6"
    const isLight = (props.theme || "light") === "light"
    const surface = pinned
        ? props.pinnedBackground ||
          `color-mix(in srgb, ${activeColor} ${isLight ? "12%" : "18%"}, ${isLight ? "#FFFFFF" : "#16171B"})`
        : props.cardBackground || palette.surface

    return (
        <motion.div
            ref={ref}
            layout={!animationsOff}
            layoutId={animationsOff ? undefined : item.id}
            initial={animationsOff ? false : { opacity: 0, scale: 0.98, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
                animationsOff ? undefined : { opacity: 0, scale: 0.98, y: -4 }
            }
            transition={
                animationsOff
                    ? { duration: 0 }
                    : {
                          layout: {
                              type: "spring",
                              stiffness: 410,
                              damping: 34,
                              mass: 0.8,
                          },
                          opacity: { duration: 0.16 },
                          scale: { duration: 0.2 },
                      }
            }
            style={{
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: `${props.padding ?? 13}px`,
                borderRadius: props.radius ?? 16,
                backgroundColor: surface,
                minWidth: 0,
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    width: props.iconBoxSize ?? 44,
                    height: props.iconBoxSize ?? 44,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: Math.max(8, (props.radius ?? 16) - 4),
                    backgroundColor:
                        props.iconBackground || palette.iconSurface,
                }}
            >
                <SmallIcon item={item} color={palette.iconColor} />
            </div>

            <div
                style={{
                    minWidth: 0,
                    flex: "1 1 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                }}
            >
                <div
                    style={{
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 16,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        ...props.headingFont,
                        color: props.headingColor || palette.text,
                        minWidth: 0,
                        overflow: props.wrapText ? "visible" : "hidden",
                        textOverflow: props.wrapText ? "clip" : "ellipsis",
                        whiteSpace: props.wrapText ? "normal" : "nowrap",
                        overflowWrap: "anywhere",
                    }}
                >
                    {item.heading || "Untitled Item"}
                </div>
                {item.description ? (
                    <div
                        style={{
                            fontFamily: "Inter, system-ui, sans-serif",
                            fontSize: 14,
                            lineHeight: 1.4,
                            ...props.descriptionFont,
                            color: props.descriptionColor || palette.secondary,
                            minWidth: 0,
                            overflow: props.wrapText ? "visible" : "hidden",
                            textOverflow: props.wrapText ? "clip" : "ellipsis",
                            whiteSpace: props.wrapText ? "normal" : "nowrap",
                            overflowWrap: "anywhere",
                        }}
                    >
                        {item.description}
                    </div>
                ) : null}
            </div>

            <button
                type="button"
                data-pin-toggle="true"
                onClick={staticMode ? undefined : onToggle}
                aria-pressed={pinned}
                aria-label={`${pinned ? "Unpin" : "Pin"} ${item.heading || "item"}`}
                title={pinned ? "Unpin item" : "Pin item"}
                style={{
                    appearance: "none",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    color: pinned ? "#FFFFFF" : palette.pinColor,
                    backgroundColor: pinned ? activeColor : palette.pinSurface,
                    transition: animationsOff
                        ? "none"
                        : "background-color 180ms ease, color 180ms ease",
                }}
            >
                <PinIcon pinned={pinned} />
            </button>
        </motion.div>
    )
})

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 430
 * @framerIntrinsicHeight 380
 */
export default function PinnedList(props: PinnedListProps) {
    const isStaticRenderer = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const animationsOff = isStaticRenderer || !!prefersReducedMotion
    const groupId = React.useId()
    const [pinnedIds, setPinnedIds] = React.useState<Set<string>>(
        () => new Set()
    )

    const entries = React.useMemo(
        () => toEntries(Array.isArray(props.items) ? props.items : []),
        [props.items]
    )
    const pinned = entries.filter((item) => pinnedIds.has(item.id))
    const all = entries.filter((item) => !pinnedIds.has(item.id))
    const palette = PALETTES[props.theme === "dark" ? "dark" : "light"]
    const gap = props.itemGap ?? 6

    // Forget pin state for deleted items. Avoid unnecessary state updates.
    React.useEffect(() => {
        if (isStaticRenderer) return
        const ids = new Set(entries.map((item) => item.id))
        setPinnedIds((previous) => {
            const next = new Set([...previous].filter((id) => ids.has(id)))
            return next.size === previous.size ? previous : next
        })
    }, [entries, isStaticRenderer])

    const toggle = React.useCallback((id: string) => {
        setPinnedIds((previous) => {
            const next = new Set(previous)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const sectionLabel = (text: string, key: string) => (
        <motion.div
            key={key}
            layout={!animationsOff}
            initial={animationsOff ? false : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={animationsOff ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: animationsOff ? 0 : 0.18 }}
            style={{
                padding: "2px 4px 4px",
                color: palette.label,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.4,
                ...props.labelFont,
            }}
        >
            {text}
        </motion.div>
    )

    const renderRow = (entry: ListEntry, isPinned: boolean) => (
        <Row
            key={entry.id}
            item={entry}
            pinned={isPinned}
            onToggle={() => toggle(entry.id)}
            palette={palette}
            props={props}
            staticMode={isStaticRenderer}
            animationsOff={animationsOff}
        />
    )

    const content =
        entries.length === 0 ? (
            <div
                style={{
                    padding: 24,
                    textAlign: "center",
                    borderRadius: props.radius ?? 16,
                    color: palette.secondary,
                    backgroundColor: props.cardBackground || palette.surface,
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 14,
                }}
            >
                Add items in the Properties panel
            </div>
        ) : (
            <LayoutGroup id={groupId}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        minWidth: 0,
                    }}
                >
                    <motion.section
                        layout={!animationsOff}
                        aria-label={props.pinnedTitle || "Pinned Items"}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap,
                            minWidth: 0,
                        }}
                    >
                        <AnimatePresence
                            initial={false}
                            mode={animationsOff ? "sync" : "popLayout"}
                        >
                            {pinned.length > 0 &&
                                sectionLabel(
                                    props.pinnedTitle || "Pinned Items",
                                    "pinned-heading"
                                )}
                        </AnimatePresence>
                        <AnimatePresence
                            initial={false}
                            mode={animationsOff ? "sync" : "popLayout"}
                        >
                            {pinned.map((entry) => renderRow(entry, true))}
                        </AnimatePresence>
                    </motion.section>

                    <motion.section
                        layout={!animationsOff}
                        aria-label={props.allTitle || "All Items"}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap,
                            minWidth: 0,
                            marginTop:
                                pinned.length > 0 && all.length > 0
                                    ? (props.sectionGap ?? 14)
                                    : 0,
                        }}
                    >
                        <AnimatePresence
                            initial={false}
                            mode={animationsOff ? "sync" : "popLayout"}
                        >
                            {all.length > 0 &&
                                sectionLabel(
                                    props.allTitle || "All Items",
                                    "all-heading"
                                )}
                        </AnimatePresence>
                        <AnimatePresence
                            initial={false}
                            mode={animationsOff ? "sync" : "popLayout"}
                        >
                            {all.map((entry) => renderRow(entry, false))}
                        </AnimatePresence>
                    </motion.section>
                </div>
            </LayoutGroup>
        )

    return (
        <div
            data-pinned-list-root="true"
            style={
                {
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    ...props.style,
                    "--pinned-list-focus": props.accent || "#3B82F6",
                } as React.CSSProperties
            }
        >
            <style>{`[data-pinned-list-root] [data-pin-toggle]:focus-visible {
            outline: 2px solid var(--pinned-list-focus);
            outline-offset: 3px;
        }
        [data-pinned-list-root] [data-pin-toggle]:hover { filter: brightness(0.96); }
        @media (prefers-reduced-motion: reduce) {
            [data-pinned-list-root] [data-pin-toggle] svg { transition: none !important; }
        }`}</style>
            {content}
        </div>
    )
}

PinnedList.defaultProps = {
    items: [
        {
            icon: "store",
            heading: "Apple Store",
            description: "Electronics · Closes 9:00 PM",
        },
        {
            icon: "coffee",
            heading: "Morning Coffee",
            description: "Café · Open until 8:00 PM",
        },
        {
            icon: "briefcase",
            heading: "Design Studio",
            description: "Creative · Your workspace",
        },
        {
            icon: "music",
            heading: "Music Library",
            description: "Entertainment · Favorites",
        },
        {
            icon: "gamepad",
            heading: "Game Lounge",
            description: "Entertainment · Open now",
        },
    ],
    pinnedTitle: "Pinned Items",
    allTitle: "All Items",
    theme: "light" as const,
    accent: "#3B82F6",
    radius: 16,
    padding: 13,
    itemGap: 6,
    sectionGap: 14,
    iconBoxSize: 44,
    wrapText: false,
}

addPropertyControls(PinnedList, {
    items: {
        type: ControlType.Array,
        title: "Items",
        description:
            "Add, remove, or reorder items. Each has its own icon, heading, and paragraph.",
        maxCount: 50,
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ICON_CHOICES,
                    optionTitles: ICON_LABELS,
                    defaultValue: "store",
                },
                customIcon: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon Image",
                    hidden: (item: ListItem) => item.icon !== "custom",
                },
                heading: {
                    type: ControlType.String,
                    title: "Heading",
                    defaultValue: "New Item",
                },
                description: {
                    type: ControlType.String,
                    title: "Paragraph",
                    defaultValue: "Add a short description",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: PinnedList.defaultProps.items,
    },
    pinnedTitle: {
        type: ControlType.String,
        title: "Pinned Label",
        defaultValue: "Pinned Items",
    },
    allTitle: {
        type: ControlType.String,
        title: "All Label",
        defaultValue: "All Items",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#3B82F6",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Color",
        optional: true,
    },
    pinnedBackground: {
        type: ControlType.Color,
        title: "Pinned Color",
        optional: true,
    },
    headingColor: {
        type: ControlType.Color,
        title: "Title Color",
        optional: true,
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Para Color",
        optional: true,
    },
    iconBackground: {
        type: ControlType.Color,
        title: "Icon BG",
        optional: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    padding: {
        type: ControlType.Number,
        title: "Card Padding",
        min: 6,
        max: 28,
        step: 1,
        unit: "px",
        defaultValue: 13,
    },
    itemGap: {
        type: ControlType.Number,
        title: "Item Gap",
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        defaultValue: 6,
    },
    sectionGap: {
        type: ControlType.Number,
        title: "Section Gap",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 14,
    },
    iconBoxSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 32,
        max: 64,
        step: 1,
        unit: "px",
        defaultValue: 44,
    },
    wrapText: {
        type: ControlType.Boolean,
        title: "Wrap Text",
        defaultValue: false,
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 16, variant: "Semibold", lineHeight: 1.25 },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Para Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14, variant: "Regular", lineHeight: 1.4 },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14, variant: "Medium", lineHeight: 1.4 },
    },
})
