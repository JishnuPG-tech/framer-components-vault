// Arc Spinner - Terminal-style text spinner animation
import { useEffect, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const SPINNER_CONFIGS = {
    arc: {
        frames: ["◜", "◠", "◝", "◞", "◡", "◟"],
        interval: 100,
    },
    clockwise: {
        frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
        interval: 80,
    },
    vertical: {
        frames: ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"],
        interval: 80,
    },
    circular: {
        frames: ["⠋", "⠙", "⠚", "⠞", "⠖", "⠦", "⠴", "⠲", "⠳", "⠓"],
        interval: 80,
    },
    pendulum: {
        frames: ["⠄", "⠆", "⠇", "⠋", "⠙", "⠸", "⠰", "⠠", "⠰", "⠸", "⠙", "⠋", "⠇", "⠆"],
        interval: 80,
    },
    smooth: {
        frames: ["⠋", "⠙", "⠚", "⠒", "⠂", "⠂", "⠒", "⠲", "⠴", "⠦", "⠖", "⠒", "⠐", "⠐", "⠒", "⠓", "⠋"],
        interval: 80,
    },
    orbit2: {
        frames: ["⠁", "⠉", "⠙", "⠚", "⠒", "⠂", "⠂", "⠒", "⠲", "⠴", "⠤", "⠄", "⠄", "⠤", "⠴", "⠲", "⠒", "⠂", "⠂", "⠒", "⠚", "⠙", "⠉", "⠁"],
        interval: 80,
    },
    wave2: {
        frames: ["⠈", "⠉", "⠋", "⠓", "⠒", "⠐", "⠐", "⠒", "⠖", "⠦", "⠤", "⠠", "⠠", "⠤", "⠦", "⠖", "⠒", "⠐", "⠐", "⠒", "⠓", "⠋", "⠉", "⠈"],
        interval: 80,
    },
    pulse2: {
        frames: ["⠁", "⠁", "⠉", "⠙", "⠚", "⠒", "⠂", "⠂", "⠒", "⠲", "⠴", "⠤", "⠄", "⠄", "⠤", "⠠", "⠠", "⠤", "⠦", "⠖", "⠒", "⠐", "⠐", "⠒", "⠓", "⠋", "⠉", "⠈", "⠈"],
        interval: 80,
    },
    corners: {
        frames: ["⢹", "⢺", "⢼", "⣸", "⣇", "⡧", "⡗", "⡏"],
        interval: 80,
    },
    diagonal: {
        frames: ["⢄", "⢂", "⢁", "⡁", "⡈", "⡐", "⡠"],
        interval: 80,
    },
    rotate: {
        frames: ["⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"],
        interval: 100,
    },
    sweep: {
        frames: ["⢀⠀", "⡀⠀", "⠄⠀", "⢂⠀", "⡂⠀", "⠅⠀", "⢃⠀", "⡃⠀", "⠍⠀", "⢋⠀", "⡋⠀", "⠍⠁", "⢋⠁", "⡋⠁", "⠍⠉", "⠋⠉", "⠋⠉", "⠉⠙", "⠉⠙", "⠉⠩", "⠈⢙", "⠈⡙", "⢈⠩", "⡀⢙", "⠄⡙", "⢂⠩", "⡂⢘", "⠅⡘", "⢃⠨", "⡃⢐", "⠍⡐", "⢋⠠", "⡋⢀", "⠍⡁", "⢋⠁", "⡋⠁", "⠍⠉", "⠋⠉", "⠋⠉", "⠉⠙", "⠉⠙", "⠉⠩", "⠈⢙", "⠈⡙", "⠈⠩", "⠀⢙", "⠀⡙", "⠀⠩", "⠀⢘", "⠀⡘", "⠀⠨", "⠀⢐", "⠀⡐", "⠀⠠", "⠀⢀", "⠀⡀"],
        interval: 80,
    },
    box: {
        frames: ["⣼", "⣹", "⢻", "⠿", "⡟", "⣏", "⣧", "⣶"],
        interval: 80,
    },
    bounce2: {
        frames: ["⠉⠉", "⠈⠙", "⠀⠹", "⠀⢸", "⠀⣰", "⢀⣠", "⣀⣀", "⣄⡀", "⣆⠀", "⡇⠀", "⠏⠀", "⠋⠁"],
        interval: 80,
    },
    dotsCircle: {
        frames: ["⢎⠀", "⠎⠁", "⠊⠑", "⠈⠱", "⠀⡱", "⢀⡰", "⢄⡠", "⢆⡀"],
        interval: 80,
    },
    diagSwipe: {
        frames: ["⠁⠀", "⠋⠀", "⠟⠁", "⡿⠋", "⣿⠟", "⣿⡿", "⣿⣿", "⣿⣿", "⣾⣿", "⣴⣿", "⣠⣾", "⢀⣴", "⠀⣠", "⠀⢀", "⠀⠀", "⠀⠀"],
        interval: 60,
    },
    orbit: {
        frames: ["⠃", "⠉", "⠘", "⠰", "⢠", "⣀", "⡄", "⠆"],
        interval: 100,
    },
    checkerboard: {
        frames: ["⢕⢕⢕", "⡪⡪⡪", "⢊⠔⡡", "⡡⢊⠔"],
        interval: 250,
    },
    cascade: {
        frames: ["⠀⠀⠀⠀", "⠀⠀⠀⠀", "⠁⠀⠀⠀", "⠋⠀⠀⠀", "⠞⠁⠀⠀", "⡴⠋⠀⠀", "⣠⠞⠁⠀", "⢀⡴⠋⠀", "⠀⣠⠞⠁", "⠀⢀⡴⠋", "⠀⠀⣠⠞", "⠀⠀⢀⡴", "⠀⠀⠀⣠", "⠀⠀⠀⢀"],
        interval: 60,
    },
    breathe: {
        frames: ["⠀", "⠂", "⠌", "⡑", "⢕", "⢝", "⣫", "⣟", "⣿", "⣟", "⣫", "⢝", "⢕", "⡑", "⠌", "⠂", "⠀"],
        interval: 100,
    },
    bounce: {
        frames: ["⠁", "⠂", "⠄", "⡀", "⠄", "⠂"],
        interval: 120,
    },
    helix: {
        frames: ["⢌⣉⢎⣉", "⣉⡱⣉⡱", "⣉⢎⣉⢎", "⡱⣉⡱⣉", "⢎⣉⢎⣉", "⣉⡱⣉⡱", "⣉⢎⣉⢎", "⡱⣉⡱⣉", "⢎⣉⢎⣉", "⣉⡱⣉⡱", "⣉⢎⣉⢎", "⡱⣉⡱⣉", "⢎⣉⢎⣉", "⣉⡱⣉⡱", "⣉⢎⣉⢎", "⡱⣉⡱⣉"],
        interval: 80,
    },
    noise: {
        frames: ["▓", "▒", "░", " ", "░", "▒"],
        interval: 100,
    },
    point: {
        frames: ["···", "•··", "·•·", "··•", "···"],
        interval: 200,
    },
    pulse: {
        frames: ["⠀⠶⠀", "⠰⣿⠆", "⢾⣉⡷", "⣏⠀⣹", "⡁⠀⢈"],
        interval: 180,
    },
    rain: {
        frames: ["⢁⠂⠔⠈", "⠂⠌⡠⠐", "⠄⡐⢀⠡", "⡈⠠⠀⢂", "⠐⢀⠁⠄", "⠠⠁⠊⡀", "⢁⠂⠔⠈", "⠂⠌⡠⠐", "⠄⡐⢀⠡", "⡈⠠⠀⢂", "⠐⢀⠁⠄", "⠠⠁⠊⡀"],
        interval: 100,
    },
    sand: {
        frames: ["⠁", "⠂", "⠄", "⡀", "⡈", "⡐", "⡠", "⣀", "⣁", "⣂", "⣄", "⣌", "⣔", "⣤", "⣥", "⣦", "⣮", "⣶", "⣷", "⣿", "⡿", "⠿", "⢟", "⠟", "⡛", "⠛", "⠫", "⢋", "⠋", "⠍", "⡉", "⠉", "⠑", "⠡", "⢁"],
        interval: 80,
    },
    scan: {
        frames: ["⠀⠀⠀⠀", "⡇⠀⠀⠀", "⣿⠀⠀⠀", "⢸⡇⠀⠀", "⠀⣿⠀⠀", "⠀⢸⡇⠀", "⠀⠀⣿⠀", "⠀⠀⢸⡇", "⠀⠀⠀⣿", "⠀⠀⠀⢸"],
        interval: 70,
    },
    simpleDots: {
        frames: [".  ", ".. ", "...", "   "],
        interval: 400,
    },
    simpleDotsScrolling: {
        frames: [".  ", ".. ", "...", " ..", "  .", "   "],
        interval: 200,
    },
    snake: {
        frames: ["⣁⡀", "⣉⠀", "⡉⠁", "⠉⠉", "⠈⠙", "⠀⠛", "⠐⠚", "⠒⠒", "⠖⠂", "⠶⠀", "⠦⠄", "⠤⠤", "⠠⢤", "⠀⣤", "⢀⣠", "⣀⣀"],
        interval: 80,
    },
    sparkle: {
        frames: ["⡡⠊⢔⠡", "⠊⡰⡡⡘", "⢔⢅⠈⢢", "⡁⢂⠆⡍", "⢔⠨⢑⢐", "⠨⡑⡠⠊"],
        interval: 150,
    },
    wave: {
        frames: ["⠁⠂⠄⡀", "⠂⠄⡀⢀", "⠄⡀⢀⠠", "⡀⢀⠠⠐", "⢀⠠⠐⠈", "⠠⠐⠈⠁", "⠐⠈⠁⠂", "⠈⠁⠂⠄"],
        interval: 100,
    },
    waveRows: {
        frames: ["⠖⠉⠉⠑", "⡠⠖⠉⠉", "⣠⡠⠖⠉", "⣄⣠⡠⠖", "⠢⣄⣠⡠", "⠙⠢⣄⣠", "⠉⠙⠢⣄", "⠊⠉⠙⠢", "⠜⠊⠉⠙", "⡤⠜⠊⠉", "⣀⡤⠜⠊", "⢤⣀⡤⠜", "⠣⢤⣀⡤", "⠑⠣⢤⣀", "⠉⠑⠣⢤", "⠋⠉⠑⠣"],
        interval: 90,
    },
}

interface DotSpinnerMatrixProps {
    spinnerType?: keyof typeof SPINNER_CONFIGS
    size?: number
    color?: string
    showOnCanvas?: boolean
    style?: CSSProperties
}

/**
 * Dot Spinner Matrix
 * Terminal-style text spinner animation with multiple spinner types
 *
 * @framerIntrinsicWidth 40
 * @framerIntrinsicHeight 40
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DotSpinnerMatrix(props: DotSpinnerMatrixProps) {
    const { spinnerType = "arc", size = 24, color = "#FFFFFF", showOnCanvas = false, style } = props

    const [frame, setFrame] = useState(0)
    const isStatic = useIsStaticRenderer()

    const config = SPINNER_CONFIGS[spinnerType]

    useEffect(() => {
        // Don't run animation in canvas or export mode unless showOnCanvas is enabled
        if (isStatic && !showOnCanvas) return

        setFrame(0)
        const id = setInterval(() => {
            startTransition(() => {
                setFrame((i) => (i + 1) % config.frames.length)
            })
        }, config.interval)
        return () => clearInterval(id)
    }, [spinnerType, config.frames.length, config.interval, isStatic, showOnCanvas])

    return (
        <div
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
            }}
        >
            <span
                style={{
                    fontSize: size,
                    color,
                    textAlign: "center",
                    lineHeight: `${size * 1.3}px`,
                    fontFamily: "monospace",
                }}
            >
                {config.frames[frame]}
            </span>
        </div>
    )
}

addPropertyControls(DotSpinnerMatrix, {
    spinnerType: {
        type: ControlType.Enum,
        title: "Spinner Type",
        options: ["clockwise", "vertical", "circular", "pendulum", "smooth", "orbit2", "wave2", "pulse2", "corners", "diagonal", "rotate", "sweep", "box", "bounce2", "dotsCircle", "diagSwipe", "orbit", "checkerboard", "cascade", "breathe", "bounce", "helix", "noise", "arc", "point", "pulse", "rain", "sand", "scan", "simpleDots", "simpleDotsScrolling", "snake", "sparkle", "wave", "waveRows"],
        optionTitles: ["Clockwise", "Vertical", "Circular", "Pendulum", "Smooth", "Orbit 2", "Wave 2", "Pulse 2", "Corners", "Diagonal", "Rotate", "Sweep", "Box", "Bounce 2", "Dots Circle", "Diag Swipe", "Orbit", "Checkerboard", "Cascade", "Breathe", "Bounce", "Helix", "Noise", "Arc", "Point", "Pulse", "Rain", "Sand", "Scan", "Simple Dots", "Simple Dots Scrolling", "Snake", "Sparkle", "Wave", "Wave Rows"],
        defaultValue: "clockwise",
    },
    showOnCanvas: {
        type: ControlType.Boolean,
        title: "Show on Canvas",
        defaultValue: false,
        enabledTitle: "Animate",
        disabledTitle: "Static",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 24,
        min: 12,
        max: 100,
        step: 1,
        unit: "px",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
        description: "Explore [more components](https://dub.sh/Explore-more).\n\nMade by [Till Janek](https://dub.sh/made-by-tilljanek).",
    },
})
