import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import gsap from "gsap"

type ImageItem = {
    image: string
    name: string
}

export default function ImageGridHero({
    gridCount = 10,
    imageSize = 14,
    images = [],
    blurAmount = 12,
}: {
    gridCount: number
    imageSize: number
    images: ImageItem[]
    blurAmount: number
}) {
    const stageRef = useRef<SVGSVGElement>(null)
    const gridRef = useRef<SVGGElement>(null)

    const [activeImage, setActiveImage] = useState<ImageItem | null>(null)
    const mPos = useRef({ x: 50, y: 50 })

    useEffect(() => {
        if (!stageRef.current || !gridRef.current || images.length === 0) return

        const stage = stageRef.current
        const grid = gridRef.current
        grid.innerHTML = ""

        const pts: SVGGElement[] = []
        let imgIndex = 0

        for (let x = 1; x < gridCount; x++) {
            for (let y = 1; y < gridCount; y++) {
                const item = images[imgIndex % images.length]
                imgIndex++

                const g = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "g"
                )
                const img = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "image"
                )

                const depth = gsap.utils.random(0.8, 1)

                g.appendChild(img)
                grid.appendChild(g)
                pts.push(g)

                gsap.set(g, {
                    x: x * 10,
                    y: y * 10,
                    scale: depth,
                    svgOrigin: "50 50",
                })

                gsap.set(img, {
                    attr: {
                        href: item.image,
                        width: imageSize,
                        height: imageSize,
                    },
                    x: -imageSize / 2,
                    y: -imageSize / 2,
                    cursor: "pointer",
                })

                img.onpointerup = (e) => {
                    e.stopPropagation()
                    setActiveImage(item)
                }
            }
        }

        const redraw = (t: SVGGElement) => {
            const img = t.querySelector("image")
            if (!img) return

            const x = gsap.getProperty(t, "x") as number
            const y = gsap.getProperty(t, "y") as number
            const dist =
                Math.abs(x - mPos.current.x) + Math.abs(y - mPos.current.y)

            gsap.to(img, {
                duration: 0.6,
                scale: Math.max(1 - dist / 100, 0),
                attr: { x: -mPos.current.x, y: -mPos.current.y },
            })
        }

        const onMove = (e: PointerEvent) => {
            const pt = new DOMPoint(e.clientX, e.clientY)
            const svgPt = pt.matrixTransform(stage.getScreenCTM()!.inverse())
            mPos.current = { x: svgPt.x, y: svgPt.y }
            pts.forEach(redraw)
        }

        window.addEventListener("pointermove", onMove)
        return () => window.removeEventListener("pointermove", onMove)
    }, [gridCount, imageSize, images])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <svg
                ref={stageRef}
                viewBox="0 0 100 100"
                style={{ width: "100%", height: "100%" }}
            >
                <g ref={gridRef} />
            </svg>

            {activeImage && (
                <div
                    onClick={() => setActiveImage(null)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: `blur(${blurAmount}px)`,
                        WebkitBackdropFilter: `blur(${blurAmount}px)`,
                        background: "rgba(0,0,0,0.15)",
                    }}
                >
                    <img
                        src={activeImage.image}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: "80%",
                            maxHeight: "80%",
                            borderRadius: 14,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

addPropertyControls(ImageGridHero, {
    gridCount: {
        type: ControlType.Number,
        min: 5,
        max: 12,
        defaultValue: 10,
    },
    imageSize: {
        type: ControlType.Number,
        min: 8,
        max: 20,
        defaultValue: 14,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 30,
        defaultValue: 12,
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image },
                name: { type: ControlType.String },
            },
        },
    },
})
