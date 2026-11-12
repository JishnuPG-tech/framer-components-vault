// Animated masonry grid component with GSAP animations and responsive columns
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react"
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

interface Item {
    id: string
    img: { src: string; alt?: string }
    url: string
    height: number
}

interface GridItem extends Item {
    x: number
    y: number
    w: number
    h: number
}

interface MasonryProps {
    items: Item[]
    duration: number
    stagger: number
    animateFrom: "bottom" | "top" | "left" | "right" | "center" | "random"
    scaleOnHover: boolean
    hoverScale: number
    hoverDuration: number
    blurToFocus: boolean
    blurAmount: number
    padding: number
    showStaticPreview: boolean
    enableDragReorder: boolean
    borderRadius: number
    style?: CSSProperties
}

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
    const get = () => {
        if (typeof window === "undefined") return defaultValue
        return values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue
    }

    const [value, setValue] = useState<number>(get)

    useEffect(() => {
        if (typeof window === "undefined") return

        const handler = () => setValue(get)
        queries.forEach((q) => matchMedia(q).addEventListener("change", handler))
        return () => queries.forEach((q) => matchMedia(q).removeEventListener("change", handler))
    }, [queries])

    return value
}

const useMeasure = <T extends HTMLElement>() => {
    const ref = useRef<T | null>(null)
    const [size, setSize] = useState({ width: 0, height: 0 })

    useLayoutEffect(() => {
        if (!ref.current) return
        
        let timeoutId: number | undefined
        const ro = new ResizeObserver(([entry]) => {
            // Debounce resize updates
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId)
            }
            timeoutId = window.setTimeout(() => {
                const { width, height } = entry.contentRect
                setSize({ width, height })
            }, 16) // ~60fps
        })
        ro.observe(ref.current)
        return () => {
            ro.disconnect()
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId)
            }
        }
    }, [])

    return [ref, size] as const
}

const preloadImages = async (urls: string[]): Promise<void> => {
    await Promise.all(
        urls.map(
            (src) =>
                new Promise<void>((resolve) => {
                    const img = new Image()
                    img.src = src
                    img.onload = img.onerror = () => resolve()
                })
        )
    )
}

/**
 * Animated Masonry Grid
 * 
 * A responsive masonry grid component with smooth animations and interactive features.
 * Perfect for image galleries, portfolios, and dynamic content displays.
 * 
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Masonry(props: MasonryProps) {
    const {
        items,
        duration = 0.5,
        stagger = 0.05,
        animateFrom = "random",
        scaleOnHover = true,
        hoverScale = 0.95,
        hoverDuration = 0.2,
        blurToFocus = true,
        blurAmount = 10,
        padding = 4,
        showStaticPreview = true,
        enableDragReorder = true,
        borderRadius = 4,
    } = props

    const isStatic = useIsStaticRenderer()

    const columns = useMedia(
        ["(min-width:1500px)", "(min-width:1000px)", "(min-width:600px)", "(min-width:400px)"],
        [5, 4, 3, 2],
        1
    )

    const [containerRef, { width }] = useMeasure<HTMLDivElement>()
    const [imagesReady, setImagesReady] = useState(false)
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const [itemOrder, setItemOrder] = useState<number[]>([])
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
    const dragOccurred = useRef(false)
    const [hasAnimated, setHasAnimated] = useState(false)

    // Initialize item order based on items array indices
    useEffect(() => {
        setItemOrder(items.map((_, i) => i))
    }, [items.length])

    useEffect(() => {
        setImagesReady(false)
        setHasAnimated(false)
        const validImages = items.filter((i) => i.img && i.img.src).map((i) => i.img.src)
        if (validImages.length === 0) {
            setImagesReady(true)
            return
        }
        preloadImages(validImages).then(() => {
            // Small delay to ensure images are rendered
            setTimeout(() => setImagesReady(true), 50)
        })
    }, [items])

    const getInitialPosition = (item: GridItem) => {
        const containerRect = containerRef.current?.getBoundingClientRect()
        if (!containerRect) return { x: item.x, y: item.y }

        let direction = animateFrom

        if (animateFrom === "random") {
            const directions = ["top", "bottom", "left", "right"]
            direction = directions[Math.floor(Math.random() * directions.length)] as typeof animateFrom
        }

        if (typeof window === "undefined") return { x: item.x, y: item.y }

        switch (direction) {
            case "top":
                return { x: item.x, y: -200 }
            case "bottom":
                return { x: item.x, y: window.innerHeight + 200 }
            case "left":
                return { x: -200, y: item.y }
            case "right":
                return { x: item.x + window.innerWidth + 200, y: item.y }
            case "center":
                return {
                    x: containerRect.width / 2 - item.w / 2,
                    y: containerRect.height / 2 - item.h / 2,
                }
            default:
                return { x: item.x, y: item.y + 100 }
        }
    }

    const grid = useMemo<GridItem[]>(() => {
        if (!width || itemOrder.length === 0) return []

        const colHeights = new Array(columns).fill(0)
        const columnWidth = width / columns

        return itemOrder.map((originalIndex) => {
            const child = items[originalIndex]
            if (!child) return null
            const col = colHeights.indexOf(Math.min(...colHeights))
            const x = columnWidth * col + padding
            const height = child.height / 2
            const y = colHeights[col] + padding

            colHeights[col] += height + padding

            return { ...child, x, y, w: columnWidth - padding * 2, h: height - padding }
        }).filter(Boolean) as GridItem[]
    }, [columns, items, itemOrder, width, padding])

    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (!enableDragReorder) return
        e.dataTransfer.effectAllowed = "move"
        dragOccurred.current = false
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (!enableDragReorder) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        
        if (draggedIndex !== null && draggedIndex !== index) {
            dragOccurred.current = true
            setDragOverIndex(index)
        }
    }

    const handleDragEnd = () => {
        if (!enableDragReorder) return
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        if (!enableDragReorder) return
        e.preventDefault()

        if (draggedIndex === null || draggedIndex === targetIndex) return

        const newOrder = [...itemOrder]
        const [removed] = newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, removed)

        setItemOrder(newOrder)
        setDraggedIndex(null)
        setDragOverIndex(null)
    }

    const handleClick = (item: GridItem) => {
        if (typeof window !== "undefined" && item.url) {
            // Only open link if drag didn't occur
            if (!enableDragReorder || !dragOccurred.current) {
                window.open(item.url, "_blank", "noopener")
            }
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {grid.map((item, index) => {
                const initialPos = getInitialPosition(item)
                const isDragging = draggedIndex === index
                const isDragOver = dragOverIndex === index
                const shouldAnimate = !isStatic || !showStaticPreview

                return (
                    <motion.div
                        key={`${item.id}-${itemOrder[index]}`}
                        data-key={item.id}
                        ref={(el) => {
                            if (el) itemRefs.current.set(item.id, el)
                        }}
                        draggable={enableDragReorder}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        initial={
                            shouldAnimate && !hasAnimated
                                ? {
                                      opacity: 0,
                                      x: initialPos.x,
                                      y: initialPos.y,
                                      width: item.w,
                                      height: item.h,
                                      filter: blurToFocus ? `blur(${blurAmount}px)` : "blur(0px)",
                                  }
                                : {
                                      opacity: 1,
                                      x: item.x,
                                      y: item.y,
                                      width: item.w,
                                      height: item.h,
                                      filter: "blur(0px)",
                                  }
                        }
                        animate={{
                            opacity: isDragging ? 0.5 : imagesReady ? 1 : 0,
                            x: item.x,
                            y: item.y,
                            width: item.w,
                            height: item.h,
                            filter: "blur(0px)",
                            scale: isDragOver ? 0.95 : 1,
                        }}
                        transition={{
                            duration: shouldAnimate && !hasAnimated ? duration : shouldAnimate ? duration : 0,
                            ease: "easeOut",
                            delay: shouldAnimate && !hasAnimated ? index * stagger : 0,
                            scale: { duration: hoverDuration, ease: "easeOut" },
                        }}
                        whileHover={
                            scaleOnHover
                                ? {
                                      scale: hoverScale,
                                      transition: { duration: hoverDuration, ease: "easeOut" },
                                  }
                                : undefined
                        }
                        style={{
                            position: "absolute",
                            cursor: enableDragReorder ? "grab" : "pointer",
                            willChange: "transform",
                        }}
                        onClick={() => handleClick(item)}
                        onAnimationComplete={() => {
                            if (index === grid.length - 1 && !hasAnimated) {
                                setHasAnimated(true)
                            }
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundImage: item.img && item.img.src ? `url(${item.img.src})` : "none",
                                backgroundColor: item.img && item.img.src ? "transparent" : "#EEEEEE",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                borderRadius: borderRadius,
                                position: "relative",
                                border: isDragOver ? "2px solid #0099FF" : "none",
                                boxSizing: "border-box",
                            }}
                        >
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

addPropertyControls(Masonry, {
    items: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    defaultValue: "1",
                },
                img: {
                    type: ControlType.ResponsiveImage,
                },
                url: {
                    type: ControlType.String,
                    defaultValue: "https://framer.com",
                },
                height: {
                    type: ControlType.Number,
                    defaultValue: 400,
                    min: 100,
                    max: 1000,
                },
            },
        },
        defaultValue: [
            {
                id: "1",
                img: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 1",
                },
                url: "https://framer.com",
                height: 600,
            },
            {
                id: "2",
                img: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 2",
                },
                url: "https://framer.com",
                height: 400,
            },
            {
                id: "3",
                img: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
                url: "https://framer.com",
                height: 500,
            },
            {
                id: "4",
                img: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Image 4",
                },
                url: "https://framer.com",
                height: 450,
            },
            {
                id: "5",
                img: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Image 5",
                },
                url: "https://framer.com",
                height: 550,
            },
            {
                id: "6",
                img: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 6",
                },
                url: "https://framer.com",
                height: 480,
            },
            {
                id: "7",
                img: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 7",
                },
                url: "https://framer.com",
                height: 520,
            },
            {
                id: "8",
                img: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 8",
                },
                url: "https://framer.com",
                height: 420,
            },
            {
                id: "9",
                img: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Image 9",
                },
                url: "https://framer.com",
                height: 580,
            },
            {
                id: "10",
                img: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Image 10",
                },
                url: "https://framer.com",
                height: 440,
            },
            {
                id: "11",
                img: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 11",
                },
                url: "https://framer.com",
                height: 510,
            },
        ],
    },
    showStaticPreview: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Show in Canvas",
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enableDragReorder: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Drag to Reorder",
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    padding: {
        type: ControlType.Number,
        defaultValue: 4,
        min: 0,
        max: 50,
        step: 1,
        title: "Padding",
    },
    duration: {
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        title: "Duration",
    },
    stagger: {
        type: ControlType.Number,
        defaultValue: 0.05,
        min: 0,
        max: 0.5,
        step: 0.01,
        title: "Stagger",
    },
    animateFrom: {
        type: ControlType.Enum,
        options: ["bottom", "top", "left", "right", "center", "random"],
        defaultValue: "random",
        title: "Animate From",
    },
    scaleOnHover: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Scale on Hover",
    },
    hoverScale: {
        type: ControlType.Number,
        defaultValue: 0.95,
        min: 0.5,
        max: 1.5,
        step: 0.05,
        title: "Hover Scale",
        hidden: ({ scaleOnHover }) => !scaleOnHover,
    },
    hoverDuration: {
        type: ControlType.Number,
        defaultValue: 0.15,
        min: 0.05,
        max: 1,
        step: 0.05,
        title: "Hover Duration",
        hidden: ({ scaleOnHover }) => !scaleOnHover,
    },
    blurToFocus: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Blur to Focus",
    },
    blurAmount: {
        type: ControlType.Number,
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
        title: "Blur Amount",
        hidden: ({ blurToFocus }) => !blurToFocus,
    },
    borderRadius: {
        type: ControlType.Number,
        defaultValue: 4,
        min: 0,
        max: 50,
        step: 1,
        title: "Border Radius",
    },
})