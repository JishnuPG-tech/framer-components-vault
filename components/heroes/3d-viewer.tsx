/**
 * -----------------------------------------------------------------------------
 * Created by 584.studio
 * Website: https://584.studio
 *
 * © 2026 584.studio. All rights reserved.
 *
 * For support, custom development, or licensing inquiries:
 * hello@584.studio
 * https://584.studio
 * -----------------------------------------------------------------------------
 */

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


declare global {
    namespace JSX {
        interface IntrinsicElements {
            "model-viewer": any
        }
    }
}

export default function Interactive3DViewer(props) {
    const {
        modelFile,
        backgroundColor,
        autoRotate,
        cameraControls,
        shadowIntensity,
        exposure,
        environmentImage,
    } = props

    const isStatic = useIsStaticRenderer()
    const shouldAutoRotate = !isStatic && autoRotate

    React.useEffect(() => {
        if (typeof document === "undefined") return

        const scriptId = "model-viewer-script"

        if (!document.getElementById(scriptId)) {
            const script = document.createElement("script")
            script.id = scriptId
            script.type = "module"
            script.src =
                "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
            document.head.appendChild(script)
        }
    }, [])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
            }}
        >
            {modelFile ? (
                <model-viewer
                    src={modelFile}
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                    {...(shouldAutoRotate ? { "auto-rotate": true } : {})}
                    {...(cameraControls ? { "camera-controls": true } : {})}
                    shadow-intensity={shadowIntensity}
                    exposure={exposure}
                    environment-image={environmentImage}
                    loading="eager"
                />
            ) : (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        color: "rgba(255,255,255,0.5)",
                    }}
                >
                    Add GLB or GLTF model
                </div>
            )}
        </div>
    )
}

Interactive3DViewer.defaultProps = {
    modelFile: "",
    backgroundColor: "#000000",
    autoRotate: true,
    cameraControls: true,
    shadowIntensity: 1,
    exposure: 1,
    environmentImage: "neutral",
}

addPropertyControls(Interactive3DViewer, {
    modelFile: {
        type: ControlType.File,
        title: "Model",
        allowedFileTypes: ["glb", "gltf"],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
    },
    cameraControls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },
    exposure: {
        type: ControlType.Number,
        title: "Exposure",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },
    environmentImage: {
        type: ControlType.Enum,
        title: "Environment",
        defaultValue: "neutral",
        options: ["neutral", "legacy"],
        optionTitles: ["Neutral", "Legacy"],
    },
})
