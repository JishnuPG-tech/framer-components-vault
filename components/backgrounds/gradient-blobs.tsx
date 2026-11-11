import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface GradientBlobProps {
    colors: string[]
    blobCount: number
    animationSpeed: number
    blur: number
    opacity: number
    scale: number
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GradientBlob(props: GradientBlobProps) {
    const { colors, blobCount, animationSpeed, blur, opacity, scale } = props

    const blobs = useMemo(() => {
        return Array.from({ length: blobCount }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            initialX: Math.random() * 100,
            initialY: Math.random() * 100,
            size: 40 + Math.random() * 60,
        }))
    }, [blobCount, colors])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: "transparent",
            }}
        >
            <svg width="0" height="0">
                <defs>
                    <filter id="goo">
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation={blur}
                            result="blur"
                        />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                            result="goo"
                        />
                        <feComposite
                            in="SourceGraphic"
                            in2="goo"
                            operator="atop"
                        />
                    </filter>
                </defs>
            </svg>

            <div
                style={{
                    width: "100%",
                    height: "100%",
                    filter: "url(#goo)",
                    position: "relative",
                }}
            >
                {blobs.map((blob) => (
                    <Blob
                        key={blob.id}
                        color={blob.color}
                        initialX={blob.initialX}
                        initialY={blob.initialY}
                        size={blob.size}
                        speed={animationSpeed}
                        opacity={opacity}
                        scale={scale}
                    />
                ))}
            </div>
        </div>
    )
}

interface BlobProps {
    color: string
    initialX: number
    initialY: number
    size: number
    speed: number
    opacity: number
    scale: number
}

function Blob({
    color,
    initialX,
    initialY,
    size,
    speed,
    opacity,
    scale,
}: BlobProps) {
    const x = useMotionValue(initialX)
    const y = useMotionValue(initialY)
    const rotate = useMotionValue(0)
    const scaleX = useMotionValue(1)
    const scaleY = useMotionValue(1)

    useEffect(() => {
        const duration = 20 / speed

        const xAnimation = animate(
            x,
            [initialX, Math.random() * 100, initialX],
            {
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut",
            }
        )

        const yAnimation = animate(
            y,
            [initialY, Math.random() * 100, initialY],
            {
                duration: duration * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
            }
        )

        const rotateAnimation = animate(rotate, [0, 360], {
            duration: duration * 1.5,
            repeat: Infinity,
            ease: "linear",
        })

        const scaleXAnimation = animate(scaleX, [1, 1.3, 0.8, 1], {
            duration: duration * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
        })

        const scaleYAnimation = animate(scaleY, [1, 0.8, 1.3, 1], {
            duration: duration * 0.9,
            repeat: Infinity,
            ease: "easeInOut",
        })

        return () => {
            xAnimation.stop()
            yAnimation.stop()
            rotateAnimation.stop()
            scaleXAnimation.stop()
            scaleYAnimation.stop()
        }
    }, [x, y, rotate, scaleX, scaleY, initialX, initialY, speed])

    const left = useTransform(x, (value) => `${value}%`)
    const top = useTransform(y, (value) => `${value}%`)

    return (
        <motion.div
            style={{
                position: "absolute",
                left,
                top,
                width: size * scale,
                height: size * scale,
                borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
                background: color,
                opacity: opacity,
                rotate,
                scaleX,
                scaleY,
                x: "-50%",
                y: "-50%",
                willChange: "transform",
            }}
        />
    )
}

addPropertyControls(GradientBlob, {
    colors: {
        type: ControlType.Array,
        title: "Colors",
        control: {
            type: ControlType.Color,
        },
        defaultValue: ["#00D9FF", "#7B2FFF", "#FF2E97", "#00FFA3", "#FFD600"],
    },
    blobCount: {
        type: ControlType.Number,
        title: "Blob Count",
        defaultValue: 5,
        min: 1,
        max: 30,
        step: 1,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
    },
    scale: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 1,
        min: 0.5,
        max: 20,
        step: 0.1,
    },
})
