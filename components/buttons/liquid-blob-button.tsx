import { useState, useEffect, useRef, useId, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useSpring, useMotionValue } from "framer-motion"

const DEFAULT_MAX_RADIUS = 14
const BLOB_COUNT = 6

function linearMap(value, minA, maxA, minB, maxB) {
    const returnVal =
        (1 - (value - minA) / (maxA - minA)) * minB +
        ((value - minA) / (maxA - minA)) * maxB
    if (returnVal < minB) return minB
    if (returnVal > maxB) return maxB
    return returnVal
}

// Corner radii [top-left, top-right, bottom-right, bottom-left] for each shape
function getCorners(shape, cornerRadius, w, h) {
    const max = Math.min(w, h) / 2
    const r = Math.min(cornerRadius, max)
    switch (shape) {
        case "Rounded":
            return [r, r, r, r]
        case "Square":
            return [0, 0, 0, 0]
        case "Leaf":
            return [max, 0, max, 0]
        case "Tab":
            return [r, r, 0, 0]
        case "Ticket":
            return [0, max, 0, max]
        case "Pill":
        default:
            return [max, max, max, max]
    }
}

function shapePath(w, h, [tl, tr, br, bl]) {
    return [
        `M ${tl} 0`,
        `H ${w - tr}`,
        `A ${tr} ${tr} 0 0 1 ${w} ${tr}`,
        `V ${h - br}`,
        `A ${br} ${br} 0 0 1 ${w - br} ${h}`,
        `H ${bl}`,
        `A ${bl} ${bl} 0 0 1 0 ${h - bl}`,
        `V ${tl}`,
        `A ${tl} ${tl} 0 0 1 ${tl} 0`,
        "Z",
    ].join(" ")
}

function useButtonGooey(svgSize) {
    const maskID = useId()
    const ref = useRef(null)
    const scale = useMotionValue(0)
    const x = useMotionValue(svgSize.w / 2)
    const y = useMotionValue(svgSize.h / 2)

    const mapPointerToSVG = (pointerX, pointerY) => {
        if (!ref.current) return
        const {
            x: rectX,
            y: rectY,
            width,
            height,
        } = ref.current.getBoundingClientRect()
        x.set(linearMap(pointerX - rectX, 0, width, 0, svgSize.w))
        y.set(linearMap(pointerY - rectY, 0, height, 0, svgSize.h))
    }

    const handleTouchMove = (e) => {
        const touch = e.touches[0]
        mapPointerToSVG(touch.clientX, touch.clientY)
    }
    const handleMouseMove = (e) => {
        mapPointerToSVG(e.clientX, e.clientY)
    }
    const handleMouseClick = () => {
        scale.set(2)
        setTimeout(() => {
            scale.set(1)
        }, 100)
    }
    const handleMouseLeave = () => {
        scale.set(0)
    }
    const handleMouseEnter = () => {
        scale.set(1)
    }

    return {
        maskID,
        ref,
        scale,
        x,
        y,
        handleTouchMove,
        handleMouseMove,
        handleMouseLeave,
        handleMouseEnter,
        handleMouseClick,
    }
}

function ButtonGooeyBlob({ x, y, radius, scale, stiffness, damping, mass }) {
    const scaleSpring = useSpring(scale, { stiffness, damping, mass })
    const xSpring = useSpring(x, { stiffness, damping, mass })
    const ySpring = useSpring(y, { stiffness, damping, mass })
    return (
        <motion.circle
            cx="0"
            cy="0"
            r={radius}
            fill="black"
            style={{ cx: xSpring, cy: ySpring, scale: scaleSpring }}
        />
    )
}

/**
 * Coalesce
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Coalesce(props) {
    const {
        label,
        maxRadius,
        background,
        textColor,
        font,
        style,
        link, // add link prop
        shape = "Pill",
        cornerRadius = 12,
    } = props
    const [svgSize, setSvgSize] = useState({ w: 200, h: 56 })
    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()
    const [isBlobHover, setIsBlobHover] = useState(false)
    const {
        maskID,
        ref,
        scale,
        x,
        y,
        handleTouchMove,
        handleMouseMove,
        handleMouseLeave,
        handleMouseEnter,
        handleMouseClick,
    } = useButtonGooey(svgSize)

    useEffect(() => {
        if (!ref.current) return
        function handleResize() {
            setSvgSize({
                w: ref.current.offsetWidth,
                h: ref.current.offsetHeight,
            })
        }
        handleResize()
        const resizeObserver = new window.ResizeObserver(handleResize)
        resizeObserver.observe(ref.current)
        return () => resizeObserver.disconnect()
    }, [ref])

    const corners = getCorners(shape, cornerRadius, svgSize.w, svgSize.h)
    const borderRadius = corners.map((c) => `${c}px`).join(" ")

    // SVG filter for gooey effect
    const filterId = "gooey"
    const svgDefs = (
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
            <defs>
                <filter id={filterId}>
                    <feGaussianBlur
                        in="SourceGraphic"
                        stdDeviation="6"
                        result="blur"
                    />
                    <feColorMatrix
                        in="blur"
                        mode="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -10"
                    />
                </filter>
            </defs>
        </svg>
    )

    const content = (
        <>
            {svgDefs}
            <span
                style={{
                    pointerEvents: "none",
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textTransform: "uppercase",
                    color: textColor,
                    mixBlendMode: "normal",
                    transition: "color 0.2s cubic-bezier(.4,0,.2,1)",
                    ...font,
                }}
                className="gooey-button-label"
            >
                {label}
            </span>
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: svgSize.w,
                    height: svgSize.h,
                    filter: `url(#${filterId})`,
                    pointerEvents: "auto",
                }}
                onMouseEnter={() => setIsBlobHover(true)}
                onMouseLeave={() => setIsBlobHover(false)}
            >
                <svg
                    viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
                    width={svgSize.w}
                    height={svgSize.h}
                    style={{ display: "block" }}
                >
                    <mask id={maskID}>
                        <rect
                            x="0"
                            y="0"
                            width={svgSize.w}
                            height={svgSize.h}
                            fill="white"
                        />
                        {[...Array(BLOB_COUNT).keys()].map((i) => (
                            <ButtonGooeyBlob
                                key={`${maskID}-blob-${i}`}
                                x={x}
                                y={y}
                                radius={linearMap(i, 6, 0, 6, maxRadius)}
                                scale={scale}
                                stiffness={70 - i * 2}
                                damping={15 + i}
                                mass={1 + i * 0.2}
                            />
                        ))}
                    </mask>
                    <path
                        d={shapePath(svgSize.w, svgSize.h, corners)}
                        style={{ fill: background }}
                        mask={`url(#${maskID})`}
                    />
                </svg>
            </div>
        </>
    )

    if (link) {
        return (
            <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                ref={ref}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius,
                    padding: "1rem 4rem",
                    cursor: "pointer",
                    overflow: "visible",
                    textDecoration: "none",
                    ...style,
                }}
                onTouchMove={isStatic ? undefined : handleTouchMove}
                onMouseMove={isStatic ? undefined : handleMouseMove}
                onMouseLeave={
                    isStatic
                        ? undefined
                        : () => {
                              handleMouseLeave()
                              setIsHovered(false)
                          }
                }
                onMouseEnter={
                    isStatic
                        ? undefined
                        : () => {
                              handleMouseEnter()
                              setIsHovered(true)
                          }
                }
            >
                {content}
            </a>
        )
    }

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius,
                padding: "1rem 4rem",
                cursor: "pointer",
                overflow: "visible",
                ...style,
            }}
            onTouchMove={isStatic ? undefined : handleTouchMove}
            onMouseMove={isStatic ? undefined : handleMouseMove}
            onMouseLeave={
                isStatic
                    ? undefined
                    : () => {
                          handleMouseLeave()
                          setIsHovered(false)
                      }
            }
            onMouseEnter={
                isStatic
                    ? undefined
                    : () => {
                          handleMouseEnter()
                          setIsHovered(true)
                      }
            }
        >
            {content}
        </div>
    )
}

addPropertyControls(Coalesce, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "hover",
        description: "Text displayed on the button",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["Pill", "Rounded", "Square", "Leaf", "Tab", "Ticket"],
        defaultValue: "Pill",
        description: "Button shape",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (props) => props.shape !== "Rounded" && props.shape !== "Tab",
    },
    maxRadius: {
        type: ControlType.Number,
        title: "Max Blob Radius",
        defaultValue: DEFAULT_MAX_RADIUS,
        min: 6,
        max: 32,
        step: 1,
        unit: "px",
        description: "Maximum radius of the animated blobs",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0ea5e9", // blueish sky blue
        description: "Background color of the button",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff",
        description: "Color of the button text",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        description: "Font style for the button text",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
        description: "URL to open when the button is clicked",
    },
})
