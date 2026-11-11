// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface AirpodCaseProps {
    scale: number
    caseColor: string
    lightColor: string
    lightGlow: boolean
    borderRadius: number
}

export default function AirpodCase({
    scale,
    caseColor,
    lightColor,
    lightGlow,
    borderRadius,
}: AirpodCaseProps) {
    return (
        <div
            style={{
                width: `${270 * scale}px`,
                height: `${220 * scale}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                className="card"
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#ffffff", // neutral base for shading
                    borderRadius: `${borderRadius * scale}px`,
                    boxShadow: `
                        inset 0px ${35 * scale}px ${25 * scale}px #ffffffe0,
                        inset ${10 * scale}px 0px ${25 * scale}px #0000004b,
                        inset ${40 * scale}px 0px ${20 * scale}px #ffffff,
                        inset ${-10 * scale}px 0px ${25 * scale}px #0000004b,
                        inset ${-40 * scale}px 0px ${20 * scale}px #fff,
                        inset 0px ${10 * scale}px ${10 * scale}px #000000e0,
                        inset 0px ${-15 * scale}px ${25 * scale}px #00000036,
                        ${10 * scale}px ${25 * scale}px ${40 * scale}px ${-10 * scale}px #00000060
                    `,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* COLOR OVERLAY — tints entire case but preserves shadows */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: caseColor,
                        mixBlendMode: "multiply",
                        opacity: 0.9,
                        pointerEvents: "none",
                        borderRadius: `${borderRadius * scale}px`,
                    }}
                />

                {/* Cavity */}
                <div
                    className="cavity"
                    style={{
                        width: `${150 * scale}px`,
                        height: `${20 * scale}px`,
                        background: "linear-gradient(180deg, #d6d6d6, #fff)",
                        borderRadius: `${200 * scale}px`,
                        margin: "auto",
                        position: "absolute",
                        top: "30%",
                        left: "50%",
                        transform: "translate(-50%, 30%)",
                        boxShadow: `inset 0px ${1 * scale}px ${2 * scale}px rgba(0,0,0,0.1)`,
                        zIndex: 2,
                    }}
                />

                {/* Line */}
                <div
                    className="line"
                    style={{
                        width: "100%",
                        height: `${2 * scale}px`,
                        backgroundColor: "#b4b2b2",
                        marginTop: "30%",
                        position: "relative",
                        zIndex: 2,
                    }}
                >
                    {/* Line left highlight */}
                    <div
                        style={{
                            position: "absolute",
                            width: "5%",
                            height: "100%",
                            backgroundColor: "#fff",
                            left: 0,
                        }}
                    />
                    {/* Line right highlight */}
                    <div
                        style={{
                            position: "absolute",
                            width: "5%",
                            height: "100%",
                            backgroundColor: "#fff",
                            right: 0,
                        }}
                    />
                </div>

                {/* LED Light */}
                <div
                    className="led"
                    style={{
                        width: `${7 * scale}px`,
                        height: `${7 * scale}px`,
                        backgroundColor: lightColor,
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, 30%)",
                        borderRadius: "100%",
                        boxShadow: lightGlow
                            ? `0 0 ${6 * scale}px ${lightColor}`
                            : "none",
                        zIndex: 3,
                    }}
                />
            </div>
        </div>
    )
}

// Framer Property Controls
addPropertyControls(AirpodCase, {
    scale: {
        type: ControlType.Number,
        title: "Scale",
        min: 0.5,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        displayStepper: true,
    },
    caseColor: {
        type: ControlType.Color,
        title: "Case Color",
        defaultValue: "#e8e9eb",
    },
    lightColor: {
        type: ControlType.Color,
        title: "Light Color",
        defaultValue: "#66f66f",
    },
    lightGlow: {
        type: ControlType.Boolean,
        title: "Light Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Roundness",
        min: 20,
        max: 120,
        step: 5,
        defaultValue: 70,
        displayStepper: true,
    },
})

AirpodCase.defaultProps = {
    scale: 1,
    caseColor: "#e8e9eb",
    lightColor: "#66f66f",
    lightGlow: true,
    borderRadius: 70,
}
