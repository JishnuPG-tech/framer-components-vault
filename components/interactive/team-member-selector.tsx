import { useEffect, useRef, useState } from "react"

import type { CSSProperties } from "react"

import { AnimatePresence, motion } from "framer-motion"

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v))

type Person = {
    name: string

    role: string

    image?: { src?: string; srcSet?: string; alt?: string }
}

const CAST: Person[] = [
    { name: "Adam Marsh", role: "Design" },

    { name: "Priya Raman", role: "Research" },

    { name: "Nora Wilder", role: "Engineering" },

    { name: "Marco Bellini", role: "Product" },
]

const FACE = 28

const CORNER = 22

const LAP = 10

const quad = (n: number, gut: number) => {
    const cell = (FACE - gut) / 2

    const s = cell / FACE

    const a = cell / 2

    const b = FACE - cell / 2

    const m = FACE / 2

    if (n <= 1) return [{ cx: m, cy: m, s: 1 }]

    if (n === 2)
        return [
            { cx: a, cy: m, s },

            { cx: b, cy: m, s },
        ]

    if (n === 3)
        return [
            { cx: a, cy: a, s },

            { cx: b, cy: a, s },

            { cx: a, cy: b, s },
        ]

    return [
        { cx: a, cy: a, s },

        { cx: b, cy: a, s },

        { cx: a, cy: b, s },

        { cx: b, cy: b, s },
    ]
}

const ChevronDown = ({ className }: { className?: string }) => (
    <svg
        className={className}
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
)

const Check = () => (
    <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M20 6 9 17l-5-5" />
    </svg>
)

const initials = (name: string) =>
    name

        .split(/\s+/)

        .filter(Boolean)

        .slice(0, 2)

        .map((w) => w[0]!.toUpperCase())

        .join("")

const Avatar = ({ p, className }: { p: Person; className?: string }) =>
    p.image?.src ? (
        <img
            className={className}
            src={p.image.src}
            srcSet={p.image.srcSet}
            alt=""
            draggable={false}
        />
    ) : (
        <span className={`${className ?? ""} pik-init`} aria-hidden="true">
            {initials(p.name)}
        </span>
    )

type Props = {
    people: Person[]

    corner: number

    overlap: number

    stack: "Row" | "Grid"

    startOpen: boolean

    closeOnOutside: boolean

    stroke: boolean

    ink: string

    card: string

    edge: string

    font?: { fontFamily?: string }

    style?: CSSProperties
}

/**

 * @framerSupportedLayoutWidth any-prefer-fixed

 * @framerSupportedLayoutHeight any-prefer-fixed

 * @framerIntrinsicWidth 264

 * @framerIntrinsicHeight 268

 */

export default function Assignees(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()

    const {
        people = CAST,

        corner = CORNER,

        overlap = LAP,

        stack = "Row",

        startOpen = true,

        closeOnOutside = true,

        stroke = false,

        ink = "#18181B",

        card = "#FFFFFF",

        edge = "rgba(0, 0, 0, 0.12)",

        font,

        style,
    } = props

    const [open, setOpen] = useState(startOpen)

    const [picked, setPicked] = useState<string[]>(
        people.slice(0, 2).map((_, i) => String(i))
    )

    const rootRef = useRef<HTMLDivElement>(null)

    const r = clamp(corner, 0, 26)

    const lap = clamp(overlap, 0, 22)

    const grid = stack === "Grid"

    const spots = quad(picked.length, 4 - (lap / 22) * 2)

    const rail = !picked.length
        ? 0
        : grid
          ? FACE
          : FACE + (picked.length - 1) * (FACE - lap)

    useEffect(() => {
        if (!open || !closeOnOutside || isStaticRenderer) return

        const onDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
        }

        document.addEventListener("pointerdown", onDown)

        return () => document.removeEventListener("pointerdown", onDown)
    }, [open, closeOnOutside, isStaticRenderer])

    const toggle = (id: string) => {
        setPicked((p) =>
            p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
        )
    }

    // Canvas, thumbnails and exports render regular DOM at its final visual state.
    // No Motion components, event handlers or CSS transitions run in this branch.
    if (isStaticRenderer) {
        return (
            <div
                className="pik"
                data-static="true"
                data-stroke={stroke ? "on" : undefined}
                style={
                    {
                        ...style,
                        width: "100%",
                        height: "100%",
                        "--ink": ink,
                        "--card": card,
                        "--fill-on": ink,
                        "--fill-slab": card,
                        "--pane-edge": edge,
                        "--font-ui":
                            font?.fontFamily || "Inter, system-ui, sans-serif",
                        "--pik-row-r": `${Math.max(0, r - 6)}px`,
                    } as CSSProperties
                }
            >
                <style>{CSS}</style>
                <div
                    className="pik-pill"
                    aria-expanded={startOpen}
                    style={{ borderRadius: r }}
                >
                    <span className="pik-rail" style={{ width: rail }}>
                        {picked.map((id, i) => {
                            const person = people[Number(id)]
                            if (!person) return null
                            const spot = grid
                                ? spots[Math.min(i, spots.length - 1)]
                                : null
                            const x = spot
                                ? spot.cx - FACE / 2
                                : i * (FACE - lap)
                            const y = spot ? spot.cy - FACE / 2 : 0
                            return (
                                <span
                                    key={id}
                                    className="pik-face"
                                    style={{
                                        zIndex: people.length - i,
                                        transform: `translate(${x}px, ${y}px) scale(${spot?.s ?? 1})`,
                                    }}
                                >
                                    <Avatar p={person} />
                                </span>
                            )
                        })}
                    </span>
                    {picked.length === 0 && (
                        <span className="pik-say">Unassigned</span>
                    )}
                    <ChevronDown className="pik-chev" />
                </div>
                {startOpen && (
                    <div className="pik-card" style={{ borderRadius: r }}>
                        {people.map((person, idx) => {
                            const selected = picked.includes(String(idx))
                            return (
                                <div
                                    key={idx}
                                    className="pik-row"
                                    data-on={selected || undefined}
                                >
                                    <Avatar p={person} className="pik-av" />
                                    <span className="pik-who">
                                        <span className="pik-name">
                                            {person.name}
                                        </span>
                                        <span className="pik-role">
                                            {person.role}
                                        </span>
                                    </span>
                                    <span className="pik-mark">
                                        {selected && (
                                            <span className="pik-tick">
                                                <Check />
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            className="pik"
            data-stroke={stroke ? "on" : undefined}
            style={
                {
                    ...style,

                    width: "100%",

                    height: "100%",

                    "--ink": ink,

                    "--card": card,

                    "--fill-on": ink,

                    "--fill-slab": card,

                    "--pane-edge": edge,

                    "--font-ui":
                        font?.fontFamily || "Inter, system-ui, sans-serif",

                    "--pik-row-r": `${Math.max(0, r - 6)}px`,
                } as CSSProperties
            }
        >
            <style>{CSS}</style>

            <button
                className="pik-pill"
                style={{ borderRadius: r }}
                onClick={() => {
                    setOpen((v) => !v)
                }}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className="pik-rail" style={{ width: rail }}>
                    <AnimatePresence initial={false}>
                        {picked.map((id, i) => {
                            const person = people[Number(id)]

                            if (!person) return null

                            const spot = grid
                                ? spots[Math.min(i, spots.length - 1)]
                                : null

                            const tx = spot
                                ? spot.cx - FACE / 2
                                : i * (FACE - lap)

                            const ty = spot ? spot.cy - FACE / 2 : 0

                            const sc = spot ? spot.s : 1

                            return (
                                <motion.span
                                    key={id}
                                    className="pik-face"
                                    style={{ zIndex: people.length - i }}
                                    initial={{
                                        scale: 0.2 * sc,

                                        opacity: 0,

                                        x: tx,

                                        y: ty - 10,

                                        rotate: -22,
                                    }}
                                    animate={{
                                        scale: sc,

                                        opacity: 1,

                                        x: tx,

                                        y: ty,

                                        rotate: 0,
                                    }}
                                    exit={{
                                        scale: 0.2 * sc,

                                        opacity: 0,

                                        x: tx,

                                        y: ty - 6,

                                        rotate: 14,
                                    }}
                                    transition={{
                                        type: "spring",

                                        stiffness: 600,

                                        damping: 21,

                                        mass: 0.8,

                                        x: {
                                            type: "spring",

                                            stiffness: 660,

                                            damping: 34,

                                            mass: 0.7,
                                        },

                                        y: {
                                            type: "spring",

                                            stiffness: 660,

                                            damping: 34,

                                            mass: 0.7,
                                        },

                                        scale: {
                                            type: "spring",

                                            stiffness: 660,

                                            damping: 34,

                                            mass: 0.7,
                                        },

                                        opacity: { duration: 0.12 },
                                    }}
                                >
                                    <Avatar p={person} />
                                </motion.span>
                            )
                        })}
                    </AnimatePresence>
                </span>

                {picked.length === 0 && (
                    <span className="pik-say">Unassigned</span>
                )}

                <ChevronDown className="pik-chev" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="pik-card"
                        style={{ borderRadius: r }}
                        role="listbox"
                        aria-multiselectable="true"
                        initial={{
                            opacity: 0,

                            y: -10,

                            scaleX: 0.86,

                            scaleY: 0.72,
                        }}
                        animate={{ opacity: 1, y: 0, scaleX: 1, scaleY: 1 }}
                        exit={{ opacity: 0, y: -8, scaleX: 0.92, scaleY: 0.86 }}
                        transition={{
                            type: "spring",

                            stiffness: 460,

                            damping: 23,

                            mass: 0.9,

                            opacity: { duration: 0.12 },
                        }}
                    >
                        {people.map((p, idx) => {
                            const id = String(idx)

                            const on = picked.includes(id)

                            return (
                                <motion.button
                                    key={id}
                                    className="pik-row"
                                    role="option"
                                    aria-selected={on}
                                    data-on={on || undefined}
                                    onClick={() => toggle(id)}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        type: "spring",

                                        stiffness: 620,

                                        damping: 34,

                                        mass: 0.7,

                                        delay: 0.04 * idx + 0.03,
                                    }}
                                >
                                    <Avatar p={p} className="pik-av" />

                                    <span className="pik-who">
                                        <span className="pik-name">
                                            {p.name}
                                        </span>

                                        <span className="pik-role">
                                            {p.role}
                                        </span>
                                    </span>

                                    <span className="pik-mark">
                                        <AnimatePresence initial={false}>
                                            {on && (
                                                <motion.span
                                                    className="pik-tick"
                                                    initial={{
                                                        scale: 0.4,

                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        scale: 1,

                                                        opacity: 1,
                                                    }}
                                                    exit={{
                                                        scale: 0.4,

                                                        opacity: 0,
                                                    }}
                                                    transition={{
                                                        type: "spring",

                                                        stiffness: 600,

                                                        damping: 28,

                                                        mass: 0.6,
                                                    }}
                                                >
                                                    <Check />
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </span>
                                </motion.button>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

Assignees.displayName = "Assignees"

addPropertyControls(Assignees, {
    people: {
        type: ControlType.Array,

        title: "People",

        maxCount: 8,

        defaultValue: CAST,

        control: {
            type: ControlType.Object,

            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },

                name: {
                    type: ControlType.String,

                    title: "Name",

                    defaultValue: "Name",
                },

                role: {
                    type: ControlType.String,

                    title: "Role",

                    defaultValue: "Role",
                },
            },
        },
    },

    stack: {
        type: ControlType.Enum,

        title: "Stack",

        options: ["Row", "Grid"],

        defaultValue: "Row",

        displaySegmentedControl: true,
    },

    corner: {
        type: ControlType.Number,

        title: "Corner",

        min: 0,

        max: 26,

        step: 1,

        unit: "px",

        defaultValue: CORNER,
    },

    overlap: {
        type: ControlType.Number,

        title: "Overlap",

        min: 0,

        max: 22,

        step: 1,

        unit: "px",

        defaultValue: LAP,
    },

    stroke: { type: ControlType.Boolean, title: "Stroke", defaultValue: false },

    startOpen: {
        type: ControlType.Boolean,

        title: "Start open",

        defaultValue: true,
    },

    closeOnOutside: {
        type: ControlType.Boolean,

        title: "Close outside",

        defaultValue: true,
    },

    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#18181B" },

    card: {
        type: ControlType.Color,

        title: "Surface",

        defaultValue: "#FFFFFF",
    },

    edge: {
        type: ControlType.Color,

        title: "Edge",

        defaultValue: "rgba(0, 0, 0, 0.12)",

        hidden: (p: Props) => !p.stroke,
    },

    font: {
        type: ControlType.Font,

        title: "Font",

        controls: "basic",

        defaultFontType: "sans-serif",
    },
})

const CSS = `

.pik[data-static="true"] *, .pik[data-static="true"] *::before, .pik[data-static="true"] *::after {
  animation: none !important;
  transition: none !important;
}
.pik[data-static="true"] { pointer-events: none; }

.pik {

  position: relative;

  box-sizing: border-box;

  font-family: var(--font-ui);

  color: var(--fill-on, var(--ink));}

.pik-pill {

  position: relative;

  z-index: 2;

  display: inline-flex;

  align-items: center;

  gap: 10px;

  height: 44px;

  padding: 0 12px 0 8px;

  border: 0;

  background: var(--fill-slab, var(--card));

  color: inherit;

  font: inherit;

  font-size: 14px;

  font-weight: 500;

  cursor: pointer;}

[data-stroke="on"] .pik-pill { box-shadow: 0 0 0 1px var(--pane-edge); }

.pik-pill:focus-visible {

  outline: none;

  box-shadow: 0 0 0 2px color-mix(in srgb, var(--fill-on, var(--ink)) 45%, transparent);}

.pik-rail {

  position: relative;

  flex: none;

  height: 28px;

  transition: width 300ms cubic-bezier(0.33, 0.55, 0.2, 1);}

.pik-face {

  position: absolute;

  top: 0;

  left: 0;

  width: 28px;

  height: 28px;

  border-radius: 999px;

  overflow: hidden;

  box-shadow: 0 0 0 2px var(--fill-slab, var(--card));}

.pik-face img { width: 100%; height: 100%; object-fit: cover; display: block; }

.pik-init {

  display: grid;

  place-items: center;

  width: 100%;

  height: 100%;

  border-radius: 999px;

  background: color-mix(in srgb, var(--fill-on, var(--ink)) 12%, var(--fill-slab, var(--card)));

  color: var(--fill-on, var(--ink));

  font-size: 10.5px;

  font-weight: 600;

  line-height: 1;}

.pik-say { margin-left: -6px; color: var(--fill-on, var(--ink)); }

.pik-chev {

  flex: none;

  margin-left: -2px;

  color: color-mix(in srgb, var(--fill-on, var(--ink)) 40%, transparent);

  transition: rotate 240ms cubic-bezier(0.33, 0.55, 0.2, 1), color 150ms ease;}

.pik-pill:hover .pik-chev { color: color-mix(in srgb, var(--fill-on, var(--ink)) 75%, transparent); }

.pik-pill[aria-expanded="true"] .pik-chev { rotate: 180deg; }

.pik-card {

  position: absolute;

  top: 54px;

  left: 0;

  right: 0;

  z-index: 1;

  box-sizing: border-box;

  padding: 6px;

  background: var(--fill-slab, var(--card));

  transform-origin: 0 0;}

[data-stroke="on"] .pik-card { box-shadow: 0 0 0 1px var(--pane-edge); }

.pik-row {

  display: flex;

  align-items: center;

  gap: 10px;

  width: 100%;

  height: 48px;

  padding: 0 8px;

  border: 0;

  border-radius: var(--pik-row-r, 16px);

  background: transparent;

  color: inherit;

  font: inherit;

  text-align: left;

  cursor: pointer;

  transition: background 140ms ease;}

.pik-row:hover { background: color-mix(in srgb, var(--fill-on, var(--ink)) 5%, transparent); }

.pik-row:focus-visible {

  outline: none;

  background: color-mix(in srgb, var(--fill-on, var(--ink)) 7%, transparent);}

.pik-av {

  flex: none;

  width: 32px; height: 32px;

  border-radius: 999px;

  object-fit: cover;

  display: block;}

span.pik-av { display: grid; font-size: 11.5px; }

.pik-who { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }

.pik-name {

  font-size: 13px;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;}

.pik-role {

  font-size: 11.5px;

  color: color-mix(in srgb, var(--fill-on, var(--ink)) 45%, transparent);}

.pik-mark {

  flex: none;

  display: grid;

  place-items: center;

  width: 18px; height: 18px;

  border-radius: 5.5px;

  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--fill-on, var(--ink)) 22%, transparent);

  transition: background 160ms ease, box-shadow 160ms ease;}

.pik-row[data-on] .pik-mark {

  background: var(--fill-on, var(--ink));

  box-shadow: inset 0 0 0 1.5px var(--fill-on, var(--ink));}

.pik-tick {

  display: grid;

  place-items: center;

  color: var(--fill-slab, var(--card));}

@media (prefers-reduced-motion: reduce) {

  .pik-rail, .pik-chev { transition-duration: 1ms; }

}

`
