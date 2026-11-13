import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function SmoothWaveSection(props) {
    const {
        backgroundColor,
        backgroundImage,
        imagePosition,
        topHeight,
        middleHeight,
        bottomHeight,
        waveWidth,
        flipTop,
        flipBottom,
        topBorder,
        topBorderColor,
        topBorderWidth,
        bottomBorder,
        bottomBorderColor,
        bottomBorderWidth,
    } = props

    const top = Math.max(0, topHeight)
    const middle = Math.max(1, middleHeight)
    const bottom = Math.max(0, bottomHeight)
    const period = Math.max(1, waveWidth)

    const totalHeight = top + middle + bottom
    const bottomOffset = top + middle

    const containerRef = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(1440)

    React.useEffect(() => {
        const element = containerRef.current
        if (!element) return

        const updateWidth = () => {
            const nextWidth = element.getBoundingClientRect().width

            if (nextWidth > 0) {
                setWidth((previous) =>
                    Math.abs(previous - nextWidth) > 0.5 ? nextWidth : previous
                )
            }
        }

        updateWidth()

        if (typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(updateWidth)
        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    // Fixed-width repeating wave.
    // Height 0 creates a completely straight edge.
    const waveY = (
        x: number,
        height: number,
        flipped: boolean,
        offset: number
    ) => {
        if (height === 0) return offset

        const phase = (x / period) * Math.PI * 2
        const normalized = (1 - Math.cos(phase)) / 2

        return offset + (flipped ? 1 - normalized : normalized) * height
    }

    const buildPoints = (height: number, flipped: boolean, offset: number) => {
        const count = Math.max(2, Math.ceil(width / 6))
        const points: Array<[number, number]> = []

        for (let i = 0; i <= count; i++) {
            const x = (i / count) * width
            points.push([x, waveY(x, height, flipped, offset)])
        }

        return points
    }

    const topPoints = buildPoints(top, flipTop, 0)
    const bottomPoints = buildPoints(bottom, flipBottom, bottomOffset)

    const toPath = (points: Array<[number, number]>, reverse = false) => {
        const ordered = reverse ? [...points].reverse() : points

        return ordered
            .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
            .join(" ")
    }

    const topPath = toPath(topPoints)
    const bottomPath = toPath(bottomPoints)

    const shapePath = `
        ${topPath}
        L ${width} ${bottomPoints[bottomPoints.length - 1][1]}
        ${toPath(bottomPoints, true).replace(/^M/, "L")}
        Z
    `

    const clipId = React.useId().replace(/:/g, "")

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: totalHeight,
                position: "relative",
                overflow: "hidden",
                background: "transparent",
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${totalHeight}`}
                preserveAspectRatio="none"
                style={{
                    display: "block",
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
                aria-hidden="true"
            >
                <defs>
                    <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                        <path d={shapePath} />
                    </clipPath>
                </defs>

                {/* Background and optional image */}
                <g clipPath={`url(#${clipId})`}>
                    <rect
                        x="0"
                        y="0"
                        width={width}
                        height={totalHeight}
                        fill={backgroundColor}
                    />

                    {backgroundImage?.src && (
                        <image
                            href={backgroundImage.src}
                            x="0"
                            y="0"
                            width={width}
                            height={totalHeight}
                            preserveAspectRatio={
                                imagePosition === "Top"
                                    ? "xMidYMin slice"
                                    : imagePosition === "Bottom"
                                      ? "xMidYMax slice"
                                      : "xMidYMid slice"
                            }
                        />
                    )}

                    {/* Borders are clipped to the inside
                        of the wave section. */}

                    {topBorder && topBorderWidth > 0 && (
                        <path
                            d={topPath}
                            fill="none"
                            stroke={topBorderColor}
                            strokeWidth={topBorderWidth * 2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}

                    {bottomBorder && bottomBorderWidth > 0 && (
                        <path
                            d={bottomPath}
                            fill="none"
                            stroke={bottomBorderColor}
                            strokeWidth={bottomBorderWidth * 2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}
                </g>
            </svg>
        </div>
    )
}

SmoothWaveSection.defaultProps = {
    backgroundColor: "#6B1424",
    backgroundImage: undefined,
    imagePosition: "Center",
    topHeight: 50,
    middleHeight: 450,
    bottomHeight: 50,
    waveWidth: 1000,
    flipTop: false,
    flipBottom: true,

    topBorder: false,
    topBorderColor: "#FFFFFF",
    topBorderWidth: 3,

    bottomBorder: false,
    bottomBorderColor: "#FFFFFF",
    bottomBorderWidth: 3,
}

addPropertyControls(SmoothWaveSection, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#6B1424",
    },

    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },

    imagePosition: {
        type: ControlType.Enum,
        title: "Image Position",
        options: ["Top", "Center", "Bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "Center",
    },

    topHeight: {
        type: ControlType.Number,
        title: "Top Height",
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        defaultValue: 50,
    },

    middleHeight: {
        type: ControlType.Number,
        title: "Middle Height",
        min: 1,
        max: 2000,
        step: 10,
        unit: "px",
        defaultValue: 450,
    },

    bottomHeight: {
        type: ControlType.Number,
        title: "Bottom Height",
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        defaultValue: 50,
    },

    waveWidth: {
        type: ControlType.Number,
        title: "Wave Width",
        min: 200,
        max: 3000,
        step: 50,
        unit: "px",
        defaultValue: 1000,
    },

    flipTop: {
        type: ControlType.Boolean,
        title: "Flip Top",
        defaultValue: false,
    },

    flipBottom: {
        type: ControlType.Boolean,
        title: "Flip Bottom",
        defaultValue: true,
    },

    topBorder: {
        type: ControlType.Boolean,
        title: "Top Border",
        defaultValue: false,
    },

    topBorderColor: {
        type: ControlType.Color,
        title: "Top Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.topBorder,
    },

    topBorderWidth: {
        type: ControlType.Number,
        title: "Top Width",
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
        defaultValue: 3,
        hidden: (props) => !props.topBorder,
    },

    bottomBorder: {
        type: ControlType.Boolean,
        title: "Bottom Border",
        defaultValue: false,
    },

    bottomBorderColor: {
        type: ControlType.Color,
        title: "Bottom Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.bottomBorder,
    },

    bottomBorderWidth: {
        type: ControlType.Number,
        title: "Bottom Width",
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
        defaultValue: 3,
        hidden: (props) => !props.bottomBorder,
    },
})
