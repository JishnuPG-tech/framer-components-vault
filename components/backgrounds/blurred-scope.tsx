import {
    type PointerEvent as ReactPointerEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// User request: Create a new self-contained Framer code component named Draggable Reveal Image (not an override) to replace the failed image wrapper. It must expose a configurable image URL property and default it to https://framerusercontent.com/images/NEMpZReNneotElSSFkJf1XivmXg.jpg. Render the image as a blurred base and a sharp version inside a 140px by 140px draggable circular lens. Lens begins centered, follows pointer / touch drag inside bounds, is clamped to image edges, and has a subtle translucent white 1px rim plus soft shadow. The component should fill its canvas bounds responsively and use image cover behavior. Avoid dependencies. Expose at least image URL, blur amount, and lens size as property controls if appropriate. Ensure it renders in Framer canvas and published site.
interface MyComponentProps {
    imageUrl: string
    blurAmount: number
    lensSize: number
    rimColor: string
    shadowColor: string
    altText: string
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DraggableRevealImage(props: MyComponentProps) {
    const { imageUrl, blurAmount, lensSize, rimColor, shadowColor, altText } = props
    const lensRadius = lensSize / 2
    const containerRef = useRef<HTMLDivElement | null>(null)
    const hasUserMovedLensRef = useRef(false)
    const activePointerIdRef = useRef<number | null>(null)
    const isDraggingRef = useRef(false)
    const [isDragging, setIsDragging] = useState(false)
    const [lensPosition, setLensPosition] = useState<{ x: number; y: number } | null>(null)

    const clampLens = useCallback(
        (x: number, y: number, width: number, height: number) => {
            if (width <= 0 || height <= 0) return { x: 0, y: 0 }
            const minX = lensRadius
            const minY = lensRadius
            const maxX = width - lensRadius
            const maxY = height - lensRadius

            return {
                x: minX > maxX ? width / 2 : Math.min(Math.max(x, minX), maxX),
                y: minY > maxY ? height / 2 : Math.min(Math.max(y, minY), maxY),
            }
        },
        [lensRadius]
    )

    const measure = useCallback(() => {
        const element = containerRef.current
        if (!element) return

        const rect = element.getBoundingClientRect()
        setLensPosition((previous) => {
            if (!hasUserMovedLensRef.current || previous === null) {
                return previous
            }
            return clampLens(previous.x, previous.y, rect.width, rect.height)
        })
    }, [clampLens])

    useEffect(() => {
        if (typeof window !== "undefined") {
            measure()
            const onResize = () => measure()
            window.addEventListener("resize", onResize)

            let observer: ResizeObserver | null = null
            if (typeof ResizeObserver !== "undefined" && containerRef.current) {
                observer = new ResizeObserver(() => measure())
                observer.observe(containerRef.current)
            }

            return () => {
                observer?.disconnect()
                window.removeEventListener("resize", onResize)
            }
        }

        return undefined
    }, [measure])

    const updateLens = useCallback(
        (clientX: number, clientY: number) => {
            const element = containerRef.current
            if (!element) return
            const rect = element.getBoundingClientRect()
            const next = clampLens(
                clientX - rect.left,
                clientY - rect.top,
                rect.width,
                rect.height
            )
            setLensPosition(next)
        },
        [clampLens]
    )

    const onPointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            event.preventDefault()
            activePointerIdRef.current = event.pointerId
            isDraggingRef.current = true
            if (event.currentTarget.setPointerCapture) {
                event.currentTarget.setPointerCapture(event.pointerId)
            }
            hasUserMovedLensRef.current = true
            setIsDragging(true)
            updateLens(event.clientX, event.clientY)
        },
        [updateLens]
    )

    const onPointerMove = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!isDraggingRef.current) return
            event.preventDefault()
            updateLens(event.clientX, event.clientY)
        },
        [updateLens]
    )

    const onPointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
        if (activePointerIdRef.current !== null && activePointerIdRef.current !== event.pointerId) {
            return
        }
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
        activePointerIdRef.current = null
        isDraggingRef.current = false
        setIsDragging(false)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleWindowPointerMove = (event: PointerEvent) => {
            if (!isDraggingRef.current) return
            if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
                return
            }
            updateLens(event.clientX, event.clientY)
        }

        const endDrag = (event: PointerEvent) => {
            if (!isDraggingRef.current) return
            if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
                return
            }
            activePointerIdRef.current = null
            isDraggingRef.current = false
            setIsDragging(false)
        }

        window.addEventListener("pointermove", handleWindowPointerMove)
        window.addEventListener("pointerup", endDrag)
        window.addEventListener("pointercancel", endDrag)

        return () => {
            window.removeEventListener("pointermove", handleWindowPointerMove)
            window.removeEventListener("pointerup", endDrag)
            window.removeEventListener("pointercancel", endDrag)
        }
    }, [updateLens])

    const center = useMemo(
        () =>
            lensPosition
                ? { x: `${lensPosition.x}px`, y: `${lensPosition.y}px`, isPixel: true }
                : { x: "50%", y: "50%", isPixel: false },
        [lensPosition]
    )

    const baseImageStyle = useMemo(
        () => ({
            position: "absolute" as const,
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover" as const,
            userSelect: "none" as const,
            WebkitUserDrag: "none" as const,
            pointerEvents: "none" as const,
        }),
        []
    )

    return (
        <div
            ref={containerRef}
            role="img"
            aria-label={altText}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onDragStart={(event) => event.preventDefault()}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "none",
            }}
        >
            <img
                src={imageUrl}
                alt={altText}
                draggable={false}
                style={{
                    ...baseImageStyle,
                    filter: `blur(${blurAmount}px)`,
                }}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: `circle(${lensRadius}px at ${center.x} ${center.y})`,
                    pointerEvents: "none",
                }}
            >
                <img src={imageUrl} alt={altText} draggable={false} style={baseImageStyle} />
            </div>

            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left: center.isPixel ? `calc(${center.x} - ${lensRadius}px)` : "50%",
                    top: center.isPixel ? `calc(${center.y} - ${lensRadius}px)` : "50%",
                    width: lensSize,
                    height: lensSize,
                    borderRadius: "50%",
                    border: `1px solid ${rimColor}`,
                    boxShadow: `0 6px 18px ${shadowColor}`,
                    transform: center.isPixel ? "none" : "translate(-50%, -50%)",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

addPropertyControls(DraggableRevealImage, {
    imageUrl: {
        type: ControlType.String,
        title: "Image URL",
        defaultValue: "https://framerusercontent.com/images/NEMpZReNneotElSSFkJf1XivmXg.jpg",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    lensSize: {
        type: ControlType.Number,
        title: "Lens Size",
        defaultValue: 140,
        min: 60,
        max: 340,
        step: 2,
        unit: "px",
    },
    rimColor: {
        type: ControlType.Color,
        title: "Rim",
        defaultValue: "rgba(255, 255, 255, 0.65)",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow",
        defaultValue: "rgba(0, 0, 0, 0.2)",
    },
    altText: {
        type: ControlType.String,
        title: "Alt",
        defaultValue: "Draggable reveal image",
    },
})