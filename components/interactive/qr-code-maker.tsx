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

import { QRCodeSVG } from "qrcode.react"

type Props = {
    input: string
    size: number
    darkMode: boolean
    margin: number
    radius: number
}

export default function makeQRCode(props: Props) {
    const { input, size, darkMode, margin, radius } = props

    const defaultValue = "https://www.framer.com"
    const value = (input || "").trim() || defaultValue

    const fg = darkMode ? "#ffffff" : "#000000"
    const bg = darkMode ? "#000000" : "#ffffff"

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            {/* Background box */}
            <div
                style={{
                    position: "absolute",
                    width: size + margin * 2,
                    height: size + margin * 2,
                    backgroundColor: bg,
                    borderRadius: radius,
                    zIndex: 0, // make sure background stays behind
                }}
            />
            {/* QR code */}
            <QRCodeSVG
                value={value}
                size={size}
                fgColor={fg}
                bgColor="transparent"
                level="H"
                includeMargin={false}
                style={{ zIndex: 1 }} // ensure QR stays above
            />
        </div>
    )
}

makeQRCode.defaultProps = {
    input: "",
    size: 160,
    darkMode: false,
    margin: 8,
    radius: 8,
}

addPropertyControls(makeQRCode, {
    input: {
        type: ControlType.String,
        title: "Input",
        placeholder: "https://framer.com",
        defaultValue: "",
    },
    size: {
        type: ControlType.Number,
        title: "QR Size",
        min: 80,
        max: 512,
        step: 2,
        defaultValue: makeQRCode.defaultProps.size,
    },
    darkMode: {
        type: ControlType.Boolean,
        title: "Dark Mode",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: makeQRCode.defaultProps.darkMode,
    },
    margin: {
        type: ControlType.Number,
        title: "Margin",
        min: 0,
        max: 64,
        step: 2,
        defaultValue: makeQRCode.defaultProps.margin,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 64,
        step: 1,
        defaultValue: makeQRCode.defaultProps.radius,
    },
})
