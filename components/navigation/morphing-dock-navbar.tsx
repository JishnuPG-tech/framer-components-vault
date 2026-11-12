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

import { motion, animate, useMotionValue, useTransform, useReducedMotion, type MotionValue } from "framer-motion"

type Item = { label: string; icon: string; image?: { src: string; alt?: string }; source?: string; imageStyle?: string; iconScale?: number; link?: string; newTab?: boolean }
type Palette = { shell: string; active: string; ink: string; muted: string; focus: string; activeInk: string }
interface Props {
    items?: Item[]; activeItem?: number; theme?: string; colors?: Palette;
    expansion?: number; gap?: string; labels?: string; font?: React.CSSProperties;
    padding?: string; cornerRadius?: string; iconSize?: number; iconStroke?: number; transition?: any; style?: React.CSSProperties;
}
const defaults: Item[] = [
    { label: "Home", icon: "Home", link: "", newTab: false },
    { label: "Work", icon: "Grid", link: "", newTab: false },
    { label: "About", icon: "Person", link: "", newTab: false },
    { label: "Contact", icon: "Mail", link: "", newTab: false },
]
const palettes: Record<string, Palette> = {
    Porcelain: { shell: "#E9EBE8", active: "#FFFFFF", ink: "#252923", muted: "#636B60", focus: "#3E6245", activeInk: "#252923" },
    Ink: { shell: "#343A35", active: "#E4ECDD", ink: "#F0F3ED", muted: "#B9C2B4", focus: "#A5CEA8", activeInk: "#252923" },
}
/**
 * Embedded Lucide SVG node data. No imports, runtime requests, or icon library dependency.
 * Official source: https://github.com/lucide-icons/lucide
 * Pinned revision: 500620a2e8123f8d1db191538886dc0c223f69a9
 * Documentation: https://lucide.dev/guide/react
 * License source: https://raw.githubusercontent.com/lucide-icons/lucide/500620a2e8123f8d1db191538886dc0c223f69a9/LICENSE
 * The SVG geometry below is unmodified; attribute names use React SVG casing.
 * Preserve this complete license notice when copying the bundle into another file.
 *
 * ISC License
 *
 * Copyright (c) 2026 Lucide Icons and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * ---
 *
 * The following Lucide icons are derived from the Feather project:
 *
 * airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out
 *
 * The MIT License (MIT) (for the icons listed above)
 *
 * Copyright (c) 2013-present Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

type LucideNodeTag = "path" | "circle" | "ellipse" | "line" | "polyline" | "polygon" | "rect"
type LucideSvgNode = readonly [LucideNodeTag, Readonly<Record<string, string>>]

/** Apply these attributes to the outer SVG, plus aria-hidden/focusable as appropriate. */
const lucideSvgDefaults = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const

/** Existing MorphingDockNavbar names are retained so saved selections migrate without remapping. */
const lucideIcons: Readonly<Record<string, readonly LucideSvgNode[]>> = {
    "Home": [
        [
            "path",
            {
                "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
            }
        ],
        [
            "path",
            {
                "d": "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            }
        ]
    ],
    "Grid": [
        [
            "rect",
            {
                "width": "7",
                "height": "7",
                "x": "3",
                "y": "3",
                "rx": "1"
            }
        ],
        [
            "rect",
            {
                "width": "7",
                "height": "7",
                "x": "14",
                "y": "3",
                "rx": "1"
            }
        ],
        [
            "rect",
            {
                "width": "7",
                "height": "7",
                "x": "14",
                "y": "14",
                "rx": "1"
            }
        ],
        [
            "rect",
            {
                "width": "7",
                "height": "7",
                "x": "3",
                "y": "14",
                "rx": "1"
            }
        ]
    ],
    "Person": [
        [
            "circle",
            {
                "cx": "12",
                "cy": "8",
                "r": "5"
            }
        ],
        [
            "path",
            {
                "d": "M20 21a8 8 0 0 0-16 0"
            }
        ]
    ],
    "Mail": [
        [
            "path",
            {
                "d": "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"
            }
        ],
        [
            "rect",
            {
                "x": "2",
                "y": "4",
                "width": "20",
                "height": "16",
                "rx": "2"
            }
        ]
    ],
    "Briefcase": [
        [
            "path",
            {
                "d": "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
            }
        ],
        [
            "rect",
            {
                "width": "20",
                "height": "14",
                "x": "2",
                "y": "6",
                "rx": "2"
            }
        ]
    ],
    "Folder": [
        [
            "path",
            {
                "d": "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
            }
        ]
    ],
    "Star": [
        [
            "path",
            {
                "d": "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
            }
        ]
    ],
    "Heart": [
        [
            "path",
            {
                "d": "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
            }
        ]
    ],
    "Search": [
        [
            "path",
            {
                "d": "m21 21-4.34-4.34"
            }
        ],
        [
            "circle",
            {
                "cx": "11",
                "cy": "11",
                "r": "8"
            }
        ]
    ],
    "Settings": [
        [
            "path",
            {
                "d": "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"
            }
        ],
        [
            "circle",
            {
                "cx": "12",
                "cy": "12",
                "r": "3"
            }
        ]
    ],
    "Bell": [
        [
            "path",
            {
                "d": "M10.268 21a2 2 0 0 0 3.464 0"
            }
        ],
        [
            "path",
            {
                "d": "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
            }
        ]
    ],
    "Calendar": [
        [
            "path",
            {
                "d": "M8 2v3"
            }
        ],
        [
            "path",
            {
                "d": "M16 2v3"
            }
        ],
        [
            "rect",
            {
                "x": "3",
                "y": "3",
                "width": "18",
                "height": "18",
                "rx": "2"
            }
        ],
        [
            "path",
            {
                "d": "M3 9h18"
            }
        ]
    ],
    "Compass": [
        [
            "circle",
            {
                "cx": "12",
                "cy": "12",
                "r": "10"
            }
        ],
        [
            "path",
            {
                "d": "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"
            }
        ]
    ],
    "Bookmark": [
        [
            "path",
            {
                "d": "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"
            }
        ]
    ],
    "ShoppingBag": [
        [
            "path",
            {
                "d": "M16 10a4 4 0 0 1-8 0"
            }
        ],
        [
            "path",
            {
                "d": "M3.103 6.034h17.794"
            }
        ],
        [
            "path",
            {
                "d": "M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"
            }
        ]
    ],
    "Chart": [
        [
            "path",
            {
                "d": "M3 3v16a2 2 0 0 0 2 2h16"
            }
        ],
        [
            "path",
            {
                "d": "M18 17V9"
            }
        ],
        [
            "path",
            {
                "d": "M13 17V5"
            }
        ],
        [
            "path",
            {
                "d": "M8 17v-3"
            }
        ]
    ],
    "Globe": [
        [
            "circle",
            {
                "cx": "12",
                "cy": "12",
                "r": "10"
            }
        ],
        [
            "path",
            {
                "d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
            }
        ],
        [
            "path",
            {
                "d": "M2 12h20"
            }
        ]
    ],
    "Camera": [
        [
            "path",
            {
                "d": "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"
            }
        ],
        [
            "circle",
            {
                "cx": "12",
                "cy": "13",
                "r": "3"
            }
        ]
    ],
    "Music": [
        [
            "path",
            {
                "d": "M9 18V5l12-2v13"
            }
        ],
        [
            "circle",
            {
                "cx": "6",
                "cy": "18",
                "r": "3"
            }
        ],
        [
            "circle",
            {
                "cx": "18",
                "cy": "16",
                "r": "3"
            }
        ]
    ],
    "FileText": [
        [
            "path",
            {
                "d": "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
            }
        ],
        [
            "path",
            {
                "d": "M14 2v5a1 1 0 0 0 1 1h5"
            }
        ],
        [
            "path",
            {
                "d": "M10 9H8"
            }
        ],
        [
            "path",
            {
                "d": "M16 13H8"
            }
        ],
        [
            "path",
            {
                "d": "M16 17H8"
            }
        ]
    ],
    "MessageCircle": [
        [
            "path",
            {
                "d": "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"
            }
        ]
    ],
    "Plus": [
        [
            "path",
            {
                "d": "M5 12h14"
            }
        ],
        [
            "path",
            {
                "d": "M12 5v14"
            }
        ]
    ]
}

const lucideIconNames = [
    "Home",
    "Grid",
    "Person",
    "Mail",
    "Briefcase",
    "Folder",
    "Star",
    "Heart",
    "Search",
    "Settings",
    "Bell",
    "Calendar",
    "Compass",
    "Bookmark",
    "ShoppingBag",
    "Chart",
    "Globe",
    "Camera",
    "Music",
    "FileText",
    "MessageCircle",
    "Plus"
] as const
type LucideIconName = typeof lucideIconNames[number]

/** Label-to-canonical-name mapping for provenance and documentation. */
const lucideCanonicalNames = {
    "Home": "house",
    "Grid": "layout-grid",
    "Person": "user-round",
    "Mail": "mail",
    "Briefcase": "briefcase",
    "Folder": "folder",
    "Star": "star",
    "Heart": "heart",
    "Search": "search",
    "Settings": "settings",
    "Bell": "bell",
    "Calendar": "calendar",
    "Compass": "compass",
    "Bookmark": "bookmark",
    "ShoppingBag": "shopping-bag",
    "Chart": "chart-column",
    "Globe": "globe",
    "Camera": "camera",
    "Music": "music",
    "FileText": "file-text",
    "MessageCircle": "message-circle",
    "Plus": "plus"
} as const

const lucideSourceRevision = "500620a2e8123f8d1db191538886dc0c223f69a9"

function Glyph({ item, size, stroke }: { item: Item; size: number; stroke: number }) {
    const upload = item.source === "Upload" || item.icon === "Custom"
    const iconSize = Math.min(32, size * Math.max(.5, Math.min(1.5, item.iconScale ?? 1)))
    if (upload && item.image?.src) {
        if (item.imageStyle === "Monochrome") return <span aria-hidden="true" style={{ width: iconSize, height: iconSize, display: "block", background: "currentColor", maskImage: `url(${JSON.stringify(item.image.src)})`, WebkitMaskImage: `url(${JSON.stringify(item.image.src)})`, maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}/>
        return <img src={item.image.src} alt="" draggable={false} style={{ width: iconSize, height: iconSize, objectFit: "contain", display: "block" }}/>
    }
    return <svg aria-hidden="true" focusable="false" width={iconSize} height={iconSize} {...lucideSvgDefaults} strokeWidth={stroke}>{(lucideIcons[item.icon] || lucideIcons.Grid).map(([tag, attributes], i) => React.createElement(tag, { ...attributes, key: i }))}</svg>
}
function Bubble({ index, position, center, centerY, expansion, quiet, staticIndex }: { index: number; position: MotionValue<number>; center: number; centerY: number; expansion: number; quiet: boolean; staticIndex?: number }) {
    const radiusAt = (p: number) => quiet ? 25 : 23 + expansion * Math.pow(Math.max(0, 1 - Math.abs(p - index)), 1.1)
    const radius = useTransform(position, radiusAt)
    return <motion.circle cx={center} cy={centerY} r={staticIndex === undefined ? radius : radiusAt(staticIndex)} />
}
function IconContent({ item, index, position, color, quiet, size, stroke, staticIndex }: { item: Item; index: number; position: MotionValue<number>; color: string; quiet: boolean; size: number; stroke: number; staticIndex?: number }) {
    const scaleAt = (p: number) => quiet ? 1 : .94 + .12 * Math.max(0, 1 - Math.abs(p - index))
    const scale = useTransform(position, scaleAt)
    return <motion.span style={{ display: "flex", alignItems: "center", justifyContent: "center", scale: staticIndex === undefined ? scale : scaleAt(staticIndex), color, pointerEvents: "none" }}><Glyph item={item} size={size} stroke={stroke}/></motion.span>
}

/**
 * @framerIntrinsicWidth 252
 * @framerIntrinsicHeight 68
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function MorphingDockNavbar(props: Props) {
    const {
        items = defaults, activeItem = 1, theme = "Porcelain", colors = palettes.Porcelain,
        expansion = 8, gap = "10px", labels = "Hover", font = {},
        padding = "0px", cornerRadius = "22px", iconSize = 22, iconStroke = 2, transition = { type: "spring", stiffness: 420, damping: 34, mass: .7 }, style,
    } = props
    const list = items.length ? items.slice(0, 6) : defaults
    const safeActive = Math.max(0, Math.min(list.length - 1, activeItem - 1))
    const [selected, setSelected] = React.useState(safeActive)
    const [hovered, setHovered] = React.useState<number | null>(null)
    const [focused, setFocused] = React.useState<number | null>(null)
    const [touch, setTouch] = React.useState(false)
    const [available, setAvailable] = React.useState(10000)
    const [labelWidth, setLabelWidth] = React.useState(60)
    const root = React.useRef<HTMLDivElement>(null)
    const labelRef = React.useRef<HTMLSpanElement>(null)
    const controls = React.useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([])
    const unique = React.useId().replace(/:/g, "")
    const isStatic = useIsStaticRenderer()
    const reduce = !!useReducedMotion()
    const quiet = reduce || touch
    const position = useMotionValue(safeActive)
    const gapPx = Math.max(0, Math.min(18, parseFloat(String(gap)) || 0))
    const slot = 50 + gapPx
    const fullWidth = slot * list.length + 12
    const compact = available < fullWidth
    const columns = compact ? Math.max(1, Math.min(list.length, Math.floor((available + 8) / 72))) : list.length
    const selectedSafe = isStatic ? safeActive : Math.min(selected, list.length - 1)
    const current = isStatic ? safeActive : Math.min(hovered ?? focused ?? selectedSafe, list.length - 1)
    const palette = theme === "Custom" ? { ...palettes.Porcelain, ...colors } : palettes[theme] || palettes.Porcelain
    const activeInk = palette.activeInk
    const labelsOff = labels === "Off"
    const showAll = !labelsOff && (labels === "All" || touch || compact)
    const showSingle = !labelsOff && !showAll && (labels === "Active" || (!isStatic && (focused !== null || hovered !== null)))
    const centerX = 6 + slot * (current + .5)
    const x = useTransform(position, p => 6 + slot * (p + .5))
    const rowHeight = Math.max(64, (23 + expansion + 3) * 2)
    const centerY = rowHeight / 2
    const tileSize = quiet ? 42 : (19 + expansion) * 2
    const tileX = useTransform(position, p => 6 + slot * (p + .5) - tileSize / 2)
    const reverseTileX = useTransform(tileX, value => -value)
    React.useEffect(() => { setSelected(safeActive) }, [safeActive])
    React.useEffect(() => {
        const playback = animate(position, current, quiet || isStatic ? { duration: 0 } : transition)
        return () => playback.stop()
    }, [current, position, quiet, isStatic, transition])
    React.useEffect(() => {
        const label = labelRef.current
        if (!label) return
        // offsetWidth is measured in layout pixels, independent of Framer canvas zoom.
        const measure = () => setLabelWidth(label.offsetWidth)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(label)
        return () => observer.disconnect()
    }, [current, fullWidth, showAll, labels, font])
    React.useEffect(() => {
        const query = window.matchMedia("(hover: none), (pointer: coarse)")
        const update = () => setTouch(query.matches)
        update(); query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])
    React.useEffect(() => {
        const el = root.current
        if (!el) return
        const resize = () => {
            const computed = getComputedStyle(el)
            const width = el.clientWidth - parseFloat(computed.paddingLeft) - parseFloat(computed.paddingRight)
            setAvailable(previous => Math.abs(previous - width) > .5 ? width : previous)
        }
        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])
    function keyDown(event: React.KeyboardEvent, index: number) {
        let next = index
        if (event.key === "ArrowRight") next = (index + 1) % list.length
        else if (event.key === "ArrowLeft") next = (index - 1 + list.length) % list.length
        else if (event.key === "Home") next = 0
        else if (event.key === "End") next = list.length - 1
        else if (event.key === "Escape") { setHovered(null); return }
        else return
        event.preventDefault(); controls.current[next]?.focus()
    }
    const labelX = Math.max(0, Math.min(fullWidth - labelWidth, centerX - labelWidth / 2))
    const textStyle: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, letterSpacing: "-.015em", lineHeight: "1.35em", ...font }
    return <div ref={root} className={`morph-dock-${unique}`} style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", boxSizing: "border-box", padding, overflow: "visible", ...style }}>
        <style>{`
            .morph-dock-${unique} a, .morph-dock-${unique} button { -webkit-tap-highlight-color: transparent; }
            .morph-dock-${unique} .morph-link:focus-visible { outline: 2px solid var(--dock-focus); outline-offset: -3px; border-radius: 18px; box-shadow: 0 0 0 1px ${palette.active}; }
            @media (forced-colors: active) { .morph-dock-${unique} .morph-link { border: 1px solid ButtonText !important; color: ButtonText !important; } }
        `}</style>
        <nav aria-label="Main navigation" onPointerLeave={() => setHovered(null)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(null) }} style={{ position: "relative", width: compact ? "100%" : fullWidth, flexShrink: 0, maxWidth: "100%" }}>
            {!compact && <>
                <svg aria-hidden="true" focusable="false" width={fullWidth} height={rowHeight} viewBox={`0 0 ${fullWidth} ${rowHeight}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
                <defs><filter id={`goo-${unique}`} x="-20%" y="-50%" width="140%" height="200%" colorInterpolationFilters="sRGB">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo"/>
                    <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
                </filter></defs>
                <g fill={palette.shell} filter={`url(#goo-${unique})`}>
                    <rect x={6 + slot / 2} y={centerY - 7} width={slot * (list.length - 1)} height="14" rx="7"/>
                    {list.map((_, i) => <Bubble key={i} index={i} position={position} center={6 + slot * (i + .5)} centerY={centerY} expansion={expansion} quiet={quiet} staticIndex={isStatic ? current : undefined}/>)}
                    <motion.circle cx={isStatic ? centerX : x} cy={centerY} r={quiet ? 25 : 23 + expansion}/>
                </g>
                </svg>
                <motion.div aria-hidden="true" style={{ position: "absolute", left: 0, top: centerY-tileSize/2, width: tileSize, height: tileSize, x: isStatic ? centerX - tileSize / 2 : tileX, borderRadius: "50%", background: palette.active, boxShadow: "0 1px 2px rgba(25,35,23,.055)", pointerEvents: "none", zIndex: 2, overflow: "hidden" }}>
                    <motion.div style={{ position: "absolute", left: 0, top: -(centerY-tileSize/2), width: fullWidth, height: rowHeight, x: isStatic ? -(centerX - tileSize / 2) : reverseTileX, display: "grid", gridTemplateColumns: `repeat(${list.length}, minmax(0,1fr))`, padding: "0 6px", boxSizing: "border-box" }}>
                        {list.map((item, i) => <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><IconContent item={item} index={i} position={position} color={activeInk} quiet={quiet} size={iconSize} stroke={iconStroke} staticIndex={isStatic ? current : undefined}/></div>)}
                    </motion.div>
                </motion.div>
            </>}
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, padding: compact ? 0 : "0 6px", gap: compact ? "8px" : 0, minHeight: compact ? undefined : rowHeight }}>
                {list.map((item, i) => {
                    const isSelected = i === selectedSafe
                    const Tag = item.link ? "a" : "button"
                    const linkProps = item.link ? { href: item.link, target: item.newTab ? "_blank" : undefined, rel: item.newTab ? "noopener noreferrer" : undefined } : { type: "button" as const, "aria-pressed": isSelected }
                    return <Tag key={i} {...linkProps} ref={(el: any) => { controls.current[i] = el }} className="morph-link" aria-label={item.label || `Page ${i + 1}`} aria-current={item.link && isSelected ? "page" : undefined}
                        onPointerEnter={e => { if (e.pointerType !== "touch") setHovered(i) }}
                        onFocus={() => { setHovered(null); setFocused(i) }} onKeyDown={e => keyDown(e, i)} onClick={e => { if (!item.newTab && !e.metaKey && !e.ctrlKey) setSelected(i) }}
                        style={{ "--dock-focus": compact && i === current ? activeInk : palette.focus, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", minWidth: 44, minHeight: 44, height: showAll || compact ? "auto" : rowHeight, padding: showAll || compact ? "0 0 6px" : 0, border: "none", background: compact ? (i === current ? palette.active : palette.shell) : "transparent", borderRadius: compact ? cornerRadius : 0, cursor: "pointer", color: palette.ink, textDecoration: "none", userSelect: "none", touchAction: "manipulation", boxSizing: "border-box" } as React.CSSProperties}>
                        <span style={{ height: compact ? 60 : rowHeight, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <IconContent item={item} index={i} position={position} color={compact && i === current ? activeInk : palette.muted} quiet={quiet || compact} size={iconSize} stroke={iconStroke} staticIndex={isStatic ? current : undefined}/>
                        </span>
                        {showAll && <span aria-hidden="true" style={{ ...textStyle, padding: "0 5px", color: compact && i === current ? activeInk : palette.ink, maxWidth: "100%", overflowWrap: "anywhere", textAlign: "center" }}>{item.label}</span>}
                    </Tag>
                })}
            </div>
            {!labelsOff && !showAll && <div aria-hidden="true" style={{ position: labels === "Hover" ? "absolute" : "relative", top: labels === "Hover" ? "100%" : undefined, left: 0, width: "100%", paddingTop: 2, pointerEvents: "none", zIndex: 4 }}>
                <motion.div initial={false} animate={isStatic ? undefined : { opacity: showSingle ? 1 : 0, x: labelX, y: showSingle ? 0 : -3 }} transition={quiet || isStatic ? { duration: 0 } : transition} style={{ position: "relative", top: 0, left: 0, width: "max-content", maxWidth: fullWidth, ...(isStatic ? { x: labelX, opacity: showSingle ? 1 : 0, y: showSingle ? 0 : -3 } : {}) }}>
                    <span ref={labelRef} style={{ ...textStyle, display: "inline-block", boxSizing: "border-box", maxWidth: fullWidth, overflowWrap: "anywhere", padding: "3px 10px", color: palette.ink, textAlign: "center", whiteSpace: "normal" }}>{list[current]?.label}</span>
                </motion.div>
            </div>}
        </nav>
    </div>
}

MorphingDockNavbar.displayName = "Morphing Dock Navbar"

addPropertyControls(MorphingDockNavbar, {
    items: { type: ControlType.Array, title: "Items", maxCount: 6, defaultValue: defaults, control: { type: ControlType.Object, controls: {
        label: { type: ControlType.String, title: "Label", defaultValue: "Page" },
        source: { type: ControlType.Enum, title: "Icon Source", options: ["Library", "Upload"], optionTitles: ["Lucide", "Upload"], defaultValue: "Library", displaySegmentedControl: true },
        icon: { type: ControlType.Enum, title: "Lucide Icon", options: [...lucideIconNames], defaultValue: "Grid", hidden: p => p.source === "Upload" },
        image: { type: ControlType.ResponsiveImage, title: "Upload Icon", description: "Upload your SVG or transparent PNG. An empty upload uses the library icon.", hidden: p => p.source !== "Upload" && p.icon !== "Custom" },
        imageStyle: { type: ControlType.Enum, title: "Icon Color", options: ["Original", "Monochrome"], defaultValue: "Original", displaySegmentedControl: true, hidden: p => p.source !== "Upload" && p.icon !== "Custom" },
        iconScale: { type: ControlType.Number, title: "Icon Scale", defaultValue: 1, min: .5, max: 1.5, step: .05, description: "Optically align this icon with the rest of the set." },
        link: { type: ControlType.Link, title: "Link", defaultValue: "" },
        newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false },
    } } },
    activeItem: { type: ControlType.Number, title: "Active Item", defaultValue: 1, min: 1, max: 6, step: 1, displayStepper: true },
    theme: { type: ControlType.Enum, title: "Theme", options: ["Porcelain", "Ink", "Custom"], defaultValue: "Porcelain" },
    colors: { type: ControlType.Object, title: "Colors", hidden: p => p.theme !== "Custom", defaultValue: palettes.Porcelain, controls: {
        shell: { type: ControlType.Color, title: "Shell", defaultValue: palettes.Porcelain.shell },
        active: { type: ControlType.Color, title: "Active", defaultValue: palettes.Porcelain.active },
        ink: { type: ControlType.Color, title: "Text", defaultValue: palettes.Porcelain.ink },
        activeInk: { type: ControlType.Color, title: "Active Icons", defaultValue: palettes.Porcelain.activeInk },
        muted: { type: ControlType.Color, title: "Icons", defaultValue: palettes.Porcelain.muted },
        focus: { type: ControlType.Color, title: "Focus", defaultValue: palettes.Porcelain.focus },
    } },
    iconSize: { type: ControlType.Number, title: "Icon Size", defaultValue: 22, min: 16, max: 30, step: 1, unit: "px" },
    iconStroke: { type: ControlType.Number, title: "Icon Stroke", defaultValue: 2, min: 1, max: 3, step: .25, description: "Stroke width for the bundled Lucide icons." },
    cornerRadius: { type: ControlType.BorderRadius, title: "Compact Radius", defaultValue: "22px" },
    expansion: { type: ControlType.Number, title: "Expansion", defaultValue: 8, min: 4, max: 16, step: 1, unit: "px" },
    gap: { type: ControlType.Gap, title: "Gap", defaultValue: "10px" },
    labels: { type: ControlType.Enum, title: "Labels", options: ["Hover", "Active", "All", "Off"], defaultValue: "Hover", description: "Hover also responds to keyboard focus. Touch and compact layouts keep labels visible; Off hides them everywhere." },
    font: { type: ControlType.Font, title: "Label Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "14px", variant: "Medium", lineHeight: "1.35em", letterSpacing: "-.015em" } },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "0px" },
    transition: { type: ControlType.Transition, title: "Motion", defaultValue: { type: "spring", stiffness: 420, damping: 34, mass: .7 }, description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)" },
})
