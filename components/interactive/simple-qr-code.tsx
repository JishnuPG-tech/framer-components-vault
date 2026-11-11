// Simple QR code generator component
import { useState, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface QRCodeGeneratorProps {
    text: string
    size: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function QRCodeGenerator(props: QRCodeGeneratorProps) {
    const {
        text = "Hello World",
        size = 200
    } = props

    const backgroundColor = "#FFFFFF"
    const foregroundColor = "#000000"
    const errorCorrectionLevel = "M"

    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

    useEffect(() => {
        if (typeof window !== "undefined" && text) {
            const encodedText = encodeURIComponent(text)
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&ecc=${errorCorrectionLevel}&bgcolor=${backgroundColor.replace('#', '')}&color=${foregroundColor.replace('#', '')}`
            
            startTransition(() => {
                setQrCodeUrl(url)
            })
        }
    }, [text, size, backgroundColor, foregroundColor])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: backgroundColor,
                position: "relative"
            }}
        >
            {qrCodeUrl ? (
                <img
                    src={qrCodeUrl}
                    alt={`QR Code for: ${text}`}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain"
                    }}
                />
            ) : (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#F5F5F5",
                        color: "#CCCCCC",
                        fontSize: "14px",
                        fontFamily: "system-ui, -apple-system, sans-serif"
                    }}
                >
                    Loading QR Code...
                </div>
            )}
        </div>
    )
}

addPropertyControls(QRCodeGenerator, {
    text: {
        type: ControlType.String,
        title: "Text/URL",
        defaultValue: "Hello World",
        displayTextArea: true
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 200,
        min: 100,
        max: 1000,
        step: 50,
        unit: "px"
    }
})