// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, useState } from "react"

const variants = {
    "right-silver": {
        matrix: "matrix3d(0.76631993,0.04182064,0,0.00009316,0,0.9743346,0,0,0,0,1,0,43.03649635,11.63117871,0,1)",
        height: 874,
        offsetX: 26,
        offsetY: 0,
        borderRadius: 40,
        overlay:
            "https://raw.githubusercontent.com/mucahitgayiran/mockup-assets/main/group-4-69c0f241418ebe92ad116151-@2x.png",
    },
    "right-orange": {
        matrix: "matrix3d(0.76631993,0.04182064,0,0.00009316,0,0.9743346,0,0,0,0,1,0,43.03649635,11.63117871,0,1)",
        height: 874,
        offsetX: 26,
        offsetY: 0,
        borderRadius: 45,
        overlay:
            "https://raw.githubusercontent.com/mucahitgayiran/mockup-assets/main/group-1-69bd885f418ebe92ad1160b5-@2x.png",
    },
    "right-blue": {
        matrix: "matrix3d(0.76631993,0.04182064,0,0.00009316,0,0.9743346,0,0,0,0,1,0,43.03649635,11.63117871,0,1)",
        height: 874,
        offsetX: 26,
        offsetY: 0,
        borderRadius: 40,
        overlay:
            "https://raw.githubusercontent.com/mucahitgayiran/mockup-assets/main/group-5-69c0f3c3418ebe92ad116164-@2x.png",
    },
    "straight-silver": {
        matrix: "matrix3d(0.91970803,0,0,0,0,0.91340451,0,0,0,0,1,0,16.62773723,38.36061684,0,1)",
        height: 874,
        offsetX: -1,
        offsetY: 0,
        borderRadius: 40,
        overlay:
            "https://raw.githubusercontent.com/mucahitgayiran/mockup-assets/main/group-8-69c0f505418ebe92ad1161c1-@2x.png",
    },
    "straight-orange": {
        matrix: "matrix3d(0.91970803,0,0,0,0,0.91340451,0,0,0,0,1,0,16.62773723,38.36061684,0,1)",
        height: 874,
        offsetX: -1,
        offsetY: 0,
        borderRadius: 40,
        overlay:
            "https://raw.githubusercontent.com/mucahitgayiran/mockup-assets/main/3.png",
    },
    "straight-blue": {
        matrix: "matrix3d(0.91970803,0,0,0,0,0.91340451,0,0,0,0,1,0,16.62773723,38.36061684,0,1)",
        height: 874,
        offsetX: -1,
        offsetY: 0,
        borderRadius: 40,
        overlay:
            "https://raw.githubusercontent.com/mucahitgayiran/mockup-assets/main/group-9-69c0f56a418ebe92ad1161e0-@2x.png",
    },
    "left-silver": {
        matrix: "matrix3d(0.70722764,-0.03817134,0,-0.00008994,0.00013572,0.94225492,0,0.00000365,0,0,1,0,37.16788321,25.75475285,0,1)",
        height: 874,
        offsetX: 0,
        offsetY: 0,
        borderRadius: 45,
        overlay:
            "https://raw.githubusercontent.com/mucahitgayiran/mockup-assets/main/group-7-69c0f4b2418ebe92ad1161a2-@2x.png",
    },
    "left-orange": {
        matrix: "matrix3d(0.70722764,-0.03817134,0,-0.00008994,0.00013572,0.94225492,0,0.00000365,0,0,1,0,37.16788321,25.75475285,0,1)",
        height: 874,
        offsetX: 0,
        offsetY: 0,
        borderRadius: 45,
        overlay:
            "https://raw.githubusercontent.com/mucahitgayiran/mockup-assets/main/2.png",
    },
    "left-blue": {
        matrix: "matrix3d(0.70722764,-0.03817134,0,-0.00008994,0.00013572,0.94225492,0,0.00000365,0,0,1,0,37.16788321,25.75475285,0,1)",
        height: 874,
        offsetX: 0,
        offsetY: 0,
        borderRadius: 45,
        overlay:
            "https://raw.githubusercontent.com/mucahitgayiran/mockup-assets/main/group-6-69c0f468418ebe92ad116183-@2x.png",
    },
}

export default function DeviceMockups(props) {
    const { component: Component, angle, color, style } = props

    const key = `${angle}-${color}`
    const { matrix, height, offsetX, offsetY, borderRadius, overlay } =
        variants[key]

    const containerRef = useRef(null)
    const [realWidth, setRealWidth] = useState(402)

    useEffect(() => {
        if (!containerRef.current) return

        const measure = () => {
            const w = containerRef.current?.getBoundingClientRect().width
            if (w && w > 0) {
                setRealWidth(w)
                return
            }
            requestAnimationFrame(measure)
        }

        requestAnimationFrame(measure)

        const observer = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width
            if (w && w > 0) setRealWidth(w)
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    const scale = realWidth / 402
    const scaledHeight = height * scale

    const mediaTransform = `translate(${offsetX}px, ${offsetY}px) ${matrix}`

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                overflow: "visible",
                position: "relative",
                height: scaledHeight,
            }}
        >
            <div
                style={{
                    width: 402,
                    height: height,
                    transform: `scale(${scale})`,
                    transformOrigin: "0 0",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                <div
                    style={{
                        width: 402,
                        height: height,
                        transform: mediaTransform,
                        transformOrigin: "0 0",
                        borderRadius: borderRadius,
                        overflow: "hidden",
                    }}
                >
                    {Component}
                </div>

                {overlay && (
                    <img
                        src={overlay}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: 402,
                            height: height,
                            objectFit: "contain",
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>
        </div>
    )
}

addPropertyControls(DeviceMockups, {
    component: {
        type: ControlType.ComponentInstance,
        title: "Select component",
        description: "Select component from your canvas. Size must be 402x874",
    },
    device: {
        type: ControlType.Enum,
        title: "Device",
        options: ["iphone17pro"],
        optionTitles: ["iPhone 17 Pro"],
        defaultValue: "iphone17pro",
        description: "Want more devices? 💬→ info@artboard.studio",
    },
    angle: {
        type: ControlType.Enum,
        title: "Angle",
        options: ["right", "straight", "left"],
        optionTitles: ["Left Side", "Front", "Right Side"],
        defaultValue: "straight",
    },
    color: {
        type: ControlType.Enum,
        title: "Device color",
        options: ["silver", "orange", "blue"],
        optionTitles: ["Silver", "Cosmic Orange", "Deep Blue"],
        defaultValue: "silver",
    },
})
