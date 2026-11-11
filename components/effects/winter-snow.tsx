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

import { useAnimationFrame, useInView } from "framer-motion"

type FadeType = "linear" | "easeOut" | "easeInOut"
type ParticleType = "snowflakes" | "images" | "svgs"

type Flake = {
    id: number
    x: number
    y: number
    baseSize: number
    speed: number
    swayOffset: number
    swaySpeed: number
    swayDrift: number
    scale: number
    opacity: number
    fadeType: FadeType
    rotation: number
    rotationSpeed: number
    assetIndex: number
}

type Props = {
    count: number
    gravity: number
    flakeSize: number
    color: string
    particlesType: ParticleType
    imageFiles: string[]
    svgFiles: string[]
    wind: number
    spin: number
    style?: React.CSSProperties
}

const fadeCurves = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
}

/**
 * Winter Snow
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDefaultSize width=400 height=400
 * @framerDisableUnlink
 */

export default function WinterSnow(props: Props) {
    const {
        count,
        gravity,
        flakeSize,
        color,
        particlesType,
        imageFiles,
        svgFiles,
        wind,
        spin,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef)
    const flakesRef = React.useRef<Flake[]>([])
    const [, forceRender] = React.useState(0)

    // FALLBACK: Generiramo statične čestice samo za Framer Editor kako bi komponenta bila vidljiva (non-animated frame)
    const staticFlakes = React.useMemo(() => {
        if (!isStatic) return []

        const safeCount = Math.min(count, 150)
        return Array.from({ length: safeCount }).map((_, i) => ({
            id: i,
            x: Math.random() * 400, // Hardkodirano na default Framer širinu za preview
            y: Math.random() * 400,
            baseSize: flakeSize * (0.6 + Math.random() * 0.4),
            scale: 1,
            opacity: 0.8 + Math.random() * 0.2, // Lagana nasumična prozirnost
            rotation: Math.random() * 360,
            assetIndex: Math.floor(Math.random() * 10),
            // Ovi dolje nam ne trebaju za statiku, ali zadovoljavaju tip
            speed: 0,
            swayOffset: 0,
            swaySpeed: 0,
            swayDrift: 0,
            fadeType: "linear" as FadeType,
            rotationSpeed: 0,
        }))
    }, [isStatic, count, flakeSize])

    React.useEffect(() => {
        // Preskačemo popunjavanje animiranog niza ako smo unutar Framer Canvasa
        if (isStatic) return

        const w = containerRef.current?.offsetWidth || 400
        const h = containerRef.current?.offsetHeight || 400

        const safeCount = Math.min(count, 150)
        const fadeTypes: FadeType[] = ["linear", "easeOut", "easeInOut"]

        flakesRef.current = Array.from({ length: safeCount }).map((_, i) => ({
            id: i,
            x: Math.random() * w,
            y: Math.random() * h,
            baseSize: flakeSize * (0.6 + Math.random() * 0.4),
            speed: 10 + Math.random() * 20,
            swayOffset: Math.random() * Math.PI * 2,
            swaySpeed: 0.4 + Math.random() * 0.15,
            swayDrift: 0.9 + Math.random() * 0.6,
            scale: 1,
            opacity: 1,
            fadeType: fadeTypes[Math.floor(Math.random() * fadeTypes.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * spin,
            assetIndex: Math.floor(Math.random() * 10),
        }))

        forceRender((v) => v + 1)
    }, [count, flakeSize, spin, particlesType, isStatic])

    useAnimationFrame((t, delta) => {
        // Dodana provjera za isStatic: Editor više ne vrti beskonačnu petlju
        if (isStatic || !isInView) return

        const w = containerRef.current?.offsetWidth || 400
        const h = containerRef.current?.offsetHeight || 400
        const dt = delta / 1000

        flakesRef.current.forEach((flake) => {
            let verticalSpeed = flake.speed * gravity

            const safeFadeEnd = h - flake.baseSize - 5
            const safeFadeStart = Math.min(h * 0.6, safeFadeEnd - h * 0.2)

            if (flake.y > safeFadeStart) {
                const range = Math.max(1, safeFadeEnd - safeFadeStart)
                const raw = Math.max(
                    0,
                    Math.min(1, (flake.y - safeFadeStart) / range)
                )

                const eased = fadeCurves[flake.fadeType](raw)

                flake.scale = Math.max(0, 1 - eased)
                flake.opacity = Math.max(0, 1 - eased)
                verticalSpeed *= 1 - eased * 0.5
            } else {
                flake.scale = 1
                flake.opacity = 1
            }

            flake.y += verticalSpeed * dt
            flake.x += wind * dt
            flake.rotation += flake.rotationSpeed * dt

            const swayBase =
                Math.sin(t / 1600 + flake.swayOffset) +
                Math.sin(t / 3100 + flake.swayOffset * 1.6) * 0.55

            flake.x += swayBase * flake.swaySpeed * flake.swayDrift * 0.44

            if (flake.y >= safeFadeEnd || flake.opacity <= 0.01) {
                flake.y = -flake.baseSize - Math.random() * 50
                flake.x = Math.random() * w
                flake.scale = 1
                flake.opacity = 1
                flake.assetIndex = Math.floor(Math.random() * 10)
            }

            if (flake.x < -100) flake.x = w + 100
            if (flake.x > w + 100) flake.x = -100
        })

        forceRender((v) => v + 1)
    })

    // Na Canvasu ispisujemo statične čestice, na Publish stranici ispisujemo dinamične
    const currentFlakes = isStatic ? staticFlakes : flakesRef.current

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                minWidth: 200,
                minHeight: 200,
            }}
        >
            {currentFlakes.map((flake) => {
                let content

                if (particlesType === "images" && imageFiles.length > 0) {
                    const imgUrl =
                        imageFiles[flake.assetIndex % imageFiles.length]
                    content = (
                        <img
                            src={imgUrl}
                            alt=""
                            aria-hidden="true"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                            }}
                        />
                    )
                } else if (particlesType === "svgs" && svgFiles.length > 0) {
                    const svgUrl = svgFiles[flake.assetIndex % svgFiles.length]
                    content = (
                        <img
                            src={svgUrl}
                            alt=""
                            aria-hidden="true"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                            }}
                        />
                    )
                } else {
                    content = (
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 20 20"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M11.0568 0.741602C11.1998 0.208187 11.7483 -0.108572 12.2817 0.0342681C12.8152 0.177202 13.1319 0.725706 12.9891 1.25914L11.1081 8.27912L18.128 6.39813C18.6614 6.25522 19.2097 6.57195 19.3528 7.10524C19.4957 7.63871 19.1791 8.18704 18.6457 8.32999L11.6248 10.2112L16.7649 15.3509C17.1551 15.7414 17.1549 16.374 16.7645 16.7644C16.3741 17.1549 15.7409 17.1556 15.3504 16.7652L10.2114 11.6262L8.33042 18.6462C8.18737 19.1795 7.63867 19.4955 7.10529 19.3526C6.57212 19.2096 6.25558 18.6619 6.39821 18.1287L8.27988 11.1075L1.25899 12.9887C0.725528 13.1317 0.177191 12.8151 0.034249 12.2816C-0.108497 11.7482 0.207988 11.1998 0.741356 11.0569L7.7613 9.17589L2.62233 4.0369C2.23191 3.64637 2.23198 3.01295 2.62246 2.62246C3.01299 2.23197 3.64639 2.23208 4.03691 2.62259L9.17587 7.76158L11.0568 0.741602Z"
                                fill={color}
                            />
                        </svg>
                    )
                }

                return (
                    <div
                        key={flake.id}
                        style={{
                            position: "absolute",
                            left: flake.x,
                            top: flake.y,
                            width: flake.baseSize,
                            height: flake.baseSize,
                            transform: `scale(${flake.scale}) rotate(${flake.rotation}deg)`,
                            transformOrigin: "50% 50%",
                            opacity: flake.opacity,
                            pointerEvents: "none",
                        }}
                    >
                        {content}
                    </div>
                )
            })}
        </div>
    )
}

WinterSnow.defaultProps = {
    count: 40,
    gravity: 1,
    flakeSize: 15,
    color: "#ffffff",
    particlesType: "snowflakes",
    imageFiles: [],
    svgFiles: [],
    wind: 0,
    spin: 50,
}

addPropertyControls(WinterSnow, {
    particlesType: {
        type: ControlType.Enum,
        title: "Particles",
        options: ["snowflakes", "images", "svgs"],
        optionTitles: ["Snowflakes", "Upload Images", "Upload SVGs"],
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        hidden: (props) => props.particlesType !== "snowflakes",
    },
    imageFiles: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        hidden: (props) => props.particlesType !== "images",
    },
    svgFiles: {
        type: ControlType.Array,
        title: "SVGs",
        control: { type: ControlType.Image },
        hidden: (props) => props.particlesType !== "svgs",
    },
    count: {
        type: ControlType.Number,
        title: "Count",
        min: 5,
        max: 150,
        step: 1,
    },
    gravity: {
        type: ControlType.Number,
        title: "Fall Speed",
        min: 0,
        max: 2,
        step: 0.05,
    },
    wind: {
        type: ControlType.Number,
        title: "Wind",
        min: -200,
        max: 200,
        step: 10,
    },
    spin: {
        type: ControlType.Number,
        title: "Spin Speed",
        min: 0,
        max: 300,
        step: 10,
    },
    flakeSize: {
        type: ControlType.Number,
        title: "Size",
        min: 4,
        max: 100,
        step: 1,
        description:
            "Crafted with 🖤 by Igor.\n\nGrab more [Framer components](https://www.framer.com/%40igor-reif/?tab=marketplace), and if this freebie saved you some time, feel free to [Buy me a beer](https://revolut.me/ireif). Cheers!🍻",
    },
})
