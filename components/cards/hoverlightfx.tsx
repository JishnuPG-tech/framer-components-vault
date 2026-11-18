// Spotlight Card component with mouse-following spotlight effect
import { useRef, type CSSProperties, type ReactNode } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SpotlightCardProps {
    children: ReactNode
    spotlightColor: string
    backgroundColor: string
    borderColor: string
    borderRadius: number
    padding: number
    spotlightSize: number
    spotlightOpacity: number
    transitionDuration: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SpotlightCard(props: SpotlightCardProps) {
    const {
        children,
        spotlightColor,
        backgroundColor,
        borderColor,
        borderRadius,
        padding,
        spotlightSize,
        spotlightOpacity,
        transitionDuration,
    } = props

    const divRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!divRef.current) return

        const rect = divRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        divRef.current.style.setProperty("--mouse-x", `${x}px`)
        divRef.current.style.setProperty("--mouse-y", `${y}px`)
        divRef.current.style.setProperty("--spotlight-color", spotlightColor)
        divRef.current.style.setProperty(
            "--spotlight-size",
            `${spotlightSize}%`
        )
        divRef.current.style.setProperty(
            "--spotlight-opacity",
            `${spotlightOpacity}`
        )
        divRef.current.style.setProperty(
            "--transition-duration",
            `${transitionDuration}s`
        )
    }

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            style={
                {
                    ...props.style,
                    position: "relative",
                    borderRadius: `${borderRadius}px`,
                    border: `1px solid ${borderColor}`,
                    backgroundColor,
                    padding: `${padding}px`,
                    overflow: "hidden",
                    "--mouse-x": "50%",
                    "--mouse-y": "50%",
                    "--spotlight-color": spotlightColor,
                    "--spotlight-size": `${spotlightSize}%`,
                    "--spotlight-opacity": `${spotlightOpacity}`,
                    "--transition-duration": `${transitionDuration}s`,
                } as CSSProperties
            }
        >
            <style>
                {`
                .spotlight-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent var(--spotlight-size));
                    opacity: 0;
                    transition: opacity var(--transition-duration) ease;
                    pointer-events: none;
                }

                .spotlight-card:hover::before,
                .spotlight-card:focus-within::before {
                    opacity: var(--spotlight-opacity);
                }
                `}
            </style>
            <div
                className="spotlight-card"
                style={{ width: "100%", height: "100%" }}
            >
                {children}
            </div>
        </div>
    )
}

addPropertyControls(SpotlightCard, {
    children: {
        type: ControlType.Slot,
        title: "Content",
    },
    spotlightColor: {
        type: ControlType.Color,
        title: "Spotlight Color",
        defaultValue: "rgba(0, 229, 255, 0.2)",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#222222",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 24,
        min: 0,
        max: 50,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 32,
        min: 0,
        max: 100,
        unit: "px",
    },
    spotlightSize: {
        type: ControlType.Number,
        title: "Spotlight Size",
        defaultValue: 80,
        min: 20,
        max: 200,
        unit: "%",
    },
    spotlightOpacity: {
        type: ControlType.Number,
        title: "Spotlight Opacity",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.1,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
        unit: "s",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
