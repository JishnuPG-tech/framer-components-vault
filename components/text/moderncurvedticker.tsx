// Curved ticker with text and icons following an arc path
import { useEffect, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ModernCurvedTickerProps {
    text: string
    icon: string
    backgroundColor: string
    textColor: string
    radius: number
    arcHeight: number
    textFont: any
    speed: number
    showIcon: boolean
    iconSize: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ModernCurvedTicker(props: ModernCurvedTickerProps) {
    const {
        text = "Framer Hub 😎 Curved Text",
        icon = "😎",
        backgroundColor = "#0033CC",
        textColor = "#FFFFFF",
        radius = 500,
        arcHeight = 150,
        textFont,
        speed = 1,
        showIcon = true,
        iconSize = 80,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [offset, setOffset] = useState(0)
    const animationFrameRef = useRef<number>()
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr

        ctx.scale(dpr, dpr)

        // Match the exact arc from the image
        const centerX = rect.width / 2
        const arcRadius = radius
        const centerY = rect.height + arcRadius - arcHeight
        const thickness = 100

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height)

        // Draw the curved banner background
        ctx.beginPath()
        ctx.arc(centerX, centerY, arcRadius, Math.PI, 0, false)
        ctx.arc(centerX, centerY, arcRadius - thickness, 0, Math.PI, true)
        ctx.closePath()
        ctx.fillStyle = backgroundColor
        ctx.fill()

        // Setup text rendering
        const fontSize = textFont?.fontSize ? parseInt(textFont.fontSize) : 60
        const fontWeight = textFont?.fontWeight || "700"
        const fontFamily = textFont?.fontFamily || "Inter, sans-serif"
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
        ctx.fillStyle = textColor
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Create repeating text with icon
        const fullText = showIcon ? `${text} ${icon} ` : `${text} `
        const textRadius = arcRadius - thickness / 2
        
        // Calculate total arc length and character spacing
        const availableArc = Math.PI // Full semicircle
        const charAngleStep = 0.08 // Fixed angle step for consistent spacing
        
        // Calculate how many times to repeat the text to fill the arc
        const charsNeeded = Math.ceil(availableArc / charAngleStep) + 10
        const repeatedText = fullText.repeat(Math.ceil(charsNeeded / fullText.length))
        
        // Start angle with offset for animation
        let currentAngle = Math.PI + (offset * 0.001 * speed)

        // Draw characters along the arc
        for (let i = 0; i < repeatedText.length; i++) {
            const char = repeatedText[i]
            
            // Wrap angle to stay within the arc
            let wrappedAngle = currentAngle % (Math.PI * 2)
            if (wrappedAngle < Math.PI) wrappedAngle += Math.PI * 2
            if (wrappedAngle > Math.PI * 2) wrappedAngle -= Math.PI * 2
            
            // Only draw if within visible arc
            if (wrappedAngle >= Math.PI && wrappedAngle <= Math.PI * 2) {
                const x = centerX + textRadius * Math.cos(wrappedAngle)
                const y = centerY + textRadius * Math.sin(wrappedAngle)

                ctx.save()
                ctx.translate(x, y)
                ctx.rotate(wrappedAngle + Math.PI / 2)
                
                // Use larger font for emoji
                if (char === icon && showIcon) {
                    ctx.font = `${iconSize}px Arial`
                    ctx.fillText(char, 0, 0)
                    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
                } else {
                    ctx.fillText(char, 0, 0)
                }
                
                ctx.restore()
            }

            currentAngle += charAngleStep
            
            // Break if we've gone past the visible arc
            if (currentAngle > Math.PI * 3) break
        }
    }, [text, icon, backgroundColor, textColor, radius, arcHeight, textFont, offset, showIcon, iconSize, speed])

    useEffect(() => {
        // Don't animate in canvas/thumbnail, but DO animate in preview
        if (isStatic || speed === 0) return

        const animate = () => {
            startTransition(() => {
                setOffset((prev) => prev + 1)
            })
            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [speed, isStatic])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

addPropertyControls(ModernCurvedTicker, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Framer Hub 😎 Curved Text",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    icon: {
        type: ControlType.String,
        title: "Icon",
        defaultValue: "😎",
        hidden: ({ showIcon }) => !showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 80,
        min: 20,
        max: 120,
        step: 5,
        hidden: ({ showIcon }) => !showIcon,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0033CC",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    textFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "60px",
            variant: "Bold",
        },
    },
    radius: {
        type: ControlType.Number,
        title: "Curve Radius",
        defaultValue: 600,
        min: 400,
        max: 1500,
        step: 50,
    },
    arcHeight: {
        type: ControlType.Number,
        title: "Arc Height",
        defaultValue: 200,
        min: 100,
        max: 400,
        step: 10,
    },
    speed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },
})