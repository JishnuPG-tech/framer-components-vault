import * as React from "react"
import { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// Importamos a biblioteca diretamente via URL (ESM)
import LiquidBackground from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js"

export default function LiquidCanvas(props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        // 1. Inicializa o LiquidBackground
        const app = LiquidBackground(canvas)

        // 2. Carrega a imagem e configurações das propriedades (Props)
        app.loadImage(props.imageUrl)
        app.liquidPlane.material.metalness = props.metalness
        app.liquidPlane.material.roughness = props.roughness
        app.liquidPlane.uniforms.displacementScale.value = props.displacement
        app.setRain(false)

        // 3. Lógica do Auto-Click (Ondas automáticas)
        let autoClickInterval
        let userMoved = false

        function autoClickCenter() {
            // Simula clique no centro do container
            const rect = canvas.getBoundingClientRect()
            const x = rect.width / 2
            const y = rect.height / 2

            // A biblioteca escuta eventos no canvas, então disparamos lá
            const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                clientX: rect.left + x, // Coordenada absoluta na tela
                clientY: rect.top + y,
            })
            canvas.dispatchEvent(event)
        }

        // Inicia o intervalo
        autoClickInterval = setInterval(() => {
            if (!userMoved) autoClickCenter()
        }, 1000)

        // 4. Parar animação automática ao mover o mouse
        const handleMouseMove = () => {
            userMoved = true
            clearInterval(autoClickInterval)
        }

        window.addEventListener("mousemove", handleMouseMove)

        // Cleanup: Limpeza ao desmontar o componente ou mudar propriedades
        return () => {
            clearInterval(autoClickInterval)
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [props.imageUrl, props.metalness, props.roughness, props.displacement])

    return (
        <div ref={containerRef} style={containerStyle}>
            {/* Canvas Líquido */}
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}

// Configurações Expostas no Framer
addPropertyControls(LiquidCanvas, {
    imageUrl: {
        type: ControlType.Image,
        title: "Imagem",
        defaultValue:
            "https://images.unsplash.com/photo-1644056368311-c8054df845d0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074",
    },
    displacement: {
        type: ControlType.Number,
        title: "Intensidade",
        defaultValue: 5,
        min: 0,
        max: 20,
        step: 0.1,
    },
    metalness: {
        type: ControlType.Number,
        title: "Metalness",
        defaultValue: 0.75,
        min: 0,
        max: 1,
        step: 0.05,
    },
    roughness: {
        type: ControlType.Number,
        title: "Roughness",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
    },
})

// Estilos
const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: "0px",
}
