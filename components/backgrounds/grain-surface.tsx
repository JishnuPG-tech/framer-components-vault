// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 -.28'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
const GRAIN_W = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='m'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='1' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.2 -.62'/></filter><rect width='100%' height='100%' filter='url(%23m)'/></svg>\")"
interface GrainSurfaceProps {
    color: string
    radius: number
    strength: number
}

const MASK = "radial-gradient(ellipse 70% 70% at 50% 45%, rgba(0,0,0,.35) 30%, #000 100%)"

/**
 * Grain Surface — a flat color with two layers of SVG noise, darker toward the edges.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function GrainSurface(props: GrainSurfaceProps) {
    const { color = "#CDABFE", radius = 0, strength = 1 } = props
    return (
        <div style={{ position: "relative", width: "100%", height: "100%", background: color, borderRadius: radius, overflow: "hidden", isolation: "isolate" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, opacity: 0.55 * strength, mixBlendMode: "multiply", WebkitMaskImage: MASK, maskImage: MASK }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN_W, opacity: 0.55 * strength }} />
        </div>
    )
}

addPropertyControls(GrainSurface, {
    color: { type: ControlType.Color, title: "Color", defaultValue: "#CDABFE" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 0, min: 0, max: 100 },
    strength: { type: ControlType.Number, title: "Grain", defaultValue: 1, min: 0, max: 2, step: 0.05 },
})
