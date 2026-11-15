import { useState, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface ResponsiveImage {
    src: string
    alt?: string
}

interface PixelImageProps {
    image: ResponsiveImage
    rows: number
    cols: number
    duration: number
}

/**
 * Random Pixel Reveal
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */

export default function PixelImage(props: PixelImageProps) {
    const { image, rows, cols, duration } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const [pixels, setPixels] = useState<string[][]>([])
    const [size, setSize] = useState({ width: 400, height: 400 })

    const isStatic = RenderTarget.current() === RenderTarget.thumbnail

    /** detect size */
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const update = () => {
            setSize({
                width: el.offsetWidth,
                height: el.offsetHeight,
            })
        }

        update()

        const observer = new ResizeObserver(update)
        observer.observe(el)

        return () => observer.disconnect()
    }, [])

    /** sample image pixels */
    useEffect(() => {
        if (!image?.src) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
            canvas.width = size.width
            canvas.height = size.height

            ctx.drawImage(img, 0, 0, size.width, size.height)

            const cellW = size.width / cols
            const cellH = size.height / rows

            const result: string[][] = []

            for (let r = 0; r < rows; r++) {
                const row: string[] = []

                for (let c = 0; c < cols; c++) {
                    const x = Math.floor(c * cellW)
                    const y = Math.floor(r * cellH)

                    const data = ctx.getImageData(x, y, 1, 1).data

                    row.push(
                        `rgba(${data[0]},${data[1]},${data[2]},${data[3] / 255})`
                    )
                }

                result.push(row)
            }

            setPixels(result)
        }

        img.src = image.src
    }, [image?.src, rows, cols, size])

    const randomDelays = pixels.flat().map(() => Math.random() * duration)

    let i = 0

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* COLOR IMAGE */}
            <img
                src={image?.src}
                alt={image?.alt}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    position: "absolute",
                    inset: 0,
                }}
            />

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* B&W PIXEL OVERLAY */}
            {pixels.length > 0 && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateRows: `repeat(${rows},1fr)`,
                        gridTemplateColumns: `repeat(${cols},1fr)`,
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        inset: 0,
                    }}
                >
                    {pixels.map((row, r) =>
                        row.map((color, c) => {
                            const delay = randomDelays[i++]

                            return (
                                <motion.div
                                    key={`${r}-${c}`}
                                    style={{
                                        backgroundColor: color,
                                        filter: "grayscale(100%)",
                                    }}
                                    initial={{
                                        opacity: 1,
                                    }}
                                    animate={
                                        !isStatic
                                            ? {
                                                  opacity: 0,
                                              }
                                            : {}
                                    }
                                    transition={{
                                        duration: 0.6,
                                        delay: delay,
                                        ease: "easeOut",
                                    }}
                                />
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}

addPropertyControls(PixelImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },

    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 18,
        min: 5,
        max: 60,
    },

    cols: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 18,
        min: 5,
        max: 60,
    },

    duration: {
        type: ControlType.Number,
        title: "Reveal Time",
        defaultValue: 2,
        min: 0.5,
        max: 6,
        step: 0.1,
        unit: "s",
    },
})
