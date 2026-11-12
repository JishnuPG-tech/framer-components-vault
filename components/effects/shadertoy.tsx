// Welcome to Code in Framer
// Get Started: https://www.framer.com/developers

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"
import ShadertoyBackground from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.23/build/backgrounds/shadertoy.min.js"

/**
 * These annotations control how your component sizes
 * Learn more: https://www.framer.com/developers/#code-components-auto-sizing
 *
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ShadertoyComponent(props) {
    const { shader } = props

    const canvasRef = useRef(null)

    const app = useRef(null)

    useEffect(() => {
        app.current = ShadertoyBackground(canvasRef.current)
        return () => {
            app.current.dispose()
        }
    }, [])

    useEffect(() => {
        if (shader) app.current.shaderPlane.fragmentShader = shader
    }, [shader])

    return <canvas ref={canvasRef} />
}

ShadertoyComponent.defaultProps = {
    shader: null,
}

addPropertyControls(ShadertoyComponent, {
    shader: {
        type: ControlType.String,
        displayTextArea: true,
        description: "[Browse Shadertoy](https://www.shadertoy.com)",
    },
})
