import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as Framer from "framer"

// User request: Replace single click-to-advance with two invisible overlay zones on the image area: left for previous and right for next, while keeping everything else unchanged.

interface ProjectCarouselImageItem {
    src?: string | { src?: string; alt?: string }
    alt?: string
}

interface MyComponentProps {
    images: ProjectCarouselImageItem[]
    title: string
    backgroundColor: string
    font: any
    textColor: string
    gap: number
    imageFit: "cover" | "contain"
    cursorType: "web" | "custom"
    webCursor: "resize" | "pointer" | "default"
    cursorLeftImage?: string
    cursorRightImage?: string
    cursorSize: number
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
export default function IndexViewer(props: MyComponentProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Placeholder image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Placeholder image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Placeholder image 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Placeholder image 4",
            },
        ],
        title,
        backgroundColor,
        font,
        textColor,
        gap,
        imageFit,
        cursorType,
        webCursor,
        cursorLeftImage,
        cursorRightImage,
        cursorSize,
    } = props
    const useFont = (Framer as any).useFont as
        | ((fontValue: any) => Record<string, any>)
        | undefined
    const fontStyles = useFont ? useFont(font) : font

    const normalizedImages = useMemo(() => {
        const cleaned = (images || [])
            .map((item) => {
                const source =
                    typeof item?.src === "string" ? item.src : item?.src?.src
                const imageAlt =
                    item?.alt ||
                    (typeof item?.src === "string" ? "" : item?.src?.alt) ||
                    ""
                return source ? { src: source, alt: imageAlt } : null
            })
            .filter(
                (item): item is { src: string; alt: string } => item !== null
            )

        if (cleaned.length > 0) return cleaned

        return [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Placeholder image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Placeholder image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Placeholder image 3",
            },
        ]
    }, [images])

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovering, setIsHovering] = useState(false)
    const [mouseOnRight, setMouseOnRight] = useState(false)
    const imageContainerRef = useRef<HTMLDivElement | null>(null)
    const cursorRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (currentIndex > normalizedImages.length - 1) {
            startTransition(() => setCurrentIndex(0))
        }
    }, [currentIndex, normalizedImages.length])

    const handlePrev = useCallback(() => {
        const total = normalizedImages.length
        if (total <= 1) return
        startTransition(() => {
            setCurrentIndex((prev) => (prev - 1 + total) % total)
        })
    }, [normalizedImages.length])

    const handleNext = useCallback(() => {
        const total = normalizedImages.length
        if (total <= 1) return
        startTransition(() => {
            setCurrentIndex((prev) => (prev + 1) % total)
        })
    }, [normalizedImages.length])

    const handleMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
        const container = imageContainerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const localX = event.clientX - rect.left
        const localY = event.clientY - rect.top
        const rightHalf = localX > rect.width / 2
        if (cursorRef.current) {
            cursorRef.current.style.left = `${localX}px`
            cursorRef.current.style.top = `${localY}px`
        }
        startTransition(() => {
            setMouseOnRight(rightHalf)
        })
    }, [])

    const handleMouseEnter = useCallback(() => {
        startTransition(() => {
            setIsHovering(true)
        })
    }, [])

    const handleMouseLeave = useCallback(() => {
        startTransition(() => {
            setIsHovering(false)
        })
    }, [])

    const currentImage = normalizedImages[currentIndex] || normalizedImages[0]
    const counterText = `${currentIndex + 1}/${normalizedImages.length}`
    const leftCursorImageSrc = cursorLeftImage || ""
    const rightCursorImageSrc = cursorRightImage || ""
    const activeCursorImageSrc = mouseOnRight
        ? rightCursorImageSrc
        : leftCursorImageSrc
    const leftWebCursor = webCursor === "resize" ? "w-resize" : webCursor
    const rightWebCursor = webCursor === "resize" ? "e-resize" : webCursor

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap,
                padding: 0,
                border: "none",
                boxSizing: "border-box",
            }}
        >
            <div
                ref={imageContainerRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "block",
                }}
            >
                <img
                    src={currentImage.src}
                    alt={currentImage.alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: imageFit,
                        display: "block",
                    }}
                />
                <button
                    type="button"
                    aria-label="Image précédente"
                    onClick={handlePrev}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "50%",
                        height: "100%",
                        cursor:
                            cursorType === "custom" ? "none" : leftWebCursor,
                        appearance: "none",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                    }}
                />
                <button
                    type="button"
                    aria-label="Image suivante"
                    onClick={handleNext}
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        width: "50%",
                        height: "100%",
                        cursor:
                            cursorType === "custom" ? "none" : rightWebCursor,
                        appearance: "none",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                    }}
                />
                {cursorType === "custom" &&
                isHovering &&
                activeCursorImageSrc ? (
                    <div
                        ref={cursorRef}
                        style={{
                            position: "absolute",
                            pointerEvents: "none",
                            width: cursorSize,
                            height: cursorSize,
                            transform: "translate(-50%, -50%)",
                            top: 0,
                            left: 0,
                            zIndex: 10,
                        }}
                    >
                        <img
                            src={activeCursorImageSrc}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                display: "block",
                            }}
                        />
                    </div>
                ) : null}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    width: "100%",
                    ...fontStyles,
                    color: textColor,
                }}
            >
                <span>{counterText}</span>
                <span>{title}</span>
            </div>
        </div>
    )
}

;(IndexViewer as any).displayName = "Index Viewer"

addPropertyControls(IndexViewer, {
    images: {
        type: ControlType.Array,
        title: "Images",
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Placeholder image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Placeholder image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Placeholder image 3",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                src: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                    placeholder: "Image description",
                },
            },
        },
    },
    title: {
        type: ControlType.String,
        defaultValue: "Project Name",
    },
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Text Style",
        defaultValue: {
            fontSize: 13,
            fontWeight: 400,
            fontFamily: "Inter",
            color: "#ffffff",
        } as any,
        controls: "extended",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 80,
        step: 1,
        displayStepper: true,
    },
    imageFit: {
        type: ControlType.Enum,
        defaultValue: "cover",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        displaySegmentedControl: true,
    },
    cursorType: {
        type: ControlType.Enum,
        options: ["web", "custom"],
        optionTitles: ["Web Cursor", "Custom Image"],
        defaultValue: "web",
        displaySegmentedControl: true,
    },
    webCursor: {
        type: ControlType.Enum,
        title: "Cursor",
        options: ["resize", "pointer", "default"],
        optionTitles: ["Resize", "Pointer", "Default"],
        defaultValue: "resize",
        displaySegmentedControl: false,
        hidden: (props) => props.cursorType !== "web",
    },
    cursorLeftImage: {
        type: ControlType.File,
        title: "Left Image",
        allowedFileTypes: [".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp"],
        hidden: (props) => props.cursorType !== "custom",
    },
    cursorRightImage: {
        type: ControlType.File,
        title: "Right Image",
        allowedFileTypes: [".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp"],
        hidden: (props) => props.cursorType !== "custom",
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 40,
        min: 16,
        max: 120,
        step: 4,
        hidden: (props) => props.cursorType !== "custom",
    },
})
