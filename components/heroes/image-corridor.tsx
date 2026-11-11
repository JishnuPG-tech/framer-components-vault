// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, type CSSProperties } from "react"

const DEFAULT_IMAGES = [
    "https://framerusercontent.com/images/S8QRjcQLNQ0cQ77ZsIZSByLKg.webp?scale-down-to=512",
    "https://framerusercontent.com/images/S9zWNNZRUhFwkvchyjWhxc2bb84.webp?scale-down-to=512",
    "https://framerusercontent.com/images/6FQMkomsN6KIgFrfXH9wBJ3ozsU.png?scale-down-to=512",
    "https://framerusercontent.com/images/xsU3iv72ur8JGK699FXdsXYHkE.webp?scale-down-to=512",
    "https://framerusercontent.com/images/Taa0sZt88DO7OXSEPqyxkX2H2Tc.webp?scale-down-to=512",
    "https://framerusercontent.com/images/XQr6nJKeqyHdjqHrbw0dFIvT2W4.webp?scale-down-to=512",
    "https://framerusercontent.com/images/vXlfIb0HK5RM4727Ecx22rwmLFU.webp?scale-down-to=512",
    "https://framerusercontent.com/images/WmWHD6hpHgh3ftsSl4iqBJgAw.webp?scale-down-to=512",
    "https://framerusercontent.com/images/gEguxL9Wz56dvqP6B5mBbiLBRoE.png?scale-down-to=512",
    "https://framerusercontent.com/images/38sIulSRiIu9AUCeu9Kj8TbmrCg.webp?scale-down-to=512",
    "https://framerusercontent.com/images/lbBnU3ffZz7gFUZpAYXdNOmuxw.webp?scale-down-to=512",
    "https://framerusercontent.com/images/y15G4dhoSVfoqCOSZ7FBZYvY.webp?scale-down-to=512",
    "https://framerusercontent.com/images/GBsS7GAOnwRKQ7xKSuqfXcnyNA.webp?scale-down-to=512",
    "https://framerusercontent.com/images/J88wayYSwwLi1qKil93oaFaj28.webp?scale-down-to=512",
    "https://framerusercontent.com/images/KB4cVPhrs3X21bQG8dn2zT9xXs.webp?scale-down-to=512",
    "https://framerusercontent.com/images/f6Ls72ofaMFYmRm4H2cWY7BpE.webp?scale-down-to=512",
    "https://framerusercontent.com/images/iAi6fdlMUXLSwjXOr3e0yOnEQDI.webp?scale-down-to=512",
    "https://framerusercontent.com/images/WxuLodgd3wdHFVXvAaw6eX1EKk.webp?scale-down-to=512",
    "https://framerusercontent.com/images/Pp06Mepl6DY3yBWZwwFncR050ws.webp?scale-down-to=512",
    "https://framerusercontent.com/images/GvBVA3YTK7YVPiXmZe7FelMk38.webp?scale-down-to=512",
    "https://framerusercontent.com/images/jIJxwZfgHWuGUr7CTs8SuaArfP8.webp?scale-down-to=512",
    "https://framerusercontent.com/images/n9LUo7YvKlz8fkTNb7utUCXAN4.webp?scale-down-to=512",
    "https://framerusercontent.com/images/Z95BoQ28vFbfA2NTVKnz2ePvvlM.webp?scale-down-to=512",
    "https://framerusercontent.com/images/CYu6u5MSf8uqtUGFkb6WqBMzu44.webp?scale-down-to=512",
    "https://framerusercontent.com/images/AZXPxr4R3Tuqmz6xAqIfK2gY.webp?scale-down-to=512",
    "https://framerusercontent.com/images/q07G6Jmmy8XuClYklzpxSC5QEo.webp?scale-down-to=512",
    "https://framerusercontent.com/images/l2e9JvR9dN8UGInrELzrV0H9RA.png?scale-down-to=512",
    "https://framerusercontent.com/images/ZP868lydmsLK0D0DDk0AtsEJ4.webp?scale-down-to=512"
]

interface CorridorProps {
    images: Array<{ src: string; srcSet?: string; alt?: string } | string>
    videos: Array<string>
    speed: number
    density: number
    spread: number
    tilt: number
    panelWidth: number
    panelHeight: number
    background: string
    fadeColor: string
    fade: number
    style?: CSSProperties
}

// Panels travel from far away (DEPTH) toward the camera (0), spreading
// outward from the vanishing point as they approach.
const DEPTH = 2600
const NEAR = 40

/**
 * Image Corridor
 *
 * A receding wall of images: panels emerge small at the vanishing point,
 * then scale up and sweep outward past the viewer.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageCorridor(props: CorridorProps) {
    const {
        images = DEFAULT_IMAGES,
        videos = [],
        speed = 26,
        density = 22,
        spread = 300,
        tilt = 38,
        panelWidth = 300,
        panelHeight = 380,
        background = "rgba(0, 0, 0, 0)",
        fadeColor = "rgb(10, 11, 12)",
        fade = 14,
    } = props

    const isStatic = useIsStaticRenderer()
    const raf = useRef(0)
    const last = useRef(0)
    const elapsed = useRef(0)
    const nodes = useRef<(HTMLDivElement | null)[]>([])
    const veils = useRef<(HTMLDivElement | null)[]>([])
    const rootRef = useRef<HTMLDivElement>(null)

    // Uploaded images arrive as { src, srcSet, alt }; the baked-in gallery
    // defaults are plain URLs. Normalise both, and fall back when empty.
    const picked = (images || [])
        .map((x) => (typeof x === "string" ? { src: x } : x || {}))
        .filter((x) => x && x.src)
    // ControlType.File hands back a plain URL string, unlike ResponsiveImage.
    const clips = (videos || [])
        .filter((v) => typeof v === "string" && v)
        .map((v) => ({ src: v, srcSet: undefined, alt: "", kind: "video" }))
    const media = [...picked.map((x) => ({ ...x, kind: "image" })), ...clips]
    const pool = media.length ? media : DEFAULT_IMAGES.map((u) => ({ src: u, kind: "image" }))
    const count = Math.max(6, Math.round(density))
    const vFade = Math.min(24, Math.max(6, Math.round(fade * 0.8)))
    const edgeMask =
        fade > 0
            ? "linear-gradient(90deg, transparent 0%, black " + fade +
              "%, black " + (100 - fade) + "%, transparent 100%), " +
              "linear-gradient(180deg, transparent 0%, black " + vFade +
              "%, black " + (100 - vFade) + "%, transparent 100%)"
            : undefined
    const groundMask =
        fade > 0
            ? "linear-gradient(180deg, transparent 0%, black " + vFade +
              "%, black " + (100 - vFade) + "%, transparent 100%)"
            : undefined
    const gap = DEPTH / count

    // Position for one panel at a given elapsed time. Pure, so the rAF loop
    // and the first paint agree.
    function place(i: number, side: number, time: number, halfW: number) {
        // Stagger the right column half a step deeper. Otherwise both sides of
        // a row sit at identical depth and read as mirrored twins, which makes
        // any repeated image obvious; offsetting also spreads the panels evenly
        // through the corridor instead of in pairs.
        const raw = (i * gap + (side > 0 ? gap / 2 : 0) - time) % DEPTH
        const z = raw < 0 ? raw + DEPTH : raw
        const depth = z + NEAR
        const near = 1 - depth / (DEPTH + NEAR)
        const out = Math.pow(near, 2.2)
        // Tilt ramps earlier than the outward sweep: panels are face-on at the
        // vanishing point and reach full angle well before they exit frame.
        const swing = Math.min(1, Math.pow(near, 1.3) * 1.9)
        // Panels stay fully opaque and fade by being washed toward fadeColor,
        // so nothing behind the component is ever visible *through* an image.
        // The wash tracks OUTWARD travel, not depth: panels in the middle keep
        // full brightness however far away they are, and only dim as they
        // approach the left and right edges. `fade` sets how wide that zone is.
        // Measured against the real container edge rather than the abstract
        // travel value, so the wash always completes by the time a panel
        // reaches the side — whatever the spread or viewport width.
        const zone =
            fade > 0 ? Math.max(0.05, Math.min(0.95, (fade / 100) * 3)) : 0
        const offsetPx = ((side * (out * spread + 5)) / 100) * panelWidth
        // Before the container is measured (first paint, static canvas) fall
        // back to travel so the preview still shows the wash.
        const edge =
            halfW > 0
                ? Math.min(1, Math.abs(offsetPx) / halfW)
                : Math.min(1, out * 1.6)
        const veil =
            zone > 0
                ? Math.max(0, Math.min(1, (edge - (1 - zone)) / zone))
                : 0
        const exit = near > 0.97 ? Math.max(0, (1 - near) / 0.03) : 1
        return {
            transform:
                "translate3d(" + side * (out * spread + 5) + "%, 0, 0) scale(" +
                (0.1 + near * 1.45) + ") rotateY(" + -side * tilt * swing + "deg)",
            opacity: String(exit),
            veil: String(veil),
            zIndex: String(Math.round(1000 - depth)),
        }
    }

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

        function frame(now: number) {
            const halfW = (rootRef.current ? rootRef.current.clientWidth : 0) / 2
            if (!last.current) last.current = now
            elapsed.current += (Math.min(64, now - last.current) / 1000) * speed
            last.current = now
            for (let i = 0; i < count; i++) {
                for (let s2 = 0; s2 < 2; s2++) {
                    const el = nodes.current[i * 2 + s2]
                    if (!el) continue
                    const p = place(i, s2 === 0 ? -1 : 1, elapsed.current, halfW)
                    el.style.transform = p.transform
                    el.style.opacity = p.opacity
                    el.style.zIndex = p.zIndex
                    const v = veils.current[i * 2 + s2]
                    if (v) v.style.opacity = p.veil
                }
            }
            raf.current = requestAnimationFrame(frame)
        }
        raf.current = requestAnimationFrame(frame)
        return () => {
            cancelAnimationFrame(raf.current)
            last.current = 0
        }
    })


    const mediaStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        backfaceVisibility: "hidden",
    }

    const panels = []

    for (let i = 0; i < count; i++) {
        for (const side of [-1, 1]) {
            const idx = i * 2 + (side === -1 ? 0 : 1)
            const p = place(i, side, 0, 0)
            const item = pool[(i * 2 + (side > 0 ? 1 : 0)) % pool.length]

            panels.push(
                <div
                    key={i + ":" + side}
                    ref={(el) => {
                        nodes.current[idx] = el
                    }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: panelWidth,
                        height: panelHeight,
                        marginLeft: -panelWidth / 2,
                        marginTop: -panelHeight / 2,
                        transform: p.transform,
                        transformStyle: "preserve-3d",
                        opacity: Number(p.opacity),
                        zIndex: Number(p.zIndex),
                        willChange: "transform, opacity",
                    }}
                >
                    {/* muted + playsInline are what browsers require before
                        they will allow autoplay at all. */}
                    {item.kind === "video" ? (
                        <video
                            src={item.src}
                            autoPlay={!isStatic}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            style={mediaStyle}
                        />
                    ) : (
                        <img
                            src={item.src}
                            srcSet={item.srcSet}
                            alt={item.alt || ""}
                            draggable={false}
                            style={mediaStyle}
                        />
                    )}
                    <div
                        aria-hidden
                        ref={(el) => {
                            veils.current[idx] = el
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: fadeColor,
                            opacity: Number(p.veil),
                            pointerEvents: "none",
                        }}
                    />
                </div>
            )
        }
    }

    return (
        <div
            ref={rootRef}
            style={{
                ...props.style,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    background,
                    WebkitMaskImage: groundMask,
                    maskImage: groundMask,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: 900,
                    perspectiveOrigin: "50% 50%",
                    WebkitMaskImage: edgeMask,
                    maskImage: edgeMask,
                    WebkitMaskComposite: "source-in",
                    maskComposite: "intersect",
                }}
            >
                <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
                    {panels}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ImageCorridor, {
    images: {
        type: ControlType.Array,
        title: "Images",
        description: "Leave empty to use the built-in gallery set.",
        control: { type: ControlType.ResponsiveImage },
    },
    videos: {
        type: ControlType.Array,
        title: "Videos",
        description: "Mixed into the same rotation as the images.",
        control: {
            type: ControlType.File,
            allowedFileTypes: ["mp4", "webm", "mov"],
        },
    },
    speed: { type: ControlType.Number, title: "Speed", defaultValue: 26, min: 0, max: 200, step: 1 },
    density: { type: ControlType.Number, title: "Panels", defaultValue: 22, min: 6, max: 40, step: 1 },
    spread: { type: ControlType.Number, title: "Spread", defaultValue: 520, min: 80, max: 1400, step: 10 },
    tilt: { type: ControlType.Number, title: "Tilt", defaultValue: 38, min: 0, max: 80, step: 1, unit: "deg" },
    panelWidth: { type: ControlType.Number, title: "Panel W", defaultValue: 300, min: 80, max: 800, step: 10 },
    panelHeight: { type: ControlType.Number, title: "Panel H", defaultValue: 380, min: 80, max: 900, step: 10 },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0,0,0,0)" },
    fadeColor: { type: ControlType.Color, title: "Fade To", defaultValue: "rgb(10, 11, 12)" },
    fade: { type: ControlType.Number, title: "Edge Fade", defaultValue: 14, min: 0, max: 40, step: 1, unit: "%" },
})


