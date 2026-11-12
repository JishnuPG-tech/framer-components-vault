import { jsx as t, jsxs as e } from "react/jsx-runtime"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useCallback, useEffect } from "react"
/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 500
 *  @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

function CompareImage({
    background,
    images,
    borderRadius,
    imageRadius,
    padding,
    gap,
    showLabels = true,
    labelStyles,
    svgCode,
}) {
    const [dividerPosition, setDividerPosition] = useState(50)
    const containerRef = useRef(null)
    const svgRef = useRef(null)

    const handleMouseMove = useCallback((event) => {
        window.requestAnimationFrame(() => {
            const containerLeft =
                containerRef.current.getBoundingClientRect().left
            const position =
                ((event.pageX - containerLeft) /
                    containerRef.current.offsetWidth) *
                100
            setDividerPosition(Math.max(0, Math.min(100, position)))

            // Update SVG position
            if (svgRef.current) {
                const svgElement = svgRef.current
                const rect = containerRef.current.getBoundingClientRect()
                const x = event.clientX - rect.left
                svgElement.style.left = `${x}px`
                svgElement.style.top = "50%"
                svgElement.style.transform = "translate(-50%, -50%)"
            }
        })
    }, [])

    useEffect(() => {
        if (svgRef.current && containerRef.current) {
            const svgElement = svgRef.current
            const containerRect = containerRef.current.getBoundingClientRect()
            svgElement.style.left = `${containerRect.width / 2}px`
            svgElement.style.top = "50%"
            svgElement.style.transform = "translate(-50%, -50%)"
        }
    }, [svgCode])

    const renderImage = (src, alt, clipPath, extraStyles = {}) => (
        <div
            style={{
                position: "absolute",
                width: `calc(100% - ${padding * 2}px)`,
                height: `calc(100% - ${padding * 2}px)`,
                clipPath: clipPath,
                ...extraStyles,
            }}
        >
            <img
                src={src}
                alt={alt}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: `${imageRadius}px`,
                }}
            />
        </div>
    )

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
                position: "relative",
                width: `calc(100% - ${padding * 2}px)`,
                height: `calc(100% - ${padding * 2}px)`,
                margin: "auto",
                background: background,
                borderRadius: `${borderRadius}px`,
                overflow: "hidden",
                padding: `${padding}px`,
                boxSizing: "border-box",
            }}
        >
            {images[0] &&
                renderImage(
                    images[0],
                    "First",
                    `polygon(0 0, ${dividerPosition}% 0, ${dividerPosition}% 100%, 0 100%)`
                )}
            {images[1] &&
                renderImage(
                    images[1],
                    "Second",
                    `polygon(${dividerPosition}% 0, 100% 0, 100% 100%, ${dividerPosition}% 100%)`
                )}
            <div
                style={{
                    position: "absolute",
                    top: "0",
                    left: `${dividerPosition}%`,
                    width: `${gap}px`,
                    height: "100%",
                    background: "white",
                    zIndex: 5,
                    transform: "translateX(-50%)",
                }}
            />
            {showLabels && (
                <div
                    style={{
                        position: "absolute",
                        left: "20px",
                        top: "20px",
                        background: labelStyles.beforeBackgroundColor,
                        padding: "5px 15px",
                        borderRadius: `${labelStyles.beforeBorderRadius}px`,
                        fontSize: labelStyles.beforeFont,
                        color: labelStyles.beforeTextColor,
                        zIndex: 6,
                        backdropFilter: "blur(10px)",
                    }}
                >
                    Before
                </div>
            )}
            {showLabels && (
                <div
                    style={{
                        position: "absolute",
                        right: "20px",
                        top: "20px",
                        background: labelStyles.afterBackgroundColor,
                        padding: "5px 15px",
                        borderRadius: `${labelStyles.afterBorderRadius}px`,
                        fontSize: labelStyles.afterFont,
                        color: labelStyles.afterTextColor,
                        zIndex: 6,
                        backdropFilter: "blur(10px)",
                    }}
                >
                    After
                </div>
            )}
            {svgCode && (
                <div
                    ref={svgRef}
                    style={{
                        position: "absolute",
                        pointerEvents: "none",
                        zIndex: 7,
                    }}
                    dangerouslySetInnerHTML={{ __html: svgCode }}
                />
            )}
        </div>
    )
}

addPropertyControls(CompareImage, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        maxCount: 2,
    },
    svgCode: {
        type: ControlType.String,
        title: "SVG Code",
        defaultValue: "",
        placeholder: "Paste your SVG code here",
    },
    background: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#333",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 50,
        min: 0,
        displayStepper: true,
        step: 1,
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        defaultValue: 20,
        min: 0,
        displayStepper: true,
        step: 1,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 10,
        min: 0,
        displayStepper: true,
        step: 1,
    },
    labelStyles: {
        type: ControlType.Object,
        title: "Label Styles",
        controls: {
            beforeTextColor: {
                type: ControlType.Color,
                title: "[B] Color",
                defaultValue: "white",
            },
            afterTextColor: {
                type: ControlType.Color,
                title: "[A] Color",
                defaultValue: "white",
                description: "⠀",
            },
            beforeFont: {
                type: ControlType.Number,
                title: "[B] Size",
                defaultValue: "12px",
                displayStepper: true,
                unit: "px",
                min: 10,
                step: 1,
            },
            afterFont: {
                type: ControlType.Number,
                title: "[A] Size",
                defaultValue: "12px",
                displayStepper: true,
                unit: "px",
                min: 10,
                step: 1,
                description: "⠀",
            },
            beforeBackgroundColor: {
                type: ControlType.Color,
                title: "[B] BK Color",
                defaultValue: "rgba(255, 255, 255, 0.2)",
            },
            afterBackgroundColor: {
                type: ControlType.Color,
                title: "[A] BK Color",
                defaultValue: "rgba(255, 255, 255, 0.2)",
                description: "⠀",
            },
            beforeBorderRadius: {
                type: ControlType.Number,
                title: "[B] Radius",
                defaultValue: 4,
                min: 0,
                displayStepper: true,
                step: 1,
            },
            afterBorderRadius: {
                type: ControlType.Number,
                title: "[A] Radius",
                defaultValue: 4,
                min: 0,
                displayStepper: true,
                step: 1,
            },
        },
        hidden(props) {
            return !props.showLabels
        },
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Made by *OtVos Studio*\n Contact me for support [( ✉️ contact).](https://x.com/OtVosStudio)",
    },
})

export default CompareImage
