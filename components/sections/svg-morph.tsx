import React, { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { gsap } from "gsap"
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin"
import * as LucideIcons from "lucide-react"

gsap.registerPlugin(MorphSVGPlugin)

// Popular icon names as options
const iconOptions = [
    "Plane",
    "Heart",
    "Zap",
    "Star",
    "CircleDot",
    "RectangleHorizontal",
    "Triangle",
    "House",
    "User",
    "Settings",
    "Mail",
    "Phone",
    "Camera",
    "Music",
    "Video",
    //"Image",
    "File",
    "Folder",
    "Download",
    //"Upload",
    "Search",
    "Menu",
    //"X",
    "Check",
    "ChevronRight",
    "ChevronLeft",
    "ChevronUp",
    "ChevronDown",
    //"ArrowRight",
    "ArrowLeft",
    "ArrowUp",
    //"ArrowDown",
    "Plus",
    "Minus",
    "Edit",
    "Trash",
    "Save",
    //"Share",
    "Bell",
    "Calendar",
    "Clock",
    "MapPin",
    "Globe",
    "Sun",
    "Moon",
    "Cloud",
    "Umbrella",
    "Droplet",
    "Wind",
    "Flame",
    "Sparkles",
    "Gift",
    "ShoppingCart",
    "CreditCard",
    "DollarSign",
    //"TrendingUp",
    //"TrendingDown",
    "BarChart",
    "PieChart",
    "Activity",
    "Wifi",
    "Bluetooth",
    "Battery",
    "Power",
    "Lock",
    "Unlock",
    "Eye",
    //"EyeOff",
    "ThumbsUp",
    "ThumbsDown",
    "MessageCircle",
    "Send",
    "Bookmark",
    "Flag",
    "Award",
    "Trophy",
    "Target",
    "Crosshair",
    //"Anchor",
    "Feather",
    "Paperclip",
    "Link",
    "ExternalLink",
    //"Code",
    //"Terminal",
    "Cpu",
    "HardDrive",
    "Smartphone",
    "Tablet",
    "Laptop",
    "Monitor",
    "Tv",
    //"Watch",
    "Coffee",
    "Pizza",
    "Apple",
    "Leaf",
    "Mountain",
    "Compass",
]

export default function SVGMorph({
    size = 160,
    fill = "none",
    stroke = "#0099FF",
    strokeWidth = 4,
    duration = 0.6,
    delay = 0.5,
    repeat = true,
    yoyo = false,
    icon1 = "Plane",
    icon2 = "Heart",
    icon3 = "Zap",
    icon4 = "Star",
}) {
    const pathRef = useRef(null)
    const svgRef = useRef(null)
    const [paths, setPaths] = useState({
        path1: null,
        path2: null,
        path3: null,
        path4: null,
    })
    const isStaticRenderer = useIsStaticRenderer()

    const uniqueId = useRef(
        `morph-${Math.random().toString(36).substr(2, 9)}`
    ).current

    // Default fallback paths
    const defaultPaths = {
        path1: "M15.8667 3.7804C16.7931 3.03188 17.8307 2.98644 18.9644 3.00233C19.5508 3.01055 19.844 3.01467 20.0792 3.10588C20.4524 3.2506 20.7494 3.54764 20.8941 3.92081C20.9853 4.15601 20.9894 4.4492 20.9977 5.03557C21.0136 6.16926 20.9681 7.20686 20.2196 8.13326C19.5893 8.91337 18.5059 9.32101 17.9846 10.1821C17.5866 10.8395 17.772 11.5203 17.943 12.2209L19.2228 17.4662C19.4779 18.5115 19.2838 19.1815 18.5529 19.9124C18.164 20.3013 17.8405 20.2816 17.5251 19.779L13.6627 13.6249L11.8181 15.0911C11.1493 15.6228 10.8149 15.8886 10.6392 16.2627C10.2276 17.1388 10.4889 18.4547 10.5022 19.4046C10.5096 19.9296 10.0559 20.9644 9.41391 20.9993C9.01756 21.0209 8.88283 20.5468 8.75481 20.2558L7.52234 17.4544C7.2276 16.7845 7.21552 16.7724 6.54556 16.4777L3.74415 15.2452C3.45318 15.1172 2.97914 14.9824 3.00071 14.5861C3.03565 13.9441 4.07036 13.4904 4.59536 13.4978C5.54532 13.5111 6.86122 13.7724 7.73734 13.3608C8.11142 13.1851 8.37724 12.8507 8.90888 12.1819L10.3751 10.3373L4.22103 6.47489C3.71845 6.15946 3.69872 5.83597 4.08755 5.44715C4.8185 4.7162 5.48851 4.52214 6.53377 4.77718L11.7791 6.05703C12.4797 6.22798 13.1605 6.41343 13.8179 6.0154C14.679 5.49411 15.0866 4.41074 15.8667 3.7804Z",
        path2: "M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z",
        path3: "M8.62814 12.6736H8.16918C6.68545 12.6736 5.94358 12.6736 5.62736 12.1844C5.31114 11.6953 5.61244 11.0138 6.21504 9.65083L8.02668 5.55323C8.57457 4.314 8.84852 3.69438 9.37997 3.34719C9.91142 3 10.5859 3 11.935 3H14.0244C15.6632 3 16.4826 3 16.7916 3.53535C17.1007 4.0707 16.6942 4.78588 15.8811 6.21623L14.8092 8.10188C14.405 8.81295 14.2029 9.16849 14.2057 9.45952C14.2094 9.83775 14.4105 10.1862 14.7354 10.377C14.9854 10.5239 15.3927 10.5239 16.2074 10.5239C17.2373 10.5239 17.7523 10.5239 18.0205 10.7022C18.3689 10.9338 18.5513 11.3482 18.4874 11.7632C18.4382 12.0826 18.0918 12.4656 17.399 13.2317L11.8639 19.3523C10.7767 20.5545 10.2331 21.1556 9.86807 20.9654C9.50303 20.7751 9.67833 19.9822 10.0289 18.3962L10.7157 15.2896C10.9826 14.082 11.1161 13.4782 10.7951 13.0759C10.4741 12.6736 9.85877 12.6736 8.62814 12.6736Z",
        path4: "M13.7276 3.44418L15.4874 6.99288C15.7274 7.48687 16.3673 7.9607 16.9073 8.05143L20.0969 8.58575C22.1367 8.92853 22.6167 10.4206 21.1468 11.8925L18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175L18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296L12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452L8.01827 21.4296C5.8785 22.71 4.57865 21.7522 5.13859 19.3125L5.84851 16.2175C5.97849 15.6327 5.74852 14.8161 5.32856 14.3927L2.84884 11.8925C1.389 10.4206 1.85895 8.92853 3.89872 8.58575L7.08837 8.05143C7.61831 7.9607 8.25824 7.48687 8.49821 6.99288L10.258 3.44418C11.2179 1.51861 12.7777 1.51861 13.7276 3.44418Z",
    }

    // Extract path data from rendered SVG elements
    useEffect(() => {
        if (!svgRef.current) return

        const convertShapeToPath = (element) => {
            const tagName = element.tagName.toLowerCase()

            if (tagName === "path") {
                return element.getAttribute("d")
            }

            if (tagName === "circle") {
                const cx = parseFloat(element.getAttribute("cx") || 0)
                const cy = parseFloat(element.getAttribute("cy") || 0)
                const r = parseFloat(element.getAttribute("r") || 0)
                // Create a complete circle path with two semicircular arcs
                return `M ${cx - r},${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy} Z`
            }

            if (tagName === "rect") {
                const x = parseFloat(element.getAttribute("x") || 0)
                const y = parseFloat(element.getAttribute("y") || 0)
                const w = parseFloat(element.getAttribute("width") || 0)
                const h = parseFloat(element.getAttribute("height") || 0)
                const rx = parseFloat(element.getAttribute("rx") || 0)

                if (rx > 0) {
                    // Rounded rectangle with proper arcs
                    const ry = parseFloat(element.getAttribute("ry") || rx)
                    return `M ${x + rx} ${y} L ${x + w - rx} ${y} A ${rx} ${ry} 0 0 1 ${x + w} ${y + ry} L ${x + w} ${y + h - ry} A ${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h} L ${x + rx} ${y + h} A ${rx} ${ry} 0 0 1 ${x} ${y + h - ry} L ${x} ${y + ry} A ${rx} ${ry} 0 0 1 ${x + rx} ${y} Z`
                } else {
                    return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`
                }
            }

            if (tagName === "line") {
                const x1 = parseFloat(element.getAttribute("x1") || 0)
                const y1 = parseFloat(element.getAttribute("y1") || 0)
                const x2 = parseFloat(element.getAttribute("x2") || 0)
                const y2 = parseFloat(element.getAttribute("y2") || 0)
                return `M ${x1} ${y1} L ${x2} ${y2}`
            }

            if (tagName === "polyline" || tagName === "polygon") {
                const points = element.getAttribute("points")
                if (!points) return null
                const coords = points.trim().split(/\s+|,/).filter(Boolean)
                if (coords.length < 2) return null

                let pathData = `M ${coords[0]} ${coords[1]}`
                for (let i = 2; i < coords.length; i += 2) {
                    pathData += ` L ${coords[i]} ${coords[i + 1]}`
                }
                if (tagName === "polygon") {
                    pathData += " Z"
                }
                return pathData
            }

            if (tagName === "ellipse") {
                const cx = parseFloat(element.getAttribute("cx") || 0)
                const cy = parseFloat(element.getAttribute("cy") || 0)
                const rx = parseFloat(element.getAttribute("rx") || 0)
                const ry = parseFloat(element.getAttribute("ry") || 0)
                // Create a complete ellipse path with two arcs
                return `M ${cx - rx},${cy} A ${rx},${ry} 0 1,0 ${cx + rx},${cy} A ${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`
            }

            return null
        }

        const extractPathFromRef = (refId) => {
            const element = svgRef.current.querySelector(`#${refId}`)
            if (!element) return null

            // Get all SVG shape elements (path, rect, circle, etc.)
            const allShapes = element.querySelectorAll(
                "path, rect, circle, ellipse, line, polyline, polygon"
            )

            if (allShapes.length === 0) return null

            // Convert all shapes to path data and combine
            const pathDataArray = Array.from(allShapes)
                .map((shape) => convertShapeToPath(shape))
                .filter(Boolean)

            if (pathDataArray.length === 0) return null

            // Combine all paths with a space separator
            const combinedPath = pathDataArray.join(" ")

            return combinedPath
        }

        // Small delay to ensure icons are rendered
        const timer = setTimeout(() => {
            setPaths({
                path1:
                    extractPathFromRef(`icon1-${uniqueId}`) ||
                    defaultPaths.path1,
                path2:
                    extractPathFromRef(`icon2-${uniqueId}`) ||
                    defaultPaths.path2,
                path3:
                    extractPathFromRef(`icon3-${uniqueId}`) ||
                    defaultPaths.path3,
                path4:
                    extractPathFromRef(`icon4-${uniqueId}`) ||
                    defaultPaths.path4,
            })
        }, 100)

        return () => clearTimeout(timer)
    }, [icon1, icon2, icon3, icon4, svgRef.current])

    // Animation effect
    useEffect(() => {
        if (isStaticRenderer || !pathRef.current || !paths.path1) return

        const isRepeating = repeat ? -1 : 0
        const timeline = gsap.timeline({
            repeat: isRepeating,
            yoyo: yoyo,
            defaults: { duration: duration, ease: "power3.inOut" },
        })

        // Morph directly to the path data, not to shape IDs
        timeline
            .to(
                pathRef.current,
                {
                    morphSVG: { shape: paths.path2 },
                },
                `+=${delay}`
            )
            .to(
                pathRef.current,
                {
                    morphSVG: { shape: paths.path3 },
                },
                `+=${delay}`
            )
            .to(
                pathRef.current,
                {
                    morphSVG: { shape: paths.path4 },
                },
                `+=${delay}`
            )
            .to(
                pathRef.current,
                {
                    morphSVG: { shape: paths.path1 },
                    ease: "power2.inOut",
                },
                `+=${delay}`
            )

        return () => {
            timeline.kill()
        }
    }, [repeat, yoyo, duration, delay, isStaticRenderer, paths])

    // Get icon components
    const Icon1 = LucideIcons[icon1] || LucideIcons.Plane
    const Icon2 = LucideIcons[icon2] || LucideIcons.Heart
    const Icon3 = LucideIcons[icon3] || LucideIcons.Zap
    const Icon4 = LucideIcons[icon4] || LucideIcons.Star

    return (
        <div style={{ width: size, height: size }}>
            <svg
                ref={svgRef}
                viewBox="0 0 24 24"
                width="100%"
                height="100%"
                style={{
                    overflow: "visible",
                }}
            >
                {/* Visible animated path */}
                <path
                    ref={pathRef}
                    id={`shape1-${uniqueId}`}
                    d={paths.path1}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Hidden Lucide icons for path extraction */}
                <g id={`icon1-${uniqueId}`} style={{ display: "none" }}>
                    <Icon1 />
                </g>
                <g id={`icon2-${uniqueId}`} style={{ display: "none" }}>
                    <Icon2 />
                </g>
                <g id={`icon3-${uniqueId}`} style={{ display: "none" }}>
                    <Icon3 />
                </g>
                <g id={`icon4-${uniqueId}`} style={{ display: "none" }}>
                    <Icon4 />
                </g>
            </svg>
        </div>
    )
}

addPropertyControls(SVGMorph, {
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 160,
        min: 24,
        max: 1200,
        unit: "px",
        step: 10,
    },
    fill: {
        type: ControlType.Color,
        defaultValue: "rgba(0, 0, 0, 0)",
        title: "Fill",
        description: "Some icons show best with a 0% opacity fill",
    },
    stroke: {
        type: ControlType.Color,
        defaultValue: "#0099FF",
        title: "Stroke",
    },
    strokeWidth: {
        type: ControlType.Number,
        defaultValue: 4,
        step: 0.5,
        min: 0,
        max: 10,
        title: "Stroke Width",
    },
    duration: {
        type: ControlType.Number,
        defaultValue: 0.6,
        step: 0.1,
        min: 0.1,
        max: 5,
        title: "Duration",
        description: "Duration of each morph in seconds",
    },
    delay: {
        type: ControlType.Number,
        defaultValue: 0.5,
        step: 0.1,
        min: 0,
        max: 5,
        title: "Delay",
        description: "Delay between morphs in seconds",
    },
    repeat: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Repeat",
    },
    yoyo: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "Yoyo",
        description: "Reverse animation on repeat",
    },
    icon1: {
        type: ControlType.Enum,
        defaultValue: "Plane",
        options: iconOptions,
        title: "Icon 1",
    },
    icon2: {
        type: ControlType.Enum,
        defaultValue: "Heart",
        options: iconOptions,
        title: "Icon 2",
    },
    icon3: {
        type: ControlType.Enum,
        defaultValue: "Zap",
        options: iconOptions,
        title: "Icon 3",
    },
    icon4: {
        type: ControlType.Enum,
        defaultValue: "Star",
        options: iconOptions,
        title: "Icon 4",
    },
})
